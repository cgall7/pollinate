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
//
// --- Section 3: the tab-arrival anchor multiset (POLLINATE_FIVE_TAB_IA_SPEC
// .md §11, Vector's transposition finding + Lumen's amendments, 2026-09-07,
// workspace only, ground 2a91f4a) ------------------------------------------
//
// Every spec cited in this file lives in the design workspace, not at
// any path in this repo; nothing under `GUIDES/` is in this tree, so a
// bare `GUIDES/...` address opens nothing for whoever reads this file
// next.
//
// A bare count of every `navigate/replace('Main', ...)` call's screen value
// is transposition-blind: swap two sites' destinations and the tally holds
// while both ruled destinations are wrong. Section 3 pins each of the seven
// navigation members of the tab-arrival class to a durable, non-`file:line`
// KEY — a structural fact of the surrounding code that survives ENG-104's
// reorder — rather than to its position. Each anchor asserts its own
// uniqueness (exactly the expected number of matches in its scope) before
// trusting the node it found; a count that doesn't match reds as AMBIGUOUS
// ANCHOR, never a silent bind to the wrong node (Lumen's rider).
//
// RULED_DESTINATIONS below records TODAY's values (pre-ENG-104, all seven
// still resolve to 'Today', same degenerate case check-eng103-tab-bar-pin's
// own RULED_INITIAL_ROUTE started from). ENG-104's indivisible commit is
// the one place this map is meant to change — the flip in
// POLLINATE_FIVE_TAB_IA_SPEC.md §11's tally table
// ({ Hive: 4, Today: 3 }: nudgeGuard, entryJustSaved and onboarding move to
// Hive; onClose, combInvite and createComb stay Today) rides in the same
// diff as the code change it pins, exactly like RULED_INITIAL_ROUTE above.
//
// Population-predicate note (Vector's rider, amendment 3, adopted): this
// gate's walk is `navigate`/`replace` calls naming `'Main'`. That is a
// CHOICE, not §11's definition ("every site that decides which tab a user
// arrives on, whatever syntax it wears") — the two return the same
// seven-member set today only because it was checked. Census of record at
// 2a91f4a, four syntaxes, all empty of unenumerated members: `jumpTo` (zero
// hits in App.js/src/ — the quiet one, it is the Tab navigator's own API
// and never says `Main`); `.reset(` (three hits, one a comment, two
// resetting to `Onboarding`, upstream of App.js:233); direct sibling-tab
// `navigate('<route id>')` (zero across all five ids); `screen:` outside a
// `'Main'` call (one hit, App.js:272, the entryJustSaved site's own
// argument). A `jumpTo('Hive')` written tomorrow meets §11's definition,
// joins the class, and is invisible to this predicate — the next person
// widening this gate's population should know the predicate was chosen,
// not derived.
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
const censusSites = [];
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
        censusSites.push(`${rel(file)}:${line}`);
      }
    });
  }

  // The tab-arrival class's navigate/replace('Main', ...) membership is
  // fully enumerated (POLLINATE_FIVE_TAB_IA_SPEC.md §11): seven
  // sites — App.js x5 (:171, :189, :233, :271, :405), CombInvite.js:180,
  // CreateComb.js:45. Exactly 7, not "at least 5" — under-count means the
  // walk broke, over-count means an eighth member joined the class with no
  // anchor pinning it yet (section 3 below needs a new row before this
  // number changes).
  // TWO PROPERTIES, TWO ROWS, BOTH ALWAYS EXECUTED (Vector's rider,
  // 2026-09-07). These were one if/else-if/else chain producing a single
  // printed row whose green label named only the weakest of the three
  // things it decided. Two consequences, both bad: the exactly-7 pin the
  // comment above calls a deliberate tightening had no visible row in a
  // passing run, and a red on the census SKIPPED the bare-site check
  // entirely, so a census drift hid a bare call rather than reporting it.
  // Symmetric to the arithmetic row this commit's parent replaced: that
  // label over-claimed what it proved, this one under-claimed. Same class,
  // a label that does not match its assertion.
  //
  // The second row's label carries the population it actually examined, so
  // a green over a SHRUNKEN census reads as green-over-2 rather than as an
  // unqualified all-clear. That is the row's own guard against being
  // vacuously true when the walk breaks.
  const totalMainCalls = namedSites.length + bareSites.length;

  if (totalMainCalls !== 7) {
    bad('navigate/replace("Main", ...) census is exactly 7', `found ${totalMainCalls} call(s) total — expected 7; either the AST walk broke or an unenumerated member joined the class (see §11)`);
  } else {
    ok(`navigate/replace("Main", ...) census is exactly 7 (the §11 membership, pinned exactly rather than "at least")`);
  }

  if (bareSites.length > 0) {
    bad('no bare navigate("Main") / replace("Main")', `${bareSites.length} of ${totalMainCalls} censused site(s) omit a screen target: ${bareSites.join(', ')}`);
  } else {
    ok(`every navigate/replace("Main") call names a screen (${namedSites.length} of ${totalMainCalls} censused site(s): ${namedSites.join(', ')})`);
  }
}

