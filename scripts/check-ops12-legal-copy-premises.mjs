// OPS-12: legal-copy premise tripwire (Vector, thread b57ad406, 2026-08-30,
// §1B.36.5 / LEGAL-2). Population extended twice on 2026-09-03 (Bumble) —
// see "SIZED TO THE DEFECT, NOT TO THE FINDER'S SAMPLE" below.
//
//   npm run check:ops12-legal-copy-premises
//
// THIS IS A PREMISE TRIPWIRE, NOT A TRUTH-CHECKER. It does not attempt to
// verify that src/constants/legalCopy.js is accurate — that is an
// unbounded claim about prose with no finite check. It catches premises
// that were true THE DAY THEY WERE WRITTEN and are false today, each one
// pinned to the specific code fact that falsified it.
//
// SIZED TO THE DEFECT, NOT TO THE FINDER'S SAMPLE: this gate originally
// keyed on the two sentences Vector found on 2026-08-30. That is a
// PROVENANCE, not a POPULATION — and the gate has now been resized twice
// for exactly that reason, which is itself the argument for enumerating a
// premise's sites rather than its discoveries:
//
//   round 1 (Sage, 09-03) found a third site, :228.
//   round 2 (Bumble, 09-03) swept the whole file for the CLASS and found
//     eight device-local sites, one of them in TERMS_OF_SERVICE — outside
//     every "fix the privacy copy" scoping used up to that point.
//   round 3 (Lumen, 09-03) found three more the phrase-sweep could not
//     see, because they assert the same premises OBLIQUELY: Terms :262
//     (storage permission granted at Share — so storage is framed as a
//     consequence of sharing), Terms :295 (email-us-to-delete, the
//     deletion-controls premise in the SECOND document), and a premise
//     class that did not exist that morning — see PREMISE 4.
//
// The original anchor (:215) was the LEAST severe of its family — a
// parenthetical in the tenth section — while :158 is the first sentence of
// "The short version", i.e. the sentence a user and App Review actually
// read. Had the gate kept its original two anchors, rewriting :215 and
// :226 would have turned it GREEN with eleven false sentences shipping.
// Every site below is enumerated with its own named assertion so a partial
// fix cannot report as a whole one.
//
// SELF-DELETING BY CONSTRUCTION: each assertion is really "NOT (the stale
// sentence exists AND the code fact it depends on contradicts it)." Today
// every conjunction is true, so every premise assertion is RED — that is
// this gate correctly reporting a live, already-routed defect (LEGAL-2;
// replacement wording ruled and delivered by Lumen, event 007ea551… and
// the 09-03 re-cut, Colin's remaining call veto-only), not a bug in the
// gate. Once the copy is corrected the first conjunct goes false and stays
// false: nothing in this codebase's trajectory un-deletes a shipped
// migration, un-registers a screen, or un-removes a caller. The assertions
// go green permanently, with no exemption list and no further maintenance.
//
// WHY KEY ON SPECIFIC SENTENCES RATHER THAN "IS THE COPY ACCURATE": the
// general question has no finite answer, and treating every claim in the
// document as gate material invites exactly the false-positive noise this
// repo's copy gates avoid elsewhere. Keying on specific sentences and the
// specific code fact each depends on keeps this gate's universe finite and
// gives it a real off switch. The enumeration is bounded by FOUR code
// facts, not by the finders who happened to read those paragraphs.
//
// EACH SITE IS PINNED TO ITS DOCUMENT: the Terms sites (:262, :284, :295)
// are asserted against the TERMS_OF_SERVICE slice, not the whole file.
// Every human description of this defect through round 2 — Vector's,
// Sage's, mine — called it "the privacy copy". A fix scoped to that phrase
// leaves the Terms saying we cannot recover entries we hold, and a
// whole-file regex would have let that pass because the same fragment
// matched elsewhere.
//
// CANNOT-TELL IS A FAILURE, NOT A PASS: if a source file cannot be read, or
// if a control string this gate uses to prove it is reading the right
// place goes missing, that is a FAIL, not a silent pass — a gate that can
// no longer find its own anchors is not proof the anchors are fine.

import { readFile, readdir } from 'node:fs/promises';
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

const ENG84_MIGRATION = 'supabase/migrations/20260830000001_eng84_account_deletion.sql';

const legalCopy = await readSource('src/constants/legalCopy.js');
const entryStore = await readSource('src/services/EntryStore.js');
const appJs = await readSource('App.js');
const deletionMigration = await readSource(ENG84_MIGRATION);
const honeycombStore = await readSource('src/services/HoneycombStore.js');

check('legalCopy.js is readable', legalCopy !== null, true);
check('EntryStore.js is readable', entryStore !== null, true);
check('App.js is readable', appJs !== null, true);
check(`${ENG84_MIGRATION} is readable`, deletionMigration !== null, true);
check('HoneycombStore.js is readable', honeycombStore !== null, true);

