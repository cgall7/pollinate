// Gate for ENG-92's six post-merge fixes
// (supabase/migrations/20260830000007_eng92_comb_rotation_fixes.sql).
//
//   npm run check:eng92-comb-rotation-fixes
//
// Proves the ruled shape (thread b57ad406, 2026-08-30, docs/strategy/
// POLLINATE_COMB_ROTATION.md §1B.23/§1B.24) against a real Postgres:
//
//   §1B.23.1 -- comb_rotations_insert_owner no longer requires the subject
//   to already be a comb_members row (the pay-to-be-celebrated shape §11
//   rejects).
//   §1B.23.2 -- comb_rotation_writer_count() reads hive_contributors for
//   the rotation, authorized by is_comb_member (the subject may call it),
//   and self-heals when a contributor's seat ends.
//   §1B.23.3 -- private_hives.subject_profile_id is pinned once a
//   comb_rotations row references the hive; unaffected for a hive with no
//   such row.
//   §1B.24.1 -- comb_member_count() and comb_co_member_names() both exclude
//   a tombstoned (deleted_at non-null) member.
//   §1B.24.2 -- delete_own_account() ends a caller's non-owner comb_members
//   seats, and skips (never raises on) the organizer's own seat.
//   §1B.32 leg 1 -- comb_preview_by_invite_code()'s member_count leg
//   excludes a tombstoned member, the same predicate as §1B.24.1 applied to
//   the third function in the class (Vector's finding, this thread).
//
// Modeled on check-comb-rotation-seal-send.mjs for the harness shape: real
// migrations off disk in full chronological order, mutations run under the
// actual role each caller presents.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);

if (process.env.SKIP_PG_GATES === '1') {
  console.log('check-eng92-comb-rotation-fixes: SKIPPED — SKIP_PG_GATES=1 set explicitly');
  process.exit(0);
}

let EmbeddedPostgres;
try {
  EmbeddedPostgres = require('embedded-postgres').default;
  require('pg');
} catch (e) {
  console.error(
    `check-eng92-comb-rotation-fixes: FAILED — embedded-postgres/pg not installed (${e.message.split('\n')[0]}).\n` +
      '  Run `npm install` (both are devDependencies), or set SKIP_PG_GATES=1 to skip deliberately\n' +
      '  on a machine that genuinely cannot run a local Postgres.'
  );
  process.exit(1);
}

const APPLY = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();

