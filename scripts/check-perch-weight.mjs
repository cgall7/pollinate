// R-PW — the perch's weight. `GUIDES/POLLINATE_PERCH_WEIGHT_SPEC.md`
// (Lumen, 2026-08-30), built on Colin's device-pass ruling: *"the mascot
// sitting motion does not look top quality … it needs to look beautiful and
// seamless just like the fox."*
//
// EXTENDED 2026-09-03 to cover R-SW (§7), Colin's second fox ruling after
// watching R-PW ship: *"how it moves side to side and smoothly… I want you
// to replicate that."* The same fox, a different axis. P11-P15 are that
// term; P1-P10 are unchanged and stay pinned, which is §7 row 10's "R-SW
// never reopens the merged terms" expressed where it can be broken.
//
//   npm run check:perch-weight
//
// WHY THIS GATE EXISTS. The diagnosis in §1 is arithmetic, not anatomy: three
// doctrine-legal terms that were individually defensible and collectively
// invisible. The one term with real amplitude ran 1.85% of the time and could
// not fire inside a first glance; the two continuous terms were ~2pt of travel
// between them. Everything that fixes that is a NUMBER — an interval, an
// amplitude, a dip — and a number that nothing reads back is a number that
// drifts to whatever the last person felt like. So the rows below are mostly
// relations between constants rather than the constants themselves: the ones
// that ARE pinned are pinned because a ruling names them, and they say so.
//
// The settle beat (§4) is the only NEW motion class the doctrine has gained
// since Breath, and it is legal only under a narrowing that was made for it
// (BEE_DOCTRINE_SPEC.md, Retire Outright, NARROWED 2026-08-30: the retired
// class is UNANCHORED restlessness). That narrowing turns on ONE property —
// zero net translation about the perch point — which is exactly the kind of
// property that survives a review and then dies to a plausible refactor. P5
// is that property, asserted on the driver ranges rather than argued in a
// comment.
//
// WHAT IT ASSERTS
//
//   P1  the ruled constants, and the RELATIONS between them that no single
//       value can carry (headroom below the stated ceiling; the settle is
//       rarer than the punctuation; the settle's beat is not the punctuation
//       rhythm; the overshoot is inside its ≤4% bound)
//   P2  the amplitude denominator is the character's DRAWN height, not its
//       box — and the resulting table is REPORTED at both mounts (§6 row 1)
//   P3  §6 row 2 — the first flick lands inside 9s BY CONSTRUCTION: the max
//       bound, AND the scheduler's wait expression, which must be the plain
//       re-roll with no additive first-wait term
//   P4  §6 row 3 — the settle is a ONE-SHOT. `Animated.loop` never encloses a
//       settle duration
//   P5  §6 row 4 — ZERO NET TRANSLATION, on the driver ranges: the breath's
//       range is symmetric about 0, the settle's rest maps to exactly 0, the
//       gesture's last write is 0, and every value written is inside the
//       interpolation's DECLARED domain (nothing extrapolates)
//   P6  §4's collision rule, BOTH directions, and never queued
//   P7  the wing handle: commands in, no state out; installed only while
//       perched; and the settle's guard on it FAILS CLOSED (defer, never a
//       dip with no wing beat)
//   P8  §6 row 5 — Reduce Motion. Every `breath=` call site is gated on
//       `reduced`, so no new term or beat can run under RM
//   P9  the gesture's clock: the wing beat FINISHES INSIDE the recovery, so
//       the settle is one event rather than a beat with a tail hanging out
//   P10 the dip and the breath re-entry are one parallel step of EQUAL
//       duration, both travelling DOWN — the property that makes the nadir a
//       fixed floor and the dip's own contribution phase-independent
//
// AND FOR R-SW (§7):
//
//   P11 the ruled R-SW constants, and the relations — including the one that
//       keeps §5's decline TRUE rather than overturned: the journey must fit
//       inside the gap between journeys, or the gesture is the continuous
//       term §5 refused, reached without a loop and without the word
//   P12 §7 row 7 — the axis (translateX), the DENOMINATOR (drawn WIDTH, not
//       the vertical terms' drawn height), structural symmetry about a rest
//       that maps to exactly 0, and a driver that never leaves its declared
//       domain — traced through the `side` variable, since this term is
//       driven to a variable rather than to a literal
//   P13 §7 row 8 — the DWELL, by construction: an explicit hold at the
//       extreme expressed as a `delay` on the return leg, never a slow ease
//       and never an `Animated.delay` step off the native driver
//   P14 §7 row 9 — Reduce Motion reaches the sway: it hangs off `breathing`
//       in both the guard and the dependency array, so P8's population gate
//       covers it
//   P15 §7 row 11 — the deference runs ONE WAY and both ends are asserted:
//       neither merged conductor references the sway at all (P6 holds the
//       other end — the sway reads the lock and never takes it), and the
//       sway defers by re-rolling with nowhere to queue
//
// SCOPE OF THE CLAIM. Everything here is read from source and from the
// constants module. **No row claims any of it has been seen on a device.**
// §6 row 6 is Colin's eye next to the fox clip and this gate cannot stand in
// for it — what it can do is guarantee that the thing he looks at is the
// thing the spec ruled.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import * as mascot from '../src/constants/mascot.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const BEE = path.join(SRC, 'components/MascotBee.js');

let pass = 0;
const failures = [];
const ok = (label) => { pass += 1; console.log(`  ok   ${label}`); };
const bad = (label, detail) => {
  failures.push(`${label} — ${detail}`);
  console.log(`  FAIL ${label} — ${detail}`);
};
const note = (label) => console.log(`  note ${label}`);

const beeSrc = fs.readFileSync(BEE, 'utf8');
const parseJs = (src) => parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
const walk = (node, fn) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => walk(n, fn)); return; }
  if (typeof node.type === 'string') fn(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments') continue;
    walk(node[key], fn);
  }
};
const beeAst = parseJs(beeSrc);
const text = (n) => beeSrc.slice(n.start, n.end).replace(/\s+/g, ' ');
// Comments occupy their own ranges (never inside a statement's start/end),
// so blanking them out of a COPY gives a regex a codeOnly source to run
// against — a prose sentence explaining what the code does NOT do (e.g. "a
// queued gesture is a metronome") must not trip a check for what it DOES.
const beeCodeOnly = (beeAst.comments || [])
  .slice()
  .sort((a, b) => b.start - a.start)
  .reduce((src, c) => src.slice(0, c.start) + ' '.repeat(c.end - c.start) + src.slice(c.end), beeSrc);

