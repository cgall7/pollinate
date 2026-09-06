// Executable acceptance gate for the DELIVERY ALLOWANCE
// (supabase/migrations/20260906000001_nectar_delivery_allowance.sql).
//
//   npm run check:nectar-delivery-allowance
//
// THE RULING (Lumen, UX Design thread 0a406eb6, 2026-09-06): at every
// rotation delivery, each consented member of that comb is topped back up to
// the delivery allowance. "The tide rises to half; it never takes."
//
// THE TARGET GOT ITS OWN NAME LATER THE SAME DAY. The ruling was built on
// `nectar_starter_grant_drops()`, which gave that function a second caller —
// and when Colin ruled the starter grant to zero ("i don't want to give out
// free anything right now"), one number was answering two questions with
// opposite answers. 20260906000002 splits them: the grant is zero, the target
// is `nectar_delivery_allowance_drops()` at the value it always held, and the
// mechanic below is unchanged in every clause. A0 finds that definition
// rather than naming its file.
//
// WHICH MAKES THIS MECHANIC THE ONLY SUPPLY IN THE PRODUCT. A new account
// opens empty, so the first drop anyone ever holds arrives through a
// delivery. A0c and A0d assert exactly that, from consent to first credit.
//
// WHY THIS GATE EXISTS SEPARATELY FROM check-ops9-rotation-scheduler. That
// gate already replays every migration and calls advance_due_rotations()
// against a real Postgres, so the recreated body is exercised there — but
// none of its fixtures consent to nectar, so the third subtransaction is a
// no-op on every one of its rows. A green ops9 suite says nothing about the
// allowance, and would go on saying nothing if the refill were deleted. The
// mechanic needs an instrument whose red row names IT.
//
// WHAT IS ASSERTED, and each row is a property the ruling names rather than
// a spelling:
//
//   A. the refill happens, through the tick, at the delivery
//   B. NEVER TAKES — a member at or above the target is not written at all
//   C. idempotent per (rotation, member)
//   D. an unconsented member is not given a wallet by a scheduler
//   E. a rotation that did NOT deliver refills nobody
//   F. live rails are a no-op — the mechanic is built to die at 19b
//   G. THE COUPLING PROPERTY: a refill that raises cannot roll back the seal
//   H. the execute boundary the prod-schema sentinel's 42501 depends on
//
// G IS THE ROW THAT PAYS FOR THIS FILE. §1B.31.2: a begin/exception/end is a
// SUBTRANSACTION, so a refill step written INSIDE the seal's block would
// couple its failure to the seal — sealed_at/sent_at roll back, the warning
// is swallowed, and the tick re-picks that rotation forever. Every other row
// here is green under that bug. This one substitutes a refill that always
// raises and asserts the delivery survives it.
// THE FILE THE REFILL-BODY MUTATIONS TARGET IS THE ONE THAT LAST DEFINES THE
// FUNCTION, NOT THE ONE THAT INTRODUCED IT. 20260906000002 recreates
// `nectar_refill_rotation_members` (it re-points the target at
// `nectar_delivery_allowance_drops()` after Colin ruled the grant to zero),
// and every migration is replayed in lexical order — so a mutation applied to
// 20260906000001's copy of that body is OVERWRITTEN before a single row runs.
// It would score as "not caught" while the gate was never given the defect.
// A0b asserts this rather than trusting the constant below, because the next
// migration to touch this function moves the answer again.
//
// G1 IS THE EXCEPTION AND STAYS ON 000001, because it does not mutate the
// refill at all: it mutates `advance_due_rotations`, which 20260906000002
// leaves alone. Per-mutation, by which function the `from` string belongs to.
const REFILL_DEFINER = 'supabase/migrations/20260906000002_no_starter_grant.sql';
const ADVANCE_DEFINER = 'supabase/migrations/20260906000001_nectar_delivery_allowance.sql';

