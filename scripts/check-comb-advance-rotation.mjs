// Gate for ENG-60's row 1.9a (Fizz,
// supabase/migrations/20260830000011_eng60_comb_advance_rotation.sql) --
// comb_advance_rotation(p_comb_id).
//
//   npm run check:comb-advance-rotation
//
// Per §1B.36.20/.21/.22's final acceptance (POLLINATE_COMB_ROTATION.md, row
// 1.9a — read the migration's own header for the full citation chain), this
// row's ENTIRE acceptance is a 2x2 with one green cell, all three runnable
// at this row's landing via a DIRECT service_role call, sharing ONE base
// recipe (a comb with an already-resolved rotation) and varying exactly one
// axis at a time:
//
//   A: 1 enrollable member, >=1 resolved rotation -> no new row, no raise
//      (the ENROLLABLE FLOOR held, dormancy is silent per §1B.31.3(ii))
//   B: 2 enrollable members, >=1 resolved rotation -> a new row appears
//      (the shared POSITIVE CONTROL for both A and C)
//   C: 2 enrollable members, NO prior resolved rotation -> no new row, no
//      raise (PRE-LAUNCH, per §1B.31.3(i)/§1B.36.21(d) -- a different axis
//      from A, and B is what proves this base COULD have minted)
//
// A and C each differ from B in exactly one variable. Neither negative
// (A, C) substitutes for the other, and neither is meaningful without B --
// without a shared positive control, "no row appeared" is indistinguishable
// from "nothing ran at all" (§1B.36.20(c)). This is deliberately NOT the
// clock-boundary pair (rows 2/3 of §1B.36.11's table) -- those assert the
// floor THROUGH advance_due_rotations() and live on row 1.8 (Bumble's
// OPS-9 finisher), a different boundary and a different claim, per
// §1B.36.19/.20's routing.
//
// The rows 2/3 pair also could not run here even if desired:
// comb_advance_rotation's own deps are 1.1, 1.7a only -- OPS-9's finisher
// is a separate, unbuilt ticket, so there is no tick to assert through yet.
//
// Modeled on check-comb-open-rotation.mjs for the harness shape (embedded
// Postgres, SUPABASE_ENV fixture, asPostgres/asServiceRole/asUser helpers)
// and its exit-code discipline (process.exit(1) directly, not
// process.exitCode).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);

if (process.env.SKIP_PG_GATES === '1') {
  console.log('check-comb-advance-rotation: SKIPPED — SKIP_PG_GATES=1 set explicitly');
  process.exit(0);
}

let EmbeddedPostgres;
try {
  EmbeddedPostgres = require('embedded-postgres').default;
  require('pg');
} catch (e) {
  console.error(
    `check-comb-advance-rotation: FAILED — embedded-postgres/pg not installed (${e.message.split('\n')[0]}).\n` +
      '  Run `npm install` (both are devDependencies), or set SKIP_PG_GATES=1 to skip deliberately\n' +
      '  on a machine that genuinely cannot run a local Postgres.'
  );
  process.exit(1);
}

const APPLY = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();

