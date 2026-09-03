// MP-1 BeeTransition gate.
//
// This gate imports the product role table and path sampler by evaluating the
// source after stripping ESM syntax. That keeps the executable rows tied to
// the product mechanism without requiring a React Native runtime in Node.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { parse } from '@babel/parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (...parts) => path.join(ROOT, ...parts);
const posix = (file) => path.relative(ROOT, file).split(path.sep).join('/');

let pass = 0;
const failures = [];
const ok = (label) => {
  pass += 1;
  console.log(`PASS ${label}`);
};
const bad = (label, detail) => failures.push({ label, detail });

const parseJs = (src) => parse(src, {
  sourceType: 'module',
  plugins: ['jsx'],
});

const walk = (node, visit) => {
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((child) => walk(child, visit));
    else if (value && typeof value === 'object' && value.type) walk(value, visit);
  }
};

const loadRoles = async () => {
  const file = rel('src/components/beeTransitionRoles.js');
  const src = await readFile(file, 'utf8');
  const attitude = await readFile(rel('src/components/beeAttitude.js'), 'utf8');
  const attitudeRunnable = attitude
    .replace(/export const /g, 'const ')
    .replace(/export /g, '');
  const runnable = src
    .replace("import { bankFor, pitchFor } from './beeAttitude';\n\n", '')
    .replace(/export const /g, 'const ')
    .replace(/export /g, '');
  const context = {};
  vm.createContext(context);
  vm.runInContext(
    `${attitudeRunnable}\n${runnable}\n` +
      'this.BEE_TRANSITION_ROLES = BEE_TRANSITION_ROLES;\n' +
      'this.beeTransitionEasing = beeTransitionEasing;\n' +
      'this.buildBeeTransitionTrack = buildBeeTransitionTrack;\n' +
      'this.beeTransitionStartPlan = beeTransitionStartPlan;\n' +
      'this.beeTransitionMotionPlan = beeTransitionMotionPlan;\n' +
      'this.replaceActiveBeeTransitionTravel = replaceActiveBeeTransitionTravel;\n' +
      'this.pitchFor = pitchFor;\n' +
      'this.bankFor = bankFor;',
    context,
  );
  return context;
};

const {
  BEE_TRANSITION_ROLES,
  beeTransitionEasing,
  beeTransitionMotionPlan,
  beeTransitionStartPlan,
  buildBeeTransitionTrack,
  pitchFor,
  replaceActiveBeeTransitionTravel,
  bankFor,
} = await loadRoles();

const expected = {
  'like-lift': { durationMs: 360, points: [[-4, 4], [15, -27], [46, -38]], end: 'absent', retrigger: 'coalesce', easing: 'out-cubic', curveFloor: 4 },
  'share-carry': { durationMs: 720, points: [[10, 10], [8, -74], [-30, -130]], end: 'absent', retrigger: 'one-shot', easing: 'in-out-quad', curveFloor: 8 },
  'feed-arrival': { durationMs: 520, points: [[-50, -24], [-18, 2], [30, 6]], end: 'absent', retrigger: 'batch', easing: 'out-cubic', curveFloor: 4 },
  'seal-arrival': { durationMs: 960, points: [[-130, -60], [-65, -90], [0, 0]], end: 'present', retrigger: 'one-shot', easing: 'in-out-quad', curveFloor: 8 },
};

{
  const roles = Object.keys(BEE_TRANSITION_ROLES).sort();
  const wanted = Object.keys(expected).sort();
  if (JSON.stringify(roles) === JSON.stringify(wanted)) ok('M1 roles — exactly the four governing roles exist');
  else bad('M1 roles', `found ${roles.join(', ')}`);

  for (const [role, exp] of Object.entries(expected)) {
    const got = BEE_TRANSITION_ROLES[role];
    const points = got?.points?.map((p) => [p.x, p.y]);
    const rowId = `M2${role.replace(/[^a-z0-9]/gi, '')}`;
    if (
      got?.durationMs === exp.durationMs &&
      got?.end === exp.end &&
      got?.retrigger === exp.retrigger &&
      got?.easing === exp.easing &&
      JSON.stringify(points) === JSON.stringify(exp.points)
    ) ok(`${rowId} — duration, points, end, retrigger, and easing match`);
    else bad(rowId, JSON.stringify(got));
  }
}

