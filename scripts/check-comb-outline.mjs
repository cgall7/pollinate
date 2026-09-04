// R-CL-1 / R-CL-2 / R-CL-3 (Lumen, 2026-09-04, off Colin's screenshot of the
// comb) — the outline channel of the people comb, and the state that moved
// out of it.
//
//   npm run check:comb-outline
//
// WHAT IT ASSERTS
//
//   C1  the cell canvas pad covers a MITER JOIN's reach, not merely half the
//       stroke. Derived live from `CELL_STROKE_WIDTH`, so a future retune of
//       the stroke that outgrows the pad reds here instead of on a device
//   C2  the stroke extent of the real `hexPoints` polygon — every vertex
//       extended along its own outward bisector by that vertex's own miter
//       reach, computed from the generator's actual geometry rather than
//       from an assumed 120° — lies inside the padded viewBox on all four
//       sides, at every cell size the app ships. THIS IS THE ROW THE RULING
//       NAMED: "a gate row asserts stroke extent stays inside the viewport"
//   C3  EVERY `<Svg>` in the file pads the rendered box AND the viewBox by
//       the same constant — enumerated, not spot-checked, so the gate
//       refuses the unpadded SHAPE rather than one instance of it (the
//       defect was structural: a hexagon's left and right vertices sit
//       exactly ON a `size * 2` canvas's edges, by construction). Padding only the viewBox keeps the outline whole but
//       silently rescales the cell (~2.8% at size 44) and renders a "2.5pt"
//       stroke at 2.43pt — a fix that makes the ruled width a lie
//   C4  the cell wrapper subtracts the pad from its origin and adds twice it
//       to its box, so the hexagon's CENTRE does not move. That centre is
//       what `combLattice.cellCentre` returns, and what the bee's flight and
//       the tap scrim's punch-out both aim at — padding a canvas must not
//       move a target
//   C5  no sample seat in `demoHive.js` is authored `blooming` or `seeded`
//       (R-CL-3). `check-demo-hive` holds the same line from the data side;
//       this row holds it from the source, so a re-authoring has to defeat
//       two different instruments
//   O1  every cell in the file wears ONE rest tone at ONE width — enumerated
//       across every `<Polygon>` that carries a stroke, filled seats and
//       empty ones alike, so the ruling's "on every cell" is checked as a
//       population and not as two spot edits
//   O2  that tone's contrast is the same on all four grounds a cell can sit
//       on, within a stated spread — the property that makes it uniform in
//       the sense the ruling asked for, rather than merely one token
//   L1  the ring's whole tail is out of the tree: no `BloomRing`, no
//       `hexEdgeMarks`, no ring geometry constant, no `bloomRing.js`
//   L2  the light clears the field threshold against an unlit `washYellow`
//       neighbour at the breathe's PEAK — the binding tint, since a lit cell
//       stands ΔE00 27.96 off `washSky` and only 6.87 off `washYellow`
//   L3  and at the breathe's FLOOR as well. R46 ("the state never
//       disappears, only the breathe does") made numeric: the quiet end of
//       the cycle is above the threshold too, not merely non-zero
//   L4  nothing the light paints is ever green-dominant, swept across the
//       whole breathe range — WITH a control that reproduces the refuted
//       mechanism (`accentBurst` straight onto `washSky`) and requires it to
//       still be green, so the row cannot pass by measuring nothing
//   L5  Reduce Motion freezes the light at its PEAK, not at its floor and
//       not by unmounting it
//   L6  a lit cell does not dissolve into the page it sits on
//   L7  the light's two layers stay in their two places — the ground swap at
//       the identity layer, under the honey and the seal; the overlay above
//       them — and the avatar branch takes the overlay only, never a wash
//       painted over a person's face
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { hexPoints } from '../src/components/hexGeometry.js';
import { CELL_STROKE_WIDTH, CELL_MITER_REACH, CELL_CANVAS_PAD, CELL_REST_STROKE_TOKEN } from '../src/constants/combCell.js';
import { BLOOM_FLOOR_OPACITY, BLOOM_LIGHT_ALPHA } from '../src/constants/bloomLight.js';
import { theme } from '../src/constants/theme.js';
import { parseColor, over, contrastRatio, deltaE00 } from './lib/color.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GRID = path.join(ROOT, 'src/components/HoneycombGrid.js');
const DEMO = path.join(ROOT, 'src/constants/demoHive.js');

