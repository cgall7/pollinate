// Gate: the send surface yields for the gift, and stands back up only where
// standing back up is correct.
//
//   npm run check:nectar-surface-yield
//
// WHY THIS GATE EXISTS.
//
// R-N3.3 ruled that the scrim fades across Gather so "the drop should fly over
// the entry it is for, not over a dimmed copy of it". The scrim went. The
// 354x360 opaque white card did not, so the beat played over a blank card that
// hid the very sentence being thanked, and on the comb mount it played inside a
// void with one orphaned balance line. R-N3.4 closes it: every painted part of
// the send surface falls away on the Gather clock, the card body included.
//
// Two of the three things that can break this are INVISIBLE TO A TEXT SCAN, and
// that is the whole design of the rows below.
//
//   * A mount site that does not pass `surfaceStyle` renders a card that never
//     fades. Nothing is misspelled and nothing is missing from any file — the
//     prop is simply absent at one of three call sites. Absence has no string
//     to grep, so this is an ENUMERATOR over the mount population, never a
//     pattern.
//   * Opacity applies to every descendant, so a balance line that ends up
//     INSIDE the node carrying `surfaceStyle` fades with it — and the balance
//     line is the one element R-N3 keeps, because Settle counts it 340ms after
//     Gather ends ("you watch it leave you"). That is an ancestry fact, not a
//     property fact.
//   * A success path that restores the surface repaints a re-armed panel for at
//     least a frame, and for a whole dismissal transition on the comb mount.
//     The old `reset()` did exactly that. The defect is that ONE function
//     served two opposite endings; the row asks which values the success
//     teardown writes, not whether a function named reset exists.
//
// R-N3.6 ADDED THE FOURTH THING THAT CAN BREAK IT, and it is invisible to a
// text scan for a fourth reason. R-N3.4's build surfaced a collision between
// two live rulings: R-N3 keeps the balance line so Settle has a numeral to
// count, R-N3.4 clears the card so the memory can be read, and on a tall entry
// those two want the same pixels. Lumen ruled the line yields, and ruled the
// principle: during the flight the send surface may keep an element painted
// only where the story's subject is not beneath it. So the panel now takes
// `subjectBeneath`, one behaviour per mount, keyed on structure and never on a
// measurement. The break is a mount that declares the comfortable answer, or a
// new mount that declares nothing at all, and neither is misspelled.
//
// TEN ROWS, and they are not equally strong:
//
//   G1  universe    files walked, all parsed, panel mounts found, hook found.
//                   An enumerator over an empty set is green about nothing.
//   G2  census      AST-captured mounts reconcile against a raw byte scan, with
//                   the parser's own comment array accounting for prose
//                   mentions. This checks the EXTRACTOR: a mount the walker
//                   misses is not one G3 finds unwired, it is one G3 never asks
//                   about.
//   G3  coverage    THE RULED ROW, first half. Every enumerated mount passes
//                   `surfaceStyle`. Not "the panel accepts one" — a prop the
//                   component reads and no caller supplies is the shipped
//                   defect wearing a fix's name.
//   G4  ancestry    THE RULED ROW, second half, and the premise that makes the
//                   R-N3 exception survivable. The node carrying `surfaceStyle`
//                   has no children at all, and the balance line is not a
//                   descendant of it.
//   G5  one driver  `surfaceStyle` and `controlsStyle` read the SAME animated
//                   value, and `surfaceStyle` carries no transform. Two values
//                   on one clock is a second copy of one derivation; a ground
//                   that moved would shear from the content it sits behind.
//   G6  stand-down  the success teardown writes no surface value. This is the
//                   captured defect's own mechanism.
//   G7  consumers   written as a UNIVERSAL over every `useNectarGift` caller:
//                   each one either ARMS the surface or DISMISSES it after a
//                   send. A caller in neither class is a FAILURE, not an
//                   absence — because a caller that does neither leaves a
//                   permanently invisible panel with an unreachable Send, and
//                   that is the one way this fix can be worse than the bug.
//   G9  hookup      THE RULED ROW FOR R-N3.6, first half. The balance line is
//                   an `Animated.Text` whose style is
//                   `[styles.balance, subjectBeneath ? surfaceStyle : null]`.
//                   Asserted as a shape and not as a mention, because the
//                   three near misses all read as correct: an animated value
//                   on a plain <Text> does nothing, `controlsStyle` would drag
//                   R-N3's 4pt settle onto the numeral, and an ungated style
//                   yields the line at all three mounts.
//   G10 classified  THE RULED ROW FOR R-N3.6, second half, and it does not
//                   trust the prop. Each mount's answer is DERIVED from its own
//                   JSX ancestry (in flow, so nothing of the screen is under
//                   it, versus taken out of flow, so something can be) and
//                   compared to what it declares. An ancestry the row cannot
//                   read demands the yield rather than passing, because
//                   keeping the line painted is the side that needs a licence.
//   G8  witness     G3, G4, G6, G9 and G10 being green only says the tree is
//                   clean today. G8 reconstructs each real defect in memory out
//                   of the real files and REQUIRES the resolvers to red. If the
//                   anchors stop existing this row fails rather than going
//                   quiet.
//
// SCOPE, STATED RATHER THAN BURIED. This is a source gate. It asserts the shape
// of the tree and which values drive which style; it does not paint. Whether
// 180ms of fade READS as the card yielding is a render, and the render is what
// the finding was made with.

