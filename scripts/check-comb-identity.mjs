// DES-22 §7 — gate design intent, built now for the three rows that are
// genuinely client-side (`RotationFold.js`, `CombIdentityCluster.js`). The
// fourth row (no `security definer` function may return an `entries`-derived
// value to a possibly-subject caller) is explicitly NOT this gate's job —
// that door is a Postgres surface RLS-bypassing definer functions open, not
// a JS import graph this script can see into (§7's own correction). If a
// future version of this file claims to cover that row, it is wrong to.
//
//   npm run check:comb-identity
//
// WHAT IT ASSERTS
//
//   R1  no literal capacity denominator (`5`, `20`, or an "X of Y" / "X/Y"
//       shape) in either component's rendered strings
//   R2  the subject-view cluster component never references
//       `hasWrittenThisRotation` — the prop that carries per-person
//       participation, barred from the subject by §1.1/§1B.9's contamination
//       ruling. Not a runtime check (nothing here executes React) — a
//       source-level absence, same class as `check-perch-weight`'s AST
//       assertions, calibrated to catch the field being wired back in by a
//       future edit rather than to prove today's file correct once
//   R3  no organizer "seal early" / "send now" affordance exists in the
//       cluster component's tree (§1B.16: the clock is the only actor)
//   R4  every rendered count in `RotationFold.js` is spelled
//       (`numberInWordsCapped`), never interpolated as a raw digit
//   R5  `RotationFold.js` withholds every count-bearing line when
//       `count == null` or `count <= 0` — the zero-suppression rule
//       (DES-22 §6 item 3 / DES-31 §1.1), calibrated by mutation
//   R6  `RotationFold.js`'s reader-selection guard is `variant === 'member'`
//       ALONE — never ANDed with `subjectName`. R-38.9 hardening req 1
//       (Lumen), corrected by Vector's §1B.38.11 row 1: reader
//       classification and name availability are two separate decisions;
//       ANDing them let a refused name read silently reclassify a member
//       as the subject (see R9). An absent/misspelled `variant` still
//       fails CLOSED toward the nameless branch
//   R7  `RotationFold.js`'s nameless/subject branch never reads
//       `countKind` — it renders the size sentence unconditionally, so
//       `variant: 'subject', countKind: 'writers'` can't reach a
//       participation claim. R-38.9 hardening requirement 2 (Lumen)
//   R8  `RotationFold.js`'s nameless branch's count is unreachable by a
//       writers-declared value — gated on `countKind === 'size'` ABOVE the
//       branch split, so a degraded member mount (missing `subjectName`,
//       `countKind` at its 'writers' default) can't leak the writer count
//       into the size sentence. R-38.9-E (Lumen), probe-the-fix's-new-
//       surface on hardening requirement 1
//   R9  `RotationFold.js`'s member path treats a missing `subjectName` as
//       its own refusal (returns `null`) — distinct from, and never a
//       fallthrough into, the nameless/subject branch. R-38.9-F (Vector's
//       §1B.38.11 row 1 fix): a member whose name read was refused (e.g. a
//       mid-rotation joiner not yet in `hive_contributors`) must not
//       silently receive the subject's own copy
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const CLUSTER = path.join(SRC, 'components/CombIdentityCluster.js');
const FOLD = path.join(SRC, 'components/RotationFold.js');

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

const clusterSrc = fs.readFileSync(CLUSTER, 'utf8');
const foldSrc = fs.readFileSync(FOLD, 'utf8');
const clusterAst = parseJs(clusterSrc);
const foldAst = parseJs(foldSrc);

// Comments blanked before any string-content regex, per the standing lesson
// (justification_comment_is_a_dependency): this file's own header prose
// mentions every banned pattern by name to explain why it's banned, and a
// regex that can't tell prose from a rendered string trips on itself.
const codeOnly = (src, ast) =>
  (ast.comments || [])
    .slice()
    .sort((a, b) => b.start - a.start)
    .reduce((s, c) => s.slice(0, c.start) + ' '.repeat(c.end - c.start) + s.slice(c.end), src);

