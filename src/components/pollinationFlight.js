// Sunbeam §28 — the pollination tap, as arithmetic.
//
// You tap a face in your hive and the bee comes over and agrees with you.
// He breaks from the cruise loop wherever he happens to be, climbs to a
// staging point one lattice step above the cell, drops onto it, puffs
// pollen, and ambles back to the loop.
//
// What he does *not* do is fetch your card. §28.1, ratified: **the bee is
// never the acknowledgement, and never on the critical path of something the
// user asked for.** He decorates the SOURCE you tapped, never the PAYLOAD you
// wanted. The cell answers at t=0 (stroke + haptic) and the reveal card runs
// its existing 260ms unchanged — so time-to-content is identical to the build
// without him, which is the only reason a p95 of ~1.1s is affordable at all.
//
// This module is deliberately dependency-free — no React, no react-native, no
// theme, no `motion` — for the same reason `beeAttitude.js` is: it lets
// `scripts/check-bee-attitude.mjs` **import and sample these functions**
// rather than pattern-match the source of a file it cannot load. R81: sample
// the function, not the flight. Four live waypoints cannot pin a rule; a
// domain sweep can. The moment this file grows an import, the gate degrades
// to string-matching and rows 5 and 6 stop meaning anything.
//
// Easing functions arrive as arguments for the same reason. They are plain
// `(w) => number` in React Native, so nothing is lost by not importing them.

// §28.5 — the approach is specified as a RATIO to the cruise, not as a
// pixels-per-second constant. What reads as "he broke off to come here" is
// that he is moving faster than he was a moment ago; the absolute figure
// (375 px/s at 393x852) is a consequence of the container, not a design
// decision, and would be wrong on the next screen size.
//
// R-LF-4 (Living Flight, GUIDES/POLLINATE_LIVING_FLIGHT_SPEC.md), Colin's
// 2026-08-29 ruling ("the bee should fly at a slower pace"): 2 -> 1.15. The
// old figure's own justification (§28.5: "he is moving faster than he was a
// moment ago") went vacuous the day §32.2 retired the cruise-to-errand
// hand-off and he started departing FROM REST — any speed satisfies "faster
// than a moment ago" once a moment ago was zero, so the ratio was carrying no
// argument by the time this file was even at 2. 1.15 is chosen fresh, off
// the doctrine's own floor: it clears the neighbour hop's 400ms minimum
// (D-LF §1) where 2 broke it.
export const APPROACH_SPEED_RATIO = 1.15;

// §28.5 — the descent is a GESTURE, not a traverse, so it is specified as a
// duration. Its distance is the staging offset by construction (see
// `buildPollinationPlan`), so fixing the duration fixes the speed.
//
// R-LF-4, Colin's 2026-08-29 ruling: 160 -> 260ms. The old justification —
// "he settles onto the face at the pace he was already flying" — answered a
// cruise that no longer exists (see `APPROACH_SPEED_RATIO`); the new one is
// what a landing actually is, a DECELERATION: 30.07pt in 260ms is 115.6 px/s,
// 0.52x the new approach speed (221.26 px/s), about half. Flown on
// `Easing.out(cubic)` so he lands rather than arrives.
//
// **Named coupling, chosen and not inherited (R-LF-4):** `PRESENCE_FADE_MS`
// in `FlyingBee.js` is deliberately set equal to this constant, and so is the
// interval `start()` re-measures a not-yet-mounted anchor on. Both move to
// 260ms with this change; both are fine at the new figure.
export const DESCENT_MS = 260;

// §28.4 / C′ — how far above the face he hangs before he settles onto it.
//
// R87 measured the defect this replaces. The staging point used to be ONE
// RING STEP above the cell, and a ring step is the lattice's own pitch, so
// "one step above the cell" IS "the seat above it" wherever one exists: four
// of seven seats staged on another member's face, and the approach eases out
// into the phase split, so the slowest moment of the whole beat — a full
// stop — happened over the wrong person. R88: **a quantity borrowed from a
// lattice inherits the lattice's occupancy.** "Not a new number" justifies a
// SCALE; it never justifies a POSITION.
//
// So the offset is the BEE's dimension, not the comb's: he hangs his own
// length above the face he came to. §28.3's noun rule, again — the number is
// a length either way, and which noun it is a length OF decides where he
// stops. It moves with the character now, not with the lattice.
//
// The bound is the target cell's apothem, `ringStep / 2` (38.105pt at
// cellSize 44). Past it the staging point crosses the Voronoi boundary into
// the seat above and the defect is back. `STAGING_SAFETY` keeps it off the
// boundary itself, because at exactly half a step the hit-test is an exact
// tie and float noise picks the side (R88).
//
// **The `min` is a backstop, not the mechanism, and the gate proves it.** The
// approach clamp was killed in §28.5 because it bound on most taps — at which
// point it is not a guard, it is the mechanism wearing a guard's name. This
// one is the opposite: at the shipped pair (beeSize 44, cellSize 44) the body
// length is 30.07pt against a bound of 34.29, so the noun decides and the
// bound never binds. It only engages where a caller draws the bee large
// against the comb — `beeSize > 1.141 x cellSize` — and there the invariant
// matters more than the noun does. Rows 5c/5d sweep both halves of that: the
// bound holds for every pair, and the noun still decides at the shipped one.
export const STAGING_SAFETY = 0.9;

export const stagingOffsetFor = ({ bodyLengthPx, ringStep }) =>
  Math.min(bodyLengthPx, (STAGING_SAFETY * ringStep) / 2);

