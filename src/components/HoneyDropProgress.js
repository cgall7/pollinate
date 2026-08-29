import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../constants/theme';
import { SPRINGS, DURATIONS, useReducedMotion } from '../constants/motion';

// §14.2 progress hook: 7 honey drops across the top of Wrapped, one fills
// per beat — always visible, always promising the finale. Standalone so
// PollinateWrapped.js can mount it above whichever beat is on screen.
const DROP_SIZE = 14;
const DROP_PATH = 'M12 2 C12 2 4 12 4 16 C4 20 8 22 12 22 C16 22 20 20 20 16 C20 12 12 2 12 2 Z';

const Drop = ({ filled }) => {
  const reduced = useReducedMotion();
  const pop = useRef(new Animated.Value(filled ? 1 : 0)).current;
  const wasFilled = useRef(filled);

  useEffect(() => {
    if (filled && !wasFilled.current) {
      // §12.5 Rule 4 / §14.1: reduced motion collapses every spring to a
      // flat fade, no bounce — a plain timing to 1, not the pop spring.
      if (reduced) {
        pop.setValue(0);
        Animated.timing(pop, { toValue: 1, duration: DURATIONS.reducedMotionFade, useNativeDriver: true }).start();
      } else {
        pop.setValue(0.6);
        Animated.spring(pop, { toValue: 1, ...SPRINGS.pop, useNativeDriver: true }).start();
      }
    } else if (!filled) {
      pop.setValue(0);
    }
    wasFilled.current = filled;
  }, [filled, reduced]);

  return (
    <View style={styles.dropWrap}>
      <Svg width={DROP_SIZE} height={DROP_SIZE} viewBox="0 0 24 24">
        {/* `trackDim`, not `surfaceBorderStrong`: this row is a progress
            rail, and §23.11 already ruled the rail pair (`ink` fill on an
            `ink@0.52` track). `surfaceBorderStrong` is a CARD-EDGE token —
            `inkVeil@0.14`, which over `goldField` is 1.3100:1, and against a
            filled `accentDeep` drop 1.1655:1. That last number was the whole
            defect: the one thing this component exists to say — which beat
            you are on — was carried at 1.17:1 on the app's showcase screen.
            Borrowing the rail register also means borrowing its ground, so
            the token re-solved for `goldField`; see theme.js. */}
        <Path d={DROP_PATH} fill="none" stroke={theme.colors.trackDim} strokeWidth={2} />
      </Svg>
      {filled && (
        <Animated.View
          pointerEvents="none"
          style={[styles.dropFill, { opacity: pop, transform: [{ scale: reduced ? 1 : pop }] }]}
        >
          <Svg width={DROP_SIZE} height={DROP_SIZE} viewBox="0 0 24 24">
            {/* `ink`, not `accentDeep`. R127 licenses `accentDeep` as a
                glyph fill, but a licence is a role, not a measurement:
                on `goldField` it is 1.5268:1, and §29.1's own gold block
                already says `ink` is the only thing that separates from
                this field. 10.0066:1 here, 15.8455:1 on `background`. */}
            <Path d={DROP_PATH} fill={theme.colors.ink} />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
};

// `filled` — number of beats completed (0-7). Beat N's screen should pass
// `filled={N}` so the Nth drop fills the moment that beat is reached.
export const HoneyDropProgress = ({ filled, total = 7 }) => (
  <View style={styles.row}>
    {Array.from({ length: total }, (_, i) => (
      <Drop key={i} filled={i < filled} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  dropWrap: {
    width: DROP_SIZE,
    height: DROP_SIZE,
  },
  dropFill: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
