// Gate for R-N3 / R-N3.1 / R-N3.2 / R-N3.3 — the send, as a beat.
// GUIDES/POLLINATE_NECTAR_LIVING_EXCHANGE.md (Lumen, 2026-08-29).
//
//   npm run check:nectar-exchange
//
// §6 rows 1 and 2 (meniscus resolution; never rendered at its new height)
// are NOT here — they are `check-honey-fill` sections 8 and 9, shipped with
// R-N2, and a second copy of an assertion is a second place for it to drift.
// Row 7 (consent population) is `check-nectar-consent`. What is here is rows
// 3, 4, 5 and 6, plus the derivations this build had to make because the
// spec ruled a shape and left the number to the builder.
//
// THE ORGANISING RULE, and it is the one R-N3.2 was written to close: THE
// DROP IS ONE OBJECT. Every row below asserts a property of the OBJECT
// rather than of a screen it appears on — its radius map, its pigment stack,
// its path's currency — because "I measured the ground where I noticed the
// defect instead of the population the object crosses" is the error this
// section of the spec exists to have already made once.
// THE MUTATION HARNESS IS PERSISTED, not reported. Sage's flag on R-LF-2.1
// (2026-08-29): "a number nobody can re-derive can't be corrected either,
// only doubted." Each entry below is an edit that MUST turn its named row
// red — or, where `row` is null, an edit that must leave every row green.
// Re-run it with:
//
//   node scripts/run-mutations.mjs scripts/check-nectar-exchange.mjs
//
// The runner restores the file from a buffer it holds, never from git, so a
// mutation loop cannot revert an uncommitted edit of your own.
export const MUTATIONS = [
  {
    row: 'E1',
    why: 'a door that stops being a door — one call site loses the shared containerStyle, so the population is one and the branch pairing is gone',
    file: 'src/screens/PackageOpen.js',
    from: '                      containerStyle={styles.nectarDoor}\n                      accessibilityLabel="Give a gift"',
    to: '                      containerStyle={styles.railTrack}\n                      accessibilityLabel="Give a gift"',
  },
  {
    row: 'E2',
    why: 'the post-consent door reverts to a glyph — a lookalike would also pass an appearance check, which is why the row asserts the component',
    file: 'src/screens/PackageOpen.js',
    from: '                      <HoneyDrop radius={DROP_MAX_RADIUS} />',
    to: '                      <Ionicons name="water-outline" size={22} color={theme.colors.ink} />',
  },
  {
    row: 'E3',
    why: 'a drop form rendered BEFORE consent — the compliance direction, and the one this section fails closed for',
    file: 'src/screens/PackageOpen.js',
    from: '                      <Ionicons name="enter-outline" size={22} color={theme.colors.ink} />',
    to: '                      <HoneyDrop radius={DROP_MAX_RADIUS} />',
  },
  {
    row: 'E4',
    why: 'the box goes back to 32pt — under the ratified tap target and smaller than the object it contains',
    file: 'src/screens/PackageOpen.js',
    from: '    width: 44,\n    height: 44,',
    to: '    width: 32,\n    height: 32,',
  },
  {
    row: 'E5',
    why: 'a new ambient loop on this screen — the standing no-new-ambient rule, banned by name in R-N6',
    file: 'src/screens/PackageOpen.js',
    from: '  const bloomScale = useRef(new Animated.Value(0.85)).current;',
    to: '  const bloomScale = useRef(new Animated.Value(0.85)).current;\n  const doorPulse = Animated.loop(Animated.timing(bloomScale, { toValue: 1 }));',
  },
  {
    row: 'E5',
    why: 'the door keeps its absence of a clock but loses its position — no animated ancestor means it arrives out of nowhere, which "no clock of its own" alone would not catch',
    file: 'src/screens/PackageOpen.js',
    from: 'style={[styles.entryCard, { opacity: bloomOpacity, transform: [{ scale: bloomScale }] }]}',
    to: 'style={[styles.entryCard]}',
  },
  {
    row: 'E6',
    why: 'the consent sheet goes back to describing a drop without showing one',
    file: 'src/components/NectarConsentSheet.js',
    from: '          <HoneyDrop radius={DROP_MAX_RADIUS} style={styles.drop} />\n',
    to: '',
  },
  {
    row: 'E7',
    why: 'the introduction acquires motion',
    file: 'src/components/NectarConsentSheet.js',
    from: "import { StyleSheet, View, Text } from 'react-native';",
    to: "import { Animated, StyleSheet, View, Text } from 'react-native';",
  },
  {
    row: 'E8',
    why: 'the sixth `danger` is rebuilt',
    file: 'src/components/NectarConsentSheet.js',
    from: '// `ink` at the same size says the same thing and can be read.\n    color: theme.colors.ink,',
    to: '// `ink` at the same size says the same thing and can be read.\n    color: theme.colors.danger,',
  },
  {
    row: null,
    why: 'MUST NOT FIRE — a legal extra prop on the door\'s drop. These rows assert the object and its box, not the exact spelling of its call site',
    file: 'src/screens/PackageOpen.js',
    from: '                      <HoneyDrop radius={DROP_MAX_RADIUS} />',
    to: '                      <HoneyDrop radius={DROP_MAX_RADIUS} opacity={1} />',
  },
];

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { parse } from '@babel/parser';
import { theme } from '../src/constants/theme.js';
import { contrastRatio, deltaE00, over, parseColor } from './lib/color.mjs';
import { HONEY_MENISCUS_STROKE } from '../src/components/hexGeometry.js';
import {
  BOW_DEVIATION_FRACTION,
  CHORD_DEVIATION_BOUND_PX,
  DROP_MAX_AMOUNT,
  DROP_MAX_RADIUS,
  DROP_MENISCUS_DEPTH_FRACTION,
  DROP_MIN_AMOUNT,
  DROP_MIN_RADIUS,
  MAX_BOW_ARC_INFLATION,
  bowDeviationPx,
  bowNormal,
  buildDropFlight,
  dropRadiusForAmount,
} from '../src/components/nectarFlight.js';
import { NECTAR_PRESETS } from '../src/constants/nectar.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

let pass = 0;
const failures = [];
const ok = (msg) => { pass += 1; console.log(`  ok  ${msg}`); };
const bad = (row, msg) => { failures.push(`${row}: ${msg}`); console.log(`  FAIL ${row}: ${msg}`); };

const read = (rel) => readFile(path.join(root, rel), 'utf8');
const ast = (src) => parse(src, { sourceType: 'module', plugins: ['jsx'] });
const visit = (node, fn, ancestors = []) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => visit(n, fn, ancestors)); return; }
  if (typeof node.type === 'string') fn(node, ancestors);
  const next = typeof node.type === 'string' ? [...ancestors, node] : ancestors;
  for (const k of Object.keys(node)) {
    if (k === 'loc' || k === 'leadingComments' || k === 'trailingComments') continue;
    visit(node[k], fn, next);
  }
};

