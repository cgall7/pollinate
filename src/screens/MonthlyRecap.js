import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, Text, Pressable, useWindowDimensions } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { DURATIONS, useReducedMotion } from '../constants/motion';
import { PressableScale } from '../components/PressableScale';
import { ThemeCardFlip } from '../components/ThemeCardFlip';
import { MonthGrid } from '../components/MonthGrid';
import { PaperBlock, paperInk } from '../components/PaperBlock';
import { tagEntry } from '../utils/themeTagger';
import { COLS, HEX_ASPECT, combLayout, hexAt, hexPoints } from '../utils/combGeometry';

// §17.5 — the month grid is a true honeycomb: cells share walls instead of
// sitting in a square lattice with air between them. The lattice itself
// (hex vertices, row parity, hit-testing) lives in `utils/combGeometry` so
// it can be exercised without a renderer.

// The reveal card's header hex. Same generator as the comb, so it is the
// same shape at a different size rather than a lookalike (R36).
const REVEAL_HEX_W = 30;
const REVEAL_HEX_H = REVEAL_HEX_W * HEX_ASPECT;

// R38 (Pixel, 2026-08-11 device matrix): a sibling group of `<Svg>` roots
// displaces the minority configuration by exactly ⅔·cellH, regardless of
// what its `Polygon` props look like — prop identity was ruled out (variant
// E), and the trigger is cardinality of Svg-root configs in the group, not
// color. The only census that rule can't punish is one: the whole comb, the
// selection ring, and every day's fill/stroke paint from a SINGLE shared
// `<Svg>` root, now inside `MonthGrid` (R15's extraction) — this file never
// mounts a second Svg-root config near the grid.

// R35: the day opens IN PLACE, directly under the comb — not a modal, not a
// navigation push. The card is the hive's reveal card
// (`HoneycombGrid.js:187-207`) in the same component language, because
// tapping a day here and tapping a person there are the same gesture
// answered the same way; the rhyme is the point.
const DayRevealCard = ({ monthName, day, entries, progress, reduced, w, h, isToday }) => (
  <Animated.View
    style={[
      styles.revealCard,
      {
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [reduced ? 0 : 10, 0],
            }),
          },
        ],
      },
    ]}
  >
    <View style={styles.revealHeader}>
      {/* The cell's own fill state, shrunk — the card wears the motif it
          came from instead of a generic icon roundel. G2: "its own fill
          state" is the load-bearing half of that sentence, so this follows
          the comb rather than restating a literal — a kept day is
          `goldField`, today (still being authored) is `accent`, and the
          `accentDeep` separator stroke retires here for the same reason it
          retired on the grid.

          Second ground, measured rather than inherited: the grid's cells sit
          on the page (`background`, ΔE00 21.1352) and this one sits on the
          reveal card (`surface`, ΔE00 30.8167). Same token, two grounds, both
          clear — which is the only reason one fill is allowed to travel from
          the comb into the card. */}
      <View style={styles.revealHex}>
        <Svg width={w} height={h}>
          <Polygon
            points={hexPoints(w, h)}
            fill={isToday ? theme.colors.accent : theme.colors.goldField}
          />
        </Svg>
        <View style={styles.revealHexNumeral} pointerEvents="none">
          <Text style={styles.revealHexText}>{day}</Text>
        </View>
      </View>
      <Text style={styles.revealDate}>
        {monthName} {day}
      </Text>
      <Text style={styles.revealCount}>
        {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
      </Text>
    </View>

    {entries.map((entry, index) => (
      <View key={`${entry.date}-${index}`} style={index > 0 && styles.revealEntryRule}>
        <PaperBlock paper={entry.paper}>
          <Text style={[styles.revealQuote, { color: paperInk(entry.paper) }]}>“{entry.text}”</Text>
        </PaperBlock>
        <Text style={styles.revealTheme}>{entry.theme || tagEntry(entry.text)}</Text>
      </View>
    ))}
  </Animated.View>
);