// ── P1. the ruled constants, and the relations between them ────────────────
//
// The pinned values are pinned because a ruling names them: R-PW-1 §2,
// R-PW-2 §3, R-PW-3 §4. The RELATIONS underneath are the half no single
// number can carry, and each one is a way the composition breaks without any
// individual value looking wrong.
{
  const RULED = [
    ['FLICK_INTERVAL_MIN_MS', 4000, 'R-PW-1 §2'],
    ['FLICK_INTERVAL_MAX_MS', 9000, 'R-PW-1 §2'],
    ['BREATH_RISE_FRACTION', 0.032, 'R-PW-2 §3'],
    ['BREATH_RISE_CEILING', 0.045, 'R-PW-2 §3 — documented ceiling'],
    ['SETTLE_INTERVAL_MIN_MS', 20000, 'R-PW-3 §4'],
    ['SETTLE_INTERVAL_MAX_MS', 45000, 'R-PW-3 §4'],
    ['SETTLE_DIP_FRACTION', 0.03, 'R-PW-3 §4'],
    ['SETTLE_DIP_MS', 240, 'R-PW-3 §4'],
    ['SETTLE_RECOVER_MS', 520, 'R-PW-3 §4'],
    ['SETTLE_OVERSHOOT_FRACTION', 0.04, 'R-PW-3 §4 — "≤4% of the dip"'],
    ['SETTLE_OVERSHOOT_SPLIT', 0.72, 'R-PW-3 §4'],
    ['SETTLE_FLICK_BEATS', 1, 'R-PW-3 §4 — "one single wing flick"'],
  ];
  const wrong = RULED.filter(([name, want]) => mascot[name] !== want)
    .map(([name, want, why]) => `${name} is ${mascot[name]}, ruled ${want} (${why})`);
  if (wrong.length === 0) {
    ok(`P1a all twelve R-PW constants are the ruled values (${RULED.length} read from constants/mascot.js, never retyped here as a second source)`);
  } else {
    bad('P1a the R-PW constants are the ruled values', wrong.join('; '));
  }

  const relations = [
    [mascot.BREATH_RISE_FRACTION < mascot.BREATH_RISE_CEILING,
      'the rise ships BELOW its documented ceiling',
      `BREATH_RISE_FRACTION ${mascot.BREATH_RISE_FRACTION} must be < BREATH_RISE_CEILING ${mascot.BREATH_RISE_CEILING}. The R-series bar is that a token always keeps headroom, and 2.2% shipping AT its own stated ceiling is part of why there was nowhere to go when the device verdict came back "flat"`],
    [mascot.FLICK_INTERVAL_MIN_MS < mascot.FLICK_INTERVAL_MAX_MS,
      'the flick interval is an interval', 'MIN must be < MAX or the re-roll is a constant wearing a range\'s clothes'],
    [mascot.SETTLE_INTERVAL_MIN_MS < mascot.SETTLE_INTERVAL_MAX_MS,
      'the settle interval is an interval', 'MIN must be < MAX'],
    [mascot.SETTLE_INTERVAL_MIN_MS > mascot.FLICK_INTERVAL_MAX_MS,
      'weight is rarer than punctuation',
      `SETTLE_INTERVAL_MIN_MS ${mascot.SETTLE_INTERVAL_MIN_MS} must exceed FLICK_INTERVAL_MAX_MS ${mascot.FLICK_INTERVAL_MAX_MS}. They mutually defer (P6), so if the settle could fire as often as the flick the two would starve each other by re-rolling — and the term that loses is whichever one is cheaper to defer, which is not a design decision anybody made`],
    [mascot.SETTLE_FLICK_BEATS < mascot.FLICK_BEATS,
      'the settle\'s beat is not the punctuation rhythm',
      `SETTLE_FLICK_BEATS ${mascot.SETTLE_FLICK_BEATS} must be < FLICK_BEATS ${mascot.FLICK_BEATS}. §4: a double-flick inside the settle reads as the punctuation term firing coincidentally rather than as part of the same event`],
    [mascot.SETTLE_OVERSHOOT_FRACTION <= 0.04,
      'the overshoot is inside its ruled bound',
      `§4 rules "a small overshoot (≤4% of the dip)"; found ${mascot.SETTLE_OVERSHOOT_FRACTION}. An overshoot you can measure is a bounce, and a bounce is a cartoon`],
    [mascot.SETTLE_OVERSHOOT_SPLIT > 0.5 && mascot.SETTLE_OVERSHOOT_SPLIT < 1,
      'the rebound spends most of its time on the large excursion',
      `SETTLE_OVERSHOOT_SPLIT ${mascot.SETTLE_OVERSHOOT_SPLIT} must be in (0.5, 1) — a damped rebound decays faster than it rose`],
    [mascot.SETTLE_DIP_MS < mascot.SETTLE_RECOVER_MS,
      'down fast, up slow',
      `SETTLE_DIP_MS ${mascot.SETTLE_DIP_MS} must be < SETTLE_RECOVER_MS ${mascot.SETTLE_RECOVER_MS}. The asymmetry IS the weight — a symmetric dip reads as a bob`],
  ];
  const broken = relations.filter(([held]) => !held).map(([, what, why]) => `${what}: ${why}`);
  if (broken.length === 0) {
    ok(`P1b all ${relations.length} relations between the R-PW constants hold — the half no single value can carry`);
  } else {
    bad('P1b the relations between the R-PW constants hold', broken.join(' | '));
  }
}

// ── P2. the denominator, and the table ─────────────────────────────────────
//
// THE ROW THAT EXISTS BECAUSE THE SPEC'S OWN ARITHMETIC IS OFF. Both R-PW-2
// and R-PW-3 state their amplitudes as a fraction "of drawn height" and then
// cite pt figures computed against the BOX (3.2% of 132 = 4.224). The
// character is drawn at `MASCOT_WIDTH_FRACTION / MASCOT_ASPECT` of its box —
// 0.7076 — so every cited figure is 1.4132x the travel the constant actually
// produces. A transparent box is not the object.
//
// The RULING is the fraction; the pt figures are a derivation of it, so this
// gate ships the fraction and reports the correction rather than obeying a
// citation. What it ASSERTS is the part that would make the numbers wrong for
// good: that the denominator in the component is the drawn height.
{
  const DRAWN_PER_BOX = mascot.MASCOT_WIDTH_FRACTION / mascot.MASCOT_ASPECT;
  const MOUNTS = [
    ['hero (132pt stage)', 132 * mascot.WELCOME_BEE_STAGE_FRACTION],
    ['chrome', 44],
  ];

  // Both interpolations must scale by `height` (the drawn height), never by
  // `size` (the box). Read off the outputRange expressions, so a refactor that
  // swaps the denominator is what fails, not a comment about it.
  const ranges = [];
  walk(beeAst.program, (n) => {
    if (n.type !== 'CallExpression') return;
    if (n.callee?.type !== 'MemberExpression' || n.callee.property?.name !== 'interpolate') return;
    const arg = n.arguments[0];
    if (arg?.type !== 'ObjectExpression') return;
    const out = arg.properties.find((p) => p.key?.name === 'outputRange');
    const inp = arg.properties.find((p) => p.key?.name === 'inputRange');
    if (!out || !inp) return;
    ranges.push({
      driver: text(n.callee.object),
      input: inp.value.elements.map(text),
      output: out.value.elements.map(text),
    });
  });
  const body = ranges.filter((r) => r.driver === 'rise' || r.driver === 'settle');
  const boxed = body.filter((r) => r.output.some((e) => /\bsize\b/.test(e) || !/\bheight\b/.test(e.replace(/^0$/, 'height'))));
  if (body.length === 2 && boxed.length === 0) {
    ok('P2a both body interpolations scale by the character\'s DRAWN height, never by the box — a transparent box is not the object');
  } else if (body.length !== 2) {
    bad('P2a both body interpolations scale by the drawn height',
      `expected exactly 2 body interpolations (rise, settle), found ${body.length}: ${body.map((r) => r.driver).join(', ') || 'none'} — this row FAILS CLOSED, because a body term it cannot see is a body term it cannot check the denominator of`);
  } else {
    bad('P2a both body interpolations scale by the drawn height',
      `${boxed.map((r) => `${r.driver} -> [${r.output.join(', ')}]`).join('; ')} — the fraction is "of drawn height" (${DRAWN_PER_BOX.toFixed(6)} of the box); scaling by \`size\` inflates every ruled amplitude by ${(1 / DRAWN_PER_BOX).toFixed(4)}x`);
  }

  console.log('\n  §6 row 1 — measured amplitude table, from the constants as landed:\n');
  console.log('    mount            drawn h   breath p2p   settle dip   overshoot   nadir below rest');
  for (const [name, characterBox] of MOUNTS) {
    const h = characterBox * DRAWN_PER_BOX;
    const breathP2P = mascot.BREATH_RISE_FRACTION * h;
    const dip = mascot.SETTLE_DIP_FRACTION * h;
    const over = mascot.SETTLE_OVERSHOOT_FRACTION * dip;
    // The breath is stopped at its LOW point during the dip (P10), so the
    // floor the character settles onto is the same absolute point every time.
    const nadir = breathP2P / 2 + dip;
    console.log(
      `    ${name.padEnd(20)} ${h.toFixed(4).padStart(7)}   ${breathP2P.toFixed(4).padStart(10)}   ${dip.toFixed(4).padStart(10)}   ${over.toFixed(4).padStart(9)}   ${nadir.toFixed(4).padStart(16)}`,
    );
  }
  console.log('');
  note('P2b REPORTED, NOT GATED — the spec\'s own pt citations are computed against the BOX:');
  note(`     §3 cites 4.224pt / 1.408pt for the breath; the ruled 3.2% OF DRAWN HEIGHT gives ${(mascot.BREATH_RISE_FRACTION * 132 * mascot.WELCOME_BEE_STAGE_FRACTION * DRAWN_PER_BOX).toFixed(4)}pt / ${(mascot.BREATH_RISE_FRACTION * 44 * DRAWN_PER_BOX).toFixed(4)}pt.`);
  note(`     §4 cites 3.96pt / 1.32pt for the dip; the ruled 3% gives ${(mascot.SETTLE_DIP_FRACTION * 132 * mascot.WELCOME_BEE_STAGE_FRACTION * DRAWN_PER_BOX).toFixed(4)}pt / ${(mascot.SETTLE_DIP_FRACTION * 44 * DRAWN_PER_BOX).toFixed(4)}pt.`);
  note(`     The hero citation is ${(1 / (mascot.WELCOME_BEE_STAGE_FRACTION * DRAWN_PER_BOX)).toFixed(4)}x the shipped travel because it omits both nested boxes; chrome is ${(1 / DRAWN_PER_BOX).toFixed(4)}x because it omits the transparent character box.`);
  note('     The FRACTION is the ruling and ships as ruled; the citations are a derivation and are Lumen\'s to correct.');
  note(`     Recovering the cited pt figures would require fractions ${(mascot.BREATH_RISE_FRACTION / (mascot.WELCOME_BEE_STAGE_FRACTION * DRAWN_PER_BOX)).toFixed(5)} (hero) / ${(mascot.BREATH_RISE_FRACTION / DRAWN_PER_BOX).toFixed(5)} (chrome), both above the documented ${mascot.BREATH_RISE_CEILING} ceiling — a new ruling, not a tune.`);
  console.log('');
}

