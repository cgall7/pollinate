// Gate for the demo-account seed: scripts/lib/demo-seed-corpus.mjs (content)
// and scripts/lib/demo-seed-writer.mjs (mechanics).
//
//   npm run check:demo-seed
//
// TWO HALVES, and only one of them needs a database.
//
//   PART A, the corpus lint. Runs always, including under SKIP_PG_GATES.
//   Asserts the ratified voice rules mechanically, so a content edit that
//   breaks one lands red instead of landing in front of a demo audience.
//
//   PART B, the row writer against a real Postgres. Applies every migration
//   in supabase/migrations to an embedded instance, seeds the whole corpus
//   through the SAME seedDemoAccount() the real script calls, and asserts the
//   result. Skipped only under SKIP_PG_GATES=1.
//
// Because Part A always asserts, this gate never reports zero assertions and
// run-checks.mjs therefore never classifies it as a skip. That is deliberate:
// the corpus rules are real coverage on a machine that cannot run Postgres.
//
// WHAT PART B CANNOT COVER, so it is not implied anywhere: the real script's
// auth.admin.createUser calls. A bare Postgres has no GoTrue. The stub here
// inserts auth.users rows directly, exactly as every other PG gate in this
// directory does, which exercises handle_new_user and therefore the
// profiles/display_name path, but not the API call itself.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import {
  CAST,
  COMB_A,
  COMB_B,
  DEMO_ACCOUNT_KEY,
  DEMO_ACCOUNT_NAME,
  PRIVATE_HIVES,
  STREAK,
  STREAK_THEMES,
} from './lib/demo-seed-corpus.mjs';
import { buildPlan, contributorNames, pgAdapter, readDate, seedDemoAccount } from './lib/demo-seed-writer.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);

let pass = 0;
const failures = [];
const ok = (name) => { pass += 1; console.log(`  ok   ${name}`); };
const bad = (name, detail) => {
  failures.push(`${name} — ${detail}`);
  console.log(`  FAIL ${name}\n         ${detail}`);
};

// ===========================================================================
// PART A — the corpus lint
// ===========================================================================

const combEntries = [];
for (const comb of [COMB_A, COMB_B]) {
  for (const month of comb.months) {
    for (const e of month.entries) combEntries.push({ ...e, comb: comb.key, month: month.label });
  }
}
const hiveEntries = [];
for (const hive of PRIVATE_HIVES) {
  for (const e of hive.entries) hiveEntries.push({ ...e, hive: hive.key });
}
const addressed = [...combEntries, ...hiveEntries];
const allTexts = [...addressed.map((e) => e.text), ...STREAK.map((s) => s.text)];

// An enumerator has to assert on its own count before it loops
// (run-checks.mjs's standing requirement). An empty corpus must be red.
if (addressed.length >= 60 && STREAK.length > 0) {
  ok(`A0 corpus enumerates ${addressed.length} addressed entries and ${STREAK.length} streak entries`);
} else {
  bad('A0 corpus enumeration', `addressed=${addressed.length}, streak=${STREAK.length} — FAILS CLOSED`);
}

// --- V1. no dashes used as punctuation ------------------------------------
// Em dash, en dash, minus sign, horizontal bar, a spaced hyphen, and a double
// hyphen. An unspaced hyphen is left alone: "hand-writes" is a compound, and
// the house rule is about the dash, not the character.
{
  const DASHY = /[‒–—―−]|\s-\s|--/;
  const hits = allTexts.filter((t) => DASHY.test(t));
  if (hits.length === 0) ok('A1 V1 no dash is used as punctuation in any entry');
  else bad('A1 V1 dash punctuation', `${hits.length} entr(ies), first: ${JSON.stringify(hits[0].slice(0, 90))}`);
}

// --- V6. unique opening clause, corpus-wide -------------------------------
{
  const clause = (t) =>
    t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 6).join(' ');
  const seen = new Map();
  const dups = [];
  for (const t of allTexts) {
    const k = clause(t);
    if (seen.has(k)) dups.push(k);
    else seen.set(k, t);
  }
  if (dups.length === 0) ok(`A2 V6 all ${allTexts.length} entries have a unique six-word opening clause`);
  else bad('A2 V6 opening clauses', `${dups.length} repeated: ${dups.slice(0, 4).join(' | ')}`);

  if (new Set(allTexts).size === allTexts.length) ok('A3 no entry text is repeated anywhere in the corpus');
  else bad('A3 duplicate entry text', `${allTexts.length - new Set(allTexts).size} duplicate(s)`);
}