let pass = 0;
const failures = [];
const ok = (label) => { pass += 1; console.log(`  ok   ${label}`); };
const bad = (label, detail) => {
  failures.push(`${label} — ${detail}`);
  console.log(`  FAIL ${label} — ${detail}`);
};

const parseJs = (src) => parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
// Comments blanked before any source regex — this file's own reasoning, and
// the component's, name every banned shape out loud to explain why it is
// banned (justification_comment_is_a_dependency).
const codeOnly = (src, ast) =>
  (ast.comments || [])
    .slice()
    .sort((a, b) => b.start - a.start)
    .reduce((s, c) => s.slice(0, c.start) + ' '.repeat(c.end - c.start) + s.slice(c.end), src);

const gridSrc = fs.readFileSync(GRID, 'utf8');
const gridCode = codeOnly(gridSrc, parseJs(gridSrc));
const demoSrc = fs.readFileSync(DEMO, 'utf8');
const demoCode = codeOnly(demoSrc, parseJs(demoSrc));

// ── C1. the pad covers the miter, and the miter is the real requirement ──
{
  const halfStroke = CELL_STROKE_WIDTH / 2;
  if (CELL_MITER_REACH <= halfStroke + 1e-9) {
    bad('C1 miter reach', `CELL_MITER_REACH (${CELL_MITER_REACH}) should exceed half the stroke (${halfStroke}) — a hexagon vertex is not a flat edge`);
  } else if (CELL_CANVAS_PAD >= CELL_MITER_REACH) {
    ok(`C1 pad ${CELL_CANVAS_PAD} covers the miter reach ${CELL_MITER_REACH.toFixed(4)} at stroke ${CELL_STROKE_WIDTH} (half-stroke alone would be ${halfStroke})`);
  } else {
    bad('C1 pad vs miter', `CELL_CANVAS_PAD ${CELL_CANVAS_PAD} < CELL_MITER_REACH ${CELL_MITER_REACH.toFixed(4)} — the two points of every hexagon still clip`);
  }
}

// ── C2. the real polygon's stroked extent fits the padded viewBox ────────
//
// Not "half the stroke past the bounding box": each vertex is pushed out
// along ITS OWN outward bisector by (w/2)/sin(interiorAngle/2), and the
// interior angle is read off the generator's own consecutive points. If
// `hexPoints` ever changes orientation or radius convention this row follows
// it, because it never assumes the shape.
{
  const SIZES = [21, 26, 30, 34, 38, 44, 52];
  const worst = { size: null, side: null, slack: Infinity };
  for (const size of SIZES) {
    const pts = hexPoints(size).split(' ').map((p) => p.split(',').map(Number));
    const cx = size;
    const cy = size;
    const lo = -CELL_CANVAS_PAD;
    const hi = size * 2 + CELL_CANVAS_PAD;
    for (let i = 0; i < pts.length; i += 1) {
      const [x, y] = pts[i];
      const [px, py] = pts[(i - 1 + pts.length) % pts.length];
      const [nx, ny] = pts[(i + 1) % pts.length];
      // Unit vectors along the two edges leaving this vertex.
      const u = [px - x, py - y];
      const v = [nx - x, ny - y];
      const un = Math.hypot(...u);
      const vn = Math.hypot(...v);
      const ux = u[0] / un; const uy = u[1] / un;
      const vx = v[0] / vn; const vy = v[1] / vn;
      // Interior angle at the vertex, and the join's reach along the bisector.
      const interior = Math.acos(Math.max(-1, Math.min(1, ux * vx + uy * vy)));
      const reach = (CELL_STROKE_WIDTH / 2) / Math.sin(interior / 2);
      // Outward bisector: away from the centre.
      let bx = ux + vx;
      let by = uy + vy;
      const bn = Math.hypot(bx, by) || 1;
      bx /= bn; by /= bn;
      if ((x - cx) * bx + (y - cy) * by > 0) { bx = -bx; by = -by; }
      const ex = x - bx * reach;
      const ey = y - by * reach;
      for (const [side, slack] of [['left', ex - lo], ['right', hi - ex], ['top', ey - lo], ['bottom', hi - ey]]) {
        if (slack < worst.slack) { worst.slack = slack; worst.size = size; worst.side = side; }
      }
    }
  }
  if (worst.slack >= 0) {
    ok(`C2 stroke extent inside the padded viewBox at every shipped size — tightest ${worst.slack.toFixed(4)}pt of slack (${worst.side}, size ${worst.size})`);
  } else {
    bad('C2 stroke extent', `the stroked polygon leaves the viewBox by ${(-worst.slack).toFixed(4)}pt on the ${worst.side} at size ${worst.size}`);
  }
}

