// Gate for ENG-59's anon invite-landing preview RPC
// (supabase/migrations/20260830000006_comb_preview_by_invite_code.sql).
//
//   npm run check:comb-preview
//
// Proves the ruled shape (thread b57ad406, 2026-08-30 — see the migration's
// own header for the full citation chain): callable with no session at all,
// possession of the invite code is the only authorization, the response
// carries no more than headline/subject/count, and — Lumen's boundary note
// (16:15:36) — an invalid code returns the exact same empty shape a
// revoked/expired one would (there is no revoke/expire column yet, so this
// gate proves the one exercisable branch: zero rows, no exception, no
// distinguishing detail).
//
// Modeled on check-comb-join.mjs for the harness shape and its exit-code
// discipline (process.exit(1) directly, not process.exitCode — the same
// async-exit-hook / embedded-postgres pitfall applies here).
//
// ENG-94 (Fizz, `...0010`) repointed has_active_month onto Lumen's own
// gloss for it — "an open rotation WITH A LIVE SUBJECT" — via the shared
// comb_subject_gone predicate (ENG-95). Sections 2c/2d below cover the two
// arms: a tombstoned subject and a departed-but-intact-account subject,
// both collapsing to the same subject_name-null/has_active_month-false
// shape as the pre-launch/dormant cases in 2a/2b.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);

if (process.env.SKIP_PG_GATES === '1') {
  console.log('check-comb-preview: SKIPPED — SKIP_PG_GATES=1 set explicitly');
  process.exit(0);
}

let EmbeddedPostgres;
try {
  EmbeddedPostgres = require('embedded-postgres').default;
  require('pg');
} catch (e) {
  console.error(
    `check-comb-preview: FAILED — embedded-postgres/pg not installed (${e.message.split('\n')[0]}).\n` +
      '  Run `npm install` (both are devDependencies), or set SKIP_PG_GATES=1 to skip deliberately\n' +
      '  on a machine that genuinely cannot run a local Postgres.'
  );
  process.exit(1);
}

const APPLY = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();