// ── P3. the first flick lands inside a first glance ────────────────────────
{
  const GLANCE_MS = 9000;
  let waitExpr = null;
  walk(beeAst.program, (n) => {
    if (n.type !== 'VariableDeclarator' || n.id?.name !== 'wait' || !n.init) return;
    // Two `wait` declarators (one per scheduler) — record both, keyed by which
    // constants they read, so the row cannot pass by reading the settle's.
    const src = text(n.init);
    if (/FLICK_INTERVAL/.test(src)) waitExpr = src;
  });
  const CANON = 'FLICK_INTERVAL_MIN_MS + Math.random() * (FLICK_INTERVAL_MAX_MS - FLICK_INTERVAL_MIN_MS)';
  if (waitExpr === null) {
    bad('P3 the first flick lands inside 9s by construction',
      'could not find the flick scheduler\'s `wait` declarator in MascotBee.js — FAILS CLOSED: a wait expression this row cannot read is a wait it cannot bound');
  } else if (waitExpr !== CANON) {
    bad('P3 the first flick lands inside 9s by construction',
      `the flick's wait is \`${waitExpr}\`, not the plain re-roll \`${CANON}\`. §2 rules NO separate first-wait constant, so the bound is the interval's own max — any additive or multiplicative term here breaks that reasoning even when the constants are untouched`);
  } else if (mascot.FLICK_INTERVAL_MAX_MS > GLANCE_MS) {
    bad('P3 the first flick lands inside 9s by construction',
      `FLICK_INTERVAL_MAX_MS ${mascot.FLICK_INTERVAL_MAX_MS} exceeds the ${GLANCE_MS}ms glance`);
  } else {
    const median = (mascot.FLICK_INTERVAL_MIN_MS + mascot.FLICK_INTERVAL_MAX_MS) / 2;
    ok(`P3 §6 row 2 — the first flick lands within ${mascot.FLICK_INTERVAL_MAX_MS}ms of mount BY CONSTRUCTION (median ${median}ms), and the wait is the plain re-roll with no first-wait term`);
  }
}

// ── P4. the settle is a one-shot ───────────────────────────────────────────
{
  const looped = [];
  walk(beeAst.program, (n) => {
    if (n.type !== 'CallExpression') return;
    if (text(n.callee) !== 'Animated.loop') return;
    const inner = text(n);
    if (/SETTLE_/.test(inner)) looped.push(inner.slice(0, 90));
  });
  if (looped.length === 0) {
    ok('P4 §6 row 3 — no `Animated.loop` encloses a SETTLE_ duration: the settle is a one-shot, re-armed by its own callback, so an unmount stops exactly one thing');
  } else {
    bad('P4 the settle is a one-shot', `${looped.length} \`Animated.loop\` call(s) enclose settle constants: ${looped.join(' | ')} — a looped settle is the retired ambient class with a new name`);
  }
}

