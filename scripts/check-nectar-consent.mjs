// Gate for DES-28 Deliverable 7 — the nectar surfaces' PRE-CONSENT ABSENCE.
//
//   npm run check:nectar-consent
//
// WHAT IT IS FOR, stated plainly because the gate is green today and will be
// green tomorrow: it arms a transition nobody is scheduled to notice. The
// same shape as check-legal-consent-gate.mjs, and for the same reason — the
// instruction it protects is otherwise a comment somebody has to remember.
//
// Deliverable 7 says every nectar surface is ABSENT before consent, on
// Apple 2.3.1(a) grounds. Absence is a claim with no pixels: the pre-consent
// state of this app is the app as it ships today, so there is no screen to
// review and no frame that could show the requirement being kept. The only
// way it survives contact with five future PRs is a gate that reds the first
// time a nectar surface renders outside the guard.
//
// FOUR RULE GROUPS, and their honest strengths differ:
//
//   A  universe        the usual counts-before-loops (run-checks.mjs's
//                      requirement on gates).
//   B  word reserve    REAL and behavioural. Every rendered string matching
//                      the money lexicon must sit under the `nectarConsent`
//                      guard. Zero strings match today, so B is calibrated
//                      against a synthetic corpus with known verdicts —
//                      otherwise a broken regex and a clean tree are the
//                      same green.
//   C  default is NO   evaluates `hasNectarConsent` over the shapes an
//                      unprovisioned account can take. Evaluated, not
//                      regexed.
//   D  placement       for a surface whose container EXISTS, the declared
//                      anchor must still be there — a rename reds instead of
//                      silently orphaning a placement. For a surface whose
//                      container does NOT exist, either a named probe still
//                      finds nothing, or the entry declares itself
//                      unprobeable IN THE TREE. D3 is a declaration-
//                      completeness row and says so in its own label: an
//                      absence claim inherits the scope of the probe that
//                      produced it, and "no probe" is a scope of nothing.
//
// WHAT THIS GATE CANNOT DO. It is lexical. A nectar surface that renders no
// string — a bare icon, an unlabelled pressable — is invisible to rule B.
// That is not hypothetical: DES-28 D3 is exactly such a surface (a 16pt drop
// icon). Rule D is what covers it, by anchor rather than by word, and rule D
// only covers surfaces someone remembered to declare in NECTAR_SURFACES.
// The population is a declaration; nothing here discovers a sixth surface.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir, access } from 'node:fs/promises';
import { parse } from '@babel/parser';
import {
  POSITIONS,
  collectRenderedStrings,
  isUnderGuard,
  PositionVocabularyError,
} from './lib/rendered-strings.mjs';
import {
  NECTAR_CONSENT_GUARD,
  NECTAR_RESERVE,
  NECTAR_SURFACES,
  hasNectarConsent,
} from '../src/constants/nectar.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let pass = 0;
let fail = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? (pass += 1) : (fail += 1);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
};

const reserve = NECTAR_RESERVE.map((r) => new RegExp(r.source, r.flags));
const matchesReserve = (s) => reserve.some((re) => re.test(s));

// --- A. Universe ---------------------------------------------------------
const sourceFiles = async (dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await sourceFiles(p)));
    else if (entry.name.endsWith('.js')) out.push(p);
  }
  return out;
};

// ONE FILE IS EXCLUDED, and it is this gate's own input. src/constants/
// nectar.js is prose ABOUT the surfaces — each entry's `note` says what the
// missing container is and why — and `constant` position collects every
// string literal in src/constants/ because that is where this app's authored
// copy lives. So the declaration of the rule matches the rule. That is not a
// defect in either; a rule that reds on its own statement cannot be written
// down at all.
//
// The exclusion is frozen at exactly one name so it cannot grow quietly, and
// it is CONTROLLED rather than trusted: D6 below asserts that nothing in the
// tree imports NECTAR_SURFACES, which is the only export whose values carry
// prose. `hasNectarConsent` and `NECTAR_CONSENT_GUARD` may be imported
// anywhere — they are a function and a name, and neither can reach a screen
// as text. The day a surface renders a declaration's own words, D6 reds and
// this exclusion has to be re-argued instead of quietly covering it.
const SELF = 'src/constants/nectar.js';
const allFiles = ['App.js', ...(await sourceFiles(path.join(ROOT, 'src'))).map((p) => path.relative(ROOT, p))].sort();
const files = allFiles.filter((f) => f !== SELF);
check('A1 source universe is non-empty (App.js + src/**/*.js)', files.length > 0, true);
check('A1a the one excluded file is this gate\'s own declaration module, and it is present', allFiles.filter((f) => f === SELF), [SELF]);

