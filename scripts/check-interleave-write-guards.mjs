#!/usr/bin/env node
// The state writes that land after an `await` with nothing guarding them.
//
//   npm run check:interleave-write-guards
//
// WHY THIS FILE EXISTS
//
// Pass A writes, suspends at an `await`, pass B runs and writes, pass A's
// late write lands over it. Nothing throws, nothing logs, and no other gate
// in this repo reads the shape. Found while ratifying ENG-104 (#Collab
// thread `0f727f7c`, 2026-09-07); ticket ENG-107.
//
// THE RULE THE POPULATION TEACHES: ONE GUARD PER AWAIT, NOT ONE PER FUNCTION.
// A guard placed synchronously after an await protects that await only — the
// token is re-read at a point the code never reaches again. `HoneycombTab.js`
// reads as cancellation handling for its whole block and performs it for the
// first read: `:581` guards, `:583` writes, and `:589` writes again after a
// second await with no second guard. `:589`'s await sits inside the setter's
// own argument list, so there is no statement position between the read and
// the write and it cannot be guarded in place; the repair splits it.
//
// THE PREDICATE, AND ITS ROOTS
//
// A setter call (`/^set[A-Z]/`) that runs after an `await` in document order,
// unguarded, inside a function that a re-runnable effect can have two passes
// of at once.
//
//   roots        `useEffect` / `useFocusEffect` / `useLayoutEffect` callbacks,
//                unwrapping `useCallback` / `useMemo`
//   closure      same-file calls by identifier, depth <= 3, so a helper is in
//                scope on the strength of its caller rather than its contents
//   a guard      `if (X) return;` or `if (!X) <write>` where X is a
//                `let X = false` in an enclosing scope, or a `useRef` cell
//                read as `X.current`. The idiom, never a name list
//   AND          X has a writer inside a function the effect RETURNS
//
// THAT LAST CONJUNCT IS THIS GATE'S, AND IT IS THE ONE THAT KEEPS THE
// POPULATION ROW HONEST. A token declared without a cleanup that sets it is
// decorative: the flag is false for the life of the pass, every `if (X)
// return;` is dead, and the effect reads as handled. Without the conjunct,
// the cheapest way to turn row `population` green is to add a token and some
// guards and no cleanup — a diff that looks exactly like the repair and
// performs none of it. `Account.js:96`-`:100` and `CombInvite.js:83`-`:85`
// are both effects that return nothing today, so that is the near-miss, not
// a hypothetical.
//
// MEASURED AT main@e97a89b: adding the conjunct moves NO site. The one live
// guard in the population's files is `HoneycombTab.js`'s `cancelled`, backed
// by the cleanup at `:616`-`:618`. A widening with no verdict change is the
// shape a repair should have; row `cleanupBacking` is what proves it is
// nonetheless load-bearing, since a rule with no live subject is otherwise
// indistinguishable from a rule that does nothing.
//
// WHAT THIS GATE CANNOT SEE — QUOTE THE NUMBER WITH THIS ATTACHED
//
// The population is TWENTY EFFECT-REACHABLE SITES. The words are load-bearing
// and a bare twenty reads as the tree's total, which it is not.
//
//   v1 of this predicate was scoped to token-DECLARING function scopes and
//   scored `main@84df072` at ZERO — the tree the whole finding was built on.
//   A finder keyed on where a token exists measures the repair, not the risk.
//   Every predicate here has been run against a tree known to carry the
//   hazard before being trusted; rows `hazardPositive` and `perAwaitGuard`
//   are that discipline made permanent, in-band, and falsifiable, instead of
//   a sentence in a message.
//
//   This predicate is rooted at effects and therefore CANNOT SEE HANDLER-ONLY
//   CONCURRENCY, which the arc established is the more reachable class — a
//   second tap needs no navigation. Named exclusions, asserted by row
//   `rootDisclosure`: `FeedCard.js` (zero effect hooks in the file, so its
//   post-await writes drop out by construction) and `PackageOpen.handleSend`
//   (in no effect's call chain).
//
//   Widening the roots to every function handed to a JSX prop gives 101
//   across 18 files at `e97a89b`, measured. THAT NUMBER IS NOT A HAZARD
//   COUNT and it is deliberately not a row here. An effect is protected by a
//   cancellation token; a handler is protected by a re-entry busy flag; this
//   guard model knows only the first, so the handler-inclusive run flags
//   correctly serialised handlers — `HoneycombTab`'s `handleShareToday`
//   among them, which keeps its `loadAll` await inside its own guarded
//   frame. Baking 101 rows in would be an allowlist of known-false ones on
//   day one, and an allowlist is what makes a green gate unfalsifiable.
//   v3 is a GUARD-MODEL change, not a root-set change, and it has its
//   controls already: a model that greens `handleShareToday` and reds
//   `handleLikeToggled` (which releases its busy flag at the handoff, before
//   the work it triggered completes) is correct; any model scoring them the
//   same is not.
//
// WHY THE ROW IS A KEY AND NOT A COUNT
//
// Per Lumen's ENG-108 ruling, and for the reason that ruling gives: a count
// is green on a rotation. Repair one site, introduce another, and a tripwire
// reading `20` never moves. The row asserts the SORTED KEY —
// `file :: owner :: setter -> multiplicity` — recorded as a literal and
// moved only in the commit that justifies the move. A new site reds, a
// repaired site reds, and a swap reds. The count is printed in the summary
// line for reading and is asserted by nothing.
//
// ANCHORS ARE HANDLER IDENTITY, NEVER `file:line`. `owner` is the nearest
// enclosing NAMED function, or `<hook inline>` for a write sitting directly
// in an anonymous effect callback. A line-keyed table reds on any insertion
// above it, which trains the reader to move the literal without reading it —
// the failure `check-collector-null-class`'s own table carries.
//
// COMMENTS CANNOT SATISFY ANYTHING HERE. The walk is `@babel/parser`, so a
// setter call inside a comment or a string is not a CallExpression and never
// enters the universe. That is stronger than stripping code positions before
// matching, and row `commentImmunity` is its positive control — an untested
// negative claim about a parser is still a claim.
//
// MUTATION LEDGER — run at main@e97a89b, every row red under a mutation that
// removes the property it asserts. Re-run these, do not trust this block.
//
//   row              mutation                                        reds
//   ---------------  ----------------------------------------------  --------------------
//   population       add an unguarded post-await write to            population
//                    `WriteInbox.load`
//   population       land the ruled form-C repair at `:589` (hoist   population
//                    the await out of the setter's argument, guard)
//   population       ROTATION: do both at once. THE COUNT STAYS 20   population
//                    and the membership moves. A count tripwire is
//                    green here; this is why the row is a key
//   hazardPositive   break the predicate so it finds nothing AND     hazardPositive,
//                    empty EXPECTED_KEY to match. `population` goes   cleanupBacking,
//                    GREEN over an empty universe — the v1 failure    perAwaitGuard
//                    exactly, and this row is what catches it
//   guardNegative    stop setting `guarded` on a real guard          guardNegative (+2)
//   cleanupBacking   drop the `backed.has(...)` conjunct             cleanupBacking ALONE
//   perAwaitGuard    comment out `guarded = false` at the await —    perAwaitGuard (+1)
//                    one guard per FUNCTION instead of per await
//   commentImmunity  no in-gate mutation can make a parser see a
//                    comment. Control instead: the obvious
//                    alternative implementation, a text scan of
//                    everything after the first `await` for
//                    /\bset[A-Z]\w*\(/, returns THREE hits on
//                    F_COMMENT. The AST walk returns none
//   rootDisclosure   give `FeedCard.js` an effect reaching           rootDisclosure,
//                    `handleLike`                                     population
//   passIdGuard      drop the pass-id closure form from `isFlag`       passIdGuard ALONE
//   passIdGuard      read early-return guards in ONE polarity only —   passIdGuard ALONE
//                    the model before DES-45 corrected it
//   passIdGuard      drop backing for the pass-id form only            passIdGuard ALONE
//
// SCOPE HOLES, DISCLOSED
//
//   - Document-order scan. A guard inside a `try` marks the following `catch`
//     arm guarded.
//   - A token threaded into a helper as a PARAMETER is not recognised as a
//     guard, so a repair by that route leaves the site in the population.
//     THIS CLASS COST A FALSE GREEN ONCE ALREADY. Two more repair idioms were
//     unrecognised until this gate was run against `main + DES-45` before
//     either merged: a zero-arg closure comparing a `useRef` pass id, and an
//     early return in the `if (!flag) return;` polarity. Both are now read;
//     neither moved a site on main. A GUARD MODEL IS A CLAIM ABOUT EVERY WAY
//     SOMEBODY MIGHT WRITE THE REPAIR, and the ones it cannot see it reports
//     as unrepaired, in the literal, green. Run this gate against a branch
//     that REPAIRS a site before that branch merges — a finder is tested by
//     trees that carry the hazard, and a guard model by trees that fix it.
//   - Two anonymous effect callbacks in one file writing the same setter
//     unguarded merge into one `<hook inline>` row.
//   - The walk is `src/**` only. This file lives under `scripts/`, so the
//     fixtures below are outside the population by construction.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const parser = require('@babel/parser');

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');