{
  const calls = [];
  const fakeEasing = {
    cubic: 'cubic',
    quad: 'quad',
    out: (base) => {
      calls.push(['out', base]);
      return `out(${base})`;
    },
    inOut: (base) => {
      calls.push(['inOut', base]);
      return `inOut(${base})`;
    },
  };
  const got = Object.fromEntries(Object.keys(expected).map((role) => [
    role,
    beeTransitionEasing(BEE_TRANSITION_ROLES[role].easing, fakeEasing),
  ]));
  const exact =
    got['like-lift'] === 'out(cubic)' &&
    got['feed-arrival'] === 'out(cubic)' &&
    got['share-carry'] === 'inOut(quad)' &&
    got['seal-arrival'] === 'inOut(quad)';
  if (exact) ok('M14 role easing — prompt roles use out(cubic), carrying/landing roles use inOut(quad)');
  else bad('M14 role easing', JSON.stringify({ got, calls }));
}

{
  const cases = [
    ['like active coalesces without a queued start', { role: 'like-lift', triggerKey: 2, lastTriggerKey: 1, active: true, settled: false }, false, true],
    ['share active coalesces while the caller serializes success', { role: 'share-carry', triggerKey: 2, lastTriggerKey: 1, active: true, settled: false }, false, true],
    ['feed refresh batch coalesces while active', { role: 'feed-arrival', triggerKey: 2, lastTriggerKey: 1, active: true, settled: false }, false, true],
    ['share one-shot starts once', { role: 'share-carry', triggerKey: 2, lastTriggerKey: 1, active: false, settled: false }, true, true],
    ['share one-shot can start again after a completed successful share', { role: 'share-carry', triggerKey: 3, lastTriggerKey: 2, active: false, settled: true }, true, true],
    ['seal one-shot does not replay after settle', { role: 'seal-arrival', triggerKey: 3, lastTriggerKey: 2, active: false, settled: true }, false, true],
  ];
  const misses = cases.filter(([, input, shouldStart, shouldRecordTrigger]) => {
    const got = beeTransitionStartPlan(input);
    return got.shouldStart !== shouldStart || got.shouldRecordTrigger !== shouldRecordTrigger;
  });
  if (misses.length === 0) ok('M13 retrigger planner — active shares coalesce, completed shares restart, settled seal does not replay');
  else bad('M13', misses.map(([name]) => name).join(', '));
}

{
  const cases = [
    ['unresolved fails closed to substitute', { resolved: false, reduced: false, active: false, mode: 'idle' }, 'substitute', false],
    ['resolved RM uses substitute', { resolved: true, reduced: true, active: false, mode: 'idle' }, 'substitute', false],
    ['resolved normal starts travel', { resolved: true, reduced: false, active: false, mode: 'idle' }, 'travel', false],
    ['normal to RM replaces active travel', { resolved: true, reduced: true, active: true, mode: 'travel' }, 'travel', true],
    ['RM to normal does not inject travel into active substitute', { resolved: true, reduced: false, active: true, mode: 'substitute' }, 'substitute', false],
  ];
  const misses = cases.filter(([, input, mode, replaceActiveTravel]) => {
    const got = beeTransitionMotionPlan(input);
    return got.mode !== mode || got.replaceActiveTravel !== replaceActiveTravel;
  });
  if (misses.length === 0) ok('M16 motion planner — unresolved/RM fail closed and normal→RM replaces active travel');
  else bad('M16 motion planner', misses.map(([name]) => name).join(', '));
}

const perpendicularDistance = ([x0, y0], [cx, cy], [x1, y1]) => {
  const dx = x1 - x0;
  const dy = y1 - y0;
  return Math.abs(dy * cx - dx * cy + x1 * y0 - y1 * x0) / Math.hypot(dx, dy);
};

