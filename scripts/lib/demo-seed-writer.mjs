// DEMO ACCOUNT SEED — mechanics. All row writes, all timestamps, all
// constraint-respecting ordering. Content lives in demo-seed-corpus.mjs and
// this file never contains a sentence a demo viewer will read.
//
// ===========================================================================
// WHAT THIS FILE REPLICATES, AND WHERE THE REAL VERSION LIVES
// ===========================================================================
//
// Nothing here calls comb_open_rotation / seal_and_send_rotation /
// comb_advance_rotation / seal_hive / send_hive, because every one of them
// stamps now(). A demo account needs six months of history, so this file
// writes the rows those functions WOULD have written, at the timestamps they
// would have carried, respecting every trigger and constraint they respect.
// Column for column, in the order the real functions write them:
//
//   comb_open_rotation                 20260830000011:23-122 (LAST definition;
//     the mint                          ...0008 created it, ...0010 and
//                                       ...0011 each replaced the body)
//     1. private_hives (owner_id = combs.owner_id, subject_name =
//        coalesce(nullif(display_name,''),'Someone'), is_collective = true,
//        subject_profile_id). cover_theme / review_cadence / relationship are
//        NOT set by the mint, so this file does not set them either and the
//        column defaults ('sunlit-honey' / 'yearly' / 'other') apply.
//     2. hive_volumes ordinal 1, open — arrives free from
//        private_hives_create_volume_one_trigger (20260826000003:127). This
//        file lets the trigger fire and then backdates the row's created_at.
//     3. hive_contributors (hive_id, profile_id, invited_by = owner) for every
//        enrollable comb member EXCEPT the subject.
//     4. comb_rotations (comb_id, ordinal = max+1, hive_id,
//        subject_profile_id, closes_at).
//
//   seal_and_send_rotation             20260830000009:92-232 (LAST definition;
//     the deliver path                  ...0003 created it, ENG-95 replaced it)
//     1. entries private -> packaged, author_name_at_seal =
//        coalesce(nullif(display_name,''),'A writer').
//     2. hive_volumes.sealed_at = now(). NO SUCCESSOR VOLUME — deliberate, and
//        the difference from seal_volume that matters most here
//        (...0003:261-281 explains why).
//     3. private_hives.sealed_at = now().
//     4. entries packaged -> sent.
//     5. private_hives.sent_at = now(), contributor_names = distinct-on
//        (user_id) earliest author_name_at_seal, ordered (entry_date,
//        created_at, id). Reproduced exactly in contributorNames() below.
//     6. hive_send_events (sender_id = hive owner, recipient_id = subject).
//     7. comb_rotations.sealed_at = now(), sent_at = now().
//
//   comb_advance_rotation              20260830000011:221-332
//     Not a writer of its own; it derives the next subject and closes_at and
//     calls the mint. Both derivations are reproduced here rather than
//     assumed: the joined_at walk decides every subject after month 1 (see
//     COMB_A.joinOrder's own note in the corpus), and closes_at is the prior
//     rotation's closes_at plus one cadence, skipped forward past now() and
//     floored at half a cadence.
//
//   seal_volume / send_hive            20260904000002:45-158 (LAST definitions,
//     the legacy 1:1 path               ENG-101; 20260828000001 before that)
//     seal_volume DOES open a successor volume (line 82), which is exactly
//     what seal_and_send_rotation refuses to do. Hive 1 below therefore ends
//     with an open Volume 2 and the comb rotations do not. send_hive writes
//     sent_at + contributor_names + a hive_send_events row, and requires an
//     accepted honeycomb_connections row between owner and subject.
//
// ===========================================================================
// LEDGER: DELIBERATELY UNTOUCHED
// ===========================================================================
// This file writes NOTHING to ledger_transactions, ledger_postings,
// ledger_accounts, ledger_account_balances, ledger_settings, nectar_zaps,
// nectar_consents, comb_nectar_notes, strike_* or custody_reconciliations.
// Pass one is the rotation, hive and journal surfaces only. Nectar is a
// double-entry ledger with its own invariants and its own gates
// (check-nectar-ledger, check-nectar-exchange, check-nectar-consent); seeding
// half of it by hand is how a balance stops reconciling. If a demo needs
// nectar it is a second, separate pass that goes through the real RPCs.
//
// ===========================================================================
// THE DECORATIVE LAYER IS NOT SUPPRESSED BY ANY OF THIS
// ===========================================================================
// Seeding real honeycomb_connections rows does NOT turn off
// src/constants/demoHive.js. Its only call site is
// src/screens/HoneycombTab.js:100,
//     const merged = DEMO_CONTENT ? weekFeed.concat(demoHiveShares(now)) : weekFeed;
// and DEMO_CONTENT is `__DEV__ || DEMO_MODE` (src/constants/demoMode.js:46),
// with DEMO_MODE = `process.env.EXPO_PUBLIC_DEMO_MODE === 'true'` (:20). It is
// a build-time constant. No database row can flip it, and the real feed
// appears only as the concat BASE, never as a condition. See the seed
// script's preflight banner.

