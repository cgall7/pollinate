import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { SPRINGS, DURATIONS, DIVE_ODOMETER } from '../constants/motion';
import { PaperBlock, paperInk, paperInkSoft, entryVoice } from './PaperBlock';
import { computeDiveDateRoll } from '../utils/combDiveDate';
import { longDate } from '../screens/HiveDetail';

// The memory paper — R-CD-4/-5/-6/-7. Absolutely positioned inside
// EntryCombGrid's card, inset PAPER_INSET on every side, riding the same
// `dive` value the camera/wax-shadow/backlight terms in EntryCombGrid ride —
// one driver, per R-CD-1.
const DISMISS_DRAG_PX = 220; // full-strength drag distance to pull `dive` 1 -> 0
const DISMISS_COMMIT_PX = 90;
const DISMISS_COMMIT_VELOCITY = 0.8; // px/ms — RN gestureState units

export const CombDivePaper = ({ dive, reduced, entries, cellSize, paperInset, paperStart, onDismiss }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const pageOffset = useRef(new Animated.Value(0)).current;

  const dragAxisRef = useRef(null);
  const diveStartRef = useRef(0);
  const pageStartRef = useRef(0);
  const dismissArmedRef = useRef(false); // R-CD-6 "dismiss threshold crossed — soft tick, re-arms on crossing back"

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
        onPanResponderGrant: () => {
          dragAxisRef.current = null;
          dismissArmedRef.current = false;
          dive.stopAnimation((v) => {
            diveStartRef.current = v;
          });
          pageOffset.stopAnimation((v) => {
            pageStartRef.current = v;
          });
        },
        onPanResponderMove: (_, g) => {
          if (!dragAxisRef.current) {
            dragAxisRef.current = Math.abs(g.dx) > Math.abs(g.dy) ? 'x' : 'y';
          }
          if (dragAxisRef.current === 'y') {
            // R-CD-1 velocity transfer / interruptibility — the drag directly
            // retargets the shared driver from wherever it is, never a
            // separate "peel" value that gets reconciled with `dive` later.
            if (g.dy > 0) {
              dive.setValue(Math.max(0, Math.min(1, diveStartRef.current - g.dy / DISMISS_DRAG_PX)));
            }
            // R-CD-6 — the threshold crossing itself gets the tick, not the
            // release decision (that already has its own commit/spring-back
            // branch below). Re-arms on crossing back, per the spec's table.
            const armed = g.dy > DISMISS_COMMIT_PX;
            if (armed && !dismissArmedRef.current) {
              dismissArmedRef.current = true;
              Haptics.selectionAsync().catch(() => {});
            } else if (!armed && dismissArmedRef.current) {
              dismissArmedRef.current = false;
            }
          } else if (dragAxisRef.current === 'x' && entries.length > 1 && pageWidth) {
            pageOffset.setValue(pageStartRef.current + g.dx);
          }
        },
        onPanResponderRelease: (_, g) => {
          if (dragAxisRef.current === 'y') {
            if (g.dy > DISMISS_COMMIT_PX || g.vy > DISMISS_COMMIT_VELOCITY) {
              onDismiss(g.vy);
            } else {
              dive.stopAnimation();
              // R-CD-9 — the drag itself is user-driven 1:1 and stays available
              // under reduced motion, but the not-committed "spring back" is a
              // substitute term: no spring, no overshoot, short duration.
              if (reduced) {
                Animated.timing(dive, { toValue: 1, duration: DURATIONS.diveRmIn, useNativeDriver: true }).start();
              } else {
                Animated.spring(dive, { toValue: 1, velocity: -g.vy, ...SPRINGS.diveIn, useNativeDriver: true }).start();
              }
            }
          } else if (dragAxisRef.current === 'x' && pageWidth) {
            const finalOffset = pageStartRef.current + g.dx;
            let nextIndex = Math.round(-finalOffset / pageWidth);
            nextIndex = Math.max(0, Math.min(entries.length - 1, nextIndex));
            setPageIndex(nextIndex);
            Animated.spring(pageOffset, {
              toValue: -nextIndex * pageWidth,
              velocity: g.vx,
              ...SPRINGS.divePage,
              useNativeDriver: true,
            }).start();
          }
          dragAxisRef.current = null;
        },
        onPanResponderTerminate: () => {
          if (dragAxisRef.current === 'y') {
            dive.stopAnimation();
            if (reduced) {
              Animated.timing(dive, { toValue: 1, duration: DURATIONS.diveRmIn, useNativeDriver: true }).start();
            } else {
              Animated.spring(dive, { toValue: 1, ...SPRINGS.diveIn, useNativeDriver: true }).start();
            }
          }
          dragAxisRef.current = null;
        },
      }),
    [dive, pageOffset, entries.length, pageWidth, onDismiss, reduced]
  );

  const paperScale = dive.interpolate({
    inputRange: [paperStart, 1],
    outputRange: [0.5, 1],
    extrapolateLeft: 'clamp', // extrapolateRight left open: a spring overshoot past 1 reads as R-CD-2's entrance overshoot, for free
  });
  const paperOpacity = dive.interpolate({
    inputRange: [paperStart, paperStart + 0.07, 1],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });
  const honeyTintOpacity = dive.interpolate({
    inputRange: [paperStart, paperStart + 0.02, paperStart + 0.3, 1],
    outputRange: [1, 1, 0, 0],
    extrapolate: 'clamp',
  });
  const glintOpacity = dive.interpolate({
    inputRange: [paperStart, paperStart + 0.03, paperStart + 0.15, paperStart + 0.22],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });

  const rmOpacity = dive; // RM branch: `dive` is driven 0/1 by a flat Animated.timing (R-CD-9), so it's already the cross-fade value directly

  const activeEntry = entries[pageIndex];
  const glintWidth = Math.min(cellSize * 2, 160);

  return (
    <View style={[StyleSheet.absoluteFill, { padding: paperInset }]} pointerEvents="box-none">
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.paper,
          reduced
            ? { opacity: rmOpacity }
            : { opacity: paperOpacity, transform: [{ scale: paperScale }] },
        ]}
        onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}
      >
        {!reduced && (
          <Animated.View
            pointerEvents="none"
            style={[styles.glint, { width: glintWidth, marginLeft: -glintWidth / 2, opacity: glintOpacity }]}
          />
        )}

        <Animated.View style={entries.length > 1 ? { flexDirection: 'row', width: pageWidth * entries.length, transform: [{ translateX: pageOffset }] } : styles.singlePage}>
          {entries.map((entry, index) => (
            <View key={entry.id} style={{ width: pageWidth || '100%' }}>
              <PaperBlock paper={entry.paper} style={styles.entryBlock}>
                {!reduced && index === 0 ? (
                  <DiveDateEyebrow entry={entry} />
                ) : (
                  <Text style={[styles.eyebrow, { color: paperInkSoft(entry.paper) }]}>{longDate(entry.date)}</Text>
                )}
                <Text style={[entryVoice(entry.text), { color: paperInk(entry.paper) }]}>{entry.text}</Text>
              </PaperBlock>
              {!reduced && (
                <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.entryBlock, { backgroundColor: theme.colors.diveHoneyTint, opacity: honeyTintOpacity }]} />
              )}
            </View>
          ))}
        </Animated.View>

        {entries.length > 1 && (
          <View style={styles.dots}>
            {entries.map((entry, index) => (
              <View
                key={entry.id}
                style={[styles.dot, index === pageIndex ? styles.dotActive : null]}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
};

// R-CD-5 — licensed only on the entry that actually opened the dive (page
// 0); R-CD-7 rules paging never re-runs the date beat, so every other page
// renders its static date via `longDate` in the parent instead.
//
// A fixed-cadence tick sequence (`setInterval`), not a phase machine: R-CD-1
// bans a *scripted, branching, sequential* choreography built from
// `setTimeout` (camera -> through -> open); this is one repeating identical
// unit with its own explicit, bounded budget stated independently in R-CD-5
// ("~90ms per step, total ≤350ms") — the same distinction a real odometer's
// digit roll makes. It cannot drive the paper's own arrival (a spring has no
// clean way to land on N discrete stops in step with real elapsed time), and
// it is fully torn down on unmount, so it can never fire after a reverse
// dive closes the paper. Flagged for Lumen's read at ratification (R-CD-11
// row 8) rather than silently decided.
const DiveDateEyebrow = ({ entry }) => {
  const roll = useMemo(() => computeDiveDateRoll(entry.date), [entry.date]);
  const [stepIndex, setStepIndex] = useState(0);
  const stepOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!roll.active) return undefined;
    setStepIndex(0);
    let cancelled = false;
    let i = 0;
    const totalSteps = Math.min(roll.steps.length - 1, Math.floor(DIVE_ODOMETER.maxTotalMs / DIVE_ODOMETER.stepMs));
    const timers = [];
    const advance = () => {
      if (cancelled || i >= totalSteps) return;
      i += 1;
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setStepIndex(i);
          if (roll.unit === 'year') Haptics.selectionAsync().catch(() => {});
          Animated.sequence([
            Animated.timing(stepOpacity, { toValue: 0, duration: DIVE_ODOMETER.stepMs / 2, useNativeDriver: true }),
            Animated.timing(stepOpacity, { toValue: 1, duration: DIVE_ODOMETER.stepMs / 2, useNativeDriver: true }),
          ]).start();
          advance();
        }, DIVE_ODOMETER.stepMs)
      );
    };
    advance();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [roll, stepOpacity]);

  if (!roll.active) {
    return <Text style={[styles.eyebrow, { color: paperInkSoft(entry.paper) }]}>{longDate(entry.date)}</Text>;
  }

  return (
    <Animated.Text style={[styles.eyebrow, styles.eyebrowRolling, { color: paperInkSoft(entry.paper), opacity: stepOpacity }]}>
      {roll.steps[stepIndex]}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  paper: {
    flex: 1,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  singlePage: {
    flex: 1,
  },
  entryBlock: {
    padding: theme.spacing.lg,
  },
  eyebrow: {
    ...theme.type.label,
    marginBottom: theme.spacing.sm,
  },
  eyebrowRolling: {
    letterSpacing: 1,
  },
  glint: {
    position: 'absolute',
    top: 0,
    left: '50%',
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.surface,
  },
  dots: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.surfaceBorder,
  },
  dotActive: {
    backgroundColor: theme.colors.ink,
  },
});
