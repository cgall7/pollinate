// ENG-89 (Fizz, POLLINATE_COMB_ROTATION.md §6): instruments C1
// (comb_rotation_participation / comb_c1_sustained), C3
// (comb_c3_survival_report) and C5 (comb_c5_note_frequency) —
// supabase/migrations/20260904000001_eng89_c1_c3_c5_instruments.sql.
// C2 is ENG-78's (exists already). C4 is the one condition with no real
// data source (ENG-85 ships its plan limits NULL) — that's the client-side
// Analytics.track() shadow-event pair checked at the bottom of this file.
// C5 looks like the same shape (a client fires a send) but isn't: ENG-90's
// send_comb_nectar_note already durably persists one row per send to
// comb_nectar_notes, so C5 is a real aggregate query like C1/C3, not an
// event — fixtures for it are in the SQL section below, not the source-grep
// section.
//
//   npm run check:eng89-instruments
//
// What's actually under test in the SQL half: the §1B.36.8 exclusion
// predicate is an EQUALITY (hive_contributors.removed_at = profiles.deleted_at),
// not `deleted_at is not null` — the three fixtures below (ordinary comb
// departure, account deletion, quit-then-delete-LATER) are chosen because a
// bare `is not null` reading passes the first two and only diverges on the
// third, which is exactly the case §1B.36.8 was ruled to fix.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);

if (process.env.SKIP_PG_GATES === '1') {
  console.log('check-eng89-instruments: SKIPPED — SKIP_PG_GATES=1 set explicitly');
  process.exit(0);
}

let EmbeddedPostgres;
try {
  EmbeddedPostgres = require('embedded-postgres').default;
  require('pg');
} catch (e) {
  console.error(
    `check-eng89-instruments: FAILED — embedded-postgres/pg not installed (${e.message.split('\n')[0]}).\n` +
      '  Run `npm install` (both are devDependencies), or set SKIP_PG_GATES=1 to skip deliberately\n' +
      '  on a machine that genuinely cannot run a local Postgres.'
  );
  process.exit(1);
}

