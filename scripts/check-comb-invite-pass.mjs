// DES-45 (issue 1b4724ca…) — CombInvite's landing pass writes a subject and a
// claim from one unguarded run.
//
//   npm run check:comb-invite-pass
//
// The defect: `CombInviteLandingScreen`'s preview effect keys on a route param,
// so a second deep link lands on the MOUNTED screen and starts a second pass
// with no remount. `load` wrote `setStatus('notFound')`, `setPreview(next)`,
// `setStatus('ready')` and `setStatus('unreachable')` after its one await, and
// the effect returned nothing, so no pass was ever told it had been superseded.
// `preview` is the subject and `status` is the claim about it: two codes in
// flight leave the claim from one pass over the subject from another. Found by
// Pixel, population verified by Vector, recorded in ENG-107's table as form A,
// ruled by Lumen in #Collab thread `0f727f7c` (2026-09-07).
//
// Every spec cited in this file lives in the design workspace, not at any path
// in this repo; nothing under `GUIDES/` is in this tree, so a bare `GUIDES/...`
// address opens nothing for whoever reads this file next.
//
// WHAT THIS GATE CANNOT SEE. The ticket's acceptance row 1 is a gesture: two
// deep links, the second landing on the mounted screen, and the screen showing
// the second code's preview. A structural gate cannot perform a gesture. What
// is here is that every write after the suspension point is guarded and that
// the token has a cleanup that sets it — the machinery the gesture depends on.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { parse } from '@babel/parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => path.relative(ROOT, p);
const FILE = path.join(ROOT, 'src/screens/CombInvite.js');

let pass = 0;
const failures = [];
const ok = (m) => { pass += 1; console.log(`  ok  ${m}`); };
const bad = (m, d) => { failures.push(`${m}${d ? ` — ${d}` : ''}`); console.log(`  FAIL ${m}${d ? ` — ${d}` : ''}`); };

const source = await readFile(FILE, 'utf8');
const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
const at = (n) => n.loc?.start?.line ?? 0;
const text = (n) => source.slice(n.start, n.end);

const walk = (node, visit, stack = []) => {
  if (!node || typeof node.type !== 'string') return;
  visit(node, stack);
  const next = [...stack, node];
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key.endsWith('Comments')) continue;
    const v = node[key];
    if (Array.isArray(v)) v.forEach((c) => walk(c, visit, next));
    else if (v && typeof v.type === 'string') walk(v, visit, next);
  }
};
const collect = (root, pred) => {
  const out = [];
  walk(root, (n, s) => { if (pred(n, s)) out.push({ node: n, stack: s }); });
  return out;
};

// --- Universe -----------------------------------------------------------
const screen = collect(ast.program, (n) => n.type === 'VariableDeclarator' && n.id.name === 'CombInviteLandingScreen')[0];
if (!screen) {
  bad('universe: CombInviteLandingScreen resolves', 'not found; every row below would quantify over the empty set');
  console.log(`\ncheck-comb-invite-pass: ${pass} passed, ${failures.length} failed`);
  process.exit(1);
}
const body = screen.node.init;
ok(`universe: CombInviteLandingScreen at ${rel(FILE)}:${at(screen.node)}`);

const loadDecl = collect(body, (n) => n.type === 'VariableDeclarator' && n.id.name === 'load')[0];
if (!loadDecl) {
  bad('universe: `load` resolves in the screen', 'not found');
  console.log(`\ncheck-comb-invite-pass: ${pass} passed, ${failures.length} failed`);
  process.exit(1);
}
const load = loadDecl.node.init;
ok(`universe: \`load\` at ${rel(FILE)}:${at(loadDecl.node)}`);

// --- A. The token -------------------------------------------------------
console.log('\nA. the token');

