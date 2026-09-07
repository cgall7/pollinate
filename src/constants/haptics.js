import * as Haptics from 'expo-haptics';

// Haptic *sequences*, not another single impact (Lumen, luxury pass
// 2026-08-20). Five one-off `Haptics.impactAsync(...)` call shapes already
// exist across the app and none of them are a pattern — Colin's word was
// "vibrates," and a lone Medium impact is a click. A sequence must mirror
// the visual it rides with or it reads as a separate event bolted on, so
// each pattern here is named for the beat it accompanies.
//
// Renamed from `drip` by LP-R21: nothing drips any more. A module named for
// a retired treatment is how that treatment finds its way back (guardrail
// 3's R50 argument) — and `drip.swell` in particular named a beat that no
// longer exists while doing a job that still does.
//
// `.catch(() => {})` on every call: a missing haptic is silent, a thrown
// promise rejection crashing an animation sequence is not.
//
// SCOPE NOTE, so "no call-site one-offs" has a population it can actually
// govern (Pixel, DES-40 ground, event `9d1cfb34`). The count above is of
// LITERAL calls. The channel that matters is the DEFAULT one: at 6a93cab,
// 75 `<PressableScale` and 26 `<PrimaryButton` mounts all sit on a Light-by-
// default press haptic (`PressableScale.js:22`), 18 opt out with
// `haptic={null}`, and at DES-40's ground this module had exactly ONE
// production consumer (`HoneycombGrid`; the other importer was the dev
// harness). A component default is a call site with no text, so the rule
// cannot be enforced by reading call sites — it is enforced by a sequence
// REPLACING the default at the mount that takes it, never stacking on top of
// it. `Compose` is the second production consumer and it is the worked
// example: its `PrimaryButton` passes `haptic={null}` in the same diff as the
// mount, indivisibly, because the two halves of one rule cannot land apart.

// THE INTERFACE (Lumen, IA spec §10; ruled `6dcfd673` off Pixel's `6f0010fc`,
// clause `da767b3b`, referent `f0eb8e28`).
//
// A sequence is FRACTIONS PLUS STYLES, AND THE SPAN IS AN ARGUMENT. It is
// written that way because of what `CONTACT_MS`'s own comment in
// `HoneycombGrid` already claims: the last beat of the contact sequence and
// the contact beat of the picture are one number wearing two hats, and moving
// either without the other desynchronises the touch from the picture. Under
// hardcoded milliseconds that invariant is prose, held by hand, and it was
// already false in one branch. Under a span argument it is the call site, so
// moving the constant moves both hats mechanically.
//
// THE DERIVATION RULE: a sequence's intervals derive from the duration of the
// VISUAL THAT ACTUALLY PLAYS. Under Reduce Motion the visual that actually
// plays is the SUBSTITUTE — one picture standing in for the whole beat group
// — so the span is the substitute's duration and the sequence rebinds to it.
// That is not a carve-out from the mirror doctrine: the doctrine mirrors the
// picture the user is shown, and under RM the substitute IS that picture.
// There is therefore no `contactFull`/`contactReduced` fork anywhere in this
// module, in either direction, and adding one is the drift this shape exists
// to prevent.
//
// RM DOES NOT COLLAPSE A SEQUENCE. Reduce Motion damps the VISUAL channel, so
// the haptic is carrying more of the message, not less; the haptic opt-out is
// System Haptics, which we never see and which silences everything correctly.
// The old `HoneycombGrid.js` RM branch fired a lone Medium and was cited once
// as precedent for collapsing — it was a line nobody had ever authored across
// two module generations and one rename, and it is now this module's derived
// `contact(DURATIONS.reducedMotionFade)`. Recorded here because a struck rule
// with no record of its striking comes back.
//
// REJECTED, so neither is re-derived from first principles: (a) the strict
// span-zero reading, in which a sequence whose mirrored element is absent
// under RM gets span 0 — it makes `MIN_FELT_GAP_MS` the sole author of 100%
// of the RM rhythm, which is a chosen feel wearing a legibility constant's
// name; (b) a still-one-gesture CEILING symmetric to the floor below — it
// would pull the last beat in ahead of the picture's end, and the closing
// beat's whole meaning is that the acknowledgement completes with the
// picture. A floor extends past the picture and a tail is legal; a ceiling
// cuts a sequence short of its own referent.
export const MIN_FELT_GAP_MS = 0;
// The legibility floor: below some interval two impacts stop being felt as
// two and become one. Applied to inter-beat gaps AFTER the span multiplies
// through, and it CLAMPS, NEVER DROPS — dropping a beat under compression is
// the collapse rule sneaking back in through arithmetic.
//
// It ships at 0, which is VACUOUS BY CONSTRUCTION, and that is deliberate
// rather than an oversight: the mechanism ships authored while the value
// ships measured, so nobody discovers later that the clamp was doing nothing.
// Author of the number: Pixel's device day. Nothing in the tree needs it yet
// — under the derivation rule the tightest gap any shipping sequence produces
// is 100ms (`contact` at span `DURATIONS.reducedMotionFade`).

