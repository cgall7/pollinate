import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { NECTAR, NECTAR_EASING } from '../constants/motion';
import { buildDropFlight, dropRadiusForAmount } from './nectarFlight';

// R-N3 — the send, as a state machine the screen commands and this hook
// performs. POLLINATE_NECTAR_LIVING_EXCHANGE §3 (Lumen, 2026-08-29).
//
// > Gather · 0-180ms ... Depart · 180-520ms ... Settle · 520-760ms
//
// THE BEAT IS OPTIMISTIC: the drop goes before the network answers, and the
// haptic fires on ABSORPTION rather than on the promise resolving, because
// "the network's timing is not the gesture's timing." So the RPC runs
// alongside the choreography and its result is JOINED at the end rather than
// awaited at the start — which is the whole reason this is a machine and not
// an `await` followed by an animation.
//
// PHASES, and why the screen needs them: the panel has to empty out during
// Gather and stand back up if the gift comes home, and the overlay has to
// keep swallowing taps for the whole flight (R-N3.3). Both are the screen's
// render, not this hook's, so the phase is published rather than hidden.
export const GIFT_IDLE = 'idle';
export const GIFT_GATHER = 'gather';
export const GIFT_TRAVEL = 'travel';
export const GIFT_SETTLE = 'settle';
export const GIFT_RETURN = 'return';

// The beat's own boundaries, composed from `NECTAR` rather than re-typed, so
// a retune there cannot leave a start time here stranded (motion.js's own
// note on why those constants are durations).
//
// ONE DEVIATION FROM THE SPEC'S LABELS, named rather than absorbed: R-N3
// heads the third beat "Settle · 520-760ms" and then gives the count 400ms,
// which ends at 920. 400 is the load-bearing number — it is `NECTAR.settle`,
// already shared with `HoneyFill` so the meniscus and the numeral cannot
// drift into two clocks — so the DURATION is kept and the label's end is
// what moves. Flagged to Lumen; no pixel depends on which way it is read.
export const GIFT_CONTACT_MS = NECTAR.gather + NECTAR.travel;
export const GIFT_REST_MS = GIFT_CONTACT_MS + NECTAR.settle;

/**
 * The gift in flight.
 *
 * `balanceDrops` is the AUTHORITATIVE balance (the last value read from the
 * server, `null` when unknown). What the panel renders is `displayDrops`,
 * which this hook animates.
 *
 * THE NUMERAL IS ANIMATED TO AN ABSOLUTE TARGET AND NEVER BY A DELTA. That
 * is §6 acceptance row 5 satisfied by construction rather than by care: "the
 * numeral returns to its prior value exactly — no drift from the
 * count-down/count-up pair" is only checkable if the two are not a pair at
 * all. Down is a tween to `balance - amount`; up is a tween to `balance`.
 * Interrupt either one at any frame and the other still lands on the number
 * the server holds.
 */
