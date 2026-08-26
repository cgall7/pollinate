-- ============================================================================
-- Pollinate — 19a simulated-nectar service layer (ENG-62 follow-on)
--
-- The nectar ledger (20260826000001) is schema only: no client role can write
-- to it, and DESIGN.md §11 assumes a payments service that does not exist in
-- 19a. This migration is that service for simulated mode — three SECURITY
-- DEFINER RPCs in the send_hive() mold (20260819000001), which remain the ONLY
-- write path into the ledger from the app:
--
--   consent_to_nectar()  B0 consent + account provisioning + starter grant
--   record_zap()         the tip transaction, with target attribution
--
-- Product constraints this file enforces (not just documents):
--
--   B0 (DESIGN_BRIEF_V2_NAVIGATION.md): no zap without explicit prior wallet
--   consent. record_zap() refuses a sender with no nectar_consents row.
--   Consent fires on the first zap attempt, never at signup — that ordering
--   is the client's job; this file only makes skipping it impossible.
--
--   §5.6 (POLLINATE_V2_SPEC.md): in 19a nectar is un-purchasable and
--   un-redeemable. The ONLY mint is the starter grant below, which is gated
--   on rails_mode = 'simulated' twice over (an explicit mode check here, and
--   I4 — the poll row it writes is is_simulated = true, which 'live' mode
--   rejects). No purchase path and no withdrawal path exist in this layer.
--
-- PLACEHOLDER NUMBERS — pending Colin's ratification (routed by Sage,
-- channel b57ad406, thread f10c9a4a, 2026-08-26): no ratified drops→microUSD
-- rate or starter-grant size exists in any spec. The two constants below use
-- Fizz's proposed 1 drop = 1000 microUSD ($0.001) and a 500-drop grant.
-- Safe to build against while rails_mode is 'simulated' (no real money can
-- exist); MUST be re-ratified before the §9/§13-gated flip to 'live'.
-- Changing either is a new migration, not an edit — see each function.
--
-- DECISION (mine, flagged in the PR for override): a zap recipient does NOT
-- need prior consent to be credited. B0 gates *surfaces* and *sending*; a
-- ledger row is neither. Blocking on recipient consent would make the send
-- flow fail on a state the sender can never see (and leaking "Bob has not
-- consented" is worse), and would kill ENG-64's author notification for
-- every not-yet-consented author. Received nectar becomes visible to the
-- recipient only after their own consent — pre-consent their UI is
-- "identical to today" exactly as B0 requires.
-- ============================================================================

-- ============================================================================
-- 1. The two product numbers, each in exactly one place.
-- ============================================================================

-- PLACEHOLDER, not ratified. 1 drop = 1000 microUSD = $0.001. The ledger
-- stores microUSD only (design §2); drops exist at the edges. This function is
-- the single conversion site — a ratified rate lands as a new migration
-- replacing it, and only affects writes from that point on (recorded
-- transactions are microUSD facts and do not restate).
create function public.nectar_drop_microusd()
returns bigint
language sql immutable
as $$ select 1000::bigint $$;

comment on function public.nectar_drop_microusd() is
  'PLACEHOLDER drops->microUSD rate (1 drop = $0.001), Fizz''s proposal '
  '2026-08-26, routed to Colin for ratification by Sage the same day '
  '(thread f10c9a4a). Must be re-ratified before rails_mode ever flips to '
  '''live''. The only conversion site — UI and RPCs both read this.';

-- PLACEHOLDER, not ratified. What a new wallet holds the moment consent is
-- given, simulated mode only: enough for a 100-drop "Changed me" zap plus
-- change (DES-28 presets are 10/50/100). In live mode the grant is skipped
-- entirely — funding is real money and arrives via 19b's rails, never this.
create function public.nectar_starter_grant_drops()
returns bigint
language sql immutable
as $$ select 500::bigint $$;

comment on function public.nectar_starter_grant_drops() is
  'PLACEHOLDER simulated-mode starter grant (drops). Same ratification gate '
  'as nectar_drop_microusd(). Granted once, at first consent, never again.';

-- ============================================================================
-- 2. Consent — the B0 fact.
-- ============================================================================
create table public.nectar_consents (
  user_id uuid primary key references public.profiles (id) on delete restrict,
  consented_at timestamptz not null default now()
);

comment on table public.nectar_consents is
  'B0 wallet consent (DESIGN_BRIEF_V2_NAVIGATION.md). One row = this user '
  'explicitly enabled nectar. No client write path — consent_to_nectar() '
  'only. No revocation path yet, deliberately: un-consent is a product '
  'question (what happens to a held balance?) that 19a does not answer; '
  'when it is answered, revocation is a new migration, not an UPDATE.';

-- ============================================================================
-- 3. Zap attribution — "Sarah zapped the entry about the hospital waiting
--    room" is a fact about a transaction, recorded next to it.
--
-- target_id is deliberately un-FK'd: it points at entries or private_hives
-- depending on target_kind (one column cannot reference two tables), and
-- attribution must outlive its target the way ledger history outlives
-- everything — a deleted entry must not strand the money trail. Renderers
-- treat a dangling target as "a memory that is gone", not an error.
-- ============================================================================
create type public.nectar_zap_target_kind as enum ('entry', 'hive');

create table public.nectar_zaps (
  -- Client-generated at tap time; the idempotency handle for retries.
  id uuid primary key,
  transaction_id uuid not null unique references public.ledger_transactions (id) on delete restrict,
  sender_id uuid not null references public.profiles (id) on delete restrict,
  recipient_id uuid not null references public.profiles (id) on delete restrict,
  target_kind public.nectar_zap_target_kind not null,
  target_id uuid not null,
  -- 1–1000 is DES-28's custom-input range; presets are 10/50/100.
  amount_drops bigint not null
    constraint nectar_zaps_amount_in_range check (amount_drops between 1 and 1000),
  created_at timestamptz not null default now(),

  constraint nectar_zaps_no_self_zap check (sender_id <> recipient_id)
);

create index nectar_zaps_recipient_idx on public.nectar_zaps (recipient_id, created_at);
create index nectar_zaps_sender_idx on public.nectar_zaps (sender_id, created_at);
create index nectar_zaps_target_idx on public.nectar_zaps (target_kind, target_id);

-- Same append-only posture as the ledger tables it annotates, same trigger
-- (20260826000001): attribution is part of the money trail, and a service
-- key must not be able to rewrite who zapped what.
create trigger nectar_zaps_immutable
  before update or delete on public.nectar_zaps
  for each row execute function public.ledger_forbid_mutation();

-- ============================================================================
-- 4. Internal provisioning helpers — callable only by the definer functions
--    below (owner context), never by a client role.
-- ============================================================================

-- Idempotent: give a user their two ledger accounts. The partial unique index
-- ledger_accounts_user_kind_uniq (20260826000001) makes the upsert safe under
-- concurrency.
create function public.ledger_ensure_user_accounts(p_user uuid)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
begin
  insert into public.ledger_accounts (kind, owner_user_id)
  values ('user_available', p_user), ('user_seed_escrow', p_user)
  on conflict (owner_user_id, kind) where owner_user_id is not null do nothing;
end;
$$;

-- Idempotent get-or-create for a house account (20260826000001 creates none —
-- the schema was applied empty). Same upsert-then-read shape against the
-- partial house-kind unique index.
create function public.ledger_house_account(k public.ledger_account_kind)
returns uuid
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  insert into public.ledger_accounts (kind)
  values (k)
  on conflict (kind) where owner_user_id is null do nothing;

  select a.id into v_id
    from public.ledger_accounts a
   where a.kind = k and a.owner_user_id is null;

  return v_id;
end;
$$;

-- ============================================================================
-- 5. consent_to_nectar() — B0 consent, account provisioning, and (simulated
--    mode only) the starter grant, one transaction.
--
-- Idempotent: replaying returns the existing consent with a 0 grant. The
-- grant is tied to *winning the consent insert*, so exactly one grant per
-- user can ever exist, however many times this is called concurrently.
--
-- The grant rides the real funding path — invoice row, poll row, 'funding'
-- transaction — rather than an 'adjustment', so I1/I3 bind it exactly like
-- real money (credit must match the observed amount and the invoice payer),
-- and I4 makes it structurally impossible in live mode: the poll row is
-- is_simulated = true, which 'live' rejects before this function's own mode
-- check is even needed. strike_invoice_id stays null — honest: we never
-- talked to Strike about this.
-- ============================================================================
create function public.consent_to_nectar()
returns table (consented_at timestamptz, starter_grant_drops bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_consented_at timestamptz;
  v_grant_drops bigint := 0;
  v_grant_micro bigint;
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
    v_grant_micro := v_grant_drops * public.nectar_drop_microusd();

    if v_grant_micro > 0 then
      v_cash := public.ledger_house_account('strike_cash');
      select a.id into v_avail
        from public.ledger_accounts a
       where a.owner_user_id = v_uid and a.kind = 'user_available';

      insert into public.strike_invoices (user_id, requested_amount_microusd)
      values (v_uid, v_grant_micro)
      returning correlation_id into v_corr;

      insert into public.strike_invoice_polls
        (correlation_id, observed_state, observed_amount_microusd, is_simulated, raw_response)
      values
        (v_corr, 'SIMULATED_GRANT', v_grant_micro, true,
         jsonb_build_object('simulated', true, 'reason', 'starter_grant'))
      returning id into v_poll;

      insert into public.ledger_transactions (kind, idempotency_key, source_poll_id, memo)
      values ('funding', 'fund:' || v_corr, v_poll, 'simulated starter grant')
      returning id into v_txn;

      -- Both legs in ONE statement with the deferred invariants pulled
      -- forward: they then fire at the end of that statement — inside this
      -- function, where a violation raises with context — instead of at the
      -- client's COMMIT as an unattributed check_violation. If a mutation
      -- run has dropped one of these triggers, SET CONSTRAINTS itself errors:
      -- this layer refuses to run without its invariants present.
      set constraints
        public.ledger_postings_balanced,
        public.ledger_postings_no_overdraft,
        public.ledger_postings_funding_matches_invoice
        immediate;
      insert into public.ledger_postings (transaction_id, account_id, amount_microusd)
      values (v_txn, v_cash, v_grant_micro),
             (v_txn, v_avail, -v_grant_micro);
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

comment on function public.consent_to_nectar() is
  'B0 wallet consent for auth.uid(): records the consent fact, provisions '
  'ledger accounts, and (simulated mode only) issues the one-time starter '
  'grant via the real funding path. Idempotent; replay returns the existing '
  'consent with starter_grant_drops = 0.';

-- ============================================================================
-- 6. record_zap() — the tip transaction plus its attribution.
--
-- Authorization is "the sender could see the target and is currently a
-- connected friend of its author", checked here at write time (send_hive
-- point 5's shape — except unlike read access, which a later unfriend does
-- not revoke, money movement requires the connection to be alive NOW; a
-- delivered keepsake is a gift, a zap is a live interaction).
--
--   entry / 'sent'   : sender is the subject of the entry's sent hive
--   entry / 'shared' : the entry has a live shares row (feed surface)
--   hive             : sender is the subject of a sent hive (PackageOpen)
--   anything else    : 'target not found' — same non-owner-can't-distinguish
--                      shape as send_hive; a probe with a guessed uuid learns
--                      nothing, including whether the row exists.
--
-- Idempotency is two-layered: a replay with a known zap id returns the
-- original transaction id (exactly-once for retries), and the ledger's
-- unique idempotency_key 'zap:' || id backstops the race where two copies of
-- the same zap arrive concurrently (the loser errors on the unique key;
-- its retry then hits the replay path).
-- ============================================================================
create function public.record_zap(
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
  v_micro bigint;
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
  -- (see the header DECISION note). Sender accounts are guaranteed by
  -- consent_to_nectar(), but ensuring is idempotent and cheap.
  perform public.ledger_ensure_user_accounts(v_uid);
  perform public.ledger_ensure_user_accounts(v_recipient);

  v_micro := p_amount_drops * public.nectar_drop_microusd();

  select a.id into v_avail_sender
    from public.ledger_accounts a
   where a.owner_user_id = v_uid and a.kind = 'user_available';
  select a.id into v_avail_recipient
    from public.ledger_accounts a
   where a.owner_user_id = v_recipient and a.kind = 'user_available';

  -- Lock both balance rows in a deterministic order before writing, so two
  -- crossing zaps (A→B while B→A) serialize instead of deadlocking, then
  -- pre-check the sender's balance for a clear in-function error. I2 at
  -- COMMIT remains the enforcement; this is the readable version of it.
  perform 1
     from public.ledger_account_balances b
    where b.account_id in (v_avail_sender, v_avail_recipient)
    order by b.account_id
      for update;

  select b.balance_microusd into v_balance
    from public.ledger_account_balances b
   where b.account_id = v_avail_sender;

  if -v_balance < v_micro then
    raise exception 'record_zap: insufficient nectar (% drops available, % needed)',
      (-v_balance) / public.nectar_drop_microusd(), p_amount_drops;
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
  insert into public.ledger_postings (transaction_id, account_id, amount_microusd)
  values (v_txn, v_avail_sender, v_micro),
         (v_txn, v_avail_recipient, -v_micro);
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

comment on function public.record_zap(uuid, public.nectar_zap_target_kind, uuid, bigint) is
  'The 19a zap: balanced tip transaction sender->recipient plus a '
  'nectar_zaps attribution row, one transaction. B0 consent required to '
  'send, not to receive. Recipient is DERIVED from the target, never '
  'passed — misattribution is structurally impossible (I3''s lesson, '
  'applied to tips). Idempotent on p_zap_id.';

-- ============================================================================
-- 7. Privileges — house revoke pattern (20260813000005: both lines required
--    per function) and the ledger's read posture for the new tables.
-- ============================================================================
revoke all on function public.consent_to_nectar() from public;
revoke execute on function public.consent_to_nectar() from anon;
grant execute on function public.consent_to_nectar() to authenticated;

revoke all on function public.record_zap(uuid, public.nectar_zap_target_kind, uuid, bigint) from public;
revoke execute on function public.record_zap(uuid, public.nectar_zap_target_kind, uuid, bigint) from anon;
grant execute on function public.record_zap(uuid, public.nectar_zap_target_kind, uuid, bigint) to authenticated;

-- Internal helpers: no client role executes these, ever.
revoke all on function public.ledger_ensure_user_accounts(uuid) from public;
revoke execute on function public.ledger_ensure_user_accounts(uuid) from anon, authenticated;
revoke all on function public.ledger_house_account(public.ledger_account_kind) from public;
revoke execute on function public.ledger_house_account(public.ledger_account_kind) from anon, authenticated;

-- The two constants are readable by signed-in clients (the UI converts drops
-- for display and the consent screen states the grant), never by anon.
revoke all on function public.nectar_drop_microusd() from public;
revoke execute on function public.nectar_drop_microusd() from anon;
grant execute on function public.nectar_drop_microusd() to authenticated;
revoke all on function public.nectar_starter_grant_drops() from public;
revoke execute on function public.nectar_starter_grant_drops() from anon;
grant execute on function public.nectar_starter_grant_drops() to authenticated;

alter table public.nectar_consents enable row level security;
alter table public.nectar_zaps enable row level security;

revoke all on public.nectar_consents, public.nectar_zaps from anon, authenticated;
grant select on public.nectar_consents, public.nectar_zaps to authenticated;

-- Your own consent state drives the pre/post-consent UI split (B0).
create policy "nectar_consents_select_own"
  on public.nectar_consents for select
  to authenticated
  using (user_id = auth.uid());

-- A zap is visible to exactly its two parties: the sender's history and the
-- recipient's notification ("Sarah zapped the entry…", ENG-64) both read
-- this. Nobody else's zaps exist to you.
create policy "nectar_zaps_select_own"
  on public.nectar_zaps for select
  to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

notify pgrst, 'reload schema';
