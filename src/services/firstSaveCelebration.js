import AsyncStorage from '@react-native-async-storage/async-storage';

// Eligibility for Today's first-save celebration card (Deezine's post-auth
// nudge ruling, `6f9e87ad`, 2026-09-03). One key, one direction: unspent
// until the card renders once, spent forever after.
//
// WHY A PERSISTED FLAG IS NECESSARY AND NOT SUFFICIENT, both halves stated
// because getting one of them wrong renders the card to the wrong person:
//
//   NECESSARY — `EntryStore.saveEntry` is upsert-shaped (`EntryStore.js:49`:
//   it selects today's row, updates when one exists and inserts when it does
//   not) and BOTH branches return `toEntry(data)`. A later save is therefore
//   indistinguishable from a first one at the call site, so "the save
//   resolved" cannot mean "the first save resolved" and the ruling's "never
//   on later saves" needs a fact that outlives the render.
//
//   NOT SUFFICIENT — this key is absent on a fresh INSTALL, not on a fresh
//   ACCOUNT. A user who has been writing for a year and reinstalls, or who
//   signs in on a second device, arrives with it unset. That is why the
//   caller pairs it with `EntryStore.getFirstEntryDate()`: the flag answers
//   "has this device already spent the celebration", the query answers "is
//   the entry we just wrote this account's first". Both must agree.
//
// FAIL CLOSED. A read we could not make resolves to SPENT, never to pending:
// the cost of a missed celebration is one absent card, and the cost of a
// wrong one is the product congratulating a long-time user on their first
// entry. Those are not symmetric.
const STORAGE_KEY = 'first_save_celebration_v1';

export const FirstSaveCelebration = {
  async isUnspent() {
    try {
      return (await AsyncStorage.getItem(STORAGE_KEY)) === null;
    } catch {
      return false;
    }
  },
  async spend() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'shown');
    } catch {
      // A failed write costs a repeat on the next first-ever save, and there
      // is no next first-ever save — `getFirstEntryDate()` has moved into the
      // past by then, so the paired condition holds this closed anyway.
    }
  },
};
