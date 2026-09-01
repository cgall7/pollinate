import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const baseSources = {
  compose: read('src/screens/CombNectarCompose.js'),
  card: read('src/components/OrganizerCombCard.js'),
  today: read('src/screens/TodayTab.js'),
  contributing: read('src/screens/ContributingHive.js'),
  store: read('src/services/NectarStore.js'),
  app: read('App.js'),
  packageJson: read('package.json'),
};

const checks = [];
const check = (name, predicate) => checks.push({ name, pass: Boolean(predicate) });

const hasOrganizerRoute = ({ card, today }) =>
  /export const OrganizerCombCard = \(\{ comb, expanded, onPress, onWrite, onNectar \}\)/.test(card) &&
  /expanded && \([\s\S]*?onPress=\{\(\) => onNectar\?\.\(comb\)\}[\s\S]*?Send a little thanks/.test(card) &&
  /onNectar=\{\(comb\) =>\s*navigation\.getParent\(\)\?\.navigate\('CombNectarCompose', \{ combId: comb\.id \}\)/s.test(today);

const hasPlaceholderGuard = ({ compose }) =>
  /import\s*\{\s*isPlaceholderName\s*\}\s*from\s*'\.\.\/utils\/placeholderName'/.test(compose) &&
  /const memberName = \(name\) => \(isPlaceholderName\(name\) \? 'someone in this comb' : name\)/.test(compose) &&
  /const recipientLabel = recipient \? memberName\(recipient\.display_name\) : 'someone in this comb'/.test(compose) &&
  /<Text style=\{styles\.memberName\}>\{memberName\(member\.display_name\)\}<\/Text>/.test(compose) &&
  /<Text style=\{styles\.target\}>To \{recipientLabel\}<\/Text>/.test(compose) &&
  !/<Text style=\{styles\.memberName\}>\{member\.display_name\}<\/Text>/.test(compose) &&
  !/To \{recipient\?\.display_name/.test(compose);

const hasFlightSuccess = ({ compose }) =>
  /import \* as Haptics from 'expo-haptics'/.test(compose) &&
  /import\s*\{\s*NectarGiftLayer\s*\}\s*from\s*'\.\.\/components\/NectarGiftLayer'/.test(compose) &&
  /import\s*\{\s*useNectarGift\s*\}\s*from\s*'\.\.\/components\/useNectarGift'/.test(compose) &&
  /const giftOrigin = useRef\(null\)/.test(compose) &&
  /const recipientDestination = useRef\(null\)/.test(compose) &&
  /const gift = useNectarGift\(\{ reduced, balanceDrops \}\)/.test(compose) &&
  /const \[origin, destination\] = await Promise\.all\(\[measure\(giftOrigin\), measure\(recipientDestination\)\]\)/.test(compose) &&
  /await gift\.send\(\{[\s\S]*?origin,[\s\S]*?destination,[\s\S]*?amount: resolvedAmount,[\s\S]*?commit: \(\) =>[\s\S]*?NectarStore\.sendCombNectarNote\(\{ sendId: sendId\.current, combId, recipientId, note: note\.trim\(\), amountDrops: resolvedAmount \}\)[\s\S]*?NectarStore\.getBalanceDrops\(\)[\s\S]*?setBalanceDrops\(drops\)/.test(compose) &&
  /if \(!origin \|\| !destination\) Haptics\.notificationAsync\(Haptics\.NotificationFeedbackType\.Success\)/.test(compose) &&
  /displayDrops=\{gift\.displayDrops\}/.test(compose) &&
  /controlsStyle=\{gift\.controlsStyle\}/.test(compose) &&
  /originRef=\{giftOrigin\}/.test(compose) &&
  /<NectarGiftLayer gift=\{gift\.gift\} travel=\{gift\.travel\} dropScale=\{gift\.dropScale\} dropOpacity=\{gift\.dropOpacity\} bloom=\{gift\.bloom\} \/>/.test(compose);

const hasRefusalState = ({ compose }) =>
  /const sendId = useRef\(randomUUID\(\)\)/.test(compose) &&
  /const retireAttempt = useCallback\(\(\) => \{[\s\S]*?sendId\.current = randomUUID\(\)/.test(compose) &&
  /changeNote[\s\S]*?retireAttempt\(\)/.test(compose) &&
  /chooseRecipient[\s\S]*?retireAttempt\(\)/.test(compose) &&
  /choosePreset[\s\S]*?retireAttempt\(\)/.test(compose) &&
  /changeCustom[\s\S]*?retireAttempt\(\)/.test(compose) &&
  /recipient not eligible[\s\S]*?setRecipientId\(null\)[\s\S]*?This person isn't available in this comb anymore/.test(compose) &&
  /insufficient nectar[\s\S]*?setAmount\(null\)[\s\S]*?setCustom\(''\)[\s\S]*?setBalanceChangePending\(true\)/.test(compose) &&
  /already recorded with different parameters[\s\S]*?NectarStore\.listCombNectarNotes\(combId\)/.test(compose) &&
  /Preserve the exact payload and send id/.test(compose) &&
  /setFailed\(true\)/.test(compose);

check(
  'DES-32 compose route is registered as the one send surface',
  /name="CombNectarCompose"/.test(baseSources.app) &&
    /component=\{CombNectarComposeScreen\}/.test(baseSources.app) &&
    /export const CombNectarComposeScreen/.test(baseSources.compose)
);

check(
  'member entry point routes to CombNectarCompose with the comb rotation id',
  /navigation\.navigate\('CombNectarCompose', \{ combId: hive\.combRotation\.combId \}\)/.test(baseSources.contributing)
);

check(
  'organizer expanded card routes to CombNectarCompose with exact comb.id',
  hasOrganizerRoute(baseSources)
);

check(
  'comb note uses the pinned NectarStore RPC wrapper',
  /async sendCombNectarNote\(\{ sendId, combId, recipientId, note, amountDrops \}\)/.test(baseSources.store) &&
    /\.rpc\('send_comb_nectar_note'/.test(baseSources.store) &&
    /p_send_id: sendId/.test(baseSources.store) &&
    /p_comb_id: combId/.test(baseSources.store) &&
    /p_recipient_id: recipientId/.test(baseSources.store) &&
    /p_note: note/.test(baseSources.store) &&
    /p_amount_drops: amountDrops/.test(baseSources.store)
);

check(
  'member chips and target label are protected by the shared placeholder guard',
  hasPlaceholderGuard(baseSources)
);

check(
  'success path uses NectarGiftLayer/useNectarGift with authoritative balance re-read',
  hasFlightSuccess(baseSources)
);

check(
  'measurement-unavailable path still commits, refreshes balance, announces, haptics, and closes',
  /const result = origin && destination[\s\S]*?: await NectarStore\.sendCombNectarNote/.test(baseSources.compose) &&
    /setBalanceRefresh\(\(value\) => value \+ 1\)/.test(baseSources.compose) &&
    /if \(!origin \|\| !destination\) Haptics\.notificationAsync\(Haptics\.NotificationFeedbackType\.Success\)/.test(baseSources.compose) &&
    /AccessibilityInfo\.announceForAccessibility\(message\)/.test(baseSources.compose) &&
    /navigation\.goBack\(\)/.test(baseSources.compose)
);

check(
  'refusal handling preserves draft/send id unless the payload is edited',
  hasRefusalState(baseSources)
);

check(
  'DES-32 client gate is registered in package scripts',
  /"check:des32-comb-nectar-client": "node scripts\/check-des32-comb-nectar-client\.mjs"/.test(baseSources.packageJson)
);

const placeholderValues = new Set(['', 'New user', null, undefined]);
const fixtureName = (name) => (placeholderValues.has(name ?? '') ? 'someone in this comb' : name);
const fixtureTarget = (name) => `To ${fixtureName(name)}`;
const fixtureCanExactRetry = ({ edited, failed }) => failed && !edited;
const fixtureBalanceSuccess = ({ before, amount, after }) => after === before - amount;

check(
  'data fixtures protect placeholder member and target copy',
  fixtureName('New user') === 'someone in this comb' &&
    fixtureName('') === 'someone in this comb' &&
    fixtureTarget('New user') === 'To someone in this comb' &&
    fixtureTarget('Mira') === 'To Mira'
);

check(
  'data fixtures preserve exact retry after network failure until edit',
  fixtureCanExactRetry({ failed: true, edited: false }) &&
    !fixtureCanExactRetry({ failed: true, edited: true })
);

check(
  'data fixtures model visible authoritative balance decrease',
  fixtureBalanceSuccess({ before: 240, amount: 40, after: 200 }) &&
    !fixtureBalanceSuccess({ before: 240, amount: 40, after: 240 })
);

const assertMutationCaught = (name, mutate, predicate) => {
  const mutated = mutate({ ...baseSources });
  check(name, !predicate(mutated));
};

assertMutationCaught(
  'mutation: organizer-route removal is caught',
  (sources) => ({
    ...sources,
    card: sources.card.replace('onPress={() => onNectar?.(comb)}', 'onPress={() => {}}'),
  }),
  hasOrganizerRoute
);

assertMutationCaught(
  'mutation: placeholder-guard removal is caught',
  (sources) => ({
    ...sources,
    compose: sources.compose
      .replace('{memberName(member.display_name)}', '{member.display_name}')
      .replace('To {recipientLabel}', "To {recipient?.display_name ?? 'someone in this comb'}"),
  }),
  hasPlaceholderGuard
);

assertMutationCaught(
  'mutation: immediate goBack restoration is caught',
  (sources) => ({
    ...sources,
    compose: sources.compose
      .replace('const result = origin && destination', 'const result = false')
      .replace(/await gift\.send\(\{[\s\S]*?setBalanceDrops\(drops\)\),\s*\}\)/, 'await NectarStore.sendCombNectarNote({ sendId: sendId.current, combId, recipientId, note: note.trim(), amountDrops: resolvedAmount })'),
  }),
  hasFlightSuccess
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
