// The nectar surfaces' CONSENT CONTRACT — DES-28 Deliverable 7.
//
// This is the half of DES-28 that needs no ledger RPC, because it is a
// statement about ABSENCE: before a user has consented to a wallet, every
// nectar surface does not exist. Not disabled, not empty, not a greyed
// placeholder — absent. Deezine's Deliverable 7 states it per surface and
// gives the reason: Apple 2.3.1(a) treats a permanently-visible affordance
// for a feature the user has not opted into as a hidden feature.
//
// SO THE PRE-CONSENT STATE OF THIS APP IS THE APP AS IT SHIPS TODAY, and
// that is the whole difficulty. An absence has no pixels to review and no
// screen to open. It is held by everyone remembering, on every future PR,
// that five surfaces are supposed to be missing — which is the shape of
// promise this repo has already watched decay twice (the legal consent
// checkbox armed by scripts/check-legal-consent-gate.mjs, and the demo
// affordance that passed twenty gates in scripts/check-demo-content-
// callsites.mjs's own header).
//
// This module is therefore not a feature. It is the DECLARED POPULATION
// that scripts/check-nectar-consent.mjs asks its questions of. A missing
// surface cannot be grepped for — every search for a nectar affordance
// returns the ones that exist — so the only instrument that can speak
// about absence is one that enumerates the population first and asks each
// member (the same reason buildPollinationPlan's missing `trail` field was
// invisible to every grep for `trail`).
//
// WHAT IS DELIBERATELY NOT HERE: a consent store, a writer, a hook, a
// provider. Consent fires on the user's FIRST ZAP ATTEMPT, never at signup
// (Deliverable 7), and the first zap attempt is ENG-63-66 against 19a's
// RPCs. Building a store now would mean inventing where consent is
// persisted, which is Bumble's account-provisioning decision and not a
// design one. `hasNectarConsent` below is a pure predicate over whatever
// that record turns out to be, with the only part design owns fixed: the
// default is NO.

// The binding name every nectar surface must be guarded by, so that the
// gate's guard test and the app's guard are the same string rather than two
// spellings that agree until someone renames one.
//
//     {nectarConsent && <SendNectarRow />}
//     nectarConsent ? <Presets /> : null
//
// Those are the two shapes the guard recogniser reads (rendered-strings.mjs
// `isUnderGuard`). Any other shape — an early return, a negated ternary —
// reds the gate on code that may well be correct, which is the safe
// direction and is the convention every gate in this repo already follows.
export const NECTAR_CONSENT_GUARD = 'nectarConsent';

// THE WORD RESERVE. Money words that may not be rendered outside the guard.
//
// Each of these is measured against this tree, not assumed. Over the 1025
// rendered strings App.js + src/**/*.js hold at 7fe6133:
//
//   \bnectar\b        0 hits    clean discriminator
//   \bzap\w*\b        0 hits    clean discriminator, ALL INFLECTIONS
//   \bdrops\b         0 hits    clean discriminator (plural only)
//   \b\d+\s+drop\b    0 hits    a quantity, not the verb
//
// `zap` is stemmed and the other three are not, and that asymmetry is a
// measurement rather than a preference. The gate's own calibration corpus
// caught `\bzaps?\b` missing Deliverable 4's copy verbatim — "Sarah ZAPPED
// the entry about…" — which is the one nectar string that is a VERB IN THE
// PAST TENSE rather than a noun of amount. `zap` has no non-money use in
// English copy this app would ever write, so it can afford the wide stem;
// `drop` demonstrably cannot, which is the next paragraph.
//
// AND THE ONE THAT IS NOT HERE IS THE POINT. Singular `\bdrop\b` is
// EXCLUDED: it has a measured non-money use in today's copy — hivePrompts.js
// "When did {subject_name} drop everything for…" — so it is a verb in this
// app before it is a unit. Adding it would red correct copy on day one,
// which is how a gate earns an exemption list, and an exemption list with a
// door in it is worth less than the rule it dilutes. `\b\d+\s+drop\b` closes
// the singular quantity ("1 drop") without reopening the verb.
//
// Part C of the V2 brief bans "bitcoin"/"sats"/"crypto" from all UX. Those
// are NOT in this reserve, because this reserve is about CONSENT, not
// vocabulary — a banned word is wrong on both sides of the gate, and belongs
// with the other forbidden words in scripts/forbidden-words.mjs if anyone
// wants it enforced. Keeping the two rules apart keeps each one's failure
// legible.
export const NECTAR_RESERVE = [
  { source: '\\bnectar\\b', flags: 'i' },
  { source: '\\bzap\\w*\\b', flags: 'i' },
  { source: '\\bdrops\\b', flags: 'i' },
  { source: '\\b\\d+\\s+drop\\b', flags: 'i' },
];

