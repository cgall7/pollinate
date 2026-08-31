// ENG-96, row 1.14. §1B.35.3(b) fixed this class; §1B.38.12 refused
// widening it to include 'Someone' — that word is the AUTHORIZATION
// refusal ("I am not permitted to read this person", §1B.35.2), not a
// name-absence marker, and stays a live-refusal fallback at call sites
// gated on whether the read reached a row at all (Row 1.15's
// `resolveDirectName` in HiveStore.js: a batch profile join that never
// got a row back for an id — RLS-dropped or deleted — answers 'Someone';
// a row it DID reach runs this classifier instead).
//
// A name in this class is not a person who withheld consent — it is a
// signup nobody has ever asked for a name (`handle_new_user`'s default),
// or the empty string a not-yet-repaired writer left behind. Both read the
// same to a caller: nothing to show, so the site's own copy takes over.
const PLACEHOLDER_NAMES = new Set(['', 'New user']);

export const isPlaceholderName = (name) => PLACEHOLDER_NAMES.has(name ?? '');
