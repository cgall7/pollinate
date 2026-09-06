-- Pollinate: the starter grant goes to zero (Colin, UX Design channel
-- 8d2c9a5d, message a774e561, 2026-09-06): "let's get rid of the 500 free
-- nectar drops. i don't want to give out free anything right now."
--
-- A new account now opens EMPTY. Nobody is handed anything for signing up.
--
-- ============================================================================
-- WHY THIS IS A SPLIT AND NOT A ONE LINE EDIT
-- ============================================================================
--
-- `nectar_starter_grant_drops()` stopped being one number this morning.
-- 20260906000001 (the delivery allowance) gave it a SECOND caller, and said
-- so in its own re-issued comment: consent_to_nectar() mints it once, and
-- nectar_refill_rotation_members() uses it as the standing refill target at
-- every rotation delivery.
--
-- So "set the function to 0" answers a question nobody asked. It would also
-- switch off the allowance, and QUIETLY: the refill's own `if v_target <= 0
-- then return 0` guard means it would decline rather than fail, and no gate
-- in the tree reads zero as wrong. A shared constant is a shared premise, and
-- the two callers now hold OPPOSITE premises about the same number:
--
--   * the grant is a giveaway. You get it for existing. Colin's ruling is
--     that it is zero.
--   * the allowance is not. You only meet it by being in a comb that
--     actually delivered, it never accrues, and 20260906000001's own header
--     says it is BUILT TO DIE at the flip to live rails.
--
-- One writer was the right call while the two quantities were the same
-- question. They are now two questions, so this migration gives the second
-- one its own writer and leaves its VALUE untouched at 500. Whether the
-- allowance should follow the grant to zero is Colin's, and after this
-- migration it is one literal in one function rather than a change of
-- meaning to a function two callers read differently.
--
-- ============================================================================
-- `nectar_starter_grant_drops()` IS KEPT, NOT DROPPED
-- ============================================================================
--
-- consent_to_nectar() reads it and is otherwise untouched by this migration:
-- its `if v_grant_sats > 0 then ... end if` already means a zero grant writes
-- NO invoice, NO poll, NO transaction and NO posting, and returns 0 to the
-- client. Consent still records, accounts are still provisioned, B0 is
-- unchanged. Dropping the function instead would have forced consent_to_nectar
-- to be recreated for no behavioural gain, and would have taken
-- check-nectar-consent's F1 to "cannot tell: dropped with no replacement",
-- which is that row's fail-closed state and would be a red standing in for a
-- deliberate ruling.
--
-- A ZERO IS A RATIFIED VALUE, not a missing one. The comment below stops
-- saying PLACEHOLDER for the grant, because it is no longer awaiting Colin's
-- ratification of a magnitude: he ruled it. The allowance's comment keeps
-- PLACEHOLDER, because its magnitude never was ruled.
-- ============================================================================

-- ============================================================================
-- 1. The grant. Zero.
-- ============================================================================
create or replace function public.nectar_starter_grant_drops()
returns bigint
language sql immutable
as $$ select 0::bigint $$;

comment on function public.nectar_starter_grant_drops() is
  'The simulated-mode starter grant, RATIFIED AT ZERO by Colin on '
  '2026-09-06 (UX Design channel 8d2c9a5d, message a774e561): a new account '
  'opens empty and signing up is given nothing. Denominated in sats since '
  'the 2026-08-26 sats override, 1 drop = 1 sat exact. ONE CALLER as of '
  '20260906000002: consent_to_nectar(), whose own `> 0` guard means a zero '
  'grant writes no invoice, no transaction and no posting. The delivery '
  'allowance no longer reads this function. It reads '
  'nectar_delivery_allowance_drops(). Its JS mirror is '
  'NECTAR_STARTER_GRANT_DROPS in src/constants/nectar.js.';

-- ============================================================================
-- 2. The allowance target, which used to be the grant's second job.
--
-- Same value it has always had. Only its ADDRESS changed, so that the ruling
-- above could land on the grant alone.
--
-- CLOSED POSTURE, unlike the grant. The grant function is executable by
-- `authenticated` because it has always sat in the client-callable half of
-- 20260826000005. This one has exactly one reader,
-- nectar_refill_rotation_members(), which is security definer and runs as
-- owner, so it needs no grant of its own. Same posture as the refill and the
-- rest of this schema's scheduler surface.
-- ============================================================================
create function public.nectar_delivery_allowance_drops()
returns bigint
language sql immutable
as $$ select 500::bigint $$;

comment on function public.nectar_delivery_allowance_drops() is
  'PLACEHOLDER simulated-mode delivery allowance target (drops), still '
  'pending Colin''s ratification of the magnitude. Split out of '
  'nectar_starter_grant_drops() by 20260906000002 when that grant was ruled '
  'to zero: the two quantities had been one function with two callers '
  'holding opposite premises. Value unchanged at 500 across the split. '
  'nectar_refill_rotation_members() tops a consented member of a DELIVERED '
  'rotation''s comb back up to this. Simulated mode only, and built to die '
  'at 19b: under live rails it is replaced by a top-up the person pays for. '
  'Its JS mirror is NECTAR_DELIVERY_ALLOWANCE_DROPS in src/constants/nectar.js.';

revoke all on function public.nectar_delivery_allowance_drops() from public;
revoke execute on function public.nectar_delivery_allowance_drops() from anon, authenticated;

-- ============================================================================
-- 3. The refill, recreated whole so it reads the allowance instead of the
--    grant.
--
-- RECREATED, NOT EXTENDED, and the body below is 20260906000001's text but
-- for TWO lines, diffed rather than eyeballed:
--
--   1. `v_target := public.nectar_delivery_allowance_drops()` in place of
--      `v_target := public.nectar_starter_grant_drops()`. The only
--      executable change in the function.
--   2. the comment above the credit guard, which said
--      `greatest(balance, grant)` and now says `greatest(balance, target)`,
--      because the target stopped being the grant one section above it. A
--      justification comment is a dependency; leaving it would have sent the
--      next reader to a function this body no longer calls.
--
-- Counted as two because it IS two. An earlier draft of this header said
-- "but for a single line" and meant the executable one, which is the shape
-- that makes a word-for-word label false on its own file.
--
-- Every subtransaction boundary, the per-member exception block, the
-- idempotency key shape, the funding path, the never-takes credit guard, the
-- mode check and the seal check are unchanged and are that migration's text.
--
-- The `if v_target <= 0 then return 0` guard is KEPT. It now guards the
-- allowance's own magnitude rather than standing between the refill and the
-- grant's ruling, which is what it was silently doing the moment the grant
-- went to zero.
-- ============================================================================
create or replace function public.nectar_refill_rotation_members(p_rotation_id uuid)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  m record;
  v_comb uuid;
  v_target bigint;
  v_balance bigint;
  v_credit bigint;
  v_key text;
  v_corr uuid;
  v_poll uuid;
  v_txn uuid;
  v_cash uuid;
  v_avail uuid;
  v_refilled int := 0;
begin
  -- Simulated mode only. Under live rails this whole mechanic is replaced by
  -- a top-up the person pays for; a refill that kept running would be us
  -- minting real money on a timer.
  if public.ledger_current_mode() <> 'simulated' then
    return 0;
  end if;

  -- Defensive: the caller gates on v_sealed, but a direct call must not be
  -- able to refill a comb whose rotation never delivered. Delivery is the
  -- event the ruled string names.
  select r.comb_id into v_comb
    from public.comb_rotations r
   where r.id = p_rotation_id and r.sealed_at is not null;

  if v_comb is null then
    return 0;
  end if;

  v_target := public.nectar_delivery_allowance_drops();
  if v_target <= 0 then
    return 0;
  end if;

  v_cash := public.ledger_house_account('strike_cash');

  for m in
    select cm.profile_id
      from public.comb_members cm
      join public.nectar_consents nc on nc.user_id = cm.profile_id
     where cm.comb_id = v_comb
       and cm.removed_at is null
     order by cm.profile_id
  loop
    begin
      v_key := 'refill:' || p_rotation_id::text || ':' || m.profile_id::text;

      if exists (
        select 1 from public.ledger_transactions t where t.idempotency_key = v_key
      ) then
        continue;
      end if;

      select a.id into v_avail
        from public.ledger_accounts a
       where a.owner_user_id = m.profile_id and a.kind = 'user_available';

      if v_avail is null then
        -- Consented but unprovisioned should be impossible (consent_to_nectar
        -- provisions in the same transaction as the consent row). If it ever
        -- happens, that is a fact about a broken account, not something for a
        -- scheduler to repair silently.
        raise warning 'nectar_refill_rotation_members: member % is consented but has no available account', m.profile_id;
        continue;
      end if;

      -- The view reports what we owe as a positive number; the account
      -- itself holds it as a negative (liability). Read the account, not the
      -- view, so this does not depend on a security_invoker view's posture
      -- from inside a definer.
      select coalesce(-b.balance_sats, 0) into v_balance
        from public.ledger_account_balances b
       where b.account_id = v_avail;

      v_balance := coalesce(v_balance, 0);

      -- greatest(balance, target), expressed as the credit that reaches it.
      -- At or above the target, this is 0 and nothing is written at all —
      -- no invoice, no transaction, no posting. Never takes.
      v_credit := v_target - v_balance;
      if v_credit <= 0 then
        continue;
      end if;

      insert into public.strike_invoices (user_id, requested_amount_sats)
      values (m.profile_id, v_credit)
      returning correlation_id into v_corr;

      insert into public.strike_invoice_polls
        (correlation_id, observed_state, observed_amount_sats, is_simulated, raw_response)
      values
        (v_corr, 'SIMULATED_REFILL', v_credit, true,
         jsonb_build_object('simulated', true, 'reason', 'delivery_allowance',
                            'rotation_id', p_rotation_id))
      returning id into v_poll;

      insert into public.ledger_transactions (kind, idempotency_key, source_poll_id, memo)
      values ('funding', v_key, v_poll, 'simulated delivery allowance')
      returning id into v_txn;

      -- Same pulled-forward-invariants shape as consent_to_nectar's grant:
      -- the deferred checks fire at the end of THIS statement, inside this
      -- function where a violation raises with context, instead of at COMMIT
      -- as an unattributed check_violation. If a mutation run has dropped one
      -- of these triggers, SET CONSTRAINTS itself errors: this layer refuses
      -- to run without its invariants present.
      set constraints
        public.ledger_postings_balanced,
        public.ledger_postings_no_overdraft,
        public.ledger_postings_funding_matches_invoice
        immediate;
      insert into public.ledger_postings (transaction_id, account_id, amount_sats)
      values (v_txn, v_cash, v_credit),
             (v_txn, v_avail, -v_credit);
      set constraints
        public.ledger_postings_balanced,
        public.ledger_postings_no_overdraft,
        public.ledger_postings_funding_matches_invoice
        deferred;

      v_refilled := v_refilled + 1;
    exception when others then
      raise warning 'nectar_refill_rotation_members: refill for member % on rotation % failed: %',
        m.profile_id, p_rotation_id, sqlerrm;
    end;
  end loop;

  return v_refilled;
end;
$$;

comment on function public.nectar_refill_rotation_members(uuid) is
  'The delivery allowance (Lumen, 2026-09-06): tops every consented, '
  'non-removed member of a DELIVERED rotation''s comb back up to '
  'nectar_delivery_allowance_drops(). Re-pointed from '
  'nectar_starter_grant_drops() by 20260906000002, which ruled that grant to '
  'zero without touching this target. Never takes: a member at or above the '
  'target is not written at all. Simulated mode only. Idempotent per '
  '(rotation, member) via the ledger transaction key refill:<rotation>:<member>.';

revoke all on function public.nectar_refill_rotation_members(uuid) from public;
revoke execute on function public.nectar_refill_rotation_members(uuid) from anon, authenticated;
