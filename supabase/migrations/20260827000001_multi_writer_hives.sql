-- Project 18.1, multi-writer hives. Assigned by Sage (thread b4533a52,
-- 2026-08-27) once C1's sequencing precondition cleared (hive_volumes /
-- hive_volumes_repoint confirmed live on prod via preflight:prod-schema).
-- Shape below is Sage's ruling in that same message, citing Lumen's C1-C4
-- (docs/strategy/POLLINATE_V2_SPEC.md §18.1a) and her own OPEN-1 answer.
--
-- NAMING NOTE: Sage's assignment suggested calling the roster table
-- `hive_writers`. Lumen's copy-vocab doc (GUIDES/POLLINATE_MULTIWRITER_COPY_
-- VOCAB.md §2) is explicit that "writer" is the USER-FACING word only --
-- its own table's "Engineering (spec/schema)" column gives `contributor` /
-- `hive_contributors`, matching §18.1's original SQL sketch. Built against
-- the doc's schema column, not the assignment message's paraphrase of it --
-- flagging this rather than silently picking either.
--
-- C2: is_collective is set at creation and immutable -- no solo->collective
-- conversion, ever, because that would retroactively expose existing
-- entries to a brand-new reader. Same one-directional-guard shape as
-- private_hives.sealed_at (20260815000004), except here there is no legal
-- direction at all post-creation (sealed_at allows one null->timestamp
-- transition; is_collective never changes once the row exists).
alter table public.private_hives
  add column is_collective boolean not null default false;

create function public.private_hives_is_collective_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.is_collective is distinct from old.is_collective then
    raise exception 'private_hives: is_collective cannot be changed after creation';
  end if;
  return new;
end;
$$;

create trigger private_hives_is_collective_immutable_trigger
  before update on public.private_hives
  for each row execute function public.private_hives_is_collective_immutable();

