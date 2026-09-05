// R-RF-5 (`GUIDES/POLLINATE_RRF5_LANDING_BLOOM_SPEC.md`) and D2
// (`GUIDES/POLLINATE_D2_LANDING_LETTER_SPEC.md`) — the invite landing's comb
// centerpiece and the letter treatment around it.
//
//   npm run check:comb-bloom
//
// WHAT IT ASSERTS, and what each row is FOR
//
//   B1  the composition is the real lattice: seven cells from `hexSpiral(1)`,
//       positioned by `axialToPixel`, with the focal cell RESOLVED from the
//       spiral's own {q:0, r:0} entry rather than indexed at a literal 0
//   B2  zero trigonometry in the component. `hexGeometry.js`'s house rule
//       ("one copy of each formula") applied to a second consumer, asserted
//       as an absence over comment-blanked source so the prose that explains
//       the rule cannot satisfy it
//   B3  the canvas pad covers a MITER JOIN's reach at the component's OWN
//       stroke width, derived live — the C1 row of `check-comb-outline`
//       ported to this composition, so retuning the stroke past the pad reds
//       here instead of on a device
//   B4  and the measured extent row it exists to serve: every vertex of
//       every cell, extended along its own outward bisector by that vertex's
//       own miter reach, lies inside the box on all four sides at BOTH
//       shipped cell sizes. This is the row that would have caught R-CL-1
//   B5  the box is DERIVED (5*size wide, 3*sqrt(3)*size of ink tall, plus
//       the pad) and carries no written-down 110/114/112
//   B6  paint is tokens only, from a closed set, with the honey's three
//       layers at `EntryCombGrid`'s exact recipe and no hex literal anywhere
//   B7  static by construction: no `Animated`, no timers, no gesture handler
//   B8  decorative: the composition adds no VoiceOver stop
//   M1  the call-site census, AST-collected and reconciled against an
//       independent raw scan of the same tree — three mounts, all in
//       `CombInvite.js`, at the two ruled sizes
//   M2  `honey` defaults true and `honey={false}` is the loading mount alone
//   M3  the three honey layers are ONE conditional group, so an unresolved
//       invitation cannot render a partial vessel
//   D1  the letter's rhythm: `content` gap is the within-cluster beat and
//       `marginTop: lg` sits on EXACTLY the three cluster boundaries —
//       enumerated over the stylesheet, not spot-checked
//   D2  the inviter's name has one writer and three renders; the subject's
//       name has none
//   D3  the eyebrow's tracking is the token's
//   D4  the loading frame: ruled caption, `inkSoft` spinner, wax-only bloom
//   D5  the failure surfaces are centered, bloom-free, and still the only
//       two consumers of `styles.body`
//   D6  the name screen keeps every text node left-aligned — asserted as the
//       ABSENCE of the centering style inside that component's own subtree,
//       plus the shared keys carrying no `textAlign` of their own
//   D7  no dash in any string this surface renders (Colin's standing rule),
//       swept over string literals with comments blanked
//
// WHAT IT DOES NOT CLAIM: nothing here renders. It sees a mount that is
// absent and a token that is wrong; it cannot see a composition that is
// ugly. The picture in the build message is the other instrument.

import fs from 'node:fs';
import { parse } from '@babel/parser';
import { hexSpiral, axialToPixel } from '../src/components/combLattice.js';
import { hexPoints, HEX_HEIGHT_RATIO } from '../src/components/hexGeometry.js';
import { theme } from '../src/constants/theme.js';

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const bloomPath = 'src/components/CombBloom.js';
const screenPath = 'src/screens/CombInvite.js';
const bloom = read(bloomPath);
const screen = read(screenPath);

let passed = 0;
let failed = 0;
const check = (condition, label) => {
  if (condition) { passed += 1; console.log(`  ok   ${label}`); }
  else { failed += 1; console.log(`  FAIL ${label}`); }
};

