import { supabase } from './supabase';
import { toISODate } from '../utils/dateRanges';
import { isPlaceholderName } from '../utils/placeholderName';

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
// §2 site #7: this mapper used to discard it). `authorName` is the frozen
// `entries.author_name_at_seal` snapshot (Sage's §8 ruling, thread
// b4533a52) — survives the writer renaming later, null pre-migration.
const toHiveEntry = (row) => ({
  id: row.id,
  hiveId: row.hive_id,
  date: row.entry_date,
  text: row.content,
  theme: row.theme,
  savedAt: row.created_at,
  paper: row.paper,
  authorId: row.user_id,
  authorName: row.author_name_at_seal,
});

// COPY-14's cause table (ruled 2026-08-30): THE CODE NAMES THE OUTCOME;
// ONLY STATE NAMES THE CAUSE. `entries_insert_own`'s 42501 has two true
// causes — no open volume, or a closed seat — so the sentence a user reads
// is derived from refetched state, never from the bare code. Pure and
// self-contained on purpose: check-private-hives-client-seal evaluates this
// exact text and runs the table against fabricated states, including the
// one no shipped path can produce yet (a rotation hive with zero open
// volumes) — deliberately ENG-91's first real assertion.
//
// `own` = HiveStore.getHive(hiveId) result; `seat` = getContributingHive
// result, only consulted when `own` is null.
const resolveRefusalCause = (own, seat) => {
  if (own) {
    // Owner first — HiveDetail routes owners into the same compose screen,
    // so this ordering is load-bearing: an owner must never read "seat
    // closed." `getHive` is owner-scoped at both layers (client `.eq
    // ('owner_id', …)` + `private_hives_select_own`), so non-null IS the
    // ownership test.
    if (own.sealedAt) return 'sealed';
    // Owner, hive open, refused anyway — no live cause names this state,
    // so no sentence claims one.
    return 'unknown';
  }
  // `getContributingHive`'s !inner join on own active membership IS the
  // seat test: null here means the seat closed (or the hive is gone —
  // same sentence-safe outcome, DES-22's "seat" register, never "removed").
  if (!seat) return 'seatClosed';
  // When both facts hold (seat closed AND sealed) the fetch above already
  // returned null, so seat-closed wins by construction — the more personal
  // truth, and never false.
  if (seat.sealedAt) return 'sealed';
  // Active seat, sealedAt null, 42501 anyway. This cell is unreachable for
  // a stated reason, which makes it a check rather than a fall-through:
  // pre-ENG-91 a hive always has an open volume, so the only live cause is
  // the seat — and the seat just tested open; post-ENG-91 WITH the
  // `private_hives.sealed_at` mirror write, zero open volumes implies
  // `sealedAt` was stamped and the branch above fires. The only world where
  // this cell is reachable is a rotation seal that closed the volume but
  // skipped the mirror — so this neutral fallback is the client-side
  // detector for that regression (ENG-91 acceptance row: after a rotation
  // seal, `getHive(hiveId).sealedAt` must be non-null). Neutral retry copy,
  // never a guessed cause.
  return 'unknown';
};

