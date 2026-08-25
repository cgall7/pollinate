// Gate for the class Pixel's device re-pass found (2026-08-25, DES-16 wave2
// review): `PressableScale`'s `style` prop lands on the inner
// `Animated.View` — the transform/opacity layer — while the outer
// `Pressable` is the actual flex child of whatever container the component
// sits in. A caller putting extrinsic sizing/positioning on `style` lands it
// one node too deep to matter: the outer `Pressable` has no `containerStyle`,
// shrinks to its content, and any percentage on the inner node resolves
// against that shrunk box instead of the parent grid.
//
//   npm run check:pressable-layout
//
// CreateHive.js's cover-theme picker was the caught instance (fixed on
// `wave2@7d73dbf`, no longer live): `styles.themeCard` carried
// `width: '48%'` on `style`, so every swatch rendered at its content's
// natural width instead of the 354pt grid's 48%. The component's own doc
// comment (PressableScale.js:11-16, Pixel, R43 gate, 2026-08-11) names this
// exact defect and shipped the fix (`containerStyle`) undefined by default —
// "zero change for every existing consumer" is the tell: the remedy was
// built, documented, and adopted nowhere.
//
// WHAT IT ASSERTS. For every `<PressableScale>` JSX element (matched by the
// local binding of `import { PressableScale } from '.../PressableScale'`),
// its `style` prop — traced through arrays, `&&`/`? :` branches, `styles.x`
// member access into a same-file `StyleSheet.create({...})` call, and
// same-file local bindings, bounded depth — must contain none of the
// layout-positioning keys that only make sense on the box a parent lays out:
// `width`, `alignSelf`, `flex`, `flexBasis`, and every `margin*` key. Those
// belong on `containerStyle`, which this gate does not restrict — sizing the
// *outer* node is the whole point of that prop.
//
// SCOPE OF THE CLAIM. Same-file tracing only, bounded depth, mirroring
// check-svg-stop-alpha's tracing — a value threaded through a second
// function call, a spread from another module's style object, or
// `StyleSheet.flatten(...)` is not resolved and is judged innocent, same as
// that gate's unresolvable-is-innocent treatment. `height`, `position`,
// `top`/`left`/`right`/`bottom`, `flexGrow`/`flexShrink`, and cross-axis
// alignment (`alignItems`, `justifyContent`) are deliberately NOT banned —
// those govern the box's own children or don't depend on which node in the
// pair receives them; only the keys a *parent* resolves against the box
// itself are in scope, per Lumen's routing.
//
// THE RATCHET (Lumen, 2026-08-25, after the wave2 device re-pass). First
// sweep on `wave2`'s pre-fix base: 25 hits. Fizz's `7d73dbf` fixed the two
// provably-circular percentage sites (CreateHive, PrimaryButton) as part of
// the ruled blocking work; the honest live count on top of that fix is 23 —
// fixed-value keys that shrink-wrap likely renders identically today
// whether on `style` or `containerStyle` (misplaced by convention, not
// confirmed visibly broken). Lumen's ruling: ratchet baseline, not a
// blocking sweep — 20 files of churn plus a full device sweep isn't worth
// holding wave2 for. Same R16 discipline as check-safe-area/
// check-spring-adoption (GUIDES/HEX_TAP_SPEC_LUXURY_PASS.md, "R15/R16/R17
// Build Review"): stable identity (`file:styleKey:bannedKey`, not line —
// R16a), monotone updates only via `npm run ratchet:update` (R16b), a named
// owner asserted by the suite itself, not just printed (R16/R17).
//
// scripts/lib/ratchet.mjs and scripts/lib/ratchet-keys.mjs are copied
// verbatim from `sage/luxury-gates-v2@19062c3` (the already-reviewed R16/R17
// mechanism) rather than re-derived — that branch hasn't merged to `main`/
// `wave2` yet, so this is the first ratcheted gate to land on this lineage.
// When `luxury-gates-v2` merges, `ratchet-keys.mjs` and `ratchet-update.mjs`
// will need reconciling with that branch's safe-area/spring-adoption
// entries — noted here so it isn't a surprise.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir } from 'node:fs/promises';
import { parse } from '@babel/parser';
import { loadBaseline, diffAgainstBaseline, ownerIsNamed } from './lib/ratchet.mjs';
import { pressableLayoutKeyOf } from './lib/ratchet-keys.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = path.join(ROOT, 'App.js');

const BANNED_KEYS = new Set([
  'width',
  'alignSelf',
  'flex',
  'flexBasis',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
]);

// `--dump-json` (ratchet-update.mjs) wants only the final JSON on stdout —
// same convention as check-safe-area.mjs.
const DUMP_JSON = process.argv.includes('--dump-json');
const realLog = console.log;
if (DUMP_JSON) console.log = () => {};

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

