-- ENG-93 (Fizz, row 1.7a, docs/strategy/POLLINATE_COMB_ROTATION.md §1B.29/
-- §1B.30). The mint: `comb_open_rotation(p_comb_id, p_subject_profile_id,
-- p_closes_at)`, the one body §1B.29.2(c) requires for both month 1 (an
-- organizer tapping "who is this month for?") and month N+1 (OPS-9's
-- clock-driven advance, no session at all) -- "two mints is the bug class
-- that has bitten us four times tonight... every future rotation invariant
-- has to be written twice" is the reasoning §1B.29 gives for refusing a
-- second insert path, and it's the same reasoning `seal_and_send_rotation`
-- (ENG-91) already stands on.
--
-- Three legs, per Lumen's design pin (thread b57ad406, ratifying §1B.29.2):
-- `comb_rotations_insert_owner`'s WITH CHECK verified (a) caller owns the
-- comb, (b) subject is an active comb member, (c) the three rows agree
-- (hive is the owner's, is_collective, subject matches). A SECURITY
-- DEFINER mint bypasses all three, so each leg has to be re-decided, not
-- silently inherited:
--
--   (a) moves INSIDE this function's body -- `combs.owner_id = auth.uid()`,
--       or the caller is `service_role` (OPS-9's future clock).
--   (b) MUST NOT migrate. §1B.30's verified probe: the clause it replaces
--       is the pay-to-be-celebrated shape §11 already rejected, and it was
--       never the enforcement on this path to begin with (`ENG-58`'s own
--       migration: "a definer insert bypasses this policy too"). Gated
--       below: mint for a subject who is not a comb member, assert
--       success.
--   (c) holds by construction -- this function mints the `private_hives`
--       row itself (`is_collective`, `subject_profile_id` set at insert),
--       so there is no second row for it to disagree with.
--
-- Row 2 (§1B.24.1(c) / §1B.30.1, Lumen's rider): the tombstoned-subject
-- refusal lands here, not on the policy `ENG-92` removes and not as
-- improvised client copy -- a distinct, named exception the client
-- classifies same as `comb_join_by_invite_code`'s "previously removed"
-- case, never a generic constraint violation.
--
-- `combs.cadence`: Vector's finding (thread b57ad406) -- no rotation
-- cadence/duration default is ruled anywhere, and `closes_at + cadence`
-- (the clock rule, §1B.31 ratified) needs the number stored ONCE rather
-- than hard-coded in this function and `OPS-9`/`ENG-60`'s future advance --
-- "two hard-coded copies in two callers is the drift class this team
-- keeps burying." Added here, default one month, applies at comb
-- creation via the column default -- no write inside this function, the
-- table already carries it.
--
-- What does NOT need to move, per §1B.29.2's own accounting: the subject/
-- contributor disjointness triggers (`private_hives_subject_not_active_
-- contributor_trigger`, `hive_contributors_not_hive_subject_trigger`,
-- 20260830000002 Part 0) fire regardless of privilege, and Volume 1 opens
-- for free off `private_hives_create_volume_one_trigger` (20260826000003)
-- -- a definer-minted hive gets both without this function doing anything
-- extra.
--
-- Roster snapshot: "the month's hive_contributors was snapshotted at
-- mint" (§1B.21, describing the intended shape before this function
-- existed to do it). This function seats every active comb member except
-- the subject as a contributor of the new hive, in the same transaction
-- as the mint -- explicit exclusion in the SELECT, not reliance on
-- `hive_contributors_not_hive_subject_trigger` to reject the subject's
-- row, because a single multi-row INSERT ... SELECT aborts entirely on
-- one violating row rather than skipping it.
--
-- Not built here, flagged rather than silently assumed shipped: the
-- create-comb screen, the organizer name-collection mount (Lumen's ruling
-- -- one component, header-swapped, shared with ENG-59), and the
-- organizer's copy of the invite link are ENG-93's other three deliverables
-- (§1B.29.2, "3. Create screen and client method"). This migration is the
-- mint only -- the client surface is a separate, follow-on piece of work.
alter table public.combs
  add column cadence interval not null default interval '1 month';

comment on column public.combs.cadence is
  'How often this comb''s rotation advances. Stored once here (Vector,
  thread b57ad406, 2026-08-30) so the clock''s "closes_at + cadence" rule
  and any future mint caller read one number instead of two hard-coded
  copies drifting apart.';

create function public.comb_open_rotation(
  p_comb_id uuid,
  p_subject_profile_id uuid,
  p_closes_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_id uuid;
  v_subject_deleted_at timestamptz;
  v_subject_display_name text;
  v_hive_id uuid;
  v_ordinal int;
  v_rotation_id uuid;
begin
  select c.owner_id into v_owner_id
  from public.combs c
  where c.id = p_comb_id;

  if v_owner_id is null then
    raise exception 'comb_open_rotation: comb not found' using errcode = '42501';
  end if;

  -- Leg (a), moved inside the body. NOT `current_user <> 'service_role'`:
  -- inside a SECURITY DEFINER body, `current_user` is switched to the
  -- FUNCTION OWNER for the whole call (standard PG semantics) -- it can
  -- never read back the caller's role, so that comparison is always true
  -- and would refuse every caller including the clock. Use the same
  -- signal this codebase already relies on for "no end-user session"
  -- (20260813000002, 20260813000005, 20260829000001/2, 20260830000004:
  -- "auth.uid() is null by contract" for a signed-out/service caller) --
  -- `request.jwt.claims` is a GUC, unaffected by the SECURITY DEFINER
  -- role switch, so it still reads correctly here. `anon` is revoked
  -- below, so the only two roles that can ever reach this line are
  -- `authenticated` (always has a `sub` claim, so auth.uid() is never
  -- null) and `service_role` (the clock, no user JWT at all) -- a null
  -- auth.uid() is service_role by construction of the grant surface, not
  -- by inference. `IS DISTINCT FROM`, not `<>`, on the ownership arm --
  -- a null auth.uid() must not silently pass a `<>` comparison the way it
  -- would against v_owner_id.
  if auth.uid() is not null
    and auth.uid() is distinct from v_owner_id then
    raise exception 'comb_open_rotation: caller does not own this comb' using errcode = '42501';
  end if;

  -- Row 2: a tombstoned subject can never receive this month's keepsake
  -- (ENG-91 already classifies this `subject_gone` and voids at seal) --
  -- refusing at mint is the same fabricated-void bar applied one step
  -- earlier, and it is a named exception, not a shape the RLS layer would
  -- have produced.
  --
  -- TRACKED REPOINT (Vector §1B.34/§1B.34.1/§1B.34.2, Lumen ratified +
  -- amended, thread b57ad406, 2026-08-30): this is HALF of the shared
  -- subject-deliverable predicate -- ENG-91's `subject_gone` void
  -- classifies on tombstoned OR departed (`comb_members.removed_at is not
  -- null`), and per §1B.34.1 the mint must become the THIRD CALLER of that
  -- same shared body once it exists, refusing a departed subject too (a
  -- never-member still mints and delivers -- refusing departure is not
  -- requiring membership). ENG-95 (Sage) is building that shared body now
  -- (`comb_subject_gone`); it does not exist yet, so shipping the
  -- tombstone-only check below is the ruled sequencing ("do not block" --
  -- Vector, §1B.34.1), NOT the finished shape.
  -- ENG-94 (Fizz, not ENG-95) REPLACES THIS LINE with a call into the
  -- shared body -- ENG-94's migration is the first number where both the
  -- shared body (ENG-95) and this mint (ENG-93) exist, and `create or
  -- replace` from ENG-95's own migration would CONJURE a mint out of the
  -- seal's migration rather than repoint one (§1B.34.2). Do not extend
  -- this predicate in place (e.g. adding a second `removed_at` check here
  -- would make the mint a fourth, silently-drifting copy of a predicate
  -- that is about to have a canonical home).
  select p.deleted_at into v_subject_deleted_at
  from public.profiles p
  where p.id = p_subject_profile_id;

  if v_subject_deleted_at is not null then
    raise exception 'comb_open_rotation: subject has deleted their account';
  end if;

  select p.display_name into v_subject_display_name
  from public.profiles p
  where p.id = p_subject_profile_id;

  -- Leg (b) deliberately absent: no check that p_subject_profile_id is an
  -- active row in comb_members. Gated below.
  insert into public.private_hives (owner_id, subject_name, is_collective, subject_profile_id)
  values (
    v_owner_id,
    coalesce(nullif(v_subject_display_name, ''), 'Someone'),
    true,
    p_subject_profile_id
  )
  returning id into v_hive_id;

  -- Roster snapshot: every active comb member except the subject.
  -- Explicit exclusion, not the disjointness trigger, per the file header.
  insert into public.hive_contributors (hive_id, profile_id, invited_by)
  select v_hive_id, m.profile_id, v_owner_id
  from public.comb_members m
  where m.comb_id = p_comb_id
    and m.removed_at is null
    and m.profile_id <> p_subject_profile_id;

  select coalesce(max(r.ordinal), 0) + 1 into v_ordinal
  from public.comb_rotations r
  where r.comb_id = p_comb_id;

  -- comb_rotations_one_open_per_comb (20260830000002) still stands guard
  -- here: a second mint attempt while one rotation is already open raises
  -- 23505, the same collision seal_and_send_rotation's own advance-before-
  -- resolve probe hit (§1B.31.2) -- this function does not duplicate that
  -- check, the index already owns it.
  insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at)
  values (p_comb_id, v_ordinal, v_hive_id, p_subject_profile_id, p_closes_at)
  returning id into v_rotation_id;

  return v_rotation_id;
end;
$$;

-- Granted to both authenticated (month 1, organizer taps, explicit
-- arguments) and service_role (month N+1, the clock's future
-- comb_advance_rotation wrapper, per Vector's grant pin: the wrapper
-- itself is service_role-only, but the mint it calls into must still
-- accept a service_role caller directly). `revoke ... from public` does
-- not reach `anon` -- named revoke required, same as every other
-- SECURITY DEFINER function in this schema.
revoke all on function public.comb_open_rotation(uuid, uuid, timestamptz) from public;
revoke execute on function public.comb_open_rotation(uuid, uuid, timestamptz) from anon;
grant execute on function public.comb_open_rotation(uuid, uuid, timestamptz) to authenticated;
grant execute on function public.comb_open_rotation(uuid, uuid, timestamptz) to service_role;

notify pgrst, 'reload schema';
