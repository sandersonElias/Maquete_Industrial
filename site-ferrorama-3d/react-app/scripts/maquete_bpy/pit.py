"""Fase 8 — a mina vira uma mina de verdade: cava descendente, estéril e rejeito.

Duas coisas estavam erradas na mineradora e as duas nasciam do mesmo objeto.

**A "cava" era um morro.** O perfil torneado de `MinaCava` ia de raio 4,15 na
base a raio 0,08 no alto: o raio *diminui* conforme a altura sobe, ou seja, era
um cone de 1,86 de altura. Uma mina a céu aberto é o contrário disso — o
terreno desce em bancadas até a praça do fundo.

**O morro engolia o trem.** A alça do ramal da mina passa a 0,81 do centro
`IRON`, e ali o cone já tinha 1,55 de altura. O comboio inteiro corria por
dentro da rocha. Nenhuma quantidade de acabamento resolve isso: era preciso ou
mudar o traçado (que é espelhado em `geometria.ts` e desincronizaria o trem) ou
tirar o morro do caminho.

A saída foi tirar o morro e abrir a cava no campo livre a sudoeste, em
`CAVA = (-20.3, -11.8)`. A alça fica limpa, e a cava ganha o que faltava:

* bancadas descendentes com berma plana entre taludes;
* **rampa helicoidal** de acesso, encostada na parede, do topo até a praça;
* praça de fundo com **sump** (a poça que toda cava tem, porque cava é o ponto
  mais baixo do terreno e a água escorre para lá);
* a metade de baixo em material de minério e a de cima em rocha estéril — é a
  leitura geológica que explica por que se cava.

Por que a cava sobe antes de descer: o tabuleiro é uma placa sólida com a grama
em y≈0,05, e não há como afundar abaixo dela sem um boolean na malha da grama,
que é aberta e arriscado num build sem conferência visual. Então a cava é uma
colina lavrada — que é literalmente Itabira e Serra Azul: morro de minério com
o topo comido em bancadas. A crista fica em y=0,64 e a praça em y=0,15.

Acompanham a cava as três coisas que sempre aparecem ao lado de uma:

* **pilha de estéril** — topo *plano* e talude em ângulo de repouso, com
  leira de segurança na borda de basculamento. É o que a diferencia da pilha de
  minério, que é cônica;
* **bacia de decantação** — dique de terra fechado, lâmina barrenta e
  extravasor;
* **usina compacta** — peneiramento sobre o britador que já existia, mais um
  espessador, que é a silhueta mais reconhecível de uma usina de tratamento.

Convenção de coordenadas e de rotação: igual ao resto (ver `process.py`).
"""

from __future__ import annotations

import math

from .primitives import cube, cyl, join, lathe_solid
from .process import barra

# Centro da cava, no campo livre a sudoeste da alça.
CAVA = (-20.3, -11.8)
# Centro da pilha de estéril e da bacia de decantação.
ESTERIL = (-17.2, -12.7)
BACIA = (-14.6, -12.3)

# Topo da grama com o displace: nada de fundo de cava pode ficar abaixo disso,
# senão o capim atravessa o piso.
Y_GRAMA = 0.075

# Perfil da cava, de fora para dentro. Pares (raio, altura).
# A lista sobe do pé do morro até a crista e depois desce em bancadas.
PERFIL_ROCHA = [
    (1.85, 0.00),   # pé do talude, na grama
    (1.74, 0.16),
    (1.62, 0.30),   # banqueta do talude externo
    (1.52, 0.32),
    (1.44, 0.48),
    (1.36, 0.64),   # crista
    (1.18, 0.62),   # berma de crista: a plataforma de trabalho do topo
    (1.10, 0.46),   # talude do banco 1
    (0.96, 0.44),   # berma 1
]
PERFIL_MINERIO = [
    (0.96, 0.44),   # continua exatamente onde a rocha parou
    (0.88, 0.30),   # talude do banco 2
    (0.72, 0.28),   # berma 2
    (0.64, 0.17),   # talude do banco 3
    (0.44, 0.15),   # praça do fundo
    (0.28, 0.12),   # caimento para o sump
    (0.22, 0.11),
    (0.00, 0.11),   # fecha o fundo
]


