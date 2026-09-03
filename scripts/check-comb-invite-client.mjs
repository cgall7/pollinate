import fs from 'node:fs';
import { parse } from '@babel/parser';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('App.js');
const screen = read('src/screens/CombInvite.js');
const store = read('src/services/CombInviteStore.js');
const onboarding = read('src/screens/Onboarding.js');
const linking = read('src/services/combInviteLinking.js');

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

check(/COMB_INVITE_PATH = 'comb-invite'/.test(linking) && /queryParams: \{ code: inviteCode \}/.test(linking), 'I1 invite links have one path and one code parameter');
check(/Linking\.getInitialURL\(\)/.test(app) && /Linking\.addEventListener\('url'/.test(app), 'I2 cold and warm invite links share the App listener');
check(/PendingCombInvite\.set\(inviteCode\)/.test(screen) && /PendingCombInvite\.get\(\)/.test(app) && /navigation\.replace\('CombInvite'/.test(app), 'I3 invite code is persisted only when user explicitly continues the invite');
check(!/PendingCombInvite\.set/.test(app), 'I3b no legacy invite code persistence in App aside from initial routing');
check(/comb_preview_by_invite_code/.test(store) && /if \(!row\) return null/.test(store), 'I4 landing uses the anon preview and fails closed');
check(/memberCount >= 3/.test(screen) && /people are in this comb/.test(screen), 'I5 landing count is membership copy and suppressed below three');
check(/stays sealed until delivery/.test(screen) && /only \{preview\.subjectName\} ever reads it/.test(screen), 'I6 entry disclosure precedes the join action');
check(
  screen.includes('isPlaceholderName(profile?.display_name)') &&
    screen.includes('setNeedsName(isPlaceholderName(profile?.display_name))') &&
    screen.includes('await CombInviteStore.saveNameAndJoin(inviteCode, needsName ? name : undefined);') &&
    store.includes("profiles').update({ display_name: name })") &&
    store.includes('if (name)') &&
    store.includes('comb_join_by_invite_code'),
  'I7 name persistence is gated on successful placeholder-class read and fused with join'
);
check(screen.includes("joinerProfileState !== 'succeeded'") && /setNeedsName/.test(screen), 'I8 profile readiness blocks submit until profile read succeeds');
check(/\.from\('comb_rotations'\)/.test(store) && /\.is\('sealed_at', null\)/.test(store) && /\.is\('voided_at', null\)/.test(store), 'I9 successful join resolves the open rotation');

// ── I10 · invite auth path offers no pre-session advance ─────────────────
//
// Ruled by Lumen (2026-09-03) after the Account Gate rewrite deleted the
// mechanism the original row pinned. The row's CLAIM is unchanged — the
// invite path cannot offer an advance before a session exists — but the
// carrier changed completely: `waitForSession` and the guarded `Continue`
// button are gone, and the only generic advance is now the `[session]`-keyed
// effect. Repointing a literal here would have been a label change wearing a
// repair's name, so the row is rebuilt as three conjuncts plus a census.
//
// The census is AST-based, not textual, for one concrete reason: `finish`
// occurs inside rendered copy at Onboarding.js's email-link helper ("Tap the
// link on this device to finish"), so a `\bfinish\b` count over source text
// scores a string as a call site.
//
// TWO THINGS THIS ROW DOES NOT CLAIM, named so a future red is debugged
// against the right property:
//
//   1. The three handler `finish()`es fire on sign-in SUCCESS, before the
//      session state has propagated. That is not a sessionless advance —
//      `finishedRef` makes `finish` idempotent and the `[session]` effect is
//      the backstop — and the census classifies them as post-await sign-in
//      sites, never as generic advances. A row asserting "finish is only
//      ever called from the session effect" would be false today and would
//      have to be lied about to go green.
//   2. I10f's DEMO_CONTENT ancestry check is BEYOND the ruled shape (Lumen
//      scoped that residual as review-covered, on the premise of a text
//      gate). An AST can see the nesting, so it is asserted here rather than
//      left to review. It is additive, not a replacement: I10c already reds
//      on any NEW bare-`finish` press control anywhere in the file, and I10f
//      additionally pins the ONE that exists inside its flag — a press
//      control MOVED out of `DEMO_CONTENT` leaves the count at five and reds
//      only I10f (calibrated).
check(
  /startAt === 'invite'\) setMode\(AUTH_EMAIL_LINK\)/.test(onboarding),
  'I10a invite entry routes straight to the email-link mode'
);

{
  const ast = parse(onboarding, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  const walk = (node, fn, stack = []) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach((n) => walk(n, fn, stack)); return; }
    const isNode = typeof node.type === 'string';
    if (isNode) { fn(node, stack); stack.push(node); }
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments') continue;
      walk(node[key], fn, stack);
    }
    if (isNode) stack.pop();
  };
  const isFn = (n) => !!n && (n.type === 'ArrowFunctionExpression' || n.type === 'FunctionExpression');
  const SIGN_IN_HANDLERS = ['handleAppleSignIn', 'handlePasswordSignIn', 'handleContinueAsDemo'];

  // Every reference to the `finish` binding, excluding its own declarator id
  // and any non-reference Identifier position (member property, object key).
  const refs = [];
  walk(ast, (node, stack) => {
    if (node.type !== 'Identifier' || node.name !== 'finish') return;
    const parent = stack[stack.length - 1];
    if (!parent) return;
    if (parent.type === 'VariableDeclarator' && parent.id === node) return;
    if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return;
    if ((parent.type === 'ObjectProperty' || parent.type === 'Property') && parent.key === node && !parent.computed) return;
    if (parent.type === 'JSXAttribute' || parent.type === 'JSXIdentifier') return;

    // Press reference: onPress={finish}
    const container = parent.type === 'JSXExpressionContainer' ? parent : null;
    const attr = container ? stack[stack.length - 2] : null;
    if (container && attr && attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'onPress') {
      refs.push({ line: node.loc.start.line, kind: 'press', label: 'press reference (onPress={finish})', stack: stack.slice() });
      return;
    }

    // Otherwise: nearest enclosing useEffect call, or nearest enclosing
    // named function binding.
    let kind = 'unclassified';
    let label = 'no enclosing useEffect or named function';
    for (let i = stack.length - 1; i >= 0; i -= 1) {
      const a = stack[i];
      if (a.type === 'CallExpression' && a.callee && a.callee.name === 'useEffect') {
        const deps = a.arguments[1];
        const names = deps && deps.type === 'ArrayExpression'
          ? deps.elements.map((e) => (e && e.type === 'Identifier' ? e.name : '?'))
          : null;
        const keyed = names && names.length === 1 && names[0] === 'session';
        // The guard is the load-bearing half. A `[session]`-keyed effect is
        // the sanctioned advance ONLY when the reference sits under an
        // `if (session)` inside it; a bare finish() in the same effect
        // PERFORMS the advance at first signed-out mount (session
        // initialises null in AuthContext, and finish() is unconditional
        // beyond finishedRef idempotence). Such a reference falls to
        // 'other-effect', which is outside I10d's KNOWN list and drops
        // I10b's session-effect count to zero — both red, by construction.
        let guarded = false;
        for (let j = i + 1; j < stack.length; j += 1) {
          const g = stack[j];
          if (g.type !== 'IfStatement') continue;
          if (!g.test || g.test.type !== 'Identifier' || g.test.name !== 'session') continue;
          const onPath = j + 1 < stack.length ? stack[j + 1] : node;
          if (onPath === g.consequent) { guarded = true; break; }
        }
        kind = keyed && guarded ? 'session-effect' : 'other-effect';
        label = `useEffect([${names ? names.join(', ') : '?'}])${keyed && !guarded ? ' \u2014 finish() not under if (session)' : ''}`;
        break;
      }
      if (a.type === 'VariableDeclarator' && a.id && a.id.type === 'Identifier' && isFn(a.init)) {
        kind = SIGN_IN_HANDLERS.includes(a.id.name) ? 'post-await-signin' : 'other-function';
        label = a.id.name;
        break;
      }
    }
    refs.push({ line: node.loc.start.line, kind, label, stack: stack.slice() });
  });

  const byKind = (k) => refs.filter((r) => r.kind === k);

  // I10b · the sanctioned advance exists: `if (session) finish()` keyed on
  // [session]. Asserted through the census, not a text match, so the effect's
  // deps AND its guard are tied together rather than co-occurring.
  //
  // The deps alone were the original shape and they were not enough: the
  // classifier scored a `[session]`-keyed effect as sanctioned whatever its
  // body did, so deleting `if (session)` and leaving a bare `finish()` kept
  // this row green while the effect fired the advance at first signed-out
  // mount. "Deps and body tied together" reaches the reference; it does not
  // reach the guard, which is the half that carries the claim. The
  // classifier now requires the reference to sit under an `IfStatement`
  // whose test is `session`, inside that effect.
  //
  // Named narrowly on purpose: the test must be the bare identifier. A
  // stricter rewrite (`if (session?.user)`, `if (session !== null)`) reds
  // this row rather than passing unverified — the guard is auth behaviour and
  // a different predicate is a different claim, so it should reach a ruling
  // rather than a classifier's guess.
  check(
    byKind('session-effect').length === 1,
    'I10b the [session]-keyed effect guards its finish() on session and is the sanctioned generic advance'
  );

  // I10c · exact reference count. Reds on a NEW advance site even when that
  // site sits in an already-known context (a second finish() inside a
  // handler classifies fine and would slip past I10d alone).
  check(
    refs.length === 5,
    `I10c finish is referenced exactly 5 times (found ${refs.length}: ${refs.map((r) => `${r.line}:${r.label}`).join(', ')})`
  );

  // I10d · completeness, deliberately MULTIPLICITY-BLIND so it is not a
  // restatement of I10c. It asserts the SET of contexts `finish` is reachable
  // from — every reference classifies into the known list, and all three
  // sign-in handlers are covered — and says nothing about how many times each
  // appears. I10c owns the counting. Neither implies the other: a second
  // finish() inside an existing handler reds I10c alone; relocating an
  // existing reference into a new context reds I10d alone.
  {
    const KNOWN = ['session-effect', 'post-await-signin', 'press'];
    const unknown = refs.filter((r) => !KNOWN.includes(r.kind));
    const handlers = [...new Set(byKind('post-await-signin').map((r) => r.label))].sort();
    const missing = [...SIGN_IN_HANDLERS].sort().filter((h) => !handlers.includes(h));
    check(
      unknown.length === 0 && missing.length === 0 && byKind('session-effect').length > 0 && byKind('press').length > 0,
      `I10d finish is reachable only from the known contexts (session effect / ${SIGN_IN_HANDLERS.join(', ')} / one press control)${
        unknown.length ? ` — unclassified: ${unknown.map((r) => `${r.line}:${r.kind}:${r.label}`).join(', ')}` : ''
      }${missing.length ? ` — uncovered handlers: ${missing.join(', ')}` : ''}`
    );
  }

  // I10e · retired token absent. Run over comment-blanked source: naming the
  // deleted mechanism in prose is legitimate (and is what this very file
  // does), a live reference is not.
  {
    const code = (ast.comments || [])
      .slice()
      .sort((a, b) => b.start - a.start)
      .reduce((s, c) => s.slice(0, c.start) + ' '.repeat(c.end - c.start) + s.slice(c.end), onboarding);
    check(!/waitForSession/.test(code), 'I10e retired waitForSession carrier has no live reference');
  }

  // I10f · the one bare-finish press control stays inside DEMO_CONTENT.
  // Beyond Lumen's ruled shape — see note 2 in this block's header.
  {
    const press = byKind('press');
    const gated = press.every((r) =>
      r.stack.some(
        (a) => a.type === 'LogicalExpression' && a.operator === '&&' && a.left && a.left.type === 'Identifier' && a.left.name === 'DEMO_CONTENT'
      )
    );
    check(press.length === 1 && gated, 'I10f the bare-finish press control renders only under DEMO_CONTENT');
  }
}
check(/navigation\.replace\('Main', \{ screen: 'Today' \}/.test(screen), 'I11 successful join lands on Today, not the obsolete collect route');
check(!/navigation\.replace\(COMB_COLLECT_ROUTE/.test(screen), 'I12 obsolete collect route is no longer in the invite join path');

console.log(`\ncheck-comb-invite-client: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
