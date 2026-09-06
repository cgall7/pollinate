// Lightweight keyword tagging so weekly/monthly/yearly recaps have a real
// theme to show without wiring an AI call. Swap for the GPT-4o-mini pass
// mentioned in the README later without changing any of the call sites —
// they only care about the returned theme string.
export const THEMES = [
  { key: 'Family', keywords: ['family', 'mom', 'dad', 'mother', 'father', 'sister', 'brother', 'kids', 'children', 'parent', 'grandma', 'grandpa', 'husband', 'wife', 'spouse'] },
  { key: 'Friendship', keywords: ['friend', 'friends', 'buddy', 'colleague', 'coworker'] },
  { key: 'Health', keywords: ['health', 'healthy', 'body', 'workout', 'exercise', 'sleep', 'rest', 'energy', 'healing'] },
  { key: 'Nature', keywords: ['sun', 'sunshine', 'sky', 'tree', 'trees', 'ocean', 'beach', 'walk', 'outside', 'weather', 'rain', 'garden', 'nature'] },
  { key: 'Growth', keywords: ['learned', 'growth', 'lesson', 'challenge', 'progress', 'improve', 'goal'] },
  { key: 'Career', keywords: ['work', 'job', 'project', 'team', 'boss', 'career', 'client', 'meeting'] },
  { key: 'Joy', keywords: ['laugh', 'laughed', 'fun', 'joy', 'happy', 'smile', 'music', 'coffee', 'food'] },
  { key: 'Spirit', keywords: ['god', 'faith', 'pray', 'prayer', 'blessed', 'spirit', 'church'] },
  { key: 'Creativity', keywords: ['art', 'music', 'write', 'writing', 'create', 'creative', 'idea', 'design'] },
];

export const FALLBACK_THEME = 'Reflection';

// A THEME KEY IS TWO THINGS AT ONCE, and the rename is why that matters.
//
// Lumen, 2026-09-06 (FU4, thread 160660d9): `THEMES[].key` is authored by
// us and renders directly (`TodayTab.js:618`, `MonthlyRecap.js:93`,
// `PollinateWrapped.js:274`, `RecapTab.js:428`), so `Faith` was a word on
// the forbidden list appearing on a screen in our voice. R15 has no
// exemption and creating one is Colin's to grant, so the label was renamed
// to `Spirit`. THE KEYWORDS DID NOT CHANGE: the query keeps the user's own
// words, and only the label we speak back was ours to lose.
//
// The key is also STORED. Migration `20260813000006` writes this key into
// `entries.theme`, so every row minted before the rename still holds
// `Faith` and would render it raw. A rename of a stored identity is a read
// problem, not a write problem, so it is normalised on the way IN, at the
// three places a persisted theme becomes a client value, and nowhere else.
//
// A Map rather than an object literal on purpose: `LEGACY[theme]` on an
// object hits `Object.prototype` for `constructor`, `toString` and friends
// and returns a FUNCTION, which is truthy and would sail past `?? theme`.
// A stored theme is user-adjacent data, so the lookup gets a null prototype
// by construction rather than a sanitising step somebody has to remember.
const LEGACY_THEME_KEYS = new Map([['Faith', 'Spirit']]);

// Undefined in, undefined out. Every caller downstream of this is
// `entry.theme || tagEntry(entry.text)`, and a normaliser that turned a
// missing theme into a string would take the fallback away.
export const normalizeTheme = (theme) => LEGACY_THEME_KEYS.get(theme) ?? theme;

// The retired keys, for the gate that stands over this. Exported rather
// than re-typed there: `check-theme-keys` asserts every legacy key is NOT a
// live key (a retired word coming back would shadow the live one silently)
// and that every legacy VALUE is.
export const LEGACY_THEME_KEY_LIST = [...LEGACY_THEME_KEYS.keys()];

export const tagEntry = (text) => {
  if (!text) return FALLBACK_THEME;
  const lower = text.toLowerCase();
  let best = FALLBACK_THEME;
  let bestScore = 0;
  for (const theme of THEMES) {
    const score = theme.keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = theme.key;
    }
  }
  return best;
};

// entries: [{ text, theme? }] — falls back to tagging on the fly if untagged
export const dominantTheme = (entries) => {
  if (!entries || entries.length === 0) return null;
  const counts = {};
  for (const entry of entries) {
    const key = entry.theme || tagEntry(entry.text);
    counts[key] = (counts[key] || 0) + 1;
  }
  const [theme, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return { theme, count, total: entries.length };
};
