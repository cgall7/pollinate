// Acceptance rig for MB-P1 — the type-choreography primitive
// (`src/components/typeChoreography.js` + `src/components/ChoreographedText.js`).
//
//   npm run check:type-choreography
//
// WHY THIS EXISTS AS A RIG AND NOT A SCREENSHOT
//
// Lumen's commission (2026-08-27) is explicit that the mechanism is "proven
// once with an acceptance rig BEFORE any beat adopts it." Every property it
// asks for is invisible in a still frame, and two of them are invisible in a
// video as well:
//
//   * "no per-character timers surviving unmount" — a leaked timer looks
//     exactly like a clean one until the screen it belonged to is gone.
//   * "reduced-motion branch renders final text immediately" — a branch that
//     waits on a cue only the motion fires is indistinguishable from a
//     working one on any device where the cue happens to fire.
//
// So the rig SAMPLES THE FUNCTIONS over their domain (R81 — a schedule is a
// generator of sessions, and four sampled points cannot pin one) and reads
// the component's mechanism out of its AST. It sweeps every segment count
// from 0 to 200, both grains, a corpus of the app's real candidate copy, and
// recomputes RN's own spring solution from `motion.js`'s live literals.
//
// WHAT IT CANNOT SEE, stated with the scope of the probe that produced it
// (§0): it has not rendered a frame. Flex-wrap's break decisions at word
// grain, the rise's readability on a real panel, and whether the beat looks
// like a performance rather than a stutter are device rows, listed in
// POLLINATE_MB_P1_TYPE_CHOREOGRAPHY.md §6 (design workspace) and unrun
// here.
//
// Every spec cited in this file lives in the design workspace, not at
// any path in this repo; nothing under `GUIDES/` is in this tree, so a
// bare `GUIDES/...` address opens nothing for whoever reads this file
// next.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { parse } from '@babel/parser';
import {
  GRAINS,
  MAX_SEGMENTS,
  MIN_START_DELAY_MS,
  SEGMENT_LEGIBLE_MS,
  revealDelays,
  revealSchedule,
  segmentText,
} from '../src/components/typeChoreography.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENT = path.join(ROOT, 'src/components/ChoreographedText.js');
const MOTION = path.join(ROOT, 'src/constants/motion.js');

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

const componentSrc = await readFile(COMPONENT, 'utf8');
const motionSrc = await readFile(MOTION, 'utf8');

// Walks every node. `babel-preset-expo` is not installed in this repo, so
// the parser is called directly and the traversal is hand-rolled — the same
// arrangement every other AST gate here uses.
const walk = (node, visit, parent = null) => {
  if (!node || typeof node.type !== 'string') return;
  visit(node, parent);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
    const child = node[key];
    if (Array.isArray(child)) child.forEach((c) => walk(c, visit, node));
    else if (child && typeof child.type === 'string') walk(child, visit, node);
  }
};

const identifiersIn = (node) => {
  const names = new Set();
  walk(node, (n) => {
    if (n.type === 'Identifier') names.add(n.name);
  });
  return names;
};

// ======================================================================
// SECTION A — segmentation
// ======================================================================
console.log('\nA. Segmentation');

// The corpus is the app's own candidate copy for the two named first
// adopters, plus the shapes that have historically broken text handling
// here. Asserted non-empty before it is looped over: run-checks cannot see
// an empty universe inside a gate, so the gate has to.
const CORPUS = [
  "Good morning, Colin — today's cell is fresh.",
  'Good afternoon, Colin. The hive hums along.',
  'Good evening, Colin. The day left something worth keeping.',
  'One line a day. That is how it starts.',
  'Pause.\nThink of someone.',
  'Kept.',
  '  leading and trailing space  ',
  'double  internal   spaces',
  'a\nb\nc',
];

if (CORPUS.length > 0) {
  ok(`corpus holds ${CORPUS.length} strings`);
} else {
  bad('corpus', 'empty — this gate would assert nothing');
}

// A1 — word grain loses no words and reorders none.
{
  let bads = 0;
  for (const text of CORPUS) {
    const words = text.split(/\s+/).filter(Boolean);
    const segs = segmentText(text, GRAINS.WORD).map((s) => s.text);
    if (segs.join(' ') !== words.join(' ')) {
      bads += 1;
      bad('A1 word grain fidelity', `${JSON.stringify(text)} -> ${JSON.stringify(segs)}`);
    }
  }
  if (!bads) ok(`A1 word grain reproduces every word in order (${CORPUS.length} strings)`);
}

// A2 — line grain: a single-line string is exactly one segment. Both named
// first adopters are one sentence, so this is the shape that actually ships.
{
  const oneLiners = CORPUS.filter((t) => !t.includes('\n'));
  const wrong = oneLiners.filter((t) => segmentText(t, GRAINS.LINE).length !== 1);
  if (wrong.length === 0) ok(`A2 line grain: ${oneLiners.length} single-line strings each segment to exactly 1`);
  else bad('A2 line grain', `${wrong.length} single-line strings did not produce one segment`);
}

