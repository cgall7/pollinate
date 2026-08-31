import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { HiveStore } from '../services/HiveStore';
import { hiveCoverTheme } from '../constants/hiveThemes';
import { useAuth } from '../contexts/AuthContext';
import { PressableScale } from '../components/PressableScale';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackButton } from '../components/BackButton';
import { PaperBlock, paperInk } from '../components/PaperBlock';
import { isPlaceholderName } from '../utils/placeholderName';

const longDate = (isoDate) => {
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

// Same presence-not-count rule and the same reasonable-default judgement as
// HiveDetail.js's `rosterLabel` — kept as a sibling copy rather than a
// shared import because the two screens count differently in a way that
// isn't just the owner's "+1": `getHiveContributors` returns every ACTIVE
// contributor for the hive, and on THIS screen the caller is themselves one
// of those rows (unlike HiveDetail, whose caller is the owner, who is never
// a `hive_contributors` row for their own hive). Naming yourself in
// "Writing with X, Y, and yourself" would be a real defect, not a style
// choice, so `selfId` filters the caller out before the roster is named —
// and the owner is folded in by name instead, since (unlike HiveDetail) the
// owner never appears in `contributors` here either.
const rosterLabel = (ownerName, contributors, selfId) => {
  const otherNames = contributors.filter((c) => c.profileId !== selfId).map((c) => c.name);
  // +2: the owner plus the caller themselves, neither of whom `otherNames`
  // counts. Counted here rather than off `names.length` below because
  // Finding A (thread b57ad406, 2026-08-31) can make `ownerName` null (a
  // comb-linked hive whose organizer name is placeholder-class) — the owner
  // is still a real, uncounted writer even on the row that can't name them.
  const totalWriters = otherNames.length + 2;
  if (totalWriters > 4) return `${totalWriters} of you are writing.`;
  const names = [ownerName, ...otherNames].filter(Boolean);
  // The owner-unnamed, no-other-contributors edge case: 'someone' matches
  // this file's own house word for the identical situation one line up
  // (`subjectDisplayName`) — never "only one," which would deny a writer
  // who is present, just unnamed.
  if (names.length === 0) return 'Writing with someone.';
  return `Writing with ${joinNames(names)}.`;
};

// ENG-61 — a contributor's own writing surface. Mirrors HiveDetail.js's
// entry-list shape (same PaperBlock entry cards, same "+ Add Entry" footer
// into the already-generic ComposeHiveEntry.js) with the owner-only half
// removed outright rather than disabled: no Memory Lane (8b.4 is the
// owner's bloom moment), no Seal/Send footer — POLLINATE_MULTIWRITER_COPY_
// VOCAB.md §4.4: "For writers, the seal control is absent, not disabled —
// we never render authority someone doesn't have." Backed by
// `getContributingHive`/`getHiveContributors`, the contributor-scoped reads,
// never `getHive`/HiveDetail's owner-scoped ones.
export const ContributingHiveScreen = ({ navigation, route }) => {
  const { hiveId } = route.params;
  const { session } = useAuth();
  const selfId = session?.user?.id ?? null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hive, setHive] = useState(null);
  const [entries, setEntries] = useState([]);
  const [contributors, setContributors] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const [hiveData, entryList] = await Promise.all([
            HiveStore.getContributingHive(hiveId),
            HiveStore.getHiveEntries(hiveId),
          ]);
          if (cancelled) return;
          setError(false);
          setHive(hiveData);
          setEntries(entryList);

          try {
            const roster = await HiveStore.getHiveContributors(hiveId);
            if (cancelled) return;
            setContributors(roster);
          } catch (err) {
            // Same posture as HiveDetail.js's own roster fetch — additive
            // chrome, not load-bearing for the rest of the screen.
            if (cancelled) return;
            console.warn('ContributingHiveScreen: failed to load contributors', err);
            setContributors([]);
          }
        } catch (err) {
          if (cancelled) return;
          console.warn('ContributingHiveScreen: failed to load hive', err);
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
  // ENG-96/COPY-6: a comb-minted hive's subject_name can be placeholder-
  // class ('New user', or 'Someone' via the mint's own backstop) — never
  // render the stored value verbatim here. Lowercase 'someone', the same
  // house shape as RotationFold's member line.
  const subjectDisplayName = isPlaceholderName(hive.subjectName) ? 'someone' : hive.subjectName;

  return (
    <View style={styles.container}>
      <View style={[styles.banner, { backgroundColor: cover.base }]}>
        <BackButton onPress={() => navigation.goBack()} variant="glass" color={cover.textColor} style={styles.backButton} />
        <Text style={[styles.bannerName, { color: cover.textColor }]}>{subjectDisplayName}</Text>
        {/* ReceivedPackagesScreen renders "A hive for you" — second person,
            R-38.9-H — because its reader IS the subject. This screen's
            reader is a contributor, not the subject, so third person is
            still right; only the placeholder-class guard applies here. */}
        {/* Finding A (thread b57ad406, 2026-08-31): `hive.ownerName` is null
            for a comb-linked hive whose organizer name is placeholder-class
            — omit the from-clause rather than render a name we don't have. */}
        <Text style={[styles.bannerAttribution, { color: cover.textColor }]}>
          {hive.ownerName ? (
            <>A hive for {subjectDisplayName}, from {hive.ownerName}</>
          ) : (
            <>A hive for {subjectDisplayName}</>
          )}
        </Text>
        <Text style={[styles.bannerCount, { color: cover.textColor }]}>{memoryLabel}</Text>
      </View>

      <View style={styles.rosterContainer}>
        <View style={styles.rosterRow}>
          <Ionicons name="people" size={16} color={theme.colors.accentDeep} />
          <Text style={styles.rosterLabel} numberOfLines={1}>
            {rosterLabel(hive.ownerName, contributors, selfId)}
          </Text>
        </View>
      </View>

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
          <Text style={styles.sealedNote}>This hive is sealed — entries are read-only.</Text>
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
  bannerAttribution: {
    ...theme.type.bodySm,
    marginTop: 4,
  },
  bannerCount: {
    ...theme.type.bodySm,
    marginTop: 4,
  },
  rosterContainer: {
    marginHorizontal: 24,
    marginTop: 16,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  rosterLabel: {
    ...theme.type.bodySm,
    color: theme.colors.ink,
    flexShrink: 1,
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
