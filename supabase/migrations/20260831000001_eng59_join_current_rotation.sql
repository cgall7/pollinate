-- ENG-59 / O10: a member joining mid-month writes in the current rotation.
-- Membership and contributor enrollment are one SECURITY DEFINER operation.
create or replace function public.comb_join_by_invite_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_comb_id uuid;
  v_comb_owner_id uuid;
  v_hive_id uuid;
  v_subject_profile_id uuid;
begin
  select id, owner_id into v_comb_id, v_comb_owner_id
  from public.combs
  where invite_code = p_invite_code;
  if v_comb_id is null then
    raise exception 'comb_join_by_invite_code: invalid invite code';
  end if;

  if exists (select 1 from public.comb_members where comb_id = v_comb_id and profile_id = auth.uid() and removed_at is not null) then
    raise exception 'comb_join_by_invite_code: previously removed from this comb';
  end if;

  insert into public.comb_members (comb_id, profile_id)
  values (v_comb_id, auth.uid())
  on conflict (comb_id, profile_id) do nothing;

  select r.hive_id, h.subject_profile_id into v_hive_id, v_subject_profile_id
  from public.comb_rotations r
  join public.private_hives h on h.id = r.hive_id
  where r.comb_id = v_comb_id and r.sealed_at is null and r.voided_at is null
  order by r.ordinal desc
  limit 1;

  -- The month's subject belongs to the comb but is deliberately never a
  -- writer for their own hive; preserve their membership without tripping
  -- hive_contributors_not_hive_subject.
  if v_hive_id is not null and auth.uid() is distinct from v_subject_profile_id then
    insert into public.hive_contributors (hive_id, profile_id, invited_by)
    values (v_hive_id, auth.uid(), v_comb_owner_id)
    on conflict (hive_id, profile_id) do nothing;
  end if;

  return v_comb_id;
end;
$$;

revoke all on function public.comb_join_by_invite_code(text) from public;
grant execute on function public.comb_join_by_invite_code(text) to authenticated;
notify pgrst, 'reload schema';