// §28.3 — how far past HIM the pollen lands, as a fraction of the character's
// drawn WIDTH (Lumen 2026-08-25).
//
// **This used to be a fraction of the lattice step, and that is the bug.** One
// radius for all six flecks made the ×0.72 alternation below do two jobs at
// once — variety AND clearance — so the short flecks were, by arithmetic, the
// ones that failed. Measured off the shipped build: the 48-degree fleck never
// left the bee at all, and the 160-degree one cleared him by 0.54pt, less than
// its own radius. The rest of the burst happened underneath him.
//
// Each fleck now starts from ITS OWN direction's clearance (`MASCOT_CLEARANCE`,
// derived from the assets' alpha) and this gap is what it adds on top, so
// every fleck clears the drawing by construction at every angle and the
// alternation is free to be variety again.
//
// **Solved on the visible-clear currency, not on terminal position.** The
// earlier form of this rule bound the fleck's TERMINAL position, which is the
// frame its opacity reaches zero — satisfiable by a fleck no one ever sees
// outside him. The bound that binds: every fleck is clear of the drawing while
// at least HALF its seed opacity remains.
//
// That instant is exactly u = 0.5, and for a reason worth writing down rather
// than measuring: opacity runs `Animated.timing`'s default easing, which is
// `Easing.inOut(Easing.ease)` (`TimingAnimation.js:77`), and `inOut(f)(0.5)`
// is `1 - f(1)/2` — one half for ANY easing, since `f(1) = 1` is what makes it
// an easing. So the half-opacity instant does not depend on which curve
// opacity uses, only on it being an `inOut`.
//
// At u = 0.5 the drift (`Easing.out(Easing.cubic)`) has covered 0.875 of the
// distance and the dot has shrunk to 0.65 of its 3pt radius, so a fleck at
// radius r has its near edge at 0.875r - 1.95pt. Requiring that to clear the
// direction's own reach c:
//
//     gap * mult >= c / 7 + 2.2286pt        (at size 44)
//
// The binding fleck is the ×0.72 one firing into a leg: c = 19.363pt gives a
// floor of 6.9371pt, 0.2307 of the character width. 0.26 ships — 12.7% of
// headroom, because a constant set AT its floor breaches it the moment
// anything it is derived from moves.
//
// The ceiling is unchanged and is still the comb's: the far edge of the burst
// must stay inside the cell's own apothem, so it reads as landing ON the face
// rather than around it. At 0.26 the widest fleck lands 27.18pt out against an
// apothem of 38.105pt — 29% of headroom, where the old single-radius shapes
// left 12%. `check-bee-attitude` asserts the realized product per fleck.
export const POLLEN_GAP_FRACTION = 0.26;


// R-LF-2.1 (Living Flight, Lumen's 2026-08-29 ruling against `960ec7b`) —
// **shape the speed, not the segment easings.**
//
// R-LF-2 applied `Easing.out(quad)` to the FIRST segment and
// `Easing.out(cubic)` to the LAST, and a segment is not a leg. Measured on
// the merged tip, seat 1 -> seat 2, ground speed per frame at 60fps:
//
//   0:266 … 283:266 │ 300:139 317:135 333:134 350:134 367:135 │ 383:234 400:337 417:267 … 533:5
//        approach   │          the fillet          │            the drop
//
// He cruises at 271, brakes to half for five frames, then lunges at the cell
// at 337 — 1.24x the speed he flew — and stops. Colin asked for a gentle
// land; every clean hop currently ARRIVES FASTER THAN IT TRAVELLED.
//
// **Why the identity-easing form of the ruling does not express a ramp.**
// The ruling's own remedy — make every segment's easing the identity and let
// each segment's duration carry the speed — is right about the mechanism and
// silently wrong about the resolution, because `adaptiveCurveSamples`
// refines on DEVIATION: a straight line has none, so the whole 23.6pt drop
// is exactly ONE segment. Identity easings across it means one constant
// speed for the entire drop and a dead stop at touchdown — the same defect
// moved 100ms later. (It is also why the lunge is as large as it is: the
// `out(cubic)` was being applied to one segment covering the whole drop, so
// its 3x-mean opening velocity is a leg-scale event, not a sample-scale one.)
//
// So the speed profile is expressed EXACTLY instead of approximated by
// segment count: one continuous v(t) over cumulative arc, inverted per
// segment. Each segment gets the duration the profile takes to cover its own
// arc, and an easing that is the profile's own arc-vs-time curve restricted
// to that segment and renormalised. Where segments are short this is
// indistinguishable from the identity; where a segment is a whole leg it is
// the difference between a landing and a stop.
//
// The three phases, and every one of them is forced rather than chosen:
//
//   LAUNCH   0 -> v, linear, over `LAUNCH_MS`. §32.2 retired the cruise loop,
//            so he departs FROM REST: today's step to full speed in one frame
//            is the single largest velocity discontinuity in the beat (a full
//            v, against the corner's 0.5v).
//   CRUISE   constant v — R-LF-3's weave is what makes the approach read as
//            alive; a speed change would be a second, competing signal.
//   DESCENT  v -> 0. Starts at EXACTLY the cruise speed, so the junction the
//            old profile lurched across has no step in it at all, and reaches
//            zero AT the cell rather than before it.
//
// **The cruise speed is held and the duration follows, not the reverse.**
// R-LF-4 ratified a SPEED (`APPROACH_SPEED_RATIO` x the reference); the
// approach's duration is `distance / speed`, its consequence. Redistributing
// a launch ramp inside a fixed `approachMs` inverts that — it holds the
// consequence and moves the ruling — and measurably: on the neighbour hop it
// would raise the cruise from 271 to 338 px/s, 25% FASTER, in the ruling
// whose ask was "slower". So the ramp's cost is paid in time: exactly
// `LAUNCH_MS / 2` on every flight, because a linear 0->v ramp covers half
// the ground a cruise would in the same window. Ground speed at every
// instant is <= today's; total flight length grows 60ms.
export const LAUNCH_MS = 120;

