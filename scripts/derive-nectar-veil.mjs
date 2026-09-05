// R-N3.5 — the veil re-solve. Derivation and verification.
//   node scripts/derive-nectar-veil.mjs
//
// NOT a gate — `run-checks.mjs` enumerates `scripts/check-*.mjs` and this is
// deliberately not one, exactly as `derive-spotlight-dim.mjs` is not one. It is
// the REPRODUCTION for the table published in the channel and in
// POLLINATE_NECTAR_LIVING_EXCHANGE.md (Lumen, design workspace).
//
// Every spec cited in this file lives in the design workspace, not at
// any path in this repo; nothing under `GUIDES/` is in this tree, so a
// bare `GUIDES/...` address opens nothing for whoever reads this file
// next.
//
// Every input is read out of src/constants/theme.js and
// src/constants/hiveThemes.js source; nothing typed twice, so this file cannot
// drift from the tokens it reasons about.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { over, deltaE00, rgbToLab, parseColor, contrastRatio, calibrate } =
  await import(pathToFileURL(path.join(ROOT, 'scripts', 'lib', 'color.mjs')).href);
console.log(`color.mjs self-calibration: ${calibrate() ? 'GREEN' : 'RED'}\n`);

const src = fs.readFileSync(path.join(ROOT, 'src/constants/theme.js'), 'utf8');
const hivesSrc = fs.readFileSync(path.join(ROOT, 'src/constants/hiveThemes.js'), 'utf8');
const pig = (n) => {
  const m = new RegExp(`\\b${n}:\\s*'(#[0-9A-Fa-f]{6})'`).exec(src);
  if (!m) throw new Error(`pigment ${n} not found`);
  return m[1];
};
const alphaOf = (key) =>
  Number(new RegExp(`\\b${key}:\\s*withAlpha\\([^,]*(?:\\([^)]*\\))?[^,]*,\\s*([0-9.]+)\\)`).exec(src)[1]);

const P = Object.fromEntries(['ink', 'inkSoft', 'inkVeil', 'accentDeep', 'surface', 'background',
  'backgroundWriting', 'washPeach', 'washSky', 'washYellow', 'paperEvening'].map((n) => [n, pig(n)]));
const A = (hex, a) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); return `rgba(${r}, ${g}, ${b}, ${a})`; };
const mix = (x, y, t) => { const p = (h) => [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16)); const [a, b] = [p(x), p(y)];
  return '#' + [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t).toString(16).padStart(2, '0')).join('').toUpperCase(); };
const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
const L = (c) => rgbToLab(c).L;
const C = (c) => { const { a, b } = rgbToLab(c); return Math.hypot(a, b); };
const H = (c) => { const { a, b } = rgbToLab(c); return (Math.atan2(b, a) * 180 / Math.PI + 360) % 360; };

const LIVE_ALPHA = alphaOf('scrim');
const SHIPPED_PIGMENT = P.inkVeil;
const SPOT = A(mix(P.accentDeep, P.inkVeil, 0.25), alphaOf('spotlightDim'));

// THE POPULATION. `theme.colors.scrim` is ONE number read by four sites —
// WriteInbox:539 (NotesInbox:252 and SeedsInbox:460 before R-WD merged them
// into one typed inbox), MintRotationSheet:106, NectarConsentSheet:81,
// PackageOpen:915 (`sendScrim`) — so the re-solve is scoped to every ground any
// of them sits on, per the ruling's own "the token is one number". The four
// cover bases are read out of hiveThemes.js's `base:` list rather than typed.
const coverNames = [...hivesSrc.matchAll(/base:\s*theme\.colors\.(\w+)/g)].map((m) => m[1]);
const GROUNDS = [
  ['background', P.background, 'inbox overlays, mint sheet, cover 1'],
  ...coverNames.filter((n) => n !== 'background').map((n) => [n, P[n], 'hive cover']),
  ['paperEvening', P.paperEvening, 'evening entry'],
];
if (coverNames.length !== 4) throw new Error(`expected 4 cover bases, hiveThemes.js gave ${coverNames.length}`);