// --- 3. The tab-arrival anchor multiset ------------------------------------
//
// RULED_DESTINATIONS pins each anchor's `screen` value. Edit this map, and
// only this map, in the same commit that performs a ruled flip (ENG-104's
// § 11 tally: nudgeGuard/entryJustSaved/onboarding -> 'Hive'; onClose/
// combInvite/createComb stay 'Today').
const RULED_DESTINATIONS = {
  nudgeGuard: 'Today', // App.js:171, :189 — isNudgeResponse(...) guard consequents (2 sites, same value)
  entryJustSaved: 'Today', // App.js:271 — the one nav call carrying params.entryJustSaved
  onboarding: 'Today', // App.js:233 — the Stack.Screen name="Onboarding" onDone else-branch
  onClose: 'Today', // App.js:405 — the file's only onClose attribute (EveningMirror)
  combInvite: 'Today', // CombInvite.js:180 — the file's one navigate/replace('Main', ...)
  createComb: 'Today', // CreateComb.js:45 — the file's one navigate/replace('Main', ...)
};

const findScreenValue = (call) => {
  const arg = call.arguments[1];
  if (!arg || arg.type !== 'ObjectExpression') return undefined;
  const prop = arg.properties.find(
    (p) =>
      p.type === 'ObjectProperty' &&
      ((p.key.type === 'Identifier' && p.key.name === 'screen') ||
        (p.key.type === 'StringLiteral' && p.key.value === 'screen'))
  );
  return prop?.value?.type === 'StringLiteral' ? prop.value.value : undefined;
};

const findMainCallsWithin = (node) => {
  const out = [];
  walk(node, (n) => {
    if (!isNavOrReplaceCall(n)) return;
    const first = n.arguments[0];
    if (first?.type === 'StringLiteral' && first.value === 'Main') out.push(n);
  });
  return out;
};

// Every anchor records the sites it actually bound. The key is an
// address, and that is deliberate and safe here: it is an EPHEMERAL JOIN
// KEY between two derivations inside one run, never a stored pin. Nothing
// in this file remembers it across a commit, so a reorder cannot orphan it.
const claimedSites = [];

const checkAnchor = (key, expectedCount, matches, extract, relFile) => {
  const label = `anchor "${key}"`;
  matches.forEach((m) => claimedSites.push({ key, at: `${relFile}:${m.loc.start.line}` }));
  if (matches.length !== expectedCount) {
    bad(
      `${label} is unambiguous`,
      `AMBIGUOUS ANCHOR — expected exactly ${expectedCount} match(es) in scope, found ${matches.length}; this anchor's key is no longer fine enough to bind a single node`
    );
    return;
  }
  const values = matches.map(extract);
  if (values.some((v) => v === undefined)) {
    bad(`${label} names a screen`, `one or more matches have no extractable screen value: ${JSON.stringify(values)}`);
    return;
  }
  const distinct = new Set(values);
  if (distinct.size > 1) {
    bad(`${label} is single-valued`, `matches disagree: ${values.join(', ')}`);
    return;
  }
  const [value] = values;
  const ruled = RULED_DESTINATIONS[key];
  if (value !== ruled) {
    bad(`${label} names its ruled destination`, `expected ${JSON.stringify(ruled)}, got ${JSON.stringify(value)}`);
  } else {
    ok(`${label} -> "${value}" (${matches.length} site(s))`);
  }
};

