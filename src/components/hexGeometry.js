// The hive's hexagon MATH, split out from `HexShape.js` (2026-08-25,
// declared-ambient registry ruling, thread 8d2c9a5d msg 2c01adf3): a script
// deriving the BloomRing tripwire region needs to call `hexEdgeMarks` with a
// bare `node` import, and `HexShape.js` also exports a JSX component
// (`<Svg>`/`<Polygon>`) that only Metro/Babel can parse — importing the file
// for its math pulled in syntax `node` can't compile. Same split
// `combLattice.js` already is to `HoneycombGrid.js`: pure geometry lives
// where anything, script or component, can import it; the component that
// draws it lives next door and imports it too, so there is still exactly
// one copy of each formula.
//
// Flat-top, vertex-on-the-right — the same orientation HoneycombGrid's
// lattice is built from, so anything drawn with this reads as a piece of
// the same comb. `size` is the circumradius, so a cell is `size * 2` wide
// and `size * √3` tall.
//
// Written out as vertices rather than derived from a bounding box because
// the lattice maths (axialToPixel) and the polygon have to agree on what
// `size` means; deriving one from a box is how the Recap comb ended up
// with cells that never touched.
export const hexPoints = (size) => {
  const points = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * 60 * i;
    points.push(`${size + size * Math.cos(angle)},${size + size * Math.sin(angle)}`);
  }
  return points.join(' ');
};

export const HEX_HEIGHT_RATIO = Math.sqrt(3) / 2; // height = width * this

const hexVertex = (size, i) => {
  const angle = (Math.PI / 180) * 60 * i;
  return { x: size + size * Math.cos(angle), y: size + size * Math.sin(angle) };
};

// One mark centred on each of the six edges, inset toward the center — the
// segmented "blooming" ring (§21/6.4, Pixel-ruled 2026-08-13: cell fill is
// identity, marks and rings are state — fill can only ever hold one value
// and its range is capped by whichever tint the member's name hashed to,
// so it can't carry a second signal). Built off the same vertex formula as
// `hexPoints` so a mark and the cell it sits on always agree about where
// the edges are. Returns six `[x1, y1, x2, y2]` pairs for direct use as SVG
// `Line` endpoints.
export const hexEdgeMarks = (size, inset, edgeFraction) => {
  const center = { x: size, y: size };
  const marks = [];
  for (let i = 0; i < 6; i += 1) {
    const v0 = hexVertex(size, i);
    const v1 = hexVertex(size, (i + 1) % 6);
    const mid = { x: (v0.x + v1.x) / 2, y: (v0.y + v1.y) / 2 };
    const outLen = Math.hypot(mid.x - center.x, mid.y - center.y);
    const inward = { x: (mid.x - center.x) / outLen, y: (mid.y - center.y) / outLen };
    const p = { x: mid.x - inward.x * inset, y: mid.y - inward.y * inset };
    const edgeLen = Math.hypot(v1.x - v0.x, v1.y - v0.y);
    const along = { x: (v1.x - v0.x) / edgeLen, y: (v1.y - v0.y) / edgeLen };
    const half = (size * edgeFraction) / 2;
    marks.push([p.x - along.x * half, p.y - along.y * half, p.x + along.x * half, p.y + along.y * half]);
  }
  return marks;
};

// The "seeded" badge: a small hexagon seal on the cell's lower-right VERTEX
// ray (60° from centre), figure knocked out to whatever painted beneath it
// rather than painted in a second colour — R51's register rule, "it never
// flew," applied to a mark instead of a stripe. Two nested hexagons at one
// center, `evenodd`, punch the hole; draw the returned path in the SAME
// `Svg` as the cell's own fill so the hole reveals that fill, not a bare
// transparent gap.
//
// §21.10 (R59): this used to sit on the lower-right EDGE ray (30°, the
// midpoint of vertices 0 and 1) — the same ray `hexEdgeMarks` centres a
// blooming mark on, so the two collided 77% of the mark's width whenever a
// member was both blooming and seeded, and the ring silently read as five
// marks instead of six. `hexEdgeMarks` occupies the six EDGE directions, so
// the six VERTEX directions are free by construction. Moved to the 60°
// vertex ray at 0.682 × the circumradius. Seal radius unchanged.
//
// R61 correction (Pixel): angular clearance is the wrong instrument here —
// it's a 1D projection only valid when both marks sit at the same radius,
// and they don't (seal centre 30.01, mark centre 33.61). The real,
// 2D-measured clearance from the seal's boundary to the mark's ink is
// 2.216pt (6.65px @3x) — and that figure is CONSTANT for any seal distance
// ≥ 0.64 × circumradius, because the seal's flat face runs parallel to the
// mark, so sliding along the vertex ray doesn't change the gap. What binds
// at 0.682 is the cell edge, at 4.50pt clearance — so 0.682 sits mid-
// interval, not on a knife-edge.
export const hexSealPath = (size) => {
  const angle = (Math.PI / 180) * 60; // lower-right vertex
  const dist = size * 0.682;
  const center = { x: size + Math.cos(angle) * dist, y: size + Math.sin(angle) * dist };
  const r = size * 0.2;
  const ring = (radius) => {
    const pts = [];
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 180) * 60 * i;
      pts.push(`${center.x + radius * Math.cos(a)},${center.y + radius * Math.sin(a)}`);
    }
    return `M ${pts.join(' L ')} Z`;
  };
  return `${ring(r)} ${ring(r * 0.5)}`;
};

