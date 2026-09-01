import React from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { GradientCard } from './GradientCard';
import { PressableScale } from './PressableScale';
import { RotationFold } from './RotationFold';
import { useDaysLeft } from './useDaysLeft';
import { getCombInviteUrl } from '../services/combInviteLinking';
import { isPlaceholderName } from '../utils/placeholderName';

const ROTATION_WRITER_COUNT_KIND = 'writers';

export const organizerChapterSubjectName = (name) => (isPlaceholderName(name) ? 'someone' : name);

export const OrganizerCombCard = ({ comb, expanded, onPress, onWrite }) => {
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

  return (
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
          <Text style={styles.emptyLine}>No open month right now.</Text>
        )}
        {chapterCount > 0 && (
          <View style={styles.historySignal}>
            <Text style={styles.metaLine}>{chapterSignalLabel}</Text>
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
            <PressableScale onPress={shareInvite} style={styles.actionRow} accessibilityLabel={`Share invite link for ${comb.name}`}>
              <Ionicons name="link" size={16} color={theme.colors.ink} />
              <Text style={styles.actionText}>Share invite link</Text>
            </PressableScale>
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