// The per-frame speed-change bound the whole profile is built to, and the
// only number here that is a judgement rather than a derivation.
//
// Lumen's acceptance test is a RATIO — "every frame-to-frame ratio inside
// [0.85, 1.15]". That bound cannot survive its own launch ramp: any profile
// that starts at rest has an unbounded speed RATIO in its first frames
// (0 -> 1 frame of speed is an infinite ratio, 1 -> 2 frames is 2.0), so a
// multiplicative test either excludes the launch or forbids starting from
// rest. The same intent expressed additively — no frame may change ground
// speed by more than 0.15 of the cruise — applies to the WHOLE flight with
// nothing excluded, and it is the same 15%.
//
// `LAUNCH_MS` is then a consequence of it, not a taste: a linear 0 -> v ramp
// changes speed by `v * frame / LAUNCH_MS` every frame, so the bound reads
// `LAUNCH_MS >= 16.67 / 0.15` = 111.1ms. 120 ships — 8% of headroom, and the
// launch is the binding case by construction (the gate asserts it stays so).
export const MAX_FRAME_SPEED_STEP_FRACTION = 0.15;

// The descent's decay exponent is DERIVED — `v(tau) = v * (1 - tau)^p` with
// `p` solved so the profile's own area is exactly the descent's arc:
//
//     D = v * T / (p + 1)      =>      p = v * T / D - 1
//
// which is what makes "starts at the cruise speed" and "ends at zero" and
// "covers exactly this arc in exactly this long" simultaneously true rather
// than two of three. At the shipped pair (402x874, cellSize 44) that solves
// to p = 1.003 — Lumen's linear ramp, arrived at rather than assumed.
//
// **Her 11% step was an arc, not a disagreement.** The ruling computes the
// linear ramp's start as `2 * arc / DESCENT_MS` = 242 px/s off a descent arc
// of 31.5pt, against a 271 cruise. The descent's real arc is 35.12pt — the
// fillet is part of the descent (`descentPoints` carries it, by this file's
// own construction) and bulges past the 30.07pt staging chord. At 35.12 the
// linear ramp starts at 270.2 against a cruise of 270.59: a 0.14% step, not
// an 11% one. The ramp was right; the arc it was solved against was short.
//
// `DESCENT_MS` becomes a FLOOR rather than a fixed duration, and the floor
// binds on small containers only. `p >= 1` requires `v >= 2D/T`, i.e. a
// cruise at least twice the descent's mean; below that there is no monotone
// v->0 profile over a FIXED T that does not hold high and then stop hard —
// swept, a 320x568 box lands `p = 0.229`, whose last frame drops 102 px/s in
// one frame, which is 75% of the corner defect this ruling exists to remove.
// So where the floor cannot hold the shape, the descent takes the time the
// shape needs: `T = max(DESCENT_MS, 2D/v)`, at which point `p = 1` exactly
// and the landing is Lumen's linear ramp. On every box this app ships to
// (393x852 and up) the extension is 0-34ms and `p` lands in [0.77, 1.79]
// before it; the gate sweeps and reports both.
export const MIN_DESCENT_DECAY = 1;

/**
 * The flight's speed as a function of time, and its exact inverse.
 *
 * Pure and dependency-free for the same reason as everything else in this
 * file: `check-bee-attitude` imports and SAMPLES it. A speed profile
 * asserted by reading source is a speed profile asserted by its name.
 *
 * @param approachArcPx  the real, weaved ground of the approach leg — not
 *                       the straight chord it is timed off
 * @param descentArcPx   fillet + drop, together, because that is what
 *                       `descentPoints` is
 * @param cruisePxS      the ground speed R-LF-4's ratio resolves to on THIS
 *                       leg: `approachArcPx / approachDurationMs(chord)`.
 *                       Passed in rather than derived here so the one place
 *                       §28.5's `distance / speed` is spelled stays the one
 *                       place.
 */
export const buildSpeedProfile = ({ approachArcPx, descentArcPx, cruisePxS }) => {
  const v = cruisePxS > 0 ? cruisePxS : 0;
  const A = Math.max(0, approachArcPx);
  const D = Math.max(0, descentArcPx);
  if (v <= 0) {
    // Nothing to fly (`from` is the staging point). Degenerate, but it must
    // return a usable profile rather than NaN: a zero-length approach and a
    // descent flown on the floor duration.
    const descentMs = DESCENT_MS;
    return {
      cruisePxS: 0, launchMs: 0, approachMs: 0, descentMs, decay: MIN_DESCENT_DECAY,
      durationMs: descentMs, approachArcPx: 0, descentArcPx: D,
      arcAtMs: (t) => (descentMs > 0 ? D * Math.min(1, Math.max(0, t / descentMs)) : D),
      msAtArc: (s) => (D > 0 ? descentMs * Math.min(1, Math.max(0, s / D)) : 0),
    };
  }

  // The ramp cannot be longer than the approach has ground for. If it is,
  // the approach IS the ramp and he reaches `v` exactly at its end — the
  // same family, at its boundary, with no separate case in the arithmetic
  // below (`A / v + launchMs / 2` collapses to `launchMs` there).
  const launchMs = Math.min(LAUNCH_MS, (2 * A * 1000) / v);
  const approachMs = (A * 1000) / v + launchMs / 2;
  const launchArc = (v * launchMs) / 2000;

  const descentMs = D > 0 ? Math.max(DESCENT_MS, (2 * D * 1000) / v) : DESCENT_MS;
  // p + 1, which is what every formula below actually wants.
  const decayPlus1 = D > 0 ? Math.max(MIN_DESCENT_DECAY + 1, (v * descentMs) / (1000 * D)) : MIN_DESCENT_DECAY + 1;

  const arcAtMs = (t) => {
    if (t <= 0) return 0;
    if (t <= launchMs) return launchMs > 0 ? (v * t * t) / (2000 * launchMs) : 0;
    if (t <= approachMs) return launchArc + (v * (t - launchMs)) / 1000;
    const tau = descentMs > 0 ? Math.min(1, (t - approachMs) / descentMs) : 1;
    return A + D * (1 - Math.pow(1 - tau, decayPlus1));
  };

  const msAtArc = (s) => {
    if (s <= 0) return 0;
    if (s <= launchArc) return launchMs > 0 ? Math.sqrt((2000 * launchMs * s) / v) : 0;
    if (s <= A) return launchMs + ((s - launchArc) * 1000) / v;
    if (D <= 0) return approachMs;
    const rest = Math.min(1, Math.max(0, (s - A) / D));
    return approachMs + descentMs * (1 - Math.pow(1 - rest, 1 / decayPlus1));
  };

  return {
    cruisePxS: v,
    launchMs,
    approachMs,
    descentMs,
    decay: decayPlus1 - 1,
    durationMs: approachMs + descentMs,
    approachArcPx: A,
    descentArcPx: D,
    arcAtMs,
    msAtArc,
  };
};

