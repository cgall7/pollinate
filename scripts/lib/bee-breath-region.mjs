// Predicts the on-screen box a Breath cycle can possibly move a pixel in —
// derived from the actual wing asset and the doctrine's own constants, not
// eyeballed off one capture. The eyeballed number (Pixel's 39x39px on one
// device, one build) is real evidence that this prediction is right, not a
// substitute for computing it: a region hand-measured from a single capture
// has no way to generalise to a different `size` prop, a different anchor, or
// a different device, and a tripwire built on it would either be too tight
// (flags a legitimate render at a size nobody measured) or silently too loose
// (a device-specific number nobody re-measures).
//
// Method: read every non-transparent pixel of `assets/mascot-wing.png`
// (colour type doesn't matter here — only alpha), rotate each one about
// `HINGE` through the full swept arc, and take the true bounding box of the
// union — not the bounding RECTANGLE's four corners rotated, which is the
// easy shortcut but only a safe over-approximation when the shape being
// rotated is itself a rectangle. R79's own convention is to measure off the
// actual wing pixels rather than a bounding box standing in for them, and
// this mirrors that.
//
// Rotation happens in true on-screen POINTS, not raw box-fraction units,
// because the box is not square (`MASCOT_ASPECT` != 1) — rotating in
// fraction-space would skew the arc along whichever axis is shorter. A
// reference width of `MASCOT_ASPECT` and height of `1` reproduces the box's
// real aspect while staying resolution-independent; the final answer is
// converted back to box-fraction, so the reference scale itself cancels out.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG } from './png-codec.mjs';
import { BREATH_BEAT_DEG, HINGE, MASCOT_ASPECT } from '../../src/constants/mascot.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WING_ASSET = path.join(__dirname, '..', '..', 'assets', 'mascot-wing.png');

const REF_W = MASCOT_ASPECT;
const REF_H = 1;

const rotatePoint = (fx, fy, deg) => {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const px = fx * REF_W;
  const py = fy * REF_H;
  const hx = HINGE.x * REF_W;
  const hy = HINGE.y * REF_H;
  const dx = px - hx;
  const dy = py - hy;
  const rx = dx * cos - dy * sin;
  const ry = dx * sin + dy * cos;
  return { fx: (hx + rx) / REF_W, fy: (hy + ry) / REF_H };
};

/**
 * Non-transparent pixels of the wing asset, as fractions of its own image
 * (== fractions of the character box: `MascotBee` renders both layers at
 * identical width/height with `resizeMode="contain"` and the asset's aspect
 * already matches the box's, per `mascot.js`'s header, so "contain" fits
 * with no letterboxing and pixel (x, y) of a WxH image is box-fraction
 * (x / W, y / H) exactly).
 */
export const wingAlphaFractions = ({ alphaThreshold = 0 } = {}) => {
  const png = decodePNG(fs.readFileSync(WING_ASSET));
  const points = [];
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const alpha = png.data[(y * png.width + x) * 4 + 3];
      if (alpha > alphaThreshold) points.push({ fx: x / png.width, fy: y / png.height });
    }
  }
  return points;
};

/**
 * The bounding box, in box-fraction units, of every position the wing's
 * non-transparent pixels visit across a Breath sweep of `sweepDeg` (default:
 * the shipped `BREATH_BEAT_DEG`, run edge-to-edge as `±sweepDeg/2`).
 *
 * `samples` angles per pixel is enough to make the arc's curvature moot at
 * this radius — verified by `selfTest` below, which checks the bound is
 * stable as `samples` increases rather than assuming a sample count is fine.
 */
export const breathSweepFractionBBox = ({ sweepDeg = BREATH_BEAT_DEG, samples = 21, alphaThreshold = 0 } = {}) => {
  const points = wingAlphaFractions({ alphaThreshold });
  if (points.length === 0) throw new Error('wing asset has no non-transparent pixels — asset regressed or threshold too strict');

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let s = 0; s < samples; s += 1) {
    const deg = -sweepDeg / 2 + (sweepDeg * s) / (samples - 1);
    for (const { fx, fy } of points) {
      const r = rotatePoint(fx, fy, deg);
      if (r.fx < minX) minX = r.fx;
      if (r.fx > maxX) maxX = r.fx;
      if (r.fy < minY) minY = r.fy;
      if (r.fy > maxY) maxY = r.fy;
    }
  }
  return { minX, maxX, minY, maxY };
};

/**
 * Convert a box-fraction bbox into absolute on-screen px, given the
 * character box's own on-screen rect (origin + size in px — the same
 * quantity `PerchAnchor`'s `measureInWindow` produces, or whatever the
 * operator measured the resolved anchor at). This is the one input this
 * module cannot derive on its own: the anchor resolves live against the
 * actual render (§32.2), so a capture's box origin has to be supplied, not
 * assumed.
 */
export const fractionBBoxToPx = (fracBBox, boxRectPx) => ({
  minX: boxRectPx.x + fracBBox.minX * boxRectPx.width,
  maxX: boxRectPx.x + fracBBox.maxX * boxRectPx.width,
  minY: boxRectPx.y + fracBBox.minY * boxRectPx.height,
  maxY: boxRectPx.y + fracBBox.maxY * boxRectPx.height,
});
