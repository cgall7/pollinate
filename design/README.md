# Mascot masters

Two files, and only one of them is the source of record.

| file | state | use |
|---|---|---|
| `final-mascot-2026-08-25-espresso.png` | **master of record** | everything |
| `final-mascot-2026-08-12-PRE-RULING-gold-eyes.png` | pre-ruling | provenance only — never derive from it |

The 08-12 render has the **gold** irises. Colin ruled them **espresso** on
2026-08-17 (thread `01325980`, board `.scratch/icon-mocks/board_eyes.png`), and
that ruling shipped as `aea0bdc`/`687e788` by editing the *derived* 309px
`assets/mascot-body.png` directly — 558 pixels, iris only, never propagated up.
For six days, re-deriving from the 08-12 master silently restored the face Colin
had rejected.

**A regeneration inherits the source's state and silently reverts every ruling
applied below it.** The 08-25 master carries the espresso decision at full
resolution (14,527 pixels rewritten, all iris), so the chain is honest again.

The 08-12 file is kept because it is the provenance of the gold state and of
every geometry figure in `src/constants/mascot.js` — which reproduce from either
file, since the repair touched only iris colour. Its name says what it is so no
script reaches for it by habit, and `pipeline/build_layers.py` refuses to run on
it regardless.

## Pipeline

**Requires `numpy`, `scipy` and `Pillow`, and is deliberately not wired into
`npm test`.** These are the first tracked `.py` files in the repo; the gate suite
is Node and stays Node. The chain is run by hand when the master changes, which
is rare by design — and its acceptance is the round trip below, not a passing
gate.


    python3 pipeline/build_layers.py                # master -> wing_full/body_full
    python3 pipeline/cut.py <outdir>                # -> mascot-{wing,body}.png + hero LOD

`build_layers.py` takes an optional master path and **defaults to the espresso
master**. It guards its own input rather than documenting the hazard — a comment
is what failed here last time. The iris box in master coordinates is probed and
the verdict is **three-way**, because nearest-of-two has no *neither* answer:

| mean R over the probe box | verdict | exit |
|---|---|---|
| within ±8.0 of **71.67** | espresso master | 0 |
| within ±8.0 of **94.05** | PRE-RULING gold — refuses, names the ruling | 1 |
| anything else, or <1000 iris pixels | not the mascot master — refuses | 1 |

All four branches are exercised: espresso master 0; the pre-ruling master 1;
`assets/icon.png` 1 (*matches neither* — mean R 34.14, the icon's ink bands);
`assets/spiral-mark.png` 1 (*0 iris pixels*). The first draft used nearest-of-two
and **passed the app icon**, then died forty lines later on an empty argmax — a
CANNOT TELL wearing a clean pass, which is the hole this project keeps
re-earning.

## Acceptance

The iris repair's bar was a **round trip**, not a colour match (Lumen,
2026-08-25): the repaired master back through the chain had to reproduce what
already shipped.

    mascot-wing.png   0 differing pixels, sha256 identical
    mascot-body.png   2 differing pixels of 98,880 (0.0020%), max channel diff 2,
                      both inside the iris box, dE00 max 0.5731

The shipped face is the face of record. The master conforms to it, never the reverse.

### Wing-outline ownership (2026-09-02)

The master includes a fine charcoal construction line around the translucent
wings. The original split assigned that dark perimeter to `body`, so rotating
the golden wing exposed an immobile second wing behind it. The pipeline now
assigns the narrow dark perimeter to wing ownership before cutting the body;
the rendered wing layer itself remains byte-identical. `cut.py` pins the
ratified 1013×1049 character box so removing an artifact cannot recrop both
layers and silently move the hinge.

Acceptance is the cream-ground body-only and wing+body recomposite plus
`npm run check:mascot-presence`: the old body contains 959 dark near-wing
pixels; the repaired body contains 45, all at legitimate body/hinge crossings,
under the gate's ≤100 ceiling. The wing SHA-256 remains
`23002baf6dcf506d545054a462e853c710f9370ee3e795633fd20546135cffe0`.
