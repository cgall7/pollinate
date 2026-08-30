// GL7(a) — the glass rim stack, asserted as a RELATION, not as three numbers.
//
//   npm run check:glass-definition
//
// WHY THIS GATE EXISTS. `GlassBackground` builds its edge out of two border
// frames on COINCIDENT boxes — an ink hairline, then a translucent white rim
// painted over it. Borders paint inboard, so "coincident" is doing real work:
// with equal widths the rim covers the hairline exactly and the hairline is
// attenuated to its transmission through the rim (a factor of 1 - rimAlpha).
// That transmission model is what
// `GUIDES/POLLINATE_GL1_HAIRLINE_DERIVATION.md` solves the hairline's alpha
// against, and it is true only while the two widths are equal. If they ever
// differ, the hairline stops being *under* the rim and becomes a second
// visible ring outboard of it — a different edge treatment entirely, reached
// without anyone editing a colour.
//
// Both halves of GL7(a) were defects of exactly this shape — quantities that
// went unexamined because nothing could see them:
//   - the alpha shipped at 0.10, described in its own comment as "the middle
//     of the spec's 8-12% interval, to be re-measured on a device". The
//     interval was guessed before anyone computed the rim's attenuation; at
//     0.10 the composite carries 0.035 of ink.
//   - the width shipped at `StyleSheet.hairlineWidth` — 0.333pt on a 3x
//     device, one third of the 1pt the spec rules. A pure conformance miss,
//     and it compounded the alpha: a one-physical-pixel band, antialiased
//     along a rounded path, at the ΔE00 0.10 could reach.
//
// WHAT IT ASSERTS
//
//   D1  the two frames' `borderWidth`s are EQUAL (the coincidence relation)
//   D2  that shared width is the ruled 1pt, and is a plain number — not
//       `StyleSheet.hairlineWidth`, whose value is a device property
//   D3  render order: hairline first, rim over it (order is the mechanism —
//       the file's own comment: "on a bright ground you read a gleam with a
//       dark edge and on a dark one you read a dark edge with a gleam")
//   D4  ROLES: the hairline is an alpha of `ink`, the rim an alpha of
//       `surface`. Without this, D5/D6's arithmetic could stay green while
//       measuring two colours that no longer play those parts.
//   D5  DERIVATION, recomputed from theme.js's live tokens: on the spec's own
//       composite carrier, the hairline's contribution (rim alone vs rim over
//       hairline) lands inside the blur rung's measured rim band.
//   D6  the same, live-enumerated over EVERY cover theme — the four grounds
//       the borrower circles sit on (GL7(d)). This is what licenses ONE token
//       rather than a per-ground tuning, and it expires correctly when the
//       population changes.
//
//       D6'S SENSITIVITY AXIS IS LIGHTNESS, NOT SATURATION — measured, and
//       written down here because the obvious guess is wrong and cost one
//       mis-aimed mutation already. The rim above the hairline is
//       `surface`@0.65, opaque enough to dominate the composite, so on any
//       LIGHT ground the hairline's contribution barely moves: the four
//       shipped covers span 2.8658-2.9902, and `goldField` — saturated, and
//       the most chromatic ground in the system — lands 2.8485, comfortably
//       in band. Adding a saturated cover does NOT fire this row.
//       A DARK ground does: `paperEvening` as a cover base measures 1.6400,
//       under the band's 1.67 floor, because an alpha of ink on a dark ground
//       is not a quieter ink — dimming moves the mark TOWARD the paper instead
//       of away from it, and the whole rim stack inverts (the same rule that
//       governs `paperEvening` text, R-EXT's dark-paper ink gate). That is the
//       real live risk here: an Evening cover theme is a plausible next ask,
//       and it needs its own ruling rather than this token.
//
//       The row's dependence runs through `glassRim`: swept 0.65 -> 0.00, the
//       spread across grounds widens from 1.5573 to 2.6569 and every ground
//       leaves the band. So D5/D6 also fail if the rim's alpha is retuned
//       without re-solving the hairline against it — the two are coupled, and
//       nothing else in the repo says so.
//
// THE BOUND IS EXTERNAL, ON PURPOSE. D5/D6 compare against the BlurView
// rung's own measured rim — ΔE00 2.88 / 1.67 / 3.19, from
// `GUIDES/GL1_GL2_DESIGN_INTEGRATION.md` § Rim Treatment. Those figures are a
// property of the OTHER material, measured elsewhere, so this gate is not
// reading its own bound out of the tokens it is testing. The stated design
// goal is that the two rungs read as one material; the band is that goal
// written as an interval.
//
// SCOPE OF THE CLAIM. Every figure here is computed from source — theme.js's
// tokens composited in the order GlassBackground renders them, on a carrier
// pinned from the GL2 sweep. Nothing here is measured from a framebuffer, and
// no row claims the result was seen on a device.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { over, deltaE00, parseColor } from './lib/color.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const GLASS = path.join(SRC, 'navigation/GlassBackground.js');

