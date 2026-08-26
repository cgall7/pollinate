-- ============================================================================
-- Pollinate — nectar ledger unit-of-account override: micro-USD -> sats
--
-- OVERRIDE, not a bugfix. DESIGN.md §2 chose integer micro-USD deliberately
-- (rationale preserved there, annotated rather than deleted). Colin has since
-- ratified a full override of that choice — CEO thread, event `4b3258dc`,
-- routed here by Sage (channel b57ad406, 2026-08-26): the ledger's unit of
-- account moves from micro-USD to satoshis, because the real rail this is
-- headed for is Spark, a self-custodial BTC-native path where a USD-quoted
-- invoice never made sense to begin with. Simulated mode only, unaffected —
-- the rails_mode / §9 / §13 gate on flipping to 'live' is untouched by this.
--
-- Scope: every `*_microusd` column, in every table that carries one, renamed
-- to `*_sats`, plus the two verification functions' output columns and the
-- two balance views. `strike_invoices`, `strike_invoice_polls`,
-- `strike_payouts`, `custody_reconciliations`, `ledger_postings`,
-- `ledger_account_balances` — same bigint columns, same constraints, same
-- data, new name and new meaning. No data migration: existing values (there
-- are none yet outside test fixtures — this schema is simulated-mode-only
-- and unapplied to any real balance) are reinterpreted in place as sats
-- rather than rescaled, per Sage's routing of Colin's ruling.
--
-- Conversion layer simplifies away. New rate: 1 drop = 1 sat, exactly.
-- `nectar_drop_microusd()` (20260826000005) is DROPPED, not replaced — there
-- is no rate left to hold, so `record_zap()` / `consent_to_nectar()` now post
-- `amount_drops` straight into `amount_sats`. `nectar_starter_grant_drops()`
-- is untouched by this migration except its comment: still 500, same
-- placeholder ratification status, new meaning (500 sats, not 500x$0.001).
--
-- Out of scope, deliberately: no dollar-equivalent display anywhere (DES-28
-- has no $ surface), and the `nectar`/`zap`/`drops` word-reserve in nectar.js
-- is untouched — users still only ever see "drops". No app-side code exists
-- yet that names any of these columns, so this migration is the entire
-- change.
-- ============================================================================

-- ============================================================================
-- 1. Column renames — data and constraints carry over untouched; only the
--    name changes. (Postgres tracks check constraints, generated-column
--    expressions, and view/function internal references by attnum, not by
--    name, so this alone does not break anything that reads these tables —
--    it only makes every function/view below that names the OLD column stop
--    matching, which is why each is reissued next.)
-- ============================================================================
alter table public.strike_invoices
  rename column requested_amount_microusd to requested_amount_sats;

alter table public.strike_invoice_polls
  rename column observed_amount_microusd to observed_amount_sats;

alter table public.strike_payouts
  rename column amount_microusd to amount_sats;

alter table public.custody_reconciliations
  rename column ledger_cash_microusd to ledger_cash_sats;
alter table public.custody_reconciliations
  rename column strike_reported_cash_microusd to strike_reported_cash_sats;
alter table public.custody_reconciliations
  rename column delta_microusd to delta_sats;

alter table public.ledger_postings
  rename column amount_microusd to amount_sats;

alter table public.ledger_account_balances
  rename column balance_microusd to balance_sats;

-- ============================================================================
-- 2. Trigger functions that name the renamed columns in their bodies.
--    Same signature, same trigger bindings — CREATE OR REPLACE swaps the
--    body without touching the triggers already attached to these functions.
-- ============================================================================
create or replace function public.ledger_apply_posting_to_balance()
returns trigger
language plpgsql
as $$
begin
  insert into public.ledger_account_balances (account_id, balance_sats)
  values (new.account_id, new.amount_sats)
  on conflict (account_id) do update
    set balance_sats = public.ledger_account_balances.balance_sats + excluded.balance_sats,
        updated_at = now();
  return null;
end;
$$;

create or replace function public.ledger_seed_balance_row()
returns trigger
language plpgsql
as $$
begin
  insert into public.ledger_account_balances (account_id, balance_sats)
  values (new.id, 0)
  on conflict (account_id) do nothing;
  return null;
end;
$$;

create or replace function public.ledger_assert_balanced()
returns trigger
language plpgsql
as $$
declare
  total bigint;
  n int;
