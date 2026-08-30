// Gate for ENG-93's mint (row 1.7a,
// supabase/migrations/20260830000008_eng93_comb_open_rotation.sql) --
// comb_open_rotation(p_comb_id, p_subject_profile_id, p_closes_at).
//
//   npm run check:comb-open-rotation
//
// Proves the three-legs pin (Lumen's design ruling, thread b57ad406,
// ratifying §1B.29.2 -- see the migration's own header for the full
// citation chain):
//
//   (a) caller must own the comb, OR be service_role -- moved inside the
//       function body, since a SECURITY DEFINER insert bypasses
//       comb_rotations_insert_owner's WITH CHECK entirely.
//   (b) MUST NOT require the subject to be an active comb_members row --
//       §1B.30's ratified acceptance row: mint for a non-member subject,
//       assert success.
//   (c) holds by construction -- the function mints the private_hives row
//       itself, so hive/is_collective/subject_profile_id cannot disagree
//       with the comb_rotations row it also inserts.
//
// Plus Row 2 (§1B.24.1(c)/§1B.30.1/§1B.34.1-2, repointed by ENG-94,
// `...0010`): a subject who is GONE -- tombstoned OR departed the comb
// (comb_members row with removed_at set) -- is refused at mint, by one
// shared predicate (comb_subject_gone, ENG-95), not left to the RLS layer
// or improvised client copy. The refusal message does not distinguish
// which arm fired, matching seal_and_send_rotation's own undifferentiated
// 'subject_gone' void reason -- the predicate answers one question.
//
// Plus ENG-100 (row 1.7b, §1B.36.9/.18/.19, same migration `...0010`): a
// comb-of-one minting with the organizer as subject produces an empty
// writing roster -- month 1 is exempt from §1B.31.3's floor, so this is
// the only place it's observable. Asserted directly (SQLSTATE 23514 +
// `constraint = 'comb_open_rotation_enrollable_floor'`) -- the
// clock-boundary pair (§1B.36.11's rows 2/3) is unrunnable here
// (comb_advance_rotation doesn't exist yet) and moved to row 1.8.
//
// Modeled on check-comb-preview.mjs for the harness shape (embedded
// Postgres, SUPABASE_ENV fixture, asUser/asPostgres/asAnon helpers) and its
// exit-code discipline (process.exit(1) directly, not process.exitCode).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);

if (process.env.SKIP_PG_GATES === '1') {
  console.log('check-comb-open-rotation: SKIPPED — SKIP_PG_GATES=1 set explicitly');
  process.exit(0);
}

let EmbeddedPostgres;
try {
  EmbeddedPostgres = require('embedded-postgres').default;
  require('pg');
} catch (e) {
  console.error(
    `check-comb-open-rotation: FAILED — embedded-postgres/pg not installed (${e.message.split('\n')[0]}).\n` +
      '  Run `npm install` (both are devDependencies), or set SKIP_PG_GATES=1 to skip deliberately\n' +
      '  on a machine that genuinely cannot run a local Postgres.'
  );
  process.exit(1);
}

const APPLY = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();

