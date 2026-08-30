import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, PixelRatio, StyleSheet } from 'react-native';
import {
  BREATH_BEAT_DEG,
  BREATH_CYCLE_MS,
  BREATH_RISE_CYCLE_MS,
  BREATH_RISE_FRACTION,
  BREATH_RISE_SPLIT,
  FLICK_BEATS,
  FLICK_INTERVAL_MAX_MS,
  FLICK_INTERVAL_MIN_MS,
  HINGE,
  MASCOT_ASPECT,
  MASCOT_BASE_PX,
  MASCOT_WIDTH_FRACTION,
  SETTLE_DIP_FRACTION,
  SETTLE_DIP_MS,
  SETTLE_FLICK_BEATS,
  SETTLE_INTERVAL_MAX_MS,
  SETTLE_INTERVAL_MIN_MS,
  SETTLE_OVERSHOOT_FRACTION,
  SETTLE_OVERSHOOT_SPLIT,
  SETTLE_RECOVER_MS,
  WING_BEAT_DEG,
  WING_BEAT_MS,
} from '../constants/mascot';

// §19.5 / R79 — **the mascot itself, flying.** Colin: "never have any other
// bee than our mascot." A redraw cannot satisfy that by construction — the
// best flat cousin is still a likeness — so the character in flight is the
// ratified 3D render, split into two layers so it can still beat its wings.
//
// **Why a split raster has parts.** R70 concluded it doesn't, off the render's
// alpha: 89% fully opaque, no second population. That measured a *material*
// property when separability is a *geometric* one — the only thing you cannot
// recover is what something else is painted over. The wings sit entirely
// behind and to the left of the body; body pixels straddle the wing span in 22
// of 1254 rows, and those rows are legs, which belong to the body layer
// anyway. So a mask splits it and nothing has to be painted back in.
//
// **The cutout does not use R70's luma key.** That recipe took alpha from
// luminance against the black plate, which is right for the wings — genuinely
// translucent, and bright enough that luma tracks their opacity — and wrong by
// construction wherever the subject is dark. The mascot's dark pixels are its
// bands, eyes, brows and antennae: every feature that carries the character.
// Measured on the first split, the bands recomposited at median max-channel
// 117 against the source's 42, because their alpha averaged 0.752 and the
// cream ground came through. The yellow body reproduced exactly, which is why
// the recipe looked solved — it had been validated on the pixels that could
// not fail it. Alpha now comes from a filled subject mask (a dark band is
// interior, whatever its luma) and the luma ramp survives only inside the wing
// region. Bands rebuild at 17.0 against the source's 17.0.
// Pipeline: `.scratch/r82-mascot-flight/build_layers.py`.
//
// **The character is not levelled.** Its body axis is drawn climbing (−45.6°
// abdomen-to-head, −55.3° by thickness-weighted PCA — two measurements that
// agree on a quantity which turns out not to decide anything). Rotating the
// body level tips the *head*, because the head is already drawn upright: what
// a viewer reads as the character's attitude is set by the face, not the body
// axis. Rendered side by side at the four real cruise attitudes, the drawn
// pose reads upright and airborne at every one and the levelled pose reads as
// a face-plant. So the drawn pose IS the flight pose, and `bank` tips it from
// there. Sheet: `.scratch/r82-mascot-flight/flight_attitudes.png`.
//
// Sizing is a drop-in for `StripedBee`: `size` is the box side, and the
// character is drawn at `MASCOT_WIDTH_FRACTION` of it — the same fraction of
// its box that StripedBee's drawing occupies (0.683), so every anchored call
// site keeps its footprint. It comes out taller (0.708 vs 0.47 of the box),
// which is the head and the trailing abdomen that StripedBee doesn't have.
const WING = require('../../assets/mascot-wing.png');
const BODY = require('../../assets/mascot-body.png');

