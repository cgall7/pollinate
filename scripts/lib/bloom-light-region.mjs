// Derives the blooming state's ambient region from the SAME source the render
// uses — `hexPoints` (hexGeometry.js), the light's own constants
// (`constants/bloomLight.js`) and `buildCombLayout` (`combLattice.js`) for
// each cell's on-screen offset within the cluster — rather than a second copy
// of any of it. Same live-import discipline `bee-breath-region.mjs` uses for
// `BREATH_BEAT_DEG`: a silent mismatch between what this measures and what the
// screen draws is structurally impossible.
//
// "Which cells bloom" is STATE, not geometry (Lumen, declared-ambient registry
// ruling, thread 8d2c9a5d, msg 2c01adf3 replying to Pixel's errand clip) —
// this module never guesses it. The caller supplies the blooming cells' spiral
// indices and the comb cluster's own on-screen origin, the same contract
// `analyze` already uses for the bee's anchor rect: geometry derived, state
// supplied.
//
// R-CL-2 (2026-09-04) REPLACED THIS MODULE'S SUBJECT AND INVERTED ITS SHAPE.
// It used to be `bloomMarkRegionsPx` and returned SIX boxes per blooming cell,
// one per ring mark, on an explicit argument: the ring's visual unit was the
// mark, so collapsing six marks into one cell box would let a genuine leak in
// the gap BETWEEN two marks hide inside a falsely-shared region.
//
// That argument does not survive the change of channel, and its conclusion
// inverts with it. The light is ONE polygon covering the whole cell, so the
// cell IS the visual unit and there are no gaps inside it to hide in. Six
// boxes here would now be the unsound shape: they would declare the six
// former mark strips as licensed to move and leave the cell's interior — the
// part that actually breathes — undeclared, which is a tripwire that reports
// the ambient light it was built to permit as an unlicensed leak.
import { hexPoints } from '../../src/components/hexGeometry.js';
import { buildCombLayout, hexSpiral } from '../../src/components/combLattice.js';
import { CELL_STROKE_WIDTH } from '../../src/constants/combCell.js';

/**
 * One padded px bbox per blooming cell.
 *
 * `size`: the same circumradius prop `HoneycombGrid` passes to both
 * `FilledCell`/`BloomLight` and `buildCombLayout` — one number drives both the
 * light's geometry and the cell's lattice position, matching the source.
 * `bloomingIndices`: spiral indices (0-based, `HIVE_SLOTS`/`SPIRAL` order) of
 * cells currently blooming.
 * `combOriginPx`: the comb cluster's own on-screen top-left px (the same point
 * `buildCombLayout`'s `cell.x`/`cell.y` are relative to, and what
 * `HoneycombGrid` positions with `left`/`top`) — measured live, same as the
 * bee's anchor rect.
 *
 * Padding is `CELL_STROKE_WIDTH / 2`. The light polygon shares its path with
 * the cell's outline, and a stroke straddles the path it is drawn on, so the
 * lit region reaches half a stroke past the polygon's own extent — the same
 * fact R-CL-1 padded the canvas for, read here off the same constant so a
 * retune of one moves the other.
 */
export const bloomLightRegionsPx = ({ size, bloomingIndices, combOriginPx, spiral = hexSpiral(1) }) => {
  if (bloomingIndices.length === 0) return [];
  const { cells } = buildCombLayout([], size, spiral);
  const pad = CELL_STROKE_WIDTH / 2;
  const xs = hexPoints(size).split(' ').map((pair) => Number(pair.split(',')[0]));
  const ys = hexPoints(size).split(' ').map((pair) => Number(pair.split(',')[1]));

  return bloomingIndices.map((idx) => {
    const cell = cells[idx];
    if (!cell) throw new Error(`bloom index ${idx} is out of range for a ${cells.length}-cell spiral`);
    const cellOriginPx = { x: combOriginPx.x + cell.x, y: combOriginPx.y + cell.y };

    return {
      minX: cellOriginPx.x + Math.min(...xs) - pad,
      maxX: cellOriginPx.x + Math.max(...xs) + pad,
      minY: cellOriginPx.y + Math.min(...ys) - pad,
      maxY: cellOriginPx.y + Math.max(...ys) + pad,
    };
  });
};
