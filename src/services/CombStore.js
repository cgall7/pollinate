import { supabase } from './supabase';

const requireSupabase = () => {
  if (!supabase) throw new Error('Supabase is not configured — check .env');
  return supabase;
};

const requireUserId = async (client) => {
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('Not signed in');
  return user.id;
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
  async openFirstRotation({ combId, subjectProfileId }) {
    const client = requireSupabase();
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

  async createComb({ name, subjectProfileId, cadence = '1 month' }) {
    const client = requireSupabase();
    const ownerId = await requireUserId(client);
    const label = name.trim();
    if (!label) throw new Error('A comb needs a name');
    if (!subjectProfileId) throw new Error('Choose who this month is for');
    if (subjectProfileId === ownerId) throw new Error('Choose someone else for the first month');

    const { data: comb, error: createError } = await client
      .from('combs')
      .insert({ owner_id: ownerId, name: label, cadence })
      .select('id')
      .single();
    if (createError) throw createError;

    try {
      return await this.openFirstRotation({ combId: comb.id, subjectProfileId });
    } catch (error) {
      error.combId = comb.id;
      throw error;
    }
  },
};
