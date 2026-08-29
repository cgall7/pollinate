import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { AnimatedStat } from '../components/AnimatedStat';
import { GlowOrb } from '../components/GlowOrb';
import { LoadState, LOAD_STATES } from '../components/LoadState';
import { SealCrack } from '../components/SealCrack';
import { StreakHexTrail } from '../components/StreakHexTrail';
import { ThemeCardFlip } from '../components/ThemeCardFlip';
import { MonthGrid } from '../components/MonthGrid';
import { YearCard } from '../components/YearCard';
import { HoneyDropProgress } from '../components/HoneyDropProgress';
import { CelebrationRays } from '../components/CelebrationRays';
import { EntryStore } from '../services/EntryStore';
import { dominantTheme, tagEntry } from '../utils/themeTagger';
import { startOfMonth, endOfMonth, monthName, longestStreak } from '../utils/dateRanges';
import { COLS, HEX_ASPECT, combLayout } from '../utils/combGeometry';
import { DURATIONS, SPRINGS, useReducedMotion } from '../constants/motion';

const DISMISS_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

// §14.2 respec (2026-08-28) — the recurring edition. §0: none of §14.2's
// seven annual beats were ever built; this is the first build of any
// Wrapped screen, re-scoped to the previous calendar month. The annual
// "Your Golden Year" special (§1: December only) is a separate, later
// build — this file no longer carries the four-slide deck §0 found
// reachable, or its DEMO_SLIDES fabrication (§4.3: "Wrapped fabricates
// you" — dies with the deck, no replacement).

// The beat a month with a confident dominant theme gets. §4.2: a plurality
// of one entry is not a finding, so a month whose top theme is a tie
// broken by insertion order (`count === 1`) skips this beat rather than
// assert a "North Star" from a single line.
const hasThemeBeat = (insight) => !!insight && insight.count > 1;

// §4.3's own floor example draws the line for this beat too: "a month with
// two entries has an honest, thin Wrapped... no run beat (§4.1 gives 1)."
// A run of exactly one day isn't a run — `longestStreak` returns 1 for any
// non-empty month with no two consecutive dates in it, and a beat built to
// celebrate consecutive days has nothing to celebrate at that floor.
const hasRunBeat = (run) => run > 1;

// The sentence a theme card under it wants — §17.5's shape, reused rather
// than re-derived (`RecapTab.js`'s own `describeTheme` is the same idea,
// scoped to whatever period label its caller passes).
const describeTheme = (insight) => {
  if (!insight) return null;
  const { theme: themeName, count, total } = insight;
  return `You leaned into "${themeName}" ${count} of ${total} days this month.`;
};

const buildWrappedData = (entries, monthDate) => {
  const now = new Date();
  const label = monthName(monthDate);
  const title = monthDate.getFullYear() === now.getFullYear() ? label : `${label} ${monthDate.getFullYear()}`;
  const daysInMonth = endOfMonth(monthDate).getDate();
  const insight = dominantTheme(entries);
  const themeSnippet = insight
    ? (entries.find((entry) => (entry.theme || tagEntry(entry.text)) === insight.theme) || entries[0])?.text
    : null;
  const filledDays = new Set(entries.map((entry) => parseInt(entry.date.split('-')[2], 10)));

  return {
    label,
    title,
    daysInMonth,
    entryCount: entries.length,
    // §4.1: handed only this month's entries, `longestStreak` already
    // reports the longest run WHOLLY inside them — a run that crossed in
    // from January never gets counted, because January's dates aren't in
    // the set it's searching. The copy still has to name the window
    // (below): the number alone reads as the unscoped, all-time streak
    // `RecapTab:281` shows one tap away.
    longestRun: longestStreak(entries),
    insight,
    themeSnippet,
    filledDays,
  };
};

