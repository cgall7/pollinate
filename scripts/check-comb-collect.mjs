import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

let pass = 0;
const failures = [];
const ok = (label) => {
  pass += 1;
  console.log(`  ok   ${label}`);
};
const bad = (label, detail) => {
  failures.push(`${label} — ${detail}`);
  console.log(`  FAIL ${label} — ${detail}`);
};

const store = read('src/services/HiveStore.js');
const app = read('App.js');
const today = read('src/screens/TodayTab.js');
const contributing = read('src/screens/ContributingHive.js');
const rotationFrame = read('src/components/RotationFrame.js');
const useDaysLeft = read('src/components/useDaysLeft.js');

if (!exists('src/screens/CombCollect.js') && !/CombCollect/.test(app)) {
  ok('C1 no standalone CombCollect screen or navigator route');
} else {
  bad('C1 inherited route', 'CombCollect file or App.js route still exists');
}

if (
  /resolveOpenCombRotations/.test(store) &&
  /\.from\('comb_rotations'\)/.test(store) &&
  /\.is\('sealed_at', null\)/.test(store) &&
  /\.is\('voided_at', null\)/.test(store)
) {
  ok('C2 contributing-hive store resolves open comb rotations');
} else {
  bad('C2 open rotation enrichment', 'expected open comb_rotations enrichment on contributing hives');
}

if (/comb_rotation_writer_count/.test(store) && /if \(writerCountError\) throw writerCountError/.test(store)) {
  ok('C3 writer-count read errors are thrown');
} else {
  bad('C3 thrown read errors', 'expected writer-count errors to throw');
}

if (/combRotation:\s*openRotationByHiveId\.get\(hive\.id\) \?\? null/.test(store)) {
  ok('C4 store returns explicit combRotation discriminator mapping');
} else {
  bad('C4 explicit return mapping', 'expected contributing hive payload to include combRotation or null');
}

if (/ContributingHiveRow[\s\S]*RotationFold/.test(today) && /variant="member"/.test(today) && /countKind="writers"/.test(today)) {
  ok('C5 Today contributing-hive card mounts the DES-31 member fold');
} else {
  bad('C5 Today fold', 'expected RotationFold member/writers mount in ContributingHiveRow');
}

if (/ContributingHiveScreen[\s\S]*RotationFold/.test(contributing) && /variant="member"/.test(contributing) && /countKind="writers"/.test(contributing)) {
  ok('C6 ContributingHive banner mounts member RotationFold');
} else {
  bad('C6 ContributingHive fold', 'expected member RotationFold in existing contributor screen banner');
}

if (/navigation\.navigate\('ComposeHiveEntry', \{ hiveId, subjectName: hive\.subjectName \}\)/.test(contributing)) {
  ok('C7 existing ComposeHiveEntry CTA remains hiveId-based');
} else {
  bad('C7 compose CTA', 'expected existing ContributingHive CTA to route with the same hiveId');
}

if (
  /export const daysUntil/.test(useDaysLeft) &&
  /export const useDaysLeft/.test(useDaysLeft) &&
  /useDaysLeft/.test(today) &&
  /useDaysLeft/.test(contributing) &&
  /useDaysLeft/.test(rotationFrame) &&
  !/Math\.ceil/.test(rotationFrame) &&
  !/Math\.ceil/.test(today) &&
  !/Math\.ceil/.test(contributing)
) {
  ok('C8 days-left math uses the shared hook only');
} else {
  bad('C8 single-clock invariant', 'expected shared useDaysLeft and no local Math.ceil day math in touched renderers');
}

console.log(`\ncheck-comb-collect: ${pass} passed, ${failures.length} failed`);
if (failures.length > 0) process.exit(1);
