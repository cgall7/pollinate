#!/usr/bin/env node
// The strings the copy collector DROPS, and what each one does to a person.
//
//   npm run check:collector-null-class
//
// WHY THIS FILE EXISTS
//
// `scripts/lib/rendered-strings.mjs` decides whether a string is copy by
// POSITION: it walks a string node's ancestors outward and stops at the
// first frame that settles it. A frame that settles nothing returns null,
// and a null position means the string NEVER ENTERS THE UNIVERSE. It is not
// collected-and-permitted. It is not there at all.
//
// So every gate keyed on that collector inherits one blind spot, and the
// blindness is shared rather than per-gate: `check-copy-rules` (forbidden
// words), `check-demo-hive`, and `check-nectar-consent`'s B4/B5 (reserved
// money words) all ask their question of the collected set and are silent
// about the complement. This gate is about the COLLECTOR, which is why it
// does not live inside any one of them.
//
// MEASURED AT 0bb97b5, the collector's own universe over App.js + src/**:
//
//   collected          1227 strings
//   dropped            3178 string nodes
//   dropped + prose     371
//
// Three arms measured against `NectarTab.js` (Pixel, thread 160660d9;
// reproduced by Sage in his own shell), each rendered unguarded and then
// removed:
//
//   inline <Text>You have 3 drops.</Text>           reds, scanned 1171→1172
//   module-scope `const COPY = { balance: … }`      green, scanned stays 1171
//   module-scope helper `probeBalanceLine()`        green, scanned stays 1171
//
// The count is the sharper half. The control arm RISING is what proves the
// universe is the thing being measured; the two laundering arms leaving it
// unmoved is what proves the string never arrives.
//
// WHAT THIS GATE ASSERTS, AND WHAT IT DELIBERATELY DOES NOT
//
// It does NOT classify all 3178. A hand-written disposition for every
// dropped string is an allowlist that grows forever, which is the exact
// failure `check-copy-rules`' own header rejects for the forbidden-word
// matcher. It takes THREE DECLARED PREDICATES over the dropped set, each
// naming a question somebody has already ruled on:
//
//   P1  the word is FORBIDDEN                (scripts/forbidden-words.mjs)
//   P2  the word is RESERVED for nectar      (src/constants/nectar.js)
//   P3  the string is a navigator route id   (`*.Screen name=`)
//
// P1 and P2 are the two word lists this repo already enforces on the
// COLLECTED half. P3 is here because the route-id channel is where an
// exemption's justification expired: `check-copy-rules` argued route ids
// are "never read by anyone" from `tabBarShowLabel: false`, and that
// refutation is false. `tabBarShowLabel` gates the VISIBLE label only. Read
// out of the installed @react-navigation/bottom-tabs@7.18.15:
//
//   BottomTabBar.tsx:424-427   label = getLabel({label, title}, route.name)
//   BottomTabBar.tsx:429-433   iOS accessibilityLabel = `${label}, tab, i of n`
//   BottomTabItem.tsx:348-350  accessibilityLargeContentTitle = labelString,
//                              accessibilityShowsLargeContentViewer: true
//
// Neither `tabBarLabel` nor `title` is set on any of the four tab screens,
// so both channels fall back to `route.name`: VoiceOver SPEAKS it, and the
// iOS Large Content Viewer DRAWS it as a HUD on a long press at large text
// sizes. The second one is a rendering, not an announcement.
//
// THE TABLE RECORDS A DISPOSITION. IT DOES NOT INVENT ONE. An entry whose
// word reaches a person and has no ruling is classified `unruled` and named
// in this gate's output on every run, because a row that files an unruled
// string as acceptable is a gate implying a measurement nobody took. An
// entry whose word reaches a person and is NOT the ruled word is classified
// `wrong-word` with the work that fixes it named. Both classes pass; what
// reds is a NEW member of either, or a member that vanished.
//
// THE THREE GUARDS EVERY COLLECTED-SET ROW OWES (R-RM-1 Am.6; precedent on
// main at scripts/check-gradient-card-contract.mjs G1+G2):
//
//   1. the universe is non-empty — asserted per predicate, not once for the
//      union, so a predicate that stopped matching cannot hide behind the
//      other two
//   2. the extractor is reconciled against an INDEPENDENT witness — the raw
//      walk and the collector partition the same node set, asserted both
//      directions rather than by a matching total
//   3. every collected member is resolvable or NAMED — the census and the
//      table are compared as sets in both directions
//
// KNOWN REACH OF THE PREDICATES, both directions, because a bound stated in
// one direction is the easier half. A TemplateLiteral's quasis are joined
// with a single space before matching, so:
//
//   FALSE NEGATIVE, UNCLOSED: a word straddling an interpolation
//     (`nec${x}tar`) is invisible to every predicate here.
//   FALSE POSITIVE, SAFE: a pattern can fire across the join on text that
//     never renders that way. It costs one table entry and a classification,
//     never a missed word.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { FORBIDDEN } from './forbidden-words.mjs';
import {
  POSITIONS,
  collectRenderedStrings,
  walkWithAncestry,
} from './lib/rendered-strings.mjs';
import { NECTAR_RESERVE } from '../src/constants/nectar.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

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

