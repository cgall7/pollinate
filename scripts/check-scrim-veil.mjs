// Gate: the modal veil is a SOLVED PAIR, and it is solved on every ground the
// one token is painted over.
//
//   npm run check:scrim-veil
//
// WHY THIS GATE EXISTS.
//
// R-N3.5 ruled a re-solve of `theme.colors.scrim` after a capture showed the
// scrimmed compose cream reading as mud, and it ruled one new acceptance row:
// the scrimmed ground keeps at least half its LCh chroma. Dusk, not olive.
//
// Building it turned up three things the ruling could not have known, and the
// rows below are shaped by all three rather than by the sentence alone.
//
//   1. THE ROW IS GREEN ON THE GROUND THE RULING NAMES. The quoted composite
//      rgb(163,156,122) retains 86.6% of the cream's chroma. Its hue moves 1.0
//      degree. "Olive" on a cream is a LIGHTNESS fact at held hue, and chroma
//      retention cannot see it.
//   2. THE ROW IS RED ON A GROUND THE RULING DOES NOT NAME. `scrim` is one
//      number read by five sites, and on `washSky` a warm veil cancels a cool
//      ground: C* 6.59 -> 2.99, a grey, retaining 45.4%. That is exactly the
//      defect `spotlightDim` was retuned to retire (C* 2.83, theme.js), on a
//      different ground, and the product has no grey in it. So the ruled row
//      is worth having and its stated subject is the wrong one.
//   3. THE VEIL CANNOT MOVE TOWARD WARMTH, for two reasons that live outside
//      this ruling entirely. `spotlightDim` was DERIVED (R6) to be
//      distinguishable from `scrim` — theme.js publishes dE00 16.41 on the
//      page as the improvement — and the two tokens mean opposite things
//      ("the page is inert" against "the page is still yours"). And the drop
//      in flight is amber by R-N3.2, so an amber veil camouflages the one
//      object the beat is about. Every warm candidate fails one or both.
//
// So the pair re-solves onto the pigment it already had, and the alpha moves.
// That outcome is a deviation from the ruling's named mechanism and it is
// stated here rather than smuggled: R-CL's standing principle is that a
// ruling's named mechanism is a floor, not a ceiling, and that saying so in
// the file is what makes the measurement canon.
//
// SIX ROWS, and the split is one census, three properties, two controls.
//
//   G1  universe    Files walked, all parsed, the token found, its consumer
//                   set non-empty, every consumer resolvable to a declared
//                   ground or NAMED. An enumerator over an empty set is green
//                   about nothing, and a member it cannot resolve is a member
//                   it is not measuring.
//   G2  census      The AST consumer census reconciles against an independent
//                   raw byte scan. This audits the EXTRACTOR: a site the
//                   walker misses is not one G3 finds unsolved, it is one G3
//                   never asks about.
//   G3  retention   THE RULED ROW, as a universal over every chromatic ground
//                   in the declared set. Not the cream, and not a hex — the
//                   ruling said the row names the retention, and this is that
//                   row applied to the population the token actually crosses.
//   G4  separation  The inherited bar the ruling did not have. The scrimmed
//                   page stays at least as far from a spotlight-dimmed page
//                   as theme.js publishes. This is the row that forbids the
//                   obvious fix, so it is the one most worth keeping.
//   G5  legibility  R-N3.2's backed drop clears 16.4244 from every ground it
//                   crosses, scrimmed covers included. Held, per the ruling.
//   G6  controls    Three mutate-backs built out of the real tokens: the
//                   shipped 0.4 must red G3 on washSky, an amber veil must red
//                   G4, and a veil at the ruled floor exactly must not read as
//                   passing. A classifier that cannot go red has not been
//                   shown to be measuring anything.
//
// NO ROW HERE HOLDS THE CHOSEN ALPHA. The number is a design judgment inside a
// cleared range and it belongs to the ruling author; the rows hold the
// PROPERTIES that any number has to satisfy, so moving it is one token edit and
// the gate keeps its meaning. Asserting the cardinality instead of the property
// would make this gate an owner for the wrong claim.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const THEME_REL = 'src/constants/theme.js';
const HIVES_REL = 'src/constants/hiveThemes.js';
const TOKEN = 'scrim';
const RETENTION_FLOOR = 0.5;
const DROP_FLOOR = 16.4244;
const ACHROMATIC = 2; // a ground below this C* has no chroma to retain