// A3 — THE STRUCTURAL ROW. A hard line break in the copy must survive word
// grain. Without `breakBefore`, 'Pause.\nThink of someone.' renders as one
// run-on row: the author's structure deleted by a rendering choice, and
// invisible to every other assertion here.
{
  const segs = segmentText('Pause.\nThink of someone.', GRAINS.WORD);
  const breaks = segs.map((s, i) => (s.breakBefore ? i : -1)).filter((i) => i >= 0);
  if (breaks.length === 1 && breaks[0] === 1 && segs[1].text === 'Think') {
    ok('A3 hard break survives word grain (breakBefore on the first word of line 2)');
  } else {
    bad('A3 hard break', `breakBefore at ${JSON.stringify(breaks)}, expected [1] on "Think"`);
  }
  const lineSegs = segmentText('a\nb\nc', GRAINS.LINE);
  if (lineSegs.length === 3 && !lineSegs[0].breakBefore && lineSegs[1].breakBefore && lineSegs[2].breakBefore) {
    ok('A3 line grain marks every line after the first as a new row');
  } else {
    bad('A3 line grain breaks', JSON.stringify(lineSegs));
  }
}

// A4 — degenerate input returns an empty schedule instead of throwing. A
// greeting whose name lookup failed, an acknowledgment string not yet
// wired: both arrive here as '' or undefined, and neither may crash a
// ceremony.
{
  const junk = ['', '   ', '\n\n', null, undefined, 42, {}, []];
  let bads = 0;
  for (const value of junk) {
    for (const grain of [GRAINS.WORD, GRAINS.LINE]) {
      try {
        const segs = segmentText(value, grain);
        if (segs.length !== 0) {
          bads += 1;
          bad('A4 degenerate input', `${JSON.stringify(value)} (${grain}) -> ${segs.length} segments`);
        }
      } catch (e) {
        bads += 1;
        bad('A4 degenerate input', `${JSON.stringify(value)} (${grain}) threw ${e.message}`);
      }
    }
  }
  if (!bads) ok(`A4 ${junk.length} degenerate inputs x 2 grains: empty, no throw`);
}

// A5 — no segment is empty and no word segment carries whitespace. An empty
// segment is an invisible box that still consumes a delay slot, so the
// cascade would stall on nothing.
{
  let bads = 0;
  for (const text of CORPUS) {
    for (const grain of [GRAINS.WORD, GRAINS.LINE]) {
      for (const seg of segmentText(text, grain)) {
        if (seg.text.length === 0) { bads += 1; bad('A5 empty segment', `${JSON.stringify(text)} (${grain})`); }
        if (grain === GRAINS.WORD && /\s/.test(seg.text)) {
          bads += 1;
          bad('A5 whitespace in a word segment', `${JSON.stringify(seg.text)}`);
        }
      }
    }
  }
  if (!bads) ok('A5 no empty segments, no whitespace inside a word segment');
}

// ======================================================================
// SECTION B — the schedule, swept
// ======================================================================
console.log('\nB. Schedule');

// The step is not this gate's to invent: it is read out of `motion.js`'s
// own literals, so a retune of §14.1's cascade budget moves the sweep with
// it instead of leaving this file asserting yesterday's numbers.
const readNumberConst = (name) => {
  const m = new RegExp(`export const ${name}\\s*=\\s*(\\d+(?:\\.\\d+)?)`).exec(motionSrc);
  return m ? Number(m[1]) : null;
};
const STAGGER_MS = readNumberConst('STAGGER_MS');
const CASCADE_BUDGET_MS = readNumberConst('CASCADE_BUDGET_MS');

if (STAGGER_MS !== null && CASCADE_BUDGET_MS !== null) {
  ok(`B0 read motion.js live: STAGGER_MS=${STAGGER_MS}, CASCADE_BUDGET_MS=${CASCADE_BUDGET_MS}`);
} else {
  bad('B0 motion.js constants', `STAGGER_MS=${STAGGER_MS}, CASCADE_BUDGET_MS=${CASCADE_BUDGET_MS} — extractor is blind, everything below it is unpinned`);
}

// Calibration, both directions. A pass-closed row hides a blinded extractor
// where a fail-closed row announces one, so for this shape the calibration
// is mandatory rather than optional: the reader must MISS a name that is
// not there.
if (readNumberConst('NOT_A_REAL_CONSTANT_ZZZ') === null) {
  ok('B0 calibration: the constant reader returns null for a name motion.js does not export');
} else {
  bad('B0 calibration', 'the reader found a constant that does not exist — it is matching something else');
}

// `staggerDelay(index, count)` = index * min(STAGGER_MS, ceil(budget/count)),
// so the per-item step is what index 1 returns. Restated here from the same
// literals rather than imported, because motion.js imports React and cannot
// be loaded under node.
const stepFor = (count) => Math.min(STAGGER_MS, Math.ceil(CASCADE_BUDGET_MS / Math.max(count, 1)));

const COUNTS = Array.from({ length: 201 }, (_, i) => i);

// B1 — one delay per segment, at every count.
{
  const wrong = COUNTS.filter((n) => revealDelays(n, stepFor(n)).length !== n);
  if (wrong.length === 0) ok(`B1 delays.length === count for all ${COUNTS.length} counts (0..200)`);
  else bad('B1 delay count', `wrong at counts ${wrong.slice(0, 5).join(', ')}`);
}

// B2 — THE R43 ROW. Every delay is at least one frame, at every count and
// every step, including a degenerate step of 0. A delay of 0 makes RN call
// `start()` synchronously inside the effect, and the one configuration ever
// observed to freeze on device is a native spring started synchronously on
// a value that was just stopped and rewound — which is precisely a replay
// of this beat.
{
  let bads = 0;
  for (const n of COUNTS) {
    for (const step of [0, 1, stepFor(n), STAGGER_MS, 1000]) {
      const under = revealDelays(n, step).filter((d) => d < MIN_START_DELAY_MS);
      if (under.length) {
        bads += 1;
        bad('B2 sub-frame delay', `count ${n}, step ${step}: ${under.length} delays under ${MIN_START_DELAY_MS}ms`);
      }
    }
  }
  if (!bads) ok(`B2 every delay >= ${MIN_START_DELAY_MS}ms across 201 counts x 5 steps (no synchronous spring start)`);
}

