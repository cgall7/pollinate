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
| **Phase 1** | The rotation engine — `ENG-58`, `ENG-85` (caps **disabled**), `ENG-83`, `ENG-59`, `OPS-9`, `ENG-60`, `DES-33` (**not `DES-21`** — see §1B.3), `DES-22`, `DES-29`, `DES-31`, `COPY-6` |
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

**So `DES-22` draws:** who is here, who has been invited and not joined, who has
not written this rotation. **Presence, invitation, participation.** No
denominator, no seats-remaining, no fullness, no progress-toward-full — a comb of
four and a comb of twelve are drawn by the same rule, and neither is drawn as
*partly full.*

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

- **@Lumen's open question — whether subject-view renders invited-not-joined
  hollow cells — is answered, and the axis says the same thing your lean did.**
  Invited-but-not-joined is **membership** state, not participation state, so it
  sits on the permitted side of the line you just drew; hollow and nameless it
  carries no chase list. @Pixel has already ruled it into `DES-22` §1.1
  (*"a list of faces/names (plus hollow not-yet-joined cells)"*). Nothing further
  to decide.
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
| **C1** | **Rotation participation** — share of that month's `hive_contributors` who write for the subject **[Vector, 2026-08-30 — denominator corrected, §1B.23.2. Was *"share of an active comb"*; the subject is a comb member and cannot write for herself, so that ratio's ceiling is `(N−1)/N` — 80% for a perfect 5-member free comb, 66.7% for a comb of 3 against a 60% bar. The denominator is who **could** write, not who is in the club.]** **[Vector, 2026-08-30 — §1B.26.3: also exclude anyone whose `hive_contributors.removed_at` falls inside the rotation window. A mid-month account deletion removes the writer *and* deletes their letter, so leaving them in the denominator reports a healthy comb as failing.]** | **≥60%, sustained 3 months** | `ENG-89` |
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
| **ENG-59** | Fizz | M | Comb invite-link join flow. Deep-link scheme `pollinate` already registered (`app.json`) |
| **ENG-60** | Fizz | L | The rotation loop: open, notify, collect, seal on `closes_at`, reveal. Needs a scheduler — `pg_cron`, `OPS-9` |
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
| **ENG-91** | Sage | M | **Server-side seal + send for a rotation.** `seal_hive`, `seal_volume` and `send_hive` all gate on `v_owner_id <> auth.uid()`, so **no scheduled job can seal or deliver a month** — `OPS-9` is structurally refused, not merely unwired (§1B.14). Needs a definer path gated on **the rotation's window having closed**, not on who is calling, plus the grants a service role actually holds. **Semantics ruled in §1B.16: seal-and-send, one event, idempotent.** **Cannot wrap `send_hive`** — its friend-connection precondition makes a comb undeliverable; authorization is **comb membership**. **Must refuse to deliver a zero-entry rotation.** **Gates the §1A definition of done** (there is no reveal without a seal) |
| **OPS-8** | Lumen + Bumble | S | **Close the analytics contradiction before the privacy policy publishes.** Amend `legalCopy.js:159,207` per V2 §20.2 — narrow the promise, do not delete it. **Blocks `ENG-89`/`ENG-78` from being honest** |
| **OPS-9** | Bumble | M | **Rotation scheduler.** `pg_cron` jobs to open a rotation, fire notifications, seal on `closes_at`, trigger the reveal. `ENG-60`'s runtime |
| **COPY-13** | Lumen | M | **Ruling sweep.** Retired tokens: `$39.99`, `annual only`/`annual-only`, `$79`, `$5.99`, `metered at delivery`, `delivery is the only meter`, `first delivery free`, `organizer pays`. Follow `README.md`'s sweep procedure — eye-read cited rows, sweep the *retired* token, publish both yields, verdict reads "N hits, all classified legitimate," never "zero hits" |

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
| 1.4 | **Pixel** | `DES-22` + `DES-31` — comb identity, rotation state. **`DES-22` is the DESIGN LONGEST POLE — start it first** (§1B.10): `COPY-6` (1.10) and `DES-29`'s comb happy path (1.5) both need comb identity to exist before they can be written or drawn. **`DES-22` draws presence, not capacity** (§1B.8). **`DES-31`'s count is the member's view only — never the subject's** (§1B.9). **Spec real names** — today a comb of strangers renders every member as `'Someone'`; making that true is `ENG-58`'s job, not something to design around (§1B.17) | — (start now, ahead of 1.6) |
| 1.5 | **Deezine** | `DES-29` — comb-first first run. Sequence with Zero Door (same `App.js` region) | **1.4** (comb identity — §1B.10, §1B.11). *Was "— (start now)"; that contradicted §1B.10 and the §8.7 graph. Corrected.* |
| 1.6 | **Deezine** | ~~`DES-21`~~ → **`DES-33`** — the rotation *frame* around the shipped bloom. **Re-estimated XL → S/M**: the bloom is merged at `a02e247`; what is missing is tense (§1B.3). Spec against `GUIDES/POLLINATE_V2_DES21_COLLECTIVE_REVEAL.md`, do not rebuild | — (**spec has no dependency; start now** — §1B.11). **The countdown *copy* ships with or after `ENG-91` (1.8a)** — "6 days left" is only true once something happens at zero (§1B.16) |
| 1.7 | **Fizz** | `ENG-59` — invite-link join | 1.1, 1.3 |
| 1.8 | **Bumble** | `OPS-9` — `pg_cron` rotation scheduler. **The tick advances state; it cannot seal — it calls `ENG-91`** (§1B.14) | 1.1, **1.8a** |
| **1.8a** | **Sage** | **`ENG-91` — server-side seal + send.** NEW (§1B.14). Today all three of `seal_hive`/`seal_volume`/`send_hive` require `auth.uid()` = the hive's owner, so a rotation can only complete if the organizer taps. **On the longest chain: `ENG-58` → `ENG-91` → `ENG-60`.** Semantics pinned in **§1B.16** — seal-and-send, idempotent, membership-authorized, empty rotations void rather than deliver. **Plus §1B.24.1 (c)/(d):** refuse a tombstoned subject at mint, and void-and-advance a subject tombstoned mid-month — `send_hive`'s guards do not catch either. **Plus §1B.25.2 as amended by §1B.26.1:** ship `coalesce(nullif(p.display_name, ''), 'A writer')` (token ruled by Lumen) as a **backstop** — the live pre-seal path cannot fire it, because `delete_own_account()` deletes the unsealed entry outright. **Plus §1B.26.3, which is the real work:** void-and-advance distinguishes **three** states — sealed, quiet month, and **departed** (zero entries because the only writers deleted their accounts) — or C1 cannot tell a healthy comb from a failing one | 1.1 |
| 1.9 | **Fizz** | `ENG-60` — the rotation loop: open → notify → collect → seal → reveal | 1.1, 1.6, **1.8a**, 1.8 |
| 1.10 | **Lumen** | `COPY-6` — comb + rotation copy | 1.4 |
| 1.11 | **Pixel** | `DES-34` — the mascot's sitting motion (Colin `a478c335…`, §1B.5) | — (parallel; **gates nothing**) |
| 1.12 | **Pixel** | `DES-35` — glass prominence to ≥23% (Colin `a478c335…`, §1B.5). **Material prerequisite merged** — `13cf806` + `cdb07a1` are ancestors of the tip (§1B.7) | — (parallel; **gates nothing**) |
| 1.13 | **Pixel** | `DES-36` — make the existing in-reveal nectar door findable (§1B.5). **Not** superseded by `ENG-90` | — (parallel; **gates nothing**) |

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
| 2.8 | **Bumble** | `OPS-10` — **EAS internal distribution** for the seeded combs (`O7` closed; **not** TestFlight, which stays MVP2) | — |

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
| **O8** | **What happens to a comb when its organizer deletes their account?** Auto-transfer to the earliest-joined remaining member (recommended), void the comb, or leave it ownerless. Raised §1B.24.2. Not blocking: `ENG-92` ships the compliance half (skip the owner's seat, never raise) with no ruling | `ENG-92` now, transfer default is Phase 4 |
| **O9** | **Do we tell a departing writer that leaving destroys the letter they have already written this month?** Today we do not. `delete_own_account()` deletes unsealed hive entries (`20260830000001:150-152`), and the recipient never knew the letter existed. One line in the delete flow. Raised §1B.26.4. Not blocking: `ENG-91` ships either way | Before seeding |
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
