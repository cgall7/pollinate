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

// Ring floor. inkSoft on a wash is ink-on-ground, so this is a luminance
// question (WCAG 1.4.11 non-text, 3:1) — 0.45 measured 1.93:1/1.94:1 on the
// two real-member grounds (washSky/washYellow), 47% of every cycle below the
// bar. 0.75 clears both at 3.30:1/3.34:1 with margin; the crossing point is
// 0.700. Peak (1.0) and cadence are untouched. Also the ground DES-24 §6.4
// row 10 measures the honeyed-cell ink/inkSoft swap against — a check gate
// needs the real number, not a second copy of it.
export const BLOOM_FLOOR_OPACITY = 0.75;
