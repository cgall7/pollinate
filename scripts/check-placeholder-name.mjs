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
//       resolve `ownerName` by `combOwnerNames.has(id)` first — a
//       comb-linked hive's answer, `null` or a real name, is final — falling
//       to `resolveDirectName` (R12) only when the hive is NOT comb-linked
//       at all (Finding A, thread b57ad406, 2026-08-31: a placeholder-class
//       comb name must never fall through to 'Someone')
//   R9  `resolveCombOwnerNames` nulls out a placeholder-class resolved name
//       (`isPlaceholderName(name) ? null : name`) rather than passing it
//       through — the source of R8's "final answer, not a fallback rung"
//   R10 `TodayTab.js`'s contributing-hive row renders "From {ownerName}"
//       only when `hive.ownerName` is truthy — omitted, not "From null",
//       when a comb organizer's name is placeholder-class
//   R11 `ContributingHive.js`'s banner omits ", from {ownerName}" under the
//       same condition, and `rosterLabel` never drops a real writer from
//       its numeric count when the owner's name is absent, and its
//       zero-displayable-name case degrades to the same numeric form as
//       its >4 case (R-38.9 §3, Lumen 2026-08-31) rather than a fabricated
//       "Writing with someone." — this screen's own house word for
//       'someone' names the SUBJECT, not the organizer
//   R12 Row 1.15 (residuals 1+2, ruled thread b57ad406, 2026-08-31):
//       `resolveDirectName` in `HiveStore.js` gives the direct `profiles`
//       join the same three states as `resolveCombOwnerNames` — a map-miss
//       (the read was refused or the row absent) answers 'Someone'; a
//       read-succeeded placeholder-class name answers `null`; a real name
//       passes through — and both `listContributingHives`/
//       `getContributingHive`'s direct-join term AND `getHiveContributors`
//       route through it, closing the divergence Finding A's fix left on
//       the branch with a shipped producer
//   R13 `HiveDetail.js`'s `rosterLabel` filters `null` names out of its
//       display list but still counts every contributor (including an
//       unnamed one) toward its numeric "N of you are writing" branch —
//       never renders a literal "with null." and never drops a real,
//       unnamed writer from the count
//   R14 `TodayTab.js`'s `ContributingHiveRow` never renders `<Avatar>` on a
//       null `ownerName` — R-38.9-J: the row degrades to a plain,
//       cover-theme-tinted disc (same 40pt geometry, no glyph) instead of
//       `avatarColorFor(null)`'s single always-the-same wash asserting an
//       unknown person the text just declined to name
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
const TODAY_TAB = path.join(SRC, 'screens/TodayTab.js');
const HIVE_DETAIL = path.join(SRC, 'screens/HiveDetail.js');

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
const todayTabSrc = fs.readFileSync(TODAY_TAB, 'utf8');
const hiveDetailSrc = fs.readFileSync(HIVE_DETAIL, 'utf8');

const foldAst = parseJs(foldSrc);
const composeAst = parseJs(composeSrc);
const contributingAst = parseJs(contributingSrc);
const hiveStoreAst = parseJs(hiveStoreSrc);
const todayTabAst = parseJs(todayTabSrc);
const hiveDetailAst = parseJs(hiveDetailSrc);
const foldCode = codeOnly(foldSrc, foldAst);
const composeCode = codeOnly(composeSrc, composeAst);
const contributingCode = codeOnly(contributingSrc, contributingAst);
const hiveStoreCode = codeOnly(hiveStoreSrc, hiveStoreAst);
const todayTabCode = codeOnly(todayTabSrc, todayTabAst);
const hiveDetailCode = codeOnly(hiveDetailSrc, hiveDetailAst);

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

// ── R8. HiveStore owner-name resolution — comb-linked answer is FINAL
//       (Finding A), direct join + 'Someone' only when not comb-linked ──
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
    const mapKeyEsc = mapKey.replace('.', '\\.');
    // `.has()`, not `||` — a comb-linked hive whose resolved name is `null`
    // must NOT fall through to the direct join or 'Someone' (Finding A).
    // The else arm routes through `resolveDirectName` (R12), not a raw
    // `.get(...) || 'Someone'` — a truthy-|| fallthrough there is exactly
    // the divergence Vector's residual 1 found.
    const hasGuard = new RegExp(
      `combOwnerNames\\.has\\(${mapKeyEsc}\\)\\s*\\?\\s*combOwnerNames\\.get\\(${mapKeyEsc}\\)\\s*:\\s*resolveDirectName\\(`
    ).test(body);
    const noTruthyFallthrough = !new RegExp(`combOwnerNames\\.get\\(${mapKeyEsc}\\)\\s*\\|\\|`).test(body) && !/\|\|\s*['"]Someone['"]/.test(body);
    if (hasGuard && noTruthyFallthrough) {
      ok(`R8 ${fnName} resolves ownerName via combOwnerNames.has() — comb-linked answer is final, resolveDirectName only when not comb-linked`);
    } else {
      problems.push(`${fnName}: .has()-guarded resolveDirectName chain found=${hasGuard}, no truthy-|| fallthrough=${noTruthyFallthrough}`);
    }
  }
  if (problems.length) bad('R8 HiveStore owner-name resolution', problems.join(' | '));
}