// --- the universe, the same one check-copy-rules stands over ------------
const files = [];
(function walkDir(dir) {
  for (const name of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walkDir(p);
    else if (/\.jsx?$/.test(name)) files.push(p);
  }
})(SRC);
files.push(path.join(ROOT, 'App.js'));
files.sort();

const RESERVE = NECTAR_RESERVE.map((r) => ({ word: r.source, re: new RegExp(r.source, r.flags) }));

const textOf = (node) =>
  String(
    node.type === 'TemplateLiteral'
      ? node.quasis.map((q) => q.value.cooked ?? q.value.raw).join(' ')
      : node.value
  )
    .replace(/\s+/g, ' ')
    .trim();

// The channel a dropped string sits in, read off the AST rather than
// declared in the table. The table has to AGREE with this, so a mechanical
// class cannot be asserted by hand.
// Does the navigator this Screen sits in turn headers OFF for all of its
// screens? A native-stack header with no `title` falls back to `route.name`,
// so this is the one fact that decides whether a Stack route id is a word a
// person reads. Answered off the enclosing <*.Navigator> element rather than
// from a sentence about App.js.
const enclosingNavigatorHeadersOff = (ancestors) => {
  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    const a = ancestors[i].node;
    if (a.type !== 'JSXElement') continue;
    const n = a.openingElement?.name;
    if (n?.type !== 'JSXMemberExpression' || n.property?.name !== 'Navigator') continue;
    for (const attr of a.openingElement.attributes) {
      if (attr.type !== 'JSXAttribute' || attr.name?.name !== 'screenOptions') continue;
      const obj = attr.value?.type === 'JSXExpressionContainer' ? attr.value.expression : null;
      if (obj?.type !== 'ObjectExpression') return false;
      return obj.properties.some(
        (prop) =>
          prop.type === 'ObjectProperty' &&
          prop.key?.name === 'headerShown' &&
          prop.value?.type === 'BooleanLiteral' &&
          prop.value.value === false
      );
    }
    return false;
  }
  return false;
};

// The channel a dropped string sits in, READ OFF THE AST rather than
// declared in the table. The table below has to AGREE with this, so a
// mechanical class cannot be asserted by hand and then quietly drift.
//
// `module-specifier` is keyed on the SLOT (`key === 'source'`), not on the
// enclosing declaration's type. Keyed on the type it swallowed every string
// inside any `export const …`, which is where `themeTagger`'s keyword list
// and `CombNectarCompose`'s money sentences live — a classifier that names
// the wrong thing and looks settled.
const channelOf = (ancestors) => {
  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    const { node: a, key } = ancestors[i];
    if (
      key === 'source' &&
      (a.type === 'ImportDeclaration' ||
        a.type === 'ExportNamedDeclaration' ||
        a.type === 'ExportAllDeclaration')
    ) {
      return 'module-specifier';
    }
    if (a.type === 'CallExpression') {
      const c = a.callee;
      if (c?.type === 'MemberExpression' && c.object?.name === 'console') return 'developer-log';
      return 'call-argument';
    }
    if (a.type === 'JSXAttribute') return `jsx-attribute:${a.name?.name}`;
  }
  return 'declaration';
};

