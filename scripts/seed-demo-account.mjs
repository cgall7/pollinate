#!/usr/bin/env node
// Seeds the real demo Supabase account with the ratified demo corpus.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   DEMO_ACCOUNT_EMAIL=... \
//     node scripts/seed-demo-account.mjs --confirm
//
// Content: scripts/lib/demo-seed-corpus.mjs (Lumen ratifies that file).
// Mechanics: scripts/lib/demo-seed-writer.mjs (every insert and timestamp).
// This file is the shell: credentials, the confirm gate, the six cast users,
// and the preflight warnings.
//
// ---------------------------------------------------------------------------
// NO PRIOR ART FOR THE ADMIN API IN THIS REPO, stated rather than implied.
// ---------------------------------------------------------------------------
// Grepped before writing: `auth.admin`, `createUser`, `SUPABASE_SERVICE_ROLE_KEY`,
// `serviceRoleKey` and `service_role` as an API key all return zero hits
// outside this file. The only createClient() is src/services/supabase.js,
// anon key only, and .env.example:2-3 says outright "never put the
// service_role key in the app". So there is no house pattern to follow for
// admin-API user creation; there IS a house pattern for a script that talks
// to a real remote, and this file follows that one:
//
//   scripts/deploy-migrations.sh:26-34  every credential is REQUIRED, never
//     defaulted, never hardcoded, and a missing one exits 1 with a sentence
//     saying where to get the value.
//   scripts/deploy-migrations.sh:73-80  show the human what is about to
//     happen BEFORE doing it, then block. That script blocks on an
//     interactive `read`; this one takes --confirm, because the register asks
//     for a flag and because a seed may need to run without a TTY.
//   scripts/run-checks.mjs:105-118  an affirmative switch fails CLOSED. Only
//     the exact literal `--confirm` authorises; anything else refuses.
//
// Raw SQL INSERT into auth.users is NOT done here. That table is Supabase
// GoTrue's, it carries columns and an encrypted-password format this repo
// does not own, and a hand-written row produces an account that cannot sign
// in. auth.admin.createUser is the supported path and the only one used.
//
// ---------------------------------------------------------------------------
// THE DEMO ACCOUNT ITSELF IS NOT CREATED HERE
// ---------------------------------------------------------------------------
// Alex is a real, existing account (the one behind EXPO_PUBLIC_DEMO_LOGIN_EMAIL,
// per .env.example:15-19). This script LOOKS IT UP by email and refuses if it
// is absent. Creating it would mean choosing its password, which belongs to
// whoever owns the demo credentials, not to a seed script.
import process from 'node:process';
import { buildPlan, seedDemoAccount, supabaseAdapter } from './lib/demo-seed-writer.mjs';
import {
  CAST,
  DEMO_ACCOUNT_KEY,
  DEMO_ACCOUNT_NAME,
} from './lib/demo-seed-corpus.mjs';

const die = (msg) => {
  console.error(`seed-demo-account: ${msg}`);
  process.exit(1);
};

// --- The confirm gate ------------------------------------------------------
// Exact literal only. A truthy-ish `--confirm=maybe` or `-y` authorises
// nothing, same fail-closed posture as run-checks.mjs's AFFIRMATIVE set.
if (!process.argv.slice(2).includes('--confirm')) {
  console.error(
    'seed-demo-account: refusing to run without --confirm.\n' +
      '  This writes roughly 300 rows into a REAL Supabase project: six auth users,\n' +
      '  two combs, eight rotation hives, two private hives and 180 journal entries.\n' +
      '  Re-run with --confirm once you are certain SUPABASE_URL points at the demo\n' +
      '  project and not at production.'
  );
  process.exit(1);
}

// --- Credentials -----------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_EMAIL = process.env.DEMO_ACCOUNT_EMAIL;

if (!SUPABASE_URL) {
  die(
    'SUPABASE_URL is not set. Find it in the dashboard under Settings -> API -> Project URL.\n' +
      '  It must be the DEMO project. Nothing here checks that for you.'
  );
}
if (!SERVICE_ROLE_KEY) {
  die(
    'SUPABASE_SERVICE_ROLE_KEY is not set. Dashboard -> Settings -> API -> service_role.\n' +
      '  It bypasses RLS. Never put it in .env alongside the EXPO_PUBLIC_ keys, and never\n' +
      '  commit it: this repo is public (.env.example:2-3).'
  );
}
if (!DEMO_EMAIL) {
  die(
    "DEMO_ACCOUNT_EMAIL is not set. It is the demo account's own login email, the same\n" +
      '  value EXPO_PUBLIC_DEMO_LOGIN_EMAIL carries. This script looks that account up and\n' +
      '  seeds around it; it never creates it.'
  );
}

// A cast member's password. Never a literal in this file, and the cast
// accounts are never signed into by anybody: they exist so that profiles,
// hive_contributors and entries have real foreign keys to point at.
const CAST_PASSWORD = process.env.DEMO_CAST_PASSWORD;
if (!CAST_PASSWORD || CAST_PASSWORD.length < 12) {
  die(
    'DEMO_CAST_PASSWORD is not set, or is shorter than 12 characters. The six fictional\n' +
      '  cast accounts each need one. Generate a throwaway (`openssl rand -base64 24`);\n' +
      '  nothing ever signs in as them.'
  );
}

