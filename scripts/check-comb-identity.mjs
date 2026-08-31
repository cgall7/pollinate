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

console.log(`\ncheck-comb-identity: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
