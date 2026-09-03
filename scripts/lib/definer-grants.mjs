// EXPECTED grant sets for every SECURITY DEFINER function in `public`, plus
// the payload a prod probe needs to ask the same question from outside.
//
// Lives in lib/ rather than inline in check-share-visibility.mjs because two
// consumers with opposite runtime constraints read it — the same split
// lib/prod-schema-sentinels.mjs already documents:
//
//   - scripts/check-share-visibility.mjs (npm test, embedded Postgres, no
//     network) asserts this table and the catalog enumerate each other
//     exactly, in both directions, for all three client-facing roles.
//   - scripts/prod-anon-definer-check.mjs (manual, network, real anon key)
//     asks PROD whether anon's half of that table still holds.
//
// Importing the gate's data from the network script would drag the gate's
// embedded-Postgres boot into a preflight that has no local database, and
// importing the other way would put a network script's env check inside
// `npm test`. This module has no side effects at all.
//
// WHY EVERY ROW CARRIES ARGUMENT NAMES AND NOT JUST A SIGNATURE
//
// The keys are `regprocedure` text — `comb_member_count(uuid)` — which
// carries argument TYPES. PostgREST resolves an RPC by argument NAMES: it
// reads the JSON body's keys and looks for a function with that exact
// parameter-name set. A real function called with a wrong or missing
// argument name answers PGRST202/404, identically to a function that does
// not exist — live-measured against production on 2026-08-29 and recorded
// in lib/prod-schema-sentinels.mjs ("real fn/wrong arg name ... answering
// PGRST202/404").
//
// That is why the signature alone cannot drive the prod probe, and why the
// failure would have been silent rather than loud: a prod probe reading
// "anon cannot execute this" off a PGRST202 would return that answer for
// EVERY row at once the moment the argument names were wrong or absent —
// a green run reporting the whole map revoked, for the reason that nothing
// resolved. `probe.args` is checked against the catalog's own
// `proargnames` by check-share-visibility.mjs, so the names cannot drift
// away from the schema without `npm test` going red.
//
// PROBE KINDS
//   call    : POST /rest/v1/rpc/<fn> with `args`. Values are fabricated —
//             a zero UUID, a nonsense invite code — so that a function anon
//             CAN still execute finds nothing and changes nothing. Enum
//             arguments use a REAL label ('entry'): an invalid label raises
//             22P02 during argument coercion, which happens before the
//             EXECUTE privilege check and would mask the 42501 this probe
//             is looking for.
//   trigger : not probeable from outside. Postgres refuses a direct call on
//             a trigger function ("trigger functions can only be called as
//             triggers") regardless of the catalog, so the answer carries no
//             grant information. The row's `roles` are still asserted
//             locally — being inert is why it is not a leak, not a reason to
//             leave it out.
//   unsafe  : resolvable and callable, and DELIBERATELY not called. See
//             advance_due_rotations() below.
//
// THE ONE ROW THIS INSTRUMENT CANNOT ANSWER, AND WHY THAT IS NOT A PASS
//
// `advance_due_rotations()` takes no arguments and has no `auth.uid()`
// guard — its body opens with `for r in select id, comb_id from
// public.comb_rotations where closes_at <= now() and sealed_at is null`.
// Every other function here can be probed harmlessly because a fabricated
// UUID makes the call a no-op; a zero-argument function offers nothing to
// fabricate. So if anon's revoke HAS regressed on prod — the exact
// condition this probe exists to detect — the probe would seal and send
// every due rotation in production. The probe is the damage.
//
// It is therefore marked `unsafe` and skipped, and prod-anon-definer-check
// exits INDETERMINATE rather than 0 while any `unsafe` row is unanswered —
// the same rule prod-schema-check.mjs applies to its unverified tail. The
// instruments that DO settle it are the local catalog assertion in
// check-share-visibility.mjs and an authenticated `supabase migration list`
// confirming 20260829000002 is applied. Do not "fix" this row by calling it.
//
// EXPECTED_DEFINER_GRANTS below generalizes ALLOWED_ANON_DEFINERS to all
// three client-facing roles, asserted `==` (not just "not more than") in
// both directions, for every SECURITY DEFINER function in `public` — not
// just the ones a migration happened to touch. Two failure classes this
// catches that the anon-only check could not: (1) `extra` — a role can
// execute a function nothing here expects, whether from a genuinely new
// grant or a lost revoke on an old one; (2) `missing` — an expected grant
// (e.g. one of the four anon exceptions above) silently regressed, which
// for `is_hive_contributor`/`is_volume_open`/`owns_entry` would resurrect
// the exact inlining 500 those three migrations closed. A function with
// no row at all is also a failure — a new definer ships un-reviewed
// otherwise, which is the condition this whole gate exists to end.
//
// A TRIGGER function's grant is inert — Postgres refuses `select
// fn()`/`rpc/fn` on it directly ("trigger functions can only be called as
// triggers") regardless of what the catalog says — but its row still
// names the true grant state rather than being left out, because a
// silent row is exactly how `entries_mark_shared` and `handle_new_user`
// (authenticated-open via the un-revoked default privilege, no explicit
// grant statement, no comment) diverged unnoticed from the three sibling
// trigger functions that got an explicit — if redundant — grant written
// down (Vector's own measurement: "written by pattern, not per-function
// decision"). Being inert is why this is not a leak; it is still a fact
// the map has to state, not infer.
//
// `why` is one line, the standard the four anon paragraphs above already
// set: enough to tell a reviewer this was decided, not defaulted into.
export const DEFINER_GRANTS = new Map([
  // -- anon-callable by name: the four exceptions argued in full above --
  ['comb_preview_by_invite_code(text)', { roles: ['anon', 'authenticated', 'service_role'], why: 'DES-37 pre-auth invite landing — anon-callable by design, argued above', probe: { kind: 'call', poison: null, safety: 'every argument is text, so nothing can be poisoned — but the body is a read-only pre-auth lookup that anon is MEANT to reach, and a fabricated code resolves no comb', args: { p_invite_code: 'prod-anon-definer-check-fabricated' } } }],
  ['is_hive_contributor(uuid)', { roles: ['anon', 'authenticated', 'service_role'], why: 'inlining-leak fix, named exception above', probe: { kind: 'call', poison: 'p_hive_id', args: { p_hive_id: 'prod-anon-definer-check-not-a-uuid' } } }],
  ['is_volume_open(uuid)', { roles: ['anon', 'authenticated', 'service_role'], why: 'inlining-leak fix, named exception above', probe: { kind: 'call', poison: 'p_volume_id', args: { p_volume_id: 'prod-anon-definer-check-not-a-uuid' } } }],
  ['owns_entry(uuid)', { roles: ['anon', 'authenticated', 'service_role'], why: 'inlining-leak fix, named exception above', probe: { kind: 'call', poison: 'p_entry_id', args: { p_entry_id: 'prod-anon-definer-check-not-a-uuid' } } }],

  // -- ordinary logged-in RPCs / RPC helpers: anon revoked, authenticated needs a session --
  ['comb_co_member_names(uuid)', { roles: ['authenticated', 'service_role'], why: 'roster-name RPC, requires a session', probe: { kind: 'call', poison: 'p_comb_id', args: { p_comb_id: 'prod-anon-definer-check-not-a-uuid' } } }],
  ['comb_join_by_invite_code(text)', { roles: ['authenticated', 'service_role'], why: 'ENG-59 post-auth join, requires a session', probe: { kind: 'call', poison: null, safety: 'text-only signature, so the body does run if anon can execute it — a fabricated code matches no comb and auth.uid() is null for anon, so the join writes nothing; this is the payload prod-schema-check.mjs already POSTs to prod on every run', args: { p_invite_code: 'prod-anon-definer-check-fabricated' } } }],
  ['comb_member_count(uuid)', { roles: ['authenticated', 'service_role'], why: 'roster-count RPC, requires a session', probe: { kind: 'call', poison: 'p_comb_id', args: { p_comb_id: 'prod-anon-definer-check-not-a-uuid' } } }],
  ['comb_open_rotation(uuid,uuid,timestamp with time zone)', { roles: ['authenticated', 'service_role'], why: 'ENG-93 organizer mint (authenticated) + advance_due_rotations cron (service_role)', probe: { kind: 'call', poison: 'p_comb_id', args: { p_comb_id: 'prod-anon-definer-check-not-a-uuid', p_subject_profile_id: '00000000-0000-0000-0000-000000000000', p_closes_at: '2000-01-01T00:00:00Z' } } }],
  ['comb_rotation_roster(uuid)', { roles: ['authenticated', 'service_role'], why: 'roster RPC, requires a session', probe: { kind: 'call', poison: 'p_rotation_id', args: { p_rotation_id: 'prod-anon-definer-check-not-a-uuid' } } }],
  ['comb_rotation_writer_count(uuid)', { roles: ['authenticated', 'service_role'], why: 'ENG-92 Part 2, C1 denominator RPC, requires a session (see §1B.23.2\'s caveat: only accurate for a subject who is a comb member)', probe: { kind: 'call', poison: 'p_rotation_id', args: { p_rotation_id: 'prod-anon-definer-check-not-a-uuid' } } }],
  ['consent_to_nectar()', { roles: ['authenticated', 'service_role'], why: 'nectar consent RPC, requires a session', probe: { kind: 'unsafe' } }],
  ['delete_own_account()', { roles: ['authenticated', 'service_role'], why: 'ENG-84 self-service deletion, requires a session', probe: { kind: 'unsafe' } }],
  ['find_connectable_profile(text)', { roles: ['authenticated', 'service_role'], why: 'account-lookup RPC; anon revoked 20260813000005 (account-existence oracle)', probe: { kind: 'call', poison: null, safety: 'text-only signature, so the body does run if anon can execute it — a read-only lookup on a fabricated address returns zero rows and writes nothing; this is the payload prod-schema-check.mjs already POSTs to prod on every run', args: { lookup_email: 'prod-anon-definer-check-fabricated' } } }],
  ['is_comb_member(uuid)', { roles: ['authenticated', 'service_role'], why: 'membership-check RPC helper, requires a session', probe: { kind: 'call', poison: 'p_comb_id', args: { p_comb_id: 'prod-anon-definer-check-not-a-uuid' } } }],
  ['plant_seed(uuid,text,timestamp with time zone)', { roles: ['authenticated', 'service_role'], why: 'seed-planting RPC, requires a session', probe: { kind: 'call', poison: 'p_recipient_id', args: { p_recipient_id: 'prod-anon-definer-check-not-a-uuid', p_content: 'prod-anon-definer-check-fabricated', p_bloom_at: '2000-01-01T00:00:00Z' } } }],
  ['profile_has_display_name(uuid)', { roles: ['authenticated', 'service_role'], why: 'invite-time display-name guard RPC helper, requires a session', probe: { kind: 'call', poison: 'p_profile_id', args: { p_profile_id: 'prod-anon-definer-check-not-a-uuid' } } }],
  ['record_zap(uuid,nectar_zap_target_kind,uuid,bigint)', { roles: ['authenticated', 'service_role'], why: 'nectar zap RPC, requires a session', probe: { kind: 'call', poison: 'p_zap_id', args: { p_zap_id: 'prod-anon-definer-check-not-a-uuid', p_target_kind: 'entry', p_target_id: '00000000-0000-0000-0000-000000000000', p_amount_drops: 0 } } }],
  ['send_comb_nectar_note(uuid,uuid,uuid,text,bigint)', { roles: ['authenticated', 'service_role'], why: 'ENG-90 comb nectar-note send RPC, requires a session', probe: { kind: 'call', poison: 'p_send_id', args: { p_send_id: 'prod-anon-definer-check-not-a-uuid', p_comb_id: '00000000-0000-0000-0000-000000000000', p_recipient_id: '00000000-0000-0000-0000-000000000000', p_note: 'prod-anon-definer-check-fabricated', p_amount_drops: 0 } } }],
  ['seal_hive(uuid)', { roles: ['authenticated', 'service_role'], why: 'legacy (pre-volumes) hive-seal RPC, requires a session', probe: { kind: 'call', poison: 'p_hive_id', args: { p_hive_id: 'prod-anon-definer-check-not-a-uuid' } } }],
  ['send_hive(uuid)', { roles: ['authenticated', 'service_role'], why: 'hive-send RPC, requires a session', probe: { kind: 'call', poison: 'p_hive_id', args: { p_hive_id: 'prod-anon-definer-check-not-a-uuid' } } }],

  // -- service_role only: internal/cron, no client role needs direct EXECUTE --
  ['comb_advance_rotation(uuid)', { roles: ['service_role'], why: 'ENG-60 row 1.9a, advance policy wrapper called by the clock (OPS-9) — an authenticated grant would be an unruled organizer force-advance, §1B.31.2', probe: { kind: 'call', poison: 'p_comb_id', args: { p_comb_id: 'prod-anon-definer-check-not-a-uuid' } } }],
  ['advance_due_rotations()', { roles: ['service_role'], why: 'OPS-9 cron-only tick advance, explicit anon+authenticated revoke', probe: { kind: 'unsafe' } }],
  ['comb_subject_gone(uuid,uuid)', { roles: ['service_role'], why: 'ENG-95 shared predicate, called only from other definers — a definer body bypasses the caller EXECUTE check on what it calls', probe: { kind: 'call', poison: 'p_comb_id', args: { p_comb_id: 'prod-anon-definer-check-not-a-uuid', p_subject_id: '00000000-0000-0000-0000-000000000000' } } }],
  ['seal_and_send_rotation(uuid)', { roles: ['service_role'], why: 'ENG-91 cron-only seal-and-send, explicit anon+authenticated revoke', probe: { kind: 'call', poison: 'p_rotation_id', args: { p_rotation_id: 'prod-anon-definer-check-not-a-uuid' } } }],
  ['seal_volume(uuid)', { roles: ['service_role'], why: 'cron/service-only volume seal, explicit anon+authenticated revoke', probe: { kind: 'call', poison: 'p_hive_id', args: { p_hive_id: 'prod-anon-definer-check-not-a-uuid' } } }],
  ['_nectar_send_tip(uuid,uuid,bigint,text,text,text)', { roles: ['service_role'], why: 'ENG-90 internal balanced-transfer helper, called only from definer RPC wrappers', probe: { kind: 'call', poison: 'p_sender_id', args: { p_sender_id: 'prod-anon-definer-check-not-a-uuid', p_recipient_id: '00000000-0000-0000-0000-000000000000', p_amount_drops: 0, p_idempotency_key_prefix: 'prod-anon-definer-check-fabricated', p_memo: 'prod-anon-definer-check-fabricated', p_error_prefix: 'prod-anon-definer-check-fabricated' } } }],

  // -- trigger functions: grant is inert, row still states the true grant --
  ['combs_create_owner_membership()', { roles: ['authenticated', 'service_role'], why: 'trigger, inert; explicit (redundant) authenticated grant, documented', probe: { kind: 'trigger' } }],
  ['comb_members_departure_closes_writing_seat()', { roles: ['authenticated', 'service_role'], why: 'ENG-99 trigger, inert; explicit (redundant) authenticated grant, documented', probe: { kind: 'trigger' } }],
  ['entries_mark_shared()', { roles: ['authenticated', 'service_role'], why: 'trigger, inert; authenticated access is the un-revoked default-privilege grant, no explicit statement', probe: { kind: 'trigger' } }],
  ['enforce_comb_entitlements()', { roles: ['authenticated', 'service_role'], why: 'ENG-85 trigger, inert by direct call; server-owned plan tables are read inside the definer', probe: { kind: 'trigger' } }],
  ['entries_resolve_volume_id()', { roles: ['authenticated', 'service_role'], why: 'trigger, inert; explicit (redundant) authenticated grant, documented', probe: { kind: 'trigger' } }],
  ['handle_new_user()', { roles: ['authenticated', 'service_role'], why: 'trigger, inert; authenticated access is the un-revoked default-privilege grant, no explicit statement', probe: { kind: 'trigger' } }],
  ['private_hives_create_volume_one()', { roles: ['authenticated', 'service_role'], why: 'trigger, inert; explicit (redundant) authenticated grant, documented', probe: { kind: 'trigger' } }],
]);