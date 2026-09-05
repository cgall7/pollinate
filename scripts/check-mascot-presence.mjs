// The ceremonial mascot has one presence system and one moving wing.
//
// This gate closes the two defects Colin identified on 2026-09-02:
//   * WelcomeBee ran a fixed bob plus wing metronome instead of the shared
//     whole-silhouette Breath. RETIRED — see the M2/M3 note below; the defect
//     was fixed on 2026-09-02 and its subject was deleted on 2026-09-05.
//   * the body raster retained the master's charcoal wing construction line,
//     exposing an immobile ghost wing behind the animated one. LIVE, M1/M4.
//
//   npm run check:mascot-presence

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { decodePNG } from './lib/png-codec.mjs';
import * as mascot from '../src/constants/mascot.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const bee = read('src/components/MascotBee.js');
const pipeline = read('design/pipeline/build_layers.py');
const cut = read('design/pipeline/cut.py');

let passed = 0;
const failures = [];
const ok = (id, message) => { passed += 1; console.log(`  ok   ${id} ${message}`); };
const bad = (id, message) => { failures.push(`${id}: ${message}`); console.log(`  FAIL ${id} ${message}`); };

const walk = (node, visit) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((item) => walk(item, visit)); return; }
  if (typeof node.type === 'string') visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (!['loc', 'leadingComments', 'trailingComments', 'innerComments'].includes(key)) walk(value, visit);
  }
};

// M1 — measure the shipped rasters. The wing population is the positive
// control; without it an empty/missing wing could make the ghost count zero.
{
  const body = decodePNG(fs.readFileSync(path.join(ROOT, 'assets/mascot-body.png')));
  const wing = decodePNG(fs.readFileSync(path.join(ROOT, 'assets/mascot-wing.png')));
  if (body.width !== wing.width || body.height !== wing.height) {
    bad('M1', `body is ${body.width}x${body.height}, wing is ${wing.width}x${wing.height}; stacked layers need one box`);
  } else {
    const { width, height } = body;
    const nearWing = new Uint8Array(width * height);
    let wingPixels = 0;
    const radius = 7;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (wing.data[(y * width + x) * 4 + 3] < 8) continue;
        wingPixels += 1;
        for (let dy = -radius; dy <= radius; dy += 1) {
          for (let dx = -radius; dx <= radius; dx += 1) {
            if (dx * dx + dy * dy > radius * radius) continue;
            const xx = x + dx;
            const yy = y + dy;
            if (xx >= 0 && xx < width && yy >= 0 && yy < height) nearWing[yy * width + xx] = 1;
          }
        }
      }
    }
    let ghostPixels = 0;
    const hingeX = Math.ceil(width * mascot.HINGE.x);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < hingeX; x += 1) {
        const i = (y * width + x) * 4;
        const dark = Math.max(body.data[i], body.data[i + 1], body.data[i + 2]) < 120;
        if (nearWing[y * width + x] && body.data[i + 3] >= 8 && dark) ghostPixels += 1;
      }
    }
    if (wingPixels < 1000) {
      bad('M1', `only ${wingPixels} wing pixels reached the measurement; the target population is empty or damaged`);
    } else if (ghostPixels > 100) {
      bad('M1', `${ghostPixels} dark body pixels remain within 7px of the wing before its hinge (ceiling 100); the old ghost-wing body measures 959`);
    } else {
      ok('M1', `${ghostPixels} dark near-wing body pixels (≤100), with ${wingPixels} wing pixels as the positive control`);
    }
  }
}

// M2 and M3 — RETIRED 2026-09-05. Their subject no longer exists.
//
// WHY, AND IT IS NOT "THE DEFECTS WENT AWAY". `WelcomeBee.js` was deleted by
// R-OD (POLLINATE_OPENDAY_NECTAR_RECUT_SPEC.md Part 1, ruled by Lumen
// on Colin's 2026-09-05 direction): the Lock interstitial was the component's
// only mount, so the gate died and the hero on it died with it. The two
// defects M2 and M3 were written against were FIXED ON 2026-09-02, three days
// before the deletion, and shipped fixed. Deleting the file did not repair
// them and must not be read as having repaired them.
//
// A gate that cannot do its measurement must not imply the measurement still
// holds. `read('src/components/WelcomeBee.js')` at module scope would THROW
// rather than fail, which is the wrong failure shape for a missing subject,
// so it is gone rather than left to fault. These rows are retired explicitly,
// here, rather than deleted silently.
//
// THE ONE FACT THAT DIES WITH THE ROWS, CARRIED FORWARD:
//
//   `WelcomeBee.js:44` held `breath={resolved && !reduced}` — the tree's ONLY
//   breath gated on RESOLUTION rather than on the flag alone. `FlyingBee.js`
//   holds `breath={!reduced}`, which is the other side of R-RM-1, not a
//   substitute subject. If any future surface mounts `MascotBee` at rest,
//   fail-closed-until-resolved applies, and M3's row shape is the reference:
//   the component reads `useReducedMotionState`, destructures `{ reduced,
//   resolved }` by name, passes `breath={resolved && !reduced}`, and runs no
//   local bob or wing conductor of its own.
//
// That sentence is the successor to the row. It is a rule with a written
// reference, not a measurement, and it is stated as such.
//
// COVERAGE GAP, OWED AND NOT CLOSED. M3's third clause also carried a
// transferable half: no component reintroduces a local bob or wing conductor
// outside the shared Breath system. Generalising that clause over
// `src/components` as M3's own regex was measured and rejected in the same
// thread — `Animated.loop|sequence|timing` is this codebase's ordinary motion
// vocabulary and matches 25 to 27 files, none of them a mascot conductor, so
// the row would ship day-one red or exemption-list itself down to nothing.
// The replacement is semantic and M6-adjacent: a component other than
// `MascotBee` that owns a wing-shaped and body-shaped Image pair and animates
// them outside the shared mount. That is an AST walk, it is FILED as its own
// row (Pixel's queue, ruled out of the R-OD commit by Lumen), and until it
// lands this gate does NOT measure that property anywhere. Named gap, named
// owner, no implied green.
//
// M1, M4, M5 and M6 are untouched: they read the rasters, the source pipeline,
// the shared crop and `MascotBee` itself, so "one presence system, one moving
// wing" still has an owner at the component that actually draws.

