"""Fase 3 — construções com estrutura, e as instalações que faltavam.

O problema que esta fase resolve: os prédios da maquete eram caixas com uma
tampa em cima. Uma caixa não lê como galpão industrial, lê como bloco de
montar. O que faz ler são quatro coisas, nesta ordem de importância:

1. **telhado com caimento e cumeeira** (nada industrial tem telhado plano);
2. **pilares aparentes** por fora da parede, ritmados;
3. **calha e condutor** na linha do beiral;
4. **lanternim** (a saliência ventilada em cima da cumeeira).

Além dos galpões, esta fase acrescenta o que existe em qualquer sítio
industrial e faltava por completo: subestação, tancagem de diesel com bacia de
contenção, pipe rack e torres de iluminação de pátio.
"""

from __future__ import annotations

import math

from .primitives import cube, cyl, ico, join
from .process import barra

# ---------------------------------------------------------------------------
# Galpão com estrutura
# ---------------------------------------------------------------------------


def _telhado(name, d, w, h_ombro, h_cume, cx, cz, yaw, mat, beiral=0.12):
    """As duas águas do telhado, inclinadas em torno da cumeeira."""
    rise = h_cume - h_ombro
    meia = w * 0.5
    incl = math.atan2(rise, meia)
    aba = math.hypot(meia, rise) + beiral
    y = (h_ombro + h_cume) * 0.5 - 0.01
    partes = []
    for i, lado in enumerate((1.0, -1.0)):
        # Deslocamento lateral do centro da água, já no plano inclinado.
        lat = lado * (meia * 0.5 + beiral * 0.35)
        px = cx - math.sin(yaw) * lat
        pz = cz + math.cos(yaw) * lat
        partes.append(
            cube(f"{name}Agua{i}", (d + beiral * 2, 0.05, aba), (px, y, pz), mat, 0.0, rot=(-lado * incl, yaw, 0))
        )
    return partes


def galpao(name, cx, cz, d, w, h_ombro, h_cume, m, yaw=0.0, vaos=4, porta=True, mat_telha=None, piso=0.3):
    """Galpão de estrutura metálica: pilares, duas águas, calha e lanternim.

    `d` é o comprimento (eixo do galpão) e `w` a largura. `yaw` gira no plano.
    """
    telha = mat_telha or m["roof"]
    meia = w * 0.5
    ao = (math.cos(yaw), math.sin(yaw))
    tr = (-math.sin(yaw), math.cos(yaw))

    def pt(a, t, y):
        return (cx + ao[0] * a + tr[0] * t, y, cz + ao[1] * a + tr[1] * t)

    partes = []
    partes.append(cube(f"{name}Piso", (d + piso, 0.09, w + piso), pt(0, 0, 0.045), m["conc_dirty"], 0.01, rot=(0, yaw, 0)))
    # Paredes: painel nervurado, não bloco liso.
    for i, t in enumerate((-meia, meia)):
        partes.append(cube(f"{name}Par{i}", (d, h_ombro, 0.07), pt(0, t, h_ombro * 0.5), telha, 0.01, rot=(0, yaw, 0)))
    for i, a in enumerate((-d * 0.5, d * 0.5)):
        partes.append(cube(f"{name}Emp{i}", (0.07, h_ombro, w), pt(a, 0, h_ombro * 0.5), telha, 0.01, rot=(0, yaw, 0)))
        # Frontão triangular aproximado por um bloco menor.
        partes.append(
            cube(f"{name}Fron{i}", (0.07, h_cume - h_ombro, w * 0.52), pt(a, 0, (h_ombro + h_cume) * 0.5), telha, 0.0, rot=(0, yaw, 0))
        )

    # Pilares por fora da parede: é o que dá ritmo e escala à fachada.
    for i in range(vaos + 1):
        a = -d * 0.5 + d * i / vaos
        for k, t in enumerate((-meia - 0.05, meia + 0.05)):
            partes.append(barra(f"{name}Pil{i}_{k}", pt(a, t, 0.0), pt(a, t, h_ombro + 0.03), 0.1, 0.1, m["conc_dirty"]))

    partes.extend(_telhado(name, d, w, h_ombro, h_cume, cx, cz, yaw, telha))
    partes.append(cube(f"{name}Cume", (d + 0.16, 0.07, 0.16), pt(0, 0, h_cume + 0.02), m["steel"], 0.0, rot=(0, yaw, 0)))

    # Calha no beiral e dois condutores descendo.
    for i, t in enumerate((-meia - 0.07, meia + 0.07)):
        partes.append(cyl(f"{name}Calha{i}", 0.038, d, pt(0, t, h_ombro + 0.02), m["steel"], 8, rot=(0, yaw, math.pi / 2)))
        for k, a in enumerate((-d * 0.42, d * 0.42)):
            partes.append(barra(f"{name}Cond{i}_{k}", pt(a, t, 0.0), pt(a, t, h_ombro + 0.02), 0.04, 0.04, m["steel"]))

    # Lanternim: a saliência ventilada que todo galpão de verdade tem.
    partes.append(cube(f"{name}Lant", (d * 0.55, 0.14, w * 0.2), pt(0, 0, h_cume + 0.09), telha, 0.0, rot=(0, yaw, 0)))
    partes.append(cube(f"{name}LantTeto", (d * 0.6, 0.04, w * 0.26), pt(0, 0, h_cume + 0.17), m["steel"], 0.0, rot=(0, yaw, 0)))
    for i in range(3):
        a = (i - 1) * d * 0.22
        partes.append(cyl(f"{name}Exaust{i}", 0.05, 0.1, pt(a, 0, h_cume + 0.24), m["steel"], 8))

    if porta:
        pa = d * 0.5 + 0.02
        partes.append(cube(f"{name}Porta", (0.05, h_ombro * 0.72, w * 0.44), pt(pa, 0, h_ombro * 0.36), m["black"], 0.0, rot=(0, yaw, 0)))
        partes.append(cube(f"{name}PortaBat", (0.05, h_ombro * 0.76, w * 0.5), pt(pa - 0.02, 0, h_ombro * 0.38), m["steel_y"], 0.0, rot=(0, yaw, 0)))
        # Doca de carga: plataforma na altura da carroceria.
        partes.append(cube(f"{name}Doca", (0.5, 0.34, w * 0.6), pt(pa + 0.27, 0, 0.17), m["conc_dirty"], 0.01, rot=(0, yaw, 0)))
    return join(name, partes)


