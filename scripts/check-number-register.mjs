#!/usr/bin/env node
// Every number this app renders next to a noun, and whether it is spelled
// as a WORD or as a DIGIT.
//
//   npm run check:number-register
//
// WHY THIS FILE EXISTS
//
// `src/utils/numberWords.js` used to open with a universal: "a rendered
// count is a word, never a digit". Practice contradicted it in more than a
// dozen places, and a header wider than its practice is an exemption
// waiting to outlive its justification — the exact failure this repo has
// already paid for once in `check-copy-rules`' route-id argument.
//
// Lumen ruled the criterion (thread 160660d9, FU3.1) and it is a REGISTER,
// not a blanket:
//
//   a count inside a SENTENCE — a clause with a verb, prose speaking to
//   the reader — is a word:            "Six people are in this comb."
//   a count in a bare noun-phrase LABEL — the stat register, card
//   metadata with no verb — is a digit:  "12 memories"
//
// Digits read as data, words read as speech. Her ruling also asked that
// the census be PRINTED and classified against the criterion, "so the
// criterion lands as a measurement rather than prose". That is this file.
//
// WHAT THE CENSUS MEASURED, AND WHERE IT PARTED FROM THE RULING'S OWN
// LICENCE CLAUSE
//
// The ruling's supporting sentence was that "every digit site you and I
// both found is a verb-less label, and every sentence writer but
// OrganizerCombCard already speaks words". That was true of the sites the
// two of us had found by hand, and it is FALSE of the tree. Swept here,
// there are sentence-register digit sites beyond the label ones, and they
// do not form one class:
//
//   people and things   "Filed to 3 hives." / "3 of you are writing."
//                       "5 people wrote this for you." / "Invite 2 writers"
//                       — the same class as the OrganizerCombCard defect
//   quantities          "You have 40 drops." / "Sent 40 drops."
//                       — drops are money (SATS ruling); money is figures
//   ratios and spans    "12 of 30 days this month" / "at least 13 years old"
//                       — a ratio spelled out reads worse, not better
//
// So the criterion needs a second axis nobody has ruled, and this gate
// does NOT invent it. Every such site is filed `unruled` and PRINTED ON
// EVERY RUN. What is asserted is the part that is ruled: the sentence
// "N people are in this comb." has one spelling across all four of its
// writers, and no entry may drift from its declared classification.
//
// THE UNIVERSE IS RAW, AND THAT IS DELIBERATE
//
// It is not `collectRenderedStrings`. Measured at e8f2b49, the collector
// keeps 26 of the 63 sites this walk finds; the whole "N people are in
// this comb." family, every "1 memory / N memories" pair and every nectar
// sentence are in its NULL CLASS, because each is a `const` in a component
// body rather than a string sitting in a JSX child or a text attribute.
// That blind spot is real and it already has an owner —
// `check-collector-null-class` — so the right move here is to walk the
// tree directly and say so, not to inherit a universe that drops the
// question's own subject.
//
// The cost of a raw walk is noise: `${CONTACT_EMAIL} reaches a person` has
// an interpolation followed by a lowercase word too. That is what
// UNRESOLVED_SLOTS is for. The resolver settles what it can structurally
// (`.length`, `.size`, arithmetic, numeric literals, a `numberInWords*`
// call, and single-declarator identifiers resolved to their init); every
// slot it cannot settle must be DECLARED numeric or not-a-number by a
// person. A slot that is neither resolved nor declared fails this gate.
// The heuristic can be wrong; it cannot be silent.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from '@babel/parser';
import { walkWithAncestry } from './lib/rendered-strings.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

// --- the declared vocabularies -----------------------------------------
// Written as sets so a row can be a UNIVERSAL: a member matching no branch
// is a failure, not an absence. A classifier written as a list of
// forbidden shapes has a null class, and the null class is a population.
// `not-copy` is not "no number here" — it is "this string is not read by a
// person as copy": a console line, a cadence value stored in the database,
// a documentation constant. The number in it is real; the register
// question does not apply. Same distinction FU2 drew between a route id
// and a tab label.
const KINDS = ['count', 'not-copy'];
const REGISTERS = ['sentence', 'label'];
const SPELLINGS = ['word', 'digit'];
const DISPOSITIONS = ['ruled', 'unruled'];

// --- the ruled sentence -------------------------------------------------
// FU3.1's whole subject. One sentence, four writers, one spelling.
const RULED_SENTENCE = '{} people are in this comb.';

