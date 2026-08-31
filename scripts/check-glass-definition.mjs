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
//   C1  the style/veil PAIR is the ruled one — `glassEffectStyle` and
//       `glassLens` are solved together on device frames, so half a retune
//       invalidates the other half AND D5's measured carrier range
//   D5  DERIVATION, recomputed from theme.js's live tokens: across the whole
//       MEASURED carrier range (GL7(b′) — the `clear` rung's body tracks its
//       ground, so this stopped being one pinned number), the hairline's
//       contribution (rim alone vs rim over hairline) lands inside the blur
//       rung's measured rim band
//   D5b that band keeps stated HEADROOM below the measured dark carrier, so a
//       future retune cannot spend the last of it silently
//   E1  the stack is declared in exactly ONE file — keyed on its two border
//       COLOURS, so a copy under new style names is still caught
//   E2  the tab capsule CONSUMES that shared stack rather than owning it
//   E3  every mount painted `glassFill` carries the stack — the borrower
//       population is derived from the fill token, never listed, so a borrower
//       added later joins the row by existing
//   E4  BackButton's fill and rim ride ONE predicate (its glass variant is the
//       only conditional consumer)
//   E5  each mount's rim radius equals its host's declared borderRadius
//   E6  `glassLens` stays inside the material — the ratified (d) decline
//   E7  lone `glassRim` rings (the specular half with no substrate) are exactly
//       the ratified set — a new one needs its own ruling, not a silent list
//
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
// GL7(d′) moved the stack into its own module: it is now worn by the tab
// capsule, the account door, and the six borrower circles, so it cannot live
// inside any one of them. D1-D4 follow it — they assert the stack itself.
const GLASS = path.join(SRC, 'components/GlassRim.js');
const CAPSULE = path.join(SRC, 'navigation/GlassBackground.js');

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
// The composite carrier for the GlassView rung — the capsule's own body, which
// is what the rim stack is painted on top of.
//
// GL7(b′), 2026-08-30: THIS STOPPED BEING A CONSTANT. It was pinned at
// `rgb(254, 254, 254)` from GL2's sweep, and that was honest arithmetic while
// the rung was `regular`, which flattens almost everything it sees to
// near-white (measured: a pure black ground reads L* 80.24 through it). On the
// `clear` rung the body tracks what is behind it, so the carrier is an
// INTERVAL, and re-pinning it to whatever the first `clear` capture happened to
// show would rebuild the original defect one material later — Lumen's
// refinement of the rider, and the reason this is two endpoints and not a new
// single number.
//
// Both endpoints are MEASURED, on device, not derived: the capsule photographed
// over a calibrated target at the ruled veil, sampled inside the capsule.
// `GUIDES/POLLINATE_GL7_MATERIAL_TRANSMISSION.md` §3b; frames in
// `.scratch/gl7-material/`. The dark end is the pure-black bound and the light
// end is any of `surface`/`washSky`/`backgroundWriting`, which all clip to
// white through the veil.
//
// The dark end is 199 on BOTH rungs, and that is structural rather than lucky:
// the veil is solved so the inactive glyph holds its floor at the darkest
// column, and that darkest column IS the carrier's dark end. The constraint
// that sets the alpha pins the carrier with it.
const CARRIER_RANGE = [
  ['dark end — pure black behind the capsule', 'rgb(199, 199, 199)'],
  ['light end — surface / washSky / backgroundWriting', 'rgb(255, 255, 255)'],
];

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
  ok('GlassRim.js parses');
} catch (err) {
  bad('GlassRim.js parses', err.message);
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
  const seen = CARRIER_RANGE.map(([label, c]) => [label, c, contribution(c)]);
  const outOfBand = seen.filter(([, , d]) => d < BAND_MIN || d > BAND_MAX);
  const shown = seen.map(([label, c, d]) => `${label} ${c} -> ΔE00 ${d.toFixed(4)}`).join('; ');
  if (outOfBand.length === 0) {
    ok(`D5 hairline contribution stays in band across the whole measured carrier range ` +
       `(${shown}) — band [${BAND_MIN}, ${BAND_MAX}], so the two rungs read as one material ` +
       `at every body the capsule can present`);
  } else {
    bad('D5 hairline contribution is in band across the measured carrier range',
      `${shown}; band [${BAND_MIN}, ${BAND_MAX}] — below it the edge is weaker than the ` +
      `material it is supposed to match; above it the chrome edge outweighs the rung the ` +
      `material is meant to be lightest on`);
  }

  // D5b — HOW MUCH ROOM IS LEFT, stated as a number rather than left implicit.
  // The contribution falls with the carrier (an alpha of ink on a darker body
  // is a smaller step), so the band's lower edge is the one that can be
  // reached. Walking neutral carriers down from the measured dark end says how
  // far the body would have to fall before the hairline stops matching the
  // blur rung — i.e. how much a future veil or style retune can spend before
  // D5 turns red. Asserted, so the headroom cannot quietly evaporate.
  const MIN_HEADROOM = 40;
  let breakAt = null;
  for (let v = 199; v >= 0; v -= 1) {
    if (contribution(`rgb(${v}, ${v}, ${v})`) < BAND_MIN) { breakAt = v; break; }
  }
  if (breakAt === null) {
    ok('D5b hairline contribution never leaves the band above a black carrier — unbounded headroom');
  } else if (199 - breakAt >= MIN_HEADROOM) {
    ok(`D5b the band survives down to carrier ${breakAt} — ${199 - breakAt} levels below the ` +
       `measured dark end (199), against a ${MIN_HEADROOM}-level minimum. A darker rung has ` +
       `room before the hairline stops matching the blur rung`);
  } else {
    bad('D5b the hairline keeps headroom below the measured dark carrier',
      `band breaks at carrier ${breakAt}, only ${199 - breakAt} levels below the measured dark ` +
      `end (199), minimum ${MIN_HEADROOM} — the next veil or style retune would land on a ` +
      `hairline that no longer matches the blur rung, and D5 would only say so afterwards`);
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

// ── E — GL7(d′): ONE stack, worn by a population this gate DERIVES ──────────
//
// GL7(d) asked whether the surfaces wearing `glass*` token names as flat fills
// should convert to the real material. Measured, no: nothing moves under any
// of them (the through-material term is identically zero), and the lens veil
// is FAINTER than the flat fill they already have. What they were missing was
// the edge, so (d′) gives them the edge — the same stack, imported, not a
// copy. These rows are what keeps "the same stack" true a month from now.
const listFiles = (dir) => {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(full));
    else if (e.name.endsWith('.js')) out.push(full);
  }
  return out;
};
const rel = (f) => path.relative(ROOT, f);
const srcFiles = listFiles(SRC);
const parsed = new Map();
for (const f of srcFiles) {
  const text = fs.readFileSync(f, 'utf8');
  let fileAst = null;
  try {
    fileAst = parse(text, { sourceType: 'module', plugins: ['jsx'] });
  } catch {
    fileAst = null;
  }
  // A token NAMED in a comment is not a token USED. E6 is a text search, so it
  // gets a copy with every comment range blanked — otherwise the row fires on
  // prose explaining why a surface does NOT use the lens, which is exactly the
  // prose this change adds to three files.
  let codeOnly = text;
  if (fileAst?.comments?.length) {
    const chars = [...text];
    for (const c of fileAst.comments) {
      for (let i = c.start; i < c.end; i += 1) if (chars[i] !== '\n') chars[i] = ' ';
    }
    codeOnly = chars.join('');
  }
  parsed.set(f, { text, codeOnly, ast: fileAst });
}

