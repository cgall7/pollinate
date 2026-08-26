// Executes the nectar ledger migration against a real Postgres and asserts every
// invariant the schema claims. Not a mock: embedded-postgres runs actual PG.
const EmbeddedPostgres = require('embedded-postgres').default || require('embedded-postgres');
const fs = require('fs');
const path = require('path');

const SCHEMA = fs.readFileSync(
  path.join(__dirname, '..', '..', 'migrations', '20260826000001_nectar_ledger.sql'), 'utf8');
const SERVICE = fs.readFileSync(
  path.join(__dirname, '..', '..', 'migrations', '20260826000005_nectar_sim_service.sql'), 'utf8');

// Minimal stand-ins for what Supabase already provides. auth.uid() reads a
// session setting so the service-layer tests can act as a signed-in user;
// unset it answers null, exactly like the anon default the older sections
// were written against.
const SHIM = `
create role anon;
create role authenticated;
create role service_role;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create table public.profiles (
  id uuid primary key,
  display_name text not null
);
-- App tables record_zap() authorizes against — columns it touches only.
create table public.private_hives (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id),
  subject_profile_id uuid references public.profiles (id),
  sent_at timestamptz
);
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  visibility text not null default 'private',
  hive_id uuid references public.private_hives (id)
);
create table public.shares (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null unique references public.entries (id)
);
create table public.honeycomb_connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id),
  addressee_id uuid not null references public.profiles (id),
  status text not null default 'pending'
);
`;

let pass = 0, fail = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; failures.push(name); console.log(`  FAIL ${name}${detail ? ' :: ' + detail : ''}`); }
}

async function expectFail(client, name, fn, matcher) {
  try {
    await fn();
    check(name, false, 'expected an error, got success');
  } catch (e) {
    const msg = e.message || String(e);
    check(name, matcher ? matcher.test(msg) : true, matcher ? `wrong error: ${msg}` : undefined);
  }
}

const PORT = 55433;
const USD = (n) => Math.round(n * 1_000_000); // dollars -> microUSD

