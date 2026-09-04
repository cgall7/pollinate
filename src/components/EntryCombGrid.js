import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Polygon, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { SPRINGS, DURATIONS, useReducedMotionState } from '../constants/motion';
import { hexSpiral, buildCombLayout, cellCentre, ringStepFor } from './combLattice';
import { hexPoints, HEX_HEIGHT_RATIO, hexHoneyPoints, honeyHeightForLevel } from './hexGeometry';
import { PressableScale } from './PressableScale';
import { CombDivePaper } from './CombDivePaper';

const AnimatedG = Animated.createAnimatedComponent(G);

// POLLINATE_COMB_DIVE_SPEC.md — "The Dive." Renders a hive's entries as a
// comb (Colin's own framing: "each piece of the comb is one letter"), one
// cell per entry, and hosts the dive when a filled cell is tapped. Reuses
// hexGeometry.js/combLattice.js unchanged (Lumen's build-contract ruling:
// "hexGeometry.js and combLattice.js are already extracted pure modules —
// reuse them, don't fork the lattice").
//
// R-CD-12 addendum (2026-09-04) — this component does not mount the bee
// itself. `onCellFlight`/`onFlightHome` are the wire: the host screen owns
// `usePerchSet`/`PerchField`/`FlyingBee` (same split HoneycombTab already
// uses for its own comb), this file only measures the tapped cell and tells
// the host when to launch and when to come home. R-CD-13 addendum, same
// date — the rest-state cell paint, in `EntryCell` below.
export const CELL_SIZE = 44;
const CARD_INSET = theme.spacing.lg; // 24 — the card's own padding
const PAPER_INSET = 18; // R-CD-4 — the paper settles to the card's 18pt inset
const FOCUS_FRACTION = 0.72; // R-CD-3 — focus cell's inradius spans ~72% of the card's short side
const APPROACH_END = 0.55; // R-CD-3 — camera/wax-shadow/backlight rise complete by here
const PAPER_START = 0.45; // R-CD-4
const CHROME_DIM_END = 0.2; // R-CD-3 — dim completes before camera is halfway (0.275)
const WAX_K = 0.2; // dolly displacement scale — prototype's k range 0.12-0.28, kept mid
const RIM_CROSSING_THRESHOLD = 0.5; // R-CD-6 — soft tick when the focus cell takes over the frame

// Exported so HiveDetail.js's chrome (banner, roster, action rows) can
// share the exact dim curve rather than a second copy of the numbers.
export const DIVE_CHROME_DIM = { end: CHROME_DIM_END, opacity: 0.35, drift: -6 };

const radiusForCount = (count) => {
  let r = 1;
  while (1 + 3 * r * (r + 1) < count) r += 1;
  return r;
};

