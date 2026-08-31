// R-38.9-C / §1B.38.10 — direct unit coverage for `daysUntil`, the pure core
// `useDaysLeft` wraps. A hook can't be asserted outside a renderer (no DOM
// harness in this repo), so this is the only assertable half of the
// extraction — matching `check-date-ranges-utils.mjs`'s reason for existing.
//
//   npm run check:usedaysleft
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { daysUntil } = await import(path.join(ROOT, 'src/components/useDaysLeft.js'));

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
const eq = (label, actual, expected) => {
  if (actual === expected) ok(label);
  else bad(label, `got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
};

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-08-31T12:00:00.000Z').getTime();

eq('null closesAt returns null, not a number', daysUntil(null, NOW), null);
eq('undefined closesAt returns null', daysUntil(undefined, NOW), null);
eq('empty-string closesAt returns null (falsy, same branch as null)', daysUntil('', NOW), null);
eq('exactly 6 days remaining', daysUntil(NOW + 6 * DAY_MS, NOW), 6);
eq('6 days + 1ms rounds UP to 7 (ceil, not floor)', daysUntil(NOW + 6 * DAY_MS + 1, NOW), 7);
eq('6 days - 1ms rounds up to 6 still (ceil of 5.99999...)', daysUntil(NOW + 6 * DAY_MS - 1, NOW), 6);
eq('a few hours left ceils to 1, not 0', daysUntil(NOW + 3 * 60 * 60 * 1000, NOW), 1);
eq('closesAt already passed clamps to 0, not negative', daysUntil(NOW - DAY_MS, NOW), 0);
eq('closesAt exactly now is 0', daysUntil(NOW, NOW), 0);
eq('ISO string input parses the same as its epoch-ms equivalent', daysUntil('2026-09-06T12:00:00.000Z', NOW), 6);
eq('epoch-ms number input', daysUntil(NOW + 6 * DAY_MS, NOW), 6);

{
  const result = daysUntil(Date.now() + DAY_MS);
  if (typeof result === 'number' && result >= 0) ok('default `now` resolves to a real number');
  else bad('default `now` resolves to a real number', `got ${JSON.stringify(result)}`);
}

console.log(`\ncheck-usedaysleft: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
