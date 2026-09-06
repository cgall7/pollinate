// check-dash-ban — NO STRING THIS APP AUTHORS USES A DASH AS PUNCTUATION.
//
// Ruled by Lumen 2026-09-06 (UX Design, thread root `0a406eb6`): builder
// Vector, ratifier Lumen, four terms — population is `collectAuthoredStrings`
// (the shared collector, same as the vocabulary gate), pattern is em dash AND
// en dash, exclusions carry a stated per-string reason each, and the record
// must name the DES-21 signature attribution mark. The rule, its two tiers,
// the one deliberately-omitted form and the exclusion list live in
// `scripts/dash-ban.mjs`; this file is the instrument.
//
// WHY THIS ROW EXISTED AT ALL. The dash family was swept by hand at
// `11f315e` — 18 strings re-cut across 13 files — and NOTHING GATED IT. The
// two rules that mention dashes each stand over a fraction of the copy:
// `check-demo-seed`'s V1 reads the 278-string demo corpus, `check-comb-bloom`
// D7 reads two files. A sweep with no drift guard re-accumulates on the next
// copy commit, which is what this file exists to stop.
//
// THE FINDING THIS ROW PRODUCED, AND IT IS ABOUT THE RULING'S OWN NAMED
// MEMBER. Lumen named `PackageOpen.js:640`'s signature mark on the ground
// that it "escapes the collector only because `— ` fails the isProse filter
// — an accident that currently protects a ruling", and asked the record to
// name it so nobody widens the filter and reds a ruled signature. Measured:
// THE ACCIDENT DOES NOT EXIST. `rendered-strings.mjs` applies `isProse` at
// exactly one position — `constant`, i.e. `src/constants/` only — because
// that is the one position with no syntactic evidence a string is copy. The
// signature is in `src/screens/`, arrives as jsx-text, and is collected
// unfiltered. It is a live member of the dash set today, and the exclusion
// naming it is not a defensive note about a future filter tweak: it is what
// keeps this gate off a ruled signature on its FIRST run. The prediction was
// right about the danger and wrong about the tense, which is the more
// expensive direction — a protection you believe you have is one you do not
// go looking for.
//
// WHAT THIS GATE DOES NOT DO. It reads CHARACTERS, not punctuation intent. A
// comma splice, a colon doing a dash's job, or a dash assembled at runtime
// from two halves is outside it. It also cannot carry V1's spaced-hyphen
// form, for a measured reason stated in the rules module and asserted at B3
// rather than confessed here.

