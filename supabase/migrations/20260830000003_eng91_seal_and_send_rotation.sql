-- ENG-91 (Sage, row 1.8a, thread b57ad406, 2026-08-30). "Server-side
-- seal-and-send, gated on the window closing, not caller identity." The
-- pole for MVP-Comb's definition of done: ENG-58 -> ENG-91 -> ENG-60.
--
-- Consolidates a full session's worth of rulings against this same
-- function, in the order they were made -- cited inline below rather than
-- summarized, per this schema's own "the database is where the next reader
-- will look" convention:
--
--   §1B.16  seal-and-send fused, one RPC, one transaction; zero-entry is
--           void-and-record, not deliver.
--   Vector (event 2)  DES-22's blank-hexagon fix is a live join
--           (comb_co_member_names/comb_member_count, ENG-92's scope, not
--           this file); item 3 here is the frozen-snapshot backstop.
--   Vector (event 4, self-corrected)  pre-seal account deletion cannot
--           freeze a blank name -- delete_own_account deletes the entry
--           thirty lines before it blanks display_name (20260830000001:
--           150-181) -- so the coalesce below is a backstop for classes
--           that blank a name WITHOUT deleting the entry (the one-time
--           backfill; any future path), never the fix for that window.
--           The real finding in that message: a mid-month departure
--           destroys a letter written for someone else, silently. Fixed
--           here by recording WHY a rotation voided, not by keeping the
--           letter (§1B.19 already ruled the entry itself is unshared
--           private content, correctly deleted -- see O9 for whether the
--           writer should be told, unruled, not this ticket).
--   Lumen (event 3)  token ruled: 'A writer'. Stored, never a sentinel;
--           never branched on downstream.
--   Lumen (event 5)  the departed/quiet distinction is a RECORD, not a
--           rendered surface -- store the state, ship zero improvised
--           copy. DES-31's fold owns the words, when it renders at all.
--   Vector (event 6)  fifth silent-loss door: 20260826000004's re-point
--           removed the sealed-hive refusal (moved it to
--           hive_volumes.sealed_at, which a fresh successor volume clears)
--           and nothing replaced it for a hive that seals once and sends
--           once. Ruled: do NOT open a successor volume for a rotation
--           hive; DO keep writing the private_hives.sealed_at mirror (five
--           shipped client reads still depend on it, 20260826000004:
--           138-153).
--   Vector (event 7 / "new message")  the mirror write is promoted from a
--           nicety to an ACCEPTANCE ROW: after this function seals a
--           rotation, getHive(hiveId).sealedAt must be non-null, or
--           COPY-14's neutral-retry cell (the one that should be
--           unreachable) starts firing for real and reads as a copy bug in
--           a file nobody touched here.
--
-- Authorization is deliberately NOT auth.uid(): this function has to be
-- callable with no session at all (ENG-60's future clock-driven
-- auto-advance, no user tapped anything), so time (closes_at) is the only
-- gate, and "is the caller allowed to do this" is answered by the GRANT
-- below, not a check inside the body -- same posture as seal_volume()
-- (20260826000004) not being grantable to `authenticated`, one step
-- further: this one isn't grantable to authenticated at all, only
-- service_role. See the grant block's own comment for why that boundary is
-- load-bearing, not incidental.
--
-- "Authorized by comb membership, not honeycomb_connections friendship"
-- (Sage, thread b57ad406, 12:27): send_hive()'s connected-friend check
-- (20260819000001) has no comb analogue -- a comb's organizer and this
-- month's subject are not necessarily friends, they're both members of the
-- same comb. The equivalent fact this function checks before delivering is
-- "is the subject still an active member of the comb this rotation
-- belongs to," not a honeycomb_connections row.
alter table public.comb_rotations
  add column voided_reason text;

alter table public.comb_rotations
  add constraint comb_rotations_voided_reason_shape
    check (
      (voided_at is null) = (voided_reason is null)
      and (voided_reason is null or voided_reason in ('quiet', 'departed', 'subject_gone'))
    );

comment on column public.comb_rotations.voided_reason is
  'Why a voided rotation delivered nothing. ''quiet'': the window closed '
  'with zero entries and the roster was intact throughout. ''departed'': '
  'zero entries AND the hive currently has no active contributors left -- '
  'the writers left, not "nobody felt like it." ''subject_gone'': the '
  'rotation''s subject was tombstoned or left the comb before the window '
  'closed, so there was no one to deliver to regardless of entry count. A '
  'RECORD, not a rendered surface (Lumen, thread b57ad406) -- C1''s '
  'denominator and DES-31''s rotation-state fold are the intended '
  'consumers; nothing in MVP-Comb renders this column directly, and no '
  'improvised copy should be written against it before DES-31 rules the '
  'words.';

