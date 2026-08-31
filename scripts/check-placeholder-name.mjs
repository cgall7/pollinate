// Row 1.14 (ENG-96 placeholder-class helper, ENG-97 comb-aware owner-name
// read, R-38.9-G/-H's render sites) — POLLINATE_COMB_ROTATION.md
// §1B.35.3(b) / §1B.38.12 / §1B.38.15-17.
//
//   npm run check:placeholder-name
//
// WHAT IT ASSERTS
//
//   R1  `isPlaceholderName` classifies exactly '', 'New user', null and
//       undefined as placeholder-class — the ratified class (§1B.35.3(b)),
//       no wider and no narrower
//   R2  'Someone' is NOT a member of the class, in the source itself — a
//       source-level guard, not just a behavioral one, because §1B.38.12
//       refused widening this specific class for a stated reason
//       ('Someone' is the AUTHORIZATION word, §1B.35.2) and a future edit
//       adding it back to the Set would pass a behavior-only test just as
//       easily as it violates the ruling
//   R3  `RotationFold.js`'s member subjectLine renders the constant
//       'Writing for someone' (lowercase, embedded) for a placeholder-class
//       subject — gated on `isPlaceholderName`, never the raw value
//   R4  `ComposeHiveEntry.js`'s title renders "What's something you're
//       grateful for about this person?" for a placeholder-class
//       subjectName — antecedent-free, gated on `isPlaceholderName`
//   R5  `ContributingHive.js`'s banner (both the name line and the
//       attribution line) renders lowercase 'someone' for a placeholder-
//       class `hive.subjectName` — a single derived value feeding both,
//       not two independent guards that could drift
//   R6  `ReceivedPackages.js`'s row subtitle renders "A hive for you"
//       unconditionally — R-38.9-H: the reader IS the referent on every
//       row admitted by `listReceivedPackages`' subject-scoped filter, so
//       the string never interpolates a name at all, placeholder-class or
//       not
//   R7  each of the four render sites (R3-R6's three, minus R6 which takes
//       no name) imports `isPlaceholderName` from '../utils/placeholderName'
//   R8  `HiveStore.listContributingHives` and `.getContributingHive` both
//       resolve `ownerName` through the same three-step chain, in order:
//       the comb-aware read (`combOwnerNames`), then the direct `profiles`
//       join, then the honest-refusal fallback `'Someone'` — comb-aware
//       first, because a comb writer usually has no honeycomb connection
//       to the organizer and the direct join returns nothing for them
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const HELPER = path.join(SRC, 'utils/placeholderName.js');
const FOLD = path.join(SRC, 'components/RotationFold.js');
const COMPOSE = path.join(SRC, 'screens/ComposeHiveEntry.js');
const CONTRIBUTING = path.join(SRC, 'screens/ContributingHive.js');
const RECEIVED = path.join(SRC, 'screens/ReceivedPackages.js');
const HIVE_STORE = path.join(SRC, 'services/HiveStore.js');

let pass = 0;
const failures = [];
const ok = (label) => { pass += 1; console.log(`  ok   ${label}`); };
const bad = (label, detail) => {
  failures.push(`${label} — ${detail}`);
  console.log(`  FAIL ${label} — ${detail}`);
};

const parseJs = (src) => parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
const walk = (node, fn) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => walk(n, fn)); return; }
  if (typeof node.type === 'string') fn(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments') continue;
    walk(node[key], fn);
  }
};
const codeOnly = (src, ast) =>
  (ast.comments || [])
    .slice()
    .sort((a, b) => b.start - a.start)
    .reduce((s, c) => s.slice(0, c.start) + ' '.repeat(c.end - c.start) + s.slice(c.end), src);

const helperSrc = fs.readFileSync(HELPER, 'utf8');
const foldSrc = fs.readFileSync(FOLD, 'utf8');
const composeSrc = fs.readFileSync(COMPOSE, 'utf8');
const contributingSrc = fs.readFileSync(CONTRIBUTING, 'utf8');
const receivedSrc = fs.readFileSync(RECEIVED, 'utf8');
const hiveStoreSrc = fs.readFileSync(HIVE_STORE, 'utf8');

