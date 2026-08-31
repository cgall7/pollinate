import React from 'react';
import { Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { useDaysLeft } from './useDaysLeft';

// §1B.38.1: no `organizerName` prop. Order is a mechanism, not a rendered
// promise — a client sentence naming next month's writer either reimplements
// comb_advance_rotation's ordering or promises a schedule the tick may change
// (skips, dormancy, revival). A future line is licensed only by an existing
// rotation row (see comb_advance_rotation, migration 20260830000011).
export const RotationFrame = ({ subjectName, closesAt, sealedAt }) => {
  const daysRemaining = useDaysLeft(sealedAt ? null : closesAt);

  if (!subjectName) return null;

  const isSealed = !!sealedAt;

  if (isSealed) {
    return (
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <Text style={{ ...theme.type.label, color: theme.colors.ink }}>
          You received {subjectName}'s journal
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
      <Text style={{ ...theme.type.label, color: theme.colors.ink }}>
        Writing for {subjectName}
      </Text>
      {daysRemaining !== null && (
        <Text style={{ ...theme.type.bodySm, color: theme.colors.inkSoft }}>
          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
        </Text>
      )}
    </View>
  );
};
