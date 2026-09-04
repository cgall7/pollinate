import React from 'react';
import { ActivityIndicator, Modal, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { PressableScale } from './PressableScale';
import { PrimaryButton } from './PrimaryButton';
import { PillButton } from './PillButton';

// DES-29 §8.2/§8.3/§8.4/§8.5 — the pre-launch organizer card's "Pick who
// this month is for" affordance. State-ownership shape follows
// NectarConsentSheet (the host owns `visible` + all state; this file only
// renders what it's handed) — but the container is a native `Modal`, not a
// `View` with `StyleSheet.absoluteFill`, because this card is one of several
// riding a horizontal `ScrollView` (`COMBS YOU RUN`, TodayTab): an
// absolutely-positioned sibling there only fills that card's own ~150pt
// row, not the screen. `Modal` renders into its own native layer regardless
// of where in the tree it's mounted, which is what an organizer picking a
// subject from inside one scrolled-past card actually needs.
//
// `candidates === null` is "still loading" — distinct from `[]`, which is
// §8.3's empty-picker pre-empt: no picker renders, the RPC is never called,
// only the share prompt does. The host (OrganizerCombCard) is the one that
// calls CombStore.listMintCandidates and CombStore.openFirstRotation; this
// component has no network access of its own.
export const MintRotationSheet = ({
  visible,
  combName,
  inviteUrl,
  candidates,
  loadError,
  selectedId,
  onSelect,
  submitting,
  errorText,
  onSubmit,
  onDismiss,
}) => {
  const shareInvite = () => Share.share({ message: inviteUrl });
  const loading = candidates === null && !loadError;
  const empty = Array.isArray(candidates) && candidates.length === 0;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
        <Text style={styles.headline}>Pick who {combName} is for</Text>

        {loading && <ActivityIndicator color={theme.colors.accent} style={styles.spinner} />}

        {!loading && loadError && (
          <Text style={styles.body}>We couldn't load people to choose from. Try again.</Text>
        )}

        {!loading && !loadError && empty && (
          <>
            <Text style={styles.body}>Nobody's joined yet — share the link.</Text>
            <PressableScale onPress={shareInvite} style={styles.shareRow} accessibilityLabel="Share invite link">
              <Text style={styles.shareText}>Share invite link</Text>
            </PressableScale>
          </>
        )}

        {!loading && !loadError && !empty && (
          <ScrollView style={styles.list}>
            {candidates.map((candidate) => {
              const selected = selectedId === candidate.id;
              return (
                <PressableScale
                  key={candidate.id}
                  onPress={() => onSelect(candidate)}
                  style={[styles.person, selected && styles.personSelected]}
                  accessibilityLabel={`Choose ${candidate.displayName || 'this person'}`}
                >
                  <Text style={styles.personName}>{candidate.displayName || 'Someone'}</Text>
                  <Text style={styles.check}>{selected ? '✓' : ''}</Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        )}

        {!!errorText && <Text style={styles.error}>{errorText}</Text>}

        {!loading && !loadError && !empty && (
          <PrimaryButton
            onPress={onSubmit}
            loading={submitting}
            disabled={!selectedId}
            containerStyle={styles.submit}
            accessibilityLabel="Open this month"
          >
            Open this month
          </PrimaryButton>
        )}
        <PillButton onPress={onDismiss} variant="outline" disabled={submitting} style={styles.dismiss} accessibilityLabel="Not now">
          Not now
        </PillButton>
      </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 2,
  },
  card: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.xl,
    ...theme.shadows.card,
  },
  headline: {
    ...theme.type.h3,
    color: theme.colors.ink,
    textAlign: 'center',
  },
  body: {
    ...theme.type.body,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  spinner: {
    marginTop: theme.spacing.lg,
  },
  list: {
    marginTop: theme.spacing.md,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 8,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  personSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.washYellow,
  },
  personName: {
    ...theme.type.bodyLg,
    color: theme.colors.ink,
  },
  check: {
    ...theme.type.h3,
    color: theme.colors.ink,
  },
  shareRow: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.washYellow,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareText: {
    ...theme.type.label,
    color: theme.colors.ink,
  },
  error: {
    ...theme.type.bodySm,
    color: theme.colors.ink,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  submit: {
    marginTop: theme.spacing.lg,
  },
  dismiss: {
    marginTop: theme.spacing.sm,
  },
});
