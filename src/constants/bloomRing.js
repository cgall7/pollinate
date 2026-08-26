// The BloomRing's geometry constants, split out of `HoneycombGrid.js`
// (2026-08-25, declared-ambient registry ruling, thread 8d2c9a5d msg
// 2c01adf3): `scripts/lib/bloom-ring-region.mjs` derives the tripwire's
// Hive ambient region from these, live, with a bare `node` import — and
// `HoneycombGrid.js` is a component file full of JSX that only Metro/Babel
// can parse, so a script importing IT for its constants fails to compile
// even though it never touches the JSX. Same reason `mascot.js` holds the
// bee's constants apart from `MascotBee.js`. `HoneycombGrid.js` imports
// these back, so there is still exactly one number for each.

// §21/6.4 (Pixel-ruled 2026-08-13, mock 2dcdce11): the blooming ring's two
// load-bearing geometry numbers, measured against selection's solid 2.5pt
// stroke so the two states differ in form (dashed vs. continuous) rather
// than only in weight, which read as the same mark at a glance.
export const BLOOM_RING_INSET = 4.5;
export const BLOOM_MARK_EDGE_FRACTION = 0.3;
export const BLOOM_MARK_STROKE_WIDTH = 2.5;
