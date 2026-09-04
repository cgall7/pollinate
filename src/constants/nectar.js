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

// THE SECOND GUARD, AND IT EXISTS BECAUSE THE FIRST ONE CANNOT HOLD THE
// CONSENT SHEET.
//
// The reserve below says a money word may only render under `nectarConsent`.
// Sage's bootstrap ruling puts a consent sheet in front of that flag: a door
// icon on D3 opens a sheet that EXPLAINS nectar and STATES the starter grant,
// and it is shown to a user for whom `nectarConsent` is false — by
// construction, that is the only audience it ever has. So the sheet's copy is
// money words rendered pre-consent, and there is no spelling of the first
// guard that admits it: put the sheet under `nectarConsent` and it can never
// open, which is the same deadlock one layer down that the ruling just
// resolved.
//
// Measured rather than predicted, on this tree: a probe component carrying
// three plausible sheet strings reds B4 three times.
//
// So the carve-out is a second guard name rather than a file exemption. An
// exemption list names WHO is allowed; this names WHAT they are allowed to be
// behind, which is the property Apple 2.3.1(a) is actually about: content that
// is not permanently visible, reached only by the user's own tap.
//
// AND A NAME IS ONLY WORTH THAT IF THE NAME MEANS SOMETHING. `isUnderGuard`
// compares an identifier's spelling and has no binding resolution, so a second
// guard name, left as a name, would be a second freely-shadowable door rather
// than a bounded one — strictly worse than the first, because it would be
// advertised as bounded. Four rows in check-nectar-consent.mjs hold it, and
// none of them maintains a list:
//
//   B6  every binding of a guard name is a shape the census can classify
//   B7  a binding shows its AUTHORITY — `nectarConsent` from hasNectarConsent(),
//       the sheet's state from a useState initialised false (default CLOSED,
//       exactly as C1 makes consent's default NO)
//   B8  a guard passed as a prop is fed by an identifier of the same name
//   B9  the sheet's open state has at most one door (Sage's D3 ruling)
//
// THE SHEET LIVES IN ITS OWN FILE AND TAKES THE OPEN STATE AS A PROP. That is
// the shape to build, because isUnderGuard is a WITHIN-FILE ancestor walk — a
// component whose copy sits at its own top level, guarded only by the parent's
// conditional, has no guard ancestor in its own file and reds. Verified green
// on a probe pair rather than asserted: a host holding `const
// [nectarConsentSheetOpen, setSheetOpen] = useState(false)` beside `const
// nectarConsent = hasNectarConsent(consentRow)`, passing the first to a
// `NectarConsentSheet` that re-wraps its own body in it.
//
// CORRECTION, and it matters to whoever writes the sheet: an earlier note here
// said the affirmative ("Turn on nectar") "sits under no conditional at all,
// because a button that grants consent cannot be conditioned on consent." That
// is false, and the probe pair is what falsified it. The affirmative is not
// conditioned on CONSENT, it is conditioned on the SHEET BEING OPEN — it sits
// inside the same `{nectarConsentSheetOpen && …}` as the rest of the sheet
// body and passes with it. The two conditions were being read as one.
export const NECTAR_CONSENT_SHEET_GUARD = 'nectarConsentSheetOpen';

