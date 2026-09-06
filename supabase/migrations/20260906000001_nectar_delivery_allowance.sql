-- Pollinate — the delivery allowance (Lumen's ruling, UX Design thread
-- 0a406eb6, 2026-09-06; Sage's amendment of record on issue 292efcf5).
--
-- THE MECHANIC, in one sentence: at every rotation delivery, each consented
-- member of that comb has their nectar topped up to the starter grant.
--
--   Your nectar refills with each delivery.
--
-- WHY A REFILL AND NOT AN ACCRUAL. An accruing balance makes hoarding
-- rational, which is the countdown wallet 19a ships with today: 500 drops,
-- never replenished, so the correct play is to spend none of them. A capped
-- top-up makes unspent nectar wasted nectar. It cannot be farmed by writing
-- (it does not scale with anything the person produces, so it is never a
-- wage), and it rides the comb's existing deadline rather than inventing a
-- clock.
--
-- BUILT TO DIE. Under real sats (19b) this is REPLACED by a top-up the
-- person pays for, not extended. A refill that survives the flip to live
-- rails is a permanent subsidy nobody signed up for, which is why the whole
-- mechanic is gated on rails_mode = 'simulated' below, exactly like the
-- starter grant it borrows its quantity from.
--
-- ============================================================================
-- WHAT THIS MIGRATION REPLACES, AND WHY THE WHOLE BODY
-- ============================================================================
--
-- advance_due_rotations() is recreated here in full rather than extended,
-- for the reason 20260830000012's own header states and §1B.31.2 rules: a
-- `begin ... exception ... end` is a SUBTRANSACTION. A refill step added
-- inside the seal's block couples the refill's failure to the seal —
-- sealed_at/sent_at roll back, the warning is swallowed, and the tick
-- re-picks that rotation on every later sweep and fails identically forever.
-- So the refill is a THIRD independent subtransaction, gated on v_sealed,
-- sitting parallel to the advance rather than inside either.
--
-- THE BODY THIS EXTENDS IS 20260904000001's, NOT 20260830000012's. A
-- function address resolves to its LAST definition: the dead-letter
-- migration already did a `create or replace` on advance_due_rotations, so
-- the live body is the one with seal_attempts / seal_dead_lettered_at in it.
-- Recreating from the ops9 text would have silently reverted the terminal
-- exit — the loop would go back to re-attempting a permanently broken
-- rotation forever, with nothing red anywhere. The seal branch, the advance
-- branch, the WHERE clause, the warning strings and the grant posture below
-- are 20260904000001's verbatim; the only addition is the third block.
--
-- ============================================================================
-- THE QUANTITY HAS ONE WRITER, AND IT ALREADY EXISTED
-- ============================================================================
--
-- Lumen's pin: "the refill amount reads the same server-side definition the
-- starter grant reads. One writer." It already does —
-- nectar_starter_grant_drops(), defined in 20260826000005_nectar_sim_service.sql,
-- is that definition, and consent_to_nectar() reads it rather than holding a
-- 500 of its own. Cited by NAME and by FILE, never by line: this migration
-- edits above its own citation in that same file, which is how the :68 this
-- replaced was stale in the commit that wrote it. So
-- nothing is hoisted here; the refill calls the same function. A fresh 500
-- literal in this file would have been a second copy of a shared premise.
--
-- ITS JS MIRROR is NECTAR_STARTER_GRANT_DROPS (src/constants/nectar.js) —
-- named here so a future change to the grant's size moves the pair
-- knowingly, and because that constant now sets the refill target too, not
-- only what a new wallet opens with.
--
-- ============================================================================
-- greatest(balance, grant), NOT greatest(balance, cap)
-- ============================================================================
--
-- The ruled boundary is "the tide rises to half; it never takes." `cap` is a
-- bound name in this tree — NECTAR_LADDER_CAP_DROPS is 2000 (the grant times
-- four rungs) — and refilling everyone below 2000 up to 500 would CONFISCATE
-- the balance of anyone holding between the two, arrived at by obeying the
-- sentence. Threshold and target are therefore the same number: someone at
-- or above the grant is untouched, and never-takes is structural rather than
-- a rule a later writer has to remember.
--
-- ============================================================================
-- KEYED PER ROTATION, NOT PER CALENDAR MONTH
-- ============================================================================
--
-- A month key would introduce a second clock beside combs.cadence, and this
-- schema has twice refused exactly that (20260830000012 separates its sweep
-- interval from cadence for this reason; 20260830000011 stores cadence once
-- on combs so it is never a second constant to keep in sync). The delivery
-- IS the event the ruled string names, so the key is the rotation.
--
-- CONSEQUENCE, MEASURED AND ACCEPTED (Lumen, low severity, not a blocker):
-- comb membership is unbounded during MVP-Comb (ENG-85 ships both plan
-- limits NULL), so a person in N combs meets N deliveries and takes N
-- refills. It cannot be farmed alone — comb_advance_rotation's guard
-- requires at least two enrollable members, so a one-person comb never
-- advances — but a colluding pair can. In 19a nectar is un-purchasable and
-- un-redeemable, so farmed nectar converts to nothing: the cost is social,
-- not economic, and the mechanic is built to die at 19b.
--
-- ============================================================================
-- WHO IS REFILLED: CONSENTED MEMBERS ONLY (mine, flagged for override)
-- ============================================================================
--
-- A member with no nectar_consents row has no vessel to refill. Crediting
-- them would provision a wallet for someone who has never been asked, which
-- is B0's whole subject, and it would buy nothing: their first consent grants
-- the same 500 anyway (consent_to_nectar), so the only difference is whether
-- a stranger's ledger row exists before they ever opt in. This also matches
-- the client exactly — R-N4's arrival effect is gated on nectarConsent, so
-- the refilled set and the set that can ever see a refill are the same set.
-- ============================================================================

-- The grant's comment stops being true the moment this migration lands, and
-- a justification comment is a dependency: "granted once, at first consent,
-- never again" would send the next reader looking for a second mint that is
-- right here. Restated rather than struck — the ONCE is still true of the
-- grant proper, and this function is now read by two callers.
comment on function public.nectar_starter_grant_drops() is
  'PLACEHOLDER simulated-mode nectar quantity — still pending Colin''s '
  'ratification of the magnitude itself. Denominated in sats as of the '
  '2026-08-26 sats override (CEO thread, event 4b3258dc, routed by Sage): '
  '1 drop = 1 sat, exact, no conversion function. TWO CALLERS as of '
  '20260906000001: consent_to_nectar() issues it once as the starter grant, '
  'and nectar_refill_rotation_members() tops a consented member back up to '
  'it at every rotation delivery. It is therefore both the opening balance '
  'and the standing refill target, and changing it moves both — along with '
  'its JS mirror NECTAR_STARTER_GRANT_DROPS in src/constants/nectar.js.';

-- ============================================================================
-- The refill itself.
--
-- Returns the number of members it credited, so the caller (and a human
-- reading a log) can tell "nobody needed one" from "it did not run".
--
-- PER-MEMBER SUBTRANSACTION, and it is §1B.31.2 applied one layer down. One
-- member's refusal — an unprovisioned account, a ledger invariant tripping
-- on a state this function did not anticipate — must not roll back the
-- credits of the members already refilled in this loop. Each member's write
-- therefore gets its own begin/exception, and the caller's third block
-- catches anything that escapes the loop entirely.
--
-- THE FUNDING PATH IS THE REAL ONE, exactly as the starter grant's is: an
-- invoice row, a poll row, a 'funding' transaction. Not an 'adjustment'.
-- That is what makes I1/I3 bind this credit like real money (it must match
-- the observed amount and the invoice payer) and what makes I4 refuse it
-- structurally in live mode — the poll row is is_simulated = true, which
-- 'live' rejects before this function's own mode check is even reached.
-- strike_invoice_id stays null: we never talked to Strike about this either.
--
-- THE IDEMPOTENCY KEY DEVIATES FROM 'fund:' || correlation_id, deliberately.
-- A correlation id is fresh per invoice, so it can express "this payment was
-- credited once" but cannot express "this rotation already refilled this
-- person" — which is the only exactly-once claim that matters here. The key
-- is therefore refill:<rotation>:<member>, and ledger_transactions'
-- idempotency_key unique index is the enforcement. The pre-check below turns
-- a replay into a skip rather than an error; the index is the backstop if two
-- ticks ever overlap.
-- ============================================================================
create function public.nectar_refill_rotation_members(p_rotation_id uuid)
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

  v_target := public.nectar_starter_grant_drops();
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

      -- greatest(balance, grant), expressed as the credit that reaches it.
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
  'nectar_starter_grant_drops(). Never takes — a member at or above the '
  'target is not written at all. Simulated mode only. Idempotent per '
  '(rotation, member) via the ledger transaction key refill:<rotation>:<member>.';

-- Same closed posture as advance_due_rotations and the rest of this schema's
-- scheduler surface: no client role calls this. It runs as owner from inside
-- advance_due_rotations, which needs no grant of its own.
revoke all on function public.nectar_refill_rotation_members(uuid) from public;
revoke execute on function public.nectar_refill_rotation_members(uuid) from anon, authenticated;

-- ============================================================================
-- The tick, recreated whole. Everything above the third block is
-- 20260904000001's body unchanged — same signature, same grant posture, same
-- WHERE clause, same dead-letter branch and warning strings.
-- ============================================================================
create or replace function public.advance_due_rotations()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
  v_sealed boolean;
  v_attempts int;
begin
  for r in
    select id, comb_id, seal_attempts
    from public.comb_rotations
    where closes_at <= now()
      and sealed_at is null
      and voided_at is null
      and seal_dead_lettered_at is null
    order by closes_at
  loop
    v_sealed := false;
    begin
      perform public.seal_and_send_rotation(r.id);
      v_sealed := true;
    exception when others then
      v_attempts := r.seal_attempts + 1;
      if v_attempts >= 5 then
        update public.comb_rotations
          set seal_attempts = v_attempts,
              seal_dead_lettered_at = now()
          where id = r.id;
        -- Distinguishable from the ordinary retry warning below by the
        -- literal "dead-lettered" -- a future Sentry log-drain (ENG-74,
        -- still unbuilt) can key off that word without parsing SQLSTATE
        -- out of a raw log line. sqlerrm still interpolated, matching
        -- 20260830000012's own requirement (§1B.36.12) that every warning
        -- from this function carry the underlying error text, not just a
        -- generic label.
        raise warning 'advance_due_rotations: rotation % dead-lettered after % attempts: %', r.id, v_attempts, sqlerrm;
      else
        update public.comb_rotations
          set seal_attempts = v_attempts
          where id = r.id;
        raise warning 'advance_due_rotations: rotation % failed: %', r.id, sqlerrm;
      end if;
    end;

    if v_sealed then
      begin
        perform public.comb_advance_rotation(r.comb_id);
      exception when others then
        raise warning 'advance_due_rotations: advance for comb % failed: %', r.comb_id, sqlerrm;
      end;
    end if;

    -- THE THIRD SUBTRANSACTION. Independent of both blocks above and gated
    -- on the same v_sealed the advance is: the allowance rides the DELIVERY,
    -- so a rotation that failed to seal refills nobody. Its failure cannot
    -- reach the seal (which has already committed its own subtransaction) or
    -- the advance (which has committed or warned before this runs), which is
    -- the whole reason it is a third block rather than a step inside either.
    if v_sealed then
      begin
        perform public.nectar_refill_rotation_members(r.id);
      exception when others then
        raise warning 'advance_due_rotations: nectar refill for rotation % failed: %', r.id, sqlerrm;
      end;
    end if;
  end loop;
end;
$$;
