// Sage's gate 4 of the luxury pass (Lumen, thread 6596d9c2, Lane G) — the
// bee's idle-motion budget. Colin: "Unless you make it super luxurious retire
// it." This is the bar that can actually say no.
//
// REWRITTEN 2026-08-25 (Bee Doctrine thread, UX Design #8d2c9a5d). The first
// version compared `.mov` FILE SIZE, on the theory that `simctl recordVideo`
// only writes frames when pixels change, so file size tracks idle motion.
// Pixel measured the theory apart: the encoder writes a WHOLE FRAME the
// moment ANY pixel changes, so file size is a binary detector of "is
// anything moving" wearing a percentage's clothes. Presence cost 1.01x
// (bee drawn, looping, zero pixel change — his 0deg control). Shipping the
// sweep at 3x amplitude cost 813x against 811x for 1x. Nothing can land
// between 1.00x and a 1.15x retire bar, so `RETIRE_THRESHOLD_PCT` implied a
// proportionality the metric never had. It is gone from this file; the
// finding is why, not a change made without one.
//
// What replaces it, per Lumen's ruling on the same thread, is two separate
// questions in two separate currencies:
//
//   1. TRIPWIRE (binary): does anything move OUTSIDE the declared Breath
//      region? This is the property Colin actually asked for — "Today is
//      completely still apart from one wing" — and a binary question does
//      not need a percentage to answer it.
//   2. AMPLITUDE (lossless, reported not thresholded): how much does the
//      declared region itself move? Peak per-pixel intensity delta and
//      changed-pixel count, in the doctrine's own currency, not a codec's.
//      No ceiling ships here because none has been ruled — this reports the
//      number so a ceiling CAN be ruled, rather than inventing one.
//
// Still NOT `check-*.mjs`, for the same reason as before: this drives real
// captures (a booted simulator, or a pre-recorded PNG burst) over real wall
// time and reports on IMAGES, not source. `run-checks.mjs`'s glob expects a
// deterministic, no-IO assertion finishing in seconds — wiring this in would
// either time out CI or get silently skipped there. Manual instrument, same
// category as `simulate-bee-flight.mjs`, run on demand, verdict reported by
// hand.
//
// USAGE
//
//   node scripts/measure-bee-idle-motion.mjs predict-region --size 44
//   node scripts/measure-bee-idle-motion.mjs capture --label mounted-1 --seconds 20 [--device booted]
//   node scripts/measure-bee-idle-motion.mjs capture --label suppressed-1 --seconds 20
//   node scripts/measure-bee-idle-motion.mjs analyze --label mounted-1 --anchor-x N --anchor-y N --anchor-w N --anchor-h N
//   node scripts/measure-bee-idle-motion.mjs compare
//   node scripts/measure-bee-idle-motion.mjs self-test
//
// `capture` needs a booted simulator (`xcrun simctl io <device> screenshot`
// in a tight loop — lossless PNGs, not a compressed `.mov`, because the
// amplitude question needs real pixel values). `analyze` needs the
// character box's on-screen rect in px — this script does not know where
// the anchor resolved; §32.2 resolves it live against the actual render, so
// whoever captured the burst has to supply it, the same way Pixel's own
// measurement pairs a source PREDICTION with a device MEASUREMENT rather
// than assuming either alone.
//
// THE ONE INTEGRATION POINT THIS SCRIPT DOES NOT OWN — unchanged from the
// first version: "bee suppressed" needs `EXPO_PUBLIC_SUPPRESS_BEE=true` to
// unmount the resident bee (`src/constants/beeSuppression.js`). This script
// does not set that env var for you; it is a build-time flag, not something
// `capture` can toggle mid-run.
//
// SELF-TEST builds synthetic RGBA frames in memory — no simulator, no
// device, no external files — and runs them through the real decode/diff/
// evaluate pipeline used on a genuine capture. That is a stronger claim than
// exercising `evaluate()`'s arithmetic against hand-picked numbers (the
// previous version's self-test, and still worth doing): it proves the PNG
// codec, the diff engine, and the region classifier agree with each other on
// a case whose right answer is known by construction, before either ever
// touches a real screenshot.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { decodePNG, encodePNG } from './lib/png-codec.mjs';
import { breathSweepFractionBBox, fractionBBoxToPx } from './lib/bee-breath-region.mjs';
import { BREATH_BEAT_DEG, MASCOT_ASPECT, MASCOT_WIDTH_FRACTION } from '../src/constants/mascot.js';

const OUT_DIR = path.join(os.tmpdir(), 'bee-idle-motion');
const DEFAULT_SECONDS = 20;