// THE WORD RESERVE. Money words that may not be rendered outside EITHER guard
// above (`nectarConsent`, or the consent sheet's own closed-by-default state).
//
// Each of these is measured against this tree, not assumed. Over the 1025
// rendered strings App.js + src/**/*.js hold at 35194bd (re-measured after
// ENG-65 merged; that renderer added copy to none of them):
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
// Part C of the V2 brief bans "crypto" from all UX (it banned "bitcoin" and
// "sats" too until Colin's 2026-09-04 amendment lifted those two). Banned
// words are NOT in this reserve, because this reserve is about CONSENT, not
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
    preConsent:
      'Cards bloom and reveal exactly as they do today, plus ONE neutral door ' +
      'icon carrying no money word. No presets, no amounts, no drop icon.',
    host: 'src/screens/PackageOpen.js',
    anchor: 'styles.entryCard',
    note:
      'AMENDED by Sage\'s bootstrap ruling (2026-08-26): D3 is the single ' +
      'bootstrap point, so its pre-consent state is no longer nothing. The ' +
      'original "no drop icon" left the app with no path from unconsented to ' +
      'consented at all — every zap-adjacent surface was gated on a flag only a ' +
      'zap could set. The door is a DOOR, NOT A SWITCH: tapping it opens the ' +
      'consent sheet, and only the sheet\'s affirmative fires consent_to_nectar() ' +
      '(Bumble: the first call irreversibly mints the starter grant, so an ' +
      'accidental tap would be a permanent mint attributed to a decision nobody ' +
      'saw). The card sits inside the reveal tap area, whose Pressable advances ' +
      'the sequence — a placement question ENG-64 inherits, not a styling one.',
  },
  {
    id: 'author-notification',
    deliverable: 'DES-28 D4',
    preConsent: 'No notification of this type exists.',
    host: 'src/components/FlyingBee.js',
    anchor: 'carrying',
    note:
      'FILLED BY R-N4 (Lumen, 2026-08-29), and the row moved from unhosted to ' +
      'hosted WITHOUT a notification ever being built. This used to read "THE ' +
      'CONTAINER DOES NOT EXIST", scoped to a search for an event feed, and ' +
      'that absence was correct and is still correct: there is no event feed, ' +
      'no badge, no pull, no row, and MVP1\'s scope lock is why. What fills D4 ' +
      'instead is the bee. He is already carrying the gift when you open the ' +
      'Hive and he crosses to your own seat and gives it — an object present ' +
      'on arrival, which is the one form of "you have something waiting" that ' +
      'survives your not having been there. The host is the carrier and the ' +
      'anchor is the prop that puts the drop in his hands; the crossing is ' +
      'commanded through HoneycombGrid\'s `pollinateOwnCell` and is ' +
      'conditional on the own seat existing (R-N4.2). `preConsent` is ' +
      'UNCHANGED and still binds: the balance read early-returns without ' +
      'consent, so nothing arrives and nothing is carried.',
  },
  {
    id: 'action-menu-row',
    deliverable: 'DES-28 D5',
    preConsent: 'Menu shows only "Send note · Plant seed"; the nectar row does not exist.',
    host: null,
    probe: 'noActionMenu',
    note:
      'THE CONTAINER DOES NOT EXIST. The deliverable adds a row to an existing ' +
      '"Send note · Plant seed" menu. There is no such menu at 35194bd and none on ' +
      'any of the 181 github branches swept: ComposeNote and PlantSeed are reached ' +
      'from two separate inbox screens, never from one sheet. The probe is exactly that fact, so the ' +
      'day someone builds the menu this row reds and asks for the placement.',
  },
];

// The only part of consent that design owns: THE DEFAULT IS NO.
//
// THE SUBJECT IS A CONSENT ROW, NOT AN ACCOUNT. When this module was written
// the record did not exist and the predicate read `account.nectarConsentAt`,
// a camelCase field nothing in this app produces. 19a's service layer landed
// it a few hours later (bumble/nectar-sim-service @ 3a17ca2, migration
// 20260826000005): `nectar_consents` is one row per consenting user, its one
// fact is `consented_at`, and both shapes the client can hold carry that
// name — `consent_to_nectar()` is `returns table (consented_at, ...)`, and
// `nectar_consents_select_own` grants a direct select of the same column.
//
// The spelling matters because THIS APP READS POSTGRES ROWS RAW. There is no
// snake_case-to-camelCase mapping anywhere in src/ (72 snake_case field reads
// at 35194bd; SeedsStore's `shapeSeed` flattens an embed and spreads the rest
// through unchanged). So `nectarConsentAt` would not have been merely a wrong
// name: it is a field no producer writes, which means the predicate returns
// NO for a user who has consented, forever, on a surface that is supposed to
// appear — and D6 keeps this module importer-free, so no gate here could have
// caught it. Same class as ENG-46's `sent_at` predicates, mine this time.
//
// PASS THE ROW, NOT THE RPC RESULT. supabase-js hands back an ARRAY for a
// `returns table` function, and an array is truthy with no `consented_at`, so
// `hasNectarConsent(data)` is a silent permanent NO. C4 pins that verdict so
// it is a known edge rather than a discovery. The predicate keeps ONE input
// shape on purpose: accepting both would put the ambiguity inside the one
// function whose entire job is to have no ambiguity.
//
// Every other shape is "has not consented" — undefined, null, no row, a null
// timestamp — because the failure this predicate exists to prevent is a
// nectar surface appearing while the answer is merely UNKNOWN.
export const hasNectarConsent = (consent) =>
  Boolean(consent && consent.consented_at);

// The one field name above, exported so the gate asserts the predicate and
// the migration agree rather than asserting a literal it also owns.
export const NECTAR_CONSENT_FIELD = 'consented_at';

