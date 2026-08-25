// Measured geometry of the ratified mascot render, kept apart from the
// component that draws it so a gate can import the numbers. Every figure here
// is a property of that specific drawing, so it is re-derived, never retyped.
//
// **THE MASTER OF RECORD IS `design/final-mascot-2026-08-25-espresso.png`.**
// The line this replaces named `final-mascot-2026-08-12.png` and said to re-run
// the export if the render ever changes. That was true about the GEOMETRY —
// every figure below reproduces from either file — and false about the PIXELS,
// which made it an instruction that reverted a ruling. Colin's 2026-08-17 iris
// call (gold -> espresso) shipped as `aea0bdc`/`687e788` by editing the derived
// 309px `assets/mascot-body.png` DIRECTLY: 558 pixels, iris only, never
// propagated up. So re-exporting from the 08-12 master silently restored the
// pre-ruling eyes — invisible at chrome scale, and the face at hero scale.
//
// A REGENERATION INHERITS THE SOURCE'S STATE AND SILENTLY REVERTS EVERY RULING
// APPLIED BELOW IT. The 08-25 master carries the espresso decision, so the
// chain is honest again and this comment is safe to follow.
//
// Pipeline, in order, in `design/pipeline/` — see `design/README.md`:
//   build_layers.py  master -> wing_full/body_full   (R82's split)
//   cut.py           -> assets/mascot-{wing,body}.png + the hero LOD
//
// `build_layers.py` defaults to the espresso master and REFUSES the 08-12 one
// by inspecting its irises, not by its name — a rename only moves a trap. It
// is a guard rather than a comment because a comment is what failed here.
//
// Acceptance for the repair was a ROUND TRIP, not a colour match (Lumen's bar,
// 2026-08-25): the repaired master back through the chain must reproduce what
// already ships. It does — `mascot-wing.png` byte-identical by sha256, and
// `mascot-body.png` differing in 2 pixels of 98,880, max channel diff 2, both
// inside the iris box, dE00 max 0.5731. The shipped face is the face of record;
// the master conforms to it, never the reverse.

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
