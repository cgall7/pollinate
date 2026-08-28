// Gate for ENG-65 — the `honeyed` hexagon fill level (DES-24,
// `GUIDES/POLLINATE_V2_DES24_HONEYED_HEXAGON.md`).
//
//   npm run check:honey-fill
//
// WHAT IT ASSERTS, and against which live source:
//
//   1. The ceiling (`honeyHMax`) matches DES-24 §6.4's device-corrected
//      figure — 0.6096 * size, not the originally-published 0.639 (a
//      cap-height-vs-line-box error the doc's own §6.4 found and fixed).
//      Getting this wrong either lets honey reach the identity glyph or
//      quietly shrinks the ladder below what the design allows.
//   2. Every rung stays inside the region where the cell's boundary is the
//      two straight lower edges (h <= HEX_HEIGHT_RATIO * size) — the
//      precondition `hexHoneyPoints`'/`hexHoneyMeniscus`'s linear
//      half-width interpolation depends on. A future retune of the ceiling
//      that pushes past the side vertices would silently draw a region with
//      the wrong shape, not throw.
//   3. The honey body composites to the exact RGB DES-24 §6.4 row 1 measured
//      on device (255,188,127) — this is what makes `washYellow` and
//      `washSky` members read as one colour (R55's mechanism). A retune of
//      `accentDeep` or the 0.50 opacity that isn't reflected here silently
//      breaks that identity without any visual gate catching it.
//   4. The meniscus (`ink`, 1.5pt) clears WCAG 1.4.11's 3:1 non-text bar
//      against the honey body, matching §3's re-derived 10.437 for the
//      shipped body exactly. This gate does NOT assert `inkSoft` fails here
//      — §2's quoted 2.414 was measured against the body §3 later rejected
//      (§6.4's own citation-repair says so), and a static inkSoft line
//      against the shipped body actually clears 3:1 (~3.83). Build to spec
//      (`ink`) regardless; see check 5 for the ring's real, breathing-floor
//      reason `inkSoft` genuinely fails on a honeyed cell.
//   5. DES-24 §6.4 row 10 — the BloomRing's ink/inkSoft swap on a honeyed
//      cell — checked at the ring's own breathe floor (`BLOOM_FLOOR_OPACITY`,
//      imported live from `constants/bloomRing.js`, not re-typed here):
//      `ink` at the floor clears 3:1 over the honey body; `inkSoft` at the
//      same floor does not. This is the exact defect §6.4 found (three of
//      six edge marks sit inside the honey and `inkSoft` dips under the bar
//      for 2022ms of every 4800ms cycle) and the exact fix's contrast math.
//   6. Source-level: `HoneycombGrid.js` gates the honey renderer on
//      `member.isOwn` (§6.2/§6.4 row 4 — resolves the seeded+honeyed
//      collision by constraint AND keeps a descending initial like "Q" out
//      of the honey, since the own cell's glyph is always the fixed string
//      "You"). A gate silently dropped in a future edit is the one failure
//      mode none of the above numeric checks can see.
//   7. Source-level: the honey fill renders before `seeded` and before
//      `BloomRing` in `FilledCell`, and `BloomRing` receives a
//      `honeyGround=` naming BOTH accent-family grounds. §6.4's ruling is
//      contingent on this exact draw order — the ring drawn first is a
//      different, unmeasured picture. MB-D2b (2026-08-28) added the second
//      ground: a selected cell's held `accent` fill sits under all six
//      marks, where `inkSoft` floors at 2.8399:1. That one is reachable
//      today and `honeyed` still is not, so the row asserts the union.
//
// WHAT THIS GATE DOES NOT ASSERT: the mapping from a real drop balance to a
// rung (0-4). DES-24 §7 names that its own open item — it wants 19a's drop
// distribution, which does not exist in this repo yet. No production code
// path sets `member.honeyRung` today, and this gate does not invent one.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { honeyHMax, HONEY_RUNGS, hexHoneyPoints, hexHoneyMeniscus, HEX_HEIGHT_RATIO } from '../src/components/hexGeometry.js';
import { BLOOM_FLOOR_OPACITY } from '../src/constants/bloomRing.js';
import { theme } from '../src/constants/theme.js';
import { parseColor, over, contrastRatio } from './lib/color.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let pass = 0;
const failures = [];
const ok = (label) => {
  pass += 1;
  console.log(`  ok   ${label}`);
};
const bad = (label, detail) => {
  failures.push(`${label} — ${detail}`);
  console.log(`  FAIL ${label} — ${detail}`);
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// --- 1. Ceiling matches DES-24 §6.4's corrected figure -----------------
const SIZE = 44; // the comb's real cell circumradius, HoneycombGrid.js
const hmax = honeyHMax(SIZE);
if (near(hmax, 26.82, 0.01)) {
  ok(`honeyHMax(44) = ${hmax.toFixed(4)}pt, matches §6.4's corrected 26.82pt`);
} else {
  bad('honeyHMax ceiling', `got ${hmax.toFixed(4)}pt, expected 26.82pt (§6.4 correction)`);
}
const step = hmax / 4;
if (near(step, 6.70, 0.01)) {
  ok(`rung step = ${step.toFixed(4)}pt, matches §6.4's corrected 6.70pt`);
} else {
  bad('rung step', `got ${step.toFixed(4)}pt, expected 6.70pt`);
}

// --- 2. Every rung stays in the linear (two-straight-edges) region -----
const vertexSpan = HEX_HEIGHT_RATIO * SIZE; // 0.8660 * size — bottom edge to side vertices
if (hmax < vertexSpan) {
  ok(`ceiling (${hmax.toFixed(2)}pt) stays below the side-vertex span (${vertexSpan.toFixed(2)}pt) — no special case needed`);
} else {
  bad('rung region', `ceiling ${hmax.toFixed(2)}pt reaches or exceeds the side-vertex span ${vertexSpan.toFixed(2)}pt — hexHoneyPoints' linear half-width no longer holds at the top rungs`);
}
HONEY_RUNGS.forEach((r) => {
  const h = hmax * r;
  const pts = hexHoneyPoints(SIZE, h);
  const coords = pts.split(' ').map((p) => p.split(',').map(Number));
  if (coords.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))) {
    ok(`rung ${r} (h=${h.toFixed(2)}pt) produces a finite region`);
  } else {
    bad(`rung ${r} region`, `non-finite coordinates: ${pts}`);
  }
});