// THE TWO OBJECTS BY WHICH CONSENT ITSELF IS ESTABLISHED OR READ — Pixel's
// §12.7 routing, corrected in §12.7a. Of the 32 reserved query identifiers
// (check-nectar-consent.mjs's rule E), these two cannot be conditioned on
// `nectarConsent` without reproducing the §10 bootstrap deadlock one layer
// down: `nectar_consents` is the row `getConsent()` reads to FIND OUT
// whether the flag should be true, and `consent_to_nectar()` is the RPC that
// MAKES it true. Gating either read on its own answer is not a stricter
// gate, it is a gate that can never open.
//
// This is a PROPERTY OF THE OBJECT, not a per-call-site exemption list — the
// distinction Pixel's ruling insists on. A future money identifier is never
// added here; only an identifier that is itself part of HOW consent is
// established or read belongs in this set, and there are exactly two of
// those in this schema today (nectar_ledger.sql + nectar_sim_service.sql).
export const NECTAR_CONSENT_BOOTSTRAP_OBJECTS = ['nectar_consents', 'consent_to_nectar'];

// ============================================================================
// THE HONEY LADDER'S INPUT — DES-24 §7 open inputs 1 and 2, ruled here
// because ENG-65's second half cannot be built without them. The renderer
// merged (HoneycombGrid's HoneyFill, `member.honeyRung`); NOTHING PRODUCED
// THE RUNG at the time this section was written, and check-honey-fill.mjs
// said so in its own header. Both halves have since landed: this file's
// mapping below, and `HoneycombTab`'s balance read that feeds it. R-N2
// replaced the rung with a continuous level; the rulings are unchanged.
//
// ---------------------------------------------------------------------------
// RULING 1 — THE LADDER READS THE AVAILABLE BALANCE, NOT LIFETIME RECEIVED.
//
// The two candidate quantities disagree in the source documents, so this is
// a decision and not a lookup. Spec §5.2(b): "received nectar visibly FILLS
// your hexagon cell." POLLINATE_V2_ASSIGNMENTS.md:117 (ENG-65): "balance
// derived from the ledger."
//
// Lifetime-received loses, and DES-24's OWN §5 is the argument against it:
// "an invented maximum is an invented GOAL, which turns a comb into a
// scoreboard." A lifetime total only ever rises. Against any fixed ceiling
// it saturates permanently — every long-tenured user pinned at the top rung,
// the register dead for exactly the people who used the product most — and
// a quantity that only rises toward a ceiling is the definition of a
// progress bar, which §5 also forbids the cell to be. The available balance
// FALLS when you give, which is the one behaviour that makes the ladder a
// state rather than a score.
//
// And giving is the product. A ladder that could not go down would mean the
// cell is a record of what you have been given and never of what you passed
// on — the exact asymmetry R15's "most of your life is made of things you
// were given" register was written against.
//
// ---------------------------------------------------------------------------
// RULING 2 — THE CAP IS STILL A PLACEHOLDER, BUT IT IS NO LONGER FREE.
//
// DES-24 §7.2: the cap "wants the drop distribution from the ledger, and 19a
// is what produces it. Until it exists, any value is a placeholder and must
// not be described as a target." That stands — 19a has produced no usage yet,
// so there is no distribution to read.
//
// What HAS arrived since is a hard lower bound the spec could not have known,
// and it is the starter grant. `consent_to_nectar()` mints
// `nectar_starter_grant_drops()` = 500 drops at the moment of consent
// (20260826000006's re-issued comment: "500 sats… granted once, at first
// consent, never again"). Under Ruling 1 that grant is in the balance. So:
//
//   IF cap <= grant, THEN a user who has consented and received NOTHING
//   shows a FULL cell, and every gift after that is invisible.
//
// That is not a mistuned cosmetic — it is the §23.1 class ("empty is a
// positive claim") wearing a ladder: the cell would assert a filled vessel
// out of an accounting artifact nobody gave anyone. It also inverts the
// first thing a new user ever does with nectar, because from a full cell the
// only available motion is downward.
//
// So the cap carries a DERIVED CONSTRAINT even while its value stays a
// placeholder: the grant must land on the LOWEST VISIBLE RUNG. At four
// visible rungs that is cap >= 4 x grant, and the placeholder below is that
// bound at equality — written as the bound rather than as a number, so that
// re-ratifying the grant re-derives it instead of silently breaking it.
//
// Equality is safe here and would not have been under the function's first
// draft; the anti-cliff correction that made it safe is now spelled as a
// rendered-height floor (`honeyHeightForLevel`, hexGeometry.js) rather than
// as "at least rung 1". `honeyRungForDrops` itself was retired by R-N2.
//
// ANNOTATION 2026-08-29 (R-N2), not an edit: everything above stands as
// ratified, but the phrase "the LOWEST VISIBLE RUNG" no longer has a
// referent — the ladder is continuous. The bound and its value are left
// exactly as they are; see the open note beside `honeyLevelForDrops` below
// for the arithmetic this build can offer and why the retune is Lumen's.
//
// NOT A TARGET, and the renderer is what keeps that honest: DES-24 §5 —
// "never labelled, never captioned '4 of 5', never given progress
// semantics." Nothing renders this number. It is a divisor.
export const NECTAR_STARTER_GRANT_DROPS = 500;

