// The declared-ambient registry (Lumen's ruling, thread 8d2c9a5d, msg
// 2c01adf3, replying to Pixel's errand-clip finding that "still except one
// breathing wing" is a property of Today, not of the app — the Hive's own
// BloomRing marks are ratified ambient too, §21/6.4 R61, and a tripwire
// scoped to "idle Today" would hide that question rather than answer it).
//
// Each screen DECLARES the regions it permits motion in, every entry
// citing the ruling that licenses it. The tripwire's question stops being
// "does anything move outside the Breath box" and becomes "does anything
// move outside the UNION of this screen's declared regions" — undeclared
// motion is red even if it's pretty, which is the property Colin's bar was
// always meant to name, not a percentage on a codec.
//
// This module only ever assembles regions another module derived from
// source (`bee-breath-region.mjs`, `bloom-ring-region.mjs`) plus the
// caller-supplied live state (anchor rects, the blooming set) each of those
// needs — it does not compute geometry itself, so there is exactly one
// place each region's shape can go wrong.
import { breathSweepFractionBBox, fractionBBoxToPx } from './bee-breath-region.mjs';
import { bloomMarkRegionsPx } from './bloom-ring-region.mjs';
import { BREATH_BEAT_DEG } from '../../src/constants/mascot.js';

/** The wing's swept bbox, in px, given the character box's live on-screen rect. */
const wingRegionPx = ({ anchorX, anchorY, anchorW, anchorH }) => {
  const frac = breathSweepFractionBBox({ sweepDeg: BREATH_BEAT_DEG });
  return [fractionBBoxToPx(frac, { x: anchorX, y: anchorY, width: anchorW, height: anchorH })];
};

/**
 * `state.wing`: `{ anchorX, anchorY, anchorW, anchorH }` — required on every
 * screen the bee is resident on (both, today).
 * `state.bloom`: `{ size, bloomingIndices, combOriginPx }` — Hive only;
 * `bloomingIndices` may be `[]` (a Hive with nobody currently blooming
 * still declares the region as licensed, it is just empty this run).
 *
 * Each declared entry names itself and cites its ruling so a verdict or a
 * printed region list can say WHY a patch of screen is allowed to move,
 * not just that it is.
 */
export const AMBIENT_REGIONS = {
  today: {
    declare: (state) => [
      { name: 'wing', citation: 'Bee Doctrine §State-2', rects: wingRegionPx(state.wing) },
    ],
  },
  hive: {
    declare: (state) => [
      { name: 'wing', citation: 'Bee Doctrine §State-2', rects: wingRegionPx(state.wing) },
      {
        name: 'bloom-rings',
        citation: '§21/6.4, R61',
        rects: bloomMarkRegionsPx(state.bloom),
      },
    ],
  },
};

export const SCREENS = Object.keys(AMBIENT_REGIONS);

/** The flat rect list a diff engine actually tests against — the registry's declarations, unioned. */
export const declaredRectsFor = (screen, state) => {
  const entry = AMBIENT_REGIONS[screen];
  if (!entry) throw new Error(`unknown screen "${screen}" — known: ${SCREENS.join(', ')}`);
  return entry.declare(state).flatMap((region) => region.rects);
};

/** The declarations themselves, names and citations included — for reporting, not for diffing. */
export const declaredRegionsFor = (screen, state) => {
  const entry = AMBIENT_REGIONS[screen];
  if (!entry) throw new Error(`unknown screen "${screen}" — known: ${SCREENS.join(', ')}`);
  return entry.declare(state);
};
