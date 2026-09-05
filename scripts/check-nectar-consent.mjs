// Gate for DES-28 Deliverable 7 — the nectar surfaces' PRE-CONSENT ABSENCE.
//
//   npm run check:nectar-consent
//
// Every spec cited in this file lives in the design workspace, not at
// any path in this repo; nothing under `GUIDES/` is in this tree, so a
// bare `GUIDES/...` address opens nothing for whoever reads this file
// next.
//
// WHAT IT IS FOR, stated plainly because the gate is green today and will be
// green tomorrow: it arms a transition nobody is scheduled to notice. The
// same shape as check-legal-consent-gate.mjs, and for the same reason — the
// instruction it protects is otherwise a comment somebody has to remember.
//
// Deliverable 7 says every nectar surface is ABSENT before consent, on
// Apple 2.3.1(a) grounds. Absence is a claim with no pixels: the pre-consent
// state of this app is the app as it ships today, so there is no screen to
// review and no frame that could show the requirement being kept. The only
// way it survives contact with five future PRs is a gate that reds the first
// time a nectar surface renders outside the guard.
//
// SIX RULE GROUPS, and their honest strengths differ:
//
//   A  universe        the usual counts-before-loops (run-checks.mjs's
//                      requirement on gates).
//   B  word reserve    REAL and behavioural. Every rendered string matching
//                      the money lexicon must sit under the `nectarConsent`
//                      guard. Zero strings match today, so B is calibrated
//                      against a synthetic corpus with known verdicts —
//                      otherwise a broken regex and a clean tree are the
//                      same green.
//   C  default is NO   evaluates `hasNectarConsent` over the shapes a
//                      consent record can take, and checks the field it
//                      reads against the migration that declares the column.
//                      Evaluated, not regexed.
//   D  placement       for a surface whose container EXISTS, the declared
//                      anchor must still be there — a rename reds instead of
//                      silently orphaning a placement. For a surface whose
//                      container does NOT exist, either a named probe still
//                      finds nothing, or the entry declares itself
//                      unprobeable IN THE TREE. D3 is a declaration-
//                      completeness row and says so in its own label: an
//                      absence claim inherits the scope of the probe that
//                      produced it, and "no probe" is a scope of nothing.
//   E  query reserve   guards the ASK, not the render — B4's numeral hole
//                      (`{balance}` beside a drop glyph shows no word) cannot
//                      be closed by any rule that reads rendered strings, so
//                      E reads what a surface FETCHES instead. A numeral
//                      cannot exist client-side without a query, and every
//                      query in this tree names its source as a string
//                      literal. Population enumerated from the nectar
//                      migrations in tree, not a hand list.
//                        AUTHORITY LIVES AT THE RENDERED CONTROL, NOT THE
//                      QUERY (Pixel's §12.7/§12.7a correction, 2026-08-26): a
//                      store call is a statement, awaited in a handler body,
//                      and a statement cannot be an expression's `&&`/`?:`
//                      arm — 60 of 61 store calls on this tree take exactly
//                      that shape. So E asks whether the CONTROL wired to the
//                      call's enclosing handler is rendered under a guard,
//                      and treats the call as inheriting that authority, but
//                      ONLY IF EVERY REFERENCE TO THAT HANDLER IN ITS OWN
//                      FILE IS A LICENSED ONE. That is the exclusivity
//                      clause, ruled by Lumen 2026-09-05 and forward-ported
//                      from the 2026-08-26 finding that rule E greened its
//                      own worst case: a handler wired to a guarded control
//                      and ALSO called bare from a mount effect.
//                      Two objects — `nectar_consents`, `consent_to_nectar` —
//                      are exempted by property, not by call site: they are
//                      how consent is itself established or read, and gating
//                      either on `nectarConsent` reproduces the §10 bootstrap
//                      deadlock one layer down.
//   F  grant coupling  the one number this module hand-copies from the
//                      database. NECTAR_STARTER_GRANT_DROPS is the divisor
//                      Ruling 2's cap bound is built on, and it agreed with
//                      `nectar_starter_grant_drops()` only because someone
//                      read both. F reads the SQL literal out of the latest
//                      migration that DEFINES the function and asserts
//                      equality, so a DB-side re-ratification reds here
//                      instead of silently halving the ladder. Fails closed;
//                      the extractor is calibrated in both directions. F4
//                      covers what F1 leaves behind -- the `comment on
//                      function` is a CATALOG write, present tense, and the
//                      grant's own ratification record, so it must not be
//                      older than the definition it describes. Freshness
//                      only: F4 compares two filenames and reads no digit
//                      out of prose.
//
// WHAT THIS GATE CANNOT DO. It is lexical. A nectar surface that renders no
// string — a bare icon, an unlabelled pressable — is invisible to rule B.
// That is not hypothetical: DES-28 D3 is exactly such a surface (a 16pt drop
// icon). Rule D is what covers it, by anchor rather than by word, and rule D
// only covers surfaces someone remembered to declare in NECTAR_SURFACES. And
// rule E has a dynamic-identifier hole of its own — a wrapper module that
// builds a query name at runtime moves the literal, and the guard site, into
// the wrapper; nothing in this tree does that today (measured in E's own
// check below), but the day something does, E is blind to it exactly the way
// B is blind to a bare numeral.
// The population is a declaration; nothing here discovers a sixth surface.
//
// AND THE RENDER-AUTHORITY CHECK IS A WITHIN-FILE WALK, THE SAME LIMIT B6-B9
// ALREADY NAME FOR isUnderGuard. It traces a handler name to every JSX
// attribute feeding it IN THE SAME FILE the handler is declared in. A
// component that takes a handler AS A PROP and wires it to a control inside
// its OWN body — exactly NectarConsentSheet.js's shape, one file away from
// PackageOpen.js's `handleNectarAffirm` — has no such attribute in the
// handler's own file, so a genuine future case built that way would read as
// CANNOT-TELL and fail safe (red on correct code) rather than pass. Today
// that shape only exists for `consent_to_nectar()`, which is carved out by
// property before this check ever runs — so it is a latent limit, not a
// live hole, but the day D2's zap flow reuses the sheet's cross-file pattern
// for a money identifier, extend the wiring search across the prop boundary
// rather than trusting a red that may be a false one.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir, access } from 'node:fs/promises';
import { parse } from '@babel/parser';
import {
  POSITIONS,
  collectRenderedStrings,
  isUnderGuard,
  walkWithAncestry,
  PositionVocabularyError,
} from './lib/rendered-strings.mjs';
import {
  NECTAR_CONSENT_BOOTSTRAP_OBJECTS,
  NECTAR_CONSENT_FIELD,
  NECTAR_CONSENT_GUARD,
  NECTAR_CONSENT_SHEET_GUARD,
  NECTAR_LADDER_CAP_DROPS,
  NECTAR_LADDER_RUNGS,
  NECTAR_RESERVE,
  NECTAR_STARTER_GRANT_DROPS,
  NECTAR_SURFACES,
  NECTAR_UNCONSENTED_GUARD,
  hasNectarConsent,
} from '../src/constants/nectar.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let pass = 0;
let fail = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? (pass += 1) : (fail += 1);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
};

const reserve = NECTAR_RESERVE.map((r) => new RegExp(r.source, r.flags));
const matchesReserve = (s) => reserve.some((re) => re.test(s));

// --- A. Universe ---------------------------------------------------------
const sourceFiles = async (dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await sourceFiles(p)));
    else if (entry.name.endsWith('.js')) out.push(p);
  }
  return out;
};

// ONE FILE IS EXCLUDED, and it is this gate's own input. src/constants/
// nectar.js is prose ABOUT the surfaces — each entry's `note` says what the
// missing container is and why — and `constant` position collects every
// string literal in src/constants/ because that is where this app's authored
// copy lives. So the declaration of the rule matches the rule. That is not a
// defect in either; a rule that reds on its own statement cannot be written
// down at all.
//
// The exclusion is frozen at exactly one name so it cannot grow quietly, and
// it is CONTROLLED rather than trusted: D6 below asserts that nothing in the
// tree imports NECTAR_SURFACES, which is the only export whose values carry
// prose. `hasNectarConsent` and `NECTAR_CONSENT_GUARD` may be imported
// anywhere — they are a function and a name, and neither can reach a screen
// as text. The day a surface renders a declaration's own words, D6 reds and
// this exclusion has to be re-argued instead of quietly covering it.
const SELF = 'src/constants/nectar.js';
const allFiles = ['App.js', ...(await sourceFiles(path.join(ROOT, 'src'))).map((p) => path.relative(ROOT, p))].sort();
const files = allFiles.filter((f) => f !== SELF);
check('A1 source universe is non-empty (App.js + src/**/*.js)', files.length > 0, true);
check('A1a the one excluded file is this gate\'s own declaration module, and it is present', allFiles.filter((f) => f === SELF), [SELF]);

const parsed = [];
const parseFailures = [];
for (const rel of files) {
  try {
    const src = await readFile(path.join(ROOT, rel), 'utf8');
    parsed.push({ rel, src, ast: parse(src, { sourceType: 'module', plugins: ['jsx'] }) });
  } catch (e) {
    parseFailures.push(`${rel}: ${e.message}`);
  }
}
check('A2 every enumerated file parses', parseFailures, []);
check('A3 the declared surface population is non-empty', NECTAR_SURFACES.length > 0, true);

// --- B. The word reserve -------------------------------------------------
// SCOPE IS EVERY POSITION THE WALKER EMITS, including `alert` and
// `constant`, which check-demo-content-callsites deliberately excludes from
// its own rule 1. Its exclusion is right for its question and wrong for
// this one: it excludes them because a lexical guard cannot ENCLOSE a
// handler-bound or module-scope string, so requiring a guard there would red
// correct code. Here the required answer for those positions is not "guarded"
// but "absent" — a preset amount frozen in src/constants/ is a nectar surface
// whether or not any conditional could ever wrap it, and the copy for a
// feature nobody has consented to has no business being authored at module
// scope. So an unguardable position is a FAILURE here rather than an
// exemption, and the label says which kind of failure it is.
const GUARDABLE = new Set(['jsx-text', 'jsx-expr', 'prop']);
const allStrings = [];
const vocabularyErrors = [];
for (const { rel, ast } of parsed) {
  try {
    for (const s of collectRenderedStrings(ast, { file: rel, positions: POSITIONS })) {
      allStrings.push({ rel, ...s });
    }
  } catch (e) {
    if (!(e instanceof PositionVocabularyError)) throw e;
    vocabularyErrors.push(`${rel}: ${e.message}`);
  }
}
check('B1 every emitted position is declared in POSITIONS', vocabularyErrors, []);
check('B2 rendered-string universe is non-empty', allStrings.length > 0, true);

// B3 CALIBRATION. Zero strings in this tree match the reserve, so every
// behavioural row below passes over an empty set and would pass just as
// cleanly with a regex that matches nothing at all. This row is the control:
// the patterns are run against a fixed corpus whose verdicts are the measured
// facts recorded in constants/nectar.js, including the two real non-money
// uses of "drop" that are the reason singular `drop` is not in the reserve.
const CALIBRATION = [
  ['Send nectar', true],
  ['10 drops', true],
  ['Enter drops (1–1000)', true],
  ['Sarah zapped the entry about the hospital waiting room.', true],
  ['1 drop', true],
  ['When did {subject_name} drop everything for ', false],
  ['sitting with the friend everyone dropped', false],
  ["That's everything Sarah sent.", false],
  ['Plant a seed', false],
];
check(
  'B3 reserve calibration: known money copy matches, known non-money copy does not',
  CALIBRATION.filter(([s, want]) => matchesReserve(s) !== want).map(([s]) => s),
  []
);

