import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'supabase/migrations/20260830000013_eng85_entitlements.sql');
const sql = fs.readFileSync(file, 'utf8');
const checks = [
  ['two tunable plan limits exist', /max_active_combs_written_in[\s\S]*max_comb_members/],
  ['both shipped plan limits are unlimited', /values\s*\('free', null, null\),\s*\('premium', null, null\)/i],
  ['per-comb grandfather override is nullable', /add column member_limit_override integer/i],
  ['one server-side trigger owns both checks', /create trigger comb_members_enforce_entitlements[\s\S]*execute function public\.enforce_comb_entitlements\(\)/i],
  ['idempotent invite taps bypass cap accounting', /if exists \([\s\S]*m\.comb_id = new\.comb_id[\s\S]*m\.profile_id = new\.profile_id[\s\S]*return new;/i],
  ['writer limit excludes the row being inserted', /m\.comb_id <> new\.comb_id/],
  ['member limit counts active seats', /m\.comb_id = new\.comb_id and m\.removed_at is null/],
  ['client cannot call the definer anonymously', /revoke execute on function public\.enforce_comb_entitlements\(\) from public, anon/i],
];
let failed = false;
for (const [name, pattern] of checks) {
  if (pattern.test(sql)) console.log(`  ok   ${name}`);
  else { failed = true; console.log(`  FAIL ${name}`); }
}
console.log(`\ncheck-eng85-entitlements: ${failed ? checks.length - 1 : checks.length} passed, ${failed ? 1 : 0} failed`);
if (failed) process.exit(1);
