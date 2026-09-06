import { supabase } from './supabase';
import { getAuthRedirectUrl, parseAuthCallbackParams } from './authLinking';
import { appleFullNameToDisplayName } from '../utils/appleName';
import { isPlaceholderName } from '../utils/placeholderName';

const requireSupabase = () => {
  if (!supabase) throw new Error('Supabase is not configured — check .env');
  return supabase;
};

// Adopt the name Apple handed us at first authorization, if it handed us one
// and if nothing better is already stored. Gated on `isPlaceholderName` so the
// ladder holds: a self-chosen name outranks an Apple-provided one.
//
// THIS NEVER THROWS. By the time it runs the person is already signed in, and
// the caller's catch renders "Apple sign-in failed. Try again." — so letting a
// failed name write escape would tell a successfully authenticated user their
// sign-in failed and invite them to repeat the one authorization that would
// have carried the name. A lost name is a bad outcome; a lost name reported as
// a failed sign-in is a worse one.
const adoptAppleName = async (client, userId, fullName) => {
  const displayName = appleFullNameToDisplayName(fullName);
  if (!displayName || !userId) return;
  try {
    const { data: profile, error } = await client
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!isPlaceholderName(profile?.display_name)) return;
    const { error: writeError } = await client
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', userId);
    if (writeError) throw writeError;
  } catch (err) {
    console.warn('Apple name adoption failed; profile keeps its placeholder', err);
  }
};

// The week query's row cap. Exported so the screen can tell "got everything"
// from "hit the cap": the cap is cut on `created_at` while the window is cut
// on `entry_date`, so a full page means the older end of the week may be
// silently missing and the view should say so.
export const WEEK_FEED_LIMIT = 200;

// One share row → the shape FeedCard and the grid mappers consume. Shared
// by both feed queries so the two views can never drift apart on fields.
const toFeedShare = (share, userId) => ({
  id: share.id,
  createdAt: share.created_at,
  authorId: share.user_id,
  isOwn: share.user_id === userId,
  author: share.author,
  content: share.entries?.content,
  entryDate: share.entries?.entry_date,
  paper: share.entries?.paper,
  likeCount: share.likes?.length ?? 0,
  likedByMe: (share.likes ?? []).some((like) => like.user_id === userId),
  commentCount: share.comments?.[0]?.count ?? 0,
});

