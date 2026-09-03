// Measured geometry of the ratified mascot render, kept apart from the
// component that draws it so a gate can import the numbers. Every figure here
// is a property of that specific drawing, so it is re-derived, never retyped.
//
// **THE MASTER OF RECORD IS `design/final-mascot-2026-08-25-espresso.png`.**
// The line this replaces named `final-mascot-2026-08-12.png` and said to re-run
// the export if the render ever changes. That was true about the GEOMETRY —
// every figure below reproduces from either file — and false about the PIXELS,
// which made it an instruction that reverted a ruling. Colin's 2026-08-17 iris
// call (gold -> espresso) shipped as `aea0bdc`/`687e788` by editing the derived
// 309px `assets/mascot-body.png` DIRECTLY: 558 pixels, iris only, never
// propagated up. So re-exporting from the 08-12 master silently restored the
// pre-ruling eyes — invisible at chrome scale, and the face at hero scale.
//
// A REGENERATION INHERITS THE SOURCE'S STATE AND SILENTLY REVERTS EVERY RULING
// APPLIED BELOW IT. The 08-25 master carries the espresso decision, so the
// chain is honest again and this comment is safe to follow.
//
// Pipeline, in order, in `design/pipeline/` — see `design/README.md`:
//   build_layers.py  master -> wing_full/body_full   (R82's split)
//   cut.py           -> assets/mascot-{wing,body}.png + the hero LOD
//
// `build_layers.py` defaults to the espresso master and REFUSES the 08-12 one
// by inspecting its irises, not by its name — a rename only moves a trap. It
// is a guard rather than a comment because a comment is what failed here.
//
// The 2026-08-25 iris round trip made `mascot-wing.png` byte-identical and
// changed only two sub-JND iris pixels in `mascot-body.png`. The 2026-09-02
// split repair intentionally changes the BODY mask: the master's charcoal
// wing perimeter belongs to the moving wing pose, never the still body layer.
// `check:mascot-presence` measures the shipped bytes and the pipeline records
// the ownership rule; see design/README.md.

// Character box: the union of the two layers' bounding boxes, 1013 x 1049px.
// Both PNGs are cropped to it, so they stack by being the same size in the
// same place and need no per-layer offsets.
export const MASCOT_ASPECT = 1013 / 1049;

// The character is drawn at this fraction of the `size` box. It is
// `StripedBee`'s own drawn width fraction — its content spans x 5.2..21.6 of a
// 24-unit viewBox — so a call site that swaps one for the other keeps its
// footprint. Height follows from the aspect and comes out at 0.708 of the box
// against StripedBee's 0.47: the mascot has a head and a trailing abdomen.
export const MASCOT_WIDTH_FRACTION = 16.4 / 24;

// WelcomeBee's character box inside its ceremonial stage. This is layout,
// not motion, but it lives beside the mascot geometry so measurements of the
// hero use the box the component actually passes rather than the 132pt stage
// around it. Moving it changes the hero's silhouette, not merely a comment.
export const WELCOME_BEE_STAGE_FRACTION = 0.68;

// Wing root, as a fraction of the character box. This is the pivot for the
// beat; it is not the box centre, which is why `MascotBee` composes the pivot
// by hand. Measured as the mean of the 2% of wing pixels with the largest x —
// the wing mass lies left of the body, so its head-most end is where it meets
// the thorax. R79 estimated (0.438, 0.492) off the unsplit render; the split
// layers put it at (0.427, 0.505).
export const HINGE = { x: 0.4273, y: 0.5050 };

// Full sweep of one wing beat, R79's figure. The flap radius — root to the
// farthest wing pixel — is 0.411 of the box height, so 18 degrees moves the
// tip 0.128 box-heights: 4.0pt at size 44, 1.2pt at size 13. R79 quoted 6.60pt
// at 44 assuming the character filled its box; at `MASCOT_WIDTH_FRACTION` it
// doesn't, and 4.0pt is the figure that ships.
export const WING_BEAT_DEG = 18;

// §17.3's ratified half-cycle, unchanged. `StripedBee` beat 1 -> 0.55 in this
// time and the mascot rotates instead, because a scaleY about a root hinge
// barely moves a wing that extends horizontally away from it — the ratified
// quantity was always the beat, and scaleY was a guess at how to drive one.
export const WING_BEAT_MS = 80;