// Four visible rungs plus absent — HoneycombGrid gated on
// `Boolean(member.isOwn && member.honeyRung)`, so rung 0 was not a low fill,
// it was NO HONEYED STATE AT ALL. That reading of an empty vessel SURVIVES
// R-N2 verbatim (the gate is now `member.honeyLevel > 0`, and zero is still
// the only dark case); what does not survive is "0..4 rather than a
// percentage" — R-N2 measured that the steps were the defect. This constant
// now has exactly one job, as the multiplier in the cap's derived bound
// above, and that bound's own premise is flagged there.
export const NECTAR_LADDER_RUNGS = 4;

// PLACEHOLDER (DES-24 §7.2), bounded by Ruling 2 above rather than chosen.
export const NECTAR_LADDER_CAP_DROPS = NECTAR_STARTER_GRANT_DROPS * NECTAR_LADDER_RUNGS;

// THE PRESET AMOUNTS. Moved here from `NectarSendPanel` by R-N2: a preset is
// a LEDGER quantity, not panel chrome — the honey ladder's resolution is a
// statement about these three numbers against the cap, and check-honey-fill
// cannot read them from a file with JSX in it. One list, two consumers (the
// panel that offers them, the gate that measures them against the vessel).
export const NECTAR_PRESETS = [10, 50, 100];

// Balance (drops) -> the CONTINUOUS honey level, 0..1.
//
// R-N2 (POLLINATE_NECTAR_LIVING_EXCHANGE §3) retires `honeyRungForDrops`.
// This replaces it rather than joining it: two mappings from one balance to
// one vessel is a second copy of a derivation, and the two would drift the
// first time either is retuned.
//
// WHAT THE RUNGS WERE HIDING, measured by Lumen against `960ec7b`: at a cap
// of 2000 and presets of 10/50/100, rung 1 spanned balances 1..999 — half
// the entire cap — with the 500-drop starter grant dead in the middle of it.
// From the state every consenting user starts in, NO single transaction this
// product offers changed the level in either direction. Moving one rung took
// 5 gifts at the largest preset or 50 at the smallest. That is not a
// mistuned cap; it is a register whose resolution is 5x coarser than its own
// biggest gesture, and no cap fixes it while the ladder is stepped.
//
// The floor is NOT applied here. "Any positive balance renders a visible
// minimum" is a statement about a rendered height in points, derived from
// the meniscus stroke it has to clear, and it lives with the geometry that
// owns both (`honeyHeightForLevel`, hexGeometry.js). This function is ledger
// arithmetic and stays free of the renderer's units — which is also what
// keeps this file importable from a bare `node` script.
export const honeyLevelForDrops = (drops) => {
  const n = Number(drops);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(1, n / NECTAR_LADDER_CAP_DROPS);
};

