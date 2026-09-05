// Gate: R-NT-3's merged nectar ledger reader (Part 3 — the Nectar tab's
// event list, issue 32145e76…).
//
// Every spec cited in this file lives in the design workspace, not at any
// path in this repo; nothing under `GUIDES/` is in this tree, so a bare
// `GUIDES/...` address opens nothing for whoever reads this file next.
//
//   npm run check:nectar-events-reader
//
// `NectarStore.listNectarEvents()` merges `nectar_zaps` + `comb_nectar_notes`
// into one newest-first list. Two tables, not three, by the ruled
// correction at the mock round: `ledger_transactions` (the starter grant,
// `funding` type) renders nowhere — a grant is not a gift and has no
// person. Static source-shape checks pin the query shape (both tables read,
// the third never named, both `.or()` filters scope to the caller); fixture
// checks pin the pure merge/sort/direction/counterparty logic against the
// same shapes the real method builds it from, calibrated by mutation.
import fs from 'node:fs';
import path from 'node:path';
import { isPlaceholderName } from '../src/utils/placeholderName.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const baseSources = {
  store: read('src/services/NectarStore.js'),
  packageJson: read('package.json'),
};

const checks = [];
const check = (name, predicate) => checks.push({ name, pass: Boolean(predicate) });

const hasMergedMethod = ({ store }) =>
  /async listNectarEvents\(\)/.test(store) &&
  /\.from\('nectar_zaps'\)/.test(store) &&
  /\.from\('comb_nectar_notes'\)/.test(store) &&
  !/\.from\('ledger_transactions'\)/.test(store) &&
  /\.or\(`sender_id\.eq\.\$\{userId\},recipient_id\.eq\.\$\{userId\}`\)/.test(store);

const hasTransactionIdKey = ({ store }) =>
  /select\('transaction_id, sender_id, recipient_id, amount_drops, created_at'\)/.test(store) &&
  /select\('transaction_id, sender_id, recipient_id, note_text, amount_drops, created_at'\)/.test(store) &&
  /id: r\.transaction_id,/.test(store);

const hasPlaceholderGuard = ({ store }) =>
  /import\s*\{\s*isPlaceholderName\s*\}\s*from\s*'\.\.\/utils\/placeholderName'/.test(store) &&
  /const resolveDirectName = \(names, id\) => \{\s*if \(!names\.has\(id\)\) return 'Someone';\s*const name = names\.get\(id\);\s*return isPlaceholderName\(name\) \? null : name;\s*\}/.test(
    store
  ) &&
  /counterpartyName: resolveDirectName\(names, isSender \? r\.recipient_id : r\.sender_id\)/.test(store);

const hasDirectionAndSort = ({ store }) =>
  /const isSender = r\.sender_id === userId;/.test(store) &&
  /direction: isSender \? 'to' : 'from',/.test(store) &&
  /\.sort\(\(a, b\) => \(a\.createdAt < b\.createdAt \? 1 : a\.createdAt > b\.createdAt \? -1 : 0\)\)/.test(store);

check('listNectarEvents reads exactly the two ruled tables, never the starter-grant ledger', hasMergedMethod(baseSources));
check('cross-table row key is the shared transaction_id, not either table\'s own id', hasTransactionIdKey(baseSources));
check('counterparty name goes through the shared placeholder guard', hasPlaceholderGuard(baseSources));
check('direction is derived from sender_id and the list sorts newest first', hasDirectionAndSort(baseSources));
check(
  'gate is registered in package scripts',
  /"check:nectar-events-reader": "node scripts\/check-nectar-events-reader\.mjs"/.test(baseSources.packageJson)
);

// --- Fixture checks: the pure merge/sort/direction/counterparty logic,
// built from the same shapes listNectarEvents queries for. ---

const resolveDirectNameFixture = (names, id) => {
  if (!names.has(id)) return 'Someone';
  const name = names.get(id);
  return isPlaceholderName(name) ? null : name;
};

