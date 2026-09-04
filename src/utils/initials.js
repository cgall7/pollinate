// One writer for "the short form of a person's name in a comb cell."
//
// Extracted from HoneycombGrid (where it was a file-local const) when
// EntryCombGrid's own cells needed the same answer for the private hive's
// memory comb (2026-09-04, Colin's parity ask). A leaf util rather than an
// export off HoneycombGrid: the private-hive screen must not take a
// dependency on the public comb's component module to borrow five lines of
// string handling, and two copies of a display rule is how two combs start
// abbreviating the same person differently.
//
// Callers are responsible for deciding whether there is a name to show at
// all — a placeholder-class name (`isPlaceholderName`) or an authorization
// refusal ('Someone') must be resolved to absence BEFORE this is called.
// Handing either one straight in would render a confident 'S' or 'NU' for a
// person this reader was never shown.
export const initialsFor = (name) => {
  const parts = (name || '?').trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
};
