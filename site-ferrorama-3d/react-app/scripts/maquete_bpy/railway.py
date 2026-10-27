from __future__ import annotations

import math

from .coords import RX
from .curves import densify, lay_track, pts_three, stadium_points
from .primitives import cube, cyl, empty, parent, sphere


def build_railway(m):
    pts = densify(stadium_points(), 0.28, True)
    lay_track("Loop", pts, m["ballast"], m["sleeper"], m["rail"], True, 0.95)
    ramo_diag = densify(pts_three([(-5.1, 0, 3.05), (-2.1, 0, 1.4), (0, 0, 0), (2.1, 0, -1.4), (5.1, 0, -3.05)]), 0.28, False)
    ramo_porto = densify(
        pts_three(
            [
                (8.55, 0, 4.55),
                (10.6, 0, 5.85),
                (13.8, 0, 7.75),
                (16.9, 0, 9.55),
                (19.8, 0, 9.2),
                (20.2, 0, 7.05),
                (17.2, 0, 6.05),
                (12.4, 0, 5.45),
                (6.15, 0, 5.2),
            ]
        ),
        0.28,
        False,
    )
    ramo_mina = densify(
        pts_three(
            [
                (-8.55, 0, -4.55),
                (-10.8, 0, -6.15),
                (-13.4, 0, -8.05),
                (-16.4, 0, -10.15),
                (-19.0, 0, -9.45),
                (-18.6, 0, -7.05),
                (-14.8, 0, -5.75),
                (-11.0, 0, -5.35),
                (-6.15, 0, -5.2),
            ]
        ),
        0.28,
        False,
    )
    lay_track("Diag", ramo_diag, m["ballast"], m["sleeper"], m["rail"], False, 0.72)
    lay_track("RamoP", ramo_porto, m["ballast"], m["sleeper"], m["rail"], False, 0.78)
    lay_track("RamoM", ramo_mina, m["ballast"], m["sleeper"], m["rail"], False, 0.78)

    # Fase 9: os quatro desvios eram cubos luminosos de 0,38 pousados perto da
    # via — os dois do atalho a 0,81 do trilho mais proximo. Viraram AMVs no
    # eixo da via, em `rail_detail.py`.

    # Pátio curto: 3 vias paralelas no interior do oval (lado norte)
    yard_a = densify(pts_three([(-4.2, 0.0, 3.55), (-1.4, 0.0, 3.55), (1.4, 0.0, 3.55), (4.2, 0.0, 3.55)]), 0.28, False)
    yard_b = densify(pts_three([(-4.2, 0.0, 2.85), (-1.4, 0.0, 2.85), (1.4, 0.0, 2.85), (4.2, 0.0, 2.85)]), 0.28, False)
    lay_track("PatioA", yard_a, m["ballast"], m["sleeper"], m["rail"], False, 0.62)
    lay_track("PatioB", yard_b, m["ballast"], m["sleeper"], m["rail"], False, 0.62)
    cube("PatioPlat", (8.6, 0.08, 0.55), (0.0, 0.1, 3.2), m["conc"], 0.01)

    for i, (x, z) in enumerate(((-5.35, -2.35), (5.15, 2.45))):
        cube(f"Plat{i}", (0.7, 0.1, 1.85), (x, 0.14, z), m["conc"], 0.015)
        cube(f"Casa{i}", (0.62, 0.72, 1.2), (x - 0.85, 0.5, z), m["white"], 0.04)
        cube(f"Telhado{i}", (0.74, 0.08, 1.35), (x - 0.85, 0.92, z), m["dirt"], 0.02)
        cube(f"Janela{i}", (0.02, 0.18, 0.28), (x - 0.54, 0.52, z), m["glass"], 0.005)
        poste_luz(f"LuzEst{i}", x - 0.2, z + 1.05, m["black"], m["glow"], 1.15)

    semaforo("SemNE", 7.2, 4.2, -0.6, m)
    semaforo("SemSW", -7.2, -4.2, 2.5, m)
    semaforo("SemTunelL", RX - 0.7, 1.55, 0.0, m)
    semaforo("SemTunelO", -RX + 0.7, -1.55, math.pi, m)
    semaforo("SemPorto", 8.9, 5.15, -0.85, m)
    semaforo("SemMina", -8.9, -5.15, 2.3, m)
    semaforo("SemPatio", 4.6, 3.55, math.pi, m)

    return pts


def poste_luz(name, x, z, m_black, m_glow, h=1.38):
    cyl(f"{name}Poste", 0.035, h, (x, h / 2, z), m_black, 8)
    sphere(f"{name}Lamp", 0.08, (x, h + 0.04, z), m_glow)


def semaforo(name, x, z, yaw, m):
    root = empty(name, (x, 0, z))
    root.rotation_euler = (0, 0, yaw)
    parent(cyl(f"{name}Mastro", 0.035, 0.85, (0, 0, 0), m["black"], 8), root, (0, 0.42, 0))
    parent(cube(f"{name}Caixa", (0.12, 0.42, 0.1), (0, 0, 0), m["black"], 0.01), root, (0, 1.02, 0.04))
    parent(sphere(f"{name}R", 0.04, (0, 0, 0), m["sig_r"]), root, (0, 1.16, 0.1))
    parent(sphere(f"{name}Y", 0.04, (0, 0, 0), m["sig_y"]), root, (0, 1.02, 0.1))
    parent(sphere(f"{name}G", 0.04, (0, 0, 0), m["sig_g"]), root, (0, 0.88, 0.1))
    return root
