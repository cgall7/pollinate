import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../constants/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackButton } from '../components/BackButton';
import { CombBloom } from '../components/CombBloom';
import { useAuth } from '../contexts/AuthContext';
import { CombInviteStore } from '../services/CombInviteStore';
import { PendingCombInvite } from '../services/pendingCombInvite';
import { numberInWordsCapped } from '../utils/numberWords';
import { isPlaceholderName } from '../utils/placeholderName';

// R-RF-5 / D2 (`GUIDES/POLLINATE_RRF5_LANDING_BLOOM_SPEC.md`,
// `GUIDES/POLLINATE_D2_LANDING_LETTER_SPEC.md`). Two mount sizes, one
// drawing: the landing's centerpiece and the name screen's echo.
const BLOOM_CELL_SIZE = 22;
const BLOOM_ECHO_CELL_SIZE = 9;

const InviteShell = ({ navigation, children }) => (
  <View style={styles.screen}>
    <BackButton
      onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('Onboarding'))}
    />
    <View style={styles.content}>{children}</View>
  </View>
);

// COPY-6 (Lumen, 2026-09-03): the three ways this screen can fail to show an
// invitation are not one error, they're three different facts about the code.
// Surface 2 and 3 never got a retry button crossed by mistake — retry only
// belongs where retrying can change the answer, and a code that resolves to
// nothing will resolve to nothing again.
//
// R-D2-5: these two consume `styles.heading`, which the landing centers, and
// `styles.body`, which it did not — after the bloom build they would have
// rendered a centered heading over a left-aligned body. `body` is centered in
// the stylesheet because both of its consumers are here. They get NO bloom: a
// dead link does not get handed the product's own material.
const InviteUnavailable = ({ navigation }) => (
  <InviteShell navigation={navigation}>
    <Text style={[styles.heading, styles.centered]}>This invitation isn't available.</Text>
    <Text style={styles.body}>Ask the person who invited you for a fresh link.</Text>
  </InviteShell>
);

const InviteUnreachable = ({ navigation, onRetry }) => (
  <InviteShell navigation={navigation}>
    <Text style={[styles.heading, styles.centered]}>We couldn't open this invitation.</Text>
    <Text style={styles.body}>Check your connection and try again.</Text>
    <PrimaryButton onPress={onRetry} containerStyle={styles.cta}>Try again</PrimaryButton>
  </InviteShell>
);

// R-D2-2 — the DES-37 legend the build dropped: "distinct register for
// 'Maya', regular for 'Sarah'." One weight step above the h2's Nunito-Bold,
// size and line height inherited, so the sentence emphasizes who reached out
// and not who it is about. One writer for all three renders of the sentence.
const InviterName = ({ name }) => <Text style={styles.inviterName}>{name}</Text>;

