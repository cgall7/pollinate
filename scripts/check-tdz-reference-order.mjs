// Gate: no binding in src/ is referenced above its own declaration.
//
//   npm run check:tdz-reference-order
//
// WHY THIS GATE EXISTS, which is a sharper question than what it asserts.
//
// On 2026-09-05 `PackageOpen.js:251` read `step` inside `sendTarget`, and
// `const step = ...` was declared 277 lines LOWER in the same function body.
// One function, one scope, so every render that evaluated that read touched
// `step` inside its own temporal dead zone. It parsed, it linted, it shipped,
// and it threw `ReferenceError: Cannot access 'step' before initialization`.
//
// The reason it survived from `5530a64` to that day is the shape of the read:
//
//   entrySendOpen && step ? { kind: 'entry', id: step.id } : { kind: 'hive', ... }
//
// The `&&` short circuit means JavaScript never evaluates `step` while
// `entrySendOpen` is false. So the guard that made the bug invisible was the
// same guard that armed it: tapping the per entry nectar drop set
// `entrySendOpen` true, the next render evaluated the operand, and it threw.
// The affordance and the crash were the same tap. App.js wraps the whole
// navigator in the app's ONLY ErrorBoundary, so it did not lose a panel, it
// lost the session.
//
// THE INSTRUMENT LESSON, and it is the reason this is a new file rather than a
// row added to an existing gate. Eighty gates were green on main that morning
// and not one of them could see this, because there is nothing here to grep.
// It is not a forbidden string (both lines are ordinary and correct in
// isolation) and it is not an absent prop (every name is present and spelled
// right). It is a LEXICAL ORDER fact between two lines that are individually
// well formed. A gate that reads for shapes has a null class, and reference
// order lives in it. Order belongs to a RESOLVER: build the scope tree, bind
// every name, and compare positions. Then a violation is found by
// construction, and nobody has to have thought of the pair in advance.
//
// FIVE ROWS, and their strengths differ:
//
//   G1  universe      files walked, all parsed, and the resolver actually
//                     bound something. A resolver over an empty set, or one
//                     whose scope builder silently collected no bindings, is
//                     green about nothing.
//   G2  calibration   the resolver runs over fixtures holding one violation
//                     that MUST red and five legal shapes that MUST NOT.
//                     Mutations find a row that is too weak; controls find a
//                     row that is too strong, and a TDZ checker that cannot
//                     tell a deferred reference from an immediate one would
//                     red half the codebase.
//   G3  contract      the ruled row, written as a universal over every
//                     resolved reference in src/. Zero read above their
//                     declaration.
//   G4  witness       the historical defect is RECONSTRUCTED in memory from
//                     the real PackageOpen.js (the `step` declaration moved
//                     back below `sendTarget`) and the resolver must flag it.
//                     G3 passing proves the tree is clean today; only G4
//                     proves this instrument would have caught the bug it was
//                     written for. If the two anchors ever stop existing this
//                     row reds rather than going quiet, because a gate that
//                     cannot do its measurement must not imply the
//                     measurement still holds.
//   G5  null class    a read that resolves to NO binding is silently outside
//                     G3's quantifier. That set is not noise, it is a
//                     POPULATION: every one of its members is a name the
//                     resolver failed to bind, and a scope builder that goes
//                     blind to some construct would empty G3 into it without
//                     reding anything. So the set is enumerated by name
//                     against the platform globals, and a member that is not a
//                     global reds. Written as a universal, so a construct
//                     nobody anticipated is a failure rather than an absence.
//
// THE HONEST LIMIT, stated because it bounds every number below. A reference
// inside a NESTED FUNCTION is not counted, and that is correct rather than
// lazy: `const f = () => later; const later = 1;` is legal, because `f` is not
// called until after `later` initialises. Whether it is called earlier is a
// runtime fact no source resolver decides. So this gate is exact about
// straight line evaluation order and deliberately silent about deferred
// order. The bug it was written for was straight line.

import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

let pass = 0;
const failures = [];
const ok = (label) => { pass += 1; console.log(`  ok   ${label}`); };
const bad = (label, detail) => { failures.push(`${label} — ${detail}`); console.log(`  FAIL ${label} — ${detail}`); };

const FUNCTION_TYPES = new Set([
  'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression',
  'ObjectMethod', 'ClassMethod', 'ClassPrivateMethod',
]);