// ---------------------------------------------------------------------------
// OPEN, AND FLAGGED RATHER THAN RULED — the cap's premise moved underneath it.
//
// `NECTAR_LADDER_CAP_DROPS` is derived above as `grant x NECTAR_LADDER_RUNGS`,
// and Ruling 2's argument for the multiplier was "the grant must land on the
// LOWEST VISIBLE RUNG". Continuous, there are no rungs, so the number 4 has
// lost the derivation that produced it. Its VALUE and its bound are
// deliberately untouched here: retuning a placeholder whose reasoning has
// moved is a design ruling, and it is Lumen's.
//
// What this build can contribute is the arithmetic she does not have yet,
// because it turns out the two constraints on the cap are now INCOMPATIBLE:
//
//   * headroom  — a new user must not see a near-full cell, which wants a
//     LARGE cap. At 2000 the grant renders at 25% and there are 1500 drops
//     of room above it.
//   * resolution — the smallest gift must move a rendered edge, which wants
//     a SMALL cap. At `honeyHMax(44)` = 26.8180pt:
//
//         preset  10 -> 0.1341pt = 0.402 physical px @3x, 0.268 @2x
//         preset  50 -> 0.6705pt = 2.011 physical px @3x, 1.341 @2x
//         preset 100 -> 1.3409pt = 4.023 physical px @3x, 2.682 @2x
//
// So 50 and 100 clear a physical pixel comfortably on both densities and 10
// does not, on either. And there is no cap that rescues it: 10 drops needs
// cap <= 804 to move one physical pixel at @3x, at which point the grant
// already renders at 62% of the vessel and saturates after three gifts —
// DES-24 §5's progress bar, arrived at from the other side.
//
// THE SMALLEST PRESET CANNOT BE MADE LEGIBLE ON THE MENISCUS BY ANY CAP.
// That is a finding, not a defect, and §2 of the spec is why: a level is a
// STATE and a gift is an EVENT, so the meniscus was never the thing that had
// to carry 10 drops — the drop that leaves your hand (R-N3) and the bee that
// brings it (R-N4) are. The one line that disagrees is §6 acceptance row 1,
// which asks every preset to produce a measurable change; it is measurable
// in points and sub-pixel on glass, and only a device settles the gap
// between those two. Routed to Lumen with the numbers rather than resolved
// by quietly moving her constant.

// ---------------------------------------------------------------------------
// R-N4 — THE ARRIVAL. Did a gift land while you were not looking?
//
// (The two lines that stood here were the header of `honeyRungForDrops`,
// left behind when R-N2 removed the function under them. A comment whose
// subject is gone is worse than no comment: it is a promise that something
// below it exists. Removed rather than left for a sweep.)
//
// This is the whole of R-N4's detection half, and it is a PURE COMPARISON so
// that it lives here — in the one nectar module a gate can import — rather
// than inside the effect that performs it. The same reason `honeyLevelForDrops`
// is here: ledger arithmetic, no renderer units, importable from bare `node`.
//
// THE TRAP IS `null`, AND IT IS THE ONE `NectarStore` ALREADY WROTE DOWN.
// `getBalanceDrops` returns `null` for UNKNOWN-or-unprovisioned and `0` for a
// real, read, empty wallet, and its own comment says the caller must not
// collapse them ("empty is a positive claim", §23.1). Here that stops being a
// rendering nicety and becomes arithmetic: treat an unknown as a previous
// balance of 0 and the first successful read after ANY failed one fabricates
// a gift OF THE ENTIRE BALANCE — 500 drops of bee, for nothing. So both
// unknowns return `null`, and `null` means "no arrival", never "no gift".
//
// THE FIRST READ OF A USER'S LIFE IS ALSO AN UNKNOWN, and that is what closes
// the starter grant. Consent provisions the accounts and the balance goes from
// no-row to 500 in one step; with no remembered value there is nothing to have
// risen FROM, so the grant lands on the first-run path and announces nothing.
// A grant is not a gift, and this is why nothing has to say so.
//
// WHAT A RISE IS SCOPED TO. R-N4's own words are "your balance has risen since
// your last read" — a rise in the AVAILABLE BALANCE, which is what this
// returns. It is not "a gift was received", and the difference is not
// pedantry: the ledger is the server's and this function has read exactly one
// number. Every rise the product can currently produce is a received zap
// (`record_zap` credits only the recipient) and the one other riser, the
// grant, is closed above — but that is a property of today's RPCs, not of
// this function, and it is stated here so the next writer of a credit path
// knows they are inside this claim.
//
// A FALL IS NOT AN ERROR AND NOT AN ARRIVAL. You sent a gift. The caller
// still remembers the new, lower number — otherwise the balance you spent
// down to would be re-announced as an arrival the moment it climbed back to
// where it already was.
//
// @param lastSeenDrops  the remembered balance, or `null` if never recorded
// @param balanceDrops   the balance just read, or `null` if unknown
// @returns the number of drops that arrived (> 0), or `null` for no arrival
export const nectarArrivalDrops = (lastSeenDrops, balanceDrops) => {
  const now = Number(balanceDrops);
  const then = Number(lastSeenDrops);
  if (balanceDrops === null || balanceDrops === undefined || !Number.isFinite(now)) return null;
  if (lastSeenDrops === null || lastSeenDrops === undefined || !Number.isFinite(then)) return null;
  const risen = now - then;
  return risen > 0 ? risen : null;
};