// --- slots the structural resolver cannot settle ------------------------
// Keyed `file :: expression source`, so one entry covers every occurrence
// of that expression in that file and prose edits around it do not red
// this gate. The value is the ANSWER a person gives: is this slot a
// number?  Props, function parameters and cross-module imports are all
// genuinely unresolvable from one file's AST, which is most of this table.
const UNRESOLVED_SLOTS = {
  // numbers the resolver cannot reach: props, function parameters, and
  // constants imported from another module
  'src/components/FileToHive.js :: hive.entryCount': 'numeric',
  'src/components/HiveCard.js :: hive.entryCount': 'numeric',
  'src/components/NectarSendPanel.js :: amount': 'numeric',
  'src/components/NectarSendPanel.js :: displayDrops === undefined ? balanceDrops : displayDrops': 'numeric',
  'src/components/OrganizerCombCard.js :: chapterCount': 'numeric',
  'src/components/RotationFold.js :: daysLeft': 'numeric',
  'src/screens/CombNectarCompose.js :: NECTAR_MAX_DROPS': 'numeric',
  'src/screens/CombNectarCompose.js :: NECTAR_MIN_DROPS': 'numeric',
  'src/screens/CombNectarCompose.js :: drops': 'numeric',
  'src/screens/CombNectarCompose.js :: resolvedAmount': 'numeric',
  'src/screens/MonthlyRecap.js :: daysInMonth': 'numeric',
  'src/screens/PollinateWrapped.js :: count': 'numeric',
  'src/screens/PollinateWrapped.js :: total': 'numeric',
  'src/screens/RecapTab.js :: count': 'numeric',
  'src/screens/TodayTab.js :: count': 'numeric',
  'src/utils/seedDraft.js :: SEED_CONTENT_MAX': 'numeric',

  // not numbers at all — a name, a label, an address. These are the price
  // of a raw walk: an interpolation followed by a lowercase word looks
  // exactly like a count until somebody says otherwise.
  'src/constants/legalCopy.js :: CONTACT_EMAIL': 'not-a-number',
  'src/screens/CombInvite.js :: preview.subjectName': 'not-a-number',
  'src/screens/ContributingHive.js :: names[0]': 'not-a-number',
  'src/screens/CreateHive.js :: themeOption.label': 'not-a-number',
  'src/screens/HiveDetail.js :: names[0]': 'not-a-number',
  'src/screens/PackageOpen.js :: pkg.senderName': 'not-a-number',
  'src/screens/RecapTab.js :: monthLabel': 'not-a-number',
  "src/screens/ReceivedPackages.js :: names.slice(0, -1).join(', ')": 'not-a-number',
  'src/screens/ReceivedPackages.js :: names[0]': 'not-a-number',
  "src/utils/seedDraft.js :: recipientName ?? 'They'": 'not-a-number',
};

// --- the census ---------------------------------------------------------
// Keyed `file :: shape` for interpolated sites and `file :: fragment` for
// literal ones — a shape survives line drift, so a moved line does not red
// this gate but a CHANGED SENTENCE does, which is exactly when the
// classification should be re-taken.
// A row is `count(register, spelling, disposition, owed)` or `notCopy(why)`.
// `disposition: 'ruled'` means the criterion decides this site and it
// conforms; `'unruled'` means the criterion does not reach it yet and the
// question is printed on every run. `spelling` is DECLARED here and
// MEASURED by B4, so a site cannot claim a spelling the code does not have.
const count = (register, spelling, disposition, owed) => ({ kind: 'count', register, spelling, disposition, owed });
const notCopy = (why) => ({ kind: 'not-copy', why });

const SENTENCE_THINGS = 'people-and-things: the OrganizerCombCard class, a countable noun in prose';
const QUANTITY = 'quantity: drops are money (SATS ruling), and money is figures in every register';
const LIMIT = 'limit: a bound or a cap, not a tally of anything on screen';
const SPAN = 'span: a duration, an age, a date range';
const RATIO = 'ratio: N of M, where spelling one side and not the other reads worse than both as figures';

