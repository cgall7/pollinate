// Companion gate to check-link-parse-guard.mjs. That gate runs the two
// deep-link guards against a hand-written MODEL of expo-linking's `parse()`,
// because the real module can't load in plain Node. A model is a port: it is
// a claim about someone else's code, and it goes on being green after that
// code changes. This gate is the thing that can't:
//
//   npm run check:link-parse-differential
//
// It loads the ACTUAL `expo-linking@57.0.8` `build/createURL.js` — stubbing
// only its three unloadable leaf dependencies (`expo-constants`,
// `expo-modules-core`, `invariant`) at the `module.registerHooks` resolve
// seam, never `parse` itself — and asserts two things:
//
//   PART 1 (verdicts). The two production guards, imported unmodified and
//   wired to the REAL parse, return the same twelve answers
//   check-link-parse-guard.mjs asserts against the model — under BOTH
//   runtime regimes. This is the load-bearing half: it is a direct check
//   that the sibling gate's green verdict survives contact with the library.
//
//   PART 2 (fields). The model's output is diffed against the real one
//   field-by-field across the corpus below under both regimes, and the resulting
//   divergence set must equal EXACTLY the inventory below — the four classes
//   documented in check-link-parse-guard.mjs's header, no more and no fewer.
//   Equality, not a ceiling, in both directions on purpose:
//     · an EXTRA divergence is a fifth class the sibling gate's header does
//       not disclose, which is the drift a stubbed gate cannot see;
//     · a MISSING one is this gate's own positive control. If the real
//       module silently failed to load, or the regime proxy stopped
//       driving `hasCustomScheme()`/`isExpoHosted()`, the divergences would
//       thin out and a naive "no surprises" gate would report success. The
//       four classes ARE the evidence that the real library is on the other
//       side of the comparison, so their absence is a failure.
//
// RUNTIME REGIME IS PINNED, both of them. `hasCustomScheme()`'s final
// statement is a bare `return false`, so every executionEnvironment that is
// neither Bare nor Standalone lands in the Expo Go regime — which is the one
// that was GREEN on the original bug. A harness with an under-specified
// Constants stub therefore defaults to the passing regime and can assert a
// standalone-build fact it never exercised. Both regimes are driven
// explicitly here and every assertion below names which one it ran in.
//
// THE MODEL IS READ OUT OF ITS OWN FILE, not copied. `STUB_SOURCE` is
// extracted textually from check-link-parse-guard.mjs at run time, so an
// edit to the model is compared as edited. A second copy here would drift
// silently and this gate would be certifying its own paraphrase.
//
// Provenance: differential built and run by Vector, 2026-09-04, thread
// aea1615b; wired in as a gate at Fizz's ask in the same thread.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registerHooks } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (typeof registerHooks !== 'function') {
  console.error('Needs Node >= 22.15 for module.registerHooks(). Found ' + process.version);
  process.exit(1);
}

let pass = 0;
let fail = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? (pass += 1) : (fail += 1);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
};
const fatal = (msg) => {
  console.error(`check-link-parse-differential: ${msg}`);
  process.exit(1);
};

// ── The library under comparison ────────────────────────────────────────
// Pinned by version, deliberately. The four documented classes were measured
// against 57.0.8; a different version is not a licence to keep asserting
// them, it is the event this gate exists to catch. `package.json` pins
// `~57.0.8` and a lockfile exists, so `npm ci` cannot land here — a
// deliberate `npm update` or lockfile refresh can.
const LINK_DIR = path.join(ROOT, 'node_modules/expo-linking');
const MEASURED_VERSION = '57.0.8';
if (!fs.existsSync(path.join(LINK_DIR, 'build/createURL.js'))) {
  fatal(`expo-linking/build/createURL.js not found under ${LINK_DIR} — run \`npm ci\` first. This gate compares against the real module and has nothing to compare without it.`);
}
const installedVersion = JSON.parse(fs.readFileSync(path.join(LINK_DIR, 'package.json'), 'utf8')).version;
check(
  `V1 expo-linking installed version is the one the four documented classes were measured against (${MEASURED_VERSION})`,
  installedVersion,
  MEASURED_VERSION
);
if (installedVersion !== MEASURED_VERSION) {
  console.log(
    `\n    ^ Not automatically a defect — but the class inventory below and\n` +
      `      check-link-parse-guard.mjs's header both describe ${MEASURED_VERSION}'s parse().\n` +
      `      Re-run this gate's PART 2 output, re-document the classes in BOTH\n` +
      `      files, and bump MEASURED_VERSION in the same commit.`
  );
}

