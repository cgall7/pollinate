// POLLINATE_COMB_DIVE_SPEC.md — structural gate for the parts of R-CD-1..10
// a source-level probe can actually see (no device, no running RN). What it
// does NOT cover, by design: on-device timing (R-CD-2/-11.3), the live feel
// of interruption/velocity-transfer (R-CD-11.1/.2/.4), and anything that
// needs a rendered frame. Those are the capture pass's job, not this file's.
//
//   npm run check:comb-dive
//
// WHAT IT ASSERTS
//
//   D1  no `setTimeout`/`setInterval` in EntryCombGrid.js — the module that
//       owns the camera/wax-shadow/backlight/chrome choreography R-CD-1
//       bans a phase machine from. (CombDivePaper's odometer is a separate,
//       explicitly-licensed exception — see D8 — and is not this row's
//       concern.)
//   D2  every Animated.spring/timing call that retargets the shared `dive`
//       value passes `useNativeDriver: true` (R-CD-10)
//   D3  `close()` in EntryCombGrid.js accepts a velocity argument and
//       threads it into `springDive`'s `velocity` field — the wiring
//       R-CD-1's "release velocity feeds the spring toward 0" needs to be
//       possible at all. (Whether it FEELS right is the capture pass's job.)
//   D4  the honey fill (`hexHoneyPoints`/`honeyHeightForLevel`) only ever
//       renders inside a `filled` (`cell.member`) branch — an empty cell can
//       never paint honey (R-CD-8)
//   D5  every cell — filled or empty — is wrapped by the same
//       `PressableScale` call, so an empty cell still gets press-scale
//       feedback (R-CD-8's "assert the press-scale presence")
//   D6  the camera transform, dolly displacement, wax-shadow opacity and
//       focus backlight are all conditioned on `!reduced` in
//       EntryCombGrid.js — RM gets none of them (R-CD-9)
//   D7  the honey-tint cross-fade, meniscus glint and date odometer in
//       CombDivePaper.js are all conditioned on `!reduced` (R-CD-9)
//   D8  the rim-crossing haptic fires from the `dive` listener callback,
//       never from an `Animated...start(callback)` completion handler —
//       R-CD-6's "fires on step crossing, not on release/settle"
//   D9  no spring config literal (`{ friction:`/`{ tension:`) is passed
//       directly to `Animated.spring` in either file — every spring must
//       come from the `SPRINGS` token module (motion-skill ship checklist:
//       "all values come from tokens, none inline")
//   D10 `computeDiveDateRoll` — the odometer's own math — is correct on
//       three fixtures: this-month (no roll), a same-year 3-months-ago case
//       (month roll, no elision), and an 8-year-old letter (elided to
//       exactly `[currentYear, '…', entryYear]`, ≤ MAX_VISIBLE_STEPS)
//   D11 the odometer's `closingRef` gate (Lumen's must-fix, 2026-09-04:
//       "reverse dive never rolls" means the setTimeout chain must stop the
//       moment dismissal COMMITS, not at unmount) — `close()` in
//       EntryCombGrid.js sets `closingRef.current = true` as its first
//       statement, and DiveDateEyebrow's `advance()` guard AND its
//       setTimeout body both check `closingRef?.current` before doing
//       anything observable
//   D12 the scroll/dismiss gesture grammar (Lumen's must-fix): the
//       PanResponder never claims at touch-start
//       (`onStartShouldSetPanResponder` is a literal `false`), and its
//       vertical-down capture branch is gated on `scrollYRef.current <= 0` —
//       so a downward drag only claims the responder when the entry text is
//       scrolled to its top
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { computeDiveDateRoll, MAX_VISIBLE_STEPS } from '../src/utils/combDiveDate.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const GRID = path.join(SRC, 'components/EntryCombGrid.js');
const PAPER = path.join(SRC, 'components/CombDivePaper.js');

let pass = 0;
const failures = [];
const ok = (label) => {
  pass += 1;
  console.log(`  ok   ${label}`);
};
const bad = (label, detail) => {
  failures.push(`${label} — ${detail}`);
  console.log(`  FAIL ${label} — ${detail}`);
};