const files = [ENTRY, ...(await jsFiles(path.join(ROOT, 'src')))];

const walk = (node, visit, parent = null) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, visit, parent));
    return;
  }
  if (typeof node.type === 'string') visit(node, parent);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
    walk(node[key], visit, node);
  }
};

const propKeyName = (prop) => {
  if (prop.type !== 'ObjectProperty' && prop.type !== 'ObjectMethod') return null;
  if (prop.key.type === 'Identifier' && !prop.computed) return prop.key.name;
  if (prop.key.type === 'StringLiteral') return prop.key.value;
  return null; // computed key — not statically resolvable, out of scope
};

// Resolve `expr` to the set of { obj, styleKey } it could evaluate to,
// same-file only, bounded depth. Mirrors check-svg-stop-alpha's tracing.
// `styleKey` is the StyleSheet.create property name when resolved via
// `styles.x` (R16a's stable identity); `null` for an inline object literal
// or a local binding not traced to a named key — those fall back to
// line-sensitivity, same as check-spring-adoption's ungeneralizable case.
const resolveStyleObjects = (expr, ctx, depth = 0) => {
  if (!expr || depth > 4) return [];
  switch (expr.type) {
    case 'ObjectExpression':
      return [{ obj: expr, styleKey: null }];
    case 'ArrayExpression':
      return expr.elements.flatMap((el) => resolveStyleObjects(el, ctx, depth + 1));
    case 'LogicalExpression': // `cond && styles.x`
      return resolveStyleObjects(expr.right, ctx, depth + 1);
    case 'ConditionalExpression': // `cond ? styles.a : styles.b`
      return [
        ...resolveStyleObjects(expr.consequent, ctx, depth + 1),
        ...resolveStyleObjects(expr.alternate, ctx, depth + 1),
      ];
    case 'Identifier':
      if (ctx.localDecls.has(expr.name)) {
        return resolveStyleObjects(ctx.localDecls.get(expr.name), ctx, depth + 1);
      }
      return [];
    case 'MemberExpression': {
      if (expr.computed || expr.object.type !== 'Identifier' || expr.property.type !== 'Identifier') return [];
      const sheet = ctx.styleSheets.get(expr.object.name);
      if (!sheet) return [];
      const entry = sheet.properties.find((p) => propKeyName(p) === expr.property.name);
      if (!entry || entry.type !== 'ObjectProperty') return [];
      return resolveStyleObjects(entry.value, ctx, depth + 1).map((r) => ({
        obj: r.obj,
        styleKey: r.styleKey ?? expr.property.name,
      }));
    }
    default:
      return []; // CallExpression (e.g. StyleSheet.flatten), spreads, etc. — unresolved, judged innocent
  }
};

let filesChecked = 0;
let elementsChecked = 0;
const violations = [];

for (const file of files) {
  const src = await readFile(file, 'utf8');
  let ast;
  try {
    ast = parse(src, { sourceType: 'module', plugins: ['jsx'] });
  } catch (err) {
    bad(`${rel(file)} parses`, err.message);
    continue;
  }
  filesChecked += 1;

  const pressableLocals = new Set();
  for (const node of ast.program.body) {
    if (node.type !== 'ImportDeclaration' || !/\/PressableScale$/.test(node.source.value)) continue;
    for (const spec of node.specifiers) {
      if (spec.type === 'ImportSpecifier' && spec.imported.name === 'PressableScale') {
        pressableLocals.add(spec.local.name);
      }
    }
  }
  if (pressableLocals.size === 0) continue;

  // Same-file `const x = <expr>` bindings, for tracing a `style` value that
  // isn't a direct `styles.foo` member access.
  const localDecls = new Map();
  // Same-file `const styles = StyleSheet.create({...})` bindings, for
  // resolving `styles.foo` into the object literal that defines it.
  const styleSheets = new Map();
  walk(ast.program, (node) => {
    if (node.type !== 'VariableDeclarator' || node.id.type !== 'Identifier' || !node.init) return;
    localDecls.set(node.id.name, node.init);
    const init = node.init;
    if (
      init.type === 'CallExpression' &&
      init.callee.type === 'MemberExpression' &&
      init.callee.object.type === 'Identifier' &&
      init.callee.object.name === 'StyleSheet' &&
      init.callee.property.type === 'Identifier' &&
      init.callee.property.name === 'create' &&
      init.arguments[0]?.type === 'ObjectExpression'
    ) {
      styleSheets.set(node.id.name, init.arguments[0]);
    }
  });
  const ctx = { localDecls, styleSheets };

  const elements = [];
  walk(ast.program, (node) => {
    if (node.type !== 'JSXElement') return;
    const opening = node.openingElement;
    if (opening.name.type !== 'JSXIdentifier' || !pressableLocals.has(opening.name.name)) return;
    elements.push(opening);
  });

  for (const opening of elements) {
    elementsChecked += 1;
    const line = opening.loc.start.line;

    const styleAttr = opening.attributes.find((a) => a.type === 'JSXAttribute' && a.name.name === 'style');
    if (!styleAttr) {
      ok(`${rel(file)}:${line} <PressableScale> has no style prop`);
      continue;
    }
    const styleExpr =
      styleAttr.value && styleAttr.value.type === 'JSXExpressionContainer' ? styleAttr.value.expression : null;

    const resolved = resolveStyleObjects(styleExpr, ctx);
    const hits = [];
    for (const { obj, styleKey } of resolved) {
      for (const prop of obj.properties) {
        const keyName = propKeyName(prop);
        if (keyName && BANNED_KEYS.has(keyName)) {
          hits.push({ key: keyName, line: prop.loc.start.line, styleKey: styleKey ?? `<inline>@${line}` });
        }
      }
    }

    if (hits.length === 0) {
      ok(`${rel(file)}:${line} <PressableScale> style has no layout-positioning keys`);
    } else {
      for (const h of hits) violations.push({ file: rel(file), styleKey: h.styleKey, key: h.key, line: h.line });
    }
  }
}

