import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Pressable, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Polygon, Path, Line, Circle, G, Defs, ClipPath, Image as SvgImage } from 'react-native-svg';
import { theme } from '../constants/theme';
import {
  BLOOM_RING_INSET,
  BLOOM_MARK_EDGE_FRACTION,
  BLOOM_MARK_STROKE_WIDTH,
  BLOOM_FLOOR_OPACITY,
} from '../constants/bloomRing';
import { hexTintFor } from './Avatar';
import { hexPoints, hexEdgeMarks, hexSealPath, honeyHMax, HONEY_RUNGS, hexHoneyPoints, hexHoneyMeniscus } from './HexShape';
import { useSvgId } from '../utils/svgId';
import { DURATIONS, HONEY, HONEY_EASING, PRESS, STAGGER_MS, useReducedMotion } from '../constants/motion';
import { hexTap as hexTapHaptics } from '../constants/haptics';
import { HexTapOverlay } from './HexTapOverlay';
import {
  buildCombLayout,
  cellCentre,
  hexSpiral,
  personKey,
  ringStepFor,
  shouldAbortPollination,
} from './combLattice';

// Lane D — the hex tap's beat boundaries in ms from contact. `HONEY` names
// only the fill; contact and ignition (Beats 1-2) belong to the FINGER and
// the LIGHT, not to the honey, so they're not in that module — named here
// instead of left as bare literals scattered through the timeline below.
// `CONTACT_MS` is also the last beat of `hexTap.contact()`'s haptic
// sequence; the two are one number wearing two hats, and moving either
// without the other desynchronises the touch from the picture.
const CONTACT_MS = 180;
const IGNITION_MS = 80;

// Re-exported because the comb's identity rule is one expression and this is
// where the rest of the app already reaches for it. `combLattice` owns it —
// it has to be importable by a gate, and a component file is not.
export { personKey };

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ONE ring around one centre. A hex spiral only closes at 1, 7, 19 — at any
// other count the outer ring is part-built and the whole cluster hangs off
// to one side, which is what the old cap of 12 did: it left ring 2 five
// twelfths filled, so the shape's centre of area sat 29.4pt below "You".
// Seven is the first count that closes, and it is also an honest size for a
// gratitude circle.
//
// It stays declared HERE, not in `combLattice`, and deliberately:
// `check-demo-hive.mjs:74` reads this file by path and unwraps a regex match
// for it with no null guard, so moving the declaration fails that gate as a
// TypeError rather than as a diagnosis. The geometry moved; the number
// another gate reads off this file did not.
export const HIVE_SLOTS = 7;
const SPIRAL = hexSpiral(1);

const initialsFor = (name) => {
  const parts = (name || '?').trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
};

// The cell IS the portrait. Before this the grid drew a hexagon and then
// dropped a fully opaque circle on top of it, so the honeycomb read as
// circles with corners peeking out — two shapes fighting, at two different
// densities, for one person. The photo (or the initials wash) is clipped to
// the hexagon, so a face is simply a cell in a comb.
// Demo members sit a register back from real ones — present enough that the
// comb reads as populated, quiet enough that they never pass for someone you
// actually know.
// Was 0.45 dimming the initials glyph too, at 2.84:1 — but that's the
// large-text bar (18pt/14pt-bold; RN `fontSize` is dp not pt, so the real
// thresholds are 24px/18.66px) and this glyph is 18.48px regular, which
// needs 4.5:1. Bumping opacity to clear that bar lands at register 0.605 —
// no longer "a register back," most of the way to a real member (Sage,
// msg 3182e438). Fix instead: initials no longer ride `register` at all
// (see the Text below) — the glyph is legible at full opacity regardless
// of demo/real, and 0.45 is restored as R55's device-measured fill value.
const DEMO_OPACITY = 0.45;

// The ring's geometry constants live in `src/constants/bloomRing.js`, not
// here (imported below) — `scripts/lib/bloom-ring-region.mjs` needs them
// with a bare `node` import to derive the tripwire's Hive ambient region,
// and this file's JSX only Metro/Babel can parse.

