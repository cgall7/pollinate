import { supabase } from './supabase';
import { toISODate } from '../utils/dateRanges';

// Private Hives — the client half. Until this file, `private_hives` had a
// full server side (six migrations, live in production) and ZERO readers or
// writers anywhere in `src/`: the hero was a room with no door.
//
// A separate module from EntryStore on purpose. EntryStore's header says it
// only ever touches the personal journal — every one of its six accessors
// carries `.is('hive_id', null)` — and that a hive's rows "will add
// hive-scoped rows later through different call sites". This module is that
// call site (8b.3), not a widening of that one. Hive entries stay in the
// same `entries` table (P0-2's one-date-ordered-set ruling) but are read and
// written exclusively through the methods below.
//
// A separate module from HoneycombStore for the same reason its RLS is
// different: every other table in this schema models a relationship between
// two accounts and its policies are mutual. A private hive is the schema's
// first OWNED entity — owner only, on every action
// (20260815000001_private_hives.sql). Putting it beside the connection graph
// would file it as a social object, which is exactly what it is not.
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

// GUIDES/PRIVATE_HIVE_DESIGN_LANGUAGE.md §1 — the four selectable ids the
// create-flow theme picker and 20260817000002's check constraint both agree
// on. `golden-honey` is not one of them — §1's own note reserves it for the
// sealed-state visual (§9's wax seal badge), never a cover a hive is created
// with.
export const COVER_THEMES = ['sunlit-honey', 'wildflower', 'starlight', 'cream-gold'];
export const REVIEW_CADENCES = ['monthly', 'yearly', 'manual'];
const DEFAULT_COVER_THEME = 'sunlit-honey';
const DEFAULT_REVIEW_CADENCE = 'yearly';

// `authorId` is `entries.user_id` — RLS-readable by the hive subject via
// `entries_select_as_hive_subject` regardless of who wrote the row (DES-21
// §2 site #7: this mapper used to discard it). Not rendered anywhere yet —
// DES-21 §4's signature waits on `entries.author_name_at_seal` (Sage's §8
// ruling, thread b4533a52) before a NAME can join it.
const toHiveEntry = (row) => ({
  id: row.id,
  hiveId: row.hive_id,
  date: row.entry_date,
  text: row.content,
  theme: row.theme,
  savedAt: row.created_at,
  paper: row.paper,
  authorId: row.user_id,
});

