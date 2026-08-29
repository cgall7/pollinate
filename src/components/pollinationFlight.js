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

// R-LF-10 (Living Flight §9), Colin's 2026-08-29 ruling ("let's implement
// your recommendation on time to landing"): the approach SATURATES. An errand
// is a commute, not a longer forage — past this ceiling, distance buys SPEED,
// not time. The approach is the only distance-proportional term in the
// flight, so this is the whole lever: the cruise rises to cover the chord in
// the ceiling, and everything downstream is already derived from the cruise
// (`R` grows with it, so the turn keeps its rate bound by construction; the
// weave keeps its Hz — a faster walk still walks in rhythm; the descent
// keeps its shape, which R-LF-2.1 ruled untouchable).
//
// The value: the ratified lattice's own worst approach is 1105.8ms
// (320x568, seat 2->5 — the smallest box flies the slowest cruise over the
// same comb). The ceiling clears it STRICTLY, with the same ~8% order of
// headroom `LAUNCH_MS` carries over its own bound, so on the comb this
// constant does not exist: all 336 seat-to-seat plans are bit-identical with
// and without it (measured, max |delta| 0.0e+0 over path and duration). The
// gate holds that ordering — the ceiling above the lattice's measured worst —
// so a cruise retune that pushes a hop's approach past the ceiling reds
// rather than silently re-timing ratified flights. What it buys: the far
// corner of a Pro Max lands in 2112.7ms instead of 4429.3, and the worst
// wait on any box is the SE's 2749.5ms — descent-dominated, which no
// approach lever can or should compress.
export const APPROACH_MS_CEILING = 1200;

// §28.5 — the descent is a GESTURE, not a traverse, so it is specified as a
// duration rather than derived from a speed.
//
// R-LF-4, Colin's 2026-08-29 ruling: 160 -> 260ms. The old justification —
// "he settles onto the face at the pace he was already flying" — answered a
// cruise that no longer exists (see `APPROACH_SPEED_RATIO`); the new one is
// what a landing actually is, a DECELERATION.
//
// **R-LF-2.1 changed what this constant IS, and the value is the one thing
// that did not move** (Lumen, 2026-08-29, ratifying `c320f99`). It is now a
// FLOOR — `descentMs = max(DESCENT_MS, 2D/v)`, resolved in
// `buildSpeedProfile` — not the descent's duration. Three consequences the
// next person to retune it has to be told, because each of them was written
// here as fact and is now false:
//
//  * **The descent has no fixed duration.** The floor is exceeded on 214 of
//    the 336 plans the lattice produces (by 1.12-34.00ms on 393x852 and up,
//    up to 163ms on SE-class boxes). "Fixing the duration fixes the speed"
//    described a traverse; a decelerating gesture over a variable arc has
//    neither fixed.
//  * **Its distance is NOT the staging offset.** `descentPoints` carries the
//    fillet, so the real descent arc is 35.12pt against the 30.07pt staging
//    chord. The old derivation here — 30.07pt in 260ms = 115.6 px/s, 0.52x
//    the approach — was arithmetic on the chord, and it is what made the
//    ruling's own linear ramp look like an 11% step when it is 0.16%.
//  * **It is not flown on `Easing.out(cubic)`.** That curve was retired by
//    R-LF-2.1, 700 lines below this sentence. The descent is `v -> 0` on the
//    derived exponent `p = v*T/D - 1`, starting at exactly the cruise.
//
// **Named coupling, chosen and not inherited (R-LF-4):** `PRESENCE_FADE_MS`
// in `FlyingBee.js` is deliberately set equal to this constant, and so is the
// interval `start()` re-measures a not-yet-mounted anchor on. Both are a
// PACING rhyme with the descent and not a synchronisation — which is what
// lets them survive the floor: neither has to end when the descent does, and
// the descent no longer ends at a time anything else could be pinned to.
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
// the ground a cruise would in the same window.
//
// Two figures that are true of the LAUNCH TERM and not of the built flight,
// corrected here rather than carried (Lumen, 2026-08-29, measured old-vs-new
// across all 336 plans):
//
//  * The flight does not grow by 60ms. It grows by exactly `LAUNCH_MS / 2` on
//    the 122 plans where the descent floor holds, and by 60-223.1ms across the
//    lattice (60-94ms on 393x852 and up), because the descent floor in this
//    same commit extends the rest.
//  * Ground speed at every instant is NOT <= today's, and it is the ruling
//    working rather than a regression: at the corner the old profile braked
//    to 135.1 px/s where this one holds 270.6 — exactly 2.0x, and removing
//    that brake is what R-LF-2.1 IS. What is true, and is the claim worth
//    keeping, is that the flight's PEAK falls: 337.0 -> 270.6 px/s on the
//    neighbour hop, because the peak is now the cruise by construction.
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

