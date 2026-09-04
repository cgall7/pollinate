import * as Linking from 'expo-linking';

// ENG-83 — the deep link half of passwordless auth. Supabase's magic-link
// email points at whatever URL `emailRedirectTo` named when the OTP was
// sent; this module is the one place that constructs that URL and the one
// place that recognises the app being reopened through it.
//
// `Linking.createURL` (not a hand-built `pollinate://...` string) matters
// for one reason: it resolves to the app's own scheme (`app.json`'s
// `expo.scheme`, "pollinate") in a standalone/EAS build, but to the running
// Metro dev server's `exp://host:port/--/...` shape under Expo Go / a dev
// client. A literal scheme string would 404 in dev and never round-trip a
// magic link on a device still being built against.
export const AUTH_CALLBACK_PATH = 'auth-callback';

export const getAuthRedirectUrl = () => Linking.createURL(AUTH_CALLBACK_PATH);

// True for the `exp://.../--/auth-callback?...` dev-client shape (Linking.parse
// folds the `--/` Expo Go separator away, so `path` is `auth-callback`) AND for
// the `pollinate://auth-callback?...` production shape. That second one does
// NOT arrive as `path`: pollinate:// is a non-special scheme, so WHATWG URL
// puts the first segment in `hostname`, and only a standalone/EAS build ever
// emits this shape (Expo Go always emits the exp:// form above). Falling back
// to hostname is what makes a magic link or invite-comb-open account-creation
// email actually complete sign-in outside of Expo Go — without it, the guard
// silently refuses the one URL shape a real build produces.
export const isAuthCallbackUrl = (url) => {
  if (!url) return false;
  try {
    const parsed = Linking.parse(url);
    const path = parsed.path ?? (parsed.hostname || null);
    return path === AUTH_CALLBACK_PATH;
  } catch {
    return false;
  }
};

// Supabase's client is built with `flowType: 'pkce'` (src/services/supabase.js),
// so the email link's query string carries `?code=...` — that's the shape
// `HoneycombStore.completeSessionFromUrl` expects back from this function.
// The `#access_token=...&refresh_token=...` fragment shape is the OLDER
// implicit-flow shape; it is parsed too, defensively, since a
// dashboard-side flow-type mismatch would otherwise fail silent rather than
// fail loud (Supabase logs a link's flow type at issue time, not at
// callback time).
export const parseAuthCallbackParams = (url) => {
  if (!url) return null;
  const { queryParams } = Linking.parse(url);
  if (queryParams?.code) return { code: queryParams.code };

  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return null;
  const fragment = new URLSearchParams(url.slice(hashIndex + 1));
  const access_token = fragment.get('access_token');
  const refresh_token = fragment.get('refresh_token');
  if (access_token && refresh_token) return { access_token, refresh_token };
  return null;
};
