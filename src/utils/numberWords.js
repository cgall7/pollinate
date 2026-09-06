// COPY-6's rule, as Lumen ruled it in FU3.1 and amended it in FU3.2
// (thread 160660d9). It is a criterion on TWO axes, not a blanket, and a
// count is spelled as a word only where both axes agree it is speech:
//
//   REGISTER   is the count inside a SENTENCE, a clause with a verb, prose
//              speaking to the reader?  Or in a bare noun-phrase LABEL,
//              the stat register, card metadata with no verb?
//   SUBSTANCE  is the count a TALLY — people, or the things they made,
//              present in the product and counted?  Or a MEASURE — a value
//              on an external scale: money, characters, days, years, a
//              bound, a ratio?
//
//   sentence + tally   -> WORD    "Six people are in this comb."
//   everything else    -> DIGIT   "12 memories", "You have 40 drops.",
//                                 "Keep the note under 280 characters."
//
// Digits read as data, words read as speech, and a measure is data in any
// register: money is figures wherever it appears, and spelling one side of
// a ratio and not the other reads worse than both as figures.
//
// This header used to state the universal "a rendered count is a word,
// never a digit", which practice contradicted in more than a dozen places,
// and a header wider than its practice is an exemption waiting to outlive
// its justification. The register axis alone was still too narrow for the
// same reason in miniature: it was licensed by a sentence about the sites
// two people had found by hand, and the sweep refuted it.
//
// The criterion is MEASURED, not asserted: `scripts/check-number-register.mjs`
// walks every number this app renders next to a noun, classifies each one
// on both axes, and holds the whole tree to the law above. It also prints
// on every run any count the criterion does not yet reach, so the next
// stranger arrives as a question rather than as a silent exception.
//
// One thing this rule does NOT decide: how a count reads at 1. "1 drops"
// and "One of you are writing" are subject-verb agreement, not register,
// and spelling a count as a word makes a disagreement louder rather than
// safer. The same gate holds that separately: every count that can vary
// declares whether a sibling arm, its own ternary, an arithmetic floor or
// a guard keeps it correct at 1.
//
// Covers 0-99, which comfortably clears the premium comb ceiling (20,
// §18.2) with room to spare; anything larger falls back to the digit
// itself rather than silently mis-rendering, so an unexpectedly large
// count is visible in review instead of shipping a blank.

const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];

const TENS = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
];

export const numberInWords = (n) => {
  if (!Number.isInteger(n) || n < 0 || n > 99) return String(n);
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones === 0 ? TENS[tens] : `${TENS[tens]}-${ONES[ones]}`;
};

// Capitalizes only the first letter — "Six", not "SIX" — for sentence-initial
// use (COPY-6: "capital first, no addressee").
export const numberInWordsCapped = (n) => {
  const words = numberInWords(n);
  return words.charAt(0).toUpperCase() + words.slice(1);
};
