# Pollinate V2 — Specification

**Status:** Adopted as the governing V2 spec by Colin, 2026-08-25 (#CEO action items, event `d99dd08daeeb5fef9c27d071d87cf239028fb85441a565bb086c6c5b306db5d5`: "add them as our updated ones … start working on the assignments"). That go-ahead is recorded as confirming the §6 rulings; §6 items that name a further action keep their actor (Sage: ratify §18.1's recursion-safe shape before any migration; Colin: the enrollments behind OPS-3 and OPS-7). Adoption encoded by Lumen 2026-08-25.
**Date:** 2026-08-24 (adopted 2026-08-25)
**Supersedes:** the Slice 2 wallet direction in `Pollinate_PRD.md` §5.6, `Pollinate_Strategy.md` §6, and the Slice 2 rows of `Pollinate_Delivery_Slices.md`. Does **not** supersede anything in Slice 1 — Slice 1 ships first, unchanged.
**Companion:** `POLLINATE_V2_ASSIGNMENTS.md` (issue-by-issue work breakdown).

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

New RPC — not a bare client UPDATE, because three guards have to hold in one
transaction:

```sql
create function public.file_entry_into_hive(p_entry_id uuid, p_hive_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
```

Guards:
1. Caller owns both the entry and the hive.
2. Entry currently has `hive_id is null` (**journal → hive only, one direction**).
   Reverse and hive→hive moves are out of scope: they'd have to reason about the
   `entries_one_journal_per_day` unique index, which is `where hive_id is null`
   on purpose (`20260815000001`).
3. Entry is not `shared` (an entry already on the feed cannot become private hive
   content), and the target hive's **current volume is not sealed** (§3) — sealed
   entries are immutable per `20260815000006`.

Apply the house revoke pattern (`20260813000005`): `revoke all ... from public`
**and** from `anon`, both lines.

UX: in `TodayTab`, a saved entry gets a "File this to…" affordance listing the
user's hives. This is the bridge from the solo on-ramp to the hero feature.

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

**Mother–son:** Volume per birthday, 18 volumes, delivered as one package at 18 —
or one volume unlocking each birthday. **Husband–wife:** seal a volume every
anniversary, forever.

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

**Supersedes** the freemium table in `Pollinate_PRD.md` §5.1, the pricing rows in
`Pollinate_Strategy.md` §4, and the 2026-08-19 "1 hive, lifetime" ruling. A
vocabulary sweep across those files is owed — see `COPY-11`.

#### 17.5.1 The diagnosis: the old price was the wrong *shape*

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

#### 17.5.3 The number the business actually rests on

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

### 18.2 Combs (the local friend group)

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

**(b) The honeycomb *is* the wallet.** Received nectar visibly fills your hexagon
cell. Hexagons already carry visual states (blooming / seeded / dormant); add
**honeyed**. There is no Wallet tab in this design — your balance is your comb.
Nobody else has this, and it is the single best argument that Pollinate's bitcoin
layer is native rather than bolted on.

**(c) Zap the entry, not the person.** Mid-reveal, on entry 7 of 12, the recipient
can zap *that specific memory*. The author later gets:
*"Sarah zapped the entry about the hospital waiting room."* That is a signal about
which memory landed — emotionally new, data no other app has, and a second return
moment for the author.

**(d) The comb pot.** A collective hive for one member carries nectar alongside
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
| **3.1.1** | Crypto may **not** unlock features. The $2.99/mo subscription must use Apple IAP. Sats can never buy Pollinate Plus. |
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
  in it either — nothing here reports what you do back to us or to anyone else."*
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
   in the `Where it lives` section, with `HOSTING_REGION` accurate for each.
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

## 6. Rulings needed from Colin before work starts

> **2026-08-25:** Colin's adoption go-ahead (event `d99dd08d…`, see Status header)
> is recorded as confirming items 1, 3, 5 and 6. Item 2 was already ruled
> 2026-08-24. Item 4 is confirmed as direction — Sage still owes the §18.1 shape
> ratification before any migration is written. Item 7 is confirmed as intent —
> the enrollment itself is OPS-3 (Bumble, with Colin for the DUNS/legal-entity
> steps). If any of this over-reads the go-ahead, say so in the channel and this
> block gets amended.

1. **Volumes replace one-shot seal** — confirm. Everything in §3 depends on it.
2. ~~Printed book at $79–$129~~ and ~~$2.99/mo pricing~~ — **both ruled
   2026-08-24.** Print cancelled, digital only (§17.4). Revenue model ruled:
   $39.99/yr annual-only, paywall moved from hive creation to delivery, first
   delivery free forever (§17.5). **This reverses the 2026-08-19 "1 hive,
   lifetime" ruling** and owes a doc sweep (`COPY-11`).
3. **Web reveal requires no install** — confirm; this constrains the animation
   work (it must run in a browser, which shapes how DES-14 is built).
4. **`private_hives` widens from owner-only to owner + contributors** — this
   reverses an explicit architectural stance in `20260815000001`; Sage should
   ratify the recursion-safe shape in §18.1 before any migration is written.
5. **Simulated nectar (19a) ships to friends & family before any real sats** —
   confirm the phasing is not reordered under enthusiasm.
6. **Bitcoin stays out of all store-facing copy** — confirm §5.5.2.
7. **Apple Developer Program: Organization enrollment** — required by 3.1.5(i)
   for 19b, and a multi-week process (DUNS). Start it now if 19b is real.
