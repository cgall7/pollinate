import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { theme } from '../constants/theme';
import { PressableScale } from '../components/PressableScale';
import { StaggeredItem } from '../components/StaggeredItem';
import { PrimaryButton } from '../components/PrimaryButton';
import { GlowOrb } from '../components/GlowOrb';
import { FlyingBee } from '../components/FlyingBee';
import { DEMO_CONTENT } from '../constants/demoMode';
import { OnboardingState } from '../services/onboardingState';
import { HoneycombStore } from '../services/HoneycombStore';
import { useAuth } from '../contexts/AuthContext';

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

// ZERO DOOR — one screen, no beats (PLANS/ONBOARDING_ZERO_DOOR_SPEC.md,
// Lumen 2026-08-26, superseding ONBOARDING_ONE_DOOR_SPEC.md 2026-08-17).
//
// One Door's premise was write-before-account: it collected a first entry
// and a "who is this for" answer before a session existed, buffered both to
// disk (PendingOnboardingWrites), and flushed them once the account showed
// up — machinery that existed only because those writes happened first.
// Zero Door reverses the order instead of building a faster buffer: account
// first, so nothing is ever collected before there is a session to write it
// with. That deletes the buffer, its three-exit flush invariant (C6,
// Sage 2026-08-17), and the `hiveFailed` recovery beat outright — not
// migrated, deleted, because post-auth every write has a session and the
// class of failure they existed to catch has no members left.
//
// Every beat One Door had still has a home, just not here:
//   Landing + Account  -> merged into this one screen, below.
//   First Entry        -> Today's quiet page (shipped 08-19) is already the
//                          daily invitation; FIRST_DAYS_PROMPTS[0] reaches
//                          the user there via the same deck, unchanged.
//   Celebration + ask   -> the first-ever real save inside the app
//                          (CoreRitual.js's InputScreen), which already
//                          plays a celebration overlay for every save. The
//                          notification ask (`NUDGE_ASK_*`) now hangs there
//                          too, gated on that save being the user's first.
//   Who ("who is this   -> CreateHive (V2 §16.1 already collects subject
//     year for")            name + relationship there). The onboarding
//                          Private-Hive writer is deleted outright.
//
// Two affordances on this screen, no third: Continue with Apple (primary),
// Continue with email (secondary, expands inline — never a second screen).
// A quiet way back in for someone who already has an account sits under
// both. The demo skip stays DEMO_CONTENT-gated, below everything.
let hasArcedThisLaunch = false;

