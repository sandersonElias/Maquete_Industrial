"""Fase 12 — o cais ganha o que a foto de referência tem e a maquete não tinha.

A referência é um diorama HO de porto fluvial. Comparando com o nosso cais,
quatro objetos carregam a identidade da foto e nenhum existia aqui:

* **Guindaste treliçado sobre esteiras.** É a silhueta que domina a imagem.
  Lança vazada — dois banzos e diagonais —, contrapeso atrás do eixo de giro e
  cabo pendurado com moitão. Sem o vazio entre os banzos o olho lê um poste
  inclinado; sem o contrapeso lê uma máquina prestes a tombar.
* **Bloco de contêineres no cais.** Havia contêiner só no convés do navio. No
  chão eles viram um bloco ordenado de três de altura, que é o que faz um pátio
  parecer operando em vez de decorado.
* **Barcaça com escavadeira de garra.** Explica a água: com o navio sozinho, a
  lâmina lê como um retângulo azul; com algo pequeno flutuando ao lado, lê como
  água.
* **Rebocador.** Um casco pequeno encostado num grande é o que dá escala ao
  navio.

Junto vem a correção da própria água. Ela era uma laje lisa de rugosidade 0,06:
reflexo uniforme, aparência de plástico. Agora a laje só faz corpo e a
superfície é uma malha subdividida com deslocamento leve, que quebra o brilho
em ondulação — o mesmo truque da grama, e é o que faz a água da foto funcionar.

Convenção de coordenadas e de rotação: igual ao resto (ver `process.py`).
"""

from __future__ import annotations

import math

import bpy

from .coords import tloc
from .primitives import apply_mods, assign, cube, cyl, join, smooth, unwrap
from .process import Y_CAIS, barra

# Onde cada peça nova entra. Todas passaram pelo `verificar_layout.py` antes de
# virar código: o cais é estreito e a alça do ramal corta o trecho sul.
# O guindaste ficou de frente para o meio do navio, com a lanca apontando para
# leste: assim ela sai por cima da agua em vez de varrer o cais, e a base tem
# 0,95 livre em volta. O primeiro lugar tentado (17,2 ; 4,5) caia em cima do
# mastro de iluminacao e a 0,52 do eixo da via.
GUINDASTE = (18.75, 8.0)
CONTEINERES = (19.3, 4.6)
BARCACA = (22.2, 3.9)
REBOCADOR = (22.2, 13.2)


def _base(x, z, yaw, y0=0.0):
    co, si = math.cos(yaw), math.sin(yaw)

    def pt(a, t, h):
        return (x + co * a - si * t, y0 + h, z + si * a + co * t)

    return pt


def lanca_trelicada(name, p0, p1, m, larg=0.09, passo=0.22):
    """Lança vazada: dois banzos paralelos e diagonais alternadas.

    O vazio entre os banzos é o que separa um guindaste de um poste inclinado,
    e sai barato: uma barra por banzo e uma por diagonal.
    """
    dx, dy, dz = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
    comp = math.sqrt(dx * dx + dy * dy + dz * dz)
    # Normal horizontal ao eixo da lança, para afastar os dois banzos.
    yaw = math.atan2(dz, dx)
    nx, nz = -math.sin(yaw), math.cos(yaw)
    meia = larg * 0.5
    p = []
    for lado in (-1, 1):
        p.append(
            barra(
                f"{name}Banzo{lado}",
                (p0[0] + nx * meia * lado, p0[1], p0[2] + nz * meia * lado),
                (p1[0] + nx * meia * lado, p1[1], p1[2] + nz * meia * lado),
                0.022,
                0.022,
                m["crane_y"],
            )
        )
    n = max(2, int(comp / passo))
    for i in range(n):
        t0, t1 = i / n, (i + 1) / n
        lado = 1 if i % 2 == 0 else -1
        a = (p0[0] + dx * t0 + nx * meia * lado, p0[1] + dy * t0, p0[2] + dz * t0 + nz * meia * lado)
        b = (p0[0] + dx * t1 - nx * meia * lado, p0[1] + dy * t1, p0[2] + dz * t1 - nz * meia * lado)
        p.append(barra(f"{name}Diag{i}", a, b, 0.014, 0.014, m["crane_y"]))
    return p