const AST_OPTS = { sourceType: 'module', plugins: ['jsx', 'typescript'] };
const parseFile = (src, path) => {
  try { return parse(src, AST_OPTS); }
  catch (err) { console.log(`  FAIL parse ${path}: ${err.message}`); failed += 1; return null; }
};
const walk = (node, fn, stack = []) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => walk(n, fn, stack)); return; }
  const isNode = typeof node.type === 'string';
  if (isNode) { fn(node, stack); stack.push(node); }
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments') continue;
    walk(node[key], fn, stack);
  }
  if (isNode) stack.pop();
};
// Comments blanked, positions preserved. Every absence row below runs on
// this, never on raw source: this file's own header names `Animated`,
// `Math.sin` and the retired tracking value, and prose that satisfies an
// absence row is the way those rows go quiet.
const blankComments = (src, ast) => (ast.comments || [])
  .slice()
  .sort((a, b) => b.start - a.start)
  .reduce((s, c) => s.slice(0, c.start) + ' '.repeat(c.end - c.start) + s.slice(c.end), src);

const bloomAst = parseFile(bloom, bloomPath);
const screenAst = parseFile(screen, screenPath);
if (!bloomAst || !screenAst) {
  console.log(`\ncheck-comb-bloom: ${passed} passed, ${failed} failed`);
  process.exitCode = 1;
} else {

const bloomCode = blankComments(bloom, bloomAst);
const screenCode = blankComments(screen, screenAst);

// ── the component's own numbers, read out of the source rather than assumed ─
const numberOf = (name, src) => {
  const m = src.match(new RegExp(`const ${name} = ([0-9.]+);`));
  return m ? Number(m[1]) : null;
};
const WAX_STROKE_WIDTH = numberOf('WAX_STROKE_WIDTH', bloomCode);
const CANVAS_PAD = numberOf('CANVAS_PAD', bloomCode);
const CELL_SIZES = [...screenCode.matchAll(/const BLOOM_(?:ECHO_)?CELL_SIZE = ([0-9.]+);/g)].map((m) => Number(m[1]));

// ── B1 · seven cells of the real lattice, focal resolved not indexed ───────
{
  const spiral = hexSpiral(1);
  const imports = ['hexSpiral', 'axialToPixel'].every((n) => new RegExp(`\\b${n}\\b`).test(bloomCode));
  const usesSpiral = /const SPIRAL = hexSpiral\(1\);/.test(bloomCode)
    && /SPIRAL\.map\(/.test(bloomCode)
    && /axialToPixel\(q, r, cellSize\)/.test(bloomCode);
  // A3: the focal index is SEARCHED for, so it stays the lattice centre if
  // the spiral's fill order is ever re-authored. A literal 0 would be a
  // positional accident that happens to be right today.
  const focalDerived = /SPIRAL\.findIndex\(\(\{ q, r \}\) => q === 0 && r === 0\)/.test(bloomCode);
  check(spiral.length === 7 && imports && usesSpiral && focalDerived,
    `B1 seven cells of hexSpiral(1) positioned by axialToPixel, focal cell resolved from {q:0,r:0} (spiral length ${spiral.length})`);
}

// ── B2 · zero trigonometry in the component ───────────────────────────────
{
  const trig = [...bloomCode.matchAll(/Math\.(cos|sin|tan|sqrt|PI)\b/g)].map((m) => m[0]);
  check(trig.length === 0, `B2 no trigonometry in ${bloomPath} — geometry is imported, never restated${trig.length ? ` (found ${trig.join(', ')})` : ''}`);
}

// ── B3 · the pad covers the miter, and the miter is the real requirement ──
{
  const halfStroke = WAX_STROKE_WIDTH / 2;
  const miterReach = halfStroke / Math.sin(Math.PI / 3);
  check(
    WAX_STROKE_WIDTH !== null && CANVAS_PAD !== null && miterReach > halfStroke && CANVAS_PAD >= miterReach,
    `B3 CANVAS_PAD ${CANVAS_PAD} covers the miter reach ${miterReach === null ? '?' : miterReach.toFixed(4)} at stroke ${WAX_STROKE_WIDTH} (half-stroke alone would be ${halfStroke})`
  );
}

// ── B4 · measured stroke extent, every vertex, both shipped sizes ─────────
//
// THE ROW R-CL-1 EXISTS FOR. Not "is there a pad" but "does the ink fit":
// each vertex is pushed out along its own outward bisector by its own miter
// reach, computed from the generator's real geometry, and the result has to
// land inside the box on all four sides.
{
  const failures = [];
  for (const cellSize of CELL_SIZES) {
    const positions = hexSpiral(1).map(({ q, r }) => axialToPixel(q, r, cellSize));
    const xs = positions.map((p) => p.x);
    const ys = positions.map((p) => p.y);
    const minX = Math.min(...xs);
    const rawMinY = Math.min(...ys);
    const minY = rawMinY + cellSize * (1 - HEX_HEIGHT_RATIO);
    const width = Math.max(...xs) - minX + cellSize * 2 + CANVAS_PAD * 2;
    const height = Math.max(...ys) - rawMinY + cellSize * 2 * HEX_HEIGHT_RATIO + CANVAS_PAD * 2;
    const verts = hexPoints(cellSize).split(' ').map((p) => {
      const [x, y] = p.split(',').map(Number);
      return { x, y };
    });
    for (const p of positions) {
      verts.forEach((v, i) => {
        const prev = verts[(i + verts.length - 1) % verts.length];
        const next = verts[(i + 1) % verts.length];
        // Outward bisector, from the generator's own vertices: the two edge
        // directions leaving this vertex, normalized and summed, negated.
        const unit = (a, b) => {
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy);
          return { x: dx / len, y: dy / len };
        };
        const a = unit(v, prev);
        const b = unit(v, next);
        const bx = a.x + b.x;
        const by = a.y + b.y;
        const blen = Math.hypot(bx, by);
        // Half the interior angle, from the same two edge directions —
        // never from an assumed 120 degrees.
        const halfInterior = Math.acos(Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y))) ) / 2;
        const reach = (WAX_STROKE_WIDTH / 2) / Math.sin(halfInterior);
        const ox = -(bx / blen) * reach;
        const oy = -(by / blen) * reach;
        const X = v.x + p.x - minX + CANVAS_PAD + ox;
        const Y = v.y + p.y - minY + CANVAS_PAD + oy;
        if (X < -1e-9 || Y < -1e-9 || X > width + 1e-9 || Y > height + 1e-9) {
          failures.push(`size ${cellSize} vertex (${X.toFixed(4)}, ${Y.toFixed(4)}) outside 0..${width.toFixed(4)} x 0..${height.toFixed(4)}`);
        }
      });
    }
  }
  check(CELL_SIZES.length === 2 && failures.length === 0,
    `B4 stroke extent stays inside the box at every vertex, cell sizes ${CELL_SIZES.join(' and ')}${failures.length ? ` — ${failures[0]}` : ''}`);
}

