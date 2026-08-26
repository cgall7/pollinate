-- ENG-46, additive half (Sage, thread 83a020e9, 2026-08-26). Ratified
-- 2026-08-25, `docs/strategy/POLLINATE_V2_SPEC.md` §17.1/§17.1a: a hive is a
-- relationship (permanent, 18 years long); a volume is a chapter (sealed
-- independently). Sealing seals the current volume, not the hive forever.
--
-- R3 (§17.1a): ships as two migrations, not one. This one is purely
-- additive -- new table, new nullable column, backfill -- and changes no
-- enforced behavior; it is safe to sit in production indefinitely. The
-- re-point (20260826000002) is what actually moves the sealed-content
-- guards onto this table, and only lands once every row here already has a
-- correct volume_id.

create table public.hive_volumes (
  id uuid primary key default gen_random_uuid(),
  hive_id uuid not null references public.private_hives (id) on delete restrict,
  ordinal int not null,
  title text,
  sealed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (hive_id, ordinal)
);

alter table public.hive_volumes enable row level security;

-- Owner-only, same shape as private_hives itself (20260815000001): a volume
-- has no party of its own, it belongs to the hive. Required so
-- 20260826000002's re-pointed WITH CHECK/USING subqueries -- which run as
-- the invoking `authenticated` role, not SECURITY DEFINER -- can actually
-- see the row they're checking.
create policy "hive_volumes_select_own"
  on public.hive_volumes for select
  using (hive_id in (select id from public.private_hives where owner_id = auth.uid()));

-- No insert/update/delete policy: hive_volumes has exactly two writers,
-- both SECURITY DEFINER below (the entries-insert trigger and the
-- hive-insert trigger) plus seal_volume() in 20260826000002 -- same
-- "nobody, not even the owner, writes this table directly" shape as
-- hive_send_events (20260819000002).

-- R2 (§17.1a): exactly one open volume per hive, DB-enforced. Makes "the
-- currently-open volume" a guarantee the trigger below can rely on instead
-- of an assumption -- a double-seal race errors here instead of producing
-- two open volumes, same spirit as the one-directional sealed_at guard
-- (20260815000004).
create unique index hive_volumes_one_open_per_hive
  on public.hive_volumes (hive_id) where sealed_at is null;

alter table public.entries
  add column volume_id uuid references public.hive_volumes (id) on delete restrict;

-- R1 (§17.1a): the client does not change. HiveStore.addHiveEntry inserts
-- {user_id, hive_id, content, entry_date, theme} with no volume_id, and
-- will keep doing so for any binary already in the field -- "the obvious
-- fix, HiveStore starts setting it, creates a client/server
-- deploy-ordering hazard we do not control" on a mobile app whose users we
-- can't force to update. This trigger resolves it server-side instead:
-- whenever hive_id is set and volume_id isn't, stamp the hive's
-- currently-open volume. Fires BEFORE INSERT OR UPDATE, so
-- entries_insert_own/entries_update_own (re-pointed in 20260826000002) see
-- the resolved value on the row they actually check -- Postgres applies
-- BEFORE ROW triggers before RLS WITH CHECK is evaluated, not after. Covers
-- both writers R1 names: addHiveEntry's plain INSERT and the filing
-- affordance's UPDATE (an existing personal-journal entry's hive_id set
-- from null to a hive for the first time).
--
-- SECURITY DEFINER: fires as whichever `authenticated` caller is writing
-- the entry, who has no direct grant on hive_volumes beyond their own rows
-- (hive_volumes_select_own above) -- own rows are exactly what this reads,
-- so the bypass grants no extra reach. Same single-writer shape already
-- used for hive_send_events/seal_hive.
create function public.entries_resolve_volume_id()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.hive_id is not null and new.volume_id is null then
    select id into new.volume_id
    from public.hive_volumes
    where hive_id = new.hive_id and sealed_at is null;
  end if;
  return new;
end;
$$;

