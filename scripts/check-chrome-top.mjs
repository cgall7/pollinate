// A second, distinct axis from `check-safe-area` (Lumen, thread 6596d9c2,
// 2026-08-25, "MemoryLane eyeball done" — the follow-up sweep on
// `sage/luxury-gates-v2@325283a`): a `position: 'absolute'` element with a
// literal `top` can be exactly as much a chrome-jump guess as a hard-coded
// `paddingTop` is, and `check-safe-area`'s locating rule can't see it —
// `top` is not in `TOP_SPACING_KEYS`, and `TOP_SPACING_KEYS` is deliberately
// asymmetric (R17: widen the SHIELDING side only, never the CANDIDATE side)
// so it must stay that way rather than absorbing a structurally different
// property into the same list.
//
//   npm run check:chrome-top
//
// THE LOCATING RULE — DIRECT PARENT, NOT AN ANCESTOR WALK
//
// `check-safe-area` walks every ancestor between a candidate and the screen
// root, because a `paddingTop` on a deeply-nested node can still be
// unshielded chrome (`TodayTab.js:281` is two levels down under a
// transparent wrapper). `position: 'absolute'` is different: React Native's
// Yoga layout has no CSS "nearest positioned ancestor" concept — an
// absolutely-positioned child is ALWAYS placed relative to its immediate
// parent's padding box, full stop. So the only ancestor whose size and
// position actually determine what `top: 60` means is the DIRECT parent,
// not anything further up.
//
// A candidate's direct parent is chrome iff it is:
//   (a) the topmost JSX element of its return branch (no further JSX
//       ancestor of its own — i.e. it IS the screen, or one arm of an
//       early loading/error return), or
//   (b) styled with a `...StyleSheet.absoluteFill` spread (a full-bleed
//       overlay/scrim — its own top edge already IS the screen's top edge,
//       even if it isn't literally the component's top-level return, e.g.
//       `NotesInbox`/`SeedsInbox`'s `detailOverlay`).
// Anything else — a bounded card, a grid swatch, a row — is interior:
// `top: 8` there nudges a badge inside its own box, not the screen.
//
// MEASURED AGAINST EVERY CANDIDATE ON THIS TREE (325283a): 7 chrome, 1
// interior (`CreateHive.js:267 themeCheck`, direct parent `themeCard` —
// `width: '31%', aspectRatio: 1`, no absoluteFill, not a return root).
// `CreateHive.js:267` is the calibration case the rule must NOT catch, the
// same role `HiveDetail.js:286` plays for `check-safe-area`.
//
// NO MAGNITUDE THRESHOLD (unlike `check-safe-area`'s `CHROME_THRESHOLD`).
// `paddingTop` needed one because ordinary interior padding and chrome
// padding share the same property and only differ by how large the number
// is. Here the classification is structural — direct parent identity, not
// the `top` value — so `top: 8` on a root-level element is exactly as much
// a candidate as `top: 100` (no such case exists today, but the rule
// shouldn't need revisiting if one appears).
//
// TWO NAMED BLIND SPOTS (Lumen, 2026-08-25, same review) — recorded rather
// than silently accepted, the way `check-safe-area`'s own header names its
// threshold as tuned-to-today's-tree instead of universal:
//
//   (a) Rule (a) above treats ANY sub-component's own return root as a
//       chrome parent — not just a screen-level component's. A future
//       absolute-top child of, say, a list-row component's root would be
//       over-flagged as chrome even though the row itself is interior to
//       the screen. This fails RED, not green — a false candidate gets
//       reviewed and dismissed, never silently missed — which is the
//       acceptable direction for a ratchet to be wrong in.
//   (b) The sweep only reads `StyleSheet.create` keys (via `getStylesMap`),
//       the same scope `check-safe-area` uses. An inline object style —
//       `style={{ position: 'absolute', top: 60 }}` written directly in
//       JSX rather than through `styles.X` — never becomes a candidate.
//       That's the MISS direction: a chrome-jump guess written this way
//       ships invisible to this gate. No known instance on this tree today.
//
// A THIRD LESSON, FROM HOW THIS GATE'S OWN BASELINE WAS BUILT (Lumen caught
// it, not me): the baseline was first computed against `325283a`, the tip
// at the time — but Fizz's fix (`3d0ae16`, all 7 sites) landed as a SIBLING
// commit on the same branch, not a descendant of this gate's commit. On the
// merged tree the baseline held 7 rows for a defect that no longer existed
// — 7 STALE, gate red — until this gate's own commit was rebased onto the
// fix and its baseline regenerated in the same commit, so the axis enters
// the tree already clean (see the empty `entries: []` below) rather than
// entering red and immediately needing its own follow-up. A gate and a
// fix landing as siblings is exactly the shape where "ran clean when I
// built it" stops being sufficient — the check is what the MERGED tree
// says, not what either branch said alone.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { loadBaseline, diffAgainstBaseline, ownerIsNamed } from './lib/ratchet.mjs';
import { chromeTopKeyOf } from './lib/ratchet-keys.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCREENS_DIR = path.join(ROOT, 'src', 'screens');

