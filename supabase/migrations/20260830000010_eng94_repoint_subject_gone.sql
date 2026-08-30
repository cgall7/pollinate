-- ENG-94 (Fizz). Thread b57ad406, 2026-08-30.
--
-- Repoints comb_open_rotation (ENG-93, `...0008`) and
-- comb_preview_by_invite_code (ENG-59, `...0006`) onto the shared
-- subject-deliverable predicate comb_subject_gone(p_comb_id, p_subject_id)
-- (ENG-95, `...0009`) -- the first migration number where both callers'
-- base migrations and the shared body all exist, per Vector's §1B.34.2
-- sequencing note in `...0008`'s own header ("ENG-94's migration is the
-- first number where both the shared body and this mint exist, and
-- repoints the preview and the mint together").
--
-- comb_open_rotation: the tombstone-only inline check
-- (`v_subject_deleted_at is not null`) is replaced by a call into
-- comb_subject_gone -- adds the departure arm the mint was ruled to be
-- missing (§1B.34.1: "a never-member still mints and delivers -- refusing
-- departure is not requiring membership"). Leg (b) is unaffected by
-- construction: a subject who was never a comb_members row satisfies
-- neither arm of comb_subject_gone and mints exactly as before. The
-- refusal message drops "deleted their account" for the same reason
-- seal_and_send_rotation collapsed both arms into one voided_reason
-- ('subject_gone', `...0009`) rather than two -- the predicate answers one
-- question, not two, and a caller-visible message that named only one arm
-- would misdescribe the other.
--
-- comb_preview_by_invite_code: `has_active_month` repointed onto Lumen's
-- own gloss for it -- "an open rotation WITH A LIVE SUBJECT" (thread
-- b57ad406, 2026-08-30, cited in `...0009`'s header) -- so a comb whose
-- open rotation's subject has since been tombstoned or has departed reads
-- exactly like the pre-launch/dormant cases §1B.31.3 already ruled:
-- subject_name null, has_active_month false. Read-time classification
-- only -- the rotation row itself is untouched here; it still voids at
-- seal via ENG-91's own comb_subject_gone check. An invitee holding a
-- live link to a doomed rotation should not be told the month is active
-- only to have it void silently later.
--
-- ENG-100 (row 1.7b, §1B.36.9/.18/.19, riding this migration per
-- §1B.36.18's routing): comb_open_rotation gains the empty-writing-roster
-- floor. Month 1 is exempt from §1B.31.3's ≥2-ENROLLABLE floor by ruling,
-- so the mint is the ONLY place an organizer minting themselves as
-- subject in a comb of one (or a comb whose only other members are
-- tombstoned) is observable -- zero contributor rows, a guaranteed-quiet
-- void with no raise. Two changes: (1) the roster snapshot now excludes
-- tombstoned contributors too, not just departed ones -- the general
-- ENROLLABLE predicate (§1B.36.9: comb_members.removed_at is null AND
-- profiles.deleted_at is null), never "exclude the organizer" (§1B.36.18
-- Correction 1: on `main` today the tombstoned-non-owner class is empty
-- by construction -- delete_own_account closes every non-owner seat in
-- the same transaction -- so the predicate's ground is §1B.32's naming
-- discipline plus future writers inheriting the filter, not today's one
-- member). (2) `get diagnostics` the snapshot's row_count; at zero, raise.
-- Per §1B.36.13/.14: `using errcode = 'check_violation'` (SQLSTATE 23514
-- on the wire -- the condition name itself never crosses), plus
-- `using constraint = 'comb_open_rotation_enrollable_floor'` (required --
-- 23514 alone aliases six native CHECK producers on this write path,
-- §1B.36.13 §2). Deliberately no `using table` -- the refusal is over the
-- roster, not any one relation, and Vector's probe (§1B.36.14) confirmed
-- omitting it leaves the genuine-CHECK-violation case still distinguishable
-- via the `schema` field, which a hand-written raise can never populate.
-- The constraint name is function-scoped, not a `pg_constraint` row --
-- there is no real constraint by this name to look up.
create or replace function public.comb_open_rotation(
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
  v_subject_display_name text;
  v_hive_id uuid;
  v_ordinal int;
  v_rotation_id uuid;
  v_contributor_count int;
begin
  select c.owner_id into v_owner_id
  from public.combs c
  where c.id = p_comb_id;

  if v_owner_id is null then
    raise exception 'comb_open_rotation: comb not found' using errcode = '42501';
  end if;

  if auth.uid() is not null
    and auth.uid() is distinct from v_owner_id then
    raise exception 'comb_open_rotation: caller does not own this comb' using errcode = '42501';
  end if;

  -- ENG-94: repointed onto the shared subject-deliverable predicate
  -- (ENG-95). See migration header -- this is the tombstone check plus
  -- the departure arm it was missing, not a new rule.
  if public.comb_subject_gone(p_comb_id, p_subject_profile_id) then
    raise exception 'comb_open_rotation: subject is gone (deleted account or left this comb)';
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

  -- Roster snapshot: every ENROLLABLE comb member except the subject --
  -- active (removed_at is null) AND not tombstoned (ENG-100, §1B.36.9/.18).
  insert into public.hive_contributors (hive_id, profile_id, invited_by)
  select v_hive_id, m.profile_id, v_owner_id
  from public.comb_members m
  where m.comb_id = p_comb_id
    and m.removed_at is null
    and m.profile_id <> p_subject_profile_id
    and not exists (
      select 1
      from public.profiles p
      where p.id = m.profile_id
        and p.deleted_at is not null
    );

  get diagnostics v_contributor_count = row_count;

  -- ENG-100 (row 1.7b): month 1 is exempt from §1B.31.3's ≥2-ENROLLABLE
  -- floor, so this is the only place an empty writing roster is
  -- observable. See migration header for the errcode/constraint reasoning.
  if v_contributor_count = 0 then
    raise exception 'comb_open_rotation: no enrollable contributors for this rotation'
      using errcode = 'check_violation', constraint = 'comb_open_rotation_enrollable_floor';
  end if;

  select coalesce(max(r.ordinal), 0) + 1 into v_ordinal
  from public.comb_rotations r
  where r.comb_id = p_comb_id;

  insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at)
  values (p_comb_id, v_ordinal, v_hive_id, p_subject_profile_id, p_closes_at)
  returning id into v_rotation_id;

  return v_rotation_id;
end;
$$;

-- create or replace preserves the existing grants (authenticated,
-- service_role, revoked from anon) unaffected by a body-only replace.

create or replace function public.comb_preview_by_invite_code(p_invite_code text)
returns table (
  comb_name text,
  inviter_name text,
  subject_name text,
  has_active_month boolean,
  member_count integer
)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_comb_id uuid;
  v_owner_id uuid;
  v_subject_id uuid;
begin
  select c.id, c.owner_id into v_comb_id, v_owner_id
  from public.combs c
  where c.invite_code = p_invite_code;

  if v_comb_id is null then
    return;
  end if;

  select r.subject_profile_id into v_subject_id
  from public.comb_rotations r
  where r.comb_id = v_comb_id
    and r.sealed_at is null
    and r.voided_at is null;

  -- ENG-94: "an open rotation WITH A LIVE SUBJECT" (Lumen's gloss). A
  -- tombstoned or departed subject collapses this to the same
  -- no-active-month shape as pre-launch/dormant -- read-time only, the
  -- rotation itself still voids at seal (ENG-91/ENG-95).
  if v_subject_id is not null and public.comb_subject_gone(v_comb_id, v_subject_id) then
    v_subject_id := null;
  end if;

  return query
  select
    c.name,
    p_owner.display_name,
    p_subject.display_name,
    v_subject_id is not null,
    (
      select count(*)::integer
      from public.comb_members m
      where m.comb_id = v_comb_id
        and m.removed_at is null
    )
  from public.combs c
  join public.profiles p_owner on p_owner.id = v_owner_id
  left join public.profiles p_subject on p_subject.id = v_subject_id
  where c.id = v_comb_id;
end;
$$;

-- create or replace preserves the existing grants (anon, authenticated)
-- unaffected by a body-only replace.

notify pgrst, 'reload schema';
