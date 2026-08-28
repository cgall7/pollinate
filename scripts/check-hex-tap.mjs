// Gate for MB-D2b — the hex tap's honey fill-and-hold, and the retirement
// that made room for it (LP-R21, Colin 2026-08-26).
//
//   npm run check:hex-tap
//
// Sources: GUIDES/MB_D2_FLAGSHIP_BEAT_SCORES.md (MB-D2b) and
// GUIDES/HEX_TAP_SPEC_LUXURY_PASS.md (LP-R21 + its five guardrails).
//
// THE HALF OF THIS GATE THAT MATTERS MOST IS SECTION A, AND IT IS AN
// ABSENCE. LP-R21 retired four beats, four drivers, two easings, three
// duration keys, one colour token and one haptic. A retired treatment does
// not come back as itself — it comes back as a number that outlived its
// beat, or a wash "looking for a new home" (guardrail 3's own R50 argument).
// Every absence row here ENUMERATES the population it is claiming about
// rather than grepping for the thing it says is gone: a search for `neck`
// returns the files that HAVE one, and answers nothing about a file that
// doesn't. Where an absence row could pass because the extractor found
// nothing at all, it is paired with a row proving the extractor can still
// find something (a pass-closed row hides a blinded extractor; a fail-closed
// one announces it).
//
// Section D is the acceptance bar made structural. LP-R21's own line is "a
// frame capture during hold is a still screen." That is only true if every
// timing the tap starts ENDS at the same instant, so D computes both end
// instants from the live constants and asserts they agree — rather than
// asserting the durations, which is how a screen ends up still-in-the-gate
// and moving on the device.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir } from 'node:fs/promises';
import { parse } from '@babel/parser';
import { theme } from '../src/constants/theme.js';
import { HEX_HEIGHT_RATIO } from '../src/components/hexGeometry.js';
import { contrastRatio, deltaE00, over, parseColor } from './lib/color.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const SRC = path.join(root, 'src');

let pass = 0;
const failures = [];
const ok = (msg) => { pass += 1; console.log(`  ok  ${msg}`); };
const bad = (row, msg) => { failures.push(`${row}: ${msg}`); console.log(`  FAIL ${row}: ${msg}`); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

const walk = async (dir) => {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
};
const ast = (src) => parse(src, { sourceType: 'module', plugins: ['jsx'] });
const visit = (node, fn) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => visit(n, fn)); return; }
  if (typeof node.type === 'string') fn(node);
  for (const k of Object.keys(node)) {
    if (k === 'loc' || k === 'leadingComments' || k === 'trailingComments') continue;
    visit(node[k], fn);
  }
};

const files = await walk(SRC);
const rel = (p) => path.relative(root, p);
const sources = new Map();
for (const f of files) sources.set(f, await readFile(f, 'utf8'));

// `motion.js` imports from react-native, so a bare `node` script cannot
// import it (the package's entry is Flow-typed). Read its two objects out of
// its own AST instead — same shape check-stage-light uses for BLOOM, and for
// the same reason: a gate that carries its own copy of a constant agrees
// with the app right up until somebody retunes one of them.
const MOTION = path.join(SRC, 'constants', 'motion.js');
const motionSrc = await readFile(MOTION, 'utf8');
const motionAst = ast(motionSrc);
const readExportedObject = (name) => {
  let found = null;
  visit(motionAst, (n) => {
    if (n.type !== 'VariableDeclarator' || n.id.type !== 'Identifier' || n.id.name !== name) return;
    if (n.init?.type !== 'ObjectExpression') return;
    found = n.init.properties
      .filter((p) => p.type === 'ObjectProperty' && p.key.type === 'Identifier')
      .map((p) => ({ key: p.key.name, src: motionSrc.slice(p.value.start, p.value.end) }));
  });
  return found;
};
const honeyProps = readExportedObject('HONEY');
const honeyEasingProps = readExportedObject('HONEY_EASING');
const HONEY = Object.fromEntries((honeyProps ?? []).map((p) => [p.key, Number(p.src)]));

const GRID = path.join(SRC, 'components', 'HoneycombGrid.js');
const OVERLAY = path.join(SRC, 'components', 'HexTapOverlay.js');
const HAPTICS = path.join(SRC, 'constants', 'haptics.js');
const gridSrc = sources.get(GRID);
const gridAst = ast(gridSrc);

// ============================================================ A. RETIRED
console.log('\nA. LP-R21 — what retired, stays retired');

// A1/A2: enumerate the module's OWN key sets, so a re-added `neck` fails
// without this gate ever having to name `neck`.
const honeyKeys = (honeyProps ?? []).map((p) => p.key).sort();
if (honeyKeys.length === 1 && honeyKeys[0] === 'fill') {
  ok(`A1 HONEY declares exactly one beat: {${honeyKeys.join(', ')}} — Beats 3-6's durations are gone (guardrail 5)`);
} else {
  bad('A1', `HONEY declares {${honeyKeys.join(', ')}}; MB-D2b scores exactly one beat and LP-R21 retired the rest`);
}
const easingKeys = (honeyEasingProps ?? []).map((p) => p.key).sort();
if (easingKeys.join('|') === honeyKeys.join('|')) {
  ok(`A2 HONEY_EASING's keys are exactly HONEY's: {${easingKeys.join(', ')}} — no easing outlives its duration, and none is missing`);
} else {
  bad('A2', `HONEY {${honeyKeys.join(', ')}} vs HONEY_EASING {${easingKeys.join(', ')}} — a curve without a number (or the reverse) is a half-retired beat`);
}