// R-LF-7 (Living Flight) — the corner over `staging` used to be a quadratic
// Bezier FILLET: `FILLET_LEG_FRACTION x min(chord, descentChord)` trimmed off
// each straight leg, the trimmed vertex replaced by a Bezier with `staging`
// as its control point. It ROUNDED the corner; it did not remove it. D6
// measured 17 of the 42 hops still arriving at a junction the eye reads as a
// corner, and D7 named the reason: the fillet's SIZE is derived from the legs
// rather than from what the turn costs, so the obtuse common case gets the
// smallest rounding and needs the largest.
//
// The replacement is a TURN, not a rounding: a circle of radius `R` tangent
// to the descent line at `staging`, entered on its own tangent from `from`.
// Both joins are tangential BY CONSTRUCTION at every approach direction, so
// there is no junction angle left to measure on any of the 42 hops — not a
// smaller one, none.
//
// Three quantities carry it and not one of them is new:
//
//   phi     `staging`'s bearing off vertical. §28.4's DISTANCE is untouched
//           (C', R88) — the staging offset is a RADIUS, so the bound it
//           produced is omnidirectional and the point is inside the face the
//           user tapped at every bearing. Only the direction is chosen now,
//           and it is bounded at +-30 deg: R-LF-7's own sweep found the
//           forced-loop class (a 294.6 deg loop-the-loop to reach the seat
//           next door, 8 of 168 plans) disappears there and nowhere earlier.
//   sigma   which side of the descent line the circle's centre sits on.
//   R       `max(bodyLength, cruise / (MAX_FRAME_SPEED_STEP_FRACTION x 60))`.
//           R-LF-2.1 bounded the MAGNITUDE of the per-frame velocity change
//           and left the vector free. Applied to the whole velocity the same
//           ratified 0.15 is an angular rate — `|dv| = 2v sin(w dt / 2) ~
//           v w dt <= 0.15 v` gives `w <= 0.15 rad/frame` = 9 rad/s, so
//           `R >= v / 9`. Not a new constant; the same constant, converted
//           into the frame it was missing. The bee's own length is the FLOOR
//           and the frame bound is the mechanism on the two biggest boxes.
export const STAGING_BEARING_CAP_RAD = Math.PI / 6;
export const FRAMES_PER_SECOND = 60;
export const MAX_TURN_RATE_RAD_S = MAX_FRAME_SPEED_STEP_FRACTION * FRAMES_PER_SECOND;

export const turnRadiusPx = ({ bodyLengthPx, cruisePxS }) =>
  Math.max(bodyLengthPx, cruisePxS > 0 ? cruisePxS / MAX_TURN_RATE_RAD_S : 0);

const TURN_EPSILON = 1e-9;

// The radius/cruise fixed point below. The pass ceiling is a backstop, not
// the mechanism: the iteration is a contraction and it runs in the SAFE
// direction — growing `R` shortens the tangent, which shortens the chord,
// which lowers the cycle count, which lowers the elongation and so the
// cruise, which asks for a smaller `R` next time. The gate asserts it
// converges in far fewer passes than this rather than trusting the argument.
//
// **THERE IS NO CONVERGENCE TOLERANCE, AND THAT IS A CORRECTION.** This loop
// used to exit on `|next - radiusPx| <= 0.25pt`, which is what you write for
// a quantity you are ESTIMATING. `R` is not an estimate: it is a FLOOR.
// `omega = v / R`, so a radius too small breaches R-LF-2.1's ratified rate
// and a radius too large does not — the error is one-sided in its
// consequences, so the exit has to be one-sided too. A two-sided tolerance
// let `R` settle up to 0.25pt BELOW the requirement, which at R ~ 30pt is
// 0.83% of rate: measured 8.6658 deg/frame against the ruled 8.5944, with
// the shortfall (0.249812pt) sitting just inside the tolerance that allowed
// it. Invisible on the seat-to-seat lattice, where the frame term never
// binds at all; found by sweeping `from` over the whole container, which is
// what `FlyingBee`'s absoluteFill actually permits.
const TURN_RADIUS_MAX_PASSES = 24;

const lerpPoint = (a, b, u) => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });

// `staging` at bearing `phi` off vertical, positive toward +x. The DISTANCE
// is `stagingOffsetFor`'s and is not this function's to choose.
export const stagingPointFor = (target, offsetPx, phi) => ({
  x: target.x + offsetPx * Math.sin(phi),
  y: target.y - offsetPx * Math.cos(phi),
});