// MUTATIONS — run with `node scripts/run-mutations.mjs
// scripts/check-nectar-delivery-allowance.mjs`. Every row above is
// behavioural against a real Postgres, so none of them can be greened by a
// comment; what these prove is the other half — that each row is load-bearing
// on the property it names, and that the migration cannot lose a clause
// while the gate stays green. Each mutation is a build somebody could
// plausibly write, not a saboteur.
export const MUTATIONS = [
  {
    row: 'B1',
    why: 'the skip is keyed on equality instead of "at or above", so a member holding more than the target takes a NEGATIVE credit — the postings reverse and the refill CONFISCATES down to 500. This is the exact hazard the ruled sentence produced when "cap" was read as NECTAR_LADDER_CAP_DROPS, arrived at here through a one-character edit instead',
    file: REFILL_DEFINER,
    from: '      if v_credit <= 0 then\n        continue;\n      end if;',
    to: '      if v_credit = 0 then\n        continue;\n      end if;',
  },
  {
    row: 'D1',
    why: 'the consent join is dropped, so a scheduler provisions a wallet for someone who has never been asked — B0 is a rule about who has been asked, and this is the shape that violates it without any client ever calling anything',
    file: REFILL_DEFINER,
    from: '      join public.nectar_consents nc on nc.user_id = cm.profile_id\n',
    to: '',
  },
  {
    row: 'F1',
    why: 'the simulated-mode gate goes, and the mechanic survives the flip to live rails as a permanent subsidy that mints real money on a timer. Built to die means the death has to be structural',
    file: REFILL_DEFINER,
    from: "  if public.ledger_current_mode() <> 'simulated' then\n    return 0;\n  end if;",
    to: "  if false then\n    return 0;\n  end if;",
  },
  {
    row: 'E1',
    why: 'the delivery gate inside the refill goes, so a rotation that never sealed still refills its comb — the ruled string says "with each delivery" and this makes it "with each sweep". The caller\'s v_sealed still guards the tick, which is why the row must be able to see the function\'s own guard: two guards, and only one of them is in the file a later reader edits',
    file: REFILL_DEFINER,
    from: "   where r.id = p_rotation_id and r.sealed_at is not null;",
    to: "   where r.id = p_rotation_id;",
  },
  {
    row: 'G1',
    why: 'THE COUPLED BUILD: the refill moves inside the seal\'s subtransaction. Its failure now rolls back sealed_at/sent_at, the delivery is undone by a gift mechanic, and the tick re-picks that rotation on every sweep until it dead-letters. §1B.31.2 as a mutation rather than a comment',
    file: ADVANCE_DEFINER,
    from: '      perform public.seal_and_send_rotation(r.id);\n      v_sealed := true;',
    to: '      perform public.seal_and_send_rotation(r.id);\n      perform public.nectar_refill_rotation_members(r.id);\n      v_sealed := true;',
  },
  {
    row: 'C1',
    why: 'the idempotency pre-check goes. The unique index on idempotency_key still refuses the duplicate, but it does so as an EXCEPTION inside the per-member block, which the handler turns into a warning — so a replay logs a failure for every member instead of quietly crediting nothing, and the row that claims idempotency would be standing over a build that survives replay by raising',
    file: REFILL_DEFINER,
    from: '      if exists (\n        select 1 from public.ledger_transactions t where t.idempotency_key = v_key\n      ) then\n        continue;\n      end if;',
    to: '      if false then\n        continue;\n      end if;',
  },
  {
    row: null,
    why: 'MUST NOT FIRE — the member loop\'s ORDER BY is removed. It exists for determinism in a log, not for correctness: no row here depends on which member is credited first, and a gate that reddened on this would be pinning a detail nobody ruled',
    file: REFILL_DEFINER,
    from: '       and cm.removed_at is null\n     order by cm.profile_id',
    to: '       and cm.removed_at is null',
  },
];

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');
const require = createRequire(import.meta.url);
// A HARNESS TRAP, AND IT IS THE FIRST GATE IN THIS REPO TO MEET IT.
// `run-mutations.mjs` reads a gate's MUTATIONS by IMPORTING it — and
// importing a module RUNS it. Every other gate that exports MUTATIONS is
// lexical, so that second execution costs milliseconds; this one starts a
// Postgres. The probe's server and the harness's own baseline run then race
// for port 54344 and the same data directory, and the harness reports "the
// gate is not green before any mutation" — a sentence about the gate, for a
// collision the gate never had. The probe import is marked with a `?probe=`
// query, so it is knowable from in here. Read it before doing anything with
// a side effect, including the skip's own process.exit.
const IS_MUTATION_PROBE = new URL(import.meta.url).searchParams.has('probe');

if (!IS_MUTATION_PROBE && process.env.SKIP_PG_GATES === '1') {
  console.log('check-nectar-delivery-allowance: SKIPPED — SKIP_PG_GATES=1 set explicitly');
  process.exit(0);
}
let EmbeddedPostgres;
try { EmbeddedPostgres = require('embedded-postgres').default; require('pg'); }
catch (e) { console.error(`check-nectar-delivery-allowance: FAILED — ${e.message}`); process.exit(1); }

const APPLY = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();

const OWNER = '11111111-1111-1111-1111-111111111111';
const SUBJECT = '22222222-2222-2222-2222-222222222222';
const GIVER = '33333333-3333-3333-3333-333333333333';
const QUIET = '44444444-4444-4444-4444-444444444444';

let passed = 0;
let failed = 0;
const ok = (name) => { passed += 1; console.log(`  ok   ${name}`); };
const bad = (name, detail) => { failed += 1; console.log(`  FAIL ${name}\n         ${detail}`); };

