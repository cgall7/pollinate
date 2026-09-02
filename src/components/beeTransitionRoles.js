import { bankFor, pitchFor } from './beeAttitude';

export const BEE_TRANSITION_ROLES = {
  'like-lift': {
    durationMs: 360,
    points: [
      { x: -4, y: 4 },
      { x: 15, y: -27 },
      { x: 46, y: -38 },
    ],
    end: 'absent',
    retrigger: 'coalesce',
    easing: 'out-cubic',
  },
  'share-carry': {
    durationMs: 720,
    points: [
      { x: 10, y: 10 },
      { x: 8, y: -74 },
      { x: -30, y: -130 },
    ],
    end: 'absent',
    retrigger: 'one-shot',
    easing: 'in-out-quad',
  },
  'feed-arrival': {
    durationMs: 520,
    points: [
      { x: -50, y: -24 },
      { x: -18, y: 2 },
      { x: 30, y: 6 },
    ],
    end: 'absent',
    retrigger: 'batch',
    easing: 'out-cubic',
  },
  'seal-arrival': {
    durationMs: 960,
    points: [
      { x: -130, y: -60 },
      { x: -65, y: -90 },
      { x: 0, y: 0 },
    ],
    end: 'present',
    retrigger: 'one-shot',
    easing: 'in-out-quad',
  },
};

export const beeTransitionEasing = (name, Easing) => {
  if (name === 'out-cubic') return Easing.out(Easing.cubic);
  if (name === 'in-out-quad') return Easing.inOut(Easing.quad);
  throw new Error(`Unknown BeeTransition easing: ${name}`);
};

const quadraticPoint = (points, t) => {
  const inv = 1 - t;
  return {
    x: inv * inv * points[0].x + 2 * inv * t * points[1].x + t * t * points[2].x,
    y: inv * inv * points[0].y + 2 * inv * t * points[1].y + t * t * points[2].y,
  };
};

const quadraticDerivative = (points, t) => ({
  x: 2 * (1 - t) * (points[1].x - points[0].x) + 2 * t * (points[2].x - points[1].x),
  y: 2 * (1 - t) * (points[1].y - points[0].y) + 2 * t * (points[2].y - points[1].y),
});

const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

const sealCompletionBank = (role, progress, bankDeg) => {
  if (role !== 'seal-arrival' || progress < 0.75) return bankDeg;
  return bankDeg * Math.max(0, 1 - (progress - 0.75) / 0.25);
};

export const buildBeeTransitionTrack = (role, samples = 24) => {
  const def = BEE_TRANSITION_ROLES[role];
  if (!def) throw new Error(`Unknown BeeTransition role: ${role}`);

  const fine = [];
  let length = 0;
  let previous = quadraticPoint(def.points, 0);
  fine.push({ t: 0, point: previous, length });
  for (let i = 1; i <= samples * 8; i += 1) {
    const t = i / (samples * 8);
    const point = quadraticPoint(def.points, t);
    length += distance(previous, point);
    fine.push({ t, point, length });
    previous = point;
  }

  const inputRange = [];
  const translateX = [];
  const translateY = [];
  const rotate = [];
  for (let i = 0; i <= samples; i += 1) {
    const target = (length * i) / samples;
    const upper = fine.findIndex((item) => item.length >= target);
    const hi = fine[Math.max(upper, 0)];
    const lo = fine[Math.max(upper - 1, 0)];
    const span = hi.length - lo.length || 1;
    const t = lo.t + ((target - lo.length) / span) * (hi.t - lo.t);
    const point = quadraticPoint(def.points, t);
    const tangent = quadraticDerivative(def.points, t);
    inputRange.push(i / samples);
    translateX.push(point.x);
    translateY.push(point.y);
    const bank = bankFor(pitchFor(tangent.x, tangent.y));
    rotate.push(`${sealCompletionBank(role, i / samples, bank)}deg`);
  }

  return { ...def, inputRange, translateX, translateY, rotate };
};

export const beeTransitionStartPlan = ({ role, triggerKey, lastTriggerKey, active, settled }) => {
  const def = BEE_TRANSITION_ROLES[role];
  if (!def || triggerKey === lastTriggerKey) return { shouldStart: false, shouldRecordTrigger: false };
  if (active) return { shouldStart: false, shouldRecordTrigger: true };
  if (settled && def.end === 'present' && def.retrigger === 'one-shot') return { shouldStart: false, shouldRecordTrigger: true };
  return { shouldStart: true, shouldRecordTrigger: true };
};

export const beeTransitionMotionPlan = ({ resolved, reduced, active, mode }) => {
  const substitute = !resolved || reduced;
  if (!active) return { mode: substitute ? 'substitute' : 'travel', replaceActiveTravel: false };
  return { mode, replaceActiveTravel: mode === 'travel' && substitute };
};

export const replaceActiveBeeTransitionTravel = ({ animation, setRenderMode, startSubstitute }) => {
  animation?.stop?.();
  setRenderMode('substitute');
  startSubstitute();
};
