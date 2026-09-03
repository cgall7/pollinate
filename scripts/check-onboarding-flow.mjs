// Gate for the zero-onboarding Account Gate.
//
// The approved 2026-09-03 direction retires the legacy multi-step flow
// instead of redesigning its steps. A signed-out user sees one Account Gate,
// authenticates, and lands directly on Today. Product nouns and name
// collection stay contextual to the objects/actions that need them.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { parse } from '@babel/parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let pass = 0;
const failures = [];
const ok = (label) => {
  pass += 1;
  console.log(`  ok   ${label}`);
};
const bad = (label, detail) => {
  failures.push(`${label} — ${detail}`);
  console.log(`  FAIL ${label} — ${detail}`);
};
const check = (label, actual, want) => {
  const a = JSON.stringify(actual);
  const w = JSON.stringify(want);
  if (a === w) ok(label);
  else bad(label, `got ${a}, want ${w}`);
};

const read = (rel) => readFile(path.join(ROOT, rel), 'utf8');
const ast = async (rel) =>
  parse(await read(rel), { sourceType: 'module', plugins: ['jsx', 'typescript'] });

const walk = (node, visit) => {
  if (!node || typeof node.type !== 'string') return;
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
    const value = node[key];
    if (Array.isArray(value)) value.forEach((c) => walk(c, visit));
    else if (value && typeof value.type === 'string') walk(value, visit);
  }
};

const bodyOfBinding = (tree, name) => {
  let found = null;
  walk(tree.program, (node) => {
    if (node.type !== 'VariableDeclarator') return;
    if (node.id?.type !== 'Identifier' || node.id.name !== name) return;
    const init = node.init;
    if (init?.type === 'ArrowFunctionExpression' || init?.type === 'FunctionExpression') {
      found = init.body;
    }
  });
  return found;
};

const callsMember = (subtree, objectName, propertyName) => {
  let found = false;
  walk(subtree, (node) => {
    if (node.type !== 'CallExpression') return;
    const callee = node.callee;
    if (callee?.type !== 'MemberExpression') return;
    if (callee.object?.type !== 'Identifier' || callee.object.name !== objectName) return;
    if (callee.property?.type !== 'Identifier' || callee.property.name !== propertyName) return;
    found = true;
  });
  return found;
};

const onboardingSrc = await read('src/screens/Onboarding.js');
const onboarding = await ast('src/screens/Onboarding.js');
const auth = await ast('src/contexts/AuthContext.js');

console.log('\n── A. legacy onboarding is retired, not redesigned ──');

const stepConsts = [];
const legacyBindings = [];
walk(onboarding.program, (node) => {
  if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier') {
    if (/^STEP_[A-Z]+$/.test(node.id.name)) stepConsts.push(node.id.name);
    if (/^(LandingStep|FirstEntryStep|CelebrationStep|WhoStep|AccountStep)$/.test(node.id.name)) {
      legacyBindings.push(node.id.name);
    }
  }
});

