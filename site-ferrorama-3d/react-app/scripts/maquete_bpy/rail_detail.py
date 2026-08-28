"""Fase 9 — a ferrovia ganha os aparelhos que fazem uma ferrovia ser ferrovia.

O tabuleiro tinha via, dormente e lastro, mas nenhum dos objetos que um
ferromodelista procura primeiro quando olha uma maquete:

* **Aparelho de mudança de via (AMV).** Os quatro desvios eram cubos
  luminosos de 0,38 pousados perto da via — nem no eixo dela, aliás: os dois
  do atalho ficavam a 0,81 do trilho mais próximo. Agora são AMVs de verdade,
  no eixo: dormentação alongada, agulha divergindo do trilho encostado, chave
  com alavanca, contrapeso e disco indicador. O disco herda o material
  `glow`, então continua sendo o ponto luminoso que marca o desvio à distância.
* **Passagem de nível.** A estrada de serviço da mina cruza a via em dois
  pontos — o ramal em (-10,32; -5,31) e o oval em (-8,21; -4,13) — e cruzava
  no ar, sem estrado nem sinalização. Um caminhão fora-de-estrada atravessando
  trilho sem passagem de nível é o tipo de erro que um visitante da feira que
  entende de ferrovia nota na hora.
* **Para-choque.** As quatro pontas do pátio terminavam no vazio.
* **Marco quilométrico.** Barato, e é o detalhe que dá escala à linha.

Convenção de coordenadas e de rotação: igual ao resto (ver `process.py`).
"""

from __future__ import annotations

import math

from .primitives import cube, cyl, join
from .process import barra

# Topo do boleto. Tudo que atravessa a via tem de nascer nesta cota.
Y_BOLETO = 0.08


def _base(x, z, yaw):
    """Devolve um conversor de (avanço, lateral, altura) para mundo."""
    co, si = math.cos(yaw), math.sin(yaw)

    def pt(a, t, h):
        return (x + co * a - si * t, h, z + si * a + co * t)

    return pt


def amv(name, x, z, yaw, m, mao=1.0):
    """Aparelho de mudança de via. `mao` = +1 desvia para a esquerda, -1 direita."""
    pt = _base(x, z, yaw)
    p = []
    # Dormentação do aparelho: mais longa que a da via corrente, e é isso que
    # denuncia um AMV numa foto aérea.
    for i in range(7):
        a = -0.48 + i * 0.16
        comp = 0.62 + i * 0.05
        p.append(cube(f"{name}Dorm{i}", (0.09, 0.035, comp), pt(a, 0.02 * i * mao, 0.045), m["sleeper"], 0.004, rot=(0, yaw, 0)))
    # Trilho encostado (reto) e agulha divergindo.
    for lado in (-1, 1):
        p.append(barra(f"{name}Reto{lado}", pt(-0.52, lado * 0.09, Y_BOLETO), pt(0.55, lado * 0.09, Y_BOLETO), 0.022, 0.03, m["rail"]))
    p.append(barra(f"{name}Agulha", pt(-0.32, 0.09 * mao, Y_BOLETO), pt(0.55, 0.34 * mao, Y_BOLETO), 0.02, 0.028, m["rail"]))
    p.append(barra(f"{name}AgulhaB", pt(-0.1, -0.09 * mao, Y_BOLETO), pt(0.55, 0.16 * mao, Y_BOLETO), 0.02, 0.028, m["rail"]))
    # Chave: caixa, alavanca e contrapeso.
    p.append(cube(f"{name}Chave", (0.14, 0.08, 0.12), pt(-0.28, -0.34 * mao, 0.06), m["steel_rust"], 0.008, rot=(0, yaw, 0)))
    p.append(barra(f"{name}Alav", pt(-0.28, -0.34 * mao, 0.1), pt(-0.1, -0.3 * mao, 0.22), 0.02, 0.02, m["steel_rust"]))
    p.append(cyl(f"{name}Contra", 0.045, 0.03, pt(-0.1, -0.3 * mao, 0.23), m["sig_r"], 10))
    # Disco indicador: o ponto luminoso que já existia, agora em cima da chave.
    p.append(cyl(f"{name}Poste", 0.018, 0.26, pt(-0.28, -0.34 * mao, 0.19), m["black"], 6))
    p.append(cyl(f"{name}Disco", 0.075, 0.02, pt(-0.28, -0.34 * mao, 0.33), m["glow"], 14, rot=(0, yaw, math.pi / 2)))
    return join(name, p)