const APPLY = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();

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
const firstLine = (e) => e.message.split('\n')[0].slice(0, 160);

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
  const dataDir = path.join(ROOT, '.eng89-instruments-pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    // Distinct from every other gate's port (54329-54337 already taken).
    port: 54338,
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

    const asPostgres = async (fn) => {
      await client.query("select set_config('role', 'postgres', true)");
      return fn();
    };
    const asService = async (fn) => {
      await client.query('begin');
      try {
        await client.query("select set_config('role', 'service_role', true)");
        await client.query("select set_config('request.jwt.claims', '', true)");
        const result = await fn();
        await client.query('commit');
        return result;
      } catch (e) {
        await client.query('rollback');
        throw e;
      }
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

    let userCounter = 0;
    async function makeUser() {
      userCounter += 1;
      const id = `00000000-0000-0000-0000-${String(userCounter).padStart(12, '0')}`;
      await asPostgres(() =>
        client.query('insert into auth.users (id, raw_user_meta_data) values ($1, $2)', [
          id,
          JSON.stringify({ display_name: `User ${userCounter}` }),
        ])
      );
      return id;
    }

    // Builds a comb with one rotation whose hive_contributors are set up
    // directly (bypassing the join/mint RPCs, which is fine here — this
    // gate is about what comb_rotation_participation READS, not about how
    // a rotation legitimately gets minted; that's check-comb-open-rotation
    // and check-eng91's job). `contributors` is an array of
    // { id, removedAt, writes }; `resolved` controls sealed_at/voided_at.
    async function buildRotation({ owner, subject, ordinal = 1, combId = null, contributors, resolved = 'sealed' }) {
      let useCombId = combId;
      if (!useCombId) {
        const { rows } = await asPostgres(() =>
          client.query("insert into public.combs (owner_id, name) values ($1, 'Test Comb') returning id", [owner])
        );
        useCombId = rows[0].id;
      }
      const { rows: hiveRows } = await asPostgres(() =>
        client.query(
          "insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective) values ($1, 'Rotation', $2, true) returning id",
          [owner, subject]
        )
      );
      const hiveId = hiveRows[0].id;

      for (const c of contributors) {
        await asPostgres(() =>
          client.query(
            'insert into public.hive_contributors (hive_id, profile_id, invited_by, removed_at) values ($1, $2, $3, $4)',
            [hiveId, c.id, owner, c.removedAt ?? null]
          )
        );
        if (c.writes) {
          await asPostgres(() =>
            client.query(
              "insert into public.entries (user_id, hive_id, content, entry_date) values ($1, $2, 'For subject', current_date)",
              [c.id, hiveId]
            )
          );
        }
      }

      const sealedAt = resolved === 'sealed' ? 'now()' : 'null';
      const voidedAt = resolved === 'voided' ? 'now()' : 'null';
      const voidedReason = resolved === 'voided' ? "'quiet'" : 'null';
      const { rows: rotRows } = await asPostgres(() =>
        client.query(
          `insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at, sealed_at, voided_at, voided_reason)
           values ($1, $2, $3, $4, now() - interval '1 hour', ${sealedAt}, ${voidedAt}, ${voidedReason}) returning id`,
          [useCombId, ordinal, hiveId, subject]
        )
      );
      return { combId: useCombId, hiveId, rotationId: rotRows[0].id };
    }

    async function participationOf(rotationId) {
      const { rows } = await asService(() =>
        client.query('select * from public.comb_rotation_participation($1)', [rotationId])
      );
      return rows[0] ?? null;
    }

    // ---------------------------------------------------------------
    // 1. Ordinary rotation: 2 of 3 eligible contributors wrote.
    {
      const owner = await makeUser();
      const subject = await makeUser();
      const w1 = await makeUser();
      const w2 = await makeUser();
      const w3 = await makeUser();
      const { rotationId } = await buildRotation({
        owner,
        subject,
        contributors: [
          { id: w1, writes: true },
          { id: w2, writes: true },
          { id: w3, writes: false },
        ],
      });
      const p = await participationOf(rotationId);
      if (p && p.numerator === 2 && p.denominator === 3) {
        ok('C1: ordinary rotation — numerator/denominator count exactly who wrote / who could');
      } else {
        bad('C1: ordinary rotation — numerator/denominator count exactly who wrote / who could', JSON.stringify(p));
      }
    }

    // ---------------------------------------------------------------
    // 2. Comb departure (removed_at set, deleted_at stays null) stays in
    // the denominator — §1B.26.3/§1B.36.7.
    {
      const owner = await makeUser();
      const subject = await makeUser();
      const w1 = await makeUser();
      const departed = await makeUser();
      const { rotationId } = await buildRotation({
        owner,
        subject,
        contributors: [
          { id: w1, writes: true },
          { id: departed, writes: false, removedAt: new Date().toISOString() },
        ],
      });
      const p = await participationOf(rotationId);
      if (p && p.numerator === 1 && p.denominator === 2) {
        ok('C1: an ordinary comb departure (removed_at set, deleted_at null) stays in the denominator');
      } else {
        bad('C1: an ordinary comb departure (removed_at set, deleted_at null) stays in the denominator', JSON.stringify(p));
      }
    }

    // ---------------------------------------------------------------
    // 3. Account deletion (removed_at = deleted_at, same transaction) is
    // excluded from the denominator — the ENG-84 symmetric-drop case.
    {
      const owner = await makeUser();
      const subject = await makeUser();
      const w1 = await makeUser();
      const deleted = await makeUser();
      const stamp = new Date().toISOString();
      const { rotationId } = await buildRotation({
        owner,
        subject,
        contributors: [
          { id: w1, writes: true },
          { id: deleted, writes: false, removedAt: stamp },
        ],
      });
      await asPostgres(() => client.query('update public.profiles set deleted_at = $1 where id = $2', [stamp, deleted]));
      const p = await participationOf(rotationId);
      if (p && p.numerator === 1 && p.denominator === 1) {
        ok('C1: account deletion (removed_at = deleted_at) is excluded from the denominator');
      } else {
        bad('C1: account deletion (removed_at = deleted_at) is excluded from the denominator', JSON.stringify(p));
      }
    }

    // ---------------------------------------------------------------
    // 4. Quit-then-delete-LATER: removed_at (quit time) != deleted_at
    // (deletion time, weeks later) — must stay in the denominator, the
    // exact case §1B.36.8 ruled `is not null` wrong for (it would read
    // >100% here since the numerator still has this person's sealed
    // entry). Comb departure does not delete entries (only ENG-84's own
    // account-deletion path does, and only for UNSEALED entries) so the
    // entry this contributor wrote before quitting is still counted.
    {
      const owner = await makeUser();
      const subject = await makeUser();
      const quitThenDeleted = await makeUser();
      const quitStamp = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const deleteStamp = new Date().toISOString();
      const { rotationId } = await buildRotation({
        owner,
        subject,
        contributors: [{ id: quitThenDeleted, writes: true, removedAt: quitStamp }],
      });
      await asPostgres(() =>
        client.query('update public.profiles set deleted_at = $1 where id = $2', [deleteStamp, quitThenDeleted])
      );
      const p = await participationOf(rotationId);
      if (p && p.numerator === 1 && p.denominator === 1) {
        ok('C1: quit-then-delete-later (removed_at <> deleted_at) stays in the denominator — no 110%');
      } else {
        bad('C1: quit-then-delete-later (removed_at <> deleted_at) stays in the denominator — no 110%', JSON.stringify(p));
      }
    }

    // ---------------------------------------------------------------
    // 5. An unresolved rotation (neither sealed nor voided) returns no
    // row — an in-progress month is not a participation number yet.
    {
      const owner = await makeUser();
      const subject = await makeUser();
      const w1 = await makeUser();
      const { rotationId } = await buildRotation({
        owner,
        subject,
        contributors: [{ id: w1, writes: true }],
        resolved: 'open',
      });
      const p = await participationOf(rotationId);
      if (p === null) {
        ok('C1: an unresolved rotation returns no row, not a premature number');
      } else {
        bad('C1: an unresolved rotation returns no row, not a premature number', JSON.stringify(p));
      }
    }

    // ---------------------------------------------------------------
    // 6/7. comb_c1_sustained: 3 consecutive resolved rotations all >=60%
    // -> true; a comb with only 2 resolved rotations (however good) -> false.
    {
      const owner = await makeUser();
      const subject = await makeUser();
      let combId = null;
      for (let ordinal = 1; ordinal <= 3; ordinal += 1) {
        const w1 = await makeUser();
        const w2 = await makeUser();
        const built = await buildRotation({
          owner,
          subject,
          ordinal,
          combId,
          contributors: [
            { id: w1, writes: true },
            { id: w2, writes: true },
          ],
        });
        combId = built.combId;
      }
      const { rows } = await asService(() => client.query('select public.comb_c1_sustained($1) as sustained', [combId]));
      if (rows[0].sustained === true) {
        ok('C1 sustained: three consecutive 100% months -> true');
      } else {
        bad('C1 sustained: three consecutive 100% months -> true', JSON.stringify(rows[0]));
      }
    }
    {
      const owner = await makeUser();
      const subject = await makeUser();
      let combId = null;
      for (let ordinal = 1; ordinal <= 2; ordinal += 1) {
        const w1 = await makeUser();
        const built = await buildRotation({ owner, subject, ordinal, combId, contributors: [{ id: w1, writes: true }] });
        combId = built.combId;
      }
      const { rows } = await asService(() => client.query('select public.comb_c1_sustained($1) as sustained', [combId]));
      if (rows[0].sustained === false) {
        ok('C1 sustained: only two resolved rotations on record -> false, not judged early');
      } else {
        bad('C1 sustained: only two resolved rotations on record -> false, not judged early', JSON.stringify(rows[0]));
      }
    }
    {
      // Three months, the middle one below 60% -> false. Proves the
      // function checks EACH of the last three, not their average.
      const owner = await makeUser();
      const subject = await makeUser();
      let combId = null;
      const shapes = [
        [{ writes: true }, { writes: true }],
        [{ writes: true }, { writes: false }, { writes: false }],
        [{ writes: true }, { writes: true }],
      ];
      for (let i = 0; i < shapes.length; i += 1) {
        const contributors = [];
        for (const s of shapes[i]) contributors.push({ id: await makeUser(), writes: s.writes });
        const built = await buildRotation({ owner, subject, ordinal: i + 1, combId, contributors });
        combId = built.combId;
      }
      const { rows } = await asService(() => client.query('select public.comb_c1_sustained($1) as sustained', [combId]));
      if (rows[0].sustained === false) {
        ok('C1 sustained: one month under 60% in the last three -> false, not averaged away');
      } else {
        bad('C1 sustained: one month under 60% in the last three -> false, not averaged away', JSON.stringify(rows[0]));
      }
    }

    // ---------------------------------------------------------------
    // 8/9. comb_c3_survival_report: a comb old enough (created_at backdated
    // 7 cadence-months) with a rotation at ordinal 6 reads eligible+survived;
    // an equally old comb that never got past ordinal 2 reads eligible,
    // not survived.
    {
      const owner = await makeUser();
      const subject = await makeUser();
      const { rows: combRows } = await asPostgres(() =>
        client.query(
          "insert into public.combs (owner_id, name, created_at) values ($1, 'Old Comb', now() - interval '7 months') returning id",
          [owner]
        )
      );
      const combId = combRows[0].id;
      await buildRotation({ owner, subject, ordinal: 6, combId, contributors: [{ id: await makeUser(), writes: true }] });
      const { rows } = await asService(() => client.query('select * from public.comb_c3_survival_report() where comb_id = $1', [combId]));
      if (rows[0]?.eligible === true && rows[0]?.reached_month_6 === true) {
        ok('C3: a 7-month-old comb that reached ordinal 6 reads eligible + survived');
      } else {
        bad('C3: a 7-month-old comb that reached ordinal 6 reads eligible + survived', JSON.stringify(rows[0]));
      }
    }
    {
      const owner = await makeUser();
      const subject = await makeUser();
      const { rows: combRows } = await asPostgres(() =>
        client.query(
          "insert into public.combs (owner_id, name, created_at) values ($1, 'Died Young', now() - interval '7 months') returning id",
          [owner]
        )
      );
      const combId = combRows[0].id;
      await buildRotation({ owner, subject, ordinal: 1, combId, contributors: [{ id: await makeUser(), writes: false }], resolved: 'voided' });
      const { rows } = await asService(() => client.query('select * from public.comb_c3_survival_report() where comb_id = $1', [combId]));
      if (rows[0]?.eligible === true && rows[0]?.reached_month_6 === false) {
        ok('C3: an equally old comb that died at ordinal 1 reads eligible, not survived');
      } else {
        bad('C3: an equally old comb that died at ordinal 1 reads eligible, not survived', JSON.stringify(rows[0]));
      }
    }
    {
      // A brand-new comb (created_at now()) is not yet eligible for the
      // month-6 question at all, regardless of ordinal.
      const owner = await makeUser();
      const subject = await makeUser();
      const { rotationId, combId } = await buildRotation({
        owner,
        subject,
        contributors: [{ id: await makeUser(), writes: true }],
      });
      void rotationId;
      const { rows } = await asService(() => client.query('select * from public.comb_c3_survival_report() where comb_id = $1', [combId]));
      if (rows[0]?.eligible === false) {
        ok('C3: a brand-new comb is not yet eligible for the month-6 question');
      } else {
        bad('C3: a brand-new comb is not yet eligible for the month-6 question', JSON.stringify(rows[0]));
      }
    }

    // ---------------------------------------------------------------
    // 10. comb_c5_note_frequency: a comb with 3 active members (owner +
    // w1 + w2; a fourth, `departed`, is excluded), 3 notes sent, created
    // 14 days ago -> note_count 3, active_member_count 3, weeks_active ~2.
    {
      const owner = await makeUser();
      const w1 = await makeUser();
      const w2 = await makeUser();
      const departed = await makeUser();
      const { rows: combRows } = await asPostgres(() =>
        client.query(
          "insert into public.combs (owner_id, name, created_at) values ($1, 'Notes Comb', now() - interval '14 days') returning id",
          [owner]
        )
      );
      const combId = combRows[0].id;
      // combs_create_owner_membership_trigger already seated `owner` above.
      for (const m of [w1, w2]) {
        await asPostgres(() =>
          client.query('insert into public.comb_members (comb_id, profile_id) values ($1, $2)', [combId, m])
        );
      }
      await asPostgres(() =>
        client.query(
          'insert into public.comb_members (comb_id, profile_id, removed_at) values ($1, $2, now())',
          [combId, departed]
        )
      );
      const insertNote = async (senderId, recipientId) => {
        const txn = await asPostgres(() =>
          client.query("insert into public.ledger_transactions (kind, idempotency_key) values ('tip', gen_random_uuid()::text) returning id")
        );
        await asPostgres(() =>
          client.query(
            `insert into public.comb_nectar_notes (id, comb_id, transaction_id, sender_id, recipient_id, note_text, amount_drops)
             values (gen_random_uuid(), $1, $2, $3, $4, 'thanks', 10)`,
            [combId, txn.rows[0].id, senderId, recipientId]
          )
        );
      };
      await insertNote(w1, owner);
      await insertNote(w2, owner);
      await insertNote(owner, w1);
      const { rows } = await asService(() =>
        client.query('select * from public.comb_c5_note_frequency() where comb_id = $1', [combId])
      );
      const r = rows[0];
      if (r && r.note_count === 3 && r.active_member_count === 3 && Math.abs(Number(r.weeks_active) - 2) < 0.05) {
        ok('C5: note_count/active_member_count/weeks_active count exactly what each name says');
      } else {
        bad('C5: note_count/active_member_count/weeks_active count exactly what each name says', JSON.stringify(r));
      }
    }
    // A brand-new comb with zero notes still returns a row (raw facts, not
    // a pre-judged rate) rather than being silently excluded from the
    // report the way a WHERE-clause-style filter would. (`active_member_count`
    // can never reach 0 while the comb exists — comb_members_owner_seat_permanent
    // forbids removing the organizer's own seat — so 1 is the true floor,
    // not an artifact of this fixture.)
    {
      const owner = await makeUser();
      const { rows: combRows } = await asPostgres(() =>
        client.query("insert into public.combs (owner_id, name) values ($1, 'Empty Comb') returning id", [owner])
      );
      const combId = combRows[0].id;
      const { rows } = await asService(() =>
        client.query('select * from public.comb_c5_note_frequency() where comb_id = $1', [combId])
      );
      const r = rows[0];
      if (r && r.note_count === 0 && r.active_member_count === 1) {
        ok('C5: a brand-new comb with zero notes still returns a row, not silently dropped');
      } else {
        bad('C5: a brand-new comb with zero notes still returns a row, not silently dropped', JSON.stringify(r));
      }
    }

    // ---------------------------------------------------------------
    // 11. Grant boundary: none of the four functions are callable as
    // authenticated or anon — this is internal reporting, service_role only.
    for (const [fn, args, argTypes] of [
      ['comb_rotation_participation', ['00000000-0000-0000-0000-000000000001'], '(uuid)'],
      ['comb_c1_sustained', ['00000000-0000-0000-0000-000000000001'], '(uuid)'],
      ['comb_c3_survival_report', [], '()'],
      ['comb_c5_note_frequency', [], '()'],
    ]) {
      const placeholders = args.map((_, i) => `$${i + 1}`).join(', ');
      try {
        await asUser('00000000-0000-0000-0000-000000000099', () =>
          client.query(`select * from public.${fn}(${placeholders})`, args)
        );
        bad(`grant boundary: authenticated cannot call ${fn}${argTypes}`, 'call succeeded');
      } catch (e) {
        if (/permission denied/i.test(e.message)) {
          ok(`grant boundary: authenticated cannot call ${fn}${argTypes}`);
        } else {
          bad(`grant boundary: authenticated cannot call ${fn}${argTypes}`, `wrong error: ${firstLine(e)}`);
        }
      }
    }

    // ---------------------------------------------------------------
    // 12. Client-side C4 instrumentation: source-level, not a Postgres
    // fixture — there is no SQL for a client analytics call, and C4 is the
    // one condition with no real data source to query instead (see file
    // header). C5 is NOT checked here — see the fixtures above.
    const src = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
    {
      const s = src('src/services/CombInviteStore.js');
      if (s.includes("import { Analytics } from './Analytics'") && /Analytics\.track\(\s*'comb_member_cap_reached'/.test(s)) {
        ok('C4: CombInviteStore fires comb_member_cap_reached');
      } else {
        bad('C4: CombInviteStore fires comb_member_cap_reached', 'import or track() call missing');
      }
    }
    {
      const s = src('src/services/CombStore.js');
      if (s.includes("import { Analytics } from './Analytics'") && /Analytics\.track\(\s*'comb_second_created'/.test(s)) {
        ok('C4: CombStore fires comb_second_created');
      } else {
        bad('C4: CombStore fires comb_second_created', 'import or track() call missing');
      }
    }
    {
      const s = src('src/services/NectarStore.js');
      if (!/Analytics/.test(s)) {
        ok('C5: NectarStore has no redundant client-side Analytics call — comb_c5_note_frequency reads the ledger instead');
      } else {
        bad(
          'C5: NectarStore has no redundant client-side Analytics call — comb_c5_note_frequency reads the ledger instead',
          'Analytics reference found in NectarStore.js'
        );
      }
    }

    console.log(`\ncheck-eng89-instruments: ${pass} passed, ${failures.length} failed`);
    if (failures.length > 0) {
      console.log('\nFailures:');
      failures.forEach((f) => console.log(`  - ${f}`));
      process.exitCode = 1;
    }
  } finally {
    await client.end();
    await pg.stop();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((e) => {
    console.error('check-eng89-instruments: FAILED —', e.message);
    process.exit(1);
  });
