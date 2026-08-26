import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Animated,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { getDailyPrompt } from '../constants/prompts';
import { EntryStore } from '../services/EntryStore';
import * as Haptics from 'expo-haptics';
import { SparkChips } from '../components/SparkChips';
import { PrimaryButton } from '../components/PrimaryButton';
import { PressableScale } from '../components/PressableScale';
import { GlowOrb } from '../components/GlowOrb';
import { WelcomeBee } from '../components/WelcomeBee';
import { CelebrationBadge } from '../components/CelebrationBadge';
import { CelebrationRays } from '../components/CelebrationRays';
import { DEMO_CONTENT } from '../constants/demoMode';
import {
  requestPermissionAndEnable,
  reconcile as reconcileDailyNudge,
  toISODateLocal,
} from '../services/dailyNudge';
import {
  NUDGE_TITLE,
  NUDGE_BODY,
  NUDGE_ASK_LABEL,
  NUDGE_ASK_READY,
  NUDGE_GRANTED_LINE,
  NUDGE_DECLINED_LINE,
} from '../constants/nudgeCopy';

// PLANS/ONBOARDING_ZERO_DOOR_SPEC.md §3: "Celebration + notification ask ->
// The first-ever real save inside the app (Today/CoreRitual save path)."
// Onboarding's old CelebrationStep is deleted outright, not disabled — but
// the ask itself has exactly one caller it has ever had
// (check-daily-nudge.mjs row 2c), so deleting that caller with no successor
// is a removal of the daily-nudge feature, not a onboarding cleanup. This IS
// the successor: the same fuse (`requestPermissionAndEnable`, reached from a
// JSX press prop, never a mount effect — §2's invariant travels with it),
// now hung on the unlock overlay every save already plays, gated to the one
// save that actually satisfies "never ask before the user has something it
// protects": the first one this device has ever made.
const NUDGE_ASK = 'ask';
const NUDGE_BUSY = 'busy';
const NUDGE_GRANTED = 'granted';
const NUDGE_OFF = 'off';

// --- COMPONENT: LockScreen ---
export const LockScreen = ({ onOpen }) => {
  const { width } = useWindowDimensions();

  // Visible demo trigger (Colin, 2026-08-10: wants a real button, not the
  // old hidden 5-tap gesture) — seeds 180 days of realistic demo entries so
  // Wrapped and Recap have something worth showing.
  const handleLoadDemoData = () => {
    EntryStore.seedDemoData(180)
      .then((count) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Demo data loaded', `Filled the last ${count} days with entries.`);
      })
      .catch(() => {
        Alert.alert('Couldn\'t load demo data', 'Something went wrong — try again.');
      });
  };

  return (
    <View style={styles.container}>
      {/* Was a flat 1.5x-screen accent disc at 15-25% opacity, which left a
          hard circular edge visible across the cream. GlowOrb runs the same
          light out to fully transparent, so it reads as light instead of a
          pale yellow shape. */}
      <GlowOrb size={width * 1.6} breathe intensity={0.55} style={{ top: -width * 0.35 }} />

      <View style={styles.content}>
        {/* Sits inside the orb, unlit by anything of its own — the light is
            GlowOrb's job. Gives the gate a face to arrive at instead of
            opening on a wordmark and a question. */}
        <WelcomeBee size={132} />
        <Text style={styles.logo}>Pollinate</Text>
        {/* Was "Pause. / What are you grateful for today?" — the subject-less
            journal question, and it asked something this screen has no field
            for: one tap later InputScreen asks its own rotating
            `dailyPrompt.question` over the actual input, so the gate's
            question was always discarded. A gate aims; the next screen asks.
            "Think of someone" is the aim The Ruling implies — gratitude in
            Pollinate is about a person, and a person is what a Private Hive,
            a seed and the feed all need as input. It claims nothing the app
            can't do: the answer still lands in the same free-text field. */}
        <Text style={styles.prompt}>Pause.{"\n"}Think of someone.</Text>

        {/* Medium, not the default Light: this is the one tap in the app
            that crosses a threshold rather than adjusting something. */}
        <PrimaryButton onPress={onOpen} haptic={Haptics.ImpactFeedbackStyle.Medium}>
          Begin
        </PrimaryButton>

        {/* Lumen's design assessment (thread 37fb8ef6, WP-10a): a dev
            affordance sitting on the ritual gate ships to every tester.
            Colin's 2026-08-10 note ("wants a real button, not the old
            hidden 5-tap gesture") was about discoverability during
            development, not about shipping it past __DEV__. DEMO_CONTENT,
            not raw __DEV__ (Sage's LATENT finding, thread 37fb8ef6): a
            pitch build has __DEV__ false but still wants this button. */}
        {DEMO_CONTENT && (
          <PressableScale onPress={handleLoadDemoData} style={styles.demoDataLink}>
            <Text style={styles.demoDataLinkText}>Load demo data</Text>
          </PressableScale>
        )}
      </View>
    </View>
  );
};

