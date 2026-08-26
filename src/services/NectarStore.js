import { supabase } from './supabase';

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
};
