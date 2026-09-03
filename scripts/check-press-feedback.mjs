// MP-5 — Press feedback and Reduce Motion.
//
//   npm run check:press-feedback
//
// This gate is intentionally scoped to PressableScale and the shared motion
// tokens it consumes. It does not claim any call-site capture has passed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRESSABLE = 'src/components/PressableScale.js';
const MOTION = 'src/constants/motion.js';
const PLANNER = 'src/components/pressFeedbackPlanner.js';
const PACKAGE = 'package.json';
const pressablePath = path.join(ROOT, PRESSABLE);
const motionPath = path.join(ROOT, MOTION);
const plannerPath = path.join(ROOT, PLANNER);
const packagePath = path.join(ROOT, PACKAGE);

const pressableSrc = fs.readFileSync(pressablePath, 'utf8');
const motionSrc = fs.readFileSync(motionPath, 'utf8');
const plannerSrc = fs.readFileSync(plannerPath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const plannerModule = await import(pathToFileURL(plannerPath).href + `?check=${process.pid}`);

let pass = 0;
const failures = [];
const ok = (label) => {
  pass += 1;
  console.log(`  ok   ${label}`);
};
const bad = (label, detail) => {
  failures.push(`${label} — ${detail}`);
  console.log(`  FAIL ${label} — ${detail}`);
};

const parseJs = (src) => parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
const ast = parseJs(pressableSrc);
const text = (node) => pressableSrc.slice(node.start, node.end).replace(/\s+/g, ' ');
const walk = (node, visit) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((item) => walk(item, visit));
    return;
  }
  if (typeof node.type === 'string') visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key.endsWith('Comments')) continue;
    walk(node[key], visit);
  }
};

const importsFromMotion = ast.program.body
  .filter((node) => node.type === 'ImportDeclaration' && node.source.value === '../constants/motion')
  .flatMap((node) => node.specifiers.map((specifier) => specifier.imported?.name).filter(Boolean));

console.log('\nMP-5. PressableScale');

{
  const required = ['DURATIONS', 'PRESS', 'PRESS_EASING', 'PRESS_TIMING', 'SPRINGS', 'useReducedMotionState'];
  const missing = required.filter((name) => !importsFromMotion.includes(name));
  const consumesPlanner = /import\s+{\s*pressFeedbackScalePlan\s*}\s+from\s+'\.\/pressFeedbackPlanner'/.test(pressableSrc) &&
    /const\s+scalePlan\s*=\s*pressFeedbackScalePlan\({\s*resolved,\s*reduced\s*}\)/.test(pressableSrc);
  if (missing.length === 0 && consumesPlanner) {
    ok('M5.1 consumes shared motion constants, resolved Reduce Motion state, and the press planner');
  } else {
    bad('M5.1 consumes shared motion constants, resolved Reduce Motion state, and the press planner',
      `missing: ${missing.join(', ') || 'none'}, consumesPlanner=${consumesPlanner}`);
  }
}

