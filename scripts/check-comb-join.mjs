// Gate for ENG-59's join-by-invite RPC
// (supabase/migrations/20260830000004_eng59_comb_join_by_invite.sql).
//
//   npm run check:comb-join
//
// Proves the ruled shape (thread b57ad406, 2026-08-30 — see the migration's
// own header): possession of the invite code is the only authorization,
// a tap on your own comb's link is idempotent, a previously-removed member
// cannot silently re-join, and the RPC is authenticated-only — the
// anon-callable invite-landing PREVIEW is a separate function, held pending
// Deezine/Lumen (not built or gated here).
//
// Modeled on check-comb-rotation-seal-send.mjs for the harness shape, minus
// the rotation/hive plumbing this ticket doesn't touch. Uses process.exit(1)
// directly rather than process.exitCode = 1 — Vector's finding (thread
// b57ad406, 2026-08-30) is that embedded-postgres's async-exit-hook
// discards a pending exitCode at the natural `beforeExit` point, so a gate
// that loads embedded-postgres and only sets exitCode can print failures and
// still exit 0. Writing this gate correctly from the start rather than
// joining the five now being fixed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);

if (process.env.SKIP_PG_GATES === '1') {
  console.log('check-comb-join: SKIPPED — SKIP_PG_GATES=1 set explicitly');
  process.exit(0);
}

let EmbeddedPostgres;
try {
  EmbeddedPostgres = require('embedded-postgres').default;
  require('pg');
} catch (e) {
  console.error(
    `check-comb-join: FAILED — embedded-postgres/pg not installed (${e.message.split('\n')[0]}).\n` +
      '  Run `npm install` (both are devDependencies), or set SKIP_PG_GATES=1 to skip deliberately\n' +
      '  on a machine that genuinely cannot run a local Postgres.'
  );
  process.exit(1);
}

const APPLY = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();

