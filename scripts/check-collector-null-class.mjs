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
// At the commit this gate landed on, neither `tabBarLabel` nor `title` was
// set on any of the four tab screens, so both channels fell back to
// `route.name`: VoiceOver SPOKE it, and the iOS Large Content Viewer DREW
// it as a HUD on a long press at large text sizes. The second one is a
// rendering, not an announcement.
//
// AMENDED BY FU2 (Pixel, 2026-09-06). All four tab screens now declare a
// string `tabBarLabel`, so the fallback is unreachable and the route ids
// are no longer copy. N4 asserts that structurally rather than restating
// it: THE SENTENCE ABOVE IS EXACTLY THE KIND THAT EXPIRES, which is what
// put the route ids in this gate in the first place. What P3 measures now
// is the LABEL — and the label is in the null class too, because `options`
// is not a TEXT_ATTRS attribute, so the one word the dock speaks is
// invisible to `check-copy-rules` for the same reason the route id was.
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

// --- the universe: check-copy-rules' own, PLUS one file it cannot reach ---
//
// The tree half is exactly the universe `check-copy-rules` stands over, which
// is what makes this gate its complement rather than a second opinion.
//
// THE CORPUS IS THE OTHER HALF, and it widens the subject on purpose (Lumen,
// FU4, thread 160660d9). `scripts/lib/demo-seed-corpus.mjs` is authored copy:
// 180 streak entries and two combs of keepsake text, ratified line by line,
// written by `seed-demo-account.mjs` into a real account that Colin demos and
// that App Store review reads. No gate had ever run the forbidden list over
// it, and not because anything exempted it. It sits under `scripts/`, so it
// was outside every copy gate's FILE universe the way the null class is
// outside the collector's NODE universe.
//
// Those are the same failure wearing two costumes, which is why the fold
// belongs here and not in a fourteenth gate: this file's subject is authored
// copy that no gate reads. The collector's null class is one source of it.
// A file nobody pointed a gate at is the other.
const CORPUS = path.join(ROOT, 'scripts/lib/demo-seed-corpus.mjs');
const files = [];
(function walkDir(dir) {
  for (const name of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walkDir(p);
    else if (/\.jsx?$/.test(name)) files.push(p);
  }
})(SRC);
files.push(path.join(ROOT, 'App.js'));
files.push(CORPUS);
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

// The string `tabBarLabel` declared on one <Tab.Screen>'s own `options`,
// or undefined. STRING ONLY, because that is the whole of the mechanism:
// `getLabel` (BottomTabItem.tsx:218-226) takes `tabBarLabel` only when
// `typeof … === 'string'` and otherwise falls straight back through `title`
// to `route.name`. A function `tabBarLabel` is a renderer for the PAINTED
// label, which `tabBarShowLabel: false` never draws, so it would leave both
// accessibility channels on the route id while looking declared.
const declaredTabBarLabel = (openingElement) => {
  for (const attr of openingElement.attributes) {
    if (attr.type !== 'JSXAttribute' || attr.name?.name !== 'options') continue;
    const obj = attr.value?.type === 'JSXExpressionContainer' ? attr.value.expression : null;
    if (obj?.type !== 'ObjectExpression') return undefined;
    for (const prop of obj.properties) {
      if (
        prop.type === 'ObjectProperty' &&
        prop.key?.name === 'tabBarLabel' &&
        prop.value?.type === 'StringLiteral'
      ) {
        return prop.value.value;
      }
    }
  }
  return undefined;
};

