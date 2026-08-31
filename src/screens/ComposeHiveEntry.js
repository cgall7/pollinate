import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../constants/theme';
import { HiveStore } from '../services/HiveStore';
import { tagEntry } from '../utils/themeTagger';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackButton } from '../components/BackButton';
import { PaperPicker } from '../components/PaperPicker';
import { isPlaceholderName } from '../utils/placeholderName';

// 8b.3 — compose a new entry into an existing hive (Design Language §3's
// Compose Entry Screen). Date is always today, read-only, matching the spec
// and EntryStore's own `saveEntry(new Date(), ...)` convention.
export const ComposeHiveEntryScreen = ({ navigation, route }) => {
  const { hiveId, subjectName } = route.params;
  const [text, setText] = useState('');
  const [paper, setPaper] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (saving || !text.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const body = text.trim();
      await HiveStore.addHiveEntry(hiveId, new Date(), body, tagEntry(body), paper);
      navigation.goBack();
    } catch (err) {
      console.warn('ComposeHiveEntryScreen: failed to save entry', err);
      // SQLSTATE 42501 is entries_insert_own's refusal — one code, two
      // causes (no open volume / closed seat), so the cause a user is shown
      // comes from refetched state, never from the code itself (COPY-14;
      // the derivation lives on HiveStore.resolveEntryRefusal). Still a
      // permanent refusal, not a dropped connection, so each cause gets its
      // own copy rather than the retry prompt below.
      setError(err?.code === '42501' ? await HiveStore.resolveEntryRefusal(hiveId) : 'unknown');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
      </View>

      <View style={styles.content}>
        {/* ENG-96/COPY-6: a placeholder-class subjectName ('New user', or
            'Someone' via the mint's own backstop) can't be named — the
            title stays antecedent-free because the screen cannot vouch for
            a name it could not read. */}
        <Text style={styles.title}>
          {isPlaceholderName(subjectName)
            ? "What's something you're grateful for about this person?"
            : `What's something you're grateful for about ${subjectName}?`}
        </Text>
        <Text style={styles.dateLabel}>Today</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Write it here..."
          placeholderTextColor={theme.colors.inkFaint}
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          maxLength={10000}
        />
        {error === 'sealed' && (
          <Text style={styles.errorText}>This hive has been sealed and can't accept new entries.</Text>
        )}
        {error === 'seatClosed' && (
          <Text style={styles.errorText}>Your seat in this hive has closed — new entries can't be added.</Text>
        )}
        {error === 'unknown' && (
          <Text style={styles.errorText}>Couldn't save this entry. Check your connection and try again.</Text>
        )}
        <View style={styles.paperPickerWrap}>
          <PaperPicker paper={paper} onChange={setPaper} />
        </View>
        <PrimaryButton onPress={handleSave} disabled={!text.trim() || saving} style={styles.cta}>
          Save
        </PrimaryButton>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    ...theme.type.h2,
    color: theme.colors.ink,
    marginTop: 12,
  },
  dateLabel: {
    ...theme.type.label,
    color: theme.colors.inkSoft,
    marginTop: 12,
    marginBottom: 12,
  },
  textArea: {
    ...theme.type.body,
    color: theme.colors.ink,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: 20,
    minHeight: 200,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    textAlignVertical: 'top',
  },
  errorText: {
    ...theme.type.bodySm,
    color: theme.colors.danger,
    marginTop: 12,
  },
  paperPickerWrap: {
    marginTop: 20,
  },
  cta: {
    marginTop: 20,
  },
});
