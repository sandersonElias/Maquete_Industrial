from __future__ import annotations

import math

import bpy

from .coords import PORT, tloc
from .curves import smooth_keys
from .primitives import cube, cyl, empty, parent, parent_keep
from .railway import poste_luz


def build_port(m):
    px, pz = PORT
    cube("Cais", (4.4, 0.34, 9.2), (px - 2.05, 0.2, pz), m["conc"], 0.03)
    cube("CaisBorda", (0.18, 0.22, 9.2), (px - 0.05, 0.42, pz), m["white"], 0.01)
    cube("Agua", (7.8, 0.05, 10.0), (px + 2.05, 0.02, pz), m["water"], 0.0)
    cube("ArmazemP", (2.4, 1.15, 3.2), (px - 5.4, 0.62, pz - 1.4), m["conc"], 0.04)
    cube("ArmazemTeto", (2.6, 0.1, 3.4), (px - 5.4, 1.24, pz - 1.4), m["dirt"], 0.02)
    cube("GalpaoP", (1.6, 0.85, 2.2), (px - 5.6, 0.48, pz + 2.6), m["white"], 0.04)
    cube("SiloPorto", (1.05, 1.35, 1.05), (px - 4.55, 0.72, pz + 0.55), m["conc"], 0.04)
    cube("CorreiaPorto", (4.6, 0.1, 0.32), (px - 1.15, 0.72, pz + 0.15), m["belt"], 0.01, rot=(0, 0.12, 0.08))
    cube("CorreiaPortoPe0", (0.12, 0.62, 0.12), (px - 3.2, 0.35, pz + 0.05), m["black"], 0.008)
    cube("CorreiaPortoPe1", (0.12, 0.78, 0.12), (px + 0.55, 0.42, pz + 0.28), m["black"], 0.008)
    cube("HopperCais", (0.85, 0.55, 0.7), (px - 0.55, 0.55, pz + 0.2), m["black"], 0.02)
    poste_luz("LuzPorto0", px - 3.4, pz - 3.6, m["black"], m["glow"], 1.7)
    poste_luz("LuzPorto1", px - 3.4, pz + 3.6, m["black"], m["glow"], 1.7)
    poste_luz("LuzPorto2", px - 1.2, pz, m["black"], m["glow"], 1.55)
    poste_luz("LuzPorto3", px - 0.4, pz - 4.2, m["black"], m["glow"], 1.45)
    poste_luz("LuzPorto4", px - 0.4, pz + 4.2, m["black"], m["glow"], 1.45)

    navio = empty("Navio", (px + 0.85, 0.18, pz))
    parent(cube("Casco", (1.85, 0.5, 5.6), (0, 0, 0), m["ship"], 0.07), navio, (0, 0.26, 0))
    parent(cube("CascoB", (1.45, 0.2, 5.1), (0, 0, 0), m["black"], 0.03), navio, (0, 0.0, 0))
    parent(cube("Ponte", (1.15, 1.05, 1.15), (0, 0, 0), m["white"], 0.05), navio, (0, 1.05, -1.85))
    parent(cube("PonteVidro", (0.95, 0.26, 0.05), (0, 0, 0), m["glass"], 0.004), navio, (0, 1.22, -1.26))
    parent(cyl("Chamine", 0.14, 0.55, (0, 0, 0), m["black"], 12), navio, (0.32, 1.7, -1.85))
    idx = 0
    for z in (-0.55, 0.25, 1.05, 1.85, 2.55):
        for x in (-0.52, 0.52):
            for y in (0.58, 0.9):
                parent(cube(f"Cnt{idx}", (0.52, 0.3, 0.46), (0, 0, 0), m["cont"][idx % 5], 0.012), navio, (x, y, z))
                idx += 1
                if idx > 17:
                    break
            if idx > 17:
                break
        if idx > 17:
            break

    cube("GuindBase", (0.55, 0.22, 0.55), (px - 1.55, 0.45, pz - 0.4), m["conc"], 0.02)
    cyl("Guindaste", 0.1, 2.85, (px - 1.55, 1.7, pz - 0.4), m["glow"], 14)
    guind = empty("GuindLanca", (px - 1.55, 3.05, pz - 0.4))
    lanca = cube("LancaG", (2.85, 0.1, 0.14), (px + 0.0, 3.05, pz - 0.4), m["glow"], 0.02)
    cabo = cube("CaboG", (0.03, 1.15, 0.03), (px + 1.15, 2.4, pz - 0.4), m["black"], 0.004)
    carga = cube("CargaG", (0.5, 0.28, 0.44), (px + 1.15, 1.7, pz - 0.4), m["cont"][0], 0.012)
    parent_keep(lanca, guind)
    parent_keep(cabo, guind)
    parent_keep(carga, guind)
    bpy.context.view_layer.update()
    z_carga = carga.location.z
    for f in range(1, 241):
        u = (f - 1) / 240.0 * math.tau
        yaw = 0.12 + 0.82 * math.sin(u)
        drop = -0.42 * (0.5 + 0.5 * math.sin(u * 2.0 + 0.6))
        guind.rotation_euler = (0, 0, yaw)
        guind.keyframe_insert("rotation_euler", frame=f)
        carga.location.z = z_carga + drop
        carga.keyframe_insert("location", frame=f)
    smooth_keys(guind)
    smooth_keys(carga)

    for f in range(1, 241):
        u = (f - 1) / 240.0 * math.tau
        navio.location = tloc(
            px + 0.85 + 0.16 * math.sin(u),
            0.17 + 0.045 * math.sin(u * 2.0 + 0.4),
            pz + 0.28 * math.cos(u * 0.85),
        )
        navio.rotation_euler = (0.03 * math.sin(u * 1.4), 0, 0.04 * math.sin(u))
        navio.keyframe_insert("location", frame=f)
        navio.keyframe_insert("rotation_euler", frame=f)
    smooth_keys(navio)
    return navio