// --- V3. the voice ladder --------------------------------------------------
{
  const lens = addressed.map((e) => e.text.length);
  const short = lens.filter((l) => l <= 80).length;
  const mid = lens.filter((l) => l > 80 && l <= 220).length;
  const long = lens.filter((l) => l > 220).length;
  if (short >= 5 && mid > short + long && long >= 3) {
    ok(`A4 V3 ladder holds: ${short} at or under 80 chars, ${mid} mid, ${long} over 220`);
  } else {
    bad('A4 V3 voice ladder', `short=${short}, mid=${mid}, long=${long} — most must be mid, with real short and long tails`);
  }

  const missing = [];
  for (const comb of [COMB_A, COMB_B]) {
    for (const month of comb.months) {
      if (month.state !== 'delivered') continue;
      const has = month.entries.some((e) => e.text.length > 220 || e.text.includes('\n\n'));
      if (!has) missing.push(`${comb.key}/${month.label}`);
    }
  }
  if (missing.length === 0) ok('A5 V3 every delivered keepsake month carries a long or paragraph-broken entry');
  else bad('A5 V3 per-month long entry', `missing in: ${missing.join(', ')}`);
}

// --- V5. person ------------------------------------------------------------
{
  const notSecond = addressed.filter((e) => !/\b[Yy]ou(r|rs)?\b/.test(e.text));
  if (notSecond.length === 0) ok('A6 V5 every comb and hive entry addresses its subject in the second person');
  else bad('A6 V5 second person', `${notSecond.length}, first: ${JSON.stringify(notSecond[0].text.slice(0, 70))}`);

  const notFirst = STREAK.filter((s) => !/^I\b/.test(s.text));
  if (notFirst.length === 0) ok('A7 V5 every streak entry opens in the first person');
  else bad('A7 V5 first person', `${notFirst.length}, first: ${JSON.stringify(notFirst[0].text.slice(0, 70))}`);
}

// --- placeholder-name class ------------------------------------------------
// The invariant scripts/check-placeholder-name.mjs pins on the client side,
// asserted here on the data that will produce those display names.
{
  const PLACEHOLDER = new Set(['', 'New user']);
  const names = [DEMO_ACCOUNT_NAME, ...CAST.map((c) => c.name)];
  const bad_ = names.filter((n) => PLACEHOLDER.has(n) || n.trim().length === 0 || n.length > 100);
  if (bad_.length === 0 && names.length === 7) {
    ok('A8 all seven display names are outside the placeholder class and inside the 100-char cap');
  } else {
    bad('A8 display names', `${names.length} names, offenders: ${JSON.stringify(bad_)}`);
  }
}

// --- the ratified cast, exactly ------------------------------------------
{
  const expected = ['Rosa/R', 'Omar/O', 'Priya/P', 'Sam/S', 'Elena/E', 'Dev/D'].join(', ');
  const actual = CAST.map((c) => `${c.name}/${c.initial}`).join(', ');
  if (actual === expected) ok('A9 the cast is the ratified six, in order, with the ratified initials');
  else bad('A9 cast', `expected ${expected}, got ${actual}`);

  const personaless = CAST.filter((c) => !c.persona || c.persona.length < 20);
  if (personaless.length === 0) ok('A10 every cast member carries a persona line');
  else bad('A10 personas', `missing on: ${personaless.map((c) => c.name).join(', ')}`);
}

// --- the subject rota, and the no-self-write rule -------------------------
{
  const problems = [];
  for (const comb of [COMB_A, COMB_B]) {
    const ordinals = comb.months.map((m) => m.ordinal);
    if (ordinals.join() !== ordinals.map((_, i) => i + 1).join()) {
      problems.push(`${comb.key}: ordinals are ${ordinals.join(',')}, not 1..n`);
    }
    const open = comb.months.filter((m) => m.state === 'open');
    if (open.length !== 1) problems.push(`${comb.key}: ${open.length} open months, expected exactly 1`);
    if (comb.months[comb.months.length - 1].state !== 'open') {
      problems.push(`${comb.key}: the open month is not the last one`);
    }
    for (const month of comb.months) {
      const selfWrites = month.entries.filter((e) => e.writer === month.subjectKey);
      if (selfWrites.length) problems.push(`${comb.key}/${month.label}: subject wrote ${selfWrites.length} of their own entries`);
      const outsiders = month.entries.filter((e) => !comb.joinOrder.includes(e.writer));
      if (outsiders.length) {
        problems.push(`${comb.key}/${month.label}: ${outsiders.length} entr(ies) by a non-member`);
      }
      const writers = new Set(month.entries.map((e) => e.writer));
      if (writers.size < 2 || writers.size > 3) {
        problems.push(`${comb.key}/${month.label}: ${writers.size} writers, register asks for 2 to 3`);
      }
      if (writers.size === comb.joinOrder.length - 1 && comb.joinOrder.length > 3) {
        problems.push(`${comb.key}/${month.label}: everybody wrote, which is the fixture shape the register refuses`);
      }
    }
  }
  if (problems.length === 0) {
    ok('A11 every month has 2 to 3 writers, all members, and never the subject');
  } else {
    bad('A11 rosters', problems.join(' | '));
  }
}