export const useNectarGift = ({ reduced, balanceDrops }) => {
  const [gift, setGift] = useState(null);
  const [phase, setPhase] = useState(GIFT_IDLE);

  // The travel driver. ONE value, 0->1, consumed as an arc fraction — the
  // path is arc-uniform (`buildDropFlight`), so `Easing.out(cubic)` on this
  // driver decelerates in DISTANCE, which is R-N3's "decelerating into the
  // paper". See nectarFlight.js's header for why sampling by anything else
  // would make the same easing decelerate in parameter and speed the drop up
  // through its own turn.
  const travel = useRef(new Animated.Value(0)).current;
  // Lift-off and collapse. The drop grows out of its chip and its area
  // collapses into the paper; both are scale on the same value.
  const dropScale = useRef(new Animated.Value(0)).current;
  const dropOpacity = useRef(new Animated.Value(0)).current;
  // The stain. Rise and fall are asymmetric BY RULING (240 / 520) so it
  // reads as spreading rather than as a flash.
  const bloom = useRef(new Animated.Value(0)).current;
  // R-N3.3 — the scrim's OPACITY falls to zero across Gather while the
  // overlay itself stays mounted. The drop flies over the entry it is for,
  // not over a dimmed copy of it.
  const scrim = useRef(new Animated.Value(1)).current;
  // The panel's controls. Not the balance line — see `useNectarGift`'s
  // consumer and the deviation noted there.
  const controls = useRef(new Animated.Value(1)).current;

  const count = useRef(new Animated.Value(0)).current;
  const [displayDrops, setDisplayDrops] = useState(null);
  const settled = useRef(balanceDrops);
  // A GIFT OWNS THE NUMERAL FOR ITS WHOLE LENGTH. Without this the beat has
  // a race it loses on every successful send: `commit` re-reads the balance,
  // the authoritative value lands, and the effect below snaps the count to
  // it — cancelling the 400ms tween that IS the Settle beat. The optimistic
  // target and the server's answer are the same number, so the snap was
  // invisible in the value and visible only in the missing animation, which
  // is the worst shape a defect can have.
  const inFlight = useRef(false);

  useEffect(() => {
    const sub = count.addListener(({ value }) => setDisplayDrops(Math.round(value)));
    return () => count.removeListener(sub);
  }, [count]);

  // The authoritative balance moving OUTSIDE a gift (mount, re-read) is not a
  // beat — it is the number arriving. Snap, don't count: a count from `null`
  // to 500 on first paint would animate a fact rather than an event.
  useEffect(() => {
    if (balanceDrops === null || balanceDrops === undefined) {
      settled.current = balanceDrops;
      if (!inFlight.current) setDisplayDrops(null);
      return;
    }
    settled.current = balanceDrops;
    if (inFlight.current) return;
    count.setValue(balanceDrops);
    setDisplayDrops(balanceDrops);
    // Only when the SERVER's number moves. A re-render during a gift must not
    // reset the count mid-tween.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balanceDrops]);

  const countTo = useCallback(
    (target) => {
      if (target === null || target === undefined) return null;
      // §5: "The balance numeral still counts. A NUMBER CHANGING IS CONTENT,
      // NOT MOTION — §12.5 Rule 4 is about movement, and suppressing the
      // count would suppress the information rather than the animation." So
      // this branch is deliberately NOT gated on `reduced`.
      const a = Animated.timing(count, {
        toValue: target,
        duration: NECTAR.settle,
        easing: NECTAR_EASING.settle,
        useNativeDriver: false,
      });
      a.start();
      return a;
    },
    [count],
  );

  const reset = useCallback(() => {
    travel.setValue(0);
    dropScale.setValue(0);
    dropOpacity.setValue(0);
    bloom.setValue(0);
    scrim.setValue(1);
    controls.setValue(1);
    setGift(null);
    setPhase(GIFT_IDLE);
  }, [travel, dropScale, dropOpacity, bloom, scrim, controls]);

  /**
   * Fly one gift.
   *
   * `origin` and `destination` are window rects (`measureInWindow`'s four
   * numbers). They are MEASURED AT SEND TIME by the screen and handed in —
   * never stored, never a table. Both are the live positions of real views,
   * which is the only thing that survives a rotation, a font scale, or a
   * scrolled entry card.
   *
   * `commit` is the RPC, run alongside. Resolves -> the gift stays gone;
   * rejects -> it comes home.
   */
  const send = useCallback(
    ({ origin, destination, amount, commit }) => {
      const radius = dropRadiusForAmount(amount);
      const from = { x: origin.x + origin.width / 2, y: origin.y + origin.height / 2 };
      const to = { x: destination.x + destination.width / 2, y: destination.y + destination.height / 2 };
      const plan = buildDropFlight({ from, to, radiusPx: radius });
      const base = settled.current;
      const optimistic = base === null || base === undefined ? null : base - amount;

      setGift({ plan, radius, amount, from, to });
      inFlight.current = true;

      // OPTIMISTIC MEANS THE REQUEST IS ALREADY IN THE AIR. R-N3: "the drop
      // leaves before the network answers." So `commit` is invoked HERE, on
      // the same frame the drop lifts off, and its promise is joined at the
      // end of the beat — never started after the travel, which would make
      // the choreography a loading state wearing a gesture's name.
      //
      // The rejection is parked on a resolved wrapper immediately, because a
      // promise that rejects before anything is attached to it is an
      // unhandled rejection, and this one can reject during a 520ms window
      // where nothing is listening yet.
      const settledCommit = commit().then(
        () => ({ ok: true }),
        (err) => ({ ok: false, err }),
      );

      // §5 — under Reduce Motion "no drop travels" and "the bee does not
      // cross; the balance is simply right". The gift still ARRIVES: the
      // haptic still fires, the numeral still counts, and the surface
      // population is byte-identical (the drop layer renders, at zero
      // opacity, for zero frames of travel) — acceptance row 6.
      if (reduced) {
        setPhase(GIFT_SETTLE);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        countTo(optimistic);
        return settledCommit
          .then((res) => {
            if (!res.ok) countTo(base);
            return res;
          })
          .finally(() => {
            inFlight.current = false;
            setGift(null);
            setPhase(GIFT_IDLE);
          });
      }

      setPhase(GIFT_GATHER);
      const outbound = Animated.sequence([
        // Gather. The controls fall away and the scrim goes with them while
        // the drop lifts off its chip.
        Animated.parallel([
          Animated.timing(controls, {
            toValue: 0,
            duration: NECTAR.gather,
            easing: NECTAR_EASING.absorbRise,
            useNativeDriver: true,
          }),
          Animated.timing(scrim, {
            toValue: 0,
            duration: NECTAR.gather,
            easing: NECTAR_EASING.absorbRise,
            useNativeDriver: true,
          }),
          Animated.timing(dropOpacity, {
            toValue: 1,
            duration: NECTAR.gather,
            easing: NECTAR_EASING.absorbRise,
            useNativeDriver: true,
          }),
          Animated.timing(dropScale, {
            toValue: 1,
            duration: NECTAR.gather,
            easing: NECTAR_EASING.absorbRise,
            useNativeDriver: true,
          }),
        ]),
        // Depart. `out(cubic)` on an arc-uniform path, and NO SPRING: "it
        // does not bounce" rules out every spring in motion.js for this leg.
        Animated.timing(travel, {
          toValue: 1,
          duration: NECTAR.travel,
          easing: NECTAR_EASING.travel,
          useNativeDriver: true,
        }),
      ]);

      let contacted = false;
      return new Promise((resolve) => {
        const settle = () => {
          if (contacted) return;
          contacted = true;
          // THE HAPTIC IS HERE, and this call site IS acceptance row 4: it
          // is inside the animation's completion, not inside the promise's.
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setPhase(GIFT_SETTLE);
          // The drop's area collapses into the paper and the paper takes the
          // stain. Absorption and the count start on the same frame — the
          // contact IS the moment the balance changes.
          Animated.parallel([
            Animated.timing(dropScale, {
              toValue: 0,
              duration: NECTAR.absorbRise,
              easing: NECTAR_EASING.absorbRise,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(bloom, {
                toValue: 1,
                duration: NECTAR.absorbRise,
                easing: NECTAR_EASING.absorbRise,
                useNativeDriver: true,
              }),
              Animated.timing(bloom, {
                toValue: 0,
                duration: NECTAR.absorbFall,
                easing: NECTAR_EASING.absorbFall,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
          countTo(optimistic);
          resolve();
        };
        setPhase(GIFT_TRAVEL);
        outbound.start(({ finished }) => {
          if (finished) settle();
        });
      })
        .then(() => settledCommit)
        .then((res) => {
          if (!res.ok) return Promise.reject(res.err);
          // Gone. The panel stands down after the count; the bloom's fall
          // outlives it and is on a layer that takes no touches.
          return new Promise((resolve) => {
            setTimeout(() => {
              inFlight.current = false;
              reset();
              resolve({ ok: true });
            }, NECTAR.settle);
          });
        })
        .catch((err) => {
          // R-N3's failure state, and it needs no sentence: "the drop comes
          // back — it returns along its own path, is re-absorbed into the
          // balance, and the numeral counts back up." Along its OWN path, so
          // the same plan is flown with the driver run backwards; nothing is
          // re-derived and the two directions cannot disagree.
          setPhase(GIFT_RETURN);
          bloom.stopAnimation();
          Animated.parallel([
            Animated.timing(bloom, {
              toValue: 0,
              duration: NECTAR.gather,
              easing: NECTAR_EASING.absorbFall,
              useNativeDriver: true,
            }),
            Animated.timing(dropScale, {
              toValue: 1,
              duration: NECTAR.gather,
              easing: NECTAR_EASING.absorbRise,
              useNativeDriver: true,
            }),
          ]).start(() => {
            Animated.timing(travel, {
              toValue: 0,
              duration: NECTAR.travel,
              easing: NECTAR_EASING.travel,
              useNativeDriver: true,
            }).start(() => {
              Animated.parallel([
                Animated.timing(dropScale, { toValue: 0, duration: NECTAR.gather, easing: NECTAR_EASING.absorbFall, useNativeDriver: true }),
                Animated.timing(dropOpacity, { toValue: 0, duration: NECTAR.gather, easing: NECTAR_EASING.absorbFall, useNativeDriver: true }),
                Animated.timing(controls, { toValue: 1, duration: NECTAR.gather, easing: NECTAR_EASING.absorbRise, useNativeDriver: true }),
                Animated.timing(scrim, { toValue: 1, duration: NECTAR.gather, easing: NECTAR_EASING.absorbRise, useNativeDriver: true }),
              ]).start(() => {
                inFlight.current = false;
                setGift(null);
                setPhase(GIFT_IDLE);
              });
            });
          });
          // Back to the number the server actually holds — an absolute
          // target, so this lands exactly whatever the down-count did.
          countTo(settled.current);
          return { ok: false, err };
        });
    },
    [reduced, travel, dropScale, dropOpacity, bloom, scrim, controls, countTo, reset],
  );

  // Built here rather than at the two call sites: the overlay panel and the
  // inline panel must fall away identically, and a style spelled twice is a
  // second copy of a derivation. The 4pt is R-N3's own ("fade + 4pt
  // settle") — the controls sink as they go, so the card empties downward
  // and the drop leaves upward.
  const controlsStyle = {
    opacity: controls,
    transform: [{ translateY: controls.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }],
  };

  return { gift, phase, send, travel, dropScale, dropOpacity, bloom, scrim, controls, controlsStyle, displayDrops };
};