// ── P5. zero net translation, on the driver ranges ─────────────────────────
//
// The doctrine's Retire-Outright narrowing (2026-08-30) turns on exactly this
// property, so it is asserted where it can be broken — the ranges and the
// values written into them — rather than where it is described.
{
  const problems = [];
  const ranges = new Map();
  walk(beeAst.program, (n) => {
    if (n.type !== 'CallExpression') return;
    if (n.callee?.type !== 'MemberExpression' || n.callee.property?.name !== 'interpolate') return;
    const arg = n.arguments[0];
    if (arg?.type !== 'ObjectExpression') return;
    const out = arg.properties.find((p) => p.key?.name === 'outputRange');
    const inp = arg.properties.find((p) => p.key?.name === 'inputRange');
    if (!out || !inp) return;
    ranges.set(text(n.callee.object), {
      input: inp.value.elements.map(text),
      output: out.value.elements.map(text),
    });
  });

  const riseR = ranges.get('rise');
  const settleR = ranges.get('settle');
  if (!riseR || !settleR) {
    problems.push('could not read both body interpolations (rise, settle) — FAILS CLOSED');
  } else {
    // The breath: symmetric about 0. Asserted structurally — the two ends must
    // be the same expression with one sign flipped — because two numerically
    // equal-and-opposite CONSTANTS could still be edited apart, and the point
    // is that they cannot BE apart.
    const [a, b] = riseR.output;
    const strip = (s) => s.replace(/[()\s]/g, '');
    if (strip(b) !== `-${strip(a)}`.replace('--', '') && strip(a) !== strip(b).replace(/^-/, '')) {
      problems.push(`the breath's range [${a}, ${b}] is not one expression with a flipped sign — symmetry about the perch point must be structural, not two numbers that happen to agree`);
    }
    // The settle: rest is EXACTLY 0, at a declared stop.
    const restAt = settleR.input.findIndex((e) => e === '0');
    if (restAt < 0) {
      problems.push(`the settle's inputRange [${settleR.input.join(', ')}] has no 0 stop — the gesture has no declared rest`);
    } else if (settleR.output[restAt] !== '0') {
      problems.push(`the settle's rest maps to \`${settleR.output[restAt]}\`, not 0 — a settle whose rest is not zero moves the perch point every time it fires`);
    }
    // Nothing extrapolates: every value written to `settle` is a declared stop.
    const declared = new Set(settleR.input.map((e) => e.replace(/\s/g, '')));
    const written = new Set();
    walk(beeAst.program, (n) => {
      if (n.type !== 'CallExpression') return;
      if (text(n.callee) !== 'Animated.timing' && text(n.callee) !== 'Animated.spring') return;
      if (text(n.arguments[0]) !== 'settle') return;
      const cfg = n.arguments[1];
      const to = cfg?.properties?.find((p) => p.key?.name === 'toValue');
      written.add(to ? text(to.value).replace(/\s/g, '') : '<unreadable>');
    });
    walk(beeAst.program, (n) => {
      if (n.type !== 'CallExpression') return;
      if (n.callee?.type !== 'MemberExpression') return;
      if (text(n.callee.object) !== 'settle' || n.callee.property?.name !== 'setValue') return;
      written.add(text(n.arguments[0]).replace(/\s/g, ''));
    });
    if (written.size === 0) {
      problems.push('no writes to `settle` found — FAILS CLOSED: a gesture this row cannot see is a gesture whose domain it cannot bound');
    }
    const outside = [...written].filter((v) => !declared.has(v));
    if (outside.length) {
      problems.push(`\`settle\` is driven to ${outside.map((v) => `\`${v}\``).join(', ')}, outside its declared domain {${[...declared].join(', ')}} — interpolation's \`extend\` default would happily render it, at an amplitude nobody measured. A bound on a pure mapping must name its reachable domain`);
    }
    // The gesture's LAST write is the rest value.
    const settleWrites = [];
    walk(beeAst.program, (n) => {
      if (n.type !== 'CallExpression' || text(n.callee) !== 'Animated.timing') return;
      if (text(n.arguments[0]) !== 'settle') return;
      const to = n.arguments[1]?.properties?.find((p) => p.key?.name === 'toValue');
      settleWrites.push({ at: n.start, to: to ? text(to.value).replace(/\s/g, '') : '?' });
    });
    settleWrites.sort((x, y) => x.at - y.at);
    if (settleWrites.length && settleWrites[settleWrites.length - 1].to !== '0') {
      problems.push(`the last write to \`settle\` in source order is ${settleWrites[settleWrites.length - 1].to}, not 0 — the gesture must come to rest AT rest`);
    }
    // And the breath's re-entry lands on the loop's own start value, so there
    // is nothing to jump-cut back from (§4's band-re-entry requirement).
    let reentry = null;
    walk(beeAst.program, (n) => {
      if (n.type !== 'CallExpression' || text(n.callee) !== 'Animated.parallel') return;
      walk(n.arguments[0], (m) => {
        if (m.type !== 'CallExpression' || text(m.callee) !== 'Animated.timing') return;
        if (text(m.arguments[0]) !== 'rise') return;
        const to = m.arguments[1]?.properties?.find((p) => p.key?.name === 'toValue');
        reentry = to ? text(to.value) : '<unreadable>';
      });
    });
    if (reentry !== '0') {
      problems.push(`the breath's re-entry inside the settle drives \`rise\` to ${reentry === null ? '<not found>' : `\`${reentry}\``}, not 0. 0 is where the loop STARTS, and landing anywhere else is the jump-cut §4 forbids`);
    }
  }

  if (problems.length === 0) {
    ok('P5 §6 row 4 — zero net translation holds on the driver ranges: the breath is structurally symmetric, the settle\'s rest is exactly 0, its last write is 0, nothing leaves the declared domain, and the breath re-enters at the loop\'s own start');
  } else {
    bad('P5 zero net translation, on the driver ranges', problems.join(' | '));
  }
}

// ── P6. the collision rule, and who yields to whom ─────────────────────────
//
// §4: "simple mutual defer". A defer is only a defer if BOTH sides have one —
// one-sided, the unguarded gesture cuts across the other and the bug looks
// like a rendering glitch. And it must RE-ROLL rather than queue: a queued
// gesture fires the instant the other releases, which is the one moment the
// character has just finished moving.
//
// EXTENDED 2026-09-03 (R-SW §7 row 3). There are now THREE readers of the
// lock and still exactly TWO owners of it, and the asymmetry is the ruling
// rather than an omission — so it is asserted, not merely permitted.
//
// §4's symmetry between the flick and the settle is MECHANICAL: both drive
// `own`, the wing value, so two drivers would meet on one value and that is
// what R46/R83 forbid. Nothing binds the sway to either — it drives its own
// value on its own axis through its own conductor — so the only thing left to
// decide the direction is arithmetic. A 4.0s journey landing every 8-14s
// occupies about a third of the clock; a flick that deferred to it would see
// its effective interval stretch from ~6.5s to ~10s, which retunes R-PW-1
// ("the first flick lands inside 9s BY CONSTRUCTION") from a term that §7 row
// 10 says may never reopen the merged ones. So the new term yields to the old
// ones and never the other way: it READS the lock and does not TAKE it.
//
// Which means this row's `= true` count is the load-bearing half. If the sway
// ever starts taking the lock, every figure P3 reports stays green and the
// flick quietly goes rare — the exact failure R-PW-1 was written to fix,
// arriving through a door P3 cannot see.
{
  const defers = [];
  walk(beeAst.program, (n) => {
    if (n.type !== 'IfStatement') return;
    const test = text(n.test);
    if (!/gesture\.busy/.test(test)) return;
    const body = text(n.consequent);
    const rearm = /\bschedule\(\)/.test(body) ? 'schedule' : (/\bscheduleSettle\(\)/.test(body) ? 'scheduleSettle' : (/\bscheduleSway\(\)/.test(body) ? 'scheduleSway' : null));
    defers.push({ test, rearm, returns: /\breturn;/.test(body), body });
  });
  const problems = [];
  if (defers.length !== 3) {
    problems.push(`expected exactly 3 \`gesture.busy\` guards (the flick, the settle, the sway), found ${defers.length} — FAILS CLOSED`);
  }
  const armed = new Set(defers.map((d) => d.rearm).filter(Boolean));
  if (!armed.has('schedule')) problems.push('the flick\'s guard does not re-roll its own timer — that is a DROPPED gesture, not a deferred one');
  if (!armed.has('scheduleSettle')) problems.push('the settle\'s guard does not re-roll its own timer — that is a DROPPED gesture, not a deferred one');
  if (!armed.has('scheduleSway')) problems.push('the sway\'s guard does not re-roll its own timer — that is a DROPPED gesture, not a deferred one');
  for (const d of defers) {
    if (!d.returns) problems.push(`a \`gesture.busy\` guard re-rolls but does not \`return\` — it would re-roll AND fire: \`${d.test}\``);
  }
  // Never queued: nothing may hold a pending gesture across the lock. Run
  // against the comment-stripped copy — the CODE must not name a queue slot;
  // prose explaining why one was avoided is not the thing this row polices.
  if (/queue|pending|deferred\s*=/.test(beeCodeOnly)) {
    problems.push('the file names a queue/pending slot — §4 rules mutual defer, never a queue: a queued gesture is a metronome with a buffer');
  }
  // One owner for the lock. `absorb` runs INSIDE the settle's hold and must
  // not touch it; two writers for one bit is how a lock stops working.
  const sets = beeSrc.match(/gesture\.busy\s*=\s*true/g) || [];
  const clears = beeSrc.match(/gesture\.busy\s*=\s*false/g) || [];
  if (sets.length !== 2) problems.push(`\`gesture.busy = true\` is written ${sets.length} times, expected 2 — the wing-sharing pair OWN the lock and the sway only reads it. A third writer is the sway taking a lock the merged terms would then wait on, which stretches the flick's ruled interval without touching a single constant P3 can see`);
  if (clears.length < 2) problems.push(`\`gesture.busy = false\` is written ${clears.length} times — every path that takes the lock must release it`);
  let absorbTouchesLock = false;
  walk(beeAst.program, (n) => {
    if (n.type !== 'AssignmentExpression') return;
    if (text(n.left) !== 'gesture.absorb') return;
    if (/gesture\.busy/.test(text(n.right))) absorbTouchesLock = true;
  });
  if (absorbTouchesLock) problems.push('`gesture.absorb` writes `gesture.busy` — the settle takes that lock and the settle releases it; two owners for one bit is how a lock stops working');

  if (problems.length === 0) {
    ok(`P6 §4's collision rule holds in both directions between the wing-sharing pair, and §7's one-way deference holds for the sway — ${defers.length} guards, each re-rolling its own interval and returning, no queue, and ${sets.length} owners of the lock against ${defers.length} readers`);
  } else {
    bad('P6 the collision rule, and who yields to whom', problems.join(' | '));
  }
}

// ── P7. the wing handle ────────────────────────────────────────────────────
{
  const problems = [];
  const assigns = [];
  walk(beeAst.program, (n) => {
    if (n.type !== 'AssignmentExpression' || text(n.left) !== 'gesture.absorb') return;
    assigns.push(n);
  });
  const installs = assigns.filter((n) => text(n.right) !== 'null');
  const clears = assigns.filter((n) => text(n.right) === 'null');
  if (installs.length !== 1) problems.push(`\`gesture.absorb\` is installed ${installs.length} times, expected exactly 1 — one writer, or the settle cannot know which wing it is commanding`);
  if (clears.length !== 1) problems.push(`\`gesture.absorb\` is cleared ${clears.length} times, expected exactly 1 (the effect's cleanup) — a handle that outlives its channel commands a wing that is gone`);

  // Installed only while PERCHED: the assignment sits under a `breathing`
  // test, so the handle's existence is co-extensive with the settle's own
  // precondition. Half a composed gesture is not the gesture.
  if (installs.length === 1) {
    const at = installs[0].start;
    let guarded = false;
    walk(beeAst.program, (n) => {
      if (n.type !== 'IfStatement') return;
      if (text(n.test) !== 'breathing') return;
      if (n.consequent.start <= at && at <= n.consequent.end) guarded = true;
    });
    if (!guarded) problems.push('the handle is installed outside an `if (breathing)` guard — it would exist on the fluttering path, where there is no perch to settle onto');

    // COMMANDS IN, NO STATE OUT (R-N4): zero parameters, and no value returned.
    const fn = installs[0].right;
    if (fn.type !== 'ArrowFunctionExpression' && fn.type !== 'FunctionExpression') {
      problems.push(`the handle is not a function literal (\`${text(fn).slice(0, 40)}\`) — FAILS CLOSED, this row cannot see what it does`);
    } else {
      if (fn.params.length !== 0) problems.push(`the handle takes ${fn.params.length} parameter(s) — a command takes nothing; anything it needed to be told is state the settle would be resolving on the wing's behalf`);
      walk(fn.body, (n) => {
        if (n.type === 'ReturnStatement' && n.argument) {
          problems.push(`the handle returns a value (\`${text(n.argument).slice(0, 40)}\`) — commands in, NO STATE OUT: a return value is the wing channel reporting, and the settle would start deciding on it`);
        }
      });
    }
  }

  // And the settle's guard on it FAILS CLOSED — absence defers, never dips.
  let failsClosed = false;
  walk(beeAst.program, (n) => {
    if (n.type !== 'IfStatement') return;
    if (!/!\s*gesture\.absorb/.test(text(n.test))) return;
    if (/scheduleSettle\(\)/.test(text(n.consequent)) && /return;/.test(text(n.consequent))) failsClosed = true;
  });
  if (!failsClosed) {
    problems.push('the settle does not defer when the handle is absent — a dip with no wing beat to absorb it is a bob, and the safe direction is to not perform half of a composed gesture');
  }

  if (problems.length === 0) {
    ok('P7 the wing handle is commands-in/no-state-out, installed once under `breathing` and cleared once on teardown, and the settle FAILS CLOSED on its absence');
  } else {
    bad('P7 the wing handle', problems.join(' | '));
  }
}

