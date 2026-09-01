// Executable acceptance gate for ENG-90's RPC-only comb nectar-note surface.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);
if (process.env.SKIP_PG_GATES === '1') { console.log('check-eng90-comb-nectar: SKIPPED'); process.exit(0); }
let EmbeddedPostgres;
try { EmbeddedPostgres = require('embedded-postgres').default; require('pg'); }
catch (e) { console.error(`check-eng90-comb-nectar: FAILED — ${e.message}`); process.exit(1); }

const APPLY = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();
const SENDER = '11111111-1111-1111-1111-111111111111';
const RECIPIENT = '22222222-2222-2222-2222-222222222222';
const OUTSIDER = '33333333-3333-3333-3333-333333333333';
const SEND_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const SEND_RACE = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
let passed = 0; let failed = 0;
const ok = (name) => { passed += 1; console.log(`  ok   ${name}`); };
const bad = (name, detail) => { failed += 1; console.log(`  FAIL ${name}\n         ${detail}`); };
const expectFail = async (name, fn, pattern) => {
  try { await fn(); bad(name, 'unexpected success'); }
  catch (e) { pattern.test(e.message) ? ok(name) : bad(name, e.message); }
};

const SUPABASE_ENV = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
grant anon, authenticated, service_role to postgres;
create schema auth; create table auth.users (id uuid primary key, raw_user_meta_data jsonb, email text);
create function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
create schema storage; create table storage.buckets(id text primary key,name text,public boolean);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(n text) returns text[] language sql immutable as $$ select string_to_array(n,'/') $$;
grant usage on schema public,auth,storage to anon,authenticated,service_role;
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
alter default privileges in schema public grant all on functions to anon,authenticated,service_role;`;

async function main() {
  const dataDir = path.join(ROOT, '.eng90-comb-nectar-pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({ databaseDir: dataDir, user: 'postgres', password: 'postgres', port: 54342, persistent: false });
  await pg.initialise(); await pg.start(); await pg.createDatabase('app');
  const client = pg.getPgClient('app'); await client.connect();
  const asUser = async (c, uid, fn) => {
    await c.query('begin');
    try {
      await c.query("select set_config('role','authenticated',true)");
      await c.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: uid, role: 'authenticated' })]);
      const result = await fn(); await c.query('commit'); return result;
    } catch (e) { await c.query('rollback'); throw e; }
  };
  let combId;
  const send = (c, id, recipient = RECIPIENT, note = 'You make this brighter', amount = 10) =>
    asUser(c, SENDER, () => c.query('select * from public.send_comb_nectar_note($1,$2,$3,$4,$5)', [id, combId, recipient, note, amount]));
  try {
    await client.query(SUPABASE_ENV);
    for (const file of APPLY) await client.query(fs.readFileSync(path.join(MIGRATIONS, file), 'utf8'));
    await client.query('insert into auth.users(id,raw_user_meta_data) values($1,$2),($3,$4),($5,$6)', [SENDER, '{"display_name":"Sender"}', RECIPIENT, '{"display_name":"Recipient"}', OUTSIDER, '{"display_name":"Outsider"}']);
    ({ rows: [{ id: combId }] } = await client.query("insert into public.combs(owner_id,name) values($1,'Test Comb') returning id", [SENDER]));
    await client.query('insert into public.comb_members(comb_id,profile_id) values($1,$2),($1,$3)', [combId, RECIPIENT, OUTSIDER]);
    await asUser(client, SENDER, () => client.query('select * from public.consent_to_nectar()'));
    await asUser(client, OUTSIDER, () => client.query('select * from public.consent_to_nectar()'));

    await expectFail('signed-out caller refused stably', () => client.query(
      'select * from public.send_comb_nectar_note($1,$2,$3,$4,$5)', [crypto.randomUUID(), combId, RECIPIENT, 'Thanks', 1]
    ), /send_comb_nectar_note: not signed in/);
    await expectFail('missing required IDs refused stably', () => asUser(client, SENDER, () => client.query(
      'select * from public.send_comb_nectar_note($1,$2,$3,$4,$5)', [null, null, RECIPIENT, 'Thanks', 1]
    )), /send id and comb are required/);
    await expectFail('sender consent refused stably', () => asUser(client, RECIPIENT, () => client.query(
      'select * from public.send_comb_nectar_note($1,$2,$3,$4,$5)', [crypto.randomUUID(), combId, OUTSIDER, 'Thanks', 1]
    )), /nectar consent required before sending/);

    await expectFail('authenticated clients cannot INSERT notes directly', () => asUser(client, SENDER, () => client.query("insert into public.comb_nectar_notes(id,comb_id,transaction_id,sender_id,recipient_id,note_text,amount_drops) values(gen_random_uuid(),$1,gen_random_uuid(),$2,$3,'forged',1)", [combId, SENDER, RECIPIENT])), /permission denied|row-level security/);
    const directInvalid = async (note) => {
      const { rows: [{ id }] } = await client.query(
        "insert into public.ledger_transactions(kind,idempotency_key,memo) values('tip',$1,'constraint probe') returning id",
        [`eng90-constraint:${crypto.randomUUID()}`],
      );
      return client.query('insert into public.comb_nectar_notes(id,comb_id,transaction_id,sender_id,recipient_id,note_text,amount_drops) values(gen_random_uuid(),$1,$2,$3,$4,$5,1)', [combId, id, SENDER, RECIPIENT, note]);
    };
    await expectFail('persisted 1–8-word constraint rejects nine words directly', () => directInvalid('one two three four five six seven eight nine'), /comb_nectar_notes_note_words/);
    await expectFail('persisted 280-character constraint rejects 281 directly', () => directInvalid('x'.repeat(281)), /comb_nectar_notes_note_length/);
    const first = await send(client, SEND_A);
    first.rows.length === 1 ? ok('valid send returns one committed note') : bad('valid send returns one committed note', JSON.stringify(first.rows));
    const countFor = async (id) => (await client.query("select (select count(*)::int from public.comb_nectar_notes where id=$1) notes,(select count(*)::int from public.ledger_transactions where idempotency_key='comb-note:'||$1) txns,(select count(*)::int from public.ledger_postings p join public.ledger_transactions t on t.id=p.transaction_id where t.idempotency_key='comb-note:'||$1) postings", [id])).rows[0];
    let counts = await countFor(SEND_A);
    counts.notes === 1 && counts.txns === 1 && counts.postings === 2 ? ok('one note maps to one transaction and two postings') : bad('one note maps to one transaction and two postings', JSON.stringify(counts));
    await expectFail('changed replay is mismatch before validation', () => send(client, SEND_A, RECIPIENT, '', 0), /already recorded with different parameters/);
    await expectFail('self-send refused', () => send(client, crypto.randomUUID(), SENDER), /cannot send to yourself/);
    await expectFail('inactive recipient refused', () => send(client, crypto.randomUUID(), '44444444-4444-4444-4444-444444444444'), /recipient not eligible/);
    await expectFail('word floor enforced', () => send(client, crypto.randomUUID(), RECIPIENT, '   '), /1 and 8 words/);
    await expectFail('word ceiling enforced', () => send(client, crypto.randomUUID(), RECIPIENT, 'one two three four five six seven eight nine'), /1 and 8 words/);
    await expectFail('character ceiling enforced', () => send(client, crypto.randomUUID(), RECIPIENT, 'x'.repeat(281)), /too long/);
    await expectFail('amount bounds enforced', () => send(client, crypto.randomUUID(), RECIPIENT, 'Thanks', 1001), /amount must be between/);
    const rollbackId = crypto.randomUUID();
    await expectFail('insufficient balance refuses atomically', () => send(client, rollbackId, RECIPIENT, 'Thanks', 500), /insufficient nectar/);
    counts = await countFor(rollbackId);
    counts.notes === 0 && counts.txns === 0 && counts.postings === 0 ? ok('failed transfer leaves no note, transaction, or posting') : bad('failed transfer leaves no note, transaction, or posting', JSON.stringify(counts));
    const second = pg.getPgClient('app'); await second.connect();
    const raced = await Promise.all([send(client, SEND_RACE), send(second, SEND_RACE)]); await second.end();
    counts = await countFor(SEND_RACE);
    raced[0].rows[0].transaction_id === raced[1].rows[0].transaction_id && counts.notes === 1 && counts.txns === 1 && counts.postings === 2 ? ok('concurrent same-ID calls converge on one balanced transfer') : bad('concurrent same-ID calls converge on one balanced transfer', JSON.stringify(counts));
    await client.query('update public.comb_members set removed_at=now() where comb_id=$1 and profile_id=$2', [combId, RECIPIENT]);
    const replay = await send(client, SEND_A);
    replay.rows[0].transaction_id === first.rows[0].transaction_id ? ok('exact replay survives recipient removal') : bad('exact replay survives recipient removal', JSON.stringify(replay.rows));
    await client.query('update public.comb_members set removed_at=now() where comb_id=$1 and profile_id=$2', [combId, OUTSIDER]);
    await expectFail('inactive sender refused', () => asUser(client, OUTSIDER, () => client.query(
      'select * from public.send_comb_nectar_note($1,$2,$3,$4,$5)', [crypto.randomUUID(), combId, RECIPIENT, 'Thanks', 1]
    )), /sender is not an active comb member/);
    await expectFail('UPDATE is mechanically immutable', () => client.query("update public.comb_nectar_notes set note_text='changed' where id=$1", [SEND_A]), /append-only/);
    await expectFail('DELETE is mechanically immutable', () => client.query('delete from public.comb_nectar_notes where id=$1', [SEND_A]), /append-only/);
    const reads = [];
    for (const uid of [SENDER, RECIPIENT, OUTSIDER]) reads.push((await asUser(client, uid, () => client.query('select id from public.comb_nectar_notes where comb_id=$1', [combId]))).rows.length);
    reads[0] === 2 && reads[1] === 2 && reads[2] === 0 ? ok('only sender and recipient can read notes') : bad('only sender and recipient can read notes', reads.join('/'));
  } catch (e) { bad('gate harness completes', e.stack || e.message); }
  finally { await client.end().catch(() => {}); await pg.stop().catch(() => {}); fs.rmSync(dataDir, { recursive: true, force: true }); }
  console.log(`\n${passed} passed, ${failed} failed`); if (failed) process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(1); });
