import fs from 'node:fs';
const screen = fs.readFileSync(new URL('../src/screens/CreateComb.js', import.meta.url), 'utf8');
const store = fs.readFileSync(new URL('../src/services/CombStore.js', import.meta.url), 'utf8');
const checks = [
  ['cadence choice exists', screen.includes('const CADENCES') && screen.includes('setCadence')],
  ['cadence persists into comb insert', store.includes('.insert({ owner_id: ownerId, name: label, cadence })')],
  ['no client clock argument', !store.includes('p_closes_at')],
  ['organizer name commits before create', screen.includes('await CombStore.saveOrganizerName(organizerName)')],
  ['self exclusion exists', store.includes('subjectProfileId === ownerId')],
  ['same comb retries mint', screen.includes('openFirstRotation({ combId: createdCombId')],
  ['uses the shared placeholder class', screen.includes("import { isPlaceholderName } from '../utils/placeholderName'" )],
  ['success returns to the organizer card on Today', screen.includes("navigation.replace('Main', { screen: 'Today' })")],
];
let failed = 0;
for (const [label, ok] of checks) { console.log(`${ok ? 'ok' : 'FAIL'} ${label}`); if (!ok) failed += 1; }
process.exit(failed ? 1 : 0);