const DUMP_JSON = process.argv.includes('--dump-json');
const realLog = console.log;
if (DUMP_JSON) console.log = () => {};

let pass = 0;
let fail = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? (pass += 1) : (fail += 1);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
};

const walk = (node, visit) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, visit));
    return;
  }
  if (typeof node.type === 'string') visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'range') continue;
    const val = node[key];
    if (val && typeof val === 'object') walk(val, visit);
  }
};

// Same constant-folder as check-safe-area.mjs (kept local, not imported —
// evalConst has no baseline/key coupling to share, and duplicating four
// lines here is cheaper than a cross-gate import for something this small).
const evalConst = (n) => {
  if (!n) return null;
  if (n.type === 'NumericLiteral') return n.value;
  if (n.type === 'UnaryExpression' && n.operator === '-' && n.argument?.type === 'NumericLiteral') return -n.argument.value;
  if (n.type === 'BinaryExpression' && (n.operator === '+' || n.operator === '-')) {
    const l = evalConst(n.left);
    const r = evalConst(n.right);
    if (l === null || r === null) return null;
    return n.operator === '+' ? l + r : l - r;
  }
  return null;
};

const isStyleProp = (name) => typeof name === 'string' && (name === 'style' || name.endsWith('Style'));

const getPropValue = (objExprNode, propName) => {
  if (!objExprNode || objExprNode.type !== 'ObjectExpression') return null;
  for (const prop of objExprNode.properties) {
    if (prop.type !== 'ObjectProperty') continue;
    const key = prop.key?.name ?? prop.key?.value;
    if (key === propName) return prop.value;
  }
  return null;
};

const hasAbsoluteFillSpread = (objExprNode) => {
  if (!objExprNode || objExprNode.type !== 'ObjectExpression') return false;
  return objExprNode.properties.some(
    (p) =>
      p.type === 'SpreadElement' &&
      p.argument?.type === 'MemberExpression' &&
      p.argument.object?.name === 'StyleSheet' &&
      p.argument.property?.name === 'absoluteFill'
  );
};

const getStylesMap = (ast) => {
  const map = new Map();
  walk(ast, (n) => {
    if (
      n.type === 'CallExpression' &&
      n.callee?.type === 'MemberExpression' &&
      n.callee.object?.name === 'StyleSheet' &&
      n.callee.property?.name === 'create' &&
      n.arguments[0]?.type === 'ObjectExpression'
    ) {
      for (const prop of n.arguments[0].properties) {
        if (prop.type !== 'ObjectProperty' || prop.value?.type !== 'ObjectExpression') continue;
        const key = prop.key?.name ?? prop.key?.value ?? '?';
        map.set(key, prop.value);
      }
    }
  });
  return map;
};

