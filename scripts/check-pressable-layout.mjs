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
// CreateHive.js:146's cover-theme picker is the caught instance:
// `styles.themeCard` carries `width: '48%'` on `style`, so every swatch
// renders at its content's natural width (measured on device: 81.67pt where
// the 354pt grid's 48% is 169.9pt) and every label clips. The component's
// own doc comment (PressableScale.js:11-16, Pixel, R43 gate, 2026-08-11)
// names this exact defect and ships the fix (`containerStyle`) undefined by
// default — "zero change for every existing consumer" is the tell: the
// remedy was built, documented, and adopted nowhere. Lumen: "the second
// documented-hazard-never-swept uncovered today, and this one's
// documentation lives inside the component that bites."
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
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir } from 'node:fs/promises';
import { parse } from '@babel/parser';

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

// Resolve `expr` to the set of ObjectExpression nodes it could evaluate to,
// same-file only, bounded depth. Mirrors check-svg-stop-alpha's tracing.
const resolveStyleObjects = (expr, ctx, depth = 0) => {
  if (!expr || depth > 4) return [];
  switch (expr.type) {
    case 'ObjectExpression':
      return [expr];
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
      return resolveStyleObjects(entry.value, ctx, depth + 1);
    }
    default:
      return []; // CallExpression (e.g. StyleSheet.flatten), spreads, etc. — unresolved, judged innocent
  }
};

let filesChecked = 0;
let elementsChecked = 0;

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

    const objects = resolveStyleObjects(styleExpr, ctx);
    const hits = [];
    for (const obj of objects) {
      for (const prop of obj.properties) {
        const keyName = propKeyName(prop);
        if (keyName && BANNED_KEYS.has(keyName)) {
          hits.push({ key: keyName, line: prop.loc.start.line });
        }
      }
    }

    if (hits.length === 0) {
      ok(`${rel(file)}:${line} <PressableScale> style has no layout-positioning keys`);
    } else {
      const detail = hits.map((h) => `${h.key} (line ${h.line})`).join(', ');
      bad(
        `${rel(file)}:${line} <PressableScale> style carries layout-positioning keys`,
        `${detail} — style only reaches the inner Animated.View, so these ` +
          `resolve against a Pressable that shrinks to its content instead of ` +
          `the parent grid; move to containerStyle`,
      );
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

console.log(`\ncheck-pressable-layout: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
