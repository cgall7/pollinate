// Gate for the DES-21 §8 fast-follow migration
// (supabase/migrations/20260828000001_multiwriter_contributor_names.sql).
//
//   npm run check:contributor-names
//
// Proves the ratified shape (Sage, thread b4533a52, rulings §61-§64,
// corrected across three rounds by Lumen and Pixel before being written)
// against a real Postgres:
//
//   Stamp-at-seal -- seal_volume() writes entries.author_name_at_seal from
//   profiles.display_name at the moment it flips a volume to 'packaged'.
//   Dedupe-on-entity -- send_hive() computes private_hives.contributor_names
//   distinct on entries.user_id, not on the name string: two contributors
//   who share a display name each keep their own array element.
//   Empty-is-a-value -- an empty hive's contributor_names is '{}', never
//   null (array_agg over zero rows would otherwise be NULL).
//   Subject read path -- contributor_names rides private_hives_select_as_
//   subject; hive_contributors itself stays owner/active-contributor-only,
//   so the subject can read the names without ever reading the roster table.
//   Invite-time guard -- hive_contributors_insert_owner refuses a candidate
//   whose display_name is empty or whitespace-only after trim.
//   Backfill -- a hive sealed/sent BEFORE this migration (under the old
//   seal_hive/send_hive bodies, with neither new column existing yet) gets
//   both columns filled in by the migration's own backfill UPDATEs.
//
// Modeled on check-multi-writer-hives.mjs / check-hive-volumes.mjs for the
// harness shape: real migrations off disk, mutations run as `authenticated`
// (never the table owner), and the backfill proof applies the dependency
// chain in two stages so there is a genuine "before" state to backfill from.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);

if (process.env.SKIP_PG_GATES === '1') {
  console.log('check-contributor-names: SKIPPED — SKIP_PG_GATES=1 set explicitly');
  process.exit(0);
}

let EmbeddedPostgres;
try {
  EmbeddedPostgres = require('embedded-postgres').default;
  require('pg');
} catch (e) {
  console.error(
    `check-contributor-names: FAILED — embedded-postgres/pg not installed (${e.message.split('\n')[0]}).\n` +
      '  Run `npm install` (both are devDependencies), or set SKIP_PG_GATES=1 to skip deliberately\n' +
      '  on a machine that genuinely cannot run a local Postgres.'
  );
  process.exit(1);
}

// Everything the target migration depends on, in order, stopping one short
// of it — the "before" state the backfill proof needs.
const APPLY_BEFORE = [
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
  '20260826000003_hive_volumes.sql',
  '20260826000004_hive_volumes_repoint.sql',
  '20260827000001_multi_writer_hives.sql',
];
const TARGET_MIGRATION = '20260828000001_multiwriter_contributor_names.sql';