const resolveStyleRefs = (exprNode, stylesMap, out = []) => {
  if (!exprNode) return out;
  if (exprNode.type === 'JSXExpressionContainer') return resolveStyleRefs(exprNode.expression, stylesMap, out);
  if (exprNode.type === 'MemberExpression' && exprNode.object?.type === 'Identifier' && exprNode.object.name === 'styles' && exprNode.property?.name) {
    const node = stylesMap.get(exprNode.property.name);
    if (node) out.push(node);
    return out;
  }
  if (exprNode.type === 'ObjectExpression') {
    out.push(exprNode);
    return out;
  }
  if (exprNode.type === 'ArrayExpression') {
    for (const el of exprNode.elements) resolveStyleRefs(el, stylesMap, out);
    return out;
  }
  if (exprNode.type === 'ConditionalExpression') {
    resolveStyleRefs(exprNode.consequent, stylesMap, out);
    resolveStyleRefs(exprNode.alternate, stylesMap, out);
    return out;
  }
  if (exprNode.type === 'LogicalExpression') {
    resolveStyleRefs(exprNode.left, stylesMap, out);
    resolveStyleRefs(exprNode.right, stylesMap, out);
    return out;
  }
  return out;
};

// Same nearest-JSX-ancestor map as check-safe-area.mjs (descends through
// attribute values too, not just `children` — a prop-passed element is as
// much a parent as a literal child).
const buildJsxParents = (ast) => {
  const parents = new Map();
  const stack = [];
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node.type === 'JSXElement') {
      parents.set(node, stack[stack.length - 1] ?? null);
      stack.push(node);
      for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'start' || key === 'end' || key === 'range') continue;
        visit(node[key]);
      }
      stack.pop();
      return;
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'start' || key === 'end' || key === 'range') continue;
      visit(node[key]);
    }
  };
  visit(ast);
  return parents;
};

// Is `parentEl` (the candidate's DIRECT JSX parent) itself chrome, per the
// rule above?
const isChromeParent = (parentEl, stylesMap, jsxParents) => {
  if (!parentEl) return false;
  if (jsxParents.get(parentEl) == null) return true; // (a) topmost of its return branch
  const opening = parentEl.openingElement;
  for (const attr of opening?.attributes ?? []) {
    if (attr.type !== 'JSXAttribute' || !isStyleProp(attr.name?.name)) continue;
    const refs = resolveStyleRefs(attr.value, stylesMap);
    if (refs.some(hasAbsoluteFillSpread)) return true; // (b) absoluteFill overlay
  }
  return false;
};

const findChromeTopViolations = (ast, stylesMap, jsxParents) => {
  const candidateKeys = new Map();
  for (const [key, node] of stylesMap.entries()) {
    const posV = getPropValue(node, 'position');
    if (posV?.type !== 'StringLiteral' || posV.value !== 'absolute') continue;
    const topV = getPropValue(node, 'top');
    if (!topV) continue;
    const folded = evalConst(topV);
    if (folded === null) continue; // not a literal — exactly what a real fix looks like
    candidateKeys.set(key, { line: topV.loc.start.line, value: folded });
  }
  if (candidateKeys.size === 0) return [];

  const collectKeyRefs = (n, out) => {
    if (!n) return;
    if (n.type === 'JSXExpressionContainer') return collectKeyRefs(n.expression, out);
    if (n.type === 'MemberExpression' && n.object?.type === 'Identifier' && n.object.name === 'styles' && n.property?.name) {
      if (candidateKeys.has(n.property.name)) out.push(n.property.name);
      return;
    }
    if (n.type === 'ArrayExpression') return n.elements.forEach((el) => collectKeyRefs(el, out));
    if (n.type === 'ConditionalExpression') {
      collectKeyRefs(n.consequent, out);
      collectKeyRefs(n.alternate, out);
      return;
    }
    if (n.type === 'LogicalExpression') {
      collectKeyRefs(n.left, out);
      collectKeyRefs(n.right, out);
    }
  };

  // Violation identity is the StyleSheet.create KEY, not a usage site — a
  // key used from more than one JSX branch (MemoryLane.js's `closeButton`
  // appears in both its error-state and main-state return, same key, same
  // declaration) is one hardcoded chrome constant to fix, not two. Collect
  // the set of keys ever used in a chrome position, then emit one violation
  // per key using the declaration's own line/value.
  const chromeStyleKeys = new Set();
  walk(ast, (node) => {
    if (node.type !== 'JSXElement') return;
    for (const attr of node.openingElement?.attributes ?? []) {
      if (attr.type !== 'JSXAttribute' || !isStyleProp(attr.name?.name)) continue;
      const keyRefs = [];
      collectKeyRefs(attr.value, keyRefs);
      if (keyRefs.length === 0) continue;
      const parentEl = jsxParents.get(node);
      if (!isChromeParent(parentEl, stylesMap, jsxParents)) continue;
      for (const key of keyRefs) chromeStyleKeys.add(key);
    }
  });
  return [...chromeStyleKeys].map((key) => {
    const info = candidateKeys.get(key);
    return { styleKey: key, line: info.line, value: info.value };
  });
};