// Every `StyleSheet.create` entry in src/, as { file, name, props: Map<key, text> }.
const allStyles = [];
for (const [f, { text, ast: fileAst }] of parsed) {
  if (!fileAst) continue;
  walk(fileAst.program, (node) => {
    if (
      node.type !== 'CallExpression' ||
      node.callee?.type !== 'MemberExpression' ||
      node.callee.object?.name !== 'StyleSheet' ||
      node.callee.property?.name !== 'create'
    ) return;
    const obj = node.arguments?.[0];
    if (obj?.type !== 'ObjectExpression') return;
    for (const prop of obj.properties) {
      const name = prop.key?.name;
      if (!name || prop.value?.type !== 'ObjectExpression') continue;
      const props = new Map();
      for (const inner of prop.value.properties) {
        if (!inner.key?.name || !inner.value) continue;
        props.set(inner.key.name, text.slice(inner.value.start, inner.value.end));
      }
      allStyles.push({ file: f, name, props, line: prop.loc?.start?.line });
    }
  });
}

// ── E1 — the stack is declared in exactly ONE file ──────────────────────────
// Keyed on the HAIRLINE, not on the style names: a copy pasted under different
// names is the same defect and is the likely shape of it, and the hairline is
// the half that has no other legitimate consumer. It exists only as the
// substrate the rim gleams against — a second file holding one is a second
// stack. (`glassRim` alone is NOT that; it is a token borrow, and E7 handles
// it, because a lone specular ring is a different treatment with a different
// verdict.)
const declarers = new Set();
for (const st of allStyles) {
  if (st.props.get('borderColor') === 'theme.colors.glassHairline') declarers.add(st.file);
}
if (declarers.size === 1 && declarers.has(GLASS)) {
  ok(`E1 the hairline — and so the stack — is declared in exactly one file (${rel(GLASS)}) — capsule and ` +
     `borrowers share it, so neither alpha can drift out from under the other`);
} else {
  bad('E1 the hairline — and so the stack — is declared in exactly one file',
    `declared in [${[...declarers].map(rel).join(', ') || 'nowhere'}] — expected only ` +
    `${rel(GLASS)}. A second copy is how this population split into two materials the ` +
    `first time (C2: four back buttons, four looks); the whole point of (d′) is that ` +
    `there is one stack to retune, not one per surface`);
}

