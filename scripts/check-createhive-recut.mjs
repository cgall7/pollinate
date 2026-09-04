// R-CH-1..6 (Lumen, 2026-09-04) — the CreateHive re-cut, pinned.
//
// WHY THIS FILE EXISTS, stated because the number says it out loud: the
// re-cut branch landed at 77 gates / 2223 assertions, IDENTICAL to the
// baseline it was cut from. Two files changed, four ruled strings moved,
// a whole step retired, and not one assertion in the suite moved with
// them — because nothing anywhere pinned this screen. A ruling whose
// assertion count does not move is a ruling with no instrument. The
// ruling is POLLINATE_CREATEHIVE_RECUT_SPEC.md (Lumen, 2026-09-04) in the
// design workspace, NOT a path in this repo — nothing under GUIDES/ is in
// this tree, so a bare `GUIDES/...` address here opens nothing for whoever
// reads this file next. Its §R-CH-6 acceptance rows were hand-run TWICE,
// by the builder and by the ratifier; the merge added the suite figure and
// the diff scope, not the ten rows. Twice is what held them, and this file
// is so the next reading is a machine's.
//
// Scope note, disclosed rather than assumed: the owed debt named
// R-CH-1's two sentences and the fused CTA shape. The rows below cover
// those and the rest of the ruled set that is equally ungated, since the
// same "nothing pins this screen" is true of every one of them. Any row
// past CH1/CH6 is strikeable on the ratifier's word.
//
// WHAT THIS GATE DELIBERATELY DOES NOT DO: it does not ban words. The
// retired promise and the retired option list are both discussed BY NAME
// in this screen's own comments and in hiveThemes.js's retirement note,
// which Lumen ratified as the house shape ("a named retirement that
// survives its own fact-check is exactly the house shape; silent would
// be worse"). So every census below runs COMMENT-BLANKED, and a row that
// went red on a retirement note would be reading prose as code.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const read = (p) => fs.readFileSync(p, 'utf8');
const screen = read('src/screens/CreateHive.js');
const hiveThemes = read('src/constants/hiveThemes.js');
const packageJson = read('package.json');

// Letter-exact subjects, quoted once. R-CH-1's replacement help line and
// the C2 immutability line that R-CH-1 explicitly left in place.
const HELP_LINE =
  'A private place to keep what you write about them. Only its writers can ever see it.';
const C2_LINE = "This can't be changed later.";

