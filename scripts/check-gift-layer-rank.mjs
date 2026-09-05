// Gate: the nectar gift layer outranks every sibling that could paint over it.
//
//   npm run check:gift-layer-rank
//
// WHY THIS GATE EXISTS.
//
// `NectarGiftLayer` is the drop that flies from the chosen amount to the entry
// being thanked. On `PackageOpen` it was mounted as the LAST CHILD, and its own
// comment said that was what made it "cross over the entry, the panel and the
// overlay alike". Four lines away in another file, `sendOverlay` declared
// `zIndex: 2` and called itself "above the reveal Pressable, below nothing".
//
// Both sentences were individually true. Together they were wrong: once ANY
// sibling declares a stacking rank, being last stops meaning being on top. The
// overlay won, and the entire Depart beat — the drop leaving the chip, the arc,
// the stain blooming on contact — painted UNDERNEATH an opaque white card from
// the day it shipped.
//
// What makes it worth a gate rather than a fix is how it failed. Nothing was
// misspelled, nothing was missing, no prop was absent. Two correct declarations
// had a wrong RELATIONSHIP, in two files, neither of which is wrong on its own.
// A gate that reads for forbidden strings cannot see that, for the same reason
// the TDZ gate next door had to be a resolver rather than a grep: the defect is
// not in any one token, it is in an ORDER over a set.
//
// And it failed INVISIBLY, which is the part that cost four days. 26
// consecutive screencast frames, 176ms to 610ms, one md5 across all of them,
// while the drop was in the tree the whole time at full opacity and moving. A
// beat you cannot see and a beat that never ran look identical from outside, so
// nobody reported a bug.
//
// SEVEN ROWS, and they are not equally strong:
//
//   G1  universe    files walked, all parsed, zIndex sites found, mounts found.
//                   An enumerator over an empty set is green about nothing.
//   G2  census      AST-captured `zIndex` properties reconcile against a raw
//                   byte scan, with the parser's own comment array accounting
//                   for the prose mentions. This checks the EXTRACTOR: a rank
//                   the walker misses is not a rank G3 finds too high, it is a
//                   rank G3 never asks about.
//   G3  ordering    THE RULED ROW. `GIFT_LAYER_Z` is strictly greater than
//                   every other rank in the app source. Not "the layer has a
//                   zIndex" — presence is satisfied by `zIndex: 1`, which is
//                   the bug with a number on it.
//   G4  wiring      the constant G3 reasons about is the value actually on the
//                   layer's root element. A constant nothing paints is a
//                   number, not a rank.
//   G5  null class  every collected value is a form G3 can compare. A rank
//                   written as an expression is silently outside G3's
//                   quantifier, and that set is a population, not noise.
//   G6  ancestry    at every mount site the layer is a DIRECT child of the
//                   screen root. This is the premise that makes G3 sufficient:
//                   a rank only orders siblings, so a ranked or positioned
//                   ancestor would trap the layer inside a losing box no
//                   matter how large its own number is.
//   G7  witness     G3 and G4 being green only says the tree is clean today.
//                   G7 reconstructs the real defect in memory out of the real
//                   files and REQUIRES the resolvers to red. If the anchors
//                   stop existing this row fails rather than going quiet.
//
// WHY G3 IS A GLOBAL MAXIMUM AND NOT A PAIRWISE COMPARISON WITH `sendOverlay`.
// Sage's review of the finding asked, correctly, that the gate assert relative
// order rather than mere presence, and pointed out that the layer and the
// overlay are siblings only at the `PackageOpen` site. Pairwise is the obvious
// shape and it is the weaker one, for a reason the second mount site shows:
// `CombNectarCompose` mounts the layer next to `<NectarConsentSheet>`, whose
// rank lives in ITS OWN stylesheet in a third file. A pairwise row would have
// to chase every sibling's style across files and would go quiet the moment a
// sibling's rank moved somewhere it was not taught to look. A maximum over the
// whole source needs no such chase and cannot be outflanked by a new rank
// appearing anywhere — which is the property the layer's comment actually
// claims: above everything, not above the thing we happened to think of.
//
// THE HONEST LIMIT, stated because it is the one that matters. This is a source
// gate. It asserts the numbers and the shape of the tree; it does not paint.
// The measurement that found the bug was a screencast, and the measurement that
// confirms the fix on device is a render. G6 is the row that keeps the gap
// narrow, because a ranked ancestor is the one way these numbers can all be
// right and the drop still be buried.