// THE BARS. Three are inherited and one is ruled by R-N3.5.
//   ruled     — the scrimmed ground keeps at least half its LCh chroma.
//   inherited — R-N3.2's backed drop stays >= 16.4244 from every ground it crosses.
//   inherited — `spotlightDim` was DERIVED (R6) to be distinguishable from this
//               token: theme.js publishes dE00 16.41 on the page as "improved".
//               The two mean opposite things; converging them deletes that.
//   inherited — the modal card must separate from the page it makes inert.
const DROP = over('rgba(255,122,0,0.5)', P.surface);
const DROP_FLOOR = 16.4244;
const RETENTION_FLOOR = 0.5;
const veil = (a, p = SHIPPED_PIGMENT) => A(p, a);
const worstRetention = (css) => {
  let worst = Infinity, where = '';
  for (const [name, g] of GROUNDS) {
    const bare = C(parseColor(g));
    if (bare < 2) continue; // an achromatic ground has no chroma to retain
    const r = C(over(css, g)) / bare;
    if (r < worst) { worst = r; where = name; }
  }
  return [worst, where];
};
const dropMin = (css) => {
  const covers = coverNames.map((n) => P[n]);
  return Math.min(...[P.surface, ...covers, ...covers.map((c) => over(css, c)), P.paperEvening]
    .map((g) => deltaE00(DROP, g)));
};
const vsSpot = (css) => deltaE00(over(SPOT, P.background), over(css, P.background));
const cardSep = (css) => deltaE00(P.surface, over(css, P.background));
const SPOT_BAR = vsSpot(veil(LIVE_ALPHA));
const CARD_BAR = cardSep(veil(LIVE_ALPHA));

// --------------------------------------------------------------- 1. the defect
console.log(`SHIPPED  ${SHIPPED_PIGMENT} @ ${LIVE_ALPHA}, on all ${GROUNDS.length} grounds the token is painted over:\n`);
console.log('ground              bare      L*     C*      h       scrimmed   L*     C*      h      dh      RETAINED');
for (const [name, g] of GROUNDS) {
  const b = parseColor(g), s = over(veil(LIVE_ALPHA), g);
  const ret = 100 * C(s) / C(b);
  console.log(`${name.padEnd(18)} ${hex(b)} ${L(b).toFixed(1).padStart(5)} ${C(b).toFixed(2).padStart(6)} ${H(b).toFixed(1).padStart(6)}    ${hex(s)} ${L(s).toFixed(1).padStart(5)} ${C(s).toFixed(2).padStart(6)} ${H(s).toFixed(1).padStart(6)} ${(H(s) - H(b)).toFixed(1).padStart(6)}   ${ret.toFixed(1).padStart(6)}% ${ret < 100 * RETENTION_FLOOR ? ' <- BELOW THE RULED FLOOR' : ''}`);
}
console.log(`\nThe ruling quotes rgb(163,156,122) on the compose cream and calls it olive. That composite`);
console.log(`retains ${(100 * C(over(veil(LIVE_ALPHA), P.background)) / C(parseColor(P.background))).toFixed(1)}% of the cream's chroma, so the ruled row is GREEN on the ground the ruling names.`);
console.log(`Its hue moves ${(H(over(veil(LIVE_ALPHA), P.background)) - H(parseColor(P.background))).toFixed(1)} degrees. "Olive" here is a LIGHTNESS fact at held hue, not a chroma fact.`);
console.log(`The row is RED on washSky, where a warm veil cancels a cool ground: C* ${C(over(veil(LIVE_ALPHA), P.washSky)).toFixed(2)}, a grey.`);
console.log(`That is spotlightDim's own retired defect (C* 2.83, theme.js) on a different ground.\n`);

