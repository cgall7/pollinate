// Gate for the client-side half of the seal boundary check-private-hives-seal.mjs
// already proves at the database (20260815000005/000006). Pixel's review
// (thread b57ad406, 2026-08-17 12:33Z) measured `fizz/private-hives-rails`
// directly and found the DB fact unreachable from the client:
//
//   - HiveStore.js named its columns at all three `private_hives` selects
//     and `sealed_at` was at none of them — the fact was UNAVAILABLE, not
//     just unused.
//   - HiveDetail.js rendered the add-entry CTA unconditionally.
//   - ComposeHiveEntry.js reported a permanent RLS refusal (SQLSTATE 42501)
//     in the same copy register as a dropped connection ("Check your
//     connection and try again").
//
//   npm run check:private-hives-client-seal
//
// Nothing on this branch writes sealed_at yet (that's 8b.5), so this gate
// gets no DB and asserts on source text instead — it exists to keep the
// three fixes from rotting apart, not to re-prove the RLS policy itself.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
let failed = 0;
const check = (label, ok) => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}`);
  ok ? passed++ : failed++;
};

const store = read('src/services/HiveStore.js');
// Enumerator repaired 2026-08-30 (Vector, thread f2c15b7d msg ff0aab79):
// the original `[\s\S]{0,120}?\.select\('` shape silently dropped any call
// site whose from→select gap outgrew 120 chars (createHive, once
// `is_collective` grew the insert block) or whose select argument wrapped
// onto its own line (getHive) — 5 matched of 7 while the `=== 5` count
// stayed green, because membership had changed by four under a constant
// count. The window is gone and whitespace is tolerated.
//
// THE TWO ROWS BELOW ARE COMPLEMENTARY — NEITHER ALONE CLOSES THE HOLE, so
// neither may be deleted as redundant with the other (Vector's probe pair,
// msg 8b4dc2a4, both reproduced before this comment was written):
//   - completeness (captured === fromSites) reds when a site the regex
//     cannot pair simply vanishes (template-literal select, select-less
//     .update) — the silent-miss direction;
//   - the exact count reds the case the unbounded lazy regex itself
//     enables: a select-less site followed by a FOREIGN table's
//     .select(... sealed_at) gets paired across the gap, the absorbed slot
//     keeps captured === fromSites, and only the count moves (8 !== 7).
// No constructed shape passes both.
const fromSites = [...store.matchAll(/\.from\('private_hives'\)/g)].length;
const selects = [...store.matchAll(/\.from\('private_hives'\)[\s\S]*?\.select\(\s*'([^']*)'\s*\)/g)].map((m) => m[1]);
check(
  'every private_hives call site is captured by this enumerator (a site this regex cannot parse must fail here, not vanish)',
  selects.length === fromSites
);
// Seven as of COPY-14's repair: createHive, listHives, getHive, the two
// contributing-hive reads (ENG-61 era), and the two received-packages
// reads. The count is not a ceiling; it exists so a new private_hives
// select added later has to touch this line, which is what keeps it from
// carrying sealed_at by omission the way the original three did.
check('HiveStore.js has exactly seven private_hives selects', selects.length === 7);
check(
  'every private_hives select names sealed_at',
  selects.length > 0 && selects.every((cols) => cols.split(',').map((c) => c.trim()).includes('sealed_at'))
);
check(
  'listHives and getHive map sealed_at onto sealedAt for callers',
  (store.match(/sealedAt: h\.sealed_at/) ?? []).length === 1 && (store.match(/sealedAt: data\.sealed_at/) ?? []).length === 1
);

const detail = read('src/screens/HiveDetail.js');
check(
  'HiveDetail.js gates the add-entry CTA on hive.sealedAt',
  /hive\.sealedAt/.test(detail) && /\+ Add Entry/.test(detail)
);

const compose = read('src/screens/ComposeHiveEntry.js');
check(
  "ComposeHiveEntry.js distinguishes SQLSTATE 42501 from a generic failure",
  /42501/.test(compose) && /'sealed'/.test(compose) && /'unknown'/.test(compose)
);
check(
  'the sealed-hive message does not reuse the connection-retry copy',
  /can't accept new entries/.test(compose) && !/sealed[\s\S]{0,80}Check your connection/.test(compose)
);

// --- COPY-14 (2026-08-30): the code names the outcome; only state names the
// cause. 20260827000001 rewrote entries_insert_own so 42501 has two true
// causes (no open volume / closed seat) — no client sentence may be derived
// from the bare code.
check(
  'ComposeHiveEntry.js resolves 42501 through resolveEntryRefusal, never straight to a cause',
  /42501'\s*\?\s*await HiveStore\.resolveEntryRefusal\(hiveId\)/.test(compose) &&
    !/42501'\s*\?\s*'sealed'/.test(compose)
);
check(
  "ComposeHiveEntry.js carries the seat-closed sentence in DES-22's register (seat, never removed)",
  /Your seat in this hive has closed/.test(compose) && !/removed from this hive/i.test(compose)
);
check(
  'HiveStore.js no longer cites 20260815000005 as the live sealed refusal',
  !/20260815000005[\s\S]{0,160}sealed/.test(store) &&
    /entries_insert_own[\s\S]{0,120}20260827000001/.test(store)
);

// The case table runs as the declarator's own source text (R12 adopt shape:
// evaluating a copy would stay green while the app drifts). Five fabricated
// states; the last two are the load-bearing pair:
//   - seat.sealedAt set is the post-ENG-91 world (a rotation hive with zero
//     open volumes, mirror written) — no shipped path produces it yet, so
//     this row is deliberately ENG-91's first real assertion of the sealed
//     sentence coming back.
//   - seat active + sealedAt null + 42501 is unreachable for a stated
//     reason (the mirror); it must resolve NEUTRAL, because it is the
//     client-side detector for ENG-91 sealing without the
//     private_hives.sealed_at mirror write.
const resolverSrc = store.match(/const resolveRefusalCause = \(own, seat\) => \{[\s\S]*?\n\};/)?.[0];
check('resolveRefusalCause is extractable from HiveStore.js', !!resolverSrc);
if (resolverSrc) {
  const resolve = new Function(`${resolverSrc}\nreturn resolveRefusalCause;`)();
  check("owner + sealedAt set -> 'sealed'", resolve({ sealedAt: '2026-08-30' }, null) === 'sealed');
  check("owner + open hive -> neutral 'unknown' (an owner never reads seat-closed)", resolve({ sealedAt: null }, null) === 'unknown');
  check("no hive, no seat -> 'seatClosed'", resolve(null, null) === 'seatClosed');
  check(
    "fabricated ENG-91 state (zero open volumes, mirror written) -> 'sealed'",
    resolve(null, { sealedAt: '2026-09-01' }) === 'sealed'
  );
  check(
    "active seat + sealedAt null + 42501 -> neutral 'unknown' (mirror-regression detector cell)",
    resolve(null, { sealedAt: null }) === 'unknown'
  );
}

const fileTo = read('src/components/FileToHive.js');
check(
  'FileToHive.js asserts the SEALED pill only from state-confirmed sealedAt, never the bare code',
  /if \(confirmedSealedAt\) \{[\s\S]{0,120}setRaceSealedIds/.test(fileTo) &&
    !/42501'\)\s*\{\s*\n\s*(\/\/[^\n]*\n\s*)*setRaceSealedIds/.test(fileTo)
);

console.log(`\ncheck-private-hives-client-seal: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
