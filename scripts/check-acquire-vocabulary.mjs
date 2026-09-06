// check-acquire-vocabulary — NO STRING THIS APP RENDERS MAY OFFER THE PERSON
// A ROUTE TO ACQUIRE.
//
// Ruled by Lumen 2026-09-06 (UX Design thread root `0a406eb6`, ruling
// `db1dc0cb`, restated in the R-N7 amendment `0b82e374`): builder Vector,
// ratifier Lumen, "keyed on the promise rather than the sentence", and its
// population must be `collectRenderedStrings` PLUS the refusal map's string
// arguments. The reserve itself, its two tiers and the measurement that
// forced them live in `scripts/acquire-words.mjs`; this file is the
// instrument.
//
// WHY THE POPULATION HAD TO BE WIDENED, AND BY HOW MUCH IT ACTUALLY WAS.
// The ruling predicted one string: `setValidationMessage('Gifts are off.
// Turn them on first.')`, the newest member of the refusal family, which is
// rendered copy no collector sees because a state-setter argument occupies
// no position the walker classifies. Measured at `5d7f292` it is not one
// string. It is FORTY-EIGHT:
//
//   35   string arguments reaching a `set*` state setter — the WHOLE
//        CombNectarCompose validation family (15) and the WHOLE Onboarding
//        auth-error surface (7), plus CombInvite, Compose, CreateComb and
//        HoneycombTab's `{tone, text}` messages.
//   13   prose values in module-scope object literals — `MINT_REFUSAL_COPY`
//        (DES-29 ruled copy, four strings), three `COPY` maps and
//        `SEED_CTA_LABELS`.
//
// Both are the copy-map-launders-copy shape: a string is invisible to every
// copy gate the moment it stops occupying a JSX position, and neither of
// these two classes ever did. So this gate collects three ways and asserts
// that each way still contributes — D4 below — because a widening that
// silently narrows back to `collectRenderedStrings` would leave every
// verdict row green over the smaller universe it was written to close.
//
// THE DEMO CORPUS IS IN THE UNIVERSE, and that inclusion is what produced
// this gate's sharpest finding rather than being a completeness gesture.
// `scripts/lib/demo-seed-corpus.mjs` is app-authored copy an App Store
// reviewer reads, and it is where "I let a Sunday go by without earning
// anything from it" lives — the string that proves bare `earn`, the first
// word of the ruling's own enumeration, cannot be a bare token. Same
// precedent as `forbidden-words.mjs`'s note on `check-collector-null-class`.
//
// WHAT THIS GATE DOES NOT DO. It reads STRINGS, not intent. A promise
// assembled at runtime from two halves, or split across a sentence boundary,
// is outside it — see the window note in `acquire-words.mjs`. It is a
// tripwire on a vocabulary, and the vocabulary is pinned (D6/D7) for exactly
// the reason `POSITIONS` is pinned in `rendered-strings.mjs`: an edit that
// shrinks the word list and the fixtures together is COHERENT, and every
// behavioural row below would keep passing over the smaller rule.

