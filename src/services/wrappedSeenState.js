import AsyncStorage from '@react-native-async-storage/async-storage';

// §14.2 respec §5: the door's SEEN state — "ready, already opened this
// cycle." One string, not a list: the recurring edition has exactly one
// subject at a time (§1, "never re-opened once superseded"), so only the
// most recently opened month's key needs to survive. A new month arriving
// makes the old key stop matching on its own; nothing here has to notice
// the rollover or clean up after it.
const STORAGE_KEY = 'wrapped_seen_month_v1';

export const WrappedSeenState = {
  async getSeenMonthKey() {
    return await AsyncStorage.getItem(STORAGE_KEY);
  },
  async markSeen(monthKey) {
    await AsyncStorage.setItem(STORAGE_KEY, monthKey);
  },
};
