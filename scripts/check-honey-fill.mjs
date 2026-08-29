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
//   8. R-N2 (POLLINATE_NECTAR_LIVING_EXCHANGE §3/§6) — the ladder is
//      CONTINUOUS and its floor is derived. Section 8 asserts the mapping
//      (`honeyLevelForDrops`), the rendered floor (`honeyHeightForLevel`,
//      derived from the meniscus stroke the renderer actually draws), and
//      §6 acceptance row 1: every preset, sent AND received, moves the
//      rendered height in points from the starter grant.
//   9. R-N2's load-bearing clause and §6 acceptance row 2 — THE MENISCUS IS
//      NEVER RENDERED AT ITS NEW HEIGHT. Source-level and structural: the
//      rendered height must be the animated state, the tween must exist and
//      be monotone, and the only direct set must sit under the Reduce Motion
//      branch. Setting the height directly reds this section.
//
// WHAT THIS GATE DOES NOT ASSERT: that the smallest preset is PERCEPTIBLE.
// Row 8c measures every preset's rendered displacement and prints the
// physical-pixel figures at @2x and @3x; it asserts only that the movement
// is non-zero, because at the shipped cap a 10-drop gift is 0.402 physical
// px @3x and no legal cap fixes that (the arithmetic, and why it is routed
// to Lumen rather than patched, is beside `honeyLevelForDrops`). A row that
// asserted perceptibility would be asserting a device result from a
// spreadsheet.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import {
  honeyHMax,
  HONEY_MENISCUS_STROKE,
  HONEY_MIN_HEIGHT,
  honeyHeightForLevel,
  hexHoneyPoints,
  hexHoneyMeniscus,
  HEX_HEIGHT_RATIO,
} from '../src/components/hexGeometry.js';
import {
  NECTAR_LADDER_CAP_DROPS,
  NECTAR_PRESETS,
  NECTAR_STARTER_GRANT_DROPS,
  honeyLevelForDrops,
} from '../src/constants/nectar.js';
import { parse } from '@babel/parser';
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
// The old ladder's step, kept as a REFERENCE POINT rather than as a rung:
// R-N2 retired the four rungs, but 6.70pt is still the height the starter
// grant renders at (500/2000 of the ceiling), so §6.4's corrected figure is
// still checkable against something the screen actually draws.
const grantHeight = honeyHeightForLevel(SIZE, honeyLevelForDrops(NECTAR_STARTER_GRANT_DROPS));
if (near(grantHeight, 6.70, 0.01)) {
  ok(`starter grant renders at ${grantHeight.toFixed(4)}pt, matching §6.4's corrected quarter-ceiling 6.70pt`);
} else {
  bad('grant height', `got ${grantHeight.toFixed(4)}pt, expected 6.70pt`);
}

