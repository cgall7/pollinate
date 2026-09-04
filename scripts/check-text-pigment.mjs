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
// WHAT IT READS — and this is a PLURAL, which cost a ride-along to learn.
//
//   1. every `color:` property of an object LITERAL under src/ — the RN
//      text-pigment style slot, and a text-only style prop. Destructuring
//      patterns (`{ color = theme.colors.accent }`, a component's prop default)
//      are excluded: those are props on their way to an SVG stop or an icon.
//   2. `placeholderTextColor` — a JSX attribute, not a style key. Placeholder
//      text is text, so R127 binds it, and the first draft of this gate was
//      completely blind to it (Lumen's mutation: `SealHive.js:151` set to
//      `accentDeep`, gate stayed green).
//
// T5 exists because of how that hole was shaped. The `color:` half failed
// closed on anything it could not resolve, and the attribute half did not exist
// — TWO SOUND HALVES WITH THE HOLE AT THE JOIN. A gate that reads N transports
// is silent about the N+1th by construction, and no amount of rigour inside a
// transport detects one that was never enumerated. So T5 asserts the
// ENUMERATION: the ways a glyph can be given a colour in this codebase are
// closed, and a new one has to be taught here rather than assumed absent.
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

// AN ALPHA OF A PIGMENT IS STILL THAT PIGMENT. `inkFaint: withAlpha(pigment.ink,
// 0.62)` has no hex literal of its own, and the first version of this gate
// failed closed on the three `placeholderTextColor` sites that use it — correct,
// but the right answer is to resolve it, not to except it. Resolving through the
// alpha also closes a bypass the hex map alone would miss:
// `withAlpha(pigment.accentDeep, 0.9)` is amber lettering with a decimal in it.
//
// Only a DIRECT `withAlpha(pigment.X, n)` resolves. `spotlightDim` wraps a
// `mix()` and has no single base, so it stays unresolvable and fails closed if
// anything ever paints text with it.
const ALPHA_BASE = new Map();
for (const m of themeSrc.matchAll(/^\s{2,}([a-zA-Z][\w]*):\s*withAlpha\(pigment\.(\w+),\s*([\d.]+)\)/gm)) {
  const base = TOKENS.get(m[2]);
  if (base && !ALPHA_BASE.has(m[1])) ALPHA_BASE.set(m[1], { base, alpha: Number(m[3]), baseName: m[2] });
}
// A pigment's hex, whether it is declared as one or wears an alpha over one.
const hexOf = (name) => TOKENS.get(name) ?? ALPHA_BASE.get(name)?.base ?? null;

// The banned pigments and, for each, the EXACT set of tokens it can legally be
// read against. Enumerated, not thresholded: a threshold would need a number
// nobody derived, and this way a token retune that moves any member in or out
// reds T1 and sends whoever did it back to the ruling instead of past it.
const BANNED = {
  accent: ['ink', 'inkSoft', 'inkVeil', 'paperEvening', 'textPrimary', 'textSecondary', 'textInverse'],
  accentDeep: ['ink', 'inkVeil', 'paperEvening', 'textPrimary', 'textInverse'],
};
const LARGE_TEXT_FLOOR = 3;

// KEYED ON THE PIGMENT'S VALUE, NOT ITS NAME. R127's constraint was "never a
// token name — a blacklist goes green the moment someone writes `#FF7A00`", and
// the hole is wider than a raw literal: `linkAmber: '#FF7A00'` is a NEW name for
// the same light, and a name-keyed row would pass it. Hex-keying closes the
// literal, the alias and the rename in one move.
//
// R127 also asked for the resolved (text, ground) PAIR. That half I did not
// build, and the reason is R127's own strengthening: it ruled `accentDeep` is
// never text *unqualified*, and closed the one arithmetic exception —
// `paperEvening` at 5.0027 — by ruling rather than by measurement. A pair-keyed
// row would go GREEN on exactly that pair, because 5.0027 clears 3:1. Keying on
// the pigment enforces the ruling as ruled; keying on the pair would quietly
// reopen the door the ruling closed. Raised in-thread rather than decided here.
const BANNED_HEX = new Map();
for (const name of Object.keys(BANNED)) {
  const hex = TOKENS.get(name);
  if (hex) BANNED_HEX.set(hex.toUpperCase(), name);
}

