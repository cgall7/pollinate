// Stub for the `expo-linking` package specifier itself. Re-exports the REAL
// `parse`/`createURL` implementation straight from the installed package —
// the parse logic under test is never reimplemented here, only the two
// native-module dependencies it reads through (`expo-constants`,
// `expo-modules-core`) are stubbed. See hooks.mjs for why a plain
// `await import('expo-linking')` can't reach this file on its own.
export { parse, createURL } from '../../../node_modules/expo-linking/build/createURL.js';
export * from '../../../node_modules/expo-linking/build/Schemes.js';