// Base-cut width in pixels: `design/pipeline/cut.py`'s `BASE = 320` sized to
// the longer side, which lands the width (the character box's short side, at
// `MASCOT_ASPECT`) at 309. Above this, the base raster upsamples. Move this
// only if `cut.py`'s `BASE` moves.
//
// One dimension is enough to test even though the box has two, and not by
// luck: `MASCOT_ASPECT` is the same ratio in the master and in every cut, so
// width and height cross their own limits together by construction —
// `size * MASCOT_WIDTH_FRACTION * pixelRatio > MASCOT_BASE_PX` and the
// equivalent height test agree to 0.009 of a `size` unit (Pixel, 2026-08-25:
// @3x 150.73 vs 150.74, @2x 226.10 vs 226.11). A height branch would only add
// a second, differently-rounded threshold to maintain.
export const MASCOT_BASE_PX = 309;
// --- Breath (Bee Doctrine §State-2) ---------------------------------------
//
// A perched bee is not a flying one at a lower frame rate. Doctrine §State-2:
// "wing-only flutter, 4.2s cycle, scale amplitude <=1.5% of the bee's bounding
// box, zero translation, zero hover." The bar it has to clear is Lumen's —
// *you never catch it performing; if you stare, it rewards you.*
//
// **The bound is converted into the mechanism's own currency rather than
// applied to it.** The doctrine says "scale amplitude"; the ratified wing
// mechanism is a ROTATION about the hinge (R82 — a scaleY about a root hinge
// barely moves a wing that extends horizontally away from it). Those are two
// different quantities, so the bound is restated in the one the wing actually
// has: the peak-to-peak travel of the wing TIP, as a fraction of the character
// box, which is the same currency `WING_BEAT_DEG`'s own note is written in
// (§12.5.1 — a figure states the space it was measured in).
//
//     tip travel = 2 * FLAP_RADIUS * sin(theta / 2)     [box heights]
//
// `FLAP_RADIUS` = 0.411 of the box height, the figure `WING_BEAT_DEG` is
// already stated against. Check it reproduces the shipped number before
// trusting it on a new one: at 18 degrees it gives 0.12859 box-heights and
// 4.0036pt at size 44, against the 0.128 and "4.0pt" written above. Same
// instrument, same answer.
//
// Solving the doctrine's ceiling exactly gives 2.0912 degrees. Two degrees is
// what ships — 1.4346% against the 1.5% ceiling, 4.4% of headroom, because a
// constant set AT its gate's ceiling breaches it the moment anything it is
// derived from moves (R-series: never ship a zero-headroom token).
export const BREATH_FLAP_RADIUS = 0.411;
export const BREATH_BEAT_DEG = 2;

// One complete up-down-up cycle. Deliberately longer than a casual glance
// (~2-3s) so a look never contains a whole beat: what the eye gets in passing
// is a wing that is somewhere, not a wing that is moving.
//
// **Read this number before quoting it.** It is the FULL cycle, so each
// direction takes half of it. `WING_BEAT_MS` above is the opposite convention
// — it is the HALF, 80ms out and 80ms back — and the two conventions sitting
// in one file is exactly how a 4.2s breath ships at 8.4s. The names carry it:
// `_CYCLE_MS` is a cycle, `_BEAT_MS` is a beat.
export const BREATH_CYCLE_MS = 4200;