// --- 3. Honey body composite matches the device-measured RGB -----------
// Tolerance of 1/255 per channel: accentDeep@0.5 over white lands exactly on
// a .5 boundary in two channels (122*0.5+255*0.5=188.5, 0*0.5+255*0.5=127.5),
// and the device's own compositor (react-native-svg/Skia) resolved that
// ambiguous half-value differently than JS `Math.round` does — the device
// figure §6.4 row 1 measured is (255,188,127), i.e. the floor. What matters
// here is the two source values (accentDeep, 0.50), not which convention
// rounds an exact tie.
const surface = parseColor(theme.colors.surface);
const body = over({ ...parseColor(theme.colors.accentDeep), a: 0.5 }, surface);
const bodyExpected = { r: 255, g: 188, b: 127 };
if (near(body.r, bodyExpected.r, 1) && near(body.g, bodyExpected.g, 1) && near(body.b, bodyExpected.b, 1)) {
  ok(`honey body composites to (${body.r.toFixed(1)},${body.g.toFixed(1)},${body.b.toFixed(1)}) — matches §6.4 row 1's device-measured (255,188,127) within rounding`);
} else {
  bad('honey body colour', `composited to (${body.r.toFixed(1)},${body.g.toFixed(1)},${body.b.toFixed(1)}), expected ~(255,188,127) — accentDeep or the 0.50 opacity moved without this gate being updated`);
}

