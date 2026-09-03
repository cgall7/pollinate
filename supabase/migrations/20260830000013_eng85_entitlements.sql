-- ENG-85 — server-owned comb entitlements. The mechanism ships now; limits do not.

create table public.comb_entitlement_plans (
  plan_key text primary key,
  max_active_combs_written_in integer check (max_active_combs_written_in is null or max_active_combs_written_in > 0),
  max_comb_members integer check (max_comb_members is null or max_comb_members > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.comb_entitlement_plans
  (plan_key, max_active_combs_written_in, max_comb_members)
values ('free', null, null), ('premium', null, null);

create table public.profile_comb_entitlements (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  plan_key text not null default 'free' references public.comb_entitlement_plans(plan_key),
  granted_at timestamptz not null default now()
);

alter table public.comb_entitlement_plans enable row level security;
alter table public.profile_comb_entitlements enable row level security;

-- Nullable by design. Phase 4 sets this on every pre-flip comb before enabling
-- limits, preserving the seeded relationships that produced the evidence.
alter table public.combs
  add column member_limit_override integer
  check (member_limit_override is null or member_limit_override > 0);

create function public.enforce_comb_entitlements()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_writer_limit integer;
  v_member_limit integer;
  v_active_combs integer;
  v_active_members integer;
begin
  -- BEFORE INSERT triggers run even for INSERT ... ON CONFLICT DO NOTHING.
  -- Preserve ENG-59's idempotent invite tap when a comb is exactly at its
  -- eventual limit: an already-active seat consumes no new entitlement.
  if exists (
    select 1 from public.comb_members m
    where m.comb_id = new.comb_id
      and m.profile_id = new.profile_id
      and m.removed_at is null
  ) then
    return new;
  end if;

  select p.max_active_combs_written_in
    into v_writer_limit
  from public.comb_entitlement_plans p
  where p.plan_key = coalesce(
    (select e.plan_key from public.profile_comb_entitlements e where e.profile_id = new.profile_id),
    'free'
  );

  -- NULL is unlimited. ENG-85 deliberately ships both plan limits as NULL.
  if v_writer_limit is not null then
    select count(*) into v_active_combs
    from public.comb_members m
    where m.profile_id = new.profile_id
      and m.removed_at is null
      and m.comb_id <> new.comb_id;
    if v_active_combs >= v_writer_limit then
      raise exception using errcode = 'check_violation', constraint = 'comb_writer_entitlement_limit';
    end if;
  end if;

  select coalesce(c.member_limit_override, p.max_comb_members)
    into v_member_limit
  from public.combs c
  left join public.profile_comb_entitlements e on e.profile_id = c.owner_id
  join public.comb_entitlement_plans p on p.plan_key = coalesce(e.plan_key, 'free')
  where c.id = new.comb_id;

  if v_member_limit is not null then
    select count(*) into v_active_members
    from public.comb_members m
    where m.comb_id = new.comb_id and m.removed_at is null;
    if v_active_members >= v_member_limit then
      raise exception using errcode = 'check_violation', constraint = 'comb_member_entitlement_limit';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_comb_entitlements() from public, anon;
grant execute on function public.enforce_comb_entitlements() to authenticated, service_role;

create trigger comb_members_enforce_entitlements
  before insert on public.comb_members
  for each row execute function public.enforce_comb_entitlements();

comment on function public.enforce_comb_entitlements() is
  'ENG-85 single server-side cap authority. NULL limits mean unlimited during MVP-Comb measurement; Phase 4 tunes plan rows after grandfather overrides are written.';
