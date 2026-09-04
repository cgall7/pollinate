import { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing } from 'react-native';

// Sunbeam §12.5 Motion QA Standard — single source of truth for every
// spring/timing curve in the app. Screens/components consume these
// constants instead of inlining friction/tension/duration literals, so
// "lots of motion" (§14.1 R9) reads as premium/cohesive rather than
// chaotic. Rule (Sage, §12.5 Section 1): "if a new animation can't be
// expressed via the shared module, that's a module problem, not a reason
// for a one-off." Extend here, not on the call site.
//
// Luxury pass (Lumen, 2026-08-20): this module's own docstring used to
// claim it had already collected BeeTransition, CelebrationRays,
// AnimatedStat, CelebrationBadge and PressableScale onto SPRINGS/DURATIONS
// — it hadn't; all five still ran inline literals byte-identical to the
// values declared here. That was a spec defect, not drift. Every call site
// named above (plus MainTabs' TabIcon landing spring and HoneycombGrid's
// reveal-card duration) now actually imports and uses these constants.
// Remaining per-screen literals (SparkChips, Onboarding, EveningMirror,
// CoreRitual breathing loops) are still follow-up work for the §14.1
// cohesion sweep, which by design (§12.5 build-order gate) runs against
// the *settled* tree rather than re-touching files mid-flight.

export const SPRINGS = {
  // Traversal — the bee moving through space (R7 §9.4 ratified glide;
  // §12.2 ambient cruise uses the same spring). Never used for feedback/
  // reaction, only for motion along a path.
  glide: { friction: 9, tension: 60 },
  // Feedback — celebration/arrival pop. CelebrationBadge, hero numeral
  // pop (§11.4), tapestry/Wrapped beat pops.
  pop: { friction: 4, tension: 140 },
  // Press feedback — every tappable's scale-down/spring-back (PressableScale).
  press: { friction: 6, tension: 200 },
  // Burst ray spring — CelebrationRays' staggered ray reveal (§11.3).
  ray: { friction: 6, tension: 100 },
  // Reveal spring — non-numeric AnimatedStat entrances (theme words, quotes).
  reveal: { friction: 7, tension: 120 },
  // Tab icon landing spring (MainTabs TabIcon) — bigger, snappier arrival.
  land: { friction: 5, tension: 220 },
  // Tick — fast sequential pops for streak hexes / tapestry cells igniting
  // one-by-one (§14.2 Beat 2 "Streak," Beat 5 "Tapestry").
  tick: { friction: 6, tension: 180 },
  // The Dive (POLLINATE_COMB_DIVE_SPEC.md R-CD-1/-2) — ONE spring drives the
  // whole choreography (`dive` 0..1, one Animated.Value); camera, wax-shadow,
  // backlight, paper and odometer are all derived INTERPOLATIONS of it over
  // different input ranges (camera samples 0-0.55, paper 0.45-1), never
  // separate timers or separate driver values. R-CD-2's "gentle-class for
  // the camera, standard-class for the paper" describes how each term's own
  // interpolation range reads against the one curve, not two physical
  // springs — a single Animated.spring call per direction.
  diveIn: { friction: 8, tension: 100 }, // arrival tuned so camera reads ~0.55 by ~550ms, paper ~0.95+ by ~800ms
  diveExit: { friction: 16, tension: 130 }, // zero-bounce, faster — R-CD-2's ~65%-of-entrance, no overshoot
  // R-CD-7 — paging between a cell's several papers. Own token: a page
  // swipe is lateral, not the dive's forward/back axis, and shouldn't
  // borrow a config tuned for a different distance.
  divePage: { friction: 9, tension: 90 },
};

// Press-depth law (Lumen, luxury pass 2026-08-20): three depths shipped
// with no rule — 0.88 (TabBarButton), 0.96 (PressableScale), 0.97
// (PrimaryButton). Inverse of what shipped: the *larger* the surface, the
// *smaller* the travel, because a big slab moving 4% reads as collapsing
// rather than depressing. Two values, no third.
export const PRESS = {
  // Everything — the tab icon's 0.88 was a toy-grade squash and is retired.
  standard: 0.96,
  // Selected by component identity, not measured width — there is one CTA
  // shape in this app (§4), and it is the only thing that gets the
  // shallow press. PrimaryButton's 0.97 rounds up so it doesn't collapse.
  slab: 0.98,
};

