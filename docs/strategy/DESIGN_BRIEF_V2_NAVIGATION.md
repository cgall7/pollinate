# Design Brief — Navigation & Zap Surfaces

**For:** Design agent (Pixel — layout/system; Deezine — motion/choreography)
**From:** Colin · **Ruled:** 2026-08-26
**Issues:** `DES-27` (Pixel), `DES-28` (Deezine)
**Authority:** `Pollinate_The_Ruling.md` Amendment 2026-08-26 · `POLLINATE_V2_NAVIGATION.md`

This brief is self-contained. You should not need to read the 900-line spec.

---

## PART A — What you're designing (Pixel, `DES-27`, ships in Slice 1)

### A1. The tab bar drops from four tabs to three

```
BEFORE (shipped)                          AFTER (design this)

   ┌─────────────────┐                       ┌────────────────┐   ( C )
   │ ☀  ⬡  ▣  ❀ │  (C)                │  ☀   ⬡   ❀  │
   └─────────────────┘    ↑door              └────────────────┘
   Today Hive Wallet Garden                  Today  Hive  Garden
   asymmetric: 64pt reserved                 symmetric, full width
```

- **Wallet is deleted.** Not hidden, not disabled — gone. Its icon
  (`wallet` / `wallet-outline`) is removed from `TAB_ICONS`.
- The capsule becomes **symmetric**. Today it stops short on the end side to
  make room for the account door; that reservation is deleted.
- **Signed-out and signed-in tab bars become identical.** Today they differ
  (no door when signed out ⇒ different inset). That difference disappears —
  one layout, both states.

### A2. The account door moves to the top right

```
┌──────────────────────────────┐
│                        ( C ) │  ← 52pt circle, glass, avatar inside
│                              │     Persistent across all three tabs
│         screen content       │     Tap → Account modal (unchanged)
│                              │
│      ┌────────────────┐      │
│      │  ☀   ⬡   ❀  │      │
│      └────────────────┘      │
└──────────────────────────────┘
```

- Anchored to **safe-area top-right**. You specify the inset.
- **One render site**, floating over content — *not* a per-screen header.
  `headerShown: false` stays false on all three tabs. It must not shift by a
  pixel between tabs.
- Component and behaviour are unchanged: `GlassBackground` at
  `radius = DOOR_SIZE / 2`, `Avatar` inside. **You are moving it, not
  redesigning it** — unless the new position demands a size change, in which
  case say so explicitly.

### A3. Live values you're designing against

Pull from the code, don't invent:

| Token | Value | Source |
|---|---|---|
| `DOOR_SIZE` | 52 | `src/navigation/AccountDoor.js` (exported; `tabBarLayout.js` imports it) |
| `DOOR_AVATAR_SIZE` | 34 | `src/navigation/AccountDoor.js` — module-private `const` |
| `SIDE_INSET` | 20 | `src/navigation/tabBarLayout.js` |
| `BAR_HEIGHT` | 60 | `src/navigation/tabBarLayout.js` |
| `BAR_BOTTOM` | 28 | `src/navigation/tabBarLayout.js` |
| `DOOR_END_INSET` | `theme.spacing.lg` = 24 | `src/navigation/tabBarLayout.js` — replaces `DOOR_GAP`, dead since DES-27 |
| `DOOR_TOP_GAP` | 17 | `src/navigation/tabBarLayout.js` |
| Tab icon size | 24 | `src/navigation/MainTabs.js` — the `Tab.Screen` icon `size` prop (inline, no name to grep) |
| Capsule radius | `theme.borderRadius.large` = 32 | `src/constants/theme.js` |

Addresses are constant names, not line numbers — grep the token in the named
file. A token that returns nothing has been retired; check the file's own
comments for what replaced it.

Spacing scale: `xs 4 · sm 8 · md 16 · lg 24 · xl 32`.
Shadows: `theme.shadows.glass`, falling back to `theme.shadows.card` under
Reduce Transparency (already handled — keep both looks working).

### A4. Deliverables — Pixel

1. Three-tab capsule: icon spacing, capsule width, centring.
2. Top-right door: safe-area inset, and how it sits over scrolling content on
   all three tabs (does it need a scrim? does it fade on scroll? your call —
   state it).
3. Both transparency modes (glass and Reduce Transparency).
4. RTL note — today the door "belongs on the other side" in RTL
   (`MainTabs.js` styles comment). Confirm that still holds at the top.

---

## PART B — The zap surfaces (Deezine, `DES-28`, ships with 19a)

### B0. 🔴 THE GATE — read before anything else

**None of Part B exists until the user has explicitly consented to a wallet.**

- Pre-consent: **no honey anywhere**, no zap affordances, `PackageOpen` ends
  with a plain Close — exactly as it ships today.
- Consent fires on the **first zap attempt**, never at signup. (Apple 2.3.1(a):
  no hidden or dormant features.)
- **You must design the pre-consent state too**, and it is "identical to today."
  Say so explicitly in the deliverable so nobody builds a permanently-visible
  empty wallet affordance.

### B1. 🔴 THE HARD CONSTRAINT — fill is identity, marks are state

Pixel ruled this on 2026-08-13; it is shipped in `hexTintFor`
(`src/components/Avatar.js`) and its application in `HoneycombGrid`:

> *Cell fill is identity. Marks and rings are state.*

Fill is a **name-hashed identity tint**, and its range is **capped per tint** —
a `washSky` member's fill range measured at **under half** of `washYellow`'s. So
anything carried in fill reads permanently quieter for some members than others.

