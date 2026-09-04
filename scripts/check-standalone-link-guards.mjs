// Behavioural gate for combInviteLinking.js's parseCombInviteUrl and
// authLinking.js's isAuthCallbackUrl — the two `Linking.parse(url).path`
// guards that silently refused every `pollinate://...` link in a standalone
// build (Vector/Sage, thread 2df4f4dc, 2026-09-04).
//
// pollinate:// is a non-special WHATWG scheme, so `new URL(...)` puts the
// first path segment in `hostname`, not `pathname` — `path` only comes back
// populated for `https://...` links and for the Expo-Go-only `exp://.../--/`
// dev-client shape, whose fold depends on `hasCustomScheme()`/
// `isExpoHosted()` reading the ACTUAL runtime regime. A gate that only reads
// the two modules' source text (`check-comb-invite-client.mjs`'s I1) cannot
// see this: `parseCombInviteUrl` is never called there, and the defect is in
// what a real `Linking.parse` call returns, not in the modules' spelling.
//
// So this gate executes the real modules against the real, installed
// `expo-linking`, varying only the runtime regime (StoreClient / Standalone
// / Bare) via a stubbed `expo-constants` — see lib/expo-link-stubs/ for why
// that needs a module resolution hook instead of a plain `await import()`.
import { register } from 'node:module';

register(new URL('./lib/expo-link-stubs/hooks.mjs', import.meta.url).href);
globalThis.__DEV__ = false;

const R = new URL('../', import.meta.url);
const combInvite = await import(new URL('src/services/combInviteLinking.js', R).href);
const authLinking = await import(new URL('src/services/authLinking.js', R).href);

