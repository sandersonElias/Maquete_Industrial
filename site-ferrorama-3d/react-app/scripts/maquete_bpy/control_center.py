"""Fase 14 — a central de controle vira um centro logístico de verdade.

O que existia era `build_scada`: uma laje de 3,2 × 2,2 com uma mesa, quatro
monitores, uma caneca e uma cadeira. Sem parede, sem teto, sem entorno — uma
sala de controle ao ar livre no meio do gramado. De qualquer ângulo lia como
móvel flutuando, e era o pior objeto do tabuleiro.

O modelo de referência é um campus industrial em plataformas: um patamar alto
com baias de frente aberta (cada uma com sua placa azul no lintel), um patamar
baixo com o pátio, e na frente do pátio três portarias numeradas com cancela,
guarita de segurança, estacionamento demarcado e meio-fio hachurado. É um
arranjo que se explica sozinho — dá para ler o fluxo de pessoas e de carga só
olhando — e é exatamente o que faltava aqui.

Foi para o quadrante noroeste (`x -21,8 → -10,6`, `z 6,6 → 15,6`), que é a
maior área vazia que sobrou depois do terminal logístico e não tem via nenhuma
passando: a alça da mina fica toda em z negativo e o oval não passa de x=-8,55.

Decisões de forma que vêm das duas fotos:

* **Baia de frente aberta.** É o que deixa ver o interior sem cortar o prédio,
  e é o motivo de a sala de controle finalmente ter onde morar: ela é uma das
  baias, com painel de vídeo no fundo, visível de fora.
* **Placa azul no lintel de cada baia e de cada portaria.** Sem texto — não há
  como gravar letra sem textura, e uma placa azul com tarja branca lê como
  sinalização a qualquer distância.
* **Meio-fio hachurado.** O amarelo e preto alternado no bordo da plataforma é
  o que informa desnível e é a assinatura visual do modelo de referência.
* **Cobertura de estacionamento e placa solar.** Mesma decisão do terminal
  logístico da fase 13, pelo mesmo motivo.

Convenção de coordenadas e de rotação: igual ao resto (ver `process.py`).
"""

from __future__ import annotations

import math

from .details import pessoa
from .logistics import carro, muro
from .materials import pbr
from .primitives import cube, cyl, join
from .process import barra

# Retângulo do campus.
OESTE, LESTE = -21.8, -10.6
SUL, NORTE = 6.6, 15.6
# Pátio e plataforma alta.
Y_PATIO = 0.09
Y_PLATA = 0.42
Z_PLATA = 11.5  # onde o patamar alto começa


def _base(x, z, yaw, y0=0.0):
    co, si = math.cos(yaw), math.sin(yaw)

    def pt(a, t, h):
        return (x + co * a - si * t, y0 + h, z + si * a + co * t)

    return pt


def placa_azul(name, x, y, z, m, larg=0.9, alt=0.16, yaw=0.0):
    """Placa de sinalização: azul com tarja branca.

    Sem letra de propósito: gravar texto exigiria uma textura por placa, e a
    maquete inteira roda sem atlas. A tarja resolve — o que precisa ser lido a
    dois metros é "aqui tem placa", não o que está escrito nela.
    """
    p = [
        cube(f"{name}F", (larg, alt, 0.02), (x, y, z), m["sign_b"], 0.006, rot=(0, yaw, 0)),
        cube(f"{name}T", (larg * 0.76, alt * 0.22, 0.026), (x, y, z), m["white"], 0.0, rot=(0, yaw, 0)),
    ]
    return join(name, p)


def meio_fio(name, x, z, comp, m, n=None, yaw=0.0, y=0.0, h=0.07):
    """Meio-fio hachurado amarelo e preto — informa desnível, e é a assinatura
    visual do modelo de referência."""
    n = n or max(4, int(comp / 0.22))
    pt = _base(x, z, yaw)
    p = []
    for i in range(n):
        a = -comp * 0.5 + (i + 0.5) * (comp / n)
        p.append(
            cube(
                f"{name}{i}",
                (comp / n, h, 0.09),
                pt(a, 0, y + h * 0.5),
                m["paint"] if i % 2 == 0 else m["black"],
                0.004,
                rot=(0, yaw, 0),
            )
        )
    return join(name, p)


