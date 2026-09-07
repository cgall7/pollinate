import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { HiveStore } from '../services/HiveStore';
import { FlyingBee } from '../components/FlyingBee';
import { GlowOrb } from '../components/GlowOrb';
import { SUPPRESS_BEE } from '../constants/beeSuppression';
import { PerchAnchor, PerchField, usePerchSet } from '../components/PerchAnchor';
import { ScreenHeader } from '../components/ScreenHeader';
import { StaggeredItem } from '../components/StaggeredItem';
import { HiveCard } from '../components/HiveCard';
import { StartHiveDoorCard } from '../components/StartHiveDoorCard';
import { OrganizerCombCard } from '../components/OrganizerCombCard';
import { Avatar } from '../components/Avatar';
import { PressableScale } from '../components/PressableScale';
import { RotationFold } from '../components/RotationFold';
import { PendingCombRow } from '../components/PendingCombRow';
import { useDaysLeft } from '../components/useDaysLeft';
import { TAB_CLEARANCE, DOOR_RESERVE } from '../navigation/tabBarLayout';
import { MASCOT_WIDTH_FRACTION } from '../constants/mascot';

// --- P1a, the greeting's staging (Pixel, 2026-08-28) ---------------------
//
// Lane P1a, promoted to first delivery by Colin (2026-08-26): the bee "looks
// awkward and not integrated", wants it "a little bigger". The screenshot
// shows the defect precisely — the bee ships at the small end of his 13->132
// domain, beside the reflection card, half off the right edge. He WANDERED
// INTO FRAME INSTEAD OF BEING STAGED IN IT, and the repair is staging rather
// than scale: a hero standing in the greeting's own negative space, with
// MB-D1's stage light coming up behind him.
//
// SIZE, AND IT COSTS NOTHING. 132 is not a compromise between 44 and "bigger"
// — it is the hero scale this staging was measured against: the Lock gate's
// `WelcomeBee size={132}`, retired with the gate in R-OD. The measurement
// frame is historical, the number is not. And it
// sits under the LOD threshold: `MASCOT_BASE_PX / (MASCOT_WIDTH_FRACTION * 3)`
// = 150.7317, so any integer size <= 150 renders on the base cut at @3x.
// Above that, `MascotBee` reaches for the hero pair — which the register
// (PRESENCE_PASS_REGISTER.md, P1a item 4) rules "lands WITH its first hero
// mount", i.e. a new asset in this commit. Staging at 132 ships P1a with no
// asset dependency at all.
//
// SILHOUETTE, NOT BOX. `size` is the flight box; the character drawn inside it
// is `MASCOT_WIDTH_FRACTION` of it. Every placement number below is stated on
// the CHARACTER, because the box's empty margin is not something the eye can
// see a clearance against.
const HERO_SIZE = 132;
const HERO_CHAR_WIDTH = HERO_SIZE * MASCOT_WIDTH_FRACTION; // 90.20pt

// MB-D1's Today spec: "Radius: bee bounding box (132pt max) x 1.2 = ~160pt".
// Derived rather than typed, because the doc's 160 is a rounding of its own
// formula and the two numbers must move together if the hero is ever resized.
const BLOOM_RADIUS_RATIO = 1.2;
const BLOOM_SIZE = HERO_SIZE * BLOOM_RADIUS_RATIO * 2; // 316.80pt across

// §34 — `intensity` is the light's STRENGTH; `color` carries its hue. 0.55 is
// the two ratified ambient sites' value verbatim (`CoreRitual.js:51`,
// `Onboarding.js:166`), and matching it is the argument rather than a
// coincidence: this app has one light, and a second number for the same
// pigment would be a second vocabulary.
//
// MB-D1 asks for a core stop at "60-80% opacity", and that number is NOT
// carried across. It was written for a three-hue stack where the core was one
// of three layers; the stack is struck by measurement (GlowOrb's header), and
// in the one-hue ramp `intensity` is the WHOLE light. Reusing 60-80% here
// would be borrowing a number across the very change that struck its context.
//
// What the strength is bounded BY, measured: composited on this screen's own
// ground (`background` #FFF7CC), accent at 0.55 gives ink 13.3392:1 and
// inkSoft 4.9123:1 — both clear 4.5:1 at the bloom's core, which is its
// darkest point. Section H of check-stage-light re-derives that from the live
// tokens AND from this constant, so a retune of either cannot leave the claim
// standing on its own.
const BLOOM_INTENSITY = 0.55;

