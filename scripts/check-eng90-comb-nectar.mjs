import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = (p) => readFileSync(resolve(process.cwd(), p), 'utf8');

const checks = [];
const fail = (name, detail) => {
  console.log(`not ok ${name}`);
  if (detail) console.log(`  ${detail}`);
  process.exitCode = 1;
};
const pass = (name) => console.log(`ok ${name}`);

const migration = file('supabase/migrations/20260830000013_eng90_comb_nectar_note.sql');
[
  'create table public.comb_nectar_notes',
  'create or replace function public._nectar_send_tip(',
  'create or replace function public.send_comb_nectar_note(',
  'v_txn := public._nectar_send_tip(',
  'revoke all on function public.send_comb_nectar_note',
].forEach((needle) => {
  if (!migration.includes(needle)) {
    fail('migration-surface', `missing: ${needle}`);
  }
});

if (!process.exitCode) {
  checks.push('migration-surface');
  pass('migration-surface');
}

const nectarStore = file('src/services/NectarStore.js');
[
  "async sendCombNectarNote({ sendId, combId, recipientId, note, amountDrops })",
  "async listCombNectarNotes(combId)",
  "client.rpc('send_comb_nectar_note'",
  '.from(\'comb_nectar_notes\')',
  '.order(\'created_at\', { ascending: false })',
].forEach((needle) => {
  if (!nectarStore.includes(needle)) {
    fail('client-surface', `missing: ${needle}`);
  }
});

if (!process.exitCode) {
  checks.push('client-surface');
  pass('client-surface');
}

if (!process.exitCode) {
  pass('check count: ' + checks.length);
  console.log(`pass: ${checks.length} checks`);
}

