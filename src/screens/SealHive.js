import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, ActivityIndicator, Animated, Easing, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { HiveStore } from '../services/HiveStore';
import { hiveCoverTheme } from '../constants/hiveThemes';
import { PressableScale } from '../components/PressableScale';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackButton } from '../components/BackButton';
import { PaperBlock, paperInk } from '../components/PaperBlock';
import { KeepsakeBee } from '../components/KeepsakeBee';
import { CelebrationRays } from '../components/CelebrationRays';
import { GlowOrb } from '../components/GlowOrb';
import { ChoreographedText, choreographedSchedule } from '../components/ChoreographedText';
import { SEGMENT_LEGIBLE_MS } from '../components/typeChoreography';
import { BLOOM, SPRINGS, DURATIONS, useReducedMotionState } from '../constants/motion';

// §5 Screen 3 (Preview Package) + Screen 4 (Seal Complete), condensed per
// Lumen's ruling (thread b57ad406, 2026-08-19): §5 Screen 1's entry
// curation is cut for Slice 1 (seal packages every entry, no checkbox UI —
// a named MVP cut, not a smuggled shortcut) and §5 Screen 2's personal
// note is folded into this preview rather than its own screen. CTA calls
// the seal_hive() RPC (20260819000003) — the atomic sealed_at-set +
// private->packaged flip that closes the gap Fizz found: without it, a
// bare confirm dialog on the old client-settable sealed_at column would
// have sealed a hive and delivered zero visible entries downstream.
const longDate = (isoDate) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

// --- MB-D2a, the seal celebration beat (Pixel, 2026-08-28) -----------------
//
// The witness-first hierarchy PRESENCE_PASS_REGISTER lane P2 names, scored by
// Deezine as MB-D2a and ratified by Lumen 2026-08-28: the hero lands, the
// acknowledgment arrives, the arithmetic follows. Three of the score's
// instructions do not survive contact with this screen and are ruled here
// rather than quietly dropped:
//
// 1. THERE IS NO BEE TO FLY IN, AND THAT IS RATIFIED, NOT A GAP. The score has
//    the bee "arrive on errand grammar" and settle into a witness pose. R51/R83
//    rule that REGISTER FOLLOWS PROVENANCE — a bee that flew in wears the
//    painted flight register (`MascotBee`), and "a bee that never flew — a
//    keepsake, standing on a card — wears the knockout" (`KeepsakeBee`). The
//    hero of this moment is a wax seal with the keepsake bee cut out of it, so
//    flying it in would convert the seal into a character mid-ceremony, which
//    is the one distinction those two components exist to hold. ONE BEE forbids
//    mounting a second. What survives the strike is the HIERARCHY, which is
//    what this beat is: the hero lands by POP, not by flight.
//
// 2. THE GROUND IS THE COVER, NOT `background`. MB-D2a names the bloom's ground
//    as "`background` #FFF7CC Sunlit Honey"; Lumen's ratification kept "the
//    screen's OWN ground" as the binding rule and the token as a parenthetical
//    that the principle outranks. This screen is the case that separates them:
//    `completeContainer` paints `cover.base`, one of FOUR reachable tokens
//    (`hiveThemes.js` — background, washPeach, washSky, backgroundWriting), so
//    the parenthetical is wrong on three covers out of four. Every colour claim
//    below is therefore stated over ALL FOUR, and section J of
//    check-stage-light re-derives them from the live tokens.
//
// 3. THE NUMERALS ARE NOT `accentDeep`. The score gives "accentDeep for
//    numerals; ink for labels". Measured on the four covers this screen can
//    actually paint, `accentDeep` is 2.23-2.52:1 unlit and 1.95-2.07:1 under
//    the bloom — under a 4.5:1 body floor AND under the 3:1 large-text floor,
//    on every ground, lit or not. The register that governs this screen already
//    made this call for the same pigment one surface over: `theme.js`'s
//    `goldField` block rules text on the keepsake field SINGLE-TIER because
//    `accentDeep` is 1.53:1 there, and says hierarchy "comes from size, weight
//    and position — never from colour." So the numeral is `ink` at 34pt and the
//    label is `inkSoft` at 11pt — RecapTab's own stat pair, minus its pigment.
//    (RecapTab's numerals carry the same defect on their own ground; that is a
//    pre-existing site, flagged, not swept into this commit.)
const BADGE_SIZE = 96;

