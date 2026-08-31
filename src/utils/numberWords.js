// COPY-6's standing rule: a rendered count is a word, never a digit ("Six
// people", not "6 people") — a digit reads as a stat, a word reads as a
// sentence. Covers 0-99, which comfortably clears the premium comb ceiling
// (20, §18.2) with room to spare; anything larger falls back to the digit
// itself rather than silently mis-rendering, so an unexpectedly large count
// is visible in review instead of shipping a blank.

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