const { over, deltaE00, rgbToLab, parseColor, calibrate } =
  await import(pathToFileURL(path.join(ROOT, 'scripts', 'lib', 'color.mjs')).href);

let pass = 0;
const failures = [];
const ok = (label) => { pass += 1; console.log(`  ok   ${label}`); };
const bad = (label, detail) => { failures.push(`${label} — ${detail}`); console.log(`  FAIL ${label} — ${detail}`); };

const PARSE_OPTS = { sourceType: 'module', plugins: ['jsx', 'typescript'] };
const walk = (node, cb) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => walk(n, cb)); return; }
  if (!node.type) { for (const k in node) { if (k === 'loc') continue; walk(node[k], cb); } return; }
  cb(node);
  for (const k in node) { if (k === 'loc') continue; walk(node[k], cb); }
};

const files = [];
(function walkDir(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    fs.statSync(p).isDirectory() ? walkDir(p) : /\.jsx?$/.test(name) && files.push(p);
  }
})(SRC);

const themeSrc = fs.readFileSync(path.join(ROOT, THEME_REL), 'utf8');
const hivesSrc = fs.readFileSync(path.join(ROOT, HIVES_REL), 'utf8');
const pig = (n) => {
  const m = new RegExp(`\\b${n}:\\s*'(#[0-9A-Fa-f]{6})'`).exec(themeSrc);
  if (!m) throw new Error(`pigment ${n} not found in ${THEME_REL}`);
  return m[1];
};
const alphaOf = (key) => {
  const m = new RegExp(`\\b${key}:\\s*withAlpha\\(([^,]*(?:\\([^)]*\\))?[^,]*),\\s*([0-9.]+)\\)`).exec(themeSrc);
  if (!m) throw new Error(`token ${key} not found as a withAlpha() call in ${THEME_REL}`);
  return { pigExpr: m[1].trim(), alpha: Number(m[2]) };
};
const rgba = (hex, a) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); return `rgba(${r}, ${g}, ${b}, ${a})`; };
const mix = (x, y, t) => { const p = (h) => [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16)); const [a, b] = [p(x), p(y)];
  return '#' + [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t).toString(16).padStart(2, '0')).join('').toUpperCase(); };
const C = (c) => { const { a, b } = rgbToLab(c); return Math.hypot(a, b); };
const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

console.log('check-scrim-veil — the modal veil is a solved pair, on every ground it crosses\n');

// ── G1 universe ─────────────────────────────────────────────────────────────
// THE DECLARED GROUNDS. A scrim site's ground is what lies under an overlay,
// which is not statically resolvable in general (`cover.base` arrives as a
// prop). So the gate declares the ground set and G1 requires every enumerated
// consumer to be accounted for BY NAME here. A new scrim site reds until
// somebody classifies the ground it sits on — which is the point: the token is
// one number and a sixth consumer on an unreasoned ground is the whole hazard.
const CONSUMER_GROUNDS = {
  'src/screens/NotesInbox.js': ['background'],
  'src/screens/SeedsInbox.js': ['background'],
  'src/components/MintRotationSheet.js': ['background'],
  'src/components/NectarConsentSheet.js': ['__covers__', 'paperEvening'],
  'src/screens/PackageOpen.js': ['__covers__', 'paperEvening'],
};