// --- The drawn silhouette, by direction (§28.3, Lumen 2026-08-25) ----------
//
// **How far the character reaches from its own centre, as a fraction of its
// drawn WIDTH, binned by direction.** The pollen burst is seeded off this, and
// it exists because the burst was previously sized against the character's
// BOUNDING BOX — one number, 0.5 of the width — while the drawing's own reach
// runs 0.4416 to 0.6480 depending on where you look. The legs and the antennae
// stick a long way out past a body that does not fill its box, so a single
// radius either buries the flecks that fire into a leg or throws the ones
// firing into a gap much too far. Measured on device: at the old constant the
// 48-degree fleck never left him at all.
//
// Every figure is produced by `scripts/derive-mascot-clearance.mjs` from the
// shipped `assets/mascot-{body,wing}.png`; `--check` re-derives and fails on
// drift, so unlike this file's older constants the assets and the numbers
// cannot silently disagree. Re-run it if the render is ever re-exported.
//
// Conventions the derivation states and this table inherits:
//   * angle 0 is +x, angles increase toward +y (screen down), degrees;
//   * the reach is in units of the character's WIDTH, so it scales with
//     `size` and carries no device or cell dimension;
//   * the wing is swept through `WING_BEAT_DEG` about `HINGE` before the
//     union, because the burst fires on the frame he lands and the airborne
//     beat is still the pose;
//   * BOTH facings are unioned — he mirrors on `scaleX` (R81), so a clearance
//     that only holds for one facing is a burst that only works landing one
//     way.
//
// Bins rather than a curve, and the bin holds the MAXIMUM over its own span
// including both edges: a lookup is then an upper bound for every angle inside
// the bin and needs no interpolation. That is not a shortcut — interpolating
// this profile would UNDER-state the spikes, and under-stating is the
// direction that puts a fleck inside a leg.
export const CLEARANCE_BIN_DEG = 10;
export const MASCOT_CLEARANCE = [
  0.4968, 0.496, 0.4416, 0.6248, 0.644, 0.648,
  0.4752, 0.4488, 0.4488, 0.4488, 0.4488, 0.4752,
  0.648, 0.644, 0.6248, 0.4416, 0.496, 0.4968,
  0.496, 0.4712, 0.5712, 0.5728, 0.5664, 0.4784,
  0.4536, 0.5264, 0.5208, 0.5208, 0.5264, 0.4536,
  0.4784, 0.5664, 0.5728, 0.5712, 0.4712, 0.496,
];

// --- Presence: the body's half of Breath (Colin, 2026-08-29) ---------------
//
// Colin, on the shipped hero: *"could we have our bee mascot doing the motions
// that make him look like he's living and breathing within the app? like what
// I sent you the other day on the x link where the fox was moving slightly
// within their app."*
//
// **He is right, and the arithmetic says how right.** Breath's entire visible
// output is the wing tip travelling `2 * BREATH_FLAP_RADIUS * sin(1 degree)`
// = 1.4346% of the drawn height. At WelcomeBee's 132pt stage that is **0.9111pt
// peak-to-peak over 2100ms — 0.434pt/s, 0.0072pt per frame at 60fps.** The
// character is, to the eye, a still image. The doctrine's bar is "you never
// catch it performing; if you stare, it rewards you"; a stare is rewarded with
// a hundredth of a point per frame, which is not a reward, it is a rounding
// error. Nothing was mistuned — the mechanism was only ever asked to move a
// wing tip, and a wing tip is the one part of the character the eye is not
// tracking.
//
// So Breath gains a BODY term, and State 2's "zero positional change" is
// amended rather than ignored — see `GUIDES/BEE_DOCTRINE_SPEC.md` §State-2.
// The rule that survives is the one it was written for: **zero NET
// translation.** A hover is unanchored — its centre is free, so the bee drifts
// and the eye cannot tell where he belongs, which is why "hovering = still a
// screensaver". A breath is defined BY its anchor: the excursion is symmetric
// about the perch point, the mean position IS the perch point, and the perch
// point never moves. That distinction is in the mechanism, not in the
// amplitude, which is why it can be stated as an invariant instead of a dial.
//
// **Two clocks, deliberately.** The body does not breathe on the wing's 4.2s.
// One thing moving on one clock reads as a metronome at any amplitude — the
// eye locks the period inside two cycles and the character becomes a loop. Two
// terms on incommensurate clocks never present the same pose twice inside a
// glance: 4.2 and 6.5 coincide every 54.6s, which is longer than anyone looks
// at a header. This is the whole reason the body term is worth building; the
// displacement alone is not.
export const BREATH_RISE_CYCLE_MS = 6500;