let pass = 0;
const failures = [];
const ok = (label) => { pass += 1; console.log(`  ok   ${label}`); };
const bad = (label, detail) => {
  failures.push(`${label} — ${detail}`);
  console.log(`  FAIL ${label} — ${detail}`);
};

// The blur rung's own measured rim. External to every token this gate reads.
const BAND_MIN = 1.67;
const BAND_MAX = 3.19;
// Composite carrier for the GlassView rung, pinned from
// GUIDES/POLLINATE_GL2_VEIL_DERIVATION.md's sweep (§ Veil & Composite State).
const CARRIER = 'rgb(254, 254, 254)';

// ── tokens, read from theme.js rather than restated here ────────────────────
const themeSrc = fs.readFileSync(path.join(SRC, 'constants/theme.js'), 'utf8');
const pigments = new Map();
for (const m of themeSrc.matchAll(/^\s{2,}([a-zA-Z]\w*):\s*'(#[0-9A-Fa-f]{3,8})'/gm)) {
  if (!pigments.has(m[1])) pigments.set(m[1], m[2]);
}
// Only a DIRECT `withAlpha(pigment.X, n)` resolves — anything wrapped in
// another call is left unresolved rather than guessed at.
const alphaTokens = new Map();
for (const m of themeSrc.matchAll(/^\s{2,}([a-zA-Z]\w*):\s*withAlpha\(pigment\.(\w+),\s*([\d.]+)\)/gm)) {
  if (!alphaTokens.has(m[1])) alphaTokens.set(m[1], { pigment: m[2], alpha: Number(m[3]) });
}
const rgba = ({ pigment: p, alpha }) => {
  const { r, g, b } = parseColor(pigments.get(p));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const hairTok = alphaTokens.get('glassHairline');
const rimTok = alphaTokens.get('glassRim');
const fillTok = alphaTokens.get('glassFill');

// ── the AST of the rim stack ────────────────────────────────────────────────
const glassSrc = fs.readFileSync(GLASS, 'utf8');
let ast = null;
try {
  ast = parse(glassSrc, { sourceType: 'module', plugins: ['jsx'] });
  ok('GlassBackground.js parses');
} catch (err) {
  bad('GlassBackground.js parses', err.message);
}

const walk = (node, visit) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.forEach((n) => walk(n, visit));
  if (typeof node.type === 'string') visit(node);
  for (const k of Object.keys(node)) {
    if (k === 'loc' || k === 'leadingComments' || k === 'trailingComments') continue;
    walk(node[k], visit);
  }
};

// Resolve `borderWidth` out of the two named styles in the StyleSheet.create
// literal. Read as an AST property, so a value that is a MemberExpression
// (`StyleSheet.hairlineWidth`) is DISTINGUISHABLE from a numeric literal
// rather than both collapsing to "something truthy".
const widths = new Map();
const colorRefs = new Map();
if (ast) {
  walk(ast.program, (node) => {
    if (
      node.type !== 'CallExpression' ||
      node.callee?.type !== 'MemberExpression' ||
      node.callee.object?.name !== 'StyleSheet' ||
      node.callee.property?.name !== 'create'
    ) return;
    const obj = node.arguments?.[0];
    if (obj?.type !== 'ObjectExpression') return;
    for (const prop of obj.properties) {
      const styleName = prop.key?.name;
      if (!styleName || prop.value?.type !== 'ObjectExpression') continue;
      for (const inner of prop.value.properties) {
        if (inner.key?.name === 'borderWidth') {
          widths.set(styleName, {
            node: inner.value,
            kind: inner.value.type,
            value: inner.value.type === 'NumericLiteral' ? inner.value.value : null,
            text: glassSrc.slice(inner.value.start, inner.value.end),
            line: inner.value.loc?.start?.line,
          });
        }
        if (inner.key?.name === 'borderColor') {
          colorRefs.set(styleName, glassSrc.slice(inner.value.start, inner.value.end));
        }
      }
    }
  });
}

