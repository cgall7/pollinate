import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

// ENTRY_EXPRESSION_BRIEF.md ruling 2: "At most ONE touch: a single quiet
// paper swatch on the compose card." One shared component so every compose
// surface (InputScreen, ComposeHiveEntry) is the same expression system,
// not three bespoke pickers. Two swatches only — Cream (paper: null) and
// Evening (paper: 'evening') — the Honey Wash third paper was cut.
export const PaperPicker = ({ paper, onChange }) => (
  <View style={styles.row}>
    <Pressable
      onPress={() => onChange(null)}
      accessibilityRole="button"
      accessibilityLabel="Cream paper"
      accessibilityState={{ selected: paper !== 'evening' }}
      hitSlop={8}
      style={[styles.swatch, styles.cream, paper !== 'evening' && styles.selected]}
    />
    <Pressable
      onPress={() => onChange('evening')}
      accessibilityRole="button"
      accessibilityLabel="Evening paper"
      accessibilityState={{ selected: paper === 'evening' }}
      hitSlop={8}
      style={[styles.swatch, styles.evening, paper === 'evening' && styles.selected]}
    />
    <Text style={styles.label}>{paper === 'evening' ? 'Evening' : 'Cream'}</Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  cream: {
    backgroundColor: theme.colors.backgroundWriting,
  },
  evening: {
    backgroundColor: theme.colors.paperEvening,
  },
  selected: {
    borderWidth: 2,
    borderColor: theme.colors.ink,
  },
  label: {
    ...theme.type.bodySm,
    color: theme.colors.textSecondary,
  },
});