// --- Comb A is the ratified six-month rota ---------------------------------
{
  const want = ['rosa', 'omar', 'priya', DEMO_ACCOUNT_KEY, 'elena', 'sam'];
  const got = COMB_A.months.map((m) => m.subjectKey);
  const members = new Set(COMB_A.joinOrder);
  const rightSize = members.size === 6 && ['rosa', 'omar', 'priya', 'sam', 'elena'].every((k) => members.has(k));
  if (got.join() === want.join() && rightSize && !members.has('dev')) {
    ok('A12 Comb A is Alex plus five, with the ratified subject rota Rosa, Omar, Priya, Alex, Elena, Sam');
  } else {
    bad('A12 Comb A shape', `subjects=${got.join(',')}; members=${[...members].join(',')}`);
  }
}

// --- the decorative layer never collides with the ratified register -------
// R-CL-3 (Pixel, 2026-09-04) renamed demoHive.js's decorative roster so it no
// longer borrows any of the six ratified names. This row used to assert the
// opposite — that a collision existed and was declared — which the rename
// made false at its premise, not just its data: a corpus-side edit alone
// could never have turned it green again. Inverted in place (same row id)
// rather than deleted, so a name added back on either side reds this instead
// of silently reopening the doubles bug the rename fixed.
{
  const register = new Set([DEMO_ACCOUNT_NAME, ...CAST.map((c) => c.name)]);
  const demoHiveSrc = fs.readFileSync(path.join(ROOT, 'src/constants/demoHive.js'), 'utf8');
  const decorative = [...demoHiveSrc.matchAll(/name: '([^']+)'/g)].map((m) => m[1]);
  const collisions = decorative.filter((n) => register.has(n));
  if (decorative.length > 0 && collisions.length === 0) {
    ok(`A13 none of demoHive.js's ${decorative.length} decorative names collide with the ratified register`);
  } else {
    bad('A13 decorative/register disjointness', `demoHive.js collides on [${collisions.join(',')}] (register: [${[...register].join(',')}])`);
  }
}

// --- the retired declaration cannot come back as a live export ------------
// Earned by how the retirement went: DECORATIVE_NAME_COLLISIONS was twice
// called a zero-consumer export while seed-demo-account.mjs was still
// printing it at run time to whoever seeds prod. Both greps were honest and
// neither reached scripts/. A stale record with a reader is a live claim, so
// the export itself is what gets asserted absent, in both places it lived.
{
  const corpusSrc = fs.readFileSync(path.join(ROOT, 'scripts/lib/demo-seed-corpus.mjs'), 'utf8');
  const seedSrc = fs.readFileSync(path.join(ROOT, 'scripts/seed-demo-account.mjs'), 'utf8');
  const exported = /export const DECORATIVE_NAME_COLLISIONS/.test(corpusSrc);
  const printed = /DECORATIVE_NAME_COLLISIONS/.test(seedSrc);
  if (!exported && !printed) {
    ok('A13b the retired collision declaration is exported nowhere and printed nowhere');
  } else {
    bad('A13b retired declaration', `corpus exports it: ${exported}; seed script names it: ${printed}`);
  }
}

