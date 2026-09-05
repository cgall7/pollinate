import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../constants/theme';
import { HoneycombStore } from '../services/HoneycombStore';
import { NotesStore, NOTE_CONTENT_MAX } from '../services/NotesStore';
import { SeedsStore, SEED_CONTENT_MAX } from '../services/SeedsStore';
import {
  bloomDateLabel,
  bloomFloor,
  bloomHint,
  plantedHint,
  seedCtaLabel,
  validateSeedDraft,
  SEED_DRAFT_REASONS,
} from '../utils/seedDraft';
import { PrimaryButton } from '../components/PrimaryButton';
import { PressableScale } from '../components/PressableScale';
import { LoadState, LOAD_STATES, resolveListView } from '../components/LoadState';
import { Avatar } from '../components/Avatar';
import { ScreenHeader } from '../components/ScreenHeader';

// R-WD-3 — one compose surface, where delivery time is the only variable.
// Successor to `ComposeNote.js` and `PlantSeed.js`, both deleted in the same
// commit.
//
// The two screens were 90% the same screen: same recipient chips off the same
// `listConnections`, same "I am grateful for..." stem, same PrimaryButton,
// same 500-character cap. The 10% that differed was a date. So a seed stops
// being a second kind of writing and becomes what `PlantSeed.js`'s own header
// already called it — a note that arrives late.
//
// VOCABULARY GUARD (R-WD-3), and this surface is the strictest position for
// it: "seal" is hive and rotation language and NEVER appears here. A held note
// is PLANTED. The shipped `sealHint` was the fourth site of the sweep and the
// only one on a compose screen; it is `plantedHint` now, and the sentence kept
// its job.
//
// WHAT THE MERGE INHERITED, DELIBERATELY, AND IT IS A BEHAVIOUR CHANGE ON THE
// NOTES HALF. `ComposeNote` loaded its recipients with `.catch(console.warn)`
// and then rendered "Add someone to your hive first" whenever the list came
// back empty, so an outage was indistinguishable on screen from having no
// friends — which is the defect `PlantSeed`'s own header called out by name
// and refused to copy. This surface takes the seeds side's discipline whole:
// `LoadState`, `resolveListView`, and the four-outcome recipient list. Notes
// gain an `unknown` state they never had. Named here rather than arriving as
// an unexplained assertion count.

// SAME MERGE DIRECTION AS THE INBOX, stated once: THIS IS THE PLANT SCREEN
// WITH THE DATE MADE OPTIONAL. Everything the two shipped screens disagreed
// about resolves to the seeds side, and the disagreements were small — the
// recipient section's four outcomes, the hint spacing, and a char count that
// no longer carries its own bottom margin because a section follows it now.
// The note field, the stem, the chips and the 500-character cap were already
// identical.

// R-WD-3's DELIVERY SEGMENT — the ruled shape of this surface, and the reason
// there is one door instead of two. Exported rather than inlined because it is
// the surface's identity, not a local flag: `check-nectar-consent`'s
// `noNectarOnCompose` control cites this name to prove it is reading a compose
// file that still IS the ruled surface, so a rename here is a spec revisit
// rather than a quiet edit.
// Spec: GUIDES/POLLINATE_OPENDAY_NECTAR_RECUT_SPEC.md R-WD-3 (Lumen,
// 2026-09-05).
export const DELIVERY_MODES = { NOW: 'now', ON_A_DATE: 'on-a-date' };

const DELIVERY_LABELS = {
  [DELIVERY_MODES.NOW]: 'Now',
  [DELIVERY_MODES.ON_A_DATE]: 'On a date',
};

// PLACEHOLDER COPY gathered here rather than scattered through the JSX, so
// replacing wording is one hunk. Written against Sage's constraint: it must not
// be reassuring. "We'll try again shortly" is a promise nothing in this code
// keeps, and "nothing you've written is affected" is a claim about data the
// screen never read. What the screen can honestly say is which thing it could
// not reach, and that pressing the button tries that thing again.
const COPY = {
  unknown: {
    title: 'Your hive didn’t load',
    body: 'We couldn’t reach it just now.',
    action: 'Try again',
  },
  stale: {
    label: 'This list may be out of date.',
    action: 'Refresh',
  },
  // §23.7 — the visible label is short because it sits under a sentence that
  // already named what failed. A screen reader user arriving at the control has
  // no such context, so the spoken label carries the object.
  retryAccessibilityLabel: 'Try loading your hive again',
};

