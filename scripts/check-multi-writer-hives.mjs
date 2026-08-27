// Gate for Project 18.1's migration
// (supabase/migrations/20260827000001_multi_writer_hives.sql).
//
//   npm run check:multi-writer-hives
//
// Proves the ratified shape (Sage, thread b4533a52, 2026-08-27, citing
// Lumen's C1-C4 in docs/strategy/POLLINATE_V2_SPEC.md §18.1a) against a real
// Postgres:
//
//   C2 -- is_collective is set at creation and immutable; a solo hive can
//   never gain a roster (no retroactive exposure).
//   Write authorization -- entries_insert_own/entries_update_own accept the
//   owner OR an active contributor; a stranger gets neither.
//   OPEN-1 -- entries_select_own is untouched: a contributor sees only their
//   own entries pre-seal, and so does the owner (symmetric blindness).
//   C4 -- removal stops new writes but not existing entries; a removed
//   contributor may still delete their own work while the volume is open.
//   Roster visibility -- owner and any active contributor can read the full
//   hive_contributors roster; a stranger cannot.
//
// Modeled on check-hive-volumes.mjs for the harness shape: real migrations
// off disk, mutations run as `authenticated` (never the table owner), and a
// trigger's refusal is checked by catching the raised exception.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);

if (process.env.SKIP_PG_GATES === '1') {
  console.log('check-multi-writer-hives: SKIPPED — SKIP_PG_GATES=1 set explicitly');
  process.exit(0);
}

let EmbeddedPostgres;
try {
  EmbeddedPostgres = require('embedded-postgres').default;
  require('pg');
} catch (e) {
  console.error(
    `check-multi-writer-hives: FAILED — embedded-postgres/pg not installed (${e.message.split('\n')[0]}).\n` +
      '  Run `npm install` (both are devDependencies), or set SKIP_PG_GATES=1 to skip deliberately\n' +
      '  on a machine that genuinely cannot run a local Postgres.'
  );
  process.exit(1);
}

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
  '20260826000003_hive_volumes.sql',
  '20260826000004_hive_volumes_repoint.sql',
  '20260827000001_multi_writer_hives.sql',
];

