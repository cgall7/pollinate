// Acceptance rig for MB-D1 — the honey-bloom stage light, built as a mode on
// `src/components/GlowOrb.js` rather than as a second component.
//
//   npm run check:stage-light
//
// WHY A GATE AND NOT A SCREENSHOT
//
// Three of the five things this rig asserts are invisible in a frame:
//
//   * a `breathe` + `staged` call site looks like a working bloom right up
//     until someone asks why the stage light is still moving;
//   * a reduced-motion branch that reads the BOOLEAN hook instead of the
//     resolved one plays the front of the entrance and then snaps, which is
//     a motion under Reduce Motion and is one or two frames long;
//   * a second radial-gradient bloom component is invisible to every search
//     for the first one (R83 — a duplicated drawing does not carry the name
//     of the thing it duplicates), so the property worth holding is that
//     GlowOrb stays the only one.
//
// Section F re-derives the colour ruling that struck MB-D1's three-hue stop
// stack, off the LIVE tokens, so the argument in GlowOrb's header comment
// cannot go stale behind a token retune (a justification comment is a
// dependency).
//
// WHAT IT CANNOT SEE, at the scope of the probes that produced it (§0): it
// has not rendered a frame. Whether the bloom reads as a stage rather than a
// stain on a real panel, and whether 250ms is a greeting rather than a
// flick, are device rows and are unrun here.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir } from 'node:fs/promises';
import { parse } from '@babel/parser';
import { parseColor, rgbToLab, deltaE00 } from './lib/color.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const SRC = path.join(root, 'src');

let pass = 0;
const failures = [];
const ok = (msg) => { pass += 1; console.log(`  ok  ${msg}`); };
const bad = (row, msg) => { failures.push(`${row}: ${msg}`); console.log(`  FAIL ${row}: ${msg}`); };

const walk = async (dir) => {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
};

const ast = (src) => parse(src, { sourceType: 'module', plugins: ['jsx'] });

// Minimal generic walker — every node value that looks like a node gets
// visited, so no node type has to be enumerated in advance.
const visit = (node, fn) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => visit(n, fn)); return; }
  if (typeof node.type === 'string') fn(node);
  for (const k of Object.keys(node)) {
    if (k === 'loc' || k === 'leadingComments' || k === 'trailingComments') continue;
    visit(node[k], fn);
  }
};

const jsxName = (n) => (n.name && n.name.type === 'JSXIdentifier' ? n.name.name : null);
const attrNames = (el) =>
  el.attributes.filter((a) => a.type === 'JSXAttribute').map((a) => a.name.name);
const attr = (el, name) =>
  el.attributes.find((a) => a.type === 'JSXAttribute' && a.name.name === name);

const files = await walk(SRC);
const componentPath = path.join(SRC, 'components', 'GlowOrb.js');
const componentSrc = await readFile(componentPath, 'utf8');
const componentAst = ast(componentSrc);

console.log('\nA. the drawing — one bloom, one hue, no edge');

// A0 — GlowOrb is the ONLY radial-gradient bloom in the tree. Enforced by
// absence (R83): a second component drawing the same light is invisible to
// every search for this one, so the population is "files declaring a
// <RadialGradient>" and the assertion is that the set is exactly the known
// members. GlowOrb is the bloom; the others are named, and each is a
// different object (a gradient is not automatically a bloom).
{
  const withRadial = [];
  for (const f of files) {
    const src = await readFile(f, 'utf8');
    if (/<RadialGradient/.test(src)) withRadial.push(path.relative(root, f));
  }
  // Named members, each with the object it draws. A radial gradient is not
  // automatically a bloom — the point of the list is that adding to it is a
  // sentence somebody has to write, not a suppression.
  const KNOWN = new Map([
    ['src/components/GlowOrb.js', 'the bloom itself — the stage light and the ambient orb'],
    // The comb's own ruled stage light, and deliberately NOT this component:
    // it is a SCRIM with a punch-out (the room dims, the lit cell is the hole)
    // plus an accentBurst glow in the punch-out's frame. Lumen, 2026-08-28:
    // "on that surface FlightElite's rule 4 is already implemented inverted —
    // the room dims instead of the light adding," and no bloom ever mounts on
    // the comb (marigold radial over the comb is gold-at-the-comb, §29.1).
    ['src/components/HexTapOverlay.js', 'hex-tap dim + punch-out glow — a scrim, not a bloom'],
  ]);
  const unknown = withRadial.filter((f) => !KNOWN.has(f));
  const stale = [...KNOWN.keys()].filter((f) => !withRadial.includes(f));
  if (!withRadial.includes('src/components/GlowOrb.js')) {
    bad('A0 bloom population', 'GlowOrb.js declares no <RadialGradient> — the extractor is looking at the wrong thing');
  } else if (unknown.length) {
    bad('A0 bloom population', `${unknown.length} file(s) draw a <RadialGradient> that this list does not name: ${unknown.join(', ')}. Name it here with the object it draws, or fold it into GlowOrb.`);
  } else if (stale.length) {
    // A list member that no longer draws anything is a row that has stopped
    // asserting — it would keep this section green while covering nothing.
    bad('A0 bloom population', `${stale.length} named member(s) no longer declare a <RadialGradient>: ${stale.join(', ')}. Remove the row rather than leaving it to pass vacuously.`);
  } else {
    ok(`A0 every <RadialGradient> in src/ is a named member (${withRadial.length} of ${files.length} files): ${[...KNOWN].map(([f, o]) => `${path.basename(f)} = ${o}`).join('; ')}`);
  }
}

// A1 — one hue. Every <Stop>'s stopColor is the same expression, and it is
// the `color` prop. MB-D1's three-hue stack (accent / accentDeep /
// washYellow) is struck by measurement — see section F.
{
  const stops = [];
  visit(componentAst, (n) => {
    if (n.type === 'JSXOpeningElement' && jsxName(n) === 'Stop') stops.push(n);
  });
  if (stops.length < 2) {
    bad('A1 one hue', `found ${stops.length} <Stop> elements; the ramp cannot be read`);
  } else {
    const colours = stops.map((s) => {
      const a = attr(s, 'stopColor');
      if (!a || !a.value || a.value.type !== 'JSXExpressionContainer') return '<unresolved>';
      const e = a.value.expression;
      return e.type === 'Identifier' ? e.name : `<${e.type}>`;
    });
    const distinct = [...new Set(colours)];
    if (distinct.length === 1 && distinct[0] === 'color') {
      ok(`A1 all ${stops.length} stops paint the \`color\` prop — one hue, identity from the prop (§34)`);
    } else {
      bad('A1 one hue', `stop colours resolve to [${colours.join(', ')}] — a multi-hue stack puts the bloom's darkest point in a ring (section F)`);
    }
  }
}

// A2 — alpha is carried by stopOpacity, never inside stopColor.
// react-native-svg discards the alpha channel of a stop's colour (Lumen's
// build rider, 2026-08-28), so an `rgba()`/8-digit stop renders fully opaque.
{
  const stops = [];
  visit(componentAst, (n) => {
    if (n.type === 'JSXOpeningElement' && jsxName(n) === 'Stop') stops.push(n);
  });
  const missing = stops.filter((s) => !attr(s, 'stopOpacity'));
  if (missing.length) bad('A2 alpha on stopOpacity', `${missing.length} <Stop> without an explicit stopOpacity`);
  else ok(`A2 all ${stops.length} stops state stopOpacity explicitly (rn-svg drops alpha inside stopColor)`);
}

// A3 — the ramp ends fully transparent. This is the whole reason GlowOrb
// replaced the flat discs: a terminal stop above zero is a visible circular
// edge no matter how low its opacity.
{
  const stops = [];
  visit(componentAst, (n) => {
    if (n.type === 'JSXOpeningElement' && jsxName(n) === 'Stop') stops.push(n);
  });
  const last = stops[stops.length - 1];
  const a = last && attr(last, 'stopOpacity');
  const v = a && a.value && a.value.type === 'StringLiteral' ? a.value.value : null;
  if (v === null) bad('A3 no edge', 'the terminal stop\'s stopOpacity is not a readable literal — cannot tell');
  else if (Number(v) === 0) ok('A3 the ramp terminates at stopOpacity 0 — no circular edge');
  else bad('A3 no edge', `terminal stopOpacity is ${v}: a bloom that ends above zero has a visible edge`);
}

console.log('\nB. one-shot, never ambient');

