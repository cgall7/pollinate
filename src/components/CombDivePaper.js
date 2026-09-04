import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { SPRINGS, DURATIONS, DIVE_ODOMETER } from '../constants/motion';
import { PaperBlock, paperInk, paperInkSoft, entryVoice } from './PaperBlock';
import { PressableScale } from './PressableScale';
import { computeDiveDateRoll, longDate } from '../utils/combDiveDate';

// The memory paper — R-CD-4/-5/-6/-7. Absolutely positioned inside
// EntryCombGrid's card, inset PAPER_INSET on every side, riding the same
// `dive` value the camera/wax-shadow/backlight terms in EntryCombGrid ride —
// one driver, per R-CD-1.
const DISMISS_DRAG_PX = 220; // full-strength drag distance to pull `dive` 1 -> 0
const DISMISS_COMMIT_PX = 90;
const DISMISS_COMMIT_VELOCITY = 0.8; // px/ms — RN gestureState units
// The dismiss affordance. 36pt is the drawn disc (Deezine); the hit target is
// taken to 44pt with slop rather than by inflating the circle, so the tap area
// meets the floor without the chrome getting louder (Lumen's A4b).
const CLOSE_SIZE = 36;
const CLOSE_SLOP = (44 - CLOSE_SIZE) / 2;
const CLOSE_HIT_SLOP = { top: CLOSE_SLOP, bottom: CLOSE_SLOP, left: CLOSE_SLOP, right: CLOSE_SLOP };