def seta_piso(name, x, z, m, yaw=0.0, comp=0.55):
    """Seta pintada no pátio: diz o sentido de circulação."""
    pt = _base(x, z, yaw)
    p = [
        cube(f"{name}H", (comp, 0.008, 0.07), pt(0, 0, Y_PATIO + 0.035), m["paint"], 0.0, rot=(0, yaw, 0)),
        barra(f"{name}A", pt(comp * 0.5, 0, Y_PATIO + 0.035), pt(comp * 0.22, 0.13, Y_PATIO + 0.035), 0.06, 0.008, m["paint"]),
        barra(f"{name}B", pt(comp * 0.5, 0, Y_PATIO + 0.035), pt(comp * 0.22, -0.13, Y_PATIO + 0.035), 0.06, 0.008, m["paint"]),
    ]
    return join(name, p)


def arbusto(name, x, z, m, r=0.14):
    """Canteiro com arbusto — o verde entre as vagas do modelo de referência."""
    p = [
        cube(f"{name}Cant", (r * 2.6, 0.07, r * 2.2), (x, Y_PATIO + 0.03, z), m["conc_dirty"], 0.01),
        cube(f"{name}Massa", (r * 2.1, 0.16, r * 1.7), (x, Y_PATIO + 0.12, z), m["leaf"], 0.06),
    ]
    return join(name, p)


def fachada_janelas(name, x, y, z, larg, alt, m, andares=3, por_andar=8, yaw=0.0, prof=0.03):
    """Grade regular de janelas acesas.

    E o que faz um predio de maquete ler como predio: no video de referencia
    nao ha um so volume liso — todos tem duas ou tres fileiras de janelinhas
    iluminadas, e e so isso que informa quantos andares o bloco tem.
    """
    p = []
    lj = min(0.16, larg / (por_andar * 1.7))
    aj = min(0.11, alt / (andares * 2.2))
    for i in range(andares):
        py = y - alt * 0.5 + alt * (i + 0.62) / andares
        for j in range(por_andar):
            px = -larg * 0.5 + larg * (j + 0.5) / por_andar
            p.append(
                cube(
                    f"{name}{i}_{j}",
                    (lj, aj, prof),
                    (x + math.cos(yaw) * px, py, z + math.sin(yaw) * px),
                    m["janela"],
                    0.0,
                    rot=(0, yaw, 0),
                )
            )
    return p


def bloco(name, x, z, larg, prof, alt, m, andares=3, y0=Y_PLATA, mat=None, faixa=True):
    """Bloco de varios pavimentos: corpo, platibanda, faixa e janelas.

    Substitui as baias de frente aberta da fase 14. A baia era uma leitura de
    modelo didatico em corte; o pedido agora e que pareca predio, e predio tem
    volume fechado, empena, platibanda e janela repetida.
    """
    par = mat or m["white"]
    yc = y0 + alt * 0.5
    p = [
        cube(f"{name}Corpo", (larg, alt, prof), (x, yc, z), par, 0.02),
        cube(f"{name}Platibanda", (larg + 0.08, 0.1, prof + 0.08), (x, y0 + alt + 0.03, z), par, 0.014),
        cube(f"{name}Rodape", (larg + 0.03, 0.1, prof + 0.03), (x, y0 + 0.05, z), m["conc_dirty"], 0.01),
    ]
    if faixa:
        # Faixa horizontal na altura do primeiro piso: quebra a empena cega.
        p.append(cube(f"{name}Faixa", (larg + 0.02, 0.05, prof + 0.02), (x, y0 + alt * 0.34, z), m["mrs_b"], 0.008))
    # Janelas nas duas faces que a camera ve: a sul e a leste.
    p += fachada_janelas(f"{name}JanS", x, yc, z - prof * 0.5 - 0.012, larg * 0.88, alt * 0.82, m, andares=andares, por_andar=max(4, int(larg * 2.4)))
    p += fachada_janelas(
        f"{name}JanL", x + larg * 0.5 + 0.012, yc, z, prof * 0.88, alt * 0.82, m,
        andares=andares, por_andar=max(3, int(prof * 2.4)), yaw=math.pi / 2,
    )
    return p


