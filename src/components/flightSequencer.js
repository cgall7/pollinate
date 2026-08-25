// Sunbeam §32 / Bee Doctrine — what is left of the idle flight.
//
// ┌─ THE IDLE FLIGHT IS RETIRED, NOT PARAMETERISED ─────────────────────┐
// │   consumer   FlyingBee.js, PerchAnchor.js                           │
// │   owner      Pixel (this file) / Deezine (Bee Doctrine spec)        │
// │   doctrine   GUIDES/BEE_DOCTRINE_SPEC.md — three states, Rest,      │
// │              Breath and Errand, and only the third one moves.       │
// │   gated      scripts/check-bee-attitude.mjs                         │
// └─────────────────────────────────────────────────────────────────────┘
//
// This module used to hold a sequencer: the bee rested at a declared anchor,
// sometimes hovered to look around, then darted to a different one, forever.
// It was built to fix a real defect — Colin, 2026-08-16, the cruise "looks
// like a windows98 screensaver just bouncing off the corners with no purpose"
// — and it fixed it by making the loop unpredictable rather than by making it
// stop.
//
// Colin, 2026-08-13 and again on 08-20: *"unless you make it super luxurious,
// retire it."* The doctrine's answer is that an idle bee that goes ANYWHERE is
// still a screensaver, however well it chooses where; what makes a resident
// luxurious is that it does not move unless the user just did something. So
// §Retire Outright deletes idle ambient cruise, look-around, idle dart, idle
// re-perch and perch fidget by name, and this file is where three of those
// five lived.
//
// **They are deleted, not switched off.** `hoverChance: 0` and an infinite
// dwell would have produced the same frames tonight and left a whole grammar
// held shut by one field — the shape where the next person to widen a range
// re-ships a retired behaviour without ever reading the ruling that retired
// it. What went, and it went whole: `STUB_GRAMMAR`, `makeRng`, `chooseAnchor`,
// `nextBeat`, `resolveBeat`, `buildHoverPlan`, `meanHopPx`, `facingFlipRate`,
// `dwellMsForAirborne`, `perchRangeFor`, `resolveGrammar`, `DART_SPEED_RATIO`.
// 397 lines. Every one of them existed to answer "where next, and when", and
// the doctrine's answer is "nowhere, never".
//
// What survives is the three things that were never about the idle loop:
//
//   * `referenceSpeedPxS` — the speed currency §28 defines every ERRAND
//     against. The errand is not retired; it is the whole of State 3.
//   * `resolvePerchPoint` — the §32.2 anchor contract, `{ on, at }` against a
//     measured frame. A resident needs a residence.
//   * `buildRestPlan` — State 1, which is a position rather than a motion.
//
// **The name of this file is now wrong and that is a follow-up, not an
// oversight.** It sequences nothing. Renaming it in the same commit that
// removes 397 lines would make the diff unreadable in exactly the place a
// reviewer most needs to read it, so the rename rides its own commit; until
// then, this paragraph is the disclosure.
//
// **Dependency-free, and that property is unchanged and still load-bearing** —
// the same one `beeAttitude.js` and `pollinationFlight.js` hold.
// `scripts/check-bee-attitude.mjs` loads these files by reading the source and
// importing it as a base64 `data:` URL, the only way to `import` a `.js` file
// in a package that is not `type: module`. A `data:` URL has no base to
// resolve against, so even a RELATIVE specifier fails there:
//
//   ERR_UNSUPPORTED_RESOLVE_REQUEST: Failed to resolve module specifier
//   './pollinationFlight' ... base scheme is not hierarchical
//
// So an import here would break the gate that exists to sample this file, and
// the likely repair — having the gate string-match the source instead — is
// precisely the degradation the dependency-free rule was written to prevent.
// §32.1 — the reference speed, and why it is stated per DIAGONAL.
//
// Every speed in §28 is derived from the cruise: the approach is
// `APPROACH_SPEED_RATIO x cruiseSpeedPxS(PATH, width, height, LOOP_MS)`, and
// `DESCENT_MS` is justified by landing at that same pace (30.07pt in 160ms =
// 187.9 px/s against the cruise's 187.59). Deleting `PATH` deletes the number
// both of those are defined against, so the sequencer has to publish a
// replacement or §28.5 loses its footing.
//
// The shipped cruise speed turns out to be almost exactly a fixed fraction of
// the container's DIAGONAL, and that is not a coincidence — `PATH` is
// fractional, so its resolved length scales with the box. Measured across
// seven boxes from a 320x568 SE to a 744x1133 iPad mini:
//
//     basis        spread across the seven
//     diagonal/s   0.19975 .. 0.20264   (1.45%)
//     height/s     0.21905 .. 0.24243   (10.67%)
//     width/s      0.36918 .. 0.48677   (31.85%)
//
// So the diagonal is the basis that makes the number a property of the bee
// rather than a property of the phone. At 393x852 it reproduces the shipped
// 187.59 px/s to 0.06% and `DESCENT_MS`'s implied 187.9 to 0.1% — every §28.5
// figure survives the swap untouched, which is the point.
export const CRUISE_DIAG_PER_S = 0.2;