const maxSampledChordDistance = (track) => {
  const first = [track.translateX[0], track.translateY[0]];
  const lastIndex = track.translateX.length - 1;
  const last = [track.translateX[lastIndex], track.translateY[lastIndex]];
  return Math.max(...track.translateX.map((x, index) => (
    perpendicularDistance(first, [x, track.translateY[index]], last)
  )));
};

const sampledQuadraticT = (points, sampleIndex, samples = 24) => {
  let length = 0;
  let previous = { x: points[0][0], y: points[0][1] };
  const fine = [{ t: 0, length }];
  for (let i = 1; i <= samples * 8; i += 1) {
    const t = i / (samples * 8);
    const point = {
      x: (1 - t) * (1 - t) * points[0][0] + 2 * (1 - t) * t * points[1][0] + t * t * points[2][0],
      y: (1 - t) * (1 - t) * points[0][1] + 2 * (1 - t) * t * points[1][1] + t * t * points[2][1],
    };
    length += Math.hypot(point.x - previous.x, point.y - previous.y);
    fine.push({ t, length });
    previous = point;
  }
  const target = (length * sampleIndex) / samples;
  const upper = fine.findIndex((item) => item.length >= target);
  const hi = fine[Math.max(upper, 0)];
  const lo = fine[Math.max(upper - 1, 0)];
  const span = hi.length - lo.length || 1;
  return lo.t + ((target - lo.length) / span) * (hi.t - lo.t);
};

const derivativeAt = (points, t) => ({
  x: 2 * (1 - t) * (points[1][0] - points[0][0]) + 2 * t * (points[2][0] - points[1][0]),
  y: 2 * (1 - t) * (points[1][1] - points[0][1]) + 2 * t * (points[2][1] - points[1][1]),
});

{
  for (const role of Object.keys(expected)) {
    const roleExpected = expected[role];
    const track = buildBeeTransitionTrack(role);
    const first = { x: track.translateX[0], y: track.translateY[0] };
    const last = {
      x: track.translateX[track.translateX.length - 1],
      y: track.translateY[track.translateY.length - 1],
    };
    const exp = roleExpected.points;
    const exact =
      Math.abs(first.x - exp[0][0]) < 1e-9 &&
      Math.abs(first.y - exp[0][1]) < 1e-9 &&
      Math.abs(last.x - exp[2][0]) < 1e-9 &&
      Math.abs(last.y - exp[2][1]) < 1e-9;
    if (exact) ok(`M3 endpoints ${role} — start/end are exact`);
    else bad(`M3 endpoints ${role}`, `first=${JSON.stringify(first)} last=${JSON.stringify(last)}`);

    const curveDistance = maxSampledChordDistance(track);
    const rowId = `M4${role.replace(/[^a-z0-9]/gi, '')}`;
    if (curveDistance >= roleExpected.curveFloor) ok(`${rowId} — sampled track clears endpoint chord by ${curveDistance.toFixed(2)}pt`);
    else bad(rowId, `sampled track clears ${curveDistance.toFixed(2)}pt; floor ${roleExpected.curveFloor}pt`);

    const speeds = [];
    for (let i = 1; i < track.translateX.length; i += 1) {
      speeds.push(Math.hypot(track.translateX[i] - track.translateX[i - 1], track.translateY[i] - track.translateY[i - 1]));
    }
    const minInterior = Math.min(...speeds.slice(1, -1));
    if (minInterior > 0.1) ok(`M5 velocity ${role} — no interior stop in arc-length samples`);
    else bad(`M5 velocity ${role}`, `minimum interior step ${minInterior}`);

    const worstBank = Math.max(...track.rotate.map((deg) => Math.abs(parseFloat(deg))));
    if (worstBank <= 22) ok(`M6 bank ${role} — tangent-derived bank stays within ±22°`);
    else bad(`M6 bank ${role}`, `worst bank ${worstBank}`);

    if (role === 'seal-arrival') {
      const banks = track.rotate.map((deg) => Math.abs(parseFloat(deg)));
      const lastQuarter = banks.slice(Math.floor((banks.length - 1) * 0.75));
      const decreasing = lastQuarter.every((bank, index) => index === 0 || bank <= lastQuarter[index - 1] + 1e-9);
      const finalLevel = banks[banks.length - 1] === 0;
      const untaperedThroughBoundary = track.inputRange.every((progress, index) => {
        if (progress > 0.75) return true;
        const t = sampledQuadraticT(roleExpected.points, index);
        const tangent = derivativeAt(roleExpected.points, t);
        const untapered = bankFor(pitchFor(tangent.x, tangent.y));
        return Math.abs(parseFloat(track.rotate[index]) - untapered) < 1e-9;
      });
      const changesAfterBoundary = Math.abs(parseFloat(track.rotate[Math.ceil((track.rotate.length - 1) * 0.75) + 1])) < lastQuarter[0];
      if (decreasing && finalLevel && untaperedThroughBoundary && changesAfterBoundary) ok('M17 seal bank unwind — final-quarter correction starts after 0.75 and ends level');
      else bad('M17 seal bank unwind', JSON.stringify({ lastQuarter, untaperedThroughBoundary, changesAfterBoundary }));
    }
  }
}

