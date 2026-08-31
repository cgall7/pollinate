# Pollinate — The Ruling: One App, Not Three

**From:** Colin  
**To:** Engineering + Design  
**Re:** Your scope/alignment memo — the answer, the tab structure, the data architecture, and what's in/out for MVP1

---

## The One Sentence You Asked For

> **The daily journal (Today / Recap / Wrapped) is part of Pollinate. It is not legacy. It is the foundation the social network grows on. The strategy doc's §2 positioning has been updated to reflect this.**

---

## Amendment — 2026-08-17 (re-researched from zero at Colin's request; ratified by Colin in the CEO action items thread)

Colin asked for items 3 (scope) and 4 (positioning) to be re-derived ignoring all prior rulings, from one question: *what will users fall in love with.* The hero survived the re-research and sharpened. Four changes, applied in place below and in the strategy doc (v2.1):

1. **The hero sentence changed.** Killed: *"A journal that becomes social"* (the Marketing §1 line below originally read this way). Now: **"gratitude you compile for someone, until it's ready to give."** The hero is the Private Hive arc *ending in the reveal* — opening a package someone spent months writing you is the only moment in the product that can make a person cry, and it is the tell-a-friend moment Slice 1 exists to discover.
2. **Delivery is a spectrum, not a gate.** A hive must be worth keeping even if its person can never install the app (a child, a grandparent, someone you've lost). The hive is a letter drawer, not an outbox — valuable at zero deliveries. In-app send ships in Slice 1; send-as-a-link (the viral loop) and keepsake export come later.
3. **Naming: never "Public."** The two-mode model Colin sketched is ruled in as **Private Hive** (audience of one) and **the Hive** (audience of your invited people). The social layer is mutual-consent and RLS-gated; "public" would be a false privacy claim. The schema's word is `shared`.
4. **Slice 1 scope: the full arc minus the reply.** Write → review → seal → (send) → open all ship. **Seal and send are two acts, deliberately decoupled** (amended same day, per Sage; the schema already made this call in migration `20260815000003`): *seal* is the author's completion act on the hive — sets `sealed_at`, requires no recipient, so the grandmother/child/lost-someone hives complete the arc as keepsakes; *send* is optional and separate — chooses a connected friend, writes `packaged`/`sent`. Sealing must never be gated on picking a recipient. 8b.8 (reply) moves to Slice 1.1 — it has roundtrip mechanics and no new emotion; a moved recipient responds by starting their own hive, which is the same creation flow we already build. Sequence: write-and-review first, in testers' hands the moment it works; then package → send → open.
   **Acceptance bar for the reveal (8b.4 / 8b.6): pacing, not particle effects.** Entries surface one at a time, dates visible — *March 12… April 3…* — because time is the material of the gift. One tap per memory; the recipient cannot skim. If a tester screenshots it or cries, it passes. If they scroll it like a feed, it fails, whatever it looks like.

---

## Why I'm Making This Call

Your memo is right that there are three things in play right now, and that nobody has ruled on which one is real. Here's the ruling, with the reasoning behind it.

### The journal is the solo on-ramp. The network is the payoff. They're one product.

The strategy doc positioned gratitude journals as a **competitor** — the lonely, private, doesn't-stick thing we're replacing. That's half right. **Standalone** journals are our competitor. Three Good Things, Presently, Reflectly — they're dead ends. You write into a void, nobody sees it, and you quit in two weeks.

But a journal that **feeds into a social network** isn't a competitor. It's the input layer. A journal entry in Pollinate can:

1. **Stay private** (like any journal)
2. **Be shared to the Honeycomb feed** (social)
3. **Be sealed as a Seed** for a future date (time capsule)
4. **Be written into a Private Hive** (a personal gratitude journal kept FOR someone, reviewed periodically, then sealed as a keepsake — sending is optional and separate; the Christmas concept)
5. **Have a tip attached** (money via MDK — Slice 2)

A journal entry in Three Good Things can do exactly one of those: stay private. That's the competitive gap.

### On the Christmas concept specifically

The Christmas concept — a personal gratitude journal kept *for* someone — is a **Private Hive**. It lives in the Today tab alongside your personal journal. You write entries over time — a thought, a memory, a moment of gratitude about that person — and they're always there for you to see. Nothing is hidden from the author. Then, on a cadence you choose (monthly, yearly, or manual), Pollinate taps you on the shoulder: "Hey — let's take a trip down memory lane." You review what you've written, relive those moments, and when you're ready, you **seal** the hive — the author's completion act, no recipient required. If the person is a connected friend, sending is a separate, optional step after the seal (2026-08-17 amendment, item 4). This is the journal + private hives used together, and it's the strongest product story because it works with just two people.

**The journal + private hives + seeds = a gift you spend a year making.** That's not in any competitor. That's the moat.

---

## The Tab Bar (Project 10 — Unblocked)

The current tabs — `Today | Honeycomb | Recap | Wrapped` — aren't wrong, they're incomplete. The strategy doc's IA — `Hive | Feed | Wallet | Profile` — isn't wrong either, it's the social-mode IA. Both exist in the same app. Here's the unified structure:

### Unified Tab Bar

```
Today  |  Hive  |  Wallet  |  Garden
```

| Tab | What it is | Solo user (day 1) | Social user (has friends) |
|---|---|---|---|
| **Today** | Journal + Private Hives | Full feature. Write daily gratitude. Start a private hive for someone (always visible to you, reviewed periodically, then sealed — sending is optional and separate). | Same, but now you can also share today's entry to the feed or seal it as a social seed. |
| **Hive** | Social layer: honeycomb + feed | Empty state: "Add your first friend." | Full feature. Hexagons with states. Tap → action menu. Feed flows here. |
| **Wallet** | Balance, funding, tips | **Shell only in MVP1.** Shows $0.00 + "Coming Soon." Tab exists but no functionality. | Full feature in Slice 2: balance, transactions, send tips, funding. |
| **Garden** | Reflection: Recap, Wrapped, history | Shows your entries, streak, monthly recap. Solo reflection. | Adds: gratitude graph, Annual Harvest, shared history with friends. |

### What lives where

**TODAY TAB — "Where you write"**
- My Daily Journal (personal gratitude entries — your practice, your streak)
- Private Hives (personal gratitude journals you keep FOR someone — always visible to you, reviewed on a trip down memory lane, then sealed; sending is optional and separate)
  - "Hive for Mateo" (47 entries — yearly review)
  - "Hive for Mom" (3 entries — monthly review)
  - + Start a private hive for someone
- Each entry can be: kept private, shared to feed, or written into a private hive
- The compose experience lives here. Whether you're writing for yourself or for Mateo, you're writing in Today.

**HIVE TAB — "Where you connect"**
- Honeycomb (friends as hexagons with visual states)
- Feed (shared gratitude, bloom events, seed teasers, reactions)
- Social seeds (plant a seed for a friend — instant, not the year-long kind)
- Friend management (add, search, invite)
- When a user sends a package from a private hive, the sharing event appears in the Hive feed

**WALLET TAB — "Where money lives" (Slice 2)**
- MVP1: Shell only. Tab exists, shows empty state. No MDK, no funding, no tips.
- Slice 2: Balance (sats + USD), add funds (Cash App / Coinbase Onramp), send tips, transaction history

**GARDEN TAB — "Where you reflect"**
- Recap (monthly gratitude summary)
- Wrapped (year-end review)
- Gratitude graph (visualization of connections over time)
- History (all entries, seeds, shared notes)

### Why this structure works

The distinction between Today and Hive is **audience and timing:**

| | Today | Hive |
|---|---|---|
| What you do | Write gratitude | See and send to friends |
| Audience | Yourself or one specific person (private hive) | Your friend network |
| Timing | Daily practice + periodic review | Real-time / near-real-time |
| Solo user | Full feature (journal works alone) | Empty state ("add your first friend") |
| Christmas concept | Lives here (write into private hive) | Sharing event appears here when a package is sent |

---

## Wallet & Money: Deferred to Slice 2

**To be crystal clear: the wallet and money integration is NOT in MVP1.**

- The Wallet **tab shell** should be built in MVP1 (so the tab bar is complete and doesn't change later)
- The Wallet tab in MVP1 shows: `$0.00` + a "Coming Soon" state
- **No MDK SDK integration in MVP1**
- **No funding flows in MVP1** (no Cash App QR, no Coinbase Onramp)
- **No tips in MVP1** (no Lightning payments)
- **No transaction history in MVP1**

All of this moves to Slice 2. The wallet issues in the Linear breakdown (ENG-9, ENG-13, ENG-14, etc.) are **Slice 2 work, not Cycle 1–5 work.**

**Why:** Slice 1 (Demo Mode) validates the social-gratitude loop — journal → share → seed → bloom → return. Money is a separate axis. If the emotional loop doesn't work without money, money won't save it. We test the foundation first, then add money.

---

## Data Architecture: What's Supabase vs. Local

### The Core Rule

```
If losing the user's phone would destroy the data → it must be in Supabase.
If it's a draft, cache, or UI state → local is fine.
If it's a private key → local secure storage only, NEVER backend.
```

### Must be in Supabase (source of truth)

| Data | Why |
|---|---|
| User accounts & auth | Server-side accounts |
| Profiles (name, avatar, username) | Consistent across devices, visible to others |
| Friendships (social graph) | Shared state — both users see the relationship |
| **Journal entries (ALL of them)** | **Critical fix.** Must be tied to user_id. A year of entries for Mateo's Christmas seed must survive a lost phone. |
| **Private hive contents** | Author's personal gratitude journal for someone. Must persist to survive device loss. Always visible to author. |
| Seeds (metadata: sender, recipient, bloom date, status) | Bloom scheduler runs on backend — can't fire if data is on an offline phone |
| Seed contents (the note text) | Server-side, sealed until bloom date. Access controlled. |
| Gratitude notes (sent between users) | Shared state — both sender and recipient need access |
| Feed events | Aggregated server-side |
| Likes, comments, reactions | Shared social state |
| Hive states (blooming/seeded/dormant/active) | Computed from backend data |
| Push notification tokens | Backend sends bloom notifications |

### Local only (never hits Supabase)

| Data | Why |
|---|---|
| Draft entries (not yet posted) | Still composing. Sync on publish. |
| UI state (selected tab, scroll position) | Ephemeral, device-specific |
| Cached images (avatars, shared photos) | Performance. Fetch from CDN, cache locally. |
| **Wallet private keys** | iOS Keychain / Android Keystore. NEVER in Supabase. Self-custody. (Slice 2) |
| Offline draft queue | Write offline, queue locally, sync when online. |

### Both (local cache + Supabase source of truth)

| Data | Local | Supabase |
|---|---|---|
| Journal entries | Cached for offline reading/writing. Draft auto-saves locally. On publish: sync to Supabase. | Source of truth. All published entries. |
| Hive state | Cached locally. Updated via WebSocket or polling. | Source of truth. |
| Feed events | Cached locally. Refreshed on app open. | Source of truth. |

### The Privacy Fix

The cross-account leak (one account's private sentence published to another's honeycomb) is caused by entries not being properly tied to user accounts. The fix:

1. Every entry in Supabase has a `user_id` column (the author)
2. Every entry has a `visibility` column: `private` | `shared` | `packaged` | `sent`
3. Access control — a user can only read entries where:
   - They are the author (`user_id = current_user`) — the author always has access to their own entries
   - The entry is `shared` and they are in the author's hive
   - The entry is `sent` and they are the recipient of that package
4. Row-level security (RLS) policies in Supabase enforce this at the database level

Moving to Supabase isn't just about persistence — it's the privacy fix. RLS policies make it structurally impossible for one user to read another's private entries.

---

## Slice 1 Success Criteria (Revised — No Money)

| Criterion | Target | What it validates |
|---|---|---|
| Active testers | 30+ across 3+ groups | Cold-start viability |
| Daily journal entries per tester/week | 3+ | The journal sticks (solo mode works) |
| Friends added per tester | 3+ | Network formation begins |
| Entries shared to feed | 20%+ of entries | Solo → social bridge works |
| Seeds planted | 10+ total | Time capsule mechanic is understood |
| Seeds bloomed during testing | 5+ | Bloom experience lands emotionally |
| 7-day retention (unprompted) | 30%+ | People come back without being nagged |
| Seed bloom open rate | 80%+ | Bloom notifications drive re-engagement |
| Private hives created | 10+ | The hero gets adopted |
| Memory Lane reviews completed | 5+ | The author's bloom moment lands |
| Packages sent | 5+ | The arc completes end to end |
| Package open rate | 80%+ | The reveal is anticipated, not ignored |
| Hives **sealed** with 5+ entries and no send | 3+ | The letter drawer is valuable at zero deliveries — seal requires no recipient, so this is directly measurable via `sealed_at` (added 2026-08-17) |
| Qualitative: "Would you send this to a friend?" | 70%+ yes | Viral loop potential |
| Qualitative: NPS | 30+ | Product-market fit signal |
| No critical data loss (entries, friendships, seeds) | 0 incidents | Reliability |

**What Slice 1 validates:** The social-gratitude loop (journal → share → seed → bloom → return) works without money. The journal creates content. The feed creates social connection. Seeds create future pull.

**What Slice 1 does NOT validate:** Money. That's Slice 2.

---

## The Two Urgent Engineering Fixes (Before Any Testing)

### 1. Run the Supabase Migration (P0 — Today)

Four people's merged work is invisible on devices because migrations haven't been applied to prod. `notes`, `seeds`, `seed_contents`, `list_hive_state`, `plant_seed` all return 404. (Amended 2026-08-17: this list previously named `list_my_seeds` — `list_my_seeds` (never in schema); no such function was ever merged. Seeds are listed by direct `seeds` table selects under RLS — see src/services/SeedsStore.js.) Assign an owner. Run `supabase db push`. Verify endpoints return 200. Test on a real device.

### 2. Fix Journal Storage (P0 — This Week)

Entries live in `gratitude_entries_v1` as a local blob tied to no user. A year of entries for Mateo's Christmas seed would exist on exactly one device with no backup. And there's a path where one account's private sentence gets published to a different account's honeycomb.

**Both must be fixed before any tester touches the app.** The journal storage must move to Supabase, tied to user accounts, with RLS policies for access control.

---

## What I Need From Each of You Now

### Engineering

1. **Today:** Run the Supabase migration. Assign an owner. Verify all 404 endpoints return 200. Test on a real device.
2. **This week:** Move journal storage from local blob to Supabase, tied to `user_id`. Implement RLS policies. Fix the cross-account privacy leak. This blocks all seed and private hive work.
3. **Unblock Project 10:** Tab bar is `Today | Hive | Wallet | Garden`. Wallet tab is a shell showing "Coming Soon." Start building the app shell.
4. **Wallet is Slice 2:** Do NOT build MDK integration, funding flows, or tips in MVP1. Build the tab shell only.
5. **Re-prioritize:** Migrations → storage fix → app shell → private hives → demo prep. Notes and Seeds are code-complete but dead in prod until migrations run.

### Design

1. **Tab bar is decided:** `Today | Hive | Wallet | Garden`. Design accordingly.
2. **Today tab includes Private Hives.** Design the private hive creation flow: "Start a private hive for someone" → compose entries over time → always visible to author → periodic trip down memory lane review → **seal** (the completion act; closing a letter drawer, not addressing an envelope) → optionally send to a connected friend.
3. **The Christmas concept is a Private Hive,** not a separate product. It's a personal gratitude journal kept for a specific person, reviewed on a trip down memory lane, then sealed — and optionally sent. Design the compose + review + seal + (send) experience; the compose flow ends in a seal moment, not a recipient picker.
4. **Wallet tab in MVP1 = shell only.** Design a beautiful "Coming Soon" empty state. No balance, no funding UI, no transactions. Just the shell so the tab bar is complete.
5. **@Pixel's Wrapped goes into the Garden tab,** not as a top-level tab.
6. **Honeycomb tap → action menu is still needed.** Current reveal card is fine for solo browsing. The action menu (Send note, Plant seed, View history) is the social layer. Design as bottom sheet. (Cash App gift link appears in Slice 2.)

### Marketing

1. **Positioning updated (2026-08-17 amendment):** "Gratitude you compile for someone, until it's ready to give." Lead with the Christmas concept for tester recruitment.
2. **Slice 1 success criteria revised** (see above). No money metrics. The demo validates social gratitude + seeds.
3. **Recruit testers who will write journal entries and plant seeds,** not just poke around.

---

## Summary: The Ruling

| Question | Answer |
|---|---|
| Is the journal part of Pollinate? | **Yes. It's the foundation.** |
| Is it legacy? | **No.** |
| What's the tab bar? | **Today \| Hive \| Wallet \| Garden** |
| Where do private hives live? | **Today tab, alongside personal journal** |
| Where does Wrapped go? | **Garden tab** |
| Is the Christmas concept separate? | **No. It's a Private Hive — a personal gratitude journal for someone, reviewed on trips down memory lane, then sealed — and optionally sent. (2026-08-17)** |
| What's the hero sentence? | **"Gratitude you compile for someone, until it's ready to give." Never "a journal that becomes social." (2026-08-17)** |
| Private vs. "Public" hives? | **Private Hive (audience of one) and the Hive (audience of your people). Never "Public." (2026-08-17)** |
| What ships of Private Hives in Slice 1? | **The full arc — write → review → seal → (send) → open. Seal and send are decoupled; sealing never requires a recipient. The reply (8b.8) moves to Slice 1.1. (2026-08-17)** |
| Is the wallet in MVP1? | **No. Shell only. Money is Slice 2.** |
| What's the most urgent task? | **Run the Supabase migration. Then fix journal storage. Both block testing.** |
| What does Slice 1 validate? | **Social gratitude + delayed delivery (seeds). Not money.** |

---

## Amendment — 2026-08-25 (V2 direction: the six open rulings, closed)

These close §6 of `POLLINATE_V2_SPEC.md`. That section is now empty — there is
nothing left waiting on me. Full reasoning lives in the spec; this is the
decision and what it means for your branch.

### 1. Volumes replace one-shot seal — **YES**

This isn't a feature, it's correcting a modelling error. Today's schema asserts
*a hive is a gift*. The product says *a hive is a relationship*. While those are
the same object, "a volume every birthday until he's 18" isn't a hard feature —
it's unrepresentable. Everything in Project 17 hangs off it, and so does the
legacy tier, which §17.5.2b just made the answer for our flagship use case.

Three things are acceptance criteria, not suggestions (spec §17.1a):

- **The client does not change.** A `BEFORE INSERT` trigger resolves `volume_id`
  from the hive's open volume. "HiveStore starts setting it" is the wrong fix —
  we don't control when users update, and an old binary would insert NULL forever.
- **One open volume per hive is a DB guarantee** — partial unique index on
  `(hive_id) where sealed_at is null`, so the trigger is deterministic and a
  double-seal race errors instead of corrupting.
- **ENG-46 ships as two migrations** — additive first (table, column, index,
  trigger, backfill), re-point second. There must be no window where the client
  writes NULL against policies that require it.

### 2. Web reveal requires no install — **YES**

If an 18-year-old has to hit an App Store page before reading eighteen years of
letters from his mother, we've lost at the finish line. Nestori already advertises
"no app required" and they're right to.

Deezine: **DES-17** is a timing-and-easing spec that gets implemented twice, RN
and browser — not an implementation. No Expo-only primitives in the shared reveal
path. (Note: DES-14 and DES-17 got crossed in a recent thread — DES-14 is Pixel's
relationship chip row. The critical-path item is DES-17.)

### 3. Multi-writer hives — **YES on the product, scoped narrower**

A six-author hive is new ground — Storyworth is single-author, Nestori is
parent→child — and it's the only growth loop we have that doesn't need a feed.
Four constraints before Sage ratifies a shape (spec §18.1a):

- **Sequenced after volumes land and settle.** Contributor RLS joins through
  `volume_id → hive_volumes.sealed_at`; building it mid-migration doubles the
  recursion surface for nothing.
- **`is_collective` set at creation, immutable.** Solo or collective from birth.
  Converting later would retroactively expose existing entries to a new reader.
- **Sage's 08-15 call stays right.** It argued about a hive with an audience of
  one whose subject isn't a party to it — that's still every solo hive, and those
  policies don't move. What's new is a hive with multiple *authors*, which the
  08-15 reasoning never contemplated. Scoped extension, not repudiation.
- **Contributor removal, ruled now so it can't stall the build:** removal stops
  new writes and deletes nothing. Entries were written for the *subject*, not the
  owner — an owner must not be able to erase someone else's gift to their child.
  A contributor may delete their own entries while the volume is open. After
  seal, immutable for everyone.

Sage still owns the recursion-safe shape. Product is unblocked; no branch until
that's signed off.

### 4. Simulated nectar before real sats — **YES**

Non-negotiable. It's the cheapest possible test of the riskiest assumption we
have. If nobody zaps fake nectar, we've saved ourselves an SDK integration, a
DUNS number, a legal opinion and an App Review fight.

### 5. Bitcoin stays out of store-facing copy — **YES, with the boundary stated**

Appears in: the wallet consent screen, Settings, ToS/Privacy Policy, and **App
Review Notes, where it is mandatory.** Never appears in: App Store title,
subtitle, description, keywords, screenshots, or the marketing site.

"Out of store-facing copy" must never drift into "hidden from Apple" — concealing
wallet functionality from review is a 2.3.1(a) violation and a rejection. Loud to
Apple, quiet to users.

### 6. Apple Organization enrolment — **YES, starting now**

And it's decoupled from the bitcoin decision. Three reasons, only one of which is
19b: 3.1.5(i) requires it for any wallet; converting Individual → Organization
later is a real migration I don't want to run mid-launch; and an Individual
account publishes under my personal legal name, which is the wrong signal for a
product asking strangers to trust it with eighteen years of letters to their kid.

Even if we killed bitcoin tomorrow I'd still enrol as an Organization. It's the
longest lead item in the plan and it's pure paperwork — it runs in the background
while everything else proceeds.

### Summary — 2026-08-25

| Question | Answer |
|---|---|
| Volumes replace one-shot seal? | **Yes.** Two migrations, DB-side `volume_id` resolver, client unchanged. |
| Web reveal needs no install? | **Yes.** DES-17 is a portable spec, not an implementation. |
| Multi-writer hives? | **Yes** — after volumes, opt-in at birth, immutable, Sage owns the RLS shape. |
| Simulated nectar first? | **Yes.** No 19b work before 19a has tester data. |
| Bitcoin in store copy? | **No** — but loud in App Review Notes. Never hidden from Apple. |
| Apple Organization account? | **Yes. Started now**, regardless of whether bitcoin ships. |
| Anything still waiting on me? | **No. Spec §6 is empty.** |


---

## Amendment — 2026-08-26 (navigation: three tabs, door to the top right)

**This supersedes the 2026-08-17 tab bar ruling.** Full design spec:
`POLLINATE_V2_NAVIGATION.md`.

### The tab bar is now three: `Today | Hive | Garden`

**Wallet is removed.** Spec §5.2(b) already ruled that the honeycomb *is* the
wallet — your balance is honey filling your own hexagon, not a number on a fifth
screen. A Wallet tab would leave a permanent, empty, crypto-shaped hole in the
tab bar of a gratitude app: wrong for users, wrong for App Review, wrong for our
positioning. The tab bar was the last place the old wallet plan was still
standing. It's gone.

Three tabs is better on its own terms anyway — Today writes, Hive connects,
Garden reflects. Three verbs, nothing extra to explain.

### The account door moves to the top right

One render site in `MainTabs`, not per-screen headers — it must not drift a pixel
between tabs, and `headerShown: false` stays false everywhere. Because it no
longer sits beside the capsule, the capsule is symmetric at full width and the
signed-out and signed-in tab bars become identical.

### Where money lives, since it has no tab

> **Emotional and frequent lives in the comb. Administrative and rare lives
> behind the door. Neither gets a tab.**

Zaps happen in the moment — the reveal, an entry, a hexagon. Balance is honey in
your hex on the Hive tab. Funding, withdrawal and the Lightning address are
Account settings, because they're rare and boring.

**All of it is invisible until a user consents to a wallet.** Pre-consent there
is no honey, no zap affordance, and `PackageOpen` ends with a plain Close exactly
as it does today. Consent fires on the first zap attempt, never at signup.

### This ships now, not with the wallet

Removing a shell tab and moving an avatar is Slice 1 work with no dependency on
Project 19. It makes the build we're testing better today. `Wallet` appears in
exactly one file outside its own screen — this is a contained change.

| Question | Answer |
|---|---|
| What's the tab bar? | **Today \| Hive \| Garden.** Three. |
| Where's the Wallet tab? | **Deleted.** The comb is the wallet. |
| Where's the account door? | **Top right**, over content, all three tabs. |
| Where do zaps live? | **In the moment** — reveal, entry, hexagon. No tab. |
| Where's fund/withdraw? | **Account → Nectar.** Rare and boring, so it's behind the door. |
| When does any of it appear? | **Only after wallet consent.** Before that, nothing changes. |
| Does this wait for Slice 2? | **No.** Tabs and door ship now. |

The team is executing well. The ambiguity was mine to resolve. It's resolved now. We're building one app. The journal is where gratitude starts. Private hives are where you journal gratitude for someone, revisit it on trips down memory lane, and package it to share. The Hive is where it's shared. The Garden is where you see it all. Money comes later.

Let's go. 🐝

---

## Amendment — 2026-08-30: the comb rotation is the product

**Ruled by Colin, #Strategy thread `e8cec2c0…`, event
`0effa81d04252afc4ee57272170241cc6ccfcd96b45cb3a78b54b63301af3cff`.** Prior
same-thread ruling `482eee85…`: **no physical printing, ever.** Governing
document: `POLLINATE_COMB_ROTATION.md`.

The 2026-08-17 body above answered "one app, not three" and it still stands:
the journal is the foundation, private hives live in Today, money is deferred.
This amendment changes **which of those is the hero**, and nothing about the
list itself.

- **The comb rotation (V2 §18.2) is promoted from Cycle 11–12 to the centre of
  the product.** A comb is a closed, invite-joined group capped at 20 that
  collectively fills one hive for one member at a time, seals on their occasion,
  blooms it, and rotates.
- **Private hives become the personal mode.** Not deprecated, not demoted in
  quality — the 18-year mother–son case remains the marketing story. It is not
  the revenue story, which V2 §17.5.2b had already established.
- **The paid line is a per-user subscription.** Free: write in **1 comb**, run a
  comb of up to **5 members**, and **be written for by unlimited combs**.
  Premium: unlimited combs, up to 20 members each. V2 §17.5's delivery meter is
  **cancelled** — ruling O1 closed: Pollinate is free for everything except the
  comb. **The price is deliberately unruled** until conditions C1 and C5 return
  (ceiling ~$39/yr, annual preferred).
- **Gate the giving, never the getting.** Membership means writing rights; being
  written for is not membership, so a comb may write for anyone — member or not.
  Without this, a free user would have to pay in order to be *celebrated*, which
  V2 §17.5.5 and the PRD both bar.
- **The friend feed is cut.** V2 §18.2's own caution — the weakest asset in the
  app, competing for attention hives need — becomes binding. The Hive tab is
  comb-first. No photo feed anywhere; that constraint is unchanged.
- **Community without a feed is not a compromise.** A comb is closed, capped, and
  *writes* rather than posts, with co-authors blind to each other until seal.
  There is no audience to perform for — only a subject. This satisfies Colin's
  "community around lifting others up" without touching V2 §0's ban on a public
  gratitude feed.
- **Unchanged:** three-tab navigation and the top-right account door (the
  2026-08-26 amendment above), ~~Slice 1 shipping first,~~ 19a before 19b, every
  money-transmitter guardrail, and the durability promise (which is still
  *unbuilt* — digital export is owed; printing is now ruled out).
  *[Amended 2026-08-31 — "Slice 1 shipping first" is struck. It is retired by the
  **Retired:** bullet in the MVP-scope block below in this same section (`O5`
  closed, `a11aa144…`; `POLLINATE_COMB_ROTATION.md` §9 — there is one release,
  MVP-Comb). The two were written the same day, and listing the clause as
  *unchanged* is the strongest available affirmation of it: a reader who stops at
  this bullet has been told the ruling considered the sequencing and kept it.
  Every other item in the bullet stands. Missed by COPY-13's
  `Slice 1 (still )?ships first` token on inflection alone — "shipping" is not
  "ships"; a literal token is a container too.]*

### MVP scope, ruled 2026-08-30 (event `cf648e7f…`)

**Phases 0, 1 and 2 of `POLLINATE_COMB_ROTATION.md` §8.6 are the MVP — build to
completion now.** Called **MVP-Comb** to keep it distinct from the narrower
"MVP1" used elsewhere in this file and in `Pollinate_Delivery_Slices.md`.

- **In:** the rotation engine, the daily short-note + **simulated** nectar layer,
  and Phase 0's unblockers. The approved merge queue, the demo-gap items and the
  GL1/GL2 luxury pass all carry in — **nothing already in flight is cancelled.**
- **Out:** Phase 4 entirely — IAP, paywall surfaces, and **cap enforcement**
  (the caps are built and left disabled, §8.5). All of 19b/c/d — no real sats.
- **Retired:** the "Slice 1 ships first, *then* the comb work" sequencing. There
  is one release. Shipping a demo of the product before the thing that is now the
  product does not make sense. ~~(`O5` if a separate earlier demo build is
  wanted.)~~ *[Amended 2026-08-31 — `O5` is **closed** (`a11aa144…`, recorded two
  bullets below): one release, no separate earlier demo build. Same defect shape
  as `POLLINATE_COMB_ROTATION.md` §9's own "See open ruling `O5`" pointer,
  repaired in the same pass.]*
- **Definition of done:** a stranger installs, arrives through an invite link
  with no password form, joins a comb, sees *"the comb is writing for Sarah — 6
  days left"*, writes, watches Sarah's reveal bloom with every author's entries,
  sends her a short note with nectar, and does it again next month for someone
  else. If that does not run end to end on a real device with real strangers,
  MVP-Comb is not done.
- **Closed same night (`a11aa144…`):** `O5` — **one release**, the in-flight
  work folds in. `O6` — **`ENG-89` + `ENG-78` are in MVP-Comb**, moved to Phase
  2.7; instrumentation ships in the same binary as the features it measures.
  `O7` — **EAS internal distribution (`OPS-10`, Bumble)**; `11.1` TestFlight
  stays MVP2.
- **The definition of done above is ratified** — Colin: *"I agree with the
  definition of done, i'll have the team anchor to that."* It is the acceptance
  test; completion is not claimable from a ticket count.