// ── B5 · the box is derived, not written down ─────────────────────────────
{
  // The box AND the placement. B4 re-derives the layout from CELL_SIZES and
  // CANVAS_PAD, so it measures the geometry the component SHOULD have; these
  // four pins are what tie that measurement to the geometry it HAS. Without
  // the two origin pins, sliding the content off its pad would leave every
  // row green.
  const derived = /width: Math\.max\(\.\.\.xs\) - minX \+ cellSize \* 2 \+ CANVAS_PAD \* 2/.test(bloomCode)
    && /height: Math\.max\(\.\.\.ys\) - Math\.min\(\.\.\.ys\) \+ cellSize \* 2 \* HEX_HEIGHT_RATIO \+ CANVAS_PAD \* 2/.test(bloomCode)
    && /originX: CANVAS_PAD - minX,/.test(bloomCode)
    && /originY: CANVAS_PAD - minY,/.test(bloomCode)
    && /const minY = Math\.min\(\.\.\.ys\) \+ cellSize \* \(1 - HEX_HEIGHT_RATIO\);/.test(bloomCode)
    && /transform=\{at\(index\)\}/.test(bloomCode)
    && /`translate\(\$\{positions\[index\]\.x \+ originX\}, \$\{positions\[index\]\.y \+ originY\}\)`/.test(bloomCode);
  const written = [...bloomCode.matchAll(/\b(110|112|114|116|45|47)\b/g)].map((m) => m[0]);
  // And the derivation actually produces the spec's box plus the pad, at
  // both sizes — the arithmetic, not the source shape.
  const arithmetic = CELL_SIZES.every((s) => {
    const positions = hexSpiral(1).map(({ q, r }) => axialToPixel(q, r, s));
    const xs = positions.map((p) => p.x);
    const ys = positions.map((p) => p.y);
    const w = Math.max(...xs) - Math.min(...xs) + s * 2 + CANVAS_PAD * 2;
    const h = Math.max(...ys) - Math.min(...ys) + s * 2 * HEX_HEIGHT_RATIO + CANVAS_PAD * 2;
    return Math.abs(w - (5 * s + CANVAS_PAD * 2)) < 1e-9 && Math.abs(h - (3 * Math.sqrt(3) * s + CANVAS_PAD * 2)) < 1e-9;
  });
  check(derived && arithmetic && written.length === 0,
    `B5 the box is 5*cellSize by 3*sqrt(3)*cellSize of ink plus the pad, computed from the spiral${written.length ? ` — written-down box literal(s): ${written.join(', ')}` : ''}`);
}