-- Fires on UPDATE as well as INSERT: R1's own text promises "addHiveEntry
-- AND the ENG-42 filing RPC both get it for free" -- filing an EXISTING
-- personal-journal entry into a hive (§16.5's "File this to..." affordance)
-- is an UPDATE that sets hive_id from null to a value, not an INSERT. The
-- condition (hive_id is not null and volume_id is null) is false for every
-- other UPDATE -- an edit to an already-hived entry (volume_id already set)
-- or to a personal-journal entry (hive_id stays null) is a no-op here.
create trigger entries_resolve_volume_id_trigger
  before insert or update on public.entries
  for each row execute function public.entries_resolve_volume_id();

-- House revoke pattern (20260813000005): a new function is anon-executable
-- at birth by two independent mechanisms (PUBLIC's own default, and
-- Supabase's named default-privilege grant to anon) -- both lines are
-- required. Moot for actually invoking this function (Postgres does not
-- check EXECUTE privilege to fire a trigger, and a `returns trigger`
-- function can't be called directly as SQL regardless), but check-
-- share-visibility.mjs enumerates every SECURITY DEFINER function in
-- `public` and asserts anon has none of them -- a blanket rule, not a
-- per-function judgment call.
revoke all on function public.entries_resolve_volume_id() from public;
revoke execute on function public.entries_resolve_volume_id() from anon;
grant execute on function public.entries_resolve_volume_id() to authenticated;

-- "Creating a hive creates Volume 1, open." Same SECURITY DEFINER shape as
-- the trigger above -- private_hives_insert_own only grants the owner
-- INSERT on private_hives itself, not on hive_volumes.
create function public.private_hives_create_volume_one()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.hive_volumes (hive_id, ordinal) values (new.id, 1);
  return new;
end;
$$;

create trigger private_hives_create_volume_one_trigger
  after insert on public.private_hives
  for each row execute function public.private_hives_create_volume_one();

revoke all on function public.private_hives_create_volume_one() from public;
revoke execute on function public.private_hives_create_volume_one() from anon;
grant execute on function public.private_hives_create_volume_one() to authenticated;

-- Backfill: every hive that predates this migration gets its Volume 1,
-- carrying whatever sealed_at/sent_at it already held.
insert into public.hive_volumes (hive_id, ordinal, sealed_at, sent_at)
select id, 1, sealed_at, sent_at
from public.private_hives;

-- Backfill scopes entries.volume_id the same way the R1 trigger would have:
-- one open-or-sealed Volume 1 per hive, matched on hive_id alone, since no
-- hive can have more than one volume before this migration exists.
update public.entries e
set volume_id = v.id
from public.hive_volumes v
where v.hive_id = e.hive_id and v.ordinal = 1 and e.hive_id is not null;

-- Lumen's review (thread 83a020e9, 2026-08-26): the single-column
-- `volume_id references hive_volumes(id)` FK above proves volume_id names
-- SOME open volume of SOME owned hive -- never that it's the SAME hive
-- named by this row's own hive_id. A crafted insert (hive_id = A,
-- volume_id = B's open volume, both owned by the same caller) passes every
-- policy above; sealing A then never touches it (seal_volume matches by
-- volume_id, not hive_id), so the "only entries the hive actually owns"
-- guarantee 20260819000003 built the seal RPC to hold stops being a DB fact
-- and becomes an accident of well-behaved callers. Two constraints, not one
-- -- the composite FK alone is satisfied (MATCH SIMPLE) whenever EITHER
-- column is null, so it does nothing against hive_id = null paired with a
-- real volume_id (a personal-journal entry silently annexed into whichever
-- hive's volume that id names, flipped to 'packaged' the moment that hive
-- next seals). The check below is what actually closes that second path.
alter table public.hive_volumes
  add constraint hive_volumes_hive_id_id_key unique (hive_id, id);

alter table public.entries
  add constraint entries_hive_id_volume_id_fkey
    foreign key (hive_id, volume_id) references public.hive_volumes (hive_id, id);

alter table public.entries
  add constraint entries_volume_id_requires_hive_id
    check (volume_id is null or hive_id is not null);

-- private_hives.sealed_at/.sent_at keep their one-directional triggers
-- (20260815000004, 20260819000001) -- do not attempt to drop them, the
-- triggers guarantee they cannot lie -- but the sealed-content ENFORCEMENT
-- moves off them as of 20260826000002. Comments corrected here, not in the
-- migrations that shipped the original claims, per this schema's own
-- standing rule (20260815000002's note on owns_entry(), reused verbatim by
-- 20260819000001 point 7): the database is where the next reader checking
-- what a column actually guards will look.
comment on column public.private_hives.sealed_at is
  'When Volume 1 was sealed. As of 20260826000001 (hive_volumes), a hive can '
  'outlive one seal -- hive_volumes.sealed_at is the per-volume fact and the '
  'one entries/RLS enforcement actually reads (20260826000002). This column '
  'keeps its one-directional trigger (20260815000004) and is mirrored, not '
  'sourced, by seal_hive() (20260819000003, redefined in 20260826000002) '
  'purely so the shipped client''s existing sealedAt reads (HiveStore.js, '
  'HiveDetail.js) keep working without a client change in this ticket -- it '
  'is not the source of truth for anything past Volume 1.';

comment on column public.private_hives.sent_at is
  'When the hive was sent. As of 20260826000001 (hive_volumes), hive_volumes '
  'carries its own sent_at per volume for Project 17.2 (Delivery)''s future '
  'use, backfilled here as a one-time snapshot only -- nothing keeps it in '
  'sync with new sends yet. This column remains the live source of truth '
  'send_hive() (20260819000001) reads and writes; 20260826000002 does not '
  'touch send_hive.';

notify pgrst, 'reload schema';
