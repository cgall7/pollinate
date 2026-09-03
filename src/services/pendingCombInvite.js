import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pending_comb_invite_v1';

export const PendingCombInvite = {
  async get() {
    return AsyncStorage.getItem(STORAGE_KEY);
  },
  async set(inviteCode) {
    await AsyncStorage.setItem(STORAGE_KEY, inviteCode);
  },
  async clear() {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