// Ground speed at time `t`, in px/s — the derivative of `arcAtMs`, spelled
// rather than differenced so the gate samples the PROFILE and not a finite
// difference of it. Exported because acceptance test 2 is written in this
// currency and nothing else in the app is.
export const speedAtMs = (profile, t) => {
  const { cruisePxS: v, launchMs, approachMs, descentMs, decay } = profile;
  if (t < 0 || t > profile.durationMs) return 0;
  if (t <= launchMs) return launchMs > 0 ? (v * t) / launchMs : v;
  if (t <= approachMs) return v;
  const tau = descentMs > 0 ? Math.min(1, (t - approachMs) / descentMs) : 1;
  return v * Math.pow(1 - tau, decay);
};

const TAU = Math.PI * 2;

export const distancePx = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

// Length of a fractional track resolved into one container. Used to derive
// the cruise speed from the cruise track rather than hard-coding it, so a
// re-authored `PATH` moves every figure in this file with it.
export const pathLengthPx = (path, width, height) => {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    total += Math.hypot((path[i].x - path[i - 1].x) * width, (path[i].y - path[i - 1].y) * height);
  }
  return total;
};

export const cruiseSpeedPxS = (path, width, height, loopMs) =>
  (pathLengthPx(path, width, height) / loopMs) * 1000;

// §28.5 — **no clamp, and that is the deliberate part.** `distance / speed`
// holds "the bee moves at one speed" by construction, which R81 established is
// strictly better than a bound a future preset can route around. A clamp was
// drafted and the sweep killed it: sampled uniformly in wall time the
// departure distance runs 41 -> 417px, so any clamp pair binds on a large
// fraction of taps — at which point it is not a guard, it is the mechanism
// wearing a guard's name. Strictly monotonic in distance, no flat region;
// gate row 5 sweeps the domain to say so.
export const approachDurationMs = (distance, speedPxS) => (distance / speedPxS) * 1000;

// §28.5 — the pollen count is DERIVED from what the trail pool has spare, not
// chosen. A trail particle lives `trailFadeMs` and one is dropped every
// `trailIntervalMs`, so `ceil(fade / interval)` slots are occupied at any
// moment; the rest are free. One left as slack, because the round-robin
// pointer and the burst must not race for the same slot.
//
// At the shipped numbers: 12 - ceil(750/160) = 12 - 5 = 7 free, minus slack = 6.
// Raise the cap or slow the cadence and this moves on its own; gate row 6
// asserts the derivation rather than the literal.
export const pollenCountFor = ({ poolSize, trailFadeMs, trailIntervalMs, slack = 1 }) =>
  Math.max(0, poolSize - Math.ceil(trailFadeMs / trailIntervalMs) - slack);

// Where the flecks go. Deterministic — no RNG, so a frame grab is
// reproducible and the gate can assert the fan rather than a distribution.
// Fanned across the lower half-plane (pollen falls), gaps alternating so the
// burst reads as a puff rather than a rosette.
//
// `clearanceFor(angleRadians) -> px` is how far the drawn character reaches in
// that direction. It arrives as an ARGUMENT rather than an import for the
// reason stated at the top of this file: the moment this module grows an
// import, `check-bee-attitude` can no longer load it and has to pattern-match
// the source instead of sampling the function. It also makes the fan testable
// against a silhouette the gate chooses, which is how the ceiling row sweeps
// shapes this drawing does not have.
//
// **The alternation is on the GAP, never on the radius.** Alternating the
// radius made the short flecks the ones that failed to clear him; alternating
// the gap keeps the burst irregular while every fleck starts from its own
// direction's clearance, so no fleck can be born inside the drawing whatever
// the angles are.
// The clearance accessor itself, so the ONE implementation is in a module the
// gate can load. It takes the table rather than importing it: `mascot.js` is
// importable, but this file's whole contract is that it imports nothing (see
// the header), and a lookup that lives in `FlyingBee` would be a lookup no
// gate can sample — the exact seam where "the gate asserts what it can import
// and the bug lives at the call site it couldn't" opens up.
//
// `bins[i]` is the character's reach over `[i * binDeg, (i+1) * binDeg]`, as a
// fraction of its drawn width; angles wrap, so no caller has to normalise.
export const clearanceLookup = (bins, binDeg, characterWidthPx) => (angleRadians) => {
  const deg = ((((angleRadians * 180) / Math.PI) % 360) + 360) % 360;
  return bins[Math.floor(deg / binDeg)] * characterWidthPx;
};