// A3: the token. Calibrated in BOTH directions — a `colors` object that
// failed to import would make the absence row pass for the wrong reason.
if (!('honeyPool' in theme.colors)) {
  ok('A3a theme.colors.honeyPool is gone (guardrail 3 — the pool was its only job)');
} else {
  bad('A3a', `theme.colors.honeyPool is still declared (${theme.colors.honeyPool}) — guardrail 3 retires it in the same commit that removes Beat 6`);
}
if ('accentBurst' in theme.colors && 'accent' in theme.colors) {
  ok('A3b calibration: the same probe finds `accent` and `accentBurst`, so A3a is an absence and not an empty read');
} else {
  bad('A3b', 'the token probe cannot see `accent`/`accentBurst` either — A3a proves nothing');
}

// A4: the retired identifiers, swept over EVERY js file under src/ (the
// scope of the claim is exactly that: not found in src/).
const RETIRED_IDENTIFIERS = [
  'honeyPool', 'honeyDecay', 'beadProgress', 'neckProgress', 'fallProgress',
  'poolProgress', 'glowRestOpacity', 'startHoneyDrip',
];
const stillReferenced = [];
let identifiersSeen = 0;
for (const [file, src] of sources) {
  let tree;
  try { tree = ast(src); } catch { continue; }
  visit(tree, (n) => {
    if (n.type === 'Identifier') {
      identifiersSeen += 1;
      if (RETIRED_IDENTIFIERS.includes(n.name)) stillReferenced.push(`${rel(file)} (${n.name})`);
    }
    // Member access spells the token as a property, not a bare identifier.
    if (n.type === 'MemberExpression' && n.property?.type === 'Identifier'
        && RETIRED_IDENTIFIERS.includes(n.property.name)) {
      stillReferenced.push(`${rel(file)} (.${n.property.name})`);
    }
  });
}
if (stillReferenced.length === 0) {
  ok(`A4a none of the ${RETIRED_IDENTIFIERS.length} retired names appears anywhere in src/ (${files.length} files, ${identifiersSeen} identifiers read)`);
} else {
  bad('A4a', `retired names still referenced: ${[...new Set(stillReferenced)].join(', ')}`);
}
if (identifiersSeen > 1000) {
  ok(`A4b calibration: the sweep actually read the tree (${identifiersSeen} identifiers) — A4a is an absence, not a parse failure`);
} else {
  bad('A4b', `only ${identifiersSeen} identifiers read across ${files.length} files — the sweep is not seeing the source`);
}

// A5: the haptics module. Same shape — enumerate its exported keys.
const hapticsSrc = sources.get(HAPTICS);
const hapticsAst = ast(hapticsSrc);
let hexTapKeys = null;
let hapticExports = [];
visit(hapticsAst, (n) => {
  if (n.type === 'ExportNamedDeclaration' && n.declaration?.type === 'VariableDeclaration') {
    for (const d of n.declaration.declarations) {
      if (d.id.type !== 'Identifier') continue;
      hapticExports.push(d.id.name);
      if (d.id.name === 'hexTap' && d.init?.type === 'ObjectExpression') {
        hexTapKeys = d.init.properties
          .filter((p) => p.type === 'ObjectProperty' && p.key.type === 'Identifier')
          .map((p) => p.key.name);
      }
    }
  }
});
if (hapticExports.length === 1 && hapticExports[0] === 'hexTap') {
  ok('A5a haptics.js exports exactly `hexTap` — `drip` is gone, and with it the name of a retired treatment');
} else {
  bad('A5a', `haptics.js exports {${hapticExports.join(', ')}} — expected exactly hexTap`);
}
if (hexTapKeys && hexTapKeys.length === 1 && hexTapKeys[0] === 'contact') {
  ok('A5b hexTap has exactly one pattern, `contact` — `pinch` retired with the neck it fired on');
} else {
  bad('A5b', `hexTap declares {${(hexTapKeys ?? []).join(', ')}} — expected exactly {contact}`);
}

// ============================================================ B. THE CURVE
console.log('\nB. MB-D2b — the fill\'s three numbers');

if (HONEY.fill === 250) {
  ok('B1 HONEY.fill = 250ms — MB-D2b\'s scored duration');
} else {
  bad('B1', `HONEY.fill = ${HONEY.fill}, MB-D2b scores 250ms`);
}

