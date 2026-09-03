#!/usr/bin/env node
// prod-anon-definer-check — can anon EXECUTE the SECURITY DEFINER functions on
// PRODUCTION that this tree says it cannot?
//
// PRE-DEPLOY / POST-DEPLOY COMMAND, NOT A GATE. Deliberately not named
// `scripts/check-*.mjs`: run-checks.mjs enumerates that pattern off disk with
// no opt-out, and this probe must not be in the `npm test` chain — it needs a
// network, a real anon key, and a prod URL, none of which CI has, and a red
// meaning "prod's grants drifted" is not a code defect.
//
//   npm run preflight:prod-anon-definers
//
// WHY IT EXISTS SEPARATELY FROM check-share-visibility.mjs
//
// check-share-visibility.mjs asserts the grant table against the catalog of an
// EMBEDDED Postgres built from supabase/migrations/ on disk. That is a claim
// about the files, and it is airtight about the files. It cannot see prod. A
// grant applied by hand in the Supabase dashboard, a migration that half
// applied, or a `grant execute on all functions in schema public` typed into
// the SQL editor at 2am leaves the tree green and the database open. Those are
// the only ways this can drift, and all three are invisible to every gate in
// the suite. Both consumers read the SAME rows, from lib/definer-grants.mjs,
// so the two instruments cannot disagree about what was expected.
//
// WHAT IT ASKS, AND WHY THE ANSWER IS SAFE TO ASK FOR
//
// One POST per callable row, as anon, with a DELIBERATELY MALFORMED uuid in
// one argument. Measured live against prod on 2026-09-03:
//
//   seal_hive(p_hive_id: "not-a-uuid")            anon revoked  -> 401 / 42501
//   seal_volume(p_hive_id: "not-a-uuid")          anon revoked  -> 401 / 42501
//   is_hive_contributor(p_hive_id: "not-a-uuid")  anon granted  -> 400 / 22P02
//   owns_entry(p_entry_id: "not-a-uuid")          anon granted  -> 400 / 22P02
//
// The EXECUTE privilege check fires BEFORE argument coercion. So a poisoned
// argument is both fully discriminating — 42501 means no EXECUTE, 22P02 means
// EXECUTE and the body did not start — and incapable of doing anything. That
// matters more than it sounds: an earlier draft of the payload table called
// every function with VALID arguments, including twelve production writers. A
// probe that fires the writer whenever the vulnerability is present is not a
// gate, it is an exploit. check-share-visibility.mjs now asserts the poisoning
// in `npm test`, so the payloads cannot quietly lose it.
//
// THREE THINGS IT CANNOT REACH, REPORTED AS NOT-COVERED RATHER THAN GREEN
//
//   unsafe   delete_own_account(), consent_to_nectar(), advance_due_rotations()
//            take no arguments. There is nothing to poison, and PostgREST
//            answers PGRST202 to any EXTRA key, so there is no harmless call
//            to make. advance_due_rotations() would seal and send every due
//            rotation in production. Refused on purpose; any unanswered
//            `unsafe` row makes the whole run INDETERMINATE (exit 3), never 0.
//   trigger  PostgREST does not expose functions returning `trigger` at all,
//            and Postgres refuses a direct call regardless of the catalog, so
//            the answer would carry no grant information. Not a coverage gap:
//            being uncallable is exactly why an inert grant is not a leak.
//            Asserted locally, skipped here.
//   role     This probe holds the anon key only. It answers anon's half of
//            each row and says nothing about `authenticated` or
//            `service_role`; those stay with the local catalog assertion.
//
// PGRST202 MASKS THE PRIVILEGE ANSWER ENTIRELY
//
// A function that does not exist, and a real function addressed by the wrong
// argument NAME, both answer PGRST202/404 — PostgREST resolves an RPC on the
// COMPLETE named-argument set, so a partial set reads as "no such function"
// too. So PGRST202 can never be scored as "anon revoked": it is reported as
// NOT-DEPLOYED, and the argument names are held to the catalog by
// check-share-visibility.mjs in `npm test`, which is the only place that
// comparison can be made.
//
// Exit codes:
//   0  every callable row's anon state matches lib/definer-grants.mjs AND no
//      row was left unanswered. Unreachable while any `unsafe` row exists.
//   1  a real finding: anon can execute something the tree says it cannot,
//      anon cannot execute something the tree says it can, or a function is
//      not on prod at all
//   2  the instrument itself failed (env missing, network, calibration) — NOT
//      a statement about prod either way
//   3  INDETERMINATE: no mismatch found, but rows were left unanswered. Not a
//      pass. `check-share-visibility.mjs` plus an authenticated
//      `supabase migration list` are what settle the unsafe rows.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFINER_GRANTS } from './lib/definer-grants.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Env — process.env first, then ./.env. Missing creds are exit 2, never a
// green skip: a preflight that "passes" because it could not run is the
// authorised-skip hole this repo already closed once in CI.
// ---------------------------------------------------------------------------
const readEnvFile = () => {
  const path = resolve(ROOT, '.env');
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*(EXPO_PUBLIC_SUPABASE_(?:URL|ANON_KEY))\s*=\s*(.+?)\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
};