export const HiveStore = {
  // The complete creation act against today's schema (§30.9.3): a hive IS
  // its subject's name plus its owner, plus (as of 20260817000002) the
  // cover theme and review cadence 8b.2's flow collects. `subject_profile_id`
  // stays null — it is only ever set when the subject is themselves a
  // registered user, and the Who beat's subject (a child, a parent, a
  // friend) usually has no account and no row anywhere in this schema.
  //
  // No entry is filed into the hive here — the Who beat (Onboarding.js)
  // creates the hive with a bare name and no theme/cadence choice, so both
  // params default rather than require a call-site update there.
  //
  // `isCollective` defaults to false — the unmarked, existing path (a solo
  // hive) stays the default for every caller that doesn't opt in. It is
  // written once, here, because 20260827000001's trigger makes
  // `is_collective` immutable in both directions the instant the row exists
  // — there is no follow-up call that could set it later. Returned as
  // `isCollective` on the created row so CreateHive's flow can decide,
  // without a second read, whether to route into InviteContributor.
  async createHive(
    subjectName,
    { coverTheme = DEFAULT_COVER_THEME, reviewCadence = DEFAULT_REVIEW_CADENCE, isCollective = false } = {}
  ) {
    const client = requireSupabase();
    const ownerId = await requireUserId(client);
    const name = subjectName.trim();
    // `subject_name text not null` — an empty label is not a hive with a
    // blank name, it is the decline, and the decline writes nothing.
    if (!name) throw new Error('A hive needs a subject name');
    if (!COVER_THEMES.includes(coverTheme)) throw new Error(`Unknown cover theme: ${coverTheme}`);
    if (!REVIEW_CADENCES.includes(reviewCadence)) throw new Error(`Unknown review cadence: ${reviewCadence}`);

    const { data, error } = await client
      .from('private_hives')
      .insert({
        owner_id: ownerId,
        subject_name: name,
        cover_theme: coverTheme,
        review_cadence: reviewCadence,
        is_collective: isCollective,
      })
      .select('id, subject_name, cover_theme, review_cadence, sealed_at, created_at, is_collective')
      .single();
    if (error) throw error;
    return { ...data, isCollective: data.is_collective };
  },

  // Every hive the signed-in user owns, most recently created first, each
  // with its entry count — the Today-tab shelf and the create-flow's "0
  // memories" preview both need the count without a second round trip per
  // card. `private_hives_select_own` (owner only) is the sole authorization
  // surface; the `.eq('owner_id', ownerId)` below is defense in depth, same
  // pattern EntryStore's accessors already use over RLS.
  async listHives() {
    const client = requireSupabase();
    const ownerId = await requireUserId(client);
    const { data: hives, error } = await client
      .from('private_hives')
      .select('id, subject_name, cover_theme, review_cadence, sealed_at, created_at')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!hives || hives.length === 0) return [];

    const { data: entryRows, error: countError } = await client
      .from('entries')
      .select('hive_id')
      .eq('user_id', ownerId)
      .not('hive_id', 'is', null);
    if (countError) throw countError;

    const counts = new Map();
    for (const row of entryRows ?? []) {
      counts.set(row.hive_id, (counts.get(row.hive_id) ?? 0) + 1);
    }

    return hives.map((h) => ({
      id: h.id,
      subjectName: h.subject_name,
      coverTheme: h.cover_theme,
      reviewCadence: h.review_cadence,
      sealedAt: h.sealed_at,
      createdAt: h.created_at,
      entryCount: counts.get(h.id) ?? 0,
    }));
  },

  // Carries subject_profile_id + sent_at (beyond what listHives needs) —
  // HiveDetailScreen's seal/send footer (Design Language §5-6) has to
  // derive "has a subject" and "already sent" from this single fetch.
  //
  // `is_collective` rides along too (20260827000001) — HiveDetailScreen
  // needs it to decide whether the roster row and the "+ Invite a writer"
  // affordance render at all. Owner-only, same as every other field here:
  // `.eq('owner_id', ownerId)` is defense in depth over
  // `private_hives_select_own`, which the same migration widened to also
  // admit an active contributor — a contributor calling this method gets
  // null, not someone else's row, because the owner filter still applies
  // client-side. Contributors read the hive through `getContributingHive`
  // below instead, which is the intentionally different (non-owner) shape.
  async getHive(hiveId) {
    const client = requireSupabase();
    const ownerId = await requireUserId(client);
    const { data, error } = await client
      .from('private_hives')
      .select(
        'id, subject_name, subject_profile_id, cover_theme, review_cadence, sealed_at, sent_at, created_at, is_collective'
      )
      .eq('owner_id', ownerId)
      .eq('id', hiveId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      subjectName: data.subject_name,
      subjectProfileId: data.subject_profile_id,
      coverTheme: data.cover_theme,
      reviewCadence: data.review_cadence,
      sealedAt: data.sealed_at,
      sentAt: data.sent_at,
      createdAt: data.created_at,
      isCollective: data.is_collective,
    };
  },

  // §5 Screen 3's "Seal This Keepsake" CTA. SECURITY DEFINER RPC
  // (20260819000003) does the sealed_at set + private->packaged entry flip
  // in one transaction — see that migration for why a client-side pair of
  // writes can't be trusted to do the same thing atomically. Postgres error
  // text (owner/already-sealed) passes through `error.message` unchanged;
  // callers show it as-is rather than re-deriving the same two cases.
  async sealHive(hiveId) {
    const client = requireSupabase();
    const { error } = await client.rpc('seal_hive', { p_hive_id: hiveId });
    if (error) throw error;
  },

  // §6 Screen 2's "Send Keepsake" CTA. `send_hive` (20260819000001) is the
  // one existing RPC this wraps — was already live and correct, just never
  // had a caller (the gap this whole thread's Slice 1 review found).
  async sendHive(hiveId) {
    const client = requireSupabase();
    const { error } = await client.rpc('send_hive', { p_hive_id: hiveId });
    if (error) throw error;
  },

  // Chronological entry list for one hive, most recent first (Design
  // Language §3's Entry List Screen). Scoped to `hive_id = $1` — never
  // `is('hive_id', null)` — that is the entire point of this being a
  // separate module from EntryStore.
  async getHiveEntries(hiveId) {
    const client = requireSupabase();
    const userId = await requireUserId(client);
    const { data, error } = await client
      .from('entries')
      .select()
      .eq('user_id', userId)
      .eq('hive_id', hiveId)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toHiveEntry);
  },

  // No one-row-per-day dedupe — `entries_one_journal_per_day`'s unique
  // index is `where hive_id is null` on purpose (20260815000001's own
  // note), so a hive is its own per-day space with no such cap.
  //
  // This call does not check sealedAt itself — `entries_insert_own`
  // (20260815000005) rejects the write at the database once a hive is
  // sealed, with `and h.sealed_at is null` in its WITH CHECK. That refusal
  // is a standard Postgres RLS violation (SQLSTATE 42501), not a network
  // failure — callers must gate the UI (HiveDetailScreen hides "+ Add
  // Entry" once `sealedAt` is set) and must not report a 42501 the way
  // they'd report a dropped connection.
  // `paper` defaults to null (Cream) — see EntryStore.saveEntry's comment.
  async addHiveEntry(hiveId, date, text, themeTag, paper = null) {
    const client = requireSupabase();
    const userId = await requireUserId(client);
    const body = text.trim();
    if (!body) throw new Error('An entry needs some text');

    const { data, error } = await client
      .from('entries')
      .insert({ user_id: userId, hive_id: hiveId, content: body, entry_date: toISODate(date), theme: themeTag, paper })
      .select()
      .single();
    if (error) throw error;
    return toHiveEntry(data);
  },

  // Invite one connection onto the roster (POLLINATE_MULTIWRITER_COPY_VOCAB
  // §4.2). `hive_contributors_insert_owner` (20260827000001) is the actual
  // gate — owner only, only into an `is_collective` hive, and rejects
  // `profileId` if it is the hive's current `subject_profile_id` — so this
  // call does not re-check any of that client-side and does not swallow the
  // 42501 that comes back if it's ever wrong, same posture as
  // `addHiveEntry`'s sealed-hive refusal above. InviteContributor.js still
  // excludes the subject from its candidate list before this is ever
  // called — the copy doc's own ruling: "the invite picker excludes the
  // subject client-side; the DB guard is the backstop," not the reverse.
  async inviteContributor(hiveId, profileId) {
    const client = requireSupabase();
    const ownerId = await requireUserId(client);
    const { error } = await client
      .from('hive_contributors')
      .insert({ hive_id: hiveId, profile_id: profileId, invited_by: ownerId });
    if (error) throw error;
  },

  // The roster, active members only (`removed_at is null`) — both the
  // owner's HiveDetail roster row and a contributor's own writing screen
  // read this, so it is written generically rather than assuming an owner
  // caller. `hive_contributors_select` (20260827000001) already scopes this
  // to the owner or an active contributor; a stranger gets zero rows back
  // rather than an error, same shape as every other RLS-backed list here.
  //
  // Profile names batch-joined, 'Someone' fallback — a contributor is not
  // necessarily connected to every other contributor on the same hive
  // (this table's roster is a hive-scoped graph, not the honeycomb
  // connection graph), so `profiles_select_connections` can drop a row
  // silently the same way `listReceivedPackages` below already documents.
  async getHiveContributors(hiveId) {
    const client = requireSupabase();
    const { data: rows, error } = await client
      .from('hive_contributors')
      .select('profile_id')
      .eq('hive_id', hiveId)
      .is('removed_at', null);
    if (error) throw error;
    if (!rows || rows.length === 0) return [];

    const profileIds = [...new Set(rows.map((r) => r.profile_id))];
    const { data: profiles } = await client.from('profiles').select('id, display_name').in('id', profileIds);
    const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

    return rows.map((r) => ({ profileId: r.profile_id, name: names.get(r.profile_id) || 'Someone' }));
  },

  // Every profile_id that has ever occupied a roster row on this hive,
  // active or removed. Distinct from `getHiveContributors` above: this is
  // an exclusion set for the invite picker, not a display roster, so it
  // does not filter `removed_at is null` and does not join profile names.
  // `hive_contributors`'s PK is `(hive_id, profile_id)` and
  // `hive_contributors_removed_at_immutable_trigger` (20260827000001) means
  // a removed row can never be re-inserted -- excluding it here isn't just
  // tidiness, an invite attempt against a removed profile_id is a
  // guaranteed 23505.
  async getHiveContributorProfileIds(hiveId) {
    const client = requireSupabase();
    const { data: rows, error } = await client
      .from('hive_contributors')
      .select('profile_id')
      .eq('hive_id', hiveId);
    if (error) throw error;
    return (rows ?? []).map((r) => r.profile_id);
  },

  // DES-16 §1a(b) — which of the user's hives already hold a copy of the
  // entry dated `entryDateKey`, so the file-to-hive picker can tag a row
  // FILED instead of letting a second tap write a duplicate into a keepsake
  // volume. One round trip rather than N calls to getHiveEntries (one per
  // hive, all-dates). `entryDateKey` is expected to already be the
  // 'YYYY-MM-DD' string off an entry row (e.g. `entry.date`) — passed
  // straight through rather than re-derived via `toISODate`, which is the
  // exact westward mis-parse `addHiveEntry`'s own caller has to route
  // around (§1a(a)).
  async getFiledHiveIds(entryDateKey) {
    const client = requireSupabase();
    const userId = await requireUserId(client);
    const { data, error } = await client
      .from('entries')
      .select('hive_id')
      .eq('user_id', userId)
      .eq('entry_date', entryDateKey)
      .not('hive_id', 'is', null);
    if (error) throw error;
    return new Set((data ?? []).map((row) => row.hive_id));
  },

  // Hives the signed-in user is an ACTIVE contributor on, not an owner of —
  // TodayTab's "WRITING WITH OTHERS" shelf. Modeled on `listReceivedPackages`
  // below, not on `listHives` above: this is the same shape of problem (read
  // someone else's hive, batch-join their name, 'Someone' fallback), not the
  // owner's shape. The `hive_contributors!inner(...)` embed is what makes
  // this a contributor query instead of a `private_hives_select_own`-owner
  // query returning nothing — an inner join means a hive with no matching
  // roster row for this user is dropped by Postgres before RLS is even
  // asked, rather than relying on RLS alone to filter rows this user can
  // technically also see as owner of a DIFFERENT hive.
  //
  // No `entryCount` — unlike `listHives`, a contributor has no visibility
  // into anyone else's entries and only reads their own here too (entries
  // SELECT is unwidened, per the migration's OPEN-1 note), so a per-hive
  // count of "your own entries in a hive you don't own" isn't the number
  // this shelf should be answering anyway. `ownerName` instead — the "whose
  // is it" fact this list needs that `listHives` never did.
  async listContributingHives() {
    const client = requireSupabase();
    const contributorId = await requireUserId(client);
    const { data: hives, error } = await client
      .from('private_hives')
      .select('id, owner_id, subject_name, cover_theme, sealed_at, hive_contributors!inner(profile_id, removed_at)')
      .eq('hive_contributors.profile_id', contributorId)
      .is('hive_contributors.removed_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!hives || hives.length === 0) return [];

    // Same batched-join, 'Someone'-fallback convention as
    // `listReceivedPackages` — the owner may not be a honeycomb connection
    // of every contributor they invite.
    const ownerIds = [...new Set(hives.map((h) => h.owner_id))];
    const { data: owners } = await client.from('profiles').select('id, display_name').in('id', ownerIds);
    const ownerNames = new Map((owners ?? []).map((p) => [p.id, p.display_name]));

    return hives.map((h) => ({
      id: h.id,
      subjectName: h.subject_name,
      coverTheme: h.cover_theme,
      sealedAt: h.sealed_at,
      ownerName: ownerNames.get(h.owner_id) || 'Someone',
    }));
  },

  // One contributing hive's header facts, for ContributingHive.js — same
  // inner-join-as-active-contributor shape as `listContributingHives`
  // above, single row. `.maybeSingle()` because the caller could be a
  // removed contributor following a stale link, or the join could just miss
  // (hive deleted, roster row never existed) — both are "not available to
  // you right now," not an error.
  async getContributingHive(hiveId) {
    const client = requireSupabase();
    const contributorId = await requireUserId(client);
    const { data: hive, error } = await client
      .from('private_hives')
      .select('id, owner_id, subject_name, cover_theme, sealed_at, hive_contributors!inner(profile_id, removed_at)')
      .eq('id', hiveId)
      .eq('hive_contributors.profile_id', contributorId)
      .is('hive_contributors.removed_at', null)
      .maybeSingle();
    if (error) throw error;
    if (!hive) return null;

    const { data: owner } = await client
      .from('profiles')
      .select('display_name')
      .eq('id', hive.owner_id)
      .maybeSingle();

    return {
      id: hive.id,
      subjectName: hive.subject_name,
      coverTheme: hive.cover_theme,
      sealedAt: hive.sealed_at,
      ownerName: owner?.display_name || 'Someone',
    };
  },

  // 8b.6 — the recipient's side of the send act (`docs/strategy/
  // Pollinate_Delivery_Slices.md` §8b.5's "Recipient read-access ruling").
  // Reads through the two subject-scoped policies that migration ships —
  // `private_hives_select_as_subject` and `entries_select_as_hive_subject`,
  // both gated on `sent_at is not null` — so an unsealed or unsent hive
  // never surfaces here, and neither method below needs its own sealed/sent
  // guard on top of RLS.
  //
  // NOT CALLABLE YET: `private_hives.sent_at` is "not yet in schema" as of
  // this PR — Fizz's 8b.5 migration ships it, the two policies, and
  // `send_hive`. Until that lands both methods fail with Postgres 42703
  // (undefined column), the expected shape of "the schema hasn't caught up"
  // per `undefined_column_beats_permission_denied` — not a client bug, and
  // not evidence the query is wrong. This branch is written against the
  // exact column/policy names Sage ratified so no rewrite is needed once
  // 8b.5 merges, only a rebase.
  async listReceivedPackages() {
    const client = requireSupabase();
    const subjectId = await requireUserId(client);
    const { data: hives, error } = await client
      .from('private_hives')
      .select('id, owner_id, subject_name, cover_theme, sealed_at, sent_at, is_collective')
      .eq('subject_profile_id', subjectId)
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false });
    if (error) throw error;
    if (!hives || hives.length === 0) return [];

    // Sender names, batched — `profiles_select_connections`
    // (20260809000005) is the same policy an incoming request card reads
    // under, and it drops silently (zero rows, not an error) once the
    // sender is unfriended. Missing names below fall back to 'Someone',
    // reusing that migration's own established fallback rather than a
    // second, inconsistent one — see the client note in Sage's spec about
    // read access surviving an unfriend while the profile does not.
    const ownerIds = [...new Set(hives.map((h) => h.owner_id))];
    const { data: senders } = await client.from('profiles').select('id, display_name').in('id', ownerIds);
    const senderNames = new Map((senders ?? []).map((p) => [p.id, p.display_name]));

    return hives.map((h) => ({
      id: h.id,
      subjectName: h.subject_name,
      coverTheme: h.cover_theme,
      sentAt: h.sent_at,
      senderName: senderNames.get(h.owner_id) || 'Someone',
      // Not rendered yet — DES-21 §5's roster title holds until Sage's
      // `author_name_at_seal` migration lands (thread b4533a52).
      isCollective: h.is_collective,
    }));
  },

  // One package: the hive's own facts, its sent entries (chronological,
  // oldest first — `revealSequencer.buildRevealSequence` sorts on `at` too,
  // but a stable input order here keeps the tie-break on `savedAt`/`id`
  // meaningful rather than accidental), and the sender name with the same
  // fallback `listReceivedPackages` uses.
  async getReceivedPackage(hiveId) {
    const client = requireSupabase();
    const subjectId = await requireUserId(client);
    const { data: hive, error } = await client
      .from('private_hives')
      .select('id, owner_id, subject_name, cover_theme, sealed_at, sent_at, is_collective')
      .eq('id', hiveId)
      .eq('subject_profile_id', subjectId)
      .not('sent_at', 'is', null)
      .maybeSingle();
    if (error) throw error;
    if (!hive) return null;

    const { data: entryRows, error: entriesError } = await client
      .from('entries')
      .select()
      .eq('hive_id', hiveId)
      .eq('visibility', 'sent')
      .order('entry_date', { ascending: true });
    if (entriesError) throw entriesError;

    const { data: sender } = await client
      .from('profiles')
      .select('display_name')
      .eq('id', hive.owner_id)
      .maybeSingle();

    const entries = (entryRows ?? []).map(toHiveEntry);
    // `writerCount` needs no schema change — every entry the subject can
    // read here already carries `authorId` (DES-21 finding, thread
    // b4533a52: `entries_select_as_hive_subject` has no author-friendship
    // term). Not rendered yet — §5/§6's ruled copy wants names, not a
    // count; this is the plumbing, not the UI call.
    const writerCount = new Set(entries.map((e) => e.authorId)).size;

    return {
      id: hive.id,
      subjectName: hive.subject_name,
      coverTheme: hive.cover_theme,
      sentAt: hive.sent_at,
      senderName: sender?.display_name || 'Someone',
      isCollective: hive.is_collective,
      writerCount,
      entries,
    };
  },
};