const mergeFixture = (zaps, notes, userId) =>
  [...zaps, ...notes]
    .map((r) => {
      const isSender = r.sender_id === userId;
      return {
        id: r.transaction_id,
        direction: isSender ? 'to' : 'from',
        counterpartyId: isSender ? r.recipient_id : r.sender_id,
        amountDrops: Number(r.amount_drops),
        noteText: r.note_text ?? null,
        createdAt: r.created_at,
      };
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

const ME = 'user-me';
const zapFixtures = [
  // I sent this one.
  { transaction_id: 'tx-1', sender_id: ME, recipient_id: 'user-a', amount_drops: 10, created_at: '2026-09-01T00:00:00Z' },
  // I received this one — same table PK space as a note below, on purpose.
  { transaction_id: 'tx-2', sender_id: 'user-b', recipient_id: ME, amount_drops: 25, created_at: '2026-09-03T00:00:00Z' },
];
const noteFixtures = [
  { transaction_id: 'tx-3', sender_id: ME, recipient_id: 'user-c', note_text: 'for the ride home', amount_drops: 5, created_at: '2026-09-02T00:00:00Z' },
];

const byId = (rows, id) => rows.find((r) => r.id === id);

check(
  'fixture: direction is "to" when I am the sender, "from" when I am the recipient',
  byId(mergeFixture(zapFixtures, [], ME), 'tx-1').direction === 'to' &&
    byId(mergeFixture(zapFixtures, [], ME), 'tx-2').direction === 'from'
);

check(
  'fixture: notes carry noteText, zaps carry null',
  mergeFixture([], noteFixtures, ME)[0].noteText === 'for the ride home' &&
    mergeFixture(zapFixtures, [], ME)[0].noteText === null
);

check(
  'fixture: merged list sorts newest first across both tables',
  mergeFixture(zapFixtures, noteFixtures, ME).map((r) => r.id).join(',') === 'tx-2,tx-3,tx-1'
);

check(
  'fixture: counterparty is the OTHER party, not always the recipient',
  byId(mergeFixture(zapFixtures, [], ME), 'tx-1').counterpartyId === 'user-a' &&
    byId(mergeFixture(zapFixtures, [], ME), 'tx-2').counterpartyId === 'user-b'
);

const namesFixture = new Map([
  ['user-a', 'Mira'],
  ['user-b', 'New user'],
  // user-c has no entry at all — RLS-dropped or deleted.
]);

check(
  'fixture: resolveDirectName — reached row, real name',
  resolveDirectNameFixture(namesFixture, 'user-a') === 'Mira'
);
check(
  'fixture: resolveDirectName — reached row, placeholder-class name goes absent',
  resolveDirectNameFixture(namesFixture, 'user-b') === null
);
check(
  'fixture: resolveDirectName — row never reached answers the permission word',
  resolveDirectNameFixture(namesFixture, 'user-c') === 'Someone'
);

const assertMutationCaught = (name, mutate, predicate) => {
  const mutated = mutate({ ...baseSources });
  check(name, !predicate(mutated));
};

assertMutationCaught(
  'mutation: reading the starter-grant ledger table is caught',
  (sources) => ({
    ...sources,
    store: sources.store.replace(
      ".from('comb_nectar_notes')\n        .select('transaction_id, sender_id, recipient_id, note_text, amount_drops, created_at')",
      ".from('ledger_transactions')\n        .select('transaction_id, sender_id, recipient_id, note_text, amount_drops, created_at')"
    ),
  }),
  hasMergedMethod
);

assertMutationCaught(
  'mutation: keying the merged row on a per-table id instead of transaction_id is caught',
  (sources) => ({
    ...sources,
    store: sources.store.replace('id: r.transaction_id,', 'id: r.id,'),
  }),
  hasTransactionIdKey
);

assertMutationCaught(
  'mutation: dropping the placeholder guard on the counterparty name is caught',
  (sources) => ({
    ...sources,
    store: sources.store.replace(
      'counterpartyName: resolveDirectName(names, isSender ? r.recipient_id : r.sender_id)',
      "counterpartyName: (isSender ? r.recipient_id : r.sender_id) && 'Someone'"
    ),
  }),
  hasPlaceholderGuard
);

assertMutationCaught(
  'mutation: sorting oldest-first is caught',
  (sources) => ({
    ...sources,
    store: sources.store.replace(
      ".sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))",
      ".sort((a, b) => (a.createdAt > b.createdAt ? 1 : a.createdAt < b.createdAt ? -1 : 0))"
    ),
  }),
  hasDirectionAndSort
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
