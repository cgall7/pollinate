import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { numberInWordsCapped } from '../utils/numberWords';

// DES-22 §5 / DES-31+DES-39 §0 — "the shared fold". One rotation object,
// worn by three surfaces (the comb screen's own indicator, the contributor's
// Today-shelf card, the organizer's comb card): a subject/name line, a
// days-left line, and an optional count line. Built once so a rounding fix
// or a copy change moves all three together, per DES-31/39 §1.2's own reason
// for sharing `closes_at`'s day-math in one place.
//
// Typographic tokens are DES-33's, not invented here — this fold already
// ships on the reveal header under that spec, and DES-31/39 §4 explicitly
// asks new mounts to match it rather than pick their own scale.
//
// ZERO-SUPPRESSION IS THE CALLER'S JOB, NOT THIS COMPONENT'S GUESS. Every
// count source in play here (`comb_member_count`, `comb_rotation_writer_
// count`) fails open on refusal by returning 0 (DES-22 §6, DES-31 §1.1) —
// this component cannot tell "nobody" from "not allowed to know" any better
// than the caller can, so it treats `count == null` as "withhold the line"
// and leaves the caller to pass `null` rather than a `0` it doesn't trust.
export const RotationFold = ({ variant, subjectName, daysLeft, count, countKind = 'writers', style }) => {
  const daysLine =
    Number.isFinite(daysLeft) ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : null;

  const countLine =
    count == null || count <= 0
      ? null
      : countKind === 'size'
        ? count === 1
          ? 'One person is in this comb.'
          : `${numberInWordsCapped(count)} people are in this comb.`
        : count === 1
          ? 'One person is writing'
          : `${numberInWordsCapped(count)} people are writing`;

  if (variant === 'subject') {
    // §5 (subject-view): the count line doubles as the identity line — "who's
    // in the comb ... and how many" — never a "writing for you" claim
    // (§1B.36.5's verb correction). No `subjectName` is ever rendered here;
    // the subject already knows who she is.
    return (
      <View style={style}>
        {countLine && <Text style={styles.subjectLine}>{countLine}</Text>}
        {daysLine && <Text style={styles.daysLine}>{daysLine}.</Text>}
      </View>
    );
  }

  // variant === 'member': "Writing for {subjectName}" + days-left, with the
  // count as a genuinely optional third line (§5: "may appear adjacent to
  // this line, not fused into it" — DES-31/39 render it, DES-22's own §8
  // diagram doesn't, and both are spec-legal).
  return (
    <View style={style}>
      <Text style={styles.subjectLine}>Writing for {subjectName}</Text>
      {daysLine && <Text style={styles.daysLine}>{daysLine}</Text>}
      {countLine && <Text style={styles.countLine}>{countLine}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  subjectLine: { ...theme.type.label, color: theme.colors.ink },
  daysLine: { ...theme.type.bodySm, color: theme.colors.inkSoft, marginTop: 2 },
  countLine: { ...theme.type.bodySm, color: theme.colors.inkSoft, marginTop: theme.spacing.sm },
});
