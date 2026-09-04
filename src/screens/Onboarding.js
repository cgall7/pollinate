import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { theme } from '../constants/theme';
import { DEMO_CONTENT, DEMO_LOGIN_EMAIL, DEMO_LOGIN_PASSWORD } from '../constants/demoMode';
import { GlowOrb } from '../components/GlowOrb';
import { PressableScale } from '../components/PressableScale';
import { PrimaryButton } from '../components/PrimaryButton';
import { StaggeredItem } from '../components/StaggeredItem';
import { FlyingBee } from '../components/FlyingBee';
import { useAuth } from '../contexts/AuthContext';
import { HoneycombStore } from '../services/HoneycombStore';
import { OnboardingState } from '../services/onboardingState';

const AUTH_CHOICE = 'choice';
const AUTH_EMAIL_LINK = 'emailLink';
const AUTH_PASSWORD = 'password';

let hasArcedThisLaunch = false;

const AccountGateShell = ({ children, splashHidden }) => {
  const { width } = useWindowDimensions();
  const [showArc, setShowArc] = useState(false);

  useEffect(() => {
    if (splashHidden && !hasArcedThisLaunch) {
      hasArcedThisLaunch = true;
      setShowArc(true);
    }
  }, [splashHidden]);

  return (
    <View style={styles.container}>
      <GlowOrb size={width * 1.6} breathe intensity={0.55} style={{ top: -width * 0.35 }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fill}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.wordmarkArcAnchor}>
            <Text style={styles.wordmark}>Pollinate</Text>
            {showArc && (
              <FlyingBee
                preset="loginArc"
                size={22}
                style={styles.wordmarkArcBee}
                onSettle={() => setShowArc(false)}
              />
            )}
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const AuthError = ({ children }) => (children ? <Text style={styles.errorText}>{children}</Text> : null);

// RESTORED VERBATIM from the pre-zero-onboarding screen, which carried it on
// the sign-up branch the Account Gate replaced
// (fec5a0b:src/screens/Onboarding.js:870-880, text byte-identical; only the
// indentation changed, and it moved into this component so it stays a real JS
// comment rather than JSX children).
//
// NO GATE ASSERTS ITS PRESENCE — which is why the rewrite dropped it in
// silence and took the warning on its last line with it. It is a dependency
// all the same: `check-legal-consent-gate.mjs` sets `CONSENT_BINDING =
// 'agreedToTerms'` and its own header says the name "is quoted from that
// comment rather than invented here". This is that comment.
const LegalLinks = ({ navigation }) => {
  // No consent checkbox yet. The copy in legalCopy.js is now a real
  // draft, but four values in it are still unfilled, so it renders
  // "[our legal name, to be named before launch]" and is not
  // publishable — and requiring agreement to an unpublished document
  // is worse than no checkbox at all. Links stay reachable so the gap
  // is visible.
  //
  // To re-add: import { LEGAL_COPY_READY } from '../constants/legalCopy'
  // and render the checkbox only when it is true. Gate on that symbol,
  // not on a judgement that the copy "looks done" — it is derived from
  // the unfilled values themselves, so it cannot drift out of sync.
  // `canSubmit` must not require `agreedToTerms` while it is false.
  return (
  <Text style={styles.legalText}>
    By continuing, you agree to the{' '}
    <Text style={styles.legalLink} onPress={() => navigation?.navigate('Legal', { tab: 'privacy' })}>
      Privacy Policy
    </Text>{' '}
    and{' '}
    <Text style={styles.legalLink} onPress={() => navigation?.navigate('Legal', { tab: 'terms' })}>
      Terms of Service
    </Text>
    .
  </Text>
  );
};

export const OnboardingFlow = ({ onDone, startAt, navigation, splashHidden }) => {
  const { session } = useAuth();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [mode, setMode] = useState(startAt === 'signin' ? AUTH_PASSWORD : AUTH_CHOICE);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [demoLoginBusy, setDemoLoginBusy] = useState(false);
  const [demoLoginError, setDemoLoginError] = useState(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  useEffect(() => {
    if (startAt === 'invite') setMode(AUTH_EMAIL_LINK);
  }, [startAt]);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    OnboardingState.markComplete().catch(() => {});
    onDone();
  };

  useEffect(() => {
    if (session) finish();
  }, [session]);

  const resetErrorForMode = (nextMode) => {
    setError(null);
    setEmailLinkSent(false);
    setMode(nextMode);
  };

  const handleAppleSignIn = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      if (!credential.identityToken) throw new Error('Apple returned no identity token');
      await HoneycombStore.signInWithApple(credential.identityToken, rawNonce);
      finish();
    } catch (err) {
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        console.warn('Account Gate Apple sign-in failed', err);
        setError('Apple sign-in failed. Try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleEmailLink = async () => {
    if (busy || !canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await HoneycombStore.signInWithOtp(email.trim());
      setEmailLinkSent(true);
    } catch (err) {
      console.warn('Account Gate email link failed', err);
      if (err.code === 'over_request_rate_limit' || err.code === 'over_email_send_rate_limit') {
        setError('Too many tries. Wait a moment and try again.');
      } else {
        setError("Couldn't send the link. Your email is still here.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordSignIn = async () => {
    if (busy || !canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await HoneycombStore.signIn(email.trim(), password);
      finish();
    } catch (err) {
      console.warn('Account Gate password sign-in failed', err);
      if (err.code === 'invalid_credentials') {
        setError("That email and password don't match.");
      } else if (err.code === 'over_request_rate_limit' || err.code === 'over_email_send_rate_limit') {
        setError('Too many tries. Wait a moment and try again.');
      } else {
        setError("Couldn't sign in. Try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleContinueAsDemo = async () => {
    if (demoLoginBusy) return;
    setDemoLoginBusy(true);
    setDemoLoginError(null);
    try {
      await HoneycombStore.signIn(DEMO_LOGIN_EMAIL, DEMO_LOGIN_PASSWORD);
      finish();
    } catch (err) {
      console.warn('Account Gate demo login failed', err);
      setDemoLoginError("Couldn't sign in to the demo account. Check your connection and try again.");
      setDemoLoginBusy(false);
    }
  };

  const applePrimary = appleAvailable && mode === AUTH_CHOICE;
  const emailPrimary = !appleAvailable && mode === AUTH_CHOICE;
  const expandedEmail = mode === AUTH_EMAIL_LINK;
  const passwordMode = mode === AUTH_PASSWORD;

  // THE ONE FORM-VALIDITY CHOKE POINT, and it is one binding on purpose.
  // `scripts/check-legal-consent-gate.mjs` row 0 asserts exactly one
  // initialised `canSubmit` here, and rows 1-3 read THIS initialiser's
  // identifiers to decide whether the submit path consults consent — so a
  // screen that writes its validity expression once per branch satisfies
  // nobody: the gate loses its universe control, and the two copies drift
  // apart silently (the Account Gate rewrite had exactly that shape).
  //
  // Every branch of the gate resolves here, and both submit handlers and the
  // primary action's `disabled` read the result rather than restating it.
  // Apple carries no form fields, so it is valid by construction — `busy` is
  // the only thing that suppresses it, and `busy` is liveness, not validity,
  // which is why it is applied at the call sites instead of folded in here.
  //
  // CONSENT IS DELIBERATELY ABSENT FROM THIS EXPRESSION TODAY. See the
  // instruction comment beside the legal links below: while
  // `LEGAL_COPY_READY` is false there is no checkbox rendered, so requiring
  // `agreedToTerms` here would make account creation impossible while the
  // suite stayed green — the exact transition row 3 of that gate was written
  // to interrupt. The consent term joins this initialiser with LEGAL-2/OPS-8,
  // not before.
  const canSubmit = applePrimary
    ? true
    : emailPrimary || expandedEmail
      ? email.trim().includes('@')
      : Boolean(email.trim()) && password.length >= 6;

  const primary = useMemo(() => {
    if (applePrimary) {
      return {
        label: busy ? 'Continuing…' : 'Continue with Apple',
        onPress: handleAppleSignIn,
        disabled: busy,
        kind: 'apple',
      };
    }
    if (emailPrimary || expandedEmail) {
      return {
        label: busy ? 'Sending link…' : emailPrimary ? 'Continue with email' : 'Email me a link',
        onPress: handleEmailLink,
        disabled: busy || !canSubmit,
      };
    }
    return {
      label: busy ? 'Signing in…' : 'Sign in',
      onPress: handlePasswordSignIn,
      disabled: busy || !canSubmit,
    };
  }, [applePrimary, busy, canSubmit, email, emailPrimary, expandedEmail, password, passwordMode]);

  if (emailLinkSent) {
    return (
      <AccountGateShell splashHidden={splashHidden}>
        <View style={styles.centerBlock}>
          <StaggeredItem index={0}>
            <Text style={styles.title}>Check your email.</Text>
          </StaggeredItem>
          <StaggeredItem index={1}>
            <Text style={styles.body}>We’ll send a secure link. No password needed.</Text>
          </StaggeredItem>
          <StaggeredItem index={2}>
            <Text style={styles.helper}>Tap the link on this device to finish. Then you’ll land on Today.</Text>
          </StaggeredItem>
        </View>
        <AuthError>{error}</AuthError>
      </AccountGateShell>
    );
  }

  return (
    <AccountGateShell splashHidden={splashHidden}>
      <View style={styles.centerBlock}>
        <StaggeredItem index={0}>
          <Text style={styles.title}>One good thing is enough.</Text>
        </StaggeredItem>
        <StaggeredItem index={1}>
          <Text style={styles.body}>Write one line. Keep it private. Share only what you choose.</Text>
        </StaggeredItem>
      </View>

      {(expandedEmail || passwordMode || emailPrimary) && (
        <StaggeredItem index={2}>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={theme.colors.inkSoft}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType={passwordMode ? 'next' : 'done'}
              editable={!busy}
              textContentType="emailAddress"
              accessibilityLabel="Email"
            />
            {passwordMode && (
              <>
                <View style={styles.inputDivider} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={theme.colors.inkSoft}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  editable={!busy}
                  textContentType="password"
                  accessibilityLabel="Password"
                />
              </>
            )}
          </View>
        </StaggeredItem>
      )}

      <StaggeredItem index={3}>
        {primary.kind === 'apple' ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={theme.borderRadius.medium}
            style={styles.appleButton}
            onPress={primary.onPress}
          />
        ) : (
          <PrimaryButton onPress={primary.onPress} disabled={primary.disabled}>
            {primary.label}
          </PrimaryButton>
        )}
      </StaggeredItem>

      {applePrimary && (
        <StaggeredItem index={4}>
          <PressableScale
            onPress={() => resetErrorForMode(AUTH_EMAIL_LINK)}
            style={styles.secondaryLink}
            haptic={null}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>Use email instead</Text>
          </PressableScale>
        </StaggeredItem>
      )}

      {expandedEmail && (
        <StaggeredItem index={4}>
          <Text style={styles.helper}>We’ll send a secure link. No password needed.</Text>
        </StaggeredItem>
      )}

      <AuthError>{error}</AuthError>

      <StaggeredItem index={5}>
        <LegalLinks navigation={navigation} />
      </StaggeredItem>

      {mode !== AUTH_PASSWORD && (
        <StaggeredItem index={6}>
          <PressableScale
            onPress={() => resetErrorForMode(AUTH_PASSWORD)}
            style={styles.tertiaryLink}
            haptic={null}
            accessibilityRole="button"
          >
            <Text style={styles.tertiaryText}>Use password instead</Text>
          </PressableScale>
        </StaggeredItem>
      )}

      {passwordMode && (
        <StaggeredItem index={6}>
          <PressableScale
            onPress={() => resetErrorForMode(appleAvailable ? AUTH_CHOICE : AUTH_EMAIL_LINK)}
            style={styles.tertiaryLink}
            haptic={null}
            accessibilityRole="button"
          >
            <Text style={styles.tertiaryText}>Email me a link</Text>
          </PressableScale>
        </StaggeredItem>
      )}

      {DEMO_CONTENT && (
        <StaggeredItem index={7}>
          <PressableScale onPress={finish} style={styles.demoLink} haptic={null}>
            <Text style={styles.demoText}>Skip to the logged-in view (demo)</Text>
          </PressableScale>
        </StaggeredItem>
      )}

      {DEMO_CONTENT && (
        <StaggeredItem index={8}>
          {DEMO_LOGIN_EMAIL && (
            <>
              <PressableScale onPress={handleContinueAsDemo} style={styles.demoLink} disabled={demoLoginBusy}>
                <Text style={styles.demoText}>{demoLoginBusy ? 'Signing in…' : 'Continue as demo'}</Text>
              </PressableScale>
              {demoLoginError && <Text style={styles.errorText}>{demoLoginError}</Text>}
            </>
          )}
        </StaggeredItem>
      )}
    </AccountGateShell>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.washYellow,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: theme.spacing.lg,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  wordmarkArcAnchor: {
    alignSelf: 'center',
    width: 220,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  wordmarkArcBee: {
    position: 'absolute',
  },
  wordmark: {
    ...theme.type.logo,
    color: theme.colors.ink,
  },
  centerBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    ...theme.type.h1,
    color: theme.colors.ink,
    textAlign: 'center',
  },
  body: {
    ...theme.type.bodyLg,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 10,
  },
  helper: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginTop: 14,
  },
  inputCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.lg,
    marginBottom: 18,
    ...theme.shadows.card,
  },
  input: {
    fontFamily: theme.fonts.body,
    fontSize: 19,
    color: theme.colors.ink,
    paddingVertical: 4,
  },
  inputDivider: {
    height: 1,
    backgroundColor: theme.colors.surfaceBorder,
    marginVertical: 14,
  },
  appleButton: {
    height: 50,
  },
  secondaryLink: {
    alignSelf: 'center',
    marginTop: 18,
  },
  secondaryText: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    textAlign: 'center',
  },
  tertiaryLink: {
    alignSelf: 'center',
    marginTop: 14,
  },
  tertiaryText: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    textAlign: 'center',
  },
  legalText: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginTop: 20,
  },
  legalLink: {
    color: theme.colors.inkSoft,
    fontFamily: theme.fonts.bodySemiBold,
  },
  errorText: {
    ...theme.type.bodySm,
    color: theme.colors.danger,
    textAlign: 'center',
    marginTop: 14,
  },
  demoLink: {
    alignSelf: 'center',
    marginTop: 14,
  },
  demoText: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
