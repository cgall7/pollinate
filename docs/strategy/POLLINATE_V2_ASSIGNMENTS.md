# Pollinate V2 — Work Breakdown & Assignments

**Status:** Active, 2026-08-25 — Colin adopted the spec and the §6 rulings are
recorded as confirmed (see the spec's Status header). Roster remap per the same
message (event `d99dd08d…`): **Bumble owns every infrastructure/ops row** (was
UNOWNED); build rows are split by Sage between **Fizz and Pollen**; design rows
are routed by Lumen between **Pixel and Deezine**.
**Companion spec:** `POLLINATE_V2_SPEC.md` — every issue below cites a section there.
**Amended 2026-08-30 — the Comb Rotation Ruling** (Colin, #Strategy events
`0effa81d…` → `d662661b…`, MVP scope `cf648e7f…`).
**MVP-Comb = Phases 0, 1 and 2 of `POLLINATE_COMB_ROTATION.md` §8.6 — build to
completion now.** Phase 3 is measurement; **Phase 4 (IAP, paywall, cap
enforcement) does not start until Phase 3 returns.** Full scope and exclusions:
that document's §1A. **`ENG-89` + `ENG-78` are IN MVP-Comb** (ruled `a11aa144…`, `O6` closed) — they
moved to Phase 2.7, because instrumentation must ship in the same binary as the
features it measures. **Distribution is `OPS-10` EAS internal distribution**
(`O7` closed); `11.1` TestFlight stays MVP2. **One release** (`O5` closed). `POLLINATE_COMB_ROTATION.md` governs; its §7 is the design handoff
and §8 the engineering handoff. **Project 18 moves from Cycle 11–12 to the
critical path; `ENG-79` is repriced and promoted to the primary paid line;
`ENG-76` is blocked on ruling O1.** New rows in §5A below.
**Estimates:** S / M / L / XL, matching `Pollinate_Linear_Breakdown.md` §Estimates.

---

## 1. Roles

| Owner | Role | Scope in V2 |
|---|---|---|
| **Sage** | Schema & backend architect, pipeline owner | Every migration, every RPC, RLS rulings, gate design |
| **Fizz + Pollen** | Builders | Client wiring, stores, screens, edge functions. Sage splits the ENG rows between them (Colin, 2026-08-25) |
| **Deezine** | Design & motion | Bloom/reveal choreography, zap flight, design-language docs |
| **Pixel** | Design systems & visual | Comb/hexagon states, digital keepsake layout, component specs |
| **Lumen** | Copy & ruling encoding | Prompts, sparks, consent copy, legal copy, doc sweeps |
| **Colin** | Rulings | The seven decisions in spec §6 |
| **Bumble** | Ops / infra | Edge functions, pg_cron, email provider, LNURL server, App Store privacy labels. **§9 gap closed — Colin assigned infrastructure to Bumble, 2026-08-25.** |

Remap the names if the roster has changed; the role column is what the issues
actually depend on.

---

## 2. Sequencing

~~Slice 1 ships first, unchanged. Nothing below starts until the Project 11 launch
blockers clear (TestFlight credentials, `legalCopy.js` placeholders, repo privacy).~~

*[Retired 2026-08-31 — `POLLINATE_COMB_ROTATION.md` §9 (`O5` closed `a11aa144…`): there
is ONE release, MVP-Comb (§1A). The Slice-1-first gate this line places on everything
below it is superseded; the inventory stays as the record of V2's scoping. **Both
sentences go, not only the first** — the second enforces the same gate by a different
mechanism (a launch-blocker precondition) and would have survived an annotation scoped
to the sequencing clause. Its blocker list is itself re-homed: `legalCopy.js` is
`OPS-8`, a Phase 0 row of MVP-Comb; TestFlight moved to MVP2 when `O7` closed, with EAS
internal distribution (`OPS-10`) taking its place.]*

| Cycle | Weeks | Project | Why here |
|---|---|---|---|
| **7–8** | 15–18 | **16 — Prompt Engine** | Cheapest, improves what testers already have. No schema risk. |
| **7** | 15–16 | **20 — Analytics & Crash** | Small, no deps. Ship before Cycle 8 so 17/19a are measurable from day one. |
| **8–10** | 17–22 | **17 — Volumes & Delivery** | The structural unlock. Longest pole. Starts overlapping 16. |
| **8–10** | 17–22 | **19a — Simulated nectar** | Runs *parallel* to 17 — almost entirely client + ledger, no shared files. |
| **11–12** | 23–26 | **18 — Collective Hives & Combs** | Needs volumes (§17.1) to exist first. |
| **13+** | 27+ | **19b/c/d — Real sats** | Gated on 19a's tester signal **and** Apple Organization enrollment. |

**19a before 19b is the whole de-risking argument.** If testers don't zap fake
nectar, they will not zap real sats, and we learn that for the price of client
work instead of an SDK integration, an Org enrollment and an App Review fight.

---

## 3. Project 16 — Prompt Engine (Cycle 7–8)

| ID | Owner | Est | Issue | Deps |
|---|---|---|---|---|
| **ENG-41** | Sage | S | Migration: `private_hives.relationship` (7-value CHECK, `not null default 'other'`). Same `not null default` justification as `20260817000002`. Spec §16.1 | — |
| **ENG-42** | Sage | M | Migration + RPC `file_entry_into_hive(entry_id, hive_id)`. Three guards: ownership, `hive_id is null` source only, not-shared / volume-not-sealed. House revoke pattern (`public` **and** `anon`). Spec §16.5 | ENG-41, ENG-46 |
| **ENG-43** | Sage | S | Migration: `entries.reflection` + 500-char CHECK, per `20260810000001` precedent. Spec §16.4 | — |
| **ENG-44** | Fizz | M | `src/constants/hivePrompts.js` — 4 ladders × age buckets. **Must satisfy the `prompts.js` spark contract verbatim** (lowercase noun phrase, no leading preposition, no dupes) | COPY-1 |
| **ENG-45** | Fizz | M | Deterministic selector `hash(hive_id) + floor(days_since_created / cadence)`. No AsyncStorage, no server call, stable within a day. Spec §16.3 | ENG-44 |
| **ENG-45.1** | Fizz | S | `CreateHive` — relationship chip row under the name field | ENG-41, DES-14 |
| **ENG-45.2** | Fizz | M | `ComposeHiveEntry` — prompt header, spark chips, optional "Why it stayed with you" second field | ENG-43, ENG-45, DES-15 |
| **ENG-45.3** | Fizz | M | `TodayTab` — "File this to…" affordance on a saved entry | ENG-42, DES-16 |
| **ENG-45.4** | Fizz | S | **Gate:** extend `check:onboarding-flow` section D to assert the spark contract over `hivePrompts.js`. Contract violations must fail CI, not review | ENG-44 |
| **DES-14** | Pixel | S | Relationship chip row — 7 values, must not visually compete with the cover-theme row already on that screen | — |
| **DES-15** | Deezine | M | Hive compose surface: prompt presentation, spark chips, the optional second field. The second field must read as *offered*, never *required* — it protects the 20-second entry | — |
| **DES-16** | Pixel | S | "File this to…" hive picker sheet | — |
| **COPY-1** | Lumen | L | **Write all four prompt ladders.** ~30 prompts × 3 sparks per relationship per age bucket. The single largest copy asset in the app and the thing that makes an 18-year hive survivable. Every prompt subject-addressed by name | Colin ruling: none needed |
| **COPY-2** | Lumen | S | Memory Lane + compose copy sweep — gratitude language in, wellness/streak language out. Spec §0 | — |

---

## 4. Project 17 — Volumes & Delivery (Cycle 8–10)

| ID | Owner | Est | Issue | Deps |
|---|---|---|---|---|
| **ENG-46** | Sage | L | Migration: `hive_volumes`, `entries.volume_id`, backfill Volume 1 from existing `sealed_at`/`sent_at`, comment `private_hives.sealed_at/sent_at` as read-only history. Spec §17.1 | **Colin ruling #1** |
| **ENG-47** | Sage | M | `seal_volume(p_hive_id)` replacing `seal_hive()` — same single-RPC-one-transaction shape as `20260819000003`; must preserve that migration's "empty reveal" guard. Opens Volume N+1 | ENG-46 |
| **ENG-48** | Sage | M | `send_hive()` → volume-scoped. In-app delivery writes a `hive_deliveries` row | ENG-46, ENG-49 |
| **ENG-49** | Sage | L | Migration: `hive_deliveries` (channel, `unlock_at`, `token_hash`). **`token_hash` only — never the token.** Spec §17.2 | ENG-46 |
| **ENG-50** | Fizz | L | Edge function `reveal(token)` — returns `{unlock_at, subject_name}` before unlock, entries only after. **Server-side gate, per the `20260813000002` seeds lesson.** Spec §17.2(b) | ENG-49 |
| **ENG-51** | Fizz | XL | **Web reveal page** at `pollinateapp.xyz/open/<token>` running the bloom animation in a browser. No install. Spec §17.2(b) | ENG-50, DES-17 |
| **ENG-52** | Fizz | M | `pg_cron` sweep + email send on `unlock_at`. **Announces, never decides** — a missed run delays the email, never the reveal | ENG-49, OPS-1, OPS-2 |
| **ENG-53** | Fizz | M | Export: `expo-print` HTML→PDF + `expo-sharing`. Screen-and-archive geometry, **not** print geometry (print cancelled 2026-08-24). **Free on every tier, forever** — never gate it | DES-18 |
| **ENG-53.1** | Fizz | M | **Annual archive email** — every user with an open hive is emailed their own export unprompted, once a year. Half the durability guarantee now that print is cancelled. Spec §17.4 | ENG-53, OPS-2 |
| **ENG-54** | Fizz | M | Volume UI in `HiveDetail` — volume list, "seal this chapter", per-volume delivery state | ENG-46, ENG-47, DES-19 |
| **ENG-55** | Fizz | M | Delivery composer: choose in-app / link+date / export; date picker for `unlock_at` | ENG-48, ENG-49, DES-20 |
| **DES-17** | Deezine | XL | **Web reveal choreography.** The bloom must survive leaving the app — this is the emotional differentiator and it now has to run in a browser. Constrains technique (no Expo-only primitives) | Colin ruling #3 |
| **DES-18** | Pixel | M | **Digital keepsake layout** (rescoped from print, 2026-08-24): the export PDF and the hosted reveal page share one design — cover, entry/reflection pairing, volume title pages, phone-readable | — |
| **DES-19** | Pixel | M | Volume list + sealed-volume states in `HiveDetail`. Reuse the `SealCrack` / wax-seal language | — |
| **DES-20** | Deezine | M | Delivery composer + the "opens on…" date moment. Choosing the date should feel like an act, not a form field | — |
| **COPY-3** | Lumen | M | **The durability promise.** Legal-copy amendment: export free forever on every tier, annual archive email, and a written shutdown-export commitment. Load-bearing — and *more* so now that print is cancelled. Spec §17.4 | — |
| **COPY-4** | Lumen | S | Reveal-email copy + the web reveal's app upsell tail ("want to start one for someone?") | — |
| **COPY-5** | Lumen | M | Doc sweep per the `docs/strategy/README.md` ritual: retired token **`package`/`seal the hive`** → volume vocabulary. Publish both yields; verdict reads "N hits, all classified legitimate," never "zero" | ENG-46 |

---

## 5. Project 18 — Collective Hives & Combs (**Cycle 11–12 → CRITICAL PATH, 2026-08-30**)

> **PROMOTED 2026-08-30.** The comb rotation is the hero of the product
> (`POLLINATE_COMB_ROTATION.md`). **`ENG-58`/`59`/`60` are now the hero build**,
> and `DES-21`/`DES-22`/`COPY-6` move with them.
> **Already shipped — close, do not rebuild:** `ENG-56`, `ENG-57`, `ENG-61`.
> `hive_contributors` + `is_hive_contributor()` landed in
> `20260827000001_multi_writer_hives.sql` (+ `20260828000001`), with
> `src/screens/InviteContributor.js` and `ContributingHive.js` (verified at
> `github/main@080edd5`).
> **Still unbuilt — this is the gap:** `ENG-58`. No `combs` / `comb_members` /
> `comb_rotations` migration exists, and no `invite_code` or rotation path exists
> in `src/` (both searched). `ENG-60` needs a scheduler — `pg_cron`, Bumble's lane.


| ID | Owner | Est | Issue | Deps |
|---|---|---|---|---|
| **ENG-56** | Sage | XL | **RLS design ruling + migration:** `hive_contributors`, `is_hive_contributor()` as `security definer` (recursion-safe, `owns_entry()` shape). This reverses `20260815000001`'s explicit owner-only stance — **Sage ratifies the shape before code**. Spec §18.1 | **Colin ruling #4** |
| **ENG-57** | Sage | M | Contributor entry policies: a contributor sees **only their own** entries until the volume is sealed; owner alone can seal and deliver | ENG-56, ENG-46 |
| **ENG-58** | Sage | L | Migration: `combs`, `comb_members` (cap 20), `comb_rotations` + RLS | — |
| **ENG-59** | Fizz | M | Comb invite-link join flow (code generation, cap enforcement, membership) | ENG-58 |
| **ENG-60** | Fizz | L | Rotation ritual: open a rotation, notify the comb, collect entries, seal on `closes_at`, reveal to the subject | ENG-57, ENG-58 |
| **ENG-61** | Fizz | M | Contributor invite + co-authored hive UI | ENG-56, DES-21 |
| **DES-21** | Deezine | L | Collective reveal — N authors' entries blooming in one sequence. Attribution must be visible without turning it into a feed | — |
| **DES-22** | Pixel | M | Comb identity: hexagon cluster, member states, rotation indicator ("writing for Sarah — 6 days left") | — |
| **COPY-6** | Lumen | M | Comb naming + rotation copy. **Never "group," never "community," never "post."** The comb *writes together*; it does not post together | — |

---

## 5A. Comb Rotation Ruling — new rows (2026-08-30)

Detail in `POLLINATE_COMB_ROTATION.md` §7 (design) and §8.3 (engineering).

| ID | Owner | Est | Issue | Deps |
|---|---|---|---|---|
| **DES-29** | Deezine | L | **Comb-first first run.** The app opens on `TodayTab`, a solo journal (`src/navigation/MainTabs.js:115`), and `Onboarding` ends in a personal entry — teaching "journal app" in three seconds and hiding the pillar we sell. Two doors, **comb primary**: *"Start a comb with your people"* / *"Write for one person."* Comb happy path: person → occasion → date → invite by link → write. **Sequence with `ONBOARDING_ZERO_DOOR_SPEC.md`** — same `App.js` region | — |
| **DES-30** | Pixel | M | **Comb-plan paywall surface**, shown when the *second* rotation opens (first rotation is free). Must not intrude on a seal or a reveal — same constraint as `DES-26`. Never "upgrade to unlock" | ENG-79, COPY-13 |
| **DES-31** | Pixel | M | **Rotation state on the Hive tab**: subject, days remaining, contributor **count**. **Never contributor content** — blind-until-seal (spec §18.1) is a privacy boundary, not a nicety. Extends `DES-22` | DES-22 |
| **ENG-83** | Fizz | M | **Magic-link and/or Sign in with Apple.** Auth is email + password only (`src/services/HoneycombStore.js:32-45`). A comb arrives as a *group through one link*; today each member hits a password form individually. Spec §18.2: *"friend-by-friend email matching is not how a real friend group arrives."* **Critical path for the pillar we sell** | — |
| **ENG-84** | Fizz | S | **In-app account deletion.** No `deleteAccount` path in `src/`. **App Store 5.1.1(v) — hard rejection.** Release blocker, independent of this ruling | — |
| **ENG-89** | Fizz | M | **Instrument conditions C1–C4** (ruling §6): rotation participation, reveal→install, comb survival, organizer conversion. Extends `ENG-78` | OPS-8, ENG-75 |
| **ENG-85** | Sage | M | **Entitlement model.** Where a user's plan lives and how the two caps read it: `combs_written_in ≤ 1`, `comb_members ≤ 5` on free. Single server-side source of truth the client cannot spoof; **both limits tunable constants.** **Ships with caps DISABLED** — see the trap below | ENG-58 |
| **ENG-90** | Fizz | M | **Short note + nectar, unscoped from the reveal.** Build one migration containing append-only `comb_nectar_notes`, the client-revoked shared sender→recipient ledger-transfer helper extracted from `record_zap`, and authenticated `send_comb_nectar_note(...)`; add `NectarStore.sendCombNectarNote` + `listCombNectarNotes`; and ship a mutation-capable database/client gate over authorization, `comb_members.removed_at is null`, atomicity, idempotency, stable refusal classes, and sender/recipient-only reads. Send a short note plus simulated nectar to a comb member *any time*, not only at a reveal (`POLLINATE_COMB_ROTATION.md` §5.2a). Accepted API contract: thread event `1442770c…`; visible-state ruling: `bc7c7b06…`. The daily register — and the C5 instrument | ENG-62, DES-32 |
| **OPS-10** | Bumble | M | **EAS internal distribution** for MVP-Comb's seeded combs. The ruled mechanism for reaching non-team devices (`a11aa144…`, `O7`) — **not** TestFlight, which stays MVP2 | — |
| **OPS-9** | Bumble | M | **Rotation scheduler.** `pg_cron` to open a rotation, notify, seal on `closes_at`, trigger the reveal. `ENG-60`'s runtime | ENG-58 |
| **DES-32** | Deezine | M | **Short-note + nectar compose surface.** Eight words and a nectar amount, one-handed, closer to a reaction than an entry. Reuses the `DES-23` flight | DES-23 |
| **OPS-8** | Lumen + Bumble | S | **Close the analytics contradiction before the privacy policy publishes.** `src/constants/legalCopy.js:159,207` promises *"no analytics, crash-reporting or tracking code"* — a published claim that permanently forecloses C1–C4. V2 §20.2 has the fix: **narrow the promise, do not delete it.** Blocks `ENG-89`/`ENG-78` from being honest | — |
| **COPY-13** | Lumen | M | **Ruling sweep.** Retired tokens: `$39.99`, `annual only` / `annual-only`, `$79`, `metered at delivery`, `delivery is the only meter`, `first delivery free`. Follow `README.md`'s ritual — eye-read cited rows, sweep the *retired* token, publish both yields, verdict reads "N hits, all classified legitimate," never "zero hits" | — |

> ### ⚠️ The sequencing trap — read before building `ENG-85`
>
> **Build the caps. Do not enforce them during the measurement period.** The
> seeded combs exist to measure C1/C3/C5. If the 5-member cap is live while those
> combs form, a run club of twelve is strangled at five and **the measurement
> that justifies the model is destroyed by the model's own paywall.** `ENG-85`
> ships with the plumbing in place and both limits unlimited; they flip on with
> the paid tier (Phase 4). Same logic as 19a before 19b: build the mechanism,
> defer the consequence, learn in between.
>
> **Full phased build sequence with owners: `POLLINATE_COMB_ROTATION.md` §8.6.**
>
> **C1 is the number that decides the business** (≥60% of a ~12-member comb
> writing for the monthly subject, sustained 3 months). If it returns 20%, no
> repricing and no design pass saves the model. Seed three real combs — a run
> club, a small group, a group chat — and the answer arrives in eight weeks.

---

## 6. Project 19 — Nectar Zaps

### 19a — Simulated nectar (Cycle 8–10, parallel to Project 17)

| ID | Owner | Est | Issue | Deps |
|---|---|---|---|---|
| **ENG-62** | Sage | L | Land `bumble/nectar-ledger-schema` with `rails_mode = 'simulated'`. Invariants I1–I4 enforced. No real-money code path exists yet | — |
| **ENG-63** | Fizz | M | Zap-a-package: the Slice 1.1 react slot on `PackageOpen`. Optional, unlocks nothing | ENG-62, DES-23 |
| **ENG-64** | Fizz | M | Zap-an-entry mid-reveal + author notification *"Sarah zapped the entry about the hospital waiting room."* Spec §5.2(c) | ENG-63 |
| **ENG-65** | Fizz | M | Honeycomb-as-wallet: `honeyed` hexagon state, balance derived from the ledger. **No Wallet tab.** Spec §5.2(b) | ENG-62, DES-24 |
| **ENG-66** | Fizz | M | Comb pot — nectar riding along with a collective hive. **G2: never a pooled balance.** Contributions settle direct-to-recipient; the pot is a display over ledger rows | ENG-62, ENG-60 |
| **DES-23** | Deezine | L | **Zap flight choreography** — honey drop along the existing pollination path. Reuse `FlyingBee`, `pollinationFlight`, `flightSequencer`, `HoneyDropProgress` | — |
| **DES-24** | Pixel | M | `honeyed` hexagon state + fill levels, alongside blooming / seeded / dormant | — |
| **COPY-7** | Lumen | S | Nectar vocabulary. **"Drops," not "sats." No "bitcoin" anywhere in default UI.** Spec §5.5.2 | — |

### 19b/c/d — Real sats (Cycle 13+, gated)

| ID | Owner | Est | Issue | Deps |
|---|---|---|---|---|
| **OPS-3** | Bumble (+Colin for DUNS/legal entity) | M | **Apple Developer Program — Organization enrollment.** Required by 3.1.5(i). DUNS number, multi-week. **Start now if 19b is real** | Colin ruling #7 |
| **ENG-67** | Sage+Fizz | XL | Breez SDK Spark integration (Rust core → Swift FFI). Self-custodial; Pollinate never takes custody | OPS-3 |
| **ENG-68** | Fizz | L | Privy MPC email-derived keys + **explicit consent screen at first zap, never at signup** (2.3.1(a)) | ENG-67, DES-25, COPY-8 |
| **ENG-69** | Fizz | M | Funding via Cash App / Strike deep link (`https://cash.app/launch/lightning/<bolt11>`) | ENG-67 |
| **ENG-70** | Fizz | M | Withdrawal to `user@cash.app` / `user@strike.me` Lightning Addresses; saved on first funding | ENG-67 |
| **ENG-71** | Fizz | S | Flip `rails_mode` simulated → live. **The UX must not change** — that is the proof 19a was built right | ENG-62, ENG-67 |
| **LEGAL-1** | Colin | M | **Formal legal opinion before any 19b code ships.** Three questions: Privy MPC threshold (G1), comb pot flow (G2), LNURL receive path (G3). ~$15–40K, crypto regulatory firm. Spec §5.6 | — |
| **ENG-72.0** | Sage | M | **G3 spike (blocks ENG-72):** determine Spark's offline-receive path. If funds must route through Pollinate infrastructure, **cut 19c** — do not build it and then ask | — |
| **ENG-72** | Bumble | L | **19c:** LNURL-pay server — `pollinateapp.xyz/.well-known/lnurlp/<name>`. Every user gets a Lightning Address. The bitcoin-community distribution hook | ENG-67, OPS-1 |
| **ENG-73** | Sage | L | **19d:** time-locked nectar volumes. **Option (b), per-hive derived sub-wallet — a social lock, not a cryptographic one, and the UI must say so.** CLTV is research, not v1. Spec §5.5.1 | ENG-67, ENG-46 |
| **DES-25** | Deezine | M | Wallet consent screen. Self-custody explained in one screen without the word "crypto" doing the work | — |
| **COPY-8** | Lumen | M | Consent copy + **App Review Notes**: self-custodial model, consent flow, Damus precedent, no feature unlocking, no task rewards | — |

---

## 7. Project 20 — Analytics & Crash Reporting (Cycle 7, parallel)

Ruled 2026-08-24: the "we run no analytics" promise is retired. Spec §5A.
Small project, no dependencies, can run alongside Project 16.

| ID | Owner | Est | Issue | Deps |
|---|---|---|---|---|
| **COPY-9** | Lumen | M | **Rewrite the two promise sentences** in `legalCopy.js` — `The short version` and `What we do not do`. **Narrow, don't delete:** keep "we never read your entries / never sell or share / no ad networks / no cross-app tracking," retire "zero telemetry." Update the TRIPWIRE block (lines 20–37) in the same edit — it names these exact sentences | Colin: confirm §5A |
| **ENG-74** | Pollen | M | Crash reporting (Sentry). Today only the in-app `ErrorBoundary` exists — we cannot currently see a crash at all. **Must land in the same commit as COPY-9** | COPY-9 |
| **ENG-75** | Pollen | M | First-party product analytics. **No IDFA, no ad SDKs, no cross-app tracking — this is what keeps us out of ATT.** Event + screen telemetry only | COPY-9 |
| **ENG-75.1** | Pollen | S | Opt-out toggle in Account settings, honored client-side (GDPR/CCPA) | ENG-75 |
| **ENG-75.2** | Pollen | S | **Gate `check:no-content-telemetry`** — assert no entry/reflection text is ever passed to an analytics or crash call. This is the half of the promise we are keeping, so enforce it in CI rather than by convention | ENG-74, ENG-75 |
| **COPY-10** | Lumen | S | Sub-processor disclosure — Sentry + analytics vendor join Supabase in `Where your information is kept`, with accurate regions | COPY-9 |
| **OPS-6** | Bumble | S | **App Store Connect privacy nutrition labels** — declare Diagnostics + Usage Data. Currently declares neither; shipping ENG-74/75 without this is a metadata violation | ENG-74, ENG-75 |

---

## 8. Project 21 — Revenue (Slice 2)

> **AMENDED 2026-08-30 — `POLLINATE_COMB_ROTATION.md` §4 and §8.2 govern.**
> - **`ENG-79` is repriced and promoted.** Was "Family / comb plan — $79/yr, up
>   to 6 seats *(Slice 3)*." **Now: the per-user subscription — unlimited combs,
>   20 members each — and it is the ONLY paid line.** Free is 1 comb / 5 members;
>   receiving is never metered. Deps become `ENG-58` + `ENG-85` + a new IAP layer.
>   **Build the plumbing, not the number — the price is deliberately unruled
>   until C1/C5 return (`POLLINATE_COMB_ROTATION.md` §4).**
>   **Re-estimate before committing a cycle: there is no IAP layer in the build
>   at all** (no RevenueCat, no `react-native-purchases`, no StoreKit wrapper in
>   `package.json`), so this row is larger than M.
> - **`ENG-76` is CANCELLED.** Ruling O1 closed 2026-08-30 (`2fff2abe…`):
>   Pollinate is free for everything except the comb, so the $39.99/yr
>   delivery-metered paywall is retired. Close it; `DES-26`/`COPY-12` fold into
>   `DES-30`/`COPY-13`.
> - **`OPS-7` (Apple Small Business Program) is unaffected and still urgent.**
> - **§11's "no price change before `ENG-78` has data" was overridden by Colin's
>   ruling.** Recorded, not hidden — see the ruling's §4.5. The rationale still
>   binds every *future* change: diagnose rotation participation, then reveal
>   quality, then price. Price is the last knob.


Ruled 2026-08-24. Spec §17.5. `OPS-7` and `COPY-11` should move now; the rest
lands with the Slice 2 paywall.

| ID | Owner | Est | Issue | Deps |
|---|---|---|---|---|
| **OPS-7** | Colin | S | **Enroll in the Apple Small Business Program — 15% instead of 30% under $1M/yr.** A form, worth a third of revenue. Do this week | — |
| **COPY-11** | Lumen | M | **Ruling sweep.** Retired tokens: `$2.99`, `/mo`, `monthly`, `1 hive`, `lifetime`. Sweep `Pollinate_PRD.md` §5.1, `Pollinate_Strategy.md` §4, `Pollinate_Delivery_Slices.md`. Follow the `README.md` ritual — eye-read cited rows first, sweep the *retired* token, publish both yields, verdict reads "N hits, all classified legitimate" | — |
| **ENG-76** | Fizz | L | **BLOCKED 2026-08-30 on ruling O1** — do not start until Colin rules whether individual Plus survives; recommendation on file is to retire it (`POLLINATE_COMB_ROTATION.md` §4.3). Original scope: **Paywall: meter volume delivery, and nothing else** (ruled 2026-08-25, spec §17.5.2a — review cadence, friend and seed gates all removed; seeds get a rate limit, not a paywall). Unlimited hives and entries free forever; **first delivery free forever**; every delivery after requires Plus. Annual-only IAP at $39.99 | ENG-48, ENG-49 |
| **ENG-78** | Fizz | M | **Reveal→signup funnel instrumentation. The single highest-priority analytics event in the app** — it is the number the business rests on (§17.5.3). Ships with `ENG-51`, not after | ENG-51, ENG-75 |
| **ENG-76.1** | Fizz | S | Seed rate limit (~5/week, all tiers) — abuse control, explicitly **not** a paywall surface (§17.5.2a) | ENG-76 |
| **ENG-77** | Fizz | M | **Gifted subscription** bundled with delivery, via Apple IAP | ENG-76 |
| **ENG-79** | Fizz | **L+ (re-estimate)** | ~~Family / comb plan — $79/yr, up to 6 seats *(Slice 3)*~~ → **RE-SCOPED 2026-08-30: the per-user subscription — unlimited combs, up to 20 members each. The ONLY paid line.** Free is 1 comb written in / 5 members run. Carries the whole IAP layer, which does not exist in the build (no RevenueCat / `react-native-purchases` / StoreKit wrapper). **Price unruled — build the plumbing, not the number** | **ENG-58**, ENG-85, DES-30, COPY-13 |
| **ENG-80** | Sage+Fizz | L | **Legacy tier — $199 one-time.** Escrowed delivery, verified beneficiary email, annual address-still-resolves confirmation. **Re-scope: closer to core than second-order** — per §17.5.2b this is the *only* capture point for the flagship 18-year use case, which otherwise pays $0 *(Slice 3)* | ENG-49, ENG-76 |
| **DES-26** | Pixel | M | Paywall surfaces at the delivery moment — must not intrude on the seal/reveal emotion | ENG-76 |
| **COPY-12** | Lumen | S | Pricing + gift copy. Never "upgrade to unlock" language at the reveal | ENG-76 |

---

## 8A. Project 22 — Navigation (Slice 1, ships now)

Ruled 2026-08-26. Spec: `POLLINATE_V2_NAVIGATION.md`. No dependency on Project
19 — this is a Slice 1 cleanup that makes the current build better on its own.

| ID | Owner | Est | Issue | Deps |
|---|---|---|---|---|
| **ENG-81** | Fizz | M | **Tab bar 4 → 3.** Delete the `Wallet` `Tab.Screen` + `TAB_ICONS` entry; delete `src/screens/WalletTab.js` (only importer is `MainTabs.js` — verified). Re-run `check:nav-depth` | DES-27 |
| **ENG-82** | Fizz | M | **Account door → top right.** Remove from `TabDock`; render once in `MainTabs` as a safe-area top-right overlay, `pointerEvents="box-none"`. Collapse `endInset` to `SIDE_INSET` and delete the `useHasAccountDoor()` branch — signed-out and signed-in bars become identical | DES-27 |
| **DES-27** | Pixel | M | **Brief: `DESIGN_BRIEF_V2_NAVIGATION.md` Part A.** Three-tab capsule + top-right door. Symmetric capsule at full width, icon re-spacing for 3, door placement/size against safe area on all three tabs | — |
| **DES-28** | Deezine | L | **Brief: `DESIGN_BRIEF_V2_NAVIGATION.md` Part B.** Zap surfaces 1–4. Honeyed hexagon mark (never a fill — spec §5.2(b)), the `PackageOpen` react slot, the per-entry drop, the action-menu row. **All four gated behind wallet consent** — design the pre-consent state too, which is "exactly as today" | ships with 19a |

> Sequencing (verified 2026-08-26, not part of the ruling): `ENG-81`/`ENG-82`
> edit `MainTabs.js`, which five branches in the standing merge queue also
> touch. The standing queue lands first; the nav change is cut on top. `DES-27`
> proceeds immediately (no diff to merge against). For `DES-28` Surface 1, the
> honeyed mark inherits DES-24 (workspace `GUIDES/POLLINATE_V2_DES24_HONEYED_HEXAGON.md`)
> rather than re-deriving it — see spec §5.2(b).

---

## 9. The ops gap (raise before Cycle 8)

**Closed 2026-08-25 — Colin assigned infrastructure to Bumble** (event
`d99dd08d…`). The table stands as Bumble's queue, lead times unchanged:

| Need | Blocks | Lead time |
|---|---|---|
| **OPS-1** — MX/inbox on `pollinateapp.xyz` | ENG-52, ENG-72 | days |
| **OPS-2** — transactional email (Resend/Postmark) | ENG-52 | days |
| **OPS-3** — Apple Organization enrollment | all of 19b | **weeks** |
| **OPS-4** — web reveal hosting (`/open/<token>`) | ENG-51 | days |
| ~~OPS-5 — print partner~~ | **Cancelled 2026-08-24 — digital delivery only** | — |

~~The team is five agents and a founder; none of them owns infrastructure. Decide
who does, or the delivery layer stalls behind a DNS record.~~ *Resolved: Bumble.*

---

## 10. Critical path

```
Colin ruling #1 (volumes)
  → ENG-46 (hive_volumes)
    → ENG-47 (seal_volume)
    → ENG-49 (hive_deliveries)
      → ENG-50 (reveal edge fn)  ─┐
      → DES-17 (web choreography) ┴→ ENG-51 (web reveal) ← THE UNLOCK
    → ENG-56 (contributors RLS) → ENG-60 (comb rotation)
```

`ENG-51` is the item that makes the mother–son case real. `DES-17` gates it and is
XL. **Start DES-17 the day ruling #3 lands** — it can be designed against a stub
while ENG-46/49/50 are still in migration review.

Parallel and independent: all of Project 16, and 19a up to `ENG-65`.

---

## 11. Do not start

> **Amended 2026-08-30.** Added: **`ENG-76`** (delivery-metered $39.99 paywall) —
> blocked on ruling O1. **A friend feed in the Hive tab** — cut by the comb
> rotation ruling; the tab is comb-first. **Any comb-plan price change before
> `ENG-89` has C1 data** — same rationale as the `ENG-78` row below.
> Removed: nothing. The `ENG-78` price-change row stands, with the note that
> Colin's 2026-08-30 ruling overrode it once, knowingly (ruling §4.5).


- **ENG-35 through ENG-40** (old Spark / Cash App iMessage Slice 2 issues) —
  **cancelled** by spec §5.6. Close them; do not migrate them.
- **Lightspark Grid** — explicitly out. No bank transfers, no debit cards, no
  fiat on/off-ramps.
- **Any 19b work before 19a has tester data.** The phasing is the de-risking.
- **Any 19b work before `LEGAL-1` returns.** Non-negotiable.
- **Any price change before `ENG-78` has reveal→signup data.** If that number is
  low, the reveal is the problem, not the price (§17.5.3).
- **`ENG-72` (19c) before the `ENG-72.0` spike answers G3.**
- **A photo feed in the Hive tab or a comb.** Locket and Retro own that; we lose.
- **Reverse or hive→hive entry moves** (§16.5) — journal→hive only in v1.

## 12. New labels

`volumes` · `delivery` · `web-reveal` · `prompts` · `comb` · `collective` ·
`nectar` · `simulated-rails` · `apple-compliance` · `ops` · `telemetry`

## 13. Gates to add

Every project below ships with at least one `scripts/check-*.mjs`, per house rule:

- `check:hive-prompts` — spark contract over `hivePrompts.js` (ENG-45.4)
- `check:volume-seal` — sealing V(N) opens V(N+1); sealed entries immutable
- `check:reveal-gate` — **embedded-postgres**: a delivery token returns no entry
  text before `unlock_at`. This is the seeds-lesson regression net
- `check:contributor-rls` — a contributor cannot read a co-contributor's entries
  pre-seal
- `check:ledger-invariants` — I1–I4 hold under simulated rails
- `check:no-crypto-copy` — the word "bitcoin"/"sats" never reaches default UI
  strings (spec §5.5.2 as an enforced rule, not a convention)
- `check:no-pooled-custody` — no code path credits a Pollinate-controlled wallet
  from one user and debits it to another (G2/G3 as an enforced rule)
- `check:no-content-telemetry` — entry/reflection text never reaches an
  analytics or crash call (ENG-75.2)
