import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { HiveStore } from '../services/HiveStore';
import { NectarStore } from '../services/NectarStore';
import { hasNectarConsent } from '../constants/nectar';
import { randomUUID } from '../utils/uuid';
import { hiveCoverTheme } from '../constants/hiveThemes';
import { PressableScale } from '../components/PressableScale';
import { PrimaryButton } from '../components/PrimaryButton';
import { NectarConsentSheet } from '../components/NectarConsentSheet';
import { NectarSendPanel, isSendableAmount } from '../components/NectarSendPanel';
import { PaperBlock, paperInk } from '../components/PaperBlock';
import { SPRINGS, useReducedMotion } from '../constants/motion';
import {
  STUB_GRAMMAR,
  buildRevealSequence,
  startReveal,
  tapReveal,
  dwellProgress,
  arrivalMs,
} from '../components/revealSequencer';

// 8b.6 Recipient opens package — `docs/strategy/Pollinate_Delivery_Slices.md`
// §8b.6, the reveal engine's SECOND mount point (`revealSequencer.js`'s own
// header names both by number). Same engine, same rulings 1-4 and 6 as
// MemoryLane.js (8b.4) — ruling 5 says the two differ only in what feeds the
// sequence and what the ending is, never in a `mode` the engine would carry.
//
// What feeds the sequence here: `HiveStore.getReceivedPackage`, the
// subject-scoped read Sage's 8b.5 spec ships (`private_hives.sent_at` +
// `private_hives_select_as_subject` + `entries_select_as_hive_subject`).
// NOT YET CALLABLE — see that method's header. This screen was built and
// hand-tested in the simulator against a local fixture array shaped like
// `getReceivedPackage`'s return value (same trick 8b.4 used); the fixture
// wiring is not in this diff, only the real call is, so this screen goes
// live automatically the moment 8b.5 merges and needs no rewrite here.
//
// What the ending is: NOT "return to hive" (there is no hive to return to —
// the recipient never owned one) and NOT react/reply. The Delivery Slices
// row for 8b.6 asks for both, but neither has an addressing surface today —
// `likes`/`comments` (20260808000001) key off `shares.id`, and a private
// hive entry is deliberately never a share (the mirror guard 8b.5 adds is
// the other direction of that same rule). Building react/reply now would
// mean inventing a schema decision this PR was not asked to make, so the
// ending is a plain close for this pass — flagged to Sage/Colin as an open
// item rather than shipped as UI with nothing behind it.
export const PackageOpenScreen = ({ navigation, route }) => {
  const { hiveId } = route.params;
  const reduced = useReducedMotion();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pkg, setPkg] = useState(null);
  const [sequence, setSequence] = useState(null);
  const [revealState, setRevealState] = useState(null);
  const [railFill, setRailFill] = useState(0);

  // DES-28 D3 — the consent bootstrap door (Sage's ruling 2026-08-26).
  // `nectarConsent` must be initialised from `hasNectarConsent(…)` and
  // `nectarConsentSheetOpen` from a `useState(false)` — check-nectar-
  // consent.mjs's B7 census reads the initialiser, not just the name.
  const [nectarConsentRow, setNectarConsentRow] = useState(null);
  const [nectarConsentSheetOpen, setNectarConsentSheetOpen] = useState(false);
  const [nectarConsentSubmitting, setNectarConsentSubmitting] = useState(false);
  const [nectarConsentError, setNectarConsentError] = useState(false);
  const nectarConsent = hasNectarConsent(nectarConsentRow);

  // ENG-63/ENG-64 — the send surfaces. ONE set of controls, two targets:
  // the per-entry affordance sends to the entry, the ending slot sends to
  // the hive. Only the entry one needs an open/closed bit; the ending
  // panel is the ending.
  const [entrySendOpen, setEntrySendOpen] = useState(false);
  const [sendAmount, setSendAmount] = useState(null);
  const [sendCustom, setSendCustom] = useState('');
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [balanceDrops, setBalanceDrops] = useState(null);
  // The idempotency handle is minted when the ATTEMPT starts, not when the
  // request is issued, so a retry after a lost response replays the same
  // zap instead of recording a second one (utils/uuid's header).
  const attemptId = useRef(null);

  const bloomOpacity = useRef(new Animated.Value(0)).current;
  const bloomScale = useRef(new Animated.Value(0.85)).current;
  const dateOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const received = await HiveStore.getReceivedPackage(hiveId);
          if (cancelled) return;
          if (!received) {
            setError(true);
            return;
          }
          const seq = buildRevealSequence(received.entries);
          const now = Date.now();
          setPkg(received);
          setSequence(seq);
          setRevealState(seq.length > 0 ? startReveal(now) : { index: 0, arrivedAtMs: now, done: true });
          setError(false);
        } catch (err) {
          if (cancelled) return;
          console.warn('PackageOpenScreen: failed to load package', err);
          setError(true);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [hiveId])
  );

  // One read, on mount — `nectarConsent` only ever flips false→true within a
  // session (no revocation path, nectar.js's table comment), so a re-check
  // on every focus would be a round trip for an answer that cannot change
  // back.
  useEffect(() => {
    let cancelled = false;
    NectarStore.getConsent()
      .then((row) => {
        if (!cancelled) setNectarConsentRow(row);
      })
      .catch((err) => {
        if (!cancelled) console.warn('PackageOpenScreen: failed to load nectar consent', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ENG-65's producer half, and it is the ONE read here that cannot be
  // authorised by a rendered guard: it must run BEFORE any nectar surface
  // renders, so there is no guarded ancestor for it to sit under. The guard
  // it does have is the effect's own — `nectarConsent` in the dependency
  // list and a negated early return — which is the shape rule E3 recognises
  // (see check-nectar-consent.mjs).
  useEffect(() => {
    if (!nectarConsent) return undefined;
    let cancelled = false;
    NectarStore.getBalanceDrops()
      .then((drops) => {
        if (!cancelled) setBalanceDrops(drops);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('PackageOpenScreen: failed to load nectar balance', err);
        // Stays null — NectarStore's contract makes null UNKNOWN and 0 a
        // read empty wallet, and the panel says the two differently.
        setBalanceDrops(null);
      });
    return () => {
      cancelled = true;
    };
  }, [nectarConsent]);

  const handleNectarAffirm = async () => {
    setNectarConsentSubmitting(true);
    setNectarConsentError(false);
    try {
      const row = await NectarStore.consentToNectar();
      setNectarConsentRow(row);
      setNectarConsentSheetOpen(false);
    } catch (err) {
      console.warn('PackageOpenScreen: consent_to_nectar failed', err);
      setNectarConsentError(true);
    } finally {
      setNectarConsentSubmitting(false);
    }
  };

  // ENG-63/64. The amount is resolved HERE and not at the call site,
  // because there are two ways to say it (a preset chip, the custom field)
  // and exactly one of them may be in force — a custom entry supersedes a
  // previously tapped chip, which is Deezine's own state machine
  // ("Deselection: tap a different preset or custom input clears the
  // previous selection").
  const resolveSendAmount = () => {
    const typed = sendCustom.trim();
    if (typed.length > 0) return Number(typed);
    return sendAmount;
  };

  // THE TARGET IS DERIVED, NOT STORED, and that is the fix to my own first
  // cut. Held in state it had to be re-set by an effect every time a panel
  // appeared and cleared on every success, and a cleared target with a
  // still-mounted ending panel is a Send button wired to nothing. Derived,
  // it is total by construction: the entry overlay is open, or it is not
  // and the surface on screen is the ending, whose subject is the package.
  // The two values are exactly `record_zap`'s `p_target_kind` domain.
  const sendTarget =
    entrySendOpen && step ? { kind: 'entry', id: step.id } : { kind: 'hive', id: hiveId };

  const beginAttempt = () => {
    // ONE ATTEMPT, ONE HANDLE — minted when the user starts composing a
    // gift, not per request, so a Send tapped twice after a timeout replays
    // ONE zap rather than recording two (utils/uuid's header).
    attemptId.current = randomUUID();
    setSendAmount(null);
    setSendCustom('');
    setSendFailed(false);
  };

  const handleOpenEntrySend = () => {
    beginAttempt();
    setEntrySendOpen(true);
  };

  const closeSendPanel = () => {
    if (sending) return;
    setEntrySendOpen(false);
    setSendFailed(false);
  };

  const handleCloseFromEnding = () => {
    if (sending) return;
    navigation.goBack();
  };

  // Selecting either way clears the other, so `resolveSendAmount` is never
  // choosing between two live answers.
  const handleSelectPreset = (amount) => {
    setSendCustom('');
    setSendAmount(amount);
  };

  const handleChangeCustom = (text) => {
    setSendAmount(null);
    setSendCustom(text);
  };

  const handleSend = async () => {
    const amount = resolveSendAmount();
    if (!sendTarget.id || sending || !isSendableAmount(amount, balanceDrops)) return;
    setSending(true);
    setSendFailed(false);
    try {
      await NectarStore.recordZap({
        zapId: attemptId.current,
        targetKind: sendTarget.kind,
        targetId: sendTarget.id,
        amountDrops: amount,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // THE SENDER'S CONFIRMATION IS HERE, AND IT HAS TO BE. Deezine's spec
      // ends the flow with "entry shows new honeyed mark" — but the honeyed
      // cell is OWN-CELL-ONLY by construction (HoneycombGrid:199,
      // `member.isOwn && member.honeyRung`, DES-24 §6.2's isOwn gate), so
      // the mark that appears is on the RECIPIENT's cell in the RECIPIENT's
      // app and the sender never sees it. The only honeyed cell a sender
      // can see is their own, and after a zap it goes DOWN. So a success
      // haptic, the panel standing down, and a re-read balance are the
      // whole of the sender-side receipt — D4's cut removed the other half
      // (the author's notification) rather than deferring it.
      const drops = await NectarStore.getBalanceDrops();
      setBalanceDrops(drops);
      setEntrySendOpen(false);
      // A second gift is a second zap, so it needs its own handle.
      beginAttempt();
    } catch (err) {
      console.warn('PackageOpenScreen: record_zap failed', err);
      setSendFailed(true);
    } finally {
      setSending(false);
    }
  };

  const handleNectarDismiss = () => {
    setNectarConsentError(false);
    setNectarConsentSheetOpen(false);
  };

  // Same rail as MemoryLane — R118's floor is per-step and per-tap, not
  // per-screen, so this call site owns the tick for the same reason that
  // one does (see revealSequencer.js's own comment on why the tick is not
  // in the engine).
  useEffect(() => {
    if (!sequence || !revealState || revealState.done) return;
    const id = setInterval(() => {
      setRailFill(dwellProgress(revealState, Date.now(), sequence, STUB_GRAMMAR));
    }, 50);
    return () => clearInterval(id);
  }, [sequence, revealState]);

  useEffect(() => {
    if (!sequence || !revealState || revealState.done) return;
    dateOpacity.setValue(0);
    if (reduced) {
      bloomOpacity.setValue(0);
      bloomScale.setValue(1);
      Animated.timing(bloomOpacity, {
        toValue: 1,
        duration: arrivalMs(STUB_GRAMMAR, true),
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    } else {
      bloomOpacity.setValue(0);
      bloomScale.setValue(0.85);
      Animated.parallel([
        Animated.spring(bloomOpacity, { toValue: 1, ...SPRINGS.reveal, useNativeDriver: true }),
        Animated.spring(bloomScale, { toValue: 1, ...SPRINGS.reveal, useNativeDriver: true }),
      ]).start();
    }
    Animated.timing(dateOpacity, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence, revealState?.index, revealState?.done, reduced]);

  const handleTap = () => {
    if (!sequence || !revealState) return;
    const next = tapReveal(revealState, Date.now(), sequence, STUB_GRAMMAR);
    if (next === revealState) return;
    Haptics.selectionAsync();
    setRailFill(0);
    setRevealState(next);
  };

  const cover = hiveCoverTheme(pkg?.coverTheme);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: cover.base }]}>
        <ActivityIndicator color={theme.colors.ink} size="large" />
      </View>
    );
  }

  if (error || !pkg) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: cover.base }]}>
        <PressableScale
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={22} color={cover.textColor} />
        </PressableScale>
        <Text style={styles.emptyTitle}>We couldn't reach this package.</Text>
        <Text style={styles.emptyBody}>Check your connection and try again.</Text>
      </View>
    );
  }

  const step = sequence && revealState && !revealState.done ? sequence[revealState.index] : null;

  return (
    <View style={[styles.container, { backgroundColor: cover.base }]}>
      <PressableScale
        onPress={() => navigation.goBack()}
        style={styles.closeButton}
        accessibilityLabel="Close package"
      >
        <Ionicons name="close" size={22} color={cover.textColor} />
      </PressableScale>

      {step ? (
        <>
          <Text style={[styles.senderLabel, { color: cover.textColor }]}>From {pkg.senderName}</Text>
          <Pressable
            style={styles.tapArea}
            onPress={handleTap}
            accessibilityRole="button"
            accessibilityLabel="Tap to continue to the next memory"
          >
            <View style={styles.entryFrame} pointerEvents="box-none">
              <Animated.Text style={[styles.date, { color: cover.textColor, opacity: dateOpacity }]}>
                {formatRevealDate(step.at)}
              </Animated.Text>
              <Animated.View
                style={[styles.entryCard, { opacity: bloomOpacity, transform: [{ scale: bloomScale }] }]}
              >
                <ScrollView style={styles.entryScrollView} contentContainerStyle={styles.entryScroll} showsVerticalScrollIndicator={false}>
                  <PaperBlock paper={step.paper}>
                    <Text style={[styles.entryText, { color: paperInk(step.paper) }]}>{step.text}</Text>
                  </PaperBlock>
                </ScrollView>
                {!nectarConsent && (
                  <PressableScale
                    onPress={() => setNectarConsentSheetOpen(true)}
                    haptic={null}
                    containerStyle={styles.nectarDoor}
                    accessibilityLabel="Give a gift"
                  >
                    <Ionicons name="enter-outline" size={16} color={theme.colors.ink} />
                  </PressableScale>
                )}
                {/* ENG-64 — the same slot, post-consent. The door and the
                    affordance never coexist: pre-consent the tap opens the
                    sheet, post-consent it opens the panel, and the consent
                    sheet has no audience once `nectarConsent` is true.
                    Pigment is `ink` (§7.2: `accentDeep` on this card's
                    `surface` ground is 2.613 against a 3:1 non-text bar). */}
                {nectarConsent && (
                  <PressableScale
                    onPress={handleOpenEntrySend}
                    haptic={null}
                    containerStyle={styles.nectarDoor}
                    accessibilityLabel="Send nectar for this memory"
                  >
                    <Ionicons name="water-outline" size={16} color={theme.colors.ink} />
                  </PressableScale>
                )}
              </Animated.View>
              <View style={styles.railTrack}>
                <View style={[styles.railFill, { width: `${Math.round(railFill * 100)}%` }]} />
              </View>
            </View>
          </Pressable>
        </>
      ) : (
        <View style={styles.ending}>
          <Text style={[styles.endingTitle, { color: cover.textColor }]}>
            {sequence && sequence.length > 0
              ? `That's everything ${pkg.senderName} sent.`
              : 'This package has nothing in it yet.'}
          </Text>
          {/* ENG-63 / DES-28 D2. The slot Deezine's spec fills was carved
              out by DES-17 when reply/react deferred to Slice 1.1 — this
              is filling a hole, not adding a step. Pre-consent the ending
              is EXACTLY what it is today: the sentence and a plain Close,
              no reserved space (D2's `preConsent`, and Apple 2.3.1(a)'s
              reason for it). The target is the HIVE, not an entry — the
              thanks is for the package. */}
          {nectarConsent ? (
            <NectarSendPanel
              nectarConsent={nectarConsent}
              balanceDrops={balanceDrops}
              selected={sendAmount}
              onSelect={handleSelectPreset}
              customValue={sendCustom}
              onChangeCustom={handleChangeCustom}
              sending={sending}
              failed={sendFailed}
              onSend={handleSend}
              onCancel={handleCloseFromEnding}
            />
          ) : (
            <PrimaryButton onPress={() => navigation.goBack()}>Close</PrimaryButton>
          )}
        </View>
      )}

      {/* ENG-64's mounting. OUTSIDE the reveal `Pressable` on purpose:
          every tap inside that region advances the sequence, so controls
          drawn there would be controls inside a "next" gesture. The panel
          is the same component the ending slot mounts inline. */}
      {nectarConsent && (
        // NESTED, NOT `nectarConsent && entrySendOpen && …`, and the
        // parentheses are load-bearing rather than cosmetic: the flat form
        // parses as `(nectarConsent && entrySendOpen) && …`, whose outer
        // `left` is a LogicalExpression, and `isUnderGuard` recognises only
        // an Identifier there. Its header calls that out and calls redding
        // on it the safe direction. Written this way the guard is the
        // outermost test and both readers — the human and the gate — see
        // the same thing.
        <>
          {entrySendOpen && (
        <View style={styles.sendOverlay}>
          <NectarSendPanel
            nectarConsent={nectarConsent}
            balanceDrops={balanceDrops}
            selected={sendAmount}
            onSelect={handleSelectPreset}
            customValue={sendCustom}
            onChangeCustom={handleChangeCustom}
            sending={sending}
            failed={sendFailed}
            onSend={handleSend}
            onCancel={closeSendPanel}
          />
        </View>
          )}
        </>
      )}

      <NectarConsentSheet
        nectarConsentSheetOpen={nectarConsentSheetOpen}
        senderName={pkg.senderName}
        submitting={nectarConsentSubmitting}
        error={nectarConsentError}
        onAffirm={handleNectarAffirm}
        onDismiss={handleNectarDismiss}
      />
    </View>
  );
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatRevealDate = (atMs) => {
  const d = new Date(atMs);
  const month = MONTH_NAMES[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  const thisYear = new Date().getUTCFullYear();
  return year === thisYear ? `${month} ${day}` : `${month} ${day}, ${year}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.glassFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderLabel: {
    ...theme.type.label,
    textAlign: 'center',
    marginTop: 60,
    opacity: 0.8,
  },
  tapArea: {
    flex: 1,
  },
  entryFrame: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  date: {
    ...theme.type.h3,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  entryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.lg,
    maxHeight: '62%',
    ...theme.shadows.floating,
  },
  entryScrollView: {
    flex: 1,
  },
  entryScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  entryText: {
    ...theme.type.bodyLg,
    color: theme.colors.ink,
  },
  // DES-28 D3, corrected per Pixel's review (2026-08-26): the door used to
  // float `position: absolute` over the card, which let a full-width line
  // of entry text pass under it undetected — a float can't respect content.
  // It's now the card's second flex child, below the scrolling entry text,
  // so it owns its own 32pt row instead of overlapping content. Still
  // bottom-right, same slot Deezine's spec reserves for the post-consent
  // drop icon.
  nectarDoor: {
    alignSelf: 'flex-end',
    marginTop: theme.spacing.sm,
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    // Above the reveal Pressable, below nothing — the consent sheet sits at
    // 2 and the two are mutually exclusive by `nectarConsent`.
    zIndex: 2,
  },
  railTrack: {
    height: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.trackDim,
    marginTop: theme.spacing.lg,
    overflow: 'hidden',
  },
  railFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.ink,
  },
  ending: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  endingTitle: {
    ...theme.type.h2,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.type.h2,
    color: theme.colors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyBody: {
    ...theme.type.body,
    color: theme.colors.inkSoft,
    textAlign: 'center',
  },
});
