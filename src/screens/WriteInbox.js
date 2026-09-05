import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { NotesStore } from '../services/NotesStore';
import { SeedsStore, resolveSeedView, nextWakeDelay, SEED_VIEWS } from '../services/SeedsStore';
import { bloomDateLabel } from '../utils/seedDraft';
import { PressableScale } from '../components/PressableScale';
import { Avatar } from '../components/Avatar';
import { ScreenHeader } from '../components/ScreenHeader';
import { LoadState, LOAD_STATES, resolveListView } from '../components/LoadState';

// R-WD-2 — one typed inbox. Successor to `NotesInbox.js` and `SeedsInbox.js`,
// both deleted in the same commit.
//
// The direction already ruled 09-04 and confirmed by Colin: a seed is a
// PROPERTY OF A NOTE (a delivery date), not a different place. Two inboxes
// that behaved almost identically were two things to learn for one idea, and
// `SeedsInbox`'s own header said as much while still being a second screen.
// So the two lists merge and each row is typed by its delivery state: a note
// that arrived, or a note still in the ground waiting for its day.
//
// WHAT MOVED, AND WHAT DELIBERATELY DID NOT
//
// The MECHANICS are the seeds side's, unchanged: `resolveSeedView` decides
// whether a seal has opened, `direction` decides whether there is text this
// reader is entitled to, and the reveal is a refetch rather than a timer
// (§22.1/§22.2). Nothing about how a seed blooms is re-decided here.
//
// The CHROME is the seeds side's too, and that IS a behaviour change on the
// notes half, named rather than smuggled: `NotesInbox` tracked a bare
// `loading` boolean and rendered "No notes yet." on a failed read, so an
// outage and an empty inbox were the same screen. This surface derives its
// view through `resolveListView`, so notes gain the `unknown` and `stale`
// states they never had. That is §23.1 reaching a screen that predated it,
// not new design.
//
// The word "sealed" does not appear on this surface. R-WD-3's vocabulary
// guard: sealing is hive and rotation language, a held note is PLANTED, and
// the leaf that used to be a door in the Honeycomb header survives here as
// the mark on a note that is still in the ground.

// WHICH SIDE EACH SHIPPED DIFFERENCE RESOLVED TO, stated once so the merge
// reads as ONE surface rather than as a mongrel of two. The answer is the same
// every time: THIS IS THE SEEDS INBOX WITH THE NOTES ROWS FOLDED INTO IT.
// Merging in one direction is what stops a reader having to ask, per row,
// which parent a value came from. Six visible differences, and every one of
// them is a change on the notes half:
//
//   * top inset 64, not the seeds side's 24. This is the one place the seeds
//     side was the outlier: it is a modal with `headerShown: false`, so 24
//     sat its header in the notch region, and 64 is what the other three
//     write screens all shipped.
//   * direction pill: the ink fill, not the notes side's yellow wash with an
//     accent border. The ink pill is the app's selected-control register.
//   * row name: `bodyLg`, not `bodySm` semibold. A person's name is the row's
//     subject and it reads at the subject's size.
//   * row padding 16, not 14.
//   * empty state: the `washYellow` card, not a bare centred block — §23.3's
//     tell only works if `empty` wears a wash where `unknown` deliberately
//     wears none.
//   * detail body: `bodyLg`, not the notes side's bespoke italic. See the
//     note on `detailContent` below; that one is a real typographic change
//     and it is argued where it lands rather than here.

const DIRECTIONS = { RECEIVED: 'received', SENT: 'sent' };
const KINDS = { NOTE: 'note', SEED: 'seed' };

// 26pt glyph + 12pt slop each side = a 50pt target, over the 44pt floor.
const DISMISS_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

const formatTimestamp = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' +
    date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

