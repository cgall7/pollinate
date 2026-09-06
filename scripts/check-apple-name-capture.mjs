// Gate for the defect Vector found on 2026-09-06 auditing the journeys:
// `Onboarding.js` requested `AppleAuthenticationScope.FULL_NAME`, Apple
// returned the name, and the app threw it away. `credential.fullName` was
// read by nobody — zero `fullName` / `givenName` / `familyName` anywhere in
// `src/` at `80ebf0ff`.
//
//   npm run check:apple-name-capture
//
// WHY THIS IS WORTH A GATE, AND WHY IT WENT UNCAUGHT FOR MONTHS
//
// Apple hands over `fullName` EXACTLY ONCE — at first authorization of this
// app by this Apple ID — and never again, on any device, with no API to
// re-request it. So the defect is:
//
//   * silent      — the sign-in succeeds, nothing errors, nothing logs;
//   * invisible   — `handle_new_user` supplies 'New user' and every surface
//                   that reads a name is gated on `isPlaceholderName`, so the
//                   app renders its polite fallback and looks correct;
//   * unrecoverable — by the time anyone notices, the payload is gone.
//
// And it does not stay cosmetic. `'New user'` freezes into
// `entries.author_name_at_seal` and `private_hives.contributor_names` at seal
// (the frozen-name class, `utils/placeholderName.js`). The end state is a
// printed keepsake signed by nobody.
//
// A missing argument is exactly the shape no existing gate can see: the call
// `signInWithApple(token, nonce)` is well-formed JavaScript, the suite was
// 89/89 green over it, and an absent argument has no line to flag.
//
// WHAT IT ASSERTS, AND IN WHICH REGISTER
//
// Section A EXECUTES `appleFullNameToDisplayName` (a pure module with no
// imports, so Node runs it directly) rather than matching its spelling.
//
// Section B LIFTS `adoptAppleName` out of `HoneycombStore.js` and runs it
// against a fake client. This is deliberate: the two properties that matter
// are both behavioural and both fail SILENTLY, so asserting their spelling
// would gate the wrong thing.
//
//   1. THE LADDER. self-chosen > organizer-typed > Apple > system default
//      (Lumen, 2026-09-06). A write that ignored the rung would rename a
//      person who had already chosen a name, and they would never be told.
//   2. IT NEVER THROWS. By the time it runs the person IS signed in, and
//      `handleAppleSignIn`'s catch renders "Apple sign-in failed. Try again."
//      A name write that escaped would tell a successfully authenticated user
//      their sign-in failed and invite them to repeat the one authorization
//      that would have carried the name — converting a lost name into a lost
//      name PLUS a lost account.
//
// Section C is lexical and covers only what is genuinely lexical: that the
// scope is still requested and the payload is still forwarded. It carries a
// MUST_CATCH fixture holding the original two-argument call, so the section
// proves it can still fail — a wiring assertion that cannot red is decoration.
//
// SCOPE OF THE CLAIM. This gate does not prove Apple actually populates
// `fullName`, that the profile row exists when the write lands, or that RLS
// permits the update. Those are server- and vendor-side and are covered by
// the same policy that already lets `CombInviteStore.saveNameAndJoin` write
// `profiles.display_name` for the calling user.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { appleFullNameToDisplayName } from '../src/utils/appleName.js';
import { isPlaceholderName } from '../src/utils/placeholderName.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let pass = 0;
const failures = [];
const ok = (label) => {
  pass += 1;
  console.log(`  ok   ${label}`);
};
const bad = (label, detail) => {
  failures.push(`${label} — ${detail}`);
  console.log(`  FAIL ${label}`);
};
const check = (label, actual, expected) => {
  if (Object.is(actual, expected)) ok(label);
  else bad(label, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};

const onboarding = await readFile(path.join(ROOT, 'src/screens/Onboarding.js'), 'utf8');
const store = await readFile(path.join(ROOT, 'src/services/HoneycombStore.js'), 'utf8');

// --- A. the name composer, executed -------------------------------------
console.log('\nA. appleFullNameToDisplayName');
check('both parts join with one space', appleFullNameToDisplayName({ givenName: 'Rosa', familyName: 'Okafor' }), 'Rosa Okafor');
check('given name alone survives', appleFullNameToDisplayName({ givenName: 'Rosa' }), 'Rosa');
check('family name alone survives', appleFullNameToDisplayName({ familyName: 'Okafor' }), 'Okafor');
check('a missing part leaves no double space', appleFullNameToDisplayName({ givenName: 'Rosa', familyName: null }), 'Rosa');
check('undefined payload is empty, not a crash', appleFullNameToDisplayName(undefined), '');
check('null payload is empty, not a crash', appleFullNameToDisplayName(null), '');
check('empty payload is empty', appleFullNameToDisplayName({}), '');
check('empty-string parts are empty', appleFullNameToDisplayName({ givenName: '', familyName: '' }), '');
// NEGATIVE CONTROL: a whitespace-only name must not become a stored name. It
// is a placeholder-class value wearing a non-placeholder value's clothes —
// `isPlaceholderName` classifies '' but a bare ' ' would sail past it.
check('whitespace-only parts collapse to empty', appleFullNameToDisplayName({ givenName: '  ', familyName: ' ' }), '');
// NEGATIVE CONTROL: nickName is not a name the person gave us.
check('nickName is not read', appleFullNameToDisplayName({ nickName: 'Ro' }), '');
// The composer's output must never itself be a placeholder, or the guard
// downstream is being asked a question about a value it will misclassify.
check(
  'a real composed name is not in the placeholder class',
  isPlaceholderName(appleFullNameToDisplayName({ givenName: 'Rosa', familyName: 'Okafor' })),
  false,
);

// --- B. adoptAppleName, lifted and executed ------------------------------
console.log('\nB. adoptAppleName behaviour (lifted from HoneycombStore.js)');
const lifted = /const adoptAppleName = (async \(client, userId, fullName\) => \{[\s\S]*?\n\});/.exec(store);
if (!lifted) {
  bad('adoptAppleName is liftable', 'could not locate `const adoptAppleName = async (client, userId, fullName) => {…}` in HoneycombStore.js — the gate cannot execute what it cannot find');
} else {
  ok('adoptAppleName is liftable');
  const warnings = [];
  let adoptAppleName = null;
  try {
    adoptAppleName = new Function(
      'appleFullNameToDisplayName',
      'isPlaceholderName',
      'console',
      `return (${lifted[1]});`,
    )(appleFullNameToDisplayName, isPlaceholderName, { warn: (...a) => warnings.push(a) });
    ok('the lifted source is constructible');
  } catch (err) {
    bad('the lifted source is constructible', `new Function threw ${err} — HoneycombStore.js's adoptAppleName did not survive extraction; section B asserted nothing`);
  }

  // A fake client recording what the function did. `select` answers with
  // whatever display_name the case under test says is already stored.
  const makeClient = ({ stored, selectError = null, updateError = null }) => {
    const writes = [];
    return {
      writes,
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: stored === undefined ? null : { display_name: stored }, error: selectError }) }),
        }),
        update: (patch) => ({ eq: async (_col, id) => { writes.push({ patch, id }); return { error: updateError }; } }),
      }),
    };
  };
  const APPLE = { givenName: 'Rosa', familyName: 'Okafor' };

  const run = async (label, opts, fullName, expectWrites, userId) => {
    if (!adoptAppleName) {
      bad(label, 'not run — the lift failed above');
      return;
    }
    warnings.length = 0;
    const client = makeClient(opts);
    let threw = null;
    try {
      await adoptAppleName(client, userId, fullName);
    } catch (err) {
      threw = err;
    }
    if (threw) {
      bad(label, `threw ${threw} — adoptAppleName must never throw; the caller's catch reports a failed sign-in`);
      return;
    }
    const got = client.writes.map((w) => w.patch.display_name);
    if (JSON.stringify(got) === JSON.stringify(expectWrites)) ok(label);
    else bad(label, `expected writes ${JSON.stringify(expectWrites)}, got ${JSON.stringify(got)}`);
  };

  // THE LADDER — the whole point of the guard.
  await run("adopts over 'New user' (handle_new_user's default)", { stored: 'New user' }, APPLE, ['Rosa Okafor'], 'u1');
  await run("adopts over '' (an unrepaired writer's leftover)", { stored: '' }, APPLE, ['Rosa Okafor'], 'u1');
  await run('adopts when the profile read returns no row', { stored: undefined }, APPLE, ['Rosa Okafor'], 'u1');
  await run('DOES NOT overwrite a self-chosen name', { stored: 'Ro' }, APPLE, [], 'u1');
  await run('DOES NOT overwrite an organizer-typed name', { stored: 'Rosa O.' }, APPLE, [], 'u1');

  // NO PAYLOAD, NO WRITE — the ordinary case on every sign-in after the first.
  await run('no write when Apple sent no name', { stored: 'New user' }, null, [], 'u1');
  await run('no write when Apple sent an empty name', { stored: 'New user' }, {}, [], 'u1');
  await run('no write when the name is whitespace only', { stored: 'New user' }, { givenName: ' ' }, [], 'u1');
  // A DEFAULT PARAMETER ON `userId` WOULD FIRE HERE, because `undefined` is
  // exactly the value under test — this row failed on the gate's first run
  // for that reason, having proved nothing about the code. `run` takes the id
  // explicitly for that one row's sake.
  await run('no write without a user id', { stored: 'New user' }, APPLE, [], undefined);

  // NEVER THROWS — both failure modes, separately, because they are two
  // different `throw` sites inside the try.
  await run('a failed profile read is swallowed', { stored: 'New user', selectError: new Error('rls') }, APPLE, [], 'u1');
  await run('a failed write is swallowed', { stored: 'New user', updateError: new Error('rls') }, APPLE, ['Rosa Okafor'], 'u1');
  // ...and it is swallowed LOUDLY. A silent swallow is how this whole class
  // of defect stays invisible; the warn is the only trace anyone gets.
  check('the swallowed failure is logged', warnings.length > 0, true);
}