// ── Mutation record (scripts/run-mutations.mjs) ─────────────────────────
// One edit per row, each the defect the row is written against, plus two
// must-not-fire controls: a legal visual edit, and a COMMENT that names
// every retired token at once — the control that proves the blanking
// rather than asserting it, since this screen's comments already name the
// retired promise, the retired step and the retired skip link on purpose.
export const MUTATIONS = [
  {
    row: 'CH1',
    why: 'the ruled help line is trimmed, dropping the privacy invariant that is the whole point of the replacement',
    file: 'src/screens/CreateHive.js',
    from: '            A private place to keep what you write about them. Only its writers can ever see it.',
    to: '            A private place to keep what you write about them.',
  },
  {
    row: 'CH2b',
    why: 'the retired send promise comes back as live copy on the screen it was cut from',
    file: 'src/screens/CreateHive.js',
    from: '          <Text style={styles.sectionLabel}>Who\'s writing?</Text>',
    to: '          <Text style={styles.helpText}>You can choose to send it later.</Text>\n          <Text style={styles.sectionLabel}>Who\'s writing?</Text>',
  },
  {
    row: 'CH3',
    why: 'the C2 immutability warning is dropped, so an irreversible choice ships unmarked',
    file: 'src/screens/CreateHive.js',
    from: "          <Text style={styles.helpText}>This can't be changed later.</Text>\n",
    to: '',
  },
  {
    row: 'CH4',
    why: 'the retired cadence step is restored to STEPS',
    file: 'src/screens/CreateHive.js',
    from: "const STEPS = ['who', 'cover', 'entry'];",
    to: "const STEPS = ['who', 'cover', 'cadence', 'entry'];",
  },
  {
    row: 'CH5',
    why: 'a second CTA returns to the entry step, the shape "Skip for Now" had',
    file: 'src/screens/CreateHive.js',
    from: '        {step === \'entry\' && (\n          <PrimaryButton onPress={finish} loading={saving}>',
    to: '        {step === \'entry\' && <PrimaryButton onPress={finish}>Skip for Now</PrimaryButton>}\n        {step === \'entry\' && (\n          <PrimaryButton onPress={finish} loading={saving}>',
  },
  {
    // CH5's and CH6's own defect edits each red three rows, which is
    // honest but proves nothing about either row on its own. These two
    // separate them: one adds a press target the label rules do not
    // notice, the other breaks the label without touching the press.
    row: 'CH5',
    why: 'a second press target returns to the entry step under a name no word list bars',
    file: 'src/screens/CreateHive.js',
    from: '            {`Create ${subjectName.trim()}\'s hive`}\n          </PrimaryButton>\n        )}',
    to: '            {`Create ${subjectName.trim()}\'s hive`}\n          </PrimaryButton>\n        )}\n        {step === \'entry\' && <LinkButton onPress={goNext}>Not now</LinkButton>}',
  },
  {
    row: 'CH6',
    why: 'the CTA renders the untrimmed name, so a trailing space ships inside the possessive',
    file: 'src/screens/CreateHive.js',
    from: "            {`Create ${subjectName.trim()}'s hive`}",
    to: '            {`Create ${subjectName}\'s hive`}',
  },
  {
    row: 'CH6',
    why: 'the fused CTA reverts to a generic label, so the press stops naming whose hive is being made',
    file: 'src/screens/CreateHive.js',
    from: "            {`Create ${subjectName.trim()}'s hive`}",
    to: '            Save & Start Writing',
  },
  {
    row: 'CH7',
    why: 'a Create-labelled CTA presses a handler that only advances — the exact defect R-CH-4 recorded as a class',
    file: 'src/screens/CreateHive.js',
    from: "        {step === 'cover' && <PrimaryButton onPress={goNext}>Next</PrimaryButton>}",
    to: "        {step === 'cover' && <PrimaryButton onPress={goNext}>Create Hive</PrimaryButton>}",
  },
  {
    row: 'CH8',
    why: 'the keep-the-entry flag returns, which is the parameter the second button existed to vary',
    file: 'src/screens/CreateHive.js',
    from: '  const finish = async () => {',
    to: '  const finish = async (withEntry = true) => {',
  },
  {
    row: 'CH9',
    why: 'the retired option list is re-exported, so a consequence-free question has somewhere to come back from',
    file: 'src/constants/hiveThemes.js',
    from: 'const BY_ID = new Map(HIVE_COVER_THEMES.map((t) => [t.id, t]));',
    to: "export const REVIEW_CADENCE_OPTIONS = [{ value: 'yearly', label: 'Yearly' }];\n\nconst BY_ID = new Map(HIVE_COVER_THEMES.map((t) => [t.id, t]));",
  },
  {
    row: 'CH10',
    why: 'the name input drops back off the one input register onto the weak border token',
    file: 'src/screens/CreateHive.js',
    from: '    borderColor: theme.colors.surfaceBorderStrong,\n  },\n  helpText: {',
    to: '    borderColor: theme.colors.surfaceBorder,\n  },\n  helpText: {',
  },
  {
    row: 'CH10',
    why: 'the entry area writes the register radius as its value instead of the token',
    file: 'src/screens/CreateHive.js',
    from: '    borderRadius: theme.borderRadius.small,\n    padding: 20,\n    minHeight: 160,',
    to: '    borderRadius: 14,\n    padding: 20,\n    minHeight: 160,',
  },
  {
    row: 'CH11',
    why: 'the gate is dropped from package.json and stops running in the suite',
    file: 'package.json',
    from: '    "check:createhive-recut": "node scripts/check-createhive-recut.mjs",\n',
    to: '',
  },
  {
    row: null,
    why: 'a legal visual tweak to the progress dots must not red anything',
    file: 'src/screens/CreateHive.js',
    from: '    width: 8,\n    height: 8,',
    to: '    width: 9,\n    height: 9,',
  },
  {
    row: null,
    why: 'naming every retired token AT ONCE, in a comment, must stay green — the control for the comment blanking that lets the ratified retirement notes survive',
    file: 'src/screens/CreateHive.js',
    from: "const STEPS = ['who', 'cover', 'entry'];",
    to: "// Retired here: the cadence step, REVIEW_CADENCE_OPTIONS, reviewCadence,\n// the withEntry flag, \"Skip for Now\", \"Save & Start Writing\", and the line\n// that said you could choose to send it later.\nconst STEPS = ['who', 'cover', 'entry'];",
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
const codeOnly = (source) => {
  const tree = ast(source);
  return (tree.comments || [])
    .slice()
    .sort((a, b) => b.start - a.start)
    .reduce((s, c) => s.slice(0, c.start) + ' '.repeat(c.end - c.start) + s.slice(c.end), source);
};

const screenAst = ast(screen);
const screenCode = codeOnly(screen);
const norm = (s) => s.replace(/\s+/g, ' ').trim();

// Is this node rendered under `step === '<name>'`? The screen renders every
// beat from one component through sibling guards, so "which step is this
// on" is a question about ancestors, not about position in the file.
const underStep = (stack, name) =>
  stack.some(
    (n) =>
      n.type === 'LogicalExpression' &&
      n.operator === '&&' &&
      n.left?.type === 'BinaryExpression' &&
      n.left.operator === '===' &&
      n.left.left?.type === 'Identifier' &&
      n.left.left.name === 'step' &&
      n.left.right?.type === 'StringLiteral' &&
      n.left.right.value === name
  );

// Every sentence RENDERED on a given step: the JSXText children of that
// step's elements, whitespace-normalised. Text inside a comment is not a
// child of anything, so this reads what the person sees and nothing else.
const renderedTextOn = (stepName) => {
  const out = [];
  walk(screenAst, (node, stack) => {
    if (node.type !== 'JSXText') return;
    if (!underStep(stack, stepName)) return;
    const t = norm(node.value);
    if (t) out.push(t);
  });
  return out;
};
const whoText = renderedTextOn('who');

// ── CH1 · R-CH-1's replacement, letter-exact, on the who step ───────────
// Both sentences or neither: the second one is the privacy invariant that
// survives both arms of the "Who's writing?" choice below it, and it is
// the only thing the person is told about who can see this place.
check(
  whoText.includes(HELP_LINE),
  `CH1 the who step renders R-CH-1's help line letter-exact (found ${JSON.stringify(whoText)})`
);

// ── CH2 · the retired send promise is nowhere in src/ ───────────────────
// Enumerated over the whole source tree rather than this screen, because
// "a hive born here can never be sent" is a fact about the product, not
// about one file. Comment-blanked, so the screen's own note explaining
// what it retired stays legal.
{
  const files = [];
  const collect = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collect(full);
      else if (entry.name.endsWith('.js')) files.push(full);
    }
  };
  collect('src');
  // An enumerator asserts on its own count before it loops: a walk that
  // found nothing would report this absence as proven when it read no
  // files at all.
  check(files.length > 50, `CH2a the src/ enumeration is populated (${files.length} files)`);
  const offenders = files.filter((f) => /send it later/i.test(codeOnly(read(f))));
  check(
    offenders.length === 0,
    `CH2b no live copy anywhere in src/ promises the hive can be sent later (found ${JSON.stringify(offenders)})`
  );
}

