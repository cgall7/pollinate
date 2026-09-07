// Gate for ENG-102 — Garden's read layer
// (supabase/migrations/20260907000001_eng102_garden_nectar_reads.sql):
// get_nectar_garden_totals() and get_nectar_senders().
//
//   npm run check:eng102-garden-nectar-reads
//
// THE ONE THING THIS FILE EXISTS TO PROVE: both producers are counted.
// Nectar moves through two independent tables — nectar_zaps (record_zap)
// and comb_nectar_notes (send_comb_nectar_note) — and a read that unions
// only one looks correct and silently undercounts every comb send. Every
// totals/sender assertion below seeds rows in BOTH tables and checks the
// combined result; several rows exist specifically to fail if either
// producer were dropped from the union.
//
// DES-42 (Lumen, ruled the same day this ticket was filed, thread
// b57ad406): the leaderboard does not exist. get_nectar_senders is
// unranked by construction — it does not select amount_drops from either
// producer, so the "recency, never magnitude" ruling is proven structurally
// (assert the column is simply absent from the row) and empirically (seed
// the smaller gift more recently than the larger one; the smaller one must
// sort first).
//
// Modeled on check-comb-open-rotation.mjs for the harness shape (embedded
// Postgres, SUPABASE_ENV fixture, asUser/asPostgres/asAnon helpers).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);

if (process.env.SKIP_PG_GATES === '1') {
  console.log('check-eng102-garden-nectar-reads: SKIPPED — SKIP_PG_GATES=1 set explicitly');
  process.exit(0);
}

let EmbeddedPostgres;
try {
  EmbeddedPostgres = require('embedded-postgres').default;
  require('pg');
} catch (e) {
  console.error(
    `check-eng102-garden-nectar-reads: FAILED — embedded-postgres/pg not installed (${e.message.split('\n')[0]}).\n` +
      '  Run `npm install` (both are devDependencies), or set SKIP_PG_GATES=1 to skip deliberately\n' +
      '  on a machine that genuinely cannot run a local Postgres.'
  );
  process.exit(1);
}

const APPLY = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();

// A: the Garden owner whose totals/senders we read throughout.
// B: a honeycomb_connections friend of A — sends A a nectar_zap.
// C: a comb co-member of A, NOT a friend — sends A a comb_nectar_note.
//    Every read touching C proves the definer name-join reaches a
//    non-friend, the same trap ENG-97 fixed for organizer names.
// D, E: recipients of sends FROM A — exercise sent_drops/recipients_count.
// STRANGER: sent nothing, received nothing — must never appear.
const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
const C = '33333333-3333-3333-3333-333333333333';
const D = '44444444-4444-4444-4444-444444444444';
const E = '55555555-5555-5555-5555-555555555555';
const STRANGER = '66666666-6666-6666-6666-666666666666';
const FRESH = '77777777-7777-7777-7777-777777777777'; // zero-state user

let pass = 0;
const failures = [];
const ok = (name) => {
  pass += 1;
  console.log(`  ok   ${name}`);
};
const bad = (name, detail) => {
  failures.push(`${name} — ${detail}`);
  console.log(`  FAIL ${name}\n         ${detail}`);
};

const SUPABASE_ENV = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant anon, authenticated, service_role to postgres;
  create schema auth;
  create table auth.users (id uuid primary key, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
    )::uuid;
  $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets(id),
    name text,
    owner uuid
  );
  alter table storage.objects enable row level security;
  create function storage.foldername(n text) returns text[] language sql immutable as $$
    select string_to_array(n, '/');
  $$;
  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;

