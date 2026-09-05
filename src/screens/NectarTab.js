import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { theme } from '../constants/theme';
import { useReducedMotion } from '../constants/motion';
import {
  NECTAR_STARTER_GRANT_DROPS,
  hasNectarConsent,
  honeyLevelForDrops,
} from '../constants/nectar';
import { CELL_CANVAS_PAD, CELL_STROKE_WIDTH } from '../constants/combCell';
import { hexPoints } from '../components/hexGeometry';
import { HoneyFill } from '../components/HoneycombGrid';
import { NectarStore } from '../services/NectarStore';
import { Avatar } from '../components/Avatar';
import { NectarConsentSheet } from '../components/NectarConsentSheet';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { LoadState, LOAD_STATES, resolveListView } from '../components/LoadState';
import { TAB_CLEARANCE, DOOR_RESERVE } from '../navigation/tabBarLayout';

// R-NT — THE NECTAR TAB (GUIDES/POLLINATE_OPENDAY_NECTAR_RECUT_SPEC.md Part 3,
// Lumen 2026-09-05, UX Design thread 160660d9).
//
// The 09-04 direction put nectar in a ROOM on the honeycomb tab. Colin looked
// at the shipped header and could not find nectar at all — the owner failing
// to locate the surface is the legibility verdict on that placement, so the
// room's ruled anatomy moved here whole: vessel (state), ledger (events).
// This closes balance-rendered-nowhere.
//
// WHERE THE COPY HAS TO LIVE, AND IT IS NOT A STYLE CHOICE. Every money word
// below is authored INLINE IN JSX, under its guard. It cannot be gathered into
// a module-scope `COPY` map the way `WriteInbox.js` gathers its own, and the
// reason is mechanical: `positionFor` (scripts/lib/rendered-strings.mjs)
// classifies a string by walking OUT to the first JSX frame that settles it,
// and a string in a plain object at module scope in a screen file reaches no
// such frame — it is position `null`, so it is never collected, so B4 never
// sees it and B5 never sees it either. Extracting this copy would not move it
// out of the guard's reach; it would move it out of the RULE's reach, which is
// worse and looks tidier. Same for a helper that returns the sentence.
//
// WHAT IS DELIBERATELY NOT HERE: a `Give nectar` door. R-NT-5 said the tab
// "may carry one" and R-NT-5's amendment removes it for this build — the
// destination flow (`CombNectarCompose`) is parameterised by ONE comb id and
// this tab has none in hand, so every buildable resolution invents an unruled
// rule. All three shipped give doors start from Today, so nothing is lost,
// only a shortcut. The door returns when a destination is ruled.

// The hero vessel's circumradius. `size * 2` wide, `size * √3` tall — 104 x 90
// at this value, which is the mock's cell and the one drawn on the frames
// Lumen ratified.
const HERO_CELL_SIZE = 52;

// One row's date. The mock drew relative days ("Today", "Yesterday",
// "Tuesday") and this does not: a relative-day formatter is new logic with
// real edge cases (local midnight, the seam where "Tuesday" stops meaning this
// week) and nothing in the tree has one to borrow. This is the same absolute
// form `WriteInbox` renders, minus the clock — a gift is an event on a day,
// not at a minute. Raised for Lumen rather than invented here.
const formatEventDate = (isoString) =>
  new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// THE OWN CELL, DRAWN LARGE — R-NT-2 as amended. Not a jar: the app has
