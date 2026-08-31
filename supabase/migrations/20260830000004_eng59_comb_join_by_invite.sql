-- ENG-59 (Fizz, row 1.7, docs/strategy/POLLINATE_COMB_ROTATION.md §8.1/§8.6).
-- The join RPC `20260830000002` named directly but did not build
-- ("comb_members has no INSERT policy... ENG-59's future
-- comb_join_by_invite_code() RPC" -- :328-337 of that file). Only the
-- post-auth join, per the split posted in thread b57ad406, 2026-08-30: the
-- anon-callable invite-landing preview (Vector's "before Fizz builds the
-- grant" question, (a) vs (b) on where the disclosure sentence sits) is a
-- separate function and grant, held pending Deezine/DES-37 and Lumen/COPY-6.
-- This RPC was always going to be `authenticated`-only regardless of how
-- that question resolves -- ENG-83's deep-link-to-signed-in-member path
-- lands a caller with a session before this is ever called.
--
-- Authorization: `auth.uid()` is the joiner, taken from the session, not a
-- parameter -- same shape as every other self-referential insert in this
-- schema (`combs_create_owner_membership`). Possession of `p_invite_code` is
-- the ONLY gate on which comb; there is no owner-approval step, matching
-- §1B.1's "invite-by-link" framing and the table comment's "no single
-- inviter to attribute."
--
-- Idempotent on an already-active member (SELECT-then-return, not
-- INSERT-and-catch): tapping your own comb's invite link a second time is
-- not an error path, it's `check-comb-rotation-seal-send`'s neighbour
-- reasoning -- a retry/re-tap should behave like "you're in," not surface a
-- constraint violation to the UI. A previously-removed member is NOT
-- idempotent, deliberately: `comb_members_removed_at_immutable`
-- (`20260830000002:193-207`) and the table's own PK shape make re-joining
-- unrepresentable ("not even expressible without a delete this table also
-- doesn't allow"), so that path raises a named, distinct exception instead
-- of falling through to a generic unique-violation.
--
-- No cap check: ENG-85 (the free-tier-5 enforcement) is unbuilt and
-- disabled per §8.5 -- "build the invite path against 20, not 5." Adding a
-- cap here would be a second enforcement path to keep in sync with ENG-85's
-- eventual one, the exact anti-pattern `comb_members`'s own no-INSERT-policy
-- comment names ("a single choke point instead of a second enforcement
-- path").
create function public.comb_join_by_invite_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_comb_id uuid;
  v_already_active boolean;
  v_previously_removed boolean;
begin
  select c.id into v_comb_id
  from public.combs c
  where c.invite_code = p_invite_code;

  if v_comb_id is null then
    raise exception 'comb_join_by_invite_code: invalid invite code';
  end if;

  select
    exists (
      select 1 from public.comb_members m
      where m.comb_id = v_comb_id and m.profile_id = auth.uid() and m.removed_at is null
    ),
    exists (
      select 1 from public.comb_members m
      where m.comb_id = v_comb_id and m.profile_id = auth.uid() and m.removed_at is not null
    )
  into v_already_active, v_previously_removed;

  if v_previously_removed then
    raise exception 'comb_join_by_invite_code: previously removed from this comb';
  end if;

  if v_already_active then
    return v_comb_id;
  end if;

  insert into public.comb_members (comb_id, profile_id) values (v_comb_id, auth.uid());

  return v_comb_id;
end;
$$;

revoke all on function public.comb_join_by_invite_code(text) from public;
revoke execute on function public.comb_join_by_invite_code(text) from anon;
grant execute on function public.comb_join_by_invite_code(text) to authenticated;

notify pgrst, 'reload schema';