// Breathing cadence: no `DURATIONS.breathe` constant exists yet (motion.js
// still lists honeycomb breathing loops as unextracted §14.1 follow-up), so
// this reuses GlowOrb's ratified 2400ms half-cycle rather than inventing a
// new number — same anchor the rest of the app's "breathe" treatments use.
//
// §12.5.1b (R61, Pixel's catch): the anchor only covers CADENCE. The floor
// (below) is a separate number and was NOT borrowed from GlowOrb — its
// 25% swing is not this ring's 55%. Citing the anchor for the whole
// animation is what let an invented depth pass as ratified. The floor is
// now measured against the contrast bar it has to clear, not against
// GlowOrb's.
const BLOOM_BREATHE_MS = 2400;
// BLOOM_FLOOR_OPACITY now lives in constants/bloomRing.js, alongside the
// ring's other geometry — DES-24 §6.4 row 10 needs the real number in a
// check gate, not a second copy of it.

// The blooming state: a segmented ring, not a wash, because fill is spent
// on identity (`hexTintFor`) and its range is capped by whichever tint a
// member's name hashed to — a washSky member's full fill range measured at
// less than half of washYellow's, so state can't live there without some
// friends permanently reading quieter than others. Marks are tint-
// independent and stack with `seeded` for free (a cell can be both).
// Static under Reduce Motion — the ring itself never disappears (R46); only
// the breathe does.
//
// DES-24 §6.4 row 10 (device-measured): on a honeyed cell, three of the six
// edge marks sit inside the honey body, where `inkSoft` floors at 2.609
// against the 3.0 bar for 2022ms of every 4800ms breathe. The ground swaps
// the mark colour to `ink` (5.644 at the same floor) — a strength change,
// not a hue change (LCh: `ink`/`inkSoft` are h 90.94°/91.44°, half a degree
// apart). Requires the honey body drawn first — see draw order in
// `FilledCell` below (§6.4: "the blooming ring is drawn after the honey body").
//
// The prop is `honeyGround`, not `honeyed`, because MB-D2b gave the same
// defect a SECOND ground and this one is reachable today. A selected cell
// holds an opaque `accent` fill under all six marks (not three), and
// `inkSoft` at the ring's own `BLOOM_FLOOR_OPACITY` measures **2.8399:1**
// there — under the same 3:1 bar, by the same mechanism, on a pair
// (`blooming` + `selected`) that has a live producer on both sides
// (`HoneycombTab.js:378` sets `blooming` off `last_note_received_at`; any
// tap sets `selected`). `honeyed` is still latent — nothing writes
// `honeyRung` — so naming the prop after it would have named the case that
// CANNOT happen while missing the one that can. `ink` measures 6.0937 at
// the same floor. The condition is "is my ground an accent-family fill",
// and it now has two writers.
const BloomRing = ({ size, reduced, honeyGround }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const marks = useMemo(() => hexEdgeMarks(size, BLOOM_RING_INSET, BLOOM_MARK_EDGE_FRACTION), [size]);

  useEffect(() => {
    if (reduced) {
      pulse.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: BLOOM_FLOOR_OPACITY, duration: BLOOM_BREATHE_MS, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: BLOOM_BREATHE_MS, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, pulse]);

  return (
    <AnimatedG opacity={pulse}>
      {marks.map(([x1, y1, x2, y2], i) => (
        <Line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={honeyGround ? theme.colors.ink : theme.colors.inkSoft}
          strokeWidth={BLOOM_MARK_STROKE_WIDTH}
          strokeLinecap="round"
        />
      ))}
    </AnimatedG>
  );
};

// DES-24 §2-4/§6.4: the `honeyed` level is a region, not a badge — a
// horizontal `ink` line (the meniscus) whose height IS the level. `rung` is
// 0-4 (25% steps); 0 renders nothing. Gated on `isOwn` by the caller (§6.2:
// resolves the seeded+honeyed collision by constraint, since an own cell can
// never be seeded — `no_self_seed` — and honeyed is own-cell-only per
// §5.2(b); §6.4 row 4: the gate's second job is keeping a descending initial
// like "Q" out of the honey, since the own cell's glyph is always "You").
//
// The `surface` backing is drawn here, unconditionally, above whatever the
// cell is already painted with (tint OR avatar photo) — §3 (R55 one layer
// down: without it the same honey reads amber on washYellow and grey-brown
// on washSky) and §6.5(a) (a photo-backed own cell needs the same backing,
// drawn above the photo, not the unconditional `surface` polygon at the
// bottom of the stack, which sits BENEATH the photo).
const HoneyFill = ({ size, rung }) => {
  const h = honeyHMax(size) * HONEY_RUNGS[rung];
  const points = useMemo(() => hexHoneyPoints(size, h), [size, h]);
  const meniscus = useMemo(() => hexHoneyMeniscus(size, h), [size, h]);
  if (!h) return null;
  return (
    <>
      <Polygon points={points} fill={theme.colors.surface} />
      <Polygon points={points} fill={theme.colors.accentDeep} fillOpacity={0.5} />
      <Line
        x1={meniscus.x1}
        y1={meniscus.y1}
        x2={meniscus.x2}
        y2={meniscus.y2}
        stroke={theme.colors.ink}
        strokeWidth={1.5}
      />
    </>
  );
};

// MB-D2b / LP-R21 — the held honey. Colin's direction was "it should just
// trip on to that one tile and keep the illuminated honey colour," and this
// is the whole of it: one circle, growing from the cell's own centre,
// clipped to the cell's own hexagon, holding at full for as long as the cell
// is open. `progress` is the caller's single 0->1 radial value (MB-D2b:
// "Fill is a single radial progress value (0->1)"), so there is nothing here
// to fall out of step with itself.
//
// PURE RADIAL, and the geometry is why the beat reads as settling rather
// than as stopping. `hexPoints` puts the vertices at `size` from the centre,
// so the circle covers the cell exactly at `r === size` — but it reaches the
// six EDGE MIDPOINTS at the apothem, 0.8660 x size, where it already covers
// **90.7%** of the hexagon's area. Under `HONEY_EASING.fill` that lands at
// 185.3ms of the 250, and the last 64.7ms is honey creeping into six
// corners. Nothing scores that; it falls out of a circle filling a hexagon.
//
// FLAT — no meniscus, no level line (LP-R21 guardrail 1). The level register
// is DES-24's `HoneyFill` above, and it is own-cell-only for a reason: a
// level on a tapped NEIGHBOUR broadcasts an amount that does not exist. The
// two never argue, because this one is opaque and is drawn over that one:
// while a cell is open, selection is the only register its fill carries, and
// the amount returns intact the moment it closes. (Unreachable today either
// way — nothing writes `honeyRung`.)
//
// `accent`, and no `accentDeep` edge. MB-D2b offers the edge as optional and
// it is declined: the cell already HAS an edge in the selected state — Beat
// 1's solid `ink` 2.5pt stroke, which measures 11.8021:1 against this fill.
// An `accentDeep` line inside it would be a second boundary 2.5pt in from
// the strongest one, at 1.8008:1 — the weaker of two edges on one shape, and
// the one carrying no information. `accentBurst` is declined for the same
// class of reason: MB-D2b allows it "at arrival only," but Beat 2 already
// spends `accentBurst` as the ignition bloom 250ms earlier, and two flashes
// of one token inside one gesture is two events where the user made one.
const SelectionFill = ({ size, progress, clipId }) => (
  <AnimatedCircle
    cx={size}
    cy={size}
    r={progress.interpolate({ inputRange: [0, 1], outputRange: [0, size] })}
    fill={theme.colors.accent}
    clipPath={`url(#${clipId})`}
  />
);

const FilledCell = ({ member, size, selected, held, reduced, fillProgress }) => {
  const clipId = useSvgId('hivecell');
  const points = useMemo(() => hexPoints(size), [size]);
  const sealPath = useMemo(() => hexSealPath(size), [size]);
  const tint = hexTintFor(member.name);
  const register = member.isDemo && !selected ? DEMO_OPACITY : 1;
  // Rung mapping from a real balance is DES-24 §7's open item — it wants
  // 19a's drop distribution, which doesn't exist yet. No producer sets this
  // today; it stays 0 (no visible fill) until that mapping is built.
  const honeyed = Boolean(member.isOwn && member.honeyRung);

  return (
    <View>
      <Svg width={size * 2} height={size * 2}>
        <Defs>
          <ClipPath id={clipId}>
            <Polygon points={points} />
          </ClipPath>
        </Defs>
        {/* The cell is dimmed against `surface`, never against the screen.
            Fading the whole cell down onto Sunlit Honey (`background`,
            #FFF7CC — this container is transparent, so that is the ground)
            composites a cool wash over a warm ground and lands somewhere
            neither token names:
            washSky at this register measured (243,245,225) on device —
            green as the max channel, a sage cell in a honey comb. Backing
            the tint with white first keeps blue the max channel (243,249,253)
            and keeps the dimming a matter of strength, not of hue. */}
        <Polygon points={points} fill={theme.colors.surface} />
        {member.avatarUrl ? (
          <SvgImage
            href={{ uri: member.avatarUrl }}
            x="0"
            y="0"
            width={size * 2}
            height={size * 2}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
            opacity={register}
          />
        ) : (
          <Polygon points={points} fill={tint} fillOpacity={register} />
        )}
        {/* Honey enters above the tint/avatar and below the seal (§6.4: the
            blooming ring's ink-vs-inkSoft ruling measures the ring drawn
            OVER the honey body — the other order is a different picture). */}
        {honeyed && <HoneyFill size={size} rung={member.honeyRung} />}
        {/* Selection's held honey enters above the amount register and below
            the seal/ring/stroke — the same slot, and the same reason: §6.4
            measured the ring drawn OVER the honey body, and both of this
            cell's honeys are bodies. */}
        {held && <SelectionFill size={size} progress={fillProgress} clipId={clipId} />}
        {/* Seeded: knocked out to whatever's already painted above (the
            avatar/tint), not a second colour — R51's register rule. Drawn
            in this same Svg so the hole shows that fill, not a blank gap. */}
        {member.seeded && <Path d={sealPath} fill={theme.colors.ink} fillRule="evenodd" />}
        {member.blooming && <BloomRing size={size} reduced={reduced} honeyGround={honeyed || held} />}
        {/* Beat 1 (Lane D): surface -> ink on tap, width held constant at
            2.5pt — "no width change, the luxury is restraint here." Width
            used to jump 2 -> 2.5 with the colour; that's the one part of
            this line the spec explicitly rules out. */}
        <Polygon
          points={points}
          fill="none"
          stroke={selected ? theme.colors.ink : theme.colors.surface}
          strokeWidth={2.5}
        />
      </Svg>
      {!member.avatarUrl && (
        <View style={styles.cellOverlay} pointerEvents="none">
          <Text style={[styles.initials, { fontSize: size * 0.42 }]}>
            {member.isOwn ? 'You' : initialsFor(member.name)}
          </Text>
        </View>
      )}
    </View>
  );
};

// An empty seat, and an honest one: a quiet outline with a `+`. The grid
// used to fabricate strangers to fill these, which made a hive of one look
// like a hive of twelve. An empty cell is also the invite target — the
// gap in the comb is the thing you tap to close it.
const EmptyCell = ({ size }) => {
  const points = useMemo(() => hexPoints(size), [size]);

  return (
    <View accessibilityLabel="a seat for someone">
      <Svg width={size * 2} height={size * 2}>
        <Polygon
          points={points}
          fill={theme.colors.surface}
          fillOpacity={0.45}
          stroke={theme.colors.surfaceBorderStrong}
          strokeWidth={1.5}
        />
      </Svg>
      <View style={styles.cellOverlay} pointerEvents="none">
        <Text style={[styles.plus, { fontSize: size * 0.5 }]}>+</Text>
      </View>
    </View>
  );
};

const HexCell = ({ member, size, x, y, delay, selected, held, reduced, pressDepth, fillProgress }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: reduced ? DURATIONS.reducedMotionFade : 420,
      delay: reduced ? 0 : delay,
      easing: reduced ? Easing.linear : Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    }).start();
  }, [progress, delay, reduced]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 1 : 0.15, 1] });
  // Beat 1's press depression rides on top of the entrance scale, and only
  // on the cell that's actually selected — `pressDepth` is one shared value
  // (only one cell can be selected at a time), so every other cell's
  // transform is untouched.
  const cellScale = selected && !reduced ? Animated.multiply(scale, pressDepth) : scale;

  return (
    <Animated.View
      style={[
        styles.cellWrap,
        {
          left: x,
          top: y,
          width: size * 2,
          height: size * 2,
          transform: [{ scale: cellScale }],
          opacity: progress,
        },
      ]}
    >
      {member ? (
        <FilledCell member={member} size={size} selected={selected} held={held} reduced={reduced} fillProgress={fillProgress} />
      ) : (
        <EmptyCell size={size} />
      )}
    </Animated.View>
  );
};