let passed = 0;
let failed = 0;
const check = (condition, label) => {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${label}`);
  }
};

const APP_CONFIG = { scheme: 'pollinate', ios: { bundleIdentifier: 'xyz.pollinateapp.ios' } };

// Three real runtime regimes `expo-linking` distinguishes by reading
// `Constants.executionEnvironment` — see Schemes.js `hasCustomScheme()`.
// StoreClient (Expo Go) is the ONLY regime the app has ever actually been
// exercised in; Standalone/Bare are the two nobody had run this code under
// until this gate existed.
const REGIMES = {
  'StoreClient (Expo Go)': {
    env: 'storeClient',
    config: { ...APP_CONFIG, hostUri: '192.168.1.5:8081' },
    goConfig: { developer: { tool: 'expo-cli' } },
    linkingUri: 'exp://192.168.1.5:8081/--/',
  },
  'Standalone (TestFlight / App Store)': {
    env: 'standalone',
    config: APP_CONFIG,
    goConfig: undefined,
    linkingUri: undefined,
  },
  Bare: {
    env: 'bare',
    config: APP_CONFIG,
    goConfig: undefined,
    linkingUri: undefined,
  },
};

const setRegime = (name) => {
  const r = REGIMES[name];
  globalThis.__LINK_STUB_ENV__ = r.env;
  globalThis.__LINK_STUB_CONFIG__ = r.config;
  globalThis.__LINK_STUB_GOCONFIG__ = r.goConfig;
  globalThis.__LINK_STUB_LINKINGURI__ = r.linkingUri;
};

// ── Literal-shape matrix ───────────────────────────────────────────────
//
// Asserted on LITERAL input strings, deliberately, not on
// `parse(createURL(...))` round-trips: three of these four shapes are
// regime-invariant, so a literal-input gate catches the regression no
// matter how the regime stub is configured. A round-trip assertion is not —
// it is green under StoreClient and red under Standalone, and StoreClient
// is exactly the regime an under-specified stub defaults into
// (`hasCustomScheme()`'s fallthrough is a bare `return false`). The
// round-trip is still asserted below, but with the regime pinned explicitly
// per case, not left to that default.
//
// The https:// row is a POSITIVE CONTROL: it must return the code in every
// regime, unaffected by this fix. Without it, a broken harness (wrong stub
// field, hook misconfigured) and a real regression both present as
// universal `null` — indistinguishable without one shape that is known-good.
const COMB_INVITE_SHAPES = [
  ['pollinate://comb-invite?code=ABC123', { 'StoreClient (Expo Go)': 'ABC123', 'Standalone (TestFlight / App Store)': 'ABC123', Bare: 'ABC123' }],
  ['pollinate:///comb-invite?code=ABC123', { 'StoreClient (Expo Go)': 'ABC123', 'Standalone (TestFlight / App Store)': 'ABC123', Bare: 'ABC123' }],
  ['https://pollinateapp.xyz/comb-invite?code=ABC123', { 'StoreClient (Expo Go)': 'ABC123', 'Standalone (TestFlight / App Store)': 'ABC123', Bare: 'ABC123' }],
  ['exp://192.168.1.5:8081/--/comb-invite?code=ABC123', { 'StoreClient (Expo Go)': 'ABC123', 'Standalone (TestFlight / App Store)': null, Bare: null }],
];

const AUTH_CALLBACK_SHAPES = [
  ['pollinate://auth-callback?code=XYZ789', { 'StoreClient (Expo Go)': true, 'Standalone (TestFlight / App Store)': true, Bare: true }],
  ['pollinate:///auth-callback?code=XYZ789', { 'StoreClient (Expo Go)': true, 'Standalone (TestFlight / App Store)': true, Bare: true }],
  ['https://pollinateapp.xyz/auth-callback?code=XYZ789', { 'StoreClient (Expo Go)': true, 'Standalone (TestFlight / App Store)': true, Bare: true }],
  ['exp://192.168.1.5:8081/--/auth-callback?code=XYZ789', { 'StoreClient (Expo Go)': true, 'Standalone (TestFlight / App Store)': false, Bare: false }],
];

for (const regimeName of Object.keys(REGIMES)) {
  setRegime(regimeName);

  for (const [url, expectedByRegime] of COMB_INVITE_SHAPES) {
    const expected = expectedByRegime[regimeName];
    const actual = combInvite.parseCombInviteUrl(url);
    check(actual === expected, `[${regimeName}] parseCombInviteUrl(${url}) -> ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
  }

  for (const [url, expectedByRegime] of AUTH_CALLBACK_SHAPES) {
    const expected = expectedByRegime[regimeName];
    const actual = authLinking.isAuthCallbackUrl(url);
    check(actual === expected, `[${regimeName}] isAuthCallbackUrl(${url}) -> ${actual} (expected ${expected})`);
  }

  // Writer round-trip, regime pinned explicitly (not the round-trip trap
  // described above): the app's own emitted URL must parse back in every
  // regime, since `getCombInviteUrl`/`getAuthRedirectUrl` are what
  // CombInvite.js and Onboarding.js actually send.
  const emittedInvite = combInvite.getCombInviteUrl('ABC123');
  check(
    combInvite.parseCombInviteUrl(emittedInvite) === 'ABC123',
    `[${regimeName}] round-trip: parseCombInviteUrl(getCombInviteUrl('ABC123')) === 'ABC123' (emitted ${emittedInvite})`
  );

  const emittedAuth = authLinking.getAuthRedirectUrl();
  check(
    authLinking.isAuthCallbackUrl(emittedAuth) === true,
    `[${regimeName}] round-trip: isAuthCallbackUrl(getAuthRedirectUrl()) === true (emitted ${emittedAuth})`
  );
}

// ── Catch-branch coverage, regime-independent ──────────────────────────
setRegime('Standalone (TestFlight / App Store)');
check(combInvite.parseCombInviteUrl(null) === null, 'parseCombInviteUrl(null) -> null, no throw');
check(combInvite.parseCombInviteUrl('not a url at all') === null, 'parseCombInviteUrl(malformed) -> null via catch, no throw');
check(authLinking.isAuthCallbackUrl(null) === false, 'isAuthCallbackUrl(null) -> false, no throw');
check(authLinking.isAuthCallbackUrl('not a url at all') === false, 'isAuthCallbackUrl(malformed) -> false via catch, no throw');

console.log(`\ncheck-standalone-link-guards: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
