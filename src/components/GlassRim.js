import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

// GL7(d′) — the rim stack, in one place, because it is now worn by more than
// one surface.
//
// WHAT IT IS. Two coincident 1pt border frames: an ink hairline, then a
// translucent white rim painted over it. Borders paint inboard, so
// "coincident" is load-bearing — with equal widths the rim covers the hairline
// exactly and the hairline arrives attenuated by its transmission through the
// rim (a factor of 1 - rimAlpha). That is the model
// `GUIDES/POLLINATE_GL1_HAIRLINE_DERIVATION.md` solves the hairline's alpha
// against, and it holds only while the two widths are equal. Order is the
// other half of the mechanism: on a bright ground you read a gleam with a dark
// edge, on a dark one a dark edge with a gleam.
//
// WHY IT MOVED OUT OF `GlassBackground`. GL7(d) asked whether the five
// surfaces wearing `glass*` token names as flat fills should convert to the
// real material. Measured, the answer was no — nothing moves under any of
// them, so the through-material term is identically zero, and the lens veil
// (`surface`@0.35) is FAINTER than the flat fill (`surface`@0.40) they already
// have: -0.34 to -0.69 ΔE00 body-vs-ground on the four covers, a regression in
// exactly the direction the ask complained about. What those circles were
// missing was never refraction. It was an edge.
//
// So they get the edge, as pure borders, with no `GlassView` and nothing
// pretending to refract a static field. And they get THIS one rather than a
// copy: the capsule and the borrowers now share a single stack, so a retune of
// either alpha reaches all of them or none of them. A second copy is how the
// chrome drifts into two materials again — which is the defect C2 already
// fixed once for this exact population of buttons.
//
// NOT REDUCE-TRANSPARENCY AWARE, deliberately. `GlassBackground` drops the rim
// under Reduce Transparency because the whole blurred look is replaced by a
// solid surface there and the gleam would be describing a material that is no
// longer rendering. These borders describe no material — there is nothing
// transparent about a 1pt line — so there is nothing here for that setting to
// reduce.
export const GlassRim = ({ radius }) => (
  <>
    <View
      style={[StyleSheet.absoluteFill, styles.hairline, { borderRadius: radius }]}
      pointerEvents="none"
    />
    <View
      style={[StyleSheet.absoluteFill, styles.rim, { borderRadius: radius }]}
      pointerEvents="none"
    />
  </>
);

const styles = StyleSheet.create({
  hairline: {
    // GL7(a), 2026-08-30 — `StyleSheet.hairlineWidth` was a conformance miss,
    // not a choice: GL1_GL2_DESIGN_INTEGRATION.md § Rim Treatment rules this
    // line at 1pt, coincident with the white rim below it, and on a 3x device
    // `hairlineWidth` is 0.333pt — one third of the ruled width. It compounded
    // the alpha defect it sits next to: a one-physical-pixel band, antialiased
    // along a rounded path, at the ΔE00 the shipped 0.10 alpha could reach, is
    // at the edge of resolvability.
    //
    // 1, not `StyleSheet.hairlineWidth`, has to match `rim`'s width exactly —
    // borders paint inboard, so equal widths are what make the two frames
    // coincident and the transmission model above (0.35 through the rim) true.
    // If these two ever differ, the hairline stops being "under" the rim and
    // starts being a second visible ring outboard of it.
    borderWidth: 1,
    borderColor: theme.colors.glassHairline,
  },
  rim: {
    borderWidth: 1,
    borderColor: theme.colors.glassRim,
  },
});