// ── E2 — the capsule consumes the shared stack ──────────────────────────────
const capsuleSrc = fs.readFileSync(CAPSULE, 'utf8');
const capsuleImports = /import\s*\{[^}]*\bGlassRim\b[^}]*\}\s*from\s*'[^']*GlassRim'/.test(capsuleSrc);
const capsuleRenders = /<GlassRim\b/.test(capsuleSrc);
if (capsuleImports && capsuleRenders) {
  ok('E2 GlassBackground imports and renders the shared <GlassRim> — the capsule is a ' +
     'consumer of the stack, not its owner');
} else {
  bad('E2 GlassBackground imports and renders the shared <GlassRim>',
    `import=${capsuleImports}, render=${capsuleRenders} — if the capsule stops consuming ` +
    `the shared stack, E1 can still pass while the two rungs and the borrowers quietly ` +
    `wear different edges`);
}

// ── E3 / E5 — the borrower population, derived from the FILL token ──────────
// Not a list of files. Any style that paints `glassFill` is a borrower by
// definition, and every element that wears one must carry the stack — so a
// borrower added later joins this row by existing.
const fillStyles = allStyles.filter((st) => st.props.get('backgroundColor') === 'theme.colors.glassFill');
const hasDescendant = (node, elementName) => {
  let found = false;
  walk(node, (n) => {
    if (n.type === 'JSXOpeningElement' && n.name?.name === elementName) found = true;
  });
  return found;
};