export const pollenFlecks = (count, clearanceFor, gapPx) => {
  if (count <= 0) return [];
  const from = TAU * (20 / 360);
  const to = TAU * (160 / 360);
  return Array.from({ length: count }).map((_, i) => {
    const a = count === 1 ? (from + to) / 2 : from + ((to - from) * i) / (count - 1);
    const r = clearanceFor(a) + gapPx * (i % 2 === 0 ? 1 : 0.72);
    return { dx: Math.cos(a) * r, dy: Math.sin(a) * r };
  });
};

// One monotone easing standing in for two phases.
//
// Why not two timings in a sequence: `buildAttitude` takes ONE easing and ONE
// duration, and it needs them because a facing change is specified in wall
// time and only the easing converts that into a window in the driven value
// (R51/§17.3). Handing it a piecewise easing keeps attitude exact across both
// legs for free. It also keeps R46's rule literally: one driver, one
// animation, stopped and restarted — never two.
//
// The split lands the driven value on exactly 0.5 at the phase boundary,
// which is what lets the track keep `buildTrack`'s uniform waypoint spacing
// (`buildAttitude` assumes waypoints sit at i/n) while the two legs run at
// different speeds. All of the speed difference lives in the easing.
export const composePhaseEasing = (split, easeA, easeB) => (w) => {
  if (split <= 0) return 0.5 + 0.5 * easeB(w);
  if (split >= 1) return 0.5 * easeA(w);
  if (w <= split) return 0.5 * easeA(w / split);
  return 0.5 + 0.5 * easeB((w - split) / (1 - split));
};

// §32 — the same construction for N segments instead of two.
//
// The sequencer's verbs (dart / hover / settle) each want their own easing,
// and the scope says "never one global ease again". But `buildAttitude` takes
// ONE easing and ONE duration and needs them, so the answer is the one
// `composePhaseEasing` already gives for two phases, generalised: not a
// sequence of timings but a single piecewise easing that lands the driven
// value exactly on `i/n` at each waypoint boundary. That keeps `buildTrack`'s
// uniform waypoint spacing (which `buildAttitude` assumes) while the segments
// run at different speeds — all of the speed difference lives in the easing —
// and it keeps R46 literal: one driver, one animation, stopped and restarted,
// never two.
//
// `durations` are wall-clock and need not be normalised; only their ratios
// matter, because the flight's total length is the timing's own `duration`.
//
// This SUBSUMES `composePhaseEasing`: at n = 2 the two are the same function,
// not merely similar. Segment 0 maps `[0, split]` onto `[0, 1/2]` as
// `(0 + easeA(local)) / 2`, which is `0.5 * easeA(local)`; segment 1 maps onto
// `[1/2, 1]` as `(1 + easeB(local)) / 2`. The gate asserts that equality by
// sampling rather than by reading, so the two cannot drift apart.
export const composeSegmentEasing = (durations, easings) => {
  const n = durations.length;
  const total = durations.reduce((a, b) => a + b, 0);
  const bounds = [0];
  for (let i = 0; i < n; i += 1) bounds.push(bounds[i] + (total > 0 ? durations[i] / total : 1 / n));
  return (w) => {
    if (w <= 0) return 0;
    if (w >= 1) return 1;
    let i = 0;
    while (i < n - 1 && w > bounds[i + 1]) i += 1;
    const span = bounds[i + 1] - bounds[i];
    const local = span > 0 ? (w - bounds[i]) / span : 1;
    return (i + easings[i](local)) / n;
  };
};

// R-LF-1 (Living Flight) — the approach and descent used to be two straight
// segments meeting at a hard corner over the staging point ("90 degree
// robot-like ways," Colin, 2026-08-29). The corner is smoothed with a
// quadratic-Bezier FILLET: a short length `r` is trimmed off each straight
// leg where it meets `staging`, and the trimmed vertex is replaced with the
// Bezier `P1 -> staging -> P2` (staging itself as the control point).
//
// **Why a fillet and not a single spline through all three points.** A
// spline blending the approach's own tangent into the interior knot was the
// first build of this file. It measurably cusped: this errand's two legs
// are never close to even (the approach runs 41-417pt, the descent is
// always ~30pt), and ANY single shared tangent at the knot — uniform
// Catmull-Rom's `(target-from)/2`, or a centripetal-weighted version of it —
// overshoots on the short side for SOME approach direction, because the
// long leg's direction can point almost anywhere relative to the descent's
// (always straight down). Measured: a 417pt diagonal approach produced a
// genuine sub-1° corner a fraction of a point from touchdown — not a
// resampling artifact, an actual self-crossing loop (row M3 carries the
// swept figures for both the uniform and the centripetal attempt).
//
// A quadratic Bezier between two NON-COLLINEAR points can never cusp or
// self-intersect — that is a property of the curve family, not a tuned
// parameter — which is what makes the fillet robust across every direction
// the bee can approach from, including from below the target, where §28.4's
// own geometry already demands a near-U-turn over the top of the cell.
// Both joins are exact by construction and need no reconciliation: the
// fillet's tangent at `P1` is along `staging - P1` (same direction as the
// leg it was trimmed from) and at `P2` is along `P2 - staging` (same
// direction as the descent) — the fillet is a smooth continuation of each
// straight leg's OWN direction, not a blend of the two.
export const FILLET_LEG_FRACTION = 0.25;

const lerpPoint = (a, b, u) => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });

const quadraticBezierAt = (p0, control, p1, u) => {
  const w0 = (1 - u) * (1 - u);
  const w1 = 2 * (1 - u) * u;
  const w2 = u * u;
  return { x: w0 * p0.x + w1 * control.x + w2 * p1.x, y: w0 * p0.y + w1 * control.y + w2 * p1.y };
};

