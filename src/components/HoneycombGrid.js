import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Pressable, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Polygon, Path, Line, Circle, G, Defs, ClipPath, Image as SvgImage } from 'react-native-svg';
import { theme } from '../constants/theme';
import { BLOOM_BREATHE_MS, BLOOM_FLOOR_OPACITY, BLOOM_LIGHT_ALPHA } from '../constants/bloomLight';
import { CELL_CANVAS_PAD, CELL_STROKE_WIDTH } from '../constants/combCell';
import { hexTintFor } from './Avatar';
import { initialsFor } from '../utils/initials';
import { hexPoints, hexSealPath, honeyHMax, HONEY_MENISCUS_STROKE, honeyHeightForLevel, hexHoneyPoints, hexHoneyMeniscus } from './HexShape';
import { useSvgId } from '../utils/svgId';
import { DURATIONS, HONEY, HONEY_EASING, NECTAR, PRESS, STAGGER_MS, useReducedMotion } from '../constants/motion';
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
import { boundedPollinationAims } from './pollinationIdentity';

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

// R-CL-2 (Lumen, 2026-09-04, off Colin's screenshot). THE RING RETIRED AND THE
// STATE DID NOT. The six dashed edge marks read as an outline that failed to
// draw — "a feature wearing a bug's clothes" — so blooming moved out of the
// outline channel entirely and into the cell's own LIGHT. The outline now
// carries selection and nothing else.
//
// The light's constants live in `src/constants/bloomLight.js`, not here — a
// bare-`node` check script cannot parse this file's JSX, and that file carries
// the whole retirement ledger (which of the ring's numbers survived, which
// have no successor, and why 0.18).
//
// WHAT THE LIGHT IS MADE OF, and why it is two layers rather than one overlay.
// Lumen ruled "the lit-variant material the dive already uses"; measured, that
// material is a PAIR, not a single paint. `accentBurst` composited straight
// onto a cell brightens nothing (L* 91.73 against `washYellow` 95.73 and
// `washSky` 94.72 — the light token is DARKER than both grounds it would sit
// on), and on `washSky` every register legible on `washYellow` lands
// green-dominant: at α 0.12, rgb(231,241,221), G the max channel. A green cell
// in a honey comb is the one thing this palette rules out, and it is the same
// defect the dim register's own note already names one layer down. So:
//
//   1. a blooming cell's identity tint is replaced by `washYellow`, the app's
//      warm ground and the dive's own filled-cell ground (R-CD-13), drawn at
//      the tint's own place in the stack so the honey and the seal stay above
//      it; and
//   2. `accentBurst` rides on top at `BLOOM_LIGHT_ALPHA`, breathing.
//
// Together those two ARE the dive's backlit filled cell, ported whole. No new
// gold surface, per R-CD-3.
//
// AVATAR-BACKED CELLS TAKE LAYER 2 ONLY (§6.5(a): the same overlay, above the
// photo). The base swap is deliberately not applied there, because an opaque
// wash over a photograph deletes the person. Warm light landing on a
// photograph can push a cool photo's local hue around, and that is allowed
// where the flat token case is not: `washSky` is a BRAND SURFACE and turning
// it mint is a palette failure, while a photograph already contains every hue
// and warm light falling across one is what warm light does.
//
// STATIC UNDER REDUCE MOTION AT THE PEAK, not at the floor and not absent —
// R46's rule, inherited from the ring unchanged: the state never disappears,
// only the breathe does.
const BloomLight = ({ size, reduced }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const points = useMemo(() => hexPoints(size), [size]);

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
      <Polygon points={points} fill={theme.colors.accentBurst} fillOpacity={BLOOM_LIGHT_ALPHA} />
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
const HoneyFill = ({ size, level, reduced }) => {
  const target = honeyHeightForLevel(size, level);
  // THE HEIGHT IS ANIMATED FROM THE PREVIOUS ONE AND NEVER RENDERED AT THE
  // NEW ONE — R-N2's load-bearing clause, and the whole reason the ladder
  // could go continuous. At `honeyHMax(44)` = 26.8180pt a 100-drop gift is
  // 5% of the cap = 1.3409pt of rise, which is 4.02 physical px at @3x:
  // small as a static edge, unmistakable as a moving one. Motion is what
  // makes a small quantity legible, so a snap does not merely look worse
  // here, it destroys the information.
  //
  // DRIVEN BY A LISTENER, NOT BY AN ANIMATED PROP, and that is forced by the
  // geometry rather than chosen. The honey region is a TRAPEZOID whose top
  // edge narrows with height (`hexHoneyPoints`), so its `points` is a string
  // and there is no numeric prop for `Animated` to interpolate — unlike
  // `SelectionFill` below, whose circle has a single animatable `r`. The
  // alternatives were both worse: a clipped rect would animate natively but
  // would re-derive DES-24 §6.4's device-corrected construction through a
  // different mechanism, and a stepped fallback is the defect this ruling
  // exists to remove. The cost is bounded and is not an ambient loop — one
  // cell's subtree, re-rendered for the 400ms of a transition that fires
  // only when a balance actually changes. The animated value and the state
  // both live INSIDE this component, so the other six cells never re-render.
  const anim = useRef(new Animated.Value(target)).current;
  const [h, setH] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    const sub = anim.addListener(({ value }) => setH(value));
    return () => anim.removeListener(sub);
  }, [anim]);

  useEffect(() => {
    if (prev.current === target) return;
    prev.current = target;
    // §5: under Reduce Motion the meniscus moves to its new height with no
    // tween — the gift still arrives, it simply does not travel.
    if (reduced) {
      anim.setValue(target);
      setH(target);
      return undefined;
    }
    const a = Animated.timing(anim, {
      toValue: target,
      // R-N3's Settle clock, shared rather than re-chosen: the balance
      // numeral counts over 400ms and "your own meniscus falls by the drop's
      // worth ON THE SAME CLOCK". A second duration here would be two
      // clocks for one event.
      duration: NECTAR.settle,
      // MONOTONE, deliberately, and this is the one easing constraint the
      // beat has: the meniscus is a QUANTITY. A spring or any curve with
      // overshoot renders a height the balance never held — briefly
      // asserting a level nobody has, which is the §23.1 class wearing a
      // tween. `inOut(quad)` is HONEY_EASING.fill's own curve; one material,
      // one curve family (motion.js's HONEY note).
      easing: HONEY_EASING.fill,
      useNativeDriver: false,
    });
    a.start();
    return () => a.stop();
  }, [anim, target, reduced]);

  const points = useMemo(() => hexHoneyPoints(size, h), [size, h]);
  const meniscus = useMemo(() => hexHoneyMeniscus(size, h), [size, h]);
  if (h <= 0) return null;
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
        strokeWidth={HONEY_MENISCUS_STROKE}
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
// the amount returns intact the moment it closes. (That collision was
// unreachable when this was written — nothing wrote the level. R-N2 gave it
// a producer, so the overlap is live now and this paragraph is the ruling
// that governs it, not a note about a case that cannot occur.)
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
  // R-N2: `honeyLevel` is the continuous 0..1 fraction (`honeyLevelForDrops`,
  // nectar.js), replacing the 0..4 rung index. The gate is unchanged in
  // meaning — own cell, positive level — and 0 is still NO HONEYED STATE AT
  // ALL rather than a low fill.
  const honeyed = Boolean(member.isOwn && member.honeyLevel > 0);

  return (
    <View>
      {/* R-CL-1: the canvas is padded and the geometry is NOT moved. The
          viewBox starts at -PAD so user space still has the hexagon's left
          vertex at x = 0 and its right at 2·size — every number in
          `hexGeometry` keeps meaning what it meant — while the rendered box
          gains PAD on all four sides for the stroke to finish inside. Scale
          stays 1: the alternative (same box, bigger viewBox) shrinks the
          whole cell by ~2.8% and renders a "2.5pt" stroke at 2.43pt, which
          would make the ruled width a lie about the pixels. */}
      <Svg
        width={size * 2 + CELL_CANVAS_PAD * 2}
        height={size * 2 + CELL_CANVAS_PAD * 2}
        viewBox={`${-CELL_CANVAS_PAD} ${-CELL_CANVAS_PAD} ${size * 2 + CELL_CANVAS_PAD * 2} ${size * 2 + CELL_CANVAS_PAD * 2}`}
      >
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
          /* R-CL-2 layer 1: a blooming cell's ground IS the lit ground. The
             swap happens HERE, at the identity layer, rather than as another
             overlay near the top of the stack, so the honey body, the seal and
             the selection fill all stay above it and keep their own grounds.
             Avatar-backed cells never reach this branch, which is exactly the
             §6.5(a) split: they take the light and keep the photograph. */
          <Polygon points={points} fill={member.blooming ? theme.colors.washYellow : tint} fillOpacity={register} />
        )}
        {/* Honey enters above the tint/avatar and below the seal (§6.4: the
            blooming ring's ink-vs-inkSoft ruling measures the ring drawn
            OVER the honey body — the other order is a different picture). */}
        {honeyed && <HoneyFill size={size} level={member.honeyLevel} reduced={reduced} />}
        {/* Selection's held honey enters above the amount register and below
            the seal/ring/stroke — the same slot, and the same reason: §6.4
            measured the ring drawn OVER the honey body, and both of this
            cell's honeys are bodies. */}
        {held && <SelectionFill size={size} progress={fillProgress} clipId={clipId} />}
        {/* Seeded: knocked out to whatever's already painted above (the
            avatar/tint), not a second colour — R51's register rule. Drawn
            in this same Svg so the hole shows that fill, not a blank gap. */}
        {member.seeded && <Path d={sealPath} fill={theme.colors.ink} fillRule="evenodd" />}
        {/* The light is last before the outline — above the honey, the
            selection fill and the seal, because it is light falling on the
            cell rather than another thing inside it. It takes no ground prop:
            the ring needed one (ink marks had to swap strength over a honey
            body, §6.4 row 10) and a warm wash over a warm ground has no such
            case. */}
        {member.blooming && <BloomLight size={size} reduced={reduced} />}
        {/* Beat 1 (Lane D): the rest tone -> ink on tap, width held constant
            at 2.5pt — "no width change, the luxury is restraint here." Width
            used to jump 2 -> 2.5 with the colour; that's the one part of
            this line the spec explicitly rules out.
            R-CL-2: the rest tone is `glassHairline`, one wax hairline on
            every cell in both combs, and it is no longer `surface` — see
            `CELL_REST_STROKE_TOKEN` in combCell.js for the four grounds it
            was measured on. */}
        <Polygon
          points={points}
          fill="none"
          stroke={selected ? theme.colors.ink : theme.colors.glassHairline}
          strokeWidth={CELL_STROKE_WIDTH}
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
      <Svg
        width={size * 2 + CELL_CANVAS_PAD * 2}
        height={size * 2 + CELL_CANVAS_PAD * 2}
        viewBox={`${-CELL_CANVAS_PAD} ${-CELL_CANVAS_PAD} ${size * 2 + CELL_CANVAS_PAD * 2} ${size * 2 + CELL_CANVAS_PAD * 2}`}
      >
        {/* R-CL-2's "one uniform wax-tone hairline on every cell at the
            constant 2.5pt" is read to include the empty seats, and
            deliberately: a lattice whose filled cells are outlined in one
            grey at 2.5pt and whose open seats are outlined in a different
            grey at 1.5pt is the inconsistency Colin's screenshot reads as
            broken, not a hierarchy anyone can decode. The seat's quietness is
            carried by what it is missing — a 0.45 fill, no face, no name —
            not by owning a second outline tone. */}
        <Polygon
          points={points}
          fill={theme.colors.surface}
          fillOpacity={0.45}
          stroke={theme.colors.glassHairline}
          strokeWidth={CELL_STROKE_WIDTH}
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
          // R-CL-1: the box grows by the canvas pad and its origin moves back
          // by the same amount, so the hexagon's centre stays at
          // (x + size, y + size) in cluster space. That point is what
          // `combLattice.cellCentre` returns and what the bee's flight and the
          // tap scrim's punch-out both aim at — padding a canvas must not move
          // a target, and this is why the compensation is here and not in the
          // shared util.
          left: x - CELL_CANVAS_PAD,
          top: y - CELL_CANVAS_PAD,
          width: size * 2 + CELL_CANVAS_PAD * 2,
          height: size * 2 + CELL_CANVAS_PAD * 2,
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