const OWNER = '11111111-1111-1111-1111-111111111111';
const CONTRIBUTOR = '44444444-4444-4444-4444-444444444444';
const NANA1 = '77777777-7777-7777-7777-777777777771';
const NANA2 = '77777777-7777-7777-7777-777777777772';
const SUBJECT = '88888888-8888-8888-8888-888888888881';
const SUBJECT_PRE = '88888888-8888-8888-8888-888888888882';
const SUBJECT3 = '88888888-8888-8888-8888-888888888883';
const STRANGER = '66666666-6666-6666-6666-666666666666';
const EMPTY_NAME = '99999999-9999-9999-9999-999999999991';
const WHITESPACE_NAME = '99999999-9999-9999-9999-999999999992';

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
  const dataDir = path.join(ROOT, '.contributor-names-pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    // seeds-rls 54329, hive-state 54330, share-visibility 54331,
    // private-hives-seal 54332, hive-volumes 54333, multi-writer-hives
    // 54334; distinct so gates can run concurrently.
    port: 54335,
    persistent: false,
  });

  await pg.initialise();
  await pg.start();
  await pg.createDatabase('app');
  const client = pg.getPgClient('app');
  await client.connect();

  try {
    await client.query(SUPABASE_ENV);
    for (const file of APPLY_BEFORE) {
      const sql = fs.readFileSync(path.join(MIGRATIONS, file), 'utf8');
      await client.query(sql);
    }

    await client.query(
      `insert into auth.users (id, raw_user_meta_data) values
        ($1, $2), ($3, $4), ($5, $6), ($7, $8), ($9, $10), ($11, $12), ($13, $14)`,
      [
        OWNER, JSON.stringify({ display_name: 'Owner' }),
        CONTRIBUTOR, JSON.stringify({ display_name: 'Contributor' }),
        NANA1, JSON.stringify({ display_name: 'Nana' }),
        NANA2, JSON.stringify({ display_name: 'Nana' }),
        SUBJECT, JSON.stringify({ display_name: 'Subject' }),
        SUBJECT_PRE, JSON.stringify({ display_name: 'Subject Pre' }),
        STRANGER, JSON.stringify({ display_name: 'Stranger' }),
      ]
    );
    await client.query('insert into auth.users (id, raw_user_meta_data) values ($1, $2), ($3, $4)', [
      SUBJECT3, JSON.stringify({ display_name: 'Subject Three' }),
      EMPTY_NAME, JSON.stringify({ display_name: '' }),
    ]);
    await client.query('insert into auth.users (id, raw_user_meta_data) values ($1, $2)', [
      WHITESPACE_NAME, JSON.stringify({ display_name: '   ' }),
    ]);

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
    const accept = (a, b) =>
      asPostgres(() =>
        client.query(
          "insert into public.honeycomb_connections (requester_id, addressee_id, status) values ($1, $2, 'accepted')",
          [a, b]
        )
      );

    // ------------------------------------------------------------------
    // Stage 1: BEFORE the target migration. Build one collective hive the
    // old way (old seal_hive/send_hive bodies, neither new column exists
    // yet), so there is a real "before" state for the backfill proof below.
    // ------------------------------------------------------------------
    await accept(OWNER, SUBJECT_PRE);

    const { rows: preHiveRows } = await asUser(OWNER, () =>
      client.query(
        `insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective)
         values ($1, 'Subject Pre', $2, true) returning id`,
        [OWNER, SUBJECT_PRE]
      )
    );
    const preHiveId = preHiveRows[0].id;

    await asUser(OWNER, () =>
      client.query(
        'insert into public.hive_contributors (hive_id, profile_id, invited_by) values ($1, $2, $3)',
        [preHiveId, CONTRIBUTOR, OWNER]
      )
    );
    await asUser(OWNER, () =>
      client.query(
        "insert into public.entries (user_id, hive_id, content, entry_date) values ($1, $2, 'pre-migration, owner', '2026-08-01')",
        [OWNER, preHiveId]
      )
    );
    await asUser(CONTRIBUTOR, () =>
      client.query(
        "insert into public.entries (user_id, hive_id, content, entry_date) values ($1, $2, 'pre-migration, contributor', '2026-08-02')",
        [CONTRIBUTOR, preHiveId]
      )
    );
    await asUser(OWNER, () => client.query('select public.seal_hive($1)', [preHiveId]));
    await asUser(OWNER, () => client.query('select public.send_hive($1)', [preHiveId]));

    const { rows: preColCheck } = await asPostgres(() =>
      client.query(
        "select column_name from information_schema.columns where table_schema='public' and table_name='entries' and column_name='author_name_at_seal'"
      )
    );
    if (preColCheck.length === 0) {
      ok('setup: author_name_at_seal does not exist before the target migration (real "before" state)');
    } else {
      bad('setup: author_name_at_seal does not exist before the target migration', 'column already present — backfill proof is not testing what it claims to');
    }

    // ------------------------------------------------------------------
    // Now apply the target migration itself.
    // ------------------------------------------------------------------
    await client.query(fs.readFileSync(path.join(MIGRATIONS, TARGET_MIGRATION), 'utf8'));

    // 1. Backfill: entries.author_name_at_seal for the pre-existing sent hive.
    const { rows: preEntries } = await asPostgres(() =>
      client.query(
        'select user_id, author_name_at_seal from public.entries where hive_id = $1 order by entry_date',
        [preHiveId]
      )
    );
    if (preEntries.length === 2 && preEntries[0].author_name_at_seal === 'Owner' && preEntries[1].author_name_at_seal === 'Contributor') {
      ok('backfill: entries.author_name_at_seal filled in for entries sealed before this migration');
    } else {
      bad(
        'backfill: entries.author_name_at_seal filled in for entries sealed before this migration',
        `got ${JSON.stringify(preEntries)}`
      );
    }

    // 2. Backfill: private_hives.contributor_names for the pre-existing sent hive.
    const { rows: preHive } = await asPostgres(() =>
      client.query('select contributor_names from public.private_hives where id = $1', [preHiveId])
    );
    if (JSON.stringify(preHive[0].contributor_names) === JSON.stringify(['Owner', 'Contributor'])) {
      ok('backfill: private_hives.contributor_names filled in for a hive sent before this migration');
    } else {
      bad(
        'backfill: private_hives.contributor_names filled in for a hive sent before this migration',
        `got ${JSON.stringify(preHive[0].contributor_names)}`
      );
    }

    // ------------------------------------------------------------------
    // Stage 2: AFTER the target migration. Live flow through the new
    // seal_volume/send_hive bodies.
    // ------------------------------------------------------------------
    await accept(OWNER, SUBJECT);

    const { rows: hiveRows } = await asUser(OWNER, () =>
      client.query(
        `insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective)
         values ($1, 'Subject', $2, true) returning id`,
        [OWNER, SUBJECT]
      )
    );
    const hiveId = hiveRows[0].id;

    for (const [uid] of [[CONTRIBUTOR], [NANA1], [NANA2]]) {
      await asUser(OWNER, () =>
        client.query('insert into public.hive_contributors (hive_id, profile_id, invited_by) values ($1, $2, $3)', [
          hiveId, uid, OWNER,
        ])
      );
    }
    ok('setup: the owner can invite a contributor whose profile they cannot read directly (profile_has_display_name bypasses profiles RLS)');

    // 3. Invite-time guard: an empty or whitespace-only display_name is refused.
    try {
      await asUser(OWNER, () =>
        client.query('insert into public.hive_contributors (hive_id, profile_id, invited_by) values ($1, $2, $3)', [
          hiveId, EMPTY_NAME, OWNER,
        ])
      );
      bad('invite guard: refuses a candidate with an empty display_name', 'insert succeeded');
    } catch (e) {
      if (e.code === '42501' || /row-level security/.test(e.message)) {
        ok('invite guard: refuses a candidate with an empty display_name');
      } else {
        bad('invite guard: refuses a candidate with an empty display_name', `wrong error: ${firstLine(e)}`);
      }
    }
    try {
      await asUser(OWNER, () =>
        client.query('insert into public.hive_contributors (hive_id, profile_id, invited_by) values ($1, $2, $3)', [
          hiveId, WHITESPACE_NAME, OWNER,
        ])
      );
      bad('invite guard: refuses a candidate whose display_name is whitespace-only after trim', 'insert succeeded');
    } catch (e) {
      if (e.code === '42501' || /row-level security/.test(e.message)) {
        ok('invite guard: refuses a candidate whose display_name is whitespace-only after trim');
      } else {
        bad('invite guard: refuses a candidate whose display_name is whitespace-only after trim', `wrong error: ${firstLine(e)}`);
      }
    }

    // Entries, distinct authors, deliberately reusing "Nana" across two profiles.
    await asUser(OWNER, () =>
      client.query("insert into public.entries (user_id, hive_id, content, entry_date) values ($1, $2, 'day 1, owner', '2026-08-10')", [OWNER, hiveId])
    );
    await asUser(CONTRIBUTOR, () =>
      client.query("insert into public.entries (user_id, hive_id, content, entry_date) values ($1, $2, 'day 2, contributor', '2026-08-11')", [CONTRIBUTOR, hiveId])
    );
    await asUser(NANA1, () =>
      client.query("insert into public.entries (user_id, hive_id, content, entry_date) values ($1, $2, 'day 3, nana one', '2026-08-12')", [NANA1, hiveId])
    );
    await asUser(NANA2, () =>
      client.query("insert into public.entries (user_id, hive_id, content, entry_date) values ($1, $2, 'day 4, nana two', '2026-08-13')", [NANA2, hiveId])
    );

    await asUser(OWNER, () => client.query('select public.seal_hive($1)', [hiveId]));

    // 4. Stamp-at-seal: every entry got author_name_at_seal from its own author's profile.
    const { rows: sealedEntries } = await asPostgres(() =>
      client.query('select user_id, author_name_at_seal from public.entries where hive_id = $1 order by entry_date', [hiveId])
    );
    const expectedStamps = ['Owner', 'Contributor', 'Nana', 'Nana'];
    const gotStamps = sealedEntries.map((r) => r.author_name_at_seal);
    if (JSON.stringify(gotStamps) === JSON.stringify(expectedStamps)) {
      ok('stamp-at-seal: seal_volume() writes author_name_at_seal per-author, in entry order');
    } else {
      bad('stamp-at-seal: seal_volume() writes author_name_at_seal per-author, in entry order', `got ${JSON.stringify(gotStamps)}`);
    }

    await asUser(OWNER, () => client.query('select public.send_hive($1)', [hiveId]));

    // 5. Dedupe-on-entity: two same-named contributors each keep their own array element.
    const { rows: sentHive } = await asPostgres(() =>
      client.query('select contributor_names from public.private_hives where id = $1', [hiveId])
    );
    const expectedNames = ['Owner', 'Contributor', 'Nana', 'Nana'];
    if (JSON.stringify(sentHive[0].contributor_names) === JSON.stringify(expectedNames)) {
      ok('dedupe-on-entity: contributor_names dedupes on user_id, so two "Nana"s both survive');
    } else {
      bad('dedupe-on-entity: contributor_names dedupes on user_id, so two "Nana"s both survive', `got ${JSON.stringify(sentHive[0].contributor_names)}`);
    }

    // 6. Subject read path: the subject reads contributor_names via private_hives...
    const { rows: subjectRead } = await asUser(SUBJECT, () =>
      client.query('select contributor_names from public.private_hives where id = $1', [hiveId])
    );
    if (subjectRead.length === 1 && JSON.stringify(subjectRead[0].contributor_names) === JSON.stringify(expectedNames)) {
      ok('subject read path: the hive subject can read contributor_names via private_hives_select_as_subject');
    } else {
      bad('subject read path: the hive subject can read contributor_names via private_hives_select_as_subject', `got ${JSON.stringify(subjectRead)}`);
    }

    // ...but never through hive_contributors itself (§61 correction: that table has no subject clause).
    const { rows: subjectRoster } = await asUser(SUBJECT, () =>
      client.query('select profile_id from public.hive_contributors where hive_id = $1', [hiveId])
    );
    if (subjectRoster.length === 0) {
      ok('subject read path: the hive subject cannot read hive_contributors directly (no subject clause on that table)');
    } else {
      bad(
        'subject read path: the hive subject cannot read hive_contributors directly',
        `LEAK: subject read ${JSON.stringify(subjectRoster)}`
      );
    }

    // 7. Empty-is-a-value: a hive with zero entries sends with contributor_names = '{}', not null.
    await accept(OWNER, SUBJECT3);
    const { rows: emptyHiveRows } = await asUser(OWNER, () =>
      client.query(
        `insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective)
         values ($1, 'Subject Three', $2, true) returning id`,
        [OWNER, SUBJECT3]
      )
    );
    const emptyHiveId = emptyHiveRows[0].id;
    await asUser(OWNER, () => client.query('select public.seal_hive($1)', [emptyHiveId]));
    await asUser(OWNER, () => client.query('select public.send_hive($1)', [emptyHiveId]));
    const { rows: emptyHive } = await asPostgres(() =>
      client.query('select contributor_names from public.private_hives where id = $1', [emptyHiveId])
    );
    if (Array.isArray(emptyHive[0].contributor_names) && emptyHive[0].contributor_names.length === 0) {
      ok('empty-is-a-value: an empty hive sends with contributor_names = {}, not null');
    } else {
      bad('empty-is-a-value: an empty hive sends with contributor_names = {}, not null', `got ${JSON.stringify(emptyHive[0].contributor_names)}`);
    }

    console.log(`\ncheck-contributor-names: ${pass} passed, ${failures.length} failed`);
    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await client.end();
    await pg.stop();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

// embedded-postgres pulls in async-exit-hook, which hooks Node's 'beforeExit'
// and hard-exits 0 there — the only thing that preempts it is an explicit
// process.exit(), so a bare `process.exitCode = 1` set above is silently
// discarded once the event loop drains. Exiting explicitly here runs after
// main()'s own finally block (client/pg cleanup) has already completed.
main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((e) => {
    console.error('check-contributor-names: FAILED —', e.message);
    process.exit(1);
  });
