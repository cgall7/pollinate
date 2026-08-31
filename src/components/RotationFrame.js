import React, { useState, useEffect } from 'react';
import { Text, View } from 'react-native';
import { theme } from '../constants/theme';

export const RotationFrame = ({ subjectName, organizerName, closesAt, sealedAt }) => {
  const [daysRemaining, setDaysRemaining] = useState(null);

  useEffect(() => {
    if (!closesAt || sealedAt) return;

    const updateDays = () => {
      const now = Date.now();
      const closesAtMs = typeof closesAt === 'string' ? new Date(closesAt).getTime() : closesAt;
      const msRemaining = closesAtMs - now;
      const days = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
      setDaysRemaining(Math.max(0, days));
    };

    updateDays();
    const interval = setInterval(updateDays, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [closesAt, sealedAt]);

  if (!subjectName) return null;

  const isSealed = !!sealedAt;

  if (isSealed) {
    return (
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <Text style={{ ...theme.type.label, color: theme.colors.ink }}>
          You received {subjectName}'s journal
        </Text>
        {organizerName && (
          <Text style={{ ...theme.type.bodySm, color: theme.colors.inkSoft }}>
            Next month: {organizerName} leads
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
      <Text style={{ ...theme.type.label, color: theme.colors.ink }}>
        Writing for {subjectName}
      </Text>
      {daysRemaining !== null && (
        <Text style={{ ...theme.type.bodySm, color: theme.colors.inkSoft }}>
          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
        </Text>
      )}
    </View>
  );
};
