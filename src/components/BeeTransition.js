import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { MascotBee } from './MascotBee';
import { facingFor } from './beeAttitude';
import {
  beeTransitionEasing,
  beeTransitionMotionPlan,
  beeTransitionStartPlan,
  buildBeeTransitionTrack,
  replaceActiveBeeTransitionTravel,
} from './beeTransitionRoles';
import { DURATIONS, useReducedMotionState } from '../constants/motion';

// MP-1: every caller declares a narrative role. The role owns duration,
// trajectory, retrigger behavior, and RM substitute; call sites no longer
// tune local paths or inherit a default personality.
export const BeeTransition = ({ triggerKey, role, anchorStyle, size = 32 }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const { reduced, resolved } = useReducedMotionState();
  const [flying, setFlying] = useState(false);
  const [settledPresent, setSettledPresent] = useState(false);
  const [renderMode, setRenderMode] = useState('idle');
  const lastTriggerRef = useRef(triggerKey);
  const activeRef = useRef(false);
  const settledRef = useRef(false);
  const modeRef = useRef('idle');
  const animationRef = useRef(null);
  const track = buildBeeTransitionTrack(role);

  const finishFlight = () => {
    activeRef.current = false;
    settledRef.current = true;
    animationRef.current = null;
    if (track.end === 'present') setSettledPresent(true);
    else setFlying(false);
  };

  const startFlight = (mode) => {
    activeRef.current = true;
    settledRef.current = false;
    modeRef.current = mode;
    setRenderMode(mode);
    setSettledPresent(false);
    setFlying(true);
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: mode === 'substitute' ? DURATIONS.reducedMotionFade : track.durationMs,
      easing: mode === 'substitute' ? Easing.linear : beeTransitionEasing(track.easing, Easing),
      useNativeDriver: true,
    });
    animationRef.current = animation;
    animation.start(({ finished }) => {
      if (finished && animationRef.current === animation) finishFlight();
    });
  };

  useEffect(() => {
    const plan = beeTransitionStartPlan({
      role,
      triggerKey,
      lastTriggerKey: lastTriggerRef.current,
      active: activeRef.current,
      settled: settledRef.current,
    });
    if (plan.shouldRecordTrigger) lastTriggerRef.current = triggerKey;
    if (!plan.shouldStart) return;

    startFlight(beeTransitionMotionPlan({ resolved, reduced, active: false, mode: modeRef.current }).mode);
  }, [triggerKey, role]);

  useEffect(() => {
    const plan = beeTransitionMotionPlan({ resolved, reduced, active: activeRef.current, mode: modeRef.current });
    if (!plan.replaceActiveTravel) return;
    replaceActiveBeeTransitionTravel({
      animation: animationRef.current,
      setRenderMode,
      startSubstitute: () => startFlight('substitute'),
    });
  }, [resolved, reduced]);

  useEffect(() => () => {
    animationRef.current?.stop?.();
  }, []);

  if (!flying && !settledPresent) return null;

  const facing = facingFor(track.translateX[track.translateX.length - 1] - track.translateX[0], size, 1);

  if (renderMode === 'substitute') {
    const opacity = track.end === 'present'
      ? progress
      : progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] });
    return (
      <Animated.View
        pointerEvents="none"
        style={[styles.wrap, anchorStyle, { opacity }]}
      >
        <MascotBee size={size} />
      </Animated.View>
    );
  }

  const translateX = progress.interpolate({ inputRange: track.inputRange, outputRange: track.translateX });
  const translateY = progress.interpolate({ inputRange: track.inputRange, outputRange: track.translateY });
  const rotate = progress.interpolate({
    inputRange: track.inputRange,
    outputRange: track.rotate.map((deg) => `${parseFloat(deg) * facing}deg`),
  });
  const opacity = track.end === 'present'
    ? progress.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 1, 1] })
    : progress.interpolate({ inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        anchorStyle,
        { opacity, transform: [{ translateX }, { translateY }, { rotate }, { scaleX: facing }] },
      ]}
    >
      <MascotBee size={size} flutter={!settledPresent} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: '38%',
    left: '30%',
    zIndex: 10,
  },
});