// THE DECLARED POPULATION — DES-28's five surfaces, each with the state
// Deliverable 7 requires of it before consent, and with where it would live.
//
// `host`/`anchor` name a container that EXISTS on this tree; the gate
// asserts the anchor is still there, so a rename reds here rather than
// silently orphaning a placement. `host: null` means the container Deezine's
// deliverable places into DOES NOT EXIST, which is a finding about the
// deliverable and not about the code — see each entry's `note`.
export const NECTAR_SURFACES = [
  {
    id: 'honeyed-mark',
    deliverable: 'DES-28 D1 / DES-24 / ENG-65',
    preConsent: 'No honeyed mark anywhere in the hive; only blooming and seeded.',
    host: 'src/components/HoneycombGrid.js',
    anchor: 'hexEdgeMarks',
    note:
      'Container exists, renderer does not. DES-24 owns the design (ink surface ' +
      'line, five rungs); ENG-65 builds it together with the BloomRing ink change.',
  },
  {
    id: 'packageopen-slot',
    deliverable: 'DES-28 D2',
    preConsent: 'The ending is the sentence and a plain Close. No presets, no CTA, no reserved space.',
    host: 'src/screens/PackageOpen.js',
    anchor: 'styles.ending',
    note:
      'The ending block is the slot. Its ground is the HIVE COVER base, which is ' +
      'one of four tokens and never `surface` — any pigment placed here has four ' +
      'grounds to clear, not one (hiveThemes.js HIVE_COVER_THEMES).',
  },
  {
    id: 'entry-card-affordance',
    deliverable: 'DES-28 D3',
    preConsent: 'Cards bloom and reveal exactly as they do today. No drop icon.',
    host: 'src/screens/PackageOpen.js',
    anchor: 'styles.entryCard',
    note:
      'The card sits inside the reveal tap area, whose Pressable advances the ' +
      'sequence. A control added here shares its region with "tap anywhere to ' +
      'continue" — a placement question ENG-64 inherits, not a styling one.',
  },
  {
    id: 'author-notification',
    deliverable: 'DES-28 D4',
    preConsent: 'No notification of this type exists.',
    host: null,
    probe: 'none',
    note:
      'THE CONTAINER DOES NOT EXIST. The deliverable places this in "the hive\'s ' +
      'notification pull". This app has three ITEM inboxes — NotesInbox, ' +
      'SeedsInbox, ReceivedPackages — each a list of objects addressed to you. ' +
      'A zap notification is author-side and event-shaped ("X zapped your entry"), ' +
      'which is a different subject and a different row. Scoped: no event feed ' +
      'found in src/screens at 7fe6133. Declared unprobeable — this row is a ' +
      'completeness declaration, not an absence proof.',
  },
  {
    id: 'action-menu-row',
    deliverable: 'DES-28 D5',
    preConsent: 'Menu shows only "Send note · Plant seed"; the nectar row does not exist.',
    host: null,
    probe: 'noActionMenu',
    note:
      'THE CONTAINER DOES NOT EXIST. The deliverable adds a row to an existing ' +
      '"Send note · Plant seed" menu. There is no such menu at 7fe6133 and none on ' +
      'any remote branch: ComposeNote and PlantSeed are reached from two separate ' +
      'inbox screens, never from one sheet. The probe is exactly that fact, so the ' +
      'day someone builds the menu this row reds and asks for the placement.',
  },
];

// The only part of consent that design owns: THE DEFAULT IS NO.
//
// Pure over whatever record 19a's account provisioning settles on — it reads
// one field and treats every other shape as no. Undefined, null, a record
// with no consent field, and an explicitly-null timestamp are all "has not
// consented", because the failure this predicate exists to prevent is a
// nectar surface appearing while the answer is merely UNKNOWN.
export const hasNectarConsent = (account) =>
  Boolean(account && account.nectarConsentAt);