// ── B6 · paint: a closed token set, the honey recipe letter-exact ─────────
{
  const RULED = ['washYellow', 'glassHairline', 'surface', 'accentDeep', 'ink'];
  const used = [...new Set([...bloomCode.matchAll(/theme\.colors\.([A-Za-z][\w]*)/g)].map((m) => m[1]))].sort();
  const closed = used.length === RULED.length && RULED.slice().sort().every((t, i) => used[i] === t);
  const hexLiteral = /#[0-9a-fA-F]{3,8}\b/.test(bloomCode);
  const recipe = /<Polygon points=\{honeyPoints\} fill=\{theme\.colors\.surface\} \/>/.test(bloomCode)
    && /<Polygon points=\{honeyPoints\} fill=\{theme\.colors\.accentDeep\} fillOpacity=\{0\.5\} \/>/.test(bloomCode)
    && /strokeWidth=\{HONEY_MENISCUS_STROKE\}/.test(bloomCode)
    && /honeyHeightForLevel\(cellSize, 1\)/.test(bloomCode);
  const waxStroke = /stroke=\{theme\.colors\.glassHairline\}\s*\n\s*strokeWidth=\{WAX_STROKE_WIDTH\}/.test(bloomCode)
    && WAX_STROKE_WIDTH === 1;
  // The honey stays the highest-chroma element by construction: assert it
  // numerically rather than by reading the sentence that says so.
  const chroma = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  };
  const honeyLoudest = chroma(theme.colors.accentDeep) > chroma(theme.colors.washYellow);
  check(closed && !hexLiteral && recipe && waxStroke && honeyLoudest,
    `B6 paint is exactly {${RULED.join(', ')}} via theme, honey recipe letter-exact, wax stroke ${WAX_STROKE_WIDTH} (used: ${used.join(', ')})`);
}

// ── B7 · static by construction ───────────────────────────────────────────
{
  const motion = [...bloomCode.matchAll(/\b(Animated|setTimeout|setInterval|requestAnimationFrame|useSharedValue|PanResponder|Gesture)\b/g)].map((m) => m[0]);
  check(motion.length === 0, `B7 nothing animated or timed in ${bloomPath}${motion.length ? ` (found ${[...new Set(motion)].join(', ')})` : ''}`);
}

// ── B8 · decorative: no VoiceOver stop, no touch target ───────────────────
{
  check(
    /pointerEvents="none"/.test(bloomCode)
      && /accessible=\{false\}/.test(bloomCode)
      && /accessibilityElementsHidden/.test(bloomCode)
      && /importantForAccessibility="no-hide-descendants"/.test(bloomCode),
    'B8 the composition is decorative on both platforms and takes no touches'
  );
}

// ── M1 · call-site census, AST-collected, independently reconciled ────────
//
// The G2 lesson from `check-gradient-card-contract`: a row that asks the
// contract of what the walker collected is only as honest as the walker. The
// raw scan runs on bytes before the AST exists, so a partly blind extractor
// cannot take its own witness down with it.
const mounts = [];
{
  const files = [];
  const stack = ['src'];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(new URL(`../${dir}`, import.meta.url), { withFileTypes: true })) {
      if (entry.isDirectory()) stack.push(`${dir}/${entry.name}`);
      else if (entry.name.endsWith('.js')) files.push(`${dir}/${entry.name}`);
    }
  }
  let rawSites = 0;
  for (const file of files) {
    const src = read(file);
    rawSites += (src.match(/<CombBloom\b/g) || []).length;
    if (!/<CombBloom\b/.test(src)) continue;
    const ast = parseFile(src, file);
    if (!ast) continue;
    walk(ast, (node) => {
      if (node.type !== 'JSXOpeningElement') return;
      if (!node.name || node.name.type !== 'JSXIdentifier' || node.name.name !== 'CombBloom') return;
      const props = {};
      let spread = false;
      for (const attr of node.attributes) {
        if (attr.type === 'JSXSpreadAttribute') { spread = true; continue; }
        const value = attr.value;
        props[attr.name.name] = value && value.type === 'JSXExpressionContainer'
          ? src.slice(value.expression.start, value.expression.end)
          : value && value.type === 'StringLiteral' ? value.value : true;
      }
      mounts.push({ file, line: node.loc.start.line, props, spread });
    });
  }
  const allInScreen = mounts.every((m) => m.file === screenPath);
  const sizes = mounts.map((m) => m.props.cellSize).sort();
  const expected = ['BLOOM_CELL_SIZE', 'BLOOM_CELL_SIZE', 'BLOOM_ECHO_CELL_SIZE'];
  check(
    mounts.length === 3 && rawSites === 3 && allInScreen
      && sizes.length === 3 && sizes.every((s, i) => s === expected[i])
      && CELL_SIZES.length === 2 && CELL_SIZES[0] === 22 && CELL_SIZES[1] === 9,
    `M1 CombBloom has exactly 3 mounts, all in ${screenPath}, at cellSize ${CELL_SIZES.join(' and ')} (AST ${mounts.length}, raw scan ${rawSites})`
  );
}

