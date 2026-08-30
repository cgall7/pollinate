# Pollinate — The Comb Rotation Ruling

**Status:** Governing. Ruled by Colin across the #Strategy thread `e8cec2c0…`,
2026-08-30. The ruling arrived over several messages; the **final model is
event `d662661b…`** ("okay i agree with this. Strategy is set."). Superseded
intermediate positions are recorded in §11 so they are not re-proposed.

**Constituent rulings, in order:**

| Event | Ruled |
|---|---|
| `482eee85…` | **No physical printing, ever.** |
| `0effa81d…` | The comb rotation is the product. |
| `2fff2abe…` | Free for everything except the comb. Price cap ~$39/yr. |
| `b3e37eaa…` | **Per-user subscription**, not organizer-pays. Short note + nectar is a first-class use case. |
| `65261c23…` | A size cap on the free comb is required — the modal user runs exactly one comb. |
| `2927c422…` | Free = **one comb you write in**; premium unlocks >5 members and >1 comb. |
| `d662661b…` | **Final.** Receiving stays uncapped and free. Strategy set. |

**Author of this encoding:** Vector (assessment `RESEARCH/POLLINATE_STRATEGIC_ASSESSMENT_VECTOR.md`).
**Ratification owner:** Lumen — encoding rulings is Lumen's step per `README.md`.
The retired-token sweep (`COPY-13`) is owed.

**Supersedes:** `POLLINATE_V2_SPEC.md` §17.5.1 (the anti-monthly finding, in
part), §17.5.2 (the $39.99 annual-only line), §17.5.3 (the install table),
§17.5.4's `Family / comb plan` row; the Cycle 11–12 sequencing of Project 18 in
`POLLINATE_V2_ASSIGNMENTS.md` §5; and the pricing rows in `Pollinate_Strategy.md` §4.

**Does not supersede:** §0's positioning amendment, Projects 16/17, the
durability promise (§17.4), the metering principle (§17.5.2a), the
money-transmitter guardrails (§5.6 G1–G5), the navigation ruling
(`POLLINATE_V2_NAVIGATION.md` — **no Wallet tab**, reconfirmed 2026-08-30), or
19a-before-19b phasing. Slice 1 still ships first.

---

## 1. The ruling in one paragraph

**The comb rotation is the product.** A comb is a closed, invite-joined group
capped at 20 that collectively fills one hive for one member at a time — *"this
month the comb is writing for Sarah"* — seals it on her occasion, blooms it for
her, and rotates. Private hives remain, as the **personal mode**. Pollinate is
**free for everything a person does alone**; the comb is the only paid thing.
The subscription is **per-user**, and it unlocks **breadth and size**: more than
one comb to write in, and more than five members in a comb you run. **Receiving
is never metered, in any form.**

This is `POLLINATE_V2_SPEC.md` §18.2, promoted from "Cycle 11–12, Project 18" to
the centre of the product.

---

## 1A. MVP scope — ruled 2026-08-30 (event `cf648e7f…`)

> **Phases 0, 1 and 2 of §8.6 are the MVP. Build them to completion, now.**
> Phase 3 is what you do *with* the MVP once it exists; **Phase 4 does not start
> until Phase 3 returns.**

Call it **MVP-Comb** in all planning from here, because "MVP1" already means
something narrower in `Pollinate_Delivery_Slices.md` and the two must not be
conflated.

### What is in

| | Scope |
|---|---|
| **Phase 0** | `OPS-8` (analytics promise), `ENG-84` (account deletion), `COPY-13` (sweep + ratify), `OPS-7`, `OPS-3` |
| **Phase 1** | The rotation engine — `ENG-58`, `ENG-85` (caps **disabled**), `ENG-83`, `ENG-59`, `OPS-9`, `ENG-60`, `DES-21`, `DES-22`, `DES-29`, `DES-31`, `COPY-6` |
| **Phase 2** | The daily layer — `ENG-62`, `ENG-90`, `ENG-65`, `ENG-66`, `DES-23`, `DES-32`, `COPY-7` |
| **Carried in-flight** | The approved merge queue and demo-gap items in `PLANS/MVP1_DEMO_READINESS_AUDIT.md`, and the GL1/GL2 luxury pass Colin ruled in scope 2026-08-26. **This ruling does not cancel any of it** |

### What is out

- **Phase 4 entirely** — no IAP, no paywall surface, no cap enforcement. `ENG-79`,
  `DES-30`, pricing copy. **Cap enforcement is out even though the caps are built**
  (§8.5).
- **All of 19b/c/d** — real sats, Breez/Spark, Privy, `ENG-72`, `LEGAL-1`. Nectar
  is **simulated only** in MVP-Comb.
- The friend feed, a photo feed, a Wallet tab.

### Three conflicts this creates with standing rulings — resolved, not hidden

