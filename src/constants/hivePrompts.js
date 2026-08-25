// Prompt ladders for relationship-typed private hives.
// PLANS/POLLINATE_V2_SPEC.md §16.2-16.3 (Project 16, ENG-44/ENG-45).
//
// SCAFFOLD ONLY. COPY-1 (Lumen) owns the actual questions/sparks per
// register — every ladder below is intentionally empty. Nothing in this
// repo renders a hive prompt yet (ENG-45.1/45.2 are blocked on DES-14/
// DES-15), so an empty ladder ships no fabricated copy to a user. Drop
// `{ question, sparks }` objects into HIVE_PROMPT_LADDERS in place; the
// register/bucket keys and the selector below are already load-bearing —
// check:onboarding-flow section D (ENG-45.4) asserts the spark contract
// over whatever lands here.
//
// It inherits prompts.js's spark composition contract VERBATIM (lowercase
// noun phrase, no leading preposition, no duplicate spark string) — hive
// sparks compose into a sentence the same way (spec §16.2).

// private_hives.relationship allows 7 values (spec §16.1); only 4 have
// their own prompt register (spec §16.2 table). sibling/mentor/other fall
// back to `friend`. Exported raw (not just the accessor) so a gate can
// enumerate it without re-deriving the mapping.
export const RELATIONSHIP_TO_REGISTER = {
  child: 'child',
  partner: 'partner',
  parent: 'parent',
  friend: 'friend',
  sibling: 'friend',
  mentor: 'friend',
  other: 'friend',
};

export const registerForRelationship = (relationship) =>
  RELATIONSHIP_TO_REGISTER[relationship] ?? 'friend';

// Age buckets are keyed on HIVE age (days since private_hives.created_at),
// not the subject's age — v1 collects no birthdate (spec §16.3). Boundaries
// are exact-year day counts; a hive is in a bucket through day (years*365 - 1)
// and rolls into the next bucket on day (years*365).
const AGE_BUCKET_THRESHOLDS = {
  child: [
    ['0-1', 365],
    ['1-3', 3 * 365],
    ['3-7', 7 * 365],
    ['7-12', 12 * 365],
    ['12-18', 18 * 365],
    ['18+', Infinity],
  ],
  partner: [
    ['0-1y', 365],
    ['1-3y', 3 * 365],
    ['3-10y', 10 * 365],
    ['10y+', Infinity],
  ],
  // "others" per spec §16.3 — parent and friend share the same 2-year split.
  parent: [
    ['new', 2 * 365],
    ['established', Infinity],
  ],
  friend: [
    ['new', 2 * 365],
    ['established', Infinity],
  ],
};

export const bucketForHiveAge = (register, hiveAgeDays) => {
  const thresholds = AGE_BUCKET_THRESHOLDS[register] ?? AGE_BUCKET_THRESHOLDS.friend;
  const age = Number.isFinite(hiveAgeDays) && hiveAgeDays >= 0 ? hiveAgeDays : 0;
  const found = thresholds.find(([, maxDays]) => age < maxDays);
  return (found ?? thresholds[thresholds.length - 1])[0];
};

// Each register's ladder, keyed by bucket. Populated by COPY-1; each entry
// is `{ question, sparks }` — same shape as prompts.js's DAILY_PROMPTS,
// since ComposeHiveEntry composes a tapped spark into a sentence the
// identical way (spec §16.2, §16.4).
export const HIVE_PROMPT_LADDERS = {
  child: { '0-1': [], '1-3': [], '3-7': [], '7-12': [], '12-18': [], '18+': [] },
  partner: { '0-1y': [], '1-3y': [], '3-10y': [], '10y+': [] },
  parent: { new: [], established: [] },
  friend: { new: [], established: [] },
};

// Days since a hive's creation, floored to whole days. `now` is injectable
// so callers (and tests) don't have to fight a hidden `new Date()`.
export const daysSinceHiveCreated = (createdAt, now = new Date()) => {
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
};

// Same djb2-ish string hash as Avatar.js's `hashName`, kept identical on
// purpose — one mental model for "turn an id into a stable small int" in
// this codebase.
const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 2147483647;
  }
  return hash;
};

// Deterministic selection, spec §16.3:
//   index = hash(hive_id) + floor(days_since_hive_created / cadence_days)
//   prompt = ladder[bucket][index mod ladder[bucket].length]
// No AsyncStorage, no server round-trip — stable across a re-render and
// across a single day, never jumps.
//
// `cadenceDays` has NO default here on purpose. The spec pins the formula
// but not a value, and baking in a guessed number would silently ship an
// unratified product decision. Callers must pass it explicitly until that
// value gets a ruling.
export const selectHivePrompt = ({ hiveId, relationship, hiveAgeDays, cadenceDays }) => {
  if (!hiveId || !Number.isFinite(cadenceDays) || cadenceDays <= 0) return null;
  const register = registerForRelationship(relationship);
  const bucket = bucketForHiveAge(register, hiveAgeDays);
  const ladder = HIVE_PROMPT_LADDERS[register]?.[bucket] ?? [];
  if (ladder.length === 0) return null;
  const age = Number.isFinite(hiveAgeDays) && hiveAgeDays >= 0 ? hiveAgeDays : 0;
  const index = hashString(String(hiveId)) + Math.floor(age / cadenceDays);
  return ladder[index % ladder.length];
};
