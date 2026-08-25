// Gate for the class Pixel found during the DES-16 review (2026-08-25):
// react-native-svg's `<Stop>` discards `stopColor`'s own alpha channel and
// rebuilds opacity from `stopOpacity` alone — `extractGradient.ts:84` is
// `(color & 0x00ffffff) | (alpha << 24)`, and `extractOpacity.ts:8` returns
// `1` for an absent `stopOpacity`. `gradients.sheen` is four `withAlpha()`
// stops (0.2 / 0 / 0 / 0.06) fed into `<Stop stopColor={color} />` with no
// `stopOpacity` — every stop painted fully opaque, and all four hive covers
// rendered at pairwise ΔE00 0.00 where the design intended 6.68-17.33.
//
//   npm run check:svg-stop-alpha
//
// THIS IS THE THIRD APPEARANCE OF THIS CLASS (Lumen, same review) — the
// hex-tap `<Stop>` fix (Lane D) fixed one call site and never became a
// class fix. Ruling: the rgba() tokens stay correct in their own frame; the
// rgba -> (stopColor, stopOpacity) split is a FRAME CONVERSION and ships as
// a function, not a call-site patch — `svgStopProps(token)` returning
// `{ stopColor, stopOpacity }`, spread onto every `<Stop>` in `src/`.
//
// WHAT IT ASSERTS. Every `<Stop>` JSX element (matched by the local binding
// of `import { Stop } from 'react-native-svg'` in that file) must satisfy
// one of:
//
//   (a) THE HELPER. It spreads the result of a `svgStopProps(...)` call —
//       either directly (`{...svgStopProps(x)}`) or via a same-file local
//       bound straight from that call (`const p = svgStopProps(x); ...
//       {...p}`). This is the only path that's correct for an alpha-baked
//       (`withAlpha(...)` / literal `rgba(...)`) token, because it's the
//       only path that actually reads the token's own alpha.
//
//   (b) EXPLICIT STOPOPACITY ON A COLOR THAT ISN'T ALPHA-BAKED. A `stopColor`
//       this gate can prove is NOT built from `withAlpha(...)` or a literal
//       `rgba(...)` string (traced through same-file local const bindings,
//       bounded), paired with an explicit `stopOpacity` attribute. This is
//       GlowOrb's pattern today: `color` defaults to a solid pigment token,
//       and the three stops vary `stopOpacity` on purpose to shape a radial
//       fade — there's no alpha in the color for `stopOpacity`'s absence to
//       have silently discarded, so hardcoding it is correct, not a
//       workaround.
//
// A `<Stop>` whose `stopColor` cannot be traced to a same-file source (a
// bare prop like `color`, an array-indexed prop like `colors[i]`) is judged
// on (b) alone, same as GlowOrb — this gate cannot see what a caller passes,
// so it cannot prove such a value alpha-baked. That is a real limitation,
// not a loophole: a caller that ever passes a `withAlpha(...)` token into a
// component whose `<Stop>` only hardcodes `stopOpacity` reintroduces this
// exact bug one layer up, invisibly. The mitigation is organizational, not
// mechanical — components that accept an arbitrary caller-supplied color for
// a `<Stop>` should use the helper, never hand-set `stopOpacity`, precisely
// because they can't make this gate's guarantee. `GradientCard` and
// `GradientIconBadge` are exactly this shape, which is why their fix is (a).
//
// SCOPE OF THE CLAIM. Same-file tracing only, three hops deep, and only
// through `VariableDeclarator` (`const x = <expr>`) and function-parameter
// defaults (`= <expr>`) — a value threaded through a second function call or
// re-exported from another module is not resolved and falls back to (b)'s
// unresolvable-is-innocent treatment. `stopOpacity="0"` counts as explicit
// (it's an AST attribute, not a truthy check) — a fully-transparent stop
// that never needed its color's alpha read correctly either way.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir } from 'node:fs/promises';
import { parse } from '@babel/parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = path.join(ROOT, 'App.js');

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