// R-LF-3 — the weave, a lateral offset perpendicular to the APPROACH leg
// only ("the descent carries no weave; a landing is a landing").
//
//   amplitude(u) = A * sin(pi*u)        zero at u=0 and u=1, by construction
//   offset(u)    = amplitude(u) * sin(2*pi*k*u)
//   A            = min(0.18 * legLength, 1.5 * bodyLength)
//   k            = 1.5
//
// `k = 1.5` rather than a whole number: a whole number of cycles returns the
// bee to the side he left from and draws a symmetric, decorative ribbon.
// Half a cycle extra means the last crossing carries him TOWARD the cell.
//
// `legLength` is the FULL approach chord (`from` -> `staging`), not the
// shorter, fillet-trimmed distance the weave is actually drawn over — R-LF-3
// ties amplitude to the errand's own scale, and the fillet is a construction
// detail of how the corner is smoothed, not a second leg with its own scale.
export const WEAVE_LEG_AMPLITUDE_FRACTION = 0.18;
export const WEAVE_BODY_AMPLITUDE_MULTIPLE = 1.5;
export const WEAVE_PERIODS = 1.5;

export const weaveAmplitudePx = (legLengthPx, bodyLengthPx) =>
  Math.min(WEAVE_LEG_AMPLITUDE_FRACTION * legLengthPx, WEAVE_BODY_AMPLITUDE_MULTIPLE * bodyLengthPx);

// `u <= 0 || u >= 1` is forced to exactly zero rather than trusting
// `Math.sin(Math.PI)` — which is ~1.22e-16, not 0 — to vanish on its own.
// The envelope must reach zero to FLOATING-POINT EXACTNESS at both ends, so
// that the weaved curve's first and last points are bit-identical to `from`
// and the fillet's own start point, with no reconciliation step.
export const weaveOffsetAt = (u, amplitudePx, sign = 1) => {
  if (u <= 0 || u >= 1) return 0;
  const envelope = Math.sin(Math.PI * u);
  return sign * amplitudePx * envelope * Math.sin(TAU * WEAVE_PERIODS * u);
};

// Perpendicular distance from `p` to the segment `a`-`b` — the sagitta
// R-LF-1's own bar is written against ("the largest chord deviation from the
// true curve stays under ¼pt at the tightest turn").
const segmentDeviation = (p, a, b) => {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;
  if (len2 < 1e-12) return distancePx(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2));
  return distancePx(p, { x: a.x + abx * t, y: a.y + aby * t });
};

// R-LF-1's load-bearing constraint, met directly rather than approximated:
// **the largest chord deviation from the true curve stays under a small
// fraction of a point at the tightest turn.** Bisecting on DEVIATION rather
// than on a fixed distance-per-sample is what makes that true EVERYWHERE —
// including inside the weave's own tail, where `buildAttitude`'s assumption
// that waypoint index tracks the driven value (see `composeSegmentEasing`,
// which every caller of this file already routes segment TIMING through by
// real length, not by index) needs the corner to have no vertex left in it
// at all, not merely a smaller one.
//
// A candidate half only clears the bound if BOTH its midpoint and its
// quarter-points do — the weave's own last excursion is an S inside a
// single half were bisection to stop at the midpoint alone, a straight
// probe there can land near-zero deviation by coincidence while the curve
// still swings away from the chord on either side of it.
//
// `MAX_CHORD_DEVIATION_PX` is well inside R-LF-1's own ¼pt ceiling: the
// tighter figure is what it actually takes, on this curve, to also clear
// acceptance test 1 (no interior angle under 150°) — a ¼pt-exactly bound
// measurably does not (row M2 in `check-bee-attitude` carries the swept
// figures). `MAX_ADAPTIVE_DEPTH` is a backstop against runaway recursion,
// not the mechanism; it is never reached at any leg length this app
// produces (row M2 asserts that too).
export const MAX_CHORD_DEVIATION_PX = 0.05;
const MAX_ADAPTIVE_DEPTH = 24;

export const adaptiveCurveSamples = (curveAt, bound = MAX_CHORD_DEVIATION_PX, maxDepth = MAX_ADAPTIVE_DEPTH) => {
  const p0 = curveAt(0);
  const p1 = curveAt(1);
  const out = [p0];
  const recurse = (u0, u1, pa, pb, depth) => {
    const worstDeviation = [0.25, 0.5, 0.75]
      .map((f) => segmentDeviation(curveAt(u0 + (u1 - u0) * f), pa, pb))
      .reduce((a, b) => Math.max(a, b), 0);
    if (worstDeviation <= bound || depth <= 0) {
      out.push(pb);
      return;
    }
    const uMid = (u0 + u1) / 2;
    const pMid = curveAt(uMid);
    recurse(u0, uMid, pa, pMid, depth - 1);
    recurse(uMid, u1, pMid, pb, depth - 1);
  };
  recurse(0, 1, p0, p1, maxDepth);
  return out;
};

/**
 * The curve through `from` -> `staging` -> `target`: a weaved approach, a
 * quadratic-Bezier fillet rounding the corner at `staging`, and a straight
 * descent — each piece sampled adaptively off its own continuous
 * parametrisation. Exported so `check-bee-attitude` can sample it directly
 * rather than reimplementing it (R81).
 *
 * `descentPoints` carries the fillet AND the trimmed straight drop as one
 * sequence — `buildPollinationPlan` treats "the descent" as everything from
 * the corner-rounding point onward, which is what keeps this file's shape
 * (exactly two legs in and out of here) unchanged from before the fillet
 * existed.
 *
 * The weave rides perpendicular to the STRAIGHT chord `from`->`staging` —
 * the same fixed frame the pre-Living-Flight polyline flew — rather than a
 * frame that rotates with the leg's own direction; irrelevant here since the
 * approach itself is still a straight chord, but named so a future curved
 * approach inherits the same choice deliberately, not by accident.
 *
 * `weaveSign` alternates the first excursion's direction — see the call
 * site's comment in `FlyingBee.js` for why it is keyed off the pollination
 * tap, not `Math.random()`: this file stays dependency-free and pure, and a
 * gate can only sample a pure function.
 */