// MUTATIONS — run with `node scripts/run-mutations.mjs
// scripts/check-dash-ban.mjs`. Every mutation targets `scripts/dash-ban.mjs`
// rather than this file, deliberately: a mutation whose `from` string also
// appears inside this array would patch its own declaration instead of the
// code, and the row would score as caught having changed nothing.
//
// THE VERDICT ROW STANDS OVER AN EMPTY SET — nine dash-bearing strings, nine
// of them named exclusions, zero unexplained. C1 would pass just as cleanly
// with a pattern that matches nothing at all. These rows are what make it
// load-bearing.
export const MUTATIONS = [
  {
    row: 'D2',
    why: 'THE COHERENT SHRINK. The en dash is removed from the pinned pair, and because the pattern is DERIVED from the pin it leaves the regex in the same edit — the two halves still agree, so a reader diffing this sees a tidier list and nothing else. Lumen ruled the pair on exactly this hazard: key only the form we happened to ship and the gate greens the other. Today the en dash is measured at zero occurrences, so no verdict row would notice',
    file: 'scripts/dash-ban.mjs',
    from: "export const RULED_DASHES = ['—', '–'];",
    to: "export const RULED_DASHES = ['—'];",
  },
  {
    row: 'C1',
    why: 'THE ROW THAT PROVES THE RULED SIGNATURE IS NOT PROTECTED BY AN ACCIDENT. The `PackageOpen.js` exclusion is deleted. If Lumen\'s premise held — that the mark escapes the collector through `isProse` — nothing would change and this row would score as an uncaught mutation. It reds, printing the DES-21 signature as an unexplained dash, because the mark is in the population today',
    file: 'scripts/dash-ban.mjs',
    from: "    rel: 'src/screens/PackageOpen.js',\n    value: '—',",
    to: "    rel: 'src/screens/PackageOpen.js',\n    value: 'zz-not-a-real-string',",
  },
  {
    row: 'D7',
    why: 'an exclusion value is truncated by one clause — the shape of a well-meant tidy-up, and the shape of a real edit to the copy it names. The exclusion stops matching anything; C1 stays green only because the underlying string is still excluded by... nothing, so it reds too. D7 is the row that names the cause: a dead exclusion, keyed on a string that no longer exists',
    file: 'scripts/dash-ban.mjs',
    from: "value: 'the sequence — a placement question ENG-64 inherits, not a styling one.'",
    to: "value: 'the sequence — a placement question ENG-64 inherits'",
  },
  {
    row: 'B3',
    why: 'the spaced hyphen is added to the pattern, which is the obvious "align it with V1" edit for someone comparing the two dash rules. It is the one form this population cannot carry: `templateText` joins quasis with a SPACE, so `${a}-${b}` — which renders as a clean compound — reconstructs as ` - ` and reds copy no user ever sees as dashed. Zero strings red today, so no verdict row would object; B3 is what makes the omission a decision',
    file: 'scripts/dash-ban.mjs',
    from: "export const HOUSE_SEQUENCES = ['--'];",
    to: "export const HOUSE_SEQUENCES = ['--', ' - '];",
  },
  {
    row: 'D8',
    why: 'the drift guard on the borrowed half is keyed on a pattern that no longer matches V1\'s declaration. This stands in for the real event it exists to catch: `check-demo-seed` changing its dash rule while this gate goes on citing it as the source of `HOUSE_DASHES`. Two dash rules in one repo need one of them to notice when they stop agreeing',
    file: 'scripts/dash-ban.mjs',
    from: 'export const DASHY_V1_SOURCE = "const DASHY = /[‒–—―−]|\\\\s-\\\\s|--/;";',
    to: 'export const DASHY_V1_SOURCE = "const DASHY = /[‒–—―−]|--/;";',
  },
  {
    row: 'E2',
    why: 'THE EXEMPTION-OUTLIVES-ITS-JUSTIFICATION SHAPE, as the real event rather than as an edit to the exclusion. The dev harness is imported into `App.js` — somebody wires the rig up for a device pass and does not revert the swap. The exclusion still matches its string, so C1 and D7 stay green and nothing about the exclusion list looks different; the only thing that changed is that its stated reason stopped being true. E2 is a count, so it can notice; prose could not',
    file: 'App.js',
    from: "import { PendingCombInvite } from './src/services/pendingCombInvite';",
    to: "import { PendingCombInvite } from './src/services/pendingCombInvite';\nimport LuxuryPrimitivesHarness from './src/screens/dev/LuxuryPrimitivesHarness';",
  },
  {
    row: null,
    why: 'MUST NOT FIRE — the exclusion list is reordered, the ruled signature moving from first to last. Nobody ruled an order, the list is a set, and a gate that reddened here would be pinning the shape of a declaration as if it were a ruling. The three dev-facing entries and the six nectar fragments are grouped for a reader, not for the instrument',
    file: 'scripts/dash-ban.mjs',
    from: 'export const DASH_EXCLUSIONS = [\n  // THE RULED MEMBER, and the one Lumen asked the record to carry.\n  {',
    to: 'export const DASH_EXCLUSIONS = [\n  // reordered by the must-not-fire control; nobody ruled an order.\n  {',
  },
];

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { collectAuthoredStrings, DEMO_CORPUS } from './lib/authored-strings.mjs';
import { walkWithAncestry } from './lib/rendered-strings.mjs';
import {
  DASH_EXCLUSIONS,
  DASH_RE,
  DASHY_V1_SOURCE,
  HOUSE_DASHES,
  HOUSE_SEQUENCES,
  RULED_DASHES,
} from './dash-ban.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0;
let fail = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? (pass += 1) : (fail += 1);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
};
const dashed = (s) => DASH_RE.test(s);

// --- A. Universe ---------------------------------------------------------
// THE POPULATION IS THE SHARED COLLECTOR, not a private walk — the same
// premise the acquisition-vocabulary gate stands on, for the reason
// `authored-strings.mjs`'s header states: a second copy of this walk would
// be a second premise to drift.
const { strings: population, files: jsFiles, parseFailures, vocabularyErrors } =
  collectAuthoredStrings({ root: ROOT });

check('A1 source universe is non-empty (App.js + src/**/*.js)', jsFiles.length > 0, true);
check('A2 every enumerated file parses', parseFailures, []);
check('A3 every emitted position is declared in POSITIONS', vocabularyErrors, []);
check('A4 population is non-empty', population.length > 0, true);

const byOrigin = (o) => population.filter((p) => p.origin === o);

