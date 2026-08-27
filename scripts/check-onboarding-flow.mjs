// Gate for Zero Door — the onboarding rebuild
// (PLANS/ONBOARDING_ZERO_DOOR_SPEC.md, Lumen 2026-08-26, superseding
// ONBOARDING_ONE_DOOR_SPEC.md 2026-08-17, which this gate used to be named
// for).
//
//   npm run check:onboarding-flow
//
// WHY THIS EXISTS, AGAIN. One Door's version of this gate asserted C6 (no
// exit of AccountStep may drop the pre-auth write buffer) and the symmetric-
// failure contract for a buffered hive write — both real properties of
// machinery that Zero Door deletes outright, not migrates: PendingOnboarding
// Writes, the three-exit flush invariant, and the `hiveFailed` recovery beat
// have no successor because post-auth every write has a session, and the
// class of failure they existed to catch has no members left. AN INVARIANT
// IS INDEXED TO ITS IMPLEMENTATION — a green C6 row over deleted machinery
// is a lie, so those rows retire in the same commit that deletes the code
// they were watching, not later. Section D (the prompt composition contract)
// is untouched by any of this and survives unchanged below.
//
// WHAT REPLACES C6/C7. Zero Door collapses five beats into one screen, so
// the property worth watching is no longer "does a buffer survive an exit"
// but "did the beats actually leave, or just get hidden behind a flag."
// Enumerated the same way C6 was — off the source, by structural shape, not
// by a maintained list of names.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { parse } from '@babel/parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let pass = 0;
const failures = [];
const ok = (label) => {
  pass += 1;
  console.log(`  ok   ${label}`);
};
const bad = (label, detail) => {
  failures.push(`${label} — ${detail}`);
  console.log(`  FAIL ${label} — ${detail}`);
};
// Every assertion states WHAT WAS CHECKED, never the verdict — a name
// written for the passing case inverts its own meaning on failure.
const check = (label, actual, want) => {
  const a = JSON.stringify(actual);
  const w = JSON.stringify(want);
  if (a === w) ok(label);
  else bad(label, `got ${a}, want ${w}`);
};

const read = (rel) => readFile(path.join(ROOT, rel), 'utf8');
const ast = async (rel) =>
  parse(await read(rel), { sourceType: 'module', plugins: ['jsx', 'typescript'] });

// Depth-first walk yielding every node.
const walk = (node, visit) => {
  if (!node || typeof node.type !== 'string') return;
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
    const value = node[key];
    if (Array.isArray(value)) value.forEach((c) => walk(c, visit));
    else if (value && typeof value.type === 'string') walk(value, visit);
  }
};

// Finds a named function/arrow declaration's body, by ROLE (the binding
// name it is declared under), never by an identifier that merely appears
// inside it.
const bodyOfBinding = (tree, name) => {
  let found = null;
  walk(tree.program, (node) => {
    if (node.type !== 'VariableDeclarator') return;
    if (node.id?.type !== 'Identifier' || node.id.name !== name) return;
    const init = node.init;
    if (init?.type === 'ArrowFunctionExpression' || init?.type === 'FunctionExpression') {
      found = init.body;
    }
  });
  return found;
};

// `Obj.method(` or `this.method(` anywhere inside a subtree.
const callsMember = (subtree, objectMatcher, propertyName) => {
  let found = false;
  walk(subtree, (node) => {
    if (node.type !== 'CallExpression') return;
    const callee = node.callee;
    if (callee?.type !== 'MemberExpression') return;
    if (!objectMatcher(callee.object)) return;
    if (callee.property?.type !== 'Identifier' || callee.property.name !== propertyName) return;
    found = true;
  });
  return found;
};
const isIdentifierNamed = (name) => (node) => node?.type === 'Identifier' && node.name === name;
const isThis = (node) => node?.type === 'ThisExpression';