if (fillStyles.length === 0) {
  bad('E3 the borrower population is non-empty',
    'no style in src/ paints `theme.colors.glassFill` — either the borrowers were ' +
    'retired (in which case retire this row) or the enumerator broke, and those are ' +
    'not the same thing. Fails closed rather than reporting an empty population green');
} else {
  const byFile = new Map();
  for (const st of fillStyles) {
    if (!byFile.has(st.file)) byFile.set(st.file, new Set());
    byFile.get(st.file).add(st.name);
  }
  const mounts = [];
  for (const [f, names] of byFile) {
    const { text, ast: fileAst } = parsed.get(f);
    if (!fileAst) { mounts.push({ file: f, name: '(unparsed)', ok: false, why: 'file did not parse' }); continue; }
    walk(fileAst.program, (node) => {
      if (node.type !== 'JSXElement') return;
      const styleAttr = node.openingElement?.attributes?.find((a) => a.name?.name === 'style');
      if (!styleAttr) return;
      const attrText = text.slice(styleAttr.start, styleAttr.end);
      const worn = [...names].filter((n) => new RegExp(`\\bstyles\\.${n}\\b`).test(attrText));
      if (worn.length === 0) return;
      mounts.push({
        file: f,
        name: worn.join('+'),
        line: node.loc?.start?.line,
        node,
        attrText,
        rimmed: hasDescendant(node, 'GlassRim'),
      });
    });
  }

  const bare = mounts.filter((m) => !m.rimmed);
  if (bare.length === 0 && mounts.length > 0) {
    ok(`E3 all ${mounts.length} glassFill mounts carry <GlassRim> ` +
       `(${mounts.map((m) => `${path.basename(m.file)}:${m.line}`).join(', ')}) — the ` +
       `population is derived from the fill token, so a new borrower joins this row by existing`);
  } else if (mounts.length === 0) {
    bad('E3 every glassFill style has a mount',
      `${fillStyles.length} glassFill style(s) declared but no JSX element references one — ` +
      `a declared-and-unmounted borrower cannot be checked, and this row will not call that green`);
  } else {
    bad('E3 all glassFill mounts carry <GlassRim>',
      `${bare.length} of ${mounts.length} bare: ` +
      `${bare.map((m) => `${rel(m.file)}:${m.line} (${m.name})`).join(', ')} — a flat ` +
      `translucent fill with no edge is what Colin was looking at when he said the glass ` +
      `was hard to tell apart from the page`);
  }

  // ── E5 — the rim traces the host's edge ───────────────────────────────────
  // A rim at a different radius than the box it frames is a visible mismatch
  // at the corners, not a subtle one. Resolved from the host element's OWN
  // referenced styles (the radius commonly sits on a sibling style in the same
  // array — `styles.button` next to `styles.glass`), and FAILS CLOSED when
  // either side cannot be read rather than assuming they agree.
  const radiusRows = [];
  for (const m of mounts) {
    if (!m.node) { radiusRows.push({ m, ok: false, why: 'no AST node' }); continue; }
    const refs = [...m.attrText.matchAll(/\bstyles\.(\w+)\b/g)].map((x) => x[1]);
    const radii = new Set();
    for (const r of refs) {
      const st = allStyles.find((x) => x.file === m.file && x.name === r);
      const v = st?.props.get('borderRadius');
      if (v) radii.add(v);
    }
    let propText = null;
    walk(m.node, (n) => {
      if (propText !== null) return;
      if (n.type !== 'JSXOpeningElement' || n.name?.name !== 'GlassRim') return;
      const a = n.attributes?.find((x) => x.name?.name === 'radius');
      if (a?.value?.type === 'JSXExpressionContainer') {
        propText = parsed.get(m.file).text.slice(a.value.expression.start, a.value.expression.end);
      }
    });
    if (radii.size !== 1) {
      radiusRows.push({ m, ok: false, why: `host borderRadius resolved to ${radii.size} values [${[...radii].join(', ')}]` });
    } else if (propText === null) {
      radiusRows.push({ m, ok: false, why: '<GlassRim> declares no `radius`' });
    } else if (propText !== [...radii][0]) {
      radiusRows.push({ m, ok: false, why: `host \`${[...radii][0]}\` vs rim \`${propText}\`` });
    } else {
      radiusRows.push({ m, ok: true, why: propText });
    }
  }
  const offRadius = radiusRows.filter((r) => !r.ok);
  if (offRadius.length === 0 && radiusRows.length > 0) {
    ok(`E5 every mount's rim radius matches its host's borderRadius ` +
       `(${radiusRows.map((r) => `${path.basename(r.m.file)}:${r.m.line} ${r.why}`).join(', ')})`);
  } else {
    bad("E5 every mount's rim radius matches its host's borderRadius",
      `${offRadius.map((r) => `${rel(r.m.file)}:${r.m.line} — ${r.why}`).join('; ')} — the ` +
      `stack is two absolutely-filled bordered frames, so it traces whatever radius it is ` +
      `told and nothing about the host constrains it`);
  }
}

