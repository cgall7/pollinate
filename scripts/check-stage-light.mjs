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

console.log('\nE. the merged call sites keep their shipped behaviour');

// E1 — the three static/breathe sites pass no `staged`, so they resolve
// through the unchanged `pulse` arm. This is the no-regression row.
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
  const unstaged = sites.filter((s) => !s.props.includes('staged'));
  const staged = sites.filter((s) => s.props.includes('staged'));
  ok(`E1 ${unstaged.length} unstaged site(s) unchanged, ${staged.length} staged site(s) — ${sites.map((s) => `${s.file}:${s.line}${s.props.includes('staged') ? ' [staged]' : ''}`).join(', ')}`);
}

console.log('\nF. the colour ruling that struck the three-hue stack, re-derived live');

const themeSrc = await readFile(path.join(SRC, 'constants', 'theme.js'), 'utf8');
const token = (name) => {
  const m = new RegExp(`^\\s*${name}:\\s*'(#[0-9A-Fa-f]{6})'`, 'm').exec(themeSrc);
  return m ? m[1] : null;
};
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

const rgb = (h) => { const c = parseColor(h); return [c.r, c.g, c.b]; };
const Lstar = (c) => rgbToLab({ r: c[0], g: c[1], b: c[2] }).L;
const overGround = (hex, alpha, groundHex) => {
  const c = rgb(hex), g = rgb(groundHex);
  return c.map((v, k) => v * alpha + g[k] * (1 - alpha));
};

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

console.log(`\ncheck-stage-light: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
