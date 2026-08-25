// Canonical per-violation identity for each ratcheted baseline, shared by
// the gate that diffs against it and ratchet-update.mjs that regenerates
// it. One definition per baseline, imported everywhere it's needed — R16
// (Lumen, 2026-08-21, GUIDES/HEX_TAP_SPEC_LUXURY_PASS.md "R15/R16/R17
// Build Review"): a gate re-deriving its own key function instead of
// importing one is the hand-reimplementation class R12 already named once.
//
// NOTE FOR WHOEVER MERGES `sage/luxury-gates-v2` INTO THIS LINEAGE: that
// branch (commit 19062c3) has its own `ratchet-keys.mjs` with
// `paddingKeyOf`/`deprecatedImportKeyOf`/`springKeyOf`/`durationKeyOf` for
// check-safe-area/check-spring-adoption — it hadn't merged to `main`/
// `wave2` when this gate was built, so this file only carries the one key
// this lineage needs today. Reconcile by taking the union of both files'
// exports; nothing here conflicts with those definitions.
//
// `pressableLayoutKeyOf` is `file:styleKey:bannedKey`, not `file:line`
// (R16a's shape). `styleKey` is a StyleSheet.create property name — unique
// per file by construction — and `bannedKey` (width/alignSelf/flex/
// flexBasis/margin*) distinguishes the (rare) case where one styleKey
// carries more than one banned property, e.g. CreateHive's `themeCard` had
// both `width` and `marginBottom` before the fix. A style object resolved
// only to an inline literal (no named `styles.x`) falls back to a
// synthesized `<inline>@<line>` styleKey — line-sensitive in that one case,
// same admitted limitation as check-spring-adoption's duration entries.
export const pressableLayoutKeyOf = (v) => `${v.file}:${v.styleKey}:${v.key}`;
