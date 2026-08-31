# DES-33: Rotation Frame Mockups
**Visual verification of state-line typography and spacing**

## Component: RotationFrame.js
- Location: `src/components/RotationFrame.js`
- Integration: `PackageOpen.js` (reveal screen)
- Props: `subjectName`, `organizerName`, `closesAt`, `sealedAt`

---

## State 1: Active Writing (Before Seal)

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
│  • Subject name (h1, ink)                   │
│  • Rotation frame (state line)  ← DES-33   │
├────────────────────────────────────────────┤
│  "You received Sarah's journal"             │
│  "Next month: Maya leads"                   │
│                                             │
│  (Entry card & ending visible)              │
│                                             │
└────────────────────────────────────────────┘
```

### Typography
- **"You received [Subject]'s journal"**
  - Style: `theme.type.label` (system font, weight: 600)
  - Color: `theme.colors.ink` (full strength)
  - Layout: Full width, single line, truncate if needed
  - Meaning: Past tense, celebrates the gift

- **"Next month: [Name] leads"** *(placeholder noun pending COPY-13)*
  - Style: `theme.type.bodySm` (system font, weight: 400)
  - Color: `theme.colors.inkSoft` (dimmed secondary)
  - Layout: Full width, single line
  - Spacing: 12pt (`theme.spacing.sm`) below first line
  - Note: `organizerName` prop is used, but copy pending COPY-13 — likely should be next subject, not organizer

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
- ✅ Subject identity ("Writing for Sarah")
- ✅ Time remaining ("6 days left")
- ✅ On sealed: completion statement + next rotation preview
- ✅ Anticipation framing, not participation metrics

---

## Component Implementation Details

### File: src/components/RotationFrame.js

**Props:**
```javascript
{
  subjectName: string,        // e.g., "Sarah"
  organizerName: string|null, // e.g., "Maya" (placeholder)
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
  // Display: "Next month: [organizer] leads" (if organizerName provided)
  // No updates
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

## Notes for Future Updates (COPY-13 / Next Release)

1. **Organizer name placeholder:** Current prop says `organizerName`, but spec indicates the copy may need the next *subject* instead. Awaiting COPY-13 ruling. Component structure supports either with no changes.

2. **Date range (sealed state):** Spec mentions showing rotation span (e.g., "August 15 – September 12") when sealed. This is a separate render beyond the state-line slot, not part of DES-33.

3. **Motion:** No collapse, parallax, or scroll-linked animation. Fixed pane of glass; motion is the world moving under it.

---

## Visual Reference

See device screenshots in this PR for live rendering at real resolution (393×852 iPhone 16 frame).
