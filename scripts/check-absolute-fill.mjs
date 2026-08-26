// Gate for the class Pixel found during the DES-16 review (2026-08-25):
// `StyleSheet.absoluteFillObject` does not exist in RN 0.86.2 — the module
// exports `absoluteFill` (a frozen plain object), not `absoluteFillObject`.
// Nothing throws. `{ ...StyleSheet.absoluteFillObject }` spreads `undefined`
// into nothing, and `style={[a, StyleSheet.absoluteFillObject, b]}` puts an
// `undefined` array entry that RN silently skips. The failure is never a
// crash — it's a style that never applied. In `PressableScale.js` that made
// the press-tint an ordinary flex child (invisible, `pressedColor` a no-op
// at every call site) AND ate one `gap` step of its parent row: measured,
// removing the phantom entry reflows a picker row from four lines to three.
//
//   npm run check:absolute-fill
//
// THIS IS THE SECOND TIME THIS CLASS WAS FOUND. Deezine's R43 FAIL 2
// (2026-08-11) found and fixed four sites, each left with an in-file comment
// documenting the hazard (GlassBackground.js:47, MonthlyRecap.js:505,
// Onboarding.js:944, SeedsInbox.js:451-453) — and the sweep that would have
// caught the rest never ran. Pixel's 2026-08-25 count: 14 references, 9 live
// (the bug, still shipping today on 8 of them) and 5 comments (the fix,
// already landed). A grep keyed on the string `absoluteFillObject` cannot
// tell those apart without re-deriving the same classification by hand every
// time — which is exactly how the second sweep also didn't run. This gate is
// that classification, made durable: it walks the AST, so R43's documentation
// comments are structurally invisible to it and only a real reference to the
// property can fail it.
//
// WHAT IT ASSERTS
//
// Zero `MemberExpression` nodes of the shape `StyleSheet.absoluteFillObject`
// (or `Alias.absoluteFillObject` where `Alias` is the local binding of
// `import { StyleSheet as Alias } from 'react-native'` in that same file)
// anywhere under `src/` or `App.js`. Both the spread form
// (`...StyleSheet.absoluteFillObject`) and the array-member form
// (`[a, StyleSheet.absoluteFillObject, b]`) are the same MemberExpression at
// the AST level — this gate does not need to special-case either.
//
// SCOPE OF THE CLAIM. A file that imports `StyleSheet` under a name other
// than one bound by a `react-native` import (a local shadow) would false-
// negative; none exist in `src/` today. Comments, strings, and any other
// module's own `.absoluteFillObject` property (this repo has none) are out
// of scope by construction — this gate reads AST nodes, not text.
//
// THE BELT (added after Lumen's review, 2026-08-25). The member-expression
// walk above enumerates one node shape — `MemberExpression` — and the role
// "reads this property off StyleSheet" spans more than one: an
// `OptionalMemberExpression` (`StyleSheet?.absoluteFillObject`), a computed
// access (`StyleSheet['absoluteFillObject']`, which the non-computed walk
// skips by design), and a destructure (`const { absoluteFillObject } =
// StyleSheet`) followed by a bare `Identifier` at every use site are all the
// same silent no-op under a different node type — demonstrated live against
// this gate, which stayed 63/0 on the destructured form. Rather than
// enumerate every shape that can carry the property, assert the thing they
// all share: zero AST nodes anywhere in the file — any type, any position —
// whose `name` or string `value` is literally `absoluteFillObject`. That
// string has no legal occurrence in this codebase: the export does not
// exist in RN 0.86.2, and R43's hazard notes live in comments, which the
// AST never sees. This subsumes the member-expression walk; it is kept
// alongside it only because its failure message can name the exact
// `StyleSheet.` shape, which the belt's generic message does not.
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
const BELT_TARGET = 'absoluteFillObject';

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

let filesChecked = 0;
let referencesChecked = 0;

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

  // Belt: every node in the file, any type, checked for a `name` or string
  // `value` equal to the banned token — independent of whether this file
  // imports StyleSheet, so it does not share the member-walk's scope limits.
  const beltHits = [];
  walk(ast.program, (node) => {
    if (node.name === BELT_TARGET || node.value === BELT_TARGET) {
      beltHits.push(node.loc?.start?.line ?? '?');
    }
  });
  if (beltHits.length === 0) {
    ok(`${rel(file)} has no 'absoluteFillObject' token anywhere in its AST`);
  } else {
    bad(
      `${rel(file)} contains an 'absoluteFillObject' AST node`,
      `line(s) ${[...new Set(beltHits)].join(', ')} — this token has zero legal ` +
        `occurrences in this codebase; any appearance (member access, optional ` +
        `access, computed access, destructure, alias) is the same silent no-op ` +
        `under a different shape`,
    );
  }

  // Local binding(s) this file gives to react-native's `StyleSheet` export.
  // A rename (`StyleSheet as SS`) is legal JS and none exist today, but the
  // gate should not go blind the day one does.
  const styleSheetLocals = new Set();
  for (const node of ast.program.body) {
    if (node.type !== 'ImportDeclaration' || node.source.value !== 'react-native') continue;
    for (const spec of node.specifiers) {
      if (spec.type === 'ImportSpecifier' && spec.imported.name === 'StyleSheet') {
        styleSheetLocals.add(spec.local.name);
      }
    }
  }
  if (styleSheetLocals.size === 0) continue; // file doesn't import StyleSheet at all

  const hits = [];
  walk(ast.program, (node) => {
    if (node.type !== 'MemberExpression' || node.computed) return;
    if (node.object.type !== 'Identifier' || !styleSheetLocals.has(node.object.name)) return;
    if (node.property.type !== 'Identifier' || node.property.name !== 'absoluteFillObject') return;
    hits.push(node.loc.start.line);
  });

  referencesChecked += 1;
  if (hits.length === 0) {
    ok(`${rel(file)} has no StyleSheet.absoluteFillObject reference`);
  } else {
    bad(
      `${rel(file)} references StyleSheet.absoluteFillObject`,
      `line(s) ${hits.join(', ')} — this export does not exist in RN 0.86.2 ` +
        `(the module exports 'absoluteFill'); the style silently no-ops instead ` +
        `of throwing, and inside an array it also swallows one 'gap' step of the ` +
        `parent — replace with 'StyleSheet.absoluteFill'`,
    );
  }
}

if (filesChecked === 0) {
  bad('parsed files', 'zero files found — the enumerator broke, not that the codebase is empty');
} else {
  ok(`parsed ${filesChecked} files`);
}
if (referencesChecked === 0) {
  bad('StyleSheet importers', 'zero files import StyleSheet from react-native — the import scan broke');
} else {
  ok(`checked ${referencesChecked} file(s) that import StyleSheet`);
}

console.log(`\ncheck-absolute-fill: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
