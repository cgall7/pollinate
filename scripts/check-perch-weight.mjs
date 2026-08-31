// R-PW — the perch's weight. `GUIDES/POLLINATE_PERCH_WEIGHT_SPEC.md`
// (Lumen, 2026-08-30), built on Colin's device-pass ruling: *"the mascot
// sitting motion does not look top quality … it needs to look beautiful and
// seamless just like the fox."*
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
  const MOUNTS = [['hero', 132], ['chrome', 44]];

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
  for (const [name, size] of MOUNTS) {
    const h = size * DRAWN_PER_BOX;
    const breathP2P = mascot.BREATH_RISE_FRACTION * h;
    const dip = mascot.SETTLE_DIP_FRACTION * h;
    const over = mascot.SETTLE_OVERSHOOT_FRACTION * dip;
    // The breath is stopped at its LOW point during the dip (P10), so the
    // floor the character settles onto is the same absolute point every time.
    const nadir = breathP2P / 2 + dip;
    console.log(
      `    ${(name + ' ' + size + 'pt').padEnd(16)} ${h.toFixed(4).padStart(7)}   ${breathP2P.toFixed(4).padStart(10)}   ${dip.toFixed(4).padStart(10)}   ${over.toFixed(4).padStart(9)}   ${nadir.toFixed(4).padStart(16)}`,
    );
  }
  console.log('');
  note('P2b REPORTED, NOT GATED — the spec\'s own pt citations are computed against the BOX:');
  note(`     §3 cites 4.224pt / 1.408pt for the breath; the ruled 3.2% OF DRAWN HEIGHT gives ${(mascot.BREATH_RISE_FRACTION * 132 * DRAWN_PER_BOX).toFixed(4)}pt / ${(mascot.BREATH_RISE_FRACTION * 44 * DRAWN_PER_BOX).toFixed(4)}pt.`);
  note(`     §4 cites 3.96pt / 1.32pt for the dip; the ruled 3% gives ${(mascot.SETTLE_DIP_FRACTION * 132 * DRAWN_PER_BOX).toFixed(4)}pt / ${(mascot.SETTLE_DIP_FRACTION * 44 * DRAWN_PER_BOX).toFixed(4)}pt.`);
  note('     Every citation is 1.4132x the travel its own constant produces. The FRACTION is the ruling and ships as ruled;');
  note('     the citations are a derivation and are Lumen\'s to correct. If the intent was the pt figures rather than the');
  note(`     fractions, the breath's advance axis is ${(mascot.BREATH_RISE_FRACTION / DRAWN_PER_BOX).toFixed(5)} — above the documented ${mascot.BREATH_RISE_CEILING} ceiling, so it needs a new ruling, not a tune.`);
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

// ── P6. the collision rule, both directions ────────────────────────────────
//
// §4: "simple mutual defer". A defer is only a defer if BOTH sides have one —
// one-sided, the unguarded gesture cuts across the other and the bug looks
// like a rendering glitch. And it must RE-ROLL rather than queue: a queued
// gesture fires the instant the other releases, which is the one moment the
// character has just finished moving.
{
  const defers = [];
  walk(beeAst.program, (n) => {
    if (n.type !== 'IfStatement') return;
    const test = text(n.test);
    if (!/gesture\.busy/.test(test)) return;
    const body = text(n.consequent);
    const rearm = /\bschedule\(\)/.test(body) ? 'schedule' : (/\bscheduleSettle\(\)/.test(body) ? 'scheduleSettle' : null);
    defers.push({ test, rearm, returns: /\breturn;/.test(body), body });
  });
  const problems = [];
  if (defers.length !== 2) {
    problems.push(`expected exactly 2 \`gesture.busy\` guards (one per channel), found ${defers.length} — FAILS CLOSED`);
  }
  const armed = new Set(defers.map((d) => d.rearm).filter(Boolean));
  if (!armed.has('schedule')) problems.push('the flick\'s guard does not re-roll its own timer — that is a DROPPED gesture, not a deferred one');
  if (!armed.has('scheduleSettle')) problems.push('the settle\'s guard does not re-roll its own timer — that is a DROPPED gesture, not a deferred one');
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
  if (sets.length !== 2) problems.push(`\`gesture.busy = true\` is written ${sets.length} times, expected 2 (one per channel)`);
  if (clears.length < 2) problems.push(`\`gesture.busy = false\` is written ${clears.length} times — every path that takes the lock must release it`);
  let absorbTouchesLock = false;
  walk(beeAst.program, (n) => {
    if (n.type !== 'AssignmentExpression') return;
    if (text(n.left) !== 'gesture.absorb') return;
    if (/gesture\.busy/.test(text(n.right))) absorbTouchesLock = true;
  });
  if (absorbTouchesLock) problems.push('`gesture.absorb` writes `gesture.busy` — the settle takes that lock and the settle releases it; two owners for one bit is how a lock stops working');

  if (problems.length === 0) {
    ok(`P6 §4's collision rule holds in BOTH directions — ${defers.length} guards, each re-rolling its own interval and returning, no queue, one owner per side of the lock`);
  } else {
    bad('P6 §4\'s collision rule, both directions', problems.join(' | '));
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

console.log(`\ncheck-perch-weight: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