// Every component named by `screenOptions.tabBarButton`. Returned as a list
// rather than a single name so a second one cannot arrive unmeasured.
const tabBarButtonComponents = (attr) => {
  const names = [];
  const seen = new Set();
  (function find(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(find);
    if (
      node.type === 'ObjectProperty' &&
      node.key?.name === 'tabBarButton'
    ) {
      (function findJsx(n) {
        if (!n || typeof n !== 'object') return;
        if (Array.isArray(n)) return n.forEach(findJsx);
        if (n.type === 'JSXOpeningElement' && n.name?.type === 'JSXIdentifier') {
          if (!seen.has(n.name.name)) { seen.add(n.name.name); names.push(n.name.name); }
        }
        for (const k of Object.keys(n)) if (k !== 'loc') findJsx(n[k]);
      })(node.value);
      return;
    }
    for (const k of Object.keys(node)) if (k !== 'loc') find(node[k]);
  })(attr.value);
  return names;
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
const tabBarButtons = [];  // the component named by screenOptions.tabBarButton
const components = new Map();  // component name -> how it treats the props it is handed
// The corpus's own contribution, tracked separately from the tree's. A row
// that says "zero hits in the corpus" is vacuous unless the same run can say
// how many of its strings were examined to get there.
let corpusDropped = 0;

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
            // The declared label, read off THIS element's own `options`.
            // `undefined` means no string `tabBarLabel` is declared, which
            // is the state that puts `route.name` back in front of a
            // person — so it is a value the rows below can fail on rather
            // than an absence they cannot see.
            label: declaredTabBarLabel(node),
          });
        }
      }
      // `tabBarButton` replaces the element BottomTabItem hands the two
      // accessibility props to, so the component it names is part of the
      // delivery chain and is checked below.
      if (n?.type === 'JSXMemberExpression' && n.property?.name === 'Navigator') {
        for (const attr of node.attributes) {
          if (attr.type !== 'JSXAttribute' || attr.name?.name !== 'screenOptions') continue;
          for (const name of tabBarButtonComponents(attr)) {
            tabBarButtons.push({ at: `${rel}:${attr.loc?.start.line}`, name });
          }
        }
      }
      return;
    }
    // Every `const X = ({ … }) => …` in the tree, recorded by how it treats
    // the props it is handed. Needed because `tabBarButton` REPLACES the
    // element BottomTabItem hands `aria-label` and
    // `accessibilityLargeContentTitle` to, so a component that destructures
    // one of them away, or stops spreading its rest, silently deletes the
    // channel that the declared label exists to feed.
    if (
      node.type === 'VariableDeclarator' &&
      node.id?.type === 'Identifier' &&
      (node.init?.type === 'ArrowFunctionExpression' || node.init?.type === 'FunctionExpression')
    ) {
      const param = node.init.params[0];
      if (param?.type === 'ObjectPattern') {
        const named = [];
        let restName;
        for (const prop of param.properties) {
          if (prop.type === 'RestElement' && prop.argument?.type === 'Identifier') {
            restName = prop.argument.name;
          } else if (prop.type === 'ObjectProperty') {
            named.push(prop.key?.name ?? prop.key?.value);
          }
        }
        let spreadsRest = false;
        if (restName) {
          walkWithAncestry(node.init.body, (inner) => {
            if (
              inner.type === 'JSXSpreadAttribute' &&
              inner.argument?.type === 'Identifier' &&
              inner.argument.name === restName
            ) {
              spreadsRest = true;
            }
          });
        }
        components.set(node.id.name, {
          at: `${rel}:${node.loc?.start.line}`,
          named,
          restName,
          spreadsRest,
        });
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
    if (file === CORPUS) corpusDropped += 1;

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

console.log(`\n--- N1. the universe, and that no predicate is standing over nothing ---`);
check('source files were found', files.length > 0, true);
check('every file in the universe parsed', parseFailures, 0);
check('the collector collected strings', collectedCount > 0, true);
check('the collector dropped strings', droppedCount > 0, true);
check('P1 (forbidden) matched at least one dropped string', population.some((p) => FORBIDDEN.some((f) => f.word === p.key.match(/\[([^\]]+)\]/)?.[1])), true);
check('P2 (nectar reserve) matched at least one dropped string', population.some((p) => RESERVE.some((r) => r.word === p.key.match(/\[([^\]]+)\]/)?.[1])), true);
check('P3 (navigator route ids) found at least one', routeIds.length > 0, true);