let collectedCount = 0;
let droppedCount = 0;      // not collected, non-empty text
let droppedEmptyCount = 0; // not collected, empty after collapse (whitespace JSXText, '')
let rawCount = 0;
let parseFailures = 0;
const inventedByCollector = [];
const population = [];   // members of P1 union P2 union P3
const routeIds = [];     // every *.Screen name= value, for P3's own row
const headerOverrides = [];

for (const file of files) {
  const rel = path.relative(ROOT, file);
  let ast;
  try {
    ast = parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  } catch {
    parseFailures += 1;
    continue;
  }

  const collected = collectRenderedStrings(ast, { file: rel, positions: POSITIONS });
  collectedCount += collected.length;
  const collectedNodes = new Set(collected.map((s) => s.node));

  const rawNodes = new Set();
  walkWithAncestry(ast.program, (node, ancestors) => {
    if (node.type === 'JSXOpeningElement') {
      const n = node.name;
      if (n?.type === 'JSXMemberExpression' && n.property?.name === 'Screen') {
        for (const attr of node.attributes) {
          if (attr.type !== 'JSXAttribute' || attr.name?.name !== 'name') continue;
          const v = attr.value;
          if (v?.type !== 'StringLiteral') continue;
          routeIds.push({
            at: `${rel}:${attr.loc?.start.line}`,
            navigator: `${n.object?.name}.${n.property?.name}`,
            text: v.value,
            headersOff: enclosingNavigatorHeadersOff(ancestors),
          });
        }
      }
      return;
    }
    // A per-screen `headerShown: true` is what would put a Stack route id on
    // screen as a header title. Collected so P3's licence below is
    // STRUCTURAL rather than a sentence somebody wrote once.
    if (
      node.type === 'ObjectProperty' &&
      node.key?.name === 'headerShown' &&
      node.value?.type === 'BooleanLiteral' &&
      node.value.value === true
    ) {
      headerOverrides.push(`${rel}:${node.loc?.start.line}`);
      return;
    }
    if (node.type !== 'JSXText' && node.type !== 'StringLiteral' && node.type !== 'TemplateLiteral') return;
    rawNodes.add(node);
    if (collectedNodes.has(node)) return;

    const text = textOf(node);
    if (!text) {
      droppedEmptyCount += 1;
      return;
    }
    droppedCount += 1;

    const forbidden = FORBIDDEN.filter((f) => f.re.test(text)).map((f) => f.word);
    const reserved = RESERVE.filter((r) => r.re.test(text)).map((r) => r.word);
    if (!forbidden.length && !reserved.length) return;
    for (const word of [...forbidden, ...reserved]) {
      population.push({
        key: `${rel}:${node.loc?.start.line} [${word}] ${JSON.stringify(text)}`,
        channel: channelOf(ancestors),
      });
    }
  });

  rawCount += rawNodes.size;
  for (const s of collected) if (!rawNodes.has(s.node)) inventedByCollector.push(`${rel}:${s.line}`);
}

// P3 joins the population after the walk, because a route id is identified
// by its ELEMENT rather than by its text, and MainTabs.js:142 is already in
// via P2. Keyed the same way so the table is one table.
const routeIdKeys = new Set();
for (const r of routeIds) {
  routeIdKeys.add(`${r.at} [route-id] ${JSON.stringify(r.text)}`);
}

console.log(`\n--- N1. the universe, and that no predicate is standing over nothing ---`);
check('source files were found', files.length > 0, true);
check('every file in the universe parsed', parseFailures, 0);
check('the collector collected strings', collectedCount > 0, true);
check('the collector dropped strings', droppedCount > 0, true);
check('P1 (forbidden) matched at least one dropped string', population.some((p) => FORBIDDEN.some((f) => f.word === p.key.match(/\[([^\]]+)\]/)?.[1])), true);
check('P2 (nectar reserve) matched at least one dropped string', population.some((p) => RESERVE.some((r) => r.word === p.key.match(/\[([^\]]+)\]/)?.[1])), true);
check('P3 (navigator route ids) found at least one', routeIds.length > 0, true);
console.log(`     collected ${collectedCount}, dropped ${droppedCount} (+${droppedEmptyCount} empty), raw string-bearing nodes ${rawCount}`);

