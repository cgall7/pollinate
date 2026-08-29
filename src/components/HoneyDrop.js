import React, { useMemo } from 'react';
import Svg, { Circle, ClipPath, Defs, Line } from 'react-native-svg';
import { theme } from '../constants/theme';
import { useSvgId } from '../utils/svgId';
import { HONEY_MENISCUS_STROKE } from './hexGeometry';
import { DROP_MENISCUS_DEPTH_FRACTION, dropRadiusForAmount } from './nectarFlight';

// THE DROP — one object, one fill, everywhere (R-N3.2, Lumen 2026-08-29).
//
// > The drop is ONE OBJECT with ONE fill: `accentDeep @ 0.5` over its own
// > opaque `surface` backing. It carries that backing at every call site, on
// > every path, for its whole life — lift-off, travel, and absorption. There
// > is no unbacked spelling of the drop anywhere in this spec.
//
// THE BACKING IS THE WHOLE POINT AND IT IS NOT A STYLE CHOICE. `accentDeep`
// at half opacity is a GLAZE: whatever is behind it is half of what you see.
// Measured over the ten grounds this object actually crosses — `surface`,
// four bare `cover.base` tokens, those same four under `scrim`, and
// `paperEvening` — an unbacked drop is ten different colours, drifting up to
// dE00 32.34 on the dark paper, where it composites to (156,84,16): a dark
// brown, at the exact moment the beat's only claim is that the thing you
// send is made of the thing you hold. Backed it is (255,188,127) on all ten
// BY CONSTRUCTION, and the population question closes permanently rather
// than per-path.
//
// This is `HoneyFill`'s own three-layer recipe, moved one layer down and not
// re-derived: `surface` polygon, `accentDeep` at `fillOpacity` 0.5, `ink`
// meniscus at `HONEY_MENISCUS_STROKE`. R55, literally — reuse the mechanism,
// never re-derive the pigment per ground.
//
// The meniscus is the drop's HIGHLIGHT (R-N3: "the ink meniscus as its
// highlight"), so it sits in the upper quarter rather than across the middle
// — `DROP_MENISCUS_DEPTH_FRACTION`, which is also the number the radius
// floor is derived from, so the two cannot drift. CLIPPED to the body: the
// chord's ends touch the circle, and a 1.5pt stroke centred on it would
// otherwise hang 0.75pt outside the object on both sides — a highlight with
// horns.
export const HoneyDrop = ({ radius, style, opacity = 1 }) => {
  const r = Number(radius);
  const clipId = useSvgId('honeydrop');
  const meniscus = useMemo(() => {
    // y at `DROP_MENISCUS_DEPTH_FRACTION` of the DIAMETER below the crown;
    // half-width is the circle's own half-chord there.
    const y = 2 * r * DROP_MENISCUS_DEPTH_FRACTION;
    const dy = r - y;
    const hw = Math.sqrt(Math.max(0, r * r - dy * dy));
    return { y, x1: r - hw, x2: r + hw };
  }, [r]);
  if (!Number.isFinite(r) || r <= 0) return null;
  return (
    <Svg width={r * 2} height={r * 2} style={style} opacity={opacity} pointerEvents="none">
      <Defs>
        <ClipPath id={clipId}>
          <Circle cx={r} cy={r} r={r} />
        </ClipPath>
      </Defs>
      <Circle cx={r} cy={r} r={r} fill={theme.colors.surface} />
      <Circle cx={r} cy={r} r={r} fill={theme.colors.accentDeep} fillOpacity={0.5} />
      <Line
        x1={meniscus.x1}
        y1={meniscus.y}
        x2={meniscus.x2}
        y2={meniscus.y}
        stroke={theme.colors.ink}
        strokeWidth={HONEY_MENISCUS_STROKE}
        clipPath={`url(#${clipId})`}
      />
    </Svg>
  );
};

// The drop sized to a gift, which is the only sizing R-N3 gives it. Kept
// here rather than at the call sites so "how big is this gift" has one
// answer and the door (R-N6) and the flight read the same function.
export const HoneyDropForAmount = ({ amount, style, opacity }) => (
  <HoneyDrop radius={dropRadiusForAmount(amount)} style={style} opacity={opacity} />
);