def caixa_dagua(name, x, z, y, m, r=0.16, h=0.34):
    """Caixa d'agua sobre pilotis: laje industrial limpa nao existe."""
    p = [cyl(f"{name}T", r, h, (x, y + 0.34, z), m["conc_dirty"], 16)]
    for i, (dx, dz) in enumerate(((-r * 0.6, -r * 0.6), (r * 0.6, -r * 0.6), (-r * 0.6, r * 0.6), (r * 0.6, r * 0.6))):
        p.append(cyl(f"{name}P{i}", 0.018, 0.34, (x + dx, y + 0.17, z + dz), m["steel"], 8))
    return p


def interior_estoque(name, x, z, m, prof=2.4, larg=3.0):
    """Prateleira com paletes, vista pelo terreo envidracado do bloco."""
    p = []
    k = 0
    for i in range(3):
        px = x - larg * 0.32 + i * larg * 0.32
        for j in range(2):
            pz = z + 0.25 - j * 0.75
            p.append(cube(f"{name}Est{k}", (0.5, 0.5, 0.3), (px, Y_PLATA + 0.28, pz), m["steel_rust"], 0.01))
            for k2 in range(2):
                p.append(cube(f"{name}Cx{k}{k2}", (0.4, 0.14, 0.24), (px, Y_PLATA + 0.13 + k2 * 0.24, pz), m["cont"][(i + j + k2) % 5], 0.012))
            k += 1
    return join(name, p)


def interior_controle(name, x, z, m):
    """A sala de controle: painel de vídeo no fundo, bancada e operadores.

    É o conteúdo que existia solto no gramado, agora dentro de uma baia — a
    frente aberta deixa ver tudo isso de fora.
    """
    verde = pbr("MonitorCentro", color=(0.12, 0.72, 0.42), rough=0.2, emit=1.6)
    p = [
        # Painel de vídeo: uma parede inteira de telas.
        cube(f"{name}PainelMoldura", (2.3, 0.62, 0.05), (x, Y_PLATA + 0.52, z + 1.05), m["black"], 0.012),
    ]
    for i in range(4):
        for j in range(2):
            p.append(
                cube(
                    f"{name}Tela{i}{j}",
                    (0.5, 0.26, 0.02),
                    (x - 0.87 + i * 0.58, Y_PLATA + 0.38 + j * 0.29, z + 1.02),
                    verde,
                    0.0,
                )
            )
    # Bancada em U voltada para o painel.
    p.append(cube(f"{name}Mesa", (2.0, 0.05, 0.36), (x, Y_PLATA + 0.24, z + 0.2), m["desk"], 0.012))
    p.append(cube(f"{name}MesaPe", (1.9, 0.22, 0.3), (x, Y_PLATA + 0.12, z + 0.2), m["desk"], 0.014))
    for i in range(3):
        px = x - 0.62 + i * 0.62
        p.append(cube(f"{name}Mon{i}", (0.3, 0.18, 0.02), (px, Y_PLATA + 0.36, z + 0.32), verde, 0.0, rot=(-0.3, 0, 0)))
        p.append(cube(f"{name}Cad{i}", (0.22, 0.28, 0.22), (px, Y_PLATA + 0.14, z - 0.12), m["black"], 0.03))
    p.append(cube(f"{name}Caneca", (0.06, 0.07, 0.06), (x + 0.9, Y_PLATA + 0.3, z + 0.22), m["white"], 0.01))
    return join(name, p)