// ── The model under test, read out of the sibling gate ───────────────────
const SIBLING = path.join(ROOT, 'scripts/check-link-parse-guard.mjs');
const siblingSrc = fs.readFileSync(SIBLING, 'utf8');
const m = /const STUB_SOURCE = `([\s\S]*?)`;\n/.exec(siblingSrc);
if (!m) {
  fatal(
    'could not extract `const STUB_SOURCE = `...`;` from scripts/check-link-parse-guard.mjs. ' +
      'The model moved or was renamed. Fix the extraction here rather than copying the model — ' +
      'a copy would let the two drift apart silently, which is the whole failure this gate exists to prevent.'
  );
}
const rawStub = m[1];
if (rawStub.includes('${') || rawStub.includes('`')) {
  fatal('the extracted STUB_SOURCE contains a template substitution or a backtick; the un-escaping below is no longer safe. Extract it a different way.');
}
// The sibling holds the model as a template literal, so the bytes on disk are
// escaped source (`\\/` for `\/`). Evaluating the literal is what recovers the
// exact string that file feeds to its own loader — reading the raw bytes would
// compare against a DIFFERENT program that merely looks the same.
// eslint-disable-next-line no-new-func
const STUB_SOURCE = new Function('return `' + rawStub + '`')();

// ── Regimes ──────────────────────────────────────────────────────────────
const REGIMES = {
  'expo-go': {
    executionEnvironment: 'storeClient',
    expoConfig: { hostUri: '192.168.1.5:19000', scheme: 'pollinate' },
    expoGoConfig: { developer: { tool: 'expo-cli' } },
    linkingUri: 'exp://192.168.1.5:19000/--/',
  },
  standalone: {
    executionEnvironment: 'standalone',
    expoConfig: { scheme: 'pollinate' },
    expoGoConfig: undefined,
    linkingUri: 'pollinate://',
    manifest: { scheme: 'pollinate' },
  },
};
// Read through a Proxy rather than swapped as a module: `hasCustomScheme()`
// and `isExpoHosted()` consult Constants on every call, so the regime has to
// be live, not frozen at import.
const CONSTANTS_STUB = `
export const ExecutionEnvironment = { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' };
export default new Proxy({}, { get: (_t, k) => globalThis.__LINK_REGIME?.[k] });
`;
const CORE_STUB = `export const Platform = { OS: 'ios', select: (o) => o.ios ?? o.default };`;
const INVARIANT_STUB = `export default (cond, msg) => { if (!cond) throw new Error(msg); };`;

registerHooks({
  resolve(spec, ctx, next) {
    if (spec === 'expo-constants') return { url: 'link-diff:expo-constants', shortCircuit: true };
    if (spec === 'expo-modules-core') return { url: 'link-diff:expo-modules-core', shortCircuit: true };
    if (spec === 'invariant') return { url: 'link-diff:invariant', shortCircuit: true };
    // The guards import `expo-linking` by bare specifier. Its index pulls in
    // native bindings; only `parse` is needed, and it must be the REAL one —
    // so the bare specifier resolves to a shim that re-exports it.
    if (spec === 'expo-linking') return { url: 'link-diff:expo-linking', shortCircuit: true };
    if (spec === 'link-diff:model') return { url: 'link-diff:model', shortCircuit: true };
    // expo-linking's build/ is ESM with extensionless relative specifiers.
    if (spec.startsWith('./') && ctx.parentURL?.includes('expo-linking') && !spec.endsWith('.js')) {
      return next(spec + '.js', ctx);
    }
    return next(spec, ctx);
  },
  load(url, ctx, next) {
    if (url === 'link-diff:expo-constants') return { format: 'module', source: CONSTANTS_STUB, shortCircuit: true };
    if (url === 'link-diff:expo-modules-core') return { format: 'module', source: CORE_STUB, shortCircuit: true };
    if (url === 'link-diff:invariant') return { format: 'module', source: INVARIANT_STUB, shortCircuit: true };
    if (url === 'link-diff:model') return { format: 'module', source: STUB_SOURCE, shortCircuit: true };
    if (url === 'link-diff:expo-linking') {
      const real = pathToFileURL(path.join(LINK_DIR, 'build/createURL.js')).href;
      return {
        format: 'module',
        source: `export { parse, createURL } from ${JSON.stringify(real)};`,
        shortCircuit: true,
      };
    }
    return next(url, ctx);
  },
});

const realModule = await import(pathToFileURL(path.join(LINK_DIR, 'build/createURL.js')).href);
const modelModule = await import('link-diff:model');
const realParse = realModule.parse;
const modelParse = modelModule.parse;

// The guards, unmodified, wired to the REAL parse via the shim above.
const { isAuthCallbackUrl, parseAuthCallbackParams } = await import(
  pathToFileURL(path.join(ROOT, 'src/services/authLinking.js')).href
);
const { parseCombInviteUrl } = await import(
  pathToFileURL(path.join(ROOT, 'src/services/combInviteLinking.js')).href
);

