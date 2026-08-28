import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { EntryStore } from '../services/EntryStore';
import { HiveStore } from '../services/HiveStore';
import { FlyingBee } from '../components/FlyingBee';
import { GlowOrb } from '../components/GlowOrb';
import { SUPPRESS_BEE } from '../constants/beeSuppression';
import { PerchAnchor, PerchField, usePerchSet } from '../components/PerchAnchor';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { StaggeredItem } from '../components/StaggeredItem';
import { FileToHive } from '../components/FileToHive';
import { PaperBlock, paperInk } from '../components/PaperBlock';
import { HiveCard } from '../components/HiveCard';
import { StartHiveDoorCard } from '../components/StartHiveDoorCard';
import { Avatar } from '../components/Avatar';
import { PressableScale } from '../components/PressableScale';
import { currentStreak, nextMilestone } from '../utils/dateRanges';
import { TAB_CLEARANCE } from '../navigation/tabBarLayout';
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
// — it is the shipped hero scale (`CoreRitual.js`, `WelcomeBee size={132}`),
// so the app gains a second hero mount rather than a third bee size. And it
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
const ContributingHiveRow = ({ hive, onPress }) => (
  <PressableScale onPress={() => onPress(hive)} style={styles.contributingRow}>
    <Avatar name={hive.ownerName} size={40} />
    <View style={styles.contributingRowText}>
      <Text style={styles.contributingRowName}>{hive.subjectName}</Text>
      <Text style={styles.contributingRowSubject} numberOfLines={1}>
        From {hive.ownerName}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={theme.colors.inkSoft} />
  </PressableScale>
);

const greeting = (date) => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const longDate = (date) =>
  date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

// The line under the streak — a goal, not just a number. Turns "7" into
// "3 days to 10," which is the whole point of showing a streak at all.
const streakCaption = (streak) => {
  if (streak === 0) return 'Write today to start your streak.';
  const next = nextMilestone(streak);
  if (!next) return "You've caught every milestone. Keep going.";
  return `${next.remaining} ${next.remaining === 1 ? 'day' : 'days'} to ${next.target}.`;
};