import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const LAYER_REL = 'src/components/NectarGiftLayer.js';
const CONST_NAME = 'GIFT_LAYER_Z';
const COMPONENT = 'NectarGiftLayer';
const LAYER_STYLE = 'layer';

let pass = 0;
const failures = [];
const ok = (label) => { pass += 1; console.log(`  ok   ${label}`); };
const bad = (label, detail) => { failures.push(`${label} — ${detail}`); console.log(`  FAIL ${label} — ${detail}`); };

// ── the tree ────────────────────────────────────────────────────────────────
const files = [];
(function walkDir(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    fs.statSync(p).isDirectory() ? walkDir(p) : /\.jsx?$/.test(name) && files.push(p);
  }
})(SRC);
files.push(path.join(ROOT, 'App.js'));

const PARSE_OPTS = { sourceType: 'module', plugins: ['jsx', 'typescript'] };

// Walk carrying the ancestor chain, so G6 can ask what ENCLOSES a node rather
// than only what a node contains. A containment test is not a resolution.
const walk = (node, cb, stack = []) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => walk(n, cb, stack)); return; }
  if (!node.type) { for (const k in node) { if (k === 'loc') continue; walk(node[k], cb, stack); } return; }
  cb(node, stack);
  stack.push(node);
  for (const k in node) { if (k === 'loc') continue; walk(node[k], cb, stack); }
  stack.pop();
};

// ── the value classifier, written as a UNIVERSAL ─────────────────────────────
// Every branch returns a kind. A value matching no branch is `unclassified`,
// which is a FAILURE in G5 rather than an absence nobody counts. A classifier
// written as a list of forbidden shapes has a null class, and the null class is
// a population.
const classify = (node) => {
  if (!node) return { kind: 'unclassified', text: '(missing)' };
  if (node.type === 'NumericLiteral') return { kind: 'literal', value: node.value, text: String(node.value) };
  if (node.type === 'UnaryExpression' && node.operator === '-' && node.argument?.type === 'NumericLiteral') {
    return { kind: 'literal', value: -node.argument.value, text: `-${node.argument.value}` };
  }
  if (node.type === 'Identifier') return { kind: 'identifier', name: node.name, text: node.name };
  return { kind: 'unclassified', text: node.type };
};

// ── the collector, as a function so G7 can re-run it on mutated source ──────
const RAW_ZINDEX = /\bzIndex\b/g;
const collect = (sources) => {
  const ranks = [];       // every `zIndex:` property in the tree
  const mounts = [];      // every `<NectarGiftLayer` mount, with its JSX ancestry
  const parseFailures = [];
  let rawTotal = 0;
  let commentTotal = 0;

  for (const { rel, code } of sources) {
    rawTotal += (code.match(RAW_ZINDEX) ?? []).length;
    let ast;
    try { ast = parse(code, PARSE_OPTS); }
    catch (err) { parseFailures.push(`${rel}: ${err.message}`); continue; }
    for (const c of ast.comments ?? []) commentTotal += (c.value.match(RAW_ZINDEX) ?? []).length;

    walk(ast, (node, stack) => {
      if (node.type === 'ObjectProperty' && !node.computed) {
        const key = node.key?.name ?? node.key?.value;
        if (key === 'zIndex') {
          ranks.push({ site: `${rel}:${node.loc?.start.line ?? '?'}`, rel, ...classify(node.value) });
        }
      }
      if (node.type === 'JSXOpeningElement' && node.name?.type === 'JSXIdentifier' && node.name.name === COMPONENT) {
        // Fragments and conditionals render no box, so only JSXElement
        // ancestors can hold a style, a position or a rank. The mount's OWN
        // JSXElement is on the stack too (an opening element is a child of the
        // element it opens) and is excluded: a containment test is not a
        // resolution, and counting yourself as your own ancestor is the way
        // this row would have reported every mount as nested.
        const enclosing = stack
          .filter((a) => a.type === 'JSXElement' && a.openingElement !== node)
          .map((a) => `${a.openingElement?.name?.name ?? '?'}:${a.loc?.start.line ?? '?'}`);
        mounts.push({ site: `${rel}:${node.loc?.start.line ?? '?'}`, enclosing });
      }
    });
  }
  return { ranks, mounts, parseFailures, rawTotal, commentTotal };
};