// ── D1 — the coincidence relation ───────────────────────────────────────────
const hair = widths.get('hairline');
const rim = widths.get('rim');
if (!hair || !rim) {
  bad('D1 both rim frames declare a borderWidth',
    `resolved: ${[...widths.keys()].join(', ') || 'none'} — the stack is two ` +
    `coincident bordered frames; a style that stops declaring one has left the model`);
} else if (hair.text === rim.text) {
  ok(`D1 hairline and rim borderWidths are equal (both \`${hair.text}\`) — frames coincident`);
} else {
  bad('D1 hairline and rim borderWidths are equal',
    `hairline=\`${hair.text}\` (line ${hair.line}), rim=\`${rim.text}\` (line ${rim.line}) — ` +
    `borders paint inboard, so unequal widths make the hairline a second visible ring ` +
    `OUTBOARD of the rim instead of a substrate under it, and the 1-rimAlpha ` +
    `transmission the hairline's alpha was solved against stops holding`);
}

// ── D2 — the shared width is the ruled 1pt, as a plain number ───────────────
for (const [name, w] of [['hairline', hair], ['rim', rim]]) {
  if (!w) continue;
  if (w.kind !== 'NumericLiteral') {
    bad(`D2 ${name} borderWidth is a plain number`,
      `it is a ${w.kind} (\`${w.text}\`) — GL1_GL2_DESIGN_INTEGRATION.md § Rim ` +
      `Treatment rules this line at 1pt. \`StyleSheet.hairlineWidth\` is a DEVICE ` +
      `property (0.333pt at 3x), so a stack written that way ships a different ` +
      `edge on every screen density and one third of the ruled width on most`);
  } else if (w.value !== 1) {
    bad(`D2 ${name} borderWidth is the ruled 1pt`, `it is ${w.value}`);
  } else {
    ok(`D2 ${name} borderWidth is the ruled 1pt, as a numeric literal`);
  }
}

// ── D3 — order is the mechanism ─────────────────────────────────────────────
// Read the ORDER of the two <View>s by which style each carries, rather than
// by position-in-file: a wrapper or a reformat must not change the verdict,
// and only the relative order of these two frames is the claim.
let order = [];
if (ast) {
  walk(ast.program, (node) => {
    if (node.type !== 'JSXOpeningElement' || node.name?.name !== 'View') return;
    const styleAttr = node.attributes?.find((a) => a.name?.name === 'style');
    if (!styleAttr) return;
    const text = glassSrc.slice(styleAttr.start, styleAttr.end);
    if (text.includes('styles.hairline')) order.push({ which: 'hairline', at: node.start });
    else if (text.includes('styles.rim')) order.push({ which: 'rim', at: node.start });
  });
}
order.sort((a, b) => a.at - b.at);
const seq = order.map((o) => o.which);
if (seq.length !== 2) {
  bad('D3 exactly one hairline frame and one rim frame render',
    `found [${seq.join(', ') || 'none'}] — expected exactly one of each; the rim ` +
    `stack is shared by BOTH live rungs so it cannot be duplicated per rung`);
} else if (seq[0] === 'hairline' && seq[1] === 'rim') {
  ok('D3 hairline renders before rim — the dark substrate sits UNDER the specular gleam');
} else {
  bad('D3 hairline renders before rim',
    `order is [${seq.join(', ')}] — reversed, the translucent white rim paints ` +
    `UNDER the ink line and the edge reads as a dark ring, not as glass`);
}

