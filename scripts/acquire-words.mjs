// THE ACQUISITION VOCABULARY BAN — the words that may not appear in
// Pollinate's copy because they OFFER THE PERSON A ROUTE TO ACQUIRE.
//
// A LEAF MODULE ON PURPOSE — no imports, no side effects, nothing to run,
// exactly like `forbidden-words.mjs`. And it lives in `scripts/` for a
// second, load-bearing reason: a reserve gate CONTAINS ITS OWN TOKENS, and
// this module's population is `App.js` + `src/**` + the demo corpus. Being
// outside that population is STRUCTURAL here, where `NECTAR_RESERVE` had to
// buy the same property with a named self-exclusion in the gate
// (`check-nectar-consent.mjs`'s `SELF`). Nothing to exempt means nothing to
// grow quietly. Do not move this file into `src/constants/`.
//
// WHERE THE RULE COMES FROM
//
// Lumen, 2026-09-06 (UX Design, thread root `0a406eb6`, ruling `db1dc0cb`):
// a standing gate "keyed on the promise rather than the sentence — verbs
// offering a route to acquire: earn, buy, purchase, redeem, cash out,
// withdraw and kin; final list enumerated at build, each word ratified
// against its agency direction; 'refills' stays legal because it is a law
// with no actor."
//
// WHY THE PROMISE IS THE THING BANNED. There is no route. `O7` rules IAP
// out of MVP-Comb and there is no IAP dependency of any kind in the tree;
// the money layer is `ledger_current_mode() = 'simulated'`; and the real
// rails (`ENG-67` Breez/Spark, `ENG-68` Privy) are blocked behind `LEGAL-1`,
// whose own non-negotiable is "any 19b work before LEGAL-1 returns". So a
// string reading "Buy more sats" is three separate defects at once: a
// promise the build cannot keep, a financial-services sentence written
// before counsel has answered, and an App Store listing problem on a product
// that is trying to stay in Lifestyle.
//
// THE AGENCY DIRECTION TEST, applied word by word. A word is in this reserve
// only if it puts THE PERSON in the agent position of an acquisition — units
// for value they own, or value they own for units. Both directions cross the
// boundary out of the closed simulated loop, which is why `withdraw` and
// `cash out` are here alongside `buy`. Verbs that stay INSIDE the loop are
// legal and deliberately absent: `send`, `give`, `spend` move drops between
// two people who already have them and offer no route in or out.
//
// `refills` is the ruled example and it is legal for the stated reason: "Your
// nectar refills with each delivery" (`NectarTab.js`, Lumen 2026-09-06) has
// no actor. Nobody is offered anything; a law is stated. `refill` is
// therefore EXCLUDED FROM THE VERB VOCABULARY BELOW, and that exclusion is
// load-bearing rather than decorative: the compound pattern is
// verb-near-unit, the ruled sentence contains `nectar`, and today it escapes
// only because the words happen to fall in the order "nectar refills" rather
// than "refill your nectar". Adding `refill` to the verb list would red a
// ruling. `check-acquire-vocabulary` pins its absence.
//
// TWO TIERS, AND THE MEASUREMENT THAT FORCED THEM
//
// Measured over 1549 authored strings at `5d7f292` — every rendered string
// under `App.js` + `src/**`, plus the two populations no collector reaches
// (see the gate), plus the demo account corpus a reviewer actually reads:
//
//   earn      1 hit   demo-seed-corpus.mjs:957
//                     "I let a Sunday go by without earning anything from it."
//   pay/paid  1 hit   demo-seed-corpus.mjs:497 "I still have not paid you."
//   checkout  1 hit   demo-seed-corpus.mjs:909 "...at the supermarket checkout."
//   sell      3 hits  legalCopy.js "We do not sell your information..."
//   trade     1 hit   hivePrompts.js:369 "the shifts traded to make my games"
//   claim     1 hit   legalCopy.js:261 "We claim no ownership of it."
//   collect   3 hits  legalCopy.js:174 "What we collect"
//   credit    1 hit   hivePrompts.js:259 "during the credits"
//   win       4 hits  prompts.js:68 "What's a small win from this week?"
//   spend     2 hits  hivePrompts.js:427 "saving before spending"
//
// So `earn` — the FIRST word in the ruling's own enumeration — cannot be a
// bare token: it would red shipped demo copy on the day it landed. Six more
// of the obvious candidates fail the same way. This is the singular-`drop`
// finding from `NECTAR_RESERVE` reproduced empirically rather than by
// intuition, and it is the reason the reserve is not a flat word list:
//
//   TIER 1, BARE. Words with no non-money use in any English this app
//   writes. Each measured at zero over all 1549 strings.
//
//   TIER 2, COMPOUND. An acquisition verb within a short window of one of
//   THIS APP'S OWN unambiguous money nouns. `earn` is banned as "earn
//   drops", never as "earning anything from it". The promise lives in the
//   verb PLUS its object, which is what "keyed on the promise" means when
//   the verb alone is ordinary English.
//
// WHAT IS DELIBERATELY NOT A MONEY NOUN, and why each exclusion is a
// measurement rather than a preference:
//
//   `gift`/`gifts`  the app's word for the sats transfer AND for an ordinary
//                   present someone gave you ("the gift she left on my
//                   desk"). Ambiguous by construction. "Buy a gift" is
//                   already caught by bare `buy`.
//   `balance`       "you helped me get my balance back that year" is
//                   gratitude register, and `get more` + `balance` would red
//                   it.
//   `sat` singular  a verb — "she sat with me the whole night". Same shape
//                   as singular `drop`, and already banked twice.
//   `drop` singular a verb in this app before it is a unit — hivePrompts
//                   "drop everything for". `NECTAR_RESERVE` established this
//                   and the same exclusion holds here.
//   `credits`       "during the credits".
//   `coins`/`tokens` no evidence either way; a reserve word with no measured
//                   basis is a guess, and a guess in a ban is an exemption
//                   waiting to be argued.
//
// THE ONE FRAGILE MEMBER, STATED RATHER THAN SMUGGLED. Bare `buy` is the
// only tier-1 word whose non-money use is PLAUSIBLE in this register but
// ABSENT from today's corpus: "What would you buy them if money were no
// object?" is a prompt nobody has written and could. It is in the gate's
// must-not-catch fixture as a KNOWN, DELIBERATE red so the cost is visible
// in the instrument rather than in a comment. It stays bare because "Buy
// now" on a paywall carries the whole promise with no object to compound
// against. The day a legal use is written, the gate reds and a human rules
// on it — which is the gate working, not failing.
//
// AND THE DAY A REAL ROUTE EXISTS, THIS LIST SHRINKS. The printed comb
// (a physical good, carved out of IAP) and the subscription are both
// intended commerce. When either ships, the ruling that ships it removes the
// word from this list — the same move Colin made on 2026-09-04 when he
// un-banned `sats` and `bitcoin` by DELETING them from `forbidden-words.mjs`
// rather than widening an exemption around them. An exemption outlives its
// justification; a deletion cannot.

