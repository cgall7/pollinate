-- ENG-92 (Sage). Post-merge fixes to 20260830000002_comb_rotation_schema
-- (ENG-58) and 20260830000001_eng84_account_deletion (ENG-84), both merged
-- before docs/strategy/POLLINATE_COMB_ROTATION.md's §1B.23/§1B.24 were
-- published -- see that doc's own §1B.24.0: "a ruling exists when it is
-- published, not when it is committed." Thread b57ad406, 2026-08-30. Seven
-- independent fixes, none touching seal/send behaviour (ENG-91, unchanged):
--
--   §1B.23.1 -- comb_rotations_insert_owner's WITH CHECK required the
--   subject to already be a comb_members row. That is a seat cap: it makes
--   "who can be honored this month" bounded by "who already joined," which
--   is the pay-to-be-celebrated shape POLLINATE_V2_ASSIGNMENTS.md §11
--   rejects (a subject should never need to be a member to be written for).
--   Dropped from the WITH CHECK.
--
--   §1B.23.2 -- comb_member_count() answers "how many people are in this
--   comb," not "how many people are writing this month" -- it includes the
--   subject once §1B.23.1 lands, an off-by-one against C1's actual
--   denominator (distinct authors of the open rotation's hive). New
--   function, comb_rotation_writer_count(), reads hive_contributors for
--   the specific rotation instead.
--
--   §1B.23.3 -- private_hives.subject_profile_id is freely UPDATEable by
--   its owner, and comb_rotations.subject_profile_id is a one-directional
--   MIRROR of it that is never rewritten once minted (comb_rotations has no
--   UPDATE policy at all -- see 20260830000002's own comment on that
--   table). If the source moves after the mirror is taken, hive and
--   projection permanently disagree, with the same general shape as
--   private_hives_is_collective_immutable_trigger eleven lines away in
--   that file: pin the source once anything downstream has copied it, or
--   pinning the copy alone just guarantees the two disagree forever.
--
--   §1B.24.1(a)/(b) -- ENG-84 (this same day, one migration earlier)
--   tombstones a profile (deleted_at non-null, display_name cleared to
--   '') but never touches comb_members -- a deleted account stays an
--   active member forever. comb_member_count() and comb_co_member_names()
--   both live-join profiles and both need to stop counting/naming a
--   tombstone, the same `deleted_at is null` predicate ENG-84's own column
--   comment names both functions as the intended readers of.
--
--   §1B.24.2 -- delete_own_account() (ENG-84) needs to end a caller's
--   comb_members seats too, for the same "membership ends on deletion"
--   contract it already applies to hive_contributors. The organizer's own
--   seat must be skipped, never attempted:
--   comb_members_owner_seat_permanent_trigger (20260830000002) raises on
--   any removed_at set on an owner's row, and that raise happening inside
--   this function would abort the whole deletion transaction, making a
--   comb organizer unable to delete their account at all (App Store
--   5.1.1(v)). What happens to a comb when its organizer's account is
--   deleted (auto-transfer vs. void vs. ownerless) is Colin's open
--   question (O8) -- skipping the seat only keeps deletion itself from
--   depending on that ruling landing first.
--
--   §1B.32 leg 1 -- Vector's finding, same thread, after this branch's first
--   push: the tombstone class named in §1B.24.1 above is two functions on
--   the commit this branch was originally cut from, but THREE on
--   github/main@9bc6d04 -- comb_preview_by_invite_code (20260830000006,
--   merged one commit after this branch's base, by provenance) also
--   live-joins profiles for member_count with no deleted_at predicate at
--   all. Applied here as the rebase target, not as a new ticket: same
--   predicate, same reasoning, one function later. Legs 2 and 3 of the same
--   finding (subject_name, inviter_name) are a return-CONTRACT change, not
--   a predicate -- Vector and Lumen routed those to ENG-94 (Fizz), not
--   here; ratified in-thread, not this migration's scope.
--
--   ENG-99 -- Vector's ruling (thread b57ad406, ~19:09-19:13), ratified by
--   Lumen from the design side: a comb member who leaves mid-month keeps a
--   live hive_contributors seat on that month's rotation hive -- the
--   card's existence/write-acceptance read hive_contributors, the fold/
--   count read comb_members (comb_rotations_select,
--   comb_rotation_writer_count), and nothing propagated a self-removal
--   between the two. "Membership is writing rights" is half-applied
--   without this. Five build pins, below. Pin 3/5's guard was argued as an
--   abort-path fix (the trigger firing inside delete_own_account, which
--   already swept hive_contributors three statements earlier) -- live-
--   verified against a real Postgres and CORRECTED at Part 7's own comment:
--   that specific mechanism doesn't reproduce (`now()` is frozen for the
--   whole transaction, so the two writes never disagree), but the guard is
--   real protection against a different, also-verified hazard
--   (cross-transaction re-entry) and stays.
--
-- Verified against github/main@9bc6d04 after rebasing this branch onto it
-- (was cut from 0f898ce/8864a12; Vector's §1B.32 flagged both PRs in this
-- thread as one commit stale) -- git grep for create_comb/createComb (zero
-- hits, confirming §1B.29's "nothing creates a comb" finding, which is why
-- this ticket has no client-facing urgency of its own yet) and for every
-- symbol this migration touches, to confirm none of it was already patched
-- elsewhere.

-- =============================================================================
-- Part 1 (§1B.23.1). Drop the comb_members existence clause from
-- comb_rotations_insert_owner's WITH CHECK. ALTER POLICY, not drop+create --
-- same policy identity, only the WITH CHECK expression changes.
alter policy "comb_rotations_insert_owner"
  on public.comb_rotations
  with check (
    exists (select 1 from public.combs c where c.id = comb_id and c.owner_id = auth.uid())
    and exists (
      select 1 from public.private_hives h
      where h.id = hive_id
        and h.owner_id = auth.uid()
        and h.is_collective
        and h.subject_profile_id = comb_rotations.subject_profile_id
    )
  );

-- =============================================================================
-- Part 2 (§1B.23.2). comb_rotation_writer_count() -- the correct C1
-- denominator. Authorized by is_comb_member(comb_id), NOT
-- is_hive_contributor(hive_id) -- unlike comb_rotation_roster (which
-- structurally refuses the subject, by design, per §1B.22.4), the subject
-- is entitled to know how many people are writing for her this month; only
-- the per-person write-status and content stay contributor-only. Counts
-- hive_contributors directly, never comb_members -- comb_members answers
-- "how big is this comb," this answers "how many people are in this
-- month's writing roster."
--
-- CORRECTED (Vector, thread b57ad406, 2026-08-30, after this migration's
-- first push): the divergence direction below was backwards. comb_members
-- and hive_contributors AGREE when the subject is not a comb member --
-- §1B.23.1 excludes her from both, N = N. They DIVERGE when the subject IS
-- a comb member, which comb_open_rotation's mint always excludes her from
-- (`and m.profile_id <> p_subject_profile_id`) -- not an edge case
-- §1B.23.1 introduced, but the modal shape of a rotating comb since the
-- mint shipped.
--
-- CAVEAT (Vector 19:09 + Lumen's ratification, same thread): this
-- function's "the subject is entitled to know" promise holds only for a
-- subject who IS a comb member -- is_comb_member(v_comb_id) gates the
-- whole body (below), so a subject who has never joined her own comb (the
-- population §1B.23.1/ENG-95 legalized) reads 0 here exactly as she would
-- from comb_member_count, not the true roster size. DES-33's Subject Mask
-- bars any pre-seal count reaching the subject regardless (`§1B.36.1`), so
-- this does not bite today -- but a future subject-facing pre-seal count
-- must not cite this function without also checking comb membership, or
-- restate the promise against the delivered roster instead
-- (`contributor_names.length`, post-seal, per the four-row source table).
create function public.comb_rotation_writer_count(p_rotation_id uuid)
returns integer
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_comb_id uuid;
  v_hive_id uuid;
begin
  select r.comb_id, r.hive_id into v_comb_id, v_hive_id
  from public.comb_rotations r
  where r.id = p_rotation_id;

  if v_comb_id is null or not public.is_comb_member(v_comb_id) then
    return 0;
  end if;

  return (
    select count(*)::integer
    from public.hive_contributors c
    where c.hive_id = v_hive_id
      and c.removed_at is null
  );
end;
$$;

revoke all on function public.comb_rotation_writer_count(uuid) from public;
revoke execute on function public.comb_rotation_writer_count(uuid) from anon;
grant execute on function public.comb_rotation_writer_count(uuid) to authenticated;

-- =============================================================================
-- Part 3 (§1B.23.3). Pin private_hives.subject_profile_id once a
-- comb_rotations row references the hive -- source and mirror can only stay
-- in agreement if the source stops moving the instant something has copied
-- it. Same general shape as private_hives_is_collective_immutable_trigger
-- (20260827000001), a `before update` guard rather than an RLS WITH CHECK so
-- it also catches a SECURITY DEFINER writer (none exists yet for this
-- column, but Part 0 of 20260830000002 hardened the disjointness guards for
-- exactly this reason -- a future definer mint should not be a silent way
-- around it).
create function public.private_hives_subject_pinned_by_rotation()
returns trigger
language plpgsql
as $$
begin
  if new.subject_profile_id is distinct from old.subject_profile_id
    and exists (select 1 from public.comb_rotations r where r.hive_id = new.id)
  then
    raise exception 'private_hives: subject_profile_id is pinned once a comb_rotations row references this hive';
  end if;
  return new;
end;
$$;

create trigger private_hives_subject_pinned_by_rotation_trigger
  before update on public.private_hives
  for each row execute function public.private_hives_subject_pinned_by_rotation();

-- =============================================================================
-- Part 4 (§1B.24.1 a/b). comb_member_count() and comb_co_member_names() both
-- gain a `p.deleted_at is null` predicate so a tombstoned account (ENG-84)
-- stops being counted and stops rendering a blank name. CREATE OR REPLACE --
-- same signature, same grants (already revoked from public/anon, granted to
-- authenticated, by 20260830000002; unaffected by a body replace).
create or replace function public.comb_member_count(p_comb_id uuid)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::integer
  from public.comb_members m
  join public.profiles p on p.id = m.profile_id
  where m.comb_id = p_comb_id
    and m.removed_at is null
    and p.deleted_at is null
    and public.is_comb_member(p_comb_id);
$$;

create or replace function public.comb_co_member_names(p_comb_id uuid)
returns table (profile_id uuid, display_name text)
language sql
security definer
stable
set search_path = public
as $$
  select m.profile_id, p.display_name
  from public.comb_members m
  join public.profiles p on p.id = m.profile_id
  where m.comb_id = p_comb_id
    and m.removed_at is null
    and p.deleted_at is null
    and public.is_comb_member(p_comb_id);
$$;

-- =============================================================================
-- Part 5 (§1B.24.2). delete_own_account() (ENG-84, 20260830000001) ends a
-- caller's comb_members seats, same "membership ends on deletion" contract
-- already applied to hive_contributors three statements above it in this
-- same function -- reproduced verbatim below with one addition. The
-- organizer's own seat is excluded from the WHERE clause, never attempted:
-- comb_members_owner_seat_permanent_trigger (20260830000002) raises on any
-- removed_at set on an owner's row, and that raise happening here would
-- abort the entire deletion transaction. What happens to a comb when its
-- organizer's account is deleted is Colin's open question (O8); this only
-- keeps deletion itself independent of that ruling.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'delete_own_account: no authenticated user';
  end if;

  delete from public.entries
    where user_id = v_uid
      and (hive_id is null or public.is_volume_open(volume_id));

  update public.hive_contributors
    set removed_at = now()
    where profile_id = v_uid and removed_at is null;

  -- §1B.24.2: end every non-owner comb_members seat this user holds. The
  -- `not exists` clause skips the organizer's own seat entirely -- see the
  -- Part 5 header comment above for why attempting it would abort this
  -- whole transaction.
  update public.comb_members
    set removed_at = now()
    where profile_id = v_uid
      and removed_at is null
      and not exists (
        select 1 from public.combs c
        where c.id = comb_members.comb_id and c.owner_id = v_uid
      );

  update public.profiles
    set display_name = '',
        avatar_url = null,
        phone_hash = null,
        deleted_at = now()
    where id = v_uid and deleted_at is null;

  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
revoke execute on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;

-- =============================================================================
-- Part 6 (§1B.32 leg 1). comb_preview_by_invite_code()'s member_count leg
-- gains the same `p.deleted_at is null` predicate as Part 4 -- the third
-- and, per Vector's §1B.32 grep, only remaining member of the tombstone
-- class named in §1B.24.1. CREATE OR REPLACE, same signature, same grants
-- (anon + authenticated, unaffected by a body replace) -- see
-- 20260830000006 for the full function and its rationale; only the
-- member_count subquery changes here.
--
-- subject_name and inviter_name are untouched -- both are return-CONTRACT
-- changes (nullable inviter_name, subject collapsing into the
-- no-active-month boolean), not a predicate, and both were routed to
-- ENG-94 (Fizz) in-thread, not this migration.
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

  return query
  select
    c.name,
    p_owner.display_name,
    p_subject.display_name,
    v_subject_id is not null,
    (
      select count(*)::integer
      from public.comb_members m
      join public.profiles p on p.id = m.profile_id
      where m.comb_id = v_comb_id
        and m.removed_at is null
        and p.deleted_at is null
    )
  from public.combs c
  join public.profiles p_owner on p_owner.id = v_owner_id
  left join public.profiles p_subject on p_subject.id = v_subject_id
  where c.id = v_comb_id;
end;
$$;

revoke all on function public.comb_preview_by_invite_code(text) from public;
grant execute on function public.comb_preview_by_invite_code(text) to anon;
grant execute on function public.comb_preview_by_invite_code(text) to authenticated;

-- =============================================================================
-- Part 7 (ENG-99). A comb member's departure closes their writing seat on
-- the comb's currently-open rotation hive -- five build pins, per Vector's
-- ruling and Lumen's design-side ratification (thread b57ad406):
--
--   Pin 1 -- open rotation only. A sealed or voided month's roster is
--   historical record, not something departure should touch: entries.
--   author_name_at_seal (20260828000001) already freezes the writer's name
--   per-entry at seal, independent of hive_contributors, so a past month's
--   contributor_names is unaffected either way (Pin 2). Scoped below via
--   comb_rotations.sealed_at/voided_at both null.
--
--   Pin 2 -- departure ends the writing, not the written. No code change:
--   verified 20260828000001's contributor_names aggregate reads
--   entries.author_name_at_seal via array_agg, distinct on entries.user_id,
--   never hive_contributors -- a writer who leaves after writing still
--   ships in the keepsake, named.
--
--   Pin 3 / Pin 5 -- `removed_at is null` guards the UPDATE below.
--
--   CORRECTED (Sage, live-verified against a real embedded-Postgres
--   instance before trusting the claim, not just re-argued): Vector raised
--   this as an ABORT-PATH guard -- delete_own_account() (20260830000001)
--   sweeps hive_contributors three statements before it sweeps
--   comb_members (Part 5 above), so this trigger fires, during account
--   deletion, against a hive_contributors row that already carries
--   removed_at, and hive_contributors_removed_at_immutable_trigger
--   (20260827000001) raises on any re-stamp of an already-removed row.
--   That specific mechanism does NOT reproduce: `now()` is
--   `transaction_timestamp()` -- frozen for the life of the whole calling
--   transaction, not the wall clock -- so delete_own_account's own sweep
--   (Part 5, using `now()`) and this trigger's UPDATE (also `now()`, same
--   transaction) write the IDENTICAL timestamp to the same row.
--   `new.removed_at is distinct from old.removed_at` is therefore FALSE,
--   the immutable trigger's raise condition never evaluates true, and the
--   second write is silently a no-op -- reproduced directly: stripping this
--   guard and re-running the gate's delete_own_account/open-rotation-seat
--   test (below) still passes 18/18, no abort, because the two writes
--   never actually disagree.
--
--   The guard still stands, for the reason that DOES hold: it makes this
--   trigger idempotent against retry, and it is real protection against a
--   DIFFERENT, live-verified hazard -- a hive_contributors seat closed in
--   an EARLIER, already-COMMITTED transaction (any future path that closes
--   a seat outside this trigger's own transaction) genuinely does raise on
--   a bare re-stamp, confirmed against a real clock gap across two
--   separate transactions. The guard is therefore load-bearing against
--   cross-transaction re-entry, not against delete_own_account's specific
--   same-transaction statement order -- a narrower claim than originally
--   argued, but a real one.
--
--   Pin 4 -- an empty roster (every writer's seat closed mid-month) is
--   already voided by §1B.16's existing zero-entry mechanism at seal time.
--   No new behaviour: this trigger only closes seats, it never seals or
--   voids a rotation itself.
--
-- SECURITY DEFINER, not a bare trigger function: hive_contributors_update_
-- owner (20260827000001) grants UPDATE only to the hive owner (the comb
-- organizer), and comb_members_update_owner_or_self (20260830000002) lets
-- a MEMBER end their own seat directly -- so a self-departing member's own
-- UPDATE on comb_members would have no privilege to also close their
-- hive_contributors row without this function running as its definer.
--
-- The organizer's own row can never reach this trigger:
-- comb_members_owner_seat_permanent_trigger (20260830000002, BEFORE
-- UPDATE, same table/event) raises on any removed_at set on an owner's
-- row before this AFTER trigger would ever fire -- one shape, not two, per
-- Lumen's verification in-thread.
create function public.comb_members_departure_closes_writing_seat()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.hive_contributors
  set removed_at = now()
  where profile_id = new.profile_id
    and removed_at is null
    and hive_id in (
      select r.hive_id
      from public.comb_rotations r
      where r.comb_id = new.comb_id
        and r.sealed_at is null
        and r.voided_at is null
    );

  return new;
end;
$$;

create trigger comb_members_departure_closes_writing_seat_trigger
  after update on public.comb_members
  for each row
  when (old.removed_at is null and new.removed_at is not null)
  execute function public.comb_members_departure_closes_writing_seat();

-- Same shape as combs_create_owner_membership (20260830000002) -- a
-- SECURITY DEFINER trigger function is directly callable by anyone with
-- default PUBLIC execute unless explicitly revoked, bypassing the trigger
-- context entirely. Only `authenticated` reaches this: comb_members_
-- update_owner_or_self admits the organizer or the member themselves, both
-- authenticated; no service_role caller of a comb_members UPDATE exists
-- today.
revoke all on function public.comb_members_departure_closes_writing_seat() from public;
revoke execute on function public.comb_members_departure_closes_writing_seat() from anon;
grant execute on function public.comb_members_departure_closes_writing_seat() to authenticated;

notify pgrst, 'reload schema';
