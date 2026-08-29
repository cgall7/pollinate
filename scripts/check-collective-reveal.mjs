// Gate for DES-21 — The Collective Reveal
// (GUIDES/POLLINATE_V2_DES21_COLLECTIVE_REVEAL.md).
//
//   npm run check:collective-reveal
//
// Covers the DESIGN-DECIDABLE acceptance rows from §12 — the ones checkable
// from source, over the render layer this ticket owns. The data layer (rows
// 8, 14-16, 19's DB half) already has its own gates
// (check-multi-writer-hives.mjs, check-contributor-names.mjs); this file
// does not repeat those. Runtime rows (9-13, 17's device half, 18's device
// half) need ENG-61 built and a device — they join the standing device pass,
// not this gate.
//
//   Row 1  the signature's condition is `pkg.isCollective` (per-volume),
//          never read from the entry.
//   Row 2  the signature sits inside PaperBlock, after the body, styled
//          `theme.type.bodySm` / `paperInk(step.paper)`, no alpha.
//   Row 3  no <Avatar> on the reveal surface (PackageOpen.js); the package
//          list (ReceivedPackages.js) shows one only on a solo row.
//   Row 4  the strings "by", "writer", "co-author", "contributor", "member"
//          render nowhere in either file (scoped to RENDERED copy via the
//          shared walker — a comment or an identifier does not count, and
//          should not: `pkg.contributorNames` is not something anyone reads).
//   Row 6  `That's everything {senderName} sent.` renders only on the
//          non-collective branch of the SAME conditional the collective
//          colophon renders from — one test, two mutually exclusive arms,
//          not two independently-guarded strings that could both fire.
//   Row 7  the package row's title is the sender's name on a solo row and
//          the roster on a collective row, from one ternary keyed on
//          `pkg.isCollective`.
//
// Modeled on check-hex-tap.mjs for the walker shape (manual `visit` over a
// `@babel/parser` AST — this repo is not `type: module`-clean enough for
// babel-preset-expo, and neither file here needs anything beyond `jsx`) and
// on check-copy-rules.mjs for row 4, reusing `collectRenderedStrings` rather
// than a second string collector.
//
// `isUnderGuard` (scripts/lib/rendered-strings.mjs) is NOT used for rows 1/3
// — its own header says why: it recognises a bare `Identifier` on a
// LogicalExpression's `left`, and every guard in this ticket is a
// `MemberExpression` (`pkg.isCollective`) or a negated one
// (`!pkg.isCollective`). Extending the shared recogniser would widen it for
// two other gates that don't need the change; a local guard check, scoped to
// this file, is the smaller edit.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { parse } from '@babel/parser';
import { collectRenderedStrings } from './lib/rendered-strings.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const PACKAGE_OPEN = path.join(root, 'src/screens/PackageOpen.js');
const RECEIVED_PACKAGES = path.join(root, 'src/screens/ReceivedPackages.js');

let pass = 0;
const failures = [];
const ok = (row, msg) => { pass += 1; console.log(`  ok   ${row}: ${msg}`); };
const bad = (row, msg) => { failures.push(`${row}: ${msg}`); console.log(`  FAIL ${row}: ${msg}`); };

const ast = (src) => parse(src, { sourceType: 'module', plugins: ['jsx'] });
const visit = (node, fn) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => visit(n, fn)); return; }
  if (typeof node.type === 'string') fn(node);
  for (const k of Object.keys(node)) {
    if (k === 'loc' || k === 'leadingComments' || k === 'trailingComments') continue;
    visit(node[k], fn);
  }
};

// `obj.prop` — the one member-access shape every guard/discriminant in this
// ticket uses.
const isMember = (node, obj, prop) =>
  node?.type === 'MemberExpression' &&
  node.object?.type === 'Identifier' && node.object.name === obj &&
  node.property?.type === 'Identifier' && node.property.name === prop;

// `flag && <jsx>` / `flag && cond2 && <jsx>` (n-ary chains, since the
// signature's real guard is `pkg.isCollective && step.authorName && (…)`) —
// true if `test(node.left)` matches ANYWHERE the chain bottoms out reading
// left-to-right.
const chainHasLeft = (node, test) => {
  if (node?.type !== 'LogicalExpression' || node.operator !== '&&') return false;
  if (test(node.left)) return true;
  return chainHasLeft(node.left, test);
};

// `!flag && <jsx>`
const isNegatedGuard = (node, obj, prop) =>
  node?.type === 'LogicalExpression' &&
  node.operator === '&&' &&
  node.left?.type === 'UnaryExpression' &&
  node.left.operator === '!' &&
  isMember(node.left.argument, obj, prop);