const args = process.argv.slice(2);
const cmd = args[0];
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const numFlag = (name, fallback) => {
  const v = flag(name);
  return v === undefined ? fallback : Number(v);
};

// --- region prediction ------------------------------------------------------

/**
 * The swept region in both currencies: box-fraction (device- and
 * size-independent) and pt (given `size`, the same prop `MascotBee` takes —
 * `width = size * MASCOT_WIDTH_FRACTION`, `height = width / MASCOT_ASPECT`,
 * the same derivation `MascotBee.js` itself uses). Still not px: that needs
 * the character box's on-screen ORIGIN, which only resolves against a live
 * render (§32.2) — `analyze` takes that as `--anchor-x/-y/-w/-h` from a real
 * measurement, the same pairing Pixel's own predict-then-measure method uses.
 */
const predictRegion = (size) => {
  const frac = breathSweepFractionBBox({ sweepDeg: BREATH_BEAT_DEG });
  const width = size * MASCOT_WIDTH_FRACTION;
  const height = width / MASCOT_ASPECT;
  const pt = {
    minX: frac.minX * width,
    maxX: frac.maxX * width,
    minY: frac.minY * height,
    maxY: frac.maxY * height,
  };
  return { frac, pt, boxWidth: width, boxHeight: height };
};

// --- pure region classification, exercised by self-test AND by `analyze` --

/** Is point (x,y) inside rect {minX,maxX,minY,maxY} (inclusive)? */
const inRegion = (x, y, region) => x >= region.minX && x <= region.maxX && y >= region.minY && y <= region.maxY;

/**
 * Diff every consecutive frame pair in `frames` (array of {width,height,data}
 * RGBA buffers, all identical dimensions) and classify each changed pixel as
 * inside or outside `region` (px rect in the SAME coordinate space the
 * frames were captured in). Diffs every consecutive pair rather than just
 * first-vs-last: a periodic motion that returns to its start phase across a
 * whole number of cycles would otherwise read as static.
 *
 * `noiseFloor`: minimum per-channel abs delta to count as "changed" — 0 by
 * default because these are lossless frames and Pixel's own 0deg control
 * measured exactly zero changed pixels on a real device, so no floor was
 * needed there. Left configurable rather than hard-coded in case a future
 * capture path reintroduces dithering or scaling.
 */
export const diffFrames = (frames, region, { noiseFloor = 0 } = {}) => {
  if (frames.length < 2) throw new Error('need >= 2 frames to diff');
  const { width, height } = frames[0];
  for (const f of frames) {
    if (f.width !== width || f.height !== height) throw new Error('all frames must share dimensions');
  }

  let changedInside = 0;
  let changedOutside = 0;
  let peakDeltaInside = 0;
  let peakDeltaOutside = 0;
  let outsideBBox = null;
  const seenChanged = new Uint8Array(width * height); // union across all frame-pairs, counted once each

  for (let f = 1; f < frames.length; f += 1) {
    const a = frames[f - 1].data;
    const b = frames[f].data;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * 4;
        const dr = Math.abs(a[i] - b[i]);
        const dg = Math.abs(a[i + 1] - b[i + 1]);
        const db = Math.abs(a[i + 2] - b[i + 2]);
        const delta = Math.max(dr, dg, db);
        if (delta <= noiseFloor) continue;

        const idx = y * width + x;
        const inside = inRegion(x, y, region);
        if (inside) {
          peakDeltaInside = Math.max(peakDeltaInside, delta);
          if (!seenChanged[idx]) changedInside += 1;
        } else {
          peakDeltaOutside = Math.max(peakDeltaOutside, delta);
          if (!seenChanged[idx]) changedOutside += 1;
          outsideBBox = outsideBBox
            ? {
                minX: Math.min(outsideBBox.minX, x),
                maxX: Math.max(outsideBBox.maxX, x),
                minY: Math.min(outsideBBox.minY, y),
                maxY: Math.max(outsideBBox.maxY, y),
              }
            : { minX: x, maxX: x, minY: y, maxY: y };
        }
        seenChanged[idx] = 1;
      }
    }
  }

  return { changedInside, changedOutside, peakDeltaInside, peakDeltaOutside, outsideBBox };
};

// --- pure verdict logic, exercised by self-test AND by `compare` ----------