// The turn for ONE `(phi, sigma)`. `null` when `from` is inside the circle —
// no tangent exists there, and REJECTING the candidate is how acceptance 5's
// "no forced loop" holds by construction rather than by a bound on the sweep.
export const solveTurn = ({ from, target, offsetPx, phi, sigma, radiusPx }) => {
  if (!(radiusPx > 0)) return null;
  const staging = stagingPointFor(target, offsetPx, phi);
  // The descent runs `staging` -> `target`, so its unit heading is fixed by
  // `phi` alone, and is exactly `phi` off vertical. That is what preserves
  // §28.4's load-bearing half — "the final leg is always a descent whatever
  // direction he came from" — under the cap rather than under verticality:
  // the vertical component of the settle is never below cos 30 = 0.866.
  const ud = { x: -Math.sin(phi), y: Math.cos(phi) };
  // One radius off the descent line at `staging`, on side sigma. Tangent
  // there by construction, so the bee LEAVES the arc heading exactly along
  // the descent line — the second join needs no reconciliation either.
  const centre = {
    x: staging.x - sigma * radiusPx * ud.y,
    y: staging.y + sigma * radiusPx * ud.x,
  };
  const fx = from.x - centre.x;
  const fy = from.y - centre.y;
  const d = Math.hypot(fx, fy);
  if (!(d > radiusPx + TURN_EPSILON)) return null;
  const thetaF = Math.atan2(fy, fx);
  const alpha = Math.acos(Math.min(1, radiusPx / d));
  // Two tangent points. Exactly one is entered in the direction the circle is
  // travelled in, and which one is a question about `sigma` rather than a
  // preference: rotating about `centre` with sense `sigma` gives the heading
  // `sigma * perpCcw(p - centre)`, and the approach must arrive along it.
  let theta0 = null;
  let tangent = null;
  for (const branch of [1, -1]) {
    const th = thetaF + branch * alpha;
    const p = { x: centre.x + radiusPx * Math.cos(th), y: centre.y + radiusPx * Math.sin(th) };
    const hx = (sigma * -(p.y - centre.y)) / radiusPx;
    const hy = (sigma * (p.x - centre.x)) / radiusPx;
    if (hx * (p.x - from.x) + hy * (p.y - from.y) >= 0) {
      theta0 = th;
      tangent = p;
      break;
    }
  }
  if (tangent === null) return null;
  const thetaS = Math.atan2(staging.y - centre.y, staging.x - centre.x);
  let sweep = ((((sigma > 0 ? thetaS - theta0 : theta0 - thetaS) % TAU) + TAU) % TAU);
  // A sweep of 2*pi is a sweep of zero that lost a bit on the way round.
  if (sweep > TAU - TURN_EPSILON) sweep = 0;
  return { phi, sigma, radiusPx, staging, centre, tangent, theta0, sweep };
};

// R-LF-9.1 — THE MODULE'S ONE DEFINITION OF "THIS SWEEP IS ZERO".
//
// It was already here, used by `chooseTurn` to decide when two sweeps are the
// SAME. Two other sites asked the same question — is this sweep zero? — and
// answered it with a bare `> 0` on a computed float. A module that has decided
// how small is zero, and then lets a call site decide again, has two
// definitions of zero and only one of them is written down.
//
// What the second definition cost: `solveTurn` returns sweeps of ~1e-15 rad on
// forty of the lattice's plans (they are not the 32 that reach EXACTLY zero —
// the two populations are disjoint). Not zero, so they took the arc branch; an
// arc of 1e-15 rad over R = 30.07pt is ~3e-14pt long, so `adaptiveCurveSamples`
// emitted BIT-IDENTICAL points and a coincident waypoint survived `slice(1)`
// into `path`. A zero-length segment has no direction, and `pitchFor` answered
// it with horizontal — so the bee rolled level for one frame and slammed back
// to full bank, on the run-in to the landing. See `beeAttitude`'s own half of
// this fix; each closes it alone, and both ship.
//
// The threshold is not tuned. Between the largest degenerate sweep (4.441e-15
// rad) and the smallest real one (0.6971 rad) there is nothing at all, so 1e-6
// sits in the middle of a fourteen-order void: no real plan is reclassified,
// and the 296 that keep their arc are bit-identical.
export const TURN_SWEEP_TIE_RAD = 1e-6;

export const turnIsSwept = (turn) => !!turn && turn.sweep > TURN_SWEEP_TIE_RAD;

// A point on the arc, `u` in [0,1] from the tangent point to `staging`.
export const turnPointAt = (turn, u) => {
  if (!turnIsSwept(turn)) return { ...turn.tangent };
  const th = turn.theta0 + turn.sigma * turn.sweep * u;
  return { x: turn.centre.x + turn.radiusPx * Math.cos(th), y: turn.centre.y + turn.radiusPx * Math.sin(th) };
};