export const PollinateWrapped = ({ onComplete }) => {
  const [readState, setReadState] = useState(LOAD_STATES.LOADING);
  const [data, setData] = useState(null);
  const [beatIndex, setBeatIndex] = useState(0);
  const reduced = useReducedMotion();
  // Cross-beat transition — fade + rise on every beat change, same
  // treatment the four-slide deck used, now driving five (or four) beats
  // instead of a uniform card.
  const beatAnim = useRef(new Animated.Value(1)).current;

  const cancelledRef = useRef(false);
  const load = useCallback(async () => {
    setReadState(LOAD_STATES.LOADING);
    try {
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      // §1: the window is the previous calendar month, not a rolling 30
      // days — this is the first line the respec changes from the old
      // `getEntriesBetween(startOfYear(now), endOfYear(now))` read.
      const entries = await EntryStore.getEntriesBetween(startOfMonth(prevMonth), endOfMonth(prevMonth));
      if (cancelledRef.current) return;
      setData(buildWrappedData(entries, prevMonth));
      setBeatIndex(0);
      setReadState(LOAD_STATES.READY);
    } catch (err) {
      if (cancelledRef.current) return;
      setReadState(LOAD_STATES.UNKNOWN);
      console.warn('Failed to load entries for Wrapped', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cancelledRef.current = false;
      load();
      return () => {
        cancelledRef.current = true;
      };
    }, [load])
  );

  // §2: five beats, four when the theme beat's own condition (§4.2) isn't
  // met. The hook's drop count is this list's length, not a literal —
  // it never promises a beat it won't deliver.
  const beats = useMemo(() => {
    if (!data) return [];
    const list = ['seal', 'count'];
    if (hasRunBeat(data.longestRun)) list.push('run');
    if (hasThemeBeat(data.insight)) list.push('loved');
    list.push('card');
    return list;
  }, [data]);

  useEffect(() => {
    if (!data) return;
    beatAnim.setValue(0);
    if (reduced) {
      Animated.timing(beatAnim, { toValue: 1, duration: DURATIONS.reducedMotionFade, useNativeDriver: true }).start();
      return;
    }
    Animated.spring(beatAnim, { toValue: 1, ...SPRINGS.reveal, useNativeDriver: true }).start();
  }, [beatIndex, data, reduced]);

  // §7 build pin 6: `onComplete` is wired (App.js passes
  // `navigation.goBack()`) and load-bearing — no `setBeatIndex(0)`
  // fallback on the last beat. §26.3's loop stays fixed.
  const nextBeat = useCallback(() => {
    setBeatIndex((i) => (i < beats.length - 1 ? i + 1 : i));
  }, [beats.length]);

  // The generic "tap to continue" gesture carries its own light haptic.
  // Beat 0 doesn't route through this — `SealCrack` already fires a
  // Medium haptic on the crack itself, and stacking this on top of it
  // would read as two taps registering instead of one.
  const advance = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    nextBeat();
  }, [nextBeat]);

  const finish = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  if (readState === LOAD_STATES.UNKNOWN) {
    return (
      <View style={styles.loadingContainer}>
        <TouchableOpacity
          onPress={finish}
          hitSlop={DISMISS_HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.unknownDismiss}
        >
          <Ionicons name="chevron-down" size={26} color={theme.colors.ink} />
        </TouchableOpacity>
        <LoadState
          state={LOAD_STATES.UNKNOWN}
          onRetry={load}
          title="Couldn't reach your month"
          body="Something went wrong on the way to the hive."
          actionLabel="Try again"
          retryAccessibilityLabel="Try loading your Wrapped again"
        />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }

  const beatKey = beats[beatIndex];
  const isLastBeat = beatIndex === beats.length - 1;
  const onAdvance = isLastBeat ? finish : advance;
  const rise = beatAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <HoneyDropProgress filled={beatIndex + 1} total={beats.length} />
      </View>

      <Animated.View style={[styles.beatFill, { opacity: beatAnim, transform: [{ translateY: rise }] }]}>
        {beatKey === 'seal' && (
          <SealCrack copy={`${data.label}, poured.`} onCracked={nextBeat} />
        )}
        {beatKey === 'count' && <CountBeat monthLabel={data.label} count={data.entryCount} onAdvance={onAdvance} />}
        {beatKey === 'run' && <RunBeat monthLabel={data.label} run={data.longestRun} onAdvance={onAdvance} />}
        {beatKey === 'loved' && (
          <LovedBeat insight={data.insight} snippet={data.themeSnippet} onAdvance={onAdvance} />
        )}
        {beatKey === 'card' && <CardBeat data={data} onAdvance={onAdvance} />}
      </Animated.View>
    </View>
  );
};

// Beat 1 — "One number, comically big" (§3.1). Pigment is `ink`, not a
// choice: `AnimatedStat`'s own numeral is baked to `ink` (R127/
// numeral-pigment); the beat's own hue lives in `GlowOrb` only, the one
// consumer §2 still allows it to have.
const CountBeat = ({ monthLabel, count, onAdvance }) => (
  <Pressable style={styles.beatFill} onPress={onAdvance}>
    <View style={styles.slideContent}>
      <GlowOrb size={340} color={theme.colors.accent} intensity={0.5} style={styles.slideGlow} />
      <Text style={styles.subtitle}>{monthLabel}</Text>
      <Text style={styles.title}>Your Month in Gratitude</Text>
      <View style={[styles.valueContainer, { backgroundColor: theme.colors.washYellow }]}>
        <AnimatedStat value={String(count)} style={styles.value} />
        <Text style={styles.label}>Moments of reflection</Text>
      </View>
      <Text style={styles.tapHint}>Tap to continue →</Text>
    </View>
  </Pressable>
);

// Beat 2 — "The Run" (§3.2/§4.1). The copy names the window — the ruled
// fix for a windowed stat next to `RecapTab`'s unscoped all-time one.
const RunBeat = ({ monthLabel, run, onAdvance }) => (
  <Pressable style={styles.beatFill} onPress={onAdvance}>
    <View style={styles.slideContent}>
      <Text style={styles.subtitle}>Best Run</Text>
      <Text style={styles.title}>{`${run} Day${run === 1 ? '' : 's'}`}</Text>
      <StreakHexTrail count={run} />
      <Text style={[styles.label, styles.runLabel]}>{`Your best run in ${monthLabel}.`}</Text>
      <Text style={styles.tapHint}>Tap to continue →</Text>
    </View>
  </Pressable>
);

