from __future__ import annotations

import math

import bpy

from .coords import RX, RZ
from .primitives import apply_mods, assign, boolean_cut, cube, cyl, ico, join, lathe_solid, smooth, unwrap
from .flora import bosque
from .railway import poste_luz, semaforo
from .terrain import build_terrain


def cut_tunnel(hills, x, radius=0.58, length=3.4):
    for hill in hills:
        bpy.ops.mesh.primitive_cylinder_add(
            radius=radius,
            depth=length,
            location=(x, 0.0, 0.52),
            rotation=(math.pi / 2, 0, 0),
            vertices=24,
        )
        cutter = bpy.context.object
        cutter.name = f"Cut_{hill.name}"
        try:
            boolean_cut(hill, cutter)
        except Exception as exc:
            print("CUT_FAIL", hill.name, exc)
            try:
                bpy.data.objects.remove(cutter, do_unlink=True)
            except Exception:
                pass


def tunel_forro(prefix, x, m_conc):
    from .coords import tloc
    from .primitives import assign as _assign

    for suf, z in (("BocaN", 1.28), ("BocaS", -1.28)):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.52,
            minor_radius=0.08,
            location=tloc(x, 0.5, z),
            rotation=(math.pi / 2, 0, 0),
            major_segments=28,
            minor_segments=10,
        )
        ob = bpy.context.object
        ob.name = f"{prefix}{suf}"
        _assign(ob, m_conc)
        smooth(ob, 40)


def build_board(m):
    # Fase 17 — a placa de madeira saiu. Ela era a mesa: um bloco de 47 x 35
    # com quina viva, e era ela que dizia "isto e um quadrado apoiado em algum
    # lugar". O terreno agora continua ate o horizonte (`terrain.py`).
    # Fase 16 — a grade de grama lisa saiu daqui. O terreno agora e um campo de
    # altura com cobertura recortada, em `terrain.py`.
    build_terrain(m)


def build_hills(m):
    hill_prof = [(0.06, 0.0), (2.45, 0.03), (2.15, 0.48), (1.5, 1.02), (0.78, 1.52), (0.12, 1.78)]
    grass_prof = [(0.04, 1.05), (1.12, 1.12), (0.68, 1.48), (0.1, 1.68)]
    morro_ln = lathe_solid("MorroLesteN", hill_prof, 32, (RX + 0.55, 0.0, 2.05), m["rock"], 0.16, 1.5)
    morro_ls = lathe_solid("MorroLesteS", hill_prof, 32, (RX + 0.55, 0.0, -2.05), m["rock"], 0.16, 1.55)
    morro_on = lathe_solid("MorroOesteN", hill_prof, 32, (-RX - 0.55, 0.0, 2.05), m["rock"], 0.16, 1.5)
    morro_os = lathe_solid("MorroOesteS", hill_prof, 32, (-RX - 0.55, 0.0, -2.05), m["rock"], 0.16, 1.6)
    cut_tunnel([morro_ln, morro_ls], RX)
    cut_tunnel([morro_on, morro_os], -RX)
    tunel_forro("TunelL", RX, m["conc"])
    tunel_forro("TunelO", -RX, m["conc"])
    lathe_solid("CapimLN", grass_prof, 22, (RX + 0.5, 0.0, 1.85), m["grass"], 0.06, 1.2)
    lathe_solid("CapimLS", grass_prof, 22, (RX + 0.5, 0.0, -1.85), m["grass"], 0.06, 1.2)
    lathe_solid("CapimON", grass_prof, 22, (-RX - 0.5, 0.0, 1.85), m["grass"], 0.06, 1.2)
    lathe_solid("CapimOS", grass_prof, 22, (-RX - 0.5, 0.0, -1.85), m["grass"], 0.06, 1.2)


# `build_scada` saiu na fase 14. Era uma laje de 3,2 x 2,2 com uma mesa,
# quatro monitores, uma caneca e uma cadeira — sem parede, sem teto e sem
# entorno, uma sala de controle ao ar livre no meio do gramado. O que faz o
# papel dela agora e o campus de `control_center.py`, no quadrante noroeste.