// exactly one vessel for this quantity and it is the honeycomb cell, so a jar
// object would be a second vessel for one balance, the defect class R-N2
// retired. `HoneyFill` is imported rather than re-drawn for the same reason
// one layer down — the three-layer honey (white body, accentDeep at 0.5, the
// ink meniscus) and its settle tween have ONE painter, and this screen is its
// second mount rather than its second copy.
//
// The "You" glyph stays and is load-bearing, not decorative: `honeyHMax`
// derives its ceiling from that glyph's line box (hexGeometry.js §6.4), so a
// vessel drawn without it would be a vessel whose fill rule is about a letter
// that is not there.
//
// R-CL-1's padded canvas, unmoved: the viewBox starts at -PAD so user space
// still puts the hexagon's left vertex at x = 0 and every number in
// `hexGeometry` keeps meaning what it meant, while the rendered box gains PAD
// on four sides for the 2.5pt stroke to finish inside. Scale stays 1.
const HeroVessel = ({ level, reduced }) => {
  const points = hexPoints(HERO_CELL_SIZE);
  const box = HERO_CELL_SIZE * 2 + CELL_CANVAS_PAD * 2;
  return (
    <View>
      <Svg
        width={box}
        height={box}
        viewBox={`${-CELL_CANVAS_PAD} ${-CELL_CANVAS_PAD} ${box} ${box}`}
      >
        {/* Same paint order as the comb cell: the `surface` backing under the
            tint, so the honey reads as one colour rather than amber on one
            ground and grey-brown on another (§3). */}
        <Polygon points={points} fill={theme.colors.surface} />
        <Polygon points={points} fill={theme.colors.washYellow} />
        {level > 0 && <HoneyFill size={HERO_CELL_SIZE} level={level} reduced={reduced} />}
        <Polygon
          points={points}
          fill="none"
          stroke={theme.colors.glassHairline}
          strokeWidth={CELL_STROKE_WIDTH}
        />
      </Svg>
      <View style={styles.heroGlyphOverlay} pointerEvents="none">
        <Text style={styles.heroGlyph}>You</Text>
      </View>
    </View>
  );
};

// R-NT-3 — a gift between two people, in the gratitude voice. Direction is a
// WORD (From/To), never a sign on the numeral: a signed amount is the fintech
// register R-NT-2 rules off this whole surface.
//
// THE NAME HAS THREE ANSWERS AND THE CASE CARRIES ONE OF THEM.
// `listNectarEvents` resolves a counterparty to a real name, to the literal
// 'Someone' (§1B.35.2's AUTHORIZATION refusal — "I am not permitted to read
// this person"), or to `null` (the read reached a row with nothing to show).
// Capital `Someone` arrives already spelled and renders as-is in object
// position after From/To, exactly as the 21 other live-refusal sites use it;
// lowercase `someone` is the name-ABSENCE form and must not borrow the
// authorization word. The avatar is handed neither: `initialsFor`'s own header
// refuses both, since a confident "S" for a person this reader was never shown
// is worse than a "?".
//
// IT TAKES THE GUARD AS A PROP AND RE-WRAPS ITS OWN BODY, which is not
// belt-and-braces: `isUnderGuard` is a WITHIN-FILE ancestor walk, so a
// component whose copy sits at its own top level — guarded only by the
// caller's conditional two functions away — has no guard ancestor of its own
// and reds B4. Measured, not predicted: the unit word "drops" on line 144 was
// the gate's one failure before this prop existed. Same shape
// `NectarConsentSheet` and `NectarSendPanel` already use, and B8 requires the
// feeder to be an identifier of the same name.
const LedgerRow = ({ event, nectarConsent }) => {
  const named = event.counterpartyName === 'Someone' ? null : event.counterpartyName;
  return (
    nectarConsent && (
    <View style={styles.row}>
      <Avatar name={named ?? undefined} size={40} />
      <View style={styles.rowText}>
        <Text style={styles.rowWho}>
          {event.direction === 'to'
            ? `To ${event.counterpartyName ?? 'someone'}`
            : `From ${event.counterpartyName ?? 'someone'}`}
        </Text>
        {event.noteText ? (
          <Text style={styles.rowNote} numberOfLines={2}>
            "{event.noteText}"
          </Text>
        ) : null}
        <Text style={styles.rowWhen}>{formatEventDate(event.createdAt)}</Text>
      </View>
      <View style={styles.rowAmount}>
        <Text style={styles.rowAmountValue}>{event.amountDrops}</Text>
        <Text style={styles.rowAmountUnit}>{event.amountDrops === 1 ? 'drop' : 'drops'}</Text>
      </View>
    </View>
    )
  );
};