begin
  select coalesce(sum(amount_sats), 0), count(*)
    into total, n
    from public.ledger_postings
   where transaction_id = new.transaction_id;

  if n < 2 then
    raise exception 'ledger transaction % has % posting(s); double-entry requires at least 2',
      new.transaction_id, n
      using errcode = 'check_violation';
  end if;

  if total <> 0 then
    raise exception 'ledger transaction % is unbalanced by % sats',
      new.transaction_id, total
      using errcode = 'check_violation';
  end if;

  return null;
end;
$$;

create or replace function public.ledger_assert_no_overdraft()
returns trigger
language plpgsql
as $$
declare
  acct_kind public.ledger_account_kind;
  bal bigint;
begin
  select a.kind, b.balance_sats
    into acct_kind, bal
    from public.ledger_accounts a
    join public.ledger_account_balances b on b.account_id = a.id
   where a.id = new.account_id;

  if public.ledger_kind_must_not_be_debit(acct_kind) and bal > 0 then
    raise exception 'overdraft: account % (%) would hold a debit balance of % sats',
      new.account_id, acct_kind, bal
      using errcode = 'check_violation';
  end if;

  return null;
end;
$$;

create or replace function public.ledger_assert_funding_matches_invoice()
returns trigger
language plpgsql
as $$
declare
  txn record;
  invoice_user uuid;
  observed bigint;
  credited_user bigint;
  credited_fees bigint;
  foreign_accounts int;
begin
  select kind, source_poll_id into txn
    from public.ledger_transactions where id = new.transaction_id;

  if txn.kind <> 'funding' then
    return null;
  end if;

  select i.user_id, p.observed_amount_sats
    into invoice_user, observed
    from public.strike_invoice_polls p
    join public.strike_invoices i on i.correlation_id = p.correlation_id
   where p.id = txn.source_poll_id;

  select count(*) into foreign_accounts
    from public.ledger_postings lp
    join public.ledger_accounts a on a.id = lp.account_id
   where lp.transaction_id = new.transaction_id
     and a.owner_user_id is not null
     and a.owner_user_id is distinct from invoice_user;

  if foreign_accounts > 0 then
    raise exception
      'funding transaction % touches an account not owned by the invoice payer %',
      new.transaction_id, invoice_user
      using errcode = 'check_violation';
  end if;

  select coalesce(-sum(lp.amount_sats), 0) into credited_user
    from public.ledger_postings lp
    join public.ledger_accounts a on a.id = lp.account_id
   where lp.transaction_id = new.transaction_id and a.kind = 'user_available';

  select coalesce(-sum(lp.amount_sats), 0) into credited_fees
    from public.ledger_postings lp
    join public.ledger_accounts a on a.id = lp.account_id
   where lp.transaction_id = new.transaction_id and a.kind = 'fee_income';

  if credited_user + credited_fees <> observed then
    raise exception
      'funding transaction % distributes % sats but the observed payment was %',
      new.transaction_id, credited_user + credited_fees, observed
      using errcode = 'check_violation';
  end if;

  return null;
end;
$$;

-- ============================================================================
-- 3. Verification surface — output column names changed, which
--    CREATE OR REPLACE FUNCTION cannot do for a RETURNS TABLE function.
--    Neither had an explicit grant (PUBLIC execute by default, unrevoked in
--    20260826000001), so drop + recreate loses nothing.
-- ============================================================================
drop function public.ledger_verify_balance_cache();
create function public.ledger_verify_balance_cache()
returns table (account_id uuid, cached_sats bigint, computed_sats bigint, drift_sats bigint)
language sql stable
as $$
  select b.account_id,
         b.balance_sats,
         coalesce(p.total, 0),
         b.balance_sats - coalesce(p.total, 0)
    from public.ledger_account_balances b
    left join (
      select ledger_postings.account_id, sum(amount_sats) as total
        from public.ledger_postings
       group by ledger_postings.account_id
    ) p on p.account_id = b.account_id
   where b.balance_sats <> coalesce(p.total, 0)
$$;

drop function public.ledger_solvency();
create function public.ledger_solvency()
returns table (
  assets_sats bigint,
  user_liabilities_sats bigint,
  equity_sats bigint,
  coverage_sats bigint,
  is_solvent boolean
)
language sql stable
as $$
  with classified as (
    select public.ledger_account_class(a.kind) as class, b.balance_sats as bal
      from public.ledger_accounts a
      join public.ledger_account_balances b on b.account_id = a.id
  ),
  totals as (
    select
      coalesce(sum(bal) filter (where class = 'asset'), 0)     as assets,
      coalesce(sum(bal) filter (where class = 'liability'), 0) as liabilities,
      coalesce(sum(bal) filter (where class = 'equity'), 0)    as equity
    from classified
  )
  select assets,
         -liabilities,          -- report what we owe as a positive number
         equity,
         assets + liabilities,  -- liabilities are negative, so this is the buffer
         equity <= 0
    from totals