// The hive's Today view: who in your circle has shared today. Seven seats
// filled centre-out, the rest left as honest gaps. Tap a face to read what
// they wrote; tap a gap to invite someone into it.
//
// THE CENTRE IS NOT YOURS, and this sentence used to say it was ("you in
// the middle, one ring around you"). Found while building R-N4's crossing,
// and independently ruled by Lumen the same day (R-N4.2 negative 2, with a
// probe: 7 seats at cellSize 30 puts seat 0 at (75.00, 81.96), the box
// centre exactly). `buildCombLayout` seats `seated[index]` into
// `hexSpiral(1)`, whose index 0 IS `{q:0,r:0}`, and the list reaching it is
// ordered `created_at` DESC by the store's own feed query and never
// re-sorted after: `partitionHive` is filter/map/dedupe/slice and
// `combMembers` is a map. So the centre belongs to whoever posted most
// recently, and on any day you write before your friends do, you are on the
// ring.
//
// (That query is named by its screen and not by its method here on purpose.
// `check-demo-hive`'s negative half — "the comb cannot see the feed or the
// connection list" — is a raw substring test over this whole file, comments
// included, and it is right to be: it is what makes the sample-disclosure
// gating structural rather than a promise. A citation is not a dependency,
// but this gate cannot tell them apart, and weakening someone else's
// load-bearing negative to make room for a comment of mine is the wrong
// trade.)
//
// Left as a correction rather than a reorder: seating is the comb's ruling,
// not R-N4's, and moving every user's seat is a ruling. What R-N4 needed
// from it is answered either way — `pollinateOwnCell` resolves the seat by
// `member.isOwn` and never by position, so the crossing is correct under
// both orderings.
//
// `forwardRef` exists for exactly one thing: R-LF-5's landing light. The
// bee lives in `FlyingBee`, a screen-level sibling of this grid, not a
// child of it (§28.2 — no pixel constant crosses between the two boxes),
// so `HoneycombTab` is the only place both are in scope. It calls
// `igniteLanding()` from `FlyingBee`'s existing `onPollinateEnd` — the
// "I landed" signal already crossed that boundary before this ruling;
// nothing new does.
export const HoneycombGrid = forwardRef(({
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
}, ref) => {
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
  // COUNT, not appearance. The first draft of this disclosure said "faded
  // seats" and pointed at `DEMO_OPACITY` — but the register only reads as
  // faded NEXT TO a real seat, and the state a tester actually lands in is
  // all seven demo, where there is nothing to be faded against. A disclosure
  // that needs the reader to compare two things is inert exactly when every
  // thing on screen is the thing being disclosed. The count is true in every
  // mix and needs no comparison to decode. (Found on the simulator, on my own
  // fix, one screenshot after writing it.)
  const sampleSeats = members.filter((m) => m?.isDemo).length;
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
  // R-N4 — the cluster's own host view, for the ONE aim that has no tap to
  // derive an origin from. See `aimOwnCell`.
  const clusterRef = useRef(null);
  const [tapCentre, setTapCentre] = useState(null);
  const [landingCentre, setLandingCentre] = useState(null);
  const [landingLightRequest, setLandingLightRequest] = useState(null);
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
  const aimsRef = useRef(new Map());
  const pollinationKeyRef = useRef(0);
  const lightGenerationRef = useRef(0);
  const landingLightRef = useRef(null);
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
    lightGenerationRef.current += 1;
    landingLightRef.current?.stop();
    setLandingLightRequest(null);
    setLandingCentre(null);
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

  // R-LF-5 (Living Flight) — the landing light. Two lights, and they belong
  // to different people: the ignition above is the FINGER's and never waits
  // for the bee (§28.1 untouched — time-to-content is unchanged). This one
  // is the BEE's, on the SAME `glowBloomOpacity` channel, fired by
  // `HoneycombTab` from `FlyingBee`'s existing `onPollinateEnd` — the frame
  // `burstPollen` and the sequencer's own settle already run on. By the time
  // any hop lands the ignition has long since reached 0, so reusing the
  // channel needs no reconciliation with whatever the finger's envelope was
  // doing.
  //
  // **The margin, corrected twice.** The ignition is out at 430ms
  // (`CONTACT_MS` 180 + `HONEY.fill` 250). This comment used to claim the
  // fastest landing was 560ms — a 130ms margin — which was not measured
  // against anything: enumerated over the real 7-seat lattice, R-LF-4's
  // shortest flight was 468.5ms, a margin of 38ms (Lumen, 2026-08-29).
  // R-LF-2.1's launch ramp then bought 60ms of it back, and its descent
  // floor a little more: the shortest flight over the lattice is now
  // 524.2ms, on the largest container, so the margin is 94.2ms. The
  // conclusion held through all three figures; the number in the comment is
  // what the next person retuning `HONEY.fill` reads, so it is the number
  // that has to be true rather than the conclusion.
  //
  // MP-4: the landing signal is keyed. A later tap may already have replaced
  // `aimRef.current` while the first errand is still landing, so a bare
  // "landed" callback would illuminate and clear the wrong cell. The key is
  // identity, not geometry: no cell coordinate crosses back, and stale keys
  // do nothing.
  //
  // Peak deliberately UNDER the ignition's (0.45 of it) — a grace note, not
  // a second announcement; matching it would read as the tap firing twice.
  const LANDING_LIGHT_PEAK = 0.45;
  const LANDING_LIGHT_RISE_MS = 120;
  const LANDING_LIGHT_FALL_MS = 420;

  const igniteLanding = (key) => {
    const aim = aimsRef.current.get(key);
    if (!aim) return;
    setLandingCentre({ x: aim.localX, y: aim.localY });
    aimsRef.current.delete(key);
    if (aimRef.current?.key === key) aimRef.current = null;
    boundedPollinationAims(aimsRef.current, { currentKey: activePollinationKey, latestKey: aimRef.current?.key ?? null });
    lightGenerationRef.current += 1;
    setLandingLightRequest({ key, generation: lightGenerationRef.current });
  };

  useEffect(() => {
    if (!landingLightRequest || !landingCentre) return undefined;
    const generation = landingLightRequest.generation;
    const animation = Animated.sequence([
      Animated.timing(glowBloomOpacity, {
        toValue: LANDING_LIGHT_PEAK,
        duration: LANDING_LIGHT_RISE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(glowBloomOpacity, {
        toValue: 0,
        duration: LANDING_LIGHT_FALL_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    landingLightRef.current = animation;
    animation.start(({ finished }) => {
      if (lightGenerationRef.current !== generation) return;
      landingLightRef.current = null;
      setLandingLightRequest(null);
      setLandingCentre(null);
      if (!finished) setLandingCentre(null);
    });
    return () => {
      animation.stop();
      if (landingLightRef.current === animation) landingLightRef.current = null;
    };
  }, [landingLightRequest, landingCentre, glowBloomOpacity]);

  // R-N4.1 — THE CROSSING IS A COMMAND IN; THE POINT LEAVES THE WAY POINTS
  // ALREADY LEAVE.
  //
  // > The handle's invariant is not "one function." It is: commands in, no
  // > state out. One function was the consequence.
  // >   — Lumen, R-N4.1, 2026-08-29
  //
  // An earlier draft of this (`aimOwnCell`, returning `{x, y, ringStep}`)
  // was corrected on that ruling and the correction is not cosmetic. It put
  // a FACT OUTWARD on the command-inward channel, and by resolving the point
  // to the screen instead of emitting it, it silently skipped everything
  // `requestPollination` does on the way past: `aimRef` was never written,
  // so §28.9's abort predicate had nothing to test and a gift flight was the
  // one flight in this app that could not be cancelled when its target moved
  // out from under it. Routing the arrival through the same launch closes
  // that by construction rather than by remembering to.
  //
  // Three things are now inherited rather than re-derived, and the third has
  // to be stated or it gets built backwards:
  //   * `shouldAbortPollination` — the aim is registered like any other.
  //   * Reduce Motion — the shared early return below is §5's collapse.
  //   * THE LANDING CAUSES NOTHING. The level is already correct before the
  //     bee moves (§28.1); the meniscus tween in `HoneyFill` runs off the
  //     `honeyLevel` PROP and fires whether or not anyone flies. A suppressed
  //     or aborted gift flight is not a lost gift.
  //
  // `cause` travels with the point because the fact channel is where a fact
  // about the flight belongs. The screen needs it to know which flights are
  // gifts (the bee carries a drop on those and only those), and deriving it
  // from "did I just call the command" would be a race against a measurement
  // that resolves a frame later. One field on the channel that already
  // exists; no second channel, no state out.
  const launchPollination = (cell, origin, cause) => {
    // Cell centres sit at (x + cellSize, y + cellSize) in cluster space — the
    // same offset `hitTest` undoes before inverting, one expression shared
    // with the scrim's centre calc in `handleSelect` (`combLattice.cellCentre`).
    const centre = cellCentre(cell, cellSize);
    pollinationKeyRef.current += 1;
    const key = pollinationKeyRef.current;
    const latestKey = aimRef.current?.key ?? null;
    if (latestKey != null && latestKey !== activePollinationKey) aimsRef.current.delete(latestKey);
    aimRef.current = {
      key,
      personId: personKey(cell.member),
      localX: centre.x,
      localY: centre.y,
      scrollY: readScrollY(),
    };
    aimsRef.current.set(key, aimRef.current);
    boundedPollinationAims(aimsRef.current, { currentKey: activePollinationKey, latestKey: key });
    onPollinate({
      key,
      cause,
      x: origin.x + centre.x,
      y: origin.y + centre.y,
      ringStep: ringStepFor(cellSize),
    });
  };

  // R-N4 — the arrival, as a command with no payload.
  //
  // WHERE THE OWN CELL IS, WITHOUT A TAP. `requestPollination` needs no
  // measurement: a tap hands it the same physical point in both coordinate
  // systems, so subtracting gives the cluster's window origin for free. An
  // arrival has no tap — its cause is a gift that landed while the user was
  // somewhere else — so the origin has to be measured.
  //
  // AND THE MEASURED ONE IS THE MORE EXACT OF THE TWO, not a fallback
  // (R-N4.1). The tap responder is an `absoluteFill` Pressable INSIDE the
  // cluster `Animated.View`, so `pageX - locationX` IS that view's window
  // origin, by construction — the same quantity. But the cluster's only
  // transform is the camera scale on `useNativeDriver: true` (`:562`), which
  // `measureInWindow` cannot see, so what comes back here is the SETTLED
  // frame while the tap-derived one carries the drift this file already
  // books as an accepted cost below. The camera settles at 600ms and the
  // shortest flight is 524.2ms, so the measurement is right for the frame
  // the bee lands in. `PerchAnchor.js:40` and `FlyingBee.js:435` state the
  // same guarantee; this is the third caller, not a new dependency.
  //
  // MEASURED AT THE MOMENT OF USE, never cached: the comb scrolls, and a
  // window origin read at layout is wrong by the scroll offset the instant
  // the user moves.
  //
  // R-N4.2 — THE BEAT IS CONDITIONAL ON THE OWN CELL, AND NOTHING ELSE
  // STANDS IN FOR IT. The condition is the seat's existence, read off the
  // seated population by `isOwn` and never by position: `isOwn` reaches a
  // member only from a share (`toGridMember`), and `partitionHive`'s today
  // chain has no seat-without-a-share path, so a user who has not posted
  // today has no seat — which is the population most likely to be RECEIVING
  // rather than giving, and it is independent of the gift rather than
  // correlated with it. When there is no seat NOTHING HAPPENS ON THE COMB:
  // never an empty cell (that seat is the invite target, and honey in it
  // says a stranger has honey), never the centre as a proxy for "you" (see
  // the header — the centre is whoever posted most recently), and never held
  // over for later (a drop kept until a cell appears is the badge this beat
  // exists to replace). Returning early here IS all three negatives.
  const pollinateOwnCell = () => {
    // The same early return `requestPollination` takes, for the same two
    // reasons: nowhere to publish the point, and under Reduce Motion there is
    // no bee to break from (§28.6, §5).
    if (!onPollinate || reduced) return;
    // ONE GUARD PER CASE, and the split is not tidiness. The first is a
    // RULED product state (R-N4.2: no seat, no beat) and the other two are a
    // view that could not be measured, which is never a beat. Folding them
    // into one condition would leave the next person amending a compound
    // guard without knowing which half carried the ruling.
    const cell = layout.cells.find((c) => c.member && c.member.isOwn);
    if (!cell) return;
    const node = clusterRef.current;
    if (!node || typeof node.measureInWindow !== 'function') return;
    node.measureInWindow((x, y) => {
      if (![x, y].every((n) => typeof n === 'number' && Number.isFinite(n))) return;
      launchPollination(cell, { x, y }, 'arrival');
    });
  };

  const cancelPollination = (key) => {
    aimsRef.current.delete(key);
    if (aimRef.current?.key === key) aimRef.current = null;
    if (landingLightRequest?.key === key) {
      lightGenerationRef.current += 1;
      landingLightRef.current?.stop();
      setLandingLightRequest(null);
      setLandingCentre(null);
    }
  };

  useImperativeHandle(ref, () => ({ igniteLanding, pollinateOwnCell, cancelPollination }));

  const requestPollination = (member, tap) => {
    // Under Reduce Motion there is no bee to break from — `FlyingBee` renders
    // the parked breathing pose — so the beat collapses to what the cell does
    // (§28.6). Not a special case: a property of the rig.
    if (!onPollinate || reduced) return;
    const cell = layout.cells.find((c) => c.member && personKey(c.member) === personKey(member));
    if (!cell) return;
    // The tap hands us BOTH coordinate systems for one physical point:
    // `locationX/Y` in cluster space (what `hitTest` reads) and `pageX/Y` in
    // window space (what the flight needs). Subtracting gives the cluster's
    // window origin with no `measureInWindow` and no extra frame. It is the
    // ONLY quantity this function takes from the tap (R-N4.1) — everything
    // else was tapless already, which is why the arrival could reuse the
    // launch rather than copy it.
    //
    // Exact once the camera dive has settled. During its first 600ms the
    // cluster is scaled, so a translation derived at the tap point drifts by
    // (scale − 1) × (centre − tapPoint) elsewhere — bounded by one cell, and
    // the flight is ~1s long, so the camera has settled well before touchdown
    // either way. Named rather than assumed, per §28.2.
    launchPollination(cell, { x: tap.pageX - tap.locationX, y: tap.pageY - tap.locationY }, 'tap');
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
    const aim = aimsRef.current.get(activePollinationKey);
    if (!aim) return;
    if (shouldAbortPollination(layout, aim, readScrollY())) {
      aimsRef.current.delete(aim.key);
      if (aimRef.current?.key === aim.key) aimRef.current = null;
      onPollinateCancel?.(aim.key);
    }
  }, [layout, scrollTick, activePollinationKey]);

  useEffect(() => () => {
    landingLightRef.current?.stop();
    aimRef.current = null;
    aimsRef.current.clear();
  }, []);

  // The camera dive-in is the screen's signature move, but it's also pure
  // travel — under Reduce Motion the cluster simply fades up in place.
  const cameraScale = cameraProgress.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 1 : 1.8, 1] });

  // Ruling 3(a): container's own box, for the SVG overlay's `width`/`height`
  // — `StyleSheet.absoluteFill` covers a View for free, but an `<Svg>` needs
  // its canvas size stated, and this is the only container-space size the
  // component doesn't already have from `layout`.
  const overlayCentre = landingCentre ?? tapCentre;
  const centreForOverlay =
    clusterOrigin && overlayCentre ? { x: clusterOrigin.x + overlayCentre.x, y: clusterOrigin.y + overlayCentre.y } : null;

  return (
    <View style={styles.container} onLayout={(e) => setContainerSize(e.nativeEvent.layout)}>
      <View style={[styles.stage, { height: layout.height + 24 }]}>
        <Animated.View
          ref={clusterRef}
          onLayout={(e) => setClusterOrigin({ x: e.nativeEvent.layout.x, y: e.nativeEvent.layout.y })}
          style={{
            width: layout.width,
            height: layout.height,
            // R-CL-1: the outermost cells' padded canvases reach CELL_CANVAS_PAD
            // past the cluster box on every side. Stated rather than left to a
            // platform default — iOS does not clip an overflowing child and
            // Android does, and a fix for a clipped outline that survives only
            // on one platform is half a fix.
            overflow: 'visible',
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

      {/* The comb's own disclosure, and it is gated on the POPULATION it
          describes — never on an emptiness predicate. HoneycombTab's
          empty-state chain already admits the demo seats in one of its four
          branches, but every one of those branches disappears the moment the
          feed has a single item in it, and the seats do not: the first entry
          a tester shares takes the admission off the screen and leaves six
          faces behind. A disclosure whose lifetime is shorter than the thing
          it discloses is not a disclosure (same defect class as the Wrapped
          preview subtitle that vanished after slide 1).

          It also names the register rather than replacing it — `DEMO_OPACITY`
          keeps carrying the distinction cell by cell, and this line is what
          makes that register legible. A label retires a register only when it
          shares the register's scope; this one has exactly the scope.

          Above `HexTapOverlay` in paint order on purpose: it recedes under
          the scrim with the comb it belongs to, rather than staying lit over
          a dimmed hive. */}
      {sampleSeats > 0 && (
        <Text style={styles.sampleNote}>
          {sampleSeats === members.length
            ? 'These seats are all samples.'
            : `${sampleSeats} of these seats are samples.`}
        </Text>
      )}

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
          {/* §23.9.1, extended to the comb (Lumen, MVP1 screen pass): the
              label travels with the MEMBER, not with an emptiness predicate.
              FeedCard already marks a demo share this way and this card is
              the comb's equivalent surface — it is the only place a sample
              person's own WORDS are rendered, and an unmarked quotation is
              the app telling you someone said something to you.

              Same register and the same ground as FeedCard's (`type.label`
              in `inkSoft` on `surface`, 6.3074:1), so the borrow carries its
              measurement. It sits at the far end of the row rather than
              beside the name because `revealName` is ALREADY label register
              here — adjacent, the two words would read as one string. */}
          <View style={styles.revealNameRow}>
            <Text style={styles.revealName}>{held.isOwn ? 'You' : held.name}</Text>
            {held.isDemo && <Text style={styles.revealSample}>SAMPLE</Text>}
          </View>
          <Text style={styles.revealQuote}>"{held.gratitude}"</Text>
        </Animated.View>
      )}
    </View>
  );
});

HoneycombGrid.displayName = 'HoneycombGrid';

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  // `inkSoft` on `background` (#FFF7CC — this container is transparent, same
  // ground the cell dimming is measured against): 5.8353:1, measured with
  // scripts/lib/color.mjs.
  sampleNote: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginTop: 4,
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
  revealNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  revealName: {
    ...theme.type.label,
    color: theme.colors.inkSoft,
    flexShrink: 1,
  },
  // `flexShrink: 0` for the same reason FeedCard's does it: a long display
  // name wraps, the label stays on the card.
  revealSample: {
    ...theme.type.label,
    color: theme.colors.inkSoft,
    flexShrink: 0,
  },
  revealQuote: {
    fontFamily: theme.fonts.bodyItalic,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.textPrimary,
  },
});
