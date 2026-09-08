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
// Lumen ruled the criterion in FU3.1 and amended it in FU3.2 (thread
// 160660d9). It is a criterion on TWO AXES, and a count is spelled as a
// word only where both of them agree it is speech:
//
//   REGISTER   is the count inside a SENTENCE, a clause with a verb, prose
//              speaking to the reader?  Or in a bare noun-phrase LABEL,
//              the stat register, card metadata with no verb?
//   SUBSTANCE  is the count a TALLY — people, or the things they made,
//              present in the product and counted?  Or a MEASURE — a value
//              on an external scale: money, characters, days, years, a
//              bound, a ratio?
//
//   sentence + tally   -> WORD
//   every other cell   -> DIGIT
//
// Digits read as data, words read as speech, and a measure is data in any
// register: money is figures wherever it appears, and spelling one side of
// a ratio and not the other reads worse than both as figures.
//
// Her ruling also asked that the census be PRINTED and classified against
// the criterion, "so the criterion lands as a measurement rather than
// prose". That is this file.
//
// WHY THERE ARE TWO AXES, WHICH IS THE PART THIS FILE MEASURED
//
// FU3.1's criterion had only the register axis, and its supporting
// sentence was that "every digit site you and I both found is a verb-less
// label, and every sentence writer but OrganizerCombCard already speaks
// words". That was true of the sites two people had found by hand, and the
// sweep in this file refuted it: 27 of the 48 counts were sentence-register
// digits, and they were not one class. Money, caps, spans and ratios each
// wanted a different answer from people-and-things. The gate filed all 27
// `unruled` and printed them rather than inventing the answer; FU3.2 is
// Lumen ruling them, and the substance axis is that ruling.
//
// The six people-and-things sites became words in the same commit. The 21
// measure sites keep their digits and keep their axis note, which is now
// the RULING RECORD rather than an owed question. The owed list prints
// zero and the mechanism that files the next stranger is untouched.
//
// THE SINGULAR QUESTION, WHICH IS NOT THE REGISTER QUESTION
//
// A count that can vary reads wrong at 1 unless something handles it —
// "1 drops", "1 of these seats are samples", "One of you are writing." That
// is subject-verb agreement, not register, and it is the defect class this
// whole FU arc started from. Section E holds it as a standing property:
// every site whose count can VARY declares how it reads at 1, from a closed
// vocabulary, and three of the four answers are measured rather than taken
// on trust. Sites whose count is a fixed literal ("Keep the note under 280
// characters.") are outside that row because the question does not arise
// for them, and the row says so by construction rather than by omission.
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
const SUBSTANCES = ['tally', 'measure'];
const SPELLINGS = ['word', 'digit'];
const DISPOSITIONS = ['ruled', 'unruled'];

// How a site that can render 1 keeps its subject and verb agreeing. Three
// of the four are MEASURED; `unreachable` is a person's answer and is
// printed on every run rather than trusted quietly, the same posture
// UNRESOLVED_SLOTS takes above.
//
//   sibling      a separate arm renders at 1. MEASURED: the declared
//                sentence is one of the shapes the site's own file
//                RENDERS — a string literal, a JSX text node, or a
//                template read the same way the census keys are, with
//                `{}` for each interpolation. Not a substring of the
//                file's bytes: prose about a sentence is not the
//                sentence.
//   inline       this site's own template picks the noun at 1. MEASURED:
//                one of its slots tests `=== 1`.
//   floor        the count cannot be 1. MEASURED: the lower bound the
//                walk computes for the count expression is at least 2.
//   unreachable  the count cannot be 1 for a reason the walk cannot
//                compute — a guard earlier in the function, a closed set
//                of preset values, a constant behind an import. DECLARED,
//                with a reason, and printed.
//   no-agreement the count has no noun to agree with, so 1 reads correctly
//                as written. The raw walk collects a slot whenever a
//                lowercase word follows it, and "of" and "to" are
//                lowercase words. This is NOT the same claim as
//                `unreachable`: `NECTAR_MIN_DROPS` is 1 and renders as 1.
//                DECLARED, with a reason, and printed.
const SINGULAR_KINDS = ['sibling', 'inline', 'floor', 'unreachable', 'no-agreement'];

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
  'src/screens/HoneycombTab.js :: count': 'numeric', // re-pointed 2026-09-07 (ENG-104): the demo-data alert moved from TodayTab to HoneycombTab whole, FIVE_TAB_IA_SPEC §5
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
// The axes stay INDEPENDENTLY declarable rather than folded into
// per-cell constructors. A constructor that could only emit legal
// combinations would make section C unfalsifiable: the mutation that
// should red the law — a site declaring the wrong cell — would not be
// expressible, and the row would pass forever by construction.
const count = (register, substance, spelling, disposition, note = '') =>
  ({ kind: 'count', register, substance, spelling, disposition, note });