// ── M2 · honey defaults true; exactly one mount turns it off ─────────────
{
  const off = mounts.filter((m) => m.props.honey === 'false');
  const defaulted = /honey = true/.test(bloomCode);
  // And it is the LOADING mount, not merely some mount: the wax-only frame
  // is the state where the invitation has not resolved.
  const loadingBlock = screenCode.slice(screenCode.indexOf("if (status === 'loading')"), screenCode.indexOf("if (status === 'unreachable')"));
  check(defaulted && off.length === 1 && /<CombBloom cellSize=\{BLOOM_CELL_SIZE\} honey=\{false\}/.test(loadingBlock),
    `M2 honey defaults true and the one honey={false} mount is the loading frame (found ${off.length} off)`);
}

// ── M3 · the three honey layers are one conditional group ────────────────
//
// Not three conditionals that happen to agree. A partial vessel — the
// meniscus without its body — is the failure this forbids, and it is exactly
// what three independent `honey &&` guards would eventually ship.
{
  let group = null;
  walk(bloomAst, (node) => {
    if (node.type !== 'ConditionalExpression') return;
    if (!node.test || node.test.type !== 'Identifier' || node.test.name !== 'honey') return;
    group = node;
  });
  const layersInside = group ? (() => {
    let polygons = 0;
    let lines = 0;
    walk(group.consequent, (n) => {
      if (n.type !== 'JSXOpeningElement' || !n.name || n.name.type !== 'JSXIdentifier') return;
      if (n.name.name === 'Polygon') polygons += 1;
      if (n.name.name === 'Line') lines += 1;
    });
    return polygons === 2 && lines === 1;
  })() : false;
  const honeyRefs = (bloomCode.match(/\bhoney\b(?!Points|Height)/g) || []).length;
  check(group !== null && layersInside && honeyRefs === 2,
    `M3 all three honey layers sit inside ONE honey conditional (2 Polygon + 1 Line), and honey is referenced ${honeyRefs} times (declaration + the one test)`);
}

// ── D1 · the letter's rhythm, enumerated over the stylesheet ─────────────
{
  const sheet = screenCode.slice(screenCode.indexOf('const styles = StyleSheet.create('));
  const gapSm = /content: \{[^}]*gap: theme\.spacing\.sm/.test(sheet);
  const boundaries = [...sheet.matchAll(/(^|\n)\s{2}([A-Za-z][\w]*): \{[^}]*marginTop: theme\.spacing\.lg/g)].map((m) => m[2]).sort();
  const expected = ['bloomMount', 'cta', 'disclosure'];
  const oldDisclosureMargin = /disclosure: \{[^}]*marginTop: theme\.spacing\.sm/.test(sheet);
  // No new numeric spacing literal: every marginTop/gap/padding in the sheet
  // reads a token. `minHeight: 54` and `paddingTop: 60` predate this and are
  // not spacing rhythm, so they are named rather than swept in.
  const rawSpacing = [...sheet.matchAll(/\b(?:gap|marginTop|marginBottom|paddingHorizontal|paddingVertical): (\d+)/g)].map((m) => m[0]);
  check(
    gapSm && !oldDisclosureMargin && rawSpacing.length === 0
      && boundaries.length === 3 && boundaries.every((k, i) => k === expected[i]),
    `D1 content gap is the within-cluster beat and marginTop lg sits on exactly {${expected.join(', ')}} (found {${boundaries.join(', ')}})`
  );
}

