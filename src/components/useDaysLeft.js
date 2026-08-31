import { useEffect, useState } from 'react';

// R-38.9-C / §1B.38.10 — the shared day-math `RotationFold`'s own header
// promises ("a rounding fix in one place fixes both surfaces"). Extracted
// unchanged from `RotationFrame.js`'s countdown effect (Math.ceil, 0-clamp,
// minute re-tick) so this is a pure move, not a retune.
//
// Exported as a pure core plus a thin hook on purpose: a hook can't be
// asserted outside a renderer, so `daysUntil` is what a gate actually calls.
export const daysUntil = (closesAt, now = Date.now()) => {
  if (!closesAt) return null;
  const closesAtMs = typeof closesAt === 'string' ? new Date(closesAt).getTime() : closesAt;
  const msRemaining = closesAtMs - now;
  return Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
};

export const useDaysLeft = (closesAt) => {
  const [daysLeft, setDaysLeft] = useState(() => daysUntil(closesAt));

  useEffect(() => {
    if (!closesAt) {
      setDaysLeft(null);
      return;
    }
    setDaysLeft(daysUntil(closesAt));
    const interval = setInterval(() => setDaysLeft(daysUntil(closesAt)), 60000);
    return () => clearInterval(interval);
  }, [closesAt]);

  return daysLeft;
};