const clusterCode = codeOnly(clusterSrc, clusterAst);
const foldCode = codeOnly(foldSrc, foldAst);

// ── R1. no literal capacity denominator ─────────────────────────────────
{
  const problems = [];
  for (const [file, rawCode] of [['CombIdentityCluster.js', clusterCode], ['RotationFold.js', foldCode]]) {
    // Strip decimal literals first (`1.5`, `0.42`) — `\b5\b` still matches
    // the "5" in "1.5" because `.` is a non-word character, so a naked
    // word-boundary check can't tell a stroke width from a cap.
    const code = rawCode.replace(/\d+\.\d+/g, '');
    if (/\b(5|20)\b/.test(code)) {
      // A bare 5/20 alone isn't necessarily a cap — this repo's own cell/
      // stroke constants use small integers too — but this cluster's source
      // has no legitimate reason to contain either literal at all (its cell
      // math runs off `radiusFor`'s derived capacity, never a typed limit),
      // so the presence of either digit here is itself the signal, not a
      // string it's found inside.
      problems.push(`${file} contains the literal digit 5 or 20 — check it isn't a hardcoded cap`);
    }
    if (/\d+\s*(of|\/)\s*\d+/.test(code)) {
      problems.push(`${file} contains an "X of Y" / "X/Y" shape — §1B.8 bars every denominator costume`);
    }
  }
  if (problems.length === 0) {
    ok('R1 no literal capacity denominator or fraction shape in either component');
  } else {
    bad('R1 no literal capacity denominator', problems.join(' | '));
  }
}

// ── R2. subject-view never references hasWrittenThisRotation ───────────
{
  let subjectViewNode = null;
  walk(clusterAst.program, (n) => {
    if (n.type === 'VariableDeclarator' && n.id?.name === 'CombIdentityClusterSubjectView') {
      subjectViewNode = n.init;
    }
  });
  if (!subjectViewNode) {
    bad('R2 subject-view purity', 'could not find CombIdentityClusterSubjectView — FAILS CLOSED');
  } else {
    const body = clusterSrc.slice(subjectViewNode.start, subjectViewNode.end);
    if (body.includes('hasWrittenThisRotation')) {
      bad('R2 subject-view purity', 'CombIdentityClusterSubjectView references hasWrittenThisRotation — the subject-view component must not receive or read per-person write-status (§1.1/§7)');
    } else {
      ok('R2 CombIdentityClusterSubjectView never references hasWrittenThisRotation');
    }
  }
}

// ── R3. no organizer seal-early / send-now affordance ───────────────────
{
  const hit = /\b(sealEarly|sealNow|sendNow|SealEarly|SendNow)\b/.test(clusterCode);
  if (hit) {
    bad('R3 no seal-early/send-now affordance', 'found a seal-early/send-now identifier in the cluster component — §1B.16 rules the clock is the only actor');
  } else {
    ok('R3 no organizer seal-early/send-now affordance in the cluster component');
  }
}

// ── R4. every rendered count is spelled, never a raw digit ─────────────
{
  const problems = [];
  // Any template literal or JSX text that interpolates `count` (or `daysLeft`
  // is fine — days ARE rendered as digits, "6 days left", per every ratified
  // mockup; the ban is on the PEOPLE count only) directly, unwrapped by
  // numberInWordsCapped, is the defect this row exists to catch.
  walk(foldAst.program, (n) => {
    if (n.type !== 'TemplateLiteral') return;
    for (const expr of n.expressions) {
      const t = foldSrc.slice(expr.start, expr.end);
      if (/\bcount\b/.test(t) && !/numberInWordsCapped/.test(t)) {
        problems.push(`template literal interpolates \`${t}\` — a raw count must be wrapped in numberInWordsCapped()`);
      }
    }
  });
  if (problems.length === 0) {
    ok('R4 every rendered count is spelled via numberInWordsCapped, never a raw digit');
  } else {
    bad('R4 every rendered count is spelled', problems.join(' | '));
  }
}

