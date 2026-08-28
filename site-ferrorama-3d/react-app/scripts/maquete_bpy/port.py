from __future__ import annotations

import math

import bpy

from .coords import PORT, tloc
from .curves import smooth_keys
from .primitives import cube, cyl, empty, parent, parent_keep
from .railway import poste_luz


def build_port(m):
    px, pz = PORT
    # Fase 7 - o cais foi estendido para leste ate x=21.0 e rebaixado para
    # topo y=0.16. Com isso a alca do ramal do porto (que ia ate x~20.4) passa
    # a correr sobre patio pavimentado em vez de sobre a agua, e a laje deixa
    # de enterrar os trilhos, que ficam em y~0.
    cube("Cais", (7.65, 0.16, 10.4), (17.175, 0.08, pz), m["conc"], 0.02)
    cube("CaisBorda", (0.18, 0.14, 10.4), (20.91, 0.21, pz), m["white"], 0.01)
    # A agua virou uma faixa ao longo de toda a borda leste do tabuleiro: um
    # tanque de 10 unidades no meio do nada nao lia como mar. A lamina fica em
    # y=0.12 - acima do topo da grama (que vai a 0.072 com o displace) para nao
    # deixar o capim atravessar o mar, e 0.04 abaixo do topo do cais.
    cube("Agua", (2.6, 0.14, 33.4), (22.3, 0.05, 0.0), m["water"], 0.0)
    # ArmazemP e GalpaoP agora sao galpoes com estrutura (structures.py), e o
    # armazem saiu de cima do ramal ferroviario.
    # Recuado para abrir o corredor da galeria C (ver process.py).
    cube("SiloPorto", (1.05, 1.35, 1.05), (px - 5.3, 0.72, pz + 0.8), m["conc"], 0.04)
    poste_luz("LuzPorto0", px - 3.4, pz - 3.6, m["black"], m["glow"], 1.7)
    # LuzPorto1 e LuzPorto2 saíram de cima do pátio de estocagem e do virador.
    poste_luz("LuzPorto1", px - 4.05, pz + 4.3, m["black"], m["glow"], 1.7)
    poste_luz("LuzPorto2", px - 1.4, pz - 3.4, m["black"], m["glow"], 1.55)
    poste_luz("LuzPorto3", px - 0.4, pz - 4.2, m["black"], m["glow"], 1.45)
    poste_luz("LuzPorto4", px - 0.4, pz + 4.2, m["black"], m["glow"], 1.45)

    # Navio rebaixado: antes o casco flutuava 0.15 acima da lamina d agua.
    navio = empty("Navio", (22.3, -0.06, pz))
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

    # Com o cais estendido, o guindaste de conteineres foi para a borda nova,
    # a vante do navio: a faixa central do cais agora e da alca ferroviaria e
    # do shiploader (cadeia de granel).
    gx, gz = 20.35, 12.15
    cube("GuindBase", (0.55, 0.22, 0.55), (gx, 0.28, gz), m["conc"], 0.02)
    cyl("Guindaste", 0.1, 2.85, (gx, 1.55, gz), m["glow"], 14)
    guind = empty("GuindLanca", (gx, 2.9, gz))
    lanca = cube("LancaG", (2.85, 0.1, 0.14), (gx + 1.55, 2.9, gz), m["glow"], 0.02)
    cabo = cube("CaboG", (0.03, 1.15, 0.03), (gx + 2.7, 2.25, gz), m["black"], 0.004)
    carga = cube("CargaG", (0.5, 0.28, 0.44), (gx + 2.7, 1.55, gz), m["cont"][0], 0.012)
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
            22.3 + 0.16 * math.sin(u),
            -0.07 + 0.045 * math.sin(u * 2.0 + 0.4),
            pz + 0.28 * math.cos(u * 0.85),
        )
        navio.rotation_euler = (0.03 * math.sin(u * 1.4), 0, 0.04 * math.sin(u))
        navio.keyframe_insert("location", frame=f)
        navio.keyframe_insert("rotation_euler", frame=f)
    smooth_keys(navio)
    return navio