// --- 2. Every rung stays in the linear (two-straight-edges) region -----
const vertexSpan = HEX_HEIGHT_RATIO * SIZE; // 0.8660 * size — bottom edge to side vertices
if (hmax < vertexSpan) {
  ok(`ceiling (${hmax.toFixed(2)}pt) stays below the side-vertex span (${vertexSpan.toFixed(2)}pt) — no special case needed`);
} else {
  bad('rung region', `ceiling ${hmax.toFixed(2)}pt reaches or exceeds the side-vertex span ${vertexSpan.toFixed(2)}pt — hexHoneyPoints' linear half-width no longer holds at the top rungs`);
}
// R-N2: the domain is now CONTINUOUS, so a four-member sweep is no longer a
// sweep of it. 201 samples across [0,1] plus the floor — the check is the
// same one (a finite trapezoid at every reachable height) against a domain
// that actually is the reachable one.
const LEVEL_SAMPLES = Array.from({ length: 201 }, (_, i) => i / 200);
const badLevels = LEVEL_SAMPLES.filter((r) => {
  const pts = hexHoneyPoints(SIZE, honeyHeightForLevel(SIZE, r));
  return !pts
    .split(' ')
    .map((pt) => pt.split(',').map(Number))
    .every(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
});
if (badLevels.length === 0) {
  ok(`all ${LEVEL_SAMPLES.length} sampled levels across [0,1] produce a finite region`);
} else {
  bad('level region', `non-finite coordinates at levels ${badLevels.slice(0, 5).join(', ')}`);
}

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

// R-N2: the level replaced the rung index, so the pinned expression moved.
// Pinned by SHAPE rather than by the exact literal — `isOwn` conjoined with
// a positive level — so a rename of the level prop reads as a rename and not
// as a removed gate, while dropping `isOwn` still reds.
const gateMatch = /const honeyed = Boolean\(member\.isOwn && member\.honey\w*\s*>\s*0\)/.exec(gridSrc);
if (gateMatch) {
  ok('honey renderer gates on member.isOwn (§6.2/§6.4 row 4)');
} else {
  bad('isOwn gate', 'HoneycombGrid.js no longer computes `honeyed` as `Boolean(member.isOwn && member.honey<level> > 0)` — the own-cell gate may have been weakened or removed');
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

// --- 8. R-N2: the continuous ladder, its floor, and its resolution -----
//
// 8a. THE MAPPING. Zero is the only dark case; the level is monotone
// non-decreasing in drops and saturates at 1 rather than exceeding it.
{
  const zeroCases = [0, -1, -1000, NaN, null, undefined, 'x'];
  const zeroWrong = zeroCases.filter((d) => honeyLevelForDrops(d) !== 0);
  if (zeroWrong.length === 0) {
    ok('honeyLevelForDrops: every non-positive / unreadable balance is level 0 (§23.1 — a failed read is not an empty wallet, and both render dark)');
  } else {
    bad('level zero cases', `non-zero level for ${zeroWrong.map(String).join(', ')}`);
  }

  const sweep = Array.from({ length: 400 }, (_, i) => i * 12 + 1);
  const nonMonotone = sweep.filter((d, i) => i > 0 && honeyLevelForDrops(d) < honeyLevelForDrops(sweep[i - 1]));
  const overCap = sweep.filter((d) => honeyLevelForDrops(d) > 1);
  if (nonMonotone.length === 0 && overCap.length === 0) {
    ok(`honeyLevelForDrops is monotone non-decreasing and clamps at 1 across 1..${sweep[sweep.length - 1]} drops`);
  } else {
    bad('level monotonicity', `${nonMonotone.length} non-monotone step(s), ${overCap.length} sample(s) above 1`);
  }
}

// 8b. THE FLOOR IS DERIVED, AND THE DERIVATION IS COUPLED IN BOTH
// DIRECTIONS. `HONEY_MIN_HEIGHT` is the meniscus stroke width, because below
// that the honey region is entirely inside the line that bounds it. Two
// things can break that independently: the constant could be edited away
// from the stroke, or the RENDERER could stop drawing the meniscus at
// `HONEY_MENISCUS_STROKE` and pin a literal. Both are checked — a coupling
// asserted in one direction only is half a coupling.
{
  if (HONEY_MIN_HEIGHT === HONEY_MENISCUS_STROKE) {
    ok(`floor ${HONEY_MIN_HEIGHT}pt equals the meniscus stroke ${HONEY_MENISCUS_STROKE}pt — a region shorter than its own boundary is a rule, not a vessel`);
  } else {
    bad('floor derivation', `HONEY_MIN_HEIGHT ${HONEY_MIN_HEIGHT} != HONEY_MENISCUS_STROKE ${HONEY_MENISCUS_STROKE}`);
  }

  const tiny = [1, 2, 5, 9];
  const dark = tiny.filter((d) => honeyHeightForLevel(SIZE, honeyLevelForDrops(d)) < HONEY_MIN_HEIGHT);
  if (honeyHeightForLevel(SIZE, 0) === 0 && dark.length === 0) {
    ok(`DES-24's anti-cliff rule survives R-N2: level 0 renders nothing, and balances ${tiny.join('/')} all render at least the ${HONEY_MIN_HEIGHT}pt floor`);
  } else {
    bad('anti-cliff floor', `level 0 renders ${honeyHeightForLevel(SIZE, 0)}pt; sub-floor balances: ${dark.join(', ')}`);
  }
}

// 8c. §6 ACCEPTANCE ROW 1 — resolution, asserted on the RENDERED HEIGHT IN
// POINTS and never on a level or an index, because an index is exactly what
// hid the defect. Every preset, in BOTH directions, from the starter grant.
//
// This row ASSERTS non-zero movement and REPORTS perceptibility. It does not
// assert perceptibility: at the shipped cap the 10-drop preset moves 0.402
// physical px @3x, which is rendered (antialiased) but is not something a
// spreadsheet can call visible. See this file's header and the open note
// beside `honeyLevelForDrops`.
{
  const heightAt = (drops) => honeyHeightForLevel(SIZE, honeyLevelForDrops(drops));
  const base = heightAt(NECTAR_STARTER_GRANT_DROPS);
  const flat = [];
  const report = [];
  NECTAR_PRESETS.forEach((amount) => {
    const up = heightAt(NECTAR_STARTER_GRANT_DROPS + amount) - base;
    const down = base - heightAt(NECTAR_STARTER_GRANT_DROPS - amount);
    if (up <= 0) flat.push(`+${amount}`);
    if (down <= 0) flat.push(`-${amount}`);
    report.push(`${amount}: ${up.toFixed(4)}pt (${(up * 3).toFixed(3)}px @3x, ${(up * 2).toFixed(3)}px @2x)`);
  });
  if (flat.length === 0) {
    ok(`every preset moves the rendered meniscus from the grant, both directions — ${report.join('; ')}`);
  } else {
    bad('preset resolution', `these presets produce NO rendered movement from the ${NECTAR_STARTER_GRANT_DROPS}-drop grant: ${flat.join(', ')} — this is D1's defect, which is what R-N2 exists to remove`);
  }

  // The residue, printed on every green run so it cannot be quoted as clean.
  // Same shape as check-text-pigment's owed list: a number with an owner.
  const subPixel = NECTAR_PRESETS.filter(
    (a) => (heightAt(NECTAR_STARTER_GRANT_DROPS + a) - base) * 3 < 1
  );
  if (subPixel.length) {
    console.log(
      `  note R-N2 residue: preset(s) ${subPixel.join('/')} move under one physical pixel at @3x from the grant ` +
        `(cap ${NECTAR_LADDER_CAP_DROPS}). No legal cap fixes it — 10 drops needs cap <= 804 for 1px @3x, at which ` +
        `the grant already renders at 62% of the vessel. OWNER: Lumen (the cap is a placeholder whose premise moved; ` +
        `see the open note in src/constants/nectar.js). The event's legibility is R-N3's drop and R-N4's bee, not this edge.`
    );
  }
}

// --- 9. R-N2 / §6 acceptance row 2 — never rendered at its new height --
//
// STRUCTURAL, not lexical. The failure this guards is a one-line
// regression — someone replaces the animated state with the target and the
// picture is "correct" in every still frame while the information the beat
// carries is gone. So the row reconstructs `HoneyFill` from the AST and
// asserts three things that a direct set breaks:
//
//   (a) the height the GEOMETRY is built from is the animated state, not the
//       computed target;
//   (b) a tween exists, runs `NECTAR.settle`, and is monotone (an easing
//       from `HONEY_EASING`, never a spring — a spring on a QUANTITY renders
//       a level nobody holds);
//   (c) every direct set of the height sits under the `reduced` branch. §5
//       requires exactly one such path and R-N2 forbids any other.
{
  const gridSource = await readFile(path.join(ROOT, 'src/components/HoneycombGrid.js'), 'utf8');
  const ast = parse(gridSource, { sourceType: 'module', plugins: ['jsx', 'typescript'] });

  // Find HoneyFill by DECLARATION, never by a name+position lookup into the
  // text — a nested lookalike is what makes that fall through.
  let honeyFillNode = null;
  for (const node of ast.program.body) {
    if (node.type !== 'VariableDeclaration') continue;
    for (const d of node.declarations) {
      if (d.id.type === 'Identifier' && d.id.name === 'HoneyFill') honeyFillNode = d.init;
    }
  }
  if (!honeyFillNode) {
    bad('HoneyFill declaration', 'no top-level `const HoneyFill = …` in HoneycombGrid.js — R-N2 row 2 cannot be checked, which is not the same as it holding');
  } else {
    const body = gridSource.slice(honeyFillNode.start, honeyFillNode.end);

    // (a) the geometry reads the animated state.
    const geomArgs = [...body.matchAll(/hexHoney(?:Points|Meniscus)\(\s*size\s*,\s*([A-Za-z_$][\w$]*)\s*\)/g)].map((m) => m[1]);
    const setterFor = (name) => new RegExp(`useState\\(\\s*[^)]*\\)[\\s\\S]{0,40}`).test(body) && new RegExp(`const\\s*\\[\\s*${name}\\s*,`).test(body);
    if (geomArgs.length === 2 && geomArgs.every((a) => a === geomArgs[0]) && setterFor(geomArgs[0])) {
      ok(`HoneyFill builds both the region and the meniscus from \`${geomArgs[0]}\`, which is component state — the rendered height is the animated one, not the target`);
    } else {
      bad('rendered height source', `hexHoney*() is called with [${geomArgs.join(', ')}] — expected one identifier, used by both, declared by useState. Building the geometry from the computed target IS the snap this row exists to catch`);
    }

    // (b) the tween, its clock, and its monotonicity.
    const hasTiming = /Animated\.timing\(\s*anim\s*,/.test(body);
    const usesSettle = /duration:\s*NECTAR\.settle/.test(body);
    const usesSpring = /Animated\.spring\(/.test(body);
    const monotoneEasing = /easing:\s*HONEY_EASING\.\w+/.test(body);
    if (hasTiming && usesSettle && !usesSpring && monotoneEasing) {
      ok('HoneyFill tweens with Animated.timing over NECTAR.settle under a HONEY_EASING curve — one clock shared with the balance count, and no spring on a quantity');
    } else {
      bad(
        'meniscus tween',
        `timing=${hasTiming} settle=${usesSettle} spring=${usesSpring} easing=${monotoneEasing} — R-N2 requires a monotone tween on the shared settle clock; a spring would render a level the balance never held`
      );
    }

    // (c) the only direct set is the Reduce Motion branch. Counted by
    // BRACE-MATCHED region, not by a lookalike-delimited regex.
    // EVERY direct write of the height, not just the animated value's:
    // `setH(target)` next to `anim.setValue(target)` is the same defect, and
    // a rule that named only one of them would go green on the other. The
    // listener's own `setH(value)` is excluded by argument, which is what
    // makes this a check on WHO SETS IT rather than on how many calls exist.
    const directSets = [...body.matchAll(/(?:anim\.setValue|setH)\(\s*([A-Za-z_$][\w$]*)\s*\)/g)]
      .filter((m) => m[1] !== 'value')
      .map((m) => m.index);
    const rmIdx = body.indexOf('if (reduced) {');
    let rmEnd = -1;
    if (rmIdx > -1) {
      let depth = 0;
      for (let i = body.indexOf('{', rmIdx); i < body.length; i += 1) {
        if (body[i] === '{') depth += 1;
        else if (body[i] === '}') {
          depth -= 1;
          if (depth === 0) { rmEnd = i; break; }
        }
      }
    }
    const outside = directSets.filter((i) => !(rmIdx > -1 && i > rmIdx && i < rmEnd));
    if (directSets.length > 0 && rmEnd > -1 && outside.length === 0) {
      ok(`HoneyFill's ${directSets.length} direct height set(s) all sit inside the \`reduced\` branch — §5's one no-tween path, and the only one`);
    } else {
      bad(
        'direct height set',
        `${directSets.length} direct set(s), ${outside.length} outside the reduced branch (branch found: ${rmEnd > -1}) — every other path must animate from the previous height`
      );
    }
  }
}

console.log(`\ncheck-honey-fill: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