import {
  CAST,
  COMB_A,
  COMB_B,
  DEMO_ACCOUNT_KEY,
  DEMO_ACCOUNT_NAME,
  PRIVATE_HIVES,
  STREAK,
} from './demo-seed-corpus.mjs';

// ---------------------------------------------------------------------------
// Deterministic jitter. Same mulberry32 src/utils/demoSeed.js uses, for the
// same reason its own comment gives: a fixed seed means a re-run produces the
// same clock, so a screenshot can be reproduced.
// ---------------------------------------------------------------------------
const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const MS_DAY = 86400000;
const MS_MIN = 60000;

const addDays = (d, n) => new Date(d.getTime() + n * MS_DAY);
const addMinutes = (d, n) => new Date(d.getTime() + n * MS_MIN);

// Calendar month arithmetic, not 30-day arithmetic: `combs.cadence` is
// `interval '1 month'` (20260830000008:69) and Postgres advances the month
// field, clamping the day. Doing this with milliseconds would drift the
// comb's calendar by up to three days a year and make the derived closes_at
// chain wrong in a way nothing would flag.
const addMonths = (d, n) => {
  const out = new Date(d.getTime());
  const day = out.getUTCDate();
  out.setUTCDate(1);
  out.setUTCMonth(out.getUTCMonth() + n);
  const lastDay = new Date(Date.UTC(out.getUTCFullYear(), out.getUTCMonth() + 1, 0)).getUTCDate();
  out.setUTCDate(Math.min(day, lastDay));
  return out;
};

const isoDate = (d) => d.toISOString().slice(0, 10);