// --- the pre-dormancy merge expression is quoted nowhere -------------------
// Three comments under scripts/ quoted HoneycombTab's OLD flat merge and
// reasoned from it. Two were rewritten when the declaration retired; the
// third, demo-seed-writer.mjs's own header, survived and spent a commit
// telling the reader the decorative layer cannot be switched off while the
// preflight banner it cites said the opposite. Prose does not recompile, so
// it gets a row. The retired shape has a fingerprint the nested shape cannot
// produce; the needle is assembled from two halves at run time because,
// spelled whole, it would appear in this file and this row would report
// itself.
{
  const dir = path.join(ROOT, 'scripts');
  const files = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.(mjs|js)$/.test(e.name)) files.push(full);
    }
  };
  walk(dir);
  const needle = ['DEMO_CONTENT ?', 'weekFeed.concat'].join(' ');
  const stale = files.filter((f) => fs.readFileSync(f, 'utf8').includes(needle));
  // Asserted beside the quotes, not instead of them: the screen regressing to
  // the flat shape would make every retired quote true again, so a row that
  // only banned the quotes could go green by the defect coming back.
  const live = fs.readFileSync(path.join(ROOT, 'src/screens/HoneycombTab.js'), 'utf8');
  const nested = /const merged = DEMO_CONTENT\s*\n\s*\? \(hasRealConnections \?/.test(live);
  if (stale.length === 0 && nested && files.length > 0) {
    ok(`A13c none of the ${files.length} scripts/ files quote the retired flat merge, and HoneycombTab is still nested`);
  } else {
    bad(
      'A13c retired merge expression',
      `${files.length} files scanned, stale quotes in [${stale.map((f) => path.relative(ROOT, f)).join(',')}], HoneycombTab nested: ${nested}`,
    );
  }
}

// --- streak shape ----------------------------------------------------------
{
  const problems = [];
  if (STREAK.length !== 180) problems.push(`${STREAK.length} streak entries, register asks for 180`);
  const badTheme = STREAK.filter((s) => !STREAK_THEMES.includes(s.theme));
  if (badTheme.length) problems.push(`${badTheme.length} entr(ies) carry a theme outside the nine`);
  // Themes have to spread, or Wrapped's "top 3 themes" is one theme.
  const counts = new Map();
  for (const s of STREAK) counts.set(s.theme, (counts.get(s.theme) ?? 0) + 1);
  if (counts.size < 7) problems.push(`only ${counts.size} distinct themes used`);
  const top = Math.max(...counts.values());
  if (top > STREAK.length * 0.35) problems.push(`one theme holds ${top} of ${STREAK.length}, too concentrated`);
  if (problems.length === 0) {
    ok(`A14 the streak is 180 entries across ${counts.size} themes, none over 35 per cent`);
  } else {
    bad('A14 streak shape', problems.join(' | '));
  }
}

// --- content caps ----------------------------------------------------------
{
  const over = allTexts.filter((t) => t.length > 10000);
  if (over.length === 0) ok('A15 every entry is inside entries_content_length (10000 chars)');
  else bad('A15 content length', `${over.length} over the cap`);
}

// ===========================================================================
// PART B — the writer against a real Postgres
// ===========================================================================

