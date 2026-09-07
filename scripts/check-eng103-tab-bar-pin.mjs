// Gate for the five-tab reorder hazard Vector found (thread f2c15b7d,
// 2026-09-07): `src/navigation/MainTabs.js`'s `<Tab.Navigator>` had no
// `initialRouteName`, so the cold-launch tab and every bare `navigate('Main')`
// / `replace('Main')` call silently resolved to whichever `Tab.Screen` was
// declared FIRST — a fallback nothing in the file marked as load-bearing.
// Reordering the declarations for the five-tab pivot (ENG-104+) would have
// silently retargeted every one of them: no edit at the call site, no diff
// to review, no test that could fail.
//
//   npm run check:eng103-tab-bar-pin
//
// Two rows, in the order Lumen ruled (thread f2c15b7d, 2026-09-07): the
// navigator's own `initialRouteName` is the PRIMARY mechanism — it is the
// sole thing deciding the tab on every ordinary daily open, since the
// Stack's own `initialRouteName` (App.js:210, driven by
// `resolveInitialRoute.js`) only ever resolves to the Stack route `'Main'`
// and structurally cannot see inside this tab navigator. The bare-call walk
// is SECONDARY, a by-construction backstop: no `navigate`/`replace` call
// targeting `'Main'` may omit a screen target, anywhere, ever.
//
// `resolveInitialRoute.js`'s two bare `'Main'` returns are a different
// layer (which Stack route) and are deliberately NOT in this gate's
// population — ruled to stay as-is, covered by their own
// `check-resolve-initial-route.mjs`. They are `ReturnStatement` values, not
// `navigate`/`replace` calls, so the AST pattern below does not see them
// either way; this comment is the belt, not the mechanism.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir, stat } from 'node:fs/promises';
import { parse } from '@babel/parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RULED_INITIAL_ROUTE = 'Today';

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
const rel = (p) => path.relative(ROOT, p);

const jsFiles = async (dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await jsFiles(full)));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
};

const files = [path.join(ROOT, 'App.js'), ...(await jsFiles(path.join(ROOT, 'src')))];

const walk = (node, visit) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, visit));
    return;
  }
  if (typeof node.type === 'string') visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
    walk(node[key], visit);
  }
};

const isNavOrReplaceCall = (node) =>
  (node.type === 'CallExpression' || node.type === 'OptionalCallExpression') &&
  (node.callee.type === 'MemberExpression' || node.callee.type === 'OptionalMemberExpression') &&
  node.callee.property.type === 'Identifier' &&
  (node.callee.property.name === 'navigate' || node.callee.property.name === 'replace');

// --- 1. The primary mechanism: Tab.Navigator's own initialRouteName -------
{
  const file = path.join(ROOT, 'src/navigation/MainTabs.js');
  const src = await readFile(file, 'utf8');
  let ast;
  try {
    ast = parse(src, { sourceType: 'module', plugins: ['jsx'] });
  } catch (err) {
    bad(`${rel(file)} parses`, err.message);
    ast = null;
  }

  let found = null; // string value, or 'PRESENT_NOT_LITERAL' if dynamic
  if (ast) {
    walk(ast.program, (node) => {
      if (found !== null) return;
      if (node.type !== 'JSXElement' || node.openingElement.name.type !== 'JSXMemberExpression') return;
      const { object, property } = node.openingElement.name;
      if (object.type !== 'JSXIdentifier' || object.name !== 'Tab' || property.name !== 'Navigator') return;
      const attr = node.openingElement.attributes.find(
        (a) => a.type === 'JSXAttribute' && a.name.name === 'initialRouteName'
      );
      if (!attr) {
        found = undefined; // absent
      } else if (attr.value?.type === 'StringLiteral') {
        found = attr.value.value;
      } else {
        found = 'PRESENT_NOT_LITERAL';
      }
    });
  }

  if (found === undefined) {
    bad('Tab.Navigator carries initialRouteName', 'attribute is absent — the cold-launch tab is deciding itself by Tab.Screen declaration order again');
  } else if (found === 'PRESENT_NOT_LITERAL') {
    bad('Tab.Navigator initialRouteName is a string literal', 'value is a non-literal expression — this gate cannot verify a computed value names the ruled route');
  } else if (found !== RULED_INITIAL_ROUTE) {
    bad('Tab.Navigator initialRouteName names the ruled route', `expected ${JSON.stringify(RULED_INITIAL_ROUTE)}, got ${JSON.stringify(found)}`);
  } else {
    ok(`Tab.Navigator initialRouteName="${RULED_INITIAL_ROUTE}" (primary mechanism, not a restated fallback)`);
  }
}

// --- 2. The backstop: no bare navigate('Main') / replace('Main') ----------
{
  const bareSites = [];
  const namedSites = [];

  for (const file of files) {
    const src = await readFile(file, 'utf8');
    let ast;
    try {
      ast = parse(src, { sourceType: 'module', plugins: ['jsx'] });
    } catch (err) {
      bad(`${rel(file)} parses`, err.message);
      continue;
    }

    walk(ast.program, (node) => {
      if (!isNavOrReplaceCall(node)) return;
      const [first, second] = node.arguments;
      if (!first || first.type !== 'StringLiteral' || first.value !== 'Main') return;
      const line = node.loc.start.line;
      if (!second || second.type !== 'ObjectExpression') {
        bareSites.push(`${rel(file)}:${line}`);
      } else {
        namedSites.push(`${rel(file)}:${line}`);
      }
    });
  }

  // A gate over an empty population proves nothing (the class this repo's
  // own gate-design lesson calls out) — five sites are already known to
  // exist (CreateComb.js, CombInvite.js, App.js x3), so anything under that
  // means the walk itself broke, not that the hazard is gone.
  if (namedSites.length + bareSites.length < 5) {
    bad('navigate/replace("Main", ...) census is non-empty', `found only ${namedSites.length + bareSites.length} call(s) total — expected at least 5; the AST walk may not be reaching the known call sites`);
  } else if (bareSites.length > 0) {
    bad('no bare navigate("Main") / replace("Main")', `${bareSites.length} site(s) omit a screen target: ${bareSites.join(', ')}`);
  } else {
    ok(`every navigate/replace("Main") call names a screen (${namedSites.length} site(s): ${namedSites.join(', ')})`);
  }
}

console.log(`\ncheck-eng103-tab-bar-pin: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