// ── the wiring resolver, also re-runnable ───────────────────────────────────
// Answers three questions about NectarGiftLayer.js that G4 needs and G7
// mutates: what is the constant worth, does the `layer` style read it, and is
// `styles.layer` the style of the component's OUTERMOST element.
const resolveWiring = (code) => {
  const out = { constValue: null, exported: false, styleReads: null, rootStyled: false, rootTag: null };
  let ast;
  try { ast = parse(code, PARSE_OPTS); } catch (err) { out.parseError = err.message; return out; }

  walk(ast, (node, stack) => {
    if (node.type === 'VariableDeclarator' && node.id?.name === CONST_NAME) {
      const v = classify(node.init);
      if (v.kind === 'literal') out.constValue = v.value;
      out.exported = stack.some((a) => a.type === 'ExportNamedDeclaration');
    }
    // the `layer:` entry inside StyleSheet.create
    if (node.type === 'ObjectProperty' && !node.computed && (node.key?.name ?? node.key?.value) === LAYER_STYLE) {
      const props = node.value?.type === 'ObjectExpression' ? node.value.properties : [];
      const z = props.find((p) => p.type === 'ObjectProperty' && (p.key?.name ?? p.key?.value) === 'zIndex');
      out.styleReads = z ? classify(z.value).text : null;
    }
    // `style={styles.layer}` on an element with no JSXElement above it
    if (node.type === 'JSXAttribute' && node.name?.name === 'style') {
      const e = node.value?.expression;
      if (e?.type === 'MemberExpression' && e.object?.name === 'styles' && e.property?.name === LAYER_STYLE) {
        // Same self-exclusion as the mount walk above: the element this
        // attribute belongs to is on the stack, and it is not its own ancestor.
        const owner = stack.filter((a) => a.type === 'JSXOpeningElement').pop();
        const enclosing = stack.filter((a) => a.type === 'JSXElement' && a.openingElement !== owner);
        if (enclosing.length === 0) { out.rootStyled = true; out.rootTag = owner?.name?.name ?? '?'; }
      }
    }
  });
  return out;
};

const sources = files.map((f) => ({ rel: path.relative(ROOT, f), code: fs.readFileSync(f, 'utf8') }));
const { ranks, mounts, parseFailures, rawTotal, commentTotal } = collect(sources);
const layerSource = sources.find((s) => s.rel === LAYER_REL)?.code ?? '';
const wiring = resolveWiring(layerSource);

// The ordering predicate G3 asserts and G7 mutates. Returns the offenders.
const outrankedBy = (rankList, ceiling) => rankList
  .filter((r) => r.kind === 'literal' && ceiling !== null && r.value >= ceiling);

// ── G1 universe ─────────────────────────────────────────────────────────────
if (files.length > 0 && parseFailures.length === 0 && ranks.length > 0 && mounts.length > 0) {
  ok(`G1 universe: ${files.length} source files, all parsed, ${ranks.length} \`zIndex\` site(s), ${mounts.length} <${COMPONENT}> mount(s)`);
} else {
  bad('G1 universe', parseFailures.length
    ? `${parseFailures.length} file(s) failed to parse, so every row below ran on a partial tree: ${parseFailures.join('; ')}`
    : `${files.length} file(s) walked, ${ranks.length} zIndex site(s), ${mounts.length} mount(s). A maximum over an empty set is not a maximum.`);
}

// ── G2 census reconciliation ────────────────────────────────────────────────
// G3 quantifies over `ranks`, so a rank the walker never collected is a rank G3
// is silent about, not one it clears. The raw byte scan is an independent count
// of the same word; the parser's comment array accounts for the prose mentions,
// of which this repo has many because the bug had to be written down where it
// happened. Anything left over is a `zIndex` living somewhere neither reader
// expects — a string, a template, a computed key — and that reds here rather
// than quietly shrinking G3's population.
const accounted = ranks.length + commentTotal;
if (accounted === rawTotal && ranks.length > 0) {
  ok(`G2 census: ${rawTotal} raw \`zIndex\` occurrence(s) = ${ranks.length} style propert(ies) + ${commentTotal} in comments, reconciling exactly`);
} else {
  bad('G2 census',
    `a raw byte scan finds ${rawTotal} \`zIndex\` occurrence(s); the AST accounts for ${accounted} (${ranks.length} style properties + ${commentTotal} inside comments). ` +
    `${rawTotal - accounted} occurrence(s) are in neither, so G3 below is quantifying over a smaller population than the one that ships. Fix the extractor, do not relax this row.`);
}

