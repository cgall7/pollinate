// Gate for RUNTIME dormancy of demo/decorative content (Lumen, thread
// b3eac928, ratifying the demo-account seed corpus): "a decorative layer
// renders only while the real population it imitates is empty — demoHive's
// roster at zero real connections, demoSeed's streak dressing at zero real
// journal entries. Once any real person or entry exists the samples
// retire."
//
//   npm run check:demo-runtime-dormancy
//
// check-demo-content-callsites.mjs already proves every demo affordance
// consults DEMO_CONTENT — that a pitch/dev build CAN show demo content at
// all. It says nothing about whether a build with real data present still
// shows it beside the real thing, which is the actual defect this rule
// closes (Fizz, same thread: seeding the ratified corpus onto the demo
// account would otherwise render two Priyas, two Omars, side by side with
// no runtime check to stop it). This gate is the second, narrower claim:
// each of the two affordances is ALSO gated on a real-population signal,
// nested inside the DEMO_CONTENT guard rather than ANDed alongside it — a
// compound top-level test (`DEMO_CONTENT && x ? …`) would read as
// unguarded to check-demo-content-callsites.mjs's isUnderGuard, which only
// recognises a bare `DEMO_CONTENT` identifier as the test/left operand. Both
// fixes nest instead, and this gate's shape assertions require that nesting
// by name — not just "a second condition exists somewhere in the file."
//
// AST-based, like check-demo-content-callsites.mjs, and for the same
// reason: HoneycombTab.js and CoreRitual.js import react-native and can't
// be executed by plain Node the way demoHive.js's data module can
// (check-demo-hive.mjs). A source-text substring check would pass on a
// reformatted false positive; walking the parsed tree for the exact shape
// does not.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { parse } from '@babel/parser';
import { walkWithAncestry, isUnderGuard } from './lib/rendered-strings.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let pass = 0;
let fail = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? (pass += 1) : (fail += 1);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
};

const parseFile = async (rel) => {
  const src = await readFile(path.join(ROOT, rel), 'utf8');
  return parse(src, { sourceType: 'module', plugins: ['jsx'] });
};

// --- helpers ---------------------------------------------------------------

// Finds `const <name> = <init>` anywhere under `root` (a walkable node —
// pass `someAst.program` for a whole file, or any subtree to search
// narrower, e.g. one function's body).
const findDeclarator = (root, name) => {
  let found = null;
  walkWithAncestry(root, (node) => {
    if (found) return;
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.id.name === name) {
      found = node;
    }
  });
  return found;
};

const findCalls = (root, calleeMatches) => {
  const out = [];
  walkWithAncestry(root, (node, ancestors) => {
    if (node.type === 'CallExpression' && calleeMatches(node.callee)) out.push({ node, ancestors });
  });
  return out;
};

const isIdentifierNamed = (node, name) => node?.type === 'Identifier' && node.name === name;
const isMemberCallNamed = (callee, objectName, propertyName) =>
  callee?.type === 'MemberExpression' &&
  isIdentifierNamed(callee.object, objectName) &&
  !callee.computed &&
  isIdentifierNamed(callee.property, propertyName);

// ============================================================================
// SITE 1 — HoneycombTab.js: demoHiveShares concat retires at a real connection
// ============================================================================
const hiveAst = await parseFile('src/screens/HoneycombTab.js');

const partitionHive = findDeclarator(hiveAst.program, 'partitionHive');
check('partitionHive is found as a const declarator', Boolean(partitionHive), true);

const fn = partitionHive?.init;
const isFn = fn?.type === 'ArrowFunctionExpression' || fn?.type === 'FunctionExpression';
check('partitionHive is a function', isFn, true);
check('partitionHive takes a third parameter (real-population signal)', (fn?.params ?? []).length >= 3, true);

