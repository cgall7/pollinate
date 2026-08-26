// Enforcement hook for legalCopy.js's own avatar-picker TRIPWIRE bullet
// (Lumen, DES-24 §6.5 sweep, 2026-08-26 — thread c0984115).
//
//   npm run check:avatar-writer-tripwire
//
// WHAT IS TRUE TODAY, AND IT IS A DECISION, NOT AN ACCIDENT.
//
// `src/constants/legalCopy.js` promises "never requests access to your ...
// camera roll" and its header states the reason in the same breath: the
// `avatars` storage bucket exists (`20260809000001`) and `profiles.avatar_url`
// is a real column, but nothing in `src/` writes either. The header even
// names the falsifying event in its own TRIPWIRE block: "An avatar image
// picker falsifies [that sentence] ... and turns the dead `avatars` bucket
// real." That block is prose. Nothing upstream of a human noticing the
// comment enforces it.
//
// THE GRANT IS ALREADY LIVE, WHICH IS WHY THIS CANNOT BE A SCHEMA GATE.
// Lumen's sweep found `profiles_update_own` (20260808000001:32-35) already
// permits the row's own owner to write `avatar_url` — RLS has nothing left
// to arm. The only thing standing between today and a real photo on the comb
// is client code that nobody has written yet, so the arming edit is
// invisible to every migration-sentinel gate in this repo (they all key off
// `supabase/migrations/`, and this transition needs none). This gate is the
// one honest place left to catch it: it watches the two call shapes a picker
// would actually add.
//
// SELF-DELETING BY CONSTRUCTION, same shape as check-legal-consent-gate.mjs.
// It is green in every state except the one it exists for, and the fix that
// makes it green again — writing the picker's disclosure into legalCopy.js's
// promise sentences and TRIPWIRE block, per ENG-65's own build-facts entry
// (mem/eng65_honeyed_hexagon_build_facts, fact 2) and the COPY-9 same-commit
// precedent (OUTBOX/COPY9_LEGALCOPY_REWRITE.md) — leaves nothing behind to
// clean up.
//
// TWO SHAPES, BOTH STRUCTURAL, NEITHER A BARE STRING MATCH. A regex over
// source text for "avatar_url" or "avatars" would fire on this file's own
// comments and on every read call site (`select('avatar_url')`,
// `member.avatarUrl`) — this repo's own recurring false-positive class (the
// `sin`/`single` and `we'll`/`well` incidents). Both rules below require the
// AST shape of an actual write, not a mention:
//
//   1. `<expr>.storage.from('avatars').upload(...)` — a Supabase Storage
//      upload into the named bucket. Walks the callee chain for a `.storage`
//      member and a `.from('avatars')` call beneath an `.upload(...)` call.
//   2. `<expr>.from('profiles').(update|insert|upsert)({ ...avatar_url... })`
//      — a Supabase table write whose payload sets `avatar_url`. Walks the
//      callee chain for `.from('profiles')` beneath one of the three
//      mutating verbs, and requires `avatar_url` as a literal key in the
//      first argument (or in each element, for an array upsert/insert).
//
// SCOPE OF THE CLAIM. This does not resolve a payload built from a variable
// (`update(payload)` where `payload` is assembled elsewhere) or route through
// a wrapper function — same limit check-entry-writes.mjs names for its own
// call-site census. Nothing on this path does either today; if that changes,
// it lands red-on-a-trap only in the sense that a real write existed and
// this gate did not see it, which is the failure mode to widen the walk for,
// not silence.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir } from 'node:fs/promises';
import { parse } from '@babel/parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUCKET = 'avatars';
const TABLE = 'profiles';
const COLUMN = 'avatar_url';
const MUTATING_VERBS = new Set(['update', 'insert', 'upsert']);

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
const rel = (p) => path.relative(ROOT, p);

// --- Enumerate off disk, not off a list, same convention as
// check-entry-writes.mjs and check-copy-rules.mjs. ---
const jsFiles = async (dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await jsFiles(full)));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
};

const walk = (node, visit) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, visit));
    return;
  }
  if (typeof node.type === 'string') visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
    walk(node[key], visit);
  }
};