// Reading a `date` column back is transport-dependent and the two disagree in
// a way that silently breaks idempotency. node-postgres parses `date` into a
// JS Date at LOCAL midnight, so `String(row.entry_date).slice(0,10)` yields
// 'Wed Sep 04' and matches nothing; toISOString() on that same value shifts a
// day in any timezone west of UTC. PostgREST returns the plain string.
// Normalised here, in local-calendar terms, which is what a `date` column
// means.
export const readDate = (v) => {
  if (v instanceof Date) {
    const p = (n) => String(n).padStart(2, '0');
    return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}`;
  }
  return String(v).slice(0, 10);
};

// ---------------------------------------------------------------------------
// buildPlan — turns the corpus plus a clock into concrete rows-to-be.
// Pure: no database, no ids. Everything a gate wants to assert about the
// timeline is decided here and is inspectable without a Postgres.
// ---------------------------------------------------------------------------
export function buildPlan({ now = new Date(), seed = 20260904 } = {}) {
  const rand = mulberry32(seed);

  // An evening, mostly. 78% between 18:00 and 23:45, the rest scattered
  // across the day, so the streak does not read as a cron job. The register
  // asks for uneven INTERVALS; the calendar itself stays dense because
  // entries_one_journal_per_day (20260813000007) plus a maxed streak is the
  // surface being demoed, exactly as buildDemoEntries' own comment argues.
  const eveningish = (date) => {
    const r = rand();
    const hour = r < 0.78 ? 18 + Math.floor(rand() * 6) : Math.floor(rand() * 18);
    const out = new Date(date.getTime());
    out.setUTCHours(hour, Math.floor(rand() * 60), Math.floor(rand() * 60), 0);
    return out;
  };

  // --- Comb A's clock -----------------------------------------------------
  // Month 6 closes in four days, per the register. Every earlier month's
  // closes_at is one cadence back, which is the same chain
  // comb_advance_rotation walks forward (closes_at + k*cadence). Derived
  // backwards from the one fixed point rather than hardcoded to 2026 dates,
  // so the demo still reads "closes in 4 days" whenever it is run.
  const combACloses = [];
  const combALast = addDays(now, 4);
  for (let i = COMB_A.months.length - 1; i >= 0; i -= 1) {
    combACloses[i] = addMonths(combALast, -(COMB_A.months.length - 1 - i));
  }

  // --- Comb B's clock -----------------------------------------------------
  // Month 2 is open with roughly seventeen days left; month 1 closed one
  // cadence earlier. Checked against comb_advance_rotation's half-cadence
  // downtime floor (20260830000011:324-326): month 2's window is a full
  // cadence, so the floor never fires and no month is skipped.
  const combBCloses = [];
  const combBLast = addDays(now, 17);
  for (let i = COMB_B.months.length - 1; i >= 0; i -= 1) {
    combBCloses[i] = addMonths(combBLast, -(COMB_B.months.length - 1 - i));
  }

  // The tick runs every five minutes (20260830000012's cron line), so a
  // rotation resolves a few minutes after its window closes and the next one
  // is minted in the same tick, one statement later.
  const TICK_LAG_MIN = 2;
  const ADVANCE_LAG_SEC = 3;

  const planComb = (comb, closesList) => {
    const months = comb.months.map((month, i) => {
      const closesAt = closesList[i];
      // Month 1 is minted by the organizer one cadence before it closes
      // (comb_open_rotation derives closes_at = now() + cadence when the
      // caller has a session, 20260830000011:61). Every later month is
      // minted by the tick, moments after its predecessor resolved.
      const mintedAt =
        i === 0
          ? addMonths(closesAt, -1)
          : new Date(addMinutes(closesList[i - 1], TICK_LAG_MIN).getTime() + ADVANCE_LAG_SEC * 1000);
      const resolvedAt = month.state === 'delivered' ? addMinutes(closesAt, TICK_LAG_MIN) : null;

      const windowMs = closesAt.getTime() - mintedAt.getTime();
      const entries = month.entries.map((e, idx) => {
        // daysBeforeClose is authored against a nominal 30-day month. Mapped
        // onto the REAL window instead of subtracted from closes_at, so a
        // 28-day February can never place an entry before its own hive was
        // minted. Order and spacing are preserved exactly.
        const fraction = 1 - Math.min(e.daysBeforeClose, 30) / 30;
        const base = new Date(mintedAt.getTime() + windowMs * fraction);
        let at = eveningish(base);
        // idx seconds keeps created_at strictly unique inside a hive, which
        // is what makes contributor_names' (entry_date, created_at, id) sort
        // reproducible without knowing any generated id.
        at = new Date(at.getTime() + idx * 1000);
        if (at <= mintedAt) at = addMinutes(mintedAt, 30 + idx);
        if (at >= closesAt) at = addMinutes(closesAt, -(30 + idx));
        return { ...e, createdAt: at, entryDate: isoDate(at) };
      });
      entries.sort((a, b) => a.createdAt - b.createdAt);

      return { ...month, closesAt, mintedAt, resolvedAt, entries };
    });

    // Membership. The organizer's seat is inserted by
    // combs_create_owner_membership_trigger at comb creation, so it is the
    // earliest joined_at by construction and the whole subject walk depends
    // on it (see COMB_A.joinOrder's note in the corpus). Everyone else joined
    // by invite link, in the ratified order, between comb creation and the
    // first mint.
    const createdAt = addMinutes(months[0].mintedAt, -180);
    const gap = (months[0].mintedAt.getTime() - createdAt.getTime()) / (comb.joinOrder.length + 1);
    const members = comb.joinOrder.map((key, i) => ({
      key,
      joinedAt: new Date(createdAt.getTime() + gap * i),
    }));
    // The owner's own seat is the comb's creation instant, not a share of the
    // gap: the trigger fires inside the combs INSERT.
    members[0].joinedAt = createdAt;

    return { ...comb, createdAt, members, months };
  };

  const combA = planComb(COMB_A, combACloses);
  const combB = planComb(COMB_B, combBCloses);

  // --- Legacy private hives ----------------------------------------------
  const hives = PRIVATE_HIVES.map((hive) => {
    if (hive.state === 'sent') {
      // Sealed and sent about three months ago, after roughly four months of
      // writing. Two acts, minutes apart: seal_hive then send_hive, which is
      // how HiveDetail's two buttons actually get tapped
      // (src/screens/HiveDetail.js:275-315).
      const sealedAt = addDays(now, -92);
      const sentAt = addMinutes(sealedAt, 4);
      const entries = hive.entries.map((e, idx) => {
        let at = eveningish(addDays(sealedAt, -e.daysBeforeSeal));
        at = new Date(at.getTime() + idx * 1000);
        return { ...e, createdAt: at, entryDate: isoDate(at) };
      });
      entries.sort((a, b) => a.createdAt - b.createdAt);
      const createdAt = addDays(entries[0].createdAt, -6);
      return { ...hive, createdAt, sealedAt, sentAt, entries };
    }
    const entries = hive.entries.map((e, idx) => {
      let at = eveningish(addDays(now, -e.daysBeforeNow));
      at = new Date(at.getTime() + idx * 1000);
      return { ...e, createdAt: at, entryDate: isoDate(at) };
    });
    entries.sort((a, b) => a.createdAt - b.createdAt);
    const createdAt = addDays(entries[0].createdAt, -3);
    return { ...hive, createdAt, sealedAt: null, sentAt: null, entries };
  });

  // --- Personal streak ----------------------------------------------------
  // 180 consecutive days ending today. The unique index is on
  // (user_id, entry_date) where hive_id is null, so exactly one row per date.
  const streak = STREAK.map((line, i) => {
    const day = addDays(now, -(STREAK.length - 1 - i));
    const at = eveningish(day);
    return { ...line, entryDate: isoDate(day), createdAt: at };
  });

  // --- Connections --------------------------------------------------------
  // Alex to each cast member, accepted. Direction alternates so the demo
  // account is not uniformly the requester, which is what a real graph looks
  // like. unique_pair (requester_id, addressee_id) is the idempotency key.
  const connections = CAST.map((person, i) => ({
    requesterKey: i % 2 === 0 ? DEMO_ACCOUNT_KEY : person.key,
    addresseeKey: i % 2 === 0 ? person.key : DEMO_ACCOUNT_KEY,
    createdAt: addDays(now, -(210 - i * 9)),
    respondedAt: addDays(now, -(209 - i * 9)),
  }));

  return { now, combs: [combA, combB], hives, streak, connections };
}

// ---------------------------------------------------------------------------
// contributor_names, reproduced exactly.
//
//   select coalesce(array_agg(x.author_name_at_seal
//                             order by x.entry_date, x.created_at, x.id), '{}')
//   from (select distinct on (e.user_id) e.user_id, e.author_name_at_seal,
//                e.entry_date, e.created_at, e.id
//         from entries e where e.hive_id = ... and e.visibility = 'sent'
//         order by e.user_id, e.entry_date, e.created_at, e.id) x
//
// (20260830000009:209-217, and identically 20260904000002:140-148 for the
// legacy send path.) `id` only ever breaks a tie on (entry_date, created_at),
// and buildPlan gives every entry in a hive a distinct created_at, so the
// generated ids this file cannot see can never change the answer.
// ---------------------------------------------------------------------------
export function contributorNames(entries, nameOf) {
  const key = (e) => [e.entryDate, e.createdAt.getTime()];
  const earliest = new Map();
  for (const e of entries) {
    const cur = earliest.get(e.writer);
    if (!cur) { earliest.set(e.writer, e); continue; }
    const [ad, at] = key(e);
    const [bd, bt] = key(cur);
    if (ad < bd || (ad === bd && at < bt)) earliest.set(e.writer, e);
  }
  return [...earliest.values()]
    .sort((a, b) => (a.entryDate < b.entryDate ? -1 : a.entryDate > b.entryDate ? 1 : a.createdAt - b.createdAt))
    .map((e) => nameOf(e.writer));
}

// ---------------------------------------------------------------------------
// Adapters. One row-writing implementation, two transports: `pg` for the
// local embedded-Postgres gate, supabase-js for the real service-role run.
// Everything below `seedDemoAccount` is transport-agnostic, which is what
// makes the local validation cover the real code path rather than a
// look-alike.
// ---------------------------------------------------------------------------

export function pgAdapter(client) {
  const cols = (row) => Object.keys(row);
  const values = (rows, columns) => {
    const params = [];
    const tuples = rows.map((row) => {
      const t = columns.map((c) => {
        params.push(row[c] === undefined ? null : row[c]);
        return `$${params.length}`;
      });
      return `(${t.join(', ')})`;
    });
    return { tuples: tuples.join(', '), params };
  };
  // `is null`, never `= null`. The streak's existing-dates read filters on
  // `hive_id is null` and a `= $n` with a null parameter matches zero rows
  // silently, which would make every re-run look like a fresh account and
  // then collide with entries_one_journal_per_day.
  const where = (eq, params) =>
    Object.entries(eq)
      .map(([k, v]) => {
        if (v === null) return `${k} is null`;
        params.push(v);
        return `${k} = $${params.length}`;
      })
      .join(' and ');

  return {
    kind: 'pg',
    async select(table, eq, columns = '*') {
      const params = [];
      const clause = Object.keys(eq).length ? ` where ${where(eq, params)}` : '';
      const { rows } = await client.query(`select ${columns} from public.${table}${clause}`, params);
      return rows;
    },
    async insert(table, rows, { conflictIgnore = null, returning = 'id' } = {}) {
      if (rows.length === 0) return [];
      const columns = cols(rows[0]);
      const { tuples, params } = values(rows, columns);
      const conflict = conflictIgnore ? ` on conflict (${conflictIgnore}) do nothing` : '';
      const ret = returning ? ` returning ${returning}` : '';
      const { rows: out } = await client.query(
        `insert into public.${table} (${columns.join(', ')}) values ${tuples}${conflict}${ret}`,
        params
      );
      return out;
    },
    async update(table, eq, patch) {
      const params = [];
      const sets = Object.entries(patch)
        .map(([k, v]) => {
          params.push(v);
          return `${k} = $${params.length}`;
        })
        .join(', ');
      const clause = where(eq, params);
      const { rows } = await client.query(
        `update public.${table} set ${sets} where ${clause} returning *`,
        params
      );
      return rows;
    },
    async remove(table, eq) {
      const params = [];
      await client.query(`delete from public.${table} where ${where(eq, params)}`, params);
    },
  };
}

export function supabaseAdapter(client) {
  const iso = (v) => (v instanceof Date ? v.toISOString() : v);
  const encode = (rows) =>
    rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, iso(v)])));
  return {
    kind: 'supabase',
    async select(table, eq, columns = '*') {
      let q = client.from(table).select(columns);
      // `.is`, never `.eq`, for null — same reason the pg adapter uses
      // `is null`: PostgREST renders `.eq(col, null)` as `col=eq.null`, which
      // is a comparison to the literal and matches nothing.
      for (const [k, v] of Object.entries(eq)) q = v === null ? q.is(k, null) : q.eq(k, iso(v));
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    async insert(table, rows, { conflictIgnore = null, returning = 'id' } = {}) {
      if (rows.length === 0) return [];
      const payload = encode(rows);
      const q = conflictIgnore
        ? client.from(table).upsert(payload, { onConflict: conflictIgnore, ignoreDuplicates: true })
        : client.from(table).insert(payload);
      const { data, error } = await q.select(returning || '*');
      if (error) throw error;
      return data ?? [];
    },
    async update(table, eq, patch) {
      let q = client.from(table).update(encode([patch])[0]);
      for (const [k, v] of Object.entries(eq)) q = q.eq(k, iso(v));
      const { data, error } = await q.select('*');
      if (error) throw error;
      return data ?? [];
    },
    async remove(table, eq) {
      let q = client.from(table).delete();
      for (const [k, v] of Object.entries(eq)) q = q.eq(k, iso(v));
      const { error } = await q;
      if (error) throw error;
    },
  };
}

// ---------------------------------------------------------------------------
// seedDemoAccount — the row writer.
//
// `profileIds` maps a corpus key ('alex', 'rosa', ...) to a real profiles.id.
// Every row below is written in the order the real functions write them, so
// that every trigger sees the same world it would have seen:
//
//   private_hives_subject_not_active_contributor  (INSERT arm and UPDATE arm)
//   hive_contributors_not_hive_subject
//   private_hives_create_volume_one
//   private_hives_subject_pinned_by_rotation
//   private_hives_sealed_at_immutable / _sent_at_immutable
//   comb_rotations_one_open_per_comb
//   comb_members_owner_seat_permanent / _identity_immutable / _removed_at_immutable
//   comb_members_enforce_entitlements
//   entries_resolve_volume_id
//   entries_one_journal_per_day
//
// IDEMPOTENT by natural key at every level. Re-running writes nothing new.
// ---------------------------------------------------------------------------
export async function seedDemoAccount(db, { plan, profileIds, log = () => {} }) {
  const id = (key) => {
    const v = profileIds[key];
    if (!v) throw new Error(`seedDemoAccount: no profile id for corpus key "${key}"`);
    return v;
  };
  const nameOf = (key) =>
    key === DEMO_ACCOUNT_KEY ? DEMO_ACCOUNT_NAME : CAST.find((c) => c.key === key).name;

  const summary = { connections: 0, combs: 0, rotations: 0, hives: 0, entries: 0, streak: 0, skipped: [] };

  // --- honeycomb_connections ---------------------------------------------
  // unique_pair (requester_id, addressee_id) is the idempotency key.
  const connRows = plan.connections.map((c) => ({
    requester_id: id(c.requesterKey),
    addressee_id: id(c.addresseeKey),
    status: 'accepted',
    created_at: c.createdAt,
    responded_at: c.respondedAt,
  }));
  const conns = await db.insert('honeycomb_connections', connRows, {
    conflictIgnore: 'requester_id,addressee_id',
  });
  summary.connections = conns.length;
  log(`honeycomb_connections: ${conns.length} written, ${connRows.length - conns.length} already present`);

  // --- combs --------------------------------------------------------------
  for (const comb of plan.combs) {
    const ownerId = id(comb.ownerKey);
    const existing = await db.select('combs', { owner_id: ownerId, name: comb.name }, 'id');
    if (existing.length > 0) {
      summary.skipped.push(`comb "${comb.name}"`);
      log(`comb "${comb.name}": already seeded, skipped`);
      continue;
    }

    const [combRow] = await db.insert(
      'combs',
      [{ owner_id: ownerId, name: comb.name, created_at: comb.createdAt }],
      { returning: 'id' }
    );
    const combId = combRow.id;
    summary.combs += 1;

    // combs_create_owner_membership_trigger (20260830000002:364) has already
    // seated the organizer, at the real wall clock. This seed is writing
    // backdated history and the organizer's joined_at is LOAD-BEARING: it is
    // the earliest seat, and comb_advance_rotation's subject walk
    // (20260830000011:287-315) resolves every month after the first from it.
    //
    // comb_members_identity_immutable_trigger forbids UPDATEing joined_at, by
    // design, so the trigger's row is deleted and re-inserted with the
    // correct timestamp. DELIBERATE DEVIATION, stated rather than hidden: the
    // guard exists to stop a seat being RETARGETED to a different person
    // (20260830000002:209-214). Same comb, same profile, same seat, one
    // corrected timestamp. Nothing else in this file deletes a row.
    await db.remove('comb_members', { comb_id: combId, profile_id: ownerId });
    await db.insert(
      'comb_members',
      comb.members.map((m) => ({
        comb_id: combId,
        profile_id: id(m.key),
        joined_at: m.joinedAt,
      })),
      { conflictIgnore: 'comb_id,profile_id', returning: 'comb_id' }
    );

    for (const month of comb.months) {
      const subjectId = id(month.subjectKey);

      // 1. The mint's private_hives row. cover_theme / review_cadence /
      //    relationship left to their defaults because the mint leaves them
      //    there.
      const [hiveRow] = await db.insert(
        'private_hives',
        [
          {
            owner_id: ownerId,
            subject_name: nameOf(month.subjectKey),
            is_collective: true,
            subject_profile_id: subjectId,
            created_at: month.mintedAt,
          },
        ],
        { returning: 'id' }
      );
      const hiveId = hiveRow.id;

      // 2. Volume 1 exists already (trigger). Backdate it.
      const [volume] = await db.select('hive_volumes', { hive_id: hiveId, ordinal: 1 }, 'id');
      await db.update('hive_volumes', { id: volume.id }, { created_at: month.mintedAt });

      // 3. Roster snapshot: every member except the subject, invited_by the
      //    comb owner. hive_contributors_not_hive_subject_trigger would refuse
      //    the subject; the mint excludes them in the SELECT instead, and so
      //    does this.
      await db.insert(
        'hive_contributors',
        comb.members
          .filter((m) => m.key !== month.subjectKey)
          .map((m) => ({
            hive_id: hiveId,
            profile_id: id(m.key),
            invited_by: ownerId,
            added_at: month.mintedAt,
          })),
        { conflictIgnore: 'hive_id,profile_id', returning: 'hive_id' }
      );

      // 4. The bridge row. Delivered months carry sealed_at/sent_at at insert
      //    so that comb_rotations_one_open_per_comb never sees two open rows,
      //    not even momentarily.
      await db.insert(
        'comb_rotations',
        [
          {
            comb_id: combId,
            ordinal: month.ordinal,
            hive_id: hiveId,
            subject_profile_id: subjectId,
            closes_at: month.closesAt,
            created_at: month.mintedAt,
            sealed_at: month.resolvedAt,
            sent_at: month.resolvedAt,
          },
        ],
        { returning: 'id' }
      );
      summary.rotations += 1;

      // 5. Entries. volume_id is set explicitly, which makes
      //    entries_resolve_volume_id_trigger a no-op rather than something to
      //    depend on. A delivered month's entries are 'sent' and carry the
      //    seal-time name snapshot; an open month's are 'private' with a null
      //    snapshot, exactly as the seal has not happened.
      const delivered = month.state === 'delivered';
      await db.insert(
        'entries',
        month.entries.map((e) => ({
          user_id: id(e.writer),
          hive_id: hiveId,
          volume_id: volume.id,
          content: e.text,
          entry_date: e.entryDate,
          created_at: e.createdAt,
          visibility: delivered ? 'sent' : 'private',
          author_name_at_seal: delivered ? nameOf(e.writer) : null,
        })),
        { returning: 'id' }
      );
      summary.entries += month.entries.length;

      if (!delivered) continue;

      // 6. The seal. NO successor volume: seal_and_send_rotation deliberately
      //    does not open one (20260830000009:197-203 plus ...0003's long note
      //    on why), which is the single sharpest difference between a
      //    rotation hive and a hand-sealed one.
      await db.update('hive_volumes', { id: volume.id }, { sealed_at: month.resolvedAt });
      await db.update(
        'private_hives',
        { id: hiveId },
        {
          sealed_at: month.resolvedAt,
          sent_at: month.resolvedAt,
          contributor_names: contributorNames(month.entries, nameOf),
        }
      );

      // 7. The feed announcement. sender_id is the HIVE's owner, which for a
      //    rotation is the comb organizer. NOTE, observed rather than
      //    designed: Comb A's month 4 has Alex as both organizer and subject,
      //    so this row genuinely has sender_id = recipient_id. That is what
      //    the real RPC writes (20260830000009:224-225); the table has no
      //    self-reference check, unlike honeycomb_connections. Replicated
      //    faithfully rather than quietly skipped.
      await db.insert(
        'hive_send_events',
        [{ sender_id: ownerId, recipient_id: subjectId, created_at: month.resolvedAt }],
        { returning: 'id' }
      );
    }
    log(`comb "${comb.name}": ${comb.months.length} rotations, ${comb.members.length} members`);
  }

  // --- legacy 1:1 private hives ------------------------------------------
  // The idempotency key has to EXCLUDE rotation hives, and finding that out
  // cost a red gate rather than a guess: comb_open_rotation mints a
  // private_hives row owned by the comb organizer with subject_name set to
  // the subject's display name, so (owner_id = Alex, subject_name = 'Priya')
  // already matches two rotation hives (Comb A month 3, Comb B month 2)
  // before this loop ever runs. Keyed on "owned by this person, named for
  // this subject, and NOT referenced by any comb_rotations row" instead,
  // which is the same linkage ENG-101 keys its own refusals on
  // (20260904000002:66, :109) rather than a second discriminator invented
  // here.
  const rotationHiveIds = new Set(
    (await db.select('comb_rotations', {}, 'hive_id')).map((r) => r.hive_id)
  );
  for (const hive of plan.hives) {
    const ownerId = id(hive.ownerKey);
    const existing = (
      await db.select('private_hives', { owner_id: ownerId, subject_name: hive.subjectName }, 'id')
    ).filter((h) => !rotationHiveIds.has(h.id));
    if (existing.length > 0) {
      summary.skipped.push(`hive for ${hive.subjectName}`);
      log(`hive for ${hive.subjectName}: already seeded, skipped`);
      continue;
    }

    // HiveStore.createHive (src/services/HiveStore.js:339-349) inserts
    // WITHOUT subject_profile_id; the link to a real account is a later
    // UPDATE (the path 20260830000002:52-55 describes). Both steps are
    // reproduced, which is also what exercises
    // private_hives_subject_not_active_contributor's UPDATE arm.
    const [hiveRow] = await db.insert(
      'private_hives',
      [
        {
          owner_id: ownerId,
          subject_name: hive.subjectName,
          cover_theme: hive.coverTheme,
          review_cadence: hive.reviewCadence,
          relationship: hive.relationship,
          is_collective: hive.isCollective,
          created_at: hive.createdAt,
        },
      ],
      { returning: 'id' }
    );
    const hiveId = hiveRow.id;
    summary.hives += 1;

    await db.update('private_hives', { id: hiveId }, { subject_profile_id: id(hive.subjectKey) });

    const [volume] = await db.select('hive_volumes', { hive_id: hiveId, ordinal: 1 }, 'id');
    await db.update('hive_volumes', { id: volume.id }, { created_at: hive.createdAt });

    await db.insert(
      'hive_contributors',
      hive.contributorKeys.map((key) => ({
        hive_id: hiveId,
        profile_id: id(key),
        invited_by: ownerId,
        added_at: hive.createdAt,
      })),
      { conflictIgnore: 'hive_id,profile_id', returning: 'hive_id' }
    );

    const sent = hive.state === 'sent';
    await db.insert(
      'entries',
      hive.entries.map((e) => ({
        user_id: id(e.writer),
        hive_id: hiveId,
        volume_id: volume.id,
        content: e.text,
        entry_date: e.entryDate,
        created_at: e.createdAt,
        visibility: sent ? 'sent' : 'private',
        author_name_at_seal: sent ? nameOf(e.writer) : null,
      })),
      { returning: 'id' }
    );
    summary.entries += hive.entries.length;

    if (!sent) {
      log(`hive for ${hive.subjectName}: open, ${hive.entries.length} entries, never sealed`);
      continue;
    }

    // seal_volume DOES open a successor volume (20260904000002:82-83). This
    // is the legacy path, not the rotation path, so the successor is written.
    await db.update('hive_volumes', { id: volume.id }, { sealed_at: hive.sealedAt });
    await db.insert(
      'hive_volumes',
      [{ hive_id: hiveId, ordinal: 2, created_at: hive.sealedAt }],
      { returning: 'id' }
    );
    await db.update(
      'private_hives',
      { id: hiveId },
      {
        sealed_at: hive.sealedAt,
        sent_at: hive.sentAt,
        contributor_names: contributorNames(hive.entries, nameOf),
      }
    );
    await db.insert(
      'hive_send_events',
      [{ sender_id: ownerId, recipient_id: id(hive.subjectKey), created_at: hive.sentAt }],
      { returning: 'id' }
    );
    log(`hive for ${hive.subjectName}: sealed and sent, ${hive.entries.length} entries`);
  }

  // --- personal streak ----------------------------------------------------
  // Same merge-not-overwrite posture as EntryStore.seedDemoData
  // (src/services/EntryStore.js:158-192): read the dates that already exist,
  // insert only the gaps. entries_one_journal_per_day would refuse a
  // duplicate anyway; this makes a re-run quiet instead of a 23505.
  const alexId = id(DEMO_ACCOUNT_KEY);
  const existingStreak = await db.select('entries', { user_id: alexId, hive_id: null }, 'entry_date');
  const have = new Set(existingStreak.map((r) => readDate(r.entry_date)));
  const streakRows = plan.streak
    .filter((s) => !have.has(s.entryDate))
    .map((s) => ({
      user_id: alexId,
      content: s.text,
      theme: s.theme,
      entry_date: s.entryDate,
      created_at: s.createdAt,
      visibility: 'private',
    }));
  await db.insert('entries', streakRows, { returning: 'id' });
  summary.streak = streakRows.length;
  log(`streak: ${streakRows.length} entries written, ${plan.streak.length - streakRows.length} already present`);

  return summary;
}
