import React, { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SPRINGS, staggerDelay, useReducedMotionState } from '../constants/motion';
import { GRAINS, revealSchedule } from './typeChoreography';

// MB-P1 — progressive text arrival, synced to a hero's settle.
//
//   <ChoreographedText text={line} grain="word" active={beeHasLanded} style={type.body} />
//
// THE DIVISION OF LABOUR, which is the whole design: the CALLER owns the
// cue and the COMPONENT owns the beat (R83 — a component owns beat
// geometry, a caller may own rhythm). The caller flips `active` at the
// moment its hero settles; everything after that — the grain's delays, the
// spring, the reduced-motion branch, the accessibility label — is decided
// here, once, for every ceremony that adopts it. A beat that let its call
// site pass durations would be a second timing system, and §12.5.1b already
// ruled that a named curve fixes SHAPE, not duration.
//
// FOUR PROPERTIES WORTH SAYING OUT LOUD, because each one is a defect this
// shape exists to make unreachable:
//
// 1. LAYOUT IS FINAL AT FRAME 0. Every segment mounts at opacity 0 with its
//    real text and its real style, so the block reserves its full height
//    and width before a single word is visible. Opacity is not a layout
//    property in RN, so nothing beneath this can reflow as the words
//    arrive, and the surrounding screen never jumps. The alternative —
//    mounting words progressively — re-breaks the line on every arrival.
//
// 2. REDUCED MOTION DOES NOT WAIT FOR THE CUE. `active` is flipped by a
//    hero's settle, and a hero whose flight is skipped under Reduce Motion
//    may never fire it — which would strand the copy at opacity 0 forever
//    for exactly the users least able to tolerate it. So the reduced branch
//    below reads `reduced` ALONE and renders the finished string. This is
//    also Lumen's commission wording taken literally ("reduced-motion
//    branch renders final text immediately"), and it supersedes §14.1's
//    flat-fade collapse for this component only: there is no progressive
//    arrival left to collapse, and a fade of copy that is already committed
//    to the screen is decoration, not accessibility.
//
// 3. NO TIMERS, AT ALL. The commission asks for "no per-character timers
//    surviving unmount"; the strongest form of that promise is not to own
//    one. Every delay here is an `Animated` delay inside the animation
//    graph, and the effect's cleanup stops the whole group — so an unmount
//    mid-beat (a screen pop inside a 400ms cascade) leaves nothing running
//    against a value nobody reads. The acceptance rig asserts the absence
//    by enumerating this module, not by grepping for what is here.
//
// 4. THE LABEL IS THE COPY, NOT THE FRAME. The container announces the
//    whole string from mount and never conditions that on `active`. This is
//    the deliberate exception to "an announced label must track the visible
//    label": that rule protects labels that NAME A STATE, where announcing
//    the wrong one misinforms. Here the string is one sentence already
//    committed to the screen, VoiceOver's reading pace is not synced to a
//    spring, and tracking the frame would mean either announcing half a
//    sentence or moving focus order in the middle of a ceremony. So the
//    segments are hidden from the tree and the sentence is announced once.
//
// GRAIN IS THE CALL SITE'S (Deezine's pick, per the commission), and the
// two are not equivalent in one respect that belongs in the choice rather
// than in this comment's small print: `line` keeps each line a single
// `<Text>`, so RN's own line-breaker and kerning are untouched. `word` has
// to box each word to keep property 1, so wrapping becomes flex-wrap over
// word boxes and the inter-word space is a real space rendered in the real
// font (appended to the word, not a `columnGap` estimate) — same font, same
// size, but the break decisions are flex's, not the text engine's.

// How far a segment travels on its way in. Small on purpose: at word grain
// a dozen boxes each sliding a body line's worth of distance reads as the
// paragraph moving rather than the words arriving — the same finding
// `StaggeredItem` records for dense grids, where 14pt of travel per cell
// read as the whole grid sliding. `SPRINGS.reveal` overshoots 17.46%
// (sampled at 60fps), so the rise settles by coming back down 1.05pt past
// its resting line, which is the settle the spring is there for.
const RISE_PT = 6;

