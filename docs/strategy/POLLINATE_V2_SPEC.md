# Pollinate V2 — Specification

**Status:** Adopted as the governing V2 spec by Colin, 2026-08-25 (#CEO action
items, event `d99dd08d…`); amended by Colin's Amendment 2026-08-25 (event
`ad945232…`) — §6 closed, nothing left waiting on Colin.
*[Amended 2026-09-03 (Vector) — scope of that last clause: it covers §6's **ruling list**, not the document. §20.4 obligation 4 still needs Colin for `LEGAL_ENTITY` and `CONTACT_EMAIL`.]*
Amended 2026-08-26 (navigation ruling, event `4e4d6d3d…`): §5.2(b) honeyed-mark
correction; tab bar 4 → 3 per `POLLINATE_V2_NAVIGATION.md` and the 2026-08-26
amendment in `Pollinate_The_Ruling.md`.
**Date:** 2026-08-24 (adopted 2026-08-25, amended 2026-08-25 and 2026-08-26)
**Amendments:** §16.5 rewritten 2026-08-25 (Lumen) — filing moved from RPC/move to copy semantics after Pixel's read-path finding; see the section's amendment block. This changes the file's content hash relative to Colin's Amendment 2026-08-25 bytes; commit `384d35e` preserves those verbatim.
**Supersedes:** the Slice 2 wallet direction in `Pollinate_PRD.md` §5.6, `Pollinate_Strategy.md` §6, and the Slice 2 rows of `Pollinate_Delivery_Slices.md`. Does **not** supersede anything in Slice 1 — ~~Slice 1 ships first, unchanged.~~ *[Amended 2026-08-31 — the final clause is retired: `POLLINATE_COMB_ROTATION.md` §9 (`O5` closed, `a11aa144…`) rules ONE release, MVP-Comb. The supersession scope above (wallet direction, Slice 2 rows) is unchanged; only "Slice 1 ships first, unchanged" is withdrawn.]*
**Companion:** `POLLINATE_V2_ASSIGNMENTS.md` (issue-by-issue work breakdown).

> **AMENDED 2026-08-30 — the Comb Rotation Ruling (Colin, #Strategy event
> `0effa81d…`; prior same-thread ruling `482eee85…` bars physical printing).**
> **`POLLINATE_COMB_ROTATION.md` governs where the two disagree.** The comb
> rotation (§18.2) is promoted from Cycle 11–12 to the hero of the product;
> private hives become the personal mode. The revenue model in §17.5 is
> superseded: the paid line is a **per-user subscription** unlocking **more than one comb to write in** and **more than 5 members** in a comb you run (free: 1 comb, 5 members). **Receiving is never metered** — a comb may write for anyone, member or not. **The price is deliberately unruled** until conditions C1 and C5 return data (ceiling ~$39/yr, annual preferred). §17.5.2's
> $39.99 annual-only line, §17.5.3's install table and §17.5.4's `Family / comb
> plan` row are superseded in place; **§17.5.1's annual-over-monthly finding
> stands** (see the annotation there) — annotated below, bytes untouched, per this
> directory's append-only amendment discipline. **Not** superseded: §0's
> positioning, Projects 16/17, §17.4's durability promise, §17.5.2a's metering
> principle, §5.6's guardrails G1–G5, and 19a-before-19b phasing.
>
> **MVP scope, ruled 2026-08-30 (`cf648e7f…`):** the MVP — **MVP-Comb** — is
> Phases 0, 1 and 2 of `POLLINATE_COMB_ROTATION.md` §8.6, built to completion
> now. For this spec that means: **Project 18 (combs) and 19a (simulated nectar)
> are IN**, with §5.2(a)'s short note + nectar unscoped from the reveal so it can
> be sent any time. **19b, 19c and 19d are OUT** — no real sats, no Breez/Spark,
> no Privy, `LEGAL-1` and `OPS-3` stay parked until condition C5 returns. Project
> 21 (revenue) is Phase 4 and is **out of the MVP entirely**, including cap
> enforcement.

---

## 0. Positioning amendment (read first — everything below follows from it)

**Gratitude is the through-line, not the shelf.**

Gratitude is the correct *mechanic*: it is the only prompt that makes an 18-year
writing practice survivable. "Write about your son" is an essay. "What did he do
this week you're grateful for?" is answerable in 20 seconds and can be asked 900
times without going stale. It is also what unifies every hive — son, wife, friend,
parent — into one prompt engine.

Gratitude is the wrong *category*. The gratitude-app shelf is self-directed
(audience: me, output: a private log, price ceiling: ~$3/mo, retention: streak
guilt then churn). Pollinate is other-directed (audience: one specific person,
output: a gift they receive, price ceiling: a $99 book). The most-replicated
intervention in positive psychology is the **gratitude letter** — other-directed,
delivered — and nobody has productized it. That is the claim Pollinate owns.

**Consequences, binding on every spec below:**

| Lean IN (the writing surface) | Lean OUT (the buying surface) |
|---|---|
| Prompts, sparks, entry grammar, review ritual copy | App Store category, title, first line of description |
| The word "gratitude" inside compose and Memory Lane | Wellness / mental-health framing |
| "Gratitude letter" as the marketing story | "Gratitude journal" as the product noun |
| The review ritual as the return mechanic | Streaks-with-guilt as the return mechanic |
| Private, 1:1, for a named person | A public gratitude feed (performative gratitude kills this) |

> **Amended 2026-08-30 (`POLLINATE_COMB_ROTATION.md` §5.1).** One row is *added*
> to the table above, and nothing in it is removed: **lean IN on "the comb — a
> closed group writing for one member at a time"; lean OUT on "community,"
> "group feed," "social network," "post."** This resolves rather than softens the
> lean-out against a public gratitude feed: a comb is closed, capped at 20, and
> *writes* rather than posts, with co-authors blind to each other until seal
> (§18.1). There is no audience to perform for — only a subject.

Working pitch:

> **Pollinate turns gratitude into something you can give.**
> Every week, one small note about someone you love. Years later, they get all of
> it — as a book, or as a letter that opens on the day you chose.

---

## 1. What the current build cannot do (the gaps these projects close)

Verified against `github/main` @ `dae6685` and the live schema, 2026-08-24:

| Gap | Evidence | Blocks |
|---|---|---|
| A hive can be sealed **exactly once, ever**; sealed entries are immutable | `20260815000003/4/5/6`, `20260819000003_seal_hive.sql` | A hive dies after one send. No annual anniversary keepsake. |
| `send_hive()` requires `subject_profile_id` + an accepted connection | `20260819000001_private_hives_send.sql` | The subject must be a registered, connected user. A newborn cannot be. |
| No delivery outside the app; **zero export** | no `expo-print` / `expo-sharing` / Share sheet in `src/` | Nothing leaves the phone. No PDF, no book, no link, no email. |
| Hive entries have **no prompts** | `src/constants/prompts.js` is journal-only (`hive_id is null` paths) | The blank page inside a hive kills the multi-year practice by month four. |
| No relationship type on a hive | `private_hives` has `subject_name`, `cover_theme`, `review_cadence` only | One generic prompt register for four very different relationships. |
| A journal entry cannot be filed into a hive | `EntryStore` writes `hive_id = null` always; no reassignment path | The daily journal competes with hives instead of feeding them. |
| `private_hives` is strictly owner-only on every action | `20260815000001` policy block | No collective hives. No comb-authored gifts. |

---

## 2. Project 16 — The Prompt Engine (relationship-typed hives)

**Why first:** cheapest, and it improves the product already in testers' hands.

### 16.1 Relationship type on the hive

```sql
alter table public.private_hives
  add column relationship text not null default 'other'
    check (relationship in
      ('child','partner','parent','sibling','friend','mentor','other'));
```

Safe as `not null default` — same justification as `20260817000002` (cover_theme /
review_cadence). Collected in `CreateHive` as a second chip row under the name.

### 16.2 Prompt ladders

New client constant `src/constants/hivePrompts.js`. **It inherits the spark
composition contract from `prompts.js` verbatim** — lowercase noun phrase, no
leading preposition, no duplicate spark string — because hive sparks compose into
a sentence the same way. Extend `check:onboarding-flow` section D to assert the
contract over the new file.

Four registers, one per major relationship (sibling/mentor/other fall back to
`friend`):

| Relationship | Prompt register |
|---|---|
| **child** | firsts, changes, what they taught you, what you hope they keep, who they're becoming |
| **partner** | ordinary moments, why you chose them, what they carry for you, what you'd be sad to forget |
| **parent** | what you understand now that you didn't, things never said, inherited habits you're glad of |
| **friend** | showed up when, made you laugh, the thing only they do, the version of you they bring out |

Every prompt is subject-addressed by name at render time:
`"What did {subject_name} do this month that surprised you?"`

### 16.3 Age-keyed selection

Prompts must **age**. Year 1 and year 12 cannot ask the same thing.

- `child`: buckets `0-1 | 1-3 | 3-7 | 7-12 | 12-18 | 18+`, keyed on hive age (not
  the child's age — we don't collect a birthdate in v1).
- `partner`: `0-1y | 1-3y | 3-10y | 10y+`.
- others: `new | established` (2-year boundary).

Selection is **deterministic**, matching the `prompts.js` precedent (stable across
re-render and across a single day, no jumping):

```
index = hash(hive_id) + floor(days_since_hive_created / cadence_days)
prompt = ladder[bucket][index mod ladder[bucket].length]
```

No AsyncStorage state, no server round-trip, no repeat within a ladder pass.
This is a compounding asset: it can't be cloned from a screenshot because it only
reveals itself over years.

### 16.4 Entry grammar

Gratitude notes have a two-part shape: **the moment** + **what it revealed**.

```sql
alter table public.entries add column reflection text;
alter table public.entries
  add constraint entries_reflection_length check (char_length(reflection) <= 500);
```

Follows the `20260810000001_content_length_caps` precedent. Nullable — journal
entries never write it; hive entries render a second, optional field
("Why it stayed with you"). Optional by design: forcing both fields raises
friction on the thing we need to stay 20 seconds long. Better material is the
entire payload of the artifact, so the field is *offered*, never *required*.

### 16.5 File a journal entry into a hive

> **AMENDED 2026-08-25 (Lumen; thread `bf50e584…`, UX Design).** The RPC/move
> design this section originally specified is retired. Pixel's read-path
> finding (event `8f543fef…`): a move sets `entries.hive_id`, and every
> personal-journal read filters `hive_id is null`, so filing deleted the entry
> from Today, the streak, Recap, Wrapped, the share path, first-entry date,
> and the nudge re-arm — seven call sites, plus `entries_one_journal_per_day`
> (`where hive_id is null`) freeing the day for a second entry. Fizz's routing
> (event `3da67b75…`) replaces the mechanism below.

**Ruling — filing is a quotation.** The personal-journal row is never touched:
not moved, not flagged, nothing. Filing inserts a **new hive-scoped copy** of
the entry's text through the existing client insert path
(`HiveStore.addHiveEntry()`, on `fizz/luxury-wave2`); the seven read sites are
a non-event by construction, and the hive keeps frozen text for the keepsake.
No new RPC, no migration. This *extends* the share-is-a-quotation close
(design-system §28.9, workspace `GUIDES/GRATITUDE_DESIGN_SYSTEM_V1.md`: *"a
share is a quotation, and a quotation doesn't change when the source does"* —
itself a back-reference; the primary ruling was never encoded as a section
body) from `shares` to hive filing. It is a **new extension recorded here**,
not a citation of an existing hive ruling.

What replaces the original three guards:
1. **Ownership and sealed-ness ride the insert RLS** — `entries_insert_own`
   (`20260815000005`) enforces hive ownership and `sealed_at is null` at the
   database. A sealed refusal surfaces as SQLSTATE 42501 and must get its own
   copy line, never connection-failure copy (per `HiveStore.js`'s own caller
   contract).
   **Premise expiry (§17):** this enforcement reads `private_hives.sealed_at` —
   the column §17.1 rules read-only history. The moment ENG-46 stops writing
   it, `h.sealed_at is null` is permanently true for new hives and this
   refusal — with every sealed-content policy reading the same column
   (`20260815000005`, `20260815000006`, `send_hive` `20260819000001`,
   `seal_hive` `20260819000003`) — fails open silently. **Ruled (Sage,
   2026-08-25): re-point, not a derived mirror** — see §17.1. Sequencing (which
   migration, in what order) is §17.1a R3's acceptance criterion, not
   restated here. Enumeration: Pixel, workspace
   `GUIDES/POLLINATE_V2_DES16_FILE_TO_HIVE.md` §7a, 2026-08-25. ENG-46's
   "comment as read-only history" row is **not sufficient** as written.
2. **The direction guard evaporates** — there is no move to reverse. The
   journal row's `hive_id` never leaves `null`, so `entries_one_journal_per_day`
   is satisfied by construction.
3. **The `shared` block is retired (ruled Lumen 2026-08-25).** Its rationale
   was written for a *move* — the entry would leave the journal while staying
   publicly shared. With copy semantics nothing leaves the journal or the feed,
   and exposure only narrows (feed → one hive). The surface promise
   (`CreateHive`: *"You'll be the only one who sees this hive unless you choose
   to send it later"*) is about the **container**, not the provenance of its
   contents. Blocking would exclude exactly the entries most worth keeping —
   the ones good enough to have been shared. The **not-sealed half of the old
   guard 3 survives** via item 1.

Ratified behaviors (same thread):
- **Multi-hive filing is intended.** Each filing is an independent insert; an
  entry about a partner and a kid belongs in both hives.
- **Same-hive re-filing is a client-surface duty.** The database will not
  dedupe hive rows (deliberate, per `20260815000001`'s note), and a duplicate
  ships in the PDF and the reveal — so rows already holding the entry render
  `FILED` (same register as `SEALED`), non-tappable. Requires one scoped read
  (my `entries` rows where `entry_date` = key and `hive_id` is not null,
  selecting `hive_id`), taken **on expand** so a filing from another device is
  caught.
- **Implementation note:** the client's `entry.date` is a `'YYYY-MM-DD'`
  string; it must not reach a bare `new Date(string)` parse (UTC-midnight →
  the copy files dated *yesterday* west of UTC). Split-parse at the call site.

UX: in `TodayTab`, a saved entry gets a "File this to…" affordance listing the
user's hives, expanding **in place within the entry card** (there is no `Modal`
in `src/`; in-place expansion is the shipped archetype — see workspace
`GUIDES/POLLINATE_V2_DES16_FILE_TO_HIVE.md`). This is the bridge from the solo
on-ramp to the hero feature.

---

## 3. Project 17 — Volumes & Delivery (the structural unlock)

**Why:** this is what makes the two relationships Colin named actually work.

### 17.1 Volumes

A hive is a **relationship** (permanent, 18 years long). A volume is a **chapter**
(sealed independently). Sealing seals the current volume, not the hive forever.

```sql
create table public.hive_volumes (
  id uuid primary key default gen_random_uuid(),
  hive_id uuid not null references public.private_hives (id) on delete restrict,
  ordinal int not null,
  title text,
  sealed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (hive_id, ordinal)
);

alter table public.entries
  add column volume_id uuid references public.hive_volumes (id) on delete restrict;
```

- Creating a hive creates Volume 1 open. Sealing Volume N stamps `sealed_at` and
  opens Volume N+1. **The hive never dies.**
- `seal_hive(p_hive_id)` is replaced by `seal_volume(p_hive_id)`, same
  single-RPC-one-transaction shape as `20260819000003` (the "empty reveal" guard
  that migration exists to prevent applies unchanged).
- **Backfill:** every existing hive gets a Volume 1 carrying its current
  `sealed_at` / `sent_at`. Those two `private_hives` columns keep their
  one-directional immutability triggers and become **read-only history** — new
  code never writes them. Comment them as such; do not attempt to drop them
  (the triggers guarantee they cannot lie).
- **Ruled (Sage, 2026-08-25): re-point every sealed-content check to the
  volume, never a hive-level mirror of `sealed_at`.** Forced by the shape one
  bullet up — sealing Volume N opens Volume N+1 in the same transaction, so a
  hive has an open volume at every instant after creation except mid-write. A
  hive-level mirror of "current volume's sealed_at" would read null
  essentially always: it cannot distinguish "Volume 2 is open" from "nothing
  has ever sealed," so it enforces nothing. §17.1a R3 places this re-point in
  the second of the two migrations, never bundled with the writer move (no
  window where the client writes NULL against a policy requiring it). Via
  `entries.volume_id`:
  `entries_insert_own`/`entries_update_own` WITH CHECK (`20260815000005`),
  the insert/update/delete immutability trigger (`20260815000006`), and
  `send_hive` (`20260819000001`) — each trading its
  `private_hives.owner_id/sealed_at` join for
  `exists (select 1 from hive_volumes v where v.id = entries.volume_id and
  v.sealed_at is null and v.hive_id in (<caller's owned hives>))`.
  `seal_hive` (`20260819000003`) is retired by `seal_volume(p_hive_id)` above,
  which operates on `hive_volumes` directly and needs no re-point. Premise
  recorded at §16.5 item 1; this is the resolution, not a restatement.

**Mother–son:** Volume per birthday, 18 volumes, delivered as one package at 18 —
or one volume unlocking each birthday. **Husband–wife:** seal a volume every
anniversary, forever.

#### 17.1a Implementation refinements (ruled 2026-08-25)

Three constraints on `ENG-46`/`ENG-47`, from reviewing the shipped client against
the proposed re-point. These are acceptance criteria, not suggestions.

**R1 — Resolve `volume_id` in a trigger. The client does not change.**
`HiveStore.addHiveEntry` inserts `{user_id, hive_id, content, entry_date, theme}`
with no `volume_id`. The obvious fix — "HiveStore starts setting it" — creates a
client/server deploy-ordering hazard, and **on a mobile app we do not control when
users update**: an old binary in the wild would keep inserting NULL forever.

Instead, a `BEFORE INSERT` trigger on `entries` stamps `volume_id` from the hive's
currently-open volume whenever `hive_id is not null and volume_id is null`. Old
binaries keep working, `addHiveEntry` and the `ENG-42` filing RPC both get it for
free, and there is no ordering hazard to manage.

**R2 — "The currently-open volume" is a database guarantee, not an assumption.**
R1's trigger is only deterministic if exactly one open volume exists per hive:

```sql
create unique index hive_volumes_one_open_per_hive
  on public.hive_volumes (hive_id) where sealed_at is null;
```

`seal_volume()`'s "stamp N, open N+1" is then protected by the index — a
double-seal race cannot produce two open volumes, it errors. Same spirit as the
one-directional `sealed_at` guard (`20260815000004`).

**R3 — `ENG-46` ships as two migrations, not one.**

1. **Additive:** `hive_volumes`, `entries.volume_id`, the R2 index, the R1
   trigger, backfill Volume 1. Changes no behavior; safe to sit in production
   indefinitely.
2. **Re-point:** move the three sites (`entries_insert_own`/`update_own`, the
   sealed-entries immutability trigger, `send_hive`) from
   `private_hives.sealed_at` to the join through `volume_id`.

Between the two, every existing row has a correct `volume_id` and every new insert
gets one. **There is no window in which the client writes NULL against policies
that require it.** Ordering is the acceptance criterion.

### 17.2 Delivery

Three exits from a sealed volume. Only the first exists today.

```sql
create table public.hive_deliveries (
  id uuid primary key default gen_random_uuid(),
  volume_id uuid not null references public.hive_volumes (id) on delete restrict,
  channel text not null check (channel in ('in_app','link','export')),
  recipient_profile_id uuid references public.profiles (id) on delete set null,
  recipient_email text,
  token_hash text,               -- SHA-256 of the reveal token. NEVER the token.
  unlock_at timestamptz not null,
  delivered_at timestamptz,
  revealed_at timestamptz,
  created_at timestamptz not null default now()
);
```

**(a) In-app** — what `send_hive()` does today. Keep, rescoped to a volume.

**(b) Time-locked web reveal** — the one that unblocks the 18-year case.
A link (emailed on `unlock_at`, or handed over) opening
`pollinateapp.xyz/open/<token>`, which runs **the same bloom animation** in the
browser. **No install required.** This is non-negotiable: an 18-year-old
receiving the most emotionally loaded artifact of his life must not hit an App
Store page first. The app is the *upsell at the end of the reveal*
("Want to start one for someone?") — which is a far better viral loop than a feed.

> **Security rule, inherited from `20260813000002` (seeds):** the unlock gate is
> **server-side**. RLS gates rows, not columns; a reveal page that ships the
> entries and hides them in the client is not a time lock. The edge function
> returns `{ unlock_at, subject_name }` before unlock and the entries only after
> `unlock_at <= now()`. Store `token_hash`, never the token — a leaked DB dump
> must not be a leaked keepsake.

**(c) Export** — `expo-print` (HTML → PDF) + `expo-sharing`. Screen-and-archive
geometry, not print geometry: designed to be read on a phone and kept in an
inbox. **Free on every tier, forever** — this is the durability guarantee
(§17.4), not a feature. Printed volumes are cancelled (§17.5).

### 17.3 Scheduling

`unlock_at` delivery needs infrastructure that does not exist yet:
- `pg_cron` + a Supabase Edge Function sweeping due `hive_deliveries`.
- A transactional email provider (Resend or Postmark).
- **MX / inbox on `pollinateapp.xyz`** — currently unconfigured. Blocker.

Follow the seeds precedent (`20260813000002`): **the scheduler announces, it never
decides.** Whether a volume is unlocked is a pure function of
`unlock_at <= now()`. A missed cron run delays an email; it must never delay a
reveal.

### 17.4 The durability promise (a product requirement, not marketing)

The objection that kills the 18-year use case is *"why would I trust a startup
with 18 years of letters to my son?"*

**Ruled 2026-08-24 (Colin): delivery is digital only. No printed volumes, ever.**
That removes the physical fallback, so the digital guarantee now carries the
entire weight:

1. **Export is free, on every tier, forever, never metered.** Not a feature —
   the trust guarantee. Any proposal to gate it is a violation of this ruling.
2. **Annual archive email.** Once a year, every user with an open hive is emailed
   their own export unprompted. The archive lives in their inbox, not only on our
   servers — that is what makes the promise credible without a printed object.
3. **A written shutdown commitment in the legal copy:** if Pollinate shuts down,
   every user is emailed a complete export of every hive and volume before any
   service is switched off.
4. **The delivered volume is permanent.** A reveal link that has been delivered
   keeps working; it is not a subscription feature that expires with the card.

**No trust, no 18-year hives.** This is Lumen's copy work and it is load-bearing.
It is *more* load-bearing now than it was with a book in the plan, not less.

### 17.5 Revenue model (ruled 2026-08-24)

> **SUPERSEDED IN PART, 2026-08-30 — see `POLLINATE_COMB_ROTATION.md` §4.**
> A **per-user subscription** replaces $39.99/yr annual-only, and **the delivery
> meter is cancelled outright** (ruling O1 closed 2026-08-30: Pollinate is free
> for everything except the comb). Free: **1 comb you write in, 5 members in a
> comb you run.** Premium: unlimited combs, 20 members each. **Receiving is never
> metered.** **The price is not yet ruled** — deliberately blank until C1 and C5
> return (ceiling ~$39/yr, annual preferred). Everything below
> is left byte-intact and remains the record of the 2026-08-24 reasoning.
> Still live from this section, not superseded: **§17.5.2a's metering principle**
> ("meter the artifact, never the practice, never the graph" — the comb plan
> complies; see the ruling's §4.1), **§17.5.5's not-revenue list**, and the free
> tier's unlimited hives/entries/export.
> **Open, needs Colin (ruling O1):** whether individual Plus survives at all.
> Recommendation on file is to retire it. **`ENG-76` does not start until that is ruled.**


**Supersedes** the freemium table in `Pollinate_PRD.md` §5.1, the pricing rows in
`Pollinate_Strategy.md` §4, and the 2026-08-19 "1 hive, lifetime" ruling. A
vocabulary sweep across those files is owed — see `COPY-11`.

#### 17.5.1 The diagnosis: the old price was the wrong *shape*

> **Re-examined 2026-08-30 and LARGELY UPHELD** (`POLLINATE_COMB_ROTATION.md` §4).
> An earlier draft of this annotation said the finding below was superseded
> because a comb rotating monthly delivers a reveal every month. **That was
> withdrawn the same day.** It holds only for a *healthy* comb — and the failure
> mode that matters is a comb going quiet (August, holidays, a busy organizer),
> which is exactly when monthly billing loses the subscriber instead of giving
> the group a year to find its rhythm. **Annual over monthly stands.** What this
> section no longer governs is the *price* and the *meter*, not the *shape*.
>
> **The corollary is binding either way:** a comb that stops rotating churns.
> Rotation cadence and subscription retention are one number — condition C1.


Pollinate's value is **episodic** — enormous at the reveal, quiet for eleven
months. Monthly subscriptions fit high-frequency utility (Spotify, Notion) where
value is felt weekly. Billed monthly, an episodic product churns during the quiet
stretch and **the user never reaches the payoff that would have renewed them
forever.**

Every product with this shape has already learned it: Storyworth is $99/yr with
no monthly option; the time-capsule apps sell credits per capsule. Nobody in this
category sells monthly.

With printed volumes cancelled (§17.4), subscription carries 100% of the model,
so its shape is the whole game.

#### 17.5.2 The model

| Line | Ruled |
|---|---|
| **Pollinate Plus** | **$39.99/year. Annual only** — the monthly plan is retired, not repriced. |
| **Free tier** | **Unlimited hives, unlimited entries, forever.** Plus **the first delivery free, forever.** |
| **What Plus buys** | Every delivery after the first. |
| **Export** | Free on every tier, forever (§17.4). Never a paid feature. |
| **Zaps** | Free. 100% to the receiver, always (Apple 3.2.1(vii); guardrail G5, §5.6). |
| **Ads** | Never. The trust story *is* the product. |

**Why annual at $39.99.** $29.99 underprices "18 years of letters to my son,
guaranteed to exist" and anchors us as a cheap utility beside Storyworth's $99.
Annual also lands the renewal **next to the ritual** — a yearly review, a
birthday, an anniversary — instead of in a dead month. Stated tradeoff: a higher
price slows cold-start conversion, and cold start is the real risk. Accepted,
because lowering a price later is trivial and raising one is not.

**Why the paywall moves from creation to delivery.** The old line (1 hive,
lifetime) converts at the **empty state** — the moment of lowest emotional
investment — and leaves a user who has sent their one hive with no reason to keep
the app installed. Writing is what accumulates time, and **accumulated time is
the entire moat**, so writing must be unmetered. Delivery is the moment of
realized value, peak willingness to pay, and the only thing that actually costs
us infrastructure.

**Why the first delivery is free forever.** It preserves the viral reveal, and it
is the demo. Nobody should have to pay to find out what the product does.

#### 17.5.2a The three secondary gates (ruled 2026-08-25)

Raised by the pricing sweep: §17.5.2 defined the delivery meter but was silent on
the old free/paid splits for **review cadence**, **friend connections** and
**seeds**. Four table rows carried a "flagged for ruling" marker pending this.

**Ruled: all three gates are removed. Volume delivery is the only meter.**

> **Split 2026-08-30, because this sentence now carries two claims with different
> fates.** The **principle stands**: meter the artifact, never the practice, never
> the graph — and the comb plan complies (`POLLINATE_COMB_ROTATION.md` §4.1
> explains why charging for the rotation engine is not charging for the graph).
> The **"only meter" clause is superseded**: the comb plan is a second meter, and
> volume delivery is no longer the primary one. The three gate removals below are
> unaffected and remain ruled.

| Old gate | Ruled | Why |
|---|---|---|
| Review cadence — yearly free / monthly Plus | **Removed. All cadences free.** | The review ritual is the return mechanic (§0). Gated to yearly, a free user has eleven months with no reason to open the app — they churn *before* accumulating enough to deliver, and never reach the meter. **The gate that maximizes conversion at delivery is no gate on the review.** A free user on monthly reviews arrives at the paywall with a fatter hive and more sunk investment. |
| Friend connections — 1 free / unlimited Plus | **Removed. Unlimited, all tiers, including combs.** | A vestige of the pre-`ENG-48` architecture where `send_hive` required an accepted connection; delivery is now link-based with no install (§17.2b). It also contradicts the GTM: combs cap at 20 (§18.2), so a 1-friend free tier makes combs impossible on free and kills the seeded-friend-group cold start. |
| Seeds — 1 free / unlimited Plus | **Removed. Unlimited and free. Not folded into the delivery meter.** | A seed is structurally a one-entry delivery, so folding it in is tempting — resist. Every seed is a bloom landing on someone who may not have the app, which makes seeds a reveal-generation machine feeding §17.5.3. Metering the cheapest viral action to protect a paywall is backwards. **Abuse is a rate limit (~5/week), not a price** — different problem, different tool. |

**The principle, so this generalises without another ruling:**

> **Meter the artifact. Never the practice, never the graph.**
> Writing, reviewing, connecting and seeding are practice or distribution — they
> build the moat and feed the funnel. The finished, delivered volume is the
> product, and it is the only thing that costs money.

#### 17.5.2b The hole this exposes: the hero use case pays nothing

> **Read forward, 2026-08-30: this section is the diagnosis that produced the
> Comb Rotation Ruling.** It stays true and is not superseded — the 18-year
> mother still pays $0, and gates on writing would still destroy the moat. What
> changed is the answer. Point 1 below already named it: *"revenue comes from the
> multi-hive, multi-delivery user — partner and kids and parents and **comb
> rotations**."* The ruling promotes that clause to the whole model
> (`POLLINATE_COMB_ROTATION.md` §2, problem P3). Point 2's legacy-tier answer
> (`ENG-80`) is unaffected and remains Slice 3.


Stating this plainly rather than letting it hide, because it was not visible when
§17.5 was written and it changes what "success" looks like.

With **unlimited everything free** plus **the first delivery free forever**, the
18-year mother–son user — the emotional hero of this entire product — **pays $0
across eighteen years and delivers for free at the end.**

That is not a bug to patch by re-adding gates. Gates on writing would destroy the
accumulated time that *is* the moat. It is a fact to plan around:

1. **The hero emotional use case is not the hero revenue use case.** The 18-year
   mother is the marketing story and the virality engine, not the ARPU. Revenue
   comes from the **multi-hive, multi-delivery** user — partner *and* kids *and*
   parents *and* comb rotations — who blows past one delivery in year one.
2. **The long-horizon case is monetised by the legacy tier, not the
   subscription** (§17.5.4, ~$199 one-time). A hive with a 10+ year unlock is
   precisely the escrowed-delivery product: verified beneficiary email, annual
   address-still-resolves confirmation. **The mother's willingness to pay is for
   certainty, not for features** — and certainty is the one thing a free tier
   structurally cannot offer. That is the correct capture point for her, and it
   moves the legacy tier from "nice Slice 3 idea" to **the answer for the
   flagship use case.**
3. **`ENG-80` (legacy tier) should be re-read against this.** It was scoped as a
   second-order line; on this reading it is closer to core.

#### 17.5.3 The number the business actually rests on

> **Install table superseded 2026-08-30** (`POLLINATE_COMB_ROTATION.md` §4.4):
> at ~$39/yr per user, $1M **gross** is ~25,600 paying users — but the pool is
> every comb member, not one organizer per comb, and every comb over five members
> yields at least one payer. Not 730K installs at 4% conversion. **The
> reveal→signup question below is NOT superseded** — `ENG-78` remains the
> highest-priority single analytics event, and it is now condition **C2** of four
> (§6 of the ruling). C1 — rotation participation — outranks it as the number
> that decides the business.


Net of Apple's 15% (see `OPS-7`), $39.99 yields ~$34/subscriber/year.

| Installs | @ 4% conversion | Net ARR |
|---|---|---|
| 10,000 | 400 | ~$13.6K |
| 100,000 | 4,000 | ~$136K |
| 730,000 | 29,000 | **~$1M** |

**This is not a venture-scale business below the hundreds of thousands of
installs, and the only path there that does not burn cash is the reveal loop.**

So one metric dominates everything else in this document:

> **What percentage of people who open a delivered reveal start their own hive?**

At 25%, with each paying user delivering to ~3 people a year, that is 0.75 new
users per paying user annually — real CAC relief, though under 1.0 and therefore
not self-sustaining alone. Combs are the multiplier: one rotating comb of 20
produces 20 reveals a year (§18.2).

**`ENG-78` instruments this first, before any other analytics event.** If it comes
back at 5% rather than 25%, the monetization is not the problem — the reveal is,
and the correct response is `DES-17`, not a price change.

#### 17.5.4 Second-order lines (Slice 3, not now)

> **The `Family / comb plan` row below is superseded, 2026-08-30.** It is no
> longer second-order, no longer Slice 3, no longer $79/yr, and no longer capped
> at 6 seats: it is **the only paid line — a per-user subscription unlocking
> unlimited combs and 20 members each** (`ENG-79`, re-scoped). The **Gifted subscription** and **Legacy tier** rows are
> untouched and remain Slice 3.


| Line | Price | Why it fits |
|---|---|---|
| **Gifted subscription** | $39.99 | The person who just received a hive is by definition the human most likely to want one. This is Storyworth's actual growth engine — people buy it *for* someone. Bundled with delivery via Apple IAP (`ENG-77`). |
| **Family / comb plan** | $79/yr, up to 6 | The natural unit is a family, not a person — mom, dad and two grandparents on one son's hive. Higher ARPU, near-zero incremental cost, matches how collective hives are actually used (§18.1). |
| **Legacy tier** | ~$199 one-time | For hives with a 10+ year unlock: escrowed delivery, verified beneficiary email, annual confirmation the address still resolves. **People pay real money for certainty about the future.** It monetizes the trust problem (§17.4) head-on instead of working around it, and no competitor can offer it credibly. |

#### 17.5.5 Explicitly not revenue

- **Export.** Gating it would trade an 18-year promise for a few dollars.
- **Receiving.** Metering it kills the viral loop.
- **Zaps.** Apple 3.2.1(vii) requires 100% to the receiver, and a take rate
  weakens the money-transmitter position (§5.6, G5). Both regimes agree.
- **A "premium keepsake PDF."** Charging for a nicer version of a thing we
  promised free undermines the promise for ~$8.
- **Ads.** Non-negotiable.
- **Bitcoin, in any form.** 19b/c/d produce **zero direct revenue and should**.
  Their value is distribution — the bitcoin community has unusually high
  willingness to pay for self-custody products and an unusually strong evangelism
  culture. **Judge 19c on acquisition, never on monetization.**

---

## 4. Project 18 — Collective Hives & Combs

### 18.1 Collective hives (the growth engine hiding in the hero feature)

Mom, Dad, both grandparents and a godmother writing into **one** hive for the son.
Storyworth is single-storyteller. Nestori is parent→child. A six-author artifact
is genuinely novel — and every contributor invited is a new user who arrives with
real content already written. **This is the only viral loop that doesn't require
a feed.**

```sql
create table public.hive_contributors (
  hive_id uuid not null references public.private_hives (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  invited_by uuid not null references public.profiles (id),
  joined_at timestamptz not null default now(),
  primary key (hive_id, profile_id)
);
```

**RLS — the delicate part.** `20260815000001` states the case for owner-only
plainly ("The first OWNED entity in this schema… Full stop, owner only, on every
action"). Widening it needs the same care that block shows:

- `private_hives` keeps owner-only SELECT, **plus** one contributor policy routed
  through a `security definer` helper `is_hive_contributor(hive_id)` — the same
  recursion-breaking shape as `owns_entry()` (`20260809000004`). A raw `exists()`
  over `hive_contributors` inside a `private_hives` policy re-triggers the 42P17
  class that migration fixed.
- **Contributors see only their own entries until the volume is sealed.** This is
  a product rule, not a limitation: *you don't see what the others wrote until
  it's sealed.* It preserves the surprise for the co-authors too, and then
  everyone — contributors and recipient — sees all of it at the reveal.
- Only the owner can seal. Only the owner can deliver.

##### 18.1a Scoping constraints (ruled 2026-08-25)

**C1 — Sequenced after volumes land and settle.** The "contributors see only
their own until seal" rule joins through `volume_id → hive_volumes.sealed_at`
(§17.1). Building contributor RLS against a schema mid-migration doubles the
recursion surface for no gain. Volumes ship, stabilise, *then* Project 18 gets a
branch.

**C2 — `is_collective` is set at creation and immutable.** A hive is solo or
collective **from birth**. Converting a solo hive to collective later would
retroactively expose existing entries to a brand-new reader — that is how privacy
incidents happen. Enforce with the same one-directional trigger pattern as
`sealed_at` (`20260815000004`).

Two payoffs: the solo path keeps `20260815000001`'s owner-only policies
**completely untouched**, and contributor policies branch on an immutable boolean
rather than on the existence of `hive_contributors` rows — which change over time
and would otherwise make a policy's behaviour time-dependent.

**C3 — On reversing the 2026-08-15 stance.** That call was right for what it
described and it stays right. Re-read it: it is an argument about a hive with an
audience of one, whose subject is not a party to it. That is still every solo
hive, and those policies do not move. What changes is that a second object now
exists which the 08-15 reasoning never contemplated — a hive with multiple
*authors*, which is a different thing from a hive with multiple *readers*. This
is a scoped extension, not a repudiation.

**C4 — Contributor removal (ruled now, so it cannot stall the build).**
The case: dad writes into mom's hive for their son; they divorce.

- Removal **stops new writes.** It does **not** delete existing entries — they
  were written for the *subject*, not the owner, and deleting them would let an
  owner erase someone else's gift to their child.
- A contributor may delete **their own** entries while the volume is open.
- After seal, everything is immutable for everyone, contributors included —
  consistent with `20260815000006`.

### 18.2 Combs (the local friend group)

> **PROMOTED TO HERO, 2026-08-30 (Colin, event `0effa81d…`).** This section is no
> longer a Cycle 11–12 project — **the comb rotation is the product.** Private
> hives become the personal mode. The two cautions below are now *binding rather
> than advisory*: no photo feed, and **the friend feed is cut** — the Hive tab
> becomes comb-first. Design and engineering handoff:
> `POLLINATE_COMB_ROTATION.md` §7–§8. Build state, verified at
> `github/main@080edd5`: the schema below is **not built** (no `combs` /
> `comb_members` / `comb_rotations` migration, no `invite_code` path in `src/`),
> while §18.1's collective hives **are** (`20260827000001_multi_writer_hives.sql`,
> `InviteContributor.js`, `ContributingHive.js`). The foundation is in; the
> rotation engine is the gap.


Two honest cautions first: (1) **Locket and Retro own "small circle photo
sharing"** — do not build a photo feed, we lose; (2) a friend feed is the weakest
asset in the app and it competes for the attention hives need.

The defensible version is a group with a **ritual only Pollinate can run**.

```sql
create table public.combs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  invite_code text not null unique,
  member_cap int not null default 20,
  created_at timestamptz not null default now()
);

create table public.comb_members (
  comb_id uuid not null references public.combs (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (comb_id, profile_id)
);

create table public.comb_rotations (
  id uuid primary key default gen_random_uuid(),
  comb_id uuid not null references public.combs (id) on delete cascade,
  subject_profile_id uuid not null references public.profiles (id) on delete cascade,
  hive_id uuid references public.private_hives (id) on delete set null,
  opens_at timestamptz not null,
  closes_at timestamptz not null
);
```

- Invite-link joined, hard-capped at 20. Local and high-trust by construction:
  a run club, a recovery circle, a church small group, a college group chat.
- **The comb writes together, it does not post together.** Each rotation, the comb
  collectively fills one hive for one member — *"This month the comb is writing
  for Sarah."* Everyone contributes; on her birthday it seals and blooms for her.
  Then it rotates.
- That is a collective hive on a schedule. Locket and Retro cannot do it.
- **Rotation is also the cold-start unlock**: one seeded comb of 20 produces 20
  reveal moments a year and 20 people who have each written for someone else.

Onboarding must have a first-class "start a comb, invite by link" path. Friend-
by-friend email matching is not how a real friend group arrives.

---

## 5. Project 19 — Nectar Zaps (the Bitcoin layer)

### 5.1 The placement insight

The old wallet plan attached money to the **gift**. That was the mistake: the
value of an 18-year letter is *time*, and stapling $10 to it cheapens the only
thing that is actually defensible.

**A zap is not a gift. It is a reaction with skin in the game.** That is a
completely different slot — and the slot is already carved out and empty:

> Reply/react to a received package was deferred to Slice 1.1 (ruled 2026-08-17,
> Slices row 8b.8). `PackageOpen` currently ends with a plain Close.

**The zap goes exactly there.** The recipient, who has just read twelve months of
someone noticing them, cannot say anything back that is big enough. So they send
nectar.

This is also thematically exact rather than bolted on: gratitude *is*
other-directed value transfer, and value-for-value is the purest expression of it.

### 5.2 Why this is a real differentiator

Primal and Damus show you a number going up. Pollinate has an entire visual
metaphor sitting unused, and **the animation primitives already exist in the
repo** — `FlyingBee.js`, `pollinationFlight.js`, `flightSequencer.js`,
`HoneyDropProgress.js`, `GlowOrb.js`, `CelebrationRays.js`, `combLattice.js`.

Four experiences, in order of how uniquely Pollinate they are:

**(a) Nectar is sats.** Bees collect nectar; the comb fills with honey. Sending a
zap flies a honey drop along the existing pollination flight path between two
hexagons. Denominate in **nectar drops**, not sats, in all default UI.

**(b) The honeycomb *is* the wallet.** Received nectar shows on your own hexagon
cell as a third state **mark** — `honeyed` — stacking with the blooming ring.

> **Corrected 2026-08-26.** An earlier draft said nectar "fills" the cell. It
> cannot: `hexTintFor` (`src/components/Avatar.js`) and its application in
> `HoneycombGrid` carry a Pixel ruling of
> 2026-08-13 — *cell fill is identity, marks and rings are state.* Fill is a
> name-hashed identity tint whose range is capped per tint (a `washSky` member's
> range measured under half of `washYellow`'s), so a fill-borne balance would
> read permanently quieter for some members than others. Marks are
> tint-independent; state lives there. The mark's geometry is already designed
> and measured: DES-24 (workspace `GUIDES/POLLINATE_V2_DES24_HONEYED_HEXAGON.md`) — the
> honeyed+seeded combination is unreachable by construction (honeyed is
> own-cell-only; `no_self_seed`, `20260813000002`), and blooming-over-honey is
> measured and ruled (the ring stays ink). There is no Wallet tab in this
> design — your balance is your comb.

Nobody else has this, and it is the single best argument that Pollinate's bitcoin
layer is native rather than bolted on.

**(c) Zap the entry, not the person.** Mid-reveal, on entry 7 of 12, the recipient
can zap *that specific memory*. The author later gets:
*"Sarah zapped the entry about the hospital waiting room."* That is a signal about
which memory landed — emotionally new, data no other app has, and a second return
moment for the author.

**(d) The comb pot.** *(Promoted 2026-08-30 to the flagship nectar feature — `POLLINATE_COMB_ROTATION.md` §5.2. Guardrail G2 unchanged and binding: contributions settle direct-to-recipient, the pot is a display over ledger rows.)* A collective hive for one member carries nectar alongside
entries. A birthday hive from six friends arrives with 30,000 drops in it. Group
gifting is a large real behavior (Venmo/GoFundMe) with terrible UX; this is a
Lightning-native version wrapped in something people actually want to open.

**(e) The time-locked nectar volume — the one that only Pollinate can do.**
A mother puts 10,000 sats into each birthday volume. At 18 her son opens eighteen
letters and roughly 180,000 sats. **Bitcoin as a savings vehicle wrapped in an
emotional artifact.** It is the only feature in the app that argues for being
bitcoin-denominated rather than dollar-denominated, and the argument is the whole
pitch: *$50 in 2026 versus 50,000 sats in 2044.* No app does this.

It is also the highest-risk item in this document — see §5.5.

### 5.3 Phasing (this is the de-risking, do not reorder)

**19a — Simulated nectar. Ships before any money exists.**
`POLLINATE_LEDGER_DESIGN.md` already specifies a double-entry ledger with
`ledger_settings.rails_mode` defaulting to `simulated`, on the unmerged branch
`bumble/nectar-ledger-schema`. **Use it.** Build the entire zap experience — the
honey-drop flight, the comb filling, the per-entry zap, the author's
"Sarah zapped the hospital entry" notification, the comb pot — against simulated
nectar. Ship it to friends-and-family.

Cost: no rails, no SDK, no Apple crypto surface, no regulatory exposure.
Payoff: **we learn whether the emotional mechanic works before spending a dollar
on infrastructure.** If people don't zap fake nectar, they will not zap real sats,
and we will have found that out for the price of some client work.

**19b — Real sats (Slice 2).** Breez SDK Spark (Rust core, Swift FFI — Breez is a
founding Spark operator; same protocol as the Lightspark SDK with better native
mobile bindings). Privy for email-derived MPC keys, so there is no seed phrase in
the normal path. Self-custodial: users hold their own keys, Pollinate never
takes custody, **Pollinate is not a money transmitter** (FinCEN FIN-2019-G001,
non-custodial wallet software). Funding via Cash App / Strike deep link
(`https://cash.app/launch/lightning/<bolt11>`, confirmed working). Withdrawal to
`user@cash.app` / `user@strike.me` Lightning Addresses (both confirmed live).
Flip `rails_mode` from `simulated`; the UX does not change.

**19c — A Lightning Address for every user: `name@pollinateapp.xyz`.**
An LNURL-pay endpoint (`/.well-known/lnurlp/<name>`) resolving to a Spark
invoice. Now anyone on nostr, Strike, Cash App, or Wallet of Satoshi can zap a
Pollinate user **from outside the app**. This is the distribution hook: it is how
the bitcoin community discovers Pollinate and evangelizes it, and it is how a
gratitude app becomes someone's first bitcoin address. Small server, large
strategic payoff.

**19d — Time-locked nectar volumes.** See §5.5.

### 5.4 Apple constraints (binding — verified against the current guidelines)

| Guideline | Requirement |
|---|---|
| **3.1.5(i)** | Self-custodial wallets permitted — **developer must be enrolled as an Organization**, not an Individual. Currently unset (`DEVELOPMENT_TEAM` empty). |
| **3.2.1(vii)** | Optional P2P gifts are exempt from IAP if 100% goes to the receiver and nothing is unlocked. Zaps must be **purely optional and unlock nothing.** Damus is the precedent. |
| **3.1.1** | Crypto may **not** unlock features. The paid subscription must use Apple IAP; sats can never buy it. *(Price reference updated 2026-08-30, re-cut 2026-08-30 after the final model: the subscription is the **per-user subscription**, price deliberately unruled until `C1` and `C5` return — `POLLINATE_COMB_ROTATION.md` §3/§4, `O4`; it is neither $39.99/yr nor the rejected $5.99/mo organizer-paid comb plan (§11). **The constraint itself is unchanged and binding**, and now also reads: nectar can never buy a comb plan, and a comb plan can never be earned by zapping.)* |
| **3.1.5(v)** | No currency for completing tasks. **"Earn sats for your streak" is banned.** No zap rewards for journaling. |
| **2.3.1(a)** | No hidden or dormant features. The wallet is created **only on explicit consent**, when the user first chooses to zap — never at signup. |
| **2.3 / 2.3.5** | Metadata must reflect the core experience. Stay in **Lifestyle**; the wallet is genuinely secondary. Precedent: Fountain (podcasts + Lightning) sits in Entertainment, not Finance. |

Write detailed App Review Notes describing the self-custodial model, the consent
flow, and the Damus precedent, before first submission with 19b in the binary.

### 5.5 Honest risks

1. **The 18-year custody problem (19d).** Three options, none clean:
   - *(a) Intent only.* Sats stay in the author's wallet; the volume records an
     amount and the transfer executes at delivery. Simplest, zero long-term
     custody — but she can spend it, so the promise is soft.
   - *(b) Per-hive locked sub-wallet.* A Spark key derived per hive; the UI treats
     it as locked. **This is a social lock, not a cryptographic one** — say so
     plainly in the UI. Recommended for v1.
   - *(c) Real timelock (CLTV).* Genuinely trustless, materially harder, and it
     interacts badly with Spark's unilateral-exit path. Research, not v1.
2. **Positioning dilution.** The keepsake story must stay primary. Zaps are
   invisible until opted into. "Bitcoin" appears in the consent screen and
   settings — **never in the App Store description or the marketing site.**
3. **Review risk.** A crypto surface in a Lifestyle app raises scrutiny.
   Mitigation: 19a ships first with no crypto at all, 19b's consent flow is
   explicit, and the review notes cite Damus.
4. **Volatility on an 18-year lock.** Feature, per Colin's thesis — but the UI
   must state it plainly at deposit time. No projected returns, ever.

### 5.6 Money transmitter analysis and guardrails

**Not legal advice — a formal opinion is required before 19b ships (§5.5).**
Reasoning below is from FinCEN's published guidance and is written to tell
counsel what to look at.

**The test.** 31 CFR 1010.100(ff)(5)(i)(A) defines money transmission as
**accepting** value from one person and **transmitting** it to another. FinCEN
FIN-2019-G001 §4.2 draws the line at custody, on four factors — who owns the
value, where it is stored, whether the owner interacts with the payment system
directly, and **whether the provider has total independent control**. Unhosted
wallet software fails the *accepting* prong outright, and 1010.100(ff)(5)(ii)
exempts providers of "the delivery, communication, or network access services
used by a money transmitter."

**The entire argument rests on one sentence, and everything below protects it:**

> **Pollinate never has the ability to move a user's funds.**

| Phase | Status |
|---|---|
| **19a** simulated nectar | **Not a money transmitter.** No money exists. Nectar must remain un-purchasable and un-redeemable — the moment it can be bought or cashed out it becomes a stored-value question. |
| **19b** self-custodial sats | **Very likely not**, if G1–G4 hold. |
| **19c** Lightning Address | **Conditional. See G3 — this is the real risk in the plan.** |
| **19d** time-locked volumes | **Not**, under option (b) only. See G4. |

#### The four guardrails (binding on implementation)

**G1 — Privy key shares.** MPC is self-custodial only if Pollinate holds **no**
share and Privy's share alone cannot move funds. **Verify Privy's threshold
configuration in writing before building on it.** Diligence item, not an
assumption. If any configuration exists where Privy + Pollinate can spend without
the user, the non-custodial claim fails.

**G2 — The comb pot must never pool.** As drafted in §5.2(d), six contributors
funding one recipient is *literally* accepting value from one person and
transmitting it to another — the definition, verbatim — if the funds rest
anywhere Pollinate controls. **Required design:** each contributor's sats go
**directly to the recipient's wallet at contribution time**; the "pot" is a
display aggregating ledger rows. Identical UX, completely different legal object.
A pooled balance is a licensing event.

**G3 — The LNURL server may resolve, never receive.** An endpoint returning an
invoice payable **directly to the user's own wallet** is address resolution — DNS
for payments. If Pollinate's infrastructure ever receives sats and forwards them,
that is custody and transmission, full stop. The hard part is that Lightning
Addresses must work while the user's phone is **offline**, which is precisely why
most Lightning Address providers are custodial. **Resolve Spark's offline-receive
path before committing to 19c. If the only workable answer routes funds through
our infrastructure, cut 19c** — it is the most expendable item in the plan and
carries the highest legal cost.

**G4 — 19d is option (b) or nothing.** Author-held per-hive keys: fine. "Pollinate
holds the sats and releases them at 18": custody, money transmission, and ~18
years of unclaimed-property/escheatment exposure. Kill on sight.

**G5 — No fee on zaps.** A cut does not by itself create MT status, but "in the
business of" is the fact pattern regulators look for. Apple 3.2.1(vii) requires
100% to the receiver regardless — both regimes want the same thing.

#### What staying non-custodial buys

No FinCEN MSB registration (31 USC 5330). No state money transmitter licenses
(~48 states, $50K–$200K legal, 12–24 months). No NY BitLicense. No BSA/AML
program, KYC, SARs, CTRs, or Travel Rule.

#### Owed regardless of MT status

- **OFAC binds everyone**, not only MSBs. Low practical risk here; the ToS must be
  unambiguous that Pollinate is software, not a financial service.
- **Formal legal opinion before 19b.** Budget ~$15–40K. The three questions to put
  in front of counsel: **Privy's MPC threshold (G1), the comb pot flow (G2), and
  the LNURL receive path (G3).**

### 5.7 What is now cancelled

The old Slice 2 plan — "attach a Cash App payment link to a gratitude note and
send it via iMessage" — is **superseded**. It monetized the gift (wrong slot),
required leaving the app, produced no in-app balance, and had no visual identity.
Nectar zaps replace it entirely. Lightspark **Grid** remains explicitly out:
bank transfers, debit cards and fiat on/off-ramps carry no moat for Pollinate.

---

## 5A. Project 20 — Analytics & Crash Reporting

**Ruled 2026-08-24 (Colin):** the current "we run no analytics" promise is
retired. Product telemetry and crash reporting are in scope.

### 20.1 What was actually required, and what was chosen

Apple guideline **5.1.1(i)** requires every app to link a privacy policy that
identifies what data it collects, how, and every use. **A privacy policy is
mandatory. The specific promise in `legalCopy.js` was not.** Two sentences went
further than any rule requires:

- `The short version`: *"There is no analytics, crash-reporting or tracking code
  in it either. Nothing here reports what you do back to us or to anyone else."*
- `What we do not do`: *"We do not include analytics, attribution or
  crash-reporting tools."*

That is a stronger commitment than Signal, DuckDuckGo or Apple make about their
own apps, all of which collect crash reports.

### 20.2 The rule: narrow the promise, don't delete it

Two different promises are currently fused into one sentence, and only one of
them is costing us anything:

| Promise | Verdict |
|---|---|
| We never read your entries. We never sell or share your data. No ad networks. No cross-app tracking. No data brokers. | **Keep.** This is what earns an 18-year hive, it costs nothing, and with print cancelled (§17.5) the trust story carries more weight than before. |
| We collect zero telemetry of any kind. | **Retire.** It blinds us on the exact product we are trying to validate, and no user has ever declined an app over crash reports. |

The rewritten copy should say what is true and still strong: *we measure how the
app is used and we collect crash reports, we never read what you write, and we
never sell or share anything about you.*

### 20.3 Scope

- **Crash reporting:** Sentry (or Crashlytics). Today the only handling is the
  in-app recoverable `ErrorBoundary` — we currently cannot see a crash at all.
- **Product analytics: first-party only.** Anonymous event + screen telemetry, no
  IDFA, no ad-network SDKs, no cross-app tracking. **Staying first-party is what
  keeps us out of App Tracking Transparency** — an ATT prompt on a gratitude app
  is a conversion tax we have no reason to pay.
- **Opt-out toggle** in Account settings, honored client-side, for GDPR/CCPA.
- **Never instrument entry text.** Event names and counts only. Content never
  leaves as telemetry — that is the half of the promise we are keeping.

### 20.4 Obligations that come with it

1. **`legalCopy.js` rewrite in the same commit as the first SDK.** House rule —
   that file's TRIPWIRE block (lines 20–37) names these exact sentences as
   falsifiable by roadmap features. Update the tripwire entry too, not just the
   prose.
2. **App Store Connect privacy nutrition labels** must declare Diagnostics
   (crash data) and Usage Data. Currently they would declare neither.
3. **Sub-processor disclosure** — Sentry and the analytics vendor join Supabase
   in the `Where your information is kept` section, with `HOSTING_REGION` accurate for each.
4. Nothing here unblocks the four `legalCopy.js` placeholders (`LEGAL_ENTITY`,
   `CONTACT_EMAIL`, `HOSTING_REGION`, `EFFECTIVE_DATE`) — those still mechanically
   gate the consent checkbox and still need Colin.

### 20.5 The 19a signal, without any of this

Worth stating so nobody blocks on it: **19a's validation does not depend on an
analytics SDK.** Whether people zap is `select count(*)` against the nectar
ledger — first-party rows we hold to make the feature work, not behavioral
tracking. Analytics is for everything *else* (where the hive flow drops off,
whether Memory Lane gets opened, which prompts produce entries).

---

## 6. Rulings — all closed 2026-08-25

**This section is empty. Nothing in this document is waiting on Colin.**

*[Amended 2026-09-03 (Vector).* **This sentence is about §6's rulings and is not a general clearance for the document.** *It is contradicted, in this same document, by §20.4 obligation 4: the four `legalCopy.js` `FILL` placeholders `LEGAL_ENTITY`, `CONTACT_EMAIL`, `HOSTING_REGION` and `EFFECTIVE_DATE` "still mechanically gate the consent checkbox and still need Colin." Two of the four now have answers — `HOSTING_REGION` = `ca-central-1` (Bumble) and `EFFECTIVE_DATE` is mechanical — and `LEGAL_ENTITY` and `CONTACT_EMAIL` remain live Colin decisions; all four are still `null` in source. Cite this line for the §6 ruling list only. It was cited once as a general ground, in `POLLINATE_V2_ASSIGNMENTS.md`'s COPY-9 deps cell, and that citation has been withdrawn.]*

All seven original rulings are decided and recorded in
`Pollinate_The_Ruling.md`, Amendment 2026-08-25 (and, for pricing, the
2026-08-24 entry):

| # | Ruling | Where the decision lives |
|---|---|---|
| 1 | Volumes replace one-shot seal — **yes** | §17.1, §17.1a |
| 2 | ~~Printed book~~ → cancelled; revenue model ruled | §17.4, §17.5, §17.5.2a |
| 3 | Web reveal requires no install — **yes** | §17.2(b), DES-17 |
| 4 | Multi-writer hives — **yes, scoped** | §18.1, §18.1a |
| 5 | Simulated nectar before real sats — **yes** | §5.3 |
| 6 | Bitcoin out of store-facing copy — **yes** | §5.5.2, §5.4 |
| 7 | Apple Organization enrolment — **yes, started** | `OPS-3`, §5.4 |

**Still owned by Sage, not Colin:** ratification of the recursion-safe
contributor RLS shape (§18.1) before Project 18 gets a branch. That is an
engineering sign-off, not a product ruling.
