// Gate for the two deep-link guards Vector found dark in a real build
// (thread f2c15b7d, 2026-09-04): `src/services/authLinking.js`'s
// `isAuthCallbackUrl` and `src/services/combInviteLinking.js`'s
// `parseCombInviteUrl`.
//
//   npm run check:link-parse-guard
//
// THE BUG, in one fact: WHATWG `URL` parsing treats a non-special (custom)
// scheme's `//xyz` as an opaque HOST, not a path. `new
// URL('pollinate://auth-callback').pathname` is `''`; the value lands in
// `.hostname` instead. `expo-linking`'s own `parse()` copies that straight
// through (`path = parsed.pathname || null`), so on a real device build —
// where the app opens via `pollinate://...`, never `exp://` or `https://` —
// both guards compared `parsed.path` against a literal that was always
// `null`. Neither is reachable from Expo Go, which resolves through
// `exp://host:port/--/...` instead and puts the value in `path` correctly —
// exactly why nothing caught it before a real build existed.
//
// RUN THE REAL MODULES. `authLinking.js` and `combInviteLinking.js` are
// imported and executed unmodified; their one dependency (`expo-linking`)
// can't load in plain Node (it pulls in `expo-modules-core`'s native
// bindings), so it is stubbed at RESOLVE time via the same registerHooks
// seam check-seeds-contract.mjs already uses.
//
// THE STUB'S `parse` IS A MODEL, NOT A COPY. It reproduces
// expo-linking@57.0.8's `parse()` exactly on every URL this gate asserts —
// differentially checked field-by-field against the real module under both
// runtime regimes (Vector, thread f2c15b7d, 2026-09-04). `queryParams` is
// exact everywhere (that block is character-identical to the library's).
// `path` and `hostname` diverge in four measured places, ALL outside the
// asserted set, none of them reachable from `Linking.getInitialURL()` or
// the 'url' event — so no verdict below depends on one, but a future case
// in that territory needs the real library, not this stub:
//
//   1. `path` — the `--/` dev-client fold is UNCONDITIONAL here. The real
//      one is `isExpoHosted() && !hasCustomScheme() && startsWith(prefix)`,
//      with the prefix derived from `Constants.expoConfig.hostUri`, not the
//      literal '--/'. So A2/C2 assert the Expo Go regime's answer; the real
//      parse in a standalone build leaves `exp://h:19000/--/x` as '--/x'.
//      Harmless — an `exp://` URL is only ever delivered TO Expo Go — but
//      it means THIS GATE HAS NO RUNTIME REGIME and cannot be used to
//      reason about one.
//   2. `hostname` — the real fold also sets it to null; this stub leaves
//      the Metro host in place. Same verdict (path matches either way).
//   3. `path` — the real `parse` has an `else if (path.indexOf('+') > -1)`
//      truncation. Not modelled: real resolves `https://h/a+comb-invite` to
//      'comb-invite' (guard TRUE), this stub to 'a+comb-invite' (FALSE).
//   4. `path` — the real `parse` wraps `new URL(url)` in `catch { path =
//      url }`, so a bare 'auth-callback' yields path='auth-callback' (guard
//      TRUE). Here the TypeError escapes into each guard's own catch
//      (FALSE).
//
// RESIDUAL, stated because a green run does not cover it: a gate that stubs
// the dependency cannot see the dependency change. The bug this file exists
// for is a property of expo-linking's `parse`; package.json pins `~57.0.8`;
// a patch bump altering custom-scheme handling would land green here,
// because this tests our port of the parser rather than theirs. What
// absorbs that is the guards' own shape — `path === LITERAL || hostname ===
// LITERAL` keeps working whichever field upstream decides to fill.
//
// The stub does NOT model `createURL`'s Expo-hosted/hostUri branching
// either — this gate never calls `createURL`, only the parse-side guards.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registerHooks } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (typeof registerHooks !== 'function') {
  console.error('Needs Node >= 22.15 for module.registerHooks(). Found ' + process.version);
  process.exit(1);
}

