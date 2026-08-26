#!/usr/bin/env node
//
// Print or --check `MASCOT_CLEARANCE`. The derivation itself lives in
// `scripts/lib/mascot-clearance.mjs` so `check-bee-attitude` runs the SAME
// code this tool does — a re-derivation tool and a gate that disagree is two
// answers wearing one name.
//
//   node scripts/derive-mascot-clearance.mjs            print the table
//   node scripts/derive-mascot-clearance.mjs --check    exit 1 on drift
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveClearanceBins, readMascotNumber } from './lib/mascot-clearance.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mascotSource = await readFile(path.join(ROOT, 'src/constants/mascot.js'), 'utf8');
const { bins, binDeg } = deriveClearanceBins({
  mascotSource,
  bodyPng: await readFile(path.join(ROOT, 'assets/mascot-body.png')),
  wingPng: await readFile(path.join(ROOT, 'assets/mascot-wing.png')),
});

if (!process.argv.includes('--check')) {
  console.log('export const MASCOT_CLEARANCE = [');
  for (let i = 0; i < bins.length; i += 6) console.log(`  ${bins.slice(i, i + 6).join(', ')},`);
  console.log('];');
  process.exit(0);
}

const shipped = readMascotNumber(mascotSource, 'MASCOT_CLEARANCE');
let bad = 0;
if (shipped.length !== bins.length) {
  console.error(`length: shipped ${shipped.length}, derived ${bins.length}`);
  bad += 1;
} else {
  shipped.forEach((v, i) => {
    if (Math.abs(v - bins[i]) > 1e-9) {
      console.error(`bin ${i} (${i * binDeg}deg): shipped ${v}, derived ${bins[i]}`);
      bad += 1;
    }
  });
}
if (bad) {
  console.error(`\nMASCOT_CLEARANCE has drifted from the assets in ${bad} place(s). The assets are the source; re-run without --check and paste.`);
  process.exit(1);
}
console.log(`MASCOT_CLEARANCE reproduces from the shipped assets: ${bins.length} bins of ${binDeg}deg, reach ${Math.min(...bins).toFixed(4)}..${Math.max(...bins).toFixed(4)} of the character width.`);
