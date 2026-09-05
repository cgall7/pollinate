// Gate: a spec address in `scripts/` opens something, or it is disclaimed in
// one canonical sentence.
//
//   npm run check:spec-citation
//
// Ruled by Lumen, 2026-09-05, in POLLINATE_NECTAR_LIVING_EXCHANGE.md's thread
// as the follow-up row to R-N3.5's amend.
//
// Every spec cited in this file lives in the design workspace, not at
// any path in this repo; nothing under `GUIDES/` is in this tree, so a
// bare `GUIDES/...` address opens nothing for whoever reads this file
// next.
//
// WHY THIS GATE EXISTS, and it is a story about the detector rather than
// about the defect.
//
// The convention is old and nine files kept it by hand. Two did not, and both
// were mine: a new derivation script and a gate written weeks apart each
// carried a bare address that opens nothing. Neither was caught by anything
// mechanical. Both were caught by a human ratifier reading a header, which is
// the most expensive detector available and the one least likely to be
// pointed at the file that needs it.
//
// Then three people measured the same class and got three answers about one
// unchanged file. A census keyed on two hand-written alternate wordings called
// `check-createhive-recut.mjs` compliant; a strict single-string match flagged
// it; a line-scoped probe reported it carrying no disclaimer at all, because
// its wording wrapped across a line break. The file never moved. Every
// disagreement lived in the classifier, and each classifier had been written
// AFTER reading the files it judged, which is fitting the instrument to the
// data it is grading.
//
// So the ruling is NORMALISE, and the shape below follows from it:
//
//   * ONE canonical sentence. `check-createhive-recut.mjs` is rewritten onto
//     it in this gate's own commit, so the gate is born green on the tree it
//     lands on rather than shipping with an exemption.
//   * Keyed PER OCCURRENCE, never per file. A header disclaimer does not cover
//     a citation somebody adds four hundred lines further down, and a per-file
//     check goes green on exactly that. C4's first resolver is that case.
//   * Matched WHITESPACE-NORMALISED, never line-scoped. The third probe failed
//     on a line break, and the fix is to retire wrapping as an axis by defined
//     equivalence rather than to legislate where a sentence may break. C4's
//     third resolver rewraps the sentence at a different column and requires
//     the row to stay green, which is the control against this row being too
//     strong rather than too weak.
//
// THE GATE COVERS ITSELF, WITH NO EXEMPTION, and that is a design constraint
// rather than a boast. A file hunting for a token normally contains that token
// in its needle and its fixtures, which would red it. Both are DERIVED here
// instead: `TOKEN` is read out of `CANONICAL`'s own first backtick pair, and
// every control fixture is built from `TOKEN` at run time. So the only
// occurrences in this file are the four inside the canonical sentence, twice
// over, once in the header above and once in the constant. Deriving the needle
// from the sentence is also the stronger engineering: a hard-coded needle can
// drift from the sentence it is supposed to enforce, and this one cannot.
//
// FOUR ROWS: one universe guard, one extractor audit, the ruled row, and three
// resolvers in one control row.
//
//   C1  universe    Files walked and non-empty, at least one occurrence of the
//                   token found, and at least one instance of the canonical
//                   sentence present. An enumerator over an empty set is green
//                   about nothing, and a needle that matches nowhere in a tree
//                   that should contain it is a broken needle, not a clean
//                   tree.
//   C2  census      The normalised scan reconciles against an independent raw
//                   byte count over the untouched sources. This audits the
//                   NORMALISER: an occurrence it eats is not one C3 finds
//                   undisclaimed, it is one C3 never asks about.
//   C3  citation    THE RULED ROW, as a universal over every occurrence in the
//                   tree. Each one sits inside an instance of the canonical
//                   sentence or it is a failure named by file and line. An
//                   occurrence matching no branch is a failure rather than an
//                   absence.
//   C4  controls    Three resolvers over fixtures built from the real
//                   canonical sentence: a bare address four hundred lines below
//                   a compliant header must red C3 and be named at its own far
//                   line, the same fixture without it must stay green, and the
//                   sentence rewrapped at a different column must stay green.
//
// NO ROW HERE HOLDS A FILE COUNT, and this comment does not carry one either.
// C1 prints how many files carry the sentence on the tree it is run against,
// so the tally is measured on every run rather than written here, where it
// would go stale on the next commit that adds a script. What this gate asserts
// is the property that every occurrence is disclaimed, so a new script is
// covered at birth and a retired one costs nothing. Asserting the cardinality
// would make this gate an owner for a claim nobody ruled.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIR_REL = 'scripts';

