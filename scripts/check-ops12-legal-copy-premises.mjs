// OPS-12: legal-copy premise tripwire (Vector, thread b57ad406, 2026-08-30,
// §1B.36.5 / LEGAL-2). Population extended 2026-09-03 (Bumble) — see
// "SIZED TO THE DEFECT, NOT TO THE FINDER'S SAMPLE" below.
//
//   npm run check:ops12-legal-copy-premises
//
// THIS IS A PREMISE TRIPWIRE, NOT A TRUTH-CHECKER. It does not attempt to
// verify that src/constants/legalCopy.js is accurate — that is an
// unbounded claim about prose with no finite check. It catches the
// premises that were true THE DAY THEY WERE WRITTEN and are false today:
// a family of "your unshared entries never leave your phone" claims
// written before P0-2 moved EntryStore onto Supabase (c4fe6a4), and a "we
// have not built these controls into the app yet" claim written before
// ENG-84 shipped the delete-account button (App.js:309, Account.js:218).
// Nothing else in this suite would have caught the drift — a commit
// message reading "written to what the app actually does" is a timestamp,
// not a property.
//
// SIZED TO THE DEFECT, NOT TO THE FINDER'S SAMPLE: this gate originally
// keyed on the two sentences Vector found on 2026-08-30. That is a
// PROVENANCE, not a POPULATION. Sage found a third (:228) on 09-03; a
// whole-file sweep then found eight sites sharing the one falsified
// premise, seven of them in PRIVACY_POLICY and one in TERMS_OF_SERVICE.
// The original anchor (:215) was the LEAST severe — a parenthetical in the
// tenth section — while :158 is the first sentence of "The short version",
// i.e. the sentence a user and App Review actually read. Had the gate kept
// its original two anchors, rewriting :215 and :226 would have turned it
// GREEN with six false sentences still shipping. Every site below is
// enumerated with its own named assertion so a partial fix cannot report
// as a whole one.
//
// SELF-DELETING BY CONSTRUCTION: each assertion is really "NOT (the stale
// sentence exists AND the code fact it depends on contradicts it)." Today
// every conjunction is true, so every premise assertion is RED — that is
// this gate correctly reporting a live, already-routed defect (LEGAL-2;
// wording ruled and delivered by Lumen 2026-08-30, event 007ea551…,
// Colin's remaining call is veto-only), not a bug in the gate. Once the
// copy is corrected — each stale sentence rewritten or removed — the first
// conjunct goes false and stays false: nothing in this codebase's
// trajectory un-deletes a shipped migration or un-registers a screen. The
// assertions go green permanently, with no exemption list and no further
// maintenance. Same register as check-legal-consent-gate's self-deleting
// transition, one door down: that gate arms on a future flip (four FILL
// values landing); this one is armed by a past flip (an architecture
// change) that already happened underneath copy nobody re-read.
//
// WHY KEY ON SPECIFIC SENTENCES RATHER THAN "IS THE COPY ACCURATE": the
// general question has no finite answer — the Privacy Policy makes dozens
// of claims about the app, and treating every one as gate material invites
// exactly the false-positive noise this repo's copy gates avoid elsewhere
// (a name that fails loudly beats a pattern that passes quietly). Keying
// on specific sentences and the specific code fact they depend on keeps
// this gate's universe finite and gives it a real off switch. The
// enumeration is bounded by ONE code fact — EntryStore is Supabase-backed
// — not by the finder who happened to read that paragraph.
//
// EACH SITE IS PINNED TO ITS DOCUMENT: the Terms site (:284) is asserted
// against the TERMS_OF_SERVICE slice, not the whole file. Every human
// description of this defect so far — Vector's, Sage's, mine — called it
// "the privacy copy". A fix scoped to that phrase leaves the Terms saying
// we cannot recover entries we hold, and a whole-file regex would have let
// that pass unnoticed because the same fragment matched elsewhere.
//
// CANNOT-TELL IS A FAILURE, NOT A PASS: if a source file cannot be read, or
// if a control string this gate uses to prove it is reading the right
// place goes missing, that is a FAIL, not a silent pass — a gate that can
// no longer find its own anchors is not proof the anchors are fine.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let pass = 0;
let fail = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? (pass += 1) : (fail += 1);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
};

const readSource = async (rel) => {
  try {
    return await readFile(path.join(ROOT, rel), 'utf8');
  } catch {
    return null;
  }
};

const legalCopy = await readSource('src/constants/legalCopy.js');
const entryStore = await readSource('src/services/EntryStore.js');
const appJs = await readSource('App.js');

check('legalCopy.js is readable', legalCopy !== null, true);
check('EntryStore.js is readable', entryStore !== null, true);
check('App.js is readable', appJs !== null, true);