// ── C3. both components pad the box AND the viewBox ──────────────────────
{
  const svgs = [...gridCode.matchAll(/<Svg\b[\s\S]{0,420}?>/g)].map((m) => m[0]);
  const padded = svgs.filter((tag) => /width=\{size \* 2 \+ CELL_CANVAS_PAD \* 2\}/.test(tag)
    && /height=\{size \* 2 \+ CELL_CANVAS_PAD \* 2\}/.test(tag)
    && /viewBox=\{`\$\{-CELL_CANVAS_PAD\} \$\{-CELL_CANVAS_PAD\}/.test(tag));
  if (svgs.length >= 2 && padded.length === svgs.length) {
    ok(`C3 all ${svgs.length} cell <Svg> tags pad the rendered box and the viewBox by the same constant (scale stays 1)`);
  } else {
    bad('C3 padded canvas', `${padded.length} of ${svgs.length} <Svg> tags carry width+height+viewBox padding`);
  }
}

// ── C4. the wrapper compensates, so the centre does not move ─────────────
{
  const hasOrigin = /left: x - CELL_CANVAS_PAD/.test(gridCode) && /top: y - CELL_CANVAS_PAD/.test(gridCode);
  const hasBox = /width: size \* 2 \+ CELL_CANVAS_PAD \* 2/.test(gridCode) && /height: size \* 2 \+ CELL_CANVAS_PAD \* 2/.test(gridCode);
  if (hasOrigin && hasBox) {
    ok('C4 cell wrapper shifts its origin back by the pad and grows its box by twice it — hexagon centre unmoved at (x + size, y + size)');
  } else {
    bad('C4 wrapper compensation', `origin shift=${hasOrigin} box growth=${hasBox} — an uncompensated pad moves every cell centre by ${CELL_CANVAS_PAD}pt down-right, and cellCentre() would be wrong for the bee's flight`);
  }
}

// ── C5. the sample demos no states ───────────────────────────────────────
{
  const authored = [...demoCode.matchAll(/\b(blooming|seeded):\s*true\b/g)].map((m) => m[1]);
  if (authored.length === 0) {
    ok('C5 no sample seat is authored blooming or seeded (R-CL-3) — states appear the first time a real person earns one');
  } else {
    bad('C5 authored sample states', `demoHive.js still authors ${authored.join(', ')}`);
  }
}


// ── O1. one rest tone, one width, on every cell in the file ──────────────
{
  // Every `<Polygon>` that carries a stroke, filled seat and empty seat
  // alike. Enumerated rather than spot-checked for the same reason C3 is:
  // the defect the ruling names is a POPULATION property ("on every cell"),
  // and a gate that reads two known sites passes the moment a third appears.
  const strokedPolygons = [...gridCode.matchAll(/<Polygon\b[^>]*?\bstroke=\{([^}]*)\}[^>]*?\bstrokeWidth=\{([^}]*)\}/gs)]
    .map((m) => ({ stroke: m[1].trim(), width: m[2].trim() }));
  const restTones = new Set();
  const widths = new Set();
  for (const { stroke, width } of strokedPolygons) {
    // A conditional stroke is selection's own flip; its rest arm is the half
    // this row governs. `selected ? ink : REST` -> REST.
    restTones.add(stroke.includes('?') ? stroke.split(':').pop().trim() : stroke);
    widths.add(width);
  }
  const tones = [...restTones];
  const expected = `theme.colors.${CELL_REST_STROKE_TOKEN}`;
  const uniform = strokedPolygons.length >= 2 && tones.length === 1 && tones[0] === expected
    && widths.size === 1 && [...widths][0] === 'CELL_STROKE_WIDTH';
  if (uniform) {
    ok(`O1 all ${strokedPolygons.length} stroked cell polygons rest on ${expected} at CELL_STROKE_WIDTH — one wax hairline across filled seats and empty ones, which is what "on every cell" asks for`);
  } else {
    bad('O1 one rest tone', `${strokedPolygons.length} stroked polygon(s): rest tones {${tones.join(', ')}}, widths {${[...widths].join(', ')}} — expected exactly {${expected}} at {CELL_STROKE_WIDTH}`);
  }
}

