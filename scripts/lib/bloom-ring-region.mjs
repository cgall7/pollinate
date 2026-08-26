// Derives the BloomRing's mark geometry from the SAME source the render
// uses — `hexEdgeMarks` (HexShape.js), the ring's own three constants
// (`HoneycombGrid.js`), and `buildCombLayout` (`combLattice.js`) for each
// cell's on-screen offset within the cluster — rather than a second copy of
// any of it. Same live-import discipline `bee-breath-region.mjs` uses for
// `BREATH_BEAT_DEG`: a future retune of `BLOOM_RING_INSET` or the stroke
// width moves this derivation for free, and a silent mismatch between what
// this measures and what the ring draws is structurally impossible.
//
// "Which cells bloom" is STATE, not geometry (Lumen, declared-ambient
// registry ruling, thread 8d2c9a5d, msg 2c01adf3 replying to Pixel's errand
// clip) — this module never guesses it. The caller supplies the blooming
// cells' spiral indices and the comb cluster's own on-screen origin, the
// same contract `analyze` already uses for the bee's anchor rect: geometry
// derived, state supplied.
import { hexEdgeMarks } from '../../src/components/hexGeometry.js';
import { buildCombLayout, hexSpiral } from '../../src/components/combLattice.js';
import {
  BLOOM_RING_INSET,
  BLOOM_MARK_EDGE_FRACTION,
  BLOOM_MARK_STROKE_WIDTH,
} from '../../src/constants/bloomRing.js';

/**
 * One padded px bbox per mark — six per blooming cell, not one bbox per
 * cell. The ring's own visual unit is the mark (six independent `Line`
 * elements); collapsing them into one box per cell would let a genuine leak
 * in the gap BETWEEN two marks hide inside a false-shared region, the same
 * failure shape `diffFrames` already refuses for the wing (it diffs every
 * consecutive frame pair rather than endpoints only).
 *
 * `size`: the same circumradius prop `HoneycombGrid` passes to both
 * `FilledCell`/`BloomRing` and `buildCombLayout` — one number drives both
 * the mark geometry and the cell's lattice position, matching the source.
 * `bloomingIndices`: spiral indices (0-based, `HIVE_SLOTS`/`SPIRAL` order)
 * of cells currently blooming.
 * `combOriginPx`: the comb cluster's own on-screen top-left px (the same
 * point `buildCombLayout`'s `cell.x`/`cell.y` are relative to, and what
 * `HoneycombGrid` positions with `left`/`top`) — measured live, same as the
 * bee's anchor rect.
 *
 * Padding is `strokeWidth / 2`: an SVG stroke extends that far
 * perpendicular to the line on both sides, and `strokeLinecap="round"`
 * extends it that far past each endpoint along the line too — so padding
 * every side of the raw endpoint bbox by the same amount safely covers
 * both.
 */
export const bloomMarkRegionsPx = ({ size, bloomingIndices, combOriginPx, spiral = hexSpiral(1) }) => {
  if (bloomingIndices.length === 0) return [];
  const { cells } = buildCombLayout([], size, spiral);
  const marks = hexEdgeMarks(size, BLOOM_RING_INSET, BLOOM_MARK_EDGE_FRACTION);
  const pad = BLOOM_MARK_STROKE_WIDTH / 2;

  return bloomingIndices.flatMap((idx) => {
    const cell = cells[idx];
    if (!cell) throw new Error(`bloom index ${idx} is out of range for a ${cells.length}-cell spiral`);
    const cellOriginPx = { x: combOriginPx.x + cell.x, y: combOriginPx.y + cell.y };

    return marks.map(([x1, y1, x2, y2]) => ({
      minX: cellOriginPx.x + Math.min(x1, x2) - pad,
      maxX: cellOriginPx.x + Math.max(x1, x2) + pad,
      minY: cellOriginPx.y + Math.min(y1, y2) - pad,
      maxY: cellOriginPx.y + Math.max(y1, y2) + pad,
    }));
  });
};