export const buildFlightCurve = ({ from, staging, target, bodyLengthPx, weaveSign = 1 }) => {
  const dx = staging.x - from.x;
  const dy = staging.y - from.y;
  const chordLenPx = Math.hypot(dx, dy);
  const nx = chordLenPx > 1e-6 ? -dy / chordLenPx : 0;
  const ny = chordLenPx > 1e-6 ? dx / chordLenPx : 0;
  const amplitudePx = weaveAmplitudePx(chordLenPx, bodyLengthPx);

  const descentChordPx = distancePx(staging, target);
  const filletRadiusPx = FILLET_LEG_FRACTION * Math.min(chordLenPx, descentChordPx);
  const approachEnd = chordLenPx > 1e-6
    ? lerpPoint(staging, from, filletRadiusPx / chordLenPx)
    : { ...from };
  const descentStart = descentChordPx > 1e-6
    ? lerpPoint(staging, target, filletRadiusPx / descentChordPx)
    : { ...target };

  const approachCurveAt = (u) => {
    const base = lerpPoint(from, approachEnd, u);
    const off = weaveOffsetAt(u, amplitudePx, weaveSign);
    return { x: base.x + nx * off, y: base.y + ny * off };
  };
  const filletCurveAt = (u) => quadraticBezierAt(approachEnd, staging, descentStart, u);
  const straightDescentAt = (u) => lerpPoint(descentStart, target, u);

  const approachPoints = adaptiveCurveSamples(approachCurveAt);
  const filletPoints = adaptiveCurveSamples(filletCurveAt);
  const straightDescentPoints = adaptiveCurveSamples(straightDescentAt);
  // `filletPoints`'s last point and `straightDescentPoints`'s first are both
  // exactly `descentStart` — dropped here so the waypoint isn't duplicated.
  return {
    approachPoints,
    descentPoints: [...filletPoints, ...straightDescentPoints.slice(1)],
  };
};

/**
 * Build the visit: cruise position -> staging point -> the cell.
 *
 * Every coordinate here is in the FLIGHT'S OWN BOX, in the same corner-space
 * the cruise track already flies in. §28.2, ratified: **a flight's target is
 * MEASURED in the flight's own box; it is never COMPUTED in the target's.**
 * The caller converts once, from window coordinates, and no pixel constant
 * crosses between `HoneycombGrid` and `FlyingBee`.
 *
 * @param from      live bee position, px, corner-space (`posRef`) — §28.4
 *                  waypoint 0 is where he already is, so the break costs no
 *                  teleport
 * @param target    the cell centre, px, already corrected to corner-space by
 *                  the caller (§28.3: a coordinate is not a position until
 *                  you say what it is the position OF)
 * @param ringStep  one lattice step, px. Travels WITH the target because it
 *                  is a measured property of the comb; `FlyingBee` must not
 *                  know `cellSize`. The apothem the staging offset is bounded
 *                  by is half of it, so nothing new has to cross the boundary
 *                  for C′ — the bound is expressible in what already came.
 * @param bodyLengthPx  the DRAWN character's own length, px. Travels with the
 *                  bee for the same reason `ringStep` travels with the
 *                  target: each box owns its own measurements (§28.2).
 * @param width/height  the flight container, px
 * @param approachSpeedPxS  cruise speed x APPROACH_SPEED_RATIO
 * R-LF-2.1 — this builder takes NO easings. It used to take two, one for the
 * launch and one for the settle, and a caller that can hand in a curve is a
 * caller that can hand in a curve for one SEGMENT of a leg — which is how the
 * lunge got here (see `buildSpeedProfile`). The shape of the flight is now a
 * property of the flight, derived from `approachSpeedPxS` and the arcs, and
 * there is no spelling of this call that can put a speed change anywhere the
 * profile did not put one.
 * @param weaveSign  R-LF-3 — which side of the chord the weave's first
 *                  excursion swings toward; the caller alternates it per tap
 *                  so consecutive flights never draw the same figure.
 */
