// Gate for ENG-101's rotation-linked refusals
// (supabase/migrations/20260904000002_eng101_rotation_linked_refusals.sql).
//
//   npm run check:eng101-wedge-arc
//
// Scope is docs/strategy/POLLINATE_COMB_ROTATION.md §1B.38.31-.39 (Vector,
// ratified by Sage and Lumen, 2026-08-31; minted as build row 1.19,
// 2026-09-04) -- the migration's own header cites the chain in full.
//
// Proves, against a real Postgres:
//
//   1. `seal_volume` (reached through `seal_hive`'s unguarded `perform`)
//      refuses a rotation-linked hive -- the wedge -- while an ordinary
//      multi-writer hive (is_collective, no comb_rotations row) still
//      seals exactly as before.
//   2. `send_hive` refuses a rotation-linked hive whose rotation voided
//      without sending (the state ENG-95's void path leaves) -- the
//      empty-keepsake-by-hand bug -- while an ordinary sealed 1:1 hive
//      still sends to a connected friend exactly as before.
//   3. `hive_contributors_insert_owner`'s WITH CHECK refuses an invite
//      onto a rotation-linked hive's roster, while an ordinary collective
//      hive still admits one.
//   4. Both new raises are reachable and distinguishable from every other
//      raise on their own RPC entry point (`rpc('seal_hive')` and
//      `rpc('send_hive')`), matching the substring the shipped client
//      screens regex on.
//
// Modeled on check-comb-rotation-seal-send.mjs for the harness shape and
// its `mintRotation` fixture (real migrations off disk, mutations run
// under the actual invoking role).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);

if (process.env.SKIP_PG_GATES === '1') {
  console.log('check-eng101-wedge-arc: SKIPPED — SKIP_PG_GATES=1 set explicitly');
  process.exit(0);
}

let EmbeddedPostgres;
try {
  EmbeddedPostgres = require('embedded-postgres').default;
  require('pg');
} catch (e) {
  console.error(
    `check-eng101-wedge-arc: FAILED — embedded-postgres/pg not installed (${e.message.split('\n')[0]}).\n` +
      '  Run `npm install` (both are devDependencies), or set SKIP_PG_GATES=1 to skip deliberately\n' +
      '  on a machine that genuinely cannot run a local Postgres.'
  );
  process.exit(1);
}

const APPLY = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();

