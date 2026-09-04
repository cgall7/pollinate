// Stub for `expo-modules-core` — module-boundary only. `expo-linking`'s
// `Schemes.js` uses `Platform.select`/`Platform.OS`; nothing under test reads
// `UnavailabilityError`, but `expo-linking` imports it, so it must exist.
export const Platform = { OS: 'ios', select: (o) => (o && 'ios' in o ? o.ios : undefined) };
export class UnavailabilityError extends Error {}
