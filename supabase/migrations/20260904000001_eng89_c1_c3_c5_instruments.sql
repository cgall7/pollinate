-- ENG-89 (Fizz, POLLINATE_COMB_ROTATION.md §6). Instruments C1, C3 and C5 —
-- three of the five conditions that are real aggregate queries over
-- already-persisted tables rather than a single event to fire. C2 is
-- ENG-78's (exists already, a separate ticket). C4 is the one condition
-- with no real data source (ENG-85 ships its plan limits NULL, so nothing
-- ever enforces a cap to count) — that one IS a client-side
-- Analytics.track() shadow event, see CombInviteStore.js/CombStore.js in
-- this same PR.
--
-- C5 belongs here, not with C4, despite both reading as "an event a client
-- fires": ENG-90's send_comb_nectar_note already writes one durable,
-- server-timestamped row per send to comb_nectar_notes, permanently and
-- before this migration ever existed. A client Analytics.track() call on
-- top of that would be strictly weaker instrumentation (drops on a client
-- crash, no active-member denominator, and — unlike C1/C3/C5 here — depends
-- on ENG-75's SDK shipping at all) for data the database has already
-- durably recorded. §6's own header ("there is no analytics SDK in the
-- build") is the reason C4 has to be a shadow event; it is not a reason to
-- make C5 one too when C5 has a real table to query.
--
-- All three functions here are SECURITY DEFINER, service_role-only: this is
-- internal reporting for whoever runs the MVP-Comb business review, not a
-- client-facing screen, so there is no RLS-shaped authorization question to
-- answer — same posture as advance_due_rotations() (20260830000012).
--
-- =============================================================================
-- C1 — rotation participation. §6's current text, after every amendment
-- (§1B.23.2 denominator-is-who-could-write, §1B.26.3 mid-window deletion,
-- §1B.36.7/.8 the departure-vs-deletion predicate): numerator is the count
-- of distinct people who actually wrote for that rotation; denominator is
-- the rotation's hive_contributors MINUS only the ones excluded by account
-- deletion — a comb departure (ENG-99, hive_contributors.removed_at set,
-- profiles.deleted_at left null) stays in the denominator, an account
-- deletion (ENG-84, both stamped in the same transaction) does not.
--
-- The ruled predicate is an EQUALITY, not `deleted_at is not null`:
-- `hive_contributors.removed_at = profiles.deleted_at`. Both columns are
-- frozen at stamp time by their own immutability triggers
-- (comb_members_removed_at_immutable's hive_contributors analogue,
-- 20260827000001; ENG-84's tombstone is one-way), so equality classifies by
-- the transaction that closed the seat and is invariant under every write
-- that lands after — including a writer who quits the comb (removed_at set,
-- deleted_at still null) and deletes their account weeks later (deleted_at
-- set to a LATER timestamp): removed_at <> deleted_at, so they correctly
-- stay in the denominator instead of vanishing from it while their sealed
-- letter still sits in the numerator (the bare `is not null` reading Vector
-- ruled out, §1B.36.8 — it produces a >100% rotation and erases the quit).
--
-- The equality check below is written `removed_at is not null and
-- deleted_at is not null and removed_at = deleted_at`, not the bare
-- `removed_at = deleted_at` the ruling's prose suggests — SQL's three-
-- valued logic makes those different functions. An ordinary comb departure
-- has `deleted_at is null`, so a bare `removed_at = deleted_at` compares a
-- timestamp to NULL, which evaluates to NULL rather than false, and `not
-- (null)` is still NULL, not true — so a bare-equality WHERE clause would
-- silently drop every ordinary departure from the denominator, the exact
-- failure this predicate exists to prevent. Caught by this migration's own
-- gate (check-eng89-instruments.mjs), not by inspection.
--
-- comb_rotation_writer_count() (20260830000007) is deliberately NOT reused
-- here — its own header says why: it is the correct roster-SIZE count for
-- the member/organizer card (bare `removed_at is null`, current seats),
-- and its own ADDENDUM says it stopped being C1's denominator the moment
-- ENG-99 gave ordinary departure the same on-disk shape as deletion. This
-- function is C1's actual instrument; that one stays the client-facing
-- roster count.
--
-- Returns no row for an unresolved rotation — an in-progress month's
-- participation is not a number yet, and a caller receiving 0 rows is a
-- much louder signal than a caller receiving a wrong one for a month that
-- hasn't closed.
create function public.comb_rotation_participation(p_rotation_id uuid)
returns table (numerator integer, denominator integer)
language sql
security definer
stable
set search_path = public
as $$
  select
    (
      select count(distinct e.user_id)::integer
      from public.entries e
      where e.hive_id = r.hive_id
    ) as numerator,
    (
      select count(*)::integer
      from public.hive_contributors c
      left join public.profiles p on p.id = c.profile_id
      where c.hive_id = r.hive_id
        and not (c.removed_at is not null and p.deleted_at is not null and c.removed_at = p.deleted_at)
    ) as denominator
  from public.comb_rotations r
  where r.id = p_rotation_id
    and (r.sealed_at is not null or r.voided_at is not null);
$$;

revoke all on function public.comb_rotation_participation(uuid) from public;
revoke execute on function public.comb_rotation_participation(uuid) from anon;
revoke execute on function public.comb_rotation_participation(uuid) from authenticated;
grant execute on function public.comb_rotation_participation(uuid) to service_role;

-- C1's own acceptance bar is not "one good month," it's "≥60%, SUSTAINED 3
-- months" (§6). A comb's most recent three RESOLVED rotations (sealed or
-- voided — a voided rotation is a real, zero-numerator data point, not a
-- gap to skip past) each have to clear the bar; fewer than three resolved
-- rotations on record means the bar is not yet measurable, and this
-- returns false rather than judging a comb on an incomplete history.
-- Zero-denominator months (a rotation whose hive_contributors were wiped
-- by the mid-rotation-joiner path leaving nobody eligible) fail rather
-- than divide by zero or count as vacuously passing.
create function public.comb_c1_sustained(p_comb_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_qualifying integer;
begin
  select count(*) into v_qualifying
  from (
    select pp.numerator, pp.denominator
    from public.comb_rotations r
    cross join lateral public.comb_rotation_participation(r.id) pp
    where r.comb_id = p_comb_id
      and (r.sealed_at is not null or r.voided_at is not null)
    order by r.ordinal desc
    limit 3
  ) recent
  where recent.denominator > 0
    and recent.numerator::numeric / recent.denominator >= 0.6;

  return v_qualifying = 3;
end;
$$;

revoke all on function public.comb_c1_sustained(uuid) from public;
revoke execute on function public.comb_c1_sustained(uuid) from anon;
revoke execute on function public.comb_c1_sustained(uuid) from authenticated;
grant execute on function public.comb_c1_sustained(uuid) to service_role;

-- =============================================================================
-- C3 — comb survival: "seeded combs still rotating at month 6," ≥50% (§6).
-- "Still rotating" is a weaker claim than C1's — a comb that voided-quiet
-- twice but kept advancing has survived; a comb C1 would flag as unhealthy
-- can still be a C3 success. Survival is therefore "did this comb ever
-- reach ordinal 6," not "did every month between 1 and 6 deliver."
--
-- No verdict is computed here — this table is the raw material; whoever
-- runs the review takes `avg(reached_month_6::int) where eligible` over it.
-- Same shape as comb_rotation_writer_count and friends: this codebase's
-- convention is instruments return numbers/facts, not pre-judged pass/fail,
-- except where §6 itself names a single boolean (comb_c1_sustained above,
-- because "sustained" is a fact about a specific comb's last three months,
-- not a cohort-wide rate that has to be aggregated by someone first).
--
-- Eligibility is age-based, not row-count-based: a comb becomes eligible
-- for the month-6 question once 6 cadences have elapsed since it was
-- created, whether or not it actually produced 6 rotation rows (a comb
-- that died at month 2 is exactly the failure this instrument exists to
-- count, not a comb to exclude from the denominator for having too few
-- rows).
create function public.comb_c3_survival_report()
returns table (comb_id uuid, eligible boolean, reached_month_6 boolean)
language sql
security definer
stable
set search_path = public
as $$
  select
    c.id,
    (now() >= c.created_at + 6 * c.cadence) as eligible,
    exists (
      select 1 from public.comb_rotations r
      where r.comb_id = c.id and r.ordinal >= 6
    ) as reached_month_6
  from public.combs c;
$$;

revoke all on function public.comb_c3_survival_report() from public;
revoke execute on function public.comb_c3_survival_report() from anon;
revoke execute on function public.comb_c3_survival_report() from authenticated;
grant execute on function public.comb_c3_survival_report() to service_role;

-- =============================================================================
-- C5 — "note + nectar frequency: short notes sent per active member per
-- week" (§5.2a, §6). Raw material only, same convention as C3 above: this
-- returns the three facts the rate is built from per comb — total notes
-- ever sent in it, its current active membership, and its age in weeks —
-- and leaves `note_count / (active_member_count * weeks_active)` to whoever
-- runs the review. `active_member_count` can never reach 0 while the comb
-- exists (`comb_members_owner_seat_permanent` forbids removing the
-- organizer's own seat, 20260830000002) — 1 is the true floor — but
-- `weeks_active` can be near 0 for a comb minted seconds ago, which has no
-- sensible single rate yet, and this function does not get to decide that
-- for the caller.
--
-- `weeks_active` floors at 0 via `greatest(...)` only to rule out a
-- negative age; it is not rounded or clamped upward, so a comb three days
-- old reads as a fraction of a week rather than as a full one — this
-- undercounts, and undercounting rate looks like a low C5 rather than a
-- flattering one for a comb that has barely had time to speak.
--
-- Lifetime totals, not a trailing window: C5 is described as "establish a
-- baseline," and a comb's whole history is the more stable baseline until
-- there is enough data to justify windowing it.
create function public.comb_c5_note_frequency()
returns table (comb_id uuid, note_count integer, active_member_count integer, weeks_active numeric)
language sql
security definer
stable
set search_path = public
as $$
  select
    c.id,
    (
      select count(*)::integer
      from public.comb_nectar_notes n
      where n.comb_id = c.id
    ) as note_count,
    (
      select count(*)::integer
      from public.comb_members m
      where m.comb_id = c.id and m.removed_at is null
    ) as active_member_count,
    greatest(extract(epoch from (now() - c.created_at)) / 604800.0, 0)::numeric as weeks_active
  from public.combs c;
$$;

revoke all on function public.comb_c5_note_frequency() from public;
revoke execute on function public.comb_c5_note_frequency() from anon;
revoke execute on function public.comb_c5_note_frequency() from authenticated;
grant execute on function public.comb_c5_note_frequency() to service_role;

notify pgrst, 'reload schema';