const NUMBER_SITES = {
  // --- the ruled sentence. FU3.1's whole subject: four writers, one
  // spelling. OrganizerCombCard was the outlier and is fixed here.
  'src/components/OrganizerCombCard.js :: {} people are in this comb.': count('sentence', 'word', 'ruled', ''),
  'src/components/RotationFold.js :: {} people are in this comb.': count('sentence', 'word', 'ruled', ''),
  'src/screens/CombInvite.js :: {} people are in this comb.': count('sentence', 'word', 'ruled', ''),
  'src/components/RotationFold.js :: {} people are writing': count('sentence', 'word', 'ruled', ''),

  // --- the stat register. Card metadata, a chip, an a11y label for a grid
  // cell: no verb, and a digit is right. These are the sites the header's
  // old universal was wrong about.
  'src/components/FileToHive.js :: 1 memory': count('label', 'digit', 'ruled', ''),
  'src/components/FileToHive.js :: {} memories': count('label', 'digit', 'ruled', ''),
  'src/components/HiveCard.js :: 1 memory': count('label', 'digit', 'ruled', ''),
  'src/components/HiveCard.js :: {} memories': count('label', 'digit', 'ruled', ''),
  'src/screens/ContributingHive.js :: 1 memory': count('label', 'digit', 'ruled', ''),
  'src/screens/ContributingHive.js :: {} memories': count('label', 'digit', 'ruled', ''),
  'src/screens/HiveDetail.js :: 1 memory': count('label', 'digit', 'ruled', ''),
  'src/screens/HiveDetail.js :: {} memories': count('label', 'digit', 'ruled', ''),
  'src/components/OrganizerCombCard.js :: 1 past month': count('label', 'digit', 'ruled', ''),
  'src/components/OrganizerCombCard.js :: {} past months': count('label', 'digit', 'ruled', ''),
  'src/components/RotationFold.js :: {} day{} left': count('label', 'digit', 'ruled', ''),
  'src/screens/HoneycombTab.js :: Last 7 days': count('label', 'digit', 'ruled', ''),
  'src/screens/MonthlyRecap.js :: {} {}, {} {}': count('label', 'digit', 'ruled', ''),
  'src/screens/MonthlyRecap.js :: {} of {} days filled in': count('label', 'digit', 'ruled', ''),
  'src/components/NectarSendPanel.js :: {} drops': count('label', 'digit', 'ruled', ''),
  'src/components/NectarSendPanel.js :: Up to 8 words': count('label', 'digit', 'ruled', ''),
  'src/components/NectarSendPanel.js :: Or an amount, {} to {}': count('label', 'digit', 'ruled', ''),

  // --- SENTENCE REGISTER, SPELLED AS A DIGIT. The class the ruling's own
  // licence clause said did not exist. Printed on every run, split by the
  // axis each one seems to want, and NOT fixed here: a pre-agreed clear
  // contains only what was cleared.
  'src/components/FileToHive.js :: Filed to {} hives.': count('sentence', 'digit', 'unruled', SENTENCE_THINGS),
  'src/screens/ContributingHive.js :: {} of you are writing.': count('sentence', 'digit', 'unruled', SENTENCE_THINGS),
  'src/screens/HiveDetail.js :: {} of you are writing.': count('sentence', 'digit', 'unruled', SENTENCE_THINGS),
  'src/screens/InviteContributor.js :: Invite {} {}': count('sentence', 'digit', 'unruled', SENTENCE_THINGS),
  'src/screens/PackageOpen.js :: {} {} wrote this for you.': count('sentence', 'digit', 'unruled', SENTENCE_THINGS),
  'src/components/HoneycombGrid.js :: {} of these seats are samples.': count('sentence', 'digit', 'unruled', SENTENCE_THINGS),

  'src/components/NectarConsentSheet.js :: 500 drops': count('sentence', 'digit', 'unruled', QUANTITY),
  'src/components/NectarSendPanel.js :: You have 1 drop.': count('sentence', 'digit', 'unruled', QUANTITY),
  'src/components/NectarSendPanel.js :: You have {} drops.': count('sentence', 'digit', 'unruled', QUANTITY),
  'src/screens/CombNectarCompose.js :: Sent 1 drop.': count('sentence', 'digit', 'unruled', QUANTITY),
  'src/screens/CombNectarCompose.js :: Sent 1 drop to {}.': count('sentence', 'digit', 'unruled', QUANTITY),
  'src/screens/CombNectarCompose.js :: Sent {} drops.': count('sentence', 'digit', 'unruled', QUANTITY),
  'src/screens/CombNectarCompose.js :: Sent {} drops to {}.': count('sentence', 'digit', 'unruled', QUANTITY),
  'src/screens/CombNectarCompose.js :: Your balance changed. You have 1 drop now.': count('sentence', 'digit', 'unruled', QUANTITY),
  'src/screens/CombNectarCompose.js :: Your balance changed. You have {} drops now.': count('sentence', 'digit', 'unruled', QUANTITY),

  'src/screens/CombNectarCompose.js :: Choose {} to {} drops.': count('sentence', 'digit', 'unruled', LIMIT),
  'src/screens/CombNectarCompose.js :: Keep it to 8 words.': count('sentence', 'digit', 'unruled', LIMIT),
  'src/screens/CombNectarCompose.js :: Keep the note under 280 characters.': count('sentence', 'digit', 'unruled', LIMIT),
  // All three of these say the same thing about the same constant. The two
  // Store lines are `throw new Error(...)` and the seedDraft line is a
  // returned validation `message` a compose screen renders. Filed together
  // and filed as counts, because proving a thrown message never reaches a
  // person is a measurement nobody has taken.
  'src/services/NotesStore.js :: Notes are capped at {} characters': count('sentence', 'digit', 'unruled', LIMIT),
  'src/services/SeedsStore.js :: Seeds are capped at {} characters': count('sentence', 'digit', 'unruled', LIMIT),
  'src/utils/seedDraft.js :: Seeds are capped at {} characters': count('sentence', 'digit', 'unruled', LIMIT),

  'src/screens/HoneycombTab.js :: Shares from the last 7 days will gather here.': count('sentence', 'digit', 'unruled', SPAN),
  'src/screens/TodayTab.js :: Filled the last {} days with entries.': count('sentence', 'digit', 'unruled', SPAN),
  'src/constants/legalCopy.js :: You need to be at least 13 years old. Give us an email address that is really yours, keep your password to yourself, and understand that what happens under your account is your responsibility.':
    count('sentence', 'digit', 'unruled', SPAN),
  'src/constants/legalCopy.js :: For a copy of what we hold about you, or to have something corrected, email {} from the address on your account and we will act within 30 days. Export and correction have not been built into the app yet. That is why those two are an email rather than a button, and it is a gap we intend to close.\n\n':
    count('sentence', 'digit', 'unruled', SPAN),

  'src/screens/PollinateWrapped.js :: You leaned into "{}" {} of {} days this month.': count('sentence', 'digit', 'unruled', RATIO),
  'src/screens/RecapTab.js :: You leaned into "{}" {} of {} {}.': count('sentence', 'digit', 'unruled', RATIO),

  // --- numbers in strings a person never reads as copy -----------------
  'src/components/FileToHive.js :: FileToHive: 42501 refetch failed, leaving cause unresolved':
    notCopy('console.warn at FileToHive.js:99'),
  'src/constants/nectar.js :: 35194bd nor on any of the 181 github branches swept, because the two compose':
    notCopy('a `note` field in the nectar reserved-word registry — annotation about branches, rendered nowhere'),
  // The cadence VALUE is a database string; the copy beside it at
  // CreateComb.js:12-14 is already a word (`One month`, `Two months`,
  // `Three months`). A census that read the value as copy would report a
  // digit defect on a screen that spells it out correctly.
  'src/screens/CreateComb.js :: 1 month': notCopy('cadence value stored in `combs.cadence`; the visible label is `One month`'),
  'src/screens/CreateComb.js :: 2 months': notCopy('cadence value; the visible label is `Two months`'),
  'src/screens/CreateComb.js :: 3 months': notCopy('cadence value; the visible label is `Three months`'),
  'src/services/CombStore.js :: 1 month': notCopy('default argument for the same cadence value'),
};