import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const PANEL_REL = 'src/components/NectarSendPanel.js';
const HOOK_REL = 'src/components/useNectarGift.js';
const COMPONENT = 'NectarSendPanel';
const HOOK = 'useNectarGift';
const SURFACE_PROP = 'surfaceStyle';
const YIELD_PROP = 'subjectBeneath';
const PAINT_STYLE = 'cardPaint';
const BALANCE_STYLE = 'balance';
const BALANCE_TAG = 'Animated.Text';
const SURFACE_VALUES = ['controls', 'scrim'];
// The two spreads that make a style object absolutely positioned without ever
// writing the word. `absoluteFillObject` is in the list because a future author
// reaching for the non-frozen form must not silently leave this row's domain.
const ABSOLUTE_SPREADS = ['StyleSheet.absoluteFill', 'StyleSheet.absoluteFillObject'];

let pass = 0;
const failures = [];
const ok = (label) => { pass += 1; console.log(`  ok   ${label}`); };
const bad = (label, detail) => { failures.push(`${label} — ${detail}`); console.log(`  FAIL ${label} — ${detail}`); };

// ── the tree ────────────────────────────────────────────────────────────────
const files = [];
(function walkDir(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    fs.statSync(p).isDirectory() ? walkDir(p) : /\.jsx?$/.test(name) && files.push(p);
  }
})(SRC);
files.push(path.join(ROOT, 'App.js'));

const PARSE_OPTS = { sourceType: 'module', plugins: ['jsx', 'typescript'] };

// Walk carrying the ancestor chain, so G4 and G7 can ask what ENCLOSES a node
// rather than only what a node contains. A containment test is not a
// resolution: walk outward to the innermost enclosing function.
const walk = (node, cb, stack = []) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => walk(n, cb, stack)); return; }
  if (!node.type) { for (const k in node) { if (k === 'loc') continue; walk(node[k], cb, stack); } return; }
  cb(node, stack);
  stack.push(node);
  for (const k in node) { if (k === 'loc') continue; walk(node[k], cb, stack); }
  stack.pop();
};

const jsxName = (node) => (node?.type === 'JSXIdentifier' ? node.name
  : node?.type === 'JSXMemberExpression' ? `${jsxName(node.object)}.${jsxName(node.property)}` : null);

// A style expression is either `styles.x`, `[a, b]`, or something else. The
// third case is named rather than dropped — a style spelled as a call or a
// conditional is outside every question below, and that set is a population.
const styleRefs = (node, out = [], unresolved = []) => {
  if (!node) return { out, unresolved };
  if (node.type === 'MemberExpression' && node.object?.name === 'styles') { out.push(node.property?.name); return { out, unresolved }; }
  if (node.type === 'ArrayExpression') { node.elements.forEach((el) => styleRefs(el, out, unresolved)); return { out, unresolved }; }
  if (node.type === 'Identifier') { out.push(node.name); return { out, unresolved }; }
  if (node.type === 'MemberExpression') { out.push(`${node.object?.name ?? '?'}.${node.property?.name ?? '?'}`); return { out, unresolved }; }
  unresolved.push(node.type);
  return { out, unresolved };
};

const memberPath = (node) => (node?.type === 'Identifier' ? node.name
  : node?.type === 'MemberExpression' ? `${memberPath(node.object)}.${memberPath(node.property)}` : null);

// R-N3.6's structural key, resolved rather than trusted. A style object is
// ABSOLUTE if it says so or spreads one of the two helpers that say it for it;
// FLOW if it resolves and says neither; OPAQUE if it spreads something this
// file cannot open. Opaque is a third answer and never a quiet `flow`: the
// whole point of the row below is that keeping the line painted needs a
// licence, so an unreadable ancestor must not hand one out.
const classifyStyleObject = (obj) => {
  let opaque = false;
  for (const p of obj.properties ?? []) {
    if (p.type === 'SpreadElement') {
      const src = memberPath(p.argument);
      if (src && ABSOLUTE_SPREADS.includes(src)) return 'absolute';
      opaque = true;
      continue;
    }
    if (p.type === 'ObjectProperty' && (p.key?.name ?? p.key?.value) === 'position') {
      if (p.value?.value === 'absolute') return 'absolute';
    }
  }
  return opaque ? 'opaque' : 'flow';
};