// ── the resolver ────────────────────────────────────────────────────────────
// Returns { refs, violations, bindings } for one parsed file.
//
// `initEnd` is the position at which a binding becomes readable, and it is the
// END of the declarator, not the start. That is what makes `const a = a + 1`
// a violation and `const a = 1; const b = a;` not one.
function analyze(ast, rel) {
  const excluded = new Set();   // identifier nodes that DECLARE rather than read
  const skipScope = new Set();  // nodes whose scope was already created by a parent
  const refs = [];
  let bindingCount = 0;

  const mkScope = (parent, isFunction) => ({ parent, isFunction, lexical: new Map(), vars: new Set() });

  const patternIds = (pat, out) => {
    if (!pat) return out;
    switch (pat.type) {
      case 'Identifier': out.push(pat); break;
      case 'ObjectPattern':
        for (const p of pat.properties) patternIds(p.type === 'RestElement' ? p.argument : p.value, out);
        break;
      case 'ArrayPattern':
        for (const e of pat.elements) if (e) patternIds(e, out);
        break;
      case 'AssignmentPattern': patternIds(pat.left, out); break;
      case 'RestElement': patternIds(pat.argument, out); break;
      case 'TSParameterProperty': patternIds(pat.parameter, out); break;
      default: break;
    }
    return out;
  };

  const addLexical = (scope, idNode, initEnd) => {
    excluded.add(idNode);
    if (!scope.lexical.has(idNode.name)) {
      scope.lexical.set(idNode.name, { name: idNode.name, initEnd, line: idNode.loc.start.line });
      bindingCount += 1;
    }
  };

  // Lexical declarations bind in the nearest block-or-function scope, and they
  // can only appear as DIRECT statements of that scope, so this reads the
  // statement list rather than descending.
  const collectLexical = (statements, scope) => {
    for (const raw of statements) {
      if (!raw) continue;
      const st = (raw.type === 'ExportNamedDeclaration' || raw.type === 'ExportDefaultDeclaration')
        ? raw.declaration : raw;
      if (!st) continue;
      if (st.type === 'VariableDeclaration' && st.kind !== 'var') {
        for (const d of st.declarations) for (const id of patternIds(d.id, [])) addLexical(scope, id, d.end);
      } else if (st.type === 'ClassDeclaration' && st.id) {
        addLexical(scope, st.id, st.start);
      } else if (st.type === 'FunctionDeclaration' && st.id) {
        excluded.add(st.id);
        scope.vars.add(st.id.name);   // hoisted and initialised, never TDZ
      } else if (st.type === 'ImportDeclaration') {
        // ESM bindings are initialised before any module body runs, so a read
        // above the import line is legal. Recorded as non-TDZ, not skipped,
        // or every imported name would fall into the unresolved null class.
        for (const s of st.specifiers) { excluded.add(s.local); scope.vars.add(s.local.name); }
      }
    }
  };

  // `var` and hoisted function declarations bind in the nearest FUNCTION scope,
  // so this one descends through blocks and stops at function boundaries.
  const collectVars = (node, scope) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const n of node) collectVars(n, scope); return; }
    if (!node.type) return;
    if (FUNCTION_TYPES.has(node.type) || node.type === 'ClassDeclaration' || node.type === 'ClassExpression') return;
    if (node.type === 'VariableDeclaration' && node.kind === 'var') {
      for (const d of node.declarations) for (const id of patternIds(d.id, [])) scope.vars.add(id.name);
    }
    if (node.type === 'FunctionDeclaration' && node.id) scope.vars.add(node.id.name);
    for (const k in node) { if (k === 'loc') continue; collectVars(node[k], scope); }
  };

  const isReference = (node, parent, key) => {
    if (excluded.has(node)) return false;
    if (!parent) return false;
    const t = parent.type;
    if (t.startsWith('TS')) return false;
    if ((t === 'MemberExpression' || t === 'OptionalMemberExpression') && key === 'property' && !parent.computed) return false;
    if ((t === 'ObjectProperty' || t === 'ObjectMethod' || t === 'ClassMethod' || t === 'ClassProperty' ||
         t === 'ClassPrivateProperty' || t === 'PropertyDefinition') && key === 'key' && !parent.computed) return false;
    if (t === 'ImportSpecifier' || t === 'ImportDefaultSpecifier' || t === 'ImportNamespaceSpecifier') return false;
    if (t === 'ExportSpecifier') return false;
    if (t === 'MetaProperty') return false;
    if ((t === 'LabeledStatement' || t === 'BreakStatement' || t === 'ContinueStatement') && key === 'label') return false;
    if (node.type === 'JSXIdentifier') {
      // Only element names and the head of a member expression are reads.
      // `<Foo bar=...>` — `bar` is an attribute NAME, not a binding.
      const elementName = (t === 'JSXOpeningElement' || t === 'JSXClosingElement') && key === 'name';
      const memberHead = t === 'JSXMemberExpression' && key === 'object';
      return elementName || memberHead;
    }
    return true;
  };

  const walk = (node, parent, key, scope) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const n of node) walk(n, parent, key, scope); return; }
    if (!node.type) return;

    if ((node.type === 'Identifier' || node.type === 'JSXIdentifier') && isReference(node, parent, key)) {
      refs.push({ name: node.name, start: node.start, line: node.loc.start.line, scope });
      return;
    }

    let inner = scope;
    if (!skipScope.has(node)) {
      if (FUNCTION_TYPES.has(node.type)) {
        inner = mkScope(scope, true);
        if (node.id) excluded.add(node.id);
        for (const p of node.params) for (const id of patternIds(p, [])) { excluded.add(id); inner.vars.add(id.name); }
        if (node.body?.type === 'BlockStatement') {
          skipScope.add(node.body);
          collectLexical(node.body.body, inner);
          collectVars(node.body.body, inner);
        }
      } else if (node.type === 'BlockStatement' || node.type === 'StaticBlock') {
        inner = mkScope(scope, false);
        collectLexical(node.body, inner);
      } else if (node.type === 'SwitchStatement') {
        inner = mkScope(scope, false);
        collectLexical(node.cases.flatMap((c) => c.consequent), inner);
      } else if (node.type === 'ForStatement') {
        inner = mkScope(scope, false);
        if (node.init?.type === 'VariableDeclaration') collectLexical([node.init], inner);
      } else if (node.type === 'ForInStatement' || node.type === 'ForOfStatement') {
        inner = mkScope(scope, false);
        if (node.left?.type === 'VariableDeclaration') collectLexical([node.left], inner);
      } else if (node.type === 'CatchClause') {
        inner = mkScope(scope, false);
        for (const id of patternIds(node.param, [])) { excluded.add(id); inner.vars.add(id.name); }
        if (node.body?.type === 'BlockStatement') { skipScope.add(node.body); collectLexical(node.body.body, inner); }
      } else if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
        if (node.id) excluded.add(node.id);
      } else if (node.type === 'VariableDeclarator') {
        for (const id of patternIds(node.id, [])) excluded.add(id);
      }
    }

    for (const k in node) { if (k === 'loc' || k === 'leadingComments' || k === 'trailingComments') continue; walk(node[k], node, k, inner); }
  };

  const moduleScope = mkScope(null, true);
  skipScope.add(ast.program);
  collectLexical(ast.program.body, moduleScope);
  collectVars(ast.program.body, moduleScope);
  walk(ast.program, null, null, moduleScope);

  // ── resolution ────────────────────────────────────────────────────────────
  // A reference resolves to the nearest enclosing binding of that name. If a
  // FUNCTION boundary is crossed on the way out, the read is deferred and this
  // gate says nothing about it (the honest limit in the header).
  const violations = [];
  const unresolved = [];
  let resolved = 0;
  for (const ref of refs) {
    let s = ref.scope;
    let crossedFunction = false;
    while (s) {
      if (s.lexical.has(ref.name)) {
        const binding = s.lexical.get(ref.name);
        resolved += 1;
        if (!crossedFunction && ref.start < binding.initEnd) {
          violations.push({ file: rel, name: ref.name, readLine: ref.line, declLine: binding.line });
        }
        break;
      }
      if (s.vars.has(ref.name)) { resolved += 1; break; }
      if (s.isFunction) crossedFunction = true;
      s = s.parent;
      if (!s) unresolved.push(ref.name);
    }
  }
  return { refs: refs.length, resolved, bindings: bindingCount, violations, unresolved };
}