// Peak-to-peak vertical travel of the whole character, as a fraction of its
// drawn HEIGHT. At WelcomeBee's 132pt stage the passed character box is
// 89.76pt and the drawing is 63.5158pt high, so the travel below is 2.0325pt.
// At a direct 44pt chrome mount the drawing is 31.1352pt high: 0.9963pt.
//
// **The doctrine's 1.5% ceiling is not available as the bound here, and saying
// why is the point.** That figure was already converted into the wing's own
// currency further up this file ("the bound is restated in the one the wing
// actually has: the peak-to-peak travel of the wing TIP"). A constant only
// means anything inside the frame it was measured in; re-spending a wing-tip
// bound on a whole-silhouette displacement would be the same category error
// that comment exists to prevent. A body term needs a body bound, written new.
//
// Bounded below by legibility and above by the performing bar:
//   floor    the silhouette must travel at least as far as the wing tip does,
//            or the term adds nothing the eye can find. 1.4346%.
//   ceiling  at 6.5s, travel the eye can RESOLVE mid-glance reads as drift
//            rather than as breathing. Measured against the wing, 2.2% is
//            1.53x the tip's travel and still 0.63pt/s at the hero — an order
//            of magnitude under the ~5pt/s where a slow move becomes a move.
// R-PW-2 (Lumen, 2026-08-30, GUIDES/POLLINATE_PERCH_WEIGHT_SPEC.md §3) —
// 2.2% -> 3.2%. The paragraph above ends "it is the first thing to re-measure
// on a device," and that is exactly the licence this moves on: Colin ran the
// measurement and the verdict was "flat." A tuned number inside a stated
// interval, re-tuned by the follow-up its own note named.
//
// The clock does NOT move (6.5s, 42/58 split): peak drift-rate at the hero is
// 0.31pt/s, still an order of magnitude under the ~5pt/s where a slow move
// stops reading as breathing and starts reading as travel. That ordering is
// the ruling — RETREAT AXIS IS AMPLITUDE, NEVER THE CLOCK. A faster cycle is
// panting, and it fails the ceiling's own argument rather than tuning inside
// it: if 3.2% reads as drift on device, come back toward 2.6%.
//
// NOT SHIPPED AT A CEILING. 4.5% is the documented ceiling — the R-series bar
// is that a token always keeps headroom, and 2.2% shipped AT its own stated
// ceiling, which is part of why there was nowhere to go when the device
// verdict came back.
export const BREATH_RISE_FRACTION = 0.032;
export const BREATH_RISE_CEILING = 0.045;

// A breath is not a sine. The in-breath is quicker than the out-breath in
// every animal that has one, and a symmetric curve is the second thing (after
// a single clock) that makes a loop read as machinery. 42/58 of the cycle.
export const BREATH_RISE_SPLIT = 0.42;

// --- Punctuation ----------------------------------------------------------
//
// The third term, and the one that does the most work per byte. A character
// reads as alive when it does something you did not predict; two continuous
// terms, however well phased, are still two continuous terms. So rarely — and
// at an interval that is itself unpredictable — the perched bee flicks its
// wings twice and goes back to breathing.
//
// **This needs no new geometry, and that is not a coincidence.** `MascotBee`'s
// own header has described this behaviour since it was written: *"a held bee
// flicks twice and rests"* is the stated reason the `beat` prop exists. What
// was missing was a rhythm to drive it. The flick therefore reuses
// `WING_BEAT_DEG` at `WING_BEAT_MS` — the airborne beat, borrowed for four
// half-beats — and the amplitude difference between Breath and a flick becomes
// a property of the RHYTHM rather than of the transform, which is the split
// `MascotBee` already declares between what it owns and what a caller owns.
//
// Interval bounds, not a period: a fixed 15s flick is a metronome with a long
// arm. Re-rolled after every flick.
//
// R-PW-1 (Lumen, 2026-08-30, PERCH_WEIGHT_SPEC §2) — 11-23s -> 4-9s. The
// diagnosis was arithmetic, not anatomy: this is the only term with real
// amplitude (12.01pt at the hero against the continuous terms' ~2pt), it runs
// 1.85% of the time, and the FIRST one could not fire inside 11s — median wait
// ~17s. A character is judged in its first five seconds, so on the evidence
// almost nobody had ever seen the one term that carries it.
//
// The anti-metronome argument above survives intact, and that is why this
// number could move: it argues UNPREDICTABILITY, not RARITY. A re-rolled 4-9s
// interval is exactly as unlearnable as a re-rolled 11-23s one. First flick
// now lands within 9s of mount BY CONSTRUCTION (median ~6.5s).
//
// No separate first-wait constant, deliberately: a creature that flicks the
// instant you look at it is performing. 4s of composure first is the
// character.
export const FLICK_INTERVAL_MIN_MS = 4000;
export const FLICK_INTERVAL_MAX_MS = 9000;
export const FLICK_BEATS = 2;

