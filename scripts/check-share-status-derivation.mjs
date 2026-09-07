// Gate for `alreadySharedToday`'s eight conjuncts (HoneycombTab.js), ruled
// end-to-end by Lumen (consolidated 2026-09-07T20:49:11Z,
// published top-level and restated in-thread at 3d3e3d44 / 8a4cefc3 after
// Vector traced the ruling to the wrong container) and by Vector's own
// ledger message (event a217ac44), against `fizz/eng104-honeycomb-regroup`
// @ be75fe2.
//
//   npm run check:share-status-derivation
//   node scripts/run-mutations.mjs scripts/check-share-status-derivation.mjs
//
// WHY THIS EXISTS
//
// ENG-104's fold-in (Pixel's find) moved `alreadySharedToday`'s only
// PRODUCER into a `useFocusEffect` with empty deps, then had to add a
// second producer at the point of a successful share — `loadAll` no longer
// touches this state, so `handleShareToday` sets it directly from the write
// it just made (`:788`), rather than by re-reading. That is four separate
// claims doing work at once (an argument, an order, a derivation, two
// fail-open defaults) and no single "does it render right" smoke test
// distinguishes any one of them from the others going wrong. Each gets its
// own row so a future edit that breaks exactly one of them reds exactly one
// row, never a chorus.
//
// WHAT IT ASSERTS, ROW BY ROW (row id, ledger item)
//
//   argument       (1)  — the write-confirmed flip passes literal `true`.
//   ordering       (2)  — that flip fires AFTER `shareEntry` resolves, never
//                          hoisted above the await (an optimistic flip that
//                          survives a failed write).
//   derivation     (3)  — the focus-effect's read derives from
//                          `HoneycombStore.hasSharedDate(...)`, not a bare
//                          literal — a share made yesterday must not read as
//                          shared today.
//   failOpenInner  (4a) — a failed share-status READ (the entry loaded fine)
//                          defaults to `false`, never `true`. `true` here
//                          hides the share door behind a read failure the
//                          user cannot see or retry past.
//   failOpenOuter  (4b) — a failed entry READ carries the same default,
//                          same reasoning, independent code path.
//   vacuity        (5)  — the render site and the producer site name the
//                          SAME state. Anchored off `handleShareToday`'s own
//                          call (never a hardcoded literal), so a rename
//                          that moves the declaration and all four setter
//                          call sites but misses the render ternary reds
//                          HERE — the only row that would notice, since
//                          every other row is keyed on structure, not on
//                          the identifier's spelling.
//   initialOffer   (6)  — mount-time default is `false`. `true` would open
//                          every cold render already claiming today is
//                          spent, before either effect has run.
//   cardinality    (7)  — exactly four call sites. Lumen's rider: R-SHARE-1
//                          (queued, `:792`'s silent `console.warn`) is a
//                          KNOWN future fifth producer — when it lands, this
//                          row's expected count moves to 5 in the SAME
//                          commit that adds the write, per her ruling that
//                          "the repair commit extends the classified set."
//                          Bumping the constant below with no accompanying
//                          producer is exactly the silent-widening this row
//                          exists to catch, same as raising it without one.
//
// Anchors are exact, unique substrings (verified once per run, never
// assumed) — the same discipline `run-mutations.mjs` applies to a
// mutation's own `from`. A non-unique or missing anchor is a harness
// failure, not a guess at the first match.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = 'src/screens/HoneycombTab.js';
const filePath = path.join(ROOT, FILE);
const src = readFileSync(filePath, 'utf8');

// Known-good census, per row `cardinality`'s own comment above.
const EXPECTED_SETTER_CALL_COUNT = 4;

let pass = 0;
const failures = [];
const ok = (label) => {
  pass += 1;
  console.log(`  ok   ${label}`);
};
const bad = (row, detail) => {
  failures.push(`${row} — ${detail}`);
  console.log(`  FAIL ${row} — ${detail}`);
};

// --- anchor plumbing -------------------------------------------------------

const mustFindOne = (text, needle, label) => {
  const first = text.indexOf(needle);
  if (first === -1) throw new Error(`harness: anchor not found — ${label}: ${JSON.stringify(needle)}`);
  const second = text.indexOf(needle, first + 1);
  if (second !== -1) throw new Error(`harness: anchor is not unique — ${label}: ${JSON.stringify(needle)}`);
  return first;
};

const between = (text, startNeedle, endNeedle, label) => {
  const s = mustFindOne(text, startNeedle, `${label} (start)`);
  const from = s + startNeedle.length;
  const e = text.indexOf(endNeedle, from);
  if (e === -1) throw new Error(`harness: end anchor not found after start — ${label}: ${JSON.stringify(endNeedle)}`);
  return text.slice(from, e);
};

