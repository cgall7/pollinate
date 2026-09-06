#!/usr/bin/env node
// The theme key is STORED DATA AND USER-FACING COPY AT THE SAME TIME.
//
//   npm run check:theme-keys
//
// WHY THIS FILE EXISTS
//
// FU4 (Lumen, 2026-09-06, thread 160660d9) renamed `Faith` to `Spirit`.
// `THEMES[].key` is authored by us and rendered directly, so the old label
// was a forbidden word on a screen in our own voice; R15 has no exemption
// and creating one is Colin's to grant. The rename is small. What it exposed
// is not, and that is what this gate holds:
//
//   1. THE IDENTITY HAS FOUR WRITERS and none of them imports the others.
//      `themeTagger.js` computes the key, `demoSeed.js` seeds against it in
//      two independent lists, and `demo-seed-corpus.mjs` tags 180 streak
//      entries with it from `scripts/`. A rename that reaches three of the
//      four leaves a demo account whose entries carry a theme the tagger can
//      no longer produce. `check-demo-seed:299` catches half of that, since
//      it asserts STREAK's tags are members of STREAK_THEMES, but both of
//      those live in the SAME file: rename them together and that row stays
//      green while the app disagrees. T1 is the cross-file link.
//
//   2. THE KEY IS PERSISTED. Migration `20260813000006` writes the
//      client-computed key into `entries.theme`, so every row minted before
//      the rename still holds the retired word. A renamed stored identity is
//      a READ problem: it is answered once, at the boundary, and every
//      render inherits the answer. T3 is the universal that keeps it there,
//      because the tempting fix is at the render and `TodayTab.js:618`
//      prints `entry.theme` with no fallback of any kind.
//
// WHAT THE UNIVERSE IS, AND HOW IT IS BOUNDED
//
// T3 quantifies over every non-computed `.theme` MEMBER READ under `src/`
// and `App.js`. That is the population because it is how a stored theme
// leaves a record and becomes a value: `row.theme`, `entry.theme`,
// `insight.theme`. A member is either MEASURED normalised (its node is an
// argument of a `normalizeTheme(...)` call, read off the AST) or DECLARED
// downstream of something that already is. A declaration is not prose: its
// `via` names a source, and a source RESOLVES only by terminating at a
// measured normalisation or at an in-tree writer T1 itself asserts. A cycle
// or a dead end is a failure, not a green row with a nice sentence in it.
//
// THE GUARDS THIS OWES, being a gate over a collected set:
//
//   1. the population is non-empty, and so is the measured-normalised half,
//      asserted separately so a rename that deleted every call site could
//      not go green on an empty universal
//   2. the extractor is reconciled against an INDEPENDENT witness: a second,
//      hand-rolled walk over the raw AST object graph, written not to share
//      `walkWithAncestry`'s traversal, compared as sets in both directions
//   3. every member is measured or named, and every name resolves
//
// THE KEYS CARRY LINE NUMBERS and that is a real cost, paid on purpose:
// `MonthlyRecap.js` reads `entry.theme` twice with the same object text, so
// file plus object does not identify a site. An import added above a
// declaration shifts its key and reds two rows with an accurate message. The
// alternative, keying on the enclosing function, merges the two reads whose
// difference is the point.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';
import { FORBIDDEN } from './forbidden-words.mjs';
import { walkWithAncestry } from './lib/rendered-strings.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const astOf = (rel) =>
  parse(read(rel), { sourceType: 'module', plugins: ['jsx', 'typescript'] });

