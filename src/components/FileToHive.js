import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { hiveCoverTheme } from '../constants/hiveThemes';
import { HiveStore } from '../services/HiveStore';
import { PressableScale } from './PressableScale';
import { GradientCard } from './GradientCard';
import { StaggeredItem } from './StaggeredItem';

// DES-16 — "File this to…". Files today's saved entry into one or more of
// the user's hives as a frozen COPY (Fizz's routing, msg `3da67b75`): the
// personal journal row is never touched, so this component owns no risk to
// Today, the streak, Recap, Wrapped, or the once-per-day constraint — all of
// that stays exactly as it was before this file existed.
//
// Not a sheet — GUIDES/POLLINATE_V2_DES16_FILE_TO_HIVE.md §2. It is an
// in-place expansion of the entry card it lives inside, the same archetype
// `IdeasAccordion` already established.
const READ_ERROR_MESSAGE = "Couldn't check your hives.";

export const FileToHive = ({ entry, hives }) => {
  const [open, setOpen] = useState(false);
  const [filedIds, setFiledIds] = useState(() => new Set());
  // §16.5 makes the client the ONLY enforcement against same-hive re-filing —
  // the database has no dedupe by design (`HiveStore.js:188-191`). So this
  // can't be a "loading" flag that clears on both success and failure: rows
  // must stay untappable until a read RESOLVES SUCCESSFULLY, fail-closed,
  // because a flaky network is exactly when someone re-taps. Ruled by Lumen
  // (2026-08-25) after review upgraded the fail-open version to blocking.
  const [readResolved, setReadResolved] = useState(false);
  const [readFailed, setReadFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [raceSealedIds, setRaceSealedIds] = useState(() => new Set());
  const [failure, setFailure] = useState(null);

  // §1a(b)/§5 — taken on expand, not on mount, since the whole point is to
  // catch a filing that happened on another device. Re-fires every time the
  // chevron opens, and again on `retryToken` — the retry action bumps it.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setReadResolved(false);
    setReadFailed(false);
    HiveStore.getFiledHiveIds(entry.date)
      .then((ids) => {
        if (cancelled) return;
        setFiledIds(ids);
        setReadResolved(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('FileToHive: failed to read filed set', err);
        setReadFailed(true);
        AccessibilityInfo.announceForAccessibility(READ_ERROR_MESSAGE);
      });
    return () => {
      cancelled = true;
    };
  }, [open, entry.date, retryToken]);

  const retryRead = () => setRetryToken((t) => t + 1);

  const toggle = () => {
    setFailure(null);
    setOpen((o) => !o);
  };

  const commitTo = async (hive) => {
    setFailure(null);
    // Optimistic close (§5) — the consequence is stated one line above the
    // rows, the list is short, and tapping a live row is itself the commit.
    // The close is synchronous with the tap, so there is no render in which
    // a second row is both visible and tappable.
    setOpen(false);
    try {
      // §1a(a) — `entry.date` is a 'YYYY-MM-DD' string; parse it as LOCAL
      // midnight, not UTC, or every user west of UTC files the copy dated
      // yesterday.
      await HiveStore.addHiveEntry(hive.id, new Date(`${entry.date}T00:00:00`), entry.text, entry.theme);
      setFiledIds((prev) => new Set(prev).add(hive.id));
    } catch (err) {
      // §5 — on failure the expansion stays open and gains a line above the
      // rows, so the reopen here overrides the optimistic close above.
      setOpen(true);
      let message;
      if (err?.code === '42501') {
        // §1a(c) — a sealed race: refused at the database, not dropped.
        setRaceSealedIds((prev) => new Set(prev).add(hive.id));
        message = `${hive.subjectName}'s hive was sealed. Nothing more can go in.`;
      } else {
        message = "We couldn't file it. Try again.";
      }
      setFailure(message);
      // accessibilityLiveRegion is Android-only; without this an iOS
      // VoiceOver user gets no signal that the filing failed at all.
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  const filedHives = hives.filter((h) => filedIds.has(h.id));
  let collapsedLabel = 'File this to…';
  if (filedHives.length === 1) collapsedLabel = `Filed to ${filedHives[0].subjectName}'s hive.`;
  else if (filedHives.length > 1) collapsedLabel = `Filed to ${filedHives.length} hives.`;

  const rowsDisabled = !readResolved;
  const rows = hives.length > 5 ? (
    <ScrollableRows hives={hives} filedIds={filedIds} raceSealedIds={raceSealedIds} disabled={rowsDisabled} onCommit={commitTo} />
  ) : (
    <Rows hives={hives} filedIds={filedIds} raceSealedIds={raceSealedIds} disabled={rowsDisabled} onCommit={commitTo} />
  );

  // The announced label tracks the visible one — a sighted user sees
  // "Filed to 2 hives." replace the default prompt, so VoiceOver must hear
  // the same change rather than a sentence that never varies.
  const affordanceLabel = collapsedLabel === 'File this to…'
    ? "File today's entry into one of your hives"
    : collapsedLabel;

  return (
    <View style={styles.container}>
      <View style={styles.rule} />
      <PressableScale
        style={styles.affordanceRow}
        onPress={toggle}
        accessibilityLabel={affordanceLabel}
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.affordanceText}>{collapsedLabel}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.inkSoft} />
      </PressableScale>

      {open && (
        <View style={styles.expansion}>
          <Text style={styles.consequence}>Once filed, it stays there.</Text>
          {readFailed && (
            // Rows below stay rendered but untappable (`rowsDisabled`) — this
            // is not a takeover, it's the reason the rows aren't live yet.
            <View style={styles.readErrorRow}>
              <Text style={styles.readErrorText}>{READ_ERROR_MESSAGE}</Text>
              <PressableScale
                onPress={retryRead}
                haptic={null}
                accessibilityRole="button"
                accessibilityLabel="Retry checking your hives"
              >
                <Text style={styles.readErrorAction}>Try again</Text>
              </PressableScale>
            </View>
          )}
          {failure && <Text style={styles.failure}>{failure}</Text>}
          {rows}
        </View>
      )}
    </View>
  );
};

