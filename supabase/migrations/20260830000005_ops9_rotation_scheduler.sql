-- OPS-9 (Bumble, row 1.8, POLLINATE_COMB_ROTATION.md §8.6/§8.7). "The tick
-- advances state; it cannot seal -- it calls ENG-91." Depends on 1.1
-- (ENG-58, combs/comb_rotations schema) and 1.8a (ENG-91,
-- seal_and_send_rotation) -- both merged, github/main@8864a12.
--
-- Scope, deliberately narrow: this migration finds rotations whose window
-- has closed and calls the one function ENG-91 built for exactly this
-- caller. It invents no new seal/send/void logic -- all of that lives in
-- seal_and_send_rotation() (20260830000003), including its own row lock,
-- idempotency check, and three-way deliver/void classification. Duplicating
-- any of that here would create the two-source-of-truth failure this
-- schema's own conventions (private_hives/hive_volumes vs. comb_rotations'
-- mirror columns) exist to avoid.
--
-- pg_cron on Supabase-managed Postgres ships pg_cron preloaded at the
-- infra level (shared_preload_libraries is already set; no server restart
-- needed for `create extension` to take effect) -- documented Supabase
-- behavior, not something this migration or its gates can verify from a
-- git checkout. Flagged in the PR rather than asserted as tested, because
-- it isn't: nothing in this repo's toolchain can start a real background
-- worker to prove a schedule actually fires.
--
-- The embedded-postgres instance every `check-*.mjs` gate runs against is a
-- vanilla local build with no pg_cron shared library available at all --
-- confirmed empirically (`select * from pg_available_extensions where name
-- = 'pg_cron'` returns zero rows there). Every migration in this directory
-- gets replayed against that instance by four gates that enumerate the
-- directory dynamically (check-migration-sentinels, check-share-visibility,
-- check-comb-rotation-seal-send, prod-schema-check), so an unconditional
-- `create extension pg_cron` would break all four, unrelated to anything
-- this migration actually changes. Both DDL blocks below are guarded on
-- "does this Postgres have the extension available at all" -- on
-- Supabase (real pg_cron always available) the guard's branch always
-- fires, so production behavior is unconditional; only a build that
-- genuinely lacks the extension no-ops, and it no-ops loudly enough to
-- find (`check-ops9-rotation-scheduler.mjs` below asserts the guard's
-- shape and the function's own logic directly, since it cannot exercise
-- the schedule itself).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    execute 'create extension if not exists pg_cron';
  end if;
end $$;

-- The batch function. SECURITY DEFINER so its EXECUTE grant (below) is
-- what gates who can trigger a sweep, same posture as every other definer
-- helper in this schema -- not load-bearing against pg_cron's own
-- execution role specifically (Supabase's pg_cron runs scheduled jobs as
-- the role that called cron.schedule, which for a migration is the
-- superuser the deploy pipeline connects as, and a superuser bypasses
-- every GRANT check regardless of what this function declares) but
-- correct and auditable if that execution role is ever narrowed later,
-- and consistent with how seal_and_send_rotation itself is gated.
--
-- One rotation at a time, each in its own subtransaction: a single
-- rotation raising an unexpected error must not roll back every other
-- rotation this same tick already advanced, and must not go silent either
-- -- `raise warning` surfaces in Supabase's log explorer, which is the
-- only observability this ticket has budget for. seal_and_send_rotation's
-- own `for update` row lock is what protects against two overlapping
-- ticks racing the same rotation; this function does not need a second
-- lock on top of it.
create function public.advance_due_rotations()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
begin
  for r in
    select id
    from public.comb_rotations
    where closes_at <= now()
      and sealed_at is null
      and voided_at is null
    order by closes_at
  loop
    begin
      perform public.seal_and_send_rotation(r.id);
    exception when others then
      raise warning 'advance_due_rotations: rotation % failed: %', r.id, sqlerrm;
    end;
  end loop;
end;
$$;

-- Same named-anon-revoke requirement as every definer helper in this
-- schema (20260813000005's own comment: `alter default privileges ...
-- grant all on functions to anon` reaches every function created in
-- public from birth until revoked by name; a bare `revoke all from
-- public` does not reach anon's separate default-privilege grant).
-- Granted to service_role for the same reason seal_and_send_rotation is:
-- documents the intended caller even though the actual pg_cron execution
-- role bypasses it (see the function comment above).
revoke all on function public.advance_due_rotations() from public;
revoke execute on function public.advance_due_rotations() from anon;
revoke execute on function public.advance_due_rotations() from authenticated;
grant execute on function public.advance_due_rotations() to service_role;

-- Five minutes: no cadence is ruled anywhere in POLLINATE_COMB_ROTATION.md
-- (ENG-60, which mints the rotations this sweeps, isn't built yet either
-- -- this ships ahead of its only producer, same "build the mechanism,
-- defer the consequence" split ENG-58 used for ENG-85's caps). Tight
-- enough that a reveal doesn't feel arbitrarily delayed once closes_at
-- passes, loose enough not to poll an almost-always-empty table needlessly.
-- Re-tunable without a schema change -- unschedule and reschedule under
-- the same job name in a later migration if the number is wrong.
--
-- Unschedule-then-schedule under a fixed job name makes this migration
-- replay-safe: pg_cron's own idempotency story varies by version (some
-- support `cron.schedule` overwriting a same-named job outright; the
-- unschedule-by-jobid form below is the one signature every pg_cron
-- version since 1.0 supports, so it doesn't assume a version this repo
-- has never pinned).
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'comb-rotation-tick';
    perform cron.schedule(
      'comb-rotation-tick',
      '*/5 * * * *',
      $sql$select public.advance_due_rotations()$sql$
    );
  end if;
end $$;