// --- calibration: known-clean file stays quiet -----------------------------
const accountSrc = fs.readFileSync(path.join(SCREENS_DIR, 'Account.js'), 'utf8');
const accountAst = parse(accountSrc, { sourceType: 'module', plugins: ['jsx'] });
const accountStylesMap = getStylesMap(accountAst);
const accountParents = buildJsxParents(accountAst);
check(
  'calibration: Account.js has zero chrome-top violations',
  findChromeTopViolations(accountAst, accountStylesMap, accountParents),
  []
);

// --- calibration: root-parent shape — a close button as a direct child of
// the returned screen root, must be caught -----------------------------
const ROOT_FIXTURE = `
import { StyleSheet, View } from 'react-native';
export const Screen = () => (
  <View style={styles.container}>
    <PressableScale style={styles.closeButton} />
  </View>
);
const styles = StyleSheet.create({
  container: { flex: 1 },
  closeButton: { position: 'absolute', top: 44 + 16 },
});
`;
const rootAst = parse(ROOT_FIXTURE, { sourceType: 'module', plugins: ['jsx'] });
const rootStylesMap = getStylesMap(rootAst);
const rootParents = buildJsxParents(rootAst);
check(
  'calibration: root-parent shape — absolute top (44+16=60) direct child of the returned screen root is caught',
  findChromeTopViolations(rootAst, rootStylesMap, rootParents),
  [{ styleKey: 'closeButton', line: 10, value: 60 }]
);

// --- calibration: absoluteFill-overlay shape — a dismiss button inside a
// full-bleed scrim that is itself nested (not the literal return root),
// must still be caught ------------------------------------------------
const OVERLAY_FIXTURE = `
import { StyleSheet, View } from 'react-native';
export const Screen = () => (
  <View style={styles.list}>
    <View style={styles.detailOverlay}>
      <PressableScale style={styles.detailClose} />
    </View>
  </View>
);
const styles = StyleSheet.create({
  list: { flex: 1 },
  detailOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center' },
  detailClose: { position: 'absolute', top: 64 },
});
`;
const overlayAst = parse(OVERLAY_FIXTURE, { sourceType: 'module', plugins: ['jsx'] });
const overlayStylesMap = getStylesMap(overlayAst);
const overlayParents = buildJsxParents(overlayAst);
check(
  'calibration: absoluteFill-overlay shape — absolute top inside a nested absoluteFill scrim is caught',
  findChromeTopViolations(overlayAst, overlayStylesMap, overlayParents),
  [{ styleKey: 'detailClose', line: 13, value: 64 }]
);

