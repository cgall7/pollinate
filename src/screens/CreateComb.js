import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../constants/theme';
import { BackButton } from '../components/BackButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { PressableScale } from '../components/PressableScale';
import { CombStore } from '../services/CombStore';
import { useAuth } from '../contexts/AuthContext';
import { isPlaceholderName } from '../utils/placeholderName';

const CADENCES = [
  { value: '1 month', label: 'One month', detail: 'The rhythm we recommend' },
  { value: '2 months', label: 'Two months', detail: 'A little more breathing room' },
  { value: '3 months', label: 'Three months', detail: 'A slower gathering' },
];

// DES-29 §0/§2/§4 (amended 2026-09-04): this screen collects the comb's
// name and cadence only — one write, `insert into combs`. The subject
// question moved to the pre-launch organizer card's own mint affordance
// (OrganizerCombCard's MintRotationSheet), the first moment the ruled
// population (comb members ∪ connections) isn't empty by construction. A
// cold account with zero connections can now reach this screen's CTA and
// still create a comb — the growth loop no longer requires a subject to
// exist before the comb does.
export const CreateCombScreen = ({ navigation }) => {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cadence, setCadence] = useState('1 month');
  const initialOrganizerName = session?.user?.user_metadata?.display_name ?? '';
  const [organizerName, setOrganizerName] = useState(initialOrganizerName);
  const needsOrganizerName = isPlaceholderName(initialOrganizerName);

  const create = async () => {
    if (saving || !name.trim()) return;
    setSaving(true);
    setError('');
    try {
      if (needsOrganizerName) await CombStore.saveOrganizerName(organizerName);
      await CombStore.createComb({ name, cadence });
      // DES-39's organizer contract is the expandable card on Today, not a
      // rotation-hive detail route. The new (pre-launch) comb is visible
      // there immediately, with the mint affordance in reach.
      navigation.replace('Main', { screen: 'Today' });
    } catch (err) {
      console.warn('CreateCombScreen: create failed', err);
      setError("We couldn't start this comb. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return <View style={styles.container}>
    <View style={styles.header}><BackButton onPress={() => navigation.goBack()} /></View>
    <View style={styles.content}>
      <Text style={styles.eyebrow}>START A COMB</Text>
      <Text style={styles.title}>Who are you gathering around?</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Name this comb" placeholderTextColor={theme.colors.inkFaint} maxLength={100} />
      {needsOrganizerName && <><Text style={styles.label}>What should your people call you?</Text><TextInput value={organizerName} onChangeText={setOrganizerName} style={styles.input} placeholder="Your name" placeholderTextColor={theme.colors.inkFaint} maxLength={100} /></>}
      <Text style={styles.label}>How long is each month?</Text>
      {CADENCES.map((option) => <PressableScale key={option.value} onPress={() => setCadence(option.value)} style={[styles.person, cadence === option.value && styles.personSelected]}><View><Text style={styles.personName}>{option.label}</Text><Text style={styles.help}>{option.detail}</Text></View><Text style={styles.check}>{cadence === option.value ? '✓' : ''}</Text></PressableScale>)}
    </View>
    <View style={styles.footer}>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton onPress={create} loading={saving} disabled={!name.trim() || (needsOrganizerName && !organizerName.trim())}>{needsOrganizerName ? `Create the comb as ${organizerName.trim() || 'you'}` : 'Start this comb'}</PrimaryButton>
    </View>
  </View>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background }, header: { padding: 24, paddingTop: 56 }, content: { flex: 1, paddingHorizontal: 24, paddingBottom: 20 }, eyebrow: { ...theme.type.caption, color: theme.colors.inkSoft, letterSpacing: 1.2 }, title: { ...theme.type.h1, color: theme.colors.ink, marginTop: 10 }, input: { ...theme.type.bodyLg, color: theme.colors.ink, borderBottomWidth: 1, borderColor: theme.colors.surfaceBorderStrong, paddingVertical: 14, marginTop: 22 }, label: { ...theme.type.h3, color: theme.colors.ink, marginTop: 30 }, help: { ...theme.type.bodySm, color: theme.colors.inkSoft, marginTop: 6, marginBottom: 14 }, person: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginBottom: 10, borderRadius: theme.borderRadius.medium, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.surfaceBorder }, personSelected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.washYellow }, personName: { ...theme.type.bodyLg, color: theme.colors.ink }, check: { ...theme.type.h3, color: theme.colors.ink }, footer: { padding: 24, borderTopWidth: 1, borderColor: theme.colors.surfaceBorder }, error: { ...theme.type.bodySm, color: theme.colors.inkSoft, marginBottom: 10 },
});
