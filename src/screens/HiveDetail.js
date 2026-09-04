import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { HiveStore } from '../services/HiveStore';
import { hiveCoverTheme } from '../constants/hiveThemes';
import { PressableScale } from '../components/PressableScale';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackButton } from '../components/BackButton';
import { EntryCombGrid, DIVE_CHROME_DIM, CELL_SIZE } from '../components/EntryCombGrid';
import { PerchAnchor, PerchField, usePerchSet } from '../components/PerchAnchor';
import { FlyingBee } from '../components/FlyingBee';
import { ringStepFor } from '../components/combLattice';
import { initialsFor } from '../utils/initials';
import { useAuth } from '../contexts/AuthContext';

// R-CD-12 — the home-bound flight needs the same staging-offset geometry as
// the outbound one; the outbound leg gets its ringStep from EntryCombGrid's
// own tap measurement (it owns CELL_SIZE), this is the return leg's copy of
// the identical derivation so the two legs read as one grammar.
const HOME_RING_STEP = ringStepFor(CELL_SIZE);

// Distance from the bottom of the comb's stage to the top of the floating
// footer. `styles.footer` is absolutely positioned, so it takes no layout
// room the stage could see on its own — the comb would centre itself
// underneath it. The footer's HEIGHT is measured rather than assumed (it
// holds a 56pt button on an open hive and a short caption on a sealed one),
// and only its `bottom` offset is a constant here, because this file owns it.
const FOOTER_BOTTOM = 32;

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
// Row 1.15 (thread b57ad406, 2026-08-31): `getHiveContributors` can now
// answer a placeholder-class name as `null` (Row 1.15's `resolveDirectName`
// in HiveStore.js) rather than falling through to a printable-but-wrong
// string — so `names` below is the DISPLAYABLE subset, while the numeric
// branches below still gate on `contributors.length`, the real headcount,
// so an unnamed writer is never dropped from the count the way they're
// dropped from the sentence.
const rosterLabel = (contributors) => {
  if (contributors.length === 0) return "You're the only one writing so far.";
  const names = contributors.map((c) => c.name).filter(Boolean);
  if (contributors.length <= 3 && names.length > 0) return `Writing with ${joinNames(names)}.`;
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
  const [footerHeight, setFooterHeight] = useState(0);
  const { session } = useAuth();
  // Shared with EntryCombGrid (POLLINATE_COMB_DIVE_SPEC.md R-CD-1) — one
  // driver for the whole dive, so the chrome above the card and the
  // camera/paper inside it read off the exact same value rather than a
  // second copy kept in step by hand.
  const dive = useRef(new Animated.Value(0)).current;

  // R-CD-12 — the memory comb's own perch set. §32.2's split: the screen
  // declares WHERE the bee may stand (PerchAnchor) and hands the reader
  // across to FlyingBee; EntryCombGrid never touches perches directly, it
  // only reports when to launch and when to come home (see below).
  const perches = usePerchSet();
  const [pollinate, setPollinate] = useState(null);
  const [canceledPollination, setCanceledPollination] = useState(null);
  const pollinateKeyRef = useRef(0);
  // The key of the most recently launched CELL-target flight, so a close
  // arriving while he's still airborne can cancel that specific errand (see
  // handleFlightHome). Canceling a key that already landed is a documented
  // no-op in FlyingBee's own cancel-plan-effect — safe to fire unconditionally.
  const lastCellFlightKeyRef = useRef(null);

  const handleCellFlight = useCallback(({ x, y, ringStep }) => {
    pollinateKeyRef.current += 1;
    const key = pollinateKeyRef.current;
    lastCellFlightKeyRef.current = key;
    setPollinate({ key, x, y, ringStep });
  }, []);

  // R-CD-12.4 — "he breaks off and returns by flight, never a teleport."
  // Retargeting `pollinate` to the perch's own point covers the common case
  // (he already landed at the cell — the new target launches immediately,
  // R-CD-12.2's "landing causes nothing" holds, nothing to break off from).
  // Canceling `lastCellFlightKeyRef` alongside it covers the early-exit case
  // (he is still mid-flight to the cell): FlyingBee's own posRef tracks his
  // true on-screen position every frame, so the cancel freezes him exactly
  // there and the queued home target launches the return leg from that real
  // point — a genuine break-off, never a jump.
  const handleFlightHome = useCallback(() => {
    const home = perches.read(perches.homeKey);
    if (!home) return;
    pollinateKeyRef.current += 1;
    setPollinate({ key: pollinateKeyRef.current, x: home.x, y: home.y, ringStep: HOME_RING_STEP });
    if (lastCellFlightKeyRef.current != null) {
      setCanceledPollination({ key: lastCellFlightKeyRef.current, at: Date.now() });
    }
  }, [perches]);

  // WHO WROTE THIS SEAT, resolved here rather than in the grid: this screen
  // is where the viewer's identity and the roster both already live, and it
  // already owns this hive's other naming rule (`rosterLabel` above).
  //
  // THE SNAPSHOT IS NOT AVAILABLE YET FOR AN UNSEALED HIVE, which is the
  // whole period this screen is writable in. `entries.author_name_at_seal` is
  // stamped by the seal paths only — its own column comment says so in as
  // many words ("Null for entries never sealed"), and no insert-time trigger
  // fills it. A cell labelled off that field alone would therefore render
  // blank for exactly the hive Colin is looking at while it is being written,
  // and only acquire names once it was too late to matter. So the snapshot is
  // PREFERRED where it exists (a sealed keepsake's signature must never come
  // from a live read — that ban is the reason the column exists) and the live
  // roster fills the pre-seal gap underneath it.
  //
  // Absence, never a stand-in. `getHiveContributors` answers 'Someone' for a
  // profile the read never reached (an authorization word, §1B.38.12) and
  // null for a placeholder-class name — neither is a person whose initials
  // this reader has been shown, and 'S' or 'NU' rendered confidently in a
  // seat is worse than an unlabelled one. Both fall through to no label.
  const contributorNames = useMemo(
    () => new Map(contributors.map((c) => [c.profileId, c.name])),
    [contributors]
  );
  const viewerId = session?.user?.id ?? null;
  const authorLabelFor = useCallback(
    (entry) => {
      if (!entry || !hive?.isCollective) return null;
      if (viewerId && entry.authorId === viewerId) return 'You';
      const name = entry.authorName ?? contributorNames.get(entry.authorId) ?? null;
      if (!name || name === 'Someone') return null;
      return initialsFor(name);
    },
    [hive?.isCollective, viewerId, contributorNames]
  );

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

  // R-CD-3 — "header/chrome above the card dim to 0.35 opacity and return."
  // One interpolation of the same `dive` EntryCombGrid drives; the dim
  // completes before the camera is halfway (DIVE_CHROME_DIM.end).
  const chromeStyle = {
    opacity: dive.interpolate({
      inputRange: [0, DIVE_CHROME_DIM.end, 1],
      outputRange: [1, DIVE_CHROME_DIM.opacity, DIVE_CHROME_DIM.opacity],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        translateY: dive.interpolate({
          inputRange: [0, DIVE_CHROME_DIM.end, 1],
          outputRange: [0, DIVE_CHROME_DIM.drift, DIVE_CHROME_DIM.drift],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Animated.View style={chromeStyle}>
      <View style={[styles.banner, { backgroundColor: cover.base }]}>
        <BackButton onPress={() => navigation.goBack()} variant="glass" color={cover.textColor} style={styles.backButton} />
        <Text style={[styles.bannerName, { color: cover.textColor }]}>{hive.subjectName}</Text>
        <Text style={[styles.bannerCount, { color: cover.textColor }]}>{memoryLabel}</Text>
      </View>

      {hive.isCollective && !hive.isRotationLinked && (
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

      </Animated.View>

      {entries.length > 0 ? (
        // R-CD-12.1 — "perches on the memory comb host exactly as on
        // HoneycombTab": same anchor shape as HoneycombTab's own `<PerchAnchor
        // id="comb" on="right" at={0.4}>` around HoneycombGrid — the comb
        // wrapped whole (a cell is absolutely positioned inside the grid's own
        // box, so anchoring one would move with it; the comb reads as a place,
        // its cells as seats). `home` here because this screen's only anchor
        // is the comb itself.
        // THREE explicit `flex: 1` touches, and every one is load-bearing.
        // `PerchField` renders no box at all — it is a bare context provider
        // (PerchAnchor.js) — so the chain from this stage down to the card
        // runs stage -> PerchAnchor's own View -> card. Without the anchor's
        // own flex the card would be a `flex: 1` child of an auto-height
        // parent, resolve flexBasis 0, and collapse to nothing (Lumen's C1).
        <View style={styles.stage}>
          <PerchField perches={perches}>
            <PerchAnchor id="memory-comb" on="right" at={0.4} home style={styles.stage}>
              <EntryCombGrid
                entries={entries}
                writable={!hive.sealedAt}
                onWriteEntry={() => navigation.navigate('ComposeHiveEntry', { hiveId, subjectName: hive.subjectName })}
                diveValue={dive}
                onCellFlight={handleCellFlight}
                onFlightHome={handleFlightHome}
                bottomInset={footerHeight ? footerHeight + FOOTER_BOTTOM : 0}
                authorLabelFor={authorLabelFor}
              />
            </PerchAnchor>
          </PerchField>
        </View>
      ) : (
        <View style={styles.emptyList}>
          <Text style={styles.emptyTitle}>No memories yet.</Text>
          <Text style={styles.emptyBody}>Add the first one whenever you're ready.</Text>
        </View>
      )}

      {/* Mounted unconditionally, same idiom as TodayTab's own suppression
          (`perches={error ? null : perches}`) — a hive with no entries has
          no comb and no home anchor, so `perches` goes null rather than the
          whole mount going conditional: `homeKey` resolves null,
          `sequenceHalted` follows, and the screen renders no bee at all. */}
      <FlyingBee
        perches={entries.length > 0 ? perches : null}
        pollinate={pollinate}
        canceledPollination={canceledPollination}
      />

      {/* R-SEAL-1 (Colin 2026-09-04, scoped by Lumen): manual seal/send is
          retired for private hives — the comb rotation is the product's only
          delivery mechanism, and the 1:1 noun stops carrying a hand-run copy
          of it. The "Seal This Keepsake" and "Send to {name}" rows are gone,
          and with them the connections lookup that only existed to decide
          whether to draw the second one.

          THIS BRANCH SURVIVES, and deliberately against the letter of the
          scoping note ("footer branch collapses to '+ Add Entry' always").
          `sealedAt` is still reachable on this screen: `listHives` filters
          out comb-rotation hives and NOTHING ELSE — it selects `sealed_at`
          and hands sealed hives straight to Today's shelf, which routes here.
          Every legacy sealed hive in prod therefore still lands on this
          screen, and the same ruling says those become read-only stores and
          that sealed-state RENDERING stands. Collapsing the branch would put
          a compose CTA on a hive whose own note one line below says entries
          are read-only, over an RPC that would refuse the write.

          What was retired is the affordance to CREATE a seal. The ability to
          READ one is what this branch is. */}
      {hive.sealedAt ? (
        <View style={styles.footer} onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
          <Text style={styles.sealedNote}>
            {hive.sentAt ? `Sent to ${hive.subjectName}.` : 'This hive is sealed — entries are read-only.'}
          </Text>
        </View>
      ) : (
        <View style={styles.footer} onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
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
    // inkSoft, not accentDeep — a link on a light ground (R127.1): the
    // affordance is weight and position, never hue. Was 2.6133:1 on surface.
    color: theme.colors.inkSoft,
    fontFamily: theme.fonts.bodySemiBold,
  },
  // The room the comb lives in. Named rather than inlined because the same
  // value has to land on two nodes (this wrapper and the PerchAnchor between
  // it and the card) and a chain that only holds if all of it holds should
  // read as one decision, not two coincidences.
  stage: {
    flex: 1,
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
  // NO SHADOW HERE, DELIBERATELY — the composition spec asked for the footer
  // to be re-graded to `theme.shadows.floating` now that it floats over the
  // hive surface instead of sitting beside it on raw cream. That requirement
  // is already discharged one level down: `PrimaryButton` has carried
  // `...theme.shadows.floating` since C7, on the button itself, with its own
  // note saying why ("this is the button, not a resting surface"). Adding it
  // again here would stack a second shadow behind the same CTA — and this
  // wrapper is also the sealed hive's branch, where the only child is a line
  // of text, so a `floating` drop shadow would land behind bare copy.
  //
  // This box stays a transparent positioner. It is measured (`onLayout`
  // above) so the comb can keep clear of it; it paints nothing.
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