def _helice(cx, cz, r0, r1, y0, y1, a0, voltas, n):
    """Pontos de uma hélice descendente colada na parede da cava."""
    pts = []
    for i in range(n + 1):
        t = i / n
        a = a0 + t * voltas * math.tau
        r = r0 + (r1 - r0) * t
        pts.append((cx + math.cos(a) * r, y0 + (y1 - y0) * t, cz + math.sin(a) * r))
    return pts


def rampa_helicoidal(name, cx, cz, m, n=24):
    """Rampa de acesso da crista até a praça, com leira na borda de fora.

    Feita de barras retas encostadas uma na outra: a hélice tem raio pequeno e
    24 lances já leem como curva contínua, sem custar uma malha própria.
    """
    pts = _helice(cx, cz, 1.20, 0.40, 0.60, 0.16, 0.35, 1.35, n)
    p = []
    for i in range(n):
        p0, p1 = pts[i], pts[i + 1]
        p.append(barra(f"{name}D{i}", p0, p1, 0.19, 0.035, m["dirt"]))
        # Leira (windrow): o cordão de estéril que impede o caminhão de cair.
        if i % 2 == 0:
            mx = (p0[0] + p1[0]) * 0.5
            mz = (p0[2] + p1[2]) * 0.5
            my = (p0[1] + p1[1]) * 0.5
            ang = math.atan2(mz - cz, mx - cx)
            p.append(
                cube(
                    f"{name}L{i}",
                    (0.12, 0.05, 0.1),
                    (mx + math.cos(ang) * 0.1, my + 0.04, mz + math.sin(ang) * 0.1),
                    m["dirt"],
                    0.01,
                    rot=(0, ang, 0),
                )
            )
    return join(name, p)


def acesso_externo(name, cx, cz, m, ang=1.75, n=6):
    """Rampa que liga a crista ao terreno natural — a boca da cava."""
    p = []
    for i in range(n):
        t0, t1 = i / n, (i + 1) / n
        r0 = 1.30 + (1.98 - 1.30) * t0
        r1 = 1.30 + (1.98 - 1.30) * t1
        y0 = 0.61 + (0.02 - 0.61) * t0
        y1 = 0.61 + (0.02 - 0.61) * t1
        p.append(
            barra(
                f"{name}{i}",
                (cx + math.cos(ang) * r0, y0, cz + math.sin(ang) * r0),
                (cx + math.cos(ang) * r1, y1, cz + math.sin(ang) * r1),
                0.34,
                0.04,
                m["dirt"],
            )
        )
    return join(name, p)


def escavadeira(name, x, z, m, yaw=0.0, y=0.0):
    """Escavadeira hidráulica na bancada: esteira, giro, cabine e lança."""
    co, si = math.cos(yaw), math.sin(yaw)

    def pt(a, t, h):
        return (x + co * a - si * t, y + h, z + si * a + co * t)

    p = [
        cube(f"{name}Est0", (0.34, 0.07, 0.09), pt(0, -0.11, 0.035), m["black"], 0.012, rot=(0, yaw, 0)),
        cube(f"{name}Est1", (0.34, 0.07, 0.09), pt(0, 0.11, 0.035), m["black"], 0.012, rot=(0, yaw, 0)),
        cube(f"{name}Giro", (0.26, 0.06, 0.24), pt(-0.02, 0, 0.1), m["steel_y"], 0.015, rot=(0, yaw, 0)),
        cube(f"{name}Cabine", (0.13, 0.13, 0.14), pt(-0.05, -0.05, 0.19), m["steel_y"], 0.015, rot=(0, yaw, 0)),
        cube(f"{name}Vidro", (0.02, 0.09, 0.11), pt(0.02, -0.05, 0.2), m["glass"], 0.0, rot=(0, yaw, 0)),
        cube(f"{name}Contra", (0.09, 0.11, 0.2), pt(-0.16, 0, 0.16), m["black"], 0.015, rot=(0, yaw, 0)),
        barra(f"{name}Lanca", pt(0.05, 0.05, 0.16), pt(0.3, 0.05, 0.34), 0.05, 0.06, m["steel_y"]),
        barra(f"{name}Braco", pt(0.3, 0.05, 0.34), pt(0.46, 0.05, 0.12), 0.045, 0.05, m["steel_y"]),
        cube(f"{name}Concha", (0.12, 0.1, 0.14), pt(0.5, 0.05, 0.08), m["steel_rust"], 0.012, rot=(0, yaw, 0)),
    ]
    return join(name, p)