// A "bool-literal setter call" is the structural shape every one of these
// four sites shares: `identifier(true)` or `identifier(false)`, no other
// arguments. It is how rows below find their target WITHOUT assuming the
// identifier's name — the one property row `vacuity` exists to check on
// purpose, everywhere else, is deliberately not re-checked by accident.
const BOOL_CALL = /([A-Za-z_$][\w$]*)\((true|false)\)/g;

const findBoolCalls = (text) => {
  const out = [];
  for (const m of text.matchAll(BOOL_CALL)) {
    out.push({ index: m.index, name: m[1], value: m[2] });
  }
  return out;
};

// --- discovery: handleShareToday (rows: argument, ordering) ----------------

const HANDLE_SHARE_START = 'const handleShareToday = async () => {';
// Deliberately NOT anchored on the catch body's `console.warn` text: that
// exact line is row `cardinality`'s own mutation target (ledger item 7
// substitutes it with a state write). An anchor built from a line a
// mutation rewrites would make THIS discovery step throw instead of
// producing a graceful FAIL, on exactly the run meant to exercise it.
const HANDLE_SHARE_TRY_END = 'await loadAll({ suppressArrival: true });\n    } catch (err) {';
const SHARE_AWAIT = 'await HoneycombStore.shareEntry(';

const handleShareBody = between(src, HANDLE_SHARE_START, HANDLE_SHARE_TRY_END, 'handleShareToday body');
const awaitIndex = mustFindOne(handleShareBody, SHARE_AWAIT, 'shareEntry await inside handleShareToday');
// Scoped to the try block ONLY (`setSharing(true)` sits before it, guarding
// re-entry — a real bool-literal call with nothing to do with this state).
// `ordering`'s whole job is to notice the target call move to the OTHER
// side of the await, so the scope has to reach on both sides of it, not
// start there.
const shareTryStart = handleShareBody.indexOf('try {');
if (shareTryStart === -1) throw new Error('harness: could not find handleShareToday\'s try block');
const shareCalls = findBoolCalls(handleShareBody.slice(shareTryStart)).map((c) => ({ ...c, index: c.index + shareTryStart }));

let setterName = null;
if (shareCalls.length !== 1) {
  bad(
    'argument',
    `expected exactly one bool-literal setter call inside handleShareToday, found ${shareCalls.length} (${shareCalls
      .map((c) => `${c.name}(${c.value})@${c.index}`)
      .join(', ')})`
  );
  bad(
    'ordering',
    `expected exactly one bool-literal setter call inside handleShareToday, found ${shareCalls.length} — cannot judge its position relative to the shareEntry await`
  );
} else {
  const [call] = shareCalls;
  setterName = call.name;

  if (call.value === 'true') {
    ok(`argument — handleShareToday's write-confirmed flip (${call.name}) passes literal true`);
  } else {
    bad('argument', `handleShareToday's flip passes literal ${call.value}, not true — a successful share would not close the share door`);
  }

  if (call.index > awaitIndex) {
    ok(`ordering — ${call.name}(${call.value}) fires after the shareEntry await resolves, not before it`);
  } else {
    bad(
      'ordering',
      `${call.name}(${call.value}) fires BEFORE the shareEntry await (index ${call.index} <= ${awaitIndex}) — an optimistic flip that survives a rejected write`
    );
  }
}

// --- discovery: the focus effect (rows: derivation, failOpenInner, failOpenOuter) ---

const INNER_TRY_COMMENT = 'Independent try/catch, not folded into the read above';
const OUTER_CATCH_START = "} catch (err) {\n          // requireUserId (EntryStore.js) throws 'Not signed in'";
const OUTER_CATCH_END = 'if (!cancelled) setEntryLoading(false);';

// The inner try/catch sits between its own naming comment and the outer
// catch's own naming comment — both unique, both load-bearing landmarks
// rather than code this gate would otherwise have to parse structurally.
const innerBlock = between(src, INNER_TRY_COMMENT, OUTER_CATCH_START, 'inner try/catch (share-status read)');
const innerTryEnd = innerBlock.indexOf('} catch (err) {');
if (innerTryEnd === -1) throw new Error('harness: could not find the inner catch boundary inside the share-status read block');
const innerTryBody = innerBlock.slice(0, innerTryEnd);
const innerCatchBody = innerBlock.slice(innerTryEnd);