-- seal_and_send_rotation(): the fused RPC. One rotation, one call, one of
-- three outcomes (deliver / void-quiet / void-departed / void-subject-gone
-- -- four labels, three *shapes*: void always seals-and-preserves, never
-- sends). Idempotent: a rotation that has already resolved (sent_at or
-- voided_at set) is a no-op success, not an error -- unlike send_hive's
-- "already been sent" raise, because this function's caller is expected to
-- be a retry-happy scheduler with no user watching for an error toast.
create function public.seal_and_send_rotation(p_rotation_id uuid)
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
  v_subject_deleted_at timestamptz;
  v_subject_active_member boolean;
  v_entry_count int;
  v_departed boolean;
  v_void_reason text;
  v_contributor_names text[];
begin
  -- Row lock: two overlapping scheduler runs for the same rotation must not
  -- both decide "zero entries" and both try to void it, or one seal and one
  -- void the same window on a race. FOR UPDATE serializes them; the second
  -- caller blocks here until the first commits, then reads its result via
  -- the idempotency check below instead of racing it.
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

  -- Idempotent no-op: already resolved, either way.
  if v_sent_at is not null or v_voided_at is not null then
    return;
  end if;

  -- Time is the only gate -- there is no caller identity to check.
  if v_closes_at > now() then
    raise exception 'seal_and_send_rotation: rotation has not closed yet';
  end if;

  select v.id into v_volume_id
  from public.hive_volumes v
  where v.hive_id = v_hive_id and v.sealed_at is null;

  -- Should be unreachable: a rotation hive gets Volume 1 at creation
  -- (private_hives_create_volume_one, 20260826000003) and this function is
  -- the only thing that can ever seal a rotation hive's one-and-only
  -- volume (deliberately does not open a successor -- see below), so a
  -- second call finds v_sent_at/v_voided_at set above and returns before
  -- reaching here. A defensive raise, not a reachable branch under any
  -- path this migration creates.
  if v_volume_id is null then
    raise exception 'seal_and_send_rotation: hive has no open volume';
  end if;

  select h.owner_id into v_owner_id
  from public.private_hives h
  where h.id = v_hive_id;

  -- "Authorized by comb membership, not friendship": is the subject still
  -- someone this comb can deliver to? Checked directly against
  -- comb_members/profiles (SECURITY DEFINER bypasses their RLS, same
  -- reasoning as is_comb_member() -- this isn't the auth.uid()-scoped
  -- helper, since there is no auth.uid() here).
  select p.deleted_at into v_subject_deleted_at
  from public.profiles p
  where p.id = v_subject_id;

  select exists (
    select 1 from public.comb_members m
    where m.comb_id = v_comb_id and m.profile_id = v_subject_id and m.removed_at is null
  ) into v_subject_active_member;

  select count(*) into v_entry_count
  from public.entries e
  where e.volume_id = v_volume_id and e.visibility = 'private';

  if v_subject_deleted_at is not null or not v_subject_active_member then
    v_void_reason := 'subject_gone';
  elsif v_entry_count = 0 then
    -- departed vs quiet: did the roster empty out, or did an intact
    -- roster simply not write this month? "Currently has no active
    -- contributors" rather than "someone's removed_at falls inside the
    -- window" -- the latter would misfire on a comb that replaced a
    -- departed writer with a new one mid-window and still went quiet for
    -- an unrelated reason; "nobody is left to have written" is the
    -- narrower, correct claim.
    select not exists (
      select 1 from public.hive_contributors c
      where c.hive_id = v_hive_id and c.removed_at is null
    ) into v_departed;
    v_void_reason := case when v_departed then 'departed' else 'quiet' end;
  else
    v_void_reason := null; -- deliver
  end if;

  if v_void_reason is not null then
    -- Void path, all three reasons: seal and preserve, never send. Letters
    -- already written are not deleted (keep-and-disclose's own posture,
    -- ENG-84) -- only entries.author_name_at_seal is stamped, same
    -- coalesce backstop as the deliver path below, for the same reason: a
    -- blank name can only reach this UPDATE through a path that blanks
    -- display_name without deleting the entry first, which is exactly the
    -- class this guard exists for (see the file header).
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
    -- Deliberately no successor volume -- see the deliver path's own
    -- comment below, identical reasoning applies to every branch.

    update public.private_hives
      set sealed_at = now()
      where id = v_hive_id;

    -- comb_rotations.sealed_at is NOT set here, deliberately --
    -- comb_rotations_sealed_xor_voided (20260830000002) declares delivery
    -- (sealed_at) and abandonment (voided_at) mutually exclusive on THIS
    -- table: "the alternative to delivery for a zero-entry window, not a
    -- step on the way to it." That's a claim about comb_rotations' own
    -- terminal state, distinct from hive_volumes.sealed_at/
    -- private_hives.sealed_at above, which this function sets on every
    -- branch (deliver or void) because the underlying hive still needs to
    -- stop accepting writes and needs the client-read mirror regardless of
    -- whether this month delivered.
    update public.comb_rotations
      set voided_at = now(),
          voided_reason = v_void_reason
      where id = p_rotation_id;

    return;
  end if;

  -- Deliver path. Same private->packaged->sent shape as seal_volume()
  -- (20260826000004) + send_hive() (20260828000001's addendum), fused into
  -- one transaction instead of two RPCs, with two deviations, both ruled
  -- above: the coalesce backstop on the name snapshot, and no successor
  -- volume.
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

  -- NOT `insert into hive_volumes (hive_id, ordinal) values (...)`. Every
  -- other seal path in this schema (seal_volume) opens a successor because
  -- a hive is a permanent relationship that outlives any one volume
  -- (§17.1). A rotation hive is the opposite shape: one month, one seal,
  -- one send (comb_rotations_one_open_per_comb's own ordinal advance is
  -- what represents "next month," a NEW comb_rotations row with a NEW
  -- private_hives row, minted by ENG-60 -- not a second volume on this
  -- one). hive_volumes_one_open_per_hive (20260826000003) is a PARTIAL
  -- unique index on `sealed_at is null` -- zero open volumes is a
  -- permitted state, not a constraint violation, so skipping this insert
  -- is legal. Without this line, entries_resolve_volume_id_trigger
  -- (20260826000003) would stamp a new entry from the freshly-opened
  -- successor and entries_insert_own would admit it (Vector's fifth-door
  -- finding, event 6): a contributor writing into ContributingHive at the
  -- exact moment this function runs would succeed, land in a volume that
  -- is never packaged or sent, and vanish. Skipping the insert makes that
  -- write hit 42501 instead (no open volume => entries_resolve_volume_id
  -- leaves volume_id null => entries_insert_own's `exists (select ...
  -- from hive_volumes ...)` finds nothing) -- COPY-14's seat-closed-or-
  -- sealed resolution (Lumen, event 7) depends on this refusal actually
  -- existing.
  --
  -- KNOWN, CURRENTLY UNREACHABLE GAP, flagged rather than silently
  -- assumed closed: seal_volume()/seal_hive() (20260826000004) are
  -- untouched by this migration and still open a successor volume for ANY
  -- hive, including a comb rotation's. If a future client ever wires a
  -- manual "seal" affordance onto a comb-rotation hive (today's shipped
  -- HiveDetail/ContributingHive screens have no path to one -- ENG-59/60's
  -- UI doesn't exist yet), that legacy path would reopen this exact hole
  -- for that one hive. Not fixed here: changing seal_volume()'s own
  -- behavior for regular (non-rotation) multi-writer hives is out of this
  -- ticket's scope and Project 17.2 depends on it continuing to open a
  -- successor. Whoever wires ENG-59/60's client UI should route a comb
  -- rotation's "seal early" affordance, if one is ever built, through THIS
  -- function (or a variant of it), never through seal_hive().

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

-- No grant to `authenticated`, deliberately, and this is load-bearing, not
-- incidental: the function body above has NO auth.uid() check anywhere --
-- it can't, since it has to run with no session at all -- so if this were
-- granted to `authenticated`, any logged-in user could call it with any
-- rotation id the instant that rotation's closes_at passed and force an
-- early seal-and-send for a comb they have nothing to do with. Time
-- (closes_at) is a real gate against calling it EARLY; it is not a gate
-- against calling it as the WRONG PERSON, because there is no person to
-- check. The grant boundary is what makes that safe: only service_role
-- (ENG-60's future scheduler, holding the service key, never a user's JWT)
-- can reach this function at all.
revoke all on function public.seal_and_send_rotation(uuid) from public;
revoke execute on function public.seal_and_send_rotation(uuid) from anon;
revoke execute on function public.seal_and_send_rotation(uuid) from authenticated;
grant execute on function public.seal_and_send_rotation(uuid) to service_role;

notify pgrst, 'reload schema';
