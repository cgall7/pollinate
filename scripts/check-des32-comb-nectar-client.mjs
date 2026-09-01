import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const compose = read('src/screens/CombNectarCompose.js');
const organizer = read('src/components/OrganizerCombCard.js');
const today = read('src/screens/TodayTab.js');
const contributing = read('src/screens/ContributingHive.js');
const store = read('src/services/NectarStore.js');
const pkg = read('package.json');

const hasFlight = (source) =>
  /useNectarGift\(\{ reduced, balanceDrops \}\)/.test(source)
  && /<NectarGiftLayer\s+gift=\{gift\.gift\}/.test(source)
  && /await gift\.send\(\{[\s\S]*?commit: \(\) =>[\s\S]*?NectarStore\.sendCombNectarNote/.test(source)
  && /navigation\.goBack\(\);/.test(source);

const hasPlaceholderGuard = (source) =>
  /isPlaceholderName/.test(source)
  && /const memberName = \(name\) => \(isPlaceholderName\(name\) \? 'someone in this comb' : name\)/.test(source)
  && /To \{recipientLabel\}/.test(source);

const hasOrganizerRoute = (card, tab) =>
  /onNectar\?\.\(comb\)/.test(card)
  && /Send a little thanks/.test(card)
  && /navigate\('CombNectarCompose', \{ combId: comb\.id \}\)/.test(tab);

const checks = [
  ['member entry routes with the rotation comb id', /navigate\('CombNectarCompose', \{ combId: hive\.combRotation\.combId \}\)/.test(contributing)],
  ['organizer expanded card routes with comb.id', hasOrganizerRoute(organizer, today)],
  ['comb note uses the real ENG-90 store method', /NectarStore\.sendCombNectarNote\(\{ sendId: sendId\.current, combId, recipientId, note: note\.trim\(\), amountDrops: resolvedAmount \}\)/.test(compose)],
  ['store calls send_comb_nectar_note and reads canonical notes', /rpc\('send_comb_nectar_note'/.test(store) && /listCombNectarNotes/.test(store)],
  ['placeholder recipients never render their stored display name', hasPlaceholderGuard(compose)],
  ['retry reuses one id until an edit retires it', /const sendId = useRef\(randomUUID\(\)\)/.test(compose) && /const retireAttempt/.test(compose) && /sendId\.current = randomUUID\(\)/.test(compose)],
  ['stable stale, balance, replay, and session states preserve the contract copy', ["This person isn't available in this comb anymore.", 'Your balance changed. You have ${drops} drops now.', 'A gift from this attempt was already sent. Refresh before sending another.', 'Sign in again to send this.'].every((copy) => compose.includes(copy))],
  ['success is the shared gift beat and closes only after it', hasFlight(compose)],
  ['package registers this counted gate', /"check:des32-comb-nectar-client"/.test(pkg)],
  ['mutation: removing organizer route reds the organizer assertion', !hasOrganizerRoute(organizer.replace('onNectar?.(comb)', ''), today)],
  ['mutation: removing placeholder guard reds the identity assertion', !hasPlaceholderGuard(compose.replace('isPlaceholderName(name)', 'false'))],
  ['mutation: immediate close without gift beat reds the success assertion', !hasFlight(compose.replace('await gift.send({', 'Promise.resolve({ ok: true }) && ({'))],
];

let failed = 0;
for (const [label, passed] of checks) {
  if (passed) console.log(`✓ ${label}`);
  else { console.error(`✗ ${label}`); failed += 1; }
}
console.log(`${checks.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
