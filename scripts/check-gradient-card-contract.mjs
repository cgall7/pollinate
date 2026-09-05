// Gate: every GradientCard mount in src/ carries the `colors` prop it needs.
//
//   npm run check:gradient-card-contract
//
// WHY THIS GATE EXISTS, which is a sharper question than what it asserts.
//
// On 2026-09-05 `OrganizerCombCard.js` mounted `<GradientCard>` with no
// `colors`. GradientCard maps over that prop with no guard, so the mount threw
// `undefined.map` inside render, and App.js's single ErrorBoundary wraps the
// whole navigator, so the throw took the ENTIRE APP to "Something went wrong".
// TodayTab gates the organizer shelf on `organizerCombs.length > 0` and nothing
// else, and CreateComb finishes with `navigation.replace('Main', {screen:
// 'Today'})`, so creating a comb, the core MVP-Comb action, landed the
// organizer on a screen that could not render. The card had shipped four days
// earlier and had never drawn a single frame.
//
// The instrument lesson is the reason this file exists rather than a comment:
// `check-des39-organizer-comb.mjs` held TWENTY green rows about that exact
// card the whole time. A LEXICAL GATE READS SOURCE AND NEVER RENDERS, so a
// REQUIRED PROP THAT IS SIMPLY ABSENT is invisible to it. Absence has no
// string to grep. Every one of those twenty rows asked "does the source say
// X", and none of them could ask "is anything missing".
//
// Absence therefore belongs to an ENUMERATOR. This gate does not look for a
// pattern; it collects the population of GradientCard mounts off the AST and
// asks the contract of each one. A fifth call site that forgets `colors` reds
// G3 by construction, without anybody remembering to add a row for it.
//
// WHAT THIS GATE DELIBERATELY DOES NOT DO, ruled by Lumen at the fix:
// GradientCard does NOT gain a defensive default for `colors`. A silent
// default would convert the next absent prop from a loud crash into an
// invisible paint choice, which is strictly worse than the bug it prevents.
// The prop stays required, the failure stays loud, and G4 pins that so this
// gate cannot quietly become decorative.
//
// FOUR ROWS, and their strengths differ:
//
//   G1  universe     files walked, all parsed, importers found. The usual
//                    counts-before-loops guard: an enumerator over an empty
//                    set is green about nothing.
//   G2  census       AST-captured mounts reconcile against a raw textual scan
//                    for `<GradientCard`. This checks the EXTRACTOR, not the
//                    product: a mount the walker fails to collect would make
//                    G3 green by not asking about it.
//   G3  contract     the ruled row. Every captured mount carries `colors`.
//   G4  loudness     GradientCard destructures `colors` with no default and
//                    does not coalesce it before `.map`. G3's value depends
//                    on absence still being a failure at all.
//
// The honest limit, stated because it is the limit that produced the bug:
// this is still a source gate. It can now see a prop that is absent, which is
// new, but it cannot see a prop that is present and wrong. A render gate is a
// different instrument and is not this file.

import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const COMPONENT = 'GradientCard';

let pass = 0;
const failures = [];
const ok = (label) => { pass += 1; console.log(`  ok   ${label}`); };
const bad = (label, detail) => { failures.push(`${label} — ${detail}`); console.log(`  FAIL ${label} — ${detail}`); };

// ── the extractor ───────────────────────────────────────────────────────────
const files = [];
(function walkDir(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    fs.statSync(p).isDirectory() ? walkDir(p) : /\.jsx?$/.test(name) && files.push(p);
  }
})(SRC);

const walk = (node, cb) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => walk(n, cb)); return; }
  if (node.type) cb(node);
  for (const k in node) { if (k === 'loc') continue; walk(node[k], cb); }
};

const parseFailures = [];
const mounts = [];
let importers = 0;
// The raw textual counterpart G2 reconciles against. `<GradientCard` cannot
// match the closing tag (`</` has the slash between), and `\b` keeps a future
// `<GradientCardHeader` out of the count.
const TEXTUAL_MOUNT = new RegExp(`<${COMPONENT}\\b`, 'g');
let textualMounts = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const code = fs.readFileSync(file, 'utf8');
  textualMounts += (code.match(TEXTUAL_MOUNT) ?? []).length;

  let ast;
  try { ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] }); }
  catch (err) { parseFailures.push(`${rel}: ${err.message}`); continue; }

  walk(ast, (node) => {
    if (node.type === 'ImportDeclaration' &&
        node.specifiers.some((s) => s.local?.name === COMPONENT)) importers += 1;
    if (node.type !== 'JSXOpeningElement') return;
    if (node.name?.type !== 'JSXIdentifier' || node.name.name !== COMPONENT) return;
    const attrs = node.attributes ?? [];
    mounts.push({
      site: `${rel}:${node.loc?.start.line ?? '?'}`,
      // A spread counts as carrying the prop only in the sense that this gate
      // cannot see inside it, so it is recorded separately rather than folded
      // into either verdict.
      hasColors: attrs.some((a) => a.type === 'JSXAttribute' && a.name?.name === 'colors'),
      hasSpread: attrs.some((a) => a.type === 'JSXSpreadAttribute'),
    });
  });
}

