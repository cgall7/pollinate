import React from 'react';
import Svg, { Polygon } from 'react-native-svg';
import {
  hexPoints,
  HEX_HEIGHT_RATIO,
  hexEdgeMarks,
  hexSealPath,
  honeyHMax,
  HONEY_RUNGS,
  hexHoneyPoints,
  hexHoneyMeniscus,
} from './hexGeometry';

// The pure hex math lives in `./hexGeometry` (no JSX, importable from a bare
// `node` script) — re-exported here so every existing import of this file
// keeps working unchanged. See that file's header for why the split exists.
export { hexPoints, HEX_HEIGHT_RATIO, hexEdgeMarks, hexSealPath, honeyHMax, HONEY_RUNGS, hexHoneyPoints, hexHoneyMeniscus };

// A single hexagon, sized to its own box. Used for the mini hex that marks
// a day in the week feed and for the empty seats in the comb.
export const HexShape = ({ size, fill = 'none', stroke, strokeWidth = 1.5, opacity = 1, style }) => (
  <Svg width={size * 2} height={size * 2} style={style} opacity={opacity}>
    <Polygon points={hexPoints(size)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  </Svg>
);
