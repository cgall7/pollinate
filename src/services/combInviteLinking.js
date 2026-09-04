import * as Linking from 'expo-linking';

export const COMB_INVITE_PATH = 'comb-invite';

export const getCombInviteUrl = (inviteCode) =>
  Linking.createURL(COMB_INVITE_PATH, { queryParams: { code: inviteCode } });

export const parseCombInviteUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = Linking.parse(url);
    // pollinate:// is a non-special scheme, so WHATWG URL puts the first
    // segment in hostname, not pathname — only https:// (and a triple-slash
    // pollinate:///... link) populates `path` here. Falling back to hostname
    // is what makes a standalone-build invite link resolve at all; without
    // it every `pollinate://comb-invite?...` link silently fails to match.
    const path = parsed.path ?? (parsed.hostname || null);
    if (path !== COMB_INVITE_PATH) return null;
    const code = Array.isArray(parsed.queryParams?.code)
      ? parsed.queryParams.code[0]
      : parsed.queryParams?.code;
    const normalized = typeof code === 'string' ? code.trim() : '';
    return normalized || null;
  } catch {
    return null;
  }
};