// ── E4 — BackButton's fill and rim ride ONE predicate ───────────────────────
// This is the only conditional consumer: the same component renders `solid` for
// seven call sites and `glass` for four. The fill and the edge have to arrive
// together, so both read the same identifier rather than each testing `variant`
// independently — two copies of a predicate is two places for a third variant
// to be added to only one of.
{
  const bb = parsed.get(path.join(SRC, 'components/BackButton.js'));
  if (!bb?.ast) {
    bad('E4 BackButton gates fill and rim on one predicate', 'BackButton.js did not parse');
  } else {
    const tests = [];
    walk(bb.ast.program, (node) => {
      if (node.type !== 'ConditionalExpression') return;
      const whole = bb.text.slice(node.start, node.end);
      if (/styles\.glass\b/.test(whole)) tests.push({ role: 'fill', test: bb.text.slice(node.test.start, node.test.end) });
      else if (/<GlassRim\b/.test(whole)) tests.push({ role: 'rim', test: bb.text.slice(node.test.start, node.test.end) });
    });
    const fill = tests.find((t) => t.role === 'fill');
    const rimT = tests.find((t) => t.role === 'rim');
    if (!fill || !rimT) {
      bad('E4 BackButton gates fill and rim on one predicate',
        `found [${tests.map((t) => t.role).join(', ') || 'none'}] — expected one conditional ` +
        `selecting \`styles.glass\` and one selecting \`<GlassRim>\``);
    } else if (fill.test !== rimT.test) {
      bad('E4 BackButton gates fill and rim on one predicate',
        `fill tests \`${fill.test}\`, rim tests \`${rimT.test}\` — two predicates is two ` +
        `places to add a variant, and a variant that gets the fill without the edge is a ` +
        `borrower this gate's E3 cannot see (it is still \`glassFill\`, still mounted, ` +
        `just conditionally unrimmed)`);
    } else {
      ok(`E4 BackButton gates fill and rim on the same predicate (\`${fill.test}\`)`);
    }
  }
}

// ── E6 — the lens veil stays inside the material ────────────────────────────
// The ratified decline, encoded. `glassLens` is the veil INSIDE `GlassView`; a
// borrower circle painted with it would be a conversion, and conversion was
// measured as a regression: `surface`@0.35 vs the shipped 0.40 is -0.6859 /
// -0.5122 / -0.3396 / -0.3409 ΔE00 body-vs-cover on sunlit-honey / wildflower /
// starlight / cream-gold, with zero refraction bought, because the ground under
// every one of these is static.
{
  const lensFiles = new Set();
  for (const [f, { codeOnly }] of parsed) {
    if (/theme\.colors\.glassLens\b/.test(codeOnly)) lensFiles.add(f);
  }
  const expected = rel(CAPSULE);
  const got = [...lensFiles].map(rel).sort();
  if (got.length === 1 && got[0] === expected) {
    ok(`E6 \`glassLens\` appears only in ${expected} — the veil is a property of the ` +
       `material, not a fill anyone can borrow`);
  } else {
    bad('E6 `glassLens` appears only in the material itself',
      `found in [${got.join(', ') || 'nowhere'}], expected only [${expected}] — a surface ` +
      `with a static ground painted at the lens alpha is strictly fainter than the same ` +
      `surface at \`glassFill\`, and buys no refraction to pay for it`);
  }
}

// ── E7 — lone specular rings, named ─────────────────────────────────────────
// `glassRim` without a hairline under it is a DIFFERENT treatment, and it is
// ruled differently: GL7's named declines keep avatar rings, category badges
// and content cards flat — glass is chrome, never content.
//
// It also measures differently, and that is the part worth writing down,
// because GL7(a)'s finding reads like it condemns the lone rim everywhere and
// it does not. "The white rim ALONE is ΔE00 0.1287" is a property of the PAIR,
// not of the token: the glass body sits at 254-255 luminance, so a translucent
// white line has nothing left to be brighter than. Framing a saturated body it
// is perfectly legible — `surface`@0.65 over the five avatar washes measures
// ΔE00 9.3064 / 6.5868 / 4.3743 / 14.7421 / 22.6451 (washYellow / washPeach /
// washSky / accent / accentDeep). Avatar needs no hairline. The capsule did.
//
// EXACT SET, deliberately: a NEW lone-rim borrower is not a defect this row can
// judge, it is a surface that needs its own ruling — so it goes red and gets
// one, rather than joining a list quietly.
{
  const RATIFIED_LONE_RIM = ['src/components/Avatar.js'];
  const loneRim = new Set();
  for (const st of allStyles) {
    if (st.file === GLASS) continue;
    if (st.props.get('borderColor') === 'theme.colors.glassRim') loneRim.add(rel(st.file));
  }
  const got = [...loneRim].sort();
  const want = [...RATIFIED_LONE_RIM].sort();
  if (got.length === want.length && got.every((f, i) => f === want[i])) {
    ok(`E7 lone \`glassRim\` rings are exactly the ratified set (${want.join(', ') || 'none'}) — ` +
       `a specular ring with no hairline under it is legible on a saturated body and ` +
       `near-invisible on a near-white one, so each one is a per-surface ruling`);
  } else {
    bad('E7 lone `glassRim` rings are exactly the ratified set',
      `found [${got.join(', ') || 'none'}], ratified [${want.join(', ') || 'none'}] — this row ` +
      `does NOT say the new one is wrong. It says a surface started wearing the specular ` +
      `half of the stack without the substrate, and whether that reads depends entirely on ` +
      `what it is framing`);
  }
}

