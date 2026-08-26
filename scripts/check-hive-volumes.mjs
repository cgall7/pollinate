// Gate for ENG-46's two migrations
// (supabase/migrations/20260826000001_hive_volumes.sql,
// supabase/migrations/20260826000002_hive_volumes_repoint.sql).
//
//   npm run check:hive-volumes
//
// A hive is a relationship (permanent); a volume is a chapter (sealed
// independently) -- §17.1/§17.1a of docs/strategy/POLLINATE_V2_SPEC.md.
// This gate proves the three ratified acceptance criteria hold against a
// real Postgres, not just that the SQL applies cleanly:
//
//   R1 -- the client does not change. A hive-scoped entry insert with no
//   volume_id gets one stamped by the BEFORE INSERT trigger; a personal
//   journal entry (hive_id null) does not.
//   R2 -- exactly one open volume per hive, DB-enforced (a second open
//   volume for the same hive is a unique_violation, not silent corruption).
//   R3 -- the re-point actually re-points: without it, sealing a hive's
//   only volume would permanently lock the hive against ever accepting an
//   entry again (private_hives.sealed_at is one-directional and never
//   clears). This gate proves the opposite -- seal_volume() opens Volume 2,
//   and a new entry into the now-open hive lands there and succeeds.
//
// Also covers the compatibility seam this migration deliberately keeps:
// seal_hive() (the RPC the shipped client still calls) delegates to
// seal_volume() and still mirrors private_hives.sealed_at, with the same
// "already sealed" exception message SealHive.js/SendHive.js string-match
// on -- a regression here breaks those screens' error copy, not just data.
//
// Modeled on check-private-hives-seal.mjs for the harness shape: real
// migrations off disk, mutations run as `authenticated` (never the table
// owner), and the trigger's refusal is checked by catching the raised
// exception, not by a query returning zero rows.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);

if (process.env.SKIP_PG_GATES === '1') {
  console.log('check-hive-volumes: SKIPPED — SKIP_PG_GATES=1 set explicitly');
  process.exit(0);
}

let EmbeddedPostgres;
try {
  EmbeddedPostgres = require('embedded-postgres').default;
  require('pg');
} catch (e) {
  console.error(
    `check-hive-volumes: FAILED — embedded-postgres/pg not installed (${e.message.split('\n')[0]}).\n` +
      '  Run `npm install` (both are devDependencies), or set SKIP_PG_GATES=1 to skip deliberately\n' +
      '  on a machine that genuinely cannot run a local Postgres.'
  );
  process.exit(1);
}

// The full chain, in order, listed explicitly rather than globbed -- same
// discipline as check-private-hives-seal.mjs, so a future migration can't
// silently change what this gate replays.
const APPLY = [
  '20260808000001_honeycombs_core_schema.sql',
  '20260809000001_avatar_storage.sql',
  '20260809000002_find_profile_by_email.sql',
  '20260809000003_fix_likes_comments_visibility.sql',
  '20260809000004_fix_shares_insert_recursion.sql',
  '20260809000005_profiles_select_pending_counterparties.sql',
  '20260810000001_content_length_caps.sql',
  '20260811000001_correct_unused_column_comments.sql',
  '20260813000001_notes_schema.sql',
  '20260813000002_seeds_schema.sql',
  '20260813000003_hive_state_facts.sql',
  '20260813000004_entries_hive_visibility.sql',
  '20260813000005_revoke_definer_execute_from_anon.sql',
  '20260813000006_entries_theme_column.sql',
  '20260813000007_entries_one_per_day_dedupe.sql',
  '20260815000001_private_hives.sql',
  '20260815000002_private_hives_entries_ownership_guard.sql',
  '20260815000003_private_hives_sealed_at.sql',
  '20260815000004_private_hives_sealed_at_guard.sql',
  '20260815000005_private_hives_sealed_entries_readonly.sql',
  '20260815000006_private_hives_sealed_entries_immutable.sql',
  '20260817000001_harden_definer_search_path.sql',
  '20260819000001_private_hives_send.sql',
  '20260819000002_hive_send_events.sql',
  '20260819000003_seal_hive.sql',
  '20260826000001_hive_volumes.sql',
  '20260826000002_hive_volumes_repoint.sql',
];

const OWNER = '11111111-1111-1111-1111-111111111111';
const SUBJECT = '33333333-3333-3333-3333-333333333333';

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
const firstLine = (e) => e.message.split('\n')[0].slice(0, 96);

