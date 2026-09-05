// Hoisted out of the `theme` literal so `gradients` below can be built from
// the tokens themselves instead of re-typing their hex values. A stop that
// only *claims* in a comment to be `accent` goes stale the next time the
// accent moves — which is exactly how §11's retune got dropped on the floor
// once already.
// The one legal way to write a translucent colour. Alpha lives in the token,
// never at a call site: `theme.colors.surface + 'D9'` derives from the token but
// is invisible to any gate keyed on `rgba(`/`#RRGGBB`, and it documents its own
// alpha in a trailing comment that goes stale the moment the alpha moves. Three
// such sites shipped before this existed.
const withAlpha = (hex, alpha) => {
  const m = /^#([0-9A-Fa-f]{6})$/.exec(hex);
  if (!m) throw new Error(`withAlpha() takes a 6-digit hex pigment, got ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// The one legal way to write a pigment DERIVED from two others. A derived pigment
// is not a third category — it resolves to a hex before anything sees it, and it
// stays a stated function of its inputs so it retunes when they do. The rule is
// the same as `withAlpha`'s: a hex that only *claims* in a comment to be "accent
// warmed toward ink" is a hex that stops being that the next time either moves.
const mix = (hexA, hexB, t) => {
  const parse = (h) => {
    const m = /^#([0-9A-Fa-f]{6})$/.exec(h);
    if (!m) throw new Error(`mix() takes 6-digit hex pigments, got ${h}`);
    return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  };
  if (!(t >= 0 && t <= 1)) throw new Error(`mix() takes t in [0,1], got ${t}`);
  const [a, b] = [parse(hexA), parse(hexB)];
  const ch = (i) => Math.round(a[i] + (b[i] - a[i]) * t).toString(16).padStart(2, '0');
  return `#${ch(0)}${ch(1)}${ch(2)}`.toUpperCase();
};

// SOLID PIGMENTS. Every colour in the system is either one of these or an alpha
// of one of these — there is no third category, which is what makes `withAlpha`
// the only legal way to write a translucent colour and makes a raw `rgba(...)`
// anywhere in `src/` a defect by construction rather than by taste.
const pigment = {
  // Backgrounds
  background: '#FFF7CC', // Sunlit Honey (§12.1 retune) — identity screens: Today, Honeycomb, Recap, Wrapped, ritual gate.
  backgroundWriting: '#FFFBEB', // Sunlit Cream — ritual input step only. Contrast gate (Sage-ratified): read/write surfaces stay cream, never brighten.
  surface: '#FFFFFF', // Card white, pops off the cream backdrop
  surfaceShade: '#FFFAE8', // Surface in shadow. Only ever a gradient's far stop — stays lighter than `background` so a card never dissolves into the page.

  // Accents — Sunbeam v1 (GUIDES/GRATITUDE_DESIGN_SYSTEM_V1.md §1). Zero green anywhere.
  accent: '#FFD200', // Marigold — THE one accent. Active states, celebration badge, key highlights.
  // Warm amber. FILL, STROKE, GLYPH AND GRADIENT STOP — never text, on any
  // ground, at any size (§35/R127). It clears 3:1 as text against exactly three
  // colours in this file — `inkVeil`, the ink family, and `paperEvening`, five
  // names between them — and all three are dark; no light ground in the system
  // admits it. The roles this comment used to
  // name — "hero numerals, emphasis on cream" — were a licence: they were the
  // third and last place the app authorised amber lettering, and they outlived
  // four separate strikes at four call sites because nobody was striking THIS.
  // Warmth on a numeral is this token BEHIND the ink, as fill. Replaces `gold`.
  accentDeep: '#FF7A00',
  accentBurst: '#FFEA00', // Hottest yellow on the board. Motion only — bursts, pops, bee trail. Never a static fill, text, or background.
  // ONE EXCEPTION, R-CL-2 (2026-09-04), stated here rather than left for the
  // next reader to find as a contradiction. `BloomLight` paints this token as
  // a breathing overlay on a comb cell, which is a motion use — and freezes it
  // at the peak under Reduce Motion, which is not. The freeze is how every
  // motion element in this app answers Reduce Motion (the ring it replaced did
  // the same at the same value), and the alternative is deleting a state for
  // exactly the people who cannot see it move. It stays an exception, not a
  // widening: the token is still barred from a resting surface, and the only
  // way to sit still in it is to be motion that a preference stopped.
  // Golden Honey — the adaptive icon's locked gold (§13.1), and the KEEPSAKE
  // REGISTER: the field a finished, kept thing stands on. Today that is the
  // Seal that opens Wrapped, the Year Card that closes it, and the month-theme
  // flip. Deliberately NOT `accent`: the two are only 1.179:1 apart, close
  // enough that a keepsake next to an accent fill reads as a printing error
  // rather than a second colour. Promoted to a token in §17.5 after living as
  // a hand-copied literal in three files.
  //
  // §29.1 — ADMISSION. Gold is a MATERIAL, not an emphasis. A surface may wear
  // it only if all three hold:
  //   1. FINISHED  — no further authoring by the user is expected of it.
  //   2. KEPT      — it persists as an artifact, not as a view of live data.
  //   3. SINGULAR  — a specific thing with an identity, not a summary of things.
  // A streak count fails (2). A balance fails (2) and (3). An in-progress
  // private hive fails (1); a sealed one passes all three.
  //
  // Material is a property of the object, so it does NOT change when a second
  // object of the same kind arrives — WP-2's "at most one gold surface per
  // screen" is WITHDRAWN (§29.1). A count rule makes the register a function of
  // position in a list, and then gold means "the first one", which is a rank.
  // Three sealed hives are three gold cards. What survives the withdrawal: gold
  // may never carry EMPHASIS (emphasis is relative, material is not), and GOLD
  // MAY NOT BE THE GROUND — it sits on a non-gold page and the cream must still
  // read as the page.
  //
  // TEXT ON THIS FIELD IS SINGLE-TIER. `ink` is 10.01:1 and is the only legal
  // text colour here. `inkSoft` is 3.69:1 and FAILS 4.5:1; `accentDeep` is
  // 1.53:1; white is 1.71:1 (R15, remeasured §29.2). So hierarchy on a gold
  // surface comes from size, weight and position — never from colour (§23.9.2b).
  // Ground pairs, ΔE00 (§20.7: ΔE for ground-on-ground, WCAG for ink-on-ground):
  // vs `background` 21.14, vs `surface` 30.82, vs `washYellow` 19.63.
  goldField: '#F0C023',
  washYellow: '#FFF3C4', // The warm ground — Sunbeam's default full-bleed wash, activation staging included (R50). A role, not a screen.
  washPeach: '#FFE9D9', // Retired as a surface (§17.2/R50). Avatar identity swatch ONLY (sub-40pt); no new uses at any size.
  washSky: '#E4F2FB', // The cool counter-ground — hive surfaces + avatar swatch only (+ one legacy §8 Wrapped slide until §14.2 replaces that screen). Use sparingly (§1).
  danger: '#E5484D', // Destructive only (delete entry). Rarely seen.

  // Text / ink
  ink: '#221B03', // Warm near-black. Text, primary CTA fill, icons.
  // THE SECOND NEAR-BLACK, and it is not drift. `#1A1500` already shipped as the
  // base of `surfaceBorder`/`surfaceBorderStrong` and of both `detailOverlay`
  // scrims — cooler and deeper than `ink`. The split is by ROLE: `ink` is the
  // colour of something WRITTEN (text, a fill, a progress rail's fill and its
  // track — §23.11 names `ink` for that pair explicitly); `inkVeil` is the colour
  // of something OCCLUDING (a boundary, a scrim). Naming it is what stops the
  // next scrim being eyeballed against the wrong one.
  inkVeil: '#1A1500',
  inkSoft: '#6B5F3D', // Secondary text — ~6.1:1 on Sunlit Cream, AA-compliant.

  // Entry paper — Evening (ENTRY_EXPRESSION_BRIEF.md, ratified 2026-08-26).
  // A dark paper is a GROUND, not a text role, so it is its own pigment —
  // never `ink`/`inkVeil` reused (ΔE00 7.5/9.7 from each, measured). Cream
  // needs no token: it IS `backgroundWriting`, unchanged.
  paperEvening: '#3A2F1F',
  // The ONLY two inks ever painted inside a `paper === 'evening'` region.
  // No alpha-of-ink token (`surfaceBorder`, `trackDim`, `pressedOnLight`,
  // the family) may render there — R-EXT's dark-paper ink gate: dimming
  // assumes a light ground, so on Evening it moves the mark toward the
  // paper instead of away from it (§2.1, contrast tables).
  paperEveningInk: '#E5D5B8', // 9.05:1 on paperEvening
  paperEveningInkSoft: '#D0BFA0', // 7.25:1 on paperEvening
  textPrimary: '#221B03', // Alias of `ink`, kept for existing call sites.
  textSecondary: '#6B5F3D', // Alias of `inkSoft`, kept for existing call sites.
  textInverse: '#221B03', // Dark text for use on top of bright accent/accentDeep surfaces
};

// THE PALETTE: the pigments, plus every ruled alpha of them. A translucent
// colour appearing anywhere else in the app is a defect — it has no name, so
// nothing can retune it and no gate can see it.
const colors = {
  ...pigment,

  // --- Boundaries and occlusion (all `inkVeil`) ---
  surfaceBorder: withAlpha(pigment.inkVeil, 0.08),
  surfaceBorderStrong: withAlpha(pigment.inkVeil, 0.14), // filled/selected card states need more than a hairline
  // DES-16 §5's picker rows: a fill fainter than `pressedOnLight` (0.06) —
  // these rows sit inside a card that already has its own `surface`/border,
  // so the row needs only enough tint to read as a row, not a second card.
  rowVeil: withAlpha(pigment.inkVeil, 0.03),
  // The modal scrim. Two `detailOverlay` sites shipped this literal, and
  // SeedsInbox's own comment says it matches NotesInbox *deliberately* —
  // "a seed detail and a note detail should be siblings." That was someone
  // doing the right thing by hand; this is the same thing with a name on it.
  //
  // R-N3.5 (GUIDES/POLLINATE_NECTAR_LIVING_EXCHANGE.md) ruled a RE-SOLVE of
  // this pair after a capture showed the scrimmed compose cream reading as
  // mud, and ruled one acceptance row: the scrimmed ground keeps at least half
  // its LCh chroma. Dusk, not olive.
  //
  // THE PAIR RE-SOLVED ONTO THE PIGMENT IT ALREADY HAD, and the alpha moved.
  // That is a deviation from the ruling's named mechanism, and it is written
  // here rather than smuggled, per R-CL: a ruling's named mechanism is a
  // floor, not a ceiling, and saying so in the file is what makes the
  // measurement canon. Reproduce all of it with
  // `node scripts/derive-nectar-veil.mjs`, which reads this file's own source.
  //
  //   * THE RULED ROW IS GREEN ON THE GROUND THE RULING NAMES. The quoted
  //     composite rgb(163,156,122) keeps 86.6% of the cream's chroma and its
  //     hue moves 1.0 degree. "Olive" on a cream is a LIGHTNESS fact at held
  //     hue; chroma retention cannot see it.
  //   * THE ROW IS RED ON A GROUND THE RULING DOES NOT NAME. This token is one
  //     number read by five sites, and on `washSky` a warm veil cancels a cool
  //     ground: C* 6.59 -> 2.99, retaining 45.4%. A grey — which is
  //     `spotlightDim`'s own retired defect (C* 2.83, below) on a different
  //     ground, in a brand with no grey in it.
  //   * THE VEIL MAY NOT MOVE TOWARD WARMTH, for two reasons outside this
  //     ruling. `spotlightDim` was DERIVED to be distinguishable from this
  //     token (ΔE00 16.41 on the page, published below as the improvement) and
  //     the two mean opposite things. And the drop in flight is amber by
  //     R-N3.2, so an amber veil camouflages the object the beat is about:
  //     every warm candidate fails one or both.
  //
  // So the only axis left is the alpha, and on it every bar moves the same
  // way. 0.55 is the smallest two-decimal value clearing the ruled row on
  // EVERY ground with a margin that is not inside its own floor's noise
  // (washSky 70.2% against 50%; 0.45 clears at 50.8% and 0.445 at 50.1%,
  // which is a coincidence rather than a measurement). It carries the
  // separations up with it rather than spending them: ΔE00 from a
  // spotlight-dimmed page 16.41 -> 25.40, modal card against the page it makes
  // inert 27.65 -> 37.62, and R-N3.2's drop floor is untouched at 16.4244
  // because the binding ground there is a BARE cover the veil never reaches.
  //
  // THE NUMBER INSIDE THE CLEARED RANGE IS A JUDGMENT AND IT IS THE RULING
  // AUTHOR'S. `check-scrim-veil` holds the PROPERTIES and no row holds 0.55,
  // so moving it is one edit here and the gate keeps its meaning. What the
  // gate cannot rule on is the cream: "olive" has no numeric band anywhere in
  // this repo, and the band I would have to invent to pick by is not a band
  // anybody owns.
  scrim: withAlpha(pigment.inkVeil, 0.55),

  // THE SPOTLIGHT DIM — the transient dim behind a hex tap. Not `scrim`, and the
  // gap between them is the whole point: `scrim` means THE PAGE IS INERT, a modal
  // owns it, tap anywhere to dismiss. This means THE PAGE IS STILL YOURS, one
  // thing on it is lit, and it releases itself.
  //
  // R6 (GUIDES/HEX_TAP_SPEC_LUXURY_PASS.md): this was `inkVeil` @ 0.25, a token
  // calibrated over `background` and then PAINTED ON THE CELLS. `inkVeil` keeps
  // the page's hue because the page has hue to keep; `surface` is #FFFFFF and has
  // none, so the same veil landed at C* 2.83 — achromatic. Five grey hexagons
  // around one yellow one reads as "everyone else is offline," not as a spotlight,
  // on a brand with no grey in it.
  //
  // DERIVED, and the derivation is what makes the alpha honest: hold the room's
  // lightness EXACTLY where it already ships and buy the hue for free. Solved on
  // the cell ground (`scripts/lib/color.mjs`) for the alpha that reproduces the
  // shipped room L*, then rounded — 0.4191 -> 0.42:
  //
  //                             shipped inkVeil@0.25   this
  //   room L* on a cell                79.30          79.26   <- held
  //   spotlight dL*, cell ground       17.08          17.12   <- held
  //   ink / inkSoft on the room    9.86 / 3.63    9.85 / 3.63 <- held
  //   dE00 from `scrim` (page)          9.64          16.41   <- improved
  //   C*                                2.83          28.06   <- the whole point
  //   spotlight dL*, PAGE ground       17.75          16.98   <- the one that moves
  //
  // Reproduce: `node scripts/derive-spotlight-dim.mjs` — reads this file's own
  // source and composites with `scripts/lib/color.mjs`. Computed from source;
  // no pixels from any capture.
  //
  // The last row is the only figure that gives anything up, and it is the one
  // `shadows.glow` below and Sage's `check-spotlight-dim` both publish: -0.77
  // on the PAGE, against a floor of zero. It moves because the ruled pigment is
  // warm and the page is warm, so it has less to subtract there. The cell is the
  // ground this token is painted on, and on the cell it does not move at all.
  //
  // So this is a pure hue swap: nothing that was measured and accepted about the
  // old value moves, and the tap reads LESS like an open modal than before, not
  // more. `inkSoft` still misses 4.5:1 exactly as it did before — the standing
  // rule is unchanged and is NOT new here: no secondary text under this dim.
  // Graphic marks clear the 3:1 floor with the same headroom they had.
  //
  // Do not read the old "0.35 is DISQUALIFIED" ceiling as applying to 0.42. That
  // ceiling was `inkVeil`'s: it came from `inkVeil`@0.35 collapsing to dE00 3.42
  // against the scrimmed page. An alpha ceiling is a property of a PIGMENT's own
  // curve, not a number that transfers when the pigment changes.
  spotlightDim: withAlpha(mix(pigment.accentDeep, pigment.inkVeil, 0.25), 0.42),

  // POLLINATE_COMB_DIVE_SPEC.md R-CD-4 — the paper's honey-tint, "a warm
  // multiply that clears to paper-white as it rises." Derived from
  // `accentBurst` per the spec's own citation ("no new gold surface is
  // introduced… tokens from gradients.honey / colors.accentBurst"), the
  // legal way to write a translucent colour. Motion-only, opacity-animated
  // 1 -> 0 every time it appears, never held static — the X0 keepsake test
  // ("never a static fill") is satisfied by construction, not by convention.
  diveHoneyTint: withAlpha(pigment.accentBurst, 0.35),

  // --- Ink tiers ---
  // Placeholder text. DERIVED, not picked: 0.62 is the faintest alpha that still
  // clears 4.5:1 on BOTH grounds a text input actually sits on — 4.70:1 on
  // `backgroundWriting`, 4.63:1 on `background` (measured, scripts/lib/color.mjs).
  // It stays 1.29x fainter than `inkSoft`, so ink > inkSoft > inkFaint is a real
  // visible hierarchy and not three names for the same grey. Three call sites read
  // this token before it existed; all three resolved `undefined` to the iOS system
  // grey, which is the one colour in the app that belongs to no palette at all.
  inkFaint: withAlpha(pigment.ink, 0.62),
  // The progress-rail track. §23.11 ruled this exact pair — `ink` fill on an
  // `ink@0.5` track — because the 3:1 floor for `ink` on `background` is alpha
  // 0.4717. Re-measured there against every ground a rail landed on at the
  // time, including all four hive covers: track-vs-ground 3.19-3.29:1,
  // fill-vs-track 4.58-5.02:1.
  //
  // 0.50 -> 0.52 (Lumen, MVP1 screen pass). Wrapped's beat progress adopts
  // this pair, and Beat 0 fills the screen with `goldField` — a ground
  // §23.11 never had to serve, and the only one where 0.50 misses: 2.8653:1,
  // under the floor the token exists to hold. The alpha IS the floor's
  // solution, so it re-solves against the worst ground rather than the
  // original one: 3:1 on `goldField` needs 0.5185, and 0.52 is the first
  // 2-decimal value above it.
  //
  // Nothing regresses. Raising the alpha only darkens the track, so
  // track-vs-ground rises everywhere (3.38-3.49 on the covers, 3.0114 on
  // gold) and the pair's other floor, fill-vs-track, stays clear on every
  // ground (4.32-4.73 on the covers, 3.3229 on gold — the new thinnest
  // margin, and it is the ground that forced the change). At the two shipped
  // rails (PackageOpen, MemoryLane) the move is ΔE00 1.578-1.622 — measured
  // with scripts/lib/color.mjs, below the threshold at which either rail
  // reads as a different colour.
  trackDim: withAlpha(pigment.ink, 0.52),

  // --- Glass (all `surface`) ---
  // One material, four ruled thicknesses. `glassFill` shipped byte-identical at
  // five sites (every one a 40x40 back button) with zero drift; the rim shipped
  // at two values, 0.60 and 0.65, which measure ΔE00 0.36-0.82 apart over every
  // ground they appear on — below a just-noticeable difference, so collapsing
  // them to the glass primitive's own 0.65 moves nothing a person can see.
  glassFill: withAlpha(pigment.surface, 0.4),
  glassRim: withAlpha(pigment.surface, 0.65),
  glassVeil: withAlpha(pigment.surface, 0.85), // was `surface + 'D9'` (0.851)
  glassSheer: withAlpha(pigment.surface, 0.55), // was `surface + '8C'` (0.549)
  // GL2, ruled (`GUIDES/POLLINATE_GL2_VEIL_DERIVATION.md`): the NATIVE glass
  // rung takes its own alpha and the blur rung keeps 0.55. Two materials, two
  // values — this is a PAIR, not a token that moved. `GlassView` already
  // refracts what is behind it, so the veil above it only has to keep the
  // surface inside the Sunbeam palette; at 0.55 it would erase the refraction
  // that is the whole reason the rung exists.
  //
  // GL7(b′), 2026-08-30 — 0.35 -> 0.76, AND IT MOVES WITH `glassEffectStyle`.
  // This number is meaningless on its own: it is the veil that holds the
  // legibility floor under `clear`, and 0.35 was the veil that held it under
  // `regular`. Read them as one setting (`check-glass-definition.mjs` C1 makes
  // the pair a gate row, so neither can be retuned alone).
  //
  // WHY THE RUNG CHANGED. GL7(b) measured how MUCH of the ground the capsule
  // passes through and declined `clear` — at equal legibility it is worth 11%.
  // That measured the wrong property. Colin's word was "defined", which is an
  // EDGE property, and edge width is a separate axis the veil cannot reach:
  // 10-90 transition width is 6.085pt on `regular` and 3.172pt on `clear` at
  // the SAME floor, and it is flat in the veil on both rungs (the alpha moves
  // amplitude, never the kernel). Full derivation, three instruments and the
  // disconfirmed amplitude confound: `GUIDES/POLLINATE_GL7_MATERIAL_TRANSMISSION.md`
  // §3a-§3b.
  //
  // WHY 0.76 AND NOT THE 0.765 THE FIT SAID. Swept as real frames at 0.76 /
  // 0.78 / 0.80 and taken as the smallest MEASURED alpha clearing both GL2
  // bars — 3:1 for the inactive glyph at the darkest column, and no regression
  // against the rung being replaced. At 0.76 the glyph's ground measures
  // rgb(199, 199, 199) on the black bound, which is the shipped `regular`@0.35
  // ground to the byte, so the floor is 3.7311:1 either way. 0.78 clears with
  // margin but spends the amplitude gain (1.016x); 0.80 regresses amplitude
  // below shipped. 0.76 is the only swept rung that improves both axes.
  glassLens: withAlpha(pigment.surface, 0.76),
  // GL1 residual (a), ruled: the 1pt white rim reads WEAKER on glass than on
  // blur, because the glass body sits at 254-255 lum and white has no headroom
  // left to brighten into. Raising the rim's alpha is a dead end — the fix is a
  // hairline of ink UNDER the white, so the edge is defined by the dark line and
  // the white reads as the specular gleam on top of it.
  //
  // GL7(a), 2026-08-30 — 0.10 -> 0.18. The 10% was "the middle of the spec's
  // 8-12% interval, to be re-measured on a device"; it was never derived, and
  // its interval was guessed before anyone computed what the rim above it does
  // to it. `glassRim` is `surface`@0.65, so an ink hairline on a COINCIDENT
  // frame is attenuated to its transmission through that rim — a factor of
  // 1 - 0.65 = 0.35. At 0.10 the composite carries 0.035 of ink: the hairline
  // spends two-thirds of itself on the layer above it, and the white rim ALONE
  // is ΔE00 0.1287 from the body (an order of magnitude under JND), so the
  // hairline is not an enhancement here — it is the entire edge.
  //
  // 0.18 lands ΔE00 3.0125/2.9407 on the derivation's carriers, mid-band of the
  // blur rung's own measured rim (2.88/1.67/3.19), which is what keeps the two
  // rungs reading as one material. Re-measured for GL7(d) on all four hive
  // cover grounds — the covers the borrower circles sit on — and it holds
  // there too: 2.8658/2.8704/2.9902/2.9292, within 0.15 of the derivation's
  // figure, so this is one token and not a per-ground tuning.
  //
  // Derivation: GUIDES/POLLINATE_GL1_HAIRLINE_DERIVATION.md §3-§4. The
  // alternative (widen the hairline to 2pt so 1pt shows inboard at full
  // strength, ΔE00 4.99) was declined there: it doubles the chrome edge's
  // visual weight on the one rung the material is meant to be lightest on.
  // Move the quantity that is under-specified, not the one that was ruled.
  glassHairline: withAlpha(pigment.ink, 0.18),

  // --- Accent alphas ---
  // Marigold as an EDGE, not a fill — §4's "yellow never fills it" still holds.
  // Shipped as a hand-copied `rgba(255, 210, 0, 0.6)` under a comment claiming it
  // was the accent, which is precisely the failure this file's opening paragraph
  // warns about, complete with the predicted stale comment.
  accentEdge: withAlpha(pigment.accent, 0.6),
  accentDeepWash: withAlpha(pigment.accentDeep, 0.1), // was `accentDeep + '1A'` (0.102)
  // `honeyPool` (accentDeep @ 0.22) RETIRED 2026-08-28 by LP-R21 guardrail 3,
  // in the commit that removed Beat 6. The pool was its only job, and a wash
  // looking for a new home is how `washPeach` kept coming back (R50 class;
  // the `weekWash`/`monthWash` retirement note above states the rule). Do
  // not revive it for "translucent honey somewhere else" — the held fill is
  // opaque `accent`, ruled, and the pool it was named for does not exist.

  // --- Press feedback (C9) ---
  // Two tints, not one, because a press over a filled dark surface (`ink`)
  // and a press over a light one (`surface`/`glassFill`) have to move in
  // opposite directions — darkening something already near-black shows
  // nothing, and lightening white shows nothing either. `PressableScale`'s
  // `pressedColor` overlay fades in on press-in, fades out on press-out.
  pressedOnDark: withAlpha(pigment.surface, 0.12), // lifts a filled `ink` surface
  pressedOnLight: withAlpha(pigment.inkVeil, 0.06), // dims a `surface`/glass one
};

// Two-stop washes, corner to corner: lit corner to shaded corner, so a
// surface reads as catching light rather than sitting flat. Every stop is a
// token reference — no literal hex lives here.
const gradients = {
  // `weekWash` and `monthWash` retired in §17.5: they existed for Recap's two
  // always-on insight cards, and both cards are gone — the week card because
  // it spoiled the reveal below it, the month card because the theme is now
  // something you earn by tapping the month. Retired rather than relocated,
  // per the ruling; a wash looking for a new home is how the peach kept
  // coming back.
  // Icon roundels — the one place accent is allowed to fill a shape.
  badge: [colors.accent, colors.accentDeep],
  // HONEY — the material, not a colour. Three stops because a drip has three
  // zones and two stops cannot render the one that matters: `accentBurst` is
  // the lit crown where light passes through the thin edge, `accent` the body,
  // `accentDeep` the shaded underside where it is thickest. Zero new hex; this
  // is the app icon's own ruled drop gradient (§13.1) with its highlight, so the
  // drip is literally made of the same material as the icon on the home screen.
  //
  // NOT `goldField`. §29.1 reserves gold as the KEEPSAKE register — finished,
  // kept, singular. A drip is transient motion and fails all three tests, so
  // honey may never borrow the keepsake's pigment. `accentBurst`'s own token
  // comment already restricts it to motion, which is exactly what this is.
  honey: [colors.accentBurst, colors.accent, colors.accentDeep],
  // SHEEN — light falling across a material, as an overlay rather than a
  // recolour. Laid over any fill, corner to corner, it makes a flat swatch read
  // as a surface catching light. One sheen serves every hive cover and every
  // cover nobody has invented yet, which is the property worth having: nothing
  // here is tuned per-cover, so a fifth cover cannot arrive mis-lit.
  //
  // ZERO NEW HEX — two alphas of pigments already in the palette, which keeps
  // §1's "no new hex values introduced" intact for the covers.
  //
  // FOUR STOPS, not three, and the two middle ones are deliberately both fully
  // transparent: a single transparent midpoint would force the renderer to
  // interpolate from white straight to ink and put a faint grey band through
  // the middle of every card. Between two alpha-0 stops there is nothing to
  // see, whatever their RGB.
  //
  // THE LIT ALPHA IS A CEILING, NOT A TASTE. A white sheen lightens a cover
  // TOWARD the white card it sits on, so the lit corner — not the flat base —
  // is the worst case for the cover-legibility floor. Measured against
  // `surface`: at 0.20 the four covers sit at 12.91 / 8.78 / 5.76 / 5.87 ΔE00,
  // clearing a floor of 5 with the thinnest margin on `starlight`. At 0.35 the
  // minimum falls to 4.77 and two covers breach it. Anything raising this alpha
  // must re-run that measurement, and must run it on the composited lit corner.
  // The shaded stop is free in that direction: it only moves away from white.
  sheen: [
    withAlpha(pigment.surface, 0.2),
    withAlpha(pigment.surface, 0),
    withAlpha(pigment.inkVeil, 0),
    withAlpha(pigment.inkVeil, 0.06),
  ],
};

// ENTRY_EXPRESSION_BRIEF.md "VOICE LADDER RULING" (Lumen, 2026-08-26) — the
// three rungs `fonts.entryDisplay`/`type.entryDisplay` scales by, keyed on
// entry length. Lives beside `type.entryDisplay` below rather than inside
// it: this is a selector's data, not a type style, and `entryVoice(text)` in
// `PaperBlock.js` is the one place it is read. Length = code points of the
// trimmed text (`Array.from(t.trim()).length` — bytes over-count emoji);
// any entry with a paragraph break (two consecutive newlines) takes rung 3
// regardless of length, checked ahead of the char thresholds by the reader.
export const ENTRY_VOICE_RUNGS = [
  { max: 80, size: 28, lineHeight: 34 }, // rung 1 — monumental, one breath, letterpress
  { max: 220, size: 22, lineHeight: 30 }, // rung 2 — spoken, a said thing
  { max: Infinity, size: 18, lineHeight: 27 }, // rung 3 — prose, reading copy
];

export const theme = {
  colors,
  gradients,
  // Family names match the registered fonts loaded via useFonts() in
  // App.js (see src/constants/fontAssets.js) — Nunito for display/UI
  // headlines, Plus Jakarta Sans for reading copy, Dancing Script for the
  // wordmark. Inter stays registered only as a fallback; nothing references it.
  fonts: {
    logo: 'DancingScript-Bold',
    header: 'Nunito-Bold',
    headerExtraBold: 'Nunito-ExtraBold',
    body: 'PlusJakartaSans-Regular',
    bodyMedium: 'PlusJakartaSans-Medium',
    bodySemiBold: 'PlusJakartaSans-SemiBold',
    bodyItalic: 'PlusJakartaSans-Italic',
    // Entry rendering ONLY (ENTRY_EXPRESSION_BRIEF.md ratification #5) —
    // never headers/UI. Nunito keeps the app, Dancing Script keeps the
    // wordmark. Weight/cut is Deezine's to confirm; Regular is the one
    // face/one weight shipped here pending that pass.
    entryDisplay: 'PlayfairDisplay-Regular',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    small: 14,
    medium: 24,
    large: 32, // Squircle/Bento style
    full: 999,
  },
  // Named type styles so every screen pulls from the same scale instead of
  // picking one-off fontSize/lineHeight pairs. Spread directly into a
  // StyleSheet entry, e.g. `title: { ...theme.type.h1, color: ... }`.
  type: {
    hero: { fontFamily: 'Nunito-ExtraBold', fontSize: 72, lineHeight: 76, letterSpacing: -1.5 },
    display: { fontFamily: 'Nunito-ExtraBold', fontSize: 44, lineHeight: 48, letterSpacing: -1 },
    h1: { fontFamily: 'Nunito-ExtraBold', fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
    h2: { fontFamily: 'Nunito-Bold', fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
    h3: { fontFamily: 'Nunito-Bold', fontSize: 18, lineHeight: 24 },
    bodyLg: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 18, lineHeight: 27 },
    body: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 16, lineHeight: 24 },
    bodySm: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, lineHeight: 20 },
    label: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 12, lineHeight: 16, letterSpacing: 2, textTransform: 'uppercase' },
    button: { fontFamily: 'Nunito-Bold', fontSize: 17, lineHeight: 22, letterSpacing: 0 },
    logo: { fontFamily: 'DancingScript-Bold', fontSize: 44 },
    // Entry rendering ONLY — see `fonts.entryDisplay`. Voice's length-scaling
    // ("a short entry renders monumental") is a separate, unspecified build
    // lane (no thresholds pinned anywhere yet); this token is minted per the
    // Tokens step of ENTRY_EXPRESSION_BRIEF.md's hardened spec but has no
    // call site in this PR. Size matches `display` pending Deezine's weight/
    // cut confirmation.
    entryDisplay: { fontFamily: 'PlayfairDisplay-Regular', fontSize: 28, lineHeight: 34 },
  },
  // Two weights of elevation: `card` for content at rest, `floating` for
  // anything that should feel pressable/afloat (primary buttons, tab bar,
  // the unlock badge). Ambient shadows key off the warm near-black so they
  // read as soft depth rather than a grey drop-shadow on a cream backdrop.
  shadows: {
    card: {
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    floating: {
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.16,
      shadowRadius: 28,
      elevation: 10,
    },
    // Colored glow for accent-tinted elements (CTA buttons, unlock badge) —
    // pass the element's own background color so the shadow reads as a
    // glow of that color rather than a generic dark drop-shadow.
    //
    // TINTED FALLS, GLOW RADIATES. This helper carries a 10pt downward offset,
    // which makes it a drop shadow wearing a colour — correct for a button that
    // sits above the page, wrong for anything emitting light. That offset is the
    // whole reason nothing in this app glows despite a tinted-shadow helper
    // sitting right here. For light, use `glow()` below.
    tinted: (color) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    }),
    // LIGHT DOES NOT FALL. Zero offset, always — a glow with an offset is a
    // shadow, and the eye reads the difference instantly even when it cannot
    // name it. Three levels, and they are a register rather than a scale: `rest`
    // is a thing that is warm, `bloom` is a thing responding to you, `peak` is
    // the one frame something is fully alight. Nothing should sit at `peak`.
    //
    // An unknown level throws rather than defaulting: a typo silently rendering
    // at `bloom` is a design decision made by a spelling mistake.
    //
    // THE GROUND IS PART OF THE EQUATION, and these three numbers do not carry
    // it. On this app's cream (`background` #FFF7CC) EVERY yellow at EVERY
    // level makes the ground DARKER, not lighter — L* delta of ground vs
    // ground-plus-glow, at `bloom`: `accentBurst` -2.26, `accent` -4.38,
    // `accentDeep` -12.00. A glow that darkens its ground is a stain. You
    // cannot make a light ground brighter; the page is already near white, so
    // there is no luminance left to travel into.
    //
    // So the ruling is about DIRECTION, not magnitude, and a colour-difference
    // number cannot see direction — ΔE00 is a distance, and "further away" on
    // cream means "further into shadow." Ranking glow colours by ΔE00 picks the
    // one that stains hardest. It is the wrong instrument for this question and
    // the right one is L*.
    //
    // TWO CONSEQUENCES:
    //   1. THE DIM IS NOT AN ENHANCEMENT, IT IS A PRECONDITION. Without a
    //      dimmed surround there is no glow on this page at all — only a warm
    //      bruise. Light needs somewhere dark to travel.
    //   2. ONCE THE SURROUND IS DIMMED, THE HOTTEST STOP WINS. The spotlight
    //      test — lit cell L* minus room L*, `bloom`, room dimmed by
    //      `inkVeil`, on the PAGE. This table settled DIRECTION (which pigment
    //      glows), and that ruling stands. It is NOT the current dim: R6 moved
    //      `colors.spotlightDim` off `inkVeil` and onto a derived pigment,
    //      because this table's ground is the page and the dim is painted on
    //      the CELLS. Read the alpha column as inkVeil's, not as the token's.
    //
    //        dim    accentBurst      accentDeep
    //        0.00      -2.26            -12.00     no spotlight either way
    //        0.15      +9.63             -0.11     accentDeep still invisible
    //        0.25     +17.75             +8.01     <- the dim this was ruled at
    //
    //      Live equivalent under R6, same page ground: +16.98. On the cell
    //      ground the token is actually painted on: +17.12. See
    //      `colors.spotlightDim` above for the full derivation.
    //
    //      `accentBurst` is the honey glow. `accentDeep` stays the bead's
    //      shaded underside in `gradients.honey`, where it sits on the white
    //      cell as material and not as light.
    //
    // DO NOT COMPENSATE BY RAISING THE ALPHA. These levels are a register
    // shared with dark surfaces; a `peak` cranked until it reads on cream
    // blows out on the Wrapped slides and the seal. Dim the room instead.
    glow: (color, level = 'bloom') => {
      const levels = {
        rest: { shadowOpacity: 0.18, shadowRadius: 12, elevation: 4 },
        bloom: { shadowOpacity: 0.35, shadowRadius: 24, elevation: 8 },
        peak: { shadowOpacity: 0.55, shadowRadius: 40, elevation: 14 },
      };
      const l = levels[level];
      if (!l) throw new Error(`shadows.glow(): unknown level '${level}' — expected rest | bloom | peak`);
      return { shadowColor: color, shadowOffset: { width: 0, height: 0 }, ...l };
    },
    // Glass floats because it's translucent, not because it casts a slab
    // shadow — lighter than `floating`, reserved for blurred surfaces
    // (spec §10).
    glass: {
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 6,
    },
  },
};
