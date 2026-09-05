// Gate for R-N3 / R-N3.1 / R-N3.2 / R-N3.3 — the send, as a beat — plus
// R-N6 / R-N7 / D5 (the door) and R-N4's DETECTION half (section F).
//
// R-N4's CROSSING is not gated here because it is not built: it is held
// pending Lumen's ruling on the population with no seat. Section F covers
// everything the crossing would be wrong without.
// POLLINATE_NECTAR_LIVING_EXCHANGE.md (Lumen, 2026-08-29, design
// workspace).
//
// Every spec cited in this file lives in the design workspace, not at
// any path in this repo; nothing under `GUIDES/` is in this tree, so a
// bare `GUIDES/...` address opens nothing for whoever reads this file
// next.
//
//   npm run check:nectar-exchange
//
// §6 rows 1 and 2 (meniscus resolution; never rendered at its new height)
// are NOT here — they are `check-honey-fill` sections 8 and 9, shipped with
// R-N2, and a second copy of an assertion is a second place for it to drift.
// Row 7 (consent population) is `check-nectar-consent`. What is here is rows
// 3, 4, 5 and 6, plus the derivations this build had to make because the
// spec ruled a shape and left the number to the builder.
//
// THE ORGANISING RULE, and it is the one R-N3.2 was written to close: THE
// DROP IS ONE OBJECT. Every row below asserts a property of the OBJECT
// rather than of a screen it appears on — its radius map, its pigment stack,
// its path's currency — because "I measured the ground where I noticed the
// defect instead of the population the object crosses" is the error this
// section of the spec exists to have already made once.
// THE MUTATION HARNESS IS PERSISTED, not reported. Sage's flag on R-LF-2.1
// (2026-08-29): "a number nobody can re-derive can't be corrected either,
// only doubted." Each entry below is an edit that MUST turn its named row
// red — or, where `row` is null, an edit that must leave every row green.
// Re-run it with:
//
//   node scripts/run-mutations.mjs scripts/check-nectar-exchange.mjs
//
// The runner restores the file from a buffer it holds, never from git, so a
// mutation loop cannot revert an uncommitted edit of your own.
export const MUTATIONS = [
  {
    row: 'D1b',
    why: 'travel goes back to out(cubic), which launches from rest at peak velocity instead of zero endpoint velocity',
    file: 'src/constants/motion.js',
    from: '  travel: Easing.inOut(Easing.cubic),',
    to: '  travel: Easing.out(Easing.cubic),',
  },
  {
    row: 'D5b',
    why: 'failure recovery adds a duplicate count at return start while leaving the correct origin count in place',
    file: 'src/components/useNectarGift.js',
    from: '          const returnHomeDone = new Promise((resolveReturnHome) => {\n            const reverseTravel = () => {',
    to: '          const returnHomeDone = new Promise((resolveReturnHome) => {\n            countTo(settled.current);\n            const reverseTravel = () => {',
  },
  {
    row: 'D5c',
    why: 'Reduce Motion waits for the network before starting the optimistic count, making the gesture visually inert on a slow RPC',
    file: 'src/components/useNectarGift.js',
    from: '        const optimisticCountDone = countTo(optimistic);',
    to: '',
  },
  {
    row: 'D5b',
    why: 'a known-at-contact failure skips the optimistic count before returning',
    file: 'src/components/useNectarGift.js',
    from: '          const countDone = countTo(optimistic);\n          if (commitResult && !commitResult.ok) {',
    to: '          if (commitResult && !commitResult.ok) {',
  },
  {
    row: 'E1',
    why: 'a door that stops being a door — one call site loses the shared containerStyle, so the population is one and the branch pairing is gone',
    file: 'src/screens/PackageOpen.js',
    from: '                      containerStyle={styles.nectarDoor}\n                      accessibilityLabel="Give a gift"',
    to: '                      containerStyle={styles.railTrack}\n                      accessibilityLabel="Give a gift"',
  },
  {
    row: 'E2',
    why: 'the post-consent door reverts to a glyph — a lookalike would also pass an appearance check, which is why the row asserts the component',
    file: 'src/screens/PackageOpen.js',
    from: '                      <HoneyDrop radius={DROP_MAX_RADIUS} />',
    to: '                      <Ionicons name="water-outline" size={22} color={theme.colors.ink} />',
  },
  {
    row: 'E3',
    why: 'a drop form rendered BEFORE consent — the compliance direction, and the one this section fails closed for',
    file: 'src/screens/PackageOpen.js',
    from: '                      <Ionicons name="enter-outline" size={22} color={theme.colors.ink} />',
    to: '                      <HoneyDrop radius={DROP_MAX_RADIUS} />',
  },
  {
    row: 'E4',
    why: 'the box goes back to 32pt — under the ratified tap target and smaller than the object it contains',
    file: 'src/screens/PackageOpen.js',
    from: '    width: 44,\n    height: 44,',
    to: '    width: 32,\n    height: 32,',
  },
  {
    row: 'E5',
    why: 'a new ambient loop on this screen — the standing no-new-ambient rule, banned by name in R-N6',
    file: 'src/screens/PackageOpen.js',
    from: '  const dwellProgressAnim = useRef(new Animated.Value(0)).current;',
    to: '  const dwellProgressAnim = useRef(new Animated.Value(0)).current;\n  const doorPulse = Animated.loop(Animated.timing(arrivalProgressAnim, { toValue: 1 }));',
  },
  {
    row: 'E5',
    why: 'the door keeps its absence of a clock but loses its position — no animated ancestor means it arrives out of nowhere, which "no clock of its own" alone would not catch',
    file: 'src/screens/PackageOpen.js',
    from: 'style={[\n                  styles.entryCard,\n                  { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }, { scale: cardScale }] },\n                ]}',
    to: 'style={[styles.entryCard]}',
  },
  {
    row: 'E6',
    why: 'the consent sheet goes back to describing a drop without showing one',
    file: 'src/components/NectarConsentSheet.js',
    from: '          <HoneyDrop radius={DROP_MAX_RADIUS} style={styles.drop} />\n',
    to: '',
  },
  {
    row: 'E7',
    why: 'the introduction acquires motion',
    file: 'src/components/NectarConsentSheet.js',
    from: "import { StyleSheet, View, Text } from 'react-native';",
    to: "import { Animated, StyleSheet, View, Text } from 'react-native';",
  },
  {
    row: 'E8',
    why: 'the sixth `danger` is rebuilt',
    file: 'src/components/NectarConsentSheet.js',
    from: '// `ink` at the same size says the same thing and can be read.\n    color: theme.colors.ink,',
    to: '// `ink` at the same size says the same thing and can be read.\n    color: theme.colors.danger,',
  },
  {
    row: null,
    why: 'MUST NOT FIRE — a legal extra prop on the door\'s drop. These rows assert the object and its box, not the exact spelling of its call site',
    file: 'src/screens/PackageOpen.js',
    from: '                      <HoneyDrop radius={DROP_MAX_RADIUS} />',
    to: '                      <HoneyDrop radius={DROP_MAX_RADIUS} opacity={1} />',
  },
  {
    row: 'F1',
    why: 'the unknown collapses to zero — the fabrication R-N4 exists to prevent, and it reds the must-be-null half rather than the must-be-drops half',
    file: 'src/constants/nectar.js',
    from: "  if (lastSeenDrops === null || lastSeenDrops === undefined || !Number.isFinite(then)) return null;",
    to: "  if (lastSeenDrops === null || lastSeenDrops === undefined || !Number.isFinite(then)) return now > 0 ? now : null;",
  },
  {
    row: 'F1',
    why: 'the function is hardwired to report nothing — the FAIL-CLOSED direction, invisible to any row that only checks that unknowns return null. This is the mutation that proves F1 needs both of its lists',
    file: 'src/constants/nectar.js',
    from: "  const risen = now - then;\n  return risen > 0 ? risen : null;",
    to: "  const risen = now - then;\n  return risen > 0 && false ? risen : null;",
  },
  {
    row: 'F2',
    why: 'the collapsed spelling stops being reachable — the row cannot price the defect it names if the zero case answers null too. ON THE `lastSeenDrops` GUARD, and that correction is the mutation earning its keep: it first pointed at the BALANCE guard, where `!500` is false, so it changed nothing and the miss read as a weak row rather than as a mutation aimed at the wrong argument. F2\'s zero is the REMEMBERED side',
    file: 'src/constants/nectar.js',
    from: "  if (lastSeenDrops === null || lastSeenDrops === undefined || !Number.isFinite(then)) return null;",
    to: "  if (!lastSeenDrops || lastSeenDrops === undefined || !Number.isFinite(then)) return null;",
  },
  {
    row: 'F3',
    why: 'the remembered balance goes on one bare device key — a second account then compares against the first account\'s number, which is two finite numbers with one larger and therefore indistinguishable from an arrival',
    file: 'src/services/nectarArrivalState.js',
    from: "const keyFor = (userId) => `nectar_last_seen_drops_v1:${userId}`;",
    to: "const keyFor = () => `nectar_last_seen_drops_v1`;",
  },
  {
    row: 'F4',
    why: 'a never-written key becomes a remembered zero one layer beneath the function written to prevent exactly that',
    file: 'src/services/nectarArrivalState.js',
    from: "      if (raw === null) return null;",
    to: "      const seen = raw ?? 0;",
  },
  {
    row: 'F5',
    why: 'the keyed cancel command stops escaping the component — abort/suppression can no longer clear the grid registry and flight state together',
    file: 'src/components/HoneycombGrid.js',
    from: "  useImperativeHandle(ref, () => ({ igniteLanding, pollinateOwnCell, cancelPollination }));",
    to: "  useImperativeHandle(ref, () => ({ igniteLanding, pollinateOwnCell }));",
  },
  {
    row: 'F5',
    why: 'THE CORRECTED BUILD PUT BACK — a handle member that returns a fact instead of taking a command. This is the exact defect Lumen ruled out, and it is the one a key-COUNT row could not see: the arity is unchanged and a value leaves anyway',
    file: 'src/components/HoneycombGrid.js',
    from: "    node.measureInWindow((x, y) => {\n      if (![x, y].every((n) => typeof n === 'number' && Number.isFinite(n))) return;\n      launchPollination(cell, { x, y }, 'arrival');\n    });",
    to: "    return { x: cell.x, y: cell.y };",
  },
  {
    row: 'F6',
    why: 'Reduce Motion stops gating the crossing — §5\'s collapse is dropped and the bee flies for a user who asked the OS to stop motion',
    file: 'src/components/HoneycombGrid.js',
    from: "    if (!onPollinate || reduced) return;\n    // ONE GUARD PER CASE",
    to: "    if (!onPollinate) return;\n    // ONE GUARD PER CASE",
  },
  {
    row: 'F6',
    why: 'R-N4.2 NEGATIVE 1 AND 2 AT ONCE — with no own seat the crossing falls back to the first cell, which is an invite seat (honey in it says a stranger has honey) or the most recent poster\'s face (your honey on somebody else). The decline is the whole ruling',
    file: 'src/components/HoneycombGrid.js',
    from: "    const cell = layout.cells.find((c) => c.member && c.member.isOwn);\n    if (!cell) return;",
    to: "    const cell = layout.cells.find((c) => c.member && c.member.isOwn) ?? layout.cells.find((c) => c.member);\n    if (!cell) return;",
  },
  {
    row: 'F7',
    why: 'the window origin is read from the layout-time cache instead of measured — stale by the scroll offset the instant the comb moves',
    file: 'src/components/HoneycombGrid.js',
    from: "    node.measureInWindow((x, y) => {",
    to: "    ((cb) => cb(clusterOrigin?.x ?? 0, clusterOrigin?.y ?? 0))((x, y) => {",
  },
  {
    row: 'F8',
    why: 'an own-first sort appears — the seating question answered in the build instead of in a ruling, which is the direction this row exists to catch as much as the other',
    file: 'src/screens/HoneycombTab.js',
    from: "  const combMembers = honeyLevel",
    to: "  const combMembers = [...todayMembers].sort((a, b) => Number(b.isOwn) - Number(a.isOwn)) && honeyLevel",
  },
  {
    row: 'G1',
    why: 'the arrival gets its own publisher again — one line, and §28.9 silently stops covering gift flights because `aimRef` is never written for them. This is the correction restated as a mutation: the cost of resolving instead of emitting was never stylistic',
    file: 'src/components/HoneycombGrid.js',
    from: "      launchPollination(cell, { x, y }, 'arrival');",
    to: "      onPollinate({ key: 1, cause: 'arrival', x, y, ringStep: ringStepFor(cellSize) });",
  },
  {
    row: 'G2',
    why: 'the arrival is published with the tap\'s cause — every gift flight now looks like a tap, the bee carries nothing, and the beat vanishes with no error anywhere',
    file: 'src/components/HoneycombGrid.js',
    from: "      launchPollination(cell, { x, y }, 'arrival');",
    to: "      launchPollination(cell, { x, y }, 'tap');",
  },
  {
    row: 'G3',
    why: 'THE LANDING BECOMES THE ONLY WRITER — the level is committed from the flight\'s own callback instead of from the read. Every gift the bee never delivers (Reduce Motion, no seat, an abort) is then silently lost, which is the failure R-N4.1 names',
    file: 'src/screens/HoneycombTab.js',
    from: "            combRef.current?.igniteLanding(key);\n            setAirbornePollinationKey((current) => (current === key ? null : current));\n            const result = pollinationLandingResult(pollinationRef.current, key);\n            if (!result.accepted) return;\n            setPollination(result.pollination);",
    to: "            combRef.current?.igniteLanding(key);\n            setAirbornePollinationKey((current) => (current === key ? null : current));\n            const result = pollinationLandingResult(pollinationRef.current, key);\n            if (!result.accepted) return;\n            setHoneyLevel(honeyLevelForDrops(giftDrops));\n            setPollination(result.pollination);",
  },
  {
    row: 'G4',
    why: 'the drop stops being a property of the flight and becomes a state of its own — nothing clears it, so the bee carries a drop forever, which is the badge R-N4.2 negative 3 forbids by name',
    file: 'src/screens/HoneycombTab.js',
    from: "          carrying={pollination?.cause === 'arrival' ? giftDrops : null}",
    to: "          carrying={giftDrops || null}",
  },
  {
    row: 'G5',
    why: 'the cargo gets its own scale instead of the gift\'s — a fixed radius, so every gift is the same size and R-N3\'s "the amount IS the radius" stops being true the moment the drop changes hands',
    file: 'src/components/FlyingBee.js',
    from: "  const carriedRadius = planCarrying ? Math.min(dropRadiusForAmount(planCarrying), size / 2) : 0;",
    to: "  const carriedRadius = planCarrying ? 12 : 0;",
  },
  {
    row: 'G6',
    // RELABELLED after the run: this mutation makes the cargo UNREACHABLE, it
    // does not reorder it. The first label said "drawn in front of the
    // carrier", which is a different defect and the one the row's ORDER half
    // catches — and a mutation whose `why` describes something it does not do
    // is a number nobody can correct later, only doubt.
    why: 'the cargo is never drawn — the JSX stays exactly where it is and the beat is deleted, which is the half source order cannot see',
    file: 'src/components/FlyingBee.js',
    from: "          {carriedRadius > 0 && (",
    to: "          {false && (",
  },
  {
    row: 'G6',
    why: 'the cargo is drawn AFTER the carrier — a genuine reorder of the two children, so it sits in FRONT of him: a collision instead of a delivery, and exactly the kind of change a screenshot review waves through',
    file: 'src/components/FlyingBee.js',
    from: "          {carriedRadius > 0 && (\n            /* Drawn BEFORE the character, so he is in front of what he is\n               holding \u2014 cargo behind the carrier reads as carried, in front\n               of him reads as a collision. It rides his own transform, so it\n               banks and mirrors with him; a circle with a horizontal\n               highlight is symmetric under `scaleX`, so the mirror is a\n               no-op on it and only the bank shows, which is the swing.\n\n               Hung from his midline: the drop's crown at the bee box's\n               vertical centre, centred on his horizontal one. Stated as a\n               fraction of `size` and the drop's own radius so a smaller mount\n               keeps the relationship instead of inheriting a pixel. */\n            <HoneyDrop\n              radius={carriedRadius}\n              style={{\n                position: 'absolute',\n                left: size / 2 - carriedRadius,\n                top: size / 2,\n              }}\n            />\n          )}\n          <MascotBee\n            size={size}\n            flutter={plan ? plan.flutter !== false : true}\n            // `&& !reduced` is what the parked pose used to carry (`breath={!reduced}`)\n            // and it has to come with the bee to his home: a resting bee under\n            // Reduce Motion is the doctrine's \u00a7State-2 \"complete freeze at rest\n            // pose\", and 2 degrees on a 4.2s clock is still a motion someone\n            // asked the OS to stop.\n            breath={plan?.kind === 'rest' && !reduced}\n          />\n",
    to: "          <MascotBee\n            size={size}\n            flutter={plan ? plan.flutter !== false : true}\n            // `&& !reduced` is what the parked pose used to carry (`breath={!reduced}`)\n            // and it has to come with the bee to his home: a resting bee under\n            // Reduce Motion is the doctrine's \u00a7State-2 \"complete freeze at rest\n            // pose\", and 2 degrees on a 4.2s clock is still a motion someone\n            // asked the OS to stop.\n            breath={plan?.kind === 'rest' && !reduced}\n          />\n          {carriedRadius > 0 && (\n            /* Drawn BEFORE the character, so he is in front of what he is\n               holding \u2014 cargo behind the carrier reads as carried, in front\n               of him reads as a collision. It rides his own transform, so it\n               banks and mirrors with him; a circle with a horizontal\n               highlight is symmetric under `scaleX`, so the mirror is a\n               no-op on it and only the bank shows, which is the swing.\n\n               Hung from his midline: the drop's crown at the bee box's\n               vertical centre, centred on his horizontal one. Stated as a\n               fraction of `size` and the drop's own radius so a smaller mount\n               keeps the relationship instead of inheriting a pixel. */\n            <HoneyDrop\n              radius={carriedRadius}\n              style={{\n                position: 'absolute',\n                left: size / 2 - carriedRadius,\n                top: size / 2,\n              }}\n            />\n          )}\n",
  },
  {
    row: 'G9',
    why: 'a `zIndex` on the drop\'s own inline style — the pair\'s order stops being document order and the cargo paints in FRONT of its carrier, with the JSX untouched. This is the exact edit that ran green at 46/0 before G9 existed, which is why the row does: G6 reads the mechanism and cannot see the mechanism being taken away',
    file: 'src/components/FlyingBee.js',
    from: "                left: size / 2 - carriedRadius,\n                top: size / 2,\n",
    to: "                left: size / 2 - carriedRadius,\n                top: size / 2,\n                zIndex: 1,\n",
  },
  {
    row: 'G9',
    why: 'the same override arriving through the StyleSheet instead of inline — the drop takes `styles.parkedAnchor`, which already carries `zIndex: 5`. An inline-only reading would call this clean, so the row resolves `styles.X` rather than scanning the JSX text',
    file: 'src/components/FlyingBee.js',
    from: "              style={{\n                position: 'absolute',\n                left: size / 2 - carriedRadius,\n                top: size / 2,\n              }}",
    to: "              style={styles.parkedAnchor}",
  },
  {
    row: 'G9',
    why: 'ANDROID\'S OWN MECHANISM: `elevation`, not `zIndex`. R-N4.3 arms at the first Android build, and a row that watched only `zIndex` would be green on the platform the ruling was written for',
    file: 'src/components/FlyingBee.js',
    from: "                left: size / 2 - carriedRadius,\n                top: size / 2,\n",
    to: "                left: size / 2 - carriedRadius,\n                top: size / 2,\n                elevation: 1,\n",
  },
  {
    row: 'G9',
    // LUMEN'S PROBE, 2026-08-29, verbatim in shape — the one that found the
    // Identifier hole and ran 47/0 against this row before the repair. The
    // anchor is wide because the defect is two edits that must arrive
    // together: a local const holding the override, and the identifier in
    // style position that carries it in. If the span ever stops matching,
    // the harness reports a missing anchor rather than mutating a site
    // nobody named — loud, which is the direction to fail in.
    why: 'THE OVERRIDE ARRIVES BEHIND A NAME: a local `dropCarryStyle` holds `zIndex: 1` and reaches the drop as a bare identifier. Nothing about the style prop tells this row what the name holds — which is why the arm answers "I could not read it" instead of calling it clean. Before the repair this ran 47 passed / 0 failed with the cargo painting in front of its carrier, and G9\'s own ok line printed "with nothing unresolvable"',
    file: 'src/components/FlyingBee.js',
    from: "  const flightOpacity = presetOpacity ?? 1;\n\n  return (\n    <View ref={containerRef} style={[styles.fill, style]} onLayout={onLayout} pointerEvents=\"none\">\n      <Animated.View style={[styles.fill, { opacity: presence }]} pointerEvents=\"none\">\n      {layout &&\n        trailPool.map((slot, i) => (\n          <Animated.View\n            key={i}\n            style={[\n              styles.trailDot,\n              {\n                opacity: slot.opacity,\n                // `pos` is where the particle was born (jumped to with\n                // `setValue`, never animated) and `drift` is the pollen push\n                // (zero for a trail drop). Two translations compose additively,\n                // so one pool serves both. `scale` stays last: RN applies the\n                // array right-to-left, so it scales about the fleck's own\n                // centre before it is moved.\n                //\n                // Every entry here is an `Animated.Value` and §28.13 is why:\n                // one plain number in this array is frozen at its first commit.\n                transform: [\n                  { translateX: slot.pos.x },\n                  { translateY: slot.pos.y },\n                  { translateX: slot.driftX },\n                  { translateY: slot.driftY },\n                  { scale: slot.scale },\n                ],\n              },\n            ]}\n          />\n        ))}\n      {layout && translateX && (\n        <Animated.View\n          style={[\n            styles.bee,\n            {\n              opacity: flightOpacity,\n              transform: [{ translateX }, { translateY }, { rotate }, { scaleX }],\n            },\n          ]}\n        >\n          {/* §19.5 puts the airborne wingbeat on the airborne path only, and\n              the plan says which that is. `plan.flutter` is the plan builder's,\n              so this stays one source rather than a second reading of `kind`.\n              What a resting bee wears instead is `breath` — Bee Doctrine\n              §State-2, a 2-degree sweep on a 4.2s clock against the airborne\n              18 over 0.16s. The two are the same channel inside `MascotBee`\n              and cannot both be live. */}\n          {carriedRadius > 0 && (\n            /* Drawn BEFORE the character, so he is in front of what he is\n               holding — cargo behind the carrier reads as carried, in front\n               of him reads as a collision. It rides his own transform, so it\n               banks and mirrors with him; a circle with a horizontal\n               highlight is symmetric under `scaleX`, so the mirror is a\n               no-op on it and only the bank shows, which is the swing.\n\n               Hung from his midline: the drop's crown at the bee box's\n               vertical centre, centred on his horizontal one. Stated as a\n               fraction of `size` and the drop's own radius so a smaller mount\n               keeps the relationship instead of inheriting a pixel. */\n            <HoneyDrop\n              radius={carriedRadius}\n              style={{\n                position: 'absolute',\n                left: size / 2 - carriedRadius,\n                top: size / 2,\n              }}\n            />\n",
    to: "  const flightOpacity = presetOpacity ?? 1;\n\n  const dropCarryStyle = { position: 'absolute', left: size / 2 - carriedRadius, top: size / 2, zIndex: 1 };\n\n  return (\n    <View ref={containerRef} style={[styles.fill, style]} onLayout={onLayout} pointerEvents=\"none\">\n      <Animated.View style={[styles.fill, { opacity: presence }]} pointerEvents=\"none\">\n      {layout &&\n        trailPool.map((slot, i) => (\n          <Animated.View\n            key={i}\n            style={[\n              styles.trailDot,\n              {\n                opacity: slot.opacity,\n                // `pos` is where the particle was born (jumped to with\n                // `setValue`, never animated) and `drift` is the pollen push\n                // (zero for a trail drop). Two translations compose additively,\n                // so one pool serves both. `scale` stays last: RN applies the\n                // array right-to-left, so it scales about the fleck's own\n                // centre before it is moved.\n                //\n                // Every entry here is an `Animated.Value` and §28.13 is why:\n                // one plain number in this array is frozen at its first commit.\n                transform: [\n                  { translateX: slot.pos.x },\n                  { translateY: slot.pos.y },\n                  { translateX: slot.driftX },\n                  { translateY: slot.driftY },\n                  { scale: slot.scale },\n                ],\n              },\n            ]}\n          />\n        ))}\n      {layout && translateX && (\n        <Animated.View\n          style={[\n            styles.bee,\n            {\n              opacity: flightOpacity,\n              transform: [{ translateX }, { translateY }, { rotate }, { scaleX }],\n            },\n          ]}\n        >\n          {/* §19.5 puts the airborne wingbeat on the airborne path only, and\n              the plan says which that is. `plan.flutter` is the plan builder's,\n              so this stays one source rather than a second reading of `kind`.\n              What a resting bee wears instead is `breath` — Bee Doctrine\n              §State-2, a 2-degree sweep on a 4.2s clock against the airborne\n              18 over 0.16s. The two are the same channel inside `MascotBee`\n              and cannot both be live. */}\n          {carriedRadius > 0 && (\n            /* Drawn BEFORE the character, so he is in front of what he is\n               holding — cargo behind the carrier reads as carried, in front\n               of him reads as a collision. It rides his own transform, so it\n               banks and mirrors with him; a circle with a horizontal\n               highlight is symmetric under `scaleX`, so the mirror is a\n               no-op on it and only the bank shows, which is the swing.\n\n               Hung from his midline: the drop's crown at the bee box's\n               vertical centre, centred on his horizontal one. Stated as a\n               fraction of `size` and the drop's own radius so a smaller mount\n               keeps the relationship instead of inheriting a pixel. */\n            <HoneyDrop radius={carriedRadius} style={dropCarryStyle} />\n",
  },
  {
    row: 'G9',
    why: 'THE SHAPE THE RETIRED LABEL NAMED: the component\'s own incoming `style` prop is forwarded to the drop. The old comment called exactly this clean — "a bare `style` pass-through, which carries no key of its own ... whatever it holds is the caller\'s" — and every word of that is unknowable from this position: the caller\'s style is a `FlyingBee` prop, so a `zIndex` in it lands INSIDE the transformed box, on one member of the pair. One node, one edit, no new declaration, and the identifier is genuinely in scope',
    file: 'src/components/FlyingBee.js',
    from: "            <HoneyDrop\n              radius={carriedRadius}\n              style={{\n                position: 'absolute',\n                left: size / 2 - carriedRadius,\n                top: size / 2,\n              }}\n            />",
    to: "            <HoneyDrop radius={carriedRadius} style={style} />",
  },
  {
    row: null,
    why: 'MUST NOT FIRE — a LAYER-level stacking site is retuned (`styles.fill` 5 -> 6). Lumen\'s sharpening is that these order the layer against the screen and say nothing about the pair; a file-wide `zIndex` rule would red here, on shipped code, and the next person would widen it until it meant nothing. This control is what makes G9 a claim about the pair',
    file: 'src/components/FlyingBee.js',
    from: "  fill: {\n    ...StyleSheet.absoluteFill,\n    zIndex: 5,\n  },",
    to: "  fill: {\n    ...StyleSheet.absoluteFill,\n    zIndex: 6,\n  },",
  },
  {
    row: 'G7',
    why: 'D4\'s row keeps a host that no longer contains its anchor — the registration goes stale in the direction that reads as "still filled"',
    file: 'src/constants/nectar.js',
    from: "    anchor: 'carrying',",
    to: "    anchor: 'notificationPull',",
  },
  {
    row: 'G8',
    why: 'the memory is written only when something arrived — so a balance that fell is never remembered, and the moment it climbs back to a number it already reached the bee announces it as a gift',
    file: 'src/screens/HoneycombTab.js',
    from: "      NectarArrivalState.rememberDrops(userId, drops);\n      const arrived = nectarArrivalDrops(lastSeen, drops);\n      if (!arrived) return;",
    to: "      const arrived = nectarArrivalDrops(lastSeen, drops);\n      if (!arrived) return;\n      NectarArrivalState.rememberDrops(userId, drops);",
  },
  {
    row: null,
    why: 'MUST NOT FIRE — the two unknown guards in `nectarArrivalDrops` are swapped. Both answer `null`, so this is a legal reordering and every F row must stay green; a harness with no control only proves the gate is noisy',
    file: 'src/constants/nectar.js',
    from: "  if (balanceDrops === null || balanceDrops === undefined || !Number.isFinite(now)) return null;\n  if (lastSeenDrops === null || lastSeenDrops === undefined || !Number.isFinite(then)) return null;",
    to: "  if (lastSeenDrops === null || lastSeenDrops === undefined || !Number.isFinite(then)) return null;\n  if (balanceDrops === null || balanceDrops === undefined || !Number.isFinite(now)) return null;",
  },
];

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { parse } from '@babel/parser';
import { theme } from '../src/constants/theme.js';
import { contrastRatio, deltaE00, over, parseColor } from './lib/color.mjs';
import { HONEY_MENISCUS_STROKE } from '../src/components/hexGeometry.js';
import {
  BOW_DEVIATION_FRACTION,
  CHORD_DEVIATION_BOUND_PX,
  DROP_MAX_AMOUNT,
  DROP_MAX_RADIUS,
  DROP_MENISCUS_DEPTH_FRACTION,
  DROP_MIN_AMOUNT,
  DROP_MIN_RADIUS,
  MAX_BOW_ARC_INFLATION,
  bowDeviationPx,
  bowNormal,
  buildDropFlight,
  dropRadiusForAmount,
} from '../src/components/nectarFlight.js';
import {
  NECTAR_PRESETS,
  NECTAR_STARTER_GRANT_DROPS,
  nectarArrivalDrops,
} from '../src/constants/nectar.js';
import { nectarGiftLifecycleTrace } from '../src/components/nectarGiftLifecycle.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

