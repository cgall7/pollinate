import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { BackButton } from '../components/BackButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { RotationFold } from '../components/RotationFold';
import { hiveCoverTheme } from '../constants/hiveThemes';
import { HiveStore } from '../services/HiveStore';

const daysUntil = (closesAt, now = Date.now()) => {
  if (!closesAt) return null;
  const closesAtMs = typeof closesAt === 'string' ? new Date(closesAt).getTime() : closesAt;
  if (!Number.isFinite(closesAtMs)) return null;
  return Math.max(0, Math.ceil((closesAtMs - now) / (1000 * 60 * 60 * 24)));
};

export const COMB_COLLECT_ROUTE = 'CombCollect';

// Route params owned by the invite/auth lane:
//   { rotationId } preferred, or { combId } to resolve the current open row.
// This screen intentionally is not registered in App.js on this branch.
export const CombCollectScreen = ({ navigation, route }) => {
  const { rotationId, combId } = route.params ?? {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rotation, setRotation] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const next = await HiveStore.getCombCollectRotation({ rotationId, combId });
          if (cancelled) return;
          setError(false);
          setRotation(next);
        } catch (err) {
          if (cancelled) return;
          console.warn('CombCollectScreen: failed to load collect rotation', err);
          setError(true);
          setRotation(null);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [rotationId, combId])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }

  if (error || !rotation) {
    return (
      <View style={[styles.container, styles.centered]}>
        <BackButton onPress={() => navigation.goBack()} style={styles.backButtonFloating} />
        <Text style={styles.emptyTitle}>We couldn't reach this comb.</Text>
        <Text style={styles.emptyBody}>Check your connection and try again.</Text>
      </View>
    );
  }

  const cover = hiveCoverTheme(rotation.coverTheme);
  const daysLeft = daysUntil(rotation.closesAt);

  return (
    <View style={styles.container}>
      <View style={[styles.banner, { backgroundColor: cover.base }]}>
        <BackButton onPress={() => navigation.goBack()} variant="glass" color={cover.textColor} style={styles.backButton} />
        <Text style={[styles.bannerKicker, { color: cover.textColor }]}>THIS MONTH'S COMB</Text>
        <RotationFold
          variant="member"
          subjectName={rotation.subjectName}
          daysLeft={daysLeft}
          count={rotation.writerCount}
          countKind="writers"
          style={styles.fold}
        />
      </View>

      <View style={styles.body}>
        <Text style={styles.bodyTitle}>Add your entry for this rotation.</Text>
        <Text style={styles.bodyCopy}>
          Your note joins the group reveal when the month closes.
        </Text>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          onPress={() => navigation.navigate('ComposeHiveEntry', {
            hiveId: rotation.hiveId,
            subjectName: rotation.subjectName,
          })}
        >
          Write an entry
        </PrimaryButton>
      </View>
    </View>
  );
};

export { daysUntil as daysUntilCombCollect };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backButtonFloating: {
    position: 'absolute',
    top: 60,
    left: 24,
  },
  banner: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  backButton: {
    marginBottom: 18,
  },
  bannerKicker: {
    ...theme.type.eyebrow,
    marginBottom: theme.spacing.sm,
  },
  fold: {
    gap: 0,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  bodyTitle: {
    ...theme.type.h2,
    color: theme.colors.ink,
  },
  bodyCopy: {
    ...theme.type.body,
    color: theme.colors.inkSoft,
    marginTop: theme.spacing.sm,
  },
  footer: {
    marginTop: 'auto',
    padding: 24,
    paddingBottom: 36,
  },
  emptyTitle: {
    ...theme.type.h2,
    color: theme.colors.ink,
    textAlign: 'center',
  },
  emptyBody: {
    ...theme.type.body,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});