/**
 * `mountedSummaries` / `suppressedSummaries`: arrays of `diffFrames()`
 * outputs, one per captured run (>= 2 per condition, matching the original
 * file's "check self-consistency before trusting a verdict" discipline).
 *
 * TRIPWIRE bounds the CONTROL's contribution to the delta, not the control
 * to itself (Pixel's exact fix for the old CONTROL_VARIANCE check, which
 * divided two suppressed runs' 5KB of codec wobble by their own near-zero
 * magnitude and got a meaningless 6.4%). Concretely: the worst outside-region
 * signal seen with the bee SUPPRESSED is the ambient noise floor (status bar
 * clock, battery icon) — the bee only fails the tripwire if its worst
 * outside-region signal EXCEEDS that floor, not if it is merely nonzero.
 */
export const evaluate = (mountedSummaries, suppressedSummaries) => {
  if (mountedSummaries.length < 2 || suppressedSummaries.length < 2) {
    return { verdict: 'INSUFFICIENT_RUNS', detail: 'need >= 2 captures per condition' };
  }

  const maxOf = (arr, key) => Math.max(...arr.map((s) => s[key]));

  const mountedOutsidePx = maxOf(mountedSummaries, 'changedOutside');
  const mountedOutsideDelta = maxOf(mountedSummaries, 'peakDeltaOutside');
  const suppressedOutsidePx = maxOf(suppressedSummaries, 'changedOutside');
  const suppressedOutsideDelta = maxOf(suppressedSummaries, 'peakDeltaOutside');

  const excessPx = mountedOutsidePx - suppressedOutsidePx;
  const excessDelta = mountedOutsideDelta - suppressedOutsideDelta;
  const leaks = excessPx > 0 || excessDelta > 0;

  const worstLeakBBox = leaks
    ? mountedSummaries.filter((s) => s.outsideBBox).map((s) => s.outsideBBox).sort((a, b) => (b.maxX - b.minX) * (b.maxY - b.minY) - (a.maxX - a.minX) * (a.maxY - a.minY))[0] ?? null
    : null;

  const tripwire = leaks
    ? {
        verdict: 'LEAK',
        detail: `mounted shows motion outside the declared region beyond the ambient floor (bee: ${mountedOutsidePx}px/peak-Δ${mountedOutsideDelta}, ambient: ${suppressedOutsidePx}px/peak-Δ${suppressedOutsideDelta})`,
        excessPx,
        excessDelta,
        leakBBox: worstLeakBBox,
      }
    : {
        verdict: 'CONFINED',
        detail: `mounted's outside-region signal (${mountedOutsidePx}px/peak-Δ${mountedOutsideDelta}) does not exceed the ambient floor (${suppressedOutsidePx}px/peak-Δ${suppressedOutsideDelta}) — nothing moves outside the declared Breath region`,
      };

  const amplitude = {
    mountedInsidePx: maxOf(mountedSummaries, 'changedInside'),
    mountedInsideDeltaPeak: maxOf(mountedSummaries, 'peakDeltaInside'),
    suppressedInsidePx: maxOf(suppressedSummaries, 'changedInside'),
    suppressedInsideDeltaPeak: maxOf(suppressedSummaries, 'peakDeltaInside'),
    note: 'reported only — no ceiling ships here because none has been ruled; this is the number a ceiling would be ruled against',
  };

  return { verdict: tripwire.verdict, tripwire, amplitude };
};

// --- self-test --------------------------------------------------------------

const solidFrame = (width, height, [r, g, b]) => {
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
};

/** Copy of `base` with a `size`x`size` patch at (x,y) set to `color`. */
const withPatch = (base, x, y, size, color) => {
  const data = Buffer.from(base.data);
  for (let dy = 0; dy < size; dy += 1) {
    for (let dx = 0; dx < size; dx += 1) {
      const i = ((y + dy) * base.width + (x + dx)) * 4;
      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
      data[i + 3] = 255;
    }
  }
  return { width: base.width, height: base.height, data };
};

