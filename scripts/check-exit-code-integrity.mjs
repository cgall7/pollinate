// Gate for the class Vector found probing the ENG-91 null-guard's new
// surface (thread b57ad406, 2026-08-30): `embedded-postgres` pulls in
// `async-exit-hook`, which registers a Node 'beforeExit' handler that
// hard-exits 0 (node_modules/async-exit-hook/index.js — `add.hookEvent
// ('beforeExit', 0)` resolving to `process.exit(0)`). A bare
// `process.exitCode = 1` set anywhere in a Postgres-backed gate is silently
// discarded once the event loop drains — `npm test` reads exit 0 and reports
// green while the gate's own printed tally says otherwise.
//
//   npm run check:exit-code-integrity
//
// This is invisible to every other gate in this suite because they all
// report on themselves — a gate whose own exit path is broken cannot be
// trusted to say so. This one runs OUTSIDE that blast radius: assertion 1
// spawns fresh, disposable child processes to prove the hazard mechanism
// itself is real today (not assumed from a comment); assertion 2 is a
// static, enumerated sweep of every scripts/check-*.mjs file that loads
// embedded-postgres, so a FUTURE gate copy-pasted from an old file (the
// documented origin of all five affected gates — each one's exitCode
// idiom traces to copying the file before it, not independent invention)
// is caught here before it ships, not discovered the next time someone
// happens to mutate a passing assertion and notice the suite stayed green.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const SELF = path.basename(fileURLToPath(import.meta.url));

let pass = 0;
const failures = [];
const ok = (label) => {
  pass += 1;
  console.log(`  ok   ${label}`);
};
const bad = (label, detail) => {
  failures.push(`${label} — ${detail}`);
  console.log(`  FAIL ${label}\n         ${detail}`);
};

const run = (code) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, ['-e', code], { stdio: 'ignore' });
    child.on('exit', (exitCode) => resolve(exitCode));
  });

// --- 1. The mechanism itself, proven live, not assumed from a comment ---

const bareExitCode = await run('process.exitCode = 1;');
if (bareExitCode === 1) {
  ok('canary: a bare process.exitCode = 1 alone exits 1 (Node baseline)');
} else {
  bad(
    'canary: a bare process.exitCode = 1 alone exits 1 (Node baseline)',
    `got exit ${bareExitCode} — Node's own beforeExit semantics changed; re-derive this file's whole premise`
  );
}

const swallowed = await run("require('embedded-postgres'); process.exitCode = 1;");
if (swallowed === 0) {
  ok('hazard confirmed live: embedded-postgres + bare process.exitCode = 1 exits 0 (async-exit-hook wins the race)');
} else {
  bad(
    'hazard confirmed live: embedded-postgres + bare process.exitCode = 1 exits 0 (async-exit-hook wins the race)',
    `got exit ${swallowed} — if embedded-postgres or async-exit-hook changed behavior, the five gate-side fixes ` +
      'below may now be redundant rather than load-bearing; re-check before trusting a green here as proof of nothing'
  );
}

const guarded = await run(
  "require('embedded-postgres'); process.exitCode = 1; Promise.resolve().then(() => process.exit(process.exitCode ?? 0));"
);
if (guarded === 1) {
  ok('fix pattern confirmed live: explicit process.exit(process.exitCode ?? 0) after resolution exits 1');
} else {
  bad(
    'fix pattern confirmed live: explicit process.exit(process.exitCode ?? 0) after resolution exits 1',
    `got exit ${guarded} — the wrapper five gates rely on to surface a failure no longer works as designed`
  );
}

// --- 2. Static class coverage: every Postgres-backed gate, off disk ---

const gateFiles = fs
  .readdirSync(SCRIPTS_DIR)
  .filter((f) => f.startsWith('check-') && f.endsWith('.mjs') && f !== SELF)
  .sort();

let pgGatesSeen = 0;

for (const file of gateFiles) {
  const src = fs.readFileSync(path.join(SCRIPTS_DIR, file), 'utf8');
  const loadsEmbeddedPg = /require\(\s*['"]embedded-postgres['"]\s*\)/.test(src);
  if (!loadsEmbeddedPg) continue;
  pgGatesSeen += 1;

  const setsExitCode = /process\.exitCode\s*=\s*1/.test(src);
  if (!setsExitCode) {
    // Pattern A: reports failure via a direct process.exit(1) at the tally
    // (check-hive-state-rls, check-seeds-rls, check-share-visibility) or
    // delegates to a child whose exit status it forwards
    // (check-nectar-ledger). Neither ever hands async-exit-hook a bare
    // exitCode to race against, so there is nothing for this gate to check.
    ok(`${file}: loads embedded-postgres, never sets a bare process.exitCode — nothing for beforeExit to swallow`);
    continue;
  }

  const hasSafeWrapper = /process\.exit\(\s*process\.exitCode/.test(src);
  if (hasSafeWrapper) {
    ok(`${file}: sets process.exitCode but consumes it via an explicit process.exit() before the process can idle-exit`);
  } else {
    bad(
      `${file}: sets process.exitCode = 1 with no explicit process.exit() to consume it`,
      "embedded-postgres's async-exit-hook will hard-exit 0 at 'beforeExit' before this ever reaches the OS — " +
        'npm test will read exit 0 and report this gate green regardless of what it printed'
    );
  }
}

if (pgGatesSeen === 0) {
  bad('swept at least one embedded-postgres-backed gate', 'found zero — the enumerator or the require() pattern moved, not that every gate stopped using Postgres');
} else {
  ok(`swept ${pgGatesSeen} embedded-postgres-backed gate(s) off disk`);
}

console.log(`\ncheck-exit-code-integrity: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