const inRegime = (name, fn) => {
  globalThis.__LINK_REGIME = REGIMES[name];
  try {
    return fn();
  } finally {
    globalThis.__LINK_REGIME = undefined;
  }
};

// ════════════════════════════════════════════════════════════════════════
// PART 1 — verdict differential.
// The same twelve assertions check-link-parse-guard.mjs makes against the
// model, re-made against the real library, once per regime. A drift in
// upstream `parse()` that changes any guard answer reds HERE, which is the
// answer the sibling gate is actually certifying.
// ════════════════════════════════════════════════════════════════════════
console.log('\n── PART 1: production guards vs the REAL expo-linking parse ──');
for (const regime of ['expo-go', 'standalone']) {
  const R = (label, got, want) => check(`[${regime}] ${label}`, got, want);
  inRegime(regime, () => {
    R('A1 pollinate:// production shape is the auth callback', isAuthCallbackUrl('pollinate://auth-callback?code=abc123'), true);
    R('A3 https:// shape is the auth callback', isAuthCallbackUrl('https://pollinateapp.xyz/auth-callback?code=abc123'), true);
    R('A4 a different pollinate:// path is NOT the auth callback', isAuthCallbackUrl('pollinate://comb-invite?code=abc123'), false);
    R('A5 empty url is false, not a throw', isAuthCallbackUrl(''), false);
    R('A6 pollinate:// production shape yields the PKCE code', parseAuthCallbackParams('pollinate://auth-callback?code=abc123'), { code: 'abc123' });
    R('C1 pollinate:// production shape resolves the invite code', parseCombInviteUrl('pollinate://comb-invite?code=xyz789'), 'xyz789');
    R('C3 https:// shape resolves the invite code', parseCombInviteUrl('https://pollinateapp.xyz/comb-invite?code=xyz789'), 'xyz789');
    R('C4 a different pollinate:// path yields no invite code', parseCombInviteUrl('pollinate://auth-callback?code=xyz789'), null);
    R('C5 empty url is null, not a throw', parseCombInviteUrl(''), null);
    R('C6 a whitespace-only code fails closed to null', parseCombInviteUrl('pollinate://comb-invite?code=%20%20'), null);
  });
}
// A2/C2 are the `exp://` dev-client shapes, and they are regime-SPECIFIC by
// construction rather than regime-invariant: the `--/` fold the sibling gate's
// model applies unconditionally is gated upstream on
// `isExpoHosted() && !hasCustomScheme()`. Asserted only where an `exp://` URL
// can actually be delivered — Expo Go — because a standalone build is never
// handed one. Asserting them in both regimes is precisely the mistake an
// unpinned harness makes.
inRegime('expo-go', () => {
  check('[expo-go] A2 exp://.../--/ dev-client shape is the auth callback', isAuthCallbackUrl('exp://192.168.1.5:19000/--/auth-callback?code=abc123'), true);
  check('[expo-go] C2 exp://.../--/ dev-client shape resolves the invite code', parseCombInviteUrl('exp://192.168.1.5:19000/--/comb-invite?code=xyz789'), 'xyz789');
});

// ════════════════════════════════════════════════════════════════════════
// PART 2 — field differential, model vs real.
// ════════════════════════════════════════════════════════════════════════
const CORPUS = [
  'pollinate://auth-callback?code=abc',
  'pollinate://comb-invite?code=xyz789',
  'pollinate://comb-invite',
  'exp://192.168.1.5:19000/--/auth-callback?code=abc',
  'exp://192.168.1.5:19000/--/comb-invite?code=xyz789',
  'https://pollinateapp.xyz/comb-invite?code=xyz789',
  'https://pollinateapp.xyz/auth-callback?code=abc',
  'https://pollinateapp.xyz/a+comb-invite',
  'pollinate://auth-callback#access_token=t&refresh_token=r',
  'pollinate://comb-invite?code=%20%20',
  'pollinate://COMB-INVITE?code=x',
  'pollinate:///comb-invite?code=x',
  'pollinate://comb-invite/?code=x',
  'pollinate://comb-invite?code=x&code=y',
  'exp://192.168.1.5:19000/--/comb-invite/sub?code=x',
  'https://pollinateapp.xyz/comb-invite/?code=x',
  // Uppercase under a SPECIAL scheme, so the segment actually reaches `path`
  // rather than the opaque host — without it, a casing change in the model's
  // path handling is invisible to this corpus (measured: it was).
  'https://pollinateapp.xyz/COMB-INVITE?code=x',
  'auth-callback',
  'comb-invite?code=x',
  'pollinate://comb-invite?code=a%2Fb',
];
const FIELDS = ['path', 'hostname', 'queryParams', 'scheme'];

