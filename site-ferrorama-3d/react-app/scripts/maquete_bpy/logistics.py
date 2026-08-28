"""Fase 13 — o terminal logístico, que é a segunda metade do porto.

As duas fotos de referência mostram um porto em duas partes, e a maquete só
tinha a primeira. A parte do cais — navio, guindaste, correia, shiploader — já
existe. Faltava a parte de terra: armazéns de doca, pátio de contêineres,
estacionamento, portaria e muro. Sem ela o porto termina no vazio a oeste do
cais, e o tabuleiro fica com um buraco de 12 por 9 unidades bem no meio da
metade norte.

O terreno escolhido é `x 0 → 9,4` por `z 6,8 → 15,2`: é a maior mancha livre do
tabuleiro, fica ao norte do oval sem cruzar via nenhuma, e encosta na cerca
norte do terminal que já existia, então o sítio fecha em vez de aparecer solto.

Da foto do sítio industrial vêm as decisões de forma:

* **Galpão é volume, não caixa.** Telhado de duas águas com beiral, portas de
  doca recuadas no plano da fachada, testeira mais clara que a parede.
* **Placa solar no telhado.** É o detalhe que data o prédio — sem ela o galpão
  branco poderia ser de 1970.
* **Estacionamento com cobertura.** As pérgolas sobre as vagas aparecem em
  quase toda planta industrial nova e são o que impede o estacionamento de ler
  como um retângulo cinza vazio.
* **Muro com pilar a cada vão.** Muro liso é placa; muro com ritmo é muro.

Convenção de coordenadas e de rotação: igual ao resto (ver `process.py`).
"""

from __future__ import annotations

import math

from .details import pessoa
from .primitives import cube, cyl, join
from .process import barra
from .structures import galpao

# Retângulo do sítio. O muro corre por dentro dele.
OESTE, LESTE = 0.2, 9.4
SUL, NORTE = 6.8, 15.2
# Cota do piso pavimentado do terminal, logo acima da grama (0,072 no topo).
Y_PISO = 0.085


def _base(x, z, yaw, y0=0.0):
    co, si = math.cos(yaw), math.sin(yaw)

    def pt(a, t, h):
        return (x + co * a - si * t, y0 + h, z + si * a + co * t)

    return pt


def piso(name, x, z, sx, sz, m, mat=None):
    """Laje de pátio. Uma peça só, porque é o chão e não tem detalhe."""
    return cube(name, (sx, 0.03, sz), (x, Y_PISO, z), mat or m["asph"], 0.01)


def faixa_vaga(name, x, z, n, m, passo=0.26, comp=0.5):
    """Demarcação de vagas: as linhas é que fazem o retângulo virar pátio."""
    p = [
        cube(f"{name}{i}", (0.02, 0.006, comp), (x + i * passo, Y_PISO + 0.018, z), m["paint"], 0.0)
        for i in range(n)
    ]
    return join(name, p)


def cobertura_vagas(name, x, z, m, vagas=6, passo=0.26, prof=0.62):
    """Pérgola sobre as vagas, com placa solar — a assinatura da foto."""
    larg = vagas * passo
    p = [
        cube(f"{name}Telha", (larg, 0.03, prof), (x, 0.5, z), m["white"], 0.008, rot=(0, 0, 0.1)),
        cube(f"{name}Solar", (larg - 0.08, 0.012, prof - 0.1), (x, 0.53, z), m["mrs_b"], 0.0, rot=(0, 0, 0.1)),
    ]
    for i in range(3):
        px = x - larg * 0.5 + 0.06 + i * (larg - 0.12) * 0.5
        p.append(cyl(f"{name}Pe{i}", 0.022, 0.48, (px, 0.24, z + prof * 0.42), m["steel"], 10))
    return join(name, p)