// Identifier occurrences, walked over the AST rather than grepped raw text —
// this file's own comments narrate what got deleted (by name), which a text
// regex cannot tell apart from a live binding (the exact false-positive
// class check-onboarding-flow's own D section already guards against for
// spark strings: an occupied word is not evidence of the thing itself).
const identifierCount = (tree, name) => {
  let count = 0;
  walk(tree.program, (node) => {
    if (node.type === 'Identifier' && node.name === name) count += 1;
  });
  return count;
};

const onboardingSrc = await read('src/screens/Onboarding.js');
const onboarding = await ast('src/screens/Onboarding.js');
const coreRitualSrc = await read('src/screens/CoreRitual.js');
const authAst = await ast('src/contexts/AuthContext.js');

console.log('\n── A. the beats actually left, not just a flag ──');

// The forks are gone, and stay gone — same check One Door's gate ran,
// unchanged: named for what they were, a flow letter and the module that
// persisted the choice.
check(
  'Onboarding.js imports no onboarding-flow persistence module (the forks are deleted, not disabled)',
  /from '\.\.\/services\/devSettings'/.test(onboardingSrc),
  false
);

// Zero Door has no beats to enumerate, which is the point — a STEP_
// constant or a beat-controller switch reappearing means someone is
// rebuilding the thing this spec deleted, one beat at a time.
const stepConsts = [];
let switchCount = 0;
walk(onboarding.program, (node) => {
  if (node.type === 'SwitchStatement') switchCount += 1;
  if (node.type !== 'VariableDeclarator') return;
  if (node.id?.type !== 'Identifier' || !/^STEP_[A-Z]+$/.test(node.id.name)) return;
  if (node.init?.type !== 'NumericLiteral') return;
  stepConsts.push(node.id.name);
});
check('Onboarding.js declares no STEP_ constant (one screen, no beats to index)', stepConsts, []);
check('Onboarding.js contains no beat-controller switch statement', switchCount, 0);

// The three deleted beats stay deleted — enumerated by the exact bindings
// One Door declared them under, so a recut that reintroduces one of these
// under its old name is caught even if nothing routes to it yet.
const deletedBeatNames = ['FirstEntryStep', 'CelebrationStep', 'WhoStep'];
const reintroduced = [];
walk(onboarding.program, (node) => {
  if (node.type !== 'VariableDeclarator' || node.id?.type !== 'Identifier') return;
  if (deletedBeatNames.includes(node.id.name)) reintroduced.push(node.id.name);
});
check('none of the three deleted beats (First Entry, Celebration, Who) are declared in Onboarding.js', reintroduced, []);

// PendingOnboardingWrites: deleted with no successor (§3), same standard as
// the devSettings check above — module gone, not just unimported.
check(
  'src/services/pendingOnboardingWrites.js no longer exists (deleted, not disabled)',
  existsSync(path.join(ROOT, 'src/services/pendingOnboardingWrites.js')),
  false
);
check(
  'Onboarding.js references no PendingOnboardingWrites binding',
  identifierCount(onboarding, 'PendingOnboardingWrites') > 0,
  false
);
check(
  'AuthContext.js no longer flushes a pre-auth buffer (nothing pre-auth is left to flush)',
  identifierCount(authAst, 'PendingOnboardingWrites') > 0,
  false
);
check(
  'Onboarding.js carries no hiveFailed state (the beat it belonged to is deleted)',
  identifierCount(onboarding, 'hiveFailed') > 0,
  false
);

console.log('\n── B. no-session renders the Gate and only the Gate; session drops straight through ──');