// B2b — THE ROW THAT PINS THE CONSTANT B2 MEASURES AGAINST. B2 compares
// every delay to `MIN_START_DELAY_MS`, which means B2 asserts that the
// FUNCTION respects the constant — and says nothing whatever about the
// constant. Set the floor to 0 and B2 goes green on a schedule whose first
// segment starts synchronously, which is the exact device freeze R43
// records. A threshold that is also the thing under test is not a
// threshold. Two-sided on purpose, because the floor has two different
// reasons and only one of them is R43's:
//
//   > 0   is the load-bearing half. `SpringAnimation.js:234` special-cases
//         a FALSY delay to call `start()` synchronously inside the effect.
//   <= one frame is what keeps it invisible. A floor of 300ms would satisfy
//         R43 perfectly while silently holding every first word back a
//         third of a second — a correctness fix that quietly becomes a
//         timing decision nobody ratified.
{
  const FRAME_MS = 1000 / 60;
  if (MIN_START_DELAY_MS <= 0) {
    bad('B2b start floor', `MIN_START_DELAY_MS is ${MIN_START_DELAY_MS}: a falsy delay makes RN start the spring synchronously inside the effect (R43)`);
  } else if (MIN_START_DELAY_MS > FRAME_MS) {
    bad('B2b start floor', `MIN_START_DELAY_MS is ${MIN_START_DELAY_MS}ms, more than one 60fps frame (${FRAME_MS.toFixed(2)}ms) — that is a timing decision, not a floor`);
  } else {
    ok(`B2b MIN_START_DELAY_MS = ${MIN_START_DELAY_MS}ms: non-zero (no synchronous start) and within one 60fps frame (${FRAME_MS.toFixed(2)}ms, so invisible)`);
  }
}

// B3 — monotonic. Words must not arrive out of order.
{
  let bads = 0;
  for (const n of COUNTS) {
    const d = revealDelays(n, stepFor(n));
    for (let i = 1; i < d.length; i += 1) if (d[i] < d[i - 1]) bads += 1;
  }
  if (!bads) ok('B3 delays are non-decreasing at every count');
  else bad('B3 monotonicity', `${bads} out-of-order pairs`);
}

// B4 — R24's budget actually binds. The cascade's TOTAL length is what
// §14.1 ratified; a fixed step multiplied by a dense collection is the
// defect that ruling exists to prevent.
//
// STATED OVER THE REACHABLE DOMAIN, and the scoping is the row's substance
// rather than a convenience. `revealDelays` is a pure function of any count
// you hand it, and at count 174 its last delay is 865ms — over budget,
// because `staggerDelay`'s `Math.ceil` inflates the step most where
// budget/count lands just above an integer. That count is unreachable: the
// collapse ceiling means no schedule this component builds ever carries
// more than MAX_SEGMENTS segments, which B4b asserts directly rather than
// leaving as an assumption of this one.
{
  const reachable = COUNTS.filter((n) => n >= 1 && n <= MAX_SEGMENTS);
  const worst = Math.max(...reachable.map((n) => {
    const d = revealDelays(n, stepFor(n));
    return d[d.length - 1];
  }));
  const bound = CASCADE_BUDGET_MS + STAGGER_MS;
  if (worst <= bound) ok(`B4 worst last-delay ${worst}ms <= budget+step ${bound}ms over the reachable domain (1..${MAX_SEGMENTS})`);
  else bad('B4 cascade budget', `worst last-delay ${worst}ms exceeds ${bound}ms`);
}

// B4b — what makes B4's domain the reachable one. Swept over real texts,
// not asserted about the ceiling constant: a schedule built from ANY string
// carries at most MAX_SEGMENTS segments, at either grain.
{
  let worstCount = 0;
  let bads = 0;
  for (const n of COUNTS) {
    const words = Array.from({ length: n }, (_, i) => `w${i}`).join(' ');
    const lines = Array.from({ length: n }, (_, i) => `line ${i}`).join('\n');
    for (const [text, grain] of [[words, GRAINS.WORD], [lines, GRAINS.LINE]]) {
      const s = revealSchedule(text, { grain, stepMs: stepFor(n) });
      worstCount = Math.max(worstCount, s.segments.length);
      if (s.segments.length > MAX_SEGMENTS) {
        bads += 1;
        bad('B4b unreachable count reached', `${n} ${grain}s produced ${s.segments.length} segments`);
      }
    }
  }
  if (!bads) ok(`B4b no schedule exceeds ${MAX_SEGMENTS} segments over 201 word-counts x 2 grains (worst ${worstCount})`);
}

// B5 — `settleMs` is the handoff. P2's beat requires the acknowledgment to
// precede the arithmetic IN TIME, so whatever chains after this beat chains
// off this number; if it is wrong the numbers land on top of the words.
{
  let bads = 0;
  for (const text of CORPUS) {
    for (const grain of [GRAINS.WORD, GRAINS.LINE]) {
      const s = revealSchedule(text, { grain, stepMs: stepFor(segmentText(text, grain).length) });
      const expected = s.segments.length === 0 ? 0 : s.delays[s.delays.length - 1] + SEGMENT_LEGIBLE_MS;
      if (s.settleMs !== expected) {
        bads += 1;
        bad('B5 settleMs', `${JSON.stringify(text)} (${grain}): ${s.settleMs} != ${expected}`);
      }
    }
  }
  const empty = revealSchedule('   ', { grain: GRAINS.WORD, stepMs: 50 });
  if (empty.settleMs !== 0) {
    bads += 1;
    bad('B5 empty settleMs', `whitespace-only copy settles at ${empty.settleMs}ms — a caller would wait for a beat with nothing in it`);
  }
  if (!bads) ok('B5 settleMs = last delay + legibility, and 0 when there is nothing to play');
}