if (process.env.SKIP_PG_GATES === '1') {
  console.log('check-demo-seed: Part B SKIPPED — SKIP_PG_GATES=1 set explicitly (Part A above still ran)');
} else {
  let EmbeddedPostgres;
  try {
    EmbeddedPostgres = require('embedded-postgres').default;
    require('pg');
  } catch (e) {
    console.error(
      `check-demo-seed: FAILED — embedded-postgres/pg not installed (${e.message.split('\n')[0]}).\n` +
        '  Run `npm install` (both are devDependencies), or set SKIP_PG_GATES=1 to skip Part B\n' +
        '  deliberately on a machine that genuinely cannot run a local Postgres.'
    );
    process.exit(1);
  }

  const APPLY = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();

  // Verbatim from check-comb-open-rotation.mjs:88-116. Stubs the three
  // Supabase roles, auth.users, auth.uid() and the storage schema that a bare
  // Postgres has never heard of.
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

  const UUID = (n) => `${String(n).repeat(8)}-${String(n).repeat(4)}-${String(n).repeat(4)}-${String(n).repeat(4)}-${String(n).repeat(12)}`;
  const KEYS = [DEMO_ACCOUNT_KEY, ...CAST.map((c) => c.key)];
  const profileIds = Object.fromEntries(KEYS.map((k, i) => [k, UUID(i + 1)]));
  const nameFor = (k) => (k === DEMO_ACCOUNT_KEY ? DEMO_ACCOUNT_NAME : CAST.find((c) => c.key === k).name);

  const dataDir = path.join(ROOT, '.demo-seed-pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    // 54329-54343 are taken by the other gates (54337 already collides three
    // ways). 54341 is the first genuinely free port.
    port: 54341,
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

    // auth.users only. handle_new_user (20260808000001:39-53) creates every
    // profiles row from raw_user_meta_data, which is exactly the path the
    // real script drives through auth.admin.createUser's user_metadata.
    const params = [];
    const tuples = KEYS.map((k) => {
      params.push(profileIds[k], JSON.stringify({ display_name: nameFor(k) }));
      return `($${params.length - 1}, $${params.length})`;
    });
    await client.query(`insert into auth.users (id, raw_user_meta_data) values ${tuples.join(', ')}`, params);

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
    const q = async (sql, p = []) => (await asPostgres(() => client.query(sql, p))).rows;

    // B0. Every profile arrived non-placeholder, which is the display-name
    // half of what the real admin-API call has to achieve.
    {
      const rows = await q('select display_name from public.profiles order by display_name');
      const names = rows.map((r) => r.display_name);
      const wanted = [DEMO_ACCOUNT_NAME, ...CAST.map((c) => c.name)].sort();
      if (names.length === 7 && names.join() === wanted.join()) {
        ok('B0 handle_new_user produced seven real display names, none placeholder-class');
      } else {
        bad('B0 profiles', `got ${JSON.stringify(names)}`);
      }
    }

    // ------------------------------------------------------------------
    // B1. The whole seed runs, through the same seedDemoAccount() the real
    // script calls, against every real trigger and constraint. A raise
    // anywhere lands here.
    // ------------------------------------------------------------------
    const now = new Date('2026-09-04T12:00:00.000Z');
    const plan = buildPlan({ now });
    const db = pgAdapter(client);
    let summary;
    await asPostgres(async () => {
      summary = await seedDemoAccount(db, { plan, profileIds });
    });
    const wantEntries =
      [COMB_A, COMB_B].reduce((n, c) => n + c.months.reduce((m, mo) => m + mo.entries.length, 0), 0) +
      PRIVATE_HIVES.reduce((n, h) => n + h.entries.length, 0);
    if (summary.combs === 2 && summary.rotations === 8 && summary.hives === 2 &&
        summary.entries === wantEntries && summary.streak === 180) {
      ok(`B1 the full seed wrote with zero constraint or trigger violations (${summary.rotations} rotations, ${summary.entries} hive entries, 180 streak)`);
    } else {
      bad('B1 seed run', `combs=${summary.combs} rotations=${summary.rotations} hives=${summary.hives} entries=${summary.entries} streak=${summary.streak}`);
    }

    // B2. One open rotation per comb, DB-enforced by
    // comb_rotations_one_open_per_comb. Asserted as a fact, not as an
    // absence of an error, so a future edit that seeds two open months is
    // caught by its own row count and not only by a 23505.
    {
      const rows = await q(
        `select c.name, count(*) filter (where r.sealed_at is null and r.voided_at is null) as open,
                count(*) as total
         from public.combs c join public.comb_rotations r on r.comb_id = c.id
         group by c.name order by c.name`
      );
      const shape = rows.map((r) => `${r.name}:${r.open}/${r.total}`).join(' ');
      if (rows.length === 2 && rows.every((r) => Number(r.open) === 1)) {
        ok(`B2 exactly one open rotation per comb (${shape})`);
      } else {
        bad('B2 open rotations', shape || 'no combs found');
      }
    }

    // B3. The subject never holds a writing seat on their own month. That is
    // hive_contributors_not_hive_subject's whole job, and it is what makes
    // comb_rotation_roster refuse the subject with no subject-specific branch.
    {
      const rows = await q(
        `select count(*)::int as n
         from public.comb_rotations r
         join public.hive_contributors c on c.hive_id = r.hive_id
         where c.profile_id = r.subject_profile_id`
      );
      const seats = await q(
        `select r.ordinal, count(c.*)::int as n
         from public.comb_rotations r
         join public.combs cb on cb.id = r.comb_id and cb.name = $1
         join public.hive_contributors c on c.hive_id = r.hive_id
         group by r.ordinal order by r.ordinal`,
        [COMB_A.name]
      );
      const allFive = seats.length === 6 && seats.every((s) => s.n === 5);
      if (rows[0].n === 0 && allFive) {
        ok('B3 no rotation seats its own subject as a contributor, and every Comb A month seats the other five');
      } else {
        bad('B3 roster', `subject-seated rows=${rows[0].n}; Comb A seats=${seats.map((s) => s.n).join(',')}`);
      }
    }

    // B4. THE MONEY SHOT. Alex is Comb A month 4's subject, and the demo
    // account has to be able to READ that keepsake. Not asserted as
    // postgres: read as Alex, through entries_select_as_hive_subject
    // (20260819000001:76-86) and private_hives_select_as_subject, which are
    // the two policies the whole delivery rides on.
    {
      const [rot] = await q(
        `select r.hive_id, r.subject_profile_id, r.sealed_at, r.sent_at
         from public.comb_rotations r
         join public.combs c on c.id = r.comb_id and c.name = $1
         where r.ordinal = 4`,
        [COMB_A.name]
      );
      const alexId = profileIds[DEMO_ACCOUNT_KEY];
      const seen = await asUser(alexId, () =>
        client.query(
          `select e.content, e.author_name_at_seal from public.entries e where e.hive_id = $1 order by e.created_at`,
          [rot.hive_id]
        )
      );
      const hiveRow = await asUser(alexId, () =>
        client.query('select subject_name, contributor_names, sent_at from public.private_hives where id = $1', [rot.hive_id])
      );
      const wantCount = COMB_A.months[3].entries.length;
      const wantNames = contributorNames(plan.combs[0].months[3].entries, nameFor);
      const gotNames = hiveRow.rows[0]?.contributor_names ?? [];
      if (
        rot.subject_profile_id === alexId &&
        rot.sealed_at && rot.sent_at &&
        seen.rows.length === wantCount &&
        seen.rows.every((r) => r.author_name_at_seal) &&
        hiveRow.rows.length === 1 &&
        gotNames.join() === wantNames.join()
      ) {
        ok(`B4 Alex reads his own July keepsake as its subject: ${wantCount} signed entries, contributor_names [${gotNames.join(', ')}]`);
      } else {
        bad(
          'B4 subject read',
          `entries visible=${seen.rows.length}/${wantCount}, hive rows=${hiveRow.rows.length}, names=[${gotNames.join(',')}] want [${wantNames.join(',')}]`
        );
      }
    }

    // B5. The open month is genuinely open and genuinely writable by Alex,
    // who is not its subject. Written as Alex through entries_insert_own,
    // which is the real write path, then rolled back so it does not pollute
    // the counts below.
    {
      const [rot] = await q(
        `select r.id, r.hive_id, r.closes_at, r.subject_profile_id
         from public.comb_rotations r
         join public.combs c on c.id = r.comb_id and c.name = $1
         where r.sealed_at is null and r.voided_at is null`,
        [COMB_A.name]
      );
      const alexId = profileIds[DEMO_ACCOUNT_KEY];
      const daysLeft = (new Date(rot.closes_at) - now) / 86400000;
      let wrote = false;
      let probeError = '';
      try {
        await client.query('begin');
        await client.query("select set_config('role', 'authenticated', true)");
        await client.query("select set_config('request.jwt.claims', $1, true)", [
          JSON.stringify({ sub: alexId, role: 'authenticated' }),
        ]);
        const [vol] = (await client.query('select id from public.hive_volumes where hive_id = $1 and sealed_at is null', [rot.hive_id])).rows;
        await client.query(
          `insert into public.entries (user_id, hive_id, volume_id, content, entry_date)
           values ($1, $2, $3, 'probe', current_date)`,
          [alexId, rot.hive_id, vol.id]
        );
        wrote = true;
      } catch (e) {
        wrote = false;
        probeError = ` probe raised ${e.code ?? ''} ${e.message}`;
      } finally {
        await client.query('rollback');
      }
      const unsealedEntries = await q(
        "select count(*) filter (where visibility = 'private' and author_name_at_seal is null)::int as n, count(*)::int as total from public.entries where hive_id = $1",
        [rot.hive_id]
      );
      if (
        rot.subject_profile_id === profileIds.sam &&
        daysLeft > 3.5 && daysLeft < 4.5 &&
        wrote &&
        unsealedEntries[0].n === unsealedEntries[0].total &&
        unsealedEntries[0].total === COMB_A.months[5].entries.length
      ) {
        ok(`B5 the open month is Sam's, closes in ${daysLeft.toFixed(1)} days, holds ${unsealedEntries[0].total} unsigned private entries, and Alex can still write to it`);
      } else {
        bad('B5 open month', `subject ok=${rot.subject_profile_id === profileIds.sam}, daysLeft=${daysLeft.toFixed(2)}, alex could write=${wrote}${probeError}, private/total=${unsealedEntries[0].n}/${unsealedEntries[0].total}`);
      }
    }

    // B6. Volume shape, which is the one place the two seal paths visibly
    // differ. A rotation hive keeps exactly one volume, sealed, no successor
    // (20260830000009 refuses to open one). A hand-sealed legacy hive gets
    // its successor from seal_volume (20260904000002:82).
    {
      const rot = await q(
        `select count(*)::int as n from public.hive_volumes v
         where v.hive_id in (select hive_id from public.comb_rotations)
         group by v.hive_id`
      );
      const [sealedHive] = await q(
        `select h.id from public.private_hives h
         where h.sent_at is not null and h.id not in (select hive_id from public.comb_rotations)`
      );
      const legacy = await q('select ordinal, sealed_at from public.hive_volumes where hive_id = $1 order by ordinal', [sealedHive.id]);
      const rotOk = rot.length === 8 && rot.every((r) => r.n === 1);
      const legacyOk = legacy.length === 2 && legacy[0].sealed_at !== null && legacy[1].sealed_at === null;
      if (rotOk && legacyOk) {
        ok('B6 rotation hives keep one volume and open no successor; the hand-sealed legacy hive has a sealed Volume 1 and an open Volume 2');
      } else {
        bad('B6 volumes', `rotation volume counts=${rot.map((r) => r.n).join(',')}; legacy=${JSON.stringify(legacy.map((l) => [l.ordinal, !!l.sealed_at]))}`);
      }
    }

    // B7. The open legacy hive. R-SEAL-1's real question: is an unsealed
    // private hive a coherent state, or does something downstream assume a
    // seal? Asserted positively, and read as its OWNER (Alex), since a
    // never-sent hive has no subject read at all.
    {
      const [open] = await q(
        `select h.id, h.sealed_at, h.sent_at, h.contributor_names, h.is_collective
         from public.private_hives h
         where h.sent_at is null and h.id not in (select hive_id from public.comb_rotations)`
      );
      const alexId = profileIds[DEMO_ACCOUNT_KEY];
      const asOwner = await asUser(alexId, () =>
        client.query("select count(*)::int as n from public.entries where hive_id = $1 and visibility = 'private'", [open.id])
      );
      const subjectSees = await asUser(profileIds.priya, () =>
        client.query('select count(*)::int as n from public.private_hives where id = $1', [open.id])
      );
      const wantOpen = PRIVATE_HIVES.find((h) => h.state === 'open').entries.length;
      if (
        open.sealed_at === null && open.sent_at === null &&
        open.contributor_names.length === 0 && open.is_collective === false &&
        asOwner.rows[0].n === wantOpen &&
        subjectSees.rows[0].n === 0
      ) {
        ok(`B7 the unsealed hive is coherent: ${wantOpen} private entries readable by its owner, invisible to its subject, empty contributor_names`);
      } else {
        bad('B7 open hive', `sealed=${open.sealed_at} sent=${open.sent_at} names=${open.contributor_names.length} ownerSees=${asOwner.rows[0].n}/${wantOpen} subjectSees=${subjectSees.rows[0].n}`);
      }
    }

    // B8. The streak: 180 rows, one per date, all Alex's, all outside any
    // hive. entries_one_journal_per_day would have refused a repeat, so the
    // count is the assertion.
    {
      const [row] = await q(
        `select count(*)::int as n, count(distinct entry_date)::int as d, min(entry_date) as lo, max(entry_date) as hi
         from public.entries where user_id = $1 and hive_id is null`,
        [profileIds[DEMO_ACCOUNT_KEY]]
      );
      const span = (new Date(readDate(row.hi)) - new Date(readDate(row.lo))) / 86400000;
      if (row.n === 180 && row.d === 180 && span === 179) {
        ok(`B8 the streak is 180 journal entries on 180 consecutive dates (${readDate(row.lo)} to ${readDate(row.hi)})`);
      } else {
        bad('B8 streak', `rows=${row.n} distinct dates=${row.d} span=${span}`);
      }
    }

    // B9. IDEMPOTENCY. Re-run the whole seed and assert it writes nothing.
    {
      let second;
      await asPostgres(async () => {
        second = await seedDemoAccount(db, { plan, profileIds });
      });
      const [after] = await q('select count(*)::int as n from public.entries');
      const [rots] = await q('select count(*)::int as n from public.comb_rotations');
      if (
        second.combs === 0 && second.hives === 0 && second.rotations === 0 &&
        second.streak === 0 && second.connections === 0 &&
        rots.n === 8 && after.n === wantEntries + 180
      ) {
        ok(`B9 a second run writes nothing: still ${rots.n} rotations and ${after.n} entries`);
      } else {
        bad('B9 idempotency', `second run wrote combs=${second.combs} hives=${second.hives} rotations=${second.rotations} streak=${second.streak} connections=${second.connections}; totals rotations=${rots.n} entries=${after.n}`);
      }
    }

    // B10. NOTHING IN THE LEDGER. The scope claim, asserted rather than
    // promised in a comment.
    {
      const tables = ['ledger_transactions', 'ledger_postings', 'ledger_accounts', 'nectar_zaps', 'comb_nectar_notes', 'hive_send_events'];
      const counts = {};
      for (const t of tables) counts[t] = (await q(`select count(*)::int as n from public.${t}`))[0].n;
      const ledgerClean = ['ledger_transactions', 'ledger_postings', 'ledger_accounts', 'nectar_zaps', 'comb_nectar_notes']
        .every((t) => counts[t] === 0);
      // hive_send_events is NOT ledger: seven sends happened (six delivered
      // rotations plus the one legacy hive), and a zero there would mean the
      // feed announcement never landed.
      if (ledgerClean && counts.hive_send_events === 7) {
        ok('B10 every ledger and nectar table is untouched; the seven real sends each left a hive_send_events row');
      } else {
        bad('B10 scope', JSON.stringify(counts));
      }
    }

    // ------------------------------------------------------------------
    // B11. THE SUBJECT ROTA IS DERIVED, NOT DECORATED.
    //
    // The corpus claims Comb A's joined_at order is the only one that makes
    // the ratified rota (Rosa, Omar, Priya, Alex, Elena, Sam) the sequence
    // comb_advance_rotation actually derives. That is a claim about a
    // function body, so it is checked against the function body: a scratch
    // comb with the same join order, month 1 minted through the real
    // comb_open_rotation, then five real comb_advance_rotation calls with a
    // forced resolution between each. If the corpus order is wrong, this
    // returns a different rota and lands red.
    // ------------------------------------------------------------------
    {
      const owner = profileIds[COMB_A.ownerKey];
      const [comb] = await q("insert into public.combs (owner_id, name) values ($1, 'rota probe') returning id", [owner]);
      // The trigger seated the owner already; seat the rest in ratified order.
      for (const key of COMB_A.joinOrder.slice(1)) {
        await q('insert into public.comb_members (comb_id, profile_id) values ($1, $2)', [comb.id, profileIds[key]]);
        // joined_at defaults to now() and the identity trigger pins it, so
        // ordering here comes from insert order, one statement at a time.
        await q('select pg_sleep(0.002)');
      }
      const derived = [];
      const [m1] = await q('select public.comb_open_rotation($1, $2) as id', [comb.id, profileIds[COMB_A.months[0].subjectKey]]);
      let rotationId = m1.id;
      derived.push(COMB_A.months[0].subjectKey);
      for (let i = 1; i < COMB_A.months.length; i += 1) {
        await q("update public.comb_rotations set voided_at = now(), voided_reason = 'quiet' where id = $1", [rotationId]);
        const [next] = await q('select public.comb_advance_rotation($1) as id', [comb.id]);
        if (!next.id) break;
        rotationId = next.id;
        const [row] = await q('select subject_profile_id from public.comb_rotations where id = $1', [rotationId]);
        derived.push(Object.keys(profileIds).find((k) => profileIds[k] === row.subject_profile_id));
      }
      const want = COMB_A.months.map((m) => m.subjectKey);
      if (derived.join() === want.join()) {
        ok(`B11 comb_advance_rotation derives the ratified rota from the corpus join order: ${derived.join(' -> ')}`);
      } else {
        bad('B11 derived rota', `real function derives ${derived.join(' -> ')}, corpus claims ${want.join(' -> ')}`);
      }
    }

    // No summary or exit here, deliberately, unlike the sibling PG gates:
    // process.exit skips `finally`, so an early exit would leave the embedded
    // instance running and its data directory on disk. The teardown below
    // always runs and the single summary prints after it.
  } finally {
    await client.end();
    await pg.stop();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

console.log(`\ncheck-demo-seed: ${pass} passed, ${failures.length} failed`);
if (failures.length > 0) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