// Same shape as the other PG gates, plus the `storage` shim
// check-share-visibility.mjs/check-private-hives-seal.mjs use.
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
  const dataDir = path.join(ROOT, '.hive-volumes-pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    // seeds-rls 54329, hive-state 54330, share-visibility 54331,
    // private-hives-seal 54332; distinct so gates can run concurrently.
    port: 54333,
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
      await client.query(sql);
    }

    // 20260808000001's on_auth_user_created trigger auto-creates the
    // matching profiles row from raw_user_meta_data.
    await client.query(
      'insert into auth.users (id, raw_user_meta_data) values ($1, $2), ($3, $4)',
      [OWNER, JSON.stringify({ display_name: 'Owner' }), SUBJECT, JSON.stringify({ display_name: 'Subject' })]
    );

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
    const asPostgres = async (fn) => {
      await client.query("select set_config('role', 'postgres', true)");
      return fn();
    };

    // 1. Creating a hive creates Volume 1, open — the AFTER INSERT trigger.
    const { rows: hiveRows } = await asUser(OWNER, () =>
      client.query("insert into public.private_hives (owner_id, subject_name) values ($1, 'Kid') returning id", [OWNER])
    );
    const hiveId = hiveRows[0].id;

    const { rows: v1Rows } = await client.query(
      'select id, ordinal, sealed_at from public.hive_volumes where hive_id = $1',
      [hiveId]
    );
    if (v1Rows.length === 1 && v1Rows[0].ordinal === 1 && v1Rows[0].sealed_at === null) {
      ok('creating a hive creates Volume 1, open');
    } else {
      bad('creating a hive creates Volume 1, open', `hive_volumes rows for this hive: ${JSON.stringify(v1Rows)}`);
    }
    const volume1Id = v1Rows[0]?.id;

    // 2. R1 — a hive-scoped entry insert with no volume_id gets one stamped.
    let entry1Id;
    try {
      const { rows } = await asUser(OWNER, () =>
        client.query(
          "insert into public.entries (user_id, content, entry_date, hive_id) values ($1, 'first entry', current_date, $2) returning id, volume_id",
          [OWNER, hiveId]
        )
      );
      entry1Id = rows[0].id;
      if (rows[0].volume_id === volume1Id) {
        ok('R1: hive-scoped insert with no volume_id resolves to the open volume');
      } else {
        bad(
          'R1: hive-scoped insert with no volume_id resolves to the open volume',
          `got volume_id ${rows[0].volume_id}, expected ${volume1Id}`
        );
      }
    } catch (e) {
      bad('R1: hive-scoped insert with no volume_id resolves to the open volume', firstLine(e));
    }

    // 3. R1 control — a personal-journal entry (hive_id null) is untouched.
    try {
      const { rows } = await asUser(OWNER, () =>
        client.query(
          "insert into public.entries (user_id, content, entry_date) values ($1, 'journal entry', current_date - 1) returning volume_id",
          [OWNER]
        )
      );
      if (rows[0].volume_id === null) {
        ok('R1 control: personal-journal entry (hive_id null) gets no volume_id');
      } else {
        bad('R1 control: personal-journal entry (hive_id null) gets no volume_id', `got volume_id ${rows[0].volume_id}`);
      }
    } catch (e) {
      bad('R1 control: personal-journal entry (hive_id null) gets no volume_id', firstLine(e));
    }

    // 4. R2 — a second open volume for the same hive is a unique_violation,
    // not silent corruption. Bypasses RLS (postgres) to isolate the index
    // from the insert policy, which doesn't exist on hive_volumes at all.
    try {
      await asPostgres(() =>
        client.query('insert into public.hive_volumes (hive_id, ordinal) values ($1, 2)', [hiveId])
      );
      bad('R2: a second open volume for the same hive is rejected', 'insert succeeded; two open volumes now exist');
    } catch (e) {
      if (e.code === '23505') {
        ok('R2: a second open volume for the same hive is rejected');
      } else {
        bad('R2: a second open volume for the same hive is rejected', `wrong error: ${firstLine(e)}`);
      }
    }

    // 5. R3 — before the re-point, sealing a hive's only volume would have
    // permanently locked it (private_hives.sealed_at never clears). Prove
    // the opposite: seal, then a new entry still succeeds because Volume 2
    // is open. This is the core regression seal_hive's mirror-only fix
    // would have missed.
    try {
      await asUser(OWNER, () => client.query('select public.seal_hive($1)', [hiveId]));
      ok('seal_hive() succeeds on an unsealed hive');
    } catch (e) {
      bad('seal_hive() succeeds on an unsealed hive', firstLine(e));
    }

    const { rows: postSealRows } = await client.query(
      'select id, ordinal, sealed_at from public.hive_volumes where hive_id = $1 order by ordinal',
      [hiveId]
    );
    if (postSealRows.length === 2 && postSealRows[0].sealed_at !== null && postSealRows[1].sealed_at === null) {
      ok('seal_hive() seals Volume 1 and opens Volume 2');
    } else {
      bad('seal_hive() seals Volume 1 and opens Volume 2', `hive_volumes rows: ${JSON.stringify(postSealRows)}`);
    }
    const volume2Id = postSealRows[1]?.id;

    const { rows: mirrorRows } = await client.query('select sealed_at from public.private_hives where id = $1', [hiveId]);
    if (mirrorRows[0].sealed_at !== null) {
      ok('seal_hive() mirrors the seal onto private_hives.sealed_at (client compat)');
    } else {
      bad('seal_hive() mirrors the seal onto private_hives.sealed_at (client compat)', 'private_hives.sealed_at is still null');
    }

    // 6. The entries this ticket exists to fix: WITHOUT the re-point, this
    // insert would have hit the OLD guard's permanent lock (any hive that
    // ever sealed stays sealed forever under private_hives.sealed_at) and
    // failed. With it, Volume 2 is open and the insert succeeds, landing in
    // Volume 2.
    try {
      const { rows } = await asUser(OWNER, () =>
        client.query(
          "insert into public.entries (user_id, content, entry_date, hive_id) values ($1, 'volume 2 entry', current_date, $2) returning volume_id",
          [OWNER, hiveId]
        )
      );
      if (rows[0].volume_id === volume2Id) {
        ok("R3: after sealing, a new entry lands in the hive's new open volume");
      } else {
        bad(
          "R3: after sealing, a new entry lands in the hive's new open volume",
          `got volume_id ${rows[0].volume_id}, expected ${volume2Id}`
        );
      }
    } catch (e) {
      bad("R3: after sealing, a new entry lands in the hive's new open volume", firstLine(e));
    }

    // 7. Volume 1's own entry is still locked — the re-point didn't just
    // stop enforcing, it moved the enforcement to the right row. Same shape
    // as check-private-hives-seal.mjs's tests 8/10/11: USING excludes the
    // pre-update row outright, so this is zero rows matched, not an
    // exception.
    try {
      const result = await asUser(OWNER, () =>
        client.query('update public.entries set content = $1 where id = $2', ['edited after seal', entry1Id])
      );
      if (result.rowCount === 0) {
        ok('an entry in the now-sealed Volume 1 is still immutable');
      } else {
        bad('an entry in the now-sealed Volume 1 is still immutable', `update matched ${result.rowCount} row(s)`);
      }
    } catch (e) {
      bad('an entry in the now-sealed Volume 1 is still immutable', firstLine(e));
    }

    // 8. seal_hive() called twice raises the same exception SealHive.js
    // string-matches on — a second call must not silently seal Volume 2.
    try {
      await asUser(OWNER, () => client.query('select public.seal_hive($1)', [hiveId]));
      bad('seal_hive() a second time raises "already been sealed"', 'second call succeeded');
    } catch (e) {
      if (/already been sealed/.test(e.message)) {
        ok('seal_hive() a second time raises "already been sealed"');
      } else {
        bad('seal_hive() a second time raises "already been sealed"', `wrong error: ${firstLine(e)}`);
      }
    }

    // 9. seal_volume() directly — the primitive future clients will use —
    // seals Volume 2 (still open) and opens Volume 3.
    try {
      await asUser(OWNER, () => client.query('select public.seal_volume($1)', [hiveId]));
      ok('seal_volume() succeeds directly on the open volume');
    } catch (e) {
      bad('seal_volume() succeeds directly on the open volume', firstLine(e));
    }
    const { rows: v3Rows } = await client.query(
      'select ordinal, sealed_at from public.hive_volumes where hive_id = $1 order by ordinal',
      [hiveId]
    );
    if (v3Rows.length === 3 && v3Rows[1].sealed_at !== null && v3Rows[2].sealed_at === null) {
      ok('the hive never dies: sealing Volume 2 opens Volume 3');
    } else {
      bad('the hive never dies: sealing Volume 2 opens Volume 3', `hive_volumes rows: ${JSON.stringify(v3Rows)}`);
    }

    // 10. seal_volume() is anon-revoked, same shape as seal_hive/send_hive.
    // `set_config(..., true)` is LOCAL to the current transaction -- outside
    // an explicit BEGIN, each statement is its own transaction and the role
    // reverts before the next one runs (silently back to postgres, which
    // bypasses everything). begin/rollback, same as check-hive-state-rls.mjs.
    await client.query('begin');
    try {
      await client.query("select set_config('role', 'anon', true)");
      await client.query('select public.seal_volume($1)', [hiveId]);
      await client.query('rollback');
      bad('seal_volume() is revoked from anon', 'anon call succeeded');
    } catch (e) {
      await client.query('rollback');
      if (e.code === '42501') {
        ok('seal_volume() is revoked from anon');
      } else {
        bad('seal_volume() is revoked from anon', `wrong error: ${firstLine(e)}`);
      }
    }

    // 11. A second hive, left unsealed, as the control: proves the
    // re-pointed guard scopes to the sealed volume, not to hive_id in
    // general.
    const { rows: openHiveRows } = await asUser(OWNER, () =>
      client.query("insert into public.private_hives (owner_id, subject_name) values ($1, 'Second Kid') returning id", [OWNER])
    );
    const openHiveId = openHiveRows[0].id;
    try {
      await asUser(OWNER, () =>
        client.query(
          "insert into public.entries (user_id, content, entry_date, hive_id) values ($1, 'open hive entry', current_date, $2)",
          [OWNER, openHiveId]
        )
      );
      ok('control: insert into an unsealed hive still succeeds');
    } catch (e) {
      bad('control: insert into an unsealed hive still succeeds', firstLine(e));
    }

    console.log(`\ncheck-hive-volumes: ${pass} passed, ${failures.length} failed`);
    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await client.end();
    await pg.stop();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error('check-hive-volumes: FAILED —', e.message);
  process.exit(1);
});