// ── D2 · every render of the inviter's name carries the emphasis ───────
//
// A CENSUS, NOT A COUNT. My first draft of this row pinned three renders,
// because the ruling counted the landing's two `hasActiveMonth` variants
// separately — and it redded on a build that satisfies the ruling MORE
// completely, with the name lifted out of the variant split so one wrapper
// serves both tails. The property is "no rendered occurrence of the
// inviter's name escapes the wrapper", which is a reader census over the
// identifier, and it is blind to how many JSX nodes the sentence is built
// from. Same lesson the R-RF-2 single-writer row was rebuilt on.
{
  const wrapperRanges = [];
  walk(screenAst, (node) => {
    if (node.type !== 'JSXOpeningElement') return;
    if (!node.name || node.name.name !== 'InviterName') return;
    const attr = node.attributes.find((a) => a.type === 'JSXAttribute' && a.name.name === 'name');
    if (attr && attr.value && attr.value.type === 'JSXExpressionContainer') {
      wrapperRanges.push([attr.value.expression.start, attr.value.expression.end]);
    }
  });
  const refs = [];
  walk(screenAst, (node) => {
    if (node.type !== 'MemberExpression') return;
    if (!node.object || node.object.name !== 'preview') return;
    if (!node.property || node.property.name !== 'inviterName') return;
    refs.push(node);
  });
  const escaped = refs.filter((r) => !wrapperRanges.some(([a, b]) => r.start >= a && r.end <= b));

  // Coverage: BOTH components that speak the sentence mount the wrapper.
  const mountsIn = (fnName) => {
    let n = 0;
    walk(screenAst, (node, stack) => {
      if (node.type !== 'JSXOpeningElement' || !node.name || node.name.name !== 'InviterName') return;
      const owner = stack.slice().reverse().find((a) =>
        a.type === 'VariableDeclarator' && a.id && a.id.type === 'Identifier'
        && a.init && (a.init.type === 'ArrowFunctionExpression' || a.init.type === 'FunctionExpression'));
      if (owner && owner.id.name === fnName) n += 1;
    });
    return n;
  };
  // And the landing's variant split does not reach the name: the
  // `hasActiveMonth` ternary in the heading varies only the tail, so both
  // variants inherit the emphasis by construction rather than by two edits
  // that have to stay in step.
  let variantCarriesName = false;
  walk(screenAst, (node) => {
    if (node.type !== 'ConditionalExpression') return;
    const test = node.test;
    if (!test || test.type !== 'MemberExpression' || !test.property || test.property.name !== 'hasActiveMonth') return;
    walk(node, (inner) => {
      if (inner.type === 'MemberExpression' && inner.object && inner.object.name === 'preview'
        && inner.property && inner.property.name === 'inviterName') variantCarriesName = true;
    });
  });

  const writer = /const InviterName = \(\{ name \}\) => <Text style=\{styles\.inviterName\}>\{name\}<\/Text>;/.test(screenCode);
  const register = /inviterName: \{ fontFamily: theme\.fonts\.headerExtraBold \},/.test(screenCode);
  // The legend is asymmetric on purpose: the sentence emphasizes who reached
  // out, not who it is about. A subject name in the same wrapper would read
  // as two equal claims.
  const subjectPlain = !/<InviterName name=\{preview\.subjectName\}/.test(screenCode)
    && !/<Text style=\{styles\.inviterName\}>\{preview\.subjectName\}/.test(screenCode);
  const stepUp = theme.fonts.headerExtraBold !== theme.type.h2.fontFamily;
  check(
    writer && register && subjectPlain && stepUp
      && refs.length > 0 && escaped.length === 0
      && mountsIn('CombInviteLandingScreen') >= 1 && mountsIn('CombInviteNameScreen') >= 1
      && !variantCarriesName,
    `D2 all ${refs.length} renders of the inviter name go through one headerExtraBold writer, on both screens, outside the hasActiveMonth split${escaped.length ? ` — escaped at line(s) ${escaped.map((r) => r.loc.start.line).join(', ')}` : ''}`
  );
}

// ── D3 · the eyebrow's tracking is the token's ──────────────────────────
{
  const noOverride = /eyebrow: \{ \.\.\.theme\.type\.label, color: theme\.colors\.inkSoft \},/.test(screenCode)
    && !/eyebrow: \{[^}]*letterSpacing/.test(screenCode);
  // B3 of the D2 spec is a RAW grep, comments included — a justification
  // comment quoting the retired value would red it, which is why the source
  // does not quote it.
  const rawFree = !screen.includes('1.2');
  check(noOverride && rawFree && theme.type.label.letterSpacing === 2,
    `D3 the eyebrow inherits theme.type.label's letterSpacing ${theme.type.label.letterSpacing}, with no one-off left in the file`);
}