// Hero LOD, `design/pipeline/`-cut and landing with its first real mount
// above `MASCOT_BASE_PX` (Lumen's ruling, thread 01325980, requirement 3) —
// one writer for the character's pixels, so the bundle carries no megabytes
// nothing draws until a caller actually needs them. Metro's dependency
// collector treats a `require` wrapped in try/catch as an OPTIONAL
// dependency: verified empirically (`expo export`, clean bundle, zero
// warnings) that it does not fail resolution when the file is absent, unlike
// a bare top-level `require` of a missing asset, which throws unconditionally
// at bundle time regardless of whether the branch is ever reached. That is
// what makes "switch first, asset later" buildable rather than just ordered.
//
// The pair is assigned atomically: both requires resolve into locals first,
// and HERO_WING/HERO_BODY only commit together at the end of the try block.
// If they were assigned directly and the pair ever half-landed (one file
// present, one missing), the second require's throw would leave the first
// one committed — hero wing over base body, a mixed-LOD state requirement 3
// assumes can't happen because the pipeline always cuts both at once.
let HERO_WING = null;
let HERO_BODY = null;
try {
  const wing = require('../../assets/mascot-wing-hero.png');
  const body = require('../../assets/mascot-body-hero.png');
  HERO_WING = wing;
  HERO_BODY = body;
} catch (e) {
  // Not cut yet, or cut incompletely. Falls through to the base raster.
}

// `beat` lets a caller drive the wing itself with an Animated.Value in [0,1].
// The component owns the beat's GEOMETRY — where the hinge is, how far the
// wing swings — and the caller may own its RHYTHM, which is the same split
// §12.5.1b makes for springs: a named curve fixes shape, not duration. The
// hero pose needs it: a held bee flicks twice and rests, and a bee that
// buzzes continuously at 148pt reads like a loading spinner rather than a
// character. `flutter` is the built-in loop for everything that is in transit.
// `breath` is the doctrine's State 2 and it is the SAME channel as `flutter`,
// not a second one. A perched bee and an airborne bee both move exactly one
// thing — the wing, about its hinge — and they differ in how far and how
// slowly. Giving Breath its own transform would be two mechanisms for one
// gesture, and the first time they were both live the wing would carry two
// drivers on one value (R83's rule, and R46's).
//
// So the mode picks the RHYTHM, and the geometry never changes:
//
//     flutter   0 .. 1                80ms out, 80ms back        airborne
//     breath    BREATH_LO .. _HI      2100ms out, 2100ms back    perched
//     flick     0 .. 1, twice         80ms a half-beat           punctuation
//
// **The sweep is no longer a mode's property, and that is the change that lets
// a perched bee flick.** It used to be: `sweepDeg` picked 2 or 18 and the
// driven value always ran the full 0..1. One value cannot then carry two
// amplitudes, so a breathing bee could not briefly do anything larger without
// swapping its own transform mid-gesture. Now the rotation maps 0..1 onto the
// FULL 18-degree beat once and for all, and Breath simply declines to use most
// of it — it oscillates inside a band of `BREATH_BEAT_DEG / WING_BEAT_DEG` of
// the range, centred, which renders exactly the same +/-1 degree it always did
// (0.4444 -> -1.0000deg, 0.5556 -> +1.0000deg). Amplitude becomes a property of
// the rhythm, which is the half this component already said the caller owns.
//
// `flutter` wins if both are passed. That is not a preference: an airborne bee
// whose host also asked for breath is a host that has not noticed the bee took
// off, and the wing that reads correctly there is the flying one.
const BREATH_BAND = BREATH_BEAT_DEG / WING_BEAT_DEG;
const BREATH_LO = 0.5 - BREATH_BAND / 2;
const BREATH_HI = 0.5 + BREATH_BAND / 2;