// --- 4. Meniscus contrast: ink clears 3:1 against the shipped body -----
// §2's own table quotes inkSoft failing at 2.414 — but §6.4's citation
// repair names that figure as measured against the body §3 REJECTED, not
// the one that ships. A static (non-breathing) inkSoft line against the
// shipped body actually clears 3:1 too (~3.83, matching §6.4 row 10's own
// "inkSoft peaks at 3.830 and passes" for the ring at full opacity) — the
// ring's real problem is its breathe FLOOR (2.609, check 5 below), which a
// static meniscus line has no equivalent of. So this gate does not assert
// "inkSoft fails" for the meniscus — that claim isn't true for the shipped
// body and asserting it would be testing a stale number, not a real
// invariant. It only pins ink's own figure to §3's re-derived 10.437,
// which the doc computed against the exact same final body this does.
const inkOnBody = contrastRatio(theme.colors.ink, body);
if (near(inkOnBody, 10.437, 0.02)) {
  ok(`ink meniscus vs honey body: ${inkOnBody.toFixed(3)}:1, matches §3's re-derived 10.437 for the shipped body`);
} else {
  bad('meniscus contrast (ink)', `${inkOnBody.toFixed(3)}:1, expected ~10.437 (§3) — ink, accentDeep, or the 0.50 opacity moved`);
}

// --- 5. BloomRing on a honeyed cell: ink clears the floor, inkSoft doesn't
const ringInkAtFloor = { ...parseColor(theme.colors.ink), a: BLOOM_FLOOR_OPACITY };
const ringInkSoftAtFloor = { ...parseColor(theme.colors.inkSoft), a: BLOOM_FLOOR_OPACITY };
// Contrast needs an opaque background; composite the translucent ring mark over the honey body itself.
const inkFloorOnHoney = contrastRatio(over(ringInkAtFloor, body), body);
const inkSoftFloorOnHoney = contrastRatio(over(ringInkSoftAtFloor, body), body);
if (inkFloorOnHoney >= 3.0) {
  ok(`BloomRing ink at floor opacity (${BLOOM_FLOOR_OPACITY}) vs honey body: ${inkFloorOnHoney.toFixed(3)}:1, clears 3:1 — §6.4 row 10's fix`);
} else {
  bad('BloomRing honeyed floor (ink)', `${inkFloorOnHoney.toFixed(3)}:1 fails 3:1 — the honeyed-cell ink swap no longer clears the bar at the ring's breathe floor`);
}
if (inkSoftFloorOnHoney < 3.0) {
  ok(`BloomRing inkSoft at floor opacity vs honey body: ${inkSoftFloorOnHoney.toFixed(3)}:1, correctly fails 3:1 — reproduces §6.4 row 10's original defect`);
} else {
  bad('BloomRing honeyed floor (inkSoft)', `${inkSoftFloorOnHoney.toFixed(3)}:1 unexpectedly clears 3:1 — §6.4 row 10's ink-vs-inkSoft reasoning may no longer hold`);
}

// --- 6 & 7. Source-level: the isOwn gate and the draw order ------------
const gridSrc = await readFile(path.join(ROOT, 'src/components/HoneycombGrid.js'), 'utf8');

const gateMatch = /const honeyed = Boolean\(member\.isOwn && member\.honeyRung\)/.exec(gridSrc);
if (gateMatch) {
  ok('honey renderer gates on member.isOwn (§6.2/§6.4 row 4)');
} else {
  bad('isOwn gate', 'HoneycombGrid.js no longer computes `honeyed` as `Boolean(member.isOwn && member.honeyRung)` — the own-cell gate may have been weakened or removed');
}