const styles = StyleSheet.create({
  // One container serves both grains: `line` grain simply marks every
  // segment `breakBefore`, so each line takes a row of its own.
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  // A zero-height full-width item forces the next segment onto a new row —
  // the flex-wrap idiom for a hard break. It carries no height of its own,
  // so line spacing stays whatever `style.lineHeight` says it is.
  rowBreak: { width: '100%', height: 0 },
});

export const ChoreographedText = ({
  text,
  grain = GRAINS.WORD,
  active = false,
  style,
  containerStyle,
  accessibilityLabel,
  // Travel is part of the beat, not a knob: the words rise into place. Kept
  // as a named constant rather than a prop for the same reason the spring
  // is — see the division of labour above.
  ...rest
}) => {
  const { reduced, resolved } = useReducedMotionState();

  // `50` IS the per-item step: the shared function
  // returns `index * step`, so index 1 returns the step itself. Derived
  // rather than re-stated, so this cascade divides §14.1's budget exactly
  // the way every other cascade in the app does and cannot drift from it.
  const schedule = useMemo(() => {
    // Two passes on purpose: the step depends on the FINAL segment count,
    // and that count depends on the collapse ceiling, which only
    // `revealSchedule` knows. Cheap — both passes are string work over one
    // line of copy, memoised on `text`/`grain`.
    const count = revealSchedule(text, { grain }).segments.length;
    return revealSchedule(text, { grain, stepMs: staggerDelay(1, count) });
  }, [text, grain]);

  const { segments, delays } = schedule;

  const anims = useMemo(
    () => segments.map(() => new Animated.Value(0)),
    [segments]
  );

  useEffect(() => {
    // Nothing to start: no cue yet, the OS preference is still unknown, or
    // Reduce Motion is on and this component has no animation to run.
    if (!active || !resolved || reduced || anims.length === 0) return undefined;
    const group = Animated.parallel(
      anims.map((value, index) =>
        Animated.spring(value, {
          toValue: 1,
          delay: delays[index],
          ...SPRINGS.reveal,
          useNativeDriver: true,
        })
      )
    );
    group.start();
    // Stops every child spring. Not a double-driver guard — an
    // `AnimatedValue` holds exactly one `_animation` and both entry points
    // stop the incumbent (R46) — but an unmount guard: a screen popped
    // inside the cascade would otherwise leave native springs running
    // against values nobody reads.
    return () => group.stop();
  }, [active, resolved, reduced, anims]);

  const label = accessibilityLabel ?? (typeof text === 'string' ? text : undefined);

  // Property 2. Read `reduced` alone — never `active` — so the copy cannot
  // be stranded by a cue that only exists inside a motion branch. Rendered
  // as ONE `<Text>`, which also gives this branch the app's real
  // line-breaking for free.
  if (resolved && reduced) {
    return (
      <View style={containerStyle} accessible accessibilityRole="text" accessibilityLabel={label} {...rest}>
        <Text style={style} importantForAccessibility="no-hide-descendants">
          {text}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.wrap, containerStyle]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      {...rest}
    >
      {segments.map((segment, index) => {
        const value = anims[index];
        const next = segments[index + 1];
        // The inter-word space belongs to the segment before it, in the
        // caller's own font at the caller's own size. A segment that ends a
        // row gets none — a trailing space at a wrap point widens the box
        // for nothing.
        const trailing = next && !next.breakBefore ? ' ' : '';
        const translateY = value.interpolate({
          inputRange: [0, 1],
          outputRange: [RISE_PT, 0],
        });
        return (
          <React.Fragment key={`${index}-${segment.text}`}>
            {segment.breakBefore ? <View style={styles.rowBreak} /> : null}
            <Animated.Text
              style={[style, { opacity: value, transform: [{ translateY }] }]}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
            >
              {segment.text}
              {trailing}
            </Animated.Text>
          </React.Fragment>
        );
      })}
    </View>
  );
};