// ── R9. resolveCombOwnerNames nulls out a placeholder-class name ────────
{
  let fnNode = null;
  walk(hiveStoreAst.program, (n) => {
    if (fnNode) return;
    if (n.type === 'VariableDeclarator' && n.id?.name === 'resolveCombOwnerNames') fnNode = n;
  });
  const body = fnNode ? hiveStoreCode.slice(fnNode.start, fnNode.end) : '';
  const nullsPlaceholder = /isPlaceholderName\(name\)\s*\?\s*null\s*:\s*name/.test(body);
  const importsHelper = /import\s*{\s*isPlaceholderName\s*}\s*from\s*['"]\.\.\/utils\/placeholderName['"]/.test(hiveStoreSrc);
  if (fnNode && nullsPlaceholder && importsHelper) {
    ok('R9 resolveCombOwnerNames nulls a placeholder-class resolved name instead of passing it through');
  } else {
    bad('R9 resolveCombOwnerNames placeholder guard', `function found=${!!fnNode}, nulls placeholder=${nullsPlaceholder}, imports helper=${importsHelper}`);
  }
}

// ── R10. TodayTab's contributing-hive row omits "From X" when absent ────
{
  const hasGuardedLine = /hive\.ownerName\s*\?\s*\(\s*<Text[^>]*>\s*From \{hive\.ownerName\}/.test(todayTabCode);
  if (hasGuardedLine) {
    ok('R10 TodayTab renders "From {hive.ownerName}" only when hive.ownerName is truthy');
  } else {
    bad('R10 TodayTab owner-attribution guard', `guarded line found=${hasGuardedLine}`);
  }
}

// ── R11. ContributingHive banner omits ", from X"; rosterLabel never
//        drops a real writer from its count or renders an empty roster ──
{
  const bannerGuarded =
    /hive\.ownerName\s*\?\s*\(\s*<>A hive for \{subjectDisplayName\}, from \{hive\.ownerName\}<\/>\s*\)\s*:\s*\(\s*<>A hive for \{subjectDisplayName\}<\/>\s*\)/.test(
      contributingCode
    );

  let rosterFnNode = null;
  walk(contributingAst.program, (n) => {
    if (rosterFnNode) return;
    if (n.type === 'VariableDeclarator' && n.id?.name === 'rosterLabel') rosterFnNode = n;
  });
  const rosterBody = rosterFnNode ? contributingCode.slice(rosterFnNode.start, rosterFnNode.end) : '';
  // Count from `otherNames.length + 2` (owner + self, unconditional),
  // never from the filtered display list — a null ownerName must not
  // shrink the "N of you are writing" count by one.
  const countsFromTotal = /otherNames\.length \+ 2/.test(rosterBody) && /totalWriters > 4/.test(rosterBody);
  // R-38.9 §3 (Lumen, 2026-08-31): the zero-displayable-names case must
  // degrade to the SAME numeric branch as >4, not a fabricated sentence —
  // one condition, one return, no separate 'Writing with someone.' string.
  const unionCondition = /totalWriters > 4 \|\| names\.length === 0/.test(rosterBody);
  const noFabricatedString = !/Writing with someone/.test(rosterBody);
  const filtersAbsent = /\[ownerName, \.\.\.otherNames\]\.filter\(Boolean\)/.test(rosterBody);

  if (bannerGuarded && countsFromTotal && unionCondition && noFabricatedString && filtersAbsent) {
    ok('R11 ContributingHive omits the from-clause when absent; rosterLabel counts from total writers and degrades a zero-name roster to the numeric form, not a fabricated sentence');
  } else {
    bad(
      'R11 ContributingHive owner-attribution guard',
      `banner guarded=${bannerGuarded}, roster found=${!!rosterFnNode}, counts from total=${countsFromTotal}, union condition=${unionCondition}, no fabricated string=${noFabricatedString}, filters absent name=${filtersAbsent}`
    );
  }
}

// ── R12. resolveDirectName — the direct-join term's own three states,
//        and both listContributingHives/getContributingHive AND
//        getHiveContributors route through it (Row 1.15 residuals 1+2) ──
{
  const { isPlaceholderName } = await import(`${HELPER}?t=${Date.now()}`);
  let fnNode = null;
  walk(hiveStoreAst.program, (n) => {
    if (fnNode) return;
    if (n.type === 'VariableDeclarator' && n.id?.name === 'resolveDirectName') fnNode = n;
  });
  if (!fnNode) {
    bad('R12 resolveDirectName', 'could not locate the function — FAILS CLOSED');
  } else {
    const body = hiveStoreCode.slice(fnNode.start, fnNode.end);
    const mapMissIsSomeone = /!names\.has\(id\)\)\s*return\s*['"]Someone['"]/.test(body);
    const placeholderIsNull = /isPlaceholderName\(name\)\s*\?\s*null\s*:\s*name/.test(body);
    const listSiteRoutes = /ownerName:\s*combOwnerNames\.has\(h\.id\)\s*\?\s*combOwnerNames\.get\(h\.id\)\s*:\s*resolveDirectName\(ownerNames,\s*h\.owner_id\)/.test(
      hiveStoreCode
    );
    const singleSiteRoutes = /ownerName:\s*combOwnerNames\.has\(hive\.id\)\s*\?\s*combOwnerNames\.get\(hive\.id\)\s*:\s*resolveDirectName\(ownerNames,\s*hive\.owner_id\)/.test(
      hiveStoreCode
    );
    const contributorsSiteRoutes = /name:\s*resolveDirectName\(names,\s*r\.profile_id\)/.test(hiveStoreCode);
    if (mapMissIsSomeone && placeholderIsNull && listSiteRoutes && singleSiteRoutes && contributorsSiteRoutes) {
      ok('R12 resolveDirectName gives the direct-join term the same three states as resolveCombOwnerNames, and all three call sites (listContributingHives, getContributingHive, getHiveContributors) route through it');
    } else {
      bad(
        'R12 resolveDirectName',
        `map-miss→'Someone'=${mapMissIsSomeone}, placeholder→null=${placeholderIsNull}, listContributingHives routes=${listSiteRoutes}, getContributingHive routes=${singleSiteRoutes}, getHiveContributors routes=${contributorsSiteRoutes}`
      );
    }
  }
  // Behavioral cross-check on the classifier the function is built from,
  // since a source-level regex can't see the runtime branch it takes.
  if (isPlaceholderName('New user') !== true || isPlaceholderName('Sarah') !== false) {
    bad('R12 resolveDirectName classifier cross-check', 'isPlaceholderName disagreed with its own R1 cases — FAILS CLOSED');
  }
}

// ── R13. HiveDetail rosterLabel — filters null names for display, never
//        drops an unnamed contributor from the numeric count ────────────
{
  let rosterFnNode = null;
  walk(hiveDetailAst.program, (n) => {
    if (rosterFnNode) return;
    if (n.type === 'VariableDeclarator' && n.id?.name === 'rosterLabel') rosterFnNode = n;
  });
  const rosterBody = rosterFnNode ? hiveDetailCode.slice(rosterFnNode.start, rosterFnNode.end) : '';
  const filtersDisplay = /\.map\(\(c\) => c\.name\)\.filter\(Boolean\)/.test(rosterBody);
  // The numeric branch's "+1" reads off `contributors.length` (the real
  // headcount), not `names.length` (the filtered display list) — an
  // unnamed contributor still counts.
  const countsFromContributors = /contributors\.length \+ 1/.test(rosterBody);
  const displayGatedOnRealTotal = /contributors\.length <= 3 && names\.length > 0/.test(rosterBody);
  if (rosterFnNode && filtersDisplay && countsFromContributors && displayGatedOnRealTotal) {
    ok('R13 HiveDetail rosterLabel filters placeholder/null names from its display list but counts every contributor toward the numeric form');
  } else {
    bad(
      'R13 HiveDetail rosterLabel',
      `function found=${!!rosterFnNode}, filters display=${filtersDisplay}, counts from contributors.length=${countsFromContributors}, display gated on real total=${displayGatedOnRealTotal}`
    );
  }
}

// ── R14. TodayTab's ContributingHiveRow — no <Avatar> on a null
//        ownerName, a plain cover-theme disc instead (R-38.9-J) ─────────
{
  let rowFnNode = null;
  walk(todayTabAst.program, (n) => {
    if (rowFnNode) return;
    if (n.type === 'VariableDeclarator' && n.id?.name === 'ContributingHiveRow') rowFnNode = n;
  });
  const rowBody = rowFnNode ? todayTabCode.slice(rowFnNode.start, rowFnNode.end) : '';
  const avatarGatedOnOwnerName = /hive\.ownerName\s*\?\s*\(\s*<Avatar name=\{hive\.ownerName\} size=\{40\} \/>/.test(rowBody);
  const placeholderUsesCoverTheme = /hiveCoverTheme\(hive\.coverTheme\)\.base/.test(rowBody);
  if (rowFnNode && avatarGatedOnOwnerName && placeholderUsesCoverTheme) {
    ok('R14 TodayTab ContributingHiveRow renders <Avatar> only when hive.ownerName is truthy; a null owner gets a plain cover-theme-tinted disc instead');
  } else {
    bad(
      'R14 TodayTab Avatar guard',
      `row found=${!!rowFnNode}, avatar gated on ownerName=${avatarGatedOnOwnerName}, placeholder uses cover theme=${placeholderUsesCoverTheme}`
    );
  }
}

console.log(`\ncheck-placeholder-name: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
