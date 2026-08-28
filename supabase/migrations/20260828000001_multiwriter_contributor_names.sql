-- ENG-58 / DES-21 §8 fast-follow (Sage, thread b4533a52, rulings §61-§64,
-- corrected across three rounds by Lumen and Pixel before being written).
-- Unblocks the REVEAL half of multi-writer hives (roster names at seal) --
-- ENG-61's create/invite UI (20260827, PR 8f211c1e) already ships without
-- this; this migration is the other half.

-- 1. entries.author_name_at_seal -- a per-entry snapshot, not a live join to
-- profiles.display_name. Subject-readable via entries_select_as_hive_subject
-- (20260819000001), the only policy that already gates the whole reveal --
-- deliberately not stored on hive_contributors, whose own SELECT policy
-- (owner + active contributor only, 20260827000001) has no subject clause at
-- all and would just relocate the RLS wall OPEN-1 already found on profiles.
alter table public.entries
  add column author_name_at_seal text;

comment on column public.entries.author_name_at_seal is
  'Snapshot of the author''s profiles.display_name at the moment seal_volume() '
  'sealed this entry. Null for entries never sealed. A snapshot, not a live '
  'join: profiles.display_name can change after seal, and a delivered '
  'keepsake''s signature must not (same "no live read of a delivered '
  'keepsake" ban as private_hives.contributor_names below).';

-- Addendum to seal_volume() (20260826000004): same UPDATE that flips
-- visibility to 'packaged' now also stamps the snapshot, one statement, one
-- transaction -- no window where a sealed entry has visibility='packaged' and
-- a null name. Everything else in this function is unchanged.
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

-- 2. private_hives.contributor_names -- NOT hive_volumes (§61 correction:
-- hive_volumes_select_own admits only the owner or an active contributor,
-- and the subject is permanently barred from ever being one --
-- private_hives_subject_not_active_contributor_trigger, 20260827000001 --
-- so a column there would sit in a table the one intended reader gets zero
-- rows from). Rides private_hives_select_as_subject (20260819000001), the
-- same policy subject_name already uses. not null default '{}': §23.1,
-- empty is a positive claim ("this hive had no other writers") that must be
-- distinguishable from "this row was never computed" -- a bare null would
-- collapse those two at the one surface that has to tell them apart.
alter table public.private_hives
  add column contributor_names text[] not null default '{}';

comment on column public.private_hives.contributor_names is
  'Names of every writer whose entries were sent in this hive, snapshotted at '
  'send time, first-appearance order, distinct per author (not per name -- '
  'two contributors who share a display name each get their own array '
  'element; contributor_names[] has no uniqueness guard by design, see '
  '20260827000001''s copy-vocab doc). Written only by send_hive(). Not a live '
  'read of profiles or hive_contributors: same "delivered keepsake" '
  'immutability posture as the signature itself.';