const findJSXElement = (root, name) => {
  const out = [];
  visit(root, (n) => {
    if (n.type === 'JSXElement' && n.openingElement?.name?.type === 'JSXIdentifier' && n.openingElement.name.name === name) {
      out.push(n);
    }
  });
  return out;
};

async function main() {
  const packageOpenSrc = await readFile(PACKAGE_OPEN, 'utf8');
  const receivedPackagesSrc = await readFile(RECEIVED_PACKAGES, 'utf8');
  const packageOpenAst = ast(packageOpenSrc);
  const receivedPackagesAst = ast(receivedPackagesSrc);

  // --- Rows 1/2: the signature ---------------------------------------
  const paperBlocks = findJSXElement(packageOpenAst, 'PaperBlock');
  if (paperBlocks.length !== 1) {
    bad('row 1/2', `expected exactly one <PaperBlock> in PackageOpen.js, found ${paperBlocks.length}`);
  } else {
    const children = paperBlocks[0].children.filter(
      (c) => c.type === 'JSXElement' || (c.type === 'JSXExpressionContainer' && c.expression.type !== 'JSXEmptyExpression')
    );
    const entryTextIdx = children.findIndex(
      (c) => c.type === 'JSXElement' && c.openingElement?.name?.name === 'Text'
    );
    const sigIdx = children.findIndex((c) => {
      if (c.type !== 'JSXExpressionContainer') return false;
      return chainHasLeft(c.expression, (n) => isMember(n, 'pkg', 'isCollective'));
    });
    if (sigIdx === -1) {
      bad('row 1', 'no PaperBlock child is guarded by a chain starting `pkg.isCollective && …`');
    } else {
      ok('row 1', 'the signature\'s condition chain starts with `pkg.isCollective` (per-volume, not per-entry)');
      if (entryTextIdx === -1 || sigIdx <= entryTextIdx) {
        bad('row 2', 'the signature does not come after the body <Text> inside PaperBlock');
      } else {
        ok('row 2', 'the signature is a PaperBlock child positioned after the body text');
      }
      // Style: find the guarded JSXElement's style attribute and confirm it
      // references `styles.entrySignature` and `paperInk(`.
      let sigNode = children[sigIdx];
      let guarded = sigNode.expression;
      while (guarded.type === 'LogicalExpression') guarded = guarded.right;
      const styleSrc = packageOpenSrc.slice(guarded.start, guarded.end);
      if (/styles\.entrySignature/.test(styleSrc) && /paperInk\(\s*step\.paper\s*\)/.test(styleSrc)) {
        ok('row 2', 'the signature\'s style references `styles.entrySignature` and `paperInk(step.paper)`');
      } else {
        bad('row 2', `signature JSX does not reference both styles.entrySignature and paperInk(step.paper): ${styleSrc.slice(0, 160)}`);
      }
    }
  }
  // The stylesheet entry itself: bodySm, no baked-in color/opacity (the ink
  // token must come from the inline `paperInk()` call above, never dimmed
  // in the sheet — §2.1's "an alpha of ink inverts on a dark paper").
  let entrySignatureStyleSrc = null;
  visit(packageOpenAst, (n) => {
    if (n.type === 'ObjectProperty' && n.key?.name === 'entrySignature' && n.value?.type === 'ObjectExpression') {
      entrySignatureStyleSrc = packageOpenSrc.slice(n.value.start, n.value.end);
    }
  });
  if (!entrySignatureStyleSrc) {
    bad('row 2', 'styles.entrySignature not found in PackageOpen.js StyleSheet.create');
  } else if (!/theme\.type\.bodySm/.test(entrySignatureStyleSrc)) {
    bad('row 2', `styles.entrySignature does not spread theme.type.bodySm: ${entrySignatureStyleSrc}`);
  } else if (/\bopacity\s*:/.test(entrySignatureStyleSrc) || /\bcolor\s*:/.test(entrySignatureStyleSrc)) {
    bad('row 2', `styles.entrySignature bakes in opacity/color instead of taking full-strength paperInk() inline: ${entrySignatureStyleSrc}`);
  } else {
    ok('row 2', 'styles.entrySignature is theme.type.bodySm with no baked-in color/opacity');
  }

  // --- Row 3: no Avatar on the reveal surface; guarded on the package row --
  const packageOpenAvatars = findJSXElement(packageOpenAst, 'Avatar');
  if (packageOpenAvatars.length === 0) {
    ok('row 3', 'PackageOpen.js renders no <Avatar> anywhere');
  } else {
    bad('row 3', `PackageOpen.js renders ${packageOpenAvatars.length} <Avatar> element(s) — feed grammar leaking into the reveal`);
  }

  const receivedAvatars = findJSXElement(receivedPackagesAst, 'Avatar');
  if (receivedAvatars.length !== 1) {
    bad('row 3/7', `expected exactly one <Avatar> in ReceivedPackages.js, found ${receivedAvatars.length}`);
  } else {
    let avatarGuarded = false;
    visit(receivedPackagesAst, (n) => {
      if (n.type === 'JSXExpressionContainer' && isNegatedGuard(n.expression, 'pkg', 'isCollective')) {
        // Confirm the avatar element itself is inside this container.
        const src = receivedPackagesSrc.slice(n.start, n.end);
        if (src.includes('Avatar')) avatarGuarded = true;
      }
    });
    if (avatarGuarded) {
      ok('row 3/7', 'the package row Avatar is guarded by `!pkg.isCollective` — absent, not substituted, on a collective row');
    } else {
      bad('row 3/7', 'the package row Avatar is not guarded by `!pkg.isCollective && …`');
    }
  }

  // --- Row 4: banned words in RENDERED copy only ----------------------
  const BANNED = [/\bby\b/i, /\bwriters?\b/i, /\bco-?authors?\b/i, /\bcontributors?\b/i, /\bmembers?\b/i];
  const renderedStrings = [
    ...collectRenderedStrings(packageOpenAst, { file: PACKAGE_OPEN, positions: ['jsx-text', 'jsx-expr', 'prop'] }),
    ...collectRenderedStrings(receivedPackagesAst, { file: RECEIVED_PACKAGES, positions: ['jsx-text', 'jsx-expr', 'prop'] }),
  ];
  const hits = renderedStrings.filter((s) => BANNED.some((re) => re.test(s.value)));
  if (hits.length === 0) {
    ok('row 4', `no forbidden word ("by"/"writer"/"co-author"/"contributor"/"member") in ${renderedStrings.length} rendered strings across both files`);
  } else {
    for (const h of hits) bad('row 4', `forbidden word in rendered copy at line ${h.line}: "${h.value}"`);
  }

  // --- Row 6: the colophon condition ------------------------------------
  let colophonOk = false;
  let colophonDetail = 'no matching ConditionalExpression found';
  visit(packageOpenAst, (n) => {
    if (colophonOk || n.type !== 'ConditionalExpression') return;
    if (!isMember(n.test, 'pkg', 'isCollective')) return;
    const consequentSrc = packageOpenSrc.slice(n.consequent.start, n.consequent.end);
    const alternateSrc = packageOpenSrc.slice(n.alternate.start, n.alternate.end);
    const consequentHasCollective = /wrote this for you/.test(consequentSrc);
    const alternateHasSolo = /That's everything/.test(alternateSrc) && /senderName/.test(alternateSrc);
    if (consequentHasCollective && alternateHasSolo) {
      colophonOk = true;
    } else {
      colophonDetail = `found pkg.isCollective ternary but branches don't match: consequent="${consequentSrc.slice(0, 80)}" alternate="${alternateSrc.slice(0, 80)}"`;
    }
  });
  if (colophonOk) {
    ok('row 6', 'one ConditionalExpression on `pkg.isCollective` carries both the collective colophon and the unchanged solo sentence as mutually exclusive arms');
  } else {
    bad('row 6', colophonDetail);
  }

  // --- Row 7: the package row title -------------------------------------
  let rowTitleOk = false;
  visit(receivedPackagesAst, (n) => {
    if (rowTitleOk || n.type !== 'ConditionalExpression') return;
    if (!isMember(n.test, 'pkg', 'isCollective')) return;
    const consequentSrc = receivedPackagesSrc.slice(n.consequent.start, n.consequent.end);
    const alternateSrc = receivedPackagesSrc.slice(n.alternate.start, n.alternate.end);
    if (/formatRoster/.test(consequentSrc) && /pkg\.senderName/.test(alternateSrc)) {
      rowTitleOk = true;
    }
  });
  if (rowTitleOk) {
    ok('row 7', 'the row title is `formatRoster(pkg.contributorNames)` on a collective row and `pkg.senderName` on a solo row, from one `pkg.isCollective` ternary');
  } else {
    bad('row 7', 'no `pkg.isCollective` ternary found choosing between formatRoster(...) and pkg.senderName');
  }

  console.log(`\ncheck-collective-reveal: ${pass} passed, ${failures.length} failed`);
  if (failures.length > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error('check-collective-reveal: FAILED —', e.stack || e.message);
  process.exit(1);
});