const fileEnv = readEnvFile();
const URL_ = process.env.EXPO_PUBLIC_SUPABASE_URL || fileEnv.EXPO_PUBLIC_SUPABASE_URL;
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || fileEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const die = (code, msg) => {
  console.error(`\nprod-anon-definer-check: ${msg}`);
  console.error({
    1: 'This is a verdict about production grants. Fix the grant on prod, or fix the row in scripts/lib/definer-grants.mjs — whichever is wrong.',
    2: 'This is an instrument failure — it says nothing about prod either way.',
    3: 'INDETERMINATE — not a pass. Nothing mismatched, but rows were left unanswered, and an unanswered row is not a revoked one.',
  }[code]);
  process.exit(code);
};

if (!URL_ || !ANON) {
  die(2, 'EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY not set and not found in .env — cannot probe. (Not a pass: exit 2.)');
}

const req = async (path, init = {}) => {
  const res = await fetch(`${URL_}${path}`, {
    ...init,
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json', ...init.headers },
    signal: AbortSignal.timeout(10000),
  });
  let body = null;
  try { body = await res.json(); } catch { /* empty or non-JSON body */ }
  return { status: res.status, code: body?.code ?? body?.statusCode ?? null, message: body?.message ?? '' };
};

const callRpc = (fn, args) => req(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args ?? {}) });

// REVOKED / GRANTED / NOT-DEPLOYED / INSTRUMENT(detail)
//
// The classifier discriminates on the ERROR CODE, never on the HTTP status:
// 42501 arrives as 401 and 22P02 as 400, but a body that runs and returns
// cleanly arrives as 200, and a body that runs and raises its own exception
// arrives as 400 with a different code. Grouping "everything that is not
// 42501 and not PGRST202" as GRANTED is the conservative direction — it
// reports a grant where there might merely be a surprising body, which is a
// loud false positive rather than a silent false negative.
const classify = (r) => {
  if (r.code === '42501') return 'REVOKED';
  if (r.code === 'PGRST202') return 'NOT-DEPLOYED';
  if (r.status === 200) return 'GRANTED';
  if (r.code) return 'GRANTED';
  return `INSTRUMENT(${r.status}/no code: ${r.message.slice(0, 60)})`;
};