let pass = 0;
const failures = [];
const ok = (label) => { pass += 1; console.log(`  ok   ${label}`); };
const bad = (label, detail) => { failures.push(`${label} — ${detail}`); console.log(`  FAIL ${label} — ${detail}`); };

// THE SENTENCE. One canonical wording, and the needle is read out of it rather
// than written beside it so the two cannot drift.
const CANONICAL = 'Every spec cited in this file lives in the design workspace, not at any path in this repo; nothing under `GUIDES/` is in this tree, so a bare `GUIDES/...` address opens nothing for whoever reads this file next.';

const firstTick = CANONICAL.indexOf('`');
const secondTick = CANONICAL.indexOf('`', firstTick + 1);
const TOKEN = CANONICAL.slice(firstTick + 1, secondTick).replace(/\/+$/, '');

// NORMALISE. A comment marker and any run of whitespace both collapse to a
// single space, and every emitted character keeps a map back to its offset in
// the untouched source so a failure can be named at its real line. This is
// deliberately NOT a comment parser: it treats `//` as whitespace wherever it
// appears, which is sound for this one question because neither collapsing
// whitespace nor blanking a slash pair can split the token or manufacture an
// instance of a 200-character sentence.
const normalise = (src) => {
  const out = [];
  const map = [];
  let space = false;
  for (let i = 0; i < src.length; i += 1) {
    const isMarker = src[i] === '/' && src[i + 1] === '/';
    if (isMarker || /\s/.test(src[i])) {
      if (!space) { out.push(' '); map.push(i); space = true; }
      i += isMarker ? 1 : 0;
      continue;
    }
    out.push(src[i]); map.push(i); space = false;
  }
  return { norm: out.join(''), map };
};

const NEEDLE = normalise(CANONICAL).norm.trim();

const allIndexes = (hay, needle) => {
  const hits = [];
  for (let i = hay.indexOf(needle); i !== -1; i = hay.indexOf(needle, i + 1)) hits.push([i, i + needle.length]);
  return hits;
};

// The one analysis every row runs, over a source string rather than a path, so
// the controls exercise the same code the tree does.
const analyse = (src) => {
  const { norm, map } = normalise(src);
  const sentences = allIndexes(norm, NEEDLE);
  const occurrences = allIndexes(norm, TOKEN).map(([s]) => s);
  const inside = (i) => sentences.some(([a, b]) => i >= a && i < b);
  const lineAt = (i) => {
    const off = map[i];
    let n = 1;
    for (let k = 0; k < off; k += 1) if (src[k] === '\n') n += 1;
    return n;
  };
  return {
    sentences: sentences.length,
    total: occurrences.length,
    violations: occurrences.filter((i) => !inside(i)).map((i) => ({ line: lineAt(i) })),
  };
};

const walkDir = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const full = path.join(dir, e.name);
  return e.isDirectory() ? walkDir(full) : [full];
});

// EVERY file under scripts/, with no extension filter. A filter would be one
// more hand-written classifier standing between the walk and the claim, and a
// file that is not source simply will not contain the sentence or the token.
const FILES = walkDir(path.join(ROOT, DIR_REL))
  .map((full) => ({ rel: path.relative(ROOT, full), src: fs.readFileSync(full, 'utf8') }))
  .sort((a, b) => a.rel.localeCompare(b.rel));

const results = FILES.map((f) => ({ ...f, ...analyse(f.src) }));
const carrying = results.filter((r) => r.total > 0);
const totalOccurrences = results.reduce((n, r) => n + r.total, 0);
const totalSentences = results.reduce((n, r) => n + r.sentences, 0);

// ── C1 universe — an enumerator over nothing is green about nothing ─────────
{
  const rawTotal = FILES.reduce((n, f) => n + f.src.split(TOKEN).length - 1, 0);
  if (FILES.length > 0 && rawTotal > 0 && totalSentences > 0) {
    ok(`C1 universe — ${FILES.length} file(s) walked under ${DIR_REL}/, ${rawTotal} raw occurrence(s) of \`${TOKEN}\` present and ${totalSentences} instance(s) of the canonical sentence found across ${carrying.length} file(s). The needle matches something, so a green C3 is a measurement rather than an empty set`);
  } else {
    bad('C1', `universe is not measurable: files=${FILES.length}, raw occurrences=${rawTotal}, canonical instances=${totalSentences} — a zero in any of these makes every row below vacuous`);
  }
}

