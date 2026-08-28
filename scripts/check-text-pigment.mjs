// Gate: no text in this app is painted in a colour it cannot be read in.
//
//   npm run check:text-pigment
//
// WHY THIS GATE EXISTS, which is a different question from what it asserts.
//
// `accentDeep` as text was struck FOUR times at four call sites — R3's sweep
// (-> inkSoft), R15's Year Card numeral (-> ink), DES-28's PackageOpen grounds
// (-> ink), MB-D2a's seal numerals (-> ink) — and was still live at five sites
// plus all four of Wrapped's beats when this file was written. Each strike moved
// one site; none of them touched the three sentences that kept re-authorising it
// (§2's "hero numerals in `accentDeep` or `ink` on a pastel wash", §1's token
// table row, and the token's own comment in theme.js).
//
// A LOCAL STRIKE LEAVES THE LICENCE STANDING. This gate is the licence's
// counterpart: the ruling can be written once, and the population is checked
// every run instead of being re-litigated per site.
//
// The sharpest evidence for why a human sweep is not enough is inside one file:
// RecapTab.js reasons carefully at :383-391 that accentDeep on the marigold
// roundel is 1.80:1 and "the glyph is ink and stays ink" — and 48 lines further
// down the same StyleSheet paints `statValue` accentDeep at 2.3482:1. Nobody
// re-opens the case the spec says is settled.
//
// WHAT IT READS. Every `color:` property of an object LITERAL under src/ — that
// is the RN text-pigment slot, and it is a text-only style prop. Destructuring
// patterns (`{ color = theme.colors.accent }`, a component's prop default) are
// excluded: those are props on their way to an SVG stop or an icon, not text.
//
// FAILS CLOSED. A `color:` this gate cannot resolve to a concrete token is a
// FAIL, not a skip — "unreadable is not the same as passing" (check-type-floor's
// rule, and check-nav-depth's before it). At the time of writing the population
// resolves 100%: 241 direct `theme.colors.X`, 18 through `cover.textColor`, and
// 9 through `paperInk()`. Both indirections are enumerable readers of declared
// tables, so a new one has to be taught here rather than slipping past.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { contrastRatio, parseColor } from './lib/color.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

let pass = 0;
const failures = [];
const ok = (label) => { pass += 1; console.log(`  ok   ${label}`); };
const bad = (label, detail) => { failures.push(`${label} — ${detail}`); console.log(`  FAIL ${label} — ${detail}`); };

// ── the tokens, read from theme.js rather than restated here ────────────────
const themeSrc = fs.readFileSync(path.join(SRC, 'constants/theme.js'), 'utf8');
const TOKENS = new Map();
for (const m of themeSrc.matchAll(/^\s{2,}([a-zA-Z][\w]*):\s*'(#[0-9A-Fa-f]{6})'/gm)) {
  if (!TOKENS.has(m[1])) TOKENS.set(m[1], m[2]);
}

// The banned pigments and, for each, the EXACT set of tokens it can legally be
// read against. Enumerated, not thresholded: a threshold would need a number
// nobody derived, and this way a token retune that moves any member in or out
// reds T1 and sends whoever did it back to the ruling instead of past it.
const BANNED = {
  accent: ['ink', 'inkSoft', 'inkVeil', 'paperEvening', 'textPrimary', 'textSecondary', 'textInverse'],
  accentDeep: ['ink', 'inkVeil', 'paperEvening', 'textPrimary', 'textInverse'],
};
const LARGE_TEXT_FLOOR = 3;

// ── the residue: known-live defects, each owed to somebody ──────────────────
// This list may only SHRINK. T4 reds on any entry that is no longer a defect,
// so a fix cannot leave its cover behind — an allowlist nobody has to revisit
// is how the licence got to stay standing in the first place.
const RESIDUE = [
  { file: 'src/screens/RecapTab.js', line: 433, token: 'accentDeep', ratio: 2.3482, floor: 3,
    what: 'statValue — h1@34 ExtraBold on washYellow', owner: 'unassigned (Pixel raised)' },
  { file: 'src/screens/TodayTab.js', line: 410, token: 'accentDeep', ratio: 2.3712, floor: 4.5,
    what: 'themeBadge — label 12 SemiBold on accentDeepWash over surface', owner: 'unassigned (Pixel raised)' },
  { file: 'src/screens/HiveDetail.js', line: 362, token: 'accentDeep', ratio: 2.6133, floor: 4.5,
    what: 'rosterInvite — bodySm 14 SemiBold on surface', owner: 'unassigned (Pixel raised)' },
  { file: 'src/screens/Onboarding.js', line: 1045, token: 'accentDeep', ratio: 2.3482, floor: 4.5,
    what: 'consentLink — bodySm on washYellow', owner: 'already reported in-file at Onboarding.js:1082' },
  { file: 'src/screens/Onboarding.js', line: 1056, token: 'accentDeep', ratio: 2.3482, floor: 4.5,
    what: 'switchModeText — bodySm on washYellow', owner: 'already reported in-file at Onboarding.js:1082' },
];

