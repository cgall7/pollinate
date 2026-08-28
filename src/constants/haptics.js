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
export const hexTap = {
  // Light -> Light -> Medium over ~180ms. It rises, and it lands on the
  // frame the contact beat ends — `CONTACT_MS` is 180 in `HoneycombGrid`,
  // which is why this is 180 and not a feel. Fires at t=0, ahead of any
  // visual; the finger is answered before the light is.
  contact: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}), 90);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}), 180);
  },
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
