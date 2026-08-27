import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { HiveStore } from '../services/HiveStore';
import { HoneycombStore } from '../services/HoneycombStore';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/Avatar';
import { PressableScale } from '../components/PressableScale';
import { PrimaryButton } from '../components/PrimaryButton';
import { LinkButton } from '../components/LinkButton';
import { BackButton } from '../components/BackButton';
import { LoadState, LOAD_STATES, resolveListView } from '../components/LoadState';

// ENG-61 — the invite half of Multi-Writer Hives (§4.2's viral loop landing
// copy — GUIDES/POLLINATE_MULTIWRITER_COPY_VOCAB.md). Reached from
// CreateHive.js right after a "Me and others" hive is created, and from
// HiveDetail.js's "+ Invite a writer" row anytime after ("you can invite
// more writers anytime" — §4.1 — is a promise, not a one-time offer).
//
// Connection picker modeled on PlantSeed.js: same LOAD_STATES/resolveListView
// state machine, same reason — a failed connections read must not render
// identically to "you have nobody to invite" (§23.2's tier judgement; a
// missing roster candidate is a materially different sentence from a network
// failure). Multi-select instead of PlantSeed's single recipient, since a
// hive roster can gain more than one writer at once.
const COPY = {
  unknown: {
    title: "Your connections didn't load",
    body: "We couldn't reach them just now.",
    action: 'Try again',
  },
  stale: {
    label: 'This list may be out of date.',
    action: 'Refresh',
  },
  retryAccessibilityLabel: 'Try loading your connections again',
};