export const buildPollinationPlan = ({
  from,
  target,
  ringStep,
  bodyLengthPx,
  width,
  height,
  approachSpeedPxS,
  weaveSign = 1,
}) => {
  // §28.4 waypoint 1: DIRECTLY ABOVE the cell centre, by the bee's own length
  // (C′ — see `stagingOffsetFor`). A bee approaching from below sweeps up and
  // over it, so the final leg is always a descent whatever direction he came
  // from — which is what makes the landing read as a landing rather than as
  // an arrival from the side. And because the offset is inside the target's
  // own hexagon, the one moment he is stationary is the moment he is hanging
  // over the face the user tapped.
  const staging = { x: target.x, y: target.y - stagingOffsetFor({ bodyLengthPx, ringStep }) };

  // R-LF-1 — one continuous curve through from/staging/target, each leg
  // resampled by its own arc length so the position track and the timing
  // below stay in step (see `buildFlightCurve`).
  const { approachPoints, descentPoints } = buildFlightCurve({ from, staging, target, bodyLengthPx, weaveSign });

  const approachLegs = approachPoints.slice(1).map((p, i) => distancePx(approachPoints[i], p));
  const descentLegs = descentPoints.slice(1).map((p, i) => distancePx(descentPoints[i], p));
  const approachLen = approachLegs.reduce((a, b) => a + b, 0);
  const descentLen = descentLegs.reduce((a, b) => a + b, 0);

  // §28.5's formula, still the only place `distance / speed` is spelled: the
  // STRAIGHT chord `from`->`staging` over R-LF-4's ratified speed. What that
  // yields is not the flight's approach DURATION any more, it is the approach
  // SPEED — the real, weaved ground divided by it. R-LF-2.1: the ratified
  // quantity is the speed, and the duration is what follows from it.
  const flatApproachMs = approachDurationMs(distancePx(from, staging), approachSpeedPxS);
  const cruisePxS = flatApproachMs > 0 ? (approachLen / flatApproachMs) * 1000 : 0;

  // R-LF-2.1 — ONE continuous speed function over cumulative arc: a linear
  // ramp off rest, a constant cruise, and a monotone decay to exactly zero at
  // the cell. Every duration and every easing below is read off it; nothing
  // in this builder picks a curve any more.
  const profile = buildSpeedProfile({ approachArcPx: approachLen, descentArcPx: descentLen, cruisePxS });
  const { approachMs, descentMs, durationMs } = profile;
  const split = durationMs > 0 ? approachMs / durationMs : 0;

  // Each segment's duration is the time the profile takes to cover ITS OWN
  // ARC, and its easing is the profile's arc-vs-time curve over that same
  // window, renormalised onto [0,1] — which is exactly what
  // `composeSegmentEasing` needs, because a segment of the polyline is a
  // straight lerp, so "fraction of this segment's arc covered" IS "fraction
  // of this segment's index span". Composed, the two reproduce v(t) exactly,
  // at every instant, for any sampling density the adaptive curve produces —
  // including the straight drop, which is a single segment and would
  // otherwise be flown at one constant speed and stopped dead. (M11.)
  const segmentArcs = [...approachLegs, ...descentLegs];
  const cumulative = [0];
  for (let i = 0; i < segmentArcs.length; i += 1) cumulative.push(cumulative[i] + segmentArcs[i]);
  const boundaryMs = cumulative.map((s) => profile.msAtArc(s));
  const durations = segmentArcs.map((_, i) => Math.max(0, boundaryMs[i + 1] - boundaryMs[i]));
  const easings = segmentArcs.map((arcPx, i) => {
    if (arcPx <= 0 || durations[i] <= 0) return (w) => w;
    const t0 = boundaryMs[i];
    const d = durations[i];
    const s0 = cumulative[i];
    return (w) => Math.min(1, Math.max(0, (profile.arcAtMs(t0 + w * d) - s0) / arcPx));
  });

  // `descentPoints[0]` is `staging`, already the last point of
  // `approachPoints` — dropped here so the waypoint isn't duplicated.
  const rawPath = [...approachPoints, ...descentPoints.slice(1)];
  const path = rawPath.map((p) => ({ x: p.x / width, y: p.y / height }));
  return {
    kind: 'visit',
    path,
    inputRange: path.map((_, i) => i / (path.length - 1)),
    easing: composeSegmentEasing(durations, easings),
    durationMs,
    approachMs,
    descentMs,
    // The path no longer has a fixed length (R-LF-1's curve is resampled
    // adaptively, not to a fixed 3-waypoint shape), so a reader that needs to
    // measure "the descent" in `path` — a gate, or a future caller — has no
    // index to assume. This is the one it can read instead:
    // `path.slice(descentStartIndex)` is the whole descent, fillet included.
    //
    // **It was called `stagingIndex` and the name was false by construction**
    // (Lumen, 2026-08-29, Finding 3). `path[descentStartIndex]` is
    // `approachEnd` — the fillet's trim point, `FILLET_LEG_FRACTION x
    // min(chord, descentChord)` short of `staging` (7.5167pt at the shipped
    // pair) — and it can never be `staging`, because the trim IS the fillet.
    // Nothing read it wrongly; a name that claims what the mechanism
    // guarantees false is a trap regardless. `plan.staging` already carries
    // the point for anyone who wants it.
    descentStartIndex: approachPoints.length - 1,
    staging: { x: staging.x / width, y: staging.y / height },
    split,
    // R-LF-2.1 — the profile itself, so a caller or a gate reads the speed
    // the flight is actually flown at rather than re-deriving it from the
    // path. `speedAtMs(plan.profile, t)` is acceptance test 2's currency.
    profile,
    landing: target,
    // §28 has always specified a honey trail on the approach, and it stopped
    // rendering the day 52c5d5c made the trail a property of the BEAT
    // (`FlyingBee`'s `if (plan && !plan.trail) return`). That commit gave the
    // sortie plan `trail: true` and left this builder alone, so from then on
    // the ONE plan that flies over open ground was the one plan that declared
    // nothing — `undefined`, which reads as "no trail" and looks exactly like
    // a deliberate `false`. It was invisible for as long as it was, because a
    // missing field cannot be grepped for; §28 was never on a screen between
    // that commit and the acceptance capture. First observed 2026-08-25 in the
    // errand clip: not one particle behind him across the whole approach.
    trail: true,
  };
};

/**
 * Build the return: wherever he is now -> `PATH[0]`, at cruise speed.
 *
 * §28.4 — `PATH[0] === PATH[4]`, so when this finishes `t` restarts at 0 and
 * `Animated.loop` resumes with ZERO discontinuity. That is free, and it is the
 * only place a return can end without a seam.
 *
 * §28.9 — this is also the whole of "abort". The flight aborts rather than
 * re-aims, and aborting IS skipping to this leg from the live position: no
 * new mechanism, no pollen (he never landed), one state change the beat was
 * already built out of.
 */
export const buildReturnPlan = ({ from, home, width, height, cruiseSpeedPxS: speed, easing }) => {
  const durationMs = Math.max(1, (distancePx(from, home) / speed) * 1000);
  const path = [from, home].map((p) => ({ x: p.x / width, y: p.y / height }));
  return {
    kind: 'return',
    path,
    inputRange: [0, 1],
    easing,
    durationMs,
  };
};
