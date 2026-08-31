import React from 'react';
import { Text, View } from 'react-native';
import { theme } from '../constants/theme';

// R-38.9-B/H — sealed reveal frame only. The active "Writing for X" branch
// moved to the member RotationFold mounts (Today + ContributingHive), so this
// component accepts no rotation props and cannot become a second live-writer
// surface by accident.
export const RotationFrame = () => {
  return (
    <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
      <Text style={{ ...theme.type.label, color: theme.colors.ink }}>Written for you</Text>
    </View>
  );
};
