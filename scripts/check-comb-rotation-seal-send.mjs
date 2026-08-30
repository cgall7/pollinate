// Gate for ENG-91's fused seal-and-send RPC
// (supabase/migrations/20260830000003_eng91_seal_and_send_rotation.sql).
//
//   npm run check:comb-rotation-seal-send
//
// Proves the ruled shape (thread b57ad406, 2026-08-30 -- see the migration's
// own header for the full citation chain) against a real Postgres:
//
//   No auth.uid() gate -- callable with no session at all, time (closes_at)
//   is the only gate, and the ONLY thing standing between "any authenticated
//   user seals any comb's rotation" and safety is the grant boundary
//   (service_role only, never authenticated).
//   Idempotent -- a second call on an already-resolved rotation is a no-op
//   success, not an error.
//   Three void reasons, correctly distinguished: quiet (intact roster, zero
//   entries), departed (zero entries because the roster emptied), and
//   subject_gone (tombstoned or comb-departed subject, overrides delivery
//   even when entries exist).
//   No successor volume opens on ANY branch (deliver or void) -- a rotation
//   hive seals once. hive_volumes row count for the hive stays 1.
//   private_hives.sealed_at mirror is written on every branch -- COPY-14's
//   acceptance row (Vector, event 7): after a seal, getHive(hiveId).sealedAt
//   must be non-null.
//   coalesce(nullif(display_name, ''), 'A writer') backstop fires when a
//   name is blank at seal time, on both the deliver and void paths.
//
// Modeled on check-multi-writer-hives.mjs for the harness shape: real
// migrations off disk in full chronological order, mutations run under the
// actual role/grant that will call this in production (service_role, with
// no request.jwt.claims set at all -- not even authenticated with a null
// sub), and refusals are checked by catching the raised exception.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);

if (process.env.SKIP_PG_GATES === '1') {
  console.log('check-comb-rotation-seal-send: SKIPPED — SKIP_PG_GATES=1 set explicitly');
  process.exit(0);
}

let EmbeddedPostgres;
try {
  EmbeddedPostgres = require('embedded-postgres').default;
  require('pg');
} catch (e) {
  console.error(
    `check-comb-rotation-seal-send: FAILED — embedded-postgres/pg not installed (${e.message.split('\n')[0]}).\n` +
      '  Run `npm install` (both are devDependencies), or set SKIP_PG_GATES=1 to skip deliberately\n' +
      '  on a machine that genuinely cannot run a local Postgres.'
  );
  process.exit(1);
}

// Full chronological chain, off disk, not cherry-picked — comb_rotations
// depends on the entire hive/multi-writer lineage, and ENG-91 depends on
// comb_rotations plus ENG-84's profiles.deleted_at.
const APPLY = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();