// --- the walk -----------------------------------------------------------
const WORD_FNS = new Set(['numberInWords', 'numberInWordsCapped']);
const LITERAL_COUNT = /(?:^|\s)(\d+ [a-z]+)/;

const sourceFiles = [];
(function walkDir(dir) {
  for (const name of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      if (name !== 'node_modules') walkDir(p);
    } else if (/\.jsx?$/.test(name)) sourceFiles.push(p);
  }
})(path.join(ROOT, 'src'));
sourceFiles.push(path.join(ROOT, 'App.js'));

const parseFailures = [];
// Every call of the spelling helper anywhere in the tree, collected
// independently of the site walk so D2 can reconcile the two.
const wordCallSites = [];
const declaratorsFor = (ast) => {
  const m = new Map();
  walkWithAncestry(ast.program, (n) => {
    if (n.type === 'VariableDeclarator' && n.id?.type === 'Identifier') {
      if (!m.has(n.id.name)) m.set(n.id.name, []);
      m.get(n.id.name).push(n.init);
    }
  });
  return m;
};

// numeric | text | word | unknown. `word` is a number that has already been
// spelled — the one class that answers the gate's question by itself.
const classify = (node, decls, depth = 0) => {
  if (!node || depth > 8) return 'unknown';
  switch (node.type) {
    case 'NumericLiteral':
      return 'numeric';
    case 'StringLiteral':
    case 'TemplateLiteral':
      return 'text';
    case 'CallExpression':
      return node.callee?.type === 'Identifier' && WORD_FNS.has(node.callee.name)
        ? 'word'
        : 'unknown';
    case 'MemberExpression':
      return !node.computed && (node.property?.name === 'length' || node.property?.name === 'size')
        ? 'numeric'
        : 'unknown';
    case 'UnaryExpression':
      return node.operator === '-' ? classify(node.argument, decls, depth + 1) : 'unknown';
    case 'BinaryExpression': {
      if (!['+', '-', '*', '/', '%'].includes(node.operator)) return 'unknown';
      const l = classify(node.left, decls, depth + 1);
      const r = classify(node.right, decls, depth + 1);
      if (l === 'text' || r === 'text') return 'text';
      if (l === 'numeric' && r === 'numeric') return 'numeric';
      if ((l === 'numeric' && r === 'unknown') || (l === 'unknown' && r === 'numeric')) return 'numeric';
      return 'unknown';
    }
    case 'ConditionalExpression': {
      const a = classify(node.consequent, decls, depth + 1);
      const b = classify(node.alternate, decls, depth + 1);
      if (a === b) return a;
      if (a === 'word' || b === 'word') return 'word';
      return 'unknown';
    }
    case 'Identifier': {
      const inits = decls.get(node.name);
      // Two declarators with the same name in one file is an ambiguity, not
      // an answer: fail closed to `unknown` and make a person declare it.
      if (!inits || inits.length !== 1) return 'unknown';
      return classify(inits[0], decls, depth + 1);
    }
    default:
      return 'unknown';
  }
};