if (setterName) {
  const derivationCalls = findBoolCalls(innerTryBody).filter((c) => c.name === setterName);
  const literalDerivation = new RegExp(`${setterName}\\(\\s*(true|false)\\s*\\)`).exec(innerTryBody);
  const hasTernaryToHasSharedDate =
    innerTryBody.includes(`${setterName}(`) &&
    innerTryBody.includes('HoneycombStore.hasSharedDate(') &&
    innerTryBody.includes('?') &&
    innerTryBody.includes(':');

  if (hasTernaryToHasSharedDate && !literalDerivation) {
    ok(`derivation — the focus-effect read derives ${setterName} from HoneycombStore.hasSharedDate(...), not a bare literal`);
  } else if (literalDerivation) {
    bad(
      'derivation',
      `${setterName} is set from a bare literal (${literalDerivation[1]}) in the focus effect, not from HoneycombStore.hasSharedDate(...) — a share made on a previous day would misreport`
    );
  } else {
    bad('derivation', `could not find a ${setterName}(...) call deriving from HoneycombStore.hasSharedDate(...) in the focus effect's try body`);
  }
  void derivationCalls; // kept for future widening; not asserted on directly.

  const innerCatchCalls = findBoolCalls(innerCatchBody).filter((c) => c.name === setterName);
  if (innerCatchCalls.length !== 1) {
    bad('failOpenInner', `expected exactly one ${setterName}(...) call in the inner catch, found ${innerCatchCalls.length}`);
  } else if (innerCatchCalls[0].value === 'false') {
    ok(`failOpenInner — a failed share-status read defaults ${setterName} to false`);
  } else {
    bad('failOpenInner', `a failed share-status read defaults ${setterName} to ${innerCatchCalls[0].value}, not false — a read failure would hide the share door`);
  }

  const outerCatchBody = between(src, OUTER_CATCH_START, OUTER_CATCH_END, 'outer catch (entry read)');
  const outerCatchCalls = findBoolCalls(outerCatchBody).filter((c) => c.name === setterName);
  if (outerCatchCalls.length !== 1) {
    bad('failOpenOuter', `expected exactly one ${setterName}(...) call in the outer catch, found ${outerCatchCalls.length}`);
  } else if (outerCatchCalls[0].value === 'false') {
    ok(`failOpenOuter — a failed entry read defaults ${setterName} to false`);
  } else {
    bad('failOpenOuter', `a failed entry read defaults ${setterName} to ${outerCatchCalls[0].value}, not false — a read failure would hide the share door`);
  }
} else {
  bad('derivation', 'no setter identified from handleShareToday — see row argument/ordering');
  bad('failOpenInner', 'no setter identified from handleShareToday — see row argument/ordering');
  bad('failOpenOuter', 'no setter identified from handleShareToday — see row argument/ordering');
}

// --- discovery: the useState declaration (rows: vacuity, initialOffer) -----

// Read, never derived: a naming convention (strip `set`, lowercase the
// first letter) can hold even when the declared name and the setter have
// drifted apart, if whoever renamed one also renamed the other consistently
// everywhere but the render site — which is exactly the shape a careless
// rename takes. Reading the actual pairing from the `useState` call is the
// only way `vacuity` asserts the binding rather than the spelling habit.
let declaredStateName = null;
let declInitialValue = null;
if (setterName) {
  const declRe = new RegExp(`const \\[([A-Za-z_$][\\w$]*), ${setterName}\\] = useState\\((true|false)\\);`);
  const declMatch = declRe.exec(src);
  if (declMatch) {
    declaredStateName = declMatch[1];
    declInitialValue = declMatch[2];
  }
}

// --- row: vacuity — render site and producer site name the same binding ----

