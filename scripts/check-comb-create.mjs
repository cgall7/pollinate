import fs from 'node:fs';
const screen = fs.readFileSync(new URL('../src/screens/CreateComb.js', import.meta.url), 'utf8');
const store = fs.readFileSync(new URL('../src/services/CombStore.js', import.meta.url), 'utf8');
const checks = [
  ['cadence choice exists', screen.includes('const CADENCES') && screen.includes('setCadence')],
  ['cadence persists into comb insert', store.includes('.insert({ owner_id: ownerId, name: label, cadence })')],
  ['no client clock argument', !store.includes('p_closes_at')],
  ['organizer name commits before create', screen.includes('await CombStore.saveOrganizerName(organizerName)')],
  ['uses the shared placeholder class', screen.includes("import { isPlaceholderName } from '../utils/placeholderName'" )],
  ['success returns to the organizer card on Today', screen.includes("navigation.replace('Main', { screen: 'Today' })")],
  // DES-29 §4 amendment (2026-09-04): createComb is insert-only now — the
  // subject question and the mint call both left this screen entirely.
  ['createComb takes no subject', !screen.includes('subjectProfileId')],
  ['createComb never calls the mint RPC', !screen.includes('openFirstRotation')],
  ['no connections read on this screen', !screen.includes('HoneycombStore')],
  ['createComb is insert-only, no mint call inside it', (() => {
    const start = store.indexOf('async createComb(');
    const body = store.slice(start, store.indexOf('\n};', start));
    return start !== -1 && !body.includes('openFirstRotation') && !body.includes('subjectProfileId');
  })()],
];
let failed = 0;
for (const [label, ok] of checks) {
  if (ok) {
    console.log(`✓ ${label}`);
  } else {
    console.error(`✗ ${label}`);
    failed += 1;
  }
}
console.log(`${checks.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