export const referenceSpeedPxS = (width, height) =>
  CRUISE_DIAG_PER_S * Math.hypot(width, height);

// §32.2 — an authored anchor is a SIDE and a FRACTION, resolved against the
// element's own measured frame.
//
// It lives in this file rather than beside `<PerchAnchor>` for the reason
// everything in this file lives here: the gate imports and samples it. What an
// author wrote has to resolve through the code the app runs, not through a
// second copy in a checker.
//
// Sides only, never corners or a centre — R122. `at` runs top to bottom along
// the named side.
//
// **What a side is FOR changed when the idle flight retired, and the contract
// did not.** R122 chose sides so that a set of anchors would have x-extent:
// with every TodayTab block full-width in one 24pt column, anchoring them all
// on the same side gave the set zero spread, `facingFor` never crossed its
// one-body-width threshold, and the bee flew every sortie facing the same way.
// There are no sorties now and no set — there is ONE resting anchor per screen
// — so extent has nothing left to be a property of.
//
// What a side decides now is whether the bee is standing on the content.
// R122a: the contract resolves the ANCHOR, the bee rests AT it (hover is
// retired, so rest lands on the anchor exactly), and legality is judged at the
// REST position. The character is drawn centred on that point and spans
// `MASCOT_WIDTH_FRACTION x size` — 30.07pt at the default 44 — so an anchor
// resolves half a character into whatever lies on that side of the line.
// `on: 'left'` on a full-width block puts x at the column's left padding edge,
// which is where the glyphs BEGIN: that is the live defect this doctrine pass
// fixes, a streak caption reading "2 ays to 3." under a resting bee. `on:
// 'right'` on a left-aligned block puts him in the trailing gutter, which is
// empty by construction for any caption shorter than the block.
export const resolvePerchPoint = (frame, on, at) => ({
  x: on === 'right' ? frame.x + frame.width : frame.x,
  y: frame.y + Math.min(1, Math.max(0, at)) * frame.height,
});

/**
 * REST — Bee Doctrine State 1, and it is the only idle state there is.
 *
 * Two identical waypoints and NO DURATION. The plan is a position, not an
 * animation: the driver reads a null `durationMs` as "place him and stop", so
 * a resting bee costs zero animations rather than one `Animated.timing`
 * driving a constant. The doctrine's word is "indefinite (until an errand is
 * triggered)", and indefinite is not a large number — a dwell that expires is
 * a machine that has to decide what happens next, and the whole content of the
 * doctrine is that nothing does.
 *
 * **This is what retiring the idle flight left behind.** Everything the beat
 * machine used to need — a dwell solved against an airborne fraction, an
 * anti-repeat memory, a seeded choice over anchors, a hover to fill the pause
 * — was in service of getting the bee from one perch to another without
 * looking periodic. There is no second perch to get to now, so all of it is
 * gone rather than switched off: `hoverChance: 0` would be a deletion wearing
 * a constant's name, and the next reader would find a whole grammar with one
 * field holding it shut.
 *
 * `flutter: false` — the perched wing is `MascotBee`'s `breath`, which is a
 * different sweep on a different clock (§State-2, 2 degrees over 4.2s against
 * the airborne 18 over 0.16). `flutter` on a resting bee is the loading
 * spinner the doctrine's "never performing" bar exists to forbid.
 *
 * `heldFacing` matters here and is easy to miss: `buildAttitude` seeds its
 * facing from `Math.sign(segments[0].dx) || 1`, and a stationary path's first
 * segment has `dx === 0`, so a resting bee would snap to facing RIGHT however
 * he arrived. The plan therefore carries the facing the previous plan ended
 * with, and `buildAttitude` has to accept it — see its `heldFacing` option.
 */
export const buildRestPlan = ({ at, width, height, heldFacing }) => ({
  kind: 'rest',
  path: [at, at].map((p) => ({ x: p.x / width, y: p.y / height })),
  inputRange: [0, 1],
  easing: (w) => w,
  // Null, not zero. Zero is a timing that completes on the next frame and
  // fires its callback; null is the absence of a timing. The driver branches
  // on it, and the difference is the whole of "indefinite".
  durationMs: null,
  trail: false,
  flutter: false,
  heldFacing,
});