const OWNER = '11111111-1111-1111-1111-111111111111';
const SUBJECT = '22222222-2222-2222-2222-222222222222';
const MEMBER_A = '33333333-3333-3333-3333-333333333333';
const MEMBER_B = '44444444-4444-4444-4444-444444444444';
const REMOVED = '55555555-5555-5555-5555-555555555555';
const SUBJECT_TOMBSTONED = '66666666-6666-6666-6666-666666666666';
const SUBJECT_DEPARTED = '77777777-7777-7777-7777-777777777777';

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
  const dataDir = path.join(ROOT, '.comb-preview-pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    // Distinct from every other gate's port (54329-54337).
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

    await client.query(
      'insert into auth.users (id, raw_user_meta_data) values ($1, $2), ($3, $4), ($5, $6), ($7, $8), ($9, $10)',
      [
        OWNER, JSON.stringify({ display_name: 'Maya' }),
        SUBJECT, JSON.stringify({ display_name: 'Sarah' }),
        MEMBER_A, JSON.stringify({ display_name: 'A' }),
        MEMBER_B, JSON.stringify({ display_name: 'B' }),
        REMOVED, JSON.stringify({ display_name: 'Gone' }),
      ]
    );
    await client.query(
      'insert into auth.users (id, raw_user_meta_data) values ($1, $2), ($3, $4)',
      [
        SUBJECT_TOMBSTONED, JSON.stringify({ display_name: 'Deleted' }),
        SUBJECT_DEPARTED, JSON.stringify({ display_name: 'Departed' }),
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

    const { rows: combRows } = await asUser(OWNER, () =>
      client.query("insert into public.combs (owner_id, name) values ($1, 'Sarah''s Comb') returning id, invite_code", [
        OWNER,
      ])
    );
    const comb = combRows[0];

    await asPostgres(() =>
      client.query(
        `insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective)
         values ($1, 'Sarah', $2, true) returning id`,
        [OWNER, SUBJECT]
      )
    ).then(({ rows }) =>
      client.query(
        `insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at)
         values ($1, 1, $2, $3, now() + interval '30 days')`,
        [comb.id, rows[0].id, SUBJECT]
      )
    );

    await asPostgres(() =>
      client.query('insert into public.comb_members (comb_id, profile_id) values ($1, $2)', [comb.id, MEMBER_A])
    );

    // ---------------------------------------------------------------
    // 1. Anon, valid code: resolves comb/inviter/subject, no session needed.
    {
      const { rows } = await asAnon(() =>
        client.query('select * from public.comb_preview_by_invite_code($1)', [comb.invite_code])
      );
      if (
        rows.length === 1 &&
        rows[0].comb_name === "Sarah's Comb" &&
        rows[0].inviter_name === 'Maya' &&
        rows[0].subject_name === 'Sarah' &&
        rows[0].has_active_month === true
      ) {
        ok('anon, valid code: resolves comb name, inviter name, subject name, has_active_month=true with no session');
      } else {
        bad('anon, valid code: resolves comb name, inviter name, subject name, has_active_month=true with no session', JSON.stringify(rows));
      }
    }

    // ---------------------------------------------------------------
    // 2. Member count is a plain, unsuppressed count (owner + auto-seated +
    // MEMBER_A = 2 active members; small-N suppression is the landing
    // screen's job, not this function's).
    {
      const { rows } = await asAnon(() =>
        client.query('select member_count from public.comb_preview_by_invite_code($1)', [comb.invite_code])
      );
      if (rows[0].member_count === 2) {
        ok('member count: plain count of active comb_members (owner auto-seat + one member)');
      } else {
        bad('member count: plain count of active comb_members (owner auto-seat + one member)', `got ${rows[0].member_count}`);
      }
    }
    {
      await asPostgres(() =>
        client.query('insert into public.comb_members (comb_id, profile_id) values ($1, $2)', [comb.id, REMOVED])
      );
      await asPostgres(() =>
        client.query('update public.comb_members set removed_at = now() where comb_id = $1 and profile_id = $2', [
          comb.id,
          REMOVED,
        ])
      );
      const { rows } = await asAnon(() =>
        client.query('select member_count from public.comb_preview_by_invite_code($1)', [comb.invite_code])
      );
      if (rows[0].member_count === 2) {
        ok('member count: a removed member is not counted');
      } else {
        bad('member count: a removed member is not counted', `got ${rows[0].member_count}`);
      }
    }

    // ---------------------------------------------------------------
    // 2a. Pre-launch: comb exists (organizer created it) but has zero
    // rotations ever — ENG-93's create+open hasn't run, or somehow failed.
    // Lumen's §1B.31.3: this must render no subject, explicitly, not a
    // stale ordinal fallback (there is nothing to fall back to anyway).
    {
      const { rows: preLaunchRows } = await asUser(OWNER, () =>
        client.query(
          "insert into public.combs (owner_id, name) values ($1, 'Pre-launch Comb') returning id, invite_code",
          [OWNER]
        )
      );
      const preLaunch = preLaunchRows[0];
      const { rows } = await asAnon(() =>
        client.query('select * from public.comb_preview_by_invite_code($1)', [preLaunch.invite_code])
      );
      if (rows.length === 1 && rows[0].subject_name === null && rows[0].has_active_month === false) {
        ok('pre-launch (zero rotations): subject_name null, has_active_month false');
      } else {
        bad('pre-launch (zero rotations): subject_name null, has_active_month false', JSON.stringify(rows));
      }
    }

    // ---------------------------------------------------------------
    // 2b. Dormant: comb has a prior rotation, but it's sealed (delivered)
    // and no rotation is open. Must not surface the sealed rotation's
    // subject as if their month were still active — that subject may have
    // already received their reveal.
    {
      const { rows: dormantCombRows } = await asUser(OWNER, () =>
        client.query(
          "insert into public.combs (owner_id, name) values ($1, 'Dormant Comb') returning id, invite_code",
          [OWNER]
        )
      );
      const dormantComb = dormantCombRows[0];
      await asPostgres(() =>
        client.query(
          `insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective)
           values ($1, 'Sarah', $2, true) returning id`,
          [OWNER, SUBJECT]
        )
      ).then(({ rows }) =>
        client.query(
          `insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at, sealed_at, sent_at)
           values ($1, 1, $2, $3, now() - interval '1 day', now(), now())`,
          [dormantComb.id, rows[0].id, SUBJECT]
        )
      );
      const { rows } = await asAnon(() =>
        client.query('select * from public.comb_preview_by_invite_code($1)', [dormantComb.invite_code])
      );
      if (rows.length === 1 && rows[0].subject_name === null && rows[0].has_active_month === false) {
        ok('dormant (only sealed rotation, none open): subject_name null, has_active_month false');
      } else {
        bad('dormant (only sealed rotation, none open): subject_name null, has_active_month false', JSON.stringify(rows));
      }
    }

    // ---------------------------------------------------------------
    // 2c. Gone subject (tombstoned), ENG-94: an open, unsealed, unvoided
    // rotation whose subject has since deleted their account must not
    // read as an active month — Lumen's gloss is "an open rotation WITH A
    // LIVE SUBJECT." Same no-active-month shape as pre-launch/dormant.
    // The rotation row itself is untouched (still voids at seal, ENG-91).
    {
      await asPostgres(() =>
        client.query('update public.profiles set deleted_at = now() where id = $1', [SUBJECT_TOMBSTONED])
      );
      const { rows: tombstoneCombRows } = await asUser(OWNER, () =>
        client.query(
          "insert into public.combs (owner_id, name) values ($1, 'Tombstone Comb') returning id, invite_code",
          [OWNER]
        )
      );
      const tombstoneComb = tombstoneCombRows[0];
      await asPostgres(() =>
        client.query(
          `insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective)
           values ($1, 'Deleted', $2, true) returning id`,
          [OWNER, SUBJECT_TOMBSTONED]
        )
      ).then(({ rows }) =>
        client.query(
          `insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at)
           values ($1, 1, $2, $3, now() + interval '30 days')`,
          [tombstoneComb.id, rows[0].id, SUBJECT_TOMBSTONED]
        )
      );
      const { rows } = await asAnon(() =>
        client.query('select * from public.comb_preview_by_invite_code($1)', [tombstoneComb.invite_code])
      );
      if (rows.length === 1 && rows[0].subject_name === null && rows[0].has_active_month === false) {
        ok('gone subject (tombstoned), open rotation: subject_name null, has_active_month false');
      } else {
        bad('gone subject (tombstoned), open rotation: subject_name null, has_active_month false', JSON.stringify(rows));
      }
    }

    // ---------------------------------------------------------------
    // 2d. Gone subject (departed the comb, not tombstoned), ENG-94: the
    // departure arm of comb_subject_gone reaches this function through
    // the same repoint — a comb_members row with removed_at set is
    // "gone" even though the account itself is intact.
    {
      const { rows: departedCombRows } = await asUser(OWNER, () =>
        client.query(
          "insert into public.combs (owner_id, name) values ($1, 'Departed Comb') returning id, invite_code",
          [OWNER]
        )
      );
      const departedComb = departedCombRows[0];
      await asPostgres(() =>
        client.query('insert into public.comb_members (comb_id, profile_id) values ($1, $2)', [
          departedComb.id,
          SUBJECT_DEPARTED,
        ])
      );
      await asPostgres(() =>
        client.query('update public.comb_members set removed_at = now() where comb_id = $1 and profile_id = $2', [
          departedComb.id,
          SUBJECT_DEPARTED,
        ])
      );
      await asPostgres(() =>
        client.query(
          `insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective)
           values ($1, 'Departed', $2, true) returning id`,
          [OWNER, SUBJECT_DEPARTED]
        )
      ).then(({ rows }) =>
        client.query(
          `insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at)
           values ($1, 1, $2, $3, now() + interval '30 days')`,
          [departedComb.id, rows[0].id, SUBJECT_DEPARTED]
        )
      );
      const { rows } = await asAnon(() =>
        client.query('select * from public.comb_preview_by_invite_code($1)', [departedComb.invite_code])
      );
      if (rows.length === 1 && rows[0].subject_name === null && rows[0].has_active_month === false) {
        ok('gone subject (departed, not tombstoned), open rotation: subject_name null, has_active_month false');
      } else {
        bad(
          'gone subject (departed, not tombstoned), open rotation: subject_name null, has_active_month false',
          JSON.stringify(rows)
        );
      }
    }

    // ---------------------------------------------------------------
    // 3. Invalid code: empty result, not an exception, not a partial row.
    {
      const { rows } = await asAnon(() =>
        client.query('select * from public.comb_preview_by_invite_code($1)', ['not-a-real-code'])
      );
      if (rows.length === 0) {
        ok('invalid code: zero rows, no exception');
      } else {
        bad('invalid code: zero rows, no exception', JSON.stringify(rows));
      }
    }

    // ---------------------------------------------------------------
    // 4. Identical shape as an authenticated caller with no relationship to
    // the comb at all — the code is the only authorization input, session
    // state changes nothing about what an unknown code returns.
    {
      const { rows } = await asUser(MEMBER_B, () =>
        client.query('select * from public.comb_preview_by_invite_code($1)', ['not-a-real-code'])
      );
      if (rows.length === 0) {
        ok('invalid code: identical zero-row shape for an authenticated stranger');
      } else {
        bad('invalid code: identical zero-row shape for an authenticated stranger', JSON.stringify(rows));
      }
    }

    // ---------------------------------------------------------------
    // 5. Authenticated, valid code: same function, same grant, works
    // signed-in too (§1B.1 names no single-inviter restriction).
    {
      const { rows } = await asUser(MEMBER_B, () =>
        client.query('select * from public.comb_preview_by_invite_code($1)', [comb.invite_code])
      );
      if (rows.length === 1 && rows[0].subject_name === 'Sarah') {
        ok('authenticated, valid code: same resolution as anon — code is the only gate');
      } else {
        bad('authenticated, valid code: same resolution as anon — code is the only gate', JSON.stringify(rows));
      }
    }

    // ---------------------------------------------------------------
    // 6. No entries anywhere in the function body — grep, not a runtime
    // probe (a body that never mentions entries cannot leak write-status).
    {
      const { rows } = await asPostgres(() =>
        client.query(
          "select pg_get_functiondef(oid) as def from pg_proc where proname = 'comb_preview_by_invite_code'"
        )
      );
      if (!/\bentries\b/i.test(rows[0].def)) {
        ok('function body: no reference to entries anywhere (membership only, not write-status)');
      } else {
        bad('function body: no reference to entries anywhere (membership only, not write-status)', 'entries referenced');
      }
    }

    console.log(`\ncheck-comb-preview: ${pass} passed, ${failures.length} failed`);
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
  console.error('check-comb-preview: FAILED —', e.message);
  process.exit(1);
});