// ENG-97 (§1B.35.3): a comb writer joins the organizer's hive by invite
// code, so no honeycomb connection to the organizer is implied and
// usually none exists — the direct `profiles` join below returns nothing
// for a comb-minted hive and 'Someone' unnames the very person who
// invited them. For a comb-minted hive (one `comb_rotations` row
// references its `hive_id`), the organizer IS always a `comb_members` row
// (`combs_create_owner_membership` fires at comb creation), so
// `comb_co_member_names` reaches them where the direct join can't. A
// §18.1 hive has no `comb_rotations` row and keeps the direct join below —
// there is no better source for that case, and `'Someone'` there is the
// honest answer to a real authorization refusal, not a name bug.
//
// Finding A (thread b57ad406, 2026-08-31): a comb-linked hive's organizer
// name is either this read's answer or ABSENT — it never falls through to
// the direct join or `'Someone'`, both of which answer a different question
// (a non-comb hive's authorization state). A placeholder-class name
// (`isPlaceholderName` — e.g. an unrepaired `handle_new_user` default) is
// answered, not refused, so `'Someone'` there would misrepresent a name gap
// as an authorization gap. Every hive here that carries a `comb_rotations`
// row gets an entry in the returned map — `null` when the resolved name is
// placeholder-class — so callers distinguish "comb-linked, no from-clause to
// show" from "not comb-linked, ask the direct join" with `.has()`, never
// truthiness.
const resolveCombOwnerNames = async (client, hives) => {
  const hiveIds = hives.map((h) => h.id);
  if (hiveIds.length === 0) return new Map();
  const { data: rotations } = await client
    .from('comb_rotations')
    .select('hive_id, comb_id')
    .in('hive_id', hiveIds);
  const combIdByHiveId = new Map((rotations ?? []).map((r) => [r.hive_id, r.comb_id]));
  const combIds = [...new Set(combIdByHiveId.values())];

  const memberNamesByCombId = new Map();
  await Promise.all(
    combIds.map(async (combId) => {
      const { data: members } = await client.rpc('comb_co_member_names', { p_comb_id: combId });
      memberNamesByCombId.set(combId, new Map((members ?? []).map((m) => [m.profile_id, m.display_name])));
    })
  );

  const ownerNameByHiveId = new Map();
  for (const h of hives) {
    const combId = combIdByHiveId.get(h.id);
    if (combId == null) continue;
    const name = memberNamesByCombId.get(combId)?.get(h.owner_id);
    ownerNameByHiveId.set(h.id, isPlaceholderName(name) ? null : name);
  }
  return ownerNameByHiveId;
};

// Row 1.15 residuals 1+2 (§1B.38.20/.21, ruled thread b57ad406): the direct
// `profiles` join's own three states, mirroring `resolveCombOwnerNames`
// above so a placeholder-class name renders the same absence on both the
// comb-linked and direct-join branches instead of diverging on provenance
// the reader can't see. `names` is keyed by every id the batch join was
// ASKED for, not every id it ANSWERED — a missing key is the row RLS or a
// deleted profile dropped silently (the same shape `listReceivedPackages`
// already documents), so it stays the permission word; a present key whose
// value is placeholder-class is a row the read reached with nothing to
// show, so it goes absent instead.
const resolveDirectName = (names, id) => {
  if (!names.has(id)) return 'Someone';
  const name = names.get(id);
  return isPlaceholderName(name) ? null : name;
};

