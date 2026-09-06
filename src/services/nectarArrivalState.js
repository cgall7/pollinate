import AsyncStorage from '@react-native-async-storage/async-storage';

// R-N4's memory — the RECEIVED TOTAL this device last showed THIS user.
//
// > When you open the Hive and your balance has risen since your last read,
// > the bee is already carrying it.
//
// "Since your last read" is the only part of R-N4 the server cannot answer.
// The ledger knows what has been received; nothing on it knows which of it
// this person has already seen, because seeing is a property of a screen and
// not of a row. So it is local, and it is the same shape as
// `WrappedSeenState`: one remembered value, superseded rather than
// accumulated.
//
// IT IS A RECEIVED TOTAL, NOT A BALANCE, AS OF 2026-09-06, and the key
// changed with it. The delivery allowance re-keyed `nectarArrivalDrops` onto
// the gift's own query (see its comment), so what gets remembered here is
// the sum of `nectar_zaps` + `comb_nectar_notes` received, not
// `user_nectar_balances`. A remembered balance compared against a received
// total is two finite numbers with one larger — indistinguishable from an
// arrival, which is exactly the class this file's per-account note is about,
// arriving through TIME instead of through accounts. Reusing the old key
// would have fabricated or swallowed one arrival for every existing user on
// the upgrade. So `_v1` is left where it lies, unread, and this is a new
// name: the first read after the upgrade is a miss, which returns `null`,
// which is "no arrival". One quiet beat, for everyone, once.
//
// THE KEY IS PER USER, AND THAT IS NOT TIDINESS. A device is not an account.
// On one bare key, signing into a second account reads the first account's
// remembered number, and the comparison is then between two different
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
const keyFor = (userId) => `nectar_last_seen_received_v1:${userId}`;

export const NectarArrivalState = {
  // The remembered received total as a NUMBER, or `null` for never-written /
  // unreadable / corrupt. Parsed here rather than at the call site so there
  // is exactly one place that decides what a stored string means.
  async getLastSeenReceivedDrops(userId) {
    if (!userId) return null;
    try {
      const raw = await AsyncStorage.getItem(keyFor(userId));
      if (raw === null) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    } catch (err) {
      console.warn('NectarArrivalState: failed to read last-seen received total', err);
      return null;
    }
  },

  // Remember what was just read. Called on EVERY successful read, including
  // the ones that did not move. Under the re-key a fall is not reachable at
  // all (the total is monotone — see `nectarArrivalDrops`), but the write
  // stays unconditional for the reason it always was: a memory written only
  // on rises is a memory that can disagree with what the screen last showed,
  // and the cheapest way to never have that bug is to never have that branch.
  //
  // IT IS CALLED WITH UNKNOWNS, AND THE REFUSAL LIVES HERE. The caller writes
  // on every pass, including the ones where the read failed and `drops` is
  // `null` — `getReceivedDropsTotal` answers `null` for a missing page, and
  // `HoneycombTab`'s own catch answers `null` for a failed one. So this
  // method is the only thing standing between a transient network beat and an
  // erased memory, and one place decides.
  //
  // `Number.isFinite` IS DELIBERATELY NOT WRAPPED IN `Number(...)`.
  // `Number(null)` is `0`, which is finite, so the coercing form lets `null`
  // walk through and writes "0" over the last real total. The next healthy
  // open then computes the whole of a person's received history minus zero
  // and flies it as ONE arrival, from nobody — strictly worse than the
  // refill-misannouncement the re-key exists to prevent, and unreachable by
  // the read side's own refusal to fabricate: that one proves nothing is
  // invented on the way OUT of storage, and this is the way IN. Bare
  // `Number.isFinite` refuses `null`, `undefined` and every string while
  // still passing a real 0.
  async rememberReceivedDrops(userId, drops) {
    if (!userId || !Number.isFinite(drops)) return;
    try {
      await AsyncStorage.setItem(keyFor(userId), String(drops));
    } catch (err) {
      console.warn('NectarArrivalState: failed to persist last-seen received total', err);
    }
  },
};