// One `style={…}` expression, resolved to the classifications it contributes.
// Arrays, inline objects and conditional branches are all opened rather than
// dropped: an inline `{ backgroundColor: … }` beside a named style is ordinary
// idiom here and reading it as opaque would make every screen unresolvable.
// Anything genuinely unopenable is still named as opaque, so the row's domain
// never grows quietly.
const classifyStyleExpr = (node, sheet, out = []) => {
  if (!node) return out;
  if (node.type === 'ArrayExpression') { node.elements.forEach((el) => classifyStyleExpr(el, sheet, out)); return out; }
  if (node.type === 'ConditionalExpression') { classifyStyleExpr(node.consequent, sheet, out); classifyStyleExpr(node.alternate, sheet, out); return out; }
  if (node.type === 'LogicalExpression') { classifyStyleExpr(node.right, sheet, out); return out; }
  if (node.type === 'ObjectExpression') { out.push({ label: '{inline}', kind: classifyStyleObject(node) }); return out; }
  if (node.type === 'NullLiteral' || node.type === 'BooleanLiteral') return out;
  if (node.type === 'MemberExpression' && node.object?.name === 'styles') {
    const name = node.property?.name;
    out.push({ label: `styles.${name}`, kind: sheet.has(name) ? sheet.get(name) : 'opaque' });
    return out;
  }
  out.push({ label: memberPath(node) ?? `<${node.type}>`, kind: 'opaque' });
  return out;
};

// Every `StyleSheet.create` in one file, flattened to name -> classification.
const styleSheetIn = (tree) => {
  const sheet = new Map();
  walk(tree, (n) => {
    if (n.type !== 'CallExpression') return;
    const c = n.callee;
    if (!(c?.type === 'MemberExpression' && c.object?.name === 'StyleSheet' && c.property?.name === 'create')) return;
    const arg = n.arguments?.[0];
    if (arg?.type !== 'ObjectExpression') return;
    for (const p of arg.properties) {
      if (p.type !== 'ObjectProperty' || p.value?.type !== 'ObjectExpression') continue;
      sheet.set(p.key?.name ?? p.key?.value, classifyStyleObject(p.value));
    }
  });
  return sheet;
};