// MB-D1's seal spec: "Radius: card width (96pt) x 1.5 = 144pt bloom radius."
// The doc's "card" is this badge — 96 is the badge's own size and there is no
// card on this screen — so the object it measured is the object that ships.
// Derived rather than typed so the two numbers cannot drift apart.
const BLOOM_RADIUS_RATIO = 1.5;
const BLOOM_SIZE = BADGE_SIZE * BLOOM_RADIUS_RATIO * 2; // 288pt across

// §34 — `intensity` is the light's STRENGTH; `color` carries its hue. 0.55 is
// the value every other ratified mount passes (`CoreRitual.js:51`,
// `Onboarding.js:166`, and P1a's greeting stage), and matching it is the
// argument: this app has one light, and a second number for the same pigment
// is a second vocabulary. Bounded by measurement on all four covers, at the
// bloom's core, which is its darkest point: ink 12.81-13.54:1 and inkSoft
// 4.72-4.99:1, both clearing 4.5:1 with the thinnest margin on `wildflower`.
const BLOOM_INTENSITY = 0.55;

// Unlike Today's, THIS bloom obeys MB-D1's safe-area rule, and the difference
// is the object rather than the rule: 288pt centred on a 402pt screen spans
// x 57..345 inside the 16..386 gutters. P1a's 316.80pt bloom could not, which
// is why that mount ruled the line non-binding there. Same rule, same doc,
// opposite verdicts, decided by arithmetic.

// The moment's length, unchanged — §5 Screen 4's "auto-dismiss or wait for
// tap". Named because three of the beat's four cues are stated against it.
const AUTO_DISMISS_MS = 2600;

// WHEN THE HERO HAS LANDED. The score cues the acknowledgment on the hero's
// settle; RN's own rest for `SPRINGS.pop` (tension 140, friction 4 -> stiffness
// 592.2, damping 13, zeta 0.2671) is 1200ms for the scale and 1333ms for the
// opacity — 46% and 51% of this screen's entire life, and chaining off either
// would strand the rest of the beat past the auto-dismiss. Sampled at 60fps the
// badge reaches full size at 83.3ms, peaks 1.1674 at 133.3ms and RETURNS TO ITS
// RESTING LINE AT 216.7ms; the pop's outward gesture is over there and the rest
// is ring-down. `BLOOM.entrance` is 250ms — 33.3ms, two frames, after that
// return. So the stage light finishing IS the hero settling, to within two
// frames, which is the coincidence MB-D2a's own beat 2 asserts ("bloom reaches
// full scale and opacity as bee settles"). Cueing off the light rather than off
// a spring callback also means the beat is deterministic and needs no rest
// threshold to agree with a design intention.
//
// This is MB-P1's ruling in a second costume: THE HANDOFF IS LEGIBILITY, NOT
// REST. There it was 117ms against a 783ms rest; here it is 250ms against 1200.
const ACK_CUE_MS = BLOOM.entrance;

// The arithmetic's entrance. The score asks for "scale 0.8 -> 1.0 + opacity
// 0 -> 1, easeOut (spring-driven)" — easeOut and spring-driven are two
// different things and only one of them can ship. It is the easing, for the
// reason `motion.js`'s BLOOM block already gives about light: A SPRING ON AN
// OPACITY OVERSHOOTS INVISIBLY AND UNDERSHOOTS VISIBLY. Measured at 60fps off
// RN's own solution, the dip below full AFTER the value has already arrived is
// 3.1% for `SPRINGS.reveal`, 4.2% for `ray`, 9.5% for `tick` and 17.5% for
// `pop`. Only the first was ever measured (MB-P1, ruled invisible). An arrival
// that flickers is not an arrival, so this one is a single eased value driving
// both properties and it cannot flicker by construction.
const ARITHMETIC_ENTRANCE_SCALE = 0.8;

// It becomes legible on the same clock as the words it follows: the arithmetic
// is the next thing in the acknowledgment's cascade, not a new gesture, so it
// borrows MB-P1's own measured "a segment is readable here" constant rather
// than minting a second pace for one element.
const ARITHMETIC_ENTRANCE_MS = SEGMENT_LEGIBLE_MS;