const SUPABASE_ENV = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
grant anon, authenticated, service_role to postgres;
create schema auth; create table auth.users (id uuid primary key, raw_user_meta_data jsonb, email text);
create function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
create schema storage; create table storage.buckets(id text primary key,name text,public boolean);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(n text) returns text[] language sql immutable as $$ select string_to_array(n,'/') $$;
grant usage on schema public,auth,storage to anon,authenticated,service_role;
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
alter default privileges in schema public grant all on functions to anon,authenticated,service_role;`;

async function main() {
  const dataDir = path.join(ROOT, '.nectar-delivery-allowance-pgdata');
  fs.rmSync(dataDir, { recursive: true, force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: 'postgres',
    // Distinct from every other gate's port (54329-54343) so this can run
    // concurrently with the rest of the suite.
    port: 54344,
    persistent: false,
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase('app');
  const client = pg.getPgClient('app');
  await client.connect();
  const warnings = [];
  client.on('notice', (n) => warnings.push(n.message || String(n)));

  const asPostgres = async (fn) => {
    await client.query("select set_config('role','postgres',true)");
    return fn();
  };
  const asUser = async (uid, fn) => {
    await client.query('begin');
    try {
      await client.query("select set_config('role','authenticated',true)");
      await client.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: uid, role: 'authenticated' })]);
      const result = await fn();
      await client.query('commit');
      return result;
    } catch (e) { await client.query('rollback'); throw e; }
  };
  const asService = async (fn) => {
    await client.query('begin');
    try {
      await client.query("select set_config('role','service_role',true)");
      await client.query("select set_config('request.jwt.claims','',true)");
      const result = await fn();
      await client.query('commit');
      return result;
    } catch (e) { await client.query('rollback'); throw e; }
  };

  // What the app would show: the view reports what we owe as a positive
  // number. Read through the same object the client reads, so a sign error
  // in the migration cannot hide behind a matching sign error here.
  const balanceOf = async (uid) => {
    const { rows } = await asPostgres(() =>
      client.query('select available_sats from public.user_nectar_balances where user_id = $1', [uid])
    );
    return rows.length ? Number(rows[0].available_sats) : null;
  };
  // EVERY GUARD IN THIS FUNCTION FAILS INTO THE SAME PER-MEMBER HANDLER,
  // which turns a refusal into a WARNING and moves on. That is the right
  // shape — one member's broken account must not cost the others theirs —
  // but it means removing almost any guard changes NOTHING observable in
  // the ledger: the next layer down (a check constraint, I4, the unique
  // index) refuses instead, the handler swallows it, and the balances land
  // exactly where the correct build would have put them. Four of this
  // gate's own mutations proved that on their first run: B1, D1, F1 and C1
  // all STAYED GREEN over a deleted guard.
  //
  // So the rows assert the SILENCE as well as the state. A guard that
  // refuses is not the same as a guard that never had to fire, and the log
  // is the only place those two differ.
  const refillWarnings = () => warnings.filter((w) => /nectar_refill_rotation_members/.test(w));
  const refillTxns = async (rotationId) => {
    const { rows } = await asPostgres(() =>
      client.query("select idempotency_key from public.ledger_transactions where idempotency_key like 'refill:' || $1 || ':%' order by idempotency_key", [rotationId])
    );
    return rows.map((r) => r.idempotency_key);
  };

  async function mintRotation({ owner, subject, contributors, closesAt = "now() - interval '1 hour'", withEntry = true }) {
    const { rows: combRows } = await asUser(owner, () =>
      client.query("insert into public.combs (owner_id, name) values ($1, 'Allowance Comb') returning id", [owner])
    );
    const combId = combRows[0].id;
    await asPostgres(() =>
      client.query('insert into public.comb_members (comb_id, profile_id) values ($1,$2),($1,$3) on conflict do nothing',
        [combId, subject, contributors[0]])
    );
    const { rows: hiveRows } = await asUser(owner, () =>
      client.query("insert into public.private_hives (owner_id, subject_name, subject_profile_id, is_collective) values ($1,'Rotation',$2,true) returning id", [owner, subject])
    );
    const hiveId = hiveRows[0].id;
    for (const c of contributors) {
      await asUser(owner, () =>
        client.query('insert into public.hive_contributors (hive_id, profile_id, invited_by) values ($1,$2,$3)', [hiveId, c, owner])
      );
    }
    const { rows: rotRows } = await asUser(owner, () =>
      client.query(
        `insert into public.comb_rotations (comb_id, ordinal, hive_id, subject_profile_id, closes_at)
         values ($1, 1, $2, $3, ${closesAt}) returning id`,
        [combId, hiveId, subject]
      )
    );
    if (withEntry) {
      const { rows: volRows } = await asPostgres(() =>
        client.query('select id from public.hive_volumes where hive_id = $1 and sealed_at is null', [hiveId])
      );
      await asUser(contributors[0], () =>
        client.query("insert into public.entries (user_id, hive_id, volume_id, content, entry_date) values ($1,$2,$3,'For the subject',current_date)",
          [contributors[0], hiveId, volRows[0].id])
      );
    }
    return { combId, hiveId, rotationId: rotRows[0].id };
  }

  try {
    await client.query(SUPABASE_ENV);
    for (const file of APPLY) {
      try { await client.query(fs.readFileSync(path.join(MIGRATIONS, file), 'utf8')); }
      catch (e) { throw new Error(`replaying ${file}: ${e.message}`); }
    }
    await client.query('insert into auth.users (id, raw_user_meta_data) values ($1,$2),($3,$4),($5,$6),($7,$8)', [
      OWNER, JSON.stringify({ display_name: 'Owner' }),
      SUBJECT, JSON.stringify({ display_name: 'Subject' }),
      GIVER, JSON.stringify({ display_name: 'Giver' }),
      QUIET, JSON.stringify({ display_name: 'Quiet' }),
    ]);

    const GRANT = Number((await asPostgres(() => client.query('select public.nectar_starter_grant_drops() as g'))).rows[0].g);
    const TARGET = Number((await asPostgres(() => client.query('select public.nectar_delivery_allowance_drops() as t'))).rows[0].t);

    // ------------------------------------------------------------------
    // 0. The premise, checked rather than assumed: the refill target reads a
    //    SERVER-SIDE definition rather than a literal of its own. Lumen's pin
    //    was "one writer" — a fresh number in the migration would be a second
    //    copy of a shared premise, and this row is what makes that falsifiable
    //    from outside. Asserted as a TEXT property of the migration because a
    //    number that happens to equal 500 today would satisfy any behavioural
    //    check.
    //
    //    THE WRITER IT NAMES CHANGED ON 2026-09-06 AND THE ROW HAD TO LEARN TO
    //    FIND IT. This read `nectar_starter_grant_drops()` out of a migration
    //    PINNED BY FILENAME — and that pin is the trap 20260906000001's own
    //    header warns about at its line 36: migrations are replayed in order,
    //    the LAST definition wins, and a row that opens a named file reads a
    //    dead body and goes green over nothing the moment a later migration
    //    redefines the function. 20260906000002 is exactly that migration. It
    //    splits the allowance out of the grant so Colin's zero-grant ruling
    //    could land on the grant alone, and under the old row this gate would
    //    have gone on certifying a body Postgres had already replaced.
    //
    //    SO THE DEFINER IS FOUND, NOT NAMED. Latest migration that DEFINES the
    //    function wins — defines, not mentions — which is the same shape
    //    check-nectar-consent's F1 uses for the grant literal one layer up.
    const definerOf = (fn) => {
      const re = new RegExp(String.raw`create\s+(?:or\s+replace\s+)?function\s+public\.${fn}\s*\(`, 'i');
      let file = null;
      for (const f of APPLY) {
        const src = fs.readFileSync(path.join(MIGRATIONS, f), 'utf8')
          .split('\n').map((l) => (l.trim().startsWith('--') ? '' : l)).join('\n');
        if (re.test(src)) file = f;
      }
      return file;
    };
    // The function's text as the LAST defining migration writes it, from its
    // `create [or replace] function` to its own `comment on function`.
    const definitionOf = (fn, file) => {
      const src = fs.readFileSync(path.join(MIGRATIONS, file), 'utf8');
      const start = new RegExp(String.raw`create\s+(?:or\s+replace\s+)?function\s+public\.${fn}\s*\(`, 'gi');
      let m; let at = -1;
      while ((m = start.exec(src)) !== null) at = m.index;
      const end = src.indexOf(`comment on function public.${fn}`, at);
      return src.slice(at, end === -1 ? undefined : end);
    };
    const REFILL_FN = 'nectar_refill_rotation_members';
    const refillDefiner = definerOf(REFILL_FN);
    {
      const body = definitionOf(REFILL_FN, refillDefiner);
      const readsAWriter = /v_target\s*:=\s*public\.nectar_delivery_allowance_drops\(\)/.test(body);
      // Comments AND string literals stripped before the search. A migration
      // id inside a quoted message is prose the way a `--` line is, and a
      // row that could not tell them apart would red on the explanation
      // rather than on the defect — the comment-hole shape, inverted.
      const executable = body.replace(/--[^\n]*/g, '').replace(/'(?:[^']|'')*'/g, "''");
      const holdsItsOwnNumber = /\b\d{2,}\b/.test(executable);
      if (readsAWriter && !holdsItsOwnNumber) {
        ok(`A0 the refill target has one writer, read out of the migration that LAST defines the function (${refillDefiner}): it reads nectar_delivery_allowance_drops() (${TARGET}) and its executable body holds no multi-digit literal of its own`);
      } else {
        bad('A0 one writer', `definer=${refillDefiner}, reads the allowance=${readsAWriter}, holds its own number=${holdsItsOwnNumber}`);
      }
    }

    // A0a THE GRANT IS NOT THE TARGET ANY MORE, and this row is the half A0
    // cannot state. A0 asks what the refill READS; this asks that the ruling
    // reached the database — the grant is zero, the target is not, and the
    // two are separately settable. Under the pre-split build both calls
    // returned the same number and no row could tell the two questions apart.
    {
      const separable = GRANT === 0 && TARGET > 0;
      separable
        ? ok(`A0a the split is real in the database: the starter grant returns ${GRANT} (Colin's ruling, 2026-09-06) while the delivery allowance returns ${TARGET}. Zeroing the grant did NOT silently switch the allowance off — which it would have done quietly, because the refill's own \`if v_target <= 0 then return 0\` declines rather than raises`)
        : bad('A0a the split is real', `grant=${GRANT} (want 0), allowance=${TARGET} (want > 0)`);
    }

    // A0b THE MUTATION TARGETS NAME THE LATEST DEFINER. Every refill-body
    // mutation above edits a migration FILE, and the harness replays all of
    // them in order — so a mutation applied to a superseded copy of the body
    // is overwritten before a single row runs, and scores as "not caught"
    // over a defect the gate was never given. A coordinate table is stale
    // cargo; this row is what stops this one going stale silently.
    //
    // IT ASSERTS THE FILE AND NOT THE ANCHOR, and the first draft got that
    // wrong in a way worth leaving written down. It also checked that each
    // mutation's `from` string was present in the file it names — which is
    // true of the tree and FALSE OF EVERY MUTATED TREE BY CONSTRUCTION, since
    // removing that string is what a mutation IS. The row reddened on all
    // seven runs, including the must-not-fire, and on the six must-red runs it
    // sat in the caught set next to the row actually being measured, which is
    // how a vacuous red gets mistaken for coverage. A ROW THAT CANNOT SURVIVE
    // THE HARNESS CANNOT BE SCORED BY IT.
    //
    // Nothing is lost: `run-mutations.mjs` already asserts the anchor occurs
    // EXACTLY ONCE in the named file and refuses to run the mutation
    // otherwise, which is the stronger claim. The harness owns "the anchor is
    // in the file"; this row owns "the file is the one Postgres ends up
    // running", which the harness cannot see.
    {
      const stale = MUTATIONS
        .filter((m) => /v_target|nectar_refill_rotation_members|removed_at is null/.test(m.from) && m.file !== ADVANCE_DEFINER)
        .filter((m) => m.file !== `supabase/migrations/${refillDefiner}`)
        .map((m) => `${m.row || 'must-not-fire'} -> ${m.file}`);
      stale.length === 0
        ? ok(`A0b every refill-body mutation targets the migration that last defines the function (${refillDefiner}), so the harness mutates the body Postgres actually runs`)
        : bad('A0b mutation targets', `superseded: [${stale.join('; ')}]`);
    }

    // ------------------------------------------------------------------
    // A/B/D. One delivering rotation, three members in three states.
    //
    // THE FIXTURE HAS TO EARN ITS SUPPLY NOW, and that is the zero-grant
    // ruling reaching this gate. Until 2026-09-06 consent itself minted 500
    // drops, so a consented member arrived here already funded and the rows
    // below could spend straight away. A new account now opens EMPTY, which
    // means THE ONLY WAY A DROP ENTERS AN ACCOUNT IN THIS PRODUCT IS A
    // DELIVERY — this mechanic is the sole supply. So the fixture opens with
    // a real delivering rotation whose only job is to fund the two members,
    // and every row after it runs against balances the allowance itself put
    // there.
    //
    // THAT IS A STRONGER FIXTURE THAN THE ONE IT REPLACES, not a workaround.
    // The old one could not have caught a refill that credited nobody on a
    // FIRST delivery, because the grant had already put the money in; here
    // the seeding tick is asserted, so a refill that only ever tops up an
    // account someone else funded reds before row A2 is reached.
    await asUser(GIVER, () => client.query('select * from public.consent_to_nectar()'));
    await asUser(SUBJECT, () => client.query('select * from public.consent_to_nectar()'));
    // QUIET never consents. Their wallet must not be conjured by a tick.

    {
      const atConsent = await balanceOf(GIVER);
      (atConsent ?? 0) === GRANT && GRANT === 0
        ? ok(`A0c a consented account opens EMPTY: the giver holds ${atConsent ?? 0} drops after consenting, and consent minted nothing. Colin's ruling asserted where a person would meet it — through the real RPC, against a real ledger`)
        : bad('A0c consent mints nothing', `giver balance after consent = ${atConsent}, grant = ${GRANT}`);
    }

    // The seeding delivery. Its own comb, so the rotation under test below is
    // still a member's FIRST refill for that rotation and C's idempotency key
    // is untouched by it.
    const seed = await mintRotation({ owner: OWNER, subject: SUBJECT, contributors: [GIVER] });
    warnings.length = 0;
    await asService(() => client.query('select public.advance_due_rotations()'));
    {
      const g = await balanceOf(GIVER);
      const sub = await balanceOf(SUBJECT);
      const seedWarnings = refillWarnings();
      g === TARGET && sub === TARGET && seedWarnings.length === 0
        ? ok(`A0d THE FIRST CREDIT OF A PERSON'S LIFE IS A DELIVERY: two members who consented to an empty account are at ${TARGET} after a comb they are in delivers, and the tick raised nothing. With the grant at zero this mechanic is the ONLY supply in the product — a refill that could only top up a pre-funded account would red here`)
        : bad('A0d the first credit', `giver ${g}, subject ${sub}, want ${TARGET} each; warnings=${JSON.stringify(seedWarnings)}`);
    }
    void seed;

    const due = await mintRotation({ owner: OWNER, subject: SUBJECT, contributors: [GIVER] });
    await asPostgres(() => client.query('insert into public.comb_members (comb_id, profile_id) values ($1,$2) on conflict do nothing', [due.combId, QUIET]));

    // Spend GIVER down, and in the same movement put SUBJECT above the
    // target — one real transfer, two of the three states this gate needs.
    const SPEND = 380;
    await asUser(GIVER, () => client.query('select * from public.send_comb_nectar_note($1,$2,$3,$4,$5)',
      [crypto.randomUUID(), due.combId, SUBJECT, 'You make this brighter', SPEND]));

    const beforeGiver = await balanceOf(GIVER);
    const beforeSubject = await balanceOf(SUBJECT);
    if (beforeGiver === TARGET - SPEND && beforeSubject === TARGET + SPEND) {
      ok(`A1 the fixture is in the state the rows need before the tick: giver ${beforeGiver} (below the target), subject ${beforeSubject} (above it)`);
    } else {
      bad('A1 fixture state', `giver=${beforeGiver} (want ${TARGET - SPEND}), subject=${beforeSubject} (want ${TARGET + SPEND})`);
    }

    warnings.length = 0;
    await asService(() => client.query('select public.advance_due_rotations()'));
    const tickWarnings = refillWarnings();

    {
      const { rows } = await asPostgres(() => client.query('select sealed_at, sent_at from public.comb_rotations where id = $1', [due.rotationId]));
      rows[0].sealed_at && rows[0].sent_at
        ? ok('A2 the rotation delivered — the allowance rides a real delivery, not a swept row')
        : bad('A2 the rotation delivered', JSON.stringify(rows[0]));
    }

    {
      const after = await balanceOf(GIVER);
      after === TARGET
        ? ok(`A3 THE REFILL: a consented member who had spent down to ${beforeGiver} is topped back up to the target (${TARGET}) at the delivery, through the tick`)
        : bad('A3 the refill', `giver balance after the tick = ${after}, want ${TARGET}`);
    }

    {
      const after = await balanceOf(SUBJECT);
      const keys = await refillTxns(due.rotationId);
      const wroteForSubject = keys.some((k) => k.endsWith(`:${SUBJECT}`));
      if (after === beforeSubject && !wroteForSubject && tickWarnings.length === 0) {
        ok(`B1 NEVER TAKES, and it is a SKIP rather than a refusal: a member holding ${after} (above the target) is not written AT ALL — no invoice, no transaction, no posting — and the tick raised zero refill warnings. The silence is half the row: with the "at or above" test weakened to equality, a negative credit is refused one layer down by strike_invoices' amount check, the balances land in exactly the same place, and only the log knows`);
      } else {
        bad('B1 never takes', `subject balance ${beforeSubject} -> ${after}, refill transaction written for them=${wroteForSubject}, refill warnings=${JSON.stringify(tickWarnings)}`);
      }
    }

    {
      const { rows } = await asPostgres(() => client.query(
        'select (select count(*)::int from public.ledger_accounts where owner_user_id = $1) accounts, (select count(*)::int from public.nectar_consents where user_id = $1) consents', [QUIET]));
      const namedInLog = tickWarnings.some((w) => w.includes(QUIET));
      rows[0].accounts === 0 && rows[0].consents === 0 && !namedInLog
        ? ok('D1 a member who never consented is not given a wallet by a scheduler — zero ledger accounts, zero consent rows, and their id appears in no warning. The last clause is the load-bearing one: drop the consent join and they are still not credited (they have no account, so the loop refuses them), but the refusal is a warning about a person who was never in scope. Not-credited and not-considered are different claims')
        : bad('D1 unconsented member untouched', `${JSON.stringify(rows[0])}, named in a refill warning=${namedInLog}`);
    }

    // ------------------------------------------------------------------
    // C. Idempotency, keyed per (rotation, member).
    //
    // THE FIXTURE HAS TO SPEND FIRST, and that correction is the mutation
    // earning its keep. The first draft replayed the refill against an
    // untouched balance — where `v_credit <= 0` returns before the key is
    // ever consulted, so the row proved the CREDIT guard and called it
    // idempotence. Deleting the pre-check entirely left it green. A replay
    // only reaches the key when the member is below the target again, which
    // is what a spend after the delivery produces.
    //
    // Called directly rather than through the tick, because the tick's own
    // WHERE clause excludes a sealed rotation — a row that swept twice would
    // prove the WHERE clause, not the key.
    {
      const SPEND_AGAIN = 100;
      await asUser(GIVER, () => client.query('select * from public.send_comb_nectar_note($1,$2,$3,$4,$5)',
        [crypto.randomUUID(), due.combId, SUBJECT, 'And again thank you', SPEND_AGAIN]));
      const spent = await balanceOf(GIVER);
      const before = await refillTxns(due.rotationId);
      warnings.length = 0;
      const { rows } = await asPostgres(() => client.query('select public.nectar_refill_rotation_members($1) as n', [due.rotationId]));
      const replayWarnings = refillWarnings();
      const after = await refillTxns(due.rotationId);
      const balance = await balanceOf(GIVER);
      if (Number(rows[0].n) === 0 && after.length === before.length && balance === spent && replayWarnings.length === 0) {
        ok(`C1 idempotent per (rotation, member), and QUIETLY: with the giver spent back down to ${spent} — below the target, so the credit guard does NOT short-circuit and the key is genuinely consulted — a replay credits 0, writes no new transaction, and raises nothing. Without the pre-check the unique index still refuses the duplicate, same balances and same transaction count, but as an exception per member. Surviving a replay by raising is not idempotence`);
      } else {
        bad('C1 idempotency', `spent to ${spent}, replay credited ${rows[0].n}, transactions ${before.length} -> ${after.length}, giver balance ${balance}, warnings=${JSON.stringify(replayWarnings)}`);
      }
    }

    // ------------------------------------------------------------------
    // E. A rotation that did not deliver refills nobody. The allowance
    //    rides the DELIVERY — that is what makes the ruled string ("with
    //    each delivery") true of the mechanic and not just of the copy.
    {
      const quietRot = await mintRotation({ owner: OWNER, subject: SUBJECT, contributors: [GIVER], withEntry: false });
      await asPostgres(() => client.query('update public.ledger_postings set amount_sats = amount_sats where false'));
      const spendAgain = await asUser(GIVER, () => client.query('select * from public.send_comb_nectar_note($1,$2,$3,$4,$5)',
        [crypto.randomUUID(), quietRot.combId, SUBJECT, 'Thank you again', 200]));
      void spendAgain;
      const before = await balanceOf(GIVER);
      await asService(() => client.query('select public.advance_due_rotations()'));
      const { rows } = await asPostgres(() => client.query('select sealed_at, voided_at, voided_reason from public.comb_rotations where id = $1', [quietRot.rotationId]));
      const after = await balanceOf(GIVER);
      const keys = await refillTxns(quietRot.rotationId);
      if (!rows[0].sealed_at && rows[0].voided_at && after === before && keys.length === 0) {
        ok(`E1 a rotation that VOIDED (${rows[0].voided_reason}) refills nobody: the giver stays at ${after} and zero refill transactions exist for it. The allowance is gated on the seal, so an empty window costs the delivery and the allowance together`);
      } else {
        bad('E1 no delivery, no refill', `sealed=${rows[0].sealed_at} voided=${rows[0].voided_at} balance ${before} -> ${after}, refill keys ${keys.length}`);
      }
    }

    // ------------------------------------------------------------------
    // F. Live rails are a no-op. The mechanic is BUILT TO DIE: under real
    //    money it is replaced by a top-up the person pays for, and a refill
    //    that survived the flip would be a permanent subsidy nobody signed
    //    up for. Asserted by flipping the mode, not by reading the guard.
    //
    //    THE FLIP HAPPENS BEFORE THE TICK, and that is the second correction
    //    mutation testing bought. Calling the refill directly against a
    //    rotation nobody had sealed meant the DELIVERY guard returned first
    //    and the mode check was never reached — deleting it left this row
    //    green. Sealing inside the same live tick is what puts the mode
    //    check on the path.
    {
      const liveRot = await mintRotation({ owner: OWNER, subject: SUBJECT, contributors: [GIVER] });
      const before = await balanceOf(GIVER);
      await asPostgres(() => client.query("update public.ledger_settings set rails_mode = 'live'"));
      warnings.length = 0;
      await asService(() => client.query('select public.advance_due_rotations()'));
      const liveWarnings = refillWarnings();
      await asPostgres(() => client.query("update public.ledger_settings set rails_mode = 'simulated'"));
      const { rows } = await asPostgres(() => client.query('select sealed_at from public.comb_rotations where id = $1', [liveRot.rotationId]));
      const after = await balanceOf(GIVER);
      const keys = await refillTxns(liveRot.rotationId);
      rows[0].sealed_at && after === before && keys.length === 0 && liveWarnings.length === 0
        ? ok(`F1 under live rails a real DELIVERY refills nobody, and it is the FUNCTION that declines: the rotation sealed, the giver stays at ${after}, nothing is written, nothing is raised. Delete the mode check and every one of those still holds except the last — I4 refuses the simulated poll row underneath, so the mechanic fails into a warning per member per delivery instead of never running. Built to die means declining, not being refused`)
        : bad('F1 live is a no-op', `sealed=${rows[0].sealed_at}, balance ${before} -> ${after}, refill keys ${keys.length}, warnings=${JSON.stringify(liveWarnings)}`);
    }

    // ------------------------------------------------------------------
    // G. THE COUPLING PROPERTY, and it is the reason the refill is a THIRD
    //    subtransaction rather than a step inside the seal's. Substitute a
    //    refill that always raises: the delivery must still commit, and the
    //    failure must be LOUD (a warning naming the rotation) rather than
    //    swallowed. Under the coupled build this row reds twice over —
    //    sealed_at is null and the tick would re-pick the row forever.
    {
      const couplingRot = await mintRotation({ owner: OWNER, subject: SUBJECT, contributors: [GIVER] });
      await asPostgres(() => client.query(`
        create or replace function public.nectar_refill_rotation_members(p_rotation_id uuid)
        returns int language plpgsql security definer set search_path = public, pg_temp
        as $mutant$ begin raise exception 'refill exploded'; end $mutant$;`));
      warnings.length = 0;
      await asService(() => client.query('select public.advance_due_rotations()'));
      const { rows } = await asPostgres(() => client.query('select sealed_at, sent_at, seal_attempts, seal_dead_lettered_at from public.comb_rotations where id = $1', [couplingRot.rotationId]));
      const surfaced = warnings.some((w) => /advance_due_rotations: nectar refill for rotation/.test(w) && /refill exploded/.test(w));
      // Put the real function back before anything else runs against it, and
      // put back the one the DATABASE had — the latest definer, not the file
      // that introduced it. Restoring 20260906000001's body here would have
      // silently reverted the target to the ruled-to-zero grant for every row
      // after this one, which is a mutation nobody wrote.
      const fnText = definitionOf(REFILL_FN, refillDefiner);
      await asPostgres(() => client.query(fnText.replace(/^create\s+function/i, 'create or replace function')));
      if (rows[0].sealed_at && rows[0].sent_at && rows[0].seal_attempts === 0 && !rows[0].seal_dead_lettered_at && surfaced) {
        ok('G1 THE COUPLING PROPERTY: with a refill that always raises, the delivery still commits (sealed + sent, zero seal attempts, not dead-lettered) and the failure surfaces as its own warning naming the rotation. A refill written inside the seal block would have rolled sealed_at back and left the tick re-picking that row forever — §1B.31.2, asserted rather than commented');
      } else {
        bad('G1 coupling', `${JSON.stringify(rows[0])}, warning surfaced=${surfaced}, warnings=${JSON.stringify(warnings.slice(-4))}`);
      }
    }

    // ------------------------------------------------------------------
    // H. The grant boundary. The prod-schema sentinel for this migration
    //    reads a 42501 from anon as proof the function exists; that proof is
    //    only sound while the function is genuinely closed to client roles.
    // BOTH ROLES GO THROUGH AN EXPLICIT TRANSACTION, and that is not
    // ceremony. `set_config(..., true)` is LOCAL to the current transaction,
    // so issued outside one it lasts exactly one statement and the call
    // under test runs as the superuser — which succeeds, and reads as "the
    // grant boundary is open" when it is the instrument that was open. The
    // authenticated row was already correct only because `asUser` opens a
    // `begin`; the anon row was not, and it caught itself on its first run.
    const asAnon = async (fn) => {
      await client.query('begin');
      try {
        await client.query("select set_config('role','anon',true)");
        await client.query("select set_config('request.jwt.claims','',true)");
        const result = await fn();
        await client.query('commit');
        return result;
      } catch (e) { await client.query('rollback'); throw e; }
    };
    for (const [label, run] of [
      ['anon', () => asAnon(() => client.query('select public.nectar_refill_rotation_members($1)', [due.rotationId]))],
      ['authenticated', () => asUser(OWNER, () => client.query('select public.nectar_refill_rotation_members($1)', [due.rotationId]))],
    ]) {
      try {
        await run();
        bad(`H1 ${label} cannot call nectar_refill_rotation_members`, 'call succeeded');
      } catch (e) {
        /permission denied/i.test(e.message)
          ? ok(`H1 ${label} cannot call nectar_refill_rotation_members — 42501, which is what the prod-schema sentinel reads as "this migration landed"`)
          : bad(`H1 ${label} cannot call nectar_refill_rotation_members`, e.message.split('\n')[0]);
      }
    }
  } finally {
    await client.end().catch(() => {});
    await pg.stop().catch(() => {});
    fs.rmSync(dataDir, { recursive: true, force: true });
  }

  console.log(`\ncheck-nectar-delivery-allowance: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

if (!IS_MUTATION_PROBE) {
  main().catch((e) => { console.error(`check-nectar-delivery-allowance: FAILED — ${e.message}`); process.exit(1); });
}