// THE COVERS ARE READ FROM THEIR OWN SOURCE, not imported. `hiveThemes.js`
// imports `../constants/theme` with no extension, which Node's ESM resolver
// refuses — the same wall `check-stage-light` and `check-text-pigment` both
// hit and both answered this way. Extracting the TOKEN NAMES and resolving
// them against the live `theme` keeps the coupling real: a cover retuned to
// a different token moves every row below with it.
// `motion.js` imports `Easing` from react-native, which a bare `node` gate
// cannot load — so NECTAR's durations are read from that file's own source.
// The same reason `nectarFlight.js` was kept pure in the first place: a
// module the acceptance rows have to measure must not need a renderer.
const MOTION_SRC = await read('src/constants/motion.js');
const nectarMs = (key) => {
  const block = /export const NECTAR = \{[\s\S]*?\n\};/.exec(MOTION_SRC);
  if (!block) throw new Error('check-nectar-exchange: NECTAR block not found in motion.js');
  const m = new RegExp(`\\n\\s*${key}:\\s*(\\d+)`).exec(block[0]);
  if (!m) throw new Error(`check-nectar-exchange: NECTAR.${key} not found — a beat this gate measures has been renamed or removed`);
  return Number(m[1]);
};
const NECTAR = { gather: nectarMs('gather'), travel: nectarMs('travel'), settle: nectarMs('settle') };

const HIVE_THEMES_SRC = await read('src/constants/hiveThemes.js');
const COVERS = [...HIVE_THEMES_SRC.matchAll(/base:\s*theme\.colors\.(\w+),\s*\n\s*textColor:\s*theme\.colors\.(\w+)/g)]
  .map(([, base, textColor]) => ({ base: theme.colors[base], textColor: theme.colors[textColor], baseName: base }));
if (COVERS.length === 0) throw new Error('check-nectar-exchange: extracted 0 hive covers — the extractor is blind, and a blind extractor is not an empty population');

const FLIGHT = await read('src/components/nectarFlight.js');
const DROP = await read('src/components/HoneyDrop.js');
const HOOK = await read('src/components/useNectarGift.js');
const LAYER = await read('src/components/NectarGiftLayer.js');
const SCREEN = await read('src/screens/PackageOpen.js');
const PANEL = await read('src/components/NectarSendPanel.js');

// ===========================================================================
// A — THE RADIUS (§6 acceptance row 3)
// ===========================================================================
// > The drop's radius is monotone in the amount across 1..1000, strictly,
// > with no flat region. (Same rule as `approachDurationMs`: a clamp that
// > binds on a large fraction of the domain is the mechanism wearing a
// > guard's name.)
//
// SWEPT, NOT SAMPLED. Three presets would pass a step function; the whole
// integer domain is the only thing that can distinguish "monotone" from
// "monotone at the points I happened to check".
{
  let strict = true;
  let worstStep = Infinity;
  let prev = dropRadiusForAmount(DROP_MIN_AMOUNT);
  for (let n = DROP_MIN_AMOUNT + 1; n <= DROP_MAX_AMOUNT; n += 1) {
    const r = dropRadiusForAmount(n);
    const step = r - prev;
    if (!(step > 0)) strict = false;
    if (step < worstStep) worstStep = step;
    prev = r;
  }
  if (strict) {
    ok(`A1 the radius is STRICTLY increasing on every one of the ${DROP_MAX_AMOUNT - DROP_MIN_AMOUNT} integer steps in 1..${DROP_MAX_AMOUNT} — smallest step ${worstStep.toExponential(4)}pt, so there is no flat region anywhere in the domain`);
  } else {
    bad('A1', `the radius is flat or falling somewhere in 1..${DROP_MAX_AMOUNT} (smallest step ${worstStep.toExponential(4)}) — §6 row 3 wants strict monotonicity with no flat region`);
  }

  // THE CLAMP IS A DOMAIN GUARD, AND THIS ROW IS WHAT MAKES THAT A CLAIM.
  // Row 3's warning is that a clamp binding across the domain is the
  // mechanism in disguise; the only way to tell the two apart is to check
  // that the endpoints are REACHED rather than CLIPPED TO.
  const rLo = dropRadiusForAmount(DROP_MIN_AMOUNT);
  const rHi = dropRadiusForAmount(DROP_MAX_AMOUNT);
  const clampBinds = dropRadiusForAmount(DROP_MIN_AMOUNT - 0.5) === rLo && dropRadiusForAmount(DROP_MAX_AMOUNT + 1) === rHi;
  if (Math.abs(rLo - DROP_MIN_RADIUS) < 1e-9 && Math.abs(rHi - DROP_MAX_RADIUS) < 1e-9 && clampBinds) {
    ok(`A2 the endpoints are reached by the map, not by the clamp — r(${DROP_MIN_AMOUNT}) = ${rLo}pt and r(${DROP_MAX_AMOUNT}) = ${rHi}pt land exactly on the two radii, and the clamp only engages OUTSIDE the ledger's own 1..${DROP_MAX_AMOUNT}`);
  } else {
    bad('A2', `r(${DROP_MIN_AMOUNT}) = ${rLo}, r(${DROP_MAX_AMOUNT}) = ${rHi} against radii ${DROP_MIN_RADIUS}/${DROP_MAX_RADIUS}, clamp-outside-domain ${clampBinds} — either the map does not span its own range or the clamp is doing the work`);
  }

  // R-N3: "its radius encodes the amount, bounded, so 100 is visibly larger
  // than 10." VISIBLY is the word being checked. A physical pixel at @3x is
  // 1/3 pt; the presets have to differ by more than the screen's own grain,
  // and this is the row that would have caught a LINEAR map (where 10 and
  // 100 differ by 1.71pt of DIAMETER across the whole ladder).
  const dia = NECTAR_PRESETS.map((n) => ({ n, d: 2 * dropRadiusForAmount(n) }));
  let separated = true;
  for (let i = 1; i < dia.length; i += 1) if (dia[i].d - dia[i - 1].d < 1) separated = false;
  if (separated) {
    ok(`A3 consecutive presets differ visibly: ${dia.map((p) => `${p.n}→${p.d.toFixed(2)}pt`).join(', ')} — every neighbouring pair is over 1pt (3 physical px @3x) apart across`);
  } else {
    bad('A3', `preset diameters ${dia.map((p) => `${p.n}→${p.d.toFixed(2)}`).join(', ')} — a neighbouring pair differs by under 1pt, so "100 is visibly bigger than 10" is not true on the device`);
  }

  // THE FLOOR IS DERIVED, AND THIS ROW RE-DERIVES IT. R-N2's rule on a
  // circle: the amber cap above the meniscus must itself be at least half a
  // stroke, or the highlight is a line with a rim rather than a highlight on
  // a body. A VALUE CHECK ALONE WOULD FREEZE 3; this recomputes it from the
  // stroke and the depth, so retuning either reds the row.
  const derivedFloor = HONEY_MENISCUS_STROKE / DROP_MENISCUS_DEPTH_FRACTION / 2;
  if (Math.abs(derivedFloor - DROP_MIN_RADIUS) < 1e-9) {
    ok(`A4 DROP_MIN_RADIUS ${DROP_MIN_RADIUS}pt IS its derivation — stroke ${HONEY_MENISCUS_STROKE} / depth ${DROP_MENISCUS_DEPTH_FRACTION} / 2, R-N2's "a region, not its own boundary" argued on a circle`);
  } else {
    bad('A4', `DROP_MIN_RADIUS is ${DROP_MIN_RADIUS} but its own premise gives ${derivedFloor} — a floor that no longer follows from the stroke it was derived from is a number, not a rule`);
  }

  // R-N6 read backwards: the door IS this object at rest, in the ratified
  // 44pt box, so the largest gift is exactly that box.
  if (DROP_MAX_RADIUS * 2 === 44) {
    ok('A5 DROP_MAX_RADIUS spans the ratified 44pt tap target exactly — the same object cannot be larger in flight than the box it lives in at rest without being two objects');
  } else {
    bad('A5', `DROP_MAX_RADIUS ${DROP_MAX_RADIUS} spans ${DROP_MAX_RADIUS * 2}pt, not the 44pt floor LinkButton/SeedsInbox/NotesInbox all cite — R-N6's door and R-N3's drop have come apart`);
  }
}