$$;

-- ============================================================================
-- 4. Balance views — output column names changed, so CREATE OR REPLACE VIEW
--    (which requires the same column names in the same order) cannot be used
--    either. Nothing else in the schema selects from these two views, so
--    drop + recreate is safe; grants and security_invoker are reissued.
-- ============================================================================
drop view public.seed_escrow_balances;
create view public.seed_escrow_balances as
  select p.seed_id,
         a.owner_user_id as sender_id,
         -sum(p.amount_sats) as escrowed_sats
    from public.ledger_postings p
    join public.ledger_accounts a on a.id = p.account_id
   where p.seed_id is not null
     and a.kind = 'user_seed_escrow'
   group by p.seed_id, a.owner_user_id;

drop view public.user_nectar_balances;
create view public.user_nectar_balances as
  select a.owner_user_id as user_id,
         -coalesce(sum(b.balance_sats) filter (where a.kind = 'user_available'), 0)
           as available_sats,
         -coalesce(sum(b.balance_sats) filter (where a.kind = 'user_seed_escrow'), 0)
           as escrowed_sats
    from public.ledger_accounts a
    join public.ledger_account_balances b on b.account_id = a.id
   where a.owner_user_id is not null
   group by a.owner_user_id;

grant select on public.user_nectar_balances, public.seed_escrow_balances to authenticated;

alter view public.user_nectar_balances set (security_invoker = true);
alter view public.seed_escrow_balances set (security_invoker = true);

-- ============================================================================
-- 5. The conversion layer. 1 drop = 1 sat, exactly — no rate function left
--    to hold, so it is dropped rather than replaced with a new placeholder.
-- ============================================================================
drop function public.nectar_drop_microusd();

comment on function public.nectar_starter_grant_drops() is
  'PLACEHOLDER simulated-mode starter grant SIZE — still pending Colin''s '
  'ratification of the magnitude itself. Denominated in sats as of the '
  '2026-08-26 sats override (CEO thread, event 4b3258dc, routed by Sage): '
  '1 drop = 1 sat, exact, no conversion function. Same 500 number as '
  'before this migration; only its meaning changed, from 500 x $0.001 to '
  '500 sats. Granted once, at first consent, never again.';