// --- COMPONENT: InputScreen ---
export const InputScreen = ({ onUnlock }) => {
  const [text, setText] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const formAnim = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  // Resolved by the same getFirstEntryDate() read the prompt-seniority
  // effect below already makes: `null` means zero entries exist yet, so
  // THIS save (if it lands) is the first one this device has ever made.
  // Defaults false on the catch path deliberately — under-triggering the
  // ask costs nothing this device will notice; over-triggering it on a
  // returning user's ordinary save would be the real defect.
  const [isFirstEntry, setIsFirstEntry] = useState(false);
  const [awaitingContinue, setAwaitingContinue] = useState(false);
  const [nudge, setNudge] = useState(NUDGE_ASK);

  // The first three days get the belief prompts (FIRST_DAYS_PROMPTS) before
  // the day-of-year rotation takes over, so the argument onboarding used to
  // make across three screens arrives one line a day instead.
  //
  // Resolved async, and the prompt renders only once it resolves, because a
  // prompt that CHANGES under the user is worse than one that arrives a beat
  // late: the seed would have to be the rotation (the only thing knowable
  // synchronously), and a day-1 user would read the wrong question and watch
  // it swap. `null` seniority means "could not tell", which getDailyPrompt
  // answers with the rotation — the exact behaviour every caller had before
  // seniority existed, so a failed read degrades to today's app.
  const [dailyPrompt, setDailyPrompt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    EntryStore.getFirstEntryDate()
      .then((firstISO) => {
        if (cancelled) return;
        setIsFirstEntry(!firstISO);
        let seniority = null;
        if (firstISO) {
          const [y, m, d] = firstISO.split('-').map(Number);
          // Local calendar parts on both sides. `new Date(firstISO)` parses
          // as UTC midnight, which lands on the previous local day in every
          // negative offset — the app stores no timezone data, so calendar
          // days are client-derived and both ends must be derived the same
          // way.
          const first = new Date(y, m - 1, d);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          seniority = Math.round((today - first) / 86400000);
        }
        setDailyPrompt(getDailyPrompt(new Date(), seniority));
      })
      .catch(() => {
        if (!cancelled) setDailyPrompt(getDailyPrompt());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resetAfterFailedSave = () => {
    Alert.alert("Couldn't save", "Your entry didn't save — try again.");
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(formAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setUnlocking(false);
      setAwaitingContinue(false);
    });
  };

  // The ordinary path's own fuse call: bare, JSX-reached (this function IS
  // the onPress body), never a mount effect. Kept separate from
  // handleAskForNudge below only by WHEN it can be reached — the state
  // machine (awaitingContinue) is what stops it firing on every save, not a
  // fresh invariant.
  const handleAskForNudge = async () => {
    setNudge(NUDGE_BUSY);
    let result;
    try {
      result = await requestPermissionAndEnable();
    } catch {
      setNudge(NUDGE_ASK);
      return;
    }
    if (!result.granted) {
      setNudge(NUDGE_OFF);
      return;
    }
    setNudge(NUDGE_GRANTED);
    // At this beat the user has written exactly today and nothing else
    // (it's their first entry, full stop), so that one day-key IS
    // writtenDaysISO — no read needed, same reasoning as the beat this
    // replaces (formerly Onboarding.js's CelebrationStep).
    try {
      const now = new Date();
      await reconcileDailyNudge({
        writtenDaysISO: [toISODateLocal(now)],
        now,
        content: { title: NUDGE_TITLE, body: NUDGE_BODY },
      });
    } catch {
      // App.js's next foreground re-arm covers this.
    }
  };

  // The tap that actually leaves the overlay — "Continue" is never gated on
  // the ask above, in any of its states, same as the beat this replaces.
  const proceed = () => {
    Promise.resolve(onUnlock(text)).catch(resetAfterFailedSave);
  };

  const handleSave = () => {
    if (!text.trim() || unlocking) return;
    // Does not call EntryStore.saveEntry here — during onboarding (Flow C)
    // there is no session yet and the write would throw 'Not signed in'
    // (Sage, thread 19e90cf8: identical shape to Onboarding.js's own
    // pre-auth entry step). onUnlock hands the raw text to the caller,
    // which buffers it and saves once an account exists.
    setUnlocking(true);

    Animated.timing(formAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      // CelebrationBadge + CelebrationRays run their own spring, haptic and
      // burst on mount (spec §4/§11.3) — this used to be a second,
      // hand-rolled 96pt badge drawing a "✓" as a text character while the
      // real component sat unused. Fade the overlay in and let them land.
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // First entry ever, with a ratified ask to show: hold the overlay
        // open on a real tap instead of the ordinary timed auto-advance —
        // this is the one save that has "something to protect" and nowhere
        // else in the app asks before it. Every other day's save (and a
        // first save while the ask copy is still unratified, NUDGE_ASK_READY
        // false) keeps the exact unchanged timed behaviour below.
        if (isFirstEntry && NUDGE_ASK_READY) {
          setAwaitingContinue(true);
          return;
        }
        setTimeout(() => {
          // Bumble caught this (thread 19e90cf8, 2026-08-13): the signed-in
          // caller's onUnlock (App.js) now does a real EntryStore.saveEntry
          // before navigating, so it can reject — a discarded setTimeout
          // return used to mean a failure left the celebration overlay up
          // forever with unlocking stuck true and no way to retry.
          // Promise.resolve wraps the demo-mode caller too (Onboarding.js's
          // LockDemoStep.onSave is synchronous), so this is safe either way.
          Promise.resolve(onUnlock(text)).catch(resetAfterFailedSave);
        }, 1400);
      });
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.backgroundWriting }]}
    >
      {unlocking && (
        <Animated.View
          style={[styles.unlockOverlay, { opacity: overlayOpacity }]}
          pointerEvents={awaitingContinue ? 'auto' : 'none'}
        >
          <View style={styles.badgeStage}>
            <CelebrationRays />
            <CelebrationBadge />
          </View>
          <Text style={styles.unlockingText}>Your day is open. Enjoy it.</Text>
          {awaitingContinue && (
            <>
              {(nudge === NUDGE_ASK || nudge === NUDGE_BUSY) && (
                <PressableScale
                  onPress={handleAskForNudge}
                  disabled={nudge === NUDGE_BUSY}
                  containerStyle={styles.nudgeSlot}
                  style={styles.nudgeChip}
                  accessibilityLabel={NUDGE_ASK_LABEL}
                >
                  <Ionicons name="notifications-outline" size={15} color={theme.colors.ink} />
                  <Text style={styles.nudgeChipText}>{NUDGE_ASK_LABEL}</Text>
                </PressableScale>
              )}
              {/* Both settled states drop the chip's edge and fill on purpose
                  — the ask has been answered, so each is a status now, not a
                  tap target (Onboarding.js's old CelebrationStep, verbatim
                  reasoning). */}
              {nudge === NUDGE_GRANTED && (
                <View style={[styles.nudgeSlot, styles.nudgeSettled]}>
                  <Ionicons name="checkmark" size={15} color={theme.colors.inkSoft} />
                  <Text style={styles.nudgeSettledText}>{NUDGE_GRANTED_LINE}</Text>
                </View>
              )}
              {nudge === NUDGE_OFF && (
                <View style={[styles.nudgeSlot, styles.nudgeSettled]}>
                  <Ionicons name="notifications-off-outline" size={15} color={theme.colors.inkSoft} />
                  <Text style={styles.nudgeSettledText}>{NUDGE_DECLINED_LINE}</Text>
                </View>
              )}
              <PrimaryButton onPress={proceed} style={styles.overlayContinueButton}>
                Continue
              </PrimaryButton>
            </>
          )}
        </Animated.View>
      )}

      <Animated.View style={[styles.content, { opacity: formAnim }]}>
        <Text style={styles.logoSmall}>Pollinate</Text>
        <Text style={styles.promptQuestion}>{dailyPrompt ? dailyPrompt.question : ' '}</Text>

        <SparkChips
          sparks={dailyPrompt ? dailyPrompt.sparks : []}
          visible={!!dailyPrompt && !text.trim()}
          onPick={(spark) => setText(`I am grateful for ${spark}.`)}
        />

        <View style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            placeholder="I am grateful for..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            value={text}
            onChangeText={setText}
            autoFocus
            editable={!unlocking}
            maxLength={10000}
          />
        </View>

        <PrimaryButton onPress={handleSave} disabled={!text.trim() || unlocking}>
          Open my day
        </PrimaryButton>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '85%',
    alignItems: 'center',
    zIndex: 1,
  },
  logo: {
    ...theme.type.logo,
    fontSize: 68,
    color: theme.colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  logoSmall: {
    ...theme.type.logo,
    fontSize: 32,
    color: theme.colors.textPrimary,
    marginBottom: 40,
    textAlign: 'center',
  },
  prompt: {
    ...theme.type.bodyLg,
    fontSize: 24,
    lineHeight: 32,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 50,
  },
  demoDataLink: {
    alignSelf: 'center',
    marginTop: 16,
  },
  demoDataLinkText: {
    ...theme.type.bodySm,
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
  },
  promptQuestion: {
    ...theme.type.h3,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
    // Two lines, reserved. The prompt now resolves async (seniority: the
    // first three days get the belief prompts), so this box is briefly
    // empty and everything below it would jump when the question lands.
    //
    // Two is the right number, measured rather than guessed: all 23
    // questions in the deck, set in the real Nunito_700Bold at 18px, have
    // advance widths from 187 to 516pt. The widest is 1.70x the tightest
    // plausible line box (303pt on a 375pt screen), so every question wraps
    // to at most two lines and none reaches three. 2 x lineHeight 24 = 48.
    minHeight: 48,
  },
  inputCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.large,
    padding: 24,
    marginBottom: 40,
    minHeight: 200,
    ...theme.shadows.card,
  },
  textInput: {
    fontFamily: theme.fonts.body,
    fontSize: 20,
    color: theme.colors.textPrimary,
    textAlignVertical: 'top',
  },
  unlockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.washYellow,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  // CelebrationRays anchors to the center of a 96pt box (its documented
  // pairing), so the badge needs that exact stage to burst around.
  badgeStage: {
    width: 96,
    height: 96,
    marginBottom: 32,
  },
  unlockingText: {
    ...theme.type.h3,
    color: theme.colors.ink,
    textAlign: 'center',
  },
  // Ported from Onboarding.js's old CelebrationStep, unchanged: this overlay
  // sits on the same washYellow (theme.colors.unlockOverlay's backgroundColor
  // above), so the same measured pair applies — accentDeep fails 4.5:1 here,
  // ink/inkSoft are the legal pair.
  nudgeSlot: {
    alignSelf: 'center',
    marginTop: 22,
  },
  nudgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  nudgeChipText: {
    ...theme.type.bodySm,
    color: theme.colors.ink,
  },
  nudgeSettled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 11,
  },
  nudgeSettledText: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
  },
  overlayContinueButton: {
    marginTop: 24,
  },
});