// M4 — the source writer assigns the charcoal perimeter away from the body.
// M1 checks the artifact; this checks that regenerating it cannot restore the
// defect while still yielding a locally plausible PNG.
{
  const ownsOutline = /wing_outline\s*=\s*subj\s*&\s*\(lum\s*<\s*120\)/.test(pipeline)
    && /wing_ownership\s*=\s*wing\s*\|/.test(pipeline)
    && /body\s*=\s*subj\s*&\s*~wing_ownership/.test(pipeline);
  if (ownsOutline) ok('M4', 'the source pipeline subtracts the dark wing perimeter from the body mask');
  else bad('M4', 'the body is not derived from explicit wing-outline ownership; a regeneration can restore the ghost wing');
}

// M5 — an artifact removal cannot recrop the two layers and move the hinge.
{
  const expected = 'box = (169, 110, 1182, 1159)';
  const geometry = `export const MASCOT_ASPECT = 1013 / 1049;`;
  if (cut.includes(expected) && read('src/constants/mascot.js').includes(geometry)) {
    ok('M5', 'the pipeline and runtime share the ratified 1013x1049 character box');
  } else {
    bad('M5', `fixed crop present=${cut.includes(expected)}, runtime aspect present=${read('src/constants/mascot.js').includes(geometry)}`);
  }
}

// M6 — Breath transforms the common ancestor of the wing and body layers.
// Applying it to either Image would satisfy "a body term exists" while the
// other half stayed pinned, recreating the visible complaint in a new shape.
{
  const beeAst = parse(bee, { sourceType: 'module', plugins: ['jsx'] });
  let sharedRoot = false;
  walk(beeAst.program, (node) => {
    if (node.type !== 'ReturnStatement' || node.argument?.type !== 'JSXElement') return;
    const root = node.argument;
    const style = root.openingElement.attributes.find((attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'style');
    const styleText = style?.value?.type === 'JSXExpressionContainer'
      ? bee.slice(style.value.expression.start, style.value.expression.end)
      : '';
    const sources = new Set();
    walk(root.children, (child) => {
      if (child.type !== 'JSXOpeningElement' || child.name?.name !== 'Image') return;
      const source = child.attributes.find((attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'source');
      if (source?.value?.type === 'JSXExpressionContainer') sources.add(bee.slice(source.value.expression.start, source.value.expression.end));
    });
    if (/\bbodyStyle\b/.test(styleText) && sources.has('wingSource') && sources.has('bodySource')) sharedRoot = true;
  });
  const riseLivesInBodyStyle = /const bodyStyle = breathing[\s\S]*?translateY:\s*rise\.interpolate/.test(bee);
  if (sharedRoot && riseLivesInBodyStyle) ok('M6', 'Breath moves the common wing+body ancestor as one silhouette');
  else bad('M6', `common transformed ancestor=${sharedRoot}; rise owned by bodyStyle=${riseLivesInBodyStyle}`);
}

console.log(`\nmascot presence: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

export const MUTATIONS = [
  {
    row: 'M4',
    why: 'Subtracting only the bright wing restores the charcoal ghost to the next body export.',
    file: 'design/pipeline/build_layers.py',
    from: 'body = subj & ~wing_ownership',
    to: 'body = subj & ~wing',
  },
  {
    row: 'M5',
    why: 'A one-pixel recrop moves both layers under the runtime hinge geometry.',
    file: 'design/pipeline/cut.py',
    from: 'box = (169, 110, 1182, 1159)',
    to: 'box = (170, 110, 1182, 1159)',
  },
  {
    row: 'M6',
    why: 'Moving bodyStyle onto the inner layer would stop moving the complete silhouette.',
    file: 'src/components/MascotBee.js',
    from: "style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, bodyStyle]}",
    to: "style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}",
  },
];
