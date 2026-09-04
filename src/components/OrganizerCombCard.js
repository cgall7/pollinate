import React, { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { GradientCard } from './GradientCard';
import { PressableScale } from './PressableScale';
import { RotationFold } from './RotationFold';
import { MintRotationSheet } from './MintRotationSheet';
import { useDaysLeft } from './useDaysLeft';
import { getCombInviteUrl } from '../services/combInviteLinking';
import { isPlaceholderName } from '../utils/placeholderName';
import { CombStore, classifyMintRefusal } from '../services/CombStore';

const ROTATION_WRITER_COUNT_KIND = 'writers';

// DES-29 §5 — subject-gone and empty-roster get their ruled sentences;
// not-owner/not-found and anything unclassified share one generic,
// connection-shaped line (never a cause sentence, per the spec's own rule
// that an owner on this card should never see a "not owner" claim).
const MINT_REFUSAL_COPY = {
  subjectGone: "That person's account is gone — choose someone else to write for.",
  emptyRoster:
    'A comb needs two people to be a comb. This comb has one member — invite someone, and the month can open.',
  notOwner: "Couldn't open this month. Check your connection and try again.",
  unknown: "Couldn't open this month. Check your connection and try again.",
};

export const organizerChapterSubjectName = (name) => (isPlaceholderName(name) ? 'someone' : name);

export const OrganizerCombCard = ({ comb, expanded, onPress, onWrite, onNectar, onMinted }) => {
  const rotation = comb.openRotation;
  const daysLeft = useDaysLeft(rotation?.closesAt);
  const inviteUrl = getCombInviteUrl(comb.inviteCode);
  const chapterCount = comb.chapters?.length ?? 0;
  const chapterCountLabel = chapterCount === 1 ? '1 past month' : `${chapterCount} past months`;
  const chapterSignalLabel = `${expanded ? '▾' : '▸'} ${chapterCountLabel}`;
  const shareInvite = () => Share.share({ message: inviteUrl });
  const memberLabel =
    comb.memberCount == null
      ? null
      : comb.memberCount === 1
        ? 'One person is in this comb.'
        : `${comb.memberCount} people are in this comb.`;

  // DES-29 §8.1 — pre-launch (no open rotation, no chapters — waiting on
  // people) is a different state from dormant (no open rotation, chapters
  // exist — waiting on time, OPS-9's territory), not the same "No open
  // month right now." line for both.
  const isPreLaunch = !rotation && chapterCount === 0;

  // DES-29 §8.2/§8.3 — the mint picker's own state. `candidates === null`
  // is "still loading" (§8.3's empty-picker pre-empt only fires once the
  // read has actually come back empty, not before).
  const [sheetOpen, setSheetOpen] = useState(false);
  const [candidates, setCandidates] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState(null);
  const [minting, setMinting] = useState(false);
  const [mintErrorText, setMintErrorText] = useState('');

  const openMintSheet = () => {
    setSheetOpen(true);
    setCandidates(null);
    setLoadError(false);
    setSelected(null);
    setMintErrorText('');
    CombStore.listMintCandidates(comb.id)
      .then((rows) => setCandidates(rows))
      .catch((err) => {
        console.warn('OrganizerCombCard: failed to load mint candidates', err);
        setLoadError(true);
      });
  };

  const closeMintSheet = () => {
    if (minting) return;
    setSheetOpen(false);
  };

  const submitMint = async () => {
    if (!selected || minting) return;
    setMinting(true);
    setMintErrorText('');
    try {
      await CombStore.openFirstRotation({ combId: comb.id, subjectProfileId: selected.id });
      setSheetOpen(false);
      onMinted?.(comb.id);
    } catch (err) {
      console.warn('OrganizerCombCard: mint failed', err);
      setMintErrorText(MINT_REFUSAL_COPY[classifyMintRefusal(err)]);
    } finally {
      setMinting(false);
    }
  };

  return (
    <>
    <PressableScale
      onPress={onPress}
      style={styles.card}
      accessibilityLabel={`Open the comb ${comb.name}`}
    >
      <GradientCard style={styles.material} contentStyle={styles.fill} innerStyle={styles.inner}>
        <View style={styles.headerRow}>
          <View style={styles.iconRing}>
            <Ionicons name="people" size={18} color={theme.colors.ink} />
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {comb.name}
          </Text>
        </View>
        {rotation ? (
          <RotationFold
            variant="member"
            subjectName={rotation.subjectName}
            daysLeft={daysLeft}
            count={rotation.writerCount}
            countKind={ROTATION_WRITER_COUNT_KIND}
          />
        ) : (
          <Text style={styles.emptyLine}>{isPreLaunch ? 'Invite people to get started.' : 'No open month right now.'}</Text>
        )}
        {chapterCount > 0 && (
          <View style={styles.historySignal}>
            <Text style={styles.metaLine}>{chapterSignalLabel}</Text>
          </View>
        )}
        {/* DES-29 §8.1/§8.2 — pre-launch only, un-gated by `expanded`: the
            share row and the mint affordance are the whole reason this
            card exists in this state, so neither waits on a tap that reads
            as "more" on a card with nothing collapsed to reveal. */}
        {isPreLaunch && (
          <View style={styles.preLaunchPanel}>
            <PressableScale onPress={shareInvite} style={styles.actionRow} accessibilityLabel={`Share invite link for ${comb.name}`}>
              <Ionicons name="link" size={16} color={theme.colors.ink} />
              <Text style={styles.actionText}>Share invite link</Text>
            </PressableScale>
            <PressableScale onPress={openMintSheet} style={styles.actionRow} accessibilityLabel={`Pick who this month is for in ${comb.name}`}>
              <Ionicons name="person-add" size={16} color={theme.colors.ink} />
              <Text style={styles.actionText}>Pick who this month is for</Text>
            </PressableScale>
          </View>
        )}
        {expanded && (
          <View style={styles.expandedPanel}>
            {memberLabel && <Text style={styles.metaLine}>{memberLabel}</Text>}
            {chapterCount > 0 && (
              <View style={styles.chapterList}>
                <Text style={styles.metaLabel}>Past chapters</Text>
                {comb.chapters.map((chapter) => (
                  <Text key={chapter.id} style={styles.metaLine} numberOfLines={1}>
                    Month {chapter.ordinal}: {organizerChapterSubjectName(chapter.subjectName)}
                  </Text>
                ))}
              </View>
            )}
            {!isPreLaunch && (
              <PressableScale onPress={shareInvite} style={styles.actionRow} accessibilityLabel={`Share invite link for ${comb.name}`}>
                <Ionicons name="link" size={16} color={theme.colors.ink} />
                <Text style={styles.actionText}>Share invite link</Text>
              </PressableScale>
            )}
            {rotation && (
              <PressableScale
                onPress={() => onNectar?.(comb)}
                style={styles.actionRow}
                accessibilityLabel={`Send a little thanks in ${comb.name}`}
              >
                <Ionicons name="water" size={16} color={theme.colors.ink} />
                <Text style={styles.actionText}>Send a little thanks</Text>
              </PressableScale>
            )}
            {rotation?.canWrite && (
              <PressableScale
                onPress={() => onWrite?.(rotation)}
                style={styles.actionRow}
                accessibilityLabel={`Write for ${rotation.subjectName || 'this month'}`}
              >
                <Ionicons name="create" size={16} color={theme.colors.ink} />
                <Text style={styles.actionText}>Write this month</Text>
              </PressableScale>
            )}
          </View>
        )}
      </GradientCard>
    </PressableScale>
    <MintRotationSheet
      visible={sheetOpen}
      combName={comb.name}
      inviteUrl={inviteUrl}
      candidates={candidates}
      loadError={loadError}
      selectedId={selected?.id ?? null}
      onSelect={setSelected}
      submitting={minting}
      errorText={mintErrorText}
      onSubmit={submitMint}
      onDismiss={closeMintSheet}
    />
    </>
  );
};

const CARD_WIDTH = 190;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    minHeight: 150,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.card,
  },
  material: {
    flex: 1,
  },
  fill: {
    flex: 1,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorderStrong,
    backgroundColor: theme.colors.surface,
  },
  inner: {
    flex: 1,
    padding: 14,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconRing: {
    width: 34,
    height: 34,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.washYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...theme.type.h3,
    color: theme.colors.ink,
    flex: 1,
  },
  emptyLine: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
  },
  preLaunchPanel: {
    gap: 6,
  },
  expandedPanel: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
    paddingTop: 12,
    gap: 6,
  },
  metaLine: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
  },
  metaLabel: {
    ...theme.type.label,
    color: theme.colors.inkSoft,
  },
  historySignal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chapterList: {
    gap: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.washYellow,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  actionText: {
    ...theme.type.label,
    color: theme.colors.ink,
  },
});