// The hive's Today view: who in your circle has shared today. Seven seats,
// you in the middle, one ring around you. Tap a face to read what they
// wrote; tap a gap to invite someone into it.
export const HoneycombGrid = ({
  members,
  cellSize = 44,
  onInvitePress,
  // §28.9 — the two triggers, and the shape they come in is the ruling.
  // `scrollYRef` is read BY VALUE (the aim point moved); `scrollTick` carries
  // no information at all and exists only to re-run the check. **Put
  // completeness in the trigger and correctness in the predicate: an
  // over-firing trigger with a by-value predicate is safe; an exact trigger
  // with a reference predicate is not.**
  scrollYRef,
  scrollTick = 0,
  onPollinate,
  onPollinateCancel,
  activePollinationKey = null,
}) => {
  // HOLD THE KEY, DERIVE THE MEMBER (§28.9 correction 3, Sage's find). The
  // old shape put the whole member object in state at tap time and never
  // refreshed it, so the ring compared a captured share id against a live one
  // while the card rendered the captured name and quote. Two readings of the
  // same selection, one live and one frozen, kept in step by nothing.
  //
  // Deriving makes their agreement structural: ring and card read the same
  // member out of the same list on the same render. It also closes the case
  // that is reachable in today's build — the demo set fills all seven seats,
  // so the first real share of the day evicts the seventh member; if that is
  // who you tapped, `selected` goes null and the card closes instead of
  // hanging there quoting someone with no cell.
  const [selectedId, setSelectedId] = useState(null);
  // LP-R19's named cost, built. `setSelectedId` cannot drive everything: the
  // cell's stroke must answer the finger AT ONCE, and the outgoing seat must
  // keep its card, its fill and its light for the length of the release, or
  // the old card spends 80ms dying with the new person's name on it.
  //
  // LP-R19 called the second piece `cardId`; it is `heldId` here because it
  // ended up owning three things, not one — the card's content, the held
  // fill, and the scrim's centre. All three are "what the room is still
  // showing," and they have to move on the same frame or the release comes
  // apart into three.
  const [heldId, setHeldId] = useState(null);
  const selected = selectedId === null ? null : members.find((m) => personKey(m) === selectedId) ?? null;
  const held = heldId === null ? null : members.find((m) => personKey(m) === heldId) ?? null;
  const reduced = useReducedMotion();
  const cameraProgress = useRef(new Animated.Value(0)).current;
  const revealProgress = useRef(new Animated.Value(0)).current;

  // Lane D — the hex tap's own animated values. `revealProgress` and
  // `cameraProgress` already exist and are reused (ruling 3(b)).
  //
  // FOUR OF THESE LEFT WITH LP-R21. `beadProgress`, `neckProgress`,
  // `fallProgress` and `poolProgress` drove Beats 3-6 and retired with them
  // (guardrail 5). `glowRestOpacity` and `honeyDecay` went too, and neither
  // was a casualty of the same cut: the rest glow would have become a static
  // `accentBurst` wash under a hold that never ends (see `HexTapOverlay`),
  // and `honeyDecay` was Beat 6's decay ramp, whose job the release beat
  // does with `revealProgress` itself — one envelope for the scrim and the
  // card, which is what makes "scrim and fill release together" structural.
  const pressDepth = useRef(new Animated.Value(1)).current;
  const glowBloomOpacity = useRef(new Animated.Value(0)).current;
  // MB-D2b's single radial progress. `useNativeDriver: false` everywhere it
  // is driven — it interpolates into an SVG `r` attribute, which is a prop,
  // not a transform.
  const fillProgress = useRef(new Animated.Value(0)).current;
  // Ruling 3(a): the scrim's centre is cluster-space + the cluster's own
  // origin in container space, measured once via `onLayout` rather than
  // assumed — `stage` has no padding and is `container`'s first child, so
  // this `onLayout` (relative to `stage`) already IS the container-space
  // origin (Lumen's ruling; don't re-derive it).
  const [clusterOrigin, setClusterOrigin] = useState(null);
  const [tapCentre, setTapCentre] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    Animated.timing(cameraProgress, {
      toValue: 1,
      duration: reduced ? DURATIONS.reducedMotionFade : 600,
      easing: reduced ? Easing.linear : Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [cameraProgress, reduced]);

  // Seating and the hit-test are `combLattice`'s (one implementation, and an
  // importable one — §28.9 gate row 8). This memo is only the binding.
  const layout = useMemo(
    () => buildCombLayout(members.slice(0, HIVE_SLOTS), cellSize, SPIRAL),
    [members, cellSize]
  );

  // A selection that stops resolving is dropped, not kept. Without this the
  // key survives the member: tap someone, a refresh evicts them (card closes,
  // correctly), a later refresh brings them back — and the card would reopen
  // on its own, asserting a selection the user never made twice.
  useEffect(() => {
    if (selectedId !== null && selected === null) setSelectedId(null);
    if (heldId !== null && held === null) setHeldId(null);
  }, [selectedId, selected, heldId, held]);

  // §28.9 — the flight in the air, from the comb's side: which person it was
  // aimed at, and where the aim point sat in cluster space when the tap
  // happened. Held in a ref because nothing renders from it.
  const aimRef = useRef(null);
  const pollinationKeyRef = useRef(0);
  const readScrollY = () => scrollYRef?.current ?? 0;

  // LP-R19's release beat, built here rather than deferred, because LP-R21
  // is what makes it load-bearing. Beat 6 used to take the room down on a
  // timer 3.34s after the tap, so a cell-to-cell tap after that landed on a
  // dark page and the teleport was invisible. The hold has no timer: the
  // scrim is up for the whole selected state now, so EVERY supersede would
  // jump the light from one cell to another at full strength. Retiring the
  // pool turned an occasional cut into an unconditional one.
  //
  // "Light takes as long to let go as it took to catch" — the release is
  // `IGNITION_MS`, and because 80 < 180 the whole of it fits inside the
  // contact window the score already leaves empty. The incoming tap is not
  // delayed by a millisecond; the window that used to be spent in darkness
  // is spent letting go instead.
  const releaseHeld = (onDone) => {
    if (heldId === null) {
      // Nothing to let go of. The fill still has to start from empty: a
      // previous selection can end without a release when its member stops
      // resolving (the effect above drops `heldId`), which would otherwise
      // leave this value parked at 1 and render the next tapped cell full
      // before its beat begins.
      fillProgress.setValue(0);
      onDone();
      return;
    }
    Animated.parallel([
      // One envelope for the card and the scrim — they ARE the same value.
      Animated.timing(revealProgress, {
        toValue: 0,
        duration: IGNITION_MS,
        easing: Easing.in(Easing.cubic), // the mirror of its Easing.out entry
        useNativeDriver: true,
      }),
      // "Scrim and fill release together" (LP-R21) — a second driver, but on
      // the same window and the same curve, because the fill cannot ride
      // `revealProgress`: that one is native-driven and this one paints an
      // SVG `r`.
      Animated.timing(fillProgress, {
        toValue: 0,
        duration: IGNITION_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      // A third tap arriving mid-release takes both values over, and RN
      // reports this callback `finished: false`. Swapping anyway would hand
      // the room to a person the user has already tapped past.
      if (finished) onDone();
    });
  };

  const handleSelect = (member, tap) => {
    setSelectedId(personKey(member));
    // §28.1 — the CELL answers at t=0. The stroke was already here; the
    // haptic is new, and it is what makes the acknowledgement independent of
    // the bee. Everything the beat asserts is carried by the stroke, the
    // haptic and the card, which is why §28.6 owes accessibility nothing
    // extra: a user who never perceives the flight loses nothing.
    if (reduced) {
      // Reduced Motion keeps the cell + card and drops the room (§28.6's
      // rule, extended here) — no scrim, no glow. But the FILL is not motion
      // to be skipped, it is the selected state's appearance, so it arrives
      // at its final value with no sweep: LP-R21's acceptance line
      // ("Reduced-motion: fill appears at final value, no sweep") retires
      // the "instant pool variant is still open" note that used to sit here.
      // A held state is not an animation, and refusing to draw it is how a
      // Reduce Motion user ends up with a selection they cannot see.
      //
      // The scrim's own Reduce Motion behaviour is UNCHANGED and remains
      // unscored: `tapCentre` stays null, so `HexTapOverlay` renders
      // nothing. The fill alone carries selection here, at ΔE00 19.2493 from
      // the weaker of the two member tints — 2.7x the whole range §21.2
      // struck `register` for.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      fillProgress.setValue(1);
      revealProgress.setValue(0);
      setHeldId(personKey(member));
      Animated.timing(revealProgress, {
        toValue: 1,
        duration: DURATIONS.reducedMotionFade,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    } else {
      // The beat clock starts NOW, at the tap — the release runs inside its
      // first 80ms rather than in front of it, so Beat 2 still ignites at
      // 180 exactly as it did before this beat existed (LP-R19).
      startHexTap();
      releaseHeld(() => {
        const cell = layout.cells.find((c) => c.member && personKey(c.member) === personKey(member));
        setTapCentre(cell ? cellCentre(cell, cellSize) : null);
        setHeldId(personKey(member));
        revealProgress.setValue(0);
        Animated.timing(revealProgress, {
          toValue: 1,
          duration: DURATIONS.revealGlide,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    }
    requestPollination(member, tap);
  };

  // Lane D — the hex tap's haptic + motion score, run fresh on every tap.
  // Beat 1's stroke/press-depth are on the cell itself (`HexCell` below);
  // this schedules the room (`HexTapOverlay`) and the fill.
  //
  // THE WHOLE TIMELINE, and it now ends: contact 0-180 (press + haptic),
  // ignition 180-260 (the bloom rises), fill 180-430, then HOLD. Beats 3-6
  // used to carry it to 3340ms and then take the room down with them; there
  // is nothing after 430 any more, which is the point — LP-R21's hold is
  // state, and the acceptance bar is a still frame.
  const startHexTap = () => {
    hexTapHaptics.contact();

    pressDepth.setValue(1);
    glowBloomOpacity.setValue(0);
    // `fillProgress` is deliberately NOT zeroed here. Snapping it to 0 at
    // t=0 would cut the outgoing cell's honey out in one frame, which is the
    // exact defect the release beat exists to remove — `releaseHeld` owns
    // this value's way down, in both of its branches.

    // Beat 1 — press depression, ease-in-out across the contact window.
    Animated.sequence([
      Animated.timing(pressDepth, {
        toValue: PRESS.standard,
        duration: CONTACT_MS / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pressDepth, {
        toValue: 1,
        duration: CONTACT_MS / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Beat 2 — the bloom ignites, then goes out ON THE FRAME THE FILL LANDS.
    //
    // It used to crossfade into a rest level over `HONEY.swell` (700ms), a
    // duration Beat 3 scored for the bead's formation. Both the rest level
    // and that duration retired: the decay window is written as the offset
    // between the two things it has to end with, `HONEY.fill - IGNITION_MS`,
    // so the light and the honey settle on ONE frame (430ms) no matter which
    // of the three numbers moves. Typing 170 here would be the same number
    // today and a stale one the first time `HONEY.fill` is retuned.
    Animated.sequence([
      Animated.delay(CONTACT_MS),
      Animated.timing(glowBloomOpacity, {
        toValue: 1,
        duration: IGNITION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(glowBloomOpacity, {
        toValue: 0,
        duration: HONEY.fill - IGNITION_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // MB-D2b — the fill, triggered at contact-complete, which is the score's
    // own word and is also the frame `hexTap.contact()`'s closing Medium
    // lands on: the finger's last confirmation and the honey's first frame
    // are the same instant. It does not wait for the ignition to finish —
    // the light rises across the fill's first 80ms rather than ahead of it,
    // which is what "the fill performs within that light" describes.
    //
    // `useNativeDriver: false`: this interpolates into an SVG `r`.
    Animated.sequence([
      Animated.delay(CONTACT_MS),
      Animated.timing(fillProgress, {
        toValue: 1,
        duration: HONEY.fill,
        easing: HONEY_EASING.fill,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const requestPollination = (member, tap) => {
    // Under Reduce Motion there is no bee to break from — `FlyingBee` renders
    // the parked breathing pose — so the beat collapses to what the cell does
    // (§28.6). Not a special case: a property of the rig.
    if (!onPollinate || reduced) return;
    const cell = layout.cells.find((c) => c.member && personKey(c.member) === personKey(member));
    if (!cell) return;
    // Cell centres sit at (x + cellSize, y + cellSize) in cluster space — the
    // same offset `hitTest` undoes before inverting, one expression shared
    // with the scrim's centre calc in `handleSelect` (`combLattice.cellCentre`).
    const centre = cellCentre(cell, cellSize);
    // The tap hands us BOTH coordinate systems for one physical point:
    // `locationX/Y` in cluster space (what `hitTest` reads) and `pageX/Y` in
    // window space (what the flight needs). Subtracting gives the cluster's
    // window origin with no `measureInWindow` and no extra frame.
    //
    // Exact once the camera dive has settled. During its first 600ms the
    // cluster is scaled, so a translation derived at the tap point drifts by
    // (scale − 1) × (centre − tapPoint) elsewhere — bounded by one cell, and
    // the flight is ~1s long, so the camera has settled well before touchdown
    // either way. Named rather than assumed, per §28.2.
    const origin = { x: tap.pageX - tap.locationX, y: tap.pageY - tap.locationY };
    pollinationKeyRef.current += 1;
    const key = pollinationKeyRef.current;
    aimRef.current = {
      key,
      personId: personKey(member),
      localX: centre.x,
      localY: centre.y,
      scrollY: readScrollY(),
    };
    onPollinate({
      key,
      x: origin.x + centre.x,
      y: origin.y + centre.y,
      ringStep: ringStepFor(cellSize),
    });
  };

  // §28.9 correction 1 + 2 — **abort when the point the bee is aimed at would
  // no longer resolve, under the comb's OWN hit-test, to the PERSON the user
  // tapped.** The predicate itself lives in `combLattice` beside the
  // hit-test, because gate row 8 asserts they are one thing and not two.
  //
  // `hitTest` has two inputs, so the trigger set is the union of what can
  // change either — the aim point (scroll) and the seating (`layout`
  // identity, memoized on the definition of what can re-seat). Both are here.
  // `layout`'s identity changes on every parent render, which is fine: it is
  // the trigger, and the decision is the by-value person check.
  useEffect(() => {
    const aim = aimRef.current;
    if (!aim || aim.key !== activePollinationKey) return;
    if (shouldAbortPollination(layout, aim, readScrollY())) {
      aimRef.current = null;
      onPollinateCancel?.();
    }
  }, [layout, scrollTick, activePollinationKey]);

  // The camera dive-in is the screen's signature move, but it's also pure
  // travel — under Reduce Motion the cluster simply fades up in place.
  const cameraScale = cameraProgress.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 1 : 1.8, 1] });

  // Ruling 3(a): container's own box, for the SVG overlay's `width`/`height`
  // — `StyleSheet.absoluteFill` covers a View for free, but an `<Svg>` needs
  // its canvas size stated, and this is the only container-space size the
  // component doesn't already have from `layout`.
  const centreForOverlay =
    clusterOrigin && tapCentre ? { x: clusterOrigin.x + tapCentre.x, y: clusterOrigin.y + tapCentre.y } : null;

  return (
    <View style={styles.container} onLayout={(e) => setContainerSize(e.nativeEvent.layout)}>
      <View style={[styles.stage, { height: layout.height + 24 }]}>
        <Animated.View
          onLayout={(e) => setClusterOrigin({ x: e.nativeEvent.layout.x, y: e.nativeEvent.layout.y })}
          style={{
            width: layout.width,
            height: layout.height,
            alignSelf: 'center',
            transform: [{ scale: cameraScale }],
            opacity: cameraProgress,
          }}
        >
          {layout.cells.map(({ key, member, x, y, index }) => (
            <HexCell
              key={key}
              member={member}
              size={cellSize}
              x={x}
              y={y}
              delay={index * STAGGER_MS}
              selected={!!member && selectedId !== null && personKey(member) === selectedId}
              held={!!member && heldId !== null && personKey(member) === heldId}
              reduced={reduced}
              pressDepth={pressDepth}
              fillProgress={fillProgress}
            />
          ))}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={(e) => {
              const { locationX, locationY, pageX, pageY } = e.nativeEvent;
              const hit = layout.hitTest(locationX, locationY);
              if (!hit) return;
              if (hit.member) handleSelect(hit.member, { locationX, locationY, pageX, pageY });
              else onInvitePress?.();
            }}
            accessible={false}
          />
        </Animated.View>
      </View>

      {/* Ruling 4 — container-level, between stage and the reveal card, so
          the card lands inside the dimmed region (Option A's continuity). */}
      <HexTapOverlay
        width={containerSize.width}
        height={containerSize.height}
        center={centreForOverlay}
        cellSize={cellSize}
        cameraProgress={cameraProgress}
        revealProgress={revealProgress}
        glowBloomOpacity={glowBloomOpacity}
      />

      {/* The card reads `held`, not `selected` — LP-R19's named cost. On a
          cell-to-cell tap `selectedId` moves at t=0 so the new cell's stroke
          answers the finger, and if the card read the same value it would
          spend the whole 80ms release easing out with the INCOMING person's
          name and quote on it. */}
      {held && (
        <Animated.View
          style={[
            styles.revealCard,
            {
              opacity: revealProgress,
              transform: [
                {
                  translateY: revealProgress.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : 10, 0] }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.revealName}>{held.isOwn ? 'You' : held.name}</Text>
          <Text style={styles.revealQuote}>"{held.gratitude}"</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellWrap: {
    position: 'absolute',
  },
  cellOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.ink,
  },
  plus: {
    fontFamily: theme.fonts.body,
    color: theme.colors.inkSoft,
    opacity: 0.55,
  },
  revealCard: {
    marginTop: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.large,
    padding: 16,
    ...theme.shadows.card,
  },
  revealName: {
    ...theme.type.label,
    color: theme.colors.inkSoft,
    marginBottom: 8,
  },
  revealQuote: {
    fontFamily: theme.fonts.bodyItalic,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.textPrimary,
  },
});
