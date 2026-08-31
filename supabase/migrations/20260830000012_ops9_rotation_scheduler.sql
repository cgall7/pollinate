-- OPS-9 (Bumble, row 1.8, POLLINATE_COMB_ROTATION.md §8.6/§8.7). "The tick
-- advances state; it cannot seal -- it calls ENG-91." Depends on 1.1
-- (ENG-58, combs/comb_rotations schema) and 1.8a (ENG-91,
-- seal_and_send_rotation) -- both merged, github/main@8864a12.
--
-- FINISHED (Bumble, thread b57ad406, 2026-08-30): the second block below
-- now calls comb_advance_rotation(r.comb_id). Vector's finding still
-- stands as the reason it was needed -- the row was genuinely PARTIAL on
-- main at 5d4a2ff, and the header below is left as the record of why,
-- not edited into a retroactive "always worked this way."
--
-- RESOLVER HALF, ORIGINALLY -- Vector's §1B.31/§1B.31.1 (thread f2c15b7d,
-- 2026-08-30, committed 1ff0644 then e319f3e on
-- vector/comb-rotation-strategy): advance_due_rotations() below ends a
-- rotation that has closed; it did not open the comb's next one. Row 1.8
-- was PARTIAL, not done, until the tick also called row 1.9a --
-- comb_advance_rotation(p_comb_id), Fizz's policy wrapper carved out of
-- ENG-60: computes the next subject (comb_members by joined_at, wrapping,
-- skipping removed_at/tombstoned seats and skipping NOBODY else -- a
-- quiet month costs the comb a month, never a person their turn) and the
-- next closes_at (= this rotation's closes_at + combs.cadence, never
-- now() + cadence, with a floor on the derived path: a minted window
-- must be at least half a cadence or it jumps to the next boundary, so a
-- long outage can't mint a window nobody could realistically write in),
-- then mints through ENG-93's comb_open_rotation(). Deps for this row:
-- 1.1, 1.8a, 1.9a -- NOT 1.7a directly; §1B.31's first cut put it there
-- and would have made 1.8 -> 1.9 -> 1.8 a cycle, corrected in §1B.31.1
-- once 1.9a existed as the intermediate policy layer.
--
-- Ruled to merge as-is rather than wait: the resolver half below is
-- independently correct and blocks nothing, and comb_advance_rotation
-- doesn't exist on main yet -- calling an unbuilt function would be
-- worse than an honest gap. Whoever finishes this row adds
-- `perform public.comb_advance_rotation(v_comb_id)` after each successful
-- resolution, comb_id read off the resolved comb_rotations row --
-- BUT NOT inside the same `begin ... exception ... end` block as the
-- `perform public.seal_and_send_rotation(r.id)` call below. §1B.31.2
-- (thread f2c15b7d, Vector, 2026-08-30, commit 806a33c): a `begin ...
-- exception ... end` in PL/pgSQL is a subtransaction, so a raising
-- advance inside the SAME block rolls back the seal that already
-- committed logically-but-not-yet-durably in that block -- sealed_at
-- and sent_at go back to null, the warning is swallowed, and the next
-- sweep re-picks the rotation, finds nothing to skip (the seal was
-- undone), and fails the same way every five minutes forever. Probed
-- 4/4 against a live Postgres: one block for seal-plus-advance loses
-- the delivery on a raising advance; two separate blocks (seal
-- commits, then a second `begin ... exception ... end` around the
-- advance call) let the seal survive regardless of what the advance
-- does. The seal must be its own subtransaction; the advance is a
-- second, independent one that can fail without undoing it.
--
-- NEW REQUIREMENT (Vector, thread b57ad406, 2026-08-30, §1B.36.12): the
-- second block's `raise warning` must interpolate `sqlerrm`, matching the
-- seal block's own format string below (`raise warning
-- 'advance_due_rotations: rotation % failed: %', r.id, sqlerrm;`). A
-- caught exception's SQLSTATE stays on the exception object; SQLERRM
-- carries the message and nothing else, so the message string is the
-- only thing that survives into this log line. check-ops9-rotation-
-- scheduler.mjs's floor-violation assertion (row 3) keys on that message
-- text via its `client.on('notice', ...)` capture -- there is no other
-- channel from a caught exception to the tick's log. A finisher who
-- writes `raise warning 'advance for comb % failed', v_comb_id;` without
-- sqlerrm silently strips the only thing that assertion can key on, and
-- the gate goes from proving the floor held to proving nothing.
--
-- STALE, CORRECTED (Vector, thread b57ad406, 2026-08-30, §1B.36.11): this
-- block originally said dormancy was "no eligible subject (every member
-- removed_at-closed or tombstoned)" -- zero ENROLLABLE members, in
-- §1B.36.10's later term (removed_at is null AND profiles.deleted_at is
-- null). §1B.31.3 (posted the same evening, after this file's first
-- draft) raised the floor to TWO enrollable members, not zero -- a comb
-- needs two people to be a comb. The skip list above was already
-- correct (it named the right population before the term existed); only
-- the threshold was wrong.
--
-- Per §1B.31.2 + §1B.31.3: a comb_advance_rotation call that finds FEWER
-- THAN TWO enrollable members is DORMANCY, not an error -- it returns
-- without minting and raises nothing. That is Fizz's function's contract
-- to honor, not this file's to work around, but it matters here too: if
-- comb_advance_rotation ever raised for the dormant case (including the
-- one-enrollable-member case ENG-100 makes reachable), the loop below
-- would log a warning per sweep, forever, for a comb that isn't actually
-- broken.
--
-- This job owns the CLOCK (when the sweep runs); it has never owned the
-- POLICY (who's next, how long a month is) -- Sage drew that boundary
-- two migrations earlier (20260830000002:459-466: "This ticket provides
-- the mechanism ... ENG-60 ... owns the policy of how those values get
-- chosen and how a rotation auto-advances") and this file agreed with it
-- from the first draft. §1B.31 briefly argued the routing was wrong and
-- §1B.31.1 retracted that after re-reading Sage's comment -- recorded
-- here, not just in the thread, so the retraction doesn't get lost
-- between the two ruling messages the next reader of this file might
-- only see one of.
--
-- Scope of what's actually built here, deliberately narrow within that
-- gap: this migration finds rotations whose window has closed and calls
-- the one function ENG-91 built for exactly this caller. It invents no
-- new seal/send/void logic -- all of that lives in
-- seal_and_send_rotation() (20260830000003), including its own row lock,
-- idempotency check, and three-way deliver/void classification. Duplicating
-- any of that here would create the two-source-of-truth failure this
-- schema's own conventions (private_hives/hive_volumes vs. comb_rotations'
-- mirror columns) exist to avoid.
--
-- pg_cron on Supabase-managed Postgres ships pg_cron preloaded at the
-- infra level (shared_preload_libraries is already set; no server restart
-- needed for `create extension` to take effect) -- documented Supabase
-- behavior, not something this migration or its gates can verify from a
-- git checkout. Flagged in the PR rather than asserted as tested, because
-- it isn't: nothing in this repo's toolchain can start a real background
-- worker to prove a schedule actually fires.
--
-- The embedded-postgres instance every `check-*.mjs` gate runs against is a
-- vanilla local build with no pg_cron shared library available at all --
-- confirmed empirically (`select * from pg_available_extensions where name
-- = 'pg_cron'` returns zero rows there). Every migration in this directory
-- gets replayed against that instance by four gates that enumerate the
-- directory dynamically (check-migration-sentinels, check-share-visibility,
-- check-comb-rotation-seal-send, prod-schema-check), so an unconditional
-- `create extension pg_cron` would break all four, unrelated to anything
-- this migration actually changes. Both DDL blocks below are guarded on
-- "does this Postgres have the extension available at all" -- on
-- Supabase (real pg_cron always available) the guard's branch always
-- fires, so production behavior is unconditional; only a build that
-- genuinely lacks the extension no-ops, and it no-ops loudly enough to
-- find (`check-ops9-rotation-scheduler.mjs` below asserts the guard's
-- shape and the function's own logic directly, since it cannot exercise
-- the schedule itself).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    execute 'create extension if not exists pg_cron';
  end if;
end $$;

-- The batch function. SECURITY DEFINER so its EXECUTE grant (below) is
-- what gates who can trigger a sweep, same posture as every other definer
-- helper in this schema -- not load-bearing against pg_cron's own
-- execution role specifically (Supabase's pg_cron runs scheduled jobs as
-- the role that called cron.schedule, which for a migration is the
-- superuser the deploy pipeline connects as, and a superuser bypasses
-- every GRANT check regardless of what this function declares) but
-- correct and auditable if that execution role is ever narrowed later,
-- and consistent with how seal_and_send_rotation itself is gated.
--
-- One rotation at a time, each in its own subtransaction: a single
-- rotation raising an unexpected error must not roll back every other
-- rotation this same tick already advanced, and must not go silent either
-- -- `raise warning` surfaces in Supabase's log explorer, which is the
-- only observability this ticket has budget for. seal_and_send_rotation's
-- own `for update` row lock is what protects against two overlapping
-- ticks racing the same rotation; this function does not need a second
-- lock on top of it.
create function public.advance_due_rotations()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
  v_sealed boolean;
begin
  for r in
    select id, comb_id
    from public.comb_rotations
    where closes_at <= now()
      and sealed_at is null
      and voided_at is null
    order by closes_at
  loop
    v_sealed := false;
    begin
      perform public.seal_and_send_rotation(r.id);
      v_sealed := true;
    exception when others then
      raise warning 'advance_due_rotations: rotation % failed: %', r.id, sqlerrm;
    end;

    -- Second, INDEPENDENT subtransaction -- never merged with the seal block
    -- above. Per §1B.31.2 (thread f2c15b7d, commit 806a33c): a `begin ...
    -- exception ... end` in PL/pgSQL is a subtransaction, so a raising
    -- advance inside the SAME block as the seal would roll the seal back --
    -- sealed_at/sent_at go back to null, the warning is swallowed, and the
    -- next sweep re-picks the rotation and fails the same way forever. Only
    -- attempted after a successful seal ("after each successful
    -- resolution" per this file's own header) -- a rotation whose seal
    -- itself failed is still open, so calling the advance on it would just
    -- re-raise the "one open per comb" constraint (23505) as a second,
    -- redundant warning for the same underlying failure.
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

-- Same named-anon-revoke requirement as every definer helper in this
-- schema (20260813000005's own comment: `alter default privileges ...
-- grant all on functions to anon` reaches every function created in
-- public from birth until revoked by name; a bare `revoke all from
-- public` does not reach anon's separate default-privilege grant).
-- Granted to service_role for the same reason seal_and_send_rotation is:
-- documents the intended caller even though the actual pg_cron execution
-- role bypasses it (see the function comment above).
revoke all on function public.advance_due_rotations() from public;
revoke execute on function public.advance_due_rotations() from anon;
revoke execute on function public.advance_due_rotations() from authenticated;
grant execute on function public.advance_due_rotations() to service_role;

-- Five minutes: this is the SWEEP INTERVAL (how often the tick polls),
-- not the rotation CADENCE (how long a month is, §1B.31's ruling 2,
-- stored on combs once 1.9a ships it) -- distinct constants at different
-- layers, worth naming explicitly now that "cadence" has a specific
-- meaning in this schema. No sweep-interval number is ruled anywhere in
-- POLLINATE_COMB_ROTATION.md -- this job owns picking it (the clock,
-- not the policy; see the header note above). Tight enough that a
-- reveal doesn't feel arbitrarily delayed once closes_at passes, loose
-- enough not to poll an almost-always-empty table needlessly.
-- Re-tunable without a schema change -- unschedule and reschedule under
-- the same job name in a later migration if the number is wrong.
--
-- Unschedule-then-schedule under a fixed job name makes this migration
-- replay-safe: pg_cron's own idempotency story varies by version (some
-- support `cron.schedule` overwriting a same-named job outright; the
-- unschedule-by-jobid form below is the one signature every pg_cron
-- version since 1.0 supports, so it doesn't assume a version this repo
-- has never pinned).
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'comb-rotation-tick';
    perform cron.schedule(
      'comb-rotation-tick',
      '*/5 * * * *',
      $sql$select public.advance_due_rotations()$sql$
    );
  end if;
end $$;