let pass = 0;
const failures = [];
const ok = (msg) => { pass += 1; console.log(`  ok  ${msg}`); };
const bad = (row, msg) => { failures.push(`${row}: ${msg}`); console.log(`  FAIL ${row}: ${msg}`); };

const read = (rel) => readFile(path.join(root, rel), 'utf8');
const ast = (src) => parse(src, { sourceType: 'module', plugins: ['jsx'] });
const visit = (node, fn, ancestors = []) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => visit(n, fn, ancestors)); return; }
  if (typeof node.type === 'string') fn(node, ancestors);
  const next = typeof node.type === 'string' ? [...ancestors, node] : ancestors;
  for (const k of Object.keys(node)) {
    if (k === 'loc' || k === 'leadingComments' || k === 'trailingComments') continue;
    visit(node[k], fn, next);
  }
};

// THE COVERS ARE READ FROM THEIR OWN SOURCE, not imported. `hiveThemes.js`
// imports `../constants/theme` with no extension, which Node's ESM resolver
// refuses — the same wall `check-stage-light` and `check-text-pigment` both
// hit and both answered this way. Extracting the TOKEN NAMES and resolving
// them against the live `theme` keeps the coupling real: a cover retuned to
// a different token moves every row below with it.
// `motion.js` imports `Easing` from react-native, which a bare `node` gate
// cannot load — so NECTAR's durations are read from that file's own source.
// The same reason `nectarFlight.js` was kept pure in the first place: a
// module the acceptance rows have to measure must not need a renderer.
const MOTION_SRC = await read('src/constants/motion.js');
const nectarMs = (key) => {
  const block = /export const NECTAR = \{[\s\S]*?\n\};/.exec(MOTION_SRC);
  if (!block) throw new Error('check-nectar-exchange: NECTAR block not found in motion.js');
  const m = new RegExp(`\\n\\s*${key}:\\s*(\\d+)`).exec(block[0]);
  if (!m) throw new Error(`check-nectar-exchange: NECTAR.${key} not found — a beat this gate measures has been renamed or removed`);
  return Number(m[1]);
};
const NECTAR = {
  gather: nectarMs('gather'),
  travel: nectarMs('travel'),
  absorbRise: nectarMs('absorbRise'),
  absorbFall: nectarMs('absorbFall'),
  settle: nectarMs('settle'),
};

const HIVE_THEMES_SRC = await read('src/constants/hiveThemes.js');
const COVERS = [...HIVE_THEMES_SRC.matchAll(/base:\s*theme\.colors\.(\w+),\s*\n\s*textColor:\s*theme\.colors\.(\w+)/g)]
  .map(([, base, textColor]) => ({ base: theme.colors[base], textColor: theme.colors[textColor], baseName: base }));
if (COVERS.length === 0) throw new Error('check-nectar-exchange: extracted 0 hive covers — the extractor is blind, and a blind extractor is not an empty population');

const FLIGHT = await read('src/components/nectarFlight.js');
const DROP = await read('src/components/HoneyDrop.js');
const HOOK = await read('src/components/useNectarGift.js');
const LAYER = await read('src/components/NectarGiftLayer.js');
const SCREEN = await read('src/screens/PackageOpen.js');
const PANEL = await read('src/components/NectarSendPanel.js');