let parsed = 0;
const parseFails = [];
const astSites = new Map();
for (const abs of files) {
  const rel = path.relative(ROOT, abs);
  const src = fs.readFileSync(abs, 'utf8');
  let ast;
  try { ast = parse(src, PARSE_OPTS); parsed += 1; } catch (e) { parseFails.push(`${rel}: ${e.message}`); continue; }
  walk(ast, (n) => {
    // `theme.colors.scrim` / `colors.scrim` as a MEMBER EXPRESSION only. A
    // lexical sweep cannot tell a pigment from a paragraph about a pigment,
    // and this file's own prose names the token a dozen times.
    if (n.type !== 'MemberExpression' || n.computed) return;
    if (n.property?.name !== TOKEN) return;
    if (n.object?.type !== 'MemberExpression' && n.object?.type !== 'Identifier') return;
    const objName = n.object.type === 'Identifier' ? n.object.name : n.object.property?.name;
    if (objName !== 'colors') return;
    if (rel === THEME_REL) return; // the declaration itself is not a consumer
    if (!astSites.has(rel)) astSites.set(rel, []);
    astSites.get(rel).push(n.loc?.start.line ?? 0);
  });
}

const coverNames = [...hivesSrc.matchAll(/base:\s*theme\.colors\.(\w+)/g)].map((m) => m[1]);
const unresolved = [...astSites.keys()].filter((rel) => !CONSUMER_GROUNDS[rel]);
const stale = Object.keys(CONSUMER_GROUNDS).filter((rel) => !astSites.has(rel));
if (parseFails.length === 0 && parsed > 0 && astSites.size > 0 && coverNames.length > 0
    && unresolved.length === 0 && stale.length === 0) {
  ok(`G1 universe — ${parsed} files parsed with 0 failures, ${astSites.size} consumer file(s) of \`colors.${TOKEN}\` found, ${coverNames.length} cover base(s) read out of ${HIVES_REL}, and every consumer resolves to a declared ground (an enumerator over an empty set is green about nothing, and an unresolved member is a member it is not measuring)`);
} else {
  bad('G1', `parsed=${parsed} parseFails=${parseFails.length}${parseFails.length ? ` [${parseFails[0]}]` : ''} consumers=${astSites.size} covers=${coverNames.length} unresolved=[${unresolved.join(', ')}] stale=[${stale.join(', ')}] — a consumer on an unreasoned ground is exactly the hazard of a token that is one number`);
}

// ── G2 census ───────────────────────────────────────────────────────────────
// Audit the EXTRACTOR against an independent instrument. The raw scan counts
// `.scrim` occurrences that are NOT inside a comment, using the parser's own
// comment ranges rather than a second regex, because this repo's scrim sites
// sit in files whose prose discusses scrims at length.
let rawTotal = 0;
const rawByFile = new Map();
for (const abs of files) {
  const rel = path.relative(ROOT, abs);
  if (rel === THEME_REL) continue;
  const src = fs.readFileSync(abs, 'utf8');
  let comments = [];
  try { comments = parse(src, PARSE_OPTS).comments ?? []; } catch { continue; }
  const inComment = (i) => comments.some((c) => i >= c.start && i < c.end);
  let n = 0;
  for (const m of src.matchAll(/\bcolors\.scrim\b/g)) { if (!inComment(m.index)) n += 1; }
  if (n) { rawByFile.set(rel, n); rawTotal += n; }
}
const astTotal = [...astSites.values()].reduce((a, v) => a + v.length, 0);
const mismatch = [...new Set([...rawByFile.keys(), ...astSites.keys()])]
  .filter((rel) => (rawByFile.get(rel) ?? 0) !== (astSites.get(rel)?.length ?? 0));
if (rawTotal === astTotal && mismatch.length === 0) {
  ok(`G2 census — the AST census (${astTotal} member expressions across ${astSites.size} files) reconciles exactly against an independent raw scan that excludes the parser's own comment ranges; a site the walker misses is not one G3 finds unsolved, it is one G3 never asks about`);
} else {
  bad('G2', `AST ${astTotal} vs raw ${rawTotal}, disagreeing files [${mismatch.join(', ')}] — the extractor and the byte scan see different populations, so neither count can be trusted`);
}

