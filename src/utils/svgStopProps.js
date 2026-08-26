// react-native-svg's extractGradient discards a `<Stop>`'s own colour alpha
// and rebuilds it from `stopOpacity` alone — `(color & 0x00ffffff) | (alpha
// << 24)` in extractGradient.ts, where `alpha` defaults to 255 when
// `stopOpacity` is absent (extractOpacity.ts). Feeding an alpha-baked
// `withAlpha()` token straight into `stopColor` therefore always paints
// fully opaque, silently.
//
// This is the one legal way to hand such a token to a `<Stop>`: rgba→(
// stopColor, stopOpacity) is a frame conversion, and per the hex-tap
// precedent a frame conversion ships as a function, not a per-call-site
// patch. The tokens themselves stay rgba strings — they are correct in
// their own frame (`theme.js`'s `withAlpha`).
const RGBA_PATTERN = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/;

export const svgStopProps = (token) => {
  const match = RGBA_PATTERN.exec(token);
  if (!match) return { stopColor: token, stopOpacity: 1 };
  const [, r, g, b, a] = match;
  return { stopColor: `rgb(${r}, ${g}, ${b})`, stopOpacity: Number(a) };
};
