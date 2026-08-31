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
const packageOpen = read('src/screens/PackageOpen.js');
const useDaysLeft = read('src/components/useDaysLeft.js');
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const rotationFrameCode = stripComments(rotationFrame);
const walkSrc = (dir) =>
  fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkSrc(rel);
    return /\.(js|jsx|ts|tsx)$/.test(entry.name) ? [rel] : [];
  });

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

const rotationFrameHasNoProps = /export const RotationFrame = \(\) =>/.test(rotationFrameCode);
const rotationFrameHasSealedConstant = /Written for you/.test(rotationFrameCode);
const rotationFrameStruckActiveCopy = !/Writing for|You received|subjectName|closesAt|sealedAt|useDaysLeft/.test(rotationFrameCode);
const packageOpenNoPropCall = /<RotationFrame \/>/.test(packageOpen) && !/<RotationFrame[\s\S]*?(subjectName|closesAt|sealedAt)=/.test(packageOpen);

if (rotationFrameHasNoProps && rotationFrameHasSealedConstant && rotationFrameStruckActiveCopy && packageOpenNoPropCall) {
  ok('C8 RotationFrame is sealed-only and PackageOpen calls it with no props');
} else {
  bad(
    'C8 RotationFrame strike',
    `no-props=${rotationFrameHasNoProps}, sealed constant=${rotationFrameHasSealedConstant}, active/prop tokens absent=${rotationFrameStruckActiveCopy}, PackageOpen call=${packageOpenNoPropCall}`
  );
}

const srcMath = walkSrc('src')
  .map((rel) => [rel, read(rel)])
  .filter(([rel]) => rel !== 'src/components/useDaysLeft.js')
  .filter(([, body]) => /closesAt[\s\S]{0,200}(Math\.ceil|1000 \* 60 \* 60 \* 24)|(Math\.ceil|1000 \* 60 \* 60 \* 24)[\s\S]{0,200}closesAt/.test(body));

if (
  /export const daysUntil/.test(useDaysLeft) &&
  /export const useDaysLeft/.test(useDaysLeft) &&
  /useDaysLeft/.test(today) &&
  /useDaysLeft/.test(contributing) &&
  !/useDaysLeft/.test(rotationFrame) &&
  srcMath.length === 0
) {
  ok('C9 days-left math uses the shared hook only across production src/');
} else {
  bad(
    'C9 single-clock invariant',
    `useDaysLeft exports=${/export const daysUntil/.test(useDaysLeft) && /export const useDaysLeft/.test(useDaysLeft)}, Today uses hook=${/useDaysLeft/.test(today)}, ContributingHive uses hook=${/useDaysLeft/.test(contributing)}, RotationFrame avoids hook=${!/useDaysLeft/.test(rotationFrame)}, local src day math=${srcMath.map(([rel]) => rel).join(', ') || 'none'}`
  );
}

console.log(`\ncheck-comb-collect: ${pass} passed, ${failures.length} failed`);
if (failures.length > 0) process.exit(1);