let pass = 0;
let fail = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? (pass += 1) : (fail += 1);
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${label}` +
      (ok ? '' : `\n       got  ${JSON.stringify(got)}\n       want ${JSON.stringify(want)}`)
  );
};

// The two modules with no imports of their own load directly. `demoSeed.js`
// does not: it is read off the AST below, which is the right tool anyway
// because neither list it owns is exported and widening an export for a gate
// is the gate changing the thing it measures.
const { THEMES, FALLBACK_THEME, normalizeTheme, LEGACY_THEME_KEY_LIST } = await import(
  pathToFileURL(path.join(ROOT, 'src/utils/themeTagger.js')).href
);
const { STREAK_THEMES, STREAK } = await import(
  pathToFileURL(path.join(ROOT, 'scripts/lib/demo-seed-corpus.mjs')).href
);

// --- T1. the four writers of the theme identity ------------------------
console.log(`\n--- T1. every writer of the theme identity names the same keys ---`);

const taggerKeys = THEMES.map((t) => t.key);

// `demoSeed.js`'s two lists, off the AST. SAMPLE_LINES' property names and
// THEME_WEIGHTS' first tuple elements are different shapes on purpose: they
// are two independent statements of the same set inside one file, and the
// rename had to reach both.
const demoSeedAst = astOf('src/utils/demoSeed.js');
let sampleLineKeys = null;
let sampleLines = [];      // [key, text]
let weightKeys = null;
walkWithAncestry(demoSeedAst.program, (node) => {
  if (node.type !== 'VariableDeclarator' || node.id?.type !== 'Identifier') return;
  if (node.id.name === 'SAMPLE_LINES' && node.init?.type === 'ObjectExpression') {
    sampleLineKeys = [];
    for (const prop of node.init.properties) {
      if (prop.type !== 'ObjectProperty') continue;
      const key = prop.key?.name ?? prop.key?.value;
      sampleLineKeys.push(key);
      if (prop.value?.type === 'ArrayExpression') {
        for (const el of prop.value.elements) {
          if (el?.type === 'StringLiteral') sampleLines.push([key, el.value]);
        }
      }
    }
  }
  if (node.id.name === 'THEME_WEIGHTS' && node.init?.type === 'ArrayExpression') {
    weightKeys = [];
    for (const el of node.init.elements) {
      if (el?.type === 'ArrayExpression' && el.elements[0]?.type === 'StringLiteral') {
        weightKeys.push(el.elements[0].value);
      }
    }
  }
});

// Each list is asserted non-empty on its own, not as a union: an extractor
// that stopped finding one of them would otherwise hide inside the others.
check('the tagger names at least one theme', taggerKeys.length > 0, true);
check('SAMPLE_LINES was found and is non-empty', Array.isArray(sampleLineKeys) && sampleLineKeys.length > 0, true);
check('THEME_WEIGHTS was found and is non-empty', Array.isArray(weightKeys) && weightKeys.length > 0, true);
check('the corpus names at least one streak theme', STREAK_THEMES.length > 0, true);
check('the corpus carries at least one tagged streak entry', STREAK.length > 0, true);

const sorted = (xs) => [...new Set(xs)].sort();
const TAGGER = sorted(taggerKeys);
check('SAMPLE_LINES names exactly the tagger keys', sorted(sampleLineKeys ?? []), TAGGER);
check('THEME_WEIGHTS names exactly the tagger keys', sorted(weightKeys ?? []), TAGGER);
check('the corpus STREAK_THEMES are exactly the tagger keys', sorted(STREAK_THEMES), TAGGER);
check(
  'every corpus streak entry carries a live key',
  sorted(STREAK.map((s) => s.theme).filter((t) => !TAGGER.includes(t))),
  []
);
console.log(`     ${TAGGER.length} keys, agreed by 4 writers, over ${STREAK.length} corpus entries and ${sampleLines.length} sample lines`);

// --- T2. no key we speak is a word we banned ---------------------------
console.log(`\n--- T2. the label is ours, so the ban reaches it ---`);
check('the forbidden list is non-empty', FORBIDDEN.length > 0, true);
check(
  'no live theme key contains a forbidden word',
  TAGGER.filter((k) => FORBIDDEN.some((f) => f.re.test(k))).sort(),
  []
);
check(
  'the fallback theme contains no forbidden word',
  FORBIDDEN.filter((f) => f.re.test(FALLBACK_THEME)).map((f) => f.word),
  []
);

// --- T3. the legacy map ------------------------------------------------
console.log(`\n--- T3. the retired keys, and what normalizeTheme does with them ---`);
check('at least one key has been retired', LEGACY_THEME_KEY_LIST.length > 0, true);
// A retired key that came BACK as a live key would be shadowed forever by
// its own retirement, silently, and the map would be the reason.
check(
  'no retired key is also a live key',
  LEGACY_THEME_KEY_LIST.filter((k) => TAGGER.includes(k)).sort(),
  []
);
check(
  'every retired key maps to a live key',
  LEGACY_THEME_KEY_LIST.filter((k) => !TAGGER.includes(normalizeTheme(k))).sort(),
  []
);
check(
  'normalizeTheme is the identity on every live key',
  TAGGER.filter((k) => normalizeTheme(k) !== k),
  []
);
check('normalizeTheme is the identity on the fallback', normalizeTheme(FALLBACK_THEME), FALLBACK_THEME);
// The `||` fallback downstream of every read is `entry.theme || tagEntry(…)`.
// A normaliser that turned an absent theme into a string would take that away.
check('an absent theme stays absent', [normalizeTheme(undefined), normalizeTheme(null)], [undefined, null]);
// The prototype trap the Map exists to close: on an object literal these
// three return functions, which are truthy and survive `?? theme`.
check(
  'an inherited property name is not a lookup hit',
  ['constructor', 'toString', 'valueOf'].filter((k) => normalizeTheme(k) !== k),
  []
);

// --- T4. demoSeed's own stated rule, measured --------------------------
console.log(`\n--- T4. every seeded line tags to the theme it is seeded under ---`);
// `demoSeed.js` says its lines are "written to actually match themeTagger's
// keyword lists". `tagEntry` matches by SUBSTRING, so that sentence is not
// self-evident: it was FALSE at one line when this row was written, because
// `moment` contains `mom` and Family is earlier in THEMES than the theme the
// line was filed under. Re-derived here rather than imported so the row
// measures the shipped tagger's behaviour and not a second copy of the rule.
const tagWith = (text) => {
  const lower = text.toLowerCase();
  let best = FALLBACK_THEME;
  let bestScore = 0;
  for (const theme of THEMES) {
    const score = theme.keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = theme.key;
    }
  }
  return best;
};
check('there are sample lines to tag', sampleLines.length > 0, true);
check(
  'every sample line tags to its own key',
  sampleLines.filter(([key, text]) => tagWith(text) !== key).map(([key, text]) => `${key} -> ${tagWith(text)}: ${text}`),
  []
);

// --- T5. every stored-theme read is normalised, or downstream of one ---
console.log(`\n--- T5. the read boundary, as a universal over every .theme read ---`);

const files = [];
(function walkDir(dir) {
  for (const name of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walkDir(p);
    else if (/\.jsx?$/.test(name)) files.push(p);
  }
})(path.join(ROOT, 'src'));
files.push(path.join(ROOT, 'App.js'));
files.sort();

// Is this node an argument of a `normalizeTheme(...)` call? Read off the
// ancestry rather than off the source text, so a comment naming the function
// beside an unwrapped read cannot answer for it.
const insideNormalizer = (ancestors) => {
  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    const { node: a, key } = ancestors[i];
    if (a.type === 'CallExpression' && key === 'arguments') {
      return a.callee?.type === 'Identifier' && a.callee.name === 'normalizeTheme';
    }
  }
  return false;
};

const population = new Map();   // key -> { at, object, normalized }
const witness = new Set();      // the independent walk's view of the same set
for (const file of files) {
  const rel = path.relative(ROOT, file);
  const source = read(rel);
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx', 'typescript'] });

  walkWithAncestry(ast.program, (node, ancestors) => {
    if (node.type !== 'MemberExpression' || node.computed) return;
    if (node.property?.name !== 'theme') return;
    const object = source.slice(node.object.start, node.object.end);
    population.set(`${rel}:${node.loc?.start.line} ${object}.theme`, {
      normalized: insideNormalizer(ancestors),
    });
  });

  // THE INDEPENDENT WITNESS. A hand-rolled walk of the raw object graph,
  // deliberately not `walkWithAncestry`: if that traversal ever stops
  // descending into a node kind, the population silently shrinks and every
  // universal above it goes green. This one shares nothing with it but the
  // parser.
  (function raw(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(raw);
    if (node.type === 'MemberExpression' && !node.computed && node.property?.name === 'theme') {
      witness.add(`${rel}:${node.loc?.start.line} ${source.slice(node.object.start, node.object.end)}.theme`);
    }
    for (const k of Object.keys(node)) {
      if (k === 'loc' || k === 'leadingComments' || k === 'trailingComments' || k === 'innerComments') continue;
      raw(node[k]);
    }
  })(ast.program);
}

check('there are .theme reads to classify', population.size > 0, true);
check(
  'the ancestry walk saw nothing the raw walk did not',
  [...population.keys()].filter((k) => !witness.has(k)).sort(),
  []
);
check(
  'the raw walk saw nothing the ancestry walk did not',
  [...witness].filter((k) => !population.has(k)).sort(),
  []
);

const measured = [...population.entries()].filter(([, v]) => v.normalized).map(([k]) => k).sort();
check('at least one read is measured normalised', measured.length > 0, true);

// A SOURCE IS A CLAIM THAT RESOLVES, NOT A SENTENCE. Three kinds:
//
//   mapper  the value came through a function in `file` that this gate
//           MEASURED calling normalizeTheme. Resolves against the measured
//           set above, so deleting the call reds every declaration that
//           leans on it, not only the mapper's own row.
//   writer  the value was produced in this tree by a writer whose key set T1
//           asserts. `name` must be one T1 actually checked.
//   derived the value was computed from other reads in this same population.
//           Resolves recursively, and a cycle is a failure.
const T1_WRITERS = ['themeTagger.THEMES', 'demoSeed.SAMPLE_LINES', 'demoSeed.THEME_WEIGHTS', 'corpus.STREAK_THEMES'];
const SOURCES = {
  'EntryStore.toEntry': { kind: 'mapper', file: 'src/services/EntryStore.js' },
  'HiveStore.toHiveEntry': { kind: 'mapper', file: 'src/services/HiveStore.js' },
  'legacyJournal.legacyEntriesToMigrate': { kind: 'mapper', file: 'src/utils/legacyJournal.js' },
  // `demo[date].theme` reads `buildDemoEntries`' output, which is
  // `SAMPLE_LINES`' own key. Never persisted under a retired name, because
  // it is minted at read time from the current list.
  'demoSeed.buildDemoEntries': { kind: 'writer', name: 'demoSeed.SAMPLE_LINES' },
  // `dominantTheme` counts `entry.theme || tagEntry(entry.text)` and returns
  // the winning key. Its own read is in this population and carries its own
  // declaration, so `insight.theme` inherits whatever that resolves to.
  'themeTagger.dominantTheme': {
    kind: 'derived',
    from: ['src/utils/themeTagger.js:73 entry.theme'],
  },
};

// Every read that is not measured names the source it is downstream of.
const DOWNSTREAM = {
  'src/utils/themeTagger.js:73 entry.theme': 'EntryStore.toEntry',
  'src/services/EntryStore.js:193 demo[date].theme': 'demoSeed.buildDemoEntries',
  'src/screens/TodayTab.js:618 entry.theme': 'EntryStore.toEntry',
  'src/screens/MonthlyRecap.js:93 entry.theme': 'EntryStore.toEntry',
  'src/screens/MonthlyRecap.js:178 entry.theme': 'EntryStore.toEntry',
  'src/screens/PollinateWrapped.js:71 entry.theme': 'EntryStore.toEntry',
  'src/screens/PollinateWrapped.js:71 insight.theme': 'themeTagger.dominantTheme',
  'src/screens/PollinateWrapped.js:274 insight.theme': 'themeTagger.dominantTheme',
  'src/screens/PollinateWrapped.js:354 data.insight.theme': 'themeTagger.dominantTheme',
  'src/screens/RecapTab.js:428 insight.theme': 'themeTagger.dominantTheme',
  'src/components/FileToHive.js:82 entry.theme': 'EntryStore.toEntry',
};

check(
  'every read is either measured normalised or names a source',
  [...population.keys()].filter((k) => !population.get(k).normalized && !DOWNSTREAM[k]).sort(),
  []
);
check(
  'no declaration names a read the walk did not find',
  Object.keys(DOWNSTREAM).filter((k) => !population.has(k)).sort(),
  []
);
check(
  'no measured read also carries a declaration',
  Object.keys(DOWNSTREAM).filter((k) => population.get(k)?.normalized).sort(),
  []
);
check(
  'every declared source is in the source vocabulary',
  [...new Set(Object.values(DOWNSTREAM))].filter((s) => !SOURCES[s]).sort(),
  []
);

const measuredFiles = new Set(measured.map((k) => k.slice(0, k.indexOf(':'))));
const resolveSource = (name, seen = new Set()) => {
  if (seen.has(name)) return `cycle at ${name}`;
  seen.add(name);
  const s = SOURCES[name];
  if (!s) return `unknown source ${name}`;
  if (s.kind === 'mapper') {
    return measuredFiles.has(s.file) ? null : `${name} claims ${s.file} normalises, and no read there does`;
  }
  if (s.kind === 'writer') {
    return T1_WRITERS.includes(s.name) ? null : `${name} names ${s.name}, which T1 does not assert`;
  }
  if (s.kind === 'derived') {
    for (const site of s.from) {
      if (!population.has(site)) return `${name} derives from ${site}, which is not a read`;
      if (population.get(site).normalized) continue;
      const via = DOWNSTREAM[site];
      if (!via) return `${name} derives from ${site}, which is unclassified`;
      const err = resolveSource(via, seen);
      if (err) return err;
    }
    return null;
  }
  return `${name} has no kind`;
};
check(
  'every source in the vocabulary resolves to a measurement',
  Object.keys(SOURCES).map((n) => resolveSource(n)).filter(Boolean).sort(),
  []
);
console.log(`     ${population.size} .theme reads: ${measured.length} measured normalised, ${population.size - measured.length} declared downstream of ${new Set(Object.values(DOWNSTREAM)).size} sources`);
for (const m of measured) console.log(`       normalised at ${m}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