def escavadeira_cabo(name, x, z, m, yaw=0.0, y=0.0):
    """Escavadeira a cabo (shovel elétrica) — a máquina azul da foto da cava.

    É o equipamento mais antigo e mais reconhecível de uma mina a céu aberto:
    casa de máquinas alta sobre esteiras curtas, lança treliçada fixa e a
    caçamba pendurada no cabo, não num braço hidráulico. Uma máquina em cor
    diferente também quebra o campo amarelo dos caminhões.
    """
    co, si = math.cos(yaw), math.sin(yaw)

    def pt(a, t, h):
        return (x + co * a - si * t, y + h, z + si * a + co * t)

    p = [
        cube(f"{name}Est0", (0.34, 0.09, 0.1), pt(0, -0.14, 0.045), m["black"], 0.012, rot=(0, yaw, 0)),
        cube(f"{name}Est1", (0.34, 0.09, 0.1), pt(0, 0.14, 0.045), m["black"], 0.012, rot=(0, yaw, 0)),
        cube(f"{name}Casa", (0.34, 0.3, 0.3), pt(-0.04, 0, 0.24), m["shovel_b"], 0.02, rot=(0, yaw, 0)),
        cube(f"{name}Teto", (0.36, 0.04, 0.32), pt(-0.04, 0, 0.41), m["shovel_b"], 0.01, rot=(0, yaw, 0)),
        cube(f"{name}Vidro", (0.02, 0.09, 0.12), pt(0.14, -0.1, 0.3), m["glass"], 0.0, rot=(0, yaw, 0)),
        # Lança fixa, treliçada, e o cabo de içamento saindo do topo da casa.
        barra(f"{name}Lanca", pt(0.1, 0, 0.2), pt(0.62, 0, 0.62), 0.045, 0.05, m["shovel_b"]),
        barra(f"{name}LancaD", pt(0.14, 0, 0.16), pt(0.6, 0, 0.56), 0.02, 0.02, m["steel_rust"]),
        barra(f"{name}Cabo", pt(0.62, 0, 0.6), pt(0.66, 0, 0.24), 0.012, 0.012, m["black"]),
        # Braço da caçamba atravessa a lança, como na máquina real.
        barra(f"{name}Braco", pt(0.24, 0, 0.3), pt(0.7, 0, 0.18), 0.035, 0.035, m["steel_rust"]),
        cube(f"{name}Cacamba", (0.2, 0.18, 0.22), pt(0.76, 0, 0.14), m["steel_rust"], 0.015, rot=(0, yaw, 0)),
    ]
    return join(name, p)


def caminhao_fora(name, x, z, m, yaw=0.0, y=0.0, carregado=True):
    """Fora-de-estrada parado: caçamba alta, cabine no canto, roda enorme."""
    co, si = math.cos(yaw), math.sin(yaw)

    def pt(a, t, h):
        return (x + co * a - si * t, y + h, z + si * a + co * t)

    p = [
        cube(f"{name}Chassi", (0.52, 0.07, 0.3), pt(0, 0, 0.14), m["black"], 0.012, rot=(0, yaw, 0)),
        cube(f"{name}Cacamba", (0.4, 0.14, 0.32), pt(-0.05, 0, 0.25), m["cat"], 0.02, rot=(0, yaw, 0)),
        cube(f"{name}Cabine", (0.12, 0.12, 0.13), pt(0.21, -0.07, 0.26), m["cat"], 0.015, rot=(0, yaw, 0)),
        cube(f"{name}Vidro", (0.02, 0.07, 0.1), pt(0.28, -0.07, 0.28), m["glass"], 0.0, rot=(0, yaw, 0)),
    ]
    if carregado:
        p.append(cube(f"{name}Carga", (0.34, 0.06, 0.26), pt(-0.05, 0, 0.34), m["ore"], 0.02, rot=(0, yaw, 0)))
    k = 0
    for a in (0.18, -0.16):
        for t in (-0.17, 0.17):
            p.append(cyl(f"{name}R{k}", 0.11, 0.07, pt(a, t, 0.11), m["black"], 14, rot=(math.pi / 2, yaw, 0)))
            k += 1
    return join(name, p)


