// Gate for how the mascot is held while it flies (Sunbeam §17.3 / §19.5).
//
//   npm run check:bee-attitude
//
// WHY THIS EXISTS
//
// `FlyingBee` used to rotate the bee to its heading with nothing bounding
// the result. Two of the cruise loop's four segments have headings past
// vertical, and the timing easing is symmetric about its midpoint, so the
// bee flew belly-up for exactly half of every loop — live on the Hive, for
// months. Nobody saw it because the bee had no face on it: upside-down
// reads as a loop-the-loop when there is nothing to be upside-down. Colin's
// "our mascot flying through the app, motions pristine" is what makes it a
// defect, and the mascot has a face.
//
// So the invariant this file holds is: **no render path may fly the mascot
// at an attitude you cannot read it at.**
//
// WHAT IT ASSERTS, AND WHY IN THIS ORDER
//
// The rows come in two groups, and the split is the whole design.
//
//   A. THE FUNCTION. `bankFor` is sampled across its entire domain — every
//      half-degree of pitch from -90 to +90 — not at the four pitches the
//      cruise loop happens to fly. This is the correction Sage and I
//      arrived at the hard way, twice in one evening:
//
//        "a clamp exists"            — tautological, a clamp cannot fail
//        "rotateOutput within ±22"   — PASSES a saturated clamp perfectly.
//                                      Every live cruise pitch exceeds 22,
//                                      so clamp(±22) emits two latching
//                                      values and the row stays green.
//        "±22 holds by construction" — unfalsifiable a third time, because
//                                      the new formula makes it true of
//                                      any input at all.
//
//      Each replacement was a gate that could not fail on the configuration
//      it was written to police. The escape is to stop asking the *tracks*
//      about the *formula*: four sampled points cannot pin a function, and
//      the function is importable, so sample the function. A clamp
//      reintroduced anywhere in the domain shows up as a flat step; a
//      constant, a latch and a sign inversion all die on the same rows.
//
//   B. THE TRACKS. Everything that depends on a real path in a real box:
//      the rendered bank at every interpolation node, the facing rule, the
//      turn's wall-clock length, the loop seam.
//
//      Every row here names the container it was measured in, because that
//      is the error that produced this file. A fractional coordinate is not
//      a position until you name the box, and *the call site names the box*
//      — `loginArc` is flown inside a 220x100 wordmark anchor, not the
//      screen, and both reviewers resolved it against 393x852 and got a
//      figure that was wrong by 2x. Screen-mounted sites are therefore
//      evaluated on four device boxes, not one, so no row can pass by
//      being measured on a convenient phone.
//
//   C. COMPLETENESS. An unlisted `<FlyingBee>` call site is a FAILURE, not
//      a skip. The call sites are enumerated from disk; the containers are
//      declared here with a reason, because "what box is this mounted in"
//      is a question a human has to answer — but a declared box that can be
//      read back from a stylesheet IS read back and compared. That row is
//      the one that would have caught tonight.
//
// WHAT THIS GATE CANNOT DO. It models the easings by name: it recognises
// the two expressions `FlyingBee.js` actually uses and reimplements them.
// A third easing is a FAILURE here, not a silent pass — a gate that cannot
// tell must not look like a gate that has no objection.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { parse } from '@babel/parser';
import { deriveClearanceBins } from './lib/mascot-clearance.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODULE_PATH = path.join(ROOT, 'src/components/beeAttitude.js');
const FLYING_BEE = path.join(ROOT, 'src/components/FlyingBee.js');

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

const parseJs = (src) => parse(src, { sourceType: 'module', plugins: ['jsx'] });
const walk = (node, visit) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, visit));
    return;
  }
  if (typeof node.type === 'string') visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key.endsWith('Comments')) continue;
    walk(node[key], visit);
  }
};

// --- the easings this gate can model -------------------------------------
// Keyed by the source expression in FlyingBee.js, so a change there lands
// here as a named failure rather than as silence.
const bezier = (x1, y1, x2, y2) => {
  const bx = (s) => 3 * (1 - s) ** 2 * s * x1 + 3 * (1 - s) * s * s * x2 + s ** 3;
  const by = (s) => 3 * (1 - s) ** 2 * s * y1 + 3 * (1 - s) * s * s * y2 + s ** 3;
  return (x) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 60; i += 1) {
      const mid = (lo + hi) / 2;
      if (bx(mid) < x) lo = mid;
      else hi = mid;
    }
    return by((lo + hi) / 2);
  };
};
const EASINGS = {
  'Easing.inOut(Easing.ease)': (() => {
    const e = bezier(0.42, 0, 1, 1);
    return (t) => (t < 0.5 ? e(t * 2) / 2 : 1 - e((1 - t) * 2) / 2);
  })(),
  'Easing.out(Easing.cubic)': (t) => 1 - (1 - t) ** 3,
  // R-LF-2 (Living Flight) — the approach's launch easing, replacing
  // `inOut(ease)` (which arrived at zero velocity, the dead stop the
  // ruling removes).
  'Easing.out(Easing.quad)': (t) => 1 - (1 - t) ** 2,
};

// --- the containers, declared with a reason ------------------------------
const DEVICES = [
  { label: '320x568 (SE 1st gen)', width: 320, height: 568 },
  { label: '375x667 (SE 2nd/3rd)', width: 375, height: 667 },
  { label: '393x852 (15/16/17)', width: 393, height: 852 },
  { label: '430x932 (Pro Max)', width: 430, height: 932 },
];

const CALL_SITES = [
  {
    file: 'src/screens/TodayTab.js',
    preset: null,
    reason:
      'mounted directly in a flex:1 tab scene; TabDock is an absoluteFill overlay that takes no layout space, so the measured box is the device',
    containers: DEVICES,
  },
  {
    file: 'src/screens/HoneycombTab.js',
    preset: null,
    reason: 'same flex:1 tab scene as TodayTab',
    containers: DEVICES,
  },
  {
    file: 'src/screens/Onboarding.js',
    preset: 'loginArc',
    reason:
      'mounted inside styles.wordmarkArcAnchor, a fixed 220x100 box sized to the wordmark — NOT the screen. The bee is absolutely positioned, so it fills that anchor and the path resolves against it.',
    anchorStyle: 'wordmarkArcAnchor',
    containers: [{ label: 'wordmarkArcAnchor 220x100', width: 220, height: 100 }],
  },
];

// =========================================================================
// A. THE FUNCTION
// =========================================================================
console.log('\nA. the attitude function, sampled across its whole domain');

const moduleSource = await readFile(MODULE_PATH, 'utf8');
const moduleAst = parseJs(moduleSource);
const moduleImports = moduleAst.program.body.filter((n) => n.type === 'ImportDeclaration');
if (moduleImports.length === 0) {
  ok('beeAttitude.js declares no imports, so this gate can load it as a module');
} else {
  bad(
    'beeAttitude.js declares no imports, so this gate can load it as a module',
    `found ${moduleImports.length}: ${moduleImports.map((n) => n.source.value).join(', ')}. ` +
      'This gate imports the module directly rather than pattern-matching its source; a dependency ' +
      'breaks that and the rows below would have to become string-matching, which is how the defect got here.',
  );
}

const attitude = await import(
  `data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`
);
const { buildAttitude, bankFor, pitchFor, facingFor, MAX_BANK_DEG, TURN_MS } = attitude;

{
  const samples = [];
  for (let p = -90; p <= 90; p += 0.5) samples.push({ p, b: bankFor(p) });

  const flats = samples.filter((s, i) => i > 0 && Math.abs(s.b - samples[i - 1].b) < 1e-12);
  if (flats.length === 0) {
    ok(`bankFor is strictly monotonic over pitch -90..90 (${samples.length} samples)`);
  } else {
    bad(
      `bankFor is strictly monotonic over pitch -90..90 (${samples.length} samples)`,
      `${flats.length} flat steps, first at pitch ${flats[0].p}. A flat region means the attitude has ` +
        'stopped tracking the path — a clamp, a latch or a constant. This is the row a saturated ' +
        'clamp(±22) fails and every "within the bound" row passes.',
    );
  }

  const worst = samples.reduce((a, s) => (Math.abs(s.b) > Math.abs(a.b) ? s : a));
  if (Math.abs(worst.b) <= MAX_BANK_DEG + 1e-9) {
    ok(`bankFor stays within ±${MAX_BANK_DEG}° over the whole domain (max ${worst.b.toFixed(2)}° at pitch ${worst.p})`);
  } else {
    bad(
      `bankFor stays within ±${MAX_BANK_DEG}° over the whole domain`,
      `${worst.b.toFixed(2)}° at pitch ${worst.p}`,
    );
  }

  const signOk = samples.every((s) => Math.sign(s.b) === Math.sign(s.p));
  if (signOk && bankFor(0) === 0) {
    ok('bankFor(0) is level and bank keeps the sign of its pitch (no inversion, no offset)');
  } else {
    bad(
      'bankFor(0) is level and bank keeps the sign of its pitch (no inversion, no offset)',
      `bankFor(0) = ${bankFor(0)}; sign agreement ${signOk}. A mirrored bee rotated the wrong way climbs where it should dive.`,
    );
  }

  const foldOk = [
    [120, -50],
    [-30, 80],
    [5, 5],
  ].every(([dx, dy]) => Math.abs(pitchFor(dx, dy) - pitchFor(-dx, dy)) < 1e-9);
  if (foldOk) {
    ok('pitchFor discards the direction of travel and keeps only steepness');
  } else {
    bad(
      'pitchFor discards the direction of travel and keeps only steepness',
      'pitch differs for mirrored travel, so leftward flight would bank the opposite way from rightward',
    );
  }

  // `facingFor` gets the same treatment as `bankFor` and for the same reason:
  // its two live consumers between them supply about six values of dx, and six
  // points say nothing about a rule with a threshold in it. Swept with BOTH
  // incoming facings, because the whole content of the rule is what it does
  // when it declines to decide.
  const SIZE = 32;
  const held = [];
  const turned = [];
  for (const h of [1, -1]) {
    for (let dx = -200; dx <= 200; dx += 0.5) {
      const f = facingFor(dx, SIZE, h);
      (Math.abs(dx) / SIZE >= 1 ? turned : held).push({ dx, h, f });
    }
  }
  const heldWrong = held.filter((s) => s.f !== s.h);
  if (heldWrong.length === 0) {
    ok(`facingFor holds the incoming facing below one body width (${held.length} samples, size ${SIZE})`);
  } else {
    bad(
      `facingFor holds the incoming facing below one body width (${held.length} samples, size ${SIZE})`,
      `${heldWrong.length} samples turned anyway, first at dx ${heldWrong[0].dx} holding ${heldWrong[0].h}. ` +
        'A bare Math.sign fails here and nowhere else — this is the row that separates the rule from the ' +
        'reflex, and loginArc segment 4 (0.80 body widths) is the live fixture.',
    );
  }
  const turnedWrong = turned.filter((s) => s.f !== Math.sign(s.dx));
  if (turnedWrong.length === 0) {
    ok(`facingFor faces its travel at or above one body width (${turned.length} samples, size ${SIZE})`);
  } else {
    bad(
      `facingFor faces its travel at or above one body width (${turned.length} samples, size ${SIZE})`,
      `${turnedWrong.length} samples kept the old facing, first at dx ${turnedWrong[0].dx}`,
    );
  }
  const scalesWithSize = [13, 16, 22, 32, 44, 64].every(
    (s) => facingFor(-s * 0.99, s, 1) === 1 && facingFor(-s * 1.01, s, 1) === -1,
  );
  if (scalesWithSize) {
    ok('facingFor threshold scales with size, not with a screen (checked at every live flight size)');
  } else {
    bad(
      'facingFor threshold scales with size, not with a screen (checked at every live flight size)',
      'the threshold did not track `size`. Whether sideways reads as sideways is a question about the ' +
        "character's own length; a fixed pixel deadband would be tuned against one container.",
    );
  }
}

// =========================================================================
// B/C. THE CALL SITES
// =========================================================================
console.log('\nB. FlyingBee wiring');

const flyingBeeSource = await readFile(FLYING_BEE, 'utf8');
const flyingBeeAst = parseJs(flyingBeeSource);

// The module has to be the file's ONLY source of rotation, or the rows
// above are about a function the render doesn't use.
{
  const importsBuild = flyingBeeAst.program.body.some(
    (n) =>
      n.type === 'ImportDeclaration' &&
      n.source.value.includes('beeAttitude') &&
      n.specifiers.some((s) => s.imported?.name === 'buildAttitude'),
  );
  let otherRotation = 0;
  walk(flyingBeeAst.program, (n) => {
    if (n.type === 'CallExpression' && n.callee?.property?.name === 'atan2') otherRotation += 1;
  });
  if (importsBuild && otherRotation === 0) {
    ok('FlyingBee.js takes its attitude from buildAttitude and computes no angle of its own');
  } else {
    bad(
      'FlyingBee.js takes its attitude from buildAttitude and computes no angle of its own',
      `imports buildAttitude: ${importsBuild}; atan2 call sites in the file: ${otherRotation}`,
    );
  }
}

// Durations and easings are read out of the source, not restated here — a
// track flown for a different length gets a different turn window, and the
// wall-time row below is only meaningful if it uses the real number.
const constants = {};
walk(flyingBeeAst.program, (n) => {
  if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier') {
    if (n.init?.type === 'NumericLiteral') constants[n.id.name] = n.init.value;
    if (n.id.name.endsWith('_EASING')) {
      constants[n.id.name] = flyingBeeSource.slice(n.init.start, n.init.end);
    }
  }
  if (n.type === 'ObjectProperty' && n.key.name === 'duration' && n.value.type === 'NumericLiteral') {
    constants.presetDuration = n.value.value;
  }
});

// §32.2, then the Bee Doctrine, then R-LF-2.1. `CRUISE_EASING` was deleted
// with the loop it eased and replaced by `BEAT_EASINGS`, the three curves a
// sequenced beat was flown on; the doctrine retired the beats; what was left
// flying was the ERRAND, whose two curves lived at the `buildPollinationPlan`
// call site, and the preset arc.
//
// **The errand's two curves are RETIRED TOO, and this is their retirement
// rather than a silent deletion.** The row here enumerated `easeApproach` and
// `easeDescent` off the call site and failed CLOSED if it could not read both
// — the right shape, for as long as the errand's shape was a pair of named
// curves a caller passed in. R-LF-2.1 deletes them: the flight's speed is now
// a continuous profile the builder owns (`buildSpeedProfile`), and the
// composed easing is derived from it per segment, so there is no named curve
// at the call site to read and no wall-time window to convert through one.
//
// A row whose subject is gone must be removed, not left green over nothing —
// the same ruling applied to the sortie row immediately below. What it
// protected is protected better, one level up: M4d samples the RENDERED arc
// speed against `speedAtMs(plan.profile, t)` at every frame of every plan on
// the lattice, which is the actual curve the bee is flown on rather than the
// name of one. M6 asserts, in both directions, that no easing can cross that
// call boundary again.
//
// `PRESET_EASING` is untouched and still modelled: a preset arc IS one named
// curve, and the preset's turn-window row below converts through it — so the
// fail-closed check moves to it alone rather than being deleted with the pair.
if (EASINGS[constants.PRESET_EASING]) {
  ok(`PRESET_EASING is an easing this gate models (${constants.PRESET_EASING})`);
} else {
  bad(
    'PRESET_EASING is an easing this gate models',
    `found ${constants.PRESET_EASING ?? '(missing)'}, modelled: ${Object.keys(EASINGS).join(' | ')}. ` +
      'The turn window is specified in wall time and only the easing converts that into `t`, so an ' +
      'unmodelled easing means this gate CANNOT TELL — which is a failure, not a pass.',
  );
}

// §28.5 — **the sortie-vs-visit row is RETIRED, and its retirement is the
// entry rather than a silent deletion.** It asserted that an idle sortie was
// flown on the same two curves as the tap's visit, because "a sortie is a
// pollination visit without the pollen" and two curves would have split one
// gesture into two that merely read alike today. The Bee Doctrine retires the
// sortie, so the row's subject no longer exists — and a row whose subject is
// gone must be removed, not left green over nothing (the callee-position
// failure: an assertion that can no longer fail is not an assertion).
//
// What it protected is still protected, one level up: §28.5's contrast is now
// between the errand and a bee at REST, checked by F6, and the errand no
// longer has curves to enumerate at all (R-LF-2.1 — see the retirement
// immediately above).

// --- enumerate the call sites off disk ------------------------------------
const jsFiles = async (dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await jsFiles(full)));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
};

const found = [];
for (const file of [path.join(ROOT, 'App.js'), ...(await jsFiles(path.join(ROOT, 'src')))]) {
  if (file === FLYING_BEE) continue;
  const src = await readFile(file, 'utf8');
  if (!src.includes('<FlyingBee')) continue;
  walk(parseJs(src).program, (n) => {
    if (n.type !== 'JSXOpeningElement' || n.name.name !== 'FlyingBee') return;
    const props = {};
    n.attributes.forEach((a) => {
      if (a.type !== 'JSXAttribute') return;
      const v = a.value;
      props[a.name.name] =
        v === null ? true : v.type === 'StringLiteral' ? v.value : v.expression?.value;
    });
    found.push({ file: path.relative(ROOT, file), line: n.loc.start.line, props, src });
  });
}

const declared = new Map(CALL_SITES.map((s) => [s.file, s]));
const seen = new Set();
for (const site of found) {
  const entry = declared.get(site.file);
  if (!entry) {
    bad(
      `${site.file}:${site.line} <FlyingBee> is covered by this gate's container table`,
      'no entry for this file. A flight in an undeclared box is exactly the defect this gate exists ' +
        'for — add it to CALL_SITES with the container the call site mounts, and why.',
    );
    continue;
  }
  if (seen.has(site.file)) {
    bad(
      `${site.file}:${site.line} <FlyingBee> is covered by this gate's container table`,
      'a second <FlyingBee> in a file the table describes once — the two mounts may be in different boxes',
    );
    continue;
  }
  seen.add(site.file);
  entry.line = site.line;
  entry.size = site.props.size ?? constants.DEFAULT_SIZE;
  entry.source = site.src;
  // §32.2 — whether the mount is handed an anchor set at all. Presence of the
  // prop, not its value: the value is a conditional expression at both cruise
  // sites (that IS the suppression mechanism) and no static read can say what
  // it evaluates to. What this gate can say is that the mount is WIRED, and
  // section K checks the sets it is wired to.
  entry.hasPerches = Object.prototype.hasOwnProperty.call(site.props, 'perches');
  if ((site.props.preset ?? null) !== entry.preset) {
    bad(
      `${site.file}:${site.line} flies the preset this gate's table declares`,
      `source says ${site.props.preset ?? 'cruise'}, table says ${entry.preset ?? 'cruise'}`,
    );
  }
}
for (const entry of CALL_SITES) {
  if (!seen.has(entry.file)) {
    bad(
      `${entry.file} still mounts a <FlyingBee>`,
      'the table describes a call site that no longer exists — stale rows make a green run mean less than it looks',
    );
  }
}
ok(`every <FlyingBee> call site on disk is declared here (${found.length} found, ${CALL_SITES.length} declared)`);

console.log('\nC. tracks, in the container the call site mounts');

// A declared box that can be read back from a stylesheet IS read back.
for (const entry of CALL_SITES) {
  if (!entry.anchorStyle || !entry.source) continue;
  const dims = {};
  walk(parseJs(entry.source).program, (n) => {
    if (n.type !== 'ObjectProperty' || n.key.name !== entry.anchorStyle) return;
    n.value.properties?.forEach((p) => {
      if (p.value?.type === 'NumericLiteral') dims[p.key.name] = p.value.value;
    });
  });
  const want = entry.containers[0];
  if (dims.width === want.width && dims.height === want.height) {
    ok(`${entry.file} styles.${entry.anchorStyle} is still ${want.width}x${want.height} (the box the path resolves against)`);
  } else {
    bad(
      `${entry.file} styles.${entry.anchorStyle} is still ${want.width}x${want.height}`,
      `stylesheet says ${dims.width}x${dims.height}. Every figure below for this site is measured in that box; ` +
        'resolving this flight against the screen instead is the error this gate was written after.',
    );
  }
}

const PATHS = {};
walk(flyingBeeAst.program, (n) => {
  if (n.type === 'ObjectProperty' && n.key.name === 'loginArc') {
    walk(n.value, (m) => {
      if (m.type === 'ArrayExpression' && !PATHS.loginArc) {
        PATHS.loginArc = JSON.parse(flyingBeeSource.slice(m.start, m.end).replace(/(\w+):/g, '"$1":').replace(/,(\s*])/g, '$1'));
      }
    });
  }
});

for (const entry of CALL_SITES) {
  if (!entry.source) continue;
  // §32.2 — a cruise mount HAS no static path any more, so there is nothing
  // here to resolve and this section does not pretend otherwise. It is a
  // hand-off, not a skip, and the difference is asserted rather than assumed:
  // an unsequenced cruise mount is a bee with nowhere to go, and the one thing
  // that must never happen quietly is for it to fall through this section
  // green. R82's own mutation found exactly this shape — a row that resolved
  // an unreadable path to a default and reported a flight nobody flies. The
  // attitude of a sequenced flight is checked in section K, against the plans
  // the anchors actually produce.
  if (entry.preset === null) {
    if (entry.hasPerches) {
      ok(`${entry.file}:${entry.line} cruise is sequenced — no static path to resolve here (attitude in section K)`);
    } else {
      bad(
        `${entry.file}:${entry.line} cruise is sequenced`,
        'this <FlyingBee> takes no `perches` prop. `PATH` was deleted rather than kept as a fallback ' +
          '(§32.2), so an unsequenced cruise mount is a bee with nowhere to land — it renders nothing, ' +
          'silently, on whichever screen forgot. Declare anchors with <PerchAnchor> and pass the set.',
      );
    }
    continue;
  }
  const trackPath = PATHS[entry.preset];
  const easing = EASINGS[constants.PRESET_EASING];
  const durationMs = constants.presetDuration;
  const label = `${entry.file}:${entry.line} ${entry.preset} (size ${entry.size})`;

  if (!trackPath || !easing || !durationMs) {
    bad(`${label} is resolvable from source`, `path ${!!trackPath}, easing ${!!easing}, duration ${durationMs}`);
    continue;
  }

  const runs = entry.containers.map((box) => ({
    box,
    a: buildAttitude(trackPath, {
      width: box.width,
      height: box.height,
      size: entry.size,
      closed: false,
      easing,
      durationMs,
    }),
  }));

  const check = (name, predicate, describe) => {
    const bads = runs.filter((r) => !predicate(r));
    if (bads.length === 0) ok(`${label} — ${name} [${runs.length} container${runs.length > 1 ? 's' : ''}]`);
    else bad(`${label} — ${name}`, bads.map((r) => `${r.box.label}: ${describe(r)}`).join('; '));
  };

  check(
    `rendered bank stays within ±${MAX_BANK_DEG}° at every interpolation node`,
    (r) => Math.max(...r.a.rotateOutput.map(Math.abs)) <= MAX_BANK_DEG + 1e-9,
    (r) => `max ${Math.max(...r.a.rotateOutput.map(Math.abs)).toFixed(2)}°`,
  );

  check(
    'facing only changes on a segment over one body width of horizontal travel',
    (r) =>
      r.a.segments.every(
        (s, i) => i === 0 || s.facing === r.a.segments[i - 1].facing || s.bodyWidths >= 1,
      ),
    (r) => {
      const j = r.a.segments.findIndex(
        (s, i) => i > 0 && s.facing !== r.a.segments[i - 1].facing && s.bodyWidths < 1,
      );
      return `segment ${j + 1} turns on ${r.a.segments[j].bodyWidths.toFixed(2)} body widths`;
    },
  );

  check(
    'segment 1 clears one body width on its own (nothing to hold)',
    (r) => r.a.segments[0].bodyWidths >= 1,
    (r) => `${r.a.segments[0].bodyWidths.toFixed(2)} body widths`,
  );

  check(
    'attitude inputRange is strictly increasing (Animated.interpolate contract)',
    (r) => r.a.inputRange.every((t, i) => i === 0 || t > r.a.inputRange[i - 1]),
    () => 'a turn window collided with a waypoint',
  );

  check(
    'scaleX never exceeds a mirror',
    (r) => r.a.scaleXOutput.every((v) => Math.abs(v) <= 1 + 1e-9),
    (r) => `max |scaleX| ${Math.max(...r.a.scaleXOutput.map(Math.abs)).toFixed(3)}`,
  );

  // The space rule: a turn is specified in wall time, and `t` is eased, so
  // the only way to check it is to convert back through the easing.
  const wallOf = (r, t) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 60; i += 1) {
      const mid = (lo + hi) / 2;
      if (easing(mid) < t) lo = mid;
      else hi = mid;
    }
    return ((lo + hi) / 2) * durationMs;
  };
  check(
    `each facing change takes ${TURN_MS}ms of wall time, not a fixed slice of t`,
    (r) => r.a.windows.every((w) => Math.abs(wallOf(r, w.tEnd) - wallOf(r, w.tStart) - TURN_MS) < 2),
    (r) =>
      r.a.windows
        .map((w) => `${(wallOf(r, w.tEnd) - wallOf(r, w.tStart)).toFixed(1)}ms (Δt ${(w.tEnd - w.tStart).toFixed(5)})`)
        .join(', '),
  );

  check(
    'rotation levels off exactly where the mirror crosses zero',
    (r) =>
      r.a.windows.every((w) => {
        const i = r.a.inputRange.findIndex((t) => Math.abs(t - w.tMid) < 1e-9);
        return i >= 0 && Math.abs(r.a.rotateOutput[i]) < 1e-9 && Math.abs(r.a.scaleXOutput[i]) < 1e-9;
      }),
    () => 'the bee would swap sides at a visible width, or hold a bank through the swap',
  );

  // The loop-seam rows lived here and are deleted with the loop (§32.2). They
  // asserted that attitude at t=1 matched t=0 and that a seam turn finished
  // before t=1 — both properties of `Animated.loop` restarting `t` on a closed
  // track. No sequenced beat repeats and no preset closes, so `closed` is now
  // false at every call site: these rows could only ever have been vacuously
  // green, and a vacuously green row is worse than no row.
}

// =========================================================================
// D. BeeTransition
// =========================================================================
//
// The other thing that flies the mascot. It has no track and no container —
// one stretch of translate, authored in points at the call site — so none of
// section B applies to it, and it was outside this gate entirely until the
// mascot got a face.
//
// What the face exposed: `SHARE_CARRY_PATH` travels 40pt to the LEFT, and the
// component never mirrored. That flight has been running tail-first on the
// Hive for as long as it has existed, invisibly, because the drawing it used
// had no expression to contradict. The row below is the one that catches it,
// and it catches it by asking the same question section B asks — which way is
// this bee pointing, given how far it travels — of the component that had
// never been asked.
console.log('\nD. BeeTransition paths');

const BEE_TRANSITION = path.join(ROOT, 'src/components/BeeTransition.js');
const btSource = await readFile(BEE_TRANSITION, 'utf8');
const btAst = parseJs(btSource);

// A path object as written in source: `{ translateX: [...], rotate: [...] }`.
const readPathObject = (node) => {
  if (node?.type !== 'ObjectExpression') return null;
  const out = {};
  node.properties.forEach((p) => {
    if (p.type !== 'ObjectProperty' || p.value?.type !== 'ArrayExpression') return;
    out[p.key.name] = p.value.elements.map((e) =>
      e.type === 'UnaryExpression' ? -e.argument.value : e.value,
    );
  });
  return out;
};

// The default every caller that passes no `path` flies. Read from the
// component rather than restated here, so the gate cannot disagree with it.
let DEFAULT_BT_PATH = null;
walk(btAst.program, (n) => {
  if (n.type === 'VariableDeclarator' && n.id?.name === 'DEFAULT_PATH') {
    DEFAULT_BT_PATH = readPathObject(n.init);
  }
});

{
  const importsFacing = btAst.program.body.some(
    (n) =>
      n.type === 'ImportDeclaration' &&
      n.source.value.endsWith('beeAttitude') &&
      n.specifiers.some((s) => s.imported?.name === 'facingFor'),
  );
  let ownSign = 0;
  walk(btAst.program, (n) => {
    if (
      n.type === 'MemberExpression' &&
      n.object?.name === 'Math' &&
      n.property?.name === 'sign'
    ) {
      ownSign += 1;
    }
  });
  if (importsFacing && ownSign === 0) {
    ok('BeeTransition takes its facing from facingFor and holds no facing rule of its own');
  } else {
    bad(
      'BeeTransition takes its facing from facingFor and holds no facing rule of its own',
      `imports facingFor: ${importsFacing}; Math.sign call sites in the file: ${ownSign}. Two copies of ` +
        'the one-body-width rule is one copy that can drift, and this is the file where drift is invisible.',
    );
  }

  // scaleX must be the LAST transform entry, in both render paths. RN folds
  // the array left to right onto a row vector, so the last entry is applied
  // first: mirror the drawing, then bank it. The other order banks the drawing
  // and then mirrors the bank, which climbs where it should dive.
  const orders = [];
  walk(btAst.program, (n) => {
    if (n.type !== 'ObjectProperty' || n.key?.name !== 'transform' || n.value?.type !== 'ArrayExpression') return;
    orders.push(
      n.value.elements.map((e) => e?.properties?.[0]?.key?.name ?? '?'),
    );
  });
  const scaleXLast = orders.length > 0 && orders.every((o) => o[o.length - 1] === 'scaleX');
  if (scaleXLast) {
    ok(`scaleX is the last transform entry in all ${orders.length} BeeTransition render paths (applied first)`);
  } else {
    bad(
      `scaleX is the last transform entry in all ${orders.length} BeeTransition render paths (applied first)`,
      orders.map((o) => `[${o.join(', ')}]`).join('; ') || 'no transform arrays found',
    );
  }
}

// Resolve every <BeeTransition> on disk to the path constant it flies and the
// size it flies at. A site whose path cannot be resolved is a FAILURE: this
// gate must not be able to shrug.
{
  const DEFAULT_SIZE = 32;
  const sites = [];
  for (const file of [path.join(ROOT, 'App.js'), ...(await jsFiles(path.join(ROOT, 'src')))]) {
    if (file === BEE_TRANSITION) continue;
    const src = await readFile(file, 'utf8');
    if (!src.includes('<BeeTransition')) continue;
    const ast = parseJs(src);
    const consts = new Map();
    walk(ast.program, (n) => {
      if (n.type !== 'VariableDeclarator' || n.id?.type !== 'Identifier') return;
      const obj = readPathObject(n.init);
      if (obj) consts.set(n.id.name, obj);
    });
    walk(ast.program, (n) => {
      if (n.type !== 'JSXOpeningElement' || n.name.name !== 'BeeTransition') return;
      const props = {};
      n.attributes.forEach((a) => {
        if (a.type !== 'JSXAttribute') return;
        props[a.name.name] = a.value?.expression ?? a.value;
      });
      // Three cases, and keeping them apart is the point. No `path` prop at
      // all means the component's own default, which this gate has read. A
      // named constant resolves in the file that declares it. An inline
      // object resolves directly. Anything else — an import, a call, a
      // ternary — is UNRESOLVED, and unresolved must not fall back to the
      // default: that would check a flight this call site does not fly, and
      // report it as a clean pass. This gate's own header says the place it
      // declines to have an opinion must not look like the place it has one,
      // and the first draft of this block did exactly that.
      let pathName = '(default path)';
      let def = DEFAULT_BT_PATH;
      if (props.path) {
        if (props.path.type === 'Identifier') {
          pathName = props.path.name;
          def = consts.get(pathName) ?? null;
        } else if (props.path.type === 'ObjectExpression') {
          pathName = '(inline)';
          def = readPathObject(props.path);
        } else {
          pathName = `(${props.path.type})`;
          def = null;
        }
      }
      sites.push({ file: path.relative(ROOT, file), line: n.loc.start.line, pathName, def, size: props.size?.value ?? DEFAULT_SIZE });
    });
  }

  const unresolved = sites.filter((s) => !s.def || !Array.isArray(s.def.translateX) || !Array.isArray(s.def.rotate));
  if (unresolved.length === 0) {
    ok(`every <BeeTransition> call site resolves to a path this gate can read (${sites.length} found)`);
  } else {
    bad(
      `every <BeeTransition> call site resolves to a path this gate can read (${sites.length} found)`,
      unresolved.map((s) => `${s.file}:${s.line} path=${s.pathName}`).join('; ') +
        ' — a flight this gate cannot read is a flight it is not checking, and that must not look like a pass.',
    );
  }

  for (const s of sites.filter((x) => x.def?.translateX && x.def?.rotate)) {
    const dx = s.def.translateX[s.def.translateX.length - 1] - s.def.translateX[0];
    const facing = facingFor(dx, s.size, 1);
    const banks = s.def.rotate.map((r) => parseFloat(r) * facing);
    const worst = banks.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a));
    const label =
      `${s.file}:${s.line} ${s.pathName ?? '(default path)'} @ size ${s.size} — ` +
      `travels ${dx.toFixed(0)}pt (${(Math.abs(dx) / s.size).toFixed(2)} body widths), ` +
      `faces ${facing > 0 ? 'right' : 'left'}, bank within ±${MAX_BANK_DEG}°`;
    if (Math.abs(worst) <= MAX_BANK_DEG + 1e-9) ok(label);
    else bad(label, `worst rendered bank ${worst.toFixed(1)}°`);
  }
}

// =========================================================================
// E. One bee
// =========================================================================
//
// Colin, verbatim: *"never have any other bee than our mascot."* Until this
// section that rule was enforced by a conversation and nothing else — the
// gate above holds the mascot at a readable attitude and says nothing about
// whether the thing being held is the mascot.
//
// The obvious shape is an exemption list: no bee but the mascot, *unless*
// declared here with a reason. I am not writing that, and the reason is a
// rule I have been on the wrong side of before — **an `unless` clause is
// self-issued unless you check who granted it.** A list of permitted
// exceptions is a place for the next exception to go, and the register that
// was going to be its first entry (the keepsake, ink-on-gold, which a raster
// cannot recolour) turned out not to need one: the mascot inverts which
// element carries the form, so undoing that inversion *is* the knockout.
// R83. Both registers are now the same drawing, so the exemption list would
// have been an empty list with a door in it.
//
// So the rule is enforced by absence. There is one drawing of the bee, it
// ships as `mascot-*.png`, and the component that drew the other one does not
// exist. A gate cannot check that a PNG is on-brand, but it can check that no
// second bee has been *drawn* — which is the form every previous non-mascot
// bee took, including the two redraws this project rejected.
console.log('\nE. One bee');

{
  const beeSources = (await jsFiles(path.join(ROOT, 'src'))).concat(path.join(ROOT, 'App.js'));

  // 1. The component that drew the old bee is gone, not deprecated. A file
  //    still on disk is a file an import can find.
  const stripedBee = path.join(ROOT, 'src/components/StripedBee.js');
  if (!existsSync(stripedBee)) {
    ok('src/components/StripedBee.js does not exist (the second drawing is deleted, not deprecated)');
  } else {
    bad(
      'src/components/StripedBee.js does not exist (the second drawing is deleted, not deprecated)',
      'it is still on disk, so an import can still find it',
    );
  }

  // 2. `StripedBee` survives only as prose. Several headers name it to record
  //    why it went — naming a thing to explain its removal is the opposite of
  //    keeping it, and a reader who finds no trace re-derives the same wrong
  //    turn. What must not survive is an *identifier*: an import, a render, a
  //    reference of any kind the parser can see.
  //
  //    The distinction is computed, not declared. An allow-list of files
  //    permitted to mention it would be an exemption list wearing a different
  //    hat, and it would have to be edited every time a header is written.
  const identifiers = [];
  let mentions = 0;
  for (const file of beeSources) {
    const src = await readFile(file, 'utf8');
    if (!src.includes('StripedBee')) continue;
    mentions += 1;
    walk(parseJs(src).program, (n) => {
      const hit =
        (n.type === 'Identifier' && n.name === 'StripedBee') ||
        (n.type === 'JSXIdentifier' && n.name === 'StripedBee');
      if (hit) identifiers.push(`${path.relative(ROOT, file)}:${n.loc.start.line}`);
    });
  }
  if (identifiers.length === 0) {
    ok(`StripedBee survives only in comments (${mentions} files mention it, 0 identifiers)`);
  } else {
    bad(
      'StripedBee survives only in comments',
      `${identifiers.join(', ')} — a live reference to a component that no longer exists`,
    );
  }

  // 3. Every bee actually rendered is one of the two mascot components.
  //    Enumerated off disk, so a third one added tomorrow fails without
  //    anyone remembering this rule — which is the only kind of rule that
  //    survives the thread it was agreed in.
  //    "Is this the mascot" is answered by REACHABILITY, not by a list. The
  //    two components that draw `mascot-*.png` seed the set; anything whose
  //    own file renders a member joins it, to a fixpoint. So a wrapper that
  //    adds a rhythm to the mascot (`WelcomeBee`, the 132pt held pose) passes
  //    by construction, and a new bee that draws its own shapes fails by
  //    construction — neither needs an entry anywhere.
  //
  //    A hardcoded permitted-set is the version of this row that has the hole
  //    it exists to close: the first draft was one, and adding `WelcomeBee` to
  //    it by hand is exactly the edit that makes the next bee's entry routine.
  //
  //    TWO CORRECTIONS, both found by mutating this row rather than reading it:
  //
  //    (a) The seeds were the hardcoded pair `MascotBee`/`KeepsakeBee` — the
  //        same list one level down, since a third register would have to be
  //        added by hand. A seed is now anything that `require`s an
  //        `assets/mascot-*.png`, so a register that draws the shipped asset
  //        joins on its own and one that draws a *different* asset does not.
  //
  //    (b) Membership was EXISTENTIAL where the rule is UNIVERSAL: "renders a
  //        mascot somewhere in its file." A component that draws its own bee
  //        on one branch and delegates to `MascotBee` on another satisfied
  //        that and passed — verified, it goes green. And that is not a
  //        hypothetical shape: it is `WelcomeBee` as it stood this morning,
  //        one `<MascotBee>` away from being invisible to the row written to
  //        find it. So a wrapper joins only if it renders a member AND draws
  //        no vectors of its own. Scope stated plainly: "draws its own" means
  //        it imports `react-native-svg`, which is how every bee this project
  //        has ever drawn was drawn. A bee assembled from rounded `View`s
  //        would still walk through, and no row here claims otherwise.
  const draws = new Map();
  const renders = new Map();
  const seeds = new Set();
  const vector = new Set();
  for (const file of beeSources) {
    const src = await readFile(file, 'utf8');
    if (!src.includes('Bee')) continue;
    const rel = path.relative(ROOT, file);
    if (/require\(\s*['"][^'"]*assets\/mascot-[^'"]*\.png['"]\s*\)/.test(src)) seeds.add(path.basename(rel, '.js'));
    walk(parseJs(src).program, (n) => {
      if (n.type === 'ImportDeclaration' && n.source.value === 'react-native-svg') vector.add(rel);
      if (n.type === 'JSXOpeningElement' && typeof n.name.name === 'string' && /Bee$/.test(n.name.name)) {
        renders.set(`${rel}:${n.loc.start.line}`, n.name.name);
        (draws.get(rel) ?? draws.set(rel, new Set()).get(rel)).add(n.name.name);
      }
    });
  }
  const componentFile = (name) => `src/components/${name}.js`;
  const mascotSet = new Set(seeds);
  for (let grew = true; grew; ) {
    grew = false;
    for (const [rel, children] of draws) {
      const name = path.basename(rel, '.js');
      if (mascotSet.has(name) || rel !== componentFile(name) || vector.has(rel)) continue;
      if ([...children].some((c) => mascotSet.has(c))) {
        mascotSet.add(name);
        grew = true;
      }
    }
  }
  const strangers = [...renders].filter(([, name]) => !mascotSet.has(name));
  if (strangers.length === 0) {
    ok(`every rendered <*Bee> draws the mascot (${mascotSet.size} components reach mascot-*.png: ${[...mascotSet].sort().join(', ')})`);
  } else {
    // The two ways in are different defects and the line has to say which,
    // or a red on the hybrid reads as a red on a missing import.
    bad(
      'every rendered <*Bee> draws the mascot',
      strangers
        .map(([at, name]) =>
          vector.has(componentFile(name))
            ? `${at} <${name}> — renders the mascot but imports react-native-svg, so it also draws a bee of its own`
            : `${at} <${name}> — does not reach mascot-*.png by any render path`)
        .join('; ') + ' — Colin: "never have any other bee than our mascot."',
    );
  }

  // 4. The two registers draw the same character. Not a colour check — the
  //    assets are rasters and this gate cannot see inside them — but they are
  //    exported onto one character box, and `constants/mascot.js` states that
  //    box. Two components sharing one geometry module is what makes a swap
  //    between registers keep its footprint; if one grows its own numbers,
  //    that has silently stopped being true.
  const registers = ['src/components/MascotBee.js', 'src/components/KeepsakeBee.js'];
  const strays = [];
  for (const rel of registers) {
    const src = await readFile(path.join(ROOT, rel), 'utf8');
    if (!/from '\.\.\/constants\/mascot'/.test(src)) strays.push(`${rel} does not import constants/mascot`);
    walk(parseJs(src).program, (n) => {
      if (n.type !== 'VariableDeclarator' || n.init?.type !== 'NumericLiteral') return;
      strays.push(`${rel} declares a bare geometry number ${n.id.name} = ${n.init.value}`);
    });
  }
  if (strays.length === 0) {
    ok('both registers take their geometry from constants/mascot (one character box, so a register swap keeps its footprint)');
  } else {
    bad('both registers take their geometry from constants/mascot', strays.join('; '));
  }
}

// =========================================================================
// F. The pollination tap (§28)
// =========================================================================
//
// The beat: you tap a face in your hive and the bee comes over and agrees
// with you. §28.1 makes it decorative by ruling — he is never the
// acknowledgement and never on the critical path — so nothing here is about
// whether the flight looks right. It is about the three ways a decorative
// flight can quietly start asserting something untrue:
//
//   • it lands somewhere other than the face you tapped (§28.2 two boxes,
//     §28.3 a waypoint names a corner);
//   • it keeps flying at a target that stopped being the one you chose
//     (§28.9, and the two corrections underneath it);
//   • a duration or a count stops being derived and becomes a number
//     somebody typed, at which point every figure in §28.5 is a claim about
//     nothing.
//
// The rows follow section A's method rather than section B's wherever they
// can: the flight math lives in `pollinationFlight.js` and the seating and
// hit-test in `combLattice.js`, both dependency-free on purpose, so this
// gate SAMPLES THE FUNCTIONS instead of reading the config they happen to be
// called with. R81, third outing: four live waypoints cannot pin a rule.
console.log('\nF. the pollination tap');

const FLIGHT_MODULE = path.join(ROOT, 'src/components/pollinationFlight.js');
const LATTICE_MODULE = path.join(ROOT, 'src/components/combLattice.js');
const HONEYCOMB_GRID = path.join(ROOT, 'src/components/HoneycombGrid.js');
const MASCOT_CONSTANTS = path.join(ROOT, 'src/constants/mascot.js');

const SEQUENCER_MODULE = path.join(ROOT, 'src/components/flightSequencer.js');

const flightSource = await readFile(FLIGHT_MODULE, 'utf8');
const latticeSource = await readFile(LATTICE_MODULE, 'utf8');
const gridSource = await readFile(HONEYCOMB_GRID, 'utf8');
const mascotSource = await readFile(MASCOT_CONSTANTS, 'utf8');
const sequencerSource = await readFile(SEQUENCER_MODULE, 'utf8');

// --- F0. both modules are loadable, which is what every row below rests on
for (const [label, src] of [
  ['pollinationFlight.js', flightSource],
  ['combLattice.js', latticeSource],
  ['constants/mascot.js', mascotSource],
  ['flightSequencer.js', sequencerSource],
]) {
  const imports = parseJs(src).program.body.filter((n) => n.type === 'ImportDeclaration');
  if (imports.length === 0) {
    ok(`${label} declares no imports, so this gate can load it as a module`);
  } else {
    bad(
      `${label} declares no imports, so this gate can load it as a module`,
      `found ${imports.length}: ${imports.map((n) => n.source.value).join(', ')}. The rows below ` +
        'import and sample these modules; one dependency and they degrade to string-matching.',
    );
  }
}

const flight = await import(`data:text/javascript;base64,${Buffer.from(flightSource).toString('base64')}`);
const lattice = await import(`data:text/javascript;base64,${Buffer.from(latticeSource).toString('base64')}`);
const mascot = await import(`data:text/javascript;base64,${Buffer.from(mascotSource).toString('base64')}`);
const sequencer = await import(`data:text/javascript;base64,${Buffer.from(sequencerSource).toString('base64')}`);

// --- the module's own numbers, read rather than retyped. Every row below
//     that quotes a figure derives it from these, so the "should pass"
//     mutation §28.7 asks for — move `cellSize` and watch every distance and
//     derived duration move with it — actually exercises the rows instead of
//     sliding past them.
// §32.1 — the reference speed replaces `cruiseSpeedPxS(PATH, …, LOOP_MS)` as
// the number every §28.5 figure is defined against, and it is read off the
// sequencer module rather than retyped for the same reason everything else
// here is. `CRUISE_DIAG_PER_S` is the whole of it: a speed per container
// diagonal, so the rows below still move together when it moves.
const CRUISE_DIAG_PER_S = sequencer.CRUISE_DIAG_PER_S ?? null;
// The comb's cell size, from the prop default its only call site relies on.
const CELL_SIZE = (() => {
  const m = gridSource.match(/cellSize\s*=\s*(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
})();
// The bee's own box, from the prop default the pollination call site relies
// on. Paired with `MASCOT_WIDTH_FRACTION` off the constants module, this is
// the C′ staging offset's whole input, and both halves are read rather than
// retyped for the same reason `CELL_SIZE` is.
const BEE_SIZE = (() => {
  const d = flyingBeeAst.program.body
    .flatMap((n) => (n.type === 'VariableDeclaration' ? n.declarations : []))
    .find((x) => x.id?.name === 'DEFAULT_SIZE');
  return d?.init?.value ?? null;
})();
if (CRUISE_DIAG_PER_S && CELL_SIZE && BEE_SIZE) {
  ok(`the gate reads its inputs off the source (CRUISE_DIAG_PER_S ${CRUISE_DIAG_PER_S}, cellSize ${CELL_SIZE}, beeSize ${BEE_SIZE})`);
} else {
  bad('the gate reads its inputs off the source', `CRUISE_DIAG_PER_S=${CRUISE_DIAG_PER_S} cellSize=${CELL_SIZE} beeSize=${BEE_SIZE} — a null here means a row below is about to assert against a default it invented.`);
}

// --- F1. §28.7 row 1 — no pixel constant crosses the two boxes -----------
//
// §28.2: a flight's target is MEASURED in the flight's own box, never
// COMPUTED in the target's. The comb is three containers and a live scroll
// offset away from the bee, so the only honest currency is window
// coordinates. The enforceable form of that is an import check: if
// `FlyingBee` can see the comb's geometry it can be tempted to do the
// arithmetic, and the arithmetic is wrong by construction.
{
  const crossings = [];
  for (const [label, src, forbidden] of [
    ['FlyingBee.js', flyingBeeSource, ['./HoneycombGrid', './combLattice', '../screens/HoneycombTab']],
    ['HoneycombGrid.js', gridSource, ['./FlyingBee']],
  ]) {
    for (const node of parseJs(src).program.body) {
      if (node.type !== 'ImportDeclaration') continue;
      if (forbidden.includes(node.source.value)) crossings.push(`${label} imports ${node.source.value}`);
    }
  }
  // `ringStep` is a measured property of the comb and travels WITH the
  // target for exactly this reason; a bee that knew the comb's cell size
  // would be a bee that knew what it was flying over.
  //
  // Asserted on IDENTIFIERS, not on the source text. The first draft of this
  // row was a regex and it went red on the comment two lines above — which is
  // R51's own rule (a grep overcounts a class; classify the hits, never quote
  // the count) failing inside the row written to enforce a different one.
  // Prose about a variable is not the variable.
  walk(flyingBeeAst.program, (n) => {
    if (n.type === 'Identifier' && n.name === 'cellSize') crossings.push('FlyingBee.js binds cellSize');
  });
  if (crossings.length === 0) {
    ok('no pixel constant crosses between the flight box and the comb box (§28.2)');
  } else {
    bad('no pixel constant crosses between the flight box and the comb box (§28.2)', crossings.join('; '));
  }
}

// --- F2. §28.7 row 2 — the half-box correction, on both axes -------------
//
// `styles.bee` is absolutely positioned with no offsets, so translateX/Y
// place the TOP-LEFT of the bee's box and every waypoint in this app has
// always named a corner. On a decorative loop nobody notices. On a landing
// it is 22.00pt in each axis at size 44 — 0.408 of a seat step, most of the
// way to the neighbour of the face he came to visit.
//
// The correction is half the BOX, not half the character: `MascotBee`
// centres the character inside `size × size`, so the box centre and the
// character centre are the same point. The row asserts the expression, both
// axes, and that no other divisor sneaks in — `size / 2` written once per
// axis is the whole fix and there is nothing else to tune.
//
// Located by ROLE. The first version of this row found the two properties by
// grepping their source for `originRef`, and R91 renamed that term to
// `boxOrigin` for reasons that had nothing to do with the half-box — so the
// row went red on a file where the correction was still present, on both
// axes, unchanged. A locator built out of an identifier that merely happens
// to appear inside the expression fails correct trees, and a row that fails
// correct trees is a row people learn to edit. `const target = { … }` is what
// this row is actually about, so that is what it looks for.
const pollinationTarget = (() => {
  let found = null;
  walk(flyingBeeAst.program, (n) => {
    if (found || n.type !== 'VariableDeclarator' || n.id?.name !== 'target') return;
    if (n.init?.type !== 'ObjectExpression') return;
    found = n.init;
  });
  return found;
})();
const targetAxisProp = (axis) =>
  pollinationTarget?.properties?.find(
    (p) => p.type === 'ObjectProperty' && p.key?.name === axis,
  ) ?? null;
{
  const NAME = 'the target is corrected by size / 2 on both axes (§28.3 — the waypoint names a corner, not a bee)';
  if (!pollinationTarget) {
    bad(NAME, 'no `const target = { … }` object literal in FlyingBee.js, so this row could not find the expression it is about — CANNOT TELL, which is a fail.');
  } else {
    const halves = [];
    const others = [];
    for (const axis of ['x', 'y']) {
      const prop = targetAxisProp(axis);
      if (!prop) {
        others.push(`${axis}: absent from the target literal`);
        continue;
      }
      const src = flyingBeeSource.slice(prop.start, prop.end).replace(/\s+/g, ' ');
      if (/-\s*size\s*\/\s*2/.test(src)) halves.push(axis);
      else others.push(`${axis}: ${src}`);
    }
    if (halves.length === 2 && others.length === 0) {
      ok(NAME);
    } else {
      bad(
        NAME,
        `axes corrected: [${halves.join(', ')}]${others.length ? `; uncorrected: ${others.join('; ')}` : ''}. ` +
          'Uncorrected, the bee lands 0.408 of a seat step down-and-right of the face he came to visit.',
      );
    }
  }
}

// --- F2b. §28.2 — the origin is measured at the moment of use ------------
//
// The other term in that same expression, and the one with no signature when
// it goes wrong. `originRef` used to be filled once from `onLayout` and then
// held. That is sound only if the box can move by nothing but a layout pass,
// and it can: `onLayout` is emitted from `affectedLayoutableNodes`
// (`ShadowTree.cpp:571-574`), which is filled only under
// `getHasNewLayout()` (`YogaLayoutableShadowNode.cpp:701`), and Yoga does not
// handle transforms at all (`YGNode.h:279`). A container moved by an ancestor
// transform leaves the cached origin stale, silently, by an amount with no
// sign to spot it by.
//
// So the row asserts the TRIGGER, not the call: `measureInWindow` was already
// in the file — it was simply invoked from the one event a transform does not
// produce. F3 below has the same shape of history and it is worth stating the
// pair, because they are the same lesson twice: F3 asked whether the source
// NAMES the live ref and nothing asked whether the ref was LIVE; this asks
// whether the origin is measured, and the thing that must be checked is WHEN.
//
// What it does not cover, stated so nobody reads coverage into it: a
// natively-driven ancestor transform is invisible to `measureInWindow` too
// (it reads the shadow tree — `DOM.cpp:536-539` — and the native driver
// writes the layer directly, `RCTMountingManager.mm:316-324`; measured, 18
// samples of y = 0 while the view slid 200pt). Measure-on-use widens the
// coverage from "layout only" to "layout + JS-driven transform". It does not
// close the class, and no row here claims it does.
{
  const NAME = 'the window origin is measured when the flight is planned, not cached at layout (§28.2)';
  // A function whose body measures the bee's OWN container. §28.2's whole
  // point is that the flight's box is the one measured, never the target's,
  // so the receiver is part of what makes a callee count.
  const measuresOwnBox = (fnNode) => {
    let hit = false;
    walk(fnNode, (n) => {
      if (hit) return;
      if (n.type !== 'CallExpression' && n.type !== 'OptionalCallExpression') return;
      const callee = n.callee;
      if (callee?.property?.name !== 'measureInWindow') return;
      let o = callee.object;
      while (o && (o.type === 'MemberExpression' || o.type === 'OptionalMemberExpression')) o = o.object;
      if (o?.type === 'Identifier' && o.name === 'containerRef') hit = true;
    });
    return hit;
  };
  const findFn = (name) => {
    let found = null;
    walk(flyingBeeAst.program, (n) => {
      if (found) return;
      if (n.type === 'FunctionDeclaration' && n.id?.name === name) found = n;
      if (
        n.type === 'VariableDeclarator' &&
        n.id?.name === name &&
        (n.init?.type === 'ArrowFunctionExpression' || n.init?.type === 'FunctionExpression')
      ) found = n.init;
    });
    return found;
  };
  // Names bound in this file to the RESULT OF CALLING a function that
  // measures the container. Resolving through the declarator is what makes
  // the row about freshness rather than about spelling: `readOrigin()` and
  // `originRef.current` are one character apart at the call site and are the
  // whole difference between measure-on-use and the defect.
  const freshNames = new Set();
  walk(flyingBeeAst.program, (n) => {
    if (n.type !== 'VariableDeclarator' || n.id?.type !== 'Identifier') return;
    const init = n.init;
    if (init?.type !== 'CallExpression' && init?.type !== 'OptionalCallExpression') return;
    if (init.callee?.type !== 'Identifier') return;
    const fn = findFn(init.callee.name);
    if (fn && measuresOwnBox(fn)) freshNames.add(n.id.name);
  });
  const axisUses = {};
  for (const axis of ['x', 'y']) {
    const prop = targetAxisProp(axis);
    axisUses[axis] = new Set();
    walk(prop?.value, (n) => {
      if (n.type === 'Identifier' && freshNames.has(n.name)) axisUses[axis].add(n.name);
    });
  }
  const shared = [...axisUses.x].filter((n) => axisUses.y.has(n));
  const staleAxes = ['x', 'y'].filter((axis) => {
    const prop = targetAxisProp(axis);
    return prop && /originRef\s*\.\s*current/.test(flyingBeeSource.slice(prop.start, prop.end));
  });
  // Order matters here, and it is the R73 rule rather than taste. Reading the
  // cache directly implies "no binding of a measure call", so a freshness-first
  // ordering reports the general symptom for the one defect this row exists to
  // catch, and the specific line — the one that names `originRef.current` —
  // becomes unreachable exactly when it is true. Most specific cause first.
  if (!pollinationTarget) {
    bad(NAME, 'no `const target = { … }` object literal in FlyingBee.js — CANNOT TELL, which is a fail.');
  } else if (staleAxes.length) {
    bad(
      NAME,
      `the target reads \`originRef.current\` directly on [${staleAxes.join(', ')}]. That is the origin as of the last layout pass — correct until an ancestor transform moves this box without one, and then wrong by the whole delta with nothing to see.`,
    );
  } else if (freshNames.size === 0) {
    bad(
      NAME,
      'nothing in this file binds the result of a call that runs `containerRef…measureInWindow`. Either the measure moved off the container the flight is drawn in, or the origin is being read from a cache again.',
    );
  } else if (shared.length === 0) {
    bad(
      NAME,
      `the target subtracts no freshly measured origin on both axes (x: [${[...axisUses.x].join(', ') || 'none'}], y: [${[...axisUses.y].join(', ') || 'none'}]).`,
    );
  } else {
    ok(`${NAME} — both axes subtract \`${shared.join('`, `')}\`, bound to a call that measures containerRef`);
  }
}

// --- F3. §28.7 row 4 — waypoint 0 is read, not assumed -------------------
//
// §28.4: waypoint 0 is where the bee already is, so the break costs no
// teleport. `posRef` already holds the live translated position — the trail
// sampler reads it. A constant here would make the bee jump to the start of
// its own approach, and on the abort path it would jump BACKWARDS to
// wherever the visit began.
//
// §32.2 SPLIT THIS ROW'S SUBJECT AND THE ROW CAUGHT IT — correctly, and as a
// false red, which is the more useful of the two outcomes to write down. The
// sequencer solves its dwell against `sortieDurationFor(hop)`, which calls
// `buildPollinationPlan` with a SYNTHETIC `from` of the origin and a target
// one hop away, purely to ask how long that flight would take. That call is
// not a flight and must not read `posRef`: it is measuring a distance, and
// seeding it from wherever the bee happens to be would make the solved dwell
// depend on where he was standing when the anchors last changed.
//
// So the row now classifies by USE rather than by callee, which is the honest
// question anyway: A CALL THAT PRODUCES A PLAN MUST START WHERE THE BEE IS; A
// CALL WHOSE RESULT IS A NUMBER IS ASKING, NOT FLYING. A `buildPollinationPlan(…)`
// whose result is immediately member-accessed (`.durationMs`) is a
// measurement; anything else becomes a plan and is held to §28.4.
//
// **The Bee Doctrine took the measurement away, and the classifier stays.**
// The dwell solver was the only measurement call there has ever been, and the
// doctrine retired the dwell with the idle flight, so the expected count is
// now ZERO. The machinery is kept rather than simplified out for one reason:
// a measurement call reappearing is exactly the shape of the idle flight
// coming back — something asking "how long would that take" is something
// planning to go. The row fails on it either way, and it fails with a name.
{
  // Measurement calls, found first so the flight pass can exclude them by
  // POSITION rather than by name. A name-based exemption would be a door: any
  // future helper called `measureSomething` would walk through it.
  const measurements = new Set();
  walk(flyingBeeAst.program, (n) => {
    if (n.type !== 'MemberExpression') return;
    const o = n.object;
    if (o?.type === 'CallExpression' && ['buildPollinationPlan', 'buildReturnPlan'].includes(o.callee?.name)) {
      measurements.add(o.start);
    }
  });

  const froms = [];
  walk(flyingBeeAst.program, (n) => {
    if (n.type !== 'CallExpression') return;
    const callee = n.callee?.name;
    if (!['buildPollinationPlan', 'buildReturnPlan'].includes(callee)) return;
    if (measurements.has(n.start)) return;
    const arg = n.arguments[0];
    const prop = arg?.properties?.find((p) => p.key?.name === 'from');
    froms.push({ callee, src: prop ? flyingBeeSource.slice(prop.start, prop.end).replace(/\s+/g, ' ') : '(absent)' });
  });
  const bad0 = froms.filter((f) => !/posRef\.current/.test(f.src));
  // One flight-producing call site, and under the doctrine it is the only
  // flight there is: the pollination visit. Zero would mean the errand stopped
  // being built at all.
  if (froms.length === 1 && bad0.length === 0 && measurements.size === 0) {
    ok(`the plan-producing call takes waypoint 0 from the live position ref (§28.4 — the break costs no teleport; ${measurements.size} measurement calls, the dwell solver retired with the idle flight)`);
  } else {
    bad(
      'the plan-producing call takes waypoint 0 from the live position ref (§28.4 — the break costs no teleport)',
      froms.length !== 1
        ? `expected exactly one flight-producing call, found ${froms.length}: ${froms.map((f) => `${f.callee} from: ${f.src}`).join('; ')}`
        : measurements.size !== 0
          ? `expected no measurement calls — the dwell solver was the only one and the Bee Doctrine retired it — found ${measurements.size}. Something is asking how long a flight would take, which is what a bee about to go somewhere does.`
          : bad0.map((f) => `${f.callee} from: ${f.src}`).join('; '),
    );
  }
}

// --- F4. §28.4 / §32.2 — the return leg has no fixed destination -------
//
// THIS ROW REPLACES ITS OWN PREDECESSOR RATHER THAN RELAXING IT. What used to
// be here asserted that the return leg ends exactly on `PATH[0]`, and that
// `PATH` closes there, so `Animated.loop` resumed with no discontinuity. Both
// halves of that are now unsatisfiable BY CONSTRUCTION: there is no loop and
// no `PATH`. Keeping the old row and softening it would have left a green tick
// standing over a property that no longer exists.
//
// What survives is the invariant underneath it, which was never really about
// waypoint zero: A FLIGHT MUST HAND OFF TO THE NEXT BEAT, NEVER TO A FIXED
// POINT. The seam existed because the destination was fixed; delete the fixed
// destination and the seam has nothing to close. So the row asserts the
// deletion is total — that no home coordinate survives anywhere in the
// component, and that both the landing path and the abort path advance the
// machine instead of flying somewhere named.
{
  const banned = ['PATH', 'LOOP_MS', 'CRUISE', 'homePx', 'returnFromHere', 'buildReturnPlan'];
  const live = new Set();
  walk(flyingBeeAst.program, (n) => {
    if (n.type === 'Identifier' && banned.includes(n.name)) live.add(n.name);
  });
  // Identifiers, never a text search: every one of these names is discussed by
  // name in the comments that explain the deletion, and a grep would report
  // the explanation as the defect. R85, second outing: PROSE ABOUT A VARIABLE
  // IS NOT THE VARIABLE.
  // **Re-based by the Bee Doctrine, and the invariant is unchanged.** The
  // hand-off used to be `advance(` — choose the next beat and fly it. There is
  // no next beat now: an errand ends by RESTING where it finished, which is
  // still a hand-off to a state and still not a flight to a named point. So
  // the name the row counts moves and the sentence it enforces does not.
  const advances = [...flyingBeeSource.matchAll(/(?<![\w.])rest\(/g)].length;
  const clean = live.size === 0;
  // Three call sites: the completion callback (any landing, including a
  // pollination visit), the abort branch, and `start`'s opening placement.
  // `start` counted as a non-hand-off under the old machine because it opened
  // a sequence; under the doctrine it IS the resident state, so all three are
  // the same verb and the floor is the same three.
  const wired = advances >= 3;

  if (clean && wired) {
    ok(`the cruise has no fixed destination left (§32.2 — 0 of ${banned.length} loop identifiers survive, ${advances} hand-offs to rest)`);
  } else {
    bad(
      'the cruise has no fixed destination left (§32.2)',
      `${clean ? '' : `these loop identifiers are still live in FlyingBee: ${[...live].join(', ')}. ` +
        'A fallback lap survives on whichever screen forgets to declare anchors, which is the screen ' +
        'nobody looks at until Colin does. '}` +
        `${wired ? '' : `only ${advances} \`rest(\` call sites — the opening placement, the landing path and the ` +
          'abort path must all hand off to rest, or a flight ends with the bee mid-air and no state'}`,
    );
  }
}

// --- F4b. The trail is a property of the BEAT, so every beat must answer --
//
// **This row exists because the errand flew without its honey trail for a
// week and nothing caught it.** `52c5d5c` moved the trail off the component
// and onto the plan (`FlyingBee`: `if (plan && !plan.trail) return`). The
// sortie plan it was written against declared `trail: true`;
// `buildPollinationPlan` declared nothing — and `undefined` behaves exactly
// like a considered `false` while looking, in the source, like nothing at
// all. First seen on a screen 2026-08-25, in the acceptance capture.
//
// A MISSING FIELD CANNOT BE GREPPED FOR. Every search for `trail` returned
// the sites that HAD one, which is why "check the trail is wired" kept coming
// back green. The only instrument that finds an absence is one that
// enumerates the population first and asks each member the question.
//
// Membership is not a name list, and not an exemption list either. The rule
// is "every plan the component can RECEIVE must answer the question the
// component asks of it", so the set is derived from `FlyingBee`'s OWN import
// list: a builder it does not import cannot hand it a plan. That makes
// `buildReturnPlan` (retired with the idle flight, banned by name in the row
// above) out of scope for the right reason rather than by exception — and
// self-correcting, because the day anyone imports it, it joins the population
// and reds until it declares.
{
  const declaresTrail = [];
  const silentPlans = [];
  const outOfScope = [];

  const importedBuilders = new Set();
  walk(flyingBeeAst.program, (n) => {
    if (n.type !== 'ImportDeclaration') return;
    if (!/pollinationFlight|flightSequencer/.test(n.source?.value ?? '')) return;
    (n.specifiers ?? []).forEach((sp) => {
      if (sp.imported?.name) importedBuilders.add(sp.imported.name);
    });
  });

  for (const mod of [
    { name: 'pollinationFlight.js', src: flightSource },
    { name: 'flightSequencer.js', src: sequencerSource },
  ]) {
    const ast = parseJs(mod.src);
    // Owning builder, by POSITION rather than by matching a shape: every
    // builder in these modules is `export const buildX = (...) => ...`, and
    // the innermost declarator containing the literal is its owner whether
    // the body is an expression or a block with a `return`.
    const owners = [];
    walk(ast.program, (n) => {
      if (n.type !== 'VariableDeclarator') return;
      if (!n.id?.name || !/^(Arrow)?FunctionExpression$/.test(n.init?.type ?? '')) return;
      owners.push({ name: n.id.name, start: n.start, end: n.end });
    });
    walk(ast.program, (n) => {
      if (n.type !== 'ObjectExpression') return;
      const keys = n.properties.map((pr) => pr.key?.name).filter(Boolean);
      // A plan, structurally: it names a state and it names a route. Nothing
      // else in these modules carries both.
      if (!keys.includes('kind') || !keys.includes('path')) return;
      const owner =
        owners
          .filter((o) => o.start <= n.start && n.end <= o.end)
          .sort((a, b) => b.start - a.start)[0]?.name ?? '(anonymous)';
      const where = `${mod.name}:${owner}`;
      if (!importedBuilders.has(owner)) {
        outOfScope.push(where);
        return;
      }
      const prop = n.properties.find((pr) => pr.key?.name === 'trail');
      const v = prop?.value;
      // Boolean literal only. `trail: someFlag` is a third answer the
      // consumer's `!plan.trail` cannot be read against without running it,
      // and CANNOT TELL is a fail.
      if (v?.type === 'BooleanLiteral' || (v?.type === 'Literal' && typeof v.value === 'boolean')) {
        declaresTrail.push(`${where}=${v.value}`);
      } else {
        silentPlans.push(prop ? `${where} (not a boolean literal)` : where);
      }
    });
  }

  // Two plans reach the component today: the errand's visit and the
  // resident's rest. A floor of two, so the row cannot pass by finding
  // nothing — the failure that started this was an absence.
  if (silentPlans.length === 0 && declaresTrail.length >= 2) {
    ok(
      `every plan FlyingBee can receive declares \`trail\` as a boolean (${declaresTrail.join(', ')}; ` +
        `${outOfScope.length} builder(s) out of scope because FlyingBee does not import them: ${outOfScope.join(', ') || 'none'})`
    );
  } else {
    bad(
      'every plan FlyingBee can receive declares `trail` as a boolean',
      silentPlans.length
        ? `these plans leave \`trail\` undefined, which the consumer reads as "no trail" and a reader reads as "not decided yet": ${silentPlans.join(', ')}. ` +
          'This is the shape of the defect that flew the errand trail-less for a week.'
        : `expected at least 2 plans in scope, found ${declaresTrail.length} (${declaresTrail.join(', ') || 'none'}) — ` +
          'the population went empty, so the row was asserting nothing.'
    );
  }
}

// --- F4b2. The clearance table still IS the drawing -----------------------
//
// `MASCOT_CLEARANCE` is measured off `assets/mascot-{body,wing}.png`, and a
// measured constant's failure mode is that the thing it measured moves. This
// row re-derives it here, from the shipped bytes, through the SAME module
// `scripts/derive-mascot-clearance.mjs` runs — a re-derivation tool and a gate
// that disagree would be two answers wearing one name.
//
// It closes a gap that was named out loud before it was closed: when the table
// landed, the arithmetic on top of it was checkable and the measurement under
// it was not. `mascot.js`'s older figures still have that shape — they cite a
// script in `.scratch` — so this is the first of them that cannot silently
// drift from the render, and the pattern the others should follow.
{
  const derived = deriveClearanceBins({
    mascotSource,
    bodyPng: await readFile(path.join(ROOT, 'assets/mascot-body.png')),
    wingPng: await readFile(path.join(ROOT, 'assets/mascot-wing.png')),
  });
  const shipped = mascot.MASCOT_CLEARANCE;
  const drift = [];
  if (shipped.length !== derived.bins.length) {
    drift.push(`length ${shipped.length} vs ${derived.bins.length}`);
  } else {
    shipped.forEach((v, i) => {
      if (Math.abs(v - derived.bins[i]) > 1e-9) drift.push(`bin ${i} (${i * derived.binDeg}deg) ${v} vs ${derived.bins[i]}`);
    });
  }
  // 360 / binDeg is the only legal length, and it is checked rather than
  // assumed: a table that does not tile the circle leaves angles that read a
  // neighbour's clearance, which fails silently and in the unsafe direction.
  const tiles = shipped.length * mascot.CLEARANCE_BIN_DEG === 360;
  if (drift.length === 0 && tiles) {
    ok(
      `MASCOT_CLEARANCE re-derives from the shipped mascot assets (${shipped.length} bins of ${derived.binDeg}deg tiling the circle, ` +
        `reach ${Math.min(...shipped).toFixed(4)}..${Math.max(...shipped).toFixed(4)} of the character width)`
    );
  } else {
    bad(
      'MASCOT_CLEARANCE re-derives from the shipped mascot assets',
      [
        drift.length ? `${drift.length} bin(s) drifted from the render — the assets are the source: ${drift.slice(0, 4).join('; ')}. Re-run scripts/derive-mascot-clearance.mjs and paste.` : '',
        tiles ? '' : `${shipped.length} bins of ${mascot.CLEARANCE_BIN_DEG}deg do not tile 360 — some angles read a neighbour's clearance, or none.`,
      ].filter(Boolean).join(' | ')
    );
  }
}

// --- F4c. The puff clears the drawing, and stays on the face --------------
//
// §28.3, ruled 2026-08-25 after the beat was first put on a screen. The burst
// used ONE radius off the lattice step, so the ×0.72 alternation was doing two
// jobs — variety AND clearance — and the short flecks were, by arithmetic, the
// ones that failed: measured on device, the 48-degree fleck never left him.
//
// **The invariant is stated on the currency a viewer has, not on position.**
// The first form of this rule bound each fleck's TERMINAL position, which is
// the frame its opacity reaches zero — satisfiable by a fleck nobody ever sees
// outside him. What ships: every fleck is clear of the DRAWN silhouette while
// at least half its seed opacity remains.
//
// That instant is exactly u = 0.5 and the row does not have to evaluate a
// bezier to know it. Opacity runs `Animated.timing`'s default easing,
// `Easing.inOut(Easing.ease)` (`TimingAnimation.js:77`), and `inOut(f)(0.5)`
// is `1 - f(1)/2`; `f(1) = 1` is what makes `f` an easing, so the half-opacity
// instant is 0.5 for ANY inOut curve. The two curves that DO matter are named
// and evaluated: drift is `Easing.out(Easing.cubic)` (0.875 at u = 0.5) and
// the dot's own radius shrinks on the same default inOut (0.65 of 3pt).
//
// R81's rule, one beat over: SAMPLE THE FUNCTION, NOT THE FLIGHT. The live
// beat emits six flecks at one size; this sweeps every size the bee is drawn
// at and every count the pool can produce, because the failure was a property
// of the fan's arithmetic and not of one call.
{
  const DRIFT_AT_HALF = 1 - (1 - 0.5) ** 3;      // Easing.out(cubic) at u = 0.5
  // The dot is a FIXED 6pt at every bee size (`TRAIL_DOT_SIZE`), so its radius
  // at the half-opacity instant is a constant number of points while the
  // clearance and the gap both scale with the character. That asymmetry is
  // real and it decides the domain of this row: the arithmetic holds above a
  // break-even size and cannot below it, so the row derives that size, reports
  // it, and sweeps from the smallest size the burst can actually occur at.
  const dotSize = Number(flyingBeeSource.match(/const TRAIL_DOT_SIZE = ([\d.]+);/)?.[1]);
  const DOT_R_AT_HALF = (dotSize / 2) * (1 - 0.7 * 0.5);
  const defaultSize = Number(flyingBeeSource.match(/const DEFAULT_SIZE = ([\d.]+);/)?.[1]);
  // Every mount that can burst, and what size it draws at. `size` is a prop
  // with a default, so a mount that passes `pollinate` and does NOT pass
  // `size` bursts at `DEFAULT_SIZE`; one that passes both would widen this
  // row's domain, which is why the domain is read rather than assumed.
  const bursting = [...(await readdir(path.join(ROOT, 'src/screens')))]
    .filter((f) => f.endsWith('.js'))
    .map((f) => ({ f, src: '' }));
  for (const m of bursting) m.src = await readFile(path.join(ROOT, 'src/screens', m.f), 'utf8');
  const overrides = [];
  for (const { f, src } of bursting) {
    for (const tag of src.matchAll(/<FlyingBee\b([\s\S]*?)\/>/g)) {
      if (!/\bpollinate[\s=]/.test(tag[1])) continue;
      const sizeProp = tag[1].match(/\bsize\s*=\s*\{([^}]*)\}/);
      if (sizeProp) overrides.push(`${f}: size={${sizeProp[1].trim()}}`);
    }
  }
  const SIZES = [defaultSize, 48, 60, 88, 132];
  const COUNTS = [1, 2, 3, 4, 5, 6, 8, 11];
  const bins = mascot.MASCOT_CLEARANCE;
  const binDeg = mascot.CLEARANCE_BIN_DEG;

  // Break-even: the smallest size at which every fleck still clears. Reported
  // rather than asserted — the assertion is about the sizes that ship, and the
  // number is what tells a later reader how much room the beat has.
  const clearsAt = (size) => {
    const widthPx = mascot.MASCOT_WIDTH_FRACTION * size;
    const clearanceFor = flight.clearanceLookup(bins, binDeg, widthPx);
    return flight.pollenFlecks(11, clearanceFor, flight.POLLEN_GAP_FRACTION * widthPx).every((f) => {
      const r = Math.hypot(f.dx, f.dy);
      return r * DRIFT_AT_HALF - DOT_R_AT_HALF >= clearanceFor(Math.atan2(f.dy, f.dx));
    });
  };
  let lo = 1;
  let hi = 400;
  for (let k = 0; k < 60; k += 1) {
    const mid = (lo + hi) / 2;
    if (clearsAt(mid)) hi = mid;
    else lo = mid;
  }
  const breakEven = hi;

  const buried = [];
  const offFace = [];
  let sampled = 0;
  let tightestFloor = Infinity;
  let tightestCeiling = Infinity;
  for (const size of SIZES) {
    const widthPx = mascot.MASCOT_WIDTH_FRACTION * size;
    const clearanceFor = flight.clearanceLookup(bins, binDeg, widthPx);
    // The bee is drawn at the comb's own cell size at the live call site, so
    // the apothem the burst must stay inside is this size's own.
    const apothem = lattice.ringStepFor(size) / 2;
    for (const count of COUNTS) {
      for (const fleck of flight.pollenFlecks(count, clearanceFor, flight.POLLEN_GAP_FRACTION * widthPx)) {
        sampled += 1;
        const r = Math.hypot(fleck.dx, fleck.dy);
        const reach = clearanceFor(Math.atan2(fleck.dy, fleck.dx));
        const nearEdgeAtHalf = r * DRIFT_AT_HALF - DOT_R_AT_HALF;
        const floorMargin = nearEdgeAtHalf - reach;
        const ceilingMargin = apothem - r;
        tightestFloor = Math.min(tightestFloor, floorMargin);
        tightestCeiling = Math.min(tightestCeiling, ceilingMargin);
        if (floorMargin < 0) buried.push(`size ${size} count ${count} @${((Math.atan2(fleck.dy, fleck.dx) * 180) / Math.PI).toFixed(0)}deg: near edge ${nearEdgeAtHalf.toFixed(3)} vs reach ${reach.toFixed(3)}`);
        if (ceilingMargin < 0) offFace.push(`size ${size} count ${count}: r ${r.toFixed(3)} vs apothem ${apothem.toFixed(3)}`);
      }
    }
  }
  // The row asserts the REALIZED product per fleck, never the provenance of
  // the constants it came from: a constant can be re-derived, re-named or
  // re-based and this still answers the only question the design asked.
  if (buried.length === 0 && offFace.length === 0 && sampled > 0 && overrides.length === 0 && Number.isFinite(defaultSize)) {
    ok(
      `every pollen fleck clears the drawn silhouette while half its opacity remains, and none leaves the face ` +
        `(§28.3 — ${sampled} flecks over ${SIZES.length} sizes x ${COUNTS.length} counts; tightest clearance ${tightestFloor.toFixed(3)}pt, tightest apothem margin ${tightestCeiling.toFixed(3)}pt; ` +
        `the fixed ${dotSize}pt particle puts the break-even at size ${breakEven.toFixed(1)} and the beat runs at ${defaultSize})`
    );
  } else {
    bad(
      'every pollen fleck clears the drawn silhouette while half its opacity remains, and none leaves the face (§28.3)',
      [
        buried.length ? `${buried.length} fleck(s) still inside the drawing at half opacity — this is the defect the ruling was written about: ${buried.slice(0, 4).join('; ')}` : '',
        offFace.length ? `${offFace.length} fleck(s) land off the face they were meant to decorate: ${offFace.slice(0, 4).join('; ')}` : '',
        overrides.length ? `a bursting mount overrides \`size\`, so this row's swept domain is no longer the domain the beat runs in — break-even is size ${breakEven.toFixed(1)}: ${overrides.join('; ')}` : '',
        Number.isFinite(defaultSize) ? '' : 'DEFAULT_SIZE could not be read, so the sweep had no floor',
        sampled === 0 ? 'nothing was sampled, so the row asserted nothing' : '',
      ].filter(Boolean).join(' | ')
    );
  }
}

// --- F4d. The seam this gate cannot cross, asserted by source --------------
//
// `clearanceLookup` and `pollenFlecks` live in an import-free module so the
// row above can SAMPLE them. `FlyingBee` cannot be loaded here — it is JSX —
// so the one thing left unchecked is whether the call site feeds them the
// real table. A gate asserts a property of whatever it can import, and the
// bug lives at the call site it couldn't; this row is that call site, checked
// the only way available, and it says so rather than looking like the row
// above.
{
  const call = flyingBeeSource.match(/pollenFlecks\(([\s\S]{0,260}?)\)\.forEach/);
  const args = call ? call[1].replace(/\s+/g, ' ').trim() : '(no pollenFlecks call)';
  const feedsTable = /clearanceLookup\(\s*MASCOT_CLEARANCE\s*,\s*CLEARANCE_BIN_DEG\s*,/.test(args);
  const feedsGap = /POLLEN_GAP_FRACTION\s*\*/.test(args);
  // The width both terms are scaled by must be the SAME expression, or the
  // clearance and the gap are measured against two different bees.
  const widths = [...args.matchAll(/(?:CLEARANCE_BIN_DEG,\s*|POLLEN_GAP_FRACTION\s*\*\s*)([A-Za-z_$][\w$]*)/g)].map((m) => m[1]);
  const oneWidth = widths.length === 2 && widths[0] === widths[1];
  if (feedsTable && feedsGap && oneWidth) {
    ok(`FlyingBee feeds the burst the real clearance table and the gap, both scaled by the same width (\`${widths[0]}\`)`);
  } else {
    bad(
      'FlyingBee feeds the burst the real clearance table and the gap, both scaled by the same width',
      `read: ${args}. ` +
        `${feedsTable ? '' : 'The clearance is not `clearanceLookup(MASCOT_CLEARANCE, CLEARANCE_BIN_DEG, ...)`, so the sampled row above is asserting a fan the app does not emit. '}` +
        `${feedsGap ? '' : 'The gap is not derived from POLLEN_GAP_FRACTION. '}` +
        `${oneWidth ? '' : `The two terms are scaled by ${widths.length === 2 ? `different widths (${widths.join(' vs ')})` : 'widths this row could not read'} — clearance and gap must measure the same bee.`}`
    );
  }
}

// --- F4e. The particle is centred on the point it is placed at -------------
//
// `styles.trailDot` was a 6pt absolute box with no `left`/`top`, so
// `translate(pos)` put its TOP-LEFT on the emission point and its centre half
// a diameter down and right of it. `burstPollen` computes the character's
// centre carefully and this quietly took it back off — 3pt of bias against
// clearances the ruling measures in single points, and the same bias on every
// trail drop. It is asserted rather than commented because the defect is the
// ABSENCE of two properties, which no reader notices and no grep finds.
{
  const decl = flyingBeeSource.match(/trailDot:\s*\{([\s\S]*?)\}/);
  const body = decl ? decl[1] : '';
  const read = (k) => {
    const m = body.match(new RegExp(`${k}:\\s*([^,]+),`));
    if (!m) return null;
    try {
      // eslint-disable-next-line no-new-func
      return Function(`"use strict"; const TRAIL_DOT_SIZE = ${flyingBeeSource.match(/const TRAIL_DOT_SIZE = ([\d.]+);/)?.[1] ?? NaN}; return (${m[1]});`)();
    } catch {
      return null;
    }
  };
  const w = read('width');
  const h = read('height');
  const l = read('left');
  const t = read('top');
  const centred = w !== null && h !== null && l !== null && t !== null && Math.abs(l + w / 2) < 1e-9 && Math.abs(t + h / 2) < 1e-9;
  if (centred) {
    ok(`the pollen/trail particle is centred on the point it is placed at (${w}pt box, left/top ${l}/${t})`);
  } else {
    bad(
      'the pollen/trail particle is centred on the point it is placed at',
      `read width ${w}, height ${h}, left ${l}, top ${t}. An absolute child with no insets sits at the container origin, so the dot's CENTRE lands half a diameter down and right of every point the code places it at — silently, on the burst and on every trail drop.`
    );
  }
}

// --- F5. §28.7 row 5 — the approach is distance/speed, with no clamp -----
//
// THE ROW THIS GATE EXISTS FOR, and it is R81's lesson applied one beat
// later. A clamp was drafted; sweeping the loop killed it, because sampled
// uniformly in wall time the departure distance runs 41 -> 417px, so any
// clamp pair binds on a large fraction of taps — a guard that fires most of
// the time is the mechanism wearing a guard's name.
//
// Four live waypoints cannot see that. A domain sweep can: a clamp is a flat
// region, a floor is a flat region, and a piecewise "speed up when far" is a
// second-difference spike. All three die on the same rows.
{
  const speed = 375.18;
  const samples = [];
  for (let d = 0; d <= 900; d += 0.25) samples.push({ d, ms: flight.approachDurationMs(d, speed) });

  const flats = samples.filter((s, i) => i > 0 && Math.abs(s.ms - samples[i - 1].ms) < 1e-12 && s.d > 0);
  if (flats.length === 0) {
    ok(`approachDurationMs is strictly monotonic over distance 0..900px (${samples.length} samples, no flat region)`);
  } else {
    bad(
      `approachDurationMs is strictly monotonic over distance 0..900px (${samples.length} samples, no flat region)`,
      `${flats.length} flat steps, first at ${flats[0].d}px. A flat region is a clamp, a floor or a ceiling — ` +
        'at which point the bee no longer moves at one speed and §28.5\'s p05/p50/p95 describe nothing.',
    );
  }

  let worstBend = 0;
  let bendAt = 0;
  for (let i = 1; i < samples.length - 1; i += 1) {
    const bend = Math.abs(samples[i + 1].ms - 2 * samples[i].ms + samples[i - 1].ms);
    if (bend > worstBend) { worstBend = bend; bendAt = samples[i].d; }
  }
  if (worstBend < 1e-9) {
    ok(`approachDurationMs is linear in distance (worst second difference ${worstBend.toExponential(1)}ms) — one speed, by construction`);
  } else {
    bad(
      'approachDurationMs is linear in distance — one speed, by construction',
      `second difference ${worstBend.toExponential(2)}ms at ${bendAt}px. A bend means the speed changes with ` +
        'distance, which is a clamp or an ease-by-length wearing a division.',
    );
  }
}

// --- F5b. §28.11 / C′ — the staging point is on the face he came to -------
//
// R87's defect, and the row that would have caught it. The staging point was
// ONE RING STEP above the cell, and a ring step is the lattice's own pitch,
// so "one step above the cell" IS "the seat above it": four of seven seats
// staged on another member's face, and the approach eases out into the phase
// split, so the one moment the bee is stationary in the whole beat happened
// over the wrong person.
//
// The assertion is not "the offset is 30.07". It is **run the comb's own
// hit-test on the staging point of every seat and get that seat's own member
// back** — the same forward/backward pair F8 uses for the abort. A number can
// be re-picked; this cannot be satisfied by picking one.
//
// And the point it hit-tests is read back out of a REAL PLAN, not recomputed
// from `stagingOffsetFor`. A first draft did recompute it, and mutation 1 —
// revert `buildPollinationPlan` to `target.y - ringStep`, the exact R87
// defect — left this row GREEN, because a row that calls the offset function
// itself is true of the offset function whatever the plan does with it. R85,
// the same hole this gate has now grown twice: **a gate asserts a property of
// whatever it can import, and the defect lives at the call site it couldn't.**
// `buildPollinationPlan` is importable, so the call site is reachable, so the
// row has no excuse for asserting one step short of it.
//
// Second half of the row: the DESCENT leg is that offset. `DESCENT_MS` is the
// duration of a distance, and §28.5 quotes a speed — if the plan's last leg
// and `stagingOffsetFor` ever disagree, that published speed is fiction.
{
  const CELL = CELL_SIZE;
  const FRACTION = mascot.MASCOT_WIDTH_FRACTION;
  const BODY = FRACTION * BEE_SIZE;
  const person = (n) => ({ authorId: `person-${n}`, id: `share-${n}`, name: `P${n}` });
  const members = Array.from({ length: 7 }, (_, i) => person(i));
  const layout = lattice.buildCombLayout(members, CELL, lattice.hexSpiral(1));
  const offset = flight.stagingOffsetFor({ bodyLengthPx: BODY, ringStep: lattice.ringStepFor(CELL) });

  if (!(FRACTION > 0) || !(BEE_SIZE > 0) || !(CELL > 0)) {
    bad(
      'every seat stages inside its own hexagon',
      `cannot tell: MASCOT_WIDTH_FRACTION=${FRACTION}, beeSize=${BEE_SIZE}, cellSize=${CELL}. One of the ` +
        'three inputs did not resolve, so this row has no fixture — not a clean pass.',
    );
  } else {
    // One plan per seat, flown in the cluster's own box so the plan's
    // fractions invert back to the coordinates the hit-test speaks.
    const planFor = (centre) =>
      flight.buildPollinationPlan({
        from: { x: 0, y: 0 },
        target: centre,
        ringStep: lattice.ringStepFor(CELL),
        bodyLengthPx: BODY,
        width: layout.width,
        height: layout.height,
        approachSpeedPxS: 375.18,
        easeApproach: (w) => w,
        easeDescent: (w) => w,
      });

    const strays = [];
    for (const cell of layout.cells) {
      // Cell centres sit at (x + cellSize, y + cellSize) in cluster space.
      const centre = { x: cell.x + CELL, y: cell.y + CELL };
      // R-LF-1 — `path` is no longer a fixed 3-waypoint shape (it is
      // resampled adaptively), so `staging` is read off the plan's own
      // named field rather than assumed at `path[1]`.
      const wp = planFor(centre).staging;
      const staging = { x: wp.x * layout.width, y: wp.y * layout.height };
      const hit = layout.hitTest(staging.x, staging.y);
      const who = lattice.personKey(hit?.member) ?? 'off-comb';
      // State what the plan did, never why. A message that names a cause
      // invents one: the first draft's read "the offset crosses the apothem",
      // which is false under the mutation that matters — there the offset is
      // fine and the PLAN is not using it.
      if (who !== lattice.personKey(cell.member)) {
        strays.push(`${cell.member.name} stages ${Math.hypot(staging.x - centre.x, staging.y - centre.y).toFixed(2)}pt away, on ${who}`);
      }
    }
    if (strays.length === 0) {
      ok(`every seat stages inside its own hexagon (${layout.cells.length}/${layout.cells.length}; offset ${offset.toFixed(2)}pt against an apothem of ${(lattice.ringStepFor(CELL) / 2).toFixed(3)}pt)`);
    } else {
      bad(
        'every seat stages inside its own hexagon',
        `${strays.length} of ${layout.cells.length} do not: ${strays.join('; ')}. stagingOffsetFor says ` +
          `${offset.toFixed(2)}pt against an apothem of ${(lattice.ringStepFor(CELL) / 2).toFixed(3)}pt. ` +
          "The bee's one stationary moment is spent hovering over somebody the user did not tap.",
      );
    }

    // R-LF-7 amended this row a second time, and it stops being a BOUND.
    // Under the fillet the descent's flown length had no closed form — a
    // quadratic Bezier's arc length doesn't — so this row could only assert a
    // derived CEILING (`offset x (1 + 2 x FILLET_LEG_FRACTION)`) and hope the
    // real figure sat under it. The turn has one: the descent is the arc
    // `T` -> `staging` plus the drop `staging` -> `target`, so
    //
    //     descent = R x sweep + offset            exactly
    //
    // and the only slack is the polyline's own. `adaptiveCurveSamples` cuts
    // when the sagitta of a sub-span is under `MAX_CHORD_DEVIATION_PX`, and a
    // chord always runs SHORT of the arc it spans, never long — so the flown
    // figure is bounded ABOVE by the identity and below by it minus the
    // sampler's shortfall. That shortfall is derived here rather than
    // tolerated: sagitta `R(1 - cos x) <= d` with `x` the half-angle of one
    // emitted segment gives `x <= acos(1 - d/R)`, and a chord subtends
    // `sin(x)/x` of its arc, so the whole descent can fall short by at most
    // `R x sweep x (1 - sin x / x)`.
    //
    // Which is why the row is worth keeping rather than deleting: it is now
    // the only place the published `plan.turn` scalars are checked AGAINST the
    // path they claim to describe. A `turn` block that drifted from the
    // geometry — a radius reported before the fixed point converged, a sweep
    // read off the wrong branch — reds here and nowhere else.
    const plan = planFor({ x: layout.width / 2, y: layout.height / 2 });
    let descentPx = 0;
    for (let i = plan.descentStartIndex + 1; i < plan.path.length; i += 1) {
      descentPx += Math.hypot(
        (plan.path[i].x - plan.path[i - 1].x) * layout.width,
        (plan.path[i].y - plan.path[i - 1].y) * layout.height,
      );
    }
    const R = plan.turn ? plan.turn.radiusPx : 0;
    const sweep = plan.turn ? plan.turn.sweepRad : 0;
    const identity = R * sweep + offset;
    const halfAngle = sweep > 0 && R > 0
      ? Math.acos(Math.max(-1, 1 - flight.MAX_CHORD_DEVIATION_PX / R))
      : 0;
    const shortfall = halfAngle > 0
      ? R * sweep * (1 - Math.sin(halfAngle) / halfAngle)
      : 0;
    if (descentPx <= identity + 1e-6 && descentPx >= identity - shortfall - 1e-6) {
      ok(
        `the descent is the arc plus the drop, as an IDENTITY: R x sweep + offset = ${R.toFixed(4)} x ${((sweep * 180) / Math.PI).toFixed(4)}deg + ${offset.toFixed(4)} = ${identity.toFixed(4)}pt, flown ${descentPx.toFixed(4)}pt ` +
        `(short by ${(identity - descentPx).toExponential(2)}pt against the sampler's own derived floor of ${shortfall.toExponential(2)}pt) in ${plan.descentMs}ms = ${((descentPx / plan.descentMs) * 1000).toFixed(1)} px/s average`,
      );
    } else {
      bad(
        'the descent is the arc plus the drop, as an identity',
        `flown ${descentPx.toFixed(4)}pt against R x sweep + offset = ${identity.toFixed(4)}pt (R ${R.toFixed(4)}, sweep ${((sweep * 180) / Math.PI).toFixed(4)}deg, offset ${offset.toFixed(4)}), ` +
          `outside [${(identity - shortfall).toFixed(4)}, ${identity.toFixed(4)}]. Either the published turn scalars disagree with the path built from them, or the descent no longer covers the drop it is supposed to.`,
      );
    }
  }
}

// --- F5c. §28.11 / C′ — the bound holds for every pair, not just ours -----
//
// `beeSize` and `cellSize` are independent props on two different components.
// Nothing structural relates them — unlike R81's bank, where |pitch| ≤ 90 out
// of `atan2` made the ±22° bound true by construction with no clamp to route
// around. Here the guarantee has to be IN the function, and the only way to
// know it is is to sweep the two axes independently: a fixture at 44/44 says
// nothing about 44/16, which is the pair a denser comb would produce.
//
// Strictly less than the apothem, and strictly greater than zero. Zero is the
// other failure: an offset of 0 puts the staging point ON the cell centre, at
// which point there is no descent, no landing gesture, and §28.4's "the final
// leg is always a descent whatever direction he came from" is false.
{
  const FRACTION = mascot.MASCOT_WIDTH_FRACTION;
  const violations = [];
  const samples = [];
  for (let bee = 8; bee <= 200; bee += 2) {
    for (let cell = 12; cell <= 120; cell += 1) {
      const ringStep = lattice.ringStepFor(cell);
      const apothem = ringStep / 2;
      const off = flight.stagingOffsetFor({ bodyLengthPx: FRACTION * bee, ringStep });
      samples.push(1);
      if (!(off > 0) || !(off < apothem)) violations.push({ bee, cell, off, apothem });
    }
  }
  if (violations.length === 0) {
    ok(`stagingOffsetFor stays inside the target's own hexagon for every beeSize x cellSize pair (${samples.length} samples, bee 8..200 x cell 12..120, both swept independently)`);
  } else {
    const w = violations[0];
    bad(
      "stagingOffsetFor stays inside the target's own hexagon for every beeSize x cellSize pair",
      `${violations.length} of ${samples.length} pairs escape it, first at beeSize ${w.bee} / cellSize ${w.cell}: ` +
        `offset ${w.off.toFixed(3)}pt against an apothem of ${w.apothem.toFixed(3)}pt. At or past the apothem the ` +
        'staging point is in the seat above, which is R87\'s defect with different numbers in it.',
    );
  }
}

// --- F5d. §28.11 / C′ — the bound is a backstop, and stays one -----------
//
// The `min` in `stagingOffsetFor` is exactly the shape §28.5 killed on the
// approach: a guard that binds most of the time is the mechanism wearing a
// guard's name. It is legitimate here only because at the shipped pair the
// NOUN decides — he hangs his own length above the face, and the bound is
// inert. That is a property a retune can quietly destroy: raise `beeSize`
// past 1.141 x `cellSize` and the bee stops hanging a body length above
// anything, without a single line of this file changing.
//
// So the row asserts both directions. Inert where we ship (or F5c is passing
// because the clamp swallowed the design), and LIVE somewhere (or the clamp
// is dead code and F5c is passing for free).
{
  const FRACTION = mascot.MASCOT_WIDTH_FRACTION;
  const body = FRACTION * BEE_SIZE;
  const shipped = flight.stagingOffsetFor({ bodyLengthPx: body, ringStep: lattice.ringStepFor(CELL_SIZE) });
  if (Math.abs(shipped - body) < 1e-9) {
    ok(`the staging offset is the bee's own length at the shipped pair (beeSize ${BEE_SIZE} / cellSize ${CELL_SIZE} -> ${shipped.toFixed(2)}pt, the bound inert at ${((flight.STAGING_SAFETY * lattice.ringStepFor(CELL_SIZE)) / 2).toFixed(2)}pt)`);
  } else {
    bad(
      "the staging offset is the bee's own length at the shipped pair",
      `stagingOffsetFor returns ${shipped.toFixed(3)}pt where the drawn character is ${body.toFixed(3)}pt long. ` +
        'The bound is binding at the configuration we ship, so the comb is choosing the offset and the bee is ' +
        'not hanging its own length above anything — F5c would still be green.',
    );
  }
  // The clamp must be reachable, or F5c proves nothing about it.
  const tight = flight.stagingOffsetFor({ bodyLengthPx: FRACTION * 200, ringStep: lattice.ringStepFor(12) });
  if (tight < FRACTION * 200 - 1e-9) {
    ok(`the bound is live where a bee is large against its comb (beeSize 200 / cellSize 12 -> ${tight.toFixed(2)}pt, not ${(FRACTION * 200).toFixed(2)})`);
  } else {
    bad(
      'the bound is live where a bee is large against its comb',
      `beeSize 200 on cellSize 12 returns ${tight.toFixed(3)}pt, the full body length. Nothing bounds the offset, ` +
        'so F5c is green on the shipped ratio rather than on a guarantee.',
    );
  }
}

// --- F5e. §28.11 / C′ — the length the call site passes is the bee's ------
//
// R85(e), the hole a mutation found in this gate's own return-leg row: **a
// gate asserts a property of whatever it can import, and the defect lives at
// the call site it couldn't.** F5b/c/d sample `stagingOffsetFor`, which is
// true of any `bodyLengthPx` it is handed — including `size`, the BOX, which
// is 44 against a bound of 34.29 and would put the staging point back in the
// seat above with every row above it still green.
//
// So this reads the argument at the call site and requires it to resolve to
// the drawn character: the mascot's width fraction times the bee's own size
// prop. Order-insensitive, because `size * MASCOT_WIDTH_FRACTION` is the same
// length.
{
  const NAME = 'the call site passes the DRAWN length, not the box';
  let call = null;
  walk(flyingBeeAst, (n) => {
    if (n.type !== 'CallExpression' || n.callee?.name !== 'buildPollinationPlan') return;
    call = n;
  });
  const arg = call?.arguments?.[0]?.properties?.find((p) => p.key?.name === 'bodyLengthPx');
  if (!arg) {
    bad(
      NAME,
      call
        ? 'buildPollinationPlan is called without a `bodyLengthPx` property, so the staging offset falls to ' +
          '`Math.min(undefined, bound)` = NaN and the plan has no waypoint 1.'
        : 'no buildPollinationPlan call site found in FlyingBee.js — this row could not locate what it checks, ' +
          'which is a fail, not a pass.',
    );
  } else {
    const v = arg.value;
    const names = v?.type === 'BinaryExpression' && v.operator === '*'
      ? [v.left, v.right].map((s) => (s.type === 'Identifier' ? s.name : `<${s.type}>`))
      : [v?.type === 'Identifier' ? v.name : `<${v?.type}>`];
    const wanted = ['MASCOT_WIDTH_FRACTION', 'size'];
    if (wanted.every((w) => names.includes(w))) {
      ok(`${NAME} (bodyLengthPx: ${names.join(' * ')})`);
    } else {
      bad(
        NAME,
        `bodyLengthPx resolves to \`${names.join(' * ')}\`; expected the product of ${wanted.join(' and ')}. ` +
          `\`size\` alone is the BOX (${BEE_SIZE}pt against an apothem of ${(lattice.ringStepFor(CELL_SIZE) / 2).toFixed(2)}pt), ` +
          'which is R87\'s defect arriving through the argument instead of through the constant.',
      );
    }
  }
}

// --- F6. §28.5 / §32.1 — the approach speed is a RATIO, and the reference
//     it is a ratio OF is derived
//
// The published 375 px/s is a consequence of a 393x852 box, not a design
// decision. What reads as "he broke off to come here" is that he is moving
// faster than he was a moment ago, so the ratified quantity is the ratio.
//
// The reference used to be `cruiseSpeedPxS(PATH, …, LOOP_MS)` and `PATH` is
// deleted (§32.2). That is exactly the moment a chain like this quietly turns
// into a typed constant, so the row is kept and re-based rather than dropped:
// `referenceSpeedPxS` must still produce the same 187.59 px/s at 393x852 that
// every §28.5 figure — including `DESCENT_MS`'s justification — was written
// against. It does, to 0.06%, because it is the same fractional path resolved
// against the same box, restated per diagonal.
//
// **What this row lost when the idle flight retired, stated rather than
// quietly dropped.** It used to pin BOTH halves of §28.5's contrast: the
// approach against the dart, `referenceSpeedPxS x DART_SPEED_RATIO`. There is
// no dart now — the Bee Doctrine retired the idle sortie, and `DART_SPEED_RATIO`
// went with it — so the contrast has only one side left in code. That does not
// weaken §28.5's argument, because the thing the approach must be faster than
// is the pace the bee was already flying, and a resting bee's pace is zero:
// the contrast is now satisfied by construction rather than by a ratio. What
// remains checkable, and is checked, is that the approach is a RATIO of a
// DERIVED reference rather than a typed constant.
{
  const rows = DEVICES.map((d) => {
    const reference = sequencer.referenceSpeedPxS(d.width, d.height);
    return {
      d,
      reference,
      approach: reference * flight.APPROACH_SPEED_RATIO,
    };
  });
  const offBy = rows.filter(
    (r) => Math.abs(r.approach / r.reference - flight.APPROACH_SPEED_RATIO) > 1e-12,
  );
  const shipped = rows.find((r) => r.d.width === 393);
  // 0.1 px/s, i.e. the 0.06% the swap was ratified on. A tighter bound would
  // fail on the restatement itself rather than on a regression.
  const referenceOk = Math.abs(shipped.reference - 187.59) < 0.15;
  // The contrast §28.5 is actually about: the approach must be faster than the
  // pace he was already flying, or "he broke off" has nothing to read off.
  // The bee an errand breaks off from is at rest, so the pace to beat is 0.
  // Stated as a comparison rather than assumed, because the day something
  // gives the idle bee a speed again is the day this has to be re-based.
  const RESTING_SPEED_RATIO = 0;
  const contrasts = flight.APPROACH_SPEED_RATIO > RESTING_SPEED_RATIO;
  if (offBy.length === 0 && referenceOk && contrasts) {
    ok(
      `approach = ${flight.APPROACH_SPEED_RATIO}x the reference speed on all ${rows.length} device boxes ` +
        `(reference ${shipped.reference.toFixed(2)} px/s at 393x852 vs the published 187.59, so approach ${shipped.approach.toFixed(2)})`,
    );
  } else {
    bad(
      'the approach speed is a ratio of the derived reference on all device boxes',
      `${referenceOk ? '' : `reference at 393x852 is ${shipped.reference.toFixed(2)} px/s, not the published 187.59 — ` +
        'CRUISE_DIAG_PER_S moved and §28.5 did not. '}` +
        `${contrasts ? '' : `approach ratio ${flight.APPROACH_SPEED_RATIO} is not above the resting bee's ${RESTING_SPEED_RATIO}; ` +
          'the break-off is specified as a speed contrast and there is no contrast left. '}` +
        `${offBy.length === 0 ? '' : offBy.map((r) => r.d.label).join(', ')}`,
    );
  }
}

// --- F7. §28.7 row 6 — the pollen count is derived, not chosen -----------
//
// Six flecks is `pool 12 − ceil(750/160) live trail particles − 1 slack`. A
// literal 6 would silently start overrunning the pool the moment the cap
// drops or the cadence speeds up, and the hard cap is §12.5 Rule 3's answer
// to the #1 low-end perf risk in this app. So the row asserts that the
// number MOVES when its inputs do, not that it currently equals six.
{
  const shipped = flight.pollenCountFor({ poolSize: 12, trailFadeMs: 750, trailIntervalMs: 160 });
  const responses = [
    { label: 'a bigger pool', args: { poolSize: 20, trailFadeMs: 750, trailIntervalMs: 160 } },
    { label: 'a faster trail cadence', args: { poolSize: 12, trailFadeMs: 750, trailIntervalMs: 80 } },
    { label: 'a longer particle life', args: { poolSize: 12, trailFadeMs: 1500, trailIntervalMs: 160 } },
  ].map((c) => ({ ...c, got: flight.pollenCountFor(c.args) }));
  const deaf = responses.filter((r) => r.got === shipped);
  // And the call site must hand it the real inputs, not numbers that happen
  // to match them today.
  const callSite = flyingBeeSource.match(/pollenCountFor\(\{[^}]*\}\)/s)?.[0] ?? '';
  const literals = /:\s*\d/.test(callSite);
  if (shipped === 6 && deaf.length === 0 && !literals && /MAX_TRAIL_PARTICLES/.test(callSite) && /DURATIONS\.trailFade/.test(callSite) && /TRAIL_INTERVAL_MS/.test(callSite)) {
    ok(`pollen count is derived from the pool: 6 today, and it moves under all ${responses.length} input changes (${responses.map((r) => `${r.label} -> ${r.got}`).join(', ')})`);
  } else {
    bad(
      'pollen count is derived from the pool, not literal',
      literals
        ? `pollenCountFor is called with numeric literals: ${callSite.replace(/\s+/g, ' ')}`
        : deaf.length
          ? `${deaf.map((r) => r.label).join(', ')} did not move the count off ${shipped}`
          : `expected 6 at the shipped numbers, got ${shipped}`,
    );
  }
}

// --- F8. §28.9 rows 7 + 8 — the abort predicate --------------------------
//
// §28.9, ratified: **abort when the point the bee is aimed at would no
// longer resolve, under the comb's OWN hit-test, to the PERSON the user
// tapped.** Two corrections got it to that sentence, and both were the same
// mistake — the English was right and the field was wrong:
//
//   correction 1: keyed on SEAT. Re-seating does not move the seat; the
//     lattice is fixed. It moves who is sitting in it, so a seat-keyed check
//     passes while the bee alights on the right hexagon holding the wrong
//     person — the failure the condition exists to catch, passing it.
//   correction 2: keyed on `member.id`, which is a SHARE. The user tapped a
//     face, not a post.
//
// So the fixtures below are not examples of the rule, they ARE the rule.
// **The fixture is what pins the noun.** Fixture 2 goes green only under
// author-keying; fixture 1 goes red under correction 1's predicate; the
// sweep is what stops "abort when it drifts" from being pinned by the two
// or three offsets a fixture happens to use.
{
  const CELL = CELL_SIZE;
  const person = (n) => ({ authorId: `person-${n}`, id: `share-${n}-a`, name: `P${n}` });
  const members = Array.from({ length: 7 }, (_, i) => person(i));
  const layoutOf = (list) => lattice.buildCombLayout(list, CELL, lattice.hexSpiral(1));
  const base = layoutOf(members);
  // Aim at the centre seat: it is the only one with a neighbour on every
  // side, so a vertical sweep crosses a real boundary rather than falling
  // off the cluster.
  const centre = base.cells[0];
  const aim = {
    personId: lattice.personKey(members[0]),
    localX: centre.x + CELL,
    localY: centre.y + CELL,
    scrollY: 0,
  };
  const half = lattice.ringStepFor(CELL) / 2;

  // --- the sweep
  const drifts = [];
  for (let d = -120; d <= 120; d += 0.25) drifts.push({ d, abort: lattice.shouldAbortPollination(base, aim, d) });
  const wrong = drifts.filter(({ d, abort }) => {
    if (Math.abs(d) <= half - 0.2) return abort;       // still inside the seat
    if (Math.abs(d) >= half + 0.2) return !abort;      // past the Voronoi midpoint
    return false;                                       // the boundary itself, unasserted
  });
  if (wrong.length === 0) {
    ok(`abort tracks the comb's own Voronoi boundary over ±120pt of drift (${drifts.length} samples; boundary √3·cellSize/2 = ${half.toFixed(3)}pt)`);
  } else {
    bad(
      `abort tracks the comb's own Voronoi boundary over ±120pt of drift (boundary ${half.toFixed(3)}pt)`,
      `${wrong.length} samples disagree, first at drift ${wrong[0].d}pt (abort=${wrong[0].abort}). A threshold ` +
        'read off anything but the lattice will pass a fixture at 0 and 100 and fail in between.',
    );
  }

  // --- fixture 1: a re-seat with the aim point UNMOVED. Someone else's
  //     share arrives and re-orders feed order, so the person you tapped
  //     moves seat. Must abort. Fails correction 1's seat-keyed predicate,
  //     and no scroll event fires — which is why the trigger set includes
  //     `layout` identity.
  const reseated = layoutOf([person(9), ...members]);
  const f1 = lattice.shouldAbortPollination(reseated, aim, 0);

  // --- fixture 2: a re-share BY THE SAME PERSON. Aim point and seat both
  //     unmoved; only the share id changes. Must NOT abort — §28.1 says he
  //     decorates the source you tapped and the source is a face. This is
  //     the row that pins person over post; it is red under share-keying.
  const resharedList = members.map((m, i) => (i === 0 ? { ...m, id: 'share-0-b' } : m));
  const f2 = lattice.shouldAbortPollination(layoutOf(resharedList), aim, 0);

  // --- fixture 3: the tapped person is pushed off the comb entirely. In
  //     today's build this is the REACHABLE one: the demo set fills all
  //     seven seats, so the first real share of the day evicts the seventh
  //     member and re-seats the rest.
  const evicted = layoutOf([person(9), ...members.slice(0, 6)].filter((m) => m.authorId !== 'person-0'));
  const f3 = lattice.shouldAbortPollination(evicted, aim, 0);

  const fixtures = [
    { label: 'a re-seat with the aim point unmoved aborts', got: f1, want: true },
    { label: 'a re-share by the same person does NOT abort', got: f2, want: false },
    { label: 'the tapped person evicted from the comb aborts', got: f3, want: true },
  ];
  const missed = fixtures.filter((f) => f.got !== f.want);
  if (missed.length === 0) {
    ok('the abort predicate keys on the PERSON: ' + fixtures.map((f) => f.label).join('; '));
  } else {
    bad(
      'the abort predicate keys on the PERSON',
      missed
        .map((f) => `${f.label} — got abort=${f.got}`)
        .join('; ') +
        '. Seat-keying passes fixture 1 while landing on the wrong person; share-keying fails fixture 2 ' +
        'and spends the abort on the one event that is NOT "the wrong person is there."',
    );
  }
}

// --- F9. §28.9 row 8 — the predicate IS the hit-test, not a copy ---------
//
// §17.5's two-utils ruling permits distinct mechanisms for distinct surfaces
// (the comb hit-tests by cube-round, the hive comb by first-containment). It
// does not permit two answers to one question inside one screen. A second
// nearest-cell implementation appearing anywhere under `src/components` or
// `src/screens` fails this row even if it is numerically identical, because
// "identical today" is not a property anything maintains.
{
  const dirs = ['src/components', 'src/screens', 'src/utils'];
  const owners = [];
  for (const dir of dirs) {
    for (const name of await readdir(path.join(ROOT, dir))) {
      if (!name.endsWith('.js')) continue;
      const rel = `${dir}/${name}`;
      const src = await readFile(path.join(ROOT, rel), 'utf8');
      for (const fn of ['axialRound', 'pixelToAxialRaw']) {
        // A definition, not a call: `const axialRound =` / `function axialRound`.
        if (new RegExp(`(const|let|function)\\s+${fn}\\b`).test(src)) owners.push(`${rel}:${fn}`);
      }
    }
  }
  const expected = ['src/components/combLattice.js:axialRound', 'src/components/combLattice.js:pixelToAxialRaw'];
  const extra = owners.filter((o) => !expected.includes(o));
  const usesShared = /shouldAbortPollination/.test(gridSource) && /from '\.\/combLattice'/.test(gridSource);
  if (extra.length === 0 && owners.length === 2 && usesShared) {
    ok('one lattice implementation, and the abort predicate is it (HoneycombGrid imports shouldAbortPollination rather than re-deriving nearest-cell)');
  } else {
    bad(
      'one lattice implementation, and the abort predicate is it',
      extra.length
        ? `a second nearest-cell implementation exists: ${extra.join(', ')}`
        : usesShared
          ? `expected exactly 2 lattice definitions in combLattice.js, found ${owners.length}: ${owners.join(', ')}`
          : 'HoneycombGrid does not use shouldAbortPollination from combLattice — the predicate has been copied out',
    );
  }
}

// =========================================================================
// G. §28.9 — the abort is INVOKED (Sage's find, and the chain under it)
// =========================================================================
//
// Section F sweeps `shouldAbortPollination` 961 ways and never once asserts
// that anything CALLS it. Delete `onScroll` from the ScrollView and every row
// in F stays green while the abort stops reaching one of its two cases.
// That is this gate's own rule, one commit later, in the mechanism it was
// written to guard: A GATE ASSERTS A PROPERTY OF WHATEVER IT CAN IMPORT, AND
// THE DEFECT LIVES AT THE CALL SITE IT COULDN'T.
//
// THE TRIGGER IS A CHAIN, NOT THREE PROPS. Three call sites were named when
// this was raised — `onScroll`, `scrollEventThrottle`, and the effect's
// dependency array. Walking the path from the native event to the predicate
// turns up six links, and a row per named prop would have had the same shape
// as the hole it was closing: true of the parts somebody thought to list.
//
//   native scroll event
//     → onScroll is bound to a handler                        (G1)
//     → the handler writes contentOffset.y into a ref          (G1)
//     → the handler publishes a tick                           (G1)
//     → the tick is published while a flight is airborne       (G2)
//     → both carriers cross into HoneycombGrid                 (G3)
//     → the effect's deps are the union of what can change
//       either of hitTest's two inputs                         (G4)
//     → the predicate reads the scroll LIVE, not off the aim   (G5)
//
// Every row resolves the NEXT link's name from the PREVIOUS row's finding
// rather than from a string typed here, so renaming any identifier or prop in
// the chain passes and removing any link fails. G1 finds the handler from the
// JSX attribute, the ref from the handler's own assignment, and the state
// variable from the setter's `useState` pair; G3 finds the prop names from
// the values passed at the JSX call site; G4 and G5 look for those prop
// names on the other side of the component boundary.
console.log('\nG. the abort predicate is invoked (§28.9)');

const HONEYCOMB_TAB = path.join(ROOT, 'src/screens/HoneycombTab.js');
const tabSource = await readFile(HONEYCOMB_TAB, 'utf8');
const tabAst = parseJs(tabSource);
const gridAst = parseJs(gridSource);

const sliceOf = (src) => (n) => (n ? src.slice(n.start, n.end).replace(/\s+/g, ' ') : '(absent)');
const tabTxt = sliceOf(tabSource);
const collect = (ast, pred) => {
  const out = [];
  walk(ast.program, (n) => {
    if (pred(n)) out.push(n);
  });
  return out;
};
const jsxElements = (ast, name) =>
  collect(ast, (n) => n.type === 'JSXElement' && n.openingElement?.name?.name === name);
const jsxOpenings = (ast, name) =>
  collect(ast, (n) => n.type === 'JSXOpeningElement' && n.name?.name === name);
const attrOf = (opening, name) =>
  (opening?.attributes || []).find((a) => a.type === 'JSXAttribute' && a.name?.name === name);
const attrExpr = (opening, name) => {
  const a = attrOf(opening, name);
  return a?.value?.type === 'JSXExpressionContainer' ? a.value.expression : null;
};
// `x.current` and `x?.current` are different node types in Babel, and the
// second one is what this file actually writes.
const isDotCurrent = (n, objectName) =>
  (n?.type === 'MemberExpression' || n?.type === 'OptionalMemberExpression') &&
  n.property?.name === 'current' &&
  (objectName === undefined || n.object?.name === objectName);

// --- G1. §28.9 row 9 — the aim trigger is bound, and it writes what the
//     predicate reads ----------------------------------------------------
//
// Three claims in one row because they are one link: an `onScroll` that is
// bound to nothing, a handler that publishes a tick without updating the aim
// point, and a handler that updates the aim point without publishing a tick
// are three ways to have wiring that looks present and re-evaluates nothing.
// The row also asserts the comb is INSIDE the ScrollView — if it ever moves
// out, scrolling stops moving the target and this whole beat is solving a
// problem the screen no longer has.
let scrollHandlerName = null;
let aimRefName = null;
let tickSetterName = null;
let tickStateName = null;
let scrollView = null;
let gridOpening = null;
{
  const svs = jsxElements(tabAst, 'ScrollView');
  const grids = jsxOpenings(tabAst, 'HoneycombGrid');
  scrollView = svs.length === 1 ? svs[0] : null;
  gridOpening = grids.length === 1 ? grids[0] : null;
  const nested = scrollView && gridOpening && gridOpening.start > scrollView.start && gridOpening.end < scrollView.end;

  const onScroll = scrollView ? attrExpr(scrollView.openingElement, 'onScroll') : null;
  scrollHandlerName = onScroll?.type === 'Identifier' ? onScroll.name : null;

  let handlerDecl = null;
  if (scrollHandlerName) {
    handlerDecl = collect(tabAst, (n) => n.type === 'VariableDeclarator' && n.id?.name === scrollHandlerName)[0] ?? null;
  }
  const setters = [];
  if (handlerDecl?.init) {
    walk(handlerDecl.init, (n) => {
      if (
        n.type === 'AssignmentExpression' &&
        isDotCurrent(n.left) &&
        /contentOffset\s*\.\s*y/.test(tabTxt(n.right))
      ) {
        aimRefName = n.left.object?.name ?? null;
      }
      if (n.type === 'CallExpression' && n.callee?.type === 'Identifier' && /^set[A-Z]/.test(n.callee.name)) {
        setters.push(n.callee.name);
      }
    });
  }
  tickSetterName = setters.length === 1 ? setters[0] : null;
  if (tickSetterName) {
    const pair = collect(
      tabAst,
      (n) =>
        n.type === 'VariableDeclarator' &&
        n.id?.type === 'ArrayPattern' &&
        n.init?.type === 'CallExpression' &&
        n.init.callee?.name === 'useState' &&
        n.id.elements?.[1]?.name === tickSetterName,
    )[0];
    tickStateName = pair?.id?.elements?.[0]?.name ?? null;
  }

  if (nested && scrollHandlerName && aimRefName && tickSetterName && tickStateName) {
    ok(
      `the aim trigger is bound and writes what the predicate reads (<ScrollView onScroll={${scrollHandlerName}}> → ${aimRefName}.current = contentOffset.y, and ${tickSetterName} publishes ${tickStateName})`,
    );
  } else {
    bad(
      'the aim trigger is bound and writes what the predicate reads',
      !scrollView
        ? `expected exactly 1 <ScrollView> in HoneycombTab.js, found ${jsxElements(tabAst, 'ScrollView').length}`
        : !gridOpening
          ? `expected exactly 1 <HoneycombGrid>, found ${jsxOpenings(tabAst, 'HoneycombGrid').length}`
          : !nested
            ? 'the comb is not inside the ScrollView — scrolling no longer moves the target, so §28.9 is guarding a hazard that has moved'
            : !scrollHandlerName
              ? 'the ScrollView has no `onScroll={handler}` — the aim point is never re-read and the abort reaches only the re-seat case'
              : !aimRefName
                ? `${scrollHandlerName} never assigns contentOffset.y into a ref — the tick fires, the predicate re-runs, and it compares the offset captured at tap time against itself forever`
                : !tickSetterName
                  ? `expected exactly 1 state setter call in ${scrollHandlerName}, found ${setters.length}${setters.length ? `: ${setters.join(', ')}` : ' — scrolling updates the aim point and nothing re-evaluates the predicate'}`
                  : `${tickSetterName} is not the setter of any useState pair — this row cannot name the value that crosses into the comb`,
    );
  }
}

// --- G2. §28.9 row 10 — the tick is published WHILE A FLIGHT IS AIRBORNE --
//
// G1 asserts a setter is called, which is true of `if (false) setTick(...)`
// too — the return-leg hole again, one link along. The publish here is
// deliberately guarded, because a per-frame `setState` on a screen with
// fourteen `useState` hooks is a real cost to pay when there is no bee to
// abort. So the row does not ask for an unguarded publish; it asks that the
// guard and the flight read THE SAME STATE. An unguarded publish passes (it
// is strictly more complete); a guard on anything else fails.
{
  let guardTest = null;
  if (scrollHandlerName) {
    const handlerDecl = collect(tabAst, (n) => n.type === 'VariableDeclarator' && n.id?.name === scrollHandlerName)[0];
    if (handlerDecl?.init && tickSetterName) {
      walk(handlerDecl.init, (n) => {
        if (n.type === 'IfStatement' && new RegExp(`\\b${tickSetterName}\\s*\\(`).test(tabTxt(n.consequent))) guardTest = n.test;
        if (
          n.type === 'LogicalExpression' &&
          n.operator === '&&' &&
          new RegExp(`\\b${tickSetterName}\\s*\\(`).test(tabTxt(n.right))
        ) {
          guardTest = n.left;
        }
      });
    }
  }
  // What each `someRef.current = X` mirrors, at component scope.
  const mirrors = {};
  walk(tabAst.program, (n) => {
    if (n.type === 'AssignmentExpression' && isDotCurrent(n.left) && n.right?.type === 'Identifier' && n.left.object?.name) {
      mirrors[n.left.object.name] = n.right.name;
    }
  });
  const guardReads = [];
  if (guardTest) {
    walk(guardTest, (n) => {
      if (isDotCurrent(n) && n.object?.name) guardReads.push(n.object.name);
      if (n.type === 'Identifier') guardReads.push(n.name);
    });
  }
  const flightKeySrc = tabTxt(attrExpr(gridOpening, 'activePollinationKey'));
  const sharedState = guardReads
    .map((r) => mirrors[r] ?? r)
    .find((state) => state && new RegExp(`\\b${state}\\b`).test(flightKeySrc));

  if (!tickSetterName) {
    bad('the tick is published while a flight is airborne', 'G1 could not name the setter, so this row has nothing to check — a row that cannot tell must fail rather than look clean');
  } else if (!guardTest) {
    ok(`${tickSetterName} publishes unconditionally — strictly more complete than the airborne guard this row permits`);
  } else if (sharedState) {
    ok(`the tick's guard and the flight read the same state (\`${tabTxt(guardTest)}\` mirrors \`${sharedState}\`, which activePollinationKey derives from)`);
  } else {
    bad(
      'the tick is published while a flight is airborne',
      `the guard on ${tickSetterName} is \`${tabTxt(guardTest)}\`, which reads ${guardReads.length ? guardReads.join('/') : 'nothing'} — none of which is the state activePollinationKey derives from (\`${flightKeySrc}\`). A guard that closes during the flight makes the aim trigger dead wiring.`,
    );
  }
}

// --- G3. §28.9 row 11 — both carriers cross the component boundary -------
//
// Resolved from G1's names, not from strings typed here: the row finds which
// PROPS carry the ref and the tick by looking at what is passed at the JSX
// call site, then checks those prop names are destructured on the other side.
// Rename anything in the chain and this passes; drop either prop and the
// predicate silently reads `0` forever (the ref) or never re-runs (the tick).
let refPropName = null;
let tickPropName = null;
{
  const passedAs = (identName) =>
    (gridOpening?.attributes || []).find(
      (a) => a.type === 'JSXAttribute' && a.value?.type === 'JSXExpressionContainer' && a.value.expression?.type === 'Identifier' && a.value.expression.name === identName,
    )?.name?.name ?? null;
  refPropName = aimRefName ? passedAs(aimRefName) : null;
  tickPropName = tickStateName ? passedAs(tickStateName) : null;

  let gridParams = [];
  walk(gridAst.program, (n) => {
    if (n.type !== 'VariableDeclarator' || n.id?.name !== 'HoneycombGrid') return;
    // R-LF-5 wrapped the component in `forwardRef` (the landing light needs
    // `HoneycombTab` to hold a ref onto it) — the props ObjectPattern is one
    // call deeper than before, at `forwardRef(fn)`'s own `fn`, not at the
    // VariableDeclarator's `init` directly. Read whichever shape is there
    // rather than assuming either.
    const fn = n.init?.type === 'CallExpression' && n.init.callee?.name === 'forwardRef'
      ? n.init.arguments[0]
      : n.init;
    if (fn?.params?.[0]?.type === 'ObjectPattern') {
      gridParams = fn.params[0].properties.map((p) => p.key?.name).filter(Boolean);
    }
  });
  const received = [refPropName, tickPropName].every((p) => p && gridParams.includes(p));

  if (refPropName && tickPropName && received) {
    ok(`both carriers cross into the comb (${aimRefName} as \`${refPropName}\`, ${tickStateName} as \`${tickPropName}\`, both destructured by HoneycombGrid)`);
  } else {
    bad(
      'both carriers cross into the comb',
      !aimRefName || !tickStateName
        ? 'G1 could not name what to look for, so this row cannot tell — which is a failure, not a pass'
        : !refPropName
          ? `${aimRefName} is not passed to <HoneycombGrid> — readScrollY falls back to 0 and the drift the predicate measures is a constant`
          : !tickPropName
            ? `${tickStateName} is not passed to <HoneycombGrid> — the aim trigger never reaches the effect`
            : `HoneycombGrid does not destructure ${[refPropName, tickPropName].filter((p) => !gridParams.includes(p)).join(' or ')} — the props are passed and dropped`,
    );
  }
}

// --- G4. §28.9 row 12 — the effect's deps are the union of hitTest's inputs
//
// `hitTest` has exactly two inputs, so the trigger set is the union of what
// can change either: the aim point (the scroll tick) and the seating
// (`layout`'s identity). The second half is complete BY CONSTRUCTION rather
// than by enumeration — `layout`'s own dependency list is the definition of
// what can re-seat — which is only true while `layout` really is the memo
// over the seating. So the row asserts both: the effect watches `layout`, and
// `layout` is `useMemo(buildCombLayout(...), [members, cellSize])`.
{
  let effect = null;
  walk(gridAst.program, (n) => {
    if (n.type === 'CallExpression' && n.callee?.name === 'useEffect') {
      let callsPredicate = false;
      walk(n.arguments?.[0], (m) => {
        if (m.type === 'CallExpression' && m.callee?.name === 'shouldAbortPollination') callsPredicate = true;
      });
      if (callsPredicate) effect = n;
    }
  });
  const deps = effect?.arguments?.[1]?.type === 'ArrayExpression' ? effect.arguments[1].elements.map((e) => e?.name ?? null) : null;
  const layoutMemo = collect(
    gridAst,
    (n) => n.type === 'VariableDeclarator' && n.id?.name === 'layout' && n.init?.type === 'CallExpression' && n.init.callee?.name === 'useMemo',
  )[0];
  const memoDeps = layoutMemo?.init?.arguments?.[1]?.elements?.map((e) => e?.name) ?? [];
  const seatingInputs = ['members', 'cellSize'].every((d) => memoDeps.includes(d));
  const watchesLayout = deps?.includes('layout');
  const watchesTick = tickPropName ? deps?.includes(tickPropName) : false;

  if (deps && watchesLayout && watchesTick && seatingInputs) {
    ok(`the abort effect watches both of hitTest's inputs ([${deps.join(', ')}]; layout re-memoizes on [${memoDeps.join(', ')}])`);
  } else {
    bad(
      "the abort effect watches both of hitTest's inputs",
      !effect
        ? 'no useEffect in HoneycombGrid.js calls shouldAbortPollination — the predicate is dead code'
        : !deps
          ? 'the abort effect has no dependency array — it re-runs on every render, which passes the aim point but makes the trigger set unreadable'
          : !tickPropName
            ? `G3 could not name the tick prop, so this row cannot tell whether [${deps.join(', ')}] contains it — and CANNOT TELL is a failure, not a clean NO`
            : !watchesLayout
              ? `\`layout\` is not in [${deps.join(', ')}] — a re-seat emits no scroll event, so the case the row-7 fixtures pin is evaluated by nothing`
              : !watchesTick
                ? `the scroll tick (\`${tickPropName}\`) is not in [${deps.join(', ')}] — scrolling moves the target and nothing re-checks it`
                : `layout re-memoizes on [${memoDeps.join(', ')}] — "complete by construction" holds only while that list IS the definition of what can re-seat`,
    );
  }
}

// --- G5. §28.9 row 13 — the predicate reads the scroll LIVE --------------
//
// The seeded aim carries `scrollY` at tap time and the predicate takes a
// second `scrollY` as its third argument; `drift` is their difference. Pass
// the seeded one and the drift is identically zero — a predicate that is
// wired, triggered, swept 961 ways and structurally incapable of ever being
// true. So the third argument must be a CALL, and that call must resolve to
// something reading the ref prop G3 named.
{
  let abortCall = null;
  walk(gridAst.program, (n) => {
    if (n.type === 'CallExpression' && n.callee?.name === 'shouldAbortPollination') abortCall = n;
  });
  const third = abortCall?.arguments?.[2] ?? null;
  const readerName = third?.type === 'CallExpression' && third.callee?.type === 'Identifier' ? third.callee.name : null;
  let readerReadsProp = false;
  if (readerName && refPropName) {
    const readerDecl = collect(gridAst, (n) => n.type === 'VariableDeclarator' && n.id?.name === readerName)[0];
    if (readerDecl?.init) {
      walk(readerDecl.init, (m) => {
        if (isDotCurrent(m, refPropName)) readerReadsProp = true;
      });
    }
  }

  if (readerName && readerReadsProp) {
    ok(`the abort predicate reads the scroll live (\`${readerName}()\` reads ${refPropName}.current, not the offset seeded at tap time)`);
  } else {
    bad(
      'the abort predicate reads the scroll live',
      !abortCall
        ? 'shouldAbortPollination is not called anywhere in HoneycombGrid.js'
        : !readerName
          ? `its third argument is \`${sliceOf(gridSource)(third)}\` — not a call, so it cannot be a live read. If it is the seeded offset, drift is identically zero and the predicate can never fire.`
          : !refPropName
            ? `G3 could not name the ref prop, so this row cannot tell what \`${readerName}\` ought to read — and CANNOT TELL is a failure, not a clean NO`
            : `\`${readerName}\` does not read ${refPropName}.current — the drift is measured against something other than the live scroll offset`,
    );
  }
}

// --- G6. §28.9 row 14 — nothing throttles the aim below one frame --------
//
// MEASURED, not recited, because the familiar claim about this prop does not
// hold on the installed version. `scrollEventThrottle={16}` is INERT here:
//
//   • Fabric — `BaseScrollViewProps.h:57` defaults it to 0;
//     `RCTScrollViewComponentView.mm:381-388` maps any value ≤ 1/60 s to an
//     internal 0, and `:744` then dispatches whenever `now - last > 0`. 16
//     and absent produce the identical internal value.
//   • Old arch — `RCTScrollView.m:385` defaults it to 0 and `:716` tests
//     `_scrollEventThrottle < MAX(0.017, elapsed)`, true for both 0 and
//     0.016. (The TODO at `:708` says 0 means "once per scroll"; the code
//     under it has not done that for some time. The comment is stale.)
//   • Android — `ReactScrollView.java:1620` stores it and
//     `getScrollEventThrottle()` has NO reader anywhere under
//     `ReactAndroid/src/main/java`. Probe scope stated: that directory, that
//     method name.
//
// THE FOLK CLAIM ABOUT THIS PROP IS WRITTEN DOWN TWICE AND IMPLEMENTED ZERO
// TIMES. `RCTScrollView.m:708` (a TODO) and `RCTScrollViewComponentView.mm:378`
// ("Zero means 'send value only once per significant logical event'") say the
// same false thing, in two architectures, and the second is a from-scratch
// reimplementation that carried the sentence forward — contradicted by `:744`,
// eleven lines below it. So the usual tell for a stale comment (one file
// disagreeing with everything else) is unavailable: a reader who distrusts one
// and checks the other finds corroboration.
//
// And the third source is the one that makes the bound below defensible.
// `ScrollView.js:580-583` and `ScrollView.d.ts` — the only two a JS developer
// reads — are CORRECT and SILENT: "Values <= `16` will disable throttling,
// regardless of the refresh rate of the device", with no statement of the
// default. THE DOCUMENTED SURFACE IS SILENT EXACTLY WHERE THE BEHAVIOUR IS
// SURPRISING, WHICH IS WHAT LETS A FALSE COMMENT IN THE IMPLEMENTATION READ AS
// AUTHORITATIVE.
//
// So the row does not assert the PROP, which would be asserting a token that
// governs nothing on this version. It asserts the PROPERTY: absent is fine,
// present must be ≤ 16 — and that 16 is the DOCUMENTED GUARANTEE, not the
// implementation constant (Fabric's internal threshold is 1/60 s = 16.67ms;
// binding the row to the documented number is what keeps it true if the
// implementation moves inside its own promise). The value stays in the source
// anyway, because a default of 0 meaning "every frame" is behaviour this beat
// depends on and does not own.
{
  const expr = scrollView ? attrExpr(scrollView.openingElement, 'scrollEventThrottle') : null;
  const value = expr?.type === 'NumericLiteral' ? expr.value : null;
  if (!scrollView) {
    bad('nothing throttles the aim point below one frame', 'G1 could not find the ScrollView, so this row cannot tell');
  } else if (!attrOf(scrollView.openingElement, 'scrollEventThrottle')) {
    ok('scrollEventThrottle is absent, which is 0 on this version — every frame (see the measurements above this row)');
  } else if (typeof value === 'number' && value <= 16) {
    ok(`scrollEventThrottle={${value}} ≤ 16, so the aim point is re-read every frame`);
  } else {
    bad(
      'nothing throttles the aim point below one frame',
      `scrollEventThrottle is \`${tabTxt(expr)}\` — above 16 this genuinely throttles on iOS, and the longest approaches (p95 1112ms) are the most interruptible ones`,
    );
  }
}

// --- H. §28.4 / R89 — the position ref is written by a subscription React
//     Native will actually call ------------------------------------------
//
// F3 above asserts that both plan builders take waypoint 0 from
// `posRef.current` rather than a constant. That row was GREEN for the entire
// life of this beat, while `posRef` held `{ x: 0, y: 0 }` from mount to
// unmount and every flight began in the container's top-left corner. The row
// was not wrong; it was answering a question one layer above the defect. It
// asked whether the source NAMES the live ref. Nothing asked whether the ref
// is live.
//
// The mechanism, verified in the installed RN (0.86.2) and then on device:
//
//   • `AnimatedWithChildren.__callListeners` (`:72-84`) calls the node's own
//     listeners, then cascades to children ONLY `if (!this.__isNative)`.
//   • `__makeNative` (`:24-39`) walks DOWN the chain, so once a value is
//     driven natively every node derived from it is native too.
//
//   ⇒ a listener on `t.interpolate(...)` is registered and then never called.
//     Measured: 49 callbacks in 800ms on the value; 0 on an interpolation of
//     it, whether or not that interpolation is attached to a real transform.
//     The class of the derived node is irrelevant, so "listen on the pair the
//     render uses" — the obvious fix — is also dead.
//
// The guard is correct, not a bug: under the native driver JS has no fresh
// value for the children, and RN chose frozen over stale. Frozen is also what
// made this findable, since a bee that teleports to the corner is a bug report
// and a bee lagging its own trail by two frames is not.
//
// So the rows below are about the SHAPE of a subscription, which is the part
// that is statically decidable. They cannot prove a listener fires — only a
// device can, and one did. What they can do is make the dead shape impossible
// to reintroduce, in this file or any other.
{
  // H1 — the class rule, enumerated rather than listed. Every `addListener`
  // in the app, receiver resolved to its declaration; a receiver built from
  // `.interpolate(...)` (or any other derived node) is a listener that will
  // go silent the moment its parent goes native, whether or not the file that
  // wrote it has a native driver in it today.
  const ANIMATED_DERIVED = /\.interpolate\s*\(|Animated\.(?:add|subtract|multiply|divide|modulo|diffClamp)\s*\(/;
  const ANIMATED_VALUE = /new\s+Animated\.Value\s*\(/;
  const sites = [];
  for (const file of [path.join(ROOT, 'App.js'), ...(await jsFiles(path.join(ROOT, 'src')))]) {
    const src = await readFile(file, 'utf8');
    if (!src.includes('.addListener(')) continue;
    const ast = parseJs(src);
    const declarators = [];
    walk(ast.program, (n) => {
      if (n.type === 'VariableDeclarator' && n.id?.type === 'Identifier') declarators.push(n);
    });
    walk(ast.program, (n) => {
      if (n.type !== 'CallExpression') return;
      if (n.callee?.type !== 'MemberExpression' || n.callee.property?.name !== 'addListener') return;
      const recv = n.callee.object;
      const rel = path.relative(ROOT, file);
      const name = recv?.type === 'Identifier' ? recv.name : null;
      const matches = name ? declarators.filter((d) => d.id.name === name) : [];
      const init = matches.length === 1 && matches[0].init
        ? src.slice(matches[0].init.start, matches[0].init.end)
        : null;
      let verdict;
      if (init === null) {
        // Unresolvable receiver. Only a concern in a file that deals in
        // Animated at all — `navigation.addListener` is a different API that
        // happens to share a method name.
        verdict = src.includes("from 'react-native'") && /\bAnimated\b/.test(src) ? 'CANNOT TELL' : 'not an Animated node';
      } else if (ANIMATED_DERIVED.test(init)) {
        verdict = 'DERIVED';
      } else if (ANIMATED_VALUE.test(init)) {
        verdict = 'AnimatedValue';
      } else {
        verdict = 'not an Animated node';
      }
      sites.push({ where: `${rel}:${src.slice(0, recv.start).split('\n').length}`, name, verdict, init });
    });
  }
  const derived = sites.filter((s) => s.verdict === 'DERIVED');
  const unknown = sites.filter((s) => s.verdict === 'CANNOT TELL');
  const values = sites.filter((s) => s.verdict === 'AnimatedValue');
  if (sites.length === 0) {
    bad(
      'every Animated listener in the app is attached to a value, not to a node derived from one',
      'found no `addListener` call anywhere — this row enumerates off disk, so zero sites means the walk broke, not that the app stopped listening',
    );
  } else if (derived.length === 0 && unknown.length === 0) {
    ok(
      `every Animated listener is attached to a value, not to a derived node (${values.length} on an AnimatedValue: ` +
        `${values.map((s) => `${s.where} \`${s.name}\``).join(', ')}; ${sites.length - values.length} not Animated)`,
    );
  } else {
    bad(
      'every Animated listener in the app is attached to a value, not to a node derived from one',
      [
        ...derived.map((s) => `${s.where} listens on \`${s.name}\` = ${s.init.replace(/\s+/g, ' ').slice(0, 90)} — a derived node. Its listeners stop firing the instant its parent is driven natively, silently, keeping the last value they saw.`),
        ...unknown.map((s) => `${s.where} listens on \`${s.name}\`, which this row could not resolve to a declaration in the same file — CANNOT TELL, which is a failure, not a pass.`),
      ].join(' '),
    );
  }

  // H2 — the sampler reads the SAME NODES the render puts on screen, not a
  // second copy built from the same numbers. This is what makes `__getValue`
  // worth its private-API cost: the same arithmetic can drift behind a
  // captured `track`; the same node cannot.
  const beeView = (() => {
    let found = null;
    walk(flyingBeeAst.program, (n) => {
      if (found || n.type !== 'JSXElement') return;
      const nm = n.openingElement.name;
      if (nm?.type !== 'JSXMemberExpression' || nm.property?.name !== 'View') return;
      const style = attrExpr(n.openingElement, 'style');
      if (style && flyingBeeSource.slice(style.start, style.end).includes('styles.bee')) found = n;
    });
    return found;
  })();
  const listenerCb = (() => {
    let found = null;
    walk(flyingBeeAst.program, (n) => {
      if (found || n.type !== 'CallExpression') return;
      if (n.callee?.type !== 'MemberExpression' || n.callee.property?.name !== 'addListener') return;
      found = n.arguments[0];
    });
    return found;
  })();
  const readNames = [];
  walk(listenerCb, (n) => {
    if (n.type !== 'CallExpression') return;
    if (n.callee?.type !== 'MemberExpression' || n.callee.property?.name !== '__getValue') return;
    if (n.callee.object?.type === 'Identifier') readNames.push(n.callee.object.name);
  });
  const renderNames = new Set();
  if (beeView) {
    const styleExpr = attrExpr(beeView.openingElement, 'style');
    walk(styleExpr, (n) => {
      if (n.type === 'Identifier') renderNames.add(n.name);
    });
    // One level of aliasing, and only through a RE-BINDING. The bee's opacity
    // is written `flightOpacity`, declared `presetOpacity ?? 1` — the same node
    // under a name that says what it is for, so the row must see through it or
    // it fails a correct file and teaches people to edit the gate.
    //
    // But `rotate` is declared `attitude ? t.interpolate({…}) : '0deg'`, and
    // expanding through THAT admits `t` — the parent value, which the render
    // does not draw with. Then a sampler that reads `t.__getValue()` and does
    // the interpolation arithmetic itself passes a row whose whole point is
    // that it must not: same numbers, different node, free to drift behind a
    // stale captured `track`. Found by mutating this row, not by reasoning
    // about it.
    //
    // So: expand only where the init CONSTRUCTS NOTHING. A declarator that
    // builds a new Animated node names a different node by definition; one
    // that just passes an identifier along names the same one.
    const CONSTRUCTS_A_NODE = /\.interpolate\s*\(|new\s+Animated\.|Animated\.(?:add|subtract|multiply|divide|modulo|diffClamp)\s*\(/;
    for (const name of [...renderNames]) {
      walk(flyingBeeAst.program, (n) => {
        if (n.type !== 'VariableDeclarator' || n.id?.name !== name || !n.init) return;
        if (CONSTRUCTS_A_NODE.test(flyingBeeSource.slice(n.init.start, n.init.end))) return;
        walk(n.init, (m) => {
          if (m.type === 'Identifier') renderNames.add(m.name);
        });
      });
    }
  }
  const unread = readNames.filter((n) => !renderNames.has(n));
  if (!beeView || !listenerCb) {
    bad(
      'the position sampler reads the nodes the render draws with',
      `could not locate ${!beeView ? 'the <Animated.View> carrying styles.bee' : 'an addListener callback in FlyingBee'} — CANNOT TELL`,
    );
  } else if (readNames.length === 0) {
    bad(
      'the position sampler reads the nodes the render draws with',
      'the listener callback calls `__getValue()` on nothing. Either it re-derives the interpolation in JS — which can drift from the transform behind a stale captured `track` — or it takes the callback argument, which is `t`, not a position.',
    );
  } else if (unread.length === 0) {
    ok(`the position sampler reads the nodes the render draws with (${[...new Set(readNames)].join(', ')} — all present in the bee's own transform)`);
  } else {
    bad(
      'the position sampler reads the nodes the render draws with',
      `\`${unread.join('`, `')}\` is read by the sampler but does not appear in the <Animated.View style={[styles.bee, …]}> the user sees. Same numbers is not the same node.`,
    );
  }

  // H3 — those nodes are memoised, and the effect depends on their IDENTITY.
  // Correct-by-dependency-array-coincidence is the failure mode here: rebuild
  // `translateX` in the render body and the listener holds whichever copy
  // existed when the effect last ran, which is right only for as long as two
  // hand-written dep arrays agree. Memoised, the node IS the dependency.
  //
  // This row's remedy is also §28.13's arming edit, so the remedy carries the
  // warning. Nowhere else in the suite can: the app-wide row would read "a
  // transform array whose nodes are all stable may not contain a varying plain
  // entry", and that is red on `CelebrationRays.js:74` today — a row that fails
  // a correct tree is a row people learn to edit. A failure message is not a
  // row. It costs no false red, and it reaches the person at the instant they
  // are holding the edit.
  //
  // It goes on the `notMemo` clause only. The `notDep` clause asks for a
  // dependency array, which arms nothing, and a warning about an edit somebody
  // is not making is noise. Scope, since it is the rule: this reaches whoever
  // memoises BECAUSE THIS ROW TOLD THEM TO. Whoever memoises for their own
  // reasons never sees it — for them the cover is §28.13 and the site comment
  // at `MascotBee.js:94`, which is the only place in `src/` where the edit
  // freezes real geometry.
  const memoised = new Set();
  walk(flyingBeeAst.program, (n) => {
    if (n.type !== 'VariableDeclarator' || n.id?.type !== 'Identifier') return;
    if (n.init?.type === 'CallExpression' && n.init.callee?.name === 'useMemo') memoised.add(n.id.name);
  });
  const listenerEffectDeps = (() => {
    let deps = null;
    walk(flyingBeeAst.program, (n) => {
      if (deps || n.type !== 'CallExpression' || n.callee?.name !== 'useEffect') return;
      const body = n.arguments[0];
      let hasListen = false;
      walk(body, (m) => {
        if (m.type === 'CallExpression' && m.callee?.type === 'MemberExpression' && m.callee.property?.name === 'addListener') hasListen = true;
      });
      if (!hasListen) return;
      const arr = n.arguments[1];
      deps = arr?.type === 'ArrayExpression' ? arr.elements.filter((e) => e?.type === 'Identifier').map((e) => e.name) : null;
    });
    return deps;
  })();
  // Which of the sampled names actually sit in a `transform` array in this
  // file (Sage). COMPUTED per run from the AST rather than typed in, so it is
  // not a fact about the tree — it re-derives the day somebody moves a node,
  // which is the H4 argument applied to this row. The branch is not the unit
  // of scoping; the NAME is, because `notMemo` is a list whose members do not
  // share a hazard.
  //
  // Reference positions only. A property key and a member-expression property
  // are `Identifier` nodes that name nothing: `{ scale: slot.scale }` holds
  // three Identifiers and exactly one of them is a variable. Collecting all
  // three is R85's "prose about a variable is not the variable" one layer in
  // — the node type is right and the ROLE is wrong. Blind, this set carries
  // `pos`, `x`, `y`, `scale`, `driftX`, `driftY` off the particle array, and
  // a sampled node named any of those would take the clause without ever
  // being in a transform. Shorthand is safe either way: `{ rotate }` parses
  // key and value as distinct nodes (verified: 25 shorthand properties in this
  // file, `key === value` in none of them), so dropping the key keeps the
  // reference — which the bee's own array at the render depends on, since it
  // is 100% shorthand.
  //
  // WHAT THIS DOES NOT DO, because the caps above used to claim more than the
  // code performs (Sage): membership is matched BY NAME, NOT BY BINDING. No
  // scope resolution happens. `slot` is in the resulting set and it is the
  // `trailPool.map((slot, i) =>` PARAMETER at `:603`, not a component-scope
  // node — so a sampled node named `slot` would take the clause off a
  // different binding wearing the same name. Right role, wrong binding: one
  // step in from the role confusion this walk fixes. Left unresolved on
  // purpose — a parent-aware walk for a collision that needs somebody to name
  // a sampled node after a callback parameter is not worth the machinery, and
  // §28.12's precedent is to name residue rather than promise immunity.
  const inTransform = new Set();
  walk(flyingBeeAst.program, (n) => {
    if (n.type !== 'ObjectProperty') return;
    if ((n.key?.name ?? n.key?.value) !== 'transform') return;
    if (n.value?.type !== 'ArrayExpression') return;
    const notARef = new Set();
    walk(n.value, (m) => {
      if (m.type === 'ObjectProperty' && !m.computed) notARef.add(m.key);
      if (m.type === 'MemberExpression' && !m.computed) notARef.add(m.property);
    });
    walk(n.value, (m) => {
      if (m.type === 'Identifier' && !notARef.has(m)) inTransform.add(m.name);
    });
  });
  const notMemo = [...new Set(readNames)].filter((n) => !memoised.has(n));
  const notDep = [...new Set(readNames)].filter((n) => !(listenerEffectDeps ?? []).includes(n));
  // The arming clause, and its CANNOT-TELL case. Silence has to mean one
  // thing. Force the collector to gather nothing and the whole suite still
  // reports 77/0 (Sage) — every line of this predicate lives inside `bad()`,
  // so a passing run has no coverage of it at all. The reachable version of
  // that is a file the collector finds nothing in, at which point an absent
  // clause would read as the clean "none of these sit in a transform" when the
  // honest answer is "this row could not look." R73: the place a check
  // declines to have an opinion must not look like the place it has a clean
  // one.
  //
  // The sentence STATES WHAT THE TEST FOUND, never why (Sage). An earlier
  // draft said "no literal `transform: [...]` array was found in this file" —
  // a CAUSE, and only one of the two that produce `size === 0`. Make both
  // arrays literal-only and it reports no array in a file holding two, so the
  // verdict is right and the cause is invented. A MESSAGE THAT NAMES THE CAUSE
  // WILL DRIFT FROM THE PREDICATE; A MESSAGE THAT STATES WHAT THE TEST FOUND
  // CANNOT. Same words, true under both causes, cannot go stale.
  const arming = notMemo.filter((n) => inTransform.has(n));
  const armingClause = inTransform.size === 0
    ? ' §28.13 — CANNOT TELL whether memoising is also an arming edit: the membership test found no variable reference in any `transform: [...]` array in this file, so it has nothing to match against. Check by hand.'
    : arming.length
      ? ` §28.13 — \`${arming.join('`, `')}\` sits in a \`transform\` array, so memoising is also an ARMING edit: if it leaves EVERY node in a shared \`transform\` array identity-stable, every plain number in that array freezes at its first commit, and those have to become nodes in the same change.`
      : '';
  if (readNames.length === 0) {
    bad('the sampled nodes are memoised and are the effect\'s own dependencies', 'H2 found nothing being read, so this row cannot tell');
  } else if (listenerEffectDeps === null) {
    bad('the sampled nodes are memoised and are the effect\'s own dependencies', 'the listening useEffect has no literal dependency array — it re-subscribes every render, which is a different defect with the same symptom');
  } else if (notMemo.length === 0 && notDep.length === 0) {
    ok(`the sampled nodes are memoised and are the effect's own dependencies ([${listenerEffectDeps.join(', ')}])`);
  } else {
    bad(
      'the sampled nodes are memoised and are the effect\'s own dependencies',
      [
        // States what was checked — "is not declared by a useMemo" — never a
        // consequence. An earlier draft said "is rebuilt on every render",
        // which is false of a `useRef` and sent a mutation's diagnosis to the
        // wrong line.
        // The remedy's side effect, stated as the rule rather than as a fact
        // about this tree — "here `rotate` is rebuilt per render so you are
        // fine" would be a sentence that goes false the day somebody memoises
        // `rotate`, in the message that told them to.
        notMemo.length ? `\`${notMemo.join('`, `')}\` is not declared by a \`useMemo\` at component scope, so this row cannot show its identity is stable across renders.${armingClause}` : '',
        notDep.length ? `\`${notDep.join('`, `')}\` is not in the effect's deps [${listenerEffectDeps.join(', ')}], so the subscription outlives the node it samples.` : '',
      ].filter(Boolean).join(' '),
    );
  }
}

// --- H4. §28.2 — no tab-level scene transform over the pollinate mount ---
//
// The half of the origin residue that is opt-in, and therefore gateable.
//
// Measure-on-use (F2b) fixes a stale origin for anything Yoga can see. It
// cannot fix a NATIVELY DRIVEN ancestor transform, because `measureInWindow`
// reads the shadow tree and the native driver writes the layer — measured, 18
// samples of `y = 0` while a view slid 200pt. There are exactly two navigators
// over `HoneycombTab`'s `<FlyingBee>`:
//
//   * the ROOT stack (`App.js`, `@react-navigation/stack`). Its unfocused card
//     carries `translateUnfocused`, 0 -> `screen.width * -0.3`
//     (`CardStyleInterpolators.tsx:29-37`), driven with
//     `useNativeDriver: Platform.OS !== 'web'` (`Card.tsx:79`, `:251`). That is
//     UNCONDITIONAL and is what a stack is for — not gateable, and recorded in
//     §28.11 with its bound instead.
//   * this one, `MainTabs.js`. `hasAnimation` gates the whole tab transition on
//     `options.animation` / `options.transitionSpec`
//     (`BottomTabView.tsx:60-67`), and neither is set — so today there is no
//     second transform. It is one word away from there being one, on a
//     navigator the user crosses dozens of times a session rather than
//     occasionally, and that FREQUENCY is why this row is worth having while
//     the root stack's identical mechanism is only worth writing down.
//
// It asserts the BOUND, not the token. `animation: 'fade'` is opacity-only and
// cannot move this box; `'shift'` carries `translateX` ±50. A row that reds on
// both would be red about something it has no opinion on, and rows that fail
// correct trees teach people to edit the gate. So the row resolves the name
// through the INSTALLED library and CALLS the interpolator, rather than
// trusting a list typed here — which also means a library upgrade that gives
// `forFade` a transform turns this red on its own.
{
  const NAME = 'no tab-level scene transform over the pollinate mount (§28.2)';
  const MAIN_TABS = path.join(ROOT, 'src/navigation/MainTabs.js');
  const tabsSource = await readFile(MAIN_TABS, 'utf8');
  const tabsAst = parseJs(tabsSource);
  const named = [];
  walk(tabsAst.program, (n) => {
    if (n.type !== 'ObjectProperty' || !n.key) return;
    const k = n.key.name ?? n.key.value;
    if (!['animation', 'transitionSpec', 'sceneStyleInterpolator'].includes(k)) return;
    named.push({ key: k, node: n });
  });
  // Which named animations actually move the scene — asked of the installed
  // module by calling it, with `interpolate` stubbed so the returned style is
  // the shape the library would build.
  let moving = null;
  let interpolatorError = null;
  try {
    const mod = await import(
      path.join(ROOT, 'node_modules/@react-navigation/bottom-tabs/lib/module/TransitionConfigs/SceneStyleInterpolators.js')
    );
    const stub = { current: { progress: { interpolate: () => 'ANIMATED_NODE' } } };
    moving = new Map();
    for (const [exported, fn] of Object.entries(mod)) {
      if (typeof fn !== 'function' || !exported.startsWith('for')) continue;
      const style = fn(stub)?.sceneStyle ?? {};
      const preset = exported.slice(3).toLowerCase();
      moving.set(preset, Object.prototype.hasOwnProperty.call(style, 'transform'));
    }
  } catch (e) {
    interpolatorError = e.message;
  }
  const offenders = [];
  for (const { key, node } of named) {
    if (key === 'transitionSpec') {
      // `transitionSpec` alone turns `hasAnimation` on but leaves
      // `sceneStyleInterpolator` at the `none` preset's `undefined`
      // (`BottomTabView.tsx:292-294`), so it animates a value no scene style
      // reads. Harmless for the origin — and stated rather than skipped,
      // because "the gate ignored it" and "the gate cleared it" must not
      // look the same.
      continue;
    }
    if (key === 'sceneStyleInterpolator') {
      offenders.push('`sceneStyleInterpolator` is set here, and this row cannot evaluate a function it did not resolve — CANNOT TELL, which is a fail');
      continue;
    }
    const v = node.value;
    if (v?.type !== 'StringLiteral') {
      offenders.push(`\`animation\` is set to a non-literal (${tabsSource.slice(v.start, v.end).replace(/\s+/g, ' ').slice(0, 60)}), so this row cannot resolve which interpolator runs — CANNOT TELL, which is a fail`);
      continue;
    }
    if (v.value === 'none') continue;
    if (!moving) {
      offenders.push(`\`animation: '${v.value}'\` is set and the installed interpolators could not be loaded (${interpolatorError}) — CANNOT TELL, which is a fail`);
      continue;
    }
    if (!moving.has(v.value)) {
      offenders.push(`\`animation: '${v.value}'\` does not resolve to an installed \`for${v.value.charAt(0).toUpperCase()}${v.value.slice(1)}\` interpolator, so this row cannot say whether it moves the scene — CANNOT TELL, which is a fail`);
      continue;
    }
    if (moving.get(v.value)) {
      offenders.push(`\`animation: '${v.value}'\` resolves to an interpolator that returns a \`transform\`, so every tab switch moves the bee's container by a transform the native driver writes straight to the layer — \`measureInWindow\` cannot see it and the origin is stale for the length of the transition (§28.11)`);
    }
  }
  if (offenders.length === 0) {
    const evidence = moving
      ? [...moving.entries()].map(([k, m]) => `${k}=${m ? 'moves' : 'opacity only'}`).join(', ')
      : 'installed interpolators not consulted';
    // Names what was FOUND, not just the verdict. "sets no scene-moving
    // animation" reads identically whether the file sets nothing or sets
    // `'fade'`, and those are different facts about the app.
    const found = named.length
      ? named.map(({ key, node }) => (node.value?.type === 'StringLiteral' ? `${key}: '${node.value.value}'` : key)).join(', ')
      : 'none set';
    ok(`${NAME} — MainTabs.js tab options [${found}]; none moves the scene (installed: ${evidence})`);
  } else {
    bad(NAME, offenders.join('; '));
  }
}

// --- I. §28.13 — a plain number sharing a transform array with a natively
//     driven node is frozen at its first commit ---------------------------
//
// Section H made `posRef` live, so the flight starts where the bee is. The
// particles it drops did not: every trail dot and every pollen fleck in the
// app rendered at the container's top-left corner, for as long as the pool
// has existed. Measured on device, 20 frames of ambient cruise: one 6.0 x 6.0
// pt `accentBurst` square at (2.8, 2.8) pt in 20 of 20 frames, and not one
// particle anywhere near the bee. The named glow of §17.3 R51 and the pollen
// of §20.7 have never been on a screen.
//
// The cause is two deliberate steps in RN 0.86.2, both measured in the
// running app rather than read:
//
//   1. `createAnimatedPropsMemoHook.js:162-189` builds the memo key that
//      decides whether to rebuild an `AnimatedProps` node from `AnimatedNode`
//      instances ONLY. A plain number becomes `null` in that key. Two styles
//      differing only in `translateX` (0 -> 211) compare
//      `areCompositeKeysEqual === true`, so the node is reused, forever.
//   2. `AnimatedTransform.js:147-156` bakes every non-node entry into the
//      native config as `{type: 'static', value}`. That config is generated
//      once, when the node goes native. Measured on a pool slot:
//      `{"type":"static","property":"translateX","value":0}`.
//
// The JS render path is fine — `__getValueWithStaticTransforms` reads the
// FRESH array every render — which is exactly why a state dump of the pool
// showed twelve correctly positioned particles while the screen showed one
// stack of them in the corner. The model was right. Only the native side was
// stale, and the native side is what you see.
//
// R89's shape, one layer over, and with the same tell: the initialiser
// happened to be the correct value at the only place anyone looked.
//
// WHAT THESE ROWS DO NOT CLAIM. A non-node entry is not a defect — it is a
// CONSTANT, and a constant baked once is correct. Whether a given expression
// is constant for the life of a mount is not decidable here, so I1 asserts
// only the part that is: an entry the file itself can be seen to CHANGE.
// The sites that are constant today by call-site coincidence rather than by
// construction (`MascotBee.js:94`'s hinge offsets, derived from a `size`
// prop no caller currently varies) are named in §28.13 instead, because a
// row that fails a correct tree is a row people learn to edit.
{
  const NAME = 'I1 §28.13 — no transform array mixes an Animated node with a value the file mutates';
  const offenders = [];
  let arrays = 0;
  let nodeArrays = 0;

  // Resolvably an Animated node: built by the Animated API, or an identifier
  // whose single declarator is. Deliberately conservative — an entry this
  // cannot call a node is simply treated as a plain value, which can only
  // make the row stricter, never blinder.
  const NODE_INIT = /new\s+Animated\.Value\s*\(|\.interpolate\s*\(|Animated\.(?:add|subtract|multiply|divide|modulo|diffClamp)\s*\(/;

  for (const file of [path.join(ROOT, 'App.js'), ...(await jsFiles(path.join(ROOT, 'src')))]) {
    const src = await readFile(file, 'utf8');
    if (!src.includes('transform:')) continue;
    const ast = parseJs(src);

    // Everything this file assigns to, by printed path: `slot.pos.x = 5`
    // records `slot.pos.x`, and `setPos(...)` records nothing (a setter's
    // name is not the value's name, so state is caught by its own rule).
    const mutated = new Set();
    const stateful = new Set();
    walk(ast.program, (n) => {
      if (n.type === 'AssignmentExpression' && n.left?.type === 'MemberExpression') {
        mutated.add(src.slice(n.left.start, n.left.end).replace(/\s+/g, ''));
      }
      // `const [x, setX] = useState(...)` — x changes by definition.
      if (
        n.type === 'VariableDeclarator' &&
        n.id?.type === 'ArrayPattern' &&
        n.init?.type === 'CallExpression' &&
        n.init.callee?.name === 'useState'
      ) {
        const first = n.id.elements[0];
        if (first?.type === 'Identifier') stateful.add(first.name);
      }
    });

    const declInit = new Map();
    walk(ast.program, (n) => {
      if (n.type !== 'VariableDeclarator' || n.id?.type !== 'Identifier' || !n.init) return;
      const prev = declInit.get(n.id.name);
      // Two declarators of one name is ambiguous — record the ambiguity
      // rather than the last one seen.
      declInit.set(n.id.name, prev === undefined ? src.slice(n.init.start, n.init.end) : null);
    });

    // Every dotted property path in this file that is declared holding an
    // Animated node, e.g. `pos.x` from `pos: { x: new Animated.Value(0) }`.
    //
    // The first draft of this row resolved a member expression through its
    // ROOT identifier's declarator, and `const slot = takeSlot()` appears
    // twice, so `slot` was ambiguous, nothing in the particle array resolved,
    // and the array was skipped as "contains no Animated node". The row then
    // reported a clean pass about an array it could not see — which is the
    // shape R73 named: the place a check declines to have an opinion must not
    // look like the place it has a clean one. Found by mutation: restoring the
    // exact defect this row exists for left it GREEN.
    const nodePaths = new Set();
    const collect = (obj, prefix) => {
      for (const p of obj.properties) {
        if (p.type !== 'ObjectProperty') continue;
        const key = p.key?.name ?? p.key?.value;
        if (key == null) continue;
        const dotted = prefix ? `${prefix}.${key}` : key;
        if (p.value?.type === 'ObjectExpression') collect(p.value, dotted);
        else if (NODE_INIT.test(src.slice(p.value.start, p.value.end))) nodePaths.add(dotted);
      }
    };
    walk(ast.program, (n) => {
      if (n.type === 'ObjectExpression') collect(n, '');
    });

    const isNode = (v) => {
      const text = src.slice(v.start, v.end);
      if (NODE_INIT.test(text)) return true;
      if (v.type === 'Identifier') {
        const init = declInit.get(v.name);
        return typeof init === 'string' && NODE_INIT.test(init);
      }
      if (v.type === 'MemberExpression') {
        // Match the longest property-path suffix, so `slot.pos.x` resolves
        // against `pos.x` without needing to know what `slot` is. The object
        // a pool hands out is described by the pool's own declaration, and
        // that is the thing worth reading.
        const parts = text.replace(/\s+/g, '').split('.');
        for (let i = 1; i < parts.length; i += 1) {
          if (nodePaths.has(parts.slice(i).join('.'))) return true;
        }
        return false;
      }
      return false;
    };

    walk(ast.program, (n) => {
      if (n.type !== 'ObjectProperty') return;
      if ((n.key?.name ?? n.key?.value) !== 'transform') return;
      if (n.value?.type !== 'ArrayExpression') return;
      arrays += 1;

      const entries = [];
      for (const el of n.value.elements) {
        if (el?.type !== 'ObjectExpression') continue;
        for (const p of el.properties) {
          if (p.type !== 'ObjectProperty') continue;
          entries.push({ prop: p.key?.name ?? p.key?.value, value: p.value });
        }
      }
      if (!entries.some((e) => isNode(e.value))) return;
      nodeArrays += 1;

      const rel = `${path.relative(ROOT, file)}:${n.loc.start.line}`;
      for (const e of entries) {
        if (isNode(e.value)) continue;
        const text = src.slice(e.value.start, e.value.end).replace(/\s+/g, ' ');
        const flat = text.replace(/\s+/g, '');
        if (mutated.has(flat)) {
          offenders.push(
            `${rel} \`${e.prop}: ${text}\` is not an Animated node and this file assigns to \`${flat}\` — it is baked into the native config once and every later write is invisible on screen (§28.13)`
          );
        } else if (e.value.type === 'Identifier' && stateful.has(e.value.name)) {
          offenders.push(
            `${rel} \`${e.prop}: ${text}\` is not an Animated node and \`${text}\` is React state — a re-render cannot rebuild the memoised AnimatedProps node, so the rendered value is frozen at the first commit (§28.13)`
          );
        }
      }
    });
  }

  if (offenders.length === 0) {
    ok(`${NAME} — ${nodeArrays} of ${arrays} transform arrays contain an Animated node; no non-node entry in them is written by its own file`);
  } else {
    bad(NAME, offenders.join('; '));
  }
}

{
  // I2 — the particle pool itself, named rather than inferred. I1 is a rule
  // about a shape; this is a rule about the one array that had the defect,
  // and it is stricter: EVERY entry is a node, so there is nothing left for
  // a future edit to make constant by accident.
  const NAME = 'I2 §28.13 — every entry of the particle transform is an Animated node';
  const src = await readFile(FLYING_BEE, 'utf8');
  const ast = parseJs(src);

  // What a slot holds, as dotted leaf paths, read off the pool declaration's
  // own object literal rather than by regex over its text. The first draft
  // matched `/new Animated.Value/` against the whole `pos: { … }` fragment,
  // so `pos: { x: 0, y: new Animated.Value(0) }` passed on the strength of
  // `y` — membership existential where the rule is universal, which is the
  // hole R83 already named once. Found by mutating half the defect in.
  let poolPaths = null;
  walk(ast.program, (n) => {
    if (n.type !== 'VariableDeclarator' || n.id?.name !== 'trailPool' || !n.init) return;
    poolPaths = new Set();
    const collect = (obj, prefix) => {
      for (const p of obj.properties) {
        if (p.type !== 'ObjectProperty') continue;
        const key = p.key?.name ?? p.key?.value;
        if (key == null) continue;
        const dotted = prefix ? `${prefix}.${key}` : key;
        if (p.value?.type === 'ObjectExpression') collect(p.value, dotted);
        else if (/new\s+Animated\.Value\s*\(/.test(src.slice(p.value.start, p.value.end))) poolPaths.add(dotted);
      }
    };
    walk(n.init, (m) => {
      if (m.type === 'ObjectExpression') collect(m, '');
    });
  });

  const arrays = [];
  walk(ast.program, (n) => {
    if (n.type !== 'ObjectProperty') return;
    if ((n.key?.name ?? n.key?.value) !== 'transform') return;
    if (n.value?.type !== 'ArrayExpression') return;
    const entries = [];
    for (const el of n.value.elements) {
      if (el?.type !== 'ObjectExpression') continue;
      for (const p of el.properties) {
        if (p.type !== 'ObjectProperty') continue;
        entries.push({ prop: p.key?.name ?? p.key?.value, text: src.slice(p.value.start, p.value.end).replace(/\s+/g, '') });
      }
    }
    // The particle array is the one whose entries read off a pool slot. Found
    // by that property, not by a line number, so the row survives an edit
    // above it.
    if (entries.length && entries.every((e) => /^slot\./.test(e.text))) {
      arrays.push({ line: n.loc.start.line, entries });
    }
  });

  if (poolPaths === null) {
    bad(NAME, 'no `trailPool` declarator found in FlyingBee.js, so this row cannot resolve what a slot holds — CANNOT TELL, which is a fail');
  } else if (arrays.length !== 1) {
    bad(
      NAME,
      `expected exactly one transform array whose every entry reads a pool slot, found ${arrays.length}${arrays.length ? ` (lines ${arrays.map((a) => a.line).join(', ')})` : ' — the particle render may have been renamed, so this row cannot locate it, which is a fail'}`
    );
  } else {
    const [{ line, entries }] = arrays;
    // `slot.pos.x` must be declared at the leaf `pos.x`, not merely somewhere
    // under `pos`.
    const notNodes = entries.filter((e) => !poolPaths.has(e.text.split('.').slice(1).join('.')));
    if (notNodes.length) {
      bad(
        NAME,
        `FlyingBee.js:${line} — ${notNodes.map((e) => `\`${e.prop}: ${e.text}\``).join(', ')} does not resolve to an \`Animated.Value\` in the \`trailPool\` declaration, so it is baked into the native transform once (§28.13)`
      );
    } else {
      ok(`${NAME} — FlyingBee.js:${line}, ${entries.length} entries [${entries.map((e) => e.prop).join(', ')}], all resolving to Animated.Values in the pool`);
    }
  }
}

// =========================================================================
// K. The declared anchor sets (§32.2)
// =========================================================================
//
// This is the section J said it could not write. Its own comment read:
//
//   "`flightSequencer.js` still has no importer in `src/`, so no host declares
//    an anchor set and there is nothing to check the invariant AGAINST. The
//    row that matters most cannot be written until a host declares one, and it
//    is the row that turns this from a property of the engine into a property
//    of the app."
//
// A host declares one now. Section J proves things about `chooseAnchor` for
// synthetic anchor sets swept over n and depth; this section proves the sets
// the app actually ships are ones J's conclusions apply to. Neither is
// redundant and the split is Sage's §4 rule: J asserts a property of what it
// can import, K goes to the call sites it couldn't.
//
// The anchors are read out of the JSX rather than out of a table, because the
// table was the defect. Deezine's guide carried a per-state anchor count,
// Sage found it wrong within the hour (it counted affordances against a rule
// written in structural terms and missed the footer), and both of us then
// published corrections to a document nothing checks. `<PerchAnchor>` makes
// the count a consequence of the render tree; this section reads the same
// tree, so a drift between the two is not possible rather than merely
// unlikely.
console.log('\nK. the declared anchor sets (§32.2)');

const PERCH_HOSTS = [
  {
    file: 'src/screens/TodayTab.js',
    // Deezine's §32/R122 constraint, and on this screen it is load-bearing
    // rather than stylistic — every anchor is a full-width card in one padded
    // column, so the side is the ONLY thing that gives the set any x-extent.
    sidesOnly: true,
    // The column the full-width anchors live in, from the screen's own
    // `content` style. Read, not retyped: change the padding and the extent
    // this section computes moves with it.
    paddingStyle: 'content',
  },
  {
    file: 'src/screens/HoneycombTab.js',
    sidesOnly: false,
    paddingStyle: 'content',
  },
];

// The content column's horizontal insets, read off the screen's own
// stylesheet. Returns both edges rather than one number because the extent
// this section computes is left-edge to right-edge, and React Native lets the
// two differ (`paddingLeft` beats `paddingHorizontal` beats `padding`, most
// specific wins — the same precedence, in the same order, or the row measures
// a column the screen does not have).
const readPaddingH = (src, styleName) => {
  const block = src.match(new RegExp(`\\n  ${styleName}: \\{([\\s\\S]*?)\\n  \\}`))?.[1] ?? '';
  const value = (prop) => {
    const m = block.match(new RegExp(`(?:^|\\n)\\s*${prop}:\\s*([A-Za-z][\\w.]*|\\d+(?:\\.\\d+)?)`));
    if (!m) return null;
    if (/^\d/.test(m[1])) return Number(m[1]);
    // `theme.spacing.lg` and friends — resolved through the theme rather than
    // retyped, so a change to the scale moves this row with it.
    const key = m[1].split('.').pop();
    const t = themeSource.match(new RegExp(`\\n\\s*${key}: (\\d+)`));
    return t ? Number(t[1]) : null;
  };
  const all = value('padding');
  const horiz = value('paddingHorizontal');
  const left = value('paddingLeft') ?? horiz ?? all;
  const right = value('paddingRight') ?? horiz ?? all;
  return left === null || right === null ? null : { left, right };
};

const themeSource = await readFile(path.join(ROOT, 'src/constants/theme.js'), 'utf8');

// --- read every <PerchAnchor> off every host, with whether it is conditional
const perchSets = new Map();
for (const host of PERCH_HOSTS) {
  const src = await readFile(path.join(ROOT, host.file), 'utf8');
  const ast = parseJs(src);
  const anchors = [];
  // Parent chain, so "is this anchor inside a conditional arm" is answered by
  // structure rather than by a regex over indentation.
  const stack = [];
  const descend = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(descend);
    if (typeof node.type !== 'string') {
      for (const k of Object.keys(node)) if (k !== 'loc' && !k.endsWith('Comments')) descend(node[k]);
      return;
    }
    stack.push(node);
    if (node.type === 'JSXOpeningElement' && node.name?.name === 'PerchAnchor') {
      const props = {};
      node.attributes.forEach((a) => {
        if (a.type !== 'JSXAttribute') return;
        const v = a.value;
        props[a.name.name] =
          v === null ? true : v.type === 'StringLiteral' ? v.value : v.expression?.value;
      });
      // Conditional iff any ancestor is a ternary or a `&&` — that is what
      // makes an anchor present in some render states and absent in others,
      // and it is the whole of how the per-state count is derived here.
      const conditional = stack.some(
        (a) => a.type === 'ConditionalExpression' || a.type === 'LogicalExpression',
      );
      anchors.push({ ...props, line: node.loc.start.line, conditional });
    }
    for (const k of Object.keys(node)) if (k !== 'loc' && !k.endsWith('Comments')) descend(node[k]);
    stack.pop();
  };
  descend(ast.program);
  perchSets.set(host.file, { host, src, anchors, paddingH: readPaddingH(src, host.paddingStyle) });
}

// --- K1. every cruise mount has a set, and every set is readable ----------
{
  const cruiseHosts = CALL_SITES.filter((s) => s.preset === null && s.source);
  const missing = cruiseHosts.filter((s) => (perchSets.get(s.file)?.anchors.length ?? 0) === 0);
  if (missing.length === 0 && cruiseHosts.length === perchSets.size) {
    ok(
      `every cruise mount declares its own anchors (${cruiseHosts
        .map((s) => `${path.basename(s.file)} ${perchSets.get(s.file).anchors.length}`)
        .join(', ')})`,
    );
  } else {
    bad(
      'every cruise mount declares its own anchors',
      missing.length
        ? `${missing.map((s) => s.file).join(', ')} mounts <FlyingBee> with no <PerchAnchor> anywhere in the file`
        : `${cruiseHosts.length} cruise mounts but ${perchSets.size} anchor hosts — this section's host table has drifted from the call sites`,
    );
  }
}

// --- K2. ids are unique and sides are legal ------------------------------
//
// The id is `chooseAnchor`'s anti-repeat key. Two anchors sharing one is a bee
// that thinks it has already been to a place it has never been — the memory
// silently blocks the wrong destination, and nothing anywhere else would show
// it. The side is R122: `resolvePerchPoint` accepts only 'left' and 'right',
// and anything else resolves to the left edge without complaint.
for (const [file, { anchors, host }] of perchSets) {
  const ids = anchors.map((a) => a.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const badSides = anchors.filter((a) => !['left', 'right'].includes(a.on));
  const badAt = anchors.filter((a) => !(typeof a.at === 'number' && a.at >= 0 && a.at <= 1));
  if (dupes.length === 0 && badSides.length === 0 && badAt.length === 0) {
    ok(
      `${path.basename(file)} declares ${anchors.length} anchors, ids unique, sides legal ` +
        `(${anchors.map((a) => `${a.id}:${a.on}@${a.at}`).join(', ')})`,
    );
  } else {
    bad(
      `${path.basename(file)} anchors have unique ids and legal sides`,
      `${dupes.length ? `duplicate ids: ${[...new Set(dupes)].join(', ')} — the anti-repeat memory is keyed on this; ` : ''}` +
        `${badSides.length ? `bad sides: ${badSides.map((a) => `${a.id}=${a.on}`).join(', ')} (resolvePerchPoint silently reads anything but 'right' as the left edge); ` : ''}` +
        `${badAt.length ? `bad fractions: ${badAt.map((a) => `${a.id}=${a.at}`).join(', ')}` : ''}`,
    );
  }
}

// --- K3. exactly one residence per host ----------------------------------
//
// Bee Doctrine State 1. `usePerchSet` resolves `homeKey` by taking the FIRST
// anchor declared with `home`, which means a second one is silent: the bee
// simply lives at whichever card mounted first, and nothing anywhere would
// show it. Runtime cannot reject it without removing the bee from a shipped
// screen, so the rejection belongs here.
//
// Zero is also a failure, and it is the more interesting one. A host that
// mounts a cruise `<FlyingBee>` and declares anchors but no `home` renders no
// bee at all — `sequenceHalted` is true — so the screen keeps its anchors,
// keeps its mount, and quietly loses its resident. That is a deletion nobody
// wrote, which is exactly the shape K6 exists for on the other two removals.
//
// **Per render state, not per file.** An anchor inside a conditional arm is
// absent in the states that do not render that arm, so a file whose only
// `home` is conditional has render states with no residence. That is legal
// only where the same condition also suppresses the bee — TodayTab's error arm
// does exactly this (`perches={error ? null : perches}`, K6 row 2), so the row
// takes the suppression as the discharge rather than re-deriving it.
for (const [file, { anchors, src }] of perchSets) {
  const homes = anchors.filter((a) => a.home === true);
  const conditionalHomes = homes.filter((a) => a.conditional);
  const suppressed = /perches=\{[^}]*\?[^}]*:\s*perches\}|perches=\{[^}]*&&\s*perches\}/.test(src);
  const NAME = `${path.basename(file)} declares exactly one home anchor`;
  if (homes.length !== 1) {
    bad(
      NAME,
      homes.length === 0
        ? 'no <PerchAnchor home> on a screen that mounts a cruise <FlyingBee>. `homeKey` is null, ' +
          '`sequenceHalted` is true, and the screen renders no bee at all — the resident is gone ' +
          'and nothing else changes.'
        : `${homes.length} anchors marked home (${homes.map((a) => `${a.id}:${a.line}`).join(', ')}). ` +
          '`usePerchSet` takes the first in declaration order, so the bee lives wherever the tree ' +
          'happens to mount first — a residence decided by render order is not a residence.',
    );
  } else if (conditionalHomes.length === 1 && !suppressed) {
    bad(
      NAME,
      `the one home anchor (${homes[0].id}:${homes[0].line}) is inside a conditional arm, and this ` +
        'host does not suppress the bee on the other arm — so there is a render state with a mount, ' +
        'anchors, and nowhere to live.',
    );
  } else {
    ok(
      `${path.basename(file)} declares exactly one home anchor (${homes[0].id} ${homes[0].on}@${homes[0].at}` +
        `${conditionalHomes.length ? ', conditional — discharged by the call-site suppression' : ''})`,
    );
  }
}

// --- K4. a residence names its side ---------------------------------------
//
// R122a: the bee rests AT the anchor and is drawn centred on it, so a side
// puts half a character into whatever lies that way. `resolvePerchPoint`
// defaults to the LEFT edge, and on a full-width left-aligned block the left
// edge is where the glyphs begin — which is the defect this doctrine pass
// exists to fix, a streak caption reading "2 ays to 3." under a resting bee.
//
// **What this row does NOT assert, and the distinction is the point.** It does
// not say a home must be `on: 'right'`. That would be a false universal of
// exactly the kind this project keeps re-learning: 'right' is negative space
// on a left-aligned full-width block and is CONTENT on a right-aligned icon
// row (HoneycombTab's `header-actions`, which is why that one is a landing
// site and not a residence). Whether a given side lands on glyphs is a
// question about a rendered frame, and a gate that cannot see one must not
// pretend to answer it.
//
// What it can assert is that somebody DECIDED. A defaulted side on a
// permanent position is the one case where the author demonstrably did not
// consider it, because the default is the failing side.
for (const [file, { anchors }] of perchSets) {
  const home = anchors.find((a) => a.home === true);
  if (!home) continue; // K3 already failed this host; one defect, one row.
  const NAME = `${path.basename(file)} the home anchor states its side explicitly`;
  if (home.on === undefined) {
    bad(
      NAME,
      `${home.id}:${home.line} is marked home with no \`on\`, so it takes resolvePerchPoint's ` +
        "default of 'left'. A resident sits there permanently; the side is the one thing about a " +
        'residence that has to be a decision.',
    );
  } else {
    ok(`${path.basename(file)} home anchor ${home.id} states on="${home.on}" explicitly`);
  }
}

// --- K5. rest is a position, not an animation -----------------------------
//
// The doctrine's claim to Colin is a budget claim: an idle screen with the bee
// on it should cost what the same screen costs without him. That rests on one
// mechanism — `buildRestPlan` returns `durationMs: null`, and the driver reads
// null as "place him and stop" rather than starting a timing.
//
// Both halves are checked, on the two different objects that carry them (the
// R85(e) shape). The module is SAMPLED, not read: `buildRestPlan` is called
// and its output inspected, so a rest plan that acquired a duration through
// any path at all fails here. The call site is READ, because "there is no
// `Animated.timing` on this branch" is a statement about source.
//
// A zero would pass a naive "no duration" check and be wrong: an
// `Animated.timing` of 0ms still runs, still completes, and still fires the
// callback that would advance a machine the doctrine says has nowhere to go.
{
  const NAME = 'K5 rest is a position — buildRestPlan carries no duration, and the driver starts no timing for it';
  const plan = sequencer.buildRestPlan({ at: { x: 40, y: 90 }, width: 402, height: 874, heldFacing: -1 });
  const beeSrc = await readFile(path.join(ROOT, 'src/components/FlyingBee.js'), 'utf8');
  const branch = /if \(plan && plan\.durationMs === null\) \{\s*\n\s*return \(\) => loopRef\.current\?\.stop\(\);/.test(beeSrc);
  const problems = [];
  if (plan.durationMs !== null) problems.push(`buildRestPlan returned durationMs ${plan.durationMs}, not null`);
  if (plan.path.length !== 2 || plan.path[0].x !== plan.path[1].x || plan.path[0].y !== plan.path[1].y)
    problems.push('the rest path is not two identical waypoints, so t moving would move the bee');
  if (plan.flutter !== false) problems.push('the rest plan asks for the airborne wingbeat');
  if (plan.trail !== false) problems.push('the rest plan asks for a trail, which would pile particles at one point');
  if (!branch) problems.push('FlyingBee has no `plan.durationMs === null` early return before the timing driver — a null duration reaching Animated.timing is an animation of duration null, not the absence of one');
  if (problems.length === 0) {
    ok(`${NAME} (kind '${plan.kind}', durationMs ${plan.durationMs}, two identical waypoints, flutter false, trail false)`);
  } else {
    bad(NAME, problems.join('; '));
  }
}

// --- K6. the two ratified suppressions are still wired -------------------
//
// Both are BEHAVIOUR REMOVALS that Lumen ratified on 2026-08-17, and both are
// one expression at a call site. That is the right shape and it is also the
// easy shape to delete by accident while doing something else, at which point
// a bee reappears over the week feed or over failure copy and nothing fails.
// A removal that was argued for deserves a row.
{
  const rows = [
    {
      file: 'src/screens/HoneycombTab.js',
      want: /perches=\{hiveView === 'week' \? null : perches\}/,
      what: "week view gets no bee (a feed is for reading)",
    },
    {
      file: 'src/screens/TodayTab.js',
      want: /perches=\{error \? null : perches\}/,
      what: 'the error arm gets no bee (a mascot doing laps over failure copy performs cheerfulness at failure)',
    },
  ];
  const broken = rows.filter((r) => !r.want.test(perchSets.get(r.file).src));
  if (broken.length === 0) {
    ok(`both ratified suppressions are wired at their call sites (${rows.map((r) => r.what).join('; ')})`);
  } else {
    bad(
      'both ratified suppressions are wired at their call sites',
      `${broken.map((r) => `${path.basename(r.file)}: ${r.what}`).join('; ')} — the guard is gone and the ` +
        'bee is back on a surface a ruling took it off.',
    );
  }
}

// --- K7. a cascade step the bee cannot reach -----------------------------
//
// SAGE'S FINDING, AS A ROW (2026-08-17). K1-K6 all read the DECLARED set —
// they enumerate `PerchAnchor` nodes and measure them. So they are blind in
// exactly one direction: a screen that grows a new top-level region carrying
// no anchor stays green, because the thing that is missing is the thing the
// collector enumerates. `fizz/private-hives-rails` adds an unconditional
// `<StaggeredItem index={3}>` shelf to TodayTab with no anchor in it; the
// merge is one trivial conflict hunk in the `useState` block, so the half
// that needs a decision is the half git resolves silently.
//
// A GATE THAT ENUMERATES X CANNOT SEE A MISSING X. So this row asserts the
// direction the others cannot:
//
//   every top-level `StaggeredItem` on a screen that declares a perch set
//   is contained by a `PerchAnchor`, or contains one that renders in EVERY
//   state the step itself renders in.
//
// That last clause is not decoration — see `anchorsInEveryState` below for
// the green-and-wrong shape it exists to catch.
//
// ONE DIRECTION, NOT A BIJECTION, and the difference is not a detail. The
// obvious reading is Bumble's `check-migration-sentinels` shape, which
// checks both ways — but he needs both because his sentinel table is a
// SECOND COPY of the migration list, and either copy can drift. The anchor
// set is not a copy of anything; `PerchAnchor.js`'s header says it outright
// ("THE ANCHOR SET IS NOT A TABLE, IT IS THE RENDER TREE"). An anchor for a
// region that does not render cannot exist, because the anchor IS the
// region. So the converse has no content to assert, and asserting it anyway
// is red on a correct tree: measured on this branch, TodayTab declares 3
// cascade steps and 4 anchors — the badge sits in `ScreenHeader`'s `right`
// slot with no cascade step of its own — and HoneycombTab declares 3
// anchors and no cascade at all. A bijection reds four times on the tree it
// lands on. A RULE MUST BE STATED IN THE DIRECTION THAT HAS CONTENT.
//
// WHY `StaggeredItem` AND NOT "every child of the content container": the
// general rule is false. HoneycombTab's scroll content has many direct
// children that are legitimately not anchors (the controls, the feed, the
// week list Lumen ratified as perch-only at the toggle), so a row demanding
// an anchor per child would be red on a screen that is correct. What
// `StaggeredItem` marks is narrower and is the right thing: a deliberate
// cascade step — a region the designer already declared arrives on its own
// and reads as a place. That is the same population the bee should be able
// to visit.
//
// NO EXEMPTION LIST, and that is a considered refusal rather than an
// omission. There are zero exemptions today, so a list would be AN EMPTY
// LIST WITH A DOOR IN IT (R83, where I declined one for the same reason).
// The deeper argument is §32.2's own: the anchor set is the render tree,
// not a table. Putting the NEGATIVE in a table reintroduces exactly the
// drift `PerchAnchor` was built to remove — a row saying "this shelf is
// deliberately unreachable" would sit in this file, outlive the shelf, and
// nobody reading the screen would ever see it. If a cascade step must be
// exempt, that belongs at the call site where a reviewer meets it, and it
// arrives with the ruling that justifies it.
{
  const hostSteps = [];
  for (const [file, { src }] of perchSets) {
    const ast = parseJs(src);
    const steps = [];
    const stack = [];
    // An anchor makes the region reachable whether it is INSIDE the step or
    // WRAPS it — both are live shapes in this repo (TodayTab nests the anchor
    // inside; HoneycombTab wraps `HoneycombGrid` from outside). Checking only
    // the subtree would red on a correct screen.
    //
    // PRESENCE ONLY. This one answers "is there an anchor down there at all",
    // which is not the property the row asserts — it exists so a failure can
    // name WHICH defect it found (no anchor, or an anchor on some renders).
    const hasAnchorSomewhere = (node) => {
      let found = false;
      const walk = (n) => {
        if (found || !n || typeof n !== 'object') return;
        if (Array.isArray(n)) return n.forEach(walk);
        if (n.type === 'JSXOpeningElement' && n.name?.name === 'PerchAnchor') {
          found = true;
          return;
        }
        for (const k of Object.keys(n)) if (k !== 'loc' && !k.endsWith('Comments')) walk(n[k]);
      };
      walk(node);
      return found;
    };
    // AN ANCHOR IS ONLY AN ANCHOR IN THE STATES IT RENDERS IN.
    //
    // Sage's second finding (2026-08-17), and it is K3's and K4's lesson
    // arriving a third time inside the row I wrote BECAUSE of it: THE
    // INVARIANT IS ABOUT THE WORST RENDER STATE, NOT THE DECLARED SET. The
    // obvious way to anchor the hive shelf is to do it only when there is
    // something on it —
    //
    //     {hives.length > 0
    //        ? <PerchAnchor id="hive-shelf" …><View style={styles.hiveShelf}/></PerchAnchor>
    //        : <View style={styles.hiveShelf}/>}
    //
    // — and a presence walk finds the anchor and goes green. The state it is
    // wrong in is `hives.length === 0`: the first-run state, which is the
    // exact state the shelf ruling turned on. The row built to catch that
    // region would have passed the version of it that ships the defect.
    //
    // So `anchored` is not "an anchor exists below". It is: AN ANCHOR RENDERS
    // IN EVERY STATE THIS STEP RENDERS IN. Descending through a
    // `ConditionalExpression` therefore costs BOTH arms, and a
    // `LogicalExpression` is never certain, because its JSX operand is
    // precisely the one that may not render.
    //
    // THIS IS A DIFFERENT QUESTION FROM THE `conditional` FLAG BELOW, and the
    // footer proves they must stay two questions. `conditional` describes the
    // step's OWN ancestry — whether the `StaggeredItem` is itself inside a
    // branch. Index 2 is a conditional step holding an unconditional anchor,
    // which is CORRECT and must stay green. This asks about the path BETWEEN
    // the step and its anchor. Collapsing them would red the footer.
    //
    // WHAT IT CANNOT SEE: a branch that is not syntax. A component that
    // declines to render its children (`<Modal visible={x}>`) hides the same
    // hole behind a prop, and no AST walk reaches it. Neither host does that
    // today; if one ever does, this row will say yes and be wrong, and the
    // honest place to catch it is the call site.
    //
    // AN ANCHOR IN BOTH ARMS PASSES THIS ROW, AND YOU SHOULD STILL NOT WRITE
    // ONE. Both arms carrying an anchor does mean one renders in every state,
    // so a green here is correct — but the only spelling that gets there
    // gives ONE REGION TWO IDENTITIES, because written the natural way (one
    // region, one name) K2 reds on `duplicate ids: hive-shelf` (measured, not
    // reasoned: Sage's correction to a note of mine that stopped one step
    // short). And `PerchAnchor.js:117` says what two identities cost — the
    // anti-repeat memory is keyed on `id`, so two names for one place are two
    // places to `chooseAnchor`. Hoist the anchor ABOVE the ternary: one id,
    // unconditional, and the question does not arise.
    //
    // K3 DISAGREES WITH THIS ROW ON THAT SHAPE, AND THE DISAGREEMENT IS
    // FAIL-SAFE, WHICH IS WHY THERE IS NO ROW JOINING THEM. K3 measures each
    // anchor's own conditionality, so it cannot see that a pair is jointly
    // total and reads `2 unconditional of 6` where this row reads reachable.
    // That is an UNDERCOUNT against a `>= FLOOR` assertion, and an undercount
    // there can only ever produce a false RED — a conversation. This row's
    // old defect ran the other direction, which is what made it worth an
    // evening. Naming the direction is the point: "these two disagree" invites
    // a reconciliation, and the reconciliation is the row not to build.
    const anchorsInEveryState = (n) => {
      if (!n || typeof n !== 'object') return false;
      if (Array.isArray(n)) return n.some(anchorsInEveryState);
      if (n.type === 'JSXElement' && n.openingElement?.name?.name === 'PerchAnchor') return true;
      if (n.type === 'ConditionalExpression') {
        return anchorsInEveryState(n.consequent) && anchorsInEveryState(n.alternate);
      }
      if (n.type === 'LogicalExpression') return false;
      for (const k of Object.keys(n)) {
        if (k === 'loc' || k.endsWith('Comments')) continue;
        if (anchorsInEveryState(n[k])) return true;
      }
      return false;
    };
    const descend = (node) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) return node.forEach(descend);
      if (typeof node.type !== 'string') {
        for (const k of Object.keys(node)) if (k !== 'loc' && !k.endsWith('Comments')) descend(node[k]);
        return;
      }
      stack.push(node);
      if (node.type === 'JSXElement' && node.openingElement?.name?.name === 'StaggeredItem') {
        const idxAttr = node.openingElement.attributes.find(
          (a) => a.type === 'JSXAttribute' && a.name.name === 'index',
        );
        // UPWARD, DOMINANCE IS FREE — and the asymmetry with the subtree walk
        // above is the point, not an oversight. If a `PerchAnchor` is an
        // ANCESTOR of the step, then every state in which the step renders is
        // a state in which the anchor rendered, because nothing renders
        // without its ancestors. A branch between them decides only whether
        // the STEP renders, and a step that does not render needs nowhere to
        // land. Downward that implication fails, which is why the walk below
        // the step counts branch nodes and this one does not.
        const wrapped = stack.some(
          (a) =>
            a !== node &&
            a.type === 'JSXElement' &&
            a.openingElement?.name?.name === 'PerchAnchor',
        );
        steps.push({
          line: node.openingElement.loc.start.line,
          index: idxAttr?.value?.expression?.value ?? idxAttr?.value?.value ?? '?',
          anchored: wrapped || anchorsInEveryState(node),
          // Not the verdict — the discriminator that lets the failure say
          // which of the two defects this step has.
          anchorSomewhere: wrapped || hasAnchorSomewhere(node),
          conditional: stack.some(
            (a) => a !== node && (a.type === 'ConditionalExpression' || a.type === 'LogicalExpression'),
          ),
        });
      }
      for (const k of Object.keys(node)) if (k !== 'loc' && !k.endsWith('Comments')) descend(node[k]);
      stack.pop();
    };
    descend(ast.program);
    hostSteps.push({ file, steps });

    const orphans = steps.filter((s) => !s.anchored);
    if (steps.length === 0) {
      // VACUOUS, AND IT SAYS SO. A host with no cascade steps has nothing for
      // this rule to bind to, and a silent `ok` here would read exactly like a
      // host that was checked and found clean. CANNOT TELL MUST NOT LOOK LIKE
      // A CLEAN NO.
      ok(
        `${path.basename(file)} declares no cascade steps, so the reachability rule is vacuous here ` +
          '(its anchors are declared directly, not as StaggeredItem children) — checked nothing, and says so',
      );
    } else if (orphans.length === 0) {
      ok(
        `${path.basename(file)} every cascade step reaches an anchor in every state it renders in ` +
          `(${steps.map((s) => `index ${s.index}${s.conditional ? ' (conditional step)' : ''}`).join(', ')})`,
      );
    } else {
      // TWO DEFECTS, NAMED APART. "No anchor" and "an anchor on some renders"
      // are fixed by different edits, and the second is the one that looks
      // finished, so a message that merged them would send the reader to the
      // wrong place.
      const detail = orphans
        .map(
          (s) =>
            `index ${s.index} at :${s.line}` +
            `${s.conditional ? ' (conditional step)' : ''} — ` +
            (s.anchorSomewhere
              ? 'its anchor is inside a branch, so it is absent in at least one render state'
              : 'no anchor at all'),
        )
        .join('; ');
      bad(
        `${path.basename(file)} every cascade step reaches an anchor in every state it renders in`,
        `${orphans.length} of ${steps.length} cascade step(s) fail: ${detail}. ` +
          'A top-level StaggeredItem is a region that reads as a place on the screen, and one the bee ' +
          'cannot reach is dead surface — the other K rows cannot see this, because what is missing is ' +
          'the node they enumerate. An anchor that renders only on some states is the same defect wearing ' +
          'a green face: it is absent exactly in the state it is absent in, and that state is usually the ' +
          'empty one a new user sees first. Either anchor it unconditionally, or land the ruling that says ' +
          'it is deliberately unreachable, at the call site where a reviewer meets it.',
      );
    }
  }

  // THE ROW MUST BIND SOMEWHERE. Every per-host branch above can pass by
  // being vacuous, so without this the whole section could go green on a tree
  // where `StaggeredItem` had been renamed and nothing was being checked at
  // all — green by blindness rather than by the property holding.
  const bound = hostSteps.reduce((n, h) => n + h.steps.length, 0);
  if (bound > 0) {
    ok(
      `the cascade-step reachability rule is exercised: ${bound} step(s) across ` +
        `${hostSteps.filter((h) => h.steps.length).length} of ${hostSteps.length} perch host(s)`,
    );
  } else {
    bad(
      'the cascade-step reachability rule is exercised on at least one host',
      'no <StaggeredItem> was found on any perch host, so every branch above passed vacuously. ' +
        'Either the cascade component was renamed and this row is now looking for a node that no ' +
        'longer exists, or the hosts changed shape — in both cases this row is asserting nothing.',
    );
  }
}


console.log('\nL. Reduce Motion moves nothing, including the bee');

// P1a, 2026-08-28. `flightSuppressed = reduced || !active` gated WHERE THE BEE
// IS as well as whether he moves, so a Reduce Motion user got a bee in the
// bottom-right corner instead of the residence their screen declared. That is
// not a suppressed motion, it is a relocation — and it is the one thing Reduce
// Motion must not do, because State 1 is a POSITION (`durationMs: null`, zero
// drivers) and there is no motion in it to suppress. Under P1a it stops being
// a quirk: the stage light comes up on the greeting and the hero is in the
// opposite corner.
//
// THE ROWS EVALUATE THE GUARDS, THEY DO NOT READ THEM. The first draft of this
// section asked which identifiers a guard's expansion contained, and it went
// red on correct code: the live guard is `presetDef ? flightSuppressed :
// residentSuppressed`, whose expansion contains `reduced` on a branch a
// resident never takes. Membership in an expansion is not reachability — so
// each row below reconstructs the guard's own source together with the
// declarations it depends on, binds the case it is about, and RUNS it. That
// makes the rows immune to spelling and to how the ternary is factored, and it
// is the only form in which "the resident branch does not see Reduce Motion"
// is actually the claim being checked.
{
  const visitNode = (node, fn) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach((n) => visitNode(n, fn)); return; }
    if (typeof node.type === 'string') fn(node);
    for (const k of Object.keys(node)) {
      if (k === 'loc' || k === 'leadingComments' || k === 'trailingComments' || k === 'comments') continue;
      if (node.type === 'MemberExpression' && k === 'property' && !node.computed) continue;
      if (node.type === 'ObjectProperty' && k === 'key' && !node.computed) continue;
      visitNode(node[k], fn);
    }
  };

  const declOf = (tree) => {
    const m = new Map();
    visitNode(tree, (n) => {
      if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init) m.set(n.id.name, n);
    });
    return m;
  };

  // Transitive identifier closure, stopping at the names the caller BINDS. A
  // bound name is a leaf on purpose: `presetDef`'s own initialiser reaches
  // `PRESETS` and the whole track builder, none of which a guard's truth value
  // depends on once you have said which case you are asking about.
  const dependsOn = (node, decls, bound) => {
    const seen = new Set(bound);
    const order = [];
    const walk = (n, depth) => {
      if (depth > 8) return;
      const names = [];
      visitNode(n, (x) => { if (x.type === 'Identifier') names.push(x.name); });
      for (const nm of names) {
        if (seen.has(nm)) continue;
        seen.add(nm);
        const d = decls.get(nm);
        if (d) { walk(d.init, depth + 1); order.push(nm); }
      }
    };
    walk(node, 0);
    return order;
  };

  // Rebuild the guard as runnable JS: its dependencies in source order, then
  // the guard's own expression, with the case bound as parameters.
  const evalGuard = (src, testNode, decls, bindings) => {
    const names = dependsOn(testNode, decls, new Set(Object.keys(bindings)));
    const needed = names
      .map((nm) => decls.get(nm))
      .sort((a, b) => a.start - b.start)
      .map((d) => `const ${d.id.name} = ${src.slice(d.init.start, d.init.end)};`);
    const body = `${needed.join('\n')}\nreturn (${src.slice(testNode.start, testNode.end)});`;
    // eslint-disable-next-line no-new-func
    const fn = new Function(...Object.keys(bindings), body);
    return fn(...Object.values(bindings));
  };

  // The branch that draws the corner pose, found by the STYLE IT DRAWS rather
  // than by a variable name.
  const parkedGuard = (tree) => {
    let found = null;
    visitNode(tree, (n) => {
      if (found || n.type !== 'IfStatement') return;
      let draws = false;
      visitNode(n.consequent, (x) => {
        if (
          x.type === 'MemberExpression' &&
          x.object.type === 'Identifier' && x.object.name === 'styles' &&
          x.property.type === 'Identifier' && x.property.name === 'parkedAnchor'
        ) draws = true;
      });
      if (draws) found = n;
    });
    return found;
  };

  // The effect that OPENS the sequence — `start()` is where a resident is
  // seated at his anchor, so its stop-guard decides whether he is seated at all.
  const guardOfEffectContaining = (tree, marker, consequentMarker) => {
    let effect = null;
    visitNode(tree, (n) => {
      if (effect) return;
      if (n.type !== 'CallExpression' || n.callee.type !== 'Identifier' || n.callee.name !== 'useEffect') return;
      let hit = false;
      visitNode(n.arguments[0], (x) => { if (x.type === 'Identifier' && x.name === marker) hit = true; });
      if (hit) effect = n;
    });
    if (!effect) return null;
    let guard = null;
    visitNode(effect.arguments[0]?.body, (n) => {
      if (guard || n.type !== 'IfStatement') return;
      if (!consequentMarker) { guard = n; return; }
      let hit = false;
      visitNode(n.consequent, (x) => { if (x.type === 'Identifier' && x.name === consequentMarker) hit = true; });
      if (hit) guard = n;
    });
    return guard;
  };

  // The two cases every row below is stated in. `RM` is the one the fix is
  // about; `ASIDE` is the case the corner pose actually exists for, and it is
  // here so a row can distinguish "unreachable from Reduce Motion" from
  // "unreachable", which are very different repairs.
  const RM = { presetDef: null, reduced: true, active: true, layout: { width: 393, height: 852 }, sequenceHalted: false, plan: null };
  const ASIDE = { ...RM, reduced: false, active: false };
  const PRESET_RM = { ...RM, presetDef: { duration: 900 } };

  const run = (src, tree) => {
    const decls = declOf(tree);
    const parked = parkedGuard(tree);
    const drive = guardOfEffectContaining(tree, 'start', 'loopRef');
    const trail = guardOfEffectContaining(tree, 'trailTimerRef', null);
    if (!parked || !drive || !trail) return { missing: { parked: !parked, drive: !drive, trail: !trail } };
    return {
      parkedUnderRM: evalGuard(src, parked.test, decls, RM),
      parkedWhenAside: evalGuard(src, parked.test, decls, ASIDE),
      driveStoppedUnderRM: evalGuard(src, drive.test, decls, RM),
      driveStoppedForPresetUnderRM: evalGuard(src, drive.test, decls, PRESET_RM),
      trailStoppedUnderRM: evalGuard(src, trail.test, decls, RM),
    };
  };

  let live;
  try {
    live = run(flyingBeeSource, flyingBeeAst);
  } catch (err) {
    live = { error: err.message };
  }

  if (live.error || live.missing) {
    const why = live.error
      ? `the guards would not evaluate: ${live.error}`
      : `could not locate ${Object.entries(live.missing).filter(([, v]) => v).map(([k]) => k).join(', ')}`;
    bad('L1-L3 the residence survives Reduce Motion', `${why}. Fails closed: an unreadable guard is not a passing one.`);
  } else {
    // L1 — the corner pose is unreachable from Reduce Motion, and still
    // reachable from the thing it is for.
    if (live.parkedUnderRM) {
      bad(
        'L1 Reduce Motion does not relocate the resident',
        'with `reduced` true and the host active, the branch that draws `styles.parkedAnchor` is TAKEN. ' +
          'Reduce Motion would move the bee out of the residence his screen declared and into the ' +
          "bottom-right corner — and P1a's stage light would come up on nobody.",
      );
    } else if (!live.parkedWhenAside) {
      bad(
        'L1 Reduce Motion does not relocate the resident',
        'the corner pose is unreachable from Reduce Motion, but it is also unreachable from `active: false` — ' +
          'so it is unreachable, not fixed. "Stand aside" is the case the pose exists for; if that is ' +
          'genuinely gone, delete the pose rather than leaving a branch nothing can enter.',
      );
    } else {
      ok('L1 the corner pose is entered by `active: false` and NOT by Reduce Motion — Reduce Motion stops the bee moving, it does not move him');
    }

    // L2 — and the effect that SEATS him runs, so `onSettle` fires and
    // anything cued by it arrives.
    if (live.driveStoppedUnderRM) {
      bad(
        'L2 the resident is seated under Reduce Motion',
        'the effect that calls `start()` is stopped when `reduced` is true, so the resident is never ' +
          'placed at his anchor, `onSettle` never fires, and every consumer cued by it (the MB-D1 bloom, ' +
          "a choreographed greeting) is dead for Reduce Motion users — DES-17's forfeit class.",
      );
    } else if (!live.driveStoppedForPresetUnderRM) {
      bad(
        'L2 the resident is seated under Reduce Motion',
        'the resident is seated, but a PRESET arc is no longer stopped under Reduce Motion either — ' +
          'that is an entrance flight playing for someone who asked the OS to stop them.',
      );
    } else {
      ok('L2 under Reduce Motion the resident is seated (`start()` runs, `onSettle` fires) and preset arcs are still stopped');
    }

    // L3 — CONTROL. Without it, deleting `reduced` from the file passes L1 and
    // L2 identically, which is the opposite defect.
    if (!live.trailStoppedUnderRM) {
      bad(
        'L3 Reduce Motion still suppresses the motions',
        'the trail effect runs under Reduce Motion. The split was supposed to take Reduce Motion off the ' +
          'ADDRESS, not off the motions — and without this row, a file with `reduced` simply deleted ' +
          'passes L1 and L2.',
      );
    } else {
      ok('L3 control: the trail is still stopped under Reduce Motion — the split removed Reduce Motion from the address, not from the motions');
    }
  }

  // L4 — CALIBRATION, red direction. A green L1/L2 proves the evaluator ran.
  // It does not prove the evaluator can SEE the defect, so put the defect back
  // into a copy of the source and require both findings to flip.
  {
    const mutated = flyingBeeSource.replace(
      /const residentSuppressed = !active;/,
      'const residentSuppressed = reduced || !active;',
    );
    if (mutated === flyingBeeSource) {
      bad(
        'L4 the rows can see the defect they exist to catch',
        'the mutation matched nothing, so this calibration ran against an unmodified source. The ' +
          'residency binding is spelled differently now — re-point the mutation at the live declaration; ' +
          'an uncalibrated L1 announces nothing.',
      );
    } else {
      let m;
      try { m = run(mutated, parseJs(mutated)); } catch (err) { m = { error: err.message }; }
      if (!m.error && !m.missing && m.parkedUnderRM && m.driveStoppedUnderRM) {
        ok('L4 calibration: the pre-fix source (Reduce Motion back in the residency binding) turns L1 AND L2 red — the rows discriminate, they do not merely run');
      } else {
        bad(
          'L4 the rows can see the defect they exist to catch',
          'the pre-fix source still reads clean at L1/L2, so a green L1 on the real file means nothing. ' +
            `(parkedUnderRM=${m.parkedUnderRM}, driveStoppedUnderRM=${m.driveStoppedUnderRM}${m.error ? `, error: ${m.error}` : ''})`,
        );
      }
    }
  }
}

// --- M. Living Flight (GUIDES/POLLINATE_LIVING_FLIGHT_SPEC.md, Lumen's
//     ruling against github/main@d0fb847, Colin's "90 degree robot-like
//     ways" — 2026-08-29) -----------------------------------------------
//
// Section F already samples `pollinationFlight.js` as a pure function
// (R81). These rows extend that to the ruling's six acceptance tests:
// no measurable corner, momentum through the old split, the weave's
// floating-point-exact envelope, R-LF-4's retuned constants (and the
// coupling FlyingBee.js declares off them), and the landing light.
console.log('\nM. Living Flight — the comb errand, respecified');

const BODY_LENGTH_PX = mascot.MASCOT_WIDTH_FRACTION * 44;
const RING_STEP_PX = flight.approachDurationMs ? Math.sqrt(3) * 44 : null; // ringStepFor(44), no cross-import
const STAGING_OFFSET_PX = flight.stagingOffsetFor({ bodyLengthPx: BODY_LENGTH_PX, ringStep: RING_STEP_PX });
const APPROACH_SPEED_PXS = CRUISE_DIAG_PER_S && sequencer.referenceSpeedPxS
  ? sequencer.referenceSpeedPxS(402, 874) * flight.APPROACH_SPEED_RATIO
  : null;

const angleAtDeg = (a, b, c) => {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const m1 = Math.hypot(v1.x, v1.y);
  const m2 = Math.hypot(v2.x, v2.y);
  if (m1 < 1e-9 || m2 < 1e-9) return 180;
  const dot = Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (m1 * m2)));
  return (Math.acos(dot) * 180) / Math.PI;
};

const minInteriorAngleDeg = (path) => {
  let min = 180;
  for (let i = 1; i < path.length - 1; i += 1) min = Math.min(min, angleAtDeg(path[i - 1], path[i], path[i + 1]));
  return min;
};

// A synthetic plan at one leg length / direction pair, in a large enough
// box that fractional coordinates don't round-trip lossily.
const planFor = (legPx, dirDeg, weaveSign = 1) => {
  const from = { x: 0, y: 0 };
  const rad = (dirDeg * Math.PI) / 180;
  const staging = { x: legPx * Math.sin(rad), y: legPx * Math.cos(rad) };
  const target = { x: staging.x, y: staging.y + STAGING_OFFSET_PX };
  const plan = flight.buildPollinationPlan({
    from, target, ringStep: RING_STEP_PX, bodyLengthPx: BODY_LENGTH_PX,
    width: 4000, height: 4000, approachSpeedPxS: APPROACH_SPEED_PXS,
    weaveSign,
  });
  return { ...plan, path: plan.path.map((p) => ({ x: p.x * 4000, y: p.y * 4000 })) };
};

if (!APPROACH_SPEED_PXS || !RING_STEP_PX) {
  bad('M0 the gate can build a plan to sample', 'a prerequisite (reference speed / ring step) did not resolve — every row below would be asserting against nothing');
} else {
  // --- M1/M1b. RETIRED into N1 (R-LF-7, 2026-08-29) --------------------
  //
  //     They asserted a minimum INTERIOR ANGLE of the sampled polyline, at
  //     150 degrees, over a swept approach direction — and M1b carried the
  //     residual the fillet could not round: a true reversal at 180 degrees
  //     off the descent's axis, where the fillet's two trim points coincide
  //     and it degenerates to a cusp.
  //
  //     BOTH RETIRE, AND FOR DIFFERENT REASONS.
  //
  //     M1b's residual is GONE, not moved: R-LF-7 replaces the fillet with a
  //     circle tangent to the descent line, so the reversal hops are ordinary
  //     hops with a large sweep rather than a degenerate corner. N3 keeps the
  //     old geometry alive as a reconstruction and names the five hops, so
  //     the residual is still on the record — as a defect that was fixed
  //     rather than a caveat that is still true.
  //
  //     M1's INSTRUMENT is what retires. A polyline's interior angle is a
  //     property of the SAMPLER, not of the curve: `adaptiveCurveSamples`
  //     cuts at a fixed sagitta, so a tangential arc still emits vertices
  //     that turn ~6.6 degrees each, and a "minimum interior angle" row would
  //     be reporting MAX_CHORD_DEVIATION_PX under a geometry heading. N1
  //     asserts the thing itself — tangential continuity at both joins, in
  //     closed form — and N2b reports the sampler's own figure separately so
  //     the two can never again be read as one number.
  //
  //     Nothing is asserted here. This comment is the record of what was, so
  //     a later reader does not re-derive a retired bar and wonder where the
  //     row went (R23: an absence claim inherits the scope of the probe that
  //     produced it, and a deleted row leaves no probe at all).

  // --- M2. R-LF-3's envelope is floating-point-EXACT at both ends, at
  //     every leg length the app's own domain produces — not merely close
  //     to zero. `Math.sin(Math.PI)` is not 0; this is the row that would
  //     catch a rewrite that trusted it to be.
  {
    let worst = 0;
    for (let legPx = 41; legPx <= 417; legPx += 11) {
      const amp = flight.weaveAmplitudePx(legPx, BODY_LENGTH_PX);
      worst = Math.max(worst, Math.abs(flight.weaveOffsetAt(0, amp, 1)), Math.abs(flight.weaveOffsetAt(1, amp, 1)));
    }
    if (worst === 0) {
      ok('M2 weaveOffsetAt(u, amplitude, sign) is exactly 0 at u=0 and u=1 for every leg length in the domain — bit-exact, not merely small');
    } else {
      bad('M2 weave envelope exact at both ends', `largest |offset| at an endpoint was ${worst} — not exact`);
    }
  }

  // --- M3. R-LF-3's amplitude formula, read off the module rather than
  //     retyped: A = min(0.18 * leg, 1.5 * body), sampled against the
  //     ruling's own four published figures.
  {
    const cases = [[269.2, 45.10], [81.9, 14.75], [66.5, 11.97], [155.4, 27.96]];
    const bad_ = cases.filter(([legPx, expected]) => Math.abs(flight.weaveAmplitudePx(legPx, BODY_LENGTH_PX) - expected) > 0.02);
    if (bad_.length === 0) {
      ok('M3 weaveAmplitudePx reproduces R-LF-3\'s four published figures (45.10 / 14.75 / 11.97 / 27.96pt) to within 0.02pt');
    } else {
      bad('M3 weaveAmplitudePx matches the ruling\'s figures', bad_.map(([legPx, expected]) => `leg ${legPx}: expected ${expected}, got ${flight.weaveAmplitudePx(legPx, BODY_LENGTH_PX).toFixed(4)}`).join('; '));
    }
  }

  // --- M4. Acceptance test 2, AS REPLACED BY R-LF-2.1 -----------------------
  //
  //     The row this supersedes asserted the composed easing's DERIVATIVE was
  //     strictly positive either side of the split, and it was green through
  //     the entire lunge: strictly-positive is a claim about the value, and
  //     the defect is in the derivative's CONTINUITY (Lumen's own note —
  //     "the rationale names the mechanism, the assertion keys on the label").
  //     A bee that brakes to half speed for five frames and then arrives 24%
  //     faster than he flew never has a non-positive derivative anywhere.
  //
  //     The replacement is the ruling's: sample real GROUND SPEED at 60fps
  //     across the whole flight and bound how much it may change per frame.
  //
  //     TWO DEVIATIONS FROM THE RULING'S LETTER, both measured, both named:
  //
  //     (a) the bound is ADDITIVE, not the ruling's [0.85, 1.15] RATIO. A
  //         ratio bound cannot survive the ruling's own launch ramp: a
  //         profile that starts from rest has an unbounded speed ratio in its
  //         first frames (frame 1 -> frame 2 of a linear ramp is exactly
  //         2.0x), so a multiplicative test either excludes the launch or
  //         forbids departing from rest. `MAX_FRAME_SPEED_STEP_FRACTION`
  //         carries the same 15% with nothing excluded.
  //
  //     (b) "descent peak strictly BELOW the approach cruise" is asserted as
  //         `<=`, because R-LF-2.1's descent starts at EXACTLY the cruise
  //         speed and decays — the junction has no step in it at all. Strict
  //         inequality is satisfiable only by re-introducing one. Equality at
  //         the junction and strictly decreasing after is the stronger
  //         statement, and the unimodality row below is what says so.
  //
  //     THE CURRENCY IS ARC SPEED, and the difference is not cosmetic. A
  //     frame that spans a corner covers less STRAIGHT-LINE distance than
  //     path, so a displacement-difference instrument reads a dip at every
  //     turn that is geometry rather than pacing — row M13 measures that
  //     residual and reports it rather than folding it into this bound.
  //
  //     And the domain is THE LATTICE, not a chosen window (Finding 2: the
  //     four 120.28° hops hid in the gap between M1's swept arc and M1b's
  //     named point). Every ordered seat pair the shipped 7-seat comb can
  //     produce, on every declared container, both weave signs.
  {
    const SPIRAL = lattice.hexSpiral(1);
    const layout = lattice.buildCombLayout([], 44, SPIRAL);
    const seatCentres = layout.cells.map((c) => lattice.cellCentre(c, 44));
    const FRAME_MS = 1000 / 60;

    // Arc covered along the plan's own polyline at time `t` — the currency
    // the profile is written in, read back through the composed easing and
    // the path, so this measures WHAT THE SCREEN DOES and not what the
    // profile promised.
    const arcTrace = (plan) => {
      const pts = plan.path.map((q) => ({ x: q.x * 4000, y: q.y * 4000 }));
      const cum = [0];
      for (let i = 1; i < pts.length; i += 1) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      const at = (t) => {
        const w = plan.easing(Math.min(1, Math.max(0, t / plan.durationMs)));
        const n = plan.path.length - 1;
        const f = w * n;
        const i = Math.min(n - 1, Math.floor(f));
        return cum[i] + (cum[i + 1] - cum[i]) * (f - i);
      };
      const frames = [];
      for (let t = 0; t + FRAME_MS <= plan.durationMs + 1e-9; t += FRAME_MS) {
        frames.push({ t, v: ((at(t + FRAME_MS) - at(t)) / FRAME_MS) * 1000 });
      }
      return frames;
    };

    const hopPlan = (device, from, to, weaveSign) => {
      const speed = sequencer.referenceSpeedPxS(device.width, device.height) * flight.APPROACH_SPEED_RATIO;
      const plan = flight.buildPollinationPlan({
        from: { x: seatCentres[from].x + 2000, y: seatCentres[from].y + 2000 },
        target: { x: seatCentres[to].x + 2000, y: seatCentres[to].y + 2000 },
        ringStep: lattice.ringStepFor(44),
        bodyLengthPx: BODY_LENGTH_PX,
        width: 4000, height: 4000,
        approachSpeedPxS: speed,
        weaveSign,
      });
      return plan;
    };

    const plans = [];
    for (const device of DEVICES) {
      for (let a = 0; a < seatCentres.length; a += 1) {
        for (let b = 0; b < seatCentres.length; b += 1) {
          if (a === b) continue;
          for (const weaveSign of [1, -1]) plans.push({ label: `${device.label} ${a}->${b} sign${weaveSign}`, plan: hopPlan(device, a, b, weaveSign) });
        }
      }
    }

    const BOUND = flight.MAX_FRAME_SPEED_STEP_FRACTION;
    let worstStep = { v: 0, label: '' };
    let worstPeak = { v: 0, label: '' };
    let worstDip = { v: 0, label: '' };
    let worstProfileError = { v: 0, label: '' };
    for (const { label, plan } of plans) {
      const frames = arcTrace(plan);
      const cruise = plan.profile.cruisePxS;
      // (i) no frame may change ground speed by more than the bound.
      for (let i = 1; i < frames.length; i += 1) {
        const step = Math.abs(frames[i].v - frames[i - 1].v) / cruise;
        if (step > worstStep.v) worstStep = { v: step, label: `${label} @${frames[i].t.toFixed(0)}ms` };
      }
      // (ii) the descent never exceeds the cruise it came off.
      for (const f of frames) {
        if (f.t < plan.approachMs) continue;
        if (f.v / cruise > worstPeak.v) worstPeak = { v: f.v / cruise, label: `${label} @${f.t.toFixed(0)}ms` };
      }
      // (iii) unimodal — rise, hold, fall. This is the row a mid-flight brake
      //       dies on, and the one the superseded derivative test could not
      //       see: an interior local minimum is exactly "he slowed down and
      //       then sped up again", which is what a lurch IS.
      let peakI = 0;
      for (let i = 1; i < frames.length; i += 1) if (frames[i].v > frames[peakI].v) peakI = i;
      for (let i = 1; i < frames.length; i += 1) {
        const wrongWay = i <= peakI ? (frames[i - 1].v - frames[i].v) / cruise : (frames[i].v - frames[i - 1].v) / cruise;
        if (wrongWay > worstDip.v) worstDip = { v: wrongWay, label: `${label} @${frames[i].t.toFixed(0)}ms` };
      }
      // (iv) the rendered arc speed IS `speedAtMs`. This is the row that
      //      catches the identity-easing spelling of the ruling: with
      //      identity easings and arc-proportional durations the straight
      //      drop — ONE segment, because `adaptiveCurveSamples` refines on
      //      deviation and a line has none — is flown at one constant speed
      //      and stopped dead, and rows (i)-(iii) would all still pass it.
      //      The reference is the profile's own arc over THE SAME FRAME —
      //      `(arcAtMs(t+F) - arcAtMs(t)) / F` — and not `speedAtMs` at the
      //      frame's midpoint, because the rendered side is a frame
      //      DIFFERENCE and the midpoint derivative is a first-order
      //      approximation OF that difference. Sampled against the midpoint
      //      this row read 0.9037% against its own 1% budget, and every part
      //      of that was the approximation rather than any drift: measured
      //      against the exact frame arc it is 0.00011%. A row whose failing
      //      state is dominated by a quantity it does not assert reds on
      //      changes that are not defects — swept, `APPROACH_SPEED_RATIO`
      //      1.15 -> 1.20 reds it, and non-monotonically (1.35 green, 1.30
      //      and 1.40 red), because the residual depends on where the 60Hz
      //      grid falls against the descent's curvature. Same quantity on
      //      both sides, and the tolerance can then be what the claim is.
      for (let i = 0; i < frames.length; i += 1) {
        const analytic =
          ((plan.profile.arcAtMs(frames[i].t + FRAME_MS) - plan.profile.arcAtMs(frames[i].t)) / FRAME_MS) * 1000;
        const err = Math.abs(analytic - frames[i].v) / cruise;
        if (err > worstProfileError.v) worstProfileError = { v: err, label: `${label} @${frames[i].t.toFixed(0)}ms` };
      }
    }

    if (worstStep.v <= BOUND) {
      ok(`M4 acceptance test 2 (as replaced by R-LF-2.1): across ${plans.length} plans — every ordered seat pair of the shipped 7-seat comb, on all ${DEVICES.length} declared containers, both weave signs — no frame changes ground speed by more than ${(worstStep.v * 100).toFixed(2)}% of the cruise (bound ${(BOUND * 100).toFixed(0)}%, worst at ${worstStep.label}). The binding case is the launch ramp, by construction: a linear 0->v over LAUNCH_MS=${flight.LAUNCH_MS} changes speed by v*16.67/${flight.LAUNCH_MS} = ${((16.667 / flight.LAUNCH_MS) * 100).toFixed(2)}% per frame`);
    } else {
      bad('M4 no frame changes ground speed by more than the bound', `${(worstStep.v * 100).toFixed(2)}% at ${worstStep.label} — a lurch. On main@960ec7b this row read 50.2% (271 -> 135 px/s entering the fillet) and 88.6% (135 -> 375 leaving it)`);
    }

    if (worstPeak.v <= 1 + 1e-9) {
      ok(`M4b the descent never exceeds the cruise it came off (worst ${worstPeak.v.toFixed(4)}x at ${worstPeak.label}). Asserted as <=, not the ruling's "strictly below": R-LF-2.1's descent STARTS at exactly the cruise speed, so the junction has no step — on main this row read 1.402x, and every one of the 33 clean hops arrived faster than it travelled`);
    } else {
      bad('M4b the descent never exceeds the cruise', `${worstPeak.v.toFixed(4)}x at ${worstPeak.label} — the drop is a lunge again`);
    }

    if (worstDip.v <= 1e-6) {
      ok(`M4c the speed profile is unimodal — rises, holds, falls, with no interior local minimum anywhere in ${plans.length} plans (worst counter-direction step ${worstDip.v.toExponential(2)} of cruise, at ${worstDip.label}). A brake mid-flight IS an interior minimum; this is the shape claim the superseded derivative row could not make`);
    } else {
      bad('M4c the speed profile is unimodal', `a counter-direction step of ${(worstDip.v * 100).toFixed(2)}% of cruise at ${worstDip.label} — he slowed and then sped up again`);
    }

    if (worstProfileError.v <= 0.0001) {
      ok(`M4d the RENDERED arc speed is the profile's own arc over the same frame to within ${(worstProfileError.v * 100).toFixed(5)}% of cruise at every frame of every plan (bound 0.01%) — the composed easing reproduces the profile EXACTLY rather than approximating it by segment count. This is the row the identity-easing spelling of R-LF-2.1 fails: the straight drop is one segment (a line has no deviation for \`adaptiveCurveSamples\` to refine on), so identity easings fly it at one constant speed and stop dead at the cell`);
    } else {
      bad('M4d rendered arc speed reproduces the profile', `${(worstProfileError.v * 100).toFixed(4)}% of cruise at ${worstProfileError.label} — the composed easing and the profile have drifted apart. This row compares the profile's arc over the frame against the path's, so the residual is composition and nothing else: a sampling artefact cannot reach it`);
    }

    // --- M11. The profile's own constants, and the two places it is a
    //     FLOOR rather than a fixed quantity — both swept, both reported.
    {
      const derivedLaunchFloor = (1000 / 60) / flight.MAX_FRAME_SPEED_STEP_FRACTION;
      let decay = { min: Infinity, max: -Infinity };
      let descent = { min: Infinity, max: -Infinity };
      let duration = { min: Infinity, max: -Infinity };
      let extended = 0;
      const shippedDuration = { min: Infinity, max: -Infinity };
      for (const { label, plan } of plans) {
        if (!/^320|^375/.test(label)) {
          shippedDuration.min = Math.min(shippedDuration.min, plan.durationMs);
          shippedDuration.max = Math.max(shippedDuration.max, plan.durationMs);
        }
        decay.min = Math.min(decay.min, plan.profile.decay);
        decay.max = Math.max(decay.max, plan.profile.decay);
        descent.min = Math.min(descent.min, plan.descentMs);
        descent.max = Math.max(descent.max, plan.descentMs);
        duration.min = Math.min(duration.min, plan.durationMs);
        duration.max = Math.max(duration.max, plan.durationMs);
        if (plan.descentMs > flight.DESCENT_MS + 1e-9) extended += 1;
      }
      const launchOk = flight.LAUNCH_MS >= derivedLaunchFloor;
      const decayOk = decay.min >= flight.MIN_DESCENT_DECAY - 1e-9;
      const floorOk = descent.min >= flight.DESCENT_MS - 1e-9;
      if (launchOk && decayOk && floorOk) {
        ok(`M11 LAUNCH_MS=${flight.LAUNCH_MS} clears its own derived floor of ${derivedLaunchFloor.toFixed(1)}ms (one frame / ${flight.MAX_FRAME_SPEED_STEP_FRACTION}), and the descent's decay exponent stays >= ${flight.MIN_DESCENT_DECAY} on every plan (swept ${decay.min.toFixed(3)}..${decay.max.toFixed(3)}). DESCENT_MS=${flight.DESCENT_MS} is a FLOOR: it binds on ${plans.length - extended} of ${plans.length} plans and the other ${extended} extend to ${descent.max.toFixed(1)}ms, because below p=1 there is no monotone v->0 profile over a fixed duration that does not hold high and stop hard (a 320x568 box would land p=0.229, whose last frame drops 102 px/s in one). Flight length ${duration.min.toFixed(1)}..${duration.max.toFixed(1)}ms over the whole sweep, ${shippedDuration.min.toFixed(1)}..${shippedDuration.max.toFixed(1)}ms on the 393x852-and-larger boxes this app actually ships to`);
      } else {
        bad('M11 the profile\'s floors hold', `LAUNCH_MS>=floor=${launchOk} (${flight.LAUNCH_MS} vs ${derivedLaunchFloor.toFixed(1)}), decay>=${flight.MIN_DESCENT_DECAY}=${decayOk} (min ${decay.min.toFixed(3)}), descentMs>=DESCENT_MS=${floorOk} (min ${descent.min.toFixed(1)})`);
      }
    }

    // --- M12. The launch ramp's cost, stated rather than discovered. Holding
    //     the ratified SPEED and letting the duration follow (rather than
    //     redistributing inside a fixed `approachMs`, which would raise the
    //     neighbour hop's cruise from 271 to 338 px/s in the ruling whose ask
    //     was "slower") costs exactly LAUNCH_MS/2 per flight. Asserted
    //     against the arithmetic, so a future ramp shape that quietly changes
    //     the cost cannot land unreported.
    {
      let worst = 0;
      let worstLabel = '';
      for (const { label, plan } of plans) {
        const flatMs = plan.profile.approachArcPx > 0 ? (plan.profile.approachArcPx / plan.profile.cruisePxS) * 1000 : 0;
        const cost = plan.approachMs - flatMs;
        const expected = plan.profile.launchMs / 2;
        const err = Math.abs(cost - expected);
        if (err > worst) { worst = err; worstLabel = label; }
      }
      if (worst < 1e-6) {
        ok(`M12 the launch ramp costs exactly LAUNCH_MS/2 = ${(flight.LAUNCH_MS / 2).toFixed(1)}ms of extra flight time and nothing else — the cruise speed R-LF-4 ratified is held at every instant, and the DURATION is what moves (§28.5's own direction: the speed is the ruling, the duration is its consequence)`);
      } else {
        bad('M12 the launch ramp costs LAUNCH_MS/2', `${worstLabel} is off by ${worst.toFixed(4)}ms — the ramp is being paid for out of the cruise speed instead of out of the clock`);
      }
    }

    // --- M13. REPORTED, NOT GATED: the corner's displacement residual.
    //     Ground speed measured as straight-line displacement per frame —
    //     which is how the ruling's own table was taken — dips at the fillet,
    //     because a frame that spans a turn covers less chord than path. That
    //     is geometry and not pacing: arc speed (M4) is flat through it. The
    //     numbers are here so the next person to measure this beat with a
    //     displacement instrument does not read the turn as a brake.
    {
    // Split by Finding 2's reversal class, because the two numbers have
    // different causes and only one of them is the fillet: on an UPWARD hop
    // the path folds back on itself (`staging` is unconditionally above the
    // target, so the corner is a true 180°), and a frame spanning a cusp has
    // almost no displacement at all. That is R-LF-7's geometry, not this
    // ruling's pacing, and reporting one number for both would attribute it
    // here.
      let worst = { v: 0, label: '' };
      let worstReversal = { v: 0, label: '' };
      for (const { label, plan } of plans) {
        const pts = plan.path.map((q) => ({ x: q.x * 4000, y: q.y * 4000 }));
        const reversal = minInteriorAngleDeg(pts) < 150;
        const pos = (t) => {
          const w = plan.easing(Math.min(1, Math.max(0, t / plan.durationMs)));
          const n = plan.path.length - 1;
          const f = w * n;
          const i = Math.min(n - 1, Math.floor(f));
          const u = f - i;
          const a = plan.path[i];
          const b = plan.path[i + 1];
          return { x: (a.x + (b.x - a.x) * u) * 4000, y: (a.y + (b.y - a.y) * u) * 4000 };
        };
        for (let t = 0; t + FRAME_MS <= plan.durationMs; t += FRAME_MS) {
          const p0 = pos(t);
          const p1 = pos(t + FRAME_MS);
          const displacement = (Math.hypot(p1.x - p0.x, p1.y - p0.y) / FRAME_MS) * 1000;
          const analytic = flight.speedAtMs(plan.profile, t + FRAME_MS / 2);
          if (analytic <= 0) continue;
          const dip = (analytic - displacement) / plan.profile.cruisePxS;
          const bucket = reversal ? worstReversal : worst;
          if (dip > bucket.v) { bucket.v = dip; bucket.label = `${label} @${t.toFixed(0)}ms`; }
        }
      }
      ok(`M13 REPORTED, not gated: measured as straight-line DISPLACEMENT per frame — the instrument the ruling's own table was taken with — the worst dip below the profile's arc speed is ${(worst.v * 100).toFixed(1)}% of cruise on a corner-clearing hop (${worst.label}) and ${(worstReversal.v * 100).toFixed(1)}% on a Finding-2 REVERSAL hop (${worstReversal.label}), where the path folds and a frame spanning the cusp barely moves. Both are geometry, not pacing: arc speed (M4) is flat through both, and the reversal figure is R-LF-7's to close. The same instrument reads 50% on main@960ec7b, where it WAS pacing`);
    }
  }

  // --- M5. R-LF-4's constants, read off the module rather than retyped,
  //     plus the coupling FlyingBee.js DECLARES rather than inherits
  //     silently (the ruling's own condition: "it must be chosen in the
  //     diff, with a sentence, rather than inherited").
  {
    const ratioOk = Math.abs(flight.APPROACH_SPEED_RATIO - 1.15) < 1e-9;
    const descentOk = flight.DESCENT_MS === 260;
    const coupled = /PRESENCE_FADE_MS\s*=\s*DESCENT_MS/.test(flyingBeeSource);
    if (ratioOk && descentOk && coupled) {
      ok('M5 APPROACH_SPEED_RATIO=1.15, DESCENT_MS=260 (a FLOOR since R-LF-2.1, not the descent\'s duration — exceeded on 214 of the 336 lattice plans), and FlyingBee.js keeps PRESENCE_FADE_MS = DESCENT_MS. The coupling rides the same retune rather than being a stale literal, and it survives the floor because it is a PACING rhyme and not a synchronisation: nothing pinned to it has to end when a descent does');
    } else {
      bad('M5 R-LF-4 constants', `ratio=${flight.APPROACH_SPEED_RATIO} (want 1.15), descent=${flight.DESCENT_MS} (want 260), PRESENCE_FADE_MS coupling present=${coupled}`);
    }
  }

  // --- M6. R-LF-2.1 — the builder takes NO easings, and the call site
  //     passes none. The superseded form of this row asserted the call site
  //     passed `Easing.out(Easing.quad)` and `Easing.out(Easing.cubic)`,
  //     which is the exact configuration the lunge was made of: a caller that
  //     can hand in a curve is a caller that can hand in a curve for one
  //     SEGMENT of a leg, and a segment is not a leg (the launch's was 6ms,
  //     the settle's was the whole drop).
  //
  //     Asserted in both directions — the parameter is gone from the
  //     builder's own destructuring AND no call site passes it — because
  //     either alone is satisfiable by the other half surviving.
  {
    const params = flight.buildPollinationPlan.toString().match(/\(\s*\{([\s\S]*?)\}\s*\)/)?.[1] ?? '';
    const builderClean = !/easeApproach|easeDescent/.test(params);
    const beeSource = await readFile(path.join(ROOT, 'src/components/FlyingBee.js'), 'utf8');
    const callSiteClean = !/easeApproach\s*:|easeDescent\s*:/.test(beeSource);
    const profileWired = /buildSpeedProfile/.test(await readFile(FLIGHT_MODULE, 'utf8'));
    if (builderClean && callSiteClean && profileWired) {
      ok('M6 buildPollinationPlan takes no easing arguments and FlyingBee.js passes none — the flight\'s shape is a property of the flight (`buildSpeedProfile`), not something a call site can spell');
    } else {
      bad('M6 R-LF-2.1 — no easings cross the call boundary', `builder params clean=${builderClean} (read "${params.replace(/\s+/g, ' ').trim()}"), call site clean=${callSiteClean}, profile wired=${profileWired}`);
    }
  }

  // --- M7. R-LF-3's weave alternates, seeded off the pollination key (an
  //     incrementing counter) rather than `Math.random()` — the call site
  //     must stay a pure function of `pollinate.key` for a gate to sample.
  {
    const hasWeaveSign = /weaveSign:\s*pollinate\.key\s*%\s*2/.test(flyingBeeSource);
    const noRandom = !/buildPollinationPlan[\s\S]{0,400}Math\.random/.test(flyingBeeSource);
    if (hasWeaveSign && noRandom) {
      ok('M7 weaveSign is keyed off `pollinate.key` (deterministic, alternating), not Math.random()');
    } else {
      bad('M7 weave sign source', `hasWeaveSign=${hasWeaveSign}, noRandom=${noRandom}`);
    }
  }

  // --- M8. R-LF-5 — the landing light. Three things, one per file: the
  //     bee's completion still fires `onPollinateEnd` on the SAME frame as
  //     `burstPollen` (unchanged — §28's own existing wiring); the comb
  //     exposes `igniteLanding` behind a ref; the screen wires the two
  //     together and does NOT let a new pixel constant cross with it.
  {
    const burstThenEnd = /burstPollen\(plan\.landing\);[\s\S]{0,200}onPollinateEndRef\.current\?\.\(\)/.test(flyingBeeSource);
    const gridForwardRef = /export const HoneycombGrid = forwardRef\(/.test(gridSource);
    const gridExposesIgnite = /useImperativeHandle\(ref,\s*\(\)\s*=>\s*\(\{\s*igniteLanding\s*\}\)\)/.test(gridSource);
    const peakUnderIgnition = (() => {
      const m = gridSource.match(/LANDING_LIGHT_PEAK\s*=\s*([\d.]+)/);
      return m ? Number(m[1]) < 1 : false;
    })();
    const tabWiresRef = /ref=\{combRef\}/.test(tabSource) && /combRef\.current\?\.\s*igniteLanding\(\)/.test(tabSource);
    const noNewCellCrossesToGrid = !/igniteLanding\s*\(/.test(tabSource.replace(/combRef\.current\?\.\s*igniteLanding\(\)/, ''));
    if (burstThenEnd && gridForwardRef && gridExposesIgnite && peakUnderIgnition && tabWiresRef && noNewCellCrossesToGrid) {
      ok('M8 the landing light: onPollinateEnd still fires alongside burstPollen, HoneycombGrid exposes igniteLanding (peak under the ignition\'s) via a ref, and HoneycombTab wires the two with no new pixel or cell reference crossing (§28.2)');
    } else {
      bad(
        'M8 the landing light wiring',
        `burstThenEnd=${burstThenEnd} gridForwardRef=${gridForwardRef} gridExposesIgnite=${gridExposesIgnite} peakUnderIgnition=${peakUnderIgnition} tabWiresRef=${tabWiresRef} noNewCellCrossesToGrid=${noNewCellCrossesToGrid}`,
      );
    }
  }

  // --- M9. Unchanged, deliberately (§3 of the spec): Reduce Motion still
  //     returns before any of this runs — `requestPollination`'s early
  //     return is untouched, so there is no flight and no landing light
  //     under RM without a special case for either.
  {
    const rmGuardIntact = /if\s*\(!onPollinate\s*\|\|\s*reduced\)\s*return;/.test(gridSource);
    if (rmGuardIntact) {
      ok('M9 requestPollination\'s Reduce-Motion early return is untouched — no flight starts under RM, so onPollinateEnd (and the landing light) can never fire under it either');
    } else {
      bad('M9 Reduce Motion guard untouched', 'requestPollination no longer opens with `if (!onPollinate || reduced) return;` — re-verify RM parity by hand');
    }
  }

  // --- M10. §3's trail-pool note, verified rather than assumed:
  //     `pollenCountFor`'s spare-slot count is a STEADY-STATE occupancy
  //     (`ceil(trailFadeMs / trailIntervalMs)`), independent of how long
  //     the flight that fed the trail ran — a longer approach cannot push
  //     occupancy past that cap, only reach it sooner. Asserted by reading
  //     the function's own parameter list rather than re-deriving the
  //     arithmetic, since section F already gates the arithmetic itself.
  {
    const params = flight.pollenCountFor.toString().match(/\(\s*\{([^}]*)\}/)?.[1] ?? '';
    const durationIndependent = !/durationMs|approachMs|legPx|distance/.test(params);
    if (durationIndependent) {
      ok('M10 pollenCountFor\'s inputs (poolSize, trailFadeMs, trailIntervalMs, slack) do not include flight duration — the spare-slot count is a steady-state cap R-LF-4\'s longer approach cannot exceed, confirming §3\'s note without new code');
    } else {
      bad('M10 trail-pool headroom independent of flight duration', `pollenCountFor's params now read "${params}" — a duration-shaped input arrived and the steady-state argument needs re-checking`);
    }
  }

  // ======================================================================
  // N. R-LF-7 / R-LF-8 — the turn, and the envelope that closes its join
  // ======================================================================
  //
  // §7 of GUIDES/POLLINATE_LIVING_FLIGHT_SPEC.md, nine numbered rows, four of
  // which the ruling itself marks REPORT and not BOUND. M1 and M1b retire into
  // N1: they measured the interior angle of a SAMPLED POLYLINE, and under a
  // tangential turn that measures the sampler's step rather than the geometry.
  //
  // THE INSTRUMENT IS THE WHOLE QUESTION HERE, and that is Lumen's ruling of
  // 2026-08-29 rather than a preference of mine. `u = 1` is the domain edge of
  // the weave's parametrisation, so no central difference exists there and a
  // ONE-SIDED difference floors at `h` rather than at the envelope — 0.116
  // degrees at h = 1e-3. That still reds against the 32.71 degree defect, so a
  // differenced row passes its own mutation test while having silently stopped
  // measuring the property. Every derivative AT A JOIN below is closed form,
  // read out of the module (`weaveSlopeAt`). The interior — where differencing
  // IS valid — is where that function gets calibrated, in N7.
  //
  // AND EVERY ROW CARRIES A BASELINE COLUMN. `main@42a83c7`'s fillet is
  // reconstructed below from its own published formula, and each measurement
  // is reported against it. Four of the numbers §5 rules against turn out to
  // have been measured in a frame this commit replaces — which is exactly what
  // acceptance 9 says about the weave, one step further out than it was taken.
  console.log('\nN. R-LF-7 / R-LF-8 — the turn, and the envelope that closes its join');
  {
    const SPIRAL = lattice.hexSpiral(1);
    const layout = lattice.buildCombLayout([], 44, SPIRAL);
    const seatCentres = layout.cells.map((c) => lattice.cellCentre(c, 44));
    const TOP_SEAT = seatCentres.reduce((best, s, i) => (s.y < seatCentres[best].y ? i : best), 0);
    const BOX = 4000;
    const OFFSET_PX = flight.stagingOffsetFor({ bodyLengthPx: BODY_LENGTH_PX, ringStep: lattice.ringStepFor(44) });
    const CAP_DEG = (flight.STAGING_BEARING_CAP_RAD * 180) / Math.PI;
    // The ruled ceiling in the frame the rows report in: 0.15 rad/frame.
    const RATE_BOUND_DEG = (flight.MAX_FRAME_SPEED_STEP_FRACTION * 180) / Math.PI;
    const deg = (r) => (r * 180) / Math.PI;
    // `TAU` is the module's, not this file's — spelled once here so the two
    // reconstructions below read the same as the source they cite.
    const TAU_N = Math.PI * 2;
    // Read from the module rather than retyped — N12 reports against it.
    const TURN_RADIUS_MAX_PASSES_READ = Number(/TURN_RADIUS_MAX_PASSES = (\d+)/.exec(flightSource)?.[1] ?? NaN);
    const turnBetween = (a, b) => Math.abs(Math.atan2(a.x * b.y - a.y * b.x, a.x * b.x + a.y * b.y));

    // Every ordered seat pair x every declared container x both weave signs.
    // The domain is THE LATTICE and not a chosen window — Finding 2's lesson,
    // inherited unchanged.
    const PLANS = [];
    for (const device of DEVICES) {
      const speed = sequencer.referenceSpeedPxS(device.width, device.height) * flight.APPROACH_SPEED_RATIO;
      for (let a = 0; a < seatCentres.length; a += 1) {
        for (let b = 0; b < seatCentres.length; b += 1) {
          if (a === b) continue;
          for (const weaveSign of [1, -1]) {
            const from = { x: seatCentres[a].x + BOX / 2, y: seatCentres[a].y + BOX / 2 };
            const target = { x: seatCentres[b].x + BOX / 2, y: seatCentres[b].y + BOX / 2 };
            const plan = flight.buildPollinationPlan({
              from, target, ringStep: lattice.ringStepFor(44), bodyLengthPx: BODY_LENGTH_PX,
              width: BOX, height: BOX, approachSpeedPxS: speed, weaveSign,
            });
            PLANS.push({
              label: `${device.label} ${a}->${b} sign${weaveSign}`,
              device, from, target, weaveSign, speed, plan, toSeat: b,
              pts: plan.path.map((q) => ({ x: q.x * BOX, y: q.y * BOX })),
            });
          }
        }
      }
    }

    // The turn's geometry, rebuilt by CALLING the module's exported solver at
    // the plan's own published radius rather than re-derived here (R81: the
    // flight is a pure function, so a gate samples it). `plan.turn.radiusPx`
    // is the fixed point the build actually settled on, so this reproduces the
    // turn the path was drawn from and not a second guess at it.
    const geometryFor = (p) => flight.chooseTurn({
      from: p.from, target: p.target, offsetPx: OFFSET_PX,
      radiusPx: p.plan.turn.radiusPx, inboardSign: p.target.x * 2 < BOX ? 1 : -1,
    });

    // ------------------------------------------------------------------
    // THE BASELINE COLUMN — `main@42a83c7`'s fillet, reconstructed from its
    // own published formula so every row below can be read against what
    // ships today rather than against nothing.
    //
    //   staging     = { target.x, target.y - stagingOffsetFor(...) }   (vertical)
    //   r           = FILLET_LEG_FRACTION x min(chord, descentChord),
    //                 FILLET_LEG_FRACTION = 0.25
    //   P1          = lerp(staging, from,   r / chord)
    //   P2          = lerp(staging, target, r / descentChord)
    //   fillet      = quadratic Bezier P1 -> staging(control) -> P2
    //   weave       = A sin(pi u) sin(2 pi x 1.5 x u),  WEAVE_PERIODS = 1.5
    //
    // Everything else — `weaveAmplitudePx`, `stagingOffsetFor`, the speed —
    // is the live module's, because R-LF-7 did not touch those. The ONLY
    // things spelled out here are the two the ruling replaces, which is what
    // makes this a reconstruction of the corner rather than a fork of the
    // file. `main`'s own numbers are the check: this reproduces its flight
    // lengths (524.2 .. 1590.5ms; 393x852-and-up 1165.6ms) and its five
    // degenerate hops, which is how I know the reconstruction is faithful.
    const filletRef = (p) => {
      const staging = { x: p.target.x, y: p.target.y - OFFSET_PX };
      const chord = { x: staging.x - p.from.x, y: staging.y - p.from.y };
      const L = Math.hypot(chord.x, chord.y);
      const n = { x: -chord.y / L, y: chord.x / L };
      const A = flight.weaveAmplitudePx(L, BODY_LENGTH_PX);
      // main@42a83c7's `weaveOffsetAt`, and its closed-form slope. `c` is the
      // fixed 1.5, so `sin(2 pi c) = 0` and the terminal slope vanishes on the
      // carrier's own account — which is precisely the accident R-LF-8 removes
      // and R-LF-3.1 replaces with a property of the envelope.
      const K = 1.5;
      const slopeAt1 = A * p.weaveSign * (Math.PI * Math.cos(Math.PI) * Math.sin(TAU_N * K)
        + TAU_N * K * Math.sin(Math.PI) * Math.cos(TAU_N * K));
      const r = 0.25 * Math.min(L, OFFSET_PX);
      const lerp = (a, b, u) => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
      const P1 = lerp(staging, p.from, r / L);
      const P2 = lerp(staging, p.target, r / OFFSET_PX);
      // Quadratic Bezier tangent: B'(u) = 2(1-u)(S - P1) + 2u(P2 - S).
      const d0 = { x: 2 * (staging.x - P1.x), y: 2 * (staging.y - P1.y) };
      const d1 = { x: 2 * (P2.x - staging.x), y: 2 * (P2.y - staging.y) };
      const tangentAt = (u) => ({ x: d0.x * (1 - u) + d1.x * u, y: d0.y * (1 - u) + d1.y * u });
      // The cusp test. B' is linear in u, so it vanishes at most once and the
      // solve is closed form: |B'|^2 is a quadratic in u, minimised at
      // u* = -(d0 . (d1-d0)) / |d1-d0|^2, clamped to [0,1].
      const ex = d1.x - d0.x;
      const ey = d1.y - d0.y;
      const den = ex * ex + ey * ey;
      const uStar = den > 0 ? Math.min(1, Math.max(0, -(d0.x * ex + d0.y * ey) / den)) : 0;
      const tStar = tangentAt(uStar);
      return {
        staging, chord, L, n, A, P1, P2, tangentAt,
        approachTangentAt1: { x: chord.x + n.x * slopeAt1, y: chord.y + n.y * slopeAt1 },
        descentDir: { x: p.target.x - P2.x, y: p.target.y - P2.y },
        minTangentSpeed: Math.hypot(tStar.x, tStar.y),
        totalTurn: turnBetween(d0, d1),
        // Curvature of a quadratic Bezier: |B' x B''| / |B'|^3, with
        // B'' = 2(P1 - 2 S + P2), constant. Worst at the smallest |B'|.
        maxCurvature: (() => {
          const bx = 2 * (P1.x - 2 * staging.x + P2.x);
          const by = 2 * (P1.y - 2 * staging.y + P2.y);
          let worst = 0;
          for (let i = 0; i <= 1000; i += 1) {
            const t = tangentAt(i / 1000);
            const m = Math.hypot(t.x, t.y);
            if (m < 1e-9) return Infinity;
            worst = Math.max(worst, Math.abs(t.x * by - t.y * bx) / (m * m * m));
          }
          return worst;
        })(),
      };
    };

    // --- N1. Acceptance 1 — no junction angle exists ---------------------
    //
    //     Both joins, both closed form, over all 336 plans. The approach's
    //     terminal tangent is `chord + n * weaveSlopeAt(1)` and the arc's
    //     entry heading is `sigma * perpCcw(T - centre)` — two independently
    //     computed vectors, so this row tests the TURN's tangency and the
    //     ENVELOPE's together rather than assuming either.
    //
    //     Bound `1e-9` degrees, from §7: five orders above the analytic
    //     residual and ten below the 32.71 degree defect. Both endpoints of
    //     that margin are measured, not chosen — N1b prints the defect.
    {
      const BOUND_DEG = 1e-9;
      let joinA = { v: 0, label: '' };
      let joinB = { v: 0, label: '' };
      let missing = 0;
      for (const p of PLANS) {
        const t = geometryFor(p);
        if (!t) { missing += 1; continue; }
        const chord = { x: t.tangent.x - p.from.x, y: t.tangent.y - p.from.y };
        const L = Math.hypot(chord.x, chord.y);
        const n = { x: -chord.y / L, y: chord.x / L };
        const slope = flight.weaveSlopeAt(1, p.plan.weaveAmplitudePx, p.plan.weaveCycles, p.weaveSign);
        const approachTangent = { x: chord.x + n.x * slope, y: chord.y + n.y * slope };
        const entryHeading = t.sweep > 0
          ? { x: t.sigma * -(t.tangent.y - t.centre.y), y: t.sigma * (t.tangent.x - t.centre.x) }
          : chord;
        const a = deg(turnBetween(approachTangent, entryHeading));
        if (a > joinA.v) joinA = { v: a, label: p.label };
        const exitHeading = t.sweep > 0
          ? { x: t.sigma * -(t.staging.y - t.centre.y), y: t.sigma * (t.staging.x - t.centre.x) }
          : { x: p.target.x - t.staging.x, y: p.target.y - t.staging.y };
        const descentDir = { x: p.target.x - t.staging.x, y: p.target.y - t.staging.y };
        const b = deg(turnBetween(exitHeading, descentDir));
        if (b > joinB.v) joinB = { v: b, label: p.label };
      }
      if (missing) {
        bad('N1 no junction angle exists at either join', `${missing} of ${PLANS.length} plans produced no turn at all, so this row could not measure what it exists to measure`);
      } else if (joinA.v < BOUND_DEG && joinB.v < BOUND_DEG) {
        ok(`N1 no junction angle exists, at either join, on any of ${PLANS.length} SEAT-TO-SEAT plans (N11 carries the wide domain) — weave->arc worst ${joinA.v.toExponential(4)}deg (${joinA.label}), arc->descent worst ${joinB.v.toExponential(4)}deg (${joinB.label}), against a bound of ${BOUND_DEG}deg. Closed-form derivatives throughout: at u=1 the weave's domain ENDS, so a one-sided difference would floor at h (0.116deg at h=1e-3) and would green a merely-approximate envelope`);
      } else {
        bad('N1 no junction angle exists at either join', `weave->arc worst ${joinA.v.toExponential(4)}deg (${joinA.label}), arc->descent worst ${joinB.v.toExponential(4)}deg (${joinB.label}), bound ${BOUND_DEG}deg`);
      }
    }

    // --- N1b. THE CALIBRATION, and it is not optional decoration ---------
    //
    //     N1 can legitimately print a number indistinguishable from "did not
    //     run" (Lumen's own point). The mutation is what proves it executed:
    //     ONE TOKEN — `WEAVE_ENVELOPE_EXPONENT` 2 -> 1, which is §7's named
    //     mutation "restore the sin(pi u) envelope at a non-half-integer
    //     cycle count" — and N1's own instrument must read ~32.71deg.
    //
    //     The exponent is a shared constant precisely so this mutation moves
    //     `weaveOffsetAt` and `weaveSlopeAt` TOGETHER. A derivative that
    //     could not follow it would leave N1 unfalsifiable.
    {
      const mutatedSource = flightSource.replace(
        'export const WEAVE_ENVELOPE_EXPONENT = 2;',
        'export const WEAVE_ENVELOPE_EXPONENT = 1;',
      );
      if (mutatedSource === flightSource) {
        bad('N1b the row can see the defect it exists to catch', 'the mutation matched nothing — `WEAVE_ENVELOPE_EXPONENT` is spelled differently now, so N1 ran uncalibrated and its green means nothing');
      } else {
        const mutated = await import(`data:text/javascript;base64,${Buffer.from(mutatedSource).toString('base64')}`);
        let worst = { v: 0, label: '' };
        for (const p of PLANS) {
          const t = geometryFor(p);
          if (!t || t.sweep <= 0) continue;
          const chord = { x: t.tangent.x - p.from.x, y: t.tangent.y - p.from.y };
          const L = Math.hypot(chord.x, chord.y);
          const slope = mutated.weaveSlopeAt(1, p.plan.weaveAmplitudePx, p.plan.weaveCycles, p.weaveSign);
          const a = Math.abs(deg(Math.atan2(slope, L)));
          if (a > worst.v) worst = { v: a, label: p.label, c: p.plan.weaveCycles, A: p.plan.weaveAmplitudePx, L };
        }
        if (worst.v > 10) {
          ok(`N1b calibration: with the envelope back to sin(pi u) (WEAVE_ENVELOPE_EXPONENT 2 -> 1, one token) N1's own instrument reads ${worst.v.toFixed(4)}deg at ${worst.label} (c ${worst.c.toFixed(4)}, A ${worst.A.toFixed(4)}pt, L ${worst.L.toFixed(4)}pt) — ten orders over the bound. The defect and the residual come out of the same run, which is what makes N1's green a measurement rather than a silence`);
        } else {
          bad('N1b the row can see the defect it exists to catch', `the sin(pi u) envelope reads only ${worst.v.toFixed(6)}deg on this lattice — either the mutation no longer reaches the envelope or the cycle counts have all become half-integers, and either way N1 is no longer falsifiable`);
        }
      }
    }

    // --- N2. Acceptance 2 — turn rate ------------------------------------
    //
    //     `omega <= MAX_FRAME_SPEED_STEP_FRACTION` rad/frame, which is what
    //     R-LF-7's radius is solved against: `R >= v / 9`, so on the arc
    //     `omega = v / R` and the bound is met with equality wherever the
    //     frame term is the binding one.
    //
    //     THE INSTRUMENT IS CONTINUOUS, and the reason is the same one N1
    //     rests on. A per-frame reading off the RENDERED polyline measures
    //     the sampler: `adaptiveCurveSamples` cuts at a sagitta of
    //     MAX_CHORD_DEVIATION_PX, which on a 30pt arc emits vertices ~6.6deg
    //     apart, so a frame that straddles a vertex reads that turn as
    //     instantaneous. That figure is reported below rather than gated,
    //     because it is a property of the sampling density and not of the
    //     geometry the ruling is about.
    //
    //     SCOPE, and it is stated because the ruling's two halves disagree:
    //     §7 row 2 says "every frame of every plan", and §5's own carve-out
    //     says the weave's tightness "is ratified and nothing here puts a
    //     radius floor on it." The two cannot both hold — the weave is by far
    //     the fastest-turning thing on the path, and was before this commit.
    //     This row gates THE TURN, which is what R-LF-7 rules on, and N2b
    //     reports the weave with its baseline so the disagreement is Lumen's
    //     to settle rather than mine to quietly pick a side of.
    {
      let worst = { v: 0, label: '' };
      for (const p of PLANS) {
        const t = geometryFor(p);
        if (!t || t.sweep <= 0) continue;
        // Speed anywhere on the arc is bounded above by the cruise (M4b: the
        // descent never exceeds the cruise it came off), so `cruise / R` is
        // the arc's worst turn rate and it is exact rather than sampled.
        const omega = p.plan.profile.cruisePxS / t.radiusPx / 60;
        if (omega > worst.v) worst = { v: omega, label: p.label, R: t.radiusPx, cruise: p.plan.profile.cruisePxS };
      }
      const bound = flight.MAX_FRAME_SPEED_STEP_FRACTION;
      if (worst.v <= bound + 1e-12) {
        ok(`N2 the TURN's own rate — R-LF-9 scopes §7 row 2 to the turn, the weave being gait with its own ruled rate in Hz (N2b) — is under R-LF-2.1's ratified bound on every one of ${PLANS.length} SEAT-TO-SEAT plans — a domain on which it CANNOT fail, because R's frame term never binds here; N12 is the row that gates it where it can: worst ${deg(worst.v).toFixed(4)}deg/frame (${worst.label}, cruise ${worst.cruise.toFixed(2)} px/s over R ${worst.R.toFixed(4)}pt) against ${RATE_BOUND_DEG.toFixed(4)}deg/frame. Continuous instrument (v/R), not a frame difference off the polyline — see N2b`);
      } else {
        bad('N2 the turn stays inside R-LF-2.1\'s rate bound', `worst ${deg(worst.v).toFixed(4)}deg/frame at ${worst.label} (cruise ${worst.cruise.toFixed(2)} px/s, R ${worst.R.toFixed(4)}pt) against ${RATE_BOUND_DEG.toFixed(4)}deg/frame — the radius is no longer solved against the bound it claims to come from`);
      }
    }

    // --- N2b. REPORTED, not gated — TWO CHANNELS, LABELLED -----------------
    //
    //     R-LF-9 (Lumen, 2026-08-29). §7 row 2's bound is on THE TURN, and the
    //     weave is gait rather than steering: its rate is already ruled, in Hz,
    //     by R-LF-8's WEAVE_RATE_HZ. A second bound on the same quantity in a
    //     foreign unit is either redundant or contradictory, and 0.15 rad/frame
    //     on the weave forbids every plan on the lattice including the rhythm
    //     Colin approved. So this row REPORTS, and it reports two DIFFERENT
    //     things that must never be substituted for one another:
    //
    //       CHANNEL 1  the DRAWN BANK — what renders as the bee itself.
    //                  `buildAttitude` derives it from the tangent of the
    //                  drawn polyline, sampled at 60fps through the plan's
    //                  own easing. Bank is blind to purely horizontal heading
    //                  change by construction (`pitchFor` reads dy against
    //                  |dx|), so it is NOT a proxy for channel 2.
    //       CHANNEL 2  the PATH HEADING — what the trajectory does per frame,
    //                  walked at arc-length steps of cruise/60 on the drawn
    //                  curve. Neither the sampler's polyline nor a point
    //                  curvature: the eye's own frame.
    //
    //     The weave's minimum RADIUS stays below as PROVENANCE and never as
    //     the headline — it is the one number here in nobody's frame, being
    //     neither what the path does per frame nor what the character does.
    //
    //     AND THE INSTRUMENT IS PHASE-SWEPT, which is a correction to both of
    //     the single-phase walks published in the ratification thread. A
    //     worst-per-frame taken from ONE walk depends on where the walk's
    //     marks happen to land relative to the curve's sharpest point. The
    //     tell was that the baseline was NON-MONOTONE in cruise speed —
    //     71.67 / 72.60 / 80.54 / 73.39 / 80.54 as cruise scaled 1.00 .. 1.20,
    //     which no property of a curve can be. Swept over 16 phases it becomes
    //     monotone, and both published figures rise. A sampled maximum is a
    //     property of the sampling phase until the phase is swept — the same
    //     animal as permuting a spatial sweep before trusting it.
    {
      const PHASES = 16;
      const WALK_STEPS = 6000;
      const walkPhase = (pointAt, cruisePxS, phase) => {
        const step = cruisePxS / 60;
        let acc = -phase * step;
        let prev = pointAt(0);
        let mark = pointAt(0);
        let prevHeading = null;
        let worst = 0;
        for (let i = 1; i <= WALK_STEPS; i += 1) {
          const q = pointAt(i / WALK_STEPS);
          acc += Math.hypot(q.x - prev.x, q.y - prev.y);
          prev = q;
          if (acc >= step) {
            const h = { x: q.x - mark.x, y: q.y - mark.y };
            if (prevHeading) worst = Math.max(worst, turnBetween(prevHeading, h));
            prevHeading = h;
            mark = q;
            acc = 0;
          }
        }
        return worst;
      };
      const walk = (pointAt, cruisePxS) => {
        let w = 0;
        for (let k = 0; k < PHASES; k += 1) w = Math.max(w, walkPhase(pointAt, cruisePxS, k / PHASES));
        return w;
      };

      // ---- CHANNEL 1: the drawn bank ------------------------------------
      //
      // Baseline is R-LF-9.1's OWN before-state — both repairs reverted in
      // the live modules — because that is the comparison this row exists to
      // make and it is computable here. `main@42a83c7`'s figure is NOT
      // recomputed: the bank channel needs main's whole timing pipeline, and
      // reconstructing that is a fork of the file rather than a
      // reconstruction of a corner, which is the line the baseline discipline
      // above draws deliberately. It is cited with its provenance instead.
      const bankWorst = async (fSrc, aSrc) => {
        const mod = fSrc === flightSource ? flight
          : await import(`data:text/javascript;base64,${Buffer.from(fSrc).toString('base64')}`);
        const build = aSrc === moduleSource ? buildAttitude
          : (await import(`data:text/javascript;base64,${Buffer.from(aSrc).toString('base64')}`)).buildAttitude;
        let worst = { v: 0, label: '' };
        for (const p of PLANS) {
          const plan = mod === flight ? p.plan : mod.buildPollinationPlan({
            from: p.from, target: p.target, ringStep: lattice.ringStepFor(44), bodyLengthPx: BODY_LENGTH_PX,
            width: BOX, height: BOX, approachSpeedPxS: p.speed, weaveSign: p.weaveSign,
          });
          const at = build(plan.path, {
            width: BOX, height: BOX, size: 44, closed: false,
            easing: plan.easing, durationMs: plan.durationMs, heldFacing: plan.heldFacing,
          });
          const frames = Math.max(2, Math.round((plan.durationMs / 1000) * 60));
          const ir = at.inputRange;
          const ro = at.rotateOutput;
          let prev = null;
          for (let f = 0; f <= frames; f += 1) {
            const t = f / frames;
            let v = ro[ro.length - 1];
            if (t <= ir[0]) v = ro[0];
            else {
              for (let k = 1; k < ir.length; k += 1) {
                if (t <= ir[k]) {
                  const w = ir[k] === ir[k - 1] ? 1 : (t - ir[k - 1]) / (ir[k] - ir[k - 1]);
                  v = ro[k - 1] + w * (ro[k] - ro[k - 1]);
                  break;
                }
              }
            }
            if (prev !== null && Math.abs(v - prev) > worst.v) worst = { v: Math.abs(v - prev), label: p.label };
            prev = v;
          }
        }
        return worst;
      };
      // M10 OF THE BATTERY FOUND THIS ONE. These two strings ARE the baseline
      // — if either stops matching, `bankBefore` silently becomes a second
      // copy of `bankNow` and the row reports a 1x improvement as if it were
      // measured. N9b's lesson, one row over: A REPORT CANNOT POLICE ITS OWN
      // INPUTS, so the inputs get policed here. This is the one part of N2b
      // that can fail, and it is a claim about the INSTRUMENT, not a bound on
      // the thing measured.
      const BANK_MUTATIONS = [
        [flightSource, 'const arcPoints = turnIsSwept(turn) ? adaptiveCurveSamples(arcCurveAt)'],
        [moduleSource, 'const pitch = pitchFor(dx, dy, heldPitch);'],
      ];
      const bankMutationsReachable = BANK_MUTATIONS.every(([src, needle]) => src.includes(needle));
      const bankNow = await bankWorst(flightSource, moduleSource);
      const bankBefore = !bankMutationsReachable ? { v: NaN, label: 'unreachable' } : await bankWorst(
        flightSource.replace(
          'const arcPoints = turnIsSwept(turn) ? adaptiveCurveSamples(arcCurveAt)',
          'const arcPoints = turn && turn.sweep > 0 ? adaptiveCurveSamples(arcCurveAt)',
        ),
        moduleSource.replace('const pitch = pitchFor(dx, dy, heldPitch);', 'const pitch = pitchFor(dx, dy);'),
      );

      // ---- CHANNEL 2: the path heading ----------------------------------
      const LEG_BINS = [[0, 30.1], [30.1, 60.1], [60.1, 120.3], [120.3, Infinity]];
      const bins = LEG_BINS.map(([lo, hi]) => ({ lo, hi, n: 0, worst: 0, over: 0 }));
      let headNow = { v: 0, label: '' };
      let legMin = Infinity;
      let legMax = 0;
      for (const p of PLANS) {
        const t = geometryFor(p);
        if (!t) continue;
        const chord = { x: t.tangent.x - p.from.x, y: t.tangent.y - p.from.y };
        const L = Math.hypot(chord.x, chord.y);
        const nrm = { x: -chord.y / L, y: chord.x / L };
        const A = p.plan.weaveAmplitudePx;
        const c = p.plan.weaveCycles;
        const at = (u) => {
          const off = flight.weaveOffsetAt(u, A, c, p.weaveSign);
          return { x: p.from.x + chord.x * u + nrm.x * off, y: p.from.y + chord.y * u + nrm.y * off };
        };
        const w = walk(at, p.plan.profile.cruisePxS);
        legMin = Math.min(legMin, L);
        legMax = Math.max(legMax, L);
        if (w > headNow.v) headNow = { v: w, label: p.label };
        const b = bins.find((bb) => L >= bb.lo && L < bb.hi);
        if (b) { b.n += 1; b.worst = Math.max(b.worst, w); if (w > flight.MAX_FRAME_SPEED_STEP_FRACTION) b.over += 1; }
      }
      // main's weave over main's OWN drawn span and its fixed 1.5 cycles —
      // the closed-form reconstruction `filletRef` already validates, walked
      // with the same phase-swept instrument. Cruise is the live plan's: main's
      // own cruise is higher, so this column UNDERSTATES the baseline, which
      // is the safe direction for a claim of improvement.
      let headBefore = { v: 0, label: '' };
      for (const p of PLANS) {
        const ref = filletRef(p);
        const r = 0.25 * Math.min(ref.L, OFFSET_PX);
        const end = {
          x: ref.staging.x + (p.from.x - ref.staging.x) * (r / ref.L),
          y: ref.staging.y + (p.from.y - ref.staging.y) * (r / ref.L),
        };
        const off = (u) => ref.A * p.weaveSign * Math.sin(Math.PI * u) * Math.sin(TAU_N * 1.5 * u);
        const at = (u) => ({
          x: p.from.x + (end.x - p.from.x) * u + ref.n.x * off(u),
          y: p.from.y + (end.y - p.from.y) * u + ref.n.y * off(u),
        });
        const w = walk(at, p.plan.profile.cruisePxS);
        if (w > headBefore.v) headBefore = { v: w, label: p.label };
      }

      // ---- PROVENANCE: radius, and the sampler ---------------------------
      const weaveRadius = (() => {
        let worst = { radius: Infinity, label: '', u: 0 };
        for (const p of PLANS) {
          const A = p.plan.weaveAmplitudePx;
          const L = p.plan.weaveSpanPx;
          const c = p.plan.weaveCycles;
          const h = 1e-6;
          for (let u = 0.002; u < 1; u += 0.002) {
            const o1 = flight.weaveSlopeAt(u, A, c, p.weaveSign);
            const o2 = (flight.weaveSlopeAt(u + h, A, c, p.weaveSign) - flight.weaveSlopeAt(u - h, A, c, p.weaveSign)) / (2 * h);
            const k = Math.abs(L * o2) / ((L * L + o1 * o1) ** 1.5);
            if (!(k > 1e-12)) continue;
            if (1 / k < worst.radius) worst = { radius: 1 / k, label: p.label, u };
          }
        }
        return worst;
      })();
      let vertex = { v: 0, label: '' };
      for (const p of PLANS) {
        for (let i = 1; i < p.pts.length - 1; i += 1) {
          const v1 = { x: p.pts[i].x - p.pts[i - 1].x, y: p.pts[i].y - p.pts[i - 1].y };
          const v2 = { x: p.pts[i + 1].x - p.pts[i].x, y: p.pts[i + 1].y - p.pts[i].y };
          if (Math.hypot(v1.x, v1.y) < 1e-9 || Math.hypot(v2.x, v2.y) < 1e-9) continue;
          const th = deg(turnBetween(v1, v2));
          if (th > vertex.v) vertex = { v: th, label: p.label };
        }
      }

      if (!bankMutationsReachable || !(bankBefore.v > bankNow.v)) {
        bad(
          'N2b channel 1 has a baseline that is actually a baseline',
          !bankMutationsReachable
            ? 'one of the two R-LF-9.1 revert patches no longer matches its source, so the "before" column is a second copy of the "after" column and the improvement it reports is 1x by construction'
            : `the reverted build measures ${bankBefore.v.toFixed(4)}deg/frame against the shipped ${bankNow.v.toFixed(4)} — the baseline must be WORSE, or R-LF-9.1 is not the thing this row is attributing the difference to`,
        );
      }
      ok(
        `N2b REPORTED, not gated — TWO CHANNELS, and R-LF-9 is why they are two. §7 row 2's bound is on THE TURN (N2); the weave is GAIT, whose rate is already ruled in Hz by WEAVE_RATE_HZ=${flight.WEAVE_RATE_HZ}, and a second bound on it in rad/frame forbids ${PLANS.length} of ${PLANS.length} plans including the rhythm Colin approved. `
        + `CHANNEL 1 — THE DRAWN BANK, what renders as the bee: worst ${bankNow.v.toFixed(4)}deg/frame (${bankNow.label}) against the turn's ruled ${RATE_BOUND_DEG.toFixed(4)}, i.e. ${(RATE_BOUND_DEG / bankNow.v).toFixed(1)}x INSIDE it. `
        + `Its baseline is R-LF-9.1's own before-state, both repairs reverted here: ${bankBefore.v.toFixed(4)}deg/frame (${bankBefore.label}) — over the bound. That whole distance is the coincident waypoint's flick, not the weave. `
        + `main@42a83c7 measures 36.3323deg/frame on this channel; that figure is CITED, not recomputed here (Lumen's shell and mine, off main's real source), because the bank channel needs main's entire timing pipeline and reconstructing that would be a fork of the file rather than a reconstruction of a corner. `
        + `CHANNEL 2 — THE PATH HEADING, walked at arc-length steps of cruise/60 on the drawn curve: worst ${deg(headNow.v).toFixed(2)}deg/frame (${headNow.label}), ${(headNow.v / flight.MAX_FRAME_SPEED_STEP_FRACTION).toFixed(2)}x the turn's bound, over legs ${legMin.toFixed(1)}..${legMax.toFixed(1)}pt. `
        + `By leg: ${bins.map((b) => `${b.lo.toFixed(0)}-${b.hi === Infinity ? '+' : b.hi.toFixed(0)}pt n=${b.n} ${deg(b.worst).toFixed(2)} (${b.over} over)`).join('; ')} — every plan at every scale, so there is no sub-population to carve out and the carve-out had to be the QUANTITY. `
        + `Baseline, same instrument, main's weave over main's own drawn span at 1.5 fixed cycles: ${deg(headBefore.v).toFixed(2)}deg/frame — this commit improves it ${(headBefore.v / headNow.v).toFixed(2)}x and the residual is pre-existing. `
        + `INSTRUMENT: both channel-2 figures are PHASE-SWEPT over ${PHASES} phases, which is a correction to the single-phase walks published in the ratification thread — a worst-per-frame from one walk depends on where its marks land, and the tell was that the single-phase baseline was NON-MONOTONE in cruise speed, which no property of a curve can be. Swept, it is monotone and both figures rise. `
        + `PROVENANCE, never the headline: the weave's minimum radius of curvature is ${weaveRadius.radius.toFixed(4)}pt at u=${weaveRadius.u.toFixed(3)} (${weaveRadius.label}) — a number in NEITHER channel's frame, being neither what the path does per frame nor what the character does; and the rendered polyline's worst VERTEX turn is ${vertex.v.toFixed(3)}deg, a property of MAX_CHORD_DEVIATION_PX=${flight.MAX_CHORD_DEVIATION_PX} and of no curve here`,
      );
    }

    // --- N3. Acceptance 3 — mutate back, and PERSIST the harness ----------
    //
    //     §7: "Restore `filletRadiusPx = FILLET_LEG_FRACTION x min(...)` and
    //     row 1 must red on the five 180deg hops and row 2 on all seventeen.
    //     A gate that only greens has not been tested. Persist the mutation
    //     harness in the file this time."
    //
    //     `filletRef` above IS that harness, and it is closed form rather
    //     than a re-run of an old build: the fillet's failure is not a
    //     junction ANGLE — a quadratic Bezier joins each trimmed leg on that
    //     leg's own tangent, so both of the fillet's joins are exactly as
    //     clean as R-LF-7's. What it has instead is a CUSP: when the two trim
    //     points coincide, `B'(u)` passes through zero and the direction
    //     reverses in one instant. `B'` is linear in `u`, so where it
    //     vanishes is a closed-form solve and not a search.
    //
    //     THE FIVE HOPS ARE CONFIRMED AND THEY ARE NAMED. They are the hops
    //     whose approach runs along the descent's own axis, so the trim takes
    //     the same length off both legs from the same point.
    {
      const cusps = [];
      let worstTurn = { v: 0, label: '' };
      let worstRate = { v: 0, label: '' };
      let overBound = 0;
      const seen = new Set();
      for (const p of PLANS) {
        const ref = filletRef(p);
        if (ref.minTangentSpeed < 1e-6) {
          cusps.push(p.label);
          seen.add(p.label.replace(/^.*?(\d+->\d+).*$/, '$1'));
        }
        if (deg(ref.totalTurn) > worstTurn.v) worstTurn = { v: deg(ref.totalTurn), label: p.label };
        const rate = (p.plan.profile.cruisePxS * ref.maxCurvature) / 60;
        if (rate > flight.MAX_FRAME_SPEED_STEP_FRACTION) overBound += 1;
        // A cusp's curvature is infinite by definition, so it is counted and
        // not maximised over — a worst-of column containing Infinity reports
        // the cusps twice and the other 296 plans not at all.
        if (Number.isFinite(rate) && rate > worstRate.v) worstRate = { v: rate, label: p.label };
      }
      const shippedCusp = PLANS.every((p) => {
        const t = geometryFor(p);
        // On the arc the tangent's magnitude is R x |dtheta/du| = R x sweep,
        // which is zero only where the sweep is (and a zero sweep is a
        // straight line, not a cusp). There is no `u` at which the shipped
        // path's tangent can vanish — that is the property, not a measurement.
        return t && (t.sweep === 0 || t.radiusPx * t.sweep > 0);
      });
      if (cusps.length > 0 && worstRate.v > flight.MAX_FRAME_SPEED_STEP_FRACTION && shippedCusp) {
        ok(
          `N3 calibration: the pre-R-LF-7 fillet, reconstructed from its own published formula, CUSPS on ${cusps.length} of ${PLANS.length} plans — `
          + `${[...seen].sort().join(', ')}, i.e. FIVE distinct hops x ${DEVICES.length} containers x 2 weave signs. `
          + `At a cusp the tangent vanishes and reverses by ${worstTurn.v.toFixed(3)}deg in one instant, which is N1's defect in its severest form; `
          + `and the fillet's turn rate exceeds R-LF-2.1's bound on ${overBound} of ${PLANS.length} plans — infinite on the ${cusps.length} cusped ones, and worst ${deg(worstRate.v).toFixed(2)}deg/frame (${(worstRate.v / flight.MAX_FRAME_SPEED_STEP_FRACTION).toFixed(1)}x, ${worstRate.label}) among the ${PLANS.length - cusps.length} that stay finite — which is N2's. `
          + `The shipped path cannot cusp at all: the arc's tangent has magnitude R x sweep, so it vanishes only where the sweep does, and a zero sweep is a straight line`,
        );
      } else {
        bad('N3 the rows can see the defect the ruling exists to remove', `reconstruction produced ${cusps.length} cusps and a worst rate of ${deg(worstRate.v).toFixed(3)}deg/frame — if either is zero the baseline is no longer reproducing main@42a83c7 and every comparison below it is unanchored`);
      }
    }

    // --- N4. Acceptance 4 — degeneracy, and the cap ------------------------
    //
    //     "The five from-directly-above hops must produce sweep 0.0deg, phi
    //     0deg, and a path identical to today's — asserted as identity, not
    //     as a bound. Separately: |phi| <= 30deg on every plan, and report
    //     how often the cap binds."
    //
    //     ONE CORRECTION TO THE ROW AS WRITTEN, and it is measured rather
    //     than argued: a zero sweep does NOT imply `phi = 0`. `phi = 0` is
    //     the degenerate case where the bee is already on the descent line;
    //     the ALIGN candidate reaches sweep 0 at whatever bearing puts that
    //     line through `from`, and on this lattice most zero-sweep plans sit
    //     at the CAP rather than at 0. Both are "no turn at all" and both are
    //     correct; only the second is what §5's own off-axis table calls
    //     "at 38.07deg off-axis the bearing rotates into line with the
    //     approach and there is again no turn."
    //
    //     And "identical to today's" cannot be asserted as an identity after
    //     R-LF-8: the weave's RATE moved, so the approach is not point-wise
    //     identical to main's on any hop. What IS an identity is the
    //     geometry: sweep exactly 0, and the descent exactly the straight
    //     drop from `staging`. That is what this row asserts, and it says so.
    {
      let maxPhi = 0;
      let capBinds = 0;
      const zeroSweep = [];
      let notStraight = 0;
      for (const p of PLANS) {
        const t = p.plan.turn;
        maxPhi = Math.max(maxPhi, Math.abs(deg(t.bearingRad)));
        if (Math.abs(Math.abs(deg(t.bearingRad)) - CAP_DEG) < 1e-9) capBinds += 1;
        if (t.sweepRad === 0) {
          zeroSweep.push(p);
          // The descent must then be exactly `staging` -> `target`: one
          // straight run, so `path[descentStartIndex]` IS `staging`.
          const head = p.pts[p.plan.descentStartIndex];
          const staging = { x: p.plan.staging.x * BOX, y: p.plan.staging.y * BOX };
          if (Math.hypot(head.x - staging.x, head.y - staging.y) > 1e-9) notStraight += 1;
        }
      }
      const phiOf = (p) => deg(p.plan.turn.bearingRad);
      const atZero = zeroSweep.filter((p) => Math.abs(phiOf(p)) < 1e-9).length;
      const atCap = zeroSweep.filter((p) => Math.abs(Math.abs(phiOf(p)) - CAP_DEG) < 1e-9).length;
      // THE CAP IS PINNED TO THE RULED NUMBER, not read out of the module.
      // A row that reads `STAGING_BEARING_CAP_RAD` and then asserts nothing
      // exceeds it moves BOTH SIDES together: swept to 60deg it stays green
      // while the settle's verticality — the load-bearing half of §28.4 —
      // quietly halves. §5 rules 30deg by measurement (the loop class
      // disappears there and nowhere earlier) and by design (past it "the
      // settle starts trading away its own verticality"), so 30 is a RULING
      // and belongs on the assertion's own side of the equals sign. The
      // coupling has two directions: the constant must equal the ruling AND
      // no plan may exceed the constant.
      const RULED_CAP_DEG = 30;
      const capIsRuled = Math.abs(CAP_DEG - RULED_CAP_DEG) < 1e-9;
      if (capIsRuled && maxPhi <= CAP_DEG + 1e-9 && notStraight === 0 && zeroSweep.length > 0) {
        ok(
          `N4 STAGING_BEARING_CAP_RAD is §5's ruled ${RULED_CAP_DEG}deg (asserted against the ruling, not read from the module — a row that reads its own bound cannot see the bound move), and |phi| never exceeds it (worst ${maxPhi.toFixed(6)}deg) and the cap BINDS on ${capBinds} of ${PLANS.length} plans (${((capBinds / PLANS.length) * 100).toFixed(1)}%) — a ruled ceiling, as §5 says, not a free optimum. `
          + `${zeroSweep.length} plans degenerate to sweep exactly 0 (${atZero} at phi=0, ${atCap} at the cap, ${zeroSweep.length - atZero - atCap} elsewhere), and on every one of them the descent is exactly the straight drop: path[descentStartIndex] IS staging, bit-for-bit. `
          + `CORRECTION TO THE ROW AS WRITTEN: sweep 0 does not imply phi 0 — the ALIGN candidate reaches "no turn at all" at whatever bearing puts the descent line through \`from\`, which is §5's own 38.07deg observation, and most of these sit at the cap`,
        );
      } else {
        bad(
          'N4 the bearing stays inside its cap and degenerates cleanly',
          capIsRuled
            ? `max |phi| ${maxPhi.toFixed(6)}deg (cap ${CAP_DEG}), ${zeroSweep.length} zero-sweep plans of which ${notStraight} do not descend straight from staging`
            : `STAGING_BEARING_CAP_RAD is now ${CAP_DEG.toFixed(4)}deg, not the ${RULED_CAP_DEG}deg §5 rules. Past 30deg the settle trades away its own verticality (cos of the bearing is the vertical fraction of the drop: ${Math.cos(flight.STAGING_BEARING_CAP_RAD).toFixed(4)} against 0.8660 at the ruling), which is §28.4's load-bearing half. Re-rule it or put it back.`,
        );
      }
    }

    // --- N4b. Acceptance 4's other half — the candidate set is CLOSED ------
    //
    //     `turnCandidateBearings` returns three bearings (ALIGN, +-cap, 0) and
    //     `chooseTurn` picks the minimum sweep over them. The module's own
    //     comment argues that is enough — the sweep is monotone in `phi` for
    //     a fixed sigma, so a minimum sits at an end of the interval or at its
    //     zero, and the zero is closed form. §7 asks for the EVIDENCE and not
    //     the argument: "the gate re-runs this against a dense sweep of phi
    //     and asserts the candidate set attains the global minimum."
    //
    //     Without this row the minimisation is untested. Measured: replacing
    //     the comparison with `false` — so the FIRST candidate wins instead of
    //     the smallest — changes no other row in this file.
    {
      const STEP_DEG = 0.25;
      let worstExcess = { v: 0, label: '' };
      let checked = 0;
      for (const p of PLANS) {
        const chosen = geometryFor(p);
        if (!chosen) continue;
        let best = Infinity;
        let bestPhi = 0;
        for (let d = -CAP_DEG; d <= CAP_DEG + 1e-9; d += STEP_DEG) {
          const phi = (d * Math.PI) / 180;
          for (const sigma of [1, -1]) {
            const t = flight.solveTurn({
              from: p.from, target: p.target, offsetPx: OFFSET_PX, phi, sigma, radiusPx: p.plan.turn.radiusPx,
            });
            if (t && t.sweep < best) { best = t.sweep; bestPhi = d; }
          }
        }
        checked += 1;
        // The dense sweep is a LOWER BOUND on the true minimum only to within
        // its own step, so the chosen sweep may legitimately sit a little
        // BELOW it — the closed-form ALIGN bearing lands between grid points.
        // What may not happen is the chosen sweep sitting ABOVE it: that is a
        // candidate the closed set missed.
        const excess = deg(chosen.sweep - best);
        if (excess > worstExcess.v) worstExcess = { v: excess, label: p.label, chosen: deg(chosen.sweep), best: deg(best), bestPhi };
      }
      // One step of the grid, converted into sweep. The descent heading is
      // exactly `pi/2 + phi`, so a bearing step of `STEP_DEG` cannot move the
      // sweep by more than `STEP_DEG` plus staging's own displacement, which
      // §5's monotonicity argument bounds below 1x. Two steps is the margin.
      const TOLERANCE_DEG = 2 * STEP_DEG;
      if (checked === PLANS.length && worstExcess.v <= TOLERANCE_DEG) {
        ok(
          `N4b the closed candidate set attains the global minimum: against a dense phi sweep (${((2 * CAP_DEG) / STEP_DEG + 1).toFixed(0)} bearings x 2 sides x ${PLANS.length} plans), the chosen sweep never exceeds the swept minimum by more than ${worstExcess.v.toFixed(4)}deg (tolerance ${TOLERANCE_DEG}deg = two grid steps; worst ${worstExcess.label}, chose ${worstExcess.chosen.toFixed(3)}deg against a grid best of ${worstExcess.best.toFixed(3)}deg at phi=${worstExcess.bestPhi.toFixed(2)}deg). `
          + `The module's monotonicity argument says three bearings suffice; this is the evidence rather than the argument, and it is the only row that reds when the minimisation is replaced by "take the first candidate"`,
        );
      } else {
        bad('N4b the closed candidate set attains the global minimum', `${checked} of ${PLANS.length} plans checked; worst excess over the dense sweep ${worstExcess.v.toFixed(4)}deg at ${worstExcess.label} (chose ${worstExcess.chosen?.toFixed(3)}deg, grid found ${worstExcess.best?.toFixed(3)}deg at phi=${worstExcess.bestPhi?.toFixed(2)}deg) against a ${TOLERANCE_DEG}deg tolerance — a bearing outside the closed set beats it, so the set is not closed`);
      }
    }

    // --- N4c. §7 row 4(b) — THE MULTIPLICITY ASSERTION --------------------
    //
    //     Named `4(b)` in the spec; `N4b` in this file was already taken by
    //     acceptance 4's other half, so it is `N4c` here and the numbering is
    //     the only thing that differs.
    //
    //     R-LF-9.1, and the reason it exists is the reason N4 could never have
    //     caught it. N4 walks the 32 plans whose sweep is EXACTLY zero and
    //     asserts `path[descentStartIndex]` IS `staging` — a claim about one
    //     point's VALUE, at one index. The defect is a point occurring TWICE,
    //     somewhere else, on a DISJOINT population. A row that enumerates a
    //     set which does not contain the defect is worse than a row that does
    //     not look, because it prints a number that reads as coverage.
    //
    //     Both facts below are asserted, not just the headline: no zero-length
    //     segment anywhere in `path`, AND the calibration population is 40 and
    //     shares nothing with N4's 32.
    {
      const coincidentIn = (pts) => {
        for (let i = 1; i < pts.length; i += 1) {
          if (pts[i].x === pts[i - 1].x && pts[i].y === pts[i - 1].y) return true;
        }
        return false;
      };
      const live = PLANS.filter((p) => coincidentIn(p.plan.path));

      // THE CALIBRATION, and it is a source mutation rather than an argument:
      // put the bare `> 0` back and rebuild the same lattice. A row asserting
      // an ABSENCE has to show the absence is a property of the build and not
      // of the probe.
      const MUT_FROM = 'const arcPoints = turnIsSwept(turn) ? adaptiveCurveSamples(arcCurveAt)';
      const MUT_TO = 'const arcPoints = turn && turn.sweep > 0 ? adaptiveCurveSamples(arcCurveAt)';
      const reachable = flightSource.includes(MUT_FROM);
      let mutHits = [];
      let mutTiny = 0;
      if (reachable) {
        const mutated = await import(`data:text/javascript;base64,${Buffer.from(flightSource.replace(MUT_FROM, MUT_TO)).toString('base64')}`);
        for (const p of PLANS) {
          const plan = mutated.buildPollinationPlan({
            from: p.from, target: p.target, ringStep: lattice.ringStepFor(44), bodyLengthPx: BODY_LENGTH_PX,
            width: BOX, height: BOX, approachSpeedPxS: p.speed, weaveSign: p.weaveSign,
          });
          if (coincidentIn(plan.path)) mutHits.push(p.label);
          const sw = plan.turn.sweepRad;
          if (sw > 0 && sw <= flight.TURN_SWEEP_TIE_RAD) mutTiny += 1;
        }
      }
      // Disjointness is the half of the ruling that corrects the first draft,
      // so it is asserted rather than described.
      const zeroSweepLabels = new Set(PLANS.filter((p) => p.plan.turn.sweepRad === 0).map((p) => p.label));
      const overlap = mutHits.filter((l) => zeroSweepLabels.has(l)).length;
      // And the void the threshold sits in, measured rather than asserted:
      // 1e-6 is only "not a tuned number" if nothing real is near it.
      //
      // THE VOID IS READ FROM THE GEOMETRY, NOT FROM THE CONSTANT. My first
      // spelling partitioned the sweeps BY `TURN_SWEEP_TIE_RAD` and then
      // asserted the constant sat between the two halves — which is a
      // tautology, because the halves are defined by it. It could not fail,
      // and the battery's M3 stayed green through a 100000x widening. Third
      // outing of A ROW THAT READS ITS OWN BOUND CANNOT SEE THE BOUND MOVE,
      // and the first where I wrote it INTO the fix for the previous one.
      //
      // Instead: sort the sweeps and find the largest MULTIPLICATIVE gap.
      // That is a property of the lattice alone — no constant on either side
      // — and the claim becomes the one actually being made, that the
      // threshold sits in the empty space between the degenerate sweeps and
      // the real ones.
      const sweeps = PLANS.map((p) => p.plan.turn.sweepRad).filter((v) => v > 0).sort((a, b) => a - b);
      let gapAt = 0;
      let gapRatio = 0;
      for (let i = 0; i < sweeps.length - 1; i += 1) {
        const r = sweeps[i + 1] / sweeps[i];
        if (r > gapRatio) { gapRatio = r; gapAt = i; }
      }
      const degenerateMax = sweeps[gapAt];
      const realMin = sweeps[gapAt + 1];

      // M3 OF THE BATTERY FOUND THIS HOLE. The row PRINTED the void and did
      // not assert the threshold sits in it, so widening TURN_SWEEP_TIE_RAD
      // to 1e-1 stayed green — harmless only because the void happens to be
      // fourteen orders wide. A threshold justified by a measurement has to
      // be CHECKED against that measurement, or the justification expires
      // silently the first time the geometry moves a sweep down toward it.
      const epsilonInVoid = flight.TURN_SWEEP_TIE_RAD > degenerateMax && flight.TURN_SWEEP_TIE_RAD < realMin;

      if (live.length === 0 && reachable && mutHits.length === 40 && overlap === 0 && zeroSweepLabels.size === 32 && epsilonInVoid) {
        ok(
          `N4c §7 row 4(b) — NO ZERO-LENGTH SEGMENT anywhere in \`path\`, on any of ${PLANS.length} plans. `
          + `CALIBRATED BY MUTATION: restore the bare \`turn.sweep > 0\` emission guard and ${mutHits.length} plans grow a coincident waypoint — exactly the ${mutTiny} whose sweep lands in (0, ${flight.TURN_SWEEP_TIE_RAD}], and DISJOINT from N4's ${zeroSweepLabels.size} sweep-exactly-zero plans (overlap ${overlap}). `
          + `That disjointness is the finding: the sweep-0 branch was always correct — it emits ONE point and \`slice(1)\` removes it cleanly — and the defect lived in the other branch, where an arc of ~1e-15 rad over R=${BODY_LENGTH_PX.toFixed(4)}pt is ~3e-14pt long and \`adaptiveCurveSamples\` emits bit-identical points. `
          + `THE THRESHOLD IS NOT TUNED, and this row measures the void rather than taking that on faith: the largest degenerate sweep is ${degenerateMax.toExponential(3)} rad and the smallest real one is ${realMin.toFixed(4)} rad, so ${flight.TURN_SWEEP_TIE_RAD} sits in the middle of ${Math.round(Math.log10(realMin / degenerateMax))} orders of magnitude with nothing in them`,
        );
      } else {
        bad(
          'N4c no zero-length segment anywhere in path (R-LF-9.1)',
          !reachable
            ? `the calibration mutation matched nothing — the emission guard is spelled differently now, so this row ran uncalibrated and its green would mean nothing`
            : !epsilonInVoid
              ? `TURN_SWEEP_TIE_RAD is ${flight.TURN_SWEEP_TIE_RAD}, which is NOT strictly inside the void it is justified by: largest degenerate sweep ${degenerateMax.toExponential(3)} rad, smallest real one ${realMin.toFixed(4)} rad. Either it now reclassifies a real turn as no-turn, or a real sweep has come down to meet it — re-derive the threshold, do not widen it`
              : `${live.length} live plans carry a coincident waypoint; mutation reproduced ${mutHits.length} (expected 40), overlap with N4's ${zeroSweepLabels.size} sweep-zero plans ${overlap} (expected 0). A coincident waypoint takes ZERO wall time, so the position channel stays bit-for-bit correct and only the derived attitude shows it — see N4d`,
        );
      }
    }

    // --- N4d. THE CLASS HALF, and it has to be FORCED ---------------------
    //
    //     R-LF-9.1 ships two repairs: the emission guard (N4c) and
    //     `pitchFor`'s hold. Measured on the real lattice they are
    //     INDISTINGUISHABLE — each alone returns the same worst drawn-bank
    //     rate as both together (§7 row 2's table),
    //     because with the guard fixed no plan produces a coincident waypoint
    //     for the hold to hold through. So a row that reads the shipped
    //     lattice can only ever report the class fix as dormant, and would
    //     stay green if someone deleted it. Same shape as N10's pass-closed
    //     convergence claim, and the same answer: force it.
    //
    //     The force is a SYNTHETIC path with a coincident pair in it, handed
    //     straight to `buildAttitude`. That is not a hypothetical: it is what
    //     `path` contained at f32112a, and the next stale premise can put it
    //     back from a different call site.
    {
      // Three waypoints of real descent, with the middle one duplicated.
      const probePath = [
        { x: 0.20, y: 0.20 }, { x: 0.30, y: 0.40 }, { x: 0.30, y: 0.40 }, { x: 0.32, y: 0.80 },
      ];
      const OPTS = { width: 400, height: 800, size: 44, closed: false };
      const banksOf = (mod) => mod.buildAttitude(probePath, OPTS).segments.map((s) => s.bank);
      const shipped = banksOf(attitude);

      const MUT_FROM = 'const pitch = pitchFor(dx, dy, heldPitch);';
      const MUT_TO = 'const pitch = pitchFor(dx, dy);';
      const reachable = moduleSource.includes(MUT_FROM);
      let mutated = null;
      if (reachable) {
        mutated = banksOf(await import(`data:text/javascript;base64,${Buffer.from(moduleSource.replace(MUT_FROM, MUT_TO)).toString('base64')}`));
      }
      // The middle segment is the directionless one. Shipped, it inherits;
      // mutated, `atan2(0,0)` answers horizontal and `bankFor` draws it.
      const holds = shipped[1] === shipped[0] && shipped[0] !== 0;
      const mutFlicks = mutated !== null && mutated[1] === 0 && mutated[0] !== 0;
      // And the flick's SIZE, in the channel that renders: the roll it injects
      // between its neighbours, which is what the 15.9622 in §7 row 2's bank
      // table is made of.
      const flickDeg = mutated === null ? NaN : Math.max(Math.abs(mutated[0] - mutated[1]), Math.abs(mutated[2] - mutated[1]));

      if (holds && mutFlicks) {
        ok(
          `N4d R-LF-9.1's CLASS half, forced: handed a path with a coincident pair, \`buildAttitude\` holds the previous waypoint's bank through it (${shipped[1].toFixed(4)}deg, inherited from ${shipped[0].toFixed(4)}) instead of answering \`atan2(0,0)\` with horizontal. `
          + `Mutation \`pitchFor(dx, dy)\` — drop the held pitch — puts the level frame back at ${mutated[1].toFixed(4)}deg between neighbours banked ${mutated[0].toFixed(4)} and ${mutated[2].toFixed(4)}, a ${flickDeg.toFixed(4)}deg roll injected into two adjacent frames. `
          + `FORCED ON PURPOSE: on the shipped lattice N4c's guard means no plan reaches this code, so each repair alone measures the SAME worst drawn-bank rate (§7 row 2's table, both repairs and either one) and a row reading the real lattice would go green with the hold DELETED. A zero returned for an absent quantity is indistinguishable from a zero that was measured, and only a synthetic input can tell them apart here`,
        );
      } else {
        bad(
          'N4d a directionless segment inherits its bank rather than being answered horizontal',
          !reachable
            ? 'the calibration mutation matched nothing — `buildAttitude` no longer threads a held pitch through `pitchFor`, so this row ran uncalibrated'
            : `shipped banks ${JSON.stringify(shipped.map((b) => Number(b.toFixed(4))))} (the middle one must equal the first and be non-zero), mutated ${JSON.stringify(mutated?.map((b) => Number(b.toFixed(4))))} (the middle one must be 0, or the mutation is not reaching the defect)`,
        );
      }
    }

    // --- N4e. §7 row 4's LAST clause — the |phi| distribution, printed ----
    //
    //     "report how often the cap binds, because a ruled ceiling that binds
    //     everywhere is one number away from being the mechanism."
    //
    //     N4 has printed the BINDING COUNT since f32112a — 296 of 336, which
    //     is the figure Lumen independently measured. What was missing is the
    //     DISTRIBUTION, and it is not a refinement of the count: it changes
    //     the answer. A cap binding on 88% with the rest spread across the
    //     interval is a cap. A cap binding on 88% with the rest at ONE other
    //     value is a two-valued parameter wearing a bound's clothing, and
    //     that is §28.5's dead approach clamp exactly. Only the shape tells
    //     them apart, which is why a count could not.
    //
    //     REPORTED, not gated, and deliberately no verdict: §5 rules 30deg and
    //     N4 asserts it. Whether 30 is a bound or a value is Lumen's, and it
    //     is owed the device pass.
    {
      const signedPhi = PLANS.map((p) => deg(p.plan.turn.bearingRad));
      const phis = signedPhi.map(Math.abs);
      const atCap = phis.filter((v) => Math.abs(v - CAP_DEG) < 1e-9).length;
      const atZero = phis.filter((v) => v < 1e-9).length;
      const interiorVals = phis.filter((v) => v >= 1e-9 && Math.abs(v - CAP_DEG) >= 1e-9);
      const distinct = new Set(phis.map((v) => v.toFixed(9))).size;
      const capPos = signedPhi.filter((v) => Math.abs(v - CAP_DEG) < 1e-9).length;
      const capNeg = signedPhi.filter((v) => Math.abs(v + CAP_DEG) < 1e-9).length;
      // Cross-tabbed against the sweep, because the two degeneracies are
      // different questions and N4c's 40 is one of these cells, not a third.
      const cell = (phiK, sweepK) => PLANS.filter((p) => {
        const a = Math.abs(deg(p.plan.turn.bearingRad));
        const sw = p.plan.turn.sweepRad;
        const pk = a < 1e-9 ? 'zero' : (Math.abs(a - CAP_DEG) < 1e-9 ? 'cap' : 'interior');
        const sk = sw === 0 ? 'zero' : (sw <= flight.TURN_SWEEP_TIE_RAD ? 'tiny' : 'real');
        return pk === phiK && sk === sweepK;
      }).length;
      ok(
        `N4e REPORTED, not gated — the |phi| DISTRIBUTION, which is what §7 row 4's last clause asks for beyond the count N4 already prints, `
        + `AND IT IS A DIFFERENT ANSWER FROM THE COUNT. |phi| takes exactly ${distinct} values over all ${PLANS.length} plans: ${CAP_DEG.toFixed(4)}deg on ${atCap} and EXACTLY 0 on ${atZero}. `
        + `Strictly interior: ${interiorVals.length}. The ALIGN candidate — the whole reason the candidate set has a third member — never wins at a value of its own anywhere on this lattice; it wins only where it coincides with 0, i.e. where \`from\` already sits on the descent line. `
        + `Cross-tabbed against the sweep, because these are two degeneracies and not one: phi=cap x sweep-real ${cell('cap', 'real')}, phi=cap x sweep-0 ${cell('cap', 'zero')}, phi=cap x sweep-tiny ${cell('cap', 'tiny')}, phi=0 x sweep-0 ${cell('zero', 'zero')}, phi=0 x sweep-tiny ${cell('zero', 'tiny')}. `
        + `N4c's 40 coincident-waypoint plans are the two tiny-sweep cells (${cell('zero', 'tiny')} + ${cell('cap', 'tiny')}), not a third population. `
        + `SIGN, since it is what R-LF-7.1 resolves: of the ${atCap} at the cap, ${capPos} take +${CAP_DEG.toFixed(0)} and ${capNeg} take -${CAP_DEG.toFixed(0)} — the sweep is equal at both, so the ruled quantity is silent there and only the inboard clause decides. `
        + `WHAT THE SHAPE SAYS, and this is a report and not a verdict: on a two-valued parameter the cap is not a ceiling the optimum happens to reach, it IS the staging bearing on seven flights in eight — §28.5's shape, more so than the count suggested. N4b separately proves this is the true global minimum and not a search artefact, so it is a property of the geometry (the sweep is monotone in phi, so its minimum sits at an interval end or at its zero, and here the zero is only ever reachable AT zero). Owed the device pass: whether 30 reads as a bound or as a value`,
      );
    }

    // --- N5. Acceptance 5 — no forced loop --------------------------------
    //
    //     `from` outside the chosen turn circle on every plan, worst sweep
    //     reported, and the 294.6deg spelling reachable by a mutation: set
    //     the phi cap to 0 and watch it appear. That mutation is the ruling's
    //     own, and it is one argument rather than a source patch, because
    //     `chooseTurn` takes `capRad`.
    {
      let minClearance = Infinity;
      let worstSweep = { v: 0, label: '' };
      for (const p of PLANS) {
        const t = geometryFor(p);
        if (!t) { minClearance = -Infinity; break; }
        const d = Math.hypot(p.from.x - t.centre.x, p.from.y - t.centre.y);
        minClearance = Math.min(minClearance, d - t.radiusPx);
        if (t.sweep > worstSweep.v) worstSweep = { v: t.sweep, label: p.label };
      }
      // THE CALIBRATION NEEDED TWO MUTATIONS, NOT ONE, AND THE SECOND ONE IS
      // ITSELF THE FINDING. §5's mutation is `capRad = 0` — the spelling it
      // first ruled and then withdrew — and on its own that no longer
      // reproduces anything: at today's R the worst vertical-staging sweep is
      // 211.6deg and NOTHING passes 220deg. The 294.6deg class is a function
      // of R, and R shrank when R-LF-8 and R-LF-3.1 quieted the approach
      // (N10). So the calibration runs §5's mutation IN §5's OWN FRAME —
      // `WEAVE_ENVELOPE_EXPONENT` 1 and a fixed 1.5 cycles, i.e. the weave
      // that was live when the sweep was taken — and reproduces the ruling's
      // own two numbers exactly. Both columns are reported, because "the
      // defect is unreachable today" is a claim about today's radius and it
      // has to be visible rather than inferred from a silence.
      const cappedSweep = (mod) => {
        const out = { worst: 0, label: '', loops: 0, rejected: 0, maxR: 0 };
        const offsetPx = mod.stagingOffsetFor({ bodyLengthPx: BODY_LENGTH_PX, ringStep: lattice.ringStepFor(44) });
        for (const p of PLANS) {
          const plan = mod === flight ? p.plan : mod.buildPollinationPlan({
            from: p.from, target: p.target, ringStep: lattice.ringStepFor(44), bodyLengthPx: BODY_LENGTH_PX,
            width: BOX, height: BOX, approachSpeedPxS: p.speed, weaveSign: p.weaveSign,
          });
          out.maxR = Math.max(out.maxR, plan.turn.radiusPx);
          const t = mod.chooseTurn({
            from: p.from, target: p.target, offsetPx,
            radiusPx: plan.turn.radiusPx, capRad: 0, inboardSign: 0,
          });
          if (!t) { out.rejected += 1; continue; }
          if (t.sweep > 220 * (Math.PI / 180)) out.loops += 1;
          if (t.sweep > out.worst) { out.worst = t.sweep; out.label = p.label; }
        }
        return out;
      };
      const preSource = flightSource
        .replace('export const WEAVE_ENVELOPE_EXPONENT = 2;', 'export const WEAVE_ENVELOPE_EXPONENT = 1;')
        .replace(
          'export const weaveCyclesFor = (approachMs) => (WEAVE_RATE_HZ * Math.max(0, approachMs)) / 1000;',
          'export const weaveCyclesFor = () => 1.5;',
        );
      const capNow = cappedSweep(flight);
      const preMod = preSource === flightSource ? null
        : await import(`data:text/javascript;base64,${Buffer.from(preSource).toString('base64')}`);
      const capThen = preMod ? cappedSweep(preMod) : { loops: 0, worst: 0, label: 'mutation matched nothing', maxR: 0 };
      // AND THE REJECTION PATH IS EXERCISED, because on this lattice it never
      // fires. `solveTurn` returns `null` when `from` sits inside the circle,
      // and that guard is how acceptance 5 holds BY CONSTRUCTION rather than
      // by a bound on the sweep — but a guard that no plan reaches is a guard
      // nobody has ever seen work. Forced with a radius large enough that the
      // adjacent-seat hops fall inside: the solver must decline the candidate
      // rather than emit a turn with an imaginary tangent.
      const FORCED_R = 200;
      let declined = 0;
      let emitted = 0;
      let insideAccepted = 0;
      for (const p of PLANS) {
        const inside = [flight.STAGING_BEARING_CAP_RAD, -flight.STAGING_BEARING_CAP_RAD, 0].some((phi) => {
          for (const sigma of [1, -1]) {
            const t = flight.solveTurn({ from: p.from, target: p.target, offsetPx: OFFSET_PX, phi, sigma, radiusPx: FORCED_R });
            if (t === null) { declined += 1; return true; }
            emitted += 1;
            if (Math.hypot(p.from.x - t.centre.x, p.from.y - t.centre.y) < FORCED_R) insideAccepted += 1;
          }
          return false;
        });
        void inside;
      }
      const guardWorks = declined > 0 && insideAccepted === 0;
      if (minClearance > 0 && capThen.loops > 0 && guardWorks) {
        ok(
          `N5 \`from\` is outside the chosen turn circle on every one of ${PLANS.length} plans — worst clearance ${minClearance.toFixed(4)}pt — so no plan is forced into the long way round. Worst sweep ${deg(worstSweep.v).toFixed(2)}deg (${worstSweep.label}). `
          + `CALIBRATION: §5's own mutation (capRad 0, the vertical-staging spelling it withdrew) needs §5's own FRAME to reproduce, and this is where that shows. `
          + `Today, R ${capNow.maxR.toFixed(4)}pt: ${capNow.loops} plans past 220deg, worst ${deg(capNow.worst).toFixed(2)}deg — the loop class is unreachable, so capRad 0 alone would leave this row unfalsifiable. `
          + `In the pre-R-LF-8 frame (exponent 1, cycles fixed at 1.5), R ${capThen.maxR.toFixed(4)}pt: ${capThen.loops} plans past 220deg, worst ${deg(capThen.worst).toFixed(2)}deg (${capThen.label}). §5 published "294.6deg, eight of 168 plans" — the sweep is weave-sign-independent, so ${capThen.loops} of ${PLANS.length} plans IS ${capThen.loops / 2} of ${PLANS.length / 2} hops, and both numbers reproduce. `
          + `The cap still earns its place (193.39deg against ${deg(capNow.worst).toFixed(2)}deg today), but the loop-the-loop it was ruled against is a property of the larger radius, not of vertical staging alone. `
          + `SECOND CALIBRATION, because no live plan reaches it: forced to R=${FORCED_R}pt, \`solveTurn\` DECLINES ${declined} candidates for having \`from\` inside the circle and accepts ${emitted} — and not one accepted candidate has \`from\` inside. The rejection is how acceptance 5 holds by construction; without this it would be a branch nobody has watched execute`,
        );
      } else {
        bad(
          'N5 no plan is forced into a loop',
          `worst clearance ${Number.isFinite(minClearance) ? `${minClearance.toFixed(4)}pt` : 'a plan with no turn at all'}; `
          + `the frame calibration produced ${capThen.loops} loops in §5's own frame (${capThen.label}); `
          + `the rejection calibration declined ${declined} and accepted ${insideAccepted} candidate(s) with \`from\` inside the circle. `
          + `A zero in the first two means the row is no longer falsifiable; a non-zero in the last means \`solveTurn\` is emitting a turn whose tangent does not exist.`,
        );
      }
    }

    // --- N6. Acceptance 6 — headroom, REPORTED with its baseline ----------
    //
    //     Lumen's RESOLVED note closed this by ruling that no container can
    //     guarantee it: the headroom is `combTop`, which is the SCROLL
    //     OFFSET, and R-LF-7 widens an existing class rather than creating
    //     one. That verdict stands. What this row supplies is the number,
    //     measured on both sides of the change with ONE instrument, because
    //     the pair it was ruled on does not come out of mine.
    //
    //     THE INSTRUMENT: the highest point of the DESCENT (arc + drop) above
    //     the target's centre, on hops whose target is the topmost seat —
    //     which is the seat the headroom question is about. Plus Lumen's own
    //     correction: the path point is the character's CENTRE, so the drawn
    //     top edge is `MASCOT` half-height above it, and at the apex the bank
    //     is zero so that half-height is exact rather than a bound.
    {
      const HALF_HEIGHT = (44 * mascot.MASCOT_WIDTH_FRACTION) / mascot.MASCOT_ASPECT / 2;
      const apexOf = (pick, refMode) => {
        let best = { v: -Infinity, label: '' };
        for (const p of PLANS) {
          if (!pick(p)) continue;
          let top = -Infinity;
          if (refMode) {
            // main's descent: the fillet from P1 through to `target`.
            const ref = filletRef(p);
            for (let i = 0; i <= 400; i += 1) {
              const u = i / 400;
              const q = {
                x: (1 - u) * (1 - u) * ref.P1.x + 2 * (1 - u) * u * ref.staging.x + u * u * ref.P2.x,
                y: (1 - u) * (1 - u) * ref.P1.y + 2 * (1 - u) * u * ref.staging.y + u * u * ref.P2.y,
              };
              top = Math.max(top, p.target.y - q.y);
            }
          } else {
            for (let i = p.plan.descentStartIndex; i < p.pts.length; i += 1) top = Math.max(top, p.target.y - p.pts[i].y);
          }
          if (top > best.v) best = { v: top, label: p.label };
        }
        return best;
      };
      const ontoTop = (p) => p.toSeat === TOP_SEAT;
      const now = apexOf(ontoTop, false);
      const before = apexOf(ontoTop, true);
      const nowAll = apexOf(() => true, false);
      const reqNow = now.v + HALF_HEIGHT - 44;
      const reqBefore = before.v + HALF_HEIGHT - 44;
      ok(
        `N6 REPORTED, and Lumen's acceptance stands — but the pair it was ruled on does not reproduce here, and the correction runs the safe way twice. `
        + `Descent apex above the target centre, onto the TOPMOST seat (index ${TOP_SEAT}), one instrument both columns: main@42a83c7 ${before.v.toFixed(4)}pt (${before.label}) -> R-LF-7 ${now.v.toFixed(4)}pt (${now.label}). `
        + `Drawn top edge = apex + ${HALF_HEIGHT.toFixed(4)}pt (bank is 0 at an apex, so exact): required combTop >= ${reqBefore.toFixed(4)} -> ${reqNow.toFixed(4)}, bands (-88, ...) = ${(reqBefore + 88).toFixed(4)}pt -> ${(reqNow + 88).toFixed(4)}pt. `
        + `THE DELTA IS ${(reqNow - reqBefore).toFixed(4)}pt, not the 34.43pt in §5's RESOLVED note: that pair used 30.07 for main (the staging OFFSET, a constant — but the fillet never reaches staging, its control point is not on the curve, so main's measured apex onto this seat is ${before.v.toFixed(2)}) and 64.50 for R-LF-7 (which my arc reaches nowhere on this lattice; over ALL targets the descent apex tops out at ${nowAll.v.toFixed(4)}pt). Both errors point the same way, so the acceptance is safer than it was ruled, not less safe. Verdict unchanged; the number is Lumen's to re-encode`,
      );
    }

    // --- N7. Acceptance 7 — R-LF-8, and the two ends named separately -----
    //
    //     `cycles = f x approachSeconds` on every plan; the rate constant
    //     across the lattice to floating point; the envelope's VALUE zero at
    //     both ends to floating-point exactness; and its DERIVATIVE with it,
    //     over a `c` SWEEP rather than only the plans that exist — because
    //     the property belongs to the envelope and the plan lattice is the
    //     wrong domain to prove it on.
    //
    //     The two ends are asserted separately because they are different
    //     claims. `u = 0` is an IDENTITY: both factors vanish for every `p`
    //     and every `c`, so it was never at risk and asserting it earns
    //     nothing. `u = 1` is a CANCELLATION and it is the whole of what
    //     R-LF-3.1 buys. A row reporting one pass for "both ends" cannot tell
    //     you which end it earned.
    {
      const BOUND = 1e-9;
      let rateErr = 0;
      for (const p of PLANS) {
        const seconds = p.plan.approachMs / 1000;
        if (seconds <= 0) continue;
        rateErr = Math.max(rateErr, Math.abs(p.plan.weaveCycles / seconds - flight.WEAVE_RATE_HZ));
      }
      // The c sweep. `cycles` over the lattice spans (0, 1.5]; sweep past it
      // on both sides so the property is shown to be the envelope's and not
      // the lattice's.
      let valueEnd = 0;
      let slopeAtZero = 0;
      let slopeAtOne = { v: 0, c: 0 };
      const A_PROBE = flight.weaveAmplitudePx(417, BODY_LENGTH_PX);
      const L_PROBE = 417;
      for (let c = 0.01; c <= 2.5; c += 0.0005) {
        valueEnd = Math.max(valueEnd, Math.abs(flight.weaveOffsetAt(0, A_PROBE, c)), Math.abs(flight.weaveOffsetAt(1, A_PROBE, c)));
        slopeAtZero = Math.max(slopeAtZero, Math.abs(flight.weaveSlopeAt(0, A_PROBE, c)));
        const a = Math.abs(deg(Math.atan2(flight.weaveSlopeAt(1, A_PROBE, c), L_PROBE)));
        if (a > slopeAtOne.v) slopeAtOne = { v: a, c };
      }
      // The interior calibration of `weaveSlopeAt`: a central difference IS
      // legitimate away from the domain edge, and this is the row that would
      // catch an analytically wrong derivative. Without it the closed form is
      // an unchecked second spelling of the envelope.
      let interiorErr = 0;
      const h = 1e-7;
      for (let c = 0.05; c <= 1.6; c += 0.05) {
        for (let u = 0.05; u <= 0.95; u += 0.01) {
          const d = (flight.weaveOffsetAt(u + h, A_PROBE, c) - flight.weaveOffsetAt(u - h, A_PROBE, c)) / (2 * h);
          const a = flight.weaveSlopeAt(u, A_PROBE, c);
          interiorErr = Math.max(interiorErr, Math.abs(d - a) / Math.max(1, Math.abs(a)));
        }
      }
      if (rateErr < 1e-12 && valueEnd === 0 && slopeAtZero === 0 && slopeAtOne.v < BOUND && interiorErr < 1e-6) {
        ok(
          `N7 R-LF-8's rate is the ratified quantity and the count is its consequence: |cycles/approachSeconds - WEAVE_RATE_HZ| <= ${rateErr.toExponential(3)} across all ${PLANS.length} plans. `
          + `Over a c sweep (0.01..2.5, 4980 samples, past the lattice's own (0, 1.5] on both sides — the property is the envelope's, not the lattice's): the VALUE is exactly 0 at both ends; `
          + `the SLOPE at u=0 is exactly 0 — an IDENTITY, both factors vanish for every p and every c, so it was never at risk; `
          + `and the slope at u=1 is a CANCELLATION, worst ${slopeAtOne.v.toExponential(4)}deg at c=${slopeAtOne.c.toFixed(4)} (|sin 2*pi*c| = ${Math.abs(Math.sin(TAU_N * slopeAtOne.c)).toFixed(6)}, which is why it peaks there), under ${BOUND}deg. `
          + `\`weaveSlopeAt\` is itself calibrated against a central difference IN THE INTERIOR, where differencing is valid: worst relative error ${interiorErr.toExponential(3)} over 1440 (c, u) samples`,
        );
      } else {
        bad('N7 R-LF-8 rate constancy and R-LF-3.1 at both ends', `rate error ${rateErr.toExponential(3)}, endpoint value ${valueEnd}, slope@0 ${slopeAtZero}, slope@1 ${slopeAtOne.v.toExponential(4)}deg at c=${slopeAtOne.c.toFixed(4)}, interior derivative error ${interiorErr.toExponential(3)}`);
      }
    }

    // --- N8. Acceptance 8 — flight length, reported with its baseline -----
    //
    //     "Worst flight length over the lattice and over 393x852-and-up
    //     separately. The number Colin should see written down, not
    //     discover." Both columns, one instrument.
    {
      const span = (ps) => [Math.min(...ps.map((p) => p.plan.durationMs)), Math.max(...ps.map((p) => p.plan.durationMs))];
      const big = PLANS.filter((p) => p.device.width >= 393);
      const [lo, hi] = span(PLANS);
      const [bLo, bHi] = span(big);
      const worst = PLANS.reduce((a, p) => (p.plan.durationMs > a.plan.durationMs ? p : a));
      const worstBig = big.reduce((a, p) => (p.plan.durationMs > a.plan.durationMs ? p : a));
      ok(
        `N8 REPORTED: flight length ${lo.toFixed(1)}..${hi.toFixed(1)}ms over all four containers (worst ${worst.label}), and ${bLo.toFixed(1)}..${bHi.toFixed(1)}ms on 393x852-and-up (worst ${worstBig.label}) — the boxes this app ships to. `
        + `Baseline, main@42a83c7 on the same lattice: 524.2..1590.5ms and 524.2..1165.6ms. `
        + `So the tail grows ${(bHi - 1165.6).toFixed(1)}ms on a shipped box. §5's own table predicted 1717.8ms there; the extra ${(bHi - 1717.8).toFixed(1)}ms is R-LF-8 and R-LF-3.1 arriving after that table was measured — a quieter weave means a shorter approach arc, a lower cruise, and a descent that takes longer to decay to rest from it`,
      );
    }

    // --- N9. Acceptance 9 — the weave's frame moved, so re-report it -------
    //
    //     "`A` is a fraction of the untrimmed chord and the weave is drawn
    //     over the trimmed span, which R-LF-7 replaces. Report
    //     `max(A / drawnSpan)` and the weave's min radius in R-LF-7's own
    //     frame, with `L` and `A` alongside."
    //
    //     THE ANSWER IS THAT THE SHAPE PARAMETER STOPS BEING TWO QUANTITIES.
    //     Under the fillet the amplitude came from `from -> staging` and the
    //     curve was drawn over `from -> P1`, so `A / drawnSpan` exceeded
    //     `WEAVE_LEG_AMPLITUDE_FRACTION` by the trim. Since R-LF-7 they are
    //     the same leg — `from -> T` — so the ratio collapses to the ratified
    //     fraction itself wherever the leg term binds, and below it wherever
    //     the body term does. It is not a new constant to track; it is
    //     `WEAVE_LEG_AMPLITUDE_FRACTION`, which is why the row can be closed
    //     rather than carried.
    {
      let shape = { v: 0 };
      let radius = { v: Infinity };
      for (const p of PLANS) {
        const A = p.plan.weaveAmplitudePx;
        const L = p.plan.weaveSpanPx;
        const c = p.plan.weaveCycles;
        const s = A / L;
        if (s > shape.v) shape = { v: s, label: p.label, A, L, c };
        const h = 1e-6;
        for (let u = 0.002; u < 1; u += 0.002) {
          const o1 = flight.weaveSlopeAt(u, A, c, p.weaveSign);
          const o2 = (flight.weaveSlopeAt(u + h, A, c, p.weaveSign) - flight.weaveSlopeAt(u - h, A, c, p.weaveSign)) / (2 * h);
          const k = Math.abs(L * o2) / ((L * L + o1 * o1) ** 1.5);
          if (k > 1e-12 && 1 / k < radius.v) radius = { v: 1 / k, label: p.label, u, A, L, c };
        }
      }
      const joinRadius = (radius.L ** 2) / (2 * Math.PI * Math.PI * radius.A * Math.abs(Math.sin(TAU_N * radius.c)));
      ok(
        `N9 REPORTED in R-LF-7's own frame: max A/drawnSpan = ${shape.v.toFixed(5)} (${shape.label}, A ${shape.A.toFixed(4)}pt, L ${shape.L.toFixed(4)}pt, c ${shape.c.toFixed(4)}) against 0.18773..0.21503 in the fillet's frame — `
        + `the two quantities MERGED: since R-LF-7 the amplitude's leg and the drawn span are both \`from -> T\`, so the ratio is WEAVE_LEG_AMPLITUDE_FRACTION (${flight.WEAVE_LEG_AMPLITUDE_FRACTION}) wherever the leg term binds and below it wherever the body term does — and seat-to-seat the body term binds NOWHERE, so 0.18 is not merely the max here but the value on all ${PLANS.length}. That degeneracy is the lattice's, not the build's: see N13. `
        + `Weave min radius ${radius.v.toFixed(4)}pt at u=${radius.u.toFixed(3)} (${radius.label}, A ${radius.A.toFixed(4)}, L ${radius.L.toFixed(4)}, c ${radius.c.toFixed(4)}), against 6.6722pt quoted in the fillet's frame. `
        + `AND IT HAS MOVED TO THE JOIN: u=${radius.u.toFixed(3)}, not the u~0.56 interior minimum the ruling scopes it to. Lumen's own closed form R_join = L^2 / (2 pi^2 A |sin 2 pi c|) gives ${joinRadius.toFixed(4)}pt there, which is the same number — so the weave's tightest point on this lattice IS the join, and R_join is not a curiosity of one plan but the quantity that governs`,
      );
    }

    // --- N9b. The published weave terms ARE the geometry they name --------
    //
    //     N9 and N2b both read `plan.weaveSpanPx` and `plan.weaveAmplitudePx`,
    //     and a REPORT cannot police its own inputs — a span published 10%
    //     wrong changes every figure in N9 and reds nothing. So the two are
    //     checked against the leg they claim to describe: the span is the
    //     distance from `from` to the turn's tangent point, and the amplitude
    //     is `weaveAmplitudePx` OF that span. Bit-exact, because both sides
    //     are the same arithmetic on the same numbers.
    {
      let spanErr = 0;
      let ampErr = 0;
      let label = '';
      for (const p of PLANS) {
        const t = geometryFor(p);
        if (!t) continue;
        const span = Math.hypot(t.tangent.x - p.from.x, t.tangent.y - p.from.y);
        const e1 = Math.abs(span - p.plan.weaveSpanPx);
        const e2 = Math.abs(flight.weaveAmplitudePx(span, BODY_LENGTH_PX) - p.plan.weaveAmplitudePx);
        if (e1 > spanErr || e2 > ampErr) label = p.label;
        spanErr = Math.max(spanErr, e1);
        ampErr = Math.max(ampErr, e2);
      }
      if (spanErr === 0 && ampErr === 0) {
        ok(`N9b the weave terms N9 and N2b report ARE the leg they name: \`weaveSpanPx\` is |from -> T| and \`weaveAmplitudePx\` is weaveAmplitudePx of it, bit-exact on all ${PLANS.length} plans. A report cannot police its own inputs, and every figure in N9 is divided by this span`);
      } else {
        bad('N9b the published weave terms are the geometry they name', `worst span error ${spanErr.toExponential(3)}pt, worst amplitude error ${ampErr.toExponential(3)}pt (${label}) — N9's shape parameter and N2b's curvature are both computed from these, so they have been reporting a leg the bee does not fly`);
      }
    }

    // --- N10. The radius fixed point, and the row that keeps it honest ----
    //
    //     §5: "`R` is circular with `cruisePxS`. Measured, the fixed point
    //     settles to 1e-6 in 2 iterations on every plan."
    //
    //     IT NOW SETTLES IN ONE, AND THAT IS A FINDING RATHER THAN A PASS.
    //     `R = max(bodyLengthPx, cruise / 9)`, and with R-LF-8's quieter
    //     weave the cruise never rises far enough for the second term to
    //     bind: the bee's own length wins on every plan of every container,
    //     so the iteration converges before it iterates. §5's table — which
    //     has the frame bound binding on the two biggest boxes — was measured
    //     with the fillet's weave, one frame back, exactly as acceptance 9
    //     says of the radius figures.
    //
    //     A convergence row that only ever sees one pass is PASS-CLOSED: it
    //     prints a green that means "the loop never ran." So the row forces
    //     the mechanism to bind — a body length small enough that the frame
    //     term takes over — and asserts the iteration converges THERE.
    {
      let passes = 0;
      let bodyWins = 0;
      let maxCruise = 0;
      for (const p of PLANS) {
        passes = Math.max(passes, p.plan.turn.passes);
        maxCruise = Math.max(maxCruise, p.plan.profile.cruisePxS);
        if (Math.abs(p.plan.turn.radiusPx - BODY_LENGTH_PX) < 1e-9) bodyWins += 1;
      }
      // Force the frame term to be the binding one. A third of a bee is not a
      // shipped size; it is the smallest lever that makes `cruise / 9` win,
      // and the point is to exercise the loop, not to propose a value.
      const TINY_BODY = BODY_LENGTH_PX / 3;
      let forcedPasses = 0;
      let forcedFrame = 0;
      let residual = -Infinity;
      let overshoot = 0;
      for (const p of PLANS) {
        const plan = flight.buildPollinationPlan({
          from: p.from, target: p.target, ringStep: lattice.ringStepFor(44), bodyLengthPx: TINY_BODY,
          width: BOX, height: BOX, approachSpeedPxS: p.speed, weaveSign: p.weaveSign,
        });
        forcedPasses = Math.max(forcedPasses, plan.turn.passes);
        if (plan.turn.radiusPx > TINY_BODY + 1e-9) forcedFrame += 1;
        const settled = flight.turnRadiusPx({ bodyLengthPx: TINY_BODY, cruisePxS: plan.profile.cruisePxS });
        // ONE-SIDED, matching the loop's own exit. The residual that matters
        // is the SHORTFALL (`R` below what the cruise requires); an overshoot
        // is a larger radius than needed, which cannot breach a rate bound.
        // The old spelling here took `Math.abs`, which is the same mistake
        // the loop itself was making — a two-sided reading of a one-sided
        // quantity — and it is why this row could not have caught it either.
        residual = Math.max(residual, settled - plan.turn.radiusPx);
        overshoot = Math.max(overshoot, plan.turn.radiusPx - settled);
      }
      if (forcedFrame > 0 && forcedPasses > 1 && residual <= 0) {
        ok(
          `N10 REPORTED + calibrated. On the shipped lattice R = bodyLength (${BODY_LENGTH_PX.toFixed(4)}pt) on ${bodyWins} of ${PLANS.length} plans — ALL of them: max cruise is ${maxCruise.toFixed(2)} px/s, so cruise/${flight.MAX_TURN_RATE_RAD_S} tops out at ${(maxCruise / flight.MAX_TURN_RATE_RAD_S).toFixed(4)}pt and the frame term never binds. `
          + `§5's table has it binding on 393x852 and 430x932; that table was measured with the fillet's weave, and R-LF-8 + R-LF-3.1 quiet the approach enough to take the cruise back under the floor. The FLOOR is the mechanism today; the frame bound is dormant, not wrong. `
          + `Which makes the convergence claim pass-closed, so it is forced: at bodyLength/3 the frame term binds on ${forcedFrame} of ${PLANS.length} plans, the loop runs ${forcedPasses} passes, and it exits with a SHORTFALL of ${residual.toExponential(3)}pt — at or below zero, which is the whole invariant — overshooting by at most ${overshoot.toFixed(4)}pt, which is free. N12 asserts the same thing on the wide domain, where it actually failed`,
        );
      } else {
        bad('N10 the radius fixed point converges where it actually iterates', `forced-mode: frame term bound on ${forcedFrame} plans, ${forcedPasses} passes, worst SHORTFALL ${residual.toExponential(3)}pt (must be <= 0). If the frame term never binds even at a third of a bee, this row is no longer exercising the iteration it claims to; if the shortfall is positive, the loop is exiting below the rate bound it is derived from`);
      }
    }

    // ==================================================================
    // THE WIDE DOMAIN — and it is here because the rows above could not
    // see a live defect.
    // ==================================================================
    //
    // Every row above samples SEAT TO SEAT. That is not the errand's domain.
    // `FlyingBee.js` passes `from: { ...posRef.current }` — the bee's LIVE
    // POSITION — and mounts itself `absoluteFill` over the whole window, so
    // the approach is bounded by the CONTAINER, not by the comb. The first
    // errand of any session starts wherever the resident was perched.
    //
    // The gap is not marginal. Seat to seat the approach chord spans
    // 21.26..165.80pt; over the container it reaches 843.46pt. Three things
    // are invisible in the smaller domain and all three are real:
    //
    //   - `R`'s frame term never binds seat-to-seat (N10), so the whole
    //     `max(bodyLength, cruise/9)` mechanism went unexercised;
    //   - `WEAVE_BODY_AMPLITUDE_MULTIPLE` never binds either, which is why
    //     `A / drawnSpan` reads exactly 0.18 on 336 of 336 plans — a
    //     property of the lattice, not of the build (it binds on 48% here);
    //   - and **the turn rate breached its own ruled bound**, at
    //     8.6658deg/frame against 8.5944, because the fixed point exited on
    //     a TWO-SIDED tolerance. `R` is a floor, not an estimate. Fixed in
    //     the same commit; N12 is the row that would have caught it.
    //
    // Written as a superset rather than a reachability argument on purpose:
    // some container corners may not be reachable perches, and a BOUND is
    // safe to assert on a superset while an ABSENCE is not. The rows below
    // that report rather than bound say which they are.
    {
      const WIDE = [];
      for (const device of DEVICES) {
        const speed = sequencer.referenceSpeedPxS(device.width, device.height) * flight.APPROACH_SPEED_RATIO;
        // The comb centred horizontally, at a plausible scroll position. The
        // rows below do not depend on where it sits — they depend on `from`
        // ranging over the window, which is the part the lattice was missing.
        const combX = (device.width - 132) / 2;
        const combY = 100;
        for (let seat = 0; seat < seatCentres.length; seat += 1) {
          const target = { x: combX + (seatCentres[seat].x - 44), y: combY + (seatCentres[seat].y - 44) };
          for (let fx = 6; fx < device.width; fx += 26) {
            for (let fy = 6; fy < device.height; fy += 34) {
              const from = { x: fx, y: fy };
              if (Math.hypot(from.x - target.x, from.y - target.y) < 8) continue;
              const weaveSign = (fx + fy) % 2 === 0 ? 1 : -1;
              WIDE.push({
                label: `${device.label} ->seat${seat} from(${fx},${fy})`,
                device, from, target, weaveSign, speed,
                plan: flight.buildPollinationPlan({
                  from, target, ringStep: lattice.ringStepFor(44), bodyLengthPx: BODY_LENGTH_PX,
                  width: device.width, height: device.height, approachSpeedPxS: speed, weaveSign,
                }),
              });
            }
          }
        }
      }

      // --- N11. N1's claim, on the domain the errand actually has ---------
      {
        const BOUND_DEG = 1e-9;
        let joinA = { v: 0, label: '' };
        let joinB = { v: 0, label: '' };
        let noTurn = 0;
        for (const p of WIDE) {
          const t = flight.chooseTurn({
            from: p.from, target: p.target, offsetPx: OFFSET_PX,
            radiusPx: p.plan.turn.radiusPx, inboardSign: p.target.x * 2 < p.device.width ? 1 : -1,
          });
          if (!t) { noTurn += 1; continue; }
          const chord = { x: t.tangent.x - p.from.x, y: t.tangent.y - p.from.y };
          const L = Math.hypot(chord.x, chord.y);
          if (!(L > 1e-9)) continue;
          const n = { x: -chord.y / L, y: chord.x / L };
          const slope = flight.weaveSlopeAt(1, p.plan.weaveAmplitudePx, p.plan.weaveCycles, p.weaveSign);
          const approachTangent = { x: chord.x + n.x * slope, y: chord.y + n.y * slope };
          const entryHeading = t.sweep > 0
            ? { x: t.sigma * -(t.tangent.y - t.centre.y), y: t.sigma * (t.tangent.x - t.centre.x) }
            : chord;
          const a = deg(turnBetween(approachTangent, entryHeading));
          if (a > joinA.v) joinA = { v: a, label: p.label };
          const exitHeading = t.sweep > 0
            ? { x: t.sigma * -(t.staging.y - t.centre.y), y: t.sigma * (t.staging.x - t.centre.x) }
            : { x: p.target.x - t.staging.x, y: p.target.y - t.staging.y };
          const b = deg(turnBetween(exitHeading, { x: p.target.x - t.staging.x, y: p.target.y - t.staging.y }));
          if (b > joinB.v) joinB = { v: b, label: p.label };
        }
        if (noTurn === 0 && joinA.v < BOUND_DEG && joinB.v < BOUND_DEG) {
          ok(`N11 the joins stay exact over the WIDE domain too — ${WIDE.length} plans with \`from\` swept across the whole container (${DEVICES.length} containers x ${seatCentres.length} seats), approach chords to 843pt against the lattice's 166: weave->arc worst ${joinA.v.toExponential(4)}deg (${joinA.label}), arc->descent worst ${joinB.v.toExponential(4)}deg. The tangency is structural, so widening the domain was never going to move it — but N1's "no junction angle on any of 336 plans" is a claim about 336 plans, and this is the one that covers the errand`);
        } else {
          bad('N11 the joins stay exact over the wide domain', `${noTurn} plans produced no turn; weave->arc worst ${joinA.v.toExponential(4)}deg (${joinA.label}), arc->descent worst ${joinB.v.toExponential(4)}deg (${joinB.label}), bound ${BOUND_DEG}deg`);
        }
      }

      // --- N12. THE ROW THE DEFECT NEEDED, and it is an invariant not a
      //     sweep: `R` may never be below what the cruise it produced
      //     requires. Exact, one comparison per plan, no tolerance — because
      //     a tolerance is what let the defect through in the first place.
      {
        let worstShort = { v: -Infinity, label: '' };
        let worstRate = { v: 0, label: '' };
        let maxPasses = 0;
        let frameBinds = 0;
        for (const p of WIDE) {
          const t = p.plan.turn;
          if (!t) continue;
          maxPasses = Math.max(maxPasses, t.passes);
          if (t.radiusPx > BODY_LENGTH_PX + 1e-9) frameBinds += 1;
          const required = flight.turnRadiusPx({ bodyLengthPx: BODY_LENGTH_PX, cruisePxS: p.plan.profile.cruisePxS });
          const shortfall = required - t.radiusPx;
          if (shortfall > worstShort.v) worstShort = { v: shortfall, label: p.label };
          const omega = p.plan.profile.cruisePxS / t.radiusPx / 60;
          if (omega > worstRate.v) worstRate = { v: omega, label: p.label };
        }
        const bound = flight.MAX_FRAME_SPEED_STEP_FRACTION;
        if (worstShort.v <= 0 && worstRate.v <= bound + 1e-9 && maxPasses < TURN_RADIUS_MAX_PASSES_READ) {
          ok(
            `N12 \`R\` is never below what the cruise it produced requires — worst shortfall ${worstShort.v.toExponential(3)}pt over ${WIDE.length} wide-domain plans, so the turn rate holds at ${deg(worstRate.v).toFixed(4)}deg/frame against ${RATE_BOUND_DEG.toFixed(4)} (${worstRate.label}). `
            + `ASSERTED WITH NO TOLERANCE, because a tolerance is exactly what let this through: the fixed point used to exit on |next - R| <= 0.25pt, and at R ~ 30pt a 0.25pt shortfall IS 0.83% of rate — measured 8.6658deg/frame. \`R\` is a FLOOR, so the exit is one-sided now. `
            + `The frame term binds on ${frameBinds} of ${WIDE.length} plans here and on 0 of 336 seat-to-seat, which is why N10 could only report it dormant and never exercise it. Fixed point converges in ${maxPasses} passes worst case, against a ${TURN_RADIUS_MAX_PASSES_READ}-pass ceiling`,
          );
        } else {
          bad(
            'N12 R is never below what the cruise it produced requires',
            `worst shortfall ${worstShort.v.toExponential(3)}pt (${worstShort.label}), worst rate ${deg(worstRate.v).toFixed(4)}deg/frame against ${RATE_BOUND_DEG.toFixed(4)}, ${maxPasses} passes against a ${TURN_RADIUS_MAX_PASSES_READ} ceiling. `
            + 'A positive shortfall means the radius is smaller than the rate bound it is derived from, so R-LF-2.1 is breached by the geometry that claims to enforce it.',
          );
        }
      }

      // --- N13. REPORTED: what the wide domain does to R-LF-8's numbers ----
      //
      //     Including the one that corrects a sentence this file used to
      //     carry. R-LF-8's note said `c <= 1.5` everywhere, "an identity
      //     rather than a hope". It is an identity of the LATTICE.
      {
        let maxC = { v: 0, label: '' };
        let maxL = { v: 0, label: '' };
        let bodyBinds = 0;
        let minShape = Infinity;
        let maxDur = { v: 0, label: '' };
        for (const p of WIDE) {
          const A = p.plan.weaveAmplitudePx;
          const L = p.plan.weaveSpanPx;
          if (p.plan.weaveCycles > maxC.v) maxC = { v: p.plan.weaveCycles, label: p.label };
          if (L > maxL.v) maxL = { v: L, label: p.label };
          if (A < flight.WEAVE_LEG_AMPLITUDE_FRACTION * L - 1e-9) bodyBinds += 1;
          minShape = Math.min(minShape, A / L);
          if (p.plan.durationMs > maxDur.v) maxDur = { v: p.plan.durationMs, label: p.label };
        }
        ok(
          `N13 REPORTED — three lattice-scoped figures, restated on the errand's own domain. `
          + `CYCLE COUNT reaches ${maxC.v.toFixed(4)} (${maxC.label}) against the lattice's 1.5000: R-LF-8's "c <= 1.5 everywhere, an identity rather than a hope" is an identity OF THE LATTICE, and on a long first errand R-LF-8 ADDS undulation rather than removing it — ~${(maxC.v / 1.5).toFixed(1)}x the count the fixed 1.5 ever produced. R-LF-3.1 does not care (the envelope closes the join at every c, which is why it was squared), but the reassurance was scoped to a probe and written as though scoped to the function. `
          + `APPROACH CHORD reaches ${maxL.v.toFixed(2)}pt against 165.80. `
          + `And WEAVE_BODY_AMPLITUDE_MULTIPLE binds on ${bodyBinds} of ${WIDE.length} plans (${((bodyBinds / WIDE.length) * 100).toFixed(0)}%, min A/L ${minShape.toFixed(5)}) where it binds on NONE of the 336 — so N9's "exactly 0.18000 on every plan" is the lattice speaking, not the build. The MAX is still 0.18 and that is domain-independent (A = min(0.18L, 1.5body), so A/L <= 0.18 always); the DEGENERACY is not. `
          + `Worst flight over this domain ${maxDur.v.toFixed(1)}ms (${maxDur.label}) against N8's ${'2502.4'}ms — reported, not bounded, and Colin should see it`,
        );
      }
    }
  }
}

console.log(`\ncheck-bee-attitude: ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
