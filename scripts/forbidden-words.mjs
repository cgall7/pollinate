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
// Lumen, 2026-09-06 (FU4, thread 160660d9): A LABEL THE APP CHOOSES IS ON A
// SCREEN IN OUR VOICE, so the ban reaches it. Asked whether `THEMES[].key`
// could keep the word `Faith` on the ground that a person's own entries
// established it, the answer is no: R15 binds app-authored strings, the
// user's own words are none of our business, and there is no exemption here
// for the same reason there was none for `sats`. A carve-out from Colin's
// register ruling is Colin's to grant. The key was renamed to `Spirit`.
//
// TWO THINGS THAT RULING DELIBERATELY DID NOT DO, because both would have
// widened the ban past what Colin said:
//
//   The KEYWORDS were left alone. `themeTagger.js:13` matches on six tokens,
//   five of them distinct entries on this list (`pray` and `prayer` share
//   one). Those are the left side of a comparison against text the USER
//   wrote. Banning them there would mean a person who writes about their
//   church cannot be understood by the tagger, which is a worse outcome than
//   the label ever was. The query keeps their words; only the label we speak
//   back was ours to lose.
//
//   `check-copy-rules` gained no exemption. The two demo journal lines that
//   carried `pray` and `blessed` were REWRITTEN, not exempted. R15's own
//   sentence is "on a screen", and a demo screen shown to Colin and to App
//   Store review is exactly the screen the register bar exists for.
//
// Also this ruling, and it is why `scripts/lib/demo-seed-corpus.mjs` is now
// inside a gate's universe: this list only ever ran over `src/` and over
// `demoHive.js`'s fixtures. The demo ACCOUNT corpus, which is the text a
// reviewer actually reads, was authored copy no gate had ever scanned.
// `check-collector-null-class` folded it in, in the same commit.
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
// `bitcoin` / `sats` (COPY-7, `DESIGN_BRIEF_V2_NAVIGATION.md` Part C rule 1)
// were banned outside a four-surface exemption from `3269ceb` through
// `9126a95`. Colin reversed that ruling 2026-09-04 (#Collab, thread
// `00b55e2`): "i do want us to use the words sats and bitcoin, we need to
// update the banned list." Both words are removed from this list entirely,
// not re-scoped to a wider exemption — there is no longer a ban for an
// exemption to carve out of. `check-copy-rules.mjs`'s Section C allowlist
// mechanism (the exact-string exemption these two used to share with
// `crypto`) is unchanged for `crypto`, which nobody has ruled on and stays
// banned under the original four-surface exemption.
//
// `crypto` (COPY-7, same source): ordinary prefix-at-boundary pattern, same
// as the eleven religious words above — its only current collision,
// "cryptographic hash" in `legalCopy.js`, sits on the exempted "legal copy"
// surface already (`check-copy-rules.mjs` Section C).
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
  { word: 'crypto', re: /\bcrypto/i },
];

// The bare words, for a consumer testing a set it controls end to end.
// `check-demo-hive` runs RAW SUBSTRING over nineteen hand-written fixtures,
// where the false-positive rate is zero and the stricter arm is free. That
// arm does not transfer to real copy — see above — so it stays local to the
// fixture gate rather than becoming this module's opinion.
export const FORBIDDEN_WORDS = FORBIDDEN.map((f) => f.word);