// THREE GUARDS, NOT AN EXEMPTION LIST. `nectarConsent` covers every surface
// that exists once the user has a wallet; the sheet guard covers the one
// surface whose entire audience is users who do not; and `nectarUnconsented`
// (R-NT-4, 2026-09-05) covers the nectar tab's pre-consent state, which is a
// whole screen rather than a sheet. All three are POSITIVE-POLARITY names, so
// isUnderGuard reads them with no change to the walker — each carve-out is
// another name in the same rule, not another rule.
//
// AND THE SET IS SPLIT, BECAUSE ONE ARRAY WAS ANSWERING TWO QUESTIONS. The
// list below used to be a single `GUARDS`, read by B4 (may this WORD render
// here?) and by `callAuthority` (may this QUERY run here?). Those questions
// have different right answers for the new name: the pre-consent explainer is
// exactly where the money words belong, and it is exactly where a reserved
// QUERY must never run — a nectar read authorised by "this person has not
// consented" is the DES-28 prohibition with a licence stapled to it. So
// adding the third name to the shared array would have widened E2 silently
// while B4 was the only row anyone was looking at.
//
// Nothing observable moves today: the pre-consent branch makes no reserved
// query, and E2's own header says its value has always been being correct
// before the first site is written. QUERY_GUARDS' membership is therefore
// UNCHANGED, and that is the point of writing it down as its own name.
const RENDER_GUARDS = [NECTAR_CONSENT_GUARD, NECTAR_CONSENT_SHEET_GUARD, NECTAR_UNCONSENTED_GUARD];
const QUERY_GUARDS = [NECTAR_CONSENT_GUARD, NECTAR_CONSENT_SHEET_GUARD];
const reserveHits = allStrings.filter((s) => matchesReserve(s.value));
const unguardable = reserveHits.filter((s) => !GUARDABLE.has(s.position));
const unguarded = reserveHits.filter(
  (s) => GUARDABLE.has(s.position) && !RENDER_GUARDS.some((g) => isUnderGuard(s.ancestors, g))
);
check(
  `B4 every rendered money word sits under one of the guards (${RENDER_GUARDS.join(' | ')})`,
  unguarded.map((s) => `${s.rel}:${s.line} ${JSON.stringify(s.value)}`),
  []
);
check(
  'B5 no money word is authored where a guard could never reach it (alert / module scope)',
  unguardable.map((s) => `${s.rel}:${s.line} [${s.position}] ${JSON.stringify(s.value)}`),
  []
);

// B6-B9 MAKE THE GUARD NAMES MEAN SOMETHING.
//
// B4 asks whether a money word sits under a conditional SPELLED with a guard
// name. That is all `isUnderGuard` can ask: it walks a string's ancestors and
// compares an identifier's name. It has no scope table and no binding
// resolution, so it cannot distinguish the real predicate's result from any
// other value that happens to carry the same spelling. Fizz demonstrated the
// consequence on a probe branch and it reproduces here: a component holding
// `const [nectarConsent] = useState(false)` as its own sheet-open state wraps
// money copy in `{nectarConsent && …}` and goes green, with nothing in it
// connected to consent at all.
//
// THE USE SITE CANNOT RESOLVE A BINDING; THE DECLARATION SITE CAN BE
// ENUMERATED. So the fix is not a better recogniser at the top of the walk —
// it is a census at the bottom. Every binding of a guard name, by ANY
// declaration shape, is classified and made to show its authority:
//
//   nectarConsent            must be initialised from `hasNectarConsent(…)`
//   nectarConsentSheetOpen   must be a useState whose initialiser is false
//
// and a name RECEIVED as a prop is legal only where every JSX site feeding it
// passes an identifier of the same name — which is itself a binding in its own
// file, so the rule closes on itself without cross-file identity tracking.
//
// THE PREVIOUS VERSION OF THIS BLOCK IS WHY THE CENSUS IS SHAPED THIS WAY. It
// enumerated `useState` array-pattern declarators only, which is the shape the
// sheet was expected to use, so it red correctly on a second door and on
// `useState(true)` — and was structurally blind to `const
// nectarConsentSheetOpen = true`, a one-line binding that satisfies B4 and was
// not a member of the population at all. Measured on probe files, not
// predicted: three pre-consent money strings, all green. A population defined
// by the shape you expect licenses every shape you did not, which is the same
// error as enumerating a role by its values instead of its structure.
//
// CANNOT-TELL FAILS, throughout. An import of a guard name, a reassignment, a
// bare function parameter, an object pattern destructured from something other
// than props — none of these are shapes this tree uses, and each would leave a
// binding whose authority the census cannot state. They red with the shape
// named, the same convention as `isUnderGuard`'s own comment: extend the
// recogniser against a legitimate case when one appears, rather than
// pre-approving shapes nothing uses.
//
// ZERO FEEDERS IS DELIBERATELY LEGAL. A component that receives a guard prop
// nothing passes holds `undefined`, which is falsy, so its copy does not
// render — the failure is dead code, not exposed money words. Every guard name
// fails in the safe direction on absence, which is the same property C1 pins
// for the predicate itself.
const GUARD_AUTHORITY = {
  [NECTAR_CONSENT_GUARD]: {
    describe: 'initialised from hasNectarConsent(…)',
    ok: (init) => {
      let found = false;
      walkWithAncestry(init, (n) => {
        if (
          n.type === 'CallExpression' &&
          n.callee.type === 'Identifier' &&
          n.callee.name === 'hasNectarConsent'
        ) found = true;
      });
      return found;
    },
  },
  [NECTAR_CONSENT_SHEET_GUARD]: {
    describe: 'a useState initialised false (the sheet defaults CLOSED)',
    ok: (init) => {
      const isUseState =
        init && init.type === 'CallExpression' &&
        ((init.callee.type === 'Identifier' && init.callee.name === 'useState') ||
         (init.callee.type === 'MemberExpression' &&
          init.callee.property &&
          init.callee.property.name === 'useState'));
      if (!isUseState) return false;
      const arg = init.arguments[0];
      // No argument at all is `undefined`, which is falsy and therefore closed.
      return arg === undefined || (arg.type === 'BooleanLiteral' && arg.value === false);
    },
  },
  // THE RESOLVED NO, AND THE CLAUSE IS NOT THE FIRST ONE REUSED.
  //
  // Sage's fix (2026-09-05, thread 160660d9), and it is load-bearing rather
  // than tidy. `NECTAR_CONSENT_GUARD`'s clause above asks only whether a
  // `hasNectarConsent` call appears ANYWHERE in the initialiser subtree —
  // correct for a name that means the consented boolean, and exactly wrong
  // here: reused verbatim, `const nectarUnconsented = hasNectarConsent(row)`
  // would pass B7 while holding the CONSENTED value under the UNCONSENTED
  // name, and the gate would be stamping the wrong value as authorised.
  //
  // So the shape is pinned rather than searched for: the initialiser IS a `!`
  // UnaryExpression, its argument holds exactly one `hasNectarConsent` call,
  // and it holds no further negation. `!!hasNectarConsent(row)` is the
  // consented boolean wearing two marks and reds here, which a
  // count-the-negations-anywhere test would have passed.
  //
  // COMPARISON FORMS ARE NOT PRE-APPROVED. `=== false` and `!== true` were
  // offered and Lumen ruled them out until a legitimate site appears: zero
  // occur on this tree, and the convention this file already runs on
  // (isUnderGuard's own comment, the cannot-tell-fails paragraph above) is to
  // extend the recogniser against the comment when a real case shows up
  // rather than to license shapes nothing writes.
  //
  // WHAT THIS CLAUSE DOES NOT CERTIFY: that the read has landed. The binding
  // cannot know — `hasNectarConsent(null)` is false for "not yet" and for
  // "no" alike (C1 makes that collapse deliberate). Resolution is the
  // screen's half: the guarded subtree sits under its own settled-read
  // ancestor. Named here so the name is not read as claiming both.
  [NECTAR_UNCONSENTED_GUARD]: {
    describe: 'initialised from !hasNectarConsent(…) (the negation outermost, and single)',
    ok: (init) => {
      if (!init || init.type !== 'UnaryExpression' || init.operator !== '!') return false;
      let calls = 0;
      let negations = 0;
      walkWithAncestry(init.argument, (n) => {
        if (n.type === 'UnaryExpression' && n.operator === '!') negations += 1;
        if (
          n.type === 'CallExpression' &&
          n.callee.type === 'Identifier' &&
          n.callee.name === 'hasNectarConsent'
        ) calls += 1;
      });
      return calls === 1 && negations === 0;
    },
  },
};
const GUARD_NAMES = Object.keys(GUARD_AUTHORITY);

// Does a binding pattern bind one of the guard names? Returns the names it
// binds, so an ObjectPattern renaming (`{ nectarConsent: x }`) does NOT count
// as binding the guard — it binds `x`, and `x` is not a name B4 reads.
const patternBinds = (pat) => {
  const names = [];
  if (!pat) return names;
  if (pat.type === 'Identifier') {
    if (GUARD_NAMES.includes(pat.name)) names.push(pat.name);
  } else if (pat.type === 'ArrayPattern') {
    for (const el of pat.elements) names.push(...patternBinds(el));
  } else if (pat.type === 'ObjectPattern') {
    for (const p of pat.properties) {
      if (p.type === 'ObjectProperty') names.push(...patternBinds(p.value));
      else if (p.type === 'RestElement') names.push(...patternBinds(p.argument));
    }
  } else if (pat.type === 'AssignmentPattern') {
    names.push(...patternBinds(pat.left));
  } else if (pat.type === 'RestElement') {
    names.push(...patternBinds(pat.argument));
  }
  return names;
};

const bindings = [];
const attrFeeds = [];
for (const { rel, ast } of parsed) {
  walkWithAncestry(ast, (node) => {
    const at = (n) => `${rel}:${n.loc.start.line}`;

    if (node.type === 'VariableDeclarator') {
      for (const name of patternBinds(node.id)) {
        // An object pattern off `props` is a received prop; off anything else
        // (a hook's return, a call) the census cannot state the authority.
        if (node.id.type === 'ObjectPattern') {
          const fromProps = node.init && node.init.type === 'Identifier' && node.init.name === 'props';
          bindings.push(fromProps
            ? { rel, at: at(node), name, kind: 'received' }
            : { rel, at: at(node), name, kind: 'unclassified', shape: 'destructured from something other than `props`' });
        } else {
          bindings.push({ rel, at: at(node), name, kind: 'root', init: node.init });
        }
      }
      return;
    }

    if (node.params) {
      for (const p of node.params) {
        for (const name of patternBinds(p)) {
          bindings.push(p.type === 'ObjectPattern' || (p.type === 'AssignmentPattern' && p.left.type === 'ObjectPattern')
            ? { rel, at: at(node), name, kind: 'received' }
            : { rel, at: at(node), name, kind: 'unclassified', shape: 'a bare function parameter' });
        }
      }
    }

    if (node.type === 'ImportSpecifier' || node.type === 'ImportDefaultSpecifier') {
      for (const name of patternBinds(node.local)) {
        bindings.push({ rel, at: at(node), name, kind: 'unclassified', shape: 'an import' });
      }
      return;
    }

    if (node.type === 'AssignmentExpression') {
      for (const name of patternBinds(node.left)) {
        bindings.push({ rel, at: at(node), name, kind: 'unclassified', shape: 'a reassignment' });
      }
      return;
    }

    if (node.type === 'JSXAttribute' && node.name.type === 'JSXIdentifier' &&
        GUARD_NAMES.includes(node.name.name)) {
      const v = node.value;
      const passesSameName =
        v && v.type === 'JSXExpressionContainer' &&
        v.expression.type === 'Identifier' &&
        v.expression.name === node.name.name;
      attrFeeds.push({
        rel, at: at(node), name: node.name.name, ok: passesSameName,
        shape: v === null ? 'shorthand (always true)' : v.type === 'JSXExpressionContainer' ? v.expression.type : v.type,
      });
    }
  });
}

