// The ceremonial mascot has one presence system and one moving wing.
//
// This gate closes the two defects Colin identified on 2026-09-02:
//   * WelcomeBee ran a fixed bob plus wing metronome instead of the shared
//     whole-silhouette Breath.
//   * the body raster retained the master's charcoal wing construction line,
//     exposing an immobile ghost wing behind the animated one.
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
const welcome = read('src/components/WelcomeBee.js');
const bee = read('src/components/MascotBee.js');
const pipeline = read('design/pipeline/build_layers.py');
const cut = read('design/pipeline/cut.py');

let passed = 0;
const failures = [];
const ok = (id, message) => { passed += 1; console.log(`  ok   ${id} ${message}`); };
const bad = (id, message) => { failures.push(`${id}: ${message}`); console.log(`  FAIL ${id} ${message}`); };

const ast = parse(welcome, { sourceType: 'module', plugins: ['jsx'] });
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

// M2 — the hero declares Breath directly. No driven beat means MascotBee owns
// both the gentle whole-body rise and the irregular wing punctuation.
{
  const mounts = [];
  walk(ast.program, (node) => {
    if (node.type !== 'JSXOpeningElement' || node.name?.name !== 'MascotBee') return;
    const props = new Map(node.attributes
      .filter((attr) => attr.type === 'JSXAttribute')
      .map((attr) => [attr.name.name, attr.value?.type === 'JSXExpressionContainer'
        ? welcome.slice(attr.value.expression.start, attr.value.expression.end).replace(/\s+/g, ' ')
        : '<literal>']));
    mounts.push(props);
  });
  const only = mounts[0];
  if (mounts.length === 1 && /!reduced/.test(only.get('breath') ?? '') && !only.has('beat') && !only.has('flutter')) {
    ok('M2', 'WelcomeBee has one MascotBee and asks for shared Breath, with no caller-driven wing or flight loop');
  } else {
    bad('M2', `expected one active breath gated on reduced and no beat/flutter; found ${mounts.length} mount(s), breath=${only?.get('breath') ?? 'absent'}, beat=${only?.has('beat') ?? false}, flutter=${only?.has('flutter') ?? false}`);
  }
}

// M3 — unresolved preference is motion-off, not assumed normal. Also reject
// the old local conductor even if a breath prop happens to remain nearby.
{
  const stateHook = /import \{ useReducedMotionState \} from '\.\.\/constants\/motion';/.test(welcome)
    && /const \{ reduced, resolved \} = useReducedMotionState\(\);/.test(welcome);
  const failClosedBreath = /breath=\{resolved && !reduced\}/.test(welcome);
  const retired = /Animated\.(?:loop|sequence|timing)|\bconst\s+(?:bob|wing)\b/.test(welcome);
  if (stateHook && failClosedBreath && !retired) ok('M3', 'Reduce Motion fails closed until resolved, and the fixed bob/wing conductor is absent');
  else bad('M3', `state hook complete=${stateHook}; breath waits for resolution=${failClosedBreath}; retired local conductor present=${retired}`);
}

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
    row: 'M2',
    why: 'Disabling Breath leaves the hero still even though the shared component remains intact.',
    file: 'src/components/WelcomeBee.js',
    from: 'breath={resolved && !reduced}',
    to: 'breath={false}',
  },
  {
    row: 'M3',
    why: 'Dropping the resolved boundary assumes normal motion before the OS preference returns.',
    file: 'src/components/WelcomeBee.js',
    from: 'breath={resolved && !reduced}',
    to: 'breath={!reduced}',
  },
  {
    row: 'M3',
    why: 'The boolean hook reintroduces the unresolved-as-normal mount window.',
    file: 'src/components/WelcomeBee.js',
    from: "import { useReducedMotionState } from '../constants/motion';",
    to: "import { useReducedMotion } from '../constants/motion';",
  },
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
  {
    row: null,
    why: 'Changing explanatory prose must not make a mechanism gate fire.',
    file: 'src/components/WelcomeBee.js',
    from: '// The hero used to own a second motion language:',
    to: '// The hero previously owned a second motion language:',
  },
];