const FN = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
  'ObjectMethod',
  'ClassMethod',
]);
const EFFECT = new Set(['useEffect', 'useFocusEffect', 'useLayoutEffect']);

const unwrap = (n) => {
  if (!n) return null;
  if (FN.has(n.type)) return n;
  if (
    n.type === 'CallExpression' &&
    n.callee?.type === 'Identifier' &&
    (n.callee.name === 'useCallback' || n.callee.name === 'useMemo')
  ) {
    return unwrap(n.arguments[0]);
  }
  return null;
};

// Names assigned inside a function this effect callback RETURNS. `cancelled = true`
// in `return () => { cancelled = true; }` backs the token; a `.current` write backs
// a ref cell. An effect that returns nothing backs nothing, which is the point.
const cleanupWriters = (cb) => {
  const backed = new Set();
  const collect = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(collect);
    if (!n.type) return;
    if (n.type === 'AssignmentExpression') {
      if (n.left.type === 'Identifier') backed.add(n.left.name);
      if (n.left.type === 'MemberExpression' && n.left.property?.name === 'current' && n.left.object?.type === 'Identifier') {
        backed.add(n.left.object.name);
      }
    }
    for (const k of Object.keys(n)) {
      if (k === 'loc' || k.endsWith('Comments')) continue;
      collect(n[k]);
    }
  };
  const findReturns = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(findReturns);
    if (!n.type) return;
    if (FN.has(n.type) && n !== cb) return; // a nested function's returns are not the effect's
    if (n.type === 'ReturnStatement' && n.argument && FN.has(n.argument.type)) collect(n.argument);
    for (const k of Object.keys(n)) {
      if (k === 'loc' || k.endsWith('Comments')) continue;
      findReturns(n[k]);
    }
  };
  // An arrow with an expression body — `useEffect(() => subscribe(), [])` — returns
  // a value that is not a function literal; nothing to collect, and nothing backed.
  findReturns(cb.body);
  return backed;
};