const main = async () => {
  console.log(`prod-anon-definer-check against ${URL_}\n\ncalibration`);

  // Calibration 1 — key + URL + PostgREST. A fabricated name belongs to no
  // migration by construction; PGRST202 can only be spoken by PostgREST with
  // the key already accepted (a bad key dies at the gateway as 401 before
  // PostgREST answers; a wrong URL never says PGRST202).
  let fab;
  try {
    fab = await callRpc('prod_anon_definer_check_fabricated_fn', {});
  } catch (e) {
    die(2, `network failure during calibration: ${e.message}`);
  }
  if (fab.code !== 'PGRST202') {
    die(2, `fabricated rpc answered ${fab.status}/${fab.code ?? '??'}, expected PGRST202 — key revoked, URL wrong, prod unreachable, or the missing-function signal is not trustworthy in this run.`);
  }
  console.log('  ok      fabricated rpc -> PGRST202 (proves key+URL+PostgREST)');

  const rows = [];
  for (const [sig, spec] of DEFINER_GRANTS) {
    const fn = sig.slice(0, sig.indexOf('('));
    const expected = spec.roles.includes('anon') ? 'GRANTED' : 'REVOKED';
    if (spec.probe?.kind !== 'call') {
      rows.push({ sig, fn, expected, observed: 'NOT-COVERED', kind: spec.probe?.kind ?? 'none' });
      continue;
    }
    let r;
    try { r = await callRpc(fn, spec.probe.args); } catch (e) { die(2, `network failure probing ${sig}: ${e.message}`); }
    rows.push({ sig, fn, expected, observed: classify(r), kind: 'call', raw: `${r.status}/${r.code ?? 'ok'}` });
  }

  // Calibration 2 — the 42501 signal must be discriminating IN THIS RUN, and
  // the failure mode it guards against is the dangerous direction. A single
  // regressed grant shows up as one MISMATCH row and must not be swallowed as
  // an instrument failure; but if EVERY anon-expected row answers 42501 at
  // once, the likelier reading is not four simultaneous regressions, it is
  // `revoke usage on schema public from anon` — under which this script
  // reports the whole map correctly revoked and exits 0 while saying nothing.
  // A run where nothing anywhere came back GRANTED cannot tell those apart,
  // so it refuses to render a verdict.
  const callable = rows.filter((r) => r.kind === 'call');
  const anonExpected = callable.filter((r) => r.expected === 'GRANTED');
  if (anonExpected.length > 0 && anonExpected.every((r) => r.observed === 'REVOKED')) {
    die(2, `all ${anonExpected.length} anon-expected function(s) answered 42501. Either every one of them regressed at once, or anon lost USAGE on schema public / the key lost its role — under which every row below reads "correctly revoked" for a reason that has nothing to do with its grant. This run cannot tell those apart.`);
  }
  if (anonExpected.length > 0) {
    console.log(`  ok      ${anonExpected.filter((r) => r.observed !== 'REVOKED').length}/${anonExpected.length} anon-expected function(s) answered non-42501 (proves the 42501 signal is a grant answer, not a blanket denial)`);
  }

  const pad = Math.max(...rows.map((r) => r.sig.length));
  console.log('\nSECURITY DEFINER functions in public (anon half only)');
  for (const row of rows) {
    const verdict =
      row.observed === 'NOT-COVERED' ? `not covered (${row.kind})`
      : row.observed === 'NOT-DEPLOYED' ? 'NOT ON PROD'
      : row.observed === row.expected ? `ok, anon ${row.expected.toLowerCase()}`
      : row.observed.startsWith('INSTRUMENT') ? row.observed
      : `MISMATCH: expected ${row.expected.toLowerCase()}, prod says ${row.observed.toLowerCase()}`;
    console.log(`  ${row.sig.padEnd(pad)}  ${verdict}${row.raw ? `  [${row.raw}]` : ''}`);
  }

  const instrument = callable.filter((r) => r.observed.startsWith('INSTRUMENT'));
  const notDeployed = callable.filter((r) => r.observed === 'NOT-DEPLOYED');
  const mismatched = callable.filter((r) => r.observed !== r.expected && !r.observed.startsWith('INSTRUMENT') && r.observed !== 'NOT-DEPLOYED');
  const unsafe = rows.filter((r) => r.kind === 'unsafe');
  const triggers = rows.filter((r) => r.kind === 'trigger');

  console.log(
    `\n  ${rows.length} row(s): ${callable.length} probed, ${triggers.length} trigger (uncallable by design, asserted in npm test), `
    + `${unsafe.length} unsafe (refused — no argument to poison)`
  );

  if (instrument.length) {
    die(2, `probe(s) answered something this script cannot classify: ${instrument.map((r) => `${r.sig} ${r.observed}`).join('; ')}`);
  }

  // A finding outranks incompleteness: report the mismatch before the
  // indeterminacy, or a real grant leak sits behind an exit 3 that reads as
  // housekeeping.
  if (mismatched.length) {
    const leaks = mismatched.filter((r) => r.observed === 'GRANTED');
    die(1,
      `${mismatched.length} function(s) disagree with scripts/lib/definer-grants.mjs on prod`
      + (leaks.length ? `, and ${leaks.length} of them are anon-executable on production right now: ${leaks.map((r) => r.sig).join(', ')}` : '')
      + `.\n${mismatched.map((r) => `  ${r.sig}: expected anon ${r.expected.toLowerCase()}, prod says ${r.observed.toLowerCase()} [${r.raw}]`).join('\n')}`
    );
  }

  if (notDeployed.length) {
    die(1,
      `${notDeployed.length} function(s) are not on prod at all (PGRST202). Their grants are neither correct nor incorrect — they do not exist.\n`
      + `  ${notDeployed.map((r) => r.sig).join('\n  ')}\n`
      + `Run \`npm run preflight:prod-schema\` — this is the same finding from the other end.\n`
      + `(Argument-name drift answers PGRST202 identically; check-share-visibility.mjs holds every payload to the catalog in \`npm test\`, so a green suite rules that reading out.)`
    );
  }

  if (unsafe.length) {
    die(3,
      `every probed row matches, but ${unsafe.length} row(s) were refused rather than answered: ${unsafe.map((r) => r.sig).join(', ')}. `
      + `They take no arguments, so there is no poisoned call that leaves the body unrun — and advance_due_rotations() would seal and send every due rotation in production. `
      + `Their anon revoke is asserted by check-share-visibility.mjs against the migrations on disk; what settles it for PROD is an authenticated \`supabase migration list\` confirming the revoking migration is applied.`
    );
  }

  console.log(`\n  every probed function's anon grant matches this tree, and no row was left unanswered.`);
};

main().catch((e) => die(2, `unexpected failure: ${e.stack ?? e.message}`));
