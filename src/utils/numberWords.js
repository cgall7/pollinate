// COPY-6's rule, as Lumen ruled it in FU3.1 (thread 160660d9). It is a
// REGISTER criterion, not a blanket:
//
//   a count inside a SENTENCE — a clause with a verb, prose speaking to
//   the reader — is a word:              "Six people are in this comb."
//   a count in a bare noun-phrase LABEL — the stat register, card
//   metadata with no verb — is a digit:  "12 memories"
//
// Digits read as data, words read as speech, and the app was already doing
// both. This header used to state the universal "a rendered count is a
// word, never a digit", which practice contradicted in more than a dozen
// places, and a header wider than its practice is an exemption waiting to
// outlive its justification.
//
// The criterion is MEASURED, not asserted: `scripts/check-number-register.mjs`
// walks every number this app renders next to a noun, classifies each one
// sentence or label, and prints on every run the ones the criterion does
// not yet reach. That census is also what refuted the tidier version of
// this rule — there are sentence-register digit sites, and they are not one
// class (money, ratios, caps and spans each want their own answer), so the
// gate files them rather than pretending the criterion already decided.
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