// ── CH3 · the C2 immutability line survives the cut ─────────────────────
// R-CH-1 moved the sentence above it and explicitly left this one where it
// was. `is_collective` is immutable in both directions the instant the row
// exists, so this line is the only warning the choice ever gets.
check(
  whoText.includes(C2_LINE),
  'CH3 the who step still renders the C2 immutability line'
);

// ── CH4 · three beats, and the dots are driven by them ──────────────────
// Two clauses on purpose, and they are not the same clause: a hardcoded
// dot count would render four dots over a three-member array, which is
// the failure the E9 comment describes and an array-only assertion cannot
// see.
{
  let members = null;
  walk(screenAst, (node) => {
    if (node.type !== 'VariableDeclarator' || node.id?.name !== 'STEPS') return;
    members = (node.init?.elements || []).map((el) => el.value ?? '?');
  });
  const dotsFromSteps = /\{STEPS\.map\(\(s, i\) =>/.test(screenCode);
  check(
    members !== null && members.join(',') === 'who,cover,entry' && dotsFromSteps,
    `CH4 the flow is three beats and the progress dots map over them (found ${JSON.stringify(members)}, dots from STEPS: ${dotsFromSteps})`
  );
}

// Every press target rendered on the entry step, by element name. Counted
// across element types rather than PrimaryButton alone: the skip link this
// row exists to keep dead was a LinkButton, not a second PrimaryButton.
const PRESSABLES = ['PrimaryButton', 'PressableScale', 'Pressable', 'TouchableOpacity', 'LinkButton'];
const entryPressables = [];
walk(screenAst, (node, stack) => {
  if (node.type !== 'JSXElement') return;
  const name = node.openingElement?.name?.name;
  if (!PRESSABLES.includes(name)) return;
  if (!underStep(stack, 'entry')) return;
  entryPressables.push(node);
});

// ── CH5 · the entry step offers exactly one press ───────────────────────
// Two buttons that both created the hive, differing only in whether the
// typed text survived, is the defect R-CH-4 killed. One CTA is not a
// tidier version of two; it is the only arrangement where the label can
// be true.
check(
  entryPressables.length === 1 && entryPressables[0].openingElement.name.name === 'PrimaryButton',
  `CH5 the entry step renders exactly one press target (found ${JSON.stringify(entryPressables.map((n) => n.openingElement.name.name))})`
);

// ── CH6 · the fused label, letter-exact ─────────────────────────────────
// Structural rather than textual: the label is a template literal, so a
// string search for "Create" would go green on `Create a hive` and on a
// label that dropped the subject entirely. The quasis and the expression
// are both pinned, which is what makes the possessive a plain 's on every
// name, Ines and James alike.
{
  const cta = entryPressables[0];
  const child = (cta?.children || []).find((c) => c.type === 'JSXExpressionContainer');
  const tpl = child?.expression;
  const quasis = tpl?.type === 'TemplateLiteral' ? tpl.quasis.map((q) => q.value.raw) : null;
  const expr = tpl?.type === 'TemplateLiteral' && tpl.expressions.length === 1
    ? screen.slice(tpl.expressions[0].start, tpl.expressions[0].end)
    : null;
  check(
    quasis !== null && quasis.join('|') === "Create |'s hive" && expr === 'subjectName.trim()',
    `CH6 the entry CTA is the fused possessive label (found ${JSON.stringify(quasis)} around ${JSON.stringify(expr)})`
  );
}

// ── CH7 · a CTA labelled Create presses the thing that creates ──────────
// R-CH-4 recorded this as a CLASS, not an incident: the retired cadence
// step's button said "Create Hive" and only called `goNext`, so it named
// an act performed two screens later. The row is written over EVERY
// button in the file rather than over the entry CTA alone, because the
// defect it refuses was on a different step than the one it was about.
{
  // The creating handler is resolved as the INNERMOST function around the
  // call, not as any declarator whose source contains it. The component
  // itself is an arrow function containing every handler it defines, so a
  // containment test names `CreateHiveFlow` a creator and then any button
  // pressing anything at all looks honest.
  const creators = new Set();
  walk(screenAst, (node, stack) => {
    if (node.type !== 'CallExpression') return;
    if (screen.slice(node.start, node.end).indexOf('HiveStore.createHive') !== 0) return;
    const fns = stack.filter((n) => n.type === 'ArrowFunctionExpression' || n.type === 'FunctionExpression');
    const innermost = fns[fns.length - 1];
    if (!innermost) return;
    const owner = stack[stack.indexOf(innermost) - 1];
    creators.add(owner?.type === 'VariableDeclarator' ? owner.id?.name : '<anonymous>');
  });
  const labelled = [];
  const liars = [];
  walk(screenAst, (node) => {
    if (node.type !== 'JSXElement') return;
    if (!PRESSABLES.includes(node.openingElement?.name?.name)) return;
    const label = node.children
      .map((c) => (c.type === 'JSXText' ? c.value : c.type === 'JSXExpressionContainer' ? screen.slice(c.start, c.end) : ''))
      .join(' ');
    if (!/\bCreate\b/.test(label)) return;
    labelled.push(norm(label));
    const onPress = node.openingElement.attributes.find(
      (a) => a.type === 'JSXAttribute' && a.name?.name === 'onPress'
    );
    const handler = onPress?.value?.expression?.name;
    if (!creators.has(handler)) liars.push(`${norm(label)} -> ${handler}`);
  });
  // The count is the vacuity guard, not a cap: a screen with no
  // Create-labelled button satisfies "every one of them is honest" while
  // saying nothing, and this screen's whole point is that it has one.
  check(
    labelled.length >= 1 && liars.length === 0,
    `CH7 every CTA labelled Create presses the handler that creates (creators ${JSON.stringify([...creators])}, labelled ${JSON.stringify(labelled)}, liars ${JSON.stringify(liars)})`
  );
}

// ── CH8 · the deferral's name, and the flag behind it, are gone ─────────
// `withEntry` is the parameter the two buttons existed to vary. While it
// survives, the second button is one JSX line from returning, and CH5
// alone would not stop the arm coming back before the button does.
{
  const barred = ['withEntry', 'Skip for Now', 'Save & Start Writing'];
  const found = barred.filter((token) => screenCode.includes(token));
  check(found.length === 0, `CH8 no keep-the-entry flag and no deferral-named CTA (found ${JSON.stringify(found)})`);
}

// ── CH9 · the consequence-free question stays retired ───────────────────
// Code-only in both files, which is the ratified shape: hiveThemes.js's
// retirement note names `REVIEW_CADENCE_OPTIONS` on purpose, and a row
// that reddened on it would be refusing the record instead of the thing.
// The column and its validator are untouched by design — what retired is
// the question, not the field, so `HiveStore` is not in this census.
{
  const themesCode = codeOnly(hiveThemes);
  const optionsLive = /REVIEW_CADENCE_OPTIONS/.test(themesCode) || /REVIEW_CADENCE_OPTIONS/.test(screenCode);
  const cadenceOnScreen = /reviewCadence/.test(screenCode);
  check(
    !optionsLive && !cadenceOnScreen,
    `CH9 the cadence question has no live option list and no screen state (options live: ${optionsLive}, screen state: ${cadenceOnScreen})`
  );
}

// ── CH10 · one input register per product (the R-RF-3 fold) ─────────────
// Both boxes, both properties, and the radius asserted as the TOKEN and
// not as its value: `borderRadius: 14` is the same pixel today and stops
// being the register the moment `small` moves.
{
  const styleOf = (name) => {
    let props = null;
    walk(screenAst, (node) => {
      if (node.type !== 'ObjectProperty' || node.key?.name !== name) return;
      if (node.value?.type !== 'ObjectExpression') return;
      props = node.value.properties;
    });
    if (!props) return null;
    const get = (key) => {
      const p = props.find((x) => x.key?.name === key);
      return p ? screen.slice(p.value.start, p.value.end) : null;
    };
    return { borderColor: get('borderColor'), borderRadius: get('borderRadius') };
  };
  const boxes = { textInput: styleOf('textInput'), textArea: styleOf('textArea') };
  const onRegister = Object.values(boxes).every(
    (b) =>
      b &&
      b.borderColor === 'theme.colors.surfaceBorderStrong' &&
      b.borderRadius === 'theme.borderRadius.small'
  );
  check(onRegister, `CH10 both inputs box on the one register, by token (found ${JSON.stringify(boxes)})`);
}

// ── CH11 · the suite can see this gate ──────────────────────────────────
check(
  /"check:createhive-recut": "node scripts\/check-createhive-recut\.mjs"/.test(packageJson),
  'CH11 package.json exposes the createhive-recut check script'
);

console.log(`\ncheck-createhive-recut: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