export const PRESS_TIMING = {
  // MP-5: press-in is force being applied, not elastic release. It compresses
  // quickly and never overshoots into the surface; the spring remains legal
  // only on release.
  compress: 90,
};

export const PRESS_EASING = {
  compress: Easing.out(Easing.cubic),
};

export const DURATIONS = {
  // Click/burst treatments — §12.5 Rule 2: must stay sub-200ms so they
  // never queue or feel laggy.
  instant: 120,
  quick: 200,
  // Celebration burst particle scatter (§11.3 CelebrationRays).
  celebrate: 500,
  // Hero numeral glow-ring pop-in (§11.4 AnimatedStat "arrival").
  arrival: 400,
  // Hero numeral count-up duration (AnimatedStat numeric path).
  reveal: 700,
  // Bee glow-trail particle drift + fade (§12.2: "drift and fade out over
  // ~600-900ms" — midpoint).
  trailFade: 750,
  // Reflective-surface reveal — a card fading up under the thing you just
  // tapped. §17.5's motion register: taps on Recap resolve with glide, not
  // celebration, so this is deliberately longer than `quick` and carries no
  // spring. HoneycombGrid's reveal card already runs this exact number as a
  // literal; collecting that call site belongs to the §14.1 cohesion sweep
  // against the settled tree, not to a branch in flight.
  revealGlide: 260,
  // §14.1 mandate: reduced motion collapses every spring/transition to a
  // flat fade at this duration — "no exceptions." Supersedes §12.5's
  // approximate "~150ms" for the same case (settled at Pixel's gate, logged
  // in the Review Log — don't re-open it).
  reducedMotionFade: 200,
  // The Dive's own RM substitute (R-CD-9) — this is the one term the §14.1
  // blanket duration above does not cover: R-CD-9 names its own asymmetric
  // pair (fast in, faster out) rather than one flat fade both ways, because
  // the dive's RM branch is feedback/navigation motion (skill adoption note,
  // "two classes, two treatments"), not the idle terms §14.1 governs.
  diveRmIn: 220,
  diveRmOut: 150,
};

// R-CD-5 — the date odometer. Licensed only when time is the story; caps and
// per-step timing are the spec's own numbers, not tuned here.
export const DIVE_ODOMETER = {
  stepMs: 90,
  maxTotalMs: 350,
  maxVisibleSteps: 4,
};

// Honey register (Lumen, luxury pass 2026-08-20; rescored by LP-R21, Colin
// 2026-08-26, and MB-D2b, Deezine 2026-08-27) — the hex-tap centrepiece's
// timing, and its own law: honey never springs. A spring is elastic; honey
// is viscous and inelastic. Eased timings only. Banned from `SPRINGS` on
// purpose: if you're reaching for a spring here, what you're building is
// water.
//
// WHAT USED TO BE HERE. `swell`/`neck`/`fall`/`pool` (700/380/900/1100)
// scored a bead that gathered at the cell, necked, fell and pooled on the
// ground below — ~3.1s played straight through. LP-R21 retired all four
// beats wholesale on the owner's direction ("the honeydrip is awful … it
// should just trip on to that one tile and keep the illuminated honey
// colour"): the drip pointed the eye AWAY from the person just chosen,
// during the exact window the reveal card was arriving. Their durations and
// easings retire WITH them — guardrail 5 — because a number that outlives
// the beat it was scored for is how a retired treatment finds a new home
// (guardrail 3's own R50 argument, one file over).
//
// `swell`'s 700 had one surviving consumer after the bead went: the glow's
// bloom -> rest crossfade, which Beat 3 had scored to span the bead's
// formation. It retires too rather than being re-pointed — MB-D2b's hold is
// a STILL SCREEN ("frame capture during hold is a still screen"), and a
// 700ms crossfade under a 250ms fill leaves the light still moving 450ms
// after the cell has settled. The light now settles WITH the fill; see
// `HexTapOverlay`/`HoneycombGrid` for the one expression that says so.
export const HONEY = {
  // MB-D2b: the fill arrives radially from the cell centre and holds. One
  // number, because the hold is STATE, not animation — nothing here scores
  // the held part, and nothing should.
  fill: 250,
};

