export const pollinationLandingResult = (current, key) => ({
  accepted: current?.key === key,
  pollination: current?.key === key ? null : current,
});

export const pollinationCancelResult = (current, key) => ({
  accepted: current?.key === key,
  pollination: current?.key === key ? null : current,
});

export const boundedPollinationAims = (aims, { currentKey = null, latestKey = null } = {}) => {
  const keep = new Set([currentKey, latestKey].filter((key) => key != null));
  for (const key of Array.from(aims.keys())) {
    if (!keep.has(key)) aims.delete(key);
  }
  return aims;
};

export const pollinationCancelPlanEffect = ({ planKind = null, planKey = null, pendingLaunchKey = null, cancelKey = null } = {}) => ({
  clearPendingLaunch: pendingLaunchKey != null && pendingLaunchKey === cancelKey,
  stopActive: (planKind === 'visit' && planKey === cancelKey) || (planKind === 'preflight-wheel' && pendingLaunchKey === cancelKey),
});
