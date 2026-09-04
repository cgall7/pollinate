// R-CL-1 / R-CL-3 (Lumen, 2026-09-04, off Colin's screenshot of the comb) —
// the outline channel of the people comb.
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
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { hexPoints } from '../src/components/hexGeometry.js';
import { CELL_STROKE_WIDTH, CELL_MITER_REACH, CELL_CANVAS_PAD } from '../src/constants/combCell.js';

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

console.log(`\ncheck-comb-outline: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