console.log(`\n--- N2. the extractor, reconciled against the raw walk in both directions ---`);
// A MATCHING TOTAL IS NOT A RECONCILIATION, so both directions are asserted:
// nothing the collector returns is outside the raw walk, and the raw walk is
// exactly partitioned by collected / dropped / empty.
check('the collector returned no node the raw walk did not see', inventedByCollector, []);
check(
  'collected + dropped + empty accounts for every raw string-bearing node',
  collectedCount + droppedCount + droppedEmptyCount,
  rawCount
);

// --- N3. the declared table -------------------------------------------

// THE VOCABULARY IS DECLARED, so a new class cannot be invented in a
// one-word edit the way an exemption can be. Three of the six are
// MECHANICAL — the AST decides them and the table only has to agree. Three
// are DISPOSITIONS about a person, and only those three are a judgement.
const KINDS = {
  'not-copy/module-specifier': 'An import path. No channel carries it to a person.',
  'not-copy/developer-log': 'A console argument. Reaches a developer console and nothing else.',
  'not-copy/matcher-input': 'Compared against text the user wrote. Never rendered.',
  'reads-to-user/ruled': 'A person reads this word and it is the ruled word.',
  'reads-to-user/unruled': 'A person reads this word and NOBODY HAS RULED ON IT.',
  'reads-to-user/wrong-word': 'A person reads this word and a ruling says a different one.',
};

// The channel each mechanical kind must measure as. A kind not listed here
// is a disposition, and dispositions are not checked against the AST
// because "does a person read this" is not a syntactic question.
const MECHANICAL_CHANNEL = {
  'not-copy/module-specifier': 'module-specifier',
  'not-copy/developer-log': 'developer-log',
};

