// DES-44 (r2, issue a864e872…) — FeedCard's like control and comment count.
//
//   npm run check:feedcard-claims
//
// The defect this gate protects the repair of: both controls rendered CLAIMS
// about state the card does not own, and both were wrong for the length of a
// refresh. The heart and its number came straight off `share.likedByMe` /
// `share.likeCount`, so a tap changed nothing on the control and the second tap
// inside one round trip passed a stale `wasLiked` into `toggleLike`, taking the
// insert branch against `unique_like` and throwing 23505 into a `console.warn`.
// The comment count was a local COPY seeded once from the prop with a single
// writer and nothing to re-seed it, so it stopped counting the moment anyone
// else commented.
//
// Ruled by Lumen in #Collab thread `0f727f7c` (2026-09-07) as R-FC-1 through
// R-FC-5, with Vector's measurements. Every spec cited in this file lives in
// the design workspace, not at any path in this repo; nothing under `GUIDES/`
// is in this tree, so a bare `GUIDES/...` address opens nothing for whoever
// reads this file next. Every in-repo address below opens from this tree.
//
// WHAT THIS GATE CANNOT SEE. Rows 1 through 6 of the ticket's acceptance are
// observations of a rendered control on a device: that glyph, ink and count
// move in the same frame, that nothing is announced unavailable, that the bee
// flies once, that the week-view heart works. None of that is here, and this
// file does not imply it. What is here is the STRUCTURE those observations
// depend on — a structure that can rot silently, where a rendering defect
// cannot.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { parse } from '@babel/parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => path.relative(ROOT, p);

const FEEDCARD = path.join(ROOT, 'src/components/FeedCard.js');
const HCTAB = path.join(ROOT, 'src/screens/HoneycombTab.js');
const PRESSABLE = path.join(ROOT, 'src/components/PressableScale.js');
const STRATEGY = path.join(ROOT, 'docs/strategy/Pollinate_Strategy.md');

let pass = 0;
const failures = [];
const ok = (msg) => {
  pass += 1;
  console.log(`  ok  ${msg}`);
};
const bad = (msg, detail) => {
  failures.push(`${msg}${detail ? ` — ${detail}` : ''}`);
  console.log(`  FAIL ${msg}${detail ? ` — ${detail}` : ''}`);
};

const parseFile = async (file) => {
  const src = await readFile(file, 'utf8');
  return { src, ast: parse(src, { sourceType: 'module', plugins: ['jsx'] }) };
};

// A plain recursive walk. Every row below quantifies over a set this produces,
// so it returns the node AND its parent chain: a containment test is not a
// resolution, and several rows need the innermost enclosing function.
const walk = (node, visit, stack = []) => {
  if (!node || typeof node.type !== 'string') return;
  visit(node, stack);
  const next = [...stack, node];
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments') continue;
    const v = node[key];
    if (Array.isArray(v)) v.forEach((c) => walk(c, visit, next));
    else if (v && typeof v.type === 'string') walk(v, visit, next);
  }
};

const collect = (root, pred) => {
  const out = [];
  walk(root, (n, stack) => {
    if (pred(n, stack)) out.push({ node: n, stack });
  });
  return out;
};

const lineOf = (n) => n.loc?.start?.line ?? 0;
const src = (text, n) => text.slice(n.start, n.end);
const enclosingFn = (stack) =>
  [...stack].reverse().find((s) => s.type === 'ArrowFunctionExpression' || s.type === 'FunctionDeclaration' || s.type === 'FunctionExpression');

const feed = await parseFile(FEEDCARD);
const hc = await parseFile(HCTAB);
const press = await parseFile(PRESSABLE);
const strategy = await readFile(STRATEGY, 'utf8');

// --- Universe guard -----------------------------------------------------
// Every row below is scoped to the FeedCard component body. If that body is
// not found, each row would quantify over the empty set and pass by vacuity,
// which is the failure mode this whole suite exists to refuse.
const feedCardDecl = collect(
  feed.ast.program,
  (n) => n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.id.name === 'FeedCard'
)[0];