// R-LF-7 — `(phi, sigma)` is the pair MINIMISING the sweep, and the candidate
// set below is CLOSED rather than a search. It is closed for a reason.
//
// For a fixed `sigma` the sweep is monotone in `phi`: the descent heading is
// exactly `pi/2 + phi`, so rotating the bearing removes turn one-for-one,
// while `staging`'s own displacement can only damp that — it moves `offset`
// per radian against an approach chord that is never shorter than
// `ringStep - offset` = 46.14pt, so `d(psi)/d(phi) <= 30.07/46.14 < 1` over
// the whole lattice. A monotone function on `[-cap, cap]` takes its minimum
// at an end of the interval or at its zero, and its zero is closed-form: the
// bearing that puts the descent line THROUGH `from`, where the hop has no
// turn at all. Hence exactly three bearings:
//
//   ALIGN   `atan2(from.x - target.x, target.y - from.y)`, when inside the cap
//   +-cap   the ruled ceiling, which is where the minimum sits on every hop
//           that turns at all
//   0       vertical — today's staging is always in the running, so the
//           degenerate from-directly-above hop reaches it exactly
//
// The gate re-runs this against a dense sweep of `phi` and asserts the
// candidate set attains the global minimum (acceptance 4). The bound above is
// an argument; the sweep is the evidence.
export const turnCandidateBearings = ({ from, target, capRad = STAGING_BEARING_CAP_RAD }) => {
  const align = Math.atan2(from.x - target.x, target.y - from.y);
  const out = [capRad, -capRad, 0];
  if (Number.isFinite(align) && Math.abs(align) < capRad) out.unshift(align);
  return out;
};

/**
 * @param inboardSign  R-LF-7.1 — +1 when "away from the nearest screen edge"
 *                     is +x, -1 when it is -x, 0 when the caller has no box.
 *                     A TIE-BREAK and only a tie-break: it never buys a
 *                     larger sweep, because the sweep is the ruled quantity
 *                     and the sign is only free where the sweep is silent.
 */
export const chooseTurn = ({
  from, target, offsetPx, radiusPx, capRad = STAGING_BEARING_CAP_RAD, inboardSign = 0,
}) => {
  let best = null;
  for (const phi of turnCandidateBearings({ from, target, capRad })) {
    for (const sigma of [1, -1]) {
      const candidate = solveTurn({ from, target, offsetPx, phi, sigma, radiusPx });
      if (!candidate) continue;
      if (best === null || candidate.sweep < best.sweep - TURN_SWEEP_TIE_RAD) {
        best = candidate;
      } else if (
        inboardSign !== 0
        && Math.abs(candidate.sweep - best.sweep) <= TURN_SWEEP_TIE_RAD
        && candidate.phi * inboardSign > best.phi * inboardSign
      ) {
        best = candidate;
      }
    }
  }
  return best;
};