const TABLE = [
  // --- P2, the nectar reserve, in an import path ---------------------
  { at: 'src/components/NectarSendPanel.js:4 [\\bnectar\\b] "../constants/nectar"', kind: 'not-copy/module-specifier' },
  { at: 'src/screens/CombNectarCompose.js:7 [\\bnectar\\b] "../constants/nectar"', kind: 'not-copy/module-specifier' },
  { at: 'src/screens/HoneycombTab.js:27 [\\bnectar\\b] "../constants/nectar"', kind: 'not-copy/module-specifier' },
  { at: 'src/screens/NectarTab.js:10 [\\bnectar\\b] "../constants/nectar"', kind: 'not-copy/module-specifier' },
  { at: 'src/screens/PackageOpen.js:10 [\\bnectar\\b] "../constants/nectar"', kind: 'not-copy/module-specifier' },
  // --- P1, `crypto`, in an import path -------------------------------
  { at: 'src/screens/Onboarding.js:13 [crypto] "expo-crypto"', kind: 'not-copy/module-specifier' },

  // --- P2 in developer logs ------------------------------------------
  { at: 'src/screens/HoneycombTab.js:307 [\\bnectar\\b] "HoneycombTab: failed to load nectar consent"', kind: 'not-copy/developer-log' },
  { at: 'src/screens/HoneycombTab.js:374 [\\bnectar\\b] "HoneycombTab: failed to load nectar balance"', kind: 'not-copy/developer-log' },
  { at: 'src/screens/NectarTab.js:206 [\\bnectar\\b] "NectarTab: failed to load nectar consent"', kind: 'not-copy/developer-log' },
  { at: 'src/screens/NectarTab.js:238 [\\bnectar\\b] "NectarTab: failed to load nectar balance or events"', kind: 'not-copy/developer-log' },
  { at: 'src/screens/PackageOpen.js:165 [\\bnectar\\b] "PackageOpenScreen: failed to load nectar consent"', kind: 'not-copy/developer-log' },
  { at: 'src/screens/PackageOpen.js:207 [\\bnectar\\b] "PackageOpenScreen: failed to load nectar balance"', kind: 'not-copy/developer-log' },

  // --- P1 as themeTagger's KEYWORDS ----------------------------------
  // `THEMES[].keywords` is the left side of `lower.includes(kw)`
  // (themeTagger.js:25). These six are what the tagger LOOKS FOR in a
  // sentence the user wrote. Nothing renders them. The KEY on the same
  // line is a different object and is classified separately below.
  { at: 'src/utils/themeTagger.js:13 [God] "god"', kind: 'not-copy/matcher-input' },
  { at: 'src/utils/themeTagger.js:13 [faith] "faith"', kind: 'not-copy/matcher-input' },
  { at: 'src/utils/themeTagger.js:13 [pray] "pray"', kind: 'not-copy/matcher-input' },
  { at: 'src/utils/themeTagger.js:13 [pray] "prayer"', kind: 'not-copy/matcher-input' },
  { at: 'src/utils/themeTagger.js:13 [blessed] "blessed"', kind: 'not-copy/matcher-input' },
  { at: 'src/utils/themeTagger.js:13 [church] "church"', kind: 'not-copy/matcher-input' },

  // --- reaches a person, and the word is the ruled one ----------------
  // Lumen, 2026-09-06, thread 160660d9: the dock may say `Nectar`, and the
  // four destination names become authored labels. The route id and the
  // ruled word agree here; `Hive` is the one that does not, and it is in
  // N4's table because a route id is identified by its element.
  { at: 'src/navigation/MainTabs.js:142 [\\bnectar\\b] "Nectar"', kind: 'reads-to-user/ruled' },

  // --- reaches a person, and a ruling says a different word ------------
  // FU3 (Lumen, same thread): the bound is one sentence shape, `1 to 1000`,
  // bare, derived from NECTAR_MAX_DROPS. These two render an en dash AND a
  // comma, so they are two departures from one ruled string. The fix is the
  // copy-alignment commit, not this one.
  { at: 'src/screens/CombNectarCompose.js:149 [\\bdrops\\b] "Choose 1–1,000 drops."', kind: 'reads-to-user/wrong-word', owed: 'FU3 copy alignment' },
  { at: 'src/screens/CombNectarCompose.js:212 [\\bdrops\\b] "Choose 1–1,000 drops."', kind: 'reads-to-user/wrong-word', owed: 'FU3 copy alignment' },

  // --- reaches a person, and nobody has ruled --------------------------
  // Money copy on the give screen, authored into a state setter and a local
  // `const`. B4 has never measured any of these: `positionFor` settles
  // nothing above them, so they are not permitted, they are ABSENT. No live
  // defect today — `validationMessage` renders inside `{nectarConsent && …}`
  // and `successMessage` can only be set from `send()`, unreachable without
  // consent — but the standing of the claim is the finding, not the render.
  { at: 'src/screens/CombNectarCompose.js:79 [\\bdrops\\b] "Your balance changed. You have drops now."', kind: 'reads-to-user/unruled', owner: 'Lumen (copy)' },
  { at: 'src/screens/CombNectarCompose.js:172 [\\bdrops\\b] "Sent drops."', kind: 'reads-to-user/unruled', owner: 'Lumen (copy)' },
  { at: 'src/screens/CombNectarCompose.js:172 [\\bdrops\\b] "Sent drops to ."', kind: 'reads-to-user/unruled', owner: 'Lumen (copy)' },

  // A THEME KEY IS USER-FACING COPY. `THEMES[].key` is rendered directly:
  // MonthlyRecap.js:93 `{entry.theme || tagEntry(entry.text)}` inside a
  // <Text>, PollinateWrapped.js:274 `themeWord={insight.theme}`, and
  // RecapTab.js:25 spells it into `You leaned into "…"`. So the word
  // `Faith` is on a screen whenever an entry tags to that theme, and the
  // app chose the label — the user did not write it. That is what makes it
  // a register question rather than the user's own words. UNRULED: the
  // forbidden list bans `\bfaith`, and whether a theme LABEL is inside that
  // ban is a copy ruling nobody has made.
  { at: 'src/utils/themeTagger.js:13 [faith] "Faith"', kind: 'reads-to-user/unruled', owner: 'Lumen (copy)' },
  { at: 'src/utils/demoSeed.js:57 [faith] "Faith"', kind: 'reads-to-user/unruled', owner: 'Lumen (copy)' },

  // Demo entry text. `check-demo-hive` runs the forbidden list over
  // `demoHiveShares` on the stated ground that the demo set is authored
  // copy too. These two are the same class and no gate has ever read them.
  //
  // REACH, measured rather than assumed, because "demo" is not one thing.
  // `buildDemoEntries` is called at `EntryStore.js:168` inside
  // `seedDemoData`, whose own body consults DEMO_CONTENT
  // (`__DEV__ || DEMO_MODE`), from `TodayTab.js:296`. Run at its default
  // 180 days with its fixed seed, the corpus draws 4 Faith days: 2 `pray`
  // lines and 2 `blessed` lines. At 365 it is 13, 7 and 6.
  //
  // THE DEMO ACCOUNT IS A DIFFERENT WRITER AND IT IS CLEAN ON THE TEXT.
  // `scripts/lib/demo-seed-corpus.mjs` is what `seed-demo-account.mjs`
  // writes, and its Faith-tagged lines carry no listed word — somebody
  // already avoided them there. What it does carry is the THEME, so the
  // label `Faith` renders on that account too. Scope: that file is under
  // `scripts/`, outside this gate's universe, so this is a statement about
  // where I looked and not a claim about the tree.
  { at: 'src/utils/demoSeed.js:44 [pray] "I am grateful for a moment of real quiet to pray today."', kind: 'reads-to-user/unruled', owner: 'Lumen (copy)' },
  { at: 'src/utils/demoSeed.js:45 [blessed] "I am grateful to feel blessed even on an ordinary day."', kind: 'reads-to-user/unruled', owner: 'Lumen (copy)' },
];