**Consequence: the honeyed state is a MARK, not a fill.** It must be
tint-independent and stack cleanly with the two existing state marks:

| State | Current form | Location |
|---|---|---|
| `blooming` | segmented ring, 6 edge marks, `BLOOM_FLOOR_OPACITY = 0.75` | edges |
| `seeded` | small hexagon seal | lower-right **vertex** |
| **`honeyed`** | **you design this** | **you choose — must not collide** |

⚠️ The ring and the seal **already collided once**, at 77% of mark width, and
had to be resolved — see `hexSealPath` in `src/components/hexGeometry.js`,
**including the R61 correction in its header: angular clearance is the wrong
instrument; measure 2D boundary-to-ink.** A cell can be blooming **and** seeded
**and** honeyed simultaneously. **Explicit three-way collision analysis is part
of this deliverable.**

Accessibility: the ring's opacity floor exists to clear WCAG 1.4.11 (3:1
non-text) on both real-member grounds. Any new mark clears the same bar, on both.

### B2. The four zap surfaces

**Surface 1 — Hive tab · your own hexagon**
The honeyed mark (B1). Tap your own cell → nectar sheet: balance, recent zaps
received. No number in a nav bar. No badge. The comb carries it.

**Surface 2 — `PackageOpen` · the react slot ⭐ PRIMARY**
```
   … entry 12 of 12 blooms …
   ┌────────────────────────────┐
   │   ✿ 10    ✿ 50    ✿ …    │  3 presets + custom
   │        Send nectar          │
   │           Close             │  ← always present; zapping is never required
   └────────────────────────────┘
```
This slot is **already carved out and empty** — reply/react was deferred to
Slice 1.1 and `PackageOpen` currently ends with a bare Close. You are filling a
hole, not adding a step.

*The emotional read:* they have just finished twelve months of someone noticing
them, and cannot say anything back that is big enough. So they send nectar.

**Surface 3 — mid-reveal · zap one entry**
A small drop affordance on each entry card during the reveal. The author later
sees *"Sarah zapped the entry about the hospital waiting room."* This is the
signal about **which memory landed** — design the author-side notification too.

**Surface 4 — hexagon action menu**
One new row in the existing bottom sheet: `Send note · Plant seed · **Send nectar**`.

### B3. The flight — reuse, don't invent

A zap flies a **honey drop** along the existing pollination path between two
hexagons. These already exist and are the intended parts:

`FlyingBee.js` · `pollinationFlight.js` · `flightSequencer.js` ·
`HoneyDropProgress.js` · `GlowOrb.js` · `CelebrationRays.js` · `combLattice.js`

Motion tokens (`src/constants/motion.js`): springs `glide · pop · press · ray ·
reveal · land · tick`; durations `instant 120 · quick 200 · arrival 400 ·
celebrate 500 · reveal 700`; `STAGGER_MS 50`; `CASCADE_BUDGET_MS 700`.
**Reduce Motion has first-class support** (`useReducedMotion`) — every surface
needs its reduced variant, and per R46 the mark itself never disappears, only
the animation does.

### B4. Deliverables — Deezine

1. The `honeyed` mark + three-way collision analysis + WCAG 1.4.11 check.
2. `PackageOpen` react slot: layout, preset amounts, the Close relationship.
3. Per-entry zap affordance + the author-side "which entry landed" notification.
4. Action-menu row.
5. Zap flight choreography (timing sheet), plus its Reduce Motion variant.
6. **The pre-consent state for all of the above** (= today, unchanged).

---

## PART C — Rules that override taste

1. **Never the word "crypto" in any user-facing string.** The unit is
   **nectar**, counted in **drops**. ("Crypto" appears only in the consent
   screen, Settings, legal copy, and App Review Notes.)
   *Amended 2026-09-04 by Colin (Collab-on-projects thread `00b55e23`, event
   `00f8aef5`): "bitcoin" and "sats" are no longer banned — "i do want us to
   use the words sats and bitcoin, we need to update the banned list." The
   original rule banned all three with the same four-surface exemption. The
   nectar/drops register remains the default vocabulary; this amendment lifts
   the word ban, it does not re-denominate the UI.*
2. **Zapping is always optional and unlocks nothing.** No gating, no "unlock with
   nectar," no rewards for streaks or journaling. (Apple 3.1.1 and 3.1.5(v) —
   both are rejections, not preferences.)
3. **Money never intrudes on the artifact.** The hero moment is the reveal.
   Nectar is a *reaction to* it, never a condition of it, and never appears
   during hive creation, writing, sealing, or delivery.
4. **No balance in the tab bar.** No badge, no number, no dot.
5. Part A ships **now** in Slice 1. Part B ships with 19a, behind B0's gate.

---

## PART D — Do not touch

- Bloom/reveal choreography for Memory Lane and `PackageOpen` entries — that's
  `DES-17`, a separate XL issue, and it has to survive running in a browser.
- The Today, Hive and Garden tab *contents*. This brief is the chrome only.
- `Avatar`, `GlassBackground`, `ScreenHeader` internals.
- The blooming ring and seeded seal. You are adding a third mark **beside** them,
  not restyling them.

## PART E — Answer these back

1. Top-right door over scrolling content: scrim, fade, or neither?
2. Where does the `honeyed` mark live so it clears both existing marks?
3. Preset zap amounts — what three numbers, in drops?
4. Does `DOOR_GAP` (12) die entirely, or get reused as the top-right inset?