// R-LF-3 — the weave, a lateral offset perpendicular to the APPROACH leg
// only ("the descent carries no weave; a landing is a landing").
//
//   amplitude(u) = A * sin(pi*u)^2      zero at u=0 and u=1, by construction
//   offset(u)    = amplitude(u) * sin(2*pi*c*u)
//   A            = min(0.18 * legLength, 1.5 * bodyLength)
//   c            = WEAVE_RATE_HZ * approachSeconds       (R-LF-8, no rounding)
//
// R-LF-8 — `WEAVE_PERIODS` was **1.5 cycles per approach leg, whatever the
// leg**, so the undulation RATE was decided by which seat you tapped: 5.8717
// Hz on the shortest hop against 1.1746 Hz on the longest, 4.9989x across the
// declared containers, 3.31x on 393x852 alone. Same character, same errand,
// four different wing rhythms — and the fast end is not a snake, it is a buzz.
// The RATE is the ratified quantity now and the cycle count is its
// consequence: a short errand gets one lean (0.3001 cycles), a long one gets
// the snake (1.5000). `WEAVE_RATE_HZ` is the rate the shipped build flies on
// the longest leg OF THE SEAT-TO-SEAT LATTICE, and on that lattice `c <= 1.5`
// with equality there, so within it this can only ever REMOVE undulation.
//
// **THAT IS A PROPERTY OF THE LATTICE, NOT AN IDENTITY, and an earlier draft
// of this comment claimed the second.** `from` is the bee's LIVE POSITION
// (`FlyingBee.js`, `posRef.current`), not a seat, so the approach is bounded
// by the container and not by the comb: swept over the whole window the chord
// reaches 843pt against the lattice's 166, and `c` reaches 4.27 — R-LF-8 can
// ADD undulation on a long first errand, ~2.8x the count the fixed 1.5 ever
// produced. Nothing about R-LF-3.1 depends on this; the envelope closes the
// join at EVERY `c`, which is the whole point of squaring it. But the
// reassurance "it can only remove" was scoped to a probe and written as
// though it were scoped to the function.
//
// `k = 1.5`'s justification retires with the constant. Its stated reason —
// "half a cycle extra means the last crossing carries him TOWARD the cell" —
// was the weave doing the arrival's job, and R-LF-7 gives the arrival its own
// geometry.
//
// **The SQUARE on the envelope is a repair, and it is R-LF-7's.** With `k`
// fixed at 1.5 — a multiple of 0.5 — the carrier vanished at `u = 1` on its
// own, so `sin(pi u)` only ever had to close a VALUE. Freeing `c` breaks
// that:
//
//   offset'(u) = A [ pi cos(pi u) sin(2 pi c u) + 2 pi c sin(pi u) cos(2 pi c u) ]
//   offset'(1) = -A pi sin(2 pi c)        zero iff c is a multiple of 0.5
//
// which is a lateral VELOCITY at the exact join R-LF-7's acceptance test 1
// asserts is tangential — up to 32.72 deg off the chord, on 330 of 336 plans,
// worst on the SHORTEST hops, which are the ones R-LF-8 exists to give one
// lean. §7's test 1 and test 7 are jointly unsatisfiable with a bare
// `sin(pi u)`: test 7 closes the envelope's VALUE and test 1 needs its
// VELOCITY. Squaring closes both, for any `c`, by the envelope ALONE:
//
//   env(u)  = sin(pi u)^2        env'(u) = pi sin(2 pi u)      env'(1) = 0
//
// Peak is unchanged (`sin^2(pi/2) = 1`), so R-LF-3's amplitude and its
// `min(0.18 leg, 1.5 body)` bound are untouched. The cost is the OUTER
// swings: -35.6% on the longest hop's two flanking excursions, -2.4% on the
// short one, and nothing at all on the centre excursion — concentrated
// exactly where the weave is richest and absent where R-LF-8 says the figure
// should be one lean.
//
// D8's tightness argument does not reopen, but the sentence has to name its
// AXIS and its PLAN, because the two run opposite ways (Lumen, 2026-08-29):
// the amplitude cost is worst on the LONGEST hop and the CURVATURE cost is
// worst on the SHORTEST, so the two figures are not the same plan. Measured
// in R-LF-7's own frame — the drawn span is `from` -> the tangent point,
// which is what acceptance 9 exists to re-report — the weave's minimum radius
// of curvature is 1.8201pt on `main@42a83c7` and 6.0080pt here: 3.3x LOOSER
// than what ships today, on the tightest plan each build has.
//
// And WHERE it is tightest moved. Under `k = 1.5` the minimum sat near
// u ~ 0.56, in the body of the figure. Here it sits AT THE JOIN, and its
// value is Lumen's closed form `R_join = L^2 / (2 pi^2 A |sin 2 pi c|)` —
// which diverges as `c` approaches a multiple of 0.5, reproducing the old
// build's straight join as its own limit. That is the strongest confirmation
// available that this envelope is the same object the ruling describes.
//
// `legLength` is the approach chord `from` -> the turn's tangent point, which
// is the leg the weave is drawn over and, since R-LF-7, the whole of the
// approach. (Under the fillet it was the FULL chord to `staging` rather than
// the shorter trimmed distance, because the trim was a construction detail of
// the corner rather than a leg. The tangent point is not a detail: it is
// where the flight stops going somewhere and starts arriving.)
export const WEAVE_LEG_AMPLITUDE_FRACTION = 0.18;
export const WEAVE_BODY_AMPLITUDE_MULTIPLE = 1.5;
export const WEAVE_RATE_HZ = 1.1746;

export const weaveAmplitudePx = (legLengthPx, bodyLengthPx) =>
  Math.min(WEAVE_LEG_AMPLITUDE_FRACTION * legLengthPx, WEAVE_BODY_AMPLITUDE_MULTIPLE * bodyLengthPx);

// R-LF-8 — the count is a consequence of the rate and the leg's own duration.
export const weaveCyclesFor = (approachMs) => (WEAVE_RATE_HZ * Math.max(0, approachMs)) / 1000;

// R-LF-3.1 — the exponent is a RULED constant, not a spelling, and it is
// named because the ruling is about its VALUE and not about the shape of the
// expression. Lumen, 2026-08-29: every `p > 1` closes the velocity, so `p = 2`
// is one of a continuum and a cheaper-looking one exists — but `env'' ~
// p(p-1)pi^2 sin^(p-2) cos^2` and `sin^(p-2) -> infinity` below 2, so under 2
// the corner is not removed, it is compressed into a WHIP (`p = 1.25` reaches
// a radius of 0.0046pt a millionth of the way from the join). Above 2 buys C2,
// which R-LF-7's own centrepiece does not have — a line joining a turn circle
// is a curvature step by construction. `p = 2` is the LEAST exponent with a
// finite second derivative at the join, and that is the whole argument.
//
// It is a named constant for a second reason, and this one is the gate's:
// `weaveSlopeAt` below is the derivative of this envelope, and a derivative
// written beside its own function is the classic second copy of a derivation.
// Sharing `p` is what keeps them from drifting — mutate this one token and
// BOTH move together, which is exactly the mutation §7's acceptance row 1
// names ("restore the `sin(pi u)` envelope"). A derivative that could not
// follow that mutation would make the row unfalsifiable.
export const WEAVE_ENVELOPE_EXPONENT = 2;