// ── O2. the tone states the same thing on every ground ───────────────────
{
  // The four grounds a cell's own stroke can be drawn against: the two
  // identity tints, the own cell's `surface` underlay, and the page the comb
  // sits on. The white it replaced measured 1.1129 / 1.1418 / 1.0000 /
  // 1.0809 on the same four — a boundary is read by luminance, and on the
  // own cell there was nothing to read at all.
  const grounds = ['washYellow', 'washSky', 'surface', 'background'];
  const restTone = theme.colors[CELL_REST_STROKE_TOKEN];
  const ratios = grounds.map((g) => contrastRatio(over(parseColor(restTone), parseColor(theme.colors[g])), theme.colors[g]));
  const spread = Math.max(...ratios) - Math.min(...ratios);
  const floor = Math.min(...ratios);
  // Two conditions, and they are different claims. The floor is "there is an
  // edge to see"; the spread is "it is the same edge everywhere", which is
  // the one the ruling actually asked for and the one white failed worst.
  if (floor >= 1.35 && spread <= 0.05) {
    ok(`O2 rest tone measures ${ratios.map((r) => r.toFixed(3)).join(' / ')} on ${grounds.join(' / ')} — floor ${floor.toFixed(3)}, spread ${spread.toFixed(3)}: one tone that states the same thing on every ground`);
  } else {
    bad('O2 uniform rest tone', `ratios ${ratios.map((r) => r.toFixed(3)).join(' / ')} on ${grounds.join(' / ')} — floor ${floor.toFixed(3)} (needs 1.35) and spread ${spread.toFixed(3)} (needs <= 0.05)`);
  }
}

// ── L1. the ring's tail is out ───────────────────────────────────────────
{
  const banned = ['BloomRing', 'hexEdgeMarks', 'BLOOM_RING_INSET', 'BLOOM_MARK_EDGE_FRACTION', 'BLOOM_MARK_STROKE_WIDTH'];
  // Comments are blanked first, so this file's own prose naming the retired
  // identifiers (and hexGeometry's retirement note, and bloomLight's ledger)
  // cannot trip a row meant to catch a live reference.
  const searched = [
    ['src/components/HoneycombGrid.js', gridCode],
    ['src/components/hexGeometry.js', null],
    ['src/components/HexShape.js', null],
  ].map(([rel, pre]) => {
    if (pre !== null) return [rel, pre];
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    return [rel, codeOnly(src, parseJs(src))];
  });
  const live = searched.flatMap(([rel, code]) => banned.filter((b) => new RegExp(`\\b${b}\\b`).test(code)).map((b) => `${b} in ${rel}`));
  const fileGone = !fs.existsSync(path.join(ROOT, 'src/constants/bloomRing.js'));
  // `nectar.js` is checked by VALUE rather than by sweep, deliberately. Its
  // honeyed-mark row used to anchor on the ring's generator, and its `note`
  // now says so in prose — a string, not a comment, so a bare identifier
  // sweep would read the record of the retirement as the retirement failing.
  // What has to be true there is narrower and exact: the anchor is no longer
  // that generator.
  const nectarSrc = fs.readFileSync(path.join(ROOT, 'src/constants/nectar.js'), 'utf8');
  const staleAnchor = /anchor:\s*'hexEdgeMarks'/.test(nectarSrc);
  if (live.length === 0 && fileGone && !staleAnchor) {
    ok(`L1 the ring's tail is out of ${searched.length} searched source files — no ${banned.join(' / ')}; constants/bloomRing.js is gone (its surviving numbers moved to bloomLight.js with a written ledger); and NECTAR_SURFACES no longer anchors on the retired generator`);
  } else {
    bad('L1 ring tail', `${live.length} live reference(s): ${live.join(', ') || 'none'}${fileGone ? '' : '; src/constants/bloomRing.js still exists'}${staleAnchor ? '; NECTAR_SURFACES still anchors on hexEdgeMarks' : ''}`);
  }
}

