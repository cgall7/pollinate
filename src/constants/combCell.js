// The comb cell's own outline numbers, split out of `HoneycombGrid.js` for
// the same reason `bloomRing.js` was: `HoneycombGrid.js` is a component file
// full of JSX that only Metro/Babel can parse, so a check script importing IT
// for a constant fails to compile even though it never touches the JSX.
// `HoneycombGrid.js` imports these back, so there is still exactly one number
// for each.

// R-CL-2 (Lumen, 2026-09-04): ONE OUTLINE, ONE CLAIM. The outline channel
// carries selection and nothing else, so the rest state is one tone on every
// cell regardless of the member's tint, and the width never moves — Beat 1's
// no-width-change clause ("the luxury is restraint here") stands.
export const CELL_STROKE_WIDTH = 2.5;

// R-CL-1 (Lumen, 2026-09-04, off Colin's screenshot): "the outlines genuinely
// aren't all there." The cause is geometric, not a colour choice. `hexPoints`
// puts the flat-top hexagon's left and right vertices at x = 0 and x = 2·size
// — exactly the edges of a `size * 2` canvas — and a stroke straddles the path
// it is drawn on. Half the stroke fell outside the viewport at both vertices
// on EVERY cell in the comb, by construction, so every outline shipped shaved.
//
// A MITER JOIN REACHES FURTHER THAN HALF THE STROKE. At a hexagon's 120°
// vertex the join runs (w/2)/sin(60°) along the bisector, which is 1.4434pt at
// w = 2.5, not 1.25. Padding to half the stroke would have fixed the flat
// edges and left the two points still clipped — the defect at exactly the
// place it was visible. The pad is the miter reach, rounded up.
export const CELL_MITER_REACH = (CELL_STROKE_WIDTH / 2) / Math.sin(Math.PI / 3);
export const CELL_CANVAS_PAD = 2;