// Two reconstructions of the same template, and they are not
// interchangeable. `cooked` is what a person reads, so it is the census
// key. `raw` is what the file says, so it is what A2 can look for in the
// bytes — legalCopy.js writes `\n` as an escape, and a cooked segment
// carrying a real newline is not a substring of a source that spells it
// with a backslash.
const shapeOf = (node, which) =>
  node.quasis
    .map((q, i) => (which === 'raw' ? q.value.raw : q.value.cooked ?? q.value.raw) + (i < node.expressions.length ? '{}' : ''))
    .join('');

// A site is one rendered shape in one file. Several source lines can share
// a key — `RotationFold.js` writes the ruled sentence twice — and that is
// the point: the census is about sentences, not about lines.
const sites = new Map();
const addSite = (rel, line, key, shape, slot, rawShape = shape) => {
  const id = `${rel} :: ${key}`;
  if (!sites.has(id)) sites.set(id, { id, rel, key, shape, rawShape, lines: [], slots: [] });
  const s = sites.get(id);
  if (!s.lines.includes(line)) s.lines.push(line);
  if (slot) s.slots.push({ ...slot, line });
};

// The independent witness for A2. A raw text scan, no AST: every literal
// count fragment the walk reports must appear in the file's own bytes.
const rawFragments = new Map();
const fileText = new Map();