// A default value (`hasRealConnections = false`) makes this an
// AssignmentPattern, whose own `.left` is the plain identifier.
const thirdParam = fn?.params?.[2];
const thirdParamIdentifier =
  thirdParam?.type === 'Identifier' ? thirdParam : thirdParam?.type === 'AssignmentPattern' && thirdParam.left.type === 'Identifier' ? thirdParam.left : null;
const thirdParamName = thirdParamIdentifier?.name ?? null;
check('partitionHive\'s third parameter is a plain identifier (with or without a default)', Boolean(thirdParamName), true);

const merged = fn ? findDeclarator(fn.body, 'merged') : null;
check('partitionHive declares `merged`', Boolean(merged), true);

const outerTest = merged?.init;
const outerIsDemoContentGuard =
  outerTest?.type === 'ConditionalExpression' &&
  outerTest.test.type === 'Identifier' &&
  outerTest.test.name === 'DEMO_CONTENT';
check('`merged`\'s outer test is the bare DEMO_CONTENT guard (unchanged shape)', outerIsDemoContentGuard, true);

const innerTest = outerTest?.consequent;
const innerIsNestedConditional = innerTest?.type === 'ConditionalExpression';
check('DEMO_CONTENT\'s consequent is itself a conditional (a second, nested gate)', innerIsNestedConditional, true);

const innerTestReadsThirdParam =
  innerIsNestedConditional && innerTest.test.type === 'Identifier' && innerTest.test.name === thirdParamName;
check('the nested gate\'s test is partitionHive\'s third parameter', innerTestReadsThirdParam, true);

// hasRealConnections === true retires the decorative concat outright.
const innerConsequentIsWeekFeedAlone =
  innerIsNestedConditional && innerTest.consequent.type === 'Identifier' && innerTest.consequent.name === 'weekFeed';
check('when the third parameter is true, `merged` is `weekFeed` with nothing concatenated', innerConsequentIsWeekFeedAlone, true);

// hasRealConnections === false is the only branch that may still concat demoHiveShares.
let demoHiveSharesInFalseBranch = false;
if (innerIsNestedConditional) {
  walkWithAncestry(innerTest.alternate, (node) => {
    if (node.type === 'CallExpression' && isIdentifierNamed(node.callee, 'demoHiveShares')) demoHiveSharesInFalseBranch = true;
  });
}
check('demoHiveShares is called only in the third-parameter-false branch', demoHiveSharesInFalseBranch, true);

// The whole nested shape must still read as DEMO_CONTENT-guarded to
// check-demo-content-callsites.mjs's Rule 2 — same walker, same flag,
// checked here too so a regression is caught by name rather than only by
// that other gate's total.
let demoHiveSharesCallNode = null;
walkWithAncestry(fn?.body ?? { type: 'EmptyStatement' }, (node) => {
  if (!demoHiveSharesCallNode && node.type === 'CallExpression' && isIdentifierNamed(node.callee, 'demoHiveShares')) {
    demoHiveSharesCallNode = node;
  }
});
let demoHiveSharesAncestors = null;
walkWithAncestry(hiveAst.program, (node, ancestors) => {
  if (node === demoHiveSharesCallNode) demoHiveSharesAncestors = ancestors;
});
check(
  'the nested demoHiveShares call still resolves as guarded by DEMO_CONTENT (Rule 2 shape)',
  demoHiveSharesAncestors ? isUnderGuard(demoHiveSharesAncestors, 'DEMO_CONTENT') : false,
  true
);

// The call site must be wired to REAL data (`connections.length > 0`), not a
// literal — a hardcoded `true`/`false` would satisfy every assertion above
// while gating on nothing.
// `const partitionHive = (…) => {…}` has no CallExpression node at its own
// definition, so every match findCalls returns is a real call site.
const partitionHiveCalls = findCalls(hiveAst.program, (callee) => isIdentifierNamed(callee, 'partitionHive'));
check('partitionHive has exactly one call site', partitionHiveCalls.length, 1);

