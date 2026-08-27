import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { HiveStore } from '../services/HiveStore';
import { HoneycombStore } from '../services/HoneycombStore';
import { hiveCoverTheme } from '../constants/hiveThemes';
import { PressableScale } from '../components/PressableScale';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackButton } from '../components/BackButton';
import { PaperBlock, paperInk } from '../components/PaperBlock';

const longDate = (isoDate) => {
  // entry_date is a plain 'YYYY-MM-DD' — parsing it as local midnight
  // (matching dateRanges.js's own convention) avoids the off-by-one a bare
  // `new Date(isoDate)` gets from parsing it as UTC midnight instead.
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

const joinNames = (names) => {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
};

// §4.3 "presence, not count" (POLLINATE_MULTIWRITER_COPY_VOCAB.md) — the
// roster's whole job is naming who's writing, never how much any one of
// them has written. Named up to three (the owner reading this screen is
// implicitly "you" in "writing with X" — the sentence never re-names them);
// past that it falls back to the ratified numeric form ("Four of you are
// writing"), +1 for the owner themselves since the sentence addresses the
// whole writing group, not just the invited half of it. DES-21/OPEN-3
// reserves the roster's final visual treatment (avatar cluster vs. names)
// for Deezine — this is a reasonable default, not a ruling.
const rosterLabel = (contributors) => {
  if (contributors.length === 0) return "You're the only one writing so far.";
  const names = contributors.map((c) => c.name);
  if (names.length <= 3) return `Writing with ${joinNames(names)}.`;
  return `${contributors.length + 1} of you are writing.`;
};

// 8b.3 — entry list for one hive (Design Language §3), plus the seal/send
// entry points (§5-6, thread b57ad406 2026-08-19 — the gap found after
// 8b.2-8b.7 shipped with no way to trigger any of it). No edit-in-place
// (not in 8b.3's literal scope — "Author can add entries ... Entry list
// view with chronological ordering").
export const HiveDetailScreen = ({ navigation, route }) => {
  const { hiveId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hive, setHive] = useState(null);
  const [entries, setEntries] = useState([]);
  // Roster presence — only fetched for a hive `getHive` marks
  // `isCollective` (20260827000001), so a solo hive's screen pays for zero
  // extra round trips. GUIDES/POLLINATE_MULTIWRITER_COPY_VOCAB.md §4.3:
  // "presence, not count" — this list exists to render who, never a tally.
  const [contributors, setContributors] = useState([]);
  // §11 "Send only works for connected friends" — the subject may be a
  // registered profile who has since unfriended, or was never one to begin
  // with. Only fetched when it could matter (sealed, has a subject, not
  // sent yet) so an unsealed hive's screen never pays for a connections
  // round trip it can't use.
  const [subjectIsFriend, setSubjectIsFriend] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const [hiveData, entryList] = await Promise.all([
            HiveStore.getHive(hiveId),
            HiveStore.getHiveEntries(hiveId),
          ]);
          if (cancelled) return;
          setError(false);
          setHive(hiveData);
          setEntries(entryList);

          if (hiveData?.isCollective) {
            try {
              const roster = await HiveStore.getHiveContributors(hiveId);
              if (cancelled) return;
              setContributors(roster);
            } catch (err) {
              // The roster row is additive chrome on top of an otherwise
              // working screen — a failed roster read must not blank the
              // entry list or the seal/send affordances above it, so it is
              // swallowed here rather than routed into the screen's one
              // `error` flag (which would hide everything else too).
              if (cancelled) return;
              console.warn('HiveDetailScreen: failed to load contributors', err);
              setContributors([]);
            }
          } else {
            setContributors([]);
          }

          if (hiveData?.sealedAt && hiveData?.subjectProfileId && !hiveData?.sentAt) {
            const connections = await HoneycombStore.listConnections();
            if (cancelled) return;
            setSubjectIsFriend(connections.some((c) => c.id === hiveData.subjectProfileId));
          } else {
            setSubjectIsFriend(false);
          }
        } catch (err) {
          if (cancelled) return;
          console.warn('HiveDetailScreen: failed to load hive', err);
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }

  if (error || !hive) {
    return (
      <View style={[styles.container, styles.centered]}>
        <BackButton onPress={() => navigation.goBack()} style={styles.backButtonFloating} />
        <Text style={styles.emptyTitle}>We couldn't reach this hive.</Text>
        <Text style={styles.emptyBody}>Check your connection and try again.</Text>
      </View>
    );
  }

  const cover = hiveCoverTheme(hive.coverTheme);
  const memoryLabel = entries.length === 1 ? '1 memory' : `${entries.length} memories`;

  return (
    <View style={styles.container}>
      <View style={[styles.banner, { backgroundColor: cover.base }]}>
        <BackButton onPress={() => navigation.goBack()} variant="glass" color={cover.textColor} style={styles.backButton} />
        <Text style={[styles.bannerName, { color: cover.textColor }]}>{hive.subjectName}</Text>
        <Text style={[styles.bannerCount, { color: cover.textColor }]}>{memoryLabel}</Text>
      </View>

      {hive.isCollective && (
        <View style={styles.memoryLaneContainer}>
          <View style={styles.rosterRow}>
            <View style={styles.rosterText}>
              <Ionicons name="people" size={16} color={theme.colors.accentDeep} />
              {/* §4.3 — "presence, not count": names when they fit, a
                  presence sentence with a number when they don't ("Four of
                  you are writing" is explicitly ratified). Never a bare
                  count-only badge, and never a per-writer tally. */}
              <Text style={styles.rosterLabel} numberOfLines={1}>
                {rosterLabel(contributors)}
              </Text>
            </View>
            <PressableScale
              onPress={() => navigation.navigate('InviteContributor', { hiveId, subjectName: hive.subjectName })}
              accessibilityLabel="Invite a writer"
            >
              <Text style={styles.rosterInvite}>+ Invite a writer</Text>
            </PressableScale>
          </View>
        </View>
      )}

      {entries.length > 0 && (
        <PressableScale
          onPress={() =>
            navigation.navigate('MemoryLane', {
              hiveId,
              subjectName: hive.subjectName,
              coverTheme: hive.coverTheme,
            })
          }
          style={styles.memoryLaneRow}
          containerStyle={styles.memoryLaneContainer}
          accessibilityLabel="Take a trip down memory lane"
        >
          <View style={styles.memoryLaneContent}>
            <Ionicons name="sparkles" size={18} color={theme.colors.accentDeep} />
            <Text style={styles.memoryLaneText}>Trip Down Memory Lane</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.inkSoft} />
        </PressableScale>
      )}

      {!hive.sealedAt && entries.length > 0 && (
        <PressableScale
          onPress={() =>
            navigation.navigate('SealHive', {
              hiveId,
              subjectName: hive.subjectName,
              coverTheme: hive.coverTheme,
            })
          }
          style={styles.memoryLaneRow}
          containerStyle={styles.memoryLaneContainer}
          accessibilityLabel="Seal this keepsake"
        >
          <View style={styles.memoryLaneContent}>
            <Ionicons name="lock-closed" size={18} color={theme.colors.accentDeep} />
            <Text style={styles.memoryLaneText}>Seal This Keepsake</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.inkSoft} />
        </PressableScale>
      )}

      {hive.sealedAt && subjectIsFriend && (
        <PressableScale
          onPress={() =>
            navigation.navigate('SendHive', {
              hiveId,
              subjectName: hive.subjectName,
              coverTheme: hive.coverTheme,
            })
          }
          style={styles.memoryLaneRow}
          containerStyle={styles.memoryLaneContainer}
          accessibilityLabel={`Send to ${hive.subjectName}`}
        >
          <View style={styles.memoryLaneContent}>
            <Ionicons name="paper-plane" size={18} color={theme.colors.accentDeep} />
            <Text style={styles.memoryLaneText}>Send to {hive.subjectName}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.inkSoft} />
        </PressableScale>
      )}

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={styles.emptyTitle}>No memories yet.</Text>
            <Text style={styles.emptyBody}>Add the first one whenever you're ready.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <Text style={styles.entryDate}>{longDate(item.date)}</Text>
            <PaperBlock paper={item.paper}>
              <Text style={[styles.entryText, { color: paperInk(item.paper) }]} numberOfLines={4}>
                {item.text}
              </Text>
            </PaperBlock>
          </View>
        )}
      />

      {hive.sealedAt ? (
        <View style={styles.footer}>
          <Text style={styles.sealedNote}>
            {hive.sentAt ? `Sent to ${hive.subjectName}.` : 'This hive is sealed — entries are read-only.'}
          </Text>
        </View>
      ) : (
        <View style={styles.footer}>
          <PrimaryButton
            onPress={() => navigation.navigate('ComposeHiveEntry', { hiveId, subjectName: hive.subjectName })}
          >
            + Add Entry
          </PrimaryButton>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  banner: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonFloating: {
    position: 'absolute',
    top: 60,
    left: 24,
  },
  bannerName: {
    ...theme.type.h1,
  },
  bannerCount: {
    ...theme.type.bodySm,
    marginTop: 4,
  },
  memoryLaneContainer: {
    marginHorizontal: 24,
    marginTop: 16,
  },
  memoryLaneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  memoryLaneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memoryLaneText: {
    ...theme.type.bodySm,
    color: theme.colors.ink,
    fontFamily: theme.fonts.bodySemiBold,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    marginBottom: 12,
  },
  rosterText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    marginRight: 12,
  },
  rosterLabel: {
    ...theme.type.bodySm,
    color: theme.colors.ink,
    flexShrink: 1,
  },
  rosterInvite: {
    ...theme.type.bodySm,
    color: theme.colors.accentDeep,
    fontFamily: theme.fonts.bodySemiBold,
  },
  list: {
    padding: 24,
    paddingBottom: 120,
  },
  emptyList: {
    alignItems: 'center',
    paddingTop: 48,
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
  entryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  entryDate: {
    ...theme.type.label,
    color: theme.colors.inkSoft,
    marginBottom: 8,
  },
  entryText: {
    ...theme.type.body,
    color: theme.colors.ink,
  },
  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 32,
  },
  sealedNote: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    textAlign: 'center',
  },
});