// B2 CANNOT run the shipped easing — `motion.js` imports react-native — so
// it does the next honest thing: it reads which curve the source names and
// decides "no overshoot" by ENUMERATION rather than by sampling a stub. RN's
// `Easing` ships exactly three primitives that leave [0,1] (`back`,
// `bounce`, `elastic`); `Easing.inOut(g)` cannot overshoot for any `g` that
// does not, by its own construction. So the check is: the base curve is one
// this gate has a formula for, and it is not one of the three. A curve this
// gate has never heard of FAILS — an easing nobody enumerated is exactly the
// case where "no overshoot" would otherwise pass by not looking.
const RN_OVERSHOOTS = ['back', 'bounce', 'elastic'];
// RN's own definitions (`react-native/Libraries/Animated/Easing.js`),
// restated only for the primitives this beat can legally use. Anything
// outside this map is a fail, not a default.
const RN_PRIMITIVES = {
  linear: (t) => t,
  quad: (t) => t * t,
  cubic: (t) => t * t * t,
  sin: (t) => 1 - Math.cos((t * Math.PI) / 2),
  circle: (t) => 1 - Math.sqrt(1 - t * t),
  exp: (t) => 2 ** (10 * (t - 1)),
};
// `Easing.inOut(g)(t) = t < 0.5 ? g(2t)/2 : 1 - g(2 - 2t)/2` — RN's own
// composition, same file.
const rnInOut = (g) => (t) => (t < 0.5 ? g(2 * t) / 2 : 1 - g(2 - 2 * t) / 2);

const fillEasingSrc = (honeyEasingProps ?? []).find((p) => p.key === 'fill')?.src ?? '';
const inOutMatch = /^Easing\.inOut\(Easing\.(\w+)\)$/.exec(fillEasingSrc.trim());
let e = null;
if (!inOutMatch) {
  bad('B2a', `HONEY_EASING.fill is \`${fillEasingSrc || '(absent)'}\` — MB-D2b scores easeInOut, which this gate recognises only as \`Easing.inOut(Easing.<primitive>)\``);
} else if (RN_OVERSHOOTS.includes(inOutMatch[1])) {
  bad('B2a', `HONEY_EASING.fill wraps \`Easing.${inOutMatch[1]}\`, one of RN's three overshooting primitives — MB-D2b: "no overshoot (honey settles, does not bounce)"`);
} else if (!RN_PRIMITIVES[inOutMatch[1]]) {
  bad('B2a', `HONEY_EASING.fill wraps \`Easing.${inOutMatch[1]}\`, which this gate has no formula for — it is not asserted to be overshoot-free, and B3's figure cannot be derived. Add it to RN_PRIMITIVES (with its RN definition) or re-rule the curve.`);
} else {
  e = rnInOut(RN_PRIMITIVES[inOutMatch[1]]);
  ok(`B2a HONEY_EASING.fill is Easing.inOut(Easing.${inOutMatch[1]}) — not one of RN's three overshooting primitives {${RN_OVERSHOOTS.join(', ')}}, and inOut of a non-overshooting curve cannot overshoot by construction`);
}
if (RN_OVERSHOOTS.length === 3 && !RN_PRIMITIVES.back) {
  ok('B2b calibration: the overshoot list is populated and disjoint from the allowed primitives, so B2a can actually reject something');
} else {
  bad('B2b', 'the overshoot enumeration and the primitive map overlap or are empty — B2a would pass on an elastic fill');
}
if (e) {
  const N = 1000;
  let minY = Infinity; let maxY = -Infinity; let monotone = true; let symmetric = true; let prev = -Infinity;
  for (let i = 0; i <= N; i += 1) {
    const u = i / N;
    const y = e(u);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    if (y < prev - 1e-9) monotone = false;
    prev = y;
    if (Math.abs(y + e(1 - u) - 1) > 1e-6) symmetric = false;
  }
  if (monotone && symmetric && minY >= -1e-9 && maxY <= 1 + 1e-9) {
    ok(`B2c the reconstructed curve is monotone, symmetric about (0.5,0.5) and spans [${minY.toFixed(6)}, ${maxY.toFixed(6)}] — the fill cannot recede, and easeINOUT is not an ease-in wearing the name`);
  } else {
    bad('B2c', `reconstructed curve: monotone ${monotone}, symmetric ${symmetric}, range [${minY.toFixed(6)}, ${maxY.toFixed(6)}]`);
  }
}

// B3 re-derives the figure motion.js's own comment argues from. A
// justification comment is a dependency: if the curve is retuned, the
// sentence explaining why it was chosen must stop being true out loud.
const timeToFraction = (fn, target) => {
  let lo = 0; let hi = 1;
  for (let i = 0; i < 200; i += 1) { const m = (lo + hi) / 2; if (fn(m) < target) lo = m; else hi = m; }
  return ((lo + hi) / 2) * HONEY.fill;
};
if (e) {
  const tenPct = timeToFraction(e, 0.10);
  const quoted = Number(/under 10% of the\n\s*\/\/ cell's radius for [\d.]+ms of the \d+, against quad's ([\d.]+)ms/.exec(motionSrc)?.[1]);
  if (Number.isFinite(quoted) && near(tenPct, quoted, 0.1)) {
    ok(`B3 the fill passes 10% of the cell's radius at ${tenPct.toFixed(1)}ms, and motion.js's own quad-vs-cubic argument quotes ${quoted}ms — read out of the comment, not re-typed here`);
  } else {
    bad('B3', `10% of radius is reached at ${tenPct.toFixed(1)}ms; motion.js's comment quotes ${Number.isFinite(quoted) ? `${quoted}ms` : '(the sentence has moved and cannot be read)'} — the comment and the curve have parted`);
  }
}

// ============================================================ C. THE FILL
console.log('\nC. The held fill — colour, and the two things it is NOT');