**1. It partly reverses the 2026-08-26 "analytics is MVP2" amendment.**
`Pollinate_Delivery_Slices.md` records Colin's 2026-08-26 ruling that *"crash
reporting, analytics, legalcopy, and test flight will be mvp2 not mvp1."*
`OPS-8` sits in Phase 0 and is therefore now **in** the MVP. That is deliberate:
`legalCopy.js`'s no-analytics promise permanently forecloses C1–C5, and the
entire justification for MVP-Comb is learning those numbers. **Narrowing the
promise is in scope; shipping a full analytics stack is a separate question
(see conflict 2).**

**2. `ENG-89` must ship in the MVP binary, or the measurement is lost.**
**RECOMMENDED, NOT YET RULED — this is the one place I would widen Colin's scope
and I will not do it silently.** Phase 3.1 is instrumentation. Analytics events
have to be present in the build *when the behaviour happens*; a rotation that
already occurred cannot be instrumented afterwards. If MVP-Comb ships without
`ENG-89`, Phase 3 measures nothing and the seeded combs are spent for no data.

> **Recommendation: pull `ENG-89` and `ENG-78` into the MVP** (they are build
> tasks). Leave `3.2` (seed the combs) and `3.3` (wait eight weeks) outside it —
> those are operations, not build. **Awaiting Colin.**

**3. Phase 3.2 needs a distribution path that is currently MVP2.**
Seeding three real combs of strangers requires shipping to non-team devices.
`11.1` (TestFlight / internal track) was moved to MVP2 on 2026-08-26, and the
Slices doc already flags the resulting hole. **Either `11.1` comes into
MVP-Comb, or Phase 3.2 needs EAS internal distribution.** Bumble's call on
mechanism; the need is not optional.

### The definition-of-done for MVP-Comb

A stranger can: install → arrive through an invite link without a password form →
join a comb → see *"the comb is writing for Sarah — 6 days left"* → write an entry
→ watch Sarah's reveal bloom with every author's entries → send her a short note
with nectar → and do it again next month for someone else.

**If that sentence does not run end to end on a real device with real strangers,
MVP-Comb is not done.**

---

## 2. Why the shape changed (the reasoning, so it can be checked)

Three problems in the pre-ruling model, all real, all closed by the same move:

**P1 — The retention thesis rested on willpower and had no evidence.** The model
assumed a person writes about their child weekly for years. Nothing in the repo
or the workspace measures whether anyone does. Rotation **removes willpower from
the loop**: other people's occasions set the cadence. In a comb of 12 you write
eleven times a year and receive once.

**P2 — The network effect was claimed but not present.** A 1:1 private hive whose
recipient may never install is a *referral loop*, not a network effect. A rotating
comb is **N-to-1, recurring and multi-party**. §18.1 already says it: *"the only
viral loop that doesn't require a feed."*

**P3 — The paywall could not fire.** The delivery meter charged on a user's
*second* delivery, first free forever. For most users that event does not occur
within twelve months of install, so a cohort produced approximately zero
year-one revenue **by construction**. §17.5.2b already conceded the flagship
18-year use case pays $0 across eighteen years.

---

## 3. The model

### 3.1 The tier table — this is the contract

| | Free | Premium (per-user) |
|---|---|---|
| **Combs you write in** | **1** | **Unlimited** |
| **Members in a comb you run** | **5** (you + 4 writers) | **20** (the §18.2 cap) |
| **Combs that may write *for* you** | **Unlimited, forever** | Same |
| **Receiving a reveal / being a rotation subject** | **Always free, never capped** | Same |
| Private hives, entries, journal | Unlimited, forever | Same |
| Export | Free forever (§17.4) | Same |
| Seeds, review cadence, friend connections | Ungated (§17.5.2a) | Same |
| Nectar zaps, short notes + nectar | Free. 100% to receiver, never revenue (G5) | Same |
| Ads | Never | Never |

**The one-line principle: gate the giving, never the getting.**

### 3.2 Two rules that make the table safe

