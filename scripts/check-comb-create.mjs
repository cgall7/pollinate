import fs from 'node:fs';
const screen = fs.readFileSync(new URL('../src/screens/CreateComb.js', import.meta.url), 'utf8');
const store = fs.readFileSync(new URL('../src/services/CombStore.js', import.meta.url), 'utf8');
const invite = fs.readFileSync(new URL('../src/screens/CombInvite.js', import.meta.url), 'utf8');

// ── R-RF-3 (Lumen): ONE INPUT REGISTER PER FLOW ─────────────────────────────
// CombInviteName shipped the boxed input (surface fill, 1pt surfaceBorderStrong,
// radius 14, minHeight 54) and CreateComb shipped a bare underline, one screen
// apart in the same flow. The boxed register won and CreateComb's two inputs
// adopted it.
//
// The row compares the two files' `input` blocks rather than restating the
// values, because a checker holding its own copy of a constant is blind to
// exactly one drift: the drift between its copy and the source. CombInvite is
// the WRITER here (it is the register that won), so its value expressions are
// read out and CreateComb's are required to match them character for character.
// Retuning the register on the invite screen therefore reds this row until the
// create screen follows, which is the coupling the ruling actually asked for.
//
// The list is the ruled register, not every property of the style: `bodyLg` vs
// `body` and `marginTop` are deliberately NOT compared. They are type scale and
// flow rhythm, which the ruling left to each screen.
const REGISTER_KEYS = ['backgroundColor', 'borderWidth', 'borderColor', 'borderRadius', 'minHeight', 'paddingHorizontal'];
// Named exclusions, each with a reason, so the completeness row below can be
// exhaustive instead of approximate. `color` is pigment rather than box, and
// the two screens already agree on it independently of this ruling.
const EXCLUDED_KEYS = ['color'];

const inputBlock = (src, file) => {
  const start = src.indexOf('input: {');
  if (start === -1) throw new Error(`no \`input\` style block in ${file}`);
  let depth = 0;
  for (let i = src.indexOf('{', start); i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') { depth -= 1; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error(`unterminated \`input\` style block in ${file}`);
};
const registerOf = (block) => Object.fromEntries(REGISTER_KEYS
  .map((key) => [key, block.match(new RegExp(`\\b${key}:\\s*([^,}]+)`))?.[1].trim()])
  .filter(([, value]) => value !== undefined));

const inviteInput = inputBlock(invite, 'CombInvite.js');
const createInput = inputBlock(screen, 'CreateComb.js');
const inviteRegister = registerOf(inviteInput);
const createRegister = registerOf(createInput);

const checks = [
  // COMPLETENESS, and this is the row the equality below cannot stand in for.
  // A key missing on either side already reds the equality (it compares against
  // `undefined`), so that is not what this guards. What the equality CANNOT see
  // is its own list shrinking: drop `borderRadius` from REGISTER_KEYS and it
  // passes over five keys, silently, reading exactly like a green register. It
  // is equally blind to the writer GAINING a property nobody adopted. So the
  // list is checked against the writer's actual block: every top-level key in
  // CombInvite's `input` is either a ruled register property or one of the few
  // named exclusions, and nothing else exists.
  ['the register list is the writer\'s whole box, no silent trim and no new property',
    (() => {
      const present = [...inviteInput.matchAll(/(?:^|[,{])\s*([A-Za-z][\w]*)\s*:/g)].map((m) => m[1]).filter((k) => k !== 'input');
      const accounted = new Set([...REGISTER_KEYS, ...EXCLUDED_KEYS]);
      return present.length > 0 &&
        present.every((k) => accounted.has(k)) &&
        REGISTER_KEYS.every((k) => present.includes(k));
    })()],
  ['CreateComb adopts CombInviteName\'s boxed input register verbatim',
    REGISTER_KEYS.every((key) => createRegister[key] !== undefined && createRegister[key] === inviteRegister[key])],
  ['CreateComb\'s underline register is gone, not merely overlaid',
    !/borderBottomWidth/.test(createInput)],
  ['both CreateComb inputs wear that one register',
    (screen.match(/<TextInput\b/g) ?? []).length === 2 &&
      (screen.match(/<TextInput[^>]*style=\{styles\.input\}/g) ?? []).length === 2],
  // ── R-RF-1 (Lumen): the title ─────────────────────────────────────────────
  // "Who are you gathering around?" was stale subject-era copy. The screen
  // stopped collecting a subject in the 09-04 DES-29 amendment, so the question
  // primed comb-as-one-recipient against the rotation model, over a field that
  // collects the comb's NAME.
  ['title is the ruled one', screen.includes('<Text style={styles.title}>Gather your people.</Text>')],
  ['stale subject-era title is gone', !screen.includes('Who are you gathering around')],
  ['cadence choice exists', screen.includes('const CADENCES') && screen.includes('setCadence')],
  ['cadence persists into comb insert', store.includes('.insert({ owner_id: ownerId, name: label, cadence })')],
  ['no client clock argument', !store.includes('p_closes_at')],
  ['organizer name commits before create', screen.includes('await CombStore.saveOrganizerName(organizerName)')],
  ['uses the shared placeholder class', screen.includes("import { isPlaceholderName } from '../utils/placeholderName'" )],
  ['success returns to the organizer card on Today', screen.includes("navigation.replace('Main', { screen: 'Today' })")],
  // DES-29 §4 amendment (2026-09-04): createComb is insert-only now — the
  // subject question and the mint call both left this screen entirely.
  ['createComb takes no subject', !screen.includes('subjectProfileId')],
  ['createComb never calls the mint RPC', !screen.includes('openFirstRotation')],
  ['no connections read on this screen', !screen.includes('HoneycombStore')],
  ['createComb is insert-only, no mint call inside it', (() => {
    const start = store.indexOf('async createComb(');
    const body = store.slice(start, store.indexOf('\n};', start));
    return start !== -1 && !body.includes('openFirstRotation') && !body.includes('subjectProfileId');
  })()],
];
let failed = 0;
for (const [label, ok] of checks) {
  if (ok) {
    console.log(`✓ ${label}`);
  } else {
    console.error(`✗ ${label}`);
    failed += 1;
  }
}
console.log(`${checks.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
