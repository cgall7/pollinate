import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, AccessibilityInfo } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { theme } from '../constants/theme';
import { GlassRim } from '../components/GlassRim';

// GL1 — the top rung. `isLiquidGlassAvailable()` is a runtime capability check
// (iOS 26 and a binary carrying the native module), so it is read ONCE at module
// scope rather than per render: it cannot change while the app is running, and a
// material that re-decides its own rung mid-session is a material that can swap
// under a user mid-scroll.
//
// **Three rungs, and the fallbacks are the ones already shipped.** Native glass
// where it exists; `BlurView` where it does not; a solid surface under Reduce
// Transparency. Nothing about the second and third rungs changes here — this is
// an addition above them, which is why it is safe to land on a demo night: on
// any device that answers false, the file renders exactly what it rendered
// before, byte for byte.
const LIQUID_GLASS = isLiquidGlassAvailable();

// Reduce Transparency is non-negotiable (spec §10): when it's on, glass
// falls back to a solid surface instead of blurring.
export const useReduceTransparency = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled?.().then(setEnabled).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceTransparencyChanged', setEnabled);
    return () => sub?.remove?.();
  }, []);

  return enabled;
};

// The glass look, in its own clipped layer: blur + cream veil + one 1pt
// specular rim on iOS, an opacity wash on Android, a solid surface under
// Reduce Transparency. Lives apart from whatever casts the shadow on
// purpose — `overflow: hidden` on the same view as the rounded corners
// clips that view's own shadow, so the rounding+clipping has to be a child.
//
// Split out of MainTabs when the bar became a capsule with a detached
// account door beside it (Option C): two separately-shadowed surfaces that
// have to read as the same material.
export const GlassBackground = ({ radius }) => {
  const reduceTransparency = useReduceTransparency();
  const clip = { borderRadius: radius, overflow: 'hidden' };

  if (reduceTransparency) {
    return <View style={[StyleSheet.absoluteFill, clip, styles.solidFallback]} />;
  }

  if (Platform.OS === 'android') {
    // Sanctioned Android fallback (spec §10): no BlurView, just a lighter
    // opacity wash — cheaper and avoids readability issues on Android's blur.
    return <View style={[StyleSheet.absoluteFill, clip, styles.androidFallback]} />;
  }

  // The rim stack, shared by both live rungs so they cannot drift apart — and
  // now, since GL7(d′), by the borrower circles as well. It lives in
  // `components/GlassRim` for that reason: one stack, four consumers, no copy
  // to drift.
  //
  // GL1 residual (a): the white rim ALONE reads weaker on glass than on blur —
  // the body is already at the top of the luminance scale, so a white line has
  // nothing left to be brighter than. The ink hairline sits UNDER it and gives
  // the white something to gleam against. Order is the mechanism: hairline
  // first, white over it, so on a bright ground you read a gleam with a dark
  // edge and on a dark one you read a dark edge with a gleam.
  //
  // (The frames spread `StyleSheet.absoluteFill`, never `absoluteFillObject` —
  // the latter does not exist in react-native 0.86.2, and spreading `undefined`
  // is legal and silent, so the rim once lost its positioning and painted as a
  // 2pt stub at the top of the bar instead of tracing its edge.)
  const rim = <GlassRim radius={radius} />;

  if (LIQUID_GLASS) {
    return (
      // GL7(b′), 2026-08-30 — `regular` -> `clear`, ruled by Lumen on measured
      // frames. `clear` is the more transparent of UIGlassEffect's two styles,
      // and the reason to take it is NOT that more gets through: at equal
      // legibility that is worth 11%, which is why GL7(b) first declined it.
      // It is that the KERNEL is half the width. Measured on device, 10-90
      // transition width across a step behind the capsule: 6.085pt on
      // `regular`, 3.172pt on `clear`, at the same 3.7311:1 glyph floor —
      // 1.9x, and corroborated by two more instruments (25-75 1.70x, gradient
      // RMS 2.08x). Colin asked for "defined", and definition is an edge
      // property that no alpha can reach: edge width came out FLAT in the veil
      // on both rungs.
      //
      // `glassEffectStyle` AND `theme.colors.glassLens` ARE ONE SETTING. The
      // style decides what the veil has to hold back; the veil is re-solved
      // against it. Moving either alone re-opens a floor that was solved on
      // frames, so `check-glass-definition.mjs` C1 pins the pair and fails
      // with the re-solve named. Same defect class as D1's coincident widths.
      <GlassView glassEffectStyle="clear" style={[StyleSheet.absoluteFill, clip]}>
        {/* GL2/GL7(b′): 0.76 here, 0.55 on the blur rung below. The pair is
            ruled; the number is not a token that moved. */}
        <View style={[StyleSheet.absoluteFill, styles.lensVeil]} />
        {rim}
      </GlassView>
    );
  }

  return (
    <BlurView intensity={60} tint="systemUltraThinMaterialLight" style={[StyleSheet.absoluteFill, clip]}>
      <View style={[StyleSheet.absoluteFill, styles.creamVeil]} />
      {rim}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  // Reduce Transparency fallback — the old solid look, no blur.
  solidFallback: {
    backgroundColor: theme.colors.surface,
  },
  androidFallback: {
    backgroundColor: theme.colors.glassVeil,
  },
  // Blur alone reads cold iOS-grey; this keeps the surface inside the
  // Sunbeam palette regardless of what's scrolling underneath.
  creamVeil: {
    backgroundColor: theme.colors.glassSheer,
  },
  lensVeil: {
    backgroundColor: theme.colors.glassLens,
  },
});
