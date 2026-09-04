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
  // CORRECTED (Lumen, thread d1783906, 2026-08-29): this row named
  // list_hive_state, but 20260813000005 never touches list_hive_state — that
  // function's anon revoke happened two migrations earlier, at
  // 20260813000003:80. 20260813000005's own three revokes are
  // find_connectable_profile, owns_entry, and handle_new_user (:92-95);
  // list_hive_state appears in its file only inside a comment saying so.
  // Both possible before-states — 000003 applied/000005 not, or both
  // applied — answer 42501 on list_hive_state, so this row could never fail
  // regardless of whether 000005 itself was deployed. Same failure shape as
  // the `expect: 'exists'` gap fixed on 20260829000001/2 earlier tonight,
  // one row over: the expectation was never wired to what THIS migration's
  // effect actually is.
  //
  // Repointed to find_connectable_profile, which 20260809000002's row above
  // already probes with `expect: 'exists'` for its creation — this row
  // probes the SAME function for the anon revoke specifically, the
  // identical two-rows-one-function shape this table already uses for
  // list_hive_state itself (000003 + this row, just previously aimed at the
  // wrong fn). Before 20260813000005: find_connectable_profile carries
  // `revoke all from public` from its own creation (20260809000002), but
  // anon's NAMED grant (Supabase's platform-level `alter default privileges
  // ... grant all on functions to anon` — not in this repo's migrations;
  // proven live rather than cited by 20260813000005:12-22's own ACL
  // printout off pg_proc and its executed revoke-PUBLIC-only /
  // revoke-anon-only / revoke-both test) survives a from-public revoke, so
  // anon could still call it — a real 200 (empty result; the function's own
  // self-exclusion clause nulls out when auth.uid() is null for anon).
  // After: 42501. Live-verified directly against production, 2026-08-29 —
  // current answer is 401/42501, with both controls (fabricated fn name,
  // real fn/wrong arg name) answering PGRST202/404, proving the 42501 is a
  // resolved function denying EXECUTE, not a signature miss.
  //
  // NOT owns_entry — the other function this same migration revokes from
  // anon, and the obvious other choice from the same file. 20260829000002
  // re-granted it to anon tonight, so a row expecting 42501 from owns_entry
  // would be permanently red as of today, for a reason that has nothing to
  // do with whether 20260813000005 is deployed.
  '20260813000005_revoke_definer_execute_from_anon': {
    kind: 'rpc',
    fn: 'find_connectable_profile',
    args: { lookup_email: 'calibration@example.invalid' },
    expect: '42501',
  },
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
  // Column probe, not an rpc probe on delete_own_account() itself — that
  // function is destructive (deletes the caller's auth.users row) and this
  // suite must never invoke it against prod, permission-denied or not.
  // deleted_at is the anon-visible surface this migration actually adds:
  // GET .../profiles?select=deleted_at answers 42703 before this migration,
  // and 200 (empty array under RLS, since anon matches no profiles row —
  // policies require auth.uid()) after it — same undefined-column-fires-
  // before-RLS shape 20260813000006's row already relies on.
  '20260830000001_eng84_account_deletion': { kind: 'column', table: 'profiles', column: 'deleted_at' },
  // ENG-58 (Sage). Filename renumbered 20260830000001 -> 20260830000002 to
  // avoid the prefix collision with ENG-84 (merged first, same day) — this
  // key matches the renamed file. Same `kind: 'column'` shape as every
  // other table-creation row in this file (20260808000001, 20260813000001/2,
  // 20260815000001) rather than an `rpc` probe: this migration's every new
  // function explicitly revokes anon (comb_member_count, comb_co_member_names,
  // comb_rotation_roster, is_comb_member all `revoke execute ... from
  // anon`), so an rpc probe would read 42501 both for "function does not
  // exist yet" in one code path (PGRST202, already MISSING before this) and
  // "function exists, anon denied" after — the exact ambiguity `expect`
  // exists to resolve, avoided here by probing a table column instead,
  // where 200-or-42501 both prove existence regardless of anon's grant (see
  // the `kind: 'column'` comment above).
  '20260830000002_comb_rotation_schema': { kind: 'column', table: 'combs', column: 'id' },
  // ENG-91 (Sage). Same reasoning as 20260830000002's row, one column over:
  // seal_and_send_rotation() is the only new function here and it's granted
  // to service_role alone (not even `authenticated`), so an rpc probe would
  // read 42501 for "doesn't exist yet" and "exists, anon/authenticated
  // denied" alike — the exact ambiguity a column probe sidesteps.
  // voided_reason is the one new column this migration adds to the
  // already-RLS'd comb_rotations table (20260830000002): GET
  // .../comb_rotations?select=voided_reason answers 42703 before this
  // migration, 200-or-42501 after, regardless of anon's grant on the table.
  '20260830000003_eng91_seal_and_send_rotation': { kind: 'column', table: 'comb_rotations', column: 'voided_reason' },
  // ENG-59 (Fizz). comb_join_by_invite_code adds no new column — same shape
  // as seal_hive/seal_volume above: a SECURITY DEFINER function revoked from
  // anon in the same migration that creates it, so 42501 is what "this
  // migration landed" looks like from outside (an rpc probe against a
  // service_role-only function like ENG-91's would be ambiguous between
  // "doesn't exist" and "exists, denied" — not the case here, since anon's
  // denial is the only state this function has ever been in).
  '20260830000004_eng59_comb_join_by_invite': {
    kind: 'rpc',
    fn: 'comb_join_by_invite_code',
    args: { p_invite_code: 'calibration-invalid-code' },
    expect: '42501',
  },
  // OPS-9 (Bumble). No anon-visible surface at all: advance_due_rotations()
  // is revoked from anon and authenticated (service_role only, same as
  // seal_and_send_rotation), and the pg_cron schedule itself lives in the
  // `cron` schema, which is never exposed through PostgREST — there is no
  // column, rpc, or storage probe that could distinguish before/after this
  // migration through the anon key. Status comes from version order alone.
  '20260830000012_ops9_rotation_scheduler': { kind: 'order', reason: 'service_role-only function + pg_cron schedule, no anon-visible surface' },
  // ENG-85 adds server-owned plan tables plus this nullable comb column.
  // The column is the stable live-schema signal; enforcement remains dormant
  // while both seeded plan limits are NULL.
  '20260830000013_eng85_entitlements': { kind: 'column', table: 'combs', column: 'member_limit_override' },
  // ENG-59 (Fizz). comb_preview_by_invite_code is the opposite grant shape
  // from comb_join_by_invite_code above -- anon is meant to reach it (the
  // whole point of a pre-auth landing), so 42501 is never a LIVE reading
  // here. 'exists' would be ambiguous the other direction (a PGRST202-only
  // check can't tell "created, still revoked from anon" apart from "granted
  // to anon"), so this probes for the full round trip: an invalid code is a
  // legitimate call this function is built to answer with 200 and zero
  // rows, not an error -- exactly what 'success' distinguishes from
  // "function exists but anon still can't call it."
  '20260830000006_comb_preview_by_invite_code': {
    kind: 'rpc',
    fn: 'comb_preview_by_invite_code',
    args: { p_invite_code: 'calibration-invalid-code' },
    expect: 'success',
  },
  // ENG-93 (Fizz, row 1.7a). comb_open_rotation is the same grant shape as
  // comb_join_by_invite_code above: revoked from anon in the same migration
  // that creates it (granted only to authenticated and service_role), so
  // 42501 is what "this migration landed" looks like from outside — anon's
  // denial is the only state this function has ever been in, regardless of
  // whether the calibration args below would also fail their own checks
  // (nonexistent comb, tombstone check, etc.) once past the grant.
  '20260830000008_eng93_comb_open_rotation': {
    kind: 'rpc',
    fn: 'comb_open_rotation',
    args: {
      p_comb_id: '00000000-0000-0000-0000-000000000000',
      p_subject_profile_id: '00000000-0000-0000-0000-000000000000',
      p_closes_at: '2026-01-01T00:00:00Z',
    },
    expect: '42501',
  },
  // ENG-95 (Sage). comb_subject_gone(uuid, uuid) is revoked from public,
  // anon, AND authenticated -- unlike every 'rpc' entry above, there is no
  // role this function is ever meant to answer for directly (every caller
  // is itself SECURITY DEFINER and reaches it through owner privilege, not
  // a grant), so there is no anon/authenticated probe that would read
  // differently before and after this migration. seal_and_send_rotation's
  // own grants (service_role only) are unchanged by this migration's
  // create-or-replace. No anon-visible surface, same class as
  // nectar_sats_override above.
  '20260830000009_eng95_seal_nonmember_subject': { kind: 'order', reason: 'new SECURITY DEFINER helper revoked from every client role; seal_and_send_rotation body replace only, grants unchanged' },
  // ENG-92 (Sage). No new table/column and no anon-visible surface: one
  // ALTER POLICY (comb_rotations_insert_owner, still authenticated-only
  // insert), one new trigger (private_hives, no new column), and every new
  // or replaced function here is anon-revoked (comb_rotation_writer_count
  // explicitly; comb_member_count/comb_co_member_names/delete_own_account
  // were already anon-revoked by the migrations that first created them
  // and this one only replaces their bodies, not their grants) — same
  // reasoning as 20260830000002/3's rows, one migration over.
  '20260830000007_eng92_comb_rotation_fixes': {
    kind: 'order',
    reason: 'policy alter + trigger + definer functions, all anon-revoked; no anon-visible surface',
  },
  // ENG-94 (Fizz). Repoints comb_open_rotation and comb_preview_by_invite_code
  // onto the shared comb_subject_gone predicate (ENG-95) — body replace only
  // for both functions, no grant changes (comb_open_rotation stays revoked
  // from anon per `...0008`'s sentinel above; comb_preview_by_invite_code
  // stays anon-callable per `...0006`'s). The externally-visible probe shape
  // for both functions is identical before and after this migration — the
  // only behavior change (the departure arm folding into the mint refusal
  // and into has_active_month) requires a live open rotation with a
  // departed/tombstoned subject to observe, which no anon calibration probe
  // can construct. Same class as `...0009` above.
  '20260830000010_eng94_repoint_subject_gone': { kind: 'order', reason: 'comb_open_rotation and comb_preview_by_invite_code body replace only; grants unchanged for both' },
  // ENG-60, row 1.9a (Fizz). comb_advance_rotation(uuid) is the same grant
  // shape as comb_open_rotation above, one step narrower: revoked from
  // anon in the same migration that creates it, and granted ONLY to
  // service_role (not authenticated either — see the migration header).
  // Anon's denial is the only state this function has ever been in, so
  // 42501 is what "this migration landed" looks like from outside, same
  // reasoning as ENG-93's row.
  //
  // §1B.36.25: this migration also body-replaces comb_open_rotation
  // (adds the p_closes_at derivation/discriminator) — grants unchanged,
  // same class as `...0010`'s entry above: a DEFAULT param doesn't
  // change pg_get_function_identity_arguments, so the signature this
  // sentinel would otherwise probe is untouched. One entry per file is
  // this gate's shape (existence/shape only, not full-file coverage —
  // see this file's header); comb_advance_rotation's rpc probe below
  // stands for the migration as a whole.
  '20260830000011_eng60_comb_advance_rotation': {
    kind: 'rpc',
    fn: 'comb_advance_rotation',
    args: { p_comb_id: '00000000-0000-0000-0000-000000000000' },
    expect: '42501',
  },
  '20260831000001_eng59_join_current_rotation': {
    kind: 'order',
    reason: 'authenticated-only SECURITY DEFINER join RPC replacement, no anon-visible surface',
  },
  // ENG-90 (Fizz). The note ledger is deliberately not anon-readable, but
  // column resolution precedes the privilege check: 42501 proves the new
  // table/column exists while preserving its closed client-write surface.
  '20260901000001_eng90_comb_nectar_note': {
    kind: 'column',
    table: 'comb_nectar_notes',
    column: 'note_text',
  },
  // ENG-89 (Fizz). All four new functions are service_role-only internal
  // reporting (C1/C3/C5 instruments) — revoked from anon and authenticated,
  // same posture as advance_due_rotations (20260830000012). No anon-visible
  // surface for a preflight to probe.
  '20260904000001_eng89_c1_c3_c5_instruments': {
    kind: 'order',
    reason: 'service_role-only reporting functions, no anon-visible surface',
  },
};