// ── P8. Reduce Motion — the row §6 calls load-bearing ──────────────────────
//
// `MascotBee` has no `reduced` prop: RM is the CALL SITE's, expressed by not
// asking for breath. So the freeze holds only while every `breath=` in the
// app is gated on it, and that is a population, not a fact about this file.
{
  const jsFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? jsFiles(p) : (e.name.endsWith('.js') ? [p] : []);
  });
  const sites = [];
  for (const file of jsFiles(SRC)) {
    const src = fs.readFileSync(file, 'utf8');
    if (!src.includes('<MascotBee')) continue;
    const ast = parseJs(src);
    walk(ast.program, (n) => {
      if (n.type !== 'JSXOpeningElement' || n.name?.name !== 'MascotBee') return;
      const attr = n.attributes.find((a) => a.type === 'JSXAttribute' && a.name?.name === 'breath');
      if (!attr) return;
      const expr = attr.value?.type === 'JSXExpressionContainer'
        ? src.slice(attr.value.expression.start, attr.value.expression.end).replace(/\s+/g, ' ')
        : '<literal true>';
      sites.push({ at: `${path.relative(ROOT, file)}:${n.loc.start.line}`, expr });
    });
  }
  const ungated = sites.filter((s) => !/\breduced\b/.test(s.expr));
  if (sites.length === 0) {
    bad('P8 Reduce Motion — no new term or beat runs under RM',
      'found zero `breath=` call sites — FAILS CLOSED: the freeze is a property of a population, and an empty population is this row seeing nothing rather than nothing being wrong');
  } else if (ungated.length === 0) {
    ok(`P8 §6 row 5 — all ${sites.length} \`breath=\` call sites are gated on \`reduced\` (${sites.map((s) => s.at).join(', ')}), so the doctrine's complete freeze holds and neither the rise nor the settle can run under RM`);
  } else {
    bad('P8 Reduce Motion — no new term or beat runs under RM',
      `${ungated.map((s) => `${s.at} breath={${s.expr}}`).join('; ')} — a bee breathing under Reduce Motion now also SETTLES under it, so this row got heavier without changing`);
  }
}

// ── P9. the gesture's clock ────────────────────────────────────────────────
{
  const wingMs = (mascot.SETTLE_FLICK_BEATS * 2 + 1) * mascot.WING_BEAT_MS;
  const total = mascot.SETTLE_DIP_MS + mascot.SETTLE_RECOVER_MS;
  const rebound = mascot.SETTLE_RECOVER_MS * mascot.SETTLE_OVERSHOOT_SPLIT;
  if (wingMs <= mascot.SETTLE_RECOVER_MS) {
    ok(`P9 the wing beat finishes inside the recovery (${wingMs}ms of wing — ${mascot.SETTLE_FLICK_BEATS} beat + the band re-entry tail — against ${mascot.SETTLE_RECOVER_MS}ms), so the settle is ONE event; total gesture ${total}ms, rebound ${rebound.toFixed(1)}ms + ${(mascot.SETTLE_RECOVER_MS - rebound).toFixed(1)}ms tail`);
  } else {
    bad('P9 the wing beat finishes inside the recovery',
      `the wing runs ${wingMs}ms against a ${mascot.SETTLE_RECOVER_MS}ms recovery — the body would come to rest while the wings were still moving, which reads as the punctuation term firing late rather than as one gesture`);
  }
}