// THE PREDICATE. One implementation, used by the population row and by every
// fixture control below, so a control that passes is a statement about the
// code the population row actually runs.
export function findUnguarded(src, label) {
  const ast = parser.parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  const named = new Map();
  const falseLets = new Map();
  const refCells = new Set();
  const guardFns = new Map(); // name -> ref cells it reads as `.current`
  const effectRoots = [];

  (function walk(n, chain) {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach((c) => walk(c, chain));
    if (!n.type) return;
    const next = FN.has(n.type) ? [...chain, n] : chain;
    const host = next[next.length - 1];
    if (n.type === 'VariableDeclarator' && n.id?.type === 'Identifier') {
      const fn = unwrap(n.init);
      if (fn) named.set(n.id.name, fn);
      if (n.init?.type === 'CallExpression' && n.init.callee?.type === 'Identifier' && n.init.callee.name === 'useRef') {
        refCells.add(n.id.name);
      }
      // A zero-argument local predicate whose body reads a ref cell as `X.current`
      // IS a guard test — `const current = () => pass === passRef.current;` then
      // `if (!current()) return;`. DES-45's pass-id idiom, and the generalisation
      // is the shape rather than the name. A monotonic id is a STRONGER token than
      // a boolean: it survives the re-render its own writes cause, and one cancel
      // point retires whichever pass is in flight. A guard model that cannot see it
      // reports a correct repair as unrepaired — green, and false.
      const pred = unwrap(n.init);
      if (pred && pred.params.length === 0) {
        const reads = new Set();
        (function r(x) {
          if (!x || typeof x !== 'object') return;
          if (Array.isArray(x)) return x.forEach(r);
          if (!x.type) return;
          if (x.type === 'MemberExpression' && x.property?.name === 'current' && x.object?.type === 'Identifier') {
            reads.add(x.object.name);
          }
          for (const k of Object.keys(x)) {
            if (k === 'loc' || k.endsWith('Comments')) continue;
            r(x[k]);
          }
        })(pred.body);
        if (reads.size) guardFns.set(n.id.name, reads);
      }
      if (n.init?.type === 'BooleanLiteral' && n.init.value === false && host) {
        if (!falseLets.has(host)) falseLets.set(host, new Set());
        falseLets.get(host).add(n.id.name);
      }
    }
    if (n.type === 'FunctionDeclaration' && n.id?.type === 'Identifier') named.set(n.id.name, n);
    if (n.type === 'CallExpression' && n.callee?.type === 'Identifier' && EFFECT.has(n.callee.name)) {
      const cb = unwrap(n.arguments[0]);
      if (cb) effectRoots.push({ fn: cb, chain: next, hook: n.callee.name });
    }
    for (const k of Object.keys(n)) {
      if (k === 'loc' || k.endsWith('Comments')) continue;
      walk(n[k], next);
    }
  })(ast, []);

  const scope = [];
  const seen = new Set();
  const push = (fn, chain, owner, backed, depth) => {
    if (!fn || seen.has(fn) || depth > 3) return;
    seen.add(fn);
    scope.push({ fn, chain, owner, backed });
    (function calls(n) {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) return n.forEach(calls);
      if (!n.type) return;
      if (n.type === 'CallExpression' && n.callee?.type === 'Identifier' && named.has(n.callee.name)) {
        push(named.get(n.callee.name), chain, n.callee.name, backed, depth + 1);
      }
      for (const k of Object.keys(n)) {
        if (k === 'loc' || k.endsWith('Comments')) continue;
        calls(n[k]);
      }
    })(fn.body);
  };
  for (const r of effectRoots) {
    push(r.fn, r.chain, `<${r.hook} inline>`, cleanupWriters(r.fn), 0);
  }

  const hits = [];
  for (const { fn, chain, owner, backed } of scope) {
    const flags = new Set();
    for (const a of [...chain, fn]) for (const g of falseLets.get(a) || []) flags.add(g);
    let seenAwait = false;
    let guarded = false;
    (function scan(n) {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) return n.forEach(scan);
      if (!n.type) return;
      if (FN.has(n.type)) return;
      if (n.type === 'IfStatement') {
        // A guard names a cancellation flag AND that flag has a cleanup writer.
        // Drop the second conjunct and a decorative repair greens `population`.
        const isFlag = (e) =>
          (e?.type === 'Identifier' && flags.has(e.name) && backed.has(e.name)) ||
          (e?.type === 'MemberExpression' &&
            e.property?.name === 'current' &&
            e.object?.type === 'Identifier' &&
            refCells.has(e.object.name) &&
            backed.has(e.object.name)) ||
          (e?.type === 'CallExpression' &&
            e.callee?.type === 'Identifier' &&
            guardFns.has(e.callee.name) &&
            [...guardFns.get(e.callee.name)].some((c) => refCells.has(c) && backed.has(c)));
        // AN EARLY RETURN ON A FLAG TEST GUARDS THE REMAINDER, IN EITHER
        // POLARITY. `if (cancelled) return;` and `if (!current()) return;` are
        // the same statement about the code below them — one names the bad
        // case as a boolean, the other names the good case as an id match.
        // Reading only the un-negated form reports DES-45's repair as no
        // repair at all.
        const early = JSON.stringify(n.consequent).includes('"ReturnStatement"');
        const negated =
          n.test.type === 'UnaryExpression' && n.test.operator === '!' && isFlag(n.test.argument);
        if ((isFlag(n.test) || negated) && early) {
          guarded = true;
          scan(n.alternate);
          return;
        }
        if (negated) {
          const s = guarded;
          guarded = true;
          scan(n.test.argument);
          scan(n.consequent);
          guarded = s;
          scan(n.alternate);
          return;
        }
      }
      if (n.type === 'AwaitExpression') {
        scan(n.argument);
        seenAwait = true;
        guarded = false; // ONE GUARD PER AWAIT: the token is re-read at a point the code never reaches again
        return;
      }
      if (n.type === 'CallExpression') {
        if (FN.has(n.callee?.type)) {
          for (const a of n.arguments) scan(a);
          scan(n.callee.body); // an IIFE runs inline; its writes are this pass's
          return;
        }
        if (n.callee?.type === 'Identifier' && /^set[A-Z]/.test(n.callee.name)) {
          for (const a of n.arguments) scan(a); // an await inside the setter's OWN argument list still counts
          if (seenAwait && !guarded) hits.push({ owner, setter: n.callee.name, line: n.loc.start.line });
          return;
        }
      }
      for (const k of Object.keys(n)) {
        if (k === 'loc' || k.endsWith('Comments')) continue;
        scan(n[k]);
      }
    })(fn.body);
  }
  void label;
  return { hits, effectRoots: effectRoots.length, owners: new Set(scope.map((s) => s.owner)) };
}