// ── L2/L3/L6. what the light is worth, at both ends of its breathe ───────
const lit = (alpha, ground) => over({ ...parseColor(theme.colors.accentBurst), a: alpha }, parseColor(ground));
const LIT_PEAK = lit(BLOOM_LIGHT_ALPHA, theme.colors.washYellow);
const LIT_FLOOR = lit(BLOOM_LIGHT_ALPHA * BLOOM_FLOOR_OPACITY, theme.colors.washYellow);
// ΔE00 5 is the threshold this file uses for two fields that are NOT
// adjacent — cells in a comb are separated by other cells, so the ~2.3 JND
// for a shared edge is the wrong bar and would pass a light nobody can find.
const FIELD_THRESHOLD = 5;
{
  const peak = deltaE00(LIT_PEAK, parseColor(theme.colors.washYellow));
  const sky = deltaE00(LIT_PEAK, parseColor(theme.colors.washSky));
  if (peak >= FIELD_THRESHOLD) {
    ok(`L2 a lit cell at the breathe's peak stands ΔE00 ${peak.toFixed(2)} off an unlit washYellow neighbour (and ${sky.toFixed(2)} off a washSky one) — washYellow is the binding tint and it clears ${FIELD_THRESHOLD}`);
  } else {
    bad('L2 light at peak', `ΔE00 ${peak.toFixed(2)} against washYellow, under the ${FIELD_THRESHOLD} field threshold — the state is invisible on half the comb`);
  }
}
{
  const floor = deltaE00(LIT_FLOOR, parseColor(theme.colors.washYellow));
  if (floor >= FIELD_THRESHOLD) {
    ok(`L3 and ΔE00 ${floor.toFixed(2)} at the breathe's floor — R46 made numeric: the light is still findable at the quiet end of the cycle, not merely non-zero`);
  } else {
    bad('L3 light at floor', `ΔE00 ${floor.toFixed(2)} at the floor — the state disappears for part of every cycle, which is the failure R46 named`);
  }
}
{
  const page = deltaE00(LIT_PEAK, parseColor(theme.colors.background));
  if (page >= FIELD_THRESHOLD) {
    ok(`L6 a lit cell stands ΔE00 ${page.toFixed(2)} off the page it sits on — it reads as lit, not as a hole in the comb`);
  } else {
    bad('L6 light vs page', `ΔE00 ${page.toFixed(2)} against background — a lit cell is dissolving into the page`);
  }
}