// --- Weight (R-PW-3) ------------------------------------------------------
//
// The fourth term, and the only NEW class: a settle beat. PERCH_WEIGHT_SPEC §4.
//
// What the FlightElite fox has that three well-phased loops do not is not more
// motion — it is WEIGHT. It periodically re-settles onto its own mass. Breath
// and punctuation were both already here; gravity was not.
//
// DOCTRINE STATUS. This is an amendment, not a tuning, and it is made rather
// than assumed: BEE_DOCTRINE_SPEC.md's Retire-Outright list deletes perch
// fidget by name and State 2 is "complete freeze at rest pose." The amendment
// narrows that retirement to UNANCHORED restlessness — translation, hops,
// preening that changes pose. A settle is defined BY its anchor: it is the one
// gesture that PROVES the anchor by pressing into it. Zero net translation,
// symmetric recovery to the same rest point.
//
// Re-rolled after each one, same reason as the flick.
export const SETTLE_INTERVAL_MIN_MS = 20000;
export const SETTLE_INTERVAL_MAX_MS = 45000;

// The dip, as a fraction of DRAWN height — the same denominator
// `BREATH_RISE_FRACTION` uses, so the two body terms are comparable without a
// conversion. 3% is 1.9055pt at WelcomeBee's 132pt stage and 0.9341pt at a
// direct chrome 44 mount — slightly LARGER than a whole breath's peak-to-peak,
// because a settle has to read as a
// distinct event against the breath it interrupts, not as a deeper breath.
export const SETTLE_DIP_FRACTION = 0.03;

// Down fast, up slow. Dropping onto mass is ease-IN (it accelerates); recovery
// is the muscle taking the load back, which is slower and eases out. The
// asymmetry IS the weight — a symmetric dip reads as a bob.
export const SETTLE_DIP_MS = 240;
export const SETTLE_RECOVER_MS = 520;

// A small elastic tail on the way back up, as a fraction OF THE DIP (not of
// the height): 4% of 3% is 0.12% of drawn height, 0.158pt at the hero. Below
// resolvability on its own, which is correct — an overshoot you can measure is
// a bounce, and a bounce is a cartoon. It exists to stop the recovery landing
// dead, not to be seen.
export const SETTLE_OVERSHOOT_FRACTION = 0.04;

// How the recovery's 520ms splits between the main return (dip -> past rest,
// to the overshoot peak) and the tail (overshoot -> rest). Tuned inside a
// stated shape, exactly like `BREATH_RISE_SPLIT`: a damped rebound spends most
// of its time on the large excursion and decays faster than it rose.
export const SETTLE_OVERSHOOT_SPLIT = 0.72;

// ONE wing beat at the nadir — the wings absorb the settle. Not `FLICK_BEATS`
// (which is 2, and is the PUNCTUATION rhythm): a settle is one composed
// gesture, and a double-flick inside it would read as the punctuation term
// firing coincidentally rather than as part of the same event.
export const SETTLE_FLICK_BEATS = 1;

// --- Lateral weight shift (R-SW) ------------------------------------------
//
// The fifth term. `GUIDES/POLLINATE_PERCH_WEIGHT_SPEC.md` §7, Colin's fox
// re-ruling of 2026-09-03 after watching R-PW ship: *"how it moves side to
// side and smoothly… I want you to replicate that."*
//
// **This reverses a decline, and the reversal is narrower than it looks.**
// §5 declined "a third continuous term (lateral sway / body roll)" on the
// ground that continuous terms blur into hover. That reason survives intact
// and is why this is NOT what was declined: a continuous oscillator has no
// rest, so its mean pose is a smear and the eye never finds the perch. This
// is a one-shot GESTURE — out, DWELL, home, then nothing for 8-14s — and it
// spends most of its life at rest, like the flick and the settle. Same class,
// new axis.
//
// **Measured, not vibed** (Lumen, from the KRU clip frames, 24fps over the
// 6.04s source): the fox's body centroid travels 7.49px peak-to-peak on a
// ~112px-wide character — 6.7% of its own drawn width — one journey per
// ~4-5s, with a smooth drift out, a 1-2s HOLD at the extreme, and an eased
// return. THE DWELL IS THE SIGNATURE. A slow ease across the same distance
// reads as drift; the hold is what reads as an animal standing on one side
// of its own weight.