const impact = (style) => {
  Haptics.impactAsync(style).catch(() => {});
};

// `beats` is an ascending list of `[fraction, style]`. The returned function
// takes the span of the element it mirrors.
//
// A span that is not a finite, non-negative number fires NOTHING. That is a
// programming error rather than a device failure, and the two failures want
// opposite handling: a native call that rejects is swallowed (above), but a
// sequence with no span has no rhythm, and firing its beats stacked at t=0
// would manufacture exactly the lone click this module exists to prevent.
// Silence is the safe failure here and the warning is where it is loud.
const sequence = (beats) => (span) => {
  if (!Number.isFinite(span) || span < 0) {
    console.warn('haptics: sequence called without a span; firing nothing', span);
    return;
  }
  let previous = null;
  beats.forEach(([fraction, style]) => {
    let at = fraction * span;
    if (previous !== null && at - previous < MIN_FELT_GAP_MS) at = previous + MIN_FELT_GAP_MS;
    previous = at;
    if (at <= 0) impact(style);
    else setTimeout(() => impact(style), at);
  });
};

export const hexTap = {
  // Light -> Light -> Medium. It rises, and it lands on the frame its picture
  // completes. Fires at t=0, ahead of any visual; the finger is answered
  // before the light is.
  //
  // REFERENT (IA spec §10's referent table, row 1). Full motion: `CONTACT_MS`,
  // the press depression, two timings of `CONTACT_MS / 2` on `pressDepth`.
  // Reduce Motion: `DURATIONS.reducedMotionFade`, because under RM the press
  // is not shortened, it is ABSENT — `pressDepth` is animated only inside
  // `startHexTap` and `HexCell` gates it on `selected && !reduced` — and the
  // 200ms fade is the one picture standing in for press, ignition and reveal
  // together.
  //
  // (0, 0.5, 1.0) is the shipped rhythm exactly: 0/90/180 at span 180, no
  // rounding, which is why converting this sequence to the interface was not
  // a re-tune of anything.
  contact: sequence([
    [0, Haptics.ImpactFeedbackStyle.Light],
    [0.5, Haptics.ImpactFeedbackStyle.Light],
    [1, Haptics.ImpactFeedbackStyle.Medium],
  ]),
  // No `pinch()`. It was one sharp Heavy on the neck's separation frame —
  // THE signature haptic of a beat LP-R21 retired. It is not re-pointed at
  // the fill's arrival: the contact sequence above already ends on a Medium
  // 80ms before the fill even starts, and a second impact 250ms later
  // reports an event the finger did not cause.
  //
  // No `fall()` either, and that one was always deliberate: the drop was
  // visual only. Resisting the urge to buzz through a beat is what keeps
  // this a material instead of a game. Don't add one to the fill.
};

// THE SEND — DES-40's two endings, and two of the app's four in-hand
// signatures (IA spec §10's referent table, rows 2 and 4). They are exact
// inverses of each other because the acts are: a departure decays, a stowage
// arrives.
//
// Two beats each, and AT TWO BEATS THE GAP IS THE SPAN — there is no interior
// beat to carry rhythm, so the choice of referent is the choice of the whole
// feel. Both bind to their own element's constant in `motion.js` and neither
// may read `NECTAR.gather`; `SEND`'s own header carries why that rule exists
// rather than restating what it says.
export const send = {
  // Medium -> Light. It falls. The note is heaviest in the hand at the instant
  // it leaves and is already gone by the time the second beat lands, so the
  // closing Light is the last of it rather than a confirmation of anything.
  //
  // REFERENT. Full motion: `SEND.liftOff`, the detach — NOT the whole
  // departure. The travel that follows is un-mirrored, so the sequence
  // completes while the note is still on screen, which is right: the finger
  // caused the lift, not the flight. Reduce Motion:
  // `DURATIONS.reducedMotionFade`, the flat fade that is the whole picture
  // there.
  take: sequence([
    [0, Haptics.ImpactFeedbackStyle.Medium],
    [1, Haptics.ImpactFeedbackStyle.Light],
  ]),
  // Light -> Medium. It rises, and it is the exact inverse of `take` above.
  // The Light is the placement tick, the note touching down; the Medium is the
  // seal completing, and it lands on the frame the picture settles.
  //
  // NOT a lone Medium, which was rejected twice over: it is the click the send
  // is the last place in the app to ship, and it would wear `SealCrack`'s mark
  // — the app's only OPENING-in-hand signature — on a closing.
  //
  // REFERENT. Full motion: `SEND.sealSettle`. Reduce Motion:
  // `DURATIONS.reducedMotionFade`.
  seedSeal: sequence([
    [0, Haptics.ImpactFeedbackStyle.Light],
    [1, Haptics.ImpactFeedbackStyle.Medium],
  ]),
};
