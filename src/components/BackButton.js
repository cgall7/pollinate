import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { PressableScale } from './PressableScale';
import { GlassRim } from './GlassRim';

// C2 — one back-button affordance. It shipped as four: a surface card with
// shadow (CreateHive), raw glass with no shadow (SendHive/SealHive, both
// since retired by R-SEAL-1 — kept in this history because they are half of
// why the rule exists, not because the files are still there), the
// same raw glass duplicated three more times (HiveDetail/MemoryLane/
// PackageOpen), and a bare TouchableOpacity with no scale or haptic at all
// (Account/Legal/Onboarding). Two materials are legitimate — a circle on a
// plain page reads as a card and wants `shadows.card`; the same circle on a
// colour banner is glass and a drop shadow on glass over colour looks wrong
// — but every consumer gets the same size, scale, and haptic regardless of
// which material it sits on. `variant="glass"` is for banners/full-bleed
// covers; `solid` (the default) is for everything else.
//
// GL7(d′) — the glass variant gets the shared rim stack.
//
// It was never a glass surface; it is `surface`@0.40, a flat translucent fill
// wearing a glass token's name. Converting it to the real material was
// measured and declined: all four of its call sites are in-flow children of an
// opaque `banner` with the ScrollView a SIBLING BELOW, so nothing ever passes
// underneath one of these and the through-material term is identically zero.
// The lens veil would also have made it fainter (`surface`@0.35 vs 0.40:
// -0.34 to -0.69 ΔE00 body-vs-cover), which is a regression in the direction
// the ask complained about.
//
// What it was missing was the edge. On the four cover grounds the shared stack
// adds ΔE00 2.87-2.99 of hairline contribution at the rim — the same stack the
// tab capsule wears, imported rather than copied so the two cannot drift.
//
// `isGlass` is one predicate read twice on purpose: the fill and the rim have
// to arrive together, and a variant added later must not be able to get one
// without the other.
export const BackButton = ({ onPress, variant = 'solid', color, style, accessibilityLabel = 'Go back' }) => {
  const isGlass = variant === 'glass';
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.button, isGlass ? styles.glass : styles.solid, style]}
      pressedColor={theme.colors.pressedOnLight}
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name="chevron-back" size={22} color={color ?? theme.colors.ink} />
      {isGlass ? <GlassRim radius={theme.borderRadius.full} /> : null}
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solid: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.card,
  },
  glass: {
    backgroundColor: theme.colors.glassFill,
  },
});