const OWNER = '11111111-1111-1111-1111-111111111111';
const CONTRIBUTOR = '44444444-4444-4444-4444-444444444444';
const CONTRIBUTOR2 = '55555555-5555-5555-5555-555555555555';
const STRANGER = '66666666-6666-6666-6666-666666666666';

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
  const dataDir = path.join(ROOT, '.multi-writer-hives-pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    // seeds-rls 54329, hive-state 54330, share-visibility 54331,
    // private-hives-seal 54332, hive-volumes 54333; distinct so gates can
    // run concurrently.
    port: 54334,
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

    await client.query(
      'insert into auth.users (id, raw_user_meta_data) values ($1, $2), ($3, $4), ($5, $6), ($7, $8)',
      [
        OWNER, JSON.stringify({ display_name: 'Owner' }),
        CONTRIBUTOR, JSON.stringify({ display_name: 'Contributor' }),
        CONTRIBUTOR2, JSON.stringify({ display_name: 'Contributor Two' }),
        STRANGER, JSON.stringify({ display_name: 'Stranger' }),
      ]
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

    // 1. A solo hive defaults is_collective to false.
    const { rows: soloRows } = await asUser(OWNER, () =>
      client.query(
        "insert into public.private_hives (owner_id, subject_name) values ($1, 'Solo Kid') returning id, is_collective",
        [OWNER]
      )
    );
    const soloHiveId = soloRows[0].id;
    if (soloRows[0].is_collective === false) {
      ok('a solo hive defaults is_collective to false');
    } else {
      bad('a solo hive defaults is_collective to false', `got ${soloRows[0].is_collective}`);
    }

    // 2. C2 -- a collective hive is created with is_collective = true at birth.
    const { rows: hiveRows } = await asUser(OWNER, () =>
      client.query(
        "insert into public.private_hives (owner_id, subject_name, is_collective) values ($1, 'Together Kid', true) returning id",
        [OWNER]
      )
    );
    const hiveId = hiveRows[0].id;
    ok('a collective hive is created with is_collective = true');

    // 3. C2 -- is_collective is immutable, both directions.
    try {
      await asUser(OWNER, () =>
        client.query('update public.private_hives set is_collective = false where id = $1', [hiveId])
      );
      bad('C2: is_collective cannot be flipped true -> false', 'update succeeded');
    } catch (e) {
      if (/is_collective cannot be changed/.test(e.message)) {
        ok('C2: is_collective cannot be flipped true -> false');
      } else {
        bad('C2: is_collective cannot be flipped true -> false', `wrong error: ${firstLine(e)}`);
      }
    }
    try {
      await asUser(OWNER, () =>
        client.query('update public.private_hives set is_collective = true where id = $1', [soloHiveId])
      );
      bad('C2: a solo hive cannot be upgraded to collective', 'update succeeded');
    } catch (e) {
      if (/is_collective cannot be changed/.test(e.message)) {
        ok('C2: a solo hive cannot be upgraded to collective');
      } else {
        bad('C2: a solo hive cannot be upgraded to collective', `wrong error: ${firstLine(e)}`);
      }
    }

    // 4. C2 -- inviting a contributor into a solo hive is rejected outright
    // (hive_contributors_insert_owner requires is_collective).
    try {
      await asUser(OWNER, () =>
        client.query(
          'insert into public.hive_contributors (hive_id, profile_id, invited_by) values ($1, $2, $3)',
          [soloHiveId, CONTRIBUTOR, OWNER]
        )
      );
      bad('C2: a solo hive can never gain a roster row', 'insert succeeded');
    } catch (e) {
      if (e.code === '42501' || /row-level security/.test(e.message)) {
        ok('C2: a solo hive can never gain a roster row');
      } else {
        bad('C2: a solo hive can never gain a roster row', `wrong error: ${firstLine(e)}`);
      }
    }

    // 5. Owner invites two contributors into the collective hive.
    try {
      await asUser(OWNER, () =>
        client.query(
          'insert into public.hive_contributors (hive_id, profile_id, invited_by) values ($1, $2, $4), ($1, $3, $4)',
          [hiveId, CONTRIBUTOR, CONTRIBUTOR2, OWNER]
        )
      );
      ok('owner invites two contributors into the collective hive');
    } catch (e) {
      bad('owner invites two contributors into the collective hive', firstLine(e));
    }

    // 6. A non-owner cannot invite (only the owner may write to the roster).
    try {
      await asUser(CONTRIBUTOR, () =>
        client.query(
          'insert into public.hive_contributors (hive_id, profile_id, invited_by) values ($1, $2, $3)',
          [hiveId, STRANGER, CONTRIBUTOR]
        )
      );
      bad('a contributor cannot invite another contributor', 'insert succeeded');
    } catch (e) {
      if (e.code === '42501' || /row-level security/.test(e.message)) {
        ok('a contributor cannot invite another contributor');
      } else {
        bad('a contributor cannot invite another contributor', `wrong error: ${firstLine(e)}`);
      }
    }

    const { rows: openVolRows } = await client.query(
      'select id from public.hive_volumes where hive_id = $1 and sealed_at is null',
      [hiveId]
    );
    const openVolumeId = openVolRows[0].id;

    // 7. Write authorization -- an active contributor can insert an entry
    // into the hive's open volume.
    let contributorEntryId;
    try {
      const { rows } = await asUser(CONTRIBUTOR, () =>
        client.query(
          "insert into public.entries (user_id, content, entry_date, hive_id) values ($1, 'contributor entry', current_date, $2) returning id, volume_id, user_id",
          [CONTRIBUTOR, hiveId]
        )
      );
      contributorEntryId = rows[0].id;
      if (rows[0].volume_id === openVolumeId && rows[0].user_id === CONTRIBUTOR) {
        ok('an active contributor can write into the hive');
      } else {
        bad('an active contributor can write into the hive', `unexpected row: ${JSON.stringify(rows[0])}`);
      }
    } catch (e) {
      bad('an active contributor can write into the hive', firstLine(e));
    }

    // 8. A stranger (never invited) cannot write into the hive.
    try {
      await asUser(STRANGER, () =>
        client.query(
          "insert into public.entries (user_id, content, entry_date, hive_id) values ($1, 'stranger entry', current_date, $2)",
          [STRANGER, hiveId]
        )
      );
      bad('a stranger cannot write into the hive', 'insert succeeded');
    } catch (e) {
      if (e.code === '42501' || /row-level security/.test(e.message)) {
        ok('a stranger cannot write into the hive');
      } else {
        bad('a stranger cannot write into the hive', `wrong error: ${firstLine(e)}`);
      }
    }

    // 9. OPEN-1 -- a contributor sees only their own entries pre-seal, not
    // the other contributor's or the owner's.
    await asUser(OWNER, () =>
      client.query(
        "insert into public.entries (user_id, content, entry_date, hive_id) values ($1, 'owner entry', current_date, $2)",
        [OWNER, hiveId]
      )
    );
    const { rows: contributorView } = await asUser(CONTRIBUTOR, () =>
      client.query('select user_id from public.entries where hive_id = $1', [hiveId])
    );
    if (contributorView.length === 1 && contributorView[0].user_id === CONTRIBUTOR) {
      ok('OPEN-1: a contributor sees only their own entries pre-seal');
    } else {
      bad('OPEN-1: a contributor sees only their own entries pre-seal', `got: ${JSON.stringify(contributorView)}`);
    }

    // 10. OPEN-1 -- symmetric blindness: the owner ALSO sees only their own
    // entries pre-seal, not the contributor's. This was already true before
    // this migration (entries_select_own is untouched) -- proving it stays
    // true is the point, since §3's promise copy depends on it.
    const { rows: ownerView } = await asUser(OWNER, () =>
      client.query('select user_id from public.entries where hive_id = $1', [hiveId])
    );
    if (ownerView.length === 1 && ownerView[0].user_id === OWNER) {
      ok('OPEN-1: the owner is symmetrically blind to contributor entries pre-seal');
    } else {
      bad('OPEN-1: the owner is symmetrically blind to contributor entries pre-seal', `got: ${JSON.stringify(ownerView)}`);
    }

    // 11. Roster visibility -- an active contributor can see the FULL
    // roster (both contributors), not just their own row.
    const { rows: rosterView } = await asUser(CONTRIBUTOR, () =>
      client.query('select profile_id from public.hive_contributors where hive_id = $1 order by profile_id', [hiveId])
    );
    if (rosterView.length === 2) {
      ok('an active contributor sees the full roster');
    } else {
      bad('an active contributor sees the full roster', `got ${rosterView.length} row(s)`);
    }

    // 12. A stranger cannot see the roster at all.
    const { rows: strangerRosterView } = await asUser(STRANGER, () =>
      client.query('select profile_id from public.hive_contributors where hive_id = $1', [hiveId])
    );
    if (strangerRosterView.length === 0) {
      ok('a stranger cannot see the roster');
    } else {
      bad('a stranger cannot see the roster', `got ${strangerRosterView.length} row(s)`);
    }

    // 13. A stranger cannot even see the hive itself (private_hives select).
    const { rows: strangerHiveView } = await asUser(STRANGER, () =>
      client.query('select id from public.private_hives where id = $1', [hiveId])
    );
    if (strangerHiveView.length === 0) {
      ok('a stranger cannot see the hive row itself');
    } else {
      bad('a stranger cannot see the hive row itself', `got ${strangerHiveView.length} row(s)`);
    }

    // 14. A contributor CAN see the hive row itself (private_hives_select_own
    // widened via is_hive_contributor()).
    const { rows: contributorHiveView } = await asUser(CONTRIBUTOR, () =>
      client.query('select id from public.private_hives where id = $1', [hiveId])
    );
    if (contributorHiveView.length === 1) {
      ok('a contributor can see the hive row itself');
    } else {
      bad('a contributor can see the hive row itself', `got ${contributorHiveView.length} row(s)`);
    }

    // 15. C4 -- owner removes a contributor (soft-removal via removed_at).
    try {
      const result = await asUser(OWNER, () =>
        client.query(
          'update public.hive_contributors set removed_at = now() where hive_id = $1 and profile_id = $2',
          [hiveId, CONTRIBUTOR]
        )
      );
      if (result.rowCount === 1) {
        ok('C4: owner removes a contributor');
      } else {
        bad('C4: owner removes a contributor', `update matched ${result.rowCount} row(s)`);
      }
    } catch (e) {
      bad('C4: owner removes a contributor', firstLine(e));
    }

    // 16. C4 -- removal stops NEW writes: the removed contributor can no
    // longer insert.
    try {
      await asUser(CONTRIBUTOR, () =>
        client.query(
          "insert into public.entries (user_id, content, entry_date, hive_id) values ($1, 'post-removal entry', current_date, $2)",
          [CONTRIBUTOR, hiveId]
        )
      );
      bad('C4: a removed contributor cannot write new entries', 'insert succeeded');
    } catch (e) {
      if (e.code === '42501' || /row-level security/.test(e.message)) {
        ok('C4: a removed contributor cannot write new entries');
      } else {
        bad('C4: a removed contributor cannot write new entries', `wrong error: ${firstLine(e)}`);
      }
    }

    // 17. C4 -- removal does NOT delete existing entries.
    const { rows: stillThereRows } = await asPostgres(() =>
      client.query('select id from public.entries where id = $1', [contributorEntryId])
    );
    if (stillThereRows.length === 1) {
      ok('C4: removal does not delete the removed contributor\'s existing entries');
    } else {
      bad('C4: removal does not delete the removed contributor\'s existing entries', 'entry is gone');
    }

    // 18. C4 -- a removed contributor may still delete their own entry while
    // the volume is open (delete is not a "new write"). This is the gap that
    // was inherited from 20260826000004 if entries_delete_own weren't also
    // widened -- see the migration's own comment.
    try {
      const result = await asUser(CONTRIBUTOR, () =>
        client.query('delete from public.entries where id = $1', [contributorEntryId])
      );
      if (result.rowCount === 1) {
        ok('C4: a removed contributor can still delete their own entry while open');
      } else {
        bad('C4: a removed contributor can still delete their own entry while open', `delete matched ${result.rowCount} row(s)`);
      }
    } catch (e) {
      bad('C4: a removed contributor can still delete their own entry while open', firstLine(e));
    }

    // 19. removed_at is immutable -- cannot be un-set.
    try {
      await asUser(OWNER, () =>
        client.query(
          'update public.hive_contributors set removed_at = null where hive_id = $1 and profile_id = $2',
          [hiveId, CONTRIBUTOR]
        )
      );
      bad('removed_at cannot be un-set once removed', 'update succeeded');
    } catch (e) {
      if (/removed_at cannot be changed/.test(e.message)) {
        ok('removed_at cannot be un-set once removed');
      } else {
        bad('removed_at cannot be un-set once removed', `wrong error: ${firstLine(e)}`);
      }
    }

    // 19b. Setup for #21 below: an active contributor also writes into the
    // volume that's about to be sealed, so the post-seal blindness check has
    // more than one author's packaged row to prove blindness against.
    let contributor2SealedEntryId;
    try {
      const { rows } = await asUser(CONTRIBUTOR2, () =>
        client.query(
          "insert into public.entries (user_id, content, entry_date, hive_id) values ($1, 'contributor2 pre-seal entry', current_date, $2) returning id",
          [CONTRIBUTOR2, hiveId]
        )
      );
      contributor2SealedEntryId = rows[0].id;
      ok('setup: an active contributor writes into the volume about to be sealed');
    } catch (e) {
      bad('setup: an active contributor writes into the volume about to be sealed', firstLine(e));
    }

    // 20. Sealing locks the SEALED VOLUME, not the hive -- this schema's own
    // model since 20260826000003/4 ("the hive never dies": sealing opens the
    // next volume, seal_hive/seal_volume never permanently locks a hive).
    // First check caught this: the original version of this test expected
    // seal_hive() to reject every subsequent insert outright, which
    // contradicted check-hive-volumes.mjs's own R3 ("after sealing, a new
    // entry lands in the hive's new open volume") -- that was a wrong
    // expectation in the test, not a policy bug. Split into the two real
    // claims: an explicit insert naming the now-sealed volume is rejected
    // for an active contributor exactly as it is for the owner, and an
    // ordinary hive-scoped insert (no volume_id given) still succeeds by
    // landing in the volume seal_hive() just opened.
    await asUser(OWNER, () => client.query('select public.seal_hive($1)', [hiveId]));
    const { rows: volumesAfterSeal } = await asPostgres(() =>
      client.query('select id, sealed_at from public.hive_volumes where hive_id = $1 order by ordinal', [hiveId])
    );
    const sealedVolumeId = volumesAfterSeal.find((v) => v.sealed_at !== null)?.id;
    const openVolume2Id = volumesAfterSeal.find((v) => v.sealed_at === null)?.id;

    try {
      await asUser(CONTRIBUTOR2, () =>
        client.query(
          "insert into public.entries (user_id, content, entry_date, hive_id, volume_id) values ($1, 'sealed volume entry', current_date, $2, $3)",
          [CONTRIBUTOR2, hiveId, sealedVolumeId]
        )
      );
      bad('an active contributor cannot write directly into a sealed volume', 'insert succeeded');
    } catch (e) {
      if (e.code === '42501' || /row-level security/.test(e.message)) {
        ok('an active contributor cannot write directly into a sealed volume');
      } else {
        bad('an active contributor cannot write directly into a sealed volume', `wrong error: ${firstLine(e)}`);
      }
    }

    try {
      const { rows } = await asUser(CONTRIBUTOR2, () =>
        client.query(
          "insert into public.entries (user_id, content, entry_date, hive_id) values ($1, 'volume 2 entry', current_date, $2) returning volume_id",
          [CONTRIBUTOR2, hiveId]
        )
      );
      if (rows[0].volume_id === openVolume2Id) {
        ok("an active contributor keeps writing into the hive's new open volume after seal");
      } else {
        bad(
          "an active contributor keeps writing into the hive's new open volume after seal",
          `got volume_id ${rows[0].volume_id}, expected ${openVolume2Id}`
        );
      }
    } catch (e) {
      bad("an active contributor keeps writing into the hive's new open volume after seal", firstLine(e));
    }

    // 21. Lumen's gate-completeness finding (thread b4533a52, 2026-08-27):
    // rows 9/10 above only probe blindness PRE-seal, where the restrictive
    // entries_select_respect_visibility policy blocks a hive-ownership-based
    // permissive grant anyway (visibility = 'private' there) -- that's the
    // one window where the doc's negative ("owner cannot read a
    // contributor's entries pre-seal") is unobservable as a distinct claim,
    // because two independent mechanisms would both block it. POST-seal,
    // visibility flips to 'packaged' and the restrictive policy stops
    // blocking (visibility <> 'private' is now true) -- so absence of any
    // permissive SELECT granting hive-wide access is the ONLY thing left
    // enforcing blindness in that window, and it was never re-probed. Owner
    // selects the hive's entries after seal; must still see only their own
    // packaged row, not CONTRIBUTOR2's now-also-packaged one from #19b.
    const { rows: ownerPostSealView } = await asUser(OWNER, () =>
      client.query('select user_id, visibility from public.entries where hive_id = $1', [hiveId])
    );
    if (
      ownerPostSealView.length === 1 &&
      ownerPostSealView[0].user_id === OWNER &&
      ownerPostSealView[0].visibility === 'packaged'
    ) {
      ok('post-seal: the owner still sees only their own packaged row, not a contributor\'s');
    } else {
      bad(
        'post-seal: the owner still sees only their own packaged row, not a contributor\'s',
        `got: ${JSON.stringify(ownerPostSealView)}`
      );
    }

    // Sanity check on #21's fixture: CONTRIBUTOR2's own pre-seal entry
    // really did get packaged (proves the "not just still-private" half of
    // the claim -- a blindness check against a still-private row wouldn't
    // distinguish the restrictive policy from the missing-grant absence).
    const { rows: contributor2SealedRow } = await asPostgres(() =>
      client.query('select visibility from public.entries where id = $1', [contributor2SealedEntryId])
    );
    if (contributor2SealedRow[0]?.visibility === 'packaged') {
      ok('post-seal: the fixture row the blindness check above depends on is actually packaged');
    } else {
      bad(
        'post-seal: the fixture row the blindness check above depends on is actually packaged',
        `got: ${JSON.stringify(contributor2SealedRow[0])}`
      );
    }

    // 22-26: Sage's ruling, Lumen's active-only scope (thread b4533a52,
    // 2026-08-27) -- the subject/roster guard, both directions, on a fresh
    // hive so it doesn't entangle with the sealed fixture above.
    const { rows: subjectHiveRows } = await asUser(OWNER, () =>
      client.query(
        "insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective) values ($1, 'Subject Test Kid', $2, true) returning id",
        [OWNER, STRANGER]
      )
    );
    const subjectHiveId = subjectHiveRows[0].id;

    // 22. Direction 1: inviting the hive's CURRENT subject as a contributor
    // is rejected.
    try {
      await asUser(OWNER, () =>
        client.query(
          'insert into public.hive_contributors (hive_id, profile_id, invited_by) values ($1, $2, $3)',
          [subjectHiveId, STRANGER, OWNER]
        )
      );
      bad('subject guard: cannot invite the hive\'s current subject as a contributor', 'insert succeeded');
    } catch (e) {
      if (e.code === '42501' || /row-level security/.test(e.message)) {
        ok('subject guard: cannot invite the hive\'s current subject as a contributor');
      } else {
        bad('subject guard: cannot invite the hive\'s current subject as a contributor', `wrong error: ${firstLine(e)}`);
      }
    }

    // 23. Sanity: inviting someone who is NOT the subject still works (the
    // guard is scoped to the subject, not a blanket invite lock).
    try {
      await asUser(OWNER, () =>
        client.query(
          'insert into public.hive_contributors (hive_id, profile_id, invited_by) values ($1, $2, $3)',
          [subjectHiveId, CONTRIBUTOR, OWNER]
        )
      );
      ok('subject guard: inviting a non-subject contributor still succeeds');
    } catch (e) {
      bad('subject guard: inviting a non-subject contributor still succeeds', firstLine(e));
    }

    // 24. Direction 2: pointing subject_profile_id at a profile who is
    // currently an ACTIVE contributor is rejected.
    try {
      await asUser(OWNER, () =>
        client.query('update public.private_hives set subject_profile_id = $1 where id = $2', [
          CONTRIBUTOR,
          subjectHiveId,
        ])
      );
      bad('subject guard: cannot repoint subject_profile_id at an active contributor', 'update succeeded');
    } catch (e) {
      if (/subject_profile_id cannot be an active contributor/.test(e.message)) {
        ok('subject guard: cannot repoint subject_profile_id at an active contributor');
      } else {
        bad('subject guard: cannot repoint subject_profile_id at an active contributor', `wrong error: ${firstLine(e)}`);
      }
    }

    // 25. Lumen's active-only derivation, proved rather than just asserted:
    // once CONTRIBUTOR is REMOVED from this hive's roster, pointing
    // subject_profile_id at them is allowed -- a removed contributor regains
    // nothing through the widened SELECT (is_hive_contributor() filters
    // removed_at is null), so guarding this case would enforce nothing
    // while over-restricting a legitimate reassignment.
    await asUser(OWNER, () =>
      client.query(
        'update public.hive_contributors set removed_at = now() where hive_id = $1 and profile_id = $2',
        [subjectHiveId, CONTRIBUTOR]
      )
    );
    try {
      const result = await asUser(OWNER, () =>
        client.query('update public.private_hives set subject_profile_id = $1 where id = $2', [
          CONTRIBUTOR,
          subjectHiveId,
        ])
      );
      if (result.rowCount === 1) {
        ok('subject guard: active-only scope -- a REMOVED contributor may become the subject');
      } else {
        bad('subject guard: active-only scope -- a REMOVED contributor may become the subject', `update matched ${result.rowCount} row(s)`);
      }
    } catch (e) {
      bad('subject guard: active-only scope -- a REMOVED contributor may become the subject', firstLine(e));
    }

    console.log(`\ncheck-multi-writer-hives: ${pass} passed, ${failures.length} failed`);
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
  console.error('check-multi-writer-hives: FAILED —', e.message);
  process.exit(1);
});