const jsFiles = [];
(function w(d) {
  for (const e of readdirSync(d).sort()) {
    const p = join(d, e);
    statSync(p).isDirectory() ? w(p) : /\.jsx?$/.test(e) && jsFiles.push(p);
  }
})(SRC);

const tally = new Map();
const perFile = new Map();
for (const f of jsFiles) {
  const rel = relative(SRC, f);
  const { hits } = findUnguarded(readFileSync(f, 'utf8'), rel);
  for (const h of hits) {
    const key = `${rel} :: ${h.owner} :: ${h.setter}`;
    tally.set(key, (tally.get(key) || 0) + 1);
    perFile.set(rel, (perFile.get(rel) || 0) + 1);
  }
}
const KEY = [...tally.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, n]) => `${k} -> ${n}`);

// --- THE KEY, at main@e97a89b -------------------------------------------
// Twenty effect-reachable sites, five files. Sorted; multiplicity explicit.
// MOVED ONLY IN THE COMMIT THAT JUSTIFIES THE MOVE, and the diff on this
// literal is the review. Form and repair per site live in ENG-107.
const EXPECTED_KEY = [
  'screens/Account.js :: refreshNudgeState :: setNudgeState -> 3',
  'screens/CombInvite.js :: load :: setPreview -> 1',
  'screens/CombInvite.js :: load :: setStatus -> 3',
  'screens/HoneycombTab.js :: <useFocusEffect inline> :: setAlreadySharedToday -> 1',
  'screens/HoneycombTab.js :: loadAll :: setConnections -> 1',
  'screens/HoneycombTab.js :: loadAll :: setFeed -> 1',
  'screens/HoneycombTab.js :: loadAll :: setFeedArrivalKey -> 1',
  'screens/HoneycombTab.js :: loadAll :: setIncomingRequests -> 1',
  'screens/HoneycombTab.js :: loadAll :: setLoading -> 1',
  'screens/HoneycombTab.js :: loadAll :: setSendEvents -> 1',
  'screens/HoneycombTab.js :: loadAll :: setWeekFeed -> 1',
  'screens/ReceivedPackages.js :: load :: setPackages -> 1',
  'screens/ReceivedPackages.js :: load :: setReadState -> 1',
  'screens/WriteInbox.js :: load :: setReadState -> 1',
  'screens/WriteInbox.js :: load :: setReceived -> 1',
  'screens/WriteInbox.js :: load :: setSent -> 1',
];

