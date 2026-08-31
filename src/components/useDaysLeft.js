import { useMemo } from 'react';

const DAY_MS = 24 * 60 * 60 * 1000;

export const daysUntil = (closesAt, now = new Date()) => {
  const closeTime = new Date(closesAt).getTime();
  const nowTime = now.getTime();
  if (!Number.isFinite(closeTime) || !Number.isFinite(nowTime)) return null;
  return Math.max(0, Math.ceil((closeTime - nowTime) / DAY_MS));
};

export const useDaysLeft = (closesAt) => useMemo(() => daysUntil(closesAt), [closesAt]);
