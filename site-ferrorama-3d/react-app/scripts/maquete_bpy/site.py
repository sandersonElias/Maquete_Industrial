"""Fase 7 — sítio coerente: limites, acessos e a borda entre terra e água.

Três incoerências de layout vinham de antes desta fase e são corrigidas aqui
(as duas primeiras por edição em `port.py`, esta terceira por acréscimo):

1. **O trem andava sobre o mar.** A alça do ramal do porto ia até x≈20,4 e a
   água começava em x=15,75. Em vez de mexer no traçado — que é espelhado em
   `geometria.ts` e desincronizaria o trem —, o **cais foi estendido até x=21,0**
   e a água empurrada para além dele. A alça agora corre sobre pátio pavimentado,
   que é exatamente onde uma alça de terminal portuário corre.
2. **O cais enterrava a via.** A laje tinha topo em y=0,37 e os trilhos ficam em
   y≈0. A laje foi rebaixada para topo 0,16, no nível do lastro.
3. **O armazém estava montado em cima do ramal.** Foi para o sul, fora da faixa.

O que este módulo acrescenta é o que faltava para o terreno ter *limite*: sem
cerca e portaria, uma mineradora não lê como área controlada — lê como parque.
"""

from __future__ import annotations

import math

from .primitives import cube, cyl, join
from .process import barra

# Topo da laje do cais depois do rebaixamento da fase 7.
Y_CAIS = 0.16
# Face do cais (onde o navio atraca) e início da água.
X_CAIS_BORDA = 21.0


def cerca(name, pontos, m, h=0.34, passo=0.62):
    """Cerca de mourão e tela. `pontos` = lista de (x, z)."""
    p = []
    k = 0
    for i in range(len(pontos) - 1):
        x0, z0 = pontos[i]
        x1, z1 = pontos[i + 1]
        comp = math.hypot(x1 - x0, z1 - z0)
        yaw = math.atan2(z1 - z0, x1 - x0)
        n = max(1, int(round(comp / passo)))
        for j in range(n + (1 if i == len(pontos) - 2 else 0)):
            t = j / n
            px = x0 + (x1 - x0) * t
            pz = z0 + (z1 - z0) * t
            p.append(cyl(f"{name}M{k}", 0.022, h, (px, h * 0.5, pz), m["steel"], 6))
            k += 1
        # Tela: um painel fino no vão inteiro, mais barato que arame por arame.
        p.append(
            cube(
                f"{name}T{i}",
                (comp, h * 0.78, 0.015),
                ((x0 + x1) * 0.5, h * 0.45, (z0 + z1) * 0.5),
                m["steel"],
                0.0,
                rot=(0, yaw, 0),
            )
        )
        p.append(
            cube(
                f"{name}A{i}",
                (comp, 0.018, 0.018),
                ((x0 + x1) * 0.5, h + 0.01, (z0 + z1) * 0.5),
                m["steel"],
                0.0,
                rot=(0, yaw, 0),
            )
        )
    return join(name, p)


def portaria(name, x, z, m, yaw=0.0):
    """Guarita com cancela: dá a leitura de acesso controlado."""
    ao = (math.cos(yaw), math.sin(yaw))
    tr = (-math.sin(yaw), math.cos(yaw))

    def pt(a, t, y):
        return (x + ao[0] * a + tr[0] * t, y, z + ao[1] * a + tr[1] * t)

    p = []
    p.append(cube(f"{name}Base", (0.9, 0.07, 0.7), pt(0, 0, 0.035), m["conc_dirty"], 0.01, rot=(0, yaw, 0)))
    p.append(cube(f"{name}Casa", (0.52, 0.42, 0.46), pt(-0.12, 0, 0.28), m["white"], 0.02, rot=(0, yaw, 0)))
    p.append(cube(f"{name}Vidro", (0.4, 0.2, 0.02), pt(-0.12, 0.24, 0.34), m["glass"], 0.0, rot=(0, yaw, 0)))
    p.append(cube(f"{name}Teto", (0.62, 0.04, 0.56), pt(-0.12, 0, 0.51), m["roof"], 0.01, rot=(0, yaw, 0)))
    # Cancela levantada, para não parecer que o portão está trancado.
    p.append(cyl(f"{name}Eixo", 0.03, 0.42, pt(0.3, -0.3, 0.21), m["steel"], 8))
    p.append(barra(f"{name}Cancela", pt(0.3, -0.3, 0.4), pt(0.42, -0.3, 1.02), 0.05, 0.05, m["hi_vis"]))
    p.append(cube(f"{name}Sinal", (0.03, 0.14, 0.16), pt(-0.4, 0.34, 0.62), m["sig_r"], 0.0, rot=(0, yaw, 0)))
    return join(name, p)


def defensas_cais(name, x, z0, z1, m, n=9):
    """Cabeços de amarração e defensas na face do cais."""
    p = []
    for i in range(n):
        z = z0 + (z1 - z0) * i / (n - 1)
        p.append(cyl(f"{name}Cab{i}", 0.06, 0.14, (x - 0.22, Y_CAIS + 0.07, z), m["steel"], 10, r2=0.075))
        p.append(cube(f"{name}Def{i}", (0.07, 0.2, 0.16), (x + 0.02, Y_CAIS - 0.06, z), m["rubber"], 0.01))
    p.append(cube(f"{name}Faixa", (0.16, 0.02, abs(z1 - z0) + 0.4), (x - 0.4, Y_CAIS + 0.015, (z0 + z1) * 0.5), m["paint"], 0.0))
    return join(name, p)


def build_site(m):
    # Limite da mina: oeste/sul, sempre longe do eixo da via.
    cerca("CercaMinaO", [(-23.3, -13.6), (-23.3, -5.0), (-19.0, -4.2)], m)
    cerca("CercaMinaS", [(-23.3, -13.6), (-16.0, -14.6), (-11.0, -13.4)], m)
    # Limite do terminal: norte e leste, terminando na borda do cais.
    cerca("CercaPortoN", [(9.6, 12.6), (9.6, 15.0), (20.7, 15.0)], m)

    portaria("PortariaMina", -7.2, -2.6, m, yaw=0.5)

    defensas_cais("DefensaCais", X_CAIS_BORDA, 4.6, 12.6, m)