// The session-arrival effect is what makes "session -> MainTabs with zero
// interstitial routes" true: resolved by walking every useEffect body for
// one that both reads `session` and calls `finish`, rather than assuming
// there is exactly one useEffect in the file.
let sessionEffectFinishes = false;
walk(onboarding.program, (node) => {
  if (node.type !== 'CallExpression' || node.callee?.type !== 'Identifier' || node.callee.name !== 'useEffect') return;
  const callback = node.arguments[0];
  if (!callback) return;
  let readsSession = false;
  let callsFinish = false;
  walk(callback, (n) => {
    if (n.type === 'Identifier' && n.name === 'session') readsSession = true;
    if (n.type === 'CallExpression' && n.callee?.type === 'Identifier' && n.callee.name === 'finish') callsFinish = true;
  });
  if (readsSession && callsFinish) sessionEffectFinishes = true;
});
check(
  'an effect that reads `session` calls `finish` (a session anywhere in this screen\'s life leads straight to Main)',
  sessionEffectFinishes,
  true
);

// No route name from the deleted flow survives as a navigation target —
// this screen's only `navigation.navigate` calls are the Legal modal links.
// BOTH call node types: `navigation?.navigate(...)` parses as
// OptionalCallExpression (the `?.` on the member access propagates through
// the whole chain, including the call) — matching only CallExpression here
// is the same node-role gap this file's own C section (One Door's version)
// hit on `outcome?.hiveFailed` parsing as OptionalMemberExpression.
const navigateTargets = [];
walk(onboarding.program, (node) => {
  if (node.type !== 'CallExpression' && node.type !== 'OptionalCallExpression') return;
  const callee = node.callee;
  const isNavigate =
    (callee?.type === 'MemberExpression' || callee?.type === 'OptionalMemberExpression') &&
    callee.property?.type === 'Identifier' &&
    callee.property.name === 'navigate';
  if (!isNavigate) return;
  const arg = node.arguments[0];
  if (arg?.type === 'StringLiteral') navigateTargets.push(arg.value);
});
check(
  'every navigation.navigate target Onboarding.js calls out to is Legal (no beat-shaped interstitial route survives)',
  [...new Set(navigateTargets)],
  ['Legal']
);

console.log('\n── C. the Apple path persists a non-null name on first auth ──');

const honeycombStoreAst = await ast('src/services/HoneycombStore.js');
let signInWithAppleBody = null;
let updateDisplayNameBody = null;
walk(honeycombStoreAst.program, (node) => {
  if (node.type !== 'ObjectMethod' || node.key?.type !== 'Identifier') return;
  if (node.key.name === 'signInWithApple') signInWithAppleBody = node.body;
  if (node.key.name === 'updateDisplayName') updateDisplayNameBody = node.body;
});
check('HoneycombStore declares signInWithApple', !!signInWithAppleBody, true);
check('HoneycombStore declares updateDisplayName', !!updateDisplayNameBody, true);
if (signInWithAppleBody) {
  check(
    'signInWithApple persists the name via updateDisplayName (mock: a truthy fullName reaches the write, not just the auth call)',
    callsMember(signInWithAppleBody, isThis, 'updateDisplayName'),
    true
  );
}
if (updateDisplayNameBody) {
  // `client.from('profiles').update({ display_name })` is a builder chain —
  // `.update(`'s own receiver is the CallExpression `client.from('profiles')`,
  // not a bare identifier, so this resolves the shape by what `.update(` is
  // CALLED WITH (an object literal keyed `display_name`) rather than by what
  // it is called ON, which is the part a query builder is free to reshape.
  let updatesDisplayName = false;
  walk(updateDisplayNameBody, (node) => {
    if (node.type !== 'CallExpression') return;
    if (node.callee?.type !== 'MemberExpression' || node.callee.property?.name !== 'update') return;
    const arg = node.arguments[0];
    if (arg?.type !== 'ObjectExpression') return;
    if (arg.properties.some((p) => p.key?.type === 'Identifier' && p.key.name === 'display_name')) {
      updatesDisplayName = true;
    }
  });
  check(
    "updateDisplayName's .update( call is keyed on display_name (walked from the binding, not grepped for the column name)",
    updatesDisplayName,
    true
  );
}
// The inline name-prompt fallback for a reinstall (Apple hands back no
// name) is a gate row, not a comment (§5) — Onboarding.js must reach the
// same shared write, not grow a second copy of it.
check(
  'Onboarding.js reaches HoneycombStore.updateDisplayName for the no-fullName fallback (one write path, not two)',
  callsMember(onboarding.program, isIdentifierNamed('HoneycombStore'), 'updateDisplayName'),
  true
);

