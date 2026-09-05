// NECTAR — the drop's geometry and its flight.
// POLLINATE_NECTAR_LIVING_EXCHANGE §3, R-N3 / R-N3.1 / R-N3.2 (Lumen,
// 2026-08-29), ruled against github/main@960ec7b.
//
// PURE, AND DELIBERATELY SO. Nothing in here imports React, `Animated` or
// `theme` — the gate measures every number below from a bare `node` script,
// the same way `check-honey-fill` measures the vessel. A module that needed
// a renderer to answer "how big is a 10-drop drop" would put the acceptance
// rows behind a device.
//
// The drop is ONE OBJECT (R-N3.2). Its pigment lives in `HoneyDrop`; its
// size and its path live here.

// ---------------------------------------------------------------------------
// The drop's radius
// ---------------------------------------------------------------------------

// THE DOMAIN IS THE SERVER'S, quoted rather than re-chosen — `record_zap`
// raises outside 1..1000 drops, and `NectarSendPanel` already quotes the
// same pair for the same reason. A radius map with a wider domain than the
// ledger would size a gift that cannot be sent.
export const DROP_MIN_AMOUNT = 1;
export const DROP_MAX_AMOUNT = 1000;

// THE FLOOR IS R-N2's FLOOR, ARGUED AGAIN ON A CIRCLE. The meniscus is a
// 1.5pt `ink` stroke and it is drawn ACROSS the drop as its highlight, so
// 0.75pt of it hangs each side of its chord. The rule that set
// `HONEY_MIN_HEIGHT` — "the smallest height at which the honey is a REGION
// and not its own boundary" — says here that the amber cap ABOVE the stroke
// must itself be at least half a stroke, or the highlight is not a highlight
// on a body, it is a line with a rim around it.
//
// The chord sits at `DROP_MENISCUS_DEPTH_FRACTION` of the diameter from the
// top, so: cap = depth - stroke/2 >= stroke/2  =>  diameter >= stroke / depth
// = 1.5 / 0.25 = 6pt. In POINTS, not as a fraction, and forced for the same
// reason R-N2's floor is: it comes from a stroke width, which does not scale.
export const DROP_MENISCUS_DEPTH_FRACTION = 0.25;
export const DROP_MIN_RADIUS = 3;

// THE CEILING IS THE RATIFIED TAP TARGET, and that is R-N6 read backwards.
// The door IS this object at rest, in the 44pt box the design system already
// floors every control at (`LinkButton` and the write inbox both cite it). The same object cannot be larger in flight than the box it lives in
// at rest without being two objects, so the largest gift is exactly that
// box: r = 22.
export const DROP_MAX_RADIUS = 22;

// LOGARITHMIC, because the domain is three decades and the presets sit in
// the first two. Linear in drops, `10` and `100` differ by 1.9% of the range
// and every preset renders as the same small dot; logarithmic they are
// 18.67pt and 31.33pt across, which is R-N3's "100 is visibly bigger than
// 10" as a measurement rather than a hope.
//
// STRICTLY MONOTONE WITH NO FLAT REGION on the whole domain, which is §6
// acceptance row 3. The clamp below is a domain guard and NOT the mechanism:
// `log` is strictly increasing everywhere on 1..1000 and the endpoints land
// exactly on the two radii, so the clamp binds on nothing the ledger can
// produce. (Row 3's own warning — "a clamp that binds on a large fraction of
// the domain is the mechanism wearing a guard's name" — is why it is stated
// this way round and why the gate sweeps every integer.)
export const dropRadiusForAmount = (drops) => {
  const n = Number(drops);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const clamped = Math.min(DROP_MAX_AMOUNT, Math.max(DROP_MIN_AMOUNT, n));
  const t = Math.log(clamped / DROP_MIN_AMOUNT) / Math.log(DROP_MAX_AMOUNT / DROP_MIN_AMOUNT);
  return DROP_MIN_RADIUS + (DROP_MAX_RADIUS - DROP_MIN_RADIUS) * t;
};

// ---------------------------------------------------------------------------
// The bow
// ---------------------------------------------------------------------------