def passagem_nivel(name, x, z, yaw_via, yaw_estrada, m, largura=0.86):
    """Passagem de nível: estrado, faixa de parada e cruz de Santo André."""
    pt = _base(x, z, yaw_via)
    meia = largura * 0.5
    p = [
        # Estrado: painel entre os trilhos e dois painéis por fora. Fica 0,002
        # abaixo do boleto para a roda nunca subir no tablado.
        cube(f"{name}Meio", (meia * 2, 0.03, 0.17), pt(0, 0, Y_BOLETO - 0.017), m["wood"], 0.004, rot=(0, yaw_via, 0)),
        cube(f"{name}ForaA", (meia * 2, 0.03, 0.14), pt(0, 0.19, Y_BOLETO - 0.017), m["wood"], 0.004, rot=(0, yaw_via, 0)),
        cube(f"{name}ForaB", (meia * 2, 0.03, 0.14), pt(0, -0.19, Y_BOLETO - 0.017), m["wood"], 0.004, rot=(0, yaw_via, 0)),
    ]
    # Faixa de parada dos dois lados, no eixo da estrada.
    pe = _base(x, z, yaw_estrada)
    for lado in (-1, 1):
        p.append(cube(f"{name}Faixa{lado}", (0.05, 0.012, 0.5), pe(lado * 0.62, 0, 0.09), m["paint"], 0.0, rot=(0, yaw_estrada, 0)))
        # Cruz de Santo André, no bordo direito de quem chega.
        bx, _, bz = pe(lado * 0.72, lado * -0.36, 0)
        p.append(cyl(f"{name}Post{lado}", 0.022, 0.5, (bx, 0.25, bz), m["white"], 8))
        for giro in (0.7, -0.7):
            p.append(
                cube(
                    f"{name}Cruz{lado}{giro > 0}",
                    (0.3, 0.055, 0.012),
                    (bx, 0.52, bz),
                    m["white"],
                    0.0,
                    rot=(0, yaw_estrada + math.pi / 2, giro),
                )
            )
        p.append(cyl(f"{name}Luz{lado}", 0.03, 0.018, (bx, 0.42, bz + 0.02), m["sig_r"], 10))
    return join(name, p)


def para_choque(name, x, z, yaw, m):
    """Para-choque de fim de linha: berço, viga e placa refletiva."""
    pt = _base(x, z, yaw)
    p = [
        cube(f"{name}Berco", (0.26, 0.09, 0.42), pt(0, 0, 0.075), m["conc_dirty"], 0.008, rot=(0, yaw, 0)),
        cube(f"{name}Viga", (0.06, 0.13, 0.36), pt(-0.09, 0, 0.17), m["steel_rust"], 0.008, rot=(0, yaw, 0)),
        cube(f"{name}Placa", (0.02, 0.16, 0.34), pt(-0.13, 0, 0.2), m["sig_r"], 0.0, rot=(0, yaw, 0)),
        cube(f"{name}Faixa", (0.024, 0.05, 0.34), pt(-0.135, 0, 0.2), m["white"], 0.0, rot=(0, yaw, 0)),
    ]
    for lado in (-1, 1):
        p.append(barra(f"{name}Esc{lado}", pt(0.1, lado * 0.14, 0.09), pt(-0.08, lado * 0.14, 0.24), 0.03, 0.03, m["steel_rust"]))
    return join(name, p)


def marco_km(name, x, z, m, yaw=0.0):
    """Marco quilométrico: poste baixo branco com faixa preta."""
    p = [
        cube(f"{name}Corpo", (0.06, 0.24, 0.1), (x, 0.12, z), m["white"], 0.008, rot=(0, yaw, 0)),
        cube(f"{name}Faixa", (0.065, 0.05, 0.105), (x, 0.19, z), m["black"], 0.0, rot=(0, yaw, 0)),
    ]
    return join(name, p)


# ---------------------------------------------------------------------------


def build_rail_detail(m):
    # Os quatro AMVs, agora no eixo da via. O yaw é a direção do traçado no
    # ponto (medida sobre o mesmo Catmull que `railway.py` densifica).
    amv("Desvio0", 5.10, -3.05, -0.5027, m, mao=1.0)
    amv("Desvio1", -5.10, 3.05, -0.5027, m, mao=-1.0)
    amv("Desvio2", 7.67, 4.74, 2.5002, m, mao=1.0)
    amv("Desvio3", -7.67, -4.74, -0.6414, m, mao=1.0)

    # Onde a estrada de serviço da mina cruza a via. Os dois pontos saíram da
    # interseção do Catmull da estrada com o das vias — não de estimativa.
    passagem_nivel("PNMinaRamal", -10.32, -5.31, 0.044, 0.542, m)
    passagem_nivel("PNMinaOval", -8.21, -4.13, -1.002, 0.502, m)

    # Fim de linha das duas vias do pátio, só no lado leste: a ponta oeste
    # fica aberta porque é por onde o AMV do atalho entra. Via de pátio com
    # para-choque numa ponta e chave na outra é o arranjo normal.
    for i, (px, pz) in enumerate(((4.52, 3.55), (4.52, 2.85))):
        para_choque(f"ParaChoqueL{i}", px, pz, 0.0, m)

    # Marcos ao longo do oval, do lado de fora do lastro.
    for i, (px, pz, pyaw) in enumerate(
        (
            (0.0, 5.95, 0.0),
            (4.5, 5.95, 0.0),
            (-4.5, 5.95, 0.0),
            (9.3, 1.5, math.pi / 2),
            (-9.3, -1.5, math.pi / 2),
            (0.0, -5.95, 0.0),
            (-4.5, -5.95, 0.0),
        )
    ):
        marco_km(f"MarcoKm{i}", px, pz, m, yaw=pyaw)
