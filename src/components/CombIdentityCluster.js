import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { HexShape } from './HexShape';
import { hexSpiral, buildCombLayout } from './combLattice';

// DES-22 §3 — the comb-identity cluster. Borrows `combLattice.js`'s layout
// math (`hexSpiral`, `buildCombLayout`, `HexShape`) built for the nectar
// hex-tap picker, and stops there on purpose: the picker's dim/punch-out/
// bloom is a SELECTION language for choosing one cell out of many, and this
// cluster has no selection state at all — every cell is simultaneously
// "present". None of that overlay's tokens apply here (§3's own ruling).
//
// Cell fill/mark colors below are provisional — §9 leaves the exact tokens
// open pending a contrast pass against whatever ground DES-29 routes this
// screen onto. What's fixed by the spec, not by this file, is the STATE
// TABLE (§2) and the split between the two exported views (§1) — get those
// two things right and the tokens are a retune, not a rebuild.
//
// TWO SEPARATE COMPONENTS, NOT ONE WITH A BOOLEAN PROP (§7's own gate
// intent: "the component that renders §1.1 should not even receive the data
// §1.2 needs — a prop that's merely unused-in-this-branch is a defect
// waiting for the next edit to wire it up by accident"). The subject-view
// component's prop shape below has no `hasWrittenThisRotation` field at
// all — there is nothing to accidentally read.

const CELL_SIZE = 28; // placeholder token — see file header
const NAME_LABEL_HEIGHT = 16;

// `hexSpiral`'s growth is 1, 7, 19, 37 ... (1 + 6·(1+2+...+radius)) members
// at radius r. Smallest radius whose capacity covers the roster — a comb of
// four gets a tighter ring than a comb of twelve, itself part of §1B.8's
// "presence, not capacity" (§3.1): the cluster growing is a fact about who
// joined, never a progress bar toward a limit nobody sees.
const radiusFor = (count) => {
  let radius = 0;
  let capacity = 1;
  while (capacity < count) {
    radius += 1;
    capacity += 6 * radius;
  }
  return radius;
};

const initialsFor = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const useLayout = (members) => {
  const spiral = hexSpiral(radiusFor(members.length));
  return buildCombLayout(members, CELL_SIZE, spiral);
};

// A `·` dim mark reads as "hasn't written this rotation" per §2/§8's
// mockup — never a fraction, never a fill level, one glyph per person.
const Cell = ({ cell, badge, dimmed }) => {
  if (!cell.member) return null;
  return (
    <View
      style={[styles.cellBox, { left: cell.x, top: cell.y }]}
      accessible
      accessibilityLabel={cell.member.name}
    >
      <View style={styles.hexWrap}>
        <HexShape
          size={CELL_SIZE}
          fill={theme.colors.surface}
          stroke={theme.colors.inkSoft}
          strokeWidth={1.5}
          opacity={dimmed ? 0.55 : 1}
        />
        <Text style={[styles.initials, dimmed && styles.initialsDimmed]}>
          {initialsFor(cell.member.name)}
        </Text>
        {badge && <Text style={styles.badge}>{badge}</Text>}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {cell.member.name}
      </Text>
    </View>
  );
};

/**
 * §1.1 — subject-view. `members` carries presence and role only:
 * `{ id, name, role: 'organizer' | 'writer' }`. No write-status field
 * exists on this shape because none may ever reach this component (§7).
 */
export const CombIdentityClusterSubjectView = ({ members }) => {
  const layout = useLayout(members);
  return (
    <View style={{ width: layout.width, height: layout.height + NAME_LABEL_HEIGHT }}>
      {layout.cells.map((cell) => (
        <Cell key={cell.key} cell={cell} badge={cell.member?.role === 'organizer' ? 'O' : null} dimmed={false} />
      ))}
    </View>
  );
};

/**
 * §1.2/§2 — member-view. `members`: `{ id, name, role: 'organizer' |
 * 'subject' | 'writer', hasWrittenThisRotation }`. `hasWrittenThisRotation`
 * is read only for `role === 'writer'` — the organizer and subject rows
 * have no such column in §2's table, and this component doesn't invent one
 * for them.
 */
export const CombIdentityClusterMemberView = ({ members }) => {
  const layout = useLayout(members);
  return (
    <View style={{ width: layout.width, height: layout.height + NAME_LABEL_HEIGHT }}>
      {layout.cells.map((cell) => {
        const member = cell.member;
        const badge = member?.role === 'organizer' ? 'O' : member?.role === 'subject' ? 'S' : null;
        const dimmed = member?.role === 'writer' && member?.hasWrittenThisRotation === false;
        return <Cell key={cell.key} cell={cell} badge={badge} dimmed={dimmed} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  cellBox: {
    position: 'absolute',
    width: CELL_SIZE * 2,
    alignItems: 'center',
  },
  hexWrap: {
    width: CELL_SIZE * 2,
    height: CELL_SIZE * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    position: 'absolute',
    ...theme.type.bodySm,
    // Literal, not `CELL_SIZE * 0.42` (11.76, rounded) — check-type-floor-
    // derived only resolves that shape for an identifier that traces to a
    // component PROP; CELL_SIZE is a module constant, so a derived
    // expression here reads as unverifiable rather than as passing. Re-check
    // against the 11pt floor if CELL_SIZE ever retunes.
    fontSize: 12,
    color: theme.colors.ink,
  },
  initialsDimmed: { color: theme.colors.inkSoft },
  badge: {
    position: 'absolute',
    top: 0,
    right: CELL_SIZE * 0.35,
    ...theme.type.label,
    fontSize: 11,
    letterSpacing: 0,
    // ink, not accent — check-text-pigment's standing rule: accent is
    // fill-behind-ink or decorative, never text on a light ground.
    color: theme.colors.ink,
  },
  name: {
    ...theme.type.bodySm,
    fontSize: 11,
    color: theme.colors.inkSoft,
    marginTop: -4,
  },
});