const OWNER_A = '11111111-1111-1111-1111-111111111111';
const MEMBER_X = '22222222-2222-2222-2222-222222222222'; // comb A: removed after seeding the base
const OWNER_B = '33333333-3333-3333-3333-333333333333';
const MEMBER_Y = '44444444-4444-4444-4444-444444444444'; // comb B: stays enrollable
const OWNER_C = '55555555-5555-5555-5555-555555555555';
const MEMBER_Z = '66666666-6666-6666-6666-666666666666'; // comb C: stays enrollable, no prior rotation

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
  const dataDir = path.join(ROOT, '.comb-advance-rotation-pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    // Distinct from every other gate's port (54329-54339).
    port: 54340,
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
        ($1, $2), ($3, $4), ($5, $6), ($7, $8), ($9, $10), ($11, $12)`,
      [
        OWNER_A, JSON.stringify({ display_name: 'Owner A' }),
        MEMBER_X, JSON.stringify({ display_name: 'X' }),
        OWNER_B, JSON.stringify({ display_name: 'Owner B' }),
        MEMBER_Y, JSON.stringify({ display_name: 'Y' }),
        OWNER_C, JSON.stringify({ display_name: 'Owner C' }),
        MEMBER_Z, JSON.stringify({ display_name: 'Z' }),
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

    const rotationCount = async (combId) => {
      const { rows } = await asPostgres(() =>
        client.query('select count(*)::int as n from public.comb_rotations where comb_id = $1', [combId])
      );
      return rows[0].n;
    };

    // =================================================================
    // Base setup for A and B: a comb with TWO enrollable members at mint
    // time (so the initial mint clears ENG-100's own roster floor), an
    // initial rotation minted and then marked RESOLVED directly (voided_at
    // set, bypassing seal_and_send_rotation's own machinery -- this gate
    // only needs "resolved," not a specific resolution path). A then
    // removes its second member to bring the count down to one; B leaves
    // both members enrollable. This is the "share one base, vary one
    // axis" fixture Lumen's ratified requirement demands (§1B.36.21(a)).
    // =================================================================

    const { rows: combARows } = await asUser(OWNER_A, () =>
      client.query("insert into public.combs (owner_id, name) values ($1, 'Comb A') returning id", [OWNER_A])
    );
    const combA = combARows[0].id;
    await asPostgres(() =>
      client.query('insert into public.comb_members (comb_id, profile_id) values ($1, $2)', [combA, MEMBER_X])
    );
    const { rows: rotAInit } = await asUser(OWNER_A, () =>
      client.query('select public.comb_open_rotation($1, $2, now() + interval \'30 days\') as id', [
        combA,
        OWNER_A,
      ])
    );
    await asPostgres(() =>
      client.query('update public.comb_rotations set voided_at = now(), voided_reason = $2 where id = $1', [
        rotAInit[0].id,
        'quiet',
      ])
    );
    // Now bring comb A down to ONE enrollable member (just the owner).
    await asPostgres(() =>
      client.query('update public.comb_members set removed_at = now() where comb_id = $1 and profile_id = $2', [
        combA,
        MEMBER_X,
      ])
    );

    const { rows: combBRows } = await asUser(OWNER_B, () =>
      client.query("insert into public.combs (owner_id, name) values ($1, 'Comb B') returning id", [OWNER_B])
    );
    const combB = combBRows[0].id;
    await asPostgres(() =>
      client.query('insert into public.comb_members (comb_id, profile_id) values ($1, $2)', [combB, MEMBER_Y])
    );
    const { rows: rotBInit } = await asUser(OWNER_B, () =>
      client.query('select public.comb_open_rotation($1, $2, now() + interval \'30 days\') as id', [
        combB,
        OWNER_B,
      ])
    );
    await asPostgres(() =>
      client.query('update public.comb_rotations set voided_at = now(), voided_reason = $2 where id = $1', [
        rotBInit[0].id,
        'quiet',
      ])
    );
    // Comb B: MEMBER_Y stays enrollable -- two enrollable members total.

    const { rows: combCRows } = await asUser(OWNER_C, () =>
      client.query("insert into public.combs (owner_id, name) values ($1, 'Comb C') returning id", [OWNER_C])
    );
    const combC = combCRows[0].id;
    await asPostgres(() =>
      client.query('insert into public.comb_members (comb_id, profile_id) values ($1, $2)', [combC, MEMBER_Z])
    );
    // Comb C: two enrollable members, but NO comb_rotations row minted at
    // all -- pre-launch, never touched comb_open_rotation.

    // ---------------------------------------------------------------
    // A: 1 enrollable, >=1 resolved rotation -> the ENROLLABLE FLOOR
    // holds. No new row, no raise, dormancy is silent.
    {
      const before = await rotationCount(combA);
      try {
        const { rows } = await asServiceRole(() =>
          client.query('select public.comb_advance_rotation($1) as id', [combA])
        );
        const after = await rotationCount(combA);
        if (rows[0].id === null && after === before) {
          ok('A: 1 enrollable member, resolved base — floor holds, returns null, no new row');
        } else {
          bad(
            'A: 1 enrollable member, resolved base — floor holds, returns null, no new row',
            `returned id=${rows[0].id}, rotation count ${before} -> ${after}`
          );
        }
      } catch (e) {
        bad('A: 1 enrollable member, resolved base — floor holds, returns null, no new row', `raised: ${e.message}`);
      }
    }

    // ---------------------------------------------------------------
    // B: 2 enrollable, >=1 resolved rotation -> the shared POSITIVE
    // CONTROL. A new row appears, non-null id returned.
    {
      const before = await rotationCount(combB);
      try {
        const { rows } = await asServiceRole(() =>
          client.query('select public.comb_advance_rotation($1) as id', [combB])
        );
        const after = await rotationCount(combB);
        if (rows[0].id !== null && after === before + 1) {
          ok('B: 2 enrollable members, resolved base — new rotation minted (positive control)');
        } else {
          bad(
            'B: 2 enrollable members, resolved base — new rotation minted (positive control)',
            `returned id=${rows[0].id}, rotation count ${before} -> ${after}`
          );
        }
      } catch (e) {
        bad('B: 2 enrollable members, resolved base — new rotation minted (positive control)', `raised: ${e.message}`);
      }
    }

    // ---------------------------------------------------------------
    // Cross-check on B: the new rotation's subject is the OTHER
    // enrollable member (MEMBER_Y), not the organizer again — proves the
    // walk actually advanced past the initial subject (OWNER_B) rather
    // than trivially re-minting for whoever happened to be passed in.
    {
      const { rows } = await asPostgres(() =>
        client.query(
          'select subject_profile_id from public.comb_rotations where comb_id = $1 and voided_at is null and sealed_at is null',
          [combB]
        )
      );
      if (rows.length === 1 && rows[0].subject_profile_id === MEMBER_Y) {
        ok('B: the derived next subject is the OTHER enrollable member, not a re-mint of the same subject');
      } else {
        bad(
          'B: the derived next subject is the OTHER enrollable member, not a re-mint of the same subject',
          `got ${JSON.stringify(rows)}`
        );
      }
    }

    // ---------------------------------------------------------------
    // Roster snapshot on B's ADVANCED rotation (DoD clause 8's actual
    // claim): this row's own header cites check-comb-open-rotation.mjs for
    // the roster-snapshot shape but, until now, nothing had ever asserted
    // that comb_advance_rotation's call into comb_open_rotation actually
    // carries it — every prior assertion here stops at comb_rotations
    // (row count, subject_profile_id). §1B.38.19's "month 2's hive arrives
    // on the same shelf by the same mechanism" is a claim about
    // hive_contributors, and hive_contributors is untouched by this file
    // above this point. Two things a subject-only check cannot catch: the
    // roster snapshot silently landing empty (would raise, not silently
    // pass — but an empty catch here would still not prove the POSITIVE
    // case), or landing on the WRONG hive (e.g. the advance re-using B's
    // first hive_id instead of minting a second one, which would still
    // pass every assertion above since none of them read hive_id at all).
    {
      const { rows: month1Rows } = await asPostgres(() =>
        client.query('select hive_id from public.comb_rotations where id = $1', [rotBInit[0].id])
      );
      const month1HiveId = month1Rows[0].hive_id;

      const { rows } = await asPostgres(() =>
        client.query(
          `select r.id, r.hive_id from public.comb_rotations r
           where r.comb_id = $1 and r.voided_at is null and r.sealed_at is null`,
          [combB]
        )
      );
      const advancedHiveId = rows[0]?.hive_id;
      if (rows.length === 1 && advancedHiveId && advancedHiveId !== month1HiveId) {
        ok('B: the advanced rotation points at a NEW hive, not a re-use of month 1\'s');
      } else {
        bad(
          'B: the advanced rotation points at a NEW hive, not a re-use of month 1\'s',
          `advanced hive=${advancedHiveId}, month-1 hive=${month1HiveId}`
        );
      }

      const { rows: contribRows } = await asPostgres(() =>
        client.query('select profile_id from public.hive_contributors where hive_id = $1 order by profile_id', [
          advancedHiveId,
        ])
      );
      const seated = contribRows.map((r) => r.profile_id).sort();
      const expected = [OWNER_B].sort();
      if (JSON.stringify(seated) === JSON.stringify(expected)) {
        ok('B: the advanced rotation\'s hive seats the OTHER enrollable member (previous subject) as its contributor');
      } else {
        bad(
          'B: the advanced rotation\'s hive seats the OTHER enrollable member (previous subject) as its contributor',
          `seated=${JSON.stringify(seated)}, expected=${JSON.stringify(expected)}`
        );
      }
    }

    // ---------------------------------------------------------------
    // C: 2 enrollable, NO prior resolved rotation -> PRE-LAUNCH. No new
    // row, no raise — differs from A on the OTHER axis (enrollable count
    // is fine here; it's the missing resolved rotation that refuses).
    {
      const before = await rotationCount(combC);
      try {
        const { rows } = await asServiceRole(() =>
          client.query('select public.comb_advance_rotation($1) as id', [combC])
        );
        const after = await rotationCount(combC);
        if (rows[0].id === null && after === before && before === 0) {
          ok('C: 2 enrollable members, NO prior rotation — pre-launch, returns null, no row minted');
        } else {
          bad(
            'C: 2 enrollable members, NO prior rotation — pre-launch, returns null, no row minted',
            `returned id=${rows[0].id}, rotation count ${before} -> ${after}`
          );
        }
      } catch (e) {
        bad('C: 2 enrollable members, NO prior rotation — pre-launch, returns null, no row minted', `raised: ${e.message}`);
      }
    }

    // ---------------------------------------------------------------
    // Grant surface: neither anon nor an authenticated caller (even the
    // comb's own owner) can reach this function — service_role only,
    // §1B.31.2's ratified grant pin.
    {
      try {
        await asAnon(() => client.query('select public.comb_advance_rotation($1)', [combB]));
        bad('grants: anon is refused, 42501', 'call succeeded');
      } catch (e) {
        if (e.code === '42501') {
          ok('grants: anon is refused, 42501');
        } else {
          bad('grants: anon is refused, 42501', `got ${e.code}: ${e.message}`);
        }
      }
    }
    {
      try {
        await asUser(OWNER_B, () => client.query('select public.comb_advance_rotation($1)', [combB]));
        bad('grants: an authenticated caller (even the comb owner) is refused, 42501', 'call succeeded');
      } catch (e) {
        if (e.code === '42501') {
          ok('grants: an authenticated caller (even the comb owner) is refused, 42501');
        } else {
          bad('grants: an authenticated caller (even the comb owner) is refused, 42501', `got ${e.code}: ${e.message}`);
        }
      }
    }

    console.log(`\ncheck-comb-advance-rotation: ${pass} passed, ${failures.length} failed`);
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
  console.error('check-comb-advance-rotation: FAILED —', e.message);
  process.exit(1);
});
