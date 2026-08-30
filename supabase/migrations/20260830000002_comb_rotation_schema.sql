-- ENG-58 (Sage, row 1.1, docs/strategy/POLLINATE_COMB_ROTATION.md §8.1/§8.6).
--
-- REBUILT 2026-08-30 per §1B.22 (thread b57ad406): a rotation month is a
-- MINTED `private_hives` row (`is_collective`, `subject_profile_id` known at
-- creation), not a parallel writing surface. §1B.22's own citations --
-- `is_hive_contributor(hive_id)` as the write-status authorization
-- predicate, `hive_contributors_insert_owner`, `HiveStore.js:65-68` -- name
-- the shipped hive schema directly and prescriptively. The prior version of
-- this file built `entries.comb_id`/`comb_rotation_id` as a second parallel
-- writing surface; that reasoning ("a comb is a second, parallel structure,
-- not a mode of private_hives") predates tonight's §1B.19-22 and does not
-- survive them. Struck, not silently dropped -- see the reply this
-- migration was posted alongside, thread b57ad406, 2026-08-30.
--
-- What `combs`/`comb_members` still are: the PERSISTENT, comb-scoped layer
-- -- who is in the club, invite-by-link, the identity reads §1B.17
-- authorizes (`is_comb_member`). What changed: a rotation's WRITING surface
-- reuses `private_hives`/`hive_volumes`/`hive_contributors`/`entries` wholesale
-- -- no new columns on `entries`, no new entries RLS branch. `comb_rotations`
-- becomes the bridge: one row per month, linking a `comb_id` to the
-- `private_hives.id` minted for it, plus a handful of columns MIRRORED from
-- that hive (`subject_profile_id`, `sealed_at`, `sent_at`) so "whose month is
-- it, is it open" is readable by every comb member (`is_comb_member`,
-- comb-scoped) without also granting hive-internal visibility
-- (`is_hive_contributor`, contributor-scoped, content + write-status). The
-- duplication is deliberate and one-directional: `private_hives`/
-- `hive_volumes` stay canonical for delivery mechanics (ENG-91 writes both
-- the hive and the mirror, same transaction); `comb_rotations` is a
-- comb-visible PROJECTION, never a second source of truth to reconcile
-- against.
--
-- Deliberately does NOT touch seal/send behaviour -- that is ENG-91 (row
-- 1.8a), a separate ticket (§1B.14: "ENG-58 is a migration that creates
-- tables... this is not schema, it is function bodies and grants").
-- `comb_rotations.sealed_at`/`.sent_at`/`.voided_at` are declared here
-- (schema) but written only by ENG-91's definer function (behaviour).
--
-- Shape reused deliberately: `is_hive_contributor()`'s recursion-safe
-- SECURITY DEFINER pattern for `is_comb_member()`, `is_collective`'s
-- immutable-at-creation trigger shape, `hive_contributors`'s append-only
-- roster (insert or soft-remove, never delete, never retarget) for
-- `comb_members`.

-- =============================================================================
-- Part 0 (§1B.22.4). Hardening two disjointness guards that predate combs.
--
-- Both guards -- "a hive's subject may never be one of its own active
-- contributors" -- were written for the ONE path that existed when
-- `20260827000001` shipped: an owner creates a subjectless hive, invites
-- contributors, and only later UPDATEs `subject_profile_id` once the subject
-- registers (`HiveStore.js:65-68`). A rotation hive is minted with its
-- subject known AT INSERT -- an event neither guard was written to see:
--
-- Direction 1 (a contributor may not be invited if they're already the
-- hive's subject) lived only in `hive_contributors_insert_owner`'s WITH
-- CHECK -- an RLS policy. Direction 2 (the subject may not be set to an
-- active contributor) lived only in a `before UPDATE` trigger. Neither
-- form is evaluated by a `SECURITY DEFINER` insert, and the rotation
-- engine (ENG-91, and any auto-advance a comb's clock drives with no
-- session at all) is exactly that. Re-expressed as triggers -- which fire
-- regardless of privilege -- so the invariant holds no matter which path
-- inserts the row.
create or replace function public.private_hives_subject_not_active_contributor()
returns trigger
language plpgsql
as $$
begin
  if new.subject_profile_id is not null
    and (tg_op = 'INSERT' or new.subject_profile_id is distinct from old.subject_profile_id)
    and exists (
      select 1 from public.hive_contributors c
      where c.hive_id = new.id
        and c.profile_id = new.subject_profile_id
        and c.removed_at is null
    ) then
    raise exception 'private_hives: subject_profile_id cannot be an active contributor';
  end if;
  return new;
end;
$$;

drop trigger private_hives_subject_not_active_contributor_trigger on public.private_hives;
create trigger private_hives_subject_not_active_contributor_trigger
  before insert or update on public.private_hives
  for each row execute function public.private_hives_subject_not_active_contributor();

-- Direction 1, as a trigger. At the moment this fires, `new.hive_id` may
-- already have a `subject_profile_id` (a rotation hive is minted
-- subject-first) -- this is the branch that actually does the work Direction
-- 1 was for; Direction 2 above mostly guards a hive created the old way,
-- subject added afterward.
create function public.hive_contributors_not_hive_subject()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.private_hives h
    where h.id = new.hive_id
      and h.subject_profile_id = new.profile_id
  ) then
    raise exception 'hive_contributors: profile_id cannot be the hive''s subject';
  end if;
  return new;
end;
$$;

create trigger hive_contributors_not_hive_subject_trigger
  before insert on public.hive_contributors
  for each row execute function public.hive_contributors_not_hive_subject();

-- =============================================================================
-- Part 1. combs. One row per comb; the organizer is `owner_id`, same
-- single-owner shape as `private_hives`. `invite_code` backs ENG-59's
-- join-by-link flow (Fizz, row 1.7) -- generated from `gen_random_uuid()`
-- rather than `pgcrypto`'s `gen_random_bytes()` because no migration in
-- this schema creates that extension, and `gen_random_uuid()` is native to
-- this Postgres version (used everywhere already) with 122 bits of
-- randomness, plenty for an unguessable link token. No update/delete
-- policy: transferring ownership or deleting a comb is unruled product
-- surface, not silently invented here.
create table public.combs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  invite_code text not null default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  constraint combs_invite_code_key unique (invite_code)
);

