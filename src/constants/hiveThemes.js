import { theme } from './theme';

// The four selectable ids GUIDES/PRIVATE_HIVE_DESIGN_LANGUAGE.md §1 names,
// in the order the theme-selection grid shows them. `golden-honey` /
// `theme.colors.goldField` is deliberately absent — §1 reserves it for the
// sealed-state wax seal badge (§9), never a creation-time cover choice.
// Every `base` is an existing `theme.colors` token — Deezine's spec: "No
// new hex values introduced." Text stays `ink` on every card per the spec
// (§1's "Text color: ink" on all five entries); none of these bases are
// dark enough to need `surface`.
export const HIVE_COVER_THEMES = [
  {
    id: 'sunlit-honey',
    label: 'Sunlit Honey',
    base: theme.colors.background,
    textColor: theme.colors.ink,
  },
  {
    id: 'wildflower',
    label: 'Wildflower',
    base: theme.colors.washPeach,
    textColor: theme.colors.ink,
  },
  {
    id: 'starlight',
    label: 'Starlight',
    base: theme.colors.washSky,
    textColor: theme.colors.ink,
  },
  {
    id: 'cream-gold',
    label: 'Cream & Gold',
    base: theme.colors.backgroundWriting,
    textColor: theme.colors.ink,
  },
];

const BY_ID = new Map(HIVE_COVER_THEMES.map((t) => [t.id, t]));

// Falls back to the default theme rather than throwing — a card render is
// not the place to surface a data problem, and `sunlit-honey` is the
// schema's own column default (20260817000002).
export const hiveCoverTheme = (id) => BY_ID.get(id) ?? HIVE_COVER_THEMES[0];

// RETIRED 2026-09-04, R-CH-2 (Lumen): `REVIEW_CADENCE_OPTIONS` lived here —
// Monthly / Yearly / Manual, each with a "Revisit this hive..." subtitle.
// `CreateHive.js` was its only consumer, and the step it filled asked a
// question nothing read: no renderer and no scheduler ever looked at the
// stored cadence, and its copy described the review ritual of the retired
// review-then-seal arc. Named rather than silently deleted because the
// COLUMN and its validator both survive — `HiveStore`'s
// `DEFAULT_REVIEW_CADENCE` still fills the NOT NULL field and `REVIEW_CADENCES`
// still guards a future caller that means it. What retired is the question,
// not the field.
