-- ENG-46, re-point half (Sage, thread 83a020e9, 2026-08-26). R3's second
-- migration -- ships only after 20260826000001's backfill, so every
-- existing row already carries a correct volume_id and there is no window
-- where the client writes NULL against a policy that requires one.
--
-- Moves the sealed-content guard on entries from private_hives.sealed_at to
-- the volume it actually applies to. Ruled (Sage, 2026-08-25, §17.1): "a
-- hive-level mirror of 'current volume's sealed_at' would read null
-- essentially always -- it cannot distinguish 'Volume 2 is open' from
-- 'nothing has ever sealed.'" Without this re-point, sealing Volume 1 would
-- permanently lock the hive against ever accepting an entry again --
-- private_hives.sealed_at is one-directional and never clears, so the old
-- guard has no way to represent "Volume 2 is open" once anything has ever
-- sealed. hive_volumes.sealed_at, keyed per row, does.
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
          and v.hive_id in (select id from public.private_hives where owner_id = auth.uid())
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
          and v.hive_id in (select id from public.private_hives where owner_id = auth.uid())
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
            and v.hive_id in (select id from public.private_hives where owner_id = auth.uid())
        )
        -- Feed/hive coupling direction two (20260819000001 point 6),
        -- unchanged -- an already-shared entry may not land in an open
        -- volume either.
        and not exists (select 1 from public.shares s where s.entry_id = entries.id)
      )
    )
  );

drop policy "entries_delete_own" on public.entries;
create policy "entries_delete_own"
  on public.entries for delete
  using (
    auth.uid() = user_id
    and (
      hive_id is null
      or exists (
        select 1 from public.hive_volumes v
        where v.id = volume_id
          and v.sealed_at is null
          and v.hive_id in (select id from public.private_hives where owner_id = auth.uid())
      )
    )
  );

-- seal_volume(): the real per-volume seal. Same single-RPC-one-transaction
-- shape as seal_hive() (20260819000003, the "empty reveal" guard that
-- migration exists to prevent applies unchanged) -- flip this volume's own
-- entries, stamp its sealed_at, open the next volume, all in one
-- transaction so the flag and the entries it depends on can't split.
-- Protected against a double-seal race by hive_volumes_one_open_per_hive
-- (R2, 20260826000001): the loser's insert of the next ordinal hits
-- unique_violation instead of producing two open volumes.
create function public.seal_volume(p_hive_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_id uuid;
  v_volume_id uuid;
  v_ordinal int;
begin
  select h.owner_id, v.id, v.ordinal
    into v_owner_id, v_volume_id, v_ordinal
  from public.private_hives h
  join public.hive_volumes v on v.hive_id = h.id and v.sealed_at is null
  where h.id = p_hive_id;

  if not found or v_owner_id <> auth.uid() then
    raise exception 'seal_volume: hive not found';
  end if;

  update public.entries
    set visibility = 'packaged'
    where volume_id = v_volume_id and visibility = 'private';

  update public.hive_volumes
    set sealed_at = now()
    where id = v_volume_id;

  insert into public.hive_volumes (hive_id, ordinal)
    values (p_hive_id, v_ordinal + 1);
end;
$$;

-- No `grant execute ... to authenticated` here, unlike seal_hive/send_hive
-- (Lumen's review, thread 83a020e9, 2026-08-26): seal_hive() below still
-- reaches this function fine without it -- a SECURITY DEFINER function's
-- internal calls check the DEFINER's own privilege, not the original
-- caller's -- so leaving authenticated ungranted costs the happy path
-- nothing. Granting it would make seal_volume directly callable over
-- PostgREST today, with no client that has a reason to (Project 17.2 is
-- what gives one). A direct call would seal Volume 1 without stamping
-- private_hives.sealed_at -- the one way to make seal_hive's mirror lie --
-- bounded (send_hive still refuses until seal_hive's own stamp lands) but
-- not worth leaving open before anything needs it.
revoke all on function public.seal_volume(uuid) from public;
revoke execute on function public.seal_volume(uuid) from anon;
revoke execute on function public.seal_volume(uuid) from authenticated;

-- seal_hive() (20260819000003) is retired by seal_volume() above, but the
-- shipped client still calls it by name (HiveStore.js:158) and reads
-- private_hives.sealed_at directly in three places for its UI (the gold
-- card, HiveDetail's sealed state, hiding "+ Add Entry") -- none of that is
-- in this ticket's scope, so seal_hive can't simply be dropped. Redefined,
-- not left in place: it now delegates the actual seal to seal_volume() (so
-- the re-pointed guards above actually unlock the next volume), then keeps
-- writing private_hives.sealed_at exactly as before it -- same "already
-- sealed" precondition, same exception message SendHive.js/SealHive.js
-- string-match on, checked BEFORE calling seal_volume() so a second call
-- fails exactly like it always has instead of quietly sealing Volume 2.
-- This mirror is a deliberate, flagged deviation from 20260826000001's own
-- "read-only history, never written by new code" comment -- the
-- alternative is breaking every sealed-state read in the shipped app with
-- no client change bundled in this migration. Drop the mirror write once
-- the client reads through hive_volumes instead.
create or replace function public.seal_hive(p_hive_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_id uuid;
  v_sealed_at timestamptz;
begin
  select owner_id, sealed_at
    into v_owner_id, v_sealed_at
  from public.private_hives
  where id = p_hive_id;

  if not found or v_owner_id <> auth.uid() then
    raise exception 'seal_hive: hive not found';
  end if;

  if v_sealed_at is not null then
    raise exception 'seal_hive: hive has already been sealed';
  end if;

  perform public.seal_volume(p_hive_id);

  update public.private_hives
    set sealed_at = now()
    where id = p_hive_id;
end;
$$;

-- send_hive() (20260819000001) is deliberately NOT touched here. Its own
-- "must be sealed" precondition reads private_hives.sealed_at, which
-- seal_hive() above continues to mirror exactly as before -- and since
-- seal_hive is the only path that can ever seal a hive today (seal_volume
-- has no caller yet beyond seal_hive itself), that mirror stays accurate
-- for as long as the shipped client has no way to reach a second volume.
-- Re-pointing send_hive is deferred to whichever migration actually gives a
-- client a reason to call seal_volume() directly (Project 17.2, Delivery).
notify pgrst, 'reload schema';
