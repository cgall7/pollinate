// The comb cell's own outline numbers, split out of `HoneycombGrid.js` for
// the same reason `bloomLight.js` (then `bloomRing.js`) was: `HoneycombGrid.js` is a component file
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

// R-CL-2's rest tone, and the reason the outline stopped disappearing.
//
// The rest stroke was `surface` (#FFFFFF). That is the third mechanism in
// Lumen's diagnosis of Colin's screenshot ("the faint partial rims on I, D,
// S"), and the numbers say it precisely: white measures 1.1129:1 on
// `washYellow` and 1.1418:1 on `washSky`. A boundary is read by LUMINANCE, and
// at 1.11 there is almost none to read — the hue difference is real (ΔE00
// 16.03 on washYellow) and buys nothing, because an edge is not a patch. On
// the own cell's `surface` ground it was not faint but absent: ΔE00 0.00.
//
// `glassHairline` is `ink` at 0.18 — the memory comb's own rest stroke since
// R-CD-13, so the two combs now wear ONE wax tone and a reader crossing
// between them sees one material. Measured on all four grounds a cell can sit
// on: washYellow 1.445:1, washSky 1.444:1, surface 1.455:1, background
// 1.447:1 — a spread of 0.011, which is the property that makes it uniform in
// the sense the ruling asked for. It states the same thing on every cell
// rather than merely being the same token.
//
// It is quiet on purpose. The outline channel carries SELECTION and nothing
// else now, and selection is `ink` at the same 2.5pt: 10.653:1 against this
// rest tone's composite, so the tap is not a stronger version of the rest
// state, it is a different one.
//
// TWO THINGS THIS DOES NOT FIX, both pre-existing and both stated rather than
// left to be rediscovered. (a) Adjacent cells tessellate edge to edge
// (`ringStepFor` = √3·size, the touching distance), so an interior lattice
// line is two 2.5pt strokes composited — `ink` at 0.3276, 2.038:1 — and reads
// stronger than the comb's outer boundary. That is how a real comb looks and
// it is left alone; what matters is that it stays far under selection, which
// it does by 7.55x (`ink` measures 15.390:1 on the same ground). (b) On an avatar-backed cell the INNER half of the stroke
// lands on the photo and can vanish into a dark one. The outer half lands on
// the page, which is why the cell still reads as bounded — and it only has an
// outer half at all because R-CL-1 stopped clipping it.
// Exported as the TOKEN NAME rather than the resolved colour, and that is a
// packaging choice rather than a design one: this file is imported by
// `check-comb-outline.mjs` with a bare `node`, where an extensionless
// `./theme` does not resolve, and no other file in `src/` writes an explicit
// `.js` extension. So the call sites in `HoneycombGrid.js` read
// `theme.colors.glassHairline` like every other colour in that file, and the
// gate resolves this name against the live theme — one source of truth for
// which token, with nothing in the component that a reader has to chase.
export const CELL_REST_STROKE_TOKEN = 'glassHairline';