// --- C. wiring, lexical, with a MUST_CATCH fixture ------------------------
console.log('\nC. wiring');
const REQUESTS_FULL_NAME = /AppleAuthentication\.AppleAuthenticationScope\.FULL_NAME/;
const FORWARDS_PAYLOAD = /signInWithApple\(\s*credential\.identityToken\s*,\s*rawNonce\s*,\s*credential\.fullName\s*\)/;
const STORE_ACCEPTS = /async signInWithApple\(identityToken, nonce, fullName\)/;
const STORE_ADOPTS = /await adoptAppleName\(client, data\?\.user\?\.id, fullName\)/;

check('Onboarding still requests the FULL_NAME scope', REQUESTS_FULL_NAME.test(onboarding), true);
check('Onboarding forwards credential.fullName to the store', FORWARDS_PAYLOAD.test(onboarding), true);
check('signInWithApple accepts the payload', STORE_ACCEPTS.test(store), true);
check('signInWithApple adopts the name with the signed-in user id', STORE_ADOPTS.test(store), true);
check('the guard is the shared placeholder class, not a local literal', /isPlaceholderName\(profile\?\.display_name\)/.test(store), true);
check('appleName is imported from the shared util', /import \{ appleFullNameToDisplayName \} from '\.\.\/utils\/appleName'/.test(store), true);

// MUST_CATCH: the exact code that shipped the defect. If the forwarding
// pattern above matches this, section C proves nothing.
const MUST_CATCH = "await HoneycombStore.signInWithApple(credential.identityToken, rawNonce);";
check('the original two-argument call would be caught', FORWARDS_PAYLOAD.test(MUST_CATCH), false);
check('the MUST_CATCH fixture is a real call site, not a typo', /signInWithApple\(/.test(MUST_CATCH), true);

// And the defect in its purest form: the payload named nowhere in src/.
check(
  'credential.fullName is read somewhere, which was the whole bug',
  /credential\.fullName/.test(onboarding),
  true,
);

console.log(`\ncheck-apple-name-capture: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
