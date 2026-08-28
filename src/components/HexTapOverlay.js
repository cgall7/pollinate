import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from 'react-native-svg';
import { theme } from '../constants/theme';
import { ringStepFor } from './combLattice';
import { useSvgId } from '../utils/svgId';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// react-native-svg's gradient `<Stop>` extraction (`extractGradient.ts`)
// takes `stopColor`'s RGB channels via `processColor` and then MASKS OUT
// whatever alpha that carried, rebuilding the pixel from `stopOpacity`
// alone. Every alpha token in this app (`withAlpha()`) IS an `rgba(...)`
// string, so handing one straight to `stopColor` renders at `stopOpacity`'s
// value, not at the product of the two — found on-device (§ Beat 1's dim
// rendered near-opaque instead of 0.25). Split it once here so the token
// stays the single source for both the colour and its alpha; this is a
// library quirk to work around, not a reason to hardcode the alpha instead.
const RGBA_RE = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/;
const stopFor = (rgbaToken) => {
  const m = RGBA_RE.exec(rgbaToken);
  if (!m) throw new Error(`stopFor(): expected an rgba() token, got '${rgbaToken}'`);
  return { rgb: `rgb(${m[1]}, ${m[2]}, ${m[3]})`, alpha: parseFloat(m[4]) };
};

/**
 * Lane D — the hex-tap's ROOM: the dim, its punch-out, and the ignition
 * bloom. One `<Svg>`, container-level, sitting between the stage and the
 * reveal card (ruling 4: GUIDES/HEX_TAP_SPEC_LUXURY_PASS.md) so the card
 * lands inside the dimmed region instead of beside it.
 *
 * Geometry is a single point — `center` (cluster-space, converted to
 * container space by the caller via the cluster's own `onLayout` origin,
 * ruling 3) — and both the punch-out and the bloom are centred on it, so
 * they cannot drift apart from one another.
 *
 * WHAT LEFT, AND WHY THE FILE IS NOW ONLY LIGHT. Beats 3-6 (the bead, its
 * neck, the fall, the pool) retired wholesale under LP-R21; their four
 * drivers and the `honeyPool` token went with them. The honey did not move
 * to a new place in this file — it moved to a DIFFERENT FILE, into the cell
 * itself (`HoneycombGrid`'s `SelectionFill`), because LP-R21's whole ruling
 * is that the honey never leaves the cell. This overlay owns everything
 * OUTSIDE the cell; nothing it draws is honey any more.
 *
 * The bloom is also the only glow left. Beat 2's rest level (`accentBurst`
 * @ 0.18) was scored to "continue at rest level for the fall + pool stages"
 * — stages that no longer exist — and holding it for the whole selected
 * state instead would make `accentBurst` a static wash on the page, which
 * its own token text forbids in as many words ("Motion only … never a
 * static fill, text, or background"): measured ΔE00 6.4364 against the
 * dimmed page, well clear of a JND, so that is a real wash and not a
 * technicality. What holds the cell lit is the PUNCH-OUT — the tapped cell
 * simply is not dimmed, ΔE00 16.8633 / ΔL* +18.7240 against its own
 * neighbours on washYellow (25.7166 / +18.8619 on washSky). LP-R21's own
 * words: "illumination outside the cell, held honey inside it."
 */
