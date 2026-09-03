export const nectarReturnFormationMs = (collapsed, nectar) => (collapsed ? nectar.gather : 0);

export const nectarFailureReturnPlan = ({ collapsed, nectar }) => ({
  formationMs: nectarReturnFormationMs(collapsed, nectar),
  authoritativeCountAt: 'origin',
});

export const nectarGiftLifecycleTrace = ({ reduced, commitAtMs, ok, nectar }) => {
  if (reduced) {
    const countStartMs = 0;
    const optimisticCountDoneMs = nectar.settle;
    if (ok) {
      return {
        countStartMs,
        resolveMs: Math.max(commitAtMs, optimisticCountDoneMs),
        events: ['gesture', 'optimistic-count', 'rpc-ok', 'resolve'],
      };
    }
    const authoritativeCountStartMs = commitAtMs;
    return {
      countStartMs,
      authoritativeCountStartMs,
      resolveMs: authoritativeCountStartMs + nectar.settle,
      events: ['gesture', 'optimistic-count', 'rpc-fail', 'authoritative-count', 'resolve'],
    };
  }

  const contactMs = nectar.gather + nectar.travel;
  if (ok) {
    return {
      contactMs,
      optimisticCountStartMs: contactMs,
      resolveMs: Math.max(commitAtMs, contactMs + nectar.absorbRise + nectar.absorbFall, contactMs + nectar.settle),
      events: ['gesture', 'contact', 'optimistic-count', 'stain', 'rpc-ok', 'resolve'],
    };
  }

  const failureKnownAtContact = commitAtMs <= contactMs;
  const returnStartMs = failureKnownAtContact ? contactMs : commitAtMs;
  const returnPlan = nectarFailureReturnPlan({ collapsed: !failureKnownAtContact, nectar });
  const formationMs = returnPlan.formationMs;
  const originMs = returnStartMs + formationMs + nectar.travel;
  const authoritativeCountStartMs = returnPlan.authoritativeCountAt === 'origin' ? originMs : returnStartMs;
  return {
    contactMs,
    optimisticCountStartMs: contactMs,
    returnStartMs,
    firstPositionChangeMs: returnStartMs,
    originMs,
    authoritativeCountStartMs,
    resolveMs: Math.max(originMs + nectar.gather, authoritativeCountStartMs + nectar.settle),
    events: ['gesture', 'contact', 'optimistic-count', 'rpc-fail', 'return', 'origin', 'authoritative-count', 'idle', 'resolve'],
  };
};