const parsed = [];
const parseFailures = [];
for (const rel of files) {
  try {
    const src = await readFile(path.join(ROOT, rel), 'utf8');
    parsed.push({ rel, src, ast: parse(src, { sourceType: 'module', plugins: ['jsx'] }) });
  } catch (e) {
    parseFailures.push(`${rel}: ${e.message}`);
  }
}
check('A2 every enumerated file parses', parseFailures, []);
check('A3 the declared surface population is non-empty', NECTAR_SURFACES.length > 0, true);

// --- B. The word reserve -------------------------------------------------
// SCOPE IS EVERY POSITION THE WALKER EMITS, including `alert` and
// `constant`, which check-demo-content-callsites deliberately excludes from
// its own rule 1. Its exclusion is right for its question and wrong for
// this one: it excludes them because a lexical guard cannot ENCLOSE a
// handler-bound or module-scope string, so requiring a guard there would red
// correct code. Here the required answer for those positions is not "guarded"
// but "absent" — a preset amount frozen in src/constants/ is a nectar surface
// whether or not any conditional could ever wrap it, and the copy for a
// feature nobody has consented to has no business being authored at module
// scope. So an unguardable position is a FAILURE here rather than an
// exemption, and the label says which kind of failure it is.
const GUARDABLE = new Set(['jsx-text', 'jsx-expr', 'prop']);
const allStrings = [];
const vocabularyErrors = [];
for (const { rel, ast } of parsed) {
  try {
    for (const s of collectRenderedStrings(ast, { file: rel, positions: POSITIONS })) {
      allStrings.push({ rel, ...s });
    }
  } catch (e) {
    if (!(e instanceof PositionVocabularyError)) throw e;
    vocabularyErrors.push(`${rel}: ${e.message}`);
  }
}
check('B1 every emitted position is declared in POSITIONS', vocabularyErrors, []);
check('B2 rendered-string universe is non-empty', allStrings.length > 0, true);

// B3 CALIBRATION. Zero strings in this tree match the reserve, so every
// behavioural row below passes over an empty set and would pass just as
// cleanly with a regex that matches nothing at all. This row is the control:
// the patterns are run against a fixed corpus whose verdicts are the measured
// facts recorded in constants/nectar.js, including the two real non-money
// uses of "drop" that are the reason singular `drop` is not in the reserve.
const CALIBRATION = [
  ['Send nectar', true],
  ['10 drops', true],
  ['Enter drops (1–1000)', true],
  ['Sarah zapped the entry about the hospital waiting room.', true],
  ['1 drop', true],
  ['When did {subject_name} drop everything for ', false],
  ['sitting with the friend everyone dropped', false],
  ["That's everything Sarah sent.", false],
  ['Plant a seed', false],
];
check(
  'B3 reserve calibration: known money copy matches, known non-money copy does not',
  CALIBRATION.filter(([s, want]) => matchesReserve(s) !== want).map(([s]) => s),
  []
);

const reserveHits = allStrings.filter((s) => matchesReserve(s.value));
const unguardable = reserveHits.filter((s) => !GUARDABLE.has(s.position));
const unguarded = reserveHits.filter(
  (s) => GUARDABLE.has(s.position) && !isUnderGuard(s.ancestors, NECTAR_CONSENT_GUARD)
);
check(
  `B4 every rendered money word sits under the \`${NECTAR_CONSENT_GUARD}\` guard`,
  unguarded.map((s) => `${s.rel}:${s.line} ${JSON.stringify(s.value)}`),
  []
);
check(
  'B5 no money word is authored where a guard could never reach it (alert / module scope)',
  unguardable.map((s) => `${s.rel}:${s.line} [${s.position}] ${JSON.stringify(s.value)}`),
  []
);

// --- C. The default is NO ------------------------------------------------
// Evaluated over the shapes an account can take before 19a provisions one,
// rather than asserted about the source text. `resolved` is not a state this
// predicate carries: unknown and no are the SAME answer here, because the
// consequence of both is the app as it ships today, which is correct in
// either case. That is the opposite of §23's rule for a load state, and it
// is the opposite deliberately — §23 says absence must not be reported as a
// positive claim about the user, and "no wallet" is not a claim about the
// user, it is the absence of a feature.
const NO_CONSENT_SHAPES = [
  ['undefined', undefined],
  ['null', null],
  ['{}', {}],
  ['{ nectarConsentAt: null }', { nectarConsentAt: null }],
  ['{ nectarConsentAt: undefined }', { nectarConsentAt: undefined }],
  ['{ nectarConsentAt: "" }', { nectarConsentAt: '' }],
];
check(
  'C1 hasNectarConsent is false for every unprovisioned account shape',
  NO_CONSENT_SHAPES.filter(([, v]) => hasNectarConsent(v) !== false).map(([n]) => n),
  []
);
check(
  'C2 hasNectarConsent is true once a consent timestamp exists',
  hasNectarConsent({ nectarConsentAt: '2026-08-26T00:00:00Z' }),
  true
);