const beeFile = rel('src/components/BeeTransition.js');
const beeSource = await readFile(beeFile, 'utf8');
const beeAst = parseJs(beeSource);

const calleeName = (node) => {
  if (!node) return null;
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'MemberExpression' && node.property?.type === 'Identifier') return node.property.name;
  return null;
};

const bodyStatements = (fn) => {
  if (!fn) return [];
  if (fn.type === 'BlockStatement') return fn.body;
  if (fn.body?.type === 'BlockStatement') return fn.body.body;
  return [];
};

const functionBodyNamed = (name) => {
  let body = [];
  walk(beeAst.program, (node) => {
    if (
      node.type === 'VariableDeclarator' &&
      node.id?.name === name &&
      (node.init?.type === 'ArrowFunctionExpression' || node.init?.type === 'FunctionExpression')
    ) {
      body = bodyStatements(node.init);
    }
  });
  return body;
};

const useEffectBodies = () => {
  const bodies = [];
  walk(beeAst.program, (node) => {
    if (node.type === 'CallExpression' && node.callee?.name === 'useEffect') {
      bodies.push(bodyStatements(node.arguments[0]));
    }
  });
  return bodies;
};

const directExpressionCall = (statement, name) => (
  statement?.type === 'ExpressionStatement' &&
  statement.expression?.type === 'CallExpression' &&
  calleeName(statement.expression.callee) === name
);