export const Compose = ({ navigation }) => {
  const [connections, setConnections] = useState([]);
  // How the last read ENDED — one of LOADING / READY / UNKNOWN. Not what the
  // section renders: `resolveListView` derives that from this plus the rows in
  // hand. Keeping the two apart is what stops the failure branch from having
  // to know what it is holding.
  const [readState, setReadState] = useState(LOAD_STATES.LOADING);
  const [recipientId, setRecipientId] = useState(null);
  const [content, setContent] = useState('');
  const [delivery, setDelivery] = useState(DELIVERY_MODES.NOW);
  const [bloomAt, setBloomAt] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      // `useFocusEffect` re-runs this on every focus. Setting LOADING here is
      // unconditionally safe *because* it is a read outcome and not a view:
      // with rows already in hand `resolveListView` maps it to `ready`, so
      // coming back on bad wifi never blanks a list the user was picking from
      // (§23.1a).
      setReadState(LOAD_STATES.LOADING);
      HoneycombStore.listConnections()
        .then((list) => {
          if (cancelled) return;
          setConnections(list);
          setReadState(LOAD_STATES.READY);
        })
        .catch((err) => {
          // Surfaced, not swallowed. Without this branch an outage reads as
          // "you have no friends," which is a different and more discouraging
          // sentence than the true one.
          if (cancelled) return;
          console.warn('Failed to load connections', err);
          setReadState(LOAD_STATES.UNKNOWN);
        });
      return () => {
        cancelled = true;
      };
    }, [reloadKey])
  );

  // §23.1 as a call, not a convention. The `empty` branch below is reachable
  // only through this, and this returns `empty` only from a read that returned.
  const recipientView = resolveListView(readState, connections.length);

  const retryConnections = useCallback(() => setReloadKey((k) => k + 1), []);

  const recipientName = useMemo(
    () => connections.find((person) => person.id === recipientId)?.display_name ?? null,
    [connections, recipientId]
  );

  // DELIBERATELY NOT NAMED `planting`. `seedCtaLabel(draft, planting)` already
  // uses that word for "a plant is IN FLIGHT" — a different question from
  // "which delivery mode is selected", and the two would sit one argument
  // apart at the same call site. This one is the MODE; `sending` is the
  // in-flight flag and it is what `seedCtaLabel` gets.
  const onADate = delivery === DELIVERY_MODES.ON_A_DATE;
  const contentMax = onADate ? SEED_CONTENT_MAX : NOTE_CONTENT_MAX;
  const dateLabel = bloomDateLabel(bloomAt);

  // Computed once per mount rather than per render: `minimumDate` and the
  // picker's fallback `value` both take it, and a fresh Date on every keystroke
  // would churn both props. It can go stale if the screen is left open for a
  // day, which is exactly why `validateSeedDraft` re-checks the date below
  // instead of trusting the picker to have constrained it.
  const earliest = useMemo(() => bloomFloor(), []);

  // The plant rule is the shared one, unchanged: `seedDraft.js` exists so this
  // screen and `SeedsStore.plantSeed` cannot drift about what is plantable, and
  // `check-plant-seed.mjs` asserts the two answers are the same answer.
  //
  // The SEND rule stays inline, as it shipped. A note has exactly two
  // requirements and both are visible in the form; lifting a two-clause ladder
  // into a shared module would be a second rule to keep in step for no reader
  // benefit, and `seedDraft.js` earns its existence by mirroring guards that
  // live in another file, which a note has none of.
  const draft = validateSeedDraft({ recipientId, content, bloomAt });
  const canSubmit = onADate ? draft.ok : Boolean(recipientId) && Boolean(content.trim());

  // Names the one thing standing between here and sendable, in priority
  // order — recipient before text, because an unpicked chip is the likelier
  // gap and a form that only complains about the field you never see (an
  // empty hive) is worse than one that just says so. A dead "Send" told
  // Colin nothing when he had typed a note but never tapped a chip.
  const ctaLabel = onADate
    ? seedCtaLabel(draft, sending)
    : sending
    ? 'Sending…'
    : !recipientId
    ? 'Pick someone'
    : !content.trim()
    ? 'Write something'
    : 'Send';

  // Only the two non-obvious refusals get said out loud. "Pick someone" and
  // "write something" are already legible from an empty form, and a form that
  // scolds you for not having filled it in yet is worse than a quiet one; a
  // date in the past or 500 characters exceeded is not something the screen
  // should let happen at all, so if either shows up it is a real disagreement
  // worth reading.
  const draftWarning =
    onADate &&
    (draft.reason === SEED_DRAFT_REASONS.TOO_LONG || draft.reason === SEED_DRAFT_REASONS.DATE_IN_PAST)
      ? draft.message
      : null;

  const handleSubmit = async () => {
    if (!canSubmit || sending) return;
    setSending(true);
    setError(null);
    try {
      if (onADate) await SeedsStore.plantSeed(recipientId, content, bloomAt);
      else await NotesStore.sendNote(recipientId, content);
      navigation.goBack();
    } catch (err) {
      // Deliberately a state on this screen rather than a rejection that
      // leaves a spinner behind: it has to say something true and leave the
      // typed text intact.
      //
      // Authored copy, not the raw rail message — Sage, thread 14492cf2 §4:
      // `err.message ?? copy` puts the string we didn't write in front, and
      // the string we did in the branch users see least.
      console.warn(onADate ? 'Failed to plant note' : 'Failed to send note', err);
      setError(onADate ? 'Could not plant that note. Try again.' : 'Could not send that note. Try again.');
    } finally {
      setSending(false);
    }
  };

  const onPickDate = (event, selected) => {
    // Android fires once with type 'set' or 'dismissed' and closes itself;
    // iOS keeps the spinner inline and reports every scroll.
    if (Platform.OS !== 'ios') setPickerOpen(false);
    if (event?.type === 'dismissed') return;
    if (selected) setBloomAt(selected);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow="GRATITUDE NOTE"
          title="Write a note"
          right={
            <PressableScale onPress={() => navigation.goBack()} haptic={null} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={theme.colors.inkSoft} />
            </PressableScale>
          }
        />

        <Text style={styles.sectionLabel}>TO</Text>

        {/* §23.7 — the stale line goes BEFORE the content it is about, so a
            screen reader reaches "this list may be out of date" on the way to
            the list rather than after picking from it. */}
        {recipientView === LOAD_STATES.STALE && (
          <LoadState
            state={LOAD_STATES.STALE}
            onRetry={retryConnections}
            staleLabel={COPY.stale.label}
            staleActionLabel={COPY.stale.action}
            retryAccessibilityLabel={COPY.retryAccessibilityLabel}
            style={styles.staleRow}
          />
        )}

        {recipientView === LOAD_STATES.LOADING && (
          <ActivityIndicator color={theme.colors.accent} style={styles.loader} />
        )}

        {recipientView === LOAD_STATES.UNKNOWN && (
          <LoadState
            state={LOAD_STATES.UNKNOWN}
            onRetry={retryConnections}
            title={COPY.unknown.title}
            body={COPY.unknown.body}
            actionLabel={COPY.unknown.action}
            retryAccessibilityLabel={COPY.retryAccessibilityLabel}
            style={styles.unknownCard}
          />
        )}

        {recipientView === LOAD_STATES.EMPTY && (
          <Text style={styles.emptyBody}>Add someone to your hive first. Then you can write to them.</Text>
        )}

        {(recipientView === LOAD_STATES.READY || recipientView === LOAD_STATES.STALE) && (
          <>
            {/* The row reads as decoration without this — chips alone didn't
                tell Colin a tap here was required before send could enable. */}
            {!recipientId && <Text style={styles.hint}>Choose who this note is for.</Text>}
            <View style={styles.recipientRow}>
              {connections.map((person) => (
                <PressableScale
                  key={person.id}
                  onPress={() => setRecipientId(person.id)}
                  style={[styles.recipientChip, recipientId === person.id && styles.recipientChipSelected]}
                  accessibilityLabel={person.display_name}
                  accessibilityState={{ selected: recipientId === person.id }}
                >
                  <Avatar name={person.display_name} avatarUrl={person.avatar_url} size={40} />
                  <Text style={styles.recipientName} numberOfLines={1}>
                    {person.display_name}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>NOTE</Text>
        <TextInput
          style={styles.textInput}
          placeholder="I am grateful for..."
          placeholderTextColor={theme.colors.textSecondary}
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={contentMax}
          editable={!sending}
        />
        <Text style={styles.charCount}>
          {content.length}/{contentMax}
        </Text>

        {/* THE ONE VARIABLE. Two options, and choosing the second reveals the
            date field — R-WD-3. The pill shape is the app's shipped segment
            idiom (the inbox direction toggle), not a new control. */}
        <Text style={styles.sectionLabel}>DELIVERY</Text>
        {/* In Now mode the segment is the LAST thing before the CTA, and 8pt
            of gap made the two read as one control in the render. The wider
            gap is the one `ComposeNote` shipped above its own button (its
            char count carried marginBottom 24); in On a date mode the hint and
            the date row supply their own spacing and the segment keeps the
            tight gap that groups it with what it reveals. */}
        <View style={[styles.segmentRow, !onADate && styles.segmentRowLast]}>
          {Object.values(DELIVERY_MODES).map((mode) => (
            <PressableScale
              key={mode}
              onPress={() => setDelivery(mode)}
              disabled={sending}
              style={[styles.segment, delivery === mode && styles.segmentActive]}
              accessibilityLabel={DELIVERY_LABELS[mode]}
              accessibilityState={{ selected: delivery === mode }}
            >
              <Text style={[styles.segmentText, delivery === mode && styles.segmentTextActive]}>
                {DELIVERY_LABELS[mode]}
              </Text>
            </PressableScale>
          ))}
        </View>

        {onADate && (
          <>
            {/* ONE HINT AT A TIME, and the render caught this rather than the
                source. Both sentences are ruled and both keep their exact
                words; what changed is WHEN each is said.

                `plantedHint` answers "what does On a date mean" and
                `bloomHint` answers "which day", so once a day is picked the
                second says everything the first said and names the date as
                well: "…won't see this until then." sitting three lines above
                "…won't see this until December 25, 2026." reads as the app
                saying the same thing twice. It was invisible on the shipped
                screen only because the two sat a whole section apart, with
                the seal hint under the note field and the bloom hint under
                the date.

                So the general promise renders while there is no date to name,
                and gives way to the specific one. No string moved and neither
                frozen gate row moves; this is a placement call, and @Lumen's
                to overrule. */}
            {!dateLabel && <Text style={styles.hint}>{plantedHint(recipientName)}</Text>}

            <Text style={styles.sectionLabel}>BLOOMS ON</Text>
            <PressableScale
              onPress={() => setPickerOpen(true)}
              style={styles.dateRow}
              disabled={sending}
              accessibilityLabel={dateLabel ? `Blooms on ${dateLabel}` : 'Choose when this blooms'}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.inkSoft} />
              <Text style={[styles.dateValue, !bloomAt && styles.datePlaceholder]}>
                {dateLabel ?? 'Choose when this blooms'}
              </Text>
            </PressableScale>
            {pickerOpen && (
              <DateTimePicker
                value={bloomAt ?? earliest}
                mode="date"
                minimumDate={earliest}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onPickDate}
              />
            )}
            {dateLabel && <Text style={styles.hint}>{bloomHint(recipientName, dateLabel)}</Text>}
          </>
        )}

        {draftWarning && <Text style={styles.warning}>{draftWarning}</Text>}
        {error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton onPress={handleSubmit} disabled={!canSubmit || sending}>
          {ctaLabel}
        </PrimaryButton>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundWriting,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 64,
    paddingBottom: 48,
  },
  sectionLabel: {
    ...theme.type.label,
    color: theme.colors.inkSoft,
    marginBottom: 12,
    marginTop: 8,
  },
  loader: {
    marginBottom: 16,
  },
  emptyBody: {
    ...theme.type.bodySm,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  staleRow: {
    marginBottom: 12,
  },
  unknownCard: {
    marginBottom: 16,
  },
  recipientRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  recipientChip: {
    alignItems: 'center',
    width: 68,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.large,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  recipientChipSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.washYellow,
  },
  recipientName: {
    ...theme.type.bodySm,
    color: theme.colors.textPrimary,
    marginTop: 6,
    textAlign: 'center',
  },
  textInput: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.large,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    ...theme.type.bodySm,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: 6,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  segmentRowLast: {
    marginBottom: 24,
  },
  segment: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  segmentActive: {
    backgroundColor: theme.colors.ink,
    borderColor: theme.colors.ink,
  },
  segmentText: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
  },
  segmentTextActive: {
    color: theme.colors.surface,
  },
  hint: {
    ...theme.type.bodySm,
    color: theme.colors.textSecondary,
    marginTop: 8,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.large,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dateValue: {
    ...theme.type.body,
    color: theme.colors.textPrimary,
  },
  datePlaceholder: {
    color: theme.colors.textSecondary,
  },
  // A live validation disagreement is not an action failure. The `danger`
  // register is destructive intent and *action* failure, attached to a control
  // you just pressed — this is neither: nothing was pressed, the form is
  // disagreeing with what is typed. So it stays in the reading register, where
  // `inkSoft` on the cream ground is 6.08:1.
  warning: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    marginBottom: 16,
  },
  // This one IS an action failure — the button was pressed and the send did not
  // happen — so it takes `danger`, the app's answer for that register.
  //
  // KNOWN FAILING, and deliberately not fixed here. `danger` #E5484D on this
  // screen's `backgroundWriting` ground is 3.774:1 at bodySm (14px = 10.5pt, so
  // the 3:1 large-text path is not available). Not a local colour invented to
  // dodge it: a bespoke hex here is exactly the invented-number failure mode
  // R61 warns about, and it would have to be un-invented when the token retune
  // lands. This site inherits that open item rather than starting a new class,
  // and the merge halves it from two sites to one.
  error: {
    ...theme.type.bodySm,
    color: theme.colors.danger,
    marginBottom: 16,
  },
});