const analyzeSource = (code, rel) =>
  analyze(parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] }), rel);

// ── the universe ────────────────────────────────────────────────────────────
const files = [];
(function walkDir(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    fs.statSync(p).isDirectory() ? walkDir(p) : /\.jsx?$/.test(name) && files.push(p);
  }
})(SRC);
files.push(path.join(ROOT, 'App.js'));

const parseFailures = [];
const allViolations = [];
let totalRefs = 0, totalResolved = 0, totalBindings = 0;
const unresolvedNames = new Map();

for (const file of files) {
  const rel = path.relative(ROOT, file);
  let result;
  try { result = analyzeSource(fs.readFileSync(file, 'utf8'), rel); }
  catch (err) { parseFailures.push(`${rel}: ${err.message}`); continue; }
  totalRefs += result.refs;
  totalResolved += result.resolved;
  totalBindings += result.bindings;
  for (const n of result.unresolved) unresolvedNames.set(n, (unresolvedNames.get(n) ?? 0) + 1);
  allViolations.push(...result.violations);
}

// ── G1 universe ─────────────────────────────────────────────────────────────
if (files.length > 0 && parseFailures.length === 0 && totalBindings > 0 && totalResolved > 0) {
  ok(`G1 universe: ${files.length} js files (src/ plus App.js), all parsed, ${totalBindings} lexical binding(s) collected, ${totalResolved} of ${totalRefs} identifier read(s) resolved to a binding`);
} else {
  bad('G1 universe', parseFailures.length
    ? `${parseFailures.length} file(s) failed to parse, so G3 ran on a partial tree: ${parseFailures.join('; ')}`
    : `${files.length} file(s), ${totalBindings} binding(s), ${totalResolved} resolved read(s). A resolver whose scope builder collected nothing reports zero violations for the wrong reason.`);
}

