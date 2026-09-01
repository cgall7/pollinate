import fs from 'node:fs';
import path from 'node:path';

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
    /const chapterSignalLabel = `\$\{expanded \? '▾' : '▸'\} \$\{chapterCountLabel\}`/.test(card) &&
    /chapterCount > 0 && \(/.test(card) &&
    /<Text style=\{styles\.metaLine\}>\{chapterSignalLabel\}<\/Text>/.test(card)
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
const fixtureAffordance = ({ chapters, expanded }) => ({
  signal: chapters.length > 0 ? `${expanded ? '▾' : '▸'} ${chapters.length} past month${chapters.length === 1 ? '' : 's'}` : null,
  rows: expanded ? chapters.map((chapter) => `Month ${chapter.ordinal}: ${fixtureChapterSubjectName(chapter.subjectName)}`) : [],
});
const fixtureChapterIds = fixtureChapterRows
  .filter((row) => row.sealed_at != null && row.voided_at == null)
  .map((row) => row.id);

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
  }).signal === '▸ 1 past month'
);

check(
  'collapsed chapter affordance fixture pluralizes multiple past months',
  fixtureAffordance({
    expanded: false,
    chapters: [
      { id: 'one', ordinal: 1, subjectName: 'Maya' },
      { id: 'two', ordinal: 2, subjectName: 'Jonah' },
    ],
  }).signal === '▸ 2 past months'
);

check(
  'zero chapter fixture renders no history affordance',
  fixtureAffordance({ expanded: false, chapters: [] }).signal === null
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
  expandedChapterFixture.signal === '▾ 3 past months' &&
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
