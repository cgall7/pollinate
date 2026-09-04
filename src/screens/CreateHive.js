import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { HiveStore } from '../services/HiveStore';
import { tagEntry } from '../utils/themeTagger';
import { HIVE_COVER_THEMES } from '../constants/hiveThemes';
import { PrimaryButton } from '../components/PrimaryButton';
import { PressableScale } from '../components/PressableScale';
import { GradientCard } from '../components/GradientCard';
import { BackButton } from '../components/BackButton';
import { SPRINGS } from '../constants/motion';

// E6 — the checkmark used to pop in with no transition, simultaneous with
// the E5 border-width jump. Border width is now constant (see
// `themeCard`/`themeCardSelected`), so this is the only motion on select,
// and it gets to be the whole event: a spring pop, not a hard cut.
const SelectedCheck = () => {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, ...SPRINGS.pop }).start();
  }, [scale]);
  return (
    <Animated.View style={[styles.themeCheck, { transform: [{ scale }] }]}>
      <Ionicons name="checkmark-circle" size={22} color={theme.colors.ink} />
    </Animated.View>
  );
};

// 8b.2 — Create Private Hive flow, one root-stack screen with three internal
// beats (Design Language §2), the same shape Onboarding.js already uses for
// a multi-step flow. Not a nested navigator: scripts/check-nav-depth.mjs
// asserts exactly two navigators exist app-wide, so a `createStackNavigator`
// here would be a third and silently break every getParent() call below it.
//
// R-CH-2 (Lumen, 2026-09-04) CUT THE FOURTH BEAT. The cadence step asked how
// often to review this hive and nothing anywhere read the answer:
// `HiveStore` persisted it and mapped it back, and no renderer or scheduler
// ever looked. Its copy described the review ritual of the retired
// review-then-seal arc. A question with no consequence is its own kind of
// false claim, because it tells the person their answer matters. The column
// keeps filling from the store's own `DEFAULT_REVIEW_CADENCE`, so no schema
// moved and the validator survives for a future caller that means it.
const STEPS = ['who', 'cover', 'entry'];

// GUIDES/POLLINATE_MULTIWRITER_COPY_VOCAB.md §4.1 (C2) — the choice sits on
// the same beat as the subject's name ("Choice framing (CreateHive, after
// subject)"), not a step of its own, and it defaults to `false`: a solo hive
// is the unmarked path, and `is_collective` is immutable in both directions
// the instant the row exists (20260827000001's trigger), so there is no
// "decide later" — the default has to be the one that never regrets being
// silently chosen.
const WRITER_OPTIONS = [
  { value: false, label: 'Just me' },
  { value: true, label: 'Me and others' },
];