const OWNER = '11111111-1111-1111-1111-111111111111';
const JOINER = '22222222-2222-2222-2222-222222222222';
const REMOVED = '33333333-3333-3333-3333-333333333333';
const STRANGER = '44444444-4444-4444-4444-444444444444';
const SIXTH = '55555555-5555-5555-5555-555555555555';

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
  const dataDir = path.join(ROOT, '.comb-join-pgdata');
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
      'insert into auth.users (id, raw_user_meta_data) values ($1, $2), ($3, $4), ($5, $6), ($7, $8), ($9, $10)',
      [
        OWNER, JSON.stringify({ display_name: 'Owner' }),
        JOINER, JSON.stringify({ display_name: 'Joiner' }),
        REMOVED, JSON.stringify({ display_name: 'Removed' }),
        STRANGER, JSON.stringify({ display_name: 'Stranger' }),
        SIXTH, JSON.stringify({ display_name: 'Sixth' }),
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
      client.query("insert into public.combs (owner_id, name) values ($1, 'Test Comb') returning id, invite_code", [
        OWNER,
      ])
    );
    const comb = combRows[0];

    // Seed a member who's already been removed — REMOVED never joins
    // through the RPC (unrepresentable once removed), so the fixture
    // inserts and then removes them directly.
    await asPostgres(() =>
      client.query('insert into public.comb_members (comb_id, profile_id) values ($1, $2)', [comb.id, REMOVED])
    );
    await asPostgres(() =>
      client.query('update public.comb_members set removed_at = now() where comb_id = $1 and profile_id = $2', [
        comb.id,
        REMOVED,
      ])
    );

    // ---------------------------------------------------------------
    // 1. Fresh join: valid invite code, first tap.
    {
      const { rows } = await asUser(JOINER, () =>
        client.query('select public.comb_join_by_invite_code($1) as comb_id', [comb.invite_code])
      );
      if (rows[0].comb_id === comb.id) {
        ok('fresh join: returns the comb id for a valid invite code');
      } else {
        bad('fresh join: returns the comb id for a valid invite code', JSON.stringify(rows[0]));
      }
    }
    {
      const { rows } = await asPostgres(() =>
        client.query('select removed_at from public.comb_members where comb_id = $1 and profile_id = $2', [
          comb.id,
          JOINER,
        ])
      );
      if (rows.length === 1 && rows[0].removed_at === null) {
        ok('fresh join: comb_members row created, active');
      } else {
        bad('fresh join: comb_members row created, active', JSON.stringify(rows));
      }
    }
    // The join is immediately visible to the joiner's own later reads via
    // the existing RLS policies — not a stale-read gap.
    {
      const { rows } = await asUser(JOINER, () => client.query('select id from public.combs where id = $1', [comb.id]));
      if (rows.length === 1) {
        ok('fresh join: joiner can read the comb via combs_select_own/is_comb_member immediately after');
      } else {
        bad('fresh join: joiner can read the comb via combs_select_own/is_comb_member immediately after', JSON.stringify(rows));
      }
    }

    // ---------------------------------------------------------------
    // 2. Idempotent re-tap: an already-active member calling again is a
    // silent success, not an error, and does not duplicate the row.
    {
      const { rows } = await asUser(JOINER, () =>
        client.query('select public.comb_join_by_invite_code($1) as comb_id', [comb.invite_code])
      );
      if (rows[0].comb_id === comb.id) {
        ok('idempotent re-tap: second join call on an already-active member succeeds, same comb id');
      } else {
        bad('idempotent re-tap: second join call on an already-active member succeeds, same comb id', JSON.stringify(rows[0]));
      }
    }
    {
      const { rows } = await asPostgres(() =>
        client.query('select count(*)::int as n from public.comb_members where comb_id = $1 and profile_id = $2', [
          comb.id,
          JOINER,
        ])
      );
      if (rows[0].n === 1) {
        ok('idempotent re-tap: no duplicate comb_members row');
      } else {
        bad('idempotent re-tap: no duplicate comb_members row', `got ${rows[0].n}`);
      }
    }

    // ---------------------------------------------------------------
    // 3. Owner tapping their own comb's link — also idempotent (auto-seated
    // at creation by combs_create_owner_membership).
    {
      const { rows } = await asUser(OWNER, () =>
        client.query('select public.comb_join_by_invite_code($1) as comb_id', [comb.invite_code])
      );
      if (rows[0].comb_id === comb.id) {
        ok('owner re-tap: owner tapping their own invite link is a no-op success');
      } else {
        bad('owner re-tap: owner tapping their own invite link is a no-op success', JSON.stringify(rows[0]));
      }
    }

    // ---------------------------------------------------------------
    // 4. Previously-removed member: unrepresentable re-join, named refusal
    // rather than a generic unique-violation.
    try {
      await asUser(REMOVED, () => client.query('select public.comb_join_by_invite_code($1)', [comb.invite_code]));
      bad('removed member: refuses re-join with a named exception', 'call succeeded');
    } catch (e) {
      if (/previously removed from this comb/.test(e.message)) {
        ok('removed member: refuses re-join with a named exception');
      } else {
        bad('removed member: refuses re-join with a named exception', `wrong error: ${firstLine(e)}`);
      }
    }
    {
      const { rows } = await asPostgres(() =>
        client.query('select removed_at from public.comb_members where comb_id = $1 and profile_id = $2', [
          comb.id,
          REMOVED,
        ])
      );
      if (rows.length === 1 && rows[0].removed_at !== null) {
        ok('removed member: removed_at untouched by the refused attempt (no update, no second row)');
      } else {
        bad('removed member: removed_at untouched by the refused attempt (no update, no second row)', JSON.stringify(rows));
      }
    }

    // ---------------------------------------------------------------
    // 5. Invalid invite code.
    try {
      await asUser(STRANGER, () => client.query('select public.comb_join_by_invite_code($1)', ['not-a-real-code']));
      bad('invalid code: refuses an unknown invite code', 'call succeeded');
    } catch (e) {
      if (/invalid invite code/.test(e.message)) {
        ok('invalid code: refuses an unknown invite code');
      } else {
        bad('invalid code: refuses an unknown invite code', `wrong error: ${firstLine(e)}`);
      }
    }

    // ---------------------------------------------------------------
    // 6. Grant boundary: anon cannot call it at all. The anon-callable
    // invite-landing preview is a different, not-yet-built function — this
    // RPC (the one that actually seats a member) stays authenticated-only
    // regardless of how that separate question resolves.
    try {
      await asAnon(() => client.query('select public.comb_join_by_invite_code($1)', [comb.invite_code]));
      bad('grant boundary: anon cannot call comb_join_by_invite_code', 'call succeeded');
    } catch (e) {
      if (/permission denied/i.test(e.message)) {
        ok('grant boundary: anon cannot call comb_join_by_invite_code');
      } else {
        bad('grant boundary: anon cannot call comb_join_by_invite_code', `wrong error: ${firstLine(e)}`);
      }
    }

    // ---------------------------------------------------------------
    // 7. No cap enforcement: ENG-85 (the free-tier-5 cap) is unbuilt and
    // disabled per §8.5 — a comb growing past 5 members (owner + 4 already
    // seated by this point: JOINER, and now a 6th) must succeed today. This
    // documents current behaviour, not a product decision made here — if
    // ENG-85 ships a cap, this row is the one that should go red and get
    // updated, not silently keep passing.
    {
      const { rows } = await asUser(SIXTH, () =>
        client.query('select public.comb_join_by_invite_code($1) as comb_id', [comb.invite_code])
      );
      if (rows[0].comb_id === comb.id) {
        ok('no cap: joining past 5 members succeeds — ENG-85 is unbuilt, per §8.5');
      } else {
        bad('no cap: joining past 5 members succeeds — ENG-85 is unbuilt, per §8.5', JSON.stringify(rows[0]));
      }
    }

    console.log(`\ncheck-comb-join: ${pass} passed, ${failures.length} failed`);
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
  console.error('check-comb-join: FAILED —', e.message);
  process.exit(1);
});