const notCopy = (why) => ({ kind: 'not-copy', why });

// The axis notes. These were the OWED questions in FU3.1 and they are the
// RULING RECORD in FU3.2: each one is the reason its cell reads the way it
// does, kept beside the sites it governs so the reasoning does not drift
// out of reach of the thing it decided.
const TALLY_PEOPLE =
  'tally: people, or the things they made — the one cell where a sentence spells its count as a word';
const TALLY_LABEL =
  'tally in the stat register: a countable thing, but card metadata with no verb, so a digit';
const MEASURE_MONEY =
  'measure/money: drops are money (SATS ruling), and money is figures in every register';
const MEASURE_BOUND =
  'measure/bound: a cap or a range is a specification, and precision is its register';
const MEASURE_SPAN = 'measure/span: a duration, an age, a legal period — calendar data';
const MEASURE_RATIO =
  'measure/ratio: N of M, where spelling one side and not the other reads worse than both as figures';

const NUMBER_SITES = {
  // --- SENTENCE + TALLY. The one cell the law spells as a word. FU3.1
  // fixed OrganizerCombCard, the fourth writer of the ruled sentence and
  // the only one rendering a digit; FU3.2 added the six below it.
  'src/components/OrganizerCombCard.js :: {} people are in this comb.': count('sentence', 'tally', 'word', 'ruled', TALLY_PEOPLE),
  'src/components/RotationFold.js :: {} people are in this comb.': count('sentence', 'tally', 'word', 'ruled', TALLY_PEOPLE),
  'src/screens/CombInvite.js :: {} people are in this comb.': count('sentence', 'tally', 'word', 'ruled', TALLY_PEOPLE),
  'src/components/RotationFold.js :: {} people are writing': count('sentence', 'tally', 'word', 'ruled', TALLY_PEOPLE),

  'src/components/FileToHive.js :: Filed to {} hives.': count('sentence', 'tally', 'word', 'ruled', TALLY_PEOPLE),
  'src/screens/ContributingHive.js :: {} of you are writing.': count('sentence', 'tally', 'word', 'ruled', TALLY_PEOPLE),
  'src/screens/HiveDetail.js :: {} of you are writing.': count('sentence', 'tally', 'word', 'ruled', TALLY_PEOPLE),
  'src/screens/InviteContributor.js :: Invite {} {}': count('sentence', 'tally', 'word', 'ruled', TALLY_PEOPLE),
  'src/screens/PackageOpen.js :: {} {} wrote this for you.': count('sentence', 'tally', 'word', 'ruled', TALLY_PEOPLE),
  'src/components/HoneycombGrid.js :: {} of these seats are samples.': count('sentence', 'tally', 'word', 'ruled', TALLY_PEOPLE),

  // --- LABEL. Card metadata, a chip, an a11y label for a grid cell: no
  // verb, and a digit is right whatever the substance. These are the sites
  // the header's old universal was wrong about.
  'src/components/FileToHive.js :: 1 memory': count('label', 'tally', 'digit', 'ruled', TALLY_LABEL),
  'src/components/FileToHive.js :: {} memories': count('label', 'tally', 'digit', 'ruled', TALLY_LABEL),
  'src/components/HiveCard.js :: 1 memory': count('label', 'tally', 'digit', 'ruled', TALLY_LABEL),
  'src/components/HiveCard.js :: {} memories': count('label', 'tally', 'digit', 'ruled', TALLY_LABEL),
  'src/screens/ContributingHive.js :: 1 memory': count('label', 'tally', 'digit', 'ruled', TALLY_LABEL),
  'src/screens/ContributingHive.js :: {} memories': count('label', 'tally', 'digit', 'ruled', TALLY_LABEL),
  'src/screens/HiveDetail.js :: 1 memory': count('label', 'tally', 'digit', 'ruled', TALLY_LABEL),
  'src/screens/HiveDetail.js :: {} memories': count('label', 'tally', 'digit', 'ruled', TALLY_LABEL),
  // Counts completed rotation CHAPTERS, which are things the comb made;
  // "months" is how they are named, not what is being counted.
  'src/components/OrganizerCombCard.js :: 1 past month': count('label', 'tally', 'digit', 'ruled', TALLY_LABEL),
  'src/components/OrganizerCombCard.js :: {} past months': count('label', 'tally', 'digit', 'ruled', TALLY_LABEL),
  // The one count-bearing slot here is `dayEntries.length`; `cell.day` is a
  // date the walk does not treat as a count, and `monthName` is a name.
  'src/screens/MonthlyRecap.js :: {} {}, {} {}': count('label', 'tally', 'digit', 'ruled', TALLY_LABEL),

  'src/components/RotationFold.js :: {} day{} left': count('label', 'measure', 'digit', 'ruled', MEASURE_SPAN),
  'src/screens/HoneycombTab.js :: Last 7 days': count('label', 'measure', 'digit', 'ruled', MEASURE_SPAN),
  'src/screens/MonthlyRecap.js :: {} of {} days filled in': count('label', 'measure', 'digit', 'ruled', MEASURE_RATIO),
  'src/components/NectarSendPanel.js :: {} drops': count('label', 'measure', 'digit', 'ruled', MEASURE_MONEY),
  'src/components/NectarSendPanel.js :: Up to 8 words': count('label', 'measure', 'digit', 'ruled', MEASURE_BOUND),
  'src/components/NectarSendPanel.js :: Or an amount, {} to {}': count('label', 'measure', 'digit', 'ruled', MEASURE_BOUND),

  // --- SENTENCE + MEASURE. The class FU3.1's licence clause said did not
  // exist. The census found 27 of them, filed every one `unruled` and
  // printed it rather than inventing an answer; FU3.2 ruled them, six to
  // the word cell above and these 21 to the digit. The note each one
  // carries is now the ruling, not the question.
  'src/components/NectarSendPanel.js :: You have 1 drop.': count('sentence', 'measure', 'digit', 'ruled', MEASURE_MONEY),
  'src/components/NectarSendPanel.js :: You have {} drops.': count('sentence', 'measure', 'digit', 'ruled', MEASURE_MONEY),
  'src/screens/CombNectarCompose.js :: Sent 1 drop.': count('sentence', 'measure', 'digit', 'ruled', MEASURE_MONEY),
  'src/screens/CombNectarCompose.js :: Sent 1 drop to {}.': count('sentence', 'measure', 'digit', 'ruled', MEASURE_MONEY),
  'src/screens/CombNectarCompose.js :: Sent {} drops.': count('sentence', 'measure', 'digit', 'ruled', MEASURE_MONEY),
  'src/screens/CombNectarCompose.js :: Sent {} drops to {}.': count('sentence', 'measure', 'digit', 'ruled', MEASURE_MONEY),
  'src/screens/CombNectarCompose.js :: Your balance changed. You have 1 drop now.': count('sentence', 'measure', 'digit', 'ruled', MEASURE_MONEY),
  'src/screens/CombNectarCompose.js :: Your balance changed. You have {} drops now.': count('sentence', 'measure', 'digit', 'ruled', MEASURE_MONEY),

  'src/screens/CombNectarCompose.js :: Choose {} to {} drops.': count('sentence', 'measure', 'digit', 'ruled', MEASURE_BOUND),
  'src/screens/CombNectarCompose.js :: Keep it to 8 words.': count('sentence', 'measure', 'digit', 'ruled', MEASURE_BOUND),
  'src/screens/CombNectarCompose.js :: Keep the note under 280 characters.': count('sentence', 'measure', 'digit', 'ruled', MEASURE_BOUND),
  // All three of these say the same thing about the same constant. The two
  // Store lines are `throw new Error(...)` and the seedDraft line is a
  // returned validation `message` a compose screen renders. Filed together
  // and filed as counts, because proving a thrown message never reaches a
  // person is a measurement nobody has taken.
  'src/services/NotesStore.js :: Notes are capped at {} characters': count('sentence', 'measure', 'digit', 'ruled', MEASURE_BOUND),
  'src/services/SeedsStore.js :: Seeds are capped at {} characters': count('sentence', 'measure', 'digit', 'ruled', MEASURE_BOUND),
  'src/utils/seedDraft.js :: Seeds are capped at {} characters': count('sentence', 'measure', 'digit', 'ruled', MEASURE_BOUND),

  'src/screens/HoneycombTab.js :: Shares from the last 7 days will gather here.': count('sentence', 'measure', 'digit', 'ruled', MEASURE_SPAN),
  // Re-pointed 2026-09-07 (ENG-104): the demo-data alert moved from
  // TodayTab to HoneycombTab whole, FIVE_TAB_IA_SPEC §5.
  'src/screens/HoneycombTab.js :: Filled the last {} days with entries.': count('sentence', 'measure', 'digit', 'ruled', MEASURE_SPAN),
  // Colin's veto lane. These two are legal copy and nobody touches them on
  // style grounds; the ruling records why they would stay digits anyway.
  'src/constants/legalCopy.js :: You need to be at least 13 years old. Give us an email address that is really yours, keep your password to yourself, and understand that what happens under your account is your responsibility.':
    count('sentence', 'measure', 'digit', 'ruled', MEASURE_SPAN),
  'src/constants/legalCopy.js :: For a copy of what we hold about you, or to have something corrected, email {} from the address on your account and we will act within 30 days. Export and correction have not been built into the app yet. That is why those two are an email rather than a button, and it is a gap we intend to close.\n\n':
    count('sentence', 'measure', 'digit', 'ruled', MEASURE_SPAN),

  'src/screens/PollinateWrapped.js :: You leaned into "{}" {} of {} days this month.': count('sentence', 'measure', 'digit', 'ruled', MEASURE_RATIO),
  'src/screens/RecapTab.js :: You leaned into "{}" {} of {} {}.': count('sentence', 'measure', 'digit', 'ruled', MEASURE_RATIO),

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

// --- how each varying count reads at 1 ----------------------------------
// Keyed `file :: shape :: slot source`, so the answer belongs to the SLOT
// rather than to the site: `RotationFold.js` writes the ruled sentence
// twice under one key, from two different expressions, and each writer
// owes its own answer. A site whose count is a fixed literal is not in
// this table's universe, because the question does not arise for it.
const sibling = (sentence) => ['sibling', sentence];
const inline = () => ['inline', ''];
const floorAtLeastTwo = () => ['floor', ''];
const unreachable = (why) => ['unreachable', why];
const noAgreement = (why) => ['no-agreement', why];

const SINGULAR_ANSWERS = {
  // --- the tally sentences. Every one of these is a word now, and a
  // spelled-out count that disagrees with its noun ("One of you are
  // writing") is the loudest form the defect takes.
  'src/components/OrganizerCombCard.js :: {} people are in this comb. :: numberInWordsCapped(comb.memberCount)':
    sibling('One person is in this comb.'),
  'src/components/RotationFold.js :: {} people are in this comb. :: numberInWordsCapped(sizeCount)':
    sibling('One person is in this comb.'),
  'src/components/RotationFold.js :: {} people are in this comb. :: numberInWordsCapped(count)':
    sibling('One person is in this comb.'),
  'src/components/RotationFold.js :: {} people are writing :: numberInWordsCapped(count)':
    sibling('One person is writing'),
  // The only writer of the ruled sentence with no singular arm, and it
  // needs none: the line is rendered behind a `>= 3` test, so the sentence
  // never exists below three members.
  'src/screens/CombInvite.js :: {} people are in this comb. :: numberInWordsCapped(preview.memberCount)':
    unreachable('rendered only when `preview.memberCount >= 3` (CombInvite.js:113)'),

  'src/components/FileToHive.js :: Filed to {} hives. :: numberInWords(filedHives.length)':
    sibling("Filed to {}'s hive."),
  // Measured rather than declared: `totalWriters` is `otherNames.length + 2`,
  // so the walk computes a floor of 2 and changing the `+ 2` reds E6.
  'src/screens/ContributingHive.js :: {} of you are writing. :: numberInWordsCapped(totalWriters)':
    floorAtLeastTwo(),
  // The sibling case one screen over, and NOT a floor: `contributors.length
  // + 1` bottoms out at 1 arithmetically, and what lifts it to 2 is the
  // `=== 0` guard that returns before this line. A guard is not something
  // this walk can compute, so the answer is declared and printed.
  'src/screens/HiveDetail.js :: {} of you are writing. :: numberInWordsCapped(contributors.length + 1)':
    unreachable('the `contributors.length === 0` guard at HiveDetail.js:56 returns first, so the count here is at least 2'),
  'src/screens/InviteContributor.js :: Invite {} {} :: numberInWords(selected.size)': inline(),
  'src/screens/PackageOpen.js :: {} {} wrote this for you. :: numberInWordsCapped(pkg.contributorNames.length)': inline(),
  'src/components/HoneycombGrid.js :: {} of these seats are samples. :: numberInWordsCapped(sampleSeats)':
    sibling('One of these seats is a sample.'),

  // --- the stat register. Each pair is two sites, and the singular one IS
  // the sibling.
  'src/components/FileToHive.js :: {} memories :: hive.entryCount': sibling('1 memory'),
  'src/components/HiveCard.js :: {} memories :: hive.entryCount': sibling('1 memory'),
  'src/screens/ContributingHive.js :: {} memories :: entries.length': sibling('1 memory'),
  'src/screens/HiveDetail.js :: {} memories :: entries.length': sibling('1 memory'),
  'src/components/OrganizerCombCard.js :: {} past months :: chapterCount': sibling('1 past month'),
  'src/components/RotationFold.js :: {} day{} left :: daysLeft': inline(),
  'src/screens/MonthlyRecap.js :: {} {}, {} {} :: dayEntries.length': inline(),
  'src/components/NectarSendPanel.js :: {} drops :: amount':
    unreachable('the label is rendered once per member of `NECTAR_PRESETS`, which is `[10, 50, 100]` (nectar.js:454)'),

  // --- money. FU3 gave all four of these their singular arms; this table
  // is what keeps them.
  'src/components/NectarSendPanel.js :: You have {} drops. :: displayDrops === undefined ? balanceDrops : displayDrops':
    sibling('You have 1 drop.'),
  'src/screens/CombNectarCompose.js :: Sent {} drops. :: resolvedAmount': sibling('Sent 1 drop.'),
  'src/screens/CombNectarCompose.js :: Sent {} drops to {}. :: resolvedAmount':
    sibling('Sent 1 drop to {}.'),
  'src/screens/CombNectarCompose.js :: Your balance changed. You have {} drops now. :: drops':
    sibling('Your balance changed. You have 1 drop now.'),

  // --- counts with no noun of their own. The raw walk collects a slot
  // whenever a lowercase word follows it, and "of" and "to" are lowercase
  // words. There is no agreement to break at these, and saying so is not
  // the same as saying the count cannot be 1 — `NECTAR_MIN_DROPS` IS 1.
  'src/components/NectarSendPanel.js :: Or an amount, {} to {} :: NECTAR_MIN_DROPS':
    noAgreement('followed by "to"; the range\'s only noun belongs to the maximum'),
  'src/screens/CombNectarCompose.js :: Choose {} to {} drops. :: NECTAR_MIN_DROPS':
    noAgreement('followed by "to"; the noun "drops" belongs to the maximum'),
  'src/screens/MonthlyRecap.js :: {} of {} days filled in :: entriesByDay.size':
    noAgreement('followed by "of"; the noun "days" belongs to the denominator'),
  'src/screens/PollinateWrapped.js :: You leaned into "{}" {} of {} days this month. :: count':
    noAgreement('followed by "of"; the noun "days" belongs to the denominator'),
  'src/screens/RecapTab.js :: You leaned into "{}" {} of {} {}. :: count':
    noAgreement('followed by "of"; the period noun is a separate slot'),

  // --- bounds and spans whose value is fixed at the source. Not literals
  // in the copy, so the walk cannot see the number, but the constant
  // behind each one is a constant.
  'src/screens/CombNectarCompose.js :: Choose {} to {} drops. :: NECTAR_MAX_DROPS':
    unreachable('`NECTAR_MAX_DROPS` is 1000 (NectarSendPanel.js:67)'),
  'src/services/NotesStore.js :: Notes are capped at {} characters :: NOTE_CONTENT_MAX':
    unreachable('`NOTE_CONTENT_MAX` is 500 (NotesStore.js:11)'),
  'src/services/SeedsStore.js :: Seeds are capped at {} characters :: SEED_CONTENT_MAX':
    unreachable('`SEED_CONTENT_MAX` is 500 (SeedsStore.js:12)'),
  'src/utils/seedDraft.js :: Seeds are capped at {} characters :: SEED_CONTENT_MAX':
    unreachable('`SEED_CONTENT_MAX` is 500 (SeedsStore.js:12)'),
  'src/screens/MonthlyRecap.js :: {} of {} days filled in :: daysInMonth':
    unreachable('a month length; the prop defaults to 31 and its callers pass a real one'),
  'src/screens/PollinateWrapped.js :: You leaned into "{}" {} of {} days this month. :: total':
    unreachable('a month length, the denominator of the same ratio'),
  'src/screens/HoneycombTab.js :: Filled the last {} days with entries. :: count':
    unreachable('the resolved value of `EntryStore.seedDemoData(180)`, a demo-only alert (EntryStore.js:158)'),
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

// A LOWER BOUND on a count expression, used only by the `floor` answer in
// section E. `.length`/`.size` bottom out at 0, a numeric literal is
// itself, `+` adds bounds, and the spelling helpers are transparent
// because they render their argument. Anything else is `null`, which fails
// the row rather than passing it — the point of the bound is to make
// "this count can never be 1" a measurement instead of a paragraph.
const lowerBound = (node, decls, depth = 0) => {
  if (!node || depth > 8) return null;
  switch (node.type) {
    case 'NumericLiteral':
      return node.value;
    case 'MemberExpression':
      return !node.computed && (node.property?.name === 'length' || node.property?.name === 'size') ? 0 : null;
    case 'BinaryExpression': {
      if (node.operator !== '+') return null;
      const l = lowerBound(node.left, decls, depth + 1);
      const r = lowerBound(node.right, decls, depth + 1);
      return l === null || r === null ? null : l + r;
    }
    case 'CallExpression':
      return node.callee?.type === 'Identifier' && WORD_FNS.has(node.callee.name)
        ? lowerBound(node.arguments[0], decls, depth + 1)
        : null;
    case 'Identifier': {
      const inits = decls.get(node.name);
      if (!inits || inits.length !== 1) return null;
      return lowerBound(inits[0], decls, depth + 1);
    }
    default:
      return null;
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
const addSite = (rel, line, key, shape, slot, rawShape = shape, testsOne = false) => {
  const id = `${rel} :: ${key}`;
  if (!sites.has(id)) sites.set(id, { id, rel, key, shape, rawShape, lines: [], slots: [], testsOne: false });
  const s = sites.get(id);
  if (!s.lines.includes(line)) s.lines.push(line);
  s.testsOne = s.testsOne || testsOne;
  if (slot) s.slots.push({ ...slot, line });
};

// Does this template pick its own noun at 1?  Asked of the AST rather than
// of the slot table, because the singular/plural ternary is usually the
// LAST expression in the template and a trailing expression is followed by
// nothing, so the walk never records it as a slot. `Invite ${n} ${n === 1 ?
// 'writer' : 'writers'}` is the shape, and a text scan of the slots it
// happens to have collected cannot see the test that makes it correct.
const testsForOne = (node) => {
  let found = false;
  walkWithAncestry(node, (n) => {
    if (
      n.type === 'BinaryExpression' &&
      (n.operator === '===' || n.operator === '==') &&
      ((n.left?.type === 'NumericLiteral' && n.left.value === 1) ||
        (n.right?.type === 'NumericLiteral' && n.right.value === 1))
    ) {
      found = true;
    }
  });
  return found;
};

// The independent witness for A2. A raw text scan, no AST: every literal
// count fragment the walk reports must appear in the file's own bytes.
const rawFragments = new Map();
const fileText = new Map();
// Every string this file could render, as a shape, whether or not it is a
// count site. E4's witness is checked against THIS and not against the
// file's bytes: calibration caught the raw-bytes version passing because
// the sentence it was hunting for also appeared in the paragraph of
// comment that explains why the arm exists. A gate that hunts a string
// must not be satisfied by prose about that string.
const fileShapes = new Map();

for (const file of sourceFiles) {
  const rel = path.relative(ROOT, file);
  const src = fs.readFileSync(file, 'utf8');
  fileText.set(rel, src);
  rawFragments.set(rel, new Set((src.match(/\d+ [a-z]+/g) || []).map((m) => m.trim())));
  fileShapes.set(rel, new Set());
  let ast;
  try {
    ast = parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  } catch (e) {
    parseFailures.push(`${rel}: ${e.message}`);
    continue;
  }
  const decls = declaratorsFor(ast);
  walkWithAncestry(ast.program, (node) => {
    if (node.type === 'StringLiteral') fileShapes.get(rel).add(node.value);
    if (node.type === 'JSXText' && node.value.trim()) fileShapes.get(rel).add(node.value.trim());
    if (node.type === 'TemplateLiteral') fileShapes.get(rel).add(shapeOf(node, 'cooked'));
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
    const testsOne = node.expressions.some((e) => testsForOne(e));
    if (qm) addSite(rel, node.loc.start.line, shape, shape, { src: qm[1], cls: 'numeric', literal: true }, rawShape, testsOne);
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
        bound: lowerBound(expr, decls),
        literal: false,
      }, rawShape, testsOne);
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
          !(
            REGISTERS.includes(v.register) &&
            SUBSTANCES.includes(v.substance) &&
            SPELLINGS.includes(v.spelling) &&
            DISPOSITIONS.includes(v.disposition)
          )) ||
        // An unruled entry with no note is a question filed as an answer.
        (v.kind === 'count' && v.disposition === 'unruled' && !v.note) ||
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
// Lumen's FU3.2 law, as ONE function with a total domain. A count is
// spelled as a word only where both axes agree it is speech: a TALLY,
// inside a SENTENCE. Every other cell is data. Written this way rather than
// as two independent rules so that a substance or register value nobody
// anticipated lands in the digit half instead of in a null class — a
// classifier written as a list of shapes has a null class, and the null
// class is a population.
const ruledSpelling = (v) => (v.register === 'sentence' && v.substance === 'tally' ? 'word' : 'digit');
const ruledCounts = Object.entries(NUMBER_SITES).filter(
  ([, v]) => v.kind === 'count' && v.disposition === 'ruled'
);
check(
  'C2 every ruled sentence+tally count is spelled as a word',
  ruledCounts
    .filter(([, v]) => ruledSpelling(v) === 'word')
    .filter(([, v]) => v.spelling !== 'word')
    .map(([k]) => k)
    .sort(),
  []
);
check(
  'C3 every other ruled count is spelled as a digit',
  ruledCounts
    .filter(([, v]) => ruledSpelling(v) === 'digit')
    .filter(([, v]) => v.spelling !== 'digit')
    .map(([k]) => k)
    .sort(),
  []
);
// C4. Neither half may be empty. Two complementary universals over a set
// that has drifted to one side are both green and both vacuous, and the
// word half is exactly the half FU3.2 created — an empty one would mean
// the ruling had been undone rather than upheld.
check(
  'C4 both halves of the law have members',
  {
    word: ruledCounts.filter(([, v]) => ruledSpelling(v) === 'word').length > 0,
    digit: ruledCounts.filter(([, v]) => ruledSpelling(v) === 'digit').length > 0,
  },
  { word: true, digit: true }
);

// --- D. the header may not restate a universal the census refutes -------
// The original defect was prose, not code: a header claiming "never a
// digit" while the tree said otherwise. This row makes the claim and the
// measurement move together.
const numberWordsSrc = fs.readFileSync(path.join(ROOT, 'src/utils/numberWords.js'), 'utf8');
const header = numberWordsSrc.slice(0, numberWordsSrc.indexOf('\nconst '));
check(
  'D1 numberWords.js states both axes of the criterion and cites this gate',
  ['sentence', 'label', 'tally', 'measure'].every((w) => new RegExp(`\\b${w}\\b`, 'i').test(header)) &&
    /check-number-register/.test(header),
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

// --- E. how each varying count reads at 1 -------------------------------
// The register question and the singular question are different questions.
// "1 drops", "1 of these seats are samples", "One of you are writing" are
// subject-verb agreement, and that is the defect class this whole FU arc
// started from: FU3 fixed four of them, FU3.2's HoneycombGrid arm is a
// fifth, and each was found by a person reading rather than by a rule.
// This section is the rule.
//
// The universe is every count slot whose value can VARY — a fixed literal
// ("Keep the note under 280 characters.") has no singular to get wrong, so
// it is outside the row by construction rather than by omission. It is
// taken off ALL sites, not off the resolvable ones: a defect that made a
// slot unresolvable would otherwise evict the site from its own row, which
// is the failure calibration caught in C1. Slots the resolver reads as
// text, and slots a person has declared not-a-number, are the two things
// excluded, and they are excluded because they are not counts.
const singularUniverse = allSites.flatMap((s) =>
  s.slots
    .filter((sl) => !sl.literal)
    .filter((sl) => sl.cls !== 'text' && UNRESOLVED_SLOTS[`${s.rel} :: ${sl.src}`] !== 'not-a-number')
    .map((sl) => ({ site: s, slot: sl, id: `${s.rel} :: ${s.key} :: ${sl.src}` }))
);
const singularIds = [...new Set(singularUniverse.map((u) => u.id))].sort();
check(
  'E1 every count that can vary declares how it reads at 1',
  singularIds.filter((id) => !(id in SINGULAR_ANSWERS)),
  []
);
check(
  'E2 every SINGULAR_ANSWERS entry names a count the walk still finds',
  Object.keys(SINGULAR_ANSWERS).filter((k) => !singularIds.includes(k)).sort(),
  []
);
check(
  'E3 every singular answer is from the declared vocabulary, and a declared one carries a reason',
  Object.entries(SINGULAR_ANSWERS)
    .filter(([, [kind, why]]) =>
      !SINGULAR_KINDS.includes(kind) ||
      ((kind === 'unreachable' || kind === 'no-agreement') && !why) ||
      (kind === 'sibling' && !why)
    )
    .map(([k, v]) => `${k} → ${JSON.stringify(v)}`)
    .sort(),
  []
);
// E4-E6 are the measured three. Each one asserts the thing the answer
// claims, in the tree, rather than accepting the word for it.
check(
  'E4 every sibling answer quotes an arm its own file renders',
  singularUniverse
    .filter((u) => SINGULAR_ANSWERS[u.id]?.[0] === 'sibling')
    .filter((u) => !fileShapes.get(u.site.rel)?.has(SINGULAR_ANSWERS[u.id][1]))
    .map((u) => `${at(u.site)} ${JSON.stringify(SINGULAR_ANSWERS[u.id][1])}`)
    .sort(),
  []
);
check(
  'E5 every inline answer sits at a site that tests for 1',
  singularUniverse
    .filter((u) => SINGULAR_ANSWERS[u.id]?.[0] === 'inline')
    .filter((u) => !u.site.testsOne)
    .map((u) => `${at(u.site)} :: ${u.slot.src}`)
    .sort(),
  []
);
check(
  'E6 every floor answer has a computed lower bound of at least 2',
  singularUniverse
    .filter((u) => SINGULAR_ANSWERS[u.id]?.[0] === 'floor')
    .filter((u) => !(typeof u.slot.bound === 'number' && u.slot.bound >= 2))
    .map((u) => `${at(u.site)} :: ${u.slot.src} → ${JSON.stringify(u.slot.bound)}`)
    .sort(),
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
const counts = Object.values(NUMBER_SITES).filter((v) => v.kind === 'count');
const cell = (r, sub) => counts.filter((v) => v.register === r && v.substance === sub).length;
const spelled = (r, sub, sp) =>
  counts.filter((v) => v.register === r && v.substance === sub && v.spelling === sp).length;
console.log('    the two axes, and the one cell the law spells as a word:');
for (const r of REGISTERS) {
  for (const sub of SUBSTANCES) {
    console.log(
      `      ${r.padEnd(8)} + ${sub.padEnd(7)}  ${String(cell(r, sub)).padStart(2)} sites   ` +
        `${spelled(r, sub, 'word')} word / ${spelled(r, sub, 'digit')} digit` +
        (r === 'sentence' && sub === 'tally' ? '   <- the word cell' : '')
    );
  }
}
console.log(
  `\n--- OWED: ${unruledCounts.length} unruled counts ` +
    `(${bySpelling('sentence', 'digit')} sentence/digit, ${bySpelling('label', 'digit')} label/digit, ` +
    `${bySpelling('sentence', 'word')} sentence/word, ${bySpelling('label', 'word')} label/word) ---`
);
for (const axis of [...new Set(unruledCounts.map(([, v]) => v.note))].sort()) {
  console.log(`   ${axis}`);
  for (const [k, v] of unruledCounts.filter(([, v2]) => v2.note === axis).sort()) {
    console.log(`     ${v.register}/${v.substance}/${v.spelling}  ${k.replace(/\n/g, ' ').slice(0, 120)}`);
  }
}

// The singular answers a person declared rather than the walk measured.
// Printed for the same reason the owed list is: an answer nobody can
// recompute should at least be visible to everybody who reads a run.
const declaredSingulars = Object.entries(SINGULAR_ANSWERS).filter(
  ([, [kind]]) => kind === 'unreachable' || kind === 'no-agreement'
);
console.log(
  `\n--- DECLARED: ${declaredSingulars.length} of ${Object.keys(SINGULAR_ANSWERS).length} singular answers ` +
    `are a person's, not a measurement ---`
);
for (const [k, [kind, why]] of declaredSingulars.sort()) {
  console.log(`   ${kind}  ${k.split(' :: ').slice(0, 2).join(' :: ').slice(0, 96)}`);
  console.log(`     ${why}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
