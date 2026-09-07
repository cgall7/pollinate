// DES-40 — the send's ending: two pictures, two sequences, one class closed.
//
//   npm run check:send-ending
//
// Ruling of record: POLLINATE_FIVE_TAB_IA_SPEC.md §10 (Lumen), with the
// seed-seal row added 2026-09-07 off Pixel's pickup finding. Every spec cited
// in this file lives in the design workspace, not at any path in this repo;
// nothing under `GUIDES/` is in this tree, so a bare `GUIDES/...` address
// opens nothing for whoever reads this file next. No row below takes a
// workspace document as evidence: each restates the ruling it depends on.
//
// WHAT THIS GATE IS FOR, stated once so the rows read as one argument.
// `Compose` is the app's only surface with two endings, and the two are
// deliberately inverses: a note sent NOW leaves, a note held ON A DATE stays.
// The whole design rests on four in-hand signatures staying distinct, on each
// sequence spanning ITS OWN element rather than a borrowed one, and on the
// sequence REPLACING the button's default haptic rather than stacking on it.
// Every one of those is invisible in a screenshot and two of them are
// invisible on a simulator. That is what a gate is for.
//
// SECTION A EXECUTES THE SHIPPED MODULE rather than re-deriving it. The beats
// are read by running `haptics.js`'s own text against a stub `expo-haptics`
// and a captured `setTimeout`, so the row measures the scheduler that ships
// and not a second copy of it. A gate that carries its own implementation of
// the thing it checks agrees with itself forever.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const HAPTICS = 'src/constants/haptics.js';
const MOTION = 'src/constants/motion.js';
const COMPOSE = 'src/screens/Compose.js';
const SEALCRACK = 'src/components/SealCrack.js';
const PACKAGE = 'package.json';

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const hapticsSrc = read(HAPTICS);
const motionSrc = read(MOTION);
const composeSrc = read(COMPOSE);
const sealCrackSrc = read(SEALCRACK);
const packageJson = JSON.parse(read(PACKAGE));

let pass = 0;
const failures = [];
const ok = (msg) => { pass += 1; console.log(`  ok   ${msg}`); };
const bad = (row, msg) => { failures.push(`${row}: ${msg}`); console.log(`  FAIL ${row}: ${msg}`); };

const parseJs = (src) => parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
const visit = (node, fn, parent) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => visit(n, fn, parent)); return; }
  if (typeof node.type === 'string') fn(node, parent);
  for (const k of Object.keys(node)) {
    if (k === 'loc' || k === 'leadingComments' || k === 'trailingComments' || k === 'innerComments') continue;
    visit(node[k], fn, node);
  }
};
const walkJs = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walkJs(p) : (e.name.endsWith('.js') ? [p] : []);
});

const hapticsAst = parseJs(hapticsSrc);
const motionAst = parseJs(motionSrc);
const composeAst = parseJs(composeSrc);

// ---------------------------------------------------------------------------
console.log('\nA. The interface — a sequence is fractions plus styles, and the span is an argument');