def perfuratriz(name, x, z, m, yaw=0.0, y=0.0):
    """Perfuratriz de banco: a máquina que abre os furos do desmonte."""
    co, si = math.cos(yaw), math.sin(yaw)

    def pt(a, t, h):
        return (x + co * a - si * t, y + h, z + si * a + co * t)

    p = [
        cube(f"{name}Est", (0.24, 0.06, 0.19), pt(0, 0, 0.03), m["black"], 0.01, rot=(0, yaw, 0)),
        cube(f"{name}Corpo", (0.2, 0.13, 0.16), pt(-0.02, 0, 0.12), m["steel_y"], 0.015, rot=(0, yaw, 0)),
        cube(f"{name}Mastro", (0.05, 0.34, 0.05), pt(0.11, 0, 0.24), m["steel_rust"], 0.008, rot=(0, yaw, 0)),
        cyl(f"{name}Haste", 0.012, 0.3, pt(0.11, 0, 0.2), m["steel"], 8),
    ]
    return join(name, p)


def trator_esteira(name, x, z, m, yaw=0.0, y=0.0):
    """Trator de esteira espalhando estéril no topo da pilha."""
    co, si = math.cos(yaw), math.sin(yaw)

    def pt(a, t, h):
        return (x + co * a - si * t, y + h, z + si * a + co * t)

    p = [
        cube(f"{name}Est0", (0.26, 0.07, 0.07), pt(0, -0.09, 0.035), m["black"], 0.01, rot=(0, yaw, 0)),
        cube(f"{name}Est1", (0.26, 0.07, 0.07), pt(0, 0.09, 0.035), m["black"], 0.01, rot=(0, yaw, 0)),
        cube(f"{name}Corpo", (0.2, 0.09, 0.16), pt(-0.02, 0, 0.11), m["cat"], 0.015, rot=(0, yaw, 0)),
        cube(f"{name}Cabine", (0.1, 0.1, 0.12), pt(-0.06, 0, 0.2), m["cat"], 0.012, rot=(0, yaw, 0)),
        cube(f"{name}Lamina", (0.03, 0.13, 0.3), pt(0.19, 0, 0.09), m["steel_rust"], 0.008, rot=(0, yaw, 0)),
        barra(f"{name}Braco", pt(0.02, -0.1, 0.08), pt(0.17, -0.1, 0.06), 0.02, 0.02, m["steel_rust"]),
        barra(f"{name}Braco2", pt(0.02, 0.1, 0.08), pt(0.17, 0.1, 0.06), 0.02, 0.02, m["steel_rust"]),
    ]
    return join(name, p)


# ---------------------------------------------------------------------------
# Conjuntos
# ---------------------------------------------------------------------------


def cava_ferro(m):
    cx, cz = CAVA
    lathe_solid("CavaRocha", PERFIL_ROCHA, 44, (cx, 0.0, cz), m["rock"], displace=0.035, noise=2.2)
    # A metade de baixo é o corpo de minério: é o motivo da cava existir.
    lathe_solid("CavaMinerio", PERFIL_MINERIO, 44, (cx, 0.0, cz), m["ore"], displace=0.022, noise=1.8)
    # Leira de segurança na crista, o cordão que impede alguém de cair.
    lathe_solid("CavaLeira", [(1.16, 0.60), (1.22, 0.69), (1.28, 0.61)], 40, (cx, 0.0, cz), m["dirt"], displace=0.02, noise=1.4)
    rampa_helicoidal("CavaRampa", cx, cz, m)
    acesso_externo("CavaAcesso", cx, cz, m)
    # Sump: a água que escorre para o ponto mais baixo. Fica logo acima da
    # praça (0,15) para não brigar com o piso.
    cyl("CavaSump", 0.2, 0.02, (cx, 0.125, cz), m["puddle"], 22)
    cyl("CavaBomba", 0.045, 0.1, (cx + 0.15, 0.17, cz + 0.08), m["steel_rust"], 10)
    # Frente de lavra na bancada de minério, e o desmonte no banco de cima.
    escavadeira("CavaEscav", cx + 0.62, cz + 0.28, m, yaw=2.5, y=0.28)
    caminhao_fora("CavaCaminhao", cx + 0.18, cz - 0.5, m, yaw=1.1, y=0.15)
    perfuratriz("CavaPerf", cx - 0.85, cz + 0.62, m, yaw=-0.7, y=0.44)
    # Fase 12 — a foto da cava tem vários equipamentos em bancadas diferentes,
    # e é essa sobreposição de níveis que faz a cava parecer funda. Uma
    # escavadeira a cabo na berma do banco 2, um caminhão subindo a rampa e
    # outro esperando na crista.
    escavadeira_cabo("CavaShovel", cx - 0.55, cz - 0.42, m, yaw=0.66, y=0.28)
    caminhao_fora("CavaCaminhao2", cx - 0.44, cz - 0.71, m, yaw=5.74, y=0.43, carregado=False)
    caminhao_fora("CavaCaminhao3", cx + 0.42, cz + 1.07, m, yaw=2.77, y=0.62)
    trator_esteira("CavaDozer", cx - 1.0, cz + 0.5, m, yaw=1.4, y=0.62)