def build_trees(m):
    spots = [
        (-20.2, -12.2), (-18.4, 4.2), (-14.5, 11.4), (-8.2, -13.4), (6.1, -12.6),
        (8.4, 13.2), (12.6, -3.2), (11.2, -5.4), (10.2, -14.2),
        (-10.4, 9.2), (3.2, 12.4), (-21.2, 8.1), (1.2, -14.4),
        (22.0, 2.2), (-19.2, -6.2), (-12.4, -12.8), (-3.4, 11.8),
        (8.4, -8.6), (-16.2, 6.4), (5.6, 10.8), (-6.8, -12.0),
        (16.8, -9.4), (18.6, -11.2), (15.2, -12.0),
        (-21.6, 2.4), (20.4, -4.8), (-4.2, -14.6), (9.6, 11.6),
        (21.2, 12.4), (-22.0, -3.2), (2.4, -13.2),
        # Fase 13 — o pedido foi "mais cara de vida real, com arvores ao
        # redor". Estes pontos preenchem as bordas que ficaram peladas depois
        # que o terminal tomou o centro-norte.
        (-2.2, 15.6), (-9.4, 15.4), (-13.2, 14.2), (-17.6, 12.8), (-21.4, 11.2),
        (-22.4, 6.4), (-21.8, 1.2), (-16.4, 2.4), (-12.2, 3.6), (-11.6, 8.4),
        (-8.6, 6.2), (-4.6, 8.8), (-1.8, 5.2), (12.8, -6.4), (16.4, -4.2),
        (19.6, -7.6), (21.4, -12.4), (6.8, -15.6), (-2.6, -16.2), (-13.6, -16.4),
        (-19.8, -16.2), (13.4, -14.6), (18.2, -15.4), (-6.2, -9.4), (-3.2, -12.6),
    ]

    def arvore_ok(x, z):
        # A agua passou a ocupar toda a borda leste a partir de x=21.0.
        if x > 20.5:
            return False
        if x > 12.0 and z > 3.0:
            return False
        # O raio grande em volta de IRON existia por causa do morro `MinaCava`,
        # que saiu na fase 8. Sobra o que interessa: manter o interior da alca
        # limpo, porque arvore entre trilhos nao existe.
        if (x + 17.2) ** 2 + (z + 9.4) ** 2 < 10.5:
            return False
        if (x + 19.4) ** 2 + (z + 6.15) ** 2 < 12:
            return False
        # Fase 8: cava, pilha de esteril e bacia de decantacao.
        if (x + 20.3) ** 2 + (z + 11.8) ** 2 < 4.4:
            return False
        if (x + 17.2) ** 2 + (z + 12.7) ** 2 < 2.9:
            return False
        if (x + 14.6) ** 2 + (z + 12.3) ** 2 < 2.2:
            return False
        # Fase 13: o terminal logistico ocupa o retangulo que antes era vazio.
        if -0.4 < x < 10.0 and 6.2 < z < 15.6:
            return False
        # Fase 14: o campus da central de controle, no quadrante noroeste.
        if -22.2 < x < -10.2 and 6.2 < z < 16.0:
            return False
        # Fase 15: a faixa das avenidas ja tem alameda propria.
        if -11.0 < x < 12.6 and 5.4 < z < 7.6:
            return False
        if -17.0 < x < -9.8 and -4.4 < z < 6.8:
            return False
        return True

    # Fase 15 — a receita unica (cilindro + duas icoesferas) saiu daqui. O
    # sorteio de especie, tom e altura vive em `flora.py`; aqui so sobra a
    # lista de pontos e o filtro do que nao pode receber arvore.
    pontos = [(x, z) for x, z in spots if arvore_ok(x, z)]
    bosque("Bosque", pontos, m)


def build_fair_lights(m):
    """Postes e luzes extras no limite do celular (fase 3)."""
    for i, (x, z) in enumerate(
        (
            (RX, 4.4),
            (RX, -4.4),
            (-RX, 4.4),
            (-RX, -4.4),
            (0.0, RZ),
            (0.0, -RZ),
            (4.2, RZ),
            (-4.2, -RZ),
        )
    ):
        poste_luz(f"LuzOval{i}", x, z, m["black"], m["glow"], 1.22)
    semaforo("SemLeste", RX, 0.0, math.pi / 2, m)
    semaforo("SemOeste", -RX, 0.0, -math.pi / 2, m)
