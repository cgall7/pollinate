import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon, Circle, Defs, ClipPath } from 'react-native-svg';
import { theme } from '../../constants/theme';
import { HONEY, HONEY_EASING, useReducedMotion } from '../../constants/motion';
import { hexTap } from '../../constants/haptics';
import { hexPoints } from '../../components/HexShape';
import { useSvgId } from '../../utils/svgId';
import { PrimaryButton } from '../../components/PrimaryButton';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Luxury pass, Lane D — a device rig for the hex tap's remaining primitives,
// deliberately NOT wired into any navigator or screen. Nobody routes here;
// open it by swapping it in as App.js's root for a device pass, the same way
// every prior device-gate screenshot in this repo has been taken, then
// revert the swap.
//
// REBUILT 2026-08-28 for MB-D2b. What used to be here was a bead that
// swelled, necked, fell and pooled — a PLACEHOLDER geometry ("good enough to
// feel each phase's timing"), written under Lumen's "don't guess the
// choreography, you'll build it twice." LP-R21 retired all four of those
// beats, so the placeholder was instrumenting nothing.
//
// It is not replaced with a second placeholder. `hexPoints` and
// `HONEY`/`HONEY_EASING` are imported LIVE and are the same expressions the
// shipped cell uses — the only thing this file invents is the SIZE (90pt
// circumradius, against the comb's 44), because the one thing a rig can show
// that the comb cannot is the curve at a scale where you can see it. A rig
// that re-typed the curve would only be checking what it did not inherit.
//
// What you are looking for, at 90pt: the circle covers 90.7% of the hexagon
// by the time it reaches the edge midpoints, and spends its last 64.7ms
// creeping into the six corners. That is the settle, and it is geometry, not
// score — nobody chose it, so it is worth confirming it reads as honey
// finding the corners rather than as the animation being late.
export const LuxuryPrimitivesHarness = () => {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState('rest');
  const fill = useRef(new Animated.Value(0)).current;
  const clipId = useSvgId('harnessCell');

  const SIZE = 90;

  const runFill = () => {
    fill.setValue(0);
    hexTap.contact();

    if (reduced) {
      // LP-R21's reduced-motion line: final value, no sweep. Same branch the
      // shipped cell takes — `setValue`, not a short timing.
      setPhase('held (reduced motion)');
      fill.setValue(1);
      return;
    }

    setPhase('filling');
    Animated.timing(fill, {
      toValue: 1,
      duration: HONEY.fill,
      easing: HONEY_EASING.fill,
      useNativeDriver: false,
    }).start(() => setPhase('held'));
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Hex tap — fill and hold (instrument, not score)</Text>
      <Text style={styles.phase}>
        phase: {phase} · {HONEY.fill}ms · circumradius {SIZE}pt
      </Text>

      <View style={styles.stage}>
        <Svg width={SIZE * 2} height={SIZE * 2}>
          <Defs>
            <ClipPath id={clipId}>
              <Polygon points={hexPoints(SIZE)} />
            </ClipPath>
          </Defs>
          <Polygon points={hexPoints(SIZE)} fill={theme.colors.surface} />
          <Polygon points={hexPoints(SIZE)} fill={theme.colors.washYellow} />
          <AnimatedCircle
            cx={SIZE}
            cy={SIZE}
            r={fill.interpolate({ inputRange: [0, 1], outputRange: [0, SIZE] })}
            fill={theme.colors.accent}
            clipPath={`url(#${clipId})`}
          />
          <Polygon points={hexPoints(SIZE)} fill="none" stroke={theme.colors.ink} strokeWidth={2.5} />
        </Svg>
      </View>

      <PrimaryButton onPress={runFill}>Trigger fill</PrimaryButton>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  heading: {
    ...theme.type.h3,
    color: theme.colors.ink,
    textAlign: 'center',
  },
  phase: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