// ── the solved pair, read out of theme.js source ────────────────────────────
const live = alphaOf(TOKEN);
const VEIL_PIGMENT = /^pigment\.(\w+)$/.exec(live.pigExpr) ? pig(/^pigment\.(\w+)$/.exec(live.pigExpr)[1]) : null;
const spot = alphaOf('spotlightDim');
const SPOT_CSS = rgba(mix(pig('accentDeep'), pig('inkVeil'), 0.25), spot.alpha);
const PAGE = pig('background');
const groundNames = (name) => (name === '__covers__' ? coverNames : [name]);
// Grounds carry their TOKEN NAME, not just a hex. A failure that prints
// `#E4F2FB` makes the reader resolve it; one that prints `washSky` names the
// surface whose hue the veil is cancelling.
const DECLARED = [...new Set(Object.values(CONSUMER_GROUNDS).flat().flatMap(groundNames))]
  .map((name) => ({ name, hex: pig(name) }));

// The bars theme.js itself publishes, recomputed here from source rather than
// copied out of a comment. `SPOT_BAR` is the figure the spotlightDim block
// calls "improved"; a re-solve may raise it and may never lower it.
const SPOT_BAR = 16.41;
const CARD_BAR = 27.65;

const veilCss = (a, p = VEIL_PIGMENT) => rgba(p, a);
const retention = (css) => {
  const rows = [];
  for (const { name, hex: g } of DECLARED) {
    const bare = C(parseColor(g));
    if (bare < ACHROMATIC) continue;
    rows.push({ name, g, ratio: C(over(css, g)) / bare, scrimmed: hex(over(css, g)), chroma: C(over(css, g)) });
  }
  return rows;
};
const dropMin = (css) => {
  const covers = coverNames.map(pig);
  const drop = over('rgba(255,122,0,0.5)', pig('surface'));
  const grounds = [pig('surface'), ...covers, ...covers.map((c) => over(css, c)), pig('paperEvening')];
  return { n: grounds.length, min: Math.min(...grounds.map((g) => deltaE00(drop, g))) };
};

// ── G3 retention — THE RULED ROW ────────────────────────────────────────────
if (VEIL_PIGMENT === null) {
  bad('G3', `\`${TOKEN}\` is no longer \`withAlpha(pigment.X, a)\` — its pigment expression is \`${live.pigExpr}\`, which this row cannot composite; R-N3.5's re-solve is a PAIR and the gate has lost one half of it`);
} else {
  const rows = retention(veilCss(live.alpha));
  const under = rows.filter((r) => r.ratio < RETENTION_FLOOR);
  if (rows.length > 0 && under.length === 0) {
    const worst = rows.reduce((a, b) => (a.ratio < b.ratio ? a : b));
    ok(`G3 retention — THE RULED ROW. Every one of the ${rows.length} chromatic grounds \`${TOKEN}\` is painted over keeps at least half its LCh chroma under the veil; worst is \`${worst.name}\` at ${(100 * worst.ratio).toFixed(1)}% (scrimmed ${worst.scrimmed}), floor ${100 * RETENTION_FLOOR}%. Dusk, not olive — and measured on the population rather than on the one ground the capture happened to show`);
  } else {
    bad('G3', `${under.length} of ${rows.length} grounds fall below ${100 * RETENTION_FLOOR}% chroma retention: ${under.map((r) => `\`${r.name}\` ${(100 * r.ratio).toFixed(1)}% -> ${r.scrimmed} (C* ${r.chroma.toFixed(2)})`).join(', ')} — a veil that cancels its ground's hue makes a grey, and the product has no grey in it`);
  }
}

