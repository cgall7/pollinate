-- ENG-59 (Fizz, row 1.7, docs/strategy/POLLINATE_COMB_ROTATION.md §8.1/§8.6).
-- DES-37 Part 1's data source ("Anon preview function -- the invite code's
-- one legal source for headline + subject name + member count. No access
-- to auth state." GUIDES/DES-37_INVITE_LANDING_AND_NAME_COLLECTION.md).
--
-- Both holds this ticket's join RPC (20260830000004) left open are closed:
-- Deezine confirmed DES-37's landing needs pre-auth data (thread b57ad406,
-- 2026-08-30, 14:55:47), Lumen confirmed COPY-6's disclosure sits on the
-- pre-auth frame too (same thread, 14:54:08). "(a)" -- possession of the
-- invite code is the authorization, same as any invite-link product -- is
-- endorsed by both.
--
-- Scoped exactly as flagged when the hold was posted: same shape as
-- comb_member_count() (20260830000002:418-436) minus its session-based
-- auth, comb_members only, no entries table anywhere in its body.
-- comb_member_count() cannot be reused directly -- its own is_comb_member()
-- gate gives an anon/non-member caller a confident-wrong zero (§1B.22.1's
-- "fails open on aggregates" class, Vector's finding), not a refusal, which
-- would render "0 people are writing for Sarah" to a stranger holding a
-- perfectly good link. This function replaces that gate with the invite
-- code itself as the authorization -- the only one anon possession proves.
--
-- Identical not-found for invalid and (any future) revoked/expired code --
-- Lumen's boundary note, thread b57ad406, 2026-08-30, 16:15:36: entropy
-- (122 bits, gen_random_uuid()) closes enumeration-by-guessing; it does not
-- close a response that lets a caller distinguish "never existed" from
-- some other refusal once one exists. `combs` has no expiry/revocation
-- column today -- an unresolved invite_code has exactly one cause -- so
-- this is the whole exercisable surface of that property right now: one
-- lookup, one early return, zero rows, no exception, no partial fields.
-- The obligation this function takes on is for later: if a revoke/expire
-- column is ever added, that check must route through this SAME empty-set
-- return, not a second differently-shaped or differently-timed refusal.
--
-- Membership count is a plain `comb_members` count, not the small-N
-- suppression DES-37 specifies (absent at N=1-2, present at N=3+) -- that
-- is presentation, decided by the landing screen off this same raw number,
-- not baked into the data source (matches comb_member_count's own posture:
-- a count function returns the count).
--
-- Subject: read off the comb's OPEN rotation only, per Lumen's landing
-- ruling (thread b57ad406, §1B.31.3 follow-up, 2026-08-30 17:16:01):
-- "which subject? By the source-naming rule the answer must be the open
-- rotation's" -- and §1B.31.2/.3 already established two ruled states
-- where no open rotation exists while the invite link still works
-- (pre-launch: zero rotations ever; dormant: prior rotations, none open).
-- A landing that names a subject off a stale sealed/voided rotation would
-- be the same false-statement class the clock was barred from in §1B.31.1
-- -- "Sarah" could already have received her reveal, or never been chosen
-- at all. So there is no ordinal fallback: `has_active_month` is an
-- explicit record (never improvised copy, per the standing pin) rather
-- than a silently-null subject_name doing double duty for two different
-- reasons. Distinguishing pre-launch from dormant by copy is COPY-6's job
-- off this same boolean plus member_count, not this function's.
create function public.comb_preview_by_invite_code(p_invite_code text)
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
      where m.comb_id = v_comb_id
        and m.removed_at is null
    )
  from public.combs c
  join public.profiles p_owner on p_owner.id = v_owner_id
  left join public.profiles p_subject on p_subject.id = v_subject_id
  where c.id = v_comb_id;
end;
$$;

-- Anon-callable by design (the pre-auth landing's whole point) and also
-- granted to authenticated -- a signed-in person can tap someone else's
-- invite link too (§1B.1 names no single-inviter restriction), and this
-- function's only authorization input is the code, same for both roles.
revoke all on function public.comb_preview_by_invite_code(text) from public;
grant execute on function public.comb_preview_by_invite_code(text) to anon;
grant execute on function public.comb_preview_by_invite_code(text) to authenticated;

notify pgrst, 'reload schema';
