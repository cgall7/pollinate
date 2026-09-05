import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { theme } from '../constants/theme';
import { getDailyPrompt } from '../constants/prompts';
import { EntryStore } from '../services/EntryStore';
import { PrimaryButton } from '../components/PrimaryButton';
import { CelebrationBadge } from '../components/CelebrationBadge';
import { CelebrationRays } from '../components/CelebrationRays';
import { SparkChips } from '../components/SparkChips';
import { PaperPicker } from '../components/PaperPicker';

// R-OD (Lumen, POLLINATE_OPENDAY_NECTAR_RECUT_SPEC.md Part 1): the Lock
// interstitial that used to stand in front of this screen is gone. It was a
// fossil of the standalone-journal era, when the app conceptually locked
// until you wrote; nothing locks anymore, because the app opens on Today
// (Zero Onboarding, I10). Today's blank card already carries the intent, so
// the gate asked the user to Begin something they had already begun. This
// file now holds one screen, and Today routes straight into it.
//
// --- COMPONENT: InputScreen ---
export const InputScreen = ({ onUnlock }) => {
  const [text, setText] = useState('');
  const [paper, setPaper] = useState(null);
  const [unlocking, setUnlocking] = useState(false);
  const formAnim = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

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
        setTimeout(() => {
          // Bumble caught this (thread 19e90cf8, 2026-08-13): the signed-in
          // caller's onUnlock (App.js) now does a real EntryStore.saveEntry
          // before navigating, so it can reject — a discarded setTimeout
          // return used to mean a failure left the celebration overlay up
          // forever with unlocking stuck true and no way to retry.
          // Promise.resolve is kept for a caller that hands back a plain
          // value rather than a promise. It was written for Onboarding's
          // LockDemoStep, which no longer exists; the wrapper stays because
          // the contract it defends (onUnlock may be sync) still holds for
          // any future caller, and it costs one tick.
          Promise.resolve(onUnlock(text, paper)).catch(() => {
            Alert.alert("Couldn't save", "Your entry didn't save — try again.");
            Animated.parallel([
              Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(formAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start(() => setUnlocking(false));
          });
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
          pointerEvents="none"
        >
          <View style={styles.badgeStage}>
            <CelebrationRays />
            <CelebrationBadge />
          </View>
          <Text style={styles.unlockingText}>It's on today's page.</Text>
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

        <View style={styles.paperPickerWrap}>
          <PaperPicker paper={paper} onChange={setPaper} />
        </View>

        {/* R-OD-2. "Open my day" claimed the vanished gate's metaphor; "Keep
            this" is the keepsake register the rest of the product already
            speaks, and it claims exactly what the press does. The announced
            label names the object the visible label leaves to context. */}
        <PrimaryButton
          onPress={handleSave}
          disabled={!text.trim() || unlocking}
          accessibilityLabel="Keep this entry"
        >
          Keep this
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
  logoSmall: {
    ...theme.type.logo,
    fontSize: 32,
    color: theme.colors.textPrimary,
    marginBottom: 40,
    textAlign: 'center',
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
    marginBottom: 24,
    minHeight: 200,
    ...theme.shadows.card,
  },
  paperPickerWrap: {
    marginBottom: 24,
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
});
