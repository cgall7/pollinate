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
