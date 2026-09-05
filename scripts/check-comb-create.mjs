import fs from 'node:fs';
const screen = fs.readFileSync(new URL('../src/screens/CreateComb.js', import.meta.url), 'utf8');
const store = fs.readFileSync(new URL('../src/services/CombStore.js', import.meta.url), 'utf8');
// R-RF-3 reads a second screen because the claim is about the PAIR: the
// invite flow's boxed input is the register, this screen's inputs are the
// adopters. Read, never restated — a row that restated the six attributes
// would keep passing while the register it names drifted underneath it.
const inviteScreen = fs.readFileSync(new URL('../src/screens/CombInvite.js', import.meta.url), 'utf8');
const inputDecl = (source) => {
  const start = source.indexOf('input: {');
  if (start === -1) return null;
  const end = source.indexOf('}', start);
  return end === -1 ? null : source.slice(start, end + 1);
};
const REGISTER_KEYS = ['backgroundColor', 'borderWidth', 'borderColor', 'borderRadius', 'minHeight', 'paddingHorizontal'];
const registerAttrs = (decl) =>
  decl == null
    ? []
    : REGISTER_KEYS.map((key) => {
        const hit = decl.match(new RegExp(`\\b${key}: [^,}]+`));
        return hit ? hit[0].trim() : null;
      }).filter(Boolean);
const inviteRegister = registerAttrs(inputDecl(inviteScreen));
const createDecl = inputDecl(screen);
const checks = [
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
  // R-RF-1 (Lumen, 2026-09-05). "Who are you gathering around?" was
  // subject-era copy left behind by the 09-04 DES-29 amendment: it primed
  // comb-as-one-recipient against the rotation model, over a field that
  // collects the comb's NAME. The negative is the specific string that was
  // wrong, not a general one, because the defect was this sentence.
  ['title asks for the comb, not a subject', screen.includes('<Text style={styles.title}>Gather your people.</Text>') && !screen.includes('Who are you gathering around')],
  // R-RF-3. Vacuity guard first: if the extraction ever stops finding the
  // register, this row must red rather than pass over an empty list.
  ['the invite flow still declares the boxed input register', inviteRegister.length === REGISTER_KEYS.length],
  ['this screen adopts that register attribute for attribute', createDecl != null && inviteRegister.length === REGISTER_KEYS.length && inviteRegister.every((attr) => createDecl.includes(attr))],
  ['the underline register is gone from this screen', createDecl != null && !createDecl.includes('borderBottomWidth')],
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