// DES-24 (`GUIDES/POLLINATE_V2_DES24_HONEYED_HEXAGON.md`) §2-4, corrected on
// device §6.4: the `honeyed` state is a fill LEVEL, not a badge. Honey pools
// in the flat-bottom hex like a vessel; the region's own horizontal top edge
// (the "meniscus") is the signal, not the region's colour (§2 measures why —
// no colour clears WCAG 1.4.11 3:1 on both member tints, `ink` clears it 2x).
//
// The ceiling is the glyph box, not a typed constant (§4/§6.4): React Native
// centres the LINE box (ascent+descent), not a cap-height box, so the own
// cell's "You" glyph bottom sits at 1.1765 * size, not the cap-height guess
// of 1.1470 the original spec used. That 0.0295*size correction is why this
// is 0.6096, not the originally-published 0.639.
const HONEY_GLYPH_BOTTOM_RATIO = 1.1765; // §6.4, device-measured
const HONEY_GLYPH_CLEARANCE_RATIO = 0.08; // §4
const HONEY_BOTTOM_EDGE_RATIO = 1.8660; // HexShape: flat bottom edge, size*(1+sin60)

// h_max: 0.6096 * size = 26.82pt at a 44pt cell (§6.4, corrected).
export const honeyHMax = (size) =>
  (HONEY_BOTTOM_EDGE_RATIO - (HONEY_GLYPH_BOTTOM_RATIO + HONEY_GLYPH_CLEARANCE_RATIO)) * size;

// R-N2 (POLLINATE_NECTAR_LIVING_EXCHANGE §3) RETIRES `HONEY_RUNGS`.
//
// The ladder was `[0, 0.25, 0.5, 0.75, 1]` — four visible rungs over a cap
// of 2000 drops, which made rung 1 span balances 1..999 and put the starter
// grant dead in the middle of it. Measured by Lumen: NO single transaction
// this product offers moves the level in either direction, because the
// register's resolution is 5x coarser than its own largest gesture. The
// level is now the continuous fraction `min(1, drops / cap)` and the caller
// hands it in place of a rung index (`honeyLevelForDrops`, nectar.js).
//
// This is not a relaxation of §4/§6.1's "never a readout". A CONTINUOUS
// quantity is LESS of a scoreboard than a stepped one, not more — a stepped
// register invites you to count its steps, and there is nothing here to
// count. The two rules that made the ladder a register rather than a
// progress bar are both properties of `honeyHMax` and are untouched: the
// ceiling still clears the glyph, and the meniscus is still the signal.
//
// THE FLOOR MOVES WITH IT, and it is now derived rather than inherited.
// DES-24's anti-cliff rule survives verbatim — "any positive balance renders
// a visible minimum, and only zero goes dark" — but its old spelling was
// "at least rung 1", i.e. 6.7045pt at a 44pt cell, a quarter of the whole
// vessel drawn for a single drop. Continuous, the floor can say what it
// actually means: the smallest height at which the honey is a REGION and not
// its own boundary. The meniscus is a 1.5pt stroke centred on the top edge,
// so 0.75pt of it hangs down INTO the region; at `h = HONEY_MENISCUS_STROKE`
// exactly 0.75pt of honey body is visible below the line's lower edge, and
// below that the "region" is entirely inside the line that bounds it — a
// vessel drawn as a rule, not as a vessel.
//
// The floor is in POINTS, not in level, and that is forced: it is derived
// from a stroke width, which does not scale with `size`. Expressed as a
// fraction it would be correct at exactly one cell size.
export const HONEY_MENISCUS_STROKE = 1.5;
export const HONEY_MIN_HEIGHT = HONEY_MENISCUS_STROKE;

// level (0..1) -> the meniscus height in points, floor applied. ZERO IS THE
// ONLY DARK CASE: any positive level renders at least `HONEY_MIN_HEIGHT`.
export const honeyHeightForLevel = (size, level) => {
  const n = Number(level);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.max(HONEY_MIN_HEIGHT, honeyHMax(size) * Math.min(1, n));
};

// The honey region: the cell clipped below the meniscus at height `h`. Every
// rung sits below the hex's widest point (h_max 0.6096*size < 0.866*size,
// the distance from the bottom edge to the side vertices), so the region is
// always a trapezoid bounded by the two lower edges — no special case at the
// side vertices. Returns an SVG points string, matching `hexPoints`' shape.
export const hexHoneyPoints = (size, h) => {
  const yBottom = HONEY_BOTTOM_EDGE_RATIO * size;
  const yMeniscus = yBottom - h;
  const halfWidthAt = (y) => size - ((y - size) / (HEX_HEIGHT_RATIO * size)) * 0.5 * size;
  const hw = halfWidthAt(yMeniscus);
  return [
    `${size - hw},${yMeniscus}`,
    `${size + hw},${yMeniscus}`,
    `${1.5 * size},${yBottom}`,
    `${0.5 * size},${yBottom}`,
  ].join(' ');
};

// The meniscus line's own endpoints — same half-width the region's top edge
// uses, so the `ink` line and the fill's edge always agree.
export const hexHoneyMeniscus = (size, h) => {
  const yBottom = HONEY_BOTTOM_EDGE_RATIO * size;
  const yMeniscus = yBottom - h;
  const halfWidthAt = (y) => size - ((y - size) / (HEX_HEIGHT_RATIO * size)) * 0.5 * size;
  const hw = halfWidthAt(yMeniscus);
  return { x1: size - hw, y1: yMeniscus, x2: size + hw, y2: yMeniscus };
};
