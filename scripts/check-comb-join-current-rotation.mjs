// ENG-59/O10 structural gate. The full SQL behavior gate runs in CI's
// embedded/Postgres environment; this keeps the atomic contract visible in
// every local preflight too.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20260831000001_eng59_join_current_rotation.sql'), 'utf8');
const checks = [
  ['join RPC is SECURITY DEFINER', /create or replace function public\.comb_join_by_invite_code[\s\S]*?security definer/i],
  ['membership insert is idempotent', /insert into public\.comb_members[\s\S]*?on conflict \(comb_id, profile_id\) do nothing/i],
  ['open rotation is resolved', /comb_rotations[\s\S]*?sealed_at is null[\s\S]*?voided_at is null/i],
  ['current member is enrolled as contributor', /insert into public\.hive_contributors \(hive_id, profile_id, invited_by\)[\s\S]*?on conflict \(hive_id, profile_id\) do nothing/i],
];
const failures = checks.filter(([, pattern]) => !pattern.test(sql));
for (const [name] of checks) console.log(`  ${failures.some(([failed]) => failed === name) ? 'FAIL' : 'ok  '} ${name}`);
if (failures.length) process.exit(1);
console.log(`\ncheck-comb-join-current-rotation: ${checks.length} passed, 0 failed`);
