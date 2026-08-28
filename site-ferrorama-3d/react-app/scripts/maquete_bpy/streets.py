"""Fase 15 — as avenidas que ligam um módulo ao outro.

Até aqui cada módulo era uma ilha. A mina tinha estrada de serviço interna, o
porto tinha a dele, e entre um sítio e outro havia gramado. Num tabuleiro em
que tudo é uma operação só, isso não fecha: a maquete inteira é uma cadeia
logística, e cadeia logística tem rodovia.

No vídeo de referência a avenida é o elemento que costura tudo — pista larga,
canteiro central, poste dos dois lados e fileira densa de árvore no bordo. É
esse desenho que este módulo constrói.

Quatro eixos:

* **Avenida Norte** — central de controle → terminal logístico → porto. Corre
  em `z ≈ 6,3`, ao norte do oval (que não passa de `z = 5,2`), sem cruzar via.
* **Avenida Oeste** — central de controle → portaria da mina, contornando o
  oval pelo lado de fora.
* **Rua da Estação Leste** e **Oeste** — os dois ramais curtos que descem até
  as plataformas dentro do oval. Estes *precisam* cruzar a linha principal, e
  por isso cada um ganha passagem de nível de verdade, com estrado, cruz de
  Santo André e faixa de parada (`rail_detail.passagem_nivel`).

Convenção de coordenadas e de rotação: igual ao resto (ver `process.py`).
"""

from __future__ import annotations

import math

from .flora import fileira
from .primitives import cube, join
from .rail_detail import passagem_nivel
from .railway import poste_luz

# Cota do asfalto: acima do topo da grama (0,072 com o deslocamento) e abaixo
# do boleto (0,08), para a rua nunca cobrir trilho.
Y_RUA = 0.076
LARGURA = 0.62


def via(name, pontos, m, larg=LARGURA, canteiro=False):
    """Pista asfaltada seguindo uma polilinha, com eixo pintado.

    Cada trecho é uma placa girada no yaw do segmento. Nas quebras as placas se
    sobrepõem um pouco — de propósito: sem a sobreposição aparece uma fatia de
    grama na dobra.
    """
    p = []
    for i in range(len(pontos) - 1):
        x0, z0 = pontos[i]
        x1, z1 = pontos[i + 1]
        comp = math.hypot(x1 - x0, z1 - z0)
        yaw = math.atan2(z1 - z0, x1 - x0)
        cx, cz = (x0 + x1) * 0.5, (z0 + z1) * 0.5
        p.append(cube(f"{name}P{i}", (comp + larg * 0.9, 0.025, larg), (cx, Y_RUA, cz), m["asph"], 0.008, rot=(0, yaw, 0)))
        if canteiro:
            # Canteiro central gramado, como nas avenidas do vídeo.
            p.append(cube(f"{name}Cant{i}", (comp, 0.05, larg * 0.2), (cx, Y_RUA + 0.02, cz), m["grass"], 0.008, rot=(0, yaw, 0)))
            p.append(cube(f"{name}Guia{i}", (comp, 0.06, larg * 0.26), (cx, Y_RUA + 0.005, cz), m["conc_dirty"], 0.006, rot=(0, yaw, 0)))
        else:
            # Eixo tracejado.
            n = max(1, int(comp / 0.34))
            for j in range(n):
                t = (j + 0.25) / n
                p.append(
                    cube(
                        f"{name}E{i}_{j}",
                        (0.16, 0.006, 0.028),
                        (x0 + (x1 - x0) * t, Y_RUA + 0.016, z0 + (z1 - z0) * t),
                        m["paint"],
                        0.0,
                        rot=(0, yaw, 0),
                    )
                )
    return join(name, p)


def postes_via(prefixo, pontos, m, passo=2.2, lado=0.46, h=1.15):
    """Iluminação nos dois bordos, alternada — o ritmo que a avenida precisa."""
    k = 0
    for i in range(len(pontos) - 1):
        x0, z0 = pontos[i]
        x1, z1 = pontos[i + 1]
        comp = math.hypot(x1 - x0, z1 - z0)
        yaw = math.atan2(z1 - z0, x1 - x0)
        nx, nz = -math.sin(yaw), math.cos(yaw)
        n = max(1, int(round(comp / passo)))
        for j in range(n):
            t = (j + 0.5) / n
            s = 1 if (k % 2 == 0) else -1
            poste_luz(
                f"{prefixo}{k}",
                x0 + (x1 - x0) * t + nx * lado * s,
                z0 + (z1 - z0) * t + nz * lado * s,
                m["black"],
                m["glow"],
                h,
            )
            k += 1


def _bordo(pontos, lado):
    """Polilinha deslocada lateralmente — onde vai a fileira de árvore."""
    fora = []
    for i, (x, z) in enumerate(pontos):
        j = min(i, len(pontos) - 2)
        yaw = math.atan2(pontos[j + 1][1] - pontos[j][1], pontos[j + 1][0] - pontos[j][0])
        fora.append((x - math.sin(yaw) * lado, z + math.cos(yaw) * lado))
    return fora


# Traçados. Todos medidos contra o oval (|x| ≤ 8,55, |z| ≤ 5,2) e contra os
# ramais, que ficam em z negativo do lado da mina.
# A ponta leste sobe pelo lado do terminal logistico em vez de seguir reto:
# no tracado anterior ela passava a 0,14 do ramal do porto.
AV_NORTE = [(-10.4, 6.3), (-4.0, 6.2), (0.4, 6.3), (5.2, 6.3), (9.2, 6.5), (10.8, 7.6), (11.6, 8.8)]
AV_OESTE = [(-16.2, 6.3), (-14.6, 4.0), (-13.0, 0.6), (-12.2, -2.6), (-10.4, -3.4)]
RUA_EST_L = [(5.0, 6.3), (5.05, 4.4), (5.15, 3.3)]
RUA_EST_O = [(-11.2, -2.9), (-9.4, -2.5), (-7.0, -2.4)]


def build_streets(m):
    via("AvNorte", AV_NORTE, m, larg=0.78, canteiro=True)
    via("AvOeste", AV_OESTE, m, larg=0.7, canteiro=True)
    via("RuaEstL", RUA_EST_L, m, larg=0.5)
    via("RuaEstO", RUA_EST_O, m, larg=0.5)
    # Ligação da avenida norte com a portaria do terminal logístico.
    via("RuaTerminal", [(0.4, 6.3), (0.5, 8.2), (0.75, 9.2)], m, larg=0.5)

    postes_via("LuzAvN", AV_NORTE, m)
    postes_via("LuzAvO", AV_OESTE, m)

    # As duas ruas de estação cruzam a linha principal. Sem passagem de nível
    # seria um caminhão atravessando trilho no ar.
    passagem_nivel("PNEstL", 5.08, 5.2, 0.0, math.pi / 2, m, largura=0.72)
    passagem_nivel("PNEstO", -8.55, -2.46, math.pi / 2, 0.16, m, largura=0.72)

    # Arborização dos bordos: é o que costura a avenida na paisagem.
    fileira("AlamedaAvN", _bordo(AV_NORTE, 0.72), m, passo=1.15, jitter=0.16, escala=0.8, arbustos=0.3)
    fileira("AlamedaAvN2", _bordo(AV_NORTE, -0.72), m, passo=1.3, jitter=0.16, escala=0.75, arbustos=0.35)
    fileira("AlamedaAvO", _bordo(AV_OESTE, 0.66), m, passo=1.2, jitter=0.16, escala=0.8, arbustos=0.3)
