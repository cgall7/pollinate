-- ENG-60, row 1.9a (Fizz). Thread b57ad406/f2c15b7d, 2026-08-30.
--
-- §1B.36.25: month-1's closes_at base derives here, in the mint, not in
-- the client. Re-derived from `...0010`'s body of comb_open_rotation --
-- the highest-numbered prior definition at authoring time -- per this
-- table's own standing rule (§1B.36.8/.24): a create or replace is a
-- whole-body assertion, never a diff against the previous one.
--
-- p_closes_at becomes optional (default null). Omitted (the ordinary
-- case -- DES-29's create screen stops computing a timestamp at all), the
-- derived value is now() + the comb's own cadence -- the base case of
-- §1B.31.1iii's closes_at + k*cadence recurrence, reading the SAME
-- cadence column this row's own advance (below) already reads, so there
-- is exactly one number, not three (client, mint, advance).
--
-- An explicit p_closes_at is honoured ONLY when auth.uid() is null --
-- i.e. no session, which on this schema means service_role: this row's
-- own advance path (comb_advance_rotation, below) supplying
-- closes_at + k*cadence for month N+1. A real session's explicit
-- argument is IGNORED, not floored -- ignoring needs no threshold and
-- makes an organizer-supplied clock unrepresentable outright, rather
-- than merely bounded (§1B.36.25's own framing).
create or replace function public.comb_open_rotation(
  p_comb_id uuid,
  p_subject_profile_id uuid,
  p_closes_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_id uuid;
  v_cadence interval;
  v_closes_at timestamptz;
  v_subject_display_name text;
  v_hive_id uuid;
  v_ordinal int;
  v_rotation_id uuid;
  v_contributor_count int;
begin
  select c.owner_id, c.cadence into v_owner_id, v_cadence
  from public.combs c
  where c.id = p_comb_id;

  if v_owner_id is null then
    raise exception 'comb_open_rotation: comb not found' using errcode = '42501';
  end if;

  if auth.uid() is not null
    and auth.uid() is distinct from v_owner_id then
    raise exception 'comb_open_rotation: caller does not own this comb' using errcode = '42501';
  end if;

  -- §1B.36.25: derive the base case of the clock's own recurrence, or
  -- honour an explicit value ONLY from the caller with no session.
  if p_closes_at is not null and auth.uid() is null then
    v_closes_at := p_closes_at;
  else
    v_closes_at := now() + v_cadence;
  end if;

  -- ENG-94: repointed onto the shared subject-deliverable predicate
  -- (ENG-95). See `...0010`'s header -- this is the tombstone check plus
  -- the departure arm it was missing, not a new rule; unchanged here.
  if public.comb_subject_gone(p_comb_id, p_subject_profile_id) then
    raise exception 'comb_open_rotation: subject is gone (deleted account or left this comb)';
  end if;

  select p.display_name into v_subject_display_name
  from public.profiles p
  where p.id = p_subject_profile_id;

  -- Leg (b) deliberately absent: no check that p_subject_profile_id is an
  -- active row in comb_members. Gated at comb_open_rotation's own suite.
  insert into public.private_hives (owner_id, subject_name, is_collective, subject_profile_id)
  values (
    v_owner_id,
    coalesce(nullif(v_subject_display_name, ''), 'Someone'),
    true,
    p_subject_profile_id
  )
  returning id into v_hive_id;

  -- Roster snapshot: every ENROLLABLE comb member except the subject --
  -- active (removed_at is null) AND not tombstoned (ENG-100, §1B.36.9/.18).
  -- Unchanged from `...0010`.
  insert into public.hive_contributors (hive_id, profile_id, invited_by)
  select v_hive_id, m.profile_id, v_owner_id
  from public.comb_members m
  where m.comb_id = p_comb_id
    and m.removed_at is null
    and m.profile_id <> p_subject_profile_id
    and not exists (
      select 1
      from public.profiles p
      where p.id = m.profile_id
        and p.deleted_at is not null
    );

  get diagnostics v_contributor_count = row_count;

  -- ENG-100 (row 1.7b): month 1 is exempt from §1B.31.3's ≥2-ENROLLABLE
  -- floor, so this is the only place an empty writing roster is
  -- observable. Unchanged from `...0010`.
  if v_contributor_count = 0 then
    raise exception 'comb_open_rotation: no enrollable contributors for this rotation'
      using errcode = 'check_violation', constraint = 'comb_open_rotation_enrollable_floor';
  end if;

  select coalesce(max(r.ordinal), 0) + 1 into v_ordinal
  from public.comb_rotations r
  where r.comb_id = p_comb_id;

  insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at)
  values (p_comb_id, v_ordinal, v_hive_id, p_subject_profile_id, v_closes_at)
  returning id into v_rotation_id;

  return v_rotation_id;
end;
$$;

-- create or replace preserves the existing grants (authenticated,
-- service_role, revoked from anon) unaffected by a body-only replace.

-- comb_advance_rotation(p_comb_id): the server-side advance POLICY, carved
-- out of ENG-60 per §1B.31.1(ii) so OPS-9 (row 1.8) can depend on it
-- without a cycle (1.8 -> 1.9a -> ENG-93, not 1.8 -> 1.9 -> 1.8). Computes
-- the next subject and next closes_at, then calls ENG-93's
-- comb_open_rotation() -- the single mint body stays the only writer of
-- comb_rotations/private_hives, month 1 (organizer-chosen subject) and
-- month N+1 (derived subject) are genuinely different POLICIES over one
-- MECHANISM, not two guard surfaces (§1B.29.2(c)).
--
-- Two dormancy guards, both QUIET (return null, raise nothing) and both
-- IN-BODY -- not only in the tick's (OPS-9's) SELECT -- because this
-- function has direct callers besides the tick: this gate, and OPS-9's
-- finisher calling it in a loop (§1B.36.10's caller-floor-gap finding,
-- applied a second time at §1B.36.21(d): "a floor placed in the caller is
-- a floor the exempt caller does not have -- put the invariant where every
-- caller passes through it").
--
-- Guard 1 -- PRE-LAUNCH (§1B.31.3(i), acceptance at §1B.36.21/.22):
-- a comb with zero RESOLVED rotations ever (nothing sealed_at or
-- voided_at) is pre-launch, not dormant -- it belongs to ENG-93's
-- create-flow window between "insert the combs row" and "call
-- comb_open_rotation with the organizer's chosen subject," not to the
-- clock. MECHANISM: the derivation below is undefined without a prior
-- rotation to walk from -- no subject cursor (there is no "current"
-- subject), no base closes_at to add cadence to. HAZARD: a now()-based
-- fallback would silently mint month 1 over the organizer's own chosen
-- subject, mid-create-flow, before anyone was even invited (Sarah's month,
-- reassigned to whoever joined first). Revival -- deciding a dormant comb
-- should wake up -- is the clock's job (its WHERE already filters to >=1
-- resolved rotation), never this function's; this guard is defence in
-- depth for the direct-call boundary only, which is what makes "quiet" the
-- right verb here rather than a lost signal (checked against both
-- production callers: OPS-9's finisher runs this only after a successful
-- seal, and its revival probe already selects >=1 resolved -- neither can
-- ever reach this guard with zero resolved rotations, so it never fires on
-- main today; it exists for the day a caller doesn't honor that).
--
-- Guard 2 -- the ENROLLABLE FLOOR (Ruling 1/§1B.31.3(ii)): the derived
-- advance needs >= 2 ENROLLABLE members (comb_members.removed_at is null
-- AND profiles.deleted_at is null -- the word coined at §1B.36.9, adopted
-- here rather than re-implemented per §1B.36.10's R12 "adopt, don't copy"
-- pin, since ENG-100's mint-level floor and this pre-mint floor answer
-- different questions over the same population). At one enrollable member,
-- the derived subject IS that member and hive_contributors_not_hive_subject
-- refuses them as a contributor of their own hive -- nobody could write,
-- so the month would open, run its full window with zero possible authors,
-- and void quiet (Lumen's fabricated-void bar, reached by a longer road).
-- RULED (§1B.31.3(ii)): "at one, the comb stays dormant and raises
-- nothing" -- this governs every advance, not only revival, including a
-- live comb that shrinks to one enrollable member mid-rotation. Month 1 is
-- EXEMPT from this floor (its subject is organizer-chosen and may be a
-- non-member entirely -- "gate the giving, never the getting") -- that
-- exemption is exactly why ENG-100's mint-level floor exists as a SEPARATE
-- check: this floor never runs for month 1, since month 1 never reaches
-- this function at all.
--
-- Two indistinguishable quiet (null) returns is correct BY DESIGN
-- (§1B.36.22(a)): the discriminator is the comb_rotations record, not this
-- function's return value -- zero rotations ever = pre-launch, some but
-- none currently open = dormant. A caller needing the distinction queries
-- the table; this function doesn't owe it twice.
--
-- Next-subject/next-closes_at policy (§1B.31.1 Rulings 1+2, §1B.31.1(iii)
-- Lumen's downtime rider):
--   * Subject: comb_members ordered by joined_at, WRAPPING, skipping
--     removed_at-closed and tombstoned seats and NOBODY ELSE -- a quiet
--     month costs the comb a month, never a member their turn (an "earn
--     your turn" rule would turn the rotation into a scoreboard, §11's
--     rejected shape wearing a schedule). The walk starts from the most
--     recently RESOLVED rotation's subject_profile_id, regardless of
--     whether that person is still enrollable today -- if they've since
--     departed or been tombstoned, they're simply skipped by the
--     ENROLLABLE filter on the way past their old position, which needs
--     no special case: their joined_at position in the timeline still
--     anchors where "next" starts counting from.
--   * closes_at: the resolved rotation's own closes_at + k*cadence, the
--     first FUTURE boundary -- never now() + cadence, so a tick firing
--     late does not drift the comb's calendar. Floored at half a cadence
--     (Lumen's downtime rider): if the very next boundary is nearer than
--     that, skip to the one after, so an outage never mints an
--     hours-wide, un-notifiable window that voids quiet through no fault
--     of the writers. One rotation minted either way -- never fabricating
--     the skipped intermediate months as quiet-voids (a rotation that
--     never existed cannot be voided quiet; nobody could have written to
--     it, and a fabricated void states something false about people).
--     `cadence` is stored once on `combs` (ENG-93) specifically so this
--     number is never a second constant to keep in sync.
--
-- service_role only, same posture as seal_and_send_rotation (ENG-91,
-- §1B.31.2): NO auth.uid() check in the body -- there is no session to
-- check, since the clock calls this with none -- the GRANT boundary below
-- is the entire enforcement. An `authenticated` grant would be an
-- organizer force-advance nobody ruled (Lumen) -- if that's ever wanted,
-- it's a ruling, never a grant left lying around.
create function public.comb_advance_rotation(p_comb_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_has_resolved boolean;
  v_enrollable_count int;
  v_current_subject uuid;
  v_current_closes_at timestamptz;
  v_cadence interval;
  v_current_joined_at timestamptz;
  v_next_subject uuid;
  v_next_closes_at timestamptz;
  v_rotation_id uuid;
begin
  -- Guard 1: pre-launch. See header.
  select exists (
    select 1
    from public.comb_rotations r
    where r.comb_id = p_comb_id
      and (r.sealed_at is not null or r.voided_at is not null)
  ) into v_has_resolved;

  if not v_has_resolved then
    return null;
  end if;

  -- Guard 2: the ENROLLABLE floor. See header.
  select count(*) into v_enrollable_count
  from public.comb_members m
  join public.profiles p on p.id = m.profile_id
  where m.comb_id = p_comb_id
    and m.removed_at is null
    and p.deleted_at is null;

  if v_enrollable_count < 2 then
    return null;
  end if;

  -- The most recently resolved rotation anchors both halves of the derived
  -- advance: its subject_profile_id is the walk's starting position, its
  -- closes_at is the cadence base.
  select r.subject_profile_id, r.closes_at
    into v_current_subject, v_current_closes_at
  from public.comb_rotations r
  where r.comb_id = p_comb_id
    and (r.sealed_at is not null or r.voided_at is not null)
  order by r.ordinal desc
  limit 1;

  select c.cadence into v_cadence
  from public.combs c
  where c.id = p_comb_id;

  -- Next subject: walk forward from the current subject's position in the
  -- joined_at order, over ENROLLABLE members only. v_current_subject may
  -- no longer BE enrollable (departed/tombstoned since minting) or may
  -- never have been a comb_members row at all (month 1, organizer-chosen,
  -- exempt) -- either way this still anchors a position to walk from,
  -- deliberately not treated as a hazard: if it has no comb_members row,
  -- v_current_joined_at is null, the "after" search below finds nothing
  -- (nothing is greater than null), and the wrap fallback below picks the
  -- earliest eligible member -- exactly the behaviour wanted when there is
  -- no prior position to resume from.
  select m.joined_at into v_current_joined_at
  from public.comb_members m
  where m.comb_id = p_comb_id
    and m.profile_id = v_current_subject;

  select m.profile_id into v_next_subject
  from public.comb_members m
  join public.profiles p on p.id = m.profile_id
  where m.comb_id = p_comb_id
    and m.removed_at is null
    and p.deleted_at is null
    and m.joined_at > v_current_joined_at
  order by m.joined_at asc
  limit 1;

  if v_next_subject is null then
    -- Wrap: nobody enrollable joined after the current position (or there
    -- was no current position) -- resume from the earliest enrollable
    -- member. Guard 2 already proved at least 2 enrollable members exist,
    -- so this is guaranteed to find someone.
    select m.profile_id into v_next_subject
    from public.comb_members m
    join public.profiles p on p.id = m.profile_id
    where m.comb_id = p_comb_id
      and m.removed_at is null
      and p.deleted_at is null
    order by m.joined_at asc
    limit 1;
  end if;

  -- Next closes_at: first future boundary at closes_at + k*cadence, then
  -- the half-cadence downtime floor. See header for the reasoning.
  v_next_closes_at := v_current_closes_at + v_cadence;
  while v_next_closes_at <= now() loop
    v_next_closes_at := v_next_closes_at + v_cadence;
  end loop;

  if v_next_closes_at - now() < v_cadence / 2 then
    v_next_closes_at := v_next_closes_at + v_cadence;
  end if;

  v_rotation_id := public.comb_open_rotation(p_comb_id, v_next_subject, v_next_closes_at);

  return v_rotation_id;
end;
$$;

-- No grant to `authenticated`, deliberately, and load-bearing, not
-- incidental -- identical reasoning to seal_and_send_rotation's own grant
-- comment (…0003): this body has no auth.uid() check anywhere, because it
-- can't (no session when the clock calls it), so granting to
-- `authenticated` would let any logged-in user force-advance any comb the
-- instant they knew its id. The grant boundary is the only thing making
-- that safe.
revoke all on function public.comb_advance_rotation(uuid) from public;
revoke execute on function public.comb_advance_rotation(uuid) from anon;
revoke execute on function public.comb_advance_rotation(uuid) from authenticated;
grant execute on function public.comb_advance_rotation(uuid) to service_role;

notify pgrst, 'reload schema';
