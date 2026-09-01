import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { HiveStore } from '../services/HiveStore';
import { hiveCoverTheme } from '../constants/hiveThemes';
import { PressableScale } from '../components/PressableScale';
import { GlassRim } from '../components/GlassRim';
import { PrimaryButton } from '../components/PrimaryButton';
import { PaperBlock, paperInk } from '../components/PaperBlock';
import { useReducedMotion } from '../constants/motion';
import {
  NATIVE_REVEAL_GRAMMAR,
  buildRevealSequence,
  startReveal,
  tapReveal,
  dwellProgress,
  arrivalProgress,
  dwellMs,
  arrivalMs,
  normalRevealCardOpacityAtMs,
  normalRevealCardOpacitySegmentEasing,
  normalRevealDateOpacityBreakpoint,
  REVEAL_DATE_ONSET_MS,
} from '../components/revealSequencer';

// 8b.4 Trip Down Memory Lane — the author's own bloom moment
// (`docs/strategy/Pollinate_Delivery_Slices.md` §8b.4, Colin's Slice 1
// ruling 2026-08-17: "build write-and-review first"). This is the FIRST of
// the reveal engine's two mount points; `src/components/revealSequencer.js`
// stays the single engine per the ruling in its own header — this file only
// supplies what that engine deliberately has no opinion about (ruling 5):
// what feeds the sequence (the hive's own entries, not a curated package)
// and what an ending is (return to the hive, never a reply prompt — that is
// package-open's shape, 8b.6, not this one).
//
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// `step.at` is a UTC midnight epoch (`revealSequencer.parseCalendarDate`) —
// reading it back with UTC getters is what keeps this on the same calendar
// day the engine validated, matching that module's own local-midnight
// convention rather than letting a bare `Date` shift it across a timezone.
const formatRevealDate = (atMs) => {
  const d = new Date(atMs);
  const month = MONTH_NAMES[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  const thisYear = new Date().getUTCFullYear();
  return year === thisYear ? `${month} ${day}` : `${month} ${day}, ${year}`;
};

export const MemoryLaneScreen = ({ navigation, route }) => {
  const { hiveId, subjectName, coverTheme } = route.params;
  const cover = hiveCoverTheme(coverTheme);
  const reduced = useReducedMotion();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sequence, setSequence] = useState(null);
  const [revealState, setRevealState] = useState(null);
  const arrivalProgressAnim = useRef(new Animated.Value(0)).current;
  const dwellProgressAnim = useRef(new Animated.Value(0)).current;
  const spatialFrozenStepRef = useRef(null);
  const lastReducedRef = useRef(reduced);
  const arrivalRenderedRef = useRef(0);
  const arrivalStepKeyRef = useRef(null);
  const arrivalGenerationRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const entries = await HiveStore.getHiveEntries(hiveId);
          if (cancelled) return;
          const seq = buildRevealSequence(entries);
          const now = Date.now();
          setSequence(seq);
          setRevealState(seq.length > 0 ? startReveal(now) : { index: 0, arrivedAtMs: now, done: true });
          setError(false);
        } catch (err) {
          if (cancelled) return;
          console.warn('MemoryLaneScreen: failed to load hive entries', err);
          setError(true);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [hiveId])
  );

  useEffect(() => {
    if (!sequence || !revealState || revealState.done) return undefined;
    const now = Date.now();
    const initial = dwellProgress(revealState, now, sequence, NATIVE_REVEAL_GRAMMAR);
    const stepDwellMs = dwellMs(NATIVE_REVEAL_GRAMMAR, sequence[revealState.index]);
    dwellProgressAnim.setValue(initial);
    const remaining = Math.max(0, stepDwellMs - (now - revealState.arrivedAtMs));
    const animation = Animated.timing(dwellProgressAnim, {
      toValue: 1,
      duration: remaining,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence, revealState?.index, revealState?.arrivedAtMs, revealState?.done]);

  // Bloom entrance. Ruling 3: Reduce Motion substitutes the arrival with a
  // crossfade and leaves the floor (the rail effect above) untouched — the
  // arrival is the only thing that shortens.
  useEffect(() => {
    const sub = arrivalProgressAnim.addListener(({ value }) => {
      arrivalRenderedRef.current = value;
    });
    return () => arrivalProgressAnim.removeListener(sub);
  }, [arrivalProgressAnim]);

  useEffect(() => {
    if (!sequence || !revealState || revealState.done) return undefined;
    const now = Date.now();
    const elapsed = now - revealState.arrivedAtMs;
    const sameStep = arrivalStepKeyRef.current === revealState.arrivedAtMs;
    const toggledIntoReduced = reduced && lastReducedRef.current === false;
    if (reduced) spatialFrozenStepRef.current = revealState.index;
    const spatialFrozen = spatialFrozenStepRef.current === revealState.index;
    const activeReducedRegister = reduced || spatialFrozen;
    const duration = arrivalMs(NATIVE_REVEAL_GRAMMAR, activeReducedRegister);
    arrivalStepKeyRef.current = revealState.arrivedAtMs;
    lastReducedRef.current = reduced;
    let animation = null;
    const generation = arrivalGenerationRef.current + 1;
    arrivalGenerationRef.current = generation;
    const startFrom = (initial) => {
      if (arrivalGenerationRef.current !== generation) return;
      arrivalProgressAnim.setValue(initial);
      arrivalRenderedRef.current = initial;
      if (initial >= 1) return;
      const firstKeyframe = 0.92;
      const animations = [];
      if (!activeReducedRegister && initial < firstKeyframe) {
        animations.push(Animated.timing(arrivalProgressAnim, {
          toValue: firstKeyframe,
          duration: Math.max(0, 300 - elapsed),
          easing: normalRevealCardOpacitySegmentEasing(elapsed, 300, NATIVE_REVEAL_GRAMMAR),
          useNativeDriver: true,
        }));
      }
      animations.push(Animated.timing(arrivalProgressAnim, {
        toValue: 1,
        duration: Math.max(0, duration - Math.max(elapsed, activeReducedRegister ? 0 : 300)),
        easing: activeReducedRegister
          ? Easing.linear
          : normalRevealCardOpacitySegmentEasing(Math.max(elapsed, 300), NATIVE_REVEAL_GRAMMAR.bloomMs, NATIVE_REVEAL_GRAMMAR),
        useNativeDriver: true,
      }));
      animation = Animated.sequence(animations);
      animation.start();
    };
    if (sameStep && (toggledIntoReduced || spatialFrozen)) {
      arrivalProgressAnim.stopAnimation((value) => {
        arrivalRenderedRef.current = value;
        startFrom(value);
      });
    } else {
      startFrom(arrivalProgress(revealState, now, NATIVE_REVEAL_GRAMMAR, reduced));
    }
    return () => {
      arrivalGenerationRef.current += 1;
      animation?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence, revealState?.index, revealState?.arrivedAtMs, revealState?.done, reduced]);

  const handleTap = () => {
    if (!sequence || !revealState) return;
    const next = tapReveal(revealState, Date.now(), sequence, NATIVE_REVEAL_GRAMMAR);
    // Ruling 2: an early tap comes back referentially identical — nothing
    // to do, and nothing queued for when the floor does pass.
    if (next === revealState) return;
    arrivalProgressAnim.stopAnimation();
    dwellProgressAnim.stopAnimation();
    arrivalProgressAnim.setValue(0);
    dwellProgressAnim.setValue(0);
    arrivalRenderedRef.current = 0;
    arrivalStepKeyRef.current = null;
    arrivalGenerationRef.current += 1;
    spatialFrozenStepRef.current = null;
    Haptics.selectionAsync();
    setRevealState(next);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: cover.base }]}>
        <ActivityIndicator color={theme.colors.ink} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: cover.base }]}>
        <PressableScale onPress={() => navigation.goBack()} containerStyle={styles.closeButtonAnchor} style={styles.closeButton} accessibilityLabel="Close">
          <Ionicons name="close" size={22} color={cover.textColor} />
          <GlassRim radius={theme.borderRadius.full} />
        </PressableScale>
        <Text style={styles.emptyTitle}>We couldn't reach this hive.</Text>
        <Text style={styles.emptyBody}>Check your connection and try again.</Text>
      </View>
    );
  }

  const step = sequence && revealState && !revealState.done ? sequence[revealState.index] : null;
  const spatialFrozen = reduced || spatialFrozenStepRef.current === revealState?.index;
  const cardOpacity = arrivalProgressAnim;
  const cardScale = spatialFrozen
    ? 1
    : arrivalProgressAnim.interpolate({
        inputRange: [0, 0.92, 1],
        outputRange: [0.965, 1.008, 1],
      });
  const cardTranslateY = spatialFrozen
    ? 0
    : arrivalProgressAnim.interpolate({
        inputRange: [0, 0.92, 1],
        outputRange: [6, 0, 0],
      });
  const dateOpacity = arrivalProgressAnim.interpolate({
    inputRange: [
      0,
      spatialFrozen
        ? REVEAL_DATE_ONSET_MS / arrivalMs(NATIVE_REVEAL_GRAMMAR, true)
        : normalRevealDateOpacityBreakpoint(NATIVE_REVEAL_GRAMMAR),
      1,
    ],
    outputRange: [0, 1, 1],
  });
  const dateTranslateY = spatialFrozen
    ? 0
    : arrivalProgressAnim.interpolate({
        inputRange: [0, normalRevealDateOpacityBreakpoint(NATIVE_REVEAL_GRAMMAR), 1],
        outputRange: [3, 0, 0],
      });

  return (
    <View style={[styles.container, { backgroundColor: cover.base }]}>
      <PressableScale
        onPress={() => navigation.goBack()}
        containerStyle={styles.closeButtonAnchor} style={styles.closeButton}
        accessibilityLabel="Close memory lane"
      >
        <Ionicons name="close" size={22} color={cover.textColor} />
        <GlassRim radius={theme.borderRadius.full} />
      </PressableScale>

      {step ? (
        <Pressable
          style={styles.tapArea}
          onPress={handleTap}
          accessibilityRole="button"
          accessibilityLabel="Tap to continue to the next memory"
        >
          <View style={styles.entryFrame} pointerEvents="box-none">
            <Animated.Text
              style={[
                styles.date,
                { color: cover.textColor, opacity: dateOpacity, transform: [{ translateY: dateTranslateY }] },
              ]}
            >
              {formatRevealDate(step.at)}
            </Animated.Text>
            <Animated.View
              style={[
                styles.entryCard,
                { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }, { scale: cardScale }] },
              ]}
            >
              <ScrollView contentContainerStyle={styles.entryScroll} showsVerticalScrollIndicator={false}>
                <PaperBlock paper={step.paper}>
                  <Text style={[styles.entryText, { color: paperInk(step.paper) }]}>{step.text}</Text>
                </PaperBlock>
              </ScrollView>
            </Animated.View>
            <View style={styles.railTrack}>
              <Animated.View style={[styles.railFill, { transform: [{ scaleX: dwellProgressAnim }] }]} />
            </View>
          </View>
        </Pressable>
      ) : (
        <View style={styles.ending}>
          <Text style={[styles.endingTitle, { color: cover.textColor }]}>
            {sequence && sequence.length > 0
              ? `That's every memory of ${subjectName || 'this hive'}, so far.`
              : 'No memories yet.'}
          </Text>
          <PrimaryButton onPress={() => navigation.goBack()}>Return to hive</PrimaryButton>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  // R43 CHANNEL (Lumen, 2026-08-29, MVP1 screen pass): positioning belongs on
  // `containerStyle`, never `style`. `PressableScale` puts `style` on its inner
  // Animated.View and `containerStyle` on the outer Pressable — so an absolute
  // inset written to `style` is resolved against the Pressable's own collapsed
  // box instead of this screen, and the control renders wherever flow drops it.
  // Photographed mid-screen on PackageOpen and MemoryLane before this split.
  closeButtonAnchor: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 1,
  },
  // GL7(d′) — `glassFill` (`surface`@0.40) STAYS. This circle floats over a
  // flat `cover.base` with its scroll region inset below it by construction,
  // so nothing ever passes underneath it and converting it to the real lens
  // would buy zero refraction while making the body FAINTER (`surface`@0.35:
  // -0.34 to -0.69 ΔE00 body-vs-cover on the four covers). Its definition
  // comes from the shared `<GlassRim>` above instead — same stack as the tab
  // capsule, 2.87-2.99 ΔE00 of hairline contribution at the edge.
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.glassFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapArea: {
    flex: 1,
  },
  entryFrame: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 48,
  },
  date: {
    ...theme.type.h3,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  entryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.lg,
    maxHeight: '62%',
    ...theme.shadows.floating,
  },
  entryScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  entryText: {
    ...theme.type.bodyLg,
    color: theme.colors.ink,
  },
  railTrack: {
    height: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.trackDim,
    marginTop: theme.spacing.lg,
    overflow: 'hidden',
  },
  railFill: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.ink,
    transformOrigin: 'left center',
  },
  ending: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  endingTitle: {
    ...theme.type.h2,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.type.h2,
    color: theme.colors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyBody: {
    ...theme.type.body,
    color: theme.colors.inkSoft,
    textAlign: 'center',
  },
});