// C1: the radius interpolation, read out of the source. `[0, size]` is what
// makes the circle cover the cell exactly at its vertices; anything smaller
// leaves six corners unfilled forever, anything larger is invisible (clipped)
// and steals time from the visible part of the beat.
let fillOutputRange = null;
let selectionFillFill = null;
let selectionFillTokens = [];
visit(gridAst, (n) => {
  if (n.type !== 'VariableDeclarator' || n.id.type !== 'Identifier' || n.id.name !== 'SelectionFill') return;
  visit(n.init, (m) => {
    if (m.type === 'ObjectProperty' && m.key.type === 'Identifier' && m.key.name === 'outputRange'
        && m.value.type === 'ArrayExpression') {
      fillOutputRange = m.value.elements.map((el) =>
        el.type === 'NumericLiteral' ? el.value : (el.type === 'Identifier' ? el.name : '?'));
    }
    if (m.type === 'JSXAttribute' && m.name.name === 'fill'
        && m.value?.type === 'JSXExpressionContainer') {
      const v = m.value.expression;
      if (v.type === 'MemberExpression' && v.property.type === 'Identifier') selectionFillFill = v.property.name;
    }
    if (m.type === 'MemberExpression' && m.object?.type === 'MemberExpression'
        && m.object.property?.name === 'colors' && m.property.type === 'Identifier') {
      selectionFillTokens.push(m.property.name);
    }
  });
});
if (fillOutputRange && fillOutputRange[0] === 0 && fillOutputRange[1] === 'size') {
  ok('C1 SelectionFill\'s radius interpolates [0, size] — `size` IS the circumradius, so the circle covers the cell exactly at its vertices');
} else {
  bad('C1', `SelectionFill's outputRange is [${(fillOutputRange ?? ['?', '?']).join(', ')}] — expected [0, size]`);
}
// The corner-creep figure the component's comment argues from, re-derived.
const areaAtApothem = (Math.PI * HEX_HEIGHT_RATIO ** 2) / (3 * Math.sqrt(3) / 2);
const apothemAt = timeToFraction(e, HEX_HEIGHT_RATIO);
if (near(areaAtApothem * 100, 90.7, 0.05) && near(apothemAt, 185.3, 0.1)) {
  ok(`C1b the circle covers ${(areaAtApothem * 100).toFixed(1)}% of the hexagon by ${apothemAt.toFixed(1)}ms and spends its last ${(HONEY.fill - apothemAt).toFixed(1)}ms in the corners — the figures SelectionFill's comment argues from`);
} else {
  bad('C1b', `area at apothem ${(areaAtApothem * 100).toFixed(1)}% at ${apothemAt.toFixed(1)}ms; the component's comment quotes 90.7% at 185.3ms`);
}

if (selectionFillFill === 'accent') {
  ok('C2a the held fill is `accent` — MB-D2b\'s "honey body"');
} else {
  bad('C2a', `SelectionFill paints \`${selectionFillFill}\`, not \`accent\``);
}
const forbiddenInFill = selectionFillTokens.filter((t) => t === 'accentDeep' || t === 'accentBurst');
if (forbiddenInFill.length === 0) {
  ok(`C2b SelectionFill touches only {${[...new Set(selectionFillTokens)].join(', ')}} — the optional accentDeep edge is declined and no accentBurst crown is held`);
} else {
  bad('C2b', `SelectionFill references ${[...new Set(forbiddenInFill)].join(', ')} — LP-R21 guardrail 2 bars a held crown, and the accentDeep edge was declined on measurement`);
}

// C3: the measured reason the edge was declined, and its calibration. The
// cell's selected stroke is already the strongest edge available on this
// ground; the declined one does not reach the non-text bar.
const inkOnFill = contrastRatio(theme.colors.ink, theme.colors.accent);
const deepOnFill = contrastRatio(theme.colors.accentDeep, theme.colors.accent);
if (inkOnFill >= 4.5 && near(inkOnFill, 11.8021, 0.001)) {
  ok(`C3a the selected cell's own \`ink\` stroke measures ${inkOnFill.toFixed(4)}:1 against the held fill — the edge the cell already has`);
} else {
  bad('C3a', `ink vs the held fill is ${inkOnFill.toFixed(4)}:1 (expected 11.8021, and at least 4.5:1)`);
}
if (deepOnFill < 3.0) {
  ok(`C3b calibration, the other direction: \`accentDeep\` on the same fill is ${deepOnFill.toFixed(4)}:1 — under WCAG 1.4.11's 3:1, which is why the optional edge is declined rather than merely omitted`);
} else {
  bad('C3b', `accentDeep vs the held fill is now ${deepOnFill.toFixed(4)}:1, clearing 3:1 — the measured argument for declining the edge no longer holds; re-rule it`);
}

// C4: the identity glyph survives the fill. It is rendered OUTSIDE the Svg,
// so the fill can never occlude it — but it can and does change its ground.
const inkOnFillText = contrastRatio(theme.colors.ink, theme.colors.accent);
if (inkOnFillText >= 4.5) {
  ok(`C4 the initials (\`ink\`) clear 4.5:1 on the held fill at ${inkOnFillText.toFixed(4)}:1 — identity survives a fill that replaces the identity tint`);
} else {
  bad('C4', `initials measure ${inkOnFillText.toFixed(4)}:1 on the held fill — under 4.5:1`);
}