// ── C1 — the style/veil COUPLING ────────────────────────────────────────────
// GL7(b′). `glassEffectStyle` and `glassLens` are one setting wearing two
// names. The style decides how much of the ground reaches the surface; the veil
// is then solved so the inactive glyph still holds its floor at the darkest
// column. 0.35 was the answer for `regular`; 0.76 is the answer for `clear`.
// Neither number means anything without the other, and the solve that ties them
// is a DEVICE MEASUREMENT — frames at 0.76 / 0.78 / 0.80, smallest one clearing
// both GL2 bars. Nothing in this repo can re-derive it, which is exactly why it
// needs a row: an un-gated pair is a pair that gets half-retuned.
//
// So this row PINS both and fails naming the re-solve. It is deliberately not
// clever: it does not try to check that the veil is "right" for the style,
// because that would mean re-running the sweep, and a gate that cannot do the
// measurement must not pretend the measurement is still valid. It says the
// inputs moved, so the answer is stale — same job D5's carrier range does one
// layer up, and the same shape as D1's coincident widths.
//
// It also guards D5 from a subtler direction than a retune: the carrier range
// D5 tests was photographed under THIS pair. Change the style and those two
// endpoints describe a material that is no longer mounted, while D5 goes on
// computing happily against them and staying green.
{
  const RULED_STYLE = 'clear';
  const RULED_VEIL = 0.76;

  const capsuleSrc = fs.readFileSync(CAPSULE, 'utf8');
  const styleMatches = [...capsuleSrc.matchAll(/glassEffectStyle=\{?["']([a-z]+)["']\}?/g)].map((m) => m[1]);
  const lens = alphaTokens.get('glassLens');

  if (styleMatches.length !== 1) {
    bad('C1 the glass style/veil pair is the ruled one',
      `found ${styleMatches.length} \`glassEffectStyle\` literals in ${rel(CAPSULE)} ` +
      `(${styleMatches.join(', ') || 'none'}) — this row needs exactly one to pin, and more ` +
      `than one means the rung is chosen somewhere this gate cannot see`);
  } else if (!lens) {
    bad('C1 the glass style/veil pair is the ruled one',
      '`glassLens` did not resolve to a direct `withAlpha(pigment.X, n)` in theme.js — the ' +
      'veil half of the pair is unreadable, so the pair cannot be checked and this row ' +
      'fails closed rather than checking the half it can see');
  } else if (styleMatches[0] === RULED_STYLE && lens.alpha === RULED_VEIL) {
    ok(`C1 style/veil pair is the ruled one (\`${RULED_STYLE}\` + glassLens ${RULED_VEIL}) — ` +
       `solved together on frames, so D5's measured carrier range still describes the ` +
       `material that is actually mounted`);
  } else {
    bad('C1 the glass style/veil pair is the ruled one',
      `found \`${styleMatches[0]}\` + glassLens ${lens.alpha}, ruled \`${RULED_STYLE}\` + ` +
      `${RULED_VEIL}. This row does NOT say the new value is wrong. It says the pair was ` +
      `solved as a pair on measured frames — the smallest alpha whose glyph floor at the ` +
      `darkest column clears 3:1 AND does not regress against the rung it replaced — so ` +
      `moving either half re-opens that solve. Re-sweep, re-measure the carrier range D5 ` +
      `reads, and update all three together ` +
      `(GUIDES/POLLINATE_GL7_MATERIAL_TRANSMISSION.md §3b)`);
  }
}

console.log(`\ncheck-glass-definition: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