# ---------------------------------------------------------------------------
# Subestação
# ---------------------------------------------------------------------------


def subestacao(name, cx, cz, m, yaw=0.0):
    ao = (math.cos(yaw), math.sin(yaw))
    tr = (-math.sin(yaw), math.cos(yaw))

    def pt(a, t, y):
        return (cx + ao[0] * a + tr[0] * t, y, cz + ao[1] * a + tr[1] * t)

    partes = [cube(f"{name}Base", (2.0, 0.08, 1.5), pt(0, 0, 0.04), m["conc_dirty"], 0.01, rot=(0, yaw, 0))]
    # Dois transformadores com aletas de radiador e buchas.
    for i, a in enumerate((-0.5, 0.42)):
        partes.append(cube(f"{name}Trafo{i}", (0.5, 0.42, 0.42), pt(a, -0.2, 0.29), m["steel"], 0.02, rot=(0, yaw, 0)))
        for k in range(4):
            partes.append(
                cube(f"{name}Alet{i}_{k}", (0.03, 0.32, 0.5), pt(a - 0.18 + k * 0.12, -0.2, 0.28), m["steel"], 0.0, rot=(0, yaw, 0))
            )
        for k, t in enumerate((-0.34, -0.2, -0.06)):
            partes.append(cyl(f"{name}Bucha{i}_{k}", 0.035, 0.2, pt(a, t, 0.6), m["white"], 8))
    # Pórtico de barramento.
    for i, a in enumerate((-0.85, 0.85)):
        partes.append(barra(f"{name}Post{i}", pt(a, 0.5, 0.08), pt(a, 0.5, 1.05), 0.07, 0.07, m["steel"]))
    partes.append(barra(f"{name}Barra", pt(-0.85, 0.5, 1.02), pt(0.85, 0.5, 1.02), 0.05, 0.05, m["steel"]))
    for i in range(3):
        a = -0.5 + i * 0.5
        partes.append(cyl(f"{name}Isol{i}", 0.03, 0.22, pt(a, 0.5, 0.88), m["white"], 8))
    partes.append(cube(f"{name}Painel", (0.55, 0.5, 0.28), pt(0.0, 0.55, 0.29), m["white"], 0.02, rot=(0, yaw, 0)))
    return join(name, partes)


# ---------------------------------------------------------------------------
# Tancagem de diesel com bacia de contenção
# ---------------------------------------------------------------------------