export const TodayTab = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [entry, setEntry] = useState(null);
  const [streak, setStreak] = useState(0);
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
  // Hives this user writes in but does not own (ENG-61) — a separate list
  // from `hives` above on purpose, same reasoning as that shelf's own
  // comment: a read failure here must not blank the "PRIVATE HIVES" shelf
  // or vice versa, and the two shelves render from genuinely different
  // queries (`listHives` is owner-only; `listContributingHives` is the
  // inverse).
  const [contributingHives, setContributingHives] = useState([]);
  const [contributingHivesError, setContributingHivesError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const now = new Date();
        try {
          const [today, allEntries] = await Promise.all([
            EntryStore.getEntry(now),
            EntryStore.getAllEntries(),
          ]);
          if (cancelled) return;
          setError(false);
          setEntry(today);
          // Streak reads every entry, not just this year's — Recap already
          // fixed this (RecapTab.js: "'BEST EVER' was measuring the calendar
          // year, so a record set in December vanished on New Year's Day").
          // Today had the same bug: a year-scoped streak resets to 1 on
          // January 1st mid-run (Pixel, thread 19e90cf8, 2026-08-13).
          // "THIS YEAR" stays year-scoped — it says so.
          setStreak(currentStreak(allEntries, now));
        } catch (err) {
          // requireUserId (EntryStore.js) throws 'Not signed in' with no
          // session — reachable via DEMO_MODE's Welcome skip link, which
          // lands on Main with no auth. Without this catch, `loading` never
          // flips and the tab spins forever instead of showing empty state
          // (Sage/Pixel, thread 19e90cf8, 2026-08-13).
          //
          // `error` is what actually distinguishes this from a genuinely
          // empty day (Pixel, thread 19e90cf8: setting entry/streak/total
          // to their empty values here was asserting four specific false
          // things — 0-day streak, 0 this year, "Write today to start your
          // streak.", "Today's page is blank." — about a user we simply
          // failed to read, not one who wrote nothing). §23 unknown state
          // is Deezine's when it lands; this is the placeholder that keeps
          // the read/write path honest until then.
          if (cancelled) return;
          console.warn('TodayTab: failed to load entries', err);
          setError(true);
          setEntry(null);
          setStreak(0);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  // Independent of the journal fetch above and on its own error state — a
  // failed hive list must not blank out an already-loaded journal (or vice
  // versa), same reasoning as the `error` flag above: a read failure and a
  // genuine zero-hives state are different facts and get different copy.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
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
      })();
      // Independent try/catch, not folded into the block above — a failed
      // contributing-hives read must not blank the owner's own shelf (or
      // vice versa), same reasoning as this effect's own comment for why it
      // is split from the journal fetch.
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
      })();
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
      {/* MB-D1's stage light, and it is mounted BEFORE the bee on
          purpose: `styles.orb` carries no `zIndex` and `FlyingBee`'s fill
          carries 5, so the paint order is bloom -> scroll content -> bee. The
          light is behind the words it stages and behind the hero standing in
          it, which is the score's "bloom layers behind the object" and its
          "gold never a ground" in the same fact.

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
          perches={error ? null : perches}
          onSettle={handleBeeSettle}
        />
      )}

      <PerchField perches={perches}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* DES-27 (Pixel, 2026-08-26, corrected): the header badge retired,
            and NOT because the caption repeats it — `streakCaption` below
            prints `nextMilestone(streak).remaining`, i.e. `target - streak`,
            which equals the streak at exactly three values in 1..365 (7, 15,
            30). At a 180-day streak the badge read `180` and this line reads
            "185 days to 365." It goes because the corner is now the account
            door's reserved column (`tabBarLayout.js`, DOOR_RESERVE) and
            because this screen states the streak as a sentence rather than a
            score — see the whisper's own comment below. Consequence, on
            purpose: Today prints the streak length nowhere; Garden's
            StatsCard does. */}
        {/* P1a — THE STAGE. Three parts, and each of them is a contract
            rather than a coordinate (R30: deliver contracts, not positions).

            1. The stage box is exactly the header ROW. `ScreenHeader`'s own
               24pt bottom margin moves out to the wrapper, so `at={0.5}` on
               the anchor below means the GREETING's vertical centre and not
               the centre of the greeting plus its margin.

            2. The reserve. `paddingRight: HERO_CHAR_WIDTH` shrinks the text
               box by exactly the column the character occupies, so "hero in
               negative space, never over text" (the register's acceptance
               line for this lane) is a property of the LAYOUT rather than of
               today's three greeting strings. It changes nothing on screen
               today — measured from the shipped TTFs at 402pt, the widest
               greeting "Good afternoon" sets 232.39pt into the 263.80pt the
               reserve leaves, so no wrap moves and 31.41pt of clear gutter
               falls out of the greeting's own length. If Lane P3's copy ever
               grows past that, the line wraps instead of running under the
               bee, which is the layout telling the truth.

            3. The perch. Its RIGHT EDGE is the character's centre, because
               §32.2 draws the bee centred on the resolved point: offsetting
               the box by half a character puts the character's right edge on
               the content edge exactly (x 287.80..378.00 at 402pt), rather
               than hanging 45.10pt of him off the screen. `top: 0, bottom: 0`
               makes the vertical a consequence of the row's own height, so a
               font change or a wrapped greeting moves the hero with it.

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
            `on: 'left'` is where the glyphs BEGIN — that is the live defect
            this pass fixes, the streak caption reading "2 ays to 3." under a
            resting bee — and `on: 'right'` is the trailing gutter. */}

        {/* The streak, spoken instead of scored (Colin, UX Design thread
            2026-08-17: quiet morning page). The scoreboard card's numerals
            duplicated the header badge ("7") and Recap's year count; what
            survives is the one line that was ever a goal rather than a
            number. Hidden on error — a streak caption is an assertion about
            a user we failed to read, not one who wrote nothing (Pixel,
            thread 19e90cf8); the entry card below carries the error copy
            alone, where before this state said it twice. */}
        {!error && (
          <StaggeredItem index={0}>
            {/* NOT home any more — P1a moved the residence up to the
                greeting, where the negative space is. What is left here is an
                errand landing site, like `entry-card` below: declared, and
                nothing lands on it yet.

                The geometry this comment used to carry was the resident's at
                size 44 (character 362.97..393.03, 45.77pt of gutter to his
                left) and it is gone with him rather than kept as a record of
                where he was — a coordinate table for a bee that no longer
                lives here is the stalest cargo there is. The caption's own
                measurement survives because it is the caption's: the block
                runs x 24..378 at 402pt wide and the longest string ("You've
                caught every milestone. Keep going.") sets 293.20pt at
                bodySm/PlusJakarta Medium 14, so its glyphs end at 317.20. */}
            <PerchAnchor id="streak-whisper" on="right" at={0.5}>
              <Text style={styles.whisper}>{streakCaption(streak)}</Text>
            </PerchAnchor>
          </StaggeredItem>
        )}

        <StaggeredItem index={1}>
          <PerchAnchor id="entry-card" on="right" at={0.5}>
          {entry ? (
            <View style={styles.quoteCard}>
              <Text style={styles.themeBadge}>{entry.theme}</Text>
              <PaperBlock paper={entry.paper}>
                <Text style={[styles.gratitudeText, { color: paperInk(entry.paper) }]}>"{entry.text}"</Text>
              </PaperBlock>
              {/* DES-16 §4 — "File this to…". Zero hives or a failed hive
                  read both withhold the affordance: the shelf below already
                  owns the zero-hives door and the failure copy, and this
                  card naming a destination class the user can't reach would
                  be the §23.10 failure one register down. */}
              {!hivesError && hives.length > 0 && <FileToHive entry={entry} hives={hives} />}
            </View>
          ) : error ? (
            // No CTA: a failed read can't rule out today already having an
            // entry, and the write button routes into saveEntry's update
            // branch on a day that turns out to be shared — reopening the
            // edit-after-share hazard Pixel's own enumeration had ruled
            // latent (thread 19e90cf8). Placeholder copy; Deezine's when
            // §23 lands.
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>We couldn't reach your journal.</Text>
              <Text style={styles.emptyBody}>Check your connection and try again.</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Today's page is blank.</Text>
              <Text style={styles.emptyBody}>
                One line is enough. Write it, and your day opens.
              </Text>
              <PrimaryButton onPress={() => navigation.getParent()?.navigate('Lock')}>
                Write today's entry
              </PrimaryButton>
            </View>
          )}
          </PerchAnchor>
        </StaggeredItem>

        {/* Private Hives shelf (8b.2/8b.3, WP-1 §26.1). Indices 0–1 above
            are the journal's; this is the next cascade step, so the two
            shelves settle in reading order. The written-state footer that
            used to sit between them narrated exactly what this shelf now IS
            ("share it with your hive") — the affordance replaced its own
            caption in the quiet-page cut. `hivesError` never blanks the
            shelf into nothing — the door card still renders, since it's a
            local navigation target with no data dependency, same reasoning
            as the journal's own error branch not hiding its CTA. */}
        <StaggeredItem index={2}>
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
            </ScrollView>
            {hivesError && (
              <Text style={styles.hiveErrorText}>We couldn't reach your hives right now.</Text>
            )}
          </View>
          </PerchAnchor>
        </StaggeredItem>

        {/* "Writing with others" shelf (ENG-61) — only rendered when
            non-empty, same door-less treatment `FileToHive` above gets for
            an empty/failed read: there is no evergreen local action this
            shelf could show in its place (unlike the private-hives shelf's
            "start a hive" door card), so a zero-row state and a failed read
            both simply withhold the shelf rather than asserting either one. */}
        {contributingHives.length > 0 && (
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
    paddingRight: HERO_CHAR_WIDTH,
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
    right: HERO_CHAR_WIDTH / 2,
    width: 1,
  },
  whisper: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.large,
    padding: 28,
    alignItems: 'center',
    ...theme.shadows.card,
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
    marginBottom: 24,
  },
  quoteCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.large,
    paddingHorizontal: 28,
    paddingVertical: 40,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  themeBadge: {
    ...theme.type.label,
    color: theme.colors.accentDeep,
    backgroundColor: theme.colors.accentDeepWash,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.full,
    marginBottom: 16,
    overflow: 'hidden',
  },
  gratitudeText: {
    fontFamily: theme.fonts.bodyItalic,
    fontSize: 26,
    color: theme.colors.ink,
    textAlign: 'center',
    lineHeight: 37,
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
});