// MUTATIONS — run with `node scripts/run-mutations.mjs
// scripts/check-acquire-vocabulary.mjs`. This gate's verdict row stands over
// an EMPTY match set: nothing in the tree offers a route to acquire today,
// which is the whole point and is also why C1 alone proves nothing. These
// mutations are what make the instrument's own rows load-bearing.
export const MUTATIONS = [
  {
    row: 'D2',
    why: 'THE RULING AS A ONE-WORD EDIT. `refill` is added to the verb vocabulary — the obvious "completeness" edit for someone reading the list cold. It would red Lumen\'s own ruled status line, "Your nectar refills with each delivery", which is legal precisely because it is a law with no actor. Today that sentence escapes only because the words fall in the order nectar-then-refills; the pin is what makes the escape a decision instead of an accident of word order',
    file: 'scripts/acquire-words.mjs',
    from: "  'earn', 'claim', 'unlock', 'win', 'sell', 'sold', 'trade', 'convert',",
    to: "  'refill', 'earn', 'claim', 'unlock', 'win', 'sell', 'sold', 'trade', 'convert',",
  },
  {
    row: 'B2',
    why: 'the unit pattern is loosened from `sats` to `sats?`, which is the edit somebody makes to "also catch the singular". It catches the English verb `sat` instead — "she sat with me the whole night" — and reds gratitude register. Banked twice already; this row is where it stops being a memory',
    file: 'scripts/acquire-words.mjs',
    from: "const UNITS = '(?:sats|nectar|drops|bitcoin|zaps?)';",
    to: "const UNITS = '(?:sats?|nectar|drops|bitcoin|zaps?)';",
  },
  {
    row: 'B1',
    why: 'bare `buy` is made unmatchable while its row, its `why` and its fixture all stay in place. Nothing about the file looks different; the reserve is simply one word smaller. C1 passes exactly as before',
    file: 'scripts/acquire-words.mjs',
    from: '    re: /\\bbuy(?:s|ing)?\\b|\\bbought\\b/i,',
    to: '    re: /\\bzzbuy(?:s|ing)?\\b/i,',
  },
  {
    row: 'D4a',
    why: 'the state-setter sub-population is dropped, which is the exact narrowing the ruling widened against. The gate keeps scanning 1514 of 1549 strings and reports a clean verdict over a universe that no longer contains the refusal family the ruling was written about',
    file: 'scripts/lib/authored-strings.mjs',
    from: "        add(rel, n.loc.start.line, v, 'setter');",
    to: "        if (v) return;",
  },
  {
    row: 'D5',
    why: 'the demo account corpus leaves the universe — a plausible "gates read src/, not scripts/" tidy-up. It takes the three measured register strings with it, so the negative controls that justify the two-tier design would stand over copy the gate no longer reads',
    file: 'scripts/lib/authored-strings.mjs',
    from: 'export function collectAuthoredStrings({ root, includeDemoCorpus = true } = {}) {',
    to: 'export function collectAuthoredStrings({ root, includeDemoCorpus = false } = {}) {',
  },
  {
    row: 'D6',
    why: 'THE COHERENT SHRINK. `nectar` is removed from the pinned unit vocabulary and from the pattern in the same edit, so the two halves still agree and every compound row keeps passing — over a rule that no longer covers the app\'s own primary unit. This is the `POSITIONS` tripwire argument, transplanted',
    file: 'scripts/acquire-words.mjs',
    from: "export const ACQUIRE_UNITS = ['sats', 'nectar', 'drops', 'bitcoin', 'zap'];",
    to: "export const ACQUIRE_UNITS = ['sats', 'drops', 'bitcoin', 'zap'];",
  },
  {
    row: null,
    why: 'MUST NOT FIRE — the compound window is tightened from 24 characters to 20. No fixture uses a gap wider than 11, no row names the number, and nobody ruled it; a gate that reddened here would be pinning a tuning constant as if it were a ruling',
    file: 'scripts/acquire-words.mjs',
    from: '[^.!?]{0,24}',
    to: '[^.!?]{0,20}',
  },
];

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { collectAuthoredStrings, DEMO_CORPUS } from './lib/authored-strings.mjs';
import {
  ACQUIRE_RESERVE,
  ACQUIRE_UNITS,
  ACQUIRE_VERBS,
} from './acquire-words.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0;
let fail = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? (pass += 1) : (fail += 1);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
};
const hits = (s) => ACQUIRE_RESERVE.filter((r) => r.re.test(s)).map((r) => r.word);

// --- A. Universe ---------------------------------------------------------
// THE POPULATION IS THE SHARED COLLECTOR, not a private walk. `collectAuthored
// Strings` is `collectRenderedStrings` plus the two classes no position-based
// collector can see — state-setter arguments and module-scope copy maps —
// plus the demo account corpus. Its header carries the measurement and the
// argument; this gate carries the rule.
const { strings: population, files: jsFiles, parseFailures, vocabularyErrors } =
  collectAuthoredStrings({ root: ROOT });