export const EntryCombGrid = ({ entries, writable, onWriteEntry, diveValue, onCellFlight, onFlightHome }) => {
  const { reduced } = useReducedMotionState();
  const dive = diveValue;
  const [cardSize, setCardSize] = useState(null);
  const [openCell, setOpenCell] = useState(null); // { key, entries } | null
  const rimCrossedRef = useRef(false);
  // R-CD-12.2 — the tap that opens a cell also measures it, so the host
  // screen's FlyingBee can be aimed at the exact point R-CD-3's backlight is
  // already igniting. Read at the moment of the tap, before any camera
  // transform exists (openCell is still null here), same technique as
  // HoneycombGrid's own `pollinateOwnCell`/`requestPollination`: the
  // cluster's window origin plus the cell's cluster-local centre.
  const clusterRef = useRef(null);
  // R-CD-5 "reverse dive never rolls" — the odometer's own chain (licensed
  // exception, R-CD-1) must stop the moment dismissal COMMITS, not wait for
  // the paper to unmount at the end of the close spring. Set true at the top
  // of `close()`, the single commit point every dismiss path (swipe-commit,
  // tap-elsewhere, RM) already funnels through; reset on the next open.
  const closingRef = useRef(false);

  // One entry, one seat — R-CD-7's multi-entry-per-cell case is left for a
  // future seating rule (grouping key TBD, a content question like the
  // anniversary framing the spec itself defers); CombDivePaper already
  // supports paging an array of entries per open, so seating several here
  // later is additive, not a rework.
  const seats = useMemo(() => entries.map((entry) => ({ id: entry.id, group: [entry] })), [entries]);
  const spiral = useMemo(() => hexSpiral(Math.max(1, radiusForCount(seats.length))), [seats.length]);
  const layout = useMemo(() => buildCombLayout(seats, CELL_SIZE, spiral), [seats, spiral]);

  const focusCell = openCell ? layout.cells.find((c) => c.key === openCell.key) : null;
  const focusCentre = focusCell ? cellCentre(focusCell, CELL_SIZE) : null;

  const springDive = useCallback(
    (toValue, velocity, onDone) => {
      dive.stopAnimation();
      Animated.spring(dive, {
        toValue,
        velocity: velocity ?? 0,
        useNativeDriver: true,
        ...(toValue === 0 ? SPRINGS.diveExit : SPRINGS.diveIn),
      }).start(onDone);
    },
    [dive]
  );

  const openAt = useCallback(
    (cell) => {
      if (!cell.member) {
        if (writable) onWriteEntry?.();
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      rimCrossedRef.current = false;
      closingRef.current = false;
      setOpenCell({ key: cell.key, entries: cell.member.group });
      if (reduced) {
        dive.stopAnimation();
        Animated.timing(dive, { toValue: 1, duration: DURATIONS.diveRmIn, useNativeDriver: true }).start();
      } else {
        springDive(1);
        // R-CD-12.2/.3 — the bee's launch is a second response to the same
        // tap, concurrent with the descent, never gating it. RM gets none of
        // it (R-CD-12.1's freeze doctrine), same guard HoneycombGrid's own
        // requestPollination/pollinateOwnCell take before calling onPollinate.
        if (onCellFlight) {
          const centre = cellCentre(cell, CELL_SIZE);
          clusterRef.current?.measureInWindow?.((x, y) => {
            if (![x, y].every((n) => typeof n === 'number' && Number.isFinite(n))) return;
            onCellFlight({ x: x + centre.x, y: y + centre.y, ringStep: ringStepFor(CELL_SIZE) });
          });
        }
      }
    },
    [reduced, springDive, writable, onWriteEntry, dive, onCellFlight]
  );

  const close = useCallback(
    (velocity) => {
      closingRef.current = true;
      const finish = () => setOpenCell(null);
      if (reduced) {
        dive.stopAnimation();
        Animated.timing(dive, { toValue: 0, duration: DURATIONS.diveRmOut, useNativeDriver: true }).start(finish);
      } else {
        springDive(0, velocity, finish);
        // R-CD-12.4 — close is the single commit point every dismiss path
        // funnels through (closingRef's own doctrine, D11); the bee's return
        // rides the same funnel rather than a second exit path per dismiss
        // gesture.
        onFlightHome?.();
      }
    },
    [reduced, springDive, dive, onFlightHome]
  );

  // R-CD-1 — "Input never disabled": a tap anywhere on the comb while a
  // dive is open (or opening) retargets to 0 first, rather than being
  // swallowed. Reopening a different cell is a known follow-up (see the
  // module comment above) — this build always closes on any grid tap while
  // open, which is still a processed, continuous response, never a dropped
  // one.
  const handleCellPress = (cell) => {
    if (openCell) {
      close();
      return;
    }
    openAt(cell);
  };

  // R-CD-6 rim-crossing tick — fires once per open, on the frame the camera
  // approach crosses RIM_CROSSING_THRESHOLD, reset so the next open can fire
  // again. Side-effect only (a haptic), never drives a visual — legal on a
  // native-driven value per the app's own established pattern.
  const handleDiveTick = useCallback(({ value }) => {
    if (value >= RIM_CROSSING_THRESHOLD && !rimCrossedRef.current) {
      rimCrossedRef.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } else if (value < RIM_CROSSING_THRESHOLD) {
      rimCrossedRef.current = false;
    }
  }, []);

  React.useEffect(() => {
    const id = dive.addListener(handleDiveTick);
    return () => dive.removeListener(id);
  }, [dive, handleDiveTick]);

  const shortSide = cardSize ? Math.min(cardSize.width, cardSize.height) : 0;
  const inradius = CELL_SIZE * HEX_HEIGHT_RATIO;
  const targetScale = shortSide ? (FOCUS_FRACTION * shortSide) / (2 * inradius) : 1;

  const camTranslateX = focusCentre ? layout.width / 2 - focusCentre.x : 0;
  const camTranslateY = focusCentre ? layout.height / 2 - focusCentre.y : 0;

  const camInputRange = [0, APPROACH_END, 1];
  const clusterTransform =
    openCell && !reduced
      ? [
          { translateX: dive.interpolate({ inputRange: camInputRange, outputRange: [0, camTranslateX, camTranslateX], extrapolate: 'clamp' }) },
          { translateY: dive.interpolate({ inputRange: camInputRange, outputRange: [0, camTranslateY, camTranslateY], extrapolate: 'clamp' }) },
          { scale: dive.interpolate({ inputRange: camInputRange, outputRange: [1, targetScale, targetScale], extrapolate: 'clamp' }) },
        ]
      : undefined;

  return (
    <View
      style={styles.card}
      onLayout={(e) => setCardSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      <Animated.View
        ref={clusterRef}
        style={[
          styles.cluster,
          { width: layout.width, height: layout.height },
          clusterTransform ? { transform: clusterTransform } : null,
        ]}
      >
        {layout.cells.map((cell) => {
          const isFocus = openCell && cell.key === openCell.key;
          const centre = cellCentre(cell, CELL_SIZE);
          let dolly = null;
          let waxOpacity = null;
          let backlightOpacity = null;

          if (openCell && !reduced) {
            if (!isFocus && focusCentre) {
              const dx = centre.x - focusCentre.x;
              const dy = centre.y - focusCentre.y;
              const dist = Math.hypot(dx, dy) || 1;
              const ux = dx / dist;
              const uy = dy / dist;
              dolly = {
                x: dive.interpolate({
                  inputRange: camInputRange,
                  outputRange: [0, dist * WAX_K * ux, dist * WAX_K * ux],
                  extrapolate: 'clamp',
                }),
                y: dive.interpolate({
                  inputRange: camInputRange,
                  outputRange: [0, dist * WAX_K * uy, dist * WAX_K * uy],
                  extrapolate: 'clamp',
                }),
              };
              waxOpacity = dive.interpolate({ inputRange: camInputRange, outputRange: [0, 1, 1], extrapolate: 'clamp' });
            } else if (isFocus) {
              backlightOpacity = dive.interpolate({
                inputRange: [0, 0.4, PAPER_START, 0.75, 1],
                outputRange: [0, 1, 1, 0, 0],
                extrapolate: 'clamp',
              });
            }
          }

          return (
            <EntryCell
              key={cell.key}
              cell={cell}
              size={CELL_SIZE}
              dolly={dolly}
              waxOpacity={waxOpacity}
              backlightOpacity={backlightOpacity}
              writable={writable}
              onPress={() => handleCellPress(cell)}
            />
          );
        })}
      </Animated.View>

      {openCell ? (
        <CombDivePaper
          dive={dive}
          reduced={reduced}
          entries={openCell.entries}
          cellSize={CELL_SIZE}
          paperInset={PAPER_INSET}
          paperStart={PAPER_START}
          closingRef={closingRef}
          onDismiss={(velocity) => close(velocity)}
        />
      ) : null}
    </View>
  );
};

const EntryCell = ({ cell, size, dolly, waxOpacity, backlightOpacity, writable, onPress }) => {
  const filled = !!cell.member;
  const outerStyle = [
    styles.cellSlot,
    { left: cell.x, top: cell.y, width: size * 2, height: size * 2 },
  ];
  const Wrapper = dolly ? Animated.View : View;
  const wrapperStyle = dolly ? [...outerStyle, { transform: [{ translateX: dolly.x }, { translateY: dolly.y }] }] : outerStyle;

  return (
    <Wrapper style={wrapperStyle}>
      <PressableScale
        onPress={onPress}
        // An empty cell on a sealed hive (writable: false) does nothing on
        // tap — "Write a memory" there is a promise the press doesn't keep
        // (Lumen's rider, 2026-09-04). No label at all in that case, same
        // as any other inert affordance.
        accessibilityLabel={filled ? 'Open this memory' : writable ? 'Write a memory' : undefined}
      >
        <View style={{ width: size * 2, height: size * 2 }}>
          <Svg width={size * 2} height={size * 2}>
            {/* R-CD-13 — rest-state paint drops from full-saturation `accent`
                to `washYellow` (the existing warm-ground wash, "a role, not a
                screen" per its own token comment — no new literal). Stroke
                drops to hairline: `glassHairline` (ink at 0.18) at
                borderWidth-equivalent 1, GlassRim's precedent that
                StyleSheet.hairlineWidth (0.333pt @3x) reads as a conformance
                miss, not this file's own convention. The honey band below
                keeps `accentDeep` untouched — it stays the loudest, and
                highest-chroma, thing in the cell (scripts/check-comb-dive.mjs
                D13 asserts the ordering numerically). */}
            <Polygon
              points={hexPoints(size)}
              fill={filled ? theme.colors.washYellow : 'transparent'}
              stroke={theme.colors.glassHairline}
              strokeWidth={1}
            />
            {filled ? (
              <Polygon points={hexHoneyPoints(size, honeyHeightForLevel(size, 1))} fill={theme.colors.accentDeep} />
            ) : null}
            {backlightOpacity ? (
              <AnimatedG opacity={backlightOpacity}>
                <Polygon points={hexPoints(size)} fill={theme.colors.accentBurst} />
              </AnimatedG>
            ) : null}
          </Svg>
          {waxOpacity ? (
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: waxOpacity }]}>
              <Svg width={size * 2} height={size * 2}>
                <Polygon points={hexPoints(size)} fill={theme.colors.spotlightDim} />
              </Svg>
            </Animated.View>
          ) : null}
        </View>
      </PressableScale>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: CARD_INSET,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // R-CD §0 — contained in the comb card, never full-screen
    minHeight: 260,
  },
  cluster: {
    position: 'relative',
  },
  cellSlot: {
    position: 'absolute',
  },
});
