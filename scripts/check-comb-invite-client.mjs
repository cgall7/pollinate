import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('App.js');
const screen = read('src/screens/CombInvite.js');
const store = read('src/services/CombInviteStore.js');
const onboarding = read('src/screens/Onboarding.js');
const linking = read('src/services/combInviteLinking.js');

let passed = 0;
let failed = 0;
const check = (condition, label) => {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${label}`);
  }
};

check(/COMB_INVITE_PATH = 'comb-invite'/.test(linking) && /queryParams: \{ code: inviteCode \}/.test(linking), 'I1 invite links have one path and one code parameter');
check(/Linking\.getInitialURL\(\)/.test(app) && /Linking\.addEventListener\('url'/.test(app), 'I2 cold and warm invite links share the App listener');
check(/PendingCombInvite\.set\(inviteCode\)/.test(screen) && /PendingCombInvite\.get\(\)/.test(app) && /navigation\.replace\('CombInvite'/.test(app), 'I3 invite code is persisted only when user explicitly continues the invite');
check(!/PendingCombInvite\.set/.test(app), 'I3b no legacy invite code persistence in App aside from initial routing');
check(/comb_preview_by_invite_code/.test(store) && /if \(!row\) return null/.test(store), 'I4 landing uses the anon preview and fails closed');
check(/memberCount >= 3/.test(screen) && /people are in this comb/.test(screen), 'I5 landing count is membership copy and suppressed below three');
check(/stays sealed until delivery/.test(screen) && /only \{preview\.subjectName\} ever reads it/.test(screen), 'I6 entry disclosure precedes the join action');
check(
  screen.includes('isPlaceholderName(profile?.display_name)') &&
    screen.includes('setNeedsName(isPlaceholderName(profile?.display_name))') &&
    store.includes("profiles').update({ display_name: name })") &&
    store.includes('comb_join_by_invite_code'),
  'I7 name persistence is gated on successful placeholder-class read and fused with join'
);
check(screen.includes("joinerProfileState !== 'succeeded'") && /setNeedsName/.test(screen), 'I8 profile readiness blocks submit until profile read succeeds');
check(/\.from\('comb_rotations'\)/.test(store) && /\.is\('sealed_at', null\)/.test(store) && /\.is\('voided_at', null\)/.test(store), 'I9 successful join resolves the open rotation');
check(/startAt === 'invite'/.test(onboarding) && /waitForSession/.test(onboarding), 'I10 invite auth path suppresses Continue via waitForSession');
check(/navigation\.replace\('Main', \{ screen: 'Today' \}/.test(screen), 'I11 successful join lands on Today, not the obsolete collect route');
check(!/navigation\.replace\(COMB_COLLECT_ROUTE/.test(screen), 'I12 obsolete collect route is no longer in the invite join path');

console.log(`\ncheck-comb-invite-client: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
