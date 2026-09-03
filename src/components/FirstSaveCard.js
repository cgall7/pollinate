import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { DURATIONS, useReducedMotionState } from '../constants/motion';
import { PressableScale } from './PressableScale';
import { CelebrationBadge } from './CelebrationBadge';
import { CelebrationRays } from './CelebrationRays';
import {
  NUDGE_ASK_LABEL,
  NUDGE_ASK_READY,
  NUDGE_BODY,
  NUDGE_DECLINED_LINE,
  NUDGE_GRANTED_LINE,
  NUDGE_TITLE,
} from '../constants/nudgeCopy';
import { reconcileDailyNudge, requestPermissionAndEnable, toISODateLocal } from '../services/dailyNudge';

// Deezine's post-auth nudge ruling (`6f9e87ad`, 2026-09-03), and it is a
// RELOCATION of a beat, not a new one: the Celebration step this replaces
// lived inside the pre-auth onboarding walker that the Account Gate rewrite
// deleted. Sage's Decision 2 (`1f11e4b4`) was that the nudge "must not
// recreate legacy pre-auth onboarding"; the ruling's answer is Today,
// immediately beneath the entry that was just persisted.
//
// The order is the ruling's, and the order is the protection: celebration
// mark -> "That's one." -> body all land before the ask exists, so the ask
// reads as the payoff of a line just read rather than as an interruption.
//
// AFFIRMATIVE-ONLY, inherited unchanged from the beat this replaces. There is
// no "No thanks" — the in-app decline is walking past it, and on Today that
// costs nothing at all: the card blocks nothing, the saved entry stays
// visible above it, and every other control on the screen stays live. The
// close button is a dismissal of the CARD, not an answer to the ASK: it
// records no nudge choice, requests no permission, and leaves the Account
// screen's re-ask open.
const NUDGE_ASK = 'ask';
const NUDGE_BUSY = 'busy';
const NUDGE_GRANTED = 'granted';
const NUDGE_OFF = 'off';

