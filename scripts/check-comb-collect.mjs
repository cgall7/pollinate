import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

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

const screen = read('src/screens/CombCollect.js');
const store = read('src/services/HiveStore.js');
const app = read('App.js');

if (/export const CombCollectScreen/.test(screen) && /export const COMB_COLLECT_ROUTE = 'CombCollect'/.test(screen)) {
  ok('C1 CombCollect exports a screen and route contract');
} else {
  bad('C1 route contract', 'expected exported CombCollectScreen and COMB_COLLECT_ROUTE');
}

if (!/CombCollect/.test(app)) {
  ok('C2 App.js is not edited for route registration');
} else {
  bad('C2 navigator ownership', 'CombCollect appears in App.js; Lumen owns navigator integration');
}

if (/getCombCollectRotation/.test(store) && /\.from\('comb_rotations'\)/.test(store) && /\.is\('sealed_at', null\)/.test(store) && /\.is\('voided_at', null\)/.test(store)) {
  ok('C3 store resolves the open comb rotation');
} else {
  bad('C3 open rotation resolver', 'expected comb_rotations query gated to the open row');
}

if (/getContributingHive\(rotation\.hive_id\)/.test(store) && /if \(!hive\) return null/.test(store)) {
  ok('C4 resolver proves current contributor access before returning a collect hive');
} else {
  bad('C4 contributor proof', 'expected getContributingHive(rotation.hive_id) and null on missing seat');
}

if (/comb_rotation_writer_count/.test(store) && /if \(writerCountError\) throw writerCountError/.test(store)) {
  ok('C5 resolver reads writer count with thrown RPC errors');
} else {
  bad('C5 writer count', 'expected comb_rotation_writer_count with error handling');
}

if (/variant="member"/.test(screen) && /countKind="writers"/.test(screen) && /daysLeft=\{daysLeft\}/.test(screen)) {
  ok('C6 screen mounts RotationFold in member mode with days-left state');
} else {
  bad('C6 RotationFold mount', 'expected member variant, writers countKind, and daysLeft');
}

if (/navigation\.navigate\('ComposeHiveEntry'/.test(screen) && /hiveId: rotation\.hiveId/.test(screen)) {
  ok('C7 write CTA routes to ComposeHiveEntry for the resolved hive');
} else {
  bad('C7 write CTA', 'expected ComposeHiveEntry navigation with rotation.hiveId');
}

console.log(`\ncheck-comb-collect: ${pass} passed, ${failures.length} failed`);
if (failures.length > 0) process.exit(1);
