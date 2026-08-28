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
// 2. NO STATE EXISTS IN WHICH THE TEXT NEVER ARRIVES (Lumen's ruling,
//    2026-08-27, DES-17's forfeit class). `active` is flipped by a hero's
//    settle, so there are two separate ways for a cue never to fire, and
//    only one of them is about accessibility:
//
//      a. THE HERO IS SKIPPED. Reduce Motion skips the flight, so its
//         settle never happens. The reduced branch below therefore reads
//         `reduced` ALONE and renders the finished string — get this wrong
//         and the line sits at opacity 0 forever for exactly the users
//         least able to tolerate it. This is also the commission's wording
//         taken literally ("reduced-motion branch renders final text
//         immediately"), and it supersedes §14.1's flat-fade collapse for
//         this component only: there is no progressive arrival left to
//         collapse, and a fade of copy already committed to the screen is
//         decoration, not accessibility.
//
//      b. THERE IS NO HERO AT ALL. A surface that adopts this copy without
//         adopting the bee that stages it has nobody to emit a settle, and
//         under full motion that is the SAME forfeit with none of the
//         accessibility signal to make it visible — every frame of that
//         build looks perfect and the line is simply absent. The component
//         cannot infer this, so the caller declares it, and THE DECLARATION
//         IS THE DEFAULT: a cue is a boolean, and anything that is not a
//         boolean is not a cue. `active` omitted (or undefined while a
//         caller's own state settles) means unstaged, and unstaged renders
//         the finished string at frame 0. The failure direction is
//         therefore unreachable by omission — forgetting the prop costs you
//         the choreography, never the words.
//
//    Both states render through ONE function, `renderFinal`, so the two
//    cannot drift into disagreeing about what "arrived" means.
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
// GRAIN IS THE CALL SITE'S (Deezine's pick, per the commission — `line`
// for both first adopters, 2026-08-27), and the two are not equivalent in
// one respect that belongs in the choice rather than in this comment's
// small print: `line` keeps each line a single
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

// The schedule the component runs, exported so a CALLER can chain off it.
//
// P2's beat requires "acknowledgment precedes numbers IN TIME, not just in
// layout" (PRESENCE_PASS_REGISTER, lane P2), so the arithmetic that follows a
// choreographed line has to know when that line is legible. It cannot compute
// that itself without reproducing the two-pass derivation below, and a
// SECOND COPY OF A DERIVATION IS THE DEFECT — it agrees today and diverges the
// first time either pass moves. So there is one function and two readers.
//
// It lives here rather than in `typeChoreography.js` because the step comes
// from `staggerDelay`, and `motion.js` imports React — `typeChoreography` is
// gate-importable precisely because it takes the step as an argument.
//
// Two passes: the step depends on the FINAL segment count, and that count
// depends on the collapse ceiling, which only `revealSchedule` knows. Cheap —
// both passes are string work over one line of copy.
export const choreographedSchedule = (text, grain = GRAINS.LINE) => {
  const count = revealSchedule(text, { grain }).segments.length;
  return revealSchedule(text, { grain, stepMs: staggerDelay(1, count) });
};

export const ChoreographedText = ({
  text,
  // The default is the LOSSLESS grain, which is also the one Deezine picked
  // for both first adopters. Line grain keeps each line a single `<Text>`,
  // and on device it is pixel-identical to a plain `<Text>` of the same
  // string (0 differing pixels, both lines) — so a call site that says
  // nothing about grain pays nothing for the silence. Word grain costs up
  // to 2 device pixels of accumulated inter-word advance along a row, which
  // is a thing to opt into, not a thing to inherit.
  grain = GRAINS.LINE,
  // NO DEFAULT ON PURPOSE — see property 2b. Omitted means "no hero will
  // ever cue this", which renders the finished string; `false` means "a
  // hero exists and has not settled yet", which holds. Defaulting this to
  // `false` would make the stranded state the one you get by forgetting.
  active,
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
  // The same function a caller chains off — see `choreographedSchedule`.
  // Memoised on `text`/`grain`; the derivation itself lives above so that
  // this component and whatever follows it can never disagree about when
  // this beat ends.
  const schedule = useMemo(() => choreographedSchedule(text, grain), [text, grain]);

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

  // The arrival of last resort, shared by both unconditioned states so that
  // "the text arrived" means one thing. ONE `<Text>`, which also gives
  // these branches the app's real line-breaking for free.
  const renderFinal = () => (
    <View style={containerStyle} accessible accessibilityRole="text" accessibilityLabel={label} {...rest}>
      <Text style={style} importantForAccessibility="no-hide-descendants">
        {text}
      </Text>
    </View>
  );

  // Property 2b — UNSTAGED. Tested before anything else and without reading
  // `reduced`, because a cue that will never come is not an accessibility
  // state: it is full-motion text that is simply missing. Note this is a
  // `typeof` test rather than a truthiness test — `false` is a cue, and a
  // held segment must stay held.
  if (typeof active !== 'boolean') return renderFinal();

  // Property 2a — REDUCED MOTION. Read `reduced` alone — never `active` —
  // so the copy cannot be stranded by a cue that only exists inside a
  // motion branch.
  if (resolved && reduced) return renderFinal();

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
