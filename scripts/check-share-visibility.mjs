// The whole-schema gate: does a share still reach the hive it was published to?
//
//   npm run check:share-visibility
//
// Every other check-*.mjs gate in this repo verifies one migration. This one
// verifies the SCHEMA — the state you get after applying everything in
// supabase/migrations, in the order Supabase applies it — against the two
// things the app's own share path has to keep being true:
//
//   1. an accepted connection can read what you shared
//   2. nobody else can
//
// Privacy suites get written almost entirely out of rule 2, which is how a
// change that over-blocks ships green (Sage, thread 19e90cf8, 2026-08-13).
// Rule 1 is the assertion that catches it, and it is the reason this file
// exists.
//
// WHY THIS GATE GLOBS WHERE THE OTHERS LIST
//
// check-hive-state-rls.mjs and check-seeds-rls.mjs name their migrations
// explicitly, so an unrelated new migration can't silently change what they
// test. That is right for a gate scoped to one feature. It is exactly wrong
// here: a new migration IS the thing that can break a share round-trip, and
// a listed set would keep passing while the file that broke it sat one
// directory over, unapplied. So this globs *.sql in filename order and
// tests whatever is actually on disk.
//
// The concrete case that motivated it: a `visibility` column plus an
// `as restrictive` SELECT policy on `entries` (P0-2). Both are correct in
// isolation — Postgres ORs permissive policies, so a `visibility` check
// written permissively can only widen access and enforces nothing; the
// keyword is required. But `shareEntry` never writes the column, so every
// share made after that deploy lands 'private' and is invisible to the
// honeycomb it was published to. No error is raised anywhere: the insert
// succeeds, the author's UI says shared, and the hive sees nothing. The
// rule the two halves add up to — a column that gates reads gets its writer
// in the same migration that creates it — is not checkable from a schema
// diff. It is checkable by sharing an entry and reading it back, which is
// all this file does.
//
// Requires `embedded-postgres` and `pg` — both are devDependencies, so
// `npm install` fetches them on any normal checkout, and a missing install
// FAILS this gate rather than skipping it. Set SKIP_PG_GATES=1 to opt out
// deliberately on a machine that genuinely cannot run a local Postgres;
// that has to be a flag, never a default.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
// The expected-grant table lives in lib/ so the manual prod probe can read it
// without this file's embedded-Postgres boot; see that module's header.
import { DEFINER_GRANTS } from './lib/definer-grants.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);

if (process.env.SKIP_PG_GATES === '1') {
  console.log('check-share-visibility: SKIPPED — SKIP_PG_GATES=1 set explicitly');
  process.exit(0);
}

let EmbeddedPostgres;
try {
  EmbeddedPostgres = require('embedded-postgres').default;
  require('pg');
} catch (e) {
  console.error(
    `check-share-visibility: FAILED — embedded-postgres/pg not installed (${e.message.split('\n')[0]}).\n` +
      '  Run `npm install` (both are devDependencies), or set SKIP_PG_GATES=1 to skip deliberately\n' +
      '  on a machine that genuinely cannot run a local Postgres.'
  );
  process.exit(1);
}

const ALICE = '11111111-1111-1111-1111-111111111111'; // the author
const BOB = '22222222-2222-2222-2222-222222222222'; // accepted connection
const CAROL = '33333333-3333-3333-3333-333333333333'; // connected to Alice, not the send's recipient
const MALLORY = '44444444-4444-4444-4444-444444444444'; // no connection at all

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