export const MascotBee = ({ size = 44, flutter = false, breath = false, beat: driven, wingStyle }) => {
  const own = useRef(new Animated.Value(0)).current;
  // The body's half of Breath (Colin, 2026-08-29). A SECOND value on a SECOND
  // clock, and both halves of that are the point — see `BREATH_RISE_CYCLE_MS`.
  // It is not a second driver on one value (R46/R83): the wing and the body are
  // two gestures, and each has exactly one.
  const rise = useRef(new Animated.Value(0)).current;
  // The settle beat's own value (R-PW-3), and a THIRD value rather than a
  // deeper excursion on `rise` for a reason the arithmetic forces. A settle
  // read off `rise` would have to travel to a value outside the breath's
  // declared [0, 1] band — the dip is 1.88x the whole breath's half-range —
  // so its amplitude would be expressed as a multiple of a constant it has
  // nothing to do with, and every future retune of `BREATH_RISE_FRACTION`
  // would silently retune the settle too. One value per gesture; one driver
  // per value (R46/R83) is untouched. The two compose as two entries in one
  // transform array, which is additive, so the body channel is still one
  // channel — see `bodyStyle`.
  const settle = useRef(new Animated.Value(0)).current;
  // The mutual-defer token, and the wing channel's one command. §4's
  // collision rule is "simple mutual defer, never queue", and a defer needs
  // exactly one bit both gestures can see — `busy` is that bit. `absorb` is
  // the settle's only reach into the wing channel: COMMANDS IN, NO STATE OUT
  // (R-N4's rule). It takes nothing, returns nothing, and exists only while
  // the wing is perched, so the settle cannot half-fire on a channel that
  // is flying or caller-driven.
  const gesture = useRef({ busy: false, absorb: null }).current;
  const beat = driven ?? own;
  const breathing = breath && !flutter;
  const animated = flutter || breathing;

  // The wing's conductor: a loop, and — while perched — a flick that
  // interrupts it and hands it back.
  //
  // **One animation is running at a time and the callback is the only thing
  // that advances the state**, which is `FlyingBee`'s own discipline for the
  // same reason: an interrupt (unmount, a mode change, a screen leaving) stops
  // exactly one thing and cannot leave a queued beat behind it. `current` is
  // whichever of the two is live.
  useEffect(() => {
    if (!animated || driven) return undefined;
    // The doctrine asks Breath for "ease-in-out, symmetric (not a spring — a
    // measured breath)", and that is what a `timing` with no `easing` already
    // is: `TimingAnimation.js:77` defaults to `easeInOut()`. So the curve is
    // STATED here rather than changed — the flutter path keeps whatever the
    // default is by continuing not to pass one, because writing the default
    // out longhand on a shipped wingbeat is a behaviour change wearing a
    // clarification's clothes if the two ever turn out not to be identical.
    const halfMs = breathing ? BREATH_CYCLE_MS / 2 : WING_BEAT_MS;
    const curve = breathing ? { easing: Easing.inOut(Easing.ease) } : null;
    const lo = breathing ? BREATH_LO : 0;
    const hi = breathing ? BREATH_HI : 1;
    // The band is where the value LIVES now, so it also has to be where the
    // value STARTS: leaving `own` at its constructed 0 would open a breathing
    // bee on a full-down wing and ease it up over 2.1 seconds, which is a
    // 9-degree entrance nobody asked for on a page whose quiet is a ruling.
    own.setValue(lo);

    let cancelled = false;
    let current = null;
    let timer = null;

    const breathe = () => {
      current = Animated.loop(
        Animated.sequence([
          Animated.timing(own, { toValue: hi, duration: halfMs, ...curve, useNativeDriver: true }),
          Animated.timing(own, { toValue: lo, duration: halfMs, ...curve, useNativeDriver: true }),
        ])
      );
      current.start();
      if (breathing) schedule();
    };

    // Punctuation. Re-rolled after every flick rather than run on a period,
    // because a fixed interval is a metronome with a long arm — the one thing
    // a character cannot afford is for you to learn when it will next move.
    // One gesture shape, two rhythms that ask for it: the punctuation flick
    // (`FLICK_BEATS`, on its own timer) and the settle's single absorbing beat
    // (`SETTLE_FLICK_BEATS`, on the settle's clock). Only the COUNT differs, so
    // only the count is a parameter — a second copy of this sequence would be a
    // second place for the wing's geometry to drift, which is the thing the
    // register rule exists to prevent.
    //
    // `Array.from` rather than a counted `for`, and the reason is a gate:
    // `check-bee-attitude` forbids a bare numeric declarator anywhere in this
    // file, so that neither register can quietly grow geometry of its own
    // instead of importing `constants/mascot`. A loop counter is not geometry,
    // but the rule is blunt on purpose — an invariant that has to decide what a
    // number MEANS is an invariant with an argument in it — and writing the
    // loop without a counter costs nothing.
    const beats = (count) => {
      current?.stop();
      const steps = [];
      Array.from({ length: count }).forEach(() => {
        steps.push(Animated.timing(own, { toValue: 1, duration: WING_BEAT_MS, useNativeDriver: true }));
        steps.push(Animated.timing(own, { toValue: 0, duration: WING_BEAT_MS, useNativeDriver: true }));
      });
      // Back into the band before the loop resumes, at the flick's own pace.
      // Without it the first breath half would travel 0 -> 0.5556 in 2100ms —
      // half the sweep at a breath's speed, which reads as the wing sagging.
      steps.push(Animated.timing(own, { toValue: lo, duration: WING_BEAT_MS, useNativeDriver: true }));
      current = Animated.sequence(steps);
      return current;
    };

    const schedule = () => {
      const wait =
        FLICK_INTERVAL_MIN_MS + Math.random() * (FLICK_INTERVAL_MAX_MS - FLICK_INTERVAL_MIN_MS);
      timer = setTimeout(() => {
        if (cancelled) return;
        // §4's collision rule, the flick's half. A settle in flight owns both
        // channels for ~760ms; the flick DEFERS TO ITS NEXT RE-ROLL rather than
        // queueing, because a queued gesture is a metronome with a buffer — it
        // would fire the instant the settle released, which is the one moment
        // the character has just finished moving.
        if (gesture.busy) {
          schedule();
          return;
        }
        gesture.busy = true;
        beats(FLICK_BEATS).start(({ finished }) => {
          gesture.busy = false;
          if (finished && !cancelled) breathe();
        });
      }, wait);
    };

    // The settle's reach into this channel. Installed only while PERCHED, so
    // it is exactly co-extensive with the rise effect's own precondition:
    // the settle cannot fire against a fluttering or caller-driven wing.
    // It does NOT touch `gesture.busy` — the settle set that bit and the
    // settle clears it; two owners for one lock is how a lock stops working.
    if (breathing) {
      gesture.absorb = () => {
        if (cancelled) return;
        beats(SETTLE_FLICK_BEATS).start(({ finished }) => {
          if (finished && !cancelled) breathe();
        });
      };
    }

    breathe();
    return () => {
      cancelled = true;
      gesture.absorb = null;
      clearTimeout(timer);
      current?.stop();
    };
  }, [animated, breathing, driven, gesture, own]);

  // The body. Perched only: an airborne bee's position is the track's, and a
  // rise composed onto a flight would be the hover the doctrine retires.
  useEffect(() => {
    if (!breathing) return undefined;
    rise.setValue(0);
    settle.setValue(0);
    const up = BREATH_RISE_CYCLE_MS * BREATH_RISE_SPLIT;

    // Same discipline as the wing's conductor and for the same reason: ONE
    // animation is live at a time on this channel, and its callback is the
    // only thing that advances the state, so an unmount stops exactly one
    // thing and cannot leave a queued beat behind it.
    let cancelled = false;
    let current = null;
    let timer = null;

    const breatheBody = () => {
      current = Animated.loop(
        Animated.sequence([
          Animated.timing(rise, {
            toValue: 1,
            duration: up,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rise, {
            toValue: 0,
            duration: BREATH_RISE_CYCLE_MS - up,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      current.start();
      // The settle is scheduled off the perched path only, so `driven` — a
      // caller holding the wing — cannot get the dip without its wing beat.
      // Half a composed gesture is not the gesture.
      if (!driven) scheduleSettle();
    };

    // R-PW-3. Weight, as an anchored one-shot: the body drops onto its own
    // mass, the wings absorb it, and it comes back to exactly where it was.
    //
    // **The dip carries the breath down with it, and that is what makes the
    // gesture phase-independent.** The breath is stopped wherever it happens
    // to be, so a naive dip would start from anywhere in a 2.99pt band: at the
    // breath's peak it would read as a deep settle, at its trough as almost
    // nothing — the same sub-threshold failure §1 diagnoses. Ramping `rise`
    // back to 0 IN PARALLEL with the dip fixes both halves at once, because
    // `rise: 0` is the breath's own LOW point: both terms move DOWN together
    // (never against each other), the NADIR is a fixed absolute point (a floor
    // he settles onto, identical every time), and the dip's own contribution
    // is a fixed 3% whatever the phase. What varies is only how far he had
    // risen before he came down, which is the honest part of the variation.
    //
    // It also buys the band re-entry §4 asks for, free and by construction:
    // the gesture ends with `rise` at 0, which is exactly where the loop
    // starts. There is nothing to jump-cut back from.
    const scheduleSettle = () => {
      const wait =
        SETTLE_INTERVAL_MIN_MS + Math.random() * (SETTLE_INTERVAL_MAX_MS - SETTLE_INTERVAL_MIN_MS);
      timer = setTimeout(() => {
        if (cancelled) return;
        // §4's collision rule, the settle's half — and the second guard is not
        // redundant belt-and-braces: it FAILS CLOSED. If the wing channel is
        // not perched there is no beat to absorb the landing, and a dip with
        // no wing beat is a bob. Defer rather than perform half of it.
        if (gesture.busy || !gesture.absorb) {
          scheduleSettle();
          return;
        }
        gesture.busy = true;
        current?.stop();
        const rebound = SETTLE_RECOVER_MS * SETTLE_OVERSHOOT_SPLIT;
        // Down fast (ease-IN — dropping onto mass accelerates), up slow.
        current = Animated.parallel([
          Animated.timing(settle, {
            toValue: 1,
            duration: SETTLE_DIP_MS,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rise, {
            toValue: 0,
            duration: SETTLE_DIP_MS,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]);
        current.start(({ finished }) => {
          if (!finished || cancelled) {
            gesture.busy = false;
            return;
          }
          // The nadir. The wing beat and the recovery start on the same frame
          // — that is the whole of "they share the gesture's clock, nothing
          // else": one instant in common, two channels that never read each
          // other again.
          gesture.absorb();
          current = Animated.sequence([
            Animated.timing(settle, {
              toValue: -SETTLE_OVERSHOOT_FRACTION,
              duration: rebound,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(settle, {
              toValue: 0,
              duration: SETTLE_RECOVER_MS - rebound,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]);
          current.start(({ finished: recovered }) => {
            gesture.busy = false;
            if (recovered && !cancelled) breatheBody();
          });
        });
      }, wait);
    };

    breatheBody();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      current?.stop();
    };
  }, [breathing, driven, gesture, rise, settle]);

  const width = size * MASCOT_WIDTH_FRACTION;
  const height = width / MASCOT_ASPECT;

  // Hero LOD: a plain ternary, recomputed every render, never memoised — the
  // hinge-offset hazard two comments down applies here too, and `size` is
  // exactly the prop a memo would freeze. One dimension is enough because
  // `MASCOT_ASPECT` makes both cross their limits together (see
  // `MASCOT_BASE_PX`'s comment). Falls back to the base raster whenever the
  // hero pair hasn't landed yet, independent of size.
  const useHero = width * PixelRatio.get() > MASCOT_BASE_PX;
  const wingSource = useHero && HERO_WING ? HERO_WING : WING;
  const bodySource = useHero && HERO_BODY ? HERO_BODY : BODY;

  // The wing pivots at its root, which is at (0.427, 0.505) of the character
  // box and so *not* at the view's centre — RN rotates about the centre, so
  // the pivot is composed by hand. R81's transform-order fact decides the
  // order: RN folds the array left to right onto a row vector, so the last
  // entry is applied first. Reading right to left this is
  // `translate(−offset) → rotate → translate(+offset)`, i.e. rotation about
  // the root. `transformOrigin` would express the same thing in one line;
  // this way carries no assumption about how it is plumbed on either platform.
  const offsetX = (HINGE.x - 0.5) * width;
  const offsetY = (HINGE.y - 0.5) * height;
  // §28.13 correction 1: the four offsets below are plain numbers sharing a
  // natively driven transform array, which is the frozen-at-first-commit shape.
  // They are live only because the `rotate` entry builds a NEW interpolation on
  // every render: a new node identity changes the memo hook's composite key, so
  // the props node is rebuilt and the offsets are re-read. **Hoisting that
  // interpolate into a `useMemo` — the R89 pattern — silently freezes the wing
  // hinge at whatever `size` was on first commit.** If it ever needs
  // memoising, the offsets have to become nodes in the same change.
  //
  // **The sweep used to be read here too, and its note said that was what
  // rebuilt the interpolation. That was never the mechanism.** The `rotate`
  // entry is CONSTRUCTED in this render body, so it is a new node on every
  // render whatever its output range is made of; a mode-dependent term in the
  // range was riding along, not doing the work. Now that the range is the
  // constant 18-degree beat (see the header), nothing about this paragraph
  // changes — which is the check that the paragraph was about the right thing.
  const beatStyle = animated || driven
    ? {
        transform: [
          { translateX: offsetX },
          { translateY: offsetY },
          {
            rotate: beat.interpolate({
              inputRange: [0, 1],
              outputRange: [`-${WING_BEAT_DEG / 2}deg`, `${WING_BEAT_DEG / 2}deg`],
            }),
          },
          { translateX: -offsetX },
          { translateY: -offsetY },
        ],
      }
    : null;

  // The rise, symmetric about the perch point: the character sits at the
  // anchor's own y at the midpoint of every cycle and its MEAN position is
  // that point exactly. That is the amended State 2 invariant — zero NET
  // translation — and it is what separates a breath from the hover the
  // doctrine retires, in the mechanism rather than in the amplitude.
  //
  // The settle rides the SAME array as a second `translateY`. Two translations
  // in one transform array compose additively (the trail pool's own note,
  // §28.13), so this is one body channel carrying two terms — not a second
  // mechanism for one gesture, which is what R83 and R46 forbid. Both entries
  // are `Animated` nodes, so §28.13's frozen-static hazard does not arise.
  //
  // Zero net translation is STRUCTURAL here rather than argued: `settle` opens
  // at 0 and every gesture ends at 0, so the settle's mean contribution over
  // any cycle is exactly zero and the perch point cannot drift. The overshoot
  // is declared as an explicit third stop rather than left to interpolation's
  // `extend` default — a range that states its own reachable domain is a range
  // that cannot be extrapolated somewhere nobody measured.
  const bodyStyle = breathing
    ? {
        transform: [
          {
            translateY: rise.interpolate({
              inputRange: [0, 1],
              outputRange: [(BREATH_RISE_FRACTION * height) / 2, (-BREATH_RISE_FRACTION * height) / 2],
            }),
          },
          {
            translateY: settle.interpolate({
              inputRange: [-SETTLE_OVERSHOOT_FRACTION, 0, 1],
              outputRange: [
                -SETTLE_OVERSHOOT_FRACTION * SETTLE_DIP_FRACTION * height,
                0,
                SETTLE_DIP_FRACTION * height,
              ],
            }),
          },
        ],
      }
    : null;

  return (
    <Animated.View
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, bodyStyle]}
    >
      <Animated.View style={{ width, height }}>
        {/* Wings first: they are behind the body in the render, and that is
            the whole reason the split is lossless. */}
        <Animated.View style={[StyleSheet.absoluteFill, beatStyle, wingStyle]}>
          <Image source={wingSource} style={{ width, height }} resizeMode="contain" />
        </Animated.View>
        <Image source={bodySource} style={{ width, height }} resizeMode="contain" />
      </Animated.View>
    </Animated.View>
  );
};
