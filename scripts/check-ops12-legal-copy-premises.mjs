// OPS-12: legal-copy premise tripwire (Vector, thread b57ad406, 2026-08-30,
// §1B.36.5 / LEGAL-2).
//
//   npm run check:ops12-legal-copy-premises
//
// THIS IS A PREMISE TRIPWIRE, NOT A TRUTH-CHECKER. It does not attempt to
// verify that src/constants/legalCopy.js is accurate — that is an
// unbounded claim about prose with no finite check. It catches exactly the
// two premises Vector found stale on 2026-08-30 (LEGAL-2): a "your
// unshared entries never leave your phone" claim written before P0-2 moved
// EntryStore onto Supabase (c4fe6a4), and a "we have not built these
// controls into the app yet" claim written before ENG-84 shipped the
// delete-account button (App.js:309, Account.js:218). Both were true THE
// DAY THEY WERE WRITTEN and are false today, and nothing else in this
// suite would have caught the drift — a commit message reading "written
// to what the app actually does" is a timestamp, not a property.
//
// SELF-DELETING BY CONSTRUCTION: each assertion is really "NOT (the stale
// sentence exists AND the code fact it depends on contradicts it)." Today
// both conjunctions are true, so both assertions are RED — that is this
// gate correctly reporting a live, already-routed defect (LEGAL-2,
// Colin/Lumen), not a bug in the gate. Once the copy is corrected — the
// stale sentence rewritten or removed — the first conjunct goes false and
// stays false: nothing in this codebase's trajectory un-deletes a shipped
// migration or un-registers a screen. The assertion goes green
// permanently, with no exemption list and no further maintenance. Same
// register as check-legal-consent-gate's self-deleting transition, one
// door down: that gate arms on a future flip (four FILL values landing);
// this one is armed by a past flip (an architecture change) that already
// happened underneath copy nobody re-read.
//
// WHY KEY ON THE SPECIFIC SENTENCE RATHER THAN "IS THE COPY ACCURATE": the
// general question has no finite answer — the Privacy Policy makes dozens
// of claims about the app, and treating every one as gate material invites
// exactly the false-positive noise this repo's copy gates avoid elsewhere
// (a name that fails loudly beats a pattern that passes quietly). Keying
// on the specific sentence and the specific code fact it depends on keeps
// this gate's universe finite and gives it a real off switch.
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
const DEVICE_LOCAL_CLAIM = /unshared entries[^.]*never leave your phone/i;
const UNBUILT_CONTROLS_CLAIM = /have not built these controls into the app yet/i;
const SUPABASE_IMPORT = /from ['"]\.\/supabase['"]/;
const DELETE_ACCOUNT_SCREEN = /Stack\.Screen\s+name=["']DeleteAccount["']/;

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

// --- Premise 1: device-local storage claim vs. a Supabase-backed store ----
const claimsDeviceLocal = legalCopy !== null && DEVICE_LOCAL_CLAIM.test(legalCopy);
const isSupabaseBacked = entryStore !== null && SUPABASE_IMPORT.test(entryStore);
check(
  'legalCopy.js does not claim unshared entries "never leave your phone" while EntryStore is Supabase-backed',
  claimsDeviceLocal && isSupabaseBacked,
  false,
);

// --- Premise 2: "unbuilt controls" claim vs. a shipped delete-account UI --
const claimsUnbuilt = legalCopy !== null && UNBUILT_CONTROLS_CLAIM.test(legalCopy);
const controlIsBuilt = appJs !== null && DELETE_ACCOUNT_SCREEN.test(appJs);
check(
  'legalCopy.js does not claim account-deletion controls are unbuilt while DeleteAccount is a registered screen',
  claimsUnbuilt && controlIsBuilt,
  false,
);

console.log(`\ncheck-ops12-legal-copy-premises: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