// The four classes documented in check-link-parse-guard.mjs's header, as an
// inventory of `<regime> | <url> | <field>` rows. Set equality is asserted
// against this in both directions; see the header.
const CLASS_OF = {
  1: "`--/` fold is conditional upstream (isExpoHosted() && !hasCustomScheme()), unconditional in the model",
  2: '`hostname` is nulled by that same upstream fold, kept by the model',
  3: "upstream `else if (path.indexOf('+') > -1)` truncation, unmodelled",
  4: '`catch { path = url }` upstream gives a schemeless string a path; the model throws',
};
const EXPECTED = {
  'expo-go | exp://192.168.1.5:19000/--/auth-callback?code=abc | hostname': 2,
  'expo-go | exp://192.168.1.5:19000/--/comb-invite?code=xyz789 | hostname': 2,
  'expo-go | exp://192.168.1.5:19000/--/comb-invite/sub?code=x | hostname': 2,
  'expo-go | https://pollinateapp.xyz/a+comb-invite | path': 3,
  'expo-go | auth-callback | path': 4,
  'expo-go | auth-callback | THROW': 4,
  'expo-go | comb-invite?code=x | path': 4,
  'expo-go | comb-invite?code=x | THROW': 4,
  'standalone | exp://192.168.1.5:19000/--/auth-callback?code=abc | path': 1,
  'standalone | exp://192.168.1.5:19000/--/comb-invite?code=xyz789 | path': 1,
  'standalone | exp://192.168.1.5:19000/--/comb-invite/sub?code=x | path': 1,
  'standalone | https://pollinateapp.xyz/a+comb-invite | path': 3,
  'standalone | auth-callback | path': 4,
  'standalone | auth-callback | THROW': 4,
  'standalone | comb-invite?code=x | path': 4,
  'standalone | comb-invite?code=x | THROW': 4,
};

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const observed = new Set();
let compared = 0;
for (const regime of ['expo-go', 'standalone']) {
  for (const url of CORPUS) {
    compared += 1;
    inRegime(regime, () => {
      let R;
      let S;
      let rThrew = false;
      let sThrew = false;
      try {
        R = realParse(url);
      } catch {
        rThrew = true;
      }
      try {
        S = modelParse(url);
      } catch {
        sThrew = true;
      }
      if (rThrew !== sThrew) observed.add(`${regime} | ${url} | THROW`);
      if (rThrew || sThrew) {
        // One side has no fields to compare. The `path` row is still recorded
        // where the surviving side produced one, so class 4 shows both of its
        // halves rather than collapsing to a bare throw mismatch.
        const survivor = rThrew ? null : R;
        if (survivor && survivor.path != null) observed.add(`${regime} | ${url} | path`);
        return;
      }
      for (const f of FIELDS) {
        if (!eq(R?.[f], S?.[f])) observed.add(`${regime} | ${url} | ${f}`);
      }
    });
  }
}

console.log(`\n── PART 2: model vs REAL parse, ${CORPUS.length} shapes × 2 regimes = ${compared} pairs ──`);
const expectedKeys = Object.keys(EXPECTED).sort();
const observedKeys = [...observed].sort();
const unexpected = observedKeys.filter((k) => !(k in EXPECTED));
const missing = expectedKeys.filter((k) => !observed.has(k));

check(
  `D1 no divergence outside the four documented classes (a fifth class is upstream drift the sibling gate cannot see)`,
  unexpected,
  []
);
check(
  `D2 every documented divergence still fires — the positive control that the REAL module is on the other side of this comparison`,
  missing,
  []
);
if (unexpected.length || missing.length) {
  console.log('\n    observed divergence set:');
  for (const k of observedKeys) console.log(`      ${k}${k in EXPECTED ? ` (class ${EXPECTED[k]})` : '  <-- UNEXPECTED'}`);
  for (const k of missing) console.log(`      ${k} (class ${EXPECTED[k]})  <-- EXPECTED BUT ABSENT`);
  console.log('\n    the four documented classes:');
  for (const [n, desc] of Object.entries(CLASS_OF)) console.log(`      ${n}. ${desc}`);
}

// Every class must be represented, not just the row count. A class whose only
// row was deleted from the corpus stops being tested without changing a count.
for (const [n, desc] of Object.entries(CLASS_OF)) {
  const rows = expectedKeys.filter((k) => EXPECTED[k] === Number(n));
  check(`D3.${n} class ${n} (${desc}) is exercised by at least one corpus row`, rows.length > 0, true);
}

console.log(`\ncheck-link-parse-differential: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