console.log('\n── D. the notification ask left with Celebration, and did not just disappear ──');

// This is the row check-daily-nudge.mjs's row 2c exists to catch from the
// other side: "half B's Celebration ask is the only caller this function
// has ever had, so its absence is a removal of the feature, not a not-yet."
// Onboarding.js must not be that caller anymore, AND something must be.
check('Onboarding.js calls no requestPermissionAndEnable (the ask is not onboarding\'s job anymore)', /requestPermissionAndEnable/.test(onboardingSrc), false);
check('Onboarding.js references no NUDGE_ASK_READY / NUDGE_ASK_LABEL (the sentinel-gated ask moved out with it)', /NUDGE_ASK_(READY|LABEL)/.test(onboardingSrc), false);
check(
  'CoreRitual.js is the ask\'s new home (PLANS/ONBOARDING_ZERO_DOOR_SPEC.md §3 — the first-ever real save, not a screen of its own)',
  /requestPermissionAndEnable/.test(coreRitualSrc) && /NUDGE_ASK_READY/.test(coreRitualSrc),
  true
);
// check-daily-nudge.mjs's rows 2c/3/11a/11b own the DEEP shape of that call
// site (JSX-reached, never a mount effect, gated on the ratified flag) —
// this row only asserts the relocation happened, not its full correctness,
// so the two gates don't duplicate each other's job.

console.log("\n── E. the belief copy landed, and composes ──");

// prompts.js is dependency-free, so this is the real module, sampled over
// its domain — not a regex over its source.
const prompts = await import(path.join(ROOT, 'src/constants/prompts.js'));
const { DAILY_PROMPTS, FIRST_DAYS_PROMPTS, getDailyPrompt } = prompts;

check('walker control: the rotation deck is non-empty', DAILY_PROMPTS.length > 0, true);
check('the first-days deck has one prompt per belief screen (B1-B3)', FIRST_DAYS_PROMPTS.length, 3);

// Sample the FUNCTION over its domain rather than checking three literals:
// seniority 0..2 must come from the first-days deck, everything else and
// "cannot tell" must come from the rotation.
const anchor = new Date(2026, 7, 17);
const seniorityHits = [];
for (let d = 0; d < FIRST_DAYS_PROMPTS.length; d += 1) {
  if (getDailyPrompt(anchor, d) === FIRST_DAYS_PROMPTS[d]) seniorityHits.push(d);
}
check(
  'every seniority day inside the first-days deck returns that deck, in order',
  seniorityHits,
  FIRST_DAYS_PROMPTS.map((_, i) => i)
);
const fallthrough = [null, undefined, -1, 3, 4, 400, 1.5, '0'];
const wrongFallthrough = fallthrough.filter((v) => !DAILY_PROMPTS.includes(getDailyPrompt(anchor, v)));
check(
  'every seniority outside the deck (including unknown, negative and non-integer) falls through to the rotation',
  wrongFallthrough,
  []
);

