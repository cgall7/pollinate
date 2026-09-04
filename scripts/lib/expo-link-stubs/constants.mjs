// Stub for `expo-constants`, module-boundary only — the values these getters
// return are set by the gate per regime under test via `globalThis`, not
// baked in here. `expo-linking`'s `Schemes.js` reads `executionEnvironment`
// to decide whether a URL's `--/` Expo Go prefix gets folded away, and reads
// `expoConfig`/`expoGoConfig`/`linkingUri` to resolve a scheme. Omitting a
// field a live call path reads (e.g. `expoConfig.hostUri` under
// `getHostUri()`) throws INSIDE `parse`, which the app code's own `catch`
// swallows to `null` — a broken stub misreads as the bug under test, so keep
// this in sync with what `Schemes.js`/`createURL.js` actually read.
export const ExecutionEnvironment = { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' };

export default {
  get executionEnvironment() {
    return globalThis.__LINK_STUB_ENV__;
  },
  get expoConfig() {
    return globalThis.__LINK_STUB_CONFIG__;
  },
  get expoGoConfig() {
    return globalThis.__LINK_STUB_GOCONFIG__;
  },
  get linkingUri() {
    return globalThis.__LINK_STUB_LINKINGURI__;
  },
};