const measured = new Map();
for (const p of population) measured.set(p.key, p.channel);
const declared = new Map(TABLE.map((t) => [t.at, t]));

console.log(`\n--- N3. every dropped string matching a declared predicate is classified ---`);
check('every declared kind is in the declared vocabulary', TABLE.every((t) => KINDS[t.kind]), true);
check(
  'no dropped string matching a predicate is missing from the table',
  [...measured.keys()].filter((k) => !declared.has(k)).sort(),
  []
);
check(
  'no table entry names a string that is no longer dropped, or no longer matches',
  [...declared.keys()].filter((k) => !measured.has(k)).sort(),
  []
);
check(
  'every mechanical kind agrees with the channel measured off the AST',
  TABLE.filter((t) => MECHANICAL_CHANNEL[t.kind] && measured.get(t.at) !== MECHANICAL_CHANNEL[t.kind])
    .map((t) => `${t.at} declared ${t.kind}, measured ${measured.get(t.at)}`)
    .sort(),
  []
);
// A misfile in the other direction: something the AST says is an import
// path or a console argument, filed as copy a person reads.
check(
  'nothing measured as a module specifier or a developer log is filed as read by a person',
  TABLE.filter(
    (t) =>
      t.kind.startsWith('reads-to-user/') &&
      ['module-specifier', 'developer-log'].includes(measured.get(t.at))
  ).map((t) => t.at),
  []
);
// A single-word matcher input is the shape this class is FOR. A prose
// sentence filed as one is a misfile, and it is the direction that hides.
check(
  'no matcher input is prose-shaped',
  TABLE.filter((t) => t.kind === 'not-copy/matcher-input')
    .filter((t) => /"(.*)"$/.test(t.at) && /\s/.test(t.at.slice(t.at.indexOf('] "') + 3, -1)))
    .map((t) => t.at),
  []
);
// Every disposition about a person names who owes the answer, so an
// unruled entry cannot sit here anonymously.
check(
  'every unruled entry names a ruling owner, every wrong-word entry names the work that fixes it',
  TABLE.filter(
    (t) =>
      (t.kind === 'reads-to-user/unruled' && !t.owner) ||
      (t.kind === 'reads-to-user/wrong-word' && !t.owed)
  ).map((t) => t.at),
  []
);

// --- N4. P3, the route ids --------------------------------------------