// THE COMPOSITION CONTRACT. A spark is set into a "I am grateful for
// ${spark}." / "I'm grateful for ${spark}." sentence wherever the register
// is consumed (CoreRitual.js and SparkChips today), so it must be a
// lowercase noun phrase. Enumerated over BOTH decks — a rule that only
// covered the new deck would have missed the deck it was derived from.
const allSparks = [...DAILY_PROMPTS, ...FIRST_DAYS_PROMPTS].flatMap((p) => p.sparks ?? []);
check('walker control: the decks contribute sparks', allSparks.length > 0, true);
check(
  'no spark starts with a capital (it is composed mid-sentence, after "I am grateful for")',
  allSparks.filter((s) => /^[A-Z]/.test(s)),
  []
);
check(
  'no spark starts with a preposition (it is composed as the OBJECT of "for", not a phrase after it)',
  allSparks.filter((s) => /^(in|on|at|with|by|for|from|to|of)\b/i.test(s)),
  []
);
// A repeated chip reads as a rendering bug, not as a second suggestion —
// and the row a user sees is four chips wide, so a duplicate inside one deck
// is visible in a single glance. Enumerated globally rather than per-deck,
// because day 1 and day 40 are two screens the same user sees, and the
// assertion reports the STRINGS, not a count, so the failure names the chip
// instead of the arithmetic.
const sparkCounts = new Map();
for (const s of allSparks) sparkCounts.set(s, (sparkCounts.get(s) ?? 0) + 1);
check(
  'no spark string appears twice across the decks (a repeated chip reads as a bug)',
  [...sparkCounts].filter(([, n]) => n > 1).map(([s]) => s),
  []
);
check(
  'every prompt carries at least one spark',
  [...DAILY_PROMPTS, ...FIRST_DAYS_PROMPTS].filter((p) => !p.sparks?.length).map((p) => p.question),
  []
);

console.log('\n── E2. hive prompt ladders inherit the spark contract, and the selector is pure (ENG-44/45/45.4) ──');

// hivePrompts.js is the Project 16 prompt engine (spec §16.2-16.3). Its
// ladders start empty — COPY-1 (Lumen) has not landed yet — so most of
// this section is vacuously true today. That is correct: the point is
// CI catches a contract violation the moment copy lands, not that this
// gate has something to fail on right now.
const hivePromptsAst = await ast('src/constants/hivePrompts.js');
const hivePrompts = await import(path.join(ROOT, 'src/constants/hivePrompts.js'));
const {
  HIVE_PROMPT_LADDERS,
  RELATIONSHIP_TO_REGISTER,
  registerForRelationship,
  selectHivePrompt,
} = hivePrompts;

const EXPECTED_HIVE_BUCKETS = {
  child: ['0-1', '1-3', '3-7', '7-12', '12-18', '18+'],
  partner: ['0-1y', '1-3y', '3-10y', '10y+'],
  parent: ['new', 'established'],
  friend: ['new', 'established'],
};
check(
  'walker control: all 4 prompt registers exist (spec §16.2)',
  Object.keys(HIVE_PROMPT_LADDERS).sort(),
  Object.keys(EXPECTED_HIVE_BUCKETS).sort()
);
for (const [register, buckets] of Object.entries(EXPECTED_HIVE_BUCKETS)) {
  check(
    `${register} ladder has exactly its spec §16.3 age buckets`,
    Object.keys(HIVE_PROMPT_LADDERS[register] ?? {}),
    buckets
  );
}
check(
  'every DB relationship value (spec §16.1: 7 values) maps to one of the 4 registers',
  Object.entries(RELATIONSHIP_TO_REGISTER).filter(([, register]) => !EXPECTED_HIVE_BUCKETS[register]),
  []
);
check(
  'sibling/mentor/other fall back to friend (spec §16.2)',
  ['sibling', 'mentor', 'other'].map((r) => registerForRelationship(r)),
  ['friend', 'friend', 'friend']
);

// THE COMPOSITION CONTRACT, inherited verbatim from prompts.js (spec §16.2):
// same three rules, enumerated across every register and bucket at once —
// a duplicate spark in child/0-1 and friend/new is just as visible to a
// user who owns both hives as a duplicate inside one deck.
const allHiveSparks = Object.values(HIVE_PROMPT_LADDERS)
  .flatMap((ladder) => Object.values(ladder).flat())
  .flatMap((p) => p.sparks ?? []);