// ── G3 the ordering ─────────────────────────────────────────────────────────
const others = ranks.filter((r) => r.rel !== LAYER_REL || r.kind !== 'identifier');
const offenders = outrankedBy(others, wiring.constValue);
const highest = others.filter((r) => r.kind === 'literal').sort((a, b) => b.value - a.value)[0];
if (wiring.constValue !== null && offenders.length === 0 && highest) {
  ok(`G3 ordering: ${CONST_NAME} = ${wiring.constValue}, strictly above all ${others.length} other rank(s); the highest is ${highest.value} at ${highest.site}`);
} else if (wiring.constValue === null) {
  bad('G3 ordering', `${CONST_NAME} does not resolve to a numeric literal in ${LAYER_REL}, so there is no ceiling to compare against.`);
} else {
  bad('G3 ordering',
    `${offenders.length} rank(s) are >= ${CONST_NAME} (${wiring.constValue}): ${offenders.map((o) => `${o.site} = ${o.text}`).join(', ')}. ` +
    'The gift layer paints the whole Depart beat and must be above every sibling that could be opaque over the entry. ' +
    `Raise ${CONST_NAME}; do not lower the other rank unless you have reasoned about what that other rank was protecting.`);
}

// ── G4 wiring ───────────────────────────────────────────────────────────────
// G3 reasons about a constant. This row is what makes that reasoning about
// PAINT: the constant is read by the `layer` style, and `styles.layer` is the
// style of the component's outermost element. Drop either link and G3 stays
// green about a number nothing applies.
if (wiring.constValue !== null && wiring.exported && wiring.styleReads === CONST_NAME && wiring.rootStyled) {
  ok(`G4 wiring: ${CONST_NAME} = ${wiring.constValue} is read by \`styles.${LAYER_STYLE}\`, which is the style of <${wiring.rootTag}>, the component's outermost element`);
} else {
  bad('G4 wiring',
    `in ${LAYER_REL}: ${CONST_NAME} resolves to ${wiring.constValue ?? '(not a literal)'}` +
    `, \`styles.${LAYER_STYLE}.zIndex\` reads \`${wiring.styleReads ?? '(no zIndex at all)'}\`` +
    `, and \`styles.${LAYER_STYLE}\` ${wiring.rootStyled ? `is on the root <${wiring.rootTag}>` : 'is NOT on an outermost element'}. ` +
    'All three links are required, or G3 above is an assertion about a number nobody paints.');
}

// ── G5 the null class ───────────────────────────────────────────────────────
// A rank written as anything G3 cannot compare drops out of its quantifier
// without leaving a trace. The one identifier allowed is the layer's own
// constant, in the layer's own file, which G4 has already resolved.
const nullClass = ranks.filter((r) =>
  r.kind === 'unclassified' || (r.kind === 'identifier' && !(r.rel === LAYER_REL && r.name === CONST_NAME)));
if (nullClass.length === 0) {
  ok(`G5 null class: all ${ranks.length} rank(s) are numeric literals, except \`${CONST_NAME}\` in ${LAYER_REL} which G4 resolves`);
} else {
  bad('G5 null class',
    `${nullClass.length} rank(s) are in a form G3 cannot compare: ${nullClass.map((n) => `${n.site} = ${n.text}`).join(', ')}. ` +
    'A computed or imported rank is not caught by G3, it is INVISIBLE to it. Either write a literal, or teach the classifier this shape deliberately.');
}