const callArgs = partitionHiveCalls[0]?.node.arguments ?? [];
check('the call site passes 3 arguments', callArgs.length, 3);

const thirdArg = callArgs[2];
const thirdArgIsRealConnectionsCheck =
  thirdArg?.type === 'BinaryExpression' &&
  thirdArg.operator === '>' &&
  thirdArg.left.type === 'MemberExpression' &&
  isIdentifierNamed(thirdArg.left.object, 'connections') &&
  isIdentifierNamed(thirdArg.left.property, 'length') &&
  thirdArg.right.type === 'NumericLiteral' &&
  thirdArg.right.value === 0;
check('the call site\'s third argument is `connections.length > 0` (real data, not a literal)', thirdArgIsRealConnectionsCheck, true);

// ============================================================================
// SITE 2 — TodayTab.js: "Load demo data" retires at a real journal entry
// ============================================================================
//
// HOST MOVED 2026-09-05, RULE UNCHANGED. This block read `CoreRitual.js`'s
// LockScreen until R-OD deleted that gate (Lumen, thread 160660d9,
// POLLINATE_OPENDAY_NECTAR_RECUT_SPEC.md Part 1). She ruled the
// affordance TRANSPLANTED rather than deleted, onto Today's empty card, with
// the mechanism moving whole: same DEMO_CONTENT guard, same
// `getFirstEntryDate` eligibility read, same fail-dormant default. So all ten
// assertions below move with it, unchanged in kind, and the rule they enforce
// is the same rule.
const todayAst = await parseFile('src/screens/TodayTab.js');

const todayTab = findDeclarator(todayAst.program, 'TodayTab');
check('TodayTab is found as a const declarator', Boolean(todayTab), true);
const hostBody = todayTab?.init?.body;

// useState(false) initialising the eligibility flag, and its setter name.
let eligibilityState = null;
if (hostBody) {
  walkWithAncestry(hostBody, (node) => {
    if (eligibilityState) return;
    if (
      node.type === 'VariableDeclarator' &&
      node.id.type === 'ArrayPattern' &&
      node.id.elements.length === 2 &&
      node.init?.type === 'CallExpression' &&
      isIdentifierNamed(node.init.callee, 'useState')
    ) {
      const [flagEl, setterEl] = node.id.elements;
      if (flagEl?.type === 'Identifier' && setterEl?.type === 'Identifier' && /demo/i.test(flagEl.name)) {
        eligibilityState = { flagName: flagEl.name, setterName: setterEl.name };
      }
    }
  });
}
check('TodayTab declares a demo-eligibility useState flag', Boolean(eligibilityState), true);

// A useEffect whose body calls EntryStore.getFirstEntryDate().
//
// SCOPED TO THE EFFECT THAT OWNS THE FLAG, and that scoping is new with the
// host move. `CoreRitual.js`'s LockScreen had exactly one `useEffect`, so
// "some effect in this component calls getFirstEntryDate" and "the eligibility
// effect calls it" were the same sentence there. `TodayTab.js` has several,
// and one of them — the first-save celebration — already calls
// `getFirstEntryDate` for its own unrelated reasons. Unscoped, the row would
// go green on a component whose demo flag never read the journal at all: the
// witness would be another effect entirely. The population is therefore the
// effects that touch the eligibility setter, and the claim is about them.
let effectCallsGetFirstEntryDate = false;
let effectSetsEligibilityFalseOnRealEntry = false;
if (hostBody && eligibilityState) {
  for (const { node: effectCall } of findCalls(hostBody, (callee) => isIdentifierNamed(callee, 'useEffect'))) {
    const effectBody = effectCall.arguments[0]?.body ?? { type: 'EmptyStatement' };
    let touchesEligibilitySetter = false;
    walkWithAncestry(effectBody, (node) => {
      if (node.type === 'CallExpression' && isIdentifierNamed(node.callee, eligibilityState.setterName)) {
        touchesEligibilitySetter = true;
      }
    });
    if (!touchesEligibilitySetter) continue;
    let callsIt = false;
    walkWithAncestry(effectBody, (node) => {
      if (node.type === 'CallExpression' && isMemberCallNamed(node.callee, 'EntryStore', 'getFirstEntryDate')) callsIt = true;
    });
    if (callsIt) {
      effectCallsGetFirstEntryDate = true;
      // The setter must be driven by the resolved value (not a constant),
      // so a `.then(() => setX(true))` regression is caught: look for a
      // call to the setter whose sole argument is NOT a boolean literal.
      walkWithAncestry(effectCall.arguments[0]?.body ?? { type: 'EmptyStatement' }, (node) => {
        if (
          node.type === 'CallExpression' &&
          isIdentifierNamed(node.callee, eligibilityState.setterName) &&
          node.arguments[0]?.type !== 'BooleanLiteral'
        ) {
          effectSetsEligibilityFalseOnRealEntry = true;
        }
      });
    }
  }
}
check('the eligibility effect calls EntryStore.getFirstEntryDate()', effectCallsGetFirstEntryDate, true);
check('the eligibility setter is driven by the resolved value, not a literal', effectSetsEligibilityFalseOnRealEntry, true);

