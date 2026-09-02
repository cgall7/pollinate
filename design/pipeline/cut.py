"""Cut both LODs of the mascot from the master render's two layers.

Produces the character-box crop at two sizes from ONE writer:
  base  309x320  - every chrome mount (13-132pt), unchanged bytes since R82
  hero  native   - the master crop itself, no resample, for ceremonial scale
"""
from PIL import Image
import numpy as np, json, sys, os

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
wing = Image.open('wing_full.png'); body = Image.open('body_full.png')
# The character box is part of the component geometry, not a fresh answer to
# whatever pixels happen to survive a layer repair.  Removing the static wing
# outline from the body legitimately changes the union's leftmost pixel; it
# must not recrop both layers and shift the approved hinge under the caller.
# This is the espresso master's ratified 1013 x 1049 box.
box = (169, 110, 1182, 1159)
BW, BH = box[2] - box[0], box[3] - box[1]
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