{
  const hasHook = /const\s+{\s*reduced,\s*resolved\s*}\s*=\s*useReducedMotionState\(\)/.test(pressableSrc);
  const rmSetToOneCount = (pressableSrc.match(/scale\.setValue\(1\)/g) || []).length;
  const rmBranches = /if\s*\(\s*scaleLocked\s*\)\s*{/.test(pressableSrc);
  if (hasHook && rmBranches && rmSetToOneCount >= 3) {
    ok('M5.2 unresolved and reduced motion force scale to exactly 1 on preference change, press-in, and release');
  } else {
    bad('M5.2 unresolved and reduced motion force scale to exactly 1 on preference change, press-in, and release',
      `hook=${hasHook}, rmBranches=${rmBranches}, scale.setValue(1) count=${rmSetToOneCount}`);
  }
}

{
  let compressHasSpring = false;
  let compressHasTiming = false;
  let releaseHasSpring = false;
  walk(ast, (node) => {
    if (node.type !== 'VariableDeclarator' || node.id?.type !== 'Identifier') return;
    const body = text(node.init || {});
    if (node.id.name === 'compressTo') {
      compressHasSpring = /Animated\.spring/.test(body);
      compressHasTiming = /Animated\.timing\(scale/.test(body) &&
        /duration:\s*PRESS_TIMING\.compress/.test(body) &&
        /easing:\s*PRESS_EASING\.compress/.test(body);
    }
    if (node.id.name === 'releaseToRest') {
      releaseHasSpring = /Animated\.spring\(scale/.test(body) &&
        /toValue:\s*1/.test(body) &&
        /\.\.\.SPRINGS\.press/.test(body);
    }
  });
  if (!compressHasSpring && compressHasTiming && releaseHasSpring) {
    ok('M5.3 press-in is timed compression; release alone uses SPRINGS.press to return to 1');
  } else {
    bad('M5.3 press-in is timed compression; release alone uses SPRINGS.press to return to 1',
      `compressHasSpring=${compressHasSpring}, compressHasTiming=${compressHasTiming}, releaseHasSpring=${releaseHasSpring}`);
  }
}

{
  const noResetInHandlers = !/handlePress(?:In|Out)[\s\S]*?scale\.setValue/.test(pressableSrc);
  const compressStartsFromLiveDriver = /const\s+compressTo[\s\S]*Animated\.timing\(scale/.test(pressableSrc) &&
    !/scale\.setValue\(\s*(?:1|value|scaleTo)\s*\);\n\s*Animated\.timing\(scale/.test(pressableSrc);
  if (noResetInHandlers && compressStartsFromLiveDriver) {
    ok('M5.4 rapid press retargets the live driver without resetting before the next animation');
  } else {
    bad('M5.4 rapid press retargets the live driver without resetting before the next animation',
      `noResetInHandlers=${noResetInHandlers}, compressStartsFromLiveDriver=${compressStartsFromLiveDriver}`);
  }
}

{
  const hasDepthProp = /scaleTo\s*=\s*PRESS\.standard/.test(pressableSrc);
  const noLocalDurations = !/duration:\s*(?:90|120)\b/.test(pressableSrc);
  const noLocalPressDepth = !/scaleTo\s*=\s*(?:0\.\d+|1\.\d+)/.test(pressableSrc);
  const colorUsesInstant = /duration:\s*DURATIONS\.instant/.test(pressableSrc);
  if (hasDepthProp && noLocalDurations && noLocalPressDepth && colorUsesInstant) {
    ok('M5.5 PressableScale has no inline press durations or depths; colour uses DURATIONS.instant');
  } else {
    bad('M5.5 PressableScale has no inline press durations or depths; colour uses DURATIONS.instant',
      `hasDepthProp=${hasDepthProp}, noLocalDurations=${noLocalDurations}, noLocalPressDepth=${noLocalPressDepth}, colorUsesInstant=${colorUsesInstant}`);
  }
}

{
  const hasTokens = /export const PRESS_TIMING = {[\s\S]*compress:\s*90/.test(motionSrc) &&
    /export const PRESS_EASING = {[\s\S]*compress:\s*Easing\.out\(Easing\.cubic\)/.test(motionSrc);
  const onlyTwoDepths = /export const PRESS = {[\s\S]*standard:\s*0\.96,[\s\S]*slab:\s*0\.98,[\s\S]*};/.test(motionSrc) &&
    !/export const PRESS = {[\s\S]*(?:mini|large|deep|icon|row|cta):/.test(motionSrc);
  if (hasTokens && onlyTwoDepths) {
    ok('M5.6 shared motion owns the 90ms compression token/easing and keeps the two-depth law');
  } else {
    bad('M5.6 shared motion owns the 90ms compression token/easing and keeps the two-depth law',
      `hasTokens=${hasTokens}, onlyTwoDepths=${onlyTwoDepths}`);
  }
}

{
  const plannerExports = /export const pressFeedbackScalePlan/.test(plannerSrc);
  const plannerLocksUnresolved = /const\s+scaleLocked\s*=\s*!resolved\s*\|\|\s*!!reduced/.test(plannerSrc);
  const plannerCases = [
    [{ resolved: false, reduced: false }, true],
    [{ resolved: false, reduced: true }, true],
    [{ resolved: true, reduced: true }, true],
    [{ resolved: true, reduced: false }, false],
  ];
  const plan = plannerModule.pressFeedbackScalePlan;
  const wrong = plannerCases
    .filter(([input, locked]) => plan(input).scaleLocked !== locked)
    .map(([input, locked]) => `${JSON.stringify(input)} expected ${locked}`);
  if (plannerExports && plannerLocksUnresolved && wrong.length === 0) {
    ok('M5.7 press planner fails closed while unresolved and arms normal motion only after resolution');
  } else {
    bad('M5.7 press planner fails closed while unresolved and arms normal motion only after resolution',
      `plannerExports=${plannerExports}, plannerLocksUnresolved=${plannerLocksUnresolved}, wrong=${wrong.join('; ') || 'none'}`);
  }
}

{
  const effect = /useEffect\(\(\)\s*=>\s*{\s*if\s*\(!scaleLocked\)\s*return;\s*scale\.stopAnimation\(\);\s*scale\.setValue\(1\);\s*},\s*\[scaleLocked,\s*scale\]\);/m.test(pressableSrc);
  if (effect) {
    ok('M5.8 live RM/unresolved transition stops and commands scale 1 in the same effect turn');
  } else {
    bad('M5.8 live RM/unresolved transition stops and commands scale 1 in the same effect turn',
      'expected scale.stopAnimation(); scale.setValue(1); directly in the scaleLocked effect');
  }
}

{
  if (packageJson.scripts?.['check:press-feedback'] === 'node scripts/check-press-feedback.mjs') {
    ok('M5.9 package.json exposes check:press-feedback so the full gate runner can see it');
  } else {
    bad('M5.9 package.json exposes check:press-feedback so the full gate runner can see it',
      `found ${packageJson.scripts?.['check:press-feedback'] || 'missing'}`);
  }
}

console.log(`\ncheck-press-feedback: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((failure) => console.log(`  - ${failure}`));
  process.exit(1);
}

export const MUTATIONS = [
  {
    row: 'M5.1',
    why: 'PressableScale must subscribe to resolved Reduce Motion state rather than assume full motion before the async read returns.',
    file: PRESSABLE,
    from: ', useReducedMotionState } from \'../constants/motion\';',
    to: ' } from \'../constants/motion\';',
  },
  {
    row: 'M5.2',
    why: 'Under RM or unresolved preference state, press-in must keep scale exactly 1.',
    file: PRESSABLE,
    from: 'if (scaleLocked) {\n      scale.stopAnimation();\n      scale.setValue(1);\n      return;\n    }\n    Animated.timing(scale, {',
    to: 'if (scaleLocked) {\n      scale.stopAnimation();\n      scale.setValue(scaleTo);\n      return;\n    }\n    Animated.timing(scale, {',
  },
  {
    row: 'M5.3',
    why: 'Press-in cannot use a spring.',
    file: PRESSABLE,
    from: 'Animated.timing(scale, {\n      toValue: value,\n      duration: PRESS_TIMING.compress,\n      easing: PRESS_EASING.compress,',
    to: 'Animated.spring(scale, {\n      toValue: value,\n      duration: PRESS_TIMING.compress,\n      easing: PRESS_EASING.compress,',
  },
  {
    row: 'M5.4',
    why: 'A rapid second press must not reset to rest before retargeting.',
    file: PRESSABLE,
    from: 'Animated.timing(scale, {\n      toValue: value,',
    to: 'scale.setValue(1);\n    Animated.timing(scale, {\n      toValue: value,',
  },
  {
    row: 'M5.5',
    why: 'Press colour duration must consume the shared instant token.',
    file: PRESSABLE,
    from: 'duration: DURATIONS.instant,',
    to: 'duration: 120,',
  },
  {
    row: 'M5.6',
    why: 'Compression duration belongs in shared motion and must stay at MP-5’s ruled 90ms.',
    file: MOTION,
    from: 'compress: 90,',
    to: 'compress: 120,',
  },
  {
    row: 'M5.7',
    why: 'Initial unresolved preference state must fail closed instead of allowing compression before the OS read resolves.',
    file: PLANNER,
    from: 'const scaleLocked = !resolved || !!reduced;',
    to: 'const scaleLocked = !!reduced;',
  },
  {
    row: 'M5.8',
    why: 'The preference-effect scale command must execute; token-counting handler fallbacks are insufficient.',
    file: PRESSABLE,
    from: 'scale.stopAnimation();\n    scale.setValue(1);\n  }, [scaleLocked, scale]);',
    to: 'scale.stopAnimation();\n    if (false) scale.setValue(1);\n  }, [scaleLocked, scale]);',
  },
  {
    row: null,
    why: 'Changing non-motion prose in the MP-5 comment must not red the gate.',
    file: PRESSABLE,
    from: 'MP-5 keeps that sequence in one',
    to: 'MP-5 keeps the sequence in one',
  },
];