// ── G6 ancestry ─────────────────────────────────────────────────────────────
// The premise G3 rests on. A rank orders SIBLINGS inside one stacking context,
// so a large number on the layer buys nothing if an ancestor between it and the
// screen root carries a rank or a transform of its own. Today the layer is a
// direct child of the root at both mount sites, which is why a single global
// maximum settles the paint order. Wrap it in anything and this row reds and
// somebody has to redo that reasoning rather than inherit it.
const nested = mounts.filter((m) => m.enclosing.length !== 1);
if (nested.length === 0 && mounts.length > 0) {
  ok(`G6 ancestry: all ${mounts.length} <${COMPONENT}> mount(s) are direct children of their screen root (${mounts.map((m) => `${m.site} under <${m.enclosing[0]}>`).join(', ')})`);
} else {
  bad('G6 ancestry',
    `${nested.length} mount(s) sit deeper than the screen root: ${nested.map((m) => `${m.site} inside [${m.enclosing.join(' > ')}]`).join('; ')}. ` +
    `zIndex only orders siblings, so ${CONST_NAME} stops implying the drop paints on top the moment an ancestor can lose on its behalf. ` +
    'Either mount it at the root again, or replace G3 with a per-site comparison that resolves ancestors.');
}

// ── G7 witness ──────────────────────────────────────────────────────────────
// Green rows above only describe today's tree. Each mutation below rebuilds a
// real failure out of the real files and requires the resolver to catch it, so
// the rows are proven to red by construction rather than assumed to. If these
// anchors ever stop existing the row FAILS; it does not go quiet.
const mutations = [];

// (a) the actual shipped defect: the layer has no rank and loses to a ranked
//     sibling by mount order alone.
{
  const mutated = layerSource.replace(/\n\s*zIndex: GIFT_LAYER_Z,/, '');
  const w = resolveWiring(mutated);
  mutations.push({
    name: 'layer loses its rank',
    anchored: mutated !== layerSource,
    reds: w.styleReads === null,
    saw: `styles.${LAYER_STYLE}.zIndex = ${w.styleReads ?? 'null'}`,
  });
}
// (b) presence without ordering: a rank that exists and is not high enough.
//     This is the row Sage's review asked for by name — a gate that asserted
//     only "the layer has a zIndex" passes this mutation.
{
  const mutated = layerSource.replace(new RegExp(`(${CONST_NAME} = )\\d+`), '$12');
  const w = resolveWiring(mutated);
  const off = outrankedBy(others, w.constValue);
  mutations.push({
    name: 'rank present but equal to sendOverlay',
    anchored: mutated !== layerSource && w.constValue === 2,
    reds: off.length > 0,
    saw: `${off.length} rank(s) >= 2${off.length ? ` (incl. ${off[0].site})` : ''}`,
  });
}
// (c) a NEW rank appearing elsewhere, which is the failure mode a pairwise
//     comparison with sendOverlay would never see.
{
  const target = sources.find((s) => s.rel === 'src/screens/TodayTab.js');
  const mutated = { rel: target.rel, code: target.code.replace(/const styles = StyleSheet\.create\(\{/, 'const styles = StyleSheet.create({\n  __rankProbe: { zIndex: 99 },') };
  const probe = collect([mutated]);
  const off = outrankedBy(probe.ranks, wiring.constValue);
  mutations.push({
    name: 'a rank of 99 appears in an unrelated screen',
    anchored: mutated.code !== target.code,
    reds: off.length === 1 && off[0].value === 99,
    saw: `${off.length} offender(s)${off.length ? ` at ${off[0].site} = ${off[0].text}` : ''}`,
  });
}

const brokenAnchor = mutations.filter((m) => !m.anchored);
const silent = mutations.filter((m) => m.anchored && !m.reds);
if (brokenAnchor.length === 0 && silent.length === 0) {
  ok(`G7 witness: ${mutations.length} reconstructed defects each red their own resolver (${mutations.map((m) => m.name).join('; ')})`);
} else {
  bad('G7 witness',
    (brokenAnchor.length ? `${brokenAnchor.length} mutation(s) found nothing to change, so they tested nothing: ${brokenAnchor.map((m) => m.name).join(', ')}. ` : '') +
    (silent.length ? `${silent.length} mutation(s) applied and the resolver stayed green: ${silent.map((m) => `${m.name} (saw ${m.saw})`).join('; ')}. ` : '') +
    'This row exists so G3 and G4 cannot become decorative. Repair the anchors or the rows, not this row.');
}

console.log(`\n${pass} passed, ${failures.length} failed`);
process.exitCode = failures.length ? 1 : 0;
