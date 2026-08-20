from __future__ import annotations

from .coords import COAL, IRON
from .primitives import cube, cyl, ico, lathe_solid
from .railway import poste_luz


def build_iron_mine(m):
    mx, mz = IRON
    # Degraus da cava (bancadas)
    lathe_solid(
        "MinaCava",
        [
            (4.15, 0.02),
            (3.85, 0.42),
            (3.15, 0.52),
            (2.75, 0.92),
            (2.05, 1.08),
            (1.55, 1.42),
            (0.85, 1.55),
            (0.28, 1.78),
            (0.08, 1.86),
        ],
        40,
        (mx, 0.0, mz),
        m["rock"],
        displace=0.1,
        noise=2.0,
    )
    lathe_solid(
        "MinaBanco1",
        [(3.55, 0.38), (3.48, 0.46), (3.05, 0.48)],
        28,
        (mx, 0.0, mz),
        m["dirt"],
        displace=0.03,
        noise=1.1,
    )
    lathe_solid(
        "MinaBanco2",
        [(2.55, 0.88), (2.48, 0.98), (2.08, 1.02)],
        24,
        (mx, 0.0, mz),
        m["dirt"],
        displace=0.025,
        noise=1.0,
    )
    lathe_solid(
        "MinaFundo",
        [(0.06, 0.05), (0.95, 0.08), (0.8, 0.22), (0.12, 0.28)],
        20,
        (mx, 0.0, mz),
        m["dirt"],
        displace=0.04,
        noise=0.8,
    )
    cube("Barracao", (2.3, 1.05, 1.65), (mx - 5.4, 0.56, mz + 0.2), m["conc"], 0.05)
    cube("BarracaoTeto", (2.5, 0.1, 1.85), (mx - 5.4, 1.14, mz + 0.2), m["dirt"], 0.02)
    cube("MinaOficina", (1.35, 0.7, 1.05), (mx - 4.6, 0.4, mz + 2.6), m["conc"], 0.04)
    cube("Britador", (0.85, 0.95, 0.85), (mx - 3.55, 0.55, mz + 1.55), m["black"], 0.03)
    cube("BritadorBoca", (0.55, 0.22, 0.55), (mx - 3.55, 1.12, mz + 1.55), m["conc"], 0.015)
    ico("PilharOre", 0.62, (mx - 3.2, 0.42, mz + 2.35), m["ore"], 2, (1.5, 0.75, 1.2))
    ico("PilharOre2", 0.4, (mx - 2.35, 0.28, mz + 1.7), m["ore"], 2, (1.2, 0.55, 1.0))
    cube("Correia", (2.8, 0.08, 0.28), (mx - 2.1, 0.55, mz + 1.15), m["belt"], 0.01, rot=(0, 0.35, 0.4))
    cube("CorreiaPe", (0.12, 0.55, 0.12), (mx - 1.1, 0.3, mz + 0.7), m["black"], 0.01)
    cube("Correia2", (1.85, 0.07, 0.22), (mx - 3.9, 0.62, mz + 1.9), m["belt"], 0.01, rot=(0, -0.2, 0.55))
    poste_luz("LuzMina0", mx - 3.8, mz + 3.1, m["black"], m["amber"], 1.55)
    poste_luz("LuzMina1", mx + 0.4, mz - 4.4, m["black"], m["amber"], 1.45)
    poste_luz("LuzMina2", mx - 5.1, mz + 2.4, m["black"], m["amber"], 1.35)
    for i in range(4):
        cube(f"CercaMina{i}", (0.06, 0.55, 0.06), (mx - 6.3, 0.3, mz - 1.4 + i * 0.85), m["black"], 0.004)

    # Carvão: poço mais escuro no retorno do ramal SW4
    cx, cz = COAL[0], -6.15
    lathe_solid(
        "CarvaoCava",
        [
            (2.55, 0.02),
            (2.35, 0.28),
            (1.85, 0.38),
            (1.35, 0.72),
            (0.75, 0.88),
            (0.22, 1.05),
            (0.06, 1.12),
        ],
        28,
        (cx, 0.0, cz),
        m["coal"],
        displace=0.08,
        noise=1.6,
    )
    lathe_solid(
        "CarvaoFundo",
        [(0.05, 0.04), (0.7, 0.06), (0.55, 0.16), (0.1, 0.2)],
        16,
        (cx, 0.0, cz),
        m["dirt"],
        displace=0.03,
        noise=0.7,
    )
    cyl("SiloCarvao", 0.48, 1.15, (cx - 2.35, 0.62, cz + 1.55), m["black"], 16)
    cube("SiloTeto", (0.95, 0.08, 0.95), (cx - 2.35, 1.25, cz + 1.55), m["conc"], 0.015)
    cube("CorreiaCarvao", (2.2, 0.07, 0.22), (cx - 1.15, 0.48, cz + 0.85), m["belt"], 0.01, rot=(0, 0.28, 0.5))
    ico("PilhaCarvao", 0.48, (cx - 1.55, 0.32, cz + 1.85), m["coal"], 2, (1.4, 0.6, 1.15))
    poste_luz("LuzCarvao", cx - 2.1, cz + 2.15, m["black"], m["amber"], 1.4)
    cube("TerminalCarvao", (1.15, 0.55, 0.85), (cx - 3.15, 0.32, cz + 0.35), m["conc"], 0.03)