check('A1 source universe is non-empty (App.js + src/**/*.js)', jsFiles.length > 0, true);
check('A2 every enumerated file parses', parseFailures, []);
check('A3 every emitted position is declared in POSITIONS', vocabularyErrors, []);
check('A4 population is non-empty', population.length > 0, true);

const byOrigin = (o) => population.filter((p) => p.origin === o);

// --- B. Instrument calibration -------------------------------------------
// THE VERDICT ROW STANDS OVER AN EMPTY SET, so it would pass just as
// cleanly with a reserve that matches nothing at all. These two fixtures are
// what stop that: recall on copy nobody has written, precision on copy that
// is shipped today. Every must-not-catch string below except the last is a
// REAL string measured in this tree at 5d7f292, not an invention — a
// precision fixture made of hypotheticals proves a property of the
// hypotheticals.
const MUST_CATCH = [
  'Buy more sats',
  'Bought 1,000 drops',
  'Purchase a drop pack',
  'In-app purchases are available',
  'Redeem your nectar for a gift card',
  'Withdraw your sats',
  'Deposit bitcoin',
  'Top up your balance',
  'Cash out to your Lightning address',
  'Refunds take 3 days',
  'Add funds',
  'Earn drops by writing every day',
  'Get more nectar',
  'Claim your free sats',
  'Unlock 500 drops',
  'Win sats every week',
  'Sell your drops',
  'Trade drops with a friend',
  'Convert drops to bitcoin',
  'Exchange your sats for dollars',
  'Swap nectar for sats',
  'Collect more drops each week',
  'Sats you can earn',
  'Nectar and earn a bonus',
];
const MUST_NOT_CATCH = [
  // measured register hits — each is why a candidate word is not bare
  'I let a Sunday go by without earning anything from it.',
  'I still have not paid you.',
  'I am grateful an old song ambushed me at the supermarket checkout.',
  'We do not sell your information, share it with data brokers, or hand it over.',
  'the shifts traded to make my games',
  'their head on my shoulder during the credits',
  'saving before spending',
  'We claim no ownership of it.',
  'What we collect',
  "What's a small win from this week?",
  'When did {subject_name} drop everything for you?',
  // the ruled-legal law, and the inside-the-loop verbs
  'Your nectar refills with each delivery.',
  'Send 21 drops with your note.',
  'Give someone drops for a note you loved.',
  'You have 8 drops.',
  'Turn gifts on and 500 drops are yours to start',
  'A drop is a small thank you.',
  'Drops are units on a simulated Bitcoin network.',
  'When you give drops to someone, or someone gives you some, it shows up here.',
  // THE SINGULAR-`sat` TRAP, AND IT NEEDS A VERB BESIDE IT. In
  // `NECTAR_RESERVE` a bare unit was the whole pattern, so "she sat with me"
  // was enough to prove `\bsat\b` unsafe. Here units are never bare — they
  // are only ever matched next to an acquisition verb — so that sentence
  // stays green under a loosened pattern and proves nothing. The fixture has
  // to carry both halves, and this one does: loosening `sats` to `sats?`
  // reds it, which is what makes the loosening detectable at all.
  'You earned it, and then you sat down with me.',
  'she sat with me the whole night',
  'Reload the app',
  'You helped me get my balance back that year.',
];
check('B1 every must-catch string is refused', MUST_CATCH.filter((s) => hits(s).length === 0), []);
check('B2 no must-not-catch string is refused', MUST_NOT_CATCH.filter((s) => hits(s).length > 0), []);

// B3 THE KNOWN COST, ASSERTED RATHER THAN CONFESSED. Bare `buy` is the one
// reserve word with a plausible-but-unwritten legal use in this register.
// Pinning it as a red means the cost is a measurement somebody can re-run and
// argue with, and means the day it is demoted to compound-only this row is
// the one that has to be edited on purpose.
check('B3 the one known false red is exactly the unwritten `buy` prompt, and only `buy` fires on it',
  hits('What would you buy them if money were no object?'), ['buy']);