export const CombDivePaper = ({ dive, reduced, entries, cellSize, paperInset, paperStart, closingRef, onDismiss }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const pageOffset = useRef(new Animated.Value(0)).current;

  const dragAxisRef = useRef(null);
  const diveStartRef = useRef(0);
  const pageStartRef = useRef(0);
  const dismissArmedRef = useRef(false); // R-CD-6 "dismiss threshold crossed — soft tick, re-arms on crossing back"
  // Lumen's must-fix (2026-09-04): a long letter scrolls inside its own
  // ScrollView; the dismiss drag must not fight it for the gesture. Tracks
  // the ACTIVE page's scrollY only (reset on page change, wired below).
  const scrollYRef = useRef(0);

  useEffect(() => {
    scrollYRef.current = 0;
  }, [pageIndex]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Never claim at touch-start (that would steal every scroll touch
        // before the ScrollView gets a look). Claim during MOVE only, and
        // only for gestures that are unambiguously ours: horizontal paging,
        // or a downward drag that starts from the entry text's scroll-top —
        // any other vertical move (scrolling through the letter) returns
        // false so the native ScrollView underneath handles it.
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_, g) => {
          if (Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy)) return true; // paging — unchanged
          if (g.dy > 6 && g.dy > Math.abs(g.dx)) return scrollYRef.current <= 0; // dismiss — only from scroll-top
          return false;
        },
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
      {/* The clip moved off the shadowed node. `styles.paper` carried both
          `overflow: 'hidden'` and `...theme.shadows.card`, and on iOS the
          first sets `masksToBounds`, which clips the layer's own drop shadow
          away — so the paper has been rendering flat against the comb since
          it shipped, the shadow present in the stylesheet and absent on the
          screen. Same split, same reason, as EntryCombGrid's card. */}
      <View style={styles.paperClip}>
        {!reduced && (
          <Animated.View
            pointerEvents="none"
            style={[styles.glint, { width: glintWidth, marginLeft: -glintWidth / 2, opacity: glintOpacity }]}
          />
        )}

        <Animated.View
          style={
            entries.length > 1
              ? { flex: 1, flexDirection: 'row', width: pageWidth * entries.length, transform: [{ translateX: pageOffset }] }
              : styles.singlePage
          }
        >
          {entries.map((entry, index) => (
            <View key={entry.id} style={{ width: pageWidth || '100%', flex: 1 }}>
              <PaperBlock paper={entry.paper} style={styles.entryBlock}>
                {!reduced && index === 0 ? (
                  <DiveDateEyebrow entry={entry} closingRef={closingRef} />
                ) : (
                  <Text style={[styles.eyebrow, { color: paperInkSoft(entry.paper) }]}>{longDate(entry.date)}</Text>
                )}
                {/* Lumen's must-fix (2026-09-04): the FlatList this replaced
                    clamped previews to 4 lines; this paper renders the FULL
                    entry, so a rung-3 letter (>220 chars — the surface's own
                    reason to exist) needs somewhere for the overflow to go.
                    Scroll claimed only from scroll-top by the PanResponder
                    above — see scrollYRef. */}
                <ScrollView
                  style={styles.entryScroll}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  scrollEventThrottle={16}
                  onScroll={
                    index === pageIndex ? (e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; } : undefined
                  }
                >
                  <Text style={[entryVoice(entry.text), { color: paperInk(entry.paper) }]}>{entry.text}</Text>
                </ScrollView>
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

        {/* THE WAY OUT. Until this shipped the dive had no visible exit at
            all: tapping the comb is the documented dismiss but the paper
            covers every cell it asks you to tap (an 18pt margin is not a
            target), the swipe only arms from the entry's own scroll-top, and
            the header's back button leaves the whole hive rather than the
            letter. Three paths, none of them findable, one of them silently
            unavailable to anyone reading a long entry — a dead end, and
            Colin's report of it was right.

            The scroll gate STAYS, and that is deliberate: pull-from-the-top
            is the standard grammar for a sheet over scrollable content, and
            un-gating it would mean a downward swipe through a letter fights
            the letter. The defect was never that the gesture is conditional,
            it is that a conditional gesture was the only door. This is the
            unconditional one.

            Geometrically outside both traps by construction — a sibling of
            the pager rather than a child of the ScrollView (so scrolling can
            never eat it) and part of the paper itself rather than an
            uncovered cell (so it is always on top, at a fixed place, whatever
            the camera is doing underneath). Deezine's surface: a 36pt disc
            with a chevron that folds the letter away, not an app-chrome X.
            Fully inside the paper's bounds, since the clip above would shear
            an overhanging corner (Lumen's A4a). `hitSlop` takes the 36pt
            visual to a 44pt+ target without inflating the drawing (A4b).
            Routed through `onDismiss` — the same commit point the swipe
            already funnels through, so `closingRef`, the odometer stop and
            the bee's break-off all fire exactly as they do today. One more
            path in, not a second exit mechanism. */}
        <PressableScale
          onPress={() => onDismiss(0)}
          containerStyle={styles.closeSlot}
          style={styles.close}
          hitSlop={CLOSE_HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="chevron-down" size={18} color={theme.colors.ink} />
        </PressableScale>
      </View>
      </Animated.View>
    </View>
  );
};

// R-CD-5 — licensed only on the entry that actually opened the dive (page
// 0); R-CD-7 rules paging never re-runs the date beat, so every other page
// renders its static date via `longDate` in the parent instead.
//
// A recursive `setTimeout` chain, not a phase machine: R-CD-1 bans a
// *scripted, branching, sequential* choreography (camera -> through -> open);
// this is one repeating identical unit with its own explicit, bounded budget
// stated independently in R-CD-5 ("~90ms per step, total ≤350ms") — the same
// distinction a real odometer's digit roll makes. It cannot drive the
// paper's own arrival (a spring has no clean way to land on N discrete stops
// in step with real elapsed time). Lumen's ratification (2026-09-04) accepts
// this as licensed, with one condition: "reverse dive never rolls" (R-CD-5)
// means the chain must stop the moment dismissal COMMITS
// (`closingRef.current`, set by EntryCombGrid's `close()`), not merely at
// unmount — the paper stays mounted through the whole close spring, so an
// unmount-only teardown would still let several steps fire (and buzz) on an
// exiting, invisible eyebrow.
const DiveDateEyebrow = ({ entry, closingRef }) => {
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
      if (cancelled || closingRef?.current || i >= totalSteps) return;
      i += 1;
      timers.push(
        setTimeout(() => {
          if (cancelled || closingRef?.current) return;
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
  }, [roll, stepOpacity, closingRef]);

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
    ...theme.shadows.card,
  },
  // The clipping node, separated from the shadowed one above so the shadow
  // survives (see the render's note). Radius repeated here on purpose: this
  // is the view that actually masks the corners now.
  paperClip: {
    flex: 1,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
  },
  singlePage: {
    flex: 1,
  },
  entryBlock: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  entryScroll: {
    flex: 1,
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
  closeSlot: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  close: {
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
    borderRadius: CLOSE_SIZE / 2,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    // `surfaceBorderStrong`, NOT the `glassHairline` the spec named. Two
    // reasons, and the first is binding: the glass hairline is declared in
    // exactly one file on purpose (GlassRim.js — check-glass-definition E1),
    // because it exists only as the substrate the specular rim gleams
    // against, and a second declaration is how one material quietly becomes
    // two. This disc is not glass; it is an opaque paper-surface control, so
    // borrowing that token would have claimed a material it isn't made of.
    // Second, `surfaceBorderStrong` is this system's own answer for the case
    // ("filled/selected card states need more than a hairline") — the disc
    // sits on `surface` paper, so on a cream entry it is white on white and
    // the ring is the only thing separating them. The affordance itself is
    // carried by the ink chevron, per R127.1: weight and position, never hue.
    borderColor: theme.colors.surfaceBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
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