def tancagem(name, cx, cz, m, yaw=0.0):
    partes = []
    # Bacia de contenção: sem ela a instalação não passa em nenhuma vistoria,
    # e é justamente a mureta que dá a leitura de "isso aqui é regulado".
    partes.append(cube(f"{name}Piso", (2.4, 0.07, 1.7), (cx, 0.035, cz), m["conc_dirty"], 0.01, rot=(0, yaw, 0)))
    for i, (dx, dz, sx, sz) in enumerate(((0, -0.85, 2.4, 0.09), (0, 0.85, 2.4, 0.09), (-1.2, 0, 0.09, 1.7), (1.2, 0, 0.09, 1.7))):
        partes.append(cube(f"{name}Mureta{i}", (sx, 0.26, sz), (cx + dx, 0.13, cz + dz), m["conc_dirty"], 0.01, rot=(0, yaw, 0)))
    for i, dx in enumerate((-0.72, 0.0, 0.72)):
        partes.append(cyl(f"{name}Tanque{i}", 0.32, 0.85, (cx + dx, 0.5, cz), m["tank"], 18))
        partes.append(cyl(f"{name}Topo{i}", 0.33, 0.14, (cx + dx, 0.99, cz), m["tank"], 18, r2=0.1))
        # Anéis de reforço: a costura horizontal do costado.
        for k, yy in enumerate((0.3, 0.62)):
            partes.append(cyl(f"{name}Anel{i}_{k}", 0.335, 0.03, (cx + dx, yy, cz), m["steel"], 18))
    # Escada e passadiço no topo.
    partes.append(barra(f"{name}Escada", (cx + 1.1, 0.1, cz - 0.6), (cx + 0.95, 1.0, cz - 0.1), 0.22, 0.04, m["steel_y"]))
    partes.append(barra(f"{name}Passad", (cx - 0.85, 1.05, cz), (cx + 0.95, 1.05, cz), 0.24, 0.04, m["steel_y"]))
    # Tubulação até a mureta.
    partes.append(cyl(f"{name}Tubo", 0.05, 2.1, (cx, 0.34, cz + 0.6), m["steel"], 8, rot=(0, 0, math.pi / 2)))
    return join(name, partes)


# ---------------------------------------------------------------------------
# Pipe rack
# ---------------------------------------------------------------------------


def pipe_rack(name, p0, p1, m, n_trest=5, largura=0.42):
    """Tubos sobre cavaletes. p0/p1 são (x, z) no chão."""
    x0, z0 = p0
    x1, z1 = p1
    yaw = math.atan2(z1 - z0, x1 - x0)
    tr = (-math.sin(yaw), math.cos(yaw))
    partes = []
    y1, y2 = 0.52, 0.72
    for i in range(n_trest):
        t = i / (n_trest - 1)
        px = x0 + (x1 - x0) * t
        pz = z0 + (z1 - z0) * t
        for k, lat in enumerate((-largura * 0.5, largura * 0.5)):
            a = (px + tr[0] * lat, 0.0, pz + tr[1] * lat)
            b = (a[0], y2 + 0.06, a[2])
            partes.append(barra(f"{name}Pe{i}_{k}", a, b, 0.06, 0.06, m["steel"]))
        for k, yy in enumerate((y1, y2)):
            e0 = (px + tr[0] * -largura * 0.5, yy, pz + tr[1] * -largura * 0.5)
            e1 = (px + tr[0] * largura * 0.5, yy, pz + tr[1] * largura * 0.5)
            partes.append(barra(f"{name}Trav{i}_{k}", e0, e1, 0.05, 0.05, m["steel"]))
    a0 = (x0, 0, z0)
    a1 = (x1, 0, z1)
    raios = ((0.06, -0.13, y1 + 0.08), (0.045, 0.02, y1 + 0.07), (0.05, 0.14, y1 + 0.07), (0.07, -0.05, y2 + 0.09))
    for i, (r, lat, yy) in enumerate(raios):
        q0 = (a0[0] + tr[0] * lat, yy, a0[2] + tr[1] * lat)
        q1 = (a1[0] + tr[0] * lat, yy, a1[2] + tr[1] * lat)
        mat = m["steel"] if i % 2 == 0 else m["steel_rust"]
        partes.append(barra(f"{name}Tubo{i}", q0, q1, r * 2, r * 2, mat))
    return join(name, partes)


# ---------------------------------------------------------------------------
# Torre de iluminação de pátio (high mast)
# ---------------------------------------------------------------------------