for (const file of sourceFiles) {
  const rel = path.relative(ROOT, file);
  const src = fs.readFileSync(file, 'utf8');
  fileText.set(rel, src);
  rawFragments.set(rel, new Set((src.match(/\d+ [a-z]+/g) || []).map((m) => m.trim())));
  let ast;
  try {
    ast = parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  } catch (e) {
    parseFailures.push(`${rel}: ${e.message}`);
    continue;
  }
  const decls = declaratorsFor(ast);
  walkWithAncestry(ast.program, (node) => {
    if (
      node.type === 'CallExpression' &&
      node.callee?.type === 'Identifier' &&
      WORD_FNS.has(node.callee.name) &&
      // The helper's own file: `numberInWordsCapped` calls `numberInWords`.
      // That is the implementation, not a render.
      rel !== 'src/utils/numberWords.js'
    ) {
      wordCallSites.push(`${rel} :: ${node.loc.start.line} :: ${srcOf(src, node)}`);
    }
    // JSXText is the commonest copy position of all, and leaving it out is
    // how this walk first missed `Shares from the last 7 days…` while
    // catching `Last 7 days` two lines up in the same file.
    if (node.type === 'StringLiteral' || node.type === 'JSXText') {
      const m = LITERAL_COUNT.exec(node.value);
      // Keyed on the WHOLE literal, not on the matched fragment: `Last 7
      // days` (a segmented-control label) and `Shares from the last 7 days
      // will gather here.` (a sentence) live two lines apart in
      // HoneycombTab.js, and a fragment key merges a label and a sentence
      // into one row that cannot be classified either way.
      if (m) addSite(rel, node.loc.start.line, node.value.trim(), node.value, { src: m[1], cls: 'numeric', literal: true });
      return;
    }
    if (node.type !== 'TemplateLiteral') return;
    const shape = shapeOf(node, 'cooked');
    const rawShape = shapeOf(node, 'raw');
    // A quasi can carry a literal count of its own — legalCopy.js's "we
    // will act within 30 days" sits between two interpolations. A walk that
    // only reads StringLiteral for literals cannot see it.
    const quasiText = node.quasis.map((q) => q.value.cooked ?? q.value.raw).join(' ');
    const qm = LITERAL_COUNT.exec(quasiText);
    if (qm) addSite(rel, node.loc.start.line, shape, shape, { src: qm[1], cls: 'numeric', literal: true }, rawShape);
    node.expressions.forEach((expr, i) => {
      const after = node.quasis[i + 1]?.value.cooked ?? '';
      // Noun-adjacent two ways: a literal noun follows the slot, or the
      // noun is ITSELF a slot — `${n} ${n === 1 ? 'person' : 'people'}`,
      // which is how three of this tree's count sites are written and
      // which a literal-noun-only test misses entirely.
      const nounIsSlot =
        /^ $/.test(after) &&
        i + 1 < node.expressions.length &&
        classify(node.expressions[i + 1], decls) === 'text';
      if (!/^ [a-z]/.test(after) && !nounIsSlot) return;
      addSite(rel, node.loc.start.line, shape, shape, {
        src: srcOf(src, expr),
        cls: classify(expr, decls),
        literal: false,
      }, rawShape);
    });
  });
}
function srcOf(src, node) {
  return src.slice(node.start, node.end).replace(/\s+/g, ' ');
}

const allSites = [...sites.values()].filter((s) => s.slots.length);
const at = (s) => `${s.rel}:${s.lines.sort((a, b) => a - b).join('/')}`;

// --- A. the universe ----------------------------------------------------
// Every row below quantifies over a collected set, so all three guards are
// owed: the universe is non-empty, the extractor reconciles against an
// independent witness, and every collected member is resolvable or named.
check('A1 every source file parsed', parseFailures, []);
check('A1 the universe is non-empty', sourceFiles.length > 100 && allSites.length > 30, true);
check(
  'A2 every literal count fragment the walk reports is in the file bytes',
  allSites
    .flatMap((s) => s.slots.filter((sl) => sl.literal).map((sl) => ({ s, sl })))
    .filter(({ s, sl }) => !rawFragments.get(s.rel)?.has(sl.src))
    .map(({ s, sl }) => `${at(s)} ${JSON.stringify(sl.src)}`)
    .sort(),
  []
);
// The second direction, and the one this repo has already been bitten by:
// a reconstruction that JOINS quasis can MANUFACTURE text that never
// renders. Every literal segment of every reported shape must appear
// verbatim in the file it was read from.
check(
  'A2 no reported shape contains text its own file does not',
  allSites
    .filter((s) => s.rawShape.includes('{}'))
    .flatMap((s) =>
      s.rawShape
        .split('{}')
        .filter((seg) => seg.trim().length >= 3)
        .filter((seg) => !fileText.get(s.rel).includes(seg))
        .map((seg) => `${at(s)} ${JSON.stringify(seg)}`)
    )
    .sort(),
  []
);

const unresolved = allSites.flatMap((s) =>
  s.slots
    .filter((sl) => !sl.literal && sl.cls === 'unknown')
    .map((sl) => ({ site: s, slot: sl, id: `${s.rel} :: ${sl.src}` }))
);
check(
  'A3 every slot the resolver cannot settle is declared numeric or not-a-number',
  [...new Set(unresolved.filter((u) => !(u.id in UNRESOLVED_SLOTS)).map((u) => u.id))].sort(),
  []
);
check(
  'A3 every UNRESOLVED_SLOTS entry names a slot the walk still finds unresolved',
  Object.keys(UNRESOLVED_SLOTS).filter((k) => !unresolved.some((u) => u.id === k)).sort(),
  []
);
check(
  'A3 every UNRESOLVED_SLOTS answer is from the declared vocabulary',
  Object.entries(UNRESOLVED_SLOTS)
    .filter(([, v]) => v !== 'numeric' && v !== 'not-a-number')
    .map(([k, v]) => `${k} → ${JSON.stringify(v)}`)
    .sort(),
  []
);