// ── G2 calibration ──────────────────────────────────────────────────────────
// Every case is named for the property it defends. The MUST NOT rows are the
// controls: a TDZ checker with no notion of deferral, or of `var` hoisting, or
// of block scope, would red on ordinary correct code, and a gate that cries
// wolf gets its one real finding waved through.
//
// A violation is a READ, not a binding, so `step ? step.id : null` above the
// declaration counts twice. The expectations below say 2 for exactly that
// reason, and they are pinned rather than relaxed to `>= 1`: a resolver that
// deduplicated by name would report 1 here and would then under-report every
// real site by however many times the name appears on the line.
const FIXTURES = [
  { name: 'immediate read above a const in the same body MUST red (two reads on one line)',
    expect: 2,
    code: 'export const S = () => { const t = flag && step ? step.id : null; const step = pick(); return [t, step]; };' },
  { name: 'the shipped shape: short circuited read above the declaration MUST red (two reads on one line)',
    expect: 2,
    code: 'const f = (open, id) => { const target = open && step ? { kind: "entry", id: step.id } : { kind: "hive", id }; const step = null; return target; };' },
  { name: 'read from a nested arrow declared earlier MUST NOT red (deferred, legal)',
    expect: 0,
    code: 'const f = () => { const read = () => later; const later = 1; return [read, later]; };' },
  { name: 'a hoisted var read above its declaration MUST NOT red',
    expect: 0,
    code: 'const f = () => { const a = typeof v; var v = 2; return [a, v]; };' },
  { name: 'a same named binding in a sibling block MUST NOT red',
    expect: 0,
    code: 'const f = () => { const a = outer; { const outer = 1; use(outer); } return a; }; const outer = 9;' },
  { name: 'a read below its declaration MUST NOT red',
    expect: 0,
    code: 'const f = () => { const step = pick(); const t = step ? step.id : null; return t; };' },
  { name: 'a JSX element name declared later MUST red',
    expect: 1,
    code: 'const A = () => { const el = cond && <Later />; const Later = () => null; return el; };' },
];
const calibration = [];
for (const fx of FIXTURES) {
  let got;
  try { got = analyzeSource(fx.code, '(fixture)').violations.length; }
  catch (err) { got = `parse error: ${err.message}`; }
  if (got !== fx.expect) calibration.push(`${fx.name} — expected ${fx.expect} violation(s), resolver reported ${got}`);
}
if (calibration.length === 0) {
  ok(`G2 calibration: ${FIXTURES.length} fixtures, ${FIXTURES.filter((f) => f.expect > 0).length} must red and ${FIXTURES.filter((f) => f.expect === 0).length} must not, all as expected`);
} else {
  bad('G2 calibration', `${calibration.length} of ${FIXTURES.length} fixture(s) disagree with the resolver, so G3's verdict is not trustworthy in either direction: ${calibration.join('; ')}`);
}

// ── G3 the contract ─────────────────────────────────────────────────────────
if (allViolations.length === 0) {
  ok(`G3 contract: no binding is read above its own declaration anywhere in the walked tree (${totalResolved} resolved read(s) checked)`);
} else {
  bad('G3 contract',
    `${allViolations.length} reference(s) sit in their binding's temporal dead zone: ` +
    allViolations.map((v) => `${v.file}: \`${v.name}\` read at line ${v.readLine}, declared at line ${v.declLine}`).join('; ') +
    '. This throws `ReferenceError: Cannot access X before initialization` on any render that evaluates the read, and App.js wraps the whole navigator in ONE ErrorBoundary, so it costs the session rather than the surface. ' +
    'Move the declaration ABOVE its first reader. Do not add a guard: a `&&` in front of the read is what hid this bug for four days, because it also armed it.');
}

