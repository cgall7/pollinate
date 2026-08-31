import { supabase } from './supabase';

const requireSupabase = () => {
  if (!supabase) throw new Error('Supabase is not configured — check .env');
  return supabase;
};

export const CombInviteStore = {
  async preview(inviteCode) {
    const { data, error } = await requireSupabase().rpc('comb_preview_by_invite_code', {
      p_invite_code: inviteCode,
    });
    if (error) throw error;
    const row = data?.[0];
    if (!row) return null;
    return {
      combName: row.comb_name,
      inviterName: row.inviter_name,
      subjectName: row.subject_name,
      hasActiveMonth: row.has_active_month,
      memberCount: row.member_count,
    };
  },

  async saveNameAndJoin(inviteCode, displayName) {
    const client = requireSupabase();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('A session is required to join a comb');

    const name = displayName.trim();
    if (!name) throw new Error('A display name is required to join a comb');
    const { error: nameError } = await client.from('profiles').update({ display_name: name }).eq('id', user.id);
    if (nameError) throw nameError;

    const { data: combId, error: joinError } = await client.rpc('comb_join_by_invite_code', {
      p_invite_code: inviteCode,
    });
    if (joinError) throw joinError;

    const { data: rotation, error: rotationError } = await client
      .from('comb_rotations')
      .select('id, hive_id, closes_at')
      .eq('comb_id', combId)
      .is('sealed_at', null)
      .is('voided_at', null)
      .maybeSingle();
    if (rotationError) throw rotationError;
    if (!rotation?.hive_id) throw new Error('This comb does not have an open rotation');

    return {
      combId,
      rotationId: rotation.id,
      hiveId: rotation.hive_id,
      closesAt: rotation.closes_at,
    };
  },
};
