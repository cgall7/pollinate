# Pollinate — Navigation & Zap Placement

**Ruled 2026-08-26 (Colin).** Supersedes the `Today | Hive | Wallet | Garden`
tab bar ruled 2026-08-17 in `Pollinate_The_Ruling.md`.
Companions: `POLLINATE_V2_SPEC.md` §5.2 (zaps), `POLLINATE_V2_ASSIGNMENTS.md`.

---

## 1. The tab bar: four tabs → three

```
BEFORE (shipped today)                    AFTER (ruled)

        ┌─────────────────┐                    ┌────────────────┐   ( C )
        │ ☀  ⬡  ▣  ❀ │ (C)              │  ☀   ⬡   ❀  │   ← door moves
        └─────────────────┘   ↑door             └────────────────┘      to top
      Today Hive Wallet Garden                Today  Hive  Garden
      └── capsule stops short ──┘             └── capsule is symmetric ──┘
          to make room for door                    full width, nothing reserved
```

| | Before | After |
|---|---|---|
| Tabs | Today · Hive · **Wallet** · Garden | Today · Hive · Garden |
| Account door | Bottom-right, **beside** the capsule | **Top-right**, floating over content |
| Capsule width | Asymmetric — `endInset` reserves 64pt for the door | **Symmetric always.** The reservation is deleted. |

**Why Wallet dies.** Spec §5.2(b) already ruled *the honeycomb is the wallet* —
your balance is honey filling your own hexagon, not a number on a fifth screen.
A Wallet tab would be a permanent, empty, crypto-shaped hole in the tab bar of a
gratitude app: wrong for users, wrong for App Review, wrong for positioning.
The tab bar was the last place the old wallet plan survived. It's gone.

**Why three tabs is better anyway.** Today (write) · Hive (connect) · Garden
(reflect). Three verbs, no fourth thing to explain.

---

## 2. The account door: bottom-right → top-right

```
┌──────────────────────────────┐
│                        ( C ) │  ← Account door. Persistent, all three tabs.
│                              │     Avatar. Tap → Account modal.
│         screen content       │
│                              │
│      ┌────────────────┐      │
│      │  ☀   ⬡   ❀  │      │  ← tab capsule, centred, symmetric
│      └────────────────┘      │
└──────────────────────────────┘
```

**Rules:**
- One render site, in `MainTabs` — **not** per-screen headers. It must not drift
  by a pixel between tabs, and `headerShown: false` stays false on all three.
- Absolute overlay anchored to safe-area top-right. `pointerEvents="box-none"`
  so it never eats a tap meant for content — same discipline as today's
  `TabDock`.
- Signed out, it doesn't render (unchanged). Because it no longer sits beside
  the capsule, **the signed-out and signed-in tab bars are now identical** —
  the `useHasAccountDoor()` inset branch disappears entirely.

**What lives behind the door:** profile, settings, legal, subscription, and
**all nectar administration** (§4).

---

## 3. Where the money went: the placement principle

> **Emotional and frequent lives in the comb.
> Administrative and rare lives behind the door.
> Neither gets a tab.**

| Action | Frequency | Home |
|---|---|---|
| Send a zap | Often, emotional | **In the moment** — reveal, entry, hexagon |
| See your nectar | Glanceable | **Hive tab** — honey in your hexagon |
| Add nectar | Rare, boring | **Account → Nectar** |
| Withdraw | Rare, boring | **Account → Nectar** |
| Wallet consent | Once | **First zap attempt** (Apple 2.3.1(a)) |
| Lightning address | Once | **Account → Nectar** |

---

## 4. Zaps: the five surfaces

### ⚠️ Gate on all four

**Nothing below exists until the user has explicitly consented to a wallet**
(spec §5.4, Apple 2.3.1(a)). Pre-consent: no honey in the comb, no zap
affordances, `PackageOpen` ends with a plain Close exactly as it does today.
The consent screen fires on the **first zap attempt**, never at signup.

### Surface 1 — Hive tab · your hexagon *is* the balance

```
        ⬡     ⬡              Your own hex sits centre.
     ⬡  ⬡̲   ⬡              A honey MARK carries the balance — never a fill.
        ⬡     ⬡              Others keep blooming (ring) / seeded (seal).
    └ yours, honeyed ┘        Tap yours → nectar sheet: balance, recent zaps in.
```

> ⚠️ **Fill is identity, marks are state** — Pixel-ruled 2026-08-13, shipped in
> `hexTintFor` (`src/components/Avatar.js`) and its application in
> `HoneycombGrid`. Cell fill is a name-hashed identity
> tint whose range is **capped per tint** (a `washSky` member's fill range
> measured at under half of `washYellow`'s), so a fill-based balance would render
> some people permanently quieter than others. **The honeyed state is a third
> mark type**, tint-independent, stacking with the blooming ring and the seeded
> seal. Collision against both must be resolved explicitly — the ring and the
> seal already collided at 77% of mark width once; see `hexSealPath` in
> `src/components/hexGeometry.js`, including the R61 correction in its header:
> angular clearance is the wrong instrument; measure 2D boundary-to-ink.

No number in a nav bar. No badge. The comb carries it.

### Surface 2 — PackageOpen · the react slot *(the primary one)*

```
   … entry 12 of 12 blooms …
   ┌────────────────────────────┐
   │   ✿  10    ✿  50   ✿ …   │   ← 3 presets + custom
   │        Send nectar          │
   │           Close             │   ← always available; zapping is never required
   └────────────────────────────┘
```
This is the **Slice 1.1 react slot**, already carved out and empty. The
recipient has just read twelve months of someone noticing them and can't say
anything back that's big enough — so they send nectar. Honey drop flies the
existing `pollinationFlight` path to the author's hex.

### Surface 3 — mid-reveal · zap *one entry*

```
   ┌────────────────────────────┐
   │  "the hospital waiting…"   │
   │                       ✿    │   ← small drop, per entry card
   └────────────────────────────┘
```
Author later sees: *"Sarah zapped the entry about the hospital waiting room."*
The signal about **which memory landed**. Nobody else has this.

### Surface 4 — hexagon action menu · unprompted

Joins the existing bottom sheet: `Send note · Plant seed · **Send nectar**`.

### Surface 5 — the comb pot *(ships with combs, Project 18)*

A collective hive carries nectar alongside entries. **G2 (spec §5.6): never a
pooled balance** — contributions settle direct-to-recipient; the "pot" is a
display over ledger rows.

---

## 5. What actually changes in code

| File | Change |
|---|---|
| `src/navigation/MainTabs.js` | Delete the `Wallet` `Tab.Screen` + its `TAB_ICONS` entry. Remove `AccountDoor` from `TabDock`. Collapse `endInset` to `SIDE_INSET` and delete the `useHasAccountDoor()` branch. Render the door as a top-anchored overlay. |
| `src/screens/WalletTab.js` | **Delete.** Referenced nowhere else — verified: the only importer is `MainTabs.js`. |
| `src/navigation/AccountDoor.js` | Re-anchor top-right. Component logic unchanged. |
| Gates | `check:nav-depth` still applies — all three tabs stay direct children of the navigator. Re-run after the tab count changes. |

**Contained change.** `Wallet` appears in exactly one file outside its own
screen. Nothing else in `src/` or `scripts/` references it.

---

## 6. Sequencing

Sections 1, 2 and 5 are **Slice 1** — no wallet, no money, no dependency on
anything in Project 19. Removing a shell tab and moving an avatar makes the
current build better on its own and should ship with the next design pass.

Section 4 is **19a (simulated nectar)** and lands behind the consent gate.
