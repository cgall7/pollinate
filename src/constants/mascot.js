// Measured geometry of the ratified mascot render, kept apart from the
// component that draws it so a gate can import the numbers. Every figure here
// is produced by `.scratch/r82-mascot-flight/export.py` from
// `GUIDES/assets/final-mascot-2026-08-12.png`; re-run it if the render is ever
// re-exported, because all four are properties of that specific drawing.

// Character box: the union of the two layers' bounding boxes, 1013 x 1049px.
// Both PNGs are cropped to it, so they stack by being the same size in the
// same place and need no per-layer offsets.
export const MASCOT_ASPECT = 1013 / 1049;

// The character is drawn at this fraction of the `size` box. It is
// `StripedBee`'s own drawn width fraction — its content spans x 5.2..21.6 of a
// 24-unit viewBox — so a call site that swaps one for the other keeps its
// footprint. Height follows from the aspect and comes out at 0.708 of the box
// against StripedBee's 0.47: the mascot has a head and a trailing abdomen.
export const MASCOT_WIDTH_FRACTION = 16.4 / 24;

// Wing root, as a fraction of the character box. This is the pivot for the
// beat; it is not the box centre, which is why `MascotBee` composes the pivot
// by hand. Measured as the mean of the 2% of wing pixels with the largest x —
// the wing mass lies left of the body, so its head-most end is where it meets
// the thorax. R79 estimated (0.438, 0.492) off the unsplit render; the split
// layers put it at (0.427, 0.505).
export const HINGE = { x: 0.4273, y: 0.5050 };

// Full sweep of one wing beat, R79's figure. The flap radius — root to the
// farthest wing pixel — is 0.411 of the box height, so 18 degrees moves the
// tip 0.128 box-heights: 4.0pt at size 44, 1.2pt at size 13. R79 quoted 6.60pt
// at 44 assuming the character filled its box; at `MASCOT_WIDTH_FRACTION` it
// doesn't, and 4.0pt is the figure that ships.
export const WING_BEAT_DEG = 18;

// §17.3's ratified half-cycle, unchanged. `StripedBee` beat 1 -> 0.55 in this
// time and the mascot rotates instead, because a scaleY about a root hinge
// barely moves a wing that extends horizontally away from it — the ratified
// quantity was always the beat, and scaleY was a guess at how to drive one.
export const WING_BEAT_MS = 80;

// --- Breath (Bee Doctrine §State-2) ---------------------------------------
//
// A perched bee is not a flying one at a lower frame rate. Doctrine §State-2:
// "wing-only flutter, 4.2s cycle, scale amplitude <=1.5% of the bee's bounding
// box, zero translation, zero hover." The bar it has to clear is Lumen's —
// *you never catch it performing; if you stare, it rewards you.*
//
// **The bound is converted into the mechanism's own currency rather than
// applied to it.** The doctrine says "scale amplitude"; the ratified wing
// mechanism is a ROTATION about the hinge (R82 — a scaleY about a root hinge
// barely moves a wing that extends horizontally away from it). Those are two
// different quantities, so the bound is restated in the one the wing actually
// has: the peak-to-peak travel of the wing TIP, as a fraction of the character
// box, which is the same currency `WING_BEAT_DEG`'s own note is written in
// (§12.5.1 — a figure states the space it was measured in).
//
//     tip travel = 2 * FLAP_RADIUS * sin(theta / 2)     [box heights]
//
// `FLAP_RADIUS` = 0.411 of the box height, the figure `WING_BEAT_DEG` is
// already stated against. Check it reproduces the shipped number before
// trusting it on a new one: at 18 degrees it gives 0.12859 box-heights and
// 4.0036pt at size 44, against the 0.128 and "4.0pt" written above. Same
// instrument, same answer.
//
// Solving the doctrine's ceiling exactly gives 2.0912 degrees. Two degrees is
// what ships — 1.4346% against the 1.5% ceiling, 4.4% of headroom, because a
// constant set AT its gate's ceiling breaches it the moment anything it is
// derived from moves (R-series: never ship a zero-headroom token).
export const BREATH_FLAP_RADIUS = 0.411;
export const BREATH_BEAT_DEG = 2;

// One complete up-down-up cycle. Deliberately longer than a casual glance
// (~2-3s) so a look never contains a whole beat: what the eye gets in passing
// is a wing that is somewhere, not a wing that is moving.
//
// **Read this number before quoting it.** It is the FULL cycle, so each
// direction takes half of it. `WING_BEAT_MS` above is the opposite convention
// — it is the HALF, 80ms out and 80ms back — and the two conventions sitting
// in one file is exactly how a 4.2s breath ships at 8.4s. The names carry it:
// `_CYCLE_MS` is a cycle, `_BEAT_MS` is a beat.
export const BREATH_CYCLE_MS = 4200;

// --- The drawn silhouette, by direction (§28.3, Lumen 2026-08-25) ----------
//
// **How far the character reaches from its own centre, as a fraction of its
// drawn WIDTH, binned by direction.** The pollen burst is seeded off this, and
// it exists because the burst was previously sized against the character's
// BOUNDING BOX — one number, 0.5 of the width — while the drawing's own reach
// runs 0.4416 to 0.6480 depending on where you look. The legs and the antennae
// stick a long way out past a body that does not fill its box, so a single
// radius either buries the flecks that fire into a leg or throws the ones
// firing into a gap much too far. Measured on device: at the old constant the
// 48-degree fleck never left him at all.
//
// Every figure is produced by `scripts/derive-mascot-clearance.mjs` from the
// shipped `assets/mascot-{body,wing}.png`; `--check` re-derives and fails on
// drift, so unlike this file's older constants the assets and the numbers
// cannot silently disagree. Re-run it if the render is ever re-exported.
//
// Conventions the derivation states and this table inherits:
//   * angle 0 is +x, angles increase toward +y (screen down), degrees;
//   * the reach is in units of the character's WIDTH, so it scales with
//     `size` and carries no device or cell dimension;
//   * the wing is swept through `WING_BEAT_DEG` about `HINGE` before the
//     union, because the burst fires on the frame he lands and the airborne
//     beat is still the pose;
//   * BOTH facings are unioned — he mirrors on `scaleX` (R81), so a clearance
//     that only holds for one facing is a burst that only works landing one
//     way.
//
// Bins rather than a curve, and the bin holds the MAXIMUM over its own span
// including both edges: a lookup is then an upper bound for every angle inside
// the bin and needs no interpolation. That is not a shortcut — interpolating
// this profile would UNDER-state the spikes, and under-stating is the
// direction that puts a fleck inside a leg.
export const CLEARANCE_BIN_DEG = 10;
export const MASCOT_CLEARANCE = [
  0.4968, 0.496, 0.4416, 0.6248, 0.644, 0.648,
  0.4752, 0.4488, 0.4488, 0.4488, 0.4488, 0.4752,
  0.648, 0.644, 0.6248, 0.4416, 0.496, 0.4968,
  0.496, 0.4712, 0.5712, 0.5728, 0.5664, 0.4784,
  0.4536, 0.5264, 0.5208, 0.5208, 0.5264, 0.4536,
  0.4784, 0.5664, 0.5728, 0.5712, 0.4712, 0.496,
];