const roots = bindings.filter((b) => b.kind === 'root');
check(
  `B6 every binding of a guard name (${GUARD_NAMES.join(', ')}) is a shape the census can classify`,
  bindings.filter((b) => b.kind === 'unclassified').map((b) => `${b.at} \`${b.name}\` is ${b.shape}`),
  []
);
check(
  'B7 every guard name bound directly shows its authority (a spelling is not a binding)',
  roots
    .filter((b) => !GUARD_AUTHORITY[b.name].ok(b.init))
    .map((b) => `${b.at} \`${b.name}\` is not ${GUARD_AUTHORITY[b.name].describe}`),
  []
);
check(
  'B8 every guard passed as a prop is fed by an identifier of the same name',
  attrFeeds.filter((f) => !f.ok).map((f) => `${f.at} ${f.name}={${f.shape}}`),
  []
);
check(
  `B9 the consent sheet's open state (\`${NECTAR_CONSENT_SHEET_GUARD}\`) is rooted only in declared bootstrap hosts`,
  (() => {
    const doors = roots.filter((b) => b.name === NECTAR_CONSENT_SHEET_GUARD);
    // R-NT: the tab's `Turn on gifts` is the THIRD sheet door, and it is a
    // door and not a switch — Sage's 2026-08-26 bootstrap ruling, restated in
    // the R-NT build rulings. Only the sheet's affirmative fires
    // consent_to_nectar(), because the first call irreversibly mints the
    // starter grant.
    const allowed = new Set([
      'src/screens/PackageOpen.js',
      'src/screens/CombNectarCompose.js',
      'src/screens/NectarTab.js',
    ]);
    const actual = new Set(doors.map((b) => b.rel));
    const unexpected = doors.filter((b) => !allowed.has(b.rel)).map((b) => b.at);
    const missing = [...allowed].filter((rel) => !actual.has(rel)).map((rel) => `${rel}: missing consent-sheet root`);
    return [...unexpected, ...missing];
  })(),
  []
);

// --- C. The default is NO ------------------------------------------------
// Evaluated over the shapes an account can take before 19a provisions one,
// rather than asserted about the source text. `resolved` is not a state this
// predicate carries: unknown and no are the SAME answer here, because the
// consequence of both is the app as it ships today, which is correct in
// either case. That is the opposite of §23's rule for a load state, and it
// is the opposite deliberately — §23 says absence must not be reported as a
// positive claim about the user, and "no wallet" is not a claim about the
// user, it is the absence of a feature.
const NO_CONSENT_SHAPES = [
  ['undefined', undefined],
  ['null', null],
  ['{} (no row)', {}],
  ['{ consented_at: null }', { consented_at: null }],
  ['{ consented_at: undefined }', { consented_at: undefined }],
  ['{ consented_at: "" }', { consented_at: '' }],
];
check(
  'C1 hasNectarConsent is false for every un-consented row shape',
  NO_CONSENT_SHAPES.filter(([, v]) => hasNectarConsent(v) !== false).map(([n]) => n),
  []
);
check(
  'C2 hasNectarConsent is true once a consent timestamp exists',
  hasNectarConsent({ consented_at: '2026-08-26T00:00:00Z' }),
  true
);

// C3 the predicate and the exported field name must be THE SAME FACT, by
// evaluation. Two constants that agree because someone read both is exactly
// the arrangement C4 then checks against a third artifact for nothing.
check(
  `C3 hasNectarConsent keys off NECTAR_CONSENT_FIELD ('${NECTAR_CONSENT_FIELD}')`,
  [hasNectarConsent({ [NECTAR_CONSENT_FIELD]: '2026-08-26T00:00:00Z' }), hasNectarConsent({ nectarConsentAt: '2026-08-26T00:00:00Z' })],
  [true, false]
);