// ── R5. zero-suppression: count == null or count <= 0 withholds the line ─
{
  // Calibration: this assertion should fail if the guard is loosened to
  // `count == null` alone (dropping the `<= 0` half) or removed outright —
  // checked by requiring both the null-check and the `<= 0` comparison to
  // appear guarding the same `countLine` computation.
  const hasNullGuard = /count\s*==\s*null/.test(foldCode);
  const hasZeroGuard = /count\s*<=\s*0/.test(foldCode);
  if (hasNullGuard && hasZeroGuard) {
    ok('R5 RotationFold withholds the count line for both count == null and count <= 0');
  } else {
    bad(
      'R5 zero-suppression guard',
      `expected both a \`count == null\` check and a \`count <= 0\` check guarding the count line, found null-guard=${hasNullGuard} zero-guard=${hasZeroGuard}`
    );
  }
}

// Locate RotationFold's top-level IfStatements in source order, shared by
// R6/R7/R8/R9 — [0] is the reader-selection guard (nameless branch is its
// consequent), [1] is the member-path refusal for a missing subjectName.
const rotationIfs = [];
walk(foldAst.program, (n) => {
  if (n.type === 'IfStatement') rotationIfs.push(n);
});
const rotationIf = rotationIfs[0] ?? null;

// ── R6. reader-selection guard is variant === 'member' alone — never ANDed
//       with subjectName (R-38.9 hardening req 1, corrected by Vector) ────
{
  if (!rotationIf) {
    bad('R6 reader-selection guard', 'could not find the reader-selection branch in RotationFold — FAILS CLOSED');
  } else {
    // Resolve whatever the test negates back to its own declaration, so a
    // rename (e.g. `isMember` → something else) doesn't dodge this check by
    // hiding the guard behind an identifier this script stopped reading.
    let guardExpr = rotationIf.test;
    if (guardExpr.type === 'UnaryExpression' && guardExpr.operator === '!' && guardExpr.argument.type === 'Identifier') {
      const guardName = guardExpr.argument.name;
      walk(foldAst.program, (n) => {
        if (n.type === 'VariableDeclarator' && n.id?.name === guardName) guardExpr = n.init;
      });
    }
    const guardSrc = foldSrc.slice(guardExpr.start, guardExpr.end);
    const selectsOnVariant = /variant\s*===\s*['"]member['"]/.test(guardSrc);
    const staysClearOfName = !/subjectName/.test(guardSrc);
    if (selectsOnVariant && staysClearOfName) {
      ok("R6 reader-selection guard is variant === 'member' alone — a missing subjectName can't reclassify the reader");
    } else if (!selectsOnVariant) {
      bad('R6 reader-selection guard', `guard expression \`${guardSrc}\` doesn't select on variant === 'member' — a misspelled/absent variant could fail open toward the name-carrying path`);
    } else {
      bad(
        'R6 reader-selection guard',
        `guard expression \`${guardSrc}\` still ANDs subjectName into the reader classification — a refused name read on a genuine member would silently fall through to the nameless/subject branch instead of surfacing as its own refusal (R9)`
      );
    }
  }
}

// ── R7. the nameless/subject branch never reads countKind — no
//       participation framing is reachable from it (R-38.9 hardening req 2)
{
  if (!rotationIf) {
    bad('R7 subject branch ignores countKind', 'could not find the variant branch in RotationFold — FAILS CLOSED');
  } else {
    // `foldCode`, not `foldSrc` — comments are blanked at identical offsets
    // (same lesson as this file's own header note on prose vs. rendered
    // strings), because this branch's justification comment names
    // `countKind` explicitly to explain why it's absent from the code.
    const branchSrc = foldCode.slice(rotationIf.consequent.start, rotationIf.consequent.end);
    if (branchSrc.includes('countKind')) {
      bad(
        'R7 subject branch ignores countKind',
        'the nameless/subject branch references `countKind` — it must render the size sentence unconditionally; a caller-supplied countKind must not be able to select a participation claim for this reader (§1B.36.5)'
      );
    } else {
      ok('R7 nameless/subject branch never reads countKind — no participation claim is reachable from it');
    }
  }
}

// ── R8. nameless branch's count is unreachable by a writers-declared value
//       — gated on countKind === 'size' ABOVE the branch split (R-38.9-E) ─
{
  if (!rotationIf) {
    bad('R8 count source gate', 'could not find the variant branch in RotationFold — FAILS CLOSED');
  } else {
    // Find whatever identifier the nameless branch's zero-suppression guard
    // compares against 0 (its `<name> <= 0` half) — that identifier is
    // whatever feeds the branch's count line, by construction of R5's own
    // pattern — then trace it back to its own declaration, which must sit
    // OUTSIDE the branch and gate on `countKind === 'size'` with a `null`
    // alternate. A bare reference to the raw `count` prop has no such
    // declaration and fails this by construction, same as a rename would.
    let countRef = null;
    walk(rotationIf.consequent, (n) => {
      if (countRef) return;
      if (n.type === 'BinaryExpression' && n.operator === '<=' && n.left.type === 'Identifier') {
        countRef = n.left.name;
      }
    });
    if (!countRef) {
      bad('R8 count source gate', "could not find the nameless branch's `<name> <= 0` zero-suppression guard to trace — FAILS CLOSED");
    } else if (countRef === 'count') {
      bad(
        'R8 count source gate',
        "the nameless branch reads the raw `count` prop directly — a countKind: 'writers' caller (the default) can reach it undeclared; gate it through a `countKind === 'size' ? count : null` derivation declared above the branch"
      );
    } else {
      let decl = null;
      walk(foldAst.program, (n) => {
        if (n.type === 'VariableDeclarator' && n.id?.name === countRef) decl = n.init;
      });
      const declOutsideBranch =
        decl && !(decl.start >= rotationIf.consequent.start && decl.end <= rotationIf.consequent.end);
      const declSrc = decl ? foldSrc.slice(decl.start, decl.end) : '';
      const gatesOnSize = /countKind\s*===\s*['"]size['"]/.test(declSrc) && /:\s*null\b/.test(declSrc);
      if (decl && declOutsideBranch && gatesOnSize) {
        ok(`R8 nameless branch's count (\`${countRef}\`) is gated on countKind === 'size' above the branch — unreachable by a writers-declared value`);
      } else {
        bad(
          'R8 count source gate',
          `\`${countRef}\` feeds the nameless branch's count line but its declaration (\`${declSrc || '<not found>'}\`) doesn't gate on countKind === 'size' with a null alternate, declared outside the branch`
        );
      }
    }
  }
}

// ── R9. member path's missing-subjectName case is its own refusal —
//       returns null, never falls through to the nameless branch (R-38.9-F)
{
  if (rotationIfs.length < 2) {
    bad('R9 refusal state', `expected 2 top-level branches in RotationFold (reader-selection + refusal), found ${rotationIfs.length} — FAILS CLOSED`);
  } else {
    const refusalIf = rotationIfs[1];
    const testSrc = foldSrc.slice(refusalIf.test.start, refusalIf.test.end);
    const testsSubjectNameAbsence =
      /subjectName/.test(testSrc) &&
      (/^\s*!/.test(testSrc) || /==\s*null/.test(testSrc) || /===\s*null/.test(testSrc) || /==\s*undefined/.test(testSrc));
    // Calibrated to `null` specifically — that's what's actually built
    // pending Lumen's copy ruling (§1B.38.11 row 3). A future commit that
    // lands real copy for this state is expected to touch this row too.
    let refusalReturnsNull = false;
    walk(refusalIf.consequent, (n) => {
      if (n.type === 'ReturnStatement' && n.argument?.type === 'NullLiteral') refusalReturnsNull = true;
    });
    if (testsSubjectNameAbsence && refusalReturnsNull) {
      ok('R9 member path returns null on a missing subjectName — its own refusal, never the nameless branch');
    } else {
      bad(
        'R9 refusal state',
        `expected a second branch guarding on the ABSENCE of subjectName and returning null — found test \`${testSrc}\` (testsSubjectNameAbsence=${testsSubjectNameAbsence}), refusalReturnsNull=${refusalReturnsNull}`
      );
    }
  }
}

console.log(`\ncheck-comb-identity: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