// ── P10. the dip and the breath re-entry are one step ──────────────────────
//
// The property that makes the gesture phase-independent, and the one most
// likely to be lost to a tidy-up: if these two ever stop being ONE parallel
// step of EQUAL duration, one term is still travelling at the nadir and the
// wing beat lands on a body that has not finished arriving.
{
  const problems = [];
  let found = 0;
  walk(beeAst.program, (n) => {
    if (n.type !== 'CallExpression' || text(n.callee) !== 'Animated.parallel') return;
    const legs = [];
    walk(n.arguments[0], (m) => {
      if (m.type !== 'CallExpression' || text(m.callee) !== 'Animated.timing') return;
      const cfg = m.arguments[1];
      const get = (k) => { const p = cfg?.properties?.find((q) => q.key?.name === k); return p ? text(p.value) : null; };
      legs.push({ target: text(m.arguments[0]), to: get('toValue'), dur: get('duration'), easing: get('easing') });
    });
    if (!legs.some((l) => l.target === 'settle')) return;
    found += 1;
    const targets = legs.map((l) => l.target).sort().join(',');
    if (targets !== 'rise,settle') problems.push(`the dip's parallel drives [${targets}], expected exactly rise + settle`);
    const durs = new Set(legs.map((l) => l.dur));
    if (durs.size !== 1) problems.push(`the dip's two legs run for different durations (${[...durs].join(' vs ')}) — one term would still be moving at the nadir`);
    if (![...durs][0] || ![...durs][0].includes('SETTLE_DIP_MS')) problems.push(`the dip's duration is \`${[...durs][0]}\`, not SETTLE_DIP_MS`);
    const easings = new Set(legs.map((l) => l.easing));
    if (easings.size !== 1) problems.push(`the dip's two legs use different easings (${[...easings].join(' vs ')}) — they must arrive together, not merely finish together`);
    if (![...easings][0] || !/Easing\.in\(/.test([...easings][0])) problems.push(`the dip eases \`${[...easings][0]}\`, not ease-IN — dropping onto mass accelerates; a symmetric or ease-out drop reads as a lift`);
    const settleLeg = legs.find((l) => l.target === 'settle');
    const riseLeg = legs.find((l) => l.target === 'rise');
    if (settleLeg?.to !== '1') problems.push(`the dip drives \`settle\` to ${settleLeg?.to}, not 1 (its full declared dip)`);
    if (riseLeg?.to !== '0') problems.push(`the dip drives \`rise\` to ${riseLeg?.to}, not 0. 0 is the breath's LOW point, which is what makes both terms travel DOWN together; any other target moves the breath AGAINST the dip and the nadir stops being a fixed floor`);
  });
  if (found !== 1) {
    problems.push(`expected exactly 1 \`Animated.parallel\` driving the settle, found ${found} — FAILS CLOSED`);
  }
  if (problems.length === 0) {
    ok('P10 the dip and the breath re-entry are ONE parallel step, equal duration, equal easing, both travelling DOWN — so the nadir is a fixed floor and the dip\'s own contribution is phase-independent');
  } else {
    bad('P10 the dip and the breath re-entry are one step', problems.join(' | '));
  }
}

// ── P11. the R-SW constants, and the line between a gesture and an oscillator
//
// §7 (R-SW), Colin's fox re-ruling of 2026-09-03. Same split as P1: the
// PINNED values are pinned because the ruling names them, and the RELATIONS
// underneath are the half no single number can carry.
//
// The last relation is the load-bearing one and it is why this term is legal
// at all. §5 declined "a third continuous term (lateral sway / body roll)"
// because continuous terms blur into hover, and §7 does not overturn that
// reason — it says this is a one-shot GESTURE rather than an oscillator, so
// the decline never applied. That distinction is not a description: it is the
// arithmetic fact that the journey FITS INSIDE the gap between journeys. Let
// the journey grow past the interval's floor and the bee is displaced more
// often than it is home, which is the smear §5 refused, arrived at without
// anyone adding a loop or writing the word "continuous" anywhere.
{
  const RULED = [
    ['SWAY_OFFSET_FRACTION', 0.033, 'R-SW-1 §7 — "±3.3% of DRAWN width"'],
    ['SWAY_INTERVAL_MIN_MS', 8000, 'R-SW-2 §7 — "every 8-14s, re-rolled"'],
    ['SWAY_INTERVAL_MAX_MS', 14000, 'R-SW-2 §7'],
    ['SWAY_DIRECTION_BIAS', 0.7, 'R-SW-2 §7 — "a 70/30 bias away from the last side"'],
  ];
  const wrong = RULED.filter(([name, want]) => mascot[name] !== want)
    .map(([name, want, why]) => `${name} is ${mascot[name]}, ruled ${want} (${why})`);
  if (wrong.length === 0) {
    ok(`P11a all ${RULED.length} ruled R-SW constants are the ruled values, read from constants/mascot.js`);
  } else {
    bad('P11a the R-SW constants are the ruled values', wrong.join('; '));
  }

  const journey = mascot.SWAY_OUT_MS + mascot.SWAY_DWELL_MS + mascot.SWAY_HOME_MS;
  const relations = [
    [mascot.SWAY_OFFSET_FRACTION < mascot.SWAY_OFFSET_CEILING,
      'the sway ships BELOW its documented ceiling',
      `SWAY_OFFSET_FRACTION ${mascot.SWAY_OFFSET_FRACTION} must be < SWAY_OFFSET_CEILING ${mascot.SWAY_OFFSET_CEILING} — the R-series bar, and §7 row 6's advance axis needs somewhere to advance TO`],
    [mascot.SWAY_INTERVAL_MIN_MS < mascot.SWAY_INTERVAL_MAX_MS,
      'the sway interval is an interval', 'MIN must be < MAX or the re-roll is a constant wearing a range\'s clothes'],
    [mascot.SWAY_DWELL_MS >= 1000 && mascot.SWAY_DWELL_MS <= 2000,
      'the dwell is inside the fox\'s measured hold',
      `§7 measures "a 1-2s HOLD at the extreme"; SWAY_DWELL_MS is ${mascot.SWAY_DWELL_MS}. Below the band the hold stops being separable from the ease and the gesture reads as drift — which is the one thing row 8 exists to forbid`],
    [journey >= 4000 && journey <= 5000,
      'the journey is the fox\'s measured length',
      `§7 measures "one journey per ~4-5s"; out+dwell+home is ${journey}ms`],
    [mascot.SWAY_OUT_MS !== mascot.SWAY_HOME_MS,
      'the journey out is not the journey home',
      `SWAY_OUT_MS ${mascot.SWAY_OUT_MS} must differ from SWAY_HOME_MS ${mascot.SWAY_HOME_MS}. A symmetric out-and-back is a pendulum: the interval can be unlearnable and the SHAPE still read as a metronome, because the eye learns shapes`],
    [mascot.SWAY_DIRECTION_BIAS > 0.5 && mascot.SWAY_DIRECTION_BIAS < 1,
      'the direction is biased, not strict and not fair',
      `SWAY_DIRECTION_BIAS ${mascot.SWAY_DIRECTION_BIAS} must be in (0.5, 1). At 1 the sequence is strict left-right-left-right — a metronome one level up from the interval, and sequences are exactly what an eye learns. At or below 0.5 the bias points at the side he just left, which is a different gesture than the one ruled`],
    [journey < mascot.SWAY_INTERVAL_MIN_MS,
      'THE GESTURE FITS INSIDE THE GAP — this is the line between §7 and what §5 declined',
      `out+dwell+home is ${journey}ms and must stay under SWAY_INTERVAL_MIN_MS ${mascot.SWAY_INTERVAL_MIN_MS}. §5 declined a continuous lateral term because continuous terms blur into hover; §7 is legal because this one spends most of its life at rest. Let the journey outgrow the floor of its own interval and the bee is displaced more often than it is home — the smear §5 refused, reached with no loop and no one ever writing the word`],
  ];
  const broken = relations.filter(([held]) => !held).map(([, what, why]) => `${what}: ${why}`);
  if (broken.length === 0) {
    ok(`P11b all ${relations.length} relations between the R-SW constants hold — including the one that keeps §5's decline true rather than overturned (journey ${journey}ms inside a ${mascot.SWAY_INTERVAL_MIN_MS}ms floor, at rest ${(100 * (1 - journey / ((mascot.SWAY_INTERVAL_MIN_MS + mascot.SWAY_INTERVAL_MAX_MS) / 2))).toFixed(1)}% of a median cycle)`);
  } else {
    bad('P11b the relations between the R-SW constants hold', broken.join(' | '));
  }
}

// ── P12. the sway's axis, its denominator, and its symmetry ────────────────
//
// §7 row 7. The zero-net-translation bar (§6 row 4) reaches this term
// unchanged, so it is asserted the same way P5 asserts the breath's: on the
// driver range, structurally, rather than argued in a comment.
//
// THE DENOMINATOR IS THE OTHER HALF AND IT IS NOT THE SAME ONE. The two
// vertical terms scale by the drawn HEIGHT (P2). This one scales by the drawn
// WIDTH, because the fox's 6.7% was its centroid's travel over its own drawn
// x-extent — a constant only means anything inside the frame it was measured
// in. `height` is in scope one line away and reads as the safer choice; it
// would silently ship 1.0356x the ruled excursion, which is the same category
// error R-PW-2's correction block was written for, one axis over.
{
  const problems = [];
  let swayR = null;
  walk(beeAst.program, (n) => {
    if (n.type !== 'CallExpression') return;
    if (n.callee?.type !== 'MemberExpression' || n.callee.property?.name !== 'interpolate') return;
    if (text(n.callee.object) !== 'sway') return;
    const arg = n.arguments[0];
    if (arg?.type !== 'ObjectExpression') return;
    const out = arg.properties.find((p) => p.key?.name === 'outputRange');
    const inp = arg.properties.find((p) => p.key?.name === 'inputRange');
    if (!out || !inp) return;
    swayR = { input: inp.value.elements.map(text), output: out.value.elements.map(text) };
  });

  // Which transform property it drives. On the wrong one this is a vertical
  // term with a horizontal constant, and every figure P11 prints stays true.
  let axis = null;
  walk(beeAst.program, (n) => {
    if (n.type !== 'ObjectProperty' && n.type !== 'Property') return;
    if (!/\bsway\.interpolate\b/.test(text(n.value))) return;
    axis = n.key?.name ?? text(n.key);
  });
  if (axis !== 'translateX') {
    problems.push(`the sway drives \`${axis === null ? '<not found>' : axis}\`, not \`translateX\` — R-SW-1 is a LATERAL weight shift, and on any other property its ruled fraction is a number measured in one frame and spent in another`);
  }

  if (!swayR) {
    problems.push('could not read the sway\'s interpolation — FAILS CLOSED: a term this row cannot see is a term whose symmetry and denominator it cannot check');
  } else {
    const strip = (s) => s.replace(/[()\s]/g, '');
    // Drawn WIDTH, never the drawn height and never the box.
    const wrongDenominator = swayR.output.filter((e) => e !== '0' && (!/\bwidth\b/.test(e) || /\bheight\b/.test(e) || /\bsize\b/.test(e)));
    if (wrongDenominator.length) {
      problems.push(`the sway's outputRange [${swayR.output.join(', ')}] does not scale by the drawn \`width\` — ${wrongDenominator.join('; ')}. Against \`height\` the shipped excursion is ${(1 / mascot.MASCOT_ASPECT).toFixed(4)}x the ruled one; against \`size\` it is ${(1 / mascot.MASCOT_WIDTH_FRACTION).toFixed(4)}x`);
    }
    // Symmetric about the perch point, STRUCTURALLY: one expression with a
    // flipped sign, so the two ends cannot be edited apart.
    const [lo, , hi] = swayR.output;
    if (swayR.output.length !== 3) {
      problems.push(`the sway's outputRange has ${swayR.output.length} stops, expected 3 (-peak, rest, +peak) — the rest stop is what makes the perch point a declared value rather than an inference`);
    } else if (strip(lo) !== `-${strip(hi)}`) {
      problems.push(`the sway's range [${lo}, ${hi}] is not one expression with a flipped sign — symmetry about the perch point must be structural, not two numbers that happen to agree today`);
    }
    const restAt = swayR.input.findIndex((e) => strip(e) === '0');
    if (restAt < 0) {
      problems.push(`the sway's inputRange [${swayR.input.join(', ')}] has no 0 stop — the gesture has no declared rest`);
    } else if (strip(swayR.output[restAt]) !== '0') {
      problems.push(`the sway's rest maps to \`${swayR.output[restAt]}\`, not 0 — a gesture whose rest is not zero walks the character sideways one journey at a time`);
    }
    if (swayR.input.length !== 3 || strip(swayR.input[0]) !== `-${strip(swayR.input[2])}`) {
      problems.push(`the sway's inputRange [${swayR.input.join(', ')}] is not a signed pair about 0 — the poles must be one value with a flipped sign for the same reason the outputs are`);
    }

    // NOTHING EXTRAPOLATES. The sway is driven to a VARIABLE (`side`), not to
    // a literal, so the domain bound cannot be read off the call the way P5
    // reads the settle's — it has to be read off the variable's whole life.
    // `interpolate`'s default extrapolation is `extend`, so an amplified
    // `side` renders happily, at a excursion nobody measured and no constant
    // records.
    const declared = new Set(swayR.input.map(strip));
    const writes = [];
    walk(beeAst.program, (n) => {
      if (n.type === 'CallExpression' && (text(n.callee) === 'Animated.timing' || text(n.callee) === 'Animated.spring')
          && text(n.arguments[0]) === 'sway') {
        const to = n.arguments[1]?.properties?.find((p) => p.key?.name === 'toValue');
        writes.push(to ? strip(text(to.value)) : '<unreadable>');
      }
      if (n.type === 'CallExpression' && n.callee?.type === 'MemberExpression'
          && text(n.callee.object) === 'sway' && n.callee.property?.name === 'setValue') {
        writes.push(strip(text(n.arguments[0])));
      }
    });
    if (writes.length === 0) {
      problems.push('no writes to `sway` found — FAILS CLOSED: a gesture this row cannot see is a gesture whose domain it cannot bound');
    }
    const viaVariable = [...new Set(writes)].filter((w) => !declared.has(w) && w !== '0');
    for (const name of viaVariable) {
      if (!/^[A-Za-z_$][\w$]*$/.test(name)) {
        problems.push(`\`sway\` is driven to the expression \`${name}\`, which is neither a declared stop {${[...declared].join(', ')}} nor a plain variable this row can trace — FAILS CLOSED`);
        continue;
      }
      // Trace the variable: it must be born at a pole and only ever flipped.
      let init = null;
      const assigned = [];
      walk(beeAst.program, (n) => {
        if (n.type === 'VariableDeclarator' && n.id?.name === name) init = n.init ? strip(text(n.init)) : '<uninitialised>';
        if (n.type === 'AssignmentExpression' && n.left?.type === 'Identifier' && n.left.name === name) assigned.push(n.right);
      });
      if (init === null) {
        problems.push(`\`sway\` is driven to \`${name}\`, whose declaration this row cannot find — FAILS CLOSED`);
      } else if (!declared.has(init)) {
        problems.push(`\`${name}\` is born as \`${init}\`, which is not one of the sway's declared stops {${[...declared].join(', ')}} — the driver would start its life outside its own domain`);
      }
      for (const rhs of assigned) {
        // Every reachable value of the variable, whatever control flow gets
        // there: a conditional contributes both arms, anything else itself.
        const arms = [];
        const collect = (node) => {
          if (node.type === 'ConditionalExpression') { collect(node.consequent); collect(node.alternate); return; }
          arms.push(strip(text(node)));
        };
        collect(rhs);
        const bad_ = arms.filter((a) => a !== name && a !== `-${name}`);
        if (bad_.length) {
          problems.push(`\`${name}\` is assigned ${bad_.map((a) => `\`${a}\``).join(', ')} — the side variable may only ever be itself or its own negation. Scaling it (\`1.5 * ${name}\`) drives the interpolation past its declared stops, where \`extend\` renders an excursion no constant records and P11's table still reports the ruled one`);
        }
      }
    }
  }

  if (problems.length === 0) {
    ok('P12 §7 row 7 — the sway drives translateX, scales by the drawn WIDTH (its own measurement frame, not the vertical terms\'), is structurally symmetric about a rest that maps to exactly 0, and its driver never leaves its declared domain');
  } else {
    bad('P12 the sway\'s axis, denominator and symmetry', problems.join(' | '));
  }

  const MOUNTS = [['hero (132pt stage)', 132 * mascot.WELCOME_BEE_STAGE_FRACTION], ['chrome', 44]];
  console.log('\n  §7 row 7 — measured LATERAL amplitude table, from the constants as landed:\n');
  console.log('    mount            drawn w   each side   peak-to-peak   vs breath p2p   free space each side');
  for (const [name, characterBox] of MOUNTS) {
    const w = characterBox * mascot.MASCOT_WIDTH_FRACTION;
    const h = w / mascot.MASCOT_ASPECT;
    const each = mascot.SWAY_OFFSET_FRACTION * w;
    const breathP2P = mascot.BREATH_RISE_FRACTION * h;
    // What the drawing has to move into: the character occupies
    // MASCOT_WIDTH_FRACTION of its centred box, so the slack is real layout,
    // not a guess about an ancestor's overflow.
    const free = (characterBox - w) / 2;
    console.log(
      `    ${name.padEnd(20)} ${w.toFixed(4).padStart(7)}   ${each.toFixed(4).padStart(9)}   ${(2 * each).toFixed(4).padStart(12)}   ${(2 * each / breathP2P).toFixed(2).padStart(13)}x   ${free.toFixed(4).padStart(20)}`,
    );
  }
  console.log('');
  const slackFraction = (1 - mascot.MASCOT_WIDTH_FRACTION) / 2 / mascot.MASCOT_WIDTH_FRACTION;
  if (mascot.SWAY_OFFSET_FRACTION < slackFraction) {
    ok(`P12b the excursion cannot clip at ANY mount, structurally: the drawing is centred in a box it fills ${(100 * mascot.MASCOT_WIDTH_FRACTION).toFixed(2)}% of, leaving ${(100 * slackFraction).toFixed(2)}% of the DRAWN width free on each side against an excursion of ${(100 * mascot.SWAY_OFFSET_FRACTION).toFixed(1)}% — both sides of that comparison are fractions of the same denominator, so it holds at every size rather than at the two this table happens to print`);
  } else {
    bad('P12b the excursion cannot clip at any mount',
      `the excursion is ${(100 * mascot.SWAY_OFFSET_FRACTION).toFixed(2)}% of the drawn width against ${(100 * slackFraction).toFixed(2)}% of free space each side — the drawing would leave the rect its box already occupies, and whether that shows becomes a question about some ancestor's \`overflow\` rather than about this component`);
  }
}