// ── the collector, as a function so G8 can re-run it on mutated source ──────
const RAW_MOUNT = new RegExp(`<${COMPONENT}\\b`, 'g');
const collect = (sources) => {
  const mounts = [];        // every `<NectarSendPanel` mount, with its props
  const consumers = [];     // every `useNectarGift(` caller
  const parseFailures = [];
  let paint = null;         // the node carrying `surfaceStyle` inside the panel
  let balance = null;       // the balance line inside the panel
  let balanceInsidePaint = null;
  const hook = { surfaceStyle: null, controlsStyle: null, teardownName: null, teardownWrites: [], armWrites: [] };

  for (const [rel, code] of sources) {
    let tree;
    try { tree = parse(code, PARSE_OPTS); } catch (err) { parseFailures.push(`${rel}: ${err.message}`); continue; }
    const sheet = styleSheetIn(tree);

    walk(tree, (node, stack) => {
      // ---- mounts -------------------------------------------------------
      if (node.type === 'JSXOpeningElement' && jsxName(node.name) === COMPONENT) {
        const props = node.attributes
          .filter((a) => a.type === 'JSXAttribute')
          .map((a) => a.name?.name);
        const spreads = node.attributes.filter((a) => a.type === 'JSXSpreadAttribute').length;

        // What the mount SAYS. A bare `subjectBeneath` is JSX shorthand for
        // true and is read as true rather than as unresolved, so the row can
        // never be dodged by writing the idiom.
        const attr = node.attributes.find((a) => a.type === 'JSXAttribute' && a.name?.name === YIELD_PROP);
        let declared;
        if (!attr) declared = 'absent';
        else if (attr.value === null) declared = true;
        else {
          const v = attr.value?.type === 'JSXExpressionContainer' ? attr.value.expression : null;
          declared = v?.type === 'BooleanLiteral' ? v.value : 'unresolved';
        }

        // What the mount IS. Walk the enclosing JSX and ask whether any
        // ancestor takes this surface out of flow. In flow, nothing of the
        // screen is under the panel; out of flow, something can be, and the
        // licence to keep the line painted is withheld.
        const chain = [];
        for (const anc of stack) {
          if (anc.type !== 'JSXElement') continue;
          const styleAttr = (anc.openingElement?.attributes ?? [])
            .find((a) => a.type === 'JSXAttribute' && a.name?.name === 'style');
          if (!styleAttr) continue;
          const expr = styleAttr.value?.type === 'JSXExpressionContainer' ? styleAttr.value.expression : null;
          const tag = jsxName(anc.openingElement.name);
          for (const part of classifyStyleExpr(expr, sheet)) chain.push({ tag, style: part.label, kind: part.kind });
        }
        const overlaid = chain.some((c) => c.kind === 'absolute') ? true
          : chain.some((c) => c.kind === 'opaque') ? 'unresolved' : false;

        mounts.push({ site: `${rel}:${node.loc.start.line}`, props, spreads, declared, overlaid, chain });
      }

      // ---- hook consumers ----------------------------------------------
      if (node.type === 'CallExpression' && node.callee?.name === HOOK) {
        consumers.push({ rel, line: node.loc.start.line });
      }

      // ---- the panel's own paint node and balance line ------------------
      if (rel === PANEL_REL && node.type === 'JSXOpeningElement') {
        const styleAttr = node.attributes.find((a) => a.type === 'JSXAttribute' && a.name?.name === 'style');
        if (!styleAttr) return;
        const expr = styleAttr.value?.type === 'JSXExpressionContainer' ? styleAttr.value.expression : null;
        const { out } = styleRefs(expr);
        const element = stack[stack.length - 1];
        if (out.includes(PAINT_STYLE) && out.includes(SURFACE_PROP)) {
          paint = { line: node.loc.start.line, children: (element?.children ?? []).filter((c) => c.type !== 'JSXText' || c.value.trim()).length, node: element };
        }
        if (out.includes(BALANCE_STYLE)) {
          balance = { line: node.loc.start.line, stack: [...stack], tag: jsxName(node.name), expr };
        }
      }

      // ---- the hook's published styles and its teardown -----------------
      if (rel === HOOK_REL && node.type === 'VariableDeclarator' && node.id?.type === 'Identifier'
        && ['surfaceStyle', 'controlsStyle'].includes(node.id.name) && node.init?.type === 'ObjectExpression') {
        const opacity = node.init.properties.find((p) => p.key?.name === 'opacity');
        const transform = node.init.properties.find((p) => p.key?.name === 'transform');
        hook[node.id.name] = {
          driver: opacity?.value?.type === 'Identifier' ? opacity.value.name : `<${opacity?.value?.type ?? 'missing'}>`,
          hasTransform: !!transform,
        };
      }
      // The teardown is whatever the SUCCESS tail calls: the `.then` that
      // returns `{ ok: true }`. Found by its own return value rather than by
      // name, so renaming the function cannot make this row go quiet.
      if (rel === HOOK_REL && node.type === 'ArrowFunctionExpression' && node.body?.type === 'BlockStatement') {
        const returnsOk = node.body.body.some((st) => st.type === 'ReturnStatement'
          && st.argument?.type === 'ObjectExpression'
          && st.argument.properties.some((p) => p.key?.name === 'ok' && p.value?.value === true));
        if (returnsOk) {
          const called = node.body.body
            .filter((st) => st.type === 'ExpressionStatement' && st.expression?.type === 'CallExpression'
              && st.expression.callee?.type === 'Identifier')
            .map((st) => st.expression.callee.name);
          if (called.length) hook.teardownName = called[called.length - 1];
        }
      }
    });
  }

  // Resolve the teardown's body and ask which values it writes. Also resolve
  // `arm`, so G6 can state where the restore DID go rather than only that it
  // left.
  const hookSrc = sources.find(([rel]) => rel === HOOK_REL)?.[1];
  if (hookSrc && hook.teardownName) {
    let tree = null;
    try { tree = parse(hookSrc, PARSE_OPTS); } catch { /* G1 reports */ }
    if (tree) {
      const bodyOf = (name) => {
        let found = null;
        walk(tree, (n) => {
          if (n.type === 'VariableDeclarator' && n.id?.name === name) found = n.init;
        });
        return found;
      };
      const writesOf = (fnNode) => {
        const writes = [];
        walk(fnNode, (n) => {
          if (n.type !== 'CallExpression' || n.callee?.type !== 'MemberExpression') return;
          if (n.callee.property?.name !== 'setValue') return;
          writes.push(n.callee.object?.name ?? '<expr>');
        });
        return writes;
      };
      const teardown = bodyOf(hook.teardownName);
      if (teardown) hook.teardownWrites = writesOf(teardown).filter((w) => SURFACE_VALUES.includes(w));
      const arm = bodyOf('arm');
      if (arm) hook.armWrites = writesOf(arm).filter((w) => SURFACE_VALUES.includes(w));
    }
  }

  // Classify the balance line's ancestry against the paint node.
  if (paint && balance) balanceInsidePaint = balance.stack.includes(paint.node);

  return { mounts, consumers, paint, balance, balanceInsidePaint, hook, parseFailures };
};

const sources = files.map((abs) => [path.relative(ROOT, abs), fs.readFileSync(abs, 'utf8')]);
const state = collect(sources);

// ── G1 universe ─────────────────────────────────────────────────────────────
const rawMountCount = sources.reduce((n, [, code]) => n + (code.match(RAW_MOUNT)?.length ?? 0), 0);
if (state.parseFailures.length === 0 && files.length > 0 && state.mounts.length > 0
  && state.consumers.length > 0 && state.paint && state.balance) {
  ok(`G1 universe: ${files.length} source files, 0 parse failures, ${state.mounts.length} <${COMPONENT}> mount(s), ${state.consumers.length} ${HOOK}() consumer(s), and the panel's paint node (:${state.paint.line}) and balance line (:${state.balance.line}) both resolved`);
} else {
  bad('G1 universe', `parse failures=${state.parseFailures.length} (${state.parseFailures.join('; ') || 'none'}), files=${files.length}, mounts=${state.mounts.length}, consumers=${state.consumers.length}, paint=${!!state.paint}, balance=${!!state.balance} — every row below quantifies over sets that must exist first`);
}

// ── G2 census ───────────────────────────────────────────────────────────────
if (rawMountCount === state.mounts.length) {
  ok(`G2 census: ${state.mounts.length} AST-captured mount(s) reconcile exactly against an independent raw byte scan (${rawMountCount} occurrence(s) of \`<${COMPONENT}\`). A mount the walker cannot see is not one G3 finds unwired, it is one G3 never asks about`);
} else {
  bad('G2 census', `AST found ${state.mounts.length} mount(s), raw scan found ${rawMountCount}. The extractor and the bytes disagree, so no count below is trustworthy`);
}