create or replace function public.consent_to_nectar()
returns table (consented_at timestamptz, starter_grant_drops bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_consented_at timestamptz;
  v_grant_drops bigint := 0;
  v_grant_sats bigint;
  v_corr uuid;
  v_poll uuid;
  v_txn uuid;
  v_cash uuid;
  v_avail uuid;
begin
  if v_uid is null then
    raise exception 'consent_to_nectar: not signed in';
  end if;

  insert into public.nectar_consents (user_id)
  values (v_uid)
  on conflict (user_id) do nothing
  returning nectar_consents.consented_at into v_consented_at;

  if not found then
    -- Already consented (possibly a race we just lost, in which case the
    -- read-committed re-read below sees the winner's committed row).
    select c.consented_at into v_consented_at
      from public.nectar_consents c where c.user_id = v_uid;
    return query select v_consented_at, 0::bigint;
    return;
  end if;

  perform public.ledger_ensure_user_accounts(v_uid);

  if public.ledger_current_mode() = 'simulated' then
    v_grant_drops := public.nectar_starter_grant_drops();
    v_grant_sats := v_grant_drops; -- 1 drop = 1 sat, exact (sats override)

    if v_grant_sats > 0 then
      v_cash := public.ledger_house_account('strike_cash');
      select a.id into v_avail
        from public.ledger_accounts a
       where a.owner_user_id = v_uid and a.kind = 'user_available';

      insert into public.strike_invoices (user_id, requested_amount_sats)
      values (v_uid, v_grant_sats)
      returning correlation_id into v_corr;

      insert into public.strike_invoice_polls
        (correlation_id, observed_state, observed_amount_sats, is_simulated, raw_response)
      values
        (v_corr, 'SIMULATED_GRANT', v_grant_sats, true,
         jsonb_build_object('simulated', true, 'reason', 'starter_grant'))
      returning id into v_poll;

      insert into public.ledger_transactions (kind, idempotency_key, source_poll_id, memo)
      values ('funding', 'fund:' || v_corr, v_poll, 'simulated starter grant')
      returning id into v_txn;

      set constraints
        public.ledger_postings_balanced,
        public.ledger_postings_no_overdraft,
        public.ledger_postings_funding_matches_invoice
        immediate;
      insert into public.ledger_postings (transaction_id, account_id, amount_sats)
      values (v_txn, v_cash, v_grant_sats),
             (v_txn, v_avail, -v_grant_sats);
      set constraints
        public.ledger_postings_balanced,
        public.ledger_postings_no_overdraft,
        public.ledger_postings_funding_matches_invoice
        deferred;
    end if;
  end if;

  return query select v_consented_at, v_grant_drops;
end;
$$;

create or replace function public.record_zap(
  p_zap_id uuid,
  p_target_kind public.nectar_zap_target_kind,
  p_target_id uuid,
  p_amount_drops bigint
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_recipient uuid;
  v_existing record;
  v_entry record;
  v_hive record;
  v_sats bigint;
  v_avail_sender uuid;
  v_avail_recipient uuid;
  v_balance bigint;
  v_txn uuid;
begin
  if v_uid is null then
    raise exception 'record_zap: not signed in';
  end if;
  if p_zap_id is null or p_target_id is null then
    raise exception 'record_zap: zap id and target are required';
  end if;
  if p_amount_drops is null or p_amount_drops < 1 or p_amount_drops > 1000 then
    raise exception 'record_zap: amount must be between 1 and 1000 drops';
  end if;

  -- B0: no consent, no zap. The client shows the consent flow on the first
  -- zap attempt and calls consent_to_nectar() before retrying.
  if not exists (select 1 from public.nectar_consents c where c.user_id = v_uid) then
    raise exception 'record_zap: nectar consent required before zapping';
  end if;

  -- Exactly-once: a replay of a recorded zap succeeds with the original
  -- transaction; the same id with different parameters is a bug, loudly.
  select z.transaction_id, z.sender_id, z.target_kind, z.target_id, z.amount_drops
    into v_existing
    from public.nectar_zaps z
   where z.id = p_zap_id;
  if found then
    if v_existing.sender_id = v_uid
       and v_existing.target_kind = p_target_kind
       and v_existing.target_id = p_target_id
       and v_existing.amount_drops = p_amount_drops then
      return v_existing.transaction_id;
    end if;
    raise exception 'record_zap: zap % already recorded with different parameters', p_zap_id;
  end if;

  if p_target_kind = 'entry' then
    select en.user_id, en.visibility, en.hive_id
      into v_entry
      from public.entries en
     where en.id = p_target_id;
    if not found then
      raise exception 'record_zap: target not found';
    end if;
    v_recipient := v_entry.user_id;

    if v_entry.visibility = 'sent' then
      if not exists (
        select 1 from public.private_hives ph
         where ph.id = v_entry.hive_id
           and ph.subject_profile_id = v_uid
           and ph.sent_at is not null
      ) then
        raise exception 'record_zap: target not found';
      end if;
    elsif v_entry.visibility = 'shared' then
      if not exists (select 1 from public.shares s where s.entry_id = p_target_id) then
        raise exception 'record_zap: target not found';
      end if;
    else
      -- private / packaged: not a zap surface, and not distinguishable from
      -- nonexistence by a non-reader.
      raise exception 'record_zap: target not found';
    end if;

  else -- 'hive': the PackageOpen surface; only the package's recipient zaps it.
    select ph.owner_id, ph.subject_profile_id, ph.sent_at
      into v_hive
      from public.private_hives ph
     where ph.id = p_target_id;
    if not found
       or v_hive.subject_profile_id is distinct from v_uid
       or v_hive.sent_at is null then
      raise exception 'record_zap: target not found';
    end if;
    v_recipient := v_hive.owner_id;
  end if;

  if v_recipient = v_uid then
    raise exception 'record_zap: cannot zap your own %', p_target_kind;
  end if;

  if not exists (
    select 1 from public.honeycomb_connections c
     where c.status = 'accepted'
       and ((c.requester_id = v_uid and c.addressee_id = v_recipient)
         or (c.addressee_id = v_uid and c.requester_id = v_recipient))
  ) then
    raise exception 'record_zap: sender and recipient are not connected friends';
  end if;

  -- Recipient accounts exist from here on whether or not they ever consented
  -- (see 20260826000005's header DECISION note). Sender accounts are
  -- guaranteed by consent_to_nectar(), but ensuring is idempotent and cheap.
  perform public.ledger_ensure_user_accounts(v_uid);
  perform public.ledger_ensure_user_accounts(v_recipient);

  v_sats := p_amount_drops; -- 1 drop = 1 sat, exact (sats override, no multiply)

  select a.id into v_avail_sender
    from public.ledger_accounts a
   where a.owner_user_id = v_uid and a.kind = 'user_available';
  select a.id into v_avail_recipient
    from public.ledger_accounts a
   where a.owner_user_id = v_recipient and a.kind = 'user_available';

  -- Lock both balance rows in a deterministic order before writing, so two
  -- crossing zaps (A->B while B->A) serialize instead of deadlocking, then
  -- pre-check the sender's balance for a clear in-function error. I2 at
  -- COMMIT remains the enforcement; this is the readable version of it.
  perform 1
     from public.ledger_account_balances b
    where b.account_id in (v_avail_sender, v_avail_recipient)
    order by b.account_id
      for update;

  select b.balance_sats into v_balance
    from public.ledger_account_balances b
   where b.account_id = v_avail_sender;

  if -v_balance < v_sats then
    raise exception 'record_zap: insufficient nectar (% drops available, % needed)',
      -v_balance, p_amount_drops;
  end if;

  insert into public.ledger_transactions (kind, idempotency_key, memo)
  values ('tip', 'zap:' || p_zap_id, 'nectar zap')
  returning id into v_txn;

  -- Same single-statement + pulled-forward-invariants shape as the grant:
  -- violations raise here, attributed, not at the client's COMMIT.
  set constraints
    public.ledger_postings_balanced,
    public.ledger_postings_no_overdraft
    immediate;
  insert into public.ledger_postings (transaction_id, account_id, amount_sats)
  values (v_txn, v_avail_sender, v_sats),
         (v_txn, v_avail_recipient, -v_sats);
  set constraints
    public.ledger_postings_balanced,
    public.ledger_postings_no_overdraft
    deferred;

  insert into public.nectar_zaps
    (id, transaction_id, sender_id, recipient_id, target_kind, target_id, amount_drops)
  values
    (p_zap_id, v_txn, v_uid, v_recipient, p_target_kind, p_target_id, p_amount_drops);

  return v_txn;
end;
$$;

-- ============================================================================
-- 6. Column comments — the unit itself, documented at every column that
--    carries it, per Sage's routing of the override.
-- ============================================================================
comment on column public.ledger_postings.amount_sats is
  'Signed integer satoshis. > 0 debit, < 0 credit; every transaction''s '
  'postings sum to zero (design doc §6 I1). Was amount_microusd before the '
  '2026-08-26 sats override (design doc §2; CEO thread event 4b3258dc).';

comment on column public.ledger_account_balances.balance_sats is
  'Cached signed satoshi balance, maintained by ledger_apply_posting_to_balance(); '
  'ledger_verify_balance_cache() recomputes from postings and reports drift. '
  'Was balance_microusd before the 2026-08-26 sats override.';

comment on column public.strike_invoices.requested_amount_sats is
  'Satoshis requested at invoice creation. Was requested_amount_microusd '
  'before the 2026-08-26 sats override.';

comment on column public.strike_invoice_polls.observed_amount_sats is
  'Satoshis actually observed paid via GET /v1/invoices/<id> (design doc §7 — '
  'the only fact permitted to justify crediting a user). Was '
  'observed_amount_microusd before the 2026-08-26 sats override.';

comment on column public.strike_payouts.amount_sats is
  'Satoshis reserved for this payout. Was amount_microusd before the '
  '2026-08-26 sats override.';

comment on column public.custody_reconciliations.ledger_cash_sats is
  'Our strike_cash ledger balance in sats at the time of this check. Was '
  'ledger_cash_microusd before the 2026-08-26 sats override.';

comment on column public.custody_reconciliations.strike_reported_cash_sats is
  'Strike''s GET /balances figure in sats at the time of this check. Was '
  'strike_reported_cash_microusd before the 2026-08-26 sats override.';

comment on column public.custody_reconciliations.delta_sats is
  'strike_reported_cash_sats - ledger_cash_sats; any nonzero value is '
  'unrecorded money in either direction. Was delta_microusd before the '
  '2026-08-26 sats override.';

notify pgrst, 'reload schema';
