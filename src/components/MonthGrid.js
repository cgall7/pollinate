import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Polygon } from 'react-native-svg';
import { theme } from '../constants/theme';
import { DURATIONS, staggerDelay, useReducedMotion } from '../constants/motion';
import { StaggeredItem } from './StaggeredItem';
import { StripePattern } from './StripeTexture';
import { COLS, HEX_ASPECT, hexPoints } from '../utils/combGeometry';
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

// G3 (Lumen, 2026-08-29): PAINT is inset inside the lattice box, so the month
// comb reads as one keepsake per day rather than one fused field — the same
// register the Hive's comb speaks in, and the geometry half of §29.1's
// SINGULAR test. Two things this is NOT:
//
//   - It is not a return of the defect `combGeometry`'s own comment names.
//     That gap was an unnamed artifact of inscribing the hexagon in an
//     ellipse, which also made the drawn shape irregular and scaled with `w`.
//     This is a stated constant applied to a correct hexagon.
//   - It does not touch the LATTICE. `combLayout`'s pitch and `hexAt`'s hit
//     test still tile the full box edge to edge, so every tap target keeps
//     its full area and R33 is untouched — only the ink pulls in.
//
// Consequence that earns it: no two cells share a wall any more, so the
// filled cell's `accentDeep` separator stroke has nothing left to separate
// and retires with the emphasis register (G2).
const CELL_GAP = 2;

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
// `onSettled` — optional; fires once the last filled cell's entrance has
// visibly landed (or immediately, for an empty grid), so a caller that
// assembles the grid as its own beat (§14.2 respec Beat 4) knows when to
// detonate. Timed rather than threaded through every cell's own animation
// callback (StreakHexTrail's `onSettle` shape) because the grid's entrance
// is driven by two independent animations per filled cell (the pop and the
// glow) and only the slower one, the glow's `DURATIONS.arrival` bloom,
// decides when the LAST cell is actually done.
export const MonthGrid = ({ cells, height, cellW, cellH, filledDays, cascade = 0, selectedDay = null, todayDay = null, onSettled }) => {
  const reduced = useReducedMotion();
  // Height is re-derived from the inset width rather than taken off `cellH`,
  // so the drawn hexagon stays regular: shrinking only the width would leave
  // a hexagon that is no longer the shape `hexPoints` promises.
  const drawW = Math.max(cellW - CELL_GAP, 1);
  const drawH = drawW * HEX_ASPECT;
  const inset = { x: (cellW - drawW) / 2, y: (cellH - drawH) / 2 };
  const points = useMemo(() => hexPoints(drawW, drawH), [drawW, drawH]);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
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

  useEffect(() => {
    if (!onSettledRef.current) return undefined;
    const ms =
      filledCount === 0
        ? 0
        : reduced
          ? DURATIONS.reducedMotionFade
          : staggerDelay(filledCount - 1, filledCount) + DURATIONS.arrival;
    const t = setTimeout(() => onSettledRef.current?.(), ms);
    return () => clearTimeout(t);
  }, [cascade, filledCount, reduced]);

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
        {/* Two passes, empties first. The reason used to be stroke
            arbitration on a shared wall — under CELL_GAP no two cells touch,
            so nothing is being arbitrated and the order is now only a
            painter's habit. Kept because it is still the order that reads
            correctly if the gap is ever tuned back toward zero.

            G2 (Colin's ruling, 2026-08-26): a kept day is a KEEPSAKE and
            wears the keepsake material — `goldField`, §29.1, ΔE00 21.1352
            from the page it sits on. `accent` survives on exactly one cell,
            today's, and only when today has already been written: that day
            fails §29.1's FINISHED test because it is still being authored,
            and the accent-vs-gold pair separates at ΔE00 4.9290 (measured
            here with the repo's own `scripts/lib/color.mjs`; the 1.179
            figure in GARDEN_LUXURY_REDESIGN.md G2 was a contrast RATIO,
            which is the wrong instrument for two grounds — §20.7). An
            unwritten today stays hatch, because painting it would be the
            screen claiming an entry that does not exist. */}
        {cellRenderData
          .filter(({ filled }) => !filled)
          .map(({ cell }) => (
            <Polygon
              key={cell.day}
              points={points}
              transform={`translate(${cell.x + 1 + inset.x} ${cell.y + 1 + inset.y})`}
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
              transform={`translate(${cell.x + 1 + inset.x} ${cell.y + 1 + inset.y})`}
              fill={cell.day === todayDay ? theme.colors.accent : theme.colors.goldField}
            />
          ))}
        {selectedCell && (
          <Polygon
            points={points}
            transform={`translate(${selectedCell.x + 1 + inset.x} ${selectedCell.y + 1 + inset.y})`}
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