// B1 — the exclusion exists in the component and it throws.
{
  const hasThrow = /breathe\s*&&\s*staged\s*!==\s*undefined/.test(componentSrc)
    && /throw new Error\(/.test(componentSrc);
  if (hasThrow) ok('B1 `breathe` + `staged` throws in the component rather than one silently winning');
  else bad('B1 exclusion', 'no `breathe && staged !== undefined` throw found — the score\'s central constraint is unenforced');
}

// B2 — no call site passes both. The throw is a runtime backstop; this is
// the row that fires without anyone opening the screen.
{
  const sites = [];
  for (const f of files) {
    const src = await readFile(f, 'utf8');
    if (!/<GlowOrb/.test(src)) continue;
    visit(ast(src), (n) => {
      if (n.type === 'JSXOpeningElement' && jsxName(n) === 'GlowOrb') {
        sites.push({ file: path.relative(root, f), line: n.loc.start.line, props: attrNames(n) });
      }
    });
  }
  if (!sites.length) {
    bad('B2 call sites', 'zero <GlowOrb> call sites found — the extractor is blind, not the app empty');
  } else {
    const both = sites.filter((s) => s.props.includes('breathe') && s.props.includes('staged'));
    if (both.length) bad('B2 call sites', `${both.length} site(s) pass both breathe and staged: ${both.map((s) => `${s.file}:${s.line}`).join(', ')}`);
    else ok(`B2 ${sites.length} <GlowOrb> call sites, none passes both breathe and staged (${sites.map((s) => `${s.file}:${s.line}`).join(', ')})`);
  }
}

// B3 — extractor calibration, both directions. A row that only ever reports
// "none found" cannot tell a clean tree from a blinded probe.
{
  const positive = ast('const a = <GlowOrb breathe staged={x} />;');
  const negative = ast('const b = <GlowOrb staged={x} />;');
  let hitP = false, hitN = false;
  visit(positive, (n) => {
    if (n.type === 'JSXOpeningElement' && jsxName(n) === 'GlowOrb') {
      const p = attrNames(n);
      hitP = p.includes('breathe') && p.includes('staged');
    }
  });
  visit(negative, (n) => {
    if (n.type === 'JSXOpeningElement' && jsxName(n) === 'GlowOrb') {
      const p = attrNames(n);
      hitN = p.includes('breathe') && p.includes('staged');
    }
  });
  if (hitP && !hitN) ok('B3 the B2 extractor is calibrated both ways — flags a both-props site, clears a staged-only one');
  else bad('B3 calibration', `extractor mis-calibrated: positive=${hitP} (want true), negative=${hitN} (want false)`);
}

console.log('\nC. reduced motion removes the entrance, not the light');

// C1 — the staged branch reads the RESOLVED accessibility state. Assuming
// full motion while the async read is in flight means a Reduce-Motion user
// sees the front of the entrance and then a snap, which is a motion.
{
  const importsResolved = /useReducedMotionState/.test(componentSrc);
  const usesBoolean = /\buseReducedMotion\s*\(/.test(componentSrc);
  const destructures = /\{\s*reduced\s*,\s*resolved\s*\}\s*=\s*useReducedMotionState\(\)/.test(componentSrc);
  if (importsResolved && destructures && !usesBoolean) {
    ok('C1 the component reads { reduced, resolved } from useReducedMotionState — the one-shot does not race the async read');
  } else {
    bad('C1 resolved gate', `useReducedMotionState imported=${importsResolved}, destructured=${destructures}, bare boolean hook still called=${usesBoolean}`);
  }
}

// C2 — the staged effect actually holds on `resolved`, and its reduced arm
// sets the value rather than animating to it. Checking THAT a guard is
// wired is not checking it is correct.
{
  let effect = null;
  visit(componentAst, (n) => {
    if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && n.callee.name === 'useEffect') {
      const body = componentSrc.slice(n.start, n.end);
      if (/staging/.test(body)) effect = body;
    }
  });
  if (!effect) {
    bad('C2 staged effect', 'no useEffect mentioning `staging` found — cannot tell');
  } else {
    const holds = /!staging\s*\|\|\s*!resolved/.test(effect);
    const snaps = /if\s*\(reduced\)\s*\{[\s\S]*?stage\.setValue\(/.test(effect);
    const depsOnResolved = /\[\s*staging\s*,\s*staged\s*,\s*reduced\s*,\s*resolved\s*,\s*stage\s*\]/.test(effect);
    if (holds && snaps && depsOnResolved) ok('C2 the staged effect holds until `resolved`, snaps with setValue under Reduce Motion, and deps on `resolved`');
    else bad('C2 staged effect', `holds-until-resolved=${holds}, reduced-arm-uses-setValue=${snaps}, resolved-in-deps=${depsOnResolved}`);
  }
}

// C3 — reduced motion does NOT swap the pigment. MB-D1's reduced variant
// floods `washYellow`; section F measures that as invisible on Today's
// ground, so the swap would cost the reduced user the stage itself.
// Read from the AST, not the text: this file's own header comment argues at
// length about `washYellow`, and a lexical rule that cannot tell an argument
// from a reference reds the one file it exists to protect.
{
  const refs = [];
  visit(componentAst, (n) => {
    if (n.type === 'Identifier' && n.name === 'washYellow') refs.push(n.loc.start.line);
  });
  if (refs.length) {
    bad('C3 pigment under RM', `the component REFERENCES washYellow at line(s) ${refs.join(', ')} — the score's reduced-motion flood renders nothing on \`background\` (section F)`);
  } else {
    ok('C3 reduced motion keeps `color` — no washYellow reference in code (the header argues about it; that is prose, not a pigment)');
  }
}

// C3b — calibration for C3's extractor, both directions. An AST rule that
// only ever reports "clean" cannot tell a clean component from a blind probe.
{
  const probe = (src) => {
    const hits = [];
    visit(ast(src), (n) => { if (n.type === 'Identifier' && n.name === 'washYellow') hits.push(n); });
    return hits.length;
  };
  const positive = probe('const a = theme.colors.washYellow;');
  const negative = probe('// washYellow is struck, see the header\nconst b = theme.colors.accent;');
  if (positive === 1 && negative === 0) ok('C3b the C3 extractor is calibrated both ways — finds a real reference, ignores the word in a comment');
  else bad('C3b calibration', `positive probe found ${positive} (want 1), comment-only probe found ${negative} (want 0)`);
}

console.log('\nD. the score lives in motion.js, not in the component');

// D1 — no bare millisecond literals in the staged path.
{
  let effect = null;
  visit(componentAst, (n) => {
    if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && n.callee.name === 'useEffect') {
      const body = componentSrc.slice(n.start, n.end);
      if (/staging/.test(body)) effect = body;
    }
  });
  if (!effect) bad('D1 score location', 'staged effect not found — cannot tell');
  else {
    const fromTokens = /BLOOM\.entrance/.test(effect) && /BLOOM\.fade/.test(effect)
      && /BLOOM_EASING\.entrance/.test(effect) && /BLOOM_EASING\.fade/.test(effect);
    const literals = (effect.match(/duration:\s*\d/g) || []).length;
    if (fromTokens && literals === 0) ok('D1 entrance/fade durations and easings all resolve to BLOOM / BLOOM_EASING — no literal in the staged path');
    else bad('D1 score location', `tokens used=${fromTokens}, literal durations in the staged effect=${literals}`);
  }
}

// D2 — one driver per animated value. `AnimatedValue` holds a single
// `_animation`, so a value fed by both `pulse` and `stage` has one of them
// silently stopped. Each branch of each ternary must name exactly one.
{
  for (const name of ['opacity', 'scale']) {
    let decl = null;
    visit(componentAst, (n) => {
      if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.id.name === name) decl = n;
    });
    if (!decl || decl.init.type !== 'ConditionalExpression') {
      bad(`D2 ${name} driver`, `\`${name}\` is not a conditional on \`staging\` — cannot tell which value drives it`);
      continue;
    }
    const arm = (node) => {
      const s = componentSrc.slice(node.start, node.end);
      return { pulse: /\bpulse\b/.test(s), stage: /\bstage\b/.test(s) };
    };
    const t = arm(decl.init.consequent), f = arm(decl.init.alternate);
    if (t.stage && !t.pulse && f.pulse && !f.stage) ok(`D2 \`${name}\`: staged arm reads \`stage\` only, unstaged arm reads \`pulse\` only — one driver per value`);
    else bad(`D2 ${name} driver`, `staged arm {stage:${t.stage}, pulse:${t.pulse}}, unstaged arm {stage:${f.stage}, pulse:${f.pulse}}`);
  }
}

const themeSrc = await readFile(path.join(SRC, 'constants', 'theme.js'), 'utf8');
const token = (name) => {
  const m = new RegExp(`^\\s*${name}:\\s*'(#[0-9A-Fa-f]{6})'`, 'm').exec(themeSrc);
  return m ? m[1] : null;
};
const rgb = (h) => { const c = parseColor(h); return [c.r, c.g, c.b]; };
const Lstar = (c) => rgbToLab({ r: c[0], g: c[1], b: c[2] }).L;
const overGround = (hex, alpha, groundHex) => {
  const c = rgb(hex), g = rgb(groundHex);
  return c.map((v, k) => v * alpha + g[k] * (1 - alpha));
};
// Contrast of an opaque text token against an already-composited ground.
const lumOf = (c) => { const f = c.map((v) => { const t = v / 255; return t <= 0.03928 ? t / 12.92 : ((t + 0.055) / 1.055) ** 2.4; }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
const ratioOf = (textHex, groundArr) => {
  const la = lumOf(rgb(textHex)), lb = lumOf(groundArr);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

console.log('\nE. the three modes, and the one that renders no multiplier');

// The mode census, and it is an ASSERTION rather than a census line. E1 used
// to print whatever it found and pass — including "0 sites", which is a
// blinded extractor reported as a clean app. It also called the population
// "the three static/breathe sites" while there were four unstaged mounts and
// two static ones; a count in a comment that nothing checks is how a wrong
// number survives being quoted twice (it reached my core note and a
// ratification message before this row was written).
const orbSites = await (async () => {
  const out = [];
  for (const f of files) {
    const src = await readFile(f, 'utf8');
    if (!/<GlowOrb/.test(src)) continue;
    const fileAst = ast(src);
    visit(fileAst, (n) => {
      if (n.type !== 'JSXOpeningElement' || jsxName(n) !== 'GlowOrb') return;
      const props = attrNames(n);
      out.push({
        file: path.relative(root, f), line: n.loc.start.line, props, src, ast: fileAst, el: n,
        mode: props.includes('staged') ? 'staged' : props.includes('breathe') ? 'breathe' : 'static',
      });
    });
  }
  return out;
})();

{
  const by = (m) => orbSites.filter((s) => s.mode === m);
  const [staged, breathing, still] = ['staged', 'breathe', 'static'].map(by);
  if (!orbSites.length) {
    bad('E1 the mode census', 'zero <GlowOrb> mounts found — the extractor is blind, not the app empty. Every row below would be vacuous.');
  } else if (orbSites.some((s) => s.props.includes('staged') && s.props.includes('breathe'))) {
    bad('E1 the mode census', 'a call site passes both `staged` and `breathe`; the component throws on that pair, so this is a crash, not a mode.');
  } else {
    ok(
      `E1 ${orbSites.length} mount(s), each in exactly one mode — ${staged.length} staged (${staged.map((s) => `${s.file}:${s.line}`).join(', ') || 'none'}), ` +
        `${breathing.length} breathe (${breathing.map((s) => `${s.file}:${s.line}`).join(', ') || 'none'}), ` +
        `${still.length} static (${still.map((s) => `${s.file}:${s.line}`).join(', ') || 'none'})`,
    );
  }
}

// E1b — the STAGED consumer set, asserted by identity and not by count.
//
// Section J's eleven rows were removed with SealHive and deliberately not
// re-pointed at PackageOpen; that routing is now CLOSED as
// cannot-be-re-pointed (see the note at the foot of this file). The reason it
// closed is the reason this row exists: J read a bloom's composited core, and
// PackageOpen mounts no bloom, so MB-D1's binding rule ("the screen's OWN
// ground") is asserted on ONE consumer where it used to be asserted on two.
//
// WHAT WOULD SEE A SECOND STAGED MOUNT TODAY: nothing in this file, and that
// is read off the sections rather than assumed. H is the only section that
// resolves a staged call site and it opens `src/screens/TodayTab.js` by path.
// F re-derives the colour ruling off live tokens against `background` at the
// component's own default, so it is ground-generic and call-site-blind — it
// would report the same four numbers with a second staged light on any ground
// at all. E4 filters to `mode === 'static'`. So a rule with a single customer
// is one mount away from being asserted on the wrong one, silently: a second
// staged light would stage words over a ground no row here reads, and every
// row would keep passing. E1b is the row that notices.
//
// SET, NOT COUNT, and FILE-KEYED (Lumen's two requirements, 2026-09-04). A
// bare `=== 1` goes red on two mounts but cannot say which one is new, and a
// red row whose repair is "bump the number" is a blanket accept. Keying on
// the file rather than file:line means ordinary line drift inside TodayTab
// cannot manufacture that same blanket accept.
{
  const STAGED_CONSUMERS = new Map([
    [
      'src/screens/TodayTab.js',
      'the greeting hero\'s stage light — the one staged call site section H resolves prop by prop, over the ground H6 composites its text on',
    ],
  ]);
  const staged = orbSites.filter((s) => s.mode === 'staged');
  const found = [...new Set(staged.map((s) => s.file))].sort();
  const added = found.filter((f) => !STAGED_CONSUMERS.has(f));
  const gone = [...STAGED_CONSUMERS.keys()].filter((f) => !found.includes(f));
  if (added.length) {
    bad(
      'E1b the staged consumer set',
      `${added.length} screen(s) mount a staged GlowOrb that this list does not name: ${added.join(', ')}. ` +
        'A staged light stages words on a ground, so name the file here WITH the ground it lights, and give ' +
        'this gate a row that composites text over that ground the way H6 does for TodayTab. H is written ' +
        'against TodayTab by path and F is ground-generic, so neither will measure the newcomer for you. ' +
        'Do not widen the list without measuring it.',
    );
  } else if (gone.length) {
    bad(
      'E1b the staged consumer set',
      `${gone.length} named consumer(s) no longer mount a staged GlowOrb: ${gone.join(', ')}. Either the mount ` +
        'moved and this list has not followed it, or the staged mode lost a customer and the rows aimed at that ' +
        'screen are now measuring a light it does not ship. Re-point or remove the entry rather than leaving it ' +
        'to pass vacuously.',
    );
  } else {
    ok(
      `E1b the staged mode has exactly the named consumer set (${found.length}): ` +
        `${[...STAGED_CONSUMERS].map(([f, why]) => `${path.basename(f)} = ${why}`).join('; ')}`,
    );
  }
}

// The declaration chain for a rendered value, walked to its LAST alternate —
// the arm a call site reaches by passing neither prop.
const renderArms = (name) => {
  let decl = null;
  visit(componentAst, (n) => {
    if (n.type !== 'VariableDeclarator') return;
    if (n.id.type !== 'Identifier' || n.id.name !== name) return;
    decl = n.init;
  });
  if (!decl || decl.type !== 'ConditionalExpression') return null;
  const arms = [];
  let cur = decl;
  while (cur && cur.type === 'ConditionalExpression') {
    arms.push({ test: componentSrc.slice(cur.test.start, cur.test.end), value: cur.consequent });
    cur = cur.alternate;
  }
  return { arms, fallthrough: cur };
};

// E2 — the static arm carries NO multiplier. This is the whole repair: a
// light passed neither prop rendered through the breathing arm, where `pulse`
// rests at 0.5, so `intensity` came out at 0.875x and `size` drew at 1.04x.
// Asserted on the SHAPE of the fallthrough rather than on a number, because
// the defect was a number that was arithmetically consistent with itself.
{
  const op = renderArms('opacity');
  const sc = renderArms('scale');
  if (!op || !sc) {
    bad('E2 the static arm renders what the call site wrote', `could not read the ${!op ? 'opacity' : 'scale'} declaration as a conditional chain — the modes are no longer decided where this row looks.`);
  } else if (op.arms.length < 2 || sc.arms.length < 2) {
    bad(
      'E2 the static arm renders what the call site wrote',
      `opacity has ${op.arms.length} guarded arm(s) and scale ${sc.arms.length}; there are three modes and a two-arm chain means one of them is falling through to another's driver — which is exactly the defect this row exists for.`,
    );
  } else {
    const opF = op.fallthrough, scF = sc.fallthrough;
    const opOk = opF && opF.type === 'Identifier' && opF.name === 'intensity';
    const scOk = scF && scF.type === 'NumericLiteral' && scF.value === 1;
    if (!opOk || !scOk) {
      bad(
        'E2 the static arm renders what the call site wrote',
        `a light in neither mode renders opacity \`${opF ? componentSrc.slice(opF.start, opF.end) : 'none'}\` and scale ` +
          `\`${scF ? componentSrc.slice(scF.start, scF.end) : 'none'}\`. It must be \`intensity\` and \`1\` exactly — ` +
          'anything else is a multiplier on a prop that names the quantity, and it fails silently because the ' +
          'rendered result is still self-consistent. §34: strength IS `intensity`.',
      );
    } else {
      ok('E2 a light in neither mode renders `intensity` and scale 1 — no driver, no interpolation, no multiplier between the call site and the screen');
    }
  }
}

// E3 — CALIBRATION for E2, and the no-regression row for the four mounts that
// do not move. The breathing arm must still carry its own numbers, INCLUDING
// under Reduce Motion, where `pulse` parks at 0.5 and a breather renders
// 0.875x on purpose: a breath frozen at its own midpoint is a settled state,
// which is a different question from a light that never breathes.
{
  const op = renderArms('opacity');
  const breatheArm = op?.arms?.find((a) => /breath/i.test(a.test));
  const txt = breatheArm ? componentSrc.slice(breatheArm.value.start, breatheArm.value.end) : '';
  const keepsRange = /intensity\s*\*\s*0\.75/.test(txt) && /intensity/.test(txt);
  const parksAtMid = /pulse\.setValue\(0\.5\)/.test(componentSrc);
  if (!breatheArm) {
    bad('E3 the breathing arm is unmoved', 'no arm of the opacity chain is guarded by a breathing test, so the ambient sites\' behaviour is not decidable here. E2 would then be asserting the only arm there is.');
  } else if (!keepsRange || !parksAtMid) {
    bad(
      'E3 the breathing arm is unmoved',
      `the breathing arm is \`${txt}\` and pulse-parks-at-0.5 is ${parksAtMid}. The static repair was scoped to leave ` +
        'ambient alone; a change here moves Onboarding, which nothing has ratified. (CoreRitual was the ' +
        'second breathing mount until R-OD retired the Lock gate on 2026-09-05; `breathe` now has one consumer.)',
    );
  } else {
    ok('E3 calibration: the breathing arm still spans [intensity x 0.75, intensity] and still parks at pulse 0.5 under Reduce Motion — the repair reaches the static arm and stops there');
  }
}

// E4 — NO REGRESSION on the words. The static sites got BRIGHTER (their core
// alpha rose from 0.875x the declared value to the declared value), and a
// brighter core is a darker composite under gold. So every ink token that can
// sit over one must not LOSE a floor it held. Pre-existing failures are
// reported rather than swallowed — this row is about what the change costs,
// not about what it inherited.
{
  const grounds = new Map();
  const colourFor = (site) => {
    const a = attr(site.el, 'color');
    const lit = a?.value?.type === 'JSXExpressionContainer' ? site.src.slice(a.value.expression.start, a.value.expression.end) : null;
    if (lit && /^theme\.colors\.[A-Za-z]+$/.test(lit)) return { names: [lit.split('.').pop()], how: 'the call site\'s literal' };
    if (!a) return { names: ['accent'], how: 'the component default' };
    // Not a literal — enumerate the reachable domain instead of guessing, and
    // say that is what happened (§0: a domain claim inherits the scope of the
    // probe that produced it). The consumer reads `<something>.<key>` off a
    // list element (`key` taken from `lit` itself, not assumed, since R127.1
    // renamed this key from `color` to `glow` specifically so a hardcoded
    // 'color' probe would go stale the moment the field moved) so the
    // population is `<key>:` on objects that are ARRAY ELEMENTS. Every
    // `color:` in the file was the wrong probe when this was hardcoded: it
    // swept up the StyleSheet's text colours and reported `ink` and
    // `inkSoft` as candidate glow hues, which turned four pre-existing text
    // pairs into twelve nonsense ones. A StyleSheet block is a property of one
    // object; a slide is an element of a list. That is the discriminator.
    const key = lit?.split('.').pop();
    const names = new Set();
    visit(site.ast, (n) => {
      if (!key || n.type !== 'ArrayExpression') return;
      for (const el of n.elements) {
        if (!el || el.type !== 'ObjectExpression') continue;
        const c = el.properties.find((x) => x.type === 'ObjectProperty' && (x.key.name ?? x.key.value) === key);
        if (!c) continue;
        const m = /^theme\.colors\.([A-Za-z]+)$/.exec(site.src.slice(c.value.start, c.value.end));
        if (m) names.add(m[1]);
      }
    });
    return names.size ? { names: [...names], how: `enumerated from the ${site.file} list elements that supply \`${lit}\`` } : null;
  };
  const groundFor = (site) => {
    let out = null;
    visit(site.ast, (n) => {
      if (out || n.type !== 'ObjectProperty' || (n.key.name ?? n.key.value) !== 'container') return;
      if (n.value.type !== 'ObjectExpression') return;
      const bg = n.value.properties.find((x) => x.type === 'ObjectProperty' && (x.key.name ?? x.key.value) === 'backgroundColor');
      if (bg) out = /^theme\.colors\.([A-Za-z]+)$/.exec(site.src.slice(bg.value.start, bg.value.end))?.[1] ?? null;
    });
    return out;
  };
  const still = orbSites.filter((s) => s.mode === 'static');
  const lost = [], preexisting = [], checked = [];
  let blind = null;
  for (const site of still) {
    const iAttr = attr(site.el, 'intensity');
    let declared = null;
    try { declared = Number(site.src.slice(iAttr.value.expression.start, iAttr.value.expression.end)); } catch { declared = null; }
    const col = colourFor(site);
    const gName = groundFor(site);
    if (declared === null || Number.isNaN(declared) || !col || !gName || !token(gName)) {
      blind = `${site.file}:${site.line} (intensity=${declared}, colour=${col ? col.names.join('/') : 'unresolved'}, ground=${gName ?? 'unresolved'})`;
      break;
    }
    grounds.set(site.file, gName);
    for (const cn of col.names) {
      const cTok = token(cn);
      if (!cTok) { blind = `${site.file}:${site.line} colour token \`${cn}\``; break; }
      for (const tn of ['ink', 'inkSoft']) {
        const before = ratioOf(token(tn), overGround(cTok, declared * 0.875, token(gName)));
        const after = ratioOf(token(tn), overGround(cTok, declared, token(gName)));
        checked.push(`${site.file}:${site.line} ${cn}/${tn} ${before.toFixed(4)}->${after.toFixed(4)}`);
        if (before >= 4.5 && after < 4.5) lost.push(`${site.file}:${site.line} ${tn} over ${cn} falls ${before.toFixed(4)} -> ${after.toFixed(4)}`);
        else if (before < 4.5) preexisting.push(`${site.file}:${site.line} ${tn} over ${cn} was ALREADY ${before.toFixed(4)} and is now ${after.toFixed(4)}`);
      }
    }
    if (blind) break;
  }
  if (blind) {
    bad('E4 the repair costs no floor', `could not resolve ${blind}, so the change's cost is unmeasured. Fails closed — a brighter core is a darker composite and that is the direction that costs text.`);
  } else if (!checked.length) {
    bad('E4 the repair costs no floor', 'no static mount resolved, so this row measured nothing. If the static arm has genuinely gone unused, delete it and E2 with it rather than leaving a green row over an empty set.');
  } else if (lost.length) {
    bad('E4 the repair costs no floor', `the static repair drops text under 4.5:1: ${lost.join('; ')}. Retune the call site's \`intensity\` — that is the prop §34 gives for exactly this.`);
  } else {
    ok(
      `E4 ${checked.length} (site x colour x ink token) pair(s) re-measured over each screen's own ground ` +
        `(${[...grounds].map(([f, g]) => `${f} -> ${g}`).join(', ')}): no floor lost to the repair` +
        (preexisting.length ? `. PRE-EXISTING and not caused here — ${preexisting.join('; ')}` : '') +
        `. Worst pair after: ${checked.map((c) => [c, Number(c.split('->')[1])]).sort((a, b) => a[1] - b[1])[0][0]}`,
    );
  }
}

console.log('\nF. the colour ruling that struck the three-hue stack, re-derived live');

const TOKENS = ['accent', 'accentDeep', 'washYellow', 'background'].reduce((acc, n) => {
  acc[n] = token(n); return acc;
}, {});

// F0 — the extractor found real hexes. A token read that silently returns
// null would make every row below vacuously pass.
{
  const missing = Object.entries(TOKENS).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) bad('F0 token read', `could not read ${missing.join(', ')} out of theme.js`);
  else ok(`F0 live tokens read from theme.js: ${Object.entries(TOKENS).map(([k, v]) => `${k} ${v}`).join(', ')}`);
}


// F1 — accentDeep sits FURTHER below the ground than accent, which is why a
// stack with accentDeep outside accent has its lightness minimum in a ring.
if (TOKENS.accent && TOKENS.accentDeep && TOKENS.background) {
  const gL = Lstar(rgb(TOKENS.background));
  const dAccent = Lstar(overGround(TOKENS.accent, 0.5, TOKENS.background)) - gL;
  const dDeep = Lstar(overGround(TOKENS.accentDeep, 0.5, TOKENS.background)) - gL;
  if (dDeep < dAccent) ok(`F1 on \`background\` at 50%: accent dL* ${dAccent.toFixed(3)}, accentDeep dL* ${dDeep.toFixed(3)} — accentDeep is ${(dAccent - dDeep).toFixed(3)} L* deeper, so an accentDeep ring around an accent core is a dark annulus`);
  else bad('F1 ring mechanism', `accentDeep dL* ${dDeep.toFixed(3)} is no longer below accent's ${dAccent.toFixed(3)} — the ruling that struck MB-D1's stack rests on this and must be re-derived`);
}

// F2 — washYellow cannot be seen on `background` even fully opaque, so it
// cannot be the bloom's outer ring on Today and cannot be its reduced-motion
// flood either.
if (TOKENS.washYellow && TOKENS.background) {
  const d = deltaE00(TOKENS.washYellow, TOKENS.background);
  if (d < 2.3) ok(`F2 washYellow vs background dE00 ${d.toFixed(4)} at FULL opacity — below a JND, so the scored 10-20% outer ring is a more expensive spelling of "transparent"`);
  else bad('F2 outer stop', `washYellow vs background is now dE00 ${d.toFixed(4)} — above a JND, so the strike on MB-D1's third stop no longer follows and must be re-argued`);
}

// F3 — the bloom never costs the words it stages. Worst case is the core,
// where the ground is darkest.
{
  const inkSoft = token('inkSoft');
  const ink = token('ink');
  if (!inkSoft || !ink || !TOKENS.accent || !TOKENS.background) {
    bad('F3 text over the bloom', 'could not read ink / inkSoft');
  } else {
    // Core of the shipped ramp at GlowOrb's default intensity, static layer
    // opacity 0.875 * 0.5 (the breathe interpolation held at its midpoint).
    const core = overGround(TOKENS.accent, 0.4375, TOKENS.background);
    const lum = (c) => {
      const f = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
    };
    const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
    const rInk = ratio(rgb(ink), core), rSoft = ratio(rgb(inkSoft), core);
    if (rInk >= 4.5 && rSoft >= 4.5) ok(`F3 over the bloom's core: ink ${rInk.toFixed(4)}:1, inkSoft ${rSoft.toFixed(4)}:1 — both clear 4.5:1 (headroom ${(rSoft - 4.5).toFixed(4)} on the weaker)`);
    else bad('F3 text over the bloom', `ink ${rInk.toFixed(4)}:1, inkSoft ${rSoft.toFixed(4)}:1 against a 4.5:1 floor — the stage light is costing the words it stages`);
  }
}


// ---------------------------------------------------------------------------
// G. the settle that cues the stage exists on the path the stage is on
//
// MB-D1's bloom and MB-P1's copy are both cued by a hero's settle. `FlyingBee`
// has exactly one settle callback, `onSettle`, and until P1a it fired ONLY on
// the preset path — at the end of a preset flight, and immediately when that
// flight was suppressed. A RESIDENT bee (no `preset`, anchors from
// `usePerchSet`) reaches home through `start()` and then rests on a plan whose
// `durationMs` is null, which is the ABSENCE of an animation rather than a
// zero-length one: there is no completion callback for a settle to hang off,
// so `onSettle` could not fire at all.
//
// That is invisible in every way a reviewer normally looks. The prop exists,
// the name reads correctly, the wiring type-checks, and the failure is a
// permanently blank line on the screen the app opens to — DES-17's forfeit
// class. `ChoreographedText`'s reduced branch does NOT rescue it: that branch
// reads `reduced` alone, so a Reduce-Motion user is fine and a full-motion
// user is the one who loses the words.
//
// The row asserts the POSITIVE property — the resident path announces its
// settle — rather than blocklisting the shape that used to be wrong.
{
  const src = await readFile(path.join(SRC, 'components', 'FlyingBee.js'), 'utf8');
  const tree = ast(src);

  // G1 — `start()` (the one moment a resident goes from nowhere to home)
  // reaches `onSettleRef`. Resolved as containment in the function that
  // declares it, never as a line number.
  let startFn = null;
  visit(tree, (n) => {
    if (n.type === 'VariableDeclarator' && n.id?.name === 'start' && n.init) startFn = n.init;
  });
  if (!startFn) {
    bad('G1 resident settle', 'could not find `start` in FlyingBee.js — the extractor is blind, not the code clean');
  } else {
    let firesSettle = false;
    let guarded = false;
    visit(startFn, (n) => {
      if (n.type === 'MemberExpression' && n.object?.name === 'onSettleRef' && n.property?.name === 'current') firesSettle = true;
      if (n.type === 'MemberExpression' && n.object?.name === 'residentSettledRef' && n.property?.name === 'current') guarded = true;
    });
    if (firesSettle && guarded) ok('G1 the resident path announces its settle, once — `start()` reaches onSettleRef behind a once-guard');
    else if (firesSettle) bad('G1 resident settle', '`start()` fires onSettle but with no once-guard — `start()` is retried until the anchor measures, and Lane P3 gives the greeting ONE arrival');
    else bad('G1 resident settle', '`start()` does not reach onSettleRef — a resident hero cannot cue MB-D1 bloom or MB-P1 copy, and a boolean `active` wired to it is a permanently blank line');
  }

  // G2 — calibration. The extractor must be able to say NO. Strip the fire
  // out of a copy of the source and confirm G1's finder goes red on it,
  // otherwise a green G1 proves only that the walker ran.
  const stripped = src.replace(/if \(!residentSettledRef\.current\) \{[\s\S]*?\n    \}/, '');
  if (stripped === src) {
    bad('G2 calibration', 'could not produce a mutated copy — G1 is unverified in the red direction');
  } else {
    let strippedStartFn = null;
    visit(ast(stripped), (n) => {
      if (n.type === 'VariableDeclarator' && n.id?.name === 'start' && n.init) strippedStartFn = n.init;
    });
    let stillFires = false;
    visit(strippedStartFn, (n) => {
      if (n.type === 'MemberExpression' && n.object?.name === 'onSettleRef' && n.property?.name === 'current') stillFires = true;
    });
    if (!stillFires) ok('G2 the G1 extractor is calibrated in the red direction — removing the fire makes it fail');
    else bad('G2 calibration', 'G1 still passes on a source with the resident fire removed — the row cannot detect the defect it exists for');
  }

  // G3 — the preset path keeps its own settle. The resident fire is an
  // ADDITION; if it ever became a replacement, Welcome's `loginArc` would
  // hang on a callback that never arrives and the wordmark arc would never
  // hand back. Two distinct fire sites is the property.
  let fireSites = 0;
  visit(tree, (n) => {
    if (n.type === 'OptionalCallExpression' || n.type === 'CallExpression') {
      const c = n.callee;
      // `onSettleRef.current?.()` — the callee is the MemberExpression
      // `onSettleRef.current`, so the identifier sits at `callee.object`,
      // one level up from where a chained `a.b.c()` would put it. Getting
      // this wrong is why the row is written to fail closed: it read 0 fire
      // sites on a file with three, and said so, rather than greening.
      if (c?.type === 'OptionalMemberExpression' || c?.type === 'MemberExpression') {
        if (c.object?.name === 'onSettleRef' && c.property?.name === 'current') fireSites += 1;
      }
    }
  });
  if (fireSites >= 3) ok(`G3 ${fireSites} onSettle fire sites — the resident's is an addition, the preset path (flight end + suppressed) keeps both of its own`);
  else bad('G3 preset settle', `${fireSites} onSettle fire site(s), expected at least 3 (preset flight end, preset suppressed, resident home) — a replacement rather than an addition hangs Welcome's loginArc`);
}


console.log('\nH. P1a — the greeting adoption, measured at the props the call site passes');

// The first real consumer of the staged mode: `TodayTab` puts a 132pt hero in
// the greeting's negative space and this light behind him.
//
// EVERY ROW HERE RESOLVES THE CALL SITE'S OWN VALUES rather than the
// component's defaults. Section F measured the bloom at `intensity` 0.5 x
// 0.875 — GlowOrb's default through the breathe interpolation — and the call
// site passes 0.55 into the staged branch, which reaches its argument exactly.
// A rig that renders a component with its defaults checks a flight nobody
// flies (R82); the same is true of a rig that measures a colour nobody ships.
{
  const todaySrc = await readFile(path.join(SRC, 'screens', 'TodayTab.js'), 'utf8');
  const todayAst = ast(todaySrc);
  const mascotSrc = await readFile(path.join(SRC, 'constants', 'mascot.js'), 'utf8');

  // The mascot constants, evaluated from their own source. `MASCOT_WIDTH_FRACTION`
  // is written `16.4 / 24`, so a regex for a number does not read it.
  const mascotConst = (name) => {
    const m = new RegExp(`export const ${name} = ([^;]+);`).exec(mascotSrc);
    if (!m) return null;
    try { return Function(`"use strict"; return (${m[1]});`)(); } catch { return null; }
  };
  const MASCOT = {
    MASCOT_WIDTH_FRACTION: mascotConst('MASCOT_WIDTH_FRACTION'),
    MASCOT_BASE_PX: mascotConst('MASCOT_BASE_PX'),
  };

  // The door's column, read live from the two files that own it rather than
  // restated here. `DOOR_RESERVE` is written `DOOR_SIZE + theme.spacing.md`,
  // so it is evaluated in a scope holding both — same shape as `mascotConst`,
  // and for the same reason (R12: adopt the source's own expression; a copy
  // stays self-consistent while the app drifts).
  const doorSrc = await readFile(path.join(SRC, 'navigation', 'AccountDoor.js'), 'utf8');
  const layoutSrc = await readFile(path.join(SRC, 'navigation', 'tabBarLayout.js'), 'utf8');
  const spacingScale = (() => {
    const m = /spacing:\s*\{([^}]*)\}/.exec(themeSrc);
    if (!m) return null;
    const out = {};
    for (const [, k, v] of m[1].matchAll(/(\w+):\s*(\d+)/g)) out[k] = Number(v);
    return out;
  })();
  const DOOR = (() => {
    const sizeM = /export const DOOR_SIZE = ([^;]+);/.exec(doorSrc);
    const reserveM = /export const DOOR_RESERVE = ([^;]+);/.exec(layoutSrc);
    if (!sizeM || !reserveM || !spacingScale) return { DOOR_SIZE: null, DOOR_RESERVE: null };
    let DOOR_SIZE = null;
    try { DOOR_SIZE = Function(`"use strict"; return (${sizeM[1]});`)(); } catch { DOOR_SIZE = null; }
    let DOOR_RESERVE = null;
    try {
      // eslint-disable-next-line no-new-func
      DOOR_RESERVE = Function('DOOR_SIZE', 'theme', `"use strict"; return (${reserveM[1]});`)(
        DOOR_SIZE, { spacing: spacingScale },
      );
    } catch { DOOR_RESERVE = null; }
    return { DOOR_SIZE, DOOR_RESERVE };
  })();

  // The screen's module-level numeric constants, evaluated in a scope holding
  // the mascot ones. Only arithmetic declarators are admitted — a component or
  // a `StyleSheet.create` would need React to evaluate, and admitting it would
  // turn a resolver into an interpreter.
  const numericish = (n) =>
    !n ? false :
    n.type === 'NumericLiteral' ? true :
    n.type === 'Identifier' ? true :
    n.type === 'UnaryExpression' ? numericish(n.argument) :
    n.type === 'BinaryExpression' ? numericish(n.left) && numericish(n.right) :
    false;

  const decls = [];
  for (const n of todayAst.program.body) {
    if (n.type !== 'VariableDeclaration') continue;
    for (const d of n.declarations) {
      if (d.id.type === 'Identifier' && numericish(d.init)) {
        decls.push(`const ${d.id.name} = ${todaySrc.slice(d.init.start, d.init.end)};`);
      }
    }
  }
  const names = decls.map((d) => d.slice(6, d.indexOf(' =')));
  const evalInScope = (expr) => {
    const body = `${decls.join('\n')}\nreturn (${expr});`;
    // eslint-disable-next-line no-new-func
    const scope = { ...MASCOT, ...DOOR };
    return Function(...Object.keys(scope), body)(...Object.values(scope));
  };

  // A style property's expression, by name — the same resolver, so a style
  // that hardcodes 90.2 and a style that derives it are distinguishable.
  const styleExpr = (styleName, prop) => {
    let out = null;
    visit(todayAst, (n) => {
      if (out || n.type !== 'ObjectProperty' || n.key.name !== styleName) return;
      if (n.value.type !== 'ObjectExpression') return;
      const q = n.value.properties.find((x) => x.type === 'ObjectProperty' && x.key.name === prop);
      if (q) out = { src: todaySrc.slice(q.value.start, q.value.end), node: q.value };
    });
    return out;
  };

  const orb = (() => {
    let found = null;
    visit(todayAst, (n) => {
      if (n.type === 'JSXOpeningElement' && jsxName(n) === 'GlowOrb') found = found ?? n;
    });
    return found;
  })();
  const bee = (() => {
    let found = null;
    visit(todayAst, (n) => {
      if (n.type === 'JSXOpeningElement' && jsxName(n) === 'FlyingBee') found = found ?? n;
    });
    return found;
  })();

  if (!MASCOT.MASCOT_WIDTH_FRACTION || !MASCOT.MASCOT_BASE_PX || !orb || !bee) {
    bad(
      'H0 the call site is readable',
      `resolver came up empty (widthFraction=${MASCOT.MASCOT_WIDTH_FRACTION}, basePx=${MASCOT.MASCOT_BASE_PX}, ` +
        `GlowOrb=${!!orb}, FlyingBee=${!!bee}). Every row below would pass vacuously, so this fails closed.`,
    );
  } else {
    ok(`H0 call site read: ${names.length} module constant(s) resolved (${names.join(', ')}), mascot width fraction ${MASCOT.MASCOT_WIDTH_FRACTION.toFixed(6)}, base cut ${MASCOT.MASCOT_BASE_PX}px`);

    // H1 — the greeting mounts the STAGED mode, not the ambient one. The
    // component throws on both together; what it cannot catch is a bloom that
    // quietly breathes on a screen whose whole argument is that it is quiet.
    {
      const a = attrNames(orb);
      if (a.includes('staged') && !a.includes('breathe')) {
        ok(`H1 the greeting bloom is staged, not ambient (props: ${a.join(', ')})`);
      } else {
        bad('H1 staged, not ambient', `TodayTab's <GlowOrb> carries ${a.join(', ')} — the greeting's light must be one-shot (\`staged\`) and never \`breathe\`.`);
      }
    }

    // H2 — ONE STRING, TWO READERS. The bloom is placed by reading the perch
    // the bee lives at, so the anchor's `id` and the handler's `read()`
    // argument must be the same value. Two spellings is a light that lands
    // nowhere, and it is invisible: `read()` returns null and the bloom simply
    // never mounts.
    {
      const homeIds = [];
      visit(todayAst, (n) => {
        if (n.type !== 'JSXOpeningElement' || jsxName(n) !== 'PerchAnchor') return;
        if (!attrNames(n).includes('home')) return;
        const id = attr(n, 'id');
        homeIds.push(id?.value?.type === 'JSXExpressionContainer' ? id.value.expression : id?.value);
      });
      const reads = [];
      visit(todayAst, (n) => {
        if (n.type !== 'CallExpression') return;
        if (n.callee.type !== 'MemberExpression' || n.callee.property.name !== 'read') return;
        reads.push(n.arguments[0]);
      });
      const key = (node) =>
        !node ? null :
        node.type === 'Identifier' ? `ident:${node.name}` :
        node.type === 'StringLiteral' ? `str:${node.value}` : `<${node.type}>`;
      const homeKeys = homeIds.map(key);
      const readKeys = reads.map(key);
      if (homeKeys.length !== 1) {
        bad('H2 one anchor id, two readers', `found ${homeKeys.length} \`home\` anchors on TodayTab; the bloom is placed at THE residence and there must be exactly one.`);
      } else if (!readKeys.length) {
        bad('H2 one anchor id, two readers', 'nothing calls `.read(...)` on TodayTab, so the bloom has no measured position — it is either hardcoded or absent.');
      } else if (!readKeys.every((k) => k === homeKeys[0])) {
        bad(
          'H2 one anchor id, two readers',
          `the \`home\` anchor is ${homeKeys[0]} and the read(s) ask for ${readKeys.join(', ')}. ` +
            'A second spelling of the anchor id is a stage light that lands nowhere, and it fails silently: ' +
            '`read()` returns null and the bloom simply never mounts.',
        );
      } else if (!homeKeys[0].startsWith('ident:')) {
        bad('H2 one anchor id, two readers', `both sites use the literal ${homeKeys[0]}. They agree today; a shared binding is what keeps them agreeing.`);
      } else {
        ok(`H2 the anchor id is one binding read at both sites (${homeKeys[0]}) — the bloom cannot land at an anchor that does not exist`);
      }
    }

    // H3 — the hero renders on the BASE cut. Above the LOD threshold
    // `MascotBee` reaches for the hero pair, which the register rules lands
    // with its first hero mount — i.e. a new asset in this commit. Derived
    // from the live constants, at @3x, which is the dense case.
    {
      const sizeAttr = attr(bee, 'size');
      const expr = sizeAttr?.value?.type === 'JSXExpressionContainer'
        ? todaySrc.slice(sizeAttr.value.expression.start, sizeAttr.value.expression.end)
        : null;
      if (!expr) {
        bad('H3 the hero renders on the base cut', 'TodayTab\'s <FlyingBee> passes no resolvable `size`, so which cut it draws cannot be decided here.');
      } else {
        let size = null;
        try { size = evalInScope(expr); } catch (err) { size = null; }
        const threshold = MASCOT.MASCOT_BASE_PX / (MASCOT.MASCOT_WIDTH_FRACTION * 3);
        if (typeof size !== 'number' || !Number.isFinite(size)) {
          bad('H3 the hero renders on the base cut', `\`size={${expr}}\` did not resolve to a number.`);
        } else if (size * MASCOT.MASCOT_WIDTH_FRACTION * 3 > MASCOT.MASCOT_BASE_PX) {
          bad(
            'H3 the hero renders on the base cut',
            `size ${size} draws ${(size * MASCOT.MASCOT_WIDTH_FRACTION).toFixed(2)}pt of character, which at @3x is ` +
              `${(size * MASCOT.MASCOT_WIDTH_FRACTION * 3).toFixed(1)}px against a ${MASCOT.MASCOT_BASE_PX}px base cut. ` +
              'Above the threshold the hero asset is required, and it lands with its first hero mount — so this ' +
              'commit now owes an asset it does not ship.',
          );
        } else {
          ok(`H3 hero size ${size} is under the LOD threshold ${threshold.toFixed(4)} (${(size * MASCOT.MASCOT_WIDTH_FRACTION * 3).toFixed(1)}px of ${MASCOT.MASCOT_BASE_PX} at @3x) — base cut, no hero-asset dependency`);
        }
      }
    }

    // H4 — the hero's column, and what it is measured AGAINST. Two claims
    // live here, and the second one was missing until it was found on a
    // device (Lumen, 2026-08-29).
    //
    //   1. "never over text" is a property of the LAYOUT. The acceptance line
    //      for this lane (PRESENCE_PASS_REGISTER.md, P1a) is "hero in
    //      negative space never over text", and today's three greeting
    //      strings happen to be short enough. That is not the same claim: the
    //      reserve has to be derived from the character's own width, so the
    //      invariant survives Lane P3's copy and any type retune.
    //
    //   2. THE HERO KEEPS THE DOOR'S COLUMN CLEAR. `tabBarLayout.js` states
    //      the safety property in writing — "the door owns a fixed column at
    //      the trailing content edge, and every tab keeps that column clear"
    //      — and P1a right-aligned a 132pt hero to that same content edge.
    //      The register's placement ruling computed the top-right void from
    //      the GREETING only (121.61pt of clear width at 402pt) and never
    //      subtracted the door, which is not in this screen's layout tree at
    //      all: `MainTabs` mounts it as an absolute overlay. The result shipped
    //      with the door's 52pt disc sitting on the character's head. A void
    //      is only clear of what you measured it against.
    //
    // So the reserve is character + door column, and the perch offset is half
    // a character + door column: the character's trailing edge lands exactly
    // where `DOOR_RESERVE` begins, and the gap between them is that constant's
    // own `spacing.md` term rather than a number chosen here.
    {
      const reserve = styleExpr('greetingReserve', 'paddingRight');
      const perch = styleExpr('heroPerch', 'right');
      if (!reserve || !perch) {
        bad('H4 the hero column is reserved structurally', `could not read greetingReserve.paddingRight (${!!reserve}) / heroPerch.right (${!!perch}).`);
      } else if (DOOR.DOOR_RESERVE === null || DOOR.DOOR_SIZE === null) {
        bad('H4 the hero column is reserved structurally', 'DOOR_SIZE / DOOR_RESERVE did not resolve from AccountDoor.js + tabBarLayout.js, so claim 2 cannot be decided.');
      } else {
        let r = null, q = null;
        try { r = evalInScope(reserve.src); q = evalInScope(perch.src); } catch { /* fall through */ }
        const size = (() => { try { return evalInScope('HERO_SIZE'); } catch { return null; } })();
        const charW = size === null ? null : size * MASCOT.MASCOT_WIDTH_FRACTION;
        const wantReserve = charW === null ? null : charW + DOOR.DOOR_RESERVE;
        const wantPerch = charW === null ? null : charW / 2 + DOOR.DOOR_RESERVE;
        if (r === null || q === null || charW === null) {
          bad('H4 the hero column is reserved structurally', 'the reserve or the perch offset did not resolve against the live mascot and door constants.');
        } else if (Math.abs(r - wantReserve) > 1e-9) {
          bad(
            'H4 the hero column is reserved structurally',
            `the text reserve is ${r.toFixed(4)}pt but the character (${charW.toFixed(4)}pt) plus the door's ` +
              `column (${DOOR.DOOR_RESERVE}pt) is ${wantReserve.toFixed(4)}pt. A reserve that is not derived from ` +
              'both goes stale the moment the hero size, MASCOT_WIDTH_FRACTION or the door size moves, and it goes ' +
              'stale silently — the greeting simply starts running under the bee.',
          );
        } else if (!/[A-Za-z_$]/.test(reserve.src) || !/[A-Za-z_$]/.test(perch.src)) {
          // A VALUE CHECK CANNOT SEE A FROZEN DERIVATION. Found by mutation:
          // replacing `HERO_CHAR_WIDTH` with the literal `90.2` left every row
          // above green, because 90.2 IS the right answer today. It stops
          // being the right answer the moment `MASCOT_WIDTH_FRACTION` or
          // `HERO_SIZE` moves, and it stops silently — the greeting simply
          // starts running under the bee. So the expression has to still
          // REFER to something, not merely agree with it.
          bad(
            'H4 the hero column is reserved structurally',
            `the reserve (\`${reserve.src}\`) or the perch offset (\`${perch.src}\`) is a bare literal. ` +
              'It agrees with the character width today and would stop agreeing, without failing, the next time ' +
              'the hero size or MASCOT_WIDTH_FRACTION moves.',
          );
        } else if (Math.abs(q - wantPerch) > 1e-9) {
          // The failure this row exists for: an offset of half a character
          // alone puts the character's trailing edge on the content edge,
          // which is the middle of the door.
          const trailing = charW / 2 - q + DOOR.DOOR_RESERVE; // how far the char's right edge sits inside the door column
          bad(
            'H4 the hero column is reserved structurally',
            `the perch box is offset ${q.toFixed(4)}pt from the content edge; §32.2 draws the bee CENTRED on the ` +
              `resolved point, so the offset must be half a character plus the door's column ` +
              `(${(charW / 2).toFixed(4)} + ${DOOR.DOOR_RESERVE} = ${wantPerch.toFixed(4)}pt). At ${q.toFixed(4)}pt the ` +
              `character's trailing edge runs ${trailing.toFixed(2)}pt into the column tabBarLayout.js reserves for ` +
              `the ${DOOR.DOOR_SIZE}pt account door — which on this pose is the bee's head.`,
          );
        } else {
          const gap = DOOR.DOOR_RESERVE - DOOR.DOOR_SIZE;
          ok(
            `H4 the reserve is the character plus the door's column (${charW.toFixed(2)} + ${DOOR.DOOR_RESERVE} = ${r.toFixed(2)}pt) and the perch is offset half a character into it (${q.toFixed(2)}pt) — ` +
              `the greeting never runs under the bee, and the bee's trailing edge stops ${gap}pt clear of the ${DOOR.DOOR_SIZE}pt door`,
          );
        }
      }
    }

    // H5 — the bloom's diameter is derived from the hero it stages, per
    // MB-D1's "radius = bee bounding box x 1.2". Two numbers that must move
    // together earn a derivation; the doc's "~160pt" is a rounding of its own
    // formula and typing it would freeze the hero size into the light.
    {
      const sizeAttr = attr(orb, 'size');
      const expr = sizeAttr?.value?.type === 'JSXExpressionContainer'
        ? todaySrc.slice(sizeAttr.value.expression.start, sizeAttr.value.expression.end) : null;
      let d = null, hero = null;
      try { d = evalInScope(expr); hero = evalInScope('HERO_SIZE'); } catch { /* fall through */ }
      if (d === null || hero === null) {
        bad('H5 the bloom is sized from its hero', `the bloom's \`size\` (${expr}) did not resolve.`);
      } else if (!/[A-Za-z_$]/.test(expr)) {
        bad(
          'H5 the bloom is sized from its hero',
          `the bloom's size is the bare literal \`${expr}\` — it matches 1.2 x the hero today and would freeze ` +
            'there the moment the hero is resized, which is the one change this ratio exists to survive.',
        );
      } else if (Math.abs(d / (2 * hero) - 1.2) > 1e-9) {
        bad(
          'H5 the bloom is sized from its hero',
          `bloom ${d.toFixed(2)}pt across against a ${hero}pt hero is a radius ratio of ${(d / (2 * hero)).toFixed(4)}; ` +
            'MB-D1 scores 1.2 x the bee\'s bounding box. Re-score it in the doc or restore the ratio, but a light ' +
            'whose size no longer follows its object is not staging anything.',
        );
      } else {
        ok(`H5 bloom ${d.toFixed(2)}pt across = 1.2 x the ${hero}pt hero's box, both sides derived — resizing the hero resizes its light`);
      }
    }

    // H6 — the words survive the light, AT THE INTENSITY THE CALL SITE PASSES.
    // The bloom's core is its darkest point and it sits over the greeting.
    {
      const intAttr = attr(orb, 'intensity');
      const expr = intAttr?.value?.type === 'JSXExpressionContainer'
        ? todaySrc.slice(intAttr.value.expression.start, intAttr.value.expression.end) : null;
      let alpha = null;
      try { alpha = evalInScope(expr); } catch { /* fall through */ }
      const inkTok = token('ink');
      const softTok = token('inkSoft');
      if (alpha === null || typeof alpha !== 'number' || !inkTok || !softTok) {
        bad(
          'H6 the words survive the light at the shipped intensity',
          `could not resolve the call site's intensity (${expr}) or the ink tokens. Fails closed: section F's ` +
            'figure is the DEFAULT intensity through the breathe interpolation, which is not what this screen ships.',
        );
      } else {
        const core = overGround(TOKENS.accent, alpha, TOKENS.background);
        const lum = (c) => { const f = c.map((v) => { const t = v / 255; return t <= 0.03928 ? t / 12.92 : ((t + 0.055) / 1.055) ** 2.4; }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
        const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
        const rInk = ratio(rgb(inkTok), core), rSoft = ratio(rgb(softTok), core);
        if (rInk >= 4.5 && rSoft >= 4.5) {
          ok(`H6 at the SHIPPED intensity ${alpha}: ink ${rInk.toFixed(4)}:1, inkSoft ${rSoft.toFixed(4)}:1 over the bloom's core — both clear 4.5:1 (headroom ${(rSoft - 4.5).toFixed(4)} on the weaker)`);
        } else {
          bad(
            'H6 the words survive the light at the shipped intensity',
            `intensity ${alpha} puts ink at ${rInk.toFixed(4)}:1 and inkSoft at ${rSoft.toFixed(4)}:1 over the bloom's ` +
              'core, against a 4.5:1 floor. The stage light is costing the words it stages — lower `intensity`, ' +
              'which is the one prop §34 gives for exactly this.',
          );
        }
      }
    }

    // H7 — CALIBRATION for H6, red direction. H6 passing proves the resolver
    // ran; it does not prove the resolver would notice a call site that turned
    // the light up. So walk the intensity until the row's own predicate fails,
    // and require that point to be reachable and above what we ship.
    {
      const inkTok = token('inkSoft');
      const lum = (c) => { const f = c.map((v) => { const t = v / 255; return t <= 0.03928 ? t / 12.92 : ((t + 0.055) / 1.055) ** 2.4; }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
      const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
      let breaks = null;
      for (let a = 0; a <= 1.0001; a += 0.001) {
        if (ratio(rgb(inkTok), overGround(TOKENS.accent, a, TOKENS.background)) < 4.5) { breaks = a; break; }
      }
      let shipped = null;
      try {
        const intAttr = attr(orb, 'intensity');
        shipped = evalInScope(todaySrc.slice(intAttr.value.expression.start, intAttr.value.expression.end));
      } catch { /* fall through */ }
      if (breaks === null) {
        bad(
          'H7 H6 can fail',
          'no intensity in 0..1 puts inkSoft under 4.5:1 on this ground, so H6 is unfalsifiable — it would pass ' +
            'for any call site whatsoever and is asserting nothing about this one.',
        );
      } else if (shipped === null || shipped >= breaks) {
        bad('H7 H6 can fail', `the shipped intensity (${shipped}) is at or past the ${breaks.toFixed(3)} where H6's own predicate breaks.`);
      } else {
        ok(`H7 calibration: H6's predicate breaks at intensity ${breaks.toFixed(3)} and the call site ships ${shipped} — the row discriminates, and the shipped light has ${((breaks - shipped) / shipped * 100).toFixed(1)}% of headroom to that edge`);
      }
    }

    // H8 — the light is BEHIND. Not a taste call: MB-D1's "bloom layers behind
    // the object" and §29.1's "gold never a ground" are the same fact here —
    // a bloom painted over the greeting is a gold field with words under it.
    // Paint order is source order plus zIndex, so both have to be read.
    //
    // AMENDED 2026-08-28 (Lumen's ride-along, ratifying item 1). The first
    // draft's ok-message claimed the three-layer order — bloom -> content ->
    // bee — and checked ONE pair of it, orb-before-bee. The bee is mounted
    // BEFORE the content and rides above it on `zIndex: 5`, so moving the bee
    // to the end of the container is a legal, harmless-looking edit that then
    // leaves the orb free to sit between the content and the bee: green row,
    // light painted over every card. That inversion is exactly what the
    // Evening-paper hazard's occlusion discharge depends on never happening —
    // opaque card grounds occlude the bloom only while they paint after it.
    //
    // The claim is asserted STRUCTURALLY rather than against the content's
    // name. A first draft of this amendment read "the first <ScrollView>", and
    // mutation M3 — renaming the outer scroller — left the row GREEN by
    // silently falling through to the hive shelf's inner horizontal one, which
    // sits deep inside the content and after the orb by construction. Same
    // lesson as E1 one lane over: a lookalike further down the file answers a
    // positional query, and the answer is wrong without being empty. So the
    // container is found as the innermost element holding BOTH the orb and the
    // bee, and the assertion is on the orb's own child slot: first, ahead of
    // every sibling, whatever any of them are called.
    {
      const orbZ = /orb:\s*\{[^}]*zIndex/.test(componentSrc);
      const flyingSrc = await readFile(path.join(SRC, 'components', 'FlyingBee.js'), 'utf8');
      const flyZ = /fill:\s*\{[^}]*zIndex:\s*(\d+)/.exec(flyingSrc);
      // Every zIndex this screen declares — from the AST, so the justification
      // comment above the orb (which says the word twice) is not a hit, and so
      // an INLINE `style={{ zIndex }}` on the orb itself IS one. `orbZ` reads
      // only GlowOrb's own stylesheet and would miss that.
      const screenZ = [];
      visit(todayAst, (n) => {
        if (n.type !== 'ObjectProperty') return;
        if ((n.key.name ?? n.key.value) !== 'zIndex') return;
        screenZ.push(todaySrc.slice(n.value.start, n.value.end));
      });
      // The innermost element that mounts both — i.e. the stack whose source
      // order decides this. No name is read.
      const container = (() => {
        let found = null;
        visit(todayAst, (n) => {
          if (n.type !== 'JSXElement') return;
          if (n.start > Math.min(orb.start, bee.start)) return;
          if (n.end < Math.max(orb.end, bee.end)) return;
          if (!found || n.start > found.start) found = n;
        });
        return found;
      })();
      const kids = (container?.children ?? []).filter(
        (c) => c.type === 'JSXElement' || c.type === 'JSXFragment' ||
          (c.type === 'JSXExpressionContainer' && c.expression.type !== 'JSXEmptyExpression'),
      );
      const slotOf = (node) => kids.findIndex((c) => c.start <= node.start && c.end >= node.start);
      const orbSlot = slotOf(orb);
      const beeSlot = slotOf(bee);
      if (orbZ) {
        bad('H8 the light is behind', 'GlowOrb\'s own style now carries a `zIndex`, so paint order is no longer decided at the call site — re-read this row against whatever it is.');
      } else if (screenZ.length) {
        bad(
          'H8 the light is behind',
          `TodayTab now declares a zIndex of its own (${screenZ.join(', ')}). The three-layer order this row ` +
            'asserts is decided by source order plus FlyingBee\'s 5 and nothing else; a lift declared here moves ' +
            'the decision outside what these two facts can see. Re-read the row against whatever it is for.',
        );
      } else if (!flyZ) {
        bad('H8 the light is behind', 'could not read FlyingBee\'s fill zIndex, so "the bee is above the light" is unverified.');
      } else if (!container || orbSlot < 0 || beeSlot < 0) {
        bad(
          'H8 the light is behind',
          `could not locate the stack that mounts both (container=${!!container}, orb slot=${orbSlot}, bee slot=${beeSlot}), ` +
            'so nothing below is decidable. Fails closed — a row that cannot find the layers cannot report their order.',
        );
      } else if (orbSlot !== 0) {
        bad(
          'H8 the light is behind',
          `the <GlowOrb> is mounted at child slot ${orbSlot} of ${kids.length}, so ${orbSlot} sibling(s) paint ` +
            'UNDER it — with no zIndex of its own the light is over the page it is supposed to be behind. Note the ' +
            'bee says nothing about this: it rides zIndex 5 and is above the content wherever it is mounted, so ' +
            'orb-before-bee stays true while the light becomes a ground.',
        );
      } else if (beeSlot <= orbSlot) {
        bad('H8 the light is behind', 'the <FlyingBee> is mounted at or before the <GlowOrb>; the hero must paint after the light that stages him.');
      } else {
        ok(
          `H8 paint order, asserted structurally: the bloom is child slot 0 of ${kids.length} and carries no zIndex ` +
            `(none on this screen at all), so all ${kids.length - 1} sibling(s) — content and hero — paint over it; ` +
            `the bee (slot ${beeSlot}) rides zIndex ${flyZ[1]} above that content. Light behind the words it stages, ` +
            'behind the hero standing in it',
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// J. MB-D2a — REMOVED 2026-09-04 WITH ITS SUBJECT, not because it stopped
// mattering. ROUTING CLOSED the same day: cannot be re-pointed, not merely
// not-yet-re-pointed.
//
// Section J measured the seal celebration beat directly off
// `src/screens/SealHive.js`: eleven rows (J0-J10) covering the bloom's
// geometry on every reachable cover ground, 4.5:1 for every text token the
// ceremony mounts, the one-orb/one-bee staging rules, the beat timeline, the
// eased-not-sprung arithmetic arrival, and the reduced-motion arm. R-SEAL-1
// retired manual seal/send for private hives, so that screen no longer
// exists and the rows have nothing to read.
//
// THE COVERAGE LOSS IS REAL AND IS NOT A CLEANUP: eleven rows went with the
// screen. MB-D1's binding rule ("the screen's OWN ground", the distinction J1
// exists to prove against MB-D2a's #FFF7CC parenthetical) is now asserted on
// ONE consumer — section H's TodayTab staged orb — where it used to be
// asserted on two, and the second was the one with four grounds. E1b holds
// that population as a SET from here on, so the day a second staged light
// mounts, this gate names the screen instead of quietly going on measuring
// the first one.
//
// WHY PACKAGEOPEN CANNOT INHERIT THE ROWS (Lumen's ruling, 2026-09-04, and
// the reason is sharper than the one this note used to give). It is not that
// PackageOpen is a rewrite against different machinery — that is true and it
// is not the binding reason. J2's subject was the composite of mounted text
// over THE BLOOM'S OWN CORE, and PackageOpen mounts no `<GlowOrb>` at all.
// It imports `hiveCoverTheme` and resolves a cover, so it carries the
// grounds and NOT the light. The eleven rows do not have a different
// referent on that screen; they have none.
//
// Both negatives measured at d6414a8, independently in two shells: the
// staged-mode census returns exactly one prop consumer (TodayTab, and E1b
// now asserts that as an identity), and PackageOpen mounts zero `<GlowOrb>`
// while importing `hiveCoverTheme` and resolving a cover in its own body.
//
// What PackageOpen's four cover grounds DO still deserve is J1's other half,
// a 4.5:1 reading of the text that sits on them. That is ruled INTO the owed
// ROW B text-contrast sweep as a named customer, with `HIVE_COVER_THEMES`
// enumeration in its scope by name, and deliberately not into this gate:
// nothing here mounts a bloom for those grounds to be measured against, and
// a row that cannot do its measurement must not imply the measurement still
// holds.
// ---------------------------------------------------------------------------

console.log(`\ncheck-stage-light: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
