// The words that may not appear in Pollinate's copy, and the pattern that
// decides whether a string contains one.
//
// A LEAF MODULE ON PURPOSE — no imports, no side effects, nothing to run. Two
// gates consume it (`check-copy-rules`, `check-demo-hive`) and a gate cannot
// import a module that exits the process on load. Keep it dependency-free.
//
// WHERE THE RULES COME FROM
//
// Colin, 2026-08-11 (R15): onboarding's register is subtly Christian and none
// of the religious words below may appear on a screen. "hallelujah" is the
// guiding principle for the writing and is explicitly the word most banned
// from the surface.
// Colin, 2026-08-10: he hates the word "ritual".
//
// WHY EACH WORD CARRIES ITS OWN PATTERN
//
// Three candidate rules, measured over the 451 real copy strings under `src/`
// at f0df9c2:
//
//   raw substring       4 hits, all false — "single", "Using", "advertising"
//                       and "consequential" all contain `sin`
//   \bword\b            0 hits — but blind to "praying", "blessings",
//                       "faithful", "churches", which are the register the
//                       ban is actually about
//   \bword  (prefix)    1 hit, false — "single"
//
// So: prefix-at-word-boundary for eleven of them, which catches inflections
// and cannot fire mid-word. `sin` is the only word short enough to be the
// start of ordinary English, so it is spelled out with its inflections.
//
// `bless` rather than the literal `blessed`: the ban is on a REGISTER, and
// "blessing" carries it identically. That is wider than the word Colin said,
// and is stated here rather than smuggled into a regex.
//
// `bitcoin` / `sats` / `crypto` (COPY-7, `DESIGN_BRIEF_V2_NAVIGATION.md` Part
// C rule 1): "Never the word 'bitcoin,' 'sats,' or 'crypto' in any
// user-facing string. The unit is nectar, counted in drops. (Those words
// appear only in the consent screen, Settings, legal copy, and App Review
// Notes.)" The parenthetical is the rule, not an aside (Vector, thread
// `1edf5be8`) — all three words share the same four-surface exemption, so
// none of them can be a flat, zero-tolerance ban here. This leaf module has
// no file or render-position context to check an exemption against (and
// `check-demo-hive`'s raw-substring consumer has no file context at all), so
// the exemption is encoded as an exact-string allowlist local to
// `check-copy-rules.mjs`'s Section C, the same mechanism Section E already
// uses for reserved words — not here. `sats` is spelled out as the exact
// plural, not a `\bsat` prefix: `sat` is the ordinary-English past tense of
// "sit" and appears throughout this codebase's own comments (e.g. "the
// header sat 12pt lower"); a prefix match would eventually fire on real copy
// the same way an unscoped `sin` would. `bitcoin` and `crypto` are ordinary
// prefix-at-boundary patterns, same as the eleven religious words above —
// `crypto`'s only current collision, "cryptographic hash" in
// `legalCopy.js`, sits on the exempted "legal copy" surface already.
//
// `check-copy-rules` asserts this list's recall AND its precision on fixtures
// before it is trusted with a verdict. If you tighten a pattern, that is where
// it fails.
export const FORBIDDEN = [
  { word: 'God', re: /\bgod/i },
  { word: 'Jesus', re: /\bjesus/i },
  { word: 'Lord', re: /\blord/i },
  { word: 'pray', re: /\bpray/i },
  { word: 'scripture', re: /\bscriptur/i },
  { word: 'church', re: /\bchurch/i },
  { word: 'faith', re: /\bfaith/i },
  { word: 'blessed', re: /\bbless/i },
  { word: 'worship', re: /\bworship/i },
  { word: 'sin', re: /\bsin(s|ful|ner|ners|ning)?\b/i },
  { word: 'hallelujah', re: /\bhallelujah/i },
  { word: 'ritual', re: /\britual/i },
  { word: 'sats', re: /\bsats\b/i },
  { word: 'bitcoin', re: /\bbitcoin/i },
  { word: 'crypto', re: /\bcrypto/i },
];

// The bare words, for a consumer testing a set it controls end to end.
// `check-demo-hive` runs RAW SUBSTRING over nineteen hand-written fixtures,
// where the false-positive rate is zero and the stricter arm is free. That
// arm does not transfer to real copy — see above — so it stays local to the
// fixture gate rather than becoming this module's opinion.
export const FORBIDDEN_WORDS = FORBIDDEN.map((f) => f.word);
