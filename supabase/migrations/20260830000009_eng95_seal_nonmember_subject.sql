-- ENG-95 (Sage). Thread b57ad406, 2026-08-30.
--
-- Started as a one-clause fix inside seal_and_send_rotation (the old
-- predicate, `not v_subject_active_member`, is an absence test and cannot
-- tell "departed" from "never joined" -- both lack a currently-active
-- comb_members row, and only departure should void). That framing was
-- superseded before it shipped: Lumen ratified "one predicate, two
-- callers" (seal + ENG-94's preview share one body), then Vector corrected
-- it again -- "three callers, one truth" -- once ENG-93's mint turned out
-- to need the same predicate to refuse a doomed rotation at open, not just
-- classify it at close. A site that reimplements one arm of the predicate
-- reads exactly like a site that calls it, right up until the arm it
-- omitted is the one that fires (Vector's §1B.34.1).
--
-- This migration ships the shared body and repoints its first caller:
--
--   public.comb_subject_gone(p_comb_id, p_subject_id) -- true iff the
--   subject's account is tombstoned (profiles.deleted_at is not null) OR
--   the subject was a comb_members row that departed (a row EXISTS with
--   removed_at set). A subject who was never a comb_members row at all
--   satisfies neither arm -- that population is ruled legal, twice
--   (§1B.30.1's acceptance row on ENG-93: "comb_open_rotation must not
--   require the subject to be a comb_members row"; §8's month-1 shape:
--   the subject is "organizer-chosen and may be a non-member",
--   subject_profile_id references profiles, not comb_members). A comb
--   that writes for someone who hasn't joined it is the product working
--   as designed, not a departure -- voided_reason's own column comment
--   already says the true rule in words, "tombstoned or LEFT the comb
--   before the window closed"; the old inline code disagreed with its own
--   comment on exactly that population.
--
--   seal_and_send_rotation -- repointed here, this migration. Replaces
--   the two-variable inline computation (v_subject_deleted_at,
--   v_subject_departed) with one call.
--
--   comb_preview_by_invite_code (ENG-94, Fizz) -- not touched here. Calls
--   this same function once ENG-94 lands, per Lumen's has_active_month
--   gloss ("an open rotation WITH a live subject") -- a gone subject
--   means no meaningfully-joinable month, same as a sealed/voided one.
--
--   comb_open_rotation (ENG-93, Fizz, `...0008`) -- not touched here,
--   deliberately. It doesn't exist on this migration's base (9bc6d04) and
--   per Vector's sequencing note, ships first with an inline tombstone-
--   only refusal so it isn't blocked on this landing. Repointing its
--   refusal to call comb_subject_gone() (adding the departure arm it's
--   ruled to be missing) is ENG-94's migration (Fizz), not a fourth copy
--   left tracked only in-channel -- ENG-94 lands after both `...0008` and
--   `...0009`, the first number where the shared body and the mint both
--   exist, and repoints the preview and the mint together (Vector's
--   §1B.34.2/§1B.34.3).
--
-- Grants: revoked from public, anon, AND authenticated -- no role needed.
-- Every caller (this one and the two to come) is itself SECURITY DEFINER,
-- so a nested call executes as that function's owner, not as the
-- original anon/authenticated/service_role caller, and an owner has
-- implicit EXECUTE on a function it owns independent of any GRANT.
-- Granting this to any client-facing role would open exactly the surface
-- the shared body exists to keep closed: called directly via PostgREST
-- with an arbitrary (comb_id, subject_id) pair, it would answer "has this
-- person deleted their account or left this comb" to anyone who knew or
-- guessed both ids, with no invite-code or membership check in front of
-- it. Unlike is_hive_contributor()/is_volume_open() (granted to
-- authenticated because RLS policies call them in the querying role's own
-- context), nothing here is ever evaluated as the original caller.
create function public.comb_subject_gone(p_comb_id uuid, p_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    exists (
      select 1 from public.profiles p
      where p.id = p_subject_id and p.deleted_at is not null
    )
    or exists (
      select 1 from public.comb_members m
      where m.comb_id = p_comb_id
        and m.profile_id = p_subject_id
        and m.removed_at is not null
    );
$$;

revoke all on function public.comb_subject_gone(uuid, uuid) from public;
revoke execute on function public.comb_subject_gone(uuid, uuid) from anon;
revoke execute on function public.comb_subject_gone(uuid, uuid) from authenticated;

-- CREATE OR REPLACE, same signature -- grants (service_role only, revoked
-- from public/anon/authenticated by 20260830000003) are unaffected by a
-- body replace.
create or replace function public.seal_and_send_rotation(p_rotation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_comb_id uuid;
  v_hive_id uuid;
  v_subject_id uuid;
  v_closes_at timestamptz;
  v_sealed_at timestamptz;
  v_sent_at timestamptz;
  v_voided_at timestamptz;
  v_owner_id uuid;
  v_volume_id uuid;
  v_entry_count int;
  v_departed boolean;
  v_void_reason text;
  v_contributor_names text[];
begin
  select r.comb_id, r.hive_id, r.subject_profile_id, r.closes_at,
         r.sealed_at, r.sent_at, r.voided_at
    into v_comb_id, v_hive_id, v_subject_id, v_closes_at,
         v_sealed_at, v_sent_at, v_voided_at
  from public.comb_rotations r
  where r.id = p_rotation_id
  for update;

  if not found then
    raise exception 'seal_and_send_rotation: rotation not found';
  end if;

  if v_sent_at is not null or v_voided_at is not null then
    return;
  end if;

  if v_closes_at > now() then
    raise exception 'seal_and_send_rotation: rotation has not closed yet';
  end if;

  select v.id into v_volume_id
  from public.hive_volumes v
  where v.hive_id = v_hive_id and v.sealed_at is null;

  if v_volume_id is null then
    raise exception 'seal_and_send_rotation: hive has no open volume';
  end if;

  select h.owner_id into v_owner_id
  from public.private_hives h
  where h.id = v_hive_id;

  select count(*) into v_entry_count
  from public.entries e
  where e.volume_id = v_volume_id and e.visibility = 'private';

  -- ENG-95: shared predicate, see migration header. Tombstoned or departed
  -- both void; never-joined is ruled legal and falls through to the
  -- entry-count branch below like any other intact-subject rotation.
  if public.comb_subject_gone(v_comb_id, v_subject_id) then
    v_void_reason := 'subject_gone';
  elsif v_entry_count = 0 then
    select not exists (
      select 1 from public.hive_contributors c
      where c.hive_id = v_hive_id and c.removed_at is null
    ) into v_departed;
    v_void_reason := case when v_departed then 'departed' else 'quiet' end;
  else
    v_void_reason := null; -- deliver
  end if;

  if v_void_reason is not null then
    update public.entries e
      set visibility = 'packaged',
          author_name_at_seal = coalesce(nullif(p.display_name, ''), 'A writer')
      from public.profiles p
      where p.id = e.user_id
        and e.volume_id = v_volume_id
        and e.visibility = 'private';

    update public.hive_volumes
      set sealed_at = now()
      where id = v_volume_id;

    update public.private_hives
      set sealed_at = now()
      where id = v_hive_id;

    update public.comb_rotations
      set voided_at = now(),
          voided_reason = v_void_reason
      where id = p_rotation_id;

    return;
  end if;

  update public.entries e
    set visibility = 'packaged',
        author_name_at_seal = coalesce(nullif(p.display_name, ''), 'A writer')
    from public.profiles p
    where p.id = e.user_id
      and e.volume_id = v_volume_id
      and e.visibility = 'private';

  update public.hive_volumes
    set sealed_at = now()
    where id = v_volume_id;

  update public.private_hives
    set sealed_at = now()
    where id = v_hive_id;

  update public.entries
    set visibility = 'sent'
    where hive_id = v_hive_id and visibility = 'packaged';

  select coalesce(array_agg(x.author_name_at_seal order by x.entry_date, x.created_at, x.id), '{}')
    into v_contributor_names
  from (
    select distinct on (e.user_id)
      e.user_id, e.author_name_at_seal, e.entry_date, e.created_at, e.id
    from public.entries e
    where e.hive_id = v_hive_id and e.visibility = 'sent'
    order by e.user_id, e.entry_date, e.created_at, e.id
  ) x;

  update public.private_hives
    set sent_at = now(),
        contributor_names = v_contributor_names
    where id = v_hive_id;

  insert into public.hive_send_events (sender_id, recipient_id)
    values (v_owner_id, v_subject_id);

  update public.comb_rotations
    set sealed_at = now(),
        sent_at = now()
    where id = p_rotation_id;
end;
$$;

notify pgrst, 'reload schema';