// Per-phase easings for `HONEY`, kept alongside the durations so a caller
// never has to guess which curve goes with which number.
export const HONEY_EASING = {
  // MB-D2b names "easeInOut" without choosing an order. Quad, because this
  // module's material family already was: the retired `swell`/`fall` curves
  // were `Easing.out(Easing.quad)` and `Easing.in(Easing.quad)`, and the
  // cubics in the hex-tap score all belong to the LIGHT (glow rise, camera
  // dive), not to the honey. One material, one curve family. Cubic also
  // costs visible time this beat does not have: it holds under 10% of the
  // cell's radius for 73.1ms of the 250, against quad's 55.9ms, on a beat
  // that already starts 260ms after the finger.
  fill: Easing.inOut(Easing.quad),
};

// NECTAR — the living exchange (POLLINATE_NECTAR_LIVING_EXCHANGE §3, Lumen
// 2026-08-29). One gift is ONE gesture in three beats, and the boundaries
// below are the spec's own: Gather 0-180, Depart 180-520, Settle 520-760.
// They are written as DURATIONS rather than as timestamps so that a beat
// retimed here cannot leave a later beat's start stranded at a number that
// no longer follows it.
export const NECTAR = {
  // Gather: the panel's contents fall away and the chosen amount lifts off
  // its chip as a drop.
  gather: 180,
  // Depart: 180 -> 520. The travel.
  travel: 340,
  // Absorption: the drop collapses into the paper and the paper takes a warm
  // bloom at the contact point. Rise and fall are asymmetric BY RULING —
  // "it reads as a stain spreading and not a flash" is a statement about the
  // ratio, and 240/520 is the spec's own pair.
  absorbRise: 240,
  absorbFall: 520,
  // Settle: the balance numeral counts to its new value, and the sender's
  // own meniscus falls by the drop's worth ON THE SAME CLOCK. ONE constant,
  // read by both — `HoneyFill` imports this rather than declaring 400, so
  // the count and the level cannot drift into two clocks for one event.
  settle: 400,
};

export const NECTAR_EASING = {
  // The gesture's own curve. Endpoint velocity is zero at lift-off and
  // contact, with one interior speed peak. The drop does not bounce — R-N3
  // says so outright, which rules out every spring in this file for travel.
  travel: Easing.inOut(Easing.cubic),
  // The spec's own pair, quoted: rise `out(cubic)`, fall `inOut(cubic)`.
  absorbRise: Easing.out(Easing.cubic),
  absorbFall: Easing.inOut(Easing.cubic),
  // The count and the meniscus share `settle`; the meniscus additionally
  // requires a MONOTONE curve, because it renders a quantity and an
  // overshoot would assert a level nobody holds. `HoneyFill` uses
  // `HONEY_EASING.fill` for that reason and this entry is not it — see that
  // component's comment.
  settle: Easing.inOut(Easing.cubic),
};

// Stage light (MB-D1, Deezine 2026-08-27; Lumen ratified with amendments
// 2026-08-28) — the one-shot bloom that announces a ceremony hero before it
// performs. Two consumers, ever: the P2 celebration card and the P3 greeting
// bee (Lumen, 2026-08-28 — the open-moment/volume-slider application is
// struck, not deferred).
//
// ONE PAIR, NOT TWO. The score gives 200/150 at the seal and 250/300 at the
// greeting. Its own acceptance line asks for "the same bloom grammar used at
// seal and greeting," and two objects lighting at two speeds is two
// vocabularies wearing one name — so the slower entrance wins (a stage light
// that snaps on is a flash, and the greeting is the quieter moment) and the
// longer fade wins (the bloom is the last thing to leave). Deezine or Lumen
// overrule either by moving one number here, which is the point of it being
// here.
//
// That quote is the amended text. It read "at seal, open, greeting" when this
// constant was first written; Lumen struck the open moment the same day and
// the acceptance line lost a third of its list. The ARGUMENT was untouched by
// that — two speeds for two objects is the same problem as two speeds for
// three — but the words it quotes moved, and a justification comment is a
// dependency like any other. No gate guards this: the score is a workspace
// document, outside the repo CI ever checks out, so a row asserting the quote
// would resolve absent-and-green rather than absent-and-red. Re-read the doc,
// don't trust this sentence.
//
// NOT A SPRING, on purpose, and not an exception to the luxury pass: light
// has no mass, so it cannot overshoot. `SPRINGS.reveal` peaks at 1.1746 —
// on an opacity that clips invisibly, but on the bloom's SCALE it is a pump,
// which is an ambient gesture on a component ruled one-shot-never-ambient.
// Eased timings, per the score's own "Animation timing" section.
export const BLOOM = {
  entrance: 250,
  fade: 300,
  // Scale the bloom grows through on entrance (score: "scale ramps
  // 0.85 -> 1.0"). Light expanding, never a card landing.
  entranceScale: 0.85,
};