const OWNER = '11111111-1111-1111-1111-111111111111';
const SUBJECT_MEMBER = '22222222-2222-2222-2222-222222222222';
const SUBJECT_NONMEMBER = '33333333-3333-3333-3333-333333333333';
const SUBJECT_TOMBSTONED = '44444444-4444-4444-4444-444444444444';
const MEMBER_A = '55555555-5555-5555-5555-555555555555';
const MEMBER_B = '66666666-6666-6666-6666-666666666666';
const STRANGER = '77777777-7777-7777-7777-777777777777';

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
  const dataDir = path.join(ROOT, '.comb-open-rotation-pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    // Distinct from every other gate's port (54329-54338).
    port: 54339,
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
        OWNER, JSON.stringify({ display_name: 'Maya' }),
        SUBJECT_MEMBER, JSON.stringify({ display_name: 'Priya' }),
        SUBJECT_NONMEMBER, JSON.stringify({ display_name: 'Sarah' }),
        SUBJECT_TOMBSTONED, JSON.stringify({ display_name: 'Gone' }),
        MEMBER_A, JSON.stringify({ display_name: 'A' }),
        MEMBER_B, JSON.stringify({ display_name: 'B' }),
        STRANGER, JSON.stringify({ display_name: 'Stranger' }),
      ]
    );

    const asPostgres = async (fn) => {
      await client.query("select set_config('role', 'postgres', true)");
      return fn();
    };
    const asServiceRole = async (fn) => {
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

    // Tombstone SUBJECT_TOMBSTONED up front — deleted_at is immutable once
    // set, so this has to happen before any test exercises it.
    await asPostgres(() =>
      client.query('update public.profiles set deleted_at = now() where id = $1', [SUBJECT_TOMBSTONED])
    );

    const { rows: combRows } = await asUser(OWNER, () =>
      client.query("insert into public.combs (owner_id, name) values ($1, 'Maya''s Comb') returning id", [OWNER])
    );
    const comb = combRows[0];

    await asPostgres(() =>
      client.query('insert into public.comb_members (comb_id, profile_id) values ($1, $2), ($1, $3)', [
        comb.id,
        SUBJECT_MEMBER,
        MEMBER_A,
      ])
    );

    // ---------------------------------------------------------------
    // 0. cadence column: added by this migration, defaults to one month,
    // stored once rather than hard-coded in this function and OPS-9's/
    // ENG-60's future advance (Vector's finding, §1B.31 ratified).
    {
      // Cast to text: node-postgres parses `interval` into a components
      // object ({"months":1}), not the text form -- compare the value pg
      // itself would print, not this driver's in-memory shape.
      const { rows } = await asPostgres(() =>
        client.query("select cadence::text as cadence from public.combs where id = $1", [comb.id])
      );
      if (rows[0].cadence === '1 mon') {
        ok('combs.cadence: defaults to one month');
      } else {
        bad('combs.cadence: defaults to one month', `got ${JSON.stringify(rows[0].cadence)}`);
      }
    }

    // ---------------------------------------------------------------
    // Leg (a) + Row 1. Owner mints for a MEMBER subject: succeeds. This is
    // the baseline the rest of the suite differentiates from.
    let rotationId;
    {
      try {
        const { rows } = await asUser(OWNER, () =>
          client.query(
            'select public.comb_open_rotation($1, $2, now() + interval \'30 days\') as id',
            [comb.id, SUBJECT_MEMBER]
          )
        );
        rotationId = rows[0].id;
        ok('leg (a): comb owner mints a rotation for a member subject — succeeds');
      } catch (e) {
        bad('leg (a): comb owner mints a rotation for a member subject — succeeds', e.message);
      }
    }

    // ---------------------------------------------------------------
    // Leg (c), by construction: the minted hive agrees with the rotation
    // row on is_collective/subject, because this function is the only
    // writer of both.
    {
      const { rows } = await asPostgres(() =>
        client.query(
          `select h.is_collective, h.subject_profile_id as hive_subject, r.subject_profile_id as rotation_subject,
                  r.hive_id, r.ordinal
           from public.comb_rotations r
           join public.private_hives h on h.id = r.hive_id
           where r.id = $1`,
          [rotationId]
        )
      );
      const row = rows[0];
      if (row.is_collective === true && row.hive_subject === SUBJECT_MEMBER && row.rotation_subject === SUBJECT_MEMBER) {
        ok('leg (c): minted hive and rotation row agree on is_collective and subject — by construction');
      } else {
        bad('leg (c): minted hive and rotation row agree on is_collective and subject — by construction', JSON.stringify(row));
      }
      if (row.ordinal === 1) {
        ok('ordinal: first rotation for a comb is ordinal 1');
      } else {
        bad('ordinal: first rotation for a comb is ordinal 1', `got ${row.ordinal}`);
      }
    }

    // ---------------------------------------------------------------
    // Roster snapshot: every active comb member except the subject is
    // seated as a contributor of the new hive, in the same transaction.
    {
      const { rows } = await asPostgres(() =>
        client.query(
          `select c.profile_id from public.hive_contributors c
           join public.comb_rotations r on r.hive_id = c.hive_id
           where r.id = $1 order by c.profile_id`,
          [rotationId]
        )
      );
      const seated = rows.map((r) => r.profile_id).sort();
      const expected = [OWNER, MEMBER_A].sort();
      if (JSON.stringify(seated) === JSON.stringify(expected)) {
        ok('roster snapshot: every active comb member except the subject seated as a contributor');
      } else {
        bad('roster snapshot: every active comb member except the subject seated as a contributor', JSON.stringify(seated));
      }
    }

    // ---------------------------------------------------------------
    // comb_rotations_one_open_per_comb still stands guard: a second mint
    // attempt while one rotation is already open raises 23505 — this
    // function does not duplicate that check, the index already owns it.
    {
      try {
        await asUser(OWNER, () =>
          client.query('select public.comb_open_rotation($1, $2, now() + interval \'30 days\')', [
            comb.id,
            MEMBER_A,
          ])
        );
        bad('one-open-per-comb: a second mint while one is open raises 23505', 'second mint succeeded');
      } catch (e) {
        if (e.code === '23505') {
          ok('one-open-per-comb: a second mint while one is open raises 23505');
        } else {
          bad('one-open-per-comb: a second mint while one is open raises 23505', `got ${e.code}: ${e.message}`);
        }
      }
    }

    // Resolve the open rotation out of the way (direct write, standing in
    // for ENG-91's seal) so the remaining tests can each mint their own.
    await asPostgres(() =>
      client.query('update public.comb_rotations set voided_at = now(), voided_reason = $2 where id = $1', [
        rotationId,
        'quiet',
      ])
    );

    // ---------------------------------------------------------------
    // Row 1 (leg (b) absent, deliberately): mint for a subject who is NOT
    // a comb_members row at all — must succeed. §1B.30's ratified
    // acceptance row, and §8's "month 1's subject is organizer-chosen and
    // may be a non-member."
    {
      try {
        const { rows } = await asUser(OWNER, () =>
          client.query(
            'select public.comb_open_rotation($1, $2, now() + interval \'30 days\') as id',
            [comb.id, SUBJECT_NONMEMBER]
          )
        );
        if (rows[0].id) {
          ok('Row 1: mint for a non-comb-member subject succeeds (no membership requirement)');
        } else {
          bad('Row 1: mint for a non-comb-member subject succeeds (no membership requirement)', 'no id returned');
        }
        await asPostgres(() =>
          client.query('update public.comb_rotations set voided_at = now(), voided_reason = $2 where id = $1', [
            rows[0].id,
            'quiet',
          ])
        );
      } catch (e) {
        bad('Row 1: mint for a non-comb-member subject succeeds (no membership requirement)', e.message);
      }
    }

    // ---------------------------------------------------------------
    // Row 2: a tombstoned subject is refused at mint, by name — not a
    // generic constraint violation, not left to RLS.
    {
      try {
        await asUser(OWNER, () =>
          client.query('select public.comb_open_rotation($1, $2, now() + interval \'30 days\')', [
            comb.id,
            SUBJECT_TOMBSTONED,
          ])
        );
        bad('Row 2: mint for a tombstoned subject is refused', 'mint succeeded');
      } catch (e) {
        if (/subject is gone/i.test(e.message)) {
          ok('Row 2: mint for a tombstoned subject is refused, by name');
        } else {
          bad('Row 2: mint for a tombstoned subject is refused, by name', `got: ${e.message}`);
        }
      }
    }

    // ---------------------------------------------------------------
    // Row 2 (departure arm, ENG-94): a subject who is still a comb_members
    // row but has DEPARTED (removed_at set, not tombstoned) is refused the
    // same way — the arm `...0008`'s tombstone-only check was ruled to be
    // missing. SUBJECT_MEMBER (Priya) already minted and voided a rotation
    // earlier in this suite; marking her departed now must not disturb
    // that history, only refuse a NEW mint naming her as subject.
    {
      await asPostgres(() =>
        client.query('update public.comb_members set removed_at = now() where comb_id = $1 and profile_id = $2', [
          comb.id,
          SUBJECT_MEMBER,
        ])
      );
      try {
        await asUser(OWNER, () =>
          client.query('select public.comb_open_rotation($1, $2, now() + interval \'30 days\')', [
            comb.id,
            SUBJECT_MEMBER,
          ])
        );
        bad('Row 2 (departure arm): mint for a departed (non-tombstoned) subject is refused', 'mint succeeded');
      } catch (e) {
        if (/subject is gone/i.test(e.message)) {
          ok('Row 2 (departure arm): mint for a departed (non-tombstoned) subject is refused');
        } else {
          bad('Row 2 (departure arm): mint for a departed (non-tombstoned) subject is refused', `got: ${e.message}`);
        }
      }
    }

    // ---------------------------------------------------------------
    // ENG-100 (row 1.7b, §1B.36.9/.18/.19): a comb-of-one — organizer mints
    // for THEMSELVES as subject, no other comb_members row — produces an
    // empty writing roster (the subject excludes themselves from their own
    // snapshot; combs_create_owner_membership_trigger is the only member
    // this fresh comb has). Month 1 is exempt from §1B.31.3's floor, so
    // this direct-mint assertion is ENG-100's entire acceptance — the
    // clock-boundary pair (rows 2/3) moved to row 1.8, OPS-9's finisher,
    // per §1B.36.19: unrunnable here since comb_advance_rotation doesn't
    // exist yet.
    {
      const { rows: soloComb } = await asUser(OWNER, () =>
        client.query("insert into public.combs (owner_id, name) values ($1, 'Solo Comb') returning id", [OWNER])
      );
      try {
        await asUser(OWNER, () =>
          client.query('select public.comb_open_rotation($1, $2, now() + interval \'30 days\')', [
            soloComb[0].id,
            OWNER,
          ])
        );
        bad('ENG-100: comb-of-one, self-subject mint is refused — empty roster floor', 'mint succeeded');
      } catch (e) {
        if (e.code === '23514' && e.constraint === 'comb_open_rotation_enrollable_floor') {
          ok('ENG-100: comb-of-one, self-subject mint is refused — empty roster floor');
        } else {
          bad(
            'ENG-100: comb-of-one, self-subject mint is refused — empty roster floor',
            `got code=${e.code} constraint=${e.constraint} message=${e.message}`
          );
        }
      }
    }

    // ---------------------------------------------------------------
    // Leg (a): a non-owner authenticated caller is refused, 42501 — not a
    // silent no-op, not a different error class.
    {
      try {
        await asUser(STRANGER, () =>
          client.query('select public.comb_open_rotation($1, $2, now() + interval \'30 days\')', [
            comb.id,
            MEMBER_A,
          ])
        );
        bad('leg (a): a non-owner authenticated caller is refused, 42501', 'mint succeeded');
      } catch (e) {
        if (e.code === '42501') {
          ok('leg (a): a non-owner authenticated caller is refused, 42501');
        } else {
          bad('leg (a): a non-owner authenticated caller is refused, 42501', `got ${e.code}: ${e.message}`);
        }
      }
    }

    // ---------------------------------------------------------------
    // Leg (a), the other arm: service_role (the clock's future caller)
    // mints successfully with no auth.uid() at all — the ruled bypass for
    // OPS-9's advance, not merely "any role that isn't refused."
    {
      try {
        const { rows } = await asServiceRole(() =>
          client.query(
            'select public.comb_open_rotation($1, $2, now() + interval \'30 days\') as id',
            [comb.id, MEMBER_A]
          )
        );
        if (rows[0].id) {
          ok('leg (a): service_role mints with no auth.uid() at all — the clock\'s bypass');
        } else {
          bad('leg (a): service_role mints with no auth.uid() at all — the clock\'s bypass', 'no id returned');
        }
      } catch (e) {
        bad('leg (a): service_role mints with no auth.uid() at all — the clock\'s bypass', e.message);
      }
    }

    // ---------------------------------------------------------------
    // Grant surface: anon can never reach this function — the migration's
    // own named revoke, proven rather than assumed.
    {
      try {
        await asAnon(() =>
          client.query('select public.comb_open_rotation($1, $2, now() + interval \'30 days\')', [
            comb.id,
            MEMBER_A,
          ])
        );
        bad('grants: anon is refused, 42501', 'call succeeded');
      } catch (e) {
        if (e.code === '42501') {
          ok('grants: anon is refused, 42501');
        } else {
          bad('grants: anon is refused, 42501', `got ${e.code}: ${e.message}`);
        }
      }
    }

    console.log(`\ncheck-comb-open-rotation: ${pass} passed, ${failures.length} failed`);
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
  console.error('check-comb-open-rotation: FAILED —', e.message);
  process.exit(1);
});