def carro(name, x, z, m, yaw=0.0, cor=None):
    """Carro de passeio: dois volumes e quatro rodas. Só precisa ler de longe."""
    pt = _base(x, z, yaw)
    c = cor or m["white"]
    p = [
        cube(f"{name}Corpo", (0.34, 0.07, 0.16), pt(0, 0, 0.07), c, 0.02, rot=(0, yaw, 0)),
        cube(f"{name}Cabine", (0.18, 0.06, 0.15), pt(-0.02, 0, 0.13), c, 0.025, rot=(0, yaw, 0)),
        cube(f"{name}Vidro", (0.14, 0.04, 0.152), pt(-0.02, 0, 0.145), m["glass"], 0.0, rot=(0, yaw, 0)),
    ]
    k = 0
    for a in (0.11, -0.11):
        for t in (-0.075, 0.075):
            p.append(cyl(f"{name}R{k}", 0.032, 0.025, pt(a, t, 0.032), m["black"], 12, rot=(0, yaw + math.pi / 2, math.pi / 2)))
            k += 1
    return join(name, p)


def carreta(name, x, z, m, yaw=0.0, cor=None):
    """Cavalo mecânico com semirreboque, recuado na doca."""
    pt = _base(x, z, yaw)
    p = [
        cube(f"{name}Bau", (1.05, 0.28, 0.3), pt(-0.42, 0, 0.34), cor or m["white"], 0.02, rot=(0, yaw, 0)),
        cube(f"{name}Chassi", (1.1, 0.05, 0.26), pt(-0.4, 0, 0.18), m["black"], 0.01, rot=(0, yaw, 0)),
        cube(f"{name}Cavalo", (0.36, 0.22, 0.28), pt(0.32, 0, 0.26), m["mrs_b"], 0.025, rot=(0, yaw, 0)),
        cube(f"{name}Cabine", (0.22, 0.14, 0.27), pt(0.34, 0, 0.44), m["mrs_b"], 0.02, rot=(0, yaw, 0)),
        cube(f"{name}Vidro", (0.02, 0.09, 0.22), pt(0.45, 0, 0.46), m["glass"], 0.0, rot=(0, yaw, 0)),
    ]
    k = 0
    for a in (0.42, 0.24, -0.72, -0.88):
        for t in (-0.13, 0.13):
            p.append(cyl(f"{name}R{k}", 0.055, 0.045, pt(a, t, 0.055), m["black"], 12, rot=(0, yaw + math.pi / 2, math.pi / 2)))
            k += 1
    return join(name, p)


def muro(name, pontos, m, h=0.42, passo=0.78):
    """Muro de placas com pilar a cada vão. Muro liso lê como placa."""
    p = []
    k = 0
    for i in range(len(pontos) - 1):
        x0, z0 = pontos[i]
        x1, z1 = pontos[i + 1]
        comp = math.hypot(x1 - x0, z1 - z0)
        yaw = math.atan2(z1 - z0, x1 - x0)
        p.append(cube(f"{name}P{i}", (comp, h, 0.05), ((x0 + x1) * 0.5, h * 0.5, (z0 + z1) * 0.5), m["conc_dirty"], 0.008, rot=(0, yaw, 0)))
        p.append(cube(f"{name}C{i}", (comp, 0.03, 0.07), ((x0 + x1) * 0.5, h + 0.01, (z0 + z1) * 0.5), m["white"], 0.006, rot=(0, yaw, 0)))
        n = max(1, int(round(comp / passo)))
        for j in range(n + 1):
            t = j / n
            p.append(
                cube(
                    f"{name}Pil{k}",
                    (0.09, h + 0.06, 0.09),
                    (x0 + (x1 - x0) * t, (h + 0.06) * 0.5, z0 + (z1 - z0) * t),
                    m["conc_dirty"],
                    0.008,
                    rot=(0, yaw, 0),
                )
            )
            k += 1
    return join(name, p)


