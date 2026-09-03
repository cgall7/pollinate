// COPY-6 addendum (Lumen, 2026-09-03) + rider 1 — the pre-launch/dormant
// comb membership: the state between a real, committed join and the first
// mint. Three artifacts, gated together because they only mean anything
// together: the read that finds the state, the row that renders it, and the
// store rider that stops reporting the join behind it as a failure.
//
// THE CENTRAL CLAIM OF THIS GATE IS AN ABSENCE, and it is asserted
// STRUCTURALLY rather than by grepping for barred words. §1B.38.1 licenses a
// rendered future only from an existing rotation row, and this state has
// none — so no opening date, no countdown, no next subject, no member count.
// A word list would go green on a rename; the rows below instead pin the
// shapes that make those facts unreachable: the read returns two keys, the
// component accepts one name, and neither can be widened without reddening
// here first.
import fs from 'node:fs';
import { parse } from '@babel/parser';

const read = (path) => fs.readFileSync(path, 'utf8');
const hiveStore = read('src/services/HiveStore.js');
const row = read('src/components/PendingCombRow.js');
const todayTab = read('src/screens/TodayTab.js');
const inviteStore = read('src/services/CombInviteStore.js');
const packageJson = read('package.json');

// ── Mutation record (scripts/run-mutations.mjs) ─────────────────────────
// Every row above, driven red by the defect it names, plus two controls: a
// legal visual edit, and a COMMENT that names the barred tokens — the second
// proves the comment-blanking in P6/P7 rather than asserting it, since this
// component's own header discusses `closesAt` and press targets by name.
export const MUTATIONS = [
  {
    row: 'P1',
    why: 'the pending shelf claims the organizer\'s own combs, giving one comb two shelf presences',
    file: 'src/services/HiveStore.js',
    from: "      .neq('owner_id', profileId)",
    to: "      .eq('owner_id', profileId)",
  },
  {
    row: 'P2',
    why: 'a voided rotation stops disqualifying a comb, so a comb whose month was abandoned reads as pre-launch',
    file: 'src/services/HiveStore.js',
    from: "      .is('sealed_at', null)\n      .is('voided_at', null);\n    if (rotationsError) throw rotationsError;",
    to: "      .is('sealed_at', null);\n    if (rotationsError) throw rotationsError;",
  },
  {
    row: 'P3',
    why: 'a failed rotation read is swallowed, so a refused read renders as "no open rotation" over an open month',
    file: 'src/services/HiveStore.js',
    from: '    if (rotationsError) throw rotationsError;',
    to: '    if (rotationsError) console.warn(rotationsError);',
  },
  {
    row: 'P4',
    why: 'the read starts carrying a date the card is barred from rendering',
    file: 'src/services/HiveStore.js',
    from: '      .map((comb) => ({ id: comb.id, name: comb.name }));',
    to: '      .map((comb) => ({ id: comb.id, name: comb.name, createdAt: comb.created_at }));',
  },
  {
    row: 'P5',
    why: 'the row grows a rotation prop, reopening the surface the component split exists to close',
    file: 'src/components/PendingCombRow.js',
    from: 'export const PendingCombRow = ({ combName, style }) => (',
    to: 'export const PendingCombRow = ({ combName, style, rotation }) => (',
  },
  {
    row: 'P6',
    why: 'a rotation carrier reaches the component through a style key instead of a prop',
    file: 'src/components/PendingCombRow.js',
    from: '  bloomGlyph: { fontSize: 18, color: theme.colors.ink },',
    to: '  bloomGlyph: { fontSize: 18, color: theme.colors.ink },\n  closesAtLine: { color: theme.colors.ink },',
  },
  {
    row: 'P7',
    why: 'the row grows a press target it has nowhere to take the member',
    file: 'src/components/PendingCombRow.js',
    from: '  <View style={[styles.row, style]}>',
    to: '  <View style={[styles.row, style]} onPress={undefined}>',
  },
  {
    row: 'P8',
    why: 'the ruled sentence is trimmed, dropping the mechanism-backed promise that carries the whole state',
    file: 'src/components/PendingCombRow.js',
    from: "      <Text style={styles.status}>You're in — you'll be writing when the next month opens.</Text>",
    to: "      <Text style={styles.status}>You're in.</Text>",
  },
  {
    row: 'P9',
    why: 'a second mount renders the same membership twice on one shelf',
    file: 'src/screens/TodayTab.js',
    from: '                {pendingCombs.map((comb) => (\n                  <PendingCombRow key={comb.id} combName={comb.name} />\n                ))}',
    to: '                {pendingCombs.map((comb) => (\n                  <PendingCombRow key={comb.id} combName={comb.name} />\n                ))}\n                {pendingCombs.map((comb) => (\n                  <PendingCombRow key={`dup-${comb.id}`} combName={comb.name} />\n                ))}',
  },
  {
    row: 'P10',
    why: 'the rider is reverted and a committed join is reported to the joiner as a failure again',
    file: 'src/services/CombInviteStore.js',
    from: '      rotationId: rotation?.id ?? null,',
    to: '      rotationId: rotation.id,',
  },
  {
    row: 'P11',
    why: 'the gate is dropped from package.json and stops running in the suite',
    file: 'package.json',
    from: '    "check:comb-pending-shelf": "node scripts/check-comb-pending-shelf.mjs",\n',
    to: '',
  },
  {
    row: null,
    why: 'a legal visual tweak to the bloom glyph must not red anything',
    file: 'src/components/PendingCombRow.js',
    from: '  bloomGlyph: { fontSize: 18,',
    to: '  bloomGlyph: { fontSize: 20,',
  },
  {
    row: null,
    why: 'naming the barred tokens IN A COMMENT must stay green — the control for P6/P7 being comment-blanked',
    file: 'src/components/PendingCombRow.js',
    from: '// The generic mechanism sentence below is the ceiling.',
    to: '// The generic mechanism sentence below is the ceiling. No closesAt line,\n// no daysLeft, no onPress, no RotationFold, no Ionicons chevron.',
  },
];