// --- calibration: bounded-card shape (CreateHive.js themeCheck) — absolute
// top inside a sized, non-full-bleed card must NOT be caught ---------------
const INTERIOR_FIXTURE = `
import { StyleSheet, View } from 'react-native';
export const Screen = () => (
  <View style={styles.container}>
    <View style={styles.grid}>
      <PressableScale style={styles.card}>
        <Icon style={styles.badge} />
      </PressableScale>
    </View>
  </View>
);
const styles = StyleSheet.create({
  container: { flex: 1 },
  grid: { flexDirection: 'row' },
  card: { width: '31%', aspectRatio: 1 },
  badge: { position: 'absolute', top: 8 },
});
`;
const interiorAst = parse(INTERIOR_FIXTURE, { sourceType: 'module', plugins: ['jsx'] });
const interiorStylesMap = getStylesMap(interiorAst);
const interiorParents = buildJsxParents(interiorAst);
check(
  'calibration: bounded-card shape (CreateHive.js themeCheck analogue) — absolute top inside a sized non-full-bleed card is NOT caught',
  findChromeTopViolations(interiorAst, interiorStylesMap, interiorParents),
  []
);

// --- the real sweep ---------------------------------------------------------
const screenFiles = fs.readdirSync(SCREENS_DIR).filter((f) => /\.jsx?$/.test(f)).sort();
check('screen files found under src/screens/', screenFiles.length > 0, true);

const violations = [];
const parseErrors = [];
for (const name of screenFiles) {
  const file = path.join(SCREENS_DIR, name);
  const rel = path.relative(ROOT, file);
  let ast;
  try {
    ast = parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  } catch (e) {
    parseErrors.push(`${rel}: ${e.message}`);
    continue;
  }
  const stylesMap = getStylesMap(ast);
  const jsxParents = buildJsxParents(ast);
  for (const hit of findChromeTopViolations(ast, stylesMap, jsxParents)) {
    violations.push({ file: rel, ...hit });
  }
}
check('every screen file parsed', parseErrors, []);
violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

if (DUMP_JSON) {
  realLog(JSON.stringify({ chromeTop: violations }));
  process.exit(0);
}

console.log(`\n--- unshielded hard-coded chrome position:absolute top (chrome-parent, literal value) (${violations.length}) ---`);
for (const v of violations) {
  console.log(`  ${v.file}:${v.line}  styles.${v.styleKey}.top = ${v.value}`);
}

// Same shape as check-safe-area.mjs's ratchet: real, pre-existing product
// debt (one of the seven — NotesInbox.js:261 — predates this PR; SeedsInbox
// .js:467 predates it too and is a LIVE defect on `main` today, not just a
// candidate: at inset 59 (notch/Dynamic-Island devices) `top: 24` sits
// inside the island's own footprint. Flagged, not silently baselined away —
// see the routing note in the baseline file's `note` field), not a defect
// in this gate. Ratchet against the checked-in baseline so the rest of the
// suite stays green while this shrinks as tracked debt.
const baseline = loadBaseline(path.join(ROOT, 'scripts', 'baselines', 'chrome-top.json'));
const diff = diffAgainstBaseline(violations, baseline.entries, chromeTopKeyOf);
console.log(`\n${diff.stillOpen} already in the baseline (owner: ${baseline.owner}) — ${diff.added.length} new, ${diff.stale.length} baseline rows no longer reproduced`);
for (const v of diff.added) console.log(`  NEW, not in baseline: ${chromeTopKeyOf(v)}  styles.${v.styleKey}.top = ${v.value}`);
for (const v of diff.stale) console.log(`  STALE baseline row, run \`npm run ratchet:update\` to retire it: ${chromeTopKeyOf(v)}`);
check('no unshielded chrome position:absolute top beyond the checked-in ratchet baseline', diff.added, []);
check('every ratchet-baselined chrome-top entry still reproduces (or has been retired via ratchet:update)', diff.stale, []);
check('chrome-top.json owner names an actual owner, not "unassigned"', ownerIsNamed(baseline.owner) ? [] : [baseline.owner], []);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
