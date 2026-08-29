import AsyncStorage from '@react-native-async-storage/async-storage';

// R-N4's memory — the balance this device last showed THIS user.
//
// > When you open the Hive and your balance has risen since your last read,
// > the bee is already carrying it.
//
// "Since your last read" is the only part of R-N4 the server cannot answer.
// The ledger knows the balance; nothing on it knows which balance this
// person has already seen, because seeing is a property of a screen and not
// of a row. So it is local, and it is the same shape as `WrappedSeenState`:
// one remembered value, superseded rather than accumulated.
//
// THE KEY IS PER USER, AND THAT IS NOT TIDINESS. A device is not an account.
// On one bare key, signing into a second account reads the first account's
// remembered balance, and the comparison is then between two different
// people's ledgers — which fabricates an arrival for whoever has more, and
// silently swallows a real one for whoever has less. `nectarArrivalDrops`
// cannot see that: both numbers are finite and one is larger, which is
// exactly what an arrival looks like. The scope has to be in the key.
//
// A MISSING KEY IS NOT ZERO, for the same reason `NectarStore.getBalanceDrops`
// says no row is not zero. `AsyncStorage.getItem` returns `null` for "never
// written", and that `null` is passed through unchanged so it reaches
// `nectarArrivalDrops` as the unknown it is. Anything that coerced it to 0
// here would put the first-run fabrication back one layer below the function
// written to prevent it.
//
// A READ THAT THROWS IS ALSO UNKNOWN. Storage can fail; an arrival that is
// missed costs a beat, and an arrival that is invented costs the user's
// trust in the number. Both failure paths return `null` — no bee, no lie.
const keyFor = (userId) => `nectar_last_seen_drops_v1:${userId}`;

export const NectarArrivalState = {
  // The remembered balance as a NUMBER, or `null` for never-written /
  // unreadable / corrupt. Parsed here rather than at the call site so there
  // is exactly one place that decides what a stored string means.
  async getLastSeenDrops(userId) {
    if (!userId) return null;
    try {
      const raw = await AsyncStorage.getItem(keyFor(userId));
      if (raw === null) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    } catch (err) {
      console.warn('NectarArrivalState: failed to read last-seen balance', err);
      return null;
    }
  },

  // Remember what was just shown. Called on EVERY successful read, including
  // the ones that fell and the ones that did not move — see the fall note in
  // `nectarArrivalDrops`: remembering only rises would re-announce a balance
  // the moment it climbed back to a number it had already reached.
  //
  // Deliberately not called for an unknown balance. There is nothing to
  // remember, and writing one would erase the last real value.
  async rememberDrops(userId, drops) {
    if (!userId || !Number.isFinite(Number(drops))) return;
    try {
      await AsyncStorage.setItem(keyFor(userId), String(Number(drops)));
    } catch (err) {
      console.warn('NectarArrivalState: failed to persist last-seen balance', err);
    }
  },
};