// Peak lateral offset EACH SIDE, as a fraction of the character's DRAWN
// WIDTH — half the fox's measured peak-to-peak, so the p2p lands at 6.6%
// against its 6.7%.
//
// The denominator is drawn WIDTH, and it is not interchangeable with the
// drawn HEIGHT the two vertical terms use. The fox's ratio was its centroid's
// travel over its own drawn x-extent; a constant only means anything inside
// the frame it was measured in (the standing rule, and R-PW-2's own
// correction block is the last time this file got it wrong).
//
// 2.0241pt each side at the hero (a 132pt stage, so an 89.76pt character box
// and a 61.3360pt drawn width) — 4.0482pt peak-to-peak, 1.99x the whole
// breath's travel, which is correct: this is the term Colin's eye went
// looking for and did not find. 0.9922pt each side at a direct 44pt chrome
// mount, i.e. the ~2px shimmer §7's scale-honesty row asks for. Same
// fraction at both; the character carries one physics (R-SW-4).
//
// IT CANNOT CLIP, AT ANY MOUNT, BY CONSTRUCTION — not by luck of the
// numbers. The drawing occupies `MASCOT_WIDTH_FRACTION` of its box and is
// centred, so there is (1 - 0.6833) / 2 = 15.83% of the box free on each
// side, which is 23.17% of the DRAWN width. The excursion is 3.3% of the
// same quantity, so the drawing never leaves the rect its box already
// occupied and no ancestor's overflow can decide anything. Both sides of
// that comparison are fractions of the same denominator, which is what makes
// it a structural property rather than a measurement at two sizes.
export const SWAY_OFFSET_FRACTION = 0.033;

// NOT SHIPPED AT A CEILING (the R-series bar, same as `BREATH_RISE_CEILING`).
// 5% each side is 1.5x the fox's own measurement, and past roughly there the
// excursion stops reading as a weight shift and starts reading as a lean the
// character never comes back from — the reference IS the ruling, so the
// ceiling's job is only to give the advance axis a stop. If Colin's eye still
// wants more: AMPLITUDE toward this, never the clock. A faster journey is a
// pace, not a weight shift, and it fails §7's own dwell argument rather than
// tuning inside it.
export const SWAY_OFFSET_CEILING = 0.05;

// The driver's positive extreme. Named rather than typed, for the same reason
// every other number in this file is: `check-bee-attitude` §E forbids a bare
// numeric declarator in `MascotBee.js`, and the sway needs a signed unit it
// can flip. Writing the poles as `-SWAY_POLE` and `SWAY_POLE` is also what
// makes the interpolation's symmetry about the perch point STRUCTURAL — two
// ends that cannot be edited apart, rather than two numbers that agree today.
export const SWAY_POLE = 1;

// One journey every 8-14s, re-rolled after each one. Its own clock, and
// deliberately incommensurate with everything else on the character: the
// breath's 6.5s body cycle, the wing's 4.2s, the flick's 4-9s re-roll and the
// settle's 20-45s. Five terms that never present the same pose twice inside a
// glance is the whole argument for having five.
export const SWAY_INTERVAL_MIN_MS = 8000;
export const SWAY_INTERVAL_MAX_MS = 14000;

// The journey: 1.1s out, 1.5s held, 1.4s home — 4.0s, inside the fox's
// measured 4-5s. The hold sits mid-band of its measured 1-2s.
//
// The return is SLOWER than the departure, which is the opposite asymmetry to
// the settle's (240ms down, 520ms up) and for the same physical reason read
// the other way round: the settle is driven by gravity, which accelerates,
// while a lateral shift is muscular in both directions and the way back is
// the one being given up rather than taken. Neither is a mirror of the other,
// and a symmetric out-and-back is the shape that reads as a metronome.
export const SWAY_OUT_MS = 1100;
export const SWAY_DWELL_MS = 1500;
export const SWAY_HOME_MS = 1400;

// Which side. Biased, not strict: strict alternation is a metronome one level
// up — the interval is unlearnable but the SEQUENCE is left-right-left-right,
// and the eye learns sequences. 70/30 away from the last side keeps the
// long-run mean at the perch point (so zero net translation survives a bias
// as well as it survives a coin flip) while making the next side genuinely
// unpredictable.
export const SWAY_DIRECTION_BIAS = 0.7;
