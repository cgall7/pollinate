import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert } from 'react-native';
// react-native's own SafeAreaView is deprecated and warns on every render —
// react-native-safe-area-context is already a dependency (see Account.js).
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { HoneycombStore } from '../services/HoneycombStore';
import { BackButton } from '../components/BackButton';
import { PressableScale } from '../components/PressableScale';

// ENG-84 — the in-app deletion confirmation screen, App Store 5.1.1(v)'s
// required self-service path. Reached from Account.js's "Delete account"
// row (danger tone, same pattern as its own "Sign out" row).
//
// The paragraph below is the ruled disclosure copy (Lumen, one writer,
// OUTBOX/ENG84_DELETION_COPY.md, ruled by Colin 2026-08-30) — verbatim, not
// paraphrased. It is the actual App Store disclosure this screen exists to
// carry, so it renders as plain body text with nothing between it and the
// confirm action: this IS the moment the disclosure is for.
const DELETION_COPY =
  'Your account, your details, and any unsealed writing are deleted. ' +
  'Keepsakes you already gave stay with the people you gave them to, ' +
  'signed with the name you used then.';

export const DeleteAccountScreen = ({ navigation }) => {
  const [deleting, setDeleting] = useState(false);

  const performDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await HoneycombStore.deleteAccount();
      // Back to the front door, same as sign-out (Account.js) — there is no
      // session left for Main's tabs to render against.
      navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
    } catch (err) {
      setDeleting(false);
      console.warn('Failed to delete account', err);
      Alert.alert("Couldn't delete your account", 'Please try again.');
    }
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete your account?',
      "This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete my account', style: 'destructive', onPress: performDelete },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <BackButton onPress={() => navigation.goBack()} accessibilityLabel="Back" />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>Delete account</Text>
        <Text style={styles.body}>{DELETION_COPY}</Text>

        <View style={styles.card}>
          <PressableScale
            onPress={handleDeletePress}
            accessibilityLabel={deleting ? 'Deleting…' : 'Delete my account'}
            style={styles.deleteRow}
          >
            <Text style={styles.deleteLabel}>{deleting ? 'Deleting…' : 'Delete my account'}</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  content: {
    padding: 24,
    paddingTop: 12,
    paddingBottom: 60,
  },
  h1: {
    ...theme.type.h1,
    color: theme.colors.ink,
    marginBottom: 16,
  },
  body: {
    ...theme.type.body,
    color: theme.colors.inkSoft,
    marginBottom: 32,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.large,
    paddingHorizontal: 18,
    ...theme.shadows.card,
  },
  deleteRow: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  deleteLabel: {
    ...theme.type.bodySm,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.danger,
  },
});
