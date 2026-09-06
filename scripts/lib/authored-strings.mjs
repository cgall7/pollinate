// authored-strings.mjs — EVERY STRING THIS APP AUTHORS, including the two
// classes no position-based collector can see.
//
// `collectRenderedStrings` classifies a string by its POSITION in the tree,
// which is exactly right for the questions it was built for and blind by
// construction to copy that never occupies a position. Measured at
// `5d7f292`, 48 authored strings are in that blind spot:
//
//   35  string arguments reaching a `set*` state setter. The whole
//       CombNectarCompose validation family, the whole Onboarding
//       auth-error surface, plus CombInvite, Compose, CreateComb and
//       HoneycombTab's `{ tone, text }` messages.
//   13  prose values in module-scope object literals — `MINT_REFUSAL_COPY`
//       (DES-29 ruled copy), three `COPY` maps, `SEED_CTA_LABELS`.
//
// Lumen ruled the widening for the acquisition-vocabulary gate (UX Design
// `db1dc0cb`, 2026-09-06) on one predicted string and it turned out to be
// forty-eight. It lives here rather than inside that gate because the blind
// spot is not that gate's: any copy rule keyed on `collectRenderedStrings`
// alone — the register ban, the dash rule — is standing over the same hole,
// and a second copy of this walk would be a second premise to drift.
//
// THE DEMO CORPUS IS A DELIBERATE MEMBER. `scripts/lib/demo-seed-corpus.mjs`
// is app-authored copy an App Store reviewer reads, and `forbidden-words.mjs`
// already records the day it stopped being outside every gate's universe.
// Callers that want only shipped-app copy filter on `origin`.

import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import {
  POSITIONS,
  PositionVocabularyError,
  collectRenderedStrings,
  walkWithAncestry,
} from './rendered-strings.mjs';

export const DEMO_CORPUS = 'scripts/lib/demo-seed-corpus.mjs';

// The same prose test `rendered-strings.mjs` applies inside `src/constants/`.
// A colour token or an enum key is not copy, and the two widened classes are
// raw AST reads with no position to filter on, so they need it explicitly.
export const isProse = (v) =>
  /\s/.test(v) && /[a-z]{2}/.test(v) && !/^(rgba?\(|#[0-9a-f]{3,8}\b)/i.test(v);

const literalText = (n) => {
  if (n.type === 'StringLiteral') return n.value;
  if (n.type === 'TemplateLiteral') return n.quasis.map((q) => q.value.cooked ?? q.value.raw).join(' ');
  return null;
};

// Returns { strings, files, parseFailures, vocabularyErrors }. Each string is
// { rel, line, value, origin }, origin ∈ rendered | setter | map | demo, and
// the set is deduped on file+line+value — so a string counted under `setter`
// or `map` is one no `rendered` entry claimed first, which is what lets a
// caller assert the widening is still load-bearing.
export function collectAuthoredStrings({ root, includeDemoCorpus = true } = {}) {
  if (typeof root !== 'string' || !root) throw new Error('collectAuthoredStrings: `root` is required');

  const files = [];
  (function walk(dir) {
    for (const name of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, name);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (name.endsWith('.js')) files.push(path.relative(root, p));
    }
  })(path.join(root, 'src'));
  files.unshift('App.js');

  const strings = [];
  const seen = new Set();
  const add = (rel, line, value, origin) => {
    const key = `${rel}|${line}|${value}`;
    if (seen.has(key)) return;
    seen.add(key);
    strings.push({ rel, line, value, origin });
  };

  const parseFailures = [];
  const vocabularyErrors = [];

  for (const rel of files) {
    let ast;
    try {
      ast = parse(fs.readFileSync(path.join(root, rel), 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
    } catch (e) {
      parseFailures.push(`${rel}: ${e.message}`);
      continue;
    }

    try {
      for (const s of collectRenderedStrings(ast, { file: rel, positions: POSITIONS })) {
        add(rel, s.line, s.value, 'rendered');
      }
    } catch (e) {
      if (!(e instanceof PositionVocabularyError)) throw e;
      vocabularyErrors.push(`${rel}: ${e.message}`);
    }

    // (ii) any prose string reaching a `set*` state setter, at any depth of
    // its arguments. The bare argument (`setValidationMessage('…')`) and the
    // object form (`setAddMessage({ tone, text: '…' })`) are the same class
    // and are collected the same way, because the second is what the first
    // becomes the first time a message needs a tone.
    walkWithAncestry(ast, (node) => {
      if (node.type !== 'CallExpression') return;
      const name = node.callee?.type === 'Identifier' ? node.callee.name : null;
      if (!name || !/^set[A-Z]/.test(name)) return;
      walkWithAncestry(node.arguments, (n) => {
        const v = literalText(n);
        if (v === null || !isProse(v)) return;
        add(rel, n.loc.start.line, v, 'setter');
      });
    });

    // (iii) module-scope copy maps. The refusal map the ruling names is read
    // at its setter call site through a member expression, so (ii) cannot
    // reach it: the argument is an identifier and the copy is three
    // declarations away.
    for (const st of ast.program.body) {
      const decl =
        st.type === 'VariableDeclaration'
          ? st
          : st.type === 'ExportNamedDeclaration' && st.declaration?.type === 'VariableDeclaration'
            ? st.declaration
            : null;
      if (!decl) continue;
      for (const d of decl.declarations) {
        if (d.init?.type !== 'ObjectExpression') continue;
        for (const p of d.init.properties) {
          if (p.type !== 'ObjectProperty' || p.value?.type !== 'StringLiteral') continue;
          if (!isProse(p.value.value)) continue;
          add(rel, p.value.loc.start.line, p.value.value, 'map');
        }
      }
    }
  }

  if (includeDemoCorpus) {
    try {
      const ast = parse(fs.readFileSync(path.join(root, DEMO_CORPUS), 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
      walkWithAncestry(ast, (n) => {
        const v = literalText(n);
        if (v === null || !isProse(v)) return;
        add(DEMO_CORPUS, n.loc.start.line, v, 'demo');
      });
    } catch (e) {
      parseFailures.push(`${DEMO_CORPUS}: ${e.message}`);
    }
  }

  return { strings, files, parseFailures, vocabularyErrors };
}
