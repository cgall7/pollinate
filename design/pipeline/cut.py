"""Cut both LODs of the mascot from the master render's two layers.

Produces the character-box crop at two sizes from ONE writer:
  base  309x320  - every chrome mount (13-132pt), unchanged bytes since R82
  hero  native   - the master crop itself, no resample, for ceremonial scale
"""
from PIL import Image
import numpy as np, json, sys, os

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
wing = Image.open('wing_full.png'); body = Image.open('body_full.png')
wa = np.asarray(wing)[:, :, 3]; ba = np.asarray(body)[:, :, 3]
ys, xs = np.nonzero(np.maximum(wa, ba) > 7)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
box = (x0, y0, x1 + 1, y1 + 1)
BW, BH = x1 - x0 + 1, y1 - y0 + 1
print(f'character box {BW}x{BH}')

BASE = 320  # R82's target: the longer side, sized for the 132pt hero at 3x
sc = BASE / max(BW, BH)
bw, bh = round(BW * sc), round(BH * sc)
for im, stem in ((wing, 'wing'), (body, 'body')):
    crop = im.crop(box)
    crop.resize((bw, bh), Image.LANCZOS).save(os.path.join(OUT, f'mascot-{stem}.png'))
    crop.save(os.path.join(OUT, f'mascot-{stem}-hero.png'))   # native, no resample
print(f'base {bw}x{bh}   hero {BW}x{BH}')
json.dump({'boxW': int(BW), 'boxH': int(BH), 'basePx': int(bw), 'heroPx': int(BW)},
          open(os.path.join(OUT, 'lods.json'), 'w'), indent=1)
