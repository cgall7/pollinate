import { supabase } from './supabase';
import { HoneycombStore } from './HoneycombStore';

const requireSupabase = () => {
  if (!supabase) throw new Error('Supabase is not configured — check .env');
  return supabase;
};

const requireUserId = async (client) => {
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('Not signed in');
  return user.id;
};

// DES-29 §5 — comb_open_rotation's three refusal shapes are distinguished by
// SQLSTATE/message (unlike COPY-14's entries_insert_own, which shares one
// 42501 across two causes and needs a refetch to tell them apart). Pure and
// network-free on purpose: the caller already has the thrown error.
//
// 23514 alone is NOT the emptyRoster test (Lumen's finding, DES-29 §8
// ratification, 2026-09-04): the migration's own comment (`…0010:59`) says
// 23514 aliases six native CHECK producers on this write path, which is
// exactly why the server attaches `constraint =
// 'comb_open_rotation_enrollable_floor'` rather than trusting the bare
// SQLSTATE — PostgREST does not forward that constraint name to the client,
// so the message is the only distinguishing signal actually reachable here.
// A bare `error.code === '23514'` branch would have rendered "This comb has
// one member" — a false count claim — for any other CHECK violation this
// RPC's write path can raise.
export const classifyMintRefusal = (error) => {
  if (!error) return 'unknown';
  if (error.code === '42501') return 'notOwner';
  if (/enrollable contributors/.test(error.message ?? '')) return 'emptyRoster';
  if (/subject is gone/.test(error.message ?? '')) return 'subjectGone';
  return 'unknown';
};

// The organizer creates the persistent comb and then asks the ONE server-side
// mint to open month one.  No client clock: comb_open_rotation derives the
// first boundary from the cadence stored on the comb.
export const CombStore = {
  // The roster-name read is the existing, membership-scoped definer helper
  // from ENG-58.  Do not join `profiles` here: comb membership is not a
  // friendship and profile RLS intentionally does not widen for it.
  async listMembers(combId) {
    const client = requireSupabase();
    const userId = await requireUserId(client);
    const { data, error } = await client.rpc('comb_co_member_names', { p_comb_id: combId });
    if (error) throw error;
    return (data ?? []).filter((member) => member.profile_id !== userId);
  },

  // DES-29 §8.2 — the mint picker's population, evaluated at tap time:
  // comb members (this specific comb, ENG-58) union the organizer's
  // connections (global, honeycomb). Never global search. Deduped on
  // profile id since a comb member can also be a connection; self already
  // excluded by both sources (listMembers filters it, a connection row is
  // structurally never the caller).
  async listMintCandidates(combId) {
    const [members, connections] = await Promise.all([
      this.listMembers(combId),
      HoneycombStore.listConnections(),
    ]);
    const byId = new Map();
    for (const member of members) byId.set(member.profile_id, member.display_name);
    for (const connection of connections) byId.set(connection.id, connection.display_name);
    return Array.from(byId, ([id, displayName]) => ({ id, displayName }));
  },

  async saveOrganizerName(name) {
    const client = requireSupabase();
    const ownerId = await requireUserId(client);
    const displayName = name.trim();
    if (!displayName) throw new Error('Your name is needed before creating a comb');
    const { error } = await client.from('profiles').update({ display_name: displayName }).eq('id', ownerId);
    if (error) throw error;
    const { error: authError } = await client.auth.updateUser({ data: { display_name: displayName } });
    if (authError) throw authError;
  },

  // DES-29 §8.4 — the two guards hoist here verbatim from the old
  // create-screen write path. They guard the RPC, not any one screen: the
  // pre-launch card's picker keeps them unreachable by construction (self
  // is never in its own population), but a direct caller still gets the
  // named refusal instead of a bare constraint failure.
  async openFirstRotation({ combId, subjectProfileId }) {
    const client = requireSupabase();
    const ownerId = await requireUserId(client);
    if (!subjectProfileId) throw new Error('Choose who this month is for');
    if (subjectProfileId === ownerId) throw new Error('Choose someone else for the first month');

    const { data: rotationId, error: mintError } = await client.rpc('comb_open_rotation', {
      p_comb_id: combId,
      p_subject_profile_id: subjectProfileId,
    });
    if (mintError) throw mintError;
    const { data: rotation, error: rotationError } = await client
      .from('comb_rotations')
      .select('hive_id')
      .eq('id', rotationId)
      .single();
    if (rotationError) throw rotationError;
    return { combId, hiveId: rotation.hive_id };
  },

  // DES-29 §4 (amended 2026-09-04): insert-only. The month-1 mint no longer
  // fires from this call — it fires from the pre-launch organizer card's
  // own affordance (openFirstRotation above), the first moment the ruled
  // population (comb members ∪ connections) isn't vacuous by construction.
  async createComb({ name, cadence = '1 month' }) {
    const client = requireSupabase();
    const ownerId = await requireUserId(client);
    const label = name.trim();
    if (!label) throw new Error('A comb needs a name');

    const { data: comb, error: createError } = await client
      .from('combs')
      .insert({ owner_id: ownerId, name: label, cadence })
      .select('id')
      .single();
    if (createError) throw createError;
    return { combId: comb.id };
  },
};
