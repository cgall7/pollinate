"""Split the mascot render into a wing layer and a body layer, levelled for flight.

R70's cutout recipe took alpha from a luma ramp on the black plate. That is
correct for the wings -- they really are translucent, and they are bright, so
luma tracks their opacity -- and it is wrong by construction everywhere the
subject is DARK. The mascot's dark pixels are its bands, eyes, brows and
antennae: every feature that carries the character. Measured on the R79
layers, the ink bands recomposite at median max-channel 117 against the
source's 42, because their alpha averaged 0.752 and the cream ground came
through. The yellow body reproduced exactly (247,190,20 both ways), which is
why the recipe looked solved -- it was validated on the pixels that could not
fail it.

So: alpha comes from a FILLED SUBJECT MASK. A dark band is interior, and
binary_fill_holes recovers it whatever its luma. The luma ramp survives only
inside the wing region, which is the one place the material is really
translucent.
"""
from PIL import Image
import numpy as np
from scipy import ndimage
import json, math, os, sys

# THE MASTER OF RECORD. Takes argv so it can be pointed elsewhere deliberately,
# and defaults to the espresso master — never the 08-12 file, which is the
# PRE-RULING gold-eyed state and is kept only as provenance.
DEFAULT_SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..',
                           'final-mascot-2026-08-25-espresso.png')
SRC = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
rgb = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float64)

# --- GUARD: the regeneration class, in the tool most able to cause it --------
#
# Colin's 2026-08-17 iris ruling (gold -> espresso) shipped by editing the
# DERIVED 309px asset directly and was never propagated up, so for six days
# re-running this script on the 08-12 master silently restored the pre-ruling
# face. Repaired 2026-08-25; this guard is why it cannot happen again, and it
# is a guard rather than a comment because a comment is what failed last time.
#
# The probe is the iris box in master coordinates, derived from the 558-pixel
# diff at 309 and the crop origin (169,110) at scale 1049/320. Over its brown
# population the two masters are far apart and not close to anything else:
# gold mean R 94.05, espresso 71.67.
IRIS_BOX = (729, 1018, 447, 582)   # x0, x1, y0, y1
GOLD_R, ESPRESSO_R = 94.05, 71.67
_px = rgb[IRIS_BOX[2]:IRIS_BOX[3], IRIS_BOX[0]:IRIS_BOX[1]].reshape(-1, 3)
_iris = _px[(_px[:, 2] < 90) & (_px[:, 0] > 30) & (_px[:, 0] < 200)]
if len(_iris) < 1000:
    raise SystemExit(f'{SRC}: found {len(_iris)} iris pixels in the probe box; this does not look '
                     'like the mascot master. Refusing to run rather than deriving from the wrong art.')
#
# THREE-WAY, because nearest-of-two has no "neither" verdict and a CANNOT TELL
# that looks like a clean pass is the hole this project keeps re-earning. First
# draft used nearest-of-two and PASSED assets/icon.png at mean R 34.14 — the
# icon's ink bands, merely closer to espresso than to gold — then died forty
# lines later on an empty argmax. The band is +-8.0 against a 22.4 separation.
TOL = 8.0
_r = _iris[:, 0].mean()
if abs(_r - ESPRESSO_R) <= TOL:
    print(f'master {os.path.basename(SRC)}  iris mean R {_r:.2f} -> espresso, ok')
elif abs(_r - GOLD_R) <= TOL:
    raise SystemExit(f'{SRC}: iris mean R {_r:.2f} is the PRE-RULING GOLD face '
                     f'(gold {GOLD_R}, espresso {ESPRESSO_R}). Colin ruled espresso on 2026-08-17; '
                     'deriving from this master reverts it. Use final-mascot-2026-08-25-espresso.png.')
else:
    raise SystemExit(f'{SRC}: iris mean R {_r:.2f} matches neither the espresso master '
                     f'({ESPRESSO_R}) nor the gold one ({GOLD_R}) within +-{TOL}. This does not look '
                     'like the mascot master; refusing rather than deriving from the wrong art.')
H, W, _ = rgb.shape
mx = rgb.max(2); mn = rgb.min(2)
val = mx / 255.0
sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
lum = 0.2126*rgb[:,:,0] + 0.7152*rgb[:,:,1] + 0.0722*rgb[:,:,2]

# --- subject silhouette: threshold, close, fill. Dark interior survives. ---
subj = mx > 22
subj = ndimage.binary_closing(subj, np.ones((9, 9)))
lbl, n = ndimage.label(subj)
subj = lbl == (int(np.argmax(ndimage.sum(subj, lbl, range(1, n+1)))) + 1)
subj = ndimage.binary_fill_holes(subj)
print(f'subject {int(subj.sum())}px')

# --- wing region: bright, mid-saturation, one big mass (R79's finding) ---
wing = subj & (val > 0.45) & (sat > 0.10) & (sat < 0.62)
lw, nw = ndimage.label(wing)
wing = lw == (int(np.argmax(ndimage.sum(wing, lw, range(1, nw+1)))) + 1)
wing = ndimage.binary_fill_holes(ndimage.binary_closing(wing, np.ones((11, 11))))
wing = ndimage.binary_dilation(wing, np.ones((7, 7))) & subj
print(f'wing region {int(wing.sum())}px')

body = subj & ~wing

def soft(mask, sigma=0.9):
    return np.clip(ndimage.gaussian_filter(mask.astype(np.float64), sigma), 0, 1)

# Body: opaque, so RGB is exact as rendered -- no unpremultiply, which is what
# blew the bands out. The antialiased rim stays slightly dark; at the sizes we
# fly (13-44pt from a 3x asset) it is sub-pixel.
body_a = soft(body)
body_rgb = rgb

# Wings: genuinely translucent and bright, so the luma ramp is right here and
# division is stable. Unpremultiply against the black plate to recover the
# colour behind the glow.
wa = np.clip((lum - 8.0) / 32.0, 0, 1)
wing_a = np.clip(wa * soft(wing, 1.2), 0, 1)
wing_rgb = np.clip(np.where(wing_a[..., None] > 0.02, rgb / np.maximum(wing_a[..., None], 0.02), 0), 0, 255)

def save(rgbv, a, name):
    im = Image.fromarray(np.dstack([rgbv, a*255]).astype(np.uint8), 'RGBA')
    im.save(name)
    return im

wl = save(wing_rgb, wing_a, 'wing_full.png')
bl = save(body_rgb, body_a, 'body_full.png')

# --- verification: does the ink survive? ---
CREAM = (255, 247, 204)
canvas = Image.new('RGBA', (W, H), CREAM + (255,))
canvas.alpha_composite(wl); canvas.alpha_composite(bl)
rec = np.asarray(canvas.convert('RGB')).astype(float)
ink = body & (mx < 70)
ink = ndimage.binary_opening(ink, np.ones((9, 9)))
ys, xs = np.nonzero(ink); sel = ys > 640
print(f'ink bands: source median max-channel {np.median(rgb[ys[sel],xs[sel]].max(1)):.1f}'
      f'  ->  rebuilt {np.median(rec[ys[sel],xs[sel]].max(1)):.1f}')
yel = body & (rgb[:,:,0] > 200) & (rgb[:,:,1] > 140) & (rgb[:,:,2] < 110)
yy, yx = np.nonzero(yel)
print(f'yellow body: source {rgb[yy,yx].mean(0).round(1)}  ->  rebuilt {rec[yy,yx].mean(0).round(1)}')
canvas.convert('RGB').save('recomposite_fixed.png')
np.save('masks.npy', np.stack([body, wing]))