// PLACEHOLDER-FREE COPY, gathered here rather than scattered through the JSX,
// same reason `PlantSeed.js` gathered its own: replacing wording is one hunk.
// The two empty states are Lumen's, ruled at the mock round (R-WD-4).
const COPY = {
  unknown: {
    title: "Couldn't reach your notes",
    body: 'Something went wrong on the way to your hive.',
    action: 'Try again',
  },
  stale: {
    label: 'This list may be out of date.',
    action: 'Refresh',
  },
  retryAccessibilityLabel: 'Try loading your notes again',
  empty: {
    [DIRECTIONS.RECEIVED]: {
      title: 'Nothing here yet.',
      body: 'Notes sent to you arrive here. Planted notes wait for their day.',
    },
    [DIRECTIONS.SENT]: {
      title: "You haven't written to anyone yet.",
      body: 'Write a note now, or plant one for a day ahead.',
    },
  },
};

// A note and a seed carry different columns, and every branch below reads this
// one derived shape instead of asking "which table did this come from" five
// times. `planted` is the only typed state a row renders differently, and it
// is a fact about DELIVERY, not about which store answered.
const typeItem = (item, direction) => {
  const person = direction === DIRECTIONS.RECEIVED ? item.sender : item.recipient;
  if (item.kind === KINDS.NOTE) {
    return {
      person,
      planted: false,
      // A sent note's own text is always the sender's to read back.
      showsText: true,
      // The received-and-unread mark. A sent note has no such state.
      marked: direction === DIRECTIONS.RECEIVED && !item.read_at,
    };
  }
  const planted = resolveSeedView(item).view === SEED_VIEWS.SEALED;
  return {
    person,
    planted,
    // A planted seed you SENT hands back its own text: the sender wrote it,
    // the server returns it (`seed_contents_select_after_bloom` names
    // `sender_id` with no bloom condition), and hiding a person's own sentence
    // from them would be a seal pointed the wrong way. A planted seed you were
    // sent has no text on this device and never did.
    showsText: !planted || direction === DIRECTIONS.SENT,
    marked: direction === DIRECTIONS.RECEIVED && !planted && !item.opened_at,
  };
};

const ItemRow = ({ item, direction, onPress }) => {
  const { person, planted, showsText, marked } = typeItem(item, direction);
  return (
    <PressableScale onPress={() => onPress(item)} style={styles.row}>
      <Avatar name={person?.display_name} avatarUrl={person?.avatar_url} size={40} />
      <View style={styles.rowText}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowName}>{person?.display_name ?? 'Someone'}</Text>
          {marked && <View style={styles.markedDot} />}
        </View>
        {showsText && item.content != null ? (
          <Text style={styles.rowPreview} numberOfLines={1}>
            {item.content}
          </Text>
        ) : item.kind === KINDS.SEED ? (
          // THE KIND TEST IS NOT REDUNDANT, and it is the one place merging
          // two tables into one row could quietly lie. "Blooms {date}" names
          // `bloom_at`, a column a NOTE DOES NOT HAVE — and this is a
          // fallback, so it is exactly where a row with no text lands.
          // `new Date(undefined)` is an Invalid Date and `bloomDateLabel`
          // hands back the string "Invalid Date", so an untyped fallback
          // would print a promise about a day that does not exist.
          //
          // Reachability, stated rather than implied: `notes.content` is
          // `not null` (20260813000001_notes_schema.sql:14), so a note cannot
          // reach this arm today. The test is not a guard on a hypothetical —
          // it is the branch being written about the population it describes,
          // which is what makes the sentence true of every row that can reach
          // it.
          <Text style={styles.rowPlanted} numberOfLines={1}>
            Blooms {bloomDateLabel(new Date(item.bloom_at))}.
          </Text>
        ) : null}
      </View>
      {/* The planted mark. R-WD-4: the leaf door dies in R-WD-1 and the leaf
          survives here, on a note that is still in the ground. It replaces the
          shipped `lock-closed-outline`, which was a seal mark on the one
          vocabulary R-WD-3 rules off this whole surface. */}
      {planted && <Ionicons name="leaf-outline" size={16} color={theme.colors.inkSoft} />}
    </PressableScale>
  );
};