def portaria_terminal(name, x, z, m, yaw=0.0):
    """Guarita, cancela e faixa de parada: é o que diz 'área controlada'."""
    pt = _base(x, z, yaw)
    p = [
        cube(f"{name}Ilha", (0.5, 0.06, 1.05), pt(0, 0, 0.03), m["conc_dirty"], 0.01, rot=(0, yaw, 0)),
        cube(f"{name}Casa", (0.34, 0.4, 0.42), pt(0, 0, 0.26), m["white"], 0.02, rot=(0, yaw, 0)),
        cube(f"{name}Vidro", (0.02, 0.2, 0.34), pt(0.18, 0, 0.3), m["glass"], 0.0, rot=(0, yaw, 0)),
        cube(f"{name}Teto", (0.52, 0.04, 0.6), pt(0, 0, 0.48), m["roof"], 0.01, rot=(0, yaw, 0)),
        cyl(f"{name}Eixo", 0.035, 0.4, pt(0, -0.62, 0.2), m["steel"], 12),
        barra(f"{name}Cancela", pt(0, -0.62, 0.36), pt(0.06, -0.62, 0.96), 0.055, 0.055, m["hi_vis"]),
        cyl(f"{name}Eixo2", 0.035, 0.4, pt(0, 0.62, 0.2), m["steel"], 12),
        barra(f"{name}Cancela2", pt(0, 0.62, 0.36), pt(-0.06, 0.62, 0.96), 0.055, 0.055, m["hi_vis"]),
        cube(f"{name}Placa", (0.03, 0.22, 0.7), pt(-0.34, 0, 0.62), m["sign_b"], 0.0, rot=(0, yaw, 0)),
    ]
    return join(name, p)


def predio_admin(name, x, z, m, yaw=0.0):
    """Administrativo de dois pavimentos com fachada envidraçada."""
    pt = _base(x, z, yaw)
    p = [
        cube(f"{name}Base", (1.5, 0.06, 1.1), pt(0, 0, 0.03), m["conc_dirty"], 0.01, rot=(0, yaw, 0)),
        cube(f"{name}Corpo", (1.3, 0.72, 0.92), pt(0, 0, 0.42), m["white"], 0.02, rot=(0, yaw, 0)),
        # Fachada de vidro só na face de entrada — envidraçar tudo lê como maquete.
        cube(f"{name}Vidro", (1.16, 0.5, 0.02), pt(0, -0.46, 0.46), m["glass"], 0.0, rot=(0, yaw, 0)),
        cube(f"{name}Faixa", (1.32, 0.04, 0.94), pt(0, 0, 0.44), m["mrs_b"], 0.006, rot=(0, yaw, 0)),
        cube(f"{name}Platibanda", (1.36, 0.08, 0.98), pt(0, 0, 0.82), m["white"], 0.012, rot=(0, yaw, 0)),
        cube(f"{name}Marquise", (0.7, 0.03, 0.3), pt(0, -0.6, 0.36), m["white"], 0.008, rot=(0, yaw, 0)),
        cyl(f"{name}MarqPe", 0.02, 0.34, pt(0, -0.72, 0.17), m["steel"], 10),
        # Caixa d'água e casa de máquinas na laje: laje limpa não existe.
        cube(f"{name}Caixa", (0.28, 0.22, 0.28), pt(-0.4, 0.2, 0.94), m["conc_dirty"], 0.012, rot=(0, yaw, 0)),
    ]
    return join(name, p)


def solar_telhado(name, x, z, m, sx, sz, filas=3, colunas=6):
    """Placas solares no telhado — é o detalhe que data o prédio."""
    p = []
    k = 0
    for i in range(colunas):
        for j in range(filas):
            px = x + (i - (colunas - 1) * 0.5) * (sx / colunas)
            pz = z + (j - (filas - 1) * 0.5) * (sz / filas)
            p.append(cube(f"{name}{k}", (sx / colunas - 0.05, 0.012, sz / filas - 0.06), (px, 1.42, pz), m["mrs_b"], 0.0, rot=(0, 0, 0.12)))
            k += 1
    return join(name, p)