// --- B. Instrument calibration -------------------------------------------
// Recall on copy nobody has written, precision on copy that is shipped
// today. Every must-not-catch string below except the last two is a REAL
// string measured in this tree at `11f315e`.
const MUST_CATCH = [
  'Your seat in this hive has closed — new entries cannot be added.',
  'A comb needs two people – invite someone.',
  'Sent 21 drops ‒ thank you.',
  'One month ― one volume.',
  'Rest, bloom − peak.',
  'Failed -- please try again.',
];
const MUST_NOT_CATCH = [
  // measured shipped copy: hyphenated compounds and bare sentences
  "You're in. You'll be writing when the next month opens.",
  'Your seat in this hive has closed. New entries can\'t be added.',
  'Your nectar refills with each delivery.',
  'A comb needs two people to be a comb. This comb has one member. Invite someone, and the month can open.',
  'Re-word the sentence instead.',
  'Turn gifts on and 500 drops are yours to start',
  'Something outside that stopped you, just for a second,',
  'A drop is a small thank you.',
  // THE COMPOUND THE BAN EXPLICITLY SPARES. Colin wrote "re-word" in the
  // sentence that stated the ban, so an unspaced hyphen is not a dash.
  'a self-custodial wallet, hand-written, twenty-one sats',
  'zero-onboarding, first-party, opt-out',
];
check('B1 every must-catch string is refused', MUST_CATCH.filter((s) => !dashed(s)), []);
check('B2 no must-not-catch string is refused', MUST_NOT_CATCH.filter((s) => dashed(s)), []);

// B3 THE DELIBERATE HOLE, ASSERTED RATHER THAN CONFESSED. `check-demo-seed`'s
// V1 also bans a spaced hyphen. This gate cannot carry that form, because
// `templateText` joins quasis with a SPACE: `${a}-${b}` renders as the clean
// compound `a-b` and reconstructs into this population as ` - `. Pinning the
// hole as a row means the day somebody aligns the two patterns, THIS is the
// row they have to edit on purpose, with the reason in front of them.
check('B3 a spaced hyphen is deliberately NOT refused here (V1 carries it over a corpus with no templates)',
  ['A comb - a month - a volume.', 'demo - 1'].filter((s) => dashed(s)), []);

// --- C. The verdict ------------------------------------------------------
// An exclusion is keyed on FILE + EXACT COLLECTED VALUE. Never a line
// number: a line-keyed exemption decays silently toward less coverage the
// first time anything is inserted above it, and a value-keyed one reds the
// moment the string it names is edited, which is exactly when it needs
// re-ruling.
const excluded = (p) =>
  DASH_EXCLUSIONS.some((e) => e.rel === p.rel && e.value === p.value);

const dashHits = population.filter((p) => dashed(p.value));
const unexplained = dashHits
  .filter((p) => !excluded(p))
  .map((p) => `${p.rel}:${p.line} [${p.origin}] ${JSON.stringify(p.value)}`);
check('C1 no string this app authors uses a dash as punctuation', unexplained, []);

// --- D. Structural controls ----------------------------------------------
// D1 the rules module and this gate are OUTSIDE their own population,
// structurally rather than by exemption — neither is under `src/` and
// neither is the demo corpus. Both files contain every character they ban.
check('D1 neither the rules module nor this gate is in its own population',
  population.filter((p) => /dash-ban\.mjs$|check-dash-ban\.mjs$/.test(p.rel)), []);

// D2/D3 VOCABULARY PINS — tripwires, not proofs. An edit that shrinks the
// list AND the derived pattern together is coherent, and every behavioural
// row above would keep passing over the smaller rule.
check('D2 the ruled pair is exactly em dash and en dash (Lumen, 2026-09-06)', RULED_DASHES, ['—', '–']);
check('D3 the inherited tier is exactly the remaining V1 forms',
  [...HOUSE_DASHES, ...HOUSE_SEQUENCES], ['‒', '―', '−', '--']);

// D4 THE WIDENING IS LOAD-BEARING — the same control the vocabulary gate
// carries, for the same reason. `add()` dedupes on file+line+value, so a
// string counted under `setter` or `map` is one no `rendered` entry claimed
// first. Zero of them carry a dash today, so C1 cannot notice if they leave.
check('D4a the state-setter sub-population is non-empty', byOrigin('setter').length > 0, true);
check('D4b the copy-map sub-population is non-empty', byOrigin('map').length > 0, true);
check('D5 the demo corpus is in the universe', byOrigin('demo').length > 0, true);

check('D6 every exclusion carries a stated reason',
  DASH_EXCLUSIONS.filter((e) => typeof e.why !== 'string' || e.why.length < 40).map((e) => e.rel), []);