export const MonthlyRecap = ({
  monthName,
  // Display override for the title only — the pager adds a year once it
  // scrolls past December, while `monthName` stays bare so the per-day
  // VoiceOver labels read "December 14", not "December 2025 14".
  title,
  entries,
  daysInMonth = 31,
  insightTheme,
  insightDescription,
  // False for the pages either side of the one you're looking at. Defaults
  // true so a lone MonthlyRecap behaves exactly as it did before the pager.
  active = true,
  // Day-of-month that is actually today, or null on every page that is not
  // the current month. Derived once by RecapTab from the same month list the
  // pager is built from, rather than re-read from a clock here: two readings
  // of "now" in one render is how a page ends up disagreeing with its own
  // header at midnight.
  todayDay = null,
}) => {
  // entries = [{ date: '2026-07-01', text: '...', theme: 'Family' }, ...]
  const hasEntries = entries.length > 0;
  // Sized off the live window (not a module-scope Dimensions read) so
  // rotation and split-view don't leave a stale comb: screen width, less
  // RecapTab's 24pt padding each side. R33: no gap term — the comb has no
  // gaps to subtract, and nothing from the analysis basis is frozen here.
  const { width } = useWindowDimensions();
  const cellW = Math.floor((width - 48) / COLS);
  const cellH = cellW * HEX_ASPECT;

  const { cells, height } = useMemo(
    () => combLayout(daysInMonth, cellW, cellH),
    [daysInMonth, cellW, cellH]
  );

  // Index entries by day-of-month so each one lands on its real date. The
  // grid used to render every filled day first and then pad with empties,
  // which made three scattered entries look like the 1st, 2nd and 3rd —
  // a tally wearing a calendar's clothes.
  const entriesByDay = useMemo(() => {
    const map = new Map();
    for (const entry of entries) {
      const day = parseInt(entry.date.split('-')[2], 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(entry);
    }
    return map;
  }, [entries]);

  const [selectedDay, setSelectedDay] = useState(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const [cascade, setCascade] = useState(0);
  const reduced = useReducedMotion();
  const revealProgress = useRef(new Animated.Value(0)).current;

  // R35: both reveals belong to their month, so scrolling away takes them
  // with it — a card whose content outlived the comb it was opened from is
  // the confusing kind of persistence.
  useEffect(() => {
    setSelectedDay(null);
    setThemeOpen(false);
  }, [monthName, active]);

  // §17.5: the incoming grid re-staggers on a page turn. Skipped on mount,
  // where StaggeredItem's own entrance is already the cascade — bumping the
  // replay key there would start a second one a render later.
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (active) setCascade((c) => c + 1);
  }, [active]);

  // The card names a theme, so it should quote an entry that IS that theme —
  // the first one that tags to it, falling back to the month's opener if the
  // dominant theme came from entries that all tag on the fly.
  const themeSnippet = useMemo(() => {
    const match = entries.find((entry) => (entry.theme || tagEntry(entry.text)) === insightTheme);
    return (match || entries[0])?.text;
  }, [entries, insightTheme]);

  const openDay = (day) => {
    // R35: re-tapping the open day closes it; tapping a different filled day
    // swaps the content in place, with no close/reopen cycle — replaying the
    // rise on a card that never left the screen reads as a flinch.
    if (day === selectedDay) {
      setSelectedDay(null);
      return;
    }
    const wasOpen = selectedDay !== null;
    setSelectedDay(day);
    if (wasOpen) return;
    revealProgress.setValue(0);
    Animated.timing(revealProgress, {
      toValue: 1,
      duration: reduced ? DURATIONS.reducedMotionFade : DURATIONS.revealGlide,
      easing: reduced ? Easing.linear : Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handlePress = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    const cell = hexAt(locationX, locationY, cells, cellW, cellH);
    // Empty days don't open — the reveal is the entry, and there isn't one.
    if (!cell || !entriesByDay.has(cell.day)) return;
    openDay(cell.day);
  };

  const selectedEntries = selectedDay === null ? [] : entriesByDay.get(selectedDay) || [];
  // MonthGrid takes the filled set directly — its own render pass derives
  // the stagger index each filled day needs from this and `cells`, so it
  // isn't duplicated here.
  const filledDays = useMemo(() => new Set(entriesByDay.keys()), [entriesByDay]);

  return (
    <View style={styles.content}>
      {/* §17.5: the month's theme is something you tap for, not furniture
          that sits above the comb announcing itself. The title carries the
          affordance — a month with nothing in it has nothing to reveal, so
          it renders as plain text with no phantom tap target. */}
      {hasEntries ? (
        <PressableScale
          onPress={() => setThemeOpen((open) => !open)}
          style={styles.titleRow}
          accessibilityLabel={
            themeOpen
              ? `${monthName}, hide this month's theme`
              : `${monthName}, reveal this month's theme`
          }
        >
          <Text style={styles.title}>{title || monthName}</Text>
          <Ionicons
            name={themeOpen ? 'sparkles' : 'sparkles-outline'}
            size={18}
            color={theme.colors.accentDeep}
            style={styles.titleHint}
          />
        </PressableScale>
      ) : (
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title || monthName}</Text>
        </View>
      )}

      {/* Mounted on open, so the gold-back flip replays every time rather
          than only on the screen's first render. */}
      {themeOpen && (
        <View style={styles.themeCardSlot}>
          <ThemeCardFlip
            themeWord={insightTheme}
            snippet={themeSnippet}
            caption={insightDescription}
          />
        </View>
      )}

      {/* The comb — one hexagon per calendar day, in date order. Painting
          (Svg root, hatch, selection ring, per-day numeral/glow) lives in
          `MonthGrid` now (R15's extraction) — this wraps it with the
          interactive layer that stays Recap-specific: the whole-comb
          Pressable and the per-day VoiceOver targets. */}
      <View style={[styles.comb, { width: cellW * COLS, height }]}>
        <MonthGrid
          cells={cells}
          height={height}
          cellW={cellW}
          cellH={cellH}
          filledDays={filledDays}
          cascade={cascade}
          selectedDay={selectedDay}
          todayDay={todayDay}
        />

        {/* R33: exactly one Pressable for the whole comb. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handlePress}
          accessible={false}
        />

        {/* §17.7-adjacent: per-day screen-reader targets. `pointerEvents:
            none` keeps them out of the touch path (the overlay above owns
            every tap) while leaving them in the accessibility tree, so
            VoiceOver can still land on an individual day. This composition
            is UNVERIFIED on device — it is the mechanism half of R34's
            ratified requirement and is on the device-pass list. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {cells.map((cell) => {
            const dayEntries = entriesByDay.get(cell.day) || [];
            const filled = dayEntries.length > 0;
            return (
              <View
                key={cell.day}
                accessible
                accessibilityRole={filled ? 'button' : undefined}
                accessibilityLabel={
                  filled
                    ? `${monthName} ${cell.day}, ${dayEntries.length} ${dayEntries.length === 1 ? 'entry' : 'entries'}`
                    : `${monthName} ${cell.day}, no entry`
                }
                onAccessibilityTap={filled ? () => openDay(cell.day) : undefined}
                style={[styles.cellPosition, { left: cell.x, top: cell.y, width: cellW, height: cellH }]}
              />
            );
          })}
        </View>
      </View>

      {/* Directly below the comb, and after it in tree order — which is also
          the reading order VoiceOver walks, so the card lands right after the
          day that opened it. */}
      {selectedDay !== null && (
        <DayRevealCard
          monthName={monthName}
          day={selectedDay}
          entries={selectedEntries}
          progress={revealProgress}
          reduced={reduced}
          w={REVEAL_HEX_W}
          h={REVEAL_HEX_H}
          isToday={selectedDay === todayDay}
        />
      )}

      <Text style={styles.gridCaption}>
        {hasEntries
          ? `${entriesByDay.size} of ${daysInMonth} days filled in`
          : 'No entries this month yet.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    width: '100%',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  title: {
    ...theme.type.h1,
    color: theme.colors.ink,
    textAlign: 'center',
  },
  // The whole affordance: one small mark that fills in once the card is
  // open. Anything louder would be the PRIMARY THEME card again, wearing a
  // smaller hat.
  titleHint: {
    marginTop: 2,
  },
  themeCardSlot: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  // Cells are absolutely positioned: the 0.75h row pitch means rows must
  // overlap, which no flex row can express.
  comb: {
    position: 'relative',
  },
  // Also positions the a11y overlay's per-day targets over MonthGrid's own
  // cells — both need the same coordinates, one for touch, one for VoiceOver.
  cellPosition: {
    position: 'absolute',
  },
  // R35 — the hive's `revealCard` treatment, matched deliberately: white
  // surface, hairline border, card shadow. `alignSelf: stretch` because this
  // one sits in a centring column, where the hive's sits in a full-width one.
  revealCard: {
    alignSelf: 'stretch',
    marginTop: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.large,
    padding: 20,
    ...theme.shadows.card,
  },
  revealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  revealHex: {
    width: REVEAL_HEX_W,
    height: REVEAL_HEX_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealHexNumeral: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealHexText: {
    fontSize: 12,
    color: theme.colors.ink,
    fontFamily: theme.fonts.bodySemiBold,
  },
  revealDate: {
    fontFamily: theme.fonts.header,
    fontSize: 17,
    color: theme.colors.ink,
  },
  // Pushed right by the header's own flex, so the count sits at the card's
  // edge no matter how long the month's name is.
  revealCount: {
    ...theme.type.bodySm,
    marginLeft: 'auto',
    color: theme.colors.inkSoft,
  },
  // Hairline between entries only — a rule above the first one would fence
  // the day off from its own header.
  revealEntryRule: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
  },
  revealQuote: {
    fontFamily: theme.fonts.bodyItalic,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.textPrimary,
  },
  revealTheme: {
    ...theme.type.label,
    fontSize: 11,
    letterSpacing: 1.4,
    color: theme.colors.inkSoft,
    marginTop: 8,
  },
  gridCaption: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    marginTop: 16,
    marginBottom: 32,
  },
});