def torre_luz(name, cx, cz, m, altura=2.6, lado=0.13):
    """Mastro treliçado com conjunto de refletores.

    Chamadas sempre com nome `MastroLuz*`: o `MaqueteBlender.tsx` esconde tudo
    que casa com /^torre/i, e o teste é por prefixo — "TorreLuz" cairia junto.
    """
    partes = []
    pes = [(-lado, -lado), (-lado, lado), (lado, -lado), (lado, lado)]
    for i, (dx, dz) in enumerate(pes):
        partes.append(barra(f"{name}Perna{i}", (cx + dx, 0.0, cz + dz), (cx + dx * 0.25, altura, cz + dz * 0.25), 0.05, 0.05, m["steel"]))
    n = 6
    for i in range(n):
        y0 = altura * i / n
        y1 = altura * (i + 1) / n
        k0 = 1.0 - 0.75 * (i / n)
        k1 = 1.0 - 0.75 * ((i + 1) / n)
        for k in range(4):
            ax, az = pes[k]
            bx, bz = pes[(k + 1) % 4]
            partes.append(
                barra(
                    f"{name}D{i}_{k}",
                    (cx + ax * k0, y0, cz + az * k0),
                    (cx + bx * k1, y1, cz + bz * k1),
                    0.03,
                    0.03,
                    m["steel"],
                )
            )
    partes.append(cube(f"{name}Plat", (0.42, 0.05, 0.42), (cx, altura + 0.02, cz), m["steel_y"], 0.0))
    for i, (dx, dz) in enumerate(((-0.13, -0.13), (0.13, -0.13), (-0.13, 0.13), (0.13, 0.13))):
        partes.append(cube(f"{name}Ref{i}", (0.14, 0.06, 0.1), (cx + dx, altura + 0.11, cz + dz), m["black"], 0.0, rot=(-0.5, 0, 0)))
        partes.append(cube(f"{name}Lamp{i}", (0.12, 0.02, 0.08), (cx + dx, altura + 0.08, cz + dz + 0.03), m["amber"], 0.0, rot=(-0.5, 0, 0)))
    return join(name, partes)


# ---------------------------------------------------------------------------
# Montagem
# ---------------------------------------------------------------------------


def build_structures(m):
    """Instalações da fase 3. Os galpões substituem as caixas antigas."""
    # Mina
    # O barracao herdou as coordenadas da caixa que ele substituiu, e a caixa
    # estava errada: ele avancava 1,17 m alem de x = -22,7, onde a laje do
    # tabuleiro termina e comeca a malha do relevo distante. Nao era folga de
    # borda: era um galpao pendurado no morro. Nenhum teste via, porque o
    # pre-voo so ganhou a checagem de borda agora.
    #
    # Recuar nao resolvia. Uma varredura do tabuleiro inteiro contra as caixas
    # do pre-voo nao achou UMA posicao livre para ele no canto da mina — nem
    # encolhido para 0,8 de comprimento. O canto so o comportava porque metade
    # dele estava fora do tabuleiro; entre a saia da cava de ferro, o poco de
    # carvao, a oficina e a usina de tratamento nao sobra vao para um galpao.
    #
    # Foi para a ponta leste da usina que a fase 19 construiu, onde ha 1,06 de
    # folga para o vizinho mais proximo e 6,22 para o eixo da via. E o lugar
    # certo tambem pela historia que a maquete conta: no fim da linha de
    # beneficiamento, o galpao e o almoxarifado — o produto sai da peneira e
    # dos silos e passa por ele antes do terminal.
    galpao("Barracao", -10.0, -15.0, 2.3, 1.65, 1.0, 1.36, m, vaos=5, mat_telha=m["roof_r"], piso=0.0)
    galpao("MinaOficina", -21.8, -6.8, 1.35, 1.05, 0.62, 0.86, m, vaos=3, piso=0.0)
    subestacao("SubestMina", -12.2, -10.4, m, yaw=0.25)
    tancagem("TanqueMina", -9.6, -8.2, m, yaw=0.18)
    pipe_rack("PipeRackMina", (-10.9, -8.75), (-12.8, -9.35), m)
    torre_luz("MastroLuzMina", -11.4, -12.2, m, altura=2.7)

    # Porto
    galpao("ArmazemP", 11.9, 2.9, 2.4, 3.2, 1.05, 1.48, m, vaos=5)
    galpao("GalpaoP", 12.0, 11.2, 1.6, 2.2, 0.78, 1.06, m, vaos=3, mat_telha=m["roof_r"])
    torre_luz("MastroLuzPorto0", 12.6, 13.6, m, altura=2.8)
    torre_luz("MastroLuzPorto1", 17.35, 4.2, m, altura=2.6)
