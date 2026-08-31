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
19a-before-19b phasing. ~~Slice 1 still ships first.~~ **Retired 2026-08-30,
same day: §9 retires the "Slice 1 ships first, *then* the comb work"
sequencing and `O5` closed it — there is ONE release, MVP-Comb (§1A). This
sentence was left standing when §9 was written; it is the most-read paragraph
in this document, so it is annotated here rather than only there.**

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
| **Phase 1** | The rotation engine — `ENG-58`, `ENG-85` (caps **disabled**), `ENG-83`, `ENG-59`, **`ENG-93`** (§1B.29), **`ENG-94`** (§1B.32), `OPS-9`, `ENG-60`, `DES-33` (**not `DES-21`** — see §1B.3), `DES-22`, `DES-29`, `DES-31`, `COPY-6` |
| **Phase 2** | The daily layer — `ENG-90`, `ENG-65`, `ENG-66`, `DES-23`, `DES-32`, `COPY-7`. **`ENG-62` is already shipped** (§1B.2) |
| **Phase 2, measurement** | `ENG-89` + `ENG-78` — instrumentation **is in the MVP** (ruled `a11aa144…`, closing `O6`). `OPS-10` — **EAS internal distribution**, the ruled mechanism for reaching seeded testers (`a11aa144…`, closing `O7`; **not** TestFlight, which stays MVP2) |
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

**2. `ENG-89` is IN the MVP — ruled `a11aa144…`, closing `O6`.**
Analytics events have to be present in the build *when the behaviour happens*; a
rotation that already occurred cannot be instrumented afterwards. Shipping
MVP-Comb without `ENG-89` would mean Phase 3 measures nothing and the seeded
combs are spent for no data. **`ENG-89` and `ENG-78` are build tasks and moved
into Phase 2** (rows 2.7). Seeding and waiting stay outside the MVP — those are
operations, not build.

**3. Distribution is EAS internal distribution — ruled `a11aa144…`, closing `O7`.**
Seeding three real combs of strangers requires shipping to non-team devices.
**`11.1` TestFlight stays in MVP2 and does not come into MVP-Comb**; `OPS-10`
(EAS internal distribution) is the ruled mechanism instead. Bumble owns it.

### The definition-of-done for MVP-Comb — **ratified by Colin, `a11aa144…`**

> *"I agree with the definition of done, i'll have the team anchor to that."*
> This is the acceptance test. **Completion is not claimable from a ticket
> count.**

A stranger can: install → arrive through an invite link without a password form →
join a comb → see *"the comb is writing for Sarah — 6 days left"* → write an entry
→ watch Sarah's reveal bloom with every author's entries → send her a short note
with nectar → and do it again next month for someone else.

**If that sentence does not run end to end on a real device with real strangers,
MVP-Comb is not done.**

---

## 1B. Amendments — 2026-08-30, after the #Collab handoff

Seventeen corrections. Seven came from the builders reading the encoding against the
tree; one is a ruling Colin made after this doc was written; two are rulings the
builders asked me for (§1B.8) or made themselves and I have upheld (§1B.9). **Verified against
`github/main@cdb07a1`** — the tip moved from `080edd5` while the brief was being
read; see §1B.7.

**[Amended 2026-08-30 (§1B.36.23) — the count above is as-written, and §1B IS IN
TWO PARTS.]** *"Seventeen corrections"* was exact when this preamble was written.
§1B now holds **69** sections (this commit included) — and, more importantly, they are **not
contiguous**: **§1B.1–§1B.32 run from here down to §2; §1B.33–§1B.36.23 resume
after §11, at the end of this file**, with §2–§11 sitting between the two halves.
A reader who takes §2 as the end of §1B misses **34 sections** — including every
§1B.36.x: `ENG-100`, `OPS-9`'s advance, the tombstone class, `subject_name`, and
the entire gate arc. A continuation marker now sits at the §1B.32/§2 boundary.
The split began at `1fc1696`; §1B.36.23 records why it is **marked rather than
reflowed**.

### 1B.1 — The free cap is **5 members inclusive of the organizer**. The 20 is not superseded.

Colin ruled (event `a68da86a…`): *"the first comb as 5 free members. if you want
more combs or more members you have to pay for premium."*

Pixel asked the arithmetic question: does the organizer occupy one of the 5?
**Yes. Product call, mine.**

- `comb_members` holds **one row per writer**, and the organizer writes. A free
  comb is **organizer + 4 invitees**. The cap is a row count on `comb_members`,
  which is the only number the plumbing can actually see.
- It already agrees with `DES-30`, which fires the paywall at *"adding the **6th**
  member."* Sixth from a first who is the organizer.
- Every seat-priced group product counts the owner — Slack, Notion, Figma,
  Workspace. The ones that don't spend the rest of their lives explaining why
  the number in the copy isn't the number on the screen. **The consistency is
  worth more than the extra seat.**

**Correction to the record: the 20 is *not* superseded.** They are two different
caps and both are live:

| Cap | Value | Counts |
|---|---|---|
| **Free comb** | 5 | rows in `comb_members`, organizer included |
| **Hard ceiling, any comb** | 20 | same count. §1 and §8.4 — *"closed, capped at 20"* |

Colin's ask #4 (*"up to 20 people join"*) is the **premium** ceiling and it
survives intact. `ENG-59`'s invite path must be built against 20, not 5.

**The rotation subject does not consume a seat** — `comb_rotations.subject_profile_id`
references `profiles`, not `comb_members` (§18.2(2)), deliberately, so a comb can
write for someone outside it. When the subject *is* a member — the normal case —
they are already counted as a writer. Pin this in the migration comment; the next
reader will assume the subject is a member.

**In MVP-Comb neither number is enforced** (§8.5). Both are built, both are off.

### 1B.2 — `ENG-62` is closed. It shipped four days ago.

Sage's correction, verified: `supabase/migrations/20260826000001_nectar_ledger.sql`
is a full double-entry ledger, merged and prod-live since 2026-08-26.
`ledger_accounts.owner_user_id → profiles(id)` (generic, **not** hive-scoped),
`ledger_settings.rails_mode` defaults `'simulated'`, plus `nectar_sim_service`
and `nectar_sats_override`. §8.1 listed `ENG-56/57/61` as shipped and missed this
one.

**Consequence: `ENG-90`, `ENG-65` and `ENG-66` are not waiting on Sage.** The
ledger is there to ride today. Phase 2 rows 2.3–2.5 lose a dependency.

### 1B.3 — `DES-21` is closed; the rotation frame is **`DES-33`**.

Pixel built and merged `DES-21` as filed — `github/main@a02e247`, verified an
ancestor of the tip. Reusing a closed number made merged work read as open and
made an XL estimate carry work that is already done. **New number.**

| ID | Owner | Est | Issue |
|---|---|---|---|
| **DES-33** | Deezine | S/M | **The reveal needs tense.** The collective bloom renders today (`PackageOpen.js:511`, `:618-620` — per-entry `authorName`, colophon roster, count-not-content). What it has no notion of is *"this month"* and *"next month, for someone else."* Design the **rotation frame** around the shipped bloom. Spec against `GUIDES/POLLINATE_V2_DES21_COLLECTIVE_REVEAL.md`; **do not rebuild the bloom** |

### 1B.4 — `ENG-85` needs a per-comb override, or §8.5 detonates in Phase 4.

§8.5 says build the caps and leave them off so a seeded run club of twelve is not
strangled at five. That is right, and it is incomplete: **when the caps flip on in
Phase 4, that same comb of twelve is retroactively over the limit.** The trap we
avoided at seed time re-arrives at monetization, pointed at the exact relationships
the measurement was built on.

**`ENG-85` ships with a per-comb entitlement override column.** Nullable, unset by
default, set for every comb created before the flip. It costs a column now and a
migration-against-live-combs later. Pixel is right that the residual bill arrives
as copy under `COPY-13` — but grandfathering makes that sentence *"your comb keeps
its twelve"* instead of *"four of your friends have to leave."*

### 1B.5 — Colin's #2 and #3 have rows now. #5 does not mean what the encoding assumed.

Colin ruled four items into MVP-Comb at `a478c335…` (02:45), three minutes before
the brief. #4 was already `ENG-59`. The other three:

| ID | Owner | Est | Issue |
|---|---|---|---|
| **DES-34** | Pixel | M | **The mascot's sitting motion.** Colin: *"has to get fixed for mvp-comb… needs to get way better."* Perch weight `R-PW-1/2/3` is derived constants on **`pixel/perch-weight@40b04ed`** (PR `ed746e20…`, pushed 03:16Z, merge-base `cdb07a1`), verified **not** an ancestor of the tip and **marked NOT WIRED / DO NOT MERGE by its own author** until `DES-34` consumes `R-PW-3`; `MascotBee` is untouched and has no settle beat. Bee motion is licensed by a cause outside the bee — landing **is** a cause, so this is in-principle clean |
| **DES-35** | Pixel | M | **Glass prominence to ≥23% of the display.** Colin: *"i love the idea of getting the [glass] to over 23% of the screen. Let's do that."* A floating cover-tinted header, 6.54% → 23.1%. **This is a new composition, not the GL1/GL2 pass** — do not let it get absorbed. **Its material prerequisite is now satisfied** (§1B.7). Glass stays chrome only; a header is chrome |
| **DES-36** | Pixel | S | **The nectar door on the reveal is unfindable, and `ENG-90` does not fix it.** See below |

**On #5 — two doors do not fix an unfindable first one, and Pixel is right to
flag it.** Verified at the tip: the *only* nectar send surface in `src/` is
`NectarSendPanel`, reached from `PackageOpen.js:571` — a **22pt unlabelled icon
in an entry card's rail**, double-gated on `nectarConsent && authorReachable`
(`PackageOpen.js:474`, `:536`, `:566`). Pre-consent it is an `enter-outline`
glyph; `src/constants/nectar.js:218` states the intent plainly — *"the nectar row
does not exist."*

So Colin could not find the door because, for his account state, **there wasn't
one to find**. That is a gating-and-affordance defect on the existing surface.
`ENG-90` + `DES-32` build a *second*, any-time door somewhere else entirely.

**Ruling: `ENG-90` does not supersede the in-reveal send.** They are one compose
sheet with two entry points — in-reveal (contextual, "for this memory") and
in-comb (`ENG-90`, any time). `DES-32` specs **one sheet**. `DES-36` fixes the
in-reveal entry point's discoverability. That is what #5 asked for.

### 1B.6 — Account deletion crosses the rotation, and nobody owns the seam.

Two findings that only collide when read together:

**Fizz is right about the ledger, for a stronger reason than the one given.**
`ledger_accounts.owner_user_id` is `on delete restrict`
(`20260826000001:84`), so a hard delete FK-violates for anyone who has touched
nectar. Fizz proposes anonymizing the rows. **Confirmed, and it is not a
preference:** the ledger is double-entry. Deleting one side's postings breaks
debits = credits — the invariant the whole ledger exists to hold. Anonymize is
the only option that leaves the books valid. `ENG-84` proceeds as scoped.

**The unowned seam: what happens to a rotation whose subject deletes their
account mid-month?** `private_hives.subject_profile_id` is `on delete set null`
(`20260815000001:19`). If `comb_rotations` copies that shape — and §1B.1 says it
should — then `ENG-84` can leave a live rotation pointing at nobody, which
`OPS-9`'s `pg_cron` tick will then iterate over. **`ENG-58` must define a
rotation state that tolerates a null subject** (void it and advance, do not
stall), and `OPS-9` must skip it rather than fault. @Sage owns the column,
@Bumble owns the tick, @Fizz's `ENG-84` is what fires it.

> **AMENDED — see §1B.15. The paragraph above is superseded on its mechanism,
> upheld on its conclusion.** `ENG-84` was ruled to **tombstone** the profile,
> not delete the row (Colin, `34d96ff7…`). Nothing is deleted, so
> `on delete set null` **never fires** and `subject_profile_id` stays non-null.
> The state to tolerate is a **tombstoned** subject, not a null one — and
> because the FK still resolves, **nothing in the schema stops a rotation from
> sealing and delivering into a deleted account.** Void-and-advance survives as
> the ruling and must now be *enforced* in `ENG-58`, not inherited from a null
> FK. Read §1B.15 before building to this paragraph.

### 1B.7 — The tip moved. Pixel's glass prerequisite is already merged.

Lumen and Pixel both scoped from `github/main@080edd5` and both recorded the two
glass PRs as unmerged. **They merged at 2026-08-29 22:34.** Verified by
`ls-remote` and `merge-base --is-ancestor`:

```
github/main = cdb07a1   (was 080edd5)
  cdb07a1  GL7(b'): the capsule takes the clear rung, and the veil moves with it
  13cf806  GL7(d'): the borrower circles get the edge, not the material
  3648631  GL7(a) gate: name D6's sensitivity axis
  d616860  GL7(a): the glass edge is the hairline
```

`13cf806` and `cdb07a1` are both ancestors of the tip. **`DES-35` is unblocked
on material.** Everyone re-scope from `cdb07a1`.

**Also confirmed against the tip, for `ENG-58`:** the subject-as-slot pattern is
not new — `private_hives.subject_profile_id uuid references public.profiles (id)
on delete set null` has existed since `20260815000001:19`, and
`private_hives_send.sql:71` restricts the subject's own read to
`auth.uid() = subject_profile_id and sent_at is not null`. **That answers
Pixel's `DES-31` question: on today's layer the subject cannot read the roster
or a count before the seal, by construction.** `hive_contributors_select`
(`20260827000001:233-239`) admits only the owner or an active contributor, and
the migration's own comment says that is deliberate. If `DES-31` shows the
subject a count, it must come from a **snapshot at seal** — the
`contributor_names` shape (`HiveStore.js:443`, `:485`) — not a live read. That is
a column decision inside `ENG-58`, not a design decision downstream of it.

> **Annotation, added with §1B.9 below:** the conditional in the sentence above
> (*"if `DES-31` shows the subject a count"*) has since been answered — **it does
> not.** Pixel ruled the subject sees no count at all, live or snapshot, and I
> have upheld it. The snapshot-vs-live analysis stands for the *member's* view;
> it no longer has a subject-facing case to cover. Read §1B.9 before acting on
> this paragraph.

### 1B.8 — `DES-22` draws **presence, not capacity**. Confirmed.

Pixel asked for this ruling and read it correctly before I answered: `§1A` puts
`DES-30` and all cap enforcement **out** of MVP-Comb, so **no surface in
MVP-Comb names the number 5.** It lives in the plumbing and nowhere a person can
see it. **Confirmed — spec it that way.**

The literal reading is the right one, and there are two harder reasons under it.

**1. A denominator you are not enforcing cannot be drawn honestly.** §8.5 exists
so a seeded run club of twelve is not strangled at five. That comb *will* exist —
it is the point of the seed. `"12 of 5"` is not a state a UI can render. Every
denominator on that screen either lies about the limit or advertises a limit we
have deliberately switched off. There is no third rendering.

**2. The price is unruled, and pixels are the most expensive place to store a
business decision.** `O4` (§4, still open) leaves the price blank on purpose
until `C1` and `C5` return. A surface that names 5 hard-codes one half of a
pricing model whose other half we have refused to guess. Every consumer product
that painted its tier boundaries into the core UI before the tiers settled paid
for it twice — once to build them, once to tear them out. Draw the thing that is
true regardless of price.

**So `DES-22` draws:** ~~who is here, who has been invited and not joined, who has
not written this rotation. **Presence, invitation, participation.**~~ No
denominator, no seats-remaining, no fullness, no progress-toward-full — a comb of
four and a comb of twelve are drawn by the same rule, and neither is drawn as
*partly full.*

> **AMENDED 2026-08-31 (Vector, §1B.37) — the no-denominator ruling stands
> untouched; the triad naming what it applies TO is stale in two of its three
> clauses, and this sentence is the one everyone cites.** (i) *"who has been
> invited and not joined"* is **STRUCK** — the comb invite model is one shared
> unattributed code (`combs.invite_code`), no per-recipient row exists anywhere in
> the schema, so the state has no query. Found by @Pixel, ruled by @Lumen, verified
> independently by me. (ii) *"who has not written this rotation"* is **member-view
> only** — §1B.9 (the very next section) bars per-person write-status to the
> subject, and this sentence carries no view qualifier, so read alone it authorizes
> the chase list §1B.9 exists to prevent. (iii) *"who is here"* survives intact and
> is now the only clause that does. **The rule this section actually rules —
> presence, not capacity — is unchanged and is not what was wrong here.**

**On the bill Pixel says arrives later as copy: §1B.4 has already paid most of
it.** With the per-comb entitlement override, a comb that grew to twelve during
the measurement window **keeps its twelve** — so no existing comb is ever shown a
cap it was never shown while forming. The hardest sentence in `COPY-13` is not
*"four of your friends have to leave."* It is not written at all. The cap first
becomes visible to combs formed **after** enforcement, where a denominator is
honest because it is live.

`DES-22`'s missing denominator and §1B.4's grandfathering are the same decision
seen from two sides. @Lumen — that is the constraint `COPY-6` and `COPY-13`
inherit.

### 1B.9 — Pixel's `DES-31` ruling is **upheld**: the subject sees no **write-status** count. It also protects `C1`.

> **AMENDED 2026-08-30 (§1B.21) — the term in this section was wrong and it was
> read both ways.** This section originally said *"contributor count."* In this
> schema `hive_contributors` is the **invited roster**, so that phrase literally
> names a **membership** count — the one thing this section's own reasoning never
> argued against. Every argument below is about **who has written**. The bar is
> and always was on **write-status** counts; membership size is not a spoiler.
> Corrected in place. See §1B.21 for the consequence, which is a live `ENG-58`
> requirement, not a wording matter.

Pixel ruled, without waiting for me, that **the rotation subject sees no
write-status count before the seal — not a live one, not a snapshot one, not
*"some people have written."*** How many have **written** is the **member's**
view only. **Upheld.** Ruling made correctly and at the right moment; `ENG-58`'s
schema should not have waited on it.

Pixel's reason is a design reason and it is sound: a rising count is a progress
meter on how many people care, delivered before the gift, and it can only land
two ways — higher than she hoped or lower.

**The reason I would add is a measurement reason, and it is the one that would
have cost us the release.**

`C1` is defined at §6 (`:511`) as *"share of an active comb who write for that
month's subject."* **If the subject can watch that share while the rotation is
open, the subject will act on it** — she chases the quiet ones, because that is
what any decent person does when shown a number about their own friends.

`C1` then stops measuring organic participation and starts measuring **nudged**
participation. We would have shipped our own KPI to the single person with the
strongest incentive and the best standing to move it.

The failure is worse than a wrong number, because it is **silent and it
misroutes**. §6 pre-commits a response to each failure signature so a bad result
produces action instead of an argument. But *"combs form and people write
unprompted"* and *"combs form and the subject chases everyone every month"*
produce **the same `C1`** and demand opposite responses — the first is a business,
the second is a chore with a good retention curve and no organic engine. A
contaminated `C1` does not just cost us the number; it walks us confidently into
the wrong row of §6's table. `C1` is the number that decides the business
(`:517`), so this is the one place contamination is unaffordable.

**Blind-until-seal is therefore load-bearing twice** — a privacy boundary for
Sarah, and the isolation that makes `C1` a real measurement. Two independent
reasons for the same line, which is how you know it is not a preference.

**What this does and does not do for `ENG-58`.** @Sage: it removes the
requirement for a subject-facing count query — nothing in MVP-Comb needs one.
**~~Struck 2026-08-30 — see §1B.21. MVP-Comb needs exactly one: a `comb_members`
count. Do not build `ENG-58` to this sentence.~~** It
does **not** make Pixel's role-aware read guard optional, and Pixel's correction
to your *"identical shape"* is right: in the hive, subject and contributor are
disjoint **by enforced constraint**
(`hive_contributors_insert_owner`, `20260827000001:248-257`), which is exactly
why the bare owner-or-contributor policy is safe there. **In a comb the subject
is normally a member — that is what a rotation is** — so the same policy shape
hands the subject the full roster during their own month. The hive's guard is on
*identity*; the comb's has to be on *role in the current rotation*, and it cannot
be an insert-side constraint, because forbidding the subject from being a member
would forbid the rotation. **That guard is new work, not inherited.**

### 1B.10 — The design longest pole is `DES-22`, not `DES-21`. The brief got this wrong.

Pixel's catch, and it stands. The brief and §8.7 both said *"`DES-21` and
`ENG-58` are the two longest poles. Start both immediately."* Every clause of
that is now wrong except `ENG-58`:

- `DES-21` is **closed** (§1B.3) — telling the team to start it first pointed the
  design lane at merged work.
- Its successor `DES-33` is **S/M, not XL** — a frame around a shipped bloom.
- **`DES-22` has two rows queued behind it** — `COPY-6` (8.6 row 1.10, an explicit
  dependency) and `DES-29`'s comb happy path *person → occasion → date → invite →
  write*, which cannot be drawn until comb identity exists. `DES-33` has none.

**Depth of the queue behind a task, not its own estimate, is what makes a pole.**
The brief ranked by estimate and inherited an estimate that had gone stale. §8.7
and 8.6 row 1.4 are corrected; `DES-22` starts first in the design lane.



### 1B.11 — `DES-33` is **not** behind `DES-22`. `DES-29` is. Row 1.5 was wrong.

Deezine read the design lane as *"`DES-22` clears, then `DES-33` and `DES-29`
follow."* Half right, and the wrong half is mine.

- **`DES-33` has no dependency and starts now.** §1B.10 says so in its own words
  — *"`DES-33` has none"* — and the §8.7 graph shows nothing upstream of it; it
  feeds `ENG-60` and is fed by nobody. It is a **frame around a bloom that is
  already merged** (`a02e247`, re-verified an ancestor of the live tip
  `cdb07a1`). Nothing about tense — *"this month" / "next month, for someone
  else"* — waits on comb identity. Row 1.6 now says so.
- **`DES-29` is behind `DES-22`**, per §1B.10: the comb happy path *person →
  occasion → date → invite → write* cannot be drawn before comb identity exists.
  **Row 1.5 said "— (start now)" and that was a defect** — the dependency was
  stated in §1B.10 and drawn in §8.7 but never reached the row where the owner
  meets it. Corrected above.

**The lesson is the one §1B.10 already paid for once:** a correction that lands
in a prose section does not reach the person reading the table. Annotate the row.


### 1B.12 — `DES-34`/`DES-35`/`DES-36` are **Pixel's**, and they are the gated set.

Deezine read all three as theirs. Rows 1.11–1.13 name **Pixel**, and `DES-34` is
not greenfield: the perch-weight constants `R-PW-1/2/3` already exist on
**`pixel/perch-weight@40b04ed`**, re-verified **not** an ancestor of the live tip
`cdb07a1`. A second owner starting there duplicates an unmerged branch.

**Cite corrected twice over.** This section originally read `pixel/perch@2fab96b`
— wrong branch name *and* wrong SHA; Pixel corrected both at 03:08. Lumen carried
that correction forward at 03:14 with *"local-only,"* which was true when Pixel
said it and is **no longer true**: `ls-remote --heads github` now returns
`40b04edb7ff8cdf04946ecc17af4be261f541a18  refs/heads/pixel/perch-weight`, and PR
`ed746e20…` opened against it at **03:16:33Z**, merge-base `cdb07a1`.

The third state is the one that matters for sequencing, and neither earlier cite
carries it: the branch is now **visible and sequenceable, and simultaneously a
merge hazard.** Its PR body and its commit subject both say *"NOT WIRED — do not
merge"*, because `R-PW-3`'s settle-beat constants have **no consumer** —
`MascotBee` is untouched. `R-PW-1`/`R-PW-2` are live the instant it merges;
`R-PW-3` is inert. Anyone treating *"has an open PR"* as *"ready to land"* ships
two tuning changes and a dead constant set. **`DES-34` is what makes it
mergeable**, not what follows it.

There is a clean line under this, and it is not a coincidence:

- **Colin's `a478c335…` rulings are exactly `DES-34`/`35`/`36`** (plus `ENG-59`,
  already owned). They are the *"all of these"* Lumen was asked to validate.
- **`DES-33` and `DES-29` come from the brief**, whose definition of done Colin
  ratified at `a11aa144…`.

So the three rows Deezine claimed are precisely the three under Lumen's gate, and
the two rows that are actually Deezine's are precisely the two that are not.
**Deezine's lane is not gated.** Colin's hold — *"pixel wait for the go ahead
from lumen before continuing work"* — names Pixel, in a thread on Pixel's own
board. Scope: I have this quoted verbatim twice by Pixel; `a478c335…` is not in
this channel and I did not read the original event myself.

Against that stands Colin's instruction to this thread at `f2c15b7d…`: **"Please
do not stop working until the definition of done is complete."** A gate addressed
to one owner is not a team-wide stop.


### 1B.13 — Line-number citations into this document are already dead. Cite sections.

**[Amended 2026-08-30 (§1B.36.23) — the RULE is upheld; its stated MECHANISM
expired at `1fc1696`.]** The ground given below is *"§1B has now grown thirteen
times, always upward, and every growth shifts every line of §2–§11 down."* That
was true for this document's first 29 commits, over which §2 climbed from line
`37` to line `2798`. It has been **false for the 36 commits since**: §1B.33
onward append **below §11**, so §2 sat at `2798` while the file grew from 3,806
lines to 5,481. Line cites into §2–§11 have therefore been *accidentally stable
all evening* — I published four of them tonight and @Lumen verified two, and
every one resolved, because a second defect (§1B's split, §1B.36.23) was
neutralising the hazard this section exists to name. **A rule whose violations
stop having consequences stops being a rule.** The rule stands on stronger
ground: stability here is a property of *where the next amendment happens to
land*, and it reverses the moment anyone prepends to §1B or reflows the split.
Cite sections.

Sage verified organizer-in-5 against `POLLINATE_COMB_ROTATION.md:152` and `:176`.
**That verification was correct** — at `5a39495`, the revision Sage fetched and
`ls-remote`-confirmed. Pixel independently re-verified the same `:152`. Both were
right. Both citations are now dead, and I broke them.

At the live tip `eceee54`:

| Cited | Was, at `5a39495` | Is, at `eceee54` | Content now at |
|---|---|---|---|
| `:152` | `\| **Members in a comb you run** \| **5** (you + 4 writers) \| **20** …` | `\|---\|---\|---\|` | **§3.1**, the tier table |
| `:176` | *"The only person who meets the member cap is the organizer"* | *"Consequence: `ENG-90`, `ENG-65` and `ENG-66` are not waiting on Sage"* | **§3.2**, rule A |

The right-hand column is a **section**, deliberately. I drafted it as `:480` and
`:504` — the line numbers those two facts sat on while I was writing this
paragraph — and adding this very section pushed them to `:548` and `:572` before
the commit existed. A remap table written in line numbers expires inside the
edit that creates it.

**The failure mode is the dangerous one: it is silent and it looks like a pass.**
`:152` did not become garbage — it became the **separator row of the very cap
table it used to be a row of**. A reader re-checking the cite lands inside the
right table, on a line that is unmistakably table-shaped, and moves on. `:176`
is worse: it now resolves to a *different, also-true, also-Sage-relevant*
sentence. Neither dead cite announces itself.

**The cause is a discipline this document adopted on purpose.** §1A's own lesson:
*"place the new amendment ABOVE the older ones it collides with so nobody reads
the stale ones first."* §1B has now grown thirteen times, always upward, and
every growth shifts every line of §2–§11 down by the size of the amendment. The
mechanism that keeps readers off stale rulings is the same mechanism that
invalidates every line-number cite beneath it. Those are not two problems to
balance — the amendment discipline stays, and line numbers go.

**Rule, effective now: cite this document by section (`§3.1`, `§1B.1`, `§8.6`
row 1.4), never by line.** Section numbers are stable under prepending by
construction; line numbers are stable only in files nobody prepends to. Line
numbers remain correct for **source and migrations** — `20260827000001:234-239`
is on `main`, immutable, and every such cite in this thread stands.

**And the root of it: this document is not on `main`.** `git ls-tree -r
github/main -- docs/strategy/` returns ten files; `POLLINATE_COMB_ROTATION.md` is
not one of them. Every ruling the build lane is executing tonight — `DES-31`,
presence-not-capacity, the tombstone, `ENG-58`'s shape, the 5/20 split — is
specified by a document that exists on **one unmerged branch** (`vector/comb-rotation-strategy`,
PR `deed03bd…`) that has moved **four times in three hours**
(`298e3a9 → 8e00f19 → 5a39495 → 9a7bf08 → eceee54`). The line-number decay is a
symptom; the branch is the disease. **Merging this is what makes citation stable**
— until then §1B.13's rule is the mitigation, not the fix.

*Minor, same family:* row 1.6 and several §7 rows cite `GUIDES/POLLINATE_*.md`.
`GUIDES/` does not exist in the repository at any ref — those specs live in the
shared **workspace**. A repo document citing a workspace-relative path resolves
to nothing from a clean checkout. Correct as team shorthand, unresolvable as a
repo reference; flagged, not changed, because the specs are genuinely there.

---

---

### 1B.14 — **Nothing in this schema can seal or send a rotation.** `ENG-91` is new, and it gates the ratified definition of done.

Found while verifying the `ENG-84` tombstone against the seal path. Verified at
`github/main@cdb07a1` in my own shell.

| Function | Gate | Callable by |
|---|---|---|
| `seal_hive` | `if not found or v_owner_id <> auth.uid() then raise` (`20260826000004`) | `authenticated` — `HiveStore.js:196` |
| `seal_volume` | same gate (`20260828000001`) | **revoked from `anon` and `authenticated`** (`20260826000004`) |
| `send_hive` | same gate (`20260819000002`, body re-issued `20260828000001`) | `authenticated` — `HiveStore.js:205` |

**All three require `auth.uid()` to equal the hive's owner.** In a `pg_cron` job,
a service role, or an edge function, `auth.uid()` is null — so every one of them
raises *"hive not found."* There is no `supabase/functions` directory, no
`pg_cron` anywhere in `supabase/migrations/`, and the only callers in `src/` are
`SealHive.js` and `SendHive.js`: **a human tapping a button, as the owner.**

**`OPS-9` cannot seal or deliver a rotation.** Not "isn't wired yet" —
structurally refused by the function bodies. The tick can advance a
`comb_rotations` row all day; the month's keepsake sits unsealed until the
organizer opens the app and presses Seal, then presses Send.

**This is the rotation engine's core verb, and it does not exist.**

> **A rotation that only advances when its organizer taps is not a rotation.
> It's a reminder.**

**It gates the definition of done.** §1A's ratified sentence contains *"watch
Sarah's reveal bloom."* There is no reveal without a seal, and no seal without
an owner session. On today's schema the acceptance test cannot run.

**Three consequences:**

1. **The ordinary case is worse than the deletion case.** An owner who tombstones
   can never be `auth.uid()` again, so their comb's month freezes **permanently**
   with everyone else's writing inside it — §1B.15's *"sealed writing survives"*
   is true and never reaches those entries, because they never reach seal. But an
   owner who merely **gets busy** produces the same frozen month, recoverably.
   Deletion makes it undeniable; absence makes it common.
2. **It contaminates `C1` a second time.** `C1` is *"share of an active comb who
   write for that month's subject."* If the month only completes when the
   organizer shows up, a failed rotation reads identically whether eleven people
   stayed silent or eleven people wrote and the organizer never tapped Seal.
   **Same number, opposite diagnoses, opposite responses** — the exact failure
   shape §1B.9 upheld `DES-31` to prevent, arriving through a different door.
3. **Delivery into a husk is reachable.** See §1B.15.

**Correcting my own routing.** I first sent this to @Sage as *"a requirement on
`ENG-58`."* **That was wrong, and it is the failure mode this document keeps
finding:** `ENG-58` is a migration that creates tables, and it will be marked
done when the tables land. A requirement buried inside another ticket is
completed when that ticket is completed. This is not schema — it is **function
bodies and grants** — and it changes `ENG-60`'s dependency graph and estimate.
**It gets its own row: `ENG-91`** (§8.3, Phase 1 row 1.8a).

**And it lengthens the critical path.** §8.7's *"the two longest poles are
`ENG-58` and `DES-22`"* was true when written. `ENG-58 → ENG-91 → ENG-60` is now
the longest chain, with `OPS-9` calling into `ENG-91` rather than into
`seal_hive`. @Colin — this is a schedule fact, not a scope change: no new
product surface, one new server-side path that the rotation already assumed
existed.

### 1B.15 — Account deletion: **ruled.** Keep-and-disclose, tombstone, and the defense of record.

**Colin ruled keep-and-disclose** (`34d96ff7…`, 2026-08-30). `ENG-84`'s shape is
final: tombstone the profile (clear `display_name` / `avatar_url` /
`phone_hash`, drop the `auth.users` row), **delete unsealed authored entries**,
end memberships (`removed_at` on `hive_contributors` and on `comb_members`), and
anonymize the ledger. **Delivered keepsakes stay.** Lumen owns the deletion-screen
copy; the ruled sentence is verbatim in their `OUTBOX/ENG84_DELETION_COPY.md`.

**The defense of record — and the argument that does *not* work.** Apple's page
(`developer.apple.com/support/offering-account-deletion-in-your-app/`, fetched
2026-08-30) answers *"Does the content provided by a user need to be deleted in
apps that display and share user-generated content?"* with **"Yes"** — *"This
includes user-generated content that's shared with others, such as photos,
video, text posts, and reviews."*

The disclosure clause — *"**If local laws or regulations require that you
maintain some data**, let your users know"* — sits under the CCPA/GDPR question
and is a **legal-retention carve-out**, the mechanism for *"we must keep this,"*
not *"we chose to."* No law requires us to retain a gratitude entry. **We are not
sheltered by that clause; we are taking a position against an explicit "Yes."**
*"The FAQ let us"* loses the moment a reviewer reads the same page.

**What holds is precedent.** Apple's enumerated examples — photos, video, text
posts, reviews — are **all broadcast content: an audience, no addressee.** A
sealed keepsake is directed at exactly one person and was delivered to them.
That line is one the store already runs on: **Discord** tombstones to a husk and
keeps the messages, **Reddit** keeps comments under `[deleted]`, **Signal /
WhatsApp / Slack** leave sent messages in the recipient's thread after the
sender's account is gone. All shipping, all approved. **We are not asking for an
exception; we are asking to be a messaging app, which is what we are.**

**The delivery hole this leaves, which `ENG-58` must close.** Under tombstone
nothing is deleted, so `subject_profile_id` stays non-null. `send_hive` checks
exactly two things about the subject: **is it null** (no) and **is there an
accepted `honeycomb_connections` row** (yes — that row wasn't deleted either).
Both pass. **The schema will seal a comb's month and deliver it into a deleted
account.** Lumen's snapshot rider closes the *render* (`"Writing for ______"` is
unreachable because `subject_name` is a creation-time snapshot); it does not
close the *send*. Void-and-advance is enforced behaviour in `ENG-58`, not an
inherited FK effect. See the amendment note in §1B.6.

**One citation corrected, because the older file draws the opposite line.**
The ruling *"you may destroy a keepsake, you may not revise one"* is right and
the phrase does live in `20260815000006`'s comment — but that file's
`entries_delete_own` requires `h.owner_id = auth.uid()`, which a **contributor**
deleting their own entry never satisfies. The live policy is
`20260827000001`'s rewrite: `auth.uid() = user_id AND (hive_id is null OR
is_volume_open(volume_id))`. In the comb world — where every entry is a
contributor's — the cited file draws the opposite line from the ruling it was
cited for. Lumen has accepted and re-cited.

**`removed_at` on `comb_members` has a second, independent reason.** Lumen
argued it as *"a husk cannot occupy a seat."* It is **also the only thing that
keeps `C1` honest through a mid-month deletion**: deleting unsealed authored
entries removes that person from `C1`'s **numerator**, and if the seat stays
open the **denominator** does not move, so the comb reads as less participatory
than it was. `removed_at` moves both. Two independent reasons for one column —
same test §1B.9 applied to `DES-31`, same verdict: not a preference.

### 1B.16 — `ENG-91`'s semantics, ruled: **seal-and-send, one event, owned by the clock.** Plus two preconditions it cannot inherit.

Lumen asked the right question at the right moment (`2e3d8d10…`): is the
window-close trigger **seal-and-send**, **seal-only**, or **arm-for-send**? The
countdown copy, the organizer's affordance and `OPS-9`'s tick all read
differently under each, and it is far cheaper pinned here than discovered in
`DES-33`'s mockups. **Ruled: seal-and-send.**

**Why not the other two.**

- **Seal-only is the worst of the three, not the safe middle.** It freezes
  content at day zero — nobody can add — while the subject still has nothing.
  It manufactures a state where the gift exists, is finished, and is
  undeliverable, and **neither side can see it**: the writers think they gave,
  the subject was never given. That is a strictly worse failure than the one
  `ENG-91` exists to fix.
- **Arm-for-send is today's behaviour with a flag on it.** The organizer's thumb
  is still the verb. It fails the same test that produced this row.

**The countdown is the argument.** §1A's ratified sentence and `DES-33`'s tense
both say *"6 days left."* **A countdown is a promise about what happens at
zero.** Only seal-and-send makes that sentence true; under the other two the app
is counting down to a reminder, which is Lumen's own demo-gate blocker class —
the app stating something false about time.

**This does not cost Colin's "hold sealed until the moment" pillar — it
strengthens it.** The moment is `closes_at`: **chosen at rotation-open, by the
schedule, not by whoever happens to open the app.** If it should land on Sarah's
birthday, the window ends on Sarah's birthday. **A date cannot be forgotten; a
tap can.**

**Organizer affordance in a rotation comb: none in MVP-Comb.** No "seal early,"
no "send now." One verb, owned by the clock. `seal_hive`'s existing tap stays
exactly as shipped for the 1:1 hive flow — untouched, not deprecated. If an
early-delivery affordance is ever added, the invariant is **asymmetric on
purpose: you may accelerate a gift, never delay one.** Not in MVP-Comb — it is
new surface, and §8.5's discipline applies: build the mechanism, defer the
consequence.

**@Bumble — this does not break "a clock is not a cause," and here is the
implementation form of your invariant.** The cause is *the rotation window
having closed* — a real domain event with a stored `closes_at`. **The tick is
the detector, not the cause.** So `ENG-91` derives its decision from
`comb_rotations` state (`closes_at <= now()` **and** the rotation still open),
is **idempotent**, and is correct when the tick misbehaves: **a missed cron run
must not skip a month, and a double-fire must not double-send.** If the seal
only happens because the job ran, the clock has become the cause.

Half of that already exists and it is the wrong half. `send_hive` **raises** on
a second call (`'send_hive: hive has already been sent'`,
`20260828000001:148-150`), backed by the `private_hives_sent_at_immutable`
trigger (`20260819000001`). That is correct for a human tapping twice and wrong
for a scheduler: a double-fire becomes an **exception**, and an exception in a
`pg_cron` job is a red run and a page for something that is in fact the
**desired** end state. **`ENG-91` must treat already-sent as a no-op success,
not an error** — check-then-act inside the definer function, so `OPS-9` only
alarms on months that genuinely did not deliver.

---

**Two preconditions `ENG-91` cannot inherit from `send_hive`. Both verified at
`github/main@cdb07a1`.**

**1. The friend-connection check makes a comb undeliverable.** `send_hive`'s live
body raises `'send_hive: owner and subject are not a connected friend'` unless an
**accepted `honeycomb_connections` row** exists between owner and subject
(`20260828000001:158-165`). That requirement is correct for the 1:1 hive it was
written for. **In a comb it is fatal, and the reason is bigger than one raise.**

**Every social edge in the shipped app is a friendship, and there is exactly one
way to make one.** An accepted `honeycomb_connections` row has two authors in
the entire system — `sendConnectionRequest` and `respondToRequest`
(`HoneycombStore.js:66-88`), the explicit request-then-accept flow. **No
migration inserts one.** And the shipped multi-writer invite path does not mint
them because it **presupposes** them: `InviteContributor.js:103-105` builds its
candidate list by filtering `HoneycombStore.listConnections()`. You can only
invite a friend to write. `send_hive` then re-checks the same graph on the way
out. Contributors are friends, subjects are friends, all the way down.

**`ENG-59`'s invite link is the first path in this product that puts two
non-friends in the same writing surface** — that is what a run club *is*. So a
comb is a second social graph, not a subset of the first, and a run club of
twelve has **zero** pairwise connections. On today's function bodies its
rotation would refuse to deliver to eleven of its own members.

**`ENG-91` therefore cannot be a definer wrapper around `send_hive`.** The
authorization for a rotation delivery is **comb membership, not friendship** —
a new predicate, reading `comb_members`. @Sage, this is the substance of the
row. @Fizz — **`ENG-59` must not be widened to mint friend connections as a side
effect of joining a comb.** That would quietly fuse two different social graphs
to satisfy a precondition that should simply not apply here.

**2. An empty rotation must not deliver.** A zero-entry hive is reachable —
`20260828000001`'s own comment states that none of
`seal_hive`/`seal_volume`/`send_hive` row-count-check the entries side of their
UPDATEs. Under seal-and-send that becomes automatic: a month where nobody wrote
would deliver an empty keepsake, on a schedule, to someone expecting a gift.
**Rule: window closes with zero entries → void and advance, notify no one, and
record it as a zero-participation rotation.** That month is a **`C1` signal, not
a delivery** — and §6's response table needs it recorded, not hidden by an empty
send. **The clock delivers a gift, not an empty box.**

**Scope boundary, @Lumen's reconciliation, ratified and recorded here because the
ruling above does not state it and would otherwise be quotable as precedent.**
Fusing seal and send at `closes_at` does **not** amend the standing **seal ≠
send** doctrine (*"sealing never gates on a recipient,"* hero arc, 2026-08-17).
That doctrine governs the **writer's verb**, and in a comb rotation **no writer
holds a seal verb at all** — the clock owns one fused event, and a rotation has a
subject by construction, so no seal ever waits on a recipient. `seal_hive`'s tap
is untouched in the 1:1 flow. **The comb is not precedent for gating the 1:1
seal on anything.**

**@Deezine — `DES-33`'s dependency, stated so you do not meet it on device.**
Lumen is right that the before-seal tense is only honest once `ENG-91` exists.
The spec can be written now; the countdown copy ships **with or after** `ENG-91`
(Phase 1 row 1.8a). And under this ruling the after-seal half gets simpler, not
harder: **there is no organizer step to draw.** The reveal is something that
arrives, not something someone triggered.

### 1B.17 — A comb of strangers cannot read its own roster. The `'Someone'` fallback stops being an edge case and becomes the default render.

This is the same finding as §1B.16's precondition 1, pushed one step further —
**and it lands on `DES-22`, which is the design longest pole and is being
specced right now.**

`profiles` has exactly two live SELECT policies. `profiles_select_own`
(`20260808000001:25-28`) is `auth.uid() = id`. `profiles_select_connections`
(live version `20260809000005:7-17`) admits a row only if a **pending or
accepted `honeycomb_connections` row** joins you to it. **There is no third
policy, and `20260827000001` added none** — being on someone's hive roster
grants no profile visibility.

**The team already knows this and shipped a graceful fallback for it.**
`getHiveContributors` (`HiveStore.js:286-299`) batch-joins names and falls back
to `'Someone'`, with the reason written in the comment above it: *"a contributor
is not necessarily connected to every other contributor on the same hive (this
table's roster is a hive-scoped graph, not the honeycomb connection graph), so
`profiles_select_connections` can drop a row silently."* That was **correct and
well-scoped for the world it was written in** — today every contributor is
invited from the owner's connection list (`InviteContributor.js:103-105`), so
the owner sees every name and only contributor-to-contributor views degrade.
Rare, graceful, fine.

**`ENG-59` inverts the ratio.** A comb formed by invite link has zero pairwise
connections, so **every member sees `'Someone'` for every other member,
including the organizer.** A design that says *"who's here, who's written"*
(`DES-22`, §1B.8) renders as a column of identical placeholders. **The fallback
did not break; the case it was a fallback for became the whole population.**

**Two things are already safe, and I want them off the worry list:**

- **`"Writing for Sarah"` is fine.** `private_hives.subject_name` is a plain
  `text` label typed at creation, explicitly *"a plain label, not an identity"*
  (`20260815000001:10-11`) — no profile read, no policy in the path.
- **The reveal is fine.** Post-seal names come from the
  `author_name_at_seal` / `contributor_names` snapshots, not a live join
  (`HiveStore.js:59`, `:471`), written once by `seal_volume` at seal time
  (`20260828000001:50`, `:172-184`). The count is safe for a *different*
  reason, and the difference matters: `writerCount` is not a snapshot at all
  — it is computed client-side as `new Set(entries.map(authorId)).size`
  (`HiveStore.js:513`) over entries the subject can already read, so there is
  no `profiles` read in its path either way.

  > **Correction, `2026-08-30`.** This paragraph first cited *"the snapshot
  > pattern Sage extended with `writer_count_at_seal`."* **There is no such
  > column** — @Sage grepped it clean, and I confirmed: the only occurrence
  > of that string in the entire tree was this sentence. Worse than a wrong
  > name, it inverted a deliberate decision: `HiveStore.js:508-512` states in
  > its own comment that *"`writerCount` needs no schema change"*, because
  > `entries_select_as_hive_subject` carries no author-friendship term. The
  > conclusion (“the reveal is fine”) survives unchanged; **the argument
  > for it did not, and has been replaced above.** Do not requote the column.

**So the gap is strictly pre-seal and strictly the live roster** — which is
exactly `DES-22`'s subject matter.

**Ruling, and it is a product position, not only a mechanism.** **Joining a comb
discloses your display name to that comb's members.** A roster that cannot name
its members is not a roster, and "you are writing for someone, alongside people
we won't name" is not the moment we are building. The mechanism is already precedented in this
schema: `20260828000001:204-215` documents this exact class of bug — an inline
`profiles` subquery collapsing under the caller's RLS — and its fix, a
`SECURITY DEFINER` helper that reads the fact directly, the same shape as
`is_hive_contributor()` and `profile_has_display_name()`. **`ENG-58` owns it:
a definer-backed roster read that returns display names for co-members of a comb
you belong to. Not a widened `profiles` policy** — keep the blast radius at the
comb, not at the profile table.

**@Sage** — that is a second row in your migration's surface area, and it is
cheaper than a re-migration. **@Pixel** — you may spec `DES-22` with real names;
it is not currently true, and it is `ENG-58`'s job to make it true, so note the
dependency rather than designing around `'Someone'`. **@Lumen** — the
disclosure belongs at the **join** moment, in `COPY-6`: a person tapping an
invite link should learn that the comb will see their name **before** they are
in it, not after. **@Fizz** — this is the honest way to close `ENG-59`'s
precondition; the alternative (minting friend connections on join) fuses two
graphs and is barred in §1B.16.


### 1B.18 — The invite link has no landing, and no design row owns the screen. `DES-37` is new.

Checking `ENG-59`'s preconditions in §1B.16 sent me looking for what an invitee
actually *sees*. **There is nothing, at three separate layers, and only one of
them is anybody's ticket.** Verified at `46342a5` (this branch touches `docs/`
only; `src/` is `cdb07a1`).

- **The scheme is a declaration with no consumer.** `app.json:5` registers
  `"scheme": "pollinate"`. `NavigationContainer` (`App.js:186`) is constructed
  with `ref` and `onReady` and **no `linking` prop**, and neither `expo-linking`
  nor React Native's `Linking` is imported in any file under `src/` or in
  `App.js`. The single whole-word hit in the tree is `TabBarButton.js:12`, a
  comment *noting* the absence. That layer is `ENG-59`'s, and it is owned.
- **The token does not exist.** No `invite_code`, `invite_token`, or `join_code`
  appears in any migration or anywhere in `src/`. `ENG-59` invents it; nothing
  to reconcile with.
- **A link-holder can read nothing about the comb they were invited to.** Live
  `private_hives_select_own` (`20260827000001:202-204`) is
  `auth.uid() = owner_id or public.is_hive_contributor(id)`;
  `hive_contributors_select` (`:234-239`) is owner-or-active-contributor. A
  person holding a link is neither, so on today's policy shape the landing screen
  has **no name, no subject, and no count** to render.

**The gap that is nobody's row is the screen.** `DES-29` is comb-first *first
run*, and both of its doors are creator intents — *"Start a comb with your
people"* / *"Write for one person."* Its happy path is *person → occasion → date
→ invite by link → write*: that is **the organizer authoring the invite.** A
person who arrives **on** the link has neither intent and is not standing at the
start of that path. They came for one named comb, for one named subject, because
one named friend asked them. **The invitee's first run is a different first run
— and it is the only conversion surface the comb model has.** `COPY-6` owns its
sentence, `ENG-59` owns its mechanism, no `DES` row owns its screen.

**New row: `DES-37` — the invite landing. Deezine, M.** Not a widening of
`DES-29`: different entry point (a deep link bypasses first run entirely rather
than sequencing inside `App.js` with `ONBOARDING_ZERO_DOOR_SPEC.md`), different
artifact, and it changes `ENG-59`'s dependency graph — Fizz's join flow needs a
screen to land on.

**`DES-37` is not behind `DES-22`, and that matters tonight.** `DES-22` draws the
roster of a comb you belong to. The landing draws a comb you do **not** belong to
yet, and under the ruling below it must not draw a roster at all. It is a
strictly smaller, disjoint surface. **Deezine can start it now**, without waiting
on `1.4`.

**Ruled, and it is the symmetric half of §1B.17: no roster before you join.** The
landing shows the comb's **name**, **who this rotation is for**, **how many
people are in it**, and **who invited you**. It does not show who they are.
§1B.17 disclosed a member's display name **to that comb's members** — the
members consented to a comb, not to a link, and **a link forwards.** The shipped
schema already draws this exact line: `hive_contributors_select`'s own comment
reads *"the copy doc's 'presence' requirement is roster visibility ('everyone was
invited by name; membership isn't a secret')"* — to **co-writers**, and the
policy has no non-member clause of any kind. Without this, anyone holding a
forwarded URL enumerates a private group's membership.

**Order, because it decides the funnel and it is cheap to get wrong.** The four
facts above and the §1B.17 disclosure sentence come **before** the account, not
after. An invitee who must create an account to find out what they were invited
to is being asked to pay before they can read the offer. `ENG-83` (auth) sits
**after** the landing, not in front of it.

**Consequence, and it is a second definer read.** Rendering those four facts to
someone with no `comb_members` row cannot go through RLS — every policy above
refuses them by construction. It needs an **invite-token-scoped definer
preview**: given a valid, unexpired token, return exactly comb name, current
subject label, member count, inviter display name — and nothing else, so the
preview is not a hole in the roster boundary this section just drew.
**@Sage / @Fizz** — that is `ENG-58`/`ENG-59`'s seam, and it is the same
definer-helper shape as `is_hive_contributor()`, not a widened policy.

**@Deezine** — `DES-37` is yours and it starts now. **@Lumen** — `COPY-6`'s join
disclosure now has a screen to live on, and the "no roster before you join"
boundary is a copy constraint as well as a data one: the landing may say *"11
people are writing"* and may not say who.

### §1B.19 — Deletion cannot reach a table that does not exist yet, and one case is currently owned by nobody

`ENG-84` and `ENG-58` are being built **at the same time, by different people**,
and that is the whole problem. Verified at `github/main@0d71d249` (`ENG-83`
merged): there is no `combs`, no `comb_members`, no `comb_rotations` — the only
whole-word hits for those names in the tree are `honeycombs` and an unrelated
`dateRanges.js` symbol. So whatever `ENG-84` enumerates, it enumerates over a
world without combs.

**This is not an ordering bug you can fix by picking an order.** If `ENG-84`
lands first, its enumeration is complete for today and silently incomplete the
moment `ENG-58` lands. If `ENG-58` lands first, `ENG-84` can only cover the comb
tables if `@Fizz` already knows column names that are still being decided. Either
way the coverage gap opens; the sequence only chooses which week it opens in.

**The fix is a contract, not a sequence.** `ENG-84`'s tombstone predicate is a
**public, queryable** thing — a named column and a helper other migrations call
— and the standing rule is: *any table added after `ENG-84` that references
`profiles` states its own deletion behaviour in its own migration.* That puts the
obligation on the migration that creates the risk, which is the only place that
can see it. `@Sage` — this is a new line on `ENG-58`, not a favour to `ENG-84`.

**The three answers, so this is not left open:**

- **`comb_members`** — end the membership, `removed_at`, exactly the
  `hive_contributors` shape. Note it moves `C1`'s **denominator**, not just its
  numerator (§1B.15).
- **`comb_rotations`, open, deleter is the subject** — **void and advance.** The
  machinery already exists: it is §1B.16's zero-entry path, reached by a
  different door.
- **`comb_rotations`, already sent** — nothing. Delivered keepsakes stay, per
  Colin's ruling (`34d96ff7…`).

**The case nobody owns right now is the middle one, and it is the §1B.15
delivery hole re-armed by build order.** `send_hive` checks the subject exactly
once — `if v_subject_id is null then raise`
(`20260828000001:153-155`). A tombstone keeps the row, so `subject_profile_id` is
**not null** and that check passes. `ENG-84` cannot void the rotation, because
`comb_rotations` will not exist when `@Fizz` writes it. `ENG-91`'s stated shape
(`c4718523…`) covers the zero-entry window and says nothing about a tombstoned
subject. **Both sides are currently assuming the other one has it.** Under
seal-and-send the clock then delivers a keepsake into a deleted account, on
schedule, with nobody in the loop to notice. **`ENG-91` enforces it** — a
tombstoned subject voids and advances, same branch as zero entries. Not
`ENG-84`'s, and not an assumption.

**One thing `ENG-91` retires, in the other direction.** §1B.15 held that an
*owner's* tombstone permanently freezes everyone else's unsealed writing, because
the hive could never reach a seal without the owner's tap. **In a comb that
stops being true the day `ENG-91` ships** — the rotation seals on `closes_at`
with no caller identity at all, so an organizer's deletion, absence or silence
costs the month nothing. The freeze survives only for the **1:1** flow, where the
tap is still the verb. Add it to `ENG-91`'s list of reasons; it was not one of
the ones the row was written for.


### §1B.20 — the shipped subject/roster guards survive rotation intact, which is exactly why they are not the protection `ENG-58` will assume

`@Pixel` raised this from the read side in `DES-22` (`70caf2ce…`) and is right.
I checked the write side, and the framing needs one correction before `@Sage`
builds to it.

**Both shipped guards keep working, unmodified, under rotation.** `20260827000001`
enforces subject/contributor disjointness in two directions — Direction 1 in
`hive_contributors_insert_owner`'s `WITH CHECK` (`:255`, the hive's current
subject may not be invited as a contributor) and Direction 2 in the
`private_hives_subject_not_active_contributor` trigger (`:140-158`, raises).
Sarah's own month has her as **subject** and the other eleven as
**contributors**; she is not on that hive's roster. Both guards pass cleanly.
**Nothing in `20260827000001` needs weakening, and it must not be weakened** —
its comment (`:115-131`) is a ratified ruling of Sage's and Lumen's, not
scaffolding. **[Vector, 2026-08-30 — insufficient, see §1B.22.4. Both guards
survive, but Direction 1 is an RLS `WITH CHECK` (bypassed by `SECURITY DEFINER`)
and Direction 2's trigger is `before update` only (a rotation hive is minted with
its subject set on INSERT). `ENG-58` must re-express the disjointness as a
`before insert or update` trigger, or `is_hive_contributor()` stops excluding the
subject the day the rotation engine runs.]**

**The correction, and it is the load-bearing half:** those guards protect the
**hive**, and they can only see **hive** membership. Hive membership is
*ephemeral and subject-excluding* — Sarah is a contributor on eleven hives and
absent from her own. **Comb membership is durable and subject-including** — she
is a `comb_members` row on all twelve months, including the one where she is the
gift. So **every read authorized by "is a member of this comb" is authorized for
the subject too, on her own month.** The guards do not fail; they are simply
blind to a table written after them. That is the leak `@Pixel` found, and it is
not a variant of the old one — it is a membership object the old one never had.

**Ruled, and it is buildable today because it reuses what shipped:**

> **`is_comb_member(comb_id)` may authorize identity, never state.** Who is in
> this comb — names, §1B.17 — is comb-scoped. Who has **written this rotation**,
> the count, the entries, anything indexed to the current month, stays
> authorized by **`is_hive_contributor(hive_id)` on that month's hive**, which
> already excludes the subject by the guards above.

Two membership tables, two scopes, and the axis is the one `DES-31` and §1B.9
already draw: *am I this rotation's subject.* `@Sage` — the temptation `ENG-58`
will create is a single `is_comb_member()` used for every comb read because it
is tidier. That one function, used once on a rotation-state read, hands Sarah
her own surprise. `@Pixel` — `DES-22`'s member-view/subject-view split is the
design expression of exactly this line, so the spec and the schema agree.



### §1B.21 — The membership count is allowed, and the sentence that carries it is a wiring trap. Plus one instruction of mine that is now stale in Sage's hands.

@Lumen's `DES-22` amendment (`33255515…`) is **ratified**: the bar is on
**write-status** counts, not **membership** counts, and §8's *"Six people are
writing for you."* stays. The reasoning is right and it is the reasoning §1B.9
actually contains — everything in that section is about *who has written*.
§1B.8 does not conflict either: that ruling bars a **denominator** (*"12 of 5"*,
seats, fullness), and a bare *"six people"* has none.

**The ambiguity was mine.** §1B.9 said *"contributor count."* In this schema
`hive_contributors` is the **invited roster** — so my term named the membership
count while my argument attacked the write-status count. Pixel read the term and
barred both; Lumen read the argument and permitted one. **Both readings were
faithful to the section; the section was the defect.** Corrected in place above.

#### The stale instruction, and it is live in a migration being written tonight

§1B.9 told @Sage, in the paragraph headed *"What this does and does not do for
`ENG-58`"*: *"it removes the requirement for a subject-facing count query —
nothing in MVP-Comb needs one."* `DES-22` §6 carries the same sentence
(*"DES-22 does not need a subject-facing count query at all (§1B.9)"*).
**The amendment creates one, and both documents still deny it.** Sage is
building `ENG-58` now and said so (`c4718523…`); Pixel has already applied
Lumen's amendment to `DES-22` §1.1 and §8, so the spec now **renders** a count
its own §6 tells the backend not to build. Struck above.

**It is a cheap read, and §1B.20 already authorizes it.** A membership count is
**identity-side**, not state-side, so it falls on the permitted side of the line
ruled one section up: *`is_comb_member(comb_id)` may authorize identity, never
state.* One count over `comb_members` where `removed_at is null`. No entries
table in the path, no rotation state in the path, nothing to leak.

#### The trap: the honest query and the barred query satisfy the same sentence

*"Six people are writing for you"* is grammatically satisfied by **two different
queries**, and only one of them is legal:

- ~~`count(comb_members where removed_at is null)` — **membership. Static all
  month. Ruled in.**~~ **[Vector, 2026-08-30 — source replaced, ruling upheld.
  §1B.23.2: neither half of that justification survived §1B.20's split. Comb
  membership is subject-**including**, so this overcounts the writers by exactly
  one — the subject herself — every month; and it is not static, because a member
  may leave and `ENG-59`'s join RPC may add rows to an open month while that
  month's `hive_contributors` was snapshotted at mint. The legal source is
  `comb_rotation_writer_count(rotation_id)` — that rotation's `hive_contributors`
  where `removed_at is null`. It clears every bar this section set. This function
  is still correct for the **comb** screen, just not for this sentence.]**
- `count(distinct author)` over the rotation's entries — **write-status. Rises as
  people write. This is the `C1` contaminant §1B.9 exists to stop.**

Nothing in the string distinguishes them. ~~A build wired to the second one
renders a sentence that matches the spec **word for word**, passes a copy review,
and quietly hands Sarah the live progress meter — the failure §1B.9 called
*silent and misrouting*, arriving through the one door we ruled open.~~
**[Vector, 2026-08-30 — mechanism struck, ruling upheld. §1B.22: from the client
that query returns `0`, not a rising count; `entries_select_respect_visibility` is
restrictive and closes every pre-seal entry to everyone but its author. The failure
is loud, not silent — and the real trap is the `SECURITY DEFINER` surface, which
has no RLS behind it. Read §1B.22.2 before building the enforcement.]**

**And the barred query is already written, already named for that exact
sentence.** `HiveStore.js:513` — `const writerCount = new Set(entries.map((e) =>
e.authorId)).size`. Verified at `github/main@0d71d24`: it is the **only**
`writerCount` in `src/` (three hits, all in this one function), and it is safe
today because it lives **only** in `getReceivedPackage` (`:480`), strictly
post-delivery. It was built for `DES-21`'s overflow case and it is correct there.
**The hazard is not that it is wrong; it is that it is the nearest available
symbol to a sentence we just placed on the subject's pre-seal screen.** A builder
rendering *"N people are writing"* reaches for the variable named for it.

**Ruled: any count rendered to the subject before the seal names its source, not
just its number.** `DES-22` §8 and `COPY-6` state the query alongside the string;
`ENG-58` exposes the membership count as its own read and **no pre-seal
subject-facing surface may call anything that counts entries.** A copy rule
cannot enforce this — the copy is identical either way. It has to be enforced
where the two queries are actually distinguishable, which is the read path.

**One consequence for @Lumen's tense ruling, which I am not reopening.**
*"...are writing for you"* as collective purpose is right — **while the number is
membership.** The moment the number becomes writers, the same words stop being a
purpose statement and become a live participation report, and the tense defense
stops protecting it. **The tense ruling has a data precondition**, it was
unrecorded anywhere, and it is recorded here.

#### Two smaller ones

- ~~**@Lumen's open question — whether subject-view renders invited-not-joined
  hollow cells — is answered, and the axis says the same thing your lean did.**
  Invited-but-not-joined is **membership** state, not participation state, so it
  sits on the permitted side of the line you just drew; hollow and nameless it
  carries no chase list. @Pixel has already ruled it into `DES-22` §1.1
  (*"a list of faces/names (plus hollow not-yet-joined cells)"*). Nothing further
  to decide.~~ **STRUCK 2026-08-31 (Vector, §1B.37; @Pixel found it, @Lumen ruled
  it). The membership-vs-participation axis is right and is NOT what is struck —
  the axis was the wrong question to stop at. The row dies one level below the
  axis, on its SOURCE: `combs.invite_code` is a single shared code, no
  per-recipient row is minted anywhere, so "invited but not joined" is not a fact
  this database can answer for any reader on either side of the line.** A ruling
  that a state is *permitted* is not a ruling that it is *producible*, and I
  answered the first while the question that mattered was the second. See §1B.37
  for the standing rule this produced, and for the state that turns out to be
  standing where this cell used to be.
- **The `DES-37` landing count is a membership count too, and inherits this
  ruling.** §1B.18's *"11 people are writing for Sarah"* is the same sentence
  shown to a **non-member**, where a write-status read is not merely a spoiler
  but a disclosure to someone outside the comb entirely. `ENG-59`'s definer
  preview returns `comb_members` size and nothing derived from entries.

### §1B.22 — the barred query cannot run, the guard that makes the safe one safe is not in the path, and the permitted member-view read has no source at all

*Vector, 2026-08-30. Verified at `9017b89` / `github/main@0d71d24`. This section
corrects the **mechanism** of §1B.20 and §1B.21. Both conclusions stand; the
reasons under them were wrong in ways that change what @Sage builds tonight.*

**The complete set of SELECT policies on `entries` is four** — `entries_select_own`
and `entries_select_via_share` (`20260808000001:125`, `:183`),
`entries_select_respect_visibility` (`20260813000004:115`), and
`entries_select_as_hive_subject` (`20260819000001:76`). No migration adds a fifth;
`20260827000001` explicitly adds none.

`entries_select_respect_visibility` is `as restrictive` — it **ANDs** against every
permissive policy — and it reads `auth.uid() = user_id or visibility <> 'private'`.
A hive entry is `'private'` from insert until seal (`20260828000001:49`, `:169`
walk it `private → packaged → sent`). **So pre-seal, an entry is readable by its
author and by nobody else, and no permissive policy can widen that.**

This is not an accident of layering. `20260827000001:268-272` records it as a
decision: OPEN-1 answered *"no change on the select side,"* and the comment names
the outcome — *"contributors only ever see their own entries pre-seal (and, per
OPEN-1, so does the owner — **symmetric blindness was already true by
construction**)."*

#### 1. My §1B.21 threat model was wrong, and it was wrong in the direction that matters

I wrote that a build wired to `count(distinct author)` over the rotation's entries
*"hands Sarah the live progress meter."* **It does not.** Executed from the client
as the subject, that query returns **zero** — she is not the author of any of it,
and the restrictive policy closes the rest. Every subject, every month, a
permanent `0`.

That is a **loud** failure caught the first time anyone opens the screen, not
§1B.9's *silent and misrouting* one. The ruling — **name the source beside the
string** — stands unchanged. What changes is that it was never the client wiring
that needed the enforcement.

#### 2. Which means @Lumen's gate row guards the door RLS already bolted

@Lumen's proposed acceptance row for `ENG-58` — *the subject-view surface may not
reference `writerCount`, `getReceivedPackage`, or anything entries-derived*, on
the proven shape of `check-demo-hive.mjs:223` (*"comb cannot see the feed or the
connection list"*, verified verbatim) — is a good cheap assertion and should
ship. **It is not the protection.** RLS already refuses those reads to the subject.

**The door that is actually open is `SECURITY DEFINER`, which bypasses RLS
entirely** — and `ENG-58`'s roster read, §1B.17's co-member name read, and
`ENG-91` are all definer functions. A builder who needs a per-rotation number
**cannot** get it from the client; the one construct they can reach for is the one
construct with no RLS behind it.

> **Ruled: the source-naming rule binds the definer surface, not the JS surface.**
> No `SECURITY DEFINER` function added by `ENG-58` or `ENG-91` returns a value
> derived from `entries` to a caller who may be the rotation's subject. @Lumen's
> gate row ships as a **backstop and says so in its own comment**, so a green gate
> is never read as coverage of the real path.

#### 3. The permitted member-view write-status read has no legal source either — and nobody owns it

Symmetric blindness cuts both ways. `DES-22`'s **member-view** per-person
write-status — the one place @Pixel spec'd it and @Lumen ratified it as allowed —
**cannot be read today by a member either.** A member cannot see whether Mira has
written, because she cannot read Mira's entry.

@Sage's posted `ENG-58` shape carries the co-member **name** read and nothing about
write-status. @Pixel spec'd the render; **no one owns the read.** It cannot come
from RLS — OPEN-1 closed that side deliberately, and reopening it would hand every
contributor every other contributor's entry text, not just a status bit. So it must
be a definer function, which is exactly the construct §1B.22.2 just restricted.

**@Sage — this is a second definer read on `ENG-58`, not a variant of the first.**
It returns a per-member boolean, never entry content, never a count of content.

#### 4. §1B.20's split is the implementation, not the discipline — and the guard it rests on is not in a server-side path

The write-status definer's authorization predicate must be
**`is_hive_contributor(hive_id)`** on that month's hive, **not**
`is_comb_member(comb_id)`. Under the shipped disjointness guards the subject fails
that predicate by construction, so **the same function that serves the eleven
writers refuses the subject with no subject-specific branch at all.** Under
`is_comb_member()` it would serve her, because comb membership is subject-including
(§1B.20). On the client path RLS enforces the split for free; **inside a definer the
predicate is the entire authorization.** That is why §1B.20's rule binds at this
ticket rather than reading as tidiness.

**And here is the part §1B.20 got wrong.** I wrote that the two shipped guards
*"survive rotation unmodified."* They survive — but **neither one is in the path a
server-side rotation engine takes:**

- **Direction 1** (the current subject may not be invited as a contributor) is
  `hive_contributors_insert_owner`'s `WITH CHECK` (`20260827000001:247-256`) — an
  **RLS policy**. A `SECURITY DEFINER` insert never evaluates it.
- **Direction 2** (subject may not be set to an active contributor) is
  `private_hives_subject_not_active_contributor_trigger` (`:159`) — and it is
  **`before update` only**. A `private_hives` INSERT that sets
  `subject_profile_id` inline never fires it.

Direction 2 has been sufficient for one specific reason, stated in the code:
`HiveStore.js:65-68` — *"`subject_profile_id` stays null — it is only ever set when
the subject is themselves a registered user."* Today a hive is created subjectless
and the subject arrives by a later UPDATE, which is the exact event the trigger
watches. **A rotation hive is minted with its subject already known — that is what a
rotation is** — so the natural implementation sets it on INSERT, in a definer, and
both guards sit out the transaction.

> **Ruled, and it is a scope line on `ENG-58`:** the subject/contributor disjointness
> must be re-expressed as a **trigger on `before insert or update`** covering both
> tables, not left in an RLS `WITH CHECK`. A trigger fires regardless of definer
> privilege; a policy does not. Without it, `is_hive_contributor()` stops being
> subject-excluding the moment the rotation engine mints its first hive — and every
> read authorized by it, including §1B.22.3's, silently starts serving the subject.

#### Two smaller ones

- **The `'packaged'` window, so nobody widens it as a convenience.** At seal
  `visibility` becomes `'packaged'`, which passes the restrictive policy's
  `<> 'private'` — the restrictive gate opens at **seal**, not at send. What still
  closes it is the permissive side: `entries_select_as_hive_subject` requires
  `visibility = 'sent'` **and** `sent_at is not null` (`20260819000001:76-87`).
  Under `ENG-91`'s fused seal-and-send the window is one transaction anyway.
  Recorded because *"just add `'packaged'`"* is a one-word edit that opens the
  subject's pre-delivery read.
- **A term collision in the file @Lumen just nominated as the pattern.**
  `check-demo-hive.mjs:214-223` labels four assertions `comb:` — meaning the
  `HoneycombGrid` **geometry**, not the group. Nothing trips (assertion labels are
  not shipped strings, so the ban list is untouched), but when a comb-the-group gate
  lands beside it the two read identically. @Sage — name the new one for the group
  explicitly.

### §1B.23 — `ENG-58` is built and correct on every ruling I gave it. Three things it collides with were ruled somewhere else, and one of them is `C1`'s denominator

Read at `github` `sage/eng58-comb-schema@ae39cf1` (`ls-remote` confirmed;
`180ef95` is an ancestor). **§1B.22's three additions all landed and landed
right** — Part 0's two triggers are `before insert or update` and `before
insert` on the two tables, `TG_OP`-branched with no `old` textually reachable in
the INSERT arm; `comb_rotation_roster()` is authorized by
`is_hive_contributor(v_hive_id)` and returns `has_written` as existence only,
never content, never a count; §1B.19's deletion paragraph is stated in-file, and
it correctly flags the tombstoned comb **owner** as unruled rather than deciding
it. Nothing below is a defect in the work I asked for. All three are collisions
with rulings that live in other sections of this document, which is exactly
where a migration author would not look.

#### 1. `comb_rotations_insert_owner`'s `WITH CHECK` re-imposes what §3.2 rule A removed

The FK is right — `subject_profile_id uuid not null references public.profiles
(id)` — and §3.2 rule A is stated in FK terms, so it reads as satisfied. **The
policy defeats it three lines later:**

```sql
and exists (
  select 1 from public.comb_members m
  where m.comb_id = comb_rotations.comb_id
    and m.profile_id = subject_profile_id
    and m.removed_at is null
)
```

§3.2 rule A, ruled explicitly by Colin at event `d662661b…`: *"A comb may write
for anyone, member or not — the same shape as the newborn/grandmother case
(§17.2b: delivery is link-based, no install required). Without this rule, a free
user in one comb would have to **pay in order to be celebrated by another**."*
§11 lists that outcome as a rejected position. **This clause reinstates it** —
and it reinstates it through the seat cap rather than through a paywall clause,
which is worse, because §3.2 rule B's promise (*"an invitee never sees 'sorry,
the comb is full'"*) fails the moment being written for consumes a capped seat.

The `not null` is the second half of the same narrowing. `private_hives`'
subject is nullable **on purpose** — `HiveStore.js:65-68`: *"it is only ever set
when the subject is themselves a registered user."* The shipped 1:1 flow already
has an unregistered-subject path; `comb_rotations` forecloses it, so a comb
cannot run a month for §17.2b's own named examples.

**And rule A has a third gate nobody has named, which is not Sage's.** `send_hive`
(live at `20260828000001:154-165`) raises `'owner and subject are not a
connected friend'` unless an accepted `honeycomb_connections` row exists between
them. **Rule A has never been buildable.** It was ruled as though choosing the FK
implemented it; the FK is necessary and nowhere near sufficient.

**Ruled, and it is small: drop the `comb_members` clause from the `WITH CHECK`,
keep `not null` for now.** The hive clause already carries the integrity the
membership check was reaching for — `h.owner_id = auth.uid() and h.is_collective
and h.subject_profile_id = comb_rotations.subject_profile_id` means an organizer
can only point a rotation at a collective hive they own whose subject already
matches. Dropping the clause restores *"member or not"* for any registered
subject at zero cost and adds no null-handling. The **unregistered** subject
(§17.2b) and `send_hive`'s connection requirement are one decision, they are
`ENG-91`'s surface, and they need Colin: **does MVP-Comb measure `C2`?** As built,
`C2` — *"reveal→install for **non-member** recipients"* — has an empty population
by construction and can never return.

#### 2. `comb_member_count()` is not the number the sentence claims, and the gap is exactly one person

§1B.21 ruled `count(comb_members where removed_at is null)` the legal source for
§8's *"Six people are writing for you."* The justification was *"membership.
Static all month."* **Neither half survives the split @Lumen and I ratified one
section earlier.** §1B.20: comb membership is **subject-including**, hive
membership is **subject-excluding**. So in the modal case the subject **is** a
comb member and **is not** a writer:

> A comb of six. Sarah's month. `comb_member_count` returns **6**.
> `hive_contributors` holds **5**. The screen tells Sarah *"Six people are writing
> for you."* Five are. **The sixth is Sarah.**

Not a leak — §1B.9 and §1B.8 are untouched, nothing rises as anyone writes. It is
simply **wrong, always, by one, in the one number the subject sees.** And it is
not static either: `comb_members_update_owner_or_self` lets a member leave
mid-month and `ENG-59`'s join RPC will add rows to an open month, while the
month's `hive_contributors` was snapshotted at mint and nothing in this migration
adds a late joiner to it. Two rosters, two clocks.

**The same off-by-one is `C1`'s denominator, and `C1` is the number Colin said
decides the business.** `C1` is defined here as *"share of an **active comb** who
write for that month's subject."* The subject cannot write for herself, so the
ceiling is `(N−1)/N`, and it bites hardest on the small combs the free tier
manufactures:

| Comb size | Everyone who *can* write, writes | `C1` as currently defined |
|---|---|---|
| 12 | 11 of 12 | **91.7%** |
| 5 (the free cap) | 4 of 5 | **80.0%** |
| 3 | 2 of 3 | **66.7%** — against a 60% bar |

**We would be judging the model on a ratio that cannot reach 1.0, with the
haircut scaling inversely with comb size.** A perfect free-tier comb reads 80%.

**Ruled, three parts.** (a) `C1`'s denominator is the month's
`hive_contributors`, not `comb_members` — people who **could** write, not people
in the club; §6's `C1` row is corrected in place and `ENG-89` instruments that.
(b) `ENG-58` adds `comb_rotation_writer_count(p_rotation_id)` — count of that
rotation's `hive_contributors` where `removed_at is null`, authorized by
`is_comb_member` on the rotation's comb, **never** `is_hive_contributor` (which
refuses the subject, who is the caller this exists for). It clears every bar
§1B.21 set: no `entries` in the path, cannot rise as anyone writes, moves only on
roster actions. (c) `comb_member_count()` **stays and is not deleted** — it is the
correct source for the comb screen (*"your comb has six members"*). It is simply
**not** the source for *"N are writing for you."* §1B.21's own rule is what caught
this: a count rendered to the subject names its source. The source it named has
become the wrong one. Corrected there.

#### 3. The projection is frozen and its source is not

`comb_rotations` mirrors `subject_profile_id`/`sealed_at`/`sent_at` from the
hive, declared *"one-directional… a projection, not a second source of truth."*
The `WITH CHECK` verifies the two agree **at insert**. After that:

- `comb_rotations` has **no UPDATE policy at all** — deliberate, and it means the
  mirror can never be corrected.
- `private_hives_update_own` (`20260815000001:40`) is a **full-row** owner policy.
  Column pins exist for `sealed_at` (`20260815000004`) and `is_collective`
  (`20260827000001:24`). **`subject_profile_id` has none** — the only trigger
  touching it is the disjointness guard, which only asks whether the new subject
  is an active contributor.

The comb organizer **is** the hive owner (the `WITH CHECK` requires it), so one
`update private_hives set subject_profile_id = …` leaves the hive saying one
person and the projection every comb member reads saying another — **permanently,
with no correction path.** Eleven people write into a month the UI addresses to
Mira; `send_hive` reads the hive and delivers to whoever the owner last set. For
a keepsake product that is the worst available failure, and it needs no
malice — `HiveStore.js` already writes that column generically for the 1:1 flow.

**Ruled: pin the source, not the copy.** A `before update` trigger on
`private_hives` raising if `subject_profile_id` changes while a `comb_rotations`
row references that hive — the same shape as
`private_hives_is_collective_immutable_trigger` sitting eleven lines away in the
file Sage already read. **General form, and it is the lesson: a one-directional
projection is only one-directional if the source is immutable for as long as the
copy is. Pinning the copy alone does not make them agree — it guarantees that
when they disagree, they disagree forever.**

#### Scope

**SUPERSEDED ON SCOPE, UPHELD ON SUBSTANCE — see §1B.24.0.** `ENG-58` merged at
`e99936d` before this section was published, so (1), (2b) and (3) did **not**
ride Fizz's rebase. All three findings stand unchanged; they are now post-merge
work on `main` and carry as **`ENG-92`** (Sage, S). The original scope line,
true when written, read:

> (1) and (2b) are `ENG-58`, both small, both ride the rebase Fizz already
> required. (3) is `ENG-58` and is one trigger.

(2a) is `ENG-89`'s definition and is corrected in §6 above. The `C2` question and
`send_hive`'s connection requirement are **Colin's**, then `ENG-91`'s.

---

### §1B.24 — `ENG-58` merged before §1B.23 was published, and `deleted_at` is a public contract with zero consumers

Read at `github/main@e99936d` (`ls-remote` confirmed) — Fizz's `--no-ff` merge of
`ae39cf1`, two files, `+621`.

#### 0. The scope line in §1B.23 is void, and that is mine

§1B.23 closes with *"both ride the rebase Fizz already required."* **The rebase
happened; they did not.** I committed §1B.23 at `bdfb1df` and never posted it, so
`ENG-58` merged with all three items outstanding. They are no longer edits to a
branch in review — they are post-merge work on `main` with no owner. **They get a
row: `ENG-92`** (Sage, S), Phase 1, carrying §1B.23 (1), (2b), (3) and §1 below.

**The lesson is not "review faster."** A finding committed to a strategy branch is
invisible to the person who merges — it is not in the PR, not in the migration,
not in the channel. *A ruling exists when it is published, not when it is
committed.* Same failure mode as `sage/eng58-comb-schema` two hours earlier,
different direction: that was a report with no artifact, this was an artifact
with no report.

#### 1. `ENG-84` declared `deleted_at` a public contract and named `ENG-58` as its reader. `ENG-58` never reads it

`20260830000001:55-63` states it in the column comment itself:

> *"**PUBLIC CONTRACT:** other features (`ENG-58`/comb rotation, `OPS-9`) read
> this column to detect a tombstoned subject/member: name is exactly
> `deleted_at`, non-null is the single signal."*

`git grep -lnw deleted_at github/main` returns **exactly two files** — the
sentinels list and `ENG-84`'s own migration. Zero hits in
`20260830000002_comb_rotation_schema.sql`, zero in `src/`. **The contract has no
consumers.**

And the comb migration's own deletion paragraph (`:266-272`) states the fix in
the present tense as though it were shipped:

> *"1. Non-owner member, tombstoned: `ENG-84` sets this row's `removed_at`, same
> 'end memberships' contract already shipped for `hive_contributors`."*

`delete_own_account()` ends `hive_contributors` at `:160-162` and contains **no
reference to `combs`, `comb_members`, or `comb_rotations`** — it could not, it
merged one commit before those tables existed. So a tombstoned profile stays an
**active `comb_members` row forever**. Four consequences, each verified against
the merged text:

**(a) `comb_member_count()` counts deleted accounts.** `:426-438` filters
`removed_at is null` and nothing else. That is the number §1B.21 ruled the legal
source and §1B.23 (2c) preserved for *"your comb has six members."* It now
overcounts by every member who has ever deleted their account. **The asymmetry is
the tell:** §1B.23 (2b)'s `comb_rotation_writer_count` reads `hive_contributors`,
which `ENG-84` **does** end — so the hive-scoped read self-heals through a
deletion and the comb-scoped one does not. Two rosters, two clocks, and now two
deletion behaviours.

**(b) `comb_co_member_names()` renders a blank row.** `:391-404` live-joins
`profiles.display_name`; `ENG-84:181` sets it to `''` (the column is `not null`,
so empty string is as close to nothing as it gets). `ENG-84:173-179` **predicted
exactly this** — *"Downstream UI that live-joins `profiles.display_name`… will
render a blank name for a tombstoned user until it's taught to branch on
`deleted_at`"* — and named it a deliberate scope boundary for others to fix on
their own schedule. `ENG-58` is the first new live-join to ship since, and it
inherited the boundary without noticing there was one.

**(c) A tombstone is still eligible to be next month's subject.**
`comb_rotations_insert_owner`'s `WITH CHECK` (`:526-531`) requires the subject be
a `comb_members` row with `removed_at is null` — which a tombstone satisfies. The
organizer picks a deleted account, Part 0's triggers pass (a tombstone is not a
contributor), the hive mints, **eleven people write a month of letters into it.**

**This interacts with my own §1B.23 (1) and the interaction matters:** that
section rules the `comb_members` clause **dropped** from this `WITH CHECK`, which
removes the only place a `deleted_at` gate could hang. **So the subject-side gate
is `ENG-91`'s, not the policy's** — mint refuses a tombstoned subject, and a
subject tombstoned mid-month is void-and-advance (§1B.15, already `ENG-91`'s per
the migration's own item 3). Do not add the check to the policy on the way past;
it is about to be deleted.

**(d) `send_hive` still delivers into the tombstone.** Re-verified at
`20260828000001:153-166`: the only subject-side guards are
`subject_profile_id is null` and an accepted `honeycomb_connections` row.
`ENG-84` leaves `subject_profile_id` non-null (no delete ever fires) and **does
not touch `honeycomb_connections` at all** (`grep`: no hits). All three guards
pass. §1B.15's hole is not merely still open — combs are now a second door into
it, on a schedule, with no human in the loop.

#### 2. And item 1 and item 2 of that same paragraph cannot both be satisfied — this one is a submission blocker

The migration flags the tombstoned comb **owner** as unresolved (`:273-283`) and
adds `comb_members_owner_seat_permanent_trigger` (`:238-253`), which raises on
any attempt to set `removed_at` on the organizer's own row. Correct on its own
terms. **But item 1 requires `ENG-84` to end comb memberships**, and the natural
implementation is a copy of the line already sitting eleven lines above it:

```sql
update public.comb_members set removed_at = now()
  where profile_id = v_uid and removed_at is null;
```

For anyone who has ever created a comb, that statement **raises**, and it raises
inside `delete_own_account()` — so the whole transaction aborts and **the
organizer of a comb cannot delete their account.** `ENG-84` is the App Store
**5.1.1(v)** compliance ticket. An unruled product question is now sitting on a
submission blocker, and it will not surface until someone implements item 1,
because today `delete_own_account()` does not touch the table at all.

**Ruled for `ENG-92`:** whatever `ENG-84` grows for `comb_members` is written
`and not exists (select 1 from combs c where c.id = comb_id and c.owner_id =
v_uid)` — the organizer's seat is skipped, never attempted, so deletion never
depends on the ruling below landing first. Compliance does not wait on product.

**Open for Colin — `O8`: what happens to a comb when its organizer deletes their
account?** Three live options, and my recommendation is the first:

1. **Auto-transfer to the earliest-joined remaining active member**, void only if
   there is none. A comb is a durable group that outlives any one rotation
   (§18.2) — killing eleven people's club because one person left is the worst
   outcome available, and it is the one that happens by default if nobody rules.
   No UI is required.
2. **Void the comb.** Honest, cheap, and wrong for the same reason.
3. **A tombstone-specific bypass of the owner-seat trigger**, leaving the comb
   ownerless. Rejected: every downstream read (`is_comb_member`,
   `comb_rotations_insert_owner`) assumes a present organizer, exactly as the
   migration says.

**Why this is Colin's and not mine:** auto-transfer moves a comb onto the new
owner's **create-cap**, and under the ruled model the cap is a function of that
person's tier (§3.1). Handing a free user a comb of twelve is §3.2 rule B's
promise — *"an invitee never sees 'sorry, the comb is full'"* — walking in
through a new door. **It does not bite in MVP-Comb**, because §8.5 ships the caps
**disabled**; it makes the transfer default a **Phase 4** decision wearing a
Phase 1 costume. The Phase 1 half (skip the owner's seat, never raise) needs no
ruling and ships now.

#### Scope

§1 (a) and (b) are `ENG-92`, one `deleted_at is null` predicate each, joined to
`profiles`. §1 (c) and (d) are `ENG-91` and were already its work — this names
the trigger. §2's skip-clause is `ENG-92`. `O8` is Colin's, and nothing in
MVP-Comb is blocked waiting for it.
---

### §1B.25 — the shim `DES-22` calls temporary is permanent for one member, and one blank freezes into the keepsake

Published as event `cf1ce0c5` before this commit. All citations read at
`github/main@e99936d`.

#### 1. @Pixel's `DES-22` ruling is right for members and has exactly one exception — the organizer

`DES-22` §4 rules that no "deleted member" cell should ever render: `ENG-92` ends
the `comb_members` row and the member drops out of `comb_co_member_names()` like
any other removal. True — **except for the organizer, and that exception is
mine.** §1B.24.2's skip-clause exists because
`comb_members_owner_seat_permanent_trigger` (`20260830000002:238-253`) raises on
any `removed_at` set on an owner's row, and inside `delete_own_account()` that
raise aborts the transaction and makes a comb organizer **undeletable** —
App Store 5.1.1(v). The seat stays, so a tombstoned organizer's `display_name =
''` renders **forever** in every comb they own.

Reachable **today, before `ENG-92`**: `delete_own_account()` does not touch
`comb_members` at all, so right now *every* tombstoned member renders blank.

**The dangerous artifact is the label, not the shim.**
`GUIDES/POLLINATE_V2_DES22_COMB_IDENTITY.md` §4's client-side empty-name filter is
the right call, but it is annotated *removable once `ENG-92` lands* — and `ENG-92`
is the commit that converts it from a shim into the only defense. **Ruled: the
filter is removable when §1B.24.1's `deleted_at is null` predicate ships on
`comb_co_member_names()`, never on `ENG-92`'s merge alone.** That predicate (already
scoped in §1B.24) closes the organizer case too, which is why `O8` stays a product
question and not a rendering fix.

#### 2. `''` freezes into `author_name_at_seal` and cannot be repaired — `ENG-91`, not `ENG-92`

> **SUPERSEDED ON MECHANISM, UPHELD-BUT-DEMOTED ON CONCLUSION — §1B.26, same
> evening, published as event `17555c71`.** The live path described below cannot
> fire: `delete_own_account()` **deletes** the unsealed entry (`20260830000001:150-152`)
> thirty lines before it blanks `display_name`, so no row survives to be sealed with
> `''`. The `coalesce` still ships — as a **backstop** for the backfill and for
> future paths that blank a name without deleting entries — but it is **not** the fix
> for pre-seal deletion, and nothing may be filed as closed against it. The real
> failure in this window is §1B.26.

Every other blank in §1B.24 is a live join a later commit can fix. **This one is
not.** `seal_volume` (`20260828000001:48-54`) writes the frozen snapshot from a
bare, unguarded live read:

```sql
set visibility = 'packaged', author_name_at_seal = p.display_name
```

A contributor who deletes **after writing and before the seal** freezes `''` into
`entries.author_name_at_seal`; `send_hive` (`:172-180`) then `array_agg`s it
straight into `private_hives.contributor_names`, the sealed roster the reveal
renders.

**Unrepairable, verified not asserted:** the backfill at `:258-264` is gated
`and e.author_name_at_seal is null`, so a stored empty string is never revisited,
and the column sits inside the signature-integrity guarantee `20260828000001`
exists to provide. A permanent hole in the keepsake, not a query bug.

Window is exact: **delete-before-seal only.** After the seal the real name was
already captured. That window is precisely the mid-month deletion `ENG-91` already
owns for void-and-advance.

**Ruled (mechanism):** the snapshot write coalesces — never store `''`. One site,
inside `ENG-91`'s fused seal path, fixing the per-entry attribution and the roster
array together. **Not at `send_hive`'s `array_agg`** — by then the entry row is
already poisoned. **Do not drop the person:** their letter is in the volume, and a
roster shorter than the letters breaks the count-not-content reveal.

**Token is Lumen's, not mine.** `ENG-91` ships
`coalesce(nullif(p.display_name, ''), <token>)`; Lumen rules the word. @Pixel is
right that this is a *distinct* state from §1B.17's `'Someone'` — that is a live
RLS gap, this is a person who left, frozen into a keepsake forever. Reusing
`'Someone'` is defensible and cheap; a distinct word may be truer.
`PackageOpen.js:514` guards `step.authorName &&`, so `''` today renders an
**unattributed** letter in a book where every other letter is signed — which reads
as a bug, not as tact. That is what the word has to beat.

#### Scope

§1's ruling is a doc edit in `DES-22` §4 (@Pixel) — no code. §2 is one `coalesce`
inside `ENG-91`, cheaper now than in any later ticket. Nothing here gates the
`ENG-58` merge; all post-merge.

**Amended by §1B.26:** §2's `coalesce` is now a backstop, not a fix. The work that
matters in that window is §1B.26.3 (`ENG-91`) and `O9` (@Colin).
### §1B.26 — I corrected my own §1B.25.2: the pre-seal deletion does not rename the letter, it destroys it

Published as event `17555c71` before this commit. All citations read at
`github/main@e99936d`. @Lumen's token ruling (`A writer`, event `863c6c2c`) is
**unaffected and ships unchanged** — only the class of blank it guards shrinks.

#### 1. The mechanism §1B.25.2 gave `ENG-91` is wrong

I ruled that a contributor deleting after writing and before the seal freezes `''`
into `author_name_at_seal`. **I never traced whether the entry survives to reach
`seal_volume`.** It does not. `delete_own_account()` (`20260830000001:150-152`):

```sql
delete from public.entries
  where user_id = v_uid
    and (hive_id is null or public.is_volume_open(volume_id));
```

`is_volume_open` (`20260827000001:369-372`) is true for any volume with
`sealed_at is null`, and `entries_resolve_volume_id_trigger`
(`20260826000003:79-82`, fires on INSERT **and** UPDATE) stamps `volume_id` on
every hived entry from the hive's open volume. The unsealed rotation letter
matches; the DELETE runs at `:150`, **thirty lines before** `display_name` is
blanked at `:181`. `seal_volume`'s update (`20260828000001:48-54`) has no row
left to match.

**Ship the `coalesce` anyway, as a backstop, not as the fix.** Remaining classes:
the one-time `:258-264` backfill, and any future path that blanks a name *without*
deleting entries — `ENG-92` and `O8`'s ownership transfer are both candidates.
@Lumen's pre-merge rider (does any `author_name_at_seal = ''` row exist on prod?)
was housekeeping when the live path was believed open; it is now the **only** class
that can produce one, so it is the check that decides whether the guard ever fires.
Expect zero.

#### 2. The real failure: a mid-month departure erases a letter written for a third party

Delete in week three and the letter written **for Sarah** is destroyed. She never
saw it — pre-seal, an entry is readable by its author alone (§1B.22) — and she will
never know it existed.

`ENG-84:146-149` justifies this correctly *for its own world*: *"snapshotted names…
already mean nothing sealed re-reads profiles live, so a delivered keepsake needs no
further action here."* True for sealed. The unsealed complement was a personal-journal
entry when that sentence was written. `20260830000001` merged **one commit before**
`20260830000002` — the same merge-order trap as §1B.24, third occurrence.

**Ruled: the deletion behaviour is correct and stands.** The obvious move is to reach
for our own keep-and-disclose ruling (§1B.15) and it does **not** reach: that defense
rests on Apple's own words, content *"shared with others."* A pre-seal entry is shared
with **nobody, by construction** — the user's private unshared content, the case where
deletion is unambiguously right. Compliance and the shipped code already agree here.

#### 3. What must change is that the loss is silent — `ENG-91`, @Sage

**C1 contamination #3**, same shape as #1 (organizer never tapped) and #2 (nobody
wrote), third door: *"eleven people wrote"* and *"twelve wrote and one left"* produce
an **identical month**. That is the failure-signature problem `DES-31` was upheld to
prevent, aimed at the number the entire model is gated on.

**No new schema.** `ENG-84:160-162` already sets `hive_contributors.removed_at`, so
the fact is on disk. Two pins:

- **`ENG-91`'s void-and-advance distinguishes three states, not two:** entries present
  → seal; zero entries and no departures → void-and-record a quiet month; zero entries
  because the only writers left → void-and-record **departed**, a different signal.
- **C1's denominator excludes anyone whose `removed_at` falls inside the rotation
  window.** §1B.23.2 chose `hive_contributors` as `comb_rotation_writer_count`'s source
  because it is the month's roster; it now earns a second reason — it is the only one
  `ENG-84` maintains. Leaving a departed member in the denominator reports a healthy
  comb as failing the deciding threshold.

#### 4. New `O9` (@Colin) — not blocking

Should a writer be **told** that leaving destroys the letter they have already written
this month? Today they are not. One line in the delete flow, and it is the honest
version of keep-and-disclose: we disclose what survives, and this is the thing that
does not. Colin's because it is a promise to a user, not a mechanism. `ENG-91` ships
either way.

#### Scope

§1 is a demotion, no code change beyond the annotation already in `ENG-91`'s row.
§3 is inside `ENG-91` (@Sage, in flight) and `ENG-89`'s C1 definition. §4 is a
product ruling. Nothing gates any merge.

---

### §1B.27 — the "database rejects it once the hive is sealed" refusal has not existed since 2026-08-26, and three shipped client sites are written against it

Published as event `086886e0` before this commit. All citations read at
`github/main@e99936d`. Nothing here touches `ENG-92`'s scope or `DES-22`.

#### 0. @Lumen's NULL-`volume_id` sweep — confirmed, and closed twice more

Lumen swept the corner where `entries_resolve_volume_id()` (a `select into` with no
raise) leaves `volume_id` NULL, and concluded *dead row at worst, hygiene not
correctness*. That holds, and from the other end it is tighter than stated:

- **`send_hive` cannot pick the row up.** Its entry UPDATE (`20260828000001:168-170`)
  is scoped by `hive_id`, not `volume_id`, so it *does* reach the row — but it filters
  `visibility = 'packaged'`, and only `seal_volume` produces that, volume-scoped. The
  row stays `'private'`; the roster `array_agg` (`:172-180`, `visibility = 'sent'`)
  skips it too. `seal_hive` is not a second door — `20260826000004:177` delegates the
  flip to `seal_volume`.
- **It cannot be created through the invoker path at all.** `entries.volume_id` is
  nullable (`20260826000003:49-50`), so the INSERT does not fail on the column — it
  fails on the policy. `entries_insert_own` (`20260827000001:280-288`) is an `exists`
  over `hive_volumes` keyed `v.id = volume_id`; with NULL that is zero rows, false,
  **42501**. *The same NULL that saves the row from `delete_own_account`'s DELETE is
  the NULL that stops it being written.*

Only a `SECURITY DEFINER` path can mint one — `ENG-91`'s territory, nobody else's.

#### 1. The refusal is gone

`ENG-46`'s volume re-point (`20260826000004`) moved the sealed-content guard off
`private_hives.sealed_at` and onto `hive_volumes.sealed_at`. Correct on its own terms,
and its comment says why (`:6-14`): a hive-level flag *"would permanently lock the hive
against ever accepting an entry again."* What it did not leave behind is any per-hive
"this one is finished" state. Four steps:

1. `entries_insert_own` (live body `20260827000001:274-290`) admits the write if the
   entry's `volume_id` names a volume with `sealed_at is null`. **No reference to
   `private_hives.sealed_at` anywhere.** It was there — `20260815000005:30`,
   `and h.sealed_at is null` — and it came out on 08-26.
2. `seal_volume` **opens a successor volume in the same transaction it seals**
   (`20260828000001:60-61`).
3. `entries_resolve_volume_id_trigger` (`20260826000003:79-82`, `before insert or
   update`) stamps a new entry with the hive's currently-open volume — after a seal,
   the successor.
4. An active contributor's INSERT into a **sealed** hive therefore **succeeds**. Not a
   narrowed window — no refusal at all.

**Three client sites depend on the refusal that is not there:**

| Site | What it asserts | Status |
|---|---|---|
| `HiveStore.js:231-237` | *"`entries_insert_own` (20260815000005) rejects the write at the database once a hive is sealed, with `and h.sealed_at is null` in its WITH CHECK… callers must gate the UI"* | Names the exact clause and the exact migration that superseded it. A justification comment that became a dependency and then went stale |
| `ComposeHiveEntry.js:30-35`, `:63-64` | maps `42501 → 'sealed'` → *"This hive has been sealed and can't accept new entries."* | **Mis-attributed 100% of the time it fires.** Sealing cannot produce a 42501; what still can is `is_hive_contributor()` returning false — **the writer was removed from the roster.** `20260827000001` widened insert authorization to contributors and made one error code mean two things. Copy call, @Lumen |
| `FileToHive.js:88`, `:169` | catches 42501 to populate `raceSealedIds`, renders `sealed={!!hive.sealedAt \|\| raceSealedIds.has(hive.id)}` | A race-catcher already built for exactly this. It cannot fire |

The only live gate is `ContributingHive.js:172` hiding the button on `hive.sealedAt`,
fetched on mount.

#### 2. Why a clock makes it routine — `ENG-91`, @Sage

Today the seal happens when the **owner taps**, correlated with the owner deciding the
book is done; a stale contributor screen is an odd-shaped race. `OPS-9` seals at
`closes_at`. **A contributor with `ContributingHive` open at a month boundary, tapping
+ Add Entry and saving, is not a race — it is the last night of every rotation, for
every comb, forever.** The entry lands in the successor volume, is never packaged,
never sent, never read. The writer gets a success toast.

**C1 contamination #4.** *Twelve people wrote* and *eleven wrote plus one wrote too
late* produce an identical month — and this is the only one of the four where the
person is still present and did everything right.

#### 3. Ruled (mechanism)

**(a) `ENG-91`'s fused seal does NOT open a successor volume for a rotation hive.** A
rotation month is a hive that seals once and sends once; a successor volume on it is
not a chapter, it is an unlocked door. Legal: `hive_volumes_one_open_per_hive`
(`20260826000003:46-47`) is a **partial** unique index on `sealed_at is null`, so zero
open volumes is a permitted state. It closes the hole in the right direction — no open
volume means `entries_resolve_volume_id` leaves `volume_id` NULL, which is exactly the
case in §0 that returns **42501**. The refusal returns and all three dead client
branches start working as written.

**Do not add a `private_hives.sealed_at` check to the policy.** That is the lock
`ENG-46` deliberately removed for repeating hives; re-imposing it globally breaks
Project 17.2.

**(b) `ENG-91` must still write `private_hives.sealed_at`.** `20260826000004:138-153`
is explicit that `seal_hive`'s stamp is a deliberate **mirror**, kept alive because the
shipped client reads that column in five places (`HiveDetail.js:104,198,219,262`;
`ContributingHive.js:172`) — *"drop the mirror write once the client reads through
`hive_volumes` instead."* It still does not. `ENG-91` is the second seal path that has
ever existed and the first that is not `seal_hive`; sealing a volume without the mirror
leaves every one of those reads saying the month is still open, including the gold card
and the "+ Add Entry" gate.

#### 4. Addendum — `COPY-14` (@Lumen, event `8e9358b4`) and the cell that detects the mirror

Published as event `e1cc2a90`. Lumen claimed the client half as **`COPY-14`** (branch
`lumen/copy14-42501-cause`), ruling **the code names the outcome; only state names the
cause** — on 42501 the client resolves with one refetch: `getHive` first (non-null ⇒
owner), else `getContributingHive` (the seat test), else neutral connection copy. Seat
closed renders *"Your seat in this hive has closed — new entries can't be added."*

**Three mechanics verified rather than accepted:**

- *"`getHive` non-null means owner"* holds at **both** layers — `HiveStore.js:170`
  filters `.eq('owner_id', ownerId)`, and `private_hives_select_own`
  (`20260827000001:204`) is `auth.uid() = owner_id or is_hive_contributor(id)`, so a
  removed contributor gets zero rows even without the client filter.
- `getContributingHive` **is** the seat test: `HiveStore.js:400-402` chains
  `.eq('hive_contributors.profile_id', contributorId)` and
  `.is('hive_contributors.removed_at', null)` on the `!inner`. An unfiltered `!inner`
  would have returned non-null on a *colleague's* roster row. RLS refuses it
  independently (`is_hive_contributor` is active-only).
- **Exactly two entry points** to the screen — `HiveDetail.js:271` (owner) and
  `ContributingHive.js:179` (member). The resolution is closed over the caller set.

**The unfilled cell.** Step 2 has three outcomes, not two: the fetch can return
**non-null with `sealedAt` null** — active seat, hive not sealed, refused anyway.
Neither branch covers it, and it is empty in exactly two of three worlds:

| World | Reachable? |
|---|---|
| Today, pre-`ENG-91` | **No** — no-open-volume is unreachable; the seat is the only live cause |
| Post-`ENG-91` **with** the mirror | **No** — no open volume implies `private_hives.sealed_at` is stamped |
| Post-`ENG-91` **without** the mirror | **Yes**, and it is the only observable symptom |

**So the cell is the detector for §3(b) failing, and it sits in Lumen's file rather than
Sage's.** Asked: @Lumen fills it with the neutral retry copy plus a comment stating *why*
it should be unreachable (a cell unreachable for a stated reason is a check; an unhandled
one is a fall-through). @Sage — this promotes the mirror write to an **acceptance row on
`ENG-91`**: after a rotation seal, `getHive(hiveId).sealedAt` must be non-null. Otherwise
the visible failure is a copy bug in a file Sage never touched.

**Sequencing correction:** *"correct in both worlds"* holds for **landing** `COPY-14`, not
for **testing** it. The sealed branch cannot fire until `ENG-91` ships, so its test must
fabricate a hive with zero open volumes — a state no shipped path can produce today.
Write it now and mark it `ENG-91`'s first assertion rather than letting the branch land
unexercised.

#### 5. `COPY-14` verified at `e0726c9`, and the gate it extends stopped enumerating

Published as event `ff0aab79`. Lumen shipped `COPY-14` (PR `12e51945`, branch
`lumen/copy14-42501-cause@e0726c9`, base `main@e99936d`). **Ran the gate myself** in a
throwaway worktree: `check-private-hives-client-seal` → **16 passed, 0 failed, EXIT=0**.
`resolveRefusalCause` is the genuinely extracted declarator source (R12 adopt shape, not
a copy); the detector cell asserts neutral; the fabricated zero-open-volumes row asserts
`'sealed'`. Assertion delta reconciles — the file went 6 checks → 16 (+10), gate count
stays 45 because the file already existed. §4's third cell is filled as a **check**, with
the mirror stated as the unreachability reason and the `ENG-91` acceptance row restated
in the comment where the symptom would surface.

**Defect found in the gate itself — pre-existing, and `COPY-14` is what makes it bite.**

```js
const selects = [...store.matchAll(/\.from\('private_hives'\)[\s\S]{0,120}?\.select\('([^']*)'\)/g)]
check('HiveStore.js has exactly five private_hives selects', selects.length === 5);
```

Its own comment states the purpose: *"the count is not a ceiling; it exists so a new
`private_hives` select added later has to touch this line, which is what keeps it from
carrying `sealed_at` by omission the way the original three did."* `HiveStore.js` has
**seven** `.from('private_hives')` sites; the regex matches **five**. Measured:

| Site | Why it escapes |
|---|---|
| `createHive` (`:140`) | gap from `.from(` to `.select(` is **196 chars**, past the 120-char window — `is_collective` growing the insert block pushed it over |
| `getHive` (`:211`) | the character after `.select(` is **`\n`**, not `'` — the argument is wrapped onto its own line |

**The count is a coincidence, and it was exhaustive twice before it wasn't:**

| Commit | Coverage |
|---|---|
| `6fc03e6` (08-17, gate written) | **3 of 3** |
| `90510c6` (08-19, count raised to five) | **5 of 5** |
| `e0726c9` (today) | **5 of 7** |

Two fell out, two arrived. The comment names the five as
`createHive`/`listHives`/`getHive` + the two received-packages reads; the five actually
captured are `listHives`, the **two contributing-hive reads** (`:430`, `:464`, `ENG-61`
era, never mentioned), and the two received. **Membership changed by four while the
number stayed 5.**

**Why it lands on `COPY-14`:** `getHive` is the one escaped select that `COPY-14`'s step 1
depends on entirely. Drop `sealed_at` from its column list and (1) the gate stays green —
*"every select names `sealed_at`"* only iterates what the enumerator caught; (2)
`sealedAt: data.sealed_at` maps `undefined`; (3) `resolveRefusalCause` returns `'unknown'`
for every sealed hive; (4) **the detector cell fires constantly**, and by its own comment
the only world where it fires is a rotation seal that skipped the mirror — so @Sage chases
an `ENG-91` regression caused by a dropped client column.

**Fix offered (Lumen's file, Lumen's call, not a merge blocker):**

```js
const fromSites = [...store.matchAll(/\.from\('private_hives'\)/g)].length;
check('every private_hives select is captured by this enumerator', selects.length === fromSites);
```

**Repaired and re-verified at `961b45b`** (event `8b4dc2a4`). Lumen took it as ruled,
dropped the window, tolerated whitespace after `.select(`, and added the completeness
row. My own run: **17 passed, 0 failed, EXIT=0**, 7/7 captured.

The part that needed checking is the part the fix introduces: an unbounded lazy
`[\s\S]*?` can run **past** a site with no parseable select and attribute a later
`.select(...)` to it. Four mutation probes, each reverted clean:

| Probe | Row that went red |
|---|---|
| Drop `sealed_at` from `getHive`'s select — the exact recurrence the gate was built for, invisible before | `every private_hives select names sealed_at` |
| Site with a template-literal select | completeness row |
| **Select-less site** (`.from('private_hives').update(…)`) | completeness row |
| **Select-less site followed by a foreign `.select('… sealed_at')`** — the mis-attribution the unbounded regex enables | `exactly seven` |

The last two are mine. The fourth matters: the lazy match consumes the intervening
`.from(` so the pair count falls below `fromSites` and completeness fires — **except**
when a foreign select absorbs the slot, and then the `=== 7` count row catches it.
**The two rows are complementary; neither alone closes it.** No shape found that passes
both. `ENG-91`'s acceptance row now has a gate behind it that reds instead of vanishing.

**Tip moved to `03a402f`** (PR `12e51945`). Comment-only — I confirmed no file outside
the gate script is touched between `961b45b..03a402f`, and the gate still runs 17/17,
EXIT=0. It records the complementarity in-file, in both directions, and bars deleting
either row as redundant with the other — because *"completeness is the repair"* was
chat-only, and the next cleanup that believed it would drop the `=== 7` row and reopen
the hole with everything green.

#### Scope

Both rulings in §3 live inside the function @Sage is writing now and are cheaper there
than in any downstream ticket. §1's copy row is @Lumen's, claimed as `COPY-14`; §4 adds
one cell to it and one acceptance row to `ENG-91`. No new `O`. Nothing gates any merge;
`ENG-92` and `DES-22` are untouched.

---

### §1B.28 — `display_name` is `'New user'` for every account `ENG-83` creates, and it defeats §1B.17's fix one layer down

*Vector, 2026-08-30. Published `37295f91…` before this commit. Verified at
`github/main@8864a12`. Raised while answering @Deezine's `DES-37` question —
does `COPY-6`'s disclosure sit pre-auth or post-auth. The answer is neither,
and the reason is a bigger finding than the seat.*

**The chain, four links, each independently checkable:**

1. `handle_new_user` reads exactly one key —
   `coalesce(new.raw_user_meta_data ->> 'display_name', 'New user')`
   (`20260808000001:45-46`), into a `not null` column (`:16`).
2. **The only site in the tree that writes that key is the password sign-up.**
   `git grep 'display_name:' github/main -- src/ App.js` returns two hits:
   `HoneycombStore.js:38` (`options: { data: { display_name: displayName } }`)
   and `demoHive.js:91`, a demo literal.
3. **Neither passwordless path writes it.** `signInWithOtp` (`:87-94`) sends
   `options: { emailRedirectTo, shouldCreateUser: true }` — no `data`, and
   `shouldCreateUser: true`, so it creates the account. `signInWithApple`
   (`:138-147`) sends `provider`/`token`/`nonce` and no `options.data`.
   Whatever GoTrue stores under its own provider keys, `->>'display_name'`
   is absent and the coalesce falls through.
4. **Nothing ever rewrites it.** `git grep -c updateUser github/main -- src/
   App.js` → **zero hits.** There is no path in the app to change a display
   name after creation. Not "the name arrives later" — there is no later.

Not a discarded-input bug: the name field renders under `{isSignUp && …}`
(`Onboarding.js:823`), so the magic-link branch never shows one. Nothing is
collected and thrown away. It is never asked.

#### 1. The disclosure seat is a third seat, not one of the two on offer

§1B.17 ruled *"the comb will see your name **before** they are in it."* That is
a promise about a name. **Pre-auth** there is no account and no name, so it
cannot be true. **Post-magic-link** there is an account whose name is
`'New user'`, so it still cannot be true. **The disclosure attaches to the
moment the name is collected, and on the merged path that moment does not
exist.**

`ENG-59` creates it: a **name-collection step between authentication and the
join RPC.** That is where `COPY-6`'s sentence sits, it is a screen, and it is
inside `DES-37`'s frame rather than beside it. §1B.17's requirement was
**pre-join**, not pre-auth; "pre-auth" was Vector's shorthand in `81b3a72e…`
and it was the wrong axis. Corrected here.

#### 2. §1B.17's fix is defeated one layer down — this is the load-bearing half

`comb_co_member_names` (`20260830000002:391-403`) was the ruled fix for the
`'Someone'` problem and it reads `p.display_name` raw. **`C1`'s entire seeded
population joins by invite link, which per `ENG-83` means magic link, which
means `'New user'`.** A seeded run club of twelve renders a roster of
*'New user', 'New user', 'New user'*, and `DES-22`'s *"who's here, who's
written"* is a column of identical placeholders again.

**Strictly worse than what §1B.17 fixed.** `'Someone'` was a privacy fallback
that degraded gracefully and only in contributor-to-contributor views.
`'New user'` is uniform across the whole comb **including the organizer**, it
reads as a defect rather than a discretion, and it is the first thing a
stranger sees on the surface `C1` is seeded against. The `'Someone'` hole was
closed and the population walked into a second one underneath it — same
failure, different table.

Two riders:

- **`ENG-91`'s ruled backstop does not catch it.**
  `coalesce(nullif(display_name, ''), 'A writer')` (§1B.25.2 as amended by
  §1B.26.1) tests null and empty. `'New user'` is neither. That backstop was
  scoped to the **tombstone** case, is still correct for it, and is not a net
  under this.
- **Do not fix this in `comb_co_member_names`.** A second coalesce there papers
  a real empty-profile problem into a prettier string and leaves the profile
  empty everywhere else — Account, the feed, the reveal snapshot. **The fix is
  collecting the name**, which is the same step the disclosure needs. One
  screen closes both.

#### 3. §1B.18's first bullet is partly stale, in `ENG-59`'s favour

Annotated so it is not re-derived. `expo-linking` **is** imported now
(`authLinking.js`, `ENG-83`), and `AuthContext.js:93-101` already registers
`getInitialURL()` plus a live `url` listener. It early-returns on
`!isAuthCallbackUrl(url)` (`:94`), so an invite URL today is **received and
dropped**, not unreachable. `ENG-59` extends `handleUrl`; it does not build the
listener. `NavigationContainer` still has no `linking` prop, so route-level
linking config is still genuinely absent — **the extension point is the
service, not React Navigation.** §1B.18's conclusion (the landing is nobody's
row → `DES-37`) is unaffected.

#### 4. `DES-37` choice (a) is settled, and it adds a property to `ENG-59`'s row

@Deezine ruled (a) independently in `#Collab` — the anon landing shows *who
asked you* and *how many are writing*, with **possession of the invite code as
the authorization**. Same call Vector recommended in `81b3a72e…`; treat it as
settled unless @Lumen or @Colin reads it otherwise.

@Fizz's function shape — *membership count only, `invite_code`-keyed, no
entries anywhere in its body, `comb_member_count` minus the session auth* — is
right and not quite sufficient. **Under (a) the invite code becomes an
unauthenticated lookup key, so the code's entropy is the entire access control
for that read.** Under session auth it needed none; possession-based auth means
the token carries what the session used to. Concretely: generate it with enough
entropy that enumeration is not a strategy, and do not let the function's shape
or timing distinguish *nonexistent code* from *valid code* more than it must.
Not a design decision — a property the generator must have, and it belongs in
`ENG-59`'s row rather than nobody's.

**Consequences.** One new requirement on `ENG-59` (§1B.28.1, the
name-collection step, which is also the disclosure seat and the `'New user'`
fix), one property on its invite-code generator (§1B.28.4), one screen inside
`DES-37` (@Deezine), one sentence in `COPY-6` (@Lumen). No new `O`. Nothing
gates a merge; `OPS-9` remains the critical row.

---

### §1B.29 — **Nothing creates a comb.** No engineering row builds it, no path mints a rotation, and `§1B.24.1(c)` was filed into a function that does not exist

Lumen handed me one item (`4fdd39e2…`): the organizer is also an account, so a
magic-link organizer is `'New user'` too, and the organizer's name is the invite
landing's *headline* — file the name-collection requirement "on whichever row
builds comb creation." I went to file it. **That row does not exist.**

Verified at `github/main@8864a12`.

#### 1. The client half is empty, and the server half is ready

- `git grep -nE "create_comb|createComb|CreateComb" github/main -- src/` → **zero
  hits.** No screen, no `HoneycombStore` method, no navigator route. Lumen's
  census reproduces.
- **But comb creation needs no new SQL.** `combs_insert_own`
  (`20260830000002:165`) admits an owner insert, and
  `combs_create_owner_membership` (`:352`, trigger `:365`) auto-seats the
  organizer. `invite_code` defaults to
  `replace(gen_random_uuid()::text, '-', '')` (`:150`) — **32 hex chars, 122
  bits.** That closes `ENG-59`'s sub-item (b) from §1B.28.4: the enumeration
  entropy is already shipped, @Fizz does not have to invent it.

So the gap is a *screen and a store method*, not a schema. That is the cheap half
of the news.

#### 2. The expensive half: nothing mints a rotation, at any month

`ENG-91` shipped **exactly one function** — `seal_and_send_rotation(uuid)`
(`20260830000003:94`), `revoke … from anon` **and** `from authenticated`, `grant
… to service_role` (`:341-344`). It seals and delivers. **It does not open.**

The only path that can create a `comb_rotations` row on main is the RLS policy
`comb_rotations_insert_owner` (`20260830000002:522`), and its `WITH CHECK`
requires the caller to have **already inserted** a `private_hives` row that is
`is_collective` and carries `subject_profile_id` at INSERT. So minting month 1 is
**two ordered client inserts** against RLS, by a person tapping.

That has three consequences the row map does not currently carry:

**(a) §1B.24.1(c) is homeless.** I ruled that the tombstoned-subject refusal
"goes in `ENG-91`'s mint, not the policy, because §1B.23.1 deletes that clause."
`ENG-91` has no mint. There is no tombstone check anywhere in either migration.
The gate has nowhere to live until this row exists — and it is not optional:
`send_hive`'s guards catch neither a tombstoned subject at mint nor one
tombstoned mid-month (§1B.24.1(d)).

**(b) §1B.23.1 has not landed, and it stops being theoretical the day this
screen ships.** The `comb_members` membership clause is still live at `:526-530`
on `main` — `ENG-92` (@Sage, S) is unstarted. Today nothing inserts a rotation so
nothing hits it. The moment an organizer taps *"who is this month for?"*, that
clause is the **pay-to-be-celebrated shape §11 rejected**, enforced at the exact
moment the model says it must not be. **[SUPERSEDED — §1B.30: upheld on substance, reversed on routing. The definer mint bypasses this policy, so the clause is a cleanup, not a gate.]** `ENG-92` is now a dependency of the
create flow, not a cleanup behind it.**

**(c) Two mints is the bug class that has bitten us four times tonight.** If the
client mints month 1 through RLS and `OPS-9` mints month N+1 as `service_role`
(which **bypasses RLS entirely**), the two paths have different guard surfaces
and every future rotation invariant has to be written twice. §1B.22's lesson,
verbatim: *a guard is only as good as the EVENT and PRIVILEGE it fires under.*

**RULED:** one `security definer` **`comb_open_rotation(p_comb_id,
p_subject_profile_id, p_closes_at)`**, authorized inside on `combs.owner_id =
auth.uid()` **or** the service role, granted to **both** `authenticated` and
`service_role`. Month 1 and month N+1 are the same call. The tombstone gate,
the §1B.23.1 correction and the hive-then-rotation insert order live in one body.

**What does not need to move:** the subject/contributor disjointness is already
safe under a definer mint — §1B.22.4 landed correctly, `private_hives_subject_not_active_contributor_trigger`
is `before insert or update` (`:106-109`) and `hive_contributors_not_hive_subject_trigger`
is `before insert` (`:133-135`). Triggers fire for a definer. And Volume 1 is
auto-created by `private_hives_create_volume_one_trigger`
(`20260826000003:127-129`), so a definer-minted hive gets its open volume for
free — which is what makes `entries_insert_own` admit the month's first entry.

#### 3. New row — `ENG-93`. @Fizz, M

**Create a comb.** `DES-29`'s happy path *person → occasion → date → invite by
link → write* is designed (row 1.5, Deezine) and **built by nobody**. `ENG-93` is
its engineering counterpart:

1. The create screen + `HoneycombStore` methods (client insert on `combs`; no
   migration needed for the comb itself).
2. **`comb_open_rotation`** per §1B.29.2 — the definer mint, shared with `OPS-9`.
3. **Lumen's organizer name gate.** Mount `ENG-59`'s name-collection component
   with a header swap and the CTA *"Create the comb as Maya"* — Lumen's ruling
   (`4fdd39e2…`): one design, two mounts, and **no path creates or joins without
   a collected name.** Without it the invite landing's *headline* renders
   `'New user'` (§1B.28).
4. The organizer's copy of the invite link — the artifact `ENG-59` and `DES-37`
   both assume already exists.

**Depends on 1.1 (`ENG-58`, done), 1.3 (`ENG-83`, for the name step's auth), and
`ENG-92`** (§1B.29.2b). **Row 1.7a**, beside `ENG-59` — same phase, same person,
and the two share the name-collection component, so building them together is
cheaper than sequencing them.

#### 4. Why this is a definition-of-done finding, not a backlog note

§1A's ratified sentence starts *"a stranger can install → arrive through an
invite link."* It is written entirely from the **invitee's** side, which is why
this hole survived the brief, the phase table and the critical path unread. But
Phase 3.1 is *"Colin seeds three real combs"* — **with no create flow, there is
no comb to seed, no invite link to send, and no rotation to open.** `C1`–`C5`
measure nothing.

`ENG-93` does **not** lengthen the pole — `ENG-58 → ENG-91 → ENG-60` is
unchanged, and `ENG-93` sits on the shorter `ENG-58/ENG-83 → ENG-93` branch. It
was simply never on any branch at all.

**Open:** `O3`, `O4`, `O8`. No new `O` — the name-collection ruling is Lumen's
and already made; the mint shape is mine and ruled above.

---

### §1B.30 — **`ENG-93` does not depend on `ENG-92`. I filed a dependency on the removal of a check my own ruling had already routed around**

Fizz stopped before `ENG-93` to ask @Sage where `ENG-92` stood, on my dependency
line. The gate is not there. Corrects **§1B.29.2(b)** on its conclusion; the
underlying finding (the `comb_members` clause *is* the pay-to-be-celebrated
shape) is upheld and re-scoped from **blocker** to **cleanup**.

**The contradiction sat inside one message.** §1B.29.2(c) ruled the mint a
`security definer`. A definer bypasses RLS. So `comb_rotations_insert_owner`'s
`comb_members` clause — the thing `ENG-92` Part 1 deletes — **is never evaluated
on the only mint path that will exist.** `ENG-58`'s own migration says so in
prose, directly above the policy it ships:

> *"…exactly why Part 0's guards are triggers rather than being left as RLS: **a
> definer insert bypasses this policy too**, and needed to stay safe anyway."*

I cited that file twice in §1B.29 and read past the sentence that answered the
question I was about to get wrong.

**Verified rather than argued.** Throwaway probe at `github/main@0f898ce`, own
worktree, **10 passed / 0 failed**:

| | Result |
|---|---|
| **Ground** | `combs` / `comb_members` / `comb_rotations` / `private_hives`: `relrowsecurity=true`, **`relforcerowsecurity=false`**, **`owner=postgres`**. Read from `pg_class`, not grepped |
| **CONTROL** | Organizer inserts a rotation whose subject is not a comb member, as `authenticated` → **`42501`**, *"new row violates row-level security policy for table comb_rotations."* The clause is live and is the gate §1B.23.1 says it is |
| **PROBE** | The *identical* insert through a postgres-owned `security definer` granted to `authenticated`, called as `authenticated` → **succeeds, row persists.** WITH CHECK bypassed |
| **COUNTER-PROBE** | The disjointness `before insert` trigger still refuses a subject-as-contributor row on the privileged path. `ENG-58` Part 0's "trigger, not RLS" holds — and so does `ENG-92` Part 3's identical choice |

**`ENG-91`'s gate could not have answered this, and I nearly cited it.**
`check-comb-rotation-seal-send.mjs:96` creates `service_role nologin
**bypassrls**`, and `seal_and_send_rotation` is granted to `service_role` alone.
Its 20/20 is equally consistent with definers bypassing RLS and with them not.
The probe runs the definer as `authenticated` specifically to break that
confound.

**§1B.30.1 — what replaces the dependency: two acceptance rows on `ENG-93`, not
a wait.** Once the mint is a definer, the clause stating *"a comb writes for
anyone"* is skipped, so **`comb_open_rotation` must carry that rule itself.**
Nothing in the schema will stop a builder re-adding a subject-membership check,
and the only written record of why they must not is the line `ENG-92` deletes —
the rule loses its enforcement and its documentation in the same commit.

1. `comb_open_rotation` **must not** require the subject to be a `comb_members`
   row. Gated: mint for a non-member subject, assert success.
2. §1B.24.1(c)'s tombstoned-subject refusal (`profiles.deleted_at is not null`)
   lands here, per Lumen's rider `bf230693…` — record/error, never improvised
   copy.

`ENG-92` Part 1 remains correct and worth landing: it is the only statement of
the model in the schema, and a live `42501` for any future invoker path. It is
not a gate. **`ENG-93` deps: `ENG-58` (done), `ENG-83`.**

**§1B.30.2 — `20260830000005` is double-booked and no gate in the repo can see
it.** `ENG-92` is fully written (five parts) but **uncommitted** on
`sage/eng92-postmerge-fixes`, whose reflog is one line — *created from
`github/main`*. Its migration renamed itself `…0004 → …0005` between two of my
reads, colliding with `ENG-59`'s merge. **`…0005` is also taken:** an
uncommitted `20260830000005_comb_preview_by_invite_code.sql` sits in Fizz's
worktree. Neither session can see the other's untracked file. A third,
`20260830000004_ops9_rotation_scheduler.sql` in Bumble's worktree — colliding
with merged `main` — was present in my first sweep and gone four minutes later.

Every PG gate replays `fs.readdirSync(MIGRATIONS).sort()`
(`check-comb-rotation-seal-send.mjs:62`, `check-comb-join.mjs:48`): a duplicate
version prefix sorts fine, **both files apply, both gates go green.**
`prod-schema-sentinels` keys on the full filename stem (`:237`), not the
version, so duplicates get two contented rows. `.github/workflows/` holds
`test.yml` only. The collision surfaces at a manual `supabase db push` —
downstream of every signal the project has. The precedent is recorded in that
same sentinel file at `:206` (`ENG-58` renumbered `0001 → 0002` for exactly
this).

Tie-break, so the two sessions stop renaming into each other: **Fizz keeps
`…0005`** (it rides the branch that just merged); **`ENG-92` takes `…0006`.** No
semantic ordering between them. The durable fix is procedural, not technical:
**the version number is claimed in-channel, not in a worktree.** An untracked
file is invisible to everyone but its author.

**§1B.30.3 — `ENG-92` Part 5 has no dependency on anything and is the
compliance item.** Confirmed on `main`:
`20260830000001_eng84_account_deletion.sql` contains **zero** `comb_members`
references, so a tombstoned account remains an active comb member, and
`delete_own_account()` would raise on
`comb_members_owner_seat_permanent_trigger` for any organizer — a comb owner who
cannot delete their account (App Store 5.1.1(v)). The drafted `not exists`
owner-seat skip is the right shape. It has been correct and invisible for hours,
which is the exact failure §1B.24.0 names.

**Published `bfb67e64…` before committing this.**

**Open:** `O3`, `O4`, `O8`. No new `O`.
### §1B.31 — **Nothing opens month N+1.** `OPS-9` as built *resolves* rotations; it does not advance the comb — and `C1`, the number the price waits on, needs two advances to exist

Verified at `github/bumble/ops9-rotation-scheduler@32bdd74`, base `github/main@8864a12`.

**What `OPS-9` ships.** `advance_due_rotations()` (`20260830000005:64-88`) selects
`comb_rotations where closes_at <= now() and sealed_at is null and voided_at is
null` and calls `seal_and_send_rotation(r.id)` per row inside its own
subtransaction. That is a **resolver**, and a good one — the per-row
subtransaction, the `raise warning`, the flat refusal to re-derive `ENG-91`'s
deliver/void logic are all correct and none of it should come back. **What it
does not contain is an `insert`.**

`insert into public.comb_rotations` has **zero hits** on `github/main`, on
`github/bumble/ops9-rotation-scheduler`, on `github/fizz/eng59-comb-invite-join`,
and in Fizz's uncommitted preview migration — extending Lumen's tree-wide grep at
`8864a12` across every branch that has moved since. Nothing produces a rotation
row at month 1 (that is §1B.29, now `ENG-93`'s) and **nothing produces one at
month N+1 either.** The second half is new and it is on no ticket.

**The function's name is the tell.** `advance_due_rotations` does not advance a
rotation; it *ends* one. After the sweep every due rotation is sealed or voided,
the comb has no unresolved row, and the next tick finds nothing. The comb is over.

#### The consequences

**(a) §1B.16's rule is half-implemented, and the missing half is in its name.**
*"Window closes with zero entries → **void and advance**"* (`:764`). `ENG-91`
voids. Nothing advances. Under this build a single quiet month is not a `C1`
datapoint — it is the **end of the comb**, which is the opposite of what that
rule was written to produce.

**(b) `C1` cannot be measured, and `C3` is structurally 0%.** `C1` is *"≥60% of a
~12-member comb writes monthly, **sustained three months**"* — the number §8
makes the price wait for. Three sustained months requires **two automatic
advances**. Phase 3.1's *"seed three real combs"* would yield three one-month
experiments. `C3` (*"≥50% comb survival at 6 months"*) would not return a low
number, it would return **zero by construction** — and we would be reading a
build artifact as a market signal.

**(c) It is the §1B.14 sentence again, on the other verb.** I wrote *"a rotation
that only advances when its organizer taps is not a rotation, it's a reminder"*
about **seal**. `ENG-91` closed that. It is true verbatim of **open**, and
nothing has closed that. Same doctrine, same clock, second verb.

**(d) It fails silently, and §1A's ratified sentence cannot see it.** The
definition of done ends *"→ watch Sarah's reveal bloom."* Month 1 mints on an
organizer tap (`ENG-93`), seals on the clock (`ENG-91`), delivers, blooms — **the
ratified DoD is fully satisfied by a comb that then dies.** §1B.29 found a spec
complete for the invitee and empty for the organizer; this is the same defect on
the **time** axis — complete for month 1, empty for every month after. Two
instances in one evening is a property of how that sentence was written, not a
coincidence.

#### Whose row it is

Row 2633's own `OPS-9` text already says it: *"`pg_cron` jobs to **open a
rotation**, fire notifications, seal on `closes_at`, trigger the reveal.
**`ENG-60`'s runtime.**"* Row 1.8: *"the tick **advances state**."* §1B.29.2:
*"`OPS-9` mints month N+1 as `service_role` … month 1 and month N+1 are the same
call."* The migration's own comment routes it away — *"`ENG-60`, which mints the
rotations this sweeps, isn't built yet"* (`:105`) — and that reading cannot hold:
`OPS-9` is *`ENG-60`'s runtime*, so `ENG-60` is the **consumer** of the clock, not
the clock. A client screen minting month N+1 is (c).

#### RULED — `OPS-9` has a second half. It is a **blocked** row, not a rework.

`advance_due_rotations()` ships as written. What it needs is a successor call it
**cannot make yet**: `comb_open_rotation()` does not exist until `ENG-93`.

- **Row 1.8 gains a dependency on row 1.7a (`ENG-93`).** Deps become `1.1`,
  `1.8a`, **`1.7a`**. The row does not close until the tick, having resolved a
  rotation, opens that comb's next one through the **same `comb_open_rotation`
  body** `ENG-93` builds — §1B.29.2(c)'s one-body ruling, now with a third caller.
  **`ENG-93` was on nobody's critical path; it is now on `OPS-9`'s.**
- **Merge `OPS-9` now anyway.** The resolver half is independently correct and
  blocks nothing. But mark row 1.8 **partial, not done** — this is precisely the
  shape §1B.24.0 warns about: a requirement inside a ticket marked done
  evaporates with it.

#### Two product decisions the advance needs that no ruling has made

Both mine, both ruled here, both cheap for Colin to reverse.

1. **Whose month is next?** `comb_members` ordered by `joined_at`, wrapping,
   skipping any seat closed by `removed_at` or whose profile is tombstoned — and
   **skipping nobody else**, including the person whose month just voided. A
   quiet month costs the comb a month; it does not cost that person their turn.
   Any "earn your turn" rule turns the rotation into a scoreboard, which is §11's
   rejected shape wearing a schedule.
2. **When does month N+1 close?** `closes_at` of the rotation just resolved **+
   the comb's cadence**, never `now() + cadence`. A tick that fires five minutes
   late must not drift the comb's calendar five minutes every month. There is no
   cadence column today — **`ENG-93`'s mint should write one on `combs`**,
   defaulting to one month, so the number is stored once instead of hard-coded in
   two callers.

#### Three cheap items on the `OPS-9` PR, unrelated to the above

1. **The gate is the sixth member of the exit-code class** (channel `46da8627…`).
   `check-ops9-rotation-scheduler.mjs:69` sets `process.exitCode = 1` at the tally
   and `:53` requires `embedded-postgres` — it can print `N failed` and exit `0`.
   Sage's `sage/suite-exitcode-fix` is **better than what I asked for**:
   `check-exit-code-integrity.mjs:86-114` is a static `readdirSync` sweep of every
   `scripts/check-*.mjs`, not a hard-coded five, so it reds this gate on sight in
   either merge order. Adding `process.exit(process.exitCode ?? 0)` now is one
   line and avoids a red main.
2. **`…0005` is triple-booked and I mis-tie-broke it.** I awarded `…0005` to Fizz.
   Bumble's is **pushed** as `20260830000005_ops9_rotation_scheduler.sql`; Fizz's
   `20260830000005_comb_preview_by_invite_code.sql` is still untracked in a
   worktree. **Revised: Bumble keeps `…0005`, Fizz takes `…0006`, `ENG-92` takes
   `…0007`.** Fewest total renames, and it moves the number off the two files that
   are still invisible to everyone rather than off the one that isn't.
3. **`check-ops9-rotation-scheduler.mjs:2` still cites
   `20260830000004_ops9_rotation_scheduler.sql`** — stale from the `0004 → 0005`
   rename. It names a file that exists on no branch.

**Open:** `O3`, `O4`, `O8`. No new `O`.
### §1B.31.1 — Lumen's rider ratified with one addition; **and I mis-assigned the row.** The advance's *policy* is `ENG-60`'s, not `OPS-9`'s — two builders read that routing off the ticket and both were right

Lumen's three legs re-verified at `github/main`, all exact:
`comb_members_identity_immutable` bars `comb_id`/`profile_id`/**`joined_at`**
updates leaving `removed_at` the only mutable column (`20260830000002:215-227`);
`joined_at` is real at `:181`; and there is no cadence column anywhere.

**The strengthener is better than the ruling it supports.** The rotation-order key
is **immutable by construction** — no update path can reshuffle a comb's schedule,
and the one column that *can* move is exactly Ruling 1's skip condition. Ruling 1
therefore needs no defending code; the schema already refuses the attack.

#### (i) I mis-assigned the row. Correcting §1B.31.

I wrote *"whose row — yours [`OPS-9`], and the ticket already said so."* **Half of
that is wrong, and the half I got wrong is the half two other people had already
ruled on.**

`20260830000002:459-466` — Sage's, and addressed **at this document**:

> *"**No selection algorithm** (who becomes next month's subject) **and no
> rotation cadence/duration default are ruled anywhere I can find** in
> `POLLINATE_COMB_ROTATION.md` — flagging this back in-thread rather than
> inventing one here. This ticket provides the mechanism … **`ENG-60`** …
> **owns the policy of how those values get chosen and how a rotation
> auto-advances**."*

Bumble's `20260830000005:104` reads the same routing independently. **Two builders,
two migrations, same conclusion — and the ticket text supports them:** `OPS-9` is
*"`ENG-60`'s runtime"* and `ENG-60` is *"the rotation loop: **open**, notify,
collect, seal, reveal."* The **clock** is `OPS-9`. The **policy** — who is next,
how long a month is, when to advance — is `ENG-60`. I read `OPS-9`'s *"open a
rotation"* as ownership of both and it is ownership of the tick only.

This is my own §1B lesson on the other side of the table: *read the comment next to
the constraint before designing around it.* Sage's was a **fourth held-open
ruling**, written to me, and §1B.31's rulings 1 and 2 are its answer — I supplied
the answer and then filed it against the wrong row.

**What survives unchanged:** nothing opens month N+1; it is on no built ticket; the
sweep must **resolve-then-advance in one tick** or a comb sits with no open
rotation between ticks; and `C1`/`C3` are unmeasurable until it exists.

#### (ii) The corrected graph — and my first version had a **cycle**

Row 1.9 (`ENG-60`) already depends on row 1.8 (`OPS-9`). §1B.31 added 1.8 → 1.7a;
routing the policy to `ENG-60` instead would make it 1.8 → 1.9 → 1.8. **Split
`ENG-60`:**

- **NEW row 1.9a — `comb_advance_rotation(p_comb_id)`, @Fizz** (`ENG-60`'s, carved
  out). The server-side policy: compute the next subject, compute the next
  `closes_at`, call `ENG-93`'s `comb_open_rotation()`. **Deps: `1.1`, `1.7a`.**
- **Row 1.8 (`OPS-9`)** — the tick becomes **resolve, then advance**. Deps `1.1`,
  `1.8a`, **`1.9a`** (not `1.7a` — superseding §1B.31's edge).
- **Row 1.9 (`ENG-60` remainder)** — notify / collect / reveal, the client loop.
  Deps `1.1`, `1.6`, `1.8a`, `1.8`, **`1.9a`**. Acyclic.

`comb_open_rotation(comb_id, subject, closes_at)` stays the single **mint body**
with explicit parameters; `comb_advance_rotation(comb_id)` is the **policy
wrapper** above it. Month 1's subject is organizer-chosen and month N+1's is
derived — genuinely different policies over one mint, which is what §1B.29.2(c)
asked for and not a second guard surface.

#### (iii) Lumen's downtime rider — ratified, with one addition it does not cover

The rider: if `closes_at + cadence` is already past, jump to the smallest
`closes_at + k·cadence > now()` and mint **one** rotation, never fabricating the
intermediate months as quiet-voids. **Ratified in full.** A rotation that never
existed cannot be voided *quiet* — nobody could have written to it, and a
fabricated void is the system stating something false about people. And it is free
of ordinal bookkeeping: `ordinal` has **zero calendar coupling** in the schema
(`:471`, `:479` — a rotation counter, not a month index), so a skip leaves no gap
to reconcile.

**The hole: the first future boundary can be hours away.** An outage ending just
before a boundary mints a window of hours. Nobody is notified in time, nobody
writes, the month voids **quiet**, and `C1` records a failed month **caused by our
downtime**. That is `C1` contamination #5 — and the first one where the writers
were never even present to do anything right.

**It is Lumen's own principle, one step further.** They barred fabricating a month
nobody *could* write in. A one-hour window **is** a month nobody could write in —
minted rather than fabricated, but producing the identical false record at the end.

**RULED — a floor, on the derived path only:** the minted window must be at least
**half a cadence**; if the first future boundary is nearer than that, take the next
one. Still on a boundary, so no drift. Still one rotation, so no fabrication. The
subject pointer still advances once, so no turn is burned.

**Half a cadence, not a day count**, because cadence is now a stored per-comb
column and a fixed number of days would be a second constant obliged to track it —
the drift class Lumen just correctly named. Expressed in the same unit, it needs no
second decision.

**Derived path only.** An organizer who taps *create* and picks a `closes_at`
tomorrow has made a visible choice that is theirs to make. The floor exists because
the outage case is **invisible and system-caused**.

#### (iv) Lumen's render pin, accepted and narrowed

*"The order is a mechanism, not a rendered promise"* — accepted. One narrowing so it
is checkable rather than a posture: if `DES-33`'s tense frame (*"next month, for
someone else"*) ever **names** that someone, the client needs the same ordering
rule and it gets written twice. **`comb_advance_rotation` is not the only possible
reader — so the ordering belongs in a function, not inlined in the advance.** If
`DES-33` names nobody, nothing is needed and this costs nothing.

**Open:** `O3`, `O4`, `O8`. No new `O`.
### §1B.31.2 — Lumen's grant pin ratified; **and the tick's ordering is not a preference, it is the only order the schema permits — with a rollback hazard underneath it that would withhold a delivered keepsake forever**

`comb_advance_rotation` **`service_role` only.** Ratified, and the mechanism
checks out: `advance_due_rotations` is `security definer` owned by `postgres`, so
its inner call runs as `postgres` and bypasses the `EXECUTE` check entirely —
exactly what Bumble's own comment says about `advance_due_rotations`' grant
(*"documents the intended caller even though the actual pg_cron execution role
bypasses it"*). **The grant costs the tick nothing and closes a door.** An
`authenticated` grant would be an organizer force-advance nobody ruled, and — as
Lumen puts it — §1B.14's sentence returning through a side door. If we ever want
organizer-forced advance, that is a ruling, never a grant lying around.

#### (i) I was wrong about the risk, and Sage had already built the guard

I expected a double-advance to be able to open two rotations on one comb. **It
cannot.** `comb_rotations_one_open_per_comb` (`20260830000002:495-496`) is a
partial unique on `(comb_id) where sealed_at is null and voided_at is null` — the
R2 shape from `hive_volumes_one_open_per_hive`, and its comment already reasons
about voided rows counting as closed. **Verified `23505` against a live Postgres.**
Checked before asserting; the assertion did not survive.

#### (ii) But the same constraint makes **resolve-then-advance the only legal order**

§1B.31 said the tick must *"resolve, then advance."* I wrote that as tidiness. **It
is a requirement, and the schema enforces it.** The rotation being resolved is open
at the top of the tick's iteration, so it occupies the partial index:

- **advance-before-resolve** → the successor insert collides → **`23505`** (probed).
- **advance-after-resolve** → the resolved row leaves the partial index → succeeds
  (probed).

And the wrong order fails **inside Bumble's existing `exception when others then
raise warning` handler** — a log line, not an error. **The comb would silently
never advance again.** The order is load-bearing and the penalty for getting it
backwards is invisible.

#### (iii) The finding — **seal and advance must be SEPARATE subtransactions**

`begin … exception … end` in PL/pgSQL **is** a subtransaction: an exception rolls
back everything the block did. So if the advance is added inside the block that
already wraps the seal:

> **a raising advance rolls back the committed seal-and-send.**

Probed against a live Postgres, 4/4:

| Probe | Result |
|---|---|
| advance-before-resolve | `23505`, `rot_one_open_per_comb` |
| advance-after-resolve | succeeds |
| **seal + advance in ONE block, advance raises** | **`sealed_at`/`sent_at` back to `null` — delivery undone, warning swallowed** |
| seal + advance in TWO blocks, advance raises | **seal commits, delivery survives** |

**And it does not self-heal — it loops.** The rollback leaves the rotation
unresolved, so the next sweep picks it up, re-seals (the idempotency check finds
nothing to skip, because the seal was undone), and fails again. **Every five
minutes, forever. Sarah never receives a month that was finished and ready,
because next month could not be opened.** A warning is the only trace, and
warnings are not transactional so they do reach the log — which is the one mercy
here.

**RULED for row 1.8:** the tick wraps the seal and the advance in **two separate
`begin … exception … end` blocks** per rotation. The seal must commit independently
of the advance. **A comb that cannot advance still delivers.** Coupling the
keepsake's delivery to the scheduler's ability to open the *next* month inverts
what the product is for.

#### (iv) The trigger that would fire (iii) — ruled, so it cannot

What makes an advance persistently raise? **A comb with no eligible subject** — every
member `removed_at`-closed or tombstoned. That is not hypothetical: **`departed` is
already a named state** in `ENG-91`'s three-way classification (§1B.26.3).

**RULED: "no eligible subject" is DORMANCY, not an error.** `comb_advance_rotation`
returns without minting and **raises nothing**. The comb simply has no open
rotation. Otherwise the departed-comb case is precisely the permanent-stall trigger
in (iii), and the last surviving member's final keepsake is the one that never
lands.

**No new column.** Dormancy is **observable by absence** — a comb with no open
rotation and no recently-resolved one is dormant, which is all `C3` needs. A
`dormant_at` would be a second source of truth for a state the rows already state.

Lumen's **R12 adopt-don't-copy** framing of §1B.31.1(iv) is the right register for
the ordering function, and accepted as the name for it.

**Open:** `O3`, `O4`, `O8`. No new `O`.
### §1B.31.3 — Dormancy is a one-way door (Lumen, correct). Their revival probe would mint **month 1** for a comb the organizer hasn't finished creating — and my Ruling 1 never set a floor: **the derived advance needs two active members, not one**

Lumen's two legs verified at `github/main`: `comb_join_by_invite_code`
(`20260830000004`) gates on **invite-code validity** (`:48-53`) and **membership
state** (`:56-68`) and reads nothing about rotations — no liveness check exists;
and the sweep's predicate is rotation-scoped, so a comb with no open rotation is
untouched by every tick forever. **The finding stands: I ruled dormancy without
an exit.** A stranger joins through a still-live invite link and the comb never
rotates again — *"nothing mints month N+1,"* one state further down. Mine to fix.

**Revival is the clock's job, never the join's** — ratified. A mint inside an
`authenticated` call reopens the force-advance door the grant pin just closed,
this time to any joiner.

#### (i) The hazard in the proposed predicate: it cannot tell **dormant** from **not started yet**

*"Combs with no open rotation and an eligible subject"* also matches a comb that
has **never had a rotation at all**. `ENG-93`'s create flow is **two ordered
writes** — insert the `combs` row, then call `comb_open_rotation` with the
organizer's chosen subject — and between them the comb exists with no open
rotation. That window is a client round-trip wide, and it is **permanent** for any
organizer who abandons the flow after step one.

**A tick landing in that window mints month 1 with a *derived* subject** —
overriding the organizer's choice of who the comb is *for*. They created it for
Sarah; the clock opens it for whoever sits first in `joined_at`, which is the
organizer themselves. **Sarah's month, silently reassigned, before anyone was even
invited.**

**RULED:** revival requires **at least one resolved rotation** on the comb. A comb
with zero rotations ever is **pre-launch, not dormant** — it belongs to the
organizer's create flow, not to the clock. One clause, and it is what makes
*"dormant"* mean anything: dormancy is a state a comb **falls into**, never a state
it is **born in**.

#### (ii) Correcting my own Ruling 1 — it skips the wrong people correctly and never set a floor

Ruling 1 says the order skips `removed_at`-closed and tombstoned seats *"and
nobody else."* That is right about **who is skipped**. What it never states is
**how many must remain.**

Walk Lumen's revival with one joiner. The comb had every member depart. One person
joins. They are now the only eligible member — so the derived subject **is** them.
Who writes? `hive_contributors_not_hive_subject` (`:120-133`, `before insert`)
refuses the subject as a contributor of their own hive. **Nobody can write. The
month opens, runs its full window with zero possible authors, and voids quiet.**

That is Lumen's own fabricated-void bar reached by a longer road — a month nobody
could write in, and this time **guaranteed rather than unlucky**.

**RULED: the derived advance requires ≥ 2 active members.** ***[Vector, 2026-08-30 — §1B.36.10, CLARIFIED ON TERM, unchanged on substance: read "active" here as **ENROLLABLE** — `comb_members.removed_at is null` AND `profiles.deleted_at is null`, the mint's own post-`ENG-100` population. That is what this section already ruled (the walk above counts *"the only **eligible** member"*, and Ruling 1's skip list is `removed_at`-closed **or tombstoned**), but the bare word "active" carries the SEAT sense elsewhere in this document and `ENG-100` is the event that makes the two populations differ. Named, not re-decided — @Lumen's coupling pin, re-grounded.]*** At one, the comb stays
dormant and raises nothing. This is not revival-specific — **it governs every
advance**, including a live comb that shrinks to one member mid-rotation.

**Month 1 is exempt, and the asymmetry is the model, not an exception.** Month 1's
subject is **organizer-chosen and may be a non-member** — *"gate the giving, never
the getting,"* `subject_profile_id references profiles` not `comb_members`. One
organizer writing for a Sarah who has never installed the app is a **valid** comb.
The floor binds the **derived** path only, because that is the path that draws its
subject **from the roster** — and a roster of one cannot produce a subject and an
author.

**So Lumen's closing image is right in spirit and off by one person.** The first
joiner does not wake the comb — they have nobody to be celebrated *by*. **The
second one does.** Which is the truer story: a comb needs two people to be a comb.

#### (iii) Not ruled, flagged for whoever writes 1.9a

The revival probe runs every tick against combs with no open rotation — a set that
**only grows**, since a permanently dead comb is re-probed forever. Irrelevant at
three seeded combs, real at scale. **Wants a partial index before it matters**;
noting it rather than ruling it, because the right shape depends on the query 1.9a
actually writes.

**Open:** `O3`, `O4`, `O8`. No new `O`.

---

### §1B.32 — `ENG-92` closes the tombstone class in two functions. A **third** landed one commit later, it is the only **anon** one, and the Part 4 predicate applied to it would make one leg *worse*

**Provenance, so this reads as a merge-order artifact and not a miss.** Sage wrote
`ENG-92` against `github/main@8864a12` and based the branch on `0f898ce`.
`comb_preview_by_invite_code` (`20260830000006`, Fizz's `ENG-59` preview) exists in
**neither** — it merged at `9bc6d04`, after both. This is §1B.24.0's shape again:
*two tickets merging one commit apart cannot cite each other as already-done.*

**`ENG-92` Part 4 names the class exactly** — *"`comb_member_count()` and
`comb_co_member_names()` **both** live-join profiles and both need to stop
counting/naming a tombstone."* On `github/main@9bc6d04` there are **three**
functions in that class, not two.

#### (i) The three legs, verified at `github/main@9bc6d04`

`comb_preview_by_invite_code` returns three profile-derived values and **none of
them reads `deleted_at`**:

| Leg | Source | Tombstoned → |
|---|---|---|
| `member_count` (`:94-97`) | plain `comb_members` count, **no `profiles` join at all** | counts deleted accounts |
| `subject_name` (`:91`, `:101`) | `left join profiles p_subject` | renders `''`, with `has_active_month = true` |
| `inviter_name` (`:90`, `:100`) | `join profiles p_owner` (inner) | renders `''` |

`git grep deleted_at github/main -- supabase src` returns **exactly two files**:
`ENG-84`'s own migration and `ENG-91`'s seal. The preview is not among them.

**Reachable today, not hypothetical:** `delete_own_account()` is wired to a live
client caller at `src/services/HoneycombStore.js:68`.

**The sharpest form — two functions, one row, opposite answers.** `ENG-91` reads
`p.deleted_at` for the subject (`20260830000003:168`) and classifies
`subject_gone` → **void** (`:181`). For the same open rotation, the preview
answers `has_active_month = true` and names the subject. The function that says
*"this month is already void"* is server-side and private; the function that says
*"there is an active month, come write for her"* is **anon, and is the only
pre-auth surface the product has**.

**Gate coverage:** `scripts/check-comb-preview.mjs` is 9/9 green and contains
**zero** occurrences of `deleted_at` or `tombstone`. Its count row asserts
*"a removed member is not counted"* — `removed_at` only. The gate is correct about
what it tests; the class is simply absent from it.

#### (ii) RULED — the fix is not one predicate, and applied blind to leg 3 it is a regression

- **Leg 1 (`member_count`) — Part 4's shape, verbatim.** Join `profiles`, add
  `and p.deleted_at is null`. `DES-37`'s small-N suppression (absent at N=1–2,
  present at N=3+) keys off this number, so two live members plus one tombstone
  currently lifts the suppression and prints *"3 people are writing for Sarah"*
  when two are.
- **Leg 3 (`inviter_name`) — DO NOT add the predicate.** `p_owner` is an **inner**
  join: `and p_owner.deleted_at is null` returns **zero rows**, which is byte-identical
  to the invalid-code return (`:81-83`). A stranger holding a **valid** link to a
  **live** comb would get *not found*. That collapses two distinct states into one —
  precisely the defect `has_active_month` was built to avoid. Correct shape is a
  **nullable `inviter_name`** plus a `COPY-6` variant, never a filter.
- **Leg 2 (`subject_name`) — recommended, copy is Lumen's.** A tombstoned subject's
  month is *guaranteed* to void at seal (`ENG-91` above). Naming her is naming a
  month that cannot happen — **Lumen's fabricated-void bar, on the read side.**
  Recommend `subject_name` null and `has_active_month` **false**. Whether that
  copy-collapses with pre-launch and dormant is `COPY-6`'s call, not this
  function's.

#### (iii) Routing — split at the artifact line

- **Leg 1 → `ENG-92` Part 6 (Sage).** Same predicate, same `create or replace`,
  same rationale paragraph; and Sage **must rebase anyway** (base `0f898ce`, main
  is `9bc6d04`). Shipping `ENG-92` as-is lands a migration that closes a *named*
  class in two of three functions and leaves the newest and only anon one open —
  **a partial fix to a named class is worse than none, because the next reader
  believes the class is closed.**
- **Legs 2+3 → new row 1.7b, `ENG-94` (Fizz, S).** These change the function's
  **return contract**, not a predicate — a different artifact from `ENG-92`'s.
  Blocks nothing: `git grep` finds **no client reader** of
  `comb_preview_by_invite_code`, `comb_member_count` or `comb_co_member_names` in
  `src/` on main, so the whole class is still pre-emptive. Fix it before `DES-37`
  renders it, not after.

#### (iv) Two merge-pass items, neither a defect

1. **Neither open PR has run against current main.** `sage/eng92-postmerge-fixes@4632eec`
   and `bumble/ops9-rotation-scheduler@15635f8` both sit on `0f898ce`; main is
   `9bc6d04`. Both suites (48/48) are true statements about a tree that is one
   commit behind. Re-run on the actual merge result.
2. **Migration numbers are collision-free but the merge order inverted.** Applied
   order on main is `…0004`, `…0006`; Bumble's `…0005` merges *after* `…0006` is
   already in the tree. There is **no deploy workflow** (`.github/workflows/` is
   `test.yml` only), so nothing applies automatically — but if `…0006` reaches prod
   before `…0005` merges, `…0005` is an out-of-order migration. Land it first, or
   renumber it at merge.

**Open:** `O3`, `O4`, `O8`. No new `O`.

---

> ### ⤵ §1B CONTINUES AFTER §11 — this is the end of §1B.32, not the end of §1B
>
> The next section in numerical order is **§1B.33**, and it is at the **end of
> this file**, below §11, with §2–§11 in between. **Thirty-four §1B sections
> live down there, including every §1B.36.x.** Do not read §2 as §1B's
> terminator: §1B.33–§1B.36.24 are the *newest* amendments, and so the ones most
> likely to be live.
>
> Split introduced at `1fc1696`; recorded and reasoned at **§1B.36.23**.

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
experience"*) both bar. Ruled explicitly, event `d662661b…`. **[Vector, 2026-08-30 — the FK is
necessary and not sufficient; §1B.23.1 found three gates standing between this
rule and the build, only one of which is `ENG-58`'s. Read it before citing this
rule as implemented.]**

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
| **C1** | **Rotation participation** — share of that month's `hive_contributors` who write for the subject **[Vector, 2026-08-30 — denominator corrected, §1B.23.2. Was *"share of an active comb"*; the subject is a comb member and cannot write for herself, so that ratio's ceiling is `(N−1)/N` — 80% for a perfect 5-member free comb, 66.7% for a comb of 3 against a 60% bar. The denominator is who **could** write, not who is in the club.]** **[Vector, 2026-08-30 — §1B.26.3: also exclude anyone whose `hive_contributors.removed_at` falls inside the rotation window. A mid-month account deletion removes the writer *and* deletes their letter, so leaving them in the denominator reports a healthy comb as failing.]** **[Vector, 2026-08-30 — §1B.36.7, AMENDED: the exclusion is keyed on the CAUSE, not on the column. `ENG-99` gives a comb DEPARTURE the identical `removed_at` signature with the opposite entry behaviour — Pin 2 keeps the letter, which ships and is named — so the bare `removed_at` test now inflates C1 toward 100% by preferentially dropping non-writers who quit. Exclude only `removed_at` inside the window AND `profiles.deleted_at is not null` (account deletion). A comb departure STAYS in the denominator and its surviving entry stays in the numerator.]** **[@Lumen + Vector, 2026-08-30 — §1B.36.8, PREDICATE SUPERSEDED, cause upheld: the test is `hive_contributors.removed_at = profiles.deleted_at` (both operands frozen at stamp time by their own immutability triggers), NOT `deleted_at is not null`. A writer who quits the comb and deletes their account weeks later answers `is not null` while their sealed letter sits in the numerator — 110% and the quit erased. Equality classifies by the transaction that closed the seat, so it is invariant under every write that lands after the window closes. Everything not equal — including a future organizer-eject via `hive_contributors_update_owner` — stays in the denominator.]** | **≥60%, sustained 3 months** | `ENG-89` |
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

- ~~**`DES-21`** (Deezine, L) — collective reveal, N authors in one sequence.~~
  **CLOSED — SHIPPED 2026-08-28, `github/main@a02e247` (Pixel, not Deezine).**
  Per-entry signature, colophon roster/count, gate `check-collective-reveal.mjs`,
  ratified spec `GUIDES/POLLINATE_V2_DES21_COLLECTIVE_REVEAL.md`. This row was
  reused in error when this doc was written; **the rotation frame is `DES-33`**
  (§1B.3). Do not re-open `DES-21` and do not carry its L estimate.
- **`DES-22`** (Pixel, M) — comb identity: hexagon cluster, member states,
  rotation indicator *("writing for Sarah — 6 days left")*.
  **AMENDED 2026-08-30 (§1B.8): "member states" means PRESENCE, NOT CAPACITY.**
  No denominator, no seats-remaining, no fullness. **No surface in MVP-Comb names
  the number 5** — cap enforcement is out (`§1A`), and a cap you are not enforcing
  cannot be drawn honestly against a seeded comb of twelve.
- **`COPY-6`** (Lumen, M) — comb + rotation copy. **Never "group," never
  "community," never "post."**

New rows:

| ID | Owner | Est | Issue |
|---|---|---|---|
| **DES-29** | Deezine | L | **Comb-first first run.** The app opens on `TodayTab`, a solo journal (`src/navigation/MainTabs.js:115`), and `Onboarding` ends in a personal entry — teaching "journal app" in three seconds and hiding the pillar we sell. Two doors, **comb primary**: *"Start a comb with your people"* / *"Write for one person."* Comb happy path: **person → occasion → date → invite by link → write.** Sequence with `ONBOARDING_ZERO_DOOR_SPEC.md` — same `App.js` region |
| **DES-30** | Pixel | M | **Paywall surfaces, at two moments and no others.** (1) **Adding the 6th member** to a comb you run. (2) **Creating or joining a second comb** to write in. Both are private, organizer-side, high-intent. **Never at a seal or a reveal**, never "upgrade to unlock" (`COPY-13`). Copy must never imply a friend is being excluded — the message is *"add more people,"* never *"they can't come"* |
| **DES-31** | Pixel | M | **Rotation state on the Hive tab**: subject, days remaining, contributor **count**. **Never contributor content** — blind-until-seal (§18.1) is a privacy boundary, not a nicety. **AMENDED 2026-08-30 (§1B.9): the count is the MEMBER's view only. The subject sees NO count before the seal — not live, not snapshot, not "some people have written."** The subject sees who it is for and how long, and nothing countable. Two views of one rotation. Blind-until-seal covers the number, or the number becomes the spoiler — and a subject-visible share contaminates `C1` |
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
| **ENG-58** | Sage | L | Migration: `combs`, `comb_members`, `comb_rotations` + RLS. **Not built** — no such migration exists, and no `invite_code` or rotation path exists in `src/` (both searched). **Also owns the definer-backed roster read** (§1B.17): `profiles` RLS admits only your own row and your connections, so in a comb formed by invite link every member renders as `'Someone'` |
| **ENG-59** | Fizz | M | Comb invite-link join flow. Deep-link scheme `pollinate` already registered (`app.json`); `AuthContext.js:93-101` already listens and drops non-auth URLs (§1B.28.3). **Three additions:** (a) the anon landing preview is a **new** definer, not `comb_member_count`, whose WHERE-clause auth returns `0` rather than refusing (§1B.28.4); (b) its invite code carries the access control, so it needs enumeration-resistant entropy (§1B.28.4); (c) a **name-collection step between auth and join** — without it every account `ENG-83` creates is `'New user'` and the comb roster is a column of placeholders (§1B.28.2). **Must not mint friend connections on join** (§1B.16) |
| **ENG-60** | Fizz | L | The rotation loop: open, notify, collect, seal on `closes_at`, reveal. Needs a scheduler — `pg_cron`, `OPS-9`. **§1B.31.1: `ENG-60` owns the advance POLICY** — `20260830000002:459-466` (Sage) routed *"who becomes next month's subject … and how a rotation auto-advances"* here and flagged it back to this doc as unruled; §1B.31's Rulings 1 and 2 plus Lumen's downtime rider are that answer. **The `open` half is carved out to row 1.9a** so `OPS-9` can depend on it without a cycle |
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
| **ENG-93** | Fizz | M | **Create a comb.** NEW (§1B.29). `DES-29`'s happy path *person → occasion → date → invite by link → write* is designed and **built by nobody** — `create_comb`/`createComb` are zero hits in `src/`. Three parts: (a) the create screen + store method (**no migration** — `combs_insert_own` `20260830000002:165` and the owner-seat trigger `:352` are shipped, and `invite_code`'s `gen_random_uuid()` default `:150` is already 122 bits, closing `ENG-59`'s entropy sub-item); (b) **`comb_open_rotation()`** — a `security definer` mint granted to **both** `authenticated` and `service_role`, because `ENG-91` shipped seal-and-send only and **nothing mints a rotation at any month**; month 1 and `OPS-9`'s month N+1 must be the same body or every rotation invariant is written twice (§1B.29.2c). Carries §1B.24.1(c)'s tombstoned-subject refusal, which was filed into a function that does not exist; (c) **the organizer's name-collection gate** — Lumen's ruling `4fdd39e2…`, `ENG-59`'s component remounted with a header swap and *"Create the comb as Maya"*. ~~Depends on `ENG-92`~~ — **corrected §1B.30: `ENG-92` is a cleanup, not a gate.** The definer mint bypasses the `comb_members` WITH CHECK entirely (probed at `0f898ce`, CONTROL `42501` / PROBE succeeds), so the clause `ENG-92` deletes is never evaluated on this path. **Deps: `ENG-58` (done), `ENG-83`.** Two acceptance rows replace the dependency (§1B.30.1): the mint must **not** require the subject to be a `comb_members` row, and it carries the tombstoned-subject refusal |
| **ENG-91** | Sage | M | **Server-side seal + send for a rotation.** `seal_hive`, `seal_volume` and `send_hive` all gate on `v_owner_id <> auth.uid()`, so **no scheduled job can seal or deliver a month** — `OPS-9` is structurally refused, not merely unwired (§1B.14). Needs a definer path gated on **the rotation's window having closed**, not on who is calling, plus the grants a service role actually holds. **Semantics ruled in §1B.16: seal-and-send, one event, idempotent.** **Cannot wrap `send_hive`** — its friend-connection precondition makes a comb undeliverable; authorization is **comb membership**. **Must refuse to deliver a zero-entry rotation.** **Gates the §1A definition of done** (there is no reveal without a seal) |
| **OPS-8** | Lumen + Bumble | S | **Close the analytics contradiction before the privacy policy publishes.** Amend `legalCopy.js:159,207` per V2 §20.2 — narrow the promise, do not delete it. **Blocks `ENG-89`/`ENG-78` from being honest** |
| **OPS-9** | Bumble | M | **Rotation scheduler.** `pg_cron` jobs to **open a rotation**, fire notifications, seal on `closes_at`, trigger the reveal. `ENG-60`'s runtime. **§1B.31 — the open half is missing from the shipped branch and was routed to `ENG-60` in the migration's own comment; it cannot live there, because `OPS-9` *is* `ENG-60`'s runtime.** Also carries §1B.31's two unruled product decisions now ruled: next subject = `comb_members` by `joined_at` wrapping (skipping closed/tombstoned seats and **nobody else**), and `closes_at + cadence`, never `now() + cadence` |
| **COPY-13** | Lumen | M | **Ruling sweep.** Retired tokens: `$39.99`, `annual only`/`annual-only`, `$79`, `$5.99`, `metered at delivery`, `delivery is the only meter`, `first delivery free`, `organizer pays` / `organizer[- ]paid` *(amended 2026-08-31: the hyphenated participle is the form every 08-30 defect site actually used — a list carrying only the verb form is blind to the adjective)*, `Slice 1 (still )?ship(s|ping) first` *(added 2026-08-31: a retired sequencing claim. The token was first written `ships first`; widened to the participle the same pass, because `Pollinate_The_Ruling.md`'s **"Unchanged:"** bullet says "Slice 1 shipping first" and is invisible to the verb form — the same blindness as `organizer pays` vs `organizer-paid`, one inflection over. census at `0077dce` with the widened token: 11 hits, 7 machinery, **4 live**, all repaired this pass)*. Follow `README.md`'s sweep procedure — eye-read cited rows, sweep the *retired* token, publish both yields, verdict reads "N hits, all classified legitimate," never "zero hits" |

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
> Instrumentation (2.7) and EAS distribution (2.8) are **in** — `O6`/`O7` closed
> `a11aa144…`. Phase 3 is operations you run *with* the shipped MVP; Phase 4 is
> gated on Phase 3's numbers.

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
| 1.1 | **Sage** | `ENG-58` — `combs` / `comb_members` / `comb_rotations` + RLS. Reuse the `is_hive_contributor()` definer shape (recursion-safe). `is_collective`-style immutability per §18.1a C2. **Plus the co-member name read** — definer helper, **not** a widened `profiles` policy (§1B.17). **Three additions from §1B.22:** (a) the subject/contributor disjointness must be re-expressed as a **`before insert or update` trigger** on both tables — today Direction 1 is an RLS `WITH CHECK` a definer bypasses and Direction 2's trigger is `before update` only, so a server-minted rotation hive evaluates neither (§1B.22.4); (b) a **second** definer read for member-view per-person write-status — per-member boolean, never content, never a count of content, authorized by `is_hive_contributor(hive_id)` and never `is_comb_member()`; RLS cannot supply it and OPEN-1 closed that side deliberately (§1B.22.3); (c) any table added here that references `profiles` states its own deletion behaviour in its own migration (§1B.19). **Built at `ae39cf1`; all three landed. Three additions from §1B.23, all small, all riding the rebase:** (d) drop the `comb_members` existence clause from `comb_rotations_insert_owner`'s `WITH CHECK` — it reinstates §11's rejected *pay-to-be-celebrated* shape through the seat cap and empties `C2`'s population (§1B.23.1); (e) add `comb_rotation_writer_count(p_rotation_id)` over the month's `hive_contributors`, authorized by `is_comb_member` — `comb_member_count` overcounts the writers by one, always, and is `C1`'s wrong denominator (§1B.23.2); (f) a `before update` trigger pinning `private_hives.subject_profile_id` while a `comb_rotations` row references that hive — the projection is frozen and its source is not (§1B.23.3) | — |
| 1.2 | **Sage** | `ENG-85` — entitlement model, **caps disabled** (§8.5). **Must include a per-comb entitlement override column** so Phase 4 can grandfather the seeded combs without a schema change (§1B.4) | 1.1 |
| 1.3 | **Fizz** | `ENG-83` — magic-link / Sign in with Apple | — (start with 1.1) |
| 1.4 | **Pixel** | `DES-22` + `DES-31` — comb identity, rotation state. **`DES-22` is the DESIGN LONGEST POLE — start it first** (§1B.10): `COPY-6` (1.10) and `DES-29`'s comb happy path (1.5) both need comb identity to exist before they can be written or drawn. **`DES-22` draws presence, not capacity** (§1B.8). **`DES-31`'s count is the member's view only — never the subject's** (§1B.9). **Spec real names** — today a comb of strangers renders every member as `'Someone'`; making that true is `ENG-58`'s job, not something to design around (§1B.17). **THREE AMENDMENTS 2026-08-31 (Vector, §1B.37), all in `DES-22`'s cell cluster:** (a) the *"invited, not joined"* cell state is **STRUCK** — one shared `invite_code`, no per-recipient row, no query (@Pixel found it, @Lumen ruled it, I verified it); (b) **the cluster is TWO reads, not one** — draw cells from `comb_co_member_names` (live `comb_members`) and overlay `has_written` from `comb_rotation_roster` where a row exists, because `comb_rotation_roster` alone returns **zero rows** to a member who joined after the rotation was minted, i.e. an empty comb screen on the first screen after the invite link; (c) that late joiner is the **fifth** cell state — in `comb_members`, not in this month's `hive_contributors` — and its cell **may not carry the hasn't-written dim mark**, because they cannot write this month at all. Whether the state is named to the user, and how it is drawn, is yours and @Lumen's. **Not blocked on `O10`** (does a mid-month joiner write this month or next? — @Colin): (b) and (c) are correct under either answer. **STATUS CORRECTED §1B.38.9 — THIS ROW IS BUILT, NOT UNSTARTED, AND NOBODY WAS TOLD.** `pixel/des22-comb-identity@da8b303` (pushed 2026-08-30T20:56 −0400, merge-base `88af096`, **1 ahead / 25 behind `main`**) carries **+444** across `CombIdentityCluster.js`, `RotationFold.js`, `numberWords.js` and a new gate `check-comb-identity.mjs`. **Zero PR, zero relay mentions** (`buzz messages search` on all three symbols returns `[]`), zero canon references. **Two things are owed before it merges:** (i) `RotationFold` renders **row `1.9`'s ratified line** — same two lines, same tokens as `RotationFrame`'s active branch — and names the comb screen as its first mount, so **@Lumen rules which component owns that sentence** before either is wired (recommendation and reasoning in §1B.38.9: `RotationFold` for collect, `RotationFrame` stays on the reveal); (ii) the base predates two gates — **52** `check:` scripts on the branch vs **53** on `main`, and the branch's addition lands in that same `package.json` block — so **re-derive at rebase time and run the suite on the merge commit** (1.7b's standing requirement). Neither component is mounted: `CombIdentityCluster` and `RotationFold` have ** **AMENDED §1B.38.10 — `RotationFold`'s stated reason for existing is not implemented.** Its header claims the fold is built once *"so a rounding fix … move[s] all three together, per DES-31/39 §1.2's own reason for sharing `closes_at`'s day-math in one place"* — but `daysLeft` is a **caller prop**, `Number.isFinite`-formatted, with no `closesAt`, no computation and no interval anywhere in the file. The fold shares the COPY; the day-math is duplicated into all three mounts the same comment enumerates. `src/` has **no exported days-REMAINING helper** and its one exported day-difference helper (`daysSinceHiveCreated`, exported from `src/constants/hivePrompts.js`) **floors**, against the `Math.ceil` inside `RotationFrame`'s countdown effect — a full day apart for every non-integral remainder. The new gate cannot see it: R1–R5 never read the day-math and **R4 explicitly exempts `daysLeft`**. **Owed before merge alongside (i) and (ii): one home for `closes_at`→`daysLeft` (recommendation — `src/utils/rotationDays.js`, `ceil`, injectable `now`), plus a gate row asserting exactly one such computation in `src/`.** Not blocked by @Lumen's component ruling — owed under either answer; **build side is row `1.9`'s** **AMENDED §1B.38.11 — (i) IS RESOLVED AND ALL THREE HARDENING REQUIREMENTS ARE BUILT AND GATED.** @Lumen ruled `R-38.9-A`/`-D`: **`RotationFold` owns the collect mount**, `RotationFrame` the reveal, sealed form only; DES-31 contributor card + DES-39 organizer card wear the `RotationFold` member variant. @Pixel shipped the fail-closed `variant` guard + `countKind`-blind subject branch (`ad858ac`) and `R-38.9-E`'s `sizeCount = countKind === 'size' ? count : null` derived above the split (`e94a27a`); `check-comb-identity.mjs` gains R6/R7/R8, each mutation-verified, each resolving the identifier back to its declarator rather than keying on a name. Verified at `e94a27a` in my shell: 54/54 gates, 1752 assertions, exit 0. **(ii) still stands and its number moved: 54 `check:` scripts on the branch — re-derive against `main` at rebase time, run the suite on the merge commit** (1.7b's standing requirement). **NEW, from probing the hardening's own new surface (§1B.38.11 §4) — non-blocking for merge, blocking for row `1.9`'s wiring:** `isMember = variant === 'member' && !!subjectName` `&&`s a reader CLASSIFICATION with a QUERY RESULT, so a refused name read overrides a correct `member` classification and renders **the subject's branch to a member**. The population is real and ruled-legal — the mid-rotation joiner, refused `private_hives` by `is_hive_contributor` (see row `1.9`). **Split the boolean: `variant === 'member'` alone selects the reader; a missing `subjectName` INSIDE the member branch is a REFUSAL, rendered as whatever @Lumen rules — never as the nameless branch.** Requirements 1, 2 and `R-38.9-E` all hold unchanged under the split; `R6` then asserts the name requirement as a refusal rather than a fallthrough. **Also owed (non-blocking):** the header calls caller-side zero-suppression *"the caller's job"*, but both branches suppress on `count == null \|\| count <= 0` and `R5` pins that disjunction — so a caller passing a fails-open `0` is indistinguishable from one that did the §1B.33 work, and **no gate here can ever fail because a caller skipped it.** Keep the suppression; call it a **backstop** in the comment, so row `1.9`'s caller-side obligation stays legible. **Timing verified (@Lumen's note): `git grep` for both component names in `src/` at `e94a27a` returns ZERO importers, so no caller sweep is owed and every future mount inherits the `countKind: 'size'` contract from day one.** **§1B.38.10's day-math requirement is now `R-38.9-C` and its BUILD SIDE is row `1.9`'s, riding the collect-mount commit** — nothing further owed here. **AMENDED §1B.38.12 — `R-38.9-F` (Lumen): the guard SPLITS and the refusal is its own state.** `variant === 'member'` alone classifies the reader (caller knowledge, not data); a missing `subjectName` **inside** the member branch renders a **REFUSAL STATE**, never the nameless branch. Refusal render, provisional pending COPY-6: line 1 `label`/`ink` — **"This month is already underway."** (true under BOTH `O10` arms, which is what makes it shippable before `O10` is answered — preserve that property through any rewording); line 2 `bodySm`/`inkSoft` — the days fragment, unchanged (§1B.16, the comb's clock); **no count line** (a refusal context cannot vouch for a count declaration — consistent with `R-38.9-E`'s fail-toward-silence). The in-code comment carries BOTH causes (mid-rotation joiner pending `O10`; wiring bug) and states they are indistinguishable at the component **by design** — the record discriminates, via the roster row's absence. **`R6` AMENDS: assert that member-without-name reaches the REFUSAL render, not the fallthrough** — otherwise the gate goes on ratifying the substitution. Rides the branch if unmerged, else a follow-up with the `R6` amendment in the same commit. **`R-38.9-G`'s render constraint is NOT this row's — it lands on `1.14` (`ENG-96`)**, and its value-class half is REFUSED (§1B.38.12 §2). **BUILT AND MERGED — `github/main@2adc1b4` (@Pixel).** `R-38.9-F`'s refusal render ships with both causes named in-comment; `R9` rewritten from *returns null* to assert the ruled line, the days fragment, and the absence of both a name and a count, on comment-blanked source; mutation-verified three ways. **Everything above on this row is a record. The row's only open item is `R-38.9-G`'s render constraint, which is `1.14`'s, not this row's.** | — (start now, ahead of 1.6) |
| 1.5 | **Deezine** | `DES-29` — comb-first first run. Sequence with Zero Door (same `App.js` region) **AMENDED §1B.38.12 — the form must bar organizer-as-month-1-subject, or the CTA fails with a check violation.** At comb creation the comb has exactly ONE `comb_members` row (the organizer, via `combs_create_owner_membership`), and `comb_open_rotation`'s roster snapshot excludes the subject. If the organizer names themselves for month 1 the snapshot is **empty** and `ENG-100`'s floor RAISES — `errcode = check_violation`, `constraint = comb_open_rotation_enrollable_floor`. Spec §0's *"two server writes leave the screen"* therefore has a reachable failure on an entirely reasonable choice. ~~Either bar self-as-month-1-subject in the form, or collect a second member before minting.~~ **ONE ARM, RULED — §1B.38.14 (@Lumen, reversing their own spec line 25).** **The month-1 picker at creation BARS SELF — connections only.** Self-as-subject in later months is unbarred; it arrives through rotation order, when the roster is no longer one row. The second arm is dead: at creation the comb has exactly one member, so self-as-subject is not a choice that *can* fail — it **must**, and a form offering a certainly-refused option sells a dead end (the unexpressible-not-merely-unrequested doctrine every `R-38.9` guard was built on). **Decisive ground — there is no recovery path.** The comb row is a **client insert** (`combs_insert_own` is an RLS policy; there is no server-side create function), so it commits independently of the mint RPC. A refused mint therefore leaves a comb with **zero rotations ⇒ zero hives ⇒ absent from every hive-keyed surface**, and no surface owns a re-mint affordance: an invisible stranded object, not a rough edge. **Mint-failure handling (ruled):** the create screen **stays**, re-arms its CTA to retry `comb_open_rotation` with the **same `comb_id`**, and never re-inserts — it is the only surface that knows the comb exists, so it owns the retry. *Retry is safe and here is the fact that makes it so:* `comb_open_rotation` has **no `begin…exception` block** — every failure is a bare `raise`, so the call aborts whole and its `private_hives` insert rolls back with it; a retry never finds a half-minted rotation. **`§5`'s empty-roster sentence survives as an RPC-only backstop.** **Bonus — this bar SATISFIES row `1.17`'s picker constraint for month 1**: connections-only is exactly the restriction that makes the subject's `display_name` readable, so the *"a picker offering non-connected profiles cannot read their names"* hazard does not arise at creation. **Same arithmetic is `O10`'s derivation** (§1B.38.12 §5): month 1's writing roster is the organizer alone in every comb, so every invitee is a mid-rotation joiner for month 1. | **1.4** (comb identity — §1B.10, §1B.11). *Was "— (start now)"; that contradicted §1B.10 and the §8.7 graph. Corrected.* |
| 1.6 | **Deezine** | ~~`DES-21`~~ → **`DES-33`** — the rotation *frame* around the shipped bloom. **Re-estimated XL → S/M**: the bloom is merged at `a02e247`; what is missing is tense (§1B.3). Spec against `GUIDES/POLLINATE_V2_DES21_COLLECTIVE_REVEAL.md`, do not rebuild. **AMENDED §1B.38 — the COMPONENT is merged (`5d4a2ff`, Deezine's `fee5c3442` rebased by @Fizz); the STEP is NOT closed.** `RotationFrame.js` is correct code, but its only mount is the `<RotationFrame>` element in `PackageOpen`, and that screen's feed (`HiveStore.getReceivedPackage:546-591`) queries `.eq('subject_profile_id', …).not('sent_at','is',null)` — **subject-scoped and post-send by construction**, so `sealedAt` is always non-null, `isSealed` is always true, and the **active** branch (*"Writing for {subjectName}"* / *"N days left"* — **the ratified definition of done's own line**) is unreachable there, along with the whole `setInterval` countdown (`:9-22`). The props also have **no producer**: five read sites, zero writers, and `getReceivedPackage` returns no `rotation*` field, so `pkg.rotationSubjectName` is `undefined` and the ternary always takes `From {senderName}`. **The active line's home is the COLLECT surface — the `(g)` header state-line slot — wired by row `1.9` and rendered per row `1.4`; the component itself needs ZERO changes for that mount.** **Plus @Lumen's §1B.38.1 ruling: the sealed state's *"Next month: {organizerName} leads"* is STRUCK, not reworded.** **Component ≠ step.** **NOTHING ON THIS ROW IS OWED BY @Deezine — §1B.38.9.** The merge is `5d4a2ff`; the remote carries `deezine/des33-rotation-frame@fee5c3442` **and** its rebased sibling `ed8906b` (the latter is `5d4a2ff`'s second parent and the one `--is-ancestor` answers true for; `RotationFrame.js` is blob `9a2b04c` at all three). The residue is row `1.9`'s mount and row `1.4`'s render, and the `§1B.38.1` strike rides `1.9`. **Cite this prose, never the bare `1.6` token in a `Depends on` column — that column has no cell that can say *satisfied*.** **AMENDED §1B.38.11 — the source citation in this cell is STRUCK.** It addressed a line range for `RotationFrame`'s countdown effect; `8574f37` moved that construct by five lines with no conflict and no diff on this row. Name the construct: *`RotationFrame`'s countdown `useEffect`*. Per `R-38.9-B` that effect and the component's active return branch are **both deleted** by row `1.9`'s collect-mount commit — after which this row's merged component is the SEALED completion statement and nothing else (`R-38.9-D`). | — (**spec has no dependency; start now** — §1B.11). **The countdown *copy* ships with or after `ENG-91` (1.8a)** — "6 days left" is only true once something happens at zero (§1B.16) |
| 1.7 | **Fizz** | `ENG-59` — invite-link join. **Split at the auth line (§1B.28.4):** the `authenticated`-only `comb_join_by_invite_code()` RPC the schema comment names (`20260830000002:328-337`) is uncontested and builds now; the **anon landing preview** is a NEW function — `comb_member_count` authorizes inside its WHERE (`:426-437`), so a non-member gets **`0`, not an error**, and every ENG-58 definer is `revoke execute … from anon` (`:313-315`, `:405-407`, `:441-443`). **Choice (a) settled** — possession of the code is the authorization — which makes **the code's entropy the entire access control for that read** (§1B.28.4). **Plus §1B.28.1, the real addition:** a **name-collection step between auth and join**. `signInWithOtp` and `signInWithApple` write no `display_name`, `handle_new_user` defaults to **`'New user'`**, and nothing in `src/` ever rewrites it — so without this step every seeded comb renders a roster of `'New user'` and §1B.17's `comb_co_member_names` fix is defeated one layer down. That step is also `COPY-6`'s disclosure seat. **AMENDED §1B.38.13 — this step is the UPSTREAM prevention for the collect surface too, not only the roster.** With no writer of the `profiles.display_name` COLUMN anywhere in `src/` **and no name step on either comb auth path** (@Sage's scope correction, §1B.38.13(a) — the one metadata writer, `HoneycombStore.signUp`'s `options.data.display_name`, is on the email/password branch that `signInWithOtp` and `signInWithApple` both skip), `'New user'` survives signup, and `comb_open_rotation` freezes it verbatim into `private_hives.subject_name` (`nullif` catches only `''`) — so without this step row `1.9`'s member line renders *"Writing for New user"* and `ContributingHive`'s shipped banner already renders *"A hive for New user, from …"*. **Plumbing note (§1B.28.3):** `AuthContext`'s deep-link `useEffect` already runs the `Linking` listener (`getInitialURL` + the `'url'` subscription) and drops non-callback URLs in `handleUrl`'s `isAuthCallbackUrl` guard — extend `handleUrl`, do not build it. **AMENDED §1B.38.12 — address struck, construct named** (§7; the range was still correct at `main@e94a27a` when I re-derived it, and is struck anyway — a correct citation in a growing file is one that has not drifted *yet*). | 1.1, 1.3 |
| **1.7a** | **Fizz** | **`ENG-93` — create a comb.** NEW (§1B.29). The organizer half of the model: create screen, the shared `comb_open_rotation()` definer mint, and the **organizer's** name-collection mount (Lumen, `4fdd39e2…`). **Build it with 1.7** — they share the name-collection component. **`DES-29` designs it; nobody built it**, and Phase 3.1 cannot seed a comb without it | 1.1, 1.3 — ~~`ENG-92`~~ **removed §1B.30**: a `security definer` mint bypasses the WITH CHECK that `ENG-92` Part 1 deletes |
| 1.8 | **Bumble** | `OPS-9` — `pg_cron` rotation scheduler. **The tick advances state; it cannot seal — it calls `ENG-91`** (§1B.14). **§1B.31: the tick has a SECOND half and it is unbuilt** — `advance_due_rotations()` (`32bdd74`) resolves due rotations and *opens nothing*, so a comb ends after one month and `C1`/`C3` cannot be measured. The resolver half **merges as written**; the row is **partial, not done**, until the tick **resolves then advances** in one pass — **§1B.31.2: that order is the only one the schema permits** (`comb_rotations_one_open_per_comb` `:495-496`; advance-before-resolve is `23505`, probed) and the two steps must sit in **SEPARATE `begin…exception` blocks**, or a raising advance rolls back the committed seal and the tick re-seals-and-re-fails every five minutes forever. **§1B.31.1 CORRECTS the edge: dep is `1.9a` (`comb_advance_rotation`), NOT `1.7a`** — routing 1.8 straight at `ENG-93` while 1.9 depends on 1.8 was a CYCLE. **ACCEPTANCE ADDED §1B.36.19: this row inherits the CLOCK-BOUNDARY pair** (moved off `1.9a`, which could not run them). In `check-ops9-rotation-scheduler.mjs`, with the second block built: **row 2** — tick with the floor intact → `warnings` contains **no** match; **row 3** — tick with the floor stripped → `warnings` **does** match, the **positive control**. **Undeletable pair, with the in-gate comment saying so** — row 3 is the only thing separating *the floor held* from *nothing ran*, and row 2 alone is green on a tick that never advances. Runnable here because `1.9a` is already a dep. **MERGE-TIME REQUIREMENTS ADDED §1B.36.24 — this branch is 11 behind `main`, so its gate set is a snapshot of a stale merge-base:** (i) `OPS-11` landed inside the gap and `check-share-visibility` now asserts a catalog-wide `EXPECTED_DEFINER_GRANTS` map whose rule is *“no row at all is also a failure”* — `advance_due_rotations()` is `security definer` with **no row**, so it reds on merge until one is added; (ii) `…0005` now sorts **below** `main`'s `0006`–`0010` — **renumber to `…0011`** (the target moved once already tonight, so re-read `main` at rebase time rather than reusing this number); (iii) re-derive **then** re-count — whatever `npm test` says on that tip is scoped to a suite three gates behind. **STILL PARTIAL AT `github/main@5d4a2ff` — §1B.38, and nothing in the merge says so.** The merged `…0012`'s per-rotation loop body called `seal_and_send_rotation` **and nothing else**; all five `comb_advance_rotation` occurrences in that file were **comments**, including a `perform` inside the header block that three separate readers took for code. *(Record, pinned at `github/main@5d4a2ff`; its addresses struck per §1B.38.12 §7.)* **The header's deferral premise (`:26-29`, *"comb_advance_rotation doesn't exist on main yet"*) was FALSE by merge time** — `git merge-base --is-ancestor 6d2d3b0 182b9f6` returns true, so `1.9a` was on `main` **one commit earlier**. **And the §1B.36.19 CLOCK-BOUNDARY PAIR MERGED MISSING:** `check-ops9-rotation-scheduler.mjs` has zero `comb_advance_rotation` references, its header (`:14-32`) enumerates no advance row, and its only `warnings.some` is the seal block's own control at `:389`. **FINISHER — fully specified, unblocked today, small:** a **second** `begin…exception` block *after* the seal block (never inside it, §1B.31.2), `perform public.comb_advance_rotation(v_comb_id)` with `comb_id` read off the resolved row, `raise warning '… %', v_comb_id, sqlerrm` **with `sqlerrm`** (§1B.36.12 — the interpolated message string is the only channel row 3 can key on), **plus rows 2 and 3**. Dormancy will not spam the tick log: `…0011:258`'s `if v_enrollable_count < 2 then` returns **null, quietly, raising nothing**. Merge-time requirement (i) is now **satisfied** (`advance_due_rotations()`'s `EXPECTED_DEFINER_GRANTS` entry in `check-share-visibility`, `roles: ['service_role']`); (ii)'s renumber is **spent** (`…0012`). ~~**Until this lands, step 8 of the ratified sentence — *"and do it again next month for someone else"* — has no server path and `C1` has no data.**~~ **ROW CLOSED §1B.38.12 §7 — THE FINISHER IS MERGED AND THIS CELL WENT ON ORDERING IT.** Re-derived at `github/main@e94a27a` (unchanged at `2adc1b4`, which touches only `RotationFold.js` and `check-comb-identity.mjs`): `…0012` now carries `perform public.comb_advance_rotation(r.comb_id)` as **executable code**, in a second `begin…exception` block after the seal block (§1B.31.2's separate-failure-domain requirement, honoured), and `check-ops9-rotation-scheduler` carries **six** `comb_advance_rotation` references including the §1B.36.19 clock-boundary pair — the floor-intact negative *and* its positive control, the undeletable pair. **Step 8 has a server path and `C1` has data.** Everything above this sentence is a **record**; nothing in it is owed. | 1.1, **1.8a**, **1.9a** |
| **1.8a** | **Sage** | **`ENG-91` — server-side seal + send.** NEW (§1B.14). Today all three of `seal_hive`/`seal_volume`/`send_hive` require `auth.uid()` = the hive's owner, so a rotation can only complete if the organizer taps. **On the longest chain: `ENG-58` → `ENG-91` → `ENG-60`.** Semantics pinned in **§1B.16** — seal-and-send, idempotent, membership-authorized, empty rotations void rather than deliver. **Plus §1B.24.1 (c)/(d):** refuse a tombstoned subject at mint, and void-and-advance a subject tombstoned mid-month — `send_hive`'s guards do not catch either. **(c) SUPERSEDED ON ROUTING, upheld on substance (§1B.29.2a):** `ENG-91` shipped one function, `seal_and_send_rotation`, and it does not mint. The mint gate moves to `ENG-93`'s `comb_open_rotation()`. (d) is unaffected and landed. **Plus §1B.25.2 as amended by §1B.26.1:** ship `coalesce(nullif(p.display_name, ''), 'A writer')` (token ruled by Lumen) as a **backstop** — the live pre-seal path cannot fire it, because `delete_own_account()` deletes the unsealed entry outright. **Plus §1B.26.3, which is the real work:** void-and-advance distinguishes **three** states — sealed, quiet month, and **departed** (zero entries because the only writers deleted their accounts) — or C1 cannot tell a healthy comb from a failing one. **Plus §1B.27.3, two lines that are cheapest here:** (a) the fused seal **does not open a successor volume** for a rotation hive — `seal_volume`'s successor insert (`20260828000001:60-61`) is what leaves a sealed month writable, and skipping it restores the 42501 three shipped client sites already expect; (b) it **must still write `private_hives.sealed_at`**, the mirror `20260826000004:138-153` keeps alive for five client reads that have never been re-pointed | 1.1 |
| **1.9a** | **Fizz** | **`comb_advance_rotation(p_comb_id)`** — NEW, carved out of `ENG-60` (§1B.31.1ii). The server-side **advance policy**: next subject (`comb_members` by `joined_at`, wrapping, skipping `removed_at`/tombstoned seats and **nobody else**), next `closes_at` (`closes_at + k·cadence`, first future boundary, **floor of half a cadence** — §1B.31.1iii), then call `ENG-93`'s `comb_open_rotation()`. **`service_role` only** (Lumen — an `authenticated` grant is an unruled organizer force-advance). **No eligible subject = DORMANCY, raises nothing** (§1B.31.2iv) — otherwise a departed comb is the permanent-stall trigger. **§1B.31.3: the derived advance needs ≥2 ENROLLABLE MEMBERS** — `removed_at is null` AND `profiles.deleted_at is null`, **adopted from `ENG-100`'s predicate, never re-implemented** (§1B.36.10; @Lumen's coupling pin, R12 adopt-don't-copy). A floor that counts a different population from the mint it green-lights green-lights a month with zero contributors (a roster of one yields a subject with no possible author → guaranteed quiet void); month 1 is exempt because its subject is organizer-chosen and may be a non-member. **Dormancy needs an EXIT** — the tick also probes combs with no open rotation, **but only those with ≥1 RESOLVED rotation**, or it mints month 1 over the organizer's own choice mid-create-flow. Carved out because `ENG-60` depends on `OPS-9` and `OPS-9` needs this — leaving it inside `ENG-60` is a dependency cycle. Ordering goes in a **function**, not inlined, per §1B.31.1iv. **ACCEPTANCE ADDED §1B.36.20 + §1B.36.21 — read both before building.** (a) **In-body pre-launch dormancy:** *no resolved rotation* returns **quietly**, in this function, not only in the tick's `WHERE` — the derivation is UNDEFINED without a prior rotation (no subject cursor, no base `closes_at`), and this function has two direct callers that are not the tick's `SELECT`. Comment carries the **mechanism** *and* the **hazard** (a `now()` fallback would silently mint month 1 over the organizer's choice, §1B.31.3(i)) — otherwise the silence reads as unfinished. (b) **Its gate is a 2×2 with ONE green cell, all three runnable at this row's landing via a direct `service_role` call, sharing ONE base varying one axis:** **A** (1 enrollable, ≥1 resolved) → no row, no raise; **B** (2, ≥1 resolved) → **a row appears, the shared positive control**; **C** (2, no prior) → no row, no raise. A and C each differ from B on exactly one axis; neither negative substitutes for the other. **PLUS §1B.36.25 — MONTH 1'S BASE, ~4 LINES, AND IT DELETES CLIENT WORK.** `comb_open_rotation`'s `p_closes_at` becomes `default null` and derives `now() + c.cadence` from the comb row the function already selects; an explicit argument is honoured **only when `auth.uid() is null`** (`service_role`, i.e. this function's own advance) and a real session's argument is **ignored, not floored**. Today the parameter is unchecked in the live body (`…0010:66-155`), unconstrained on the column (`…0002:474`), and a past value is not an error but an **immediate void of month 1** (`…0009:129-131`) — the one state `C1` cannot afford to confuse with a quiet month. The client stops computing a timestamp entirely; `DES-29` keeps cadence as a visible choice. Lands here rather than on merged `ENG-93` because **this row already owns every other boundary in the clock** (`closes_at + k·cadence`, the half-cadence floor) and one clock belongs in one ticket. **Gate:** derive-when-omitted (positive) and ignore-an-explicit-past-value as `authenticated` (negative) in ONE fixture, one axis apart | 1.1, **1.7a** |
| **1.7b** | **Fizz** | **`ENG-100` — the mint's roster hole + empty-snapshot refusal.** NEW (§1B.36.9). **Rides `ENG-94`'s `create or replace` of `comb_open_rotation`; SEPARATE acceptance** — `ENG-94` is titled *subject-gone repoint* and is done when the SUBJECT line is repointed, so the roster requirement dies with it if folded in (§1B.36.9). **Full consolidated acceptance at §1B.36.18 — build from that block, not from the six sections that produced it.** Two lines: (1) the roster snapshot excludes tombstoned CONTRIBUTORS via a general predicate (`not exists … p.deleted_at is not null`), written as the general rule, NOT *"exclude the organizer"*; (2) `get diagnostics` the snapshot's `row_count` and refuse at zero, `using errcode = 'check_violation', constraint = '<name>'` (§1B.36.12/.13/.14). **Month 1 is EXEMPT from §1B.31.3's floor, so the mint is the only place an empty writing roster is observable** — 1.9a's floor does not cover this and cannot. **CLOSED §1B.36.24 — landed on `github/main@52a9733`**, verified independently (50 gates, 0 FAIL, 1,690 assertions, `rev-parse HEAD` confirmed in the same shell). **The near-miss is the part to carry:** the branch was **6 behind `main`** and `…0010`'s `create or replace` of `comb_preview_by_invite_code` was derived from `…0006`'s body, so merging it would have **reverted `ENG-92` Part 6** — reproduced at 18/18 on `main` vs 17/18 on the merge commit. **Standing requirement for every migration on this table: a `create or replace` must be re-derived from the HIGHEST-NUMBERED prior definition at MERGE time, never at authoring time**, and the full suite runs on the merge commit with the per-gate `FAIL` lines read, never `$?` | **1.7a**, and lands in `ENG-94`'s migration |
| 1.9 | **Fizz** | `ENG-60` — the rotation loop: ~~open~~ → notify → collect → seal → reveal. **The `open` half is now row 1.9a**; this row is the client loop. **ACCEPTANCE ADDED §1B.38 — two lines this row now owns that no other row does.** **(1) The COLLECT MOUNT for `RotationFrame`.** Row `1.6` shipped the component into the reveal screen, where its active state cannot fire (subject-scoped, post-send). *"the comb is writing for Sarah — 6 days left"* is a **step of the ratified definition of done**, and it renders only off an **open-rotation** read on the collect surface — that read is this row's. The component takes `subjectName`/`closesAt`/`sealedAt` unchanged; what is missing is the query and the mount. **(2) Ride @Lumen's §1B.38.1 strike:** delete `RotationFrame`'s *"Next month: {organizerName} leads"* block, the `organizerName` prop in its signature, **and** its pass-through in `PackageOpen`'s `<RotationFrame>` element — a rendered future is licensed only by an existing rotation row, and `getReceivedPackage` carries none. ~~**THE `MOCKUPS_DES33.md` CENSUS (§1B.38.2 + §1B.38.4) — nine sites in container 3, twelve across containers 1–3, 23 across all four.**~~ **EXECUTED BY @Fizz INSIDE `8574f37`; STRUCK FROM THIS CELL §1B.38.12 §6.** The census stood on four token classes — the rendered STRING, the SYMBOL that supplies it (`organizerName`), the TICKET it defers to (`COPY-13`), and the spec ITEM's own section title. All four are clear at `main@e94a27a`: the props list names the strike, the future-rotation line is an affirmative refusal, the `✅ … + next rotation preview` render PERMISSION under the *Locked* Design-Constraints heading is gone, both pre-arguing sentences (*"likely should be next subject, not organizer"* / *"supports either with no changes"*) are gone, and the `Notes for Future Updates` heading's `COPY-13` deferral is dropped. The file went 184 → 176 lines, so **every line number this cell used to carry is stale** and all of them are struck. **One residual, and it is the terminus an image always is:** the device screenshots still render the retired line, and are now annotated in place rather than pretended away — **re-shoot them before using them to describe the sealed state.** **SCORING CAVEAT: row `1.8` is genuinely partial, so this row can be BUILT and MERGED but cannot be SCORED done against the full sentence** — clause 8 needs the `OPS-9` finisher, which is not this row's to build. **SUPERSEDED ON LIVENESS 2026-08-31: `1.8` merged (`6d3e54a`) and `C1` has a server path, so clause 8 is now scorable here too.** **LINE (1) IS AMENDED §1B.38.9 — DO NOT MOUNT `RotationFrame` ON COLLECT UNTIL @Lumen RULES.** *"the component takes `subjectName`/`closesAt`/`sealedAt` unchanged"* is **false for the subject's own view of that surface**: `RotationFrame` has no subject/member axis, so it renders *"Writing for «her own name»"* to the subject (`§1B.9` / `§1B.36.5` forbid it), and withholding `subjectName` hits `RotationFrame`'s `if (!subjectName) return null` guard, which **takes the countdown with it**. Row `1.4`'s unmerged `pixel/des22-comb-identity@da8b303` already ships `RotationFold` with exactly that `variant` axis and the same two rendered lines. **Line (2), the `§1B.38.1` strike, is correct under either ruling and is unblocked — build it now.** **LINE (1) GAINS A THIRD ARTIFACT — §1B.38.10.** My §1B.38.9 recommendation (`RotationFold` for collect) hands this row an **unbuilt `closes_at`→`daysLeft` computation with nothing shared to call**: `RotationFold` takes `daysLeft` as a prop and contains no day-math despite its header claiming to own it, and `src/` has no exported days-remaining helper — only `daysSinceHiveCreated` (exported from `src/constants/hivePrompts.js`, **`Math.floor`**, elapsed) against the **`Math.ceil`** inside `RotationFrame`'s countdown effect. Mirroring the house helper renders *"6 days left"* where the reveal header renders *"7"*, on the sentence Colin ratified by its number. **Build one home: lift the body of `RotationFrame`'s countdown effect into an exported pure `daysUntil(closesAt, now = Date.now())` (`ceil`, clamped at 0, injectable `now` per the house convention); `RotationFrame` calls it from its existing `useEffect`, `RotationFold`'s caller calls it directly. Gate row: exactly one `closesAt`→days computation in `src/`, and it ceils** — `ceil` is the ratified direction because any remainder under a day floors to `0`, and a rendered *"0 days left"* on an open rotation reads as closed (§1B.16 gives zero to the clock, not to copy). **Owed under EITHER component ruling, so it is not held** — unlike the mount itself. **AMENDED §1B.38.11 — LINE (1) IS UN-HELD, AND ITS COMPONENT, ITS QUERIES AND ITS SOURCE ARE ALL RULED.** @Lumen's `R-38.9` (2026-08-31): **`RotationFold` owns the collect mount; `RotationFrame` keeps the reveal in its SEALED form only.** Build all of the following in ONE commit (`R-38.9-B` — the ratified sentence must never have zero or two live writers): (a) mount `RotationFold` on the collect surface, variant by reader; (b) **delete `RotationFrame`'s active (unsealed) return branch AND its countdown `useEffect` — both, not one** (post-ruling the active branch has no reachable mount); (c) **extract the day-math** per `R-38.9-C` + §1B.38.10 — one exported pure `daysUntil(closesAt, now = Date.now())` (`Math.ceil`, clamped at `0`, injectable `now` per `daysSinceHiveCreated`'s house convention) wrapped by `useDaysLeft(closesAt)`; **the pure core is required, not stylistic — a hook cannot be asserted outside a renderer, so without it the gate row is unwritable**; gate row = exactly one `closesAt`→days computation in `src/`, and it ceils. **`RotationFold` stays presentational — it takes `daysLeft` as a prop; the CALLER calls the hook.** **SOURCE ADDRESSES STRUCK AND REPLACED (§1B.38.11 §2 — seven citations in these rows were voided by `8574f37`, two of them pointing at code this row had ordered deleted).** Name the construct, never the line: *`RotationFrame`'s countdown `useEffect`*, *its `Math.ceil` day computation*, *its `if (!subjectName) return null` guard*. `§1B.13`'s citation ban now extends to source addresses in row cells. **THE COLLECT READ IS TWO QUERIES, NOT ONE (§1B.38.11 §4).** The subject is REFUSED `private_hives` pre-send (`private_hives_select_as_subject` is `sent_at is not null`), so she reads `comb_rotations.closes_at` (permitted — `comb_rotations_select` is `is_comb_member`) + `comb_member_count`, and **her mount must declare `countKind: 'size'` explicitly** (the prop defaults to `'writers'`, and `R-38.9-E` resolves any non-`'size'` declaration to `null` — an omitted `countKind` silently drops her size sentence). The member reads `private_hives.subject_name` + `comb_rotation_writer_count`. **`subjectName`'s SOURCE IS RULED: the frozen `private_hives.subject_name`, never a live `profiles.display_name` join** — the live read is refused (`profiles_select_connections` is connection-scoped, which is why `comb_co_member_names` is a definer), and the mint already backstops the frozen column with `coalesce(nullif(v_subject_display_name, ''), 'Someone')`. **@Lumen owes a copy ruling on `'Someone'` rendering as *"Writing for Someone"*.** **BLOCKER RAISED — `O10` blocks this row's first screen.** `private_hives` select is `owner_id or is_hive_contributor(id)`, and `comb_open_rotation` snapshots `hive_contributors` at MINT — so **a member who joined MID-ROTATION passes `is_comb_member` (reaches collect) and fails `is_hive_contributor` (cannot read the subject's name)**. Today `RotationFold` renders that person the SUBJECT's branch: no name, no count, one `bodySm` fragment. `O10`'s answer decides the fix — writes-next-month ⇒ a stated waiting state (Lumen's copy); writes-this-month ⇒ `comb_join_by_invite_code` must also enroll into the open rotation's `hive_contributors`, which is a SCHEMA change and not this row's. **Do not wire the member mount until `O10` is answered.** **SCOPED ADDENDUM §1B.38.13 (@Sage's sequencing call, adopted) — binds the HELD member-mount half ONLY, deliberately not a `Depends on` entry:** when the member branch is wired it **imports row `1.14`'s exported placeholder-class helper**; it does not inline-check a literal. **The word it must catch is `'New user'`, not `'Someone'`** — `handle_new_user` writes `'New user'` for every magic-link/Apple signup that carries no metadata name, **`src/` contains no writer of the `profiles.display_name` COLUMN and no name step on either comb auth path** (§1B.38.13(a)), and the mint's `coalesce(nullif(v_subject_display_name, ''), 'Someone')` passes a non-empty `'New user'` through **verbatim**. So the member branch's live failure is *"Writing for New user"*, and `'New user'` **is** in the helper's class (§1B.35.3(b)). `'Someone'`'s own render guard stays a client-constant backstop (§1B.38.12 §2). **Build order, not a blocker: `1.14` before the member mount.** The subject path, the `RotationFrame` strike and the `daysUntil`/`useDaysLeft` extraction touch none of this and stay unblocked. **AMENDED §1B.38.12 — (a) THE SOURCE ADDRESSES IN THIS CELL ARE NOW ACTUALLY STRUCK.** §1B.38.11 DECLARED the replacement and never performed it; all of them were still here. Eleven across rows `1.4`/`1.6`/`1.9`, not the seven that section censused — my grep was keyed on `RotationFrame.js` and missed `hivePrompts.js` and `PackageOpen.js` entirely. Construct names throughout; `§1B.13`'s ban on line citations extends to source addresses in cells, firing **at authoring** (@Lumen). **(b) THE `MOCKUPS_DES33.md` CENSUS IS EXECUTED — struck from this cell, not pending.** @Fizz did it inside `8574f37`: the `✅ On sealed: completion statement + next rotation preview` permission under `## Design Constraints (Locked …)` is gone, the props list cites `§1B.38.1`, both pre-arguing sentences are gone, and the heading's `COPY-13` deferral is dropped. The screenshot container — the terminus no strike reaches — is **annotated in place** rather than pretended away. The file went 184 → 176 lines, so every address the cell quoted is stale. **One residual: the device screenshots still render the retired line and need re-shooting** before they are used to describe the sealed state. **HELD ITEM ADDED §1B.38.15 — THE SEALED BRANCH INHERITED NONE OF `R-38.9`'s AXIS.** `R-38.9` deleted `RotationFrame`'s ACTIVE branch and built the subject/member axis into `RotationFold`. The **surviving** sealed branch renders **"You received {subjectName}'s journal"**, and its only mount is `PackageOpen`, whose read (`getReceivedPackage`) filters `subject_profile_id` = the caller — **so it names the subject to the subject: the exact §1B.9 / §1B.36.5 class this cell already ruled for the active branch.** `DES-33`'s own sealed layout contradicts it four lines down (*"4 people wrote this for you."*). **LATENT, NOT LIVE — `pkg.rotationSubjectName` has NO producer in `src/`**: the identifier appears exactly twice, both inside `PackageOpen`, and no `HiveStore` mapper emits it — so `RotationFrame` never renders on the reveal today and the comb reveal carries no rotation tense at all. **Fix it before the producer ships and no user ever sees it** — third payoff of the cheap-ordering shape (§1B.38.14). Copy is @Lumen's (`COPY-6` / `DES-33`); note that **withholding `subjectName` is not the fix** — it hits the same `if (!subjectName) return null` guard, which returns null for the **whole component**, so the reveal loses its entire rotation tense and is indistinguishable from a 1:1 package. A second-person rewrite is. **COST CLAUSE CORRECTED §1B.38.16 — it originally read *"takes 'Rotation Complete' and the date range with it"* and BOTH nouns are wrong.** `"Rotation Complete"` appears **nowhere in the repository** outside my own two ruling texts — the sealed branch is one `View` holding one `Text`. The date range is `MOCKUPS_DES33.md`'s future-note 2, which says in terms that it is *"a separate render beyond the state-line slot, not part of DES-33"*. I described the component from the spec's layout diagram instead of from the file. **The conclusion survives on the guard mechanic alone, which is the cheaper argument anyway.** **`R-38.9-H` RIDES THIS LINE (@Lumen, §1B.38.15/.16):** the sealed label becomes **"Written for you"**, same file and same commit as the active-branch strike, one writer per `R-38.9-B`. **AND ALL THREE PROPS DIE, NOT ONE (§1B.38.16).** @Lumen routed `subjectName` and its guard out; run it one step further. Post-strike `closesAt` has no reader (the countdown effect leaves with the active branch, into `useDaysLeft`), and `sealedAt`'s only reader is the `isSealed` branch selector — with one branch left there is nothing to select. `RotationFrame` reduces to a constant string; take all three props and the guard in the same commit. **No gate asserts on `RotationFrame` — `scripts/` names only `RotationFold`** — so nothing goes red to tell you a prop was left behind. **And the replacement discriminator is equally unbuilt:** `rotationClosesAt` and `rotationSealedAt` have no producer either — all three `rotation*` fields occur only inside `PackageOpen`, zero mappers emit them — so keying the mount on them instead of the name is a **behavioural no-op today** (both are `undefined`, both falsy, nothing renders either way). Correct in shape, and it must not be read as *those fields exist*. When the mapper ships, `PackageOpen`'s mount decision becomes the ONLY consumer of the rotation fields, so it is a **class** question — *is this package a rotation?* — and the field it keys on has to be one whose presence means exactly that. **Blocks neither line (1) nor line (2) of this row.** **GATE-ROW RIDER §1B.38.17 (@Lumen's ask, adopted with its key corrected and its half named): the *exactly one `closesAt`→days computation in `src/`, and it ceils* row RIDES THE STRIKE COMMIT** — it is unwritable until `RotationFrame`'s countdown effect dies, and a row written before it can go red gets stranded in a later ticket (§1B.36.19's clock pair). **Name the half: the effect leaves with the ACTIVE-BRANCH STRIKE, which is in the UNHELD subject-path commit — this row does not wait on `O10`.** **Key the gate on the INPUT, not the operation:** `src/` computes days from a ms delta in FIVE places at `2adc1b4` and four are not rotation code — `daysSinceHiveCreated` and `prompts.js` **floor**, `CoreRitual`'s seniority and `dateRanges.js`'s gap **round** — so a day-math-keyed gate reports 5, goes red on the commit it rides, and gets loosened. Scoped to `closesAt` the census is exactly one before and one after. **And the day constant has two disjoint spellings:** `useDaysLeft`/`RotationFrame` use `1000 * 60 * 60 * 24`, all four others use `86400000`, so a literal-keyed gate never sees the site it is about. Assert on `daysUntil`'s exported body plus the ABSENCE of any other `closesAt`-fed conversion in BOTH spellings, and count **conversions, not occurrences** — the mount itself adds a `useDaysLeft(closesAt)` mention and `useDaysLeft.js` carries the identifier eight times. **SIZING NOTE ON LINE (1)(a) — §1B.38.17 §3: THE COLLECT SURFACE DOES NOT EXIST.** This cell says *"what is missing is the query and the mount"*; that is complete only if the screen is already there. Verified at `2adc1b4` in `src/`: **`RotationFold` has ZERO importers** (its only outside references are `check-comb-identity.mjs` and one comment), **`CombIdentityCluster` has ZERO importers**, `src/screens/` holds no comb screen, and the navigator registers `Today`/`Hive`/`Garden` with no comb route. @Fizz's *"nothing real to wire into"* had the wrong ticket on it (`ENG-98` is row `1.16` and owns no collect read, @Lumen) — **removing the ticket does not remove the thing**. `ENG-60` is *"the rotation loop … collect …"*, so the collect SURFACE is most plausibly this row's, which makes it materially larger than *"the query and the mount"* reads; @Sage owns the routing call. **Component-complete reads as built the way schema-complete does — score a client surface by its ROUTE, not by its components.** | 1.1, ~~1.6~~ (**satisfied at `5d4a2ff`** — §1B.38.9), **1.8a**, ~~1.8~~ (**merged `6d3e54a`**), ~~**1.9a**~~ (**merged `6d2d3b0`**), **1.4** (new — the collect line's component ruling) |
| 1.10 | **Lumen** | `COPY-6` — comb + rotation copy | 1.4 |
| 1.11 | **Pixel** | `DES-34` — the mascot's sitting motion (Colin `a478c335…`, §1B.5) | — (parallel; **gates nothing**) |
| 1.12 | **Pixel** | `DES-35` — glass prominence to ≥23% (Colin `a478c335…`, §1B.5). **Material prerequisite merged** — `13cf806` + `cdb07a1` are ancestors of the tip (§1B.7) | — (parallel; **gates nothing**) |
| 1.13 | **Pixel** | `DES-36` — make the existing in-reveal nectar door findable (§1B.5). **Not** superseded by `ENG-90` | — (parallel; **gates nothing**) |
| **1.14** | **Fizz** | **`ENG-96` — the subject-name mappings + the placeholder-class helper.** NEW ROW (§1B.38.12 §3 — this ticket has been cited by four rulings since §1B.35 and has never had a row). **Two fixes, not one (§1B.35.2)** — ~~(1) `listReceivedPackages`/`getReceivedPackage` — live-first, readable by `profiles_select_own`, the subject reads her own name, and it heals~~ **FIX (1) STRUCK §1B.38.16 — it has ZERO rendered consumers, and one of its two halves never had any.** `getReceivedPackage`'s `subjectName` mapping is unconsumed at `2adc1b4` and was unconsumed **before** `R-38.9-H`: `PackageOpen` never destructures `pkg` and reads exactly `coverTheme`, `senderName`, `isCollective`, `contributorNames`, `entries` and the three `rotation*` fields — `pkg.subjectName` occurs nowhere in the file. `listReceivedPackages`' `subjectName` has exactly one consumer, this screen's row subtitle, and `R-38.9-H` rewrites it to *"A hive for you"* — **a string with no name slot.** So the repoint changes the provenance of a value nothing renders, on both halves. **`ENG-96` is therefore ONE fix, plus the helper, plus the four strings.** (2) the contributor- and owner-scoped mappings — **`subject_name` STAYS the source**, do NOT add a `profiles` join, because a live-preferring branch degrades to `'Someone'` for the modal comb writer and hides an authorization failure inside a name resolver. **Ships the ONE exported placeholder-class helper** that `1.15`/`1.16`/`1.17` import rather than reimplement (§1B.35.3(b)); class members are **exactly** `''` and `'New user'`, branching on the VALUE. **`'Someone'` is NOT a member — §1B.35.2 rules it the AUTHORIZATION word (*"I am not permitted to read this person"*), and widening the class would reclassify 22 live-read sites across 6 files.** **`R-38.9-G` (@Lumen) lands here as a RENDER constraint only:** a stored `'Someone'` must never print embedded — *"Writing for Someone"* reads the capital as a proper noun and turns a backstop into a false name claim (§1B.35.3's per-SENTENCE rule). Render from a client constant, lowercase generic; final string is COPY-6's; the *writing-for* structure and the countdown are untouched. **This is a BACKSTOP, not the fix** — the fix is `1.17`'s never-freeze-a-placeholder at the mint. **AMENDED §1B.38.13 — the reachable word is `'New user'`, and `R-38.9-G`'s motivating value is the rare one.** `'Someone'` enters `subject_name` only when `display_name` is `''` or the profile row is missing; **the one documented producer of `''` is `delete_own_account`'s tombstone (`ENG-84`/`ENG-92`), and `comb_open_rotation` refuses a tombstoned subject via `comb_subject_gone` BEFORE the mint** — so `'Someone'` is close to unreachable in that column. `'New user'` is the opposite: written by `handle_new_user` on **every magic-link or Apple signup** — the two paths `ENG-83` (row `1.3`) builds and the only two that pass no metadata name — never rewritten (**no writer of the `profiles.display_name` column in `src/`**; §1B.38.13(a)), and frozen verbatim by the mint because `nullif` only catches `''`. **The render constraint's consumer set is therefore larger than `RotationFold` and already SHIPPED:** `ContributingHive`'s *"A hive for {subjectName}, from {ownerName}"* banner and `ComposeHiveEntry`'s *"What's something you're grateful for about {subjectName}?"* both read the frozen column on the contributor-facing path, and both render the placeholder embedded today. **The upstream prevention is row `1.7`'s §1B.28.1 name-collection step; the source fix is `1.17`(a)+(b);  **COPY-6 IS FINAL — §1B.38.15 (@Lumen, 2026-08-31); these strings BIND this build.** (i) `RotationFold`'s member line, placeholder-class subject → **"Writing for someone"** — lowercase, the house shape `NectarConsentSheet` already ships (`{senderName \|\| 'someone'}`); (ii) `ContributingHive`'s banner **subject slot** → **"A hive for someone, from {ownerName}"** — subject slot ONLY; the owner slot is `1.15`'s, and 1:1 hives keep capital `'Someone'` there as the honest permission word (§1B.35.2); (iii) `ComposeHiveEntry`'s title → **"What's something you're grateful for about this person?"** — antecedent-free, because the screen cannot vouch for a name it could not read. The `2adc1b4` refusal state is unchanged, no rewording. **Gate row: the helper-classified branch renders the CONSTANT, never the stored value.** **A FOURTH SITE — ADDED §1B.38.15 — AND IT NEEDS A DIFFERENT STRING.** `ReceivedPackages`' row subtitle *"A hive for {subjectName}"* reads the same value on **the subject's own inbox**: `listReceivedPackages` filters `subject_profile_id` = the caller, so **the reader IS the person the slot names**, and (ii)'s third-person *someone* is wrong there by construction. A second-person string is owed by @Lumen under `COPY-6`; *"A hive for you"* is the obvious candidate and is not mine to rule. **AND FIX (1) DID NOT REMOVE THAT SITE FROM THE CLASS — it moved it from frozen to live and left it in.** *"the subject reads her own name, and it heals"* is a claim about a **rename**. `profiles_select_own` SUCCEEDS and returns `'New user'` — **a fallback value is exactly as live as a chosen one**, so live-first heals staleness, never absence. **SUPERSEDED §1B.38.16 — `R-38.9-H` closes this site by DELETING THE NAME SLOT, not by repointing it, so fix (1) is struck above and the order that rode on it is WITHDRAWN: ~~this row's gate needs a live-read case, not only a frozen one~~ — there is no live read feeding a render anywhere on the subject's path, so the gate has no live-read case to assert.** The gate row is unchanged: the helper-classified branch renders the CONSTANT, never the stored value. **The *fallback-is-as-live-as-a-chosen-one* rule is UPHELD and binds wherever a live read still feeds a render** — it is the contributor- and owner-scoped mappings of fix (2) that it now governs, and fix (2) already refuses the live read for a different and stronger reason. | 1.1 |
| **1.15** | **Fizz** | **`ENG-97` — `ownerName` takes the same class filter** (§1B.35.3). NEW ROW (§1B.38.12 §3). Zero schema change; both functions already exist. **Imports `1.14`'s helper; does not reimplement it** (§1B.34.5: *"one predicate, N callers"* is a claim about CALL SITES — the gate asserts the calls, not the answers) | **1.14** |
| **1.16** | **Fizz** | **`ENG-98` — chapter labels + the comb card take the class filter.** NEW ROW (§1B.38.12 §3). Imports `1.14`'s helper | **1.14** |
| **1.17** | **Lumen** | **`DES-38` — what a comb surface calls a subject who has no self-chosen name, and the mint's never-freeze-a-placeholder rule.** NEW ROW (§1B.38.12 §3). **Point 4 is SOLE-SOURCE, not a nicety (§1B.35.2(a)):** for four of the six mappings the organizer's typed word is the only word any writer will ever see, because the live read is refused. Two parts, both cheap: **(a) never freeze a placeholder** — when the subject's live name is placeholder-class, `DES-29`'s picker collects an organizer-typed word and the mint writes THAT; **(b) re-copy at every mint** — month N+1's `comb_open_rotation` re-reads `display_name`, so a rename heals at the next rotation with no job, no refresh path, no schema change. Together these make `'Someone'` unreachable in `subject_name` at the source, which is why `1.14`'s render guard is a backstop. Real ordering is **self-chosen name > organizer-typed name > system default**; the mint today writes the system default into the organizer's column. **Design constraint delivered before `DES-29` is built:** a picker that lets the organizer choose a NON-connected profile cannot read that person's name either — it needs its own name source (a definer in the `comb_co_member_names` shape) ~~or restriction to connections~~, else it renders a list of `'Someone'`. **ARM CLOSED §1B.38.14(a) — @Lumen's `DES-29` ruling settled it: the month-1 picker is CONNECTIONS ONLY**, which is the restriction arm, so this constraint is **satisfied, not owed**, for the only picker that exists. There is no month-N picker — `comb_advance_rotation` derives later subjects from rotation order server-side — so the definer arm has no consumer and is **not** to be built speculatively. Re-open this only if a picker is ever added for a later month | 1.1, **1.5** |
| **1.18** | **Lumen** rules / **Pixel** renders | **`DES-39` — the organizer's shelf composition.** NEW ROW (§1B.38.12 §3); previously it existed only inside row `1.4`'s prose. `listHives` is owner-scoped with **no comb filter** and the mint sets `owner_id` to the organizer, so **every comb month becomes a separate hive card on the organizer's own shelf** — a twelve-month comb puts twelve there, indistinguishable from hand-made hives. Shelf composition, not rendering. Discriminator verified: `comb_rotations.hive_id` carries `unique (hive_id)` and `comb_rotations_select` exists, so *"a hive referenced by `comb_rotations`"* is well-defined and organizer-readable; PostgREST expresses it as an embedded left join filtered `is null`, not a SQL `not exists`. **Item 2 (the organizer's combs-with-chapters read) is the parallelizable half. Item 3 is BLOCKED by `1.15` — sequence, do not parallelize** (§1B.35.4) | **1.15** (item 3 only), 1.4 |

**On 1.11–1.13:** Colin ruled these into MVP-Comb at `a478c335…`, three minutes
before the brief was posted, so they carry his authority and they are **in**.
They run parallel and **nothing in the definition of done depends on them** — they
are the difference between shipping the rotation and shipping it *gloriously*, which
is Colin's other standing instruction. If they slip, the release still runs
end to end; do not let them gate 1.1–1.10, and do not let 1.1–1.10 crowd them out.

**Phase 2 — The daily layer. Parallel to Phase 1 from 2.1 onward; no shared files with the rotation work.**

| # | Owner | Task | Depends on |
|---|---|---|---|
| 2.1 | ~~Sage~~ | ~~`ENG-62`~~ — **CLOSED, ALREADY SHIPPED** in `20260826000001_nectar_ledger.sql` (+ `…05_nectar_sim_service`, `…06_nectar_sats_override`), prod-live since 2026-08-26. `ledger_accounts.owner_user_id → profiles`, `ledger_settings.rails_mode` defaults `'simulated'`. **2.3 / 2.4 / 2.5 are no longer gated on Sage** | — |
| 2.2 | **Deezine** | `DES-23` zap flight + `DES-32` short-note compose | — |
| 2.3 | **Fizz** | `ENG-90` — short note + nectar, any time, in-comb | ~~2.1~~ (shipped), 2.2 |
| 2.4 | **Fizz** | `ENG-65` — honeyed hexagon (comb-as-wallet) | ~~2.1~~ (shipped), `DES-24` |
| 2.5 | **Fizz** | `ENG-66` — comb pot. **G2: direct-to-recipient, never pooled** | ~~2.1~~ (shipped), 1.9 |
| 2.6 | **Lumen** | `COPY-7` — nectar vocabulary. **"Drops," not "sats."** No "bitcoin" in default UI | — |
| 2.7 | **Fizz** | `ENG-89` + `ENG-78` — **instrument C1–C5. In the MVP** (`O6` closed). Must ship in the same binary as the features it measures | 0.1, 1.9, 2.3 |
| 2.8 | **Bumble** | `OPS-10` — **EAS internal distribution** for the seeded combs (`O7` closed; **not** TestFlight, which stays MVP2). **BLOCKER ADDED §1B.38.5 — `eas.json` has exactly THREE profiles and none is a strangers build:** `development` (internal, but `developmentClient` + simulator), `preview` (internal, but `"EXPO_PUBLIC_DEMO_MODE": "true"` — it IS the pitch/kiosk profile), `production` (demo false, but store-bound + `autoIncrement`). `src/constants/demoMode.js`'s exported `DEMO_MODE` derives from that env and its exported `DEMO_CONTENT` is `__DEV__ || DEMO_MODE`, and a store-bound build has `__DEV__` false — so **`DEMO_CONTENT` is true**, and four demo affordances render on a stranger's phone (Onboarding's `FlowToggle` and demo-skip link, `CoreRitual`'s "Load demo data" writing fake rows into a real account, `HoneycombTab`'s seven fabricated people). **Needs a FOURTH profile — `distribution: internal`, `EXPO_PUBLIC_DEMO_MODE` absent or `"false"`, no dev-client, no simulator — and NOT a flipped `preview`: `check-demo-mode-env`'s *preview profile sets EXPO_PUBLIC_DEMO_MODE "true"* assertion pins it, so flipping it turns a green gate red and the pitch profile is pinned deliberately.** **MERGE-TIME REQUIREMENT:** the gate's demo-login-value check looped a **hardcoded** profile roster, so a fourth profile would be invisible to it and the gate would stay green. Add it to the roster in the same PR, and assert the roster equals `Object.keys(eas.build)` rather than a literal. **ACCEPTANCE INSTRUMENT:** `GUIDES/POLLINATE_TESTFLIGHT_ACCEPTANCE.md`'s walk survives as INVENTORY (its authority died with `Strategy` §11), but **its steps 1–7 exercise the daily loop, not the comb loop** — a build passing it proves nothing about the eight-step sentence. Add comb steps before using it to accept `OPS-10`. Two of its pointers are stale toward LESS work: the "check the source by hand" deferral is met (`cec96cc` is on `main`), and "none of the fifteen gates sees this class" is false (`check-demo-content-callsites.mjs`, `check-demo-mode-env.mjs`). **AMENDED §1B.38.12 §7 — THE BLOCKER AND THE MERGE-TIME REQUIREMENT ARE BOTH DISCHARGED; ONLY THE ACCEPTANCE INSTRUMENT IS OWED.** Re-derived at `github/main@e94a27a` (unchanged at `2adc1b4`, which touches only `RotationFold.js` and `check-comb-identity.mjs`): `eas.json` has **four** profiles and the fourth is `internal` — `distribution: internal`, `EXPO_PUBLIC_DEMO_MODE: "false"`, no dev-client, no simulator, not store-bound — exactly the shape specified, with `preview` untouched at `"true"`. The gate's roster is now `Object.keys(eas.build ?? {})` with its reason stated in-file. **The three-profile BLOCKER paragraph and the MERGE-TIME REQUIREMENT above are records, not work** (@Bumble, merged `a5ccae3`). **Step 1 of the ratified sentence — *a stranger can install* — now has a profile that could carry a build; it does not yet have a build.** Residual on this row: the acceptance instrument's comb steps, and an internal build actually installed by someone who is not us. | — |

**Phase 3 — Measure. Operations, not build — this happens *with* the shipped MVP.**

| # | Owner | Task | Depends on |
|---|---|---|---|
| 3.1 | **Colin** | **Seed three real combs** — a run club, a small group, a group chat. Not friends of the team | MVP-Comb shipped via `OPS-10` |
| 3.2 | **all** | **Wait eight weeks.** Read C1–C5 against §6's response table | 3.1 |

**Phase 4 — Monetize. Does not start until Phase 3 returns.**

| # | Owner | Task | Depends on |
|---|---|---|---|
| 4.1 | **Colin** | **Rule the price.** Ceiling ~$39/yr, annual preferred (§4) | 3.2 (was written `3.3`, which does not exist) |
| 4.2 | **Fizz** | `ENG-79` — IAP layer + subscription. **L+, carries the whole StoreKit/RevenueCat surface** | 4.1, 1.2 |
| 4.3 | **Sage** | Flip `ENG-85`'s caps on: 1 comb written in, **5 members counted inclusive of the organizer** (§1B.1); hard ceiling 20 on any comb, free or premium. **Grandfather every comb created before this flip** via `ENG-85`'s per-comb override (§1B.4) | 4.2 |
| 4.4 | **Pixel** | `DES-30` — paywall at the two moments, and no others | 4.1 |
| 4.5 | **Lumen** | Pricing copy. Never "upgrade to unlock" | 4.1 |

**Gate between Phase 3 and Phase 4:** if C1 < 40%, do not build Phase 4 — take
the §6 response for that signature instead. **Phase 4 is the only phase that can
be cut without wasting Phases 1–3**, which is the point of ordering it last.

### 8.7 Critical path

```
OPS-8 ─────────────────────────────────► ENG-89 ─┐  (both IN the MVP)
                                        OPS-10 ──┼─► SEED 3 COMBS ─► read C1–C5 ─► price ─► ENG-79
ENG-58 ─┬─► ENG-85 (caps off)                    │
        ├─► ENG-59 ◄── ENG-83 (auth)             │
        ├─► ENG-93 ◄── ENG-83           (create)   │
        ├─► ENG-91 ─► OPS-9 ──┐                  │   ◄── longest chain
        └──────────────────────┴─► ENG-60 ◄── DES-33 ─┤
                            └─► ENG-66           │
ENG-62 ─────► ENG-90 ◄── DES-32  ────────────────┘
 (shipped)

DES-22 ─┬─► COPY-6                  (design longest pole — start first)
        └─► DES-29
```

**AMENDED 2026-08-30 (§1B.10).** The diagram above previously read `DES-21` and
named it a longest pole. Both were wrong:

- **`DES-21` is closed** — merged at `a02e247`. `ENG-60` depends on **`DES-33`**,
  the rotation frame (§1B.3).
- **`ENG-62` is closed** — shipped `20260826000001` (§1B.2).
- **`DES-33` is no longer a longest pole.** Re-estimated XL → S/M once the bloom
  turned out to be built; it is a frame around shipped work.

**The two longest poles are `ENG-58` and `DES-22`.** Pixel called this and was
right: `COPY-6` and `DES-29` both sit behind comb identity, so `DES-22` has two
people's rows queued on it while `DES-33` has none. Start `ENG-58` and `DES-22`
immediately.

**AMENDED 2026-08-30 (§1B.29).** `ENG-93` is new and it does **not** lengthen the
pole — `ENG-58 → ENG-91 → ENG-60` is unchanged. It sits on the shorter
`ENG-58`/`ENG-83` branch beside `ENG-59`. The point is not its length: **it was
on no branch at all.** Every row above was written from the invitee's side,
because §1A's ratified sentence is, and the organizer's screen fell through the
gap between a design row (`DES-29`) and a join row (`ENG-59`). Phase 3.1 —
*"seed three real combs"* — is unexecutable without it.

**AMENDED again 2026-08-30 (§1B.14).** `ENG-91` is new and it sits **inside** the
engineering pole rather than beside it: `ENG-58 → ENG-91 → ENG-60`, with `OPS-9`
calling `ENG-91` instead of `seal_hive`. `DES-22` is unchanged and still the
design pole. **The engineering pole is now one row longer than when this section
was written**, and the added row gates §1A's definition of done — there is no
reveal without a seal. Nothing new is being *designed*; a server-side path the
rotation always assumed existed is being *built*.

## 9. What is explicitly NOT changing

Recorded so no one over-reads this ruling:

- **Slice 1's work is not cancelled** — the approved merge queue, the demo-gap
  items in `MVP1_DEMO_READINESS_AUDIT.md`, and the GL1/GL2 luxury pass all carry
  into MVP-Comb (§1A). *Amended 2026-08-30:* the earlier "Slice 1 ships first,
  **then** the comb work" sequencing is retired — shipping a demo of the product
  before the thing that is now the product does not make sense. **There is one
  release: MVP-Comb.** ~~See open ruling **O5** if a separate earlier demo
  build is still wanted.~~ **`O5` is CLOSED (`a11aa144…`, §10) — one release;
  this pointer described it as open and is corrected 2026-08-30.**
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
| **O8** | **What happens to a comb when its organizer deletes their account?** Auto-transfer to the earliest-joined remaining member (recommended), void the comb, or leave it ownerless. Raised §1B.24.2. Not blocking: `ENG-92` ships the compliance half (skip the owner's seat, never raise) with no ruling | `ENG-92` now, transfer default is Phase 4 |
| **O9** | **Do we tell a departing writer that leaving destroys the letter they have already written this month?** Today we do not. `delete_own_account()` deletes unsealed hive entries (`20260830000001:150-152`), and the recipient never knew the letter existed. One line in the delete flow. Raised §1B.26.4. Not blocking: `ENG-91` ships either way | Before seeding |
| **O10** | **When you join a comb mid-month, are you writing this month or next?** Today the answer is *next*, by omission — `comb_join_by_invite_code` writes `comb_members` only, and the sole writer of `hive_contributors` on the comb path is `comb_open_rotation`'s mint, so nothing enrolls a late joiner and nothing tells them. The alternative (the join RPC also enrolls into the open rotation) is a design, not a bug fix: it moves `C1`'s denominator inside an open window, which §1B.23.2 and §1B.36.8 spent two rulings stabilising. Raised §1B.37. Not blocking: `DES-22`'s cluster fix is correct under either answer | Before seeding |
| ~~**O5**~~ | ~~One release or two?~~ **CLOSED `a11aa144…` — one release.** The in-flight Slice 1 / MVP1 work folds into MVP-Comb | — |
| ~~**O6**~~ | ~~Does `ENG-89` come into MVP-Comb?~~ **CLOSED `a11aa144…` — yes.** Instrumentation is in the MVP, moved to Phase 2.7 | — |
| ~~**O7**~~ | ~~Distribution for the seeded combs?~~ **CLOSED `a11aa144…` — EAS internal distribution (`OPS-10`, Bumble).** TestFlight (`11.1`) stays MVP2 | — |

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

### §1B.33 — The `…0005`/`…0006` merge-order inversion is **not** non-hazardous. `db push` selects by **version**, never by table; and `prod-schema-check` does not merely miss the skip — **the migration that causes it is the one that certifies it didn't happen**

**Provenance.** @Bumble investigated the inversion I flagged in §1B.32's merge-pass items and concluded it was safe, citing `scripts/deploy-migrations.sh`'s header and the fact that `…0005` (rotation scheduler) and `…0006` (preview RPC) touch disjoint tables. The header quote is accurate; it is about a **different failure mode** — hand-applied dashboard schema producing `42P07`. The out-of-order hazard is documented twice elsewhere and states the opposite.

**`scripts/deploy-migrations.sh`, the comment block immediately above the dry-run:**

> `db push` without `--include-all` applies only migrations newer than the newest version in the remote history table, so a migration that landed on main *behind* an already-applied version is in the diff and is silently not in the push. That happens whenever branches merge out of timestamp order, which is normal, **or whenever a deploy runs between two merges.**

**`supabase/README.md`, under a bolded heading — "Deploy once per merge batch, not between merges":** the older file "ends up behind an already-applied version and push skips it, **permanently and silently**: `main` says the schema has it, the database doesn't."

**The independence argument is on the wrong axis.** `db push` selects by version comparison. It never reads which tables a migration touches, so disjointness is true and does not bear on whether `…0005` is applied.

---

#### The detector is inverted, not blind

`scripts/prod-schema-check.mjs` Rule 3 states its own premise: *"The CLI applies migrations in version order, so a later LIVE probe implies the unprobeable ones before it (IMPLIED)."*

`…0005`'s sentinel is `kind: 'order'` (`service_role-only function + pg_cron schedule, no anon-visible surface`). An `order` row is never probed (`:233`); its status is assigned purely by position (`:243`):

```js
if (row.status === 'ORDER') row.status = i < lastLive ? 'IMPLIED' : 'UNVERIFIED';
```

On disk `…0005` precedes `…0006`, and `…0006` (`kind: 'rpc'`, `comb_preview_by_invite_code`) is the batch's only probeable row — therefore `lastLive`. **In the skip scenario `…0006` is live on prod and `…0005` is not, and `…0006` is exactly the row that vouches for `…0005`.** The check prints `implied by a later live probe … Prod is not behind this tree` and exits **0**.

**Position, not probeability, is what makes `…0005` the silent one.** @Sage's `…0007` is also `kind: 'order'` and also unprobeable, but sits *after* `…0006`, so a skip lands it in the UNVERIFIED tail → `die(3)`. Loud. `…0005`'s slot is the only silently-vouched position in the 08-30 batch.

---

#### RULED — controls, in order of preference

1. **`…0005` merges before `…0007`, and no prod push until the batch lands.** Zero code change, zero stale-citation risk. This is the README's own rule and it is the primary control.
2. **Renumber `…0005` → `…0009` only if it cannot merge first.** @Bumble's stated objection — that renumbering hands the question to the merge queue — does not hold on this batch: version prefixes are monotonic claims and nobody will claim a number *below* `…0006`, so renumbering **vacates** the only silently-vouched slot and cannot refill it. `…0009` would join `…0007` in the UNVERIFIED tail (exit 3). If @Fizz's `…0008` proves probeable, leaving `…0005` in place gets *worse* — `…0007` becomes IMPLIED too and two skips go quiet. Renumbering requires claiming the number in-channel and moving both the header citations and the `SENTINELS` key.
3. **If a deploy has already run,** the repair is `supabase db push --include-all` after reading the dry run — never a second plain push.

**Owner: @Colin**, who runs the prod pushes. The window is open now: `…0006` is on main, `…0005` is not. Verified `github/main@9bc6d04`; @Bumble's branch pushed by me at `07a105f` (rebase confirmed content-identical to `15635f8` — both `4 files changed, 653 insertions(+)`, empty diff on the migration and the gate).

**The transferable shape:** a status *derived* rather than *measured* inherits its inference's premise as a silent dependency. When the premise fails, the verdict does not go unknown — it goes confidently wrong, in the direction of "fine." Ask what event violates the premise, then ask whether that same event supplies the evidence the inference rests on. If it does, the detector is inverted.

---

### §1B.34 — @Lumen's `has_active_month` gloss names a class that **already exists in shipped code with two members**, and `ENG-94` as scoped closes one. The second member is not a preview bug: it is `ENG-91`'s seal contradicting `ENG-93`'s acceptance row, and @Fizz is building `ENG-93` right now

**Ratifying the gloss, then correcting my own leg-2 ruling that it rests on.** @Lumen ruled `has_active_month` means *"there is a month a new writer can meaningfully join"* — an open rotation **with a live subject** — never *"an open rotation row exists."* The gloss is right and it is the load-bearing half. But my §1B.32 leg-2 finding gave it a single predicate — `profiles.deleted_at` — and **that is half of the condition the gloss actually names.**

`ENG-91` shipped `subject_gone` (`20260830000003:181`) with **two** causes on one `or`:

```sql
if v_subject_deleted_at is not null or not v_subject_active_member then
  v_void_reason := 'subject_gone';
```

`v_subject_active_member` is `exists (comb_members where comb_id = … and profile_id = subject and removed_at is null)` (`:172-175`). Both causes are ruled, both are gated — `check-comb-rotation-seal-send.mjs` test 4 is the tombstone, **test 5 is comb departure with no tombstone**, and its own header (`:68-74`) explains the two subjects are separate *deliberately*, to isolate the causes. So the class was two-membered before I named it, and the gate that proves it is green.

**`§1B.32` searched `git grep deleted_at` and found the class it was looking for.** The other half of the same `if` never touches `deleted_at` — it reads `comb_members.removed_at`. A grep scoped to the predicate I had in hand could not see it. `subject_gone` appears exactly **once** in this entire document before this section (§1B.32, line 2721) and only ever as the tombstone.

**Consequence for `ENG-94` (@Fizz), and it is the same hazard one level up.** Shipping `subject_name` null + `has_active_month = false` for a tombstoned subject *only*, under a comment glossing the boolean as *"a month a new writer can meaningfully join,"* writes the **strong** meaning in prose and the **weak** one in SQL. The comb-departure half is the **more reachable** of the two — removing a member is an ordinary comb operation; deleting your account is rare. §1B.24.0's shape again, and @Lumen's own sentence about `ENG-92`: *a partial fix to a named class is worse than none, because the next reader believes the class is closed.*

**RULED — `ENG-94` leg 2 takes the whole `subject_gone` predicate, not `deleted_at`.** The preview's subject leg must return `subject_name = null, has_active_month = false` under **both** causes, and the correct construction is not a second copy of the `or`: it is to read the rotation's subject through the **same** membership+tombstone test the seal applies, so the two functions cannot drift apart again. One source of truth for *"is this a month a writer can join,"* consumed by the seal to void and by the preview to refuse. If that means a shared `stable` helper, that is `ENG-94`'s call — the invariant is **one predicate, two callers**, not two predicates that happen to agree today. ***[SUPERSEDED ON OWNERSHIP by §1B.34.2, upheld on substance: the shared body is `ENG-95`'s artifact at `…0009`; `ENG-94` owns the CALLERS, not the body. Naming its home twice and differently is what left it homeless — read §1B.34.2 before building this.]*** Gate rows: a tombstoned subject **and** a departed subject each return `has_active_month = false`, per the class-in-the-fixture rule — the shared-path premise is a fact about today's source that nothing in a gate enforces.

---

**And the finding that is not about the preview at all.**

The `voided_reason` column comment (`20260830000003:79-80`) states the rule in words: *"the rotation's subject was tombstoned **or left the comb** before the window closed."* **`left` is a departure. The code tests `is not currently in`.** Those two agree on every subject who ever joined, and they disagree on exactly one population: **the subject who was never a member.**

That population is not hypothetical. It is **ruled legal, twice, in this document**:

- §1B.30.1 acceptance row 1 on `ENG-93`: *"`comb_open_rotation` **must not** require the subject to be a `comb_members` row. **Gated: mint for a non-member subject, assert success.**"*
- §8's model line (2666): month 1's subject is *"organizer-chosen and **may be a non-member**"* — `subject_profile_id references profiles` not `comb_members`, which is the schema's entire statement of *"a comb writes for anyone."*

**So the flow that MVP-Comb's definition of done describes voids.** An organizer creates a comb, names Sarah as month 1's subject, invites five friends. Sarah has an account but has not joined this comb — she is the recipient, not a writer. Five people write for a month. At close, `seal_and_send_rotation` finds no active `comb_members` row for Sarah, classifies **`subject_gone`**, and **voids**. The entries are preserved and never delivered, and the recorded reason says Sarah is *gone* when she was never there. `voided_reason` is `C1`'s denominator — so the metric that decides the price would book this as a comb that failed to deliver.

**The mint is gated. The seal is not, and a green gate on the mint says nothing about it.** §1B.30.1 wrote an acceptance row asserting a non-member mint **succeeds**; `check-comb-rotation-seal-send.mjs` test 5 asserts a non-member subject at seal **voids**. Both will be green. They are opposite claims about the same rotation, one verb apart — and @Fizz is building the mint side **now** (`20260830000008` claimed).

**RULED — the discriminator exists and the fix is one clause.** *Departed* and *never joined* are distinguishable in the data the seal already has: a `comb_members` row that **exists with `removed_at` set** is a departure; **no row at all** is the organizer-chosen non-member subject. `not exists (… removed_at is null)` collapses them. The seal's membership half becomes:

```sql
exists (select 1 from public.comb_members m
        where m.comb_id = v_comb_id and m.profile_id = v_subject_id
          and m.removed_at is not null)
```

— *this subject left* — replacing *this subject is not currently here*. The tombstone half is untouched and stays a hard void. Delivery to a registered non-member subject is `send_hive`'s question, not this predicate's, and that is where `C2`'s empty population (§1B.29, still Colin's) actually lives.

**Routing.** This is a **new row, `ENG-95` (@Sage, S)** — the seal is Sage's artifact and the fix is one predicate plus one gate row (*"a subject who was never a member delivers, and does not void as `subject_gone`"*). It does **not** ride `ENG-92`: that migration's scope is closed and named, and this changes `seal_and_send_rotation`'s classification behaviour, not a tombstone join. **`ENG-95` blocks `ENG-93`'s acceptance row 1** — not the build. @Fizz ships the mint without a membership check exactly as ruled; the row that asserts a non-member mint *succeeds* is only true end-to-end once `ENG-95` lands, so the two must be verified together before the definition of done is claimed.

**Open:** `O3`, `O4`, `O8`, `O9`. No new `O` — both halves are engineering, not product.

**The transferable shape, and it is the one that has bitten this thread three times today:** a class named by the predicate you happened to grep for is a class sized by your search, not by the code. `subject_gone` was *one* `if`, *two* causes, *two* gate tests, and *one* column comment that stated the rule more precisely than the code implemented it. **When a fix names a class, find the code that already classifies it and read the whole boolean — then read the comment next to it, because the gap between what a comment claims and what its predicate tests is where a ruled-legal case goes to die.**

---

### §1B.34.1 — @Lumen's "three callers, one truth" is the right target and **not what `ENG-93` is being built to.** The mint is not a caller: it carries a **hardcoded half** of the predicate, and @Fizz is writing that line right now

@Lumen ratified §1B.34 and added the consequence: *"ENG-95's never-member fix flows through the shared predicate into the preview without a third patch — mint, seal, and preview agree on that population **by construction**. Three callers, one truth."* **The conclusion is correct for the never-member population and false for the population one step over, because the mint does not call anything.**

`ENG-93`'s acceptance rows (§1B.30.1, row `ENG-93` in §8.6) specify exactly two things about the subject:

1. the mint **must not** require a `comb_members` row, and
2. it **carries §1B.24.1(c)'s tombstoned-subject refusal** — `profiles.deleted_at is not null`.

@Fizz's claim on `20260830000008`, this evening, in their own words: *"no `comb_members` membership check on subject, hive-then-rotation insert order, **plus Row 2 tombstone refusal**."* Nothing is pushed yet — `github/main` is `9bc6d04`, no `…0008` on any remote branch or in `/Users/coling/pollinate`. **So the line is being written now, and it is `deleted_at` alone: a fourth site holding a copy of half the predicate.**

**Count the sites after `ENG-94` and `ENG-95` land as currently scoped:** seal = {tombstoned, departed}; preview = {tombstoned, departed} via the shared body; mint = **{tombstoned}**, hardcoded. Three sites, **two** truths. @Lumen's "by construction" holds for the never-member and breaks for the **departed** member.

**The concrete failure, and it is the mint's alone.** The organizer picks the subject — `DES-29`'s *person → occasion → date*. A member who **joined and left** is, to that picker, indistinguishable from a never-member: both are people with accounts who are not currently in the comb. Pick the departed one and the mint **accepts** (only `deleted_at` is refused), the comb writes for a month, and `seal_and_send_rotation` voids it as `subject_gone` — **correctly**, because that half of the predicate is ruled and gated (test 5). The month was doomed at the instant it opened, the doom was **knowable** at that instant, and nobody learns until close.

**RULED — the mint becomes the third caller of the shared predicate, not a copy of one arm of it.** `comb_open_rotation` refuses on the whole *"is this subject deliverable in this comb"* body — the same body `ENG-91` voids on and `ENG-94` reads. This does **not** disturb §1B.30.1 acceptance row 1: refusing a **departed** subject is not requiring **membership**. A never-member still mints, still delivers, still shows `has_active_month = true`. The row's fixture is unchanged and its assertion gets *stronger*, because it now discriminates the two populations the old predicate collapsed.

Three notes so this is buildable rather than aspirational:

- **The refusal and the void are the same predicate at different instants**, so the mint's refusal does not make the seal's check redundant. The mint asks *at open*; a subject can depart *mid-month* and only the seal sees it. That mid-month case is exactly test 5's, and it stays.
- **Row `1.9a`'s derived advance already skips `removed_at` seats** — so the mint's refusal is defence-in-depth on the auto path and a **live gate** on the organizer path. Putting it in the mint body means the invariant survives the next caller, which is the whole argument for a function over a policy.
- **`ENG-93` gains one acceptance row, and it is @Fizz's cheapest possible edit** — call the body instead of writing `deleted_at is not null`. Gate: *"a subject who left the comb is refused at mint; a subject who was never a member mints and delivers."* Both populations in the fixture, per the class-in-the-fixture rule.

**Sequencing, since @Fizz is mid-build.** The shared body is `ENG-95`'s artifact (@Sage) and does not exist yet. @Fizz should **not** block: ship `ENG-93` with the tombstone refusal as ruled, and `ENG-95` repoints the mint to the shared body when it lands — one `create or replace`, already in Sage's scope. What must **not** happen is `ENG-93` merging with `deleted_at is not null` inline and **no row tracking the repoint**, because then the mint is a silent fourth copy and §1B.24.0's shape closes over it: the next reader sees a refusal, believes the class is handled, and never asks which arm.

**Should a departed member be re-celebratable at all?** A real product question and **not one we need answered to build.** Under either answer the invariant holds — the mint must never open a month the seal is guaranteed to void — and the shared body makes reversing it a one-line edit in one place. That is the argument for the body, stated as a cost: today it saves a fourth copy; the day Colin rules the other way it saves four edits and a divergence. **No new `O`.**

**Open:** `O3`, `O4`, `O8`, `O9`.

**The transferable shape:** *"one predicate, N callers"* is a claim about **call sites**, and it is worth counting them. A site that reimplements one arm of the predicate reads exactly like a site that calls it — same refusal, same error, same green gate — right up until the arm it omitted is the one that fires.

---

### §1B.34.2 — The shared body is **homeless**: I named its home twice, differently, and both in-flight builders claimed before the second naming. And the repoint I assigned **cannot live where I put it** — `create or replace` on a function that does not yet exist *creates* it

@Lumen ratified §1B.34.1 and @Fizz has the sequencing. **Neither is building the shared body, and neither should be blamed for it — I gave it two different homes in two published sections eleven minutes apart, and both builders claimed against the first one.**

- **§1B.34** (`9554c45`): *"If that means a shared `stable` helper, **that is `ENG-94`'s call**."*
- **§1B.34.1** (`32d6cc2`): *"The shared body is **`ENG-95`'s artifact** (@Sage)."*

@Sage claimed `20260830000009` at **17:49:31**; §1B.34.1 published at **17:51:30**. The claim predates the amendment by two minutes, and its text is seal-only: *"`seal_and_send_rotation` non-member-subject predicate fix."*

**Verified on disk, not inferred.** `wt-eng95-seal-nonmember/supabase/migrations/20260830000009_eng95_seal_nonmember_subject.sql`, 195 lines, uncommitted: **one** `create or replace function` and it is `seal_and_send_rotation` (`:40`). The predicate is a **local variable** — `select exists (… m.removed_at is not null) into v_subject_departed` (`:104-107`) — and the fix itself is exactly right, with the never-joined fall-through reasoned in the header. `comb_open_rotation` appears **once**, at `:15`, as a *citation* in a comment. The mint is untouched. Nothing is pushed on any of `ENG-93`/`ENG-94`/`ENG-95`; `github/main` is `9bc6d04`.

**So if all three land as currently being built: seal has its own `exists`, mint has its own `deleted_at`, preview gets a third. "One predicate, N callers" would be published, ratified twice, and implemented nowhere — three sites, three copies, and every gate green.** This is §1B.29(a)'s shape done to myself: *a requirement whose home is named twice and differently is as homeless as one never named*, and worse, because each naming looks like an answer.

---

**And the assignment in §1B.34.1 is not merely misrouted, it is unbuildable as written.**

I told `ENG-95` to repoint the mint. It cannot. `create or replace function` on a function that does **not** exist does not error — **it creates it.** `…0009` repointing `comb_open_rotation` while `…0008` has not merged would **conjure a mint function out of the seal's migration**, written by an author who does not hold `ENG-93`'s body: wrong signature, wrong insert order, no cadence. Silent and wrong, not loud and wrong — the same failure class as tonight's `…0005` skip, one layer down. **A repoint needs its target to already exist, and `create or replace` is precisely the statement that will not tell you it didn't.**

---

**RULED — three artifacts, ordering-safe by version number alone, nothing conjured and no cross-branch merge dependency.**

| Migration | Owner | Carries |
|---|---|---|
| `…0008` `ENG-93` | @Fizz | **Unchanged.** Inline tombstone refusal as ruled + @Lumen's naming comment. **Depends on nothing new** — ship it |
| `…0009` `ENG-95` | @Sage | **Create the shared body** — `comb_subject_deliverable(p_comb_id, p_subject_profile_id)`, tombstoned **or** departed — and repoint **the seal only**. `v_subject_departed`'s inline `exists` becomes a call. **Do not touch the mint** |
| `ENG-94` | @Fizz | **Repoints BOTH the preview and the mint** to the body. Same artifact type (`create or replace` of a definer that reads the body), same author, and by number it lands after `…0008` and `…0009`, so body and mint both exist |

**Superseding §1B.34 in place** (annotated at the line, per *file order is not a timestamp*): the body is **`ENG-95`'s**; `ENG-94` owns the **callers**. @Sage's file is open right now and the edit is small — the `exists` it already wrote, lifted into a function and called twice.

**`ENG-94` is no longer dependency-free.** §1B.32 said it *"blocks nothing and is blocked by nothing"* — true when it was two legs of a return contract, **false now**: it consumes `ENG-95`'s body and rewrites `ENG-93`'s mint, so it is blocked by both. It still blocks nothing, and it still must not delay `ENG-93`.

**@Lumen's comment obligation on the inline line is endorsed and now has a resolvable address.** It should name **`ENG-94`**, not `ENG-95`: *"half of the shared subject-deliverable predicate; `ENG-94` replaces this line with a call to `comb_subject_deliverable()` — do not extend in place."* A comment pointing at the wrong ticket is the failure the comment exists to prevent.

**Open:** `O3`, `O4`, `O8`, `O9`. No new `O`.

**The transferable shape, and it is mine tonight:** an amendment that *relocates* a requirement only relocates it for readers who arrive after it. Everyone already building is working from the first naming — so **when an amendment moves an unbuilt artifact's owner, name the builders who claimed under the old naming and address them by name**, or the requirement is homeless in exactly the way the amendment was written to prevent. Second half: before assigning a repoint, ask what the repointing *statement* does when its target is absent. `create or replace` answers "creates it," which is the one answer that produces no error and no diff to read.

---

### §1B.34.3 — `ENG-95`'s shared body is right and its **grant argument is load-bearing, not belt-and-braces**. Two gaps: the `authenticated` revoke has no assertion anywhere in the repo, and **no gate can tell a caller from a re-implementer**

@Sage rewrote `…0009` while §1B.34.2 was being written and landed the shared body independently: `comb_subject_gone(p_comb_id, p_subject_id)`, `language sql stable security definer`, both arms, seal repointed to a single call (`:149`), mint and preview explicitly left alone with the reason stated in the header. **Ratified.** The never-joined fall-through is reasoned correctly and the gate gained the population — `check-comb-rotation-seal-send.mjs:614`, *"a subject who was never a `comb_members` row delivers, does not void as `subject_gone`."* Class in the fixture, as ruled.

**Their grant paragraph deserves upgrading from cautious to necessary, and the evidence is in our own schema.** `20260813000005`'s header records a *measured* finding: on PG 18.4, `alter default privileges in schema public revoke execute on functions from public` **is accepted and records nothing** — `pg_default_acl` stays empty and *"every future function starts open to anon."* So `revoke execute … from anon` / `from authenticated` on a new definer is not defensive styling; **it is the only thing standing between `comb_subject_gone` and the exposure @Sage described** — *"has this person deleted their account or left this comb,"* answerable for any `(comb_id, subject_id)` pair.

---

**Gap 1 — the `authenticated` half of that revoke is asserted nowhere.**

`check-share-visibility.mjs` is the guard `20260813000005` names as *"the only durable guard."* It enumerates **every** definer in `public` (`:361-367`, no allowlist filter on the enumeration — exhaustive by construction) and then asks exactly one question per function:

```js
has_function_privilege('anon', sig, 'execute')
```

**`anon` only** (`:369-374`). There is no catalog assertion for `authenticated` in the repo. Where that boundary is covered at all it is covered **per function, in that function's own ticket gate** — `check-comb-rotation-seal-send.mjs` carries *"grant boundary: `authenticated` cannot call `seal_and_send_rotation`."* So a new definer's `authenticated` revoke is protected only if its author remembers to write the row.

**And the re-opening mechanism is documented and measured in the same file:** `create or replace` preserves `proacl` — the revoke survives — but **`drop` + `create` loses it silently, and any signature change forces `drop` + `create`.** `comb_subject_gone(uuid, uuid)` is one day old and its signature is the most plausible thing about it to change.

**Asked of `ENG-95`, in the gate @Sage already has open:** a grant-boundary row for `comb_subject_gone` asserting **both** `anon` and `authenticated` cannot execute it — the same shape `seal_and_send_rotation` already has, in the same file. The catalog-wide `authenticated` assertion is a separate, larger question and is **not** `ENG-95`'s to carry.

---

**Gap 2 — and it is the ruling's own blind spot. `git grep comb_subject_gone scripts/` returns nothing.**

Every behavioural row in the gate goes through `seal_and_send_rotation` and asserts outcomes. **All of them stay green if a future edit re-inlines the predicate.** That is §1B.34.1's sentence turned back on the fix that implemented it: *a site that reimplements one arm reads exactly like a site that calls it — same refusal, same error, same green gate.* The gate proves the seal **behaves** right today; nothing proves the construction is **shared**, which is the entire content of "one predicate, N callers."

The idiom already exists and is two files over — `check-comb-preview.mjs:352` asserts against `pg_get_functiondef(oid)` directly. **Asked:** assert each caller's definition **contains the call**, and — per the count-tripwire rule — assert the caller **roster**, not a count of matches, so adding a fourth caller forces the line rather than sliding under it. Today that roster is one name; `ENG-94` makes it three.

---

**Gap 3 — the mint repoint is tracked in prose, not in a row.** @Sage's header says the repoint is *"tracked in-channel, not silently left as a fourth copy."* In-channel is not an artifact, and this is §1B.29(a)'s shape a third time tonight. **§1B.34.2 assigns it: `ENG-94`'s migration (@Fizz), which repoints the preview and the mint together** — by number it lands after both `…0008` and `…0009`, so the body and the mint both exist and nothing is conjured. The header comment at `:41-47` should name **`ENG-94`** so the next reader of the file has a resolvable address, not a channel to search.

**Open:** `O3`, `O4`, `O8`, `O9`. No new `O`.

**The transferable shape:** a shared body is a *construction*, and behavioural tests cannot see constructions — they see outcomes, which are identical whether the sharing happened or not. **When the ruling is "one predicate, N callers," the gate has to assert the calls, not the answers.** And when a security argument rests on a `revoke`, find the assertion that fails if the revoke disappears; if the enumeration only asks about one role, the other role's revoke is a comment.

---

### §1B.34.4 — Filing the unowned hole @Lumen caught me creating: **`OPS-11`**. And the reason it is `M` and not `S` is that the `authenticated` grant set was written by *pattern*, so a map generated from the catalog would codify it

@Lumen is right and the catch is on me: I took the catalog-wide `authenticated` assertion off @Sage's plate (*"not yours to carry"*) and handed it to **nobody**, which is §1B.29(a)'s shape a fourth time in one evening — by my own hand, in the same message where I named the shape. **Filed with an owner.**

**It is a row, not an `O`.** The `O`-list is @Colin's — product intent that engineering cannot derive. *"Which roles may execute each definer, asserted from the catalog"* has an engineering answer; it just has not been given one. @Lumen's own escape hatch is the tell: *"even if the answer is 'per-function rows are enough, ruled deliberately.'"* A deliberate ruling is a row's output. Its absence is not.

---

**`OPS-11` (@Sage, `M`) — assert the execute-grant set for every `security definer` function in `public`, for every client role, from the catalog.**

**Not in MVP-Comb's critical path.** The per-function grant-boundary rows (`ENG-95`'s ask, `seal_and_send_rotation`'s existing one) carry the interim. This exists so the next definer's revoke is not protected by its author's memory.

1. **The enumeration is already exhaustive; only the question is single-role.** `check-share-visibility.mjs:361-367` selects every `prosecdef` function in `public` with no allowlist filter on the enumeration itself — that half is right and stays. `:369-374` then asks `has_function_privilege('anon', sig, 'execute')` and nothing else. Extend the question to `authenticated` and `service_role`.

2. **Declare an expected-grant map — signature → role set — and assert catalog `==` declaration in BOTH directions.** A lost revoke and a widened grant are different failures with the same fix, and a one-directional check catches only one. This is the `ALLOWED_ANON_DEFINERS` idea generalized, and its own comment already states the standard: *"this list is a name check, not a count check."*

3. **The one-time review is the work, and it is what makes this `M`.** A map generated from the live catalog codifies whatever is true today, including anything already wrong — a snapshot is not a decision. Measured on `github/main`: **24 distinct functions carry an explicit `grant execute … to authenticated`.** Three of them are **trigger functions** — `combs_create_owner_membership()`, `entries_resolve_volume_id()`, `private_hives_create_volume_one()`. Those grants are **inert**, not leaks: PostgreSQL refuses a direct call to a trigger function, measured in this repo for `handle_new_user` (`20260813000005`). They are, however, evidence that the set was written **by pattern rather than per-function decision** — which is precisely the condition under which snapshotting it as "expected" is worthless. Each of the 24 earns one line of justification, the same standard the four-name anon allowlist already meets.

4. **A legitimate outcome is "per-function rows are enough."** If so, the asymmetry gets argued in the comment — anon is a **closed** set of four and belongs in an allowlist; `authenticated` is the ordinary client role with two dozen legitimate entries, so a catalog-wide deny-list would churn on every feature. That is a real argument and it may win. **It has to be written either way**, because right now the asymmetry is not a ruling, it is a gap that looks like one.

---

**One coordination fact, and @Lumen stated the principle correctly.** *"A fix on a branch I cannot see is a fix I cannot sign."* Verified just now: `github/main` is still `9bc6d04` and there is **no remote ref** for `ENG-93`, `ENG-94`, or `ENG-95`. @Sage's `comb_subject_gone` exists only in `wt-eng95-seal-nonmember`, uncommitted. My §1B.34.3 ratification is a reading of a working tree — **it is a real reading and it is not a signature**, and @Lumen's semantics-only sign-off is the correct discipline, not excessive caution. @Sage has push access (`4632eec` landed earlier tonight); pushing `…0009` converts three people's reviews from provisional to citable.

**Open:** `O3`, `O4`, `O8`, `O9`. **New row:** `OPS-11`. No new `O`.

**The transferable shape:** *"not yours to carry"* is half a routing decision. Taking a requirement **off** someone is only safe if the same sentence puts it **on** someone — otherwise the removal is the more confident-looking of the two errors, because it reads as scope discipline. **Say who, in the sentence that says not-you.**

---

### §1B.35 — RULED 2026-08-30: `subject_name` is frozen at mint, and the live consumer is not the one that was flagged (`ENG-96`, @Fizz, S)

Verified at `github/main@46ce848` (`ENG-93` `…0008` + `ENG-95` `…0009` both merged).

**@Lumen's finding is ratified in substance and corrected on its consumer.** The substance: `comb_open_rotation` (`…0008:164-171`) writes `coalesce(nullif(display_name, ''), 'Someone')` into `private_hives.subject_name` — a mint-instant freeze of a live identity, using the live-read fallback word in a stored-snapshot position. Three populations, none exotic: the subject who renames mid-month, the subject with an empty `display_name`, and the never-member subject who never crossed `DES-37`'s name collection and therefore carries `handle_new_user`'s `'New user'` default (`20260808000001:46`).

**(a) `hivePrompts.js` is not a live consumer.** `git grep hivePrompts github/main -- src/` returns exactly one hit and it is a *comment* (`src/constants/nectar.js:124`). The only importer in the tree is a gate — `scripts/check-onboarding-flow.mjs:394`. Nothing anywhere in `src/` replaces the `{subject_name}` token: the file **carries** it (its own header, `:19-24`), it does not interpolate it. It is an unrendered copy asset.

**(b) The live consumers are three shipped screens, and they are worse, because they need no comb composer.** `TodayTab.js:225` calls `HiveStore.listContributingHives()` (`:426`), which selects `subject_name` (`:431`) and maps it to `subjectName` (`:447`). `ContributingHive.js:130` renders it as the banner name, `:136` as *"A hive for {subjectName}, from {ownerName}"*, and `:179` passes it into `ComposeHiveEntry`, which renders `:52` — *"What's something you're grateful for about {subjectName}?"* — the composer's own title.

`…0008:174-180` inserts a `hive_contributors` row for every active comb member except the subject. `listContributingHives` is an `!inner` join on `hive_contributors` with **no filter that excludes a comb-minted hive**. The month therefore appears on every writer's Today shelf the instant it is minted. **This blocks the first comb MONTH, not the first comb composer render** — the surface it renders on shipped weeks ago.

**(c) The discriminator already exists, and it is not `is_collective`.** `HiveStore.createHive` (`:139-147`) never writes `subject_profile_id`, and `git grep subject_profile_id github/main -- src/` returns no client write anywhere in the tree. A `§18.1` collective hive has it NULL; a comb-minted hive has it SET. So `subject_profile_id is not null` means exactly *"this hive's subject is a Pollinate account,"* which is precisely the condition under which the name is derivable live and the frozen column is redundant.

**RULED — the rule is not comb-scoped.** A hive whose subject has a profile renders **that profile's** `display_name`; `subject_name` is the label for the subject who has no account. `ENG-96` (@Fizz, S): add `subject_profile_id` to both contributor-scoped selects (`:431`, `:465`), batch-join `profiles.display_name` in the shape `ownerName` already uses (`:439-443`), and prefer the live name when it is non-null. Keep `|| 'Someone'` at the *live* read — there the word is correct, because it heals on refetch; the defect is freezing it into a column.

**The mint's write stays, and it is not a mint bug.** `subject_name text not null` (`20260815000001:18`) leaves `comb_open_rotation` no choice — the coalesce is forced by the schema. Per @Lumen, the rule lives at the consumers. Gate: one negative (a comb-surface render may not source `subject_name`) and one positive (a subject who renames mid-month reads new on the writer's shelf).

**Migration ordering — checked for clobber, none found.** `…0005` (`OPS-9`) and `…0007` (`ENG-92`) are now both numbered *below* three merged migrations. `…0007`'s three `create or replace`s are `comb_member_count`, `comb_co_member_names`, `delete_own_account` — disjoint from `…0008`/`…0009`. `…0005` is `create function advance_due_rotations()` — a new name. So no definition is overwritten in either direction. One latent edge remains: `…0005`'s rebased body will call `comb_open_rotation`, created three numbers *later*; it applies clean (plpgsql defers resolving called functions to first execution) but the file order lies about the dependency. **Renumber `…0005` on rebase** — @Bumble, at rebase time, not a new row.

**Open:** `O3`, `O4`, `O8`, `O9`. **New row:** `ENG-96`. `OPS-11` stands. No new `O`.

**The transferable shape:** a consumer list assembled from the **token** is not the consumer list. The grep for `{subject_name}` finds the file that carries the token; the screens that render the *value* never mention it, because the store renames it (`subject_name` → `subjectName`) at the layer boundary. **A rename at a layer boundary breaks the grep that would have found the consumer** — when tracing a column to its readers, follow the field through every mapping, or grep the destination name too.

### §1B.35.1 — AMENDED 2026-08-30: the boundary grep says SIX, and the two @Lumen missed are the keepsake's own cover (`ENG-96` re-scoped; new rows `DES-38`, `DES-39`)

@Lumen applied the §1B.35 lesson to the merged tree and extended `ENG-96` from two mappings to four (`:185` `listHives`, `:222` `getHive`, owner-scoped, both real — the mint writes `owner_id = v_owner_id`, the organizer, so `HiveDetail:271` feeds `ComposeHiveEntry` the frozen word by a second path). Ratified. **The grep returns six.** `git grep -n "subjectName: " github/main -- src/services/HiveStore.js` → `:185`, `:222`, `:447`, `:481`, **`:529`**, **`:583`**.

**`:529` `listReceivedPackages` and `:583` `getReceivedPackage` are the subject's own delivered keepsake** — `ReceivedPackages.js:63` and `PackageOpen.js:118`, the reveal itself. Three things make them the most important and the cheapest of the six:

1. **`subject_profile_id` is non-null by construction** — both queries filter `.eq('subject_profile_id', subjectId)` (`:510`, `:553`). §1B.35's discriminator is guaranteed true; there is no branch to write.
2. **The subject IS the signed-in user** (`requireUserId`). No batch join is needed at all — unlike the other four.
3. **It renders on the keepsake's cover, to the person it was written for.** A frozen `'Someone'` or `'New user'` lands at the product's emotional peak.

**The trap sitting beside them, and it will catch a careful builder.** `contributor_names` on these same two methods is **deliberately frozen at send**, with the reason in-file (`:534-537`): *"not live-computed, so it stays correct even if a contributor's own name changes after the fact."* Adjacency will argue `subject_name` should match. **It should not, and the asymmetry is the reason the freeze was right in the first place:** contributor names are a *third-party historical record* — "these people wrote for you." The subject's name is **the reader's own name**, there is exactly one reader, they are signed in, and they know what they are called. Greeting them by a name they have since changed does not preserve history; it misaddresses them. This also settles @Lumen's earlier position that the keepsake's subject word belongs to the seal's instant: on these two methods the seal-snapshot argument cannot bite, because the only reader is the subject.

**@Lumen's fallback pin is ratified — live `display_name` → `'Someone'`, never → frozen `subject_name`** — with one addition: on `:529`/`:583` `'Someone'` addressed to yourself is the worst cell in the table, and it is reachable.

**`DES-38` (@Lumen, S) — the residual `ENG-96` cannot fix.** Live-reading converts frozen `'Someone'` into live `'New user'` — better, because it heals, but still wrong on day one, and `'New user'` is precisely `DES-22 §4`'s barred non-distinguishing placeholder. The never-joined subject crosses **no** name-collection surface: `DES-37` collects for the invitee and the organizer, and the subject is neither. `comb_open_rotation` takes no name argument, so the organizer cannot supply one either.

That inverts the ordering the column pair was built for. The real rule is **self-chosen name > organizer-typed name > system default**, and the mint today writes the *system default* into the *organizer's* column. `subject_name` is not dead — it is the organizer's typed word — and for the never-joined subject that typed word would beat the live read. `DES-38` rules what a comb surface calls this subject, and whether `DES-29`'s picker should collect an organizer-typed name for exactly this case. **If it should, `comb_open_rotation` gains a name argument and `subject_name` becomes load-bearing for combs again — which re-cuts `ENG-96`'s fallback chain.** So `DES-38` gates `ENG-96`'s *fallback chain* only; the select-list and join work on all six mappings is unaffected and @Fizz should not wait.

**`DES-39` (@Lumen ruling, Pixel render, M) — and it is not a name bug.** `listHives` (`:163-167`) is `.eq('owner_id', ownerId)` with **no comb filter**, and `TodayTab.js:208` calls it. The mint sets `owner_id` to the organizer. So **every comb month becomes a separate hive card on the organizer's own shelf** — a twelve-month comb puts twelve cards there, indistinguishable from hives they made by hand. This is shelf composition, not rendering, and it is bigger than `ENG-96`. Not covered by `DES-21` (that rescope was about the reveal's missing tense).

**Open:** `O3`, `O4`, `O8`, `O9`. **New rows:** `DES-38`, `DES-39`. `ENG-96` re-scoped to six mappings. No new `O`.

**The transferable shape:** @Lumen ran the boundary grep and stopped at the mappings their trace predicted. The two they missed are the two the trace never reached — the *subject's* reads, not the writer's or the owner's. **A grep is only exhaustive if you read every hit; the ones outside your mental model are precisely the ones the grep existed to find.** Corollary from the same file: when a fix lands next to a field that was deliberately frozen, state the asymmetry in the ruling — otherwise the adjacency argues the fix into the wrong shape.

### §1B.35.2 — CORRECTION 2026-08-30: the live read is unreadable on four of the six mappings, and `'Someone'` is an authorization word, not a name word. **I was wrong in §1B.35.**

Both `DES-38` and `DES-39` rulings are @Lumen's and I ratify their shape. But `DES-38`'s resolver has a premise that does not hold on the merged tree, and the premise is **mine** — §1B.35 ruled *"prefer live when `subject_profile_id` is non-null."* That is only executable where the reader may read the subject's profile row, and on four of the six mappings **they may not.**

**Measured.** `git grep -rn "on public.profiles for select" github/main -- supabase/migrations/` returns **three** policies, total: `profiles_select_own` (`auth.uid() = id`), and two generations of `profiles_select_connections` (`honeycomb_connections`, status `pending`/`accepted`, superseding at `20260809000005`). **There is no comb-scoped `profiles` policy.** The team already faced this and chose the other door — `20260830000002:375`: *"comb you belong to. Not a widened profiles policy — keep the blast radius"* — which is why `comb_co_member_names` (`:391-404`) is a `security definer` that joins `profiles` and gates on `is_comb_member`.

**So the six mappings split three ways, not one:**

| mappings | reader → subject | live `display_name` readable? |
|---|---|---|
| `:529`, `:583` | subject → **self** | **Always** — `profiles_select_own`. |
| `:447`, `:481` | contributor → subject | **No**, unless honeycomb-connected. A comb writer joins by **invite code**; a connection is not implied and usually absent. |
| `:185`, `:222` | organizer → subject | **Conditional** on `DES-29`'s picker source, which is unbuilt. |

**`'Someone'` in this codebase is already spoken for, and not as a name-placeholder.** Both existing uses say so in-file: `listContributingHives:437-439` — *"the owner may not be a honeycomb connection of every contributor they invite"*; `listReceivedPackages:518-524` — *"drops silently (zero rows, not an error) once the sender is unfriended."* **`'Someone'` is the "I am not permitted to read this person" word.** `DES-38`'s placeholder class makes it the output of *"nobody produced a name."* Those are different causes wearing one word, and a resolver that merges them cannot distinguish the unfixable case from the fixable one.

**The consequence that inverts §1B.35: the mint's coalesce write is not the defect. It is the RLS bridge.** `comb_open_rotation` copies the subject's name across the profiles wall at mint, exactly as `send_hive` copies contributor names across at send. `private_hives.subject_name` is to the subject what `contributor_names` is to the writers — the same pattern, for the same reason. My §1B.35.1 accepted `contributor_names`' in-file reason (*"stays correct even if a name changes"*) at face value; **the stronger reason is that a non-connected subject cannot read her writers' profiles at all.** That strengthens the asymmetry ruling — the freeze is load-bearing, not stylistic — and it means `subject_name` is not vestigial.

**AMENDED RULING — `ENG-96` is two fixes, not one.**

1. **`:529`/`:583` — live first, exactly as @Lumen ruled.** Readable by `profiles_select_own`, it heals, and the reader is the person. Unchanged, and it is still the cheapest pair.
2. **`:447`/`:481`/`:185`/`:222` — `subject_name` STAYS the source.** A live-preferring branch here silently degrades to `'Someone'` for the modal comb writer. Do not add a `profiles` join to these four; it buys nothing and hides an authorization failure inside a name resolver.

**What actually fixes the four is the mint's write, in two parts, and both are cheap:**
- **(a) Never freeze a placeholder.** This is where `DES-38` point 4 becomes load-bearing rather than a nicety: when the subject's live name is placeholder-class, the organizer's typed word is **the only word any writer will ever see**. @Lumen's *conditional* collection is the right trigger and the right copy; the stakes are higher than "the organizer's word is truest" — for four of six mappings it is the **sole** source.
- **(b) Re-copy at every mint.** Month N+1's `comb_open_rotation` re-reads `display_name`, so a rename heals at the next rotation without a refresh path, a job, or a schema change. The organizer's manual edit (`private_hives_update_own`, unsealed only) stays as the immediate correction.

**A design constraint for `DES-29`, delivered before it is built:** if the picker lets the organizer choose a **non-connected** profile, the organizer cannot read that person's name either — the picker needs its own name source (a definer in the `comb_co_member_names` shape, or restriction to connections). Otherwise it renders a list of `'Someone'`.

**`DES-39` — ratified, discriminator verified.** `comb_rotations.hive_id` carries `unique (hive_id)` (`20260830000002:480`) and `comb_rotations_select` (`:498`) exists, so *"a hive referenced by `comb_rotations`"* is well-defined and readable by the organizer. One build note: PostgREST expresses this as an embedded left join filtered `is null`, not a SQL `not exists`. *Writer sees the month, organizer sees the comb* is ratified as stated.

**Open:** `O3`, `O4`, `O8`, `O9`. No new rows — `ENG-96` amended in place, `DES-38` point 4 promoted from conditional-nicety to sole-source. No new `O`.

**The transferable shape, and it is mine to own:** I ruled *"prefer the live value"* without asking **who is permitted to read it.** A live read and a snapshot are not two implementations of one answer — the snapshot exists **because** the live read is refused, and the fallback word that hid the refusal was the same word I was trying to eliminate. **Before ruling that a stored value should be replaced by a live one, run the read policy for every reader — and check what the existing fallback was actually built to absorb.**

### §1B.35.3 — RULED 2026-08-30: the position rule holds per FIELD and breaks per SENTENCE (`ENG-97`, @Fizz, S)

@Lumen's amendment acceptance is ratified, and their picker ruling is verified at the mechanism: the organizer **is** a `comb_members` row by trigger (`combs_create_owner_membership`, `20260830000002:352-366`), so `comb_co_member_names` is callable by them and covers the member half of *members ∪ connections*. *You celebrate someone you can name* is a flow statement of an RLS fact, which is the right way round.

**But the one-position-one-cause rule is stated over FIELDS, and the render position is a SENTENCE.** `ContributingHive.js:136`, verbatim on `main`:

```jsx
A hive for {hive.subjectName}, from {hive.ownerName}
```

**One render position. Two `'Someone'`-capable words. After the amendment they carry different causes** — `subjectName` emits it for no-name-produced, `ownerName` emits it for permission-refused. The bar @Lumen set (*one position carrying two causes*) is cleared field-by-field and broken by the sentence those fields compose.

**And `ownerName` is broken by the exact mechanism §1B.35.2 just named, on the same two methods `ENG-96` is about to edit.** `listContributingHives:439-443` and `getContributingHive:485-490` are **direct `profiles` reads** (`:450`, `:484`, both `|| 'Someone'`). A comb writer joins **by invite code**; no honeycomb connection to the organizer is implied and usually none exists. So the modal comb writer's screen reads:

> **A hive for Sarah, from Someone.**

The person who invited them into the comb is unnameable.

**This is a comb-era regression, not a pre-existing defect being re-litigated.** For a §18.1 collective hive, `subjectName` is the *owner's typed word* — always real, never `'Someone'`. That sentence rendered *"A hive for Kiddo, from Someone"*: one `'Someone'`, one cause, inside @Lumen's rule. **`comb_open_rotation`'s mint is what introduced a `subjectName` that can be `'Someone'`**, and therefore what broke the sentence.

**And unlike §18.1, a comb HAS a name source — shipped, and called by nobody.** `git grep -rn "comb_co_member_names\|comb_member_count" github/main -- src/` returns **nothing**. The record is §1B.17's own comment beside the function (`20260830000002:372-378`), which names this failure mode exactly: *"an inline profiles subquery here would run as the calling `authenticated` role and collapse under profiles' own RLS."* **That is precisely what `listContributingHives:439-443` does** — an inline client-side profiles read, collapsing under the policy the definer exists to bypass. The comment was written about the server; the same sentence indicts the client, and nobody had cause to read it that way until the mint made both halves of the sentence fail at once.

**`ENG-97` (@Fizz, S) — zero schema change; both functions already exist.** The chain is verified end to end:

1. `comb_rotations_select` (`:498-503`) is `owner or is_comb_member(comb_id)`, so a comb writer may read their own comb's rotations — **hive → `comb_id` is resolvable client-side** via `comb_rotations.hive_id` (`unique (hive_id)`, `:480`).
2. `comb_co_member_names(comb_id)` (`:391-404`) gates on `is_comb_member` and returns every active member's `display_name`; the organizer is one. **The organizer's name comes back.**

Route the contributor-scoped **owner** name through that pair for comb hives. Keep the direct join for §18.1 hives, where no better source exists and `'Someone'` remains the honest answer.

**The subject half does NOT move.** `comb_co_member_names` cannot cover a never-member subject — which is exactly §1B.35.2's ruling that `subject_name` stays the source on these four mappings. The two rulings are consistent and neither generalizes into the other: **the organizer is always a member (fixable by the definer); the subject may be nobody's member (fixable only at the mint).**

**Open:** `O3`, `O4`, `O8`, `O9`. **New row:** `ENG-97`. No new `O`.

**The transferable shape:** an invariant stated over fields is checked over fields, and users read sentences. Two fields can each satisfy *one position, one cause* and still compose a line where a reader cannot tell which cause they are looking at. **When a rule constrains a rendered word, apply it at the smallest unit the reader perceives — the line, not the binding.** Corollary from the same file: a comment written to justify a *server-side* definer is also a diagnosis of every *client-side* join that skipped it — grep the justification, not just the function.

---

### §1B.36 — `ENG-98` filed as one row; the count line's source is wrong in the modal case; the placeholder guard has four citers and no home

**Date:** 2026-08-30. **Trigger:** @Pixel delivered `GUIDES/POLLINATE_V2_DES31_DES39_ROTATION_SHELF.md` flagging three build dependencies unfiled; @Lumen ratified it with two corrections and routed the filing to me, recommending one `M` row rather than three `S` rows. Verified at `github/main@46ce848` and `github/sage/eng92-postmerge-fixes@4632eec`.

#### (a) `ENG-98` (@Fizz, `M`) — "rotation shelf reads." One row, agreed — with a corrected dependency list.

Covers Pixel §3 items 1–3: `listHives` comb-exclusion (embedded left join filtered `is null`), the organizer's combs-with-chapters read, and `listContributingHives`' rotation fields. Lumen's reasoning holds where it binds: item 1 shares `listHives` with `ENG-96`'s `:185` mapping, and item 3 shares `listContributingHives`/`getContributingHive` with **both** `ENG-96` and `ENG-97`. Three separately-sequenced rows in one method family, one owner, is a merge-conflict generator for no gain.

**The dependency list is corrected on one edge:**

- **Not blocked by `ENG-96`.** Post-`§1B.35.2`, `ENG-96`'s live-read leg touches only `:529`/`:583` — the subject's own keepsake reads. Neither is a shelf surface. The four shelf-facing mappings keep frozen `subject_name` as the source, exactly as Lumen's correction (1) to Pixel's doc states. What the shelf actually needs from `ENG-96` is the **guard**, not the resolver — see (b).
- **Blocked by `ENG-97`,** for real, on item 3's methods. Sequence; do not parallelize.
- **Item 2 is the parallelizable half** — a new read against `combs`/`comb_rotations`, colliding with no in-flight row. If @Fizz's queue (`ENG-94`, `ENG-96`, `ENG-97`, `ENG-98`) becomes the bottleneck, item 2 is the piece that can move to another owner without a conflict. Not split pre-emptively: it is the smallest of the three and needs the same guard.

#### (b) The placeholder-class guard is cited by four rows and owned by none.

Citers as of tonight: `ENG-96` (six mappings), `ENG-97` (Lumen's build pin — the definer's returned `display_name` takes the same class filter), `DES-38` (the resolver's class filter, the surviving half), `ENG-98` (chapter labels + the comb card). And `ENG-84` itself declared the client-side branch held open with **no owner named** — `20260830000001:170-178`: *"Downstream UI that live-joins `profiles.display_name` ... will render a blank name for a tombstoned user until it's taught to branch on `deleted_at` instead; flagged here as a deliberate scope boundary, not fixed in this migration."*

Four citers plus a held-open declaration is the homeless-requirement shape of `§1B.34.2`, one evening later.

**RULED: the guard ships in `ENG-96` as one exported helper, and `ENG-97`/`ENG-98`/`DES-38`'s build import it.** Not re-implemented, not copied. Class members verified: `''` (`ENG-84` sets `display_name = ''` at `20260830000001:181`, forced by the column's `not null`) and `'New user'` (`handle_new_user`, `20260808000001:46`). Note the guard branches on the **value**, not on `deleted_at` — which reaches the same rendered word without a second read, and works through the RLS bridge where `deleted_at` is not even selected. `§1B.34.5` applies to its gate: *"one predicate, N callers"* is a claim about call sites, so the gate must assert the **callers**, not the answers.

#### (c) CORRECTION to Pixel `§1.1` / `DES-31`: `comb_member_count` is the wrong source for the count line, and it is wrong in the **modal** case.

`comb_open_rotation` (`20260830000008:174-180`) inserts a `hive_contributors` row for every active comb member **except the subject** — `and m.profile_id <> p_subject_profile_id` — and `hive_contributors_not_hive_subject` (`20260830000002:116-134`) makes that structural rather than a choice.

So for a comb of N members celebrating one of its own: `comb_member_count` returns **N**; the number of people who may write this month is **N−1**. *"Six people are writing"* rendered when five can.

Pixel drew the legality line as membership-vs-participation and picked membership. **There are three queries, not two:**

| # | query | what it answers | verdict |
|---|---|---|---|
| 1 | `count(comb_members where removed_at is null)` | *how big is this comb* | overstates by one whenever the subject is a member |
| 2 | `count(hive_contributors on the open rotation where removed_at is null)` | *this month's writing roster* | **correct** — static all month, no write-status, no fraction |
| 3 | `count(distinct author)` over entries | participation | **barred**, and that bar is untouched |

Every constraint `§1.1`'s rule was protecting — static all month, never write-status, never a per-person list, never a denominator — is satisfied by (2). It is already built: **`comb_rotation_writer_count(p_rotation_id)`**, `ENG-92` Part 2, `20260830000007:87-112`, gated `is_comb_member` and deliberately subject-callable (*"the subject is entitled to know how many people are writing for her this month; only the per-person write-status and content stay contributor-only"*).

**And `ENG-92`'s own comment states the divergence condition backwards.** It reads: the two counts *"diverge the moment `§1B.23.1` lets a non-member be honored."* They **agree** in that case — a subject outside `comb_members` is excluded from neither count, so N = N. They diverge when the subject **is** a member, which is the default shape of a rotating comb. The divergence is not an edge case the non-member ruling introduced; it has been the modal case since the mint shipped. @Sage: one comment line, no behavior change.

Copy is @Lumen's `COPY-6` lane and unchanged in wording; the **source** is a data ruling and it re-points the count line on both cards.

#### (d) The honest source is on an unmerged branch with no PR, and it carries a second fix the same line needs.

`20260830000007` (`sage/eng92-postmerge-fixes@4632eec`) is unmerged and now numbered **below** three merged migrations (`…0006`, `…0008`, `…0009`). Both cards' count line blocks on it.

It also carries **Part 5** (`§1B.24.2`): `delete_own_account` ends the caller's non-owner `comb_members` seats. On `main` today it does not — `20260830000001` sweeps `entries` and `hive_contributors` and stops, because `comb_members` did not exist until the next migration number. So the source that is wrong-by-one is also **wrong-by-tombstone**: a deleted account stays an active seat and keeps being counted as a person who is writing. `ENG-92`'s own header names this at `:34`. Push the branch, renumber, open the PR.

#### (e) Build pin: `0` is the refusal answer on both count functions, and it arrives at the card as a number.

`comb_member_count` puts `is_comb_member(p_comb_id)` in the **WHERE** — `§1B.33`'s fails-open-on-aggregate shape: a non-member gets `0`, not an error, not a null. `comb_rotation_writer_count` improves on it with an explicit `return 0` guard clause: same symptom, legible cause. Either way the render layer receives an integer with no way to tell refusal from fact.

Is `0` ever a real answer here? Not at mint — the mint inserts one row per active non-subject member, `§1B.31.3` floors the derived advance at ≥2 active members, and month 1 is organizer-chosen with the organizer seated by trigger. ***[Vector, 2026-08-30 — §1B.36.10: this sentence uses "active" in BOTH senses, one clause apart — seats for the mint, enrollable persons for the floor — and they were the same set until `ENG-100`. Post-`ENG-100` the reachability claim holds only under the ENROLLABLE reading, and month 1 is EXEMPT from the floor, so `0` at mint is reachable there today: nothing bars an organizer minting month 1 with themselves as subject in a comb of one. The RULING below (suppress, never print a number) is UNCHANGED — @Lumen re-grounded it on cause-ambiguity in §1B.36.7 and it never rested on unreachability. `ENG-100` gains the refusal at the mint.]*** It becomes reachable only if every writer's roster row is closed mid-month, which is a comb with no writers — not a state to print a count for either.

**So: never render the count line at `0`.** Suppress the line; do not print *"Zero people are writing."* @Pixel @Lumen — an empty state, not a number.

**Open:** `O3`, `O4`, `O8`, `O9`. **New row:** `ENG-98`. `ENG-92` gains a one-line comment correction. No new `O`.

**The transferable shape:** a definer that answers a refusal with a **number** cannot be rendered unguarded — the render layer is where `0` stops being a status code and becomes copy. And when a spec names the legal source for a rendered quantity, enumerate every query that could produce that quantity before ruling one in: the rule here was drawn between two candidates and the honest one was a third, already built, on a branch nobody had merged.

---

### §1B.36.1 — the `DES-33` repoint is the same instance, not a second one; the subject's count is post-seal and has a fourth source

**Date:** 2026-08-30. **Trigger:** @Lumen ratified `§1B.36`'s count-source repoint and extended it to `DES-33`'s "Critical Data Precondition," arguing it is *worse* there because on the subject's screen the membership count's `+1` **is the reader**. Verified at `github/main@46ce848` and `GUIDES/POLLINATE_DES33_ROTATION_FRAME_SPEC.md`.

#### (a) Repoint RATIFIED — and it governs the member's view, so it is `DES-31 §1.1`'s instance, not a second one.

`DES-33:41` states the rule generally (*"Any count rendered before seal must name its source: this design shows comb membership via `count(comb_members)`"*), and the surface it actually governs is named two lines later — `DES-33:44`, quoting `DES-21`: *"Member view: contributor count is permitted ('Four of you are writing') / Subject view: roster with NO participation column by design."* The member's view is `ContributingHive`, which is `DES-31`'s card. Same rule, same surface, one instance recorded in two docs. Both get the same repoint to `comb_rotation_writer_count`; neither is worse than the other.

#### (b) CORRECTION: the arithmetic is right, the render is already forbidden by the same doc.

`DES-33:95-99`, component 3, **Subject Mask** — *"Subject sees **no**: Participant count ... Progress indicator ... Per-person write status ... Member roster at all before seal."*

So *"Six people are writing for you"* counting Sarah among the people writing for Sarah is not a live defect: no count reaches the subject before seal at all. The `+1` is real, and it lands on the writer's and organizer's cards — where `§1B.36` already routed it.

#### (c) The real defect at `DES-33:41` is the one directly beside it: `for you` on a surface the subject cannot see.

The precondition defends *"the rotation state line's collective tense (**'are writing for you'**)"* — subject-addressed copy — for a count component 3 masks from the subject, and whose permitted reader (`:44`) is a **member** writing for someone else. This is the identical defect @Lumen corrected in Pixel's `§1.3` mockup (*"Six people are writing **for you**"* on a writer's surface), one doc over and in the sentence stating the *rule* rather than in a mockup.

**RULED: the repair is the sentence, not just the query name.** The tense-defense principle stands word for word — a collective present tense is protecting only if its number is not entry-derived — but its example addressee is wrong. @Pixel: both edits ride the one amendment pass @Lumen already routed.

#### (d) The subject's count is **post-seal**, and its source is a fourth query neither of us enumerated.

`PackageOpen`'s Ending renders *"N people wrote this for you"* plus the roster, and it is already sourced, already ruled, and already shipped: `contributor_names`, frozen at send, `PackageOpen.js:606` — *"`contributor_names` is the single source (§14.2/§14.4)"* — with the count taken as `contributorNames.length` at `:612-617` under a stated bijection with the names rendered at `:621-623`. `listReceivedPackages:534-537` carries the freeze and its reason.

So @Lumen's triad needs a fourth row:

| question | source |
|---|---|
| how big is this comb | `comb_member_count` — landing copy, correct today |
| this month's writing roster | `comb_rotation_writer_count` — member/organizer cards |
| **the delivered roster** | **`contributor_names.length`** — the subject's reveal, frozen at send |
| participation | barred everywhere |

#### (e) And the fourth row is the only one that works for the never-joined subject.

`is_comb_member` (`20260830000002:295-308`) is a `comb_members` row with `removed_at is null`. **Both** count definers gate on it — `comb_member_count` in its WHERE, `comb_rotation_writer_count` in its guard clause — so a subject who never joined the comb, the population `§1B.30.1` deliberately legalized, receives `0` from each. Pre-existing in both candidates and not introduced by this repoint.

It does not bite today, because she has no pre-seal count surface (b). It bites the moment anyone builds one: **never source a subject-facing count from either definer.** `comb_rotation_writer_count`'s header promises *"the subject is entitled to know how many people are writing for her this month"* — true only for a subject who is a comb member. @Sage: worth a clause on the same one-line pass as (c)'s divergence comment, so the promise reads with its condition.

#### (f) Zero-suppression construction and the singular — ratified as stated.

@Lumen's narrowing is correct: on the contributor card `0` is unreachable for its own reader, because the card exists only through that reader's own open seat (`!inner` join on `hive_contributors`, `removed_at` null — `HiveStore.js:431-433`), so a reader who sees the card is themselves ≥1. Suppression exercises on the organizer card only, and on any future subject-facing frame. And the singular is reachable — a two-member comb celebrating one of its own leaves exactly one writer — so *"One person is writing"* ships from day one. `PackageOpen.js:617` already carries the same singular/plural pair for the delivered roster; the in-comb template should read the same way.

**Open:** `O3`, `O4`, `O8`, `O9`. **No new rows.** `DES-33` gains the `for you` repair alongside its repoint; `ENG-92`'s comment pass gains one clause. No new `O`.

**The transferable shape:** a rule and the surface it governs can live three lines apart and still be read as if the rule were general. `DES-33:41` was cited as a subject-facing constraint by everyone including me, and `:44` names its reader as the member while `:95` bars the subject outright — the doc answered the question two ways in one section, and the half that sounded like a principle won. **Before extending a defect to a second document, find the line in that document that names the surface — a precondition stated in the abstract is not evidence about who reads it.**

---

### §1B.36.2 — CORRECTION of my own `§1B.36.1(f)`: the card's roster and the count's roster are different tables, and one population sits between them

**Date:** 2026-08-30. **Trigger:** re-reading `§1B.36.1` before publishing it. Paragraph **(e)** of that section states that both count definers gate on `is_comb_member`; paragraph **(f)**, forty lines later, argues `0` is unreachable on the contributor card from `hive_contributors`. **Those are two different tables, and I wrote both in one commit without crossing them.** Verified at `github/main@46ce848` plus `github/sage/eng92-postmerge-fixes@4632eec`.

#### (a) Three predicates govern that card, and they read three different rosters.

| the card... | predicate | table |
|---|---|---|
| exists | `private_hives_select_own` = `owner_id` **or** `is_hive_contributor(id)` (`20260827000001:202-204`), plus `listContributingHives`'s `hive_contributors!inner … removed_at is null` (`HiveStore.js:431-433`) | `hive_contributors` |
| accepts a write | `entries_insert_own` → `is_hive_contributor(v.hive_id)` (`20260827000001:286`) | `hive_contributors` |
| shows the rotation fold | `comb_rotations_select` = owner **or** `is_comb_member(comb_id)` (`20260830000002:498-503`) | `comb_members` |
| shows the count | `comb_rotation_writer_count`'s guard clause (`…0007:102`) | `comb_members` |

`§1B.36.1(f)`'s argument proves the reader is a member of the **counted set**. It does not prove the reader is **authorized to count**. The gap is one population: a non-owner member who leaves the comb mid-month.

#### (b) That population is reachable, and the constraint set was run before this was written.

`comb_members_update_owner_or_self` (`…0002:338-346`) admits an update by the comb's owner **or** by the member themselves; `comb_members_identity_immutable` (`:215-231`) permits exactly the `removed_at` null→timestamp transition. Nothing anywhere writes `hive_contributors.removed_at` in response — `git grep` over `supabase/migrations/` returns only the immutability trigger and `delete_own_account`'s own sweep.

**Not** a hazard, checked and refused: the **organizer** cannot produce this state. `comb_members_owner_seat_permanent_trigger` (`:239-252`) raises on any `removed_at` set on a row whose `profile_id` owns the comb. The class is exactly one member shape, not three.

**No client path exists today** — `git grep removed_at github/main -- src/` returns only `hive_contributors` reads. The state is policy-reachable and UI-unreachable, which is precisely when it is cheap to rule and expensive to discover.

#### (c) What the departed writer actually sees, and it is larger than a missing count.

Their `hive_contributors` seat is untouched, so the card renders and still accepts entries. `comb_rotations_select` refuses them, so `ENG-98` item 3's embedded rotation read returns **null** — the whole fold goes, not just the count line: no *"Writing for Sarah,"* no *"6 days left."* **A comb hive renders as a §18.1 1:1 hive.** And `comb_rotation_writer_count` returns `0` — `§1B.36`'s refusal-as-a-number, at the surface `§1B.36.1(f)` declared immune, where the honest answer is `N` (their own open row is still in the count).

#### (d) RULED — leaving the comb closes that month's writing seat. `ENG-99` (@Sage, S).

The model's own sentence is *membership is writing rights* (`§8`, "gate the giving, never the getting" — membership is what grants **writing**). A person who has left the comb holding an open writing seat is that sentence half-applied.

**The precedent is already in the tree and it pairs the rosters:** `delete_own_account` closes `hive_contributors` (`20260830000001:160-162`) and, post-`…0007` Part 5, `comb_members` (`…0007:221-228`) — the one existing "a seat ends" path closes **both**. Comb departure closing one is the inconsistency, not the fix.

**Build pins:**
1. Scope the cascade to the **open** rotation only — `hive_id in (select hive_id from comb_rotations where comb_id = old.comb_id and sealed_at is null and voided_at is null)`. A sealed month's roster is historical record; `contributor_names` is frozen at send for exactly this reason (`§14.2`).
2. **Departure ends the writing; it does not retract the written.** Verified, not assumed: `contributor_names` is aggregated from `entries.author_name_at_seal` (`…0009:208-216`), never from `hive_contributors`. A writer who leaves after writing still ships in the keepsake, named. Nothing about `entries` changes.
3. Idempotency has the same shape as `delete_own_account`'s sweep — guard `removed_at is null`, because `hive_contributors_removed_at_immutable` raises on a re-stamp.
4. If the departure empties the roster, the month has zero writers and seals to `voided` by `§1B.16`. Already ruled; no new behaviour.

#### (e) `§1B.36.1(f)` is repaired by `ENG-99`, not refuted by it.

Post-`ENG-99`, one roster governs: a departed member holds no open `hive_contributors` seat, so the card does not render, so its reader is `≥1` again and the construction argument becomes sound. @Lumen's claim and @Pixel's `§1.3` note are true **conditionally on `ENG-99`** and false without it — so the doc should carry the dependency, not the bare claim. Until it ships, `§1.3`'s *"unreachable by construction"* must read as *"unreachable once one roster governs (`ENG-99`)."*

**Open:** `O3`, `O4`, `O8`, `O9`. **New row:** `ENG-99`. No new `O`.

**The transferable shape:** *"the reader is necessarily in the set"* and *"the reader is necessarily permitted to read the set"* are different claims, and an unreachability argument needs the second. I made the first and shipped it as the second — forty lines after writing down, in the same commit, that the count's gate reads a different table than the card's. **When you argue a value is unreachable, name the predicate that produces it and the predicate that admits the surface, and check they read the same row.** The corollary that sized the finding: when two rosters disagree, look for the event that closes one and not the other — that event is the whole population.

---

### §1B.36.3 — `ENG-99`'s trigger fires inside `delete_own_account`, and departure is a one-way door with two effects

**Date:** 2026-08-30. **Trigger:** @Lumen ratified `ENG-99` and its four pins. Probing the hazard the fix introduces rather than re-running the defect it closes. Verified at `github/main@46ce848` and `github/sage/eng92-postmerge-fixes@4632eec`.

#### (a) Pin 3 is not idempotency hygiene — it is what stops account deletion from aborting.

`ENG-99` puts a trigger on `comb_members` update. **`delete_own_account` updates `comb_members`** (`…0007:221-228`, Part 5) — and three statements earlier it has already swept `hive_contributors` (`:213-215`, `set removed_at = now() where profile_id = v_uid and removed_at is null`). Statement order confirmed in the function body.

So during account deletion the new trigger fires against rows that **already carry `removed_at`**. Without pin 3's `removed_at is null` guard, `hive_contributors_removed_at_immutable` (`20260827000001:62-76`) raises — inside a `security definer` function with no exception block — and **the entire deletion transaction aborts.** Account deletion is App Store 5.1.1(v)-required and is the one flow in this codebase that cannot be allowed to fail.

**RULED: pin 3 is load-bearing, not polish.** With the guard on both statements the two become order-independent — `delete_own_account`'s own sweep also guards `removed_at is null`, so neither ordering breaks. @Sage: state that in the trigger's comment, because the next person to reorder those statements needs to know why they may.

#### (b) Departure is irreversible, and nothing in `ENG-99` says so.

`comb_join_by_invite_code` is idempotent for an **active** member and **deliberately not** for a removed one — `20260830000004:24-29`: *"A previously-removed member is NOT idempotent, deliberately: `comb_members_removed_at_immutable` and the table's own PK shape make re-joining unrepresentable ('not even expressible without a delete this table also doesn't allow'), so that path raises a named, distinct exception."*

So post-`ENG-99`, a single tap does three things: ends the membership **permanently**, ends this month's writing seat, and removes the month's card from the shelf (@Lumen's stated consequence). **A leave-comb gesture is a one-way door, and the door is wider than the word "leave."**

#### (c) And leaving does **not** retract the written word — which is the reason someone would tap it.

Pin 2 already says the entry ships. The consequence for the leaver is stronger than "it ships": `entries_update_own` and `entries_delete_own` both gate on `is_hive_contributor(v.hive_id)` (`20260827000001:292-326` and the delete policy repaired in the same migration for exactly C4's contributor case). Once the seat closes, the leaver can **neither edit nor delete** their letter — and `private_hives_select_own` no longer admits the hive, so they cannot read it either.

**Their words are frozen, invisible to them, and still scheduled for delivery.** If the reason a person leaves a comb is that they do not want their letter delivered, leaving is precisely the thing that guarantees it will be.

#### (d) Delivered as a pre-build constraint, not filed as a row.

No leave-comb UI exists (`git grep removed_at github/main -- src/` — `hive_contributors` reads only). Same shape as the `DES-29` picker constraint: state it before it is built, because all three effects are discovered by tapping.

@Lumen — the flow consequence is yours. The honest gesture is either **"leave at the end of this month"** (seat runs out with the rotation, no mid-month vanish, no stranded letter) or a confirmation that names all three effects including the one that surprises people: *your letter still goes.* And if a person needs their letter **not** to be delivered, that is a different verb entirely — delete the entry, then leave — and the order matters, because after leaving they can no longer do it.

**Open:** `O3`, `O4`, `O8`, `O9`. **No new rows.** `ENG-99` pin 3 upgraded to load-bearing with its abort path named; pin 5 added — the trigger comment states the order-independence. No new `O`.

**The transferable shape:** a trigger added for a rendering concern fires inside every function that touches its table, including the one flow that must never fail. **When adding a trigger, enumerate the existing writers of that table before writing the trigger body — a `security definer` function with no exception block converts your raise into its own abort.** And the second half: a one-way door is sized by everything the same tap forecloses, not by the verb on the button. Three foreclosures here, and the doc named one.

---

### §1B.36.4 — row 1 of the four-row table names a function revoked from the reader it serves

**Date:** 2026-08-30. **Trigger:** @Pixel wrote the four-row count-source table into both design docs. Re-reading the row everyone called *"unaffected, correct today."* Verified at `github/main@46ce848`.

#### (a) `comb_member_count` cannot answer the landing.

`20260830000002:426-442`:

```sql
select count(*)::integer from public.comb_members m
where m.comb_id = p_comb_id and m.removed_at is null
  and public.is_comb_member(p_comb_id);
...
revoke execute on function public.comb_member_count(uuid) from anon;
```

Two independent refusals of the landing's reader. **`anon` cannot call it at all** — the pre-auth invite landing is the anon surface by definition, so this is `42501`, not a wrong number. And a signed-in non-member who taps someone's invite link hits the `is_comb_member` predicate **inside the WHERE** and gets `0` — `§1B.33`'s fails-open-on-aggregate shape, the one that returns a plausible number instead of an error.

The row read *"how big is this comb → `comb_member_count` → landing, outsiders only."* **Its gate admits exactly the population the surface excludes.** Third instance tonight of one shape: a source named for a surface whose reader its gate refuses (`comb_rotation_writer_count`/never-member subject, `comb_rotations_select`/departed writer, and now this).

#### (b) The landing already has its own source, built for it, granted to `anon`.

`comb_preview_by_invite_code` (`20260830000006`) carries its own inline leg — `count(*) from comb_members where comb_id = v_comb_id and removed_at is null`, **no membership predicate** — and is granted to `anon` *and* `authenticated`, with the reason stated in-file (`:107-109`): *"Anon-callable by design (the pre-auth landing's whole point) … this function's only authorization input is the code, same for both roles."*

**RULED — row 1 repoints:**

| question | source | surface |
|---|---|---|
| how big is this comb | **`comb_preview_by_invite_code`'s `member_count`** | pre-auth landing; the code is the only authorization |
| this rotation's writing roster | `comb_rotation_writer_count(p_rotation_id)` | member + organizer surfaces only |
| the delivered roster | `contributor_names.length` | subject, post-seal only |
| participation | — | barred everywhere |

**Carry the row's known defect with it:** that leg counts tombstoned members. `ENG-92` **Part 6** (`§1B.32`) already owns the `deleted_at` predicate for it — the landing count is wrong-by-tombstone today, tracked, unmerged in `…0007`. A table row that reads clean when its source has a filed defect is how a defect gets un-filed.

#### (c) The repoint leaves `comb_member_count` with no surface at all.

`git grep -rn "comb_member_count" github/main -- src/` → nothing (`§1B.35.3`). The landing is served by the preview; the member and organizer cards moved to `comb_rotation_writer_count` in `§1B.36`. **Row 1 was the last thing keeping it assigned, and it was assigned to the one surface it cannot serve.**

**RULED: keep the function, unassigned.** Its gate is exactly right for an in-app, member-facing *"this comb has N people"* line — `is_comb_member` matches that reader precisely — and no such surface is designed. It is shipped, uncalled, correct, and **must never be cited for the landing.** `OPS-11`'s grant map documents it either way.

> **SUPERSEDED IN PART, same evening (`§1B.36.5`, below): "no such surface is designed" is FALSE.** I derived it from `git grep … -- src/`, and *designed* does not live in `src/`. `DES-22` `§5`/`§6` item 3/`§8` designs exactly the surface described — an in-app, member-facing count — and ratified it twice (`§1B.21`, `§1B.22`). **"Keep the function" is upheld and is now load-bearing** (`ENG-92` Part 6's `deleted_at` filter on it is a live `DES-22` build dependency, not dead work). **"Unassigned" is withdrawn.** "Never cited for the landing" stands unchanged. Read `§1B.36.5` before citing this paragraph.

**Open:** `O3`, `O4`, `O8`, `O9`. **No new rows** — `ENG-92` Part 6 already owns (b)'s tombstone half. No new `O`.

**The transferable shape:** the row of a source table that nobody argues about is the row to check. Rows 2, 3 and 4 were fought over all evening and are right; row 1 was carried forward as background three times — by @Lumen, by me, by @Pixel — and it was the one naming a function `revoke`d from its own surface's reader. **A source table must state the READER beside the source, because that is the column where a gate mismatch becomes visible.** The table now has it.

---

### §1B.36.5 — `comb_member_count` **is** assigned a surface, and it is the one surface it cannot honestly serve (2026-08-30)

**I withdraw "unassigned" from `§1B.36.4`.** I derived it from `git grep -rn "comb_member_count" github/main -- src/` → nothing. That grep answers *is it called*. The claim I made was *is a surface designed for it*, and **design does not live in `src/`** — it lives in `GUIDES/`. The exhaustive grep for the claim I was actually making is `grep -rln "comb_member_count" --include="*.md"`, which returns a **third** design doc neither `@Pixel` nor I read tonight.

#### (a) The designed surface: `DES-22` `§5` / `§6` item 3 / `§8`

`GUIDES/POLLINATE_V2_DES22_COMB_IDENTITY.md` — Pixel's, **RATIFIED by Lumen then by me** (`§1B.21`, `§1B.22`), status line *"Ready for build against real data."*

- `§6` item 3 names it as one of three `ENG-58` reads: *"**A membership count**, `count(comb_members where removed_at is null)` — needed by `§1.1`/`§5`/`§8`'s amendment, identity-side only, no entries table in the path."*
- `§5` **pins it exclusively**: *"`[N]` sources from `count(comb_members where removed_at is null)` (`§6`, item 3) **and only that read**."*
- The doc's status line already sequences its **entire build** on `and p.deleted_at is null` reaching this function — `ENG-92` Part 6, `§1B.32`.

**So "unassigned" is not merely inaccurate, it is load-bearing in the wrong direction:** believed, it makes `ENG-92` Part 6's filter on `comb_member_count` read as dead work on a function nobody calls, when it is the gating dependency on `DES-22`'s status line.

**"Keep the function" is upheld and strengthened. "Unassigned" is withdrawn. "Never cited for the landing" stands.**

#### (b) And the assigned line is the count-source defect in its worst form

`DES-22` `§5`, subject-view, and `§8`'s subject diagram:

> *"Six people are writing for you. 6 days left."*

sourced from `count(comb_members where removed_at is null)`, rendered **pre-seal**, **to the subject**, with `§8` stating *"this diagram is the query's contract as much as it's a picture."*

Two things, both of which the last four hours already ruled:

1. **@Lumen's own arithmetic, on the screen she derived it for.** A comb of six, Sarah's month, Sarah a member: the query returns **6**, the mint's `<> p_subject_profile_id` exclusion means **5** may write, and **one of the six is Sarah**. *"Six people are writing for you"* counts Sarah among the people writing for Sarah. This is the exact sentence `§1B.36.1` corrected in `DES-33`, on the exact reader Lumen's *"the +1 is the reader"* was written about — and `§5` pins the wrong source with the words *"and only that read."*
2. **`DES-33` `:95-99`'s Subject Mask bars a participant count pre-seal.** In `§1B.36.1` I wrote *"no count reaches the subject before seal at all"* and cited `DES-33` alone. `DES-22` renders one, is ratified, and is ready for build. **Two ratified design docs, opposite answers, same reader, same instant** — and the one I did not read is the one specifying the screen.

#### (c) The repair keeps @Lumen's disclosure argument whole — change the sentence, not the disclosure

`§1.1`'s amendment argument is **sound and survives untouched**: a stranger holding a forwarded invite link already sees the comb's size via the `DES-37` landing preview (`§1B.18`), so barring the subject from that number would be incoherent rather than protective.

That argument licenses disclosing **comb size**. `§1.1` bullet 1 says so in the right words already — *"Who's in the comb — names, as a roster of people who care about you — **and how many**."* **`§5` and `§8` converted the same number into a claim about writing.** Same one-section-two-answers shape as `DES-33` `:41`/`:44`/`:95`, and again the abstract-sounding half won the citation.

**RULED: the subject-view's rotation line renders comb SIZE, never a writing claim.** The number, its source, and its disclosure are all unchanged; the verb is. Once it asks *how big is this comb*, `comb_member_count` is the honest source (row 1's in-app twin — same question, member-facing, which is exactly the reader its `is_comb_member` gate admits), the off-by-one dissolves because size is what it measures, and no participation count crosses the Subject Mask. **@Pixel — `§5`, `§8`'s diagram, and the `§8` caption; `COPY-6`'s final wording is @Lumen's.**

**Checked and NOT a defect, so nobody files it:** a subject who never joined (`ENG-95`'s population, month 1's default) would get `0` from this gate — but `§0` scopes this screen to *"the surface a **member** reaches from the Hive tab,"* so she never reaches it, and her count is the post-seal delivered roster (row 3). Coverage boundary, correctly drawn.

#### (d) `§8`'s member-view diagram draws a denominator, and it is comb size

> *"4 of 6 have written this month"*

Same comb, same six: the ceiling is **5**. *"4 of 6"* on a screen where 6 is unreachable. And `§6` rules that *every count rendered pre-seal states its query source* while naming three reads, **none of which is a source for this line** — so it composes as read 2 aggregated over read 3's denominator, which is the overcount.

`§1.2`'s heading bars a denominator, but `§7`'s gate row scopes the bar to a **capacity** context (*"no numeral `5` (or `20`) … in a capacity context"*), so a **participation** fraction passes the gate as designed. Honest denominator is `comb_rotation_writer_count(p_rotation_id)`. **@Pixel — the diagram; @Lumen — whether a fraction belongs on member-view at all, which is `§1.2`'s call, not mine.**

#### (e) `DES-37` `:128` cleared the landing's copy with the same false binary

> *"the same sentence ('11 people are writing for Sarah') could be satisfied by two different queries, and only membership is permitted on an unjoined landing."*

The premise is right and the inference runs backwards. **Only membership is permitted there — so the sentence must ask what membership answers, not membership be blessed for the sentence.** A comb of five including Sarah renders *"5 people are writing for Sarah"* when four can. `§1B.36.4` fixed that row's **source**; its **copy** carries the identical off-by-one. **@Lumen — `COPY-6`; @Deezine — `POLLINATE_DES37_INVITE_LANDING_SPEC.md` `:54`, `:58`, `:94`, `:128` and `DES-37_INVITE_LANDING_AND_NAME_COLLECTION.md` `:27`, `:50`.**

**Open:** `O3`, `O4`, `O8`, `O9`. **No new engineering rows** — every fix here is copy or a diagram; `ENG-92` Part 6 already owns the only schema half, now with its dependency correctly named. No new `O`.

**The transferable shape:** `§1B.36.4` closed on *"a source table must state the READER beside the source."* It does — and I then answered *is a surface designed for this?* with a grep over `src/`, which can only answer *is it called*. **A design decision's evidence lives in the design docs; when you rule that something is unassigned, grep the docs that assign it.** Second half, and it is the one that cost the most: `DES-22` was ratified by both of us, is marked ready for build, and renders the exact sentence we spent four hours correcting on two other surfaces — **an arc that corrects a defect on the surfaces it was reported on has not swept the class.** The doc nobody cited tonight was the one specifying the screen.

---

### §1B.36.6 — @Lumen is right about the delete right; the right has no caller, and chasing that grep found four false sentences in the shipped Privacy Policy (2026-08-30)

**@Lumen's refutation of `§1B.36.3` item 3 is correct, and it is correct on TWO verbs, not one.** I wrote *"their words are frozen, invisible to them, and still scheduled for delivery."* Verified on `github/main@1a9a017`:

- **"frozen" — upheld.** `entries_update_own` (`20260827000001:292-326`) gates on owner-or-`is_hive_contributor`. A departed writer cannot edit.
- **"cannot delete" — REFUTED.** `entries_delete_own` (`:380-389`) is `auth.uid() = user_id and (hive_id is null or is_volume_open(volume_id))`. No contributor predicate. The 20-line comment above it names our case in advance: *"a contributor who has since been removed can still delete their own already-written entries while the volume stays open … `is_volume_open()` checks the fact directly, without going through `hive_volumes`' own RLS, so it answers the same regardless of the caller's current standing on the roster."* C4, deliberate, shipped 08-27.
- **"invisible to them" — REFUTED.** `entries_select_own` (`20260808000001:125-127`) is bare `auth.uid() = user_id`, and the restrictive `entries_select_respect_visibility` (`20260813000004:115-117`) passes for the author by its first disjunct. Their own words stay readable to them.

I cited one migration and read one policy in it. The two policies with opposite answers are 90 lines apart in the file I quoted.

#### (a) The escape hatch has no handle — and it never had one

@Lumen's flow item 3 puts *"Delete my letter and leave"* in the confirmation as a secondary action, on the ground that *"the policy layer already built the escape hatch; the flow's job is to put a handle on it."* **There is no handle to move. There is no entry-delete path anywhere in the client.**

`git grep -n "\.delete(" github/main -- src/` returns six hits — `honeycomb_connections`, `likes`, `seeds`, and three JS `Set`/`Map` calls. **None on `entries`.** `EntryStore.js` has no delete method (`git grep -n delete … EntryStore.js` → nothing). The only delete-shaped RPC in `src/` is `delete_own_account`. The codebase states it itself, at `HoneycombTab.js:100`: *"nothing in `src/` deletes an entry or a share."*

So `entries_delete_own`'s widened rule — the fix ENG-58 shipped specifically so C4's promise would not be broken on day one — **has never been executed by any product path.** Even `delete_own_account` doesn't exercise it: it is `security definer` and says so (`20260830000001:140-143`, *"the delete below is the authorization, not a policy this statement is subject to"*). Policy-correct, gate-covered (`check-multi-writer-hives.mjs`, `check-private-hives-seal.mjs`), product-absent. Third instance tonight of shipped-and-uncalled, after `comb_co_member_names` and `comb_member_count`.

**@Lumen — item 3 is not a copy row. The secondary action needs an `EntryStore.deleteEntry` and a call site, and that is an `ENG`.** Not filing it into MVP-Comb: you ruled no leave-comb UI in MVP-Comb, and this gap is not comb-introduced — it is C4's, open since 08-27, and it equally means a **§18.1 contributor** cannot delete a letter they wrote into a friend's hive. It belongs with the leave-comb row when that files, and the sequencing pin doubles: **a leave-comb row deps `ENG-99` AND an entry-delete path**, because the compound gesture is what makes the door honest.

#### (b) The order is not free — @Lumen's "unraceable" holds under success and breaks under partial failure

Two client-sequenced PostgREST calls, no transaction, no RPC that does both. **Under success, @Lumen is right and my `§1B.36.3` reasoning was wrong:** `is_volume_open` is a definer with no roster input, so delete-after-leave succeeds. Either order works.

**Under partial failure they are not equivalent, and only one is recoverable:**

| order | first call succeeds, second fails | recoverable? |
|---|---|---|
| leave → delete | out of the comb, letter still live, card gone, **no surface can reach it** | **no** — permanently, membership is irreversible (`20260830000004:24-29`) |
| delete → leave | letter gone, still in the comb | **yes** — tap leave again |

**So "the order matters" survives, for a different reason than I gave.** Not because the policy forbids the second verb — @Lumen proved it doesn't — but because the client cannot make the pair atomic, and the two partial states have different exit costs. **Delete first.** Build pin, not copy.

#### (c) The delete right is bounded by the VOLUME, not by the departure

`is_volume_open` reads `hive_volumes.sealed_at`, and **the void path seals too** — `seal_and_send_rotation`, `20260830000003:88-89` (*"void always seals-and-preserves"*), setting `sealed_at` on both the volume (`:217`) and the hive mirror (`:223`) on every branch. So the window is *until this month's seal*, which for someone leaving late in a rotation may be hours. The confirmation cannot promise *"you can still delete it later"* — after the seal it is `packaged` and the delete is refused. **State the window or don't state the right.**

---

#### (d) And the grep that proved (a) walked into the Privacy Policy

I checked `legalCopy.js` for a deletion promise, expecting to find one sentence to reconcile. **Four of its sentences are false about the shipped app**, and the cause is dated.

`473ac3b`, **2026-08-11** — commit message: *"Real Privacy Policy and ToS copy, **written to what the app actually does**."* True when written. **`c4fe6a4`, 2026-08-13 — "P0-2: EntryStore -> Supabase"** moved every entry off the device (`EntryStore.js:6`, *"Supabase-backed as of P0-2 — was a single AsyncStorage…"*). The policy has been touched once since, on 08-17, for an unrelated Day-1 chips change.

| line | shipped sentence | why it is false |
|---|---|---|
| `:215` | *"Unshared entries are not covered by any of this, because they never leave your phone."* | Every entry is a Supabase row since `c4fe6a4`. There is no local-only entry path. |
| `:228` | *"Entries you never shared are not ours to delete — removing the app removes them."* | Same cause — and this is the sentence **disclaiming a deletion duty the app now has.** |
| `:227` | *"We have not built these controls into the app yet, which is why this is an email rather than a button."* | `ENG-84` shipped the button: `App.js:309` registers it, `Account.js:218` navigates to it, `DeleteAccount.js:32` calls `HoneycombStore.deleteAccount()`. |
| `:221` | *"When an account is deleted, the entries, shares, comments, likes and connections attached to it are deleted with it."* | **Unqualified where the code is deliberate.** `delete_own_account` deletes only `where user_id = v_uid and (hive_id is null or is_volume_open(volume_id))` — **sealed hive entries survive**, keep `author_name_at_seal`, and **still deliver to the subject.** That is ENG-84's ruled keep-and-disclose position (`…0001:144-149`). Delete your account and a letter with your name on it still arrives. |

**`:221` is the one that is not a copy fix.** The other three describe an architecture that changed; `:221` describes a position we deliberately hold and the policy states the opposite of. **@Colin — that is a disclosure ruling, not a wording choice:** does keep-and-disclose get disclosed at deletion time, in the policy, and in the `DeleteAccount` screen's own confirmation? The screen is where a person decides.

#### (e) The launch gate on this file checks placeholders, not premises

`LEGAL_COPY_READY = Object.values(FILL).every(isPublished)` (`legalCopy.js:148`) — four values: legal entity, contact address, hosting region, effective date. **The publish gate is entirely a blanks-filled check.** And `check-legal-consent-gate.mjs` — the one instrument that fires on the transition, and a genuinely good one, self-deleting by construction — fires about the **consent checkbox**, not the document's accuracy.

**So on the day someone fills four blanks, the Privacy Policy publishes with four false sentences, and the only gate that reds asks whether a checkbox came back.** Nothing in the tree asserts that a claim about the architecture still matches the architecture.

**`LEGAL-2` (owner @Colin to route; facts verified here, wording @Lumen via `COPY-6`, `:221`'s position @Colin).** **Not an MVP-Comb blocker** — `OPS-10`'s EAS internal distribution faces no review. **It is a submission blocker** for `11.1` TestFlight and anything past it, and it is independent of `LEGAL-1`, which is parked on `C5` for the nectar layer. This is shipped copy that is false about shipped code, today.

**`OPS-12` (@Bumble, S) — a premise tripwire on `legalCopy.js`.** Not a general truth-checker. The narrow, real form is the same shape as the `/nudge/i` instrument's rejected sibling done right: assert that the file contains **no sentence claiming device-local storage** while `EntryStore` holds a Supabase client, and **no sentence claiming a control is unbuilt** while a screen for it is registered in `App.js`. Both premises are greppable in the code, both are exactly what went stale, and both are self-deleting once the copy is corrected.

**Open:** `O3`, `O4`, `O8`, `O9`. **New rows:** `LEGAL-2`, `OPS-12`. **No new `O`** — `:221`'s disclosure question is inside `LEGAL-2`, not a separate open item.

**The transferable shape:** all evening we asked whether a source's **gate** matched its surface's **reader**. A sentence in a legal document is the same object one layer out — a claim about the system, with a premise, and no gate. `entries_delete_own`'s comment was *more current than my citation*; `legalCopy`'s was *less current than the code it described*; both drifted because prose has no compiler and no `git grep` finds a premise. **A commit message that says "written to what the app actually does" is a timestamp, not a property** — it dates the last moment the claim was checked, and here the architecture moved two days later. When an architectural commit lands, grep the prose that described the old one.

---

### §1B.36.7 — @Sage's `now()` correction is right and I verified it independently. `ENG-99` also forks the two consumers of one count, and `C1`'s exclusion rule carries a premise `ENG-99` breaks (2026-08-30)

#### (a) Pin 3's mechanism — @Sage's correction RATIFIED, verified in the source, not re-argued from their report

`hive_contributors_removed_at_immutable` (`20260827000001:64-72`) raises on
`old.removed_at is not null **and** new.removed_at is distinct from old.removed_at`.
`delete_own_account`'s `hive_contributors` sweep and `ENG-99`'s trigger UPDATE both write
`now()`, and `now()` is `transaction_timestamp()` — frozen for the calling transaction.
Same row, same transaction, identical value: `is distinct from` is **false**, the raise
condition never evaluates true. **My abort path does not exist**, and @Sage found it by
running the thing rather than reading it. The guard stays for the reason they proved
instead — cross-transaction re-entry across a real clock gap — which is a narrower claim
and a true one. Their comment is now the record; the original claim is not repeated
uncited anywhere it landed.

I also checked the abort I *would* have raised next, and @Sage had already closed it:
`delete_own_account`'s `comb_members` sweep carries `not exists (… c.owner_id = v_uid)`,
so an organizer's own seat is never attempted and
`comb_members_owner_seat_permanent_trigger` never fires inside the deletion transaction.
`O8` stays a product question and deletion stays independent of it.

#### (b) The finding: `comb_rotation_writer_count` has two consumers, and `ENG-99` moves it correctly for one and wrongly for the other

The function counts `hive_contributors where removed_at is null` (`…0007:157-160`).
`ENG-99` stamps `removed_at` on comb departure. So the number now moves on a new event —
and it serves **two different questions**:

| consumer | the question | is the departed writer counted? |
|---|---|---|
| the member/organizer card | *"how many people are writing for Sarah this month"* | **correctly no** — they have left; they are not writing |
| `C1`, per Part 2's own header (*"the correct `C1` denominator"*) and §6 | *"what share of the people who could write, wrote"* | **wrongly no** — see below |

Until `ENG-99` those were the same number. **They are not the same number any more, and
the migration comment still says they are.**

#### (c) `C1`'s exclusion rule states its own premise in prose, and `ENG-99` is the population where that premise is false

§6's `C1` row carries my `§1B.26.3` annotation verbatim:

> *"also exclude anyone whose `hive_contributors.removed_at` falls inside the rotation
> window. **A mid-month account deletion removes the writer *and* deletes their letter**,
> so leaving them in the denominator reports a healthy comb as failing."*

The justification names **account deletion**, and it is load-bearing: `delete_own_account`
deletes the unsealed entry (`where user_id = v_uid and (hive_id is null or
is_volume_open(volume_id))`) in the same transaction that closes the seat. Numerator −1,
denominator −1. **Symmetric, and the exclusion is right there.**

`ENG-99` creates a second population with the **identical on-disk signature** —
`hive_contributors.removed_at` set inside the window — and the opposite entry behaviour.
Pin 2 is explicit and I verified it: the letter survives, ships, and is named. So the
rule, applied unchanged, is wrong in both possible implementations of the numerator:

| how `ENG-89` counts the numerator | 11-writer comb, all 11 write, 1 leaves on day 28 | 11-writer comb, 6 write, 5 non-writers leave |
|---|---|---|
| distinct entry authors in the volume | 11 / 10 = **110%** | 6 / 6 = **100%** |
| surviving roster rows that have an entry | 10 / 10 = 100% | 6 / 6 = **100%** |

**The second column is the one that matters and it is the modal case.** The people who
quit a comb are disproportionately the people who were not writing — so the exclusion
removes the failures from the denominator preferentially. **Quitting the comb is the
single strongest negative signal `C1` exists to detect, and `ENG-99` erases it from the
measurement.** A comb that lost five of eleven members reads 100% participation.

**Ruled — the exclusion is keyed on the CAUSE, not on the column.** The discriminator is
already on disk and needs no schema: `delete_own_account` stamps `profiles.deleted_at` in
the same transaction (`…0007:283-287`); a comb departure leaves it null.

> **[SUPERSEDED ON PREDICATE, UPHELD ON CAUSE — @Lumen, §1B.36.8, 2026-08-30. The two
> bullets below are right that the exclusion keys on the CAUSE and wrong about which
> on-disk fact records it. `deleted_at is not null` is a state read at MEASUREMENT time
> standing in for a cause fixed at STAMP time; a quit-then-delete-later writer answers it
> and re-inflates `C1` past 100%. The predicate is `hive_contributors.removed_at =
> profiles.deleted_at`. Read §1B.36.8 before either bullet.]**

- **`removed_at` inside the window AND `profiles.deleted_at is not null`** — account
  deletion. **Excluded** from the denominator, exactly as `§1B.26.3` ruled. Unchanged.
- **`removed_at` inside the window AND `profiles.deleted_at is null`** — comb departure.
  **Stays in the denominator**, and their surviving entry stays in the numerator. The
  ratio cannot exceed 1 and a quit reads as a quit.

**`ENG-89`, @Fizz — this is a definition change, not a new row.** `ENG-89` is unbuilt
(`git grep -c analytics github/main -- src/` returns three files, none of them an
instrument), so this costs nothing today and is expensive to discover from a seeded
cohort's data six weeks out. §6's `C1` row is corrected in place, below.

**@Sage — one comment clause on `…0007` Part 2 while it is still unmerged and @Fizz is
holding the push:** the function is *the member/organizer card's count*, and it is
`C1`'s denominator **only before `ENG-99`**. Post-`ENG-99` `C1` reads the same roster with
the cause discriminator applied. One sentence, same file, no code change — and it belongs
next to the function because that header is where the next person will look for the
denominator.

#### (d) And my own `§1B.36` build pin loses its reason, not its conclusion

I pinned *"never render the count line at `0` — suppress, not 'Zero people are writing'"*
and justified it with **"a real `0` is unreachable at mint."** That was true when the only
`0`s were refusals. Post-`ENG-99` a real `0` is reachable mid-month — every writer leaves
— so the value now has **three** causes: refusal (non-member), refusal (never-joined
subject), and an empty roster. **The pin stands and gets stronger**: suppression is the
right handling for all three, and it is now the only handling, because nothing at the
render boundary can tell the three apart. What changes is the reason, from *"`0` is always
a refusal"* to *"`0` is ambiguous among three causes."* Second unreachability claim
tonight repaired rather than refuted, same shape as @Lumen's — and the same cause: an
unreachability argument is indexed to the set of writers that existed when it was made,
and `ENG-99` is a new writer.

#### (e) `DES-37` verified as amended

@Deezine's edits are in the files: `:57` is *"[N] people are in this comb (membership
count, not writer count)"*, `:94`'s layout carries the same, `:128` names
`comb_preview_by_invite_code`'s `member_count` and its `anon` authorization, and the
small-N variant table in the companion doc matches. The `Problem` list's *"does not show
who they are writing for"* (`:30`) is the dead-end screen's defect, not a competing rule —
fact 2 answers it with the subject, which is a frame and not a count. No conflict.

**Open:** `O3`, `O4`, `O8`, `O9`. **New rows:** none. **No new `O`.**

**The transferable shape:** a justification written in prose beside a rule is a **condition
on that rule**, and it survives exactly as long as the population it was drawn from is the
only one with that signature. `§1B.26.3` said *"a mid-month account deletion removes the
writer **and** deletes their letter"* — the `and` is the whole rule — and then stated the
predicate as a bare test on `removed_at`. `ENG-99` did not break the rule; it minted a
second population that answers the predicate and fails the premise. **When you add a
writer to a column, find every rule that reads that column and check its stated reason,
not its stated test.** The tests all still pass; the reasons are where the divergence is.

---

### §1B.36.8 — @Lumen is right: my `C1` predicate reads the cause where it is MEASURED, not where it was WRITTEN. Equality is the fix, and both its operands are immutable BY TRIGGER (2026-08-30)

#### (a) The defect, verified in the source

`§1B.36.7(c)` ruled the exclusion keys on the **cause** — upheld — and then wrote the test
as `profiles.deleted_at is not null`. @Lumen's counter-case reproduces in the source:

A writer writes, **quits the comb** on day 28 (`ENG-99`'s trigger stamps
`hive_contributors.removed_at = T1`; Pin 2 keeps the letter, it seals and ships named via
`entries.author_name_at_seal`), then **deletes her account three weeks later**
(`profiles.deleted_at = T2`). `delete_own_account`'s `hive_contributors` sweep is
`removed_at is null`-guarded (`…0007:263-265`), so the day-28 stamp is untouched, and the
sealed letter survives deletion by design.

Recompute `C1` for that window under my predicate: `removed_at` in window **and**
`deleted_at is not null` → classified as account deletion → **excluded from the
denominator while her sealed entry sits in the numerator. 11/10 = 110%, and the quit is
retroactively erased.** The premise `§1B.26.3` states in prose — *"account deletion
removes the writer **and** deletes their letter"* — is false for this person: the deletion
came after the seal and deleted nothing.

**That is exactly the shape `§1B.36.7` was written against, committed one hour later by
its own fix.** A cohort metric recomputed from live tables must be invariant under writes
that land after the window closes. `is not null` is not; it is a state read standing in
for an event.

#### (b) RULED — the predicate is `removed_at = profiles.deleted_at`

@Lumen's amendment, adopted verbatim in direction and mechanism:

- **`removed_at = profiles.deleted_at`** → this seat was closed **by** the deletion.
  **Excluded.**
- **`removed_at <> deleted_at`, or `deleted_at` null** → the seat closed for some other
  reason. **Stays in the denominator**, surviving entry stays in the numerator.

The mechanism is @Sage's `now()` proof, reused as a discriminator rather than as a
refutation: when account deletion is what closed the seat, both stamps land in one
transaction, and `now()` = `transaction_timestamp()` makes them **identical** —
`…0007:263-265` (sweep), `:271-279` (comb_members), `:283-284` (tombstone), and `:440-441`
(the `ENG-99` trigger firing inside that same transaction) all write the same value. The
same probe that refuted my abort path is the predicate my exclusion needed.

#### (c) The half neither of us stated, and it is the strongest argument for equality

**Both operands are immutable-once-set, enforced by their own `before update` triggers, on
`main` today:**

| operand | guard | migration |
|---|---|---|
| `hive_contributors.removed_at` | `hive_contributors_removed_at_immutable` | `20260827000001:66-68` |
| `profiles.deleted_at` | `profiles_deleted_at_immutable` | `20260830000001:82-84` |

So the classification is not merely *stable under recomputation* — it is **unfalsifiable
by any later write, by schema**. `is not null` fails precisely because `deleted_at` has a
legal `null → T` transition after the window; equality is untouched by that transition
because `removed_at` was already frozen at `T1 ≠ T2`. This upgrades @Lumen's *"stable
forever"* from a convention to a constraint someone would have to drop a trigger to break.

#### (d) One correction to the amendment: name the class as a UNION, not as "departure"

`removed_at <> deleted_at` does not mean *"comb departure."* It means **"not closed by
account deletion,"** and that is a union. I enumerated every writer of
`hive_contributors.removed_at` on `main@22f9027`:

1. `delete_own_account`'s sweep (`…0007:263-265`) — equality holds. Excluded.
2. `ENG-99`'s trigger (`…0007:440-441`) — comb departure. Stays.
3. **`hive_contributors_update_owner`** (`20260827000001:261-264`) — the RLS policy lets
   the **hive owner**, which for a comb-minted hive is the organizer, stamp `removed_at`
   directly. An **organizer eject**. Stays, `deleted_at` null.

Writer 3 has **no client caller today** — `git grep -n removed_at github/main -- src/`
returns six hits, all reads (`HiveStore.js:339,357,371,373,431-433,465-468`,
`InviteContributor.js:61` a comment); there is no leave-comb UI either. So writer 3 is
**latent, not live**. But `InviteContributor.js` shipped and its sibling verb is one
screen away, and the moment it lands an organizer-ejected writer enters `C1`'s denominator
silently. **Whether an organizer eject should count as a participation failure is a
product question, not an engineering one** — I am not answering it here and it is not an
`O`, because the predicate's behaviour is correct-by-default (stays in) and the question
only becomes live when the eject verb is built. **The pin is on the gloss:** `ENG-89` must
document the exclusion as *"closed by account deletion"* and never as *"not a departure"*,
or the next reader freezes a two-member class that already has three. Same failure as
`§1B.32`, where a named class went stale one commit after it was written.

#### (e) Residual, and its direction

@Lumen's named residual — two distinct transactions sharing a microsecond
`transaction_timestamp` **and** touching the same person — stands, and is negligible.
One more, in the safe direction: a retry of `delete_own_account` after a partial first
call would stamp a still-null `removed_at` at `T2` against a frozen `deleted_at = T1`,
classifying an account deletion as *not* one. **Ground corrected by @Lumen's
ratification and adopted: this is not merely unreachable, it is unrepresentable.**
`delete_own_account` is one PL/pgSQL function with no exception handler (its only
`exception` tokens are its own `raise`s), so it is one transaction — a first call cannot
commit `profiles.deleted_at` while leaving `hive_contributors` unswept, and the partial
state the residual requires never exists on disk. *"Unreachable because sessions end"*
invites someone to re-derive reachability the next time auth changes; *"unrepresentable
while this is one transaction"* names the invariant **and the exact edit that breaks it**
— splitting the function, or adding an exception block, which is a subtransaction and
therefore the object `§1B.31.3` already warns rolls back one arm and retries forever.
Its error is
**over-inclusion in the denominator** — `C1` reads low, never high. `is not null` commits
the opposite error, always, and reads high. When a discriminator can only be approximate,
pick the one whose failure understates the metric that decides the business.

#### (f) Routing

`ENG-89` definition change, no new row — `ENG-89` is unbuilt, so this is still free.
No gate reads the `C1` predicate (`git grep -rln C1 github/main -- scripts/` returns ten
files, all colour/layout gates matching the substring), so this is documentation-only
until `ENG-89` is built.

@Sage — the clause to re-word is at `88617e7:145-147`: *"must key on `profiles.deleted_at`"*
becomes *"must key on `removed_at = profiles.deleted_at` (same-transaction identity, per
Part 7's own `now()` proof — both operands frozen by their immutability triggers), not on
a bare `deleted_at is not null`, which lets a post-seal account deletion reclassify an
earlier quit."* @Lumen's routing fact verified independently in my shell: `github/main` is
already at `22f9027`, `88617e7` is one comment-only commit fast-forward from main's tip,
so the sharper predicate lands in the same touch if the re-word goes first.

**The shape:** `§1B.36.7` said to check a rule's stated **reason**, not its stated test —
and then wrote a test that reads the reason's *residue* instead of its *event*. A cause is
recorded by the transaction that caused it; anything you read later is a state that has
had time to change. **When you classify by cause, key on a fact frozen at the moment the
cause fired — and prefer operands the schema forbids from moving.** 📈

---

### §1B.36.9 — the `C1` exclusion ranges over roster ROWS, and I enumerated the writers of a COLUMN. A third state exists: an OPEN roster row minted for a tombstoned profile (2026-08-30)

`§1B.36.8` closed the class at three members and @Lumen's producer sweep confirmed it —
three writers of `hive_contributors.removed_at`, no fourth. **Both sweeps are correct and
both answer the wrong question.** `C1`'s exclusion is a rule about *which roster rows count*;
enumerating the writers of `removed_at` enumerates only the rows the rule can *close*. It
says nothing about who can **open** one. The producer sweep found the single `insert into
public.hive_contributors` (`…0008:175`) and dismissed it — *"sets `hive_id, profile_id,
invited_by`, never `removed_at`"* — which is exactly why it is the hazard: the row it mints
has `removed_at` **null**, so neither the retired predicate (`deleted_at is not null`) nor
the ruled one (`removed_at = deleted_at`) can ever fire on it. Both are keyed on a *closed*
seat. This is an *open* seat belonging to an account that no longer exists.

#### (a) The path, every leg verified at `main@22f9027`

1. `delete_own_account` sweeps the caller's `comb_members` seats **except their own
   organizer seat** — `not exists (… c.owner_id = v_uid)`, `…0007:271-279`. Deliberate and
   load-bearing: `comb_members_owner_seat_permanent_trigger` (`…0002:250-252`) raises on any
   `removed_at` set on an owner row, and that raise inside the deletion transaction would
   abort the whole deletion. Part 5's header says so and defers the product question to `O8`.
2. So a tombstoned organizer keeps a **live** `comb_members` row. `combs.owner_id` references
   `profiles(id)`, and `profiles` survives deletion by construction — `profiles_id_fkey` was
   **dropped** by `ENG-84` (`20260830000001:44`) precisely so `delete from auth.users` does not
   take the tombstone with it. The comb, its owner row, and the organizer's seat all outlive
   the account, whichever way `O8` lands.
3. `comb_open_rotation` is `grant execute … to service_role` (`…0008:209`) and its ownership
   gate is `if auth.uid() is not null and auth.uid() is distinct from v_owner_id` — a **null**
   `auth.uid()` passes. This is not an oversight; `:103-118` argues at length that the clock
   must pass, and `:200-202` names the caller: *"month N+1, the clock's future
   `comb_advance_rotation` wrapper."*
4. That mint's roster snapshot is `comb_members where removed_at is null and profile_id <>
   subject` (`…0008:174-180`). The **subject** is checked for a tombstone at `:150-156`
   (`raise … subject has deleted their account`). The **contributors are not checked at all.**

**Therefore: once the clock's wrapper exists, every rotation it mints in a comb whose
organizer deleted their account enrols the tombstoned organizer as a writer — a fresh
`hive_contributors` row, `removed_at` null, `display_name = ''`.**

#### (b) What it costs, in order

| consumer | effect |
|---|---|
| `C1` | the denominator gains a person who **cannot authenticate**, so cannot write. Structural, every month, one whole person per affected comb — 8–20% of a 5–12 member comb, against a **60%** bar. |
| `comb_rotation_writer_count` (`…0007:155-160`) | no `profiles` join, no `deleted_at` filter — verified. The member/organizer card reads *"12 people are writing for Sarah"* when 11 can. |
| the reveal roster (`DES-21`) | a contributor whose live `display_name` is `''`. The mint's `coalesce(nullif(…),'Someone')` covers the **subject** name only. |

Direction is **over-inclusion → `C1` reads low**, which satisfies `§1B.36.8(e)`'s own
preference. That saves it from being a false-positive on the business decision, and does not
save it from being wrong: this is a *systematic* low, not a residual, and it lands hardest on
the smallest combs.

#### (c) RULED — the roster snapshot must exclude tombstoned profiles, and this is not `ENG-94`

The fix is one predicate on the snapshot: `and not exists (select 1 from public.profiles p
where p.id = m.profile_id and p.deleted_at is not null)`.

**Not the deletion path.** Closing the owner's seat in `delete_own_account` is the abort @Sage
proved; the exemption stays.

**Not folded into `ENG-94`'s acceptance.** `ENG-94` is the `create or replace` that repoints the
**subject** predicate into `comb_subject_gone` (`§1B.34.2`), and it is the correct *migration*
to carry this — same function, same file, an already-legitimate rewrite of the body. But the
roster is a **different object** from the subject, and a requirement filed under a ticket titled
*"subject-gone repoint"* is marked done when the subject line is repointed. **New row `ENG-100`,
landing in `ENG-94`'s migration, with its own acceptance line** — shared artifact, separate
acceptance. ***[Vector, 2026-08-30 — §1B.36.10: `ENG-100` gains a SECOND acceptance line on the
same `create or replace`: after the roster snapshot, `get diagnostics` the `row_count` and refuse
the mint at zero, by name. Month 1 is exempt from §1B.31.3's floor, so the mint is the only place
an empty writing roster is observable.]*** This is `§1B.34.2`'s own rule about not conjuring a function from the wrong
migration, applied to the ticket boundary instead of the file boundary.

**Write it as the general predicate, not as "exclude the organizer."** A non-owner member who
deletes their account is already excluded — their `comb_members` seat *is* swept — so the
tombstoned organizer is the only member of this class **today**, and the owner-seat exemption
is the only reason the class is non-empty. Naming the class by its one current member is
`§1B.32` again, one file over.

**Free today.** `comb_advance_rotation` does not exist: `git grep -n comb_advance_rotation
github/main -- supabase/ src/ scripts/` returns exactly one hit, the comment at `…0008:201`
that names it as future work. `ENG-89` is unbuilt. Nothing on `main` can produce this row yet.

#### (d) The shape

The trigger that creates the hazard states its own justification: *"A comb without an organizer
present is a broken invariant no downstream code (`comb_rotations`' subject check, **the roster
read**) is written to handle"* (`…0002:232-236`). It is right, and it guarantees **the seat, not
the person.** The roster read then consumes seat-presence as a proxy for *someone who can write*,
and account deletion is the one event that separates those two facts.

**When a rule filters a set, enumerate the writers of the SET, not the writers of the column the
filter reads.** A producer sweep that dismisses an `insert` because *"it never sets the filtered
column"* has found the one row the filter can never touch — that is the finding, not the
all-clear. Corollary, third time tonight: an exemption granted to keep one transaction safe
(`§1B.24.2`'s owner-seat skip) hands a new state to every consumer downstream of it, and the
comment recording the exemption is written in the vocabulary of the transaction it saved, never
of the consumers it changed. 📈

---

### §1B.36.10 — the coupling pin is right and its ground is a **term collision**, not a missing coupling. `ENG-100` does not create the hazard; it makes a word that had one referent have two. And the floor is in the CALLER — the mint has no floor at all (2026-08-30)

**Date:** 2026-08-30. **Trigger:** @Lumen ratified `§1B.36.9` and pinned a coupling: `§1B.31.3`'s
≥2-active-members floor *"counts SEATS, and `ENG-100` makes the mint enrol PERSONS,"* so a comb of
two whose organizer tombstoned passes the floor and mints a rotation with zero contributors,
forever. **The hazard is real and the pin is adopted. The premise is wrong on the text, and the
correct ground makes the fix bigger than the floor.** Every leg verified at `github/main@22f9027`.

#### (a) The floor was already ruled over the tombstone-filtered set — in this section's own words

`§1B.31.3(ii)` does not read `comb_members.removed_at is null`. It opens by quoting Ruling 1's skip
list — *"skips `removed_at`-closed **and tombstoned** seats and nobody else"* (`§1B.31`, decision 1:
*"skipping any seat closed by `removed_at` or **whose profile is tombstoned**"*) — and then says the
ruling *"never states **how many must remain**."* How many must remain **of that set**. The walk
that produces the number counts *"the only **eligible** member."* Row `1.9a` carries the same skip
list for the subject order.

**So the floor already means enrollable persons.** @Lumen's failure case still lands, because two
readers can honestly get the other answer:

1. **Row `1.9a`** — what @Fizz builds from — states the skip list on the *subject order* clause and
   then states the floor as a separate sentence with **no population named**. Seats is a legitimate
   read of that row in isolation.
2. **`§1B.36(e)`** uses the word **twice in one sentence, in both senses**: *"the mint inserts one
   row per **active** non-subject member, `§1B.31.3` floors the derived advance at ≥2 **active**
   members."* First is seats, second is persons.

#### (b) The real shape: `ENG-100` splits a referent, it does not break a coupling

**Before `ENG-100`, the two readings were extensionally identical at the mint.** The snapshot at
`…0008:175-180` filters `removed_at` and the subject and touches `profiles` not at all — so seats
and enrollable persons produced the **same rows**, and no reading of "active" changed any outcome.
`ENG-100` is the event that separates them. Nothing was miscoupled; a word that had one referent now
has two, and every sentence using it has to be re-read.

That is `§1B.32`'s lesson raised one level: **a ruling that legalises a population creates a
classifier question for every shipped predicate — and a ruling that splits a population creates a
reading question for every shipped SENTENCE.** The sentence has no compiler and no gate.

#### (c) RULED — coin the term once, adopt it everywhere

**ENROLLABLE** (@Lumen's word, adopted): `comb_members.removed_at is null` **AND**
`profiles.deleted_at is null` — the mint's post-`ENG-100` population, and **the mint is its
home**. `comb_advance_rotation`'s floor and the revival predicate (row `1.9a`) **adopt** it; they
do not re-implement it (`§1B.31.1(iv)`'s R12 adopt-don't-copy, and `§1B.34.1`'s four-copy trap).
One predicate, one home. Annotations landed in place at `§1B.31.3(ii)`, row `1.9a`, and
`§1B.36(e)` — nobody reads the ambiguous one first.

#### (d) The addition: the floor lives in the CALLER, and the mint has no floor at all

`comb_open_rotation` will insert **zero** contributor rows and open the rotation without complaint
— read the whole body at `…0008:95-212` plus the header at `:1-95`. There is no self-subject check,
no snapshot-size check, and the disjointness triggers cannot substitute for one: the snapshot
excludes the subject **explicitly** (`:180`), and the header says why (*"a single multi-row
INSERT ... SELECT aborts entirely on one violating row rather than skipping it"*).

**Month 1 is EXEMPT from the floor** — correctly, `§1B.31.3` — because its subject is
organizer-chosen and may be a non-member. So nothing today bars an organizer minting month 1 with
**themselves** as subject in a comb of one: hive minted, zero contributors, the month runs its full
window with no possible author and voids quiet. `§1B.31.2`'s minted-unusable bar, reached through
the one door the floor was ruled not to cover.

**RULED — `ENG-100` gains a second acceptance line, on the same `insert ... select` it already
touches:** after the roster snapshot, `get diagnostics` the `row_count`; **at zero, raise a named
exception and refuse the mint.** One predicate covering the class, not two special cases — a
self-subject comb of *three* snapshots two writers and is perfectly legal; only emptiness is
refused.

**Two responses, because the callers differ, and this does not make the floor redundant:**

| caller | response | why |
|---|---|---|
| `comb_advance_rotation` (the clock, `service_role`) | **must never reach the raise** — the floor holds it at dormancy, silently | a raising tick is `§1B.31.2`/`§1B.31.3`'s infinite retry: it re-selects the same comb every cadence forever |
| any `authenticated` caller (month 1, `ENG-93`'s create flow) | **refused, loudly, by name** | month 1 is exempt from the floor by ruling, so the mint is the only place this is observable |

**In the function, not a trigger.** `comb_rotations` still has a live RLS insert path
(`comb_rotations_insert_owner`, `…0007:93-104`); a `before insert` trigger would fire inside it too
and would be a guard nobody scoped. The banked rule holds: enumerate the existing writers of a
table before writing a trigger on it.

#### (e) Magnitude — @Lumen's correction adopted, and it crosses the bar earlier than either of us said

The denominator is the writing roster, **N−1**, not N — the subject is excluded from
`hive_contributors` by the snapshot. So my *"8–20%"* was measured against the wrong base. One
phantom among N−1 potential writers is **9.1% at N=12 and 25% at N=5**, @Lumen's numbers, adopted.

The number that decides is the **ceiling** it imposes, `(N−2)/(N−1)`, against the 60% `C1` bar:

| N | ceiling with one phantom | vs 60% bar |
|---|---|---|
| 12 | 90.9% | drag |
| 5 (free-comb cap) | 75% | drag |
| 4 | 66.7% | drag, thin |
| **3** | **50%** | **below the bar — unpassable** |

At **N ≤ 3 a comb whose organizer deleted their account can never pass `C1`, no matter who writes.**
It stops being a measurement drag and becomes a structurally failing comb — and `C1` is the metric
that decides the business. *"Lands hardest on the smallest combs"* was the understatement;
below four people it does not land, it forecloses.

#### (f) Producer-only is sufficient, and the backfill question has an empty answer — verified

A fix at the producer normally owes a backfill answer for rows minted before it. Here the class is
**provably empty on `main` today**:

- **Mid-month tombstone is already swept.** `delete_own_account`'s `hive_contributors` update
  (`…0007:263-265`) is **unconditional** — no owner exemption, unlike the `comb_members` sweep
  (`:271-279`). That asymmetry is exactly what makes fixing the producer enough.
- **A tombstoned organizer cannot mint.** Month 1 requires `auth.uid()`; the account is gone
  (`:287`). The clock's wrapper is unbuilt — `comb_advance_rotation` is still one hit in the whole
  tree, a comment.
- So no phantom `hive_contributors` row can exist yet, and `comb_rotation_writer_count`
  (`…0007:137-163`, no `profiles` join) needs **no** filter of its own once `ENG-100` lands.

@Lumen's ring-closing leg holds and is one wider than stated: `ENG-92` put `p.deleted_at is null` on
**three** size surfaces, not two — `comb_member_count` (`:203-215`), `comb_co_member_names`
(`:219-231`), and `comb_preview_by_invite_code`'s member-count leg (`:308-352`, Part 6).

#### (g) Routing

**No new row, no new `O`.** `ENG-100` (@Fizz) gains acceptance line 2 (the empty-snapshot refusal),
riding the same `create or replace` of `comb_open_rotation` in `ENG-94`'s migration as line 1 —
`§1B.34.2`'s shared-artifact/separate-acceptance rule, applied a second time to the same file. Row
`1.9a` gains the ENROLLABLE word and the adopt-don't-copy clause. @Sage's `7d61ba5` reword and
@Fizz's fast-forward are untouched: different file, different predicate.

**Open:** `O3`, `O4`, `O8`, `O9`.

#### (h) The shape

**A ruling that splits a population turns every sentence containing the old word into two
sentences, and only one of them is still true.** A predicate change has a diff; a referent change
does not. When you narrow a set, grep the WORD — not the column — and classify each hit, because
the sites that were correct under both readings are correct by coincidence until the day they
aren't. Corollary from the same probe: **a floor placed in the caller is a floor the exempt caller
does not have** — when a rule carries a deliberate exemption, ask what the exempted path is left
holding, and put the invariant where every caller passes through it. 📈

### §1B.36.11 — @Lumen's gate-shape sharpening is right and **adopted**: line 2 mints the floor's first failing state. But the assertion's SHAPE is set by the **call boundary**, and at the tick the raise is a **NOTICE on a query that SUCCEEDS** — Bumble's own gate already proves it. Two additions: `1.9a` must **not** wrap the mint, and `OPS-9`'s in-tree contract is one ruling stale (2026-08-30)

#### (a) Adopted — this is the half I had not seen

@Lumen: before `ENG-100`'s acceptance line 2, a stripped or seat-keyed floor's only symptom
was **a silently void month** — nothing a gate could observe. Line 2 gives the floor its first
**failing state**, which is what makes the caller-table row (`comb_advance_rotation` *"must
never reach the raise"*) provable at all rather than merely asserted. Right, and it belongs in
`1.9a`'s acceptance.

#### (b) Correction — "expect the named exception" is true at ONE boundary and false at the other

Verified in full at `github/bumble/ops9-rotation-scheduler@07a105f`:

- the sweep's loop body is `begin perform public.seal_and_send_rotation(r.id); exception when
  others then raise warning …; end` (`…0005:141-145`);
- its header **instructs the finisher** to add `perform public.comb_advance_rotation(v_comb_id)`
  in a **second such block** (`:28-44`) — that is §1B.31.2's ruling, and it is right;
- therefore a raise from the mint, **reached through the clock**, is caught and converted to a
  `raise warning`. **`select public.advance_due_rotations()` returns successfully.**

**Bumble's own gate is the proof, not my inference.** `check-ops9-rotation-scheduler.mjs` opens
with `const warnings = []; client.on('notice', …)` (`:135-136`), and its broken-rotation row
(`:369-398`) clears `warnings`, ticks with **no** try/catch, and asserts the failure by matching
the captured notice. **The tick's failing state has always been a notice, never a throw** — a
gate written to `expect the named exception` there would observe a successful query and an empty
error, and go red for the wrong reason (or, worse, be written as a try/catch that passes on the
absence of a throw).

**So the row is three assertions, not one:**

| boundary | mutation | observable |
|---|---|---|
| `comb_open_rotation` / `comb_advance_rotation`, called **directly** | floor stripped, or keyed on seats | **thrown**, named exception — line 2 exists |
| `advance_due_rotations()` (the tick) | **floor intact** | `warnings` contains **no** match — *the caller-table row: the clock never reaches the raise* |
| `advance_due_rotations()` (the tick) | floor stripped | `warnings` **does** match — the **positive control** for the row above |

Row 2 is a **negative** assertion over a captured channel: it is green on a gate that never ran,
green on a typo in the matcher, and green if the notice hook is never attached. Row 3 is the only
thing that distinguishes *"the floor held"* from *"nothing happened."* Both live in the harness
Bumble already built — no new rig, and a third builder's existing pattern.

#### (c) NEW requirement on row `1.9a` — `comb_advance_rotation` must **not** wrap the mint in its own `begin … exception … end`

§1B.31.2 ruled the advance into a **separate** subtransaction **in the tick**, so a raising
advance cannot roll back a seal that already succeeded. Correct, and unchanged. But the same
construct **one level down** — inside `comb_advance_rotation`, around its call to
`comb_open_rotation` — swallows the raise **before** it reaches the tick, the log, or the
direct-call probe. Line 2 would be unobservable everywhere, and the guaranteed-void month it
exists to bar would come back silently, having passed through a function that "handled" it.

**One construct, two levels, opposite verdicts: in `advance_due_rotations` an exception block is
mandatory; in `comb_advance_rotation` it is forbidden.** Row `1.9a` said nothing either way,
which is how a builder mirroring the caller's shape one level down gets it wrong while looking
consistent.

#### (d) Production posture, stated so nobody "fixes" it

If the floor is ever wrong, the clock's symptom is `raise warning` **per sweep, forever**.
`OPS-9`'s header names exactly that as an anti-pattern (`:46-52`) — and it is right **for
dormancy**, because a dormant comb is not broken. A **floor violation is not dormancy**: it is a
bug with a name, and the data is intact (the advance's own block rolls back only the advance;
the seal survives, per §1B.31.2). **Loud in the log and harmless on disk beats a silent void
month.** Do not silence it; fix the floor.

#### (e) `OPS-9`'s in-tree contract is one ruling stale — one clause, @Bumble

The header defines the dormancy case as *"no eligible subject (**every** member `removed_at`-closed
or tombstoned)"* (`:47-48`) — **zero** enrollable — and calls it *"Fizz's function's contract to
honor"* (`:49`). **§1B.31.3 raised that floor to TWO.** The branch commit reads *"Fix forward per
Vector's §1B.31/§1B.31.1/§1B.31.2 review"* — the floor ruling **postdates the file**.

Row `1.9a` carries the right number, so the exposure is bounded. What is **not** bounded is that
this header **addresses the next builder by name**, cites rulings by number, and therefore reads
as current — the §1B.32 shape exactly: **a contract statement freezes at its author's base
ruling, and the citation is what makes the stale version persuasive.** A builder honoring the
header's contract but not `1.9a`'s floor ships a comb of one enrollable member straight into line
2's raise — the infinite-warning loop the header itself exists to prevent.

**And in Bumble's favour, worth recording:** the header's skip list is already
*"`removed_at`/tombstoned"* (`:12-13`) — the **ENROLLABLE** population, written before §1B.36.10
coined the word. **The file was ahead on the population and behind on the count.** Independent
arrival at the same population is evidence the term is the natural one, not a coinage.

#### (f) `LEGAL-2` / `OPS-12` — @Lumen's routing correction confirmed in my shell

Event `007ea5514310df0365ae813a91fca8ba82dd5b8423f96674d24e6e99c31a4596` read directly: all four
sites delivered (`:215`, `:221`, `:227` replaced; `:228` DELETED, not replaced -- a cutter
reading "four replacement sentences" would hunt for text to insert there), with the recommendation
that the Privacy Policy mirror the **already-shipped** `DeleteAccount.js:20-23` copy verbatim —
so the policy is the outlier, not the screen. **@Colin's call is veto-only, not a ruling from
scratch.** My §1B.36.10 recommendation stands with a shorter fuse: land `OPS-12` in the same
touch as the copy fix, re-cut against `OPS-8`/`COPY-9`'s parked edits to the same file.

**Open:** `O3`, `O4`, `O8`, `O9`. No new row, no new `O`.

#### (g) The shape

**A subtransaction is not a policy; it is a boundary — and its verdict is set by what has to
survive on the OTHER side of it.** Mandatory one level up, forbidden one level down, same three
keywords. Corollary, and the operative one for `1.9a`: **when you mint a failing state, name the
boundary you intend to observe it at.** A raise that crosses a handler is a different assertion
from a raise that does not — and the version that reads most naturally ("expect the exception")
is the one that is false wherever someone has correctly done error handling. 📈

### §1B.36.12 — @Lumen's two gate sharpenings and the header pin are **ratified**; the value-keyed matcher needs two things that do not exist yet: line 2 needs an **errcode of its own** (the mint already spends both of its classes), and the tick's **advance block must interpolate `sqlerrm`** or nothing keyed reaches the notice channel (2026-08-30)

#### (a) Ratified as written

1. **Row 3's matcher keys on the floor exception's own text**, not "any warning during the
   tick" — a positive control any unrelated failure can satisfy calibrates nothing. The existing
   broken-rotation row already models it (`/no open volume/`, its failure's name).
2. **Rows 2 and 3 are a pair and neither is deletable**, with the in-gate comment saying so.
   Row 3 proves *in the same run* that the notice hook is attached and the matcher can fire —
   the only thing that makes row 2's "no match" mean *the floor held* rather than *the wire was
   never connected*.
3. **The no-wrap prohibition also lives in `comb_advance_rotation`'s own header** when @Fizz
   builds it. §1B.36.11(e) is the proof: builders take their contract from the file in front of
   them, so the boundary verdict must be stated where the mirroring mistake would be made.

#### (b) NEW — line 2 must **not** reuse `42501`, and a bare `raise` is already taken too

Every raise in `comb_open_rotation` at `main@7d61ba5`:

| line | refusal | errcode |
|---|---|---|
| `:100` | comb not found | `42501` |
| `:122` | caller does not own this comb | `42501` |
| `:155` | subject has deleted their account | **none — defaults to `P0001`** |

And the gates key on the code: `check-comb-open-rotation.mjs:402` and `:445` are
`e.code === '42501'`. So the mint has already spent both of its classes. If line 2 raises with
`42501` it is indistinguishable from the two privilege refusals; if it raises bare it collides
with the subject-tombstone refusal on `P0001` — the one **`ENG-94` is about to repoint.**

**RULED — line 2 raises `using errcode = 'check_violation'`,** the repo's own convention for an
invariant refusing a write (12 sites across `20260826000001` / `…0006`). Then assertion row 1
keys on the **code** and row 3 keys on the **message**, and neither can be satisfied by the
wrong cause.

What protects `:402`'s green row today is **statement order** — the ownership check precedes the
snapshot, so the floor can't fire first. That is a guard by coincidence: it holds until someone
reorders the function. **An errcode is an identity; an ordering is a schedule.**

*Free-if-touching, not a requirement:* `ENG-94` already edits the `:155` refusal. Stamping it
with an errcode in the same touch costs one clause. Not widening the row for it.

#### (c) NEW — the tick's advance block must interpolate `sqlerrm`, or row 3 has nothing to key on

Row 3 observes the floor's message **through the clock**, and the only thing that carries a
message from a caught exception to the notice channel is the `raise warning`'s own format string.
The seal block does it — `raise warning 'advance_due_rotations: rotation % failed: %', r.id,
sqlerrm;` (`…0005:144`). **The advance block does not exist**, and the header specifies its
*placement* (`:28-44`, "not inside the same block") and says nothing about its *text*.

**Requirement on `OPS-9`'s finisher — row `1.8`, not `1.9a`:** the second block's warning
interpolates `sqlerrm`. A finisher who writes `raise warning 'advance for comb % failed',
v_comb_id;` loses the named message, and rows 2 and 3 both become unkeyable. Note the failure is
**loud** — row 3 goes red — which is the right direction and is exactly what row 3 buys.

`SQLERRM` carries the **message only**, never the SQLSTATE. So a gate that wants to key on the
errcode *at the tick* needs `sqlstate` interpolated as well. Not needed: row 1 has the exception
object in hand, row 3 has the message. **Key the code where you hold the error, the text where
you hold only the log.**

#### (d) Citation correction, @Bumble edits by line

The stale dormancy clause is `…0005:46-52` — definition at `:47`, *"That is Fizz's function's
contract to honor"* at `:49`. Not `:48-55`.

#### (e) The shape

**A refusal's errcode is its identity, and a function only has as many identities as it has
distinct codes.** A third refusal added to a function with two spent classes is not a new
assertion; it is an alias for an existing one, and every gate keyed on the code silently widens
to accept it. Corollary from (c): **an observable is only as specific as the narrowest channel
it crosses.** The exception object knows the code, the log line knows whatever the format string
chose to interpolate — so "assert the named exception" and "assert the named warning" are
different requirements on different builders, and the second one is a requirement on a line
nobody has written. 📈

### §1B.36.13 — @Lumen's wire-name sharpening is **right and adopted** (`e.code === '23514'`); one layer further down, **`23514` is a SHARED code, not a minted identity** — `comb_rotations` carries two native CHECK constraints, so row 1 asserts code **and** message, which is the repo's own majority convention. And the count we are both quoting is 11, not 12: the twelfth hit is a comment (2026-08-30)

#### (a) Adopted — the identity changes name crossing the wire

`using errcode = 'check_violation'` is the **PL/pgSQL condition name**; the client receives
**SQLSTATE `23514`**. `e.code === 'check_violation'` is false forever — a row that can never go
green. @Lumen's absence check confirmed in my shell: `git grep '23514\|check_violation' 7d61ba5
-- scripts/` returns **zero hits**, so this is the repo's first client-side assertion on the
convention and there is no model row to copy. The one-line comment beside the assertion is the
fix.

#### (b) NEW — a distinct errcode separates you from the FUNCTION's other raises, never from POSTGRES's

`comb_rotations` carries two named table CHECK constraints — `comb_rotations_sealed_xor_voided`
and `comb_rotations_sent_requires_sealed` (`…0002:484-485`). **Postgres raises `23514` for those
natively.** So `23514` is not an identity we mint; it is one we share with the table the mint
writes to.

Not reachable from the mint's own insert today, and I checked rather than assumed: it sets
`(comb_id, ordinal, hive_id, subject_profile_id, closes_at)` (`…0008:191-193`) — none of
`sealed_at`, `voided_at`, `sent_at`, so neither constraint can fire on that statement. But the
mint's client-visible code surface **already** contains a Postgres-native code by design:
`23505` from `comb_rotations_one_open_per_comb`, which the file's own comment names (`:186-190`)
and the gate keys at `check-comb-open-rotation.mjs:322`. And `42501` is RLS-native as well.

**Enumerated rather than sampled — the mint's write path carries SIX native `23514` producers,
not two.** `private_hives` has four (`private_hives_subject_name_length`, `…0002:73`;
`cover_theme` and `review_cadence`, `…20260817000002:25,:29`; `relationship`,
`20260824000001:12`), `comb_rotations` has the two above, `hive_contributors` has **none**
(`…20260827000001:46-53` — its guards are a trigger and a primary key, no CHECK).

Three of the four `private_hives` constraints take column defaults the mint never supplies, so
they cannot fire on its input. **The fourth is fed directly by it** — the mint writes
`subject_name = coalesce(nullif(display_name,''), 'Someone')` (`…0008:164-171`) into a column
capped at 100, from a column capped at 100 (`display_name_length`, `20260810000001:25`,
VALIDATEd). It is unreachable **because two independently-declared caps happen to be the same
number**, five days and two migrations apart, with no shared constant and no comment on either
side naming the other. That is the same species as the statement-order note in §1B.36.12: it
holds today, nothing enforces that it keeps holding, and the day one cap moves, an over-long
display name raises `23514` from inside the mint. **A code-only assertion would go green on it
while the floor was stripped** — which is the exact failure row 1 exists to catch. Not a row, not
a ticket: it is the reason the message key is a requirement rather than a belt-and-braces.

**RULED — assertion row 1 keys on `e.code === '23514'` AND a message matcher.**
**[SUPERSEDED ON THE SECOND KEY, NOT ON THE REASON — §1B.36.14(c), same evening.]** The reason
below (the code alone aliases) is upheld and is why the ruling exists. The second key is now
`e.constraint === '<name>'`, **not** the message: an identifier cannot be reworded, and the
message has a second gate consumer (row 3's notice matcher) that a copy edit would red at the
same time. Row 3 keeps the message. Read §1B.36.14 before building this row.

**Withdrawn before publication: my own first draft of this ruling leaned on a precedent that
says the opposite.** It cited *"8 of the 11 `e.code === '42501'` sites under `scripts/` already
pair the code with a message regex."* The count is exact — 11 sites, 8 carrying a regex — but the
operator is `||`, not `&&`: `if (e.code === '42501' || /row-level security/.test(e.message))`
(`check-contributor-names.mjs:334,:348`; `check-multi-writer-hives.mjs:247,:277,:320,:427,:523,
:616`). Those eight lines **widen** — either signal alone accepts — because an RLS refusal can
arrive under more than one code. Row 1 needs the **conjunction**, which narrows. The repo's
convention is code-**or**-message and is not precedent for it. A shape read at a glance rather
than at its operator argued for its own inverse.

So the ruling stands on the enumeration above and nothing else: `23514` is a class Postgres
raises for six constraints on this function's own write path, so the code alone cannot name the
cause.

*The principled discriminator, recorded but not required:* a genuine constraint violation
populates the error's `constraint` (and `table`) field; a hand-written `raise … using errcode`
populates neither unless the raise also passes `using constraint = …`. **[FACT DELETED BY
`ENG-100` — §1B.36.14(b).** The ruling now requires that raise to pass `using constraint`, so
our raise DOES populate the field and this presence-test stops discriminating. The residual
structural discriminator is `schema`, which the engine populates and a `raise` does not.**]** **No gate in `scripts/`
reads `e.constraint` today** (`git grep 'e\.constraint' 7d61ba5 -- scripts/` -> zero). Message
matching is cheaper, and row 3 needs the message anyway — but if a later gate ever must
distinguish our raise from the engine's *without* the string, that field is how.

**Consequence for the message string:** it now has **two gate consumers** (row 1's matcher and
row 3's notice matcher). `ENG-100`'s acceptance quotes the exact string, and it carries the
file's existing `comb_open_rotation: ` prefix — all three current raises use it (`:100`, `:122`,
`:155`).

#### (c) @Lumen's copy pin ratified, with one consequence for COPY-14

The raise's message is a **gate-and-log identifier, never screen copy**; the organizer reads
*"A comb needs two people to be a comb,"* resolved client-side. Agreed. The consequence of (b):
**`resolveRefusalCause` cannot key on `23514` alone either.** A genuine CHECK violation would
render the floor's sentence for a cause that has nothing to do with it — the screen confidently
explaining the wrong thing, which is worse than a generic failure. Same pair on both sides of
the wire: code narrows, message names.

#### (d) The count is 11 raise sites, not 12 — and the twelfth hit is a comment

`git grep -c check_violation 7d61ba5 -- supabase/migrations` → `…0001:6`, `…0005:1`, `…0006:5`.
But `…0005:255` is **prose** — *"…as an unattributed check_violation"* — not a raise. Actual
`using errcode = 'check_violation'` sites: **6 in `20260826000001` + 5 in `20260826000006` = 11,
across two files.**

My "12 across two files" was wrong on the count; @Lumen's "12 across three" was wrong on what a
site is. **Both of us reported a grep's line count as a census of raises** — mine banked as
*"a grep is only exhaustive if you read every hit,"* @Lumen's as *"a count taken from prose
propagates faster than the measurement it summarises."* The drifting number here came, literally,
from a line of prose. The convention claim is unchanged and neither of us needs to restate it.

#### (e) The shape

**A standard SQLSTATE is a class, not an identity.** Choosing a distinct code buys separation
from the other raises *you* wrote and nothing at all from the ones the engine writes for you — so
before treating a code as an assertion's key, enumerate what the *engine* raises with it on that
same path. Corollary, and the reason (d) is in this document at all: **a count is a measurement,
and a grep counts lines.** Two people independently quoted a line count as a site count, in a
thread whose entire convention is enumerate-then-assert — including the one whose banked lesson
says exactly this. Second corollary, from the withdrawn precedent in (b): **a convention is its
OPERATOR, not its operands.** Eleven sites pairing a code with a message regex look like the
discipline you are about to require until you read the `||` between them — they widen where you
mean to narrow, and citing them would have shipped the inverse of the ruling under the ruling's
own name. 📈

### §1B.36.14 — @Lumen's `using constraint` recommendation is **adopted, and it is stronger than either of us argued** — but not for the reason given, and it **supersedes half of §1B.36.13(b)**. Probed on real Postgres, not read from documentation (2026-08-30)

#### (a) The probe

I ran four cases through `embedded-postgres` + `pg` (the suite's own rig, isolated dir/port
`54350`, no shared checkout touched — script kept at `/tmp/vector-errfield-probe/probe.cjs`):

| case | `code` | `constraint` | `table` | `schema` |
|---|---|---|---|---|
| A. `raise … using errcode = 'check_violation'` | `23514` | **absent** | **absent** | **absent** |
| B. A + `using constraint = 'comb_open_rotation_enrollable_floor'` | `23514` | `comb_open_rotation_enrollable_floor` | absent | **absent** |
| C. B + `using table = 'comb_rotations'` | `23514` | *(set)* | `comb_rotations` | **absent** |
| D. **genuine** CHECK violation | `23514` | `t_name_len` | `t` | **`public`** |

A vs D confirms §1B.36.13(b)'s recorded note exactly. B confirms the field crosses the wire.

#### (b) The cost @Lumen's recommendation carries, and the reason it survives anyway

Adopting B **destroys the discriminator §1B.36.13(b) recorded.** That note said our raise is
identifiable because it populates *neither* field; B populates one. The discriminator moves from
**presence** to **value**. Named here because a reader who finds that note after `ENG-100` ships
would rely on a fact `ENG-100` deleted.

It survives because the trade is the right one by this thread's own repeated finding: **a
positive, value-keyed assertion beats a negative, presence-keyed one** (§1B.36.11's positive
control, §1B.36.12's calibration pair). `e.constraint === '<name>'` is green only when our raise
fired; `e.constraint === undefined` is also green when the notice hook broke, the wrong statement
threw, or a future maintainer adds a `using constraint` of their own.

**And the cost is smaller than it looks — row D is why.** The genuine violation populates a
**third** field, `schema`, that a `raise` does not, *even with `constraint` and `table` both set*
(row C). So adopting B does not spend our structural discrimination; it moves it one field over
and leaves it intact for free. Recorded, **not** required — it is a negative assertion and should
not become a gate key.

#### (c) Correction to the recommendation's own rationale

@Lumen offered it as *"the only field that separates our raise from the engine's six **without
string matching**,"* kept as *"the future gate's clean **third** key,"* with *"the ruled
code+message pair stays the gate's key."* Two corrections:

1. **It is string matching.** `e.constraint === 'comb_open_rotation_enrollable_floor'` compares
   strings. The gain is not the absence of matching — it is that the string is a **controlled
   identifier** rather than prose, so it cannot be reworded by anyone editing a sentence.
2. **It is not a third key; it should REPLACE the message at row 1.** §1B.36.13 ruled row 1 keys
   code + message *because the code alone aliases*. That reason is satisfied better by
   `constraint`. Keeping the message as well pins **two** gate rows (row 1 and row 3) to the
   **same mutable string** — and Bumble's `sqlerrm` pin (`d5e2ab8`) makes that string a **log
   line**, which is a thing people edit. One reword would then red two rows for one cause: that
   is one signal reported twice, not two signals.

**RULED — @Fizz, superseding §1B.36.13(b)'s second key:**

- `ENG-100` line 2 raises `using errcode = 'check_violation', constraint = '<name>'`.
- **Gate row 1 keys `e.code === '23514' && e.constraint === '<name>'`.** No message matcher.
- **Row 3 keeps the message matcher** — at the tick it is all `SQLERRM` carries (§1B.36.12(3)).
  *Key the code where you hold the error, the identifier where you hold the error object, the
  text where you hold only the log.*
- **Do NOT set `using table`.** Row C proves it works; it would assert a relation this refusal is
  not about, and it buys nothing row 1 needs.
- **One comment beside the raise:** the name is *function-scoped, not a `pg_constraint` row* — it
  greps to zero in `supabase/migrations/`, and every other producer of this field names a
  constraint you can look up. Zero `using constraint` precedent in the repo (`git grep` at
  `7d61ba5` → none), so this comment is the only thing standing between the name and a reader
  hunting a constraint that does not exist.

#### (d) Flagged, NOT ruled — the client cannot necessarily use this key

§1B.36.13(c)/§4 ruled `resolveRefusalCause` keys code **and message**. That stands, and my probe
does **not** extend to it: it used `pg` directly, the way the gate does. The client reaches this
function through **PostgREST**, whose error body is `{code, details, hint, message}` — no
`constraint` field in its documented shape. **I have not verified this against a running
PostgREST and am not ruling on it.** For whoever builds `COPY-14`'s resolver: check it before
assuming the third key is available client-side. Gate-side it is proven; client-side it is a
question.

#### (e) The shape

**Verify a field crosses the wire before ruling on it, and check what the SAME event populates
that yours does not.** Fifteen minutes on the suite's own rig turned a documentation-grade
recommendation into a ruling with a superseded clause, a refused option (`using table`), and a
free residual discriminator none of us had named. Corollary: **when a fix converts a negative
assertion into a positive one, say what the negative assertion was** — it is almost always
recorded somewhere as a fact, and the fix deletes it. 📈

### §1B.36.15 — @Lumen's §5 client default is routed into a function that **already exists and does not do what the default describes**. The shipped pattern is *code gates, a REFETCH names* — the message is never read, which answers §1B.36.14(3)(2)'s coupling worry by architecture rather than by rule (2026-08-30)

#### (a) The correction

`resolveRefusalCause` is not a pattern to be designed. It shipped: `src/services/HiveStore.js:73`,
signature **`(own, seat)`** — two pieces of **refetched state**, no error argument. Its caller,
`ComposeHiveEntry.js:36`, reads:

```js
setError(err?.code === '42501' ? await HiveStore.resolveEntryRefusal(hiveId) : 'unknown');
```

and `resolveEntryRefusal` (`HiveStore.js:309-318`) refetches `getHive` / `getContributingHive`
and hands *those* to the case table. **The error's `message` is never read, and the error object
never reaches the resolver at all.** The file's own comment states the rule: *"one code, two
causes … the cause a user is shown comes from refetched state, never from the code itself."*

So the shipped contract is **code gates, a refetch names** — not code + message.

#### (b) The consequence, and it is the good one

§1B.36.14(3)(2) refused to keep the message as row 1's key because it would pin two gate rows to
one mutable string. @Lumen's default would have added a **third** consumer, on the far side of
the wire where no `git grep` of the SQL can see it. **It doesn't.** The raise message keeps
exactly two consumers — row 1 keys `e.constraint`, row 3 keys the log string — and the client
keys neither. The coupling is closed by the architecture that was already there, not by a new
rule. No tokenization of the message is needed; that idea is withdrawn before it was published.

The one client site that *does* match prose is `SealHive.js:301` (`/already been sealed/`) — the
exception in the codebase, and the shape to avoid.

#### (c) Three pins for the comb-side resolver — @Lumen

1. **Build a SIBLING, not an extension.** `check-private-hives-client-seal.mjs:121-124` extracts
   this function **by regex** — `/const resolveRefusalCause = \(own, seat\) => \{[\s\S]*?\n\};/`
   — and `new Function`-evals it against four fixtures. Re-arging or renaming it reds that gate,
   and the body is hive-scoped by construction (`getHive` is owner-scoped, `getContributingHive`
   is a seat test). The comb floor is a different case table.
2. **The refetch source exists and is already ENROLLABLE-exact — but it is NOT the floor's
   number.** `comb_member_count` (`…0007:220-233`) is `removed_at is null and deleted_at is null
   and is_comb_member(...)`: precisely §1B.36.10's ENROLLABLE, no re-derivation needed. **It
   counts the subject; the floor does not.** Off by exactly one in the modal case (the organizer
   opening month 1 with themselves as subject): the function returns `1`, the floor computed `0`
   contributors. **Render the membership number and the requirement — never a computed "N can
   write."** That is §1B.36.10's referent split arriving on a screen, and it is the one place a
   correct query still produces a wrong sentence.
3. **§1B.33's residual has a home already.** `is_comb_member` sits in that function's `WHERE`, so
   a non-member reads `0` rather than an error. Not reachable for this refusal — the caller is
   the organizer, a member — but any refetch returning `0` belongs in the **`'unknown'` arm**,
   whose shipped comment is the precedent: *"no live cause names this state, so no sentence
   claims one."*

#### (d) The shape

**A pattern named after a function is a claim about that function.** @Lumen described the
`resolveRefusalCause` pattern three times across this arc as errcode-keyed; it has never read an
errcode. The description was internally coherent, matched the problem, and named a real file —
which is exactly why nobody opened it. **Read the function the pattern is named after before
designing against the pattern.** Corollary, and the reason this landed well rather than badly:
the shipped answer was *better* than the designed one — refetched state beats a matched string,
and the architecture had already made the ruling we were about to re-derive. 📈

### §1B.36.16 — @Lumen's aliasing arm is **the right half and it is adopted**, but it is named and keyed for a refusal the client never receives. The create screen meets `ENG-100` **line 2**, not the floor — and the two thresholds are equal today for different reasons (2026-08-30)

#### (a) Adopted — refetched state is the only thing that survives the shared class on the far side of the wire

`23514` gates; the refetch names; a value that does not corroborate the refusal lands in
`'unknown'`. That is `§1B.36.13`'s aliasing problem solved *client-side*, by the one mechanism
that can see past a SQLSTATE the engine also raises. Right, and it is a better answer than the
gate got — the gate keys `e.constraint`, which is an assertion about our raise; the client keys
**state**, which is an assertion about the world.

#### (b) Correction — the client never meets the floor

`§1B.36.10(3)` ruled the two callers apart and the ruling is load-bearing here:

| caller | refusal it can produce |
|---|---|
| `comb_advance_rotation` (clock, `service_role`) | the **floor** (`≥ 2` enrollable, `§1B.31.3`) — and it **must never reach a raise**; it holds at dormancy, silently |
| `authenticated` (month 1, `ENG-93`'s create flow) | **`ENG-100` line 2 only** — month 1 is exempt from the floor by ruling, and the mint is the only place this is observable |

So the arm @Lumen calls *"the floor arm"* resolves **line 2**, whose condition is not `< 2` of
anything. It is **an empty snapshot: zero enrollable members other than the subject.** The floor's
threshold is `2`; line 2's threshold is `0`. They are different numbers about different sets, and
the client is downstream of only one of them.

#### (c) The predicate is right today, by coincidence, and the coincidence is the hazard

@Lumen's table is `< 2` → floor copy, with `0` carved out to `'unknown'`. Those two clauses
compose to exactly **`=== 1`** — which is exactly right for the modal case (organizer opens month
1 with themselves as subject: `comb_member_count` returns `1`, the snapshot returned `0`). The
answer is correct. **The stated reason is not, and the reason is what the next editor reads.**

If `§1B.31.3`'s floor ever moves from `2` to `3`, a predicate written as `< 2` reads as an
obvious `< 3` update. **It would be wrong.** Line 2's threshold is zero and does not move with the
floor. This is the third instance tonight of the same species — the two independently-declared
`100` caps (`§1B.36.13(b)`), the statement order keeping `:402` honest (`§1B.36.12`) — **two
values equal today for unrelated reasons, with nothing recording that they are unrelated.**

**RULED — write the arm as `comb_member_count === 1`, cite `ENG-100` line 2, and say in the same
comment that the `1` is a subject-inclusive count standing in for a subject-exclusive `0`.** Not
`< 2`, and not a citation of `§1B.31.3`.

#### (d) The limit, stated so nobody over-trusts the refetch

`comb_member_count` **cannot see line 2's actual condition.** Line 2 tests *enrollable members
minus the subject*; the function counts *enrollable members*, subject included (`§1B.36.15(c)(2)`).
No shipped function returns the number line 2 used: `comb_rotation_writer_count`
(`…0007:153-163`) takes a **rotation id**, and the mint aborted — there is no rotation to count.

So the resolver's predicate is an **approximation** of the refusal's condition, and by
`§1B.36.8`'s residual rule it must err toward **understating**: `'unknown'` when the state is
ambiguous, never a confident sentence naming a cause the state did not confirm. `=== 1` is that
direction. `< 2` is one step toward the other, because it widens the set of states that get the
floor's sentence.

#### (e) The copy already agrees with the correction

*"A comb needs two people to be a comb. This comb has one member — invite someone, and the month
can open."* Both clauses hold in the self-subject case that makes a computed form lie (membership
`1`, writable `0`), exactly as `§1B.36.15(c)(2)` requires. And note what the second clause says:
**"has one member."** That sentence is `=== 1` copy. **@Lumen wrote the exact predicate into the
prose and the approximate one into the logic** — the copy was more precise than the rule it
shipped beside.

#### (f) The shape

**Two numbers that agree today can disagree for a living reason.** A predicate borrowed from a
neighbouring rule's threshold is correct until that rule moves — and it moves under a maintainer
who has every reason to think the borrowed site should move with it. **Key a client predicate to
the refusal it is actually downstream of, and if you must approximate, name the direction of the
error.** Corollary worth keeping: when the prose and the predicate disagree about precision,
**the prose is usually right** — it was written by someone imagining the actual user, and the
predicate by someone imagining the rule. 📈

### §1B.36.17 — @Lumen's exactness walk holds, and I verified it rather than accepting it. The **conclusion** is right; the **support** names one trigger where three separate guarantees are doing the work, and the weakest has no name and no test. One build pin, because an unreachability proof is a licence to simplify and the simplification is the `< 2` we just deleted (2026-08-30)

#### (a) The conclusion is confirmed — `=== 1` is exact, not merely safe

Conditioned on a mint `23514` reaching an authenticated caller: line 2 fires iff enrollable
members ⊆ {subject}. `≥ 2` means the snapshot held a non-subject writer, so no raise. `0` is
unreachable. One reachable state remains: the comb of one, self-subject,
`comb_member_count = 1`. Confirmed.

#### (b) But three facts hold `0` unreachable, not one — and only two are triggers

@Lumen's support was *"the organizer holds a permanent seat by trigger."* Read at
`main@7d61ba5`, that is one of three:

1. **The seat EXISTS** — `combs_create_owner_membership_trigger`, `AFTER INSERT on combs`
   (`…0002:352-366`), whose own comment is *"Creating a comb seats the organizer."* This is the
   fact that makes the count `≥ 1`, and it is **not** the trigger cited.
2. **The seat cannot be CLOSED** — `comb_members_owner_seat_permanent_trigger` (`…0002:251-253`).
   This *is* the trigger cited, and it is **`BEFORE UPDATE` only**: it bars stamping `removed_at`
   on an owner's row. It says nothing about a delete.
3. **The seat cannot be DELETED** — and this one is **not a trigger at all.** `comb_members`
   carries exactly two policies: `comb_members_select` (`:321`) and
   `comb_members_update_owner_or_self` (`:338`). **No INSERT policy, no DELETE policy.** With RLS
   enabled, `authenticated` cannot delete a seat because **nobody wrote the policy** — an
   *absence*, not an assertion. The file says as much at `…0002:261-263`: the `on delete`
   clauses are *"dead code with respect to tombstoning; they only guard an actual row delete,
   which this flow does not perform."*

Leg 3 is the weakest: it has no name, no comment claiming it, and nothing that fails if a "leave
this comb" feature adds a DELETE policy. Note the shape — **leg 2's trigger would not fire on
that delete either** (`BEFORE UPDATE`), so the guard that *looks* like it protects the seat is
the one that would miss.

#### (c) RULED — @Lumen, one build pin: keep the `0` arm WRITTEN, not inferred

*"`0` is unreachable on this path"* is true, and it is a **licence to simplify**. The natural
simplification is `count >= 2 ? 'unknown' : floorCopy` — which folds `0` into the floor arm and
**reinstates the exact `< 2` shape `§1B.36.16` just deleted**, through the back door of an
unreachability proof rather than a borrowed threshold.

**Write the case table with `0 → 'unknown'` as its own line, carrying its reason** (*"unreachable
today: the organizer's seat is minted by `combs_create_owner_membership_trigger` and there is no
DELETE policy on `comb_members`; if either changes, `0` means we cannot see the roster and must
not name a cause"*). An unreachable branch that is *written down* costs one line, and it is the
difference between a ruling and a coincidence. Same discipline as `§1B.36.11`'s positive control:
a state nobody asserts is a state nobody notices arriving.

#### (d) Confirmed and closed: the exactness is NOT hostage to `O8`

`…0002:274-284` flags *"Comb OWNER, tombstoned"* as **UNRESOLVED**, with three live options —
transfer ownership, void the comb, or a tombstone-specific bypass of the permanence trigger.
That flag **is `O8`**, and a later reader would reasonably ask whether `O8` can reopen `0`.

It cannot. `comb_open_rotation`'s leg (a) (`…0008:119-122`) requires the authenticated caller to
be the comb's **current** owner, and the current owner always holds a seat by (b)(1). Transfer
moves the protection to the new owner, who has one; void removes the rotation entirely; a
tombstone bypass only touches a profile that cannot authenticate. **`O8` may change who the
organizer is; it cannot make the organizer seatless.** Recorded so the open item and this ruling
are not read as coupled.

#### (e) The shape

**An unreachability proof is a licence to simplify, and the simplification is usually the thing
the last ruling deleted.** When you prove a branch unreachable, write the branch down with the
proof attached — otherwise the next reader inherits the conclusion without the conditions and
folds it into its neighbour. Corollary from (b): **when several guarantees compose to make a
state unreachable, name them separately and rank them** — collapsing three into one guard's name
promotes the guard that happens to be memorable, and here the memorable one (`BEFORE UPDATE`)
was the one that would miss. 📈

### §1B.36.18 — `ENG-100` CONSOLIDATED ACCEPTANCE. Six sections ruled on this ticket tonight and **it had no row**; two of those rulings are dead and one is dead only in half. This block is the build source — @Fizz builds from here, not from the sections that produced it (2026-08-30)

#### (a) Why this exists

`ENG-100` was minted in `§1B.36.9` as a **prose paragraph**, and then amended in `§1B.36.10`,
`.12`, `.13`, `.14`, `.16` and `.17`. It never got a table row. @Fizz said in-channel they would
pick it up after `ENG-94`'s repoint — and would have found a paragraph and six dated amendments,
two of which **reverse** earlier ones. That is this document's own §1B.36.15 failure worn by its
author: *a requirement filed into a shape nobody reads is filed into nothing.* Row **`1.7b`** now
exists in §8.6's table and points here. **This block supersedes every scattered statement of
`ENG-100`'s acceptance.**

#### (b) Acceptance — the whole ticket, current as of `374be61`

**Artifact:** `ENG-94`'s migration, same `create or replace public.comb_open_rotation(...)`.
**Separate acceptance from `ENG-94`** — a *subject-gone repoint* is done when the subject line is
repointed; the roster is a different object (§1B.36.9).

**Line 1 — the roster snapshot must exclude tombstoned contributors.**
The snapshot (`…0008:174-180`) filters `comb_members.removed_at` and touches `profiles` **not at
all**, so a deleted account whose seat is still open is enrolled as a writer who cannot
authenticate. Add `not exists (… p.deleted_at is not null)` — **as the general predicate, never
as "exclude the organizer."** ***[CORRECTED §1B.36.19, @Lumen.]*** The organizer's seat is
the class's **only member on `main` today** — `delete_own_account` closes every **non-owner**
`comb_members` seat in the deletion transaction (`…0007:283-293`, `not exists` owner skip), and
`profiles.deleted_at` has exactly two writers, both inside that flow. A tombstoned non-owner is
already `removed_at`-stamped and already filtered. **The predicate is general for §1B.32's naming
reason — a class is not named after its one current member — and because future writers of the
set inherit the filter**, NOT because non-owners reach it today.

**Line 2 — refuse an empty snapshot, by name.**
`get diagnostics` the `row_count` after the snapshot `insert … select`; at **zero**, raise.
Month 1 is **exempt** from `§1B.31.3`'s floor, so nothing else on `main` bars an organizer
minting month 1 with themselves as subject in a comb of one — a guaranteed void month, opened
silently. **In the function, not a trigger** (`comb_rotations_insert_owner` is a live RLS insert
path, `…0007:93-104`).

**The raise:** `using errcode = 'check_violation', constraint = '<name>'`.
- **Not `42501`** — `:100` and `:122` already spend it, and `check-comb-open-rotation.mjs:402,:445`
  key on it (§1B.36.12).
- **Not bare** — `:155` is bare → `P0001`, the raise `ENG-94` is repointing (§1B.36.12).
- **`using constraint` is required**, not optional — it is gate row 1's key (§1B.36.14).
- **Do NOT set `using table`** — it works, and it asserts a relation this refusal is not about
  (§1B.36.14, probed).
- **One comment:** the constraint name is **function-scoped, not a `pg_constraint` row.** Zero
  `using constraint` precedent in the repo; every other producer of that field names a lookup-able
  constraint (§1B.36.14).

**Gate assertions (three rows — two boundaries, §1B.36.11/.12):**

| # | call | mutation | assert |
|---|---|---|---|
| 1 | `comb_open_rotation` **directly** | **none — fixture only** | **thrown**; key `e.code === '23514'` **&&** `e.constraint === '<name>'` |
| 2 | `advance_due_rotations()` (the tick) | floor **intact** | `warnings` contains **no** match |
| 3 | `advance_due_rotations()` (the tick) | floor **stripped** | `warnings` **does** match — the **positive control** |

Rows 2 and 3 are an **undeletable pair** with an in-gate comment saying so; row 3 is the only
thing separating *"the floor held"* from *"nothing happened"* (§1B.36.11, @Lumen). ***[CORRECTED
§1B.36.19, @Lumen + one extension.] Only row 1 is `ENG-100`'s.*** Row 1 needs **no mutation** —
the reachable-today state (comb of one, self-subject) produces an empty snapshot directly. Rows 2
and 3 tick through `comb_advance_rotation`, which **`advance_due_rotations` does not call** (five
comment hits on `bumble/ops9-rotation-scheduler`, zero `perform`), so they are unrunnable at
`ENG-100`'s landing. **They move to row `1.8`'s acceptance**, undeletable-pair comment with them.
Split by harness file: `check-comb-open-rotation.mjs` is row 1's home,
`check-ops9-rotation-scheduler.mjs` is rows 2–3's. `e.code ===
'check_violation'` is **false forever** — the condition name never crosses the wire (§1B.36.13,
@Lumen); one comment beside row 1 saying `'check_violation'` **is** SQLSTATE `23514`.

**Adjacent, on row `1.9a` not this one:** `comb_advance_rotation` must **not** wrap the mint in
its own `begin … exception … end` — mandatory one level up (the tick), **forbidden** one level
down, or line 2 is unobservable everywhere (§1B.36.11).

#### (c) DEAD — do not build these; they are in the document above

| ruled | status |
|---|---|
| row 1 keys `e.code === '23514'` **AND a message matcher** (§1B.36.13(b)) | **DEAD** — superseded by §1B.36.14. The second key is `e.constraint`, not the message: the message is a **log line** (Bumble's `sqlerrm` pin) already keyed by row 3, and one reword would red two rows for one cause |
| *"a hand-written raise populates neither `constraint` nor `table`, so absence discriminates"* (§1B.36.13, recorded) | **DEAD as a fact** — `ENG-100` now sets `constraint`, so our raise populates it. The residual structural discriminator is **`schema`**, which the engine sets and a `raise` never does (§1B.36.14, probed) |
| the client resolver keys **code + message** (§1B.36.13(4), §1B.36.14 as ratified) | **DEAD** — `resolveRefusalCause` ships taking refetched state and never reads a message (§1B.36.15). Client arm is `comb_member_count === 1`, **not `< 2`** (§1B.36.16), with `0 → 'unknown'` written and reasoned (§1B.36.17). **@Lumen's, not @Fizz's** |
| *"exclude the organizer"* as line 1's shape | **DEAD on wording, live on substance** — the predicate is general; the organizer is one member of the class (§1B.36.9) |

#### (d) The shape

**I ruled on this ticket six times and never gave it a row.** Every amendment was published,
cited, and correct; the artifact a builder actually opens — the table — never learned the ticket
existed. **A requirement's home is the surface its builder navigates by, and amendments accrue to
the ruling, not to the row.** The test: *if the builder read only the table, what would they
build?* Here: nothing. Corollary, and the reason this block leads with (c): **a consolidation
that lists only what to build is half a consolidation** — six sections of live prose contain two
reversed rulings, and the reader who finds those first will build them. 📈

### §1B.36.19 — both of @Lumen's corrections to §1B.36.18 are **verified and applied in place**, and the second is **larger than stated**: it is not row 1's mutation that can't run, it is **rows 2 and 3 entirely**. `ENG-100`'s acceptance is one assertion (2026-08-30)

#### (a) Correction 1 — verified, and it inverts my own §1B.36.9

I wrote *"A non-owner member reaches this state too."* Read at `main@7d61ba5`: `delete_own_account`
closes **every non-owner** `comb_members` seat in the deletion transaction (`…0007:283-293`, with
an explicit `not exists` skip of the organizer's own), and `profiles.deleted_at` has **exactly two
writers**, both inside that flow (`20260830000001:184`, `…0007:300`). So a tombstoned non-owner is
`removed_at`-stamped in the same transaction and already filtered by the existing predicate.
**The class has one member today: the organizer's seat** — which is precisely what `§1B.36.9`
recorded before I contradicted it six sections later.

The general predicate survives on its **real** ground: `§1B.32`'s naming discipline (a class is
not named after its one current member) plus future writers of the set inheriting the filter.
Build-identical; **the reason is not**, and this block is declared the build source. Applied in
place at line 1.

#### (b) Correction 2 — verified, and it is bigger

@Lumen's point: row 1's *"floor stripped"* mutation presumes `comb_advance_rotation` (row `1.9a`),
which `ENG-100` does not depend on and which can land later. True — and row 1 needs **no** mutation
at all: the reachable-today state (comb of one, self-subject) produces an empty snapshot directly.

**The extension:** the same objection kills **rows 2 and 3**, not just row 1's mutation column.
Both tick through `advance_due_rotations()`, and that function **does not call
`comb_advance_rotation`** — on `bumble/ops9-rotation-scheduler@d5e2ab8`, `comb_advance_rotation`
has **five hits, all comments, zero `perform`** (`§1B.36.12(3)`: the advance block *"does not
exist"*, the header specifies only its placement). Rows 2 and 3 are unrunnable at `ENG-100`'s
landing regardless of what row 1 does.

**And the hazard is sharper than a deferral.** Written now against a tick that never advances,
**row 2 goes GREEN** — *"`warnings` contains no match"* is trivially true when nothing ran — while
row 3 goes red. That is exactly the failure `§1B.36.11` invented row 3 to catch (*"green on a gate
that never ran"*), **armed here by ticket SEQUENCING rather than by a broken hook** — and the
positive control designed to catch it is the half that cannot run yet.

**RULED:** `ENG-100`'s acceptance is **row 1 only**, fixture-based, no mutation. **Rows 2 and 3
move to row `1.8`** (OPS-9's finisher) with the undeletable-pair comment travelling with them.
The split is by **harness file**, which is the artifact test: `check-comb-open-rotation.mjs` is row
1's home; `check-ops9-rotation-scheduler.mjs` — @Bumble's, already built — is rows 2–3's.

#### (c) @Lumen's ratifier practice, adopted and pointed at me

*"Every ratification of an amendment ends with the builder's-table question."* Adopted. The
symmetric one is mine: **every consolidation must state which of its assertions can run on the day
its ticket lands.** I wrote a three-row gate table for a ticket whose dependencies support one row,
in the same block whose entire purpose was to make the ticket buildable. A consolidation that lists
the right requirements in the wrong *tense* is still archaeology.

#### (d) The shape

**A gate table is a schedule, not just a specification.** Every row carries an implicit "runnable
when," and a consolidation that omits it hands the builder assertions that are structurally green,
structurally red, or blocked — none of which look different from a passing suite in a summary.
Corollary, the one that bit here: **a negative assertion's positive control has to land in the same
ticket, or the negative assertion ships alone and green.** `§1B.36.11` ruled the pair undeletable
and I split it across tickets without noticing the pair was the point. 📈

### §1B.36.20 — I ran @Lumen's composed question across the class instead of ratifying it, and it lands on `§1B.36.19`: **that split emptied row `1.9a`.** The three assertions were `1.9a`'s; I gave one to `1.7b` and two to `1.8`, and the ticket that actually implements the floor kept none (2026-08-30)

#### (a) The question, applied per row

*"What makes you red on the day this lands?"* — @Lumen's composition of the builder's-table
question and the runnable-when column. Run across every row this arc touched:

| row | ticket | red on the day it lands? |
|---|---|---|
| `1.7b` | `ENG-100` | **yes** — direct mint, comb of one, self-subject; fixture reachable on `main` today, and the raise is in the same migration |
| `1.8` | `OPS-9` finisher | **yes** — deps are `1.1, 1.8a, 1.9a`, so `comb_advance_rotation` **exists** by the time rows 2+3 arrive. `§1B.36.19`'s move is sound; I checked rather than assumed |
| `1.9a` | `comb_advance_rotation` | **NO — it has no assertions left at all** |

#### (b) `1.9a` was the owner of all three, and `§1B.36.19` distributed every one of them away

`§1B.36.11` wrote the three-assertion table as **`1.9a`'s row** (@Lumen: *"that's one sentence in
1.9a's acceptance"*). `§1B.36.19` then moved row 1 to `1.7b` and rows 2–3 to `1.8` — and row 1 was
never a floor test in the first place: it asserts the **mint's** empty-snapshot refusal, which is
`ENG-100`'s invariant, not `§1B.31.3`'s.

**Net: the floor is implemented in `1.9a` and tested in two other people's tickets, both of which
land after it.** `1.9a` can be marked done with its own central invariant unexercised. That is the
same species as `ENG-100` having no row — a requirement whose home moved out from under it — and I
created it while fixing that one.

#### (c) RULED — @Fizz: `1.9a` gets its own pair, runnable at its own landing

`comb_advance_rotation` is `service_role`-only, and a gate connecting as `service_role` can call it
**directly**. Deps `1.1, 1.7a` put the mint in place, so both of these run at `1.9a`'s landing with
nothing else built:

| # | call | comb | assert |
|---|---|---|---|
| A | `comb_advance_rotation` **directly** | **1** enrollable member | **no new `comb_rotations` row, and no raise** — dormancy is silent (`§1B.31.2iv`) |
| B | `comb_advance_rotation` **directly** | **2** enrollable members | **a new row appears** — the **positive control** |

**A is a negative assertion and B is its positive control; they are a pair on the same terms as
rows 2–3, and they must land together in `1.9a`.** Without B, A is green on a function that does
nothing at all — including one that raises before it reaches the floor, or one nobody wired up.
The floor's failing state at this boundary is **silence**, not an exception (that is `§1B.36.11`'s
whole point about boundaries), so the only way to distinguish *"the floor held"* from *"nothing
ran"* is a fixture where the advance is required to **succeed**.

Rows 2–3 on `1.8` stay as ruled — they assert the floor **through the clock**, which is a different
boundary and a different claim.

#### (d) The shape

**Redistributing a gate table can leave its owner with nothing, and the owner is the only ticket
whose landing the assertions were scheduled against.** I moved three rows by asking *where can each
one run* and never asked *what does the ticket they came from still prove.* Corollary, third time
tonight and the sharpest form: **every negative assertion needs its positive control in the same
ticket** — I ruled that in `§1B.36.19`, applied it to the pair I was moving, and did not notice the
pair I was creating. A rule you have just published is not thereby applied. 📈

### §1B.36.21 — @Lumen's shared-base requirement is **adopted and it is load-bearing**, but not for the reason given: the revival predicate is the **tick's**, and A/B are **direct** calls that bypass it. The real reason is stronger — **B cannot mint on a never-rotated base at all** — and chasing it finds `§1B.36.10`'s shape a second time (2026-08-30)

#### (a) Adopted — one base, one variable

A and B share **one** base fixture varying **only** the enrollable count. Two fixtures differing in
two variables calibrate nothing. Right, and it goes in the gate.

#### (b) But the stated ground does not hold at this boundary

@Lumen's reason: *"the revival predicate refuses it before the floor is ever consulted."* Read
`§1B.31.3(i)` and row `1.9a`: the ruling is *"revival is **the clock's** job, never the join's,"*
and the row says *"**the tick** also probes combs with no open rotation, but only those with ≥1
RESOLVED rotation."* **The predicate is the tick's selection, not `comb_advance_rotation`'s body.**

A and B are **direct `service_role` calls**. They bypass the tick's `WHERE` entirely. So on a
never-rotated base, A's silence would **not** be the pre-launch guard's — that guard is not on this
code path.

#### (c) The real reason, and it makes the base requirement B's precondition rather than A's alibi

`comb_advance_rotation` derives the **next** subject by walking from the current one (*"`comb_members`
by `joined_at`, **wrapping**"*) and the **next** `closes_at` as *"`closes_at` + k·cadence"* — both
read the **prior rotation**. On a comb that has never rotated there is **no cursor and no
`closes_at` to advance from.**

So B does not merely fail to be a control on a never-rotated base — **B cannot pass at all.** The
shared base with ≥1 resolved rotation is the precondition for the *positive* half existing, which
is a stronger requirement than attributing the negative half's silence. Same conclusion, and it now
survives someone checking it.

#### (d) The gap this exposes — `§1B.36.10`'s shape, second instance

**The revival guard is in the CALLER.** Nothing specifies what `comb_advance_rotation` does when
called directly on a pre-launch comb — and it has two direct callers that are not the tick's
`SELECT`: this gate, and `OPS-9`'s finisher calling it in a loop. `§1B.36.10` ruled on exactly this
situation: *"a floor placed in the caller is a floor the exempt caller does not have — put the
invariant where every caller passes through it."*

**RULED — @Fizz, on `1.9a`: `comb_advance_rotation` treats "no resolved rotation" as DORMANCY —
return quietly, raise nothing — in its own body**, not only in the tick's selection. The tick's
predicate stays (it is a cheaper filter and it is `§1B.31.3(i)`'s ruling); this is the same
invariant where every caller meets it. Then the base requirement tests **specified** behaviour
instead of dodging unspecified behaviour.

#### (e) The gate becomes a 2×2 with one green cell

Adding the guard adds an assertion, and `§1B.36.20`'s own rule says a negative assertion needs its
control in the same ticket. It already has one — **B**:

| # | enrollable | prior rotation | assert |
|---|---|---|---|
| **A** | **1** | ≥1 resolved | no new row, no raise — the **floor** held |
| **B** | **2** | ≥1 resolved | **a new row appears** — the shared **positive control** |
| **C** | **2** | **none** | no new row, no raise — **pre-launch**, per (d) |

**A and C each differ from B in exactly one variable, and B is the control for both.** One base,
three cells, one green. A distinguishes *floor held* from *nothing ran*; C distinguishes
*pre-launch refused* from *nothing ran*; and because they vary different axes, neither can stand in
for the other — which is the thing a single "returns quietly" assertion would have hidden.

#### (f) The shape

**A guard cited to explain a behaviour is only an explanation if it is on the code path you are
standing on.** @Lumen's requirement was right and its reason belonged to the tick, one boundary
away — the same distinction this arc has now drawn four times (direct call vs tick; error object vs
log line; gate vs client). **When you justify a fixture by naming a guard, name the caller too.**
Corollary: **a caller-side predicate has as many holes as the function has other callers** — count
them before treating it as the invariant. 📈

### §1B.36.22 — @Lumen's two additions are right and adopted. And then I ran `§1B.36.20`'s own test on my last three rulings: **rows `1.8` and `1.9a` gained three requirements and neither row knew.** I fixed the instance and not the habit (2026-08-30)

#### (a) Adopted, both

**The comment carries mechanism AND hazard.** The derivation is *undefined* without a prior
rotation — no subject cursor, no base `closes_at` — not merely disallowed; and `§1B.31.3(i)`'s
hazard is that a `now()` fallback silently mints month 1 over the organizer's chosen subject. Right:
a quiet return with no comment reads as **unfinished**, and the next helpful hand completes it with
exactly that fallback.

**Two indistinguishable quiet returns is correct by design.** The discriminator is the record, not
the return value — `comb_rotations` count zero = pre-launch, some-but-none-open = dormant. Checked
against the callers: the finisher runs *after a successful seal* and the revival probe selects
*≥1 resolved*, so **neither production path can ever be pre-launch.** The in-body guard is
defence-in-depth for the direct caller only, which is what makes quiet the right verb rather than a
lost signal.

#### (b) Then I applied `§1B.36.20`'s test to my own last three rulings

*If the builder read only the table, what would they build?*

| ruling | requirement added | landed on the row? |
|---|---|---|
| `§1B.36.19` | rows 2–3 (the clock pair) → row `1.8` | **no** |
| `§1B.36.20` | the A/B pair → row `1.9a` | **no** |
| `§1B.36.21` | in-body pre-launch dormancy + the 2×2 → row `1.9a` | **no** |

**Three requirements, two rows, zero row edits** — every one of them published, cited, ratified,
and invisible to the surface its builder navigates by. `§1B.36.20` diagnosed exactly this, gave
`ENG-100` a row, and I committed the same failure three more times inside twenty minutes.

**The distinction that matters: I fixed the INSTANCE, not the HABIT.** `ENG-100` got a row because I
happened to consolidate it. Nothing changed about how the *next* requirement finds its row — and the
next three didn't. A rule that fires once, retroactively, on the case that prompted it is not in
force; it is a repair.

Both rows amended in place: `1.9a` now carries the in-body dormancy ruling (mechanism + hazard) and
the A/B/C table with its shared-base and one-axis conditions; `1.8` now carries the inherited clock
pair with the undeletable-pair comment and the reason it is runnable there (`1.9a` is already a dep).

#### (c) The process invariant, so this stops recurring

**Every ruling that adds a requirement to a ticket edits that ticket's ROW in the same commit.** Not
a later consolidation — the same commit, or the requirement exists only in a dated section that the
builder has no reason to open. The test is already written (`§1B.36.20`); what was missing was
*when* to run it, and the answer is **at authoring time, on the ticket you just changed**, not at
review time across the whole table.

#### (d) The shape

**A rule applied retroactively to the case that produced it has not been adopted — it has been
paid off.** The evidence is the next three cases, and mine failed all three. **When you publish a
process rule, the first thing to do is not admire it; it is to run it forward on your own next
action, and then to name the moment it must fire from now on.** Corollary, and the reason this one
hid so well: consolidations *feel* like the fix, because they leave a tidy artifact — but a
consolidation is a batch repair, and a habit is what makes batch repairs unnecessary. 📈

---

### §1B.36.23 — **§1B is in two parts and nothing says so.** Thirty-four sections — every §1B.36.x — sit *after* §11, and the preamble's count still reads "Seventeen." The split is also why §1B.13's line-cite ban has had no consequences all evening (2026-08-30)

**Provenance.** @Lumen closed the encode step with *"a compression banked into
memory propagates later with the authority of a record"* — their `C1–C5` range,
sourced from their own core. I ran that check against **my** core rather than
accepting it, verifying six banked compressions against the doc. My core was
clean. The document was not.

#### (a) The structural defect, measured

| | |
|---|---|
| §1B sections, total (this commit included) | **69** — *70 as of §1B.36.24* |
| above §2 (§1B.1 → §1B.32) | **35** |
| **below §11 (§1B.33 → §1B.36.24)** | **34** — *35 as of §1B.36.24* |
| continuation note at the §1B.32/§2 boundary | **none** |
| continuation note at §1B's header | **none** |

§1B's header sits at the top of the file; §2 begins immediately after §1B.32;
and §1B.33 resumes *after §11*, at the file's tail. **A reader who opens §1B to
see the amendments, reads to §2 and stops has read 35 of 69 and has no signal
that 34 remain** — and the 33 are the *newest*, so they are the ones most likely
to still be live: `ENG-100` entire, `OPS-9`'s advance, the tombstone class,
`subject_name`, `comb_member_count`, and every gate ruling from tonight.

The preamble compounds it. *"Seventeen corrections"* was exact when written and
now understates §1B by 52 sections — **and it does not read as stale**, because
a reader who stops at §2 has just read something close to that many. The number
*confirms* the truncation instead of exposing it. That is @Lumen's shape exactly,
one layer out: not a compression banked in memory, a compression banked in the
artifact's own preamble, where it carries the authority of the document.

**Two header styles also exist** — §1B.1–§1B.18 are `### 1B.x`, §1B.19 onward are
`### §1B.x`. `grep -E '^### §1B\.'` returns 34 and looks exhaustive. It is half.

#### (b) The larger finding: §1B.13's ban has been unenforced by accident

§1B.13 rules *"cite this document by section, never by line."* Its stated ground:
*"§1B has now grown thirteen times, always upward, and every growth shifts every
line of §2–§11 down by the size of the amendment."*

**[SUPERSEDED ON LIVENESS 2026-08-31 — §1B.38.7. The measurement below was exact at
`4044d15` and is FALSE at `4d0066d`: `§2` has moved from `2798` to `2848`, +50 lines,
in three commits — and the first of them is `63835d5`, THIS SECTION'S OWN COMMIT,
which added the two-parts preamble above `§2`. The mechanism was revived by the
finding that declared it dead. §1B.13 is upheld on the rule AND on the ground; read
§1B.38.7 before citing this paragraph.]**

**That mechanism died at `1fc1696`, the commit that first appended §1B.33 below
§11.** Measured across all 65 commits that touch this file:

| | §2's line | file lines |
|---|---|---|
| first commit (`7a32b60`) | `37` | — |
| last commit before the split (`bf779ea`) | `2798` | — |
| `1fc1696` → `4044d15` — **36 commits** | **`2798`, unmoved** | 3,806 → 5,481 |

**Every line of §2–§11 has been frozen for 36 commits and 1,675 lines of growth.**
So tonight I cited `:3113`, `:3128`, `:3137` and `:3316` in channel — four
violations of a rule in this document — @Lumen verified two of them against a
later commit, and **all four resolved correctly.** The rule was broken, the
breakage was checked, and the check passed.

**A rule whose violations stop having consequences stops being a rule** — and
here the thing removing the consequences was itself the defect in (a). The
stability is not a property of the document; it is a property of *where the next
amendment happens to land*, and it reverses the instant anyone prepends to §1B
or reflows the split. §1B.13 is **upheld on the rule, superseded on the ground**,
annotated in place.

**The four cites, converted, as the rule requires:** `:3113` → **§8.2** (`ENG-76`
cancelled); `:3128` → **§8.3** (`COPY-13`'s retired-token list); `:3137` →
**§8.4** (no price ruling before `C1` and `C5`); `:3316` → **§10**, `O4`. This
commit shifts all four. **They are now dead as line numbers** — which is the
demonstration §1B.13 asked for, delivered on my own citations inside the hour.

#### (c) Ruled: marked, not reflowed — and why

Moving 34 sections above §2 would relocate ~2,700 lines on a branch that is
merge-ready and waiting on one word from @Colin, would re-break every line cite
in the file, and would put a 2,700-line reflow into a diff whose entire safety
argument is *"docs only, zero overlap with `main`'s 30 commits, zero conflict
markers."* **The reading defect is fixed by navigation; the reflow is not worth
the merge risk tonight.** Encoded:

1. **§1B header** — amendment retiring the "Seventeen" count and stating the
   two-part structure, with the missing sections named.
2. **§1B.32/§2 boundary** — a `⤵ §1B CONTINUES AFTER §11` marker, written into
   the run of seventeen stray `---` separators that was already sitting there.
3. **§1B.13** — upheld on the rule, mechanism annotated as expired at `1fc1696`.

**Follow-up, deliberately not done now: reflow §1B into one contiguous block
after the merge lands.** Named here so it is not lost, and it belongs to whoever
next has this file open with no merge pending.

#### (d) Running the process invariant on this ruling

§1B.36.22: *every ruling that adds a requirement to a ticket edits that ticket's
row in the same commit.* Ran it. **This ruling adds no requirement to any §8.6
row** — it is document navigation, and @Lumen's `COPY-13` sweep is `git grep`
over `docs/strategy/`, which is indifferent to section placement. No row edit is
owed. Stating that I ran the check rather than leaving its absence to be read as
either answer.

**Open:** `O3`, `O4`, `O8`, `O9`. No new `O`.

---

**The shape.** I have spent tonight asking whether a builder's surface carries a
requirement, whether a document is reachable from `main`, and whether a rule was
adopted or merely paid off. **I never asked whether the document could be read
in order.** A file is a surface too, and its structure is a claim about reading
order that nothing tests — there is no gate for "the section you are looking for
is 2,700 lines below where the section ends." Corollary, and the one that
generalises: **a rule that is being violated without consequence is
indistinguishable from a rule being followed** — so when a rule looks
well-observed, check whether anything would happen if it weren't. 📈

---

### §1B.36.24 — `ENG-100` was built correctly and **would have reverted `ENG-92` Part 6 on merge**: `…0010`'s `create or replace` of `comb_preview_by_invite_code` was derived from a superseded body. Reproduced, fixed by @Fizz, landed and re-verified — and the class had a second member in `OPS-9` (2026-08-30)

@Fizz reported `ENG-100` (row `1.7b`) built on `fizz/eng94-repoint-subject-gone@faf47ad`, with a
full suite of **49 gates / 1,667 assertions / exit `0`** on the pushed commit, and `github/main`
`ls-remote`-confirmed unmoved at `7d61ba5` before and after the push. Every one of those statements
was true. The merge was still red.

#### (a) The ticket itself was correct — verified before raising the objection

Read `…0010` end to end. The floor is as ruled: `get diagnostics` on the roster snapshot, raise at
zero with `errcode = 'check_violation'` **and** `constraint = 'comb_open_rotation_enrollable_floor'`,
no `using table` (§1B.36.12/.13/.14). The ENROLLABLE predicate is the general one
(`removed_at is null` + `not exists … deleted_at is not null`), not organizer-scoped
(§1B.36.18 Correction 1). On the merged tree both of Fizz's own gates passed:
`check-comb-open-rotation` 13/13, `check-comb-preview` 11/11.

Fizz's rename-the-constraint mutation is also the probe that settles §1B.36.13's operator question:
a code-only assertion — or a code-`||`-constraint one — stays green under a rename. Redding under it
is what proves the conjunction.

#### (b) The defect — a `create or replace` derived from a superseded body

```
merge-base(github/main, fizz/eng94-repoint-subject-gone) = 46ce848
main…branch                                             = 2 ahead, 6 behind
```

The six were `OPS-11`, `ENG-92` (`4dc65d7`), **`ENG-92` Part 6 (`1ba6315`)**, `ENG-99`, and two
Part 2 fixes. `ENG-92` Part 6 is `main`'s `…0007`, and it `create or replace`s
`comb_preview_by_invite_code` to add the tombstone predicate to the `member_count` leg:

```sql
from public.comb_members m
join public.profiles p on p.id = m.profile_id
where m.comb_id = v_comb_id and m.removed_at is null and p.deleted_at is null
```

`…0010` replaced the same function with a body derived from `…0006`, without that leg. **`0010` >
`0007`**, so on a fresh replay and on prod alike the stale body runs last and wins. Sage's own
`…0007` header names the split — `member_count` is Part 6's, and only `subject_name`/`inviter_name`
were routed to `ENG-94`.

#### (c) Reproduced, not argued

Merged `github/main@7d61ba5` with `faf47ad` in a throwaway worktree, resolved the one real conflict
(§(d)), and ran it:

| run | result |
|---|---|
| `check-eng92-comb-rotation-fixes` on `main` alone | **18 passed, 0 failed** |
| the same gate on the merge commit | **17 passed, 1 failed** |
| the failure | `§1B.32 leg 1: comb_preview_by_invite_code member_count excludes a tombstoned member — [{"member_count":3}]` |
| full suite on the merge commit | 50 gates, **1,689 passed, 1 failed** |

Two things a branch-local run structurally could not see:

- **The gate did not exist on the branch.** `package.json` listed **50** `check:` scripts on `main`
  and **49** on the branch; `check-eng92-comb-rotation-fixes` arrived in the six commits the branch
  was behind. The 49/49 was honest and blind by construction.
- **`npm test` exited `0` on the merge commit with that gate red** — this repo's known-unreliable
  exit status, re-earned. `exit 0` is not evidence here; the per-gate `FAIL` lines are.

#### (d) There was also a real conflict, and it was the *visible* half

`scripts/lib/prod-schema-sentinels.mjs` — both sides append a sentinel at the same anchor.
Mechanical: keep both, `…0007` then `…0010`, 47 keys. Worth recording because it means the PR did
not merge clean, so a reviewer *was* stopped — just not by the thing that mattered. The revert lived
in two different files with zero textual overlap and auto-merged without a murmur. **A clean merge
is a statement about text, never about semantics.**

#### (e) Fixed and landed — verified on `main`'s actual tip, not on the branch

@Fizz rebased onto `main`, kept both sentinel entries, and re-derived the `member_count` leg from
`…0007`'s body — reproducing the exact red string first, then restoring. Independently verified:

```
ls-remote github/main                  →  52a9733
merge-base --is-ancestor 7d61ba5 main  →  YES (true fast-forward, no merge commit)
npm test @ 52a9733 (own worktree)      →  50 gates, 0 FAIL, 1,690 assertions, exit 0
rev-parse HEAD in the same shell       →  52a9733
```

Content on the tip: `…0010` carries **both** `p.deleted_at is null` (`ENG-92` Part 6 restored) **and**
`comb_subject_gone(v_comb_id, v_subject_id)` (`ENG-94`'s own collapse) — the re-derivation did not
cost `ENG-94` its own change, which was the live hazard the fix itself introduced. `ENG-100`'s floor
intact with the errcode/constraint pair. No duplicate migration prefixes. **Row `1.7b` is closed.**

#### (f) The class, run rather than assumed — `OPS-9` is the second member

Enumerated every unmerged remote branch carrying a migration. Two were comb-era: `ENG-94`'s and
`bumble/ops9-rotation-scheduler`, which is now **11 behind** `main`.

`OPS-9` is clean on *this* axis — it `create`s one new function and replaces none. But `OPS-11`
landed on `main` inside its gap, extending `check-share-visibility` into a catalog-wide
`EXPECTED_DEFINER_GRANTS` map whose stated rule is *"no row at all is also a failure — a new definer
ships un-reviewed."* `advance_due_rotations()` is `security definer` and has **no row** (it appears
on `main` only inside another entry's `why` string). It reds on merge. Separately, `…0005` now sorts
below `main`'s `0006`–`0010`; **renumber target is `…0011`**, and it moved once already tonight.
Both carried onto row `1.8`.

#### (g) The shape

Fizz checked that `main` had not moved — **the right check for a push race, and the wrong one for a
stale base.** *"`main` is still where I left it"* and *"my base is `main`"* are different claims, and
only the second makes a branch-local green suite predictive of the merge. **A green suite is scoped
to the gate set it ran, and a branch's gate set is a snapshot of its merge-base** — so the gates most
likely to catch a change are exactly the ones a behind-branch does not have. Count `package.json`'s
`check:` scripts on both sides before trusting an N/N.

**The correction that matters, because the fix ran the same check again:** on the second push Fizz
wrote *"confirmed `main` unmoved at `7d61ba5`"* — and that time it was correct **and** sufficient,
because the rebase had just made `7d61ba5` the base. `ls-remote` was never the flawed instrument; it
answers *"has `main` moved since I read it,"* and it becomes sufficient the moment your base **is**
the ref you compare. Rebase-then-confirm is the whole fix. **A check that was insufficient is not
thereby wrong — it was answering a question nobody had asked yet.**

Corollary, and the transferable half: **a `create or replace` is a whole-body assertion about a
function at a moment in time. Re-derive it from the highest-numbered prior definition at MERGE time,
never at authoring time.** Same family as §1B.36.8's *a fix that names its class freezes that class
at the author's base commit*, one layer down — here the "class" is the function body itself, and the
enumeration that goes stale is not a list in a comment but every line the author did not retype.

---

### §1B.36.25 — @Lumen's month-1 `closes_at` derivation is **right as a rule and wrong as a location.** The arithmetic is confirmed; the **site** is refused. `p_closes_at` is a caller-supplied parameter with no floor, no future check and no CHECK constraint, so a client-computed timestamp puts the rotation clock on **device time** — and this document's own argument for storing `cadence` once already forbids it (2026-08-30)

**The flag,** `GUIDES/POLLINATE_DES29_CREATE_COMB_SPEC.md` §4.2, raised for ratification rather than
assumed:

> **Month-1 `closes_at` = creation moment + the chosen cadence** — *derived*, no contrary ruling
> found; flagged for ratification rather than silently assumed.

**Ratified on the arithmetic.** Month 1 is the base case of §1B.31.1iii's `closes_at + k·cadence`
recurrence; a recurrence needs a base, and `creation + cadence` is the only base consistent with
every later boundary. Nothing else was ever ruled, and I found no contrary ruling either.

**Refused on the site.** Three findings, verified at `github/main@57df6d1`, all in the **live**
bodies rather than the authoring migrations:

1. **The mint never inspects the parameter.** `comb_open_rotation(p_comb_id, p_subject_profile_id,
   p_closes_at)` — current body `20260830000010_eng94_repoint_subject_gone.sql:66-155` — carries no
   floor, no `> now()` test, no clamp. `p_closes_at` travels from the signature to
   `insert into public.comb_rotations (… closes_at) values (… p_closes_at)` untouched.
2. **The column does not catch it either.** `comb_rotations.closes_at timestamptz not null`
   (`20260830000002_comb_rotation_schema.sql:474`); the table's `constraint` block holds
   `comb_rotations_sealed_xor_voided` and `comb_rotations_sent_requires_sealed` and nothing about
   time.
3. **A past `closes_at` is not an error — it is an immediate void.**
   `seal_and_send_rotation`'s only earliness gate is
   `if v_closes_at > now() then raise` (`20260830000009_eng95_seal_nonmember_subject.sql:129-131`).
   At-or-before `now()` passes straight through. The tick then finds zero entries and **voids month
   1**, which is precisely the state §1B.26.3 spent an evening teaching this system to distinguish
   from a quiet month — and it is `C1`'s denominator. **A wrong clock does not raise; it manufactures
   a failed comb.**

**So what actually goes wrong, with the client holding the pen:**

- **Device clock.** A phone an hour behind, or a user who set the date back, mints a rotation that is
  already closed. Silent. No refusal at any layer above.
- **The type does not survive the trip.** `combs.cadence` is
  `interval not null default interval '1 month'` (`20260830000008_eng93_comb_open_rotation.sql:70-71`).
  JavaScript has no month interval. `setMonth(+1)` on 31 Jan yields **3 Mar**; Postgres's
  `timestamptz + interval '1 month'` yields **28 Feb**. Month 1's boundary is the base every
  subsequent boundary derives from, so the divergence is **inherited, not one-off.**

**And the decisive argument was already written, by `ENG-93`, in the commit that created the
column** (`…0008` header):

> `closes_at + cadence` (the clock rule, §1B.31 ratified) needs the number stored **ONCE** rather
> than hard-coded in this function and `OPS-9`/`ENG-60`'s future advance — *"two hard-coded copies in
> two callers is the drift class this team keeps burying."*

A client that computes `creation + cadence` is **the third copy**, in the one language that cannot
express the type. The ruling that put `cadence` on `combs` decides this question; it just had not
been asked at the client boundary yet.

**RULING — derive it in the mint, and make the client unable to set it.**

- `p_closes_at` becomes `p_closes_at timestamptz default null`.
- When it is null, derive `now() + c.cadence` from the comb row the function **already selects** —
  add `c.cadence` to the existing `select c.owner_id into v_owner_id from public.combs c where
  c.id = p_comb_id`. No extra round trip, no second read.
- **An explicit `p_closes_at` is honoured only when `auth.uid() is null`** — i.e. `service_role`, the
  advance supplying its own `closes_at + k·cadence` boundary. A real session's argument is **ignored,
  not floored.** A floor needs a threshold and still lets a session choose; ignoring needs neither
  and makes the hazard unrepresentable. Same shape as the fused CTA making an unnamed organizer
  unrepresentable, one layer down.

**This is a net DELETION of work.** It removes a requirement from `DES-29` rather than adding one:
the create screen keeps cadence as a **visible choice** (it writes `combs.cadence`) and stops
computing or sending a timestamp entirely. @Lumen — that is §4.2 and the step-2 signature line in
`GUIDES/POLLINATE_DES29_CREATE_COMB_SPEC.md`; open flag 1 closes here.

**Home: row `1.9a`, @Fizz** — stated in that row this commit, per the process invariant. Not
`ENG-93`: that migration is merged, and its row is done when the mint exists. Not a new row: this
does not change an artifact type — `1.9a` is already a migration that will `create or replace` next
to the mint, and it already owns **every other boundary in the clock** (`closes_at + k·cadence`, the
half-cadence floor). Month 1's base belongs with the recurrence that consumes it, in one ticket, or
the two halves of one clock drift the way two copies of one number do.

**Gate row (runnable at `1.9a`'s landing, `service_role` direct call):** mint with `p_closes_at`
omitted on a comb whose `cadence` is `interval '1 month'`, assert the stored `closes_at` is
`now() + interval '1 month'` within tolerance; and mint as an `authenticated` owner passing an
explicit past timestamp, assert the stored `closes_at` is **still** the derived future one — the
positive control and its negative in the same fixture, one axis apart (§1B.36.19).


---

### §1B.37 — @Lumen's strike of *"invited, not joined"* is **ratified, verified independently, and the standing rule is adopted with a different parent and a wider scope.** Then I ran the same rule **backwards** and the same screen has a state that HAS a query and no cell — and the row we just struck was the only thing standing where that person goes (2026-08-31)

*Vector, 2026-08-31. Every citation read at `github/main@88af096`. Routed to me by
@Lumen after @Pixel's `@`-mention in the UX Design thread carried no `p`-tag.*

#### 1. The strike is right, and I checked it rather than accepting it

- `combs.invite_code` is **one** code per comb, minted once at creation, unique
  (`20260830000002:150,152`). Not per recipient.
- `comb_members` has exactly **two** writers on `main`: the owner-seat trigger
  (`…0002:359`) and `comb_join_by_invite_code` (`…0004:75`). Both mint a
  **joined** row. Nothing anywhere mints a pending one.
- `…0002` creates exactly three comb tables — `combs`, `comb_members`,
  `comb_rotations`. There is no invitation table to have missed.
- The migration's own comment says so and says why (`…0002:174-177`).

**STRUCK. Both of @Lumen's grounds hold.**

**The asymmetry underneath it is the transferable half, because it predicts the
next one.** `hive_contributors` **does** carry `invited_by` (`20260827000001:49`)
and its rows are minted **by the owner, at invite time** — so in the *hive* graph
"invited, not joined" is a real, queryable, first-class state. `comb_members` is
minted by the **joiner, at join time**. DES-22 borrowed the hive roster's
vocabulary into the comb roster. **The word crossed the graph boundary; the
column stayed behind.** Standing check: **when a comb spec reuses a hive noun —
contributor, inviter, roster, removal — confirm the hive's column came with it.**
A borrowed word arrives with its whole implied schema attached, and a state table
renders as strings, which is exactly the form that hides a missing column.

#### 2. The rule is adopted — as a **sibling** of §1B.21, not a descendant, and unscoped

@Lumen filed it as an extension of §1B.21. That parentage is the one thing I am
changing, and it is not academic. §1B.21 reads *"any count rendered **to the
subject before the seal** names its source"* — three qualifiers, all deliberate.
Inherited, they let the next sourceless hollow cell through on any
**member-facing** surface, which is precisely where the next one will be.

They are different hazards that happen to share a remedy:

| | §1B.21 | §1B.37 |
|---|---|---|
| Failure | **two** queries satisfy one string | **zero** queries satisfy the state |
| Mechanism | **disambiguation** — the wrong wiring is invisible in the render | **existence** — the state cannot be wired at all |
| Why scoped | only bites where the wrong query leaks `C1` | an absent fact is absent for *every* reader, at every instant |

**Adopted, verbatim on substance, unscoped: every row in a member-state table
names the query that produces it, at ratification. A state with no query is a
product wish, not a spec row.** No subject/member qualifier, no pre-/post-seal
qualifier — those are §1B.21's and they stay there.

#### 3. Run it backwards: a query with no state, on the same screen

@Lumen's rule is **one-directional** — it deletes states with no query. The
reverse, **a query with no state**, is the same defect wearing the other face,
and this arc produced one of each.

`comb_join_by_invite_code` (`…0004:75`) writes `comb_members` **and only
`comb_members`**. The sole writer of `hive_contributors` anywhere in the comb path
is `comb_open_rotation` (`…0008:175`), which runs **at mint**. Scoped negative,
checked rather than assumed: I greped **every** `github/*` ref for `insert into
public.hive_contributors` outside `20260827000001` — every hit on every branch is
`…0008`'s mint or `…0010`'s replace of it. **Nothing on the remote adds a late
joiner to an open rotation.**

So someone who joins on the 10th is in `comb_members` and not in that month's
`hive_contributors`. **§1B.23.2 already named this** — *"Two rosters, two
clocks"* — and spent it entirely on the **count** and on `C1`'s denominator.
Nobody carried it to the **cells**. Three consequences, all in `DES-22`'s lane:

**(a) The member view does not render a cluster missing a cell. It renders
nothing.** `comb_rotation_roster` gates on `is_hive_contributor(v_hive_id)` and
takes an early `return;` (`…0002:583-587`) — a **zero-row** return, deliberately,
and its own comment says why: *"not a shaped response with fields nulled out."*
That comment is correct for the reader it was written to exclude (the subject).
For a late joiner it produces **an empty comb screen as the first thing they see
after tapping the invite link** — `DES-37`'s landing promise, delivered blank.

**(b) The two views of one cluster disagree about who exists.** Subject view
sources `comb_co_member_names` / `comb_member_count` — live `comb_members`, so the
late joiner is drawn and counted. Member view sources `comb_rotation_roster` — the
mint snapshot, so they are not. `DES-22` §6 lists these as items 1 and 2 of one
screen's reads and §2 draws **one** cell cluster with per-view badges. One
cluster, two populations.

**(c) The struck row was the only cell that could hold this person — and it held
them wrongly.** *"Invited, not joined"* would have absorbed a late joiner as *not
fully here yet*: true of their **rotation**, false of their **membership**.
Striking it is still right. But the strike leaves §2's four states with no honest
cell for **a member who is in the comb and not in the month**, and §2 now says
*"no fifth."*

**There is a fifth — and unlike the one we struck, it has a query:** in
`comb_members where removed_at is null`, **not** in this rotation's
`hive_contributors`. Two shipped, granted, authorized reads. No new schema, no new
function, no new grant.

**Ruled, the part that is mine:**

1. **The cluster's identity source and its write-status source are two reads, not
   one.** Draw cells from `comb_co_member_names` (live membership, readable by
   every member) and overlay `has_written` from `comb_rotation_roster` where a row
   exists. **A member never receives an empty cluster for a comb they belong to.**
2. **A late joiner's cell may not carry the hasn't-written dim mark.** §2's `·`
   means *has not written yet* — an invitation to act. This person **cannot** write
   this month: an `entries` insert requires hive contribution and they have none.
   Marking them quiet is a chase-list entry aimed at someone with no way off it —
   §1B.9's failure with the friction removed, arriving through the one state we
   did not know we had.
3. **The visual is @Lumen's and @Pixel's**, including whether the state is named to
   the user at all. I am naming the **population**, its **query**, and the one
   thing it must not look like.

**Open, and not mine. New `O10` (@Colin): when you join a comb mid-month, are you
writing this month or next?** Today the answer is *next*, by omission — nothing
enrolls you and nothing tells you. The alternative (the join RPC also inserts a
`hive_contributors` row for the open rotation) is a **design**, not a bug fix: it
moves `C1`'s denominator inside an open window, which §1B.23.2 and §1B.36.8 spent
two rulings stabilising. **Nothing above is blocked on it** — (1) and (2) are
correct under either answer.

#### 4. One process note, owed since §1B.36.23

@Lumen cited these two rows as `:333` and `:1159-1164` — line cites into this
document, which §1B.13 bans. They resolved, and only because they were read at the
tip. **§1B.36.23's "frozen for 36 commits" measurement covers §2–§11 only; it does
not cover this half of the file.** §1B.8 moved `299 → 310` and §1B.21 moved
`1047 → 1073` between `4044d15` and `88af096`. Read from `4044d15` — the commit
immediately prior — `:333` lands in §1B.4's grandfathering paragraph and
`:1159-1164` lands mid-walk in §1B.22's RLS analysis: **a different section about a
different subject, both reading as perfectly plausible prose.** That is the
demonstration §1B.13 asked for, now delivered for the sections *above* §11 too.
The cites, converted as the rule requires: **§1B.8**'s *"So `DES-22` draws"*
sentence, and **§1B.21**'s *"Two smaller ones"* bullet 1. Both annotated in place
this commit.

#### Scope

Doc-only; no migration, no gate, nothing that blocks a merge. §1B.8 and §1B.21
annotated in place. **Row `1.4` (@Pixel) carries (1), (2) and the `O10` pointer,
this commit**, per the process invariant — the ruling is not the builder's
surface. `GUIDES/POLLINATE_V2_DES22_COMB_IDENTITY.md` is @Pixel's file and already
carries the strike correctly; the two sentences that still need this are §2's
*"no fifth"* line and §6's fused-single-read framing.

---

### §1B.38 — Two merges landed correct code and closed neither row. `OPS-9`'s deferral premise **expired one commit before its own merge**, and `DES-33` shipped a component whose ruled state **cannot render on its only mount** (2026-08-31)

All of the below verified by me at `github/main@5d4a2ff`, `git rev-parse` confirmed
in the same shell. Neither merge is wrong as code. Both are wrong as *status*, and
in this thread three separate statements — @Lumen's *"the critical path's first leg
is complete"*, @Fizz's *"1.1, 1.6, 1.8a, 1.8, 1.9a all done"*, and my own "first
leg" framing that seeded both — now say something the rows themselves deny.

#### 1. Row `1.8` (`OPS-9`) is still **partial**, and its stated reason for shipping half was false by merge time

`20260830000012_ops9_rotation_scheduler.sql:157-171` is the entire loop body:

```sql
loop
  begin
    perform public.seal_and_send_rotation(r.id);
  exception when others then
    raise warning 'advance_due_rotations: rotation % failed: %', r.id, sqlerrm;
  end;
end loop;
```

There is no `comb_advance_rotation` call. Row `1.8`'s own text still reads *"the row
is **partial, not done**, until the tick resolves then advances in one pass."*
Nobody edited it. The row is the only one of the four claims that is right.

**The finding is the deferral's premise.** The migration header at `:26-29`
justifies the half-merge: *"comb_advance_rotation doesn't exist on main yet —
calling an unbuilt function would be worse than an honest gap."* That was true at
Bumble's base. `git merge-base --is-ancestor 6d2d3b0 182b9f6` returns **true** —
`…0011_eng60_comb_advance_rotation.sql` (row `1.9a`) was on `main` **one commit
before** `OPS-9` merged. The blocker the deferral was built around was already gone
when the deferral landed.

**This is §1B.36.13's shape with a different operand.** That rule says a fix which
*names its class* freezes the class at the author's base commit. Here it is the
*reason* that froze — a deferral is an argument about the world, and an argument
written at a base commit has the same expiry as an enumeration written there.
**Standing rule: a deferral's premise is re-derived at MERGE time, not at authoring
time.** A stale enumeration ships a partial fix; a stale premise ships a *whole*
deferral that nothing needed.

`…0011:258` confirms the contract the header depends on, so the finisher is not
blocked on anything else: `if v_enrollable_count < 2 then` returns **null, quietly,
raising nothing**. Dormancy will not spam the tick log every five minutes.

**Also missing, and it is mine.** §1B.36.19 moved the CLOCK-BOUNDARY pair onto this
row — row 2 (floor intact → **no** matching warning) and row 3 (floor stripped →
warning matches, **the positive control**) — precisely because `1.9a`'s gate could
not run them. Neither is in `check-ops9-rotation-scheduler.mjs`. The gate header at
`:14-32` enumerates what it proves and carries no advance row; the only
`warnings.some` is the seal block's own control at `:389`. **I moved an undeletable
pair onto a row and the row merged without it** — §1B.36.21's lesson firing in the
direction I did not check. §1B.36.21 asked what the *source* ticket still proves; it
did not ask what happens when the *destination* ticket merges before the assertion
does. **A relocated assertion is only as safe as the destination row's own
completion, and a row that can merge partially can merge without it.**

Merge-time requirement (i) from §1B.36.24 **is** satisfied — `advance_due_rotations()`
sits at `check-share-visibility.mjs:421` with `roles: ['service_role']`. (ii)'s
renumber is spent (`…0012`). Only the second block and its two gate rows remain.

**Consequence, unchanged from §1B.31 and now marked green anyway:** a comb ends
after one month, `C1` and `C3` cannot be measured, and step 8 of the ratified
definition of done — *"and do it again next month for someone else"* — has no
server path.

#### 2. Row `1.6` (`DES-33`) merged a correct component into a screen where its ruled state cannot fire

`RotationFrame.js` is good code and @Sage's rebase-and-PR call was right. Three
defects, all at the **mount**, none in the component.

**(a) The props have no producer.** Whole tree, five sites, all reads:

```
$ git grep -n "rotationSubjectName\|rotationClosesAt\|rotationOrganizerName\|rotationSealedAt" github/main -- src/
src/screens/PackageOpen.js:491,493,494,495,496
```

`HiveStore.getReceivedPackage` (`:546-591`) returns `id, subjectName, coverTheme,
sentAt, senderName, isCollective, writerCount, contributorNames, entries` — **no
`rotation*` field**. So `pkg.rotationSubjectName` is `undefined`, the ternary at
`PackageOpen.js:491` always takes the `From {senderName}` branch, and
`RotationFrame` is **unreachable on `main`**. One mount point in the tree; no gate
references it. This is §1B.36-era "a sweep proves nothing until you check the
PRODUCER", arriving at a component instead of a scheduler.

**(b) The larger one — even with a producer, the ACTIVE state can never render
there.** `getReceivedPackage`'s query is
`.eq('subject_profile_id', subjectId).not('sent_at', 'is', null)` — subject-scoped
and **post-send by construction**. Any rotation that reaches that screen has already
been sealed, so `sealedAt` is always non-null, so `isSealed` is always `true`. The
branch rendering **"Writing for {subjectName}" / "N days left"** — *the exact string
in Colin's ratified definition of done* — is dead on its only mount, along with the
whole `setInterval` countdown at `RotationFrame.js:9-22`.

**Row `1.6` closed the component; it did not close the step.** The active line
belongs on the **collect** surface — the `(g)` header state-line slot — fed by an
open-rotation read. That is row `1.9` (@Fizz) or row `1.4` (@Pixel), not the reveal
screen's.

**(c) A copy claim the advance policy contradicts.** The sealed branch renders
*"Next month: {organizerName} leads."* `comb_advance_rotation` selects the next
subject as the enrollable member with the next-larger `joined_at`, wrapping to the
earliest (`…0011:292-315`). **The organizer is next only by coincidence of join
order.** For most rotations that sentence is false. It is also unratified copy —
`COPY-6` is row `1.10`, @Lumen's. **(c) IS SUPERSEDED ON ROUTING AND STRENGTHENED ON
SUBSTANCE BY §1B.38.1: @Lumen rules the sentence STRUCK, not reworded** — the defect
is not the noun, it is that the surface has no source for any noun, and a copy ticket
cannot fix a sourcing defect. Read §1B.38.1, not this paragraph, before touching the
sealed branch.

#### 3. What does NOT change

`1.8`'s gap does not block @Fizz starting `ENG-60`. `notify → collect → seal →
reveal` is one month; the advance is month two. What changes is the **acceptance**:
`ENG-60` cannot be scored done against a sentence whose eighth clause has no server
path, and the *"writing for Sarah — 6 days left"* clause needs a mount `ENG-60` adds,
not one `1.6` supplied.

#### Scope

Doc-only. **Rows `1.6`, `1.8` and `1.9` amended in this same commit** per the
§1B.36.26 process invariant — the finder's section is not the builder's surface. The `OPS-9` finisher is @Bumble's and is currently unowned in
practice — `OPS-8`, `OPS-12` and `LEGAL-2` are all parked on one word from @Colin.

**The transferable rule, third instance tonight:** a merge tells you a diff landed;
it never tells you a *row* closed. Row `1.8` said "partial" in its own text and
merged anyway. Row `1.6`'s component merged into a screen its ruled state cannot
reach. **Score the ratified sentence, not the merge log.**

---

### §1B.38.1 — @Lumen RULES §1B.38(2c): the sealed state renders **no future line** in v1. The strike has **four containers** (**fourteen sites** — see §1B.38.2), and two of them route the replacement copy at a ticket that closed tonight (2026-08-31)

**The ruling (Lumen's, ratified here, effective immediately):** *"Next month:
{organizerName} leads"* comes **out**, not reworded. Their pin, which I adopt
verbatim as the reason: **order is a mechanism, not a rendered promise.** A client
sentence naming next month's writer either reimplements `comb_advance_rotation`'s
ordering (the R12 adopt-don't-copy violation, §1B.36.10) or promises a schedule the
tick may change — skips, dormancy, revival. **No softened form survives either
horn:** *"the comb writes again next month"* is false for a comb that goes dormant
(`…0011:258` returns null quietly, by design), and the reveal screen's read cannot
know which. **A rendered future is licensed only by an existing rotation row**, and
`getReceivedPackage` carries none. When `ENG-60`'s read path lands, `DES-31`'s fold
may render next month's subject **from the minted row** — adopting the record, never
the ordering.

This supersedes my §1B.38(2c) framing, which called the sentence *false for most
rotations* and routed the fix to `COPY-6`. Lumen's is the stronger claim and the
correct one: the defect is not the noun, it is that **the surface has no source for
any noun**. A copy ticket cannot fix a sourcing defect — that is §1B.21's own shape
(*a rendered state names its query*) arriving at a sentence about the future instead
of a count.

#### The strike's containers — four, not one

Lumen scoped it as *"a strike of the `organizerName` block (`RotationFrame.js:34-37`),
one small diff."* The block is `:34-38` (the closing `)}` is `:38`), and the sentence
lives in **four** places, verified at `github/main@5d4a2ff` plus the workspace:

| # | Container | Sites | Disposition |
|---|---|---|---|
| 1 | `src/components/RotationFrame.js` | `:34-38` block, **`:5` prop** | strike both — a struck block leaves an unused prop that reads as pending |
| 2 | `src/screens/PackageOpen.js` | `:494` `organizerName={pkg.rotationOrganizerName}` | strike — the prop's only pass-through |
| 3 | `MOCKUPS_DES33.md` (**in-repo**, merged `5d4a2ff`) | **`:7`, `:60`, `:74`, `:79`, `:112`, `:131`, `:172`, `:174` — EIGHT, not three; see §1B.38.2** | annotate struck; `:79`/`:174` do not merely defer, they **pre-argue a resolution the ruling rejects** |
| 4 | `GUIDES/POLLINATE_DES33_ROTATION_FRAME_SPEC.md` (workspace, @Deezine's) | `:130`, `:148`, `:231` | annotate struck; `:148` reads *"Copy is Lumen's via `COPY-13` when this row is built"* |

**Containers 3 and 4 are the finding.** Both flag the line as a *placeholder awaiting
`COPY-13`*. **`COPY-13` closed tonight** — @Lumen ratified `728eba2`, merged as
`1ab8e81`, and it produced no such copy because the ruling that arrived is a
**strike**. So both specs now route a live-looking TODO at a **closed ticket**, and
the next person to open either one inherits *"this sentence is coming"* when the
ruling is *"this sentence is gone."* **A strike annotated only in the code leaves
every spec that specified the code arguing for its return** — same family as
§1B.36.15 (a rename at a layer boundary breaks the grep that finds the consumer),
one layer up: here the boundary is **code → spec**, and the grep that finds it is on
the rendered STRING, not the symbol.

**Standing rule: strike the SENTENCE in every container that specifies it, and when
a container defers to a ticket, check that ticket is still open.** A deferral
pointing at a closed ticket is indistinguishable from a deferral pointing at a live
one — §1B.38's own premise-expiry finding, arriving in prose instead of a migration
header, on the same night.

#### Scope

Containers 1 and 2 ride **row `1.9`** (@Fizz, amended this commit — the strike is a
few lines inside a screen he is already editing). Container 3 is in-repo and rides
the same diff. **Container 4 is @Deezine's workspace file and is NOT mine to edit** —
flagged to them and to @Lumen; if `DES-33` is re-opened for the collect mount, that
spec is what the builder reads first.

#### What Lumen also owns, correctly, and I did not catch

Their §1 self-correction is the sharper of the two: every `comb_advance_rotation` in
`…0012` is a **comment**, including the `perform` at `:28`, and **three of us read a
grep hit inside a comment as code on one file in one night** — mine included, in the
`…0012` sweep that produced §1B.38. My §1B.38 reached the right verdict by reading
the **loop body** (`:157-171`) rather than the grep, which is luck about method, not
method. **Banked: a grep hit satisfies a reader exactly as well as code until someone
checks the container** — and `grep -n '^\s*--'` is the whole check.

---

### §1B.38.2 — I censused the strike by its **rendered string** and found 3 of 8 sites in my own container. Five sites discuss the same claim by its **prop name** or its **deferral**, and two of them argue for the sentence's return (2026-08-31)

**Self-correction on §1B.38.1's container-3 count. I named `MOCKUPS_DES33.md:60`,
`:74`, `:131`. Verified at `github/main@5d4a2ff`, the file carries EIGHT sites:**

| Site | Text | Why my census missed it |
|---|---|---|
| `:7` | ``- Props: `subjectName`, `organizerName`, `closesAt`, `sealedAt` `` | names the prop, never the sentence |
| `:60` | `│  "Next month: Maya leads"` | **found** — quotes the string |
| `:74` | **"Next month: [Name] leads"** *(placeholder noun pending `COPY-13`)* | **found** |
| `:79` | *"`organizerName` prop is used, but copy pending `COPY-13` — **likely should be next subject, not organizer**"* | names the prop + the closed ticket |
| `:112` | `organizerName: string\|null, // e.g., "Maya" (placeholder)` | prop type block |
| `:131` | `// Display: "Next month: [organizer] leads" (if organizerName provided)` | **found** |
| `:172` | `## Notes for Future Updates (COPY-13 / Next Release)` | **a whole SECTION HEADING named after the closed ticket** |
| `:174` | *"**Organizer name placeholder:** … spec indicates the copy may need the next **subject** instead. **Awaiting `COPY-13` ruling.** Component structure supports either with no changes."* | names the prop + the closed ticket |

**The mechanism, and it is my own COPY-13 lesson firing on the very finding that
banked it.** I built the container list from a grep on the **rendered string**
(`Next month`). That token finds a site only if the site **quotes** the sentence.
Five of the eight discuss the identical claim without quoting it — four by the
**prop name** (`organizerName`) and two by the **deferral** (`COPY-13`), overlapping
at `:79` and `:174`. This is *exactly* the shape banked on 2026-08-31 in the
repricing sweep — *an instrument token with a literal space misses its adjective
form* — one abstraction up: **a claim's cheapest literal token is the rendered
string, and the rendered string is itself a container.** The complete census is the
**union of three tokens**: the string, the **symbol that supplies it**, and the
**ticket it defers to**.

**`:79` and `:174` are worse than stale pointers, and this is the part that changes
what @Fizz must do.** A stale deferral says *"an answer is coming."* These two say
*"the open question is **which noun** — next subject or organizer — and the component
supports either with no changes."* **The ruling is that there is no noun.** A builder
who opens this file inherits a live-looking binary choice whose correct answer is
outside both options, and `:174` explicitly reassures them the component needs no
structural change — which is true of the swap and false of the strike. **A container
that pre-argues a resolution is not annotated by striking the sentence; it must be
struck as an ARGUMENT**, or the next reader re-derives the rejected option and finds
the code already shaped for it.

**Standing rule (generalises §1B.38.1's): a strike's census is the union of the
CLAIM's string, the SYMBOL that supplies it, and the TICKET it defers to — and every
hit must be read, because the sites that never quote the sentence are exactly the
ones arguing about it.** Corollary: **a section HEADING can carry a deferral** —
`:172` names a closed ticket in a header, which no line-level annotation reaches.

**Site count for the strike at the time of this section: fourteen** (container 1 = 2 — `:5`, `:34-38`; container 2 = 1 — `:494`; container 3 = 8; container 4 = 3). **SUPERSEDED BY §1B.38.4 — the true count is 23, and the token union is a FLOOR, not a census.**

---

### §1B.38.3 — the amendments were ratified and were **not on `main`** while the builder they were written for started work. **SUPERSEDED ON LIVENESS the same hour — by my own commit merging while I wrote this — UPHELD ON SUBSTANCE** (2026-08-31)

**What I verified, and when.** At ~02:34 UTC, `github/main` was `5d4a2ff` and
`4d0066d` was **1 ahead / 0 behind, unmerged**:

```
$ git grep -c "1B.38" github/main -- docs/strategy/POLLINATE_COMB_ROTATION.md
   (no output — zero matches)
$ git grep -c "1B.38" 4d0066d -- docs/strategy/POLLINATE_COMB_ROTATION.md
   10
```

@Fizz posted *"Starting on it now"* on `ENG-60` at **02:18 UTC**. Rows `1.6`, `1.8`
and `1.9` in his checkout at that moment were the **pre-amendment** cells: `1.6` read
as a closed step, `1.8` carried no finisher spec, and `1.9` carried **neither the
collect mount nor the strike's site list** — the two things §1B.38 exists to give
him. **That is a fact frozen at 02:18 and it does not move.**

**SUPERSEDED ON LIVENESS.** `4d0066d` fast-forwarded onto `main` at 02:30:14 −0400
(single parent `5d4a2ff`), between my check and this commit; `main` now carries all
ten `1B.38` hits. **The live ask is therefore not "merge it" — it is: @Fizz re-read
rows `1.6`/`1.8`/`1.9` at `main@4d0066d`, because you started against the previous
text.** A merge does not re-read a builder's row for them.

**And the supersession is the finding.** §1B.38's own sharpest claim is that
`OPS-9`'s deferral premise *expired between authoring and merge* — the header stated
a fact true at its base and false at its tip. **I then wrote a section whose premise
expired between authoring and push, on the same night, in the document that
documents the defect.** Not a contradiction of the rule: a demonstration of why the
rule cannot be discharged by vigilance. **Re-deriving a premise at merge time has to
be a MECHANISM.** The one that would have caught both, and is cheap enough to be
standing form: **re-run every command whose output you QUOTED, immediately before you
push** — a quoted verification is a claim with a timestamp, and the push is the only
moment its timestamp stops moving. Third instance tonight of fixing the INSTANCE
where the habit was the defect (§1B.36.27).

**UPHELD ON SUBSTANCE, unchanged.** This is §1B.36.22 firing one layer up from where
I caught it last time. Then: a finding on a docs branch is invisible to the merger.
Tonight I fixed the *rows*, published a process invariant that every ruling edits its
ticket's row **in the same commit** (§1B.36.26), satisfied it — and never asked
whether the **file carrying the rows** was reachable from the builder's `HEAD`.
**The standing check resolves the citation from THEIR ref, not mine:
`git ls-tree <their-ref> <path>` / `git grep <section> <their-ref>`.** A row is
delivered when it is on the builder's ref, not when it is ratified — and **not when
it merges either, if they started before it did.**

---

### §1B.38.4 — @Lumen's eye-read clause, run forward on my own container, finds the token the union structurally cannot see: **the spec item's own SECTION TITLE**. It is live in BOTH files, including the one just declared clean (2026-08-31)

**@Lumen's amendment, adopted:** *the token union is a **floor**, not a census — every
section a token lands in gets eye-read whole, because the argument blocks are exactly
the prose that discusses the claim in the feature's own name.* Their `:255-258`
question block matched none of the three tokens and was found only by reading the
neighbourhood of a hit.

**I ran it forward on `MOCKUPS_DES33.md` — eye-read all 184 lines — and it produces a
fourth token, not just a residue.** Containers 1 and 2 are clean at the eye-read
(`RotationFrame.js` is 55 lines with no prose; `PackageOpen.js:490-500` is the mount
and nothing else). Container 3 is not:

**`MOCKUPS_DES33.md:99` — `- ✅ On sealed: completion statement + next rotation preview`**

Zero matches on the claim string, zero on `organizerName`, zero on `COPY-13`. It sits
under **`## Design Constraints (Locked by DES-31 & §1B.36.1)`**, in the sub-block
**`### What is Rendered (Both Surfaces)`**, four lines below the Subject Mask's four
`❌` entries.

**This is the strongest form the defect has taken tonight, and the register is why.**
`:79` and `:174` are *arguments* about which noun. `:99` is an **affirmative render
permission** — a `✅` in a list whose siblings are the `❌` constraints a builder
treats as authority, under a header that says **Locked**, with **borrowed
attribution** to `DES-31` and `§1B.36.1`. A builder reading the mask block does not
read it as a placeholder to resolve; they read it as the licensed render set. The
strike removes the line from the code and leaves the constraints block **licensing
it**.

#### The fourth token: the spec item's own section title

The surviving phrase is `next rotation preview` — **verbatim identical in both
files** — and it is the **name of the spec item**, which is the vocabulary every
acceptance row and constraints row uses. @Lumen created that title themselves at
`:148` (`§Next Rotation Preview`). **A spec's own section titles are the token set
its checklists refer to it by; the rendered string is what the SCREEN says, and no
checklist quotes the screen.**

**And it is live in the file @Lumen declared at zero after the union re-census:**

`GUIDES/POLLINATE_DES33_ROTATION_FRAME_SPEC.md:264` —
`- [ ] Sealed state shows completion statement + next rotation preview`

**`:264` and the repaired `:271` are rows 4 and 8 of the same `## Acceptance
Criteria` checklist.** The eye-read *did* cover that section. `:271` matched a token
(`COPY-13`) and was repaired; `:264` matched none and was read past inside a section
already under the eye. **That is the precise limit of the eye-read clause: reading a
section does not suspend the reader's token-keying** — the eye scans for what it
knows the defect looks like. Same species as 2026-08-31's *classify the CLAIM, not
the container*, arriving at the reader instead of the classifier.

**Standing form, final:** a strike's census is **claim string ∪ supplying symbol ∪
deferred-to ticket ∪ the item's own SECTION TITLE**, then the eye-read of every
section any of the four lands in. The fourth token is the one that reaches
**acceptance rows and constraints blocks**, and those are where a struck line is not
merely pending but **licensed**.

#### The container with no text

`MOCKUPS_DES33.md:184` (*"See device screenshots in this PR for live rendering"*) and
its checked acceptance row `:168` (*"[x] Device verified on iPhone 16 QA"*) both point
at **images that render `Next month: Maya leads`**. No grep reaches them and no
in-prose strike repairs them. Flagged, not counted — the honest terminus of *the union
is a floor*: the last container has no tokens at all, and a checked QA box vouches for
a frame that now shows a struck sentence. **Not a blocker; a note for whoever re-shoots.**
Scoped negative: I checked `:159` (*"renders both active and sealed states
correctly"*) and it is **not** a defect — the completion statement survives the strike,
so the row stays true.

#### Count and routing

**True count: 23.** Container 1 = 2 (`RotationFrame.js:5`, `:34-38`) · container 2 = 1
(`PackageOpen.js:494`) · container 3 = **9** (`:7`, `:60`, `:74`, `:79`, **`:99`**,
`:112`, `:131`, `:172`, `:174`) · container 4 = **11** (@Lumen's 3 + 7 + `:264`).
Containers 1–3 ride row `1.9` (@Fizz). **`:264` is @Lumen's file and I did not edit
it** — routed, same as container 4 was.

---

### §1B.38.5 — the fourth token run forward on `COPY-13`'s retirements: the **acceptance-row register lives in a different TREE than the canon**, and `OPS-10` has no build profile that can pass its own checklist (2026-08-31)

**Method note first, because it is the reason this was found.** §1B.38.4 established
that the register the fourth token reaches is **acceptance rows, constraints blocks
and `✅`/`❌` permission lists**. Run that forward as a search rather than a repair:

```
$ git grep -lE "^\s*[-*]\s*\[[ xX]\]|^\s*[-*]\s*(✅|❌)" github/main -- docs/strategy/
   (no output — ZERO)
$ git grep -lE "…" github/main
   (no output — ZERO, repo-wide)
$ grep -rlE "…" GUIDES/ PLANS/ RESEARCH/
   18 files
```

**The canon has no acceptance-row register at all. Every one lives in the
workspace.** So `COPY-13`'s sweep — scoped to `docs/strategy/` — could not have seen
this class no matter which tokens it used. **A census's file list is a container,
2026-08-31's own lesson, one TREE over instead of one file over.**

#### `GUIDES/POLLINATE_TESTFLIGHT_ACCEPTANCE.md` — frame retired, `status: active`, zero annotation

Its own subtitle is **"(DS 11.1 artifact)"**. `DS` §11 was retired **the same night, by
this document's own edit** — `Pollinate_Strategy.md:467-474`: *"Retired as a launch
gate 2026-08-31 … the checklist below no longer gates any release."* The workspace
twin of that checklist was never told. It matches none of the repricing, sequencing,
`testflight|demo mode` or measurement-frame censuses **because none of them looked in
`GUIDES/`.**

**Disposition is INVENTORY, not dead** (@Lumen's three-state taxonomy, applied):
step 1 of the ratified sentence is *"a stranger can install"*, `OPS-10` still needs a
strangers build, and the file's own closing line is right — *the walk is the only
end-to-end instrument until a device farm exists*. What dies is (a) the **authority**
— passing authorizes nothing, per `Strategy` §11's retirement — and (b) the **Slice-1
loop probes**: the walk's steps 1–7 exercise journal → Today → Hive doors, i.e. *"the
daily loop, the thing Slice 1 exists to validate."* **An MVP-Comb build can pass this
checklist end to end and prove nothing about the eight-step sentence.** The walk needs
comb steps or it is an instrument pointed at a retired release.

#### The live defect it already catches, which nobody has run: `OPS-10` has no profile, and the obvious fix is refused by a green gate

Pre-flight row 2 requires **`DEMO_CONTENT` false for the tester profile**, and the
same row states the rule: *"A pitch/kiosk build is a **separate profile**, never the
tester profile."* On `main@4d0066d` there are **exactly three** profiles in
`eas.json`, and none of them is a strangers build:

| profile | distribution | `EXPO_PUBLIC_DEMO_MODE` | why it cannot be `OPS-10`'s |
|---|---|---|---|
| `development` | internal | **unset** (⇒ false) | `developmentClient: true` + `ios.simulator: true` |
| `preview` | internal | **`"true"`** | it IS the pitch/kiosk profile |
| `production` | *(store)* | `"false"` | store-bound + `autoIncrement`; not internal |

`src/constants/demoMode.js:20` derives `DEMO_MODE` from that env and `:46` sets
`DEMO_CONTENT = __DEV__ || DEMO_MODE`; a store-bound build has `__DEV__` false, so on
`preview` **`DEMO_CONTENT` is true** and four demo affordances render on a stranger's
phone — `Onboarding`'s `FlowToggle` and demo-skip link, `CoreRitual`'s *"Load demo
data"* (which writes fabricated rows into the real account just created), and
`HoneycombTab`'s seven fabricated people.

**And the shortcut is closed, correctly, by a gate.** `scripts/check-demo-mode-env.mjs:244-245`
**asserts** `preview` sets `EXPO_PUBLIC_DEMO_MODE` to exactly `"true"`. Flipping
`preview` to false to make it a tester profile turns that gate **red**, and a builder
reading a red gate on a one-token change reverts rather than re-reads. **The gate is
right — `preview`'s pitch semantics are pinned deliberately — and the profile roster
is simply one entry short.** `OPS-10` needs a **fourth** profile: `distribution:
internal`, `EXPO_PUBLIC_DEMO_MODE` absent or `"false"`, no `developmentClient`, no
simulator.

**Merge-time requirement that rides it, and it is the roster shape again:**
`check-demo-mode-env.mjs:266` loops over the hardcoded list
`['development', 'preview', 'production']` for the never-ship-a-demo-login-value
check. A fourth profile is **invisible** to that loop — the gate stays green while the
new profile goes unchecked. **Add the profile to the roster in the same PR**, and
assert the roster equals `Object.keys(eas.build)` rather than a literal, or the next
profile repeats this exactly (2026-08-30's *a cardinality assertion over a matched
subset proves nothing unless you also assert matched == total*, in list form).

Row `3.1` (@Colin, seed three real combs) depends on `OPS-10` shipping, so this sits
on the path to the combs `C1`–`C5` are read from. Amended onto row `2.8` this commit.

#### Two stale pointers inside it — and they expire in the OPPOSITE direction

Every stale-deferral instance tonight made a reader do something **wrong**. These two
make a reader do something **unnecessary**:

1. Pre-flight row 2: *"until the release-readiness gate derives `DEMO_MODE` from a
   build-profile env var (absent ⇒ false), **check the source by hand**"*, citing
   branch `fizz/demo-content-flag @ cec96cc`. **Met.** `git merge-base --is-ancestor
   cec96cc github/main` → true; `demoMode.js:20` is env-derived on `main`.
2. Closing section: *"`git grep -l DEMO_MODE -- scripts/` is empty on `github/main`
   today; **none of the fifteen gates sees this class**."* **False.** Two gates exist:
   `scripts/check-demo-content-callsites.mjs` and `scripts/check-demo-mode-env.mjs`.

**Banked: a stale pointer can expire toward LESS work as well as more, and that
direction survives longest — because doing the work by hand still passes.** A reader
following either instruction gets a correct result and never learns the automation
landed, so the pointer is never contradicted by an outcome. **When re-deriving a
deferral's premise, check both directions: has the blocker cleared, and has the
WORKAROUND been superseded?**

#### Scoped negatives, since I checked them

- `Pollinate_Strategy.md:34` (the Slice-1 Build-Slices bullet, still naming *"TestFlight
  / internal testing"* and the feed) sits **inside a block quote whose header already
  supersedes it as a release plan** (`:26-31`). Its sibling Slice-2 bullet carries an
  inline amendment and it does not — an asymmetry of the *cell-scoped annotation*
  species — but the block supersession reaches it. **Flagged to @Lumen as a judgement
  call, not asserted as a defect.**
- The other 17 workspace files carrying acceptance rows were **not** swept here. This
  section's claim is scoped to `POLLINATE_TESTFLIGHT_ACCEPTANCE.md`, which is the one
  whose *title* names a retired path.

---

### §1B.38.6 — @Lumen's `Strategy:34` ruling encoded; one citation completed; and a scoped negative worth recording so nobody "repairs" it (2026-08-31)

**Ruling adopted verbatim in substance:** `Pollinate_Strategy.md:34` is a defect of
**CONTRAST, not of content.** The `> **Build Slices:**` block header at `:26-31`
genuinely does reach the bullet — it supersedes the whole block *as a release plan* —
so the bullet is not live. What makes it a defect is that its **Slice-2 sibling
carries an inline amendment and it carried none**. **Annotation asymmetry inside one
block reads as deliberate distinction:** a scanning reader infers the unamended
sibling is the current one, which inverts the block header. Encoded at `:34`.

**One citation completed, per *check the citations, not the argument*.** Lumen's
clause read *"one release per §9"*; I verified all three legs and added the ruling
token the bullet's actual defect is keyed to:

| leg | verified at |
|---|---|
| one release, Slice 1 is not one | `COMB_ROTATION` §9 `:3339-3340`; **`O5` CLOSED** `:3371` (*"one release. The in-flight Slice 1 / MVP1 work folds into MVP-Comb"*) |
| TestFlight is MVP2 | `:74`, `:107` (`O7` closed; `OPS-10` is the path) |
| the friend feed is cut | `:2989` (*"Consequence: cut the friend feed"*), `:3185` |

`O5` is the token: the bullet's defect is **presenting Slice 1 as a release**, and
`O5` is the ruling that closed exactly that. Naming §9 alone gives the reader the
section without the ruling ID.

#### Scoped negative — `Pollinate_The_Ruling.md:125` is correctly untouched, and that needs saying

The Build-Slices claim has a second container: `The_Ruling.md:125` — *"**Why:** Slice 1
(Demo Mode) validates the social-gratitude loop…"* — under `## Wallet & Money:
Deferred to Slice 2`. **It is in the 2026-08-17 original body, which is under
append-only amendment discipline** (`docs/strategy/README.md:27` records the same
call for `:117`, `:237`, `:246` during the navigation sweep: *"left byte-untouched
under append-only amendment discipline and superseded by the amendment's own first
line"*). **Leave it.** The amendment layer is where that file gets corrected, and
that layer is already clean — `COPY-13` repaired `:478`'s *"Unchanged: Slice 1
shipping first"* in the 2026-08-30 amendment section.

**Recording this as a negative rather than silently skipping it, because a
convention-protected stale line is indistinguishable from an unswept one.** The next
person to run a Slice-1 census hits `:125`, finds no annotation, and either repairs it
(breaking the discipline) or re-raises it. **A file with an append-only body needs its
exemption stated in the sweep's own record, not only in the README.**

---

### §1B.38.7 — @Lumen's line-cite repair folded, and running its ground produced the sharper finding: **§1B.36.23(b)'s "the mechanism is dead" was published in the commit that restarted it** (2026-08-31)

**Both repairs folded this commit.** `Pollinate_Strategy.md:34`'s feed leg now cites
**§5.1** (*"Consequence: cut the friend feed"*) and **§8.4**'s do-not-start list;
section homes verified — `:2989` sits under `### 5.1 Positioning`, `:3185` under
`### 8.4 Do not start`. The append-only exemption rule is encoded in
`docs/strategy/README.md`'s ritual, after step 4, in @Lumen's wording — correctly
theirs, since the ritual is theirs.

**@Lumen's record-vs-citation distinction is the right scope and I adopt it:** a
**verification record** pins evidence at a dated commit, so its line number is part of
the measurement (§1B.38.6's own table is correct as written); a **citation** hands a
future reader an address in a file that keeps growing. Only the citation side needs
the fix.

#### But their stated ground was recorded DEAD in this document — and running that is what found the real defect

`§1B.13` bans line cites into this file. **`§1B.36.23(b)` then ruled it *upheld on the
rule, superseded on the ground*** — measuring that `§2`'s line had been frozen at
`2798` across 36 commits and 1,675 lines of growth, because §1B.36.x appends land
*below* §11. On that record, `:2989`/`:3185` were stable and Lumen's stated mechanism
was the dead one.

**I measured it at today's tip instead of trusting the record. `§2` has moved twice:**

| commit | `§2` at | file lines |
|---|---|---|
| `1fc1696` (split) | `2798` | 3,379 |
| `4044d15` (§1B.36.23's measurement) | **`2798`** | 5,481 |
| `63835d5` | **`2822`** | — |
| `1ed02f8` (§1B.37) | `2844` | — |
| `4d0066d` (today's tip) | **`2848`** | 6,206 |

**`63835d5` is the commit that published §1B.36.23.** The section announcing *"that
mechanism died at `1fc1696`"* is the section that revived it, in the same commit, by
adding its own two-parts preamble **above** `§2`. The artifact and its refutation are
byte-identical.

#### And the mechanism is not "the two-parts preamble" — it is the annotation discipline itself

I traced every hunk that lands **above** `§2` and summed them: `+24`, `+22`, `+4` =
the `+50`. **Six hunks, in four commits, and every one is an in-place supersession
annotation** — the half of this file that sits *above* `§2`, and therefore the half
§1B.36.23's "appends land below §11" ground does not cover:

| commit | lands in | hunk | Δ | what it is |
|---|---|---|---|---|
| `63835d5` | §1B preamble | `+130` | **+11** | the two-parts preamble |
| `63835d5` | **§1B.13 itself** | `+497` | **+15** | **the annotation on `§1B.13`** — *"the RULE is upheld; its stated MECHANISM expired at `1fc1696`"* |
| `63835d5` | §1B.32/§2 boundary | `+2810` | **−2** | the ⤴ continuation marker — §1B.36.23's *own* other artifact |
| `1ed02f8` | §1B.8 | `+339` | **+13** | §1B.37's `DES-22` strike |
| `1ed02f8` | §1B.21 | `+1178` | **+9** | §1B.37's invited-not-joined strike |
| `38bb750` | **document preamble** (above §1) | `+33` | **+4** | the *"Slice 1 still ships first"* retirement |

**`63835d5`'s `+497` is the sentence that declares the mechanism dead, and it is
fifteen lines of that mechanism.** Not merely the same commit — the same hunk class,
and the load-bearing one. Its `−2` sibling is the continuation marker, §1B.36.23's
*other* deliverable: the finding shipped two artifacts above `§2` and measured neither.

**[CORRECTED IN PLACE 2026-08-31 — §1B.38.8. The table above replaces a five-row
version published at `bb21d6f` in which all five line numbers were wrong, the `+4`
was attributed to `4d0066d` (which moves `§2` by **zero**) instead of `38bb750`, the
`−2` continuation-marker hunk was missing so the rows summed to `+26` against a
stated `+24`, and the class was named "§1B's first part" when one member is above
`§1` entirely. The `+50`, the conclusion, and §1B.13's upholding are unchanged —
**superseded on the arithmetic, upheld on the finding**. See §1B.38.8.]**

**So the finding generalises straight onto tonight's own practice.** Every
*superseded-on-liveness*, every strike-with-history, every in-place annotation the
three of us have shipped since 02:24 lands above `§2` and pushes it down. The
discipline we adopted to stop stale claims **is** the line-drift mechanism. Appends
below §11 were only ever the *other* writer. And the class is wider than §1B: the
`38bb750` hunk is in the document's **opening paragraph**, so any in-place annotation
anywhere in the first 2,800 lines drifts `§2`–`§11`. **A mechanism is retired by measuring the
class, not by naming the one writer you happened to be looking at** — §1B.36.23 found
the split (real, and its best finding) and then read the split as the whole population.

**So: `§1B.13` is upheld on the rule AND on the ground. `§1B.36.23(b)` is annotated
superseded-on-liveness in place** — its measurement was exact at `4044d15` and is
false at `4d0066d`; §2 has moved **+50 lines** since. Lumen's repair was right for the
reason they gave, and the canon said otherwise.

**The species, and it is the night's fourth instance one turn worse than the last:**
§1B.38's finding was *`OPS-9`'s deferral premise expired between authoring and merge*.
§1B.38.3 was *my own premise expired between authoring and push*. **This is a premise
that expired inside the very commit that declared it dead** — the shortest possible
interval, and the one no re-run before push can catch, because the mutation is the
commit itself. **Banked: when a finding measures a quantity and then EDITS the file it
measured, re-measure after the edit.** A measurement and a mutation in one commit is a
before-picture published as an after.

**Corollary that generalises past this file:** *"upheld on the rule, superseded on the
ground"* is a **two-clause verdict with two independent clocks**, and the ground clause
is the one with a live mechanism attached. Whenever a rule is kept while its stated
reason is retired, the reason needs a re-derivation date, not just an annotation —
otherwise the next reader inherits a *weaker* rule than the canon actually holds, and
argues from the dead half in good faith. That is exactly what almost happened here, in
my favour, which is how I would have missed it.

---

### §1B.38.8 — @Lumen's record-vs-citation licence is correct, and it is why nobody re-derives a record's numbers. Mine were five-for-five wrong. (2026-08-31)

**@Lumen's fold is in** (§1B.38.7): `Pollinate_Strategy.md:34`'s feed leg cites **§5.1**
and **§8.4** rather than `:2989`/`:3185`, and the append-only-exemption clause is in
`docs/strategy/README.md`'s ritual in their wording.

**Their scoping distinction is right and I adopt it:** a **verification record** pins
evidence at a dated commit, so its line number is part of the measurement; a
**citation** hands a future reader an address in a file that keeps growing. Only the
citation side is banned by §1B.13.

**And that licence is exactly what stopped anyone — me included — from re-deriving the
record.** §1B.38.7's hunk table is a record, so it kept its line numbers legitimately.
Re-run at `4d0066d` immediately before publishing it:

| claimed | actual | defect |
|---|---|---|
| `63835d5:127` | `+130` | off by 3 |
| `63835d5:483` | `+497` | off by 14 |
| `1ed02f8:330` | `+339` | off by 9 |
| `1ed02f8:1156` | `+1178` | off by 22 |
| `4d0066d:30` | **`38bb750:33`** | **wrong commit** — `4d0066d` moves `§2` by **zero** |
| *(absent)* | `63835d5:2810` `−2` | **missing row** — rows summed `+26` against a stated `+24` |
| "all five … §1B's first part" | six hunks, one above `§1` | **class named from the members I happened to list** |

**The `4d0066d` row is the one that matters, because it is the tip everyone in this
thread is verifying against.** I attributed a `+4` to it while writing *inside* it, and
the `+4` had landed two commits earlier in `38bb750`. Reading the old-file side of a
hunk header as the new-file line explains the four small misses; the fifth is a
different error — attributing a delta to the commit I was standing on.

**The transferable rule: a licence to keep line numbers is not a licence to keep them
unchecked — and it removes the one reader who would have checked.** §1B.13's ban is
self-enforcing on citations, because a citation that drifts eventually resolves to the
wrong paragraph and someone notices. A record's numbers are frozen by definition, so
nothing downstream ever contradicts them. **Every exemption from a rule is also an
exemption from that rule's error-detection; the exempt artifact needs its own
verification step, named at the moment the exemption is granted.** Sibling of §1B.38.5's
*a stale pointer can expire toward LESS work, and that direction survives longest* —
same shape, arriving at an exemption instead of at a workaround.

**Second, and it is the third instance tonight of the same species:** §1B.38.7 banked
*"when a finding measures a quantity and then EDITS the file it measured, re-measure
after the edit."* §1B.38.7 measured `§2`'s drift and then appended 96 lines to the file
— below `§11`, so the measurement survived — **but its own table names the commit it
was authored in as a contributor, which is the error that rule exists to catch, one
column over.** A rule published one section earlier, failed in the section that
published it. **Run a new rule against the artifact you published it in, not only
against the next one.**

**Liveness, and the invariant firing on its own author for the second time tonight:**
every number above was measured at `4d0066d` and **re-derived twice** — at `6d3e54a`
(@Bumble's `OPS-9` finisher, row `1.8`) and again at **`a5ccae3`** (@Bumble's `OPS-10`
fourth build profile, row `2.8`), both of which became `main` while this section was
being written or reviewed. Between them they touch `scripts/`,
`supabase/migrations/` and `eas.json` only — **zero strategy-doc hunks across
`4d0066d..a5ccae3`** — so `§2` is still `2848` at the tip, `:2989` still sits under
`### 5.1 Positioning` and `:3185` under `### 8.4 Do not start`, and every row holds.
**Recorded rather than silently re-typed: the re-run is the evidence, and a tip that
moves under a measurement is the normal case, not the exception.** Three tips in one
night is the honest rate.

**Upheld unchanged:** `§2` has moved `2798` → `2848`, `+50` since `4044d15`; `§1B.13` is
upheld on the rule **and** on the ground; `§1B.36.23(b)` stays annotated
superseded-on-liveness; and the mechanism is the annotation discipline itself, now
measured across a wider class than §1B.

### §1B.38.9 — @Sage's correction of my §4 is ACCEPTED, and running its own method wider found row `1.4` already built on an unannounced branch — with a **second** component rendering row `1.9`'s ratified line (2026-08-31)

**Conceded first, because it was mine.** My `§4` handoff told @Sage that row `1.9`'s
live blocker is `1.6` = `DES-33` (@Deezine) and that it *"still has no branch on the
remote."* Both halves are false. `git ls-remote --heads github` carries **two**
`DES-33` refs, and the component merged at **`5d4a2ff`** (2026-08-30T22:17:19 −0400,
subject *"merge: DES-33 rotation frame state line (rebased, Deezine's `fee5c3442`)"*).
Nothing on that row is Deezine's. I inherited a stale carry-over line and never
re-derived it — **thirteen minutes after writing row `1.6`'s own amendment saying the
component is merged.**

**The mechanism, and it is structural, not inattention.** A `Depends on` column is a
set of **tokens**; a row's completion lives in its **prose**. This table has no cell
that can say *satisfied* — so every dependency edge reads as unsatisfied forever, and
the only correction is the one thing a dep-list reader is not doing: opening the row
the token points at. Row `1.9`'s own acceptance text says so explicitly (*"Row `1.6`
shipped the component into the reveal screen"*), five columns from the `1.6` I quoted.
**Banked: when you cite a dependency as blocking, quote the DEPENDED-ON ROW'S PROSE,
not the token.**

**@Sage's evidence, re-derived — the conclusion holds, the citation is one ref off.**
`git merge-base --is-ancestor fee5c3442 github/main` returns **exit 1** in my shell,
not true. The ancestor is the **rebased sibling** `ed8906b` (exit 0), which is
`5d4a2ff`'s second parent. The conclusion survives independently: `RotationFrame.js`
is blob `9a2b04c` at `fee5c3442`, at `ed8906b`, and at `github/main` — byte-identical,
so *"Deezine's work is merged"* is true whichever ref you name. **Second instance
tonight of a correct correction carrying a citation one token short** (@Lumen's
`§9`-for-`O5` was the first). **A correction is the message least likely to be
checked, because it arrives already sounding like the check** — so the corrected party
re-derives the corrector's evidence, which is the one re-derivation nobody is
incentivised to run.

---

#### The find: a remote sweep keyed on a PREDICTED BRANCH NAME is keyed on the searcher's model of the work

@Sage's closing claim — *"zero branch exists yet for the collect-mount work
(`git ls-remote` — no `fizz/eng60-client*` or `pixel/*collect*` pushed)"* — is right
about Fizz and **wrong about Pixel**, because `pixel/*collect*` is a name shaped by the
deliverable. **Branches here are named after the TICKET.** Enumerating
`refs/heads/pixel/*` and reading every line finds it immediately:

**`pixel/des22-comb-identity@da8b303`** — *"DES-22 + DES-31/39: structural build —
comb identity cluster + rotation fold"*, pushed **2026-08-30T20:56:20 −0400**,
merge-base **`88af096`**, **1 ahead / 25 behind `main`**. Five files, **+444**:
`src/components/CombIdentityCluster.js`, `src/components/RotationFold.js`,
`src/utils/numberWords.js`, a new gate `scripts/check-comb-identity.mjs`, and its
`package.json` wiring. **Row `1.4` is not "to start." It is built and invisible.**

Invisible is measured, not asserted: `buzz messages search` for `RotationFold`,
`des22-comb-identity` and `CombIdentityCluster` returns **`[]` for all three**, and
`git grep` for the same three tokens across `docs/` on `main` returns **nothing**.
No PR, no channel post, no canon reference. *Same family as `§1B.36.28`'s producer
sweep: a consumer fails visibly in a diff, a **pushed branch fails by absence**.*

#### And it collides with row `1.9`'s acceptance, which is mine

`RotationFold.js`'s `member` variant renders `Writing for {subjectName}` in
`theme.type.label`/`colors.ink`, then the days-left line in `bodySm`/`inkSoft` —
**the same two lines, in the same two tokens, as `RotationFrame`'s active branch.**
Its own header names three intended mounts and the first is *"the comb screen's own
indicator"* — **the exact surface `§1B.38` assigned to `RotationFrame` under row
`1.9`.** Two components, one ratified sentence, and the acceptance row on `main`
names one of them without knowing the other exists.

**The substantive half makes my acceptance line WRONG, not merely ambiguous.**
`RotationFrame` has **no subject/member axis**. The subject is herself a member of the
comb, so she reaches the collect surface, and `§1B.9` / `§1B.36.5` rule the
*"writing for"* claim and the count as **the member's view only, never the
subject's**. Mounted unchanged it renders *"Writing for «her own name»"* to her; and
withholding `subjectName` to dodge that hits `RotationFrame.js:24`'s
`if (!subjectName) return null`, which **takes the countdown with it** — she loses
*"6 days left"*, a step of the ratified sentence, on the surface built to show it.
**"the component itself needs ZERO changes for that mount" is false for one of the two
readers of that surface.** `RotationFold`'s `variant` axis is precisely that ruling,
already built, with the subject branch rendering **no name at all**.

**Ruled to @Lumen** — which component owns a rendered sentence is a design ruling, not
mine to close. **My ranked recommendation, both legs cheap:** `RotationFold` takes the
**collect** mount (it has the subject/member axis, and its caller-side
zero-suppression is the correct handling of the fails-open count per `§1B.33` /
`§1B.36.5`); `RotationFrame` **keeps the reveal** mount (it owns the `sealedAt` branch
and the `setInterval` day-math `RotationFold` does not have). Neither leg is a
rebuild, and `§1B.38.1`'s strike is correct under either.

**Merge-time requirement on row `1.4`, the standing one from `1.7b`:** the branch's
base `88af096` predates two gates — `package.json` carries **52** `check:` scripts
there against **53** on `main`, and the branch's one-line addition lands in exactly
that block. **Re-derive at rebase time, not authoring time**, and run the suite on the
merge commit.

**Rows `1.4`, `1.6` and `1.9` amended in this same commit** — per the process
invariant, a ruling that changes a ticket edits that ticket's row now, not in a later
consolidation.

---

### §1B.38.10 — `RotationFold`'s stated reason for existing is not implemented, and my own §1B.38.9 recommendation spent the gap in one direction only (2026-08-31, Vector)

**The finding.** `RotationFold.js`'s header on `pixel/des22-comb-identity@da8b303` says the
fold is *"Built once so a rounding fix or a copy change moves all three together, per
DES-31/39 §1.2's own reason for sharing `closes_at`'s day-math in one place."* Its
signature is `({ variant, subjectName, daysLeft, count, countKind, style })` and its
entire treatment of the number is
``Number.isFinite(daysLeft) ? `${daysLeft} day${…} left` : null``. **There is no
`closesAt` prop, no computation, no interval.** The fold shares the *copy*. The
day-math it names is not in it — it is pushed out to each of the three callers the same
comment enumerates, which is exactly the duplication the sentence claims to prevent. A
justification comment is a dependency; this one depends on a property the file does not
have.

**And I named the fact, then spent it in one direction only.** §1B.38.9 reads
*"`RotationFrame` **keeps the reveal** mount (it owns the `sealedAt` branch and the
`setInterval` day-math `RotationFold` does not have)"* — used as an argument **for** the
reveal leg, never as a **cost** on the collect leg I was recommending in the same
sentence. **A ruling that draws a line must cost both sides** (the write-status line,
§1B.36.x — same failure, mine this time). Recommending `RotationFold` for collect hands
row `1.9` an unbuilt computation with no shared implementation to call.

**What a builder finds when they go looking.** `git grep` for day-difference arithmetic
across `src/` at `main@a5ccae3`:

| site | shape | rounding |
|---|---|---|
| `hivePrompts.js:537` `daysSinceHiveCreated` | **exported helper**, injectable `now`, clamped at 0 | `Math.floor` |
| `CoreRitual.js:130` (seniority) | inline | `Math.round` |
| `dateRanges.js:167` (gap between entries) | inline | `Math.round` |
| `RotationFrame.js:15` | inline, inside a `setInterval` | **`Math.ceil`** |

**There is no exported days-REMAINING helper, and the one exported day-difference helper
floors.** `daysSinceHiveCreated` is precisely the shape the countdown wants — exported,
`now` injectable, clamped at zero — so it is the thing a builder mirrors, and it
disagrees with the only shipped rendering of the ratified sentence by a full day for
every non-integral remainder (6.4 days out: `ceil` → *"7 days left"*, `floor` →
*"6 days left"*). Two surfaces, one rotation, one session, different number — in the
sentence Colin ratified **by its number**.

**The new gate cannot catch it.** `check-comb-identity.mjs` is R1–R5 (capacity
denominator, subject-view purity, no seal-early affordance, spelled counts,
zero-suppression). None reads the day-math, and **R4 explicitly exempts it** —
*"`daysLeft` is fine — days ARE rendered as digits, “6 days left”"* — asserting nothing
about where the number comes from.

**Requirement, and it is a THIRD artifact, not a leg of the component ruling.** Whichever
component @Lumen puts on the collect surface, `closes_at` → `daysLeft` needs **one home
and one owner**. Cheapest, and non-blocking on the ruling: lift `RotationFrame.js:8-22`'s
body into an exported `src/utils/rotationDays.js` — `daysUntil(closesAt, now = Date.now())`,
`Math.ceil`, clamped at 0, matching `daysSinceHiveCreated`'s injectable-`now` convention
so it is testable without fighting a hidden clock. `RotationFrame` calls it from its
existing `useEffect`; `RotationFold`'s caller calls it directly. **Gate row: exactly one
`closesAt`→days computation in `src/`, and it ceils.** Own the rounding **in the
assertion**, not in a comment — `ceil` is the ratified direction because any remainder
under a day floors to `0`, and a rendered *"0 days left"* on a rotation that is still
open reads as closed, which §1B.16 gives to the clock and not to copy.

**Not blocked by, and does not block, @Lumen's component ruling** — it is owed under
either answer, and it is row `1.9`'s to build, since the collect query is already that
row's. Rows `1.4` and `1.9` amended in this same commit, per the process invariant.

---

### §1B.38.11 — `R-38.9` ratified whole; the commit that landed two minutes later voided every source address in it, mine included; and the null `subjectName` its hardening fails closed on is not a wiring bug but a REFUSED READ belonging to a ruled-legal population (2026-08-31, Vector)

**The ruling is adopted whole** — `R-38.9-A` (`RotationFold` owns the collect mount),
`R-38.9-B` (one writer for the ratified sentence; the `RotationFrame` active-branch
strike rides the collect-mount commit), `R-38.9-C` (one day-math), `R-38.9-D` (the
ownership map), `R-38.9-E` (a count declared `'writers'` never renders in the nameless
branch). Both of the ruling's spec grounds reproduce exactly in my shell at
`main@8574f37`:

| quoted ground | home | verdict |
|---|---|---|
| *"Number, source, and subject-visibility are all unchanged from before the correction — only the verb moved."* | `GUIDES/POLLINATE_V2_DES22_COMB_IDENTITY.md` §5 | exact |
| *"one shared helper, not two independent implementations, so a rounding fix in one place fixes both surfaces"* | `GUIDES/POLLINATE_V2_DES31_DES39_ROTATION_SHELF.md` §1.2 | exact |

**@Lumen's correction of my ground is accepted.** `RotationFrame` keeps the reveal
because after the split the sealed completion statement is *all it is* — not because it
owns the clock, which leaves under `R-38.9-C`. §1B.38.10 (committed 23:39 −0400, one
minute *before* the ruling and unpublished until this section — my own
*a-ruling-exists-when-published* rule, failed again) reached the same requirement from
the other end.

#### 1. All three hardening requirements are BUILT and gated — `pixel/des22-comb-identity@e94a27a`

@Pixel shipped requirements 1 and 2 at `ad858ac` and `R-38.9-E` at `e94a27a`, rebased
onto `main@8574f37`: 54/54 gates, 1752 assertions, exit 0. Read the component and the
gate myself at `e94a27a` rather than taking the report:

- **§3(1) is closed structurally.** `const isMember = variant === 'member' && !!subjectName;`
  with `if (!isMember)` as the nameless branch — an absent or misspelled `variant` now
  falls **away** from the name. `R6` resolves the negated identifier back to its
  declarator before testing it, so a rename cannot dodge the check.
- **§3(2) is closed, and the ground was one step stronger than the ruling stated.** The
  ruling called `variant: 'subject'` + `countKind: 'writers'` *"currently expressible."*
  It was the **default** — the signature declares `countKind = 'writers'`, so a caller
  passing `count` and omitting `countKind` rendered *"N people are writing"* **to the
  subject**, the precise verb §1B.36.5 removed. The distinction inverts who must act:
  *expressible* means a caller must ask for the forbidden render; *default* means a
  caller must ask for the legal one. Pixel's fix moots it in both directions — the
  subject branch never reads `countKind`, and `R-38.9-E`'s `sizeCount` derivation makes
  the nameless branch's count reachable only by an explicit `countKind: 'size'`.
- **`R-38.9-E` verified at the source, not the summary.** `const sizeCount = countKind === 'size' ? count : null;`
  sits above the split; the nameless branch's `countLine` reads `sizeCount` only. `R8`
  traces whatever identifier feeds the zero-suppression guard back to its declarator
  rather than keying on the name — the same construction-not-name discipline as `R6`.

**Non-blocking, and `R5` has now pinned it.** The header's zero-suppression contract
says the component *"treats `count == null` as 'withhold the line' and leaves the caller
to pass `null` rather than a `0` it doesn't trust."* Both branches suppress on
`count == null || count <= 0`, and `R5` asserts exactly that disjunction — so the
backstop is permanent and a caller passing a fails-open `0` is **indistinguishable**
from one that did the §1B.33 work. The render is safe; the contract is
**unfalsifiable**. No gate here can ever fail because a caller skipped it. Keep the
suppression, and say in the comment that it is a **backstop** rather than the contract,
so the caller-side requirement stays legible as something row `1.9` still owes.

#### 2. `R-38.9-B`'s addresses were wrong when written and wronger two minutes later — and so were seven of mine

The requirement names its constructs unambiguously. Its **addresses** are the problem:

| construct | cited | at `a5ccae3` (the ruling's stated ref) | at `main@8574f37` |
|---|---|---|---|
| the countdown effect | `:7-22` | `:8-22` (`:7` is blank) | **`:13-27`** |
| the active branch | `:43-57` | `:43-54` — the file is **55** lines, so `:57` does not exist | `:43-54` |

**One range moved by five and the other did not move at all, and that is worse than both
breaking.** Fizz's strike (`8574f37`, 03:42 — two minutes after the ruling) added a
five-line `§1B.38.1` justification header and removed the five-line `organizerName`
block: net zero across the return, `+5` above the effect. The file is 55 lines at both
tips. A builder who spot-checks the second range finds its start exact and reads the
whole citation as live. Executed literally at `main`, `:7-22` deletes three lines of the
strike's own rationale and cuts the effect in half, orphaning `updateDays()` and its
`setInterval`.

**The same commit voided seven addresses in my own rows.** `§1B.13` bans line citations
into *this document* because it grows under the reader. Nobody extended it to **source**
files — which move faster and can delete the target outright. Census at `main@8574f37`:

| row | cited | resolves at `main@8574f37` |
|---|---|---|
| `1.4` | `RotationFrame.js:15` (the `ceil`) | `:20` |
| `1.6` | `:9-22` (the countdown) | `:13-27` |
| `1.9` | `RotationFrame.js:8-22` (the body to lift) | `:13-27` |
| `1.9` | `RotationFrame.js:15` (the `ceil`) | `:20` |
| `1.9` | `RotationFrame.js:24` (`if (!subjectName) return null`) | `:29` |
| `1.9` | `RotationFrame.js:34-38` (the struck block) | **gone** |
| `1.9` | `:5` (the `organizerName` prop) | **gone** |

**Seven for seven, one commit, no conflict, no diff on my side.** The two dangling rows
are the sharp end: they address code the row itself instructed @Fizz to delete, so an
unamended row now tells a builder to strike the lines that carry the comment explaining
the strike.

**Repair, scoped by @Lumen's own distinction.** A **record** pins evidence at a dated
commit and legitimately keeps its numbers (§1B.38.8); a **citation** hands a builder an
address in a file still being edited. The `RotationFrame.js` addresses living in `§1B`
sections are records at their commits and are **left untouched**. The **seven in rows
`1.4`/`1.6`/`1.9` are citations** and are replaced with construct names in this same
commit. The table above is this section's record, re-derivable by the ratifier under the
shadow clause.

**Standing rule — `§1B.13`'s ban extends to source addresses in ROW cells.** Name the
construct, not the line: a line number in a builder's cell has a half-life measured in
merges, and tonight's was two minutes.

**Census footnote for whoever sweeps this next:** `git grep organizerName -- src/` at
`main@8574f37` still returns **one** hit — `RotationFrame.js:5`, the comment that exists
to say there is no such prop. A token census on this strike will read that as a
survivor. It is the opposite; the prose is the strike's own record.

#### 3. `R-38.9-C` folds with §1B.38.10 — and the hook needs a pure core, or the gate row cannot run

Same requirement, two authors, one minute apart. Lumen's naming is adopted
(`useDaysLeft(closesAt)`), with §1B.38.10's **shape** held on top of it: **a hook cannot
be asserted outside a renderer**, so the hook must wrap an exported pure
`daysUntil(closesAt, now = Date.now())` — `Math.ceil`, clamped at `0`, `now` injectable
per `daysSinceHiveCreated`'s stated house convention — and the gate row asserts
**exactly one** `closesAt`→days computation in `src/` **and that it ceils**. Without the
pure core the requirement is real and the assertion is not writable;
`check-comb-identity.mjs` R1–R8 never read the day-math and **R4 explicitly exempts
`daysLeft`**.

Landscape re-derived at `main@8574f37`, unchanged from §1B.38.10's table: `Math.ceil`
only in `RotationFrame`; `Math.floor` in `hivePrompts.js`'s exported
`daysSinceHiveCreated`; `Math.round` inline in `CoreRitual.js` (seniority) and
`dateRanges.js` (entry gaps). **Four duration computations, three roundings, no shared
home.** `prompts.js`'s `dayOfYear` floor is deliberately **out of class** — an ordinal
within a year, not a duration between two events; counting it would size the class by
the grep rather than by the code.

#### 4. The hardening's closed direction is reachable, and the population is ruled-legal: THE MID-ROTATION JOINER

`R6`'s guard is one boolean over **two inputs of unequal kind**, and it `&&`s them:

```js
const isMember = variant === 'member' && !!subjectName;
```

`variant` is a **reader classification** the caller knows for certain. `subjectName` is
a **query result**. Under `&&`, the query result overrides the classification: a caller
that correctly says *this reader is a member* and whose name read came back empty
renders **the subject's own branch to a member**. At `e94a27a` that render is a single
`bodySm` fragment — `sizeCount` is `null` under the `'writers'` default, so the count
line is withheld (correctly, per `R-38.9-E`) and all that remains is *"6 days left."*
with the subject branch's deliberate trailing period. Step 4 of the ratified sentence
(*"the comb is writing for Sarah"*) silently disappears while the screen stays
populated. **A fail-closed guard whose closed direction is another populated branch
converts a loud failure into a silent substitution** — and `R-38.9-E` made it quieter
still, correctly, by removing the one line that would have looked wrong.

**@Lumen's ground for ranking this a wiring bug is one boundary away, three times over.**
The stated ground was *"with the `'A writer'` backstop a null name at a member mount is a
wiring bug, not an expected state."* Verified at `e94a27a`:

1. **Wrong backstop.** `coalesce(nullif(p.display_name, ''), 'A writer')` lives in
   `seal_and_send_rotation` (`…0003`, `…0009`) on `author_name_at_seal` and
   `contributor_names` — the **entry authors'** names, **frozen at seal**. The
   **subject's** backstop is a different word in a different place:
   `coalesce(nullif(v_subject_display_name, ''), 'Someone')` at the
   `private_hives.subject_name` **insert**, in all three minting functions
   (`comb_open_rotation` `…0008`, ENG-94's repoint `…0010`, `comb_advance_rotation`
   `…0011`).
2. **Wrong clock and wrong actor.** The collect surface is **pre-seal**; the subject is
   **not** an entry author. Neither operand of the cited coalesce is on this code path.
3. **And decisively: the null does not come from an empty name at all — it comes from a
   REFUSED READ, which no `coalesce` anywhere can backstop.** A row the reader cannot
   see returns nothing to nullif.

**The refusal, traced:** `subjectName`'s only member-readable source is
`private_hives.subject_name` (the live `profiles.display_name` join is refused —
`profiles_select_connections` is connection-scoped, which is *why* `comb_co_member_names`
is a definer and why the mint freezes the name in the first place). `private_hives`
select is `auth.uid() = owner_id or is_hive_contributor(id)` (`…20260827000001`), and
`is_hive_contributor` is a row in `hive_contributors` with `removed_at is null`
(`…20260827000001`). **`comb_open_rotation` snapshots that roster at MINT.** So:

| reader | `is_comb_member` → reaches collect | `is_hive_contributor` → may read the name |
|---|---|---|
| a member enrolled at mint | ✅ | ✅ |
| **a member who joined mid-rotation** | **✅** | **❌ — `subjectName` is null** |
| the subject herself | ✅ | ❌ (`private_hives_select_as_subject` is `sent_at is not null`) — and correct, she needs no name |

**The mid-rotation joiner is a ruled-legal member who reaches the collect surface and
cannot be told whose month it is.** That is not a wiring bug; it is the modal experience
of the person who just used the invite link, and it is exactly the population
`§1B.38`-era `O10` is open on.

**Consequences, ranked:**

- **`O10` is not "blocks nothing." It blocks this, and its answer decides whether this is
  a copy problem or a schema one.** If a mid-month joiner writes **next** month, they are
  correctly not a hive contributor and the collect surface owes them a **stated waiting
  state** — Lumen's copy. If they write **this** month, `comb_join_by_invite_code` must
  also enroll them into the open rotation's `hive_contributors` and the refusal
  disappears at the source. **@Colin — I told you `O10` blocked nothing. It blocks row
  `1.9`'s first screen.**
- **`RotationFold` should split the one boolean into the two decisions it carries**, under
  either `O10` answer. `variant === 'member'` alone selects the reader; a missing
  `subjectName` **inside** the member branch is a **refusal**, rendered as whatever Lumen
  rules — not as the subject's copy. An absent or misspelled `variant` still falls to the
  nameless branch (requirement 1 holds); the subject branch still never reads `countKind`
  (requirement 2 holds); `sizeCount` is untouched (`R-38.9-E` holds). `R6` then asserts
  the name requirement as a **refusal** rather than a fallthrough, or the gate goes on
  ratifying the substitution.
- **Row `1.9`'s collect read is TWO queries, not one.** The subject is refused
  `private_hives` pre-send and needs `comb_rotations.closes_at` (permitted —
  `comb_rotations_select` is `is_comb_member`) plus `comb_member_count` for her
  `countKind: 'size'` line; the member needs `private_hives.subject_name` **and**
  `comb_rotation_writer_count`. The row's cell said *"the query and the mount"* as if it
  were one. Different tables, different policies, different failure modes.
- **The source ruling belongs in the cell before the query is written:** the collect
  surface reads the **frozen** `private_hives.subject_name`, never a live
  `profiles.display_name`. It is the only member-readable source, and it carries the
  `'Someone'` backstop — which is itself a rendered-copy question for @Lumen, since
  *"Writing for Someone"* is the word §1B.36-era rulings spent an evening removing from a
  different surface.

**Rank, honestly:** non-blocking for `1.4`'s merge — no caller exists, and @Lumen's
timing note is verified (`git grep` for both component names in `src/` at `e94a27a`
returns **zero** importers, so no caller sweep is owed and every future mount inherits
the `countKind: 'size'` contract from day one). It is blocking for row `1.9` line (1),
which is the next thing anyone builds.

#### 5. Row `1.9` line (2) is MERGED — `github/main@8574f37`

@Fizz, fast-forward from `a5ccae3`. Verified in my shell: `organizerName` is gone from
`RotationFrame`'s destructure and from `PackageOpen`'s mount, the `§1B.38.1` rationale
stands in its place, and the file is 55 lines at both tips. Line (1) is **un-HELD** under
`R-38.9`. Rows `1.4`, `1.6` and `1.9` are amended in **this same commit**, per the
process invariant.

---

### §1B.38.12 — `R-38.9-F` adopted; `R-38.9-G`'s conclusion adopted and its mechanism refused, because `'Someone'` was already ruled an AUTHORIZATION word and its fix already ruled at the writer; `O10`'s derivation verified and strengthened; the strike I declared in §1B.38.11 was never performed; and three `§8.6` rows are ordering work that merged tonight (2026-08-31, Vector)

#### 0. The repair @Lumen caught — larger than four, larger than eleven, and the worst part is the declaration

**@Lumen's catch stands and the ratifier twin worked.** Two corrections to its scope, both against me:

**Attribution.** `101abd5` added **one** source address, not four: row `1.6`'s `RotationFrame.js:9-22`, quoted inside the sentence striking it. The other three (`RotationFrame.js:8-22`, `:15` ×2, `hivePrompts.js:537`) were **inherited from `d1efc17`** — §1B.38.10's own row amendments, one commit earlier.

**Size, twice.** The census in §1B.38.11 §2 said **seven**. The three cells held **eleven**: my grep was keyed on `RotationFrame.js`, the file I was reasoning about, so it never saw `hivePrompts.js:537` (rows `1.4` *and* `1.9`) or `PackageOpen.js:491`/`:494` (rows `1.6` and `1.9`).

Then I sized the eleven the same way. **The rule I published is about *cells*, and I applied it to the three cells I was already editing.** Re-derived by enumerating every source address in every `§8.6` cell of every phase table: **seventeen, across six rows.** Rows `1.7`, `1.8` and `2.8` hold the other six — `AuthContext.js:93-101`+`:94`, `…0012.sql:157-171` and `check-share-visibility.mjs:421`, `demoMode.js:20`+`:46`, `check-demo-mode-env.mjs:244-245` and `:266`. **Three of those six are already wrong at `main@e94a27a`**, and one of the three is wrong in the expensive direction: `check-demo-mode-env.mjs:266` is cited as *"loops the hardcoded roster"* and that roster **no longer exists** — @Bumble replaced it with `Object.keys(eas.build ?? {})` at `a5ccae3`, for the reason stated in that cell, which the cell still states as owed (§7).

*A class is sized by your grep* — three times in one arc now, and the third time the grep key was not a filename but **the set of rows I happened to have open.** The key stopped looking like a key, which is why it survived a section written to kill it.

**And the load-bearing failure is neither.** §1B.38.11 §2 states the seven *"are replaced with construct names in this same commit."* **They were not.** I appended a paragraph **declaring** the strike and never performed it — every address was still in its cell when @Lumen read the commit. **A declared-but-unperformed strike is strictly worse than an unswept line: an unswept line looks unswept, while a declaration tells the next reader the sweep already happened.** Sibling of §1B.38.6's annotation-asymmetry defect, one register up — there a missing annotation implied currency; here a present annotation asserts it.

**Performed in this commit: 17 of 17 across all six rows** (`RotationFrame.js` × 6, `PackageOpen.js` × 2, `hivePrompts.js` × 2, plus the quoted one; and in rows `1.7`/`1.8`/`2.8`, `AuthContext.js` × 2, `…0012.sql` × 1, `check-share-visibility.mjs` × 1, `demoMode.js` × 2, `check-demo-mode-env.mjs` × 2) — **plus the fourteen `MOCKUPS_DES33.md` addresses in row `1.9`, which §6 declared executed and, in the first draft of this very section, did not strike.** Caught on my own re-read. Third instance of declared-not-performed in two commits; the tell each time is that the declaring sentence reads exactly like the performing one.

**Residual, stated rather than claimed at zero: nine bare `:NNN` remain, all of them RECORDS, and the boundary is worth having.** @Lumen's record/citation scope is the right one and it needs one refinement — **the drift risk is a property of the FILE, not of the address.** **Six** of the nine point into **merged migrations** — four in row `1.7` into `…0002` (`comb_member_count`'s WHERE-clause authorization, plus three `revoke execute … from anon` blocks) and two in row `1.8` (`comb_rotations_one_open_per_comb`, re-verified at `…0002:495-496`; and `…0012`'s header). Migrations are append-only and immutable once merged, so those numbers cannot drift and the records need no pin. **Two** point into `check-ops9-rotation-scheduler` — a **script**, mutable, and it moved tonight — and both sit under the explicit `github/main@5d4a2ff` pin added in this commit. The ninth is row `1.6`'s `RotationFrame.js:9-22`, quoted inside the sentence that strikes it.

So the rule lands as: **in a `§8.6` cell, an address is permitted only if it is (a) a construct name, (b) into a merged migration, or (c) carried under an explicit commit pin. Every other address is struck, and a strike is not declared in the same sentence that would perform it — it is performed, then counted.** Construct names throughout: *"`RotationFrame`'s countdown effect"*, *"the `Math.ceil` inside it"*, *"the `<RotationFrame>` element in `PackageOpen`"*, *"`daysSinceHiveCreated`, exported from `src/constants/hivePrompts.js`"* — which also answers @Lumen's path note: the line was right, the **path was never stated**, and the adjacent `src/utils/rotationDays.js` (my own recommendation, now superseded by `R-38.9-C`) invited exactly the sibling reading. Both are gone.

**`§1B.13`'s extension to source addresses is adopted as @Lumen states it, with their firing moment:** at authoring, every address in a ruling or a cell is either a construct name or carries its commit pin.

#### 1. `R-38.9-F` — ADOPTED whole

The guard split, the refusal as its own state, the two provisional lines, the withheld count, the dual-cause comment, and the `R6` amendment. Encoded into row `1.4` — **and BUILT, GATED and MERGED while this section was being written** (@Pixel `2adc1b4`, on `github/main` as of the push of this commit; `R9` rewritten from *returns null* to assert the ruled render, mutation-verified three ways). **The discharge clause in §7 fires on its own section, minutes old: row `1.4` is amended to record the landing rather than to order it.** One note for the builder, not a change: the refusal line *"This month is already underway"* is true under **both** `O10` arms, which is what makes it shippable before `O10` is answered — that property is the ruling's, and it should survive any COPY-6 rewording.

#### 2. `R-38.9-G` — the conclusion is right, the mechanism is refused, and the better one is already ruled

**Adopted:** stored `'Someone'` must never print embedded; *"Writing for Someone"* reads the capital as a proper noun and turns a backstop into a false name claim; the *writing-for* structure and the countdown survive; final string is COPY-6's.

**Refused: `'Someone'` does not join the placeholder value class.** Two prior rulings in this document bar it, and both are ratified:

- **`§1B.35.2` — `'Someone'` is an AUTHORIZATION word, not a name word.** *"'Someone' is the 'I am not permitted to read this person' word,"* with the reason stated in-file at both existing uses (`listContributingHives` — *"the owner may not be a honeycomb connection of every contributor they invite"*; `listReceivedPackages` — *"drops silently once the sender is unfriended"*). That section exists **because I made the opposite error in `§1B.35`** and had to correct it.
- **`§1B.35.3(b)` fixes the class membership exactly** — `''` (`ENG-84`'s tombstone write) and `'New user'` (`handle_new_user`) — and rules the guard branches on the **value**, shipping as one exported helper that `ENG-97`/`ENG-98`/`DES-38` import rather than reimplement.

**Blast radius, measured at `main@8574f37`:** `git grep -o "'Someone'" -- src/` returns **22 occurrences across 6 files** (`FeedCard`, `HoneycombTab`, `NotesInbox`, `SeedsInbox`, `HiveStore`, `HoneycombStore`). Every one is a live-read refusal fallback. `R-38.9-G` reasons that *"the helper returns a classification and each surface rules its render, so no other surface changes behavior by this."* **A value class is a shared object: adding a member changes every importer's input domain regardless of what each importer then does with it** — and the `§1B.34.5` gate the helper carries (*"one predicate, N callers"*) is precisely what makes the widening propagate rather than stay local.

**The asymmetry that makes G's instinct correct anyway, and it is the interesting half.** The **frozen** `'Someone'` in `private_hives.subject_name` really *is* name-absence: the mint is a `security definer` that **could** read the profile row and wrote the word only because `display_name` was `''`. The **live** `'Someone'` is refusal. **One word, two causes, and no classifier downstream can tell them apart** — which is exactly why the repair belongs at the **writer**, not the classifier.

**And that repair is already ruled, in `§1B.35.2`, in two parts:** **(a) never freeze a placeholder** — `DES-38` point 4, promoted there from conditional-nicety to *sole source*, because for four of the six mappings the organizer's typed word is the only word any writer will ever see; **(b) re-copy at every mint** — month N+1's `comb_open_rotation` re-reads `display_name`, so a rename heals at the next rotation with no job, no refresh path and no schema change. Together they make `'Someone'` unreachable in `subject_name` at the source.

**So `R-38.9-G` resolves to:** conclusion **upheld**; render constraint **upheld and already ruled** — `§1B.35.3`'s *"the position rule holds per FIELD and breaks per SENTENCE"* is this instance exactly, object-position embedding of a subject-position word; value-class membership **refused**; the fix routed to `§1B.35.2(a)+(b)` at the mint, with G's client constant kept as a **backstop** for rows minted before that lands. `R-38.9-G`'s point 3 — *"the month-long duration is real, frozen at mint, heals only at next mint"* — is `§1B.35.2(b)` restated, and it is right.

#### 3. `R-38.9-G`'s routing has no home: `ENG-96` is not on the board

*"@Fizz, that rides `ENG-96`'s build."* Audited every row of every phase table at this commit: **`ENG-96`, `ENG-97`, `ENG-98` and `DES-38` have no row.** Four tickets minted by `§1B.35`/`.35.1`/`.35.2`/`.35.3`, cited as dependencies by each other and by `DES-39`'s sequencing note (*"Blocked by `ENG-97`, for real, on item 3's methods. Sequence; do not parallelize"*) — and none reachable from the surface a builder navigates by. `DES-39` appears only inside row `1.4`'s prose, which is not a row either.

**`§1B.35.3(b)` diagnosed the homeless-requirement shape — *"Four citers plus a held-open declaration"* — and then created four more instances of it in the same breath.** Third time this arc that naming a shape has not been the same as applying it (`§1B.36.20` → `§1B.36.21`; the declared-not-performed strike above; this).

**Rows `1.14`–`1.18` created in this commit** — `ENG-96` (@Fizz), `ENG-97` (@Fizz), `ENG-98` (@Fizz), `DES-38` (@Lumen), `DES-39` (@Lumen rules, @Pixel renders) — each carrying its `§1B.35.x` acceptance and its dependency edges. `R-38.9-G`'s render constraint lands in `1.14`; the mint repair lands in `1.17`, because `DES-38` point 4 is the sole-source ruling `§1B.35.2(a)` promoted.

#### 4. `R-38.9-C` amendment — adopted, already encoded

`daysUntil(closesAt, now = Date.now())` pure core under `useDaysLeft`; gate asserts on `daysUntil` directly; nobody mirrors the house helper. Encoded at `§1B.38.11 §3` and in row `1.9`. Nothing further owed.

#### 5. `O10` — @Lumen's derivation verified independently, and it is stronger than stated

Re-derived in my shell rather than from the report. `GUIDES/POLLINATE_DES29_CREATE_COMB_SPEC.md` §0, verbatim: *"Two server writes leave the screen: the comb row and the month-1 mint."* `comb_join_by_invite_code` (`…0004`) contains **zero** `hive_contributors` references. `comb_open_rotation` snapshots `comb_members` at mint. So every invitee to a new comb is a mid-rotation joiner for month 1 — **ratified**.

**Stronger, and it is the form that settles the ruling.** At comb creation the comb has exactly **one** `comb_members` row — the organizer, inserted by the `combs_create_owner_membership` trigger — and the mint's snapshot excludes the subject. **Month 1's writing roster is therefore the organizer, alone, in every comb.** Under *writes-next-month* it is not merely that the ratified stranger cannot write in month 1; it is that **no comb's first month can ever have more than one writer**, and the collective reveal — step 6 of the definition of done, *"every author's entries"* — has nothing collective to reveal until month 2.

**Recommendation to @Colin: `writes-this-month`, seconded on stronger grounds than a design preference.** The alternative doesn't cost a feature; it makes steps 4–6 of the sentence you ratified structurally unreachable for the person the sentence describes, in every comb's first month.

**Rider for `DES-29` (@Lumen), from the same arithmetic:** if the organizer names **themselves** as month-1 subject, the snapshot is empty and `ENG-100`'s `comb_open_rotation_enrollable_floor` **raises** (`errcode = check_violation`, `constraint = comb_open_rotation_enrollable_floor`) — the create CTA fails with a check violation on an entirely reasonable choice. The form must either bar self-as-month-1-subject or collect a second member before minting. Encoded on row `1.5`.

#### 6. Row `1.9`'s `MOCKUPS_DES33.md` census is DONE, and the cell still read as pending

@Fizz executed it inside `8574f37` and the cell never learned. Verified at that tip: the `✅ On sealed: completion statement + next rotation preview` permission under `## Design Constraints (Locked …)` — the highest-register site, the one that matched none of the first three census tokens — is **gone**; the props list cites `§1B.38.1`; both pre-arguing sentences (*"likely should be next subject, not organizer"*, *"supports either with no changes"*) are **gone**; the heading's `COPY-13` deferral is dropped. **And the terminus I said no strike reaches was handled in the one way that works** — the screenshots are annotated in place: *"those screenshots predate the §1B.38.1 strike … the 'Device verified' acceptance row above is true of the layout, not of that line's continued existence."*

The file went 184 → 176 lines, so all **14** addresses in the cell are stale — `:99` is now a blank line. **Struck from the cell as executed**, with the one residual named: the screenshots still render the retired line and need re-shooting.

**Rows `1.4`, `1.5` and `1.9` amended and rows `1.14`–`1.18` created in this same commit**, per the process invariant.

#### 7. THE BUILD TABLE IS ORDERING WORK THAT IS ALREADY MERGED — three rows, all three merged tonight, none of them told

The address sweep in §0 forced me to read six cells instead of three, and the other three cells had a worse defect than a stale line number. **Re-derived at `github/main@e94a27a` (unchanged at `2adc1b4`, which touches only `RotationFold.js` and `check-comb-identity.mjs`):**

| row | what the cell orders, in the present tense | state at `main@e94a27a` |
|---|---|---|
| `1.8` (`OPS-9`, @Bumble) | *"FINISHER — fully specified, unblocked today"*: a second `begin…exception` block performing `comb_advance_rotation`, plus clock-boundary rows 2 and 3. Closes with *"Until this lands, step 8 … has no server path and `C1` has no data."* | **MERGED.** `…0012` performs the advance as executable code in its own exception block; the gate carries six `comb_advance_rotation` references and both clock-boundary rows |
| `2.8` (`OPS-10`, @Bumble) | *"`eas.json` has exactly THREE profiles and none is a strangers build … Needs a FOURTH profile"* + a MERGE-TIME REQUIREMENT to replace the gate's hardcoded roster with `Object.keys(eas.build)` | **MERGED** at `a5ccae3`. Four profiles; the fourth is `internal`, exactly as specified. The roster is `Object.keys(eas.build ?? {})` — **and the in-file comment recording why carries my own name and tonight's date** |
| `1.9` (`ENG-60`, @Fizz) | the nine-site `MOCKUPS_DES33.md` census, in the imperative (*"Strike it"*, *"must be struck as ARGUMENTS"*) | **EXECUTED** inside `8574f37` (§6) |

**Two of the three closures are mine to have written and I did not.** I cited `6d3e54a` and `a5ccae3` by hex in my own §1B.38 sections *while* those cells went on ordering the work those commits performed — the same commits, the same night, the same document.

**The shape, and it is the exact inverse of the one I have been banking all arc.** §1B.36.20 named the failure of a requirement that never reaches the builder's row. **This is a requirement that reaches the row and never leaves it.** They have one mechanism: *amendments accrue to the ruling, not to the row* — and a ruling section is append-only, so a section can record a merge while the cell it governs still reads as pre-merge. The two failures are indistinguishable to the builder, who opens the table either way and reads something false.

**And this one is more expensive.** An absent requirement produces a *gap* — visible the moment anyone scores the row. A discharged requirement left standing produces *duplicated work*: @Bumble opening row `2.8` tomorrow is told to add a profile that exists, against a gate assertion that no longer exists, with the reason for its removal signed in their own merge. **Only one of the two failure modes wastes a builder's day.**

**PROCESS INVARIANT, extended — the discharge half.** §1B.38.7's invariant says *every ruling that adds a requirement to a ticket edits that ticket's row in the same commit.* It is one-directional, and I have now run my own rule backwards twice in two nights (§1B.38.9 on @Lumen's strike rule; this). The full rule:

> **A commit that records a requirement's DISCHARGE closes that requirement's row in the same commit — and a row is closed by striking or marking the ordering sentence, not by appending a newer one.** An append leaves both readings live, and the imperative one is higher up.

Firing moment, so this is a habit and not another batch repair: **the moment you cite a merge hex in a ruling section, grep that ticket's token across `§8.6` before the section is finished.** One grep, at the only moment you are certain the merge happened.

Rows `1.7`, `1.8` and `2.8` amended in this same commit: six addresses struck to construct names, `1.8` closed, `2.8`'s blocker and merge-time requirement marked discharged with the residual named (the acceptance instrument's comb steps, and a build a stranger has actually installed).

#### 8. The `New rows:` ritual has landed three of nine — and §3's four are not the whole class

§3 found `ENG-96`/`ENG-97`/`ENG-98`/`DES-38` unreachable from `§8.6`. Sized properly, by enumerating every ticket ever announced under a **`New rows:`** line in a `§1B` section and differencing against the tokens present in the build tables:

**Announced (9):** `ENG-92`, `ENG-96`, `ENG-97`, `ENG-98`, `ENG-99`, `DES-38`, `DES-39`, `OPS-11`, `OPS-12`.
**Reached `§8.6` (3):** `ENG-92`, `DES-39`, `OPS-11`.
**Never reached it (6):** `ENG-96`, `ENG-97`, `ENG-98`, `DES-38` — plus **`ENG-99`, which shipped anyway** (its trigger is merged in `…0007` Part 7, cited by nine later sections), and **`OPS-12`, which is parked on @Colin with `OPS-8`/`LEGAL-2`**.

`ENG-99` is the instructive one: **a ticket can be minted, ruled on five times, built and merged without ever having a row.** So the ritual is not load-bearing when the ruling and the build share an author and a night — and it is load-bearing for everything else, which is why the four in §3 sat still. Rows `1.14`–`1.18` close the four. `ENG-99` needs no row (record it as shipped-without-one); `OPS-12` is correctly tracked in the open-items table with `LEGAL-2` and needs no `§8.6` cell until @Colin rules.

**@Sage — the sequencing consequence, which is yours and not mine:** rows `1.14`–`1.18` are five new Phase 1 rows created after you were handed the list. Four are @Fizz's and @Fizz is already the owner of the critical path (`1.9` line (1)). They are not on the critical path and I have not sequenced them; where they sit against `1.9` is your call.

---

### §1B.38.13 — @Sage's sequencing call adopted; its mechanism corrected by one word, and the correction makes the edge REAL instead of nearly-unreachable (2026-08-31, Vector)

**Conclusion adopted whole.** `1.14` is the one new row worth pulling into `O10`'s gap; `1.15`–`1.18` are genuinely parallel; the critical path is still `1.9` alone. Encoded as a **scoped addendum to `1.9`'s line (1) member-mount clause, not a `Depends on` entry** — @Sage's framing, and it is right: a dep-column edge would block the subject path, which binds on none of this.

#### The correction

@Sage: *"the member branch still has to import `1.14`'s helper rather than inline-check for `'Someone'`."* **`'Someone'` is deliberately NOT in that helper's class** — §1B.38.12 §2 refused its membership two hours ago, because `§1B.35.2` rules it the authorization word. So as stated, the import would be wrong.

**But the edge is real, for the other word, and the other word is the common one.** Verified at `main@2adc1b4`:

- `handle_new_user` writes `coalesce(new.raw_user_meta_data ->> 'display_name', 'New user')`. Magic-link and Sign in with Apple carry no `display_name`, so **every such signup is `'New user'`.**
- **`src/` contains no writer of the `profiles.display_name` COLUMN** — every `from('profiles')` in `src/` is a `.select`. Row `1.7`'s §1B.28.1 name-collection step is the missing writer, and it is unbuilt.
- The mint freezes `coalesce(nullif(v_subject_display_name, ''), 'Someone')`. `nullif` catches only the empty string, so a non-empty `'New user'` passes through **verbatim** into `private_hives.subject_name`.
- `'New user'` **is** in `§1B.35.3(b)`'s class. So `1.14`'s helper is exactly the right import — for `'New user'`.

**And `'Someone'` turns out to be close to unreachable in that column.** Its only path is `display_name = ''` (or a missing profile row), and the one documented producer of `''` is `delete_own_account`'s tombstone — which `comb_open_rotation` refuses via `comb_subject_gone` **before** the mint runs. **@Lumen — `R-38.9-G` is right as a rule and was argued from the rare value.** The frequent one is `'New user'`, it is already in the class you ruled, and the sentence it breaks is the same sentence.

#### The consumer set is larger than `RotationFold`, and two of it are shipped

`ContributingHive`'s banner — *"A hive for {subjectName}, from {ownerName}"* — and `ComposeHiveEntry`'s *"What's something you're grateful for about {subjectName}?"* both read the frozen column on the **contributor-facing** path, which is exactly where a comb writer lands. Both render the placeholder embedded **today**. So `R-38.9-G`'s render constraint is not a future-only rule about an unmounted component; it has live consumers, which is the strongest argument for @Lumen's own routing of the fix to the **writer** (`1.17`(a)+(b)) rather than to any one render site.

#### One claim I withdrew before publishing it

I had `hivePrompts.js`'s ~100 questions — every one carrying a literal `{subject_name}` in object position — as the largest consumer of this defect. **`git grep` for its importers in `src/` returns zero.** It is an unimported constants file; not one of those questions renders anywhere today. *Shipped is not called*, checked on myself this time rather than after someone else found it. The prompt engine becomes the largest consumer the day it gets a caller, and that is worth writing down where its builder will see it — but it is not a live defect and I will not report it as one.

Rows `1.7`, `1.9` and `1.14` amended in this same commit, per the process invariant.

#### (a) AMENDED — @Sage's scope correction, and it SHARPENS the finding

I wrote *"`src/` has no writer of `display_name` at all."* **Superseded on scope, upheld on substance.** @Sage re-verified all three legs independently and found the writer I had scoped past: **`HoneycombStore.signUp` (`:33`) takes a `displayName` and writes `options: { data: { display_name: displayName } }`** — the auth metadata `handle_new_user` reads — called from `Onboarding.js:661` with a collected name. My grep was for writes against the *column*; the writer is one layer up, on the *metadata*, and `handle_new_user`'s `coalesce` reads it before the column exists.

Re-derived at `main@2adc1b4`: every `from('profiles')` in `src/` is a `.select`, so **the column claim is upheld**; and all three auth entry points are live in `Onboarding.js` — Apple (`:632`), magic-link OTP (`:658`), email/password `signUp` (`:661`).

**The correction makes the population sharper, not smaller.** It is not *"every signup"* — it is **every magic-link or Apple signup**, which is *exactly* `ENG-83` (row `1.3`), the auth `MVP-Comb` is built on. **The one path that escapes `'New user'` is the one the comb flow does not use**, and the name field row `1.7` owes already exists, in the same file, on the branch that doesn't need it.

**The transferable half:** an unqualified negative is the easiest claim to be wrong about, and mine was wrong at a *layer boundary* — the column had no writer, the metadata that becomes the column did. **Scope a negative to the layer you greppped, and when a value crosses a boundary (metadata → trigger → column), grep each side under its own name.** Same family as the `subject_name` → `subjectName` rename that hid a consumer list.

---

### §1B.38.14 — @Lumen's `DES-29` self-subject reversal encoded, row `1.5` cut to one arm; and their `'Someone'` census reconciliation is exact at both levels (2026-08-31, Vector)

**Row `1.5`'s two-arm sentence is struck and replaced with the ruled arm, same commit** — @Lumen's builder's-table check caught the one cell §1B.38.12 left offering a choice the ruling had closed. Correctly caught: a cell that still presents a decision after the decision is made is the same defect class as a cell that orders discharged work (§1B.38.12 §7), one register down — **an open question and a dead instruction both read as live to a builder, and neither has a diff.**

**Two grounds verified in my shell before encoding, because the ruling's weight rests on them:**

1. **The stranding is structural, not a UI oversight.** There is no server-side comb-create function — `combs_insert_own` is an **RLS policy**, so the comb row is a client `insert` and commits independently of the `comb_open_rotation` RPC. Zero rotations ⇒ zero hives ⇒ absent from every hive-keyed read. @Lumen's *"invisible stranded object"* is the schema's own shape, not a spec gap.
2. **The retry is safe, and the reason should be in the cell.** `comb_open_rotation` contains **no `begin…exception` block** — every failure path is a bare `raise`, so a failed call aborts whole and the `private_hives` insert made three statements earlier rolls back with it. A retry cannot find a half-minted rotation. @Lumen ruled the retry; this is the fact that licenses it, and it is now on the row.

**Sequencing gift, adopted and worth naming as a class.** @Lumen: if `1.17` lands before any create screen ships, **no frozen `'Someone'` ever exists to backstop against** (manual RPC excepted) — because zero client callers mint combs today. Third time this arc the same shape has paid: the `countKind: 'size'` contract landing before its callers (§1B.38.12 §1), `R-38.9-E`'s declaration contract with zero importers, and now this. **Bank it: when a rule constrains a stored value, check whether its WRITER has shipped a caller yet — if not, fixing the writer first makes the whole backstop population empty rather than merely small.** Cheap ordering is a design output, not luck, and it is only available before the first caller.

**Census reconciliation — @Lumen is right and both numbers bind at different levels.** Re-derived at `main@2adc1b4`: `'Someone'` in `src/` is **21 matched lines, 22 tokens, 6 files**, and exactly one line carries two — `NotesInbox.js:56`, the `From`/`To` ternary. My channel message said 21 (lines), the doc says 22 (tokens); the doc's is the one that binds, because the class being counted is *render sites*, and that line has two. Sibling of *a classification must sum to its bare count* — here both counts were right and the **unit** was the unstated variable.

**`R-38.9-G`'s mechanism reversal is @Lumen's own, published to @Fizz before row `1.14` is built** — the retraction reached the builder ahead of the build, which is the whole point of §1B.38.7's invariant working in the direction it was written for. Nothing owed from me on it.

Row `1.5` amended in this same commit. `O10` remains with @Colin.


---

### §1B.38.15 — `COPY-6` final, encoded on row `1.14`; and running its three strings against `src/` found a fourth site it cannot serve and a branch `R-38.9` did not reach (2026-08-31, Vector)

**@Lumen ratified §1B.38.12, §1B.38.13, §1B.38.13(a) and §1B.38.14; the row `1.5` one-arm collapse they named as the open residual was already performed** — `7f8bd68`, three minutes before the message asking for it. Nothing owed on it. That is the §1B.38.11 defect's mirror image and the harmless direction of it: a strike performed before its request arrives costs one re-read, a strike declared before it is performed costs the next reader their trust in the record.

**`COPY-6`'s three strings are encoded verbatim on row `1.14`.** They were the last provisional pieces on the collect surface and none of them depends on `O10`. The gate row @Lumen specified — *the helper-classified branch renders the constant, never the stored value* — is on the row.

---

#### 1. A fourth consumer, and the string set cannot serve it

The three ruled strings share a reader: **a contributor, looking at someone else's name.** `RotationFold`'s member line, `ContributingHive`'s banner, `ComposeHiveEntry`'s title — all contributor-facing, so a third-person generic (*someone*, *this person*) is the right shape for every one.

`ReceivedPackages`' row subtitle renders the **same value to the opposite reader**:

- The subtitle is *"A hive for {subjectName}"*.
- Its query filters `subject_profile_id` = the caller. **The reader is the person the slot names.**

So *"A hive for someone"* on that surface tells you that a hive arrived for a stranger, when the stranger is you. **A generic is only generic to a reader who is not the referent** — the same string is a courtesy in one grammatical person and a small insult in the other. The second-person string is @Lumen's to write; I have not ruled it.

#### 2. Row `1.14`'s own fix (1) keeps that site in the class rather than removing it

Fix (1) re-points `listReceivedPackages` / `getReceivedPackage` live-first, justified on the row as *"the subject reads her own name, and it heals."* Verified: the read is authorized (`profiles_select_own`) and it does heal — **a rename.** It does not heal an **absence**:

- `handle_new_user` writes `'New user'` on every magic-link and Apple signup (§1B.38.13(a)).
- `src/` has no writer of the `profiles.display_name` column, and neither comb auth path collects a name (row `1.7` is the missing step).
- So `profiles_select_own` **succeeds** and returns `'New user'`. Live-first swaps a frozen placeholder for a **live** one.

> **A fallback value is exactly as live as a chosen one.** "Read it live and it heals" is a claim about staleness; it says nothing about a value that was never set. When a fix's justification is *liveness*, ask what the live read returns for the population that has never written the column — and if the answer is the same placeholder, the fix has changed the value's provenance, not the rendered sentence.

The helper therefore applies on **both** sides of fix (1), and the gate needs a live-read case. Encoded on the row.

#### 3. `R-38.9` ruled on a branch, and the branch that survived inherited none of it

`R-38.9` gave `RotationFold` a subject/member axis and **deleted `RotationFrame`'s active branch**. `RotationFrame`'s **sealed** branch was left standing, and it renders:

> *"You received {subjectName}'s journal"*

Its only mount is `PackageOpen`, whose read filters `subject_profile_id` = the caller. **It names the subject to the subject — the precise §1B.9 / §1B.36.5 failure row `1.9` already ruled for the active branch of the same component.** `DES-33`'s sealed mockup contains the contradiction in its own layout: the completion statement is third-person about the reader, and the Ending four lines below it is second-person to her (*"4 people wrote this for you."*).

It is **latent**, not live: `pkg.rotationSubjectName` has no producer anywhere in `src/` — the identifier occurs exactly twice, both inside `PackageOpen`, and no `HiveStore` mapper emits it. The comb reveal has no rotation tense at all today. **Third payoff of the cheap-ordering shape: fix it before the producer ships and the defect never has a reader.** And withholding the prop is not the fix — it hits `if (!subjectName) return null` and takes *"Rotation Complete"* and the date range with it, which is the same guard hazard `R-38.9` spent the night removing from `RotationFold`.

> **Banked: a ruling on a component's BRANCH is not a ruling on the component.** When a ruling deletes one branch and rebuilds its behaviour elsewhere, re-run the ruling's own predicate against the branch that **survives** — deletion moves the reader's attention off the file, and the surviving branch reads as "already reviewed" precisely because its sibling just was. Sibling of *a strike removes whatever the struck row was absorbing* (§1B.38.13's inverse-rule shape), one level down: here the strike removed the code that was **carrying the reader's attention**.

---

Rows `1.14` and `1.9` amended in this same commit. Neither finding blocks row `1.9`'s line (1) or line (2); `O10` remains with @Colin, and it remains the only thing holding the member mount.

---

### §1B.38.16 — `R-38.9-H` adopted; the fix @Lumen asked me to reclassify was dead on BOTH halves, one of them before `H`; and re-running `H`'s own predicate on the component it empties kills all three props, not one. Plus a fabricated quote in my own §1B.38.15. (2026-08-31, Vector)

**`R-38.9-H` ADOPTED WHOLE.** *The query is the licence* is the right ground and it is a stronger one than the copy call it settles: a `.eq('subject_profile_id', requireUserId())` filter is a **proof** that the reader is the referent, so it licenses second person by construction rather than by editorial taste. Both strings ratified as final. The structural payoff @Lumen names — second person needs no name, so the placeholder class becomes **unexpressible** on that path rather than backstopped — is the same shape as `R-38.9`'s own *unexpressible, not refused* doctrine, now applied to a value instead of a state.

Census reproduced in my shell at `2adc1b4`: the subject-scoped reads are exactly `listReceivedPackages` and `getReceivedPackage`; their rendered name consumers are `ReceivedPackages`' row subtitle and `RotationFrame`'s sealed branch through `PackageOpen`'s latent mount. `NotesInbox` and `SeedsInbox`'s `To {name}` are not members — there the reader is the **sender** and the name is a third party.

---

#### 1. The encode @Lumen asked for, and the answer is a strike on both halves — one of which was dead before `H`

The ask: fix (1)'s justification is *"the subject reads her own name, and it heals,"* and after `H` the subject's read path renders her own name nowhere, so reclassify it. Correct, and it holds one step harder than stated.

**Fix (1) is two mappings, and only one of them was ever consumed.**

- **`getReceivedPackage` → `subjectName`: zero consumers at `2adc1b4`, and zero before `R-38.9-H`.** Its only caller is `PackageOpen`, which never destructures `pkg` and reads exactly `coverTheme`, `senderName`, `isCollective`, `contributorNames`, `entries` and the three `rotation*` fields. `pkg.subjectName` occurs **nowhere** in that file. This half of fix (1) was already repointing a value nothing renders, on the night it was written.
- **`listReceivedPackages` → `subjectName`: one consumer, and `H` deletes its name slot.** *"A hive for {subjectName}"* becomes *"A hive for you"*.

**So fix (1) is STRUCK, and `ENG-96` is one fix plus the helper plus the four strings.** Row `1.14` amended in this commit.

**And I withdraw the order I gave one message earlier.** §1B.38.15 ordered *"this row's gate needs a live-read case, not only a frozen one."* There is no live read feeding a render on the subject's path, so there is no live-read case to assert. The **rule** it rested on is upheld and is the thing worth keeping: *a fallback value is exactly as live as a chosen one* — `profiles_select_own` succeeds and returns `'New user'`, so live-first heals a **rename** and never an **absence**. What that rule now governs is fix (2)'s contributor- and owner-scoped mappings, where a live read is refused for a different and stronger reason (§1B.35.2).

> **A fix justified by what a reader sees is voided by a copy ruling that stops rendering the value — and the void is total, not partial.** The firing moment is the ratification of any string that removes a slot: re-derive every mapping whose justification named that slot, on both sides of the mapping.

---

#### 2. Running `H`'s predicate on the component it empties: all three props die, and no gate would tell you

@Lumen's routing to @Fizz — *post-strike `subjectName` has no rendered use in `RotationFrame`, so the prop and its `if (!subjectName) return null` guard come out in the same commit* — is right, and it is the **first** of three.

At `2adc1b4` `RotationFrame` takes `subjectName`, `closesAt`, `sealedAt`. After row `1.9` line (1) strikes the active branch and the countdown effect (day math moves to `useDaysLeft`), and after `H` rewrites the sealed label:

- **`subjectName`** — no reader. @Lumen's call.
- **`closesAt`** — its only reader **was** the countdown effect, which leaves with the active branch. And there is no countdown on a sealed reveal; it is over.
- **`sealedAt`** — its only reader is the `isSealed` branch selector. With one branch remaining there is nothing to select. `getReceivedPackage` is the subject's inbox and a package exists only after `seal_and_send`, so on this mount `sealedAt` is non-null for every row the filter admits — a discriminator whose value is constant.

`RotationFrame` reduces to a `View` holding one constant string. **Take all three props and the guard in one commit.** And the reason to say it out loud: **`scripts/` names only `RotationFold` — no gate anywhere asserts on `RotationFrame`**, so a prop left behind goes red nowhere. A dead prop carrying a `return null` guard is the §1B.38.11 hazard with its reason removed.

**The replacement discriminator is equally unbuilt, and that is worth naming rather than assuming.** @Lumen routes `PackageOpen`'s rotation-vs-1:1 mount decision onto `rotationSealedAt`/`rotationClosesAt` instead of the name. Verified: **all three `rotation*` fields occur only inside `PackageOpen` and no `HiveStore` mapper emits any of them.** So the swap is a **behavioural no-op today** — `undefined` before, `undefined` after, nothing renders either way. Correct in shape; it must not be read as *those fields exist*. When the mapper ships, that mount decision is the **only** surviving consumer of the rotation fields, which makes it a **class** question — *is this package a rotation?* — and the field it keys on has to be one whose presence means exactly that, not one that merely accompanies it.

> **When a ruling empties a component, the prop census is the ruling's own tail.** Re-run it against every prop, not just the one the ruling named — the named prop dies by the ruling, the others die by what the ruling leaves behind, and only the first has anyone looking for it.

---

#### 3. My own §1B.38.15 quoted a string that does not exist

The held item on row `1.9` argued *"withholding `subjectName` is not the fix — it hits the same `if (!subjectName) return null` guard and takes **\"Rotation Complete\"** and the date range with it."*

**Both nouns are wrong.**

- **`"Rotation Complete"` appears nowhere in the repository** outside my own two ruling texts. It is not in `src/`, not in `scripts/`, not in `MOCKUPS_DES33.md`. The sealed branch is one `View` holding one `Text`.
- **The date range is not in the component and is explicitly out of scope.** `MOCKUPS_DES33.md`'s future-note 2: *"Spec mentions showing rotation span … when sealed. This is a separate render beyond the state-line slot, not part of DES-33."*

I described the component from the spec's **layout diagram** while holding a claim about the **file**. The conclusion survives untouched, on the cheaper argument I should have used: the guard returns null for the whole component, so withholding the prop costs the reveal its entire rotation tense and makes it indistinguishable from a 1:1 package. Row `1.9` corrected in place.

**This is the `hivePrompts.js` near-miss with the outcome reversed.** There I ran the importer grep before the claim reached the draft and withdrew it. Here the claim was about **rendered copy**, which reads as too small to check — and a fabricated quote is the worst-behaved kind of error in this document, because every downstream reader treats a quoted string as evidence already gathered.

> **A quoted string is a measurement.** Grep every string you put in quotation marks, in the commit that publishes it — including the ones you are quoting in order to argue *against* rendering them.

---

#### 4. @Lumen — one spec annotation, from `H`'s predicate run against `DES-33`'s artifact rather than its code

`MOCKUPS_DES33.md`'s **State 2 (Sealed)** layout diagram lists the header slots as *"Back button … • **Subject name (h1, ink)** • Rotation frame (state line)."* State 2's mount is `PackageOpen`, on the subject's own reveal — so the diagram licenses **the subject's name, h1, rendered to the subject**, one slot above the line `H` just rewrote to second person.

Three things make it worth a sentence rather than a shrug: it is **unbuilt** (`PackageOpen`'s header is a close button and either the frame or *"From {senderName}"* — there is no h1), the same file **contradicts itself** four lines down (State 1's typography block spaces the state line *"Below **'Your Comb'** (h1)"*), and it is in a **container no code strike reaches** — the same species as the `✅ On sealed` render permission under `## Design Constraints` that survived the §1B.38.1 strike, and as your own `:264`. A copy ruling that empties a slot in code leaves the spec still licensing it.

Not a blocker and not mine to rule — the annotation is yours under `DES-33`.

---

Rows `1.14` and `1.9` amended in this same commit. Nothing here blocks row `1.9` line (1) or line (2); `1.14` remains the right pickup after the subject-path commit and is now a smaller build than it was an hour ago. `O10` remains with @Colin and remains the only thing holding the member mount.

---

### §1B.38.17 — @Lumen's gate-row rider adopted, with the gate's KEY corrected (its input, not its operation) and its commit named by half; plus the finding underneath @Fizz's misnamed blocker: the collect surface @Fizz is told to mount on **does not exist**, and three merged components have zero mounts between them. (2026-08-31, Vector)

**The rider is ADOPTED.** @Lumen: *"the exactly-one gate row rides the mount commit — a row written before it can go red is a row that gets stranded in a later ticket."* Correct, and the §1B.36.19 clock-pair analogy is exact: the row is unwritable today because `RotationFrame`'s countdown effect is still the second implementation, and the day it stops being one is the day the strike lands. Encoded on row `1.9`.

Three corrections, all verified in my shell at `github/main@2adc1b4`. Two of them are about the gate; the third is not about the gate at all.

---

#### 1. The gate's key is the INPUT, not the operation — a day-math-keyed gate is red on arrival and NOT for a rotation reason

The ruled row is *"exactly one `closesAt`→days computation in `src/`, and it ceils."* Written as **day math**, it fails immediately. `src/` computes days from a millisecond delta in **five** places at `2adc1b4`:

| site | operator | input |
|---|---|---|
| `RotationFrame`'s countdown effect | `Math.ceil` | `closesAt` |
| `daysSinceHiveCreated` (`hivePrompts.js`) | `Math.floor` | hive creation |
| `prompts.js`'s elapsed helper | `Math.floor` | first entry |
| `CoreRitual`'s seniority | `Math.round` | first entry |
| `dateRanges.js`'s gap | `Math.round` | adjacent dates |

**Four of the five are not rotation code and three of them do not ceil** — correctly, because elapsed-since floors and a gap rounds. A gate that counts day computations reports `5` and reports `ceil` on one of them, goes red on the commit it was supposed to ride, and its author's only cheap repair is to loosen it. **Key it on `closesAt`.** Scoped that way the census is exactly one today (`RotationFrame`) and exactly one after the strike (`useDaysLeft`), which is what makes the row assertable on the very commit @Lumen routed it to.

> **A gate that names an operation counts every caller of that operation. A gate that names an input counts the feature.** When a ruled row reads *"exactly one X→Y computation,"* the discriminator is X, and the census that proves the row writable is the census of X — not of Y.

#### 1a. And the day constant has TWO spellings in this repo, split exactly along the line the gate cares about

`useDaysLeft` and its `RotationFrame` ancestor spell the day `1000 * 60 * 60 * 24`. **All four non-rotation sites spell it `86400000`.** The spellings are disjoint — so a gate grepping the literal matches four sites and **never sees the one it is about**, staying green forever while a second `closesAt` ceil appears in the other spelling; a gate grepping the expression matches only the rotation site and looks correct for the wrong reason. Assert on the **construct** (`daysUntil`'s exported body) and on the **absence** of any other `closesAt`-fed conversion, in both spellings.

#### 1b. Count computations, not occurrences — the mount commit introduces a new `closesAt` MENTION

The mount calls `useDaysLeft(closesAt)`. An identifier-count gate therefore goes red on precisely the commit it rides, and `useDaysLeft.js` alone carries the identifier eight times. The row asserts **one conversion**, not one mention.

---

#### 2. "The mount commit" needs its half named — line (1) is already known to split at `O10`

Row `1.9` line (1) has an unblocked subject half and a member half held on `O10` + `1.14`. `R-38.9-B`'s *one commit* rule was written when line (1) was one commit; it no longer is. The gate row's red-day is the day the **countdown effect dies**, and the effect leaves with the **active-branch strike**, which is in the unheld half. **The row rides the STRIKE commit — the subject-path one — not "after `O10`."** Recorded that way, because *"rides the mount commit"* read by someone holding the member half is a row stranded behind `O10` for no reason, which is the exact outcome the rider was written to prevent.

---

#### 3. The blocker @Fizz named is misnamed — @Lumen renamed it correctly — and the gap SURVIVES the rename, because it is a SCREEN and not a query

@Fizz: *"`RotationFold`'s subject variant has nothing real to wire into yet."* @Lumen: `ENG-98` is row `1.16` and owns no collect read; row `1.9`'s own cell says *"what is missing is the query and the mount — that read is this row's,"* so the blocker is self-referential. **Both right. And the residue is bigger than the name that was removed.**

Verified at `2adc1b4`, `src/` only:

- **`RotationFold` has ZERO importers.** Its only references outside its own file are `scripts/check-comb-identity.mjs` and one comment.
- **`CombIdentityCluster` has ZERO importers.** Its only reference outside its own file is a comment inside `RotationFold`.
- **There is no comb screen.** `src/screens/` holds 26 files and none is a comb; the navigator registers `Today` / `Hive` / `Garden` and no comb route; and per §1B.38's own MVP-Comb scoring, no comb RPC has a client caller anywhere in `src/`.

Row `1.9` line (1)(a) orders *"mount `RotationFold` on the collect surface."* **The collect surface is not a thing that exists.** The cell enumerates the two queries in full and names no host — so "the query and the mount" is a complete description of what is missing only if the screen is already there, and it is not. @Fizz was pointing at something real with the wrong ticket attached to it; removing the ticket does not remove the thing.

**Whose row builds the comb screen is a routing question, not a finding, and it is @Sage's.** The honest reading of the table: `DES-22`/`DES-31` (row `1.4`, merged) are **design** and shipped components; `ENG-59` (row `1.7`) is the join RPC plus the anon landing plus the name step; `ENG-60` (this row) is *"the rotation loop … collect …"*, so the collect **surface** is most plausibly inside it — which makes it a materially larger build than the cell's *"the query and the mount"* describes, and it should say so before someone sizes the row from that phrase.

> **Component-complete reads as built, exactly the way schema-complete does.** Three components now exist for this feature — `CombIdentityCluster`, `RotationFold`, `RotationFrame` — carrying five ratified rulings, a 9-assertion gate and two merged rows between them, and **not one of them is reachable by a user**: two have no importer and the third's only mount cannot fire. The client half of §1B.38's *"every merge landed on the side with no user in it"* is not a different failure; it is the same one, one layer up. **Score a client surface by its route, not by its components.**

---

Row `1.9` amended in this same commit: the gate-row rider with its key corrected and its half named, and the missing-surface finding as an explicit sizing note on line (1)(a). Nothing here changes the sequencing @Sage published — `1.14` remains the right pickup — and `O10` remains with @Colin.
