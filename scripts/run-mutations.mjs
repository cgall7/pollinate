// run-mutations.mjs — the mutation harness, PERSISTED rather than reported.
//
// Sage's flag on R-LF-2.1 (2026-08-29): "the '8 must-red / 1 must-not-fire'
// claim has no persisted harness — nothing I can re-run to reproduce that
// specific number ... a number nobody can re-derive can't be corrected
// either, only doubted." Lumen wrote that into POLLINATE_LIVING_FLIGHT_SPEC
// §7 as a requirement. This is the mechanism.
//
//   node scripts/run-mutations.mjs scripts/check-nectar-exchange.mjs
//
// A gate file opts in by exporting `MUTATIONS`: an array of
// `{ row, why, file, from, to }`. `row` is the assertion id the edit must
// turn red; `row: null` means the edit is legal and every row must STAY
// green — the must-not-fire control, without which a harness only proves
// the gate is noisy.
//
// TWO PROPERTIES THIS RUNNER HAS ON PURPOSE.
//
// 1. IT RESTORES FROM A BUFFER IT HOLDS, NEVER FROM GIT. `git checkout HEAD
//    -- <file>` restores away any uncommitted edit of your own in the same
//    file, and the next commit then says "no changes added" while the log
//    still looks plausible. That happened to me on 2026-08-28 and it deleted
//    a fix I had just written. The original bytes are read once, up front,
//    and written back in a `finally`.
//
// 2. THE ANCHOR MUST BE UNIQUE. A `from` that occurs twice would mutate a
//    site the author did not name, so a non-unique anchor is a harness
//    error and is reported as one — not silently applied to the first hit.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const target = process.argv[2];
if (!target) {
  console.error('usage: node scripts/run-mutations.mjs scripts/check-<gate>.mjs');
  process.exit(2);
}
const gatePath = path.resolve(ROOT, target);

// Importing a gate RUNS it — top-level await, no opt-out, and that is fine:
// a gate that cannot run clean has nothing to say about a mutation. Its
// output is muted for this one pass so the harness's own report is legible;
// the baseline run below is the one whose result is used.
const realWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = () => true;
const mod = await import(pathToFileURL(gatePath).href + `?probe=${process.pid}`).catch((err) => {
  process.stdout.write = realWrite;
  console.error(`run-mutations: could not import ${target}: ${err.message}`);
  process.exit(2);
});
process.stdout.write = realWrite;

const MUTATIONS = mod?.MUTATIONS;
if (!Array.isArray(MUTATIONS) || MUTATIONS.length === 0) {
  console.error(`run-mutations: ${target} exports no MUTATIONS array`);
  process.exit(2);
}

const runGate = () =>
  new Promise((resolve) => {
    execFile('node', [gatePath], { cwd: ROOT, maxBuffer: 32 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ code: err ? (err.code ?? 1) : 0, out: `${stdout}\n${stderr}` });
    });
  });

// Which rows are red? Read from the gate's own failure lines rather than
// from its exit code, because "it went red" is not the claim — "THIS row
// went red" is. A mutation that reds some other row is a miss, not a pass.
const redRows = (out) => {
  const ids = new Set();
  for (const line of out.split('\n')) {
    const m = /^\s*(?:-\s*)?FAIL\s+([A-Za-z0-9.]+)\b/.exec(line) || /^\s*-\s+([A-Za-z0-9.]+):/.exec(line);
    if (m) ids.add(m[1]);
  }
  return ids;
};

// Cache every file we will touch, ONCE, before anything is written.
const touched = [...new Set(MUTATIONS.map((m) => m.file))];
const originals = new Map();
for (const rel of touched) {
  originals.set(rel, await readFile(path.resolve(ROOT, rel), 'utf8'));
}

const restoreAll = async () => {
  for (const [rel, src] of originals) {
    await writeFile(path.resolve(ROOT, rel), src, 'utf8');
  }
};

let mustRed = 0;
let mustRedPassed = 0;
let mustGreen = 0;
let mustGreenPassed = 0;
const problems = [];

try {
  const base = await runGate();
  if (base.code !== 0) {
    console.error('run-mutations: the gate is not green before any mutation — fix that first');
    console.error(base.out.split('\n').filter((l) => /fail/i.test(l)).join('\n'));
    await restoreAll();
    process.exit(2);
  }
  const baseRows = redRows(base.out);
  console.log(`baseline: ${target} green, ${baseRows.size} red rows\n`);

  for (const [i, m] of MUTATIONS.entries()) {
    const rel = m.file;
    const src = originals.get(rel);
    const occurrences = src.split(m.from).length - 1;
    const label = `${String(i + 1).padStart(2)}. ${m.row === null ? 'MUST-NOT-FIRE' : `${m.row} must red`}`;

    if (occurrences !== 1) {
      problems.push(`${label}: anchor occurs ${occurrences}x in ${rel} — a non-unique anchor mutates a site nobody named`);
      console.log(`  ??  ${label} — anchor occurs ${occurrences}x in ${rel}`);
      continue;
    }

    await writeFile(path.resolve(ROOT, rel), src.replace(m.from, m.to), 'utf8');
    const res = await runGate();
    const reds = redRows(res.out);
    await writeFile(path.resolve(ROOT, rel), src, 'utf8');

    if (m.row === null) {
      mustGreen += 1;
      if (res.code === 0) {
        mustGreenPassed += 1;
        console.log(`  ok  ${label} — every row stayed green: ${m.why}`);
      } else {
        problems.push(`${label}: reddened [${[...reds].join(', ')}] on a legal edit — ${m.why}`);
        console.log(`  RED ${label} — reddened [${[...reds].join(', ')}] on a LEGAL edit`);
      }
    } else {
      mustRed += 1;
      if (reds.has(m.row)) {
        mustRedPassed += 1;
        console.log(`  ok  ${label} — red, with [${[...reds].join(', ')}]: ${m.why}`);
      } else if (res.code !== 0) {
        problems.push(`${label}: the gate went red but ${m.row} did not — [${[...reds].join(', ')}]. A mutation caught by some OTHER row is a miss: ${m.why}`);
        console.log(`  RED ${label} — gate red but ${m.row} green; caught by [${[...reds].join(', ')}]`);
      } else {
        problems.push(`${label}: STAYED GREEN — ${m.why}`);
        console.log(`  RED ${label} — STAYED GREEN`);
      }
    }
  }
} finally {
  await restoreAll();
}

console.log(
  `\nrun-mutations ${target}: ${mustRedPassed}/${mustRed} must-red, ${mustGreenPassed}/${mustGreen} must-not-fire`
);
if (problems.length) {
  problems.forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}