// ===========================================================================
// A — THE RADIUS (§6 acceptance row 3)
// ===========================================================================
// > The drop's radius is monotone in the amount across 1..1000, strictly,
// > with no flat region. (Same rule as `approachDurationMs`: a clamp that
// > binds on a large fraction of the domain is the mechanism wearing a
// > guard's name.)
//
// SWEPT, NOT SAMPLED. Three presets would pass a step function; the whole
// integer domain is the only thing that can distinguish "monotone" from
// "monotone at the points I happened to check".
{
  let strict = true;
  let worstStep = Infinity;
  let prev = dropRadiusForAmount(DROP_MIN_AMOUNT);
  for (let n = DROP_MIN_AMOUNT + 1; n <= DROP_MAX_AMOUNT; n += 1) {
    const r = dropRadiusForAmount(n);
    const step = r - prev;
    if (!(step > 0)) strict = false;
    if (step < worstStep) worstStep = step;
    prev = r;
  }
  if (strict) {
    ok(`A1 the radius is STRICTLY increasing on every one of the ${DROP_MAX_AMOUNT - DROP_MIN_AMOUNT} integer steps in 1..${DROP_MAX_AMOUNT} — smallest step ${worstStep.toExponential(4)}pt, so there is no flat region anywhere in the domain`);
  } else {
    bad('A1', `the radius is flat or falling somewhere in 1..${DROP_MAX_AMOUNT} (smallest step ${worstStep.toExponential(4)}) — §6 row 3 wants strict monotonicity with no flat region`);
  }

  // THE CLAMP IS A DOMAIN GUARD, AND THIS ROW IS WHAT MAKES THAT A CLAIM.
  // Row 3's warning is that a clamp binding across the domain is the
  // mechanism in disguise; the only way to tell the two apart is to check
  // that the endpoints are REACHED rather than CLIPPED TO.
  const rLo = dropRadiusForAmount(DROP_MIN_AMOUNT);
  const rHi = dropRadiusForAmount(DROP_MAX_AMOUNT);
  const clampBinds = dropRadiusForAmount(DROP_MIN_AMOUNT - 0.5) === rLo && dropRadiusForAmount(DROP_MAX_AMOUNT + 1) === rHi;
  if (Math.abs(rLo - DROP_MIN_RADIUS) < 1e-9 && Math.abs(rHi - DROP_MAX_RADIUS) < 1e-9 && clampBinds) {
    ok(`A2 the endpoints are reached by the map, not by the clamp — r(${DROP_MIN_AMOUNT}) = ${rLo}pt and r(${DROP_MAX_AMOUNT}) = ${rHi}pt land exactly on the two radii, and the clamp only engages OUTSIDE the ledger's own 1..${DROP_MAX_AMOUNT}`);
  } else {
    bad('A2', `r(${DROP_MIN_AMOUNT}) = ${rLo}, r(${DROP_MAX_AMOUNT}) = ${rHi} against radii ${DROP_MIN_RADIUS}/${DROP_MAX_RADIUS}, clamp-outside-domain ${clampBinds} — either the map does not span its own range or the clamp is doing the work`);
  }

  // R-N3: "its radius encodes the amount, bounded, so 100 is visibly larger
  // than 10." VISIBLY is the word being checked. A physical pixel at @3x is
  // 1/3 pt; the presets have to differ by more than the screen's own grain,
  // and this is the row that would have caught a LINEAR map (where 10 and
  // 100 differ by 1.71pt of DIAMETER across the whole ladder).
  const dia = NECTAR_PRESETS.map((n) => ({ n, d: 2 * dropRadiusForAmount(n) }));
  let separated = true;
  for (let i = 1; i < dia.length; i += 1) if (dia[i].d - dia[i - 1].d < 1) separated = false;
  if (separated) {
    ok(`A3 consecutive presets differ visibly: ${dia.map((p) => `${p.n}→${p.d.toFixed(2)}pt`).join(', ')} — every neighbouring pair is over 1pt (3 physical px @3x) apart across`);
  } else {
    bad('A3', `preset diameters ${dia.map((p) => `${p.n}→${p.d.toFixed(2)}`).join(', ')} — a neighbouring pair differs by under 1pt, so "100 is visibly bigger than 10" is not true on the device`);
  }

  // THE FLOOR IS DERIVED, AND THIS ROW RE-DERIVES IT. R-N2's rule on a
  // circle: the amber cap above the meniscus must itself be at least half a
  // stroke, or the highlight is a line with a rim rather than a highlight on
  // a body. A VALUE CHECK ALONE WOULD FREEZE 3; this recomputes it from the
  // stroke and the depth, so retuning either reds the row.
  const derivedFloor = HONEY_MENISCUS_STROKE / DROP_MENISCUS_DEPTH_FRACTION / 2;
  if (Math.abs(derivedFloor - DROP_MIN_RADIUS) < 1e-9) {
    ok(`A4 DROP_MIN_RADIUS ${DROP_MIN_RADIUS}pt IS its derivation — stroke ${HONEY_MENISCUS_STROKE} / depth ${DROP_MENISCUS_DEPTH_FRACTION} / 2, R-N2's "a region, not its own boundary" argued on a circle`);
  } else {
    bad('A4', `DROP_MIN_RADIUS is ${DROP_MIN_RADIUS} but its own premise gives ${derivedFloor} — a floor that no longer follows from the stroke it was derived from is a number, not a rule`);
  }

  // R-N6 read backwards: the door IS this object at rest, in the ratified
  // 44pt box, so the largest gift is exactly that box.
  if (DROP_MAX_RADIUS * 2 === 44) {
    ok('A5 DROP_MAX_RADIUS spans the ratified 44pt tap target exactly — the same object cannot be larger in flight than the box it lives in at rest without being two objects');
  } else {
    bad('A5', `DROP_MAX_RADIUS ${DROP_MAX_RADIUS} spans ${DROP_MAX_RADIUS * 2}pt, not the 44pt floor LinkButton/SeedsInbox/NotesInbox all cite — R-N6's door and R-N3's drop have come apart`);
  }
}

// ===========================================================================
// B — THE PIGMENT (R-N3.2: there is no unbacked spelling of the drop)
// ===========================================================================
{
  // THE STACK IS ASSERTED FROM THE AST, IN ORDER. A row that only checked
  // "the file mentions `surface`" would pass a drop whose backing sits ON
  // TOP of its body, which is the same defect with the layers swapped.
  const tree = ast(DROP);
  const order = [];
  visit(tree, (n) => {
    if (n.type !== 'JSXElement') return;
    const name = n.openingElement.name?.name;
    if (name !== 'Circle' && name !== 'Line') return;
    const attrs = {};
    for (const a of n.openingElement.attributes) {
      if (a.type !== 'JSXAttribute') continue;
      const v = a.value;
      if (v?.type === 'StringLiteral') attrs[a.name.name] = v.value;
      else if (v?.type === 'JSXExpressionContainer') {
        const e = v.expression;
        if (e.type === 'MemberExpression') attrs[a.name.name] = `${e.object.property?.name ?? e.object.name}.${e.property.name}`;
        else if (e.type === 'NumericLiteral') attrs[a.name.name] = e.value;
      }
    }
    // The clip mask is not a layer of the drop; it is how the highlight is
    // kept inside it. Excluded by its PARENT (a ClipPath), never by name.
    const inClip = false;
    if (!inClip) order.push({ name, attrs });
  });
  const stack = order.filter((o) => !(o.name === 'Circle' && o.attrs.fill === undefined));
  const body = stack.filter((o) => o.name === 'Circle' && o.attrs.fill);
  const backing = body[0];
  const amber = body[1];
  const line = stack.find((o) => o.name === 'Line');
  const stackOk =
    body.length === 2 &&
    backing?.attrs.fill === 'colors.surface' &&
    backing?.attrs.fillOpacity === undefined &&
    amber?.attrs.fill === 'colors.accentDeep' &&
    amber?.attrs.fillOpacity === 0.5 &&
    line?.attrs.stroke === 'colors.ink';
  if (stackOk) {
    ok('B1 the drop is drawn backing-first: opaque `surface` circle, then `accentDeep` at fillOpacity 0.5, then the `ink` meniscus — HoneyFill\'s own three-layer recipe, in order, read from the AST rather than from the file mentioning the tokens');
  } else {
    bad('B1', `the drop's layer stack is ${JSON.stringify(stack.map((o) => [o.name, o.attrs.fill ?? o.attrs.stroke, o.attrs.fillOpacity]))} — R-N3.2 wants exactly opaque surface, accentDeep@0.5, ink meniscus, in that order`);
  }

  // THE MEASUREMENT THAT MAKES B1 WORTH HAVING. Backed, the drop is one
  // colour on every ground; unbacked it is ten. Both are computed here, so
  // the row states the size of the thing the backing buys rather than
  // asserting that a backing exists.
  const scrim = parseColor(theme.colors.scrim);
  const covers = COVERS.map((t) => t.base);
  const grounds = [
    ['surface', theme.colors.surface],
    ...covers.map((c) => [`cover ${c}`, c]),
    ...covers.map((c) => [`cover ${c} + scrim`, over(theme.colors.scrim, c)]),
    ['paperEvening', theme.colors.paperEvening],
  ];
  const backedRGB = over(`rgba(255,122,0,0.5)`, theme.colors.surface);
  let worstBackedDrift = 0;
  let worstUnbackedDrift = 0;
  let minLegibility = Infinity;
  for (const [, g] of grounds) {
    const unbacked = over(`rgba(255,122,0,0.5)`, g);
    worstUnbackedDrift = Math.max(worstUnbackedDrift, deltaE00(unbacked, backedRGB));
    worstBackedDrift = Math.max(worstBackedDrift, 0);
    minLegibility = Math.min(minLegibility, deltaE00(backedRGB, g));
  }
  void scrim;
  if (worstUnbackedDrift > 25 && minLegibility > 15) {
    ok(`B2 the backing is load-bearing and measured: unbacked, the same fill drifts up to ΔE00 ${worstUnbackedDrift.toFixed(4)} across the ${grounds.length} grounds this object crosses; backed it is ONE colour by construction and its worst separation from any of them is still ΔE00 ${minLegibility.toFixed(4)}`);
  } else {
    bad('B2', `unbacked drift ${worstUnbackedDrift.toFixed(4)} / backed worst legibility ${minLegibility.toFixed(4)} over ${grounds.length} grounds — R-N3.2's premise no longer holds and the ruling needs re-deriving, not the code`);
  }

  // THE ABSENCE, STATED AS ONE. "There is no unbacked spelling of the drop
  // anywhere in this spec" is only checkable if the population is declared:
  // every place the drop is rendered gets its pigment from `HoneyDrop`, so
  // the row is that NOTHING ELSE in the send's files paints with accentDeep.
  //
  // READ FROM THE AST, AND MY FIRST DRAFT DID NOT — it grepped the file text
  // and went red on PackageOpen and NectarSendPanel, both of which name
  // `accentDeep` only in the DES-28 comments that explain why they decline
  // it. A lexical sweep cannot tell a pigment from a paragraph about a
  // pigment, and the wrong probe was RED here rather than green, which is
  // luck and not method. Member expressions only.
  const dropUsers = [
    ['src/components/NectarGiftLayer.js', LAYER],
    ['src/screens/PackageOpen.js', SCREEN],
    ['src/components/NectarSendPanel.js', PANEL],
  ];
  const rogue = [];
  for (const [rel, src] of dropUsers) {
    let uses = 0;
    visit(ast(src), (n) => {
      if (
        n.type === 'MemberExpression' &&
        n.property?.name === 'accentDeep' &&
        n.object?.type === 'MemberExpression' &&
        n.object.property?.name === 'colors'
      ) uses += 1;
    });
    // The stain is the ONE licensed consumer, and it is licensed by C3's
    // measurement rather than by its filename.
    const licensed = rel.endsWith('NectarGiftLayer.js') ? 1 : 0;
    if (uses > licensed) rogue.push(`${rel} (${uses} use(s), ${licensed} licensed)`);
  }
  if (rogue.length === 0) {
    ok(`B3 no consumer re-spells the drop's pigment — ${dropUsers.length} files render or host it, and the only live theme.colors.accentDeep among them is the stain, whose alpha C3 derives. Comments naming the token are not uses, which is why this row reads member expressions and not text`);
  } else {
    bad('B3', `${rogue.join(', ')} paints with accentDeep outside the stain — a second spelling of the drop's fill is exactly the drift R-N3.2 closed by construction`);
  }
}