const ItemDetail = ({ item, direction, onClose }) => {
  const { person, planted, showsText } = typeItem(item, direction);
  return (
    <View style={styles.detailOverlay}>
      <PressableScale onPress={onClose} containerStyle={styles.detailCloseAnchor} haptic={null}>
        <Ionicons name="close" size={24} color={theme.colors.inkSoft} />
      </PressableScale>
      <View style={styles.detailCard}>
        <Avatar name={person?.display_name} avatarUrl={person?.avatar_url} size={56} />
        <Text style={styles.detailName}>
          {direction === DIRECTIONS.RECEIVED
            ? `From ${person?.display_name ?? 'Someone'}`
            : `To ${person?.display_name ?? 'Someone'}`}
        </Text>
        <Text style={styles.detailTimestamp}>
          {item.kind === KINDS.NOTE
            ? formatTimestamp(item.created_at)
            : planted
            ? `Blooms ${bloomDateLabel(new Date(item.bloom_at))}`
            : `Bloomed ${bloomDateLabel(new Date(item.bloom_at))}`}
        </Text>
        {showsText && item.content != null ? (
          <Text style={styles.detailContent}>"{item.content}"</Text>
        ) : item.kind === KINDS.SEED ? (
          // Says what is true and promises nothing about a notification the
          // app does not send. Not an error state and it must not read as one:
          // nothing has gone wrong, the date is simply ahead of us. R-WD-4
          // replaced "This one is still sealed. Come back on {date}." with the
          // planted vocabulary, and the sentence kept its job.
          //
          // Kind-tested for the same reason as the row above: this sentence
          // names a column only a seed carries.
          <Text style={styles.detailPlanted}>This one blooms on {bloomDateLabel(new Date(item.bloom_at))}.</Text>
        ) : null}
      </View>
    </View>
  );
};

// WHEN AN ITEM ARRIVED, which is NOT when it was written. A note arrives the
// moment it is sent, so `created_at` is both. A seed does not: it is written
// once and arrives on its bloom date, and those can be a year apart. Keying
// the whole list on `created_at` sorts a seed that bloomed this morning below
// a note from last week, on the one screen whose job is to show you what has
// just reached you. Caught in the render, not in the source — the two shipped
// inboxes never had to answer this because neither held both kinds.
const arrivedAt = (item) => new Date(item.kind === KINDS.SEED ? item.bloom_at : item.created_at);

// THE ONE ORDERING RULE for a list that used to be two lists with two
// orderings. `NotesInbox` read newest first; `SeedsInbox` read soonest to open
// first, "what the Hive leads with is what blooms next". Merging them needs one
// rule, and it is the union of both intentions rather than a new one:
//
//   what is still coming, soonest first — then what has arrived, most recently
//   arrived first
//
// Written as an explicit partition instead of a clever sort key, because the
// two groups are ordered on DIFFERENT columns in OPPOSITE directions and a
// single comparator that did both would be a puzzle for whoever reads it next.
// Note that both groups are now keyed on the same QUESTION — when does this
// reach the reader — and differ only in whether the answer is ahead or behind.
const orderItems = (items, direction) => {
  const waiting = [];
  const arrived = [];
  for (const item of items) (typeItem(item, direction).planted ? waiting : arrived).push(item);
  waiting.sort((a, b) => new Date(a.bloom_at) - new Date(b.bloom_at));
  arrived.sort((a, b) => arrivedAt(b) - arrivedAt(a));
  return [...waiting, ...arrived];
};