// Beat 3 — "What You Loved" (§3.3), one card, only mounted when §4.2's
// condition holds — `beats` never includes `'loved'` otherwise.
const LovedBeat = ({ insight, snippet, onAdvance }) => (
  <Pressable style={styles.beatFill} onPress={onAdvance}>
    <View style={styles.slideContent}>
      <Text style={styles.subtitle}>What You Loved</Text>
      <View style={styles.themeCardSlot}>
        <ThemeCardFlip themeWord={insight.theme} snippet={snippet} caption={describeTheme(insight)} />
      </View>
      <Text style={styles.tapHint}>Tap to continue →</Text>
    </View>
  </Pressable>
);

// Beat 4 — "The Month Card" (§3.4/§2): the annual edition's Beat 4
// "Brightest Month" grid-fill promoted to finale position, one grid
// instead of twelve. Assembles, detonates, resolves into `YearCard`'s
// frame with a month's content rather than a second component.
//
// Crop safety (1:1 and 9:16, on device) is unchanged and still owed — see
// `YearCard.js`'s own header. Nothing below has been on a device either.
const CARD_WIDTH = 320;
const WATERMARK_SCALE = 0.35;

const CardBeat = ({ data, onAdvance }) => {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const cellW = Math.floor((width - 80) / COLS);
  const cellH = cellW * HEX_ASPECT;
  const { cells, height } = useMemo(
    () => combLayout(data.daysInMonth, cellW, cellH),
    [data.daysInMonth, cellW, cellH]
  );

  const wCellW = Math.floor((CARD_WIDTH * 0.7) / COLS) * WATERMARK_SCALE;
  const wCellH = wCellW * HEX_ASPECT;
  const watermarkLayout = useMemo(
    () => combLayout(data.daysInMonth, wCellW, wCellH),
    [data.daysInMonth, wCellW, wCellH]
  );

  const [detonating, setDetonating] = useState(false);
  const [resolved, setResolved] = useState(false);
  const gridOpacity = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const resolveTimer = useRef(null);

  const handleSettled = useCallback(() => {
    setDetonating(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const delay = reduced ? DURATIONS.reducedMotionFade : DURATIONS.celebrate;
    resolveTimer.current = setTimeout(() => {
      setResolved(true);
      Animated.parallel([
        Animated.timing(gridOpacity, { toValue: 0, duration: DURATIONS.quick, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: DURATIONS.quick, useNativeDriver: true }),
      ]).start();
    }, delay);
  }, [reduced]);

  useEffect(() => () => resolveTimer.current && clearTimeout(resolveTimer.current), []);

  return (
    <Pressable style={styles.beatFill} onPress={onAdvance}>
      <View style={styles.cardStage}>
        {!resolved && (
          <Animated.View pointerEvents="none" style={{ opacity: gridOpacity }}>
            <MonthGrid
              cells={cells}
              height={height}
              cellW={cellW}
              cellH={cellH}
              filledDays={data.filledDays}
              cascade={1}
              onSettled={handleSettled}
            />
            {detonating && (
              <View pointerEvents="none" style={styles.cardBurstStage}>
                <CelebrationRays />
              </View>
            )}
          </Animated.View>
        )}
        <Animated.View pointerEvents="none" style={[styles.resolvedCard, { opacity: cardOpacity }]}>
          <YearCard
            totalEntries={data.entryCount}
            subtitle={data.title}
            themeWord={hasThemeBeat(data.insight) ? data.insight.theme : ''}
            width={CARD_WIDTH}
            watermark={
              <MonthGrid
                cells={watermarkLayout.cells}
                height={watermarkLayout.height}
                cellW={wCellW}
                cellH={wCellH}
                filledDays={data.filledDays}
              />
            }
          />
        </Animated.View>
      </View>
      <Text style={styles.tapHint}>Tap to finish</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unknownDismiss: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  progressContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  beatFill: {
    flex: 1,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  slideGlow: {
    alignSelf: 'center',
  },
  subtitle: {
    ...theme.type.label,
    textAlign: 'center',
    color: theme.colors.inkSoft,
    fontSize: 15,
    letterSpacing: 4,
    marginBottom: 10,
  },
  title: {
    ...theme.type.h1,
    color: theme.colors.ink,
    textAlign: 'center',
    marginBottom: 48,
  },
  themeCardSlot: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  valueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: theme.borderRadius.large,
    width: '100%',
    ...theme.shadows.card,
  },
  value: {
    ...theme.type.display,
    color: theme.colors.ink,
    textAlign: 'center',
    marginBottom: 10,
  },
  label: {
    ...theme.type.bodyLg,
    color: theme.colors.textSecondary,
    fontSize: 18,
    textAlign: 'center',
  },
  runLabel: {
    marginTop: 32,
  },
  tapHint: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    ...theme.type.bodySm,
    color: theme.colors.textSecondary,
    opacity: 0.6,
  },
  cardStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBurstStage: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolvedCard: {
    position: 'absolute',
  },
});