// Is `expr` provably built from an alpha-baked token? Same-file only, bounded
// depth — see the file header's SCOPE OF THE CLAIM.
const isAlphaBaked = (expr, localDecls, depth = 0) => {
  if (!expr || depth > 3) return false;
  if (expr.type === 'CallExpression' && expr.callee.type === 'Identifier' && expr.callee.name === 'withAlpha') {
    return true;
  }
  if (expr.type === 'StringLiteral' && /rgba?\(/.test(expr.value)) return true;
  if (expr.type === 'TemplateLiteral' && expr.quasis.some((q) => /rgba?\(/.test(q.value.raw))) return true;
  if (expr.type === 'Identifier' && localDecls.has(expr.name)) {
    return isAlphaBaked(localDecls.get(expr.name), localDecls, depth + 1);
  }
  return false;
};

let filesChecked = 0;
let stopsChecked = 0;

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

  const stopLocals = new Set();
  for (const node of ast.program.body) {
    if (node.type !== 'ImportDeclaration' || node.source.value !== 'react-native-svg') continue;
    for (const spec of node.specifiers) {
      if (spec.type === 'ImportSpecifier' && spec.imported.name === 'Stop') stopLocals.add(spec.local.name);
    }
  }
  if (stopLocals.size === 0) continue;

  // Same-file `const x = <expr>` bindings and function-parameter defaults,
  // for tracing both `stopColor`'s provenance (b) and a helper-result local
  // spread (a). One flat map — a name redeclared in a nested scope would
  // collide, but nothing in this codebase shadows a color/props binding.
  const localDecls = new Map();
  walk(ast.program, (node) => {
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.init) {
      localDecls.set(node.id.name, node.init);
    }
    if (
      (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') &&
      node.params
    ) {
      for (const p of node.params) {
        if (p.type === 'AssignmentPattern' && p.left.type === 'Identifier') localDecls.set(p.left.name, p.right);
      }
    }
  });

  const isSvgStopPropsCall = (expr) =>
    expr && expr.type === 'CallExpression' && expr.callee.type === 'Identifier' && expr.callee.name === 'svgStopProps';

  const stops = [];
  walk(ast.program, (node) => {
    if (node.type !== 'JSXElement') return;
    const opening = node.openingElement;
    if (opening.name.type !== 'JSXIdentifier' || !stopLocals.has(opening.name.name)) return;
    stops.push(opening);
  });

  for (const opening of stops) {
    stopsChecked += 1;
    const line = opening.loc.start.line;

    const usesHelper = opening.attributes.some((attr) => {
      if (attr.type !== 'JSXSpreadAttribute') return false;
      if (isSvgStopPropsCall(attr.argument)) return true;
      if (attr.argument.type === 'Identifier' && localDecls.has(attr.argument.name)) {
        return isSvgStopPropsCall(localDecls.get(attr.argument.name));
      }
      return false;
    });

    if (usesHelper) {
      ok(`${rel(file)}:${line} <Stop> spreads svgStopProps(...)`);
      continue;
    }

    const stopColorAttr = opening.attributes.find(
      (a) => a.type === 'JSXAttribute' && a.name.name === 'stopColor',
    );
    const stopOpacityAttr = opening.attributes.find(
      (a) => a.type === 'JSXAttribute' && a.name.name === 'stopOpacity',
    );

    if (!stopColorAttr) {
      // No stopColor at all — nothing for the discarded-alpha bug to bite.
      ok(`${rel(file)}:${line} <Stop> has no stopColor`);
      continue;
    }

    const colorExpr =
      stopColorAttr.value && stopColorAttr.value.type === 'JSXExpressionContainer'
        ? stopColorAttr.value.expression
        : stopColorAttr.value; // JSXAttribute value can be a bare StringLiteral

    const alphaBaked = isAlphaBaked(colorExpr, localDecls);

    if (stopOpacityAttr && !alphaBaked) {
      ok(`${rel(file)}:${line} <Stop> has explicit stopOpacity on a non-alpha-baked stopColor`);
    } else if (alphaBaked) {
      bad(
        `${rel(file)}:${line} <Stop> stopColor is alpha-baked`,
        `traced to a withAlpha(...)/rgba(...) source with no ` +
          `svgStopProps(...) helper — extractOpacity defaults absent ` +
          `stopOpacity to 1 and extractGradient discards stopColor's own ` +
          `alpha, so this paints fully opaque regardless of the token's ` +
          `intended alpha; use {...svgStopProps(token)}`,
      );
    } else {
      bad(
        `${rel(file)}:${line} <Stop> has stopColor with no stopOpacity and no helper`,
        `stopColor's value cannot be proven safe here (not traced to a ` +
          `known-solid same-file source) and stopOpacity is absent, so ` +
          `extractOpacity defaults it to 1 — if this color is ever alpha-baked ` +
          `the alpha silently disappears; use {...svgStopProps(token)} or add ` +
          `an explicit stopOpacity`,
      );
    }
  }
}

if (filesChecked === 0) {
  bad('parsed files', 'zero files found — the enumerator broke, not that the codebase is empty');
} else {
  ok(`parsed ${filesChecked} files`);
}
if (stopsChecked === 0) {
  bad('<Stop> elements', 'zero <Stop> elements found — the enumerator broke, not that none exist');
} else {
  ok(`checked ${stopsChecked} <Stop> element(s)`);
}

console.log(`\ncheck-svg-stop-alpha: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