// Deliberately NOT anchored on the literal "alreadySharedToday": `setterName`
// came from handleShareToday's own call, structurally, and `declaredStateName`
// came from the useState declaration those calls pair with, also structurally.
// A rename that moves the declaration and all four setter sites but misses
// this render ternary is exactly what this row exists to catch — every other
// row above is blind to it, because none of them read the identifier's
// spelling either.
const RENDER_ANCHOR = 'PrimaryButton onPress={handleShareToday}';
const renderAnchorIndex = mustFindOne(src, RENDER_ANCHOR, 'share-door render site');
const beforeRender = src.slice(Math.max(0, renderAnchorIndex - 200), renderAnchorIndex);
const ternaryMatches = [...beforeRender.matchAll(/!([A-Za-z_$][\w$]*)\s*\?\s*\(/g)];
const renderTernary = ternaryMatches.length ? ternaryMatches[ternaryMatches.length - 1] : null;

if (!setterName) {
  bad('vacuity', 'no setter identified from handleShareToday — see row argument/ordering');
} else if (!declaredStateName) {
  bad('vacuity', `could not find the useState declaration pairing a state with setter ${setterName}`);
} else if (!renderTernary) {
  bad('vacuity', `could not find a "!<name> ? (" ternary immediately before ${JSON.stringify(RENDER_ANCHOR)}`);
} else {
  const renderName = renderTernary[1];
  if (renderName === declaredStateName) {
    ok(`vacuity — the share-door render reads ${renderName}, the same binding handleShareToday writes via ${setterName} (declared as [${declaredStateName}, ${setterName}])`);
  } else {
    bad(
      'vacuity',
      `the share-door render reads ${renderName}, but the useState declaration pairs ${setterName} with ${declaredStateName} — declaration and render have drifted apart`
    );
  }
}

// --- row: initialOffer — mount-time default ---------------------------------

if (setterName && declaredStateName) {
  if (declInitialValue === 'false') {
    ok(`initialOffer — ${setterName}'s useState initializer is false`);
  } else {
    bad('initialOffer', `${setterName}'s useState initializer is ${declInitialValue}, not false — every cold render would open already claiming today is spent`);
  }
} else if (setterName) {
  bad('initialOffer', `could not find the useState declaration pairing a state with setter ${setterName}`);
} else {
  bad('initialOffer', 'no setter identified from handleShareToday — see row argument/ordering');
}

// --- row: cardinality — population count ------------------------------------

if (setterName) {
  const callCount = (src.match(new RegExp(`${setterName}\\(`, 'g')) || []).length;
  if (callCount === EXPECTED_SETTER_CALL_COUNT) {
    ok(`cardinality — ${setterName} is called at exactly ${EXPECTED_SETTER_CALL_COUNT} sites`);
  } else {
    bad(
      'cardinality',
      `${setterName} is called at ${callCount} sites, expected ${EXPECTED_SETTER_CALL_COUNT} — a new producer needs a ruling (R-SHARE-1) and a bumped constant in the same commit, never one alone`
    );
  }
} else {
  bad('cardinality', 'no setter identified from handleShareToday — see row argument/ordering');
}

// The verdict prints AFTER the mutation ledger below, not here — but the
// ledger's own anchor-or-throw computations are wrapped in a try/catch
// rather than left to throw straight out of the module, so a broken ledger
// anchor becomes a reported row-less failure instead of an uncaught crash
// sitting under whatever the row verdict happened to be (Lumen's rider: a
// run that reddened an anchor used only by the ledger used to print
// "N passed, 0 failed" and THEN throw, because the ledger was built after
// the verdict printed — a green summary line sitting on top of a crash, the
// exact confusion scripts/run-checks.mjs:71-84 names three other costumes
// of). Catching it here, rather than just moving the throw earlier, also
// keeps a genuinely bad row's own diagnostic (e.g. `argument` failing for
// real because the source actually passes `false`) from being swallowed by
// a `mustFindOne` throw on `ARG_CALL_STMT` below, which reads that same
// literal.

// --- mutation ledger (Lumen, consolidated ruling + event a217ac44; adopted
// verbatim in-thread by Vector and Pixel) -----------------------------------
//
// `row: null` entries are must-not-fire controls, not decoration — a harness
// with none of those only proves the gate is sensitive, never that it is
// specific. Every `from` below is verified unique by run-mutations.mjs
// before it is applied. Spans are sliced out of the real source with
// anchors rather than hand-retyped, so a rewrap or a stray space upstream
// cannot desync a mutation's `from` from what the file actually contains.

let MUTATIONS_BUILT = [];
try {
  const AWAIT_STMT = 'await HoneycombStore.shareEntry({ entryId: todayEntry.id });';
  const ARG_CALL_STMT = 'setAlreadySharedToday(true);';
  const awaitStmtIdx = mustFindOne(src, AWAIT_STMT, 'shareEntry await statement (mutation span)');
  const argCallIdx = mustFindOne(src, ARG_CALL_STMT, 'argument-conjunct call statement (mutation span)');
  const orderingFrom = src.slice(awaitStmtIdx, argCallIdx + ARG_CALL_STMT.length);
  const between_ = src.slice(awaitStmtIdx + AWAIT_STMT.length, argCallIdx);
  const orderingTo = ARG_CALL_STMT + between_ + AWAIT_STMT;

  // Same declaration-to-flip span the `vacuity` discussion above reasons
  // about: renaming the setter's substring first (longer, so it can't be
  // re-matched by the shorter state-name pass) then the bare state name
  // leaves every occurrence INSIDE the span consistent with itself, and the
  // render ternary — hundreds of lines further down, outside the span
  // entirely — untouched. That mismatch is the whole mutation.
  const VACUITY_SPAN_START = 'const [alreadySharedToday, setAlreadySharedToday] = useState(false);';
  const vacuitySpanStartIdx = mustFindOne(src, VACUITY_SPAN_START, 'vacuity mutation span start');
  const vacuitySpanEndIdx = argCallIdx + ARG_CALL_STMT.length;
  const vacuityFrom = src.slice(vacuitySpanStartIdx, vacuitySpanEndIdx);
  const vacuityTo = vacuityFrom.split('setAlreadySharedToday').join('setAlreadySharedTodayRenamed').split('alreadySharedToday').join('alreadySharedTodayRenamed');

  MUTATIONS_BUILT = [
  {
    row: 'argument',
    why: 'ledger item 1 — the write-confirmed flip must pass true, not false.',
    file: FILE,
    from: ARG_CALL_STMT,
    to: 'setAlreadySharedToday(false);',
  },
  {
    row: 'ordering',
    why: 'ledger item 2 — hoisting the flip above the shareEntry await makes it optimistic (pure swap, argument stays true).',
    file: FILE,
    from: orderingFrom,
    to: orderingTo,
  },
  {
    row: 'derivation',
    why: "ledger item 3 — the ternary read must not collapse to a bare literal (Pixel's green run is the positive control this row must flip).",
    file: FILE,
    from: 'setAlreadySharedToday(today ? await HoneycombStore.hasSharedDate(toISODate(now)) : false);',
    to: 'setAlreadySharedToday(false);',
  },
  {
    row: 'failOpenInner',
    why: 'ledger item 4a — a failed share-status read must default to false, not true.',
    file: FILE,
    from: "console.warn('HoneycombTab: failed to load share status', err);\n            setAlreadySharedToday(false);",
    to: "console.warn('HoneycombTab: failed to load share status', err);\n            setAlreadySharedToday(true);",
  },
  {
    row: 'failOpenOuter',
    why: 'ledger item 4b — a failed entry read must default to false, not true (independent arm from 4a).',
    file: FILE,
    from: 'setTodayEntry(null);\n          setAlreadySharedToday(false);',
    to: 'setTodayEntry(null);\n          setAlreadySharedToday(true);',
  },
  {
    row: 'vacuity',
    why:
      'ledger item 5 — renaming the declaration and all four setter call sites but leaving the render ternary on the old name must be caught, and only this row is positioned to catch it.',
    file: FILE,
    from: vacuityFrom,
    to: vacuityTo,
  },
  {
    row: 'vacuity',
    why:
      "Lumen's rider (2026-09-07) — renaming ONLY the declared state name, leaving the setter's spelling untouched, satisfies the old setter-name-convention check while breaking the render/producer pairing; only a row that reads the useState declaration rather than deriving the expected name from the setter's spelling catches this.",
    file: FILE,
    from: VACUITY_SPAN_START,
    to: "const [sharedTodayFlag, setAlreadySharedToday] = useState(false);",
  },
  {
    row: 'initialOffer',
    why: 'ledger item 6 — the useState initializer must be false, not true.',
    file: FILE,
    from: VACUITY_SPAN_START,
    to: 'const [alreadySharedToday, setAlreadySharedToday] = useState(true);',
  },
  {
    row: 'cardinality',
    why:
      "ledger item 7 — substituting the silent catch with a state write is a legitimate future repair (R-SHARE-1) that must still be counted, and reds alone: no other row is keyed on call count.",
    file: FILE,
    from: "console.warn('Failed to share entry', err);",
    to: 'setAlreadySharedToday(false);',
  },
  {
    row: null,
    why: 'renaming an unrelated identifier in the same file must not move any row.',
    file: FILE,
    from: "const [hiveView, setHiveView] = useState('today');",
    to: "const [hiveViewX, setHiveViewX] = useState('today');",
  },
  ];
} catch (err) {
  bad('harness', `mutation ledger failed to build — ${err.message}`);
}

export const MUTATIONS = MUTATIONS_BUILT;

// Deferred to here, after MUTATIONS is fully built (or the attempt has
// failed and been reported via `bad('harness', ...)` above), on purpose —
// see the comment above the ledger. Every row is already computed and
// printed by this point; this only decides the exit code and prints the
// total.
console.log(`\ncheck-share-status-derivation: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