// A route id is identified by its ELEMENT rather than by its text, so it
// gets its own section: the question is not "does this string contain a
// listed word" but Lumen's wider one — IS THIS WORD READ TO A PERSON, AND
// IS IT THE RULED ONE. The money reserve is one column of that question,
// not the filter on it. My own complement census could not see `Hive`
// because the reserve WAS the filter, and `Hive` is not a money word.
//
// The four tab labels, ruled by Lumen 2026-09-06 in thread 160660d9:
// `Today`, `Honeycomb`, `Nectar`, `Garden`. Narrow ruling, four destination
// names, no general reserve change.
const RULED_TAB_LABELS = {
  'src/navigation/MainTabs.js:140': 'Today',
  'src/navigation/MainTabs.js:141': 'Honeycomb',
  'src/navigation/MainTabs.js:142': 'Nectar',
  'src/navigation/MainTabs.js:148': 'Garden',
};

// The one place the route id and the ruled word disagree today. FU2 is the
// commit that closes it, with a string `tabBarLabel` on all four screens —
// `tabBarAccessibilityLabel` carries only the VoiceOver channel
// (BottomTabBar.tsx:430-431) and would leave the Large Content Viewer HUD
// still drawing `Hive`, which is the half fix that looks done.
const TAB_LABEL_DISAGREEMENTS = ['src/navigation/MainTabs.js:141 route id "Hive" vs ruled "Honeycomb"'];

const tabRoutes = routeIds.filter((r) => r.navigator === 'Tab.Screen');
const otherRoutes = routeIds.filter((r) => r.navigator !== 'Tab.Screen');

console.log(`\n--- N4. route ids: which are read to a person, and are they the ruled word ---`);
check('tab route ids were found', tabRoutes.length > 0, true);
check('route ids outside the tab bar were found', otherRoutes.length > 0, true);
check(
  'every tab route id has a ruled label declared for it',
  tabRoutes.filter((r) => !RULED_TAB_LABELS[r.at]).map((r) => `${r.at} "${r.text}"`).sort(),
  []
);
check(
  'no ruled tab label names a position that is no longer a tab screen',
  Object.keys(RULED_TAB_LABELS).filter((at) => !tabRoutes.some((r) => r.at === at)).sort(),
  []
);
// THE STRUCTURAL LICENCE for every other route id: a native-stack header
// with no `title` falls back to `route.name`, so a Stack route id is a word
// a person reads exactly when its navigator shows headers. Asserted off the
// enclosing <*.Navigator>'s own screenOptions, and paired with the override
// sweep, because "headers are off" is two claims: the default, and that
// nothing turns it back on for one screen.
check(
  'every route id outside the tab bar sits under a navigator with headers off',
  otherRoutes.filter((r) => !r.headersOff).map((r) => `${r.at} "${r.text}"`).sort(),
  []
);
check('no screen turns a stack header back on', headerOverrides.sort(), []);
// The tab bar is the opposite case and the reason this section exists.
// `tabBarShowLabel: false` hides the PAINTED label only; the route name
// still reaches a person through the VoiceOver announcement and the iOS
// Large Content Viewer HUD, neither of which that flag touches.
check(
  'the tab route ids that disagree with their ruled label are exactly the declared ones',
  tabRoutes
    .filter((r) => RULED_TAB_LABELS[r.at] && RULED_TAB_LABELS[r.at] !== r.text)
    .map((r) => `${r.at} route id "${r.text}" vs ruled "${RULED_TAB_LABELS[r.at]}"`)
    .sort(),
  TAB_LABEL_DISAGREEMENTS.slice().sort()
);

// --- what this gate found that nobody has ruled on ---------------------
// PRINTED ON EVERY RUN, not folded into a pass count. An unruled string
// filed as acceptable is a gate implying a measurement nobody took; an
// unruled string nobody can see is the same thing with better manners.
const unruled = TABLE.filter((t) => t.kind === 'reads-to-user/unruled');
const wrongWord = [
  ...TABLE.filter((t) => t.kind === 'reads-to-user/wrong-word').map((t) => `${t.at}  → ${t.owed}`),
  ...TAB_LABEL_DISAGREEMENTS.map((d) => `${d}  → FU2 dock labels`),
];
console.log(`\n--- OWED: ${unruled.length} unruled, ${wrongWord.length} wrong-word ---`);
for (const t of unruled) console.log(`     unruled     ${t.at}  → ${t.owner}`);
for (const w of wrongWord) console.log(`     wrong-word  ${w}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