def portaria_num(name, x, z, m, yaw=0.0):
    """Portaria de acesso: ilha, guarita baixa, cancela e placa."""
    pt = _base(x, z, yaw, Y_PATIO)
    p = [
        cube(f"{name}Ilha", (0.34, 0.06, 0.8), pt(0, 0, 0.03), m["conc_dirty"], 0.008, rot=(0, yaw, 0)),
        cube(f"{name}Cabine", (0.26, 0.34, 0.3), pt(0, 0, 0.23), m["white"], 0.02, rot=(0, yaw, 0)),
        cube(f"{name}Vidro", (0.02, 0.16, 0.24), pt(0.14, 0, 0.26), m["glass"], 0.0, rot=(0, yaw, 0)),
        cube(f"{name}Teto", (0.4, 0.03, 0.44), pt(0, 0, 0.42), m["roof"], 0.008, rot=(0, yaw, 0)),
        cyl(f"{name}Eixo", 0.03, 0.34, pt(0, -0.5, 0.17), m["steel"], 12),
        barra(f"{name}Cancela", pt(0, -0.5, 0.3), pt(0.05, -0.5, 0.82), 0.05, 0.05, m["hi_vis"]),
    ]
    p.append(placa_azul(f"{name}Placa", *pt(-0.3, 0, 0.56), m, larg=0.6, alt=0.13, yaw=yaw))
    return join(name, p)


def cobertura(name, x, z, m, larg=1.7, prof=0.66):
    """Pérgola das vagas, com placa solar — mesma decisão da fase 13."""
    p = [
        cube(f"{name}Telha", (larg, 0.03, prof), (x, Y_PATIO + 0.44, z), m["white"], 0.008, rot=(0, 0, 0.1)),
        cube(f"{name}Solar", (larg - 0.1, 0.012, prof - 0.1), (x, Y_PATIO + 0.47, z), m["mrs_b"], 0.0, rot=(0, 0, 0.1)),
    ]
    for i in range(3):
        px = x - larg * 0.5 + 0.07 + i * (larg - 0.14) * 0.5
        p.append(cyl(f"{name}Pe{i}", 0.022, 0.44, (px, Y_PATIO + 0.22, z + prof * 0.42), m["steel"], 12))
    return join(name, p)


def mastro_com(name, x, z, m, altura=2.6):
    """Torre de comunicação. Nome nunca começa com "Torre": o
    `MaqueteBlender.tsx` esconde tudo que casa com /^torre/i."""
    p = [cube(f"{name}Base", (0.24, 0.08, 0.24), (x, Y_PATIO + 0.04, z), m["conc_dirty"], 0.01)]
    lado = 0.09
    pes = [(-lado, -lado), (-lado, lado), (lado, -lado), (lado, lado)]
    for i, (dx, dz) in enumerate(pes):
        p.append(barra(f"{name}P{i}", (x + dx, Y_PATIO, z + dz), (x + dx * 0.3, altura, z + dz * 0.3), 0.03, 0.03, m["steel"]))
    for i in range(7):
        t0, t1 = i / 7, (i + 1) / 7
        y0, y1 = Y_PATIO + (altura - Y_PATIO) * t0, Y_PATIO + (altura - Y_PATIO) * t1
        e0, e1 = lado * (1 - 0.7 * t0), lado * (1 - 0.7 * t1)
        for a, b in ((0, 1), (1, 3), (3, 2), (2, 0)):
            pa = (x + pes[a][0] / lado * e0, y0, z + pes[a][1] / lado * e0)
            pb = (x + pes[b][0] / lado * e1, y1, z + pes[b][1] / lado * e1)
            p.append(barra(f"{name}D{i}{a}", pa, pb, 0.014, 0.014, m["steel"]))
    # Antenas setoriais e o farol de obstáculo.
    for i, ang in enumerate((0.0, 2.09, 4.19)):
        p.append(
            cube(
                f"{name}Ant{i}",
                (0.05, 0.3, 0.11),
                (x + math.cos(ang) * 0.14, altura - 0.2, z + math.sin(ang) * 0.14),
                m["white"],
                0.008,
                rot=(0, ang, 0),
            )
        )
    p.append(cyl(f"{name}Farol", 0.035, 0.06, (x, altura + 0.05, z), m["sig_r"], 12))
    return join(name, p)