// ── D4 — roles ──────────────────────────────────────────────────────────────
const roleRows = [
  ['hairline', 'glassHairline', 'ink', hairTok],
  ['rim', 'glassRim', 'surface', rimTok],
];
for (const [style, token, expectedPigment, tok] of roleRows) {
  const ref = colorRefs.get(style);
  if (ref !== `theme.colors.${token}`) {
    bad(`D4 ${style} borderColor is \`${token}\``,
      `it is \`${ref ?? 'unresolved'}\` — D5/D6's arithmetic composites these two ` +
      `tokens by name; pointed at anything else it would keep measuring and stop ` +
      `describing what renders`);
  } else if (!tok) {
    bad(`D4 ${token} resolves`,
      `no direct \`withAlpha(pigment.X, n)\` for \`${token}\` in theme.js — it may ` +
      `have become a raw hex or a wrapped call, either of which leaves the ` +
      `transmission model unmeasurable rather than wrong`);
  } else if (tok.pigment !== expectedPigment) {
    bad(`D4 ${token} is an alpha of \`${expectedPigment}\``,
      `it is an alpha of \`${tok.pigment}\` — the stack is a DARK substrate under a ` +
      `LIGHT gleam; swap either role and the edge inverts`);
  } else {
    ok(`D4 ${token} is \`withAlpha(pigment.${tok.pigment}, ${tok.alpha})\` — role intact`);
  }
}

// ── D5 / D6 — the derivation, recomputed ────────────────────────────────────
// The hairline's CONTRIBUTION is the difference the ink makes at the edge:
// rim-over-body versus rim-over-hairline-over-body. That is the quantity the
// derivation solved, and the quantity a reader sees.
const contribution = (bodyColor) => {
  const body = bodyColor;
  const rimOnly = over(rgba(rimTok), body);
  const withHair = over(rgba(rimTok), over(rgba(hairTok), body));
  return deltaE00(withHair, rimOnly);
};

if (!hairTok || !rimTok) {
  bad('D5 derivation recomputes', 'glassHairline or glassRim did not resolve — see D4');
} else {
  const d = contribution(CARRIER);
  if (d >= BAND_MIN && d <= BAND_MAX) {
    ok(`D5 hairline contribution on the spec carrier = ΔE00 ${d.toFixed(4)} — inside the ` +
       `blur rung's band [${BAND_MIN}, ${BAND_MAX}], so the two rungs read as one material`);
  } else {
    bad('D5 hairline contribution is inside the blur rung\'s rim band',
      `ΔE00 ${d.toFixed(4)} on carrier ${CARRIER}, band [${BAND_MIN}, ${BAND_MAX}] — ` +
      `below it the edge is weaker than the material it is supposed to match; above ` +
      `it the chrome edge outweighs the rung the material is meant to be lightest on`);
  }

  // D6 — every cover theme, enumerated live from hiveThemes.js. These are the
  // grounds GL7(d)'s borrower circles sit on.
  const hiveSrc = fs.readFileSync(path.join(SRC, 'constants/hiveThemes.js'), 'utf8');
  const coverTokens = [...hiveSrc.matchAll(/base:\s*theme\.colors\.(\w+)/g)].map((m) => m[1]);
  if (coverTokens.length === 0) {
    bad('D6 cover themes enumerate',
      'no `base: theme.colors.X` found in hiveThemes.js — the enumerator broke, ' +
      'which is not the same as there being no cover themes');
  } else {
    const out = [];
    let allIn = true;
    for (const tokenName of coverTokens) {
      const hex = pigments.get(tokenName) ?? (alphaTokens.has(tokenName) ? null : null);
      if (!hex) {
        allIn = false;
        out.push(`${tokenName}=UNRESOLVED`);
        continue;
      }
      // The borrower circle's own body over that cover, then the rim stack.
      const body = fillTok ? over(rgba(fillTok), hex) : hex;
      const d = contribution(body);
      out.push(`${tokenName} ${d.toFixed(4)}`);
      if (d < BAND_MIN || d > BAND_MAX) allIn = false;
    }
    if (allIn) {
      ok(`D6 hairline contribution stays in band on all ${coverTokens.length} cover grounds ` +
         `(${out.join(', ')}) — one token serves the whole population, no per-ground tuning`);
    } else {
      bad(`D6 hairline contribution stays in band on all ${coverTokens.length} cover grounds`,
        `${out.join(', ')}; band [${BAND_MIN}, ${BAND_MAX}] — a ground has arrived that the ` +
        `single ruled alpha does not serve. This row does NOT say the alpha is wrong: it ` +
        `says the population changed and the token has to be re-solved against it`);
    }
  }
}

console.log(`\ncheck-glass-definition: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
