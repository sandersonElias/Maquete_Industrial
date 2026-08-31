"""Fases 2 e 6 — escala humana e os detalhes que contam a história.

**Fase 2 (escala).** Uma maquete industrial só parece grande quando existe algo
pequeno e conhecido ao lado. Sem uma figura humana o cérebro não tem régua: o
silo de embarque pode ter 3 m ou 30 m. A escala aqui é ~1 unidade = 12,5 m
(conferida pelo vagão de 0,78 = ~10 m), então uma pessoa mede 0,15.

**Fase 6 (história).** O que separa "modelo 3D de uma indústria" de "uma
indústria num dia de trabalho" são os vestígios de atividade: caminhão parado
na balança, cones isolando um serviço, tambores empilhados no fundo da oficina,
poça de chuva no pátio, sucata esperando destino, linha de energia cruzando o
terreno. Nada disso é geometria cara — é geometria *posicionada com intenção*.
"""

from __future__ import annotations

import math

from .primitives import cube, cyl, ico, join

# ---------------------------------------------------------------------------
# Gente
# ---------------------------------------------------------------------------

ALT_PESSOA = 0.15


def pessoa(name, x, z, m, yaw=0.0, y=0.0, capacete=None, colete=True):
    """Operador com capacete e colete, ~0,15 de altura (≈1,9 m na escala)."""
    cap = capacete or m["helmet"]
    torso = m["hi_vis"] if colete else m["mrs_b"]
    p = []
    p.append(cube(f"{name}Pe", (0.036, 0.072, 0.03), (x, y + 0.036, z), m["black"], 0.0, rot=(0, yaw, 0)))
    p.append(cube(f"{name}Tr", (0.048, 0.055, 0.032), (x, y + 0.1, z), torso, 0.0, rot=(0, yaw, 0)))
    for i, dx in enumerate((-0.031, 0.031)):
        p.append(
            cube(
                f"{name}Br{i}",
                (0.015, 0.05, 0.015),
                (x + math.cos(yaw) * 0 - math.sin(yaw) * dx, y + 0.1, z + math.cos(yaw) * dx),
                torso,
                0.0,
                rot=(0, yaw, 0),
            )
        )
    p.append(ico(f"{name}Cb", 0.017, (x, y + 0.142, z), m["skin"], 1))
    p.append(ico(f"{name}Cp", 0.019, (x, y + 0.149, z), cap, 1, (1.0, 0.62, 1.0)))
    return join(name, p)


def grupo_pessoas(prefixo, pontos, m):
    """`pontos` = lista de (x, z, yaw) — ou (x, z, yaw, y) sobre plataforma."""
    for i, pt in enumerate(pontos):
        x, z, yaw = pt[0], pt[1], pt[2]
        y = pt[3] if len(pt) > 3 else 0.0
        cap = m["helmet"] if i % 3 else m["white"]
        pessoa(f"{prefixo}{i}", x, z, m, yaw=yaw, y=y, capacete=cap)


# ---------------------------------------------------------------------------
# Miudezas de pátio
# ---------------------------------------------------------------------------


def cone_transito(name, x, z, m, y=0.0):
    a = cube(f"{name}B", (0.05, 0.008, 0.05), (x, y + 0.004, z), m["black"], 0.0)
    b = cyl(f"{name}C", 0.024, 0.055, (x, y + 0.035, z), m["hi_vis"], 8, r2=0.006)
    return join(name, [a, b])