**A — Membership means writing rights. Being written for is not membership.**
`comb_rotations.subject_profile_id` references **`profiles`**, not
`comb_members` (§18.2's own SQL). A comb may write for anyone, member or not —
the same shape as the newborn/grandmother case (§17.2b: delivery is link-based,
no install required). Without this rule, a free user in one comb would have to
**pay in order to be celebrated by another** — which V2 §17.5.5 (*"Receiving.
Metering it kills the viral loop"*) and the PRD (*"Never paywall the receiving
experience"*) both bar. Ruled explicitly, event `d662661b…`.

**B — The cap is on the comb you *create* and the combs you *write in*, never on
the comb you are *invited to as a subject*.** An invitee never sees *"sorry, the
comb is full."* The only person who meets the member cap is the organizer,
privately, while building their group — peak intent, and not a social moment.

### 3.3 Why this converts the modal user

Colin's product sense, and the reason the earlier "unlimited combs" model was
killed: **most people will only ever want one comb.** A family comb. A friend
group. Under a breadth-only paywall those users never pay, and they are the
majority — the free tier would fully satisfy the modal use case.

**Premium must be depth on the same use case, not an adjacent one** (Hallow's
premium is more inside prayer, not more prayer apps; Spotify's is ad-free
listening, not more accounts). Size is the axis that scales with how much a
single comb is worth to you. A family comb is 6–8 people; a friend group is
10–12. **Both cross 5 immediately.**

---

## 4. Price: deliberately blank

**No price is ruled.** Colin's stated ceiling is **~$39/year** (event
`2fff2abe…`), and annual is preferred over monthly (§4.2). The number is left
open **on purpose** until conditions **C1** and **C5** (§6) return data.

**Why blank is the right answer today.** The price moved three times in one
evening with zero user data. Every conversion argument now on the table —
rotation participation, the daily note+nectar layer, the member cap as the
trigger — is unmeasured. `POLLINATE_V2_ASSIGNMENTS.md` §11 already bars a price
change before there is funnel data, and that constraint is now *respected*
rather than overridden.

**Annual over monthly, when the number does get ruled.** V2 §17.5.1's finding
stands on a premise the comb pivot only partly disturbs. Rotation makes value
monthly *for a healthy comb* — but the failure mode that matters is a comb going
quiet (August, holidays, a busy organizer), and **monthly billing punishes
exactly that dip**, losing the subscriber during the lull instead of giving the
group a year to find its rhythm. Annual is also one renewal decision instead of
twelve chances to cancel.

**The corollary, binding either way:** a comb that stops rotating is a comb that
churns. **Rotation cadence and subscription retention are the same number** —
which is why C1 decides the business.

### 4.1 What the model needs to be true

At ~$39/yr per user, $1M gross ≈ **25,600 paying users**. The pool is every comb
member, not one organizer per comb, and every comb over five members yields at
least one payer. Net of Apple's 15% (`OPS-7`), $1M *net* ≈ 30,200.

**Say the honest thing:** $1M/yr is a top-decile consumer-app outcome on a 2–3
year arc. The comb shape is the version worth betting on, not a guarantee.

### 4.2 The designated relief valve

Recorded now so nobody has to re-argue it under pressure. The model **monetizes**
the viral loop rather than compounding it: a free user must pay to start a second
comb, so propagation is tolled.

**If comb formation or C2 comes back weak, the first knob to loosen is: free =
one comb you *join* plus one you *create*.** That restores compounding without
touching price or the 5-member cap. It is the designated valve — not a fallback
someone has to rediscover.

**The caps are server-side constants, not design commitments.** Unlike a price,
they can be moved per-cohort or raised for a seeded community without breaking
anything or announcing it.

## 5. What this means for the product surface

### 5.1 Positioning

The §0 lean-in / lean-out table stands. One row is **added**, not changed:

| Lean IN | Lean OUT |
|---|---|
| **The comb — a closed group writing for one member at a time** | **"Community," "group feed," "social network," "post"** |

**Community without a feed.** Colin asked for "a community around lifting others up."
§0 rules that *"a public gratitude feed kills this."* These are not in conflict and
must not be recorded as a compromise between them: a comb is **closed, capped at 20,
and writes rather than posts**, and co-authors cannot see each other's entries until
the volume seals (§18.1). Nobody performs, because there is no audience — only a
subject. That is the resolution.

**Consequence: cut the friend feed.** §18.2's own caution — *"a friend feed is the
weakest asset in the app and it competes for the attention hives need"* — is now
binding, not advisory. The Hive tab becomes comb-first.

### 5.2 The bitcoin layer — and the daily register

Re-ranked, and one thing added that is new to this ruling.

**(a) Short note + nectar is now a first-class, everyday action** (ruled
`b3e37eaa…`). *"Thanks for lunch"* plus a few hundred drops, sent to a comb
member any time — not only at a reveal. V2 §5.1 already defines a zap as *"a
reaction with skin in the game"*; this **unscopes it from the reveal moment.**

Why it matters strategically, stated plainly because it is the fix for the
product's deepest structural weakness:

- **Everything else in Pollinate is monthly or annual. This is daily.** It is the
  retention floor the app does not otherwise have, and it directly de-risks the
  quiet-comb churn named in §4.
- **It widens the register.** The long-form gratitude letter reads
  female-coded in a way that limits reach; eight words and some nectar is a
  register that travels further. Same app, two lengths.
- **It is the strongest bitcoin-native argument in the product.** Venmo cannot
  economically move $1.50 of thanks; Lightning can. Value-for-value micro-thanks
  is what the rail is actually good at, and people would use it *this week* —
  unlike the 18-year time-lock.

**Build it in 19a, simulated, first.** Non-negotiable sequencing: if people will
not do it with fake nectar, they will not do it with sats, and that is learnable
for the price of client work — **before** Breez/Spark, Privy, `OPS-3` (Apple
Organization enrolment, multi-week D-U-N-S) or `LEGAL-1` (~$15–40K). Instrumented
as **C5** (§6).

**It generates zero revenue, by ruling.** G5 and Apple 3.2.1(vii) both require
100% to the receiver. **It is a retention and reach play, not an ARPU line, and
must not be counted twice in any model.** Its second-order value is real though:
a per-user subscription is far easier to justify for an app someone opens every
few days than for one they touch monthly.

**(b) The comb pot (`ENG-66`, §5.2d) is the flagship group-money feature.**
Eleven friends dropping nectar into Sarah's birthday hive is group gifting — a
large real behaviour with poor incumbent UX — wrapped in something people want to
open. **Guardrail G2 binding and unchanged:** each contribution settles
direct-to-recipient at contribution time; the pot is a *display over ledger rows*.
A pooled balance is a licensing event.

**(c) The honeycomb-as-wallet (`ENG-65`, §5.2b)** stays — the best argument the
bitcoin layer is native rather than bolted on.

**(d) Time-locked volumes (19d, §5.2e)** drop from flagship to long-tail story.
Still option (b) or nothing (G4); still a social lock the UI must describe honestly.

### 5.3 No Wallet tab — reconfirmed 2026-08-30 against the daily-nectar premise

Colin asked whether daily nectar earns the Wallet tab back. **It does not**, and
the daily register makes the case stronger rather than weaker.
`POLLINATE_V2_NAVIGATION.md` §3's placement principle stands verbatim:

> **Emotional and frequent lives in the comb. Administrative and rare lives
> behind the door. Neither gets a tab.**

- **Apple risk rises with daily use.** A Lifestyle app with a Wallet tab *and* a
  daily money loop reads as Finance to a reviewer. The tab is the most legible
  signal on the binary. Fountain sits in Entertainment because the wallet is not
  the frame.
- **2.3.1(a) bites harder.** The wallet does not exist until first-zap consent, so
  a permanent tab is empty for every non-consenting user — a dormant feature, the
  same defect cut for MVP1.
- **It discards the differentiator** §5.2(b) calls the best argument the bitcoin
  layer is native.
- Three tabs shipped via `ENG-81`/`ENG-82`; `MainTabs.js:115-122` carries exactly
  Today, Hive, Garden. Reversing re-opens capsule geometry, the nav-depth gate and
  the account-door anchor.

The principle in one line: **tabs are for verbs, and "wallet" is a noun.** Venmo
earns a wallet tab because its verb is *pay*. Pollinate's verb is *thank*.

**Reopen only with data:** if C5 shows the daily loop dominating usage, the
premise has genuinely moved and the question is worth re-asking then.

## 6. The five conditions that decide this

None are knowable today: there is no analytics SDK in the build and no external
cohort. **Seed three real combs — a run club, a small group, a group chat —
instrument these five, and the answer arrives in eight weeks.**

| # | Condition | Threshold | Instrumented by |
|---|---|---|---|
| **C1** | **Rotation participation** — share of an active comb who write for that month's subject | **≥60%, sustained 3 months** | `ENG-89` |
| **C2** | Reveal→install for non-member recipients | ≥25% | `ENG-78` (exists) |
| **C3** | Comb survival — seeded combs still rotating at month 6 | ≥50% | `ENG-89` |
| **C4** | Willingness to pay at the member cap and the second-comb moment | Conversion at each gate | `ENG-89` |
| **C5** | **Note + nectar frequency** — short notes sent per active member per week | Establish a baseline; high C5 accelerates 19b, low C5 saves the legal spend | `ENG-89` |

> **C1 is the number that decides the business.** If it returns 20%, no repricing
> and no design pass saves the model. C1 and subscription retention are the same
> number (§4).

**What each failure signature means — decided in advance, so a bad number
produces a response instead of a re-litigation:**

| Signature | Diagnosis | Response |
|---|---|---|
| Combs form, nobody writes (C1 low, C3 ok) | Effort per entry too high | **Not a monetization problem.** Fix the ask — one-tap prompt→reply. Project 16 is the lane |
| Combs don't form (few created, low invite accept) | The group-formation ask is too big | **Drop the group requirement** — monetize the 1:1 occasion. §18.1 is shipped, so this is nearly free |
| Combs rotate, nobody pays (C1/C3 good, C4 low) | Value real, payer wrong | Move the charge to the artifact or to certainty (`ENG-80`). **Do not cut the price first** |
| C5 near zero | The daily register does not exist for these users | Do **not** start 19b. `LEGAL-1` and `OPS-3` stay parked |

**This is why the analytics contradiction must close first.**
`src/constants/legalCopy.js` (:159, :207) promises *"There is no analytics,
crash-reporting or tracking code in it either"* — a published claim that
forecloses C1–C5 permanently. V2 §20.2 prescribes the fix: **narrow the promise,
do not delete it**, and do it **before** the policy publishes. `OPS-8`.

---

## 7. Design handoff (Lumen routes; Pixel / Deezine build)

Existing rows now on the critical path rather than in Cycle 11–12:

- **`DES-21`** (Deezine, L) — collective reveal, N authors in one sequence.
  **Now gates the hero flow.** Attribution visible without becoming a feed.
- **`DES-22`** (Pixel, M) — comb identity: hexagon cluster, member states,
  rotation indicator *("writing for Sarah — 6 days left")*.
- **`COPY-6`** (Lumen, M) — comb + rotation copy. **Never "group," never
  "community," never "post."**

New rows:

| ID | Owner | Est | Issue |
|---|---|---|---|
| **DES-29** | Deezine | L | **Comb-first first run.** The app opens on `TodayTab`, a solo journal (`src/navigation/MainTabs.js:115`), and `Onboarding` ends in a personal entry — teaching "journal app" in three seconds and hiding the pillar we sell. Two doors, **comb primary**: *"Start a comb with your people"* / *"Write for one person."* Comb happy path: **person → occasion → date → invite by link → write.** Sequence with `ONBOARDING_ZERO_DOOR_SPEC.md` — same `App.js` region |
| **DES-30** | Pixel | M | **Paywall surfaces, at two moments and no others.** (1) **Adding the 6th member** to a comb you run. (2) **Creating or joining a second comb** to write in. Both are private, organizer-side, high-intent. **Never at a seal or a reveal**, never "upgrade to unlock" (`COPY-13`). Copy must never imply a friend is being excluded — the message is *"add more people,"* never *"they can't come"* |
| **DES-31** | Pixel | M | **Rotation state on the Hive tab**: subject, days remaining, contributor **count**. **Never contributor content** — blind-until-seal (§18.1) is a privacy boundary, not a nicety |
| **DES-32** | Deezine | M | **Short-note + nectar compose surface** (§5.2a). Eight words and a nectar amount, sent to a comb member from the comb, any time — not only at a reveal. Fast, one-handed, closer to a reaction than to composing an entry. Reuses the `DES-23` zap flight |

**Constraint unchanged:** no photo feed in the Hive tab or a comb (§11, "Do not
start"). Locket and Retro own small-circle photo sharing.

---

## 8. Engineering handoff (Sage sequences; Fizz / Pollen build)

**Most of this already exists as tickets.** The change is sequencing, price and
two new surfaces — not invention. Verified against `github/main@080edd5`, 2026-08-30.

### 8.1 Already specified — promote to the critical path

| ID | Owner | Est | Status |
|---|---|---|---|
| **ENG-58** | Sage | L | Migration: `combs`, `comb_members`, `comb_rotations` + RLS. **Not built** — no such migration exists, and no `invite_code` or rotation path exists in `src/` (both searched) |
| **ENG-59** | Fizz | M | Comb invite-link join flow. Deep-link scheme `pollinate` already registered (`app.json`) |
| **ENG-60** | Fizz | L | Rotation ritual: open, notify, collect, seal on `closes_at`, reveal. Needs a scheduler — `pg_cron`, `OPS-9` |
| **ENG-62** | Sage | L | Land the nectar ledger with `rails_mode='simulated'` |
| **ENG-66** | Fizz | M | Comb pot. **G2 binding:** direct-to-recipient, never pooled |

**Already shipped — close, do not rebuild:** `ENG-56`, `ENG-57`, `ENG-61`.
§18.1 collective hives landed in `20260827000001_multi_writer_hives.sql` (+
`20260828000001`) with `InviteContributor.js` and `ContributingHive.js`.
**The foundation is in; the rotation engine is the gap.**

### 8.2 Repriced and re-scoped

| ID | Change |
|---|---|
| **ENG-79** | **Was:** "Family / comb plan — $79/yr, up to 6 seats *(Slice 3)*." **Now: the per-user subscription — unlimited combs, up to 20 members each — and it is the only paid line.** Carries the entire IAP layer, which **does not exist** (no RevenueCat / `react-native-purchases` / StoreKit wrapper in `package.json`). Re-estimate: this is **L+**, not M. **Price is not yet ruled** — build the plumbing, not the number |
| **ENG-76** | **Cancelled.** The $39.99/yr delivery-metered paywall is retired (ruling O1 closed by `2fff2abe…`: free for everything except the comb). Close it; `DES-26` and `COPY-12` fold into `DES-30`/`COPY-13` |

### 8.3 New rows

| ID | Owner | Est | Issue |
|---|---|---|---|
| **ENG-83** | Fizz | M | **Magic-link and/or Sign in with Apple.** Auth is email + password only (`src/services/HoneycombStore.js:32-45`). **A comb arrives as a group through one link**; today each member meets a password form individually. §18.2: *"friend-by-friend email matching is not how a real friend group arrives."* Critical path |
| **ENG-84** | Fizz | S | **In-app account deletion.** No `deleteAccount` path in `src/`. **App Store 5.1.1(v) — hard rejection.** Release blocker, independent of this ruling |
| **ENG-85** | Sage | M | **Entitlement model.** Where a user's plan lives and how the two caps read it: `combs_written_in ≤ 1` and `comb_members ≤ 5` on free. Must be **a single server-side source of truth** the client cannot spoof, and **both limits must be tunable constants** (§4.2). Ships with the caps **disabled** — see §8.5 |
| **ENG-90** | Fizz | M | **Short note + nectar, unscoped from the reveal** (§5.2a). Send a short note plus simulated nectar to a comb member at any time. Rides `ENG-62`'s ledger and the `DES-23` flight |
| **ENG-89** | Fizz | M | **Instrument C1–C5** (§6). Extends `ENG-78`, which stays the highest-priority single event |
| **OPS-8** | Lumen + Bumble | S | **Close the analytics contradiction before the privacy policy publishes.** Amend `legalCopy.js:159,207` per V2 §20.2 — narrow the promise, do not delete it. **Blocks `ENG-89`/`ENG-78` from being honest** |
| **OPS-9** | Bumble | M | **Rotation scheduler.** `pg_cron` jobs to open a rotation, fire notifications, seal on `closes_at`, trigger the reveal. `ENG-60`'s runtime |
| **COPY-13** | Lumen | M | **Ruling sweep.** Retired tokens: `$39.99`, `annual only`/`annual-only`, `$79`, `$5.99`, `metered at delivery`, `delivery is the only meter`, `first delivery free`, `organizer pays`. Follow `README.md`'s ritual — eye-read cited rows, sweep the *retired* token, publish both yields, verdict reads "N hits, all classified legitimate," never "zero hits" |

### 8.4 Do not start

- **`ENG-76`** — cancelled above.
- **Any 19b work** (Breez/Spark, Privy, real sats) **before C5 has data.**
  `LEGAL-1` and `OPS-3` stay parked until then.
- **A friend feed** in the Hive tab or a comb — cut by this ruling.
- **A Wallet tab** — §5.3.
- **Any price ruling before C1 and C5 return.** §4.

### 8.5 The sequencing trap — read this before building `ENG-85`

**Build the caps. Do not enforce them during the measurement period.**

The seeded combs of §6 exist to measure C1, C3 and C5. If the 5-member cap is
live while those combs are forming, a run club of twelve is strangled at five and
**the measurement that justifies the entire model is destroyed by the model's own
paywall.** `ENG-85` ships with the entitlement plumbing in place and both limits
set to unlimited, flipped on only when the paid tier launches (Phase 4, §8.6).

This is the same reason 19a precedes 19b: **build the mechanism, defer the
consequence, and learn in between.**

### 8.6 Build sequence — who does what, in order

> **Phases 0–2 are MVP-Comb (§1A), ruled 2026-08-30. Build to completion now.**
> Phase 3 is what you do with it; Phase 4 is gated on Phase 3's numbers.

**Phase 0 — Unblock. Starts now, fully parallel, nothing depends on Phase 1.**

| # | Owner | Task |
|---|---|---|
| 0.1 | **Lumen + Bumble** | `OPS-8` — narrow the `legalCopy.js` analytics promise. **Blocks every measurement below.** Do this first |
| 0.2 | **Fizz** | `ENG-84` — account deletion (App Store 5.1.1(v)) |
| 0.3 | **Lumen** | `COPY-13` sweep + ratify this encoding (normally Lumen's step; Vector authored it at Colin's request) |
| 0.4 | **Colin** | `OPS-7` — Apple Small Business Program. A form, worth 15% of revenue |
| 0.5 | **Colin** | `OPS-3` — start Organization enrolment now. Multi-week D-U-N-S; starting early removes it from the critical path if C5 lands well. Costs nothing but a form and a wait |

**Phase 1 — The rotation engine. This is the hero build.**

| # | Owner | Task | Depends on |
|---|---|---|---|
| 1.1 | **Sage** | `ENG-58` — `combs` / `comb_members` / `comb_rotations` + RLS. Reuse the `is_hive_contributor()` definer shape (recursion-safe). `is_collective`-style immutability per §18.1a C2 | — |
| 1.2 | **Sage** | `ENG-85` — entitlement model, **caps disabled** (§8.5) | 1.1 |
| 1.3 | **Fizz** | `ENG-83` — magic-link / Sign in with Apple | — (start with 1.1) |
| 1.4 | **Pixel** | `DES-22` + `DES-31` — comb identity, rotation state | — (start now) |
| 1.5 | **Deezine** | `DES-29` — comb-first first run. Sequence with Zero Door (same `App.js` region) | — (start now) |
| 1.6 | **Deezine** | `DES-21` — collective reveal. **XL, gates the hero flow — start it the day 1.1 is ruled**, it can be designed against a stub | — |
| 1.7 | **Fizz** | `ENG-59` — invite-link join | 1.1, 1.3 |
| 1.8 | **Bumble** | `OPS-9` — `pg_cron` rotation scheduler | 1.1 |
| 1.9 | **Fizz** | `ENG-60` — rotation ritual: open → notify → collect → seal → reveal | 1.1, 1.6, 1.8 |
| 1.10 | **Lumen** | `COPY-6` — comb + rotation copy | 1.4 |

**Phase 2 — The daily layer. Parallel to Phase 1 from 2.1 onward; no shared files with the rotation work.**

| # | Owner | Task | Depends on |
|---|---|---|---|
| 2.1 | **Sage** | `ENG-62` — land the nectar ledger, `rails_mode='simulated'` | — |
| 2.2 | **Deezine** | `DES-23` zap flight + `DES-32` short-note compose | — |
| 2.3 | **Fizz** | `ENG-90` — short note + nectar, any time, in-comb | 2.1, 2.2 |
| 2.4 | **Fizz** | `ENG-65` — honeyed hexagon (comb-as-wallet) | 2.1, `DES-24` |
| 2.5 | **Fizz** | `ENG-66` — comb pot. **G2: direct-to-recipient, never pooled** | 2.1, 1.9 |
| 2.6 | **Lumen** | `COPY-7` — nectar vocabulary. **"Drops," not "sats."** No "bitcoin" in default UI | — |

**Phase 3 — Measure. The point of everything above.**

| # | Owner | Task | Depends on |
|---|---|---|---|
| 3.1 | **Fizz** | `ENG-89` + `ENG-78` — instrument C1–C5 | 0.1, 1.9, 2.3 |
| 3.2 | **Colin** | **Seed three real combs** — a run club, a small group, a group chat. Not friends of the team | 1.9, 3.1 |
| 3.3 | **all** | **Wait eight weeks.** Read C1–C5 against §6's response table | 3.2 |

**Phase 4 — Monetize. Does not start until Phase 3 returns.**

| # | Owner | Task | Depends on |
|---|---|---|---|
| 4.1 | **Colin** | **Rule the price.** Ceiling ~$39/yr, annual preferred (§4) | 3.3 |
| 4.2 | **Fizz** | `ENG-79` — IAP layer + subscription. **L+, carries the whole StoreKit/RevenueCat surface** | 4.1, 1.2 |
| 4.3 | **Sage** | Flip `ENG-85`'s caps on: 1 comb written in, 5 members (§8.5) | 4.2 |
| 4.4 | **Pixel** | `DES-30` — paywall at the two moments, and no others | 4.1 |
| 4.5 | **Lumen** | Pricing copy. Never "upgrade to unlock" | 4.1 |

**Gate between Phase 3 and Phase 4:** if C1 < 40%, do not build Phase 4 — take
the §6 response for that signature instead. **Phase 4 is the only phase that can
be cut without wasting Phases 1–3**, which is the point of ordering it last.

### 8.7 Critical path

```
OPS-8 ─────────────────────────────────► ENG-89 ─┐
                                                 ├─► SEED 3 COMBS ─► read C1–C5 ─► price ─► ENG-79
ENG-58 ─┬─► ENG-85 (caps off)                    │
        ├─► ENG-59 ◄── ENG-83 (auth)             │
        ├─► OPS-9 ──┐                            │
        └───────────┴─► ENG-60 ◄── DES-21  ──────┤
                            └─► ENG-66           │
ENG-62 ─────► ENG-90 ◄── DES-32  ────────────────┘
```

`DES-21` and `ENG-58` are the two longest poles. Start both immediately.

## 9. What is explicitly NOT changing

Recorded so no one over-reads this ruling:

- **Slice 1's work is not cancelled** — the approved merge queue, the demo-gap
  items in `MVP1_DEMO_READINESS_AUDIT.md`, and the GL1/GL2 luxury pass all carry
  into MVP-Comb (§1A). *Amended 2026-08-30:* the earlier "Slice 1 ships first,
  **then** the comb work" sequencing is retired — shipping a demo of the product
  before the thing that is now the product does not make sense. **There is one
  release: MVP-Comb.** See open ruling **O5** if a separate earlier demo build
  is still wanted.
- **§0's positioning amendment** — gratitude is the mechanic, not the category.
- **The metering principle** (§17.5.2a) — meter the artifact, never the practice,
  never the graph. §3.1 complies: the paid line prices **breadth and size**, and
  writing, reviewing, connecting, seeding and **receiving** stay free everywhere.
- **The durability promise** (§17.4) — export free on every tier, forever. Still
  **unbuilt**: no `expo-print`/`expo-sharing` in `package.json`. Printing is ruled
  out (`482eee85…`); *digital* export is not, and is still owed.
- **All money-transmitter guardrails** G1–G5, and `LEGAL-1` before any 19b code.
- **19a before 19b.** The phasing is the de-risking.
- **No photo feed** in the Hive tab or a comb.
- **Three-tab navigation** `Today | Hive | Garden`, top-right account door, and
  **no Wallet tab** — reconfirmed against the daily-nectar premise in §5.3.
- **Private hives**, in full, as the personal mode. The 18-year mother–son case is
  still the marketing story; it is not the revenue story, which §17.5.2b
  established before this ruling existed.

---

## 10. Open rulings

| # | Question | Blocks |
|---|---|---|
| ~~**O1**~~ | ~~Does individual Plus survive?~~ **CLOSED** `2fff2abe…` — no. Free for everything except the comb. `ENG-76` cancelled | — |
| ~~**O2**~~ | ~~Free tier keeps unlimited personal hives?~~ **CLOSED** — yes, unchanged (§3.1) | — |
| **O3** | Carried from V2: §5.5(4) rules *"no projected returns, ever"* while §5.2(e) pitches *"$50 in 2026 versus 50,000 sats in 2044."* Apple 3.1.1 and FTC-adjacent risk both bite | 19d marketing copy, `COPY-8` |
| **O4** | **The price.** Ceiling ~$39/yr, annual preferred. Deliberately unruled until C1 and C5 return (§4) | Phase 4 only |
| **O5** | **One release or two?** This encoding assumes the in-flight Slice 1 / MVP1 work folds into MVP-Comb and ships once (§9). The alternative is a separate earlier demo build without combs. Derived, not ruled | Release planning |
| **O6** | **Does `ENG-89` come into MVP-Comb?** Recommendation: **yes** — instrumentation must ship with the features it measures (§1A conflict 2). Without it Phase 3 measures nothing | Phase 3 |
| **O7** | **Distribution for Phase 3.2** — `11.1` TestFlight into MVP-Comb, or EAS internal distribution? Bumble's mechanism call; the need is not optional (§1A conflict 3) | Phase 3.2 |

---

## 11. Decision history — positions considered and rejected

Recorded so they are not re-proposed. Each was live during the 2026-08-30 thread
and each was killed by a specific argument, not by preference.

| Position | Why it was rejected |
|---|---|
| **A physical printed volume** ($89 keepsake, POD) | Ruled out by Colin, `482eee85…`. No physical logistics, ever |
| **$39.99/yr individual Plus, metered at delivery** | The meter fires on a user's *second* delivery, which most users never reach inside twelve months — a cohort produces ~zero year-one revenue by construction |
| **Comb plan at $5.99/month, organizer pays** | Two independent faults: (a) monthly billing punishes the quiet stretch that is a comb's actual failure mode; (b) organizer-pays caps the ceiling at one payer per comb when every member gets value. Hallow — cited as validation for the comb shape — sells individual subscriptions, not one-payer-per-parish |
| **Per-user, premium = unlimited combs** | **The decisive rejection.** Most users will only ever want one comb — a family, a friend group. A breadth-only paywall never fires for the modal user, so the free tier fully satisfies the majority. **Premium must be depth on the same use case, not an adjacent one** |
| **Free comb capped at 3 members** | A rotation with 3 people yields a reveal with 2 entries — a card signed by two people, not the collective reveal `DES-21` is scoped for. Also caps the viral engine: one free comb of 20 gives 20 conversion candidates, one of 3 gives 2 |
| **Free comb capped at 8 members** (Vector's counter) | Withdrawn. The 8-floor assumed the free comb had to carry the demo; under create-capping most people's first experience is being *invited* into someone else's comb of any size, so the free comb is for starters, not the showcase. 5 is the smallest number where four writers still make a collective moment |
| **"Others may write to you only in your one free comb"** | Would make a free user **pay in order to be celebrated** by a second comb. Barred by V2 §17.5.5 (*"Receiving. Metering it kills the viral loop"*) and the PRD twice. Fixed by §3.2's rule A: membership is writing rights; being written for is not membership |
| **Bringing back the Wallet tab for daily nectar** | §5.3. Daily use strengthens the case against it — Apple positioning risk rises, 2.3.1(a) bites harder, and it discards the comb-as-wallet differentiator |
| **Ruling a price now** | Three price positions in one evening with zero user data. `POLLINATE_V2_ASSIGNMENTS.md` §11 already bars this; the constraint is now respected rather than overridden (§4) |
