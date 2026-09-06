// THE DASH BAN — no string this app authors may use a dash as punctuation.
//
// A LEAF MODULE ON PURPOSE — no imports, no side effects, nothing to run,
// exactly like `acquire-words.mjs` and `forbidden-words.mjs`. It lives in
// `scripts/` for the same load-bearing reason: this file CONTAINS the
// characters it bans, and the population it is measured against is `App.js`
// + `src/**` + the demo corpus. Being outside that population is STRUCTURAL
// rather than an exemption somebody has to remember. Do not move this file
// into `src/constants/`.
//
// WHERE THE RULE COMES FROM
//
// Colin, 2026-09-04, on the landing page: "please remove any '-' you are
// using. i don't want them. re-word sentences if necessary." The ban is on
// the dash AS PUNCTUATION, not on the character: he wrote "re-word" himself
// in the same sentence, so hyphenated compounds stay.
//
// Lumen ruled the gate in on 2026-09-06 (UX Design, thread root `0a406eb6`)
// with four terms: population = `collectAuthoredStrings`, the shared
// collector; pattern = em dash AND en dash, "a gate that keys only the one
// we happened to ship would green the other"; exclusions carry a stated
// per-string reason each; and one named legal member the record must carry,
// the DES-21 signature attribution mark.
//
// TWO TIERS, AND WHY THE SECOND ONE EXISTS
//
// RULED_DASHES is Lumen's pair, pinned. HOUSE_DASHES is the rest of the
// dash family that `check-demo-seed`'s V1 has banned over the demo corpus
// since it was written. Lumen's own argument for the en dash — key only the
// form we happened to ship and the gate greens the other — is the argument
// for all four, and every one of them is measured at ZERO in this tree, so
// the widening costs nothing and closes four more silent greens. The two
// tiers are separate constants rather than one list because one of them is
// ruled and the other is inherited, and a reader who wants to strike the
// inherited half should be able to see exactly where it ends.
//
// THE ONE FORM DELIBERATELY LEFT OUT, AND IT IS A MEASUREMENT, NOT AN
// OVERSIGHT. `check-demo-seed`'s V1 also bans a SPACED HYPHEN (`\s-\s`).
// This gate cannot, and the reason is a property of its population rather
// than of the rule. `collectAuthoredStrings` reconstructs template literals
// through `templateText`, which JOINS QUASIS WITH A SPACE. A template
// written `${a}-${b}` — which renders as `a-b`, a clean compound — has
// quasis `''`, `'-'`, `''` and reconstructs as `' - '`. That is a spaced
// hyphen the user never sees. V1 is correct to carry the form because its
// corpus is plain string literals with no interpolation anywhere; this
// gate's population is 1549 strings including every template in the app, so
// the same form here would red copy that renders clean. The hole is asserted
// as a row (B3), not confessed in a comment, and `DASHY_V1_SOURCE` below is
// the drift guard that reds if V1's pattern ever moves out from under this
// explanation.

// Lumen's pinned pair. `check-dash-ban` D2 asserts this list exactly, for the
// reason `POSITIONS` is pinned in `rendered-strings.mjs`: an edit that
// shrinks the vocabulary AND the pattern together is COHERENT, and every
// behavioural row in the gate would keep passing over the smaller rule.
export const RULED_DASHES = ['—', '–'];

// Inherited from `check-demo-seed`'s V1. Each measured at zero occurrences
// across all 1549 authored strings at `11f315e`.
export const HOUSE_DASHES = ['‒', '―', '−'];

// The double hyphen is a SEQUENCE, not a character, so it cannot live in the
// character class above. Same provenance, same zero measurement.
export const HOUSE_SEQUENCES = ['--'];

export const DASH_RE = new RegExp(
  `[${[...RULED_DASHES, ...HOUSE_DASHES].join('')}]|${HOUSE_SEQUENCES.map((s) => s.replace(/[-]/g, '\\-')).join('|')}`
);

// THE DRIFT GUARD ON THE BORROWED HALF. `check-demo-seed` declares its
// pattern inline. Keying on the DECLARATION TEXT rather than on a line
// number means this survives every edit above it in that file and reds only
// when the pattern itself changes — at which point the two dash rules in
// this repo have diverged and somebody has to say which one is right.
export const DASHY_V1_SOURCE = "const DASHY = /[‒–—―−]|\\s-\\s|--/;";

