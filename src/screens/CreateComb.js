import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { BackButton } from '../components/BackButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { PressableScale } from '../components/PressableScale';
import { HoneycombStore } from '../services/HoneycombStore';
import { CombStore } from '../services/CombStore';

// DES-29: the organizer can only choose a connection. This is both the
// readable-name constraint and the month-one contributor guarantee; the
// organizer never appears as the first subject.
export const CreateCombScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [connections, setConnections] = useState([]);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdCombId, setCreatedCombId] = useState(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    HoneycombStore.listConnections()
      .then((rows) => { if (!cancelled) setConnections(rows); })
      .catch(() => { if (!cancelled) setError("We couldn't load your connections."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  useFocusEffect(load);

  const create = async () => {
    if (saving || !name.trim() || !subject) return;
    setSaving(true);
    setError('');
    try {
      let result;
      if (createdCombId) {
        result = await CombStore.openFirstRotation({ combId: createdCombId, subjectProfileId: subject.id });
      } else {
        try {
          result = await CombStore.createComb({ name, subjectProfileId: subject.id });
        } catch (err) {
          // The comb row is durable before the mint. Keep its id when the
          // RPC is the failed half so Retry never creates a second comb.
          const existingId = err?.combId;
          if (existingId) setCreatedCombId(existingId);
          throw err;
        }
      }
      const { hiveId } = result;
      navigation.replace('HiveDetail', { hiveId });
    } catch (err) {
      console.warn('CreateCombScreen: create failed', err);
      setError(createdCombId ? "We couldn't open the first month. Try again." : "We couldn't start this comb. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return <View style={styles.container}>
    <View style={styles.header}><BackButton onPress={() => navigation.goBack()} /></View>
    <FlatList
      data={connections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<>
        <Text style={styles.eyebrow}>START A COMB</Text>
        <Text style={styles.title}>Who are you gathering around?</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Name this comb" placeholderTextColor={theme.colors.inkFaint} maxLength={100} />
        <Text style={styles.label}>Who is this first month for?</Text>
        <Text style={styles.help}>Choose a connection. You’ll write for them together this month.</Text>
      </>}
      ListEmptyComponent={loading ? <ActivityIndicator color={theme.colors.accent} /> : <Text style={styles.help}>Add a connection first, then start a comb together.</Text>}
      renderItem={({ item }) => {
        const selected = subject?.id === item.id;
        return <PressableScale onPress={() => setSubject(item)} style={[styles.person, selected && styles.personSelected]} accessibilityLabel={`Choose ${item.display_name || 'this connection'}`}>
          <Text style={styles.personName}>{item.display_name || 'A connection'}</Text><Text style={styles.check}>{selected ? '✓' : ''}</Text>
        </PressableScale>;
      }}
    />
    <View style={styles.footer}>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton onPress={create} loading={saving} disabled={!name.trim() || !subject || loading}>Start this comb</PrimaryButton>
    </View>
  </View>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background }, header: { padding: 24, paddingTop: 56 }, content: { paddingHorizontal: 24, paddingBottom: 20 }, eyebrow: { ...theme.type.caption, color: theme.colors.inkSoft, letterSpacing: 1.2 }, title: { ...theme.type.h1, color: theme.colors.ink, marginTop: 10 }, input: { ...theme.type.bodyLg, color: theme.colors.ink, borderBottomWidth: 1, borderColor: theme.colors.surfaceBorderStrong, paddingVertical: 14, marginTop: 22 }, label: { ...theme.type.h3, color: theme.colors.ink, marginTop: 30 }, help: { ...theme.type.bodySm, color: theme.colors.inkSoft, marginTop: 6, marginBottom: 14 }, person: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginBottom: 10, borderRadius: theme.borderRadius.medium, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.surfaceBorder }, personSelected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.washYellow }, personName: { ...theme.type.bodyLg, color: theme.colors.ink }, check: { ...theme.type.h3, color: theme.colors.ink }, footer: { padding: 24, borderTopWidth: 1, borderColor: theme.colors.surfaceBorder }, error: { ...theme.type.bodySm, color: theme.colors.inkSoft, marginBottom: 10 },
});
