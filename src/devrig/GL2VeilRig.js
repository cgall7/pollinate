// GL2 VEIL RIG — NEVER FOR MERGE.
//
// Measures the composite of (Liquid Glass + cream veil) so the veil alpha for
// the GlassView rung can be DERIVED rather than guessed
// (PLANS/LUXURY_CONSISTENCY_REGISTER.md GL2).
//
// What is real here: the bar's own geometry (BAR_HEIGHT, borderRadius.large,
// SIDE_INSET), the real TabIcon row, the real tokens. What the rig forces:
// the ground underneath, the veil alpha, and how the veil is applied.
//
// Every frame states its own state twice — a human-readable line, and a
// 6-bit machine-readable patch strip at bottom-left so the burst can be
// decoded without OCR.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { GlassView, isLiquidGlassAvailable, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import * as Font from 'expo-font';
import { theme } from '../constants/theme';
import { fontAssets } from '../constants/fontAssets';
import { SIDE_INSET, BAR_HEIGHT } from '../navigation/tabBarLayout';
import { useReduceTransparency } from '../navigation/GlassBackground';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// The alpha sweep. 0.55 is the shipped `glassSheer` and is IN the sweep on
// purpose — the current value has to be measured on the same instrument as
// the candidates or the comparison is against a remembered number.
export const ALPHAS = [0.55, 0.4, 0.35, 0.3, 0.25, 0.15, 0];

// Two ways to apply the same quantity. Overlay = today's shape (a veil View
// drawn ON the material). Tint = the material's own `tintColor`, composited
// by UIKit inside the lensing rather than on top of it.
// 'blur' is the SHIPPED rung, measured on the same instrument as the
// candidates — a comparison against a remembered number is not a comparison.
export const MODES = ['overlay', 'blur'];

// Grounds. The striped pair is the post-G2 gold comb's own contrast and
// spatial frequency made INVARIANT IN Y, so that all seven bars in a column
// sit over an identical ground; a hex tiling would give each bar a different
// slice and the alpha sweep would stop being the only variable.
const STRIPE_PT = 22; // half a 44pt comb cell
export const GROUNDS = [
  { key: 'goldStripes', a: theme.colors.goldField, b: theme.colors.background },
  { key: 'honeyFlat', a: theme.colors.background, b: theme.colors.background },
  // The app's real dark content: body copy on a white card, at the real
  // type token. This is what actually scrolls under the pill.
  { key: 'inkText', a: theme.colors.surface, b: theme.colors.surface, text: true },
  // A deliberate over-stress: a 50%-duty field of pure ink at a spatial
  // frequency the material cannot smear out. Nothing in the app renders
  // this. It is carried as a BOUND, not as a case.
  { key: 'inkStripes', a: theme.colors.ink, b: theme.colors.surface },
];

const BAR_TOP_0 = 120;
const BAR_PITCH = 72;
const BAR_WIDTH_INSET = SIDE_INSET;
const RADIUS = theme.borderRadius.large;

const BODY = 'Today I was given a quiet morning and a friend who called first. '.repeat(40);

const Stripes = ({ ground }) => {
  if (ground.text) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: ground.a }]}>
        <Text
          style={{
            ...theme.type.body,
            color: theme.colors.ink,
            paddingHorizontal: theme.spacing.lg,
          }}
        >
          {BODY}
        </Text>
      </View>
    );
  }
  if (ground.a === ground.b) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: ground.a }]} />;
  }
  // 402pt wide screen / 22pt stripe -> 19 stripes covers it with margin.
  const cells = [];
  for (let i = 0; i < 24; i += 1) {
    cells.push(
      <View
        key={i}
        style={{
          position: 'absolute',
          left: i * STRIPE_PT,
          top: 0,
          bottom: 0,
          width: STRIPE_PT,
          backgroundColor: i % 2 === 0 ? ground.a : ground.b,
        }}
      />
    );
  }
  return <View style={StyleSheet.absoluteFill}>{cells}</View>;
};

// The real icon row: one focused tab flanked by two unfocused ones, at the
// real 56x44 pill and the real 24pt glyph. Everything drawn here is opaque
// and its colour is known, so the only quantity the rig has to MEASURE is
// the veiled-glass composite behind it.
const IconRow = () => (
  <View style={styles.iconRow} pointerEvents="none">
    <View style={styles.iconPill}>
      <Ionicons name="sunny-outline" size={24} color={theme.colors.textSecondary} />
    </View>
    <View style={[styles.iconPill, styles.iconPillActive]}>
      <MaterialCommunityIcons name="hexagon-multiple" size={24} color={theme.colors.ink} />
    </View>
    <View style={styles.iconPill}>
      <Ionicons name="flower-outline" size={24} color={theme.colors.textSecondary} />
    </View>
  </View>
);