// ── G4 witness ──────────────────────────────────────────────────────────────
// G3 green proves the tree is clean; it does not prove this file can see the
// class. So reconstruct the actual 2026-09-05 defect out of the real source and
// require a red. Reconstruction failure is a FAILURE, not a skip.
const WITNESS_REL = 'src/screens/PackageOpen.js';
const DECL = /^ {2}const step = sequence && revealState && !revealState\.done \? sequence\[revealState\.index\] : null;\n/m;
const REINSERT = /^ {2}\/\/ DES-21 §9 — `connectedAuthorIds === null`/m;
try {
  const src = fs.readFileSync(path.join(ROOT, WITNESS_REL), 'utf8');
  const decl = src.match(DECL);
  if (!decl) throw new Error('the `const step = ...` declaration is no longer present in its ruled form, so the historical defect cannot be reconstructed');
  if (!REINSERT.test(src)) throw new Error('the DES-21 §9 anchor the declaration used to sit above is gone, so there is nowhere to move it back to');
  const mutated = src.replace(DECL, '').replace(REINSERT, `${decl[0]}$&`);
  if (mutated === src) throw new Error('the in-memory mutation produced an unchanged file');
  const found = analyzeSource(mutated, WITNESS_REL).violations;
  const onStep = found.filter((v) => v.name === 'step');
  if (onStep.length > 0) {
    ok(`G4 witness: with \`step\` moved back below its reader, the resolver reports ${onStep.length} violation(s) on \`step\` in ${WITNESS_REL} (read line ${onStep.map((v) => v.readLine).join(', ')}), so G3 above is a live measurement and not an accident of a clean tree`);
  } else {
    bad('G4 witness', `the historical defect was reconstructed in memory and the resolver found NO violation on \`step\`. G3's green is therefore unearned: this gate cannot see the class it was written for.`);
  }
} catch (err) {
  bad('G4 witness', `${err.message}. This row must not be softened into a skip: a gate that cannot perform its measurement must not imply the measurement still holds. Re-anchor it on the current shape of ${WITNESS_REL}, or replace it with a witness drawn from whatever the equivalent read is now.`);
}

// ── G5 null class ───────────────────────────────────────────────────────────
// G3 quantifies over reads that RESOLVED. Everything else left the building
// without being asked the question, so this row asks who left. Today that set
// is exactly the JavaScript and React Native platform globals, which is what a
// working resolver should produce: every local name, every import, every
// parameter binds. A name appearing here that is NOT a global means the scope
// builder lost a binding, and G3 would have gone quiet about every read of it
// rather than reding.
//
// Adding a genuinely new global to this list is a one line, deliberate act.
// That cost is the point: it is the only thing standing between a resolver
// regression and a gate that passes by asking nothing.
const PLATFORM_GLOBALS = new Set([
  'Math', 'Date', 'undefined', 'console', 'Number', 'Error', 'Promise', 'Set', 'Map',
  'String', 'Array', 'setTimeout', 'Boolean', 'clearTimeout', 'require', 'JSON',
  'process', 'Object', 'parseInt', 'Infinity', 'clearInterval', 'setInterval',
  'parseFloat', '__DEV__', 'URLSearchParams', 'NaN',
]);
const strayNames = [...unresolvedNames.entries()].filter(([name]) => !PLATFORM_GLOBALS.has(name));
if (strayNames.length === 0) {
  ok(`G5 null class: every one of the ${totalRefs - totalResolved} unbound read(s) is a platform global, across ${unresolvedNames.size} distinct name(s), so nothing local slipped past G3's quantifier`);
} else {
  bad('G5 null class',
    `${strayNames.length} name(s) are read but bind to nothing the resolver collected: ` +
    strayNames.sort((a, b) => b[1] - a[1]).map(([name, n]) => `\`${name}\` (${n} read(s))`).join(', ') +
    '. Either the scope builder lost a binding, in which case G3 above is now silent about every read of that name and the extractor is what needs fixing, or this is a new platform global and belongs in PLATFORM_GLOBALS. ' +
    'Do not widen this row into "skip what I cannot classify": that is the exact hole it exists to close.');
}

console.log(`\n${pass} passed, ${failures.length} failed`);
process.exitCode = failures.length ? 1 : 0;
