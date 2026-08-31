import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { HiveStore } from '../services/HiveStore';
import { HoneycombStore } from '../services/HoneycombStore';
import { NectarStore } from '../services/NectarStore';
import { hasNectarConsent } from '../constants/nectar';
import { randomUUID } from '../utils/uuid';
import { hiveCoverTheme } from '../constants/hiveThemes';
import { PressableScale } from '../components/PressableScale';
import { GlassRim } from '../components/GlassRim';
import { PrimaryButton } from '../components/PrimaryButton';
import { NectarConsentSheet } from '../components/NectarConsentSheet';
import { NectarSendPanel, isSendableAmount } from '../components/NectarSendPanel';
import { NectarGiftLayer } from '../components/NectarGiftLayer';
import { HoneyDrop } from '../components/HoneyDrop';
import { DROP_MAX_RADIUS } from '../components/nectarFlight';
import { useNectarGift } from '../components/useNectarGift';
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
import { RotationFrame } from '../components/RotationFrame';

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

  // DES-21 §9 — the set of authors whose entries may show a nectar door.
  // `null` (not yet loaded) intentionally renders no door on any entry
  // rather than a flash of one that then disappears — same "we never render
  // authority someone doesn't have" ground the gate itself rests on.
  const [connectedAuthorIds, setConnectedAuthorIds] = useState(null);

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

  // R-N3's two ends, both REFS and never coordinates. `giftOrigin` follows
  // the control that carries the amount (the panel decides which);
  // `entryPaperRef` and `endingTitleRef` are the two destinations
  // `sendTarget` is exhaustive over — the paper block of the entry, and the
  // colophon sentence for a gift aimed at the whole package (R-N3.1).
  const giftOrigin = useRef(null);
  const entryPaperRef = useRef(null);
  const endingTitleRef = useRef(null);
  const gift = useNectarGift({ reduced, balanceDrops });

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

  // DES-21 §9 — one read, on mount, same shape as the consent read above.
  // `listConnections()` is already the self-scoped, RLS-reachable query
  // `profiles_select_connections` proves out; the gate is membership of
  // `step.authorId` in the returned set, no new query shape.
  useEffect(() => {
    let cancelled = false;
    HoneycombStore.listConnections()
      .then((rows) => {
        if (!cancelled) setConnectedAuthorIds(new Set((rows ?? []).map((r) => r.id)));
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('PackageOpenScreen: failed to load connections', err);
        setConnectedAuthorIds(new Set());
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

  // `measureInWindow` has a callback and no promise. Wrapped once here so
  // the beat can await both ends together and so a view that has gone away
  // between the tap and the measure resolves `null` rather than hanging the
  // send forever.
  const measure = (ref) =>
    new Promise((resolve) => {
      if (!ref.current || typeof ref.current.measureInWindow !== 'function') {
        resolve(null);
        return;
      }
      ref.current.measureInWindow((x, y, width, height) => {
        if ([x, y, width, height].some((n) => typeof n !== 'number' || !Number.isFinite(n))) resolve(null);
        else resolve({ x, y, width, height });
      });
    });

  const handleSend = async () => {
    const amount = resolveSendAmount();
    if (!sendTarget.id || sending || !isSendableAmount(amount, balanceDrops)) return;
    setSending(true);
    setSendFailed(false);

    // THE REQUEST IS HANDED TO THE BEAT RATHER THAN AWAITED HERE. R-N3 is
    // optimistic — "the drop leaves before the network answers" — so the
    // request and the choreography start together and are joined at the end.
    // The re-read rides inside it, so the authoritative balance lands before
    // the beat resolves and the count's absolute target is never stale.
    //
    // IT IS AN ANONYMOUS THUNK AT THE CALL SITE, AND THAT IS NOT A STYLE
    // CHOICE. My first cut hoisted it to `const commit = async () => {…}`,
    // which reds `check-nectar-consent` E2 — and the gate is RIGHT. E2
    // traces a reserved store call's authority to the JSX that wires the
    // handler it sits in, and `findEnclosingHandlerName` stops at the first
    // NAMED arrow it meets walking outward. A named intermediate closure is
    // therefore a wall: the call is really authorised by `onSend={handleSend}`
    // under `nectarConsent`, and naming the wrapper hid exactly that chain.
    // Inline, the walk reaches `handleSend`, whose two wirings are both
    // inside the guard, and the authority is legible to the gate for the
    // same reason it is legible to a reader.
    // THE DESTINATION IS THE TARGET'S, and the two branches are the two
    // `sendTarget` kinds — exhaustive by construction (see `sendTarget`), so
    // there is no third case to fall through. `entry` goes to the paper
    // block of the thing this person wrote; `hive` goes to the colophon
    // sentence, which is the only thing on the ending screen that IS the
    // package rather than a part of it, and the only one that renders in all
    // three of its branches (R-N3.1).
    const [origin, destination] = await Promise.all([
      measure(giftOrigin),
      measure(sendTarget.kind === 'entry' ? entryPaperRef : endingTitleRef),
    ]);

    // FAIL-SAFE, AND IT FAILS TOWARD THE GIFT. If either end could not be
    // measured there is no path to fly, but the person still asked to give
    // something — so the send happens exactly as it did before this ruling
    // (await, haptic, close) rather than being refused. A beat that could
    // not draw itself must not become a beat that did not happen.
    if (!origin || !destination) {
      try {
        await NectarStore.recordZap({
          zapId: attemptId.current,
          targetKind: sendTarget.kind,
          targetId: sendTarget.id,
          amountDrops: amount,
        });
        setBalanceDrops(await NectarStore.getBalanceDrops());
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setEntrySendOpen(false);
        beginAttempt();
      } catch (err) {
        console.warn('PackageOpenScreen: record_zap failed', err);
        setSendFailed(true);
      } finally {
        setSending(false);
      }
      return;
    }

    const result = await gift.send({
      origin,
      destination,
      amount,
      commit: () =>
        NectarStore.recordZap({
          zapId: attemptId.current,
          targetKind: sendTarget.kind,
          targetId: sendTarget.id,
          amountDrops: amount,
        })
          .then(() => NectarStore.getBalanceDrops())
          .then((drops) => setBalanceDrops(drops)),
    });
    if (result && result.ok === false) {
      console.warn('PackageOpenScreen: record_zap failed', result.err);
      // The drop has already come home and the numeral has already counted
      // back up; this is only the accessible text, which R-N3 keeps ("the
      // failure line stays as the accessible text; the motion is what
      // carries it").
      setSendFailed(true);
    } else {
      setEntrySendOpen(false);
      // A second gift is a second zap, so it needs its own handle.
      beginAttempt();
    }
    setSending(false);
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
          containerStyle={styles.closeButtonAnchor}
        style={styles.closeButton}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={22} color={cover.textColor} />
          <GlassRim radius={theme.borderRadius.full} />
        </PressableScale>
        <Text style={styles.emptyTitle}>We couldn't reach this package.</Text>
        <Text style={styles.emptyBody}>Check your connection and try again.</Text>
      </View>
    );
  }

  const step = sequence && revealState && !revealState.done ? sequence[revealState.index] : null;
  // DES-21 §9 — `connectedAuthorIds === null` (not loaded yet) fails closed
  // to no door, matching the state's own comment.
  const authorReachable = !!(step && connectedAuthorIds && connectedAuthorIds.has(step.authorId));

  return (
    <View style={[styles.container, { backgroundColor: cover.base }]}>
      <PressableScale
        onPress={() => navigation.goBack()}
        containerStyle={styles.closeButtonAnchor}
        style={styles.closeButton}
        accessibilityLabel="Close package"
      >
        <Ionicons name="close" size={22} color={cover.textColor} />
        <GlassRim radius={theme.borderRadius.full} />
      </PressableScale>

      {step ? (
        <>
          {pkg.rotationSubjectName ? (
            <RotationFrame
              subjectName={pkg.rotationSubjectName}
              organizerName={pkg.rotationOrganizerName}
              closesAt={pkg.rotationClosesAt}
              sealedAt={pkg.rotationSealedAt}
            />
          ) : (
            <Text style={[styles.senderLabel, { color: cover.textColor }]}>From {pkg.senderName}</Text>
          )}
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
                <ScrollView contentContainerStyle={styles.entryScroll} showsVerticalScrollIndicator={false}>
                  <PaperBlock paper={step.paper} blockRef={entryPaperRef}>
                    <Text style={[styles.entryText, { color: paperInk(step.paper) }]}>{step.text}</Text>
                    {/* DES-21 §4 — a SIGNATURE, not a byline: inside PaperBlock,
                        after the body, trailing-aligned, on the entry's own
                        `bloomOpacity`/`bloomScale` (no arrival of its own).
                        Condition is per-VOLUME (`pkg.isCollective`), never
                        per-entry (§4's scope note, §14.3's is_collective
                        ruling) — a collective volume signs every entry, a
                        solo one signs none. `— {name}` only; never "by". */}
                    {pkg.isCollective && step.authorName && (
                      <Text style={[styles.entrySignature, { color: paperInk(step.paper) }]}>
                        {`— ${step.authorName}`}
                      </Text>
                    )}
                  </PaperBlock>
                </ScrollView>
                {/* DES-21 §9 — the door is ABSENT, never disabled, on an
                    entry whose author is not an accepted connection of the
                    subject (§14.5). Applies uniformly, not just to collective
                    volumes: a solo hive's only writer is its owner, who
                    send_hive already required to be a connected friend, so
                    the gate is a no-op there and costs nothing to apply.
                    NESTED, NOT `!nectarConsent && authorReachable && …` —
                    same load-bearing-parens shape as the `entrySendOpen`
                    block below, for the same reason (check-nectar-consent
                    .mjs's B4: `isUnderGuard` reads only a bare Identifier as
                    the DIRECT `left` of the guarding `&&`; a flat 3-term
                    chain parses `(!nectarConsent && authorReachable)` as
                    that left, which is a LogicalExpression, not an
                    Identifier). */}
                {!nectarConsent && (
                  authorReachable && (
                    <PressableScale
                      onPress={() => setNectarConsentSheetOpen(true)}
                      haptic={null}
                      containerStyle={styles.nectarDoor}
                      accessibilityLabel="Give a gift"
                    >
                      {/* R-N6 — pre-consent the door keeps its DISTINCT
                          GLYPH and carries no money word and no drop form:
                          `nectar.js`'s D3 row and Apple 2.3.1(a) both bind,
                          and a drop IS the money form. So only the size is
                          corrected, and the correction is borrowed rather
                          than chosen — the design system's own icon-circle
                          pairing is a 22pt Ionicons glyph in a 44pt circle
                          (§9.3's build sheet as logged in the Review Log:
                          "white 44pt icon circles on washYellow; moon /
                          cloud / leaf / heart at 22pt ink"). 16pt in a 32pt
                          box was neither half of that pair. */}
                      <Ionicons name="enter-outline" size={22} color={theme.colors.ink} />
                    </PressableScale>
                  )
                )}
                {/* ENG-64 — the same slot, post-consent. The door and the
                    affordance never coexist: pre-consent the tap opens the
                    sheet, post-consent it opens the panel, and the consent
                    sheet has no audience once `nectarConsent` is true.
                    Pigment is `ink` (§7.2: `accentDeep` on this card's
                    `surface` ground is 2.613 against a 3:1 non-text bar).
                    NESTED for the same B4 reason as the door above. */}
                {nectarConsent && (
                  authorReachable && (
                    <PressableScale
                      onPress={handleOpenEntrySend}
                      haptic={null}
                      containerStyle={styles.nectarDoor}
                      accessibilityLabel="Send nectar for this memory"
                    >
                      {/* R-N6 — THE DOOR IS A DROP. A 16pt `water-outline`
                          is not an invitation; the affordance is the same
                          object the whole system is made of, at rest, so
                          the thing you tap looks like the thing you send.
                          `DROP_MAX_RADIUS` is not a size picked for this
                          slot — it was DERIVED FROM this slot (R-N3: the
                          ceiling is "the door IS this object at rest in the
                          ratified 44pt box"), so the door and the flight
                          cannot drift into two sizes.

                          NO CLOCK OF ITS OWN, and none is added: this
                          element is already inside the entry card's
                          `bloomOpacity`/`bloomScale` view (`:497`), so it
                          arrives on the entry's own bloom by position. One
                          more ambient loop is banned (standing rule), which
                          is why "it breathes on the entry's own bloom
                          clock" is satisfied by an ABSENCE here rather than
                          by an animation. */}
                      <HoneyDrop radius={DROP_MAX_RADIUS} />
                    </PressableScale>
                  )
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
          {/* DES-21 §6 — the colophon: the one beat about the volume rather
              than an entry, and the only moment the writers exist as a
              group. `contributor_names` is the single source (§14.2/§14.4),
              already distinct-per-author in first-appearance order, so no
              second ordering is derived here. */}
          <Text ref={endingTitleRef} style={[styles.endingTitle, { color: cover.textColor }]}>
            {sequence && sequence.length > 0
              ? pkg.isCollective
                ? // Row 17's bijection: this count is `contributorNames.length`,
                  // the exact array the names below render from — never a
                  // separately-derived number. A people-count is permitted
                  // presence (§5's "Four of you are writing" precedent);
                  // entry counts stay banned everywhere else in this doc.
                  `${pkg.contributorNames.length} ${pkg.contributorNames.length === 1 ? 'person' : 'people'} wrote this for you.`
                : `That's everything ${pkg.senderName} sent.`
              : 'This package has nothing in it yet.'}
          </Text>
          {sequence && sequence.length > 0 && pkg.isCollective && pkg.contributorNames.length > 0 && (
            <View style={styles.colophon}>
              {pkg.contributorNames.map((name, i) => (
                <Text
                  key={`${name}-${i}`}
                  style={[styles.colophonName, { color: cover.textColor }]}
                >
                  {name}
                </Text>
              ))}
            </View>
          )}
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
              displayDrops={gift.displayDrops}
              controlsStyle={gift.controlsStyle}
              originRef={giftOrigin}
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
        // R-N3.3 — TWO JOBS, SEPARATED. This view was one thing doing both:
        // a dark veil AND the touch barrier that stops a tap during the gift
        // from advancing the reveal underneath. The veil now lives in its
        // own sibling and fades to zero across Gather, because "the drop
        // should fly over the entry it is for, not over a dimmed copy of
        // it"; the barrier is this view, which stays mounted and opaque to
        // touches for the whole beat even when nothing is drawn on it. A
        // transparent overlay is still a touch barrier — that is the ruling,
        // and it is the reason the two had to come apart.
        <View style={styles.sendOverlay}>
          <Animated.View
            pointerEvents="none"
            style={[styles.sendScrim, { opacity: gift.scrim }]}
          />
          <NectarSendPanel
            nectarConsent={nectarConsent}
            balanceDrops={balanceDrops}
            displayDrops={gift.displayDrops}
            controlsStyle={gift.controlsStyle}
            originRef={giftOrigin}
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

      {/* LAST CHILD, so the drop crosses over the entry, the panel and the
          overlay alike — it is the one object in this beat that belongs to
          neither surface. It takes no touches (R-N3.3's other half). */}
      <NectarGiftLayer
        gift={gift.gift}
        travel={gift.travel}
        dropScale={gift.dropScale}
        dropOpacity={gift.dropOpacity}
        bloom={gift.bloom}
      />

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
  // R43 CHANNEL (Lumen, 2026-08-29, MVP1 screen pass): positioning belongs on
  // `containerStyle`, never `style`. `PressableScale` puts `style` on its inner
  // Animated.View and `containerStyle` on the outer Pressable — so an absolute
  // inset written to `style` is resolved against the Pressable's own collapsed
  // box instead of this screen, and the control renders wherever flow drops it.
  // Photographed mid-screen on PackageOpen and MemoryLane before this split.
  sendScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.scrim,
  },
  closeButtonAnchor: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 1,
  },
  // GL7(d′) — `glassFill` (`surface`@0.40) STAYS. This circle floats over a
  // flat `cover.base` with its scroll region inset below it by construction,
  // so nothing ever passes underneath it and converting it to the real lens
  // would buy zero refraction while making the body FAINTER (`surface`@0.35:
  // -0.34 to -0.69 ΔE00 body-vs-cover on the four covers). Its definition
  // comes from the shared `<GlassRim>` above instead — same stack as the tab
  // capsule, 2.87-2.99 ΔE00 of hairline contribution at the edge.
  closeButton: {
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
  entryScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  entryText: {
    ...theme.type.bodyLg,
    color: theme.colors.ink,
  },
  // DES-21 §4 — the signature. `theme.type.bodySm`, full-strength `paperInk`
  // (never alpha — §2.1 of the contrast tables: dimming an ink token INVERTS
  // on a dark paper), trailing-aligned. This app has no RTL surface anywhere
  // yet (no `I18nManager` usage in `src/`), so "follows writing direction"
  // is `textAlign: 'right'` today; mirroring is future work this screen
  // isn't inventing infrastructure for.
  entrySignature: {
    ...theme.type.bodySm,
    textAlign: 'right',
    marginTop: theme.spacing.sm,
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
    // R-N6 — 44pt, which is TWO ratified numbers landing on one value: the
    // design system's minimum touch target (§16.5, "min 44pt touch
    // targets") and the drop's own
    // ratified rest diameter (`2 * DROP_MAX_RADIUS`). 32 was under the
    // first and unrelated to the second. Not written as an expression of
    // `DROP_MAX_RADIUS` on purpose — the box is the TAP TARGET, and it must
    // not shrink if the drop's ceiling is ever retuned.
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOverlay: {
    ...StyleSheet.absoluteFill,
    // NO `backgroundColor` — the veil moved to `sendScrim` below. What is
    // left here is the touch barrier and the panel's centring, and this view
    // being invisible is exactly the point (R-N3.3).
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
  // DES-21 §6 — the colophon. Book grammar: signed pages, then a plain list
  // of who wrote them, one per line, in the order the subject actually met
  // them (the array's own order — see `contributor_names`' comment).
  colophon: {
    marginBottom: theme.spacing.xl,
  },
  colophonName: {
    ...theme.type.body,
    textAlign: 'center',
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