// ── G3 coverage ─────────────────────────────────────────────────────────────
const unwired = state.mounts.filter((m) => !m.props.includes(SURFACE_PROP) && m.spreads === 0);
const spread = state.mounts.filter((m) => !m.props.includes(SURFACE_PROP) && m.spreads > 0);
if (unwired.length === 0 && spread.length === 0) {
  ok(`G3 coverage: all ${state.mounts.length} mount(s) pass \`${SURFACE_PROP}\` by name — ${state.mounts.map((m) => m.site).join(', ')}. Absence has no string to grep, so this is an enumeration of the population and not a pattern over it`);
} else {
  bad('G3 coverage', `${unwired.length} mount(s) never pass \`${SURFACE_PROP}\` (${unwired.map((m) => m.site).join(', ') || 'none'}) and ${spread.length} pass props by spread, which this row cannot resolve (${spread.map((m) => m.site).join(', ') || 'none'}). A card that is handed no yield style never fades, and nothing in that file is misspelled`);
}

// ── G4 ancestry ─────────────────────────────────────────────────────────────
if (state.paint && state.paint.children === 0 && state.balanceInsidePaint === false) {
  ok(`G4 ancestry: the node carrying \`${SURFACE_PROP}\` (${PANEL_REL}:${state.paint.line}) has zero children, and the balance line (:${state.balance.line}) is a sibling of it rather than a descendant. Opacity reaches every descendant, so this is the premise under which "the card goes and the number stays" is a sentence about the same tree`);
} else {
  bad('G4 ancestry', `paint node children=${state.paint?.children ?? '(not found)'}, balance inside paint=${state.balanceInsidePaint}. Anything rendered inside the yielding node fades with it, and the balance line is the one element R-N3 keeps for Settle to count`);
}

// ── G5 one driver ───────────────────────────────────────────────────────────
const sDriver = state.hook.surfaceStyle?.driver;
const cDriver = state.hook.controlsStyle?.driver;
if (sDriver && cDriver && sDriver === cDriver && state.hook.surfaceStyle.hasTransform === false
  && state.hook.controlsStyle.hasTransform === true) {
  ok(`G5 one driver: \`${SURFACE_PROP}\` and \`controlsStyle\` both read \`${sDriver}\`, so the ground and the controls cannot drift into two clocks — there is nothing to drift from. The controls carry a transform (R-N3's 4pt settle) and the ground carries none, which is the difference the ruling actually names`);
} else {
  bad('G5 one driver', `surfaceStyle.opacity=${sDriver}, controlsStyle.opacity=${cDriver}, surface transform=${state.hook.surfaceStyle?.hasTransform}, controls transform=${state.hook.controlsStyle?.hasTransform} — two values on one clock is a second copy of one derivation, and a ground that moved would shear from the content it sits behind`);
}

// ── G6 stand-down ───────────────────────────────────────────────────────────
if (state.hook.teardownName && state.hook.teardownWrites.length === 0 && state.hook.armWrites.length === SURFACE_VALUES.length) {
  ok(`G6 stand-down: the success teardown (\`${state.hook.teardownName}\`, resolved by the \`{ ok: true }\` it returns rather than by its name) writes none of ${SURFACE_VALUES.join('/')}, and all ${SURFACE_VALUES.length} restores live in \`arm\` instead. R-N3.4: "it never returns re-armed" — the old single \`reset()\` snapped the surface back a whole tick before any caller could unmount or navigate`);
} else {
  bad('G6 stand-down', `teardown=${state.hook.teardownName ?? '(unresolved)'}, surface values it writes=[${state.hook.teardownWrites.join(', ')}], arm writes=[${state.hook.armWrites.join(', ')}] — a success path that restores the surface repaints a re-armed panel for at least a frame, and for the whole dismissal transition on the comb mount`);
}