// B6 — the collapse ceiling. Past MAX_SEGMENTS the schedule fades the whole
// string as one rather than mounting hundreds of native springs, it says so
// in `collapsed`, and IT LOSES NO WORDS doing it.
{
  const long = Array.from({ length: MAX_SEGMENTS + 1 }, (_, i) => `w${i}`).join(' ');
  const s = revealSchedule(long, { grain: GRAINS.WORD, stepMs: 50 });
  if (s.collapsed && s.segments.length === 1) ok(`B6 past ${MAX_SEGMENTS} segments the beat collapses to one fade and declares it`);
  else bad('B6 collapse', `collapsed=${s.collapsed}, segments=${s.segments.length}`);
  if (s.segments[0]?.text === long) ok('B6 collapse preserves every word, in order');
  else bad('B6 collapse fidelity', 'the collapsed segment is not the original string');

  const short = revealSchedule('one two three', { grain: GRAINS.WORD, stepMs: 50 });
  if (short.collapsed === false) ok('B6 calibration: a 3-word line does not collapse');
  else bad('B6 calibration', 'a short line reported itself collapsed');
}

// ======================================================================
// SECTION C — the spring, recomputed from motion.js
// ======================================================================
console.log('\nC. Spring');

// RN converts Origami tension/friction to stiffness/damping in plain JS
// (`SpringConfig.js:19-25`) and then integrates the analytical underdamped
// solution (`SpringAnimation.js:297-305`, t in seconds). Both are restated
// here so this gate can answer a question no screenshot can: if somebody
// retunes SPRINGS.reveal, is `SEGMENT_LEGIBLE_MS` still a description of
// the curve that ships?
const springsBlock = motionSrc.slice(motionSrc.indexOf('export const SPRINGS'));
const readSpring = (name) => {
  const m = new RegExp(`\\n\\s*${name}:\\s*\\{([^}]*)\\}`).exec(springsBlock);
  if (!m) return null;
  const friction = /friction:\s*(\d+(?:\.\d+)?)/.exec(m[1]);
  const tension = /tension:\s*(\d+(?:\.\d+)?)/.exec(m[1]);
  return friction && tension ? { friction: Number(friction[1]), tension: Number(tension[1]) } : null;
};

const reveal = readSpring('reveal');
if (reveal) ok(`C0 read SPRINGS.reveal live from motion.js: tension ${reveal.tension}, friction ${reveal.friction}`);
else bad('C0 SPRINGS.reveal', 'could not read tension/friction out of motion.js — every row below is unpinned');

// Calibration both directions, for the same reason as B0.
if (readSpring('notASpringZZZ') === null) ok('C0 calibration: the spring reader returns null for a spring that is not there');
else bad('C0 calibration', 'the spring reader found one that does not exist');

if (reveal) {
  const stiffness = (reveal.tension - 30) * 3.62 + 194;
  const damping = (reveal.friction - 8) * 3 + 25;
  const mass = 1;
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const omega0 = Math.sqrt(stiffness / mass);
  const omega1 = omega0 * Math.sqrt(1 - zeta * zeta);
  const position = (t) =>
    zeta < 1
      ? 1 - Math.exp(-zeta * omega0 * t) * ((zeta * omega0 / omega1) * Math.sin(omega1 * t) + Math.cos(omega1 * t))
      : 1 - Math.exp(-omega0 * t) * (1 + omega0 * t);

  const FRAME = 1 / 60;
  let legibleMs = null;
  let peak = 0;
  let trough = 2;
  let seenPeak = false;
  for (let i = 0; i < 120; i += 1) {
    const t = i * FRAME;
    const p = position(t);
    if (legibleMs === null && p >= 1) legibleMs = Math.round(t * 1000);
    if (p > peak) peak = p;
    if (p < peak - 1e-12) seenPeak = true;
    if (seenPeak && p < trough) trough = p;
  }

  // C1 — the constant the whole handoff hangs on still describes the curve.
  if (legibleMs !== null && Math.abs(legibleMs - SEGMENT_LEGIBLE_MS) <= 1) {
    ok(`C1 a segment first reaches full opacity at ${legibleMs}ms, matching SEGMENT_LEGIBLE_MS=${SEGMENT_LEGIBLE_MS}`);
  } else {
    bad('C1 legibility constant', `curve says ${legibleMs}ms, constant says ${SEGMENT_LEGIBLE_MS}ms — SPRINGS.reveal was retuned and the handoff moved with it`);
  }

  // C2 — THE FLICKER ROW. A spring driving opacity overshoots past 1 (which
  // clamps invisibly) and then RINGS BACK BELOW IT, which does not clamp.
  // At the shipped tuning the trough is 0.9686 — a 3.1% dip, under any
  // visible threshold. A bouncier retune would make the words fade in, dip,
  // and come back, and nobody reviewing a still frame would ever see it.
  if (trough >= 0.95) {
    ok(`C2 post-overshoot opacity trough ${trough.toFixed(4)} >= 0.95 — the arrival does not visibly flicker`);
  } else {
    bad('C2 opacity flicker', `trough ${trough.toFixed(4)} < 0.95: a spring this bouncy makes text fade in, dip, then return`);
  }

  // C3 — the rise's overshoot is a settle, not a bounce. Coupled to the
  // component's own RISE_PT so the two cannot drift apart.
  const riseSrc = /const RISE_PT = (\d+(?:\.\d+)?)/.exec(componentSrc);
  if (!riseSrc) {
    bad('C3 RISE_PT', 'could not read RISE_PT out of ChoreographedText.js');
  } else {
    const overshootPt = Number(riseSrc[1]) * (peak - 1);
    if (overshootPt <= 2) {
      ok(`C3 rise overshoots its resting line by ${overshootPt.toFixed(2)}pt (RISE_PT=${riseSrc[1]}, peak ${peak.toFixed(4)}) — a settle, not a bounce`);
    } else {
      bad('C3 rise overshoot', `${overshootPt.toFixed(2)}pt past the resting line reads as a bounce`);
    }
  }
}