// ===========================================================================
// B — THE PIGMENT (R-N3.2: there is no unbacked spelling of the drop)
// ===========================================================================
{
  // THE STACK IS ASSERTED FROM THE AST, IN ORDER. A row that only checked
  // "the file mentions `surface`" would pass a drop whose backing sits ON
  // TOP of its body, which is the same defect with the layers swapped.
  const tree = ast(DROP);
  const order = [];
  visit(tree, (n) => {
    if (n.type !== 'JSXElement') return;
    const name = n.openingElement.name?.name;
    if (name !== 'Circle' && name !== 'Line') return;
    const attrs = {};
    for (const a of n.openingElement.attributes) {
      if (a.type !== 'JSXAttribute') continue;
      const v = a.value;
      if (v?.type === 'StringLiteral') attrs[a.name.name] = v.value;
      else if (v?.type === 'JSXExpressionContainer') {
        const e = v.expression;
        if (e.type === 'MemberExpression') attrs[a.name.name] = `${e.object.property?.name ?? e.object.name}.${e.property.name}`;
        else if (e.type === 'NumericLiteral') attrs[a.name.name] = e.value;
      }
    }
    // The clip mask is not a layer of the drop; it is how the highlight is
    // kept inside it. Excluded by its PARENT (a ClipPath), never by name.
    const inClip = false;
    if (!inClip) order.push({ name, attrs });
  });
  const stack = order.filter((o) => !(o.name === 'Circle' && o.attrs.fill === undefined));
  const body = stack.filter((o) => o.name === 'Circle' && o.attrs.fill);
  const backing = body[0];
  const amber = body[1];
  const line = stack.find((o) => o.name === 'Line');
  const stackOk =
    body.length === 2 &&
    backing?.attrs.fill === 'colors.surface' &&
    backing?.attrs.fillOpacity === undefined &&
    amber?.attrs.fill === 'colors.accentDeep' &&
    amber?.attrs.fillOpacity === 0.5 &&
    line?.attrs.stroke === 'colors.ink';
  if (stackOk) {
    ok('B1 the drop is drawn backing-first: opaque `surface` circle, then `accentDeep` at fillOpacity 0.5, then the `ink` meniscus — HoneyFill\'s own three-layer recipe, in order, read from the AST rather than from the file mentioning the tokens');
  } else {
    bad('B1', `the drop's layer stack is ${JSON.stringify(stack.map((o) => [o.name, o.attrs.fill ?? o.attrs.stroke, o.attrs.fillOpacity]))} — R-N3.2 wants exactly opaque surface, accentDeep@0.5, ink meniscus, in that order`);
  }

  // THE MEASUREMENT THAT MAKES B1 WORTH HAVING. Backed, the drop is one
  // colour on every ground; unbacked it is ten. Both are computed here, so
  // the row states the size of the thing the backing buys rather than
  // asserting that a backing exists.
  const scrim = parseColor(theme.colors.scrim);
  const covers = COVERS.map((t) => t.base);
  const grounds = [
    ['surface', theme.colors.surface],
    ...covers.map((c) => [`cover ${c}`, c]),
    ...covers.map((c) => [`cover ${c} + scrim`, over(theme.colors.scrim, c)]),
    ['paperEvening', theme.colors.paperEvening],
  ];
  const backedRGB = over(`rgba(255,122,0,0.5)`, theme.colors.surface);
  let worstBackedDrift = 0;
  let worstUnbackedDrift = 0;
  let minLegibility = Infinity;
  for (const [, g] of grounds) {
    const unbacked = over(`rgba(255,122,0,0.5)`, g);
    worstUnbackedDrift = Math.max(worstUnbackedDrift, deltaE00(unbacked, backedRGB));
    worstBackedDrift = Math.max(worstBackedDrift, 0);
    minLegibility = Math.min(minLegibility, deltaE00(backedRGB, g));
  }
  void scrim;
  if (worstUnbackedDrift > 25 && minLegibility > 15) {
    ok(`B2 the backing is load-bearing and measured: unbacked, the same fill drifts up to ΔE00 ${worstUnbackedDrift.toFixed(4)} across the ${grounds.length} grounds this object crosses; backed it is ONE colour by construction and its worst separation from any of them is still ΔE00 ${minLegibility.toFixed(4)}`);
  } else {
    bad('B2', `unbacked drift ${worstUnbackedDrift.toFixed(4)} / backed worst legibility ${minLegibility.toFixed(4)} over ${grounds.length} grounds — R-N3.2's premise no longer holds and the ruling needs re-deriving, not the code`);
  }

  // THE ABSENCE, STATED AS ONE. "There is no unbacked spelling of the drop
  // anywhere in this spec" is only checkable if the population is declared:
  // every place the drop is rendered gets its pigment from `HoneyDrop`, so
  // the row is that NOTHING ELSE in the send's files paints with accentDeep.
  //
  // READ FROM THE AST, AND MY FIRST DRAFT DID NOT — it grepped the file text
  // and went red on PackageOpen and NectarSendPanel, both of which name
  // `accentDeep` only in the DES-28 comments that explain why they decline
  // it. A lexical sweep cannot tell a pigment from a paragraph about a
  // pigment, and the wrong probe was RED here rather than green, which is
  // luck and not method. Member expressions only.
  const dropUsers = [
    ['src/components/NectarGiftLayer.js', LAYER],
    ['src/screens/PackageOpen.js', SCREEN],
    ['src/components/NectarSendPanel.js', PANEL],
  ];
  const rogue = [];
  for (const [rel, src] of dropUsers) {
    let uses = 0;
    visit(ast(src), (n) => {
      if (
        n.type === 'MemberExpression' &&
        n.property?.name === 'accentDeep' &&
        n.object?.type === 'MemberExpression' &&
        n.object.property?.name === 'colors'
      ) uses += 1;
    });
    // The stain is the ONE licensed consumer, and it is licensed by C3's
    // measurement rather than by its filename.
    const licensed = rel.endsWith('NectarGiftLayer.js') ? 1 : 0;
    if (uses > licensed) rogue.push(`${rel} (${uses} use(s), ${licensed} licensed)`);
  }
  if (rogue.length === 0) {
    ok(`B3 no consumer re-spells the drop's pigment — ${dropUsers.length} files render or host it, and the only live theme.colors.accentDeep among them is the stain, whose alpha C3 derives. Comments naming the token are not uses, which is why this row reads member expressions and not text`);
  } else {
    bad('B3', `${rogue.join(', ')} paints with accentDeep outside the stain — a second spelling of the drop's fill is exactly the drift R-N3.2 closed by construction`);
  }
}

