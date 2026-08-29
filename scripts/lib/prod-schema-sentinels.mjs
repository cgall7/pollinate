// Sentinels for prod-schema-check.mjs — one entry per migration file in
// supabase/migrations/, in version order.
//
// Lives in lib/ rather than inline in prod-schema-check.mjs because two
// consumers with opposite runtime constraints read it:
//
//   - scripts/prod-schema-check.mjs (manual, network, real credentials)
//     probes each entry against prod.
//   - scripts/check-migration-sentinels.mjs (npm test, pure disk, no
//     network) asserts this table and supabase/migrations/ enumerate each
//     other exactly.
//
// Importing the check script's data from the network script would run the
// network script's top-level env check inside `npm test`; this module has
// no side effects at all.
//
// Probe kinds:
//   column : GET /rest/v1/<table>?select=<column>&limit=1
//   rpc    : POST /rest/v1/rpc/<fn>; expect 'exists' (anything but PGRST202)
//            or an exact PostgREST error code that only the migration produces
//   storage: GET /storage/v1/object/public/<bucket>/<nonsense>; a live public
//            bucket answers "Object not found", a missing one "Bucket not found"
//   order  : no anon-visible surface; status comes from version order
//            (prod-schema-check rule 3)
//
// Sentinel names were read from the migration SQL, not the file names —
// 20260809000002's file says find_profile_by_email; the function it creates
// is find_connectable_profile.
export const SENTINELS = {
  '20260808000001_honeycombs_core_schema': { kind: 'column', table: 'entries', column: 'id' },
  '20260809000001_avatar_storage': { kind: 'storage', bucket: 'avatars' },
  '20260809000002_find_profile_by_email': { kind: 'rpc', fn: 'find_connectable_profile', args: { lookup_email: 'calibration@example.invalid' }, expect: 'exists' },
  '20260809000003_fix_likes_comments_visibility': { kind: 'order', reason: 'policy replace only' },
  '20260809000004_fix_shares_insert_recursion': { kind: 'order', reason: 'policy replace + function revoke' },
  '20260809000005_profiles_select_pending_counterparties': { kind: 'order', reason: 'policy replace only' },
  '20260810000001_content_length_caps': { kind: 'order', reason: 'check constraints; anon cannot insert to trip them' },
  '20260811000001_correct_unused_column_comments': { kind: 'order', reason: 'COMMENT ON only' },
  '20260813000001_notes_schema': { kind: 'column', table: 'notes', column: 'id' },
  '20260813000002_seeds_schema': { kind: 'column', table: 'seeds', column: 'id' },
  '20260813000003_hive_state_facts': { kind: 'rpc', fn: 'list_hive_state', args: {}, expect: 'exists' },
  '20260813000004_entries_hive_visibility': { kind: 'column', table: 'entries', column: 'hive_id' },
  // 42501 is this migration WORKING: it revokes definer-function execute from
  // anon, so the function answering "permission denied" to the anon key is the
  // observable. A 200 here would mean the revoke is NOT applied — but 'exists'
  // for 000003 above would still hold, which is why these are two rows.
  '20260813000005_revoke_definer_execute_from_anon': { kind: 'rpc', fn: 'list_hive_state', args: {}, expect: '42501' },
  '20260813000006_entries_theme_column': { kind: 'column', table: 'entries', column: 'theme' },
  '20260813000007_entries_one_per_day_dedupe': { kind: 'order', reason: 'unique index; anon cannot insert to trip it' },
  '20260815000001_private_hives': { kind: 'column', table: 'private_hives', column: 'owner_id' },
  '20260815000002_private_hives_entries_ownership_guard': { kind: 'order', reason: 'policy replace only' },
  '20260815000003_private_hives_sealed_at': { kind: 'column', table: 'private_hives', column: 'sealed_at' },
  '20260815000004_private_hives_sealed_at_guard': { kind: 'order', reason: 'trigger only' },
  '20260815000005_private_hives_sealed_entries_readonly': { kind: 'order', reason: 'policy replace only' },
  '20260815000006_private_hives_sealed_entries_immutable': { kind: 'order', reason: 'policy replace only' },
  '20260817000001_harden_definer_search_path': { kind: 'order', reason: 'ALTER FUNCTION SET search_path only' },
  '20260817000002_private_hives_cover_and_cadence': { kind: 'column', table: 'private_hives', column: 'cover_theme' },
  '20260819000001_private_hives_send': { kind: 'column', table: 'private_hives', column: 'sent_at' },
  '20260819000002_hive_send_events': { kind: 'column', table: 'hive_send_events', column: 'id' },
  // seal_hive adds no new column (unlike send_hive/sent_at) — it's purely a
  // new SECURITY DEFINER function, revoked from anon in the same migration
  // that creates it. Same shape as 20260813000005's anon-revoke sentinel:
  // an anon caller can't get past PostgREST's own EXECUTE check, so 42501
  // is what "this migration landed" looks like from outside.
  '20260819000003_seal_hive': {
    kind: 'rpc',
    fn: 'seal_hive',
    args: { p_hive_id: '00000000-0000-0000-0000-000000000000' },
    expect: '42501',
  },
  '20260824000001_private_hives_relationship': { kind: 'column', table: 'private_hives', column: 'relationship' },
  '20260824000002_entries_reflection': { kind: 'column', table: 'entries', column: 'reflection' },
  // The ledger revokes everything from anon and grants select to authenticated
  // only, so the anon probe answers 42501 — which the column rule above
  // documents as LIVE (column resolution precedes the privilege check; a
  // missing table/column would answer 42P01/42703 instead). rails_mode is
  // also the schema's most load-bearing column: the simulated/live tripwire.
  '20260826000001_nectar_ledger': { kind: 'column', table: 'ledger_settings', column: 'rails_mode' },
  // hive_volumes is owner-only RLS with no anon grant beyond table-level
  // SELECT (same shape as private_hives itself, 20260815000001's sentinel
  // above) -- a real column resolves 200 with zero rows, not 42703/42501.
  '20260826000003_hive_volumes': { kind: 'column', table: 'hive_volumes', column: 'hive_id' },
  // Same anon-revoke shape as seal_hive's own sentinel (20260819000003):
  // seal_volume is a new SECURITY DEFINER function with no anon EXECUTE, so
  // 42501 is what "this migration landed" looks like from outside.
  '20260826000004_hive_volumes_repoint': {
    kind: 'rpc',
    fn: 'seal_volume',
    args: { p_hive_id: '00000000-0000-0000-0000-000000000000' },
    expect: '42501',
  },
  // Same anon-revoke shape as seal_hive/seal_volume: record_zap is the 19a
  // service layer's most load-bearing artifact, and anon has no EXECUTE on
  // it, so 42501 is what "this migration landed" looks like from outside.
  '20260826000005_nectar_sim_service': {
    kind: 'rpc',
    fn: 'record_zap',
    args: {
      p_zap_id: '00000000-0000-0000-0000-000000000000',
      p_target_kind: 'entry',
      p_target_id: '00000000-0000-0000-0000-000000000000',
      p_amount_drops: 1,
    },
    expect: '42501',
  },
  // Column renames + function/view drop-recreate, RLS-locked tables anon
  // never had access to either side of the rename; no anon-visible surface
  // changes shape. Same posture as other pure-rename migrations above.
  '20260826000006_nectar_sats_override': { kind: 'order', reason: 'column renames + trigger/function/view drop-recreate; no anon-visible surface' },
  // Same shape as 20260813000006_entries_theme_column — a plain nullable
  // text column, no RLS change (sealed-hive immutability already covers it).
  '20260826000007_entries_paper': { kind: 'column', table: 'entries', column: 'paper' },
  // Same shape as 20260817000002_private_hives_cover_and_cadence — owner-only
  // RLS on private_hives, no anon grant beyond table-level SELECT, so a real
  // column resolves 200 with zero rows. is_collective is this migration's
  // one column add; hive_contributors/is_hive_contributor/the entries policy
  // widening all ride the same version-order guarantee as everything else
  // below a 'column'-kind row.
  '20260827000001_multi_writer_hives': { kind: 'column', table: 'private_hives', column: 'is_collective' },
  '20260828000001_multiwriter_contributor_names': { kind: 'column', table: 'private_hives', column: 'contributor_names' },
  // Inverse of 20260813000005's shape: that migration made an RPC 42501 for
  // anon and used that as its live-signal. This one un-does the 42501 for
  // is_hive_contributor specifically (829's grant covers is_volume_open too,
  // but one probe per migration is this table's existing convention — see
  // 20260813000005 naming only list_hive_state for a three-function revoke).
  // Post-migration, anon calling it gets a real boolean back (`false`,
  // always, per check-share-visibility.mjs's named exception and Sage's
  // ruling in thread d1783906).
  //
  // CORRECTED (Lumen, thread d1783906, 2026-08-29): this row shipped with
  // `expect: 'exists'` and read LIVE for three weeks before either this
  // migration or 20260829000002 was actually deployed — 'exists' only
  // discriminates on PGRST202 (function absent), and this migration's
  // before-state (42501, permission denied) is already a resolved function,
  // so it cleared that check too. Prod-schema-check's own dry live run
  // caught the gap directly: `is_hive_contributor` answered 200/false only
  // AFTER `supabase db push` actually applied this file — before that it was
  // 401/42501, and this row still said LIVE either way. `expect: 'success'`
  // is the corrected signal: it requires the actual 200, not just a
  // resolved function name.
  '20260829000001_grant_hive_definer_helpers_anon': {
    kind: 'rpc',
    fn: 'is_hive_contributor',
    args: { p_hive_id: '00000000-0000-0000-0000-000000000000' },
    expect: 'success',
  },
  // Same inverse-of-813 shape as 20260829000001's row above, for the third
  // function in that migration's family: owns_entry() re-gains anon EXECUTE
  // here, so a post-migration anon call gets a real boolean back instead of
  // 813's 42501. Same correction as above, for the same reason — live-tested
  // against prod both before and after `supabase db push` applied this file
  // (2026-08-29): 401/42501 before, 200/false after, and `expect: 'success'`
  // is what actually tells those two states apart.
  '20260829000002_grant_owns_entry_anon': {
    kind: 'rpc',
    fn: 'owns_entry',
    args: { p_entry_id: '00000000-0000-0000-0000-000000000000' },
    expect: 'success',
  },
};