export const OnboardingFlow = ({ onDone, startAt, navigation, splashHidden }) => {
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  // Seeded, not corrected by an effect: Honeycomb's empty state and the auth
  // deep links land directly in the expanded form, in the right mode, and
  // doing that in the initialiser means the collapsed buttons never render
  // for a frame first.
  const [expanded, setExpanded] = useState(startAt === 'signup' || startAt === 'signin');
  const [mode, setMode] = useState(startAt === 'signin' ? 'signin' : 'signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const isSignUp = mode === 'signup';
  const canSubmit = email.trim() && password.length >= 6 && (!isSignUp || name.trim()) && !busy;

  // §5 — Apple sends `fullName` only on the very first authorization this
  // device ever grants. A reinstall or a second sign-in gets null forever,
  // so that case gets one inline name prompt right here rather than let
  // `handle_new_user`'s 'New user' default ride downstream unfixed.
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [appleNamePrompt, setAppleNamePrompt] = useState(false);
  const [appleUserId, setAppleUserId] = useState(null);
  const [appleName, setAppleName] = useState('');

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  // §13.3: the bee flies an inward spiral arc and settles at the wordmark's
  // center once per app open — a flight-path preset on the shared FlyingBee
  // engine, not a second bee. `hasArcedThisLaunch` is a module-level flag
  // (not React state) on purpose: DEMO_MODE's foreground-resume reset
  // (App.js) repeatedly unmounts/remounts this screen, and §13.3 says
  // "fires once per app open, never loops" — a per-component state flag
  // would reset on every one of those remounts and re-fire the arc each
  // time. This flag only resets on a genuine cold launch (new JS context),
  // which is the boundary §13.3 actually means by "app open." Gated on the
  // splash-hide signal from App.js rather than mount, so the flight is
  // never spent behind the still-visible splash (§13.3 follow-up,
  // Pixel/Sage 2026-08-12).
  const [showArc, setShowArc] = useState(false);
  useEffect(() => {
    if (splashHidden && !hasArcedThisLaunch) {
      hasArcedThisLaunch = true;
      setShowArc(true);
    }
  }, [splashHidden]);

  // App.js's onDone is `navigation.replace('Main')`, which must not run
  // twice — this screen can reach it both by its own submit and by the
  // already-signed-in effect below firing on the same session change.
  const finishedRef = useRef(false);
  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    // Fire-and-forget: the flag only matters on the NEXT cold launch, so
    // navigation doesn't wait on the write.
    OnboardingState.markComplete().catch(() => {});
    onDone();
  };

  // Demo mode resets to this screen on every foreground resume — if this
  // device already has a real session (signed up on a previous pass), or a
  // sign-in/sign-up just landed one, there is nothing left to ask for.
  // Straight into the app. Held off while the Apple name prompt is up: that
  // prompt has its own session already and must not be raced to `finish()`
  // out from under the one write it exists to make.
  useEffect(() => {
    if (session && !appleNamePrompt) finish();
  }, [session, appleNamePrompt]);

  const attemptSignIn = async () => {
    await HoneycombStore.signIn(email.trim(), password);
    finish();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (isSignUp) {
        const result = await HoneycombStore.signUp(email.trim(), password, name.trim());
        if (result.session) {
          finish();
        } else {
          // No session yet (email confirmation required — a dashboard
          // toggle, `mailer_autoconfirm`, outside this repo). The confirm
          // screen below survives Zero Door: it no longer guards a pre-auth
          // buffer (there is none), it's just the honest state.
          setConfirmSent(true);
        }
      } else {
        await attemptSignIn();
      }
    } catch (err) {
      // Repeat demo pass on the same device, same email — quietly try
      // signing in instead of dead-ending on "already registered." Keyed on
      // GoTrue's stable error codes (Sage, thread 14492cf2) rather than a
      // regex over `err.message` — prose isn't a contract, a copy edit on
      // the rail silently kills a string match and the quiet retry stops
      // firing with no signal.
      if (isSignUp && (err.code === 'email_exists' || err.code === 'user_already_exists')) {
        try {
          await attemptSignIn();
          return;
        } catch (signInErr) {
          // Authored copy, not the raw rail message (Sage, thread 14492cf2
          // §4) — the raw error only reaches console.warn.
          console.warn('Quiet sign-in retry failed', signInErr);
          setError('That email is already in use — try signing in.');
          setMode('signin');
          return;
        }
      }
      console.warn('Onboarding submit failed', err);
      // Sage's correction to §4 (thread 14492cf2): a flat "Something went
      // wrong" here deletes the one piece of information — wrong password —
      // that makes this screen fixable. `err.code` is GoTrue's stable
      // contract, same shape as the `err?.code === '23505'` classification
      // in HoneycombTab.js:354. Unmatched codes still fall through to the
      // authored generic line — the rail's prose never reaches the user.
      if (err.code === 'invalid_credentials') {
        setError("That email and password don't match.");
      } else if (err.code === 'over_request_rate_limit' || err.code === 'over_email_send_rate_limit') {
        setError('Too many tries — wait a moment and try again.');
      } else {
        setError('Something went wrong — try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleAppleSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('Apple returned no identity token');
      const fullName = credential.fullName?.givenName
        ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ')
        : null;
      const data = await HoneycombStore.signInWithApple(credential.identityToken, fullName);
      if (!fullName) {
        setAppleUserId(data.user?.id ?? null);
        setAppleNamePrompt(true);
        return;
      }
      finish();
    } catch (err) {
      // The user backing out of the system sheet is not an error state.
      if (err.code === 'ERR_REQUEST_CANCELED') return;
      console.warn('Apple sign-in failed', err);
      setError('Apple sign-in failed — try again, or continue with email.');
    } finally {
      setBusy(false);
    }
  };

  const submitAppleName = async () => {
    const trimmed = appleName.trim();
    if (!trimmed) return;
    setBusy(true);
    if (appleUserId) {
      // Best-effort, same standard as an entry-write retry elsewhere in this
      // app: the session already exists, so a failed write here is a
      // "New user" the account screen (Settings) can fix later, not a lost
      // record with no other copy anywhere.
      await HoneycombStore.updateDisplayName(appleUserId, trimmed).catch((err) =>
        console.warn('Failed to persist Apple sign-in name', err)
      );
    }
    setBusy(false);
    finish();
  };

  if (session && !appleNamePrompt) return null;

  if (appleNamePrompt) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: theme.colors.washYellow }]}
      >
        <View style={styles.centerFill}>
          <Text style={styles.h1Center}>What should we call you?</Text>
          <Text style={styles.bodyLgCenter}>Apple didn't share a name this time — one line and you're in.</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.nameInput}
              placeholder="Your name"
              placeholderTextColor={theme.colors.inkSoft}
              value={appleName}
              onChangeText={setAppleName}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={appleName.trim() ? submitAppleName : undefined}
              editable={!busy}
              maxLength={100}
              autoFocus
            />
          </View>
        </View>
        <PrimaryButton onPress={submitAppleName} disabled={!appleName.trim() || busy} style={styles.floatingButton}>
          {busy ? 'Saving…' : 'Keep going'}
        </PrimaryButton>
      </KeyboardAvoidingView>
    );
  }

  if (confirmSent) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.washYellow }]}>
        <View style={styles.centerFill}>
          <Text style={styles.h1Center}>Check your email</Text>
          <Text style={styles.bodyLgCenter}>
            We sent a confirmation link to {email.trim()}. You can keep going now — just confirm it before you try
            sharing to the hive.
          </Text>
        </View>
        <PrimaryButton onPress={finish} style={styles.floatingButton}>
          Continue
        </PrimaryButton>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.washYellow }]}
    >
      {/* THE GATE'S OWN LIGHT, not a smaller cousin of it — see CoreRitual's
          LockScreen, the same face this screen now permanently wears.
          `size={width * 1.6}` at `top: -width * 0.35` is that screen's own
          treatment, verbatim (Onboarding's old LandingStep, unchanged). */}
      <GlowOrb size={width * 1.6} breathe intensity={0.55} style={{ top: -width * 0.35 }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {expanded && (
          <TouchableOpacity onPress={() => setExpanded(false)} hitSlop={HIT_SLOP} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.ink} />
          </TouchableOpacity>
        )}
        <View style={styles.wordmarkArcAnchor}>
          <Text style={styles.wordmark}>Pollinate</Text>
          {showArc && (
            <FlyingBee preset="loginArc" size={22} style={styles.wordmarkArcBee} onSettle={() => setShowArc(false)} />
          )}
        </View>
        {!expanded && (
          <View style={styles.headlineBlock}>
            {/* Cascade timing comes from the shared module, never a local
                literal (§12.5.1b). */}
            <StaggeredItem index={0}>
              <Text style={styles.h1Center}>Start with what you were given.</Text>
            </StaggeredItem>
            <StaggeredItem index={1}>
              <Text style={styles.bodyLgCenter}>One line a day. That's how it starts.</Text>
            </StaggeredItem>
          </View>
        )}
        {expanded && (
          <>
            <Text style={styles.h1}>{isSignUp ? 'Keep it.' : 'Welcome back'}</Text>
            <Text style={styles.bodySm}>
              {isSignUp
                ? 'Make an account so your entries follow you — and so your hive can see the ones you choose to share.'
                : 'Sign in to pick up where you left off.'}
            </Text>
            <View style={styles.inputCard}>
              {isSignUp && (
                <TextInput
                  style={styles.nameInput}
                  placeholder="Your name"
                  placeholderTextColor={theme.colors.inkSoft}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  editable={!busy}
                  maxLength={100}
                />
              )}
              {isSignUp && <View style={styles.inputDivider} />}
              <TextInput
                style={styles.nameInput}
                placeholder="Email"
                placeholderTextColor={theme.colors.inkSoft}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                editable={!busy}
              />
              <View style={styles.inputDivider} />
              <TextInput
                style={styles.nameInput}
                placeholder="Password (6+ characters)"
                placeholderTextColor={theme.colors.inkSoft}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                editable={!busy}
              />
            </View>
            {isSignUp && (
              // No consent checkbox yet. The copy in legalCopy.js is now a real
              // draft, but four values in it are still unfilled, so it renders
              // "[the publisher of this app]" and is not publishable — and
              // requiring agreement to an unpublished document is worse than no
              // checkbox at all. Links stay reachable so the gap is visible.
              //
              // To re-add: import { LEGAL_COPY_READY } from '../constants/legalCopy'
              // and render the checkbox only when it is true. Gate on that symbol,
              // not on a judgement that the copy "looks done" — it is derived from
              // the unfilled values themselves, so it cannot drift out of sync.
              // `canSubmit` must not require `agreedToTerms` while it is false.
              <Text style={styles.consentText}>
                <Text style={styles.consentLink} onPress={() => navigation?.navigate('Legal', { tab: 'privacy' })}>
                  Privacy Policy
                </Text>{' '}
                and{' '}
                <Text style={styles.consentLink} onPress={() => navigation?.navigate('Legal', { tab: 'terms' })}>
                  Terms of Service
                </Text>
              </Text>
            )}
            {error && <Text style={styles.signUpError}>{error}</Text>}
            <PressableScale onPress={() => setMode(isSignUp ? 'signin' : 'signup')} haptic={null}>
              <Text style={styles.switchModeText}>
                {isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
              </Text>
            </PressableScale>
          </>
        )}
      </ScrollView>
      {!expanded ? (
        <>
          {/* Apple's HIG button treatment — their shape, their label. The
              wash can hold a black button; it doesn't get restyled (§5). */}
          {appleAvailable && (
            <StaggeredItem index={2}>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={theme.borderRadius.medium}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            </StaggeredItem>
          )}
          <StaggeredItem index={3}>
            <PrimaryButton onPress={() => setExpanded(true)} style={appleAvailable ? styles.floatingButton : undefined}>
              Continue with email
            </PrimaryButton>
          </StaggeredItem>
          {/* The returning half of the door — reachable from here, from the
              Honeycomb empty state, and from the `startAt` deep link. */}
          <StaggeredItem index={4}>
            <PressableScale
              onPress={() => {
                setMode('signin');
                setExpanded(true);
              }}
              style={styles.signInLink}
              haptic={null}
            >
              <Text style={styles.signInLinkText}>Already have a hive? Sign in</Text>
            </PressableScale>
          </StaggeredItem>
          {/* Pixel's WP-10(c) finding (thread 37fb8ef6): this rendered
              unconditionally, shipping to every tester's first screen.
              DEMO_CONTENT, not __DEV__ — a pitch build Colin demos from has
              __DEV__ false but DEMO_MODE still true. */}
          {DEMO_CONTENT && (
            <PressableScale onPress={finish} style={styles.skipDemoLink}>
              <Text style={styles.skipDemoText}>Skip to the logged-in view (demo)</Text>
            </PressableScale>
          )}
        </>
      ) : (
        <PrimaryButton onPress={handleSubmit} disabled={!canSubmit} style={styles.floatingButton}>
          {busy ? (isSignUp ? 'Creating account…' : 'Signing in…') : isSignUp ? 'Create account' : 'Sign in'}
        </PrimaryButton>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: theme.spacing.lg,
  },
  backButton: {
    marginBottom: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineBlock: {
    alignItems: 'center',
  },
  wordmark: {
    ...theme.type.logo,
    color: theme.colors.ink,
    marginBottom: 24,
  },
  // §13.3 anchor for the login bee arc — sized to roughly the wordmark's
  // footprint so the bee's fractional (0-1) flight path resolves against
  // the mark itself rather than the whole screen.
  wordmarkArcAnchor: {
    width: 220,
    height: 100,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkArcBee: {
    // Belt-and-braces only — FlyingBee's own `fill` style already carries
    // `position: 'absolute'`. An absolutely-positioned view fills its
    // *parent*, so the box the bee's fractional path resolves against is
    // `wordmarkArcAnchor` above (220x100), not this style.
    position: 'absolute',
  },
  h1: {
    ...theme.type.h1,
    color: theme.colors.ink,
    marginBottom: 8,
  },
  h1Center: {
    ...theme.type.h1,
    color: theme.colors.ink,
    textAlign: 'center',
  },
  bodySm: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    marginBottom: 24,
  },
  bodyLgCenter: {
    ...theme.type.bodyLg,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
  },
  inputCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.lg,
    marginTop: 16,
    marginBottom: 20,
    ...theme.shadows.card,
  },
  nameInput: {
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
  consentText: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    flex: 1,
  },
  consentLink: {
    color: theme.colors.accentDeep,
    fontFamily: theme.fonts.bodySemiBold,
  },
  signUpError: {
    ...theme.type.bodySm,
    color: theme.colors.danger,
    marginTop: -8,
    marginBottom: 16,
  },
  switchModeText: {
    ...theme.type.bodySm,
    color: theme.colors.accentDeep,
    textAlign: 'center',
  },
  floatingButton: {
    marginTop: 16,
  },
  appleButton: {
    width: '100%',
    height: 52,
  },
  // The Landing's returning-user link is a quiet text affordance sitting
  // under a primary button, carrying the alternative to the loud path.
  //
  // inkSoft, and MEASURED rather than reasoned. The obvious choice was
  // accentDeep — it is the app's link colour and reads as tappable — but on
  // washYellow (#FFF3C4) accentDeep #FF7A00 is 2.35:1, which fails 4.5:1
  // and fails the 3:1 large-text path too; these are bodySm 14px = 10.5pt,
  // so that path was never available. inkSoft #6B5F3D is 5.67:1 on the same
  // ground. A link colour is not a licence: the pair decides, never the
  // token. (The same measurement flags `switchModeText` and `consentLink`,
  // both live on main at 2.35:1 — reported separately, not changed here.)
  signInLink: {
    alignSelf: 'center',
    marginTop: 18,
  },
  signInLinkText: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    textAlign: 'center',
  },
  skipDemoLink: {
    alignSelf: 'center',
    marginTop: 14,
  },
  skipDemoText: {
    ...theme.type.bodySm,
    color: theme.colors.inkSoft,
    textDecorationLine: 'underline',
  },
});
