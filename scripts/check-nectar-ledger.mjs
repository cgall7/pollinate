// Gate: the nectar ledger migration holds every invariant it claims, proven
// against a real Postgres.
//
//   npm run check:nectar-ledger
//
// Runs supabase/ledger/verify/test.js, which applies
// supabase/migrations/20260826000001_nectar_ledger.sql and
// 20260826000005_nectar_sim_service.sql to an embedded-postgres cluster
// (port 55433 — see the port map in .github/workflows/test.yml) and asserts
// their invariants (the suite prints its own count): postings balance to
// zero, overdrafts are rejected at COMMIT, funding requires a matching
// invoice poll, postings are immutable, the rails_mode guard refuses a real
// Strike observation while the mode is 'simulated', and the 19a service
// layer holds B0 (no zap without consent), exactly-once zap recording, and
// the simulated-only starter grant. The rails_mode guard is the tripwire
// Sage's 2026-08-26 promotion ruling leans on: the schema is authorized in
// simulated mode only, and flipping rails_mode to 'live' stays embargoed on
// DESIGN.md §9/§13.
//
// The suite predates this gate — it was the branch's promotion evidence, run
// by hand from supabase/ledger/verify/. This file exists so `npm test` runs
// it like every other gate instead of when someone remembers. The mutation
// harness (verify/mutate.js, drops each guard and confirms the suite goes
// red) stays manual like preflight:prod-schema: `cd supabase/ledger/verify &&
// npm run mutate`.
//
// test.js is CommonJS with its own package.json in verify/ (kept so the suite
// still runs standalone); its deps resolve upward to this repo's own
// devDependencies (embedded-postgres, pg — same pinned versions), so plain
// `npm ci` at the root is enough, in CI and locally.
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEST = path.join(ROOT, 'supabase/ledger/verify/test.js');

if (process.env.SKIP_PG_GATES === '1') {
  console.log('check-nectar-ledger: SKIPPED — SKIP_PG_GATES=1 was set. The ledger invariants are UNTESTED in this run.');
  process.exit(0);
}

// Resolve from the test file's own location so this preflight sees exactly
// what test.js's require() will see.
const requireFromVerify = createRequire(TEST);
try {
  requireFromVerify('embedded-postgres');
  requireFromVerify('pg');
} catch (e) {
  console.error(
    `check-nectar-ledger: FAILED — cannot load embedded-postgres/pg (${e.message.split('\n')[0]}).\n` +
      '  These are devDependencies of this repo; run `npm install`.\n' +
      '  This gate proves the ledger cannot overdraft, double-credit, or record\n' +
      '  real money in simulated mode, so it fails rather than skipping.\n' +
      '  To bypass deliberately: SKIP_PG_GATES=1 npm test'
  );
  process.exit(1);
}

// test.js prints its own `N passed, M failed` tail line and exits 1 on any
// failure, 2 on a harness error — both non-zero, both red here. Its output
// streams through untouched so the runner reads the counts from the suite
// itself rather than a retelling.
const child = spawn(process.execPath, [TEST], { cwd: path.dirname(TEST), stdio: 'inherit' });
child.on('error', (e) => {
  console.error(`check-nectar-ledger: FAILED — could not spawn test.js: ${e.message}`);
  process.exit(1);
});
child.on('close', (code, signal) => {
  if (signal) {
    console.error(`check-nectar-ledger: FAILED — test.js died on ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