export const BLOOM_EASING = {
  entrance: Easing.out(Easing.cubic),
  fade: Easing.in(Easing.cubic),
};

// Cascade delay between staggered children (list items, tapestry cells,
// theme card reveals) — §14.1 "40-60ms cascade."
export const STAGGER_MS = 50;

// §14.1 amendment (R24, Pixel). §14.1's per-item step is calibrated for a
// 5-10 row list; what's actually ratified is how a cascade *feels*, and
// that's its total length, not its step. Multiplying a fixed step by a
// dense collection breaks the thing the rule exists to protect — 30
// calendar cells at `STAGGER_MS` is a 1.5s wait for the grid to settle.
// So dense collections divide a budget instead.
export const CASCADE_BUDGET_MS = 700;

// Per-item delay for a cascade of `count` items. Below ~14 items the
// budget isn't binding and this returns `STAGGER_MS` exactly, so every
// existing call site is byte-identical — a change to the shared module
// must not move a single merged consumer (R19).
export const staggerDelay = (index, count = 1) =>
  index * Math.min(STAGGER_MS, Math.ceil(CASCADE_BUDGET_MS / Math.max(count, 1)));

// Hard cap for any particle-based effect (bee glow trail, celebration
// burst). §12.5 Rule 3: FlyingBee trail is the #1 low-end perf risk.
export const MAX_TRAIL_PARTICLES = 12;

// Reduced-motion, first-class (§12.5 Rule 4) — one hook, subscribed to
// live OS changes (not just read-once-at-mount), so a mid-session
// accessibility toggle takes effect immediately.
//
// Deliberately `useState(false)`, not `useState(null)` — R19 (Pixel):
// resolving `false` onto an already-`false` state is a no-op write, so
// React bails out and skips the re-render for the (large majority)
// Reduce-Motion-off case, meaning every `[reduced]`-dep effect across the
// 7 existing consumers (FlyingBee, GlowOrb, HoneycombGrid, StaggeredItem,
// StreakBadge, EveningMirror, PollinateWrapped) runs exactly once. Seeding
// `null` breaks that bail-out for everyone, not just Reduce-Motion users —
// `null -> false` is a real state change, so it was a universal double-run
// regression traded for fixing a race in three new components. Don't
// change this hook's contract; see `useReducedMotionState` below instead.
export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((value) => mounted && setReduced(!!value))
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (value) => {
      if (mounted) setReduced(!!value);
    });
    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reduced;
};

// R19 (Pixel): opt-in sibling for a component that fires a one-time side
// effect on mount (a haptic, a spring that must not run at all under
// Reduce Motion) and needs to hold its first frame until the OS
// preference is actually known, instead of assuming full-motion and
// racing the async read. `resolved` starts `false` and flips exactly once
// per mount, regardless of which way `reduced` lands, so effect deps on
// `resolved` cost the same single extra run for every user — not just the
// asymmetric hit `useReducedMotion` seeding `null` would have caused.
// `useReducedMotion` itself keeps its exact original contract and its
// bail-out; this is additive, not a replacement, so the 7 merged
// consumers need no changes and no re-audit.
// R20 (Pixel): a `resolved` hold turns a failed accessibility read from
// cosmetic (assume full motion, animate anyway) into blocking (nothing
// runs, the ceremony stalls). `.catch` covers the realistic case
// (rejection); this covers the read never settling at all — cheap
// insurance so a stuck native bridge can't hang the app's emotional peak.
const RESOLVE_TIMEOUT_MS = 750;

export const useReducedMotionState = () => {
  const [state, setState] = useState({ reduced: false, resolved: false });

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((value) => mounted && setState({ reduced: !!value, resolved: true }))
      .catch(() => mounted && setState({ reduced: false, resolved: true }));
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (value) => {
      if (mounted) setState({ reduced: !!value, resolved: true });
    });
    const timeout = setTimeout(() => {
      if (mounted) setState((prev) => (prev.resolved ? prev : { ...prev, resolved: true }));
    }, RESOLVE_TIMEOUT_MS);
    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription?.remove?.();
    };
  }, []);

  return state;
};
