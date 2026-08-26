import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { theme } from '../constants/theme';
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
          <Text style={styles.headline}>Give gifts of gratitude</Text>
          <Text style={styles.body}>
            When you send a gift to {senderName || 'someone'}, we'll add{' '}
            <Text style={styles.bodyStrong}>500 drops</Text> to your account to say thanks. You
            can always send more later by earning or buying.
          </Text>
          <Text style={styles.footnote}>Drops are units on a simulated Bitcoin network.</Text>
          {error && <Text style={styles.error}>Failed — please try again.</Text>}
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
  bodyStrong: {
    fontFamily: theme.fonts.bodySemiBold,
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
    color: theme.colors.danger,
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