export const CombInviteLandingScreen = ({ navigation, route }) => {
  const { session } = useAuth();
  const inviteCode = route.params?.inviteCode;
  const [preview, setPreview] = useState(null);
  // 'loading' | 'unreachable' | 'notFound' | 'ready'
  const [status, setStatus] = useState('loading');

  const load = async () => {
    setStatus('loading');
    try {
      const next = await CombInviteStore.preview(inviteCode);
      if (!next) {
        setStatus('notFound');
        return;
      }
      setPreview(next);
      setStatus('ready');
    } catch (err) {
      console.warn('Comb invite preview failed', err);
      setStatus('unreachable');
    }
  };

  useEffect(() => {
    load();
  }, [inviteCode]);

  const continueToJoin = async () => {
    await PendingCombInvite.set(inviteCode);
    if (session) {
      navigation.navigate('CombInviteName', { inviteCode, preview });
    } else {
      navigation.navigate('Onboarding', { startAt: 'invite' });
    }
  };

  // R-D2-4 — the letter before it is opened, on the ready state's own axis
  // and in its own slot. The eyebrow is true of the link whatever it
  // resolves to; the comb is present before the invitation is; the honey
  // arrives with the preview, because honey marks something real.
  if (status === 'loading') {
    return (
      <InviteShell navigation={navigation}>
        <Text style={[styles.eyebrow, styles.centered]}>AN INVITATION TO WRITE</Text>
        <CombBloom cellSize={BLOOM_CELL_SIZE} honey={false} style={styles.bloomMount} />
        <Text style={[styles.secondary, styles.centered]}>Opening your invitation.</Text>
        <ActivityIndicator color={theme.colors.inkSoft} />
      </InviteShell>
    );
  }
  if (status === 'unreachable') return <InviteUnreachable navigation={navigation} onRetry={load} />;
  if (status === 'notFound') return <InviteUnavailable navigation={navigation} />;

  const countLine = preview.memberCount >= 3
    ? `${numberInWordsCapped(preview.memberCount)} people are in this comb.`
    : null;

  // Surface 1 (COPY-6): pre-launch, dormant, and subject-gone all collapse to
  // `hasActiveMonth === false` server-side, and the one sentence true across
  // all three is "there is no one to write for right now" — not "the month
  // hasn't started," which is false for subject-gone. Join stays offered:
  // the server already admits the membership row unconditionally.
  const disclosure = preview.hasActiveMonth
    ? `Everything written in this comb stays sealed until delivery. Only ${preview.subjectName} ever reads it.`
    : "Each month, this comb gathers around one person, and everything written stays sealed until it's delivered. There's no one to write for just yet. Join now and you'll be part of it when the month opens.";

  return (
    <InviteShell navigation={navigation}>
      {/* R-D2-1, the letter's three clusters. ADDRESS: eyebrow + heading,
          who is writing to you. SEAL: bloom + comb name + count line, the
          mark of the thing you are joining. PROMISE + ACT: disclosure, then
          the CTA. `content`'s gap is now the within-cluster beat and the
          three `marginTop: lg` nodes are the boundaries between them. */}
      <Text style={[styles.eyebrow, styles.centered]}>AN INVITATION TO WRITE</Text>
      <Text style={[styles.heading, styles.centered]}>
        <InviterName name={preview.inviterName} />
        {preview.hasActiveMonth ? ` asked you to write for ${preview.subjectName}.` : ' asked you to write.'}
      </Text>
      <CombBloom cellSize={BLOOM_CELL_SIZE} style={styles.bloomMount} />
      <Text style={styles.combName}>{preview.combName}</Text>
      {countLine ? <Text style={[styles.secondary, styles.centered]}>{countLine}</Text> : null}
      <Text style={styles.disclosure}>{disclosure}</Text>
      <PrimaryButton onPress={continueToJoin} containerStyle={styles.cta}>{session ? 'Continue' : 'Join with Magic Link'}</PrimaryButton>
    </InviteShell>
  );
};

