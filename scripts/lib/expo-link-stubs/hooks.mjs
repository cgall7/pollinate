// Node module-resolution hook that lets a gate execute `combInviteLinking.js`
// / `authLinking.js` for real, instead of asserting on their source text.
//
// Two independent blockers otherwise stop a plain `await import()` of either
// module (measured on node v24.18.0, `expo-linking@57.0.8`):
//
//   1. `expo-linking` -> `expo-modules-core`, whose package.json `exports`
//      map resolves `.` to `./src/index.ts`. Node refuses to strip types
//      under `node_modules`: `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`.
//   2. expo's own build output uses extensionless relative specifiers
//      (`from './Schemes'`). Metro resolves those; node ESM does not.
//
// This hook only intercepts the module BOUNDARY (`expo-constants`,
// `expo-modules-core`, `expo-linking`) and falls back to appending `.js` for
// any other extensionless relative specifier that fails to resolve — the
// parse/createURL logic under test is never reimplemented, only the two
// native-module dependencies it reads through.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DIR = new URL('.', import.meta.url);
const MAP = {
  'expo-constants': new URL('constants.mjs', DIR).href,
  'expo-modules-core': new URL('modules-core.mjs', DIR).href,
  'expo-linking': new URL('expo-linking.mjs', DIR).href,
};

export async function resolve(specifier, context, nextResolve) {
  if (MAP[specifier]) {
    return { url: MAP[specifier], shortCircuit: true };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') && context.parentURL) {
      const candidate = new URL(`${specifier}.js`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) {
        return { url: candidate.href, shortCircuit: true };
      }
    }
    throw err;
  }
}