const OWNER = '11111111-1111-1111-1111-111111111111';
const OTHER_OWNER = '99999999-9999-9999-9999-999999999999';
const SUBJECT = '22222222-2222-2222-2222-222222222222';
const CONTRIBUTOR = '33333333-3333-3333-3333-333333333333';
const CONTRIBUTOR2 = '77777777-7777-7777-7777-777777777777';
const NON_MEMBER = '88888888-8888-8888-8888-888888888888';
// Own profile for test 6 (delete_own_account/comb_members) -- deleted_at is
// immutable, so a deletion test needs a profile no other test tombstones.
const DEPARTING_MEMBER = '44444444-4444-4444-4444-444444444444';
// Own profile for test 7 (§1B.32 leg 1) -- deleted_at is immutable, and
// CONTRIBUTOR/DEPARTING_MEMBER are both already tombstoned by tests 4/6 by
// the time this runs (sage/eng91-seal-send's own lesson: a fixture identity
// reused across tests is a hidden coupling once an earlier test mutates it
// irreversibly). Fresh identity, not a shared one.
const PREVIEW_TOMBSTONE_MEMBER = '55555555-5555-5555-5555-555555555555';

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
  const dataDir = path.join(ROOT, '.eng92-comb-rotation-fixes-pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    // Distinct from every other gate's port (54329-54336) so this can run
    // concurrently with the rest of the suite.
    port: 54337,
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
      'insert into auth.users (id, raw_user_meta_data) values ($1, $2), ($3, $4), ($5, $6), ($7, $8), ($9, $10), ($11, $12), ($13, $14), ($15, $16)',
      [
        OWNER, JSON.stringify({ display_name: 'Owner' }),
        OTHER_OWNER, JSON.stringify({ display_name: 'Other Owner' }),
        SUBJECT, JSON.stringify({ display_name: 'Subject' }),
        CONTRIBUTOR, JSON.stringify({ display_name: 'Contributor' }),
        CONTRIBUTOR2, JSON.stringify({ display_name: 'Contributor Two' }),
        NON_MEMBER, JSON.stringify({ display_name: 'Non Member' }),
        DEPARTING_MEMBER, JSON.stringify({ display_name: 'Departing Member' }),
        PREVIEW_TOMBSTONE_MEMBER, JSON.stringify({ display_name: 'Preview Tombstone Member' }),
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

    async function makeComb(owner, members) {
      const { rows } = await asUser(owner, () =>
        client.query("insert into public.combs (owner_id, name) values ($1, 'Test Comb') returning id", [owner])
      );
      const combId = rows[0].id;
      for (const m of members) {
        await asPostgres(() =>
          client.query('insert into public.comb_members (comb_id, profile_id) values ($1, $2) on conflict do nothing', [
            combId,
            m,
          ])
        );
      }
      return combId;
    }

    async function volumeIdFor(hiveId) {
      const { rows } = await asPostgres(() =>
        client.query('select id from public.hive_volumes where hive_id = $1 and sealed_at is null', [hiveId])
      );
      return rows[0]?.id;
    }

    // ---------------------------------------------------------------
    // 1 (§1B.23.1). A subject who is NOT a comb_members row can still be
    // minted a rotation -- the seat-cap clause is gone.
    {
      const combId = await makeComb(OWNER, []); // subject deliberately not added
      const { rows: hiveRows } = await asUser(OWNER, () =>
        client.query(
          "insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective) values ($1, 'Rotation', $2, true) returning id",
          [OWNER, SUBJECT]
        )
      );
      const hiveId = hiveRows[0].id;
      try {
        await asUser(OWNER, () =>
          client.query(
            `insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at)
             values ($1, 1, $2, $3, now() + interval '1 day')`,
            [combId, hiveId, SUBJECT]
          )
        );
        ok('§1B.23.1: comb_rotations_insert_owner admits a subject who is not a comb member');
      } catch (e) {
        bad('§1B.23.1: comb_rotations_insert_owner admits a subject who is not a comb member', firstLine(e));
      }
    }

    // 1b. Negative: the OTHER checks in the WITH CHECK still hold -- a
    // non-owner cannot insert, and the hive must actually be this owner's
    // is_collective hive with a matching subject.
    {
      const combId = await makeComb(OWNER, []);
      const { rows: hiveRows } = await asUser(OWNER, () =>
        client.query(
          "insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective) values ($1, 'Rotation', $2, true) returning id",
          [OWNER, SUBJECT]
        )
      );
      const hiveId = hiveRows[0].id;
      try {
        await asUser(OTHER_OWNER, () =>
          client.query(
            `insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at)
             values ($1, 1, $2, $3, now() + interval '1 day')`,
            [combId, hiveId, SUBJECT]
          )
        );
        bad('§1B.23.1: comb_rotations_insert_owner still refuses a non-owner insert', 'insert succeeded');
      } catch (e) {
        if (/new row violates row-level security policy/i.test(e.message)) {
          ok('§1B.23.1: comb_rotations_insert_owner still refuses a non-owner insert');
        } else {
          bad('§1B.23.1: comb_rotations_insert_owner still refuses a non-owner insert', `wrong error: ${firstLine(e)}`);
        }
      }
    }

    // ---------------------------------------------------------------
    // 2 (§1B.23.2). comb_rotation_writer_count: subject (a comb member, not
    // a contributor) can call it; counts active hive_contributors; self-
    // heals when a seat ends; non-member gets 0.
    let t2RotationId;
    let t2HiveId;
    let t2CombId;
    {
      t2CombId = await makeComb(OWNER, [SUBJECT]);
      const { rows: hiveRows } = await asUser(OWNER, () =>
        client.query(
          "insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective) values ($1, 'Rotation', $2, true) returning id",
          [OWNER, SUBJECT]
        )
      );
      t2HiveId = hiveRows[0].id;
      for (const c of [CONTRIBUTOR, CONTRIBUTOR2]) {
        await asUser(OWNER, () =>
          client.query('insert into public.hive_contributors (hive_id, profile_id, invited_by) values ($1, $2, $3)', [
            t2HiveId,
            c,
            OWNER,
          ])
        );
      }
      const { rows: rotRows } = await asUser(OWNER, () =>
        client.query(
          `insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at)
           values ($1, 1, $2, $3, now() + interval '1 day') returning id`,
          [t2CombId, t2HiveId, SUBJECT]
        )
      );
      t2RotationId = rotRows[0].id;
    }
    {
      const { rows } = await asUser(SUBJECT, () =>
        client.query('select public.comb_rotation_writer_count($1) as n', [t2RotationId])
      );
      if (rows[0].n === 2) {
        ok('§1B.23.2: subject (comb member, not a contributor) reads writer_count = 2');
      } else {
        bad('§1B.23.2: subject (comb member, not a contributor) reads writer_count = 2', `got ${rows[0].n}`);
      }
    }
    {
      await asUser(OWNER, () =>
        client.query('update public.hive_contributors set removed_at = now() where hive_id = $1 and profile_id = $2', [
          t2HiveId,
          CONTRIBUTOR2,
        ])
      );
      const { rows } = await asUser(SUBJECT, () =>
        client.query('select public.comb_rotation_writer_count($1) as n', [t2RotationId])
      );
      if (rows[0].n === 1) {
        ok('§1B.23.2: writer_count self-heals to 1 after a contributor seat ends');
      } else {
        bad('§1B.23.2: writer_count self-heals to 1 after a contributor seat ends', `got ${rows[0].n}`);
      }
    }
    {
      const { rows } = await asUser(NON_MEMBER, () =>
        client.query('select public.comb_rotation_writer_count($1) as n', [t2RotationId])
      );
      if (rows[0].n === 0) {
        ok('§1B.23.2: a non-comb-member reads writer_count = 0, not the true count');
      } else {
        bad('§1B.23.2: a non-comb-member reads writer_count = 0, not the true count', `got ${rows[0].n}`);
      }
    }

    // ---------------------------------------------------------------
    // 3 (§1B.23.3). subject_profile_id is pinned once a comb_rotations row
    // references the hive; unaffected for one that has no such row. Target
    // NON_MEMBER, not CONTRIBUTOR/CONTRIBUTOR2 -- both are already active
    // hive_contributors on t2HiveId (test 2's setup), so retargeting the
    // subject to either one trips the pre-existing disjointness trigger
    // (private_hives_subject_not_active_contributor, ENG-58) before this
    // pin trigger ever runs, masking the row it's meant to isolate.
    {
      try {
        await asUser(OWNER, () =>
          client.query('update public.private_hives set subject_profile_id = $1 where id = $2', [
            NON_MEMBER,
            t2HiveId,
          ])
        );
        bad('§1B.23.3: subject_profile_id is pinned once comb_rotations references the hive', 'update succeeded');
      } catch (e) {
        if (/subject_profile_id is pinned/.test(e.message)) {
          ok('§1B.23.3: subject_profile_id is pinned once comb_rotations references the hive');
        } else {
          bad(
            '§1B.23.3: subject_profile_id is pinned once comb_rotations references the hive',
            `wrong error: ${firstLine(e)}`
          );
        }
      }
    }
    {
      // A plain (non-rotation) hive: no comb_rotations row references it, so
      // the pin does not apply -- the existing 1:1 subject-set-later flow is
      // unaffected.
      const { rows: plainHive } = await asUser(OWNER, () =>
        client.query(
          "insert into public.private_hives (owner_id, subject_name, is_collective) values ($1, 'Plain', false) returning id",
          [OWNER]
        )
      );
      try {
        await asUser(OWNER, () =>
          client.query('update public.private_hives set subject_profile_id = $1 where id = $2', [
            SUBJECT,
            plainHive[0].id,
          ])
        );
        ok('§1B.23.3: a hive with no comb_rotations row is unaffected by the pin');
      } catch (e) {
        bad('§1B.23.3: a hive with no comb_rotations row is unaffected by the pin', firstLine(e));
      }
    }

    // ---------------------------------------------------------------
    // 4 (§1B.24.1 a/b). comb_member_count / comb_co_member_names exclude a
    // tombstoned member.
    {
      const combId = await makeComb(OWNER, [SUBJECT, CONTRIBUTOR]);
      await asPostgres(() =>
        client.query("update public.profiles set display_name = '', deleted_at = now() where id = $1", [CONTRIBUTOR])
      );
      const { rows: countRows } = await asUser(SUBJECT, () =>
        client.query('select public.comb_member_count($1) as n', [combId])
      );
      // Owner + Subject = 2, CONTRIBUTOR excluded (tombstoned).
      if (countRows[0].n === 2) {
        ok('§1B.24.1(a): comb_member_count excludes a tombstoned member');
      } else {
        bad('§1B.24.1(a): comb_member_count excludes a tombstoned member', `got ${countRows[0].n}`);
      }
      const { rows: nameRows } = await asUser(SUBJECT, () =>
        client.query('select profile_id from public.comb_co_member_names($1)', [combId])
      );
      const ids = nameRows.map((r) => r.profile_id);
      if (ids.includes(OWNER) && ids.includes(SUBJECT) && !ids.includes(CONTRIBUTOR)) {
        ok('§1B.24.1(b): comb_co_member_names excludes a tombstoned member entirely (no blank row)');
      } else {
        bad('§1B.24.1(b): comb_co_member_names excludes a tombstoned member entirely (no blank row)', JSON.stringify(ids));
      }
    }

    // ---------------------------------------------------------------
    // 5 (§1B.24.2). delete_own_account ends a non-owner's comb_members seat;
    // skips (never raises on) the organizer's own seat.
    {
      const combId = await makeComb(OWNER, [DEPARTING_MEMBER]);
      await asUser(DEPARTING_MEMBER, () => client.query('select public.delete_own_account()'));
      const { rows } = await asPostgres(() =>
        client.query('select removed_at from public.comb_members where comb_id = $1 and profile_id = $2', [
          combId,
          DEPARTING_MEMBER,
        ])
      );
      if (rows[0]?.removed_at) {
        ok("§1B.24.2: delete_own_account ends the caller's own (non-owner) comb_members seat");
      } else {
        bad("§1B.24.2: delete_own_account ends the caller's own (non-owner) comb_members seat", JSON.stringify(rows));
      }
    }
    {
      const combId = await makeComb(OWNER, []);
      try {
        await asUser(OWNER, () => client.query('select public.delete_own_account()'));
        ok('§1B.24.2: delete_own_account does not raise for a comb organizer');
      } catch (e) {
        bad('§1B.24.2: delete_own_account does not raise for a comb organizer', firstLine(e));
      }
      const { rows } = await asPostgres(() =>
        client.query('select removed_at from public.comb_members where comb_id = $1 and profile_id = $2', [
          combId,
          OWNER,
        ])
      );
      if (rows[0] && rows[0].removed_at === null) {
        ok("§1B.24.2: the organizer's own comb_members seat is skipped (removed_at stays null)");
      } else {
        bad("§1B.24.2: the organizer's own comb_members seat is skipped (removed_at stays null)", JSON.stringify(rows));
      }
      const { rows: authRows } = await asPostgres(() =>
        client.query('select count(*)::int as n from auth.users where id = $1', [OWNER])
      );
      if (authRows[0].n === 0) {
        ok("§1B.24.2: the organizer's account is actually deleted (auth.users row gone)");
      } else {
        bad("§1B.24.2: the organizer's account is actually deleted (auth.users row gone)", `got ${authRows[0].n}`);
      }
    }

    // ---------------------------------------------------------------
    // 7 (§1B.32 leg 1). comb_preview_by_invite_code's member_count leg
    // excludes a tombstoned member -- same predicate as test 4, third
    // function in the class. Not testing subject_name/inviter_name here:
    // both are ENG-94's scope (return-contract change, not a predicate),
    // per Vector/Lumen's in-thread routing.
    //
    // Owned by OTHER_OWNER, not OWNER -- test 5's second block runs
    // delete_own_account() AS OWNER, which tombstones OWNER's own profile.
    // Using OWNER here would silently exclude the owner from member_count
    // too (2 members counted instead of 3 before the tombstone, not 3), the
    // same fixture-identity-reuse class this file's own header warns about
    // one test over.
    {
      const combId = await makeComb(OTHER_OWNER, [SUBJECT, PREVIEW_TOMBSTONE_MEMBER]);
      const { rows: comb } = await asPostgres(() =>
        client.query('select invite_code from public.combs where id = $1', [combId])
      );
      const inviteCode = comb[0].invite_code;
      await asPostgres(() =>
        client.query("update public.profiles set display_name = '', deleted_at = now() where id = $1", [
          PREVIEW_TOMBSTONE_MEMBER,
        ])
      );
      const { rows } = await asUser(NON_MEMBER, () =>
        client.query('select member_count from public.comb_preview_by_invite_code($1) as p', [inviteCode])
      );
      // Owner + Subject = 2, PREVIEW_TOMBSTONE_MEMBER excluded (tombstoned).
      if (rows[0]?.member_count === 2) {
        ok('§1B.32 leg 1: comb_preview_by_invite_code member_count excludes a tombstoned member');
      } else {
        bad(
          '§1B.32 leg 1: comb_preview_by_invite_code member_count excludes a tombstoned member',
          JSON.stringify(rows)
        );
      }
    }

    console.log(`\ncheck-eng92-comb-rotation-fixes: ${pass} passed, ${failures.length} failed`);
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

// embedded-postgres pulls in async-exit-hook, which hooks Node's 'beforeExit'
// and hard-exits 0 there -- the only thing that preempts it is an explicit
// process.exit(), so a bare `process.exitCode = 1` set above is silently
// discarded once the event loop drains (sage/suite-exitcode-fix, thread
// b57ad406). Exiting explicitly here runs after main()'s own finally block
// (client/pg cleanup) has already completed.
main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((e) => {
    console.error('check-eng92-comb-rotation-fixes: FAILED —', e.message);
    process.exit(1);
  });