// --- Fixtures ------------------------------------------------------------
// Every control below runs `findUnguarded`, the same function the population
// row runs. A control over a private copy of the predicate would certify a
// world the size of that copy.
const F_HAZARD = `
  const Screen = () => {
    const load = async () => {
      const rows = await Store.read();
      setRows(rows);
    };
    useFocusEffect(useCallback(() => { load(); }, []));
    useEffect(() => {
      (async () => {
        const n = await Store.count();
        setCount(n);
      })();
    }, []);
    return null;
  };
`;
const F_REPAIRED = `
  const Screen = () => {
    useEffect(() => {
      let cancelled = false;
      (async () => {
        const rows = await Store.read();
        if (cancelled) return;
        setRows(rows);
        const n = await Store.count();
        if (cancelled) return;
        setCount(n);
      })();
      return () => { cancelled = true; };
    }, []);
    return null;
  };
`;
// F_REPAIRED with the cleanup deleted. Identical guards, all of them dead.
const F_DECORATIVE = F_REPAIRED.replace('      return () => { cancelled = true; };\n', '');
// The `:581`/`:589` shape verbatim: guarded after await one, and a second
// await inside the next setter's own argument list with no guard available.
const F_PER_AWAIT = `
  const Screen = () => {
    useFocusEffect(useCallback(() => {
      let cancelled = false;
      (async () => {
        const today = await EntryStore.getEntry(now);
        if (cancelled) return;
        setTodayEntry(today);
        setAlreadySharedToday(today ? await Honeycomb.hasSharedDate(iso) : false);
      })();
      return () => { cancelled = true; };
    }, []));
    return null;
  };
`;
// DES-45's pass-id idiom: a monotonic `useRef` counter, a zero-arg closure
// comparing against it, and a cleanup that advances the id. A STRONGER token
// than a boolean — it survives the re-render its own writes cause, and one
// cancel point retires whichever pass is in flight, effect's or retry's.
const F_PASS_ID = `
  const Screen = () => {
    const passRef = useRef(0);
    const load = () => {
      const pass = (passRef.current += 1);
      const current = () => pass === passRef.current;
      setStatus('loading');
      return (async () => {
        try {
          const next = await Store.preview(code);
          if (!current()) return;
          setPreview(next);
          setStatus('ready');
        } catch (err) {
          if (!current()) return;
          setStatus('unreachable');
        }
      })();
    };
    useEffect(() => { load(); return () => { passRef.current += 1; }; }, [code]);
    return null;
  };
`;
// The same idiom with the cleanup deleted. The closure still compares, and
// still always returns true, so every write lands. Backing is enforced on the
// REF CELL, not on the closure that reads it.
const F_PASS_ID_NO_CLEANUP = F_PASS_ID.replace('return () => { passRef.current += 1; };', '');
const F_COMMENT = `
  const Screen = () => {
    useEffect(() => {
      // const rows = await Store.read(); setRows(rows);
      /* setCount(await Store.count()); */
      const sample = 'const n = await Store.count(); setCount(n);';
      return () => {};
    }, []);
    return null;
  };
`;