def guindaste_trelica(name, x, z, m, yaw=0.0, y0=Y_CAIS):
    """Guindaste treliçado sobre esteiras, com contrapeso e carga pendurada."""
    pt = _base(x, z, yaw, y0)
    p = [
        # Esteiras e carbody.
        cube(f"{name}EstA", (0.66, 0.11, 0.16), pt(0, -0.21, 0.055), m["black"], 0.02, rot=(0, yaw, 0)),
        cube(f"{name}EstB", (0.66, 0.11, 0.16), pt(0, 0.21, 0.055), m["black"], 0.02, rot=(0, yaw, 0)),
        cube(f"{name}Carbody", (0.44, 0.08, 0.36), pt(0, 0, 0.14), m["steel_rust"], 0.012, rot=(0, yaw, 0)),
        # Plataforma de giro.
        cube(f"{name}Giro", (0.5, 0.24, 0.42), pt(-0.04, 0, 0.3), m["crane_y"], 0.02, rot=(0, yaw, 0)),
        cube(f"{name}Cabine", (0.18, 0.22, 0.2), pt(0.2, -0.12, 0.33), m["crane_y"], 0.018, rot=(0, yaw, 0)),
        cube(f"{name}Vidro", (0.02, 0.15, 0.15), pt(0.29, -0.12, 0.35), m["glass"], 0.0, rot=(0, yaw, 0)),
        # Contrapeso: sem massa atrás do eixo o olho lê a máquina tombando.
        cube(f"{name}Contra", (0.2, 0.28, 0.46), pt(-0.32, 0, 0.34), m["black"], 0.015, rot=(0, yaw, 0)),
        # Torre de estais e o próprio estai até a ponta.
        barra(f"{name}Mastro", pt(-0.12, 0, 0.42), pt(-0.2, 0, 0.86), 0.05, 0.05, m["crane_y"]),
    ]
    pe = pt(0.18, 0, 0.42)
    pp = pt(1.45, 0, 2.32)
    p += lanca_trelicada(f"{name}Lanca", pe, pp, m)
    p.append(barra(f"{name}Estai", pt(-0.2, 0, 0.86), pp, 0.016, 0.016, m["steel"]))
    # Cabo e moitão: é o que diz que a máquina está trabalhando.
    pg = pt(1.45, 0, 1.02)
    p.append(barra(f"{name}Cabo", pp, pg, 0.012, 0.012, m["black"]))
    p.append(cube(f"{name}Moitao", (0.1, 0.16, 0.1), pt(1.45, 0, 0.94), m["steel_rust"], 0.01, rot=(0, yaw, 0)))
    return join(name, p)


def conteineres_cais(name, x, z, m, yaw=0.0, y0=Y_CAIS, colunas=3, fileiras=2, altura=3):
    """Bloco ordenado de contêineres. A ordem é o que faz parecer operação."""
    pt = _base(x, z, yaw, y0)
    p = []
    k = 0
    for i in range(colunas):
        a = (i - (colunas - 1) * 0.5) * 0.56
        for j in range(fileiras):
            t = (j - (fileiras - 1) * 0.5) * 0.5
            # A última coluna fica um nível mais baixa: pilha perfeitamente
            # retangular não existe em pátio de verdade.
            n = altura - (1 if i == colunas - 1 and j == 0 else 0)
            for k2 in range(n):
                p.append(
                    cube(
                        f"{name}C{k}",
                        (0.52, 0.3, 0.46),
                        pt(a, t, 0.15 + k2 * 0.31),
                        m["cont"][(i + j + k2) % 5],
                        0.012,
                        rot=(0, yaw, 0),
                    )
                )
                k += 1
    return join(name, p)