// THE TRAVEL IS AN ARC AND THE ARC COSTS SPEED. `NECTAR.travel` is a FIXED
// 340ms, so every point of path the bow adds is speed the deceleration has
// to shed inside the same window — which makes the ceiling on the bow a
// statement about the beat rather than a taste: the bow may not lengthen the
// journey by more than 5%.
//
// `BOW_DEVIATION_FRACTION` is that bound SOLVED, not chosen. A quadratic
// Bezier whose control point sits `2d` off the chord midpoint deviates by
// exactly `d` at its own midpoint, and at d = 0.1399 x chord the arc is
// 1.0500x the chord. The gate re-solves it: a fraction that drifts from its
// own premise is the thing `check-nectar-exchange` M-rows exist to catch,
// and this is a derived constant sitting next to the number it derives from.
export const MAX_BOW_ARC_INFLATION = 1.05;
export const BOW_DEVIATION_FRACTION = 0.1399;

/**
 * The bow's peak deviation from the chord, in points.
 *
 * THE FLOOR IS THE DROP ITSELF. A curve that departs from its chord by less
 * than the radius of the thing drawn on it is not a curve — it is a straight
 * line drawn with a fat pen, and no one can see the difference. So a short
 * hop bows by the drop's own radius and a long one by the 5% bound, and the
 * short case is the one that binds on the ending screen (R-N3.1: "the travel
 * is short and upward").
 */
export const bowDeviationPx = ({ chordPx, radiusPx }) =>
  Math.max(radiusPx, BOW_DEVIATION_FRACTION * chordPx);

/**
 * The side the drop bows to.
 *
 * IT BOWS UPWARD, because a gift that is handed over goes up and across
 * rather than sliding — and "the chosen amount LIFTS OFF its chip" is R-N3's
 * own verb for the frame this curve opens on.
 *
 * Perpendicular to the chord rather than straight up in screen space, and
 * that is forced: on the ending screen the panel is inline BELOW its
 * destination, so the travel is very nearly vertical, and a control point
 * offset vertically from the midpoint of a vertical chord is COLLINEAR with
 * it — the curve degenerates to the straight line it was there to avoid.
 * Perpendicular, the near-vertical case bows sideways, which is the arc the
 * beat needs and the one a hand actually makes.
 *
 * The two perpendiculars are distinguished by which one rises, so the rule
 * is total except on an exactly vertical chord, where neither does. That is
 * a measure-zero case with no right answer and it is broken deterministically
 * rather than left to whatever `atan2` returns: bow to the right.
 */
export const bowNormal = ({ from, to }) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: 1, y: 0 };
  const ux = dx / len;
  const uy = dy / len;
  // (-uy, ux) and (uy, -ux). Take the one whose y is negative (screen y grows
  // downward, so negative y is up).
  if (ux > 0) return { x: uy, y: -ux };
  if (ux < 0) return { x: -uy, y: ux };
  return { x: 1, y: 0 };
};

// ---------------------------------------------------------------------------
// The flight
// ---------------------------------------------------------------------------

// R-LF-1's rule, borrowed with its reason intact: the polyline is resampled
// BY ARC LENGTH, so "fraction of the way along the index" and "fraction of
// the way along the path" are the same number. That is what lets a single
// easing on a single driver BE the speed profile — `Easing.out(cubic)` on an
// arc-uniform path decelerates in distance, which is R-N3's "decelerating
// into the paper". Resampled by anything else (uniformly in `t`, or
// adaptively by deviation) the same easing decelerates in PARAMETER, and a
// quadratic Bezier's parameter runs fastest exactly where its curvature is
// highest — the drop would speed up through the turn.
//
// This is the identity-easing defect of R-LF-2.1 in a second costume, and it
// is avoided here by construction rather than by composing per-segment
// curves: with one profile over one leg, arc-uniform sampling IS the
// composition.
export const CHORD_DEVIATION_BOUND_PX = 0.05;