const STUB_SOURCE = `
export const parse = (url) => {
  const parsed = new URL(url);
  const queryParams = {};
  parsed.searchParams.forEach((value, key) => {
    queryParams[key] = decodeURIComponent(value);
  });
  let path = parsed.pathname || null;
  if (path) {
    path = path.replace(/^\\//, '');
    // The Expo Go dev-client shape (exp://host:port/--/<path>) folds its
    // '--/' separator away — see authLinking.js's own header comment.
    if (path.startsWith('--/')) path = path.slice(3);
  }
  const hostname = parsed.hostname || null;
  let scheme = parsed.protocol || null;
  if (scheme) scheme = scheme.substring(0, scheme.length - 1);
  return { path, hostname, queryParams, scheme };
};
export const createURL = () => {
  throw new Error('link-parse-stub: createURL is not modelled — this gate only exercises the parse-side guards');
};
`;

registerHooks({
  resolve(spec, ctx, next) {
    if (spec === 'expo-linking') return { url: 'link-parse-stub:expo-linking', shortCircuit: true };
    return next(spec, ctx);
  },
  load(url, ctx, next) {
    if (url === 'link-parse-stub:expo-linking') {
      return { format: 'module', source: STUB_SOURCE, shortCircuit: true };
    }
    return next(url, ctx);
  },
});

const { isAuthCallbackUrl, parseAuthCallbackParams } = await import(
  pathToFileURL(path.join(ROOT, 'src/services/authLinking.js')).href
);
const { parseCombInviteUrl } = await import(
  pathToFileURL(path.join(ROOT, 'src/services/combInviteLinking.js')).href
);

let pass = 0;
let fail = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? (pass += 1) : (fail += 1);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
};

// ── isAuthCallbackUrl — the magic-link / account-creation guard ─────────
// The production shape: this is the ONE that was silently false before the
// fix, on every real build, for every magic-link tap.
check(
  'A1 pollinate:// production shape is recognised as the auth callback',
  isAuthCallbackUrl('pollinate://auth-callback?code=abc123'),
  true
);
check(
  'A2 exp://.../--/ Expo Go dev-client shape is still recognised',
  isAuthCallbackUrl('exp://192.168.1.5:19000/--/auth-callback?code=abc123'),
  true
);
check(
  'A3 https:// web-reveal shape is still recognised',
  isAuthCallbackUrl('https://pollinateapp.xyz/auth-callback?code=abc123'),
  true
);
check(
  'A4 a different pollinate:// path (comb-invite) is NOT the auth callback',
  isAuthCallbackUrl('pollinate://comb-invite?code=abc123'),
  false
);
check('A5 empty/undefined url is false, not a throw', isAuthCallbackUrl(''), false);

// ── parseAuthCallbackParams — must actually read `code` off the shape
//    isAuthCallbackUrl just certified ─────────────────────────────────────
check(
  'A6 pollinate:// production shape yields the PKCE code',
  parseAuthCallbackParams('pollinate://auth-callback?code=abc123'),
  { code: 'abc123' }
);

// ── parseCombInviteUrl — the invite-link guard ───────────────────────────
check(
  'C1 pollinate:// production shape resolves the invite code',
  parseCombInviteUrl('pollinate://comb-invite?code=xyz789'),
  'xyz789'
);
check(
  'C2 exp://.../--/ Expo Go dev-client shape still resolves the invite code',
  parseCombInviteUrl('exp://192.168.1.5:19000/--/comb-invite?code=xyz789'),
  'xyz789'
);
check(
  'C3 https:// shape still resolves the invite code',
  parseCombInviteUrl('https://pollinateapp.xyz/comb-invite?code=xyz789'),
  'xyz789'
);
check(
  'C4 a different pollinate:// path (auth-callback) yields no invite code',
  parseCombInviteUrl('pollinate://auth-callback?code=xyz789'),
  null
);
check('C5 empty/undefined url is null, not a throw', parseCombInviteUrl(''), null);
check(
  'C6 a code that is only whitespace still fails closed to null',
  parseCombInviteUrl('pollinate://comb-invite?code=%20%20'),
  null
);

console.log(`\ncheck-link-parse-guard: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