// THE CORPUS ARM, and it is the END STATE of FU4's rename rather than a
// standing question. Lumen ruled the fold in the same commit as the rename
// (thread 160660d9) because the corpus's fifteen `Faith` strings were
// exactly the strings the rename moved: fourteen `theme:` tags and the
// STREAK_THEMES membership. Before the rename this arm produced fifteen
// entries the table would have had to carry. After it, zero.
//
// So the row below is not decorative. A rename that reached the app tree and
// stopped at `scripts/` reds it by name and line, and so does any future
// corpus line written with a banned word in it. The cross-file half, that
// all four writers of the theme identity moved together, is
// `check-theme-keys` T1 and is not restated here.
const corpusRel = path.relative(ROOT, CORPUS);
// One expression, read twice: the row asserts it and the log line below
// prints its length. A hand-typed `0` in the print would be a second writer
// of the same answer, and the one that never reds.
const corpusHits = population.filter((p) => p.key.startsWith(`${corpusRel}:`)).map((p) => p.key).sort();
check('the corpus file is in the universe', files.includes(CORPUS), true);
check('the corpus contributed strings to examine', corpusDropped > 0, true);
check('no corpus string matches a forbidden or reserved word', corpusHits, []);
console.log(`     collected ${collectedCount}, dropped ${droppedCount} (+${droppedEmptyCount} empty), raw string-bearing nodes ${rawCount}`);
console.log(`     of which the corpus: ${corpusDropped} dropped strings, ${corpusHits.length} predicate hit${corpusHits.length === 1 ? '' : 's'}`);

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
  'not-copy/route-identity': 'A navigator route id whose label channels are all declared. No channel carries it to a person.',
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
  { at: 'src/screens/HoneycombTab.js:376 [\\bnectar\\b] "HoneycombTab: failed to load received nectar total"', kind: 'not-copy/developer-log' },
  { at: 'src/screens/HoneycombTab.js:396 [\\bnectar\\b] "HoneycombTab: failed to load nectar balance"', kind: 'not-copy/developer-log' },
  { at: 'src/screens/NectarTab.js:206 [\\bnectar\\b] "NectarTab: failed to load nectar consent"', kind: 'not-copy/developer-log' },
  { at: 'src/screens/NectarTab.js:238 [\\bnectar\\b] "NectarTab: failed to load nectar balance or events"', kind: 'not-copy/developer-log' },
  { at: 'src/screens/PackageOpen.js:166 [\\bnectar\\b] "PackageOpenScreen: failed to load nectar consent"', kind: 'not-copy/developer-log' },
  { at: 'src/screens/PackageOpen.js:208 [\\bnectar\\b] "PackageOpenScreen: failed to load nectar balance"', kind: 'not-copy/developer-log' },

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

  // --- P1 as a RETIRED KEY, which is a matcher input too -------------------
  // FU4's legacy map. `LEGACY_THEME_KEYS.get(theme)` compares this string
  // against a theme read out of `entries.theme`, so it sits on the same side
  // of the same kind of comparison as the keywords above: it is what the
  // lookup LOOKS FOR, and the only value it can ever produce is `Spirit`.
  // The banned word survives in the tree precisely so that no row still
  // holding it can render it.
  { at: 'src/utils/themeTagger.js:40 [faith] "Faith"', kind: 'not-copy/matcher-input' },

  // --- reaches a person, and the word is the ruled one ----------------
  // Lumen, 2026-09-06, thread 160660d9: the dock may say `Nectar`, and the
  // four destination names become authored labels. FU2 declares all four as
  // string `tabBarLabel`s, so THE LABEL is the word a person now hears and
  // the route id beside it is no longer read at all (N4).
  //
  // The label is in this table and not in `check-copy-rules`' universe for
  // the reason this gate exists: `options` is not a TEXT_ATTRS attribute, so
  // `positionFor` settles nothing above it and the string never enters the
  // collector's universe. The one word the dock speaks is in the null class.
  { at: 'src/navigation/MainTabs.js:204 [\\bnectar\\b] "Nectar"', kind: 'reads-to-user/ruled' },

  // The route id on the line beside it. Same text, different object, and
  // after FU2 a different disposition: `getLabel` reaches `route.name` only
  // when neither a string `tabBarLabel` nor a `title` is declared, and N4
  // asserts all four labels are declared. Nothing reads it to a person.
  { at: 'src/navigation/MainTabs.js:202 [\\bnectar\\b] "Nectar"', kind: 'not-copy/route-identity' },

  // --- reaches a person, and the word is the ruled one ----------------
  // FU3 (Lumen, 2026-09-06, same thread; R-NT ratification items 5 and 6).
  // Both halves of that ruling land here, and BOTH CHANGED THE POPULATION,
  // which is worth stating because it is the shape a copy commit hides in.
  //
  // The bound is one derived sentence, `Choose 1 to 1000 drops.`, taken from
  // NECTAR_MIN_DROPS/NECTAR_MAX_DROPS at both sites. The text below reads
  // `"Choose to drops."` because this gate's raw walk joins a template
  // literal's quasis and drops the interpolation — the collector's own
  // limitation, named in `rendered-strings.mjs`, not a second spelling.
  //
  // The pluralisation is written as WHOLE SENTENCES at every arm rather than
  // as `${n} ${unit}`, so each rendered string is still a string in the
  // source. A computed unit would have taken every one of these sentences out
  // of the nectar reserve's population — the reserve matches `\bdrops\b` and
  // `\b\d+\s+drop\b` on TEXT, and neither survives being interpolated —
  // and they would have left this table silently while rendering unchanged.
  //
  // Five entries left and eight arrived. THREE of the eight are new, and they
  // are the three singular arms below; the other five are the same strings the
  // table already carried, moved by the line shift and reclassified. The
  // fourth singular arm Lumen's ruling names, `NectarSendPanel.js:240`'s
  // `You have 1 drop.`, is NOT missing from this table: it sits in a
  // <Text> child, so `positionFor` settles it, so it is COLLECTED and
  // `check-copy-rules` stands over it. Four ruled sites, three of them here,
  // because this gate is the complement and not the universe.
  { at: 'src/screens/CombNectarCompose.js:92 [\\b\\d+\\s+drop\\b] "Your balance changed. You have 1 drop now."', kind: 'reads-to-user/ruled' },
  { at: 'src/screens/CombNectarCompose.js:93 [\\bdrops\\b] "Your balance changed. You have drops now."', kind: 'reads-to-user/ruled' },
  { at: 'src/screens/CombNectarCompose.js:165 [\\bdrops\\b] "Choose to drops."', kind: 'reads-to-user/ruled' },
  { at: 'src/screens/CombNectarCompose.js:193 [\\b\\d+\\s+drop\\b] "Sent 1 drop."', kind: 'reads-to-user/ruled' },
  { at: 'src/screens/CombNectarCompose.js:194 [\\b\\d+\\s+drop\\b] "Sent 1 drop to ."', kind: 'reads-to-user/ruled' },
  { at: 'src/screens/CombNectarCompose.js:196 [\\bdrops\\b] "Sent drops."', kind: 'reads-to-user/ruled' },
  { at: 'src/screens/CombNectarCompose.js:197 [\\bdrops\\b] "Sent drops to ."', kind: 'reads-to-user/ruled' },
  { at: 'src/screens/CombNectarCompose.js:237 [\\bdrops\\b] "Choose to drops."', kind: 'reads-to-user/ruled' },

  // A THEME KEY IS USER-FACING COPY, and both rows that used to sit here are
  // GONE rather than reclassified. `THEMES[].key` renders directly
  // (TodayTab.js:618, MonthlyRecap.js:93, PollinateWrapped.js:274,
  // RecapTab.js:428), so the label was a banned word on a screen in our own
  // voice. Lumen ruled it INSIDE the ban (FU4, 2026-09-06, thread
  // 160660d9): no exemption, because a carve-out from R15 is Colin's to
  // grant. The key is now `Spirit`, which is a word already on the theme's
  // own keyword list, so a person who writes it gets their own word back.
  //
  // THE DELETION IS THE ASSERTION. This gate's own N3 rows are two-sided: a
  // string that stops matching must leave the table, and a string that
  // starts matching must arrive in it. So the four rows FU4 removed cannot
  // be removed early, and a revert of the rename cannot pass by leaving
  // them behind. `check-theme-keys` T1 holds the other half, that all four
  // writers of the identity moved together.

  // Demo entry text. The two `demoSeed.js` lines that used to sit here are
  // gone for the same reason and by the same rule as the theme rows above.
  // Lumen's ground, FU4: R15's own sentence is "on a screen", and a demo
  // screen is a screen whose audience is exactly who the register bar exists
  // for. The law already reached authored demo content anyway, since
  // `check-demo-hive` runs the forbidden list over `demoHiveShares`; these
  // two were never exempt, they had just never been inside any gate's
  // universe until this one.
  //
  // The scope sentence that used to close this block is now retired by
  // measurement rather than by argument. It said the demo ACCOUNT corpus was
  // clean on the text but carried the theme, and that the claim was only
  // about where I had looked, because `scripts/` was outside this gate's
  // universe. `scripts/lib/demo-seed-corpus.mjs` IS the universe now, and
  // the rows in N1 say what it contributes.
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
//
// FU2 CHANGES WHAT THIS SECTION MEASURES. Before it, no tab screen declared
// a label, both accessibility channels fell back through `getLabel` to
// `route.name`, and the route id WAS the word — so `Hive` was filed
// wrong-word. FU2 declares a string `tabBarLabel` on all four, which moves
// the subject: the LABEL is now the word a person reads, the route id is
// navigation identity that nothing carries, and the rows below assert the
// structure that makes that true rather than the sentence that says it.
const RULED_TAB_LABELS = {
  'src/navigation/MainTabs.js:192': 'Today',
  'src/navigation/MainTabs.js:197': 'Honeycomb',
  'src/navigation/MainTabs.js:202': 'Nectar',
  'src/navigation/MainTabs.js:212': 'Garden',
};