async function main() {
  const dataDir = path.join(ROOT, '.eng102-garden-nectar-pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    // Distinct from every other gate's port (54329-54343 taken).
    port: 54344,
    persistent: false,
  });

  await pg.initialise();
  await pg.start();
  await pg.createDatabase('app');
  const client = pg.getPgClient('app');
  await client.connect();

  try {
    await client.query(SUPABASE_ENV);
    for (const file of APPLY) {
      const sql = fs.readFileSync(path.join(MIGRATIONS, file), 'utf8');
      try {
        await client.query(sql);
      } catch (e) {
        throw new Error(`replaying ${file}: ${e.message}`);
      }
    }

    await client.query(
      `insert into auth.users (id, raw_user_meta_data) values
        ($1, $2), ($3, $4), ($5, $6), ($7, $8), ($9, $10), ($11, $12), ($13, $14)`,
      [
        A, JSON.stringify({ display_name: 'Maya' }),
        B, JSON.stringify({ display_name: 'Priya' }),
        C, JSON.stringify({ display_name: 'Sarah' }),
        D, JSON.stringify({ display_name: 'Owen' }),
        E, JSON.stringify({ display_name: 'Noor' }),
        STRANGER, JSON.stringify({ display_name: 'Stranger' }),
        FRESH, JSON.stringify({ display_name: 'Fresh' }),
      ]
    );

    const asPostgres = async (fn) => {
      await client.query("select set_config('role', 'postgres', true)");
      return fn();
    };
    const asUser = async (uid, fn) => {
      await client.query('begin');
      try {
        await client.query("select set_config('role', 'authenticated', true)");
        await client.query("select set_config('request.jwt.claims', $1, true)", [
          JSON.stringify({ sub: uid, role: 'authenticated' }),
        ]);
        const result = await fn();
        await client.query('commit');
        return result;
      } catch (e) {
        await client.query('rollback');
        throw e;
      }
    };
    const asAnon = async (fn) => {
      await client.query('begin');
      try {
        await client.query("select set_config('role', 'anon', true)");
        await client.query("select set_config('request.jwt.claims', '', true)");
        const result = await fn();
        await client.query('commit');
        return result;
      } catch (e) {
        await client.query('rollback');
        throw e;
      }
    };

    // ---------------------------------------------------------------
    // Fixture: B is a friend of A (honeycomb_connections). C is only a
    // comb co-member of A — never a connections row — the case ENG-97
    // named.
    await asPostgres(() =>
      client.query(
        `insert into public.honeycomb_connections (requester_id, addressee_id, status)
         values ($1, $2, 'accepted')`,
        [A, B]
      )
    );
    const { rows: combRows } = await asUser(A, () =>
      client.query("insert into public.combs (owner_id, name) values ($1, 'Test Comb') returning id", [A])
    );
    const combId = combRows[0].id;
    await asPostgres(() =>
      client.query('insert into public.comb_members (comb_id, profile_id) values ($1, $2)', [combId, C])
    );

    // Direct ledger rows: this gate exercises the READ layer, not
    // record_zap/send_comb_nectar_note's own money-movement correctness
    // (check-nectar-exchange.mjs, check-eng90-comb-nectar.mjs own that) —
    // a ledger_transactions row satisfies the FK, postgres bypasses RLS
    // and grants to insert the rest directly.
    let txnSeq = 0;
    const txn = async () => {
      txnSeq += 1;
      const { rows } = await asPostgres(() =>
        client.query(
          "insert into public.ledger_transactions (kind, idempotency_key, memo) values ('tip', $1, 'gate fixture') returning id",
          [`eng102-fixture:${txnSeq}`]
        )
      );
      return rows[0].id;
    };
    const insertZap = (sender, recipient, amount, createdAt) =>
      asPostgres(async () => {
        const t = await txn();
        await client.query(
          `insert into public.nectar_zaps
             (id, transaction_id, sender_id, recipient_id, target_kind, target_id, amount_drops, created_at)
           values (gen_random_uuid(), $1, $2, $3, 'entry', gen_random_uuid(), $4, $5)`,
          [t, sender, recipient, amount, createdAt]
        );
      });
    const insertNote = (sender, recipient, amount, createdAt) =>
      asPostgres(async () => {
        const t = await txn();
        await client.query(
          `insert into public.comb_nectar_notes
             (id, comb_id, transaction_id, sender_id, recipient_id, note_text, amount_drops, created_at)
           values (gen_random_uuid(), $1, $2, $3, $4, 'Thank you', $5, $6)`,
          [combId, t, sender, recipient, amount, createdAt]
        );
      });

    const hoursAgo = (n) => new Date(Date.now() - n * 3600 * 1000);
    const T0 = hoursAgo(4);
    const T1 = hoursAgo(3);
    const T2 = hoursAgo(2);
    const T3 = hoursAgo(1);

    // Received side: B (friend, nectar_zaps) sends A 50 at T1; C (comb
    // co-member, NOT a friend, comb_nectar_notes) sends A 30 at T2 (more
    // recently, but a smaller amount — the pair that separates recency
    // from magnitude for get_nectar_senders' ordering assertion below).
    await insertZap(B, A, 50, T1);
    await insertNote(C, A, 30, T2);

    // Sent side: A sends D 20 (zap) and D 10 (comb note) — same recipient,
    // both producers, distinct-recipient count must still read 1 for D.
    // A also sends E 5 (zap) — recipients_count across both producers is 2.
    await insertZap(A, D, 20, T0);
    await insertNote(A, D, 10, T0);
    await insertZap(A, E, 5, T0);

    // ---------------------------------------------------------------
    // get_nectar_garden_totals — two-producer sums, both directions.
    {
      const { rows } = await asUser(A, () => client.query('select * from public.get_nectar_garden_totals()'));
      const row = rows[0];
      if (Number(row.received_drops) === 80) {
        ok('totals: received_drops sums nectar_zaps (50) + comb_nectar_notes (30) = 80');
      } else {
        bad('totals: received_drops sums nectar_zaps (50) + comb_nectar_notes (30) = 80', `got ${row.received_drops}`);
      }
      if (Number(row.sent_drops) === 35) {
        ok('totals: sent_drops sums both producers across both recipients = 35');
      } else {
        bad('totals: sent_drops sums both producers across both recipients = 35', `got ${row.sent_drops}`);
      }
      if (Number(row.recipients_count) === 2) {
        ok('totals: recipients_count is DISTINCT across both producers (D once, not twice, + E) = 2');
      } else {
        bad('totals: recipients_count is DISTINCT across both producers (D once, not twice, + E) = 2', `got ${row.recipients_count}`);
      }
    }

    // ---------------------------------------------------------------
    // Zero-state: a user with no rows in either table gets real zeros,
    // not an error and not a missing row.
    {
      const { rows } = await asUser(FRESH, () => client.query('select * from public.get_nectar_garden_totals()'));
      const row = rows[0];
      if (row && Number(row.received_drops) === 0 && Number(row.sent_drops) === 0 && Number(row.recipients_count) === 0) {
        ok('totals: zero-state user gets one row of real zeros, not an error');
      } else {
        bad('totals: zero-state user gets one row of real zeros, not an error', JSON.stringify(row));
      }
    }

    // ---------------------------------------------------------------
    // get_nectar_senders — unranked, recency-only, both producers.
    {
      const { rows } = await asUser(A, () => client.query('select * from public.get_nectar_senders()'));
      const ids = rows.map((r) => r.sender_id);
      if (ids.length === 2 && ids.includes(B) && ids.includes(C)) {
        ok('senders: exactly B and C, one row per distinct sender across both producers');
      } else {
        bad('senders: exactly B and C, one row per distinct sender across both producers', JSON.stringify(ids));
      }

      // Recency, not magnitude: C sent LESS (30) but MORE RECENTLY than B
      // (50) — C must sort first. A row ordering that sorted by amount
      // instead would put B first.
      if (rows[0]?.sender_id === C && rows[1]?.sender_id === B) {
        ok('senders: ordered by recency (smaller, more recent gift sorts first) — never by amount');
      } else {
        bad('senders: ordered by recency (smaller, more recent gift sorts first) — never by amount', JSON.stringify(rows));
      }

      // DES-42: no per-sender amount leaves the server, structurally — the
      // key is simply absent, not merely unused by the client.
      const hasAmountKey = rows.some((r) => Object.prototype.hasOwnProperty.call(r, 'amount_drops'));
      if (!hasAmountKey) {
        ok('senders: amount_drops is not a column of the result at all (DES-42)');
      } else {
        bad('senders: amount_drops is not a column of the result at all (DES-42)', 'amount_drops present in row shape');
      }

      // Name resolution reaches C, a comb co-member with no
      // honeycomb_connections row to A — the ENG-97 trap.
      const cRow = rows.find((r) => r.sender_id === C);
      if (cRow?.display_name === 'Sarah') {
        ok('senders: name resolves for a non-friend comb co-member (ENG-97 trap) — definer join, not RLS-scoped');
      } else {
        bad('senders: name resolves for a non-friend comb co-member (ENG-97 trap) — definer join, not RLS-scoped', JSON.stringify(cRow));
      }

      // D received from A, never sent to A — must not appear as a sender.
      // STRANGER sent and received nothing — must not appear either.
      if (!ids.includes(D) && !ids.includes(STRANGER)) {
        ok('senders: a recipient of A\'s sends (D) and an uninvolved user (STRANGER) never appear');
      } else {
        bad('senders: a recipient of A\'s sends (D) and an uninvolved user (STRANGER) never appear', JSON.stringify(ids));
      }
    }

    // ---------------------------------------------------------------
    // Multiple gifts from the same sender collapse to one row, timestamped
    // at the LATEST gift — not double-counted, not stuck at the first.
    {
      await insertZap(B, A, 15, T3);
      const { rows } = await asUser(A, () => client.query('select * from public.get_nectar_senders()'));
      const bRows = rows.filter((r) => r.sender_id === B);
      if (bRows.length === 1) {
        ok('senders: a second gift from an existing sender collapses to one row, not two');
      } else {
        bad('senders: a second gift from an existing sender collapses to one row, not two', `${bRows.length} rows for B`);
      }
      // B's second gift (T3) is now the most recent of all — B should sort
      // first, ahead of C (T2).
      if (rows[0]?.sender_id === B) {
        ok('senders: the collapsed row carries the LATEST gift\'s timestamp (B now sorts first)');
      } else {
        bad('senders: the collapsed row carries the LATEST gift\'s timestamp (B now sorts first)', JSON.stringify(rows));
      }
    }

    // ---------------------------------------------------------------
    // Zero-state senders: empty array, not an error.
    {
      const { rows } = await asUser(FRESH, () => client.query('select * from public.get_nectar_senders()'));
      if (rows.length === 0) {
        ok('senders: zero-state user gets an empty set, not an error');
      } else {
        bad('senders: zero-state user gets an empty set, not an error', JSON.stringify(rows));
      }
    }

    // ---------------------------------------------------------------
    // Auth boundary: signed-out caller refused stably, both functions.
    {
      try {
        await client.query('select * from public.get_nectar_garden_totals()');
        bad('auth: signed-out caller refused, by name (totals)', 'call succeeded');
      } catch (e) {
        if (/get_nectar_garden_totals: not signed in/.test(e.message)) {
          ok('auth: signed-out caller refused, by name (totals)');
        } else {
          bad('auth: signed-out caller refused, by name (totals)', e.message);
        }
      }
      try {
        await client.query('select * from public.get_nectar_senders()');
        bad('auth: signed-out caller refused, by name (senders)', 'call succeeded');
      } catch (e) {
        if (/get_nectar_senders: not signed in/.test(e.message)) {
          ok('auth: signed-out caller refused, by name (senders)');
        } else {
          bad('auth: signed-out caller refused, by name (senders)', e.message);
        }
      }
    }

    // ---------------------------------------------------------------
    // Grant surface: anon can never reach either function — the
    // migration's own named revoke, proven rather than assumed.
    {
      try {
        await asAnon(() => client.query('select * from public.get_nectar_garden_totals()'));
        bad('grants: anon refused, 42501 (totals)', 'call succeeded');
      } catch (e) {
        if (e.code === '42501') {
          ok('grants: anon refused, 42501 (totals)');
        } else {
          bad('grants: anon refused, 42501 (totals)', `got ${e.code}: ${e.message}`);
        }
      }
      try {
        await asAnon(() => client.query('select * from public.get_nectar_senders()'));
        bad('grants: anon refused, 42501 (senders)', 'call succeeded');
      } catch (e) {
        if (e.code === '42501') {
          ok('grants: anon refused, 42501 (senders)');
        } else {
          bad('grants: anon refused, 42501 (senders)', `got ${e.code}: ${e.message}`);
        }
      }
    }

    console.log(`\ncheck-eng102-garden-nectar-reads: ${pass} passed, ${failures.length} failed`);
    if (failures.length > 0) {
      console.log('\nFailures:');
      failures.forEach((f) => console.log(`  - ${f}`));
      await client.end();
      await pg.stop();
      fs.rmSync(dataDir, { recursive: true, force: true });
      process.exit(1);
    }
  } finally {
    await client.end();
    await pg.stop();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error('check-eng102-garden-nectar-reads: FAILED —', e.message);
  process.exit(1);
});
