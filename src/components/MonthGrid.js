import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Polygon } from 'react-native-svg';
import { theme } from '../constants/theme';
import { DURATIONS, staggerDelay, useReducedMotion } from '../constants/motion';
import { StaggeredItem } from './StaggeredItem';
import { StripePattern } from './StripeTexture';
import { COLS, hexPoints } from '../utils/combGeometry';
import { useSvgId } from '../utils/svgId';

// R15's extraction: the month comb's shared paint (one `<Svg>` root, every
// cell's fill/stroke/hatch and the selection ring) plus the per-day
// numeral/ignite-glow that sits on top of it now live in exactly one
// place, so Recap's interactive grid and the monthly Wrapped finale (§14.2
// respec §7.2) draw the same unit instead of two near-identical copies.
//
// Layout math stays in `utils/combGeometry` (R15's original split) — this
// is the rendering half only. `cells`/`height` are the caller's
// `combLayout(...)` output, passed in rather than recomputed here: a
// caller that also needs to hit-test taps against the same cells (Recap's
// Pressable overlay) would otherwise carry a second, driftable copy of the
// same derivation.

// Same motif as StreakHexTrail's ignite glow (`StreakHexTrail.js:89`) —
// one ramp 0→1, read through a bloom-then-fade interpolation.
const CellGlow = ({ index, count, cascade, w, h }) => {
  const glow = useRef(new Animated.Value(0)).current;
  const lastCascade = useRef(cascade);

  useEffect(() => {
    if (lastCascade.current !== cascade) {
      lastCascade.current = cascade;
      glow.setValue(0);
    }
    Animated.timing(glow, {
      toValue: 1,
      duration: DURATIONS.arrival,
      delay: staggerDelay(index, count),
      useNativeDriver: true,
    }).start();
    return () => glow.stopAnimation();
  }, [cascade]);

  const opacity = glow.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.6, 0] });
  const scale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.6] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.cellGlow, { width: w, height: h, borderRadius: w / 2, opacity, transform: [{ scale }] }]}
    />
  );
};

// The day numeral (plain RN `<Text>`) and, for a filled day, its ignite
// glow — the streak trail's motif applied to a calendar, since a filled
// cell IS a streak hex igniting. Only the days you actually earned
// animate; empty days are scenery.
const DayCell = ({ day, filled, index, filledCount, cascade, reduced, w, h, x, y }) => (
  <View style={[styles.cellPosition, { left: x, top: y, width: w, height: h }]} pointerEvents="none">
    {filled && !reduced && (
      <CellGlow index={index} count={filledCount} cascade={cascade} w={w} h={h} />
    )}
    {filled ? (
      <StaggeredItem index={index} count={filledCount} replayKey={cascade} pop style={styles.dayNumberOverlay}>
        <Text style={[styles.dateText, styles.dateTextFilled]}>{day}</Text>
      </StaggeredItem>
    ) : (
      <View style={styles.dayNumberOverlay} pointerEvents="none">
        <Text style={styles.dateText}>{day}</Text>
      </View>
    )}
  </View>
);

// `cells`/`height` — `combLayout(daysInMonth, cellW, cellH)` output.
// `filledDays` — a `Set` of day-of-month numbers that have an entry.
// `cascade` — bump to re-stagger the entrance (a month swipe, a finale replay).
// `selectedDay` — optional; paints the ink selection ring Recap uses. The
// finale beat never passes it.
export const MonthGrid = ({ cells, height, cellW, cellH, filledDays, cascade = 0, selectedDay = null }) => {
  const reduced = useReducedMotion();
  const points = useMemo(() => hexPoints(cellW, cellH), [cellW, cellH]);
  // One hatch pattern per mounted MonthGrid, not per cell — R38's shared
  // root paints every empty cell's hatch from the same `<Defs>` entry, and
  // a screen can keep several months mounted at once (Recap's pager), so
  // the id still has to be unique per instance.
  const hatchId = useSvgId('monthGridHatch');

  // One pass, shared by the Svg paint layer and the numeral/glow overlay —
  // both walk the same cells in the same order, so the stagger index a
  // filled day gets for its glow is the same one it gets for its numeral.
  const cellRenderData = useMemo(() => {
    let filledSoFar = 0;
    return cells.map((cell) => {
      const filled = filledDays.has(cell.day);
      return { cell, filled, index: filled ? filledSoFar++ : 0 };
    });
  }, [cells, filledDays]);

  const filledCount = filledDays.size;
  const selectedCell = selectedDay === null ? null : cells.find((c) => c.day === selectedDay);

  return (
    <View style={[styles.comb, { width: cellW * COLS, height }]}>
      {/* R38: a sibling group of `<Svg>` roots displaces the minority
          configuration — every cell's fill/stroke/hatch and the selection
          ring paint from this one shared root. 1pt of bleed on every side
          so a full-strength 2pt selection ring on an edge cell has
          somewhere to paint instead of clipping against the root's own
          edge. */}
      <Svg width={cellW * COLS + 2} height={height + 2} style={styles.combSvg}>
        <Defs>
          <StripePattern id={hatchId} />
        </Defs>
        {/* Empties first, then every filled cell, so a filled hex always
            owns its complete outline regardless of date (a later element
            wins on a shared-wall stroke). */}
        {cellRenderData
          .filter(({ filled }) => !filled)
          .map(({ cell }) => (
            <Polygon
              key={cell.day}
              points={points}
              transform={`translate(${cell.x + 1} ${cell.y + 1})`}
              fill={`url(#${hatchId})`}
              stroke={theme.colors.surfaceBorderStrong}
              strokeWidth={1}
            />
          ))}
        {cellRenderData
          .filter(({ filled }) => filled)
          .map(({ cell }) => (
            <Polygon
              key={cell.day}
              points={points}
              transform={`translate(${cell.x + 1} ${cell.y + 1})`}
              fill={theme.colors.accent}
              stroke={theme.colors.accentDeep}
              strokeWidth={1}
            />
          ))}
        {selectedCell && (
          <Polygon
            points={points}
            transform={`translate(${selectedCell.x + 1} ${selectedCell.y + 1})`}
            fill="none"
            stroke={theme.colors.ink}
            strokeWidth={2}
          />
        )}
      </Svg>

      {cellRenderData.map(({ cell, filled, index }) => (
        <DayCell
          key={cell.day}
          day={cell.day}
          filled={filled}
          index={index}
          filledCount={filledCount}
          cascade={cascade}
          reduced={reduced}
          w={cellW}
          h={cellH}
          x={cell.x}
          y={cell.y}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // Cells are absolutely positioned: the 0.75h row pitch means rows must
  // overlap, which no flex row can express.
  comb: {
    position: 'relative',
  },
  cellPosition: {
    position: 'absolute',
  },
  combSvg: {
    position: 'absolute',
    left: -1,
    top: -1,
  },
  dayNumberOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellGlow: {
    position: 'absolute',
    backgroundColor: theme.colors.accentBurst,
  },
  dateText: {
    fontSize: 11,
    color: theme.colors.inkSoft,
    fontFamily: theme.fonts.bodyMedium,
  },
  dateTextFilled: {
    color: theme.colors.ink,
    fontFamily: theme.fonts.bodySemiBold,
  },
});