// A1. `load` is also the retry handler, so a parameter is a hazard rather than
// a convenience: `onRetry={load}` hands it a press event, and a token read off
// an event object is `undefined`, which is falsy, which is every write landing.
// This row is the reason the token cannot be passed in as an argument.
let tokenName = null;
{
  if (load.params.length !== 0) {
    bad('A1 `load` takes no parameter', `${load.params.length} param(s): ${load.params.map(text).join(', ')} — it is bound to onRetry, which supplies a press event`);
  } else {
    ok('A1 `load` takes no parameter, so the retry press event cannot arrive as a token');
  }
  const retry = collect(body, (n) => n.type === 'JSXAttribute' && n.name.name === 'onRetry')[0];
  if (!retry) bad('A1b `load` is still the retry handler', 'no `onRetry` attribute — A1 exists because of this binding; if it is gone, re-derive rather than trust');
  else if (text(retry.node.value).replace(/[{}]/g, '') !== 'load') bad('A1b the retry handler is `load`', `it is \`${text(retry.node.value)}\``);
  else ok(`A1b \`onRetry={load}\` still binds them (${rel(FILE)}:${at(retry.node)})`);
}

// A2. A ref, not state: the token has to survive the re-render its own writes
// cause, and a state token would be a stale closure read on the pass that most
// needs it. An id rather than a boolean, so ONE cancel point retires whichever
// pass is in flight, the effect's or the retry's.
{
  const refs = collect(body, (n) => n.type === 'VariableDeclarator' && n.init?.type === 'CallExpression' && n.init.callee?.name === 'useRef');
  const states = collect(body, (n) => n.type === 'VariableDeclarator' && n.init?.type === 'CallExpression' && n.init.callee?.name === 'useState');
  const tokenish = refs.filter((r) => /pass|token|run|gen/i.test(r.node.id.name ?? ''));
  const stateTokens = states.filter((s) => /pass|token|run|gen/i.test(s.node.id.elements?.[0]?.name ?? ''));
  if (stateTokens.length) {
    bad('A2 the token is a ref, not state', `${stateTokens.map((s) => s.node.id.elements[0].name).join(', ')} is useState — a state token is read through the closure of the pass it is meant to cancel`);
  } else if (tokenish.length !== 1) {
    bad('A2 exactly one ref holds the pass token', `found ${tokenish.length}`);
  } else {
    tokenName = tokenish[0].node.id.name;
    ok(`A2 the token is \`${tokenName}\`, a useRef (${rel(FILE)}:${at(tokenish[0].node)})`);
  }
}

// --- B. One guard per await --------------------------------------------
console.log('\nB. every write after the suspension point is guarded');

const awaits = collect(load, (n) => n.type === 'AwaitExpression');
if (awaits.length !== 1) {
  bad('B0 `load` has exactly one suspension point', `${awaits.length} await(s) — the rows below partition writes on ONE await; more than one means this gate is modelling the wrong shape and must be rewritten, not worked around`);
} else {
  ok(`B0 one await in \`load\` (${rel(FILE)}:${at(awaits[0].node)})`);
}

