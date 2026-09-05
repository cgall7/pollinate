import React from 'react';
import { Animated, StyleSheet, View, Text, TextInput } from 'react-native';
import { theme } from '../constants/theme';
import { NECTAR_PRESETS } from '../constants/nectar';
import { PressableScale } from './PressableScale';
import { PrimaryButton } from './PrimaryButton';
import { PillButton } from './PillButton';

// ENG-63 / ENG-64's shared send surface — the controls that turn an amount
// into a `record_zap` call, used by BOTH zap surfaces (DES-28 D2's ending
// slot, D3's per-entry affordance). Deezine's own spec asks for that:
// "Quick-tap modal … Same preset buttons".
//
// ONE COMPONENT, TWO MOUNTINGS, and the difference is forced rather than
// stylistic. The ending block has no competing gesture, so D2 mounts this
// inline exactly as specified. The entry card does not have that freedom:
// it lives inside `PackageOpen`'s reveal `Pressable`, whose job is to
// ADVANCE THE SEQUENCE on any tap. Controls drawn there would sit inside a
// region whose every tap means "next" — so D3's mounting is an overlay
// OUTSIDE that Pressable, which is the placement question nectar.js's D3
// note hands to ENG-64. The panel itself does not know which it is.
//
// PIGMENT IS `ink` (DES-28 review §7.1/§7.2/§7.4). Deezine's spec sets
// `accentDeep` on the CTA, the preset text and the drop icon; measured, it
// is 2.229-2.613 against a 4.5:1 bar on every ground these can land on.
// Hierarchy is size, weight and position — theme.js's own gold-field
// paragraph already ruled the general case.
//
// SELECTION IS THE RATIFIED REGISTER, not a new one (§7.3): CreateHive's
// `themeCard` — constant `borderWidth` in both states, transparent when
// unselected, `ink` when selected, so selecting is a colour change and
// never a layout shift. Deezine's `accentDeep @ 0.2` fill is the thing
// R55 exists to stop: composited it reads dE00 9.322 from `background`
// but 15.779 from `washSky`, i.e. a different hue per ground.
//
// THE PANEL SITS ON ITS OWN `surface` CARD for the same reason CreateHive's
// mat does: the ending block's ground is `cover.base`, one of four hive
// cover tokens, so anything drawn straight onto it has four grounds to
// clear rather than one. Inset onto white and every pair in here is
// measured once.
//
// GUARD: `nectarConsent` is a PROP, and this file re-wraps its own body in
// it — `isUnderGuard` is a within-file ancestor walk and cannot see a guard
// spelled in the caller (NectarConsentSheet's header, same shape). B8
// requires the prop be fed by an identifier of the same name.
// R-N2 moved the list itself to `constants/nectar.js` (a preset is a ledger
// quantity, and check-honey-fill measures these three numbers against the
// vessel from a bare `node` script, which cannot import a file with JSX).
// Re-exported here so every existing import of this module keeps working.
export { NECTAR_PRESETS };

// THE MAXIMUM IS THE SERVER'S, quoted rather than re-chosen: `record_zap`
// raises on anything outside 1..1000 drops
// (20260826000005:336 / 20260826000006's re-issue). A client bound that
// disagreed with it would either forbid a legal zap or promise an illegal
// one.
export const NECTAR_MIN_DROPS = 1;
export const NECTAR_MAX_DROPS = 1000;

export const isSendableAmount = (drops, balanceDrops) => {
  const n = Number(drops);
  if (!Number.isInteger(n) || n < NECTAR_MIN_DROPS || n > NECTAR_MAX_DROPS) return false;
  // A BALANCE WE COULD NOT READ DOES NOT VETO THE SEND. `null` is unknown
  // (NectarStore.getBalanceDrops' contract), and treating unknown as zero
  // would disable every control on a failed read — an app that quietly
  // refuses to work is worse than one that lets the server answer. The
  // server's own overdraft check is authoritative either way.
  if (balanceDrops === null || balanceDrops === undefined) return true;
  return n <= balanceDrops;
};