def tambores(name, x, z, m, n=6, yaw=0.0):
    p = []
    for i in range(n):
        dx = (i % 3) * 0.062 - 0.062
        dz = (i // 3) * 0.062 - 0.031
        px = x - math.sin(yaw) * dz + math.cos(yaw) * dx
        pz = z + math.cos(yaw) * dz + math.sin(yaw) * dx
        mat = m["hi_vis"] if i % 2 else m["mrs_b"]
        p.append(cyl(f"{name}{i}", 0.028, 0.072, (px, 0.036, pz), mat, 10))
    return join(name, p)


def palete(name, x, z, m, yaw=0.0, carga=True):
    p = [cube(f"{name}B", (0.13, 0.018, 0.11), (x, 0.009, z), m["wood"], 0.0, rot=(0, yaw, 0))]
    if carga:
        p.append(cube(f"{name}C", (0.115, 0.07, 0.1), (x, 0.054, z), m["dirt"], 0.0, rot=(0, yaw, 0)))
    return join(name, p)


def container_obra(name, x, z, m, yaw=0.0, cor=None):
    mat = cor or m["cont"][1]
    p = [cube(f"{name}B", (0.5, 0.22, 0.24), (x, 0.12, z), mat, 0.01, rot=(0, yaw, 0))]
    for i in range(5):
        a = -0.19 + i * 0.095
        p.append(
            cube(
                f"{name}N{i}",
                (0.012, 0.2, 0.26),
                (x + math.cos(yaw) * a, 0.12, z + math.sin(yaw) * a),
                mat,
                0.0,
                rot=(0, yaw, 0),
            )
        )
    p.append(cube(f"{name}P", (0.06, 0.16, 0.02), (x - math.sin(yaw) * 0.13, 0.1, z + math.cos(yaw) * 0.13), m["steel"], 0.0, rot=(0, yaw, 0)))
    return join(name, p)


def pickup(name, x, z, m, yaw=0.0, cor=None):
    """Caminhonete de supervisão — referência de escala perto dos gigantes."""
    mat = cor or m["white"]
    p = []
    p.append(cube(f"{name}Ch", (0.34, 0.06, 0.15), (x, 0.065, z), m["black"], 0.01, rot=(0, yaw, 0)))
    p.append(cube(f"{name}Cb", (0.14, 0.075, 0.145), (x - math.cos(yaw) * 0.05, 0.13, z - math.sin(yaw) * 0.05), mat, 0.015, rot=(0, yaw, 0)))
    p.append(cube(f"{name}Vd", (0.02, 0.045, 0.13), (x + math.cos(yaw) * 0.02, 0.14, z + math.sin(yaw) * 0.02), m["glass"], 0.0, rot=(0, yaw, 0)))
    p.append(cube(f"{name}Ca", (0.15, 0.05, 0.145), (x + math.cos(yaw) * 0.1, 0.115, z + math.sin(yaw) * 0.1), mat, 0.01, rot=(0, yaw, 0)))
    p.append(cube(f"{name}Gi", (0.05, 0.014, 0.03), (x - math.cos(yaw) * 0.05, 0.175, z - math.sin(yaw) * 0.05), m["amber"], 0.0, rot=(0, yaw, 0)))
    for i, (a, t) in enumerate(((-0.11, -0.075), (-0.11, 0.075), (0.1, -0.075), (0.1, 0.075))):
        px = x + math.cos(yaw) * a - math.sin(yaw) * t
        pz = z + math.sin(yaw) * a + math.cos(yaw) * t
        p.append(cyl(f"{name}R{i}", 0.035, 0.028, (px, 0.035, pz), m["rubber"], 10, rot=(0, yaw, math.pi / 2)))
    return join(name, p)


def placa(name, x, z, m, yaw=0.0, largura=0.42, altura=0.22, mat=None, h=0.42):
    p = []
    for i, t in enumerate((-largura * 0.4, largura * 0.4)):
        px = x - math.sin(yaw) * t
        pz = z + math.cos(yaw) * t
        p.append(cyl(f"{name}P{i}", 0.016, h, (px, h * 0.5, pz), m["steel"], 8))
    p.append(cube(f"{name}Pn", (0.02, altura, largura), (x, h + altura * 0.4, z), mat or m["sign_b"], 0.0, rot=(0, yaw, 0)))
    p.append(cube(f"{name}Bd", (0.008, altura * 0.72, largura * 0.82), (x + math.cos(yaw) * 0.012, h + altura * 0.4, z + math.sin(yaw) * 0.012), m["white"], 0.0, rot=(0, yaw, 0)))
    return join(name, p)


def bandeiras(name, x, z, m, n=3, esp=0.28):
    p = []
    cores = (m["white"], m["mrs_b"], m["mrs_y"])
    for i in range(n):
        px = x + (i - (n - 1) * 0.5) * esp
        p.append(cyl(f"{name}M{i}", 0.014, 0.9, (px, 0.45, z), m["white"], 8))
        p.append(cube(f"{name}B{i}", (0.006, 0.11, 0.19), (px + 0.1, 0.8, z), cores[i % 3], 0.0))
    return join(name, p)


def poca(name, x, z, m, r=0.22, escala=(1.0, 1.0)):
    ob = ico(f"{name}", r, (x, 0.012, z), m["puddle"], 1, (escala[0], 0.05, escala[1]))
    return ob


def mancha_oleo(name, x, z, m, r=0.16):
    return ico(name, r, (x, 0.011, z), m["black"], 1, (1.3, 0.03, 0.9))


def sucata(name, x, z, m, n=7):
    p = []
    for i in range(n):
        a = i * 2.399
        rr = 0.1 + (i % 3) * 0.07
        px = x + math.cos(a) * rr
        pz = z + math.sin(a) * rr
        mat = m["steel_rust"] if i % 2 else m["steel"]
        p.append(ico(f"{name}{i}", 0.07 + (i % 4) * 0.018, (px, 0.05, pz), mat, 1, (1.4, 0.6, 1.0)))
    return join(name, p)


def balanca(name, x, z, m, yaw=0.0):
    """Balança rodoviária: é aqui que a história do minério começa a ter número."""
    ao = (math.cos(yaw), math.sin(yaw))
    tr = (-math.sin(yaw), math.cos(yaw))

    def pt(a, t, y):
        return (x + ao[0] * a + tr[0] * t, y, z + ao[1] * a + tr[1] * t)

    p = []
    p.append(cube(f"{name}Fossa", (1.5, 0.12, 0.75), pt(0, 0, 0.05), m["conc_dirty"], 0.01, rot=(0, yaw, 0)))
    p.append(cube(f"{name}Plat", (1.42, 0.06, 0.66), pt(0, 0, 0.14), m["steel"], 0.01, rot=(0, yaw, 0)))
    for i, t in enumerate((-0.4, 0.4)):
        p.append(cube(f"{name}Guia{i}", (1.42, 0.07, 0.05), pt(0, t, 0.15), m["steel_y"], 0.0, rot=(0, yaw, 0)))
    p.append(cube(f"{name}Cab", (0.4, 0.42, 0.36), pt(0.0, 0.72, 0.21), m["white"], 0.02, rot=(0, yaw, 0)))
    p.append(cube(f"{name}CabVd", (0.32, 0.16, 0.02), pt(0.0, 0.54, 0.28), m["glass"], 0.0, rot=(0, yaw, 0)))
    p.append(cyl(f"{name}Post", 0.02, 0.62, pt(-0.78, -0.5, 0.31), m["steel"], 8))
    p.append(cube(f"{name}Disp", (0.03, 0.13, 0.2), pt(-0.78, -0.5, 0.68), m["black"], 0.0, rot=(0, yaw, 0)))
    p.append(cube(f"{name}DispL", (0.008, 0.08, 0.15), pt(-0.76, -0.5, 0.68), m["sig_g"], 0.0, rot=(0, yaw, 0)))
    return join(name, p)


def linha_energia(name, pontos, m, altura=1.15):
    """Postes de energia com condutores — costura o terreno visualmente."""
    p = []
    for i, (x, z) in enumerate(pontos):
        p.append(cyl(f"{name}P{i}", 0.028, altura, (x, altura * 0.5, z), m["conc_dirty"], 8))
        p.append(cube(f"{name}C{i}", (0.32, 0.025, 0.025), (x, altura - 0.04, z), m["steel"], 0.0))
        for k, dx in enumerate((-0.13, 0.0, 0.13)):
            p.append(cyl(f"{name}I{i}_{k}", 0.012, 0.035, (x + dx, altura + 0.0, z), m["white"], 6))
    for i in range(len(pontos) - 1):
        x0, z0 = pontos[i]
        x1, z1 = pontos[i + 1]
        for k, dx in enumerate((-0.13, 0.0, 0.13)):
            comp = math.hypot(x1 - x0, z1 - z0)
            yaw = math.atan2(z1 - z0, x1 - x0)
            # Flecha do cabo: um pouco abaixo do ponto de fixação.
            p.append(
                cube(
                    f"{name}F{i}_{k}",
                    (comp, 0.012, 0.012),
                    ((x0 + x1) * 0.5 + dx, altura - 0.03, (z0 + z1) * 0.5),
                    m["black"],
                    0.0,
                    rot=(0, yaw, 0),
                )
            )
    return join(name, p)


# ---------------------------------------------------------------------------
# Distribuição pelo terreno
# ---------------------------------------------------------------------------


def build_details(m):
    # --- Fase 2: gente onde há trabalho -----------------------------------
    grupo_pessoas(
        "OpMina",
        [
            (-22.0, -8.32, 1.2), (-21.9, -7.5, -0.4), (-21.4, -8.3, 2.1),
            (-21.9, -6.15, 0.6), (-21.6, -7.6, -1.1),
        ],
        m,
    )
    grupo_pessoas("OpEmbarque", [(-15.7, -4.6, 0.9), (-13.0, -6.6, -2.0), (-13.4, -6.9, 1.7)], m)
    grupo_pessoas("OpPorto", [(16.9, 10.3, 2.4), (17.3, 7.4, 1.4), (17.4, 12.2, -0.9), (13.6, 12.0, 0.3)], m)
    # OpScada saiu daqui na fase 14: as pessoas nascem dentro do campus da
    # central de controle, em `control_center.py`, na cota certa de cada patamar.

    pickup("PickupMina", -10.6, -10.4, m, yaw=0.35)
    pickup("PickupPorto", 13.9, 4.6, m, yaw=-0.5, cor=m["mrs_y"])

    # --- Fase 6: vestígios de um dia de trabalho --------------------------
    # A balanca foi para o acesso do porto: na garganta da mina os dois ramos
    # da alca e a estrada correm colados, e nao havia 0,6 de folga para ela.
    balanca("BalancaPorto", 10.8, 8.4, m, yaw=0.54)
    sucata("SucataOficina", -22.9, -7.55, m)
    tambores("TamboresOficina", -18.9, -10.6, m, yaw=0.3)
    tambores("TamboresPorto", 14.5, 4.2, m, n=4, yaw=-0.4)
    palete("PaleteOficina", -17.8, -10.3, m, yaw=0.2)
    palete("PaletePorto", 13.15, 4.85, m, yaw=-0.3, carga=False)
    # O contentor e o palete estavam dentro da caixa do TerminalCarvao.
    container_obra("ObraMina", -18.4, -11.0, m, yaw=0.28)
    container_obra("ObraPorto", 13.9, 3.6, m, yaw=-0.42, cor=m["cont"][3])

    for i, (x, z) in enumerate(((-19.6, -9.9), (-19.45, -10.05), (-19.3, -10.2))):
        cone_transito(f"ConeMina{i}", x, z, m)
    cone_transito("ConePorto0", 14.2, 4.3, m)

    poca("PocaEstrada", -11.8, -6.15, m, r=0.26, escala=(1.6, 0.9))
    poca("PocaPatioMina", -8.8, -4.0, m, r=0.2, escala=(1.3, 1.1))
    poca("PocaPorto", 14.9, 6.6, m, r=0.24, escala=(1.5, 0.8))
    poca("PocaPorto2", 13.2, 8.6, m, r=0.18, escala=(1.1, 1.4))
    mancha_oleo("OleoOficina", -21.9, -7.9, m)
    mancha_oleo("OleoPorto", 14.2, 7.3, m)

    # Prefixo "Sinal" e nao "Placa": "Placa" e o nome do tabuleiro de madeira.
    placa("SinalMina", -9.6, -2.6, m, yaw=0.5, largura=0.5, altura=0.24)
    placa("SinalPorto", 9.8, 4.0, m, yaw=-0.55, largura=0.5, altura=0.24)
    placa("SinalVia", -14.2, -3.9, m, yaw=0.1, largura=0.26, altura=0.16, mat=m["sig_r"], h=0.3)
    bandeiras("BandeirasPorto", 10.0, 2.4, m)

    # Fase 8: a linha corria por cima do que hoje e a pilha de esteril e a
    # bacia de decantacao. Agora ela chega de fora, a leste, ate a subestacao —
    # que e o sentido certo: energia entra no sitio, nao sai dele.
    linha_energia("LinhaMina", [(-11.6, -10.6), (-10.2, -11.4), (-8.8, -12.2), (-7.4, -13.0)], m)