// This app's own unambiguous money nouns. Pinned by the gate: shrinking this
// vocabulary silently shrinks every compound pattern below, and the compound
// rows would keep passing over a smaller universe.
export const ACQUIRE_UNITS = ['sats', 'nectar', 'drops', 'bitcoin', 'zap'];

// The acquisition verbs, for the compound tier. Pinned by the gate for the
// same reason. `refill` is not here and must not be — see above.
export const ACQUIRE_VERBS = [
  'earn', 'claim', 'unlock', 'win', 'sell', 'sold', 'trade', 'convert',
  'exchange', 'swap', 'get more', 'add more', 'receive more', 'collect more',
  'earn more',
];

const UNITS = '(?:sats|nectar|drops|bitcoin|zaps?)';
const VERBS =
  '(?:earn(?:s|ed|ing)?|claim(?:s|ed|ing)?|unlock(?:s|ed|ing)?|win(?:s|ning)?' +
  '|sell(?:s|ing)?|sold|trade(?:s|d)?|convert(?:s|ed|ing)?|exchange(?:s|d)?' +
  '|swap(?:s|ped|ping)?|(?:get|add|receive|collect|earn)(?:s|ting|ing)?\\s+more)';

// THE WINDOW IS TWENTY-FOUR CHARACTERS AND IT IS A BOUND, NOT A PROOF. The
// compound patterns below refuse to cross a sentence terminator, and they
// cap the gap between verb and unit, so "Earn drops by writing" reds and a
// sentence that happens to contain both words forty words apart does not.
// Copy that splits the promise across a sentence boundary, "More sats? Here
// is how.", escapes; no widening of the number closes that. It is a phrase
// matcher and it is named as one. The literal is deliberately absent from
// this paragraph: it is a mutation anchor, and an anchor that also appears
// in prose is not unique.
export const ACQUIRE_RESERVE = [
  {
    word: 'buy',
    re: /\bbuy(?:s|ing)?\b|\bbought\b/i,
    why: 'the plain offer, with or without an object. THE FRAGILE ONE — see the header.',
  },
  {
    word: 'purchase',
    re: /\bpurchas(?:e|es|ed|ing|er)\b/i,
    why: 'commerce-only in any English this app writes; also the App Store term of art.',
  },
  {
    word: 'redeem',
    re: /\bredeem(?:s|ed|able|ing)?\b|\bredemption\b/i,
    why: 'units out for value in. A stored-value sentence counsel has not seen.',
  },
  {
    word: 'withdraw',
    re: /\bwithdraw(?:s|al|als|ing|n)?\b/i,
    why: 'the outbound direction of the same promise; LEGAL-1 gates it.',
  },
  {
    word: 'deposit',
    re: /\bdeposit(?:s|ed|ing)?\b/i,
    why: 'inbound value. Banking register on a gratitude product.',
  },
  {
    word: 'top up',
    re: /\btop[\s-]?ups?\b|\btopping[\s-]?up\b/i,
    why: 'the acquisition route named as a product feature.',
  },
  {
    word: 'cash out',
    re: /\bcash(?:ing|ed)?[\s-]?(?:out|in)\b/i,
    why: "the ruling's own example. Bare `cash` is NOT banned — \"he gave me cash for the trip\" is register.",
  },
  {
    word: 'payout',
    re: /\bpay[\s-]?outs?\b/i,
    why: 'bare `pay`/`paid` is excluded — "I still have not paid you" is shipped demo copy.',
  },
  {
    word: 'refund',
    re: /\brefund(?:s|ed|able|ing)?\b/i,
    why: 'presupposes a purchase, so it carries the promise even in the negative.',
  },
  {
    word: 'in-app purchase',
    re: /\bin[\s-]?app purchas/i,
    why: 'the exact phrase `O7` rules out; kept separate from `purchase` so the row names the ruling.',
  },
  {
    word: 'add funds',
    re: /\badd(?:s|ing)?\s+(?:funds|money|credit|cash)\b/i,
    why: 'bare `add` is ordinary; this collocation is only ever a top-up button.',
  },
  {
    word: 'acquire-verb near unit',
    re: new RegExp(`\\b${VERBS}\\b[^.!?]{0,24}\\b${UNITS}\\b`, 'i'),
    why: 'TIER 2 forward: "Earn drops by writing every day". The verbs here are ordinary English on their own and are banned only against this app\'s units.',
  },
  {
    word: 'unit near acquire-verb',
    re: new RegExp(`\\b${UNITS}\\b[^.!?]{0,16}\\b(?:to|you can|and)\\s+${VERBS}\\b`, 'i'),
    why: 'TIER 2 reverse: "Sats you can earn". Word order is not a defence, and the forward pattern alone would make it one.',
  },
];

// The bare words, for a consumer testing a set it controls end to end —
// same contract as `FORBIDDEN_WORDS` next door.
export const ACQUIRE_WORDS = ACQUIRE_RESERVE.map((r) => r.word);
