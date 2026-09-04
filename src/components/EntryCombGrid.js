import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, BackHandler } from 'react-native';
import Svg, { Polygon, G, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { SPRINGS, DURATIONS, useReducedMotionState } from '../constants/motion';
import { hexSpiral, buildCombLayout, cellCentre, ringStepFor } from './combLattice';
import {
  hexPoints,
  HEX_HEIGHT_RATIO,
  hexHoneyPoints,
  hexHoneyMeniscus,
  honeyHeightForLevel,
  HONEY_MENISCUS_STROKE,
} from './hexGeometry';
import { paperInk, paperGround } from './PaperBlock';
import { PressableScale } from './PressableScale';
import { CombDivePaper } from './CombDivePaper';

const AnimatedG = Animated.createAnimatedComponent(G);

// POLLINATE_COMB_DIVE_SPEC.md — "The Dive." Renders a hive's entries as a
// comb (Colin's own framing: "each piece of the comb is one letter"), one
// cell per entry, and hosts the dive when a filled cell is tapped. Reuses
// hexGeometry.js/combLattice.js unchanged (Lumen's build-contract ruling:
// "hexGeometry.js and combLattice.js are already extracted pure modules —
// reuse them, don't fork the lattice").
//
// R-CD-12 addendum (2026-09-04) — this component does not mount the bee
// itself. `onCellFlight`/`onFlightHome` are the wire: the host screen owns
// `usePerchSet`/`PerchField`/`FlyingBee` (same split HoneycombTab already
// uses for its own comb), this file only measures the tapped cell and tells
// the host when to launch and when to come home. R-CD-13 addendum, same
// date — the rest-state cell paint, in `EntryCell` below.
export const CELL_SIZE = 44;
const CARD_INSET = theme.spacing.lg; // 24 — the card's own padding
const CARD_MARGIN_BOTTOM = 12;
// The smallest seat that can still carry a legible glyph. The overlay text is
// `size * 0.42` (the initials; the empty seat's "+" is `size * 0.5`, looser),
// and check-type-floor's floor for any derived font size is 11pt — so
// 11 / 0.42 = 26.19 is the seat below which the label, not the seat, is the
// thing that breaks. Written as a literal rather than as `11 / 0.42` because
// check-type-floor-derived resolves a floor it can READ, and the multiplier
// stays spelled inline in the JSX for the same reason.
//
// KNOWN LIMIT, stated rather than discovered later: this clamp binds at
// radius 4, i.e. the 38th memory (a 616.0pt lattice fitted into a 297pt box
// wants a 21.2pt seat). Below 38 memories the comb fits whole and legible;
// at and above it the outer ring clips again, exactly as it used to at 8.
// Moving the wall from 8 to 38 is what this pass buys; removing it needs the
// card to scroll or the comb to page, which is a bigger interaction change
// than a parity fix should smuggle in.
const MIN_CELL_SIZE = 26.2;
const PAPER_INSET = 18; // R-CD-4 — the paper settles to the card's 18pt inset
const FOCUS_FRACTION = 0.72; // R-CD-3 — focus cell's inradius spans ~72% of the card's short side
const APPROACH_END = 0.55; // R-CD-3 — camera/wax-shadow/backlight rise complete by here
const PAPER_START = 0.45; // R-CD-4
const CHROME_DIM_END = 0.2; // R-CD-3 — dim completes before camera is halfway (0.275)
const WAX_K = 0.2; // dolly displacement scale — prototype's k range 0.12-0.28, kept mid
const RIM_CROSSING_THRESHOLD = 0.5; // R-CD-6 — soft tick when the focus cell takes over the frame

// Exported so HiveDetail.js's chrome (banner, roster, action rows) can
// share the exact dim curve rather than a second copy of the numbers.
export const DIVE_CHROME_DIM = { end: CHROME_DIM_END, opacity: 0.35, drift: -6 };

const radiusForCount = (count) => {
  let r = 1;
  while (1 + 3 * r * (r + 1) < count) r += 1;
  return r;
};

export const EntryCombGrid = ({
  entries,
  writable,
  onWriteEntry,
  diveValue,
  onCellFlight,
  onFlightHome,
  // Room the screen's floating chrome takes out of the bottom of the stage,
  // measured by the caller rather than assumed here (HiveDetail's footer is
  // absolutely positioned, so it occupies no layout space this component
  // could otherwise see). Reserving it as bottom padding keeps the centred
  // lattice clear of the footer while the card SURFACE still runs to the
  // bottom of the room — the footer floating over the hive is the intent,
  // the comb disappearing under it is not (Lumen's C3b).
  bottomInset = 0,
  // (entry) -> short label for whoever wrote it, or null for "say nothing".
  // The screen owns this: it holds the viewer's identity and the roster, and
  // it already owns the hive's other naming rule (`rosterLabel`). Keeping the
  // resolution there means this component renders a decided string and never
  // has to know about sessions, placeholder-class names, or RLS refusals.
  authorLabelFor,
}) => {
  const { reduced } = useReducedMotionState();
  const dive = diveValue;
  const [cardSize, setCardSize] = useState(null);
  const [openCell, setOpenCell] = useState(null); // { key, entries } | null
  const rimCrossedRef = useRef(false);
  // R-CD-12.2 — the tap that opens a cell also measures it, so the host
  // screen's FlyingBee can be aimed at the exact point R-CD-3's backlight is
  // already igniting. Read at the moment of the tap, before any camera
  // transform exists (openCell is still null here), same technique as
  // HoneycombGrid's own `pollinateOwnCell`/`requestPollination`: the
  // cluster's window origin plus the cell's cluster-local centre.
  const clusterRef = useRef(null);
  // R-CD-5 "reverse dive never rolls" — the odometer's own chain (licensed
  // exception, R-CD-1) must stop the moment dismissal COMMITS, not wait for
  // the paper to unmount at the end of the close spring. Set true at the top
  // of `close()`, the single commit point every dismiss path (swipe-commit,
  // tap-elsewhere, RM) already funnels through; reset on the next open.
  const closingRef = useRef(false);

  // One entry, one seat — R-CD-7's multi-entry-per-cell case is left for a
  // future seating rule (grouping key TBD, a content question like the
  // anniversary framing the spec itself defers); CombDivePaper already
  // supports paging an array of entries per open, so seating several here
  // later is additive, not a rework.
  const seats = useMemo(() => entries.map((entry) => ({ id: entry.id, group: [entry] })), [entries]);
  const spiral = useMemo(() => hexSpiral(Math.max(1, radiusForCount(seats.length))), [seats.length]);

  // THE COMB USED TO CLIP AT EIGHT MEMORIES, and it was a wall rather than a
  // slope: seven entries fit on radius 1 (a 220.0pt lattice inside a 297pt
  // content box), the eighth pushes `radiusForCount` to 2, and a radius-2
  // lattice measures 352.0pt — wider than the box, inside a card that is
  // `overflow: 'hidden'`. The outer ring was simply cut off, and nothing said
  // so. (Both figures measured off `buildCombLayout` itself, not derived.)
  //
  // So the seat size is fitted to the room instead of being a constant the
  // room has to be big enough for. `buildCombLayout`'s dimensions are exactly
  // linear in `cellSize`, so a single ratio is the whole fit — no per-ring
  // special case, and radius 3 (484.0pt, the 20th memory) costs nothing extra.
  // Clamped at 1 deliberately: this shrinks a comb that would overflow, it
  // never inflates a small one to fill the room. A hive of three should read
  // as three seats with air around them, not three dinner plates.
  const fitBox = cardSize
    ? { width: cardSize.width - CARD_INSET * 2, height: cardSize.height - CARD_INSET * 2 - bottomInset }
    : null;
  const nominal = useMemo(() => buildCombLayout(seats, CELL_SIZE, spiral), [seats, spiral]);
  const fit = fitBox && fitBox.width > 0 && fitBox.height > 0
    ? Math.min(1, fitBox.width / nominal.width, fitBox.height / nominal.height)
    : 1;
  const cellSize = Math.max(MIN_CELL_SIZE, CELL_SIZE * fit);
  const layout = useMemo(
    () => (fit === 1 ? nominal : buildCombLayout(seats, cellSize, spiral)),
    [fit, nominal, seats, cellSize, spiral]
  );

  const focusCell = openCell ? layout.cells.find((c) => c.key === openCell.key) : null;
  const focusCentre = focusCell ? cellCentre(focusCell, cellSize) : null;

  const springDive = useCallback(
    (toValue, velocity, onDone) => {
      dive.stopAnimation();
      Animated.spring(dive, {
        toValue,
        velocity: velocity ?? 0,
        useNativeDriver: true,
        ...(toValue === 0 ? SPRINGS.diveExit : SPRINGS.diveIn),
      }).start(onDone);
    },
    [dive]
  );

  const openAt = useCallback(
    (cell) => {
      if (!cell.member) {
        if (writable) onWriteEntry?.();
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      rimCrossedRef.current = false;
      closingRef.current = false;
      setOpenCell({ key: cell.key, entries: cell.member.group });
      if (reduced) {
        dive.stopAnimation();
        Animated.timing(dive, { toValue: 1, duration: DURATIONS.diveRmIn, useNativeDriver: true }).start();
      } else {
        springDive(1);
        // R-CD-12.2/.3 — the bee's launch is a second response to the same
        // tap, concurrent with the descent, never gating it. RM gets none of
        // it (R-CD-12.1's freeze doctrine), same guard HoneycombGrid's own
        // requestPollination/pollinateOwnCell take before calling onPollinate.
        if (onCellFlight) {
          const centre = cellCentre(cell, cellSize);
          clusterRef.current?.measureInWindow?.((x, y) => {
            if (![x, y].every((n) => typeof n === 'number' && Number.isFinite(n))) return;
            onCellFlight({ x: x + centre.x, y: y + centre.y, ringStep: ringStepFor(cellSize) });
          });
        }
      }
    },
    [reduced, springDive, writable, onWriteEntry, dive, onCellFlight]
  );

  const close = useCallback(
    (velocity) => {
      closingRef.current = true;
      const finish = () => setOpenCell(null);
      if (reduced) {
        dive.stopAnimation();
        Animated.timing(dive, { toValue: 0, duration: DURATIONS.diveRmOut, useNativeDriver: true }).start(finish);
      } else {
        springDive(0, velocity, finish);
        // R-CD-12.4 — close is the single commit point every dismiss path
        // funnels through (closingRef's own doctrine, D11); the bee's return
        // rides the same funnel rather than a second exit path per dismiss
        // gesture.
        onFlightHome?.();
      }
    },
    [reduced, springDive, dive, onFlightHome]
  );

  // R-CD-1 — "Input never disabled": a tap anywhere on the comb while a
  // dive is open (or opening) retargets to 0 first, rather than being
  // swallowed. Reopening a different cell is a known follow-up (see the
  // module comment above) — this build always closes on any grid tap while
  // open, which is still a processed, continuous response, never a dropped
  // one.
  const handleCellPress = (cell) => {
    if (openCell) {
      close();
      return;
    }
    openAt(cell);
  };

  // R-CD-6 rim-crossing tick — fires once per open, on the frame the camera
  // approach crosses RIM_CROSSING_THRESHOLD, reset so the next open can fire
  // again. Side-effect only (a haptic), never drives a visual — legal on a
  // native-driven value per the app's own established pattern.
  const handleDiveTick = useCallback(({ value }) => {
    if (value >= RIM_CROSSING_THRESHOLD && !rimCrossedRef.current) {
      rimCrossedRef.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } else if (value < RIM_CROSSING_THRESHOLD) {
      rimCrossedRef.current = false;
    }
  }, []);

  React.useEffect(() => {
    const id = dive.addListener(handleDiveTick);
    return () => dive.removeListener(id);
  }, [dive, handleDiveTick]);

  // Android's back gesture closes the LETTER, not the hive. Without this it
  // fell through to the navigator and popped the whole screen — the same
  // complaint the header's back button earns ("reads as 'leave this hive,'
  // not 'close this entry'"), except the system gesture has no visible
  // alternative to notice. Subscribed only while a cell is open, so back
  // means exactly what it always meant everywhere else on this screen.
  // Routed through `close()` like every other dismiss path.
  React.useEffect(() => {
    if (!openCell) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [openCell, close]);

  // Measured off the card's own box, which now GROWS with the room. The
  // composition change flips which argument this `min` returns: the card was
  // ~345 x 260 and HEIGHT-governed, so the dive's depth was set by the
  // `minHeight` floor; flexed, the box is taller than it is wide and the
  // same expression becomes WIDTH-governed at ~345. Depth therefore rises
  // with the room — ~2.46x before, ~3.26x after, at CELL_SIZE — without a
  // second constant to keep in sync, which is why this stayed an expression
  // rather than becoming a tuned number. `bottomInset` is subtracted so the
  // depth is measured against the room the comb actually occupies rather
  // than the strip the footer floats over.
  //
  // The dive's SPEED is a separate axis and lives with the spring, in
  // `SPRINGS.diveIn` — see the measured table there. Depth is geometry and
  // belongs here; duration is the driver's and belongs to the token.
  const shortSide = cardSize ? Math.min(cardSize.width, cardSize.height - bottomInset) : 0;
  const inradius = cellSize * HEX_HEIGHT_RATIO;
  const targetScale = shortSide ? (FOCUS_FRACTION * shortSide) / (2 * inradius) : 1;

  const camTranslateX = focusCentre ? layout.width / 2 - focusCentre.x : 0;
  const camTranslateY = focusCentre ? layout.height / 2 - focusCentre.y : 0;

  // The opened seat's mark leaves when the rest of the chrome leaves — same
  // constant HiveDetail's banner/rows already dim on, so the tap's
  // acknowledgement and the screen's retreat are one gesture rather than two
  // schedules. Null under reduced motion, where the stroke holds instead (see
  // EntryCell): there is no camera to get out of the way of.
  const focusStrokeOpacity =
    openCell && !reduced
      ? dive.interpolate({ inputRange: [0, CHROME_DIM_END], outputRange: [1, 0], extrapolate: 'clamp' })
      : null;

  const camInputRange = [0, APPROACH_END, 1];
  const clusterTransform =
    openCell && !reduced
      ? [
          { translateX: dive.interpolate({ inputRange: camInputRange, outputRange: [0, camTranslateX, camTranslateX], extrapolate: 'clamp' }) },
          { translateY: dive.interpolate({ inputRange: camInputRange, outputRange: [0, camTranslateY, camTranslateY], extrapolate: 'clamp' }) },
          { scale: dive.interpolate({ inputRange: camInputRange, outputRange: [1, targetScale, targetScale], extrapolate: 'clamp' }) },
          // `targetScale` is already absolute (it is derived from the FITTED
          // inradius), so the rest value stays 1 — the fit lives in the
          // lattice's own geometry, not in a second scale term stacked on top
          // of the camera's. One transform, one meaning.
        ]
      : undefined;

  return (
    // Two views, and the split is forced rather than stylistic: on iOS
    // `overflow: 'hidden'` sets the layer's `masksToBounds`, which clips the
    // layer's own drop shadow away entirely. R-CD §0 needs the clip (the dive
    // is contained in the card, never full-screen) and the parity pass needs
    // the shadow, so they cannot live on one node. Outer carries the surface,
    // the radius, the margins and the shadow; inner carries the clip and the
    // padding. `onLayout` stays on the padded inner box so `cardSize` keeps
    // reporting exactly what it reported before this change (the border box,
    // padding included, margins excluded) — the dive's depth is measured off
    // it and must not silently change meaning.
    <View style={styles.card}>
      <View
        style={[styles.cardClip, bottomInset ? { paddingBottom: CARD_INSET + bottomInset } : null]}
        onLayout={(e) => setCardSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      >
      <Animated.View
        ref={clusterRef}
        style={[
          styles.cluster,
          { width: layout.width, height: layout.height },
          clusterTransform ? { transform: clusterTransform } : null,
        ]}
      >
        {layout.cells.map((cell) => {
          const isFocus = openCell && cell.key === openCell.key;
          // FITTED size, not the constant: `cell.x`/`cell.y` come off a
          // layout built at `cellSize`, and `focusCentre` a few lines up is
          // measured the same way. Reading this one at CELL_SIZE mixed two
          // scales inside a single subtraction — the wax dolly's `dx`/`dy`
          // would have pointed the wrong way by a growing margin for exactly
          // the combs the fit exists for (eight memories and up). Caught by
          // D20, which is why that row is phrased about geometry calls
          // generally rather than about the sites that happened to be known.
          const centre = cellCentre(cell, cellSize);
          let dolly = null;
          let waxOpacity = null;
          let backlightOpacity = null;

          if (openCell && !reduced) {
            if (!isFocus && focusCentre) {
              const dx = centre.x - focusCentre.x;
              const dy = centre.y - focusCentre.y;
              const dist = Math.hypot(dx, dy) || 1;
              const ux = dx / dist;
              const uy = dy / dist;
              dolly = {
                x: dive.interpolate({
                  inputRange: camInputRange,
                  outputRange: [0, dist * WAX_K * ux, dist * WAX_K * ux],
                  extrapolate: 'clamp',
                }),
                y: dive.interpolate({
                  inputRange: camInputRange,
                  outputRange: [0, dist * WAX_K * uy, dist * WAX_K * uy],
                  extrapolate: 'clamp',
                }),
              };
              waxOpacity = dive.interpolate({ inputRange: camInputRange, outputRange: [0, 1, 1], extrapolate: 'clamp' });
            } else if (isFocus) {
              backlightOpacity = dive.interpolate({
                inputRange: [0, 0.4, PAPER_START, 0.75, 1],
                outputRange: [0, 1, 1, 0, 0],
                extrapolate: 'clamp',
              });
            }
          }

          return (
            <EntryCell
              key={cell.key}
              cell={cell}
              size={cellSize}
              dolly={dolly}
              waxOpacity={waxOpacity}
              backlightOpacity={backlightOpacity}
              focusStrokeOpacity={isFocus ? focusStrokeOpacity : null}
              isFocus={!!isFocus}
              writable={writable}
              authorLabel={authorLabelFor?.(cell.member?.group?.[0]) ?? null}
              onPress={() => handleCellPress(cell)}
            />
          );
        })}
      </Animated.View>

      {openCell ? (
        <CombDivePaper
          dive={dive}
          reduced={reduced}
          entries={openCell.entries}
          cellSize={cellSize}
          paperInset={PAPER_INSET}
          paperStart={PAPER_START}
          closingRef={closingRef}
          onDismiss={(velocity) => close(velocity)}
        />
      ) : null}
      </View>
    </View>
  );
};

const EntryCell = ({
  cell,
  size,
  dolly,
  waxOpacity,
  backlightOpacity,
  focusStrokeOpacity,
  isFocus,
  writable,
  authorLabel,
  onPress,
}) => {
  const entry = cell.member?.group?.[0] ?? null;
  const filled = !!cell.member;
  const paper = entry?.paper ?? null;
  // The seat's own ground. Cream stays exactly what R-CD-13 ruled
  // (`washYellow`); an evening entry seats on `paperEvening` via the one
  // writer in PaperBlock, so the cell that holds the letter and the letter
  // itself are on the same paper. `paperInk` carries the matching ink pair
  // (Lumen's A2: this file never hand-picks `paperEveningInk`).
  const ground = paperGround(paper) ?? theme.colors.washYellow;
  const ink = paperInk(paper);
  const honeyHeight = honeyHeightForLevel(size, 1);
  const honeyPoints = hexHoneyPoints(size, honeyHeight);
  const meniscus = hexHoneyMeniscus(size, honeyHeight);

  const outerStyle = [
    styles.cellSlot,
    { left: cell.x, top: cell.y, width: size * 2, height: size * 2 },
  ];
  const Wrapper = dolly ? Animated.View : View;
  const wrapperStyle = dolly ? [...outerStyle, { transform: [{ translateX: dolly.x }, { translateY: dolly.y }] }] : outerStyle;

  // An empty seat, painted rather than implied — EmptyCell's own recipe from
  // HoneycombGrid (`surface` @0.45 + `surfaceBorderStrong` @1.5 + a centred
  // "+"), which already solved this honestly on the public comb. Gated on
  // `writable`, exactly like the accessibility label below: on a sealed hive
  // a leftover seat is not an invitation, so it stays the quiet hairline
  // outline it is today rather than advertising a tap that does nothing.
  // Lumen's A1 — the PAINT is borrowed, never EmptyCell's own
  // `accessibilityLabel="a seat for someone"`. That is the public comb's
  // invite register; here the Pressable already announces "Write a memory",
  // and nesting both would hand VoiceOver two different claims about one cell.
  const seatOpen = !filled && writable;

  return (
    <Wrapper style={wrapperStyle}>
      <PressableScale
        onPress={onPress}
        // An empty cell on a sealed hive (writable: false) does nothing on
        // tap — "Write a memory" there is a promise the press doesn't keep
        // (Lumen's rider, 2026-09-04). No label at all in that case, same
        // as any other inert affordance.
        accessibilityLabel={filled ? 'Open this memory' : writable ? 'Write a memory' : undefined}
      >
        <View style={{ width: size * 2, height: size * 2 }}>
          <Svg width={size * 2} height={size * 2}>
            {/* R-CD-13 — rest-state paint drops from full-saturation `accent`
                to `washYellow` (the existing warm-ground wash, "a role, not a
                screen" per its own token comment — no new literal). Stroke
                drops to hairline: `glassHairline` (ink at 0.18) at
                borderWidth-equivalent 1, GlassRim's precedent that
                StyleSheet.hairlineWidth (0.333pt @3x) reads as a conformance
                miss, not this file's own convention. The honey vessel below
                keeps `accentDeep` untouched — it stays the loudest, and
                highest-chroma, thing in the cell (scripts/check-comb-dive.mjs
                D13 asserts the ordering numerically). */}
            <Polygon
              points={hexPoints(size)}
              fill={filled ? ground : seatOpen ? theme.colors.surface : 'transparent'}
              fillOpacity={!filled && seatOpen ? 0.45 : 1}
              stroke={seatOpen ? theme.colors.surfaceBorderStrong : theme.colors.glassHairline}
              strokeWidth={seatOpen ? 1.5 : 1}
            />
            {filled ? (
              /* The honey is a VESSEL, not a stripe — HoneyFill's exact paint
                 recipe from HoneycombGrid, ported whole: a `surface` underlay,
                 `accentDeep` at 0.5 over it, and the 1.5pt `ink` meniscus that
                 makes it read as a held quantity with a surface rather than a
                 flat band. Only the recipe crosses over, never the gating: the
                 public comb reads `member.honeyLevel` off the nectar economy,
                 which a private entry has no equivalent of, so the height stays
                 the constant `honeyHeightForLevel(size, 1)` this file already
                 used — one full vessel per filled seat, no invented level and
                 no proxy metric (Deezine's spec, ratified; per-entry variance
                 is a deferred semantics call).

                 INVARIANT ACROSS PAPERS (Lumen's A3): all three layers are
                 identical on an evening cell. The `ink` meniscus is licensed on
                 dark paper because it sits on the honey's own `surface` ground,
                 not on the paper — R-EXT's dark-paper ink gate governs elements
                 painted on the PAPER, and the vessel brings its own. Honey is
                 one substance in every seat; that is the whole point of drawing
                 it as a vessel. */
              <>
                <Polygon points={honeyPoints} fill={theme.colors.surface} />
                <Polygon points={honeyPoints} fill={theme.colors.accentDeep} fillOpacity={0.5} />
                <Line
                  x1={meniscus.x1}
                  y1={meniscus.y1}
                  x2={meniscus.x2}
                  y2={meniscus.y2}
                  stroke={theme.colors.ink}
                  strokeWidth={HONEY_MENISCUS_STROKE}
                />
              </>
            ) : null}
            {backlightOpacity ? (
              <AnimatedG opacity={backlightOpacity}>
                <Polygon points={hexPoints(size)} fill={theme.colors.accentBurst} />
              </AnimatedG>
            ) : null}
            {/* The opened seat's own mark. Colour is `paperInk(paper)`, not a
                flat `ink`: Lumen measured `ink` on `paperEvening` at 1.31:1 —
                two near-black warm darks — so an ink stroke would leave the
                dived-into cell unmarked on exactly the moodiest entries, while
                `paperEveningInk` measures 9.05:1. Width is 2.5pt on both
                papers, FilledCell's own selected width ("no width change, the
                luxury is restraint").

                It FADES rather than riding the dolly to 2.46x, which answers
                Lumen's "decide it deliberately" with a decision: the stroke
                lives inside the SVG the camera scales, so at full dive it would
                render ~6pt — a heavier edge than any rule in this system, on a
                cell the paper is about to cover anyway. It leaves when the rest
                of the chrome leaves (DIVE_CHROME_DIM.end), so the mark
                acknowledges the tap and then gets out of the camera's way.
                Under reduced motion there IS no camera and no distortion to
                avoid, and the paper cross-fades in place — there the stroke is
                the only thing saying which seat opened, so it holds. */}
            {isFocus ? (
              focusStrokeOpacity ? (
                <AnimatedG opacity={focusStrokeOpacity}>
                  <Polygon points={hexPoints(size)} fill="none" stroke={ink} strokeWidth={2.5} />
                </AnimatedG>
              ) : (
                <Polygon points={hexPoints(size)} fill="none" stroke={ink} strokeWidth={2.5} />
              )
            ) : null}
          </Svg>
          {/* Who wrote it. Collective hives only — the gate is the caller's
              (`authorLabel` is null on a solo hive), matching this file's own
              precedent of saying nothing where a label carries no information.
              `honeyHMax`'s glyph clearance is why this can sit over the vessel
              without a stacking rule: the ceiling is derived to clear exactly
              this glyph (hexGeometry §6.4/§4). */}
          {filled && authorLabel ? (
            <View style={styles.cellOverlay} pointerEvents="none">
              <Text style={[styles.initials, { fontSize: size * 0.42, color: ink }]}>{authorLabel}</Text>
            </View>
          ) : null}
          {seatOpen ? (
            <View style={styles.cellOverlay} pointerEvents="none">
              <Text style={[styles.plus, { fontSize: size * 0.5 }]}>+</Text>
            </View>
          ) : null}
          {waxOpacity ? (
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: waxOpacity }]}>
              <Svg width={size * 2} height={size * 2}>
                <Polygon points={hexPoints(size)} fill={theme.colors.spotlightDim} />
              </Svg>
            </Animated.View>
          ) : null}
        </View>
      </PressableScale>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: CARD_MARGIN_BOTTOM,
    // "The hive is the room, not a card floating in one" (Deezine's
    // composition direction, ratified 2026-09-04). The card used to be
    // sized-to-content at `minHeight: 260` while HiveDetail's footer is
    // pinned absolutely to the screen, so everything between them rendered
    // as raw cream with nothing in it. `flex: 1` gives the comb the room it
    // actually has. `minHeight` stays as a FLOOR rather than being deleted —
    // it costs nothing and guards a short window (Lumen's C1).
    //
    // The flex chain is three explicit touches, and all three are load
    // bearing: HiveDetail's stage wrapper, the `PerchAnchor` between them
    // (`PerchField` renders no View at all — it is a bare context provider,
    // so the anchor is the only box in the middle), and this. Without the
    // anchor's own `flex: 1` this line resolves against an auto-height
    // parent and the card collapses to zero.
    flex: 1,
    minHeight: 260,
    // Renders because this node is NOT the clipping one — see the render's
    // own note. `card`, not `floating`: this is a resting surface, not
    // something pressable or afloat (the token's own comment draws that line).
    ...theme.shadows.card,
  },
  cardClip: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: theme.borderRadius.medium,
    padding: CARD_INSET,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // R-CD §0 — contained in the comb card, never full-screen
  },
  cluster: {
    position: 'relative',
  },
  cellSlot: {
    position: 'absolute',
  },
  cellOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: theme.fonts.bodySemiBold,
  },
  plus: {
    fontFamily: theme.fonts.body,
    color: theme.colors.inkSoft,
    opacity: 0.55,
  },
});