// ------------------------------------------------- 2. the pigment half is swept
// GL2's method is to sweep the PAIR. Each candidate pigment gets the alpha that
// HOLDS the shipped scrimmed L* on the calibration ground, which is
// derive-spotlight-dim.mjs's shape: hold the dimming, buy the hue for free.
const CAL = P.background;
const targetL = L(over(veil(LIVE_ALPHA), CAL));
const solveAlpha = (p) => {
  let lo = 0, hi = 1;
  for (let i = 0; i < 80; i += 1) { const m = (lo + hi) / 2; (L(over(A(p, m), CAL)) > targetL) ? (lo = m) : (hi = m); }
  return (lo + hi) / 2;
};
console.log(`PIGMENT HALF — alpha solved per candidate to hold L* = ${targetL.toFixed(4)} on ${CAL}:\n`);
console.log('candidate                      pigment   alpha    retention   drop min   vs spotDim   card sep   verdict');
const cands = [];
for (const [nm, base] of [['accentDeep', P.accentDeep], ['paperEvening', P.paperEvening]]) {
  for (const t of [0.25, 0.5, 0.75]) cands.push([`mix(${nm},inkVeil,${t})`, mix(base, P.inkVeil, t)]);
}
for (const [label, p] of cands) {
  const a = solveAlpha(p), css = A(p, a);
  const [w] = worstRetention(css), d = dropMin(css), vs = vsSpot(css), cs = cardSep(css);
  const pass = w >= RETENTION_FLOOR && d >= DROP_FLOOR && vs >= SPOT_BAR && cs >= CARD_BAR;
  const why = [w < RETENTION_FLOOR && 'retention', d < DROP_FLOOR && 'drop', vs < SPOT_BAR && 'spotlightDim', cs < CARD_BAR && 'cardSep'].filter(Boolean);
  console.log(`${label.padEnd(30)} ${p}  ${a.toFixed(4)}  ${(100 * w).toFixed(1).padStart(8)}%  ${d.toFixed(4).padStart(8)}  ${vs.toFixed(2).padStart(10)}  ${cs.toFixed(2).padStart(8)}   ${pass ? 'PASS' : 'fails ' + why.join('+')}`);
}
console.log(`\nWarming the veil is forbidden twice over, and neither reason was available to the ruling:`);
console.log(`  (a) it collapses the spotlightDim separation theme.js publishes as ${SPOT_BAR.toFixed(2)};`);
console.log(`  (b) the drop is amber by R-N3.2, so an amber veil camouflages the thing in flight.`);
console.log(`Cooling it fails the ruled row outright — a cool veil over warm cream cancels chroma.`);
console.log(`Maximising retention as an objective lands on green, which theme.js:46 forbids outright.\n`);

// ------------------------------------------------------- 3. the alpha half wins
console.log('ALPHA HALF — the shipped pigment, alpha swept. Every bar moves the same way:\n');
console.log('alpha   cream scrimmed   L*     C*      h    retention (worst ground)   drop min   vs spotDim   card sep   card contrast');
for (const a of [0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75]) {
  const css = veil(a), s = over(css, P.background), [w, where] = worstRetention(css);
  console.log(`${a.toFixed(2)}    ${hex(s)}  ${L(s).toFixed(1).padStart(5)} ${C(s).toFixed(2).padStart(6)} ${H(s).toFixed(1).padStart(6)}   ${(100 * w).toFixed(1).padStart(6)}% ${where.padEnd(12)} ${dropMin(css).toFixed(4).padStart(8)}  ${vsSpot(css).toFixed(2).padStart(10)}  ${cardSep(css).toFixed(2).padStart(8)}  ${contrastRatio(P.surface, s).toFixed(2).padStart(12)}`);
}
let a50 = null;
for (let a = LIVE_ALPHA; a <= 0.95; a += 0.001) { if (a50 === null && worstRetention(veil(a))[0] >= RETENTION_FLOOR) a50 = a; }
console.log(`\nsmallest alpha clearing the ruled row on EVERY ground: ${a50.toFixed(3)} (${(100 * worstRetention(veil(a50))[0]).toFixed(1)}% — a thin margin; GL2 says prefer a failing ground to one of these)`);
console.log(`the drop floor is INSENSITIVE to alpha in this direction: it is set by washPeach BARE, a ground the veil never touches.`);

// --------------------------------------------------------------- 4. the cost
console.log('\nCOST, stated rather than buried. What a heavier veil does to what sits on it and under it:\n');
console.log('alpha   evening entry under the veil   card(surface) contrast   ink ON the scrimmed page');
for (const a of [0.40, 0.55, 0.65, 0.70]) {
  const cream = over(veil(a), P.background);
  console.log(`${a.toFixed(2)}    ${hex(over(veil(a), P.paperEvening))}  L* ${L(over(veil(a), P.paperEvening)).toFixed(2).padStart(5)}                 ${contrastRatio(P.surface, cream).toFixed(2).padStart(5)}                  ${contrastRatio(P.ink, cream).toFixed(2).padStart(5)}`);
}
console.log('\nThe last column is a cost and NOT a bar: under a modal the page is inert by definition,');
console.log('and on the one mount where something must stay readable through it (PackageOpen\'s');
console.log('sendScrim) R-N3.3 already fades the veil to zero across Gather.');
console.log('\nUNOWNED, AND FLAGGED AS SUCH: "olive" has no numeric band anywhere in this repo.');
console.log('theme.js:46 says "Zero green anywhere" in prose and no gate defines a hue band.');
console.log('Stating one here (L* 40-70, h 70-110, C* > 10) puts the cream outside it at alpha 0.675,');
console.log('but that number rests on a band I wrote, so it is reported and never used to pick.');