// ── the exemption: ratified, and a different thing from the residue ─────────
// Decorative marks carry no information, so no floor applies to them. Ratified
// in the design system's R3 sweep entry: "EveningMirror quote marks at 0.5
// opacity are decorative — allowed."
//
// FALSIFIER, so this cannot quietly become cover: these are the curly quotation
// glyphs flanking the entry. If either ever renders a character a reader is
// meant to READ, or the opacity is raised toward legibility, it stops being
// ornament and joins the residue.
const DECORATIVE = [
  { file: 'src/screens/EveningMirror.js', line: 97, token: 'accent', what: 'quoteMark — “ at 80pt, opacity 0.5' },
  { file: 'src/screens/EveningMirror.js', line: 106, token: 'accent', what: 'quoteMarkEnd — ” at 80pt, opacity 0.5' },
];

// ── T1: the premise, recomputed every run ───────────────────────────────────
console.log('\nT1 the ban still has the measurement under it');
for (const [name, expected] of Object.entries(BANNED)) {
  const hex = TOKENS.get(name);
  if (!hex) { bad(`T1 ${name}`, `no token named \`${name}\` in theme.js — the ban names a colour that no longer exists`); continue; }
  const actual = [...TOKENS.entries()]
    .filter(([, v]) => contrastRatio(parseColor(hex), parseColor(v)) >= LARGE_TEXT_FLOOR)
    .map(([k]) => k).sort();
  const want = [...expected].sort();
  if (actual.join(',') !== want.join(',')) {
    bad(`T1 ${name}`, `the set of tokens \`${name}\` ${hex} clears ${LARGE_TEXT_FLOOR}:1 against has MOVED: ` +
      `expected {${want.join(', ')}}, measured {${actual.join(', ')}}. Someone retuned a colour. Re-read the ruling ` +
      `before editing this list — the ban exists because that set contained no light ground.`);
    continue;
  }
  // The load-bearing half of the ban is not "it fails a lot of tokens", it is
  // "every token it PASSES is dark" — that is what makes the rule "never text on
  // a light background" rather than a list of unlucky pairs. Asserted, because a
  // fact that is only printed is a fact nothing checks.
  const light = actual.filter((k) => contrastRatio(parseColor('#FFFFFF'), parseColor(TOKENS.get(k))) < 3);
  if (light.length) {
    bad(`T1 ${name}`, `\`${name}\` now clears ${LARGE_TEXT_FLOOR}:1 against ${light.length} LIGHT token(s) ` +
      `(${light.join(', ')}). The ban's premise was that it passes on dark grounds only; that is no longer true, ` +
      `so the ruling needs re-deriving rather than this list extending.`);
    continue;
  }
  ok(`T1 ${name} ${hex} clears ${LARGE_TEXT_FLOOR}:1 on ${actual.length}/${TOKENS.size} tokens ` +
    `(${actual.join(', ')}) and every one of them is DARK — no light ground in the system admits it as text`);
}

// ── the extractor ───────────────────────────────────────────────────────────
const files = [];
(function walkDir(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    fs.statSync(p).isDirectory() ? walkDir(p) : /\.jsx?$/.test(name) && files.push(p);
  }
})(SRC);

const walk = (node, cb, parent) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => walk(n, cb, parent)); return; }
  if (node.type) { cb(node, parent); parent = node; }
  for (const k in node) { if (k === 'loc') continue; walk(node[k], cb, parent); }
};

// The two indirections, named. Each is a reader of a declared table, so it can
// be resolved to a SET of tokens rather than guessed at.
const COVER_TEXT = /^(?:cover|themeOption)\.textColor$/;
const PAPER_INK = /^paperInk(?:Soft)?\([\w.]+\)$/;
const coverTextTokens = [...fs.readFileSync(path.join(SRC, 'constants/hiveThemes.js'), 'utf8')
  .matchAll(/textColor:\s*theme\.colors\.(\w+)/g)].map((m) => m[1]);
const paperInkTokens = [...fs.readFileSync(path.join(SRC, 'components/PaperBlock.js'), 'utf8')
  .matchAll(/export const paperInk(?:Soft)? = [\s\S]*?;/g)].join(' ')
  .match(/theme\.colors\.(\w+)/g)?.map((s) => s.replace('theme.colors.', '')) ?? [];