const parseJs = (src) => parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
const walk = (node, fn) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, fn));
    return;
  }
  if (typeof node.type === 'string') fn(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments') continue;
    walk(node[key], fn);
  }
};

// Comments blanked before any string-content regex — this file's own header
// prose names every banned pattern to explain the row, and a regex that
// can't tell prose from code trips on itself (justification_comment_is_a_dependency).
const codeOnly = (src, ast) =>
  (ast.comments || [])
    .slice()
    .sort((a, b) => b.start - a.start)
    .reduce((s, c) => s.slice(0, c.start) + ' '.repeat(c.end - c.start) + s.slice(c.end), src);

// `const x = useCallback((...) => {...}, [deps])` is a CallExpression init,
// not a bare ArrowFunctionExpression — unwrap it so probes that look for
// "the function bound to name X" don't miss every hook-wrapped declaration
// in this codebase's own convention.
const unwrapCallback = (init) => {
  if (!init) return null;
  if (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression') return init;
  if (init.type === 'CallExpression' && init.callee?.name === 'useCallback') return init.arguments[0] ?? null;
  return null;
};

const findAncestors = (root, target) => {
  const path = [];
  let found = false;
  const visit = (node, stack) => {
    if (found || !node || typeof node !== 'object') return;
    if (node === target) {
      path.push(...stack);
      found = true;
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((n) => visit(n, stack));
      return;
    }
    if (typeof node.type !== 'string') return;
    const nextStack = [...stack, node];
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments') continue;
      visit(node[key], nextStack);
    }
  };
  visit(root, []);
  return path;
};

const gridSrc = fs.readFileSync(GRID, 'utf8');
const paperSrc = fs.readFileSync(PAPER, 'utf8');
const gridAst = parseJs(gridSrc);
const paperAst = parseJs(paperSrc);
const gridCode = codeOnly(gridSrc, gridAst);
const paperCode = codeOnly(paperSrc, paperAst);

