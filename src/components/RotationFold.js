import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { numberInWordsCapped } from '../utils/numberWords';
import { isPlaceholderName } from '../utils/placeholderName';

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
// ZERO-SUPPRESSION HERE IS A BACKSTOP, NOT A SUBSTITUTE FOR THE CALLER'S OWN
// WORK. Every count source in play (`comb_member_count`, `comb_rotation_
// writer_count`) fails open on refusal by returning 0 (DES-22 §6, DES-31
// §1.1), and this component treats `count == null` as "withhold the line" —
// which also happens to catch a `0` the caller trusts. But `R5` pins that
// disjunction on every branch that renders a count, so a caller that skips
// the §1B.33 work and passes a fails-open `0` straight through reads here
// exactly like one that did it correctly. No gate in this file can ever
// fail because a caller forgot that step — the caller still owns getting
// `null` vs `0` right; this only backstops the render once it has.
export const RotationFold = ({ variant, subjectName, daysLeft, count, countKind = 'writers', style }) => {
  const daysLine =
    Number.isFinite(daysLeft) ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : null;

  // R-38.9 hardening requirement 1 (Lumen), corrected by Vector's
  // §1B.38.11 row 1: reader classification and name availability are two
  // separate decisions, not one ANDed boolean. `variant === 'member'`
  // alone selects the reader — the caller asserts that with certainty — so
  // an absent/misspelled `variant` still fails closed toward the nameless
  // branch below. A `subjectName` that comes back empty on a genuine
  // member is handled just past this branch, as its own refusal (see
  // below), never by silently reclassifying the reader as the subject.
  const isMember = variant === 'member';

  // R-38.9-E (Lumen): derived above the branch split, not inside it. A
  // fail-closed fallback inherits every CALLER's inputs, not just the one
  // it was built for — a degraded member mount (`subjectName` missing,
  // `countKind` left at its 'writers' default, `count` sourced from
  // `comb_rotation_writer_count`) lands in the nameless branch by
  // hardening requirement 1, and without this gate would render the
  // writer count as a comb-size claim ("Four people are in this comb")
  // from two individually-true inputs. Only an explicit `countKind:
  // 'size'` declaration reaches the nameless branch's count line; every
  // other declared source — 'writers' or its default — resolves to `null`
  // here and the line is withheld, never mislabeled.
  const sizeCount = countKind === 'size' ? count : null;

  if (!isMember) {
    // §5 (subject-view) — also the fail-closed default per hardening
    // requirement 1. Hardening requirement 2 (Lumen): `countKind` is not
    // read at all in this branch, not merely defaulted away — the subject
    // variant renders the size sentence unconditionally, so
    // `variant: 'subject', countKind: 'writers'` can't smuggle a
    // participation claim ("N people are writing") to the one reader
    // §1B.36.5 bars it from. Same "should not even receive the data"
    // posture as CombIdentityCluster's two-component split, applied here as
    // a branch that can't reach the other branch's interpretation of
    // `count` rather than as a second component.
    const countLine =
      sizeCount == null || sizeCount <= 0
        ? null
        : sizeCount === 1
          ? 'One person is in this comb.'
          : `${numberInWordsCapped(sizeCount)} people are in this comb.`;

    return (
      <View style={style}>
        {countLine && <Text style={styles.subjectLine}>{countLine}</Text>}
        {/* Subject lines are full sentences (size + days both read as
            statements); the member fold below is a label + fragment, so
            only this branch's days line takes a trailing period — spec-
            derived (§5), not a stray inconsistency. */}
        {daysLine && <Text style={styles.daysLine}>{daysLine}.</Text>}
      </View>
    );
  }

  if (!subjectName) {
    // R-38.9-F (Lumen, ruled): `variant === 'member'` is a reader
    // CLASSIFICATION the caller asserts with certainty; a missing
    // `subjectName` here is not "no data," it's a REFUSED READ. Falling
    // through to the branch above would silently hand this MEMBER the
    // SUBJECT's own copy — the exact defect this split exists to close.
    //
    // Two distinct causes land here and this component cannot and does not
    // try to tell them apart: (1) a mid-rotation joiner whose
    // `hive_contributors` row hasn't landed yet — legal, pending O10's
    // still-open this-month/next-month ruling — and (2) a wiring bug that
    // handed a member mount no name at all. They are indistinguishable AT
    // THE COMPONENT by design; the record discriminates instead (the
    // roster row's presence or absence), not this render — same move as
    // "absence is the record" applied a second time. So the copy below
    // must be true under either cause: no name claim, no participation
    // claim, just orientation that the month is already moving.
    return (
      <View style={style}>
        <Text style={styles.subjectLine}>This month is already underway.</Text>
        {daysLine && <Text style={styles.daysLine}>{daysLine}</Text>}
      </View>
    );
  }

  // variant === 'member' with a subjectName present: "Writing for
  // {subjectName}" + days-left, with the count as a genuinely optional third
  // line (§5: "may appear adjacent to this line, not fused into it" —
  // DES-31/39 render it, DES-22's own §8 diagram doesn't, and both are
  // spec-legal). `countKind` only ever matters here.
  //
  // R-38.9-G (Lumen, COPY-6): a present-but-placeholder-class `subjectName`
  // ('New user', the signup default; frozen 'Someone' via the mint's own
  // backstop) is a different case from the refused-read branch above — a
  // record DID land here, it just carries no name. Rendering it verbatim
  // would either print a false name ("Writing for New user") or misuse the
  // capitalized 'Someone' AUTHORIZATION word (§1B.35.2) as a name-absence
  // marker, which §1B.38.12 refused. Lowercase, embedded, the house shape
  // `NectarConsentSheet` already ships — never the stored value.
  const subjectLine = isPlaceholderName(subjectName) ? 'Writing for someone' : `Writing for ${subjectName}`;
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

  return (
    <View style={style}>
      <Text style={styles.subjectLine}>{subjectLine}</Text>
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