export const CombInviteNameScreen = ({ navigation, route }) => {
  const inviteCode = route.params?.inviteCode;
  const [preview, setPreview] = useState(route.params?.preview ?? null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [needsName, setNeedsName] = useState(true);
  const [joinerProfileState, setJoinerProfileState] = useState('loading');

  useEffect(() => {
    if (preview || !inviteCode) return;
    CombInviteStore.preview(inviteCode).then(setPreview).catch(() => setError("We couldn't reopen this invitation."));
  }, [inviteCode, preview]);

  useEffect(() => {
    CombInviteStore.getJoinerProfile()
      .then((profile) => {
        setNeedsName(isPlaceholderName(profile?.display_name));
        setJoinerProfileState('succeeded');
      })
      .catch(() => {
        setError("We couldn't read your profile.");
        setJoinerProfileState('failed');
      });
  }, []);

  const submit = async () => {
    if (joinerProfileState !== 'succeeded' || (needsName && !name.trim()) || busy) return;
    setBusy(true);
    setError(null);
    try {
      await CombInviteStore.saveNameAndJoin(inviteCode, needsName ? name : undefined);
      await PendingCombInvite.clear();
      navigation.replace('Main', { screen: 'Today' });
    } catch (err) {
      console.warn('Comb invite join failed', err);
      setError("We couldn't join this comb. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BackButton onPress={() => navigation.goBack()} />
      {/* R-D2-6 — a form is not a poster. Every text node here stays
          left-aligned exactly as it shipped: the centering lives in
          `styles.centered`, applied at the landing's own call sites, and
          never in the shared `eyebrow`/`heading`/`secondary` keys. Only the
          bloom echo is centered, and it centers itself. */}
      <View style={styles.content}>
        <Text style={styles.eyebrow}>YOUR NAME IN THE COMB</Text>
        <Text style={styles.heading}>
          {preview ? (
            <>
              <InviterName name={preview.inviterName} />
              {` asked you to write for ${preview.subjectName}.`}
            </>
          ) : 'How should the comb know you?'}
        </Text>
        <CombBloom cellSize={BLOOM_ECHO_CELL_SIZE} style={styles.bloomMount} />
        {needsName ? <><Text style={styles.inputLabel}>Your name</Text><TextInput
          value={name}
          onChangeText={setName}
          placeholder="What's your name?"
          placeholderTextColor={theme.colors.inkSoft}
          autoCapitalize="words"
          autoCorrect={false}
          style={styles.input}
          accessibilityLabel="Your name"
        /></> : null}
        <Text style={styles.secondary}>
          The writers in this comb can see your name now; {preview?.subjectName ?? 'the recipient'} sees it with your letter when the month is delivered.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          onPress={submit}
          disabled={joinerProfileState !== 'succeeded' || (needsName && !name.trim()) || busy}
          loading={busy}
          containerStyle={styles.cta}
        >
          {needsName && name.trim() ? `Join as ${name.trim()}` : 'Join the comb'}
        </PrimaryButton>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background, paddingTop: 60, paddingHorizontal: theme.spacing.lg },
  // R-D2-1: the within-cluster beat. Cluster boundaries are the three
  // `marginTop: theme.spacing.lg` nodes below, which compose with this to
  // 32pt.
  content: { flex: 1, justifyContent: 'center', paddingBottom: 48, gap: theme.spacing.sm },
  // R-D2-3: `theme.type.label` governs the tracking. The one-off
  // `letterSpacing` that used to sit here and undercut the token's own value
  // is gone, and both eyebrow consumers inherit it. Written without naming
  // the retired number on purpose: D2's B3 row is a raw
  // `grep -F` over this file, so a justification comment quoting the value
  // would red the row that proves the override left.
  eyebrow: { ...theme.type.label, color: theme.colors.inkSoft },
  heading: { ...theme.type.h2, color: theme.colors.ink },
  inviterName: { fontFamily: theme.fonts.headerExtraBold },
  body: { ...theme.type.body, color: theme.colors.inkSoft, textAlign: 'center' },
  combName: { ...theme.type.h3, color: theme.colors.ink, textAlign: 'center' },
  secondary: { ...theme.type.bodySm, color: theme.colors.inkSoft },
  disclosure: { ...theme.type.body, color: theme.colors.ink, textAlign: 'center', marginTop: theme.spacing.lg },
  // R-RF-5.5 / R-D2-6: the landing centers by composing this at its own call
  // sites, so the shared keys stay neutral and the name screen keeps every
  // text node left-aligned.
  centered: { textAlign: 'center' },
  bloomMount: { alignSelf: 'center', marginTop: theme.spacing.lg },
  // The act at the end of the letter. On `PrimaryButton`'s `containerStyle`,
  // not its `style`: `style` reaches only the inner transform layer, one node
  // too deep to carry a margin (PressableScale's own R43 note).
  cta: { marginTop: theme.spacing.lg },
  inputLabel: { ...theme.type.label, color: theme.colors.ink, marginTop: theme.spacing.md },
  input: { ...theme.type.body, color: theme.colors.ink, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.surfaceBorderStrong, borderRadius: theme.borderRadius.small, minHeight: 54, paddingHorizontal: theme.spacing.md },
  error: { ...theme.type.bodySm, color: theme.colors.danger },
});