// ── D1. no setTimeout/setInterval in EntryCombGrid.js ───────────────────
{
  if (/\bset(Timeout|Interval)\s*\(/.test(gridCode)) {
    bad('D1 no phase-machine timers', 'EntryCombGrid.js calls setTimeout/setInterval — the choreography must be a pure interpolation of `dive`');
  } else {
    ok('D1 EntryCombGrid.js contains no setTimeout/setInterval');
  }
}

// ── D2. every Animated.spring/timing retargeting `dive` uses the native driver ─
{
  const problems = [];
  for (const [file, src, ast] of [
    ['EntryCombGrid.js', gridSrc, gridAst],
    ['CombDivePaper.js', paperSrc, paperAst],
  ]) {
    walk(ast.program, (n) => {
      if (n.type !== 'CallExpression') return;
      const callee = n.callee;
      const isAnimatedCall =
        callee.type === 'MemberExpression' &&
        callee.object.type === 'MemberExpression' &&
        callee.object.object?.name === 'Animated' &&
        (callee.object.property?.name === 'spring' || callee.object.property?.name === 'timing');
      // Also catch the bare `Animated.spring(...)`/`Animated.timing(...)` shape.
      const isBareAnimatedCall =
        callee.type === 'MemberExpression' &&
        callee.object?.name === 'Animated' &&
        (callee.property?.name === 'spring' || callee.property?.name === 'timing');
      if (!isAnimatedCall && !isBareAnimatedCall) return;
      const configArg = n.arguments[1];
      if (!configArg || configArg.type !== 'ObjectExpression') {
        problems.push(`${file}:${n.loc?.start.line} — Animated call has no inline config object to inspect`);
        return;
      }
      const nativeDriverProp = configArg.properties.find((p) => p.key?.name === 'useNativeDriver');
      const isTrue = nativeDriverProp?.value?.type === 'BooleanLiteral' && nativeDriverProp.value.value === true;
      if (!isTrue) {
        problems.push(`${file}:${n.loc?.start.line} — missing or false useNativeDriver`);
      }
    });
  }
  if (problems.length) {
    problems.forEach((p) => bad('D2 native driver', p));
  } else {
    ok('D2 every Animated.spring/timing call uses useNativeDriver: true');
  }
}

// ── D3. close() threads a velocity argument into springDive ────────────
{
  let closeFn = null;
  walk(gridAst.program, (n) => {
    if (closeFn) return;
    if (n.type === 'VariableDeclarator' && n.id?.name === 'close') {
      closeFn = unwrapCallback(n.init);
    }
  });
  if (!closeFn) {
    bad('D3 close() velocity threading', 'could not find a `const close = (...) => {...}` declaration in EntryCombGrid.js — FAILS CLOSED');
  } else {
    const hasVelocityParam = closeFn.params.some((p) => p.name === 'velocity');
    const bodySrc = gridSrc.slice(closeFn.body.start, closeFn.body.end);
    const passesVelocity = /springDive\s*\(\s*0\s*,\s*velocity\b/.test(bodySrc);
    if (hasVelocityParam && passesVelocity) {
      ok('D3 close(velocity) threads the release velocity into springDive(0, velocity, …)');
    } else {
      bad('D3 close() velocity threading', `hasVelocityParam=${hasVelocityParam} passesVelocity=${passesVelocity}`);
    }
  }
}

// ── D4. honey fill only renders inside a filled/cell.member branch ─────
{
  let leaked = false;
  let found = false;
  walk(gridAst.program, (n) => {
    if (n.type !== 'CallExpression' || n.callee?.name !== 'hexHoneyPoints') return;
    found = true;
    // True ancestry, not brace-counting: a JSX prop like `points={...}`
    // opens its own `{`, which sits textually closer to the call than the
    // `{filled ? (` guard and defeats a brace-nearest-wins heuristic. Walk
    // the real AST parent chain instead and require the nearest enclosing
    // ConditionalExpression/LogicalExpression's test/left to mention
    // `filled`, with the call inside its *consequent* (ternary) or *right*
    // (&&) branch specifically — not its alternate or test.
    const ancestors = findAncestors(gridAst.program, n);
    const guard = [...ancestors].reverse().find((a) => a.type === 'ConditionalExpression' || a.type === 'LogicalExpression');
    if (!guard) {
      leaked = true;
      return;
    }
    const testSrc =
      guard.type === 'ConditionalExpression'
        ? gridSrc.slice(guard.test.start, guard.test.end)
        : gridSrc.slice(guard.left.start, guard.left.end);
    const inGuardedBranch =
      guard.type === 'ConditionalExpression'
        ? n.start >= guard.consequent.start && n.end <= guard.consequent.end
        : n.start >= guard.right.start && n.end <= guard.right.end;
    if (!/\bfilled\b/.test(testSrc) || !inGuardedBranch) leaked = true;
  });
  if (!found) {
    bad('D4 honey fill guarded by filled', 'no hexHoneyPoints() call found in EntryCombGrid.js — FAILS CLOSED (expected the rest-state honey fill)');
  } else if (leaked) {
    bad('D4 honey fill guarded by filled', 'a hexHoneyPoints() call is not the nearest thing inside a `{filled …}` guard — an empty cell could paint honey');
  } else {
    ok('D4 hexHoneyPoints() only renders inside a `{filled …}` guard — an empty cell paints no honey');
  }
}

// ── D5. every cell (filled or empty) is wrapped by the same PressableScale ─
{
  const pressableCalls = [];
  walk(gridAst.program, (n) => {
    if (n.type === 'JSXOpeningElement' && n.name?.name === 'PressableScale') pressableCalls.push(n);
  });
  // EntryCell is the one component that renders a cell (both filled and
  // empty share it — no separate branch), so exactly one PressableScale
  // call site inside EntryCell covers both states by construction. Two or
  // more sites, or a filled-only guard around the call, would mean an empty
  // cell can silently skip it.
  let entryCellFn = null;
  walk(gridAst.program, (n) => {
    if (entryCellFn) return;
    if (n.type === 'VariableDeclarator' && n.id?.name === 'EntryCell' && n.init?.type === 'ArrowFunctionExpression') {
      entryCellFn = n.init;
    }
  });
  if (!entryCellFn) {
    bad('D5 press-scale on every cell', 'no `const EntryCell = (...) => {...}` found — FAILS CLOSED');
  } else {
    const bodySrc = gridSrc.slice(entryCellFn.body.start, entryCellFn.body.end);
    const pressableInBody = (bodySrc.match(/<PressableScale/g) || []).length;
    const guardedByFilled = /filled\s*\?[^:]*<PressableScale|filled\s*&&[^}]*<PressableScale/.test(bodySrc);
    if (pressableInBody === 1 && !guardedByFilled) {
      ok('D5 EntryCell wraps both filled and empty states in exactly one, unconditional PressableScale');
    } else {
      bad('D5 press-scale on every cell', `pressableInBody=${pressableInBody} guardedByFilled=${guardedByFilled}`);
    }
  }
}

// ── D6. camera/dolly/wax/backlight all conditioned on !reduced ─────────
{
  const requiredGuards = [
    ['clusterTransform', /openCell\s*&&\s*!reduced/],
    ['dolly gate', /if\s*\(\s*openCell\s*&&\s*!reduced\s*\)/],
  ];
  const problems = [];
  for (const [label, re] of requiredGuards) {
    if (!re.test(gridCode)) problems.push(label);
  }
  if (problems.length) {
    problems.forEach((p) => bad('D6 RM excludes camera/dolly/wax/backlight', `expected pattern not found: ${p}`));
  } else {
    ok('D6 clusterTransform and the dolly/wax/backlight block are both gated on !reduced');
  }
}

// ── D7. honey-tint/glint/odometer conditioned on !reduced in CombDivePaper ─
{
  const problems = [];
  if (!/\{!reduced\s*&&\s*\(?\s*<Animated\.View[^}]*styles\.glint/.test(paperCode.replace(/\n/g, ' '))) {
    problems.push('glint not gated on !reduced');
  }
  if (!/!reduced\s*&&\s*\(/.test(paperCode)) {
    problems.push('no !reduced-gated block found at all');
  }
  if (!/!reduced\s*&&\s*index\s*===\s*0\s*\?\s*\(?\s*<DiveDateEyebrow/.test(paperCode.replace(/\n/g, ' '))) {
    problems.push('DiveDateEyebrow (the odometer) not gated on !reduced');
  }
  if (!/backgroundColor:\s*theme\.colors\.diveHoneyTint/.test(paperCode)) {
    problems.push('honey-tint overlay token not found');
  } else if (!/\{!reduced\s*&&\s*\(?\s*<Animated\.View[\s\S]{0,200}diveHoneyTint/.test(paperCode)) {
    problems.push('honey-tint overlay not gated on !reduced');
  }
  if (problems.length) {
    problems.forEach((p) => bad('D7 RM excludes honey-tint/glint/odometer', p));
  } else {
    ok('D7 honey-tint, meniscus glint and date odometer are all gated on !reduced in CombDivePaper.js');
  }
}

// ── D8. rim-crossing haptic fires from the dive listener, not a completion callback ─
{
  let listenerFn = null;
  walk(gridAst.program, (n) => {
    if (listenerFn) return;
    if (n.type === 'VariableDeclarator' && n.id?.name === 'handleDiveTick') {
      listenerFn = unwrapCallback(n.init);
    }
  });
  if (!listenerFn) {
    bad('D8 rim-crossing haptic source', 'no `handleDiveTick` listener callback found — FAILS CLOSED');
  } else {
    const bodySrc = gridSrc.slice(listenerFn.body.start, listenerFn.body.end);
    const firesHapticHere = /Haptics\.impactAsync/.test(bodySrc);
    const registeredAsListener = /dive\.addListener\(\s*handleDiveTick\s*\)/.test(gridCode);
    // Negative check: the only other Haptics.impactAsync call sites in this
    // file are the tap-recognized haptic (openAt, fires immediately, not
    // from a completion callback either) — grep for `.start(` bodies that
    // themselves fire a haptic, which would mean an on-release/settle timing.
    const startCallbackFiresHaptic = /\.start\(\s*\(\s*\)?\s*=>\s*\{[^}]*Haptics\.impactAsync/.test(gridCode);
    if (firesHapticHere && registeredAsListener && !startCallbackFiresHaptic) {
      ok('D8 rim-crossing haptic fires from the dive addListener callback, not from a .start() completion handler');
    } else {
      bad(
        'D8 rim-crossing haptic source',
        `firesHapticHere=${firesHapticHere} registeredAsListener=${registeredAsListener} startCallbackFiresHaptic=${startCallbackFiresHaptic}`
      );
    }
  }
}

// ── D9. no inline spring config literal passed to Animated.spring ──────
{
  const problems = [];
  for (const [file, ast] of [
    ['EntryCombGrid.js', gridAst],
    ['CombDivePaper.js', paperAst],
  ]) {
    walk(ast.program, (n) => {
      if (n.type !== 'CallExpression') return;
      const callee = n.callee;
      const isSpring =
        (callee.type === 'MemberExpression' && callee.property?.name === 'spring') ||
        false;
      if (!isSpring) return;
      const configArg = n.arguments[1];
      if (configArg?.type !== 'ObjectExpression') return;
      const hasInlineFriction = configArg.properties.some((p) => p.key?.name === 'friction' || p.key?.name === 'tension');
      if (hasInlineFriction) {
        problems.push(`${file}:${n.loc?.start.line} — Animated.spring config has an inline friction/tension literal instead of a SPRINGS.* spread`);
      }
    });
  }
  if (problems.length) {
    problems.forEach((p) => bad('D9 tokens not inline', p));
  } else {
    ok('D9 no Animated.spring call in either file carries an inline friction/tension literal');
  }
}

// ── D10. computeDiveDateRoll fixtures ───────────────────────────────────
{
  const now = new Date(2026, 8, 4); // 2026-09-04, matches this session's date
  const thisMonth = computeDiveDateRoll('2026-09-01', now);
  if (thisMonth.active === false) {
    ok("D10a this-month entry gets active: false (no roll — 'a quick dip, not a journey')");
  } else {
    bad('D10a this-month absence', `expected active:false, got ${JSON.stringify(thisMonth)}`);
  }

  const threeMonths = computeDiveDateRoll('2026-06-15', now);
  const expectedMonthSteps = ['Sep', 'Aug', 'Jul', 'Jun'];
  if (threeMonths.active && threeMonths.unit === 'month' && JSON.stringify(threeMonths.steps) === JSON.stringify(expectedMonthSteps)) {
    ok('D10b a same-year, 3-months-ago entry rolls months Sep→Jun with no elision');
  } else {
    bad('D10b month roll', `expected unit:month steps:${JSON.stringify(expectedMonthSteps)}, got ${JSON.stringify(threeMonths)}`);
  }

  const eightYears = computeDiveDateRoll('2019-03-14', now);
  const withinCap = eightYears.steps.length <= MAX_VISIBLE_STEPS;
  const elidedCorrectly = JSON.stringify(eightYears.steps) === JSON.stringify(['2026', '…', '2019']);
  if (eightYears.active && eightYears.unit === 'year' && withinCap && elidedCorrectly) {
    ok("D10c an 8-year-old letter elides to exactly ['2026', '…', '2019'], within MAX_VISIBLE_STEPS");
  } else {
    bad('D10c year elision', `withinCap=${withinCap} elidedCorrectly=${elidedCorrectly} got ${JSON.stringify(eightYears)}`);
  }
}

// ── D11. closingRef gates the odometer chain at both checkpoints ────────
{
  let closeFn = null;
  walk(gridAst.program, (n) => {
    if (closeFn) return;
    if (n.type === 'VariableDeclarator' && n.id?.name === 'close') closeFn = unwrapCallback(n.init);
  });
  const closeFirstStatement = closeFn?.body?.body?.[0];
  const closeSetsClosingRefFirst =
    closeFirstStatement?.type === 'ExpressionStatement' &&
    /closingRef\.current\s*=\s*true/.test(gridSrc.slice(closeFirstStatement.start, closeFirstStatement.end));
  if (closeSetsClosingRefFirst) {
    ok('D11a close() sets closingRef.current = true as its first statement');
  } else {
    bad(
      'D11a close() closingRef ordering',
      `expected close()'s first statement to set closingRef.current = true, got: ${closeFn ? gridSrc.slice(closeFirstStatement?.start ?? closeFn.start, closeFirstStatement?.end ?? closeFn.start + 60) : 'close() not found — FAILS CLOSED'}`
    );
  }

  let advanceFn = null;
  walk(paperAst.program, (n) => {
    if (advanceFn) return;
    if (n.type === 'VariableDeclarator' && n.id?.name === 'advance' && n.init?.type === 'ArrowFunctionExpression') {
      advanceFn = n.init;
    }
  });
  if (!advanceFn) {
    bad('D11b advance() guard', 'no `const advance = (...) => {...}` found in CombDivePaper.js — FAILS CLOSED');
  } else {
    const bodySrc = paperSrc.slice(advanceFn.body.start, advanceFn.body.end);
    // Two checkpoints: the guard clause at the top of advance(), and the
    // setTimeout callback's own early-return — a chain that only checks one
    // can still fire once more than it should (the guard stops the NEXT
    // schedule, the callback guard stops the CURRENT firing from doing
    // anything observable if closingRef flipped true while it was pending).
    const guardCount = (bodySrc.match(/closingRef\?\.\s*current/g) || []).length;
    if (guardCount >= 2) {
      ok('D11b advance() checks closingRef?.current at both the schedule guard and the setTimeout callback body');
    } else {
      bad('D11b advance() guard', `expected closingRef?.current checked at 2+ sites inside advance(), found ${guardCount}`);
    }
  }
}

// ── D12. scroll/dismiss gesture grammar ─────────────────────────────────
{
  let startShould = null;
  walk(paperAst.program, (n) => {
    if (startShould) return;
    if (n.type === 'ObjectProperty' && n.key?.name === 'onStartShouldSetPanResponder') startShould = n.value;
  });
  const isBareFalse =
    startShould?.type === 'ArrowFunctionExpression' &&
    startShould.body?.type === 'BooleanLiteral' &&
    startShould.body.value === false;
  if (isBareFalse) {
    ok('D12a onStartShouldSetPanResponder is a literal `() => false` — never claims at touch-start');
  } else {
    bad(
      'D12a onStartShouldSetPanResponder',
      `expected a literal \`() => false\`, found: ${startShould ? paperSrc.slice(startShould.start, startShould.end) : 'not found — FAILS CLOSED'}`
    );
  }

  let captureFn = null;
  walk(paperAst.program, (n) => {
    if (captureFn) return;
    if (n.type === 'ObjectProperty' && n.key?.name === 'onMoveShouldSetPanResponderCapture') captureFn = n.value;
  });
  if (!captureFn) {
    bad('D12b onMoveShouldSetPanResponderCapture', 'not found — FAILS CLOSED');
  } else {
    const bodySrc = paperSrc.slice(captureFn.body.start, captureFn.body.end);
    const verticalDownGated = /g\.dy\s*>\s*6[\s\S]{0,80}return\s+scrollYRef\.current\s*<=\s*0/.test(bodySrc);
    if (verticalDownGated) {
      ok('D12b the vertical-down capture branch returns scrollYRef.current <= 0 — dismiss only claims from scroll-top');
    } else {
      bad('D12b vertical-down gate', `expected the vertical-down branch to return scrollYRef.current <= 0, body: ${bodySrc}`);
    }
  }
}

console.log(`\ncheck-comb-dive: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