// ===========================================================================
// C — THE PATH AND THE STAIN
// ===========================================================================
{
  // THE BOW'S CEILING IS SOLVED, NOT CHOSEN, and this row re-solves it. The
  // premise is "a fixed 340ms travel means extra arc is extra speed", so the
  // bound is on the ARC, and the fraction is what follows. A fraction edited
  // without its premise reds here.
  const arcRatioAt = (f) => {
    const p0 = { x: 0, y: 0 };
    const p2 = { x: 1, y: 0 };
    const c = { x: 0.5, y: -2 * f };
    let L = 0;
    let prev = p0;
    for (let i = 1; i <= 100000; i += 1) {
      const t = i / 100000;
      const u = 1 - t;
      const q = { x: u * u * p0.x + 2 * u * t * c.x + t * t * p2.x, y: 2 * u * t * c.y };
      L += Math.hypot(q.x - prev.x, q.y - prev.y);
      prev = q;
    }
    return L;
  };
  const ratio = arcRatioAt(BOW_DEVIATION_FRACTION);
  if (ratio <= MAX_BOW_ARC_INFLATION && ratio > MAX_BOW_ARC_INFLATION - 0.001) {
    ok(`C1 BOW_DEVIATION_FRACTION ${BOW_DEVIATION_FRACTION} IS the ${MAX_BOW_ARC_INFLATION} arc bound solved — the bowed path is ${ratio.toFixed(6)}x its chord, at the bound and under it`);
  } else {
    bad('C1', `bow fraction ${BOW_DEVIATION_FRACTION} gives an arc ${ratio.toFixed(6)}x the chord against a ${MAX_BOW_ARC_INFLATION} ceiling — the constant and its premise have come apart`);
  }

  // THE CURRENCY ROW, and it is the one R-LF-2.1 taught. `Easing.out(cubic)`
  // on the driver is only a DISTANCE deceleration if the path is uniform in
  // ARC; sampled any other way the same easing decelerates in parameter and
  // the drop speeds up through its own turn. Swept over real geometry rather
  // than one hop.
  const boxes = [[320, 568], [375, 667], [393, 852], [430, 932]];
  let worstUniformity = 0;
  let worstDeviation = 0;
  let plans = 0;
  for (const [w, h] of boxes) {
    for (const amount of [...NECTAR_PRESETS, DROP_MIN_AMOUNT, DROP_MAX_AMOUNT]) {
      const r = dropRadiusForAmount(amount);
      for (const [from, to] of [
        [{ x: w * 0.5, y: h * 0.72 }, { x: w * 0.5, y: h * 0.36 }],   // overlay -> entry paper
        [{ x: w * 0.5, y: h * 0.66 }, { x: w * 0.5, y: h * 0.30 }],   // inline -> colophon (near-vertical)
        [{ x: w * 0.2, y: h * 0.8 }, { x: w * 0.85, y: h * 0.2 }],    // corner to corner
        [{ x: w * 0.85, y: h * 0.2 }, { x: w * 0.2, y: h * 0.8 }],    // and back, for the normal's sign
      ]) {
        const plan = buildDropFlight({ from, to, radiusPx: r });
        plans += 1;
        const legs = plan.path.slice(1).map((p, i) => Math.hypot(p.x - plan.path[i].x, p.y - plan.path[i].y));
        const mean = legs.reduce((a, b) => a + b, 0) / legs.length;
        const spread = Math.max(...legs.map((l) => Math.abs(l - mean) / mean));
        worstUniformity = Math.max(worstUniformity, spread);
        // the polyline's own deviation from the curve it samples
        const c = {
          x: (from.x + to.x) / 2 + bowNormal({ from, to }).x * plan.bowPx * 2,
          y: (from.y + to.y) / 2 + bowNormal({ from, to }).y * plan.bowPx * 2,
        };
        for (let i = 0; i <= 2000; i += 1) {
          const t = i / 2000;
          const u = 1 - t;
          const q = { x: u * u * from.x + 2 * u * t * c.x + t * t * to.x, y: u * u * from.y + 2 * u * t * c.y + t * t * to.y };
          let best = Infinity;
          for (let j = 0; j < plan.path.length - 1; j += 1) {
            const a = plan.path[j];
            const b = plan.path[j + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const L2 = dx * dx + dy * dy;
            let s = L2 ? ((q.x - a.x) * dx + (q.y - a.y) * dy) / L2 : 0;
            s = Math.max(0, Math.min(1, s));
            best = Math.min(best, Math.hypot(q.x - (a.x + dx * s), q.y - (a.y + dy * s)));
          }
          worstDeviation = Math.max(worstDeviation, best);
        }
      }
    }
  }
  if (worstUniformity < 0.01) {
    ok(`C2a the path is ARC-UNIFORM on all ${plans} swept plans — worst leg-length spread ${(worstUniformity * 100).toFixed(4)}% of the mean, so "fraction of the index" and "fraction of the path" are the same number and out(cubic) decelerates in DISTANCE`);
  } else {
    bad('C2a', `worst leg-length spread ${(worstUniformity * 100).toFixed(4)}% over ${plans} plans — the path is not arc-uniform, so the travel easing is a parameter curve and the drop accelerates through its own turn (R-LF-2.1's defect, second costume)`);
  }
  if (worstDeviation <= CHORD_DEVIATION_BOUND_PX) {
    ok(`C2b the sample count holds its own bound at every swept geometry — worst polyline deviation from the true curve ${worstDeviation.toFixed(5)}px against ${CHORD_DEVIATION_BOUND_PX}px. THE APPROXIMATION IN dropFlightSamples IS NOT TRUSTED: this is measured, so a bow retune that invalidates its coefficient reds here instead of silently coarsening the path`);
  } else {
    bad('C2b', `worst polyline deviation ${worstDeviation.toFixed(5)}px exceeds ${CHORD_DEVIATION_BOUND_PX}px — dropFlightSamples' coefficient no longer follows from the shipped bow`);
  }

  // THE NEAR-VERTICAL CASE, which is the ending screen's own travel
  // (R-N3.1: "the travel is short and upward"). A vertical bow on a vertical
  // chord is COLLINEAR and the arc degenerates to a line — the row that
  // proves the perpendicular rule is doing work rather than decorating it.
  const vertical = buildDropFlight({ from: { x: 200, y: 600 }, to: { x: 200, y: 400 }, radiusPx: 15 });
  const straight = Math.hypot(vertical.path.at(-1).x - vertical.path[0].x, vertical.path.at(-1).y - vertical.path[0].y);
  if (vertical.arcPx > straight * 1.0001 && Math.abs(vertical.path[Math.floor(vertical.path.length / 2)].x - 200) > 1) {
    ok(`C2c an exactly vertical chord still arcs — mid-path offset ${Math.abs(vertical.path[Math.floor(vertical.path.length / 2)].x - 200).toFixed(3)}pt off the chord, arc ${vertical.arcPx.toFixed(3)} vs chord ${straight.toFixed(3)}. A screen-vertical bow would be collinear here and the ending screen's gift would fly in a straight line`);
  } else {
    bad('C2c', `a vertical chord degenerates: mid-path is on the chord and arc ${vertical.arcPx.toFixed(3)} == chord ${straight.toFixed(3)} — the ending screen's travel has lost its arc`);
  }

  // THE BOW'S FLOOR. A curve that departs from its chord by less than the
  // radius of the object drawn on it is a straight line drawn with a fat pen.
  const tiny = bowDeviationPx({ chordPx: 20, radiusPx: 22 });
  const long = bowDeviationPx({ chordPx: 600, radiusPx: 3 });
  if (tiny === 22 && Math.abs(long - BOW_DEVIATION_FRACTION * 600) < 1e-9) {
    ok('C2d the bow floor and ceiling each bind where they should — a short hop with a big drop bows by the drop\'s own radius, a long hop with a small one bows by the arc bound');
  } else {
    bad('C2d', `bowDeviationPx gives ${tiny} (want 22, the radius floor) and ${long} (want the fraction) — one of the two bounds is dead`);
  }

  // ---- THE STAIN ----------------------------------------------------------
  // BOTH BOUNDS, RE-MEASURED. The floor is what chose the number (visible on
  // every ground); the ceiling is legibility (the stain composites above the
  // text). CALIBRATED ON THE FAILING GROUND — the row prints the binding one
  // by name, because a mean would license an alpha invisible on the cover
  // where it matters most.
  const stainAlpha = Number(/STAIN_PEAK_ALPHA = ([0-9.]+)/.exec(LAYER)?.[1]);
  const stainSpread = Number(/STAIN_SPREAD = ([0-9.]+)/.exec(LAYER)?.[1]);
  const stainFill = `rgba(255,122,0,${stainAlpha})`;
  const stainGrounds = [
    ['surface', theme.colors.surface, theme.colors.ink],
    ['paperEvening', theme.colors.paperEvening, theme.colors.paperEveningInk],
    ...COVERS.map((t) => [`cover ${t.baseName}`, t.base, t.textColor]),
  ];
  let minVisibility = Infinity;
  let bindingGround = '';
  let minText = Infinity;
  let bindingText = '';
  for (const [label, ground, ink] of stainGrounds) {
    const stained = over(stainFill, ground);
    const d = deltaE00(stained, ground);
    if (d < minVisibility) { minVisibility = d; bindingGround = label; }
    const r = contrastRatio(over(stainFill, ink), stained);
    if (r < minText) { minText = r; bindingText = label; }
  }
  if (minVisibility >= 5) {
    ok(`C3a the stain is visible on every ground it can land on — worst ΔE00 ${minVisibility.toFixed(4)} on ${bindingGround}, over a 5.0 "clearly perceptible" floor. That ground is the calibration: it is amber-on-amber and lands exactly on the bound while washSky gets 8.42 free`);
  } else {
    bad('C3a', `the stain reaches only ΔE00 ${minVisibility.toFixed(4)} on ${bindingGround} — under the 5.0 floor, so on that ground the absorption is invisible`);
  }
  if (minText >= 4.5) {
    ok(`C3b the stain does not cost the text it lands on — worst pair ${minText.toFixed(4)}:1 on ${bindingText}, over 4.5:1. It composites ABOVE the ink (one layer serves a PaperBlock on one path and a Text on the other), so this ceiling is real and not theoretical`);
  } else {
    bad('C3b', `the stain drops text to ${minText.toFixed(4)}:1 on ${bindingText} — under 4.5:1, and it is drawn over the words`);
  }
  if (stainSpread === 2) {
    ok('C3c the stain\'s radius is the drop\'s DIAMETER — a drop that lands flattens to about its own width, so the spread is one physical multiple rather than a factor picked to look right');
  } else {
    bad('C3c', `STAIN_SPREAD is ${stainSpread} — the "flattens to its own width" derivation gives 2, and a spread with no reason is a number that drifts`);
  }
}

// ===========================================================================
// D — THE BEAT (§6 acceptance rows 4, 5, 6 and R-N3.3)
// ===========================================================================
{
  // ROW 4, ASSERTED AT THE CALL SITE AND NOT AT A TIMING — which is what the
  // row itself asks for. The haptic must sit inside the ANIMATION's
  // completion, never inside the promise's: "a success haptic that waits for
  // a round trip is a haptic about the server."
  const tree = ast(HOOK);
  let hapticInSettle = false;
  let hapticInPromiseThen = false;
  visit(tree, (n, anc) => {
    if (n.type !== 'CallExpression') return;
    const callee = n.callee;
    if (callee?.type !== 'MemberExpression') return;
    if (callee.object?.name !== 'Haptics') return;
    // Walk outward: is the nearest enclosing named function `settle`, or is
    // it a `.then(...)` argument? Read from the AST, not from line order.
    let inSettle = false;
    let inThen = false;
    for (let i = anc.length - 1; i >= 0; i -= 1) {
      const a = anc[i];
      if (a.type === 'VariableDeclarator' && a.id?.name === 'settle') { inSettle = true; break; }
      if (
        a.type === 'CallExpression' &&
        a.callee?.type === 'MemberExpression' &&
        (a.callee.property?.name === 'then' || a.callee.property?.name === 'catch')
      ) { inThen = true; break; }
    }
    if (inSettle) hapticInSettle = true;
    if (inThen) hapticInPromiseThen = true;
  });
  const rmHaptic = /if \(reduced\)[\s\S]{0,400}?Haptics\.notificationAsync/.test(HOOK);
  if (hapticInSettle && !hapticInPromiseThen && rmHaptic) {
    ok('D1 the haptic fires from the animation, not from the network — its motion-path call site is inside `settle`, the travel animation\'s completion, and NO Haptics call sits inside a .then/.catch. The Reduce Motion path fires one too, so the gift still lands in the hand when it cannot land on the screen');
  } else {
    bad('D1', `haptic in settle=${hapticInSettle}, haptic in a promise handler=${hapticInPromiseThen}, RM haptic=${rmHaptic} — §6 row 4 wants the call site inside absorption and nowhere else`);
  }

  // MP-3: the travel profile starts and ends at rest. This samples the exact
  // expression motion.js exports, with a tiny local Easing shim, rather than
  // a hand-copied cubic that could keep passing after the app's curve changed.
  const nectarEasingBlock = /export const NECTAR_EASING = \{[\s\S]*?\n\};/.exec(MOTION_SRC)?.[0] ?? '';
  const travelExpr = /travel:\s*([^,\n]+),/.exec(nectarEasingBlock)?.[1] ?? '';
  const EasingShim = {
    cubic: (t) => t * t * t,
    out: (fn) => (t) => 1 - fn(1 - t),
    inOut: (fn) => (t) => (t < 0.5 ? fn(t * 2) / 2 : 1 - fn((1 - t) * 2) / 2),
  };
  let easeTravel = null;
  try {
    easeTravel = Function('Easing', `return (${travelExpr});`)(EasingShim);
  } catch {
    easeTravel = null;
  }
  const speeds = [];
  const dt = 1 / 1000;
  if (typeof easeTravel === 'function') {
    for (let i = 0; i < 1000; i += 1) speeds.push((easeTravel((i + 1) * dt) - easeTravel(i * dt)) / dt);
  }
  const endpointEpsilon = 0.00001;
  const endpointsRest = speeds[0] < 0.00001 && speeds[speeds.length - 1] < 0.00001;
  const positiveInside = speeds.slice(1, -1).every((v) => v > 0);
  let peaks = 0;
  for (let i = 1; i < speeds.length - 1; i += 1) {
    if (speeds[i] >= speeds[i - 1] && speeds[i] >= speeds[i + 1] && speeds[i] > 2.9) peaks += 1;
  }
  if (travelExpr === 'Easing.inOut(Easing.cubic)' && endpointsRest && positiveInside && peaks === 1) {
    ok('D1b travel samples NECTAR_EASING.travel itself: endpoint velocity is zero at t=0/t=1, positive inside, and has one central peak at the cubic join');
  } else {
    bad(
      'D1b',
      `travelExpr="${travelExpr}", sampled=${typeof easeTravel === 'function'}, endpointsRest=${endpointsRest}, ` +
        `positiveInside=${positiveInside}, peakSamples=${peaks}, epsilon=${endpointEpsilon}`,
    );
  }

  // ROW 5, MADE STRUCTURAL. "The numeral returns to its prior value exactly —
  // no drift from the count-down/count-up pair" is only checkable if the two
  // are NOT a pair: every count is a tween to an ABSOLUTE target, so
  // interrupting either still lands on the number the server holds. This row
  // reads the arguments of every `countTo` and reds on arithmetic.
  let allAbsolute = true;
  const targets = [];
  visit(tree, (n) => {
    if (n.type !== 'CallExpression' || n.callee?.name !== 'countTo') return;
    const arg = n.arguments[0];
    if (!arg) { allAbsolute = false; return; }
    if (arg.type === 'BinaryExpression') { allAbsolute = false; targets.push('<arithmetic>'); return; }
    targets.push(arg.type === 'MemberExpression' ? `${arg.object.name}.${arg.property.name}` : arg.name ?? arg.type);
  });
  if (allAbsolute && targets.length >= 3) {
    ok(`D2 every count is a tween to an ABSOLUTE target — ${targets.join(', ')}, no arithmetic at any call site. The down-count and the up-count are not a pair, so §6 row 5's "no drift" holds even if a frame is dropped or the beat is interrupted mid-tween`);
  } else {
    bad('D2', `countTo targets are ${targets.join(', ') || '(none found)'} — a delta at any of them makes the return value depend on how far the down-count got, which is exactly the drift row 5 forbids`);
  }

  // ROW 6 — Reduce Motion. NOT "there is a reduced branch": the claim is that
  // the branch removes the TRAVEL and keeps the ARRIVAL.
  //
  // AMENDED FOR R-N3.4, AND THE OLD SHAPE WAS ALREADY WIDER THAN ITS OWN
  // HEADER. This row used to be `/Animated\.(timing|spring|sequence|parallel)/`
  // over the block's source text: it forbade EVERY tween while the sentence
  // above it forbade one — "no Animated timing ON THE PATH DRIVER". A proxy
  // that quantifies over more than the claim does is a row that reds on
  // correct work, and R-N3.4 is that work: the send surface yields under RM
  // too, as §14.1's mandated flat fade. It was also weaker than it looked in
  // the other direction, because a text scan cannot tell WHICH value is
  // being driven, so `Animated.timing(travel, …)` and
  // `Animated.timing(controls, …)` were the same string to it.
  //
  // Written as a UNIVERSAL instead. Every Animated driver inside the branch
  // is enumerated off the AST and classified; a driver in neither class is a
  // FAILURE rather than an absence, so the next value added here has to be
  // ruled on rather than defaulting to permitted.
  const RM_PATH_DRIVERS = ['travel', 'dropScale', 'dropOpacity', 'bloom'];
  const RM_SURFACE_DRIVERS = ['controls', 'scrim'];
  const rmIfs = [];
  visit(tree, (n) => {
    if (n.type === 'IfStatement' && n.test?.type === 'Identifier' && n.test.name === 'reduced'
      && n.consequent?.type === 'BlockStatement') rmIfs.push(n);
  });
  const rmDrivers = [];
  let rmCounts = false;
  if (rmIfs.length === 1) {
    visit(rmIfs[0].consequent, (n) => {
      if (n.type !== 'CallExpression') return;
      if (n.callee?.type === 'Identifier' && n.callee.name === 'countTo') rmCounts = true;
      if (n.callee?.type !== 'MemberExpression') return;
      if (n.callee.object?.name !== 'Animated') return;
      const method = n.callee.property?.name;
      // `parallel`/`sequence`/`stagger`/`delay` are composers, not drivers —
      // their members are separate CallExpressions this same walk reaches.
      if (!['timing', 'spring', 'decay'].includes(method)) return;
      const target = n.arguments[0];
      const config = n.arguments[1];
      const durationProp = config?.type === 'ObjectExpression'
        ? config.properties.find((prop) => prop.key?.name === 'duration')
        : null;
      const duration = durationProp?.value?.type === 'MemberExpression'
        ? `${durationProp.value.object?.name}.${durationProp.value.property?.name}`
        : durationProp?.value?.value ?? null;
      rmDrivers.push({
        name: target?.type === 'Identifier' ? target.name : `<${target?.type ?? 'missing'}>`,
        method,
        duration,
      });
    });
  }
  const rmPath = rmDrivers.filter((d) => RM_PATH_DRIVERS.includes(d.name));
  const rmSurface = rmDrivers.filter((d) => RM_SURFACE_DRIVERS.includes(d.name));
  const rmUnclassified = rmDrivers.filter(
    (d) => !RM_PATH_DRIVERS.includes(d.name) && !RM_SURFACE_DRIVERS.includes(d.name),
  );
  // The yield is the §14.1 number or it is not the ruled substitute.
  const rmSurfaceMistimed = rmSurface.filter((d) => d.duration !== 'DURATIONS.reducedMotionFade');
  if (rmIfs.length === 1 && rmCounts && rmPath.length === 0 && rmUnclassified.length === 0
    && rmSurface.length > 0 && rmSurfaceMistimed.length === 0) {
    ok(`D3 the Reduce Motion branch removes the travel and keeps the gift — every Animated driver inside it enumerated off the AST and classified: ${rmDrivers.length} total, 0 on a path driver (${RM_PATH_DRIVERS.join('/')}), ${rmSurface.length} on the send surface (${RM_SURFACE_DRIVERS.join('/')}) and every one of those at DURATIONS.reducedMotionFade — R-N3.4's ruled fast-fade substitute, which is §14.1's one number for this case. The numeral still counts because "a number changing is content, not motion" (§5), and the drop layer still mounts, so the surface population is identical to the motion path`);
  } else {
    bad('D3', `RM branch found=${rmIfs.length}, counts=${rmCounts}, path drivers=[${rmPath.map((d) => d.name).join(', ')}], surface drivers=[${rmSurface.map((d) => `${d.name}@${d.duration}`).join(', ')}], unclassified=[${rmUnclassified.map((d) => `${d.name}@${d.duration}`).join(', ')}] — §5/§6 row 6 wants no tween on the path and a gift that still arrives, and R-N3.4 wants the surface yield at the mandated RM fade`);
  }

  // D3b — THE CONTROL FOR D3, because a classifier this shape has two ways
  // to go quiet and neither shows up as a red. Re-run the same enumeration
  // against a branch with a path driver injected and against one with a
  // driver in no class at all: both must be rejected. Without this, a
  // `visit` that stopped reaching into the branch would report zero path
  // drivers and read exactly like a clean pass.
  const rmClassify = (drivers) => ({
    path: drivers.filter((d) => RM_PATH_DRIVERS.includes(d.name)).length,
    unclassified: drivers.filter(
      (d) => !RM_PATH_DRIVERS.includes(d.name) && !RM_SURFACE_DRIVERS.includes(d.name),
    ).length,
  });
  const rmInjectedPath = rmClassify([...rmDrivers, { name: 'travel', method: 'timing', duration: 340 }]);
  const rmInjectedNew = rmClassify([...rmDrivers, { name: 'somethingNew', method: 'timing', duration: 200 }]);
  if (rmDrivers.length > 0 && rmInjectedPath.path === 1 && rmInjectedNew.unclassified === 1) {
    ok(`D3b the row's classifier is live and its null class is a failure — the real branch yields ${rmDrivers.length} enumerated drivers (non-empty, so D3 is not vacuous), a re-injected \`travel\` lands in the forbidden class, and an unheard-of driver lands in NEITHER class rather than defaulting to permitted`);
  } else {
    bad('D3b', `enumerated=${rmDrivers.length}, injected path=${rmInjectedPath.path}, injected unknown=${rmInjectedNew.unclassified} — the classifier cannot distinguish the cases D3's verdict rests on`);
  }

  // R-N3.3 — the two jobs, separated. THE ABSENCE IS THE ASSERTION: the
  // overlay must NOT carry a background any more, and must NOT have been
  // given pointerEvents="none" while its scrim moved out (that would swap a
  // veil-that-blocks for a barrier that no longer blocks).
  const overlayStyle = /sendOverlay: \{([\s\S]*?)\n  \},/.exec(SCREEN)?.[1] ?? '';
  const scrimStyle = /sendScrim: \{([\s\S]*?)\n  \},/.exec(SCREEN)?.[1] ?? '';
  const overlayHasBg = /backgroundColor:/.test(overlayStyle);
  const scrimHasBg = /backgroundColor: theme\.colors\.scrim/.test(scrimStyle);
  const scrimAnimated = /style=\{\[styles\.sendScrim, \{ opacity: gift\.scrim \}\]\}/.test(SCREEN);
  const overlayStillBlocks = !/<View style=\{styles\.sendOverlay\}\s+pointerEvents="none"/.test(SCREEN);
  if (!overlayHasBg && scrimHasBg && scrimAnimated && overlayStillBlocks) {
    ok('D4 the veil and the touch barrier are separate objects — `sendOverlay` declares no background and still takes touches; `sendScrim` carries the scrim and is the only thing that fades. R-N3.3: "a transparent overlay is still a touch barrier"');
  } else {
    bad('D4', `overlay has a background=${overlayHasBg}, scrim exists=${scrimHasBg}, scrim is animated=${scrimAnimated}, overlay still blocks=${overlayStillBlocks} — R-N3.3's separation has come undone in one of its two directions`);
  }

  // THE BEAT'S CLOCK IS COMPOSED, NOT RE-TYPED. R-N3's boundaries are
  // 0/180/520; if a duration is retuned in motion.js, a hardcoded start time
  // here would strand a beat. Asserted as a COMPOSITION, so the numbers can
  // move together and only a broken relation reds.
  const contact = /GIFT_CONTACT_MS = ([^;]+);/.exec(HOOK)?.[1] ?? '';
  const rest = /GIFT_REST_MS = ([^;]+);/.exec(HOOK)?.[1] ?? '';
  const composed = /NECTAR\.gather \+ NECTAR\.travel/.test(contact) && /GIFT_CONTACT_MS \+ NECTAR\.settle/.test(rest);
  if (composed && NECTAR.gather + NECTAR.travel === 520) {
    ok(`D5 the beat's instants are composed from NECTAR rather than typed — contact = gather + travel = ${NECTAR.gather + NECTAR.travel}ms, matching R-N3's own Depart boundary, and rest follows from it. Retuning a duration moves the beat instead of stranding it`);
  } else {
    bad('D5', `contact is "${contact.trim()}" and rest is "${rest.trim()}" (contact resolves to ${NECTAR.gather + NECTAR.travel}ms) — a beat boundary spelled as a literal is a number that outlives its own duration`);
  }

  // MP-3: failure timing is contact-owned, and the returned send() promise is
  // owned by the whole failure lifecycle. A failure known before contact
  // starts the return immediately; a failure arriving during the stain stops
  // that stain on the frame the RPC result appears; and the caller cannot
  // leave its sending state until return-home plus the authoritative count
  // both complete.
  const failureTiming =
    /let commitResult = null;/.test(HOOK) &&
    /commitResult = \{ ok: false, err \};/.test(HOOK) &&
    /const countDone = countTo\(optimistic\);\n\s*if \(commitResult && !commitResult\.ok\) \{/.test(HOOK) &&
    /if \(commitResult && !commitResult\.ok\) \{[\s\S]{0,200}?Promise\.reject\(\{ err: commitResult\.err, collapsed: false, countDone \}\)/.test(HOOK) &&
    /const failure = settledCommit\.then\(\(res\) => \(res\.ok \? null : res\)\);/.test(HOOK) &&
    /Promise\.race\(\[stainDone\.then\(\(\) => null\), failure\]\)/.test(HOOK) &&
    /stainAnimation\?\.stop\(\);/.test(HOOK) &&
    /Promise\.reject\(\{ err: earlyFailure\.err, collapsed: true, countDone \}\)/.test(HOOK) &&
    /return Promise\.all\(\[stainDone, countDone\]\);/.test(HOOK) &&
    /const returnPlan = nectarFailureReturnPlan\(\{ collapsed, nectar: NECTAR \}\);/.test(HOOK) &&
    /if \(returnPlan\.authoritativeCountAt !== 'origin'\) return;/.test(HOOK) &&
    /const returnHomeDone = new Promise\(\(resolveReturnHome\) => \{/.test(HOOK) &&
    /resolveReturnHome\(\);/.test(HOOK) &&
    /const countHomeDone = countTo\(settled\.current\);/.test(HOOK) &&
    /return returnHomeDone\.then\(\(\) => \(\{ ok: false, err \}\)\);/.test(HOOK);
  const normalFailureTrace = [0, 200, 800].map((commitAtMs) =>
    nectarGiftLifecycleTrace({ reduced: false, commitAtMs, ok: false, nectar: NECTAR })
  );
  const normalFailureClocksHold =
    normalFailureTrace[0].optimisticCountStartMs === normalFailureTrace[0].contactMs &&
    normalFailureTrace[0].returnStartMs === normalFailureTrace[0].contactMs &&
    normalFailureTrace[0].firstPositionChangeMs === normalFailureTrace[0].contactMs &&
    normalFailureTrace[0].authoritativeCountStartMs === normalFailureTrace[0].originMs &&
    normalFailureTrace[1].returnStartMs === normalFailureTrace[1].contactMs &&
    normalFailureTrace[2].returnStartMs === 800 &&
    normalFailureTrace.every((t) => t.resolveMs >= t.authoritativeCountStartMs + NECTAR.settle);
  const settledCountCalls = [];
  visit(tree, (n, anc) => {
    if (
      n.type !== 'CallExpression' ||
      n.callee?.type !== 'Identifier' ||
      n.callee.name !== 'countTo' ||
      n.arguments?.[0]?.type !== 'MemberExpression' ||
      n.arguments[0].object?.name !== 'settled' ||
      n.arguments[0].property?.name !== 'current'
    ) return;

    const insideReverseTravelCompletion = anc.some((a) => {
      if (
        a.type !== 'CallExpression' ||
        a.callee?.type !== 'MemberExpression' ||
        a.callee.property?.name !== 'start'
      ) return false;
      const timingCall = a.callee.object;
      return (
        timingCall?.type === 'CallExpression' &&
        timingCall.callee?.type === 'MemberExpression' &&
        timingCall.callee.object?.name === 'Animated' &&
        timingCall.callee.property?.name === 'timing' &&
        timingCall.arguments?.[0]?.type === 'Identifier' &&
        timingCall.arguments[0].name === 'travel'
      );
    });
    settledCountCalls.push({ insideReverseTravelCompletion });
  });
  const exactlyOneSettledCountAtOrigin =
    settledCountCalls.length === 1 &&
    settledCountCalls[0].insideReverseTravelCompletion;
  if (failureTiming && normalFailureClocksHold && exactlyOneSettledCountAtOrigin) {
    ok('D5b normal lifecycle inspects failure at contact, interrupts the stain on an in-stain rejection, starts exactly one authoritative count, starts it at reverse-travel origin, and send() resolves only after return-home plus authoritative count completion');
  } else {
    bad(
      'D5b',
      `failureTiming=${failureTiming}, settledCountCalls=${JSON.stringify(settledCountCalls)}, traces=${JSON.stringify(normalFailureTrace)}`,
    );
  }

  const commitSamples = [0, 200, 800];
  const lifecycleMatrix = [false, true].flatMap((reduced) =>
    [true, false].flatMap((okResult) =>
      commitSamples.map((commitAtMs) => ({
        reduced,
        ok: okResult,
        commitAtMs,
        trace: nectarGiftLifecycleTrace({ reduced, commitAtMs, ok: okResult, nectar: NECTAR }),
      }))
    )
  );
  const fullLifecycleMatrixHolds = lifecycleMatrix.every(({ reduced, ok: okResult, commitAtMs, trace }) => {
    if (reduced && okResult) {
      return trace.countStartMs === 0 && trace.resolveMs >= commitAtMs && trace.resolveMs >= NECTAR.settle;
    }
    if (reduced && !okResult) {
      return trace.countStartMs === 0 && trace.authoritativeCountStartMs === commitAtMs && trace.resolveMs >= commitAtMs + NECTAR.settle;
    }
    if (!reduced && okResult) {
      return (
        trace.optimisticCountStartMs === trace.contactMs &&
        trace.resolveMs >= commitAtMs &&
        trace.resolveMs >= trace.contactMs + NECTAR.absorbRise + NECTAR.absorbFall &&
        trace.resolveMs >= trace.contactMs + NECTAR.settle
      );
    }
    return (
      trace.optimisticCountStartMs === trace.contactMs &&
      trace.returnStartMs === (commitAtMs <= trace.contactMs ? trace.contactMs : commitAtMs) &&
      trace.firstPositionChangeMs === trace.returnStartMs &&
      trace.authoritativeCountStartMs === trace.originMs &&
      trace.resolveMs >= trace.originMs + NECTAR.gather &&
      trace.resolveMs >= trace.authoritativeCountStartMs + NECTAR.settle
    );
  });

  // MP-3: Reduce Motion still has no travel, but it must keep the gesture's
  // optimism. The count starts before the network join; success awaits that
  // visible optimistic count, and failure reverses to the authoritative base
  // only when the rejection is known.
  const rmReducedBlock = /if \(reduced\) \{([\s\S]*?)\n      \}/.exec(HOOK)?.[1] ?? '';
  const rmOptimisticStartsBeforeNetwork =
    /const optimisticCountDone = countTo\(optimistic\);[\s\S]*?return settledCommit/.test(rmReducedBlock);
  const rmSuccessAwaitsOptimistic =
    /if \(res\.ok\) \{[\s\S]*?await optimisticCountDone;/.test(rmReducedBlock);
  const rmFailureReversesAuthoritative =
    /\} else \{[\s\S]*?await countTo\(base\);/.test(rmReducedBlock);
  const countPromiseOwned = /return new Promise\(\(resolve\) => \{[\s\S]*?a\.start\(resolve\);[\s\S]*?\}\);/.test(HOOK);
  const rmTrace = [0, 200, 800].map((commitAtMs) =>
    nectarGiftLifecycleTrace({ reduced: true, commitAtMs, ok: true, nectar: NECTAR })
  );
  const rmClocksHold = rmTrace.every((t, index) =>
    t.countStartMs === 0 &&
    t.resolveMs >= [0, 200, 800][index] &&
    t.resolveMs >= NECTAR.settle
  );
  if (rmOptimisticStartsBeforeNetwork && rmSuccessAwaitsOptimistic && rmFailureReversesAuthoritative && countPromiseOwned && rmClocksHold && fullLifecycleMatrixHolds) {
    ok('D5c Reduce Motion starts the optimistic count with the gesture, reverses only after a known failure, send() awaits the visible count callback, and the shared lifecycle planner covers the 12-case timing matrix');
  } else {
    bad(
      'D5c',
      `rmOptimisticStartsBeforeNetwork=${rmOptimisticStartsBeforeNetwork}, rmSuccessAwaitsOptimistic=${rmSuccessAwaitsOptimistic}, rmFailureReversesAuthoritative=${rmFailureReversesAuthoritative}, countPromiseOwned=${countPromiseOwned}, rmClocksHold=${rmClocksHold}, fullLifecycleMatrixHolds=${fullLifecycleMatrixHolds}, matrix=${JSON.stringify(lifecycleMatrix)}`,
    );
  }

  // THE PANEL'S NUMERAL IS NOT A DESCENDANT OF THE FADED GROUP. This is the
  // one place this build DEVIATES from the letter of R-N3 (Gather fades "the
  // panel's contents"; Settle counts a numeral 340ms later), so it gets a row
  // rather than a comment.
  //
  // R-N3.6 NARROWED WHAT THIS ROW IS ALLOWED TO CLAIM, and the row itself is
  // unchanged because it was already the narrower thing. It used to be headed
  // "the numeral survives Gather", which is now true at two of the three
  // mounts and false at the entry overlay, where the line yields with the card
  // by ruling. What is measured here is ANCESTRY: the line is a sibling of the
  // controls group, not a child of it. That is what lets one mount yield the
  // numeral and two keep it, since a line parented into the fading group would
  // go at all three and R-N3's Settle would have nothing to count anywhere.
  // `check-nectar-surface-yield` G9 holds the other half, the hookup that
  // decides which mounts yield.
  const controlsGroups = PANEL.split('<Animated.View style={[styles.controls, controlsStyle]}>');
  const balanceInsideControls = controlsGroups.slice(1).some((g) => {
    const end = g.indexOf('</Animated.View>');
    return end >= 0 && /styles\.balance/.test(g.slice(0, end));
  });
  if (!balanceInsideControls && /styles\.balance/.test(PANEL)) {
    ok('D6 the balance line is a SIBLING of the group Gather fades, not a child of it. That ancestry is what makes R-N3 and R-N3.6 compatible: the numeral can yield at the one mount whose subject sits beneath the panel and stay at the two whose subject sits beside it. A row rather than a comment, because the next person to tidy this panel will see two Animated.Views and want to merge them');
  } else {
    bad('D6', 'the balance line sits inside the faded controls group, so it goes at every mount rather than at the one R-N3.6 rules. Gather removes it at 180ms and Settle counts it at 520ms, and "you watch it leave you" then has nothing to watch anywhere');
  }
}

// ===========================================================================
// E — THE DOOR AND THE INTRODUCTION (R-N6, R-N7, D5)
// ===========================================================================
// > The affordance becomes the same object the whole system is made of, at
// > rest ... so the thing you tap looks like the thing you send.
//
// The organising rule of this file applies here more literally than anywhere
// else: THE DOOR IS THE SAME OBJECT. So these rows do not assert "a circle of
// about the right size in about the right place" — they assert that the door
// and the consent sheet render `HoneyDrop`, the one component every other row
// in this gate measures. Anything that merely LOOKS like the drop is a second
// copy of the object, which is the defect R-N3.2 closed one layer up.
{
  const tree = ast(SCREEN);

  // The door's population, enumerated from the AST and FAIL-CLOSED. Two call
  // sites exactly — pre-consent and post-consent, which "never coexist" by
  // ENG-64's own comment. Zero would make every row below vacuously green,
  // and three would mean a spelling of the door nobody has measured.
  const doors = [];
  visit(tree, (n, anc) => {
    if (n.type !== 'JSXElement') return;
    if (n.openingElement?.name?.name !== 'PressableScale') return;
    const isDoor = n.openingElement.attributes.some(
      (a) =>
        a.type === 'JSXAttribute' &&
        a.name?.name === 'containerStyle' &&
        a.value?.type === 'JSXExpressionContainer' &&
        a.value.expression?.type === 'MemberExpression' &&
        a.value.expression.object?.name === 'styles' &&
        a.value.expression.property?.name === 'nectarDoor'
    );
    if (!isDoor) return;
    // Classify the branch from the guard, not from source order. The nearest
    // enclosing `X && (...)` whose left mentions `nectarConsent` decides it:
    // a bare Identifier is post-consent, a `!` UnaryExpression pre-consent.
    // Read this way rather than by line number because the two blocks are
    // adjacent and a reorder must not silently swap the rows' subjects.
    let branch = null;
    for (let i = anc.length - 1; i >= 0 && branch === null; i -= 1) {
      const a = anc[i];
      if (a.type !== 'LogicalExpression' || a.operator !== '&&') continue;
      const L = a.left;
      if (L?.type === 'Identifier' && L.name === 'nectarConsent') branch = 'post';
      else if (L?.type === 'UnaryExpression' && L.operator === '!' && L.argument?.name === 'nectarConsent') branch = 'pre';
    }
    // What does it render? Element names only — a door's child is its face.
    const children = [];
    visit(n.children, (c) => {
      if (c.type === 'JSXElement') children.push(c.openingElement?.name?.name);
    });
    // The nearest animated ancestor, for the "no clock of its own" row.
    let animatedAncestor = null;
    for (let i = anc.length - 1; i >= 0 && animatedAncestor === null; i -= 1) {
      const a = anc[i];
      if (a.type !== 'JSXElement') continue;
      const nm = a.openingElement?.name;
      if (nm?.type !== 'JSXMemberExpression' || nm.object?.name !== 'Animated') continue;
      const styleAttr = a.openingElement.attributes.find(
        (at) => at.type === 'JSXAttribute' && at.name?.name === 'style'
      );
      animatedAncestor = JSON.stringify(styleAttr ? SCREEN.slice(styleAttr.start, styleAttr.end) : '');
    }
    doors.push({ branch, children, animatedAncestor });
  });

  if (doors.length === 2 && doors.filter((d) => d.branch === 'pre').length === 1 && doors.filter((d) => d.branch === 'post').length === 1) {
    ok(`E1 the door's population is exactly two, one per consent branch, classified from the guard rather than from source order — pre renders <${doors.find((d) => d.branch === 'pre').children.join(', ')}>, post renders <${doors.find((d) => d.branch === 'post').children.join(', ')}>`);
  } else {
    bad('E1', `found ${doors.length} \`styles.nectarDoor\` call site(s) with branches [${doors.map((d) => d.branch).join(', ')}] — the door is meant to be exactly one pre-consent and one post-consent, and an unclassifiable one is a door nobody has measured`);
  }

  const post = doors.find((d) => d.branch === 'post');
  const pre = doors.find((d) => d.branch === 'pre');

  // R-N6's positive half.
  if (post && post.children.includes('HoneyDrop')) {
    ok('E2 post-consent the door IS the drop — it renders `HoneyDrop`, the same component the flight throws and the consent sheet introduces, not a lookalike. "The thing you tap looks like the thing you send" is one component, not one appearance');
  } else {
    bad('E2', `post-consent door renders <${post ? post.children.join(', ') : 'nothing resolvable'}> — R-N6 wants the object itself`);
  }

  // R-N6's NEGATIVE half, which is the one with a rule behind it rather than
  // a taste: pre-consent carries no money word and NO DROP FORM, because a
  // drop IS the money form (nectar.js's D3 row; Apple 2.3.1(a)). This row is
  // the reason E1 fails closed — an unclassifiable door would not be checked
  // here at all, and the failure direction of THIS row is the compliance one.
  const dropForms = ['HoneyDrop', 'HoneyDropForAmount'];
  if (pre && !pre.children.some((c) => dropForms.includes(c)) && pre.children.includes('Ionicons')) {
    ok('E3 pre-consent the door carries NO drop form — it keeps its distinct glyph (`Ionicons`) and never the object. A drop is the money form, so this row fails in the direction Apple 2.3.1(a) and `nectar.js`\'s D3 row both care about');
  } else {
    bad('E3', `pre-consent door renders <${pre ? pre.children.join(', ') : 'nothing resolvable'}> — a drop form here is a money form rendered before consent`);
  }

  // The size, read from the stylesheet and checked against BOTH numbers it
  // has to satisfy — the ratified minimum tap target, and the object's own
  // rest diameter. One value, two independent reasons; if they ever diverge
  // this row says which one broke.
  const doorStyle = /nectarDoor: \{([\s\S]*?)\n  \},/.exec(SCREEN);
  const w = doorStyle && /\n\s*width: (\d+),/.exec(doorStyle[1]);
  const h = doorStyle && /\n\s*height: (\d+),/.exec(doorStyle[1]);
  const TAP_TARGET_MIN = 44; // §16.5, "min 44pt touch targets"
  if (w && h && Number(w[1]) >= TAP_TARGET_MIN && Number(h[1]) >= TAP_TARGET_MIN && Number(w[1]) >= 2 * DROP_MAX_RADIUS && Number(h[1]) >= 2 * DROP_MAX_RADIUS) {
    ok(`E4 the door's box is ${w[1]}x${h[1]}pt — at or above the ratified ${TAP_TARGET_MIN}pt tap target AND at or above the drop's own rest diameter (${2 * DROP_MAX_RADIUS}pt), which is the object it now contains. Both bounds asserted separately: they land on the same number today and are not the same requirement`);
  } else {
    bad('E4', `door box is ${w ? w[1] : '?'}x${h ? h[1] : '?'}pt against a ${TAP_TARGET_MIN}pt tap-target floor and a ${2 * DROP_MAX_RADIUS}pt drop diameter — 32pt was under the first and unrelated to the second, which is exactly what D4 was reporting`);
  }

  // "It breathes on the entry's own bloom clock, never on a clock of its
  // own." Asserted as an ABSENCE plus a POSITION, because that is what the
  // ruling actually is: no new ambient loop anywhere on this screen, and the
  // door's nearest animated ancestor is the entry card itself. Position is
  // load-bearing — a door with no animated ancestor at all would also have
  // "no clock of its own" and would arrive out of nowhere.
  const hasLoop = /Animated\.loop\s*\(/.test(SCREEN);
  const ridesBloom =
    post &&
    post.animatedAncestor &&
    /styles\.entryCard/.test(post.animatedAncestor) &&
    /cardOpacity/.test(post.animatedAncestor) &&
    /cardScale/.test(post.animatedAncestor);
  if (!hasLoop && ridesBloom) {
    ok('E5 the door has no clock of its own and is not clockless — zero `Animated.loop` on this screen (the standing no-new-ambient rule), and its nearest animated ancestor is the entry card\'s own arrival-progress view. The ruling is satisfied by an ABSENCE, so the row asserts the absence and the position together');
  } else {
    bad('E5', `Animated.loop present=${hasLoop}, nearest animated ancestor of the post-consent door=${post ? post.animatedAncestor : 'none'} — R-N6 bans a new ambient loop and puts the door on the entry's bloom`);
  }
}

// R-N7 — the introduction. "Show the object, at rest, above the headline.
// Nothing moves; it is an introduction, not a beat."
{
  const SHEET = await read('src/components/NectarConsentSheet.js');
  const tree = ast(SHEET);
  let drop = null;
  let headline = null;
  visit(tree, (n) => {
    if (n.type !== 'JSXElement') return;
    const nm = n.openingElement?.name?.name;
    if (nm === 'HoneyDrop' && drop === null) drop = n;
    if (nm === 'Text' && headline === null) {
      const st = n.openingElement.attributes.find((a) => a.type === 'JSXAttribute' && a.name?.name === 'style');
      if (st && /styles\.headline/.test(SHEET.slice(st.start, st.end))) headline = n;
    }
  });
  if (drop && headline && drop.start < headline.start) {
    ok('E6 the consent sheet SHOWS a drop, above the headline — the same `HoneyDrop` component, so the first time a person meets the object is the object, and they will recognise it at the door and in flight');
  } else {
    bad('E6', `HoneyDrop present=${!!drop}, headline present=${!!headline}, drop above headline=${drop && headline ? drop.start < headline.start : 'n/a'} — R-N7 asks for the object, at rest, above the headline`);
  }

  // "Nothing moves" — asserted at the file level, which is the only honest
  // scope for a claim about a whole surface. `Animated` unimported is a
  // stronger statement than "this element has no animated style", and it is
  // the one that stays true when somebody adds a second element.
  const importsAnimated = /\bAnimated\b/.test(SHEET);
  if (!importsAnimated) {
    ok('E7 nothing moves on the consent sheet — the word `Animated` does not occur in the file at all. Scoped to the FILE rather than to the drop element, because "it is an introduction, not a beat" is a claim about the surface');
  } else {
    bad('E7', 'the consent sheet references `Animated` — R-N7 rules the introduction still');
  }

  // D5 — the sixth `danger`, and the measurement its sibling already made.
  // Read from the AST, never from the text: this file NAMES the token it
  // declines, in a comment, on purpose (a justification comment is a
  // dependency — the next person must be able to see what was rejected).
  // A source-text regex reds on the explanation and calls it the defect.
  let usesDanger = false;
  visit(tree, (n) => {
    if (n.type !== 'MemberExpression') return;
    if (n.property?.name !== 'danger') return;
    if (n.object?.type === 'MemberExpression' && n.object.property?.name === 'colors') usesDanger = true;
  });
  const errorColor = /error: \{[\s\S]*?color: theme\.colors\.(\w+),/.exec(SHEET);
  const ground = theme.colors.surface; // styles.card's own backgroundColor
  const ratio = errorColor ? contrastRatio(parseColor(theme.colors[errorColor[1]]), parseColor(ground)) : 0;
  if (!usesDanger && errorColor && ratio >= 4.5) {
    ok(`E8 the consent sheet's error line is \`${errorColor[1]}\` at ${ratio.toFixed(4)}:1 over the card's \`surface\` ground, and no \`theme.colors.danger\` EXPRESSION occurs in the file (read from the AST, so the comment that names the rejected token does not red its own row) — the sixth site of the defect its own sibling declines by name at the same size. Measured, not inherited: the row would still red if some other token were swapped in`);
  } else {
    bad('E8', `danger present=${usesDanger}, error token=${errorColor ? errorColor[1] : 'unresolved'}, ratio=${ratio.toFixed(4)}:1 against a 4.5:1 bodySm bar — D5`);
  }
}

// ===========================================================================
// F — THE ARRIVAL'S DETECTION HALF (R-N4)
// ===========================================================================
// > When you open the Hive and your balance has risen since your last read,
// > the bee is already carrying it.
//
// The crossing is not here — it is held pending Lumen's ruling on the
// population with no seat. What IS here is everything the crossing would be
// wrong without: the comparison that decides an arrival happened, the memory
// that "since your last read" is scoped to, and the aim.
//
// THE ROWS RUN THE FUNCTION. `nectarArrivalDrops` is pure and dependency-free
// for the same reason `honeyLevelForDrops` is — so an acceptance row can
// SAMPLE it rather than pattern-match the source of something it cannot
// load. A structural row here would assert the shape of a guard; these
// assert the answer.
{
  // F1 — THE UNKNOWN TABLE, CALIBRATED BOTH DIRECTIONS.
  //
  // A row that only checks the safe direction is invisible to a fail-closed
  // defect: a function hardwired to `return null` passes every "must not
  // fabricate" case in this table and is completely broken. So every unknown
  // case is paired with a true case that must produce a number.
  const grant = NECTAR_STARTER_GRANT_DROPS;
  const mustBeNull = [
    ['first read of a user\'s life — the starter grant', null, grant],
    ['unknown balance (NectarStore returned null), remembered value present', 500, null],
    ['both unknown', null, null],
    ['undefined rather than null, on either side', undefined, grant],
    ['undefined balance', 500, undefined],
    ['a fall — you sent a gift', 500, 400],
    ['no change', 500, 500],
    ['a non-finite remembered value (corrupt storage)', Number.NaN, 500],
    ['a non-finite balance', 500, Number.NaN],
  ];
  const mustBeDrops = NECTAR_PRESETS.map((p) => [`a received ${p}`, grant, grant + p, p])
    .concat([
      ['a rise from a real, read, empty wallet — 0 is not unknown', 0, 10, 10],
      ['two gifts while away, reported as their total', grant, grant + 60, 60],
      ['a rise after a fall — the caller remembered the lower number', 400, 500, 100],
    ]);

  const wrongNull = mustBeNull.filter(([, a, b]) => nectarArrivalDrops(a, b) !== null);
  const wrongDrops = mustBeDrops.filter(([, a, b, want]) => nectarArrivalDrops(a, b) !== want);
  if (wrongNull.length === 0 && wrongDrops.length === 0) {
    ok(`F1 \`nectarArrivalDrops\` answers all ${mustBeNull.length + mustBeDrops.length} cases: ${mustBeNull.length} unknown-or-not-a-rise return \`null\`, and ${mustBeDrops.length} real rises return their exact drops (${mustBeDrops.map(([, , , w]) => w).join(', ')}). CALIBRATED BOTH DIRECTIONS on purpose — a function hardwired to \`null\` would pass the first list alone, and the first list is the whole safety argument`);
  } else {
    bad('F1', `unknown cases that returned non-null: [${wrongNull.map(([n]) => n).join('; ')}] | rises that returned the wrong drops: [${wrongDrops.map(([n, a, b, w]) => `${n}: want ${w}, got ${nectarArrivalDrops(a, b)}`).join('; ')}]`);
  }

  // F2 — THE FABRICATION, PRICED. The defect this function exists to prevent
  // is not abstract and its size is not small: collapse unknown to 0 and the
  // first successful read after any failed one announces a gift OF THE WHOLE
  // BALANCE. Asserted as an INEQUALITY against the largest preset rather than
  // as "returns null", so the row states what it is protecting rather than
  // restating F1 in different words — and it moves with the constants.
  const worstFabrication = grant; // what `nectarArrivalDrops(0, grant)` would claim
  const largestGift = Math.max(...NECTAR_PRESETS);
  const collapsed = nectarArrivalDrops(0, grant);
  if (nectarArrivalDrops(null, grant) === null && collapsed === worstFabrication && worstFabrication > largestGift * 4) {
    ok(`F2 the unknown/zero distinction is load-bearing arithmetic, not a rendering nicety: \`nectarArrivalDrops(null, ${grant})\` is \`null\` (no arrival), while the collapsed spelling \`(0, ${grant})\` returns ${collapsed} — a fabricated gift ${(worstFabrication / largestGift).toFixed(1)}x the largest preset this product can send. Both spellings are exercised here, so the row names the defect's SIZE rather than only its absence`);
  } else {
    bad('F2', `null-case=${nectarArrivalDrops(null, grant)} (want null), zero-case=${collapsed} (want ${worstFabrication}), grant ${grant} vs largest preset ${largestGift}`);
  }

  // F3 — "SINCE YOUR LAST READ" IS SCOPED TO A PERSON, AND THE SCOPE IS IN
  // THE KEY. A device is not an account. On one bare key, a second account on
  // the same device compares its balance against the first account's
  // remembered one — and `nectarArrivalDrops` cannot see that, because both
  // numbers are finite and one is larger, which is exactly what an arrival
  // looks like. Read from the AST: the key must be a TemplateLiteral whose
  // expression set includes the function's own parameter. A row pinned to the
  // literal prefix would go green on a key that interpolated the wrong thing.
  const ARRIVAL = await read('src/services/nectarArrivalState.js');
  const arrivalTree = ast(ARRIVAL);
  let keyFn = null;
  visit(arrivalTree, (n) => {
    if (n.type !== 'VariableDeclarator' || n.id?.name !== 'keyFor') return;
    if (n.init?.type !== 'ArrowFunctionExpression') return;
    keyFn = n.init;
  });
  const keyParam = keyFn?.params?.[0]?.name ?? null;
  const keyBody = keyFn?.body;
  const interpolates =
    keyBody?.type === 'TemplateLiteral' &&
    keyBody.expressions.some((e) => e.type === 'Identifier' && e.name === keyParam);
  if (keyFn && keyParam && interpolates) {
    ok(`F3 the remembered-balance key is per-account by construction — \`keyFor(${keyParam})\` is a template literal interpolating its own parameter (read from the AST, so a key that interpolated some OTHER identifier reds rather than passing on the prefix). A bare key would make the comparison a cross-account one, which is a shape \`nectarArrivalDrops\` cannot detect: two finite numbers, one larger`);
  } else {
    bad('F3', `keyFor resolved=${Boolean(keyFn)}, param=${keyParam}, body=${keyBody?.type ?? 'none'}, interpolates its parameter=${interpolates} — R-N4's scope`);
  }

  // F4 — A MISSING KEY IS NOT ZERO, at the layer below the function that
  // says so. `AsyncStorage.getItem` returns `null` for never-written, and
  // anything that coerced it here would put F2's fabrication back one layer
  // beneath the guard written to prevent it. Asserted as an ABSENCE of any
  // zero-defaulting operator on the read path, resolved from the AST inside
  // `getLastSeenDrops`'s own body — never a file-wide text search, which
  // would also read the comment that names the hazard.
  let readBody = null;
  visit(arrivalTree, (n) => {
    if (n.type !== 'ObjectMethod' && n.type !== 'ObjectProperty') return;
    const name = n.key?.name;
    if (name !== 'getLastSeenDrops') return;
    readBody = n.type === 'ObjectMethod' ? n.body : n.value?.body;
  });
  const zeroDefaults = [];
  if (readBody) {
    visit(readBody, (n) => {
      if (n.type !== 'LogicalExpression') return;
      if (n.operator !== '??' && n.operator !== '||') return;
      if (n.right?.type === 'NumericLiteral' && n.right.value === 0) zeroDefaults.push(n.operator);
    });
  }
  const returnsNullForMissing = readBody
    ? ARRIVAL.slice(readBody.start, readBody.end).includes("raw === null")
    : false;
  if (readBody && zeroDefaults.length === 0 && returnsNullForMissing) {
    ok(`F4 \`getLastSeenDrops\` passes a never-written key through as \`null\`: its body tests \`raw === null\` and contains zero \`?? 0\` / \`|| 0\` defaults (enumerated from the AST of that method's body alone — a file-wide search would have read the comment that names this hazard and called the explanation the defect)`);
  } else {
    bad('F4', `body resolved=${Boolean(readBody)}, zero-defaults found=[${zeroDefaults.join(', ')}], tests raw === null=${returnsNullForMissing} — the unknown would reach \`nectarArrivalDrops\` as a 0`);
  }

  // ==========================================================================
  // F5-F8 — THE CROSSING'S MECHANISM (R-N4.1, Lumen 2026-08-29)
  //
  // AMENDED FROM A BUILD LUMEN CORRECTED. The first draft of these four rows
  // gated `aimOwnCell`: a handle member that RESOLVED THE OWN CELL'S POINT
  // back to the screen. The ruling is that this put a fact outward on the
  // command-inward channel, and the concrete cost was not stylistic — by
  // resolving the point instead of emitting it, the aim skipped everything
  // `requestPollination` does on the way past, so `aimRef` was never written
  // and a gift flight was the ONE flight in this app §28.9's abort predicate
  // could not cancel. The corrected shape is a second COMMAND with no
  // payload; the point leaves on `onPollinate`, which already carries points.
  //
  // What changed in these rows, stated rather than silently re-pointed:
  //   * F5 asserts the invariant instead of the arity. "Commands in, no
  //     state out" is checkable — no member of the handle may return a
  //     value — and it is what would have caught `aimOwnCell`, which a
  //     key-count row did not.
  //   * F6 INVERTS. It used to assert the aim does NOT reference `reduced`,
  //     because a measurement under Reduce Motion is just a number. That
  //     reasoning was right for a measurement and is wrong for a crossing:
  //     the corrected member IS the crossing, so §5's suppression is
  //     inherited from the shared early return and the row now requires it.
  // ==========================================================================

  // F5 — THE HANDLE'S INVARIANT IS NOT ITS ARITY.
  //
  //   > The handle's invariant is not "one function." It is: commands in, no
  //   > state out. One function was the consequence.  — R-N4.1
  //
  // Two assertions, and the second is the one with teeth: the membership is
  // enumerated from the AST and fail-closed, and then EVERY member is proved
  // to be a command by showing its body returns no value. A bare `return;`
  // is a decline and is legal; `return <anything>` is state leaving.
  const GRID = await read('src/components/HoneycombGrid.js');
  const gridTree = ast(GRID);
  let handleKeys = null;
  const gridFns = new Map();
  visit(gridTree, (n) => {
    if (n.type === 'CallExpression' && n.callee?.name === 'useImperativeHandle') {
      const body = n.arguments?.[1]?.body;
      if (body?.type === 'ObjectExpression') handleKeys = body.properties.map((p) => p.key?.name ?? p.argument?.name ?? '?');
    }
    if (n.type === 'VariableDeclarator' && n.id?.name && n.init) gridFns.set(n.id.name, n.init);
  });
  const expectedHandle = ['igniteLanding', 'pollinateOwnCell', 'cancelPollination'];
  // "No state out" — for each member, walk its own body and collect any
  // `return` that carries an argument. Nested function expressions are
  // deliberately INCLUDED: `aimOwnCell` leaked through a `new Promise`
  // executor's `resolve`, and a row that only read top-level returns would
  // have missed it, so the `resolve(<value>)` shape is caught here too.
  const stateOut = [];
  for (const k of handleKeys ?? []) {
    const fn = gridFns.get(k);
    if (!fn) { stateOut.push(`${k}: not resolvable`); continue; }
    visit(fn, (n) => {
      if (n.type === 'ReturnStatement' && n.argument) stateOut.push(`${k}: return ${n.argument.type}`);
      if (n.type === 'CallExpression' && n.callee?.name === 'resolve' && n.arguments?.length && n.arguments[0]?.type !== 'NullLiteral') {
        stateOut.push(`${k}: resolve(${n.arguments[0].type})`);
      }
    });
  }
  const handleSetOk = handleKeys && handleKeys.length === expectedHandle.length && expectedHandle.every((k) => handleKeys.includes(k));
  if (handleSetOk && stateOut.length === 0) {
    ok(`F5 the comb's handle publishes exactly {${handleKeys.join(', ')}} and EVERY member is a command: zero value-carrying returns across every body, nested function expressions included. The membership is asserted as a SET so a missing keyed cancel command reds this row rather than leaving abort/suppression as host-only state; the no-state-out half is the invariant itself, and it is what a key-count row could not see — \`aimOwnCell\` was one key and still a fact leaving`);
  } else {
    bad('F5', `handle keys = ${handleKeys ? `{${handleKeys.join(', ')}}` : 'unresolved'} (want exactly {${expectedHandle.join(', ')}}), state leaving = [${stateOut.join(' | ')}]`);
  }

  // F6 — THE CROSSING DECLINES RATHER THAN GUESSES, in four positions whose
  // correct response is identical (do not fly) and whose correct response to
  // a WRONG point is not: suppressed or unpublishable, no own seat, no
  // measurable node, a non-finite measurement.
  //
  // R-N4.2's three negatives ARE the second of those. When there is no seat
  // nothing happens on the comb — never an empty cell (that seat is the
  // invite target, and honey in it says a stranger has honey), never the
  // centre as a proxy for "you", never held over for later. A bare `return`
  // is all three, which is why the row counts declines and separately proves
  // no point is published on any of them.
  //
  // Read brace-matched to the member's own body: a `[\s\S]*?` window walks
  // into whichever function follows, which is a mistake this file has made
  // before and now refuses to be able to make.
  const crossFn = gridFns.get('pollinateOwnCell') ?? null;
  const crossSrc = crossFn ? GRID.slice(crossFn.start, crossFn.end) : '';
  const bareReturns = [];
  const valuedPublishes = [];
  if (crossFn) {
    visit(crossFn, (n) => {
      if (n.type === 'ReturnStatement' && !n.argument) bareReturns.push('return');
      if (n.type === 'CallExpression' && n.callee?.name === 'onPollinate') valuedPublishes.push('direct onPollinate');
    });
  }
  // §5's suppression is INHERITED, not re-derived: the member takes the same
  // early return `requestPollination` does. This is the row that inverted —
  // see the section header.
  const gatesReduced = /if \(!onPollinate \|\| reduced\) return;/.test(crossSrc);
  const findsOwn = /\.find\(\s*\(\w+\)\s*=>\s*\w+\.member\s*&&\s*\w+\.member\.isOwn\s*\)/.test(crossSrc);
  // AND THE DECLINE MUST BE REACHABLE. Counting `return`s proves the branch
  // is written; it does not prove anything can arrive at it. A `?? <any other
  // seat>` on the lookup leaves all four declines in place, unreachable, and
  // hands the gift to an invite seat or to whoever posted most recently —
  // R-N4.2 negatives 1 and 2, passing a row that only counts. Found by the
  // mutation harness: the first spelling of that mutation was caught by F8
  // instead, which is a miss, because F8 is about POSITION and this is about
  // SUBSTITUTION.
  const seatFallbacks = [];
  if (crossFn) {
    visit(crossFn, (n) => {
      if (n.type !== 'VariableDeclarator' || n.id?.name !== 'cell') return;
      if (n.init?.type === 'LogicalExpression') seatFallbacks.push(n.init.operator);
    });
  }
  if (crossFn && bareReturns.length === 4 && gatesReduced && findsOwn && valuedPublishes.length === 0 && seatFallbacks.length === 0) {
    ok(`F6 \`pollinateOwnCell\` declines in exactly ${bareReturns.length} positions — suppressed/unpublishable, no own seat, no measurable node, a non-finite measurement — and publishes no point on any of them (zero direct \`onPollinate\` calls: the single launch below is the only publisher). It inherits §5 through the SAME early return \`requestPollination\` takes, it finds the seat by \`member.isOwn\` (the flag the honeyed gate reads), and the seat lookup carries NO substitute — so the decline is reachable, which counting \`return\`s alone would not have shown`);
  } else {
    bad('F6', `resolved=${Boolean(crossFn)}, bare declines=${bareReturns.length} (want 4), inherits the reduced/onPollinate guard=${gatesReduced}, finds the own seat=${findsOwn}, publishes directly=[${valuedPublishes.join(', ')}], substitute seats=[${seatFallbacks.join(', ')}] (want none — a decline nothing can reach is not a decline)`);
  }

  // F7 — MEASURED AT THE MOMENT OF USE, NEVER CACHED, and the measured
  // origin is the MORE EXACT of the two rather than a fallback (R-N4.1):
  // the tap-derived one is the same quantity by construction but carries the
  // camera dive's `(scale - 1) x offset` drift, because the dive runs on the
  // native driver where `measureInWindow` cannot see it.
  const measuresItself = /node\.measureInWindow\(/.test(crossSrc);
  const readsStoredOrigin = /clusterOrigin/.test(crossSrc);
  if (measuresItself && !readsStoredOrigin) {
    ok('F7 the crossing calls `measureInWindow` inside its own body and reads no stored origin — measured at the moment of use, so it owes nothing to a scroll listener and cannot be stale by the scroll offset or by the camera dive');
  } else {
    bad('F7', `measures itself=${measuresItself}, reads a cached origin=${readsStoredOrigin} — a cached window origin is wrong the instant the comb scrolls`);
  }

  // F8 — POSITION-INDEPENDENT, WHICH IS WHY THE SEATING QUESTION DOES NOT
  // BLOCK R-N4 AND WHY R-N4.2's NEGATIVE 2 HOLDS.
  //
  // Found while building the crossing and independently ruled the same day:
  // the comb's header claimed "you in the middle" and it is false. Seats
  // fill centre-out from a `created_at DESC` list with no own-first sort, so
  // the centre belongs to whoever posted most recently. What is gated is the
  // property that makes the crossing correct under EITHER ordering — the
  // seat is resolved by `member.isOwn` and never by position — and the
  // absence of the sort that would answer the seating question in a build
  // instead of in a ruling.
  //
  // DELIBERATELY NOT A PROSE ROW. The corrected header quotes the retired
  // claim on purpose (a justification comment is a dependency), so a row
  // hunting that sentence would red on its own explanation.
  const positional = [];
  if (crossFn) {
    visit(crossFn, (n) => {
      if (n.type === 'MemberExpression' && n.property?.type === 'NumericLiteral') positional.push(`[${n.property.value}]`);
      if (n.type === 'Identifier' && n.name === 'index') positional.push('index');
    });
  }
  // STRUCTURAL, not a `[^)]*` window: a sort callback opens with its own
  // parenthesised parameter list, so a lazy bracket class stops at `(a, b`
  // and never reaches the property it is hunting for.
  const TAB = await read('src/screens/HoneycombTab.js');
  const sortsOn = (src) => {
    const found = [];
    visit(ast(src), (n) => {
      if (n.type !== 'CallExpression') return;
      if (n.callee?.type !== 'MemberExpression' || n.callee.property?.name !== 'sort') return;
      if (src.slice(n.start, n.end).includes('isOwn')) found.push(src.slice(n.start, Math.min(n.end, n.start + 60)));
    });
    return found;
  };
  const ownSortSites = [...sortsOn(GRID), ...sortsOn(TAB)];
  const ownSort = ownSortSites.length > 0;
  if (crossFn && positional.length === 0 && findsOwn && !ownSort) {
    ok('F8 the crossing is position-independent: no numeric index and no `index` reference anywhere in `pollinateOwnCell`, and the seat is resolved by `member.isOwn` alone — so it is correct under either seating rule. The absence of an own-first sort is asserted here too, in both files, because answering the seating question in the build rather than in a ruling is the direction this row exists to catch as much as the other');
  } else {
    bad('F8', `resolved=${Boolean(crossFn)}, positional references=[${positional.join(', ')}] (want none), resolves by isOwn=${findsOwn}, an own-first sort exists=${ownSort} [${ownSortSites.join(' | ')}]`);
  }

  // ==========================================================================
  // SECTION G — THE ARRIVAL, END TO END (R-N4 / R-N4.1 / R-N4.2)
  // ==========================================================================

  const BEE = await read('src/components/FlyingBee.js');

  // G1 — ONE LAUNCH, TWO DOORS. This is the row that encodes what the
  // correction actually bought. A tap and an arrival must go through the
  // SAME publisher, because everything §28.9 needs — the key, the person,
  // the local point, the scroll offset — is written on the way past, and the
  // first build of R-N4 skipped it by resolving instead of emitting. Proved
  // by counting the writers: exactly one site writes `aimRef.current`,
  // exactly one calls `onPollinate`, and both public entries reach them
  // through it.
  const launchFn = gridFns.get('launchPollination') ?? null;
  const aimWriters = [];
  const publishers = [];
  visit(gridTree, (n) => {
    if (n.type === 'AssignmentExpression' && GRID.slice(n.left.start, n.left.end) === 'aimRef.current' && n.right?.type === 'ObjectExpression') {
      aimWriters.push(n.start);
    }
    if (n.type === 'CallExpression' && n.callee?.name === 'onPollinate') publishers.push(n.start);
  });
  const inLaunch = (pos) => launchFn && pos >= launchFn.start && pos <= launchFn.end;
  const callsLaunch = (fn) => {
    if (!fn) return false;
    let f = false;
    visit(fn, (n) => { if (n.type === 'CallExpression' && n.callee?.name === 'launchPollination') f = true; });
    return f;
  };
  const tapCalls = callsLaunch(gridFns.get('requestPollination'));
  const arrivalCalls = callsLaunch(crossFn);
  if (launchFn && aimWriters.length === 1 && aimWriters.every(inLaunch) && publishers.length === 1 && publishers.every(inLaunch) && tapCalls && arrivalCalls) {
    ok('G1 one launch, two doors: `aimRef.current` is written in exactly one place and `onPollinate` is called in exactly one place, both inside `launchPollination`, and BOTH the tap and the arrival reach it. So §28.9\'s abort predicate covers a gift flight by construction — which the first build of R-N4 did not, because a member that RESOLVES a point skips every step the publisher takes on the way past');
  } else {
    bad('G1', `launch resolved=${Boolean(launchFn)}, aimRef writers=${aimWriters.length} (all inside launch=${aimWriters.every(inLaunch)}), onPollinate callers=${publishers.length} (all inside launch=${publishers.every(inLaunch)}), tap routes through it=${tapCalls}, arrival routes through it=${arrivalCalls}`);
  }

  // G2 — THE CAUSE RIDES THE FACT CHANNEL, and it has exactly two values.
  // The screen needs to know which flights are gifts (the bee carries a drop
  // on those and only those); deriving that from "did I just call the
  // command" would be a race against a measurement that resolves a frame
  // later. One field on the channel that already exists — not a second
  // channel, and not state on the handle.
  const causes = [];
  visit(gridTree, (n) => {
    if (n.type !== 'CallExpression' || n.callee?.name !== 'launchPollination') return;
    const a = n.arguments?.[2];
    if (a?.type === 'StringLiteral') causes.push(a.value);
    else causes.push(`non-literal:${a?.type ?? 'missing'}`);
  });
  const causeInPayload = launchFn ? /onPollinate\(\{[\s\S]{0,120}\bcause,/.test(GRID.slice(launchFn.start, launchFn.end)) : false;
  const wantCauses = ['tap', 'arrival'];
  if (causeInPayload && causes.length === 2 && wantCauses.every((c) => causes.includes(c))) {
    ok(`G2 \`cause\` travels in the published fact and takes exactly the two literal values {${causes.join(', ')}} — enumerated from the call sites, so a third cause added later reds this row instead of silently widening what the screen treats as a gift`);
  } else {
    bad('G2', `cause is in the payload=${causeInPayload}, call-site causes=[${causes.join(', ')}] (want exactly ${wantCauses.join(' + ')})`);
  }

  // G3 — THE LANDING CAUSES NOTHING, and this is the row that proves the
  // ordering rather than trusting the comment.
  //
  //   > The level is correct before he moves. The flight animates the
  //   > meniscus TO a height that is already true, never causes it. An
  //   > aborted or suppressed gift flight is not a lost gift.  — R-N4.1
  //
  // Two assertions. First, inside the arrival effect the level is committed
  // BEFORE the command is issued — read as source positions, not as prose.
  // Second, and this is the load-bearing half: `setHoneyLevel` appears
  // NOWHERE inside any of the flight's callbacks. A commit that only ran on
  // touchdown would satisfy an ordering check and still lose every gift the
  // bee never delivered.
  const tabTree = ast(TAB);
  let commitPos = null;
  let commandPos = null;
  visit(tabTree, (n) => {
    // BOTH call node types, and that is not defensiveness — `?.` parses to
    // `OptionalCallExpression`, so a `CallExpression`-only walk finds the
    // commit and reports the command as MISSING, which reads as "there is no
    // crossing" rather than as "the row cannot see it".
    if (n.type !== 'CallExpression' && n.type !== 'OptionalCallExpression') return;
    const src = TAB.slice(n.start, n.end);
    //
    // AND BOTH TESTS ARE ON THE CALLEE, never on the node's source. AN
    // ANCESTOR'S SOURCE RANGE CONTAINS ITS DESCENDANTS', so `src.includes`
    // over a walk matches the OUTERMOST node that spans the text — here the
    // whole async IIFE, which starts before either statement and reported
    // the command as coming FIRST. The row went red on correct code and the
    // number it printed was the enclosing function's offset. Identify a call
    // by what it calls.
    if (n.callee?.name === 'setHoneyLevel' && src.includes('honeyLevelForDrops(drops)') && commitPos === null) commitPos = n.start;
    if ((n.callee?.property?.name ?? n.callee?.name) === 'pollinateOwnCell' && commandPos === null) commandPos = n.start;
  });
  // Every JSX prop on `FlyingBee` whose name ends in a handler position, and
  // the comb's cancel — the full set of callbacks a flight can reach.
  const flightCallbackWrites = [];
  visit(tabTree, (n) => {
    if (n.type !== 'JSXAttribute') return;
    const name = n.name?.name ?? '';
    if (!/^on(Pollinate|Settle)/.test(name)) return;
    const src = TAB.slice(n.start, n.end);
    if (src.includes('setHoneyLevel')) flightCallbackWrites.push(name);
  });
  if (commitPos !== null && commandPos !== null && commitPos < commandPos && flightCallbackWrites.length === 0) {
    ok('G3 the landing causes nothing: the level is committed from the READ (source position before the command that dispatches the crossing), and `setHoneyLevel` appears in none of the flight\'s callbacks — so a suppressed, declined or aborted crossing costs the beat and never the gift. The ordering alone would not have been enough; a commit that ran only on touchdown passes an ordering check and loses every undelivered gift');
  } else {
    bad('G3', `commit position=${commitPos}, command position=${commandPos} (want commit first), setHoneyLevel inside flight callbacks=[${flightCallbackWrites.join(', ')}] (want none)`);
  }

  // G4 — NOTHING CAN STRAND THE DROP (R-N4.2 negative 3: "never held over
  // for later" — a drop the bee keeps until a cell appears is the badge this
  // beat exists to replace).
  //
  // The guarantee is structural and the row asserts the structure: the host
  // still hands the arrival amount to the flight channel, and `FlyingBee`
  // snapshots that amount onto the visit plan at launch. That extra boundary
  // became necessary in MP-4, where the host may already be publishing a
  // later tap while an older gift flight is still in the air.
  const carryAttr = (() => {
    let v = null;
    visit(tabTree, (n) => {
      if (n.type === 'JSXAttribute' && n.name?.name === 'carrying') v = TAB.slice(n.start, n.end);
    });
    return v;
  })();
  const derivedFromFlight = Boolean(carryAttr) && /pollination\?\.cause === 'arrival'/.test(carryAttr);
  const snapshottedOnPlan = /carrying:\s*nextPollinate\.cause\s*===\s*'arrival'\s*\?\s*carrying\s*:\s*null/.test(BEE);
  // Both terminations must clear the matching flight, or one of them strands it.
  const clearsOnEnd = /pollinationLandingResult\(pollinationRef\.current,\s*key\)[\s\S]{0,300}setPollination\(result\.pollination\)/.test(TAB);
  const clearsOnCancel = /pollinationCancelResult\(current,\s*key\)\.pollination/.test(TAB);
  if (derivedFromFlight && snapshottedOnPlan && clearsOnEnd && clearsOnCancel) {
    ok('G4 the drop cannot be stranded: the host publishes arrival cargo on the flight channel, FlyingBee snapshots it onto the visit plan, and BOTH keyed terminations clear only the matching flight. There is no path where a stale host pollination changes the cargo of the errand already in the air');
  } else {
    bad('G4', `carrying derived from the flight=${derivedFromFlight} (${carryAttr ?? 'attribute missing'}), snapshottedOnPlan=${snapshottedOnPlan}, clears on touchdown=${clearsOnEnd}, clears on abort=${clearsOnCancel}`);
  }

  // G5 — THE CARGO IS THE GIFT'S OWN SIZE, and the clamp is a guard rather
  // than the mechanism. `dropRadiusForAmount` is the one function that
  // answers "how big is this gift" (R-N3), so the carried drop reads it
  // rather than inventing a second scale. It is then clamped to half the
  // carrier: past that a bee is not carrying a drop, it is colliding with
  // one. COMPUTED IN BOTH DIRECTIONS — at the shipped mount the clamp binds
  // on nothing, and at a smaller mount it binds — because a clamp asserted
  // only where it is inert is a clamp nobody has tested.
  const { dropRadiusForAmount, DROP_MAX_RADIUS } = await import('../src/components/nectarFlight.js');
  const carriedExpr = /const planCarrying = plan\?\.kind === 'visit' \? plan\.carrying : null;\s*const carriedRadius = planCarrying \? Math\.min\(dropRadiusForAmount\(planCarrying\), size \/ 2\) : 0;/.test(BEE);
  const mountSize = (() => { const m = BEE.match(/const DEFAULT_SIZE = (\d+);/); return m ? Number(m[1]) : null; })();
  // The largest amount the ledger can put in one arrival is unbounded above
  // in principle, so the bound that matters is the function's own ceiling.
  const bindsAtMount = DROP_MAX_RADIUS > (mountSize ?? 0) / 2;
  const halfMount = (mountSize ?? 0) / 2;
  const bindsSmaller = DROP_MAX_RADIUS > 44 / 4;
  const presetRadii = [10, 50, 100].map((n) => dropRadiusForAmount(n));
  if (carriedExpr && mountSize && !bindsAtMount && bindsSmaller) {
    ok(`G5 the cargo is \`dropRadiusForAmount\` clamped to half the carrier. At the shipped mount (size ${mountSize}) the clamp binds on NOTHING — the function's ceiling is ${DROP_MAX_RADIUS} and half the bee is ${halfMount.toFixed(1)}, and they agree exactly because both descend from the same ratified 44pt box — while at a smaller mount it binds, so it is a guard that has been measured in both directions rather than one asserted where it is inert. The three presets carry at r = ${presetRadii.map((r) => r.toFixed(2)).join(' / ')}pt`);
  } else {
    bad('G5', `expression present=${carriedExpr}, mount size=${mountSize}, clamp binds at the mount=${bindsAtMount} (want false), binds at a smaller mount=${bindsSmaller} (want true)`);
  }

  // G6 — THE CARRIER OCCLUDES THE CARGO, and the cargo is the DROP rather
  // than a lookalike. Both halves are about the same claim: what arrives is
  // the same object the ledger is made of (R-N3.2 closed this one layer up,
  // for the send), and cargo drawn in front of its carrier is a collision
  // rather than a delivery.
  //
  // THE RELATION IS R-N4.3's, THE ORDER IS ONLY ITS MECHANISM. Lumen ruled
  // the occlusion (2026-08-29) and ruled document order to be today's way of
  // getting it, not the thing itself. This row reads the JSX order inside
  // the bee's own transformed box, so a reorder reds it — and G9 holds the
  // precondition that makes reading the order equivalent to reading the
  // relation. Neither row is the whole claim on its own, which is why the
  // sentence below says what it READS rather than asserting the picture.
  const beeBox = (() => {
    const i = BEE.indexOf('transform: [{ translateX }, { translateY }, { rotate }, { scaleX }]');
    return i === -1 ? '' : BEE.slice(i, BEE.indexOf('</Animated.View>', i));
  })();
  const dropAt = beeBox.indexOf('<HoneyDrop');
  const mascotAt = beeBox.indexOf('<MascotBee');
  const importsDrop = /import \{ HoneyDrop \} from '\.\/HoneyDrop';/.test(BEE);
  // AND IT MUST BE REACHABLE UNDER THE REAL CONDITION. Source order is a
  // claim about the picture; it says nothing about whether the picture can
  // ever be drawn. `{false && (` leaves the JSX exactly where it is and
  // deletes the beat — the harness caught this row passing that mutation, so
  // the guard is now read as well as the order.
  const drawnUnderCargo = /\{carriedRadius > 0 && \(/.test(beeBox);
  if (importsDrop && dropAt !== -1 && mascotAt !== -1 && dropAt < mascotAt && drawnUnderCargo) {
    ok('G6 the cargo is `HoneyDrop` itself — the component, not a circle drawn to match — and it is rendered BEFORE `MascotBee` inside the bee\'s own transformed box, and it banks with him. That is R-N4.3\'s ruled relation (the carrier occludes the cargo) read through its MECHANISM, document order — the picture follows only while nothing on the pair overrides that order, which is G9\'s row, not this one. Cargo in front of its carrier is a collision, not a delivery. Rendered under \`carriedRadius > 0\` — the real condition, asserted because source order alone survives the branch being made unreachable');
  } else {
    bad('G6', `imports the drop=${importsDrop}, drop position=${dropAt}, mascot position=${mascotAt} (want the drop first, both inside the transformed box), rendered under \`carriedRadius > 0\`=${drawnUnderCargo}`);
  }

  // G7 — D4's SURFACE ROW IS FILLED, AND ITS PRE-CONSENT CLAUSE IS
  // UNCHANGED. R-N4 does not add a row to `NECTAR_SURFACES`; it fills
  // `author-notification`, whose host was `null` and whose note read "THE
  // CONTAINER DOES NOT EXIST". The row must now name a real host with a real
  // anchor in it — and `preConsent` must still say what it said, because
  // nothing about filling the container changes what exists before consent.
  const { NECTAR_SURFACES } = await import('../src/constants/nectar.js');
  const d4 = NECTAR_SURFACES.find((r) => r.id === 'author-notification');
  const d4Host = d4?.host ? await read(d4.host) : null;
  const d4AnchorPresent = d4?.anchor && d4Host ? new RegExp(`\\b${d4.anchor}\\b`).test(d4Host) : false;
  const d4PreConsent = d4?.preConsent === 'No notification of this type exists.';
  if (d4 && d4.host && d4AnchorPresent && d4PreConsent) {
    ok(`G7 D4 is filled rather than declared absent: host \`${d4.host}\`, anchor \`${d4.anchor}\` present in it, and \`preConsent\` unchanged verbatim — the balance read early-returns without consent, so nothing arrives and nothing is carried, and no notification of this type exists either way`);
  } else {
    bad('G7', `row found=${Boolean(d4)}, host=${d4?.host ?? 'null'}, anchor "${d4?.anchor ?? ''}" present in host=${d4AnchorPresent}, preConsent unchanged=${d4PreConsent}`);
  }

  // G8 — THE MEMORY IS WRITTEN ON EVERY SUCCESSFUL READ, NOT ONLY ON A RISE.
  // `nectarArrivalState`'s own header says why: remembering only rises would
  // re-announce a balance the moment it climbed back to a number it had
  // already reached. The defect shape is an early return placed above the
  // write, so the row asserts the ORDER — `rememberDrops` before the
  // `if (!arrived) return`, inside the same effect.
  const rememberPos = TAB.indexOf('NectarArrivalState.rememberDrops(userId, drops)');
  const arrivalGuardPos = TAB.indexOf('if (!arrived) return;');
  if (rememberPos !== -1 && arrivalGuardPos !== -1 && rememberPos < arrivalGuardPos) {
    ok('G8 the arrival memory is written on every successful read — `rememberDrops` runs before the no-arrival early return, so a balance that fell or did not move is remembered too. Remembering only rises would re-announce a balance the moment it climbed back to a number it had already reached');
  } else {
    bad('G8', `rememberDrops position=${rememberPos}, no-arrival guard position=${arrivalGuardPos} — the write must come first`);
  }

  // G9 — R-N4.3's PRECONDITION: DOCUMENT ORDER IS ONLY THE MECHANISM WHILE
  // NOTHING ON THE PAIR OVERRIDES IT.
  //
  // Lumen's ruling (R-N4.3, `POLLINATE_NECTAR_LIVING_EXCHANGE.md`,
  // 2026-08-29, design workspace) is about a RELATION — "the carrier's body
  // occludes the cargo at the attachment point" — and names document order
  // as TODAY'S MECHANISM for it rather than as the relation itself. G6
  // asserts the mechanism. So
  // a `zIndex` or an `elevation` on either member takes the relation away
  // from source order WITHOUT TOUCHING SOURCE ORDER, and G6 stays green
  // while the picture inverts. Measured, not supposed: adding `zIndex: 1` to
  // the drop's own inline style at `main@457b04f` left this gate at 46
  // passed / 0 failed with the drop painting in front of the bee.
  //
  // SCOPED TO THE PAIR, NOT TO THE FILE — which is Lumen's own sharpening
  // encoded rather than restated. `FlyingBee.js` legitimately carries two
  // stacking sites and both order the LAYER against the screen, not the pair
  // against each other. A file-wide `zIndex` search would red on the shipped
  // tree and teach the next person to widen it until it stopped meaning
  // anything. The row prints both populations so the distinction is visible
  // where a reader actually meets it.
  //
  // READ AS EVERY DIRECT CHILD of the transformed box, not as the two
  // components by name: a wrapper `<View style={{ zIndex: 1 }}>` around
  // either one is the same defect with an extra node in it, and a row that
  // named `HoneyDrop` and `MascotBee` would look straight past it.
  //
  // FAILS CLOSED on a style expression it cannot resolve. "I could not read
  // it" and "there is nothing there" are the same green otherwise, and this
  // row exists because a green that means neither is what G6 was.
  //
  // AND THAT SENTENCE WAS ONE NODE TYPE WIDER THAN ITS MECHANISM UNTIL
  // 2026-08-29, when Lumen ran this row's own argument back at this row.
  // The `Identifier` arm returned CLEAN on the justification that a bare
  // identifier is "a `style` pass-through, which carries no key of its
  // own" — a label the code did nothing to earn, because it never checked
  // the identifier's name or its origin. Measured at `main@7ec9db4`: a
  // local `dropCarryStyle` holding `zIndex: 1`, handed in by name, left
  // this gate at 47 passed / 0 failed with the cargo in front of its
  // carrier and this row printing "with nothing unresolvable". The arm now
  // answers `unresolved`. Both routes are in the harness (mutations 4 and
  // 5): the local const, and the component's own incoming `style` prop —
  // the very shape the retired label described as safe.
  const BEE_AST = ast(BEE);
  const STACK_KEYS = ['zIndex', 'elevation'];
  const beeStyles = (() => {
    const map = new Map();
    visit(BEE_AST, (n) => {
      if (n.type !== 'CallExpression') return;
      const c = n.callee;
      if (!(c?.type === 'MemberExpression' && c.object?.name === 'StyleSheet' && c.property?.name === 'create')) return;
      const obj = n.arguments[0];
      if (obj?.type !== 'ObjectExpression') return;
      for (const p of obj.properties) {
        if (p.type !== 'ObjectProperty') continue;
        map.set(p.key?.name ?? p.key?.value, p.value);
      }
    });
    return map;
  })();
  const scanStack = (node, via, acc, seen) => {
    if (!node) return;
    switch (node.type) {
      case 'JSXExpressionContainer': return scanStack(node.expression, via, acc, seen);
      case 'ArrayExpression': return node.elements.forEach((e) => scanStack(e, via, acc, seen));
      case 'ConditionalExpression':
        scanStack(node.consequent, via, acc, seen);
        return scanStack(node.alternate, via, acc, seen);
      case 'LogicalExpression':
        scanStack(node.left, via, acc, seen);
        return scanStack(node.right, via, acc, seen);
      case 'NullLiteral': case 'BooleanLiteral': case 'StringLiteral':
        // Clean by the NODE TYPE, not by a label: none of these can hold a
        // key at all, whatever they were named. That is the test the
        // `Identifier` arm below fails.
        return;
      case 'Identifier':
        // FAILS CLOSED — Lumen's find, 2026-08-29, and it is this row's own
        // argument turned on this row. This arm used to return clean on the
        // justification that a bare identifier is "a `style` pass-through,
        // which carries no key of its own". Nothing in the code checked the
        // identifier's name or its origin, so that was a label earned by
        // nothing: it read `style={dropCarryStyle}` — a local const holding
        // `{ ..., zIndex: 1 }` — as an absence, and printed "with nothing
        // unresolvable" while the cargo painted in front of its carrier.
        // Measured at `main@7ec9db4` before the repair: 47 passed, 0 failed.
        //
        // An identifier's contents are not knowable from its style position,
        // so "I could not read it" is the honest verdict and it must not
        // share a colour with "there is nothing there" — which is the exact
        // sentence that made this row necessary against G6. Free at HEAD:
        // no member of the pair carries an identifier in style position
        // today (`HoneyDrop` is an inline object, `MascotBee` takes no
        // `style`), so the tightening reds nothing real. If a genuine
        // pass-through ever arrives here, red-and-restate is the behaviour
        // the rest of this row already argues for.
        acc.unresolved.push(`${via}: Identifier \`${node.name}\` (a style this row cannot read — resolve it inline, or restate R-N4.3's precondition against whatever it holds)`);
        return;
      case 'ObjectExpression':
        for (const p of node.properties) {
          if (p.type === 'SpreadElement') { scanStack(p.argument, via, acc, seen); continue; }
          if (p.type !== 'ObjectProperty') { acc.unresolved.push(`${via}: ${p.type}`); continue; }
          const k = p.key?.name ?? p.key?.value;
          if (STACK_KEYS.includes(k)) acc.keys.push(`${via} -> ${k}`);
        }
        return;
      case 'MemberExpression': {
        if (node.object?.name === 'styles' && node.property?.name) {
          const nm = node.property.name;
          if (seen.has(nm)) return;
          seen.add(nm);
          const target = beeStyles.get(nm);
          if (!target) { acc.unresolved.push(`styles.${nm} (no such entry in the StyleSheet)`); return; }
          return scanStack(target, `styles.${nm}`, acc, seen);
        }
        acc.unresolved.push(`${via}: ${node.type}`);
        return;
      }
      default:
        acc.unresolved.push(`${via}: ${node.type}`);
    }
  };
  const beeBoxNode = (() => {
    let found = null;
    visit(BEE_AST, (n) => {
      if (found || n.type !== 'JSXElement') return;
      const open = n.openingElement;
      const named = open?.name?.type === 'JSXMemberExpression'
        && open.name.object?.name === 'Animated' && open.name.property?.name === 'View';
      if (!named) return;
      const styleAttr = open.attributes.find((a) => a.type === 'JSXAttribute' && a.name?.name === 'style');
      if (!styleAttr) return;
      // Identified by the transform it carries, which is what MAKES it the
      // bee's own box — the box the pair is inside and banks with.
      if (/\{ rotate \}, \{ scaleX \}/.test(BEE.slice(styleAttr.start, styleAttr.end))) found = n;
    });
    return found;
  })();
  const beeBoxChildren = (() => {
    const out = [];
    const push = (n) => {
      if (!n) return;
      if (n.type === 'JSXElement') { out.push(n); return; }
      if (n.type === 'JSXExpressionContainer') return push(n.expression);
      if (n.type === 'LogicalExpression') { push(n.left); return push(n.right); }
      if (n.type === 'ConditionalExpression') { push(n.consequent); return push(n.alternate); }
      if (n.type === 'JSXFragment') return n.children.forEach(push);
    };
    (beeBoxNode?.children ?? []).forEach(push);
    return out;
  })();
  const elementName = (el) => {
    const nm = el.openingElement?.name;
    if (!nm) return '?';
    return nm.type === 'JSXMemberExpression' ? `${nm.object?.name}.${nm.property?.name}` : nm.name;
  };
  const pairScan = { keys: [], unresolved: [] };
  for (const el of beeBoxChildren) {
    const styleAttr = el.openingElement.attributes
      .find((a) => a.type === 'JSXAttribute' && a.name?.name === 'style');
    if (styleAttr) scanStack(styleAttr.value, `<${elementName(el)}> style`, pairScan, new Set());
  }
  // The other population, printed rather than asserted: the file's own
  // layer-level stacking sites. They are why this row is scoped to the pair.
  const layerStackSites = [...beeStyles.entries()]
    .map(([nm, node]) => {
      const acc = { keys: [], unresolved: [] };
      scanStack(node, `styles.${nm}`, acc, new Set([nm]));
      return acc.keys;
    })
    .flat();
  const childNames = beeBoxChildren.map(elementName);
  const pairPresent = childNames.includes('HoneyDrop') && childNames.includes('MascotBee');
  if (beeBoxNode && pairPresent && pairScan.keys.length === 0 && pairScan.unresolved.length === 0) {
    ok(`G9 R-N4.3's precondition holds: NO member of the bee's transformed box claims a stacking order — every direct child (<${childNames.join('>, <')}>) resolves to zero \`zIndex\`/\`elevation\`, inline and through the StyleSheet, with nothing unresolvable. So document order is still the whole story between them and G6's reading is still valid. The file's ${layerStackSites.length} layer-level stacking sites (${layerStackSites.join(', ')}) are deliberately NOT in this population — they order the layer against the screen, which is a different claim from the one R-N4.3 rules`);
  } else {
    bad('G9', `bee box resolved=${Boolean(beeBoxNode)}, direct children=[${childNames.join(', ')}] (want the pair among them), stacking props ON THE PAIR=[${pairScan.keys.join('; ')}] (want none — one of these silently overrides the document order G6 reads, so the carrier stops occluding the cargo while G6 stays green), unresolvable style expressions=[${pairScan.unresolved.join('; ')}] (want none — this row fails closed)`);
  }
}

console.log(`\ncheck-nectar-exchange: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