const foldAst = parseJs(foldSrc);
const composeAst = parseJs(composeSrc);
const contributingAst = parseJs(contributingSrc);
const hiveStoreAst = parseJs(hiveStoreSrc);
const foldCode = codeOnly(foldSrc, foldAst);
const composeCode = codeOnly(composeSrc, composeAst);
const contributingCode = codeOnly(contributingSrc, contributingAst);
const hiveStoreCode = codeOnly(hiveStoreSrc, hiveStoreAst);

// ── R1/R2. the pure classifier, tested directly, and its source guarded ──
{
  const { isPlaceholderName } = await import(`${HELPER}?t=${Date.now()}`);
  const cases = [
    ['', true], ['New user', true], [null, true], [undefined, true],
    ['Someone', false], ['Sarah', false], ['New user ', false], ['new user', false],
  ];
  const problems = cases
    .map(([input, expected]) => [input, expected, isPlaceholderName(input)])
    .filter(([, expected, actual]) => actual !== expected);
  if (problems.length === 0) {
    ok('R1 isPlaceholderName classifies exactly \'\', \'New user\', null, undefined as placeholder-class');
  } else {
    bad('R1 isPlaceholderName classification', problems.map(([i, e, a]) => `isPlaceholderName(${JSON.stringify(i)}) === ${a}, expected ${e}`).join(' | '));
  }

  // Source-level, not just behavioral — a Set literal is the one place a
  // future edit would add 'Someone' back in without touching the exported
  // function's observable shape at every one of these test cases.
  const setMatch = helperSrc.match(/new Set\(\[([^\]]*)\]\)/);
  const setLiteral = setMatch ? setMatch[1] : '';
  if (setLiteral && !/['"]Someone['"]/.test(setLiteral)) {
    ok('R2 \'Someone\' is not a member of PLACEHOLDER_NAMES in source — §1B.38.12\'s refusal holds structurally');
  } else {
    bad('R2 PLACEHOLDER_NAMES source guard', setLiteral ? `found 'Someone' in the Set literal: ${setLiteral}` : 'could not find the PLACEHOLDER_NAMES Set literal — FAILS CLOSED');
  }
}