// N from the chord, so the bound above holds at any geometry rather than at
// the one box someone measured. Deviation of an arc-uniform polyline falls
// as 1/N^2 and rises linearly with the chord; `DEVIATION_SHAPE_COEFF` is
// that proportionality measured once at the shipped bow fraction. THE
// CONSTANT IS AN APPROXIMATION AND THE GATE DOES NOT TRUST IT — it sweeps
// real chords and asserts the ACTUAL deviation clears
// `CHORD_DEVIATION_BOUND_PX`, so a bow retune that invalidates this number
// reds a row instead of silently coarsening the path.
const DEVIATION_SHAPE_COEFF = 0.15436;
export const DROP_FLIGHT_MIN_SAMPLES = 8;

export const dropFlightSamples = (chordPx) =>
  Math.max(
    DROP_FLIGHT_MIN_SAMPLES,
    Math.ceil(Math.sqrt((DEVIATION_SHAPE_COEFF * Math.max(0, chordPx)) / CHORD_DEVIATION_BOUND_PX)),
  );

const quadAt = (t, p0, c, p2) => {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p2.y,
  };
};

// Dense enough that the arc-length table is not itself the error term. 512
// steps puts the table's own quantisation three orders below
// `CHORD_DEVIATION_BOUND_PX` at every chord this app can produce.
const ARC_TABLE_STEPS = 512;

/**
 * Build the drop's flight, in whatever space the caller measured in.
 *
 * Returns a plan in the shape the bee's already uses — `{ path, inputRange }`
 * consumed by one `Animated` driver — so a reader who knows one knows the
 * other. The DIFFERENCE from `buildPollinationPlan` is the whole of why this
 * is a second builder rather than a call into that one: the bee stages
 * directly above his target, weaves, and fillets the turn, because he is a
 * character crossing a lattice. A drop is a thrown object with one leg, no
 * waypoint and no gait. Reusing the plan builder would have meant supplying
 * a `ringStep` and a `bodyLengthPx` for an object that has neither, and
 * every one of those arguments would have been a lie the next reader had to
 * decode.
 *
 * `inputRange` is uniform because `path` is arc-uniform. Those two facts are
 * the same fact, and the gate asserts it as one.
 */
export const buildDropFlight = ({ from, to, radiusPx }) => {
  const chordPx = Math.hypot(to.x - from.x, to.y - from.y);
  if (!(chordPx > 0)) {
    return { path: [from, to], inputRange: [0, 1], chordPx: 0, arcPx: 0, bowPx: 0 };
  }
  const bowPx = bowDeviationPx({ chordPx, radiusPx });
  const n = bowNormal({ from, to });
  // Control at the chord midpoint offset by TWICE the wanted deviation: a
  // quadratic Bezier passes through `midpoint + offset/2`, not through its
  // control point.
  const control = {
    x: (from.x + to.x) / 2 + n.x * bowPx * 2,
    y: (from.y + to.y) / 2 + n.y * bowPx * 2,
  };

  const dense = [];
  const cumulative = [0];
  for (let i = 0; i <= ARC_TABLE_STEPS; i += 1) dense.push(quadAt(i / ARC_TABLE_STEPS, from, control, to));
  for (let i = 1; i <= ARC_TABLE_STEPS; i += 1) {
    cumulative.push(cumulative[i - 1] + Math.hypot(dense[i].x - dense[i - 1].x, dense[i].y - dense[i - 1].y));
  }
  const arcPx = cumulative[ARC_TABLE_STEPS];

  const at = (s) => {
    if (s <= 0) return dense[0];
    if (s >= arcPx) return dense[ARC_TABLE_STEPS];
    let lo = 0;
    let hi = ARC_TABLE_STEPS;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < s) lo = mid;
      else hi = mid;
    }
    const span = cumulative[hi] - cumulative[lo];
    const f = span > 0 ? (s - cumulative[lo]) / span : 0;
    return { x: dense[lo].x + (dense[hi].x - dense[lo].x) * f, y: dense[lo].y + (dense[hi].y - dense[lo].y) * f };
  };

  const samples = dropFlightSamples(chordPx);
  const path = [];
  for (let i = 0; i <= samples; i += 1) path.push(at((arcPx * i) / samples));
  return {
    path,
    inputRange: path.map((_, i) => i / samples),
    chordPx,
    arcPx,
    bowPx,
  };
};
