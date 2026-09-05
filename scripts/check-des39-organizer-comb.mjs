import fs from 'node:fs';
import path from 'node:path';
import { isPlaceholderName } from '../src/utils/placeholderName.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const checks = [];
const check = (name, predicate) => checks.push({ name, pass: Boolean(predicate) });

const hiveStore = read('src/services/HiveStore.js');
const todayTab = read('src/screens/TodayTab.js');
const card = read('src/components/OrganizerCombCard.js');
const app = read('App.js');
const packageJson = read('package.json');

check(
  'listHives excludes comb rotation hives by comb_rotations.hive_id',
  /from\('comb_rotations'\)\s*\.\s*select\('hive_id'\)\s*\.\s*in\('hive_id', hiveIds\)/s.test(hiveStore) &&
    /combRotationHiveIds\.has\(h\.id\)/.test(hiveStore) &&
    !/listHives[\s\S]*?is_collective[\s\S]*?combRotationHiveIds/.test(hiveStore)
);

check(
  'organizer comb read is owner-scoped and carries current rotation plus chapters',
  /async listOrganizerCombs\(\)/.test(hiveStore) &&
    /async getOrganizerComb\(combId\)/.test(hiveStore) &&
    /\.from\('combs'\)[\s\S]*?\.eq\('owner_id', ownerId\)/.test(hiveStore) &&
    /\.from\('comb_rotations'\)[\s\S]*?ordinal[\s\S]*?sealed_at[\s\S]*?voided_at/.test(hiveStore) &&
    /openRotation:[\s\S]*?chapters:/.test(hiveStore)
);

check(
  'chapters are sealed rotations only, never voided rows',
  /\.filter\(\(row\) => row\.sealed_at != null && row\.voided_at == null\)/.test(hiveStore)
);

check(
  'organizer comb read uses rotation writer count and member count RPCs',
  /client\.rpc\('comb_rotation_writer_count', \{ p_rotation_id: rotation\.id \}\)/.test(hiveStore) &&
    /client\.rpc\('comb_member_count', \{ p_comb_id: combId \}\)/.test(hiveStore)
);

check(
  'organizer write eligibility is proved by an active hive_contributors seat',
  /\.from\('hive_contributors'\)[\s\S]*?\.select\('hive_id'\)[\s\S]*?\.eq\('profile_id', organizerId\)[\s\S]*?\.is\('removed_at', null\)/.test(hiveStore) &&
    /const organizerSeatHiveIds = new Set/.test(hiveStore) &&
    /canWrite: organizerSeatHiveIds\.has\(rotation\.hive_id\)/.test(hiveStore)
);

check(
  'Today renders combs the user runs as an in-place expandable shelf',
  /HiveStore\.listOrganizerCombs\(\)/.test(todayTab) &&
    /COMBS YOU RUN/.test(todayTab) &&
    /expandedCombId === comb\.id/.test(todayTab) &&
    /setExpandedCombId\(\(current\) => \(current === comb\.id \? null : comb\.id\)\)/.test(todayTab)
);

check(
  'organizer comb card wears the shared RotationFold member/writers variant',
  /export const OrganizerCombCard/.test(card) &&
    /const ROTATION_WRITER_COUNT_KIND = 'writers'/.test(card) &&
    /<RotationFold[\s\S]*?variant="member"[\s\S]*?countKind=\{ROTATION_WRITER_COUNT_KIND\}/.test(card) &&
    /useDaysLeft\(rotation\?\.closesAt\)/.test(card)
);