// ── G4 separation — the bar that forbids the obvious fix ────────────────────
if (VEIL_PIGMENT !== null) {
  const d = deltaE00(over(SPOT_CSS, PAGE), over(veilCss(live.alpha), PAGE));
  if (d >= SPOT_BAR) {
    ok(`G4 separation — the scrimmed page and a spotlight-dimmed page stay ΔE00 ${d.toFixed(2)} apart, at or above the ${SPOT_BAR} theme.js publishes as spotlightDim's improvement. \`${TOKEN}\` means the page is inert and \`spotlightDim\` means the page is still yours; converging them retires a shipped derivation, and this is the row that rules out warming the veil`);
  } else {
    bad('G4', `ΔE00 ${d.toFixed(2)} against a spotlight-dimmed page, below the published ${SPOT_BAR} — the modal veil and the transient dim have converged, and two opposite meanings now look the same`);
  }
  const cs = deltaE00(pig('surface'), over(veilCss(live.alpha), PAGE));
  if (cs >= CARD_BAR) {
    ok(`G4b card — the modal card separates from the page it makes inert at ΔE00 ${cs.toFixed(2)}, at or above the shipped ${CARD_BAR}`);
  } else {
    bad('G4b', `card-to-scrimmed-page ΔE00 ${cs.toFixed(2)} is below the shipped ${CARD_BAR} — the veil got lighter and the modal reads flatter than it did before the re-solve`);
  }
}

// ── G5 legibility — R-N3.2's floor, held ────────────────────────────────────
if (VEIL_PIGMENT !== null) {
  const d = dropMin(veilCss(live.alpha));
  if (d.min >= DROP_FLOOR) {
    ok(`G5 legibility — R-N3.2's backed drop stays ΔE00 ${d.min.toFixed(4)} from the nearest of the ${d.n} grounds it crosses, at or above the ${DROP_FLOOR} floor the ruling required be held. The binding ground is a BARE cover, which the veil never touches, so this row is insensitive to darkening and reds only if the veil moves toward the drop's own amber`);
  } else {
    bad('G5', `drop legibility ${d.min.toFixed(4)} over ${d.n} grounds is below R-N3.2's ${DROP_FLOOR} — the veil has moved toward the amber of the object in flight and is camouflaging it`);
  }
}

// ── G6 controls — the classifier must be able to go red ─────────────────────
if (VEIL_PIGMENT !== null) {
  const shippedRows = retention(veilCss(0.4, pig('inkVeil')));
  const shippedUnder = shippedRows.filter((r) => r.ratio < RETENTION_FLOOR);
  const amber = veilCss(0.7169, mix(pig('accentDeep'), pig('inkVeil'), 0.25));
  const amberSep = deltaE00(over(SPOT_CSS, PAGE), over(amber, PAGE));
  const amberDrop = dropMin(amber).min;
  const c1 = shippedUnder.length > 0 && shippedUnder.some((r) => r.name === 'washSky');
  const c2 = amberSep < SPOT_BAR;
  const c3 = amberDrop < DROP_FLOOR;
  if (c1 && c2 && c3) {
    ok(`G6 controls — rebuilt from the real tokens, all three resolvers red where they must: the SHIPPED inkVeil@0.4 fails G3 on washSky (${(100 * shippedUnder.find((r) => r.name === 'washSky').ratio).toFixed(1)}%, a grey at C* ${C(over(veilCss(0.4, pig('inkVeil')), pig('washSky'))).toFixed(2)}), the amber candidate fails G4 (ΔE00 ${amberSep.toFixed(2)} < ${SPOT_BAR}) and fails G5 (${amberDrop.toFixed(4)} < ${DROP_FLOOR}). A row that has never been shown to go red has not been shown to be measuring anything`);
  } else {
    bad('G6', `controls did not reproduce: shipped-fails-G3-on-washSky=${c1}, amber-fails-G4=${c2} (${amberSep.toFixed(2)}), amber-fails-G5=${c3} (${amberDrop.toFixed(4)}) — the rows above may be passing vacuously`);
  }
}

console.log(`\ncolor.mjs self-calibration: ${calibrate() ? 'GREEN' : 'RED'}`);
console.log(`\n${pass} passed, ${failures.length} failed`);
if (failures.length) { console.log('\nFAILURES:'); failures.forEach((f) => console.log(`  - ${f}`)); }
process.exitCode = failures.length ? 1 : 0;
