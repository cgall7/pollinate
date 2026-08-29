import React, { useCallback, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { theme } from '../constants/theme';
import { HoneyDrop } from './HoneyDrop';

// R-N3's Depart and its absorption, drawn. The drop and the stain both live
// HERE — one layer, above the page, taking no touches — rather than inside
// the entry card and the ending block separately, because R-N3.2 rules the
// drop one object at every call site and two mountings of one object is two
// places for it to drift.
//
// THE LAYER MEASURES ITSELF. `send` hands in window rects from
// `measureInWindow`, and this view is not guaranteed to start at the window
// origin — a navigator header, a status-bar inset or an edge-to-edge change
// would all shift it. So the layer records its own window origin on layout
// and subtracts it. Nothing here is a coordinate table; every number is the
// live position of a real view at the moment the finger left it.
//
// `pointerEvents="none"` is load-bearing and is the OTHER half of R-N3.3:
// the ruling separates the visual from the interactive, and the interactive
// half stays on `sendOverlay`, which keeps swallowing taps while this layer
// draws over the entry it must not intercept.

// THE STAIN'S PEAK, MEASURED. Two bounds, and the one that binds is not the
// one the spec names.
//
// R-N3 asks for a peak "strictly below the entry's own reveal light" — that
// light is `bloomOpacity`, which springs to 1, so the named constraint is
// satisfied by any alpha at all and did NOT set this number. Said plainly
// rather than quoted as if it had.
//
// The real ceiling is legibility: the stain composites ABOVE the text (see
// the layer note above — architecturally it must, because one layer serves a
// `PaperBlock` on one path and a `Text` on the other), so it dims the ink
// and its ground together. The largest alpha at which every text/ground pair
// this stain can land on still clears 4.5:1 is 0.3022, binding on
// `paperEvening`.
//
// The FLOOR is visibility, and it is what actually chose the number: the
// smallest alpha whose stain is clearly perceptible (dE00 >= 5) on EVERY one
// of the six grounds it can land on — `surface` and `paperEvening` on the
// entry path, the four `cover.base` tokens on the ending path. Calibrated on
// the FAILING ground, not the mean: `washPeach` is amber-on-amber and is the
// only one that lands exactly on 5.000; `washSky` gets 8.42 for free. Picking
// by the average would have licensed 0.07 and made the stain invisible on
// the one cover where it matters most.
//
//   surface 7.6016 · paperEvening 7.2968 · background 5.0894
//   washPeach 5.0000 · washSky 8.4186 · backgroundWriting 6.4689
//
// 0.104 against a 0.3022 ceiling is 2.9x of headroom, so the two bounds do
// not fight and no future paper token can be added that squeezes them
// together without a row going red.
export const STAIN_PEAK_ALPHA = 0.104;

// THE STAIN IS THE DROP'S OWN FOOTPRINT. A drop that lands flattens to about
// its own width, so the stain's RADIUS is the drop's DIAMETER — one
// multiple, with a physical reason, rather than a spread factor picked to
// look right. It starts at the drop's radius (the contact patch is the drop)
// and spreads to twice it.
export const STAIN_SPREAD = 2;

export const NectarGiftLayer = ({ gift, travel, dropScale, dropOpacity, bloom }) => {
  const [origin, setOrigin] = useState(null);
  const ref = useRef(null);

  const onLayout = useCallback(() => {
    if (!ref.current) return;
    ref.current.measureInWindow((x, y) => setOrigin({ x, y }));
  }, []);

  if (!gift || !origin) {
    return <View ref={ref} onLayout={onLayout} style={styles.layer} pointerEvents="none" />;
  }

  const { plan, radius } = gift;
  const local = (p) => ({ x: p.x - origin.x, y: p.y - origin.y });
  const pts = plan.path.map(local);
  const stainR = radius * STAIN_SPREAD;
  const end = pts[pts.length - 1];

  return (
    <View ref={ref} onLayout={onLayout} style={styles.layer} pointerEvents="none">
      {/* The stain, under the drop and centred on the contact point. */}
      <Animated.View
        style={[
          styles.stain,
          {
            left: end.x - stainR,
            top: end.y - stainR,
            width: stainR * 2,
            height: stainR * 2,
            borderRadius: stainR,
            opacity: bloom.interpolate({ inputRange: [0, 1], outputRange: [0, STAIN_PEAK_ALPHA] }),
            transform: [
              // From the contact patch (the drop's own radius) outward to the
              // footprint. `STAIN_SPREAD` appears once, as the box; this is
              // its reciprocal, so the two cannot disagree.
              { scale: bloom.interpolate({ inputRange: [0, 1], outputRange: [1 / STAIN_SPREAD, 1] }) },
            ],
          },
        ]}
      />
      {/* The drop. Positioned by translating its own box along the
          arc-uniform path — ONE driver, interpolated twice. */}
      <Animated.View
        style={[
          styles.drop,
          {
            left: -radius,
            top: -radius,
            opacity: dropOpacity,
            transform: [
              { translateX: travel.interpolate({ inputRange: plan.inputRange, outputRange: pts.map((p) => p.x) }) },
              { translateY: travel.interpolate({ inputRange: plan.inputRange, outputRange: pts.map((p) => p.y) }) },
              { scale: dropScale },
            ],
          },
        ]}
      >
        <HoneyDrop radius={radius} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  // `absoluteFill`, NOT `absoluteFillObject` — the latter does not exist in
  // RN 0.86.2 (SeedsInbox.js:451, Onboarding.js:992, GlassBackground.js:73
  // all carry the same note, all three earned the hard way).
  layer: {
    ...StyleSheet.absoluteFill,
  },
  stain: {
    position: 'absolute',
    backgroundColor: theme.colors.accentDeep,
  },
  drop: {
    position: 'absolute',
  },
});