// --- EXCLUSIONS ----------------------------------------------------------
//
// KEYED ON FILE + EXACT STRING, never on a line number. A line-keyed
// exemption decays the first time anything is inserted above it and decays
// SILENTLY, toward less coverage; a value-keyed one survives every move and
// reds the moment the string it names is edited, which is exactly when the
// exclusion needs re-ruling. This is the same distinction that cost this
// arc three stale citations.
//
// AND THE KEY IS THE COLLECTOR'S RECONSTRUCTION, NOT THE SOURCE TEXT. A
// template literal reaches the population through `templateText`, so
// `theme.js`'s entry below carries the space-joined seam (`' '`) the walker
// produces rather than the `${level}` in the file. The gate compares against
// what it collects; so does this list.
//
// EVERY REASON HERE IS A MEASUREMENT SOMEWHERE ELSE IN THE GATE. Section E
// re-derives each one: unreachability, zero importers, the throw ancestry,
// the signature's exact value. An exclusion whose reason is only prose is an
// exemption that outlives its justification.

const NECTAR_NOTE =
  'Declaration prose in a `note:` field of `NECTAR_SURFACES`, which is a ' +
  'register of design deliverables and their host containers, not copy. ' +
  'Lumen ruled these six out of scope on 2026-09-06: the ban binds copy. ' +
  'Nothing in the app imports `NECTAR_SURFACES` — E1 measures that here, ' +
  'and `check-nectar-consent`\'s D6 measures it from the other side as the ' +
  'control on its own A1a exclusion.';

export const DASH_EXCLUSIONS = [
  // THE RULED MEMBER, and the one Lumen asked the record to carry.
  {
    rel: 'src/screens/PackageOpen.js',
    value: '—',
    why:
      'DES-21 §4\'s SIGNATURE attribution mark, rendered as `— {name}` inside ' +
      'PaperBlock on a collective volume. Ruled typography, not prose ' +
      'punctuation: the excluded value is the mark ALONE, with no sentence ' +
      'around it, which is the property that separates it from a dash used ' +
      'to join two clauses. E4 asserts that property rather than asserting ' +
      'the file. Lumen named this member on the ground that it escapes the ' +
      'collector through `isProse` and that the escape is one filter tweak ' +
      'from becoming a false red. Measured at `11f315e`, IT DOES NOT ESCAPE: ' +
      '`isProse` is applied only at `position === \'constant\'`, i.e. only ' +
      'inside `src/constants/`, and this string is in `src/screens/`. It is ' +
      'a live member of the dash set today and this row is what keeps the ' +
      'gate off a ruled signature on its first run.',
  },
  // Dev-facing strings no user can reach. Both stated reasons are structural
  // and both are re-derived below rather than asserted here.
  {
    rel: 'src/constants/theme.js',
    value: "shadows.glow(): unknown level ' ' — expected rest | bloom | peak",
    why:
      'The argument of a `throw new Error(...)` in `shadows.glow()`, raised ' +
      'when a caller passes an unknown level. A developer message on a path ' +
      'no shipped call site takes; nothing renders a caught error\'s text. ' +
      'E3 measures the throw ancestry, so this stops being an exclusion the ' +
      'day somebody moves the string into rendered copy.',
  },
  {
    rel: 'src/screens/dev/LuxuryPrimitivesHarness.js',
    value: 'Hex tap — fill and hold (instrument, not score)',
    why:
      'A heading in a device rig under `src/screens/dev/` whose own header ' +
      'says it is deliberately not wired into any navigator, opened only by ' +
      'swapping it in as App.js\'s root for a device pass. E2 measures zero ' +
      'importers across `src/`, `App.js` and `app.json`, so the reason is a ' +
      'count and not a claim about intent.',
  },
  // The six declaration-prose fragments Lumen ruled out of scope. They are
  // string-concatenation fragments, so one `note:` field contributes more
  // than one member; each is keyed on its own fragment.
  { rel: 'src/constants/nectar.js', value: "does not\" and pointed at `hexEdgeMarks`, the blooming ring's generator —", why: NECTAR_NOTE },
  { rel: 'src/constants/nectar.js', value: 'one of four tokens and never `surface` — any pigment placed here has four', why: NECTAR_NOTE },
  { rel: 'src/constants/nectar.js', value: 'consented at all — every zap-adjacent surface was gated on a flag only a', why: NECTAR_NOTE },
  { rel: 'src/constants/nectar.js', value: 'the sequence — a placement question ENG-64 inherits, not a styling one.', why: NECTAR_NOTE },
  { rel: 'src/constants/nectar.js', value: 'Hive and he crosses to your own seat and gives it — an object present', why: NECTAR_NOTE },
  { rel: 'src/constants/nectar.js', value: 'instead of a sheet. The old probe fired exactly as its author designed it to —', why: NECTAR_NOTE },
];