let createClient;
try {
  ({ createClient } = await import('@supabase/supabase-js'));
} catch (e) {
  die(`cannot load @supabase/supabase-js (${e.message.split('\n')[0]}). Run npm install.`);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Preflight -------------------------------------------------------------
console.log('seed-demo-account: preflight');
console.log(`  project:      ${SUPABASE_URL}`);
console.log(`  demo account: ${DEMO_EMAIL} (${DEMO_ACCOUNT_NAME})`);
console.log(`  cast:         ${CAST.map((c) => c.name).join(', ')}`);
console.log('');
console.log('  The decorative demo layer (src/constants/demoHive.js) is gated on');
console.log('  DEMO_CONTENT, which is `__DEV__ || process.env.EXPO_PUBLIC_DEMO_MODE ===');
console.log("  'true'` (src/constants/demoMode.js:20,46). It retires at runtime the moment");
console.log('  a real connection exists (HoneycombTab.js, the dormancy gate), so seeding');
console.log('  this account switches it off without a build change. It also shares no');
console.log(`  names with the cast above (${CAST.map((c) => c.name).join(', ')}) — asserted`);
console.log("  forward by check-demo-seed.mjs's A13. The one-tap \"Continue as demo\" login");
console.log('  (src/screens/Onboarding.js:429-431) is on the same DEMO_CONTENT constant.');
console.log('');
console.log('  NOT WRITTEN, deliberately: ledger_transactions, ledger_postings and every');
console.log('  other nectar/ledger table. Pass one is rotations, hives and the journal.');
console.log('');

// --- Resolve the demo account ---------------------------------------------
// listUsers is paginated. Walked rather than assumed to be one page, because
// a demo project accumulates test accounts and a silent page-one-only lookup
// would "not find" Alex and then refuse for the wrong reason.
async function findUserByEmail(email) {
  const wanted = email.trim().toLowerCase();
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = data?.users ?? [];
    const hit = users.find((u) => (u.email ?? '').toLowerCase() === wanted);
    if (hit) return hit;
    if (users.length < 200) return null;
  }
  return null;
}

const alex = await findUserByEmail(DEMO_EMAIL);
if (!alex) {
  die(
    `no auth user found for ${DEMO_EMAIL}. Create the demo account through the app or the\n` +
      '  dashboard first, then re-run. This script seeds around an existing account and\n' +
      '  never invents its password.'
  );
}

// profiles.display_name must never be '' or 'New user' — the placeholder
// class src/utils/placeholderName.js refuses, and every render site
// (check-placeholder-name.mjs R3-R6) degrades to an antecedent-free string.
// handle_new_user (20260808000001:39-49) defaults to 'New user' when signup
// carried no display_name, which is exactly what an account made in the
// dashboard looks like.
const { data: alexProfile, error: alexProfileError } = await admin
  .from('profiles')
  .select('id, display_name')
  .eq('id', alex.id)
  .single();
if (alexProfileError) die(`could not read the demo account's profile: ${alexProfileError.message}`);
if (alexProfile.display_name !== DEMO_ACCOUNT_NAME) {
  console.log(
    `  demo profile display_name is ${JSON.stringify(alexProfile.display_name)}; ` +
      `setting it to ${JSON.stringify(DEMO_ACCOUNT_NAME)}`
  );
  const { error } = await admin
    .from('profiles')
    .update({ display_name: DEMO_ACCOUNT_NAME })
    .eq('id', alex.id);
  if (error) die(`could not set the demo account's display name: ${error.message}`);
}

// --- The six cast accounts -------------------------------------------------
// display_name rides in user_metadata because handle_new_user reads
// `raw_user_meta_data ->> 'display_name'` (20260808000001:46) and inserts the
// profiles row itself. Passing it here is what stops all six profiles being
// born as the literal 'New user'.
const profileIds = { [DEMO_ACCOUNT_KEY]: alex.id };

for (const person of CAST) {
  const existing = await findUserByEmail(person.email);
  if (existing) {
    profileIds[person.key] = existing.id;
    console.log(`  ${person.name}: already exists`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: person.email,
      password: CAST_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: person.name },
    });
    if (error) die(`could not create ${person.name}: ${error.message}`);
    profileIds[person.key] = data.user.id;
    console.log(`  ${person.name}: created`);
  }

  // The trigger has run, but a profile that predates this script (a hand-made
  // account, a half-finished earlier run) may carry a placeholder name.
  // Repaired rather than assumed: an empty or 'New user' display_name would
  // freeze into author_name_at_seal and into private_hives.contributor_names
  // the moment anything seals, and those are snapshots that never refresh.
  const { data: prof, error: profErr } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', profileIds[person.key])
    .single();
  if (profErr) die(`could not read ${person.name}'s profile: ${profErr.message}`);
  if (prof.display_name !== person.name) {
    const { error } = await admin
      .from('profiles')
      .update({ display_name: person.name })
      .eq('id', profileIds[person.key]);
    if (error) die(`could not set ${person.name}'s display name: ${error.message}`);
    console.log(`  ${person.name}: display_name corrected from ${JSON.stringify(prof.display_name)}`);
  }
}

// --- Write ----------------------------------------------------------------
console.log('');
const plan = buildPlan({ now: new Date() });
const summary = await seedDemoAccount(supabaseAdapter(admin), {
  plan,
  profileIds,
  log: (line) => console.log(`  ${line}`),
});

console.log('');
console.log('seed-demo-account: done');
console.log(`  combs ${summary.combs}, rotations ${summary.rotations}, private hives ${summary.hives}`);
console.log(`  hive entries ${summary.entries}, streak entries ${summary.streak}, connections ${summary.connections}`);
if (summary.skipped.length) {
  console.log(`  already present, left alone: ${summary.skipped.join('; ')}`);
}