const toCombCollectRotation = ({ rotation, hive, writerCount }) => ({
  id: rotation.id,
  combId: rotation.comb_id,
  hiveId: rotation.hive_id,
  subjectName: hive.subjectName,
  coverTheme: hive.coverTheme,
  closesAt: rotation.closes_at,
  sealedAt: rotation.sealed_at,
  sentAt: rotation.sent_at,
  writerCount,
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
  // This call does not check sealedAt itself. The live WITH CHECK is
  // `entries_insert_own` as rewritten by 20260827000001: the entry's
  // `volume_id` must name a `hive_volumes` row with `sealed_at is null`,
  // and the writer must be the owner or an active contributor
  // (`is_hive_contributor`). Its 42501 is therefore ONE CODE WITH TWO
  // CAUSES — no open volume, or a closed seat — so callers must never
  // derive a sentence from the code alone; `resolveEntryRefusal` below is
  // the ruled resolution (COPY-14). It is still a permanent refusal, not a
  // network failure — callers gate the UI (HiveDetailScreen hides "+ Add
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

  // COPY-14 — resolve `addHiveEntry`'s 42501 into the cause a user may be
  // shown, with one refetch, exhaustive over both entry points to the
  // compose screen (HiveDetail owner route, ContributingHive member route).
  // The case table itself is `resolveRefusalCause` above; this method only
  // fetches its inputs. A failed refetch resolves 'unknown' — the neutral
  // connection copy, never the sealed sentence from a bare code.
  async resolveEntryRefusal(hiveId) {
    try {
      const own = await this.getHive(hiveId);
      const seat = own ? null : await this.getContributingHive(hiveId);
      return resolveRefusalCause(own, seat);
    } catch (err) {
      console.warn('HiveStore.resolveEntryRefusal: refetch failed', err);
      return 'unknown';
    }
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

    return rows.map((r) => ({ profileId: r.profile_id, name: resolveDirectName(names, r.profile_id) }));
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
    // ENG-97/Finding A: overrides the direct join above for comb-minted
    // hives — `.has()`, not `||`, so a placeholder-class comb organizer
    // name (`null` in the map) stays absent instead of falling through to
    // the direct join or `'Someone'`.
    const combOwnerNames = await resolveCombOwnerNames(client, hives);

    return hives.map((h) => ({
      id: h.id,
      subjectName: h.subject_name,
      coverTheme: h.cover_theme,
      sealedAt: h.sealed_at,
      ownerName: combOwnerNames.has(h.id) ? combOwnerNames.get(h.id) : resolveDirectName(ownerNames, h.owner_id),
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
    // Row 1.15: `.maybeSingle()` returning null IS the map-miss state
    // (`resolveDirectName`'s `!names.has(id)`) — no row reached, the
    // permission word stands. A returned row goes through the same
    // placeholder split as every other direct-join site.
    const ownerNames = owner ? new Map([[hive.owner_id, owner.display_name]]) : new Map();
    // ENG-97/Finding A: same `.has()` resolution as listContributingHives.
    const combOwnerNames = await resolveCombOwnerNames(client, [hive]);

    return {
      id: hive.id,
      subjectName: hive.subject_name,
      coverTheme: hive.cover_theme,
      sealedAt: hive.sealed_at,
      ownerName: combOwnerNames.has(hive.id) ? combOwnerNames.get(hive.id) : resolveDirectName(ownerNames, hive.owner_id),
    };
  },

  // Comb collect route contract (Pixel, MVP-Comb): Lumen's invite/auth lane
  // may hand off either the joined rotation id or the comb id. This resolver
  // turns that identity into the single current writing hive, and then proves
  // the caller has an active contributor seat by reusing `getContributingHive`
  // for the resolved `hive_id`. A joined member who is not enrolled into the
  // open rotation's `hive_contributors` row returns null here, which is the
  // client-visible failure O10's server lane must close.
  async getCombCollectRotation({ rotationId, combId } = {}) {
    const client = requireSupabase();
    await requireUserId(client);
    if (!rotationId && !combId) throw new Error('Comb collect needs a rotationId or combId');

    let query = client
      .from('comb_rotations')
      .select('id, comb_id, hive_id, closes_at, sealed_at, sent_at, voided_at');

    if (rotationId) {
      query = query.eq('id', rotationId);
    } else {
      query = query
        .eq('comb_id', combId)
        .is('sealed_at', null)
        .is('voided_at', null);
    }

    const { data: rotation, error } = await query.maybeSingle();
    if (error) throw error;
    if (!rotation || rotation.sealed_at || rotation.voided_at) return null;

    const hive = await this.getContributingHive(rotation.hive_id);
    if (!hive) return null;

    const { data: writerCount, error: writerCountError } = await client.rpc('comb_rotation_writer_count', {
      p_rotation_id: rotation.id,
    });
    if (writerCountError) throw writerCountError;

    return toCombCollectRotation({ rotation, hive, writerCount });
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
      .select('id, owner_id, subject_name, cover_theme, sealed_at, sent_at, is_collective, contributor_names')
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
      isCollective: h.is_collective,
      // Frozen at send time (`send_hive`, distinct on `entries.user_id`,
      // first-appearance order) — not live-computed, so it stays correct
      // even if a contributor's own name changes after the fact.
      contributorNames: h.contributor_names ?? [],
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
      .select('id, owner_id, subject_name, cover_theme, sealed_at, sent_at, is_collective, contributor_names')
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
    // term). Kept alongside `contributorNames` as the overflow-safe count
    // DES-21 §5 wants for the 20-writer case.
    const writerCount = new Set(entries.map((e) => e.authorId)).size;

    return {
      id: hive.id,
      subjectName: hive.subject_name,
      coverTheme: hive.cover_theme,
      sentAt: hive.sent_at,
      senderName: sender?.display_name || 'Someone',
      isCollective: hive.is_collective,
      writerCount,
      contributorNames: hive.contributor_names ?? [],
      entries,
    };
  },
};