let pass = 0;
let fail = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? (pass += 1) : (fail += 1);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
};
const sig = (src) => findUnguarded(src, 'fixture').hits.map((h) => `${h.owner}::${h.setter}`).sort();

// --- row: population -----------------------------------------------------
// Set equality, both directions. A new site, a repaired site and a swap all
// red; the count alone would survive the third.
check(
  'population — the effect-reachable unguarded post-await write set matches its recorded key',
  KEY,
  EXPECTED_KEY
);

// --- row: hazardPositive -------------------------------------------------
// v1 scored the tree the finding was built on at zero. This is that lesson
// as a row: the predicate must find the hazard in source that carries it,
// or `population` is green over an empty universe and says so in the same
// words it uses when the tree is clean.
check(
  'hazardPositive — the predicate finds both unguarded writes in a fixture known to carry the hazard',
  sig(F_HAZARD),
  ['<useEffect inline>::setCount', 'load::setRows']
);

// --- row: guardNegative --------------------------------------------------
// The other polarity. Without it the predicate could flag every post-await
// write and both `hazardPositive` and `population` would still read green.
check(
  'guardNegative — a real guard per await, with a cleanup that sets the token, clears the same fixture',
  sig(F_REPAIRED),
  []
);

// --- row: cleanupBacking -------------------------------------------------
// THE ROW THAT KEEPS `population` HONEST. Delete only the cleanup and the
// guards stay in the diff, read as handling, and do nothing. If this row
// ever passes with `[]` the conjunct is gone and the cheapest way to green
// this gate is a repair that changes no behaviour.
check(
  'cleanupBacking — the same guards with no cleanup writer are not guards, and both writes return',
  sig(F_DECORATIVE),
  ['<useEffect inline>::setCount', '<useEffect inline>::setRows']
);