const OWNER = '11111111-1111-1111-1111-111111111111';
const SUBJECT = '22222222-2222-2222-2222-222222222222';
const CONTRIBUTOR = '33333333-3333-3333-3333-333333333333';
const CONTRIBUTOR2 = '77777777-7777-7777-7777-777777777777';
// Separate subjects for tests 5 and 6, deliberately -- profiles.deleted_at
// is immutable (profiles_deleted_at_immutable_trigger) and test 4
// permanently tombstones SUBJECT. Reusing SUBJECT in a later test that
// claims to isolate a DIFFERENT cause of subject_gone (comb departure
// alone, or no cause at all) would be silently confounded by test 4's
// tombstone -- test 5's comb-removal branch would coincidentally still
// read subject_gone even if that check were deleted, and test 6's deliver
// path could never be reached at all. Caught by seeing test 6 actually
// void instead of deliver; fixed at the root (fixture isolation), not by
// reordering tests around a shared mutable global.
const SUBJECT_FOR_COMB_DEPARTURE = '44444444-4444-4444-4444-444444444444';
const SUBJECT_INTACT = '55555555-5555-5555-5555-555555555555';

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
const firstLine = (e) => e.message.split('\n')[0].slice(0, 120);

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
  const dataDir = path.join(ROOT, '.comb-rotation-seal-send-pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    // Distinct from every other gate's port (54329-54335) so this can run
    // concurrently with the rest of the suite.
    port: 54336,
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
      'insert into auth.users (id, raw_user_meta_data) values ($1, $2), ($3, $4), ($5, $6), ($7, $8), ($9, $10), ($11, $12)',
      [
        OWNER, JSON.stringify({ display_name: 'Owner' }),
        SUBJECT, JSON.stringify({ display_name: 'Subject' }),
        CONTRIBUTOR, JSON.stringify({ display_name: 'Contributor' }),
        CONTRIBUTOR2, JSON.stringify({ display_name: 'Contributor Two' }),
        SUBJECT_FOR_COMB_DEPARTURE, JSON.stringify({ display_name: 'Subject Departure' }),
        SUBJECT_INTACT, JSON.stringify({ display_name: 'Subject Intact' }),
      ]
    );

    // asPostgres: plain session role, superuser, bypasses RLS — used for
    // test fixture setup that would otherwise need ENG-59's not-yet-built
    // join RPC (comb_members has no client INSERT policy at all).
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
    // The real caller shape: service_role, NO request.jwt.claims at all —
    // not "authenticated with sub=null", genuinely no session, matching
    // what a headless scheduler actually presents.
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

    // Fixture builder: one comb, one rotation hive, with whatever roster
    // and entries the test wants, closes_at already in the past unless
    // overridden.
    async function mintRotation({
      contributors = [CONTRIBUTOR],
      closesAt = 'now() - interval \'1 hour\'',
      subject = SUBJECT,
    }) {
      const { rows: combRows } = await asUser(OWNER, () =>
        client.query("insert into public.combs (owner_id, name) values ($1, 'Test Comb') returning id", [OWNER])
      );
      const combId = combRows[0].id;

      await asPostgres(() =>
        client.query(
          'insert into public.comb_members (comb_id, profile_id) values ($1, $2), ($1, $3), ($1, $4) on conflict do nothing',
          [combId, subject, CONTRIBUTOR, CONTRIBUTOR2]
        )
      );

      const { rows: hiveRows } = await asUser(OWNER, () =>
        client.query(
          "insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective) values ($1, 'Rotation', $2, true) returning id",
          [OWNER, subject]
        )
      );
      const hiveId = hiveRows[0].id;

      for (const c of contributors) {
        await asUser(OWNER, () =>
          client.query(
            'insert into public.hive_contributors (hive_id, profile_id, invited_by) values ($1, $2, $3)',
            [hiveId, c, OWNER]
          )
        );
      }

      const { rows: rotRows } = await asUser(OWNER, () =>
        client.query(
          `insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at)
           values ($1, 1, $2, $3, ${closesAt}) returning id`,
          [combId, hiveId, subject]
        )
      );
      return { combId, hiveId, rotationId: rotRows[0].id };
    }

    async function volumeIdFor(hiveId) {
      const { rows } = await asPostgres(() =>
        client.query('select id from public.hive_volumes where hive_id = $1 and sealed_at is null', [hiveId])
      );
      return rows[0]?.id;
    }

    // ---------------------------------------------------------------
    // 1. Deliver: entries present, roster and subject intact.
    const t1 = await mintRotation({ contributors: [CONTRIBUTOR] });
    const t1Volume = await volumeIdFor(t1.hiveId);
    await asUser(CONTRIBUTOR, () =>
      client.query(
        "insert into public.entries (user_id, hive_id, volume_id, content, entry_date) values ($1, $2, $3, 'For Subject', current_date)",
        [CONTRIBUTOR, t1.hiveId, t1Volume]
      )
    );

    await asService(() => client.query('select public.seal_and_send_rotation($1)', [t1.rotationId]));

    {
      const { rows } = await client.query(
        'select sealed_at, sent_at, voided_at, voided_reason from public.comb_rotations where id = $1',
        [t1.rotationId]
      );
      const r = rows[0];
      if (r.sealed_at && r.sent_at && !r.voided_at && !r.voided_reason) {
        ok('deliver: comb_rotations sealed + sent, not voided');
      } else {
        bad('deliver: comb_rotations sealed + sent, not voided', JSON.stringify(r));
      }
    }
    {
      const { rows } = await client.query(
        'select sealed_at, sent_at, contributor_names from public.private_hives where id = $1',
        [t1.hiveId]
      );
      const r = rows[0];
      if (r.sealed_at && r.sent_at && JSON.stringify(r.contributor_names) === JSON.stringify(['Contributor'])) {
        ok('deliver: private_hives.sealed_at/sent_at mirror + contributor_names correct');
      } else {
        bad('deliver: private_hives.sealed_at/sent_at mirror + contributor_names correct', JSON.stringify(r));
      }
    }
    {
      const { rows } = await client.query(
        "select visibility, author_name_at_seal from public.entries where hive_id = $1",
        [t1.hiveId]
      );
      if (rows.length === 1 && rows[0].visibility === 'sent' && rows[0].author_name_at_seal === 'Contributor') {
        ok('deliver: entry flipped to sent with correct author_name_at_seal');
      } else {
        bad('deliver: entry flipped to sent with correct author_name_at_seal', JSON.stringify(rows));
      }
    }
    {
      const { rows } = await client.query('select count(*)::int as n from public.hive_volumes where hive_id = $1', [
        t1.hiveId,
      ]);
      if (rows[0].n === 1) {
        ok('deliver: no successor volume opened (hive_volumes count stays 1)');
      } else {
        bad('deliver: no successor volume opened (hive_volumes count stays 1)', `got ${rows[0].n}`);
      }
    }
    {
      const { rows } = await client.query(
        'select count(*)::int as n from public.hive_send_events where sender_id = $1 and recipient_id = $2',
        [OWNER, SUBJECT]
      );
      if (rows[0].n === 1) {
        ok('deliver: hive_send_events written (owner -> subject)');
      } else {
        bad('deliver: hive_send_events written (owner -> subject)', `got ${rows[0].n}`);
      }
    }
    // Idempotency: second call is a silent no-op, timestamps unchanged.
    {
      const { rows: before } = await client.query('select sent_at from public.private_hives where id = $1', [
        t1.hiveId,
      ]);
      await asService(() => client.query('select public.seal_and_send_rotation($1)', [t1.rotationId]));
      const { rows: after } = await client.query('select sent_at from public.private_hives where id = $1', [
        t1.hiveId,
      ]);
      if (before[0].sent_at && after[0].sent_at && before[0].sent_at.getTime() === after[0].sent_at.getTime()) {
        ok('idempotent: second call on an already-sent rotation is a silent no-op');
      } else {
        bad(
          'idempotent: second call on an already-sent rotation is a silent no-op',
          `before=${before[0].sent_at} after=${after[0].sent_at}`
        );
      }
    }
    // Permission boundary: not grantable to authenticated at all.
    try {
      await asUser(OWNER, () => client.query('select public.seal_and_send_rotation($1)', [t1.rotationId]));
      bad('grant boundary: authenticated cannot call seal_and_send_rotation', 'call succeeded');
    } catch (e) {
      if (/permission denied/i.test(e.message)) {
        ok('grant boundary: authenticated cannot call seal_and_send_rotation');
      } else {
        bad('grant boundary: authenticated cannot call seal_and_send_rotation', `wrong error: ${firstLine(e)}`);
      }
    }

    // ---------------------------------------------------------------
    // 2. Void — quiet: intact roster, zero entries.
    const t2 = await mintRotation({ contributors: [CONTRIBUTOR] });
    await asService(() => client.query('select public.seal_and_send_rotation($1)', [t2.rotationId]));
    {
      const { rows } = await client.query(
        'select sealed_at, sent_at, voided_at, voided_reason from public.comb_rotations where id = $1',
        [t2.rotationId]
      );
      const r = rows[0];
      // comb_rotations.sealed_at stays null on the void path — it's XOR
      // with voided_at on this table (comb_rotations_sealed_xor_voided,
      // 20260830000002), distinct from private_hives/hive_volumes.sealed_at
      // which DO get set (checked separately below).
      if (!r.sealed_at && !r.sent_at && r.voided_at && r.voided_reason === 'quiet') {
        ok('void-quiet: comb_rotations not sealed, not sent, voided_reason = quiet');
      } else {
        bad('void-quiet: comb_rotations not sealed, not sent, voided_reason = quiet', JSON.stringify(r));
      }
    }
    {
      const { rows } = await client.query('select count(*)::int as n from public.hive_volumes where hive_id = $1', [
        t2.hiveId,
      ]);
      if (rows[0].n === 1) {
        ok('void-quiet: no successor volume opened');
      } else {
        bad('void-quiet: no successor volume opened', `got ${rows[0].n}`);
      }
    }
    // private_hives mirror on the void path -- Lumen's finding (thread
    // b57ad406, event 11): the only private_hives.sealed_at read in this
    // gate was the deliver fixture above, so a future refactor that hoists
    // the mirror write into the deliver branch only (plausible -- "aligning"
    // private_hives with comb_rotations.sealed_at's deliberate XOR) would
    // green this gate while lighting COPY-14's detector cell for every
    // contributor of every voided rotation. Asserted separately on all
    // three void fixtures (this one, t4, t5), NOT folded into one row for
    // "the block is shared" -- Vector's finding (event 13): that's true of
    // the migration's TEXT today (one unconditional UPDATE inside the
    // v_void_reason branch, :200-242), but nothing enforces it stays that
    // way. v_void_reason is already computed three lines above the block,
    // so wrapping it in `if v_void_reason <> 'departed'` (etc.) is one `if`
    // away and would leave exactly this row green while silently dropping
    // the mirror for the other two reasons -- proven by mutation, each
    // wrap green except the reason still covered by whichever single
    // fixture asserted it. subject_gone is the reason that actually
    // matters here: departed leaves no active seat, so a contributor
    // hitting compose resolves through COPY-14's seat-closed branch before
    // the sealed check is ever reached -- but subject_gone (t4, t5) leaves
    // contributors ACTIVE (t4's CONTRIBUTOR2 has a written entry), so a
    // dropped mirror there is exactly the "COPY-14 detector cell fires for
    // real" symptom this row exists to catch. sent_at must stay null on
    // every void reason: private_hives_select_as_subject
    // (20260819000001:69-71) is `auth.uid() = subject_profile_id and
    // sent_at is not null` -- no membership term -- so a void that
    // accidentally stamped it would expose a voided month's hive row to
    // the subject it was never sent to; t5 is the sharpest case, a subject
    // who left the comb entirely.
    {
      const { rows } = await client.query('select sealed_at, sent_at from public.private_hives where id = $1', [
        t2.hiveId,
      ]);
      if (rows[0].sealed_at && !rows[0].sent_at) {
        ok('void-quiet: private_hives.sealed_at mirror written, sent_at stays null');
      } else {
        bad('void-quiet: private_hives.sealed_at mirror written, sent_at stays null', JSON.stringify(rows[0]));
      }
    }

    // ---------------------------------------------------------------
    // 3. Void — departed: the only contributor left before close.
    const t3 = await mintRotation({ contributors: [CONTRIBUTOR] });
    await asUser(OWNER, () =>
      client.query('update public.hive_contributors set removed_at = now() where hive_id = $1 and profile_id = $2', [
        t3.hiveId,
        CONTRIBUTOR,
      ])
    );
    await asService(() => client.query('select public.seal_and_send_rotation($1)', [t3.rotationId]));
    {
      const { rows } = await client.query('select voided_reason from public.comb_rotations where id = $1', [
        t3.rotationId,
      ]);
      if (rows[0].voided_reason === 'departed') {
        ok('void-departed: voided_reason = departed when the roster emptied');
      } else {
        bad('void-departed: voided_reason = departed when the roster emptied', JSON.stringify(rows[0]));
      }
    }
    {
      const { rows } = await client.query('select sealed_at, sent_at from public.private_hives where id = $1', [
        t3.hiveId,
      ]);
      if (rows[0].sealed_at && !rows[0].sent_at) {
        ok('void-departed: private_hives.sealed_at mirror written, sent_at stays null');
      } else {
        bad('void-departed: private_hives.sealed_at mirror written, sent_at stays null', JSON.stringify(rows[0]));
      }
    }

    // ---------------------------------------------------------------
    // 4. Void — subject_gone: subject tombstoned, overrides delivery even
    // with a written entry.
    const t4 = await mintRotation({ contributors: [CONTRIBUTOR2] });
    const t4Volume = await volumeIdFor(t4.hiveId);
    await asUser(CONTRIBUTOR2, () =>
      client.query(
        "insert into public.entries (user_id, hive_id, volume_id, content, entry_date) values ($1, $2, $3, 'For Subject', current_date)",
        [CONTRIBUTOR2, t4.hiveId, t4Volume]
      )
    );
    await asPostgres(() =>
      client.query('update public.profiles set display_name = $1, deleted_at = now() where id = $2', ['', SUBJECT])
    );
    await asService(() => client.query('select public.seal_and_send_rotation($1)', [t4.rotationId]));
    {
      const { rows } = await client.query(
        'select sent_at, voided_reason from public.comb_rotations where id = $1',
        [t4.rotationId]
      );
      if (!rows[0].sent_at && rows[0].voided_reason === 'subject_gone') {
        ok('void-subject_gone: tombstoned subject overrides delivery even with an entry present');
      } else {
        bad('void-subject_gone: tombstoned subject overrides delivery even with an entry present', JSON.stringify(rows[0]));
      }
    }
    // The letter itself is preserved (sealed, not deleted) even though
    // nobody will ever receive it — keep-and-disclose's posture, not silent
    // destruction.
    {
      const { rows } = await client.query('select visibility from public.entries where hive_id = $1', [t4.hiveId]);
      if (rows.length === 1 && rows[0].visibility === 'packaged') {
        ok('void-subject_gone: the entry is preserved (sealed), not deleted');
      } else {
        bad('void-subject_gone: the entry is preserved (sealed), not deleted', JSON.stringify(rows));
      }
    }
    // The sharpest fixture for this row: CONTRIBUTOR2 is still an active
    // seat here (nobody removed them), so a dropped mirror is exactly the
    // case where COPY-14's detector cell would fire for a real, present
    // writer -- not the departed case, where no active seat is left to
    // read it.
    {
      const { rows } = await client.query('select sealed_at, sent_at from public.private_hives where id = $1', [
        t4.hiveId,
      ]);
      if (rows[0].sealed_at && !rows[0].sent_at) {
        ok('void-subject_gone (tombstone): private_hives.sealed_at mirror written, sent_at stays null');
      } else {
        bad(
          'void-subject_gone (tombstone): private_hives.sealed_at mirror written, sent_at stays null',
          JSON.stringify(rows[0])
        );
      }
    }

    // ---------------------------------------------------------------
    // 5. Void — subject_gone via comb departure (no profile tombstone).
    // Uses SUBJECT_FOR_COMB_DEPARTURE, not the shared SUBJECT — SUBJECT was
    // permanently tombstoned by test 4 (profiles.deleted_at is immutable),
    // and this test exists specifically to isolate the comb-removal branch
    // of the subject_gone check from the tombstone branch. Reusing SUBJECT
    // here would make it pass for the wrong reason (the already-set
    // deleted_at) regardless of whether the comb_members removal below did
    // anything at all.
    const t5 = await mintRotation({ contributors: [CONTRIBUTOR], subject: SUBJECT_FOR_COMB_DEPARTURE });
    await asPostgres(() =>
      client.query('update public.comb_members set removed_at = now() where comb_id = $1 and profile_id = $2', [
        t5.combId,
        SUBJECT_FOR_COMB_DEPARTURE,
      ])
    );
    await asService(() => client.query('select public.seal_and_send_rotation($1)', [t5.rotationId]));
    {
      const { rows } = await client.query('select voided_reason from public.comb_rotations where id = $1', [
        t5.rotationId,
      ]);
      if (rows[0].voided_reason === 'subject_gone') {
        ok('void-subject_gone: subject removed from the comb (no tombstone) also voids as subject_gone');
      } else {
        bad(
          'void-subject_gone: subject removed from the comb (no tombstone) also voids as subject_gone',
          JSON.stringify(rows[0])
        );
      }
    }
    // sent_at's sharpest fixture: SUBJECT_FOR_COMB_DEPARTURE left the comb
    // entirely. private_hives_select_as_subject has no membership term, so
    // a stray sent_at here would expose a voided month's hive row to
    // someone who is no longer even a comb member -- the exposure Lumen's
    // assertion exists to prevent, on the one fixture that previously
    // never read the column.
    {
      const { rows } = await client.query('select sealed_at, sent_at from public.private_hives where id = $1', [
        t5.hiveId,
      ]);
      if (rows[0].sealed_at && !rows[0].sent_at) {
        ok('void-subject_gone (comb departure): private_hives.sealed_at mirror written, sent_at stays null');
      } else {
        bad(
          'void-subject_gone (comb departure): private_hives.sealed_at mirror written, sent_at stays null',
          JSON.stringify(rows[0])
        );
      }
    }

    // ---------------------------------------------------------------
    // 6. coalesce('A writer') backstop: a blank display_name at seal time
    // (synthetic — the live account-deletion path cannot produce this, see
    // the migration's own citation of Vector's self-correction) must not
    // freeze '' into author_name_at_seal or contributor_names.
    // Uses SUBJECT_INTACT, not the shared SUBJECT — SUBJECT was permanently
    // tombstoned by test 4, which would route this rotation into the
    // void-subject_gone branch instead of deliver and make this assertion
    // untestable (found by running this gate: the deliver-path aggregate
    // never ran, entries stayed 'packaged' not 'sent', contributor_names
    // stayed '{}' — not a bug in the RPC, a confound in the fixture).
    const t6 = await mintRotation({ contributors: [CONTRIBUTOR], subject: SUBJECT_INTACT });
    const t6Volume = await volumeIdFor(t6.hiveId);
    await asUser(CONTRIBUTOR, () =>
      client.query(
        "insert into public.entries (user_id, hive_id, volume_id, content, entry_date) values ($1, $2, $3, 'For Subject', current_date)",
        [CONTRIBUTOR, t6.hiveId, t6Volume]
      )
    );
    await asPostgres(() => client.query("update public.profiles set display_name = '' where id = $1", [CONTRIBUTOR]));
    await asService(() => client.query('select public.seal_and_send_rotation($1)', [t6.rotationId]));
    {
      const { rows } = await client.query('select author_name_at_seal from public.entries where hive_id = $1', [
        t6.hiveId,
      ]);
      const { rows: hiveRows } = await client.query(
        'select contributor_names from public.private_hives where id = $1',
        [t6.hiveId]
      );
      if (
        rows[0]?.author_name_at_seal === 'A writer' &&
        JSON.stringify(hiveRows[0].contributor_names) === JSON.stringify(['A writer'])
      ) {
        ok("coalesce backstop: blank display_name at seal freezes 'A writer', never ''");
      } else {
        bad(
          "coalesce backstop: blank display_name at seal freezes 'A writer', never ''",
          `entry=${JSON.stringify(rows)} hive=${JSON.stringify(hiveRows)}`
        );
      }
    }
    // Restore — CONTRIBUTOR is invited fresh into a new hive in test 7, and
    // hive_contributors_insert_owner's real WITH CHECK (profile_has_display_
    // name, 20260827000001/§61) correctly refuses an empty-display_name
    // invitee. Leaving the blank in place would make test 7 fail on that
    // guard instead of exercising the not-closed-yet gate it's meant to
    // isolate — the same class of confound as tests 5/6's shared SUBJECT,
    // one profile column over.
    await asPostgres(() => client.query("update public.profiles set display_name = 'Contributor' where id = $1", [CONTRIBUTOR]));

    // ---------------------------------------------------------------
    // 7. Not-closed-yet gate: closes_at in the future refuses, no session
    // check involved — time is the only gate.
    const t7 = await mintRotation({ contributors: [CONTRIBUTOR], closesAt: "now() + interval '1 day'" });
    try {
      await asService(() => client.query('select public.seal_and_send_rotation($1)', [t7.rotationId]));
      bad('not-closed-yet: refuses a rotation whose window has not closed', 'call succeeded');
    } catch (e) {
      if (/has not closed yet/.test(e.message)) {
        ok('not-closed-yet: refuses a rotation whose window has not closed');
      } else {
        bad('not-closed-yet: refuses a rotation whose window has not closed', `wrong error: ${firstLine(e)}`);
      }
    }

    // ---------------------------------------------------------------
    // 8. Unknown rotation id.
    try {
      await asService(() =>
        client.query('select public.seal_and_send_rotation($1)', ['99999999-9999-9999-9999-999999999999'])
      );
      bad('unknown rotation: raises rotation not found', 'call succeeded');
    } catch (e) {
      if (/rotation not found/.test(e.message)) {
        ok('unknown rotation: raises rotation not found');
      } else {
        bad('unknown rotation: raises rotation not found', `wrong error: ${firstLine(e)}`);
      }
    }

    console.log(`\ncheck-comb-rotation-seal-send: ${pass} passed, ${failures.length} failed`);
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
  console.error('check-comb-rotation-seal-send: FAILED —', e.message);
  process.exit(1);
});