def build_control_center(m):
    cx = (OESTE + LESTE) * 0.5

    # --- terreno em dois patamares -----------------------------------------
    cube("CentroPatio", (LESTE - OESTE, 0.04, Z_PLATA - SUL), (cx, Y_PATIO, (SUL + Z_PLATA) * 0.5), m["asph"], 0.01)
    cube("CentroPlata", (LESTE - OESTE, Y_PLATA, NORTE - Z_PLATA), (cx, Y_PLATA * 0.5, (Z_PLATA + NORTE) * 0.5), m["conc_dirty"], 0.012)
    # Reveste o degrau entre o patio (0,11) e a plataforma (0,42).
    meio_fio("CentroMeioFio", cx, Z_PLATA - 0.06, LESTE - OESTE - 0.2, m, y=0.11, h=0.31)

    # --- prédios do patamar alto -----------------------------------------
    # Três blocos de alturas diferentes, como no vídeo de referência: um baixo
    # e largo, a torre principal e um médio. Alturas iguais leem como estante.
    partes = []
    partes += bloco("CentroBlocoO", -19.0, 13.4, 3.4, 2.3, 0.95, m, andares=3)
    partes += bloco("CentroBlocoC", -15.3, 13.6, 3.2, 2.6, 1.55, m, andares=5)
    partes += bloco("CentroBlocoL", -11.9, 13.2, 2.6, 2.0, 0.72, m, andares=2, mat=m["conc_dirty"])
    # Passarela ligando a torre ao bloco leste, na altura do segundo piso.
    partes.append(cube("CentroPassarela", (1.4, 0.24, 0.5), (-13.6, Y_PLATA + 0.62, 13.3), m["white"], 0.015))
    partes.append(cube("CentroPassVidro", (1.3, 0.14, 0.02), (-13.6, Y_PLATA + 0.64, 13.04), m["janela"], 0.0))
    partes += caixa_dagua("CentroCaixa", -20.4, 13.9, Y_PLATA + 0.95, m)
    partes.append(cube("CentroCasaMaq", (0.9, 0.3, 0.7), (-15.3, Y_PLATA + 1.7, 13.9), m["conc_dirty"], 0.015))
    join("CentroBlocos", partes)

    # A sala de controle é o térreo envidraçado da torre: fita de vidro na
    # fachada sul e o painel de vídeo visível por ela.
    cube("CentroCtrlVidro", (3.1, 0.34, 0.03), (-15.3, Y_PLATA + 0.22, 12.28), m["glass"], 0.0)
    interior_controle("CentroCtrl", -15.3, 12.9, m)
    # Terreo do bloco oeste: armazenagem, tambem atras de vidro.
    cube("CentroEstOVidro", (3.2, 0.3, 0.03), (-19.0, Y_PLATA + 0.2, 12.23), m["glass"], 0.0)
    interior_estoque("CentroEstO", -19.0, 13.4, m)

    # Marquise de entrada da torre, sobre o acesso principal.
    cube("CentroMarquise", (2.0, 0.05, 0.6), (-15.3, Y_PLATA + 0.42, 11.95), m["white"], 0.01)
    for i, px in enumerate((-16.1, -14.5)):
        cyl(f"CentroMarqPe{i}", 0.024, 0.42, (px, Y_PLATA + 0.21, 12.2), m["steel"], 12)
    placa_azul("CentroPlacaTorre", -15.3, Y_PLATA + 0.58, 11.93, m, larg=1.5, alt=0.18)

    # Escada de acesso entre os dois patamares, no canto oeste.
    escada = []
    for i in range(5):
        escada.append(
            cube(f"CentroDegrau{i}", (0.9, 0.07, 0.16), (-21.1, Y_PATIO + 0.05 + i * 0.07, 11.16 + i * 0.16), m["conc_dirty"], 0.006)
        )
    escada.append(cube("CentroGuardaE", (0.03, 0.24, 0.86), (-21.53, Y_PATIO + 0.36, 11.5), m["steel"], 0.006))
    escada.append(cube("CentroGuardaD", (0.03, 0.24, 0.86), (-20.67, Y_PATIO + 0.36, 11.5), m["steel"], 0.006))
    join("CentroEscada", escada)

    # --- pátio: portarias, guarita, estacionamento -------------------------
    for i, px in enumerate((-19.6, -16.2, -12.8)):
        portaria_num(f"CentroPortaria{i}", px, SUL + 0.5, m)
        seta_piso(f"CentroSeta{i}", px, SUL + 1.5, m, yaw=math.pi / 2)

    cube("CentroSegBase", (1.5, 0.06, 1.1), (-21.0, Y_PATIO + 0.03, 8.9), m["conc_dirty"], 0.01)
    cube("CentroSeg", (1.25, 0.52, 0.9), (-21.0, Y_PATIO + 0.32, 8.9), m["white"], 0.025)
    cube("CentroSegVidro", (1.1, 0.24, 0.02), (-21.0, Y_PATIO + 0.36, 8.44), m["glass"], 0.0)
    cube("CentroSegTeto", (1.35, 0.05, 1.0), (-21.0, Y_PATIO + 0.6, 8.9), m["roof"], 0.01)
    placa_azul("CentroSegPlaca", -21.0, Y_PATIO + 0.72, 8.42, m, larg=0.8)

    for i, px in enumerate((-18.2, -16.4, -14.6)):
        cobertura(f"CentroCob{i}", px, 9.3, m)
        for j in range(3):
            carro(
                f"CentroCarro{i}{j}",
                px - 0.55 + j * 0.55,
                9.3,
                m,
                yaw=math.pi / 2,
                cor=(m["white"], m["mrs_b"], m["sig_r"], m["black"], m["cont"][1])[(i * 3 + j) % 5],
                y=Y_PATIO + 0.02,
            )
        cube(f"CentroVaga{i}", (0.02, 0.008, 0.5), (px - 0.82, Y_PATIO + 0.035, 9.3), m["paint"], 0.0)
    for i, px in enumerate((-19.2, -13.4)):
        arbusto(f"CentroArb{i}", px, 9.3, m)
    arbusto("CentroArb2", -11.6, 10.6, m, r=0.18)

    # --- muro, comunicação e gente -----------------------------------------
    muro("CentroMuro", [(OESTE, SUL), (OESTE, NORTE), (LESTE, NORTE), (LESTE, SUL)], m, h=0.38)
    mastro_com("MastroCom", -11.4, 8.0, m)
    for i, (px, pz, py, pyaw) in enumerate(
        (
            (-15.3, 12.9, Y_PLATA, 0.4),
            (-14.6, 13.0, Y_PLATA, -0.8),
            (-19.8, 7.4, Y_PATIO, 1.6),
            (-17.0, 10.4, Y_PATIO, -1.9),
        )
    ):
        pessoa(f"OpScada{i}", px, pz, m, yaw=pyaw, y=py)
    for i, px in enumerate((-16.9, -16.5, -16.1)):
        cyl(f"CentroMastroBand{i}", 0.02, 0.9, (px, Y_PATIO + 0.45, 10.9), m["white"], 10)
        cube(f"CentroBand{i}", (0.02, 0.16, 0.26), (px + 0.13, Y_PATIO + 0.78, 10.9), (m["sig_g"], m["mrs_b"], m["sig_y"])[i], 0.0)
