// Gate for ENG-65 — the `honeyed` hexagon fill level (DES-24,
// `POLLINATE_V2_DES24_HONEYED_HEXAGON.md`, design workspace).
//
// Every spec cited in this file lives in the design workspace, not at
// any path in this repo; nothing under `GUIDES/` is in this tree, so a
// bare `GUIDES/...` address opens nothing for whoever reads this file
// next.
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
//   5. R-CL-2 RETIRED DES-24 §6.4 ROW 10 AND THIS IS ITS SUCCESSOR. Row 10
//      was the BloomRing's ink/inkSoft swap on a honeyed cell: three of the
//      six edge marks sat inside the honey body, and `inkSoft` at the ring's
//      breathe floor dipped under the 3:1 non-text bar for 2022ms of every
//      4800ms cycle, so the mark colour swapped to `ink` on that ground. The
//      ring retired, and with it every ink mark drawn on this cell — there is
//      nothing left on the honey to measure a swap for, so the row has no
//      successor in its own terms and is not resurrected.
//      What replaces it is the question the light actually raises: the light
//      is drawn OVER the honey body, so the meniscus and the body are both
//      seen through it, and the row asserts the meniscus survives that. It is
//      the same instrument (a contrast pair on this cell's honey) pointed at
//      the layer that is really there now.
//   6. Source-level: `HoneycombGrid.js` gates the honey renderer on
//      `member.isOwn` (§6.2/§6.4 row 4 — resolves the seeded+honeyed
//      collision by constraint AND keeps a descending initial like "Q" out
//      of the honey, since the own cell's glyph is always the fixed string
//      "You"). A gate silently dropped in a future edit is the one failure
//      mode none of the above numeric checks can see.
//   7. Source-level: the honey fill renders before `seeded` and before
//      `BloomLight` in `FilledCell`, and `BloomLight` takes NO ground prop. §6.4's ruling is
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
import { BLOOM_FLOOR_OPACITY, BLOOM_LIGHT_ALPHA } from '../src/constants/bloomLight.js';
import { theme } from '../src/constants/theme.js';
import { parseColor, over, contrastRatio, deltaE00 } from './lib/color.mjs';

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
// THE DAY-ONE ROW — R-N8's ruling, asserted on the one thing it is about:
// the vessel a user sees on the day they consent.
//
// This row used to read "the grant renders at 6.70pt, §6.4's corrected
// quarter-ceiling". That literal was the LINEAR law's answer wearing the
// ceiling's name, and it would have gone red on R-N8 while saying nothing
// about what R-N8 changed. The expectation is now DERIVED from the ceiling
// (`hmax / 2`) rather than typed, so re-ratifying the grant, the cap or the
// cell size re-derives it instead of quietly breaking it — and the row still
// does the old one's job, because a height checked against half the ceiling
// is a check on the ceiling too.
//
// WHAT IT ASSERTS IS THE RULING AND NOT ITS ARITHMETIC. R-N8's claim is that
// the starter grant fills exactly half the vessel; that it does so because
// sqrt(g / 4g) = 1/2 is the reason, not the property. Restore the linear body
// of `honeyLevelForDrops` and this row reds at 6.7045pt against 13.4090pt,
// which is the mutate-back the ruling names.
const grantHeight = honeyHeightForLevel(SIZE, honeyLevelForDrops(NECTAR_STARTER_GRANT_DROPS));
if (near(grantHeight, hmax / 2, 0.0001)) {
  ok(
    `R-N8 day one: the ${NECTAR_STARTER_GRANT_DROPS}-drop starter grant renders at ${grantHeight.toFixed(4)}pt, ` +
      `exactly half the ${hmax.toFixed(4)}pt ceiling — the vessel every new user starts at`
  );
} else {
  bad(
    'day-one half vessel',
    `the starter grant renders at ${grantHeight.toFixed(4)}pt, expected half the ceiling (${(hmax / 2).toFixed(4)}pt). ` +
      `R-N8 holds that sqrt(grant / cap) = 1/2 by construction at cap = 4 x grant; this reds if the law, the cap's ` +
      `multiplier or the grant moves without the others`
  );
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

// --- 5. The blooming light over the honey body (R-CL-2's successor to §6.4
// row 10). The light is one polygon over the whole cell, so a lit honeyed
// cell shows its meniscus and its body BOTH through `accentBurst` at
// BLOOM_LIGHT_ALPHA. Measured at the breathe's floor as well as its peak,
// because the floor is where a contrast pair is weakest and the floor is a
// state the cell rests in for real time, not a transient.
const litOver = (colour, alpha) => over({ ...parseColor(theme.colors.accentBurst), a: alpha }, colour);
const litBodyPeak = litOver(body, BLOOM_LIGHT_ALPHA);
const litBodyFloor = litOver(body, BLOOM_LIGHT_ALPHA * BLOOM_FLOOR_OPACITY);
const litMeniscusPeak = litOver(parseColor(theme.colors.ink), BLOOM_LIGHT_ALPHA);
const litMeniscusFloor = litOver(parseColor(theme.colors.ink), BLOOM_LIGHT_ALPHA * BLOOM_FLOOR_OPACITY);
const litPeakRatio = contrastRatio(litMeniscusPeak, litBodyPeak);
const litFloorRatio = contrastRatio(litMeniscusFloor, litBodyFloor);
if (litPeakRatio >= 3.0 && litFloorRatio >= 3.0) {
  ok(`ink meniscus through the blooming light: ${litPeakRatio.toFixed(3)}:1 at the light's peak and ${litFloorRatio.toFixed(3)}:1 at its floor, both clear 3:1 — a lit honeyed cell still shows the level it holds`);
} else {
  bad('meniscus under the blooming light', `${litPeakRatio.toFixed(3)}:1 at peak / ${litFloorRatio.toFixed(3)}:1 at floor — the light is washing out the honey's own surface line, which is the level itself`);
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
const bloomLightIdx = gridSrc.indexOf('<BloomLight');
const selectionFillFlag = /\{(\w+) && <SelectionFill/.exec(gridSrc)?.[1] ?? null;

if (honeyIdx > -1 && seededIdx > -1 && honeyIdx < seededIdx) {
  ok('honey fill renders before the seeded seal in FilledCell');
} else {
  bad('draw order (honey before seeded)', `honey at index ${honeyIdx}, seeded at index ${seededIdx} — expected honey first`);
}
if (honeyIdx > -1 && bloomLightIdx > -1 && honeyIdx < bloomLightIdx) {
  ok('honey fill renders before BloomLight in FilledCell — check 5 measures the meniscus seen THROUGH the light, and the other order is a different, unmeasured picture');
} else {
  bad('draw order (honey before BloomLight)', `honey at index ${honeyIdx}, BloomLight at index ${bloomLightIdx} — expected honey first`);
}

// R-CL-2 RETIRED THE `honeyGround` PROP AND THIS ROW IS WHAT REPLACED IT.
// The ring took a ground condition because ink marks had to swap strength
// over an accent-family body — `honeyed` for §6.4 row 10's honey, and
// (MB-D2b) the flag `<SelectionFill>` renders under, since a selected cell
// puts an opaque `accent` fill under all six marks at 2.8399:1. Neither case
// exists for a warm wash over a warm ground: the light is one uniform
// polygon and every body beneath it is warmed by the same amount.
//
// So the invariant inverts, and it is asserted rather than dropped: the light
// takes NO ground prop. A future edit that reintroduces one is reintroducing a
// per-ground register on this cell, which is a design change that needs its own
// measurement — this row makes it stop here rather than ship quietly.
const bloomLightPropMatch = /<BloomLight([^>]*)\/>/.exec(gridSrc);
const bloomLightProps = bloomLightPropMatch
  ? [...bloomLightPropMatch[1].matchAll(/(\w+)=/g)].map((m) => m[1]).sort()
  : null;
if (!selectionFillFlag) {
  bad('BloomLight props', 'could not find the flag <SelectionFill> renders under in FilledCell — the selection body this cell can hold is no longer identifiable, which is not the same as it being absent');
} else if (bloomLightProps && bloomLightProps.join(',') === 'reduced,size') {
  ok(`BloomLight receives exactly {${bloomLightProps.join(', ')}} — no ground condition, which is R-CL-2's own claim: one uniform light over whatever the cell is holding (its honey, or the \`${selectionFillFlag}\` selection fill)`);
} else if (bloomLightPropMatch) {
  bad('BloomLight props', `<BloomLight> takes {${bloomLightProps.join(', ')}} — expected exactly {reduced, size}. A ground prop here means the light has a per-ground register again, and §6.4 row 10's kind of measurement has to come back with it`);
} else {
  bad('BloomLight props', 'FilledCell no longer renders <BloomLight ... /> — the blooming state may have lost its renderer entirely');
}

// R-CL-2's successor to MB-D2b's second-ground row. MB-D2b measured the ring's
// marks over the held selection fill (`ink` 6.0937:1 clears, `inkSoft`
// 2.8399:1 does not) because a selected cell put an opaque `accent` body under
// all six marks. There are no marks now, so that pair has nothing to measure.
//
// The collision the light creates in its place is a DIFFERENT one and it is
// the one worth a row: selection and blooming are now both fills. A selected
// cell is `accent` under the light; a blooming unselected cell is `washYellow`
// under the same light. If those two converged, a tap would stop reading as a
// tap on any cell that happened to be lit.
//
// The blooming ground is READ OUT OF THE FILE, not named here. A row that
// measures two tokens it chose itself would stay green through an edit that
// pointed the swap at `accent` — it would be measuring a pair nobody paints.
const bloomGroundToken = /fill=\{member\.blooming \? theme\.colors\.(\w+) : tint\}/.exec(gridSrc)?.[1] ?? null;
if (!bloomGroundToken) {
  bad('blooming ground', 'FilledCell no longer swaps the identity tint on `member.blooming` — the lit ground cannot be read, which is not the same as it being correct');
}
const selectionBody = theme.colors.accent;
const litSelected = litOver(parseColor(selectionBody), BLOOM_LIGHT_ALPHA);
const litBlooming = litOver(parseColor(theme.colors[bloomGroundToken] ?? selectionBody), BLOOM_LIGHT_ALPHA);
//
// The bar is RELATIVE, not an invented absolute: the light's cost is measured
// against the same pair unlit, in the same run, so a retune of `accent` or
// `washYellow` moves the reference too. Shipped today at ΔE00 13.86 lit
// against 19.25 unlit — the light costs 28% of selection's separation and
// keeps 72% of it, which is still four times the threshold at which two
// non-adjacent fields read as different colours at all.
const selectionVsBloom = deltaE00(litSelected, litBlooming);
const selectionVsBloomUnlit = deltaE00(parseColor(selectionBody), parseColor(theme.colors[bloomGroundToken] ?? selectionBody));
const retained = selectionVsBloom / selectionVsBloomUnlit;
if (selectionVsBloom >= 10 && retained >= 0.65) {
  ok(`selected vs blooming (\`${bloomGroundToken}\`), both seen under the light: ΔE00 ${selectionVsBloom.toFixed(2)}, ${(retained * 100).toFixed(1)}% of the same pair's ${selectionVsBloomUnlit.toFixed(2)} unlit — the light costs selection some separation and nowhere near enough to blur it`);
} else {
  bad('selection vs blooming fill', `ΔE00 ${selectionVsBloom.toFixed(2)} lit vs ${selectionVsBloomUnlit.toFixed(2)} unlit (${(retained * 100).toFixed(1)}% retained) — R-CL-2 put both states in the fill channel and they are converging; selection is the one that must win`);
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
// assert perceptibility: under R-N8 the 10-drop preset moves 0.400 physical
// px @3x from the grant, which is rendered (antialiased) but is not something
// a spreadsheet can call visible. See this file's header and the ruling
// record beside `honeyLevelForDrops`.
//
// AND ITS SCOPE IS THE GRANT, WHICH IS ONE POINT OF A DOMAIN. §6 acceptance
// row 1 says "every preset" and names no starting balance; this row probes a
// single one. That was an honest gap while it was the only probe available,
// and it hid a real defect for as long as it stood alone: under the linear
// law there were 11 starting balances at which receiving the LARGEST preset
// moved the rendered vessel by nothing at all, none of them anywhere near
// the grant. Row 8d below is the universal, and this row is kept because it
// is the one that carries the printed per-preset figures.
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
      `  note R-N2 residue, SURVIVING R-N8: preset(s) ${subPixel.join('/')} move under one physical pixel at @3x ` +
        `from the grant (cap ${NECTAR_LADDER_CAP_DROPS}, square-root law). R-N8 did not close this and does not claim ` +
        `to: the curve is TANGENT to the linear law at the grant (the derivative of sqrt(x/c) at x = c/4 is exactly ` +
        `1/c), so resolution is unchanged at precisely the point this residue is measured from — 0.400px @3x where it ` +
        `was 0.402. What R-N8 did close is the collapse NEAR EMPTY, which was the wider defect and is row 8d. ` +
        `OWNER: Lumen. The event's legibility is R-N3's drop and R-N4's bee, not this edge.`
    );
  }
}

// 8d. §6 ACCEPTANCE ROW 1, READ AS THE UNIVERSAL IT IS WRITTEN AS. R-N8.
//
// Row 8c probes ONE starting balance. The acceptance row it cites quantifies
// over none: "every preset, sent and received, moves the rendered height".
// This row asks it at every integer balance the vessel can hold, in both
// directions, and it exists because the single-probe version was green
// through a real defect for as long as it was the only probe.
//
// WHAT WAS HIDING, and it was the rendered FLOOR rather than the law: any
// balance whose unclamped height falls under `HONEY_MIN_HEIGHT` renders at
// the floor, so a band of balances near empty all draw the same vessel.
// Under the linear law that band was 1..111 drops, WIDER THAN THE LARGEST
// PRESET, which is what made "receiving 100 drops changes nothing" reachable
// at 11 distinct starting balances. Under R-N8 the band is 1..6, narrower
// than the smallest preset, and the count of dead starting balances is zero
// for all three presets in both directions.
//
// The floor is not the defect and this row does not argue against it. Zero
// stays the only dark case (row 8b). The floor was CONCEALING the linear
// law's resolution collapse near empty by rendering a legal minimum where
// the arithmetic had run out, which is why a row scoped to the grant could
// not see it and why this one is not scoped at all.
//
// THIS ROW ASSERTS MOVEMENT, NOT PERCEPTIBILITY, exactly as 8c does — it
// reports the worst case in physical pixels and asserts only that it is
// non-zero. A row that asserted perceptibility would be asserting a device
// result from a spreadsheet.
{
  const heightAt = (drops) => honeyHeightForLevel(SIZE, honeyLevelForDrops(drops));
  const dead = [];
  const worst = [];
  // ONE SWEEP COVERS BOTH DIRECTIONS, and that is a property of the universal
  // rather than a shortcut. Receiving `amount` from balance d compares
  // (d, d + amount); sending it from balance d compares (d - amount, d).
  // Quantified over EVERY starting balance those are the same set of pairs,
  // so a second loop would be the same measurement printed twice — which is
  // worse than one, because a duplicated expression reads as corroboration.
  // Row 8c is scoped to a single balance and therefore genuinely does need
  // both directions.
  NECTAR_PRESETS.forEach((amount) => {
    let deadPairs = 0;
    let minMove = Infinity;
    let minAt = null;
    for (let d = 0; d + amount <= NECTAR_LADDER_CAP_DROPS; d += 1) {
      const move = heightAt(d + amount) - heightAt(d);
      if (move <= 0) deadPairs += 1;
      if (move < minMove) {
        minMove = move;
        minAt = d;
      }
    }
    if (deadPairs) dead.push(`${amount} (${deadPairs} balances)`);
    worst.push(`${amount}: worst ${minMove.toFixed(4)}pt (${(minMove * 3).toFixed(3)}px @3x) at balance ${minAt}`);
  });

  // The floor's collapse band, printed because it is the quantity the row is
  // really about and it is not otherwise visible anywhere.
  let bandTop = 0;
  for (let d = 1; d <= NECTAR_LADDER_CAP_DROPS; d += 1) {
    if (heightAt(d) <= HONEY_MIN_HEIGHT + 1e-12) bandTop = d;
  }
  const smallestPreset = Math.min(...NECTAR_PRESETS);

  if (dead.length === 0 && bandTop < smallestPreset) {
    ok(
      `every preset moves the rendered meniscus across EVERY adjacent balance pair, so both directions — ${worst.join('; ')}; ` +
        `the floor's collapse band is 1..${bandTop} drops, narrower than the smallest preset (${smallestPreset})`
    );
  } else if (dead.length) {
    bad(
      'preset resolution (universal)',
      `these presets produce NO rendered movement at some starting balances: ${dead.join(', ')} — §6 acceptance row 1 ` +
        `quantifies over every balance, not just the grant. The floor's collapse band is 1..${bandTop} drops`
    );
  } else {
    bad(
      'floor collapse band',
      `the floor collapses balances 1..${bandTop} into one rendered vessel, which is wider than the smallest preset ` +
        `(${smallestPreset}) — a gift of that size is invisible somewhere in that band`
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