export const FirstSaveCard = ({ onDismiss }) => {
  const [nudge, setNudge] = useState(NUDGE_ASK);
  const { reduced, resolved } = useReducedMotionState();
  const reveal = useRef(new Animated.Value(0)).current;

  // §14.1 Rule 4 — the reveal is opacity in BOTH branches, and the reduced
  // branch differs only in duration. The ruling asks for "an immediate or
  // short opacity reveal" under Reduce Motion; the ray/stagger motion it
  // rules out is owned by `CelebrationRays`/`CelebrationBadge`, which read
  // the same preference themselves and collapse their own animations.
  //
  // `resolved` gates the start for the reason `GlowOrb` does the same: the
  // preference arrives asynchronously, and starting before it resolves plays
  // the un-reduced timing to a user who asked for the other one.
  useEffect(() => {
    if (!resolved) return;
    Animated.timing(reveal, {
      toValue: 1,
      duration: reduced ? DURATIONS.reducedMotionFade : DURATIONS.revealGlide,
      useNativeDriver: true,
    }).start();
  }, [reduced, resolved, reveal]);

  // THE FUSE, carried over verbatim in behaviour from the retired
  // Celebration beat: this is the only caller of `requestPermissionAndEnable`
  // in the app, it is reached from a press prop and from nowhere else — not a
  // mount effect, not module scope — so the OS dialog cannot fire before an
  // in-app yes. `scripts/check-daily-nudge.mjs` row 2c walks from the call
  // site out to the prop rather than finding the name, so the assertion
  // travels with the code to this file.
  const handleAskForNudge = async () => {
    setNudge(NUDGE_BUSY);
    let result;
    try {
      result = await requestPermissionAndEnable();
    } catch {
      // A throw is not an OS decline. Nothing was granted and nothing was
      // armed, so the label still describes exactly what the control would
      // do — returning it to the ask is the honest state.
      setNudge(NUDGE_ASK);
      return;
    }
    if (!result.granted) {
      // An OS decline is terminal. The control settles into a resting state
      // rather than vanishing (Lumen, `36f84721`): the user tapped yes, an
      // in-app act of trust, and the OS said no — a control that disappears
      // out from under that tap swallows the only feedback the sequence
      // gets.
      setNudge(NUDGE_OFF);
      return;
    }
    setNudge(NUDGE_GRANTED);

    // ARM THE PROMISE HERE rather than leaning on App.js's `rearmDailyNudge`.
    // The retired beat gave two reasons; ONE OF THEM DIED WITH THE MOVE and
    // saying so is the point of re-stating them:
    //
    //   1. STILL TRUE — `requestPermissionAndEnable` sets the enabled flag
    //      and returns; it never reconciles (`disable()` does, an asymmetry
    //      in the module). App.js's foreground reconcile already ran at
    //      launch, before that flag existed, and the next background->active
    //      transition may not arrive before tomorrow evening. A user who taps
    //      yes and pockets the phone would get no nudge on night one.
    //
    //   2. NO LONGER TRUE, and it is not load-bearing anyway — the old beat
    //      also could not call the App.js path because `EntryStore`'s
    //      `requireUserId` throws "Not signed in" and there was no session
    //      two beats before the account step. On Today there IS a session.
    //      Reason 1 alone still decides it.
    //
    // The single-day-key shortcut also survives the move, and for the same
    // reason it was true before: this card renders only when
    // `getFirstEntryDate()` says today is the account's FIRST entry, so that
    // one day-key IS `writtenDaysISO`. `buildWindow` drops today and
    // schedules from tomorrow — which is what the label promised.
    try {
      const now = new Date();
      await reconcileDailyNudge({
        writtenDaysISO: [toISODateLocal(now)],
        now,
        content: { title: NUDGE_TITLE, body: NUDGE_BODY },
      });
    } catch {
      // Permission is granted and the flag is set, so App.js's next
      // foreground re-arm covers this. The settled line stays honest.
    }
  };

  return (
    <Animated.View style={[styles.card, { opacity: reveal }]}>
      {/* Walk-past, and it is the FIRST child so screen-reader order can put
          the exit before the content it exits — the ruling's "screen-reader
          order follows visual order" is about the card's own reading order,
          and a top-right close is read first in both. 44pt is the hit box,
          not the glyph. */}
      <PressableScale
        onPress={onDismiss}
        containerStyle={styles.closeSlot}
        style={styles.close}
        haptic={null}
        accessibilityRole="button"
        accessibilityLabel="Dismiss reminder invitation"
      >
        <Ionicons name="close" size={18} color={theme.colors.inkSoft} />
      </PressableScale>

      <View style={styles.badgeStage}>
        <CelebrationRays />
        <CelebrationBadge />
      </View>
      <Text style={styles.title}>That's one.</Text>
      <Text style={styles.body}>
        Tomorrow it's two. Do that for a while and you'll have a record of everything you were given.
      </Text>

      {NUDGE_ASK_READY && (nudge === NUDGE_ASK || nudge === NUDGE_BUSY) && (
        <PressableScale
          onPress={handleAskForNudge}
          disabled={nudge === NUDGE_BUSY}
          containerStyle={styles.nudgeSlot}
          style={styles.nudgeChip}
          accessibilityRole="button"
          accessibilityLabel={NUDGE_ASK_LABEL}
          accessibilityState={{ busy: nudge === NUDGE_BUSY, disabled: nudge === NUDGE_BUSY }}
        >
          <Ionicons name="notifications-outline" size={15} color={theme.colors.ink} />
          <Text style={styles.nudgeChipText}>{NUDGE_ASK_LABEL}</Text>
        </PressableScale>
      )}
      {/* Both settled states drop the chip's edge and fill on purpose: the
          ask has been answered, so each is a status now, not a tap target.
          They occupy the ask's own slot so the card's height never jumps
          under the answer. `accessibilityLiveRegion` is what makes the
          ruling's "settled feedback is announced" true rather than merely
          rendered — the chip is gone by then, so focus has nothing to
          follow. */}
      {nudge === NUDGE_GRANTED && (
        <View style={[styles.nudgeSlot, styles.nudgeSettled]} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark" size={15} color={theme.colors.inkSoft} />
          <Text style={styles.nudgeSettledText}>{NUDGE_GRANTED_LINE}</Text>
        </View>
      )}
      {nudge === NUDGE_OFF && (
        <View style={[styles.nudgeSlot, styles.nudgeSettled]} accessibilityLiveRegion="polite">
          <Ionicons name="notifications-off-outline" size={15} color={theme.colors.inkSoft} />
          <Text style={styles.nudgeSettledText}>{NUDGE_DECLINED_LINE}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  // 44pt is the HIT BOX, not the glyph — the ruling's minimum. The slot is
  // absolutely positioned so it cannot push the celebration mark off centre,
  // and it is inset rather than flush so the corner radius does not clip it.
  closeSlot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 44,
    height: 44,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Two-thirds of the retired beat's 96pt stage: this is an INLINE card under
  // a rendered entry, not a full-screen beat, and the ruling's word is
  // "compact". `CelebrationRays`/`CelebrationBadge` size themselves, so this
  // only bounds the stage they share.
  badgeStage: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    ...theme.type.h2,
    color: theme.colors.ink,
    textAlign: 'center',
  },
  body: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  // The chip's own metrics are the retired beat's, unchanged
  // (fec5a0b:src/screens/Onboarding.js:1280-1308) — this is a relocation, and
  // the ask should not quietly become a different control on the way.
  nudgeSlot: {
    alignSelf: 'center',
    marginTop: 18,
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
});