def barcaca_garra(name, x, z, m, yaw=0.0, y_agua=0.12):
    """Barcaça com escavadeira de garra — o que dá vida à lâmina d'água."""
    pt = _base(x, z, yaw, y_agua)
    p = [
        cube(f"{name}Casco", (1.5, 0.16, 0.86), pt(0, 0, -0.02), m["steel_rust"], 0.03, rot=(0, yaw, 0)),
        cube(f"{name}Borda", (1.54, 0.05, 0.9), pt(0, 0, 0.075), m["black"], 0.012, rot=(0, yaw, 0)),
        # Escavadeira de garra montada no convés.
        cube(f"{name}Est", (0.42, 0.08, 0.34), pt(-0.15, 0, 0.14), m["black"], 0.012, rot=(0, yaw, 0)),
        cube(f"{name}Giro", (0.32, 0.22, 0.3), pt(-0.15, 0, 0.29), m["crane_y"], 0.018, rot=(0, yaw, 0)),
        cube(f"{name}Cabine", (0.14, 0.18, 0.16), pt(-0.03, -0.09, 0.32), m["crane_y"], 0.015, rot=(0, yaw, 0)),
    ]
    pe = pt(0.0, 0, 0.38)
    pp = pt(0.72, 0, 1.02)
    p += lanca_trelicada(f"{name}Lanca", pe, pp, m, larg=0.07, passo=0.18)
    p.append(barra(f"{name}Cabo", pp, pt(0.72, 0, 0.48), 0.01, 0.01, m["black"]))
    # Garra aberta: duas conchas em V.
    for lado in (-1, 1):
        p.append(
            barra(
                f"{name}Concha{lado}",
                pt(0.72, 0, 0.44),
                pt(0.72 + 0.09 * lado, 0, 0.3),
                0.08,
                0.09,
                m["steel_rust"],
            )
        )
    # Pilha de material no convés, à ré.
    p.append(cube(f"{name}Carga", (0.46, 0.1, 0.6), pt(-0.5, 0, 0.11), m["ore"], 0.03, rot=(0, yaw, 0)))
    return join(name, p)


def rebocador(name, x, z, m, yaw=0.0, y_agua=0.12):
    """Rebocador: casco curto, superestrutura alta, defensas de pneu."""
    pt = _base(x, z, yaw, y_agua)
    p = [
        cube(f"{name}Casco", (0.58, 0.22, 1.15), pt(0, 0, -0.02), m["black"], 0.05, rot=(0, yaw, 0)),
        cube(f"{name}Bordo", (0.6, 0.06, 1.18), pt(0, 0, 0.11), m["ship"], 0.02, rot=(0, yaw, 0)),
        cube(f"{name}Casa", (0.44, 0.24, 0.46), pt(0, 0, 0.26), m["white"], 0.025, rot=(0, yaw, 0)),
        cube(f"{name}Ponte", (0.34, 0.18, 0.3), pt(0.02, 0, 0.47), m["white"], 0.02, rot=(0, yaw, 0)),
        cube(f"{name}Vidro", (0.36, 0.11, 0.02), pt(0.02, 0, 0.5), m["glass"], 0.0, rot=(0, yaw, 0)),
        cyl(f"{name}Chamine", 0.07, 0.24, pt(-0.18, 0, 0.7), m["black"], 12),
        cyl(f"{name}Mastro", 0.014, 0.3, pt(0.1, 0, 0.75), m["steel"], 6),
    ]
    # Defensas de pneu na amurada — a assinatura de um rebocador.
    for i in range(5):
        t = -0.42 + i * 0.21
        for lado in (-1, 1):
            p.append(cyl(f"{name}Pneu{i}{lado}", 0.045, 0.03, pt(t, lado * 0.3, 0.04), m["rubber"], 10, rot=(0, yaw, 0)))
    return join(name, p)


def superficie_agua(name, m, x=22.3, z=0.0, larg=2.6, comp=33.4, y=0.125):
    """Lâmina d'água com ondulação.

    Era uma laje lisa de rugosidade 0,06: o reflexo saía uniforme e de longe
    lia como plástico. Uma malha subdividida com deslocamento leve quebra o
    brilho em linhas curtas — é exatamente o que faz a água da foto de
    referência funcionar, e custa uma malha barata.
    """
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=26, y_subdivisions=160, size=1, location=tloc(x, y, z))
    ob = bpy.context.object
    ob.name = name
    ob.scale = (larg, comp, 1)
    bpy.ops.object.transform_apply(scale=True)
    tex = bpy.data.textures.new(f"{name}Disp", "CLOUDS")
    tex.noise_scale = 0.55
    tex.noise_depth = 2
    d = ob.modifiers.new("Disp", "DISPLACE")
    d.texture = tex
    d.strength = 0.022
    d.mid_level = 0.5
    apply_mods(ob)
    assign(ob, m["water"])
    unwrap(ob)
    smooth(ob, 70)
    return ob


def build_harbour(m):
    guindaste_trelica("GuindasteTrelica", GUINDASTE[0], GUINDASTE[1], m, yaw=0.0)
    conteineres_cais("ConteinerCais", CONTEINERES[0], CONTEINERES[1], m, yaw=0.06)
    barcaca_garra("Barcaca", BARCACA[0], BARCACA[1], m, yaw=1.62)
    rebocador("Rebocador", REBOCADOR[0], REBOCADOR[1], m, yaw=0.08)
    superficie_agua("AguaSuperficie", m)