// The props BottomTabItem hands to `tabBarButton`, which is what makes the
// declared label reach a person at all:
//
//   BottomTabItem.tsx:348   'aria-label': accessibilityLabel
//                             (BottomTabBar.tsx:429-434, the SPOKEN string)
//   BottomTabItem.tsx:349   accessibilityLargeContentTitle: labelString
//                             (the iOS Large Content Viewer HUD, DRAWN)
//
// A custom button that names either one in its own prop pattern captures it
// out of the rest object and, unless it re-passes it by hand, deletes the
// channel. The declared label is still there, still correct, and reaches
// nobody: an evaluated expression with no wiring under it.
const DELIVERED_A11Y_PROPS = [
  'aria-label',
  'accessibilityLabel',
  'accessibilityLargeContentTitle',
  'accessibilityShowsLargeContentViewer',
];

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

// THE STRUCTURAL LICENCE for the four tab route ids, and it is the whole of
// FU2. `getLabel({ label, title }, route.name)` returns the fallback only
// when both are undefined, and `tabBarLabel` counts as `label` only when it
// is a STRING (BottomTabItem.tsx:218-226). So a declared string label on
// every tab screen is what makes the route id unreachable — asserted as a
// universal over the tab screens the AST found, so a fifth tab added
// without one reds here instead of quietly re-opening the channel.
check(
  'every tab screen declares a string tabBarLabel, so getLabel never reaches route.name',
  tabRoutes.filter((r) => r.label === undefined).map((r) => `${r.at} "${r.text}"`).sort(),
  []
);
// And the label is the RULED word. This is the row that used to be about
// the route id; the subject moved with the mechanism.
check(
  'every declared tab label is the ruled word',
  tabRoutes
    .filter((r) => RULED_TAB_LABELS[r.at] && r.label !== RULED_TAB_LABELS[r.at])
    .map((r) => `${r.at} label ${JSON.stringify(r.label)} vs ruled "${RULED_TAB_LABELS[r.at]}"`)
    .sort(),
  []
);
// The delivery half. A declared label that the custom button eats is a
// label nobody hears, and nothing about the declaration would show it.
check('screenOptions names a custom tabBarButton component', tabBarButtons.length > 0, true);
check(
  'every custom tabBarButton component resolves to a declaration this walk saw',
  tabBarButtons.filter((b) => !components.has(b.name)).map((b) => `${b.at} ${b.name}`).sort(),
  []
);
check(
  'every custom tabBarButton spreads the props it does not name',
  tabBarButtons
    .filter((b) => components.has(b.name))
    .filter((b) => !components.get(b.name).spreadsRest)
    .map((b) => `${b.at} ${b.name} declared at ${components.get(b.name).at}`)
    .sort(),
  []
);
check(
  'no custom tabBarButton captures an accessibility prop out of that spread',
  tabBarButtons
    .filter((b) => components.has(b.name))
    .flatMap((b) =>
      components
        .get(b.name)
        .named.filter((n) => DELIVERED_A11Y_PROPS.includes(n))
        .map((n) => `${components.get(b.name).at} ${b.name} names ${JSON.stringify(n)}`)
    )
    .sort(),
  []
);

// --- what this gate found that nobody has ruled on ---------------------
// PRINTED ON EVERY RUN, not folded into a pass count. An unruled string
// filed as acceptable is a gate implying a measurement nobody took; an
// unruled string nobody can see is the same thing with better manners.
const unruled = TABLE.filter((t) => t.kind === 'reads-to-user/unruled');
const wrongWord = TABLE.filter((t) => t.kind === 'reads-to-user/wrong-word').map(
  (t) => `${t.at}  → ${t.owed}`
);
console.log(`\n--- OWED: ${unruled.length} unruled, ${wrongWord.length} wrong-word ---`);
for (const t of unruled) console.log(`     unruled     ${t.at}  → ${t.owner}`);
for (const w of wrongWord) console.log(`     wrong-word  ${w}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
