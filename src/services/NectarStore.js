import { supabase } from './supabase';
import { isPlaceholderName } from '../utils/placeholderName';

// DES-28 Deliverable 7's bootstrap point (D3, Sage's ruling 2026-08-26) —
// the client half of 19a's consent + starter-grant RPC
// (bumble/nectar-sim-service @ 3a17ca2, migration 20260826000005).
const requireSupabase = () => {
  if (!supabase) throw new Error('Supabase is not configured — check .env');
  return supabase;
};

const requireUserId = async (client) => {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error('Not signed in');
  return user.id;
};

// Mirrors HiveStore.js's `resolveDirectName` contract exactly (same two
// producers, same shape): `names` is keyed by every id the batch join
// ANSWERED, not every id it was asked for. A missing key is a row RLS or a
// deleted profile dropped silently — that's the permission word, 'Someone'.
// A present key whose value is placeholder-class (`isPlaceholderName` — an
// unrepaired `handle_new_user` default) is a row the read reached with
// nothing to show, so it goes absent (`null`) instead of misreporting a
// name gap as an authorization gap.
const resolveDirectName = (names, id) => {
  if (!names.has(id)) return 'Someone';
  const name = names.get(id);
  return isPlaceholderName(name) ? null : name;
};

export const NectarStore = {
  // The consent row itself, or `null` — `hasNectarConsent`'s input shape
  // (constants/nectar.js), read straight off `nectar_consents`.
  // `nectar_consents_select_own` already scopes this to the caller; the
  // `.eq` below is defense in depth, same convention as HiveStore's
  // accessors over RLS-protected tables.
  async getConsent() {
    const client = requireSupabase();
    const userId = await requireUserId(client);
    const { data, error } = await client
      .from('nectar_consents')
      .select('consented_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // The consent sheet's affirmative. `consent_to_nectar()` returns an ARRAY
  // (it's a `returns table` function) — nectar.js's C5 pins the trap of
  // handing that straight to `hasNectarConsent`, so this unwraps to the one
  // row before returning it.
  async consentToNectar() {
    const client = requireSupabase();
    const { data, error } = await client.rpc('consent_to_nectar');
    if (error) throw error;
    return data?.[0] ?? null;
  },

  // ENG-65's missing half: what the honey ladder reads.
  //
  // `user_nectar_balances` is a security_invoker view (20260826000006:297)
  // over `ledger_account_balances`, whose RLS policy is
  // `ledger_balances_select_own` — so this returns the caller's row and
  // nothing else, and the `.eq` is the same defense-in-depth the accessors
  // above use.
  //
  // NO ROW IS NOT ZERO, and the difference is §23's whole point. The view is
  // an inner join over `ledger_accounts`, so a user with no ledger accounts
  // yet produces NO ROW rather than a zero — and a user has no accounts
  // until `consent_to_nectar()` provisions them. `null` here therefore means
  // UNKNOWN-or-unprovisioned and `0` means a real, read, empty wallet. The
  // caller must not collapse them: rendering an empty vessel for a balance
  // that failed to load is the §23.1 defect ("empty is a positive claim")
  // exactly.
  async getBalanceDrops() {
    const client = requireSupabase();
    const userId = await requireUserId(client);
    const { data, error } = await client
      .from('user_nectar_balances')
      .select('available_sats')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    // 1 drop = 1 sat, exactly — the sats override (20260826000006:301)
    // deleted the conversion function rather than replacing it, so there is
    // no rate to apply and no rate to get wrong.
    return Number(data.available_sats);
  },

  // The zap itself. `zapId` is the caller's idempotency handle (utils/uuid),
  // generated ONCE per attempt and REUSED across retries of that attempt —
  // a fresh id on retry would record a second zap, which is the failure the
  // handle exists to prevent.
  //
  // Returns the ledger transaction id. Throws with the server's message on
  // refusal; `record_zap` distinguishes 'insufficient nectar (N drops
  // available, M needed)' from 'target not found' and the caller decides how
  // much of that a user should see.
  async recordZap({ zapId, targetKind, targetId, amountDrops }) {
    const client = requireSupabase();
    const { data, error } = await client.rpc('record_zap', {
      p_zap_id: zapId,
      p_target_kind: targetKind,
      p_target_id: targetId,
      p_amount_drops: amountDrops,
    });
    if (error) throw error;
    return data ?? null;
  },

  // ENG-90 is deliberately not a target-kind extension of recordZap.  A
  // comb note persists its words atomically with the ledger transfer, so it
  // owns its contract and its idempotency handle.
  async sendCombNectarNote({ sendId, combId, recipientId, note, amountDrops }) {
    const client = requireSupabase();
    const { data, error } = await client.rpc('send_comb_nectar_note', {
      p_send_id: sendId,
      p_comb_id: combId,
      p_recipient_id: recipientId,
      p_note: note,
      p_amount_drops: amountDrops,
    });
    if (error) throw error;
    return data?.[0] ?? null;
  },

  // Notes are visible only to their sender or recipient under the RPC/table
  // policy. The compose UI uses this canonical read after a replay mismatch
  // instead of telling someone that a request definitely did not send.
  async listCombNectarNotes(combId) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('comb_nectar_notes')
      .select(
        `
          id,
          transaction_id,
          comb_id,
          sender_id,
          recipient_id,
          note_text,
          amount_drops,
          created_at
        `,
      )
      .eq('comb_id', combId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  // R-NT-3 (GUIDES/POLLINATE_OPENDAY_NECTAR_RECUT_SPEC.md, Part 3): the
  // Nectar tab's ledger, merged newest-first across the two tables that
  // carry a gift between people. Ruled correction at the mock round — two
  // tables, not three: `ledger_transactions` (the starter grant, `funding`
  // type) renders nowhere, because a grant is not a gift and has no person
  // (nectar.js's own arrival note already rules it announces nothing).
  //
  // `id` is the shared `transaction_id`, not either table's own primary
  // key — `nectar_zaps.id` and `comb_nectar_notes.id` are separate
  // idempotency-handle spaces (client-generated per attempt), so only the
  // ledger transaction each row is unique-FK'd to is safe as a cross-table
  // list key.
  //
  // `nectar_zaps_select_own` / `comb_nectar_notes_select_sender_or_recipient`
  // already scope both reads to the caller as sender or recipient; the two
  // `.or()` filters are defense in depth, same convention as every other
  // accessor here.
  async listNectarEvents() {
    const client = requireSupabase();
    const userId = await requireUserId(client);

    const [{ data: zaps, error: zapsError }, { data: notes, error: notesError }] = await Promise.all([
      client
        .from('nectar_zaps')
        .select('transaction_id, sender_id, recipient_id, amount_drops, created_at')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`),
      client
        .from('comb_nectar_notes')
        .select('transaction_id, sender_id, recipient_id, note_text, amount_drops, created_at')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`),
    ]);
    if (zapsError) throw zapsError;
    if (notesError) throw notesError;

    const rows = [...(zaps ?? []), ...(notes ?? [])];
    if (rows.length === 0) return [];

    const counterpartyIds = [...new Set(rows.map((r) => (r.sender_id === userId ? r.recipient_id : r.sender_id)))];
    const { data: profiles, error: profilesError } = await client
      .from('profiles')
      .select('id, display_name')
      .in('id', counterpartyIds);
    if (profilesError) throw profilesError;
    const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

    return rows
      .map((r) => {
        const isSender = r.sender_id === userId;
        return {
          id: r.transaction_id,
          direction: isSender ? 'to' : 'from',
          counterpartyName: resolveDirectName(names, isSender ? r.recipient_id : r.sender_id),
          amountDrops: Number(r.amount_drops),
          noteText: r.note_text ?? null,
          createdAt: r.created_at,
        };
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  },
};
