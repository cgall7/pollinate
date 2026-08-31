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
  'organizer comb read uses rotation writer count and member count RPCs',
  /client\.rpc\('comb_rotation_writer_count', \{ p_rotation_id: rotation\.id \}\)/.test(hiveStore) &&
    /client\.rpc\('comb_member_count', \{ p_comb_id: combId \}\)/.test(hiveStore)
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
  'expanded organizer card exposes invite code and past chapters in place',
  /expanded &&/.test(card) &&
    /Invite code/.test(card) &&
    /Past chapters/.test(card) &&
    /comb\.chapters\.slice\(0, 3\)/.test(card)
);

check(
  'no standalone organizer comb route is registered',
  !/OrganizerCombScreen|ORGANIZER_COMB_ROUTE|name="OrganizerComb"|navigate\('OrganizerComb'/.test(app + todayTab + card)
);

check('package exposes the DES-39 check script', /"check:des39-organizer-comb": "node scripts\/check-des39-organizer-comb\.mjs"/.test(packageJson));

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
