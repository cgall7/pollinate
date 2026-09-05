import React from 'react';
import Svg, { G, Line, Polygon } from 'react-native-svg';
import { theme } from '../constants/theme';
import { axialToPixel, hexSpiral } from './combLattice';
import {
  HEX_HEIGHT_RATIO,
  HONEY_MENISCUS_STROKE,
  hexHoneyMeniscus,
  hexHoneyPoints,
  hexPoints,
  honeyHeightForLevel,
} from './hexGeometry';

// R-RF-5 (`GUIDES/POLLINATE_RRF5_LANDING_BLOOM_SPEC.md`) — the invite
// landing's centerpiece, built from the comb's own material instead of the
// 112pt flat disc and 44pt glyph that stood in for it. A stranger's first
// frame of Pollinate is a piece of the comb.
//
// Geometry is IMPORTED, never restated: `hexSpiral` and `axialToPixel` from
// `combLattice`, the polygon and the honey vessel from `hexGeometry`. There
// is no trigonometry in this file, which is `hexGeometry.js`'s own house
// rule ("one copy of each formula") applied to a second consumer.
//
// Static by construction (R-RF-5.4): no `Animated`, no timers, no gesture
// handlers, so reduced-motion parity is a property of the drawing rather
// than a branch anyone has to keep in step.

// The wax rest stroke, letter-matched to `EntryCombGrid.js`'s convention:
// 1pt, not `StyleSheet.hairlineWidth` (0.333pt @3x reads as a conformance
// miss, per GlassRim's precedent quoted in that file).
const WAX_STROKE_WIDTH = 1;

// R-CL-1 (`src/constants/combCell.js:14-27`), applied to this composition's
// own stroke rather than borrowed from the people comb's.
//
// `hexPoints` puts the flat-top hexagon's left and right vertices at x = 0
// and x = 2*size — exactly the edges of its box — and a stroke straddles the
// path it is drawn on. A MITER JOIN REACHES FURTHER THAN HALF THE STROKE: at
// a hexagon's 120 degree vertex it runs (w/2)/sin(60 degrees), which is
// 0.5774pt at w = 1, against 0.5pt on the flat top and bottom edges. The pad
// is the miter reach rounded up, the same rule `CELL_CANVAS_PAD` follows.
// `scripts/check-comb-bloom.mjs` re-derives it from `WAX_STROKE_WIDTH`
// rather than trusting this comment, so retuning the stroke past the pad
// reds a row instead of shipping a shaved outline.
//
// DEVIATION FROM R-RF-5.1, stated: the spec derives a 5*cellSize by
// 3*sqrt(3)*cellSize box. The pad adds 2pt to each dimension (112 x 116.3 at
// cellSize 22, against the spec's 110 x 114.3 and the 112pt disc it
// replaces). Shipping the spec's box exactly would have clipped the new
// component's outline at the two side vertices, which is the defect R-CL-1
// closed everywhere else four hours before this was written.
const CANVAS_PAD = 1;

// One ring around one centre. Flat-top, the orientation every comb in the
// app is built from.
const SPIRAL = hexSpiral(1);

// A3 — the focal cell is the spiral's OWN first entry. `hexSpiral` seeds at
// {q: 0, r: 0} and grows outward, so this resolves to the lattice centre by
// construction rather than by counting cells into an array.
const FOCAL_INDEX = SPIRAL.findIndex(({ q, r }) => q === 0 && r === 0);

/**
 * The composition's extents, measured off the spiral rather than written
 * down. Exported so a gate can assert the box without re-deriving it.
 *
 * `hexPoints`' left and right vertices touch its box sides, so the ink spans
 * the full `2 * cellSize` horizontally. Vertically it spans only
 * `sqrt(3) * cellSize`, inset `cellSize * (1 - sqrt(3)/2)` from the top of
 * that box — so measuring the INK is what keeps the height at
 * `3 * sqrt(3) * cellSize` instead of carrying a cell's worth of empty
 * margin at the top and the bottom.
 */
export const combBloomBox = (cellSize) => {
  const positions = SPIRAL.map(({ q, r }) => axialToPixel(q, r, cellSize));
  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys) + cellSize * (1 - HEX_HEIGHT_RATIO);
  return {
    positions,
    // Where cell-local (0, 0) has to land for the ink to start at the pad.
    originX: CANVAS_PAD - minX,
    originY: CANVAS_PAD - minY,
    width: Math.max(...xs) - minX + cellSize * 2 + CANVAS_PAD * 2,
    height: Math.max(...ys) - Math.min(...ys) + cellSize * 2 * HEX_HEIGHT_RATIO + CANVAS_PAD * 2,
  };
};

/**
 * @param cellSize  circumradius, the same meaning it carries everywhere else
 * @param honey     R-D2-4's amendment: `false` renders the focal cell as wax
 *                  like the ring. No honey on an unresolved invitation, the
 *                  same instinct as R-N4's no-honey-on-an-empty-cell — honey
 *                  marks something real.
 */
export const CombBloom = ({ cellSize, honey = true, style }) => {
  const { positions, originX, originY, width, height } = combBloomBox(cellSize);
  const wax = hexPoints(cellSize);
  const honeyHeight = honeyHeightForLevel(cellSize, 1);
  const honeyPoints = hexHoneyPoints(cellSize, honeyHeight);
  const meniscus = hexHoneyMeniscus(cellSize, honeyHeight);
  const at = (index) => `translate(${positions[index].x + originX}, ${positions[index].y + originY})`;

  return (
    <Svg
      width={width}
      height={height}
      style={style}
      pointerEvents="none"
      // Decorative (R-RF-5.4). The landing's announced order stays heading,
      // comb name, count line, disclosure, CTA — this adds no stop.
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* R-CD-13's wax rest state, on every cell of the ring and on the
          focal cell underneath its honey: `washYellow` ground, hairline
          `glassHairline` stroke. The loudness budget goes to the honey. */}
      {SPIRAL.map((axial, index) => (
        <G key={`${axial.q},${axial.r}`} transform={at(index)}>
          <Polygon
            points={wax}
            fill={theme.colors.washYellow}
            stroke={theme.colors.glassHairline}
            strokeWidth={WAX_STROKE_WIDTH}
          />
        </G>
      ))}
      {/* The honey vessel, `EntryCombGrid.js`'s three layers ported whole: a
          `surface` underlay, `accentDeep` at 0.5 over it, and the 1.5pt
          `ink` meniscus that makes it read as a held quantity rather than a
          flat band. Drawn AFTER the whole lattice, not inside the focal
          cell's own group, so no neighbour's stroke crosses the one mark
          this composition is built around. It stays the highest-chroma
          element by construction: everything else here is wax and hairline. */}
      {honey ? (
        <G transform={at(FOCAL_INDEX)}>
          <Polygon points={honeyPoints} fill={theme.colors.surface} />
          <Polygon points={honeyPoints} fill={theme.colors.accentDeep} fillOpacity={0.5} />
          <Line
            x1={meniscus.x1}
            y1={meniscus.y1}
            x2={meniscus.x2}
            y2={meniscus.y2}
            stroke={theme.colors.ink}
            strokeWidth={HONEY_MENISCUS_STROKE}
          />
        </G>
      ) : null}
    </Svg>
  );
};