if (filesChecked === 0) {
  bad('parsed files', 'zero files found — the enumerator broke, not that the codebase is empty');
} else {
  ok(`parsed ${filesChecked} files`);
}
if (elementsChecked === 0) {
  bad('<PressableScale> elements', 'zero elements found — the enumerator broke, not that none exist');
} else {
  ok(`checked ${elementsChecked} <PressableScale> element(s)`);
}

// De-dupe by (file, styleKey, key): two JSX call sites can reference the
// same StyleSheet.create entry (MemoryLane.js's closeButton, PackageOpen.js's
// closeButton — each rendered from two places), and the defect lives in the
// shared style object, not per call site — one ratchet row, not two
// colliding ones. First occurrence (lowest line) wins.
const seenViolationKeys = new Set();
const dedupedViolations = [];
for (const v of violations) {
  const k = `${v.file}:${v.styleKey}:${v.key}`;
  if (seenViolationKeys.has(k)) continue;
  seenViolationKeys.add(k);
  dedupedViolations.push(v);
}
violations.length = 0;
violations.push(...dedupedViolations);
violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

// `--dump-json` (ratchet-update.mjs) — print the live violations and exit,
// skip the ratchet diff/assertions below. Kept separate so a baseline can
// only ever be regenerated as an explicit, visible step.
if (DUMP_JSON) {
  realLog(JSON.stringify({ layoutKeys: violations }));
  process.exit(0);
}

console.log(`\n--- PressableScale style carrying a layout-positioning key (${violations.length}) ---`);
for (const v of violations) console.log(`  ${v.file}:${v.line}  styles.${v.styleKey}.${v.key}`);

const baseline = loadBaseline(path.join(ROOT, 'scripts', 'baselines', 'pressable-layout.json'));
const diff = diffAgainstBaseline(violations, baseline.entries, pressableLayoutKeyOf);
console.log(
  `\n${diff.stillOpen} already in the baseline (owner: ${baseline.owner}) — ${diff.added.length} new, ${diff.stale.length} baseline rows no longer reproduced`,
);
for (const v of diff.added) console.log(`  NEW, not in baseline: ${pressableLayoutKeyOf(v)}  styles.${v.styleKey}.${v.key}`);
for (const v of diff.stale) console.log(`  STALE baseline row, run \`npm run ratchet:update\` to retire it: ${pressableLayoutKeyOf(v)}`);
if (diff.added.length === 0) ok('no PressableScale layout key beyond the checked-in ratchet baseline');
else bad('no PressableScale layout key beyond the checked-in ratchet baseline', diff.added.map(pressableLayoutKeyOf).join(', '));
if (diff.stale.length === 0) ok('every ratchet-baselined layout-key entry still reproduces (or has been retired via ratchet:update)');
else bad('every ratchet-baselined layout-key entry still reproduces (or has been retired via ratchet:update)', diff.stale.map(pressableLayoutKeyOf).join(', '));
if (ownerIsNamed(baseline.owner)) ok('pressable-layout.json owner names an actual owner, not "unassigned"');
else bad('pressable-layout.json owner names an actual owner, not "unassigned"', JSON.stringify(baseline.owner));

console.log(`\ncheck-pressable-layout: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