export const HoneycombStore = {
  // --- Auth -----------------------------------------------------------
  async signUp(email, password, displayName) {
    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    const client = requireSupabase();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const client = requireSupabase();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  },

  // ENG-84 — self-service in-app account deletion (App Store 5.1.1(v)).
  // delete_own_account() (supabase/migrations/20260830000001) does the whole
  // server side in one transaction: hard-deletes unsealed authored entries,
  // ends every hive_contributors membership, tombstones the profile, then
  // deletes the auth.users row outright. That last step means the session's
  // underlying user is gone by the time this RPC returns — `scope: 'local'`
  // clears the client's stored session without calling GoTrue's /logout
  // endpoint, which would otherwise be asking the server to revoke a token
  // for a user that no longer exists.
  async deleteAccount() {
    const client = requireSupabase();
    const { error } = await client.rpc('delete_own_account');
    if (error) throw error;
    await client.auth.signOut({ scope: 'local' });
  },

  // ENG-83 — the no-password path a stranger following a comb invite link
  // (ENG-59) needs: there is no screen anywhere in this flow that could
  // collect a password from someone who has never set one. Supabase emails
  // a link back to `getAuthRedirectUrl()` (src/services/authLinking.js);
  // AuthContext's Linking listener hands the returned URL to
  // `completeSessionFromUrl` below, which is what actually produces the
  // session — `onAuthStateChange` picks it up from there the same way it
  // already does for every other sign-in path, so this function itself
  // returns nothing.
  //
  // `shouldCreateUser: true` (GoTrue's default, made explicit here) is the
  // property that makes this a real alternative to the sign-up form and not
  // just a passwordless sign-IN: a first-time email reaching this function
  // gets an account, not a "no such user" bounce.
  async signInWithOtp(email) {
    const client = requireSupabase();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getAuthRedirectUrl(), shouldCreateUser: true },
    });
    if (error) throw error;
  },

  // The other half of the magic-link round trip — called from
  // AuthContext.js with whatever URL `Linking` handed it (cold-start via
  // `getInitialURL()`, or warm via the `url` event). PKCE's `?code=` is the
  // shape `flowType: 'pkce'` (src/services/supabase.js) produces and the
  // one Apple/Google's in-app browser preview-fetch of the link can't
  // silently consume behind the user's back — a preview fetch of a GET
  // link redeems it, which is exactly what an OTP encoded straight in the
  // link (the old implicit-flow shape) is vulnerable to. The `#access_token`
  // fragment branch is parsed defensively for the same reason
  // `authLinking.js` keeps it: a dashboard-side flow-type mismatch fails
  // loud here rather than silently.
  //
  // Returns `null` (not a throw) for a URL that isn't an auth callback at
  // all — every other `Linking` event this app will ever receive, until
  // ENG-59 adds its own deep link, resolves that way rather than erroring.
  async completeSessionFromUrl(url) {
    const client = requireSupabase();
    const params = parseAuthCallbackParams(url);
    if (!params) return null;

    if (params.code) {
      const { data, error } = await client.auth.exchangeCodeForSession(params.code);
      if (error) throw error;
      return data;
    }

    const { data, error } = await client.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return data;
  },

  // Sign in with Apple's native token exchange (`signInWithIdToken` —
  // requires @supabase/supabase-js >= 2.31, this repo is on 2.109). `token`
  // is `AppleAuthentication.signInAsync()`'s `identityToken`; `nonce` is the
  // RAW nonce Onboarding.js generated before hashing it for Apple (Apple
  // gets the SHA-256 hash so it can't be replayed off the wire, GoTrue gets
  // the raw value so it can verify the hash inside the token itself matches
  // — passing the same value to both would make every check trivially pass
  // regardless of what came back from Apple).
  //
  // `fullName` is `AppleAuthentication.signInAsync()`'s `credential.fullName`,
  // which Apple returns ONLY at first authorization (see
  // `utils/appleName.js`). Capturing it here rather than in Onboarding.js is
  // deliberate: this is the only function that knows the sign-in succeeded and
  // holds the resulting user id, and the name must be adopted inside the same
  // await the caller already has, before `finish()` routes away.
  async signInWithApple(identityToken, nonce, fullName) {
    const client = requireSupabase();
    const { data, error } = await client.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken,
      nonce,
    });
    if (error) throw error;
    await adoptAppleName(client, data?.user?.id, fullName);
    return data;
  },

  // --- Connections ------------------------------------------------------
  async findProfileByEmail(email) {
    const client = requireSupabase();
    const { data, error } = await client.rpc('find_connectable_profile', {
      lookup_email: email.trim().toLowerCase(),
    });
    if (error) throw error;
    return data?.[0] ?? null;
  },

  async sendConnectionRequest(addresseeId) {
    const client = requireSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    const { error } = await client
      .from('honeycomb_connections')
      .insert({ requester_id: user.id, addressee_id: addresseeId });
    if (error) throw error;
  },

  async respondToRequest(connectionId, accept) {
    const client = requireSupabase();
    if (!accept) {
      const { error } = await client.from('honeycomb_connections').delete().eq('id', connectionId);
      if (error) throw error;
      return;
    }
    const { error } = await client
      .from('honeycomb_connections')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', connectionId);
    if (error) throw error;
  },

  // Only the addressee can move a row to 'blocked' (connections_update_addressee
  // policy) — this only ever fires from an incoming request, never against an
  // existing accepted connection you didn't originate. The row stays (not
  // deleted), so `unique_pair` blocks the same requester from re-adding you.
  async blockRequest(connectionId) {
    const client = requireSupabase();
    const { error } = await client
      .from('honeycomb_connections')
      .update({ status: 'blocked', responded_at: new Date().toISOString() })
      .eq('id', connectionId);
    if (error) throw error;
  },

  async listIncomingRequests() {
    const client = requireSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    const { data, error } = await client
      .from('honeycomb_connections')
      .select('id, created_at, requester:profiles!honeycomb_connections_requester_id_fkey(id, display_name)')
      .eq('addressee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async listConnections() {
    const client = requireSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    const { data, error } = await client
      .from('honeycomb_connections')
      .select(
        'id, requester_id, addressee_id, requester:profiles!honeycomb_connections_requester_id_fkey(id, display_name), addressee:profiles!honeycomb_connections_addressee_id_fkey(id, display_name)'
      )
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    if (error) throw error;
    return (data ?? []).map((row) => (row.requester_id === user.id ? row.addressee : row.requester));
  },

  // Project 6.7 — facts, not derived states (see the migration comment for
  // why). Each row is { member_id, display_name, avatar_url, last_entry_date,
  // last_note_received_at } for one accepted connection. Callers derive
  // `blooming` with src/utils/hiveState.js; `active` was struck from MVP1
  // entirely (R59, thread e10d0fed) — the Today comb's own membership filter
  // already is "posted today," so a treatment true of every cell it can draw
  // is not a signal. last_entry_date still ships as a plain fact (e.g. "last
  // shared N days ago"), just not as an Active-state input.
  async listHiveState() {
    const client = requireSupabase();
    const { data, error } = await client.rpc('list_hive_state');
    if (error) throw error;
    return data ?? [];
  },

  // --- Entries & sharing -----------------------------------------------
  // Takes the id of an existing entries row (EntryStore.saveEntry already
  // wrote it) and marks it shared, rather than inserting a second row for
  // the same day. Used to insert a fresh entries row from the passed-in
  // text/theme — every share doubled that day's entry (one private, one
  // shared-but-mislabeled-private), which inflated getAllEntries()' count
  // for streak/Recap/Wrapped and left two cards for the same gratitude
  // once a real 'entries.theme' column existed to tell them apart (thread
  // 19e90cf8, Sage/Bumble, 2026-08-13). visibility: 'shared' also mirrors
  // what the shares row already means, per the entries_hive_visibility
  // migration comment.
  async shareEntry({ entryId }) {
    const client = requireSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();

    const { data: entry, error: updateError } = await client
      .from('entries')
      .update({ visibility: 'shared' })
      .eq('id', entryId)
      .eq('user_id', user.id)
      .select()
      .single();
    if (updateError) throw updateError;

    const { error: shareError } = await client.from('shares').insert({ entry_id: entry.id, user_id: user.id });
    if (shareError) throw shareError;
  },

  // Was `.from('entries').select('id, shares(id)').eq('entry_date', date)
  // .limit(1)` with no `.order()` — correct only while one entry per day
  // was guaranteed. P0-2 (entries_hive_visibility migration) lifts that
  // guarantee, so `.limit(1)` reads an unordered index and returns
  // whichever row Postgres happens to store first — not random, reliably
  // wrong: with no journal-then-share write order, that's consistently
  // the day's first-inserted row, not the shared one (Sage measured 12/12
  // runs, thread 19e90cf8, 2026-08-13). has_shared_date checks existence
  // directly instead of reading one row's shares embed.
  async hasSharedDate(date) {
    const client = requireSupabase();
    const { data, error } = await client.rpc('has_shared_date', { p_date: date });
    if (error) throw error;
    return Boolean(data);
  },

  // --- Feed ---------------------------------------------------------------
  async listFeed() {
    const client = requireSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    const { data, error } = await client
      .from('shares')
      .select(
        'id, created_at, user_id, author:profiles(display_name, avatar_url), entries(content, entry_date, paper), likes(user_id), comments(count)'
      )
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []).map((share) => toFeedShare(share, user.id));
  },

  // 8b.7 — hive_send_events (20260819000002) is a separate table from
  // `shares` on purpose (see the migration comment): reusing shares would
  // reopen the leak the entries_update_own mirror guard exists to close.
  // Separate table means separate query; `kind: 'send'` is how
  // HoneycombTab tells this card apart from a FeedCard share when merging
  // the two lists for render.
  async listSendEvents() {
    const client = requireSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    const { data, error } = await client
      .from('hive_send_events')
      .select(
        'id, created_at, sender_id, recipient_id, sender:profiles!hive_send_events_sender_id_fkey(display_name, avatar_url), recipient:profiles!hive_send_events_recipient_id_fkey(display_name, avatar_url)'
      )
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      kind: 'send',
      id: row.id,
      createdAt: row.created_at,
      isSender: row.sender_id === user.id,
      isRecipient: row.recipient_id === user.id,
      senderName: row.sender?.display_name ?? 'Someone',
      senderAvatarUrl: row.sender?.avatar_url,
      recipientName: row.recipient?.display_name ?? 'Someone',
    }));
  },

  // The last-7-days window for the hive's week view. Filters on
  // `entries.entry_date` — the day the gratitude is *about* — because
  // that's the key the week view groups under; filtering on `created_at`
  // instead could let a share slip into the window while its day header
  // falls outside it. The `!inner` join is what makes the `.gte()` prune
  // parent share rows rather than just nulling out the embed.
  async listFeedSince(sinceISO) {
    const client = requireSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    const { data, error } = await client
      .from('shares')
      .select(
        'id, created_at, user_id, author:profiles(display_name, avatar_url), entries!inner(content, entry_date, paper), likes(user_id), comments(count)'
      )
      .gte('entries.entry_date', sinceISO)
      .order('created_at', { ascending: false })
      .limit(WEEK_FEED_LIMIT);
    if (error) throw error;
    return (data ?? []).map((share) => toFeedShare(share, user.id));
  },

  async toggleLike(shareId, currentlyLiked) {
    const client = requireSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (currentlyLiked) {
      const { error } = await client.from('likes').delete().eq('share_id', shareId).eq('user_id', user.id);
      if (error) throw error;
    } else {
      const { error } = await client.from('likes').insert({ share_id: shareId, user_id: user.id });
      if (error) throw error;
    }
  },

  async listComments(shareId) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('comments')
      .select('id, content, created_at, author:profiles(display_name)')
      .eq('share_id', shareId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async addComment(shareId, content) {
    const client = requireSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    const { error } = await client.from('comments').insert({ share_id: shareId, user_id: user.id, content });
    if (error) throw error;
  },
};