// The universal. Every `set*` call inside `load` is the population; position
// relative to the await is the partition; and each post-await ARM must carry
// its own guard before its first write. Not a list of the four known writes:
// a new failure arm is exactly the thing that would arrive unguarded, and a
// list has a null class.
if (awaits.length !== 1 || !tokenName) {
  bad(
    'B section can run at all',
    `${awaits.length !== 1 ? `${awaits.length} await(s) rather than 1` : 'the pass token did not resolve at A2'} — the write partition below cannot be computed, so nothing here is measured. This row exists because the section used to print nothing at all in that case, which reads exactly like a green section.`
  );
} else {
  const awaitEnd = awaits[0].node.end;
  const writes = collect(load, (n) => n.type === 'CallExpression' && /^set[A-Z]/.test(n.callee?.name ?? ''));
  const guards = collect(load, (n) => {
    if (n.type !== 'IfStatement') return false;
    if (!text(n.test).includes('current') && !text(n.test).includes(tokenName)) return false;
    return collect(n.consequent, (c) => c.type === 'ReturnStatement').length > 0;
  });

  if (writes.length === 0) {
    bad('B1 the write universe is non-empty', 'no `set*` calls found in `load`, so every claim below would be vacuous');
  } else {
    const pre = writes.filter((w) => w.node.end <= awaitEnd);
    const post = writes.filter((w) => w.node.end > awaitEnd);
    ok(`B1 ${writes.length} write(s) in \`load\`: ${pre.length} before the await, ${post.length} after`);

    // Partition the post-await writes by the try/catch arm that holds them.
    // Both arms are reached only through the one suspension point and both
    // must guard: `status` and `preview` are one pair, so a superseded pass
    // writes NEITHER, its failure arms included. A stale `notFound` is the
    // wrong-claim arm and it is the one this repair exists for.
    const tryStmt = collect(load, (n) => n.type === 'TryStatement')[0];
    if (!tryStmt) {
      bad('B2 `load` has a try/catch', 'the catch arm is where the wrong-claim write lives');
    } else {
      const arms = [
        ['try arm', tryStmt.node.block],
        ['catch arm', tryStmt.node.handler?.body],
      ];
      const within = (n, root) => root && n.start >= root.start && n.end <= root.end;
      let armed = 0;
      for (const [label, root] of arms) {
        if (!root) { bad(`B2 the ${label} exists`); continue; }
        const armWrites = post.filter((w) => within(w.node, root));
        if (armWrites.length === 0) { ok(`B2 ${label}: no post-await write to guard`); armed += 1; continue; }
        const armGuards = guards.filter((g) => within(g.node, root) && g.node.start > awaitEnd);
        const first = Math.min(...armWrites.map((w) => w.node.start));
        const covering = armGuards.filter((g) => g.node.end < first);
        if (covering.length === 0) {
          bad(
            `B2 the ${label}'s writes are guarded`,
            `${armWrites.length} write(s) at :${armWrites.map((w) => at(w.node)).join(', ')} with no token read between the await and the first of them`
          );
        } else {
          armed += 1;
          ok(`B2 ${label}: ${armWrites.length} write(s) at :${armWrites.map((w) => at(w.node)).join(', ')}, all behind a token read at :${at(covering[0].node)}`);
        }
      }
      void armed;
      // B3 is not "both arms are armed" — B2 already says that per arm, and a
      // row that only aggregates its neighbours reds twice for one fact and
      // adds nothing. The independent property is that no guard is read
      // BEFORE the suspension point: such a guard is true by construction at
      // the moment it runs, proves nothing about what happened during the
      // await, and would leave every B2 row green while reading like a
      // repair. "One guard per await, not one per function" is this row.
      const early = guards.filter((g) => g.node.end <= awaitEnd);
      if (early.length) {
        bad(
          'B3 no token read precedes the suspension point',
          `${early.length} guard(s) at :${early.map((g) => at(g.node)).join(', ')} — a token read before the await is true when it runs and says nothing about what happened during it`
        );
      } else {
        ok(`B3 no token read precedes the await — every one of the ${guards.length} guard(s) sits after the suspension point it is about`);
      }
    }

    // And the pre-await write must stay pre-await. `setStatus('loading')` is
    // this pass announcing itself, and it is correct precisely because it is
    // synchronous with the call: nothing has suspended yet, so this pass IS
    // the current one. Moving it past the await would make it a claim needing
    // a guard, which is a different design and not this one.
    if (pre.length !== 1) bad('B4 exactly one write precedes the await', `${pre.length} — this pass announcing itself is synchronous with the call, and everything else is a claim about a result`);
    else ok(`B4 one pre-await write, \`${pre[0].node.callee.name}\` at :${at(pre[0].node)}, needing no guard because nothing has suspended yet`);
  }
}

// --- C. The cleanup that makes the token load-bearing -------------------
console.log('\nC. the cleanup');

// A token declared without a cleanup that sets it is decorative. The effect
// keys on a route param, so the cleanup is the ONLY thing that runs when a
// second deep link supersedes the first without a remount.
{
  const effects = collect(body, (n) => n.type === 'CallExpression' && n.callee?.name === 'useEffect');
  const previewEffects = effects.filter((e) => text(e.node).includes('load('));
  if (previewEffects.length !== 1) {
    bad('C1 exactly one effect runs `load`', `found ${previewEffects.length}`);
  } else {
    const eff = previewEffects[0].node;
    const cb = eff.arguments[0];
    const returns = collect(cb, (n) => n.type === 'ReturnStatement' && n.argument);
    const deps = eff.arguments[1];
    if (returns.length === 0) {
      bad('C1 the effect returns a cleanup', 'it returns nothing, so no pass is ever told it was superseded — the original defect');
    } else {
      if (!tokenName) {
        bad('C1 the cleanup writes the token', 'the token did not resolve at A2, so this row cannot ask its question. The cleanup may well be correct; this red is A2 propagating, not a finding about the cleanup');
      } else {
      const writesToken = collect(returns[0].node, (n) =>
        (n.type === 'AssignmentExpression' || n.type === 'UpdateExpression') && text(n.type === 'UpdateExpression' ? n.argument : n.left).startsWith(tokenName)
      ).length > 0;
      if (!writesToken) {
        bad('C1 the cleanup writes the token', `cleanup is \`${text(returns[0].node).replace(/\s+/g, ' ').slice(0, 80)}\` — a cleanup that does not retire the pass leaves the token decorative`);
      } else {
        ok(`C1 the effect's cleanup advances \`${tokenName}\` (${rel(FILE)}:${at(returns[0].node)})`);
      }
      }
    }
    if (!deps || deps.type !== 'ArrayExpression') {
      bad('C2 the effect declares its dependencies');
    } else {
      const names = deps.elements.map(text);
      if (!names.includes('inviteCode')) {
        bad('C2 the effect keys on the route param', `deps are [${names.join(', ')}] — keying on the param is WHY a second deep link needs no remount, and it is the premise of this whole row`);
      } else {
        ok(`C2 the effect keys on [${names.join(', ')}], which is the premise: a second deep link starts a second pass with no remount`);
      }
    }
  }
}