check(
  'expanded organizer card exposes invite link and all past chapters in place',
  /expanded &&/.test(card) &&
    /getCombInviteUrl\(comb\.inviteCode\)/.test(card) &&
    /Share\.share\(\{ message: inviteUrl \}\)/.test(card) &&
    /Share invite link/.test(card) &&
    /Past chapters/.test(card) &&
    /comb\.chapters\.map\(\(chapter\)/.test(card) &&
    !/comb\.chapters\.slice/.test(card)
);

check(
  'collapsed organizer card exposes a visible chapter-count affordance',
  /const chapterCount = comb\.chapters\?\.length \?\? 0/.test(card) &&
    /const chapterCountLabel = chapterCount === 1 \? '1 past month' : `\$\{chapterCount\} past months`/.test(card) &&
    /const chapterSignalIcon = expanded \? 'chevron-down' : 'chevron-forward'/.test(card) &&
    /\{chapterCount > 0 && \(\s*<View style=\{styles\.historySignal\}>/.test(card) &&
    !/\{expanded && chapterCount > 0 && \(\s*<View style=\{styles\.historySignal\}>/.test(card) &&
    // R-RF-4 (Lumen): the mark is an Ionicon now, not an ASCII glyph in a Text
    // node. Pinned as icon-then-count inside `historySignal`, and the ASCII
    // pair is asserted GONE from this file so the swap cannot land by addition.
    /<Ionicons name=\{chapterSignalIcon\} size=\{CHAPTER_SIGNAL_ICON_SIZE\} color=\{theme\.colors\.inkSoft\} \/>\s*<Text style=\{styles\.metaLine\}>\{chapterCountLabel\}<\/Text>/.test(card) &&
    !/'▾'|'▸'/.test(card.replace(/\/\/[^\n]*/g, ''))
);

check(
  'chapter labels use the shared placeholder classifier for empty and New user names',
  /import\s*{\s*isPlaceholderName\s*}\s*from\s*'\.\.\/utils\/placeholderName'/.test(card) &&
    /export const organizerChapterSubjectName = \(name\) => \(isPlaceholderName\(name\) \? 'someone' : name\)/.test(card) &&
    /organizerChapterSubjectName\(chapter\.subjectName\)/.test(card)
);

check(
  'eligible organizer write CTA routes to ComposeHiveEntry with the rotation hiveId',
  /rotation\?\.canWrite/.test(card) &&
    /Write this month/.test(card) &&
    /onWrite\?\.?\(rotation\)/.test(card) &&
    /navigate\('ComposeHiveEntry', \{\s*hiveId: rotation\.hiveId,\s*subjectName: rotation\.subjectName/s.test(todayTab)
);

check(
  'no standalone organizer comb route is registered',
  !/OrganizerCombScreen|ORGANIZER_COMB_ROUTE|name="OrganizerComb"|navigate\('OrganizerComb'/.test(app + todayTab + card)
);

check('package exposes the DES-39 check script', /"check:des39-organizer-comb": "node scripts\/check-des39-organizer-comb\.mjs"/.test(packageJson));

const placeholderValues = new Set(['', 'New user', null, undefined]);
const fixtureChapterSubjectName = (name) => (placeholderValues.has(name ?? '') ? 'someone' : name);
const fixtureChapterRows = [
  { id: 'sealed-delivered', sealed_at: '2026-08-31T12:00:00Z', voided_at: null },
  { id: 'sealed-voided', sealed_at: '2026-08-31T12:00:00Z', voided_at: '2026-08-31T12:00:00Z' },
  { id: 'open', sealed_at: null, voided_at: null },
];
// LIFTED, NOT RESTATED. The rows below used to hold their own copy of the
// affordance's composition, which is a checker restating the constant it exists
// to check: the one drift such a pair cannot see is the drift between its two
// copies. These pull the component's OWN expressions out of the source and
// evaluate them, so an algebraic rewrite stays green and a moved value reds.
const lift = (name, params) => {
  const m = card.match(new RegExp(`const ${name} =([\\s\\S]*?);\\n`));
  if (!m) throw new Error(`could not lift \`${name}\` out of OrganizerCombCard.js`);
  return new Function(...params, `return (${m[1].trim()});`);
};
const liftedChapterSignalIcon = lift('chapterSignalIcon', ['expanded']);
const liftedChapterCountLabel = lift('chapterCountLabel', ['chapterCount']);
const liftedWriteCtaLabel = lift('writeCtaLabel', ['rotation', 'organizerChapterSubjectName', 'WRITE_CTA_TEXT']);
const liftedWriteCtaText = lift('WRITE_CTA_TEXT', []).call(null);
// `organizerChapterSubjectName` is LIFTED rather than imported: this file is
// JSX over react-native and node cannot load it. It is evaluated against the
// REAL `isPlaceholderName` module above, so only the card's own one-liner is
// reconstructed here and the class definition stays single-writer.
const liftedChapterSubjectName = lift('organizerChapterSubjectName', ['isPlaceholderName'])(isPlaceholderName);
const fixtureAffordance = ({ chapters, expanded }) => ({
  icon: chapters.length > 0 ? liftedChapterSignalIcon(expanded) : null,
  countLabel: chapters.length > 0 ? liftedChapterCountLabel(chapters.length) : null,
  rows: expanded ? chapters.map((chapter) => `Month ${chapter.ordinal}: ${fixtureChapterSubjectName(chapter.subjectName)}`) : [],
});
const fixtureChapterIds = fixtureChapterRows
  .filter((row) => row.sealed_at != null && row.voided_at == null)
  .map((row) => row.id);

// ── R-RF-2: the write CTA's ANNOUNCED label tracks the RENDERED surface ─────
// The old label was `Write for ${rotation.subjectName || 'this month'}`, which
// read raw placeholder-class names to VoiceOver ("Write for New user") that no
// sighted user is ever shown.
//
// This is checked as a BEHAVIOUR over the three states, not as a string pin,
// because the claim is an agreement between two components. Both sides are
// lifted from their own source: the label out of OrganizerCombCard, the
// subject line out of RotationFold. Neither is transcribed here, so the one
// drift a restating checker could not see (its own copy going stale) is not
// available.
//
// The states, and why the third is not the second:
//   'Maya'      truthy, not placeholder -> fold "Writing for Maya",
//                                          label "Write for Maya".
//   'New user'  truthy, placeholder     -> fold "Writing for someone",
//                                          label "Write for someone".
//   '' / absent FALSY                   -> fold takes R-38.9-F's REFUSED-READ
//                                          branch and makes NO name claim, so
//                                          the label must not make one either.
// `isPlaceholderName` coalesces `name ?? ''` and therefore cannot tell the
// third state from the second on its own; the falsy test is what separates
// them, and the label uses the SAME test the fold uses.
const fold = read('src/components/RotationFold.js');
const foldSubjectLine = (subjectName) => {
  if (!subjectName) {
    const m = fold.match(/<Text style=\{styles\.subjectLine\}>([^<]*)<\/Text>/);
    if (!m) throw new Error('could not lift the refused-read subject line out of RotationFold.js');
    return m[1];
  }
  const m = fold.match(/const subjectLine =([\s\S]*?);\n/);
  if (!m) throw new Error('could not lift `subjectLine` out of RotationFold.js');
  return new Function('subjectName', 'isPlaceholderName', `return (${m[1].trim()});`)(subjectName, isPlaceholderName);
};

check(
  'write CTA announced label carries a name only where the fold renders one',
  // WIRED, not merely correct. An expression this row evaluates but the button
  // never reads would pass every assertion below while VoiceOver still spoke
  // the old string, so the mount is asserted before the behaviour is.
  /accessibilityLabel=\{writeCtaLabel\}/.test(card) &&
    liftedWriteCtaLabel({ subjectName: 'Maya' }, liftedChapterSubjectName, liftedWriteCtaText) === 'Write for Maya' &&
    foldSubjectLine('Maya') === 'Writing for Maya' &&
    liftedWriteCtaLabel({ subjectName: 'New user' }, liftedChapterSubjectName, liftedWriteCtaText) === 'Write for someone' &&
    foldSubjectLine('New user') === 'Writing for someone' &&
    // The refused read: the fold names nobody, so neither may the label. The
    // fallback is the button's own visible text, which is why it is one
    // constant with one writer rather than a second string living here.
    liftedWriteCtaLabel({ subjectName: '' }, liftedChapterSubjectName, liftedWriteCtaText) === liftedWriteCtaText &&
    liftedWriteCtaLabel({}, liftedChapterSubjectName, liftedWriteCtaText) === liftedWriteCtaText &&
    !/Writing for/.test(foldSubjectLine('')) &&
    !/Writing for/.test(foldSubjectLine(undefined)) &&
    // and no placeholder-class name may reach VoiceOver by any of the paths.
    ![...['', 'New user', undefined]].some((n) =>
      /New user/.test(liftedWriteCtaLabel({ subjectName: n }, liftedChapterSubjectName, liftedWriteCtaText)))
);

// The single-writer claim, stated as a COUNT rather than as a source form.
// An earlier draft pinned `: WRITE_CTA_TEXT;` and went red on a rewrite that
// kept the constant and only moved the ternary's arms around: a text pin
// standing in for a semantic property reds on refactors it should not care
// about. What the property actually says is that the string exists once and
// both channels read that one occurrence.
const writeCtaTextOccurrences = (card.match(/'Write this month'/g) ?? []).length;
check(
  'write CTA visible text and its no-name-claim label are one constant',
  /const WRITE_CTA_TEXT = 'Write this month';/.test(card) &&
    writeCtaTextOccurrences === 1 &&
    /<Text style=\{styles\.actionText\}>\{WRITE_CTA_TEXT\}<\/Text>/.test(card) &&
    /\bWRITE_CTA_TEXT\b/.test(card.match(/const writeCtaLabel =([\s\S]*?);\n/)?.[1] ?? '') &&
    !/accessibilityLabel=\{`Write for \$\{rotation\.subjectName/.test(card)
);

check(
  'chapter placeholder fixtures render generic subject copy',
  fixtureChapterSubjectName('') === 'someone' &&
    fixtureChapterSubjectName('New user') === 'someone' &&
    fixtureChapterSubjectName('Maya') === 'Maya'
);

check(
  'chapter terminal fixtures include delivered only',
  fixtureChapterIds.length === 1 &&
    fixtureChapterIds[0] === 'sealed-delivered' &&
    !fixtureChapterIds.includes('sealed-voided') &&
    !fixtureChapterIds.includes('open')
);

check(
  'collapsed chapter affordance fixture is visible for one past month',
  fixtureAffordance({
    expanded: false,
    chapters: [{ id: 'one', ordinal: 1, subjectName: 'Maya' }],
  }).icon === 'chevron-forward' &&
    fixtureAffordance({
      expanded: false,
      chapters: [{ id: 'one', ordinal: 1, subjectName: 'Maya' }],
    }).countLabel === '1 past month'
);

check(
  'collapsed chapter affordance fixture pluralizes multiple past months',
  fixtureAffordance({
    expanded: false,
    chapters: [
      { id: 'one', ordinal: 1, subjectName: 'Maya' },
      { id: 'two', ordinal: 2, subjectName: 'Jonah' },
    ],
  }).icon === 'chevron-forward' &&
    fixtureAffordance({
      expanded: false,
      chapters: [
        { id: 'one', ordinal: 1, subjectName: 'Maya' },
        { id: 'two', ordinal: 2, subjectName: 'Jonah' },
      ],
    }).countLabel === '2 past months'
);

check(
  'zero chapter fixture renders no history affordance',
  fixtureAffordance({ expanded: false, chapters: [] }).icon === null &&
    fixtureAffordance({ expanded: false, chapters: [] }).countLabel === null
);

const expandedChapterFixture = fixtureAffordance({
  expanded: true,
  chapters: [
    { id: 'one', ordinal: 1, subjectName: 'Maya' },
    { id: 'two', ordinal: 2, subjectName: 'New user' },
    { id: 'three', ordinal: 3, subjectName: 'Jonah' },
  ],
});

check(
  'expanded chapter fixture preserves signal and renders every chapter',
  expandedChapterFixture.icon === 'chevron-down' &&
    expandedChapterFixture.countLabel === '3 past months' &&
    expandedChapterFixture.rows.length === 3 &&
    expandedChapterFixture.rows.includes('Month 1: Maya') &&
    expandedChapterFixture.rows.includes('Month 2: someone') &&
    expandedChapterFixture.rows.includes('Month 3: Jonah')
);

let failed = 0;
for (const result of checks) {
  if (result.pass) {
    console.log(`✓ ${result.name}`);
  } else {
    failed += 1;
    console.error(`✗ ${result.name}`);
  }
}

console.log(`${checks.length - failed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