// --- D. Placement --------------------------------------------------------
const exists = async (rel) => {
  try {
    await access(path.join(ROOT, rel));
    return true;
  } catch {
    return false;
  }
};

const hosted = NECTAR_SURFACES.filter((s) => s.host);
const unhosted = NECTAR_SURFACES.filter((s) => !s.host);
check('D0 both surface classes are represented (hosted and container-absent)', [hosted.length > 0, unhosted.length > 0], [true, true]);

const missingHosts = [];
const missingAnchors = [];
for (const s of hosted) {
  if (!(await exists(s.host))) {
    missingHosts.push(`${s.id}: ${s.host}`);
    continue;
  }
  const src = await readFile(path.join(ROOT, s.host), 'utf8');
  // WHOLE-IDENTIFIER, not substring. Caught by this gate's own mutation
  // test: renaming `styles.ending` to `styles.endingBlock` — exactly the
  // orphaning D2 exists to catch — left the old anchor as a PREFIX of the
  // new one, so `includes()` stayed green while the placement it names had
  // moved. A containment test cannot tell a rename from a survival.
  const anchorRe = new RegExp(`\\b${s.anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  if (!anchorRe.test(src)) missingAnchors.push(`${s.id}: ${s.anchor} not in ${s.host}`);
}
check('D1 every hosted surface names a container file that exists', missingHosts, []);
check('D2 every hosted surface\'s declared anchor is still in its container', missingAnchors, []);

// D3 is a DECLARATION-COMPLETENESS row, not an absence proof. A surface
// whose container does not exist must say how that is known — a named probe,
// or the literal string 'none' plus a note explaining why nothing mechanical
// can speak for it. Without this row, "no probe" and "probe passed" are the
// same silence.
check(
  'D3 every container-absent surface declares a probe or declares itself unprobeable',
  unhosted.filter((s) => !s.probe || !s.note).map((s) => s.id),
  []
);

// D4 THE PROBE ITSELF, for the one surface where absence is mechanically
// checkable. DES-28 D5 adds a row to a "Send note · Plant seed" menu. No such
// menu exists: ComposeNote and PlantSeed are reached from two separate inbox
// screens. A menu offering both would, by construction, navigate to both from
// ONE file. Scoped exactly that way — this finds a menu, not the absence of
// every possible menu — and it self-deletes: the day the menu is built this
// reds and asks DES-28 for the placement it could not have had before.
const PROBES = {
  noActionMenu: () =>
    parsed
      .filter(({ src }) => /navigate\(\s*['"]ComposeNote['"]/.test(src) && /navigate\(\s*['"]PlantSeed['"]/.test(src))
      .map(({ rel }) => rel),
};
const probeFailures = [];
for (const s of unhosted) {
  if (s.probe === 'none') continue;
  const probe = PROBES[s.probe];
  if (!probe) {
    probeFailures.push(`${s.id}: no such probe '${s.probe}'`);
    continue;
  }
  const found = probe();
  if (found.length > 0) probeFailures.push(`${s.id}: container now exists — ${found.join(', ')}`);
}
check('D4 every named container-absence probe still finds nothing', probeFailures, []);

// D5 the reverse direction of D4's probe: a probe that can no longer FIND
// anything is a probe that has stopped working. Both navigation targets must
// still be reachable from somewhere, or `noActionMenu` is green because the
// screens were renamed rather than because the menu is absent.
const reachesCompose = parsed.some(({ src }) => /navigate\(\s*['"]ComposeNote['"]/.test(src));
const reachesSeed = parsed.some(({ src }) => /navigate\(\s*['"]PlantSeed['"]/.test(src));
check('D5 noActionMenu probe control: both menu targets are still reachable somewhere', [reachesCompose, reachesSeed], [true, true]);

// D6 THE CONTROL ON A1a'S EXCLUSION. NECTAR_SURFACES holds the only prose in
// the declaration module — the `note` and `preConsent` fields, which describe
// missing containers in the same words a real surface would use. Nothing may
// render them. Importing the predicate or the guard name is free; importing
// the population means the words can reach a screen, and at that moment the
// self-exclusion stops being safe and has to be argued again rather than
// inherited.
const surfaceImporters = parsed.filter(({ src }) => /\bNECTAR_SURFACES\b/.test(src)).map(({ rel }) => rel);
check('D6 nothing in the app imports NECTAR_SURFACES (the exclusion in A1a holds)', surfaceImporters, []);

console.log(`\n${pass} passed, ${fail} failed`);
console.log(
  `(${allStrings.length} rendered strings scanned, ${reserveHits.length} match the reserve, ` +
    `${NECTAR_SURFACES.length} surfaces declared: ${hosted.length} hosted, ${unhosted.length} container-absent)`
);
if (fail > 0) process.exit(1);
