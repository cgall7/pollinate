import { supabase } from './supabase';
import { Analytics } from './Analytics';

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

    // ENG-89 C4 — "willingness to pay at ... the second-comb moment," §6.
    // ENG-85's entitlement trigger (enforce_comb_entitlements, on
    // comb_members insert) already ships the mechanism for this exact
    // boundary — it counts the writer's OTHER active comb_members rows
    // (any comb they write in, not just ones they own) against
    // max_active_combs_written_in — but that plan limit ships NULL
    // (unlimited) per §8.5, so the trigger never actually raises. This
    // mirrors its count precisely (not `combs.owner_id`, which would miss
    // someone who is a plain contributor elsewhere becoming an owner for
    // the first time) so the shadow event fires at the same boundary the
    // real cap will once §4.3 flips the limit on. Read BEFORE the insert
    // below — the new comb's own comb_members row (inserted by the
    // combs-insert trigger) does not exist yet at read time, so it can
    // never count itself.
    const { count: priorWriterCombCount, error: priorWriterError } = await client
      .from('comb_members')
      .select('comb_id', { count: 'exact', head: true })
      .eq('profile_id', ownerId)
      .is('removed_at', null);
    if (priorWriterError) throw priorWriterError;

    const { data: comb, error: createError } = await client
      .from('combs')
      .insert({ owner_id: ownerId, name: label, cadence })
      .select('id')
      .single();
    if (createError) throw createError;

    if ((priorWriterCombCount ?? 0) >= 1) {
      Analytics.track('comb_second_created', { combId: comb.id });
    }

    try {
      return await this.openFirstRotation({ combId: comb.id, subjectProfileId });
    } catch (error) {
      error.combId = comb.id;
      throw error;
    }
  },
};
