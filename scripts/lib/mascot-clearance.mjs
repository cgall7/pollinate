//
// Derive `MASCOT_CLEARANCE` in `src/constants/mascot.js` from the shipped
// mascot assets' ALPHA — how far the drawn character reaches from its own
// centre, by direction.
//
// R126-series / §28.3 (Lumen 2026-08-25): the pollen burst must clear the
// DRAWING, not its bounding box. The two are very different here — the box
// half-width is 0.5 of the character width, and the drawing's own reach runs
// 0.4416 to 0.6480 of it depending on where you look, because the legs and
// antennae stick out a long way past a body that does not fill its box.
//
// Method, and it is deliberately the one `scripts/lib/bee-breath-region.mjs`
// already uses one beat over: decode the assets' alpha, rotate the wing layer
// about `HINGE` through the live `WING_BEAT_DEG` (the burst fires on the frame
// he lands, when the airborne beat is still the pose), union the swept wing
// with the body, and ray-cast from the character's centre.
//
// Two conventions worth stating because both have bitten this codebase:
//
//   * **Rotation and ray-casting happen in ISOTROPIC units** — everything is
//     measured in units of the character's WIDTH, with the vertical scaled by
//     `1 / MASCOT_ASPECT`. Working in box FRACTIONS would skew every arc and
//     every angle, because the box is not square (§frame-conversion, and
//     Sage's region module states the same rule for the same reason).
//   * **Both facings are unioned.** The bee mirrors on `scaleX` (R81), so the
//     clearance at an angle must hold for the drawing AND its mirror, or the
//     burst is correct only on left-to-right landings.
//
// Bins, not a continuous profile: each entry is the MAXIMUM reach over its own
// `CLEARANCE_BIN_DEG` span INCLUDING both edges, so a lookup by bin is an
// upper bound for every angle inside it and no interpolation is needed —
// interpolating this profile would UNDER-state the spikes, which is the unsafe
// direction. 5-degree bins were checked and give a byte-identical gap floor
// for the shipped fan, so the coarser table ships.
//
// Exported for `scripts/derive-mascot-clearance.mjs` (print / --check) and for
// `check-bee-attitude`'s row, so the gate and the tool cannot drift apart.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG } from './png-codec.mjs';

const ALPHA_MIN = 8;
const RAY_STEP = 0.0008;   // units of character width; 0.024pt at size 44
const RAY_MAX = 1.2;

export const readMascotNumber = (mascotSource, name) => {
  const m = mascotSource.match(new RegExp(`export const ${name} = ([^;]+);`));
  if (!m) throw new Error(`${name} not found in mascot.js`);
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${m[1]});`)();
};

export const deriveClearanceBins = ({ mascotSource, bodyPng, wingPng }) => {
  const MASCOT_ASPECT = readMascotNumber(mascotSource, 'MASCOT_ASPECT');
  const HINGE = readMascotNumber(mascotSource, 'HINGE');
  const WING_BEAT_DEG = readMascotNumber(mascotSource, 'WING_BEAT_DEG');
  const BIN = readMascotNumber(mascotSource, 'CLEARANCE_BIN_DEG');

  const body = decodePNG(bodyPng);
  const wing = decodePNG(wingPng);
  if (body.width !== wing.width || body.height !== wing.height) {
    throw new Error('the two layers must be cropped to the same character box');
  }
  const { width: PW, height: PH } = body;
  const HW = 1 / MASCOT_ASPECT;                     // box height, in units of width
  const alpha = (img, x, y) => img.data[(y * img.width + x) * 4 + 3];
  const toU = (px) => (px + 0.5) / PW - 0.5;
  const toV = (py) => ((py + 0.5) / PH - 0.5) * HW;

  const occupied = new Set();
  const cell = (u, v) => `${Math.floor(u / RAY_STEP)},${Math.floor(v / RAY_STEP)}`;
  for (let y = 0; y < PH; y += 1) {
    for (let x = 0; x < PW; x += 1) {
      if (alpha(body, x, y) >= ALPHA_MIN) occupied.add(cell(toU(x), toV(y)));
    }
  }
  const hu = HINGE.x - 0.5;
  const hv = (HINGE.y - 0.5) * HW;
  const wingPts = [];
  for (let y = 0; y < PH; y += 1) {
    for (let x = 0; x < PW; x += 1) {
      if (alpha(wing, x, y) >= ALPHA_MIN) wingPts.push([toU(x) - hu, toV(y) - hv]);
    }
  }
  for (const deg of [-WING_BEAT_DEG / 2, 0, WING_BEAT_DEG / 2]) {
    const t = (deg * Math.PI) / 180;
    const c = Math.cos(t);
    const s = Math.sin(t);
    for (const [ru, rv] of wingPts) occupied.add(cell(hu + ru * c - rv * s, hv + ru * s + rv * c));
  }

  const reach = (deg) => {
    let best = 0;
    for (const mirror of [1, -1]) {
      const a = (deg * Math.PI) / 180;
      const du = Math.cos(a) * mirror;
      const dv = Math.sin(a);
      let last = 0;
      for (let t = 0; t <= RAY_MAX; t += RAY_STEP) if (occupied.has(cell(du * t, dv * t))) last = t;
      best = Math.max(best, last);
    }
    return best;
  };

  const perDegree = [];
  for (let d = 0; d <= 360; d += 1) perDegree.push(reach(d));
  const bins = [];
  for (let start = 0; start < 360; start += BIN) {
    let m = 0;
    for (let d = start; d <= start + BIN; d += 1) m = Math.max(m, perDegree[d]);
    bins.push(Number(m.toFixed(4)));
  }
  return { bins, binDeg: BIN };
};
