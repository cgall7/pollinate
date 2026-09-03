import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

// COPY-6 addendum (Lumen, 2026-09-03) — the member's pre-launch / dormant
// comb on Today's "writing with others" shelf. The state a joiner is in
// between a real, committed join and the first mint.
//
// A SEPARATE COMPONENT, NOT A `RotationFold` VARIANT, and the reason is the
// same one that split `CombIdentityCluster` in two: `RotationFold`'s whole
// contract is "one rotation object, worn by three surfaces" — subject line,
// days-left, count. Here there is no rotation row at all, and §1B.38.1
// licenses a rendered future ONLY from one. Adding a fourth variant would
// put a rotation-less state inside a component whose every branch reads
// rotation props, and would leave `daysLeft`/`count` reachable on the one
// surface they are barred from. This component takes a NAME AND NOTHING
// ELSE: it cannot render a rotation fact because it is never handed one.
//
// Barred here per Lumen's ruling, and structurally unreachable above: no
// opening date, no countdown, no next-subject, no "starts on", and no
// member count (comb size belongs to the invite landing per the count
// triad; the shelf's roster line is DES-31's fold and keys on a rotation).
// The generic mechanism sentence below is the ceiling.
//
// The status line is true in BOTH licensed states — "next" reads as the
// first month for a pre-launch comb and the upcoming one for a dormant
// comb — and it is mechanism-backed rather than hopeful: the mint's roster
// snapshot selects every active non-subject `comb_members` row
// (`20260830000011:89-101`), so a member sitting here IS in the next month.
//
// No chevron and no press target: there is nowhere to go. A member has no
// comb screen before the first mint (`getOrganizerComb` is owner-scoped),
// and a chevron on a row that cannot navigate is a promise the row can't
// keep. The disc echoes the invite landing's bloom — the surface this
// member arrived from one screen earlier — at `ContributingHiveRow`'s own
// 40pt geometry so the rows stay aligned down the shelf.
export const PendingCombRow = ({ combName, style }) => (
  <View style={[styles.row, style]}>
    <View style={styles.bloomDisc}>
      <Text style={styles.bloomGlyph}>✦</Text>
    </View>
    <View style={styles.text}>
      <Text style={styles.name}>{combName}</Text>
      <Text style={styles.status}>You're in — you'll be writing when the next month opens.</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  // Token-for-token `TodayTab`'s `contributingRow`: same radius, border,
  // padding, gap, row margin and card shadow. This row shares that shelf and
  // is the same row one mint earlier, so it is the same box — not a
  // near-miss of it.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.card,
  },
  bloomDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.washYellow,
  },
  bloomGlyph: { fontSize: 18, color: theme.colors.ink },
  text: { flex: 1 },
  // `bodyLg`/`bodySm`, the same pair `contributingRow{Name,Subject}` uses one
  // row up — NOT `type.label`, which is uppercase and tracked and would set
  // a comb's chosen name in caps on the one shelf that renders it.
  name: { ...theme.type.bodyLg, color: theme.colors.ink },
  status: { ...theme.type.bodySm, color: theme.colors.inkSoft, marginTop: 2 },
});