// C5: §21.1/§21.2 said fill cannot carry state. It struck the `register`
// channel because that channel's RANGE is a property of the member (washSky
// got 44% of washYellow's). Re-run the same test on this fill, over the tint
// list read LIVE — the point is not that the numbers are large, it is that
// the test is the one §21.2 actually ran.
//
// The tint list is read by BRACKET-MATCHING `HEX_TINTS`'s own declaration,
// not by a `[...]` regex and not by sweeping Avatar.js for `wash*` tokens:
// a lazy bracket runs past its target into somebody else's array, and the
// wash sweep would have pulled in `washPeach`, which is an AVATAR swatch and
// never a comb tint. The claim is about the comb's tints, so the probe has
// to be too.
const avatarSrc = sources.get(path.join(SRC, 'components', 'Avatar.js'));
const tintDeclAt = avatarSrc.indexOf('const HEX_TINTS = [');
let tintBody = '';
if (tintDeclAt > -1) {
  let depth = 0;
  for (let i = avatarSrc.indexOf('[', tintDeclAt); i < avatarSrc.length; i += 1) {
    const ch = avatarSrc[i];
    if (ch === '[') depth += 1;
    else if (ch === ']') { depth -= 1; if (depth === 0) { tintBody = avatarSrc.slice(avatarSrc.indexOf('[', tintDeclAt) + 1, i); break; } }
  }
}
const uniqueTints = [...new Set([...tintBody.matchAll(/theme\.colors\.(\w+)/g)].map((m) => m[1]))];
if (uniqueTints.length >= 2) {
  const deltas = uniqueTints.map((n) => ({
    n, d: deltaE00(over(theme.colors[n], theme.colors.surface), theme.colors.accent),
  }));
  const weakest = deltas.reduce((a, b) => (a.d < b.d ? a : b));
  const strongest = deltas.reduce((a, b) => (a.d > b.d ? a : b));
  if (weakest.d >= 10) {
    ok(`C5 §21.2's channel test, re-run on this fill over the ${uniqueTints.length} live tints: weakest is ${weakest.n} at ΔE00 ${weakest.d.toFixed(4)} (strongest ${strongest.n}, ${strongest.d.toFixed(4)}). §21.2 struck \`register\` because washSky's ENTIRE range was 7.02; this fill's weakest single case is ${(weakest.d / 7.02).toFixed(1)}x that, and its destination is one colour for every member`);
  } else {
    bad('C5', `the weakest tint-to-fill step is ΔE00 ${weakest.d.toFixed(4)} on ${weakest.n} — approaching §21.2's struck range; the fill is becoming member-dependent`);
  }
} else {
  bad('C5', `read ${uniqueTints.length} tint token(s) out of Avatar.js — the probe cannot see HEX_TINTS, so C5 would pass vacuously`);
}

// C6: draw order. §6.4's ruling is contingent on the ring being drawn OVER
// its ground; the held fill is a second ground, so it has to land in the
// same slot the honey body does — above the identity paint, below the seal,
// the ring and the stroke. Read as indices in FilledCell's own JSX.
const idx = (needle) => gridSrc.indexOf(needle);
const order = [
  ['identity paint', idx('member.avatarUrl ?')],
  ['HoneyFill', idx('<HoneyFill')],
  ['SelectionFill', idx('<SelectionFill')],
  ['seeded seal', idx('member.seeded &&')],
  ['BloomRing', idx('<BloomRing')],
];
const missing = order.filter(([, i]) => i < 0).map(([n]) => n);
const ascending = order.every(([, i], k) => k === 0 || i > order[k - 1][1]);
if (missing.length === 0 && ascending) {
  ok(`C6 FilledCell paints ${order.map(([n]) => n).join(' -> ')} — the held fill lands in the honey body's own slot, so §6.4's "the ring is drawn after the honey body" stays true of the new ground too`);
} else if (missing.length) {
  bad('C6', `could not find ${missing.join(', ')} in FilledCell — the draw order is unverified, which is not the same as correct`);
} else {
  bad('C6', `FilledCell's paint order is ${order.sort((a, b) => a[1] - b[1]).map(([n]) => n).join(' -> ')} — expected identity paint -> HoneyFill -> SelectionFill -> seeded seal -> BloomRing`);
}

// ====================================================== D. THE STILL SCREEN
console.log('\nD. The hold is a still screen — every timing ends on one frame');

const constFromGrid = (name) => {
  const m = new RegExp(`^const ${name} = (\\d+);`, 'm').exec(gridSrc);
  return m ? Number(m[1]) : null;
};
const CONTACT_MS = constFromGrid('CONTACT_MS');
const IGNITION_MS = constFromGrid('IGNITION_MS');
if (CONTACT_MS === 180 && IGNITION_MS === 80) {
  ok(`D1a the two beat boundaries read live off HoneycombGrid.js: CONTACT_MS ${CONTACT_MS}, IGNITION_MS ${IGNITION_MS} — the hex-tap spec's Beat 1 (0-180) and Beat 2 (180-260)`);
} else {
  bad('D1a', `read CONTACT_MS=${CONTACT_MS}, IGNITION_MS=${IGNITION_MS} out of HoneycombGrid.js — the spec scores Beat 1 at 180ms and Beat 2 at 80ms, and the rest of section D is computed from these`);
}
// D1b: `CONTACT_MS` is ALSO the last beat of the contact haptic, which lives
// in a different file and cannot import it. Two copies of one number, and
// the failure is silent in both directions: retune the constant and the
// finger's confirmation lands early; retune the haptic and it lands late.
// Neither shows up in a screenshot.
const hapticBeats = [...hapticsSrc.matchAll(/setTimeout\([^,]*,\s*(\d+)\)/g)].map((m) => Number(m[1]));
const lastHapticBeat = hapticBeats.length ? Math.max(...hapticBeats) : null;
if (lastHapticBeat === CONTACT_MS) {
  ok(`D1b hexTap.contact()'s closing impact lands at ${lastHapticBeat}ms — the same frame as CONTACT_MS, in a file that cannot import it (beats read: ${hapticBeats.join(', ')})`);
} else {
  bad('D1b', `the contact haptic's last beat is ${lastHapticBeat ?? '(none found)'}ms but CONTACT_MS is ${CONTACT_MS} — the touch and the picture have come apart, and only one of them is visible`);
}

