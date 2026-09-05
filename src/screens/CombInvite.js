import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../constants/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackButton } from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext';
import { CombInviteStore } from '../services/CombInviteStore';
import { PendingCombInvite } from '../services/pendingCombInvite';
import { numberInWordsCapped } from '../utils/numberWords';
import { isPlaceholderName } from '../utils/placeholderName';

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
const InviteUnavailable = ({ navigation }) => (
  <InviteShell navigation={navigation}>
    <Text style={styles.heading}>This invitation isn't available.</Text>
    <Text style={styles.body}>Ask the person who invited you for a fresh link.</Text>
  </InviteShell>
);

const InviteUnreachable = ({ navigation, onRetry }) => (
  <InviteShell navigation={navigation}>
    <Text style={styles.heading}>We couldn't open this invitation.</Text>
    <Text style={styles.body}>Check your connection and try again.</Text>
    <PrimaryButton onPress={onRetry}>Try again</PrimaryButton>
  </InviteShell>
);

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

  if (status === 'loading') {
    return <InviteShell navigation={navigation}><ActivityIndicator color={theme.colors.ink} /></InviteShell>;
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
  const heading = preview.hasActiveMonth
    ? `${preview.inviterName} asked you to write for ${preview.subjectName}.`
    : `${preview.inviterName} asked you to write.`;
  const disclosure = preview.hasActiveMonth
    ? `Everything written in this comb stays sealed until delivery. Only ${preview.subjectName} ever reads it.`
    : "Each month, this comb gathers around one person, and everything written stays sealed until it's delivered. There's no one to write for just yet. Join now and you'll be part of it when the month opens.";

  return (
    <InviteShell navigation={navigation}>
      <Text style={styles.eyebrow}>AN INVITATION TO WRITE</Text>
      <Text style={styles.heading}>{heading}</Text>
      <View style={styles.bloom}><Text style={styles.bloomGlyph}>✦</Text></View>
      <Text style={styles.combName}>{preview.combName}</Text>
      {countLine ? <Text style={styles.secondary}>{countLine}</Text> : null}
      <Text style={styles.disclosure}>{disclosure}</Text>
      <PrimaryButton onPress={continueToJoin}>{session ? 'Continue' : 'Join with Magic Link'}</PrimaryButton>
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
      <View style={styles.content}>
        <Text style={styles.eyebrow}>YOUR NAME IN THE COMB</Text>
        <Text style={styles.heading}>
          {preview ? `${preview.inviterName} asked you to write for ${preview.subjectName}.` : 'How should the comb know you?'}
        </Text>
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
        >
          {needsName && name.trim() ? `Join as ${name.trim()}` : 'Join the comb'}
        </PrimaryButton>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background, paddingTop: 60, paddingHorizontal: theme.spacing.lg },
  content: { flex: 1, justifyContent: 'center', paddingBottom: 48, gap: theme.spacing.md },
  eyebrow: { ...theme.type.label, color: theme.colors.inkSoft, letterSpacing: 1.2 },
  heading: { ...theme.type.h2, color: theme.colors.ink },
  body: { ...theme.type.body, color: theme.colors.inkSoft },
  combName: { ...theme.type.h3, color: theme.colors.ink, textAlign: 'center' },
  secondary: { ...theme.type.bodySm, color: theme.colors.inkSoft },
  disclosure: { ...theme.type.body, color: theme.colors.ink, marginTop: theme.spacing.sm },
  bloom: { width: 112, height: 112, borderRadius: 56, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.washYellow },
  bloomGlyph: { fontSize: 44, color: theme.colors.ink },
  inputLabel: { ...theme.type.label, color: theme.colors.ink, marginTop: theme.spacing.md },
  input: { ...theme.type.body, color: theme.colors.ink, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.surfaceBorderStrong, borderRadius: 14, minHeight: 54, paddingHorizontal: theme.spacing.md },
  error: { ...theme.type.bodySm, color: theme.colors.danger },
});
