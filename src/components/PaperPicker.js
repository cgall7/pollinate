import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

// ENTRY_EXPRESSION_BRIEF.md ruling 2: "At most ONE touch: a single quiet
// paper swatch on the compose card." One shared component so every compose
// surface (InputScreen, ComposeHiveEntry) is the same expression system,
// not three bespoke pickers. Two swatches only — Cream (paper: null) and
// Evening (paper: 'evening') — the Honey Wash third paper was cut.
//
// SELECTION RIDES A HALO ON THE PAGE, NOT A RING ON THE SWATCH (Lumen,
// 2026-08-29, MVP1 screen pass). The marker used to be a 2pt `ink` border
// drawn on the swatch itself, which put the one state channel on a ground
// that MOVES: `ink` on the Cream fill is ΔE00 84.83 (contrast 16.52:1) and
// unmistakable, but the same border on `paperEvening` is ΔE00 7.51
// (contrast 1.31:1) — invisible by construction. Choosing Evening changed
// nothing on screen except the word, while the unselected Cream swatch went
// on reading as the live one. Same family as the brief's dark-paper ink
// gate: an ink-keyed marker cannot carry signal on a dark ground.
//
// The fix moves the marker off the variable ground onto the invariant one.
// The halo is drawn OUTSIDE the swatch, on whichever page the picker is
// mounted over, and every ground this component can sit on is light:
// `background` ΔE00 84.37, `backgroundWriting` 84.83, `surface` 85.82
// (measured against `scripts/lib/color.mjs` at this commit). Worst case is
// 84.37 — one value, both states, eleven times the separation the Evening
// state used to get.
const Swatch = ({ selected, onPress, label, fill }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ selected }}
    hitSlop={8}
    style={[styles.halo, selected && styles.haloSelected]}
  >
    <View style={[styles.swatch, fill]} />
  </Pressable>
);

export const PaperPicker = ({ paper, onChange }) => (
  <View style={styles.row}>
    <Swatch
      selected={paper !== 'evening'}
      onPress={() => onChange(null)}
      label="Cream paper"
      fill={styles.cream}
    />
    <Swatch
      selected={paper === 'evening'}
      onPress={() => onChange('evening')}
      label="Evening paper"
      fill={styles.evening}
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
  halo: {
    padding: 3,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    // Unselected reserves the ring's space so selecting a paper does not
    // shift the row — the halo appears, nothing moves.
    borderColor: 'transparent',
  },
  haloSelected: {
    borderColor: theme.colors.ink,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: theme.borderRadius.full,
  },
  cream: {
    backgroundColor: theme.colors.backgroundWriting,
    // Cream is within ΔE00 ~2 of every page it sits on, so it needs an edge
    // to exist at all. Evening does not (ΔE00 69.78 from Cream, and further
    // from every ground) — and `surfaceBorder` is an alpha-of-ink token, so
    // per the brief's dark-paper ink gate it does not get to paint there.
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  evening: {
    backgroundColor: theme.colors.paperEvening,
  },
  label: {
    ...theme.type.bodySm,
    color: theme.colors.textSecondary,
  },
});