// R-N3 — the panel during a gift.
//
// THE CONTROLS FALL AWAY. THE NUMERAL DOES NOT, and that is a correction to
// the letter of the spec rather than an omission from it. Gather says "the
// panel's contents fall away (fade + 4pt settle) except the chosen amount";
// Settle, 340ms later, says "the balance numeral COUNTS to its new value
// over 400ms" and closes with "you watch it leave you." Those two cannot
// both be true of the same element: a numeral faded out at 180ms is not
// available to be watched at 520ms. So "the panel's contents" is read as the
// panel's CONTROLS — heading, presets, custom field, buttons — and the
// balance line is the one thing that stays, because it is the subject of the
// beat's last sentence. The card empties down to the number, the drop
// leaves, the number counts. Flagged to Lumen; it is the only reading under
// which Settle has anything to act on.
//
// `controlsStyle` is that group's animated opacity + 4pt settle, owned by
// `useNectarGift` and applied here. `displayDrops` is the counting value —
// the panel renders it INSTEAD of `balanceDrops`, which stays the
// authoritative number and is what `isSendableAmount` is asked about, so a
// mid-count frame can never authorise a send the server would refuse.
//
// R-N3.4 — THE CARD ITSELF YIELDS, AND THAT IS WHY THE PAINT IS ITS OWN
// NODE. The ruling is that every painted part of the send surface falls away
// on the Gather clock, because R-N3.3's criterion — "the drop should fly
// over the entry it is for, not over a dimmed copy of it" — was undershot by
// its own named mechanism: the scrim went and a 354x360 opaque white card
// stayed, so the beat played over a blank instead of over the sentence being
// thanked.
//
// IT CANNOT BE ONE FADED VIEW, and that is a layout fact rather than a
// preference. Opacity on a parent applies to every descendant, so fading
// `card` would take the balance line with it — and the balance line is the
// one thing R-N3 keeps, because Settle counts it 340ms after Gather ends
// ("you watch it leave you"). So the card's PAINT (its ground, its radius,
// its shadow) is a separate absolutely-positioned sibling that carries
// `surfaceStyle`, and the content sits above it in ordinary flow. The paint
// goes, the controls go, the number stays.
//
// PAINT ORDER HERE IS MOUNT ORDER AND THAT IS SOUND, unlike the case
// `check-gift-layer-rank` was written for: no sibling inside this card
// declares a `zIndex`, so nothing has been promoted out of document order.
// The moment one does, this comment is wrong and that gate's own reasoning
// applies.
export const NectarSendPanel = ({
  nectarConsent,
  balanceDrops,
  displayDrops,
  selected,
  onSelect,
  customValue,
  onChangeCustom,
  note,
  onChangeNote,
  notePlaceholder = 'Up to 8 words',
  sending,
  failed,
  sendDisabled,
  onSend,
  onCancel,
  controlsStyle,
  surfaceStyle,
  originRef,
}) => (
  <>
    {nectarConsent && (
      <View style={styles.card}>
        {/* The card's ground. Childless on purpose — see the header: the
            moment anything renders inside this node it inherits the fade,
            and the balance line is the one element that must not. */}
        <Animated.View pointerEvents="none" style={[styles.cardPaint, surfaceStyle]} />

        <Animated.View style={[styles.controls, controlsStyle]}>
          <Text style={styles.heading}>Send nectar</Text>
        </Animated.View>

        {/* DES-24 §7.3 was open: "§5.2(b) deletes the Wallet tab but does
            not say what replaces it as the place the exact number is
            legible." This is that place, and it is forced, not chosen —
            `record_zap` HARD-FAILS on overdraft ("insufficient nectar (N
            drops available, M needed)"), so a control that offers 100 drops
            without saying you hold 40 is a control that hides its own
            failure. The numeral lives where the number is spent. */}
        {/* THE ONE ELEMENT THAT DOES NOT FALL AWAY — see the header. It
            reads `displayDrops`, which is `balanceDrops` at rest and the
            animated value during a gift; the fallback keeps a caller that
            passes neither on today's behaviour rather than blank.

            AND IT CARRIES ITS OWN GROUND, for the reason R-N3.2 gives for
            the drop's backing. Before R-N3.4 this line always sat on the
            card's white; the card now yields under it, so the line is left
            over whatever the screen happens to be showing. Measured against
            every ground it can land on, `inkSoft` clears 4.5:1 on all six
            light ones (worst 5.3792 on `washPeach`, 5.8353 on `background`)
            and reads 2.0727 on `paperEvening` — reachable, not theoretical:
            a tall entry's paper measures y 269-610 while this line sits at
            y 309-329, so the paper is behind it. Backed, it is 6.3074 on all
            seven by construction, which is a property of the object rather
            than a patch to a timing. At rest the ground is white on white
            and invisible; it only becomes a ground when there is no other.

            IT IS ALSO THE LESSER OF THE TWO SHIPPABLE STATES, and that is a
            render finding rather than a preference. On a tall entry the line
            lands ON the memory whether it is backed or not — unbacked, that
            is two texts in the same pixels and neither is readable; backed,
            it is one legible sentence covering one line of another. The
            collision itself is not mine to resolve: R-N3 keeps this line for
            Settle to count and R-N3.4 clears the card so the memory can be
            read, and on a tall entry those two want the same pixels. Filed
            for Lumen with both frames. */}

        <Text style={styles.balance}>
          {(displayDrops === undefined ? balanceDrops : displayDrops) === null
            || (displayDrops === undefined ? balanceDrops : displayDrops) === undefined
            ? "We couldn't check your drops."
            : `You have ${displayDrops === undefined ? balanceDrops : displayDrops} drops.`}
        </Text>

        <Animated.View style={[styles.controls, controlsStyle]}>
        {onChangeNote && (
          <TextInput
            style={styles.note}
            placeholder={notePlaceholder}
            placeholderTextColor={theme.colors.inkSoft}
            value={note}
            onChangeText={onChangeNote}
            editable={!sending}
            accessibilityLabel="Short note, up to eight words"
          />
        )}
        <View style={styles.presetRow}>
          {NECTAR_PRESETS.map((amount) => {
            const affordable = isSendableAmount(amount, balanceDrops);
            const isSelected = selected === amount;
            return (
              <PressableScale
                key={amount}
                // THE DROP LIFTS OFF THE CHIP IT WAS CHOSEN ON, so the ref
                // follows the selection rather than sitting on a fixed
                // control. A custom amount has no chip and the field below
                // takes it instead — the panel knows which control carries
                // the amount, and the screen does not have to.
                innerRef={isSelected ? originRef : undefined}
                onPress={() => onSelect(amount)}
                disabled={sending || !affordable}
                style={[styles.preset, isSelected && styles.presetSelected]}
                pressedColor={theme.colors.pressedOnLight}
                accessibilityLabel={`${amount} drops`}
                accessibilityState={{ selected: isSelected, disabled: sending || !affordable }}
              >
                <Text style={styles.presetAmount}>{amount}</Text>
                <Text style={styles.presetUnit}>drops</Text>
              </PressableScale>
            );
          })}
        </View>

        <TextInput
          ref={selected === null && customValue.trim().length > 0 ? originRef : undefined}
          style={styles.custom}
          keyboardType="number-pad"
          placeholder={`Or an amount, 1-${NECTAR_MAX_DROPS}`}
          placeholderTextColor={theme.colors.inkSoft}
          value={customValue}
          onChangeText={onChangeCustom}
          editable={!sending}
          accessibilityLabel="Custom amount in drops"
        />

        {/* NOT `theme.colors.danger`, and this is a deliberate non-reuse:
            that token measures 3.62-3.91 against a 4.5:1 bar at all five
            existing bodySm sites (§23's still-open defect) and this would
            be the sixth. `ink` at the same size says the same thing and
            can be read. */}
        {failed && <Text style={styles.failed}>That didn't send. Try again.</Text>}

        <PrimaryButton
          onPress={onSend}
          loading={sending}
          disabled={sendDisabled ?? !isSendableAmount(selected, balanceDrops)}
          containerStyle={styles.send}
          accessibilityLabel="Send nectar"
        >
          Send
        </PrimaryButton>
        <PillButton onPress={onCancel} variant="outline" disabled={sending} style={styles.cancel} accessibilityLabel="Not now">
          Not now
        </PillButton>
        </Animated.View>
      </View>
    )}
  </>
);

const styles = StyleSheet.create({
  // The controls group exists ONLY so Gather has one thing to fade, so it
  // must be layout-transparent: `card` centres its children and `custom`
  // stretches to the card's width, and a wrapper that sized to its own
  // content would have quietly narrowed the text field. Stretch + centre
  // reproduces the card's own flow exactly.
  controls: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  // THE BOX, NOT THE PAINT. Everything that decides where things sit stays
  // here so the card's layout is byte-identical to what it was before the
  // split; everything that decides what is visible moved to `cardPaint`.
  // `padding` staying here is load-bearing in both directions: it keeps the
  // content inset unchanged, and an absolutely-positioned child fills the
  // PADDING BOX, so the ground still reaches the card's outer edge.
  card: {
    width: '100%',
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  cardPaint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    ...theme.shadows.card,
  },
  heading: {
    ...theme.type.h3,
    color: theme.colors.ink,
    textAlign: 'center',
  },
  balance: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    // `alignSelf: 'center'` rather than the default stretch, so the ground is
    // the size of the sentence and not a full-width band across the beat, and
    // NO VERTICAL PADDING, which is the difference between a layout change
    // and none: the text's frame is already a full line box, and 2pt here
    // grew the card 4pt and moved the Send button's own hit centre from
    // y 519 to y 521 in the rig. Measured both ways.
    alignSelf: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  preset: {
    minWidth: 70,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    // CreateHive E5's SHAPE, verbatim: constant width in both states, so
    // selecting is a colour change and never a layout change.
    //
    // ITS UNSELECTED COLOUR IS NOT REUSABLE HERE, and that is measured, not
    // assumed. CreateHive can afford `transparent` because its cards carry
    // `shadows.card` and a cover material — the card is a visible object
    // before the border says anything. A preset chip is white type on a
    // white panel with nothing else in it, so an invisible border means an
    // unselected chip is not visibly a control at all. My first cut used
    // `surfaceBorder`, which composites to 1.1788:1 on `surface` — below
    // WCAG 1.4.11's 3:1 non-text floor, i.e. formally not a boundary.
    //
    // `inkSoft` clears it at 6.3074:1, and the selected state stays `ink` at
    // 17.1274:1. That keeps the pair a STRENGTH change rather than a hue
    // change (dE00 22.833, same ink family) — the same move DES-24 §6.4
    // makes for the blooming ring on a honeyed cell, and the reason R55 is
    // safe by construction here too.
    borderWidth: 2,
    borderColor: theme.colors.inkSoft,
  },
  presetSelected: {
    // The WHOLE of the selected state, deliberately. My first cut also
    // swapped the numeral to an ExtraBold face, which is a second channel
    // and a worse one: a wider face changes the glyph advance, "100" is the
    // widest label, and past `minWidth: 70` the chip itself would grow and
    // push its siblings — reintroducing exactly the layout shift E5's
    // constant border width was written to remove. §7.3 said reuse the
    // ratified register, not extend it.
    borderColor: theme.colors.ink,
  },
  presetAmount: {
    ...theme.type.h3,
    color: theme.colors.ink,
  },
  presetUnit: {
    ...theme.type.bodySm,
    fontSize: 11,
    color: theme.colors.inkSoft,
  },
  custom: {
    ...theme.type.body,
    color: theme.colors.ink,
    alignSelf: 'stretch',
    textAlign: 'center',
    // Same measurement, same reason: a text field's boundary IS the field.
    borderWidth: 1,
    borderColor: theme.colors.inkSoft,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  note: {
    alignSelf: 'stretch',
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.inkSoft,
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  failed: {
    ...theme.type.bodySm,
    color: theme.colors.ink,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  send: {
    marginTop: theme.spacing.lg,
  },
  cancel: {
    marginTop: theme.spacing.sm,
  },
});