export const WriteInbox = ({ navigation }) => {
  const [direction, setDirection] = useState(DIRECTIONS.RECEIVED);
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  // Only the read OUTCOME is tracked. Which of the five states renders is
  // `resolveListView`'s call, made from this plus the rows actually in hand —
  // §23.1, and the reason `empty` can never be the default rendering of "I am
  // holding no rows."
  const [readState, setReadState] = useState(LOAD_STATES.LOADING);
  const [openItemKey, setOpenItemKey] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    // No `setReadState(LOADING)` on a re-read that has rows behind it: with
    // content in hand `resolveListView` maps LOADING to `ready`, so the list
    // stays put and a refresh never blanks a screen that was fine (§23.1a).
    //
    // ONE `Promise.all` OVER FOUR READS, and that is the load-bearing choice.
    // Either table failing is one failure of one list, because the merged
    // inbox cannot honestly render "here is everything" while holding half of
    // it — a screen showing only notes after the seeds read threw would be
    // asserting an absence it never measured, which is the §22.1/§23.1 defect
    // in its list form.
    const [receivedNotes, sentNotes, receivedSeeds, sentSeeds] = await Promise.all([
      NotesStore.listReceived(),
      NotesStore.listSent(),
      SeedsStore.listReceived(),
      SeedsStore.listSent(),
    ]);
    const tag = (rows, kind) => rows.map((row) => ({ ...row, kind, key: `${kind}:${row.id}` }));
    setReceived([...tag(receivedNotes, KINDS.NOTE), ...tag(receivedSeeds, KINDS.SEED)]);
    setSent([...tag(sentNotes, KINDS.NOTE), ...tag(sentSeeds, KINDS.SEED)]);
    setReadState(LOAD_STATES.READY);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      load().catch((err) => {
        if (cancelled) return;
        // Recorded as "the read did not return", not as a view. Whether that
        // shows as `stale` or `unknown` depends on what is still on screen,
        // which is render-time knowledge this closure does not have.
        console.warn('Failed to load the write inbox', err);
        setReadState(LOAD_STATES.UNKNOWN);
      });
      return () => {
        cancelled = true;
      };
    }, [load, reloadKey])
  );

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  // §22.2's wake, unchanged in mechanism and now reading one list instead of
  // two. Not a countdown that opens a seal — a timer whose only job is to ask
  // the server again, because the text was never on this device.
  //
  // Scheduled over BOTH directions rather than the visible one: a note
  // blooming in the side you are not looking at should be open when you get
  // there, and the toggle is not a reload. Notes carry no `bloom_at`, so
  // `nextWakeDelay` reads straight past them.
  const timer = useRef(null);
  useEffect(() => {
    const delay = nextWakeDelay([...received, ...sent].filter((item) => item.kind === KINDS.SEED));
    if (delay == null) return undefined;
    timer.current = setTimeout(refetch, delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
  }, [received, sent, refetch]);

  const rows = direction === DIRECTIONS.RECEIVED ? received : sent;
  const items = useMemo(() => orderItems(rows, direction), [rows, direction]);
  const listView = resolveListView(readState, items.length);

  // The open detail is DERIVED from the list, never a snapshot taken at tap
  // time — and that distinction is this screen's whole thesis, not a style
  // preference. §22.2's reveal IS the refetch, and the refetch replaces these
  // row objects. A captured item would keep showing a planted note the server
  // has already opened underneath it, on the one surface whose job is to
  // notice, and it would fail exactly for the user who opened one to wait on
  // it. By key, the open card transitions planted -> bloomed with the row
  // behind it.
  //
  // Resolving to null (unplanted from another device between reads) simply
  // closes the overlay. Nothing to announce: it is gone.
  const openItem = openItemKey == null ? null : items.find((i) => i.key === openItemKey) ?? null;

  const handleOpen = (item) => {
    setOpenItemKey(item.key);
    if (direction !== DIRECTIONS.RECEIVED) return;

    if (item.kind === KINDS.NOTE) {
      if (item.read_at) return;
      NotesStore.markRead(item.id)
        .then(() =>
          setReceived((list) =>
            list.map((i) => (i.key === item.key ? { ...i, read_at: new Date().toISOString() } : i))
          )
        )
        .catch((err) => console.warn('Failed to mark note read', err));
      return;
    }

    // 8.11 hangs off `opened_at`, and Postgres refuses the write before bloom
    // (`seeds_recipient_open_only`) — so the guard here is not belt-and-braces,
    // it is the difference between a no-op and a rejected request on every tap
    // of a planted note.
    if (resolveSeedView(item).view !== SEED_VIEWS.BLOOMED || item.opened_at) return;
    SeedsStore.markOpened(item.id)
      .then(() =>
        setReceived((list) =>
          list.map((i) => (i.key === item.key ? { ...i, opened_at: new Date().toISOString() } : i))
        )
      )
      .catch((err) => console.warn('Failed to mark note opened', err));
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow="GRATITUDE NOTES"
          title="Notes"
          left={
            // This screen is a modal over the tab bar with headerShown:false
            // global — this chevron is its only exit (check-modal-dismiss).
            // chevron-down because that is the way the card will go; an X
            // would read as cancel, and putting an inbox away discards
            // nothing. Idiom promoted from Account.js.
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={DISMISS_HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="chevron-down" size={26} color={theme.colors.ink} />
            </TouchableOpacity>
          }
          right={
            <PressableScale
              onPress={() => navigation.navigate('Compose')}
              haptic={null}
              accessibilityLabel="Write a note"
            >
              <Ionicons name="add-circle" size={28} color={theme.colors.ink} />
            </PressableScale>
          }
        />

        <View style={styles.tabRow}>
          <PressableScale
            onPress={() => setDirection(DIRECTIONS.RECEIVED)}
            style={[styles.tab, direction === DIRECTIONS.RECEIVED && styles.tabActive]}
          >
            <Text style={[styles.tabText, direction === DIRECTIONS.RECEIVED && styles.tabTextActive]}>
              Received
            </Text>
          </PressableScale>
          <PressableScale
            onPress={() => setDirection(DIRECTIONS.SENT)}
            style={[styles.tab, direction === DIRECTIONS.SENT && styles.tabActive]}
          >
            <Text style={[styles.tabText, direction === DIRECTIONS.SENT && styles.tabTextActive]}>
              Sent
            </Text>
          </PressableScale>
        </View>

        {/* §23.7 — the stale line comes BEFORE the content it is about, so a
            screen reader reaches the caveat before the rows it qualifies. */}
        {listView === LOAD_STATES.STALE && (
          <LoadState
            state={LOAD_STATES.STALE}
            onRetry={refetch}
            staleLabel={COPY.stale.label}
            staleActionLabel={COPY.stale.action}
            retryAccessibilityLabel={COPY.retryAccessibilityLabel}
            style={styles.stale}
          />
        )}

        {listView === LOAD_STATES.LOADING && (
          <ActivityIndicator color={theme.colors.accent} style={styles.loader} />
        )}

        {listView === LOAD_STATES.UNKNOWN && (
          <LoadState
            state={LOAD_STATES.UNKNOWN}
            onRetry={refetch}
            title={COPY.unknown.title}
            body={COPY.unknown.body}
            actionLabel={COPY.unknown.action}
            retryAccessibilityLabel={COPY.retryAccessibilityLabel}
          />
        )}

        {/* Reachable only through `resolveListView`, and that returns EMPTY
            only from a read that returned. §23.1: emptiness is a positive
            claim about the user's data, so it needs a read to stand on. */}
        {listView === LOAD_STATES.EMPTY && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{COPY.empty[direction].title}</Text>
            <Text style={styles.emptyBody}>{COPY.empty[direction].body}</Text>
          </View>
        )}

        {(listView === LOAD_STATES.READY || listView === LOAD_STATES.STALE) &&
          items.map((item) => (
            <ItemRow key={item.key} item={item} direction={direction} onPress={handleOpen} />
          ))}
      </ScrollView>

      {openItem && (
        <ItemDetail item={openItem} direction={direction} onClose={() => setOpenItemKey(null)} />
      )}
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
    paddingTop: 64,
    paddingBottom: 48,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  tabActive: {
    backgroundColor: theme.colors.ink,
    borderColor: theme.colors.ink,
  },
  tabText: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
  },
  tabTextActive: {
    color: theme.colors.surface,
  },
  stale: {
    marginBottom: 12,
  },
  loader: {
    marginTop: 32,
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
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowName: {
    ...theme.type.bodyLg,
    color: theme.colors.textPrimary,
  },
  // `accentDeep` at 7pt. Both shipped inboxes drew this dot identically and
  // both inherited the same open item: `accentDeep` (#FF7A00) on `surface`
  // (#FFFFFF) is 2.6133:1, under the 3:1 floor for a graphical object that
  // carries the only signal a row is unread. It is not fixed here and no local
  // hex is invented for it — that is the R61 failure mode, and it would have to
  // be un-invented when the token retune lands. Two sites became one; the open
  // item is unchanged and still waits on the retune.
  markedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.accentDeep,
  },
  rowPreview: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    marginTop: 2,
  },
  // Same register as the preview it stands in for — waiting is a state, not a
  // quieter kind of content, so it does not get a quieter colour. §23.9.2:
  // `inkSoft` is already a dim and dimming it again puts it under 4.5:1.
  rowPlanted: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    marginTop: 2,
  },
  // §23.3's tell only works if `empty` wears a wash on this screen, since
  // `unknown` deliberately wears none — the difference has to be visible
  // side by side, not just against some other screen's empty state.
  // inkSoft on #FFF3C4 = 5.67:1, ink = 15.39:1. Both measured, not assumed.
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
  // `absoluteFill`, NOT `absoluteFillObject` — the latter does not exist in RN
  // 0.86.2 (`StyleSheet.absoluteFill` is the plain object at
  // StyleSheetExports.js:21; there is no `absoluteFillObject` export).
  // Spreading the missing name yields an overlay with no positioning at all,
  // which is the bug that made FlyingBee invisible and was fixed in d0def1c.
  detailOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  // `top: 24` sits under the Dynamic Island on notch-class devices; 64 clears
  // it. R43 CHANNEL (Lumen, 2026-08-29, MVP1 screen pass): positioning belongs
  // on `containerStyle`, never `style`. `PressableScale` puts `style` on its
  // inner Animated.View and `containerStyle` on the outer Pressable — so an
  // absolute inset written to `style` is resolved against the Pressable's own
  // collapsed box instead of this screen, and the control renders wherever
  // flow drops it. Photographed mid-screen on PackageOpen and MemoryLane
  // before this split.
  detailCloseAnchor: {
    position: 'absolute',
    top: 64,
    right: 24,
  },
  detailCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: 32,
    alignItems: 'center',
  },
  detailName: {
    ...theme.type.h2,
    color: theme.colors.textPrimary,
    marginTop: 12,
  },
  detailTimestamp: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    marginTop: 4,
  },
  // THE ONE VISIBLE TYPOGRAPHIC CHANGE IN THE MERGE, and it is on the note
  // detail. The notes side drew a quoted note in a bespoke triple
  // (`bodyItalic` / 18 / 26); the seeds side used the `bodyLg` token (18 / 27,
  // regular). Same size, and the merge takes the token.
  //
  // Two reasons, and the second is the one that decides it. The card already
  // marks the sentence as quoted — with actual quotation marks — so italic is
  // a second mark for the same job, and a whole note set in italic is harder
  // to read than the thing it is quoting. And a bespoke
  // fontFamily+fontSize+lineHeight triple on one screen is exactly the local
  // invention the type scale exists to retire: one register for a quoted
  // sentence, named, rather than two that happen to agree on their size.
  //
  // Named rather than smuggled: a reader who knew the note detail as italic
  // will see the difference, and @Lumen or Colin may overrule it.
  detailContent: {
    ...theme.type.bodyLg,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: 20,
  },
  detailPlanted: {
    ...theme.type.bodyLg,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginTop: 20,
  },
});