def pilha_esteril(m):
    """Pilha de estéril: topo plano e leira na borda de basculamento.

    O topo plano é o detalhe que a distingue da pilha de minério, que é
    cônica: estéril é despejado por caminhão e espalhado por trator, então a
    praça de basculamento fica horizontal.
    """
    x, z = ESTERIL
    lathe_solid(
        "EsterilPilha",
        [
            (1.4, 0.0),
            (1.24, 0.3),
            (1.16, 0.32),   # banqueta intermediária
            (1.02, 0.56),
            (0.94, 0.58),
            (0.8, 0.76),
            (0.0, 0.78),    # praça de basculamento
        ],
        36,
        (x, 0.0, z),
        m["dirt"],
        displace=0.05,
        noise=2.0,
    )
    lathe_solid("EsterilLeira", [(0.7, 0.77), (0.76, 0.85), (0.82, 0.78)], 32, (x, 0.0, z), m["dirt"], displace=0.02, noise=1.3)
    trator_esteira("EsterilDozer", x + 0.28, z - 0.1, m, yaw=0.6, y=0.78)
    caminhao_fora("EsterilCaminhao", x - 0.3, z + 0.25, m, yaw=2.2, y=0.78, carregado=False)
    # Rampa de subida da pilha, no lado da cava.
    p = []
    for i in range(5):
        t0, t1 = i / 5, (i + 1) / 5
        p.append(
            barra(
                f"EsterilRampa{i}",
                (x - (1.55 + 0.0) + t0 * 0.85, 0.02 + t0 * 0.76, z + 0.35 - t0 * 0.1),
                (x - (1.55 + 0.0) + t1 * 0.85, 0.02 + t1 * 0.76, z + 0.35 - t1 * 0.1),
                0.34,
                0.04,
                m["dirt"],
            )
        )
    join("EsterilRampa", p)


def bacia_decantacao(m):
    """Bacia de decantação: dique de terra, lâmina barrenta e extravasor."""
    x, z = BACIA
    lathe_solid(
        "BaciaDique",
        [
            (1.2, 0.0),
            (1.06, 0.2),
            (0.98, 0.22),   # crista do dique
            (0.92, 0.12),   # talude interno
            (0.0, 0.12),    # fundo, acima da grama
        ],
        34,
        (x, 0.0, z),
        m["dirt"],
        displace=0.03,
        noise=1.6,
    )
    cyl("BaciaAgua", 0.9, 0.02, (x, 0.145, z), m["tailings"], 30)
    # Extravasor: torre de saída e a tubulação que atravessa o dique.
    cyl("BaciaVertedor", 0.07, 0.24, (x + 0.55, 0.2, z - 0.4), m["conc_dirty"], 12)
    barra("BaciaTubo", (x + 0.55, 0.14, z - 0.4), (x + 1.35, 0.08, z - 0.62), 0.07, 0.07, m["conc_dirty"])
    # Bomba de recirculação: água de bacia volta para a usina, não vai ao rio.
    cube("BaciaCasaBomba", (0.24, 0.2, 0.2), (x - 0.95, 0.22, z + 0.35), m["conc_dirty"], 0.012)
    barra("BaciaRecalque", (x - 0.9, 0.2, z + 0.3), (x - 0.2, 0.17, z + 0.12), 0.045, 0.045, m["steel_rust"])
    # Régua de nível: detalhe pequeno que só existe em bacia operando.
    cube("BaciaRegua", (0.02, 0.3, 0.05), (x - 0.05, 0.25, z + 0.78), m["white"], 0.0)