// Run the shipped module. `expo-haptics` is stubbed to a bare style registry
// (the module only ever reads `ImpactFeedbackStyle.*` and calls `impactAsync`),
// and `setTimeout` is captured so the schedule is observable without a clock.
const STYLES = { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy', Rigid: 'Rigid', Soft: 'Soft' };
let fired = [];
const stubHaptics = {
  ImpactFeedbackStyle: STYLES,
  impactAsync: (style) => { fired.push({ at: stubHaptics.__now, style }); return Promise.resolve(); },
  __now: 0,
};
const stubSetTimeout = (fn, ms) => { const was = stubHaptics.__now; stubHaptics.__now = ms; fn(); stubHaptics.__now = was; };

let mod = null;
let moduleLoadError = null;
try {
  // Strip the single `import * as Haptics` line and hand the rest an injected
  // binding. Everything else in the file — the closure, the clamp, the guard —
  // is executed verbatim.
  const body = hapticsSrc.replace(/^import \* as Haptics from 'expo-haptics';\s*$/m, '');
  if (body === hapticsSrc) throw new Error('the `import * as Haptics` line was not found — the transform is reading a different module shape than it was written against');
  const exportNames = [];
  visit(hapticsAst, (n) => {
    if (n.type !== 'ExportNamedDeclaration' || !n.declaration) return;
    (n.declaration.declarations ?? []).forEach((d) => { if (d.id?.name) exportNames.push(d.id.name); });
  });
  const stripped = body.replace(/^export const /gm, 'const ');
  // eslint-disable-next-line no-new-func
  const factory = new Function('Haptics', 'setTimeout', 'console', `${stripped}\nreturn {${exportNames.join(', ')}};`);
  mod = factory(stubHaptics, stubSetTimeout, { warn: () => {} });
} catch (err) {
  moduleLoadError = err;
}

if (!mod) {
  bad('A0', `could not execute ${HAPTICS}: ${moduleLoadError?.message ?? 'unknown'} — every row in section A is unmeasured, not green`);
} else {
  ok(`A0 ${HAPTICS} executes against a stubbed native module; exports read {${Object.keys(mod).join(', ')}}`);
}

const runSequence = (fn, span) => { fired = []; stubHaptics.__now = 0; fn(span); return fired.map((f) => [f.at, f.style]); };

// The ruled shapes. Four in-hand signatures, and three of them live here.
const RULED = [
  { name: 'hexTap.contact', get: (m) => m.hexTap?.contact, span: 180, expect: [[0, 'Light'], [90, 'Light'], [180, 'Medium']] },
  { name: 'send.take', get: (m) => m.send?.take, span: 180, expect: [[0, 'Medium'], [180, 'Light']] },
  { name: 'send.seedSeal', get: (m) => m.send?.seedSeal, span: 280, expect: [[0, 'Light'], [280, 'Medium']] },
];
if (mod) {
  RULED.forEach((r, i) => {
    const fn = r.get(mod);
    if (typeof fn !== 'function') { bad(`A1.${i + 1}`, `${r.name} is not a function on the executed module — the sequence this row measures does not exist`); return; }
    const got = runSequence(fn, r.span);
    const same = got.length === r.expect.length && got.every(([a, s], j) => a === r.expect[j][0] && s === r.expect[j][1]);
    if (same) ok(`A1.${i + 1} ${r.name} at span ${r.span} fires ${got.map(([a, s]) => `${a}ms:${s}`).join(', ')} — the ruled beats, produced by the shipped scheduler`);
    else bad(`A1.${i + 1}`, `${r.name} at span ${r.span} fires ${JSON.stringify(got)}, ruled ${JSON.stringify(r.expect)}`);
  });

  // A2 — the same functions over a DIFFERENT span. This is the row that says
  // the span is an argument: if any millisecond were still hardcoded, the
  // beats above could be right and these wrong.
  RULED.forEach((r, i) => {
    const fn = r.get(mod);
    if (typeof fn !== 'function') return;
    const doubled = runSequence(fn, r.span * 2);
    const scaled = r.expect.map(([a, s]) => [a * 2, s]);
    const same = doubled.length === scaled.length && doubled.every(([a, s], j) => a === scaled[j][0] && s === scaled[j][1]);
    if (same) ok(`A2.${i + 1} ${r.name} at span ${r.span * 2} fires ${doubled.map(([a, s]) => `${a}ms:${s}`).join(', ')} — every beat moved with the span, so no millisecond is written into the module`);
    else bad(`A2.${i + 1}`, `${r.name} at double span fires ${JSON.stringify(doubled)}, expected ${JSON.stringify(scaled)} — a beat that did not move with the span is a hardcoded number`);
  });

  // A3 — CLAMP, NEVER DROP. At span 0 every fraction collapses onto the same
  // instant, which is the hardest case for a scheduler that might filter
  // coincident beats. The beat COUNT is the assertion; compression must never
  // cost a beat, because dropping one is the collapse rule returning through
  // arithmetic.
  RULED.forEach((r, i) => {
    const fn = r.get(mod);
    if (typeof fn !== 'function') return;
    const squashed = runSequence(fn, 0);
    if (squashed.length === r.expect.length) ok(`A3.${i + 1} ${r.name} at span 0 still fires all ${squashed.length} beats — compression clamps, it never drops`);
    else bad(`A3.${i + 1}`, `${r.name} at span 0 fires ${squashed.length} of ${r.expect.length} beats — a beat was dropped under compression`);
  });

  // A4 — the guard. A span that is not a finite non-negative number is a
  // programming error, and firing the beats stacked at t=0 would manufacture
  // exactly the lone click this module exists to prevent. Silence is the safe
  // failure, and it is only safe if it is actually silent.
  const badSpans = [undefined, null, NaN, -1, 'x', Infinity];
  const noisy = badSpans.filter((sp) => runSequence(mod.send.take, sp).length !== 0);
  if (noisy.length === 0) ok(`A4 a sequence called with a non-finite or negative span fires nothing (${badSpans.length} span values tried) — the safe failure is silence, not a stack of impacts at t=0`);
  else bad('A4', `these spans still fired impacts: ${JSON.stringify(noisy)} — a missing span must not become a click`);

  // A5 — MIN_FELT_GAP_MS is declared once in the module, and it ships 0 and
  // VACUOUS BY CONSTRUCTION. The value is Pixel's device day; the mechanism
  // ships authored so nobody later discovers the clamp was never wired.
  const declarations = [...hapticsSrc.matchAll(/\bMIN_FELT_GAP_MS\b/g)].length;
  const declaredOnce = (hapticsSrc.match(/^export const MIN_FELT_GAP_MS = /m) ?? []).length === 1;
  if (declaredOnce && typeof mod.MIN_FELT_GAP_MS === 'number' && mod.MIN_FELT_GAP_MS >= 0) {
    ok(`A5 MIN_FELT_GAP_MS is declared once in the module and reads ${mod.MIN_FELT_GAP_MS} (${declarations} textual occurrences: the declaration, the clamp, and its comments) — one floor, applied after the multiply`);
  } else {
    bad('A5', `MIN_FELT_GAP_MS: declaredOnce=${declaredOnce}, value=${mod.MIN_FELT_GAP_MS} — the floor must live in the module exactly once and be a non-negative number`);
  }
}

// A6 — NO PER-MODE FORK, in either direction. The derivation rule is that a
// sequence rebinds to the span of the visual that actually plays, so a
// `takeFull`/`takeReduced` pair is the drift the interface exists to prevent.
const forked = [];
visit(hapticsAst, (n) => {
  if (n.type === 'ObjectProperty' && /(?:Full|Reduced|Rm|RM)$/.test(n.key?.name ?? '')) forked.push(n.key.name);
  if (n.type === 'VariableDeclarator' && /(?:Full|Reduced|Rm|RM)$/.test(n.id?.name ?? '')) forked.push(n.id.name);
});
if (forked.length === 0) ok('A6 no per-mode fork in haptics.js — no identifier ends Full/Reduced/RM, so a sequence has one definition and two spans');
else bad('A6', `per-mode forks in haptics.js: {${forked.join(', ')}} — the mode belongs in the span, never in a second function`);

// ---------------------------------------------------------------------------
console.log('\nB. The referents — each sequence spans ITS OWN element, never a borrowed one');

// Read SEND out of motion.js's AST. `motion.js` imports from react-native, so
// a bare node script cannot import it; this is the same shape the other
// motion gates use, and for the same reason.
let SEND = null;
visit(motionAst, (n) => {
  if (n.type !== 'VariableDeclarator' || n.id?.name !== 'SEND') return;
  if (n.init?.type !== 'ObjectExpression') return;
  SEND = {};
  n.init.properties.forEach((p) => {
    if (p.type !== 'ObjectProperty') return;
    SEND[p.key.name] = p.value.type === 'NumericLiteral' ? p.value.value : { nonLiteral: p.value.type };
  });
});
if (SEND && ['liftOff', 'travel', 'sealSettle'].every((k) => typeof SEND[k] === 'number')) {
  ok(`B1 motion.js declares SEND as three plain numbers — liftOff ${SEND.liftOff}, travel ${SEND.travel}, sealSettle ${SEND.sealSettle}`);
} else {
  bad('B1', `SEND reads ${JSON.stringify(SEND)} — the send's three durations must be its own numeric literals. A member expression here means the send is reading someone else's constant, which is the borrow §10 forbids by name`);
  SEND = null;
}

if (SEND) {
  // B2 — the bounded argument for `liftOff`, asserted rather than left in
  // prose. Floor: two impacts must be felt as two, and 100ms is the tightest
  // gap any shipping sequence produces (`hexTap.contact` at reducedMotionFade).
  // Ceiling: §12.5 Rule 2 keeps a finger-caused treatment under 200ms.
  if (SEND.liftOff >= 100 && SEND.liftOff < 200) ok(`B2 SEND.liftOff ${SEND.liftOff} sits inside its stated band [100, 200) — above the tightest gap with evidence behind it, under Rule 2's ceiling for a treatment the finger causes`);
  else bad('B2', `SEND.liftOff is ${SEND.liftOff}, outside [100, 200). At two beats the gap IS the span, so this number is the take's whole rhythm`);

  // B3 — the ordering the SEND comment states as its own reason. A
  // justification comment is a dependency: if the ordering stops holding, the
  // paragraph explaining it is false and nothing else says so.
  const departure = SEND.liftOff + SEND.travel;
  if (SEND.liftOff < SEND.sealSettle && SEND.sealSettle < departure) {
    ok(`B3 liftOff ${SEND.liftOff} < sealSettle ${SEND.sealSettle} < the departure's ${departure} total — a seal is not a click, and a stowage is one act where a departure is two. That ordering is SEND's stated reason for its own numbers`);
  } else {
    bad('B3', `the ordering broke: liftOff ${SEND.liftOff}, sealSettle ${SEND.sealSettle}, departure total ${departure}. SEND's comment argues this ordering explicitly, so it is now false in the file`);
  }
}

// B4 — the never-borrow rule at the call sites, read structurally. Each
// sequence must be invoked with the identifier of its own referent.
const callArgs = [];
visit(composeAst, (n) => {
  if (n.type !== 'CallExpression') return;
  const c = n.callee;
  if (c?.type !== 'MemberExpression' || c.object?.name !== 'sendHaptics') return;
  const a = n.arguments[0];
  const text = a ? composeSrc.slice(a.start, a.end) : '(none)';
  callArgs.push({ seq: c.property?.name, arg: text });
});
const RULED_CALLS = [
  { seq: 'take', arg: 'SEND.liftOff', why: 'the detach, NOT the whole departure — the travel is un-mirrored, so the finger is finished while the note is still leaving' },
  { seq: 'seedSeal', arg: 'SEND.sealSettle', why: 'the settle, which at two beats is the whole rhythm' },
];
RULED_CALLS.forEach((r, i) => {
  const hit = callArgs.find((c) => c.seq === r.seq && c.arg === r.arg);
  if (hit) ok(`B4.${i + 1} sendHaptics.${r.seq}(${r.arg}) — ${r.why}`);
  else bad(`B4.${i + 1}`, `no call \`sendHaptics.${r.seq}(${r.arg})\` in ${COMPOSE}; calls read ${JSON.stringify(callArgs.filter((c) => c.seq === r.seq))}`);
});

// B5 — the reduced-motion arm rebinds to the substitute, both sequences. The
// derivation rule mirrors the visual that ACTUALLY PLAYS, and under RM that is
// the flat fade.
const rmCalls = callArgs.filter((c) => c.arg === 'DURATIONS.reducedMotionFade');
const rmConditional = /\(isSeed \? sendHaptics\.seedSeal : sendHaptics\.take\)\(DURATIONS\.reducedMotionFade\)/.test(composeSrc);
if (rmCalls.length === 0 && rmConditional) {
  ok('B5 the Reduce Motion arm dispatches either sequence over DURATIONS.reducedMotionFade from one call — the two endings become one picture there, and the haptic is what still tells them apart');
} else if (rmCalls.length >= 2) {
  ok(`B5 both sequences are called with DURATIONS.reducedMotionFade (${rmCalls.map((c) => c.seq).join(', ')}) — the span rebinds to the substitute that actually plays`);
} else {
  bad('B5', `the Reduce Motion arm does not span both sequences on DURATIONS.reducedMotionFade — found ${JSON.stringify(rmCalls)}, conditional form ${rmConditional}`);
}

// B6 — NECTAR is not reachable from this screen at all. §10 names
// `NECTAR.gather` as the specific borrow to refuse; the strongest form of that
// is that the identifier is absent from the file, so nobody can reach for it
// without an import that reads as the deliberate act it would be.
const nectarHits = [...composeSrc.matchAll(/\bNECTAR\b/g)].length;
if (nectarHits === 0) ok(`B6 \`NECTAR\` does not occur in ${COMPOSE} — the send cannot borrow the nectar drop's clock, which is the borrow §10 forbids by name (gather is scale evidence, not a dependency)`);
else bad('B6', `\`NECTAR\` occurs ${nectarHits} times in ${COMPOSE} — retuning the nectar drop would silently retune the finger's report on the send`);

// ---------------------------------------------------------------------------
console.log('\nC. The mount is indivisible — a sequence REPLACES the default, never stacks on it');

// A component default is a call site with no text: `PrimaryButton` defaults
// `haptic` to Light and forwards it to `PressableScale`, so the take's opening
// Medium would land on top of a Light nobody wrote unless this prop is passed.
const primaryButtons = [];
visit(composeAst, (n) => {
  if (n.type !== 'JSXOpeningElement' || n.name?.name !== 'PrimaryButton') return;
  const haptic = n.attributes.find((a) => a.type === 'JSXAttribute' && a.name?.name === 'haptic');
  primaryButtons.push({
    line: n.loc.start.line,
    haptic: haptic ? composeSrc.slice(haptic.value.start, haptic.value.end) : null,
  });
});
if (primaryButtons.length === 1) ok(`C1 ${COMPOSE} mounts exactly one PrimaryButton (line ${primaryButtons[0].line}) — so "the send button" names one thing and C2 has a subject`);
else bad('C1', `${COMPOSE} mounts ${primaryButtons.length} PrimaryButtons — C2 asserts about "the" send button and no longer knows which`);

const silenced = primaryButtons.filter((b) => b.haptic === '{null}');
if (primaryButtons.length && silenced.length === primaryButtons.length) {
  ok(`C2 every PrimaryButton in ${COMPOSE} passes haptic={null} — the sequence replaces the button's default Light rather than firing on top of it`);
} else {
  bad('C2', `PrimaryButton haptic props read ${JSON.stringify(primaryButtons.map((b) => b.haptic))} — without haptic={null} the take's opening Medium stacks on a default Light and the send ships the click the module exists to prevent`);
}

// C3 — no call-site one-off. The rule is that both beats live in the module as
// named sequences; a raw `Haptics.` anywhere on this screen is that rule
// broken at the one surface it was written for.
const rawOnCompose = [...composeSrc.matchAll(/\bHaptics\./g)].length;
if (rawOnCompose === 0) ok(`C3 no raw \`Haptics.\` call on ${COMPOSE} — both beats are named sequences in the module, which is what makes them nameable at all`);
else bad('C3', `${rawOnCompose} raw \`Haptics.\` references on ${COMPOSE} — a call-site one-off on the exact screen DES-40 mounted its sequences at`);

// ---------------------------------------------------------------------------
console.log('\nD. Four distinct in-hand signatures — the design rests on this and nothing else asserts it');

let sealCrackStyles = [];
visit(parseJs(sealCrackSrc), (n) => {
  if (n.type !== 'CallExpression') return;
  const c = n.callee;
  if (c?.type !== 'MemberExpression' || c.object?.name !== 'Haptics' || c.property?.name !== 'impactAsync') return;
  const a = n.arguments[0];
  if (a?.type === 'MemberExpression') sealCrackStyles.push(a.property?.name);
});
const signatures = mod
  ? {
    'hexTap.contact': runSequence(mod.hexTap.contact, 180).map(([, s]) => s),
    'send.take': runSequence(mod.send.take, 180).map(([, s]) => s),
    'send.seedSeal': runSequence(mod.send.seedSeal, 280).map(([, s]) => s),
    'SealCrack (shipped doctrine pin)': sealCrackStyles,
  }
  : null;
if (signatures) {
  const keys = Object.keys(signatures);
  const seen = new Map();
  keys.forEach((k) => {
    const sig = signatures[k].join('>');
    seen.set(sig, [...(seen.get(sig) ?? []), k]);
  });
  const collisions = [...seen.entries()].filter(([, ks]) => ks.length > 1);
  if (collisions.length === 0 && keys.length === 4) {
    ok(`D1 four signatures, all distinct — ${keys.map((k) => `${k}: ${signatures[k].join('>') || '(none)'}`).join(' | ')}`);
  } else {
    bad('D1', `signature collision or wrong count: ${JSON.stringify([...seen.entries()])}`);
  }
  // D2 — the take and the seed seal are EXACT INVERSES, because the acts are:
  // a departure decays and a stowage arrives. This is the one relation the
  // ruling states as a shape rather than as two values, so it gets its own row.
  const take = signatures['send.take'];
  const seal = signatures['send.seedSeal'];
  if (take.length === 2 && seal.length === 2 && take[0] === seal[1] && take[1] === seal[0] && take[0] !== take[1]) {
    ok(`D2 the take (${take.join('>')}) and the seed seal (${seal.join('>')}) are exact inverses — a departure decays, a stowage arrives`);
  } else {
    bad('D2', `take ${JSON.stringify(take)} and seed seal ${JSON.stringify(seal)} are not inverses of each other`);
  }
  // D3 — SealCrack's Medium stays LONE, and stays the app's only opening-in-
  // hand mark. If it ever became a pair it would collide with one of the two
  // sends, and D1 would report it as a collision without saying which property
  // had been lost.
  if (sealCrackStyles.length === 1 && sealCrackStyles[0] === 'Medium') {
    ok('D3 SealCrack still fires a lone Medium — a shipped doctrine pin, deliberately NOT moved into the haptics module by DES-40, and still the app\'s only opening-in-hand signature');
  } else {
    bad('D3', `SealCrack fires ${JSON.stringify(sealCrackStyles)} — the doctrine row says lone Medium, and the seed seal was ruled away from that shape precisely so this one stays unique`);
  }
}

// ---------------------------------------------------------------------------
console.log('\nE. The uncaught-rejection class — closed as a class, not at the site that bit');

// THE CLASS IS WIDER THAN THE SITES THAT WERE NAMED, and this is the row that
// records why. The haptics module's stated reason is: "a missing haptic is
// silent, a thrown promise rejection crashing an animation sequence is not."
// That reason is about a promise-returning native call next to an animation.
// It says nothing about WHICH call. The census that produced the two named
// sites was scoped to `impactAsync`, which is a grep's population and not the
// reason's — `notificationAsync` and `selectionAsync` come off the same native
// module and return the same promise. Read off the reason, the class was 16
// uncaught sites across 12 files, not two.
const universe = [];
for (const file of walkJs(SRC)) {
  const src = fs.readFileSync(file, 'utf8');
  const fileAst = parseJs(src);
  const sites = [];
  visit(fileAst, (n) => {
    if (n.type !== 'CallExpression') return;
    const c = n.callee;
    if (c?.type !== 'MemberExpression' || c.object?.name !== 'Haptics') return;
    if (!/Async$/.test(c.property?.name ?? '')) return;
    sites.push(n);
  });
  const handled = new Set();
  visit(fileAst, (n) => {
    if (n.type !== 'CallExpression') return;
    const c = n.callee;
    if (c?.type !== 'MemberExpression' || c.property?.name !== 'catch') return;
    if (sites.includes(c.object)) handled.add(c.object);
  });
  sites.forEach((s) => universe.push({
    where: `${path.relative(ROOT, file)}:${s.loc.start.line}`,
    call: s.callee.property.name,
    caught: handled.has(s),
  }));
}

// E1 — universe non-empty. An absence row over an empty population is green
// forever and says nothing; this is the row that makes E2's zero mean
// something.
if (universe.length > 0) ok(`E1 the walk resolves ${universe.length} raw \`Haptics.*Async\` call sites under src/ — E2's claim has a population`);
else bad('E1', 'the walk found no raw Haptics call sites at all under src/ — the extractor is blind, so E2 cannot be read as an absence');

// E2 — the universal.
const stillOpen = universe.filter((u) => !u.caught);
if (universe.length > 0 && stillOpen.length === 0) {
  const byCall = universe.reduce((acc, u) => ({ ...acc, [u.call]: (acc[u.call] ?? 0) + 1 }), {});
  ok(`E2 every one of the ${universe.length} sites is \`.catch\`-chained (${Object.entries(byCall).map(([k, v]) => `${k} ${v}`).join(', ')}) — the class the module's reason defines, closed across all three call shapes`);
} else if (universe.length > 0) {
  bad('E2', `${stillOpen.length} uncaught: ${stillOpen.map((u) => `${u.where} ${u.call}`).join(', ')} — an unhandled rejection next to an animation sequence is not silent`);
}

// E3 — reconciliation against an INDEPENDENT witness. E2 is an AST claim, and
// an AST claim about absence is only as good as the extractor that produced
// it. A raw byte scan cannot be fooled by the same mistake, so a disagreement
// means E2 quantified over something other than the population.
//
// The two do not have to agree on a bare count, and pretending they should is
// how this row would get quietly narrowed into agreement. A byte scan matches
// PROSE: `haptics.js`'s own header discusses `Haptics.impactAsync(...)` in a
// sentence, which is a mention and not a call site. So the row reconciles
// EXACTLY rather than approximately — every byte hit is either a site the walk
// enumerated or a hit the parser places inside a comment, and the three
// numbers must add up. A residual of any other kind means the walk missed real
// code, and that is the failure worth failing on.
let byteHits = 0;
let inComment = 0;
const unaccounted = [];
for (const file of walkJs(SRC)) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  const ranges = (parseJs(src).comments ?? []).map((c) => [c.start, c.end]);
  const lines = [...src.matchAll(/Haptics\.\w+Async\(/g)];
  byteHits += lines.length;
  for (const m of lines) {
    if (ranges.some(([a, b]) => m.index >= a && m.index < b)) { inComment += 1; continue; }
    const line = src.slice(0, m.index).split('\n').length;
    if (!universe.some((u) => u.where === `${rel}:${line}`)) unaccounted.push(`${rel}:${line}`);
  }
}
if (byteHits === universe.length + inComment && unaccounted.length === 0) {
  ok(`E3 a byte scan finds ${byteHits} occurrences and they reconcile exactly — ${universe.length} call sites the AST walk enumerated plus ${inComment} discussed in a comment, nothing left over. E2's universal ran over the whole population`);
} else {
  bad('E3', `byte scan ${byteHits} does not reconcile: ${universe.length} enumerated + ${inComment} in comments, unaccounted ${JSON.stringify(unaccounted)} — the walk is not seeing code the bytes can`);
}

// ---------------------------------------------------------------------------
console.log('\nF. Registration');

if (packageJson.scripts?.['check:send-ending'] === 'node scripts/check-send-ending.mjs') {
  ok('F1 package.json exposes check:send-ending — the gate is runnable by name as well as by the enumerating runner');
} else {
  bad('F1', `package.json has no correct check:send-ending script (found ${JSON.stringify(packageJson.scripts?.['check:send-ending'])})`);
}

console.log(`\ncheck-send-ending: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