// ======================================================================
// SECTION D — the component's mechanism, read out of its AST
// ======================================================================
console.log('\nD. Mechanism');

const componentAst = parse(componentSrc, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
const allNames = identifiersIn(componentAst);

// D0 — calibration for the traversal itself, both directions. A walker that
// silently visits nothing turns every absence row below into a free pass.
if (allNames.has('useEffect') && allNames.has('Animated')) ok(`D0 calibration: the walker sees ${allNames.size} identifiers including useEffect and Animated`);
else bad('D0 calibration', 'the walker did not find identifiers known to be in the file — every absence row below is unreliable');
if (!allNames.has('thisIdentifierIsNotInTheFileZZZ')) ok('D0 calibration: the walker does not report an identifier that is absent');
else bad('D0 calibration', 'the walker reported an absent identifier');

// D1 — NO TIMERS. The commission's "no per-character timers surviving
// unmount", asserted in its strongest form: the module does not own one.
{
  const timers = ['setTimeout', 'setInterval', 'setImmediate', 'requestAnimationFrame'].filter((t) => allNames.has(t));
  if (timers.length === 0) ok('D1 no setTimeout/setInterval/setImmediate/requestAnimationFrame anywhere in the module');
  else bad('D1 timers', `module references ${timers.join(', ')} — a timer can outlive the unmount that stops the animation`);
}

// D2 — every spring is the commissioned one, on the native driver.
{
  const springs = [];
  walk(componentAst, (n) => {
    if (
      n.type === 'CallExpression' &&
      n.callee.type === 'MemberExpression' &&
      n.callee.object.name === 'Animated' &&
      n.callee.property.name === 'spring'
    ) springs.push(n);
  });
  if (springs.length === 0) {
    bad('D2 spring', 'no Animated.spring call found — the beat is not built on a spring at all');
  } else {
    let bads = 0;
    for (const call of springs) {
      const config = call.arguments[1];
      const props = config?.type === 'ObjectExpression' ? config.properties : [];
      const spreadsReveal = props.some(
        (p) => p.type === 'SpreadElement' &&
          p.argument.type === 'MemberExpression' &&
          p.argument.object.name === 'SPRINGS' &&
          p.argument.property.name === 'reveal'
      );
      const native = props.some(
        (p) => p.type === 'ObjectProperty' && p.key.name === 'useNativeDriver' && p.value.value === true
      );
      const delayed = props.some((p) => p.type === 'ObjectProperty' && p.key.name === 'delay');
      if (!spreadsReveal) { bads += 1; bad('D2 spring curve', 'an Animated.spring does not spread SPRINGS.reveal'); }
      if (!native) { bads += 1; bad('D2 native driver', 'an Animated.spring is not on useNativeDriver: true'); }
      if (!delayed) { bads += 1; bad('D2 delay', 'an Animated.spring carries no delay — the cascade would be simultaneous'); }
    }
    if (!bads) ok(`D2 ${springs.length} Animated.spring call(s): SPRINGS.reveal, native driver, delayed`);
  }
}

// D2b — THE SEAM ROW (Lumen, 2026-08-27, MB-P1 ratification). D2 above
// asserts that a `delay` EXISTS. That is not the property the cascade
// depends on. Mutate `delay: delays[index]` to `delay: delays[0]` and D2
// stays green, every pure-schedule row (B1-B5) stays green because the
// schedule itself is untouched, and every word arrives simultaneously at
// 16ms: the beat is gone and the whole suite agrees it is fine.
//
// This is the seam between the two halves of this rig — the schedule is
// swept exhaustively as a pure function, the render is read structurally,
// and NOTHING was checking that the swept numbers reach the read springs.
// A gate made of two sound halves can have a hole exactly at their join.
//
// So this row asserts the WIRING: each spring's delay is a computed read
// of the schedule's own `delays` array, indexed by the binding the
// enclosing `.map()` introduces for the segment's position. That is the
// only shape in which delay VARIES with the segment.
//
// Fails closed. If a spring cannot be located inside a `.map()` callback
// that binds an index, the row cannot tell whether the delay varies, and
// cannot-tell is a FAIL — a refactor that moves the spring somewhere this
// row cannot read must red the row rather than silently pass it.
{
  // The array must be the one destructured off the schedule, not any local
  // called `delays`: the row is about the SWEPT numbers arriving, so it has
  // to name the binding that carries them.
  const scheduleArrays = new Set();
  walk(componentAst, (n) => {
    if (n.type !== 'VariableDeclarator' || n.id.type !== 'ObjectPattern') return;
    if (n.init?.type !== 'Identifier' || n.init.name !== 'schedule') return;
    for (const prop of n.id.properties) {
      if (prop.type === 'ObjectProperty' && prop.value.type === 'Identifier') {
        scheduleArrays.add(prop.value.name);
      }
    }
  });

  // Pair each spring with the index binding of the nearest enclosing map
  // callback. Recorded per-spring so a spring outside any such callback
  // stays unpaired and fails below.
  const indexFor = new Map();
  walk(componentAst, (n) => {
    if (n.type !== 'CallExpression') return;
    if (n.callee.type !== 'MemberExpression' || n.callee.property.name !== 'map') return;
    const cb = n.arguments[0];
    if (cb?.type !== 'ArrowFunctionExpression' && cb?.type !== 'FunctionExpression') return;
    const idxParam = cb.params?.[1];
    if (idxParam?.type !== 'Identifier') return;
    walk(cb.body, (m) => {
      if (
        m.type === 'CallExpression' &&
        m.callee.type === 'MemberExpression' &&
        m.callee.object.name === 'Animated' &&
        m.callee.property.name === 'spring'
      ) indexFor.set(m, idxParam.name);
    });
  });

  const springs = [];
  walk(componentAst, (n) => {
    if (
      n.type === 'CallExpression' &&
      n.callee.type === 'MemberExpression' &&
      n.callee.object.name === 'Animated' &&
      n.callee.property.name === 'spring'
    ) springs.push(n);
  });

  if (scheduleArrays.size === 0) {
    bad('D2b schedule binding', 'no array is destructured from `schedule` — cannot tell which binding carries the swept delays');
  } else if (springs.length === 0) {
    bad('D2b spring', 'no Animated.spring call found — nothing for the schedule to reach');
  } else {
    let bads = 0;
    for (const call of springs) {
      const config = call.arguments[1];
      const props = config?.type === 'ObjectExpression' ? config.properties : [];
      const delayProp = props.find((p) => p.type === 'ObjectProperty' && p.key.name === 'delay');
      if (!delayProp) continue; // D2 owns the existence claim.

      const idxName = indexFor.get(call);
      if (!idxName) {
        bads += 1;
        bad('D2b index binding', 'an Animated.spring is not inside a .map() callback binding an index — cannot tell whether its delay varies per segment');
        continue;
      }
      const v = delayProp.value;
      if (v.type !== 'MemberExpression' || !v.computed) {
        bads += 1;
        bad('D2b delay wiring', `delay is \`${v.type}\`, not a computed read of the schedule's delays — every segment would start together`);
        continue;
      }
      if (v.object.type !== 'Identifier' || !scheduleArrays.has(v.object.name)) {
        bads += 1;
        bad('D2b delay source', `delay reads \`${v.object.name ?? v.object.type}\`, which is not destructured from the schedule — the swept delays are not what reaches the spring`);
        continue;
      }
      if (v.property.type !== 'Identifier' || v.property.name !== idxName) {
        const got = v.property.type === 'Identifier' ? v.property.name : JSON.stringify(v.property.value);
        bads += 1;
        bad('D2b delay index', `delay is indexed by ${got}, not by the map's index binding \`${idxName}\` — the cascade would not vary with the segment`);
        continue;
      }
    }
    if (!bads) {
      ok(`D2b ${springs.length} spring delay(s) read the schedule's [${[...scheduleArrays].join(', ')}] at the map's index binding (the swept schedule reaches the beat)`);
    }
  }
}

// D3 — the effect cleans up. An unmount inside the cascade must stop the
// group rather than leave native springs driving values nobody reads. The
// shape asserted is a `useEffect` whose returned arrow calls `.stop()` —
// a `.stop()` anywhere else is not a cleanup.
{
  let cleanups = 0;
  walk(componentAst, (n) => {
    if (n.type !== 'CallExpression' || n.callee.name !== 'useEffect') return;
    walk(n.arguments[0], (m) => {
      if (m.type !== 'ReturnStatement' || !m.argument) return;
      if (m.argument.type !== 'ArrowFunctionExpression' && m.argument.type !== 'FunctionExpression') return;
      walk(m.argument, (s) => {
        if (
          s.type === 'CallExpression' &&
          s.callee.type === 'MemberExpression' &&
          s.callee.property.name === 'stop'
        ) cleanups += 1;
      });
    });
  });
  if (cleanups > 0) ok(`D3 the effect returns a cleanup that calls .stop() (${cleanups} found)`);
  else bad('D3 cleanup', 'no useEffect returns a function that calls .stop() — a native spring can outlive the unmount');
}

// D4 — THE CUE-STRANDING ROW, and the reason this rig exists at all. The
// reduced-motion branch must be reachable WITHOUT the cue: a hero whose
// flight is skipped under Reduce Motion may never flip `active`, and a
// branch that reads it would leave the copy at opacity 0 forever for
// exactly the users least able to tolerate it.
{
  let branch = null;
  walk(componentAst, (n) => {
    if (n.type !== 'IfStatement') return;
    if (identifiersIn(n.test).has('reduced')) branch = n;
  });
  if (!branch) {
    bad('D4 reduced-motion branch', 'no `if` guarded on `reduced` — the reduced path cannot be identified');
  } else {
    const test = identifiersIn(branch.test);
    if (!test.has('active')) ok(`D4 the reduced-motion branch reads {${[...test].join(', ')}} and NOT \`active\` — the cue cannot strand the copy`);
    else bad('D4 cue stranding', 'the reduced-motion branch reads `active`: under Reduce Motion the text waits for a cue that may never fire');
  }
}

// D5 — the announced label does not depend on the cue either. Same failure,
// one sense over: a VoiceOver user must not be told the line is empty for
// the length of a beat they cannot see.
{
  let bads = 0;
  let seen = 0;
  walk(componentAst, (n) => {
    if (n.type !== 'JSXAttribute' || n.name.name !== 'accessibilityLabel') return;
    seen += 1;
    if (identifiersIn(n).has('active')) {
      bads += 1;
      bad('D5 label', 'accessibilityLabel is conditioned on `active`');
    }
  });
  if (seen === 0) bad('D5 label', 'no accessibilityLabel attribute found — the sentence is announced as N word fragments or not at all');
  else if (!bads) ok(`D5 ${seen} accessibilityLabel attribute(s): the label is the copy, not the frame — never conditioned on \`active\``);
}

// D6 — LAYOUT IS FINAL AT FRAME 0, by construction. The animated style may
// touch `opacity` and `transform` and nothing else: both are non-layout
// properties in RN, so nothing beneath this block can reflow as the words
// arrive. An animated `fontSize`, `width` or `margin` would re-break the
// line on every frame — the exact defect the boxed-word approach exists to
// prevent, arriving through the back door.
{
  const LAYOUT_SAFE = new Set(['opacity', 'transform']);
  let checked = 0;
  let bads = 0;
  walk(componentAst, (n) => {
    if (n.type !== 'ObjectExpression') return;
    const keys = n.properties.filter((p) => p.type === 'ObjectProperty' && p.key.type === 'Identifier').map((p) => p.key.name);
    if (!keys.includes('opacity')) return;
    checked += 1;
    const unsafe = keys.filter((k) => !LAYOUT_SAFE.has(k));
    if (unsafe.length) {
      bads += 1;
      bad('D6 animated layout property', `the animated style also sets ${unsafe.join(', ')}`);
    }
  });
  if (checked === 0) bad('D6 animated style', 'no animated style object with an `opacity` key found — the row asserted nothing');
  else if (!bads) ok(`D6 ${checked} animated style object(s) touch only opacity/transform — no reflow as words arrive`);
}

// D7 — every segment is MOUNTED from frame 0, not mounted progressively.
// Progressive mounting is the obvious implementation and it re-breaks the
// line on every arrival; the tell is the render reading the cue.
{
  let mapBody = null;
  walk(componentAst, (n) => {
    if (
      n.type === 'CallExpression' &&
      n.callee.type === 'MemberExpression' &&
      n.callee.property.name === 'map' &&
      n.callee.object.name === 'segments'
    ) mapBody = n.arguments[0];
  });
  if (!mapBody) bad('D7 segment render', 'could not find the segments.map render');
  else if (!identifiersIn(mapBody).has('active')) ok('D7 the segment render never reads `active` — all segments mount at frame 0, layout final before the first word is visible');
  else bad('D7 progressive mounting', 'the segment render reads `active`, so segments mount as they arrive and the line re-breaks each time');
}

// D8 — the sentence is announced once, not as N fragments. A flex row of
// nine word boxes is nine VoiceOver stops reading one word each.
{
  let containers = 0;
  let hidden = 0;
  walk(componentAst, (n) => {
    if (n.type !== 'JSXOpeningElement') return;
    const attrs = n.attributes.filter((a) => a.type === 'JSXAttribute').map((a) => a.name.name);
    if (attrs.includes('accessible') && attrs.includes('accessibilityLabel')) containers += 1;
    if (attrs.includes('importantForAccessibility')) hidden += 1;
  });
  if (containers > 0 && hidden > 0) ok(`D8 ${containers} accessible labelled container(s), ${hidden} element(s) hidden from the tree — one announcement, not one per word`);
  else bad('D8 accessibility grouping', `labelled accessible containers=${containers}, hidden descendants=${hidden}`);
}

// D9 — the step is DERIVED from the shared cascade function, not restated.
// This is what keeps §14.1's budget binding on this beat: a local literal
// would be a second timing system that agrees with the first only by
// coincidence, and only until one of them is retuned.
{
  if (/staggerDelay\(1,\s*count\)/.test(componentSrc)) ok('D9 the per-segment step is staggerDelay(1, count) — derived from motion.js, not restated');
  else bad('D9 step derivation', 'the component does not derive its step from staggerDelay(1, count)');
}

// D10 — the component holds for the OS preference read rather than assuming
// full motion (R19/R20: new components opt into the resolved sibling).
{
  if (/useReducedMotionState/.test(componentSrc)) ok('D10 uses useReducedMotionState — the reduced branch waits for a resolved read, not an assumed one');
  else bad('D10 reduced-motion hook', 'the component does not use useReducedMotionState');
}

// D11 — THE HERO-ABSENT ROW (Lumen's ruling, 2026-08-27). D4 covers one way
// a cue never fires; this covers the other, and the other one is worse. A
// surface may adopt this copy WITHOUT adopting the bee that stages it —
// then nobody emits a settle, `active` never flips, and under full motion
// the line is simply absent on a build where every other frame looks
// perfect. There is no accessibility setting to correlate it with and no
// user complaint that names it. So the component must decide the unstaged
// case ITSELF, before it reads anything else.
{
  let unstaged = null;
  let reducedBranch = null;
  walk(componentAst, (n) => {
    if (n.type !== 'IfStatement') return;
    const t = identifiersIn(n.test);
    // Order matters: any `if` reading `active` is a candidate unstaged
    // branch, INCLUDING one that also reads `reduced`. Classifying on
    // `reduced` first would route that case to the reduced branch and leave
    // the clause written for it permanently unreachable.
    if (t.has('active')) unstaged = n;
    else if (t.has('reduced')) reducedBranch = n;
  });

  if (!unstaged) {
    bad('D11 hero-absent', 'no `if` decides the unstaged case from `active` alone — a call site with no staged hero strands its copy at opacity 0 under full motion');
  } else if (identifiersIn(unstaged.test).has('reduced')) {
    bad('D11 hero-absent', 'the unstaged branch also reads `reduced` — an unstaged surface would only be safe for Reduce Motion users');
  } else if (reducedBranch && unstaged.start > reducedBranch.start) {
    bad('D11 hero-absent', 'the unstaged branch is tested AFTER the reduced branch — the unstaged case must not wait on an async OS read');
  } else {
    ok('D11 an `if` on `active` alone decides the unstaged case, ahead of the reduced-motion branch');

    // D11b — THE DOMAIN SWEEP, and the row that makes D11 more than
    // decoration. The obvious "fix" for D11 is `if (!active) return
    // renderFinal()`, which passes every structural check above and DELETES
    // THE BEAT: `active={false}` — a hero that exists and has not settled
    // yet — would render finished text instead of holding, so no call site
    // could ever choreograph anything. Absent and not-yet-arrived are
    // different states and the predicate has to tell them apart. Evaluated
    // rather than pattern-matched, over the whole reachable domain.
    // `undefined` parses as an Identifier but is a global literal, not a
    // dependency — excluding it lets the sweep actually run on the
    // plausible-but-holed `active === undefined` shape instead of bailing
    // out with a message about the wrong problem.
    const testIds = [...identifiersIn(unstaged.test)].filter((id) => id !== 'undefined');
    if (testIds.length !== 1 || testIds[0] !== 'active') {
      bad('D11b unstaged predicate', `the test reads {${testIds.join(', ')}} — it must be a function of \`active\` alone to be evaluated here`);
    } else {
      const testSrc = componentSrc.slice(unstaged.test.start, unstaged.test.end);
      let fn = null;
      try {
        fn = new Function('active', `return !!(${testSrc});`);
      } catch (e) {
        bad('D11b unstaged predicate', `could not evaluate \`${testSrc}\`: ${e.message}`);
      }
      if (fn) {
        // [value, expected unstaged?, what the value means at a call site]
        const domain = [
          [true, false, 'the cue has fired — run the beat'],
          [false, false, 'a hero exists and has not settled — HOLD'],
          [undefined, true, 'the prop was omitted — no hero will ever cue this'],
          [null, true, "a caller's own state has not initialised (useState(null))"],
        ];
        const wrong = domain.filter(([v, want]) => fn(v) !== want);
        if (wrong.length === 0) {
          ok(`D11b unstaged predicate \`${testSrc}\` is correct on all ${domain.length} reachable values — absent renders, not-yet-settled holds`);
        } else {
          wrong.forEach(([v, want, meaning]) => {
            bad('D11b unstaged predicate', `\`${testSrc}\` treats active=${String(v)} as ${want ? 'staged' : 'unstaged'} — ${meaning}`);
          });
        }
      }
    }

    // D12 — BOTH unconditioned states arrive through the SAME renderer, so
    // "the text arrived" cannot come to mean two different things. The
    // failure this prevents is quiet: two hand-written copies of the final
    // render drift, one of them keeps a stale prop, and only one of the two
    // states is ever looked at on a device.
    const returnedCall = (node) => {
      const names = [];
      walk(node, (n) => {
        if (n.type === 'ReturnStatement' && n.argument && n.argument.type === 'CallExpression' && n.argument.callee.type === 'Identifier') {
          names.push(n.argument.callee.name);
        }
      });
      return names;
    };
    const a = returnedCall(unstaged.consequent);
    const b = reducedBranch ? returnedCall(reducedBranch.consequent) : [];
    if (a.length === 1 && b.length === 1 && a[0] === b[0]) {
      ok(`D12 both unconditioned states return the same renderer, \`${a[0]}()\` — one definition of "the text arrived"`);
    } else {
      bad('D12 shared final renderer', `unstaged returns [${a.join(', ')}], reduced returns [${b.join(', ')}] — the two states render the finished string through different code`);
    }
  }
}

// D13 — the DEFAULT grain is the lossless one. Deezine picked `line` for
// both first adopters (2026-08-27) on typographic purity, and line grain is
// also the grain measured pixel-identical to a plain `<Text>` on device (0
// differing pixels, both lines). Those two facts together are what make it
// the right default rather than merely the current pick: a call site that
// says nothing about grain should pay nothing for the silence. Word grain
// costs up to 2 device pixels of accumulated inter-word advance along a
// row, which is a thing to opt into.
{
  const m = /grain\s*=\s*GRAINS\.([A-Z]+)/.exec(componentSrc);
  if (!m) bad('D13 default grain', 'no `grain = GRAINS.X` default found in the component signature');
  else if (m[1] === 'LINE') ok('D13 the default grain is GRAINS.LINE — the lossless grain, so an unstated grain costs nothing');
  else bad('D13 default grain', `the default is GRAINS.${m[1]}: an unstated grain silently costs the caller sub-pixel advance it never asked for`);
}

console.log(`\ncheck-type-choreography: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