export const CreateHiveFlow = ({ navigation }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [subjectName, setSubjectName] = useState('');
  const [isCollective, setIsCollective] = useState(false);
  const [coverTheme, setCoverTheme] = useState(HIVE_COVER_THEMES[0].id);
  const [entryText, setEntryText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const step = STEPS[stepIndex];
  // E13 — leaving step 0 exits the flow entirely and every other state
  // (subjectName, entryText) resets with it. Stepping back within the flow
  // (stepIndex > 0) never loses anything, since this component's state
  // persists across steps, so only the exit itself needs a guard.
  const goBack = () => {
    if (stepIndex === 0) {
      if (subjectName.trim()) {
        Alert.alert('Discard this hive?', "You'll lose what you've entered so far.", [
          { text: 'Keep editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]);
        return;
      }
      navigation.goBack();
      return;
    }
    setStepIndex((i) => i - 1);
  };
  const goNext = () => setStepIndex((i) => i + 1);

  // R-CH-4: one CTA, so `finish` no longer takes a "keep the entry" flag.
  // The flag existed to serve a second button whose whole difference from the
  // first was throwing the typed text away, and its false arm is now
  // unreachable. An empty box is the only way to create a hive with no entry,
  // which is what the step's title has always promised.
  const finish = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      const hive = await HiveStore.createHive(subjectName, { coverTheme, isCollective });
      const body = entryText.trim();
      if (body) {
        await HiveStore.addHiveEntry(hive.id, new Date(), body, tagEntry(body));
      }
      // E12 — land inside the hive you just made, not on Today. Deezine is
      // scoring the arrival ceremony separately; this is just the
      // navigation it will land on top of.
      //
      // §4.1 — "You can invite more writers anytime," so this is an offer,
      // not a gate: a together-hive detours through InviteContributor first
      // (Skip for now lands on HiveDetail exactly the same as a solo hive
      // does), a solo hive goes straight there unchanged.
      if (hive.isCollective) {
        navigation.navigate('InviteContributor', { hiveId: hive.id, subjectName: subjectName.trim() });
      } else {
        navigation.navigate('HiveDetail', { hiveId: hive.id });
      }
    } catch (err) {
      console.warn('CreateHiveFlow: failed to create hive', err);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <BackButton onPress={goBack} />
      </View>

      {/* E9 — no way to see how much of this you've committed to. Dots, not
          a bar: the flow is a short fixed count of beats, not a continuous
          fraction. The row is driven by `STEPS`, so R-CH-2's cut took a dot
          with it rather than leaving a fourth one pointing at nothing. */}
      <View style={styles.progressRow} accessible={false} importantForAccessibility="no-hide-descendants">
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]} />
        ))}
      </View>

      {step === 'who' && (
        <View style={styles.content}>
          <Text style={styles.title}>Who are you creating this hive for?</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Their name"
            placeholderTextColor={theme.colors.inkFaint}
            value={subjectName}
            onChangeText={setSubjectName}
            autoFocus
            maxLength={100}
          />
          {/* R-CH-1 — the sentence here used to promise the person could
              choose to deliver this hive by hand later, which named a
              mechanism R-SEAL-1 retired: a hive born on this screen can never
              be sent, so the line stated something false about what the
              person was making. The
              replacement's second sentence is the privacy invariant that
              survives BOTH arms of the choice below it (solo: you are the
              writers; together: you plus whoever you invite), and it is
              mechanism-true at this commit under contributors-only RLS with
              no send path. */}
          <Text style={styles.helpText}>
            A private place to keep what you write about them. Only its writers can ever see it.
          </Text>

          {/* §4.1's choice: "Who's writing?" — an exclusive-choice radio row
              rather than a Switch, per this screen's own reuse convention
              below. The row's styles were named for the cadence step that
              introduced them; R-CH-2 deleted that step and this is now their
              only caller, so they are named for what they do. */}
          <Text style={styles.sectionLabel}>Who's writing?</Text>
          {WRITER_OPTIONS.map((option) => {
            const selected = option.value === isCollective;
            return (
              <PressableScale
                key={option.label}
                onPress={() => setIsCollective(option.value)}
                style={[styles.choiceCard, selected && styles.choiceCardSelected]}
                accessibilityLabel={`${option.label}${selected ? ', selected' : ''}`}
                accessibilityState={{ selected }}
              >
                <View style={[styles.radio, selected && styles.radioSelected]} />
                <View style={styles.choiceText}>
                  <Text style={styles.choiceTitle}>{option.label}</Text>
                </View>
              </PressableScale>
            );
          })}
          {/* C2 — permanent both directions, so this line sits under the
              choice regardless of which option is selected (Lumen's ruling:
              "the risk direction is solo-then-regret," so the solo side
              carries the same warning as the together side, not a lesser
              one). */}
          <Text style={styles.helpText}>This can't be changed later.</Text>
        </View>
      )}

      {step === 'cover' && (
        <View style={styles.content}>
          <Text style={styles.title}>Pick a cover that feels right for {subjectName.trim()}.</Text>
          <View style={styles.themeGrid}>
            {HIVE_COVER_THEMES.map((themeOption) => {
              const selected = themeOption.id === coverTheme;
              return (
                <PressableScale
                  key={themeOption.id}
                  onPress={() => setCoverTheme(themeOption.id)}
                  style={[styles.themeCard, selected && styles.themeCardSelected]}
                  containerStyle={styles.themeCardContainer}
                  accessibilityLabel={`${themeOption.label} cover${selected ? ', selected' : ''}`}
                >
                  {/* E2/E3 — the cover never touches the page. It's an inset
                      fill inside this `surface` mat (the mat is what
                      `themeCard`'s own background renders), so separation is
                      always cover-vs-white regardless of which ground the
                      picker sits on, or which cover gets added next. The
                      hairline rim + sheen are the material; the mat is the
                      frame. */}
                  <GradientCard
                    style={styles.themeMaterial}
                    contentStyle={[styles.themeFill, { backgroundColor: themeOption.base }]}
                    innerStyle={styles.themeFillInner}
                    colors={theme.gradients.sheen}
                  >
                    {selected && <SelectedCheck />}
                    <Text style={[styles.themeLabel, { color: themeOption.textColor }]}>
                      {themeOption.label}
                    </Text>
                  </GradientCard>
                </PressableScale>
              );
            })}
          </View>
        </View>
      )}

      {step === 'entry' && (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Add an entry now, or start later.</Text>
          <TextInput
            style={styles.textArea}
            placeholder={`What's something you're grateful for about ${subjectName.trim()}?`}
            placeholderTextColor={theme.colors.inkFaint}
            value={entryText}
            onChangeText={setEntryText}
            multiline
            maxLength={10000}
          />
        </ScrollView>
      )}

      {/* E10 — this footer sits outside every step's content container
          (a plain View for the first two steps, a ScrollView for
          'entry'), so it's the one CTA anchor point that's never asked to
          pin itself inside a ScrollView, where `marginTop: 'auto'` is a
          no-op. Every step renders through this same footer instead of
          carrying its own pinned button. */}
      <View style={styles.footer}>
        {step === 'entry' && saveError && (
          <Text style={styles.errorText}>Couldn't save the hive. Check your connection and try again.</Text>
        )}
        {step === 'who' && (
          <PrimaryButton onPress={goNext} disabled={!subjectName.trim()}>
            Next
          </PrimaryButton>
        )}
        {step === 'cover' && <PrimaryButton onPress={goNext}>Next</PrimaryButton>}
        {/* R-CH-4 — one CTA, in the fused name-first register the comb flow
            already ships ("Join as {name}", "Create the comb as {name}").
            Two label defects died here. The cadence step's button said
            "Create Hive" and only advanced, so it named an act performed
            later; and this step shipped two buttons that BOTH created the
            hive, differing only in whether the typed text survived, so
            "Skip for Now" was a label wearing a deferral's name. A CTA names
            the act performed at press.
            The possessive is a plain `'s` on every name, including names
            ending in s: one rule the reader can see is right beats a
            grammar switch that is wrong for Ines and James in opposite
            directions. Long names ride PrimaryButton's own text wrapping,
            the same exposure the shipped comb CTAs already carry. */}
        {step === 'entry' && (
          <PrimaryButton onPress={finish} loading={saving}>
            {`Create ${subjectName.trim()}'s hive`}
          </PrimaryButton>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // E8 — one ground for all three steps. `washYellow` is `theme.js`'s own
    // "activation staging included" wash; a creation flow is exactly that.
    // The old per-step swap, which painted `background` on every step after
    // the first, was too small a shift to read as intent and just large
    // enough to read as a glitch.
    backgroundColor: theme.colors.washYellow,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceBorderStrong,
  },
  progressDotActive: {
    backgroundColor: theme.colors.ink,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    ...theme.type.h1,
    color: theme.colors.ink,
    marginTop: 12,
    marginBottom: 20,
  },
  // R-CH-3 (the R-RF-3 fold) — one input register per product. The ruled box
  // ships at CombInvite.js's `input`: `surface` background, 1pt
  // `surfaceBorderStrong`, radius 14. These two boxed themselves differently,
  // on the weak border token and at `medium` (24). The register is THE BOX,
  // not the type scale, so everything role-specific stays: the name input
  // keeps `h2` because it is the hero answer of the screen, the entry area
  // keeps `body`, its `minHeight` and its top alignment, and both keep
  // `padding: 20`. `small` is written as the token and never as its value.
  textInput: {
    ...theme.type.h2,
    color: theme.colors.ink,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.small,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorderStrong,
  },
  helpText: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    marginTop: 16,
  },
  sectionLabel: {
    ...theme.type.label,
    color: theme.colors.inkSoft,
    marginTop: 28,
    marginBottom: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  // Layout-positioning keys (width, margin) belong on PressableScale's
  // `containerStyle`, not `style` — `style` only ever reaches the inner
  // transform layer, one node too deep to participate in `themeGrid`'s
  // flex-wrap row at all (PressableScale.js's own R43 note). Landing them
  // on `style` instead left the real flex item (the outer Pressable)
  // sized by shrink-to-content while its child asked for '48%' of that
  // same shrinking box — circular, and it silently resolved to the
  // swatch's own content width instead of the grid math below.
  themeCardContainer: {
    // 48 + 48 = 96% < 100%: two per row can never overflow regardless of
    // container width, because the slack is distributed by
    // `justifyContent` instead of added by a `gap` on top of a fitted
    // percentage (E4 — the three-across grid silently reflowed to two on
    // narrower devices and always rendered an orphan 4th card either way).
    width: '48%',
    marginBottom: 12,
  },
  themeCard: {
    aspectRatio: 1,
    borderRadius: theme.borderRadius.medium,
    // E2/E3 — this is the mat, not the cover. `surface` white is the frame
    // every cover material insets into, so cover-vs-ground separation is
    // always cover-vs-white and never depends on which page ground a cover
    // happens to share a value with.
    backgroundColor: theme.colors.surface,
    padding: 6,
    ...theme.shadows.card,
    // E5 — border width is constant at 3 whether selected or not, so
    // selecting a card never shifts its contents. Unselected sits at
    // transparent; the visible rim is a colour change, not a layout change.
    borderWidth: 3,
    borderColor: 'transparent',
  },
  themeCardSelected: {
    // E7 — §4's law is "yellow never fills it"; a border is a fill of the
    // edge. `ink` also reads at higher contrast against these near-white
    // covers than `accent` ever did.
    borderColor: theme.colors.ink,
  },
  themeMaterial: {
    flex: 1,
  },
  themeFill: {
    flex: 1,
    borderRadius: theme.borderRadius.medium - 6,
    // The hairline rim Lumen's ruling calls for on every cover surface —
    // separation is guaranteed by the rim regardless of the base value,
    // rather than depending on anyone re-checking ΔE00 by eye forever.
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorderStrong,
  },
  themeFillInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 10,
  },
  themeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  themeLabel: {
    ...theme.type.bodySm,
    textAlign: 'center',
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  choiceCardSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.washYellow,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.surfaceBorderStrong,
    marginRight: 14,
  },
  radioSelected: {
    borderColor: theme.colors.ink,
    backgroundColor: theme.colors.ink,
  },
  choiceText: {
    flexShrink: 1,
  },
  choiceTitle: {
    ...theme.type.h3,
    color: theme.colors.ink,
  },
  textArea: {
    ...theme.type.body,
    color: theme.colors.ink,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.small,
    padding: 20,
    minHeight: 160,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorderStrong,
    textAlignVertical: 'top',
  },
  errorText: {
    ...theme.type.bodySm,
    color: theme.colors.danger,
    marginTop: 12,
  },
});
