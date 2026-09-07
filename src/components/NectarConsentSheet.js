import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { theme } from '../constants/theme';
import { HoneyDrop } from './HoneyDrop';
import { DROP_MAX_RADIUS } from './nectarFlight';
import { PressableScale } from './PressableScale';
import { PrimaryButton } from './PrimaryButton';
import { PillButton } from './PillButton';

// DES-28 D3's consent sheet — the one surface whose entire audience is
// users for whom `nectarConsent` is false, by construction. Its copy is
// money words rendered pre-consent, and there is no spelling of the first
// guard that admits it (nectar.js's note above `NECTAR_CONSENT_SHEET_GUARD`
// explains why that needed a second guard rather than a bigger
// `nectarConsent`). The host owns the guard's state
// (`nectarConsentSheetOpen`, initialised `useState(false)` — B7); this file
// only re-wraps its own body in the prop it's handed, because `isUnderGuard`
// is a within-file ancestor walk and can't see a guard spelled in the
// caller.
//
// Copy: Deezine's DES-28_CONSENT_BOOTSTRAP.md, amended for Colin's bitcoin
// ruling (Sage confirmed against DESIGN_BRIEF_V2_NAVIGATION.md Part C rule
// 1, which already carves the consent screen out of the bitcoin/sats/crypto
// ban). Pigment is `ink`, not `accentDeep` — the latter fails WCAG on every
// ground this sheet can render over (Pixel's §7 measurement).
export const NectarConsentSheet = ({
  nectarConsentSheetOpen,
  senderName,
  submitting,
  error,
  onAffirm,
  onDismiss,
}) => (
  <>
    {nectarConsentSheetOpen && (
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* R-N7 — the first time a person meets a drop, and until now the
              sheet only DESCRIBED one. Show the object, at rest, above the
              headline. Nothing moves: this is an introduction, not a beat,
              so no `opacity`/`style` animation is passed and none is
              wanted. Same size the door rests at (R-N6) and the same
              component the flight throws, so a person meets the object here
              and recognises it there — that recognition is the entire
              reason this is `HoneyDrop` and not an illustration. */}
          <HoneyDrop radius={DROP_MAX_RADIUS} style={styles.drop} />
          <Text style={styles.headline}>Give gifts of gratitude</Text>
          {/* R-N7 as amended by Colin, 2026-09-07 (Strategy thread
              74c51440): THE BODY NO LONGER NAMES A GRANT. It used to read
              "we'll add 500 drops to your account to say thanks" — a promise
              of free nectar, which is not the offer. What consent does is set
              a person up to send; it does not hand them a balance in copy.
              Every other door stays shut for the same reasons as before:
              purchase by SPEC 19a, the wage frame by doctrine. This body
              never offers a person a way to get more, and it no longer offers
              them something for nothing either. The struck words above are
              quoted once, here, so the next reader knows what was removed and
              why; a grep of RENDERED copy for them must find nothing. */}
          <Text style={styles.body}>
            When you send a gift to {senderName || 'someone'}, drops travel with
            your note.
          </Text>
          <Text style={styles.footnote}>Drops are units on a simulated Bitcoin network.</Text>
          {error && <Text style={styles.error}>Failed. Please try again.</Text>}
          <PrimaryButton
            onPress={onAffirm}
            loading={submitting}
            containerStyle={styles.affirm}
            accessibilityLabel="Sounds good"
          >
            Sounds good
          </PrimaryButton>
          <PillButton
            onPress={onDismiss}
            variant="outline"
            disabled={submitting}
            style={styles.dismiss}
            accessibilityLabel="Not now"
          >
            Not now
          </PillButton>
        </View>
      </View>
    )}
  </>
);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 2,
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  drop: {
    marginBottom: theme.spacing.md,
  },
  headline: {
    ...theme.type.h3,
    color: theme.colors.ink,
    textAlign: 'center',
  },
  body: {
    ...theme.type.body,
    color: theme.colors.ink,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  footnote: {
    ...theme.type.bodySm,
    fontSize: 11,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  error: {
    ...theme.type.bodySm,
    // D5 / R-N7 — `ink`, NOT `theme.colors.danger`. This is the same
    // deliberate non-reuse `NectarSendPanel.js:172-176` already names by
    // token and by size: `danger` measures 3.62-3.91 against a 4.5:1 bar at
    // every existing `bodySm` site (§23's still-open defect), and this was
    // the sixth — built next door, in the same feature, in the same arc.
    // `ink` at the same size says the same thing and can be read.
    color: theme.colors.ink,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  affirm: {
    marginTop: theme.spacing.lg,
  },
  dismiss: {
    marginTop: theme.spacing.sm,
  },
});