// ── R3. RotationFold member subjectLine ──────────────────────────────────
{
  const hasImport = /import\s*{\s*isPlaceholderName\s*}\s*from\s*['"]\.\.\/utils\/placeholderName['"]/.test(foldSrc);
  const hasGuardedLine =
    /isPlaceholderName\(subjectName\)\s*\?\s*['"]Writing for someone['"]\s*:\s*`Writing for \$\{subjectName\}`/.test(foldCode);
  if (hasImport && hasGuardedLine) {
    ok("R3 RotationFold renders 'Writing for someone' for a placeholder-class subject, gated on isPlaceholderName");
  } else {
    bad('R3 RotationFold placeholder guard', `import found=${hasImport}, guarded-line found=${hasGuardedLine}`);
  }
}

// ── R4. ComposeHiveEntry title ────────────────────────────────────────────
{
  const hasImport = /import\s*{\s*isPlaceholderName\s*}\s*from\s*['"]\.\.\/utils\/placeholderName['"]/.test(composeSrc);
  const hasGuardedLine =
    /isPlaceholderName\(subjectName\)\s*\n?\s*\?\s*"What's something you're grateful for about this person\?"/.test(composeCode);
  if (hasImport && hasGuardedLine) {
    ok('R4 ComposeHiveEntry renders the antecedent-free title for a placeholder-class subjectName, gated on isPlaceholderName');
  } else {
    bad('R4 ComposeHiveEntry placeholder guard', `import found=${hasImport}, guarded-line found=${hasGuardedLine}`);
  }
}

// ── R5. ContributingHive banner — one derived value, both lines ─────────
{
  const hasImport = /import\s*{\s*isPlaceholderName\s*}\s*from\s*['"]\.\.\/utils\/placeholderName['"]/.test(contributingSrc);
  let derivedName = null;
  walk(contributingAst.program, (n) => {
    if (derivedName) return;
    if (n.type === 'VariableDeclarator' && n.init?.type === 'ConditionalExpression') {
      const initSrc = contributingSrc.slice(n.init.start, n.init.end);
      if (/isPlaceholderName\(hive\.subjectName\)/.test(initSrc) && /'someone'/.test(initSrc)) {
        derivedName = n.id.name;
      }
    }
  });
  if (!hasImport || !derivedName) {
    bad('R5 ContributingHive placeholder guard', `import found=${hasImport}, derived fallback variable found=${!!derivedName}`);
  } else {
    // Both rendered lines must reference the SAME derived variable — a
    // separate ad-hoc check on either line could drift from the other.
    const nameLineUses = new RegExp(`\\{${derivedName}\\}`).test(contributingCode.match(/bannerName[^<]*<Text[^>]*>\{[^}]*\}/)?.[0] ?? contributingCode);
    const attributionUses = new RegExp(`A hive for \\{${derivedName}\\}, from`).test(contributingCode);
    if (nameLineUses && attributionUses) {
      ok(`R5 ContributingHive's banner name and attribution lines both render the placeholder-guarded '${derivedName}' — never hive.subjectName directly`);
    } else {
      bad('R5 ContributingHive placeholder guard', `banner name line uses derived value=${nameLineUses}, attribution line uses derived value=${attributionUses}`);
    }
  }
}

// ── R6. ReceivedPackages subtitle — unconditional second person ─────────
{
  const hasLiteral = /A hive for you/.test(receivedSrc);
  const stillInterpolatesSubject = /A hive for \{[^}]*subjectName[^}]*\}/.test(receivedSrc);
  if (hasLiteral && !stillInterpolatesSubject) {
    ok("R6 ReceivedPackages renders 'A hive for you' unconditionally — never interpolates pkg.subjectName (R-38.9-H)");
  } else {
    bad('R6 ReceivedPackages second-person subtitle', `literal found=${hasLiteral}, still interpolates subjectName=${stillInterpolatesSubject}`);
  }
}

// ── R8. HiveStore owner-name resolution order — comb-aware, then direct
//       join, then honest refusal (ENG-97) ──────────────────────────────
{
  const problems = [];
  for (const [fnName, mapKey] of [['listContributingHives', 'h.id'], ['getContributingHive', 'hive.id']]) {
    let fnNode = null;
    walk(hiveStoreAst.program, (n) => {
      if (fnNode) return;
      if ((n.type === 'ObjectMethod' || n.type === 'Property') && n.key?.name === fnName) fnNode = n;
    });
    if (!fnNode) {
      problems.push(`${fnName}: could not locate the method — FAILS CLOSED`);
      continue;
    }
    const body = hiveStoreCode.slice(fnNode.start, fnNode.end);
    const usesCombOwnerNames = new RegExp(`combOwnerNames\\.get\\(${mapKey.replace('.', '\\.')}\\)`).test(body);
    const chainOrder = new RegExp(
      `combOwnerNames\\.get\\(${mapKey.replace('.', '\\.')}\\)\\s*\\|\\|[^|]*\\|\\|\\s*['"]Someone['"]`
    ).test(body);
    if (usesCombOwnerNames && chainOrder) {
      ok(`R8 ${fnName} resolves ownerName as combOwnerNames → direct join → 'Someone', in that order`);
    } else {
      problems.push(`${fnName}: combOwnerNames read found=${usesCombOwnerNames}, three-step || chain in order found=${chainOrder}`);
    }
  }
  if (problems.length) bad('R8 HiveStore owner-name resolution order', problems.join(' | '));
}

console.log(`\ncheck-placeholder-name: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