// ── D4 · the letter before it is opened ────────────────────────────────
{
  const block = screenCode.slice(screenCode.indexOf("if (status === 'loading')"), screenCode.indexOf("if (status === 'unreachable')"));
  check(
    block.includes('>Opening your invitation.<')
      && /<ActivityIndicator color=\{theme\.colors\.inkSoft\} \/>/.test(block)
      && /honey=\{false\}/.test(block)
      && /styles\.eyebrow/.test(block)
      && !/ActivityIndicator color=\{theme\.colors\.ink\}/.test(screenCode),
    'D4 the loading frame is eyebrow + wax-only bloom + the ruled caption + an inkSoft spinner, not a bare indicator on cream'
  );
}

// ── D5 · the failure surfaces ─────────────────────────────────────────
{
  const bodyConsumers = (screenCode.match(/style=\{styles\.body\}/g) || []).length;
  const bodyCentered = /body: \{[^}]*textAlign: 'center'/.test(screenCode);
  const failureBlock = screenCode.slice(screenCode.indexOf('const InviteUnavailable'), screenCode.indexOf('const InviterName'));
  check(bodyConsumers === 2 && bodyCentered && !/CombBloom/.test(failureBlock)
      && (failureBlock.match(/\[styles\.heading, styles\.centered\]/g) || []).length === 2,
    `D5 both failure surfaces center their heading over a centered styles.body, and neither is handed the bloom (${bodyConsumers} body consumers)`);
}

// ── D6 · a form is not a poster ───────────────────────────────────────
//
// Asserted as an ABSENCE inside the name screen's own subtree, which is the
// only way to see it: R-D2-6's whole point is that the shared keys must not
// carry the centering, so a row reading the stylesheet cannot tell the two
// screens apart.
{
  let nameScreenCentered = 0;
  let landingCentered = 0;
  walk(screenAst, (node, stack) => {
    if (node.type !== 'MemberExpression') return;
    if (!node.object || node.object.name !== 'styles') return;
    if (!node.property || node.property.name !== 'centered') return;
    const owner = stack.slice().reverse().find((a) =>
      a.type === 'VariableDeclarator' && a.id && a.id.type === 'Identifier'
      && a.init && (a.init.type === 'ArrowFunctionExpression' || a.init.type === 'FunctionExpression'));
    if (owner && owner.id.name === 'CombInviteNameScreen') nameScreenCentered += 1;
    else landingCentered += 1;
  });
  const sharedKeysNeutral = ['eyebrow', 'heading', 'secondary']
    .every((k) => !new RegExp(`${k}: \\{[^}]*textAlign`).test(screenCode));
  check(nameScreenCentered === 0 && landingCentered > 0 && sharedKeysNeutral,
    `D6 the name screen centers no text node (${nameScreenCentered} in its subtree, ${landingCentered} elsewhere) and eyebrow/heading/secondary carry no textAlign of their own`);
}

// ── D7 · no dash in anything this surface renders ─────────────────────
//
// Colin's standing rule (2026-09-04). String literals and template quasis
// only, comments blanked — the prose in this tree is full of them by
// convention and is not read by anyone using the app.
{
  const offenders = [];
  for (const [src, ast, path] of [[bloom, bloomAst, bloomPath], [screen, screenAst, screenPath]]) {
    const code = blankComments(src, ast);
    const clean = parse(code, AST_OPTS);
    walk(clean, (node) => {
      const texts = node.type === 'StringLiteral' ? [node.value]
        : node.type === 'JSXText' ? [node.value]
        : node.type === 'TemplateElement' ? [node.value.cooked ?? ''] : [];
      for (const t of texts) {
        const m = t.match(/[‐-―−]|(?<=\S) - (?=\S)/);
        if (m) offenders.push(`${path}:${node.loc.start.line} ${JSON.stringify(t.trim().slice(0, 60))}`);
      }
    });
  }
  check(offenders.length === 0, `D7 no dash in any rendered string${offenders.length ? ` — ${offenders.join('; ')}` : ''}`);
}

console.log(`\ncheck-comb-bloom: ${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
}
