import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { GradientCard } from './GradientCard';
import { PressableScale } from './PressableScale';
import { RotationFold } from './RotationFold';
import { useDaysLeft } from './useDaysLeft';

const ROTATION_WRITER_COUNT_KIND = 'writers';

export const OrganizerCombCard = ({ comb, expanded, onPress }) => {
  const rotation = comb.openRotation;
  const daysLeft = useDaysLeft(rotation?.closesAt);
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
        {expanded && (
          <View style={styles.expandedPanel}>
            {memberLabel && <Text style={styles.metaLine}>{memberLabel}</Text>}
            {comb.chapters?.length > 0 && (
              <View style={styles.chapterList}>
                <Text style={styles.metaLabel}>Past chapters</Text>
                {comb.chapters.slice(0, 3).map((chapter) => (
                  <Text key={chapter.id} style={styles.metaLine} numberOfLines={1}>
                    Month {chapter.ordinal}: {chapter.subjectName || 'someone'}
                  </Text>
                ))}
              </View>
            )}
            <Text style={styles.metaLabel}>Invite code</Text>
            <Text style={styles.inviteCode} selectable>
              {comb.inviteCode}
            </Text>
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
  chapterList: {
    gap: 4,
  },
  inviteCode: {
    ...theme.type.h3,
    color: theme.colors.ink,
  },
});
