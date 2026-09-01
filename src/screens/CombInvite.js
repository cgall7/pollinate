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
    <BackButton onPress={() => navigation.canGoBack() && navigation.goBack()} />
    <View style={styles.content}>{children}</View>
  </View>
);

const InviteError = ({ navigation, onRetry }) => (
  <InviteShell navigation={navigation}>
    <Text style={styles.heading}>This invitation isn't available.</Text>
    <Text style={styles.body}>Ask the person who invited you for a fresh link.</Text>
    <PrimaryButton onPress={onRetry}>Try again</PrimaryButton>
  </InviteShell>
);

export const CombInviteLandingScreen = ({ navigation, route }) => {
  const { session } = useAuth();
  const inviteCode = route.params?.inviteCode;
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const next = await CombInviteStore.preview(inviteCode);
      if (!next?.hasActiveMonth) throw new Error('No active month');
      setPreview(next);
    } catch (err) {
      console.warn('Comb invite preview failed', err);
      setFailed(true);
    } finally {
      setLoading(false);
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

  if (loading) {
    return <InviteShell navigation={navigation}><ActivityIndicator color={theme.colors.ink} /></InviteShell>;
  }
  if (failed || !preview) return <InviteError navigation={navigation} onRetry={load} />;

  const countLine = preview.memberCount >= 3
    ? `${numberInWordsCapped(preview.memberCount)} people are in this comb.`
    : null;

  return (
    <InviteShell navigation={navigation}>
      <Text style={styles.eyebrow}>AN INVITATION TO WRITE</Text>
      <Text style={styles.heading}>{preview.inviterName} asked you to write for {preview.subjectName}.</Text>
      <View style={styles.bloom}><Text style={styles.bloomGlyph}>✦</Text></View>
      <Text style={styles.combName}>{preview.combName}</Text>
      {countLine ? <Text style={styles.secondary}>{countLine}</Text> : null}
      <Text style={styles.disclosure}>
        Everything written in this comb stays sealed until delivery — only {preview.subjectName} ever reads it.
      </Text>
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

  useEffect(() => {
    if (preview || !inviteCode) return;
    CombInviteStore.preview(inviteCode).then(setPreview).catch(() => setError("We couldn't reopen this invitation."));
  }, [inviteCode, preview]);

  useEffect(() => {
    CombInviteStore.getJoinerProfile()
      .then((profile) => setNeedsName(isPlaceholderName(profile?.display_name)))
      .catch(() => setError("We couldn't read your profile."));
  }, []);

  const submit = async () => {
    if ((needsName && !name.trim()) || busy) return;
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
        <PrimaryButton onPress={submit} disabled={(needsName && !name.trim()) || busy} loading={busy}>
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