// Same Supabase-shaped environment as the other PG gates, plus a `storage`
// shim: 20260809000001_avatar_storage.sql references storage.objects and
// storage.foldername(), which don't exist outside Supabase. The listed
// gates never hit it because they never apply that file; a glob does.
const SUPABASE_ENV = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant anon, authenticated, service_role to postgres;
  create schema auth;
  create table auth.users (id uuid primary key, raw_user_meta_data jsonb, email text);
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
  const dataDir = path.join(ROOT, '.share-visibility-pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    port: 54331, // seeds-rls 54329, hive-state 54330; distinct so gates can run concurrently
    persistent: false,
  });

  await pg.initialise();
  await pg.start();
  await pg.createDatabase('app');
  const client = pg.getPgClient('app');
  await client.connect();

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
  const readAs = (uid, sql, params = []) =>
    asUser(uid, () => client.query(sql, params)).then((r) => r.rows);

  console.log(`\n${(await client.query('select version()')).rows[0].version.split(',')[0]}\n`);
  await client.query(SUPABASE_ENV);

  // --- The whole schema, off disk, in the order Supabase applies it ----------
  const files = fs
    .readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  if (files.length === 0) {
    console.error('check-share-visibility: FAILED — no migrations found in supabase/migrations');
    process.exit(1);
  }
  for (const file of files) {
    try {
      await client.query(fs.readFileSync(path.join(MIGRATIONS, file), 'utf8'));
    } catch (e) {
      console.error(`\ncheck-share-visibility: MIGRATION FAILED — ${file}\n  ${e.message}\n`);
      await client.end();
      await pg.stop();
      process.exit(1);
    }
  }
  console.log(`  applied ${files.length} migrations, ${files[0]} … ${files[files.length - 1]}`);

  // --- Structural invariants, read off the catalog ---------------------------
  // These hold for whatever tables and functions exist, so a new migration
  // is covered the day it lands rather than the day someone writes its gate.
  console.log('\n  schema-wide');

  // 'p' as well as 'r': a partitioned parent is relkind 'p'. Its leaves are
  // 'r' and would be caught anyway (verified — a partitioned table with no RLS
  // fails this check via its leaf), but policies live on the parent, so the
  // parent is the object that should carry the flag.
  const tables = (
    await client.query(`
      select c.relname, c.relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p')
      order by 1
    `)
  ).rows;
  const rlsOff = tables.filter((t) => !t.relrowsecurity).map((t) => t.relname);
  // A completeness assertion that passes over an empty universe asserts
  // nothing. Same guard as the SECURITY DEFINER count below.
  if (tables.length === 0) {
    bad('every table in `public` has RLS enabled', 'enumerated 0 tables — the query is wrong, or the migrations did not build a schema');
  } else if (rlsOff.length === 0) {
    ok(`every table in \`public\` has row level security enabled (${tables.length} checked)`);
  } else {
    bad('every table in `public` has RLS enabled', `RLS is OFF on: ${rlsOff.join(', ')}`);
  }

  // RLS is a property of tables, and a view is not a table. A view runs with
  // the privileges of its OWNER unless it is declared `security_invoker`, so
  // an ordinary view over `entries` hands every row to anyone granted SELECT
  // on the view — the underlying policies are never consulted. Measured, not
  // assumed: an unconnected user reads another user's private journal entry
  // straight through such a view, while the RLS assertion above still passes,
  // because the view is relkind 'v' and was never in its universe.
  //
  // There are no views in `public` today. This is here so that the first one
  // has to declare itself, rather than arriving green — the same reason the
  // SECURITY DEFINER check exists.
  const leakyViews = (
    await client.query(`
      select c.relname, c.relkind,
        coalesce((select option_value from pg_options_to_table(c.reloptions)
                  where option_name = 'security_invoker'), 'unset') as security_invoker
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and (c.relkind = 'm'
             or (c.relkind = 'v'
                 and coalesce((select option_value from pg_options_to_table(c.reloptions)
                               where option_name = 'security_invoker'), 'false') <> 'true'))
      order by 1
    `)
  ).rows;
  if (leakyViews.length === 0) {
    ok('no view in `public` bypasses RLS (every view is `security_invoker`, and there are no materialized views)');
  } else {
    bad(
      'no view in `public` bypasses RLS',
      leakyViews
        .map((v) =>
          v.relkind === 'm'
            ? `${v.relname} is a MATERIALIZED view — it stores its own copy of the rows and has no security_invoker option, so RLS on the source table cannot apply to reads of it at all`
            : `${v.relname} is a view with security_invoker=${v.security_invoker} — it runs as its owner, so the policies on its source tables are never consulted; add \`with (security_invoker = true)\``
        )
        .join('; ')
    );
  }

  // `revoke ... from public` does not reach anon: anon holds its own grant
  // from ALTER DEFAULT PRIVILEGES, so it has to be revoked by name. Asserted
  // against has_function_privilege rather than inferred from a call, because
  // a function that errors for an unrelated reason looks identical to one
  // that refused.
  //
  // NAMED EXCEPTION (Sage, thread d1783906, 2026-08-29, ruling on
  // 20260829000001 and 20260829000002). `language sql stable` functions are
  // inlined at query-rewrite time, so Postgres checks EXECUTE on every
  // REFERENCE to the function — including one buried in an RLS policy an
  // anon query never matches a row for — not just on ones that run. Any
  // anon request that merely touches a table whose policy chain reaches one
  // of these three 500s with 42501 instead of the normal empty/denied
  // result, which is why the two migrations above re-grant them. That
  // forces a real choice between "anon requests 500" and "these three are
  // anon-executable"; a blanket revoke cannot have both.
  //
  // The three are NOT interchangeable and were argued separately, not as a
  // group, despite 20260829000001's comment treating its two as one case:
  //
  //   is_hive_contributor(uuid) — `c.profile_id = auth.uid()` is one of
  //   three ANDed clauses in the function body (alongside the hive_id match
  //   and `removed_at is null`), but it is the one doing identity-gating
  //   directly, not an incidental side effect of an unrelated clause.
  //   auth.uid() is null for anon by Supabase Auth's own contract (a
  //   platform invariant, not a fact this function's body has to keep
  //   proving), so `c.profile_id = auth.uid()` evaluates to NULL — never
  //   TRUE — for every hive_id anon could supply, and AND with a
  //   NULL/false clause never becomes TRUE regardless of what the other two
  //   clauses do. This is NOT the same shape as find_connectable_profile's
  //   near-miss (20260813000005): there, auth.uid()-is-null silenced the
  //   result as a side effect of an unrelated self-exclusion clause, and
  //   deleting that one clause turned the same body into an
  //   account-existence oracle. Here, only removing or altering the
  //   auth.uid() clause itself could break the safety argument — removing
  //   either of the other two leaves it standing.
  //
  //   owns_entry(uuid) — same shape as is_hive_contributor, argued the same
  //   way: `e.user_id = auth.uid()` is one of three ANDed clauses
  //   (alongside the entry-id match and `hive_id is null`), and it is the
  //   identity-gating one, never TRUE for anon regardless of the other two.
  //   This is the SAME function 20260813000005 already revoked anon
  //   EXECUTE from — that revoke was correct for the problem it was
  //   solving (closing a widened SELECT/UPDATE surface), but it created
  //   this exact inlining failure mode two weeks early:
  //   shares_insert_own's WITH CHECK calls owns_entry(entry_id)
  //   (20260809000004), the `shares` table carries the same
  //   grant-all-to-anon default every table gets (20260808000001), and no
  //   test in this suite had ever driven an anon INSERT against `shares`
  //   to notice. Live-verified (Sage, thread d1783906, 2026-08-29): before
  //   20260829000002, an anon INSERT into `shares` against a real entry_id
  //   42501s with "permission denied for function owns_entry" instead of
  //   the RLS-shaped denial every other anon write in this schema
  //   produces. 20260829000002 re-grants EXECUTE the same way as the other
  //   two — false always for anon, not newly-reachable data.
  //
  //   is_volume_open(uuid) — does not reference auth.uid() at all, by
  //   design (its own comment: it must "answer the same regardless of the
  //   caller's current standing on the roster", for the removed-contributor-
  //   deletes-own-work case). That makes it a caller-independent oracle:
  //   once EXECUTE exists for a role, that role can call
  //   `rpc/is_volume_open` DIRECTLY, not just trigger it via inlining, and
  //   learn whether any guessed/enumerated hive_volumes.id is currently
  //   sealed — a fact `hive_volumes_select_own` otherwise restricts to the
  //   hive's owner or an active contributor. This is not a new hole this
  //   migration opens: `grant execute ... to authenticated` already made
  //   every signed-in account able to do this (20260827000001), regardless
  //   of hive membership. 20260829000001's actual, sole effect on
  //   is_volume_open is removing the "must hold a signed-in session" cost
  //   from that pre-existing oracle, down to "holds the anon key shipped in
  //   the app bundle." Accepted here as a low-severity widening of an
  //   already-accepted gap, not a new one — but it is NOT covered by the
  //   "auth.uid() is null" argument the migration cites, which is is_hive_
  //   contributor's (and owns_entry's) argument, not this function's.
  //   Follow-up, not tonight's blocker: consider relocating
  //   anon-necessary-but-RPC-undesirable definer helpers like this one to a
  //   schema PostgREST does not expose, which would close the oracle for
  //   authenticated AND anon at once without touching the inlining fix.
  //
  //   comb_preview_by_invite_code(text) — anon-callable BY DESIGN, not an
  //   inlining leak like the three above: this is DES-37's pre-auth invite
  //   landing, and the whole point is that a stranger holding a link (no
  //   session at all) can resolve headline/subject/count before signing in.
  //   The oracle-shape argument the other three entries make ("once EXECUTE
  //   exists, any caller can enumerate/probe") does not transfer cleanly
  //   here because the input space isn't small-integer-enumerable: the
  //   function's sole authorization input is invite_code, a 32-hex-char
  //   gen_random_uuid() value (122 random bits, ENG-58 migration :150) — the
  //   same entropy floor ENG-59's join RPC relies on for the identical
  //   argument. An invalid or guessed code returns the same zero-row shape
  //   as a revoked one would (Lumen's boundary note, thread b57ad406,
  //   2026-08-30 16:15:36; enforced by check-comb-preview.mjs #3/#4), so
  //   there is no distinguishing signal to extract even at scale. The
  //   function's body also never references entries (check-comb-preview.mjs
  //   #6, grepped directly) — membership count and names only, nothing
  //   write-status-shaped for an unauthenticated caller to learn.
  //
  // A fifth function landing in this set without its own argument in this
  // comment is exactly the failure mode a blanket accept would produce —
  // this list is a name check, not a count check, and stays exactly four
  // until someone adds a paragraph above to go with a fifth.
  //
  // OPS-11 (Vector, thread b57ad406, 2026-08-30): the four paragraphs above
  // are the anon half of a bigger question. `authenticated` has no catalog
  // assertion anywhere — where it's covered at all it's covered per
  // function, in that function's own gate — and a one-directional "anon
  // can't exceed this set" check catches a widened grant but not a LOST
  // one; a security argument built on a revoke (like the four above) needs
  // an assertion that fails if the revoke silently disappears. Measured on
  // this same catalog (20260813000005's header): every future SECURITY
  // DEFINER function is born with EXECUTE already granted to
  // anon/authenticated/service_role via Supabase's own platform-level
  // `alter default privileges`, which runs outside this repo's migrations —
  // so a function that never got an explicit revoke is not "ungranted",
  // it's silently open, and the only way to know is to ask the catalog.
  //
  // The expected-grant table itself moved to lib/definer-grants.mjs so the
  // manual prod probe (scripts/prod-anon-definer-check.mjs) can read the same
  // rows without importing this file's embedded-Postgres boot. Its header
  // carries the argument-name reasoning and the one row that is deliberately
  // not probeable from outside.
  const CHECKED_ROLES = ['anon', 'authenticated', 'service_role'];
  const definerRows = (
    await client.query(`
      select p.oid::regprocedure::text as sig,
             p.proname,
             p.pronargs,
             coalesce(p.proargnames, '{}'::text[]) as proargnames,
             coalesce(array(select format_type(t, null) from unnest(p.proargtypes) t), '{}'::text[]) as proargtypes,
             (t.typname = 'trigger') as is_trigger
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      join pg_type t on t.oid = p.prorettype
      where n.nspname = 'public' and p.prosecdef
      order by 1
    `)
  ).rows;
  const definers = definerRows.map((r) => r.sig);
  if (definers.length === 0) {
    bad(
      'every SECURITY DEFINER function in `public` has a reviewed, catalog-matching execute-grant set',
      'found no SECURITY DEFINER functions at all — the query is wrong, or the schema changed shape'
    );
  } else {
    const mismatches = [];
    for (const sig of definers) {
      const expected = DEFINER_GRANTS.get(sig);
      const actual = [];
      for (const role of CHECKED_ROLES) {
        const { rows } = await client.query('select has_function_privilege($1, $2, $3) as e', [role, sig, 'execute']);
        if (rows[0].e) actual.push(role);
      }
      if (!expected) {
        mismatches.push(
          `${sig}: no row in scripts/lib/definer-grants.mjs (currently executable by: ${actual.join(', ') || 'no one'}) — ` +
            'a new SECURITY DEFINER function needs a reviewed grant-set row, argued the way the rows above are, before this gate can pass'
        );
        continue;
      }
      const expectedSet = new Set(expected.roles);
      const actualSet = new Set(actual);
      const extra = actual.filter((r) => !expectedSet.has(r));
      const missing = expected.roles.filter((r) => !actualSet.has(r));
      if (extra.length || missing.length) {
        mismatches.push(
          `${sig}: expected {${expected.roles.join(', ')}}, catalog shows {${actual.join(', ') || 'none'}}` +
            (extra.length ? ` — unexpected EXECUTE for ${extra.join(', ')} (widened grant or lost revoke)` : '') +
            (missing.length ? ` — missing expected EXECUTE for ${missing.join(', ')} (lost grant)` : '')
        );
      }
    }
    for (const sig of DEFINER_GRANTS.keys()) {
      if (!definers.includes(sig)) {
        mismatches.push(
          `${sig}: named in scripts/lib/definer-grants.mjs but no longer exists in the catalog — stale row, remove it ` +
            '(a renamed/dropped function keeping its old signature here hides the new signature having no row at all)'
        );
      }
    }
    if (mismatches.length === 0) {
      ok(
        `all ${definers.length} SECURITY DEFINER functions in \`public\` carry exactly their reviewed execute-grant ` +
          `set across ${CHECKED_ROLES.join('/')}`
      );
    } else {
      bad(
        'every SECURITY DEFINER function in `public` has a reviewed, catalog-matching execute-grant set',
        mismatches.join('; ')
      );
    }
  }


  // --- The prod probe payload must match the catalog, not just parse -------
  //
  // lib/definer-grants.mjs carries a `probe` per row so
  // scripts/prod-anon-definer-check.mjs can ask prod the anon half of the
  // same question. PostgREST resolves an RPC by argument NAMES, and a real
  // function called with the wrong name answers PGRST202/404 — the same code
  // a function that does not exist answers (live-measured on prod 2026-08-29,
  // recorded in lib/prod-schema-sentinels.mjs). So a drifted argument name
  // does not make the prod probe fail: it makes every row report "anon cannot
  // execute this", which is the answer the probe was hoping for. Nothing at
  // the far end can catch that. It is caught here, against the catalog that
  // owns the names.
  {
    const kindProblems = [];
    const argProblems = [];
    for (const row of definerRows) {
      const expected = DEFINER_GRANTS.get(row.sig);
      if (!expected) continue; // already reported as an unreviewed definer above
      const probe = expected.probe;
      if (!probe || !['call', 'trigger', 'unsafe'].includes(probe.kind)) {
        kindProblems.push(`${row.sig}: no probe kind (expected one of call/trigger/unsafe)`);
        continue;
      }
      if (row.is_trigger !== (probe.kind === 'trigger')) {
        kindProblems.push(
          row.is_trigger
            ? `${row.sig}: returns trigger but is marked '${probe.kind}' — the prod probe would call a function Postgres refuses to call directly, and read the refusal as a grant answer`
            : `${row.sig}: marked 'trigger' but does not return trigger — the prod probe skips it, so its anon revoke is asserted nowhere outside this local catalog`
        );
      }
      if (probe.kind !== 'call') continue;
      const inNames = (row.proargnames || []).slice(0, row.pronargs);
      if (inNames.length !== row.pronargs || inNames.some((n) => !n)) {
        argProblems.push(`${row.sig}: catalog has ${row.pronargs} argument(s) but only ${inNames.filter(Boolean).length} named — PostgREST cannot address it by name at all, so it cannot be a 'call' probe`);
        continue;
      }
      const got = Object.keys(probe.args ?? {}).slice().sort();
      const want = inNames.slice().sort();
      if (got.join('|') !== want.join('|')) {
        argProblems.push(`${row.sig}: probe.args names {${got.join(', ') || 'none'}}, catalog declares {${want.join(', ')}} — PostgREST would answer PGRST202 and the prod probe would read it as "anon revoked"`);
      }
    }
    if (kindProblems.length === 0) {
      ok(`every SECURITY DEFINER row carries a probe kind that matches the catalog (trigger vs callable)`);
    } else {
      bad('every SECURITY DEFINER row carries a probe kind that matches the catalog', kindProblems.join('; '));
    }
    if (argProblems.length === 0) {
      ok(`every callable SECURITY DEFINER probe addresses its function by the argument names the catalog declares`);
    } else {
      bad('every callable SECURITY DEFINER probe addresses its function by the argument names the catalog declares', argProblems.join('; '));
    }

    // A 'call' probe POSTs to PRODUCTION as anon. If the grant it is looking
    // for has regressed — the one condition the probe exists to detect — the
    // body RUNS. So every callable row has to be unable to do damage in
    // exactly that case, and "unable" has to be a property of the payload,
    // not of the author's memory of what the body does.
    //
    // Two admissible ways to be safe, and nothing else:
    //   POISONED  - some uuid-typed argument carries a value that is not a
    //               uuid. Postgres raises 22P02 coercing it, which happens
    //               AFTER the EXECUTE privilege check (live-measured against
    //               prod 2026-09-03: anon-revoked seal_hive with a poisoned
    //               uuid -> 401/42501; anon-granted is_hive_contributor with
    //               the same poison -> 400/22P02). So the poison is fully
    //               discriminating AND the body never starts.
    //   SAFE      - the signature has no uuid argument to poison (all-text),
    //               so the body does run, and the row states in `safety` why
    //               running it changes nothing.
    // A row that is neither is an exploit with a gate's name on it. This
    // check is here rather than in the prod script because the prod script
    // discovers the problem by having already caused it.
    const poisonProblems = [];
    for (const row of definerRows) {
      const probe = DEFINER_GRANTS.get(row.sig)?.probe;
      if (!probe || probe.kind !== 'call') continue;
      const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      const names = (row.proargnames || []).slice(0, row.pronargs);
      const types = (row.proargtypes || []).slice(0, row.pronargs);
      const uuidArgs = names.filter((n, i) => types[i] === 'uuid');
      const poisoned = uuidArgs.filter((n) => !isUuid(probe.args?.[n]));
      if (uuidArgs.length === 0) {
        if (!probe.safety) poisonProblems.push(`${row.sig}: no uuid argument to poison, so the body RUNS on prod if anon's grant has regressed — the row must carry a one-line \`safety\` saying why that is harmless`);
        if (probe.poison !== null) poisonProblems.push(`${row.sig}: has no uuid argument but names poison '${probe.poison}' — a poison that cannot fire reads as protection that is not there`);
        continue;
      }
      if (poisoned.length === 0) {
        poisonProblems.push(`${row.sig}: every uuid argument carries a well-formed uuid, so nothing raises 22P02 and the body RUNS on prod as anon if the grant has regressed — poison one of {${uuidArgs.join(', ')}}`);
        continue;
      }
      if (!uuidArgs.includes(probe.poison)) {
        poisonProblems.push(`${row.sig}: probe.poison is '${probe.poison}', which is not a uuid argument of this function {${uuidArgs.join(', ')}} — the named poison and the acting poison must be the same argument, or a later edit "fixes" the wrong value`);
      } else if (isUuid(probe.args?.[probe.poison])) {
        poisonProblems.push(`${row.sig}: probe.poison names '${probe.poison}' but that argument carries a well-formed uuid — the row documents a protection it does not apply`);
      }
    }
    if (poisonProblems.length === 0) {
      ok(`every callable SECURITY DEFINER probe either poisons a uuid argument or states why running its body is harmless`);
    } else {
      bad('every callable SECURITY DEFINER probe either poisons a uuid argument or states why running its body is harmless', poisonProblems.join('; '));
    }
  }
  // --- Fixtures --------------------------------------------------------------
  await client.query('insert into auth.users (id) select * from unnest($1::uuid[])', [[ALICE, BOB, CAROL, MALLORY]]);
  await client.query(
    `insert into public.profiles (id, display_name)
     values ($1,'Alice'),($2,'Bob'),($3,'Carol'),($4,'Mallory') on conflict (id) do nothing`,
    [ALICE, BOB, CAROL, MALLORY]
  );
  await client.query(
    `insert into public.honeycomb_connections (requester_id, addressee_id, status)
     values ($1, $2, 'accepted')`,
    [ALICE, BOB]
  );
  await client.query(
    `insert into public.honeycomb_connections (requester_id, addressee_id, status)
     values ($1, $2, 'accepted')`,
    [ALICE, CAROL]
  );

  // --- The share round-trip --------------------------------------------------
  // Exactly HoneycombStore.shareEntry: insert an entry with
  // {user_id, content, entry_date}, then insert a shares row. Columns the
  // client does not send are deliberately not sent here either — the whole
  // class of bug this gate is for is a column the schema requires and the
  // client doesn't know about.
  console.log('\n  share round-trip (HoneycombStore.shareEntry)');

  const shared = (
    await readAs(
      ALICE,
      `insert into public.entries (user_id, content, entry_date)
       values ($1, 'grateful for Mateo', '2026-08-13') returning id`,
      [ALICE]
    )
  )[0].id;
  let shareInsertFailed = null;
  try {
    await readAs(ALICE, 'insert into public.shares (entry_id, user_id) values ($1, $2)', [shared, ALICE]);
    ok('shareEntry’s two inserts both succeed as the signed-in author');
  } catch (e) {
    shareInsertFailed = e.message.split('\n')[0];
    bad('shareEntry’s two inserts both succeed', `the shares insert raised: ${shareInsertFailed}`);
  }

  // An entry the author never shared, as the control for both directions.
  const unshared = (
    await readAs(
      ALICE,
      `insert into public.entries (user_id, content, entry_date)
       values ($1, 'just for me', '2026-08-12') returning id`,
      [ALICE]
    )
  )[0].id;

  // RULE 1 — the assertion that catches over-blocking. If a migration adds a
  // condition the client doesn't satisfy, this is the only test in the repo
  // that goes red.
  const bobReads = await readAs(BOB, 'select content from public.entries where id = $1', [shared]);
  if (bobReads.length === 1) {
    ok('an accepted connection READS the shared entry');
  } else {
    bad(
      'an accepted connection READS the shared entry',
      'the share was written with no error and the hive cannot see it. Something in the schema now ' +
        'requires state that HoneycombStore.shareEntry does not write — check for a column added with ' +
        'a default that the client never sets, or a policy added `as restrictive` over one.'
    );
  }

  // RULE 2 — the boundary itself.
  const malloryReads = await readAs(MALLORY, 'select content from public.entries where id = $1', [shared]);
  if (malloryReads.length === 0) ok('an unconnected user cannot read the shared entry');
  else bad('an unconnected user cannot read the shared entry', `LEAK: Mallory read ${JSON.stringify(malloryReads)}`);

  const bobReadsUnshared = await readAs(BOB, 'select content from public.entries where id = $1', [unshared]);
  if (bobReadsUnshared.length === 0) ok('an accepted connection cannot read an entry that was never shared');
  else bad('an accepted connection cannot read an unshared entry', `LEAK: Bob read ${JSON.stringify(bobReadsUnshared)}`);

  const aliceReadsOwn = await readAs(ALICE, 'select content from public.entries where id = $1', [unshared]);
  if (aliceReadsOwn.length === 1) ok('the author still reads her own unshared entry (no over-block)');
  else bad('the author reads her own unshared entry', 'the author is locked out of her own journal');

  // --- The two feed shapes must agree ----------------------------------------
  // listFeed selects `entries(...)` — a to-one embed, LEFT JOIN — so an entry
  // filtered by RLS comes back as a null embed and toFeedShare renders a card
  // with an author and no words. listFeedSince selects `entries!inner(...)`,
  // so the same row is pruned and the share vanishes. Both are silent. The
  // defect is not either shape; it is that they disagree, so that is the
  // assertion.
  console.log('\n  feed shapes (listFeed vs listFeedSince)');

  const leftJoin = await readAs(
    BOB,
    `select s.id, e.content
     from public.shares s
     left join public.entries e on e.id = s.entry_id
     order by s.created_at desc`
  );
  const innerJoin = await readAs(
    BOB,
    `select s.id, e.content
     from public.shares s
     join public.entries e on e.id = s.entry_id
     order by s.created_at desc`
  );

  const nulled = leftJoin.filter((r) => r.content === null);
  if (nulled.length === 0) ok('listFeed’s embed is never null — no authored card arrives without its words');
  else
    bad(
      'listFeed’s embed is never null',
      `${nulled.length} share row(s) survive with a null entries embed. toFeedShare uses optional chaining, ` +
        'so this renders as a FeedCard with a name, an avatar and no gratitude in it — no crash, no warning.'
    );

  if (leftJoin.length === innerJoin.length) {
    ok(`listFeed and listFeedSince agree: ${innerJoin.length} share(s) visible to the hive`);
  } else {
    bad(
      'listFeed and listFeedSince agree on what exists',
      `Today view returns ${leftJoin.length} share(s), week view returns ${innerJoin.length}. The same share is ` +
        'visible on one screen and absent on the other, one toggle apart, with no error on either path.'
    );
  }

  // --- send_hive (8b.5, 20260819000001_private_hives_send) -------------------
  // The recipient read-access ruling's whole point: flipping visibility to
  // 'sent' has to actually deliver the entry, and only to the hive's
  // subject, and only once send_hive() has run. ALICE/BOB's accepted
  // connection above is reused as owner/subject.
  console.log('\n  send_hive (8b.5 recipient read-access ruling)');

  const insertHive = async (subjectId, subjectName) =>
    (
      await readAs(
        ALICE,
        `insert into public.private_hives (owner_id, subject_name, subject_profile_id)
         values ($1, $2, $3) returning id`,
        [ALICE, subjectName, subjectId]
      )
    )[0].id;
  const sealHive = (id) => readAs(ALICE, 'update public.private_hives set sealed_at = now() where id = $1', [id]);
  const insertEntry = async (hiveId, content, visibility = 'packaged') =>
    (
      await readAs(
        ALICE,
        `insert into public.entries (user_id, hive_id, content, entry_date, visibility)
         values ($1, $2, $3, '2026-08-01', $4) returning id`,
        [ALICE, hiveId, content, visibility]
      )
    )[0].id;

  const hiveId = await insertHive(BOB, 'Bob');
  const packagedEntry = await insertEntry(hiveId, 'grateful for Bob');
  await sealHive(hiveId);

  const bobBeforeHive = await readAs(BOB, 'select id from public.private_hives where id = $1', [hiveId]);
  if (bobBeforeHive.length === 0) ok('the subject cannot read the hive before send_hive');
  else bad('the subject cannot read the hive before send_hive', `LEAK: Bob read ${JSON.stringify(bobBeforeHive)}`);

  const bobBeforeEntry = await readAs(BOB, 'select id from public.entries where id = $1', [packagedEntry]);
  if (bobBeforeEntry.length === 0) ok('the subject cannot read a packaged entry before send_hive');
  else bad('the subject cannot read a packaged entry before send_hive', `LEAK: Bob read ${JSON.stringify(bobBeforeEntry)}`);

  try {
    await readAs(ALICE, 'select public.send_hive($1)', [hiveId]);
    ok('send_hive succeeds for the owner of a sealed hive with a connected subject');
  } catch (e) {
    bad('send_hive succeeds for the owner', e.message.split('\n')[0]);
  }

  const bobReadsHive = await readAs(BOB, 'select sent_at from public.private_hives where id = $1', [hiveId]);
  if (bobReadsHive.length === 1 && bobReadsHive[0].sent_at) ok('the subject reads the hive once sent_at is set');
  else bad('the subject reads the hive once sent', `Bob read ${JSON.stringify(bobReadsHive)}`);

  const bobReadsEntry = await readAs(BOB, 'select content from public.entries where id = $1', [packagedEntry]);
  if (bobReadsEntry.length === 1) ok('the subject reads the sent entry');
  else bad('the subject reads the sent entry', `Bob read ${JSON.stringify(bobReadsEntry)}`);

  const malloryReadsHive = await readAs(MALLORY, 'select id from public.private_hives where id = $1', [hiveId]);
  if (malloryReadsHive.length === 0) ok('an unconnected user cannot read the sent hive');
  else bad('an unconnected user cannot read the sent hive', `LEAK: Mallory read ${JSON.stringify(malloryReadsHive)}`);

  const malloryReadsEntry = await readAs(MALLORY, 'select content from public.entries where id = $1', [packagedEntry]);
  if (malloryReadsEntry.length === 0) ok('an unconnected user cannot read the sent entry');
  else bad('an unconnected user cannot read the sent entry', `LEAK: Mallory read ${JSON.stringify(malloryReadsEntry)}`);

  // send_hive only flips 'packaged' rows — an entry left at the default
  // 'private' in a sent hive is never delivered, curated or not.
  const hiveId2 = await insertHive(BOB, 'Bob again');
  const unpackagedEntry = await insertEntry(hiveId2, 'not curated', 'private');
  await sealHive(hiveId2);
  await readAs(ALICE, 'select public.send_hive($1)', [hiveId2]);
  const bobReadsUnpackaged = await readAs(BOB, 'select content from public.entries where id = $1', [unpackagedEntry]);
  if (bobReadsUnpackaged.length === 0) ok('send_hive never delivers an entry that was never packaged');
  else bad('send_hive never delivers an unpackaged entry', `LEAK: Bob read ${JSON.stringify(bobReadsUnpackaged)}`);

  // Guard rails: unsealed, unconnected-subject, and double-send all refuse,
  // each for the stated reason rather than any error.
  const unsealedHive = await insertHive(BOB, 'Draft');
  try {
    await readAs(ALICE, 'select public.send_hive($1)', [unsealedHive]);
    bad('send_hive refuses an unsealed hive', 'the send succeeded');
  } catch (e) {
    /sealed/.test(e.message)
      ? ok('send_hive refuses an unsealed hive')
      : bad('send_hive refuses an unsealed hive', `wrong reason: ${e.message.split('\n')[0]}`);
  }

  const noConnHive = await insertHive(MALLORY, 'Mallory');
  await sealHive(noConnHive);
  try {
    await readAs(ALICE, 'select public.send_hive($1)', [noConnHive]);
    bad('send_hive refuses a subject who is not a connected friend', 'the send succeeded');
  } catch (e) {
    /connected/.test(e.message)
      ? ok('send_hive refuses a subject who is not a connected friend')
      : bad('send_hive refuses a subject who is not a connected friend', `wrong reason: ${e.message.split('\n')[0]}`);
  }

  try {
    await readAs(ALICE, 'select public.send_hive($1)', [hiveId]);
    bad('send_hive refuses to send an already-sent hive twice', 'the second send succeeded');
  } catch (e) {
    /already been sent/.test(e.message)
      ? ok('send_hive refuses to send an already-sent hive twice')
      : bad('send_hive refuses to send an already-sent hive twice', `wrong reason: ${e.message.split('\n')[0]}`);
  }

  // --- hive_send_events (8b.7, 20260819000002_hive_send_events) --------------
  // send_hive (hiveId, above) already ran for ALICE -> BOB. Its insert into
  // hive_send_events happened in the same transaction — this is the content-
  // free feed event's own round trip, not a re-test of send_hive itself.
  console.log('\n  hive_send_events (8b.7 content-free feed event on send)');

  const sendEvent = (
    await readAs(ALICE, 'select id, sender_id, recipient_id from public.hive_send_events where sender_id = $1 and recipient_id = $2', [ALICE, BOB])
  )[0];
  if (sendEvent) ok('send_hive inserts exactly one hive_send_events row for the owner/subject pair');
  else bad('send_hive inserts a hive_send_events row', 'no row landed for sender=Alice, recipient=Bob');

  const eventCols = sendEvent ? Object.keys(sendEvent) : [];
  const hasContentRef = eventCols.some((c) => /entry|hive_id|content/i.test(c));
  if (!hasContentRef) ok('hive_send_events carries no entry/hive/content reference (content-free by construction)');
  else bad('hive_send_events carries no entry/hive/content reference', `found column(s): ${eventCols.join(', ')}`);

  const bobReadsEvent = await readAs(BOB, 'select id from public.hive_send_events where id = $1', [sendEvent?.id]);
  if (bobReadsEvent.length === 1) ok('the recipient reads their own send event');
  else bad('the recipient reads their own send event', `Bob read ${JSON.stringify(bobReadsEvent)}`);

  const carolReadsEvent = await readAs(CAROL, 'select id from public.hive_send_events where id = $1', [sendEvent?.id]);
  if (carolReadsEvent.length === 1) ok('a connection of the sender (not the recipient) reads the send event — community visibility');
  else bad('a connection of the sender reads the send event', `Carol read ${JSON.stringify(carolReadsEvent)}`);

  const malloryReadsEvent = await readAs(MALLORY, 'select id from public.hive_send_events where id = $1', [sendEvent?.id]);
  if (malloryReadsEvent.length === 0) ok('an unconnected user cannot read the send event');
  else bad('an unconnected user cannot read the send event', `LEAK: Mallory read ${JSON.stringify(malloryReadsEvent)}`);

  try {
    await readAs(ALICE, 'insert into public.hive_send_events (sender_id, recipient_id) values ($1, $2)', [ALICE, BOB]);
    bad('hive_send_events cannot be inserted directly by any authenticated caller', 'the direct insert succeeded — send_hive is not the only writer');
  } catch (e) {
    ok('hive_send_events cannot be inserted directly by any authenticated caller');
  }

  // No UPDATE/ALL policy means RLS's USING clause evaluates false for every
  // row, so the update touches 0 rows rather than raising — a throw is not
  // the right assertion. Target CAROL (a value that would actually show up)
  // and read the row back as ALICE (a party, unconditional select) to prove
  // nothing changed.
  await asUser(BOB, () =>
    client.query('update public.hive_send_events set recipient_id = $1 where id = $2', [CAROL, sendEvent?.id])
  );
  const afterUpdateAttempt = (
    await readAs(ALICE, 'select recipient_id from public.hive_send_events where id = $1', [sendEvent?.id])
  )[0];
  if (afterUpdateAttempt?.recipient_id === BOB) ok('hive_send_events cannot be updated by a participant');
  else bad('hive_send_events cannot be updated by a participant', `recipient_id is now ${afterUpdateAttempt?.recipient_id} — the direct update took effect`);

  // --- entries_update_own mirror guard: shares -> hive_id closes (20260819000001) ---
  // Direction one (hive entry can't acquire a shares row) was already closed
  // by owns_entry(); this is direction two.
  console.log('\n  entries_update_own mirror guard (a shared entry cannot acquire a hive_id)');

  const guardHive = await insertHive(null, 'Guard');

  try {
    await readAs(ALICE, 'update public.entries set hive_id = $1 where id = $2', [guardHive, unshared]);
    ok('an entry with no shares row can still acquire a hive_id (control)');
  } catch (e) {
    bad('an entry with no shares row can still acquire a hive_id (control)', e.message.split('\n')[0]);
  }

  try {
    await readAs(ALICE, 'update public.entries set hive_id = $1 where id = $2', [guardHive, shared]);
    bad('an entry with a shares row cannot acquire a hive_id', 'the reparent succeeded — direction two of the feed/hive coupling is open');
  } catch (e) {
    ok('an entry with a shares row cannot acquire a hive_id');
  }

  try {
    await readAs(ALICE, "update public.entries set content = 'edited, still shared' where id = $1", [shared]);
    ok('editing a shared journal entry (no hive_id change) still succeeds');
  } catch (e) {
    bad('editing a shared journal entry (no hive_id change) still succeeds', e.message.split('\n')[0]);
  }

  await client.end();
  await pg.stop();
  fs.rmSync(dataDir, { recursive: true, force: true });

  console.log(`\ncheck-share-visibility: ${pass} passed, ${failures.length} failed`);
  if (failures.length) {
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('\ncheck-share-visibility: harness error —', e);
  process.exit(1);
});