// A slot counts as a number if the resolver said so or a person declared
// it so. `word` is a number too — it is the spelled one.
const slotIsNumber = (rel, sl) =>
  sl.cls === 'numeric' ||
  sl.cls === 'word' ||
  (sl.cls === 'unknown' && UNRESOLVED_SLOTS[`${rel} :: ${sl.src}`] === 'numeric');

const numberSites = allSites.filter((s) => s.slots.some((sl) => slotIsNumber(s.rel, sl)));

// --- B. the census is complete and current ------------------------------
check(
  'B1 every number site is classified in NUMBER_SITES',
  numberSites.filter((s) => !(s.id in NUMBER_SITES)).map((s) => `${at(s)} :: ${s.key}`).sort(),
  []
);
check(
  'B2 every NUMBER_SITES entry still names a number site the walk finds',
  Object.keys(NUMBER_SITES).filter((k) => !numberSites.some((s) => s.id === k)).sort(),
  []
);
check(
  'B3 every NUMBER_SITES entry uses the declared vocabulary',
  Object.entries(NUMBER_SITES)
    .filter(
      ([, v]) =>
        !KINDS.includes(v.kind) ||
        (v.kind === 'count' &&
          !(REGISTERS.includes(v.register) && SPELLINGS.includes(v.spelling) && DISPOSITIONS.includes(v.disposition))) ||
        // An unruled entry with no note is a question filed as an answer.
        (v.kind === 'count' && v.disposition === 'unruled' && !v.owed) ||
        (v.kind === 'not-copy' && !v.why)
    )
    .map(([k, v]) => `${k} → ${JSON.stringify(v)}`)
    .sort(),
  []
);

// B4. The declared spelling is MEASURED, not taken on trust. A site filed
// `word` must actually route its count through numberInWords*; a site
// filed `digit` must not. Without this the table is prose with a key.
// EVERY count-bearing slot at the site, not any of them. `.some(word)`
// was the first draft and it reads a site as spelled the moment one of its
// lines is: RotationFold.js writes the ruled sentence twice under one key,
// so a second writer that regressed to a digit would have hidden behind
// the first writer's word. Slots that are not counts — the singular/plural
// ternary in `${n} ${n === 1 ? 'person' : 'people'}` — are not part of the
// question and are excluded rather than counted as digits.
const measuredSpelling = (s) => {
  const countSlots = s.slots.filter((sl) => slotIsNumber(s.rel, sl));
  return countSlots.length > 0 && countSlots.every((sl) => sl.cls === 'word') ? 'word' : 'digit';
};
check(
  'B4 every count entry declares the spelling the walk measures',
  Object.entries(NUMBER_SITES)
    .filter(([, v]) => v.kind === 'count')
    .filter(([k, v]) => {
      const s = numberSites.find((n) => n.id === k);
      return s && measuredSpelling(s) !== v.spelling;
    })
    .map(([k, v]) => `${k} declared ${v.spelling}, measured ${measuredSpelling(numberSites.find((n) => n.id === k))}`)
    .sort(),
  []
);

// --- C. the ruled law ---------------------------------------------------
// C1 is FU3.1 itself. Written as a universal over the writers the walk
// finds rather than as a count of them, so a fifth writer arrives held to
// the rule instead of arriving unnoticed.
// Quantified over ALL sites, NOT over `numberSites`. Calibration caught
// this: reverting OrganizerCombCard to `${comb.memberCount}` makes its slot
// unresolved-and-undeclared, which drops the site out of `numberSites`
// — so C1 would have gone green on the exact defect FU3.1 exists to fix,
// while A3 and B2 red for other reasons. A row that fails closed is only
// safe if the set it closes on is the set it means, and the set this row
// means is "every writer of this sentence", with no resolvability filter
// in front of it.
const ruledWriters = allSites.filter((s) => s.key === RULED_SENTENCE);
check('C1 the ruled sentence has writers', ruledWriters.length > 0, true);
check(
  'C1 every writer of the ruled sentence spells its count as a word',
  ruledWriters.filter((s) => measuredSpelling(s) !== 'word').map(at).sort(),
  []
);
check(
  'C2 every ruled sentence-register count is spelled as a word',
  Object.entries(NUMBER_SITES)
    .filter(([, v]) => v.kind === 'count' && v.disposition === 'ruled' && v.register === 'sentence')
    .filter(([, v]) => v.spelling !== 'word')
    .map(([k]) => k)
    .sort(),
  []
);
check(
  'C3 every ruled label-register count is spelled as a digit',
  Object.entries(NUMBER_SITES)
    .filter(([, v]) => v.kind === 'count' && v.disposition === 'ruled' && v.register === 'label')
    .filter(([, v]) => v.spelling !== 'digit')
    .map(([k]) => k)
    .sort(),
  []
);