// `u <= 0 || u >= 1` is forced to exactly zero rather than trusting
// `Math.sin(Math.PI)` — which is ~1.22e-16, not 0 — to vanish on its own.
// The envelope must reach zero to FLOATING-POINT EXACTNESS at both ends, so
// that the weaved curve's first and last points are bit-identical to `from`
// and the turn's tangent point, with no reconciliation step.
export const weaveOffsetAt = (u, amplitudePx, cycles, sign = 1) => {
  if (u <= 0 || u >= 1) return 0;
  const envelope = Math.sin(Math.PI * u) ** WEAVE_ENVELOPE_EXPONENT;
  return sign * amplitudePx * envelope * Math.sin(TAU * cycles * u);
};

// R-LF-3.1 / §7 acceptance 1 — the weave's lateral slope `d(offset)/du`, in
// CLOSED FORM. The approach's terminal tangent is this and the chord; the
// junction angle the ruling forbids is `atan(slope(1) / chordLength)`.
//
// **It deliberately does NOT carry `weaveOffsetAt`'s endpoint guard**, and
// that is the whole reason this function exists rather than the gate
// differencing the value. The guard on the VALUE is load-bearing: the path's
// first and last points must be bit-identical to `from` and the tangent
// point. The slope has no such consumer, and a guarded slope would return
// exactly 0 at `u = 1` for EVERY exponent — including the `p = 1` the
// acceptance row must red on. A probe that cannot fail is not a probe.
//
// Which leaves the residual honest and non-zero: at `p = 2`,
// `env'(1) = p * sin(pi)^(p-1) * pi * cos(pi)` is the error in representing
// `pi` scaled by `A * sin(2 pi c)`, ~1e-14 degrees, peaking at `c = 0.25` and
// `0.75` where `|sin 2 pi c| = 1`. Five orders under the ruled `1e-9` bar and
// ten under the `32.71` degree defect — and, unlike an exact 0, it is a
// number that proves the row executed.
//
// Differencing is not an option AT THIS JOIN: `u = 1` is the domain edge, so
// only a one-sided difference exists and its floor is set by `h` rather than
// by the envelope (0.116 degrees at h = 1e-3). It still reds against 32.71,
// so a differenced row passes its own mutation test while having stopped
// measuring the property — Lumen, 2026-08-29. In the INTERIOR a difference is
// legitimate, and that is where the gate calibrates this function.
export const weaveSlopeAt = (u, amplitudePx, cycles, sign = 1) => {
  const p = WEAVE_ENVELOPE_EXPONENT;
  const s = Math.sin(Math.PI * u);
  const envelope = s ** p;
  const envelopeSlope = p * (s ** (p - 1)) * Math.PI * Math.cos(Math.PI * u);
  const carrier = Math.sin(TAU * cycles * u);
  const carrierSlope = TAU * cycles * Math.cos(TAU * cycles * u);
  return sign * amplitudePx * (envelopeSlope * carrier + envelope * carrierSlope);
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
 * The curve through `from` -> the turn -> `target`: a weaved straight
 * approach to the turn circle's tangent point `T`, the arc `T` -> `staging`,
 * and the straight drop `staging` -> `target` — each piece sampled adaptively
 * off its own continuous parametrisation. Exported so `check-bee-attitude`
 * can sample it directly rather than reimplementing it (R81).
 *
 * `descentPoints` carries the ARC AND the drop as one sequence.
 * `buildPollinationPlan` treats "the descent" as everything from the
 * corner-rounding point onward, and R-LF-7 does not redefine that — the arc
 * IS the corner-rounding. What moved is where it starts: the landing begins
 * when he stops going somewhere and starts arriving, and that is `T`.
 *
 * The weave rides perpendicular to the STRAIGHT chord `from`->`T` — the same
 * fixed frame the pre-Living-Flight polyline flew — rather than a frame that
 * rotates with the leg's own direction; irrelevant here since the approach
 * itself is still a straight chord, but named so a future curved approach
 * inherits the same choice deliberately, not by accident.
 *
 * `weaveSign` alternates the first excursion's direction — see the call
 * site's comment in `FlyingBee.js` for why it is keyed off the pollination
 * tap, not `Math.random()`: this file stays dependency-free and pure, and a
 * gate can only sample a pure function.
 *
 * @param cycles  R-LF-8's count for THIS leg. Passed in rather than derived
 *                here because it is a function of the approach's DURATION,
 *                which is a property of the plan and not of the curve.
 */
export const buildFlightCurve = ({
  from,
  target,
  offsetPx,
  radiusPx,
  cycles,
  bodyLengthPx,
  weaveSign = 1,
  capRad = STAGING_BEARING_CAP_RAD,
  inboardSign = 0,
}) => {
  const turn = chooseTurn({ from, target, offsetPx, radiusPx, capRad, inboardSign });
  // No candidate has a tangent only when `from` is inside every circle the
  // cap admits — which the gate asserts is unreachable over the lattice. If a
  // live position ever reaches it, the flight degenerates to the straight
  // vertical staging it had before R-LF-7 rather than to nothing.
  const staging = turn ? turn.staging : stagingPointFor(target, offsetPx, 0);
  const entry = turn ? turn.tangent : staging;

  const dx = entry.x - from.x;
  const dy = entry.y - from.y;
  const chordLenPx = Math.hypot(dx, dy);
  const nx = chordLenPx > 1e-6 ? -dy / chordLenPx : 0;
  const ny = chordLenPx > 1e-6 ? dx / chordLenPx : 0;
  const amplitudePx = weaveAmplitudePx(chordLenPx, bodyLengthPx);

  const approachCurveAt = (u) => {
    const base = lerpPoint(from, entry, u);
    const off = weaveOffsetAt(u, amplitudePx, cycles, weaveSign);
    return { x: base.x + nx * off, y: base.y + ny * off };
  };
  const arcCurveAt = (u) => turnPointAt(turn, u);
  const dropAt = (u) => lerpPoint(staging, target, u);

  const approachPoints = adaptiveCurveSamples(approachCurveAt);
  // A sweep of zero is not an arc, and sampling it would emit a run of
  // identical points for the segment arithmetic to divide by. `turnIsSwept`
  // rather than `> 0` — R-LF-9.1, and the note on TURN_SWEEP_TIE_RAD. This is
  // the same predicate `turnPointAt` uses, which matters more than either
  // spelling: if the two disagreed, the branch that says "swept" would sample
  // a curve that says "not swept" and emit N copies of the tangent point.
  const arcPoints = turnIsSwept(turn) ? adaptiveCurveSamples(arcCurveAt) : [{ ...entry }];
  const dropPoints = adaptiveCurveSamples(dropAt);
  // `arcPoints`'s last point and `dropPoints`'s first are both exactly
  // `staging` — dropped here so the waypoint isn't duplicated.
  return {
    turn,
    staging,
    approachChordPx: chordLenPx,
    amplitudePx,
    approachPoints,
    descentPoints: [...arcPoints, ...dropPoints.slice(1)],
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
  // §28.4 waypoint 1: `stagingOffsetFor` from the cell centre (C′), at a
  // bearing R-LF-7 now CHOOSES rather than fixes. §28.4's own justification
  // for verticality was "because the offset is inside the target's own
  // hexagon, THE ONE MOMENT HE IS STATIONARY is the moment he is hanging over
  // the face the user tapped" — and R-LF-2.1 removed every stop before the
  // cell, so there has been no stationary moment at `staging` since `d24315d`
  // merged. The conclusion was resting on a premise the same day's ruling
  // deleted. What survives is the DISTANCE, and it survives omnidirectionally
  // because it is a radius: 30.0667pt against the target hexagon's own
  // apothem of 38.1051pt, in every direction (R88).
  const offsetPx = stagingOffsetFor({ bodyLengthPx, ringStep });

  // R-LF-7.1 — every free sign in the flight resolves AWAY from the nearest
  // screen edge. `inboardSign` is +1 when inboard is +x, i.e. when the target
  // sits in the left half of the flight container. It reaches `chooseTurn` as
  // a tie-break and nothing more: the sweep is the ruled quantity, and the
  // sign is only free where the sweep is silent.
  const inboardSign = width > 0 ? (target.x * 2 < width ? 1 : -1) : 0;

  // R-LF-7 — `R` is CIRCULAR with the cruise: the tangent length sets the
  // approach chord, the chord sets the cruise, the cruise sets `R`, and `R`
  // moves the tangent point. Iterated to a fixed point rather than solved in
  // closed form — the constraint is the equality, not the method — and the
  // loop below is the only place in this file that iterates, so it carries
  // its own convergence bound rather than trusting one.
  //
  // R-LF-8's cycle count rides the same loop for the same reason: it is
  // `WEAVE_RATE_HZ x approachSeconds`, and the approach's duration is a
  // function of the chord, which is a function of `R`.
  let radiusPx = bodyLengthPx;
  let curve = null;
  let flatApproachMs = 0;
  let cruisePxS = 0;
  let passes = 0;
  let cycles = 0;
  for (let pass = 0; pass < TURN_RADIUS_MAX_PASSES; pass += 1) {
    passes = pass + 1;
    const probe = chooseTurn({ from, target, offsetPx, radiusPx, inboardSign });
    const chordPx = distancePx(from, probe ? probe.tangent : stagingPointFor(target, offsetPx, 0));
    // §28.5's formula, still the only place `distance / speed` is spelled: the
    // STRAIGHT chord over R-LF-4's ratified speed. Its far end moved from
    // `staging` to the tangent point, because that is where the approach leg
    // now ends — and it has to move with it, or the weave's elongation would
    // be divided by a chord the bee does not fly and the flight would slow
    // down in proportion to how much turning it does.
    flatApproachMs = approachDurationMs(chordPx, approachSpeedPxS);
    // R-LF-10 — the saturation lives HERE, inside the fixed point, because
    // the cruise it raises is an input to `R` and the loop is what keeps the
    // two consistent. Everything below this line already treats the cruise as
    // the given and derives from it; nothing else changes.
    flatApproachMs = Math.min(flatApproachMs, APPROACH_MS_CEILING);
    // `buildSpeedProfile`'s approach duration, spelled here because R-LF-8
    // needs it BEFORE the curve exists. It is weave-independent by
    // construction: `A/v` collapses to the flat chord's own time, so this is
    // an identity with the profile below rather than a second estimate of it.
    const launchMs = Math.min(LAUNCH_MS, 2 * flatApproachMs);
    cycles = weaveCyclesFor(flatApproachMs + launchMs / 2);
    // R-LF-1 — one continuous curve through from/turn/target, each leg
    // resampled by its own arc length so the position track and the timing
    // below stay in step (see `buildFlightCurve`).
    curve = buildFlightCurve({
      from, target, offsetPx, radiusPx, cycles, bodyLengthPx, weaveSign, inboardSign,
    });
    const arcPx = pathLengthPx(curve.approachPoints, 1, 1);
    cruisePxS = flatApproachMs > 0 ? (arcPx / flatApproachMs) * 1000 : 0;
    const next = turnRadiusPx({ bodyLengthPx, cruisePxS });
    // Exit only when the radius in hand ALREADY satisfies the cruise it
    // produced. Never on a two-sided tolerance — see the note on
    // TURN_RADIUS_MAX_PASSES above.
    if (next <= radiusPx) break;
    radiusPx = next;
  }
  const { approachPoints, descentPoints, turn, staging } = curve;

  const approachLegs = approachPoints.slice(1).map((p, i) => distancePx(approachPoints[i], p));
  const descentLegs = descentPoints.slice(1).map((p, i) => distancePx(descentPoints[i], p));
  const approachLen = approachLegs.reduce((a, b) => a + b, 0);
  const descentLen = descentLegs.reduce((a, b) => a + b, 0);

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
    // `path.slice(descentStartIndex)` is the whole descent, arc included.
    //
    // **It was called `stagingIndex` and the name was false by construction**
    // (Lumen, 2026-08-29, Finding 3). Under the fillet `path[descentStartIndex]`
    // was the trim point, always short of `staging`. Under R-LF-7 it is the
    // turn circle's TANGENT POINT, which is short of `staging` by the whole
    // arc — the name got further from true, not closer, and the rename holds.
    // `plan.staging` already carries the point for anyone who wants it.
    descentStartIndex: approachPoints.length - 1,
    staging: { x: staging.x / width, y: staging.y / height },
    // R-LF-7 — the turn's own scalars, published rather than left to be
    // re-derived. Same reason `profile` is published (R-LF-2.1) and the same
    // reason `descentStartIndex` exists: a reader that has to reconstruct the
    // geometry from a normalised polyline is measuring its own reconstruction.
    // SCALARS, not points: `path` and `staging` are normalised by the
    // container and these are not, so publishing a POINT here would put two
    // frames in one object. Angles in radians, lengths in the px frame the
    // caller supplied `from` and `target` in.
    //
    // `null` only where `chooseTurn` found no candidate at all — which the
    // gate asserts is unreachable over the lattice, and which degenerates to
    // the pre-R-LF-7 vertical staging rather than to nothing.
    turn: turn
      ? {
        radiusPx: turn.radiusPx,
        sweepRad: turn.sweep,
        bearingRad: turn.phi,
        sigma: turn.sigma,
        passes,
      }
      : null,
    // R-LF-8 / acceptance 9 — the weave's two terms IN THE FRAME IT IS DRAWN
    // IN. `weaveAmplitudePx` is a fraction of the approach chord `from` -> the
    // tangent point, and `weaveSpanPx` is that same chord: since R-LF-7 they
    // are the same leg, where under the fillet the amplitude was taken from
    // the untrimmed chord and drawn over the trimmed one. Published so
    // acceptance 9's `A / drawnSpan` is read off the build rather than
    // recomputed beside it.
    weaveSpanPx: curve.approachChordPx,
    weaveAmplitudePx: curve.amplitudePx,
    weaveCycles: cycles,
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