check('Onboarding.js declares no STEP_ beat constants', stepConsts, []);
check('legacy screen components are absent from Onboarding.js', legacyBindings, []);
check('Onboarding.js has no controller switch over beats', /SwitchStatement/.test(JSON.stringify(onboarding.program)), false);
check('Onboarding.js no longer imports PendingOnboardingWrites', /PendingOnboardingWrites/.test(onboardingSrc), false);
check('Onboarding.js no longer imports getDailyPrompt', /getDailyPrompt/.test(onboardingSrc), false);
check('Onboarding.js no longer imports HoneycombJourneyMap', /HoneycombJourneyMap/.test(onboardingSrc), false);
check('Onboarding.js no longer renders the old Begin CTA', />Begin</.test(onboardingSrc), false);
check('Onboarding.js no longer asks the pre-auth Who question', /Who's this year for\?/.test(onboardingSrc), false);
check('Onboarding.js no longer collects a pre-auth display name', /placeholder="Your name"/.test(onboardingSrc), false);

console.log('\n── B. Account Gate copy and actions ──');

for (const required of [
  'One good thing is enough.',
  'Write one line. Keep it private. Share only what you choose.',
  'Continue with Apple',
  'Use email instead',
  'Continue with email',
  'Email me a link',
  'Use password instead',
  'We’ll send a secure link. No password needed.',
  'Check your email.',
]) {
  check(`renders canonical copy: ${required}`, onboardingSrc.includes(required), true);
}

check(
  'withdrawn CTA is absent: Email me a secure link.',
  onboardingSrc.includes('Email me a secure link.'),
  false
);
check(
  'pre-save failure copy speaks of a line, not an entry',
  onboardingSrc.includes("Couldn't send the link. Your email is still here."),
  true
);

const primaryLabels = [...onboardingSrc.matchAll(/label:\s*busy \? '[^']+' : ([^,\n]+)/g)].map((m) => m[1].trim());
check(
  'each actionable auth state has exactly one primary label expression',
  primaryLabels,
  ["'Continue with Apple'", "emailPrimary ? 'Continue with email' : 'Email me a link'", "'Sign in'"]
);
const emailLinkStart = onboardingSrc.indexOf('if (emailLinkSent)');
const emailLinkEnd = onboardingSrc.indexOf('\n\n  return (', emailLinkStart + 1);
const emailLinkBlock = emailLinkStart >= 0 && emailLinkEnd > emailLinkStart
  ? onboardingSrc.slice(emailLinkStart, emailLinkEnd)
  : '';
check('walker control: email-link-sent wait-state block is found', emailLinkBlock.length > 0, true);
check('email-link-sent wait state renders no PrimaryButton', /<PrimaryButton/.test(emailLinkBlock), false);

console.log('\n── C. auth completion still routes through the app boundary ──');

const finishBody = bodyOfBinding(onboarding, 'finish');
check('finish resolves in Onboarding.js', !!finishBody, true);
if (finishBody) {
  check('finish marks onboarding complete for future cold starts', callsMember(finishBody, 'OnboardingState', 'markComplete'), true);
  let callsOnDone = false;
  walk(finishBody, (node) => {
    if (node.type === 'CallExpression' && node.callee?.type === 'Identifier' && node.callee.name === 'onDone') {
      callsOnDone = true;
    }
  });
  check('finish calls onDone so App.js owns Today/invite routing', callsOnDone, true);
}

for (const [handler, storeCall] of [
  ['handleAppleSignIn', 'signInWithApple'],
  ['handleEmailLink', 'signInWithOtp'],
  ['handlePasswordSignIn', 'signIn'],
  ['handleContinueAsDemo', 'signIn'],
]) {
  const body = bodyOfBinding(onboarding, handler);
  check(`${handler} resolves in Onboarding.js`, !!body, true);
  if (body) check(`${handler} calls HoneycombStore.${storeCall}`, callsMember(body, 'HoneycombStore', storeCall), true);
}

let authFlushSites = 0;
walk(auth.program, (node) => {
  if (node.type !== 'CallExpression') return;
  const c = node.callee;
  if (c?.type === 'MemberExpression' && c.object?.name === 'PendingOnboardingWrites' && c.property?.name === 'flush') {
    authFlushSites += 1;
  }
});
check('AuthContext still owns legacy durable-buffer flushing on session arrival', authFlushSites > 0, true);

console.log('\n── D. progressive disclosure and platform rules ──');

check('Apple availability is probed only on iOS', /if \(Platform\.OS !== 'ios'\) return;/.test(onboardingSrc), true);
check('Apple is sole primary only in the choice state', /const applePrimary = appleAvailable && mode === AUTH_CHOICE;/.test(onboardingSrc), true);
check('email is sole primary in the choice state when Apple is unavailable', /const emailPrimary = !appleAvailable && mode === AUTH_CHOICE;/.test(onboardingSrc), true);
check('password is a tertiary link, not an initial primary', /Use password instead/.test(onboardingSrc), true);
check('invite start opens the email-link state', /if \(startAt === 'invite'\) setMode\(AUTH_EMAIL_LINK\);/.test(onboardingSrc), true);
check('demo skip stays build-gated by DEMO_CONTENT', /\{DEMO_CONTENT && \(/.test(onboardingSrc), true);
check('demo login requires configured demo email inside the demo-only branch', /DEMO_CONTENT && \([\s\S]*DEMO_LOGIN_EMAIL && \(/.test(onboardingSrc), true);

console.log(`\ncheck-onboarding-flow: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