-- The roster. `invited_by` carries the inviter attribution the copy doc's
-- invitation surface needs (§4.2: "[Inviter] is making something for
-- [Subject]"). `removed_at` is soft-removal (C4: "stops new writes...
-- deletes nothing") -- append-only, same posture as the nectar ledger and
-- as sealed_at itself. No delete policy is defined below on purpose: this
-- table is never row-deleted, only ever inserted or soft-removed.
create table public.hive_contributors (
  hive_id uuid not null references public.private_hives (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  invited_by uuid not null references public.profiles (id),
  added_at timestamptz not null default now(),
  removed_at timestamptz,
  primary key (hive_id, profile_id)
);

alter table public.hive_contributors enable row level security;

-- Once removed, always removed -- no re-invite-by-unsetting-the-flag path.
-- A deliberate re-invite is a new roster row scenario a later migration can
-- open (primary key is (hive_id, profile_id) so it isn't even representable
-- today without a delete, which this table also doesn't allow); not silently
-- left ambiguous here.
create function public.hive_contributors_removed_at_immutable()
returns trigger
language plpgsql
as $$
begin
  if old.removed_at is not null and new.removed_at is distinct from old.removed_at then
    raise exception 'hive_contributors: removed_at cannot be changed once set';
  end if;
  return new;
end;
$$;

create trigger hive_contributors_removed_at_immutable_trigger
  before update on public.hive_contributors
  for each row execute function public.hive_contributors_removed_at_immutable();

-- Security-definer helper, same recursion-breaking shape as owns_entry()
-- (20260809000004). Needed for private_hives_select_own below: a raw
-- exists() there against hive_contributors, combined with hive_contributors'
-- own select policy querying private_hives back, is the same two-table
-- mutual-RLS cycle (42P17) owns_entry() was written to break. SECURITY
-- DEFINER makes this function's internal read of hive_contributors bypass
-- that table's RLS, so the cycle terminates here instead of looping.
create function public.is_hive_contributor(p_hive_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.hive_contributors c
    where c.hive_id = p_hive_id
      and c.profile_id = auth.uid()
      and c.removed_at is null
  );
$$;

-- `revoke all from public` does not reach `anon` -- 20260808000001's
-- `alter default privileges ... grant all on functions to anon` is a named
-- grant to that role specifically, not to PUBLIC, so it survives a PUBLIC
-- revoke untouched (check-share-visibility.mjs's own comment on this exact
-- gap, and the reason 20260813000005 had to name `anon` explicitly instead
-- of trusting the PUBLIC revoke it was auditing). Named revoke required.
revoke all on function public.is_hive_contributor(uuid) from public;
revoke execute on function public.is_hive_contributor(uuid) from anon;
grant execute on function public.is_hive_contributor(uuid) to authenticated;

-- private_hives: widen SELECT only. §18.1's spec sketch is explicit this
-- is "the delicate part" -- owner-only stays completely untouched (C3: the
-- 08-15 owner-only stance was never repudiated, just scoped away from this
-- new case), contributors are additive via the security-definer helper.
-- INSERT/UPDATE/DELETE on private_hives itself stay owner-only: only the
-- owner creates the hive, sets is_collective, seals, or deletes it.
drop policy "private_hives_select_own" on public.private_hives;
create policy "private_hives_select_own"
  on public.private_hives for select
  using (auth.uid() = owner_id or public.is_hive_contributor(id));

-- hive_volumes: widen SELECT the same way, for the same reason its own
-- migration (20260826000003) gave for being owner-only in the first place:
-- "Required so 20260826000004's re-pointed WITH CHECK/USING subqueries --
-- which run as the invoking `authenticated` role, not SECURITY DEFINER --
-- can actually see the row they're checking." Those subqueries are exactly
-- what entries_insert_own/entries_update_own below still are. Without this,
-- a contributor's insert fails RLS regardless of the is_hive_contributor()
-- clause added to those policies -- the `from hive_volumes v` in their own
-- exists() returns zero rows for anyone who isn't the hive's owner, before
-- the OR clause is ever reached. No insert/update/delete widening needed
-- here: that table still has no such policies at all (SECURITY DEFINER
-- writers only, unchanged by this migration).
drop policy "hive_volumes_select_own" on public.hive_volumes;
create policy "hive_volumes_select_own"
  on public.hive_volumes for select
  using (
    hive_id in (select id from public.private_hives where owner_id = auth.uid())
    or public.is_hive_contributor(hive_id)
  );

-- hive_contributors RLS. SELECT: owner sees the full roster (management
-- surface); any active contributor also sees the full roster, active and
-- removed rows both -- the copy doc's "presence" requirement is roster
-- visibility ("everyone was invited by name; membership isn't a secret"),
-- and removal history is a management fact, not a secret from co-writers.
-- The is_hive_contributor() call in this table's own policy does not
-- recurse into this table's RLS a second time -- SECURITY DEFINER bypasses
-- it, same reasoning as above.
create policy "hive_contributors_select"
  on public.hive_contributors for select
  using (
    exists (select 1 from public.private_hives h where h.id = hive_id and h.owner_id = auth.uid())
    or public.is_hive_contributor(hive_id)
  );

-- INSERT: only the owner invites, only into a hive that was created
-- collective (C2 -- a solo hive can never gain a roster row after the
-- fact; that would be exactly the retroactive-exposure case C2 forbids).
create policy "hive_contributors_insert_owner"
  on public.hive_contributors for insert
  with check (
    invited_by = auth.uid()
    and exists (
      select 1 from public.private_hives h
      where h.id = hive_id and h.owner_id = auth.uid() and h.is_collective
    )
  );

-- UPDATE: only the owner, and only to set removed_at (the trigger above
-- forbids un-setting it). No general-purpose roster edit exists.
create policy "hive_contributors_update_owner"
  on public.hive_contributors for update
  using (exists (select 1 from public.private_hives h where h.id = hive_id and h.owner_id = auth.uid()))
  with check (exists (select 1 from public.private_hives h where h.id = hive_id and h.owner_id = auth.uid()));

-- entries_insert_own / entries_update_own: widen the write-authorization
-- clause from "hive owner" to "hive owner OR active contributor" (Sage's
-- ruling). OPEN-1 answered "no change on the select side" -- entries_select_
-- own (20260808000001) is untouched by this migration, still scoped to
-- auth.uid() = user_id with no owner-of-hive carve-out, which already means
-- contributors only ever see their own entries pre-seal (and, per OPEN-1,
-- so does the owner -- symmetric blindness was already true by construction).
drop policy "entries_insert_own" on public.entries;
create policy "entries_insert_own"
  on public.entries for insert
  with check (
    auth.uid() = user_id
    and (
      hive_id is null
      or exists (
        select 1 from public.hive_volumes v
        where v.id = volume_id
          and v.sealed_at is null
          and (
            v.hive_id in (select id from public.private_hives where owner_id = auth.uid())
            or public.is_hive_contributor(v.hive_id)
          )
      )
    )
  );

drop policy "entries_update_own" on public.entries;
create policy "entries_update_own"
  on public.entries for update
  using (
    auth.uid() = user_id
    and (
      hive_id is null
      or exists (
        select 1 from public.hive_volumes v
        where v.id = volume_id
          and v.sealed_at is null
          and (
            v.hive_id in (select id from public.private_hives where owner_id = auth.uid())
            or public.is_hive_contributor(v.hive_id)
          )
      )
    )
  )
  with check (
    auth.uid() = user_id
    and (
      hive_id is null
      or (
        exists (
          select 1 from public.hive_volumes v
          where v.id = volume_id
            and v.sealed_at is null
            and (
              v.hive_id in (select id from public.private_hives where owner_id = auth.uid())
              or public.is_hive_contributor(v.hive_id)
            )
        )
        and not exists (select 1 from public.shares s where s.entry_id = entries.id)
      )
    )
  );

-- entries_delete_own: NOT enumerated in Sage's assignment message, but C4
-- states plainly "a contributor may delete their own entries while the
-- volume is open" -- and the policy this migration inherits
-- (20260826000004) still requires the DELETER to be the hive's owner
-- (`v.hive_id in (select id from private_hives where owner_id = auth.uid())`),
-- which a contributor deleting their own entry never satisfies. Left as
-- inherited, this ships C4's promised rule broken on day one for every
-- contributor. This codebase has hit exactly this shape twice before on
-- this same table (20260815000005 fixed insert+update's WITH CHECK,
-- 20260815000006 came back to fix delete+reparent-out that the first pass
-- missed) -- fixing it in the same migration this time instead of a follow-up.
--
-- The fix drops the owner-only requirement entirely rather than adding an
-- is_hive_contributor() check: `auth.uid() = user_id` already scopes this
-- to the caller's own row, and that row could only have been legitimately
-- created by an owner or an active-at-the-time contributor (entries_insert_
-- own enforces that at write time) -- so by the time a DELETE is attempted,
-- the only remaining fact worth gating on is whether the volume is still
-- open. This also means a contributor who has since been removed can still
-- delete their own already-written entries while the volume stays open,
-- which matches C4's literal wording ("stops new writes" -- delete is not a
-- new write) rather than re-deriving a stricter rule nobody asked for.
--
-- A plain `exists (select ... from hive_volumes ...)` doesn't work for that
-- last case, though: hive_volumes_select_own above only grants visibility to
-- the owner or an ACTIVE contributor (is_hive_contributor() filters removed_
-- at is null, correctly -- a removed contributor shouldn't see the hive's
-- volumes going forward). A raw subquery would make the row invisible to
-- exactly the removed-contributor-deletes-their-own-work case this policy
-- exists to allow. SECURITY DEFINER sidesteps that: is_volume_open() checks
-- the fact directly, without going through hive_volumes' own RLS at all, so
-- it answers the same regardless of the caller's current standing on the
-- roster.
create function public.is_volume_open(p_volume_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.hive_volumes v
    where v.id = p_volume_id and v.sealed_at is null
  );
$$;

-- Same named-anon-revoke requirement as is_hive_contributor() above.
revoke all on function public.is_volume_open(uuid) from public;
revoke execute on function public.is_volume_open(uuid) from anon;
grant execute on function public.is_volume_open(uuid) to authenticated;

drop policy "entries_delete_own" on public.entries;
create policy "entries_delete_own"
  on public.entries for delete
  using (
    auth.uid() = user_id
    and (
      hive_id is null
      or public.is_volume_open(volume_id)
    )
  );

notify pgrst, 'reload schema';
