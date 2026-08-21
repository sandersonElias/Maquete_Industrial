from __future__ import annotations

import math

from .coords import RX
from .curves import ease_inout, linear_keys, smooth_keys
from .primitives import cube, cyl, empty, ico, parent, parent_keep, wheels


def build_volvo_cat(m, road_mine):
    vx, vz = -12.55, -6.75
    volvo = empty("Volvo", (vx, 0.0, vz))
    parent(cube("VBody", (0.62, 0.32, 0.85), (0, 0, 0), m["volvo"], 0.045), volvo, (0, 0.38, 0))
    parent(cube("VCab", (0.5, 0.34, 0.42), (0, 0, 0), m["volvo"], 0.03), volvo, (0, 0.72, 0.12))
    parent(cube("VGlass", (0.42, 0.18, 0.04), (0, 0, 0), m["glass"], 0.005), volvo, (0, 0.78, 0.34))
    parent(cyl("VTrackL", 0.12, 0.7, (0, 0, 0), m["black"], 12, (math.pi / 2, 0, 0)), volvo, (-0.32, 0.14, 0))
    parent(cyl("VTrackR", 0.12, 0.7, (0, 0, 0), m["black"], 12, (math.pi / 2, 0, 0)), volvo, (0.32, 0.14, 0))
    braco = empty("VolvoBraco", (vx + 0.08, 0.58, vz + 0.3))
    parent_keep(braco, volvo)
    boom = cube("VBoom", (0.12, 0.1, 1.15), (0, 0, 0), m["black"], 0.02)
    stick = cube("VStick", (0.1, 0.7, 0.1), (0, 0, 0), m["black"], 0.015)
    bucket = cube("VBucket", (0.38, 0.16, 0.28), (0, 0, 0), m["black"], 0.012)
    parent(boom, braco, (0, 0.08, 0.52))
    parent(stick, braco, (0, -0.18, 1.05))
    parent(bucket, braco, (0, -0.42, 1.05))
    for t, dx in enumerate((-0.12, -0.04, 0.04, 0.12)):
        parent(cube(f"VTooth{t}", (0.05, 0.05, 0.1), (0, 0, 0), m["black"], 0.004), braco, (dx, -0.5, 1.22))
    for f in range(1, 241):
        u = (f - 1) / 240.0 * math.tau
        ang = 0.12 + 0.38 * math.sin(u * 2.0) + 0.08 * math.sin(u * 4.0)
        braco.rotation_euler = (ang, 0, 0)
        braco.keyframe_insert("rotation_euler", frame=f)
    smooth_keys(braco)

    cat = empty("CAT", (vx + 1.15, 0.0, vz + 0.15))
    parent(cube("CChassi", (0.7, 0.22, 1.35), (0, 0, 0), m["cat"], 0.04), cat, (0, 0.32, 0))
    parent(cube("CCab", (0.55, 0.42, 0.5), (0, 0, 0), m["cat"], 0.035), cat, (0, 0.68, 0.28))
    parent(cube("CGlass", (0.46, 0.2, 0.04), (0, 0, 0), m["glass"], 0.004), cat, (0, 0.74, 0.54))
    cacamba = empty("CATCacamba", (0, 0, 0))
    parent(cacamba, cat, (0, 0.45, -0.52))
    parent(cube("CBed", (0.72, 0.38, 0.85), (0, 0, 0), m["cat"], 0.03), cacamba, (0, 0.1, 0))
    parent(cube("COre", (0.55, 0.2, 0.65), (0, 0, 0), m["ore"], 0.02), cacamba, (0, 0.38, 0))
    wheels(cat, m["black"], (-0.38, 0.38), (-0.5, 0.05, 0.48), r=0.16, y=0.16, depth=0.12)
    parent(cube("C137", (0.02, 0.1, 0.18), (0, 0, 0), m["black"], 0.002), cat, (0.36, 0.7, 0.28))
    # Posição/rotação do CAT: React (polilinha reta no asfalto). Só a caçamba anima aqui.
    for f in range(1, 241):
        if f < 132:
            dump = 0.0
        elif f < 148:
            dump = 0.62 * ease_inout((f - 132) / 16)
        elif f < 166:
            dump = 0.62
        elif f < 180:
            dump = 0.62 * (1.0 - ease_inout((f - 166) / 14))
        else:
            dump = 0.0
        cacamba.rotation_euler = (dump, 0, 0)
        cacamba.keyframe_insert("rotation_euler", frame=f)
    linear_keys(cacamba)


def build_train(m):
    trem = empty("Trem", (RX, 0.12, 0))
    parent(cube("LocoMRS", (0.52, 0.38, 1.22), (0, 0, 0), m["mrs_b"], 0.04), trem, (0, 0.38, 0))
    parent(cube("LocoNariz", (0.52, 0.38, 0.32), (0, 0, 0), m["mrs_y"], 0.03), trem, (0, 0.38, 0.74))
    parent(cube("LocoCab", (0.5, 0.28, 0.4), (0, 0, 0), m["mrs_b"], 0.025), trem, (0, 0.68, 0.22))
    parent(cube("LocoVidro", (0.42, 0.16, 0.04), (0, 0, 0), m["glass"], 0.004), trem, (0, 0.72, 0.44))
    parent(cube("LocoFaixaL", (0.04, 0.12, 1.15), (0, 0, 0), m["mrs_y"], 0.008), trem, (0.27, 0.42, 0.05))
    parent(cube("LocoFaixaR", (0.04, 0.12, 1.15), (0, 0, 0), m["mrs_y"], 0.008), trem, (-0.27, 0.42, 0.05))
    parent(cube("LocoNum", (0.02, 0.1, 0.22), (0, 0, 0), m["white"], 0.002), trem, (0.27, 0.58, 0.5))
    wheels(trem, m["black"], (-0.28, 0.28), (-0.42, 0.05, 0.48), r=0.09, y=0.09, depth=0.08)
    for i in range(3):
        z = -1.05 - i * 0.92
        mat_v = m["black"] if i < 2 else m["coal"]
        ore = m["ore"] if i < 2 else m["coal"]
        parent(cube(f"Vagao{i}", (0.5, 0.28, 0.78), (0, 0, 0), mat_v, 0.03), trem, (0, 0.28, z))
        parent(ico(f"VagaoOre{i}", 0.28, (0, 0, 0), ore, 2, (1.4, 0.55, 1.1)), trem, (0, 0.5, z))
        wheels(trem, m["black"], (-0.26, 0.26), (z - 0.22, z + 0.22), r=0.08, y=0.08, depth=0.07)
    return trem
