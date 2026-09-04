// The blooming state's constants. Split out of `HoneycombGrid.js` (2026-08-25,
// declared-ambient registry ruling, thread 8d2c9a5d msg 2c01adf3) and kept
// split for the same reason: `scripts/lib/bloom-light-region.mjs` derives the
// ambient tripwire's Hive region from these with a bare `node` import, and
// `HoneycombGrid.js` is a component file full of JSX that only Metro/Babel can
// parse, so a script importing IT for a constant fails to compile even though
// it never touches the JSX. `HoneycombGrid.js` imports these back, so there is
// still exactly one number for each.
//
// R-CL-2 (Lumen, 2026-09-04) RENAMED THIS FILE FROM `bloomRing.js`. The ring
// retired; the state did not. What follows is the tail, piece by piece, so the
// next reader can see which numbers survived the change of channel and why.
//
// RETIRED WITH NO SUCCESSOR — the six edge marks are gone, so their geometry
// has nothing to describe:
//   * `BLOOM_RING_INSET` (4.5)            — how far in from the edge a mark sat
//   * `BLOOM_MARK_EDGE_FRACTION` (0.3)    — how much of each edge a mark spanned
//   * `BLOOM_MARK_STROKE_WIDTH` (2.5)     — the mark's own stroke
// `hexEdgeMarks` (hexGeometry.js), the generator all three fed, retired with
// them: R-CL-2 left it with no renderer, and the nectar surface registry's
// honeyed-mark row (its one non-comment reference) now anchors on `HoneyFill`,
// which is what actually draws that mark since R-N2.

// SURVIVES, SAME MEANING, NEW SUBJECT. Lumen ruled the light breathes "on the
// ring's old clock", so the clock is the same number it always was.
export const BLOOM_BREATHE_MS = 2400;

// SURVIVES AS THE LIGHT'S BREATHE FLOOR — the quiet end of the cycle, as a
// fraction of `BLOOM_LIGHT_ALPHA`. Its old job was a contrast floor for ink
// marks on a wash (0.45 measured 1.93:1, under the 3:1 non-text bar for 47% of
// every cycle; 0.75 cleared it at 3.30:1). That measurement retires with the
// marks — there is no ink on the cell any more. What it keeps is R46's rule,
// which was always the reason the floor was a floor rather than zero: THE
// STATE NEVER DISAPPEARS MID-BREATH, only the breathe does. The new
// measurement it has to hold is in `check-comb-outline.mjs` (rows L2/L3): at
// 0.75 of the peak the light still stands ΔE00 5.38 off an unlit `washYellow`
// neighbour, so the quiet end of the cycle is above the field threshold too,
// not merely non-zero.
export const BLOOM_FLOOR_OPACITY = 0.75;

// NEW, AND THE ONE NUMBER R-CL-2 ADDED. The lit overlay's peak alpha.
//
// WHY 0.18 AND WHY IT IS AN OVERLAY ON A SWAPPED BASE. Measured, not picked:
// `accentBurst` (#FFEA00) is L* 91.73, which is DARKER than both identity
// tints (`washYellow` 95.73, `washSky` 94.72), so composited straight onto a
// cell it cannot brighten anything — and on `washSky` every register that is
// legible on `washYellow` lands green-dominant (at α 0.12: rgb(231,241,221),
// G max), which is the one hue this product does not have. So a blooming cell
// swaps its identity tint for `washYellow` — the app's warm ground, and the
// dive's own filled-cell ground (R-CD-13) — and the light rides on top of
// THAT. Base and light together are the dive's backlit filled cell, ported
// whole, which is what "the lit-variant material the dive already uses" names.
//
// The consequence, stated because it is a real trade: the light's DESTINATION
// is constant (every lit cell is the same colour, so the state is one claim)
// while its DELTA is not (a `washSky` member's cell moves ΔE00 27.96, a
// `washYellow` member's 6.87). The retired ring was the other way round —
// delta-constant, because ink marks read the same on either tint. Destination-
// constant is the better invariant for a state you find by scanning a comb:
// what has to be true is that a lit cell is unmistakable next to ANY
// neighbour, and the binding case is the `washYellow` one at 6.87, above the
// ~5 ΔE00 threshold for non-adjacent fields at every point of the breathe.
export const BLOOM_LIGHT_ALPHA = 0.18;