// C4 THE ROW THAT WOULD HAVE CAUGHT THE DEFECT THIS PREDICATE SHIPPED WITH.
// It read `account.nectarConsentAt` — camelCase, in an app that reads
// Postgres rows raw — so it answered NO for a consented user forever, and
// nothing lexical could see it because D6 keeps this module importer-free.
// A predicate over a database row is only correct RELATIVE TO A SCHEMA, so
// the row asserts against the schema and not against a literal this file
// also owns.
//
// It self-upgrades rather than skipping. Before 19a's service layer merges
// there is no `nectar_consents` in supabase/migrations, and the assertion is
// that the field is the name ratified against bumble/nectar-sim-service @
// 3a17ca2 (migration 20260826000005: `consented_at`, carried identically by
// `consent_to_nectar()`'s return table and the direct select the
// `nectar_consents_select_own` policy grants). The moment that migration
// lands the same row asserts membership in the real column list, and a
// column rename reds here instead of silently returning NO on a surface that
// is supposed to appear.
const migrationDir = path.join(ROOT, 'supabase', 'migrations');
let consentTableSrc = null;
try {
  for (const f of (await readdir(migrationDir)).sort()) {
    const src = await readFile(path.join(migrationDir, f), 'utf8');
    if (/create table (?:if not exists )?public\.nectar_consents\s*\(/i.test(src)) consentTableSrc = src;
  }
} catch {
  /* no migrations directory in this tree */
}
if (consentTableSrc) {
  const body = consentTableSrc.slice(consentTableSrc.search(/create table (?:if not exists )?public\.nectar_consents\s*\(/i));
  const decl = body.slice(body.indexOf('(') + 1, body.indexOf(');'));
  const columns = decl
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('--') && !/^(constraint|primary key|unique|check|foreign key)\b/i.test(l))
    .map((l) => l.split(/\s+/)[0]);
  check(
    `C4 NECTAR_CONSENT_FIELD is a real column of nectar_consents (${columns.join(', ')})`,
    columns.includes(NECTAR_CONSENT_FIELD),
    true
  );
} else {
  check(
    'C4 no nectar_consents migration in this tree — field pinned to the name ratified at bumble/nectar-sim-service@3a17ca2',
    NECTAR_CONSENT_FIELD,
    'consented_at'
  );
}

// C5 THE SHAPE TRAP, pinned rather than discovered. supabase-js returns an
// ARRAY for a `returns table` function, and an array is truthy with no
// `consented_at` — so handing `data` straight to the predicate is a silent
// permanent NO, the same failure mode as the camelCase field and just as
// invisible. The predicate deliberately keeps one input shape; this row
// records the verdict for the other one so the next reader finds it stated.
check(
  'C5 an rpc result array is not a consent record (pass the row, not `data`)',
  hasNectarConsent([{ consented_at: '2026-08-26T00:00:00Z' }]),
  false
);

// THE RESERVE ITSELF IS BUILT HERE AND ARGUED IN SECTION E, where its own two
// rows live (E0 non-empty, E0a carve-out membership). It is hoisted above
// section D because D4's `noNectarOnCompose` probe keys on this same Set —
// Lumen's requirement, ruled 2026-09-05: the identifier list a probe hunts
// derives from ONE declarator and never from a hand copy that stays
// self-consistent while the app drifts. Hoisting the construction moves no
// measurement; every consumer reads the same finished Set it read before.
const NECTAR_MIGRATION_FILE_RE = /nectar/i;
const OBJECT_RE = /create\s+(?:or\s+replace\s+)?(table|view|function)\s+(?:if not exists\s+)?public\.(\w+)/gi;
let nectarMigrationFiles = [];
try {
  nectarMigrationFiles = (await readdir(migrationDir)).filter((f) => NECTAR_MIGRATION_FILE_RE.test(f)).sort();
} catch {
  /* no migrations directory in this tree */
}
const QUERY_RESERVE = new Set();
for (const f of nectarMigrationFiles) {
  const src = await readFile(path.join(migrationDir, f), 'utf8');
  for (const m of src.matchAll(OBJECT_RE)) QUERY_RESERVE.add(m[2]);
}

// --- D. Placement --------------------------------------------------------
const exists = async (rel) => {
  try {
    await access(path.join(ROOT, rel));
    return true;
  } catch {
    return false;
  }
};

const hosted = NECTAR_SURFACES.filter((s) => s.host);
const unhosted = NECTAR_SURFACES.filter((s) => !s.host);
check('D0 both surface classes are represented (hosted and container-absent)', [hosted.length > 0, unhosted.length > 0], [true, true]);

const missingHosts = [];
const missingAnchors = [];
for (const s of hosted) {
  if (!(await exists(s.host))) {
    missingHosts.push(`${s.id}: ${s.host}`);
    continue;
  }
  const src = await readFile(path.join(ROOT, s.host), 'utf8');
  // WHOLE-IDENTIFIER, not substring. Caught by this gate's own mutation
  // test: renaming `styles.ending` to `styles.endingBlock` — exactly the
  // orphaning D2 exists to catch — left the old anchor as a PREFIX of the
  // new one, so `includes()` stayed green while the placement it names had
  // moved. A containment test cannot tell a rename from a survival.
  const anchorRe = new RegExp(`\\b${s.anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  if (!anchorRe.test(src)) missingAnchors.push(`${s.id}: ${s.anchor} not in ${s.host}`);
}
check('D1 every hosted surface names a container file that exists', missingHosts, []);
check('D2 every hosted surface\'s declared anchor is still in its container', missingAnchors, []);

// D3 is a DECLARATION-COMPLETENESS row, not an absence proof. A surface
// whose container does not exist must say how that is known — a named probe,
// or the literal string 'none' plus a note explaining why nothing mechanical
// can speak for it. Without this row, "no probe" and "probe passed" are the
// same silence.
check(
  'D3 every container-absent surface declares a probe or declares itself unprobeable',
  unhosted.filter((s) => !s.probe || !s.note).map((s) => s.id),
  []
);

// D4 THE PROBE ITSELF, for the one surface where absence is mechanically
// checkable.
//
// THE PREDECESSOR IS RETIRED, AND THE REASON IS THE POINT. `noActionMenu`
// asked whether one file navigated to BOTH `ComposeNote` and `PlantSeed`,
// because DES-28 D5 adds a nectar row to a "Send note · Plant seed" menu and
// no such menu existed: the two compose screens were reached from two separate
// inbox screens, never from one sheet. R-WD merged all four into one write
// door, one inbox and one compose surface, so NEITHER ROUTE NAME EXISTS. The
// old probe would have gone green vacuously (no file can satisfy a conjunction
// of two strings neither of which is in the tree) and its own control D5 would
// have gone red — which is exactly what its author built D5 to say: green
// because the screens were RENAMED, not because the menu is absent.
//
// There is no re-point that saves it. Re-pointing at two dead route names
// would preserve a measurement whose subject is gone, which is the
// label-versus-mechanism failure in instrument form. So it is retired and
// replaced, with the reason recorded here rather than in a commit message.
//
// AND THE CONTAINER EXISTS NOW. R-WD-3's delivery segment IS the two-way
// choice the declaration's note was waiting for, rendered as a segment instead
// of a sheet. The placement question D5 was holding open has been ANSWERED,
// not skipped: no nectar row on compose. R-NT-5 rules that giving starts at a
// person and the comb is where you give, so a giving affordance on the write
// door would be a third giving door and it is unruled. If anyone wants one,
// that is a design ruling to request, not a row to build. Ruled by Lumen,
// 2026-09-05, UX Design thread 160660d9; the declaration in
// `src/constants/nectar.js` carries the same sentence.
//
// THE SUCCESSOR keeps a measurement rather than leaving a note. It reds the
// day a nectar identifier appears on the merged compose surface.
//
// SCOPE, stated rather than implied: the needle is `QUERY_RESERVE`, the same
// migration-enumerated declarator sections E and F key on — never a hand-typed
// list, which would be a second copy of the schema able to stay
// self-consistent while the app drifts. So this finds the nectar row ARRIVING
// WITH ITS DATA, which is the only way it can carry a balance, an amount or a
// send. It does not claim to catch a purely decorative glyph; the reserve is
// what makes the claim it does make derivable.
//
// EMPTY-RESERVE COVERAGE IS ATTRIBUTED, not assumed: if the reserve narrowed
// to nothing this probe would find nothing and green vacuously, and E0 below
// ("the query reserve is non-empty") reds in the same run, independently of
// this row. That is why the construction is hoisted above this section.
const COMPOSE_REL = 'src/screens/Compose.js';
const PROBES = {
  noNectarOnCompose: () => {
    const compose = parsed.filter(({ rel }) => rel === COMPOSE_REL);
    return compose
      .filter(({ src }) => [...QUERY_RESERVE].some((name) => new RegExp(`\\b${name}\\b`).test(src)))
      .map(({ rel }) => rel);
  },
};
const probeFailures = [];
for (const s of unhosted) {
  if (s.probe === 'none') continue;
  const probe = PROBES[s.probe];
  if (!probe) {
    probeFailures.push(`${s.id}: no such probe '${s.probe}'`);
    continue;
  }
  const found = probe();
  if (found.length > 0) probeFailures.push(`${s.id}: container now exists — ${found.join(', ')}`);
}
check('D4 every named container-absence probe still finds nothing', probeFailures, []);

// D5 THE CONTROL, and it is the reverse direction of D4's probe: a probe that
// can no longer FIND anything is a probe that has stopped working. The
// predecessor's control asserted two route names were still reachable, and it
// died with them.
//
// This one is a FOUND-TOKEN control, which is the stronger shape — Sage's,
// adopted by Lumen over the "the file exists and parses" version she first
// ruled, because parsing proves the file is READABLE and not that the probe
// reads its CONTENT. So the control names a witness the probe must find in the
// same file it scans, end to end through the same pipeline.
//
// THE WITNESS IS `DELIVERY_MODES`, R-WD-3's own delivery segment — the ruled
// shape of this surface, one door where delivery time is the only variable
// (POLLINATE_OPENDAY_NECTAR_RECUT_SPEC.md R-WD-3). Deliberately not a prose
// token: a
// copy rewrite would red a prose control falsely, whereas the segment cannot
// leave compose without a spec revisit that would rightly reopen this gate.
const composeFile = parsed.find(({ rel }) => rel === COMPOSE_REL);
const composeCarriesSegment = Boolean(composeFile) && /\bDELIVERY_MODES\b/.test(composeFile.src);
check(
  'D5 noNectarOnCompose probe control: the merged compose surface is in the probe\'s universe and still carries its ruled delivery segment',
  [Boolean(composeFile), composeCarriesSegment],
  [true, true]
);

// D6 THE CONTROL ON A1a'S EXCLUSION. NECTAR_SURFACES holds the only prose in
// the declaration module — the `note` and `preConsent` fields, which describe
// missing containers in the same words a real surface would use. Nothing may
// render them. Importing the predicate or the guard name is free; importing
// the population means the words can reach a screen, and at that moment the
// self-exclusion stops being safe and has to be argued again rather than
// inherited.
const surfaceImporters = parsed.filter(({ src }) => /\bNECTAR_SURFACES\b/.test(src)).map(({ rel }) => rel);
check('D6 nothing in the app imports NECTAR_SURFACES (the exclusion in A1a holds)', surfaceImporters, []);

// --- E. Query reserve ------------------------------------------------------
// GUARDS THE ASK, NOT THE RENDER. B4 catches a money WORD; it cannot catch a
// bare numeral (`{balance}` beside a drop glyph carries no word the reserve
// matches). A numeral cannot exist client-side without a query that fetched
// it, and every query this app writes names its source as a string literal
// argument to `.from(...)` or `.rpc(...)` — see SeedsStore.js, NotesStore.js,
// HiveStore.js, all of which use exactly that shape. So E asks the same
// question B4 asks, one layer earlier: does a string literal naming a nectar
// data object sit under one of the QUERY guards, regardless of what it would
// go on to render.
//
// ENUMERATED FROM THE MIGRATIONS IN TREE, same shape as C4 and for the same
// reason — a hand-typed list of table/rpc names is a second copy of the
// schema that can drift the moment a migration adds one. The population is
// every `create table|view|function public.X` in a migration file whose
// NAME contains "nectar" — that is `nectar_ledger.sql` and
// `nectar_sim_service.sql` today, so the reserve carries the whole ledger
// schema (`ledger_postings`, `strike_invoices`, …) as well as the
// nectar-named objects themselves. That is over-inclusion in the same
// direction every other rule here already commits to: a client string
// literal naming an internal ledger table has no legitimate reason to exist
// unguarded either, so a false member costs nothing and a missed one costs
// a silent leak.
check(
  `E0 the query reserve is non-empty, enumerated from ${nectarMigrationFiles.length} nectar migration(s)`,
  QUERY_RESERVE.size > 0,
  true
);

// E0a THE CARVE-OUT'S MEMBERSHIP IS FROZEN AND CHECKABLE, not trusted. Both
// names must actually be reserved objects (else the carve-out would be
// exempting nothing, or exempting a typo silently) and there must be exactly
// these two — a THIRD name added here later is exactly the "exemption list
// grows" failure Pixel's ruling rejects, so it has to be re-argued as a
// property of the object rather than merged as a one-line addition.
check(
  'E0a the consent-bootstrap carve-out is exactly {nectar_consents, consent_to_nectar}, both real reserved objects',
  [
    NECTAR_CONSENT_BOOTSTRAP_OBJECTS.length,
    NECTAR_CONSENT_BOOTSTRAP_OBJECTS.every((n) => QUERY_RESERVE.has(n)),
  ],
  [2, true]
);
const BOOTSTRAP = new Set(NECTAR_CONSENT_BOOTSTRAP_OBJECTS);

// The two call shapes this app's data layer actually uses:
// `client.from('table')` and `client.rpc('fn_name', {...})`. Anything else
// (a computed member, a variable holding the method name) is outside this
// walk's vocabulary — same convention as isUnderGuard's own comment: red on
// a shape nothing in this tree uses would be a false negative no probe has
// ever produced here, not a hole being knowingly left open.
const QUERY_METHODS = new Set(['from', 'rpc']);
const findQueryCalls = (ast) => {
  const hits = [];
  walkWithAncestry(ast.program ?? ast, (node, ancestors) => {
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'MemberExpression' &&
      node.callee.property.type === 'Identifier' &&
      QUERY_METHODS.has(node.callee.property.name) &&
      node.arguments[0] &&
      node.arguments[0].type === 'StringLiteral'
    ) {
      hits.push({ name: node.arguments[0].value, node, ancestors });
    }
  });
  return hits;
};

// THE RENDER-AUTHORITY CHECK (§12.7a). A query call is a statement, awaited
// in a handler body 60 times out of 61 measured on this tree — a position no
// `&&`/`?:` guard can ever occupy, so asking `isUnderGuard` of the call
// itself asks the wrong shape almost every time. Two ways a call can be
// authorised:
//
//   (1) it sits directly under a guarded expression AT ITS OWN POSITION —
//       an inline handler, `flag && <Btn onPress={() => call()}/>`. This is
//       exactly what `isUnderGuard` already answers, unchanged.
//   (2) it is inside a NAMED handler (`const handleX = () => {…}` or
//       `function handleX() {…}`), and EVERY JSX attribute in the SAME FILE
//       that passes `handleX` by identifier sits under a guard. Zero such
//       attributes is CANNOT-TELL and fails in the safe direction — the same
//       convention B6 already uses for a binding shape the census can't
//       classify: a named handler this walk cannot connect to any rendered
//       control is not evidence of safety, it is evidence of nothing.
const isFunctionish = (t) =>
  t === 'ArrowFunctionExpression' || t === 'FunctionExpression' || t === 'FunctionDeclaration';

// WHICH DECLARATIONS ARE HANDLERS. `const handleX = () => {…}`,
// `function handleX() {…}`, and `const handleX = useCallback(() => {…}, deps)`.
// The third was forward-ported 2026-09-05 with the exclusivity clause, ruled
// in by Lumen for three reasons, and it is not a nicety.
//
// `useCallback(…)` is a CallExpression, so a resolver that only accepts a
// function-expression init walks straight PAST the declarator and returns the
// enclosing COMPONENT's name, whose JSX wiring is (correctly) nothing. A
// correctly guarded handler then reads cannot-tell, which is red on the one
// idiom this codebase reaches for most: 38 declarations in src/ take this
// shape. That false red's remediation gradient points at UNWRAPPING the
// memoization to make the gate green, which is PROBE-B's defect class one
// notch milder, and PROBE-B is why the clause above exists.
//
// It also matters to the clause itself. A useCallback handler wired to a
// guarded control AND called on mount should read 'other-callers'. Without
// this, it reads cannot-tell for the wrong reason, which is safe by accident
// rather than by mechanism, and an accident is not a gate.
//
// THE WRAPPER SET IS AN ENUMERATED SET, NEVER A `use*` REGEX (Lumen's pin
// (i)). `useMemo` returning a function is a different claim and is not
// licensed here by accident of spelling. Extend this Set against this
// comment when a shape appears, which is `isUnderGuard`'s own convention.
//
// The acceptance keys on a CallExpression init whose callee is IN THE SET
// with a functionish first argument, so a store's ObjectExpression init is
// still not a handler and the trigger-disjointness rows below stay green.
const HOOK_HANDLER_WRAPPERS = new Set(['useCallback']);
const declaredHandlerName = (node) => {
  if (node.type === 'FunctionDeclaration' && node.id) return node.id.name;
  if (node.type !== 'VariableDeclarator' || node.id.type !== 'Identifier' || !node.init) return null;
  const { init } = node;
  if (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression') return node.id.name;
  if (
    init.type === 'CallExpression' &&
    init.callee.type === 'Identifier' &&
    HOOK_HANDLER_WRAPPERS.has(init.callee.name) &&
    init.arguments[0] &&
    isFunctionish(init.arguments[0].type)
  ) {
    return node.id.name;
  }
  return null;
};
const findEnclosingHandlerName = (ancestors) => {
  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    const name = declaredHandlerName(ancestors[i].node);
    if (name) return name;
  }
  return null;
};

// THE EXCLUSIVITY CLAUSE (ruled by Lumen 2026-09-05; forward-ported from
// pixel/handler-caller-exclusivity@8a8766c, which was cut against a rule E
// that had no store arms yet and is superseded by this commit).
//
// Arm (2) as first written quantified over the handler's WIRINGS. A mount
// effect calling the handler is a CallExpression reference, and the wiring
// walk never collected one, so a second invocation path was invisible BY
// CONSTRUCTION rather than by oversight. The gate greened its own worst case:
//
//   const loadBalance = async () => { await client.from('nectar_zaps')… };
//   useEffect(() => { loadBalance(); }, []);
//   return nectarConsent && <Pressable onPress={loadBalance} />;
//
// Every JSX attribute wiring `loadBalance` is guarded, so wiring-only
// authority passed it while the effect fired the ask on mount regardless of
// consent, which is the one event rule E exists to catch. And the sharp half:
// DELETE the guarded control and the same leak reds, so the remediation
// gradient a builder feels pointed at wiring a guarded button, meaning at
// shipping the leak. Both shapes are permanent E1 rows below.
//
// THE CLAUSE IS THE QUANTIFIER ARM (3) ALREADY CARRIES, BROUGHT BACK TO
// ARM (2). Arm (3) rules that a store method inherits authority iff EVERY
// reference to it in the universe is authorised. Arm (2) quantified over
// wirings, which is the wrong set. With the clause, inherited authority is
// universal over references everywhere rule E grants it, and the same hole
// one file boundary out closes for free through arm (3)'s recursion: a store
// caller that is a wired handler with a second caller answers 'other-callers'
// and arm (3) propagates it.
//
// TRIGGER DISJOINTNESS, so the clause cannot over-fire on the store arms.
// `findEnclosingHandlerName` above wants a VariableDeclarator whose init IS a
// function, or a FunctionDeclaration. A store method's enclosing declarator
// has an ObjectExpression init, so arm (2) never fires inside a store file
// and the clause is unreachable from arms (3) and (4). Stated here and shown
// by measurement: the exclusivity probes red E1 while every arm-(3)/(4) row
// in E3 stays green, and E3 carries a row asserting the arrow-valued store
// method shape is not intercepted either.
//
// LICENSED POSITIONS ARE A LIST, DELIBERATELY MINIMAL AND ENUMERABLE:
//   - the declaration itself, and only when it is NOT exported;
//   - a JSX attribute wiring, which is the authority arm (2) reads;
//   - the deps-array position of a `use*` call.
// Everything else is `other-callers`, which fails in the safe direction
// beside `cannot-tell`. That INCLUDES a reference sitting under its own guard
// at its own position, `nectarConsent && loadBalance()` inline. Recognising
// that shape would turn the licence list into a second authority analysis;
// refusing it is a false red in the safe direction, and a builder who hits it
// routes through a licensed shape. Extend the list against this comment when
// a legitimate shape appears, which is `isUnderGuard`'s own convention.
//
// THE DEPS EXEMPTION IS POSITIONAL, not a name match: the identifier must be
// an ELEMENT of the ArrayExpression that is an argument of a `use*` call.
// React compares that position for equality and never calls it. `const fns =
// [handleX]` is not that position and classifies as `other-callers`.
//
// AN EXPORTED WIRED HANDLER IS NOT LICENSABLE. This census reaches one file,
// so an exported name's callers are by definition not all visible here and
// exclusivity cannot be established. Export goes to the safe direction. The
// frame that decides it is the one directly above the declaration's own
// STATEMENT, not anywhere in the ancestry: every handler in this app is
// declared inside `export default function Screen()`, and an ancestry-wide
// test would call every declaration an escape and red the single-caller case
// the clause exists to pass.
const HOOK_CALL_RE = /^use[A-Z]/;
const isExportedDeclaration = (ancestors, declKind) => {
  const stmtIdx = declKind === 'FunctionDeclaration' ? ancestors.length - 1 : ancestors.length - 2;
  const above = ancestors[stmtIdx - 1];
  return Boolean(
    above &&
      (above.node.type === 'ExportNamedDeclaration' || above.node.type === 'ExportDefaultDeclaration')
  );
};
const classifyReference = (ancestors) => {
  const p = ancestors[ancestors.length - 1];
  const gp = ancestors[ancestors.length - 2];
  if (!p) return 'other';
  // Positions where the identifier is a KEY or a member name: a different
  // binding that merely spells the same, not a reference to this handler.
  if (p.node.type === 'MemberExpression' && p.key === 'property' && !p.node.computed) return 'not-a-reference';
  if (p.node.type === 'ObjectProperty' && p.key === 'key' && !p.node.computed) return 'not-a-reference';
  if (
    (p.node.type === 'VariableDeclarator' || p.node.type === 'FunctionDeclaration') &&
    p.key === 'id'
  ) {
    return isExportedDeclaration(ancestors, p.node.type) ? 'other' : 'declaration';
  }
  if (
    p.node.type === 'JSXExpressionContainer' &&
    p.key === 'expression' &&
    gp?.node.type === 'JSXAttribute' &&
    gp.key === 'value'
  ) {
    return 'jsx-wiring';
  }
  if (
    p.node.type === 'ArrayExpression' &&
    p.key === 'elements' &&
    gp?.node.type === 'CallExpression' &&
    gp.key === 'arguments' &&
    gp.node.callee.type === 'Identifier' &&
    HOOK_CALL_RE.test(gp.node.callee.name)
  ) {
    return 'dep-list';
  }
  return 'other';
};
const findHandlerReferences = (ast, handlerName) => {
  const refs = [];
  walkWithAncestry(ast.program ?? ast, (node, ancestors) => {
    if (node.type !== 'Identifier' || node.name !== handlerName) return;
    const kind = classifyReference(ancestors);
    if (kind === 'not-a-reference') return;
    refs.push({ node, ancestors, kind });
  });
  return refs;
};
const findHandlerWiring = (ast, handlerName) =>
  findHandlerReferences(ast, handlerName).filter((r) => r.kind === 'jsx-wiring');
// ---------------------------------------------------------------------------
// (3) AND (4) — ADDED 2026-08-27 BY ENG-63/64/65, WHICH IS THE FIRST CODE
// THIS RULE EVER JUDGED. E2 shipped with a caveat stated up front: "gate-only,
// defect LATENT — E2 finds 0 non-bootstrap reserved call sites on main today,
// the fix is entirely PROSPECTIVE; its value is being correct before D2 writes
// the first one." D2 is written. Both of its reserved calls came back
// `cannot-tell`, and the reason is structural rather than incidental:
//
//   BOTH AUTHORITY SHAPES ABOVE ARE RENDER-SHAPED AND WITHIN-FILE, AND EVERY
//   QUERY THIS APP MAKES LIVES IN src/services/*Store.js, WHERE NEITHER SHAPE
//   CAN EXIST.
//
// A store method has no JSX in its file to be wired to and no guarded
// expression to sit under, so arms (1) and (2) can only ever answer
// cannot-tell about it. Measured, not reasoned: `record_zap` and
// `user_nectar_balances` in NectarStore.js both did. That means the rule's
// SATISFIABLE SET WAS EMPTY for the architecture it governs — the offered
// fix inherited a burden it had not been measured against.
//
// TWO FIXES REJECTED FIRST, both of which would have made the gate quieter
// and worse:
//
//   - Add the two identifiers to the consent-bootstrap carve-out. E0a's
//     membership is a PROPERTY ("part of how consent is established or
//     read"), and these are post-consent by definition. Adding them turns a
//     property into a list, which is the exact door NECTAR_CONSENT_SHEET_GUARD
//     was written to avoid.
//   - Exempt `src/services/`. That exempts the one directory where a leak
//     would actually live.
//
// So authority PROPAGATES instead — the same argument arm (2) already makes
// about a handler and the controls that call it, one file boundary further
// out, and with the same universal quantifier and the same failure direction:
//
//   (3) STORE PROPAGATION. A reserved call inside a method of an exported
//       object (`export const NectarStore = { async recordZap() {…} }`)
//       inherits authority iff EVERY reference to `NectarStore.recordZap`
//       anywhere in the enumerated universe is itself authorised. Zero
//       references is CANNOT-TELL, exactly as zero wirings is — an uncalled
//       store method carrying a reserved query is evidence of nothing.
//
//   (4) EFFECT AUTHORITY. Arm (3) is not enough on its own, because one real
//       caller cannot be render-guarded at all: the honey ladder's balance
//       read must COMPLETE BEFORE the honeyed cell renders, so it has no
//       guarded JSX ancestor and is nobody's handler. Its guard is the
//       effect's own — `if (!nectarConsent) return` as the first statement,
//       and `nectarConsent` in the dependency array. BOTH are required and
//       neither alone would do: the early return without the dep is a check
//       that never re-runs when the flag flips, and the dep without the
//       early return is a re-run with no check. Requiring the pair is what
//       makes this an authority shape rather than a hole shaped like one.
//
// This is deliberately NOT a general "an early return guards a block" rule.
// isUnderGuard's own header refuses that shape, and rightly — an early return
// anywhere in a body says nothing about a call below it. What is recognised
// here is narrower and checkable: the FIRST statement of a hook callback whose
// dependency list names the same flag.
const EFFECT_HOOK_RE = /^use[A-Z]/;
const returnsImmediately = (stmt) => {
  if (!stmt) return false;
  if (stmt.type === 'ReturnStatement') return true;
  return (
    stmt.type === 'BlockStatement' &&
    stmt.body.length === 1 &&
    stmt.body[0].type === 'ReturnStatement'
  );
};
const isUnderEffectGuard = (ancestors, flagName) =>
  ancestors.some(({ node }) => {
    if (node.type !== 'CallExpression') return false;
    if (node.callee.type !== 'Identifier' || !EFFECT_HOOK_RE.test(node.callee.name)) return false;
    const deps = node.arguments[1];
    const named =
      deps &&
      deps.type === 'ArrayExpression' &&
      deps.elements.some((e) => e && e.type === 'Identifier' && e.name === flagName);
    if (!named) return false;
    const cb = node.arguments[0];
    if (!cb || (cb.type !== 'ArrowFunctionExpression' && cb.type !== 'FunctionExpression')) return false;
    if (cb.body.type !== 'BlockStatement') return false;
    const first = cb.body.body[0];
    return Boolean(
      first &&
        first.type === 'IfStatement' &&
        first.test.type === 'UnaryExpression' &&
        first.test.operator === '!' &&
        first.test.argument.type === 'Identifier' &&
        first.test.argument.name === flagName &&
        returnsImmediately(first.consequent)
    );
  });

// The exported-object method a reserved call sits in, as `Binding.method`, or
// null. Both halves are required: the method key gives the name a caller
// writes, and the exported binding gives the object it writes it on.
const findEnclosingStoreMethod = (ancestors) => {
  let method = null;
  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    const { node } = ancestors[i];
    if (!method) {
      if (node.type === 'ObjectMethod' && node.key.type === 'Identifier') {
        method = node.key.name;
        continue;
      }
      if (
        node.type === 'ObjectProperty' &&
        node.key.type === 'Identifier' &&
        node.value &&
        (node.value.type === 'ArrowFunctionExpression' || node.value.type === 'FunctionExpression')
      ) {
        method = node.key.name;
        continue;
      }
    }
    if (
      method &&
      node.type === 'VariableDeclarator' &&
      node.id.type === 'Identifier' &&
      node.init &&
      node.init.type === 'ObjectExpression'
    ) {
      return { binding: node.id.name, method };
    }
  }
  return null;
};

// Every `Binding.method` reference across the enumerated universe, with the
// ancestry and ast each one needs to be judged by callAuthority itself.
const findStoreMethodCallers = (universe, binding, method) => {
  const callers = [];
  for (const { rel, ast } of universe) {
    walkWithAncestry(ast.program ?? ast, (node, ancestors) => {
      if (
        node.type === 'MemberExpression' &&
        node.object.type === 'Identifier' &&
        node.object.name === binding &&
        node.property.type === 'Identifier' &&
        node.property.name === method
      ) {
        callers.push({ rel, line: node.loc?.start.line, ancestors, ast });
      }
    });
  }
  return callers;
};

// Returns 'guarded', or one of three failing verdicts. All three fail E2
// identically; they differ only in where they send the next reader, and they
// are ordered here from most actionable to least:
//   'unguarded'     a wiring site sits outside the guard.
//   'other-callers' every wiring is guarded, but the handler is referenced
//                   somewhere unlicensed, so its caller set is not knowable
//                   from this file. The exclusivity clause.
//   'cannot-tell'   no traceable wiring at all, and see the header note on
//                   the cross-file limit this shares with `isUnderGuard`.
//
// `universe` is optional and only arm (3) uses it; passing nothing keeps the
// original three-arm behaviour, which is what the arm-(1)/(2) calibration
// probes rely on to stay a test of arms (1) and (2).
const callAuthority = (hit, ast, universe = null, depth = 0) => {
  if (QUERY_GUARDS.some((g) => isUnderGuard(hit.ancestors, g))) return 'guarded';
  if (QUERY_GUARDS.some((g) => isUnderEffectGuard(hit.ancestors, g))) return 'guarded';
  const handlerName = findEnclosingHandlerName(hit.ancestors);
  if (handlerName) {
    const refs = findHandlerReferences(ast, handlerName);
    const wiring = refs.filter((r) => r.kind === 'jsx-wiring');
    if (wiring.length > 0) {
      if (!wiring.every((w) => QUERY_GUARDS.some((g) => isUnderGuard(w.ancestors, g)))) return 'unguarded';
      // THE EXCLUSIVITY CLAUSE. Every wiring is guarded; authority is
      // inherited only if no OTHER reference to this handler exists in this
      // file. See the block above `classifyReference` for the licence list
      // and why an unlicensed reference is refused rather than analysed.
      return refs.some((r) => r.kind === 'other') ? 'other-callers' : 'guarded';
    }
  }
  // Arm (3). `depth` stops a store method that calls another store method on
  // the same object from recursing forever; one hop is all this tree has and
  // a second hop is a shape to re-argue, not to allow silently.
  if (universe && depth === 0) {
    const store = findEnclosingStoreMethod(hit.ancestors);
    if (store) {
      const callers = findStoreMethodCallers(universe, store.binding, store.method);
      if (callers.length === 0) return 'cannot-tell';
      const verdicts = callers.map((c) => callAuthority(c, c.ast, universe, depth + 1));
      if (verdicts.every((v) => v === 'guarded')) return 'guarded';
      // THE LABEL IS THE WORST CALLER'S, NOT A COLLAPSE OF THEM. The fail
      // direction is unchanged — anything short of every-caller-guarded is
      // not 'guarded' and E2 still reds — but reporting a store method whose
      // only unguarded-looking caller is actually UNREADABLE as "unguarded"
      // is a false accusation, not a safe failure. It sends the next reader
      // hunting for a missing `nectarConsent` when what is really there is a
      // named intermediate closure the walker cannot see through, and those
      // two defects have nothing in common but their colour. (Found
      // 2026-08-29 by being on the receiving end of it: R-N3's send hoisted
      // its RPC into `const commit = …` and this row named the wrong cause.)
      //
      // `other-callers` PROPAGATES HERE FOR THE SAME REASON. It is a CAUSE
      // label, not a colour, so the collapse must not rename it to
      // cannot-tell on the way out: a store method whose caller is a wired
      // handler with a second invocation path has a knowable defect and a
      // place to look, while cannot-tell says nothing here can tell. The
      // ordering below is the same worst-caller ordering, extended by one.
      if (verdicts.some((v) => v === 'unguarded')) return 'unguarded';
      if (verdicts.some((v) => v === 'other-callers')) return 'other-callers';
      return 'cannot-tell';
    }
  }
  return 'cannot-tell';
};

// E1 CALIBRATION, same reason as B3: zero non-bootstrap call sites in this
// tree touch the reserve today (measured in E2's own count below), so a
// broken extractor and a clean tree read identically without a probe with a
// known answer. Each probe is its own tiny file, because wiring lookup is a
// same-file walk.
const QUERY_CALIBRATION = [
  ['unguarded from(), inline', `client.from('nectar_zaps').select('amount_microusd');`, false],
  ['&&-guarded from(), inline', `nectarConsent && client.from('nectar_zaps').select('amount_microusd');`, true],
  ['ternary-guarded rpc(), inline', `nectarConsent ? client.rpc('record_zap', {}) : null;`, true],
  ['unrelated table, not in the reserve', `client.from('seeds').select('id');`, true],
  [
    'named handler wired to a guarded control',
    `function Comp() {
       const handleSend = async () => { await client.rpc('record_zap', {}); };
       return nectarConsent && <Button onPress={handleSend} />;
     }`,
    true,
  ],
  [
    'named handler wired to an UNguarded control',
    `function Comp() {
       const handleSend = async () => { await client.rpc('record_zap', {}); };
       return <Button onPress={handleSend} />;
     }`,
    false,
  ],
  [
    'named handler wired under an unrelated flag',
    `function Comp() {
       const handleSend = async () => { await client.rpc('record_zap', {}); };
       return otherFlag && <Button onPress={handleSend} />;
     }`,
    false,
  ],
  [
    'named handler never wired to any JSX attribute — cannot-tell fails',
    `function Comp() {
       const handleSend = async () => { await client.rpc('record_zap', {}); };
       return <View />;
     }`,
    false,
  ],
  [
    'consent-bootstrap object, unguarded, inline — carved out by property',
    `client.rpc('consent_to_nectar', {});`,
    'exempt',
  ],
  // EXCLUSIVITY PROBES. The first two are the fixture from issue b48c4bc5,
  // both polarities, and they are permanent rows on Lumen's pin (f): the
  // fixture that proved the hole is what keeps it shut.
  //
  // PROBE-A is the defect itself. Before the clause it returned `true`,
  // measured on main's own blob 923f761c, so the gate authorised a mount
  // fetch that fires regardless of consent.
  [
    'PROBE-A guarded control, but the handler is ALSO called bare on mount, so not its only caller',
    `function Comp() {
       const loadBalance = async () => { await client.from('nectar_zaps').select('amount_microusd'); };
       useEffect(() => { loadBalance(); }, []);
       return nectarConsent && <Button onPress={loadBalance} />;
     }`,
    false,
  ],
  // PROBE-B is the sharp half and the reason the clause is not merely a
  // missing case. The SAME leak with the guarded control deleted always
  // redded, so before the clause the way to turn PROBE-B green was to wire a
  // guarded button, which changes nothing about the mount fetch. The
  // remediation gradient pointed at shipping the leak. Both rows red now, and
  // the row that must stay red is this one.
  [
    'PROBE-B the same bare mount call with NO control at all is still refused',
    `function Comp() {
       const loadBalance = async () => { await client.from('nectar_zaps').select('amount_microusd'); };
       useEffect(() => { loadBalance(); }, []);
       return <View />;
     }`,
    false,
  ],
  [
    'guarded control, handler also passed as a plain argument, which escapes the walk',
    `function Comp() {
       const handleSend = async () => { await client.rpc('record_zap', {}); };
       setTimeout(handleSend, 1000);
       return nectarConsent && <Button onPress={handleSend} />;
     }`,
    false,
  ],
  // Lumen's pin (e). The census reaches one file, so an exported handler's
  // callers are not all visible and exclusivity cannot be established.
  [
    'guarded control, handler EXPORTED, so its callers are not all in this file',
    `export const handleSend = async () => { await client.rpc('record_zap', {}); };
     function Comp() {
       return nectarConsent && <Button onPress={handleSend} />;
     }`,
    false,
  ],
  // Lumen's pin (c). The exemption is the POSITION, not the name.
  [
    'guarded control, handler referenced only in a hook dependency list is still exclusive',
    `function Comp() {
       const handleSend = async () => { await client.rpc('record_zap', {}); };
       useEffect(() => {}, [handleSend]);
       return nectarConsent && <Button onPress={handleSend} />;
     }`,
    true,
  ],
  [
    'the same identifier in a plain array literal is NOT the deps position',
    `function Comp() {
       const handleSend = async () => { await client.rpc('record_zap', {}); };
       const fns = [handleSend];
       return nectarConsent && <Button onPress={handleSend} />;
     }`,
    false,
  ],
  // Lumen's pin (b), and it is a KNOWN false red kept on purpose. This call
  // is guarded in fact. Recognising it would make the licence list a second
  // authority analysis; refusing it keeps the list a list. A builder who hits
  // this row routes through a licensed shape rather than widening it.
  [
    'a second reference under its OWN guard is unlicensed and refused in the safe direction',
    `function Comp() {
       const loadBalance = async () => { await client.from('nectar_zaps').select('amount_microusd'); };
       return nectarConsent && <View><Button onPress={loadBalance} />{nectarConsent && loadBalance()}</View>;
     }`,
    false,
  ],
  // THE useCallback PAIR (Lumen's pin (iv), 2026-09-05). The first is the
  // false red this resolver closes: before it, the walk named the enclosing
  // component and the row read cannot-tell. The second is the clause
  // composing through the new resolver, which is the whole reason the two
  // ship together.
  [
    'useCallback handler wired to a guarded control',
    `function Comp() {
       const handleSend = useCallback(async () => { await client.rpc('record_zap', {}); }, []);
       return nectarConsent && <Button onPress={handleSend} />;
     }`,
    true,
  ],
  [
    'useCallback handler wired to an UNguarded control',
    `function Comp() {
       const handleSend = useCallback(async () => { await client.rpc('record_zap', {}); }, []);
       return <Button onPress={handleSend} />;
     }`,
    false,
  ],
  [
    'useCallback handler wired guarded but ALSO called bare on mount, so the clause still reaches it',
    `function Comp() {
       const loadBalance = useCallback(async () => { await client.from('nectar_zaps').select('amount_microusd'); }, []);
       useEffect(() => { loadBalance(); }, []);
       return nectarConsent && <Button onPress={loadBalance} />;
     }`,
    false,
  ],
  // The wrapper set is a Set, not a spelling. `useMemo` returning a function
  // is a different claim and is deliberately not licensed, so this reads
  // cannot-tell rather than inheriting the button's authority.
  [
    'a useMemo-wrapped function is NOT a licensed wrapper, so no authority is inherited',
    `function Comp() {
       const handleSend = useMemo(() => async () => { await client.rpc('record_zap', {}); }, []);
       return nectarConsent && <Button onPress={handleSend} />;
     }`,
    false,
  ],
  [
    'a member name that merely spells the same is not a reference to the handler',
    `function Comp() {
       const handleSend = async () => { await client.rpc('record_zap', {}); };
       api.handleSend;
       return nectarConsent && <Button onPress={handleSend} />;
     }`,
    true,
  ],
];
const calibrationFailures = [];
for (const [label, src, want] of QUERY_CALIBRATION) {
  const ast = parse(src, { sourceType: 'module', plugins: ['jsx'] });
  const hits = findQueryCalls(ast).filter((h) => QUERY_RESERVE.has(h.name));
  const authorised = hits.every((h) =>
    BOOTSTRAP.has(h.name) ? true : callAuthority(h, ast) === 'guarded'
  );
  const got = hits.some((h) => BOOTSTRAP.has(h.name)) ? 'exempt' : authorised ? true : false;
  if (got !== want) calibrationFailures.push(`${label} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}
check('E1 query-reserve calibration: guard, render-authority, cannot-tell, and carve-out probes all verify as expected', calibrationFailures, []);

// E1a THE useCallback RESOLVER, MEASURED ON THIS TREE'S OWN DECLARATIONS
// rather than only on the probes above. A calibration probe proves the
// resolver handles the shape I wrote; this row proves it handles the shape
// the app actually writes, which is the population a future money identifier
// will be declared in. For every `const x = useCallback(fn, deps)` in the
// enumerated universe, take the calls that sit DIRECTLY in fn's body. Their
// innermost enclosing function IS fn, so a nested arrow's calls belong to the
// arrow and not to x. Then check that the resolver names x rather than the
// enclosing component, whose JSX wiring is nothing.
//
// THIS IS THE ROW E3a's HEADER CITES. Until 2026-09-05 that citation had no
// referent on main: E1a lived only on pixel/handler-caller-exclusivity, which
// was pushed, announced and never merged, so a comment on main spent nine
// days pointing into a branch. Forward-ported here with the resolver it
// controls, which is what makes the sentence true.
//
// `resolverCovered > 0` is this row's own vacuity guard, and it is not
// decoration: if the useCallback idiom ever left this tree, or if the body
// resolution stopped matching, the misresolved list would be empty for the
// wrong reason and the row would go green measuring nothing.
const useCallbackHandlers = [];
const resolvedCalls = [];
for (const { rel, ast } of parsed) {
  walkWithAncestry(ast.program ?? ast, (node, ancestors) => {
    if (
      node.type === 'VariableDeclarator' &&
      node.id.type === 'Identifier' &&
      node.init &&
      node.init.type === 'CallExpression' &&
      node.init.callee.type === 'Identifier' &&
      HOOK_HANDLER_WRAPPERS.has(node.init.callee.name) &&
      node.init.arguments[0] &&
      isFunctionish(node.init.arguments[0].type)
    ) {
      useCallbackHandlers.push({ rel, name: node.id.name, fn: node.init.arguments[0] });
    }
    if (node.type !== 'CallExpression') return;
    let fn = null;
    for (let i = ancestors.length - 1; i >= 0; i -= 1) {
      if (isFunctionish(ancestors[i].node.type)) {
        fn = ancestors[i].node;
        break;
      }
    }
    if (fn) resolvedCalls.push({ fn, name: findEnclosingHandlerName(ancestors) });
  });
}
const misresolved = [];
let resolverCovered = 0;
for (const h of useCallbackHandlers) {
  const inBody = resolvedCalls.filter((c) => c.fn === h.fn);
  if (inBody.length === 0) continue;
  resolverCovered += 1;
  const wrong = [...new Set(inBody.filter((c) => c.name !== h.name).map((c) => String(c.name)))];
  if (wrong.length) misresolved.push(`${h.rel} ${h.name} -> ${wrong.join(', ')}`);
}
check(
  `E1a every useCallback-declared handler resolves to its own name (${useCallbackHandlers.length} declared, ${resolverCovered} with a call in the body)`,
  [misresolved, resolverCovered > 0],
  [[], true]
);

// E2 THE REAL QUESTION, over the same source universe A1 already enumerated.
// Bootstrap objects are excluded from the population this check judges —
// by property (E0a), not because any call site of theirs happened to look
// guarded.
const queryHits = [];
for (const { rel, ast } of parsed) {
  for (const h of findQueryCalls(ast)) {
    if (QUERY_RESERVE.has(h.name) && !BOOTSTRAP.has(h.name)) {
      queryHits.push({ rel, line: h.node.loc.start.line, name: h.name, ancestors: h.ancestors, ast });
    }
  }
}
const unguardedQueries = queryHits.filter((h) => callAuthority(h, h.ast, parsed) !== 'guarded');
check(
  `E2 every non-bootstrap query naming a reserved nectar identifier is authorised by a rendered guard (${QUERY_GUARDS.join(' | ')})`,
  unguardedQueries.map((h) => `${h.rel}:${h.line} ${h.name} [${callAuthority(h, h.ast, parsed)}]`),
  []
);


// E3 CALIBRATION FOR THE TWO NEW ARMS, and it is not optional for the same
// reason E1 and B3 are not: this tree has exactly two store-hosted reserved
// calls, both of which now read `guarded`, so a broken arm and a correct one
// produce the identical suite output. Each probe has a known answer and at
// least one of each polarity per arm.
//
// Arm (3) needs a MULTI-FILE universe, so these probes are pairs: a store
// file holding the reserved call and a caller file holding the reference.
const mini = (rel, src) => ({ rel, ast: parse(src, { sourceType: 'module', plugins: ['jsx'] }) });
const STORE_SRC = `export const Store = { async pull() { return client.from('nectar_zaps').select('x'); } };`;
// The handler name arm 2 would resolve for a store file's reserved call. Used
// by the trigger-disjointness rows: the answer must be null, which is what
// makes arm 2 unreachable from arms 3 and 4.
const handlerNameOfStoreCall = (src) => {
  const f = mini('src/services/Store.js', src);
  const hit = findQueryCalls(f.ast).find((h) => QUERY_RESERVE.has(h.name));
  return findEnclosingHandlerName(hit.ancestors);
};
const authorityOfStoreCall = (universe) => {
  const store = universe.find((f) => f.rel.endsWith('Store.js'));
  const hit = findQueryCalls(store.ast).find((h) => QUERY_RESERVE.has(h.name));
  return callAuthority(hit, store.ast, universe);
};
const ARM_CALIBRATION = [
  [
    'arm 4: effect with BOTH the negated early return and the dep — guarded',
    () => {
      const f = mini('src/screens/A.js', `function C(){ useEffect(() => { if (!nectarConsent) return; client.from('nectar_zaps').select('x'); }, [nectarConsent]); }`);
      const hit = findQueryCalls(f.ast).find((h) => QUERY_RESERVE.has(h.name));
      return callAuthority(hit, f.ast, [f]);
    },
    'guarded',
  ],
  [
    'arm 4: dep present, early return MISSING — not guarded',
    () => {
      const f = mini('src/screens/A.js', `function C(){ useEffect(() => { client.from('nectar_zaps').select('x'); }, [nectarConsent]); }`);
      const hit = findQueryCalls(f.ast).find((h) => QUERY_RESERVE.has(h.name));
      return callAuthority(hit, f.ast, [f]);
    },
    'cannot-tell',
  ],
  [
    'arm 4: early return present, dep MISSING — not guarded',
    () => {
      const f = mini('src/screens/A.js', `function C(){ useEffect(() => { if (!nectarConsent) return; client.from('nectar_zaps').select('x'); }, []); }`);
      const hit = findQueryCalls(f.ast).find((h) => QUERY_RESERVE.has(h.name));
      return callAuthority(hit, f.ast, [f]);
    },
    'cannot-tell',
  ],
  [
    'arm 4: the early return is not the FIRST statement — not guarded',
    () => {
      const f = mini('src/screens/A.js', `function C(){ useEffect(() => { let c = false; if (!nectarConsent) return; client.from('nectar_zaps').select('x'); }, [nectarConsent]); }`);
      const hit = findQueryCalls(f.ast).find((h) => QUERY_RESERVE.has(h.name));
      return callAuthority(hit, f.ast, [f]);
    },
    'cannot-tell',
  ],
  [
    'arm 3: store method with one guarded caller — guarded',
    () =>
      authorityOfStoreCall([
        mini('src/services/Store.js', STORE_SRC),
        mini('src/screens/A.js', `function C(){ const handleGo = () => Store.pull(); return nectarConsent && <B onPress={handleGo} />; }`),
      ]),
    'guarded',
  ],
  [
    'arm 3: one guarded caller and one UNGUARDED caller — unguarded (every, not some)',
    () =>
      authorityOfStoreCall([
        mini('src/services/Store.js', STORE_SRC),
        mini('src/screens/A.js', `function C(){ const handleGo = () => Store.pull(); return nectarConsent && <B onPress={handleGo} />; }`),
        mini('src/screens/B.js', `function D(){ const handleGo = () => Store.pull(); return <B onPress={handleGo} />; }`),
      ]),
    'unguarded',
  ],
  [
    'arm 3: store method with NO callers anywhere — cannot-tell, never green',
    () => authorityOfStoreCall([mini('src/services/Store.js', STORE_SRC)]),
    'cannot-tell',
  ],
  [
    // EXPECTATION CORRECTED 2026-08-29 with the three-state label (see
    // `callAuthority` arm 3). The claim this row makes is unchanged and is
    // the only one that matters: the wrapper does NOT launder authority, so
    // the answer is not 'guarded' and E2 reds. What moved is the NAME of the
    // refusal — the wrapper has no callers of its own, so the truth about it
    // is that nothing here can tell, and it used to be reported as a missing
    // guard. Both red; only one of them tells you where to look.
    'arm 3: a caller that is itself an unguarded store method does not launder authority',
    () =>
      authorityOfStoreCall([
        mini('src/services/Store.js', STORE_SRC),
        mini('src/services/Other.js', `export const Other = { async wrap() { return Store.pull(); } };`),
      ]),
    'cannot-tell',
  ],
  [
    // THE PROBE THAT MAKES THE DEPTH CAP A CLAIM INSTEAD OF A COMMENT. The
    // four mutations above all red E3; changing `depth === 0` to `depth <= 1`
    // redded NOTHING, because the probe above resolves to `unguarded` either
    // way (its wrapper has no callers at all). So the cap was untested, and
    // an untested constant in a gate is decoration.
    //
    // Stated plainly rather than dressed up: THIS ROW ASSERTS THE GATE REDS
    // CODE THAT IS PROBABLY FINE. A store method wrapping another store
    // method, reached from a guarded control, is safe in fact. It is refused
    // because one hop is what this tree has, and isUnderGuard's own header
    // sets the convention — extend the recogniser when a legitimate shape
    // appears, against the comment, rather than pre-approving shapes nothing
    // uses. If a second hop ever lands, this row is the thing to re-argue.
    //
    // EXPECTATION CORRECTED 2026-08-29 for the three-state label, and the
    // cap is still a claim rather than a comment: with `depth <= 1` the
    // second hop resolves the outer caller as guarded and the whole thing
    // reads 'guarded', which is not 'cannot-tell' either. The mutation still
    // reds this row.
    'arm 3: authority does NOT propagate two hops, even when the outer caller is guarded',
    () =>
      authorityOfStoreCall([
        mini('src/services/Store.js', STORE_SRC),
        mini('src/services/Other.js', `export const Other = { async wrap() { return Store.pull(); } };`),
        mini('src/screens/A.js', `function C(){ const handleGo = () => Other.wrap(); return nectarConsent && <B onPress={handleGo} />; }`),
      ]),
    'cannot-tell',
  ],
  [
    'arm 3: a method on a NON-exported plain object still resolves by its binding',
    () =>
      authorityOfStoreCall([
        mini('src/services/Store.js', STORE_SRC),
        mini('src/screens/A.js', `function C(){ return nectarConsent && <B onPress={() => Store.pull()} />; }`),
      ]),
    'guarded',
  ],
  // THE DISJOINTNESS ROWS (Lumen's pin (a), 2026-09-05), AND THEY ARE ASKED
  // AT THE TRIGGER, NOT AT THE VERDICT. My first draft asserted that an
  // arrow-valued store method still reads 'guarded' through arm 3, and that
  // row was decoration: teaching `findEnclosingHandlerName` to accept an
  // ObjectProperty left it green, because arm 2 also requires JSX WIRING and
  // a store file has no JSX, so arm 3 answered either way. The row was
  // vouched for by the arm it was not about. What actually has to hold is
  // that the resolver returns NOTHING inside a store, so ask it directly.
  // Each row reds under its own resolver-loosening mutation, and the E2
  // measurement above is the second half of the same story: loosening the
  // resolver also breaks live resolution, because an inline `commit: () => …`
  // argument property would start shadowing the real handler.
  [
    'trigger disjointness: an ObjectMethod store method resolves to NO handler name',
    () => String(handlerNameOfStoreCall(STORE_SRC)),
    'null',
  ],
  [
    'trigger disjointness: an arrow-VALUED store method resolves to NO handler name',
    () =>
      String(
        handlerNameOfStoreCall(
          `export const Store = { pull: async () => client.from('nectar_zaps').select('x') };`
        )
      ),
    'null',
  ],
  // THE CLAUSE ONE FILE BOUNDARY OUT (Lumen's pin (d)). The store method's
  // only caller is a wired handler that is ALSO called bare on mount, which
  // is PROBE-A's shape hosted in a caller file. Arm (2) answers
  // 'other-callers' at depth 1 and arm (3)'s collapse must carry the label
  // out rather than renaming it to cannot-tell: the two say different things
  // to whoever reads the E2 line, and only one of them names a defect.
  [
    'arm 3: a caller that is a guarded-but-not-exclusive handler propagates other-callers',
    () =>
      authorityOfStoreCall([
        mini('src/services/Store.js', STORE_SRC),
        mini(
          'src/screens/A.js',
          `function C(){ const handleGo = () => Store.pull(); useEffect(() => { handleGo(); }, []); return nectarConsent && <B onPress={handleGo} />; }`
        ),
      ]),
    'other-callers',
  ],
];
const armFailures = [];
for (const [label, run, want] of ARM_CALIBRATION) {
  let got;
  try {
    got = run();
  } catch (err) {
    got = `threw: ${err.message}`;
  }
  if (got !== want) armFailures.push(`${label} -> got ${got}, want ${want}`);
}
check('E3 store-propagation and effect-authority calibration (arms 3 and 4)', armFailures, []);

// E3a THE RESOLVER CONTROL, and it exists because of E1a's lesson on this
// same file: a resolver that quietly stops resolving turns a real check into
// a vacuous one. Here the failure would be subtler than E1a's — if
// `findEnclosingStoreMethod` returned null, arm (3) would never run and E2
// would go RED, which is safe. The hazard is the other end: the reserved
// calls migrating OUT of a store into some shape arm (3) never sees, leaving
// E2 green on arms (1)/(2) alone and this whole extension dead code nobody
// notices. So the tree's own store-hosted calls are counted and named.
const storeHosted = queryHits
  .map((h) => ({ h, store: findEnclosingStoreMethod(h.ancestors) }))
  .filter((x) => x.store);
// STATED AS A CONTRACT, NOT AS POSITIONS. An earlier draft of this row
// listed `NectarStore.getBalanceDrops x3` with file:line — which reds on any
// edit that moves a line and teaches whoever hits it to re-baseline the
// number rather than read the rule. Coordinate tables are stale cargo; what
// this row is actually about is that arm 3 resolved and found callers.
check('E3a arm 3 is live on this tree: at least one reserved query is store-hosted', storeHosted.length > 0, true);
check(
  'E3a every store-hosted reserved call resolves to a Binding.method with at least one caller',
  storeHosted
    .filter(({ store }) => findStoreMethodCallers(parsed, store.binding, store.method).length === 0)
    .map(({ h, store }) => `${h.rel}:${h.line} ${h.name} -> ${store.binding}.${store.method} has no callers`),
  []
);


// --- F. The grant's coupling ----------------------------------------------
// R12's class, and it arrived wearing the fix for it. Ruling 2 (DES-24 §7)
// bounds the ladder cap at four times the starter grant, and the cap
// re-derives from NECTAR_STARTER_GRANT_DROPS -- but that constant is a HAND
// COPY of the literal inside `nectar_starter_grant_drops()`, and until this
// row nothing coupled them. Both sides say 500 today, which is exactly the
// arrangement C3 already refuses one layer up: two constants that agree
// because someone read both.
//
// The migration's own comment says the grant is a PLACEHOLDER pending
// ratification, so a DB-side re-ratification is the likely trigger and not a
// hypothetical: move the SQL to 1000, leave the JS at 500, and the cap lands
// at 2x the real grant instead of 4x -- Ruling 2's own failure mode (a
// consented user who has received nothing renders a half-full vessel, and
// every gift after it moves the cell less than it should) walking back in
// wearing the fix as a disguise.
//
// SO THE ROW READS THE SQL, not a second literal this file owns. Latest
// migration that DEFINES the function wins -- defines, not mentions. Two
// migrations name it and only one creates it: 20260826000006 re-comments it
// (and drops a DIFFERENT function), so "latest migration matching /grant/"
// would read the wrong file and answer cannot-tell forever.
//
// FAILS CLOSED, and unlike C4 it deliberately does not self-upgrade. C4 can
// pin a column NAME when the migration is absent, because the name is
// knowable without it. A COUPLING IS NOT: with no definition in tree there is
// nothing for the JS constant to agree WITH, which is precisely the defect
// this row exists for. No definition, a body with no readable literal, or a
// definition later dropped without replacement all read RED.
//
// WHAT IT DOES NOT COVER, stated rather than implied: a THIRD copy of the
// number lives in 20260826000006's comment PROSE ("Same 500 number as before
// this migration"). That copy can mislead a reader; it cannot move a pixel,
// and a lexical rule over that string would have to tell 500 apart from 2026,
// 0.001 and an event id. Its CONTENT stays flagged here, not gated.
//
// Lumen's ruling on it (thread b4533a52, 2026-08-27) split that sentence in
// two, because it lives in two homes with different tenses. As migration-file
// prose it is append-only history and cannot go stale -- a re-ratification
// arrives as a NEW file and does not falsify 000006's sentence about its own
// moment. But it is also a `comment on function`: a CATALOG write, present
// tense, and the database's own documentation of the grant. Redefine the
// grant in a later migration without re-commenting and the catalog says 500
// over a function returning 750. F1 reds at that instant -- and goes green
// again the moment the JS constant is repaired, a repair path that never
// touches the comment. F4 is that residual, and it gates FRESHNESS, never
// content: no digit is parsed out of prose anywhere in it.
const GRANT_FN = 'nectar_starter_grant_drops';
const GRANT_DEFINE_SRC = String.raw`create\s+(?:or\s+replace\s+)?function\s+public\.${GRANT_FN}\s*\(`;
const GRANT_DROP_SRC = String.raw`drop\s+function\s+(?:if\s+exists\s+)?public\.${GRANT_FN}\s*\(`;
// A commented-out `create function` is prose, not a definition. Blanking
// whole `--` lines is enough here and nothing subtler would be honest: the
// alternative is a SQL parser, and this extractor's whole calibration below
// is what stands in for one.
const uncommented = (src) =>
  src
    .split('\n')
    .map((l) => (l.trim().startsWith('--') ? '' : l))
    .join('\n');
// null = the file says nothing about the function.
// { kind: 'drop' | 'define', literal: number | null } = its LAST word on it.
const grantEventIn = (rawSrc) => {
  const src = uncommented(rawSrc);
  const events = [];
  for (const [kind, source] of [
    ['define', GRANT_DEFINE_SRC],
    ['drop', GRANT_DROP_SRC],
  ]) {
    const re = new RegExp(source, 'gi');
    let m;
    while ((m = re.exec(src)) !== null) events.push({ kind, at: m.index });
  }
  if (events.length === 0) return null;
  events.sort((a, b) => a.at - b.at);
  const last = events[events.length - 1];
  if (last.kind === 'drop') return { kind: 'drop', literal: null };
  const body = src.slice(last.at);
  const open = body.indexOf('$$');
  const close = open === -1 ? -1 : body.indexOf('$$', open + 2);
  if (close === -1) return { kind: 'define', literal: null };
  const lit = body.slice(open + 2, close).match(/select\s+(\d+)\s*(?:::\s*\w+)?\s*$/i);
  return { kind: 'define', literal: lit ? Number(lit[1]) : null };
};

// Lexical sort == chronological, because every migration name is timestamp
// prefixed. F4 leans on the same fact.
const migrationFiles = (await readdir(migrationDir).catch(() => [])).sort();
let grantSource = null;
for (const f of migrationFiles) {
  const event = grantEventIn(await readFile(path.join(migrationDir, f), 'utf8'));
  if (event) grantSource = { file: f, event };
}
const grantLiteral = () => {
  if (!grantSource) return `cannot tell: no migration in tree defines ${GRANT_FN}()`;
  const { file, event } = grantSource;
  if (event.kind === 'drop') return `cannot tell: ${file} drops ${GRANT_FN}() with no replacement`;
  if (event.literal === null) return `cannot tell: ${file} defines ${GRANT_FN}() with no readable integer literal`;
  return event.literal;
};
check(
  `F1 NECTAR_STARTER_GRANT_DROPS equals the SQL grant literal (${grantSource ? grantSource.file : 'no defining migration'})`,
  grantLiteral(),
  NECTAR_STARTER_GRANT_DROPS
);

// F2 CALIBRATES THE EXTRACTOR IN BOTH DIRECTIONS, because F1 is green on a
// tree where the two sides agree and would be just as green on a regex that
// matched nothing -- the same reason B is calibrated against a synthetic
// corpus. A fail-closed row is invisible to a corpus that only exercises the
// safe answer, so the corpus runs both directions: of its eight rows, four
// assert a literal IS found and three assert one is NOT. The eighth is
// neither and is counted as neither -- the drop row asserts that a definition
// SUPERSEDED is not a definition read, which is a third answer, not a
// negative one. (An earlier draft of this comment said "four... three" of an
// eight-row corpus and left that row uncounted in either direction; Lumen
// caught it.)
const DEF = (n, replace = false) =>
  `create ${replace ? 'or replace ' : ''}function public.${GRANT_FN}()\n` +
  `returns bigint\nlanguage sql immutable\nas $$ select ${n}::bigint $$;\n`;
const GRANT_CALIBRATION = [
  ['a plain definition yields its literal', DEF(500), { kind: 'define', literal: 500 }],
  ['create or replace yields its literal', DEF(750, true), { kind: 'define', literal: 750 }],
  ['a re-ratification later in the same file wins', DEF(500) + DEF(900, true), { kind: 'define', literal: 900 }],
  [
    'a trailing revoke/grant block does not disturb the literal',
    DEF(500) + `revoke all on function public.${GRANT_FN}() from public;\n`,
    { kind: 'define', literal: 500 },
  ],
  [
    'a drop after the definition supersedes it',
    DEF(500) + `drop function public.${GRANT_FN}();\n`,
    { kind: 'drop', literal: null },
  ],
  [
    'a comment naming the function is not a definition',
    `comment on function public.${GRANT_FN}() is 'PLACEHOLDER 500 drops';\n`,
    null,
  ],
  [
    'a commented-out definition is not a definition',
    DEF(500)
      .split('\n')
      .map((l) => `-- ${l}`)
      .join('\n'),
    null,
  ],
  [
    'a body with no integer literal reads cannot-tell, not zero',
    `create function public.${GRANT_FN}()\nreturns bigint\nlanguage sql stable\n` +
      `as $$ select current_setting('app.grant')::bigint $$;\n`,
    { kind: 'define', literal: null },
  ],
];
const grantCalibrationFailures = [];
for (const [label, src, want] of GRANT_CALIBRATION) {
  const got = grantEventIn(src);
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    grantCalibrationFailures.push(`${label} -> got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  }
}
check('F2 grant-literal extractor calibration, both directions', grantCalibrationFailures, []);

// F3 CLOSES THE OTHER END OF THE SAME CHAIN. F1 couples SQL -> JS; this
// couples JS -> the cap. Ruling 2's bound only holds while the cap DERIVES,
// and the cap is the placeholder most likely to acquire a hand-tuned number
// the day 19a produces a distribution. Written as the bound rather than as
// an equality, because a larger cap is legal and only a smaller one
// reintroduces the full-cell-at-consent failure.
check(
  `F3 the ladder cap derives from the grant (Ruling 2: cap >= ${NECTAR_LADDER_RUNGS} x grant)`,
  NECTAR_LADDER_CAP_DROPS >= NECTAR_STARTER_GRANT_DROPS * NECTAR_LADDER_RUNGS,
  true
);

// F4 GATES THE CATALOG COMMENT'S FRESHNESS, NEVER ITS CONTENT (Lumen's shape,
// Sage's fast-follow sequencing -- thread b4533a52, 2026-08-27). The residual
// F1 leaves behind is not a wrong number in prose, it is a `comment on
// function` that outlives the definition it describes: redefine the grant in
// a later migration without re-commenting, repair the JS constant, and F1
// goes green over a catalog that still documents the old figure. That comment
// is, by its own text, the ratification record ("still pending Colin's
// ratification of the magnitude itself") -- so a freshness row forces the
// record to be re-authored at exactly the moment there is something to
// ratify.
//
// STRUCTURAL, so the 500-vs-2026-vs-event-id objection never arises: the row
// compares two FILENAMES. Migration names are timestamp-prefixed and this
// file already relies on that ordering being lexical (the `.sort()` above), so
// `latest comment file >= latest defining file` is the whole assertion.
//
// A SEPARATE EXTRACTOR ON PURPOSE. Folding a `comment` event into
// `grantEventIn` would let a re-comment supersede a definition and F1 would
// read `literal: null` on today's tree -- the comment is the function's last
// mention, never its last definitional word. Two questions, two readers.
//
// THREE BRANCHES PASS WITHOUT ASSERTING ANYTHING, each for a stated reason,
// because a second red on one defect is noise: no definition in tree and a
// definition later dropped are both already F1's, and an ABSENT comment
// documents no number at all. That last one is the reason F5 exists -- an
// extractor that matched nothing would take the absent branch and this row
// would be green forever.
const GRANT_COMMENT_SRC = String.raw`comment\s+on\s+function\s+public\.${GRANT_FN}\s*\(`;
const grantCommentIn = (rawSrc) => new RegExp(GRANT_COMMENT_SRC, 'i').test(uncommented(rawSrc));

let grantCommentFile = null;
for (const f of migrationFiles) {
  if (grantCommentIn(await readFile(path.join(migrationDir, f), 'utf8'))) grantCommentFile = f;
}
const commentFreshnessFailures = [];
if (grantSource && grantSource.event.kind === 'define' && grantCommentFile) {
  if (grantCommentFile < grantSource.file) {
    commentFreshnessFailures.push(
      `${grantSource.file} defines ${GRANT_FN}() but the latest \`comment on function\` for it is ` +
        `${grantCommentFile}, which is older -- the catalog documents a superseded grant`
    );
  }
}
// The label names the DEFINING file, which is not always `grantSource.file`:
// on a tree whose last word is a drop there is no definer, and saying
// otherwise would be the same right-measurement-wrong-name mistake this
// module keeps finding elsewhere.
const grantDefineLabel = !grantSource
  ? 'none'
  : grantSource.event.kind === 'define'
    ? grantSource.file
    : `none (${grantSource.file} drops it)`;
check(
  `F4 the ${GRANT_FN}() catalog comment is not older than its definition ` +
    `(define ${grantDefineLabel}, comment ${grantCommentFile || 'none'})`,
  commentFreshnessFailures,
  []
);

// F5 CALIBRATES F4's EXTRACTOR, and it is not optional here. F1 fails closed,
// so a blinded extractor reds and announces itself; F4 passes closed by
// design (an absent comment is a real, safe state), so a blinded extractor is
// SILENT. The false direction is what this row is for.
const GRANT_COMMENT_CALIBRATION = [
  [
    'a comment on the function is found',
    `comment on function public.${GRANT_FN}() is 'PLACEHOLDER 500 drops';\n`,
    true,
  ],
  [
    'a comment split across lines is found',
    `comment on function public.${GRANT_FN}() is\n  'PLACEHOLDER '\n  '500 drops';\n`,
    true,
  ],
  ['a commented-out comment is not a comment', `-- comment on function public.${GRANT_FN}() is 'x';\n`, false],
  ['a comment on a different function is not this one', `comment on function public.nectar_drop_microusd() is 'x';\n`, false],
  ['a definition alone carries no comment', DEF(500), false],
  ['a file that never names the function carries no comment', `create table public.unrelated (id uuid);\n`, false],
];
const grantCommentCalibrationFailures = [];
for (const [label, sample, want] of GRANT_COMMENT_CALIBRATION) {
  const got = grantCommentIn(sample);
  if (got !== want) grantCommentCalibrationFailures.push(`${label} -> got ${got}, want ${want}`);
}
check('F5 grant-comment extractor calibration, both directions', grantCommentCalibrationFailures, []);

console.log(`\n${pass} passed, ${fail} failed`);
console.log(
  `(${allStrings.length} rendered strings scanned, ${reserveHits.length} match the reserve, ` +
    `${NECTAR_SURFACES.length} surfaces declared: ${hosted.length} hosted, ${unhosted.length} container-absent, ` +
    `${QUERY_RESERVE.size} query identifiers reserved from ${nectarMigrationFiles.length} migration(s), ` +
    `${queryHits.length} non-bootstrap query call site(s) found, ${BOOTSTRAP.size} bootstrap object(s) carved out)`
);
if (fail > 0) process.exit(1);