const OWNER = '11111111-1111-1111-1111-111111111111';
const SUBJECT = '22222222-2222-2222-2222-222222222222';
const CONTRIBUTOR = '33333333-3333-3333-3333-333333333333';
// A second, ordinary (non-comb) subject -- the regression control for
// seal/send/invite, isolated from SUBJECT so the rotation fixture's void
// (test 2) can't be confused with this hive's own state.
const PLAIN_SUBJECT = '44444444-4444-4444-4444-444444444444';
const NEW_WRITER = '55555555-5555-5555-5555-555555555555';

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
  const dataDir = path.join(ROOT, '.eng101-wedge-arc-pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    port: 54343,
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
        OWNER, JSON.stringify({ display_name: 'Owner' }),
        SUBJECT, JSON.stringify({ display_name: 'Subject' }),
        CONTRIBUTOR, JSON.stringify({ display_name: 'Contributor' }),
        PLAIN_SUBJECT, JSON.stringify({ display_name: 'Plain Subject' }),
        NEW_WRITER, JSON.stringify({ display_name: 'New Writer' }),
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

    // --- Fixture 1a: an OPEN rotation-linked hive (mid-month, never
    // sealed) — the wedge scenario itself, and the invite-belt target.
    const { rows: combRows } = await asUser(OWNER, () =>
      client.query("insert into public.combs (owner_id, name) values ($1, 'Test Comb') returning id", [OWNER])
    );
    const combId = combRows[0].id;
    await asPostgres(() =>
      client.query(
        'insert into public.comb_members (comb_id, profile_id) values ($1, $2), ($1, $3)',
        [combId, SUBJECT, CONTRIBUTOR]
      )
    );
    const { rows: rotHiveRows } = await asUser(OWNER, () =>
      client.query(
        "insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective) values ($1, 'Rotation', $2, true) returning id",
        [OWNER, SUBJECT]
      )
    );
    const rotationHiveId = rotHiveRows[0].id;
    await asUser(OWNER, () =>
      client.query(
        'insert into public.hive_contributors (hive_id, profile_id, invited_by) values ($1, $2, $3)',
        [rotationHiveId, CONTRIBUTOR, OWNER]
      )
    );
    await asUser(OWNER, () =>
      client.query(
        `insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at)
         values ($1, 1, $2, $3, now() + interval '20 days')`,
        [combId, rotationHiveId, SUBJECT]
      )
    );

    // --- Fixture 1b: a SECOND comb/rotation, closed and voided ('quiet' —
    // zero entries, roster intact) so its `sealed_at` is set and `sent_at`
    // stays null — the exact state ENG-95's void path leaves and the one
    // send_hive's ordinary guards cannot see. Separate comb from 1a so
    // voiding it can't also close the still-open rotation above.
    const { rows: combRows2 } = await asUser(OWNER, () =>
      client.query("insert into public.combs (owner_id, name) values ($1, 'Test Comb Two') returning id", [OWNER])
    );
    const combId2 = combRows2[0].id;
    await asPostgres(() =>
      client.query('insert into public.comb_members (comb_id, profile_id) values ($1, $2)', [combId2, SUBJECT])
    );
    const { rows: voidHiveRows } = await asUser(OWNER, () =>
      client.query(
        "insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective) values ($1, 'Voided Rotation', $2, true) returning id",
        [OWNER, SUBJECT]
      )
    );
    const voidedHiveId = voidHiveRows[0].id;
    const { rows: voidRotationRows } = await asUser(OWNER, () =>
      client.query(
        `insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at)
         values ($1, 1, $2, $3, now() - interval '1 hour') returning id`,
        [combId2, voidedHiveId, SUBJECT]
      )
    );
    const voidedRotationId = voidRotationRows[0].id;
    // Zero entries -> void ('quiet', roster intact) -> sealed_at set,
    // sent_at left null on private_hives. Connect owner/subject as friends
    // too, so send_hive's connection gate — the one guard a rotation hive
    // could otherwise satisfy — is not what stops the tap.
    await asService(() => client.query('select public.seal_and_send_rotation($1)', [voidedRotationId]));
    await asPostgres(() =>
      client.query(
        "insert into public.honeycomb_connections (requester_id, addressee_id, status) values ($1, $2, 'accepted')",
        [OWNER, SUBJECT]
      )
    );

    // --- Fixture 2: an ordinary (non-comb) collective hive with entries,
    // never touched by comb_rotations — the regression control for both
    // seal_volume and the invite belt.
    const { rows: plainHiveRows } = await asUser(OWNER, () =>
      client.query(
        "insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective) values ($1, 'Plain', $2, true) returning id",
        [OWNER, PLAIN_SUBJECT]
      )
    );
    const plainHiveId = plainHiveRows[0].id;
    const { rows: plainVolRows } = await asPostgres(() =>
      client.query('select id from public.hive_volumes where hive_id = $1 and sealed_at is null', [plainHiveId])
    );
    const plainVolumeId = plainVolRows[0].id;
    await asUser(OWNER, () =>
      client.query(
        "insert into public.entries (user_id, hive_id, volume_id, content, entry_date) values ($1, $2, $3, 'For Plain Subject', current_date)",
        [OWNER, plainHiveId, plainVolumeId]
      )
    );

    // --- Fixture 3: a second ordinary hive, already sealed, subject
    // connected — the regression control for send_hive's happy path.
    const { rows: sentHiveRows } = await asUser(OWNER, () =>
      client.query(
        "insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective) values ($1, 'Sendable', $2, false) returning id",
        [OWNER, PLAIN_SUBJECT]
      )
    );
    const sentHiveId = sentHiveRows[0].id;
    const { rows: sentVolRows } = await asPostgres(() =>
      client.query('select id from public.hive_volumes where hive_id = $1 and sealed_at is null', [sentHiveId])
    );
    await asUser(OWNER, () =>
      client.query(
        "insert into public.entries (user_id, hive_id, volume_id, content, entry_date) values ($1, $2, $3, 'For Plain Subject Too', current_date)",
        [OWNER, sentHiveId, sentVolRows[0].id]
      )
    );
    await asUser(OWNER, () => client.query('select public.seal_hive($1)', [sentHiveId]));

    // ---------------------------------------------------------------
    // 1. seal_volume/seal_hive refuse the rotation-linked hive.
    try {
      await asUser(OWNER, () => client.query('select public.seal_hive($1)', [rotationHiveId]));
      bad('seal_hive refuses a rotation-linked hive', 'no exception raised');
    } catch (e) {
      if (/comb rotation/.test(e.message)) {
        ok('seal_hive refuses a rotation-linked hive, reason names the comb rotation');
      } else {
        bad('seal_hive refuses a rotation-linked hive', `wrong reason: ${e.message}`);
      }
    }

    // 1b. Regression: an ordinary collective hive still seals.
    try {
      await asUser(OWNER, () => client.query('select public.seal_hive($1)', [plainHiveId]));
      const { rows } = await client.query('select sealed_at from public.private_hives where id = $1', [plainHiveId]);
      if (rows[0].sealed_at) {
        ok('seal_hive still seals an ordinary (non-comb) collective hive');
      } else {
        bad('seal_hive still seals an ordinary (non-comb) collective hive', 'sealed_at stayed null');
      }
    } catch (e) {
      bad('seal_hive still seals an ordinary (non-comb) collective hive', e.message);
    }

    // ---------------------------------------------------------------
    // 2. send_hive refuses the voided-quiet rotation hive (the
    // empty-keepsake-by-hand bug ENG-95's void path leaves reachable).
    try {
      await asUser(OWNER, () => client.query('select public.send_hive($1)', [voidedHiveId]));
      bad('send_hive refuses a voided rotation-linked hive', 'no exception raised');
    } catch (e) {
      if (/comb rotation/.test(e.message)) {
        ok('send_hive refuses a voided rotation-linked hive, reason names the comb rotation');
      } else {
        bad('send_hive refuses a voided rotation-linked hive', `wrong reason: ${e.message}`);
      }
    }

    // 2b. Regression: an ordinary sealed 1:1 hive still sends to a
    // connected friend.
    await asPostgres(() =>
      client.query(
        "insert into public.honeycomb_connections (requester_id, addressee_id, status) values ($1, $2, 'accepted')",
        [OWNER, PLAIN_SUBJECT]
      )
    );
    try {
      await asUser(OWNER, () => client.query('select public.send_hive($1)', [sentHiveId]));
      const { rows } = await client.query('select sent_at from public.private_hives where id = $1', [sentHiveId]);
      if (rows[0].sent_at) {
        ok('send_hive still sends an ordinary sealed hive to a connected friend');
      } else {
        bad('send_hive still sends an ordinary sealed hive to a connected friend', 'sent_at stayed null');
      }
    } catch (e) {
      bad('send_hive still sends an ordinary sealed hive to a connected friend', e.message);
    }

    // ---------------------------------------------------------------
    // 3. hive_contributors_insert_owner's WITH CHECK refuses an invite
    // onto the rotation-linked hive's roster.
    try {
      await asUser(OWNER, () =>
        client.query(
          'insert into public.hive_contributors (hive_id, profile_id, invited_by) values ($1, $2, $3)',
          [rotationHiveId, NEW_WRITER, OWNER]
        )
      );
      bad('hive_contributors insert refuses a rotation-linked hive', 'insert succeeded');
    } catch (e) {
      if (/row-level security|new row violates row-level security policy/i.test(e.message)) {
        ok('hive_contributors insert refuses a rotation-linked hive (RLS)');
      } else {
        bad('hive_contributors insert refuses a rotation-linked hive', `unexpected error: ${e.message}`);
      }
    }

    // 3b. Regression: an ordinary collective hive still admits an invite.
    try {
      await asUser(OWNER, () =>
        client.query(
          'insert into public.hive_contributors (hive_id, profile_id, invited_by) values ($1, $2, $3)',
          [plainHiveId, NEW_WRITER, OWNER]
        )
      );
      ok('hive_contributors insert still admits an invite on an ordinary collective hive');
    } catch (e) {
      bad('hive_contributors insert still admits an invite on an ordinary collective hive', e.message);
    }

    // ---------------------------------------------------------------
    // 4. Both new raises are distinguishable from every other raise
    // reachable through their own RPC entry point.
    {
      const { rows } = await client.query(`select pg_get_functiondef(oid) as def from pg_proc
         where proname in ('seal_hive', 'seal_volume') and pronamespace = 'public'::regnamespace`);
      const combined = rows.map((r) => r.def).join('\n');
      const raises = [...combined.matchAll(/raise exception '([^']+)'/g)].map((m) => m[1]);
      const unique = new Set(raises);
      if (unique.size === raises.length) {
        ok(`seal_hive/seal_volume: all ${raises.length} raised reasons are distinct`);
      } else {
        bad(`seal_hive/seal_volume: all raised reasons are distinct`, `duplicates in [${raises.join(' | ')}]`);
      }
    }
    {
      const { rows } = await client.query(`select pg_get_functiondef(oid) as def from pg_proc
         where proname = 'send_hive' and pronamespace = 'public'::regnamespace`);
      const raises = [...rows[0].def.matchAll(/raise exception '([^']+)'/g)].map((m) => m[1]);
      const unique = new Set(raises);
      if (unique.size === raises.length) {
        ok(`send_hive: all ${raises.length} raised reasons are distinct`);
      } else {
        bad(`send_hive: all raised reasons are distinct`, `duplicates in [${raises.join(' | ')}]`);
      }
    }

    console.log(`\ncheck-eng101-wedge-arc: ${pass} passed, ${failures.length} failed`);
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

main().catch((e) => {
  console.error('check-eng101-wedge-arc: FAILED —', e.message);
  process.exit(1);
});