// D7 NO DEAD EXCLUSIONS. An exemption whose string no longer exists is
// indistinguishable from one still doing work, and it is the way an
// exclusion list grows quietly. Each entry must match exactly one live
// member of the population: a SECOND copy of an excluded string is a new
// site that was never ruled, not a covered one.
check('D7 every exclusion matches exactly one live string',
  DASH_EXCLUSIONS
    .map((e) => ({ rel: e.rel, n: population.filter((p) => p.rel === e.rel && p.value === e.value).length }))
    .filter((x) => x.n !== 1), []);

// D8 THE DRIFT GUARD ON THE BORROWED HALF. `HOUSE_DASHES` is inherited from
// `check-demo-seed`'s V1, which declares its pattern inline. Keyed on the
// declaration text, not a line number.
const demoSeedSrc = fs.readFileSync(path.join(ROOT, 'scripts/check-demo-seed.mjs'), 'utf8');
check('D8 check-demo-seed V1 still declares the pattern this gate inherited from',
  demoSeedSrc.includes(DASHY_V1_SOURCE), true);

// --- E. Every exclusion's reason is a measurement -------------------------
// A reason that is only prose cannot notice the day it stops being true.
// Each row below re-derives one exclusion's stated ground from source.

const srcOf = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const astOf = (rel) => parse(srcOf(rel), { sourceType: 'module', plugins: ['jsx'] });

// E1 the six nectar fragments: `NECTAR_SURFACES` is a design register, and
// nothing in the app imports it. Measured here rather than cited, so the
// exclusion keeps its control even if `check-nectar-consent`'s D6 moves.
// Keyed on an IMPORT SPECIFIER rather than on a mention of the name: the
// declaring file mentions it, and so would a comment, and neither is a
// consumer. The question is whether any code can READ these strings.
const importsNamed = (rel, name) => {
  let found = false;
  for (const st of astOf(rel).program.body) {
    if (st.type !== 'ImportDeclaration') continue;
    if (st.specifiers.some((sp) => sp.imported?.name === name)) found = true;
  }
  return found;
};
const surfaceImporters = jsFiles.filter((rel) => importsNamed(rel, 'NECTAR_SURFACES'));
check('E1 nothing in the app imports NECTAR_SURFACES (the six note: fragments are unreachable)',
  surfaceImporters, []);

// E2 the dev harness: zero importers anywhere the app can reach it from.
const harnessRefs = [...jsFiles, 'app.json']
  .filter((rel) => rel !== 'src/screens/dev/LuxuryPrimitivesHarness.js')
  .filter((rel) => /LuxuryPrimitivesHarness/.test(srcOf(rel)));
check('E2 the dev harness has zero importers across src/, App.js and app.json', harnessRefs, []);

// E3 the theme string: the argument of a `throw new Error(...)`, not copy.
// Keyed on the ancestry of the node, so moving the string into a rendered
// position reds this row rather than silently keeping the exemption.
const themeThrows = [];
walkWithAncestry(astOf('src/constants/theme.js'), (node, ancestors) => {
  if (node.type !== 'TemplateLiteral') return;
  const text = node.quasis.map((q) => q.value.cooked ?? q.value.raw).join(' ');
  if (!/unknown level/.test(text)) return;
  themeThrows.push(ancestors.some((a) => a.node.type === 'ThrowStatement'));
});
check('E3 the excluded theme string is the argument of a throw, not rendered copy', themeThrows, [true]);

// E4 the DES-21 signature: excluded on its VALUE being the bare mark, never
// on its file. A dash joining two clauses in `PackageOpen.js` is not covered
// by this entry and reds at C1, which is the whole point of value-keying.
const sig = DASH_EXCLUSIONS.find((e) => e.rel === 'src/screens/PackageOpen.js');
check('E4 the ruled signature is excluded as a bare mark, with no sentence around it',
  [sig.value, /[a-z]/i.test(sig.value)], ['—', false]);
// E5 and it is genuinely in the population — the escape Lumen predicted does
// not exist, because `isProse` is applied only at position `constant`.
check('E5 the ruled signature is a live member of the dash set, not a collector escape',
  dashHits.filter((p) => p.rel === 'src/screens/PackageOpen.js').map((p) => p.origin), ['rendered']);

console.log(`\n${pass} passed, ${fail} failed`);
console.log(
  `(${population.length} authored strings scanned: ${byOrigin('rendered').length} rendered, ` +
    `${byOrigin('setter').length} state-setter arguments, ${byOrigin('map').length} copy-map values, ` +
    `${byOrigin('demo').length} demo-corpus; ${RULED_DASHES.length + HOUSE_DASHES.length + HOUSE_SEQUENCES.length} ` +
    `banned forms, ${dashHits.length} dash-bearing, ${DASH_EXCLUSIONS.length} named exclusions, ` +
    `${unexplained.length} unexplained)`
);
if (fail > 0) process.exit(1);