// --- Controls: prove each code fact is really present, so an unmatched
// premise reads as "the sentence is gone" rather than "the read silently
// broke", and a premise assertion can never go green because its
// FALSIFIER disappeared unnoticed. -----------------------------------------
const SUPABASE_IMPORT = /from ['"]\.\/supabase['"]/;
const DELETE_ACCOUNT_SCREEN = /Stack\.Screen\s+name=["']DeleteAccount["']/;
const FKEY_DROPPED = /alter table public\.profiles\s+drop constraint profiles_id_fkey/i;
const SEALED_SURVIVE = /delete from public\.entries[\s\S]{0,120}?is_volume_open\(volume_id\)/i;
const PROFILE_TOMBSTONED = /deleted_at = now\(\)/i;
const SIGNUP_DEFINED = /async signUp\(\s*email,\s*password,\s*displayName\s*\)/;

check(
  'control: EntryStore.js imports the Supabase client (proves the read reaches the right file)',
  entryStore !== null && SUPABASE_IMPORT.test(entryStore),
  true,
);
check(
  'control: App.js registers a DeleteAccount screen (proves the read reaches the right file)',
  appJs !== null && DELETE_ACCOUNT_SCREEN.test(appJs),
  true,
);
check(
  'control: ENG-84 drops profiles_id_fkey (proves the account-deletion cascade does NOT fire)',
  deletionMigration !== null && FKEY_DROPPED.test(deletionMigration),
  true,
);
check(
  "control: delete_own_account() excludes sealed volumes from its entry DELETE (proves keepsakes survive)",
  deletionMigration !== null && SEALED_SURVIVE.test(deletionMigration),
  true,
);
check(
  'control: delete_own_account() tombstones the profiles row rather than deleting it',
  deletionMigration !== null && PROFILE_TOMBSTONED.test(deletionMigration),
  true,
);
check(
  'control: HoneycombStore still DEFINES the email/password signUp (proves premise 4 measures reachability, not deletion)',
  honeycombStore !== null && SIGNUP_DEFINED.test(honeycombStore),
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
const scopeFor = (doc) => (doc === 'terms' ? termsDoc : privacyDoc);

// Every premise below is asserted the same way: the sentence still stands
// AND the code fact still contradicts it. `want` is always false.
const assertPremise = (site, codeContradicts) => {
  const scope = scopeFor(site.doc);
  const claimStands = scope !== '' && site.re.test(scope);
  check(
    `legalCopy.js ${site.id} — ${site.why}`,
    claimStands && codeContradicts,
    false,
  );
};

// === PREMISE 1: entries are stored on the device ==========================
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
    why: 'Sage 09-03 — tells the user there is nothing on our servers to delete',
    re: /not ours to delete/i,
  },
  {
    id: ':262 TERMS permission to store',
    doc: 'terms',
    why: 'Lumen 09-03 — frames storage as a permission granted at Share; storage happened at save. Oblique: matches no stays-on-your-phone phrase',
    re: /you give us permission to store it/i,
  },
  {
    id: ':284 TERMS this is early software',
    doc: 'terms',
    why: 'in TERMS_OF_SERVICE, outside every "fix the privacy copy" scoping through round 2',
    re: /unshared entries live only on your phone/i,
  },
];

const isSupabaseBacked = entryStore !== null && SUPABASE_IMPORT.test(entryStore);
for (const site of DEVICE_LOCAL_SITES) {
  assertPremise(site, isSupabaseBacked);
}

// === PREMISE 2: the deletion controls are not built ======================
//
// Falsified by ENG-84: App.js registers a DeleteAccount screen. Two sites,
// one per document — the Terms site (:295) was outside round 2's sweep
// because it names no control at all, it just routes the user to email.
const UNBUILT_CONTROL_SITES = [
  {
    id: ':227 email rather than a button',
    doc: 'privacy',
    why: 'the original OPS-12 anchor (Vector 08-30) — claims the control is unbuilt while DeleteAccount is a registered screen',
    re: /have not built these controls into the app yet/i,
  },
  {
    id: ':295 TERMS ending your account',
    doc: 'terms',
    why: 'Lumen 09-03 — routes account deletion to email in the SECOND document; round 2 stopped one section short of it',
    re: /To have your account and its data deleted, email/i,
  },
];

const controlIsBuilt = appJs !== null && DELETE_ACCOUNT_SCREEN.test(appJs);
for (const site of UNBUILT_CONTROL_SITES) {
  assertPremise(site, controlIsBuilt);
}

// === PREMISE 3: account deletion deletes every entry attached to it ======
//
// This one reads TRUE from the schema and FALSE from the writer, which is
// why it survived two sweeps: `entries.user_id references profiles on
// delete cascade` is really in 20260808000001, so a reader who stops at
// the foreign key concludes the sentence holds. The FK never fires —
// ENG-84 drops profiles_id_fkey outright, and account deletion TOMBSTONES
// the profiles row (deleted_at, immutable once set) rather than deleting
// it, so nothing is ever cascaded from. The actual deletion is
// delete_own_account()'s own statement, whose WHERE clause is written to
// EXCLUDE sealed keepsakes: `hive_id is null or is_volume_open(volume_id)`.
// Sealed writing survives account deletion by design — keep-and-disclose,
// the ruled product position that DeleteAccount.js:20-23 already renders.
//
// Resolve a deletion claim to the statement that deletes, not to the
// constraint that would have. (Lumen 09-03, corroborated by Sage.)
assertPremise(
  {
    id: ':221 deleted with it',
    doc: 'privacy',
    why: 'claims every entry is deleted with the account, while delete_own_account() excludes sealed keepsakes and the FK it appears to rest on is dropped',
    re: /When an account is deleted[^.]*are deleted with it/i,
  },
  deletionMigration !== null
    && FKEY_DROPPED.test(deletionMigration)
    && SEALED_SURVIVE.test(deletionMigration),
);

// === PREMISE 4: making an account collects a password and a display name =
//
// A premise class that did not exist on 2026-08-30 — it was falsified the
// same morning this gate was extended, by the I10 zero-onboarding merge in
// 9ffd215. The policy drifted DURING the thread that was auditing it,
// which is the argument for a standing gate over a one-time sweep.
//
// The shipped account-creation paths are Apple (signInWithApple) and
// magic-link OTP (signInWithOtp). Neither creates a password, and neither
// collects a name: the rewritten Onboarding.js has no name field at all,
// handle_new_user defaults display_name to 'New user', and a name is
// collected later and contextually (CombInvite's isPlaceholderName step).
//
// REACHABILITY IS THE MEASUREMENT, AND IT IS TAKEN BY PATH, NOT BY SYMBOL.
// HoneycombStore.signUp still EXISTS — it takes (email, password,
// displayName) and writes options.data.display_name. Reading its existence
// as "password signup still ships" is the mistake this assertion is built
// to avoid: it has zero callers. Its former call site was Onboarding.js,
// removed by the I10 rewrite. The census below therefore excludes
// HoneycombStore.js BY PATH. Filtering the symbol instead — grep signUp
// then drop lines matching HoneycombStore — deletes the very call sites it
// is looking for, because a call site reads `HoneycombStore.signUp(...)`
// and contains both tokens. That exact false negative is on the record in
// docs/strategy/POLLINATE_COMB_ROTATION.md:8320; this is its gate form.
const SRC_DIR = 'src';
const CALLER_EXCLUDED = path.join('src', 'services', 'HoneycombStore.js');
const SIGNUP_CALL = /signUp\s*\(/;

const walk = async (rel) => {
  let entries;
  try {
    entries = await readdir(path.join(ROOT, rel), { withFileTypes: true });
  } catch {
    return null;
  }
  const out = [];
  for (const entry of entries) {
    const child = path.join(rel, entry.name);
    if (entry.isDirectory()) {
      const nested = await walk(child);
      if (nested === null) return null;
      out.push(...nested);
    } else if (/\.(js|jsx|mjs|ts|tsx)$/.test(entry.name)) {
      out.push(child);
    }
  }
  return out;
};

const srcFiles = await walk(SRC_DIR);
check('control: src/ is walkable (proves the caller census actually ran)', srcFiles !== null, true);
check(
  `control: the caller census excludes ${CALLER_EXCLUDED} by PATH and still sees the rest of src/`,
  srcFiles !== null && srcFiles.includes(CALLER_EXCLUDED) && srcFiles.length > 1,
  true,
);

let signUpCallers = null;
if (srcFiles !== null) {
  signUpCallers = [];
  for (const rel of srcFiles) {
    if (rel === CALLER_EXCLUDED) continue;
    const text = await readSource(rel);
    if (text === null) {
      signUpCallers = null;
      break;
    }
    if (SIGNUP_CALL.test(text)) signUpCallers.push(rel);
  }
}
check('control: every src/ file in the caller census was readable', signUpCallers !== null, true);

const passwordSignupUnreachable = signUpCallers !== null && signUpCallers.length === 0;
assertPremise(
  {
    id: ':176 what we collect',
    doc: 'privacy',
    why: "claims account creation collects a password and a display name, while the only shipped creation paths are Apple and magic-link and signUp has no caller",
    re: /we collect your email address, a password/i,
  },
  passwordSignupUnreachable,
);

console.log(`\ncheck-ops12-legal-copy-premises: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
