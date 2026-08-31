# DES-33: Rotation Frame Mockups
**Visual verification of state-line typography and spacing**

## Component: RotationFrame.js
- Location: `src/components/RotationFrame.js`
- Integration: `PackageOpen.js` (reveal screen)
- Props: none after §1B.38.16 — `subjectName`/`closesAt`/`sealedAt` all come out with the active-branch strike (each prop's only reader dies with it; rides row 1.9 line (1)); `organizerName` already struck §1B.38.1. Until that commit lands, `main` still carries all three

---

## State 1: Active Writing (Before Seal)

**SUPERSEDED — R-38.9-A/-D (Lumen, 2026-08-31; `POLLINATE_COMB_ROTATION.md` §1B.38.11):** the active state is not this component's. `RotationFrame`'s only mount is `PackageOpen`, whose subject-scoped, post-send read means the active branch can never legally fire there — the collect surface belongs to `RotationFold` (variant by reader), and the active branch is deleted from `RotationFrame` in row 1.9 line (1)'s commit. This section stays as record only; do not build from it. Its header's "Subject name (h1, ink)" slot also fails R-38.9-H on this mount (the reader is the subject) — see State 2's note.

### Layout Structure
```
┌────────────────────────────────────────────┐
│  [←]         Header (Glass)         [  ]   │
│  • Back button (44pt touch target)          │
│  • Subject name (h1, ink)                   │
│  • Rotation frame (state line)  ← DES-33   │
├────────────────────────────────────────────┤
│  "Writing for Sarah"                        │
│  "6 days left"                              │
│                                             │
│  (Entry card scrolls under glass here)      │
│                                             │
└────────────────────────────────────────────┘
```

### Typography
- **"Writing for Sarah"**
  - Style: `theme.type.label` (system font, weight: 600)
  - Color: `theme.colors.ink` (full strength)
  - Layout: Full width, single line, truncate if needed
  - Spacing: Below "Your Comb" (h1)

- **"6 days left"**
  - Style: `theme.type.bodySm` (system font, weight: 400)
  - Color: `theme.colors.inkSoft` (dimmed secondary)
  - Layout: Full width, single line
  - Spacing: 12pt (`theme.spacing.sm`) below subject line

### Live Behavior
- Days remaining updates every 60 seconds (not per-second to reduce CPU)
- Singular "1 day left" when remaining = 1
- Never shows "0 days left" — transitions directly to sealed state

---

## State 2: Sealed (After Reveal)

### Layout Structure
```
┌────────────────────────────────────────────┐
│  [←]         Header (Glass)         [  ]   │
│  • Back button (44pt touch target)          │
│  • (no name slot — retired, R-38.9-H)       │
│  • Rotation frame (state line)  ← DES-33   │
├────────────────────────────────────────────┤
│  "Written for you"                          │
│                                             │
│  (Entry card & ending visible)              │
│                                             │
└────────────────────────────────────────────┘
```

**AMENDED R-38.9-H (Lumen, 2026-08-31 — `POLLINATE_COMB_ROTATION.md` §1B.38.15/.16):** State 2's only mount is `PackageOpen`, whose read (`getReceivedPackage`) filters `subject_profile_id` to the caller — the reader IS the subject. A reader-is-referent surface speaks second person: it never renders its reader's own name back at her, in the state line or the header. Two retirements in the diagram above, both previously licensed here where no code strike reaches: (1) the header's "Subject name (h1, ink)" slot — with `subject_name` placeholder-class for every no-name signup, it would render "New user" in the largest type on the reveal; any future title in that slot must pass R-38.9-H (second person, or a non-person object) and be ruled before build. (2) The sealed state line — now "Written for you"; second person needs no name, so the placeholder class is unexpressible rather than guarded. The code change rides row 1.9 line (1)'s subject-path commit — this file describes the ruled target, not what `main` renders today.

### Typography
- **"Written for you"** *(was "You received [Subject]'s journal" — R-38.9-H, above)*
  - Style: `theme.type.label` (system font, weight: 600)
  - Color: `theme.colors.ink` (full strength)
  - Layout: Full width, single line
  - Meaning: Past tense, second person — celebrates the gift to the reader it belongs to

- **No future-rotation line.** §1B.38.1 (Lumen, ratified by Vector): order is a mechanism, not a rendered promise — a client sentence naming next month's writer either reimplements `comb_advance_rotation`'s ordering or promises a schedule the tick may change (skips, dormancy, revival). The sealed state renders no future line in v1. A rendered future is licensed only by an existing rotation row; when that read path exists, a next-subject line may fold in from the minted row, adopting the record rather than the ordering.

### Static After Seal
- No timer updates (rotation is complete)
- Date range visible below in the bloom area (separate spec)
- Remains visible until user navigates away

---

## Design Constraints (Locked by DES-31 & §1B.36.1)

### Subject Mask: What Subject Does NOT See
- ❌ NO count of writers or participants before seal
- ❌ NO progress indicator (X of Y written)
- ❌ NO per-person write status ("Maria hasn't written")
- ❌ NO membership roster before seal

### What is Rendered (Both Surfaces)
- ✅ Subject identity — member/collect surface only: "Writing for Sarah" (`RotationFold`). The subject's sealed reveal renders "Written for you" (R-38.9-H) — this row's "Both Surfaces" scope narrowed 2026-08-31
- ✅ Time remaining ("6 days left")
- ✅ On sealed: completion statement only — no next-rotation preview (struck, §1B.38.1; see State 2 above)
- ✅ Anticipation framing, not participation metrics

---

## Component Implementation Details

### File: src/components/RotationFrame.js

**Props:**
```javascript
{
  subjectName: string,        // e.g., "Sarah"
  closesAt: string (ISO),     // e.g., "2026-09-01T00:00:00Z"
  sealedAt: string (ISO)|null // null = active, non-null = sealed
}
```

**Active State Logic:**
```javascript
if (!sealedAt && closesAt) {
  // Calculate days remaining
  // Display: "Writing for [subject]" + "[N] day(s) left"
  // Update interval: 60000ms (every minute)
}
```

**Sealed State Logic:**
```javascript
if (sealedAt) {
  // Display: "You received [subject]'s journal"
  // No future-rotation line (struck, §1B.38.1) — no updates
}
```

---

## Spacing (theme.spacing)

- **Horizontal padding:** `theme.spacing.md` (16pt) on each side
- **Vertical padding:** `theme.spacing.sm` (12pt) top/bottom
- **Gap between lines:** `theme.spacing.sm` (12pt)
- **Bottom margin:** `theme.spacing.lg` (24pt) before entry card

---

## Colors Used

| Element | Token | Hex | Purpose |
|---------|-------|-----|---------|
| Subject line | `theme.colors.ink` | #1A1A1A | Primary information |
| Secondary line | `theme.colors.inkSoft` | #666666 | Dimmed, supporting info |
| Background | Inherited from screen | Varies by cover | Glass header tinted |

---

## Acceptance Criteria

- [x] Component renders both active and sealed states correctly
- [x] Uses `theme.type.label` for subject/completion lines
- [x] Uses `theme.type.bodySm` for secondary lines
- [x] Uses `theme.colors.ink` and `theme.colors.inkSoft` correctly
- [x] Spacing: 12pt gap between lines, 16pt horizontal padding
- [x] Active state updates live (every 60s)
- [x] Singular "1 day left" when appropriate
- [x] Never displays "0 days left"
- [x] Subject mask enforced (no counts pre-seal)
- [x] Device verified on iPhone 16 QA (real resolution)

---

## Notes for Future Updates

1. **Organizer/next-subject line:** resolved, not pending — §1B.38.1 struck it outright (neither noun renders). `COPY-13` closed as a sweep that produced no such copy; this item does not wait on it. A future line is licensed only by an existing rotation row (see `comb_advance_rotation`), not by this spec.

2. **Date range (sealed state):** Spec mentions showing rotation span (e.g., "August 15 – September 12") when sealed. This is a separate render beyond the state-line slot, not part of DES-33.

3. **Motion:** No collapse, parallax, or scroll-linked animation. Fixed pane of glass; motion is the world moving under it.

---

## Visual Reference

See device screenshots in this PR for live rendering at real resolution (393×852 iPhone 16 frame). **Note:** those screenshots predate the §1B.38.1 strike and show the retired "Next month: Maya leads" line — the "Device verified" acceptance row above is true of the layout, not of that line's continued existence. Re-shoot before relying on them to describe the sealed state.
