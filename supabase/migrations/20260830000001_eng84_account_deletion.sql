-- ENG-84: self-service in-app account deletion. App Store 5.1.1(v) hard
-- rejection blocker -- the current path (legalCopy.js's Privacy Policy
-- section, "email us and we will act within 30 days") is not in-app
-- self-service and does not satisfy Apple's requirement. This migration
-- ships the server-side half; the client half is HoneycombStore.js /
-- src/screens/DeleteAccount.js in this same commit.
--
-- Shape ruled by Colin, 2026-08-30 (event 34d96ff71a8f929883c152be34c1cdd6
-- 572fc4ed59ea5a306d579ce1871f37c9, thread f2c15b7d) -- "keep-and-disclose":
-- OUTBOX/ENG84_DELETION_COPY.md is the spec of record. Summary:
--
--   1. TOMBSTONE, don't delete, public.profiles -- clear display_name /
--      avatar_url / phone_hash, but keep the row alive so every FK, RLS
--      read, and snapshotted-name column elsewhere in this schema keeps
--      resolving after the account is gone.
--   2. auth.users IS actually deleted (the account itself goes away).
--   3. Unsealed authored entries (personal journal, and pre-seal hive
--      entries) are hard-deleted.
--   4. Sealed/sent keepsakes survive untouched -- already true by
--      construction, see point 4 below.
--   5. Every hive_contributors membership the deleting user holds ends
--      (removed_at = now()).
--
-- ============================================================================
-- 1. Break the cascade: auth.users deletion must not take public.profiles
-- with it.
--
-- profiles.id's FK to auth.users(id) is `on delete cascade`
-- (20260808000001:15) -- confirmed the live constraint name against a real
-- embedded-Postgres instance (information_schema.table_constraints /
-- key_column_usage / referential_constraints joined on table_name =
-- 'profiles'), not guessed: `profiles_id_fkey`, delete_rule CASCADE, exactly
-- the auto-generated name Postgres gives an inline column-level FK with no
-- explicit CONSTRAINT clause.
--
-- Dropped outright, not replaced with `on delete no action`/`restrict`:
-- those would just turn "delete the auth.users row" into an FK-violation
-- error the moment a profiles row still references it -- which is every
-- deletion this feature ever performs, since the whole point is the
-- profiles row survives. Nothing else in this schema needs profiles.id to
-- resolve to a LIVE auth.users row (every other FK in the schema points AT
-- profiles.id, not the reverse), so there is no invariant a replacement
-- clause would be protecting.
alter table public.profiles drop constraint profiles_id_fkey;

comment on column public.profiles.id is
  'References an auth.users id, but is no longer FK-enforced against it '
  '(profiles_id_fkey dropped, 20260830000001) -- ENG-84 deletes the '
  'auth.users row on account deletion while keeping this row alive as a '
  'tombstone (see deleted_at). A profiles row with no matching auth.users '
  'row is the expected post-deletion state, not an integrity failure.';

-- ============================================================================
-- 2. The tombstone predicate -- a public contract. Other in-flight work
-- (ENG-58/comb rotation, OPS-9) reads this column to detect a tombstoned
-- subject/member: name is exactly `deleted_at`, non-null is the single
-- source of truth for "this account was deleted."
alter table public.profiles
  add column deleted_at timestamptz;

comment on column public.profiles.deleted_at is
  'Set once, by delete_own_account(), when this account is deleted. Null '
  'means never deleted. PUBLIC CONTRACT: other features (ENG-58/comb '
  'rotation, OPS-9) read this column directly to detect a tombstoned '
  'subject/member -- do not repurpose or rename it. A tombstoned row keeps '
  'its primary key and every FK/RLS read that targets profiles.id alive; '
  'display_name/avatar_url/phone_hash are cleared (see delete_own_account) '
  'but the row itself is never deleted.';

-- Same one-directional-transition shape this schema already uses for every
-- other "set once, never unset" flag (private_hives.sealed_at, 20260815000004;
-- hive_contributors.removed_at, 20260827000001; private_hives.is_collective,
-- same file). Not part of Colin's ruled shape explicitly, but the standing
-- convention every sibling flag in this schema follows, added here so
-- deleted_at can't be un-set by a bug or a compromised client and silently
-- un-delete an account's tombstone status.
create function public.profiles_deleted_at_immutable()
returns trigger
language plpgsql
as $$
begin
  if old.deleted_at is not null and new.deleted_at is distinct from old.deleted_at then
    raise exception 'profiles: deleted_at cannot be changed once set';
  end if;
  return new;
end;
$$;

create trigger profiles_deleted_at_immutable_trigger
  before update on public.profiles
  for each row execute function public.profiles_deleted_at_immutable();