const honeyIdx = gridSrc.indexOf('<HoneyFill');
const seededIdx = gridSrc.indexOf('member.seeded &&');
const bloomRingIdx = gridSrc.indexOf('<BloomRing');
// The prop was `honeyed={honeyed}` until MB-D2b (2026-08-28) gave the same
// ink/inkSoft defect a second ground: a cell holding the selection's opaque
// `accent` fill puts that fill under all six marks, where `inkSoft` at the
// ring's breathe floor measures 2.8399:1 — the same bar, the same mechanism,
// and unlike `honeyed` it is reachable today.
//
// The row does NOT pin the second flag's NAME. What it asserts is the
// invariant: **whatever condition draws an accent-family body under the ring
// must also appear in the ring's ground condition.** So it reads the flag
// `<SelectionFill>` actually renders under, out of the same file, and
// requires it. Pinning the literal `selected` would have gone red on the
// correct build the moment the fill moved onto its own `held` flag for the
// release beat — a gate reporting a defect that is really a rename.
const bloomRingPropMatch = /<BloomRing[^>]*honeyGround=\{([^}]*)\}/.exec(gridSrc);
const bloomRingGroundInputs = bloomRingPropMatch
  ? bloomRingPropMatch[1].split('||').map((t) => t.trim())
  : [];
const selectionFillFlag = /\{(\w+) && <SelectionFill/.exec(gridSrc)?.[1] ?? null;

if (honeyIdx > -1 && seededIdx > -1 && honeyIdx < seededIdx) {
  ok('honey fill renders before the seeded seal in FilledCell');
} else {
  bad('draw order (honey before seeded)', `honey at index ${honeyIdx}, seeded at index ${seededIdx} — expected honey first`);
}
if (honeyIdx > -1 && bloomRingIdx > -1 && honeyIdx < bloomRingIdx) {
  ok('honey fill renders before BloomRing in FilledCell (§6.4: the ring is measured drawn OVER the honey)');
} else {
  bad('draw order (honey before BloomRing)', `honey at index ${honeyIdx}, BloomRing at index ${bloomRingIdx} — expected honey first`);
}
if (!selectionFillFlag) {
  bad('BloomRing honeyGround prop', 'could not find the flag <SelectionFill> renders under in FilledCell — the ring-ground invariant cannot be checked, which is not the same as it holding');
} else if (bloomRingGroundInputs.includes('honeyed') && bloomRingGroundInputs.includes(selectionFillFlag)) {
  ok(`BloomRing receives honeyGround={${bloomRingGroundInputs.join(' || ')}} — both accent-family grounds are in the condition: §6.4 row 10's honey, and the flag <SelectionFill> itself renders under (\`${selectionFillFlag}\`)`);
} else if (bloomRingPropMatch) {
  bad('BloomRing honeyGround prop', `FilledCell passes honeyGround={${bloomRingGroundInputs.join(' || ')}} — expected \`honeyed\` (§6.4 row 10) and \`${selectionFillFlag}\`, the flag that draws the selection fill under the same marks (2.8399:1 at the ring's floor)`);
} else {
  bad('BloomRing honeyGround prop', 'FilledCell no longer passes honeyGround={...} to <BloomRing> — the §6.4 row 10 fix may be disconnected');
}

// The second ground's own contrast pair, measured here rather than quoted
// from MB-D2b's message — same instrument as check 5, different ground.
const selectionBody = theme.colors.accent;
const inkFloorOnSelection = contrastRatio(over(ringInkAtFloor, selectionBody), selectionBody);
const inkSoftFloorOnSelection = contrastRatio(over(ringInkSoftAtFloor, selectionBody), selectionBody);
if (inkFloorOnSelection >= 3.0 && inkSoftFloorOnSelection < 3.0) {
  ok(`BloomRing over the held selection fill: ink ${inkFloorOnSelection.toFixed(4)}:1 clears 3:1, inkSoft ${inkSoftFloorOnSelection.toFixed(4)}:1 does not — the same swap, on the ground MB-D2b added`);
} else {
  bad('BloomRing selection floor', `ink ${inkFloorOnSelection.toFixed(4)}:1 / inkSoft ${inkSoftFloorOnSelection.toFixed(4)}:1 over \`accent\` — expected ink to clear 3:1 and inkSoft to fail it; if inkSoft now clears, the \`selected\` half of the honeyGround condition should be re-ruled, not silently kept`);
}

console.log(`\ncheck-honey-fill: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