def patio_conteiner(name, x, z, m, colunas=5, fileiras=3, altura=3, yaw=0.0):
    """Pátio de contêineres do lado de terra, maior que o do cais."""
    pt = _base(x, z, yaw, Y_PISO)
    p = []
    k = 0
    for i in range(colunas):
        a = (i - (colunas - 1) * 0.5) * 0.6
        for j in range(fileiras):
            t = (j - (fileiras - 1) * 0.5) * 0.54
            # Altura irregular: pátio cheio até o topo em todo lugar não existe.
            n = max(1, altura - ((i * 3 + j) % 3 == 0))
            for k2 in range(n):
                p.append(
                    cube(
                        f"{name}C{k}",
                        (0.52, 0.3, 0.46),
                        pt(a, t, 0.16 + k2 * 0.31),
                        m["cont"][(i * 2 + j + k2) % 5],
                        0.012,
                        rot=(0, yaw, 0),
                    )
                )
                k += 1
    return join(name, p)


def build_logistics(m):
    # --- pavimento -------------------------------------------------------
    piso("PisoTerminal", 4.8, 11.0, 9.0, 8.2, m)
    piso("PisoTerminalDoca", 5.6, 11.5, 5.4, 1.3, m, mat=m["conc"])

    # --- muro e portaria -------------------------------------------------
    muro(
        "MuroTerminal",
        [(OESTE, SUL), (OESTE, NORTE), (LESTE, NORTE)],
        m,
    )
    muro("MuroTerminalS", [(OESTE, SUL), (LESTE, SUL)], m)
    portaria_terminal("PortariaTerminal", 0.75, 9.5, m, yaw=0.0)

    # --- armazéns --------------------------------------------------------
    # O grande fica no fundo, com as docas voltadas para a via interna.
    galpao("ArmazemLog", 5.6, 13.3, 4.6, 2.5, 1.05, 1.42, m, vaos=6, mat_telha=m["roof"], piso=0.35)
    solar_telhado("SolarLog", 5.6, 13.6, m, 3.6, 1.4)
    galpao("GalpaoLog", 1.6, 12.9, 1.5, 1.7, 0.82, 1.1, m, vaos=3, mat_telha=m["roof_r"], piso=0.3)

    # Portas de doca: recuo no plano da fachada sul do armazém grande.
    for i in range(4):
        px = 4.1 + i * 1.0
        cube(f"DocaPorta{i}", (0.62, 0.5, 0.06), (px, 0.3, 12.06), m["black"], 0.01)
        cube(f"DocaAbrigo{i}", (0.76, 0.08, 0.16), (px, 0.62, 11.97), m["steel_rust"], 0.012)
    for i, px in enumerate((4.1, 6.1, 8.1)):
        carreta(f"CarretaLog{i}", px, 11.35, m, yaw=math.pi / 2, cor=m["white"] if i % 2 == 0 else m["cont"][2])

    # --- administrativo, estacionamento e pátio --------------------------
    predio_admin("AdminTerminal", 1.9, 8.5, m, yaw=0.0)
    faixa_vaga("VagasLog", 3.0, 8.3, 7, m)
    cobertura_vagas("CoberturaLog", 3.78, 8.3, m)
    for i in range(5):
        carro(
            f"CarroLog{i}",
            3.13 + i * 0.26,
            8.3,
            m,
            yaw=math.pi / 2,
            cor=(m["white"], m["mrs_b"], m["sig_r"], m["black"], m["cont"][1])[i],
        )
    patio_conteiner("PatioContLog", 7.3, 8.6, m)

    # --- gente e iluminação ----------------------------------------------
    for i, (px, pz, pyaw) in enumerate(((1.35, 9.5, 1.4), (4.2, 11.9, -1.2), (7.5, 9.6, 2.6))):
        pessoa(f"OpLog{i}", px, pz, m, yaw=pyaw)
    for i, (px, pz) in enumerate(((1.1, 14.6), (8.8, 7.4))):
        # Nome nunca começa com "Torre": o MaqueteBlender.tsx esconde /^torre/i.
        cube(f"MastroLog{i}Base", (0.16, 0.06, 0.16), (px, 0.03, pz), m["conc_dirty"], 0.01)
        cyl(f"MastroLog{i}", 0.035, 2.3, (px, 1.15, pz), m["steel"], 12)
        cube(f"MastroLog{i}Ref", (0.3, 0.06, 0.14), (px, 2.32, pz), m["glow"], 0.008)