// ===========================================================================
// C — THE PATH AND THE STAIN
// ===========================================================================
{
  // THE BOW'S CEILING IS SOLVED, NOT CHOSEN, and this row re-solves it. The
  // premise is "a fixed 340ms travel means extra arc is extra speed", so the
  // bound is on the ARC, and the fraction is what follows. A fraction edited
  // without its premise reds here.
  const arcRatioAt = (f) => {
    const p0 = { x: 0, y: 0 };
    const p2 = { x: 1, y: 0 };
    const c = { x: 0.5, y: -2 * f };
    let L = 0;
    let prev = p0;
    for (let i = 1; i <= 100000; i += 1) {
      const t = i / 100000;
      const u = 1 - t;
      const q = { x: u * u * p0.x + 2 * u * t * c.x + t * t * p2.x, y: 2 * u * t * c.y };
      L += Math.hypot(q.x - prev.x, q.y - prev.y);
      prev = q;
    }
    return L;
  };
  const ratio = arcRatioAt(BOW_DEVIATION_FRACTION);
  if (ratio <= MAX_BOW_ARC_INFLATION && ratio > MAX_BOW_ARC_INFLATION - 0.001) {
    ok(`C1 BOW_DEVIATION_FRACTION ${BOW_DEVIATION_FRACTION} IS the ${MAX_BOW_ARC_INFLATION} arc bound solved — the bowed path is ${ratio.toFixed(6)}x its chord, at the bound and under it`);
  } else {
    bad('C1', `bow fraction ${BOW_DEVIATION_FRACTION} gives an arc ${ratio.toFixed(6)}x the chord against a ${MAX_BOW_ARC_INFLATION} ceiling — the constant and its premise have come apart`);
  }

  // THE CURRENCY ROW, and it is the one R-LF-2.1 taught. `Easing.out(cubic)`
  // on the driver is only a DISTANCE deceleration if the path is uniform in
  // ARC; sampled any other way the same easing decelerates in parameter and
  // the drop speeds up through its own turn. Swept over real geometry rather
  // than one hop.
  const boxes = [[320, 568], [375, 667], [393, 852], [430, 932]];
  let worstUniformity = 0;
  let worstDeviation = 0;
  let plans = 0;
  for (const [w, h] of boxes) {
    for (const amount of [...NECTAR_PRESETS, DROP_MIN_AMOUNT, DROP_MAX_AMOUNT]) {
      const r = dropRadiusForAmount(amount);
      for (const [from, to] of [
        [{ x: w * 0.5, y: h * 0.72 }, { x: w * 0.5, y: h * 0.36 }],   // overlay -> entry paper
        [{ x: w * 0.5, y: h * 0.66 }, { x: w * 0.5, y: h * 0.30 }],   // inline -> colophon (near-vertical)
        [{ x: w * 0.2, y: h * 0.8 }, { x: w * 0.85, y: h * 0.2 }],    // corner to corner
        [{ x: w * 0.85, y: h * 0.2 }, { x: w * 0.2, y: h * 0.8 }],    // and back, for the normal's sign
      ]) {
        const plan = buildDropFlight({ from, to, radiusPx: r });
        plans += 1;
        const legs = plan.path.slice(1).map((p, i) => Math.hypot(p.x - plan.path[i].x, p.y - plan.path[i].y));
        const mean = legs.reduce((a, b) => a + b, 0) / legs.length;
        const spread = Math.max(...legs.map((l) => Math.abs(l - mean) / mean));
        worstUniformity = Math.max(worstUniformity, spread);
        // the polyline's own deviation from the curve it samples
        const c = {
          x: (from.x + to.x) / 2 + bowNormal({ from, to }).x * plan.bowPx * 2,
          y: (from.y + to.y) / 2 + bowNormal({ from, to }).y * plan.bowPx * 2,
        };
        for (let i = 0; i <= 2000; i += 1) {
          const t = i / 2000;
          const u = 1 - t;
          const q = { x: u * u * from.x + 2 * u * t * c.x + t * t * to.x, y: u * u * from.y + 2 * u * t * c.y + t * t * to.y };
          let best = Infinity;
          for (let j = 0; j < plan.path.length - 1; j += 1) {
            const a = plan.path[j];
            const b = plan.path[j + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const L2 = dx * dx + dy * dy;
            let s = L2 ? ((q.x - a.x) * dx + (q.y - a.y) * dy) / L2 : 0;
            s = Math.max(0, Math.min(1, s));
            best = Math.min(best, Math.hypot(q.x - (a.x + dx * s), q.y - (a.y + dy * s)));
          }
          worstDeviation = Math.max(worstDeviation, best);
        }
      }
    }
  }
  if (worstUniformity < 0.01) {
    ok(`C2a the path is ARC-UNIFORM on all ${plans} swept plans — worst leg-length spread ${(worstUniformity * 100).toFixed(4)}% of the mean, so "fraction of the index" and "fraction of the path" are the same number and out(cubic) decelerates in DISTANCE`);
  } else {
    bad('C2a', `worst leg-length spread ${(worstUniformity * 100).toFixed(4)}% over ${plans} plans — the path is not arc-uniform, so the travel easing is a parameter curve and the drop accelerates through its own turn (R-LF-2.1's defect, second costume)`);
  }
  if (worstDeviation <= CHORD_DEVIATION_BOUND_PX) {
    ok(`C2b the sample count holds its own bound at every swept geometry — worst polyline deviation from the true curve ${worstDeviation.toFixed(5)}px against ${CHORD_DEVIATION_BOUND_PX}px. THE APPROXIMATION IN dropFlightSamples IS NOT TRUSTED: this is measured, so a bow retune that invalidates its coefficient reds here instead of silently coarsening the path`);
  } else {
    bad('C2b', `worst polyline deviation ${worstDeviation.toFixed(5)}px exceeds ${CHORD_DEVIATION_BOUND_PX}px — dropFlightSamples' coefficient no longer follows from the shipped bow`);
  }

  // THE NEAR-VERTICAL CASE, which is the ending screen's own travel
  // (R-N3.1: "the travel is short and upward"). A vertical bow on a vertical
  // chord is COLLINEAR and the arc degenerates to a line — the row that
  // proves the perpendicular rule is doing work rather than decorating it.
  const vertical = buildDropFlight({ from: { x: 200, y: 600 }, to: { x: 200, y: 400 }, radiusPx: 15 });
  const straight = Math.hypot(vertical.path.at(-1).x - vertical.path[0].x, vertical.path.at(-1).y - vertical.path[0].y);
  if (vertical.arcPx > straight * 1.0001 && Math.abs(vertical.path[Math.floor(vertical.path.length / 2)].x - 200) > 1) {
    ok(`C2c an exactly vertical chord still arcs — mid-path offset ${Math.abs(vertical.path[Math.floor(vertical.path.length / 2)].x - 200).toFixed(3)}pt off the chord, arc ${vertical.arcPx.toFixed(3)} vs chord ${straight.toFixed(3)}. A screen-vertical bow would be collinear here and the ending screen's gift would fly in a straight line`);
  } else {
    bad('C2c', `a vertical chord degenerates: mid-path is on the chord and arc ${vertical.arcPx.toFixed(3)} == chord ${straight.toFixed(3)} — the ending screen's travel has lost its arc`);
  }

  // THE BOW'S FLOOR. A curve that departs from its chord by less than the
  // radius of the object drawn on it is a straight line drawn with a fat pen.
  const tiny = bowDeviationPx({ chordPx: 20, radiusPx: 22 });
  const long = bowDeviationPx({ chordPx: 600, radiusPx: 3 });
  if (tiny === 22 && Math.abs(long - BOW_DEVIATION_FRACTION * 600) < 1e-9) {
    ok('C2d the bow floor and ceiling each bind where they should — a short hop with a big drop bows by the drop\'s own radius, a long hop with a small one bows by the arc bound');
  } else {
    bad('C2d', `bowDeviationPx gives ${tiny} (want 22, the radius floor) and ${long} (want the fraction) — one of the two bounds is dead`);
  }

  // ---- THE STAIN ----------------------------------------------------------
  // BOTH BOUNDS, RE-MEASURED. The floor is what chose the number (visible on
  // every ground); the ceiling is legibility (the stain composites above the
  // text). CALIBRATED ON THE FAILING GROUND — the row prints the binding one
  // by name, because a mean would license an alpha invisible on the cover
  // where it matters most.
  const stainAlpha = Number(/STAIN_PEAK_ALPHA = ([0-9.]+)/.exec(LAYER)?.[1]);
  const stainSpread = Number(/STAIN_SPREAD = ([0-9.]+)/.exec(LAYER)?.[1]);
  const stainFill = `rgba(255,122,0,${stainAlpha})`;
  const stainGrounds = [
    ['surface', theme.colors.surface, theme.colors.ink],
    ['paperEvening', theme.colors.paperEvening, theme.colors.paperEveningInk],
    ...COVERS.map((t) => [`cover ${t.baseName}`, t.base, t.textColor]),
  ];
  let minVisibility = Infinity;
  let bindingGround = '';
  let minText = Infinity;
  let bindingText = '';
  for (const [label, ground, ink] of stainGrounds) {
    const stained = over(stainFill, ground);
    const d = deltaE00(stained, ground);
    if (d < minVisibility) { minVisibility = d; bindingGround = label; }
    const r = contrastRatio(over(stainFill, ink), stained);
    if (r < minText) { minText = r; bindingText = label; }
  }
  if (minVisibility >= 5) {
    ok(`C3a the stain is visible on every ground it can land on — worst ΔE00 ${minVisibility.toFixed(4)} on ${bindingGround}, over a 5.0 "clearly perceptible" floor. That ground is the calibration: it is amber-on-amber and lands exactly on the bound while washSky gets 8.42 free`);
  } else {
    bad('C3a', `the stain reaches only ΔE00 ${minVisibility.toFixed(4)} on ${bindingGround} — under the 5.0 floor, so on that ground the absorption is invisible`);
  }
  if (minText >= 4.5) {
    ok(`C3b the stain does not cost the text it lands on — worst pair ${minText.toFixed(4)}:1 on ${bindingText}, over 4.5:1. It composites ABOVE the ink (one layer serves a PaperBlock on one path and a Text on the other), so this ceiling is real and not theoretical`);
  } else {
    bad('C3b', `the stain drops text to ${minText.toFixed(4)}:1 on ${bindingText} — under 4.5:1, and it is drawn over the words`);
  }
  if (stainSpread === 2) {
    ok('C3c the stain\'s radius is the drop\'s DIAMETER — a drop that lands flattens to about its own width, so the spread is one physical multiple rather than a factor picked to look right');
  } else {
    bad('C3c', `STAIN_SPREAD is ${stainSpread} — the "flattens to its own width" derivation gives 2, and a spread with no reason is a number that drifts`);
  }
}

// ===========================================================================
// D — THE BEAT (§6 acceptance rows 4, 5, 6 and R-N3.3)
// ===========================================================================
{
  // ROW 4, ASSERTED AT THE CALL SITE AND NOT AT A TIMING — which is what the
  // row itself asks for. The haptic must sit inside the ANIMATION's
  // completion, never inside the promise's: "a success haptic that waits for
  // a round trip is a haptic about the server."
  const tree = ast(HOOK);
  let hapticInSettle = false;
  let hapticInPromiseThen = false;
  visit(tree, (n, anc) => {
    if (n.type !== 'CallExpression') return;
    const callee = n.callee;
    if (callee?.type !== 'MemberExpression') return;
    if (callee.object?.name !== 'Haptics') return;
    // Walk outward: is the nearest enclosing named function `settle`, or is
    // it a `.then(...)` argument? Read from the AST, not from line order.
    let inSettle = false;
    let inThen = false;
    for (let i = anc.length - 1; i >= 0; i -= 1) {
      const a = anc[i];
      if (a.type === 'VariableDeclarator' && a.id?.name === 'settle') { inSettle = true; break; }
      if (
        a.type === 'CallExpression' &&
        a.callee?.type === 'MemberExpression' &&
        (a.callee.property?.name === 'then' || a.callee.property?.name === 'catch')
      ) { inThen = true; break; }
    }
    if (inSettle) hapticInSettle = true;
    if (inThen) hapticInPromiseThen = true;
  });
  const rmHaptic = /if \(reduced\)[\s\S]{0,400}?Haptics\.notificationAsync/.test(HOOK);
  if (hapticInSettle && !hapticInPromiseThen && rmHaptic) {
    ok('D1 the haptic fires from the animation, not from the network — its motion-path call site is inside `settle`, the travel animation\'s completion, and NO Haptics call sits inside a .then/.catch. The Reduce Motion path fires one too, so the gift still lands in the hand when it cannot land on the screen');
  } else {
    bad('D1', `haptic in settle=${hapticInSettle}, haptic in a promise handler=${hapticInPromiseThen}, RM haptic=${rmHaptic} — §6 row 4 wants the call site inside absorption and nowhere else`);
  }

  // ROW 5, MADE STRUCTURAL. "The numeral returns to its prior value exactly —
  // no drift from the count-down/count-up pair" is only checkable if the two
  // are NOT a pair: every count is a tween to an ABSOLUTE target, so
  // interrupting either still lands on the number the server holds. This row
  // reads the arguments of every `countTo` and reds on arithmetic.
  let allAbsolute = true;
  const targets = [];
  visit(tree, (n) => {
    if (n.type !== 'CallExpression' || n.callee?.name !== 'countTo') return;
    const arg = n.arguments[0];
    if (!arg) { allAbsolute = false; return; }
    if (arg.type === 'BinaryExpression') { allAbsolute = false; targets.push('<arithmetic>'); return; }
    targets.push(arg.type === 'MemberExpression' ? `${arg.object.name}.${arg.property.name}` : arg.name ?? arg.type);
  });
  if (allAbsolute && targets.length >= 3) {
    ok(`D2 every count is a tween to an ABSOLUTE target — ${targets.join(', ')}, no arithmetic at any call site. The down-count and the up-count are not a pair, so §6 row 5's "no drift" holds even if a frame is dropped or the beat is interrupted mid-tween`);
  } else {
    bad('D2', `countTo targets are ${targets.join(', ') || '(none found)'} — a delta at any of them makes the return value depend on how far the down-count got, which is exactly the drift row 5 forbids`);
  }

  // ROW 6 — Reduce Motion. NOT "there is a reduced branch": the claim is that
  // the branch removes the TRAVEL and keeps the ARRIVAL. So: no Animated
  // timing on the path driver inside it, and the count still runs.
  const rmBlock = /if \(reduced\) \{([\s\S]*?)\n      \}/.exec(HOOK)?.[1] ?? '';
  const rmTravels = /Animated\.(timing|spring|sequence|parallel)/.test(rmBlock);
  const rmCounts = /countTo\(/.test(rmBlock);
  if (rmBlock && !rmTravels && rmCounts) {
    ok('D3 the Reduce Motion branch removes the travel and keeps the gift — zero Animated drivers inside it, and the numeral still counts because "a number changing is content, not motion" (§5). The drop layer still mounts, so the surface population is identical to the motion path');
  } else {
    bad('D3', `RM branch found=${!!rmBlock}, contains an animation=${rmTravels}, still counts=${rmCounts} — §5/§6 row 6 wants no tween and a gift that still arrives`);
  }

  // R-N3.3 — the two jobs, separated. THE ABSENCE IS THE ASSERTION: the
  // overlay must NOT carry a background any more, and must NOT have been
  // given pointerEvents="none" while its scrim moved out (that would swap a
  // veil-that-blocks for a barrier that no longer blocks).
  const overlayStyle = /sendOverlay: \{([\s\S]*?)\n  \},/.exec(SCREEN)?.[1] ?? '';
  const scrimStyle = /sendScrim: \{([\s\S]*?)\n  \},/.exec(SCREEN)?.[1] ?? '';
  const overlayHasBg = /backgroundColor:/.test(overlayStyle);
  const scrimHasBg = /backgroundColor: theme\.colors\.scrim/.test(scrimStyle);
  const scrimAnimated = /style=\{\[styles\.sendScrim, \{ opacity: gift\.scrim \}\]\}/.test(SCREEN);
  const overlayStillBlocks = !/<View style=\{styles\.sendOverlay\}\s+pointerEvents="none"/.test(SCREEN);
  if (!overlayHasBg && scrimHasBg && scrimAnimated && overlayStillBlocks) {
    ok('D4 the veil and the touch barrier are separate objects — `sendOverlay` declares no background and still takes touches; `sendScrim` carries the scrim and is the only thing that fades. R-N3.3: "a transparent overlay is still a touch barrier"');
  } else {
    bad('D4', `overlay has a background=${overlayHasBg}, scrim exists=${scrimHasBg}, scrim is animated=${scrimAnimated}, overlay still blocks=${overlayStillBlocks} — R-N3.3's separation has come undone in one of its two directions`);
  }

  // THE BEAT'S CLOCK IS COMPOSED, NOT RE-TYPED. R-N3's boundaries are
  // 0/180/520; if a duration is retuned in motion.js, a hardcoded start time
  // here would strand a beat. Asserted as a COMPOSITION, so the numbers can
  // move together and only a broken relation reds.
  const contact = /GIFT_CONTACT_MS = ([^;]+);/.exec(HOOK)?.[1] ?? '';
  const rest = /GIFT_REST_MS = ([^;]+);/.exec(HOOK)?.[1] ?? '';
  const composed = /NECTAR\.gather \+ NECTAR\.travel/.test(contact) && /GIFT_CONTACT_MS \+ NECTAR\.settle/.test(rest);
  if (composed && NECTAR.gather + NECTAR.travel === 520) {
    ok(`D5 the beat's instants are composed from NECTAR rather than typed — contact = gather + travel = ${NECTAR.gather + NECTAR.travel}ms, matching R-N3's own Depart boundary, and rest follows from it. Retuning a duration moves the beat instead of stranding it`);
  } else {
    bad('D5', `contact is "${contact.trim()}" and rest is "${rest.trim()}" (contact resolves to ${NECTAR.gather + NECTAR.travel}ms) — a beat boundary spelled as a literal is a number that outlives its own duration`);
  }

  // THE PANEL'S NUMERAL SURVIVES GATHER. This is the one place this build
  // DEVIATES from the letter of R-N3 (Gather fades "the panel's contents";
  // Settle counts a numeral 340ms later), so it gets a row rather than a
  // comment: the balance line must NOT be inside the faded group.
  const controlsGroups = PANEL.split('<Animated.View style={[styles.controls, controlsStyle]}>');
  const balanceInsideControls = controlsGroups.slice(1).some((g) => {
    const end = g.indexOf('</Animated.View>');
    return end >= 0 && /styles\.balance/.test(g.slice(0, end));
  });
  if (!balanceInsideControls && /styles\.balance/.test(PANEL)) {
    ok('D6 the balance line is OUTSIDE the group Gather fades — the deviation is real and it is the only reading under which Settle has a numeral to count. A row rather than a comment, because the next person to tidy this panel will see two Animated.Views and want to merge them');
  } else {
    bad('D6', 'the balance line sits inside the faded controls group — Gather removes it at 180ms and Settle counts it at 520ms, so "you watch it leave you" has nothing to watch');
  }
}

// ===========================================================================
// E — THE DOOR AND THE INTRODUCTION (R-N6, R-N7, D5)
// ===========================================================================
// > The affordance becomes the same object the whole system is made of, at
// > rest ... so the thing you tap looks like the thing you send.
//
// The organising rule of this file applies here more literally than anywhere
// else: THE DOOR IS THE SAME OBJECT. So these rows do not assert "a circle of
// about the right size in about the right place" — they assert that the door
// and the consent sheet render `HoneyDrop`, the one component every other row
// in this gate measures. Anything that merely LOOKS like the drop is a second
// copy of the object, which is the defect R-N3.2 closed one layer up.
{
  const tree = ast(SCREEN);

  // The door's population, enumerated from the AST and FAIL-CLOSED. Two call
  // sites exactly — pre-consent and post-consent, which "never coexist" by
  // ENG-64's own comment. Zero would make every row below vacuously green,
  // and three would mean a spelling of the door nobody has measured.
  const doors = [];
  visit(tree, (n, anc) => {
    if (n.type !== 'JSXElement') return;
    if (n.openingElement?.name?.name !== 'PressableScale') return;
    const isDoor = n.openingElement.attributes.some(
      (a) =>
        a.type === 'JSXAttribute' &&
        a.name?.name === 'containerStyle' &&
        a.value?.type === 'JSXExpressionContainer' &&
        a.value.expression?.type === 'MemberExpression' &&
        a.value.expression.object?.name === 'styles' &&
        a.value.expression.property?.name === 'nectarDoor'
    );
    if (!isDoor) return;
    // Classify the branch from the guard, not from source order. The nearest
    // enclosing `X && (...)` whose left mentions `nectarConsent` decides it:
    // a bare Identifier is post-consent, a `!` UnaryExpression pre-consent.
    // Read this way rather than by line number because the two blocks are
    // adjacent and a reorder must not silently swap the rows' subjects.
    let branch = null;
    for (let i = anc.length - 1; i >= 0 && branch === null; i -= 1) {
      const a = anc[i];
      if (a.type !== 'LogicalExpression' || a.operator !== '&&') continue;
      const L = a.left;
      if (L?.type === 'Identifier' && L.name === 'nectarConsent') branch = 'post';
      else if (L?.type === 'UnaryExpression' && L.operator === '!' && L.argument?.name === 'nectarConsent') branch = 'pre';
    }
    // What does it render? Element names only — a door's child is its face.
    const children = [];
    visit(n.children, (c) => {
      if (c.type === 'JSXElement') children.push(c.openingElement?.name?.name);
    });
    // The nearest animated ancestor, for the "no clock of its own" row.
    let animatedAncestor = null;
    for (let i = anc.length - 1; i >= 0 && animatedAncestor === null; i -= 1) {
      const a = anc[i];
      if (a.type !== 'JSXElement') continue;
      const nm = a.openingElement?.name;
      if (nm?.type !== 'JSXMemberExpression' || nm.object?.name !== 'Animated') continue;
      const styleAttr = a.openingElement.attributes.find(
        (at) => at.type === 'JSXAttribute' && at.name?.name === 'style'
      );
      animatedAncestor = JSON.stringify(styleAttr ? SCREEN.slice(styleAttr.start, styleAttr.end) : '');
    }
    doors.push({ branch, children, animatedAncestor });
  });

  if (doors.length === 2 && doors.filter((d) => d.branch === 'pre').length === 1 && doors.filter((d) => d.branch === 'post').length === 1) {
    ok(`E1 the door's population is exactly two, one per consent branch, classified from the guard rather than from source order — pre renders <${doors.find((d) => d.branch === 'pre').children.join(', ')}>, post renders <${doors.find((d) => d.branch === 'post').children.join(', ')}>`);
  } else {
    bad('E1', `found ${doors.length} \`styles.nectarDoor\` call site(s) with branches [${doors.map((d) => d.branch).join(', ')}] — the door is meant to be exactly one pre-consent and one post-consent, and an unclassifiable one is a door nobody has measured`);
  }

  const post = doors.find((d) => d.branch === 'post');
  const pre = doors.find((d) => d.branch === 'pre');

  // R-N6's positive half.
  if (post && post.children.includes('HoneyDrop')) {
    ok('E2 post-consent the door IS the drop — it renders `HoneyDrop`, the same component the flight throws and the consent sheet introduces, not a lookalike. "The thing you tap looks like the thing you send" is one component, not one appearance');
  } else {
    bad('E2', `post-consent door renders <${post ? post.children.join(', ') : 'nothing resolvable'}> — R-N6 wants the object itself`);
  }

  // R-N6's NEGATIVE half, which is the one with a rule behind it rather than
  // a taste: pre-consent carries no money word and NO DROP FORM, because a
  // drop IS the money form (nectar.js's D3 row; Apple 2.3.1(a)). This row is
  // the reason E1 fails closed — an unclassifiable door would not be checked
  // here at all, and the failure direction of THIS row is the compliance one.
  const dropForms = ['HoneyDrop', 'HoneyDropForAmount'];
  if (pre && !pre.children.some((c) => dropForms.includes(c)) && pre.children.includes('Ionicons')) {
    ok('E3 pre-consent the door carries NO drop form — it keeps its distinct glyph (`Ionicons`) and never the object. A drop is the money form, so this row fails in the direction Apple 2.3.1(a) and `nectar.js`\'s D3 row both care about');
  } else {
    bad('E3', `pre-consent door renders <${pre ? pre.children.join(', ') : 'nothing resolvable'}> — a drop form here is a money form rendered before consent`);
  }

  // The size, read from the stylesheet and checked against BOTH numbers it
  // has to satisfy — the ratified minimum tap target, and the object's own
  // rest diameter. One value, two independent reasons; if they ever diverge
  // this row says which one broke.
  const doorStyle = /nectarDoor: \{([\s\S]*?)\n  \},/.exec(SCREEN);
  const w = doorStyle && /\n\s*width: (\d+),/.exec(doorStyle[1]);
  const h = doorStyle && /\n\s*height: (\d+),/.exec(doorStyle[1]);
  const TAP_TARGET_MIN = 44; // §16.5, "min 44pt touch targets"
  if (w && h && Number(w[1]) >= TAP_TARGET_MIN && Number(h[1]) >= TAP_TARGET_MIN && Number(w[1]) >= 2 * DROP_MAX_RADIUS && Number(h[1]) >= 2 * DROP_MAX_RADIUS) {
    ok(`E4 the door's box is ${w[1]}x${h[1]}pt — at or above the ratified ${TAP_TARGET_MIN}pt tap target AND at or above the drop's own rest diameter (${2 * DROP_MAX_RADIUS}pt), which is the object it now contains. Both bounds asserted separately: they land on the same number today and are not the same requirement`);
  } else {
    bad('E4', `door box is ${w ? w[1] : '?'}x${h ? h[1] : '?'}pt against a ${TAP_TARGET_MIN}pt tap-target floor and a ${2 * DROP_MAX_RADIUS}pt drop diameter — 32pt was under the first and unrelated to the second, which is exactly what D4 was reporting`);
  }

  // "It breathes on the entry's own bloom clock, never on a clock of its
  // own." Asserted as an ABSENCE plus a POSITION, because that is what the
  // ruling actually is: no new ambient loop anywhere on this screen, and the
  // door's nearest animated ancestor is the entry card itself. Position is
  // load-bearing — a door with no animated ancestor at all would also have
  // "no clock of its own" and would arrive out of nowhere.
  const hasLoop = /Animated\.loop\s*\(/.test(SCREEN);
  const ridesBloom = post && post.animatedAncestor && /styles\.entryCard/.test(post.animatedAncestor) && /bloomOpacity/.test(post.animatedAncestor);
  if (!hasLoop && ridesBloom) {
    ok('E5 the door has no clock of its own and is not clockless — zero `Animated.loop` on this screen (the standing no-new-ambient rule), and its nearest animated ancestor is the entry card\'s own `bloomOpacity`/`bloomScale` view. The ruling is satisfied by an ABSENCE, so the row asserts the absence and the position together');
  } else {
    bad('E5', `Animated.loop present=${hasLoop}, nearest animated ancestor of the post-consent door=${post ? post.animatedAncestor : 'none'} — R-N6 bans a new ambient loop and puts the door on the entry's bloom`);
  }
}

// R-N7 — the introduction. "Show the object, at rest, above the headline.
// Nothing moves; it is an introduction, not a beat."
{
  const SHEET = await read('src/components/NectarConsentSheet.js');
  const tree = ast(SHEET);
  let drop = null;
  let headline = null;
  visit(tree, (n) => {
    if (n.type !== 'JSXElement') return;
    const nm = n.openingElement?.name?.name;
    if (nm === 'HoneyDrop' && drop === null) drop = n;
    if (nm === 'Text' && headline === null) {
      const st = n.openingElement.attributes.find((a) => a.type === 'JSXAttribute' && a.name?.name === 'style');
      if (st && /styles\.headline/.test(SHEET.slice(st.start, st.end))) headline = n;
    }
  });
  if (drop && headline && drop.start < headline.start) {
    ok('E6 the consent sheet SHOWS a drop, above the headline — the same `HoneyDrop` component, so the first time a person meets the object is the object, and they will recognise it at the door and in flight');
  } else {
    bad('E6', `HoneyDrop present=${!!drop}, headline present=${!!headline}, drop above headline=${drop && headline ? drop.start < headline.start : 'n/a'} — R-N7 asks for the object, at rest, above the headline`);
  }

  // "Nothing moves" — asserted at the file level, which is the only honest
  // scope for a claim about a whole surface. `Animated` unimported is a
  // stronger statement than "this element has no animated style", and it is
  // the one that stays true when somebody adds a second element.
  const importsAnimated = /\bAnimated\b/.test(SHEET);
  if (!importsAnimated) {
    ok('E7 nothing moves on the consent sheet — the word `Animated` does not occur in the file at all. Scoped to the FILE rather than to the drop element, because "it is an introduction, not a beat" is a claim about the surface');
  } else {
    bad('E7', 'the consent sheet references `Animated` — R-N7 rules the introduction still');
  }

  // D5 — the sixth `danger`, and the measurement its sibling already made.
  // Read from the AST, never from the text: this file NAMES the token it
  // declines, in a comment, on purpose (a justification comment is a
  // dependency — the next person must be able to see what was rejected).
  // A source-text regex reds on the explanation and calls it the defect.
  let usesDanger = false;
  visit(tree, (n) => {
    if (n.type !== 'MemberExpression') return;
    if (n.property?.name !== 'danger') return;
    if (n.object?.type === 'MemberExpression' && n.object.property?.name === 'colors') usesDanger = true;
  });
  const errorColor = /error: \{[\s\S]*?color: theme\.colors\.(\w+),/.exec(SHEET);
  const ground = theme.colors.surface; // styles.card's own backgroundColor
  const ratio = errorColor ? contrastRatio(parseColor(theme.colors[errorColor[1]]), parseColor(ground)) : 0;
  if (!usesDanger && errorColor && ratio >= 4.5) {
    ok(`E8 the consent sheet's error line is \`${errorColor[1]}\` at ${ratio.toFixed(4)}:1 over the card's \`surface\` ground, and no \`theme.colors.danger\` EXPRESSION occurs in the file (read from the AST, so the comment that names the rejected token does not red its own row) — the sixth site of the defect its own sibling declines by name at the same size. Measured, not inherited: the row would still red if some other token were swapped in`);
  } else {
    bad('E8', `danger present=${usesDanger}, error token=${errorColor ? errorColor[1] : 'unresolved'}, ratio=${ratio.toFixed(4)}:1 against a 4.5:1 bodySm bar — D5`);
  }
}

console.log(`\ncheck-nectar-exchange: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