const ROW_HEIGHT = 52;

const Rows = ({ hives, filedIds, raceSealedIds, disabled, onCommit }) => (
  <View style={styles.rowList}>
    {hives.map((hive, index) => (
      <StaggeredItem key={hive.id} index={index} count={hives.length}>
        <HiveRow
          hive={hive}
          filed={filedIds.has(hive.id)}
          sealed={!!hive.sealedAt || raceSealedIds.has(hive.id)}
          disabled={disabled}
          onPress={onCommit}
        />
      </StaggeredItem>
    ))}
  </View>
);

// §5 — beyond five hives the list scrolls at a fixed height rather than
// growing the card past the viewport. Nested inside the screen's own
// vertical ScrollView, same as the horizontal hive shelf already is.
const ScrollableRows = ({ hives, filedIds, raceSealedIds, disabled, onCommit }) => (
  <ScrollView style={styles.scrollRows} nestedScrollEnabled showsVerticalScrollIndicator={false}>
    <Rows hives={hives} filedIds={filedIds} raceSealedIds={raceSealedIds} disabled={disabled} onCommit={onCommit} />
  </ScrollView>
);

const HiveRow = ({ hive, filed, sealed, disabled, onPress }) => {
  const cover = hiveCoverTheme(hive.coverTheme);
  const memoryLabel = hive.entryCount === 1 ? '1 memory' : `${hive.entryCount} memories`;
  const tag = sealed ? 'SEALED' : filed ? 'FILED' : null;
  const tappable = !tag && !disabled;

  const body = (
    <>
      <GradientCard
        style={styles.swatch}
        contentStyle={[styles.swatchFill, { backgroundColor: cover.base }]}
        colors={theme.gradients.sheen}
      />
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={2}>{hive.subjectName}</Text>
        <Text style={styles.rowCount}>{memoryLabel}</Text>
      </View>
      {tag && <Text style={styles.rowTag}>{tag}</Text>}
    </>
  );

  if (!tappable) {
    // §5 — a tagged row takes no press handler at all, rather than a
    // disabled PressableScale whose fade is the dim §23.9.2a rules out for
    // an ink-tier label.
    return (
      <View
        style={styles.row}
        accessible
        accessibilityLabel={tag ? `${hive.subjectName}, ${memoryLabel}, ${tag}` : `${hive.subjectName}, ${memoryLabel}`}
      >
        {body}
      </View>
    );
  }

  return (
    <PressableScale
      style={styles.row}
      onPress={() => onPress(hive)}
      haptic={Haptics.ImpactFeedbackStyle.Medium}
      pressedColor={theme.colors.pressedOnLight}
      accessibilityLabel={`${hive.subjectName}, ${memoryLabel}`}
    >
      {body}
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    width: '100%',
  },
  rule: {
    height: 1,
    backgroundColor: theme.colors.surfaceBorder,
    width: '100%',
  },
  affordanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
  },
  affordanceText: {
    ...theme.type.bodySm,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.ink,
  },
  expansion: {
    paddingTop: 16,
  },
  consequence: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    textAlign: 'center',
  },
  failure: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginTop: 8,
  },
  readErrorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  readErrorText: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
  },
  readErrorAction: {
    ...theme.type.bodySm,
    color: theme.colors.ink,
    textDecorationLine: 'underline',
  },
  rowList: {
    paddingTop: 8,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderRadius: theme.borderRadius.small,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    backgroundColor: theme.colors.rowVeil,
    paddingHorizontal: 12,
    gap: 12,
  },
  swatch: {
    width: 28,
    height: 28,
  },
  swatchFill: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorderStrong,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    ...theme.type.bodySm,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.ink,
  },
  rowCount: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
    color: theme.colors.inkSoft,
  },
  scrollRows: {
    maxHeight: 5 * ROW_HEIGHT,
  },
  rowTag: {
    ...theme.type.label,
    color: theme.colors.inkSoft,
  },
});
