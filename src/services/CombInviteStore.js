import { supabase } from './supabase';
import { Analytics } from './Analytics';

const requireSupabase = () => {
  if (!supabase) throw new Error('Supabase is not configured — check .env');
  return supabase;
};

export const CombInviteStore = {
  async getJoinerProfile() {
    const client = requireSupabase();
    const { data: { user }, error } = await client.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error('A session is required to join a comb');
    const { data, error: profileError } = await client.from('profiles').select('display_name').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    return data;
  },
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

    const name = displayName?.trim();
    if (name) {
      const { error: nameError } = await client.from('profiles').update({ display_name: name }).eq('id', user.id);
      if (nameError) throw nameError;
    }

    const { data: combId, error: joinError } = await client.rpc('comb_join_by_invite_code', {
      p_invite_code: inviteCode,
    });
    if (joinError) throw joinError;

    // ENG-89 C4 — "willingness to pay at the member cap," §6. ENG-85's
    // entitlement trigger (enforce_comb_entitlements) already ships the
    // mechanism that would enforce a 5-member free cap via
    // comb_entitlement_plans.max_comb_members / combs.member_limit_override
    // — but both plan limits ship NULL (unlimited) per §8.5, so the trigger
    // never actually raises today. This is the shadow event for the same
    // boundary: the moment the comb crosses the size the cap would sit at,
    // fired off the join that produced it, so it can never fire more than
    // once per comb (comb_member_count only equals 5 on the join that
    // takes it from 4 to 5). Best-effort: a count RPC failure here must not
    // fail the join itself, which already succeeded.
    try {
      const { data: memberCount } = await client.rpc('comb_member_count', { p_comb_id: combId });
      if (memberCount === 5) {
        Analytics.track('comb_member_cap_reached', { combId });
      }
    } catch {
      // best-effort instrumentation only — see comment above
    }

    const { data: rotation, error: rotationError } = await client
      .from('comb_rotations')
      .select('id, hive_id, closes_at')
      .eq('comb_id', combId)
      .is('sealed_at', null)
      .is('voided_at', null)
      .maybeSingle();
    if (rotationError) throw rotationError;

    // COPY-6 rider 1 (Lumen, 2026-09-03): AN ABSENT OPEN ROTATION AFTER A
    // SUCCESSFUL JOIN IS A SUCCESS, NOT A FAILURE. `comb_join_by_invite_code`
    // inserts the `comb_members` row gated on nothing but an invalid code and
    // a previous removal (`20260831000001:26-29`); only the
    // `hive_contributors` enrollment is gated on a rotation's hive existing
    // (`:40-45`), and the RPC raises nothing when there is no rotation. So
    // the membership is committed on the server by the time this query runs,
    // and the old throw here MINTED A CLIENT-SIDE FAILURE FOR A REAL JOIN —
    // reported to the joiner as "we couldn't join this comb," with a row in
    // the table saying otherwise. The mint's roster snapshot carries them
    // into the next month (`20260830000011:89-101`), so this is a legal
    // steady state, not a half-finished one.
    //
    // Nulls rather than a missing key: the caller is told there is no
    // rotation, which is a different fact from a shape that forgot to
    // include one. `CombInvite.js`'s join handler navigates to Today either
    // way — and Today can now represent this member
    // (`HiveStore.listPendingCombMemberships`), which is what makes the
    // navigation honest rather than a landing on an empty screen.
    return {
      combId,
      rotationId: rotation?.id ?? null,
      hiveId: rotation?.hive_id ?? null,
      closesAt: rotation?.closes_at ?? null,
    };
  },
};
