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
//
// R-CD-12/-13 addendum rows (2026-09-04) — same no-device scope: what a
// source probe can see of the bee-on-the-comb rider and the wax-tone repaint.
//
//   D13 `onCellFlight` (the tap-triggered flight launch) is positioned after
//       `openAt`'s empty-cell early return — unreachable when a tap resolves
//       to no stored entry (R-CD-12.5)
//   D14 `onFlightHome` is called from `close()` — the bee's return rides the
//       same single-commit funnel every dismiss path already goes through
//       (R-CD-12.4)
//   D15 both `onCellFlight` and `onFlightHome` are only reachable from the
//       `!reduced` branch of their respective functions — RM freeze doctrine
//       extends to the flight, not just the dive (R-CD-12.1)
//   D16 rest-state cell paint: fill is `washYellow` (not `accent`), stroke is
//       `glassHairline` at width 1 (not `ink` at 1.5), and the honey band
//       (`accentDeep`) is untouched — plus a Lab-chroma measurement proving
//       the honey band outranks the wax fill numerically, not just by name
//       (R-CD-13, acceptance row 13)
//   D17 `HiveDetail.js`'s `handleFlightHome` sets BOTH a new home `pollinate`
//       target AND a `canceledPollination` for the prior flight key — the
//       actual break-off mechanism early exit depends on (R-CD-12.4,
//       acceptance row 12), not just a queued retarget that would let an
//       in-flight errand finish first
//
// ── added 2026-09-04, Colin's private-hive pass ────────────────────────────
//
//   D18 the dive has an exit that is reachable in EVERY state: a control
//       labelled "Close", role=button, hit target >=44pt, NOT a descendant
//       of the ScrollView, routed through the same `onDismiss` funnel as the
//       swipe. Colin: "after zoom in there is no way to click out of it?"
//   D19 Android's hardware back closes the LETTER, not the hive —
//       subscribed only while a cell is open, routed through `close()`,
//       consumed, and torn down
//   D20 no raw `CELL_SIZE` survives in a geometry call now that the seat
//       size is fitted to the room; the unfitted reference layout is the one
//       licensed exception. (This row found a live scale-mixing bug in the
//       wax dolly the moment it was written.)
//   D21 the focus stroke is `paperInk(paper)` @2.5pt — `ink` measures 1.31:1
//       on evening paper — and fades with the chrome under motion while
//       holding static under RM, where there is no camera to get out of
//   D22 no style object carries BOTH `overflow: 'hidden'` and a
//       `theme.shadows.*` spread: on iOS `masksToBounds` clips the layer's
//       own drop shadow, so such a style declares a shadow that never draws
//   D23 THE DIVE IS SLOW ENOUGH TO READ. Runs `SPRINGS.diveIn` through RN's
//       own SpringConfig + SpringAnimation arithmetic and asserts the two
//       milestones the eye reads. The token used to carry a prose claim of
//       "~550ms" while the shipped spring finished the whole dive in 127ms;
//       a sentence about timing is not a timing check.
//   D23b D23 REPLICATES a dependency, so the replication itself gets
//       watched. Asserts the installed react-native version is the one the
//       arithmetic was transcribed from, lifts RN's own two origami
//       mappings out of SpringConfig.js and EVALUATES them against D23's
//       transcription, and holds the two onUpdate properties D23 leans on
//       silently: mass 1 on the tension/friction path, and a clock in
//       seconds. Without it an RN upgrade could move the mapping and D23
//       would keep printing confident milliseconds for a spring the device
//       no longer runs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { computeDiveDateRoll, MAX_VISIBLE_STEPS } from '../src/utils/combDiveDate.js';
import { theme } from '../src/constants/theme.js';
import { rgbToLab } from './lib/color.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const GRID = path.join(SRC, 'components/EntryCombGrid.js');
const PAPER = path.join(SRC, 'components/CombDivePaper.js');
const HOST = path.join(SRC, 'screens/HiveDetail.js');

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
const hostSrc = fs.readFileSync(HOST, 'utf8');
const gridAst = parseJs(gridSrc);
const paperAst = parseJs(paperSrc);
const hostAst = parseJs(hostSrc);
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
  // KEYED ON THE PAINT, NOT ON THE GEOMETRY CALL. This row used to require
  // the `hexHoneyPoints()` CALL to sit inside the `filled` guard, which was a
  // locator standing in for the claim: the call is pure arithmetic and paints
  // nothing, so hoisting it above the guard (as the vessel build does, to
  // share one height between three layers) reddened the row without changing
  // the behaviour by one pixel — while a genuinely leaked <Polygon> would
  // have been just as invisible to it in the other direction. What the row is
  // actually FOR is "an empty cell paints no honey", so it now walks the JSX
  // elements that carry the honey geometry and requires each of THOSE to be
  // inside a `filled` branch. Strictly stronger than the old shape: it covers
  // all three layers of the vessel plus the meniscus, not one call.
  const honeyGeomNames = new Set();
  walk(gridAst.program, (n) => {
    if (n.type !== 'VariableDeclarator' || !n.id?.name || n.init?.type !== 'CallExpression') return;
    if (['hexHoneyPoints', 'hexHoneyMeniscus'].includes(n.init.callee?.name)) honeyGeomNames.add(n.id.name);
  });
  const referencesHoney = (node) => {
    let hit = false;
    walk(node, (m) => {
      if (m.type === 'Identifier' && honeyGeomNames.has(m.name)) hit = true;
      if (m.type === 'CallExpression' && ['hexHoneyPoints', 'hexHoneyMeniscus'].includes(m.callee?.name)) hit = true;
    });
    return hit;
  };
  let found = false;
  walk(gridAst.program, (n) => {
    if (n.type !== 'JSXElement') return;
    const tag = n.openingElement?.name?.name;
    if (!['Polygon', 'Line'].includes(tag)) return;
    // Only the elements that actually carry honey geometry — the cell's own
    // hexPoints() outline and the focus stroke are not honey and must NOT be
    // required to sit under `filled`.
    if (!n.openingElement.attributes.some((a) => a.value && referencesHoney(a.value))) return;
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
    bad('D4 honey fill guarded by filled', 'no honey-bearing <Polygon>/<Line> found in EntryCombGrid.js — FAILS CLOSED (expected the rest-state honey vessel)');
  } else if (leaked) {
    bad('D4 honey fill guarded by filled', 'a honey-bearing element is not inside a `{filled …}` guard — an empty cell could paint honey');
  } else {
    ok('D4 every honey-bearing element renders only inside a `{filled …}` guard — an empty cell paints no honey');
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

// ── D13. onCellFlight is unreachable for an empty cell ──────────────────
{
  let openAtFn = null;
  walk(gridAst.program, (n) => {
    if (openAtFn) return;
    if (n.type === 'VariableDeclarator' && n.id?.name === 'openAt') openAtFn = unwrapCallback(n.init);
  });
  if (!openAtFn) {
    bad('D13 onCellFlight unreachable for an empty cell', 'no `const openAt = (...) => {...}` found in EntryCombGrid.js — FAILS CLOSED');
  } else {
    const bodySrc = gridSrc.slice(openAtFn.body.start, openAtFn.body.end);
    const guardIdx = bodySrc.search(/if\s*\(\s*!cell\.member\s*\)/);
    const flightIdx = bodySrc.indexOf('onCellFlight({');
    if (guardIdx === -1 || flightIdx === -1) {
      bad('D13 onCellFlight unreachable for an empty cell', `guardIdx=${guardIdx} flightIdx=${flightIdx} — FAILS CLOSED`);
    } else if (flightIdx > guardIdx) {
      ok("D13 onCellFlight is positioned after openAt's empty-cell early return — unreachable for an empty tap");
    } else {
      bad('D13 onCellFlight unreachable for an empty cell', 'onCellFlight appears before (or inside) the empty-cell early return');
    }
  }
}

// ── D14. onFlightHome fires from close() — the single dismiss funnel ────
{
  let closeFn = null;
  walk(gridAst.program, (n) => {
    if (closeFn) return;
    if (n.type === 'VariableDeclarator' && n.id?.name === 'close') closeFn = unwrapCallback(n.init);
  });
  if (!closeFn) {
    bad('D14 onFlightHome fires from close()', 'no `const close = (...) => {...}` found — FAILS CLOSED');
  } else {
    const bodySrc = gridSrc.slice(closeFn.body.start, closeFn.body.end);
    if (bodySrc.includes('onFlightHome?.(')) {
      ok('D14 close() calls onFlightHome?.() — the bee rides the same commit point every dismiss path funnels through');
    } else {
      bad('D14 onFlightHome fires from close()', 'no `onFlightHome?.(` call found inside close()');
    }
  }
}

// ── D15. onCellFlight/onFlightHome only reachable when !reduced ─────────
{
  let openAtFn = null;
  let closeFn = null;
  walk(gridAst.program, (n) => {
    if (n.type !== 'VariableDeclarator') return;
    if (n.id?.name === 'openAt') openAtFn = unwrapCallback(n.init);
    if (n.id?.name === 'close') closeFn = unwrapCallback(n.init);
  });
  // Present in the alternate (else) AND absent from the consequent (if) —
  // presence-in-else alone doesn't rule out a SECOND, mistaken call sitting
  // in the reduced branch too (a regex over the whole body can't tell the
  // difference; the branches have to be sliced apart to check both halves).
  const reducedElseGated = (fn, token) => {
    if (!fn) return false;
    let ifStmt = null;
    walk(fn.body, (n) => {
      if (ifStmt) return;
      if (n.type === 'IfStatement' && /^reduced$/.test(gridSrc.slice(n.test.start, n.test.end))) ifStmt = n;
    });
    if (!ifStmt?.alternate) return false;
    const consequentSrc = gridSrc.slice(ifStmt.consequent.start, ifStmt.consequent.end);
    const alternateSrc = gridSrc.slice(ifStmt.alternate.start, ifStmt.alternate.end);
    return !consequentSrc.includes(token) && alternateSrc.includes(token);
  };
  const openOk = reducedElseGated(openAtFn, 'onCellFlight({');
  const closeOk = reducedElseGated(closeFn, 'onFlightHome?.(');
  if (openOk && closeOk) {
    ok('D15 both onCellFlight and onFlightHome sit in the `!reduced` else-branch of their functions — RM freeze extends to the flight');
  } else {
    bad(
      'D15 RM guards onCellFlight/onFlightHome',
      `openAt's else-branch gates onCellFlight=${openOk}; close()'s else-branch gates onFlightHome=${closeOk}`
    );
  }
}

// ── D16. R-CD-13 rest-state paint — wax fill, hairline stroke, honey untouched ─
{
  // R-CD-13's tokens, read through the indirection the parity pass added
  // (2026-09-04): the seat's ground is now the entry's own paper, so cream is
  // `paperGround(paper) ?? theme.colors.washYellow` rather than a literal
  // `washYellow` in the JSX. The CLAIM is unchanged and is what is asserted —
  // a cream seat still rests on washYellow, the rest stroke is still the
  // hairline at 1pt, and the honey still spends accentDeep.
  const flat = gridCode.replace(/\s+/g, ' ');
  const fillOk = /paperGround\(paper\) \?\? theme\.colors\.washYellow/.test(flat);
  const strokeOk = /theme\.colors\.surfaceBorderStrong : theme\.colors\.glassHairline/.test(flat);
  const widthOk = /strokeWidth=\{seatOpen \? 1\.5 : 1\}/.test(flat);
  const honeyOk = /honeyHeightForLevel\(size, 1\)/.test(flat) && /fill=\{theme\.colors\.accentDeep\}/.test(flat);
  if (fillOk && strokeOk && widthOk && honeyOk) {
    ok('D16a cream seat rests on washYellow, rest stroke is glassHairline at width 1, honey spends accentDeep');
  } else {
    bad(
      'D16a rest-state paint tokens',
      `fillOk=${fillOk} strokeOk=${strokeOk} widthOk=${widthOk} honeyOk=${honeyOk}`
    );
  }

  // Acceptance row 13's literal criterion: honey band chroma > wax fill
  // chroma, measured (CIE Lab, C* = sqrt(a*a + b*b)), not just asserted by
  // token name — the two tokens could both be renamed without this failing
  // unless the actual pigments are compared.
  const chroma = (hex) => {
    const { a, b } = rgbToLab(hex);
    return Math.sqrt(a * a + b * b);
  };
  const honeyChroma = chroma(theme.colors.accentDeep);
  const waxChroma = chroma(theme.colors.washYellow);
  if (honeyChroma > waxChroma) {
    ok(`D16b honey band out-chromas the wax fill numerically (accentDeep C*=${honeyChroma.toFixed(2)} > washYellow C*=${waxChroma.toFixed(2)})`);
  } else {
    bad(
      'D16b honey band chroma > wax fill chroma',
      `accentDeep C*=${honeyChroma.toFixed(2)}, washYellow C*=${waxChroma.toFixed(2)} — the honey band no longer reads as the loudest thing in the cell`
    );
  }
}

// ── D17. HiveDetail's handleFlightHome performs a genuine break-off ─────
// R-CD-12.4's "he breaks off and returns by flight" needs BOTH halves: a new
// pollinate target (so he launches home) AND a cancel of the prior flight key
// (so an in-flight errand is interrupted rather than left to land first). One
// without the other is a documented weaker behaviour (see EntryCombGrid.js's
// onFlightHome comment) — this row asserts the stronger one shipped.
{
  let handleFlightHomeFn = null;
  walk(hostAst.program, (n) => {
    if (handleFlightHomeFn) return;
    if (n.type === 'VariableDeclarator' && n.id?.name === 'handleFlightHome') handleFlightHomeFn = unwrapCallback(n.init);
  });
  if (!handleFlightHomeFn) {
    bad('D17 handleFlightHome performs a genuine break-off', 'no `const handleFlightHome = (...) => {...}` found in HiveDetail.js — FAILS CLOSED');
  } else {
    const bodySrc = hostSrc.slice(handleFlightHomeFn.body.start, handleFlightHomeFn.body.end);
    const setsHome = /setPollinate\(/.test(bodySrc);
    const cancelsPrior = /setCanceledPollination\(/.test(bodySrc);
    if (setsHome && cancelsPrior) {
      ok('D17 handleFlightHome both retargets pollinate home AND cancels the prior flight key — a real break-off, not a queued retarget');
    } else {
      bad('D17 handleFlightHome performs a genuine break-off', `setsHome=${setsHome} cancelsPrior=${cancelsPrior}`);
    }
  }
}

// ── D18. the dive has an exit that is always reachable ──────────────────
{
  // Colin, 2026-09-04: "after zoom in there is no way to click out of it?"
  // The three paths that existed were a tap-out onto cells the paper covers,
  // a swipe armed only from the entry's own scroll-top, and a header button
  // that leaves the whole hive. This row is about the fourth: a visible
  // control that is reachable in EVERY state, which means it must not be a
  // descendant of the ScrollView (scrolling would eat it) and must route
  // through the same `onDismiss` funnel as the swipe rather than opening a
  // second exit mechanism.
  let closeEl = null;
  walk(paperAst.program, (n) => {
    if (n.type !== 'JSXElement') return;
    const attrs = n.openingElement?.attributes ?? [];
    const label = attrs.find(
      (a) => a.name?.name === 'accessibilityLabel' && a.value?.type === 'StringLiteral' && a.value.value === 'Close'
    );
    if (label) closeEl = n;
  });
  if (!closeEl) {
    bad('D18 dive has an always-reachable exit', 'no element with accessibilityLabel="Close" in CombDivePaper.js — FAILS CLOSED (the dive would have no visible way out)');
  } else {
    const attrs = closeEl.openingElement.attributes;
    const attrSrc = (name) => {
      const a = attrs.find((x) => x.name?.name === name);
      return a?.value ? paperSrc.slice(a.value.start, a.value.end) : null;
    };
    const roleOk = /button/.test(attrSrc('accessibilityRole') ?? '');
    const dismissOk = /onDismiss\s*\(/.test(attrSrc('onPress') ?? '');
    const slopRaw = attrSrc('hitSlop');
    // The hit target must reach 44pt however the slop is spelled — a literal
    // object, or (as here) a named constant. Resolve one level of identifier
    // back to its declaration so the row reads the NUMBER, not the spelling.
    let slopOk = false;
    if (slopRaw) {
      let slopSrc = slopRaw;
      const ident = slopRaw.replace(/[{}\s]/g, '');
      if (/^[A-Za-z_$][\w$]*$/.test(ident)) {
        const decl = paperSrc.match(new RegExp(`\\bconst\\s+${ident}\\s*=\\s*([^;]+);`));
        if (decl) slopSrc = decl[1];
      }
      // Slop is symmetric here; resolve the size constant the same way.
      const sizeM = paperSrc.match(/\bconst\s+CLOSE_SIZE\s*=\s*(\d+(?:\.\d+)?)\s*;/);
      const slopM = paperSrc.match(/\bconst\s+CLOSE_SLOP\s*=\s*\(\s*(\d+(?:\.\d+)?)\s*-\s*CLOSE_SIZE\s*\)\s*\/\s*2\s*;/);
      if (sizeM && slopM && /CLOSE_SLOP/.test(slopSrc)) slopOk = Number(slopM[1]) >= 44;
      else {
        const nums = (slopSrc.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
        const size = sizeM ? Number(sizeM[1]) : 0;
        slopOk = nums.length > 0 && size + 2 * Math.min(...nums) >= 44;
      }
    }
    // Not inside a ScrollView — the gate Fizz traced, checked structurally.
    const ancestors = findAncestors(paperAst.program, closeEl);
    const inScroll = ancestors.some(
      (a) => a.type === 'JSXElement' && a.openingElement?.name?.name === 'ScrollView'
    );
    if (roleOk && dismissOk && slopOk && !inScroll) {
      ok('D18 the dive exposes a "Close" button, role=button, hit target >=44pt, outside the ScrollView, routed through onDismiss');
    } else {
      bad(
        'D18 dive has an always-reachable exit',
        `role=${roleOk} routesThroughOnDismiss=${dismissOk} hitTarget44=${slopOk} insideScrollView=${inScroll}`
      );
    }
  }
}

// ── D19. Android back closes the LETTER, not the hive ───────────────────
{
  // Without this the system back gesture fell through to the navigator and
  // popped the whole screen — the same wrong-scope exit as the header
  // button, except a gesture gives the user nothing to look at first.
  let effect = null;
  walk(gridAst.program, (n) => {
    if (n.type !== 'CallExpression') return;
    const callee = n.callee;
    const isEffect =
      callee?.name === 'useEffect' || (callee?.object?.name === 'React' && callee?.property?.name === 'useEffect');
    if (!isEffect) return;
    const body = n.arguments[0];
    if (!body) return;
    const src = gridSrc.slice(body.start, body.end);
    if (/hardwareBackPress/.test(src)) effect = { node: n, src, deps: n.arguments[1] };
  });
  if (!effect) {
    bad('D19 Android back closes the dive', 'no useEffect subscribing to hardwareBackPress in EntryCombGrid.js — FAILS CLOSED');
  } else {
    // Gated on an open cell (so back means what it always meant elsewhere),
    // routed through close() (the single dismiss funnel D14 also guards),
    // handled (returns true) and torn down.
    const gated = /if\s*\(\s*!openCell\s*\)\s*return/.test(effect.src);
    const routed = /\bclose\s*\(\s*\)/.test(effect.src);
    const handled = /return\s+true/.test(effect.src);
    const removed = /\.remove\s*\(\s*\)/.test(effect.src);
    const depsSrc = effect.deps ? gridSrc.slice(effect.deps.start, effect.deps.end) : '';
    const depsOk = /\bopenCell\b/.test(depsSrc) && /\bclose\b/.test(depsSrc);
    if (gated && routed && handled && removed && depsOk) {
      ok('D19 hardwareBackPress is subscribed only while a cell is open, routed through close(), consumed, and torn down');
    } else {
      bad(
        'D19 Android back closes the dive',
        `gatedOnOpenCell=${gated} routesThroughClose=${routed} consumesEvent=${handled} unsubscribes=${removed} deps=${depsOk}`
      );
    }
  }
}

// ── D20. no raw CELL_SIZE survives in the fitted geometry ───────────────
{
  // The comb's seat size stopped being the constant and became a value
  // fitted to the room. Every geometry consumer therefore has to read the
  // FITTED size — a single surviving `CELL_SIZE` in a geometry call is a
  // lattice drawn at one scale and measured at another, which is exactly the
  // clipping bug this pass exists to fix, reintroduced silently.
  const GEOMETRY_FNS = ['buildCombLayout', 'cellCentre', 'ringStepFor', 'hexPoints', 'hexHoneyPoints', 'hexHoneyMeniscus', 'honeyHeightForLevel'];
  const offenders = [];
  walk(gridAst.program, (n) => {
    if (n.type !== 'CallExpression' || !GEOMETRY_FNS.includes(n.callee?.name)) return;
    for (const arg of n.arguments) {
      walk(arg, (m) => {
        if (m.type === 'Identifier' && m.name === 'CELL_SIZE') {
          offenders.push(`${n.callee.name}() at line ${n.loc.start.line}`);
        }
      });
    }
  });
  // The nominal layout is the ONE licensed use: it is the unfitted reference
  // the ratio is computed FROM, so it must be measured at CELL_SIZE.
  const licensed = offenders.filter((o) => {
    const line = Number(o.match(/line (\d+)/)[1]);
    const text = gridSrc.split('\n')[line - 1] ?? '';
    return /\bnominal\b/.test(text);
  });
  const leaked = offenders.filter((o) => !licensed.includes(o));
  if (leaked.length === 0) {
    ok(`D20 every geometry call reads the fitted cell size (${licensed.length} licensed CELL_SIZE use for the unfitted reference layout)`);
  } else {
    bad('D20 fitted cell size reaches all geometry', `raw CELL_SIZE still reaches: ${leaked.join(', ')}`);
  }
}

// ── D21. the focus stroke is paper-aware and leaves with the chrome ─────
{
  // Lumen measured `ink` on `paperEvening` at 1.31:1 — invisible. A flat ink
  // focus stroke would leave the dived-into seat unmarked on exactly the
  // moodiest entries, so the colour is the paper's own ink. And it FADES
  // rather than riding the camera to ~6pt, except under reduced motion where
  // there is no camera and the stroke is the only thing naming the seat.
  const flat = gridCode.replace(/\s+/g, ' ');
  const strokeDecl = /stroke=\{ink\}\s*strokeWidth=\{2\.5\}/.test(flat);
  const inkFromPaper = /const ink = paperInk\(paper\)/.test(flat);
  const fadesOnChromeDim = /focusStrokeOpacity =\s*openCell && !reduced\s*\?\s*dive\.interpolate\(\{ inputRange: \[0, CHROME_DIM_END\]/.test(flat);
  const holdsUnderRm = /focusStrokeOpacity \?[\s\S]{0,400}?: \(\s*<Polygon points=\{hexPoints\(size\)\} fill="none" stroke=\{ink\} strokeWidth=\{2\.5\} \/>/.test(flat);
  if (strokeDecl && inkFromPaper && fadesOnChromeDim && holdsUnderRm) {
    ok('D21 focus stroke is paperInk(paper) @2.5pt, fades with the chrome under motion, and holds as a static stroke under RM');
  } else {
    bad(
      'D21 focus stroke paper-aware and chrome-timed',
      `stroke=${strokeDecl} inkFromPaper=${inkFromPaper} fades=${fadesOnChromeDim} rmStatic=${holdsUnderRm}`
    );
  }
}

// ── D22. no style both clips and casts a shadow ─────────────────────────
{
  // On iOS `overflow: 'hidden'` sets the layer's `masksToBounds`, which
  // clips the layer's OWN drop shadow away. A style carrying both is a
  // shadow that is declared and never drawn — which is what `styles.paper`
  // had been doing since it shipped. Structural, both files, so the next
  // person to merge the two nodes back together gets told.
  const offenders = [];
  for (const [file, ast, src] of [['EntryCombGrid.js', gridAst, gridSrc], ['CombDivePaper.js', paperAst, paperSrc]]) {
    walk(ast.program, (n) => {
      if (n.type !== 'ObjectProperty' || n.value?.type !== 'ObjectExpression') return;
      const body = src.slice(n.value.start, n.value.end);
      const clips = /overflow:\s*'hidden'/.test(body);
      const shadows = /\.\.\.theme\.shadows\./.test(body);
      if (clips && shadows) offenders.push(`${file}: styles.${n.key?.name ?? '?'}`);
    });
  }
  if (offenders.length === 0) {
    ok('D22 no style object carries both `overflow: hidden` and a theme.shadows.* spread — every declared shadow can actually render');
  } else {
    bad('D22 clip and shadow are on separate nodes', `masksToBounds would erase the shadow on: ${offenders.join(', ')}`);
  }
}

// ── the transcription D23 and D23b share ─────────────────────────────────
// ONE WRITER, on Lumen's amendment. These two functions are this file's
// copy of react-native's `stiffnessFromOrigamiValue` and
// `dampingFromOrigamiValue`. D23 runs the shipped token through them to get
// the milestone milliseconds; D23b probes RN's real mappings against them.
// They were briefly two copies, one per row, and that is a defect the pair
// cannot catch between them: D23b compares RN to ITS OWN literals, so an
// edit to D23's copy alone is invisible in every direction, and D23's bands
// are wide enough (354ms inside 250 to 900) for a wrong coefficient to ride
// in band while the row prints confident milliseconds about a spring the
// device never ran. Hoisted, an edit to the transcription is an edit to the
// probed object by construction.
const springStiffnessFromOrigami = (tension) => (tension - 30) * 3.62 + 194;
const springDampingFromOrigami = (friction) => (friction - 8) * 3 + 25;

// ── D23. the dive is slow enough to read ────────────────────────────────
{
  // THE ROW COLIN'S COMPLAINT EARNED. `SPRINGS.diveIn` carried the note
  // "camera reads ~0.55 by ~550ms" and the shipped spring finished the whole
  // dive in 127ms — a stated duration that had drifted 8x with nothing
  // watching it. A prose claim about timing is not a timing check, so this
  // row runs the token through RN's own pipeline and asserts the number.
  //
  // Replicates react-native/Libraries/Animated/SpringConfig.js, through the
  // hoisted `springStiffnessFromOrigami`/`springDampingFromOrigami` pair
  // above with mass 1, plus the closed-form solution in
  // SpringAnimation.onUpdate. Not an approximation of a spring, the same
  // arithmetic the device runs. The coefficients are deliberately NOT
  // restated here: D23b holds that pair against the real module, and a
  // number repeated in prose is a copy nothing checks.
  const motionSrc = fs.readFileSync(path.join(ROOT, 'src/constants/motion.js'), 'utf8');
  const m = motionSrc.match(/\bdiveIn:\s*\{\s*friction:\s*(\d+(?:\.\d+)?)\s*,\s*tension:\s*(\d+(?:\.\d+)?)\s*\}/);
  if (!m) {
    bad('D23 the dive is slow enough to read', 'could not read SPRINGS.diveIn from motion.js — FAILS CLOSED');
  } else {
    const friction = Number(m[1]);
    const tension = Number(m[2]);
    const k = springStiffnessFromOrigami(tension);
    const c = springDampingFromOrigami(friction);
    const zeta = c / (2 * Math.sqrt(k));
    const w0 = Math.sqrt(k);
    const w1 = w0 * Math.sqrt(Math.max(0, 1 - zeta * zeta));
    const at = (t) => {
      if (zeta < 1) {
        const e = Math.exp(-zeta * w0 * t);
        return 1 - e * ((zeta * w0 / w1) * Math.sin(w1 * t) + Math.cos(w1 * t));
      }
      const e = Math.exp(-w0 * t);
      return 1 - e * (1 + w0 * t);
    };
    const cross = (v) => {
      for (let ms = 0; ms <= 6000; ms += 0.5) if (at(ms / 1000) >= v) return ms;
      return null;
    };
    // The two milestones the EYE reads, both derived from the shipped
    // interpolations rather than from the driver's own 0..1:
    //   paper opaque = PAPER_START + 0.07, where `paperOpacity` reaches 1 —
    //     the last frame of the zoom anyone can see;
    //   paper full   = dive 0.99, where `paperScale`'s 0.5->1 growth lands.
    const opaque = cross(0.52);
    const full = cross(0.99);
    // Floors, not targets. A band rather than a pinned number so a future
    // taste change can move the feel without editing the gate — but a
    // regression to the 66ms/127ms cut reds it, which is the point.
    const OPAQUE_FLOOR = 100;
    const FULL_FLOOR = 250;
    const FULL_CEILING = 900;
    if (opaque !== null && full !== null && opaque >= OPAQUE_FLOOR && full >= FULL_FLOOR && full <= FULL_CEILING) {
      ok(`D23 dive reads at human speed — zoom visible for ${Math.round(opaque)}ms (floor ${OPAQUE_FLOOR}), paper settles at ${Math.round(full)}ms (band ${FULL_FLOOR}-${FULL_CEILING})`);
    } else {
      bad(
        'D23 the dive is slow enough to read',
        `SPRINGS.diveIn {friction:${friction}, tension:${tension}} -> zoom visible ${opaque === null ? 'never' : Math.round(opaque) + 'ms'} (floor ${OPAQUE_FLOOR}ms), paper settles ${full === null ? 'never' : Math.round(full) + 'ms'} (band ${FULL_FLOOR}-${FULL_CEILING}ms)`
      );
    }
  }
}

// ── D23b. the arithmetic D23 transcribed is still the arithmetic RN runs ──
// Lumen's rider on the hive-room ratification. D23 does not observe a
// spring, it REPLICATES one: it re-implements
// react-native/Libraries/Animated/SpringConfig.js and the closed form in
// SpringAnimation.onUpdate. That makes the row's verdict a claim about a
// dependency's internals, and a dependency's internals move on someone
// else's schedule. Without this row an RN upgrade could change the mapping
// and D23 would keep printing confident millisecond figures for a spring
// the device no longer runs.
//
// Three things are asserted, in increasing strength:
//   1. the INSTALLED react-native version is the one D23 was measured
//      against, read out of node_modules rather than out of the root
//      package.json, because the root file states an intent and
//      node_modules states what actually ran. Same instrument as
//      check-link-parse-differential's V1.
//   2. RN's own two origami mappings, lifted out of SpringConfig.js and
//      EVALUATED, agree with D23's transcription at the shipped token and
//      at a spread of probe values. Behaviour rather than text for the
//      ARITHMETIC: an algebraic refactor or a reformat that preserves the
//      numbers stays green, a changed coefficient reds. The lift is
//      name-keyed, so a RENAMED mapping also reds, with "could not lift".
//      That is the correct failing shape, not a false positive: the row
//      has lost its referent and must not imply the comparison still holds.
//   3. the two properties of SpringAnimation.onUpdate that D23's `at(t)`
//      silently depends on: mass is 1 on the tension/friction path, and
//      the integrator's clock is in seconds. D23 calls `at(ms / 1000)`.
//      If RN ever switched that division the milestone numbers would be
//      wrong by three orders of magnitude and every floor here would pass.
//
// FAILS CLOSED. If node_modules is absent this row reports a failed
// assertion rather than skipping: a gate that cannot do the measurement
// must not imply the measurement still holds.
{
  const RN_DIR = path.join(ROOT, 'node_modules/react-native');
  const MEASURED_VERSION = '0.86.2';
  const problems = [];
  let evaluated = 0;

  const springConfigPath = path.join(RN_DIR, 'Libraries/Animated/SpringConfig.js');
  const springAnimPath = path.join(RN_DIR, 'Libraries/Animated/animations/SpringAnimation.js');
  const pkgPath = path.join(RN_DIR, 'package.json');

  if (!fs.existsSync(pkgPath) || !fs.existsSync(springConfigPath) || !fs.existsSync(springAnimPath)) {
    problems.push(
      `react-native is not installed under ${path.relative(ROOT, RN_DIR)}. Run \`npm ci\` first. ` +
        'This row compares D23 against the real module and has nothing to compare without it.'
    );
  } else {
    const installed = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
    if (installed !== MEASURED_VERSION) {
      problems.push(
        `installed react-native is ${installed}, D23's arithmetic was transcribed from ${MEASURED_VERSION}. ` +
          'Not automatically a defect: re-read SpringConfig.js and SpringAnimation.onUpdate, ' +
          'confirm or fix D23, and bump MEASURED_VERSION in the same commit.'
      );
    }

    // Lift a named function out of the Flow source and make it callable.
    // The bodies of the two origami mappings are plain arithmetic with no
    // annotations inside them, so only the signature has to be parsed.
    const lift = (src, name) => {
      const at = src.indexOf(`function ${name}(`);
      if (at < 0) return null;
      const open = src.indexOf('{', at);
      if (open < 0) return null;
      const param = /\(\s*([A-Za-z_$][\w$]*)/.exec(src.slice(at + `function `.length, open));
      if (!param) return null;
      let depth = 0;
      for (let j = open; j < src.length; j += 1) {
        if (src[j] === '{') depth += 1;
        else if (src[j] === '}') {
          depth -= 1;
          if (depth === 0) {
            try {
              // eslint-disable-next-line no-new-func
              return new Function(param[1], src.slice(open + 1, j));
            } catch {
              return null;
            }
          }
        }
      }
      return null;
    };

    const configSrc = fs.readFileSync(springConfigPath, 'utf8');
    const rnStiffness = lift(configSrc, 'stiffnessFromOrigamiValue');
    const rnDamping = lift(configSrc, 'dampingFromOrigamiValue');

    // The shipped token first, then a spread wide enough that a changed
    // slope or intercept cannot hide inside a single sample.
    const probeSrc = fs.readFileSync(path.join(SRC, 'constants/motion.js'), 'utf8');
    const shipped = probeSrc.match(/\bdiveIn:\s*\{\s*friction:\s*(\d+(?:\.\d+)?)\s*,\s*tension:\s*(\d+(?:\.\d+)?)\s*\}/);
    const probes = [0, 1, 8, 30, 40, 100, 200];
    if (shipped) probes.unshift(Number(shipped[1]), Number(shipped[2]));

    for (const [label, theirs, mine] of [
      ['stiffnessFromOrigamiValue', rnStiffness, springStiffnessFromOrigami],
      ['dampingFromOrigamiValue', rnDamping, springDampingFromOrigami],
    ]) {
      if (!theirs) {
        problems.push(`could not lift \`${label}\` out of SpringConfig.js; the mapping moved or was renamed`);
        continue;
      }
      for (const v of probes) {
        const a = theirs(v);
        const b = mine(v);
        if (!Number.isFinite(a) || Math.abs(a - b) > 1e-9) {
          problems.push(`${label}(${v}) is ${a} in react-native, D23 transcribes it as ${b}`);
        } else {
          evaluated += 1;
        }
      }
    }

    // The two onUpdate properties D23 leans on without naming them.
    const animSrc = fs.readFileSync(springAnimPath, 'utf8');
    const secondsClock = /this\._frameTime\s*\+=\s*deltaTime;/.test(animSrc)
      && /const deltaTime\s*=\s*\(now - this\._lastTime\)\s*\/\s*1000;/.test(animSrc);
    if (!secondsClock) {
      problems.push(
        "SpringAnimation.onUpdate no longer accumulates `_frameTime` from a milliseconds/1000 delta, " +
          "D23 calls `at(ms / 1000)` on that assumption"
      );
    }
    // `Animated.spring` is called here with friction/tension only, so the
    // origami branch is the one that runs and it is the one that has to
    // still set mass to 1. Resolved to that branch rather than tested for
    // containment: `this._mass = 1;` also appears in the bounciness/speed
    // branch, so a whole-file grep would stay green with the branch D23
    // actually runs on set to any mass at all.
    const originAt = animSrc.indexOf('SpringConfig.fromOrigamiTensionAndFriction(');
    let branchSrc = null;
    if (originAt >= 0) {
      let depth = 0;
      for (let j = originAt; j < animSrc.length; j += 1) {
        if (animSrc[j] === '{') depth += 1;
        else if (animSrc[j] === '}') {
          if (depth === 0) {
            branchSrc = animSrc.slice(originAt, j);
            break;
          }
          depth -= 1;
        }
      }
    }
    if (branchSrc === null) {
      problems.push(
        'could not resolve the branch of SpringAnimation that calls ' +
          '`SpringConfig.fromOrigamiTensionAndFriction`, which is the only path a ' +
          'friction/tension token takes'
      );
    } else if (!/this\._mass\s*=\s*1;/.test(branchSrc)) {
      problems.push(
        'the origami tension/friction branch of SpringAnimation no longer sets `_mass = 1`, ' +
          "and D23's closed form assumes mass 1"
      );
    }
  }

  if (problems.length === 0) {
    ok(
      `D23b D23's spring arithmetic still matches react-native ${MEASURED_VERSION}: ` +
        `both origami mappings evaluated out of SpringConfig.js and agreeing at ${evaluated} probe values, ` +
        'seconds clock and mass 1 both still in onUpdate'
    );
  } else {
    bad('D23b the transcribed spring arithmetic is still RN\'s', problems.join('; '));
  }
}

console.log(`\ncheck-comb-dive: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