// --- Anchors: prove the extractor is looking at the right place, so an
// unmatched premise reads as "the sentence is gone" rather than "the read
// silently broke." ---------------------------------------------------------
const SUPABASE_IMPORT = /from ['"]\.\/supabase['"]/;
const DELETE_ACCOUNT_SCREEN = /Stack\.Screen\s+name=["']DeleteAccount["']/;
const UNBUILT_CONTROLS_CLAIM = /have not built these controls into the app yet/i;

check(
  "control: EntryStore.js imports the Supabase client (proves the read reaches the right file)",
  entryStore !== null && SUPABASE_IMPORT.test(entryStore),
  true,
);
check(
  'control: App.js registers a DeleteAccount screen (proves the read reaches the right file)',
  appJs !== null && DELETE_ACCOUNT_SCREEN.test(appJs),
  true,
);

// --- Document slices: each site is asserted against the document it lives
// in, so a sentence that MOVES between the Policy and the Terms is not
// silently absorbed by a whole-file regex. Splitting is itself checked:
// if either export marker is missing, every slice-scoped assertion below
// would read "sentence gone" for the wrong reason, so the split is a
// control, not an assumption. ---------------------------------------------
const PRIVACY_MARKER = 'export const PRIVACY_POLICY';
const TERMS_MARKER = 'export const TERMS_OF_SERVICE';
const privacyStart = legalCopy === null ? -1 : legalCopy.indexOf(PRIVACY_MARKER);
const termsStart = legalCopy === null ? -1 : legalCopy.indexOf(TERMS_MARKER);

check(
  'control: legalCopy.js exports PRIVACY_POLICY then TERMS_OF_SERVICE, in that order (proves the document split is real)',
  privacyStart >= 0 && termsStart > privacyStart,
  true,
);

const privacyDoc = privacyStart >= 0 && termsStart > privacyStart ? legalCopy.slice(privacyStart, termsStart) : '';
const termsDoc = termsStart >= 0 ? legalCopy.slice(termsStart) : '';

// --- Premise 1: the device-local storage claim, EVERY site of it ----------
//
// One code fact falsifies all of them: EntryStore.js is Supabase-backed —
// its own header dates the move ("Supabase-backed as of P0-2 — was a
// single AsyncStorage store"), it holds zero AsyncStorage references, and
// `hive_id is null` rows ARE the unshared personal journal. So there is no
// device-only storage path for an entry to live in, and every sentence
// below asserts or depends on one.
//
// Fragments are deliberately short and punctuation-free where possible: an
// em dash or a smart quote is the kind of character a copy edit changes
// without changing the claim, and a fragment that misses for that reason
// would read as "the sentence is gone" — a false green.
const DEVICE_LOCAL_SITES = [
  {
    id: ':158 short version',
    doc: 'privacy',
    why: 'first sentence of "The short version" — the sentence a user and App Review actually read',
    re: /What you write stays on your phone/i,
  },
  {
    id: ':170 controller scope',
    doc: 'privacy',
    why: 'narrows the data-controller responsibility we accept, on a false premise',
    re: /Most of what you write never reaches us at all/i,
  },
  {
    id: ':183 your journal entries',
    doc: 'privacy',
    why: 'states entries are saved in device storage and not uploaded to us',
    re: /not uploaded to us, not backed up by us, and not readable by us/i,
  },
  {
    id: ':184 no copy held',
    doc: 'privacy',
    why: 'we do hold a copy; the "honest consequence" is drawn from a false premise',
    re: /because we hold no copy, we cannot restore your entries/i,
  },
  {
    id: ':189 share is the one action',
    doc: 'privacy',
    why: 'every save reaches our servers, not only a tapped Share',
    re: /the one action that sends an entry to our servers/i,
  },
  {
    id: ':215 where kept',
    doc: 'privacy',
    why: 'the original OPS-12 anchor (Vector 08-30); the least severe of the family',
    re: /unshared entries[^.]*never leave your phone/i,
  },
  {
    id: ':228 not ours to delete',
    doc: 'privacy',
    why: 'Sage 09-03 — tells the user there is nothing on our servers to delete, and contradicts the retention section two above it',
    re: /not ours to delete/i,
  },
  {
    id: ':284 TERMS this is early software',
    doc: 'terms',
    why: 'in TERMS_OF_SERVICE, outside every "fix the privacy copy" scoping so far',
    re: /unshared entries live only on your phone/i,
  },
];

const isSupabaseBacked = entryStore !== null && SUPABASE_IMPORT.test(entryStore);

for (const site of DEVICE_LOCAL_SITES) {
  const scope = site.doc === 'terms' ? termsDoc : privacyDoc;
  const claimStands = scope !== '' && site.re.test(scope);
  check(
    `legalCopy.js ${site.id} does not claim device-local storage while EntryStore is Supabase-backed (${site.why})`,
    claimStands && isSupabaseBacked,
    false,
  );
}

// --- Premise 2: "unbuilt controls" claim vs. a shipped delete-account UI --
const claimsUnbuilt = privacyDoc !== '' && UNBUILT_CONTROLS_CLAIM.test(privacyDoc);
const controlIsBuilt = appJs !== null && DELETE_ACCOUNT_SCREEN.test(appJs);
check(
  'legalCopy.js does not claim account-deletion controls are unbuilt while DeleteAccount is a registered screen',
  claimsUnbuilt && controlIsBuilt,
  false,
);

console.log(`\ncheck-ops12-legal-copy-premises: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
