// DES-29 §8 (amended 2026-09-04, ruling event be52be25…) — the pre-launch
// organizer card's month-1 mint affordance. The subject question moved out
// of CreateComb (its own gate, check-comb-create.mjs) to here: the first
// moment the ruled population (comb members ∪ connections) isn't empty by
// construction. Static/source-level, matching this codebase's other
// screen+store gates rather than a full render harness.
import fs from 'node:fs';
const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const store = read('../src/services/CombStore.js');
const card = read('../src/components/OrganizerCombCard.js');
const sheet = read('../src/components/MintRotationSheet.js');
const todayTab = read('../src/screens/TodayTab.js');

const checks = [
  // §8.2 — population = listMembers ∪ listConnections, evaluated at tap
  // time (a store method the card calls when the sheet opens, not on mount
  // for every pre-launch card on the shelf).
  ['listMintCandidates unions members and connections', store.includes('this.listMembers(combId)') && store.includes('HoneycombStore.listConnections()')],
  ['candidates deduped by profile id', store.includes('byId.set(')],
  ['card fetches candidates on tap, not on mount', card.includes('openMintSheet') && card.includes('CombStore.listMintCandidates(comb.id)') && !/useEffect|useFocusEffect/.test(card)],

  // §8.4 — guards hoisted into openFirstRotation, not the create screen.
  ['missing-subject guard lives in openFirstRotation', (() => {
    const start = store.indexOf('async openFirstRotation(');
    const body = store.slice(start, store.indexOf('\n  },', start));
    return body.includes("throw new Error('Choose who this month is for')");
  })()],
  ['self-subject guard lives in openFirstRotation', (() => {
    const start = store.indexOf('async openFirstRotation(');
    const body = store.slice(start, store.indexOf('\n  },', start));
    return body.includes("throw new Error('Choose someone else for the first month')");
  })()],

  // §8.1 — pre-launch ≠ dormant discriminator, and the pre-launch line +
  // share row are un-gated by `expanded`.
  ['pre-launch discriminator is no-rotation AND zero chapters', card.includes('const isPreLaunch = !rotation && chapterCount === 0')],
  ['pre-launch collapsed line is distinct from dormant', card.includes("'Invite people to get started.'") && card.includes("'No open month right now.'")],
  ['pre-launch share row is un-gated by expanded', (() => {
    const preLaunchBlock = card.slice(card.indexOf('{isPreLaunch && ('), card.indexOf('{expanded && ('));
    return preLaunchBlock.includes('shareInvite') && preLaunchBlock.includes('Pick who this month is for');
  })()],
  ['expanded panel does not duplicate the pre-launch share row', card.includes('{!isPreLaunch && (') ],

  // §8.3 — empty picker pre-empts the floor; the RPC is never called on an
  // empty population.
  ['empty candidates renders the share prompt, not a picker', sheet.includes("Nobody's joined yet") && sheet.includes('empty = Array.isArray(candidates) && candidates.length === 0')],
  ['submit is unreachable when candidates is empty', (() => {
    // The submit button and the candidate list share the same `!empty`
    // guard in the sheet — if the population is empty there is no row to
    // select, so `selectedId` can never become truthy and openFirstRotation
    // is never reached from this UI, but pin the shared guard structurally
    // rather than trusting that inference alone.
    const submitGuardCount = (sheet.match(/!loading && !loadError && !empty/g) ?? []).length;
    return submitGuardCount >= 2;
  })()],

  // §8.5 — mint success flips the card to RotationFold by reloading, and a
  // refusal re-arms (the sheet stays open, same combId, same selection).
  ['mint success triggers a reload via onMinted', card.includes('onMinted?.(comb.id)')],
  ['card wires onMinted to a reload on Today', todayTab.includes('onMinted={reloadOrganizerCombs}') && todayTab.includes('const reloadOrganizerCombs = useCallback(')],
  ['a refusal keeps the sheet open for retry (no dismiss in the catch branch)', (() => {
    const start = card.indexOf('const submitMint = async () => {');
    const body = card.slice(start, card.indexOf('\n  };', start));
    const catchBlock = body.slice(body.indexOf('} catch'));
    return !catchBlock.includes('setSheetOpen(false)');
  })()],

  // §5 — refusal classifier distinguishes subject-gone / empty-roster by
  // SQLSTATE+message, and folds not-owner/not-found into the same generic
  // bucket as unknown (never a cause sentence).
  ['classifier distinguishes subjectGone from emptyRoster', store.includes("if (/subject is gone/.test(error.message ?? '')) return 'subjectGone'") && store.includes("return 'emptyRoster'")],
  // Lumen's DES-29 §8 ratification finding (2026-09-04): 23514 alone
  // aliases six native CHECK producers on comb_open_rotation's write path
  // (migration `…0010:59`), and PostgREST never forwards the `constraint`
  // name the server attaches to disambiguate them. A bare
  // `error.code === '23514'` disjunct would misclassify any other CHECK
  // violation on this path as emptyRoster, rendering a false "This comb has
  // one member" count claim. The message match is the only signal
  // reachable from the client — pinned to the exact line, not just an
  // absence check, so a future edit that reintroduces a bare-code disjunct
  // (even reworded) reds here.
  ["emptyRoster keys on the message alone, not a bare error.code === '23514'", (() => {
    const start = store.indexOf('export const classifyMintRefusal');
    const body = store.slice(start, store.indexOf('\n};', start));
    const emptyRosterLine = body.split('\n').find((line) => line.includes("return 'emptyRoster'"));
    return (
      !!emptyRosterLine &&
      emptyRosterLine.trim() === "if (/enrollable contributors/.test(error.message ?? '')) return 'emptyRoster';" &&
      !body.includes("error.code === '23514'")
    );
  })()],
  ['notOwner and unknown share one generic sentence', (() => {
    const notOwner = card.match(/notOwner: (.+),/)?.[1];
    const unknown = card.match(/unknown: (.+),/)?.[1];
    return !!notOwner && notOwner === unknown;
  })()],
];

let failed = 0;
for (const [label, ok] of checks) {
  if (ok) {
    console.log(`✓ ${label}`);
  } else {
    console.error(`✗ ${label}`);
    failed += 1;
  }
}
console.log(`${checks.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
