// The idle-motion instrument's OFF switch — `scripts/measure-bee-idle-motion.mjs`,
// Sage's gate 4 of the luxury pass, the bar that can say no to the bee.
//
// REWRITTEN 2026-08-25 (Bee Doctrine thread, UX Design #8d2c9a5d) — the
// script used to compare two `.mov` FILE SIZES against a 15% threshold.
// Pixel measured that metric apart: the encoder writes a whole frame the
// moment any pixel changes, so presence cost 1.01x and 3x the amplitude cost
// 813x against 811x for 1x — nothing can land between 1.00x and a 1.15% bar.
// It now captures lossless PNG bursts twice each way and asks two separate
// questions: a binary TRIPWIRE (does anything move outside the declared
// Breath region, beyond the ambient control's own noise floor) and a
// reported, unthresholded AMPLITUDE figure for what happens inside it. It
// needs a build where nothing renders the resident bee and everything else
// on the screen is byte-identical, and it explicitly does not own that hook:
//
//     "read `process.env.EXPO_PUBLIC_SUPPRESS_BEE === 'true'` at the bee's
//      mount site and force it unmounted when set"          — its own header
//
// **This is a BUILD FLAG, not a product mode**, and the two are different axes
// (WP-10(c)'s finding — `DEMO_MODE` and `__DEV__` disagreed in exactly one
// build). Nothing in the app should ever branch on it: it exists so an
// instrument can construct a control, and the only correct number of readers
// is the resident mount sites.
//
// **It suppresses the RESIDENT bee, not every bee**, and the scope is stated
// because the name is broader than the behaviour. Onboarding's `<FlyingBee>`
// is a `loginArc` preset — a one-shot arc a host asked for, errand-class, not
// resident — and it is untouched. Today and Hive are the two screens the bee
// lives on and the two this flag empties.
//
// Two traps `demoMode.js` already documents and this inherits: Expo's
// inline-env-vars babel plugin only rewrites a DIRECT `process.env.X` member
// read, so destructuring resolves to `undefined` and silently kills the flag;
// and the inlined value is always a string, so a bare truthiness check makes
// an explicit `"false"` truthy. The `=== 'true'` comparison is what makes an
// absent var resolve to `false`, which is the shipping default.
export const SUPPRESS_BEE = process.env.EXPO_PUBLIC_SUPPRESS_BEE === 'true';