const sites = [];
let unresolved = [];
for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try { ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] }); }
  catch (err) { unresolved.push(`${path.relative(ROOT, file)} — parse failed: ${err.message}`); continue; }
  walk(ast, (node, parent) => {
    if (node.type !== 'ObjectProperty') return;
    if (!parent || parent.type !== 'ObjectExpression') return; // a pattern is a prop default, not text
    const key = node.key && (node.key.name ?? node.key.value);
    if (key !== 'color') return;
    const text = code.slice(node.value.start, node.value.end).replace(/\s+/g, ' ');
    const rel = path.relative(ROOT, file);
    const at = { file: rel, line: node.loc.start.line, expr: text };
    const direct = text.match(/^theme\.colors\.(\w+)$/);
    if (direct) sites.push({ ...at, tokens: [direct[1]], via: 'direct' });
    else if (COVER_TEXT.test(text)) sites.push({ ...at, tokens: coverTextTokens, via: 'cover.textColor' });
    else if (PAPER_INK.test(text)) sites.push({ ...at, tokens: paperInkTokens, via: 'paperInk()' });
    else unresolved.push(`${rel}:${node.loc.start.line} — \`color: ${text}\` resolves to no token this gate can name`);
  });
}

// ── T2: the extractor is calibrated in both directions ──────────────────────
console.log('\nT2 the extractor found a population, and can still find a defect');
if (unresolved.length) {
  bad('T2 every text pigment resolves',
    `${unresolved.length} site(s) this gate cannot resolve, and unreadable is not the same as passing: ` +
    unresolved.join('; ') + '. Teach the resolver the new indirection (see COVER_TEXT / PAPER_INK above).');
} else if (sites.length < 200) {
  bad('T2 every text pigment resolves',
    `only ${sites.length} \`color:\` sites found across ${files.length} files — the population was 268 when this ` +
    `gate was written. An extractor that suddenly finds far fewer has broken, not been fixed.`);
} else {
  const byVia = sites.reduce((acc, s) => ({ ...acc, [s.via]: (acc[s.via] ?? 0) + 1 }), {});
  ok(`T2 ${sites.length} text-pigment sites across ${files.length} files, 0 unresolved ` +
    `(${Object.entries(byVia).map(([k, v]) => `${v} ${k}`).join(', ')})`);
}
// Calibration: the extractor must still be able to SEE a banned pigment. If the
// residue ever empties this row keeps its meaning by pointing at the exemption,
// which is the same shape of hit and is not going away.
const canSeeBanned = sites.filter((s) => s.tokens.some((t) => t in BANNED));
if (canSeeBanned.length === 0) {
  bad('T2 the probe can see a banned pigment',
    'zero sites resolved to `accent` or `accentDeep` anywhere — including the two ratified decorative ones, ' +
    'which are still in the source. A probe that finds nothing has not proved the app is clean.');
} else {
  ok(`T2 calibration: the probe resolves ${canSeeBanned.length} site(s) to a banned pigment, so a real one would be seen`);
}

// ── T3: nothing outside the two named lists paints text in a banned pigment ─
console.log('\nT3 no unlisted text is painted in a pigment it cannot be read in');
const listed = new Set([...RESIDUE, ...DECORATIVE].map((e) => `${e.file}:${e.line}`));
const offenders = canSeeBanned.filter((s) => !listed.has(`${s.file}:${s.line}`));
if (offenders.length) {
  bad('T3 no unlisted banned pigment',
    offenders.map((s) => `${s.file}:${s.line} paints text \`${s.expr}\``).join('; ') +
    `. §1's standing rule: accent is fill-behind-ink or decorative, never text on light backgrounds. ` +
    `The remedy is settled — numerals to \`ink\`, body/label emphasis to \`inkSoft\`, and the hue keeps its ` +
    `job by moving BEHIND the text (RecapTab's roundel is the exemplar).`);
} else {
  ok(`T3 ${canSeeBanned.length} banned-pigment site(s), all accounted for: ${RESIDUE.length} known defects, ` +
    `${DECORATIVE.length} ratified decorative`);
}

// ── T4: the residue may only shrink ─────────────────────────────────────────
console.log('\nT4 the residue list is still describing the app');
const stale = [];
for (const entry of [...RESIDUE, ...DECORATIVE]) {
  const site = sites.find((s) => s.file === entry.file && s.line === entry.line);
  if (!site) stale.push(`${entry.file}:${entry.line} (${entry.what}) is listed but no \`color:\` sits there any more`);
  else if (!site.tokens.includes(entry.token)) stale.push(`${entry.file}:${entry.line} (${entry.what}) is listed as \`${entry.token}\` but now resolves to \`${site.tokens.join('|')}\``);
}
if (stale.length) {
  bad('T4 the residue shrinks',
    stale.join('; ') + '. If it is FIXED, delete the entry — a list that outlives its defects is the cover that ' +
    'let this ship four strikes running. If it MOVED, re-measure it: a line number is not a defect.');
} else {
  ok(`T4 all ${RESIDUE.length + DECORATIVE.length} listed sites are still exactly what the list says they are`);
  for (const e of RESIDUE) console.log(`         owed: ${e.file}:${e.line} ${e.what} — ${e.ratio}:1 against a ${e.floor}:1 floor — ${e.owner}`);
}

console.log(`\n${pass} passed, ${failures.length} failed`);
process.exitCode = failures.length ? 1 : 0;