// --- D. the header may not restate a universal the census refutes -------
// The original defect was prose, not code: a header claiming "never a
// digit" while the tree said otherwise. This row makes the claim and the
// measurement move together.
const numberWordsSrc = fs.readFileSync(path.join(ROOT, 'src/utils/numberWords.js'), 'utf8');
const header = numberWordsSrc.slice(0, numberWordsSrc.indexOf('\nconst '));
check(
  'D1 numberWords.js states the register criterion and cites this gate',
  /\bsentence\b/i.test(header) && /\blabel\b/i.test(header) && /check-number-register/.test(header),
  true
);
// D2. The WORD side's own coverage. Every call of the helper must land
// inside a site this walk enumerated — otherwise the count is spelled out
// somewhere the census cannot see, and the table would report four writers
// of the ruled sentence while a fifth spelled it by string concatenation.
// A hunt for the phrase "never a digit" was the first draft of this row
// and it was worse than nothing: the header has to QUOTE the universal to
// retract it, so the gate would have needed a self-exemption to describe
// its own subject.
const enumeratedWordCalls = new Set(
  allSites.flatMap((s) => s.slots.filter((sl) => sl.cls === 'word').map((sl) => `${s.rel} :: ${sl.line} :: ${sl.src}`))
);
check(
  'D2 every numberInWords call site is inside a site this census enumerated',
  wordCallSites.filter((c) => !enumeratedWordCalls.has(c)).sort(),
  []
);

// --- the owed list ------------------------------------------------------
// PRINTED ON EVERY RUN, not folded into a pass count. A count filed
// `unruled` is a question this gate found and did not answer; a count
// nobody prints is the same question with better manners.
const unruledCounts = Object.entries(NUMBER_SITES).filter(
  ([, v]) => v.kind === 'count' && v.disposition === 'unruled'
);
const bySpelling = (r, sp) =>
  unruledCounts.filter(([, v]) => v.register === r && v.spelling === sp).length;
console.log(
  `\n--- CENSUS: ${Object.keys(NUMBER_SITES).length} number sites — ` +
    `${Object.values(NUMBER_SITES).filter((v) => v.kind === 'count').length} counts, ` +
    `${Object.values(NUMBER_SITES).filter((v) => v.kind === 'not-copy').length} not copy ---`
);
console.log(
  `    sentence/word ${Object.values(NUMBER_SITES).filter((v) => v.kind === 'count' && v.register === 'sentence' && v.spelling === 'word').length}   ` +
    `sentence/digit ${Object.values(NUMBER_SITES).filter((v) => v.kind === 'count' && v.register === 'sentence' && v.spelling === 'digit').length}   ` +
    `label/digit ${Object.values(NUMBER_SITES).filter((v) => v.kind === 'count' && v.register === 'label' && v.spelling === 'digit').length}   ` +
    `label/word ${Object.values(NUMBER_SITES).filter((v) => v.kind === 'count' && v.register === 'label' && v.spelling === 'word').length}`
);
console.log(
  `\n--- OWED: ${unruledCounts.length} unruled counts ` +
    `(${bySpelling('sentence', 'digit')} sentence/digit, ${bySpelling('label', 'digit')} label/digit, ` +
    `${bySpelling('sentence', 'word')} sentence/word, ${bySpelling('label', 'word')} label/word) ---`
);
for (const axis of [...new Set(unruledCounts.map(([, v]) => v.owed))].sort()) {
  console.log(`   ${axis}`);
  for (const [k, v] of unruledCounts.filter(([, v2]) => v2.owed === axis).sort()) {
    console.log(`     ${v.register}/${v.spelling}  ${k.replace(/\n/g, ' ').slice(0, 120)}`);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