-- Addendum to send_hive() -- based on its LIVE body (20260819000002's
-- redefinition, which added the hive_send_events insert; 20260819000001's
-- original body is stale and must not be the source here, since past
-- migration files are never edited retroactively and a `create or replace`
-- against the older body would silently drop the feed-event insert. First
-- draft of this migration made exactly that mistake -- caught by
-- check-share-visibility going red (4 assertions: no hive_send_events row
-- landed, neither participant could read it, the "cannot be updated"
-- assertion tripped because recipient_id came back undefined from a row that
-- was never inserted) before this file was ever proposed for merge.
--
-- After the existing UPDATE flips 'packaged' entries to 'sent', compute the
-- roster from every now-sent entry (not just the batch that just
-- transitioned -- correct on a hive's second send too) and write it in the
-- same UPDATE that stamps sent_at, same transaction as before and as the
-- hive_send_events insert. Dedupe is on entries.user_id, not on the name
-- string (Pixel's finding, §62): writerCount (HiveStore.js) is a distinct-
-- author count, so a union over text would let two same-named contributors
-- collapse to one array element and undercount against it. The inner
-- `distinct on (user_id) ... order by user_id, entry_date, created_at, id`
-- picks each author's earliest entry; the outer array_agg re-sorts that by
-- first-appearance across authors, matching the canonical (entry_date,
-- created_at, id) sort entries_insert_own's siblings already use everywhere
-- else in this schema. coalesce(..., '{}') covers the empty-hive case
-- (Pixel's second finding, §64): none of seal_hive/seal_volume/send_hive
-- row-count-check the entries side of their UPDATEs, so a hive with zero
-- entries is reachable, and array_agg over zero rows is NULL, not '{}'.
--
-- Recompute-over-union isn't exercised today: private_hives_sent_at_immutable
-- (20260819000001) plus send_hive's own "already been sent" raise below mean
-- no hive can be sent twice yet. It becomes real the day something re-points
-- send_hive at hive_volumes the way 20260826000004 deferred ("Re-pointing
-- send_hive is deferred to whichever migration actually gives a client a
-- reason to call seal_volume() directly, Project 17.2") -- at that point a
-- hive gains a second send per volume, and this recompute is what makes it
-- correct on the second pass without a separate migration.
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

-- 3. Invite-time display_name guard -- the "Someone" class (§61 ruling:
-- refuse-at-invite, not coalesce-at-seal). profiles.display_name is already
-- `not null` at the column level (20260808000001), so the only failure mode
-- is empty/whitespace, and nothing guarded it in the invite path before this
-- migration. A placeholder name surviving to seal time would break the same
-- signature-integrity guarantee author_name_at_seal exists to protect, so
-- this refuses at the moment the roster gains the name rather than inventing
-- a null-object convention every render site downstream has to re-justify.
-- Deliberately NOT a roster-uniqueness guard (§63, ruled closed): two
-- contributors sharing a display name is the world stated faithfully, not a
-- defect -- see contributor_names' own comment above.
--
-- A plain inline `exists (select ... from profiles p where p.id = profile_id
-- ...)` does NOT work here, and shipped that way in this migration's first
-- draft before a dedicated gate (check-contributor-names.mjs) caught it live:
-- the WITH CHECK subquery runs as the inviting owner under `authenticated`,
-- subject to profiles' own RLS -- and profiles_select_own (20260808000001)
-- is `auth.uid() = id`, so an owner can never see anyone else's profile row
-- through it. That collapses this guard to "you may only invite yourself"
-- for every real invite, which would have shipped ENG-61's invite UI
-- silently non-functional. Same recursion-breaking shape as
-- is_hive_contributor()/is_volume_open() above: a SECURITY DEFINER helper
-- reads the fact directly, bypassing profiles' RLS instead of running
-- through it as the caller.
create function public.profile_has_display_name(p_profile_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_profile_id and length(trim(p.display_name)) > 0
  );
$$;

-- Same named-anon-revoke requirement as is_hive_contributor()/is_volume_open()
-- above: `revoke all from public` does not reach `anon` (20260808000001's
-- named default-privilege grant to anon survives a PUBLIC revoke untouched).
revoke all on function public.profile_has_display_name(uuid) from public;
revoke execute on function public.profile_has_display_name(uuid) from anon;
grant execute on function public.profile_has_display_name(uuid) to authenticated;

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
    and public.profile_has_display_name(profile_id)
  );

-- 4. Backfill, both columns. Runs before this migration's own writers ever
-- fire, so it only has to cover history: everything sealed or sent under
-- seal_hive/seal_volume/send_hive as they existed before this file. Backfilled
-- from current profiles.display_name -- best-available, not a true point-in-
-- time snapshot for entries sealed before today, flagged here rather than
-- silently treated as equivalent to a real seal-time capture. Zero rendering
-- surface today is true only until ENG-61's reveal half ships (Fizz's
-- eng61-reveal-plumbing branch, HiveStore.js selects) -- a sequencing fact,
-- not a permanent one.
update public.entries e
  set author_name_at_seal = p.display_name
  from public.profiles p
  where p.id = e.user_id
    and e.hive_id is not null
    and e.visibility in ('packaged', 'sent')
    and e.author_name_at_seal is null;

update public.private_hives h
  set contributor_names = coalesce((
    select array_agg(x.author_name_at_seal order by x.entry_date, x.created_at, x.id)
    from (
      select distinct on (e.user_id)
        e.user_id, e.author_name_at_seal, e.entry_date, e.created_at, e.id
      from public.entries e
      where e.hive_id = h.id and e.visibility = 'sent'
      order by e.user_id, e.entry_date, e.created_at, e.id
    ) x
  ), '{}')
  where h.sent_at is not null;

notify pgrst, 'reload schema';