// ── P13. the dwell — §7 row 8, and it is the whole gesture ─────────────────
//
// "the driver's interpolation must contain an explicit hold segment at the
// extreme, not merely a slow ease (a slow ease reads as drift; the hold is
// what reads as weight)". The failure this row is aimed at does not look like
// a bug: someone folds three constants into two, keeps the same 4.0s and the
// same ±3.3%, and every figure P11 prints stays green while the thing Colin
// asked for is gone. The hold is the only part of this term that is not also
// true of the hover the doctrine retired.
//
// It is expressed as `delay:` ON THE RETURN LEG rather than as an
// `Animated.delay` step, and that is not a style choice: `delay()` mints a
// throwaway `new AnimatedValue(0)` and hardcodes `useNativeDriver: false`
// (react-native/Libraries/Animated/AnimatedImplementation.js:436-442), so it
// would drop a JS-thread animation into the middle of an otherwise native
// sequence to accomplish nothing but the passage of time.
{
  const problems = [];
  const legs = [];
  walk(beeAst.program, (n) => {
    if (n.type !== 'CallExpression' || text(n.callee) !== 'Animated.timing') return;
    if (text(n.arguments[0]) !== 'sway') return;
    const cfg = n.arguments[1];
    const get = (k) => { const p = cfg?.properties?.find((q) => q.key?.name === k); return p ? text(p.value) : null; };
    legs.push({ at: n.start, to: get('toValue'), dur: get('duration'), delay: get('delay'), native: get('useNativeDriver') });
  });
  legs.sort((a, b) => a.at - b.at);

  if (legs.length !== 2) {
    problems.push(`expected exactly 2 \`sway\` timings (out, home), found ${legs.length} — FAILS CLOSED: the shape of the journey is what this row reads the hold off`);
  } else {
    const [out, home] = legs;
    if (out.delay !== null) problems.push(`the OUTWARD leg carries \`delay: ${out.delay}\` — the hold belongs at the extreme, and a delay before departure is dead time at the rest point where the character is already still`);
    if (home.delay !== 'SWAY_DWELL_MS') {
      problems.push(`the return leg's hold is \`${home.delay === null ? '<absent>' : home.delay}\`, not \`SWAY_DWELL_MS\`. With no delay the journey is out-and-straight-back: the same distance, the same total time if the durations absorb it, and NO HOLD — row 8's "a slow ease does not count", arrived at by deletion`);
    }
    if (out.dur !== 'SWAY_OUT_MS') problems.push(`the outward leg runs \`${out.dur}\`, not SWAY_OUT_MS`);
    if (home.dur !== 'SWAY_HOME_MS') problems.push(`the return leg runs \`${home.dur}\`, not SWAY_HOME_MS`);
    if (home.to !== '0') problems.push(`the return leg drives \`sway\` to ${home.to}, not 0 — the journey must come home to the perch point exactly, every time, or the bias is the only thing keeping the character near where it started`);
    for (const leg of legs) {
      if (leg.native !== 'true') problems.push(`a sway leg runs \`useNativeDriver: ${leg.native}\` — a transform this simple has no reason to be on the JS thread, where a full render tick lands inside the dwell and turns the hold into a stutter`);
    }
  }

  // And the hold is a HOLD, not a step that happens to be slow.
  if (!(mascot.SWAY_DWELL_MS > 0)) {
    problems.push(`SWAY_DWELL_MS is ${mascot.SWAY_DWELL_MS} — a zero-length hold is the absent hold with a constant's name on it`);
  }
  let delayStep = false;
  walk(beeAst.program, (n) => {
    if (n.type !== 'CallExpression' || text(n.callee) !== 'Animated.delay') return;
    if (/SWAY_/.test(text(n))) delayStep = true;
  });
  if (delayStep) {
    problems.push('the hold is an `Animated.delay` step — it mints a throwaway AnimatedValue and hardcodes `useNativeDriver: false` (AnimatedImplementation.js:436-442), putting a JS-thread animation inside a native sequence to accomplish only the passage of time. `delay:` on the leg that follows holds the same value for the same duration on one driver');
  }

  if (problems.length === 0) {
    ok(`P13 §7 row 8 — the dwell is an explicit ${mascot.SWAY_DWELL_MS}ms hold at the extreme (a \`delay\` on the return leg, one driver, native), not a slow ease: ${mascot.SWAY_OUT_MS}ms out, ${mascot.SWAY_DWELL_MS}ms held, ${mascot.SWAY_HOME_MS}ms home`);
  } else {
    bad('P13 the dwell exists by construction', problems.join(' | '));
  }
}