async function main() {
  const dataDir = path.join(__dirname, 'pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir, user: 'postgres', password: 'pw', port: PORT, persistent: false,
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase('ledger');
  const client = pg.getPgClient('ledger');
  await client.connect();

  const ver = await client.query('show server_version');
  console.log(`\nPostgres ${ver.rows[0].server_version}\n`);

  console.log('— schema application —');
  await client.query(SHIM);
  try {
    await client.query(SCHEMA);
    check('schema applies cleanly', true);
  } catch (e) {
    check('schema applies cleanly', false, e.message);
    console.log('\nCannot continue.\n');
    process.exit(1);
  }
  try {
    await client.query(SERVICE);
    check('19a service layer applies cleanly', true);
  } catch (e) {
    check('19a service layer applies cleanly', false, e.message);
    console.log('\nCannot continue.\n');
    process.exit(1);
  }

  // ---- fixtures -----------------------------------------------------------
  const alice = '11111111-1111-1111-1111-111111111111';
  const bob   = '22222222-2222-2222-2222-222222222222';
  await client.query(`insert into public.profiles (id, display_name) values ($1,'Alice'),($2,'Bob')`, [alice, bob]);

  const acct = {};
  for (const [key, kind, owner] of [
    ['aliceAvail', 'user_available', alice],
    ['aliceEscrow', 'user_seed_escrow', alice],
    ['bobAvail', 'user_available', bob],
    ['bobEscrow', 'user_seed_escrow', bob],
    ['cash', 'strike_cash', null],
    ['btc', 'strike_btc', null],
    ['pending', 'withdrawal_pending', null],
    ['fees', 'fee_income', null],
    ['fx', 'fx_reserve', null],
  ]) {
    const r = await client.query(
      `insert into public.ledger_accounts (kind, owner_user_id) values ($1,$2) returning id`, [kind, owner]);
    acct[key] = r.rows[0].id;
  }

  // Helper: write a whole transaction atomically.
  async function post(txn, legs) {
    await client.query('begin');
    try {
      const r = await client.query(
        `insert into public.ledger_transactions (kind, idempotency_key, source_poll_id, payout_id, memo)
         values ($1,$2,$3,$4,$5) returning id`,
        [txn.kind, txn.key, txn.pollId ?? null, txn.payoutId ?? null, txn.memo ?? null]);
      const id = r.rows[0].id;
      for (const leg of legs) {
        await client.query(
          `insert into public.ledger_postings (transaction_id, account_id, amount_microusd, seed_id)
           values ($1,$2,$3,$4)`, [id, leg.account, leg.amount, leg.seedId ?? null]);
      }
      await client.query('commit');
      return id;
    } catch (e) {
      await client.query('rollback');
      throw e;
    }
  }

  async function balance(accountId) {
    const r = await client.query(
      `select balance_microusd from public.ledger_account_balances where account_id=$1`, [accountId]);
    return Number(r.rows[0].balance_microusd);
  }

  async function mkPoll(userId, dollars) {
    const inv = await client.query(
      `insert into public.strike_invoices (user_id, requested_amount_microusd, strike_invoice_id, api_confirmed_at)
       values ($1,$2,gen_random_uuid(),now()) returning correlation_id`, [userId, USD(dollars)]);
    const corr = inv.rows[0].correlation_id;
    const poll = await client.query(
      `insert into public.strike_invoice_polls
         (correlation_id, observed_state, observed_amount_microusd, is_simulated, raw_response)
       values ($1,'PAID',$2,true,'{}'::jsonb) returning id`, [corr, USD(dollars)]);
    return { corr, pollId: poll.rows[0].id };
  }

  // ---- I1: balance enforcement -------------------------------------------
  console.log('\n— invariant I1: every transaction balances —');

  const f1 = await mkPoll(alice, 10);
  await post({ kind: 'funding', key: `fund:${f1.corr}`, pollId: f1.pollId },
    [{ account: acct.cash, amount: USD(10) }, { account: acct.aliceAvail, amount: -USD(10) }]);
  check('balanced funding commits', await balance(acct.aliceAvail) === -USD(10));
  check('asset side recorded', await balance(acct.cash) === USD(10));

  const f2 = await mkPoll(alice, 10);
  await expectFail(client, 'unbalanced transaction rejected at COMMIT', () =>
    post({ kind: 'funding', key: `fund:${f2.corr}`, pollId: f2.pollId },
      [{ account: acct.cash, amount: USD(10) }, { account: acct.aliceAvail, amount: -USD(9) }]),
    /unbalanced by/);

  const f3 = await mkPoll(alice, 10);
  await expectFail(client, 'single-posting transaction rejected', () =>
    post({ kind: 'funding', key: `fund:${f3.corr}`, pollId: f3.pollId },
      [{ account: acct.cash, amount: USD(10) }]),
    /requires at least 2/);

  // ---- I2: no overdraft ---------------------------------------------------
  console.log('\n— invariant I2: users cannot overdraw —');

  await expectFail(client, 'tip exceeding balance rejected', () =>
    post({ kind: 'tip', key: 'tip:overdraw' },
      [{ account: acct.aliceAvail, amount: USD(50) }, { account: acct.bobAvail, amount: -USD(50) }]),
    /overdraft/);

  await post({ kind: 'tip', key: 'tip:1' },
    [{ account: acct.aliceAvail, amount: USD(3) }, { account: acct.bobAvail, amount: -USD(3) }]);
  check('tip within balance succeeds', await balance(acct.bobAvail) === -USD(3));
  check('sender debited', await balance(acct.aliceAvail) === -USD(7));

  // ---- exactly-once crediting --------------------------------------------
  console.log('\n— exactly-once: idempotency —');

  await expectFail(client, 'replaying same correlationId credits only once', () =>
    post({ kind: 'funding', key: `fund:${f1.corr}`, pollId: f1.pollId },
      [{ account: acct.cash, amount: USD(10) }, { account: acct.aliceAvail, amount: -USD(10) }]),
    /duplicate key|idempotency_key/);
  check('balance unchanged after replay attempt', await balance(acct.aliceAvail) === -USD(7));

  // ---- webhook cannot move money -----------------------------------------
  console.log('\n— structural: webhooks are a nudge, not a write path —');

  await expectFail(client, 'funding without a poll is rejected', () =>
    post({ kind: 'funding', key: 'fund:nopoll' },
      [{ account: acct.cash, amount: USD(5) }, { account: acct.aliceAvail, amount: -USD(5) }]),
    /funding_requires_poll/);

  const fkPath = await client.query(`
    select count(*)::int as n
      from information_schema.table_constraints tc
      join information_schema.constraint_column_usage ccu
        on ccu.constraint_name = tc.constraint_name
     where tc.constraint_type = 'FOREIGN KEY'
       and tc.table_name = 'ledger_transactions'
       and ccu.table_name = 'strike_webhook_deliveries'`);
  check('no FK path from ledger to webhook deliveries', fkPath.rows[0].n === 0);

  await expectFail(client, 'internal transfer cannot claim external authority', () =>
    post({ kind: 'tip', key: 'tip:fakepoll', pollId: f1.pollId },
      [{ account: acct.aliceAvail, amount: USD(1) }, { account: acct.bobAvail, amount: -USD(1) }]),
    /internal_kinds_have_no_poll/);

  // ---- immutability -------------------------------------------------------
  console.log('\n— append-only history —');

  await expectFail(client, 'UPDATE on postings blocked', () =>
    client.query(`update public.ledger_postings set amount_microusd = 1 where id = (select min(id) from public.ledger_postings)`),
    /append-only/);
  await expectFail(client, 'DELETE on postings blocked', () =>
    client.query(`delete from public.ledger_postings where id = (select min(id) from public.ledger_postings)`),
    /append-only/);
  await expectFail(client, 'UPDATE on transactions blocked', () =>
    client.query(`update public.ledger_transactions set memo = 'x'`),
    /append-only/);

  // ---- seed escrow lifecycle ---------------------------------------------
  console.log('\n— seed escrow: plant, bloom, refund —');

  const seedA = '33333333-3333-3333-3333-333333333333';
  const seedB = '44444444-4444-4444-4444-444444444444';

  await post({ kind: 'seed_plant', key: `seed:plant:${seedA}` },
    [{ account: acct.aliceAvail, amount: USD(2), seedId: seedA },
     { account: acct.aliceEscrow, amount: -USD(2), seedId: seedA }]);
  await post({ kind: 'seed_plant', key: `seed:plant:${seedB}` },
    [{ account: acct.aliceAvail, amount: USD(1), seedId: seedB },
     { account: acct.aliceEscrow, amount: -USD(1), seedId: seedB }]);

  check('escrow holds both seeds', await balance(acct.aliceEscrow) === -USD(3));
  check('available reduced by escrow', await balance(acct.aliceAvail) === -USD(4));

  const perSeed = await client.query(
    `select seed_id, escrowed_microusd from public.seed_escrow_balances order by escrowed_microusd desc`);
  check('per-seed escrow is provable without per-seed accounts',
    perSeed.rows.length === 2 && Number(perSeed.rows[0].escrowed_microusd) === USD(2),
    JSON.stringify(perSeed.rows));

  await post({ kind: 'seed_bloom', key: `seed:bloom:${seedA}` },
    [{ account: acct.aliceEscrow, amount: USD(2), seedId: seedA },
     { account: acct.bobAvail, amount: -USD(2), seedId: seedA }]);
  check('bloom moves escrow to recipient', await balance(acct.bobAvail) === -USD(5));

  await post({ kind: 'seed_refund', key: `seed:refund:${seedB}` },
    [{ account: acct.aliceEscrow, amount: USD(1), seedId: seedB },
     { account: acct.aliceAvail, amount: -USD(1), seedId: seedB }]);
  check('unclaimed seed refunds to sender', await balance(acct.aliceEscrow) === 0);

  const seedAfter = await client.query(`select count(*)::int n from public.seed_escrow_balances where escrowed_microusd <> 0`);
  check('no escrow left after bloom + refund', seedAfter.rows[0].n === 0);

  await expectFail(client, 'escrow cannot release more than was committed', () =>
    post({ kind: 'seed_bloom', key: 'seed:bloom:phantom' },
      [{ account: acct.aliceEscrow, amount: USD(99) }, { account: acct.bobAvail, amount: -USD(99) }]),
    /overdraft/);

  // ---- withdrawal: reserve then settle ------------------------------------
  console.log('\n— withdrawal: reserve before send —');

  const payout = await client.query(
    `insert into public.strike_payouts (user_id, amount_microusd, destination_kind, destination)
     values ($1,$2,'bolt11','lnbc...') returning id`, [bob, USD(5)]);
  const payoutId = payout.rows[0].id;

  await post({ kind: 'withdrawal_reserve', key: `wd:reserve:${payoutId}`, payoutId },
    [{ account: acct.bobAvail, amount: USD(5) }, { account: acct.pending, amount: -USD(5) }]);
  check('reserve moves funds out of spendable', await balance(acct.bobAvail) === 0);
  check('reserve parks funds as pending', await balance(acct.pending) === -USD(5));

  await expectFail(client, 'cannot spend reserved funds', () =>
    post({ kind: 'tip', key: 'tip:afterreserve' },
      [{ account: acct.bobAvail, amount: USD(1) }, { account: acct.aliceAvail, amount: -USD(1) }]),
    /overdraft/);

  await expectFail(client, 'withdrawal without a payout record rejected', () =>
    post({ kind: 'withdrawal_reserve', key: 'wd:nopayout' },
      [{ account: acct.aliceAvail, amount: USD(1) }, { account: acct.pending, amount: -USD(1) }]),
    /withdrawal_requires_payout/);

  await post({ kind: 'withdrawal_settle', key: `wd:settle:${payoutId}`, payoutId },
    [{ account: acct.pending, amount: USD(5) }, { account: acct.cash, amount: -USD(5) }]);
  check('settle clears pending', await balance(acct.pending) === 0);
  check('settle reduces our assets', await balance(acct.cash) === USD(5));

  // ---- rails mode tripwire ------------------------------------------------
  console.log('\n— tripwire: simulated mode refuses live observations —');

  const modeInv = await client.query(
    `insert into public.strike_invoices (user_id, requested_amount_microusd) values ($1,$2) returning correlation_id`,
    [alice, USD(1)]);
  await expectFail(client, 'live poll rejected while mode=simulated', () =>
    client.query(`insert into public.strike_invoice_polls
      (correlation_id, observed_state, observed_amount_microusd, is_simulated, raw_response)
      values ($1,'PAID',$2,false,'{}'::jsonb)`, [modeInv.rows[0].correlation_id, USD(1)]),
    /rails mode is simulated/);

  await client.query(`update public.ledger_settings set rails_mode='live' where id`);
  await expectFail(client, 'simulated poll rejected once mode=live', () =>
    client.query(`insert into public.strike_invoice_polls
      (correlation_id, observed_state, observed_amount_microusd, is_simulated, raw_response)
      values ($1,'PAID',$2,true,'{}'::jsonb)`, [modeInv.rows[0].correlation_id, USD(1)]),
    /rails mode is live/);
  await client.query(`update public.ledger_settings set rails_mode='simulated' where id`);

  // ---- global invariants --------------------------------------------------
  console.log('\n— global invariants —');

  const zero = await client.query(`select coalesce(sum(balance_microusd),0)::bigint as t from public.ledger_account_balances`);
  check('sum of ALL account balances is exactly zero', Number(zero.rows[0].t) === 0, `got ${zero.rows[0].t}`);

  const drift = await client.query(`select * from public.ledger_verify_balance_cache()`);
  check('balance cache matches recomputation from postings', drift.rows.length === 0, JSON.stringify(drift.rows));

  const sol = await client.query(`select * from public.ledger_solvency()`);
  const s = sol.rows[0];
  check('solvency reports solvent under normal operation', s.is_solvent === true, JSON.stringify(s));
  check('assets cover user liabilities',
    Number(s.assets_microusd) >= Number(s.user_liabilities_microusd),
    `assets=${s.assets_microusd} liabilities=${s.user_liabilities_microusd}`);

  // ---- the FX scenario: this is the one that bites ------------------------
  console.log('\n— FX exposure: USD-denominated liabilities against a BTC-denominated float —');

  // Fund $100 that settles into BTC rather than USD cash.
  const f4 = await mkPoll(bob, 100);
  await post({ kind: 'funding', key: `fund:${f4.corr}`, pollId: f4.pollId },
    [{ account: acct.btc, amount: USD(100) }, { account: acct.bobAvail, amount: -USD(100) }]);

  const before = await client.query(`select * from public.ledger_solvency()`);
  check('solvent while BTC mark holds', before.rows[0].is_solvent === true);

  // BTC drops 30%. Our liability to Bob is still $100. Mark the asset down.
  await post({ kind: 'fx_mark', key: 'fx:btc-drop-30', memo: 'BTC mark down 30%' },
    [{ account: acct.fx, amount: USD(30) }, { account: acct.btc, amount: -USD(30) }]);

  const after = await client.query(`select * from public.ledger_solvency()`);
  check('a 30% BTC drawdown is detected as INSOLVENCY, not silently absorbed',
    after.rows[0].is_solvent === false,
    JSON.stringify(after.rows[0]));
  check('shortfall is quantified, not just flagged',
    Number(after.rows[0].coverage_microusd) === -USD(30),
    `coverage=${after.rows[0].coverage_microusd}`);

  const stillZero = await client.query(`select coalesce(sum(balance_microusd),0)::bigint as t from public.ledger_account_balances`);
  check('ledger still sums to zero even while insolvent', Number(stillZero.rows[0].t) === 0);

  // ---- funding must match the invoice it claims ---------------------------
  // Run last: these change balances, and asserting relative to the current state
  // keeps them independent of everything above.
  console.log('\n— funding is tied to the payer and the amount —');

  const wrongUser = await mkPoll(alice, 20);
  await expectFail(client, 'funding cannot credit a user who did not pay', () =>
    post({ kind: 'funding', key: `fund:${wrongUser.corr}`, pollId: wrongUser.pollId },
      [{ account: acct.cash, amount: USD(20) }, { account: acct.bobAvail, amount: -USD(20) }]),
    /not owned by the invoice payer/);

  const wrongAmt = await mkPoll(alice, 20);
  await expectFail(client, 'funding cannot credit more than was observed paid', () =>
    post({ kind: 'funding', key: `fund:${wrongAmt.corr}`, pollId: wrongAmt.pollId },
      [{ account: acct.cash, amount: USD(200) }, { account: acct.aliceAvail, amount: -USD(200) }]),
    /observed payment was/);

  const aliceBefore = await balance(acct.aliceAvail);
  const feesBefore = await balance(acct.fees);
  const feeSplit = await mkPoll(alice, 10);
  await post({ kind: 'funding', key: `fund:${feeSplit.corr}`, pollId: feeSplit.pollId },
    [{ account: acct.cash, amount: USD(10) },
     { account: acct.aliceAvail, amount: -USD(9.75) },
     { account: acct.fees, amount: -USD(0.25) }]);
  check('fee split against a funding invoice is allowed',
    await balance(acct.fees) === feesBefore - USD(0.25));
  check('user credited net of fee',
    await balance(acct.aliceAvail) === aliceBefore - USD(9.75));

  // ---- concurrency: the classic double-spend ------------------------------
  console.log('\n— concurrency: two simultaneous spends of one balance —');

  const carol = '55555555-5555-5555-5555-555555555555';
  await client.query(`insert into public.profiles (id, display_name) values ($1,'Carol')`, [carol]);
  const cAcct = (await client.query(
    `insert into public.ledger_accounts (kind, owner_user_id) values ('user_available',$1) returning id`,
    [carol])).rows[0].id;
  const cFund = await mkPoll(carol, 10);
  await post({ kind: 'funding', key: `fund:${cFund.corr}`, pollId: cFund.pollId },
    [{ account: acct.cash, amount: USD(10) }, { account: cAcct, amount: -USD(10) }]);

  // Two independent connections both try to spend $6 of Carol's $10.
  const { Client } = require('pg');
  const conn = { host: 'localhost', port: PORT, user: 'postgres', password: 'pw', database: 'ledger' };
  const cA = new Client(conn), cB = new Client(conn);
  await cA.connect(); await cB.connect();

  async function spend(cli, key) {
    await cli.query('begin');
    const t = await cli.query(
      `insert into public.ledger_transactions (kind, idempotency_key) values ('tip',$1) returning id`, [key]);
    await cli.query(
      `insert into public.ledger_postings (transaction_id, account_id, amount_microusd) values ($1,$2,$3)`,
      [t.rows[0].id, cAcct, USD(6)]);
    await cli.query(
      `insert into public.ledger_postings (transaction_id, account_id, amount_microusd) values ($1,$2,$3)`,
      [t.rows[0].id, acct.bobAvail, -USD(6)]);
  }

  await spend(cA, 'race:a');
  // Start B's write without awaiting: it must block on A's balance-row lock
  // rather than racing past it and reading a stale balance.
  const bWrite = spend(cB, 'race:b');
  let bFinishedEarly = false;
  await Promise.race([
    bWrite.then(() => { bFinishedEarly = true; }),
    new Promise((r) => setTimeout(r, 500)),
  ]);
  check('second spender blocks on the first rather than reading a stale balance', !bFinishedEarly);

  await cA.query('commit');
  await bWrite;
  let bCommitted = true;
  try {
    await cB.query('commit');
  } catch (e) {
    bCommitted = false;
    check('losing spender is rejected at COMMIT', /overdraft/.test(e.message), e.message);
  }
  if (bCommitted) check('losing spender is rejected at COMMIT', false, 'BOTH SPENDS COMMITTED — double spend');
  try { await cB.query('rollback'); } catch {}
  await cA.end(); await cB.end();

  check('exactly one of two concurrent $6 spends applied',
    await balance(cAcct) === -USD(4), `carol balance = ${await balance(cAcct)}`);

  // ---- 19a service layer: consent, provisioning, zaps ---------------------
  console.log('\n— 19a service layer: consent (B0), starter grant, record_zap —');

  const DROP = 1000; // microUSD per drop — must match nectar_drop_microusd()
  const GRANT = 500; // drops — must match nectar_starter_grant_drops()

  async function setUid(uid) {
    await client.query(`select set_config('test.uid', $1, false)`, [uid ?? '']);
  }
  async function drops(userId) {
    const r = await client.query(
      `select available_microusd from public.user_nectar_balances where user_id = $1`, [userId]);
    return r.rows.length ? Number(r.rows[0].available_microusd) / DROP : 0;
  }
  async function zap(zapId, kind, targetId, amount) {
    const r = await client.query(
      `select public.record_zap($1, $2, $3, $4) as txn`, [zapId, kind, targetId, amount]);
    return r.rows[0].txn;
  }

  const dave = '66666666-6666-6666-6666-666666666666';
  const erin = '77777777-7777-7777-7777-777777777777';
  const frank = '88888888-8888-8888-8888-888888888888';
  await client.query(
    `insert into public.profiles (id, display_name) values ($1,'Dave'),($2,'Erin'),($3,'Frank')`,
    [dave, erin, frank]);
  // Dave↔Erin are friends; Dave↔Frank are NOT (pending only).
  await client.query(
    `insert into public.honeycomb_connections (requester_id, addressee_id, status)
     values ($1,$2,'accepted'),($1,$3,'pending')`, [dave, erin, frank]);

  // Erin sent Dave a package (hive1 + a 'sent' entry), shares a feed entry,
  // and keeps a private one. hive2 went to Frank, not Dave. Dave has a shared
  // entry of his own; so does Frank.
  const hive1 = (await client.query(
    `insert into public.private_hives (owner_id, subject_profile_id, sent_at)
     values ($1,$2,now()) returning id`, [erin, dave])).rows[0].id;
  const hive2 = (await client.query(
    `insert into public.private_hives (owner_id, subject_profile_id, sent_at)
     values ($1,$2,now()) returning id`, [erin, frank])).rows[0].id;
  const entrySent = (await client.query(
    `insert into public.entries (user_id, visibility, hive_id) values ($1,'sent',$2) returning id`,
    [erin, hive1])).rows[0].id;
  const entryShared = (await client.query(
    `insert into public.entries (user_id, visibility) values ($1,'shared') returning id`,
    [erin])).rows[0].id;
  await client.query(`insert into public.shares (entry_id) values ($1)`, [entryShared]);
  const entryPrivate = (await client.query(
    `insert into public.entries (user_id, visibility) values ($1,'private') returning id`,
    [erin])).rows[0].id;
  const entryDave = (await client.query(
    `insert into public.entries (user_id, visibility) values ($1,'shared') returning id`,
    [dave])).rows[0].id;
  await client.query(`insert into public.shares (entry_id) values ($1)`, [entryDave]);
  const entryFrank = (await client.query(
    `insert into public.entries (user_id, visibility) values ($1,'shared') returning id`,
    [frank])).rows[0].id;
  await client.query(`insert into public.shares (entry_id) values ($1)`, [entryFrank]);

  const z = (n) => `99999999-9999-9999-9999-9999999999${String(n).padStart(2, '0')}`;

  // B0: the gate holds before anything else works.
  await setUid(dave);
  await expectFail(client, 'B0: record_zap before consent is refused', () =>
    zap(z(1), 'entry', entrySent, 10), /consent required/);

  await expectFail(client, 'signed-out consent is refused', async () => {
    await setUid(null);
    try { await client.query(`select * from public.consent_to_nectar()`); }
    finally { await setUid(dave); }
  }, /not signed in/);

  const consent1 = await client.query(`select * from public.consent_to_nectar()`);
  check('consent returns the starter grant',
    Number(consent1.rows[0].starter_grant_drops) === GRANT && consent1.rows[0].consented_at !== null,
    JSON.stringify(consent1.rows));
  const daveAccts = await client.query(
    `select count(*)::int n from public.ledger_accounts where owner_user_id = $1`, [dave]);
  check('consent provisions both user accounts', daveAccts.rows[0].n === 2);
  check('starter grant is spendable at the placeholder rate', await drops(dave) === GRANT);

  const grantTxn = await client.query(
    `select t.kind, p.observed_state, p.is_simulated
       from public.ledger_transactions t
       join public.strike_invoice_polls p on p.id = t.source_poll_id
      where t.memo = 'simulated starter grant'`);
  check('grant rides the real funding path, marked simulated',
    grantTxn.rows.length === 1 && grantTxn.rows[0].kind === 'funding'
      && grantTxn.rows[0].observed_state === 'SIMULATED_GRANT'
      && grantTxn.rows[0].is_simulated === true,
    JSON.stringify(grantTxn.rows));

  const consent2 = await client.query(`select * from public.consent_to_nectar()`);
  check('consent replay grants nothing further',
    Number(consent2.rows[0].starter_grant_drops) === 0 && await drops(dave) === GRANT);

  // The zap itself, against the 'sent' package entry.
  const txn1 = await zap(z(1), 'entry', entrySent, 100);
  check('zap debits the sender', await drops(dave) === GRANT - 100);
  check('zap credits a recipient who never consented (receiving needs no consent)',
    await drops(erin) === 100);
  const attr = await client.query(
    `select nz.sender_id, nz.recipient_id, nz.target_kind, nz.target_id, nz.amount_drops, t.kind
       from public.nectar_zaps nz join public.ledger_transactions t on t.id = nz.transaction_id
      where nz.id = $1`, [z(1)]);
  check('attribution row binds sender, recipient, target and amount to a tip',
    attr.rows.length === 1 && attr.rows[0].sender_id === dave
      && attr.rows[0].recipient_id === erin && attr.rows[0].target_kind === 'entry'
      && attr.rows[0].target_id === entrySent && Number(attr.rows[0].amount_drops) === 100
      && attr.rows[0].kind === 'tip',
    JSON.stringify(attr.rows));

  const txn1replay = await zap(z(1), 'entry', entrySent, 100);
  check('zap replay returns the original transaction and credits once',
    txn1replay === txn1 && await drops(erin) === 100);
  await expectFail(client, 'zap id reuse with different parameters is rejected', () =>
    zap(z(1), 'entry', entrySent, 50), /different parameters/);

  // Surface rules.
  await expectFail(client, 'self-zap is rejected', () =>
    zap(z(2), 'entry', entryDave, 10), /your own/);
  await expectFail(client, 'a private entry is not a zap surface', () =>
    zap(z(3), 'entry', entryPrivate, 10), /target not found/);
  await expectFail(client, "someone else's package is not yours to zap", () =>
    zap(z(4), 'hive', hive2, 10), /target not found/);
  await expectFail(client, 'no zap without a live accepted connection', () =>
    zap(z(5), 'entry', entryFrank, 10), /not connected friends/);
  await expectFail(client, 'amount below range is rejected', () =>
    zap(z(6), 'entry', entrySent, 0), /between 1 and 1000/);
  await expectFail(client, 'amount above range is rejected', () =>
    zap(z(7), 'entry', entrySent, 1001), /between 1 and 1000/);

  const txn2 = await zap(z(8), 'hive', hive1, 50);
  check('the package itself is zappable by its recipient',
    txn2 !== null && await drops(dave) === GRANT - 150 && await drops(erin) === 150);

  await expectFail(client, 'insufficient nectar is a clear in-function error', () =>
    zap(z(9), 'entry', entryShared, 1000), /insufficient nectar/);

  // B0 is asymmetric: Erin holds 150 received drops but never consented, so
  // she can be paid yet cannot pay.
  await setUid(erin);
  await expectFail(client, 'a credited but unconsented recipient still cannot send', () =>
    zap(z(10), 'entry', entryDave, 10), /consent required/);
  await setUid(null);

  // Live mode: consent still works, the grant does not.
  const grace = '99999999-aaaa-aaaa-aaaa-999999999999';
  await client.query(`insert into public.profiles (id, display_name) values ($1,'Grace')`, [grace]);
  await client.query(`update public.ledger_settings set rails_mode='live' where id`);
  await setUid(grace);
  const consentLive = await client.query(`select * from public.consent_to_nectar()`);
  await setUid(null);
  await client.query(`update public.ledger_settings set rails_mode='simulated' where id`);
  check('live mode: consent provisions accounts but grants no simulated nectar',
    Number(consentLive.rows[0].starter_grant_drops) === 0 && await drops(grace) === 0,
    JSON.stringify(consentLive.rows));

  // Attribution is part of the money trail: append-only like the ledger.
  await expectFail(client, 'nectar_zaps rows are append-only', () =>
    client.query(`update public.nectar_zaps set amount_drops = 999 where id = $1`, [z(1)]),
    /append-only/);

  // House revoke pattern actually landed.
  const priv = await client.query(`
    select has_function_privilege('anon', 'public.record_zap(uuid, public.nectar_zap_target_kind, uuid, bigint)', 'execute') as zap_anon,
           has_function_privilege('authenticated', 'public.record_zap(uuid, public.nectar_zap_target_kind, uuid, bigint)', 'execute') as zap_auth,
           has_function_privilege('anon', 'public.consent_to_nectar()', 'execute') as consent_anon,
           has_function_privilege('authenticated', 'public.consent_to_nectar()', 'execute') as consent_auth,
           has_function_privilege('authenticated', 'public.ledger_ensure_user_accounts(uuid)', 'execute') as helper_auth,
           has_function_privilege('authenticated', 'public.ledger_house_account(public.ledger_account_kind)', 'execute') as house_auth`);
  const pv = priv.rows[0];
  check('RPCs: anon revoked, authenticated granted',
    !pv.zap_anon && pv.zap_auth && !pv.consent_anon && pv.consent_auth, JSON.stringify(pv));
  check('internal provisioning helpers are not client-callable',
    !pv.helper_auth && !pv.house_auth, JSON.stringify(pv));

  // ---- re-verify globals after the mutating sections above ----------------
  console.log('\n— globals re-checked after all writes —');

  const zero2 = await client.query(`select coalesce(sum(balance_microusd),0)::bigint as t from public.ledger_account_balances`);
  check('ledger still sums to zero at end of suite', Number(zero2.rows[0].t) === 0, `got ${zero2.rows[0].t}`);
  const drift2 = await client.query(`select * from public.ledger_verify_balance_cache()`);
  check('no cache drift at end of suite', drift2.rows.length === 0, JSON.stringify(drift2.rows));

  // ---- report -------------------------------------------------------------
  console.log(`\n${'='.repeat(64)}`);
  console.log(`${pass} passed, ${fail} failed`);
  if (fail) console.log(`failures:\n  - ${failures.join('\n  - ')}`);
  console.log('='.repeat(64) + '\n');

  await client.end();
  await pg.stop();
  process.exit(fail ? 1 : 0);
}

main().catch(async (e) => { console.error('HARNESS ERROR:', e); process.exit(2); });