// =======================================================================
// MUTATIONS — `node scripts/run-mutations.mjs scripts/check-comb-invite-pass.mjs`
// =======================================================================
export const MUTATIONS = [
  {
    row: 'A1',
    why: 'a parameter comes back, so `onRetry={load}` supplies a press event and a token read off it is undefined, which is falsy, which is every write landing',
    file: 'src/screens/CombInvite.js',
    from: '  const load = () => {',
    to: '  const load = (pass_) => {',
  },
  {
    row: 'A2',
    why: 'the token becomes state, so the pass most in need of cancelling reads it through its own stale closure',
    file: 'src/screens/CombInvite.js',
    from: '  const passRef = useRef(0);',
    to: '  const [passState, setPassState] = useState(0);\n  const passRef = { current: 0 };\n  void setPassState;',
  },
  {
    row: 'B2',
    why: "the catch arm's guard is removed, so a superseded pass still writes `unreachable` — the failure arm writing the claim alone is the whole defect",
    file: 'src/screens/CombInvite.js',
    from: '        if (!current()) return;\n        console.warn',
    to: '        console.warn',
  },
  {
    row: 'B3',
    why: 'a guard is read before the await, where it is true by construction: it leaves every B2 row green and reads like a repair while proving nothing about what happened during the suspension',
    file: 'src/screens/CombInvite.js',
    from: "    setStatus('loading');\n    return (async () => {",
    to: "    setStatus('loading');\n    if (!current()) return undefined;\n    return (async () => {",
  },
  {
    row: 'B2',
    why: 'the try arm loses its guard while the catch keeps one, so a partial repair reads as a repair',
    file: 'src/screens/CombInvite.js',
    from: '        if (!current()) return;\n        if (!next) {',
    to: '        if (!next) {',
  },
  {
    row: 'B4',
    why: "the pass's own announcement moves past the await, where it is a claim about a result rather than a pass announcing itself, and it arrives unguarded",
    file: 'src/screens/CombInvite.js',
    from: "    setStatus('loading');\n    return (async () => {\n      try {\n        const next = await CombInviteStore.preview(inviteCode);",
    to: "    return (async () => {\n      try {\n        const next = await CombInviteStore.preview(inviteCode);\n        setStatus('loading');",
  },
  {
    row: 'C1',
    why: 'the cleanup goes and the token is decorative again: nothing ever retires an in-flight pass, which is the original defect exactly',
    file: 'src/screens/CombInvite.js',
    from: '    return () => {\n      passRef.current += 1;\n    };',
    to: '',
  },
  {
    row: 'C2',
    why: 'the effect stops keying on the route param, which is the premise the whole ticket rests on; a mount-only effect has a different hazard and this gate would be modelling the wrong screen',
    file: 'src/screens/CombInvite.js',
    from: '  }, [inviteCode]);',
    to: '  }, []);',
  },
  {
    row: null,
    why: 'the console.warn message reworded: legal, inside the guarded arm, and every row must hold through it',
    file: 'src/screens/CombInvite.js',
    from: "console.warn('Comb invite preview failed', err);",
    to: "console.warn('Comb invite preview did not load', err);",
  },
];

console.log(`\ncheck-comb-invite-pass: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