// ── G7 consumers, as a universal ────────────────────────────────────────────
// Every consumer is classified. `arms` restores the surface itself; `dismisses`
// leaves the screen after a send so there is nothing left to restore. A
// consumer in NEITHER class is a failure: it would ship a panel that yields
// once and is never painted again, with an unreachable Send inside it.
const classifyConsumer = (rel, code) => {
  let tree;
  try { tree = parse(code, PARSE_OPTS); } catch { return { rel, kind: 'unparsed' }; }
  let arms = false;
  let dismisses = false;
  walk(tree, (node, stack) => {
    if (node.type !== 'CallExpression' || node.callee?.type !== 'MemberExpression') return;
    const prop = node.callee.property?.name;
    if (prop === 'arm') arms = true;
    if (prop !== 'send') return;
    // Walk OUTWARD to the innermost enclosing function, then ask whether the
    // same body leaves the screen. Containment in the file is not a resolution.
    for (let i = stack.length - 1; i >= 0; i -= 1) {
      const fn = stack[i];
      if (!['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(fn.type)) continue;
      walk(fn, (n) => {
        if (n.type === 'CallExpression' && n.callee?.type === 'MemberExpression'
          && n.callee.property?.name === 'goBack') dismisses = true;
      });
      break;
    }
  });
  return { rel, kind: arms ? 'arms' : dismisses ? 'dismisses' : 'neither' };
};
const consumerFiles = [...new Set(state.consumers.map((c) => c.rel))];
const classified = consumerFiles.map((rel) => classifyConsumer(rel, sources.find(([r]) => r === rel)[1]));
const stranded = classified.filter((c) => c.kind === 'neither' || c.kind === 'unparsed');
if (consumerFiles.length > 0 && stranded.length === 0) {
  ok(`G7 consumers: all ${consumerFiles.length} ${HOOK}() consumer(s) classified, none in the null class — ${classified.map((c) => `${c.rel} (${c.kind})`).join(', ')}. Written as a universal, so a caller that neither arms the surface nor leaves the screen is a FAILURE rather than a shape nobody thought to forbid`);
} else {
  bad('G7 consumers', `${stranded.length} consumer(s) in no class: ${stranded.map((c) => `${c.rel} (${c.kind})`).join(', ')} of ${consumerFiles.length} total. Such a screen yields its panel once and never repaints it, leaving an invisible card with an unreachable Send — worse than the defect this ruling fixes`);
}

// ── G9 yield hookup (R-N3.6) ────────────────────────────────────────────────
// Written against the exact shape rather than "mentions surfaceStyle
// somewhere", because the three ways this can be wrong all look right in
// review: an `Animated.Value` on a plain `<Text>` animates nothing; a hookup
// reading `controlsStyle` would drag R-N3's 4pt settle onto the numeral and
// put it on a second beat; and a hookup with no test yields the line at all
// three mounts, which is the ruling inverted.
const hookupVerdict = (balance) => {
  const e = balance?.expr;
  if (!balance) return { ok: false, detail: 'the balance line did not resolve at all' };
  const tagOk = balance.tag === BALANCE_TAG;
  if (e?.type !== 'ArrayExpression' || e.elements.length !== 2) {
    return { ok: false, detail: `tag=${balance.tag}, style expression is ${e?.type ?? '(none)'} with ${e?.elements?.length ?? 0} element(s); expected a two-element array` };
  }
  const [base, gated] = e.elements;
  const baseOk = base?.type === 'MemberExpression' && base.object?.name === 'styles' && base.property?.name === BALANCE_STYLE;
  const condOk = gated?.type === 'ConditionalExpression'
    && gated.test?.type === 'Identifier' && gated.test.name === YIELD_PROP
    && gated.consequent?.type === 'Identifier' && gated.consequent.name === SURFACE_PROP
    && gated.alternate?.type === 'NullLiteral';
  return {
    ok: tagOk && baseOk && condOk,
    detail: `tag=${balance.tag} (want ${BALANCE_TAG}), base=${baseOk ? `styles.${BALANCE_STYLE}` : base?.type}, gate=${condOk ? `${YIELD_PROP} ? ${SURFACE_PROP} : null` : `test=${gated?.test?.name ?? gated?.type}, consequent=${gated?.consequent?.name ?? gated?.consequent?.type}, alternate=${gated?.alternate?.type}`}`,
  };
};
const hookup = hookupVerdict(state.balance);
if (hookup.ok) {
  ok(`G9 yield hookup: the balance line (${PANEL_REL}:${state.balance.line}) is an \`${BALANCE_TAG}\` whose style is \`[styles.${BALANCE_STYLE}, ${YIELD_PROP} ? ${SURFACE_PROP} : null]\`. It reads the SAME published style the card's ground reads, so R-N3.6's "same driver, same clock" is true by construction rather than by care at three call sites, and it yields by its own hookup rather than by ancestry, which is the premise G4 guards from the other side`);
} else {
  bad('G9 yield hookup', `${hookup.detail}. An animated value on a plain <Text> animates nothing, \`controlsStyle\` here would put R-N3's 4pt settle on the numeral, and an ungated style yields the line at every mount, and all three read as correct in a diff`);
}

// ── G10 mount classification (R-N3.6) ───────────────────────────────────────
// THE RULED ROW FOR R-N3.6, and it does not trust the prop. Lumen ruled the
// split keys on structure, "destination beneath the surface versus beside it",
// explicitly not on a measurement, so this derives each mount's answer from
// its own JSX ancestry and compares. A mount in ordinary flow has nothing of
// the screen under it and may keep the line; a mount taken out of flow may
// not. An ancestry this row cannot read is not a pass: keeping the line
// painted is what needs the licence, so `unresolved` demands the yield.
//
// A UNIVERSAL, not a pattern. `subjectBeneath` has no default in the panel
// precisely so a new mount that never declares it lands here as `absent`
// rather than inheriting the answer that keeps the line up.
const classifyMounts = (mounts) => {
  const requires = (m) => (m.overlaid === false ? false : true);
  return {
    undeclared: mounts.filter((m) => m.declared === 'absent' || m.declared === 'unresolved'),
    mismatched: mounts.filter((m) => typeof m.declared === 'boolean' && m.declared !== requires(m)),
    requires,
  };
};
const cls = classifyMounts(state.mounts);
if (state.mounts.length > 0 && cls.undeclared.length === 0 && cls.mismatched.length === 0) {
  ok(`G10 mount classification: all ${state.mounts.length} mount(s) declare \`${YIELD_PROP}\` and each declaration equals the answer derived from its own ancestry. ${state.mounts.map((m) => `${m.site} declared=${m.declared}, derived overlaid=${m.overlaid}${m.chain.filter((c) => c.kind === 'absolute').map((c) => ` via ${c.tag} ${c.style}`).join('')}`).join('; ')}. The split is structural, never a measurement: a line that stayed for short entries and yielded for tall ones would be two beats decided by a number`);
} else {
  bad('G10 mount classification', `${cls.undeclared.length} mount(s) declare nothing this row can read (${cls.undeclared.map((m) => `${m.site} (${m.declared})`).join(', ') || 'none'}) and ${cls.mismatched.length} contradict their own structure (${cls.mismatched.map((m) => `${m.site} declared=${m.declared}, derived overlaid=${m.overlaid}, requires=${cls.requires(m)}`).join(', ') || 'none'}), of ${state.mounts.length} total. A panel drawn over the thing it is sending to must not keep any of itself painted during the flight`);
}

// ── G8 witness ──────────────────────────────────────────────────────────────
// Each mutation reconstructs a real defect out of the real files. `anchored`
// proves the mutation actually changed something (a mutation that found
// nothing to change tested nothing); `reds` proves the resolver noticed.
const mutations = [];
const mutate = (rel, fn) => sources.map(([r, code]) => [r, r === rel ? fn(code) : code]);

{
  // 1. The absent prop — the shipped-defect shape, and the one no text scan
  //    can see, because nothing is misspelled and no file is missing anything.
  const target = sources.find(([r]) => r === 'src/screens/CombNectarCompose.js');
  const mutated = mutate(target[0], (code) => code.replace(` surfaceStyle={gift.surfaceStyle}`, ''));
  const after = collect(mutated);
  const missing = after.mounts.filter((m) => !m.props.includes(SURFACE_PROP));
  mutations.push({
    name: 'a mount site stops passing surfaceStyle',
    anchored: mutated.find(([r]) => r === target[0])[1] !== target[1],
    reds: missing.length === 1,
    saw: `${missing.length} unwired mount(s)${missing.length ? ` at ${missing[0].site}` : ''}`,
  });
}
{
  // 2. The balance line moved inside the yielding node — the ancestry defect.
  //    This is the one that would look completely correct in review: the card
  //    fades, the number is still in the file, and the number is gone from the
  //    screen at exactly the moment Settle needs it.
  const target = sources.find(([r]) => r === PANEL_REL);
  const mutated = mutate(PANEL_REL, (code) => code
    .replace(`<Animated.View pointerEvents="none" style={[styles.cardPaint, surfaceStyle]} />`,
      `<Animated.View pointerEvents="none" style={[styles.cardPaint, surfaceStyle]}><Text style={styles.balance}>x</Text></Animated.View>`));
  const after = collect(mutated);
  mutations.push({
    name: 'the balance line renders inside the node that fades',
    anchored: mutated.find(([r]) => r === PANEL_REL)[1] !== target[1],
    reds: after.paint?.children > 0,
    saw: `paint node children=${after.paint?.children}`,
  });
}
{
  // 3. The success teardown restores the surface — the captured re-armed
  //    compose, reconstructed by putting the old `reset()` behaviour back.
  const target = sources.find(([r]) => r === HOOK_REL);
  const mutated = mutate(HOOK_REL, (code) => code.replace(
    `  const resetFlight = useCallback(() => {\n    travel.setValue(0);`,
    `  const resetFlight = useCallback(() => {\n    controls.setValue(1);\n    travel.setValue(0);`));
  const after = collect(mutated);
  mutations.push({
    name: 'the success teardown puts the surface back',
    anchored: mutated.find(([r]) => r === HOOK_REL)[1] !== target[1],
    reds: after.hook.teardownWrites.length > 0,
    saw: `teardown writes=[${after.hook.teardownWrites.join(', ')}]`,
  });
}

{
  // 4. R-N3.6's own defect, and the reason the prop has no default: a new
  //    mount that never declares. Reconstructed by deleting the declaration
  //    from a real call site, which leaves a file where nothing is misspelled
  //    and every existing row is still green.
  const target = sources.find(([r]) => r === 'src/screens/CombNectarCompose.js');
  // Anchored on the following prop as well, so this can only match the
  // declaration itself and never the prose that names it.
  const mutated = mutate(target[0], (code) => code.replace(` ${YIELD_PROP}={false} originRef=`, ' originRef='));
  const state4 = collect(mutated);
  const after = classifyMounts(state4.mounts);
  mutations.push({
    name: 'a mount site declares no subjectBeneath',
    anchored: mutated.find(([r]) => r === target[0])[1] !== target[1] && state4.parseFailures.length === 0,
    reds: after.undeclared.length === 1,
    saw: `${after.undeclared.length} undeclared mount(s)${after.undeclared.length ? ` at ${after.undeclared[0].site}` : ''}, ${state4.parseFailures.length} parse failure(s)`,
  });
}
{
  // 5. The comfortable answer. The entry overlay claims its subject is not
  //    under it, which is the shipped defect R-N3.6 removes, wearing the new
  //    prop's name. Only the DERIVATION catches this one: the declaration is
  //    well formed, a boolean, and completely wrong.
  const target = sources.find(([r]) => r === 'src/screens/PackageOpen.js');
  const mutated = mutate(target[0], (code) => code.replace(`${YIELD_PROP}={true}`, `${YIELD_PROP}={false}`));
  const state5 = collect(mutated);
  const after = classifyMounts(state5.mounts);
  mutations.push({
    name: 'the overlaid mount claims nothing is beneath it',
    anchored: mutated.find(([r]) => r === target[0])[1] !== target[1] && state5.parseFailures.length === 0,
    reds: after.mismatched.length === 1,
    saw: `${after.mismatched.length} mismatched mount(s)${after.mismatched.length ? ` at ${after.mismatched[0].site} (declared=${after.mismatched[0].declared}, overlaid=${after.mismatched[0].overlaid})` : ''}, ${state5.parseFailures.length} parse failure(s)`,
  });
}
{
  // 6. The line loses its hookup and goes back to a plain painted <Text>.
  //    This is the whole ruling undone in one edit, and the panel still
  //    compiles, still renders, and still shows a number.
  const target = sources.find(([r]) => r === PANEL_REL);
  //    BOTH TAGS, because a half-swapped element is a syntax error and a row
  //    that reds on a parse failure has tested the parser rather than the
  //    resolver. `anchored` asserts the mutated tree still parses.
  const mutated = mutate(PANEL_REL, (code) => code
    .replace(
      `<Animated.Text style={[styles.${BALANCE_STYLE}, ${YIELD_PROP} ? ${SURFACE_PROP} : null]}>`,
      `<Text style={styles.${BALANCE_STYLE}}>`)
    .replace('</Animated.Text>', '</Text>'));
  const state6 = collect(mutated);
  const after = hookupVerdict(state6.balance);
  mutations.push({
    name: 'the balance line loses its yield hookup',
    anchored: mutated.find(([r]) => r === PANEL_REL)[1] !== target[1] && state6.parseFailures.length === 0,
    reds: after.ok === false,
    saw: `${after.detail}, ${state6.parseFailures.length} parse failure(s)`,
  });
}

{
  // 7. THE OPAQUE BRANCH, which is the one decision in G10 that could pass
  //    quietly forever. A mount whose ancestry this row cannot read must be
  //    treated as overlaid, because the licence being asked for is the licence
  //    to keep pixels over the subject. Reconstructed by handing an ancestor a
  //    style the file cannot open: the mount still declares `false`, nothing
  //    else changes, and G10 must stop believing it.
  //
  //    Written after the row's first cut read a perfectly ordinary
  //    `style={[styles.container, { backgroundColor: cover.base }]}` as
  //    unreadable and redded correct work. A row that fails closed is only
  //    safe if the set it closes on is the set it means.
  const target = sources.find(([r]) => r === 'src/screens/PackageOpen.js');
  const mutated = mutate(target[0], (code) => code.replace('<View style={styles.ending}>', '<View style={pixelOpaqueStyle}>'));
  const state7 = collect(mutated);
  const after = classifyMounts(state7.mounts);
  const opaqueMount = state7.mounts.find((m) => m.overlaid === 'unresolved');
  mutations.push({
    name: 'an ancestor style this row cannot open still demands the yield',
    anchored: mutated.find(([r]) => r === target[0])[1] !== target[1] && state7.parseFailures.length === 0 && !!opaqueMount,
    reds: after.mismatched.length === 1 && after.mismatched[0].overlaid === 'unresolved',
    saw: `${after.mismatched.length} mismatched mount(s)${opaqueMount ? ` and ${opaqueMount.site} derived overlaid=unresolved` : ' and no mount derived unresolved'}, ${state7.parseFailures.length} parse failure(s)`,
  });
}

const brokenAnchor = mutations.filter((m) => !m.anchored);
const silent = mutations.filter((m) => m.anchored && !m.reds);
if (brokenAnchor.length === 0 && silent.length === 0) {
  ok(`G8 witness: ${mutations.length} reconstructed defects each red their own resolver (${mutations.map((m) => m.name).join('; ')})`);
} else {
  bad('G8 witness',
    (brokenAnchor.length ? `${brokenAnchor.length} mutation(s) found nothing to change, so they tested nothing: ${brokenAnchor.map((m) => m.name).join(', ')}. ` : '') +
    (silent.length ? `${silent.length} mutation(s) applied and the resolver stayed green: ${silent.map((m) => `${m.name} (saw ${m.saw})`).join('; ')}. ` : '') +
    'This row exists so G3, G4 and G6 cannot become decorative. Repair the anchors or the rows, not this row.');
}

console.log(`\n${pass} passed, ${failures.length} failed`);
process.exitCode = failures.length ? 1 : 0;