export const InviteContributor = ({ navigation, route }) => {
  const { hiveId, subjectName } = route.params;
  const { session } = useAuth();
  // §4.2's formula names the owner by their own display name — the same
  // field Account.js reads off the session (`user_metadata.display_name`),
  // which onboarding's signUp always sets. 'You' is a fallback for a shape
  // this app's own signup flow never actually produces, not an expected
  // case.
  const ownerName = session?.user?.user_metadata?.display_name || 'You';

  const [connections, setConnections] = useState([]);
  // Only fetched to apply the subject-cannot-be-invitee guard client-side
  // (§4.2 / the migration's insert policy, direction 1) — this screen is
  // only ever reached right after the owner creates the hive (or from
  // HiveDetail, still the owner), so `getHive`'s owner-only `.eq` always
  // resolves here; a null subjectProfileId (the common case — most hive
  // subjects have no account) just excludes nothing.
  const [subjectProfileId, setSubjectProfileId] = useState(null);
  // Every profile_id already on this hive's roster, active or removed
  // (HiveStore.getHiveContributorProfileIds) -- a removed contributor can
  // never be re-invited (the migration's PK + its removed_at-immutable
  // trigger), so this excludes both the same way subjectProfileId does.
  const [rosterProfileIds, setRosterProfileIds] = useState(() => new Set());
  const [readState, setReadState] = useState(LOAD_STATES.LOADING);
  const [selected, setSelected] = useState(() => new Set());
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setReadState(LOAD_STATES.LOADING);
      Promise.all([
        HoneycombStore.listConnections(),
        HiveStore.getHive(hiveId),
        HiveStore.getHiveContributorProfileIds(hiveId),
      ])
        .then(([list, hive, rosterIds]) => {
          if (cancelled) return;
          setConnections(list);
          setSubjectProfileId(hive?.subjectProfileId ?? null);
          setRosterProfileIds(new Set(rosterIds));
          setReadState(LOAD_STATES.READY);
        })
        .catch((err) => {
          if (cancelled) return;
          console.warn('InviteContributor: failed to load connections', err);
          setReadState(LOAD_STATES.UNKNOWN);
        });
      return () => {
        cancelled = true;
      };
    }, [hiveId, reloadKey])
  );

  // Direction 1 of the subject/roster guard (20260827000001's own comment:
  // "the invite picker excludes the subject client-side; the DB guard is
  // the backstop"). Filtered here rather than trusting the insert to reject
  // it later, so the subject never even appears as a selectable row. Also
  // excludes anyone already on the roster (active or removed) via
  // rosterProfileIds -- same reasoning, a different guaranteed-rejection.
  const candidates = useMemo(
    () => connections.filter((c) => c.id !== subjectProfileId && !rosterProfileIds.has(c.id)),
    [connections, subjectProfileId, rosterProfileIds]
  );

  const listView = resolveListView(readState, candidates.length);
  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  const toggle = (profileId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  };

  const goToHive = () => navigation.navigate('HiveDetail', { hiveId });

  const handleInvite = async () => {
    if (inviting || selected.size === 0) return;
    setInviting(true);
    setInviteError(false);
    // Sequential, not Promise.all — a partial failure (e.g. one insert hits
    // the subject guard some other client-side check missed) should leave
    // the successful invites written rather than racing several writes
    // against the same roster and reporting one combined error nobody can
    // attribute to a person. Per-invite try/catch, not one around the whole
    // loop — a failure partway through must not skip everyone queued after
    // it; each remaining profileId still gets its own attempt.
    let failed = false;
    for (const profileId of selected) {
      try {
        await HiveStore.inviteContributor(hiveId, profileId);
      } catch (err) {
        console.warn('InviteContributor: failed to invite', profileId, err);
        failed = true;
      }
    }
    setInviting(false);
    if (failed) {
      setInviteError(true);
    } else {
      goToHive();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={goToHive} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>INVITE WRITERS</Text>
        <Text style={styles.title}>Who else is writing for {subjectName}?</Text>
        {/* §4.2's formula, previewed rather than sent — no push notifications
            exist anywhere in this app (PlantSeed.js's own header note), so
            this is the message a writer meets once they open the hive, not
            something dispatched off this screen. */}
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>WHAT THEY'LL SEE</Text>
          <Text style={styles.previewText}>
            “{ownerName} is making something for {subjectName}. They asked you to write too.”
          </Text>
        </View>

        {listView === LOAD_STATES.STALE && (
          <LoadState
            state={LOAD_STATES.STALE}
            onRetry={retry}
            staleLabel={COPY.stale.label}
            staleActionLabel={COPY.stale.action}
            retryAccessibilityLabel={COPY.retryAccessibilityLabel}
            style={styles.staleRow}
          />
        )}

        {listView === LOAD_STATES.LOADING && (
          <ActivityIndicator color={theme.colors.accent} style={styles.loader} />
        )}

        {listView === LOAD_STATES.UNKNOWN && (
          <LoadState
            state={LOAD_STATES.UNKNOWN}
            onRetry={retry}
            title={COPY.unknown.title}
            body={COPY.unknown.body}
            actionLabel={COPY.unknown.action}
            retryAccessibilityLabel={COPY.retryAccessibilityLabel}
            style={styles.unknownCard}
          />
        )}

        {listView === LOAD_STATES.EMPTY && (
          <Text style={styles.emptyBody}>
            Add a connection first — then you can invite them to write here too.
          </Text>
        )}

        {(listView === LOAD_STATES.READY || listView === LOAD_STATES.STALE) &&
          candidates.map((person) => {
            const isSelected = selected.has(person.id);
            return (
              <PressableScale
                key={person.id}
                onPress={() => toggle(person.id)}
                style={[styles.row, isSelected && styles.rowSelected]}
                accessibilityLabel={person.display_name}
                accessibilityState={{ selected: isSelected }}
              >
                <Avatar name={person.display_name} avatarUrl={person.avatar_url} size={40} />
                <Text style={styles.rowName} numberOfLines={1}>
                  {person.display_name}
                </Text>
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={isSelected ? theme.colors.ink : theme.colors.surfaceBorderStrong}
                />
              </PressableScale>
            );
          })}

        {inviteError && (
          <Text style={styles.errorText}>Couldn't send that invite. Check your connection and try again.</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton onPress={handleInvite} disabled={selected.size === 0 || inviting} loading={inviting}>
          {selected.size === 0 ? 'Invite' : `Invite ${selected.size} ${selected.size === 1 ? 'writer' : 'writers'}`}
        </PrimaryButton>
        <LinkButton
          onPress={goToHive}
          disabled={inviting}
          style={styles.skipLink}
          accessibilityLabel="Skip inviting writers for now"
        >
          I'll invite later
        </LinkButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  eyebrow: {
    ...theme.type.label,
    color: theme.colors.inkSoft,
    marginBottom: 6,
  },
  title: {
    ...theme.type.h1,
    color: theme.colors.ink,
    marginBottom: 20,
  },
  previewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: 16,
    marginBottom: 24,
  },
  previewLabel: {
    ...theme.type.label,
    color: theme.colors.inkSoft,
    marginBottom: 8,
  },
  previewText: {
    ...theme.type.body,
    fontFamily: theme.fonts.bodyItalic,
    color: theme.colors.ink,
  },
  loader: {
    marginBottom: 16,
  },
  staleRow: {
    marginBottom: 12,
  },
  unknownCard: {
    marginBottom: 16,
  },
  emptyBody: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: 14,
    marginBottom: 10,
  },
  rowSelected: {
    borderColor: theme.colors.ink,
  },
  rowName: {
    ...theme.type.body,
    color: theme.colors.ink,
    flex: 1,
  },
  errorText: {
    ...theme.type.bodySm,
    color: theme.colors.danger,
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  skipLink: {
    alignSelf: 'center',
    marginTop: 12,
  },
});