{
  const appFile = path.join(ROOT, 'App.js');
  const appSrc = await readFile(appFile, 'utf8');
  let appAst;
  try {
    appAst = parse(appSrc, { sourceType: 'module', plugins: ['jsx'] });
  } catch (err) {
    bad('App.js parses (anchor section)', err.message);
    appAst = null;
  }

  if (appAst) {
    // nudgeGuard: IfStatement whose test calls isNudgeResponse(...)
    const nudgeIfs = [];
    walk(appAst.program, (node) => {
      if (node.type !== 'IfStatement') return;
      const t = node.test;
      if (t.type === 'CallExpression' && t.callee.type === 'Identifier' && t.callee.name === 'isNudgeResponse') {
        nudgeIfs.push(node);
      }
    });
    const nudgeCalls = nudgeIfs.flatMap((ifNode) => findMainCallsWithin(ifNode.consequent));
    checkAnchor('nudgeGuard', 2, nudgeCalls, findScreenValue, 'App.js');

    // entryJustSaved: the one nav-Main call whose params carry entryJustSaved: true
    const entryJustSavedCalls = findMainCallsWithin(appAst.program).filter((call) => {
      const arg = call.arguments[1];
      if (arg?.type !== 'ObjectExpression') return false;
      const paramsProp = arg.properties.find(
        (p) => p.type === 'ObjectProperty' && p.key.type === 'Identifier' && p.key.name === 'params'
      );
      if (paramsProp?.value?.type !== 'ObjectExpression') return false;
      return paramsProp.value.properties.some(
        (p) =>
          p.type === 'ObjectProperty' &&
          p.key.type === 'Identifier' &&
          p.key.name === 'entryJustSaved' &&
          p.value.type === 'BooleanLiteral' &&
          p.value.value === true
      );
    });
    checkAnchor('entryJustSaved', 1, entryJustSavedCalls, findScreenValue, 'App.js');

    // onboarding: the sole <Stack.Screen name="Onboarding"> subtree's one Main call
    const onboardingScreens = [];
    walk(appAst.program, (node) => {
      if (node.type !== 'JSXElement' || node.openingElement.name.type !== 'JSXMemberExpression') return;
      const { object, property } = node.openingElement.name;
      if (object.type !== 'JSXIdentifier' || object.name !== 'Stack' || property.name !== 'Screen') return;
      const nameAttr = node.openingElement.attributes.find(
        (a) => a.type === 'JSXAttribute' && a.name.name === 'name'
      );
      if (nameAttr?.value?.type === 'StringLiteral' && nameAttr.value.value === 'Onboarding') {
        onboardingScreens.push(node);
      }
    });
    if (onboardingScreens.length !== 1) {
      bad('anchor "onboarding" is unambiguous', `AMBIGUOUS ANCHOR — expected exactly 1 <Stack.Screen name="Onboarding">, found ${onboardingScreens.length}`);
    } else {
      const onboardingCalls = findMainCallsWithin(onboardingScreens[0]);
      checkAnchor('onboarding', 1, onboardingCalls, findScreenValue, 'App.js');
    }

    // onClose: the file's only onClose JSXAttribute
    const onCloseAttrs = [];
    walk(appAst.program, (node) => {
      if (node.type === 'JSXAttribute' && node.name.name === 'onClose') onCloseAttrs.push(node);
    });
    if (onCloseAttrs.length !== 1) {
      bad('anchor "onClose" is unambiguous', `AMBIGUOUS ANCHOR — expected exactly 1 onClose attribute in App.js, found ${onCloseAttrs.length}`);
    } else {
      const onCloseCalls = findMainCallsWithin(onCloseAttrs[0].value);
      checkAnchor('onClose', 1, onCloseCalls, findScreenValue, 'App.js');
    }
  }
}

// combInvite / createComb: one arrival site per file, filename is the key
for (const [key, relFile] of [
  ['combInvite', 'src/screens/CombInvite.js'],
  ['createComb', 'src/screens/CreateComb.js'],
]) {
  const file = path.join(ROOT, relFile);
  const src = await readFile(file, 'utf8');
  let ast;
  try {
    ast = parse(src, { sourceType: 'module', plugins: ['jsx'] });
  } catch (err) {
    bad(`${rel(file)} parses (anchor section)`, err.message);
    continue;
  }
  const calls = findMainCallsWithin(ast.program);
  checkAnchor(key, 1, calls, findScreenValue, relFile);
}

// Cross-check: the anchor set must be a PARTITION of the section-2 census.
//
// The previous form of this row compared 2+1+1+1+1+1 against 7, which is a
// literal against a literal: it printed green on every possible tree,
// including one where four anchors bound nothing at all. Measured.
//
// Counts alone do not carry coverage either. Each anchor asserting its own
// exact count, plus a census of 7, forces full coverage ONLY IF the anchors
// are pairwise disjoint, and disjointness was never asserted. Two anchors
// can bind the SAME call while both report one match, leaving a third ruled
// site pinned by nothing: reproduced by moving `entryJustSaved`'s params
// onto the `onClose` call, after which App.js:271 flipped to 'Hive' under a
// fully green run. So the reconciliation is over SETS, not sums.
{
  const claimedAts = claimedSites.map((c) => c.at);
  const distinct = new Set(claimedAts);

  if (distinct.size !== claimedAts.length) {
    const seen = new Set();
    const dupes = [];
    for (const c of claimedSites) {
      if (seen.has(c.at)) dupes.push(c.at);
      seen.add(c.at);
    }
    const owners = dupes.map((at) => `${at} claimed by [${claimedSites.filter((c) => c.at === at).map((c) => c.key).join(', ')}]`);
    bad('anchors are pairwise disjoint', `DOUBLE-BOUND ANCHOR — ${owners.join('; ')}; two anchors on one node means another ruled site is pinned by nothing`);
  } else {
    ok(`anchors are pairwise disjoint (${distinct.size} distinct site(s), no node claimed twice)`);
  }

  const censusSet = new Set(censusSites);
  const unpinned = censusSites.filter((c) => !distinct.has(c));
  const phantom = [...distinct].filter((c) => !censusSet.has(c));
  if (unpinned.length || phantom.length) {
    bad(
      'anchor set covers the full tab-arrival census',
      `${unpinned.length} censused site(s) pinned by no anchor${unpinned.length ? `: ${unpinned.join(', ')}` : ''}${phantom.length ? `; ${phantom.length} anchor site(s) outside the census: ${phantom.join(', ')}` : ''}`
    );
  } else {
    ok(`anchor set covers the full ${censusSites.length}-member tab-arrival navigate census (set equality, both directions)`);
  }
}

console.log(`\ncheck-eng103-tab-bar-pin: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
