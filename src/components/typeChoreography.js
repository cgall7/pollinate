// MB-P1 — the type-choreography primitive's arithmetic (Lumen's commission,
// 2026-08-27): "one RN mechanism for progressive text arrival synced to a
// hero's settle."
//
// This file is the half with no React in it: segmentation and the schedule.
// `ChoreographedText.js` is the half that renders. The split is deliberate
// and has a precedent — `pollinationFlight.js` stays import-free so the
// gate can sample it under plain node, and the numbers it needs arrive as
// ARGUMENTS rather than imports. Same shape here: `revealSchedule` takes
// `stepMs` instead of importing `staggerDelay`, because `motion.js` imports
// React and a node gate cannot load it. That keeps the acceptance rig able
// to SWEEP this function (R81 — a sequencer is a generator of sessions, and
// four sampled points cannot pin one) instead of checking that a constant
// exists.
//
// WHAT THIS MODULE IS FOR, and the boundary is load-bearing rather than
// stylistic: A LINE, NOT A PROSE BLOCK. Both named first adopters are one
// sentence (the Today greeting, the P2 acknowledgment). Word grain over a
// 200-word entry would mount 200 native springs, which is a perf hazard
// dressed as a feature, so the schedule COLLAPSES past `MAX_SEGMENTS` and
// says so in its return value rather than doing it quietly.

export const GRAINS = { WORD: 'word', LINE: 'line' };

// R43 (device-confirmed, `StaggeredItem.js`): `SpringAnimation.js:234`
// special-cases a falsy delay to call `start()` SYNCHRONOUSLY inside the
// effect, and the one configuration ever observed to freeze on device is a
// native spring started synchronously on a value that was just stopped and
// rewound — which is exactly what a replay of this beat does. Flooring the
// first segment to one frame is invisible and puts every segment here on
// the deferred path. `StaggeredItem` carries its own literal `16` for the
// same RN fact; folding the two onto one name is a follow-up, not this
// commit's business.
export const MIN_START_DELAY_MS = 16;

// When a segment becomes READABLE, which is not when its animation rests.
// Measured off RN's own analytical spring solution
// (`SpringAnimation.js:297-305`) for `SPRINGS.reveal` (tension 120,
// friction 7 -> stiffness 519.8, damping 22, zeta 0.48247), sampled at
// 60fps: opacity first reaches 1.0 at frame 7 = 116.7ms, peaks 1.1746 at
// 150.0ms, and does not satisfy RN's rest thresholds until 783.3ms.
//
// The caller needs the first number, not the last one. P2's beat requires
// "acknowledgment precedes numbers IN TIME, not just in layout"
// (PRESENCE_PASS_REGISTER lane P2), so whatever chains after this beat
// chains off `settleMs` — and chaining off 783ms would hold the arithmetic
// for two thirds of a second after the words were already legible.
//
// The acceptance rig recomputes this from `motion.js`'s own SPRINGS.reveal
// literals and reds if a retune moves it, so this constant cannot quietly
// become a description of a curve that no longer ships.
export const SEGMENT_LEGIBLE_MS = 117;

// Past this, the schedule stops segmenting and fades the whole string as
// one. See the module header: the ceiling is what makes "for a line" an
// enforced property rather than an intention. 40 words is roughly three
// full-width lines of body copy — comfortably above every candidate string
// in the register's P3 draft options (the longest is 8 words).
export const MAX_SEGMENTS = 40;

// Split a string into the units that arrive one at a time.
//
// Returns `{ text, breakBefore }[]`. `breakBefore` means "this segment
// starts a new row" and exists so that a HARD LINE BREAK IN THE COPY
// SURVIVES WORD GRAIN. Without it, `'Pause.\nThink of someone.'` (the Lock
// gate's line, retired by R-OD; kept here as the worked example) renders as
// one run-on row: the author's structure silently deleted by a rendering
// choice. The renderer inserts a full-width spacer, so one flex-wrap
// container serves both grains and the grain only changes what gets
// segmented.
export const segmentText = (text, grain) => {
  if (typeof text !== 'string') return [];
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  if (grain === GRAINS.LINE) {
    return lines.map((line, index) => ({ text: line, breakBefore: index > 0 }));
  }
  const segments = [];
  lines.forEach((line, lineIndex) => {
    line.split(/\s+/).filter(Boolean).forEach((word, wordIndex) => {
      segments.push({ text: word, breakBefore: lineIndex > 0 && wordIndex === 0 });
    });
  });
  return segments;
};

// Per-segment start delays for a cascade of `count`, given the step the
// caller derives from the shared motion module.
//
// `stepMs` is an argument, not an import, for the reason in the header —
// but the CALLER is not free to invent it. `ChoreographedText` derives it
// from `staggerDelay(1, count)`, so a long line divides `CASCADE_BUDGET_MS`
// instead of multiplying `STAGGER_MS` (R24: what §14.1 ratified is how a
// cascade FEELS, and that is its total length, not its step). The gate
// asserts that derivation at the call site and sweeps this function against
// the constants it reads out of `motion.js` itself.
export const revealDelays = (count, stepMs) =>
  Array.from({ length: Math.max(0, count) }, (_, index) =>
    Math.max(index * Math.max(0, stepMs || 0), MIN_START_DELAY_MS));

// The whole beat: what to render, when each piece starts, and when the
// caller may put something after it.
//
// `collapsed` is in the return value rather than being a quiet behaviour
// because a caller that hands this 200 words gets a different beat from the
// one it asked for, and that is a thing to be able to see — from a test, a
// gate, or a dev overlay — without reading this file.
export const revealSchedule = (text, { grain = GRAINS.WORD, stepMs = 0 } = {}) => {
  const parsed = segmentText(text, grain);
  const collapsed = parsed.length > MAX_SEGMENTS;
  const segments = collapsed
    ? [{ text: parsed.map((s) => s.text).join(' '), breakBefore: false }]
    : parsed;
  const delays = revealDelays(segments.length, stepMs);
  return {
    segments,
    delays,
    collapsed,
    // Empty copy settles at 0: a caller chaining off this must not wait for
    // a beat that has nothing to play. `segments.length` is the only thing
    // that decides it, so an empty string and a whitespace-only string
    // behave identically.
    settleMs: segments.length === 0 ? 0 : delays[delays.length - 1] + SEGMENT_LEGIBLE_MS,
  };
};