alter table public.combs enable row level security;

-- combs_select_own (the owner-or-member read) is created further down,
-- right after is_comb_member() exists -- CREATE POLICY resolves the
-- functions its USING clause names immediately, unlike a function body,
-- so it cannot precede is_comb_member's own definition the way this file's
-- narrative order (combs, then comb_members, then the helper) would
-- otherwise put it. Caught by a migration-replay failure
-- ("function public.is_comb_member(uuid) does not exist"), not by inspection.

create policy "combs_insert_own"
  on public.combs for insert
  with check (auth.uid() = owner_id);

-- 2. comb_members. §1B.1: "the free cap is 5 members inclusive of the
-- organizer" -- so the organizer IS a member row, not just `combs.owner_id`.
-- Auto-inserted below at comb creation, same trigger shape as
-- `private_hives_create_volume_one` (20260826000003) auto-opening Volume 1.
--
-- No `invited_by`: unlike `hive_contributors` (owner hand-picks each
-- contributor from their connections), comb membership arrives through
-- ENG-59's invite link -- there is no single inviter to attribute, and
-- inventing one would misrepresent how the row was actually created.
create table public.comb_members (
  comb_id uuid not null references public.combs (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  primary key (comb_id, profile_id)
);

alter table public.comb_members enable row level security;

-- Same one-directional guard as hive_contributors_removed_at_immutable
-- (20260827000001): once removed, always removed. A deliberate re-join is a
-- new row scenario a later migration can open; not silently representable
-- today (this table's PK is (comb_id, profile_id), so it isn't even
-- expressible without a delete this table also doesn't allow).
create function public.comb_members_removed_at_immutable()
returns trigger
language plpgsql
as $$
begin
  if old.removed_at is not null and new.removed_at is distinct from old.removed_at then
    raise exception 'comb_members: removed_at cannot be changed once set';
  end if;
  return new;
end;
$$;

create trigger comb_members_removed_at_immutable_trigger
  before update on public.comb_members
  for each row execute function public.comb_members_removed_at_immutable();

-- Same identity-pin as hive_contributors_identity_immutable
-- (20260827000001): the UPDATE policy below is gated on comb ownership OR
-- self, which says nothing about which COLUMNS an update may touch -- pin
-- every column except removed_at's own legal null->timestamp transition, so
-- neither the owner nor the member themselves can retarget a seat instead of
-- going through the join RPC.
create function public.comb_members_identity_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.comb_id is distinct from old.comb_id
    or new.profile_id is distinct from old.profile_id
    or new.joined_at is distinct from old.joined_at then
    raise exception 'comb_members: only removed_at may be updated';
  end if;
  return new;
end;
$$;

create trigger comb_members_identity_immutable_trigger
  before update on public.comb_members
  for each row execute function public.comb_members_identity_immutable();

-- A comb without an organizer present is a broken invariant no downstream
-- code (comb_rotations' subject check, the roster read) is written to
-- handle. The owner's own seat is barred from removal here rather than
-- trusted to client-side UI -- this schema's standing convention (same
-- reasoning as private_hives_subject_not_active_contributor).
create function public.comb_members_owner_seat_permanent()
returns trigger
language plpgsql
as $$
begin
  if new.removed_at is not null
    and exists (select 1 from public.combs c where c.id = new.comb_id and c.owner_id = new.profile_id) then
    raise exception 'comb_members: the organizer''s own seat cannot be removed';
  end if;
  return new;
end;
$$;

create trigger comb_members_owner_seat_permanent_trigger
  before update on public.comb_members
  for each row execute function public.comb_members_owner_seat_permanent();

-- §1B.19's contract: "any table added after ENG-84 that references profiles
-- states its own deletion behaviour in its own migration." Stated here,
-- since combs did not exist when ENG-84 was scoped.
--
-- ENG-84 (per OUTBOX/ENG84_DELETION_COPY.md) tombstones -- it never deletes
-- the `profiles` row (`auth.users` goes; `profiles` survives carrying
-- nothing personal) -- so every `on delete cascade`/`restrict` in this file
-- is dead code with respect to tombstoning; they only guard an actual row
-- delete, which this flow does not perform. The deletion behaviour this
-- migration owes is therefore application-level, not FK-level:
--
-- 1. Non-owner member, tombstoned: ENG-84 sets this row's `removed_at`,
--    same "end memberships" contract already shipped for
--    `hive_contributors` -- no new mechanism needed, `comb_members` takes
--    the identical treatment. Any `hive_contributors` seat this profile
--    holds on an in-progress rotation is already covered by ENG-84's
--    existing plan for that table -- combs mint ordinary hive rows, so
--    nothing new is owed there either.
-- 2. Comb OWNER, tombstoned: UNRESOLVED, flagged rather than silently
--    decided. `comb_members_owner_seat_permanent_trigger` above raises on
--    any attempt to set `removed_at` on the organizer's own row, by
--    design, because every downstream read (`is_comb_member`,
--    `comb_rotations_insert_owner`'s subject check) assumes a comb always
--    has a present organizer. Tombstoning the owner needs a product
--    ruling this ticket does not make -- transfer ownership, void the
--    comb, or a tombstone-specific bypass of this trigger are all live
--    options. Until that ruling lands, ENG-84 must not attempt to end a
--    comb-owning tombstoned profile's own membership row; doing so raises,
--    same failure shape as a second seal attempt.
-- 3. A rotation's subject, tombstoned: not this ticket's problem. §1B.19
--    assigns the fix (void-and-advance on a tombstoned subject) to
--    `ENG-91`, since a tombstone keeps `private_hives.subject_profile_id`
--    non-null (FK is `on delete set null`, but no delete ever fires) and
--    only that ticket's seal-and-send logic can act on it.

-- Security-definer helper, same recursion-breaking shape as
-- is_hive_contributor() (20260827000001): a raw exists() in combs_select_own
-- against comb_members, combined with comb_members' own select policy
-- querying combs back, is the same mutual-RLS cycle (42P17) that pattern
-- exists to break.
create function public.is_comb_member(p_comb_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.comb_members m
    where m.comb_id = p_comb_id
      and m.profile_id = auth.uid()
      and m.removed_at is null
  );
$$;

-- `revoke all from public` does not reach `anon` -- named revoke required
-- (20260813000005's finding, reapplied by every SECURITY DEFINER function
-- since).
revoke all on function public.is_comb_member(uuid) from public;
revoke execute on function public.is_comb_member(uuid) from anon;
grant execute on function public.is_comb_member(uuid) to authenticated;

create policy "combs_select_own"
  on public.combs for select
  using (auth.uid() = owner_id or public.is_comb_member(id));

create policy "comb_members_select"
  on public.comb_members for select
  using (
    exists (select 1 from public.combs c where c.id = comb_id and c.owner_id = auth.uid())
    or public.is_comb_member(comb_id)
  );

-- No INSERT policy on this table. Both writers are SECURITY DEFINER:
-- the owner-auto-membership trigger below, and ENG-59's future
-- comb_join_by_invite_code() RPC (not built in this ticket -- ENG-59 is
-- Fizz's, row 1.7 -- but the RLS surface it will call into is scoped here:
-- no raw self-insert path, so the join RPC is the only way onto a roster,
-- same "SECURITY DEFINER writers only" shape as hive_volumes
-- (20260826000003)). This also keeps ENG-85's future cap check
-- (combs_written_in / comb_members caps, currently unbuilt and disabled
-- per §8.5) as a single choke point instead of a second enforcement path to
-- keep in sync.
create policy "comb_members_update_owner_or_self"
  on public.comb_members for update
  using (
    exists (select 1 from public.combs c where c.id = comb_id and c.owner_id = auth.uid())
    or profile_id = auth.uid()
  )
  with check (
    exists (select 1 from public.combs c where c.id = comb_id and c.owner_id = auth.uid())
    or profile_id = auth.uid()
  );

-- "Creating a comb seats the organizer." Same SECURITY DEFINER shape as
-- private_hives_create_volume_one (20260826000003) -- combs_insert_own only
-- grants the owner INSERT on combs itself, not on comb_members.
create function public.combs_create_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.comb_members (comb_id, profile_id) values (new.id, new.owner_id);
  return new;
end;
$$;

create trigger combs_create_owner_membership_trigger
  after insert on public.combs
  for each row execute function public.combs_create_owner_membership();

revoke all on function public.combs_create_owner_membership() from public;
revoke execute on function public.combs_create_owner_membership() from anon;
grant execute on function public.combs_create_owner_membership() to authenticated;

-- §1B.17: "profiles has exactly two live SELECT policies... being on
-- someone's [comb roster] grants no profile visibility... ENG-58 owns it: a
-- definer-backed roster read that returns display names for co-members of a
-- comb you belong to. Not a widened profiles policy -- keep the blast
-- radius at the comb." Same class of fix as profile_has_display_name()
-- (20260828000001:204-215): an inline profiles subquery here would run as
-- the calling `authenticated` role and collapse under profiles' own RLS
-- (profiles_select_own is auth.uid() = id; profiles_select_connections
-- requires a honeycomb_connections row, which comb members do not have).
-- SECURITY DEFINER bypasses that instead of running through it.
--
-- Guarded by is_comb_member(p_comb_id) so a non-member cannot pass an
-- arbitrary comb_id and read its roster -- the function answers for "a comb
-- you belong to," never for combs in general. This is the PERSISTENT,
-- comb-wide roster (every comb member, including the current rotation's
-- subject -- §1B.20: comb membership is subject-including, and a comb
-- member is entitled to see who else is in her own comb). It carries no
-- write-status; that is comb_rotation_roster below, and it is scoped to
-- one rotation's hive_contributors, not the comb's full roster.
create function public.comb_co_member_names(p_comb_id uuid)
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
    and public.is_comb_member(p_comb_id);
$$;

revoke all on function public.comb_co_member_names(uuid) from public;
revoke execute on function public.comb_co_member_names(uuid) from anon;
grant execute on function public.comb_co_member_names(uuid) to authenticated;

-- §1B.21: "Six people are writing for you" is satisfied by two different
-- queries and only one is legal -- count(comb_members where removed_at is
-- null) (membership, static all month, ruled in) vs. count(distinct author)
-- over the rotation's entries (write-status, the C1 contaminant §1B.9
-- exists to stop). §1B.22.1 corrected the THREAT (the entries-count query
-- returns a permanent 0 for the subject client-side, RLS already refuses
-- it -- a loud failure, not a silent leak) but not the RULE: the source
-- still has to be named, and this function is that source. Wired to
-- comb_members only, no entries table anywhere in its body, named for what
-- it counts rather than for the sentence it will render, so a future
-- subject-facing screen has one obviously-correct symbol to reach for.
--
-- Deliberately a plain count, not folded into comb_rotation_roster's
-- return shape below: the subject calls this one (membership, always
-- legal for her) and must never call that one (gated by
-- is_hive_contributor, which structurally refuses her -- see below).
create function public.comb_member_count(p_comb_id uuid)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::integer
  from public.comb_members m
  where m.comb_id = p_comb_id
    and m.removed_at is null
    and public.is_comb_member(p_comb_id);
$$;

revoke all on function public.comb_member_count(uuid) from public;
revoke execute on function public.comb_member_count(uuid) from anon;
grant execute on function public.comb_member_count(uuid) to authenticated;

-- =============================================================================
-- Part 3. comb_rotations. One row per month/cycle, bridging a comb to the
-- `private_hives` row minted for it. `hive_id` is the actual writing
-- surface -- entries, contributors, seal/send all live there, unchanged
-- from the shipped multi-writer-hive shape. `subject_profile_id`,
-- `sealed_at`, `sent_at` are MIRRORS of that hive's own columns (private_hives
-- for the first two, private_hives/hive_volumes for sealed_at depending on
-- ENG-91's eventual shape) -- written once, by whoever mints/seals/sends the
-- rotation, so that "whose month is it, is it open" is readable by every
-- comb member (is_comb_member, comb-scoped) without granting hive-internal
-- visibility (is_hive_contributor, contributor-scoped -- excludes the
-- subject by construction, per Part 0's hardening). private_hives/
-- hive_volumes remain canonical; this table is a projection, not a second
-- source of truth.
--
-- No selection algorithm (who becomes next month's subject) and no rotation
-- cadence/duration default are ruled anywhere I can find in
-- POLLINATE_COMB_ROTATION.md -- flagging this back in-thread rather than
-- inventing one here. This ticket provides the mechanism (an owner can open
-- a rotation naming a subject and a closes_at, via ordinary RLS -- no
-- SECURITY DEFINER RPC minted here); ENG-60 (Fizz, "Rotation ritual: open,
-- notify, collect, seal, reveal") owns the policy of how those values get
-- chosen and how a rotation auto-advances, same "build the mechanism, defer
-- the consequence" split §8.5 already uses for ENG-85's caps.
create table public.comb_rotations (
  id uuid primary key default gen_random_uuid(),
  comb_id uuid not null references public.combs (id) on delete restrict,
  ordinal int not null,
  hive_id uuid not null references public.private_hives (id) on delete restrict,
  subject_profile_id uuid not null references public.profiles (id),
  closes_at timestamptz not null,
  sealed_at timestamptz,
  sent_at timestamptz,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (comb_id, ordinal),
  unique (hive_id),
  -- A rotation is delivered (sealed_at set) XOR abandoned (voided_at set),
  -- never both -- §1B.16's "void and advance" is the alternative to
  -- delivery for a zero-entry window, not a step on the way to it.
  constraint comb_rotations_sealed_xor_voided check (sealed_at is null or voided_at is null),
  constraint comb_rotations_sent_requires_sealed check (sent_at is null or sealed_at is not null)
);

alter table public.comb_rotations enable row level security;

-- Exactly one open rotation per comb, DB-enforced -- same R2 shape as
-- hive_volumes_one_open_per_hive (20260826000003). "Open" excludes voided
-- rows too -- a voided rotation is closed (§1B.16: void is what ENDS a
-- window that will not deliver), not a state a new sibling should be able
-- to insert alongside.
create unique index comb_rotations_one_open_per_comb
  on public.comb_rotations (comb_id) where sealed_at is null and voided_at is null;

create policy "comb_rotations_select"
  on public.comb_rotations for select
  using (
    exists (select 1 from public.combs c where c.id = comb_id and c.owner_id = auth.uid())
    or public.is_comb_member(comb_id)
  );

-- Owner opens a rotation by inserting ALL THREE rows in one client
-- transaction, each through its own already-shipped or above policy: the
-- hive via private_hives_insert_own (is_collective/subject_profile_id are
-- freely settable at insert -- no separate gate), each non-subject member's
-- seat via hive_contributors_insert_owner (Part 0's new trigger enforces
-- the subject exclusion regardless), then this row linking them. No
-- SECURITY DEFINER minting function in this ticket -- a plain owner-driven
-- insert composes cleanly with what already shipped. ENG-91's clock-driven
-- auto-advance (no session at all) is a different caller and may need its
-- own SECURITY DEFINER path -- that is ENG-91's ticket to build, and
-- exactly why Part 0's guards are triggers rather than being left as RLS:
-- a definer insert bypasses this policy too, and needed to stay safe
-- anyway.
--
-- WITH CHECK verifies the three rows agree: the hive is this owner's,
-- is_collective, and its subject matches this row's subject; the subject
-- is an active comb member.
create policy "comb_rotations_insert_owner"
  on public.comb_rotations for insert
  with check (
    exists (select 1 from public.combs c where c.id = comb_id and c.owner_id = auth.uid())
    and exists (
      select 1 from public.comb_members m
      where m.comb_id = comb_rotations.comb_id
        and m.profile_id = subject_profile_id
        and m.removed_at is null
    )
    and exists (
      select 1 from public.private_hives h
      where h.id = hive_id
        and h.owner_id = auth.uid()
        and h.is_collective
        and h.subject_profile_id = comb_rotations.subject_profile_id
    )
  );

-- No UPDATE policy at all: sealed_at / sent_at / voided_at are SECURITY
-- DEFINER-only writes, ENG-91's surface, same "no insert/update/delete
-- policy, SECURITY DEFINER writers only" shape as hive_volumes itself. This
-- also makes subject_profile_id/hive_id/comb_id/ordinal immutable for free
-- -- no client path can UPDATE any column on this table, mirrored or not.

-- §1B.22.2/.3, §1B.20: the write-status read. Authorization is
-- is_hive_contributor(hive_id) -- NOT is_comb_member(comb_id) -- per
-- §1B.22.4's ruling: "the write-status definer's authorization predicate
-- must be is_hive_contributor(hive_id) on that month's hive... the same
-- function that serves the eleven writers refuses the subject with no
-- subject-specific branch at all." Because Part 0 hardens the subject's
-- exclusion from hive_contributors as a trigger (fires regardless of
-- privilege), this authorization check alone is sufficient: if the caller
-- is this rotation's subject, is_hive_contributor(v_hive_id) is false BY
-- CONSTRUCTION, and the function returns zero rows -- not a shaped response
-- with fields nulled out. DES-22 §1.2's "the subject-view component should
-- not even receive the data" is satisfied more strongly than a null would:
-- there is nothing to receive.
--
-- Returns entry EXISTENCE only (has_written), never content, never a count
-- -- §1B.22.3's "second definer read... a per-member boolean, never entry
-- content, never a count of content." A client-side
-- `exists(select 1 from entries where user_id = ...)` would run under the
-- caller's own entries RLS (entries_select_own, which only ever admits the
-- caller's own rows -- §1B.22.1) and read as "nobody but me has written"
-- regardless of the true state; SECURITY DEFINER bypasses that the same way
-- comb_co_member_names does above.
create function public.comb_rotation_roster(p_rotation_id uuid)
returns table (profile_id uuid, display_name text, has_written boolean)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_hive_id uuid;
begin
  select r.hive_id into v_hive_id
  from public.comb_rotations r
  where r.id = p_rotation_id;

  if v_hive_id is null or not public.is_hive_contributor(v_hive_id) then
    return;
  end if;

  return query
  select
    c.profile_id,
    p.display_name,
    exists (
      select 1 from public.entries e
      where e.hive_id = v_hive_id
        and e.user_id = c.profile_id
    )
  from public.hive_contributors c
  join public.profiles p on p.id = c.profile_id
  where c.hive_id = v_hive_id
    and c.removed_at is null;
end;
$$;

revoke all on function public.comb_rotation_roster(uuid) from public;
revoke execute on function public.comb_rotation_roster(uuid) from anon;
grant execute on function public.comb_rotation_roster(uuid) to authenticated;

notify pgrst, 'reload schema';