-- ============================================================================
-- 3. delete_own_account() -- the one RPC the client calls. SECURITY DEFINER,
-- same precedent as is_hive_contributor()/is_volume_open()/seal_volume() etc
-- (20260827000001, 20260826000004): runs as the function's owner so it can
-- reach auth.users (an unprivileged `authenticated` caller has no grant on
-- that table at all), restricted to acting on auth.uid() itself -- never an
-- argument, so there is no id parameter for a caller to pass someone else's
-- uuid into.
--
-- Confirmed against a real embedded-Postgres instance (not assumed) that a
-- SECURITY DEFINER function owned by the migration-applying role can
-- `delete from auth.users` and have it actually take effect when CALLED by
-- an `authenticated`-role caller with no privileges of their own on
-- auth.users -- the same "reachable from a Postgres function" property this
-- schema already leans on for on_auth_user_created (20260808000001, a
-- trigger ON auth.users, which requires the same underlying privilege to
-- have been grantable in the first place). No separate service-role/edge-
-- function path exists anywhere in this repo (no supabase/functions
-- directory, no admin client in src/) -- this SQL-only path is the one
-- actually available in this schema, not a second-best fallback.
--
-- `set search_path = public, pg_temp` per the hardening convention
-- (20260817000001).
create function public.delete_own_account()
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

  -- Delete unsealed authored entries -- personal journal (hive_id is null)
  -- AND pre-seal hive entries, both. Deliberately the SAME predicate as the
  -- live entries_delete_own boundary (20260827000001, restated by
  -- ENG84_DELETION_COPY.md's corrected citation): `auth.uid() = user_id and
  -- (hive_id is null or is_volume_open(volume_id))`. NOT private_hives.
  -- sealed_at -- that column stopped being the sealed-content source of
  -- truth as of 20260826000004 (hive_volumes_repoint; see its own comment:
  -- "private_hives.sealed_at ... is not the source of truth for anything
  -- past Volume 1"). A hive that has sealed Volume 1 and is now writing
  -- Volume 2 would read private_hives.sealed_at as non-null forever, which
  -- would wrongly exempt live, never-sealed Volume-2 entries from deletion.
  -- is_volume_open() (SECURITY DEFINER, 20260827000001) is checked directly
  -- here rather than through entries_delete_own's RLS -- this function
  -- already bypasses RLS by virtue of being SECURITY DEFINER, so the delete
  -- below is the authorization, not a policy this statement is subject to.
  --
  -- Sealed/sent hive entries are untouched by this DELETE (is_volume_open
  -- returns false for them) -- keep-and-disclose, the ruled product
  -- position: snapshotted names (subject_name, contributor_names,
  -- author_name_at_seal) already mean nothing sealed re-reads profiles
  -- live, so a delivered keepsake needs no further action here.
  delete from public.entries
    where user_id = v_uid
      and (hive_id is null or public.is_volume_open(volume_id));

  -- End every membership this user holds as a contributor, across every
  -- hive. `where removed_at is null` makes this idempotent against a retry:
  -- hive_contributors_removed_at_immutable_trigger (20260827000001) raises
  -- if removed_at is set on a row that already has one, so a bare UPDATE
  -- with no WHERE guard would make a second call to this function error
  -- instead of no-op.
  update public.hive_contributors
    set removed_at = now()
    where profile_id = v_uid and removed_at is null;

  -- Tombstone the profile. `where deleted_at is null` is belt-and-suspenders
  -- with the trigger above (a retry inside the same still-valid session
  -- would otherwise try to re-stamp deleted_at and hit the immutability
  -- guard) and keeps this statement itself idempotent rather than relying
  -- on the trigger to convert a retry into an error.
  --
  -- display_name is `not null` at the column level (20260808000001) and
  -- that constraint is not touched by this migration, so "clear" means the
  -- empty string here, not NULL -- the closest a not-null text column can
  -- get to holding nothing. Downstream UI that live-joins profiles.
  -- display_name (feed cards, connection lists -- anything NOT reading a
  -- sealed snapshot column) will render a blank name for a tombstoned user
  -- until it's taught to branch on deleted_at instead; flagged here as a
  -- deliberate scope boundary, not fixed in this migration, since that UI
  -- lives outside ENG-84 and other in-flight work is what the deleted_at
  -- contract above exists to let them fix on their own schedule.
  update public.profiles
    set display_name = '',
        avatar_url = null,
        phone_hash = null,
        deleted_at = now()
    where id = v_uid and deleted_at is null;

  -- Finally, delete the auth.users row -- the account itself is gone. Safe
  -- now that profiles_id_fkey no longer exists: this cannot cascade the
  -- tombstoned profiles row away with it. `where id = v_uid` (not a bare
  -- delete) keeps this idempotent against a retry that lands after the row
  -- is already gone -- DELETE matching zero rows is not an error.
  delete from auth.users where id = v_uid;
end;
$$;

-- House anon-revoke pattern (20260813000005, repeated by every definer
-- helper since): `revoke all from public` does not reach `anon` --
-- 20260808000001's named default-privilege grant to anon survives a PUBLIC
-- revoke untouched, so the named revoke is required, not redundant.
revoke all on function public.delete_own_account() from public;
revoke execute on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;

notify pgrst, 'reload schema';