if (!feedCardDecl || feedCardDecl.node.init?.type !== 'ArrowFunctionExpression') {
  bad('universe: FeedCard component body found', 'no `const FeedCard = (...) => ...` declarator; every row below would be vacuous');
  console.log(`\ncheck-feedcard-claims: ${pass} passed, ${failures.length} failed`);
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
const fc = feedCardDecl.node.init;
const fcBody = fc.body;
ok(`universe: FeedCard component body at ${rel(FEEDCARD)}:${lineOf(fc)}`);

// The named functions every row addresses, resolved once and asserted present.
const namedFns = {};
for (const name of ['handleLike', 'toggleComments', 'handlePostComment']) {
  const d = collect(fcBody, (n) => n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.id.name === name)[0];
  if (!d) bad(`universe: \`${name}\` resolves in FeedCard`, 'not found; the rows scoped to it would be vacuous');
  else {
    namedFns[name] = d.node.init;
    ok(`universe: \`${name}\` at ${rel(FEEDCARD)}:${lineOf(d.node)}`);
  }
}
if (Object.keys(namedFns).length !== 3) {
  console.log(`\ncheck-feedcard-claims: ${pass} passed, ${failures.length} failed`);
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}

// =======================================================================
// Section A — R-FC-1: the override, and what makes it an override
// =======================================================================
console.log('\nA. R-FC-1 — the pending override');

// A1. The initialiser IS the claim: `null` means "this card is claiming
// nothing and the prop is the truth". Seeded from `share.likedByMe` instead
// and it stops being an override and becomes the copy the ticket exists to
// delete — the `commentCount` defect, on the other control.
{
  const decls = collect(
    fcBody,
    (n) =>
      n.type === 'CallExpression' &&
      n.callee.type === 'Identifier' &&
      n.callee.name === 'useState' &&
      n.parent === undefined
  );
  const states = collect(fcBody, (n) => n.type === 'VariableDeclarator' && n.init?.type === 'CallExpression' && n.init.callee?.name === 'useState');
  const pending = states.filter(
    (s) => s.node.id.type === 'ArrayPattern' && s.node.id.elements?.[0]?.name === 'pendingLike'
  );
  void decls;
  if (pending.length !== 1) {
    bad('A1a `pendingLike` is exactly one useState binding', `found ${pending.length}`);
  } else {
    const init = pending[0].node.init.arguments[0];
    if (!init || init.type !== 'NullLiteral') {
      bad('A1b `pendingLike` is seeded null', `seeded \`${init ? src(feed.src, init) : '<no argument>'}\` — a seed from the prop makes it a copy, not an override`);
    } else {
      ok(`A1b \`pendingLike\` is one useState seeded null (${rel(FEEDCARD)}:${lineOf(pending[0].node)})`);
    }
  }
}

// A2. The clear is a RENDER-PHASE statement in the component body, not an
// effect and not a callback. Row 7 of the acceptance is "FeedCard still
// contains zero effects", and an effect is the idiomatic place this would
// otherwise go: it would make FeedCard the file's first effect and put every
// post-await write in it into ENG-109's effect-reachable population, in the
// same commit as its own repair. A presence row would go green on a clear
// moved into a handler, so this row is POSITIONAL.
{
  const clears = collect(fc, (n, stack) => {
    if (n.type !== 'CallExpression' || n.callee?.name !== 'setPendingLike') return false;
    return n.arguments.length === 1 && n.arguments[0].type === 'NullLiteral' && enclosingFn(stack) === fc;
  });
  if (clears.length !== 1) {
    bad('A2 the clear is one render-phase `setPendingLike(null)`', `found ${clears.length} directly in the component body (a clear inside a handler or an effect does not count)`);
  } else {
    const stmt = [...clears[0].stack].reverse().find((s) => s.type === 'IfStatement');
    if (!stmt) {
      bad('A2 the clear is conditional', 'an unconditional render-phase setState does not converge');
    } else {
      const test = src(feed.src, stmt.test);
      if (!test.includes('pendingLike') || !test.includes('share.likedByMe')) {
        bad('A2 the clear fires when the PROP agrees', `test is \`${test}\` — it must compare the claim against \`share.likedByMe\`, which is the only thing that retires a claim`);
      } else {
        ok(`A2 render-phase clear, conditional on the prop agreeing (${rel(FEEDCARD)}:${lineOf(stmt)})`);
      }
    }
  }
}

// A3/A4. One pending across glyph, ink AND count — including the count's
// PRESENCE. `{share.likeCount > 0 && <Text>}` means the number does not exist
// until the refresh lands and then appears, so the control changes width under
// the thumb that pressed it one round trip late. The row is a universal over
// the like button's whole subtree rather than a check of three sites: the
// property is that NOTHING in that control reads the raw prop.
{
  const jsxElements = collect(fcBody, (n) => n.type === 'JSXElement');
  const likeButtons = jsxElements.filter(({ node }) => {
    if (node.openingElement.name?.name !== 'PressableScale') return false;
    return node.openingElement.attributes.some(
      (a) => a.type === 'JSXAttribute' && a.name.name === 'onPress' && src(feed.src, a.value).includes('handleLike')
    );
  });
  if (likeButtons.length !== 1) {
    bad('A3 the like control resolves to exactly one PressableScale', `found ${likeButtons.length} with onPress={handleLike}`);
  } else {
    const btn = likeButtons[0].node;
    const rawReads = collect(btn, (n) => n.type === 'MemberExpression' && src(feed.src, n).startsWith('share.like'));
    if (rawReads.length) {
      bad(
        'A3 nothing inside the like control reads the raw prop',
        `${rawReads.length} read(s): ${rawReads.map((r) => `${src(feed.src, r.node)}@:${lineOf(r.node)}`).join(', ')} — glyph, ink, count and the count's PRESENCE all take the override or none of them do`
      );
    } else {
      ok(`A3 the like control reads no \`share.like*\` prop directly (${rel(FEEDCARD)}:${lineOf(btn)})`);
    }

    // A4. And the presence condition and the rendered digit are the same
    // binding. Two different expressions here is how a filled heart ends up
    // beside a number that has not moved.
    const conds = collect(btn, (n) => n.type === 'LogicalExpression' && n.operator === '&&' && n.left.type === 'BinaryExpression');
    if (conds.length !== 1) {
      bad('A4 the count has exactly one presence condition', `found ${conds.length}`);
    } else {
      const left = src(feed.src, conds[0].node.left.left);
      const digits = collect(conds[0].node.right, (n) => n.type === 'JSXExpressionContainer');
      const digit = digits.length ? src(feed.src, digits[digits.length - 1].node.expression) : '<none>';
      if (left !== digit) {
        bad('A4 presence and digit are one binding', `presence keys on \`${left}\`, the digit renders \`${digit}\``);
      } else {
        ok(`A4 the count's presence and its digit are the same binding (\`${left}\`)`);
      }
    }
  }
}

// A5. The property that retires 23505: `wasLiked` reads the OVERRIDE, and the
// same binding is what `toggleLike` is told. A tap that reads the override and
// a write that is told the prop is the original bug wearing new state.
{
  const hl = namedFns.handleLike;
  const was = collect(hl, (n) => n.type === 'VariableDeclarator' && n.id.name === 'wasLiked')[0];
  if (!was) bad('A5a `wasLiked` resolves in handleLike');
  else {
    const init = src(feed.src, was.node.init);
    if (init !== 'liked') {
      bad('A5a `wasLiked` reads the override', `initialised from \`${init}\` — reading \`share.likedByMe\` here is the stale argument that takes toggleLike's insert branch against \`unique_like\``);
    } else ok('A5a `wasLiked` is initialised from the override, not the prop');

    const toggles = collect(hl, (n) => n.type === 'CallExpression' && src(feed.src, n.callee) === 'HoneycombStore.toggleLike');
    if (toggles.length !== 1) bad('A5b exactly one toggleLike call in handleLike', `found ${toggles.length}`);
    else {
      const arg = src(feed.src, toggles[0].node.arguments[1]);
      if (arg !== 'wasLiked') bad('A5b toggleLike is told the same value the tap read', `second argument is \`${arg}\``);
      else ok('A5b toggleLike receives `wasLiked`, the same value the tap decided on');
    }
  }
}

// A6. Withdraw on a throw, and withdraw to the PRE-TAP value. A filled heart is
// a claim; a claim the write did not support is withdrawn. Clearing to `null`
// instead is right only when there was no prior claim — a second tap inside one
// refresh window is made against a claim the prop has not caught up with, and
// clearing there would withdraw a claim the PREVIOUS write did support. So the
// row is positional: the capture must precede the write's own setter.
{
  const hl = namedFns.handleLike;
  const tryStmt = collect(hl, (n) => n.type === 'TryStatement')[0];
  if (!tryStmt) bad('A6a handleLike has a try/catch');
  else {
    const handler = tryStmt.node.handler;
    const withdraws = collect(handler, (n) => n.type === 'CallExpression' && n.callee?.name === 'setPendingLike');
    if (withdraws.length !== 1) {
      bad('A6a the catch arm withdraws the claim', `found ${withdraws.length} \`setPendingLike\` call(s) in the catch — a failed write that leaves a filled heart is a claim the write did not support`);
    } else {
      const argNode = withdraws[0].node.arguments[0];
      const arg = src(feed.src, argNode);
      const capture = collect(hl, (n) => n.type === 'VariableDeclarator' && n.init && src(feed.src, n.init) === 'pendingLike')[0];
      const claimSet = collect(hl, (n) => n.type === 'CallExpression' && n.callee?.name === 'setPendingLike' && src(feed.src, n.arguments[0] ?? n) !== arg)[0];
      if (!capture) {
        bad('A6a the pre-tap claim is captured', 'no `const <x> = pendingLike;` in handleLike — without it the catch can only restore the prop, which is not the pre-tap state when a prior claim was in force');
      } else if (arg !== capture.node.id.name) {
        bad('A6a the catch restores the captured pre-tap claim', `catch passes \`${arg}\`, capture is \`${capture.node.id.name}\``);
      } else if (!claimSet || claimSet.node.start < capture.node.start) {
        bad('A6b the capture precedes the write it protects', 'the capture must be read BEFORE `setPendingLike(!wasLiked)` or it captures the new claim');
      } else {
        ok(`A6a the catch restores the pre-tap claim \`${arg}\`, captured at :${lineOf(capture.node)} before the tap's own setter at :${lineOf(claimSet.node)}`);
      }
    }
  }
}

// =======================================================================
// Section B — R-FC-1a: `disabled` is dropped, never passed false
// =======================================================================
console.log('\nB. R-FC-1a — the announced state');

// B1. The test in `Pressable.js` is `disabled != null`, NOT truthiness. So
// `disabled={false}` still writes `disabled` into the announced accessibility
// state. The rule is therefore DROP THE PROP, which survives someone tidying it
// into a falsy default; a row asserting `disabled` is falsy would not.
{
  const jsxElements = collect(fcBody, (n) => n.type === 'JSXElement');
  const likeBtn = jsxElements.filter(({ node }) =>
    node.openingElement.name?.name === 'PressableScale' &&
    node.openingElement.attributes.some((a) => a.type === 'JSXAttribute' && a.name.name === 'onPress' && src(feed.src, a.value).includes('handleLike'))
  )[0];
  if (!likeBtn) bad('B1 the like control resolves', 'no PressableScale with onPress={handleLike}');
  else {
    const names = likeBtn.node.openingElement.attributes
      .filter((a) => a.type === 'JSXAttribute')
      .map((a) => a.name.name);
    const spreads = likeBtn.node.openingElement.attributes.filter((a) => a.type === 'JSXSpreadAttribute');
    if (spreads.length) {
      bad('B1 the like control has no spread attributes', `${spreads.length} spread(s) — a spread can carry \`disabled\` past a name scan, so this row cannot see it`);
    } else if (names.includes('disabled')) {
      bad('B1 `disabled` is absent from the like control', 'present — under R-FC-1 the tap fills the heart, appears the count, drops the control to 40% and announces it unavailable in one frame; `disabled={false}` is not a fix, the test is `!= null`');
    } else {
      ok(`B1 the like control passes no \`disabled\` at all (attributes: ${names.join(', ')})`);
    }
  }

  // The functional re-entry block is what `disabled` was doing that mattered,
  // and it must still be there. Dropping the prop AND the guard would be a
  // regression this section's own headline could hide.
  const guard = collect(namedFns.handleLike, (n) => n.type === 'IfStatement' && src(feed.src, n.test) === 'liking' && n.consequent.type === 'ReturnStatement')[0];
  if (!guard) bad('B2 `if (liking) return;` still guards re-entry', 'the prop was dropped for the announcement and the fade; the functional block is this statement and it is untouched by that');
  else ok(`B2 \`if (liking) return;\` still guards re-entry (${rel(FEEDCARD)}:${lineOf(guard.node)})`);
}

// B3. A DEPENDENCY row, not a defect row. B1 exists because `PressableScale`
// forwards `disabled` to `Pressable` and fades on it. If either stops being
// true, B1 is still green and no longer means anything, so the reason is
// asserted where the reason lives. A red here says RE-DERIVE, not "you broke
// it".
{
  const forwards = collect(press.ast.program, (n) =>
    n.type === 'JSXAttribute' && n.name.name === 'disabled' && n.value?.type === 'JSXExpressionContainer'
  );
  const fades = press.src.includes('disabled ? disabledOpacity : 1');
  if (!forwards.length || !fades) {
    bad(
      'B3 the reason for B1 still holds in PressableScale',
      `${forwards.length} \`disabled\` forward(s), fade expression ${fades ? 'present' : 'ABSENT'} — B1 is scoped to a component that announces and fades on this prop; if it no longer does, B1 must be re-derived rather than trusted`
    );
  } else {
    ok(`B3 PressableScale still forwards \`disabled\` (${rel(PRESSABLE)}:${lineOf(forwards[0].node)}) and still fades on it — B1's reason holds`);
  }
}

// =======================================================================
// Section C — R-FC-2: the heart flips at tap, the bee does not
// =======================================================================
console.log('\nC. R-FC-2 — the bee stays behind the write');
{
  const hl = namedFns.handleLike;
  const flight = collect(hl, (n) => n.type === 'CallExpression' && n.callee?.name === 'setLikeFlightKey')[0];
  const awaitToggle = collect(hl, (n) => n.type === 'AwaitExpression' && src(feed.src, n.argument.callee ?? n.argument) === 'HoneycombStore.toggleLike')[0];
  if (!flight || !awaitToggle) {
    bad('C1a the flight and the write both resolve', `flight ${flight ? 'found' : 'MISSING'}, awaited toggleLike ${awaitToggle ? 'found' : 'MISSING'}`);
  } else if (flight.node.start < awaitToggle.node.start) {
    bad('C1a the flight fires after the write returns', 'a claim can be withdrawn; motion cannot — a bee that lifts and then a heart that empties has told the person something was recorded and no later state can un-play it');
  } else {
    const gate = [...flight.stack].reverse().find((s) => s.type === 'IfStatement');
    const test = gate ? src(feed.src, gate.test) : '<ungated>';
    if (test !== '!wasLiked') {
      bad('C1b the flight is gated on `!wasLiked`', `gated on \`${test}\` — the bee is the like's celebration and must never fly on an unlike`);
    } else {
      ok(`C1ab the flight fires after the awaited write, gated on \`!wasLiked\` (${rel(FEEDCARD)}:${lineOf(flight.node)} after :${lineOf(awaitToggle.node)})`);
    }
  }
}

// =======================================================================
// Section D — R-FC-3: no local count; a caption or a claim, never a copy
// =======================================================================
console.log('\nD. R-FC-3 — the comment count');

// D1. The deletion. A local count seeded from the prop with one writer and
// nothing to re-seed it is the defect; `FeedCard` has zero effects and both
// render sites key on `share.id`, so the instance survives every refresh.
{
  const states = collect(fcBody, (n) => n.type === 'VariableDeclarator' && n.init?.type === 'CallExpression' && n.init.callee?.name === 'useState');
  const copies = states.filter((s) => s.node.id.type === 'ArrayPattern' && /^comment(s)?Count$/.test(s.node.id.elements?.[0]?.name ?? ''));
  if (copies.length) bad('D1 no local comment-count state', `${copies.length} found at :${copies.map((c) => lineOf(c.node)).join(', ')}`);
  else ok('D1 no `useState` holds a comment count — the copy is gone, not overridden');
}

// D2. The two reads, and which one is licensed where. A number beside its list
// is a CAPTION and must equal what can be counted beside it; the same number
// alone is a CLAIM about a shared aggregate, and a shared aggregate has one
// read. `max` is not an override: `comments` and `share.commentCount` are two
// honest reads of the SAME aggregate at different moments, so for a quantity
// that only grows the larger is the fresher.
let builtMaxExpression = null;
{
  const decl = collect(fcBody, (n) => n.type === 'VariableDeclarator' && n.id.name === 'commentCount' && n.init?.type === 'ConditionalExpression')[0];
  if (!decl) {
    bad('D2a `commentCount` is a render-time choice between two reads', 'no `const commentCount = <cond> ? … : …`');
  } else {
    const open = src(feed.src, decl.node.init.consequent);
    const closed = src(feed.src, decl.node.init.alternate);
    if (open !== 'comments.length') {
      bad('D2a open renders the caption exactly', `renders \`${open}\` — with the items on screen the number must equal what can be counted beside it, even when the prop is fresher`);
    } else ok('D2a sheet open renders `comments.length` exactly (a caption)');
    if (closed !== 'Math.max(share.commentCount, comments.length)') {
      bad('D2b closed renders the larger of two honest reads', `renders \`${closed}\``);
    } else {
      builtMaxExpression = closed;
      ok('D2b sheet closed renders `Math.max(share.commentCount, comments.length)`');
    }
  }
}

// D3. Acceptance row 8, as a machine check instead of a promise. The Tab 3
// audience paragraph in `docs/strategy/Pollinate_Strategy.md` names THIS
// EXPRESSION by name, as the trigger for a change that is scheduled but
// unwritten. Addressed by section, not by line: the row below is keyed on the
// sentence's own text, so a line number here would be a second address with a
// shorter life than the one the row uses. A
// builder who finds a better shape than the ruled one should take it and say
// so — and a strategy paragraph naming a dead expression is worse than one
// naming none, because nobody re-reads a strategy paragraph on the strength of
// a component commit. So the two move together or this reds.
//
// This is the one part of a cited dependency a machine can hold: the argument
// is a thing a reader tests, the condition is a thing a reader evaluates, but
// the NAME is a string, and a string can rot with nobody arguing with it.
{
  const cites = strategy.includes('`Math.max` in `FeedCard`');
  if (!cites) {
    bad('D3 the strategy paragraph still names the expression', `${rel(STRATEGY)} no longer contains "\`Math.max\` in \`FeedCard\`" — if the sentence moved, this row moves with it`);
  } else if (!builtMaxExpression) {
    bad(
      'D3 the built shape matches what the strategy paragraph names',
      `${rel(STRATEGY)} names \`Math.max\` in \`FeedCard\`, and FeedCard's closed-state expression is not that. Acceptance row 8: the same commit amends the sentence.`
    );
  } else {
    ok(`D3 ${rel(STRATEGY)} names \`Math.max\` in \`FeedCard\` and FeedCard builds it (row 8)`);
  }
}

// =======================================================================
// Section E — R-FC-4: opening the sheet IS the request for a fresh read
// =======================================================================
console.log('\nE. R-FC-4 — the fetch guard');

// E1. The old condition cached on `comments.length === 0`: a share with zero
// comments re-fetched on every open, and a share with ANY comments never
// re-fetched for the life of the mount. The wasteful half is the visible one
// and the caching half is the one that bites.
{
  const tc = namedFns.toggleComments;
  const guards = collect(tc, (n) => n.type === 'IfStatement' && n.consequent.type === 'ReturnStatement');
  if (guards.length !== 1) {
    bad('E1a toggleComments has exactly one early-return guard', `found ${guards.length}`);
  } else {
    const test = src(feed.src, guards[0].node.test);
    if (/comments\.length/.test(test)) {
      bad('E1a the fetch guard does not key on the list', `guard is \`${test}\` — a length test caches the read, and the cached direction is the one that goes stale`);
    } else if (!test.includes('loadingComments')) {
      bad('E1b the fetch guard blocks a CONCURRENT fetch', `guard is \`${test}\` — the flag guards concurrency, never repetition`);
    } else {
      ok(`E1ab the fetch guard is \`${test}\` — concurrency only, no cache`);
    }
  }
}

// E2. The row that protects the flag added for D2's caption. `commentsLoaded`
// answers "has the list ever been read", which the caption needs and the fetch
// must never see: the moment the fetch reads it, R-FC-4 is reversed and the
// exact defect E1 removes is back under a fresher name. A universal over READS,
// so a write (`setCommentsLoaded`) is not a hit.
{
  const tc = namedFns.toggleComments;
  const reads = collect(tc, (n, stack) => {
    if (n.type !== 'Identifier' || n.name !== 'commentsLoaded') return false;
    const parent = stack[stack.length - 1];
    return !(parent?.type === 'MemberExpression' && parent.property === n);
  });
  if (reads.length) {
    bad('E2 the fetch never reads `commentsLoaded`', `${reads.length} read(s) at :${reads.map((r) => lineOf(r.node)).join(', ')} — this flag exists for the caption; a fetch that reads it is R-FC-4 reversed`);
  } else {
    ok('E2 `commentsLoaded` is written but never read inside toggleComments — it captions, it does not cache');
  }
}

// =======================================================================
// Section F — R-FC-5: one name for two causes
// =======================================================================
console.log('\nF. R-FC-5 — the callback census');

// F1. The old name is gone everywhere. Stated as a byte scan over the whole of
// `src/`, because the hazard is precisely the site a scan of FeedCard's callers
// misses: `WeekView` holds the callback under the prop name one component away,
// and a hand-edit of FeedCard's interface plus its two direct call sites leaves
// `:37` calling `undefined` — which throws rather than degrading, but only on
// the week view, which a feed smoke test never reaches.
{
  const feedHits = (feed.src.match(/onLikeToggled/g) || []).length;
  const hcHits = (hc.src.match(/onLikeToggled/g) || []).length;
  if (feedHits + hcHits) bad('F1 zero `onLikeToggled` in the two files that held it', `${feedHits} in FeedCard, ${hcHits} in HoneycombTab`);
  else ok('F1 zero `onLikeToggled` in FeedCard.js and HoneycombTab.js');
}

// F2a. OCCURRENCES, reconciled against an INDEPENDENT witness. The two
// instruments do not agree by construction and they must not be assumed to:
// a shorthand `{ onShareChanged }` is an ObjectProperty whose key and value are
// two distinct nodes at one offset, and a JSX attribute NAME is a
// `JSXIdentifier` while the value inside its braces is an `Identifier`. The
// first inflates a naive walk, the second is invisible to one. Measured, not
// argued: the first version of this row read 7 against a byte scan's 8 and both
// numbers were confidently wrong about what they were counting.
const censusSites = [];
{
  const seen = new Set();
  const occurrences = [];
  for (const [file, parsed] of [[FEEDCARD, feed], [HCTAB, hc]]) {
    walk(parsed.ast.program, (n, stack) => {
      const isName =
        (n.type === 'Identifier' || n.type === 'JSXIdentifier') && n.name === 'onShareChanged';
      if (!isName) return;
      const parent = stack[stack.length - 1];
      if (parent?.type === 'MemberExpression' && parent.property === n) return;
      const key = `${rel(file)}#${n.start}`;
      if (seen.has(key)) return;
      seen.add(key);
      occurrences.push(`${rel(file)}:${lineOf(n)}`);
    });
  }
  const rawCount =
    (feed.src.match(/onShareChanged/g) || []).length + (hc.src.match(/onShareChanged/g) || []).length;

  if (occurrences.length === 0) {
    bad('F2a the census universe is non-empty', 'zero `onShareChanged` names — an empty set makes every claim below vacuous');
  } else if (occurrences.length !== rawCount) {
    bad(
      'F2a AST occurrences reconcile with a raw byte scan',
      `walk found ${occurrences.length} (${occurrences.join(', ')}), byte scan found ${rawCount} — two instruments disagreeing means at least one is measuring something other than what it says`
    );
  } else {
    ok(`F2a ${occurrences.length} \`onShareChanged\` occurrences, AST walk and byte scan agreeing`);
  }
  censusSites.push(...new Set(occurrences));
}

// F2b. The census as a MULTISET KEYED ON STRUCTURE, not on addresses. An
// earlier draft of this row pinned the seven `file:line` sites, and a file:line
// is a join key rather than a pin: it is computed twice inside one run and stays
// correct only until somebody adds a line above it. Every legal edit in either
// file would have reddened it, and a row that reds on legal edits earns an
// allowlist. The key here is the pair (syntactic ROLE, enclosing OWNER), which
// survives reformatting and still reds the two failures that matter: a site
// disappearing, and a site turning up somewhere it was never ruled.
{
  const roleOf = (n, stack) => {
    const parent = stack[stack.length - 1];
    const gp = stack[stack.length - 2];
    if (parent?.type === 'JSXAttribute' && parent.name === n) return 'jsx-attr';
    if (parent?.type === 'JSXExpressionContainer') return 'jsx-value';
    if (parent?.type === 'CallExpression' && parent.callee === n) return 'call';
    if (parent?.type === 'ObjectProperty' && gp?.type === 'ObjectPattern') return 'param';
    return `other(${parent?.type ?? '?'})`;
  };
  const ownerOf = (stack) => {
    for (let i = stack.length - 1; i >= 0; i -= 1) {
      const s = stack[i];
      if (s.type === 'VariableDeclarator' && s.id?.type === 'Identifier') return s.id.name;
      if (s.type === 'FunctionDeclaration' && s.id?.name) return s.id.name;
    }
    return '<module>';
  };

  const found = [];
  const seenAt = new Set();
  for (const [file, parsed] of [[FEEDCARD, feed], [HCTAB, hc]]) {
    walk(parsed.ast.program, (n, stack) => {
      const isName = (n.type === 'Identifier' || n.type === 'JSXIdentifier') && n.name === 'onShareChanged';
      if (!isName) return;
      const parent = stack[stack.length - 1];
      if (parent?.type === 'MemberExpression' && parent.property === n) return;
      const at = `${rel(file)}#${n.start}`;
      if (seenAt.has(at)) return;
      seenAt.add(at);
      found.push({ key: `${rel(file)} ${roleOf(n, stack)}@${ownerOf(stack)}`, line: lineOf(n) });
    });
  }

  // Ruled: the six sites R-FC-5's census named, plus the one call R-FC-5 adds.
  // `jsx-attr@HoneycombFeed` appears twice because two elements there take the
  // prop, the WeekView and the direct FeedCard render, so this is a multiset
  // and not a set.
  const RULED = [
    'src/components/FeedCard.js param@FeedCard',
    'src/components/FeedCard.js call@handleLike',
    'src/components/FeedCard.js call@handlePostComment',
    'src/screens/HoneycombTab.js param@WeekView',
    'src/screens/HoneycombTab.js jsx-attr@WeekView',
    'src/screens/HoneycombTab.js jsx-value@WeekView',
    'src/screens/HoneycombTab.js jsx-attr@HoneycombFeed',
    'src/screens/HoneycombTab.js jsx-attr@HoneycombFeed',
  ];
  const tally = (xs) => xs.reduce((m, k) => m.set(k, (m.get(k) ?? 0) + 1), new Map());
  const want = tally(RULED);
  const got = tally(found.map((f) => f.key));
  const troubles = [];
  for (const [k, n] of want) {
    const have = got.get(k) ?? 0;
    if (have !== n) troubles.push(`ruled ${n}x \`${k}\`, found ${have}x`);
  }
  for (const [k, n] of got) {
    if (!want.has(k)) troubles.push(`unruled ${n}x \`${k}\``);
  }
  if (troubles.length) {
    bad(
      'F2b the callback census is the ruled six plus the comment-post call',
      `${troubles.join('; ')}. Sites today: ${found.map((f) => `${f.key}:${f.line}`).join(', ')}`
    );
  } else {
    ok(`F2b ${found.length} sites, multiset-equal to the ruling on (role, owner) in both directions`);
  }
}

// F3. `handlePostComment` notifies the parent, and it does so AFTER the list
// re-read. Before it, and the parent refreshes against a share whose comment
// the write has not necessarily landed for; a presence row would go green on
// either order, so this one is positional.
{
  const hp = namedFns.handlePostComment;
  const notify = collect(hp, (n) => n.type === 'CallExpression' && n.callee?.name === 'onShareChanged')[0];
  const reread = collect(hp, (n) => n.type === 'AwaitExpression' && src(feed.src, n.argument.callee ?? n.argument) === 'HoneycombStore.listComments')[0];
  if (!notify) {
    bad('F3 a posted comment notifies the parent', 'no `onShareChanged` call in handlePostComment — the comment reaches `comments` and never reaches the prop, so the closed count reverts when the sheet closes');
  } else if (!reread) {
    bad('F3 handlePostComment re-reads the list');
  } else if (notify.node.start < reread.node.start) {
    bad('F3 the parent is told after the list is re-read', 'notifying first refreshes the parent against a list this card has not read yet');
  } else {
    ok(`F3 the parent is notified after the list re-read (${rel(FEEDCARD)}:${lineOf(notify.node)} after :${lineOf(reread.node)})`);
  }
}

// =======================================================================
// Section G — acceptance row 7: zero effects
// =======================================================================
console.log('\nG. Row 7 — FeedCard holds no effects');

// Written as a UNIVERSAL over call callees rather than a list of forbidden
// names: a list has a null class, and the next effect hook to arrive would not
// be on it. Anything whose callee name ends in `Effect` is the population.
{
  const effects = collect(feed.ast.program, (n) => {
    if (n.type !== 'CallExpression') return false;
    const name = n.callee?.name ?? n.callee?.property?.name;
    return typeof name === 'string' && /Effect$/.test(name);
  });
  if (effects.length) {
    bad(
      'G1 FeedCard contains zero effects',
      `${effects.length}: ${effects.map((e) => `${e.node.callee.name ?? e.node.callee.property.name}@:${lineOf(e.node)}`).join(', ')} — the first effect in this file puts every post-await write in it into ENG-109's effect-reachable population, and the reconcile was moved into render precisely to avoid that`
    );
  } else {
    ok('G1 no `*Effect` call anywhere in FeedCard.js (universal over callee names, not a deny-list)');
  }
}

// =======================================================================
// MUTATIONS — `node scripts/run-mutations.mjs scripts/check-feedcard-claims.mjs`
//
// A row that has never been shown to go red has not been shown to be measuring
// anything. Every row above whose failure mode is an edit somebody could
// plausibly make has a mutation here, and the last entry is the must-not-fire
// control: without one, a harness only proves the gate is noisy.
// =======================================================================
export const MUTATIONS = [
  {
    row: 'A1b',
    why: 'seeded from the prop, the pending stops being an override and becomes the copy this ticket exists to delete',
    file: 'src/components/FeedCard.js',
    from: 'const [pendingLike, setPendingLike] = useState(null);',
    to: 'const [pendingLike, setPendingLike] = useState(share.likedByMe);',
  },
  {
    row: 'A2',
    why: 'the clear moved into a function: still present, no longer render-phase. A presence row stays green on exactly this edit',
    file: 'src/components/FeedCard.js',
    from: '  if (pendingLike !== null && pendingLike === share.likedByMe) setPendingLike(null);',
    to: '  const clearPending = () => { if (pendingLike !== null && pendingLike === share.likedByMe) setPendingLike(null); };\n  void clearPending;',
  },
  {
    row: 'A3',
    why: 'the glyph goes back to the raw prop while ink and count keep the override, so the control splits mid-tap',
    file: 'src/components/FeedCard.js',
    from: "name={liked ? 'heart' : 'heart-outline'}",
    to: "name={share.likedByMe ? 'heart' : 'heart-outline'}",
  },
  {
    row: 'A4',
    why: 'presence and digit driven by two different bindings, with no raw prop read, so A3 cannot see it',
    file: 'src/components/FeedCard.js',
    from: '{likeCount > 0 && <Text style={styles.actionText}>{likeCount}</Text>}',
    to: '{commentCount > 0 && <Text style={styles.actionText}>{likeCount}</Text>}',
  },
  {
    row: 'A5a',
    why: 'the tap decides on the prop again, so the second tap inside one refresh reads stale and takes the insert branch',
    file: 'src/components/FeedCard.js',
    from: '    const wasLiked = liked;',
    to: '    const wasLiked = share.likedByMe;',
  },
  {
    row: 'A5b',
    why: 'the tap reads the override and the write is told the prop: the same defect one argument later, invisible to A5a',
    file: 'src/components/FeedCard.js',
    from: 'await HoneycombStore.toggleLike(share.id, wasLiked);',
    to: 'await HoneycombStore.toggleLike(share.id, share.likedByMe);',
  },
  {
    row: 'A6a',
    why: 'the throw clears to null instead of the pre-tap claim, withdrawing a claim the PREVIOUS write did support',
    file: 'src/components/FeedCard.js',
    from: '      setPendingLike(priorClaim);',
    to: '      setPendingLike(null);',
  },
  {
    row: 'A6b',
    why: "the capture reads after the tap's own setter, so it captures the new claim and the catch restores the thing it was meant to undo",
    file: 'src/components/FeedCard.js',
    from: '    const priorClaim = pendingLike;\n    setPendingLike(!wasLiked);',
    to: '    setPendingLike(!wasLiked);\n    const priorClaim = pendingLike;',
  },
  {
    row: 'B1',
    why: "`disabled={false}` — the whole reason the rule is DROP THE PROP, since Pressable's test is `!= null` and a falsy value still writes the announced state",
    file: 'src/components/FeedCard.js',
    from: '<PressableScale onPress={handleLike} style={styles.actionButton}>',
    to: '<PressableScale onPress={handleLike} disabled={false} style={styles.actionButton}>',
  },
  {
    row: 'B2',
    why: 'the prop is gone AND the functional re-entry block with it, which is the regression B1 could otherwise hide',
    file: 'src/components/FeedCard.js',
    from: '    if (liking) return;\n',
    to: '',
  },
  {
    row: 'B3',
    why: 'PressableScale stops forwarding `disabled`, so B1 keeps passing while the reason for B1 has gone. A red here says re-derive, not that anything is broken',
    file: 'src/components/PressableScale.js',
    from: '      disabled={disabled}\n',
    to: '',
  },
  {
    row: 'C1a',
    why: 'the bee lifts before the write returns, so a failed like has already played motion no later state can un-play',
    file: 'src/components/FeedCard.js',
    from: '      await HoneycombStore.toggleLike(share.id, wasLiked);',
    to: '      if (!wasLiked) setLikeFlightKey((key) => key + 1);\n      await HoneycombStore.toggleLike(share.id, wasLiked);',
  },
  {
    row: 'C1b',
    why: 'the flight fires on the unlike instead of the like',
    file: 'src/components/FeedCard.js',
    from: '      if (!wasLiked) setLikeFlightKey((key) => key + 1);\n      onShareChanged',
    to: '      if (wasLiked) setLikeFlightKey((key) => key + 1);\n      onShareChanged',
  },
  {
    row: 'D1',
    why: 'a local comment count comes back under a near-miss name; the row is a shape test, not a name test',
    file: 'src/components/FeedCard.js',
    from: '  const [commentsLoaded, setCommentsLoaded] = useState(false);',
    to: '  const [commentsLoaded, setCommentsLoaded] = useState(false);\n  const [commentsCount, setCommentsCount] = useState(share.commentCount);\n  void setCommentsCount;',
  },
  {
    row: 'D2a',
    why: 'the open sheet stops captioning the list it is rendering and claims the prop instead, beside items the person can count',
    file: 'src/components/FeedCard.js',
    from: '    ? comments.length\n',
    to: '    ? share.commentCount\n',
  },
  {
    row: 'D2b',
    why: 'the closed count drops `max` and reverts to the prop, reintroducing N+1, N, N+1 on a fresh post. D3 co-reds by design, and that co-red IS acceptance row 8 firing',
    file: 'src/components/FeedCard.js',
    from: '    : Math.max(share.commentCount, comments.length);',
    to: '    : share.commentCount;',
  },
  {
    row: 'D3',
    why: 'the strategy paragraph stops naming the expression while the code still builds it, so the pointer rots with nobody arguing with it. The name is the one part of a cited dependency a machine can hold',
    file: 'docs/strategy/Pollinate_Strategy.md',
    from: 'removes `Math.max` in `FeedCard`',
    to: 'removes the max expression in the feed card',
  },
  {
    row: 'E1a',
    why: 'the length cache returns alongside the concurrency guard: a share with any comments never re-reads for the life of the mount, and E1b cannot see it',
    file: 'src/components/FeedCard.js',
    from: '    if (!opening || loadingComments) return;\n    setLoadingComments',
    to: '    if (!opening || loadingComments || comments.length > 0) return;\n    setLoadingComments',
  },
  {
    row: 'E1b',
    why: 'the concurrency guard is dropped, so two opens in flight race each other into setComments',
    file: 'src/components/FeedCard.js',
    from: '    if (!opening || loadingComments) return;\n    setLoadingComments(true);',
    to: '    if (!opening) return;\n    setLoadingComments(true);',
  },
  {
    row: 'E2',
    why: 'the caption flag becomes a fetch cache, which is R-FC-4 reversed under a fresher name, and E1a and E1b both stay green through it',
    file: 'src/components/FeedCard.js',
    from: '    if (!opening || loadingComments) return;\n    setLoadingComments(true);\n',
    to: '    if (!opening || loadingComments || commentsLoaded) return;\n    setLoadingComments(true);\n',
  },
  {
    row: 'F1',
    why: "the week view keeps the old name one component away: the site a grep of FeedCard's callers misses, where the like call then hits undefined and only the week view crashes",
    file: 'src/screens/HoneycombTab.js',
    from: 'const WeekView = ({ sections, truncated, onShareChanged }) => {',
    to: 'const WeekView = ({ sections, truncated, onLikeToggled }) => {',
  },
  {
    row: 'F2b',
    why: 'an eighth reference in a place the ruling never named. F2a still reconciles, because both instruments see it',
    file: 'src/components/FeedCard.js',
    from: '  const isDemo = share.isDemo ?? false;',
    to: '  const isDemo = share.isDemo ?? false;\n  const alsoNotify = () => onShareChanged(share.id);\n  void alsoNotify;',
  },
  {
    row: 'F3',
    why: 'the parent is told before this card has re-read the list, so the refresh races the write it is reporting',
    file: 'src/components/FeedCard.js',
    from: "      setComments(await HoneycombStore.listComments(share.id));\n      setCommentsLoaded(true);\n      setCommentText('');\n      // R-FC-5: a posted comment reached `comments` and never reached the prop,\n      // so the parent was told about a like and never about a comment. The\n      // callback now carries both causes, which is why it is no longer named\n      // for one of them.\n      onShareChanged(share.id);",
    to: "      onShareChanged(share.id);\n      setComments(await HoneycombStore.listComments(share.id));\n      setCommentsLoaded(true);\n      setCommentText('');",
  },
  {
    row: 'G1',
    why: "one effect, and every post-await write in this file joins ENG-109's effect-reachable population in the same commit as its own repair",
    file: 'src/components/FeedCard.js',
    from: '  const [likeFlightKey, setLikeFlightKey] = useState(0);',
    to: '  const [likeFlightKey, setLikeFlightKey] = useState(0);\n  useEffect(() => {}, []);',
  },
  {
    row: null,
    why: 'two unrelated useState declarations swapped: legal, and every row must hold through it, including F2b, which is keyed on structure rather than on the addresses this edit sits above',
    file: 'src/components/FeedCard.js',
    from: "  const [commentText, setCommentText] = useState('');\n  const [postingComment, setPostingComment] = useState(false);",
    to: "  const [postingComment, setPostingComment] = useState(false);\n  const [commentText, setCommentText] = useState('');",
  },
];

console.log(`\ncheck-feedcard-claims: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
