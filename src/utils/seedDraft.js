import { SEED_CONTENT_MAX } from '../services/SeedsStore';

// The compose screen and `SeedsStore.plantSeed` have to agree about what a
// plantable seed is, and they are two files apart. When they drift the user
// finds out in the worst way available: the CTA lights up, they press it, and
// the store throws the sentence the button should have prevented. Everything
// the button needs to decide lives here, so `check-plant-seed.mjs` can assert
// the two answers are the same answer rather than hoping they are.
//
// `plantSeed`'s own guards stay where they are. This is not a replacement for
// them — the store is callable from anywhere and must defend itself — it is
// the same rules stated once so the screen can consult them *before* the round
// trip instead of after it.

/** Reasons a draft can't be planted, in the order `plantSeed` checks them.
 *  `reason` is null when the draft is plantable. */
export const SEED_DRAFT_REASONS = {
  NO_RECIPIENT: 'no-recipient',
  NO_TEXT: 'no-text',
  TOO_LONG: 'too-long',
  NO_DATE: 'no-date',
  DATE_IN_PAST: 'date-in-past',
};

// The earliest date a seed may bloom. `seeds_bloom_after_planting` refuses
// `bloom_at <= created_at`, and a seed that opens the moment it is planted is
// a note with extra steps — so the floor is a whole day out, not a second.
// Returned as a Date at the same time of day as `now`, which is what makes it
// safe as the picker's `minimumDate`: picking the floor itself still lands
// strictly in the future.
export const bloomFloor = (now = new Date()) => {
  const floor = new Date(now.getTime());
  floor.setDate(floor.getDate() + 1);
  return floor;
};

/** Mirrors `plantSeed`'s guards, in `plantSeed`'s order, with `plantSeed`'s
 *  messages. `recipientId` is the one rule the store does NOT check — there it
 *  is Postgres's job (`no_self_seed`, the FK) — but the screen has to, because
 *  a chip nobody picked is the most likely empty field on the form. */
export const validateSeedDraft = ({ recipientId, content, bloomAt }, now = new Date()) => {
  if (!recipientId) return { ok: false, reason: SEED_DRAFT_REASONS.NO_RECIPIENT, message: 'Pick someone to plant this for' };

  const trimmed = (content ?? '').trim();
  if (!trimmed) return { ok: false, reason: SEED_DRAFT_REASONS.NO_TEXT, message: 'Seed text is required' };
  if (trimmed.length > SEED_CONTENT_MAX) {
    return { ok: false, reason: SEED_DRAFT_REASONS.TOO_LONG, message: `Seeds are capped at ${SEED_CONTENT_MAX} characters` };
  }

  const bloom = bloomAt instanceof Date ? bloomAt : new Date(bloomAt);
  if (!bloomAt || Number.isNaN(bloom.getTime())) {
    return { ok: false, reason: SEED_DRAFT_REASONS.NO_DATE, message: 'Pick a date for this seed to bloom' };
  }
  if (bloom.getTime() <= now.getTime()) {
    return { ok: false, reason: SEED_DRAFT_REASONS.DATE_IN_PAST, message: 'A seed has to bloom in the future' };
  }

  return { ok: true, reason: null, message: null };
};

// The primary button's label while the draft is incomplete — names the one
// thing standing between here and plantable, keyed by `validateSeedDraft`'s
// own `reason`. Lumen's ruling (thread 95095e74, item 1): a disabled CTA must
// say what it's waiting for, never sit on a dead "Plant this seed" — that is
// exactly what left Colin unable to tell why send wouldn't light up. Every
// key in SEED_DRAFT_REASONS has an entry here on purpose (see
// check-plant-seed.mjs §6) — a reason with no label would silently fall back
// to the same dead-button failure this exists to close.
export const SEED_CTA_LABELS = {
  [SEED_DRAFT_REASONS.NO_RECIPIENT]: 'Pick someone',
  [SEED_DRAFT_REASONS.NO_TEXT]: 'Write something',
  [SEED_DRAFT_REASONS.TOO_LONG]: 'Trim your seed',
  [SEED_DRAFT_REASONS.NO_DATE]: 'Pick a bloom date',
  [SEED_DRAFT_REASONS.DATE_IN_PAST]: 'Pick a later date',
};

export const seedCtaLabel = (draft, planting) => {
  if (planting) return 'Planting…';
  if (draft.ok) return 'Plant this seed';
  return SEED_CTA_LABELS[draft.reason];
};

// Both hints in the copy (GRATITUDE_COPY_LIBRARY §4, 8.2) interpolate the
// recipient's name, and both have to read before anyone is picked — a sentence
// with a hole in it is worse than a slightly vaguer sentence. "They" is the
// fallback, cased for its position rather than lower-cased at the call site,
// because `name.toLowerCase() === 'they'` would also catch a person actually
// called They.
//
// BOTH FALLBACKS ARE CAPITAL NOW, and that is a consequence of the R-WD-4
// rewrite rather than a style change. `sealHint` used to read
// "Sealed until it blooms — {name} won't see this until then.", where the
// interpolation sat MID-SENTENCE after a dash, so its fallback was lowercase
// "they" while `bloomHint`'s was capital. R-WD-3 rules "seal" off the compose
// surface (it is hive and rotation vocabulary; a held note is PLANTED) and
// Colin's standing ban takes the dash, so the sentence became two sentences —
// which moves the interpolation to SENTENCE-INITIAL position and the fallback
// with it. Lumen's correction, ruled 2026-09-05 in UX Design thread 160660d9:
// the second arm is not unchanged in shape, only in job.
//
// Renamed with the string. A helper still called `sealHint` while returning
// the planted sentence is a name that lies to the next reader, on the one
// surface whose whole rule is which word is used.
export const plantedHint = (recipientName) =>
  `Planted until it blooms. ${recipientName ?? 'They'} won't see this until then.`;

export const bloomHint = (recipientName, dateLabel) =>
  `${recipientName ?? 'They'} won't see this until ${dateLabel}.`;

/** The one date format the screen shows, so the picker row and the hint under
 *  it can never disagree about which day was chosen. */
export const bloomDateLabel = (bloomAt) =>
  bloomAt ? bloomAt.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : null;