// ── P14. Reduce Motion reaches the sway — §7 row 9 ─────────────────────────
//
// P8 asserts the population: every `breath=` call site is gated on `reduced`.
// That is what makes RM a freeze for the terms that hang off `breathing` —
// and it is only worth anything for THIS term if this term hangs off it too.
// The row is separate because the sway's conductor is the first one that
// could have been written without that gate and still have looked right in
// every screenshot: `driven` does not gate it (deliberately — a bee whose
// wing someone else is holding still has its own weight), so `breathing` is
// the only thing standing between the sway and a character that is supposed
// to be frozen.
{
  const problems = [];
  let effect = null;
  walk(beeAst.program, (n) => {
    if (n.type !== 'CallExpression' || text(n.callee) !== 'useEffect') return;
    let mine = false;
    walk(n.arguments[0], (m) => {
      if (m.type === 'VariableDeclarator' && m.id?.name === 'scheduleSway') mine = true;
    });
    if (mine) effect = n;
  });
  if (!effect) {
    problems.push('could not find the sway\'s `useEffect` (no `scheduleSway` declarator inside one) — FAILS CLOSED');
  } else {
    let gated = false;
    walk(effect.arguments[0], (n) => {
      if (n.type !== 'IfStatement') return;
      if (!/^!\s*breathing$/.test(text(n.test))) return;
      if (/return/.test(text(n.consequent))) gated = true;
    });
    if (!gated) problems.push('the sway\'s conductor has no `if (!breathing) return` — under Reduce Motion the call sites stop asking for breath, and a conductor that does not read that keeps swaying a character the user asked to hold still');
    const deps = effect.arguments[1];
    const depNames = deps?.type === 'ArrayExpression' ? deps.elements.map(text) : null;
    if (!depNames) {
      problems.push('the sway\'s effect has no dependency array — it would re-arm on every render, and each re-arm re-rolls the interval from zero, which is a term that never fires under a parent that renders often');
    } else if (!depNames.includes('breathing')) {
      problems.push(`\`breathing\` is not in the sway effect's deps [${depNames.join(', ')}] — the guard would be read once and never again, so turning Reduce Motion ON mid-session would leave the sway running until unmount`);
    }
  }
  if (problems.length === 0) {
    ok('P14 §7 row 9 — the sway hangs off `breathing` (guard AND dependency), so P8\'s population gate reaches this term and Reduce Motion freezes it like every other idle term');
  } else {
    bad('P14 Reduce Motion reaches the sway', problems.join(' | '));
  }
}

// ── P15. the deference direction, asserted rather than assumed — §7 row 11 ──
//
// The amended R-SW-3 rules ONE-WAY deference: the sway yields to the flick
// and the settle, and they never yield to it. P6 holds one half of that (two
// owners of the lock, three readers). This row holds the other half, and the
// two are aimed at opposite mistakes.
//
// P6 catches the sway TAKING the lock. This catches the flick or the settle
// GROWING one of their own — a `if (swaying) return;` added later by someone
// tidying up an overlap they saw on a device and read as a collision. It
// would look like symmetry, it would look like §4, and it would silently
// convert R-PW-1's ruled ceiling into an average: a flick blocked mid-sway
// re-rolls 4-9s later, so the worst-case first flick goes from 9s to ~18s.
// §6 row 2 says "by construction" — that phrase is the whole ruling, and this
// is the door it can be lost through without a single constant moving. P3
// would stay green the entire time, because P3 reads the constants.
{
  const problems = [];
  const conductors = [
    ['schedule', 'the flick'],
    ['scheduleSettle', 'the settle'],
  ];
  for (const [decl, label] of conductors) {
    let effect = null;
    walk(beeAst.program, (n) => {
      if (n.type !== 'CallExpression' || text(n.callee) !== 'useEffect') return;
      let mine = false;
      walk(n.arguments[0], (m) => {
        if (m.type === 'VariableDeclarator' && m.id?.name === decl) mine = true;
      });
      if (mine) effect = n;
    });
    if (!effect) {
      problems.push(`could not find ${label}'s conductor (no \`${decl}\` declarator inside a useEffect) — FAILS CLOSED: a conductor this row cannot see is one it cannot clear of a sway guard`);
      continue;
    }
    // Identifiers, not source text: the effects have prose ABOUT the sway in
    // them (this deference is the kind of thing that has to be explained
    // where it is relied on), and a comment naming a term is not a guard on
    // it. Same class as P6's `beeCodeOnly` — a justification is a dependency,
    // so it has to be readable without tripping the check it justifies.
    const touches = new Set();
    walk(effect.arguments[0], (n) => {
      if (n.type === 'Identifier' && /^(sway|SWAY_)/.test(n.name)) touches.add(n.name);
    });
    if (touches.size) {
      problems.push(`${label}'s conductor references ${[...touches].map((t) => `\`${t}\``).join(', ')} — the merged terms must not know the sway exists. Whatever the reference does today, the next edit to it is a guard, and a guard here stretches R-PW-1's by-construction ceiling from 9s to ~18s without touching a constant`);
    }
  }

  // Defers, never queues: the sway's guard re-rolls (P6) and there is nowhere
  // for a blocked gesture to be REMEMBERED. A queue is a metronome with a
  // buffer — it fires the instant the other gesture releases, which is the
  // single moment the character has just finished moving.
  let swayEffect = null;
  walk(beeAst.program, (n) => {
    if (n.type !== 'CallExpression' || text(n.callee) !== 'useEffect') return;
    let mine = false;
    walk(n.arguments[0], (m) => {
      if (m.type === 'VariableDeclarator' && m.id?.name === 'scheduleSway') mine = true;
    });
    if (mine) swayEffect = n;
  });
  if (!swayEffect) {
    problems.push('could not find the sway\'s conductor — FAILS CLOSED');
  } else {
    const queueish = new Set();
    walk(swayEffect.arguments[0], (n) => {
      if (n.type === 'VariableDeclarator' && n.id?.name && /queue|pending|deferred|backlog/i.test(n.id.name)) queueish.add(n.id.name);
    });
    if (queueish.size) {
      problems.push(`the sway's conductor declares ${[...queueish].map((q) => `\`${q}\``).join(', ')} — a deferred gesture is DROPPED and re-rolled, never remembered. A buffer fires the moment the other gesture releases, which is the one instant the character has just finished moving`);
    }
  }

  if (problems.length === 0) {
    ok('P15 §7 row 11 — the deference runs one way and is asserted both ends: neither merged conductor references the sway at all, and the sway defers by re-rolling with nowhere to queue');
  } else {
    bad('P15 the deference direction, asserted rather than assumed', problems.join(' | '));
  }
}

console.log(`\ncheck-perch-weight: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