export const SealHiveScreen = ({ navigation, route }) => {
  const { hiveId, subjectName, coverTheme } = route.params;
  // MB-D2a runs a scored, one-shot timeline, so it cannot start on the
  // assumed-`false` value the boolean hook holds while the OS read is in
  // flight — a reduced-motion user would get the front of the ceremony and
  // then a snap. `CelebrationBadge` already holds its first frame this way
  // (R18/R19); this screen now does too, which also retires the same race on
  // the badge spring below.
  const { reduced, resolved } = useReducedMotionState();
  const cover = hiveCoverTheme(coverTheme);

  const [phase, setPhase] = useState('preview'); // 'preview' | 'sealing' | 'complete'
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);

  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.6)).current;

  // Which beat of MB-D2a is playing. 0 = the stage light is coming up on the
  // hero; 1 = the acknowledgment has been cued; 2 = the arithmetic has. It is
  // an ordinal rather than three booleans because the beats are ordered and a
  // state where the numbers have arrived and the words have not is not a
  // state this ceremony has.
  const [beat, setBeat] = useState(0);
  // The bloom's exit. MB-D2a: "the bloom fades out as the moment concludes."
  // The moment concludes when the screen leaves, so the light goes out just
  // before the screen does rather than being cut off mid-hold by a navigation
  // this component does not animate.
  const [bloomFading, setBloomFading] = useState(false);
  const arrival = useRef(new Animated.Value(0)).current;
  // A live OS Reduce Motion toggle re-resolves the hook, and re-running the
  // timeline effect would fire the success haptic a second time. Same guard,
  // same reason, as `CelebrationBadge`'s (R20).
  const hapticFiredRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const list = await HiveStore.getHiveEntries(hiveId);
          if (!cancelled) setEntries(list);
        } catch (err) {
          console.warn('SealHiveScreen: failed to load entries', err);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [hiveId])
  );

  // The acknowledgment. Not new copy — this is the line the screen already
  // shipped, now carried by MB-P1 instead of appearing at frame 0. MB-D2a
  // leaves the acknowledgment's words "TBD by Lumen per Lane P3 voice rules";
  // choreographing the existing sentence is the build that does not pre-empt
  // that ruling, and it is what the register's hierarchy actually asks for.
  const ackText = `${subjectName}, your memories are sealed.`;

  // MB-D2a's whole timeline, scheduled from one place so that every cue is
  // stated against the same t=0 (the frame `phase` becomes 'complete') and one
  // cleanup cancels all of it.
  //
  // DEPS ARE `[phase, resolved]`, NOT `[phase, reduced, resolved]`, ON PURPOSE.
  // `useReducedMotionState` sets both fields in one `setState`, so the closure
  // that runs with `resolved` true already holds the resolved `reduced`. A
  // later OS toggle sets `resolved` true again — no dep moves, the effect does
  // not re-run, and a 2.6s ceremony is not restarted from the top under
  // somebody's finger.
  useEffect(() => {
    if (phase !== 'complete' || !resolved) return undefined;
    if (!hapticFiredRef.current) {
      hapticFiredRef.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (reduced) {
      badgeOpacity.setValue(0);
      badgeScale.setValue(1);
      Animated.timing(badgeOpacity, {
        toValue: 1,
        duration: DURATIONS.reducedMotionFade,
        useNativeDriver: true,
      }).start();
      // §14.1 Rule 4 / MB-D2a's reduced branch: "bee appears immediately, all
      // text renders instantly, no staggered arrival for arithmetic." So the
      // beats do not play — they are already over. The bloom does not fade
      // either: under Reduce Motion `GlowOrb` sets its value rather than
      // animating it, so scheduling the exit would delete the light in one
      // frame, which is a harder cut than the screen change it was meant to
      // soften.
      setBeat(2);
      const t = setTimeout(() => navigation.navigate('Main'), AUTO_DISMISS_MS);
      return () => clearTimeout(t);
    }

    badgeOpacity.setValue(0);
    badgeScale.setValue(0.6);
    const badgePop = Animated.parallel([
      Animated.spring(badgeOpacity, { toValue: 1, ...SPRINGS.pop, useNativeDriver: true }),
      Animated.spring(badgeScale, { toValue: 1, ...SPRINGS.pop, useNativeDriver: true }),
    ]);
    badgePop.start();

    // Beat 3 chains off beat 2's own schedule rather than off a second guess
    // at it: `choreographedSchedule` is the function `ChoreographedText` runs,
    // so "when is the acknowledgment legible" has exactly one answer and both
    // the component and this caller read it. Lane P2 requires the
    // acknowledgment to precede the numbers IN TIME, not just in layout.
    const timers = [
      setTimeout(() => setBeat(1), ACK_CUE_MS),
      setTimeout(() => setBeat(2), ACK_CUE_MS + choreographedSchedule(ackText).settleMs),
      setTimeout(() => setBloomFading(true), AUTO_DISMISS_MS - BLOOM.fade),
      setTimeout(() => navigation.navigate('Main'), AUTO_DISMISS_MS),
    ];
    // The badge's own spring is stopped here too. It rests at 1333ms and the
    // screen lives 2600, so it never leaks on the auto-dismiss path — but the
    // TAP path exists (§5 Screen 4's "or wait for tap") and can leave at any
    // frame, which until now left two native springs running against values
    // belonging to an unmounted screen.
    return () => {
      timers.forEach(clearTimeout);
      badgePop.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, resolved]);

  // The arithmetic's arrival. One eased value drives opacity and scale
  // together — see `ARITHMETIC_ENTRANCE_SCALE` for why this is not a spring.
  useEffect(() => {
    if (beat < 2) return undefined;
    const anim = Animated.timing(arrival, {
      toValue: 1,
      duration: reduced ? DURATIONS.reducedMotionFade : ARITHMETIC_ENTRANCE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [beat, reduced, arrival]);

  // §5 Screen 4: "auto-dismiss or wait for tap" — this is the tap half. It
  // does not play the bloom's exit, and that is the reading rather than an
  // omission: MB-D2a fades the light "as the moment concludes", and a user who
  // taps has concluded it themselves. Waiting 300ms to honour a fade nobody
  // asked for is an app arguing with a dismissal.
  const handleDismissComplete = () => navigation.navigate('Main');

  const handleSeal = async () => {
    if (phase === 'sealing') return;
    setPhase('sealing');
    setError(null);
    try {
      await HiveStore.sealHive(hiveId);
      setPhase('complete');
    } catch (err) {
      console.warn('SealHiveScreen: seal_hive failed', err);
      setError(
        /already been sealed/.test(err?.message ?? '')
          ? 'This hive is already sealed.'
          : "Couldn't seal this hive. Check your connection and try again."
      );
      setPhase('preview');
    }
  };

  if (phase === 'complete') {
    // The app's own count string, in the shape four other surfaces already
    // render it (`HiveCard`, `HiveDetail`, `ContributingHive`, `FileToHive`) —
    // so MB-D2a's arithmetic needs no new copy at all and cannot disagree with
    // the count the user saw on the way in. Split into numeral and noun
    // because the score separates them and because, with the colour split
    // struck, SIZE AND WEIGHT are what carry the distinction; joined again for
    // the accessible label so a screen reader hears one fact, not two.
    const memoryCount = entries.length;
    const memoryNoun = memoryCount === 1 ? 'memory' : 'memories';
    const arrivalScale = arrival.interpolate({
      inputRange: [0, 1],
      outputRange: [ARITHMETIC_ENTRANCE_SCALE, 1],
    });
    return (
      <Pressable
        style={[styles.completeContainer, { backgroundColor: cover.base }]}
        onPress={handleDismissComplete}
        accessibilityLabel="Sealed. Tap to continue."
      >
        <View style={styles.badgeStage}>
          {/* MB-D1's stage light, first child so it paints under the burst and
              under the hero it stages. It overflows this 96pt box by 96pt on
              every side, which is not a new behaviour here: `CelebrationRays`
              already draws to r=88 inside the same 48pt-radius box and has
              shipped that way. */}
          <GlowOrb
            size={BLOOM_SIZE}
            intensity={BLOOM_INTENSITY}
            staged={!bloomFading}
            style={styles.bloom}
          />
          <View pointerEvents="none" style={styles.raysStage}>
            <CelebrationRays />
          </View>
          <Animated.View
            style={[styles.badge, { opacity: badgeOpacity, transform: [{ scale: badgeScale }] }]}
          >
            <KeepsakeBee size={52} />
          </Animated.View>
        </View>
        <ChoreographedText
          text={ackText}
          active={beat >= 1}
          style={[styles.completeTitle, { color: cover.textColor }]}
          containerStyle={styles.completeTitleBlock}
        />
        {/* Beat 3. The closing line is not arithmetic and is not called that —
            it is the screen's existing copy, and it rides this beat because
            the register's hierarchy puts the acknowledgment alone in beat 2.
            THE ARITHMETIC IS ONE ELEMENT. The score staggers "subsequent
            elements +50ms apart"; this hive has exactly one number worth
            stating, so `staggerDelay` has nothing to space and no second
            figure was invented to make the cascade look busier than the fact
            it is reporting. Both children are in flow from frame 0 — only
            their opacity is staged — so nothing above them reflows when the
            beat lands. */}
        <Animated.View
          style={[styles.closing, { opacity: arrival, transform: [{ scale: arrivalScale }] }]}
        >
          <Text style={[styles.completeBody, { color: cover.textColor }]}>
            This keepsake is yours to keep and give whenever you're ready.
          </Text>
          <View
            style={styles.memoryCount}
            accessible
            accessibilityLabel={`${memoryCount} ${memoryNoun}`}
          >
            <Text
              style={[styles.memoryCountValue, { color: cover.textColor }]}
              importantForAccessibility="no-hide-descendants"
            >
              {memoryCount}
            </Text>
            <Text style={styles.memoryCountLabel} importantForAccessibility="no-hide-descendants">
              {memoryNoun}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.banner, { backgroundColor: cover.base }]}>
        <BackButton onPress={() => navigation.goBack()} variant="glass" color={cover.textColor} style={styles.backButton} />
        <Text style={[styles.bannerTitle, { color: cover.textColor }]}>Here's what you're sealing.</Text>
      </View>

      {loading ? (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.noteLabel}>Add a personal message (optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder={`Leave yourself or ${subjectName} a note about these memories.`}
            placeholderTextColor={theme.colors.inkSoft}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={2000}
          />
          {entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <Text style={styles.entryDate}>{longDate(entry.date)}</Text>
              <PaperBlock paper={entry.paper}>
                <Text style={[styles.entryText, { color: paperInk(entry.paper) }]}>{entry.text}</Text>
              </PaperBlock>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <PrimaryButton
          onPress={handleSeal}
          disabled={loading || entries.length === 0}
          loading={phase === 'sealing'}
        >
          Seal This Keepsake
        </PrimaryButton>
        <PressableScale onPress={() => navigation.goBack()} style={styles.backLink} accessibilityLabel="Go back">
          <Text style={styles.backLinkText}>Go Back</Text>
        </PressableScale>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  bannerTitle: {
    ...theme.type.h1,
  },
  list: {
    padding: 24,
    paddingBottom: 220,
  },
  noteLabel: {
    ...theme.type.label,
    color: theme.colors.inkSoft,
    marginBottom: 8,
  },
  noteInput: {
    ...theme.type.body,
    color: theme.colors.ink,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    minHeight: 80,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  entryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  entryDate: {
    ...theme.type.label,
    color: theme.colors.inkSoft,
    marginBottom: 8,
  },
  entryText: {
    ...theme.type.body,
    color: theme.colors.ink,
  },
  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 32,
  },
  errorText: {
    ...theme.type.bodySm,
    color: theme.colors.danger,
    textAlign: 'center',
    marginBottom: 12,
  },
  backLink: {
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  backLinkText: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
  },
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  badgeStage: {
    position: 'relative',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  // Centred on the badge by arithmetic rather than by layout: `GlowOrb` is
  // absolutely positioned and larger than its host box, so the offset is
  // derived from the two sizes and moves with either of them.
  bloom: {
    left: (BADGE_SIZE - BLOOM_SIZE) / 2,
    top: (BADGE_SIZE - BLOOM_SIZE) / 2,
  },
  raysStage: {
    position: 'absolute',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.goldField,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.floating,
  },
  completeTitle: {
    ...theme.type.h1,
    textAlign: 'center',
  },
  // The acknowledgment's block. `ChoreographedText` lays its segments out in a
  // wrap row, so centring is `justifyContent` here rather than `textAlign`
  // there, and the block owns the margin — a margin on the segment style would
  // be a margin on every word.
  completeTitleBlock: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginBottom: 12,
  },
  closing: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  completeBody: {
    ...theme.type.body,
    textAlign: 'center',
    opacity: 0.85,
  },
  memoryCount: {
    alignItems: 'center',
    marginTop: 20,
  },
  // RecapTab's `statValue`/`statLabel` pair, which is this app's one numeral +
  // label shape — carried across without its `accentDeep`, which does not
  // clear a text floor on any ground this screen can paint. Hierarchy is the
  // 34/11 size step and the weight, per the keepsake register's own rule.
  memoryCountValue: {
    ...theme.type.h1,
    fontSize: 34,
  },
  memoryCountLabel: {
    ...theme.type.label,
    fontSize: 11,
    letterSpacing: 1.4,
    color: theme.colors.inkSoft,
    marginTop: 2,
  },
});