// True if `node` is `X.from(<literal>)` for the given table/bucket name,
// walked down through however many `.eq()`/`.select()`-style calls sit
// between it and the write — Supabase's builder chains grow leftward.
const chainContainsFromCall = (node, name) => {
  let cur = node;
  while (cur) {
    if (
      cur.type === 'CallExpression' &&
      cur.callee?.type === 'MemberExpression' &&
      !cur.callee.computed &&
      cur.callee.property?.type === 'Identifier' &&
      cur.callee.property.name === 'from' &&
      cur.arguments?.[0]?.type === 'StringLiteral' &&
      cur.arguments[0].value === name
    ) {
      return true;
    }
    cur = cur.type === 'CallExpression' ? cur.callee?.object : cur.type === 'MemberExpression' ? cur.object : null;
  }
  return false;
};

const objectHasKey = (objExpr, key) =>
  objExpr?.type === 'ObjectExpression' &&
  objExpr.properties.some(
    (p) =>
      p.type === 'ObjectProperty' &&
      !p.computed &&
      ((p.key.type === 'Identifier' && p.key.name === key) || (p.key.type === 'StringLiteral' && p.key.value === key)),
  );

const payloadHasColumn = (arg, key) => {
  if (!arg) return false;
  if (arg.type === 'ArrayExpression') return arg.elements.some((el) => objectHasKey(el, key));
  return objectHasKey(arg, key);
};

const uploadSites = [];
const writeSites = [];

const files = [path.join(ROOT, 'App.js'), ...(await jsFiles(path.join(ROOT, 'src')))];
const parseErrors = [];

for (const file of files) {
  let ast;
  try {
    ast = parse(await readFile(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  } catch (e) {
    parseErrors.push(`${rel(file)} — ${e.message}`);
    continue;
  }

  walk(ast.program, (node) => {
    if (node.type !== 'CallExpression') return;
    if (node.callee?.type !== 'MemberExpression' || node.callee.computed) return;
    const verb = node.callee.property?.name;

    // Rule 1: `<...>.storage.from('avatars').upload(...)`.
    if (verb === 'upload') {
      const obj = node.callee.object;
      const hasStorage = (() => {
        let cur = obj;
        while (cur) {
          if (cur.type === 'MemberExpression' && !cur.computed && cur.property?.name === 'storage') return true;
          cur = cur.type === 'CallExpression' ? cur.callee?.object : cur.type === 'MemberExpression' ? cur.object : null;
        }
        return false;
      })();
      if (hasStorage && chainContainsFromCall(obj, BUCKET)) {
        uploadSites.push(`${rel(file)}:${node.loc.start.line}`);
      }
    }

    // Rule 2: `<...>.from('profiles').(update|insert|upsert)({ avatar_url })`.
    if (MUTATING_VERBS.has(verb) && chainContainsFromCall(node.callee.object, TABLE) && payloadHasColumn(node.arguments[0], COLUMN)) {
      writeSites.push(`${rel(file)}:${node.loc.start.line}`);
    }
  });
}

ok(`${files.length} files parsed under App.js + src/`);
if (parseErrors.length) bad('every file parsed', parseErrors.join('; '));
else ok('every file parsed');

if (uploadSites.length === 0) {
  ok(`no upload() call targets the '${BUCKET}' storage bucket`);
} else {
  bad(
    `no upload() call targets the '${BUCKET}' storage bucket`,
    `found at ${uploadSites.join(', ')} — an avatar picker has landed. Before merging: rewrite legalCopy.js's ` +
      `camera-roll promise and its TRIPWIRE block in the SAME commit (see mem/eng65_honeyed_hexagon_build_facts ` +
      `fact 2, and the same-commit precedent in OUTBOX/COPY9_LEGALCOPY_REWRITE.md).`,
  );
}

const verbList = [...MUTATING_VERBS].join('/');
if (writeSites.length === 0) {
  ok(`no ${TABLE}.${verbList} call writes '${COLUMN}'`);
} else {
  bad(
    `no ${TABLE} write sets '${COLUMN}'`,
    `found at ${writeSites.join(', ')} — same remedy as above: legalCopy.js's promise and TRIPWIRE block must ` +
      `change in this commit, not a follow-up.`,
  );
}

console.log(`\ncheck-avatar-writer-tripwire: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
