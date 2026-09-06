// Apple returns `credential.fullName` EXACTLY ONCE — on the first
// authorization of this app by this Apple ID, and never again on any
// subsequent sign-in from any device. There is no second chance and no API to
// re-request it. A signup that drops it has permanently lost the person's
// name, and `handle_new_user` then defaults `display_name` to 'New user',
// which freezes into `entries.author_name_at_seal` and
// `private_hives.contributor_names` at seal. The keepsake is signed by
// nobody. That is the failure this module exists to prevent.
//
// The name ladder (Lumen, 2026-09-06) is: self-chosen > organizer-typed >
// system default. An Apple-provided name enters ABOVE the system default and
// BELOW anything the person chose, which is why the caller gates the write on
// `isPlaceholderName` rather than writing unconditionally. In practice Apple
// only ever hands us this payload at first authorization, so the guard is
// almost always vacuous — it is here because "almost always" is not a
// contract, and re-authorization after an account delete is the case where it
// is not.
//
// `nickName` is deliberately not read: Apple populates it from a field the
// person did not fill in for us, and the two-part name is what every other
// producer in this product writes.
export const appleFullNameToDisplayName = (fullName) =>
  [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ').trim();