// One bar = the GlassView rung under test. The rim is the real 1pt
// `glassRim` edge; GL2 re-derives it alongside the veil.
const Bar = ({ alpha, mode, top }) => {
  const clip = { borderRadius: RADIUS, overflow: 'hidden' };
  const tint = mode === 'tint' ? `rgba(255, 255, 255, ${alpha})` : undefined;
  const veil =
    mode === 'tint' ? null : (
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(255, 255, 255, ${alpha})` }]}
      />
    );
  const rim = (
    <View
      style={[StyleSheet.absoluteFill, styles.rim, { borderRadius: RADIUS }]}
      pointerEvents="none"
    />
  );
  const material =
    mode === 'blur' ? (
      // The shipped rung, verbatim: intensity 60, systemUltraThinMaterialLight.
      <BlurView intensity={60} tint="systemUltraThinMaterialLight" style={[StyleSheet.absoluteFill, clip]}>
        {veil}
        {rim}
      </BlurView>
    ) : (
      <GlassView glassEffectStyle="regular" tintColor={tint} style={[StyleSheet.absoluteFill, clip]}>
        {veil}
        {rim}
      </GlassView>
    );
  return (
    <View style={[styles.bar, { top }]}>
      {material}
      <IconRow />
    </View>
  );
};

// 6 bits, MSB left, black = 1. Bottom-left corner, clear of the home
// indicator (which is centred, roughly x 130-270pt).
const StateStrip = ({ index }) => (
  <View style={styles.strip} pointerEvents="none">
    {[5, 4, 3, 2, 1, 0].map((bit) => (
      <View
        key={bit}
        style={{
          width: 20,
          height: 12,
          backgroundColor: (index >> bit) & 1 ? '#000000' : '#FFFFFF',
        }}
      />
    ))}
  </View>
);

export const GL2VeilRig = () => {
  const [index, setIndex] = useState(0);
  const [fonts, setFonts] = useState(false);
  const reduceTransparency = useReduceTransparency();

  // The rig bypasses App.js, which is where fonts are normally loaded. The
  // ink-text ground's darkness is a function of the real face's stroke
  // weight, so the real face has to be registered or the ground is a
  // different ground.
  useEffect(() => {
    Font.loadAsync(fontAssets).then(() => setFonts(true)).catch(() => setFonts(false));
  }, []);

  useEffect(() => {
    const total = MODES.length * GROUNDS.length;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), 1500);
    return () => clearInterval(id);
  }, []);

  const mode = MODES[Math.floor(index / GROUNDS.length)];
  const ground = GROUNDS[index % GROUNDS.length];

  const lg = isLiquidGlassAvailable();
  const api = isGlassEffectAPIAvailable();

  return (
    <View style={styles.root}>
      <Stripes ground={ground} />
      <Text style={styles.readout}>
        {`GL2 #${index}  LG=${lg} API=${api} RT=${reduceTransparency} fonts=${fonts} os=${Platform.OS}${Platform.Version}`}
      </Text>
      <Text style={styles.readout2}>{`mode=${mode}  ground=${ground.key}  alphas top->bottom ${ALPHAS.join(' ')}`}</Text>
      {ALPHAS.map((a, i) => (
        <Bar key={`${mode}-${a}`} alpha={a} mode={mode} top={BAR_TOP_0 + i * BAR_PITCH} />
      ))}
      <StateStrip index={index} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FF00FF' },
  readout: { position: 'absolute', top: 64, left: 12, fontSize: 11, color: '#000' },
  readout2: { position: 'absolute', top: 80, left: 12, fontSize: 11, color: '#000' },
  bar: {
    position: 'absolute',
    left: BAR_WIDTH_INSET,
    right: BAR_WIDTH_INSET,
    height: BAR_HEIGHT,
  },
  // NOT `StyleSheet.absoluteFillObject` — that export does not exist in
  // react-native 0.86.2 and spreading `undefined` is a silent no-op.
  // `space-around` puts the three pills at 1/6, 3/6, 5/6 of the bar, which is
  // where equal-flex tab items put them in the real bar.
  iconRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  iconPill: {
    width: 56,
    height: 44,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: theme.colors.washYellow,
    borderWidth: 1,
    borderColor: theme.colors.accentEdge,
  },
  rim: { borderWidth: 1, borderColor: theme.colors.glassRim },
  strip: { position: 'absolute', left: 0, bottom: 0, flexDirection: 'row' },
});