// ── the residue: known-live defects, each owed to somebody ──────────────────
// This list may only SHRINK. T4 reds on any entry that is no longer a defect,
// so a fix cannot leave its cover behind — an allowlist nobody has to revisit
// is how the licence got to stay standing in the first place.
//
// The widened sweep's five sites are FIXED, not merely reassigned: RecapTab's
// hero numeral and TodayTab's themeBadge take `ink` (the numeral/fill-pairing
// remedy); HiveDetail's roster invite and both Onboarding sites are links, and
// take `inkSoft` per R127.1 — weight and position carry the affordance, never
// hue. All five are deleted from this list rather than re-pointed at an owner.
const RESIDUE = [];

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
  // An alias is a second name for a banned light. Named here rather than left to
  // T3, because T3 would report it as an unexplained defect at a call site while
  // the actual event was someone minting a synonym in theme.js.
  const aliases = [...TOKENS.entries()].filter(([k, v]) => k !== name && v.toUpperCase() === hex.toUpperCase());
  if (aliases.length) {
    bad(`T1 ${name} has no alias`, `\`${aliases.map(([k]) => k).join('`, `')}\` hold the same hex ${hex} as ` +
      `\`${name}\`. A second name for a banned pigment is how a struck licence comes back — the rows below key ` +
      `on the VALUE so the alias is caught anyway, but the alias itself wants deleting, not documenting.`);
  } else {
    ok(`T1 ${name} has no alias — no other token in theme.js holds ${hex}`);
  }
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
  // ONE LEVEL OF ALIASING, resolved rather than refused. A file that reads the
  // paper's ink once and reuses it (`const ink = paperInk(paper)`) is doing the
  // house-correct thing — PaperBlock is meant to be the single writer, and
  // calling it once per render beats calling it per glyph — but it moved the
  // indirection off the `color:` site, where this resolver was looking. The
  // alias is required to be declared IN THIS FILE and initialised by a literal
  // `paperInk`/`paperInkSoft` call, so this widens what can be READ without
  // widening what counts as resolved: anything else still lands in `unresolved`
  // and still reds T2.
  const paperInkAliases = new Set();
  walk(ast, (node) => {
    if (node.type !== 'VariableDeclarator' || node.id?.type !== 'Identifier') return;
    if (node.init?.type === 'CallExpression' && /^paperInk(Soft)?$/.test(node.init.callee?.name ?? '')) {
      paperInkAliases.add(node.id.name);
    }
  });
  walk(ast, (node, parent) => {
    // Two transports, one resolver. `node` is either a style `color:` property
    // or a `placeholderTextColor` JSX attribute; both hand a pigment to a glyph.
    let valueNode = null;
    let transport = null;
    if (node.type === 'ObjectProperty' && parent && parent.type === 'ObjectExpression') {
      const key = node.key && (node.key.name ?? node.key.value);
      if (key === 'color') { valueNode = node.value; transport = 'color:'; }
    } else if (node.type === 'JSXAttribute' && node.name && node.name.name === 'placeholderTextColor') {
      // `placeholderTextColor="#FF7A00"` is a StringLiteral; the expression form
      // is a container. Both reach the same resolver.
      valueNode = node.value && node.value.type === 'JSXExpressionContainer' ? node.value.expression : node.value;
      transport = 'placeholderTextColor';
    }
    if (!valueNode) return;
    const node_ = node;
    const text = code.slice(valueNode.start, valueNode.end).replace(/\s+/g, ' ')
      .replace(/^"(#[0-9A-Fa-f]{6})"$/, "'$1'");
    const rel = path.relative(ROOT, file);
    const at = { file: rel, line: node_.loc.start.line, expr: text, transport };
    // A resolved site carries the HEXES it can paint, not just the names — the
    // names are for the message, the hexes are what the rows decide on.
    const push = (names, via, hexes) => {
      const resolved = hexes ?? names.map((n) => hexOf(n));
      if (resolved.some((h) => !h)) {
        unresolved.push(`${rel}:${node_.loc.start.line} — \`${transport} ${text}\` names ${names.join('|')}, ` +
          `which resolves to no pigment this gate can name — not a hex literal, not a direct ` +
          `withAlpha(pigment.X, n) — so its legibility cannot be measured`);
        return;
      }
      sites.push({ ...at, tokens: names, hexes: resolved.map((h) => h.toUpperCase()), via });
    };
    const direct = text.match(/^theme\.colors\.(\w+)$/);
    const literal = text.match(/^'(#[0-9A-Fa-f]{6})'$/);
    if (direct) push([direct[1]], 'direct');
    else if (literal) push([literal[1]], 'raw hex literal', [literal[1]]);
    else if (COVER_TEXT.test(text)) push(coverTextTokens, 'cover.textColor');
    else if (PAPER_INK.test(text)) push(paperInkTokens, 'paperInk()');
    else if (paperInkAliases.has(text)) push(paperInkTokens, 'paperInk() via local alias');
    else unresolved.push(`${rel}:${node_.loc.start.line} — \`${transport} ${text}\` resolves to no token this gate can name`);
  });
}