// ── L4. nothing the light paints is ever green ───────────────────────────
{
  // Swept across the whole breathe, not sampled at the ends: the composite
  // is monotone in alpha but the row costs nothing to sweep and a future
  // two-token light would not be.
  //
  // HONEST ABOUT THE TWO HALVES. The sweep's only reachable failure today is
  // a change of ground, which L7 catches first — mutating the swap to
  // `washSky` reds L7, not this. So the sweep is a standing guard rather than
  // an independently firing row, and THE CONTROL below is the half that
  // earns its place: mutate `washSky` warm and this row reds while every
  // other row in the file stays green.
  const greenDominant = (c) => c.g > c.r && c.g > c.b;
  const offenders = [];
  for (let i = 0; i <= 100; i += 1) {
    const alpha = BLOOM_LIGHT_ALPHA * (BLOOM_FLOOR_OPACITY + (1 - BLOOM_FLOOR_OPACITY) * (i / 100));
    const onLitGround = lit(alpha, theme.colors.washYellow);
    if (greenDominant(onLitGround)) offenders.push(`washYellow @ ${alpha.toFixed(4)}`);
  }
  // THE CONTROL. R-CL-2 as literally written put this same light straight
  // onto the identity tint, and on `washSky` that is green — which is why
  // the shipped build swaps the ground to `washYellow` first. If this
  // control ever stops being green the swap has lost its reason and the row
  // above has stopped measuring anything.
  const refuted = lit(BLOOM_LIGHT_ALPHA, theme.colors.washSky);
  if (offenders.length === 0 && greenDominant(refuted)) {
    ok(`L4 no composite along the breathe is green-dominant on the lit ground — and the control still is: accentBurst straight onto washSky lands rgb(${Math.round(refuted.r)},${Math.round(refuted.g)},${Math.round(refuted.b)}), G the max channel, which is the measurement the base swap exists for`);
  } else if (offenders.length) {
    bad('L4 no green', `${offenders.length} composite(s) green-dominant, first ${offenders[0]}`);
  } else {
    bad('L4 no green', `the control is no longer green: accentBurst on washSky is rgb(${Math.round(refuted.r)},${Math.round(refuted.g)},${Math.round(refuted.b)}) — the base swap's reason has moved and this row is passing vacuously`);
  }
}

// ── L5. Reduce Motion freezes the light at its peak ──────────────────────
{
  const body = /const BloomLight = \(\{[^}]*\}\) => \{([\s\S]*?)\n\};/.exec(gridCode)?.[1] ?? '';
  const reducedBranch = /if \(reduced\) \{([\s\S]*?)\n {4}\}/.exec(body)?.[1] ?? '';
  const freezesAtPeak = /pulse\.setValue\(1\)/.test(reducedBranch);
  const stillRenders = /<Polygon[^>]*accentBurst/.test(body);
  const noFloorFreeze = !/setValue\(BLOOM_FLOOR_OPACITY\)/.test(reducedBranch);
  if (freezesAtPeak && stillRenders && noFloorFreeze) {
    ok('L5 Reduce Motion freezes the light at pulse 1 and the polygon still renders — R46 inherited from the ring unchanged: the state never disappears, only the breathe does');
  } else {
    bad('L5 reduced motion', `freezes at peak=${freezesAtPeak}, light still painted=${stillRenders}, not frozen at the floor=${noFloorFreeze}`);
  }
}

// ── L7. the base swap sits at the identity layer, and only there ─────────
{
  // The light is TWO layers and they live in different places on purpose:
  // the ground swap replaces the identity tint (so the honey, the seal and
  // the selection fill all stay above it and keep their own grounds), while
  // the overlay sits near the top of the stack. This row holds the split.
  // Its avatar half is the §6.5(a) clause: a photograph is not overpainted,
  // it takes the overlay only.
  const swap = /fill=\{member\.blooming \? theme\.colors\.washYellow : tint\}/.test(gridCode);
  const avatarIdx = gridCode.indexOf('<SvgImage');
  const swapIdx = gridCode.search(/fill=\{member\.blooming \?/);
  const lightIdx = gridCode.indexOf('<BloomLight');
  const honeyIdx = gridCode.indexOf('<HoneyFill');
  const avatarUntouched = avatarIdx > -1 && !/<SvgImage[^>]*blooming/s.test(gridCode);
  const ordered = swapIdx > -1 && honeyIdx > swapIdx && lightIdx > honeyIdx;
  if (swap && avatarUntouched && ordered) {
    ok('L7 the ground swap replaces the identity tint in the non-avatar branch only, below the honey and the light — the photo-backed cell takes the overlay and keeps its photograph (§6.5(a))');
  } else {
    bad('L7 base swap placement', `swap present=${swap}, avatar branch untouched=${avatarUntouched}, order tint -> honey -> light=${ordered}`);
  }
}

console.log(`\ncheck-comb-outline: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