const selfTest = () => {
  let pass = 0, fail = 0;
  const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    ok ? (pass += 1) : (fail += 1);
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
  };

  // --- PNG codec round-trip: encode then decode must reproduce the buffer
  const W = 20, H = 16;
  const region = { minX: 4, maxX: 9, minY: 4, maxY: 9 };
  const base = solidFrame(W, H, [10, 20, 30]);
  const roundTripped = decodePNG(encodePNG(base));
  check('PNG round-trip preserves dimensions', [roundTripped.width, roundTripped.height], [W, H]);
  check('PNG round-trip preserves pixel data', Buffer.compare(roundTripped.data, base.data), 0);

  // --- diffFrames: a static burst (bee suppressed, nothing moves anywhere)
  const staticBurst = [base, base, base];
  const staticDiff = diffFrames(staticBurst, region);
  check('static burst: zero changed pixels anywhere', [staticDiff.changedInside, staticDiff.changedOutside], [0, 0]);

  // --- diffFrames: motion confined to the declared region (correct Breath)
  const insideFrame = withPatch(base, 5, 5, 3, [200, 200, 200]); // fully inside [4,9]x[4,9]
  const insideBurst = [base, insideFrame, base]; // oscillates, endpoints match — exercises "diff consecutive, not endpoints"
  const insideDiff = diffFrames(insideBurst, region);
  check('confined motion: changed pixels all counted inside', insideDiff.changedOutside, 0);
  check('confined motion: inside count matches patch area', insideDiff.changedInside, 9);
  check('confined motion: peak delta reflects the patch contrast', insideDiff.peakDeltaInside, 190);

  // --- diffFrames: a leak outside the declared region (the bug this exists to catch)
  const leakFrame = withPatch(insideFrame, 12, 2, 2, [255, 0, 0]); // outside [4,9]x[4,9]
  const leakBurst = [base, leakFrame, base];
  const leakDiff = diffFrames(leakBurst, region);
  check('leak: outside pixels detected', leakDiff.changedOutside, 4);
  check('leak: outside bbox matches the leak patch', leakDiff.outsideBBox, { minX: 12, maxX: 13, minY: 2, maxY: 3 });

  // --- evaluate: end-to-end verdict on realistic run sets
  const mountedClean = [insideDiff, insideDiff];
  const suppressedClean = [staticDiff, staticDiff];
  check('evaluate: confined motion vs static control -> CONFINED', evaluate(mountedClean, suppressedClean).verdict, 'CONFINED');

  const mountedLeaking = [leakDiff, leakDiff];
  check('evaluate: a real leak vs static control -> LEAK', evaluate(mountedLeaking, suppressedClean).verdict, 'LEAK');

  // The control's own noise floor must be subtracted, not compared to itself:
  // an ambient control that ALSO shows the same outside-region noise (e.g. a
  // status-bar clock tick) must not fail the mounted run for reproducing it.
  const ambientNoiseDiff = { changedInside: 0, changedOutside: 4, peakDeltaInside: 0, peakDeltaOutside: 40, outsideBBox: { minX: 0, maxX: 1, minY: 0, maxY: 1 } };
  const suppressedNoisy = [ambientNoiseDiff, ambientNoiseDiff];
  const mountedSameNoise = [{ ...leakDiff, changedOutside: leakDiff.changedOutside, peakDeltaOutside: 40 }, { ...leakDiff, peakDeltaOutside: 40 }];
  // Reuse the leak's pixel positions/count exactly at the ambient's own peak delta so mounted does not exceed the floor.
  const mountedAtFloor = [
    { ...leakDiff, changedOutside: 4, peakDeltaOutside: 40 },
    { ...leakDiff, changedOutside: 4, peakDeltaOutside: 40 },
  ];
  check('evaluate: mounted at exactly the ambient floor -> CONFINED, not a false LEAK', evaluate(mountedAtFloor, suppressedNoisy).verdict, 'CONFINED');
  const mountedAboveFloor = [
    { ...leakDiff, changedOutside: 4, peakDeltaOutside: 41 },
    { ...leakDiff, changedOutside: 4, peakDeltaOutside: 41 },
  ];
  check('evaluate: mounted one Δ above the ambient floor -> LEAK', evaluate(mountedAboveFloor, suppressedNoisy).verdict, 'LEAK');

  check('evaluate: fewer than 2 runs per condition -> INSUFFICIENT_RUNS', evaluate([insideDiff], suppressedClean).verdict, 'INSUFFICIENT_RUNS');

  // --- breathSweepFractionBBox: stable as sample density increases (proves
  // 21 samples isn't an arbitrary choice that happens to work)
  const bbox11 = breathSweepFractionBBox({ samples: 11 });
  const bbox41 = breathSweepFractionBBox({ samples: 41 });
  const closeEnough = (a, b) => Math.abs(a - b) < 0.0005;
  const stable =
    closeEnough(bbox11.minX, bbox41.minX) &&
    closeEnough(bbox11.maxX, bbox41.maxX) &&
    closeEnough(bbox11.minY, bbox41.minY) &&
    closeEnough(bbox11.maxY, bbox41.maxY);
  check('breathSweepFractionBBox: bbox stable from 11 to 41 samples', stable, true);

  console.log(`\nself-test: ${pass} passed, ${fail} failed`);
  return fail === 0;
};

// --- `capture` — real device IO, not exercised by self-test ---------------