// ── G1 universe ─────────────────────────────────────────────────────────────
if (files.length > 0 && parseFailures.length === 0 && importers > 0) {
  ok(`G1 universe: ${files.length} js files under src/, all parsed, ${importers} import ${COMPONENT}`);
} else {
  bad('G1 universe', parseFailures.length
    ? `${parseFailures.length} file(s) failed to parse, so the enumerator below ran on a partial tree: ${parseFailures.join('; ')}`
    : `${files.length} file(s) walked and ${importers} importer(s) found. An enumerator over an empty set passes about nothing.`);
}

// ── G2 census reconciliation ────────────────────────────────────────────────
// This row is about the INSTRUMENT. G3 quantifies over `mounts`, so a mount the
// AST walk never collected is not a mount G3 finds bare, it is a mount G3 never
// sees. The textual scan is a second count of the same population, and it is
// deliberately kept INDEPENDENT of the parse: it runs on the raw bytes before
// the AST exists, so an extractor that goes partly blind cannot take its own
// witness down with it.
//
// The price of that independence, named rather than discovered: writing
// `<GradientCard` inside a COMMENT or a STRING reds this row, because the raw
// scan counts it and the walker correctly does not. That is a known false red
// kept on purpose. Reword the comment; do not teach this row to skip text it
// cannot classify, because "skip what I cannot classify" is the exact hole the
// row exists to close.
if (mounts.length === textualMounts && mounts.length > 0) {
  ok(`G2 census: ${mounts.length} ${COMPONENT} mount(s) captured off the AST, reconciling exactly with ${textualMounts} textual \`<${COMPONENT}\` occurrence(s)`);
} else {
  bad('G2 census',
    `the AST walk captured ${mounts.length} ${COMPONENT} mount(s) but a raw scan for \`<${COMPONENT}\` finds ${textualMounts}. ` +
    'G3 below only asks the contract of what this walk collected, so the two counts must agree or G3 is green about a smaller population than the one that ships. ' +
    'Fix the extractor; do not reconcile by relaxing this row. (If the extra textual hit is a `<GradientCard` written inside a comment or a string, reword it: that false red is documented above and kept on purpose.)');
}

// ── G3 the contract ─────────────────────────────────────────────────────────
const bare = mounts.filter((m) => !m.hasColors && !m.hasSpread);
const spreadOnly = mounts.filter((m) => !m.hasColors && m.hasSpread);
if (bare.length === 0) {
  ok(`G3 contract: all ${mounts.length} ${COMPONENT} mount(s) carry \`colors\` (${mounts.map((m) => m.site).join(', ')})` +
    (spreadOnly.length ? `; ${spreadOnly.length} reach it through a spread this gate cannot read` : ''));
} else {
  bad('G3 contract',
    `${bare.length} ${COMPONENT} mount(s) pass no \`colors\` prop: ${bare.map((m) => m.site).join(', ')}. ` +
    `${COMPONENT} calls \`colors.map\` unguarded, and App.js wraps the whole navigator in ONE ErrorBoundary, so this is not a blank card, it is the app failing to render. ` +
    'The house answer is `colors={theme.gradients.sheen}`, which is what every other call site passes.');
}

// ── G4 loudness ─────────────────────────────────────────────────────────────
// G3 is only worth running while an absent `colors` still fails loudly. A
// default value or a coalesce inside the component would turn the next bare
// mount into a silent paint choice, which no gate and no reviewer would see.
const componentSrc = fs.readFileSync(path.join(SRC, 'components', `${COMPONENT}.js`), 'utf8');
const signature = componentSrc.match(/export const GradientCard = \(\{([^}]*)\}\)/);
const colorsParam = signature?.[1].split(',').map((s) => s.trim()).find((s) => /^colors\b/.test(s));
const coalesced = /colors\s*(?:\?\?|\|\|)/.test(componentSrc) || /(?:\?\?|\|\|)\s*\[\s*\]/.test(componentSrc);
if (colorsParam === 'colors' && !coalesced && /colors\.map\(/.test(componentSrc)) {
  ok(`G4 loudness: ${COMPONENT} destructures \`colors\` with no default and maps it directly, so an absent prop stays a loud failure`);
} else {
  bad('G4 loudness',
    `${COMPONENT}'s \`colors\` parameter reads as \`${colorsParam ?? '(not found in the destructured signature)'}\`` +
    (coalesced ? ' and the component coalesces it before use' : '') +
    '. A defensive default was ruled AGAINST at the 2026-09-05 fix: it converts the next absent prop from a crash into an invisible paint choice. ' +
    'Absence belongs to G3 above, not to a fallback value.');
}

console.log(`\n${pass} passed, ${failures.length} failed`);
process.exitCode = failures.length ? 1 : 0;