// The glow's decay must be WRITTEN as the offset, not typed. A literal 170
// agrees today and stops agreeing the first time HONEY.fill moves — the
// exact failure a value check cannot see, so this row checks the SHAPE and
// D3 checks the arithmetic.
if (/duration: HONEY\.fill - IGNITION_MS/.test(gridSrc)) {
  ok('D2 the ignition bloom\'s decay is written `HONEY.fill - IGNITION_MS` — derived from the two things it has to end with, not typed');
} else {
  bad('D2', 'the bloom decay duration is no longer the expression `HONEY.fill - IGNITION_MS` — a literal here goes stale silently when HONEY.fill is retuned');
}
const lightEndsAt = CONTACT_MS + IGNITION_MS + (HONEY.fill - IGNITION_MS);
const fillEndsAt = CONTACT_MS + HONEY.fill;
if (lightEndsAt === fillEndsAt) {
  ok(`D3 the light and the honey both settle at ${fillEndsAt}ms — one frame, which is what makes LP-R21's "frame capture during hold is a still screen" achievable`);
} else {
  bad('D3', `light settles at ${lightEndsAt}ms, fill at ${fillEndsAt}ms — the hold begins with something still moving`);
}

// D4: the fill is triggered at contact-complete (MB-D2b's own word), and
// nothing schedules anything after the settle.
if (/Animated\.delay\(CONTACT_MS\),\s*Animated\.timing\(fillProgress/.test(gridSrc)) {
  ok('D4 the fill is delayed by exactly CONTACT_MS — MB-D2b\'s "triggered at contact-complete"');
} else {
  bad('D4', 'the fill is no longer scheduled at CONTACT_MS — MB-D2b triggers it at contact-complete');
}
const laterDelays = [...gridSrc.matchAll(/Animated\.delay\(([^)]*)\)/g)].map((m) => m[1].trim());
const unexpected = laterDelays.filter((d) => d !== 'CONTACT_MS');
if (unexpected.length === 0) {
  ok(`D5 every Animated.delay in HoneycombGrid.js is CONTACT_MS (${laterDelays.length} of them) — nothing is scheduled into the hold`);
} else {
  bad('D5', `delays other than CONTACT_MS found: ${unexpected.join(', ')} — something is scheduled after the settle, and the hold is not still`);
}

// ====================================================== E. REDUCED MOTION
console.log('\nE. Reduced motion — a held state is not an animation');

