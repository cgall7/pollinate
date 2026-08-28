import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { theme } from '../constants/theme';
import { BLOOM, BLOOM_EASING, useReducedMotionState } from '../constants/motion';
import { useSvgId } from '../utils/svgId';

// The ambient light behind the lock/reflection moments, and — since MB-D1 —
// the one-shot stage light that announces a ceremony hero.
//
// This replaces the flat `backgroundColor` circles those screens used to
// draw: a solid disc at 10-25% opacity has a hard edge no matter how low
// you take the opacity, so it read as a pale yellow *shape* sitting on the
// cream rather than light falling across it. A radial gradient that runs
// the accent out to fully transparent has no edge to see.
//
// THREE MODES, AND THE THIRD EXCLUDES THE FIRST:
//
//   * static  — nothing passed. A warm ground that holds.
//   * breathe — `breathe`. Ambient, 2400ms, reduced-motion aware.
//   * staged  — `staged`. One-shot: entrance on true, fade on false.
//
// `breathe` and `staged` throw when passed together rather than one winning
// silently. MB-D1 rules the stage light "one-shot, never ambient", so a
// breathing stage light is not a configuration this component has an
// opinion about — it is the score's central constraint spelled as a call.
// Same reasoning as `theme.shadows.glow`'s unknown-level throw: a design
// decision made by a spelling mistake is the failure being prevented.
//
// ONE HUE, NOT THREE (Pixel, 2026-08-28 — measured; MB-D1's stop stack is
// struck). The score asked for `accent` core / `accentDeep` middle ring /
// `washYellow` outer. Composited over Today's own ground (`background`
// #FFF7CC) at the shipped geometry, that stack:
//
//   * puts the bloom's DARKEST point in a RING rather than at its core —
//     L* minimum 1.474 below the core, and invariant under where the middle
//     stop is placed (swept 0.25..0.85, the minimum tracks the stop). The
//     mechanism is already ruled two files away: on this cream `accentDeep`
//     is -12.00 L* against the ground and `accent` only -4.38 (theme.js,
//     `shadows.glow`). A light centre inside a dark annulus is a halo, not
//     a spotlight;
//   * cannot render its third stop at all. `washYellow` fully OPAQUE on
//     Sunlit Honey is dE00 1.766 — below a JND before any opacity is
//     applied; as scored (10-20%, through the layer opacity) it is 0.079
//     to 0.158. A stop that is invisible at 100% is not a colour in the
//     stack, it is a more expensive spelling of "transparent".
//
// The shipped one-hue ramp is monotone — minimum AT the core, rising to the
// ground — which is the profile of a concentration of light. Identity comes
// from `color` and strength from `intensity` (§34), never from a stop stack.
//
// REDUCED MOTION KEEPS THE PIGMENT. The score's reduced variant swaps the
// bloom to a `washYellow` flood; by the measurement above that renders
// nothing at all on Today, so the reduced user would lose the stage rather
// than lose the motion. Reduced motion removes the entrance and the fade,
// not the light (R16: "burst -> single soft glow", never "no glow").
//
// The staged branch reads `useReducedMotionState`, not the boolean hook,
// and holds at zero until `resolved`. It is the case that hook exists for:
// a one-shot that must not run at all under Reduce Motion cannot assume
// full motion while the async read is in flight, or the reduced user sees
// the front of an entrance and then a snap — which is a motion. The
// breathe branch still deps on `reduced` alone and is unchanged by this:
// `reduced` is false in both hooks until the read lands, so that effect's
// dep tuple never moves for a Reduce-Motion-off user and the loop is not
// restarted (the extra render is free; `pulse` and the gradient id are
// refs).
export const GlowOrb = ({
  size,
  color = theme.colors.accent,
  intensity = 0.5,
  breathe = false,
  staged,
  style,
}) => {
  if (breathe && staged !== undefined) {
    throw new Error(
      'GlowOrb: `breathe` and `staged` are mutually exclusive. MB-D1 rules the ' +
        'stage light one-shot, never ambient — a bloom that keeps moving after ' +
        'it has announced its hero is ambient light wearing a ceremony name.'
    );
  }

  const { reduced, resolved } = useReducedMotionState();
  const pulse = useRef(new Animated.Value(0.5)).current;
  const stage = useRef(new Animated.Value(0)).current;
  const gradientId = useSvgId('glowOrb');
  const staging = staged !== undefined;

  useEffect(() => {
    if (!breathe || reduced) {
      pulse.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe, reduced, pulse]);

  useEffect(() => {
    if (!staging || !resolved) return undefined;
    if (reduced) {
      stage.setValue(staged ? 1 : 0);
      return undefined;
    }
    const anim = Animated.timing(stage, {
      toValue: staged ? 1 : 0,
      duration: staged ? BLOOM.entrance : BLOOM.fade,
      easing: staged ? BLOOM_EASING.entrance : BLOOM_EASING.fade,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [staging, staged, reduced, resolved, stage]);

  // One driver per value in each branch — `pulse` OR `stage`, never both
  // composed, because a value with two animations running has one of them
  // silently stopped (AnimatedValue holds a single `_animation`).
  //
  // Note what this fixes on the way past: the breathe branch's opacity
  // interpolates [0,1] -> [intensity*0.75, intensity], and a NON-breathing
  // orb holds `pulse` at 0.5, so `intensity` has always rendered at 0.875x
  // its own value there. The staged branch reaches `intensity` exactly,
  // which is what §34 says the prop means. The three merged static/breathe
  // call sites keep their shipped numbers untouched.
  const opacity = staging
    ? stage.interpolate({ inputRange: [0, 1], outputRange: [0, intensity] })
    : pulse.interpolate({ inputRange: [0, 1], outputRange: [intensity * 0.75, intensity] });
  const scale = staging
    ? stage.interpolate({ inputRange: [0, 1], outputRange: [BLOOM.entranceScale, 1] })
    : pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.orb, { width: size, height: size, opacity, transform: [{ scale }] }, style]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="55%" stopColor={color} stopOpacity="0.45" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gradientId})`} />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
  },
});