check(
  'no hive spark starts with a capital (composed mid-sentence, after "I am grateful for")',
  allHiveSparks.filter((s) => /^[A-Z]/.test(s)),
  []
);
check(
  'no hive spark starts with a preposition (composed as the OBJECT of "for")',
  allHiveSparks.filter((s) => /^(in|on|at|with|by|for|from|to|of)\b/i.test(s)),
  []
);
const hiveSparkCounts = new Map();
for (const s of allHiveSparks) hiveSparkCounts.set(s, (hiveSparkCounts.get(s) ?? 0) + 1);
check(
  'no hive spark string repeats across any register/bucket',
  [...hiveSparkCounts].filter(([, n]) => n > 1).map(([s]) => s),
  []
);
check(
  'every hive prompt that exists carries at least one spark',
  Object.values(HIVE_PROMPT_LADDERS)
    .flatMap((ladder) => Object.values(ladder).flat())
    .filter((p) => !p.sparks?.length)
    .map((p) => p.question),
  []
);

// Spec §16.3: "No AsyncStorage state, no server round-trip". Walked over
// the AST rather than grepped raw text — this file's own comments name
// AsyncStorage in prose (to state the invariant), which a text regex
// would mistake for a violation.
let touchesAsyncStorageOrNetwork = false;
walk(hivePromptsAst.program, (node) => {
  if (node.type === 'ImportDeclaration' && /AsyncStorage/.test(node.source?.value ?? '')) {
    touchesAsyncStorageOrNetwork = true;
  }
  if (node.type !== 'CallExpression') return;
  const callee = node.callee;
  if (callee?.type === 'Identifier' && callee.name === 'fetch') touchesAsyncStorageOrNetwork = true;
  if (callee?.type === 'MemberExpression' && callee.object?.type === 'Identifier') {
    if (['AsyncStorage', 'supabase'].includes(callee.object.name)) touchesAsyncStorageOrNetwork = true;
  }
});
check(
  'selector source touches neither AsyncStorage nor a network call (spec §16.3)',
  touchesAsyncStorageOrNetwork,
  false
);

// The formula itself (spec §16.3), exercised against a throwaway 3-entry
// fixture monkey-patched into friend/new — this has to hold before COPY-1
// lands too, since ENG-45.2 builds against the selector, not the copy.
const fixtureLadder = [
  { question: 'a', sparks: ['x'] },
  { question: 'b', sparks: ['y'] },
  { question: 'c', sparks: ['z'] },
];
const originalFriendNew = HIVE_PROMPT_LADDERS.friend.new;
HIVE_PROMPT_LADDERS.friend.new = fixtureLadder;
const sameDayPicks = [0, 1, 2, 3, 4, 5, 6].map((hiveAgeDays) =>
  selectHivePrompt({ hiveId: 'fixture-hive', relationship: 'friend', hiveAgeDays, cadenceDays: 7 })
);
check(
  'the selector holds steady for a full cadence window, then advances (no jumping, spec §16.3)',
  new Set(sameDayPicks).size,
  1
);
const nextWindowPick = selectHivePrompt({
  hiveId: 'fixture-hive',
  relationship: 'friend',
  hiveAgeDays: 7,
  cadenceDays: 7,
});
check(
  'a same-day re-render selects the identical prompt (pure function, no hidden state)',
  selectHivePrompt({ hiveId: 'fixture-hive', relationship: 'friend', hiveAgeDays: 3, cadenceDays: 7 }),
  sameDayPicks[3]
);
// A +1 step mod a length-3 ladder can never land back on the same index,
// so this is a guarantee for this fixture, not a probabilistic sample.
check('crossing into the next cadence window always selects a different prompt', nextWindowPick, fixtureLadder[2]);
check(
  'a different hive_id can select a different prompt at the same age (per-hive variety, spec §16.3)',
  selectHivePrompt({ hiveId: 'other-hive-id', relationship: 'friend', hiveAgeDays: 0, cadenceDays: 7 }) !== null,
  true
);
HIVE_PROMPT_LADDERS.friend.new = originalFriendNew;

console.log(`\ncheck-onboarding-flow: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