const capture = async () => {
  const label = flag('label');
  if (!label) throw new Error('--label is required, e.g. --label mounted-1');
  const device = flag('device', 'booted');
  const seconds = numFlag('seconds', DEFAULT_SECONDS);
  const dir = path.join(OUT_DIR, label);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f));

  console.log(`Capturing a PNG burst for ${seconds}s to ${dir}`);
  console.log('Leave the simulator untouched — no taps, no scrolls, nothing that would move a pixel on purpose.');

  const deadline = Date.now() + seconds * 1000;
  let n = 0;
  while (Date.now() < deadline) {
    const outFile = path.join(dir, `frame-${String(n).padStart(5, '0')}.png`);
    await new Promise((resolve, reject) => {
      const proc = spawn('xcrun', ['simctl', 'io', device, 'screenshot', outFile]);
      let stderr = '';
      proc.stderr.on('data', (d) => { stderr += d; });
      proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(stderr))));
    });
    n += 1;
  }
  console.log(`Captured ${n} frames.`);
};

// --- `analyze` --------------------------------------------------------------

const analyze = () => {
  const label = flag('label');
  if (!label) throw new Error('--label is required');
  const dir = path.join(OUT_DIR, label);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
  if (files.length < 2) throw new Error(`need >= 2 frames in ${dir}, found ${files.length}`);
  const frames = files.map((f) => decodePNG(fs.readFileSync(path.join(dir, f))));

  const anchorX = numFlag('anchor-x');
  const anchorY = numFlag('anchor-y');
  const anchorW = numFlag('anchor-w');
  const anchorH = numFlag('anchor-h');
  if ([anchorX, anchorY, anchorW, anchorH].some((v) => v === undefined || Number.isNaN(v))) {
    throw new Error('--anchor-x/-y/-w/-h (px) are required — this script does not know where the anchor resolved, see file header');
  }

  const fracBBox = breathSweepFractionBBox({ sweepDeg: BREATH_BEAT_DEG });
  const regionPx = fractionBBoxToPx(fracBBox, { x: anchorX, y: anchorY, width: anchorW, height: anchorH });
  console.log('Declared region (px):', regionPx);

  const summary = diffFrames(frames, regionPx);
  const outFile = path.join(OUT_DIR, `${label}.summary.json`);
  fs.writeFileSync(outFile, JSON.stringify({ region: regionPx, ...summary }, null, 2));
  console.log(`Wrote ${outFile}`);
  console.log(summary);
};

// --- `compare` --------------------------------------------------------------

const compare = () => {
  if (!fs.existsSync(OUT_DIR)) throw new Error(`no summaries found at ${OUT_DIR} — run \`analyze\` first`);
  const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.summary.json'));
  const load = (prefix) =>
    files
      .filter((f) => f.startsWith(prefix))
      .map((f) => JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), 'utf8')));

  const mounted = load('mounted');
  const suppressed = load('suppressed');
  console.log(`mounted runs: ${mounted.length}, suppressed runs: ${suppressed.length}`);

  const result = evaluate(mounted, suppressed);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.verdict === 'CONFINED' ? 0 : result.verdict === 'LEAK' ? 1 : 2);
};

// --- entry point ------------------------------------------------------------

if (cmd === 'predict-region') {
  const size = numFlag('size', 44);
  const { frac, pt, boxWidth, boxHeight } = predictRegion(size);
  console.log(`Character box at size=${size}: ${boxWidth.toFixed(2)} x ${boxHeight.toFixed(2)}pt`);
  console.log(`Predicted swept region, ${BREATH_BEAT_DEG}deg Breath (fraction of box):`, frac);
  console.log(`Predicted swept region, ${BREATH_BEAT_DEG}deg Breath (pt, box-local origin):`, pt);
  console.log(`  span: ${(pt.maxX - pt.minX).toFixed(2)} x ${(pt.maxY - pt.minY).toFixed(2)}pt`);
  console.log('Add the character box\'s measured on-screen origin (top-left) to these pt figures, or pass');
  console.log('--anchor-x/-y/-w/-h (px) to `analyze` directly and it will do this conversion for you.');
} else if (cmd === 'capture') {
  await capture();
} else if (cmd === 'analyze') {
  analyze();
} else if (cmd === 'compare') {
  compare();
} else if (cmd === 'self-test' || !cmd) {
  const ok = selfTest();
  if (!cmd) {
    console.log('\nUsage: predict-region [--size 44]');
    console.log('       capture --label <mounted-N|suppressed-N> [--seconds 20] [--device booted]');
    console.log('       analyze --label <label> --anchor-x N --anchor-y N --anchor-w N --anchor-h N');
    console.log('       compare');
  }
  process.exit(ok ? 0 : 1);
} else {
  console.error(`unknown command "${cmd}" — use predict-region, capture, analyze, compare, or self-test`);
  process.exit(1);
}
