-- ENG-101, §8.6 Phase 1 row 1.19 (Fizz). Scope is §1B.38.31-.39 of
-- docs/strategy/POLLINATE_COMB_ROTATION.md (Vector, ratified by Sage and
-- Lumen, 2026-08-31) -- canon governs, this comment cites rather than
-- restates. Minted as a build row 2026-09-04 (Lumen, CEO-action-items
-- thread) after the ratified scope sat four days with no address and was
-- independently re-derived twice. Re-verified live-body-current the same
-- day (§1B.38.32 §4's "resolve every function to its LAST definition"):
-- `seal_volume` = 20260828000001:27, `send_hive` = 20260828000001:123,
-- `hive_contributors_insert_owner` = 20260827000001:247.
--
-- Two refusals a rotation-linked hive needs and does not have today --
-- neither function has ever heard of `comb_rotations`:
--
-- 1. `seal_volume` (reached through `seal_hive`'s unguarded `perform`,
--    which has no exception block of its own -- a raise here propagates
--    straight through it, so this is the only refusal `seal_hive` needs).
--    A manual seal on a rotation hive seals `hive_volumes`/`private_hives`
--    but leaves `comb_rotations.sealed_at`/`voided_at` both null --
--    `comb_rotations_one_open_per_comb` (20260830000002) then keeps that
--    row the comb's one open rotation forever, and the next scheduler tick
--    that reaches `private_hives_sealed_at_immutable`
--    (20260815000004) raises on the already-sealed row, permanently. One
--    tap wedges the comb.
--
-- 2. `send_hive`. `seal_and_send_rotation`'s void path (20260830000009,
--    ENG-95) stamps `private_hives.sealed_at` but deliberately never
--    `sent_at` -- a voided month (empty, or a departed/tombstoned
--    subject) is a resting chapter, not a delivery. `send_hive` has no
--    rotation awareness, so its ordinary guard ladder (owner, sealed,
--    not-yet-sent, has a subject, connected friend) is satisfiable on a
--    voided rotation whenever organizer and subject are friends outside
--    the comb -- exactly the case ENG-95 exists to withhold, delivered by
--    hand instead.
--
-- Both keyed on `comb_rotations` linkage (`unique (hive_id)`, that
-- table's own comment), never `is_collective` -- an ordinary multi-writer
-- hive (`CreateHive`'s "Me and others" toggle) is `is_collective` and has
-- no `comb_rotations` row; keying on that flag would refuse a population
-- these functions have always served.
--
-- Both reasons are distinguishable at the RPC entry point, not merely the
-- function -- the client regexes on the raised reason, and it sees the
-- union of every function reachable through one `rpc()` call
-- (`seal_hive` -> `seal_volume`, both already raise 'hive not found').
create or replace function public.seal_volume(p_hive_id uuid)
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

  if exists (select 1 from public.comb_rotations r where r.hive_id = p_hive_id) then
    raise exception 'seal_volume: hive is part of a comb rotation and cannot be sealed manually';
  end if;

  update public.entries e
    set visibility = 'packaged',
        author_name_at_seal = p.display_name
    from public.profiles p
    where p.id = e.user_id
      and e.volume_id = v_volume_id
      and e.visibility = 'private';

  update public.hive_volumes
    set sealed_at = now()
    where id = v_volume_id;

  insert into public.hive_volumes (hive_id, ordinal)
    values (p_hive_id, v_ordinal + 1);
end;
$$;

create or replace function public.send_hive(p_hive_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_id uuid;
  v_subject_id uuid;
  v_sealed_at timestamptz;
  v_sent_at timestamptz;
  v_contributor_names text[];
begin
  select owner_id, subject_profile_id, sealed_at, sent_at
    into v_owner_id, v_subject_id, v_sealed_at, v_sent_at
  from public.private_hives
  where id = p_hive_id;

  if not found or v_owner_id <> auth.uid() then
    raise exception 'send_hive: hive not found';
  end if;

  if exists (select 1 from public.comb_rotations r where r.hive_id = p_hive_id) then
    raise exception 'send_hive: hive is part of a comb rotation and cannot be sent manually';
  end if;

  if v_sealed_at is null then
    raise exception 'send_hive: hive must be sealed before it can be sent';
  end if;

  if v_sent_at is not null then
    raise exception 'send_hive: hive has already been sent';
  end if;

  if v_subject_id is null then
    raise exception 'send_hive: hive has no subject to send to';
  end if;

  if not exists (
    select 1 from public.honeycomb_connections c
    where c.status = 'accepted'
      and (
        (c.requester_id = v_owner_id and c.addressee_id = v_subject_id)
        or (c.addressee_id = v_owner_id and c.requester_id = v_subject_id)
      )
  ) then
    raise exception 'send_hive: owner and subject are not a connected friend';
  end if;

  update public.entries
    set visibility = 'sent'
    where hive_id = p_hive_id and visibility = 'packaged';

  select coalesce(array_agg(x.author_name_at_seal order by x.entry_date, x.created_at, x.id), '{}')
    into v_contributor_names
  from (
    select distinct on (e.user_id)
      e.user_id, e.author_name_at_seal, e.entry_date, e.created_at, e.id
    from public.entries e
    where e.hive_id = p_hive_id and e.visibility = 'sent'
    order by e.user_id, e.entry_date, e.created_at, e.id
  ) x;

  update public.private_hives
    set sent_at = now(),
        contributor_names = v_contributor_names
    where id = p_hive_id;

  insert into public.hive_send_events (sender_id, recipient_id)
    values (v_owner_id, v_subject_id);
end;
$$;

-- 3. The invite belt: `hive_contributors_insert_owner`'s WITH CHECK
-- (20260827000001:247-256) has no rotation term either -- the organizer's
-- shipped shelf currently has no route to a rotation-linked hive's
-- HiveDetail (`listHives`, 20260828000001's own successor, already
-- filters comb hives out -- ENG-98/DES-39), so this is defense in depth
-- against the day a detail route grows one, not a live hole. A rotation's
-- roster is comb membership (`comb_open_rotation`/`comb_advance_rotation`
-- mint every seat server-side); a hand invite onto that hive would put a
-- writer on the roster outside comb membership entirely.
drop policy "hive_contributors_insert_owner" on public.hive_contributors;
create policy "hive_contributors_insert_owner"
  on public.hive_contributors for insert
  with check (
    invited_by = auth.uid()
    and exists (
      select 1 from public.private_hives h
      where h.id = hive_id and h.owner_id = auth.uid() and h.is_collective
        and (h.subject_profile_id is null or h.subject_profile_id <> profile_id)
    )
    and not exists (select 1 from public.comb_rotations r where r.hive_id = hive_contributors.hive_id)
  );

notify pgrst, 'reload schema';