// --- row: perAwaitGuard --------------------------------------------------
// One guard per await, not one per function — and the await inside a
// setter's own argument list, which has no statement position to guard in.
check(
  'perAwaitGuard — a guard before the first await does not cover a write after the second',
  sig(F_PER_AWAIT),
  ['<useFocusEffect inline>::setAlreadySharedToday']
);

// --- row: passIdGuard ---------------------------------------------------
// A GUARD MODEL THAT CANNOT SEE A REPAIR REPORTS THE REPAIRED SURFACE AS
// UNREPAIRED, and reports it GREEN, in the literal the whole gate rests on.
// Found by running this gate against `main + pixel/des45-comb-invite-pass`
// before either merged: DES-45 repairs all four `CombInvite` sites with this
// idiom, and the first model flagged three of them anyway.
check(
  'passIdGuard — a zero-arg closure comparing a backed useRef pass id is a guard',
  sig(F_PASS_ID),
  []
);
check(
  'passIdGuard/backing — the same idiom with no cleanup advancing the id is not a guard',
  sig(F_PASS_ID_NO_CLEANUP),
  ['load::setPreview', 'load::setStatus', 'load::setStatus']
);

// --- row: commentImmunity ------------------------------------------------
// Positive control for a negative claim about the parser.
check(
  'commentImmunity — hazards written only into comments and string literals are not in the universe',
  sig(F_COMMENT),
  []
);

// --- row: rootDisclosure -------------------------------------------------
// The bound, asserted rather than described. Both exclusions are named in
// the header; if either stops holding, those handler-only writes join the
// effect-reachable population and this row says which sentence is now false.
const feedCard = findUnguarded(readFileSync(join(SRC, 'components/FeedCard.js'), 'utf8'), 'FeedCard.js');
const packageOpen = findUnguarded(readFileSync(join(SRC, 'screens/PackageOpen.js'), 'utf8'), 'PackageOpen.js');
check(
  'rootDisclosure — the two named handler-only exclusions still hold: FeedCard has no effect, handleSend is in no effect chain',
  [feedCard.effectRoots, packageOpen.owners.has('handleSend')],
  [0, false]
);

const total = [...tally.values()].reduce((a, b) => a + b, 0);
const files = [...perFile.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([f, n]) => `${f} ${n}`);
console.log(`\n${pass} passed, ${fail} failed`);
console.log(
  `(${jsFiles.length} files walked under src/; ${total} EFFECT-REACHABLE unguarded post-await writes ` +
    `across ${perFile.size} files — ${files.join(', ')}. Handler-only concurrency is OUT OF SCOPE ` +
    `by construction; see the header before quoting this number.)`
);
if (fail > 0) process.exit(1);
