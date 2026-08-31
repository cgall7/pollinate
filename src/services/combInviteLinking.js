import * as Linking from 'expo-linking';

export const COMB_INVITE_PATH = 'comb-invite';

export const getCombInviteUrl = (inviteCode) =>
  Linking.createURL(COMB_INVITE_PATH, { queryParams: { code: inviteCode } });

export const parseCombInviteUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = Linking.parse(url);
    if (parsed.path !== COMB_INVITE_PATH) return null;
    const code = Array.isArray(parsed.queryParams?.code)
      ? parsed.queryParams.code[0]
      : parsed.queryParams?.code;
    const normalized = typeof code === 'string' ? code.trim() : '';
    return normalized || null;
  } catch {
    return null;
  }
};
