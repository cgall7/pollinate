import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('App.js');
const screen = read('src/screens/CombInvite.js');
const store = read('src/services/CombInviteStore.js');
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
check(/PendingCombInvite\.set\(inviteCode\)/.test(app) && /PendingCombInvite\.get\(\)/.test(app), 'I3 invite code persists through the auth roundtrip');
check(/comb_preview_by_invite_code/.test(store) && /if \(!row\) return null/.test(store), 'I4 landing uses the anon preview and fails closed');
check(/memberCount >= 3/.test(screen) && /people are in this comb/.test(screen), 'I5 landing count is membership copy and suppressed below three');
check(/stays sealed until delivery/.test(screen) && /only \{preview\.subjectName\} ever reads it/.test(screen), 'I6 entry disclosure precedes the join action');
check(/profiles'\)\.update\(\{ display_name: name \}\)/.test(store) && /comb_join_by_invite_code/.test(store), 'I7 the fused CTA saves the name before joining');
check(/\.from\('comb_rotations'\)/.test(store) && /\.is\('sealed_at', null\)/.test(store) && /\.is\('voided_at', null\)/.test(store), 'I8 successful join resolves the open rotation');
check(/navigation\.replace\(COMB_COLLECT_ROUTE/.test(screen) && /rotationId: destination\.rotationId/.test(screen) && /combId: destination\.combId/.test(screen), 'I9 join hands Pixel collect the exported route payload');

console.log(`\ncheck-comb-invite-client: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