def usina_beneficiamento(m):
    """Usina compacta encaixada no britador que já existia.

    Não cabia uma usina inteira no quadrante da mina — a alça, o barracão, a
    oficina e a cava de carvão já ocupam tudo. Então a usina é o mínimo que
    faz o conjunto ler como tratamento e não como um britador solto: uma torre
    de peneiramento com deck inclinado e chutes, e um espessador.
    """
    # Peneiramento, a jusante do britador.
    px, pz = -20.6, -9.05
    p = []
    for i, (dx, dz) in enumerate(((-0.24, -0.24), (0.24, -0.24), (-0.24, 0.24), (0.24, 0.24))):
        p.append(cube(f"PeneiraPe{i}", (0.055, 1.0, 0.055), (px + dx, 0.5, pz + dz), m["steel_rust"], 0.006))
    p.append(cube("PeneiraPiso", (0.62, 0.05, 0.62), (px, 1.02, pz), m["steel_rust"], 0.008))
    p.append(cube("PeneiraCaixa", (0.52, 0.3, 0.46), (px, 1.2, pz), m["steel_y"], 0.015))
    # Deck inclinado: é o que faz a peneira parecer peneira.
    p.append(cube("PeneiraDeck", (0.5, 0.03, 0.42), (px, 1.31, pz), m["steel"], 0.004, rot=(0, 0, 0.28)))
    p.append(barra("PeneiraChuteA", (px - 0.2, 1.1, pz + 0.2), (px - 0.42, 0.68, pz + 0.42), 0.13, 0.13, m["steel_rust"]))
    p.append(barra("PeneiraChuteB", (px + 0.2, 1.1, pz - 0.2), (px + 0.4, 0.7, pz - 0.34), 0.11, 0.11, m["steel_rust"]))
    # Correia curta ligando o britador à peneira: sem ela são duas caixas soltas.
    p.append(barra("PeneiraCorreia", (-20.75, 0.98, -8.35), (px + 0.05, 1.06, pz - 0.3), 0.2, 0.05, m["belt"]))
    join("PeneiraUsina", p)

    # Espessador: recupera a água do processo. O tanque raso com a ponte de
    # raspagem atravessando o diâmetro é a silhueta mais reconhecível de uma
    # usina de tratamento.
    ex, ez = -22.2, -7.9
    q = [
        cyl("EspessadorTanque", 0.36, 0.26, (ex, 0.13, ez), m["conc_dirty"], 26),
        cyl("EspessadorAgua", 0.33, 0.02, (ex, 0.25, ez), m["tailings"], 26),
        cyl("EspessadorColuna", 0.05, 0.42, (ex, 0.29, ez), m["steel_rust"], 10),
        barra("EspessadorPonte", (ex - 0.38, 0.32, ez), (ex + 0.38, 0.32, ez), 0.1, 0.05, m["steel_rust"]),
        cube("EspessadorGuarda", (0.78, 0.06, 0.02), (ex, 0.37, ez + 0.05), m["steel"], 0.0),
    ]
    join("Espessador", q)


def estrada_cava(m):
    """Estrada de serviço da cava até o britador — sem ela o minério não anda.

    A rota passa a oeste da alça: no ponto mais próximo fica a 1,5 do eixo da
    via, então não cruza trilho em nível.
    """
    pontos = [
        (-20.05, -10.15),
        (-20.45, -9.7),
        (-20.6, -9.2),
        (-20.72, -8.6),
    ]
    p = []
    for i in range(len(pontos) - 1):
        (x0, z0), (x1, z1) = pontos[i], pontos[i + 1]
        p.append(barra(f"EstradaCava{i}", (x0, 0.085, z0), (x1, 0.085, z1), 0.46, 0.03, m["dirt"]))
    # Ligação da estrada com a pilha de estéril, pelo sul.
    ramal = [(-20.05, -10.15), (-19.2, -11.4), (-18.6, -12.35), (-17.9, -12.6)]
    for i in range(len(ramal) - 1):
        (x0, z0), (x1, z1) = ramal[i], ramal[i + 1]
        p.append(barra(f"EstradaEsteril{i}", (x0, 0.085, z0), (x1, 0.085, z1), 0.42, 0.03, m["dirt"]))
    join("EstradaCava", p)
    caminhao_fora("CaminhaoServico", -20.5, -9.45, m, yaw=1.9, y=0.1)


def build_pit(m):
    cava_ferro(m)
    pilha_esteril(m)
    bacia_decantacao(m)
    usina_beneficiamento(m)
    estrada_cava(m)
