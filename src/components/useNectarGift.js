import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DURATIONS, NECTAR, NECTAR_EASING } from '../constants/motion';
import { buildDropFlight, dropRadiusForAmount } from './nectarFlight';
import { nectarFailureReturnPlan } from './nectarGiftLifecycle';

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
export const GIFT_STAIN_MS = NECTAR.absorbRise + NECTAR.absorbFall;

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
  //
  // R-N3.4 — ONE VALUE DRIVES BOTH THE CONTROLS AND THE CARD'S GROUND. The
  // ruling puts the card body on the Gather clock the controls already ride,
  // and a second value set to the same duration would be a second copy of
  // one derivation — the exact shape R-N3.2 closed for the drop's backing.
  // The two published styles differ only in what they carry: the controls
  // also sink 4pt, the ground does not move. They cannot drift because there
  // is nothing to drift from.
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
      if (target === null || target === undefined) return Promise.resolve();
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
      return new Promise((resolve) => {
        a.start(resolve);
      });
    },
    [count],
  );

  // THE SEND SURFACE STANDS UP AGAIN, AND THIS IS THE ONLY PLACE IT DOES.
  //
  // R-N3.4: "the resting state after a completed send is the panel standing
  // down … it never returns re-armed." Restoring the surface is therefore
  // not part of finishing a gift — it is part of BEGINNING A COMPOSITION,
  // which is a different event with a different owner. The caller says when
  // that happens; the beat never says it on the caller's behalf.
  //
  // Idempotent by construction (`setValue` to the value it already holds),
  // so a caller may arm on every keystroke or once on open.
  const arm = useCallback(() => {
    scrim.setValue(1);
    controls.setValue(1);
  }, [scrim, controls]);

  // The FLIGHT's own state, and nothing about the surface. Split out of what
  // used to be one `reset()` that also put `controls` and `scrim` back to 1
  // on the success path — which is the mechanism behind the re-armed compose
  // Lumen captured (batch C, right panel): the snap ran inside the promise
  // chain, one whole tick before the caller could unmount or navigate, so a
  // fully repainted panel with the previous words still in it was on screen
  // for at least a frame and for the entire dismissal transition on the comb
  // mount. The failure path never called this — it animates the surface back
  // up over `NECTAR.gather`, because a gift that came home must be sendable
  // again. One function was serving two opposite endings.
  const resetFlight = useCallback(() => {
    travel.setValue(0);
    dropScale.setValue(0);
    dropOpacity.setValue(0);
    bloom.setValue(0);
    setGift(null);
    setPhase(GIFT_IDLE);
  }, [travel, dropScale, dropOpacity, bloom]);

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
      let commitResult = null;
      const settledCommit = commit().then(
        () => {
          commitResult = { ok: true };
          return commitResult;
        },
        (err) => {
          commitResult = { ok: false, err };
          return commitResult;
        },
      );

      // §5 — under Reduce Motion "no drop travels" and "the bee does not
      // cross; the balance is simply right". The gift still ARRIVES: the
      // haptic still fires, the numeral still counts, and the surface
      // population is byte-identical (the drop layer renders, at zero
      // opacity, for zero frames of travel) — acceptance row 6.
      if (reduced) {
        setPhase(GIFT_SETTLE);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // R-N3.4's Reduced Motion clause: the send surface still yields, as
        // the ruled interaction-feedback substitute — a flat fade at
        // `DURATIONS.reducedMotionFade`, §14.1's one number for this. It is
        // NOT a new surface (R-N3.0 forbids that) and it is not the Gather
        // clock either: there is no travel to keep out of the way of here,
        // so the yield is paced by the mandate rather than by a beat that
        // does not run. The balance line is outside this fade at both mounts
        // and the count is deliberately not gated on `reduced` (§5), so the
        // one thing left to watch is the one thing RM must not remove.
        Animated.parallel([
          Animated.timing(controls, {
            toValue: 0,
            duration: DURATIONS.reducedMotionFade,
            easing: NECTAR_EASING.absorbRise,
            useNativeDriver: true,
          }),
          Animated.timing(scrim, {
            toValue: 0,
            duration: DURATIONS.reducedMotionFade,
            easing: NECTAR_EASING.absorbRise,
            useNativeDriver: true,
          }),
        ]).start();
        const optimisticCountDone = countTo(optimistic);
        return settledCommit
          .then(async (res) => {
            if (res.ok) {
              await optimisticCountDone;
            } else {
              // The gift came home, so the surface must be sendable again —
              // the same obligation the full-motion failure path discharges
              // over `NECTAR.gather`, on this path's own clock. A snap would
              // be a transition, which is exactly what RM removes.
              Animated.parallel([
                Animated.timing(controls, {
                  toValue: 1,
                  duration: DURATIONS.reducedMotionFade,
                  easing: NECTAR_EASING.absorbRise,
                  useNativeDriver: true,
                }),
                Animated.timing(scrim, {
                  toValue: 1,
                  duration: DURATIONS.reducedMotionFade,
                  easing: NECTAR_EASING.absorbRise,
                  useNativeDriver: true,
                }),
              ]).start();
              await countTo(base);
            }
            return res;
          })
          .then((res) => new Promise((resolve) => {
            setTimeout(() => resolve(res), NECTAR.settle);
          }))
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
        // Depart. Endpoint-safe easing on an arc-uniform path, and NO
        // SPRING: "it does not bounce" rules out every spring in motion.js
        // for this leg.
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
          const countDone = countTo(optimistic);
          if (commitResult && !commitResult.ok) {
            resolve(Promise.reject({ err: commitResult.err, collapsed: false, countDone }));
            return;
          }
          let stainAnimation = null;
          const stainDone = new Promise((resolveStain) => {
            stainAnimation = Animated.parallel([
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
            ]);
            stainAnimation.start(resolveStain);
          });
          const failure = settledCommit.then((res) => (res.ok ? null : res));
          resolve(
            Promise.race([stainDone.then(() => null), failure])
              .then((earlyFailure) => {
                if (earlyFailure) {
                  stainAnimation?.stop();
                  return Promise.reject({ err: earlyFailure.err, collapsed: true, countDone });
                }
                return settledCommit.then((res) => {
                  if (!res.ok) return Promise.reject({ err: res.err, collapsed: true, countDone });
                  return Promise.all([stainDone, countDone]);
                });
              }),
          );
        };
        setPhase(GIFT_TRAVEL);
        outbound.start(({ finished }) => {
          if (finished) settle();
        });
      })
        .then(() => {
          inFlight.current = false;
          resetFlight();
          return { ok: true };
        })
        .catch((failurePayload) => {
          const err = failurePayload?.err ?? failurePayload;
          const collapsed = !!failurePayload?.collapsed;
          // R-N3's failure state, and it needs no sentence: "the drop comes
          // back — it returns along its own path, is re-absorbed into the
          // balance, and the numeral counts back up." Along its OWN path, so
          // the same plan is flown with the driver run backwards; nothing is
          // re-derived and the two directions cannot disagree.
          setPhase(GIFT_RETURN);
          bloom.stopAnimation();
          // Back to the number the server actually holds — an absolute
          // target, so this lands exactly whatever the down-count did.
          const returnHomeDone = new Promise((resolveReturnHome) => {
            const reverseTravel = () => {
              Animated.timing(travel, {
                toValue: 0,
                duration: NECTAR.travel,
                easing: NECTAR_EASING.travel,
                useNativeDriver: true,
              }).start(() => {
                if (returnPlan.authoritativeCountAt !== 'origin') return;
                const countHomeDone = countTo(settled.current);
                const reabsorbDone = new Promise((resolveReabsorb) => Animated.parallel([
                  Animated.timing(dropScale, { toValue: 0, duration: NECTAR.gather, easing: NECTAR_EASING.absorbFall, useNativeDriver: true }),
                  Animated.timing(dropOpacity, { toValue: 0, duration: NECTAR.gather, easing: NECTAR_EASING.absorbFall, useNativeDriver: true }),
                  Animated.timing(controls, { toValue: 1, duration: NECTAR.gather, easing: NECTAR_EASING.absorbRise, useNativeDriver: true }),
                  Animated.timing(scrim, { toValue: 1, duration: NECTAR.gather, easing: NECTAR_EASING.absorbRise, useNativeDriver: true }),
                ]).start(resolveReabsorb));
                Promise.all([reabsorbDone, countHomeDone]).then(() => {
                  inFlight.current = false;
                  setGift(null);
                  setPhase(GIFT_IDLE);
                  resolveReturnHome();
                });
              });
            };
            const returnPlan = nectarFailureReturnPlan({ collapsed, nectar: NECTAR });
            const formationMs = returnPlan.formationMs;
            if (formationMs === 0) {
              reverseTravel();
              return;
            }
            Animated.parallel([
              Animated.timing(bloom, {
                toValue: 0,
                duration: formationMs,
                easing: NECTAR_EASING.absorbFall,
                useNativeDriver: true,
              }),
              Animated.timing(dropScale, {
                toValue: 1,
                duration: formationMs,
                easing: NECTAR_EASING.absorbRise,
                useNativeDriver: true,
              }),
            ]).start(reverseTravel);
          });
          return returnHomeDone.then(() => ({ ok: false, err }));
        });
    },
    [reduced, travel, dropScale, dropOpacity, bloom, scrim, controls, countTo, resetFlight],
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

  // R-N3.4 — the card's ground, on the same driver and with no transform.
  // OPACITY ONLY IS THE POINT: the controls sink 4pt as they go because R-N3
  // says the panel empties downward, but a ground that also moved would
  // shear away from the content it is behind and read as two cards. The card
  // does not leave; it stops being painted.
  const surfaceStyle = { opacity: controls };

  return { gift, phase, send, arm, travel, dropScale, dropOpacity, bloom, scrim, controls, controlsStyle, surfaceStyle, displayDrops };
};