// --- C. The verdict ------------------------------------------------------
const offers = population
  .filter((p) => hits(p.value).length > 0)
  .map((p) => `${p.rel}:${p.line} [${hits(p.value).join(',')}] ${JSON.stringify(p.value)}`);
check('C1 no string this app renders offers a route to acquire', offers, []);

// --- D. Structural controls ----------------------------------------------
// D1 the reserve module is OUTSIDE its own population, structurally rather
// than by exemption. A reserve gate contains its own tokens; this one cannot
// scan the file that declares them because that file is not in `src/` and is
// not the demo corpus. If it ever moves, this reds instead of the whole
// reserve quietly reddening itself.
check('D1 neither the reserve module nor this gate is in its own population',
  population.filter((p) => /acquire-words\.mjs$|check-acquire-vocabulary\.mjs$/.test(p.rel)), []);

check('D2 `refill` is absent from the verb vocabulary (Lumen: a law with no actor)',
  ACQUIRE_VERBS.filter((v) => /refill/i.test(v)), []);
check('D3 the ruled status line is in the population and is clean',
  population.filter((p) => p.value === 'Your nectar refills with each delivery.').map((p) => hits(p.value)),
  [[]]);

// D4 THE WIDENING IS LOAD-BEARING. Both widened sub-populations must still
// contribute, and must contribute strings the shared walker does not reach —
// `add()` dedupes on file+line+value, so a string counted under `setter` or
// `map` is one no `rendered` entry claimed first.
check('D4a the state-setter sub-population is non-empty', byOrigin('setter').length > 0, true);
check('D4b the copy-map sub-population is non-empty', byOrigin('map').length > 0, true);
check('D4c the ruling\'s own proof case is collected, and only the widening reaches it',
  population
    .filter((p) => p.value === 'Gifts are off. Turn them on first.')
    .map((p) => p.origin),
  ['setter']);
check('D4d the named refusal map is collected',
  byOrigin('map').filter((p) => p.rel.endsWith('OrganizerCombCard.js')).length > 0, true);

// D5 the demo corpus is in the universe, and the three strings that forced
// the two-tier design are the proof. Losing the corpus loses the evidence.
check('D5 the demo corpus contributes, including the string that keeps `earn` out of tier 1',
  byOrigin('demo').filter((p) => p.rel === DEMO_CORPUS && /without earning anything/.test(p.value)).length, 1);

// D6/D7 VOCABULARY PINS — tripwires, not proofs, for the reason
// `rendered-strings.mjs` states about `POSITIONS`: an edit that shrinks the
// vocabulary AND the pattern together is coherent, and every behavioural row
// above keeps passing over the smaller rule.
check('D6 the unit vocabulary is exactly these five', ACQUIRE_UNITS,
  ['sats', 'nectar', 'drops', 'bitcoin', 'zap']);
check('D7 the acquisition-verb vocabulary is exactly these fifteen', ACQUIRE_VERBS,
  ['earn', 'claim', 'unlock', 'win', 'sell', 'sold', 'trade', 'convert',
   'exchange', 'swap', 'get more', 'add more', 'receive more', 'collect more', 'earn more']);
check('D8 every unit in the pinned vocabulary is reachable by the compound patterns',
  ACQUIRE_UNITS.filter((u) => hits(`earn more ${u === 'zap' ? 'zaps' : u}`).length === 0), []);
check('D9 every reserve row carries a stated reason',
  ACQUIRE_RESERVE.filter((r) => typeof r.why !== 'string' || r.why.length < 20).map((r) => r.word), []);

console.log(`\n${pass} passed, ${fail} failed`);
console.log(
  `(${population.length} authored strings scanned: ${byOrigin('rendered').length} rendered, ` +
    `${byOrigin('setter').length} state-setter arguments, ${byOrigin('map').length} copy-map values, ` +
    `${byOrigin('demo').length} demo-corpus; ${ACQUIRE_RESERVE.length} reserve patterns, ` +
    `${offers.length} offer a route to acquire)`
);
if (fail > 0) process.exit(1);
