-- Terminal exit for advance_due_rotations() (docs/strategy/
-- POLLINATE_COMB_ROTATION.md, scheduler tick, 20260830000012). Filed
-- against Vector's finding (UX Design thread, 2026-09-04, verified against
-- github/main@b5d9213): a rotation whose seal fails INSIDE its own
-- begin...exception...end subtransaction rolls back cleanly, so
-- comb_rotations is left exactly as it was before the attempt --
-- sealed_at/voided_at still null. The tick's own WHERE clause
-- (closes_at <= now() and sealed_at is null and voided_at is null) then
-- re-matches that same row on every subsequent sweep, forever, logged only
-- as a Postgres WARNING nothing reads.
--
-- The finding surfaced through the typed-label arm's null-subject crash
-- (withdrawn for MVP-Comb the same session, ruling event `be52be25...` --
-- p_subject_profile_id stays required/non-null, so that SPECIFIC failure
-- can no longer happen). This ticket is not a fix for that arm -- it's the
-- general case Lumen's ruling asked for: "any permanently-failing seal --
-- not just this one, the next failure class nobody has imagined yet --
-- needs the loop itself to have an exit."
--
-- Lumen's ruling, restated because it shapes the mechanism: a standalone
-- null-guard at the hive_send_events insert was REFUSED. Under the
-- restored non-null contract a null subject at seal is corruption, not a
-- state, and a guard that silently seals-without-send would convert a
-- contract violation into a wrong outcome with no witness -- the crash is
-- the correct fails-closed behavior. So this migration does not change
-- seal_and_send_rotation() at all, and does not make ANY failing seal
-- succeed, quietly or otherwise. It only stops the TICK from re-attempting
-- the same permanently-broken row forever, and makes that stop loud rather
-- than silent.
--
-- Mechanism: an attempt counter plus a dead-letter timestamp, both on
-- comb_rotations (same "the database is where the next reader will look"
-- posture as voided_reason, added by ENG-91 for the same reason). A
-- dead-lettered rotation is deliberately left UNRESOLVED -- sealed_at,
-- voided_at, voided_reason all stay null. It is not a fourth voided_reason
-- value: voided_reason enumerates why a rotation legitimately delivered
-- nothing (quiet/departed/subject_gone); a dead letter is not a legitimate
-- outcome at all, it's a stuck row waiting on a human, and
-- comb_rotations_one_open_per_comb correctly keeps counting it as "open"
-- so the comb cannot silently mint a replacement out from under a row that
-- was never actually resolved. That's the fails-closed shape carried one
-- layer further: this schema still has no admin surface to clear a
-- dead-letter and re-open the comb (out of scope here, flagged for
-- whoever builds one).
--
-- Cap chosen at 5 consecutive failed attempts (~25 minutes at the tick's
-- own 5-minute sweep interval, 20260830000012's constant) -- long enough
-- that an ordinary transient blip (a mid-deploy migration window, a brief
-- connection-pool exhaustion) self-heals on a later sweep without ever
-- reaching the cap, short enough that a genuinely broken row doesn't spam
-- the log for hours before anyone notices. Not a ruled number anywhere in
-- POLLINATE_COMB_ROTATION.md -- this migration owns picking it, same
-- posture 20260830000012 took for its own sweep-interval constant, and
-- for the same reason (this job owns the clock, not the policy).
alter table public.comb_rotations
  add column seal_attempts int not null default 0,
  add column seal_dead_lettered_at timestamptz;

alter table public.comb_rotations
  add constraint comb_rotations_dead_letter_shape
    check (seal_dead_lettered_at is null or seal_attempts >= 5);

comment on column public.comb_rotations.seal_attempts is
  'How many times advance_due_rotations() has caught an exception out of '
  'seal_and_send_rotation() for this row. Reset never happens -- a '
  'rotation that eventually succeeds simply stops matching the tick''s '
  'WHERE clause (sealed_at is no longer null), so there is nothing left '
  'to increment.';

comment on column public.comb_rotations.seal_dead_lettered_at is
  'Set once seal_attempts reaches the tick''s cap (5, 20260904000001).  '
  'A dead-lettered rotation is deliberately left UNRESOLVED -- not a '
  'voided_reason, not a silent success -- so it keeps blocking a new '
  'rotation from opening on this comb (comb_rotations_one_open_per_comb) '
  'until a human clears it. The tick''s own WHERE clause excludes it from '
  'every future sweep so the failure stops re-arming, but the failure '
  'itself is never resolved by this column -- only silenced from the log.';

-- Same function, same signature, same grant posture -- only the WHERE
-- clause and the seal-failure branch change. The advance-half (the second,
-- independent begin...exception...end block calling
-- comb_advance_rotation) is untouched: dead-lettering only ever applies to
-- a SEAL failure, and that block already only runs after a seal succeeds.
create or replace function public.advance_due_rotations()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
  v_sealed boolean;
  v_attempts int;
begin
  for r in
    select id, comb_id, seal_attempts
    from public.comb_rotations
    where closes_at <= now()
      and sealed_at is null
      and voided_at is null
      and seal_dead_lettered_at is null
    order by closes_at
  loop
    v_sealed := false;
    begin
      perform public.seal_and_send_rotation(r.id);
      v_sealed := true;
    exception when others then
      v_attempts := r.seal_attempts + 1;
      if v_attempts >= 5 then
        update public.comb_rotations
          set seal_attempts = v_attempts,
              seal_dead_lettered_at = now()
          where id = r.id;
        -- Distinguishable from the ordinary retry warning below by the
        -- literal "dead-lettered" -- a future Sentry log-drain (ENG-74,
        -- still unbuilt) can key off that word without parsing SQLSTATE
        -- out of a raw log line. sqlerrm still interpolated, matching
        -- 20260830000012's own requirement (§1B.36.12) that every warning
        -- from this function carry the underlying error text, not just a
        -- generic label.
        raise warning 'advance_due_rotations: rotation % dead-lettered after % attempts: %', r.id, v_attempts, sqlerrm;
      else
        update public.comb_rotations
          set seal_attempts = v_attempts
          where id = r.id;
        raise warning 'advance_due_rotations: rotation % failed: %', r.id, sqlerrm;
      end if;
    end;

    if v_sealed then
      begin
        perform public.comb_advance_rotation(r.comb_id);
      exception when others then
        raise warning 'advance_due_rotations: advance for comb % failed: %', r.comb_id, sqlerrm;
      end;
    end if;
  end loop;
end;
$$;
