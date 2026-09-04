// R-CD-5's date-roll math, pure — no RN import — so scripts/check-comb-dive.mjs
// can import and probe it directly, same class as hexGeometry.js/combLattice.js
// (see hexGeometry.js's header for why the split exists).
//
// MAX_VISIBLE_STEPS mirrors `DIVE_ODOMETER.maxVisibleSteps` in
// `src/constants/motion.js` — that file imports `react-native` and can't be
// required from a bare node script, so the cap is a local literal here. Move
// both together if it ever changes.
const MAX_VISIBLE_STEPS = 4;

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// entry_date is 'YYYY-MM-DD' — parsed as local midnight (avoids the UTC
// off-by-one a bare `new Date(isoDate)` gets from parsing it as UTC midnight
// instead).
const parseLocalDate = (isoDate) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// The one implementation of "entry_date -> a reader-facing date string" —
// originally HiveDetail.js's `longDate`, homed here (Lumen's rider,
// 2026-09-04) so HiveDetail.js and CombDivePaper.js can both import it
// without a module cycle (they'd otherwise import each other indirectly via
// EntryCombGrid.js), and so the local-midnight parse isn't kept twice.
export const longDate = (isoDate) =>
  parseLocalDate(isoDate).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

// -> { active, unit: 'year' | 'month' | null, steps: string[] }
//
// Licensed only when time is the story (R-CD-5): a different year always
// rolls years; same year rolls months only at 2+ months old ("this month"
// AND last month both read as "no roll — a quick dip, not a journey").
// `steps` is ordered NEWEST-TO-OLDEST ending on the entry's own year/month —
// the spec's own example lists it that way ("2026 · 2025 · 2024"). Beyond
// MAX_VISIBLE_STEPS the run elides to exactly `[current, '…', entry]`,
// matching the spec's "2026 … 2019".
export const computeDiveDateRoll = (entryDateISO, now = new Date()) => {
  const entryDate = parseLocalDate(entryDateISO);
  const entryYear = entryDate.getFullYear();
  const currentYear = now.getFullYear();

  if (entryYear !== currentYear) {
    const span = currentYear - entryYear;
    if (span + 1 <= MAX_VISIBLE_STEPS) {
      const steps = [];
      for (let y = currentYear; y >= entryYear; y -= 1) steps.push(String(y));
      return { active: true, unit: 'year', steps };
    }
    return { active: true, unit: 'year', steps: [String(currentYear), '…', String(entryYear)] };
  }

  const monthsAgo = now.getMonth() - entryDate.getMonth();
  if (monthsAgo < 2) return { active: false, unit: null, steps: [] };

  if (monthsAgo + 1 <= MAX_VISIBLE_STEPS) {
    const steps = [];
    for (let m = now.getMonth(); m >= entryDate.getMonth(); m -= 1) steps.push(MONTH_ABBR[m]);
    return { active: true, unit: 'month', steps };
  }
  return {
    active: true,
    unit: 'month',
    steps: [MONTH_ABBR[now.getMonth()], '…', MONTH_ABBR[entryDate.getMonth()]],
  };
};

export { MAX_VISIBLE_STEPS };