// ── T2: the extractor is calibrated in both directions ──────────────────────
console.log('\nT2 the extractor found a population, and can still find a defect');
if (unresolved.length) {
  bad('T2 every text pigment resolves',
    `${unresolved.length} site(s) this gate cannot resolve, and unreadable is not the same as passing: ` +
    unresolved.join('; ') + '. Teach the resolver the new indirection (see COVER_TEXT / PAPER_INK above).');
} else if (sites.length < 240) {
  bad('T2 every text pigment resolves',
    `only ${sites.length} \`color:\` sites found across ${files.length} files — the population was 268 when this ` +
    `gate was written. An extractor that suddenly finds far fewer has broken, not been fixed.`);
} else {
  const tally = (key) => sites.reduce((acc, s) => ({ ...acc, [s[key]]: (acc[s[key]] ?? 0) + 1 }), {});
  const fmt = (o) => Object.entries(o).map(([k, v]) => `${v} ${k}`).join(', ');
  ok(`T2 ${sites.length} text-pigment sites across ${files.length} files, 0 unresolved — ` +
    `by transport: ${fmt(tally('transport'))}; by indirection: ${fmt(tally('via'))}`);
}
// Calibration: the extractor must still be able to SEE a banned pigment. If the
// residue ever empties this row keeps its meaning by pointing at the exemption,
// which is the same shape of hit and is not going away.
const canSeeBanned = sites.filter((s) => s.hexes.some((h) => BANNED_HEX.has(h)));
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
  else if (!site.hexes.includes((hexOf(entry.token) ?? '').toUpperCase())) stale.push(`${entry.file}:${entry.line} (${entry.what}) is listed as \`${entry.token}\` but now paints \`${site.tokens.join('|')}\``);
}
if (stale.length) {
  bad('T4 the residue shrinks',
    stale.join('; ') + '. If it is FIXED, delete the entry — a list that outlives its defects is the cover that ' +
    'let this ship four strikes running. If it MOVED, re-measure it: a line number is not a defect.');
} else {
  ok(`T4 all ${RESIDUE.length + DECORATIVE.length} listed sites are still exactly what the list says they are`);
  for (const e of RESIDUE) console.log(`         owed: ${e.file}:${e.line} ${e.what} — ${e.ratio}:1 against a ${e.floor}:1 floor — ${e.owner}`);
}

// ── T5: the ENUMERATION of text transports, not just their contents ────────
// Rows T2-T4 are rigorous inside the transports they read and silent about a
// transport nobody added. That is not a bug in them — it is a property of every
// gate that reads a list. So the list itself is the assertion here: each
// transport this gate does NOT read must have an empty population, and gaining
// a member reds with instructions rather than passing quietly.
console.log('\nT5 the ways a glyph can be given a colour are enumerated, not assumed');
const allSrc = files.map((f) => ({ rel: path.relative(ROOT, f), code: fs.readFileSync(f, 'utf8') }));
const UNREAD_TRANSPORTS = [
  {
    name: 'react-native-svg text nodes',
    why: 'an SVG <Text>/<TSpan> takes its colour from `fill`, which is not a style `color:`',
    find: ({ code }) => [...code.matchAll(/import\s*\{([^}]*)\}\s*from\s*'react-native-svg'/g)]
      .flatMap((m) => m[1].split(',').map((x) => x.trim().split(/\s+as\s+/)[0]))
      .filter((n) => n === 'Text' || n === 'TSpan' || n === 'TextPath'),
  },
  {
    name: '`selectionColor`',
    why: 'it paints the glyph highlight behind selected text',
    find: ({ code }) => (code.match(/\bselectionColor\s*=/g) ?? []),
  },
  {
    name: '`cursorColor`',
    why: 'it paints the caret inside a text field',
    find: ({ code }) => (code.match(/\bcursorColor\s*=/g) ?? []),
  },
];
const READ_TRANSPORTS = ['style `color:`', '`placeholderTextColor`'];
let transportsClean = true;
for (const t of UNREAD_TRANSPORTS) {
  const hits = allSrc.flatMap((f) => t.find(f).map(() => f.rel));
  if (hits.length) {
    transportsClean = false;
    bad(`T5 ${t.name} is unread`,
      `${hits.length} occurrence(s) now exist (${[...new Set(hits)].join(', ')}) — ${t.why}. This gate reads ` +
      `${READ_TRANSPORTS.join(' and ')} and would be SILENT about these. Teach the transport in the extractor ` +
      `and move it out of UNREAD_TRANSPORTS; do not widen the exemption lists instead.`);
  }
}
if (transportsClean) {
  ok(`T5 ${READ_TRANSPORTS.length} transports read (${READ_TRANSPORTS.join(', ')}); ` +
    `${UNREAD_TRANSPORTS.length} known-but-unread transports all have an empty population ` +
    `(${UNREAD_TRANSPORTS.map((t) => t.name).join(', ')})`);
}

console.log(`\n${pass} passed, ${failures.length} failed`);
process.exitCode = failures.length ? 1 : 0;