export const NectarTab = () => {
  const reduced = useReducedMotion();

  // THE CONSENT READ IS THREE OUTCOMES HERE, NOT TWO, and that is a departure
  // from C1 that this surface forces. `hasNectarConsent` collapses unknown and
  // no on purpose, because everywhere else the consequence of both is the app
  // as it ships — an ABSENCE, correct either way. On this tab the pre-consent
  // state is a whole screen making a positive claim ("Gifts are off. Nothing
  // is sent or received."), so an unknown rendered as a no would tell a
  // consented user their gifts are off. The predicate is untouched; the screen
  // holds the third state itself (§23.1).
  const [consentRow, setConsentRow] = useState(null);
  const [consentRead, setConsentRead] = useState(LOAD_STATES.LOADING);
  const [nectarConsentSheetOpen, setNectarConsentSheetOpen] = useState(false);
  const [consentSubmitting, setConsentSubmitting] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [consentReloadKey, setConsentReloadKey] = useState(0);

  // The two guard names, both positive polarity so `isUnderGuard` reads them
  // with no change to the walker, and both initialised from the predicate
  // itself — `nectarUnconsented` from `!hasNectarConsent(…)` with the negation
  // outermost, which is what check-nectar-consent's B7 clause certifies. The
  // clause certifies POLARITY only; RESOLUTION is the `consentRead === READY`
  // ancestor below, and the name means what it says only inside it.
  const nectarConsent = hasNectarConsent(consentRow);
  const nectarUnconsented = !hasNectarConsent(consentRow);

  const [balanceDrops, setBalanceDrops] = useState(null);
  const [events, setEvents] = useState([]);
  const [ledgerRead, setLedgerRead] = useState(LOAD_STATES.LOADING);
  const [ledgerReloadKey, setLedgerReloadKey] = useState(0);

  // One read, on mount. `nectarConsent` only ever flips false->true within a
  // session (no revocation path, nectar.js's table comment), so a re-check on
  // every focus would be a round trip for an answer that cannot change back.
  useEffect(() => {
    let cancelled = false;
    NectarStore.getConsent()
      .then((row) => {
        if (cancelled) return;
        setConsentRow(row);
        setConsentRead(LOAD_STATES.READY);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('NectarTab: failed to load nectar consent', err);
        setConsentRead(LOAD_STATES.UNKNOWN);
      });
    return () => {
      cancelled = true;
    };
  }, [consentReloadKey]);

  // THE EFFECT'S OWN GUARD, and both halves are required rather than
  // belt-and-braces: `if (!nectarConsent) return` as the FIRST statement plus
  // `nectarConsent` in the dependency list. That pair is the authority shape
  // rule E4 recognises (check-nectar-consent.mjs) — the early return without
  // the dep is a check that never re-runs when the flag flips, and the dep
  // without the early return is a re-run with no check. Both reads here name
  // reserved identifiers, and neither can sit under a rendered guard: they
  // must COMPLETE before the surface that renders them exists.
  //
  // ONE effect over both reads, deliberately. A vessel drawn from a balance
  // that landed beside a ledger that did not would be one surface asserting
  // two different reads succeeded.
  useEffect(() => {
    if (!nectarConsent) return undefined;
    let cancelled = false;
    Promise.all([NectarStore.getBalanceDrops(), NectarStore.listNectarEvents()])
      .then(([drops, rows]) => {
        if (cancelled) return;
        setBalanceDrops(drops);
        setEvents(rows);
        setLedgerRead(LOAD_STATES.READY);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('NectarTab: failed to load nectar balance or events', err);
        // Stays null — NectarStore's contract makes null UNKNOWN and 0 a read
        // empty wallet, and this screen says the two differently.
        setBalanceDrops(null);
        setLedgerRead(LOAD_STATES.UNKNOWN);
      });
    return () => {
      cancelled = true;
    };
  }, [nectarConsent, ledgerReloadKey]);

  const retryConsent = useCallback(() => {
    setConsentRead(LOAD_STATES.LOADING);
    setConsentReloadKey((k) => k + 1);
  }, []);
  const retryLedger = useCallback(() => setLedgerReloadKey((k) => k + 1), []);

  // DOOR, NOT SWITCH — Sage's bootstrap ruling, restated in the R-NT build
  // rulings. The CTA opens the sheet; only the sheet's affirmative fires
  // consent_to_nectar(), because the first call irreversibly mints the starter
  // grant and an accidental tap would be a permanent mint nobody saw.
  const handleAffirm = async () => {
    setConsentSubmitting(true);
    setConsentError(false);
    try {
      const row = await NectarStore.consentToNectar();
      setConsentRow(row);
      setNectarConsentSheetOpen(false);
    } catch (err) {
      console.warn('NectarTab: consent_to_nectar failed', err);
      setConsentError(true);
    } finally {
      setConsentSubmitting(false);
    }
  };

  const ledgerView = resolveListView(ledgerRead, events.length);
  const honeyLevel = balanceDrops === null ? 0 : honeyLevelForDrops(balanceDrops);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {consentRead === LOAD_STATES.LOADING && (
          <ActivityIndicator color={theme.colors.accent} style={styles.loader} />
        )}

        {/* THE FAILED CONSENT READ CANNOT NAME THIS SURFACE, and that is the
            rule working rather than a compromise. "Nectar" is a reserved word
            because rendering it asserts an audience; a screen that has not
            established its audience must not assert one. So this state carries
            a header with no money word in it and a §23 unknown card, and it is
            the one state on this tab that needs no guard because it says
            nothing that needs authorising.

            COPY IS NOT LUMEN'S YET. This fourth state is outside the two she
            ruled (the read landing was assumed); raised in the same message
            that ships this, and these are placeholders in the sense of being
            unratified, not in the sense of being unconsidered. */}
        {consentRead === LOAD_STATES.UNKNOWN && (
          <>
            <ScreenHeader title="Gifts" style={styles.header} />
            <LoadState
              state={LOAD_STATES.UNKNOWN}
              onRetry={retryConsent}
              title="Couldn't reach your gifts"
              body="Something went wrong on the way here."
              actionLabel="Try again"
              retryAccessibilityLabel="Try loading your gifts again"
            />
          </>
        )}

        {/* Exactly one of the two ruled states, and only once the read has
            landed. §23.1 — empty is a positive claim, and so is "you have not
            turned this on". The two are mutually exclusive by construction:
            `nectarUnconsented` IS `!nectarConsent` over the same row.

            NESTED, NOT `consentRead === READY && nectarConsent && …`. The
            guard recogniser requires a BARE Identifier as the `&&`'s left, and
            a flat chain parses as `((a === b) && nectarConsent) && …`, whose
            outer left is a LogicalExpression. Same trap PackageOpen.js names
            twice. */}
        {consentRead === LOAD_STATES.READY && (
          <>
            {nectarConsent && (
              <>
                <ScreenHeader eyebrow="YOUR NECTAR" title="Nectar" style={styles.header} />

                {/* R-NT-2: the balance line sits BESIDE the vessel, never
                    beneath it — a number under the honey is the caption
                    DES-24 §5 forbids. */}
                <View style={styles.heroCard}>
                  <HeroVessel level={honeyLevel} reduced={reduced} />
                  {/* A NON-BREAKING SPACE BETWEEN THE NUMBER AND ITS UNIT,
                      and it is the whole of the wrap rule on this card.
                      Measured on the rig at 402pt: the sentence cannot fit
                      beside a 104pt vessel at any register a hero would use,
                      so it wraps — and with an ordinary space it wrapped as
                      "You have 1240" / "drops.", orphaning a unit from its
                      quantity. Worked the other way too: there is NO column
                      width that breaks correctly at every balance, because
                      the ranges that give "You have" / "N drops." at n = 1
                      and at n = 1240 do not overlap. So the fix is not a
                      width, it is forbidding the one break that is wrong.
                      This is also just correct typography: a quantity and
                      its unit are one token. */}
                  <Text style={styles.balance}>
                    {balanceDrops === null
                      ? "We couldn't check your drops."
                      : balanceDrops === 1
                      ? 'You have 1\u00A0drop.'
                      : `You have ${balanceDrops}\u00A0drops.`}
                  </Text>
                </View>

                <Text style={styles.sectionLabel}>Recently</Text>

                {ledgerView === LOAD_STATES.STALE && (
                  <LoadState
                    state={LOAD_STATES.STALE}
                    onRetry={retryLedger}
                    staleLabel="This list may be out of date."
                    staleActionLabel="Refresh"
                    retryAccessibilityLabel="Try loading your gifts again"
                    style={styles.stale}
                  />
                )}

                {ledgerView === LOAD_STATES.LOADING && (
                  <ActivityIndicator color={theme.colors.accent} style={styles.loader} />
                )}

                {ledgerView === LOAD_STATES.UNKNOWN && (
                  <LoadState
                    state={LOAD_STATES.UNKNOWN}
                    onRetry={retryLedger}
                    title="Couldn't reach your gifts"
                    body="Something went wrong on the way here."
                    actionLabel="Try again"
                    retryAccessibilityLabel="Try loading your gifts again"
                  />
                )}

                {ledgerView === LOAD_STATES.EMPTY && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Nothing has moved yet.</Text>
                    <Text style={styles.emptyBody}>
                      When you give drops to someone, or someone gives you some, it shows up here.
                    </Text>
                  </View>
                )}

                {(ledgerView === LOAD_STATES.READY || ledgerView === LOAD_STATES.STALE) &&
                  events.map((event) => (
                    <LedgerRow key={event.id} event={event} nectarConsent={nectarConsent} />
                  ))}
              </>
            )}

            {/* R-NT-4 as amended. The on-state pill does not build: NectarStore
                exports consentToNectar() and nothing that reverses it, so a
                pill drawn as a control would state a condition nobody can
                change from here. Pre-consent, the whole tab is the explainer —
                the empty vessel, the headline, the body naming the grant, the
                door, and the status beneath it. */}
            {nectarUnconsented && (
              <>
                <ScreenHeader eyebrow="YOUR NECTAR" title="Nectar" style={styles.header} />
                <View style={styles.explainerCard}>
                  {/* Zero is the only dark case (hexGeometry's floor rule), and
                      here it is an honest zero: no wallet exists, so there is
                      no balance to claim and nothing to fill. */}
                  <HeroVessel level={0} reduced={reduced} />
                  <Text style={styles.explainerHeadline}>
                    Nectar is how you say thank you with something.
                  </Text>
                  <Text style={styles.explainerBody}>
                    A drop is a small thank you that travels with a note. Turn gifts on and{' '}
                    {NECTAR_STARTER_GRANT_DROPS} drops are yours to start.
                  </Text>
                  <PrimaryButton
                    onPress={() => setNectarConsentSheetOpen(true)}
                    containerStyle={styles.explainerCta}
                    accessibilityLabel="Turn on gifts"
                  >
                    Turn on gifts
                  </PrimaryButton>
                </View>
                <Text style={styles.sectionLabel}>Recently</Text>
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Gifts are off.</Text>
                  <Text style={styles.emptyBody}>Nothing is sent or received.</Text>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <NectarConsentSheet
        nectarConsentSheetOpen={nectarConsentSheetOpen}
        submitting={consentSubmitting}
        error={consentError}
        onAffirm={handleAffirm}
        onDismiss={() => {
          setConsentError(false);
          setNectarConsentSheetOpen(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 24,
    // Unified with Today/Hive/Garden at 72 (DES-27).
    paddingTop: 72,
    paddingBottom: TAB_CLEARANCE,
  },
  header: {
    // DES-27: the account door's fixed top-right column. `marginEnd`, never
    // `marginRight` — MainTabs.js carries the scar from that exact trap.
    marginEnd: DOOR_RESERVE,
  },
  loader: {
    marginTop: 32,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: 24,
    marginBottom: 28,
  },
  heroGlyphOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The same 0.42 ratio the comb cell uses for its own glyph, so the letter
  // sits in the same place relative to the honey at both sizes.
  heroGlyph: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: HERO_CELL_SIZE * 0.42,
    color: theme.colors.ink,
  },
  balance: {
    ...theme.type.h2,
    color: theme.colors.ink,
    flexShrink: 1,
  },
  explainerCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: 32,
    marginBottom: 28,
  },
  explainerHeadline: {
    ...theme.type.h2,
    color: theme.colors.ink,
    textAlign: 'center',
    marginTop: 20,
  },
  explainerBody: {
    ...theme.type.bodyLg,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginTop: 12,
  },
  explainerCta: {
    marginTop: 24,
    alignSelf: 'stretch',
  },
  sectionLabel: {
    ...theme.type.label,
    color: theme.colors.inkSoft,
    marginBottom: 12,
  },
  stale: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: 16,
    marginBottom: 12,
  },
  rowText: {
    flex: 1,
  },
  rowWho: {
    ...theme.type.bodyLg,
    color: theme.colors.textPrimary,
  },
  rowNote: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    marginTop: 2,
  },
  rowWhen: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    marginTop: 2,
  },
  rowAmount: {
    alignItems: 'flex-end',
  },
  rowAmountValue: {
    ...theme.type.h3,
    color: theme.colors.ink,
  },
  // The unit sits under its own numeral, quiet: the amount is the subject and
  // the word is the unit, not a second number.
  rowAmountUnit: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
  },
  emptyState: {
    backgroundColor: theme.colors.washYellow,
    borderRadius: theme.borderRadius.large,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    ...theme.type.h2,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    ...theme.type.bodyLg,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginTop: 8,
  },
});