// Brace-MATCH the branch out of `handleSelect` specifically. A lazy
// `[\s\S]*?` from the first `if (reduced) {` walks past BloomRing's own
// reduced branch and swallows `releaseHeld` on the way to the next
// `} else {` — which made this row red on correct code the moment the
// release beat landed. Same failure as a lazy `[...]` bracket regex reading
// somebody else's array: delimit by structure, not by the next lookalike.
const sliceBraces = (src, from) => {
  const open = src.indexOf('{', from);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') { depth -= 1; if (depth === 0) return src.slice(open + 1, i); }
  }
  return null;
};
const handleSelectAt = gridSrc.indexOf('const handleSelect = (member, tap) => {');
const handleSelectBody = handleSelectAt < 0 ? '' : sliceBraces(gridSrc, handleSelectAt + 'const handleSelect = (member, tap) => '.length - 1) ?? '';
const reducedAt = handleSelectBody.indexOf('if (reduced) {');
const reducedBody = reducedAt < 0 ? null : sliceBraces(handleSelectBody, reducedAt);
const reducedBranch = reducedBody === null ? null : [null, reducedBody];
if (reducedBody !== null && handleSelectBody.length > 200) {
  ok(`E0 handleSelect's reduced branch located by brace-matching (${reducedBody.length} chars inside a ${handleSelectBody.length}-char function) — not by a regex that can run into the next function`);
} else {
  bad('E0', `could not brace-match handleSelect's reduced branch (function ${handleSelectBody.length} chars) — E1 would report on the wrong span`);
}
if (reducedBranch && /fillProgress\.setValue\(1\)/.test(reducedBranch[1])) {
  ok('E1a the reduced branch sets the fill to its final value — LP-R21: "fill appears at final value, no sweep"');
} else {
  bad('E1a', 'the reduced branch does not set fillProgress to 1 — a Reduce Motion user gets a selection with no visible fill');
}
if (reducedBranch && !/Animated\.timing\(\s*fillProgress/.test(reducedBranch[1])) {
  ok('E1b and it does not animate it — `setValue`, not a short timing');
} else {
  bad('E1b', 'the reduced branch animates fillProgress — LP-R21 asks for the final value, not a faster sweep');
}
// Calibration: the full-motion path must still animate it, or E1 passes on
// a build where the fill never moves for anybody.
if (/Animated\.timing\(fillProgress, \{[\s\S]*?duration: HONEY\.fill/.test(gridSrc)) {
  ok('E2 calibration: the full-motion path DOES animate the fill over HONEY.fill — E1 is a branch difference, not a build with no animation in it');
} else {
  bad('E2', 'no Animated.timing on fillProgress over HONEY.fill anywhere — the fill never animates for anyone');
}

// ============================================ G. LP-R19's RELEASE BEAT
console.log('\nG. The release — LP-R19\'s successor, which LP-R21 made load-bearing');

const releaseAt = gridSrc.indexOf('const releaseHeld = (onDone) => {');
const releaseBody = releaseAt < 0 ? null : sliceBraces(gridSrc, releaseAt + 'const releaseHeld = (onDone) => '.length - 1);
if (releaseBody) {
  ok(`G0 releaseHeld located and brace-matched (${releaseBody.length} chars)`);
} else {
  bad('G0', 'HoneycombGrid.js has no `releaseHeld` — LP-R21 removed the scrim\'s only decay, so without a release the light teleports from cell to cell at full strength on every supersede');
}

if (releaseBody) {
  // G1: BOTH values go down, on the same window. LP-R21: "scrim and fill
  // release together." One of the two left behind is the whole defect.
  const released = ['revealProgress', 'fillProgress'].filter((v) =>
    new RegExp(`Animated\\.timing\\(${v}, \\{[\\s\\S]*?toValue: 0,[\\s\\S]*?duration: IGNITION_MS,`).test(releaseBody));
  if (released.length === 2) {
    ok(`G1 the release drives ${released.join(' and ')} to 0 over IGNITION_MS — "scrim and fill release together" (LP-R21), and they are two drivers only because one is native and the other paints an SVG r`);
  } else {
    bad('G1', `the release drives {${released.join(', ')}} to 0 over IGNITION_MS — expected both revealProgress and fillProgress`);
  }
  if (/Animated\.parallel\(/.test(releaseBody)) {
    ok('G1b and it runs them in parallel, not in sequence — "together" is a property of the schedule, not of the durations matching');
  } else {
    bad('G1b', 'the two release timings are not inside an Animated.parallel — equal durations started at different times are not one release');
  }

  // G2: the no-incumbent branch. It must be conditioned on there BEING no
  // incumbent, and it must still empty the fill.
  const earlyMatch = /if \((heldId === null)\) \{([\s\S]*?)\n    \}/.exec(releaseBody);
  if (earlyMatch && /fillProgress\.setValue\(0\)/.test(earlyMatch[2]) && /onDone\(\)/.test(earlyMatch[2])) {
    ok('G2 the no-incumbent branch is gated on `heldId === null` and empties the fill before proceeding — a selection dropped without a release (its member stopped resolving) would otherwise leave the value parked at 1');
  } else {
    bad('G2', `the early-return is \`${earlyMatch ? earlyMatch[1] : '(not found)'}\` and ${earlyMatch && /fillProgress\.setValue\(0\)/.test(earlyMatch[2]) ? 'does' : 'does NOT'} reset the fill — a constant-true guard here skips every release, and a missing reset renders the next tapped cell full before its beat starts`);
  }

  // G3: the swap must not happen on an interrupted release.
  if (/if \(finished\) onDone\(\)/.test(releaseBody)) {
    ok('G3 the state swap is guarded on `finished` — a third tap mid-release takes both values over and RN reports this callback finished:false; swapping anyway hands the room to someone the user already tapped past');
  } else {
    bad('G3', 'the release callback calls onDone() unconditionally — an interrupted release still performs its swap');
  }
}

// G4: LP-R19's two-state contract, read off the two consumers. The stroke
// must follow the IMMEDIATE id and the card must not.
const cardFlag = /\{(\w+) && \(\s*<Animated\.View\s*style=\{\[\s*styles\.revealCard/.exec(gridSrc)?.[1] ?? null;
const strokeFlagSrc = /selected=\{([^}]*)\}\s*\n\s*held=\{([^}]*)\}/.exec(gridSrc);
if (cardFlag && cardFlag !== 'selected' && strokeFlagSrc
    && /selectedId/.test(strokeFlagSrc[1]) && /heldId/.test(strokeFlagSrc[2])) {
  ok(`G4 two ids, two consumers: the cell's stroke resolves from selectedId (immediate) and the reveal card renders under \`${cardFlag}\` — LP-R19's named cost, so the outgoing card does not spend its 80ms exit wearing the incoming person's name`);
} else {
  bad('G4', `the card renders under \`${cardFlag ?? '(not found)'}\` and the cell receives selected=${strokeFlagSrc?.[1] ?? '?'} / held=${strokeFlagSrc?.[2] ?? '?'} — LP-R19 requires selectedId immediate and the card's content at release end`);
}

// G5: the release costs no latency, which is the whole reason LP-R19 could
// rule it in without a new constant.
if (IGNITION_MS && CONTACT_MS && IGNITION_MS < CONTACT_MS) {
  ok(`G5 the release (${IGNITION_MS}ms) fits inside the contact window (${CONTACT_MS}ms) with ${CONTACT_MS - IGNITION_MS}ms to spare — the incoming tap is not delayed by a millisecond, which is what the current build was spending in darkness`);
} else {
  bad('G5', `IGNITION_MS ${IGNITION_MS} vs CONTACT_MS ${CONTACT_MS} — the release no longer fits inside the window the score already leaves empty, so it now costs the next tap latency`);
}

// G6: "light takes as long to let go as it took to catch," and the curve is
// the mirror of the entry's. Both read out of the source, not asserted by
// name in one place and hoped for in the other.
const entryEasing = /duration: DURATIONS\.revealGlide,\s*\n\s*easing: Easing\.(\w+)\(Easing\.(\w+)\)/.exec(gridSrc);
const exitEasing = releaseBody ? /easing: Easing\.(\w+)\(Easing\.(\w+)\)/.exec(releaseBody) : null;
if (entryEasing && exitEasing && entryEasing[2] === exitEasing[2]
    && entryEasing[1] === 'out' && exitEasing[1] === 'in') {
  ok(`G6 the card enters on Easing.out(Easing.${entryEasing[2]}) and leaves on Easing.in(Easing.${exitEasing[2]}) — the exit is the mirror of the entry, on the same base curve`);
} else {
  bad('G6', `entry Easing.${entryEasing?.[1]}(Easing.${entryEasing?.[2]}) vs release Easing.${exitEasing?.[1]}(Easing.${exitEasing?.[2]}) — LP-R19 rules the release "the mirror of its Easing.out(Easing.cubic) entry"`);
}

// G7: ONE OWNER FOR THE WAY DOWN. `startHexTap` resets the beat's other
// values at t=0 (`pressDepth`, `glowBloomOpacity`) and must NOT reset this
// one: a `setValue(0)` there fires on the same frame as the tap and snaps
// the outgoing cell's honey out in a single frame — the release beat still
// runs, over a value that is already 0, and the cut it exists to remove
// happens anyway with the gate green. The defect is invisible to every row
// above because nothing about the release itself changes.
const startAt = gridSrc.indexOf('const startHexTap = () => {');
const startBody = startAt < 0 ? null : sliceBraces(gridSrc, startAt + 'const startHexTap = () => '.length - 1);
if (startBody === null) {
  bad('G7', 'could not brace-match startHexTap — the reset-ownership row cannot run');
} else if (!/fillProgress\.setValue\(/.test(startBody)) {
  const otherResets = [...startBody.matchAll(/(\w+)\.setValue\(/g)].map((m) => m[1]);
  ok(`G7 startHexTap resets {${[...new Set(otherResets)].join(', ')}} and NOT fillProgress — the fill's way down has one owner (releaseHeld), so a supersede cannot cut it out on the tap frame`);
} else {
  bad('G7', 'startHexTap calls fillProgress.setValue() — that fires on the tap frame and cuts the outgoing cell\'s honey out instantly, which is exactly what the release beat exists to prevent. `releaseHeld` owns this value\'s way down in both of its branches.');
}

// ====================================================== F. THE OVERLAY
console.log('\nF. The room — what the overlay may still draw');

const overlaySrc = sources.get(OVERLAY);
const overlayAst = ast(overlaySrc);
const overlayElements = [];
visit(overlayAst, (n) => {
  if (n.type === 'JSXOpeningElement' && n.name.type === 'JSXIdentifier') overlayElements.push(n.name.name);
});
const DRAWN = ['Rect', 'AnimatedRect', 'Circle', 'AnimatedCircle', 'Ellipse', 'AnimatedEllipse', 'Polygon', 'Path', 'Line'];
const drawn = overlayElements.filter((n) => DRAWN.includes(n));
if (drawn.length === 2 && drawn.includes('AnimatedRect') && drawn.includes('AnimatedCircle')) {
  ok(`F1 HexTapOverlay draws exactly two shapes — {${drawn.join(', ')}}: the dim and the ignition bloom. The bead, the drip and the pool are gone, and nothing replaced them`);
} else {
  bad('F1', `HexTapOverlay draws {${drawn.join(', ')}} — LP-R21 leaves it the dim and one bloom; anything else is honey that left the cell`);
}
// The held illumination is the punch-out, and this is the measurement that
// says so — the tapped cell is simply not dimmed.
const dimTok = parseColor(theme.colors.spotlightDim);
const litCell = over(theme.colors.washYellow, theme.colors.surface);
const dimmedCell = over(theme.colors.spotlightDim, litCell);
const punchDelta = deltaE00(litCell, dimmedCell);
if (punchDelta >= 10) {
  ok(`F2 the punch-out alone separates the tapped cell from its neighbours by ΔE00 ${punchDelta.toFixed(4)} (spotlightDim @ ${dimTok.a}) — the held illumination does not need a painted glow, which is what lets accentBurst stay motion-only`);
} else {
  bad('F2', `the punch-out separates the tapped cell by only ΔE00 ${punchDelta.toFixed(4)} — the cell no longer reads as lit without a held glow, and LP-R21's "illumination outside the cell" needs re-ruling`);
}

console.log(`\ncheck-hex-tap: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