// The anchor the hero lives at. A literal because two things must name the
// same string — the `<PerchAnchor id>` and the settle handler's read — and a
// second spelling of it is a bloom that lands nowhere.
const GREETING_ANCHOR = 'greeting';

// ENG-61 — a "whose is it" card, the shape `ReceivedPackagesScreen`'s
// `PackageRow` already established for the same problem (a hive on screen
// that is not yours), not `HiveCard`'s cover-art shape (which has no room
// for an owner attribution line and every field it does show — cover theme,
// memory count — belongs to a hive you own).
// Finding A (thread b57ad406, 2026-08-31): `hive.ownerName` is `null` for a
// comb-linked hive whose organizer name is placeholder-class — HiveStore
// answers "no from-clause to show," not "Someone," so this line omits
// rather than renders a name it doesn't have.
//
// R-38.9-J (Lumen, thread b57ad406, ruled §1B.38.22/final): text, glyph, and
// color are three channels of one claim — an absence ruling that binds only
// the text still leaves `Avatar`'s circle asserting a specific (and, worse,
// always-the-same, since `avatarColorFor(null)` hashes to the same wash
// every time) person beside text that just declined to name one. When
// `ownerName` is null the row renders no person at all: same 40pt disc
// geometry so rows stay aligned down the shelf, filled with
// `theme.colors.surfaceBorder` — the same "slot whose content is not
// available" token `Avatar.js`'s own `styles.image` already uses behind an
// unloaded photo, extending an existing mechanism rather than adding one.
// A cover-theme tint was proposed and REFUSED (Vector, §1B.38.22 §1):
// `washPeach`/`washSky` are the only two of the four cover bases in
// `AVATAR_WASHES`, and `washPeach`'s own token text reserves it for avatar
// identity swatches only; the other two are cream-on-white and read as
// invisible against this row's white `surface` ground, which the cover
// palette was never calibrated to sit on as a figure. The semantic drops
// rather than re-homes: the hive fact is already carried one channel over
// by `subjectName` in the same row, and TodayTab renders cover theme
// nowhere else, so a theme-tinted disc would debut that channel only on
// the unnamed-owner row — the absence row would become the loudest row on
// the shelf. No ring: `glassRim` is white-on-white here, and a
// `surfaceBorder` ring on a `surfaceBorder` fill is doubling.
const ContributingHiveRow = ({ hive, onPress }) => {
  const daysLeft = useDaysLeft(hive.combRotation?.closesAt);

  return (
    <PressableScale onPress={() => onPress(hive)} style={styles.contributingRow}>
      {hive.ownerName ? (
        <Avatar name={hive.ownerName} size={40} />
      ) : (
        <View style={styles.ownerAbsentDisc} />
      )}
      <View style={styles.contributingRowText}>
        <Text style={styles.contributingRowName}>{hive.subjectName}</Text>
        {hive.ownerName ? (
          <Text style={styles.contributingRowSubject} numberOfLines={1}>
            From {hive.ownerName}
          </Text>
        ) : null}
        {hive.combRotation ? (
          <RotationFold
            variant="member"
            subjectName={hive.subjectName}
            daysLeft={daysLeft}
            count={hive.combRotation.writerCount}
            countKind="writers"
            style={styles.contributingRotationFold}
          />
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.inkSoft} />
    </PressableScale>
  );
};

const greeting = (date) => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const longDate = (date) =>
  date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

export const TodayTab = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  // §32.2 — where the bee may land, held by the screen and read by the flight.
  // Membership only: the coordinates are measured at the moment of choosing,
  // so scrolling this list does not touch this value and does not re-render.
  const perches = usePerchSet();
  // Where the stage light goes, in this screen's own coordinates. Null until
  // the bee is home, which is the whole cue: MB-D1 stages an object, so there
  // is nothing to light until there is an object to light.
  const [bloomAt, setBloomAt] = useState(null);
  const stageRef = useRef(null);

  // §32.2's conversion, done once here rather than assumed away. `read()`
  // returns a WINDOW point and `<GlowOrb>` is positioned inside this screen's
  // container, so the container's own window origin has to come off it. That
  // origin is almost certainly (0, 0) — this View is the root of a tab screen
  // under `headerShown: false` — and "almost certainly" is exactly the kind of
  // assumption `FlyingBee` refuses to make for the same conversion, so this
  // does not make it either.
  //
  // Measure-on-use, and the cache is warm by construction: `onSettle` is
  // announced from `start()`, which only succeeds after `readHome()` returned
  // a point, so the anchor has measured at least once by the time this runs.
  //
  // ONCE. `onSettle` is once per mount (FlyingBee's `residentSettledRef`), and
  // the bloom does not re-enter on focus or scroll. It also does not FADE on
  // tab blur, and that is a reading of MB-D1 rather than an omission: the
  // score's exit trigger is "on screen exit", and a tab that never unmounts
  // has no observable moment there — the fade would play behind a screen
  // nobody is looking at. The primitive's fade branch stays built and is real
  // at the P2 celebration card, which does unmount.
  const handleBeeSettle = useCallback(() => {
    const point = perches.read(GREETING_ANCHOR);
    if (!point) return;
    stageRef.current?.measureInWindow?.((x, y) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      setBloomAt({ x: point.x - x, y: point.y - y });
    });
  }, [perches]);
  const [hives, setHives] = useState([]);
  const [hivesError, setHivesError] = useState(false);
  const [organizerCombs, setOrganizerCombs] = useState([]);
  const [organizerCombsError, setOrganizerCombsError] = useState(false);
  const [expandedCombId, setExpandedCombId] = useState(null);
  // Hives this user writes in but does not own (ENG-61) — a separate list
  // from `hives` above on purpose, same reasoning as that shelf's own
  // comment: a read failure here must not blank the "PRIVATE HIVES" shelf
  // or vice versa, and the two shelves render from genuinely different
  // queries (`listHives` is owner-only; `listContributingHives` is the
  // inverse).
  const [contributingHives, setContributingHives] = useState([]);
  const [contributingHivesError, setContributingHivesError] = useState(false);
  // COPY-6 addendum (Lumen) — combs joined before any month opened. Its own
  // state and its own read for the same reason every shelf above has one: a
  // failure here must not blank the hives beside it.
  const [pendingCombs, setPendingCombs] = useState([]);

  // DES-29 §8.5 — a successful mint from the pre-launch card's own
  // affordance flips that card to `RotationFold` by refetching, the same
  // read the focus effect below already runs. Extracted so
  // `OrganizerCombCard`'s `onMinted` can call it on demand without waiting
  // for the next focus event.
  const reloadOrganizerCombs = useCallback(() => {
    HiveStore.listOrganizerCombs()
      .then((list) => {
        setOrganizerCombsError(false);
        setOrganizerCombs(list);
      })
      .catch((err) => {
        console.warn('TodayTab: failed to load organizer combs', err);
        setOrganizerCombsError(true);
        setOrganizerCombs([]);
      });
  }, []);

  // Independent of every other read below and on its own error state — a
  // failed hive list must not blank another shelf (or vice versa); each
  // shelf's own comment gives its reasoning.
  //
  // ENG-104 (2026-09-07): this effect used to run alongside a fourth,
  // journal-only read (EntryStore.getEntry), and `loading` cleared in THAT
  // effect's own `finally`. The entry card — and the read that fed it —
  // moved to Honeycomb whole (FIVE_TAB_IA_SPEC §5); this screen's remaining
  // content is the three shelves below, so the `finally` that guarantees
  // the spinner can't get stuck (Sage, thread e10d0fed) moves here with
  // them, wrapping all three reads in one `Promise.all` rather than the
  // three independent fire-and-forget calls this effect used to fire.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          await Promise.all([
            (async () => {
              try {
                const list = await HiveStore.listHives();
                if (cancelled) return;
                setHivesError(false);
                setHives(list);
              } catch (err) {
                if (cancelled) return;
                console.warn('TodayTab: failed to load hives', err);
                setHivesError(true);
                setHives([]);
              }
            })(),
            // Independent try/catch, not folded into the block above — a failed
            // contributing-hives read must not blank the owner's own shelf (or
            // vice versa), same reasoning as this effect's own comment for why
            // hives and contributing hives get separate flags.
            (async () => {
              try {
                const list = await HiveStore.listContributingHives();
                if (cancelled) return;
                setContributingHivesError(false);
                setContributingHives(list);
              } catch (err) {
                if (cancelled) return;
                console.warn('TodayTab: failed to load contributing hives', err);
                setContributingHivesError(true);
                setContributingHives([]);
              }
            })(),
            // The pre-launch/dormant membership read. No error flag beside it,
            // and that is deliberate rather than an omission: the shelf's own
            // standing treatment (see its comment below) is that a zero-row
            // state and a failed read both simply WITHHOLD — there is no
            // evergreen action this row could offer in place of itself, and a
            // "we couldn't reach your combs" line here would double the one
            // the organizer shelf already renders for the same outage.
            (async () => {
              try {
                const list = await HiveStore.listPendingCombMemberships();
                if (cancelled) return;
                setPendingCombs(list);
              } catch (err) {
                if (cancelled) return;
                console.warn('TodayTab: failed to load pending comb memberships', err);
                setPendingCombs([]);
              }
            })(),
          ]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      reloadOrganizerCombs();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }

  const now = new Date();

  return (
    <View ref={stageRef} collapsable={false} style={styles.container}>
      {/* MB-D1's stage light, and it is mounted FIRST on purpose — ahead of
          every sibling, not merely ahead of the bee. Nothing on this screen
          carries a `zIndex`, so what paints under what is child order alone;
          `FlyingBee`'s own fill carries 5, which lifts the hero above the
          content wherever HE is mounted and therefore says nothing about
          where the light goes. Paint order is bloom -> scroll content -> bee.
          The light is behind the words it stages and behind the hero standing
          in it, which is the score's "bloom layers behind the object" and its
          "gold never a ground" in the same fact. `check-stage-light` H8
          asserts the slot, not the pair.

          It does not scroll, and neither does the bee — the resident is seated
          once and stays in window space while the page moves under him. An
          in-flow bloom would have been the one thing worse than no bloom: a
          light that slides off its own hero. */}
      {bloomAt && (
        <GlowOrb
          size={BLOOM_SIZE}
          intensity={BLOOM_INTENSITY}
          staged
          style={{ left: bloomAt.x - BLOOM_SIZE / 2, top: bloomAt.y - BLOOM_SIZE / 2 }}
        />
      )}
      {/* §12.2/§14.1: ambient presence, default-on for Today idle. Absolutely
          positioned behind the content and never intercepts touches
          (pointerEvents="none" throughout FlyingBee).

          §32.2 — `perches` is the whole of what the bee knows about this
          screen. Passing null is how a state says "no bee": the error arm
          withholds the badge and the CTA by design, and a mascot doing laps
          over failure copy performs cheerfulness at failure (Lumen, ratified
          2026-08-17). Note this is a DIFFERENT decision from the week feed's,
          which suppresses itself structurally by declaring nothing to land on
          — same outcome, and the two must not be collapsed into one rule,
          because one is about tone and the other is about geometry. */}
      {/* The third suppression, and the only one that is not a design
          decision: `SUPPRESS_BEE` is the idle-motion instrument's control
          build (`measure-bee-idle-motion.mjs`), off in every real build. It
          sits at the call site with the other two because that is where this
          screen already says who gets a bee — see the constant for why it
          must not be read anywhere else. */}
      {!SUPPRESS_BEE && (
        <FlyingBee
          active
          size={HERO_SIZE}
          // ENG-104 (2026-09-07): this read `error ? null : perches`, gating
          // errand-flight targeting on the journal read's failure state. That
          // read — and the entry card whose failure copy this suppressed a
          // mascot lapping over — moved to Honeycomb whole; no anchor on this
          // screen has ever had an errand land on it (Bee Doctrine State 1:
          // "the other anchors are errand landing sites that nothing lands on
          // yet"), so the gate was already a no-op and dropping it changes
          // nothing observable. A future errand landing here should read this
          // screen's OWN failure state (hivesError, below), never a re-derived
          // echo of a read that no longer happens on this screen.
          perches={perches}
          onSettle={handleBeeSettle}
        />
      )}

      <PerchField perches={perches}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* DES-27 (Pixel, 2026-08-26, corrected): the header badge retired
            because the corner is now the account door's reserved column
            (`tabBarLayout.js`, DOOR_RESERVE). (T2, Lumen, 2026-08-26: the
            badge's spoken successor, the streak-whisper below, retired in
            turn — same register as Garden's scoreboard, a live countdown
            toward a milestone. Today prints the streak nowhere now; the
            slot is quiet until Lane P3's time-aware greeting lands.) */}
        {/* P1a — THE STAGE. Three parts, and each of them is a contract
            rather than a coordinate (R30: deliver contracts, not positions).

            1. The stage box is exactly the header ROW. `ScreenHeader`'s own
               24pt bottom margin moves out to the wrapper, so `at={0.5}` on
               the anchor below means the GREETING's vertical centre and not
               the centre of the greeting plus its margin.

            2. The reserve. `paddingRight: HERO_CHAR_WIDTH + DOOR_RESERVE`
               shrinks the text box by the column the character occupies AND
               the column the account door owns, so "hero in negative space,
               never over text" (the register's acceptance line for this lane)
               is a property of the LAYOUT rather than of today's three
               greeting strings.

               The door term is the correction of 2026-08-29 (Lumen, found on
               a device). The original placement ruling measured the top-right
               void against the GREETING alone — 121.61pt of clear width at
               402pt — and the door is not in this screen's layout tree to be
               measured: `MainTabs` mounts it as an absolute overlay over every
               tab. So the void was never 121.61pt; it was that less the door's
               52pt disc and its gap. The hero shipped with the door sitting on
               its head. A void is only clear of what you measured it against,
               and `tabBarLayout.js` states the property this restores in
               writing: the door owns a fixed column at the trailing content
               edge and every tab keeps that column clear.

               What it costs, measured from the shipped TTFs at 402pt: the
               reserve now leaves 195.80pt, and all three greetings set wider
               than that ("Good evening" 202.45, "Good morning" 210.70, "Good
               afternoon" 232.39). So the greeting wraps to two lines in every
               state — the same shape at every hour rather than a header whose
               height changes at noon, with the hero standing in the gap the
               second line opens. The row cannot hold greeting, hero and door
               on one line at this width; that is a fact about the width, and
               the layout says it out loud instead of stacking the objects.

            3. The perch. Its RIGHT EDGE is the character's centre, because
               §32.2 draws the bee centred on the resolved point: offsetting
               the box by half a character plus the door's column lands the
               character's trailing edge exactly where `DOOR_RESERVE` begins
               (x 219.80..310.00 at 402pt, the door at 326.00..378.00), so the
               16pt between them is that constant's own `spacing.md` term and
               not a number chosen here. `top: 0, bottom: 0` makes the vertical
               a consequence of the row's own height, so a font change or a
               wrapped greeting moves the hero with it.

            THE LIGHT ARRIVES, NOT THE BEE. MB-D1 offers "glances, breathes,
            or lands into this light"; the doctrine retires the fly-in, and
            `start()` seeds the resident at home because "the first thing the
            screen shows is a bee who was already here". So the bee is already
            standing there, breathing, and the bloom coming up on him IS the
            entrance beat. Nothing new moves on a page whose quiet is a
            ruling. */}
        <View style={styles.greetingStage}>
          <View style={styles.greetingReserve}>
            <ScreenHeader
              eyebrow={longDate(now)}
              title={greeting(now)}
              style={styles.greetingHeaderRow}
            />
          </View>
          <PerchAnchor id={GREETING_ANCHOR} on="right" at={0.5} home style={styles.heroPerch} />
        </View>

        {/* Sides used to be about x-extent: the bee sortied between these
            anchors, and a set of full-width blocks all anchored on one side
            gave him nothing to turn around for (R122). The Bee Doctrine
            retires the idle sortie, so there is no set any more — there is one
            RESIDENCE, marked `home` below, and the other anchors are errand
            landing sites that nothing lands on yet.
            What a side decides now is whether the bee stands on the words.
            R122a: he rests AT the anchor (the hover that displaced him by one
            17.3pt radius is retired with the rest of it), drawn centred on it,
            spanning 30.07pt at size 44. On a left-aligned full-width block
            `on: 'left'` is where the glyphs BEGIN — the defect that pass
            fixed was a resting bee clipping the line beneath him into "2 ays
            to 3." That line has since retired with the streak register (T2,
            below), so the example is history rather than a live defect; the
            geometry it proved is why every anchor on this screen is `right`,
            and that outlives the sentence it was found on. `on: 'right'` is
            the trailing gutter. */}

        {/* T2 (Lumen, 2026-08-26): the streak whisper that lived here — a
            live countdown toward the next milestone, spoken instead of
            scored — retired with Garden's scoreboard (G1). Same register,
            one door over: theme.js §29.1's KEEPSAKE test fails a summary of
            a live process regardless of whether it's numerals or a
            sentence. The slot is quiet until Lane P3's time-aware greeting
            lands. */}

        {/* Private Hives shelf (8b.2/8b.3, WP-1 §26.1). This used to be the
            second cascade step, after the journal card at index 0; ENG-104
            (2026-09-07) moved that card — and its `entry-card` PerchAnchor —
            to Honeycomb whole (FIVE_TAB_IA_SPEC §5), so this shelf is now
            the first thing in the cascade and keeps its own index unchanged
            (renumbering the survivors would cost a diff line with no
            behavior behind it). The written-state footer that used to sit
            between the journal card and this shelf narrated exactly what
            this shelf now IS ("share it with your hive") — the affordance
            replaced its own caption in the quiet-page cut. `hivesError`
            never blanks the shelf into nothing — the door card still
            renders, since it's a local navigation target with no data
            dependency. */}
        <StaggeredItem index={1}>
          <PerchAnchor id="hive-shelf" on="left" at={0.5}>
          <View style={styles.hiveShelf}>
            <Text style={styles.shelfLabel}>PRIVATE HIVES</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hiveRow}
            >
              {hives.map((hive) => (
                <HiveCard
                  key={hive.id}
                  hive={hive}
                  onPress={() => navigation.getParent()?.navigate('HiveDetail', { hiveId: hive.id })}
                />
              ))}
              <StartHiveDoorCard onPress={() => navigation.getParent()?.navigate('CreateHive')} />
              <StartHiveDoorCard
                onPress={() => navigation.getParent()?.navigate('CreateComb')}
                label={'Start a comb\ntogether'}
                accessibilityLabel="Start a comb with your connections"
              />
            </ScrollView>
            {hivesError && (
              <Text style={styles.hiveErrorText}>We couldn't reach your hives right now.</Text>
            )}
          </View>
          </PerchAnchor>
        </StaggeredItem>

        {organizerCombs.length > 0 && (
          <StaggeredItem index={2}>
            <PerchAnchor id="organizer-comb-shelf" on="left" at={0.5}>
              <View style={styles.hiveShelf}>
                <Text style={styles.shelfLabel}>COMBS YOU RUN</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hiveRow}
                >
                  {organizerCombs.map((comb) => (
                    <OrganizerCombCard
                      key={comb.id}
                      comb={comb}
                      expanded={expandedCombId === comb.id}
                      onPress={() => setExpandedCombId((current) => (current === comb.id ? null : comb.id))}
                      onWrite={(rotation) =>
                        navigation.getParent()?.navigate('ComposeHiveEntry', {
                          hiveId: rotation.hiveId,
                          subjectName: rotation.subjectName,
                        })
                      }
                      onNectar={(comb) =>
                        navigation.getParent()?.navigate('CombNectarCompose', { combId: comb.id })
                      }
                      onMinted={reloadOrganizerCombs}
                    />
                  ))}
                </ScrollView>
                {organizerCombsError && (
                  <Text style={styles.hiveErrorText}>We couldn't reach your combs right now.</Text>
                )}
              </View>
            </PerchAnchor>
          </StaggeredItem>
        )}

        {/* "Writing with others" shelf (ENG-61) — only rendered when
            non-empty, same door-less treatment `FileToHive` above gets for
            an empty/failed read: there is no evergreen local action this
            shelf could show in its place (unlike the private-hives shelf's
            "start a hive" door card), so a zero-row state and a failed read
            both simply withhold the shelf rather than asserting either one. */}
        {(contributingHives.length > 0 || pendingCombs.length > 0) && (
          <StaggeredItem index={3}>
            <PerchAnchor id="contributing-hive-shelf" on="left" at={0.5}>
              <View style={styles.hiveShelf}>
                <Text style={styles.shelfLabel}>WRITING WITH OTHERS</Text>
                {contributingHives.map((hive) => (
                  <ContributingHiveRow
                    key={hive.id}
                    hive={hive}
                    onPress={() => navigation.getParent()?.navigate('ContributingHive', { hiveId: hive.id })}
                  />
                ))}
                {/* Joined, no month open yet (COPY-6 addendum). THIS SHELF,
                    not a new one, for every member EXCEPT the one who becomes
                    the new month's subject: the pending row is the SAME row
                    one mint earlier — when the month opens,
                    `listPendingCombMemberships` drops the comb and
                    `listContributingHives` picks up its hive, so the entry
                    upgrades in place instead of a shelf appearing and
                    disappearing around it. The subject is the one exception:
                    the roster snapshot excludes them, so their row vanishes
                    rather than upgrading — correct, since the month is
                    withheld from its own subject, but worth naming so the
                    absence doesn't read as a bug. Below the live rows because
                    a month already moving outranks one that hasn't started.
                    Keyed on the comb id, which cannot collide with the hive
                    ids above — two different tables, and a comb with a hive
                    is never in this list. */}
                {pendingCombs.map((comb) => (
                  <PendingCombRow key={comb.id} combName={comb.name} />
                ))}
              </View>
            </PerchAnchor>
          </StaggeredItem>
        )}
      </ScrollView>
      </PerchField>
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
  content: {
    padding: 24,
    paddingTop: 72,
    paddingBottom: TAB_CLEARANCE,
  },
  // P1a. The stage box is the header ROW: `ScreenHeader`'s own 24pt bottom
  // margin is moved out here (see `greetingHeaderRow`) so that a perch at
  // `at={0.5}` resolves to the greeting's centre rather than the centre of the
  // greeting plus its margin.
  greetingStage: {
    marginBottom: 24,
  },
  greetingHeaderRow: {
    marginBottom: 0,
  },
  // The hero's column, reserved structurally. Derived from the character, not
  // the flight box — the box's empty margin reserves space against nothing.
  greetingReserve: {
    paddingRight: HERO_CHAR_WIDTH + DOOR_RESERVE,
  },
  // §32.2 resolves `on: 'right'` to the box's RIGHT EDGE and the bee is drawn
  // centred on it, so this box's right edge has to be the character's centre:
  // half a character in from the content edge. `top`/`bottom` rather than a
  // height, so the vertical is the row's own.
  //
  // `width: 1` because `PerchAnchor.read` rejects a zero-size frame — the box
  // is a POINT with the smallest extent that measures, and only its right edge
  // and its vertical centre are ever read.
  heroPerch: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: HERO_CHAR_WIDTH / 2 + DOOR_RESERVE,
    width: 1,
  },
  hiveShelf: {
    marginTop: 28,
  },
  shelfLabel: {
    ...theme.type.label,
    color: theme.colors.inkSoft,
    marginBottom: 12,
  },
  hiveRow: {
    gap: 12,
    paddingRight: 8,
  },
  hiveErrorText: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    marginTop: 12,
  },
  contributingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.card,
  },
  // R-38.9-J (Lumen, final): a plain disc where `Avatar` would otherwise
  // sit, same footprint so shelf rows stay aligned. `surfaceBorder` is the
  // "content not available" precedent `Avatar.js` already sets for its own
  // unloaded-photo fill. No ring — `glassRim` is white-on-white here, and a
  // `surfaceBorder` ring on a `surfaceBorder` fill is doubling.
  ownerAbsentDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceBorder,
  },
  contributingRowText: {
    flex: 1,
  },
  contributingRowName: {
    ...theme.type.bodyLg,
    color: theme.colors.ink,
  },
  contributingRowSubject: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    marginTop: 2,
  },
  contributingRotationFold: {
    marginTop: 10,
  },
});
