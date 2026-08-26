import { theme } from '../constants/theme';
import { DOOR_SIZE } from './AccountDoor';

// The floating tab bar's geometry, in one place.
//
// This module holds no components on purpose. `MainTabs` imports the
// tab screens, so a screen that reached back into `MainTabs` for these
// numbers would close a require cycle — the constants have to live below
// both of them.
export const SIDE_INSET = 20;
export const BAR_HEIGHT = 60; // was 86: the old bar carried 49.5pt of dead space below its glyphs.
export const BAR_BOTTOM = 28;

// DES-27 (Pixel, 2026-08-26, Project 22 Slice 1): the door moved off the
// capsule to a fixed top-right column. `DOOR_GAP` (the air between two
// chrome objects sharing one row) died with that move — nothing at the top
// is that quantity — and is replaced by two constants on two different
// rails, neither reused from the other.

// The door's trailing edge sits on the CONTENT margin (`padding: 24` on
// every tab), not the capsule's chrome inset — it now lives in the content
// column, level with the header row.
export const DOOR_END_INSET = theme.spacing.lg; // 24

// Derived, not chosen: the door's vertical centre lands on the header row's
// vertical centre, the same expression the old `doorAnchor` used against the
// capsule (`BAR_BOTTOM + (BAR_HEIGHT - DOOR_SIZE) / 2`) — same rail logic,
// new rail. This is a nicety, not the safety property (that's
// `DOOR_RESERVE` below): `theme.type.h1` scales under Dynamic Type, so the
// header row's centre moves while a fixed door does not.
export const DOOR_TOP_GAP = 17;

// The safety property: separation is on x, not y. The door owns a fixed
// column at the trailing content edge, and every tab keeps that column
// clear — x-separation survives Dynamic Type and row-height changes; a
// y-only gap survives neither.
export const DOOR_RESERVE = DOOR_SIZE + theme.spacing.md; // 52 + 16 = 68

// What a scrolling screen must clear at the bottom so its last row isn't
// parked under the bar.
//
// The bar is `position: absolute` and nothing consumes
// `useBottomTabBarHeight` — `BottomTabView` only publishes the height, it
// applies no padding — so this value is the sole bottom clearance in the
// app. It is the bar's box plus a deliberate `spacing.lg` of air, rather
// than a hand-summed literal: the previous `140` was written against an
// 86pt bar, and when the bar shrank to 60 the air silently grew from 26pt
// to 52pt because nobody owned the arithmetic.
export const TAB_CLEARANCE = BAR_BOTTOM + BAR_HEIGHT + theme.spacing.lg;