// ── C2 census — audit the normaliser against an untouched byte count ────────
{
  const rawTotal = FILES.reduce((n, f) => n + f.src.split(TOKEN).length - 1, 0);
  if (rawTotal === totalOccurrences) {
    ok(`C2 census — the normalised scan finds ${totalOccurrences} occurrence(s) and an independent raw byte count over the untouched sources finds ${rawTotal}. The normaliser is not eating occurrences before C3 can ask about them`);
  } else {
    bad('C2', `normalised scan found ${totalOccurrences} occurrence(s), raw byte count found ${rawTotal} — the normaliser is dropping or inventing sites, so C3 is measuring a different population than the tree has`);
  }
}

// ── C3 citation — THE RULED ROW, a universal over every occurrence ──────────
{
  const offenders = results.filter((r) => r.violations.length > 0);
  if (offenders.length === 0) {
    ok(`C3 citation — all ${totalOccurrences} occurrence(s) of \`${TOKEN}\` under ${DIR_REL}/ sit inside an instance of the canonical sentence, across ${carrying.length} file(s). A bare address opens nothing for whoever reads the file next, and there is not one left`);
  } else {
    const named = offenders.map((r) => `${r.rel}:${r.violations.map((v) => v.line).join(',')}`).join('; ');
    bad('C3', `${offenders.reduce((n, r) => n + r.violations.length, 0)} bare \`${TOKEN}\` address(es) outside the canonical sentence: ${named} — each one is a path that opens nothing in this tree. Add the canonical disclaimer to the file, or cite the spec by bare filename`);
  }
}

// ── C4 controls — the row must be able to go red, and must not be too strong ─
{
  const wrap = (text, width) => {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      if (line && (line + ' ' + w).length > width) { lines.push(line); line = w; } else { line = line ? `${line} ${w}` : w; }
    }
    if (line) lines.push(line);
    return lines.map((l) => `// ${l}`).join('\n');
  };

  const FAR = 400;
  const filler = Array.from({ length: FAR }, (_, i) => `const filler${i} = ${i};`).join('\n');
  const compliant = `${wrap(CANONICAL, 70)}\n${filler}\n`;
  const withFar = `${compliant}// see ${TOKEN}/SOMETHING_THAT_DOES_NOT_EXIST.md for the rest\n`;
  const rewrapped = `${wrap(CANONICAL, 31)}\n${filler}\n`;
  const oneLine = `// ${CANONICAL}\n${filler}\n`;

  const aFar = analyse(withFar);
  const bClean = analyse(compliant);
  const cNarrow = analyse(rewrapped);
  const cWide = analyse(oneLine);

  const farLine = aFar.violations.length === 1 ? aFar.violations[0].line : null;
  const c1 = aFar.violations.length === 1 && farLine > FAR;
  const c2 = bClean.violations.length === 0 && bClean.total === 2;
  const c3 = cNarrow.violations.length === 0 && cWide.violations.length === 0
    && cNarrow.sentences === 1 && cWide.sentences === 1;

  if (c1 && c2 && c3) {
    ok(`C4 controls — three resolvers over fixtures built from the real canonical sentence: a bare \`${TOKEN}\` address ${FAR} lines below a compliant header reds C3 and is named at line ${farLine}, not at the header, so the row is keyed per occurrence and not per file; the same fixture without it stays green at ${bClean.total} disclaimed occurrence(s), so the row is not redding on the disclaimer itself; and the sentence rewrapped at 31 columns and again on one line both stay green, so wrapping is retired as an axis by defined equivalence rather than legislated. A row that has never been shown to go red has not been shown to be measuring anything, and one that has never been shown to stay green has not been shown to be measuring only that`);
  } else {
    bad('C4', `controls did not reproduce: far-address-reds=${c1} (violations=${aFar.violations.length}, line=${farLine}, needs > ${FAR}), clean-stays-green=${c2} (violations=${bClean.violations.length}, occurrences=${bClean.total}), rewrap-stays-green=${c3} (narrow=${cNarrow.violations.length}/${cNarrow.sentences}, oneline=${cWide.violations.length}/${cWide.sentences}) — the rows above may be passing vacuously or redding on wrapping`);
  }
}

console.log(`\n${pass} passed, ${failures.length} failed`);
if (failures.length) { console.log('\nFAILURES:'); failures.forEach((f) => console.log(`  - ${f}`)); }
process.exitCode = failures.length ? 1 : 0;