let passed = 0;
let failed = 0;
const check = (condition, label) => {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${label}`);
  }
};

const ast = (source) => parse(source, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
const walk = (node, fn, stack = []) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, fn, stack));
    return;
  }
  const isNode = typeof node.type === 'string';
  if (isNode) {
    fn(node, stack);
    stack.push(node);
  }
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments') continue;
    walk(node[key], fn, stack);
  }
  if (isNode) stack.pop();
};
// Comment ranges blanked before any textual census. This file's own subjects
// name the barred tokens in prose on purpose — the component's header
// explains which rotation facts it may not render — so a census over raw
// source would score the explanation as the defect.
const codeOnly = (source) => {
  const tree = ast(source);
  return (tree.comments || [])
    .slice()
    .sort((a, b) => b.start - a.start)
    .reduce((s, c) => s.slice(0, c.start) + ' '.repeat(c.end - c.start) + s.slice(c.end), source);
};

// ── P1 · the read exists, and it is the MEMBER's, not the organizer's ────
check(
  /async listPendingCombMemberships\(\)/.test(hiveStore) &&
    /\.from\('combs'\)[\s\S]{0,220}?\.neq\('owner_id', profileId\)/.test(hiveStore),
  'P1 pending-membership read is scoped to combs the reader does not own'
);

// ── P2 · the query licence: pre-launch and dormant ONLY ─────────────────
// An open rotation disqualifies a comb from this list. That is what keeps a
// subject-gone comb (whose rotation IS open) rendering through the
// contributing card instead, and what stops one comb holding two shelf
// presences at once.
check(
  /\.from\('comb_rotations'\)\s*\.\s*select\('comb_id'\)\s*\.\s*in\('comb_id', combIds\)\s*\.\s*is\('sealed_at', null\)\s*\.\s*is\('voided_at', null\)/s.test(
    hiveStore
  ) && /openCombIds\.has\(comb\.id\)/.test(hiveStore),
  'P2 combs with an open rotation are excluded from the pending list'
);

// ── P3 · the negative read fails LOUD ───────────────────────────────────
// This query's answer is an absence, so a refused or failed read returns
// zero rows and is indistinguishable from the state being looked for.
// Swallowing its error would render "you'll be writing when the next month
// opens" over a comb whose month is open right now.
{
  const tree = ast(hiveStore);
  let thrown = false;
  let swallowed = false;
  walk(tree, (node) => {
    if (node.type !== 'ObjectMethod' && node.type !== 'ObjectProperty') return;
    if (node.key?.name !== 'listPendingCombMemberships') return;
    walk(node, (inner) => {
      if (inner.type === 'ThrowStatement' && inner.argument?.name === 'rotationsError') thrown = true;
      if (inner.type === 'TryStatement') swallowed = true;
    });
  });
  check(thrown && !swallowed, 'P3 a failed rotation read throws rather than reading as "no open rotation"');
}

// ── P4 · nothing but identity and name leaves the read ──────────────────
// The structural half of the absence claim, source side. Every object
// literal built inside this method is asserted, so widening the shape to
// carry a closes_at, an ordinal, a subject or a count reds here before it
// can reach any surface.
{
  const tree = ast(hiveStore);
  const shapes = [];
  walk(tree, (node) => {
    if (node.type !== 'ObjectMethod' && node.type !== 'ObjectProperty') return;
    if (node.key?.name !== 'listPendingCombMemberships') return;
    // RESULT POSITION ONLY: an arrow's expression body or a return
    // argument. `.order('created_at', { ascending: false })` is an object
    // literal in this method too, and it is a query option, not a shape.
    // Laundering a widened shape through a local variable reds this row as
    // well — the count drops to zero rather than passing unexamined.
    walk(node, (inner, innerStack) => {
      if (inner.type !== 'ObjectExpression') return;
      const parent = innerStack[innerStack.length - 1];
      const resultPosition =
        (parent?.type === 'ArrowFunctionExpression' && parent.body === inner) ||
        (parent?.type === 'ReturnStatement' && parent.argument === inner);
      if (!resultPosition) return;
      shapes.push(inner.properties.map((prop) => prop.key?.name ?? prop.key?.value ?? '?').sort());
    });
  });
  check(
    shapes.length === 1 && shapes[0].join(',') === 'id,name',
    `P4 the pending read returns exactly { id, name } (found ${JSON.stringify(shapes)})`
  );
}

// ── P5 · the row cannot be handed a rotation fact ───────────────────────
// The structural half, render side. `PendingCombRow` is a separate component
// rather than a fourth `RotationFold` variant precisely so this assertion is
// possible: its whole prop surface is a name and a style.
{
  const tree = ast(row);
  let props = null;
  walk(tree, (node) => {
    if (node.type !== 'VariableDeclarator') return;
    if (node.id?.name !== 'PendingCombRow') return;
    const fn = node.init;
    if (!fn || (fn.type !== 'ArrowFunctionExpression' && fn.type !== 'FunctionExpression')) return;
    const param = fn.params[0];
    if (!param || param.type !== 'ObjectPattern') {
      props = ['<not destructured>'];
      return;
    }
    props = param.properties.map((prop) => prop.key?.name ?? '?').sort();
  });
  check(
    props !== null && props.join(',') === 'combName,style',
    `P5 PendingCombRow accepts only a comb name and a style (found ${JSON.stringify(props)})`
  );
}

// ── P6 · and does not reach one another way ─────────────────────────────
// P5 bars the props; this bars the imports and any live token that would
// carry a rotation fact in through the side door (a `RotationFold` mount, a
// `useDaysLeft` call, a count). Comment-blanked — the component's header
// names these on purpose.
{
  const code = codeOnly(row);
  const forbidden = ['RotationFold', 'useDaysLeft', 'daysLeft', 'closesAt', 'closes_at', 'writerCount', 'memberCount', 'subjectName', 'ordinal'];
  const found = forbidden.filter((token) => code.includes(token));
  check(found.length === 0, `P6 the pending row imports and references no rotation carrier (found ${JSON.stringify(found)})`);
}

// ── P7 · no press target ────────────────────────────────────────────────
// There is nowhere to go: a member has no comb screen before the first mint
// (`getOrganizerComb` is owner-scoped), so a chevron or a press handler here
// would be a promise the row cannot keep.
{
  const code = codeOnly(row);
  check(
    !/onPress/.test(code) && !/Pressable/.test(code) && !/chevron/i.test(code) && !/Ionicons/.test(code),
    'P7 the pending row offers no navigation it cannot perform'
  );
}

// ── P8 · the ruled copy, verbatim ───────────────────────────────────────
// True in BOTH licensed states — "next" is the first month for a pre-launch
// comb and the upcoming one for a dormant comb — and mechanism-backed by the
// mint's roster snapshot.
check(
  row.includes("You're in — you'll be writing when the next month opens."),
  'P8 the status line is COPY-6’s ruled sentence, verbatim'
);

// ── P9 · one comb, one shelf presence ───────────────────────────────────
// The pending row rides the existing "writing with others" shelf and is fed
// only by the pending read, so when the month opens it upgrades in place
// rather than a second shelf appearing beside it.
check(
  /import \{ PendingCombRow \} from '\.\.\/components\/PendingCombRow';/.test(todayTab) &&
    /HiveStore\.listPendingCombMemberships\(\)/.test(todayTab) &&
    /\{pendingCombs\.map\(\(comb\) => \(\s*<PendingCombRow key=\{comb\.id\} combName=\{comb\.name\} \/>/s.test(todayTab) &&
    /\{\(contributingHives\.length > 0 \|\| pendingCombs\.length > 0\) && \(/.test(todayTab) &&
    (todayTab.match(/<PendingCombRow/g) || []).length === 1,
  'P9 Today renders the pending row once, on the existing shelf, from the pending read alone'
);

// ── P10 · rider 1 · a committed join is never reported as a failure ─────
// `comb_join_by_invite_code` commits the membership before this query runs
// (`20260831000001:26-29`), so the old throw minted a client-side failure
// for a real join. Nulls rather than a missing key: "there is no rotation"
// is a different fact from a shape that forgot to include one.
{
  const code = codeOnly(inviteStore);
  check(
    !/does not have an open rotation/.test(code) &&
      /rotationId: rotation\?\.id \?\? null/.test(code) &&
      /hiveId: rotation\?\.hive_id \?\? null/.test(code) &&
      /closesAt: rotation\?\.closes_at \?\? null/.test(code) &&
      /if \(rotationError\) throw rotationError;/.test(code),
    'P10 an absent rotation after a successful join returns null rotation fields instead of throwing'
  );
}

// ── P11 · the suite can see this gate ───────────────────────────────────
check(
  /"check:comb-pending-shelf": "node scripts\/check-comb-pending-shelf\.mjs"/.test(packageJson),
  'P11 package.json exposes the pending-shelf check script'
);

console.log(`\ncheck-comb-pending-shelf: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
