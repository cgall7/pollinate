#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const app = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'src/contexts/AuthContext.js'), 'utf8');

let passed = 0;
const failures = [];

const check = (label, condition) => {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${label}`);
  } else {
    failures.push(label);
    console.log(`  FAIL ${label}`);
  }
};

const count = (source, pattern) => [...source.matchAll(pattern)].length;

check(
  'auth bootstrap has one session source',
  count(auth, /auth\.onAuthStateChange\s*\(/g) === 1 && count(auth, /auth\.getSession\s*\(/g) === 0
);
check(
  'auth bootstrap releases loading from the session listener',
  /onAuthStateChange[\s\S]*?setSession\(nextSession\);[\s\S]*?setLoading\(false\);/.test(auth)
);
check(
  'font loading cannot strand the splash on rejection',
  /try\s*\{[\s\S]*?await Font\.loadAsync\(fontAssets\);[\s\S]*?\}\s*catch[\s\S]*?finally\s*\{[\s\S]*?setFontsLoaded\(true\)/.test(app)
);
check(
  'font loading does not update state after unmount',
  /let active = true;[\s\S]*?if \(active\) setFontsLoaded\(true\);[\s\S]*?active = false;/.test(app)
);
check(
  'initial invite URL rejection is handled',
  /Linking\.getInitialURL\(\)\.then\(handleInviteUrl\)\.catch\(/.test(app)
);
check(
  'initial auth URL rejection is handled',
  /Linking\.getInitialURL\(\)\.then\(handleUrl\)\.catch\(/.test(auth)
);
check(
  'cold-start notification read has a local failure boundary',
  /try\s*\{[\s\S]*?await Notifications\.getLastNotificationResponseAsync\(\);[\s\S]*?\}\s*catch/.test(app)
);
check(
  'pending invite navigation remains after notification failure handling',
  app.indexOf('if (pendingInviteNavigation.current)') >
    app.indexOf("console.warn('Initial notification response read failed'")
);

console.log(`\ncheck-bootstrap-resilience: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((failure) => console.log(`  - ${failure}`));
  process.exit(1);
}