{
  const banned = [
    ['COOLDOWN_MS', /\bCOOLDOWN_MS\b/],
    ['Animated.spring traversal', /Animated\.spring\s*\(/],
    ['DEFAULT_PATH', /\bDEFAULT_PATH\b/],
  ].filter(([, re]) => re.test(beeSource));
  if (banned.length === 0) ok('M7 banned engine — no default path, cooldown, or traversal spring remains');
  else bad('M7 banned engine', banned.map(([name]) => name).join(', '));

  if (
    /Animated\.timing\s*\(\s*progress/.test(beeSource) &&
    /duration:\s*mode\s*===\s*'substitute'\s*\?\s*DURATIONS\.reducedMotionFade\s*:\s*track\.durationMs/.test(beeSource) &&
    /easing:\s*mode\s*===\s*'substitute'\s*\?\s*Easing\.linear\s*:\s*beeTransitionEasing\s*\(\s*track\.easing,\s*Easing\s*\)/.test(beeSource)
  ) {
    ok('M8 driver — one master timing uses role duration, role easing, and RM fade');
  } else {
    bad('M8 driver', 'did not find timing(progress) with reduced fade / role duration / role easing');
  }

  const reducedBranch = /if\s*\(\s*renderMode\s*===\s*'substitute'\s*\)\s*\{([\s\S]*?)\n\s*\}\n\n\s*const translateX/.exec(beeSource)?.[1] ?? '';
  if (!/transform|translateX|translateY|rotate|scaleX|scaleY|scale/.test(reducedBranch)) {
    ok('M9 Reduced Motion — RM branch has opacity only and transform identity');
  } else {
    bad('M9 Reduced Motion', 'RM branch contains prohibited transform, travel, or scale');
  }

  const rolesSource = await readFile(rel('src/components/beeTransitionRoles.js'), 'utf8');
  if (rolesSource.includes("import { bankFor, pitchFor } from './beeAttitude';") && rolesSource.includes('const bank = bankFor(pitchFor(tangent.x, tangent.y));')) {
    ok('M6b shared attitude — role tracks execute pitchFor and bankFor from beeAttitude');
  } else {
    bad('M6b shared attitude', 'role sampler does not import and execute shared pitchFor/bankFor');
  }
}

{
  const safeHook = /useReducedMotionState/.test(beeSource) && !/\buseReducedMotion\b/.test(beeSource);
  const replacementCallsProduct = /replaceActiveBeeTransitionTravel\s*\(\s*\{[\s\S]*?animation:\s*animationRef\.current,[\s\S]*?setRenderMode,[\s\S]*?startSubstitute:\s*\(\)\s*=>\s*startFlight\('substitute'\)/.test(beeSource);
  const renderModeState = /const\s*\[\s*renderMode,\s*setRenderMode\s*\]\s*=\s*useState\('idle'\)/.test(beeSource) && /if\s*\(\s*renderMode\s*===\s*'substitute'\s*\)/.test(beeSource);
  const guardedCompletion = /animation\.start\(\(\{\s*finished\s*\}\)\s*=>\s*\{[\s\S]*?finished\s*&&\s*animationRef\.current\s*===\s*animation[\s\S]*?finishFlight\(\)/.test(beeSource);
  const unmountStops = /useEffect\(\(\)\s*=>\s*\(\)\s*=>\s*\{[\s\S]*?animationRef\.current\?\.stop\?\.\(\)/.test(beeSource);
  const replacementEffectExecutes = useEffectBodies().some((body) => {
    const guardIndex = body.findIndex((statement) => statement.type === 'IfStatement' && statement.consequent?.type === 'ReturnStatement');
    const callIndex = body.findIndex((statement) => directExpressionCall(statement, 'replaceActiveBeeTransitionTravel'));
    return guardIndex >= 0 && callIndex === guardIndex + 1;
  });
  const events = [];
  const animation = { stop: () => events.push('stop') };
  replaceActiveBeeTransitionTravel({
    animation,
    setRenderMode: (mode) => events.push(`render:${mode}`),
    startSubstitute: () => events.push('start:substitute'),
  });
  const executedOrder = events.join('>') === 'stop>render:substitute>start:substitute';
  if (safeHook && replacementCallsProduct && renderModeState && guardedCompletion && unmountStops && replacementEffectExecutes && executedOrder) {
    ok('M18 RM replacement — product executor stops, renders substitute, restarts substitute, and unmount stops active animation');
  } else {
    bad('M18 RM replacement', JSON.stringify({ safeHook, replacementCallsProduct, renderModeState, guardedCompletion, unmountStops, replacementEffectExecutes, events }));
  }
}

{
  const startFlightBody = functionBodyNamed('startFlight');
  const timingIndex = startFlightBody.findIndex((statement) => (
    statement.type === 'VariableDeclaration' &&
    statement.declarations.some((decl) => decl.id?.name === 'animation')
  ));
  const startIndex = startFlightBody.findIndex((statement) => directExpressionCall(statement, 'start'));
  const triggerEffectLaunches = useEffectBodies().some((body) => {
    const guardIndex = body.findIndex((statement) => statement.type === 'IfStatement' && statement.consequent?.type === 'ReturnStatement');
    const callIndex = body.findIndex((statement) => directExpressionCall(statement, 'startFlight'));
    return guardIndex >= 0 && callIndex === guardIndex + 1;
  });
  if (timingIndex >= 0 && startIndex === timingIndex + 2 && triggerEffectLaunches) {
    ok('M19 execution — startFlight executes animation.start and trigger effect executes startFlight after its guard');
  } else {
    bad('M19 execution', JSON.stringify({ timingIndex, startIndex, triggerEffectLaunches }));
  }
}

{
  const sites = [];
  for (const file of [rel('App.js'), rel('src/components/FeedCard.js'), rel('src/screens/HoneycombTab.js'), rel('src/components/SealCrack.js')]) {
    const src = await readFile(file, 'utf8').catch(() => '');
    if (!src.includes('<BeeTransition')) continue;
    const ast = parseJs(src);
    walk(ast.program, (n) => {
      if (n.type !== 'JSXOpeningElement' || n.name.name !== 'BeeTransition') return;
      const attrs = new Map(n.attributes.filter((a) => a.type === 'JSXAttribute').map((a) => [a.name.name, a]));
      const roleAttr = attrs.get('role');
      const role = roleAttr?.value?.value;
      sites.push({ file: posix(file), line: n.loc.start.line, role, hasPath: attrs.has('path'), hasOnSettle: attrs.has('onSettle') });
    });
  }
  const roles = sites.map((s) => s.role).sort();
  const wanted = Object.keys(expected).sort();
  const badSites = sites.filter((s) => !expected[s.role] || s.hasPath);
  if (JSON.stringify(roles) === JSON.stringify(wanted) && badSites.length === 0) {
    ok('M10 call sites — all four callers declare one explicit role and no path prop');
  } else {
    bad('M10 call sites', JSON.stringify(sites));
  }
  if (
    /if\s*\(\s*track\.end\s*===\s*'present'\s*\)\s*setSettledPresent\s*\(\s*true\s*\)/.test(beeSource) &&
    /if\s*\(!flying\s*&&\s*!\s*settledPresent\s*\)\s*return null/.test(beeSource) &&
    /flutter=\{!settledPresent\}/.test(beeSource) &&
    !/\bonSettle\b/.test(beeSource)
  ) ok('M11 present completion — present-role completion mounts the final painter and disables flutter');
  else bad('M11 present completion', 'present-role completion state, mounted final painter, flutter disable, or no-onSettle contract missing');
}

{
  const honeySource = await readFile(rel('src/screens/HoneycombTab.js'), 'utf8');
  const shareAnchor = /<View style=\{styles\.shareButtonAnchor\}>([\s\S]*?)<\/View>\n\s*\)\}/.exec(honeySource)?.[1] ?? '';
  const stableOrder =
    /!\s*alreadySharedToday/.test(shareAnchor) &&
    /<View style=\{styles\.shareActionStage\}>[\s\S]*?<PrimaryButton[\s\S]*?<Text style=\{styles\.sharedConfirmation\}>Shared to your hive\.<\/Text>[\s\S]*?<\/View>[\s\S]*?<BeeTransition[^>]*role="share-carry"/.test(shareAnchor);
  const oldNesting = /todayEntry\s*&&\s*!\s*alreadySharedToday\s*&&\s*\([\s\S]*?<BeeTransition[^>]*role="share-carry"/.test(honeySource);
  const relativeAnchor = /shareButtonAnchor:\s*\{[\s\S]*?position:\s*'relative'/.test(honeySource);
  const invariantStage = /shareActionStage:\s*\{[\s\S]*?height:\s*56,[\s\S]*?justifyContent:\s*'center'/.test(honeySource);
  const sameBottomAnchor = /shareCarryBeeAnchor:\s*\{[\s\S]*?bottom:\s*12/.test(honeySource);
  if (stableOrder && !oldNesting && relativeAnchor && invariantStage && sameBottomAnchor) {
    ok('M15 share carry anchor — flight remains under one invariant-height stage across the shared-state flip');
  } else {
    bad('M15 share carry anchor', JSON.stringify({ stableOrder, oldNesting, relativeAnchor, invariantStage, sameBottomAnchor }));
  }
}

{
  const sealSource = await readFile(rel('src/components/SealCrack.js'), 'utf8');
  if (!/settleShadow|SPRINGS\.glide|staticBeeOpacity/.test(sealSource)) ok('M12 SealCrack — shadow spring and duplicate static crossfade are gone');
  else bad('M12 SealCrack', 'settleShadow, SPRINGS.glide, or staticBeeOpacity remains');
}

export const MUTATIONS = [
  {
    row: 'M1',
    why: 'a fifth role is a new personality, not the four-role score',
    file: 'src/components/beeTransitionRoles.js',
    from: "  'seal-arrival': {",
    to: "  'hover-extra': { durationMs: 111, points: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }], end: 'absent', retrigger: 'batch' },\n  'seal-arrival': {",
  },
  {
    row: 'M2likelift',
    why: 'the governing value must be protected exactly',
    file: 'src/components/beeTransitionRoles.js',
    from: "    durationMs: 360,\n    points: [\n      { x: -4, y: 4 },",
    to: "    durationMs: 361,\n    points: [\n      { x: -4, y: 4 },",
  },
  {
    row: 'M4likelift',
    why: 'collapsing like-lift onto the endpoint chord loses the authored curve',
    file: 'src/components/beeTransitionRoles.js',
    from: "      { x: 15, y: -27 },",
    to: "      { x: 21, y: -17 },",
  },
  {
    row: 'M4sharecarry',
    why: 'collapsing share-carry onto the endpoint chord loses the authored curve',
    file: 'src/components/beeTransitionRoles.js',
    from: "      { x: 8, y: -74 },",
    to: "      { x: -10, y: -60 },",
  },
  {
    row: 'M4feedarrival',
    why: 'collapsing feed-arrival onto the endpoint chord loses the authored curve',
    file: 'src/components/beeTransitionRoles.js',
    from: "      { x: -18, y: 2 },",
    to: "      { x: -10, y: -9 },",
  },
  {
    row: 'M4sealarrival',
    why: 'collapsing seal-arrival onto the endpoint chord loses the authored curve',
    file: 'src/components/beeTransitionRoles.js',
    from: "      { x: -65, y: -90 },",
    to: "      { x: -65, y: -30 },",
  },
  {
    row: 'M7',
    why: 'a traversal spring reintroduces elastic time',
    file: 'src/components/BeeTransition.js',
    from: 'Animated.timing(progress, {',
    to: 'Animated.spring(progress, {',
  },
  {
    row: 'M6b',
    why: 'BeeTransition roles must use shared attitude law; raw heading clips leftward travel',
    file: 'src/components/beeTransitionRoles.js',
    from: 'const bank = bankFor(pitchFor(tangent.x, tangent.y));',
    to: 'const bank = Math.max(-22, Math.min(22, Math.atan2(tangent.y, tangent.x) * (180 / Math.PI) * 0.32));',
  },
  {
    row: 'M8',
    why: 'role duration must drive normal traversal',
    file: 'src/components/BeeTransition.js',
    from: "duration: mode === 'substitute' ? DURATIONS.reducedMotionFade : track.durationMs,",
    to: "duration: mode === 'substitute' ? DURATIONS.reducedMotionFade : 400,",
  },
  {
    row: 'M9',
    why: 'RM must be transform identity, including for left-facing share-carry',
    file: 'src/components/BeeTransition.js',
    from: 'style={[styles.wrap, anchorStyle, { opacity }]}',
    to: 'style={[styles.wrap, anchorStyle, { opacity, transform: [{ scaleX: facing }] }]}',
  },
  {
    row: 'M10',
    why: 'callers may not fall back to a default role',
    file: 'src/components/FeedCard.js',
    from: 'role="like-lift"',
    to: '',
  },
  {
    row: 'M11',
    why: 'present-role completion must mount the internal final painter',
    file: 'src/components/BeeTransition.js',
    from: "if (track.end === 'present') setSettledPresent(true);",
    to: "if (track.end === 'present') { if (false) setSettledPresent(true); }",
  },
  {
    row: 'M12',
    why: 'settleShadow is the retired parallel completion clock',
    file: 'src/components/SealCrack.js',
    from: 'const mountedRef = useRef(true);',
    to: 'const settleShadow = useRef(new Animated.Value(0)).current;\n  const mountedRef = useRef(true);',
  },
  {
    row: 'M13',
    why: 'active retriggers must coalesce without starting a delayed replay',
    file: 'src/components/beeTransitionRoles.js',
    from: "  if (active) return { shouldStart: false, shouldRecordTrigger: true };",
    to: "  if (active) return { shouldStart: true, shouldRecordTrigger: true };",
  },
  {
    row: 'M13',
    why: 'share-carry is one shot per successful share, not one shot per mounted tab',
    file: 'src/components/beeTransitionRoles.js',
    from: "  if (settled && def.end === 'present' && def.retrigger === 'one-shot') return { shouldStart: false, shouldRecordTrigger: true };",
    to: "  if (settled && def.retrigger === 'one-shot') return { shouldStart: false, shouldRecordTrigger: true };",
  },
  {
    row: 'M14',
    why: 'constant-speed linear motion makes every BeeTransition role share one robotic velocity',
    file: 'src/components/beeTransitionRoles.js',
    from: "    retrigger: 'one-shot',\n    easing: 'in-out-quad',\n  },\n  'feed-arrival': {",
    to: "    retrigger: 'one-shot',\n    easing: 'out-cubic',\n  },\n  'feed-arrival': {",
  },
  {
    row: 'M15',
    why: 'share-carry must survive zero-latency reload flipping alreadySharedToday',
    file: 'src/screens/HoneycombTab.js',
    from: '{todayEntry && (',
    to: '{todayEntry && !alreadySharedToday && (',
  },
  {
    row: 'M15',
    why: 'share-carry needs invariant stage height, not only a persistent parent',
    file: 'src/screens/HoneycombTab.js',
    from: "  shareActionStage: {\n    height: 56,\n    justifyContent: 'center',\n  },",
    to: "  shareActionStage: {\n    justifyContent: 'center',\n  },",
  },
  {
    row: 'M16',
    why: 'unresolved Reduce Motion must fail closed instead of false-seeding full travel',
    file: 'src/components/beeTransitionRoles.js',
    from: '  const substitute = !resolved || reduced;',
    to: '  const substitute = reduced;',
  },
  {
    row: 'M17',
    why: 'seal-arrival must unwind to a level landed pose',
    file: 'src/components/beeTransitionRoles.js',
    from: "  if (role !== 'seal-arrival' || progress < 0.75) return bankDeg;",
    to: "  if (role !== 'seal-arrival' || progress < 1) return bankDeg;",
  },
  {
    row: 'M17',
    why: 'seal-arrival bank correction must begin after the governed final-quarter boundary',
    file: 'src/components/beeTransitionRoles.js',
    from: "  if (role !== 'seal-arrival' || progress < 0.75) return bankDeg;",
    to: "  if (role !== 'seal-arrival' || progress < 0.5) return bankDeg;",
  },
  {
    row: 'M18',
    why: 'normal to RM must stop active travel and replace it with the substitute immediately',
    file: 'src/components/beeTransitionRoles.js',
    from: "  setRenderMode('substitute');\n  startSubstitute();",
    to: "  setRenderMode('substitute');\n  if (false) startSubstitute();",
  },
  {
    row: 'M18',
    why: 'the host RM effect must execute the replacement controller, not only import it',
    file: 'src/components/BeeTransition.js',
    from: "    replaceActiveBeeTransitionTravel({\n      animation: animationRef.current,",
    to: "    if (false) replaceActiveBeeTransitionTravel({\n      animation: animationRef.current,",
  },
  {
    row: 'M19',
    why: 'startFlight must execute the native animation, not only construct it',
    file: 'src/components/BeeTransition.js',
    from: '    animation.start(({ finished }) => {',
    to: '    if (false) animation.start(({ finished }) => {',
  },
  {
    row: 'M19',
    why: 'the trigger effect must execute startFlight after the planner guard',
    file: 'src/components/BeeTransition.js',
    from: '    startFlight(beeTransitionMotionPlan({ resolved, reduced, active: false, mode: modeRef.current }).mode);',
    to: '    if (false) startFlight(beeTransitionMotionPlan({ resolved, reduced, active: false, mode: modeRef.current }).mode);',
  },
  {
    row: null,
    why: 'changing a non-motion comment must not make the gate noisy',
    file: 'src/components/BeeTransition.js',
    from: 'call sites no longer',
    to: 'call sites no longer ever',
  },
];

if (failures.length) {
  console.log(`\ncheck-bee-transition: ${pass} passed, ${failures.length} failed`);
  for (const f of failures) console.log(`FAIL ${f.label}: ${f.detail}`);
  process.exit(1);
}

console.log(`\ncheck-bee-transition: ${pass} passed, 0 failed`);