// The seed handler must also retire the button immediately on success
// (not wait for a remount) — a call to the setter with `false` inside
// handleLoadDemoData's success branch.
const handleLoadDemoData = hostBody ? findDeclarator(hostBody, 'handleLoadDemoData') : null;
let seedSuccessRetiresButton = false;
if (handleLoadDemoData && eligibilityState) {
  walkWithAncestry(handleLoadDemoData.init, (node) => {
    if (
      node.type === 'CallExpression' &&
      isIdentifierNamed(node.callee, eligibilityState.setterName) &&
      node.arguments[0]?.type === 'BooleanLiteral' &&
      node.arguments[0].value === false
    ) {
      seedSuccessRetiresButton = true;
    }
  });
}
check('handleLoadDemoData retires the button (`setEligible…(false)`) on a successful seed', seedSuccessRetiresButton, true);

// The rendered button: DEMO_CONTENT && ( eligibilityFlag ? <button> : null )
let renderedButtonNode = null;
walkWithAncestry(hostBody ?? { type: 'EmptyStatement' }, (node) => {
  if (renderedButtonNode) return;
  if (
    node.type === 'LogicalExpression' &&
    node.operator === '&&' &&
    node.left.type === 'Identifier' &&
    node.left.name === 'DEMO_CONTENT'
  ) {
    renderedButtonNode = node;
  }
});
check('TodayTab has a top-level `DEMO_CONTENT && (…)` guard', Boolean(renderedButtonNode), true);

const rightOfGuard = renderedButtonNode?.right;
// Parenthesised expressions don't add an AST node, so `right` is the ternary directly.
const nestedTernary = rightOfGuard?.type === 'ConditionalExpression' ? rightOfGuard : null;
check('the DEMO_CONTENT guard\'s body is a nested conditional (the eligibility gate)', Boolean(nestedTernary), true);

const nestedTernaryReadsEligibility =
  nestedTernary?.test.type === 'Identifier' && eligibilityState && nestedTernary.test.name === eligibilityState.flagName;
check('the nested conditional\'s test is the eligibility flag', nestedTernaryReadsEligibility, true);

let consequentRendersButton = false;
if (nestedTernary) {
  walkWithAncestry(nestedTernary.consequent, (node) => {
    if (node.type === 'StringLiteral' && node.value === 'Load demo data') consequentRendersButton = true;
    if (node.type === 'JSXText' && node.value === 'Load demo data') consequentRendersButton = true;
  });
}
check('the eligible branch renders "Load demo data"', consequentRendersButton, true);

const alternateRendersNothing = nestedTernary?.alternate?.type === 'NullLiteral';
check('the ineligible branch renders null', alternateRendersNothing, true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