export const HexTapOverlay = ({
  width,
  height,
  center,
  cellSize,
  cameraProgress,
  revealProgress,
  glowBloomOpacity,
}) => {
  const dimId = useSvgId('hexScrimDim');
  const bloomId = useSvgId('hexScrimBloom');

  if (!center || !width || !height) return null;

  // R7 (First-Build Review): a dim that holds at full strength to the edge
  // of its own box is a mask, not a light — the container is narrower than
  // the comb's worst-case reach, so any radius that fully covers the comb
  // also hits the box edge at full strength. Falloff, not coverage: `R` is
  // 3 ringsteps out, and a third stop releases back to transparent before
  // the box edge. `punchStop`/`fullStop` stay fractions of `R`, never
  // typed, so `punchStop · R === cellSize` and `fullStop · R ===
  // ringStepFor(cellSize)` hold structurally if `cellSize` ever retunes.
  const R = 3 * ringStepFor(cellSize);
  const punchStop = cellSize / R;
  const fullStop = ringStepFor(cellSize) / R; // = 1/3, independent of cellSize

  // R5 (First-Build Review, BLOCKING): `shadowRadius` is a blur spread
  // measured outward from a view's EDGE; an SVG `RadialGradient`'s `r` is a
  // total extent measured from a CENTRE. Used directly, `bloom` (24pt)
  // lands inside the punch-out's transparent radius (`cellSize` = 44pt) —
  // the glow can only ever paint on ground the scrim already left undimmed,
  // which is why it measured cooler than neutral on-device instead of
  // reading as light. Converting the frame means the blur begins at the
  // punch-out's own edge, not at `center`.
  const bloom = theme.shadows.glow(theme.colors.accentBurst, 'bloom');
  const bloomR = cellSize + bloom.shadowRadius; // 44 + 24 = 68pt
  // R10 (R5/R7 Build Review, BLOCKING): converting `r` alone kept the
  // gradient's shape a point-emitter cone peaking at `center` — a View
  // shadow is a blurred COPY OF THE SHAPE, full strength across the whole
  // view and falling off only past its edge. `plateauStop` restates that
  // shape: flat at `shadowOpacity` out to the cell's own vertices, then the
  // `shadowRadius` band falls to 0. Same conversion, one more stop — the
  // function crossed the frame this time, not just the scalar.
  const bloomPlateauStop = cellSize / bloomR; // 44 / 68 = 0.64706
  const dim = stopFor(theme.colors.spotlightDim);

  // Ruling 3(b): the scrim is exactly as transparent as its geometry is
  // wrong during the camera dive, and hits full strength once the transform
  // lands identity. Wrapping the whole overlay in `cameraProgress` extends
  // that guard to the bloom too — it is drawn at the same container-space
  // point and carries the same risk.
  //
  // ONE ENVELOPE, NOT TWO. This used to be `multiply(revealProgress,
  // honeyDecay)`, where `honeyDecay` was Beat 6's own decay ramp. Beat 6
  // retired, and rather than re-point its driver at the release, the value
  // went with it: `revealProgress` already rises with the card and now
  // falls with it too, so "scrim and fill release together" (LP-R21) is a
  // property of there being one driver, not of two being kept in step.
  const dimOpacity = revealProgress;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: cameraProgress }]} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id={dimId} cx={center.x} cy={center.y} r={R} gradientUnits="userSpaceOnUse">
            <Stop offset={punchStop} stopColor={dim.rgb} stopOpacity="0" />
            <Stop offset={fullStop} stopColor={dim.rgb} stopOpacity={dim.alpha} />
            <Stop offset={1} stopColor={dim.rgb} stopOpacity="0" />
          </RadialGradient>
          {/* Bloom opacity reads straight off `shadows.glow()` so a
              View-shadow retune moves this for free; radius is the SAME
              level converted into the gradient's frame (`bloomR` above),
              never `shadowRadius` directly — see R5. Middle stop
              (`bloomPlateauStop`) restates the View shadow's flat interior
              before the blur band falls off — see R10; the cone-vs-plateau
              distinction is the whole fix. */}
          <RadialGradient id={bloomId} cx={center.x} cy={center.y} r={bloomR} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={theme.colors.accentBurst} stopOpacity={bloom.shadowOpacity} />
            <Stop offset={bloomPlateauStop} stopColor={theme.colors.accentBurst} stopOpacity={bloom.shadowOpacity} />
            <Stop offset="1" stopColor={theme.colors.accentBurst} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <AnimatedRect x={0} y={0} width={width} height={height} fill={`url(#${dimId})`} opacity={dimOpacity} />
        <AnimatedCircle cx={center.x} cy={center.y} r={bloomR} fill={`url(#${bloomId})`} opacity={glowBloomOpacity} />
      </Svg>
    </Animated.View>
  );
};
