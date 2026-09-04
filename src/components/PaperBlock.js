import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme, ENTRY_VOICE_RUNGS } from '../constants/theme';

// R-EXT (ENTRY_EXPRESSION_BRIEF.md hardened spec) — the paper paints a
// contained inset region behind the entry's OWN TEXT BLOCK only (quote +
// its date/theme line), never the card fill, border, or anything else on
// the surface. Cream (paper == null) is today's existing rendering and
// needs no wrapper styling — it IS `backgroundWriting`/`surface` already.
// Only 'evening' gets a background here; everything else (author line,
// likes, comments, inputs, rails, badges, hairlines) stays outside this
// component, on its own surface token, untouched.
// `blockRef` is R-N3's Depart, and it is a ref rather than a coordinate:
// the drop travels "to the paper block of the thing this person wrote", so
// the beat needs this view's LIVE window rect at the moment the finger left
// the chip. Additive and undefined by default — no existing caller changes.
// `collapsable={false}` rides with it because an Android view with no props
// of its own can be flattened out of the tree, and a flattened view has
// nothing to measure.
export const PaperBlock = ({ paper, style, children, blockRef }) => (
  <View ref={blockRef} collapsable={blockRef ? false : undefined} style={[paper === 'evening' && styles.evening, style]}>
    {children}
  </View>
);

// The ground each paper is painted on, and the ONE place that mapping
// lives — `styles.evening` below reads it too, so "what colour is evening
// paper" has a single writer, the same way `paperInk`/`paperInkSoft` are
// the single writer for what ink goes on it (Lumen's A2, 2026-09-04).
//
// Returns null for cream rather than a token: cream is not one colour
// across the app. This component's cream IS `surface`/`backgroundWriting`
// and needs no wrapper fill at all (see the header), while EntryCombGrid's
// cell renders its cream on `washYellow` (R-CD-13). A null lets each
// surface keep its own cream and still share the one evening answer.
const PAPER_GROUND = { evening: theme.colors.paperEvening };
export const paperGround = (paper) => PAPER_GROUND[paper] ?? null;

// The only two ink tokens ever painted inside a `paper === 'evening'`
// region (dark-paper ink gate, R-EXT) — no alpha-of-ink token
// (`surfaceBorder`, `trackDim`, `pressedOnLight`, the family) belongs here.
export const paperInk = (paper) => (paper === 'evening' ? theme.colors.paperEveningInk : theme.colors.ink);
export const paperInkSoft = (paper) =>
  paper === 'evening' ? theme.colors.paperEveningInkSoft : theme.colors.inkSoft;

// VOICE LADDER RULING (ENTRY_EXPRESSION_BRIEF.md, Lumen 2026-08-26) — the
// entry-expression module's other channel, selector beside the ground one
// above. Paragraph-break override checked first: an author who structured
// the entry into paragraphs takes rung 3 regardless of length, ahead of the
// char thresholds. Returns a `theme.type.entryDisplay`-shaped style object,
// ready to spread.
export const entryVoice = (text) => {
  const trimmed = String(text ?? '').trim();
  if (/\n\s*\n/.test(trimmed)) {
    const prose = ENTRY_VOICE_RUNGS[ENTRY_VOICE_RUNGS.length - 1];
    return { fontFamily: theme.fonts.entryDisplay, fontSize: prose.size, lineHeight: prose.lineHeight };
  }
  const length = Array.from(trimmed).length;
  const rung = ENTRY_VOICE_RUNGS.find((r) => length <= r.max) ?? ENTRY_VOICE_RUNGS[ENTRY_VOICE_RUNGS.length - 1];
  return { fontFamily: theme.fonts.entryDisplay, fontSize: rung.size, lineHeight: rung.lineHeight };
};

const styles = StyleSheet.create({
  evening: {
    backgroundColor: PAPER_GROUND.evening,
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
});
