"""Cadeia de processo industrial — fase 1: fechar o fluxo do minério.

Antes desta fase a maquete tinha dois cenários isolados: a mina cuspia minério
numa correia curta que terminava no nada, e o porto tinha um navio que era
carregado por mágica. Aqui os dois viram uma coisa só, com cada equipamento
fisicamente ligado ao próximo:

    britador -> galeria A -> torre de transferência A -> galeria B
      -> silo de embarque ferroviário (sobre a via) -> vagões
      -> virador de vagões (porto) -> galeria C -> torre de transferência B
      -> galeria D (correia do pátio, com tripper para a pilha)
      -> pátio de estocagem + empilhadeira-recuperadora
      -> shiploader -> porão do navio

Convenção de coordenadas: igual ao resto dos scripts — (x, y, z) onde **y é
altura**. `coords.tloc` faz o swizzle para o Z-up do Blender.

Convenção de rotação de `primitives.cube`/`cyl`: `rot = (roll, yaw, pitch)`,
porque a chamada interna é `rotation=(rot[0], rot[2], rot[1])` e o Blender usa
Z para cima. Logo `rot[1]` gira no plano do tabuleiro.
"""

from __future__ import annotations

import math

import bpy

from .coords import tdim
from .curves import smooth_keys
from .primitives import cube, cyl, empty, join, parent_keep

# ---------------------------------------------------------------------------
# Geometria auxiliar
# ---------------------------------------------------------------------------

# Altura do topo do cais: tudo que fica no porto nasce em cima da laje, não no
# nível do tabuleiro, senão as pernas ficam enterradas.
Y_CAIS = 0.16


def _mid(p0, p1):
    return ((p0[0] + p1[0]) * 0.5, (p0[1] + p1[1]) * 0.5, (p0[2] + p1[2]) * 0.5)


def _lerp(p0, p1, t):
    return (
        p0[0] + (p1[0] - p0[0]) * t,
        p0[1] + (p1[1] - p0[1]) * t,
        p0[2] + (p1[2] - p0[2]) * t,
    )


def _eixo(p0, p1):
    """Comprimento, yaw e pitch de uma barra que vai de p0 até p1."""
    dx = p1[0] - p0[0]
    dy = p1[1] - p0[1]
    dz = p1[2] - p0[2]
    horiz = math.hypot(dx, dz)
    return math.hypot(horiz, dy), math.atan2(dz, dx), -math.atan2(dy, horiz)


def _off(p, yaw, lat=0.0, dy=0.0):
    """Desloca um ponto lateralmente (perpendicular ao yaw) e na vertical."""
    return (p[0] - math.sin(yaw) * lat, p[1] + dy, p[2] + math.cos(yaw) * lat)


def barra(name, p0, p1, w, h, mat, bevel_w=0.0):
    """Perfil metálico reto ligando dois pontos quaisquer do espaço."""
    length, yaw, pitch = _eixo(p0, p1)
    return cube(name, (length, h, w), _mid(p0, p1), mat, bevel_w, rot=(0, yaw, pitch))


def _escala(ob, sx, sy, sz):
    """Escala não uniforme aplicada (usada para alongar pilhas cônicas)."""
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    ob.scale = tdim(sx, sy, sz)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ob.select_set(False)
    return ob


# ---------------------------------------------------------------------------
# Galeria treliçada (correia coberta sobre cavaletes)
# ---------------------------------------------------------------------------


def galeria(name, p0, p1, m, w=0.26, h=0.30, passo=0.62, cavaletes=(), y_base=0.0):
    """Correia longa dentro de galeria treliçada, com cavaletes até o chão.

    `cavaletes` é uma lista de frações (0..1) do vão onde nascem os apoios —
    escolhidas manualmente para caírem longe do eixo da via.
    """
    length, yaw, _pitch = _eixo(p0, p1)
    half = w * 0.5
    n = max(3, int(round(length / passo)))
    partes = []

    # Fita e chapa de piso: o que o visitante realmente identifica como correia.
    partes.append(barra(f"{name}Fita", _off(p0, yaw, 0, 0.02), _off(p1, yaw, 0, 0.02), w * 0.68, 0.035, m["belt"]))
    partes.append(barra(f"{name}Piso", _off(p0, yaw, 0, -0.06), _off(p1, yaw, 0, -0.06), w, 0.04, m["steel"]))
    partes.append(barra(f"{name}Cobertura", _off(p0, yaw, 0, h + 0.05), _off(p1, yaw, 0, h + 0.05), w + 0.10, 0.04, m["steel_y"]))

    # Banzos inferiores e superiores dos dois lados.
    for i, lat in enumerate((-half, half)):
        partes.append(barra(f"{name}BanzoI{i}", _off(p0, yaw, lat, -0.11), _off(p1, yaw, lat, -0.11), 0.045, 0.045, m["steel"]))
        partes.append(barra(f"{name}BanzoS{i}", _off(p0, yaw, lat, h), _off(p1, yaw, lat, h), 0.045, 0.045, m["steel"]))

    # Montantes e diagonais: é o padrão zigue-zague que dá a leitura de treliça.
    for i in range(n + 1):
        a = _lerp(p0, p1, i / n)
        for k, lat in enumerate((-half, half)):
            partes.append(barra(f"{name}Mont{i}_{k}", _off(a, yaw, lat, -0.11), _off(a, yaw, lat, h), 0.035, 0.035, m["steel"]))
        if i < n:
            b = _lerp(p0, p1, (i + 1) / n)
            baixo, alto = (a, b) if i % 2 == 0 else (b, a)
            for k, lat in enumerate((-half, half)):
                partes.append(
                    barra(f"{name}Diag{i}_{k}", _off(baixo, yaw, lat, -0.11), _off(alto, yaw, lat, h), 0.03, 0.03, m["steel"])
                )

    # Cavaletes (as "pernas" da galeria).
    for i, t in enumerate(cavaletes):
        a = _lerp(p0, p1, t)
        for k, lat in enumerate((-half - 0.05, half + 0.05)):
            topo = _off(a, yaw, lat, -0.11)
            base = (topo[0], y_base, topo[2])
            partes.append(barra(f"{name}Cav{i}_{k}", base, topo, 0.07, 0.07, m["steel_y"]))
        # Travessa em X entre as duas pernas.
        meio = (a[1] + y_base) * 0.5
        e0 = _off(a, yaw, -half - 0.05, 0)
        e1 = _off(a, yaw, half + 0.05, 0)
        partes.append(barra(f"{name}CavX{i}", (e0[0], meio, e0[2]), (e1[0], meio, e1[2]), 0.04, 0.04, m["steel"]))

    return join(name, partes)


# ---------------------------------------------------------------------------
# Torre de transferência
# ---------------------------------------------------------------------------


def torre_transfer(name, x, z, m, altura=2.42, casa_h=0.72, lado=0.44, y_base=0.0):
    """Torre onde uma correia despeja na próxima.

    O nome NÃO pode começar com "Torre": `MaqueteBlender.tsx` esconde tudo que
    casa com /^torre/i (resto do aeroporto antigo). Daí o prefixo `Transf`.
    """
    partes = []
    topo = altura
    for i, (dx, dz) in enumerate(((-lado, -lado), (-lado, lado), (lado, -lado), (lado, lado))):
        partes.append(
            barra(f"{name}Col{i}", (x + dx, y_base, z + dz), (x + dx, topo - casa_h + 0.1, z + dz), 0.09, 0.09, m["steel"])
        )
    # Contraventamento em X nas duas faces mais visíveis.
    meio = (y_base + topo - casa_h) * 0.5
    partes.append(barra(f"{name}Cx0", (x - lado, y_base, z - lado), (x + lado, meio, z - lado), 0.04, 0.04, m["steel"]))
    partes.append(barra(f"{name}Cx1", (x + lado, y_base, z - lado), (x - lado, meio, z - lado), 0.04, 0.04, m["steel"]))
    partes.append(barra(f"{name}Cx2", (x - lado, y_base, z + lado), (x + lado, meio, z + lado), 0.04, 0.04, m["steel"]))
    partes.append(barra(f"{name}Cx3", (x + lado, y_base, z + lado), (x - lado, meio, z + lado), 0.04, 0.04, m["steel"]))

    casa_y = topo - casa_h * 0.5
    partes.append(cube(f"{name}Casa", (lado * 2 + 0.28, casa_h, lado * 2 + 0.24), (x, casa_y, z), m["conc"], 0.02))
    partes.append(cube(f"{name}Teto", (lado * 2 + 0.4, 0.07, lado * 2 + 0.36), (x, topo + 0.03, z), m["steel_y"], 0.012))
    partes.append(cube(f"{name}Chute", (0.2, 0.5, 0.2), (x, topo - casa_h - 0.2, z), m["black"], 0.015))
    # Escada de marinheiro encostada numa das colunas.
    partes.append(barra(f"{name}Esc", (x + lado + 0.12, y_base, z), (x + lado + 0.12, topo - casa_h, z), 0.05, 0.05, m["steel_y"]))
    for i in range(6):
        yy = y_base + (i + 1) * (topo - casa_h - y_base) / 7.0
        partes.append(cube(f"{name}Deg{i}", (0.16, 0.02, 0.02), (x + lado + 0.16, yy, z), m["steel_y"], 0.0))
    return join(name, partes)


# ---------------------------------------------------------------------------
# Silo de embarque ferroviário (mina)
# ---------------------------------------------------------------------------


def silo_embarque(name, x, z, yaw, m, y_base=0.0):
    """Pórtico sobre a via com dois silos e bicas de carregamento.

    O trem passa por baixo; a bica desce até ~1.05 e o vagão carregado tem topo
    em ~0.65, então sobra folga de gabarito.
    """
    partes = []
    ao = (math.cos(yaw), math.sin(yaw))   # direção da via
    tr = (-math.sin(yaw), math.cos(yaw))  # transversal

    def pt(a, t, y):
        return (x + ao[0] * a + tr[0] * t, y, z + ao[1] * a + tr[1] * t)

    topo = 2.98
    for i, (a, t) in enumerate(((-1.05, -0.98), (-1.05, 0.98), (1.05, -0.98), (1.05, 0.98))):
        partes.append(barra(f"{name}Perna{i}", pt(a, t, y_base), pt(a, t, topo), 0.15, 0.15, m["steel"]))
    # Vigas do topo do pórtico.
    partes.append(barra(f"{name}VigaT0", pt(-1.05, -0.98, topo), pt(-1.05, 0.98, topo), 0.16, 0.16, m["steel"]))
    partes.append(barra(f"{name}VigaT1", pt(1.05, -0.98, topo), pt(1.05, 0.98, topo), 0.16, 0.16, m["steel"]))
    partes.append(barra(f"{name}VigaL0", pt(-1.05, -0.98, topo), pt(1.05, -0.98, topo), 0.14, 0.14, m["steel"]))
    partes.append(barra(f"{name}VigaL1", pt(-1.05, 0.98, topo), pt(1.05, 0.98, topo), 0.14, 0.14, m["steel"]))
    # Contraventamento em X nas laterais (fora do gabarito do trem).
    partes.append(barra(f"{name}Bx0", pt(-1.05, -0.98, y_base + 0.2), pt(1.05, -0.98, topo - 0.2), 0.05, 0.05, m["steel"]))
    partes.append(barra(f"{name}Bx1", pt(1.05, -0.98, y_base + 0.2), pt(-1.05, -0.98, topo - 0.2), 0.05, 0.05, m["steel"]))
    partes.append(barra(f"{name}Bx2", pt(-1.05, 0.98, y_base + 0.2), pt(1.05, 0.98, topo - 0.2), 0.05, 0.05, m["steel"]))
    partes.append(barra(f"{name}Bx3", pt(1.05, 0.98, y_base + 0.2), pt(-1.05, 0.98, topo - 0.2), 0.05, 0.05, m["steel"]))

    # Passarelas laterais (o vão central fica livre para as bicas).
    for i, t in enumerate((-0.78, 0.78)):
        p = pt(0.0, t, 2.76)
        partes.append(cube(f"{name}Passarela{i}", (2.3, 0.07, 0.42), p, m["steel_y"], 0.01, rot=(0, yaw, 0)))
        partes.append(cube(f"{name}Corrimao{i}", (2.3, 0.22, 0.03), pt(0.0, t + (0.2 if i else -0.2), 2.9), m["steel_y"], 0.0, rot=(0, yaw, 0)))

    # Dois silos com fundo cônico e bica.
    for i, a in enumerate((-0.45, 0.45)):
        c = pt(a, 0.0, 2.10)
        partes.append(cyl(f"{name}Silo{i}", 0.5, 1.1, c, m["conc"], 20))
        partes.append(cyl(f"{name}SiloTopo{i}", 0.54, 0.08, pt(a, 0.0, 2.69), m["steel_y"], 20))
        partes.append(cyl(f"{name}Bica{i}", 0.16, 0.52, pt(a, 0.0, 1.30), m["black"], 14, r2=0.42))
        partes.append(cyl(f"{name}Boca{i}", 0.18, 0.12, pt(a, 0.0, 1.02), m["steel_y"], 14))

    # Cabine do operador, pendurada num dos cantos do pórtico.
    cab = pt(-1.35, 1.02, 2.35)
    partes.append(cube(f"{name}Cabine", (0.58, 0.5, 0.52), cab, m["white"], 0.03, rot=(0, yaw, 0)))
    partes.append(cube(f"{name}CabineVidro", (0.46, 0.2, 0.03), pt(-1.35, 0.74, 2.42), m["glass"], 0.0, rot=(0, yaw, 0)))
    partes.append(barra(f"{name}CabinePe", pt(-1.35, 1.02, y_base), pt(-1.35, 1.02, 2.10), 0.09, 0.09, m["steel"]))

    # Escada inclinada do chão até a passarela.
    partes.append(barra(f"{name}Escada", pt(-1.6, -1.15, y_base), pt(-0.6, -0.98, 2.72), 0.32, 0.05, m["steel_y"]))
    return join(name, partes)


# ---------------------------------------------------------------------------
# Virador de vagões (porto)
# ---------------------------------------------------------------------------


def virador_vagoes(name, x, z, yaw, m, y_base=Y_CAIS):
    """Car dumper: casa aberta nas pontas com o tambor girando sobre a via.

    Devolve `(casa, eixo)` — `eixo` é o empty animado que gira o tambor.
    """
    ao = (math.cos(yaw), math.sin(yaw))
    tr = (-math.sin(yaw), math.cos(yaw))

    def pt(a, t, y):
        return (x + ao[0] * a + tr[0] * t, y, z + ao[1] * a + tr[1] * t)

    casa = []
    topo = 2.3
    for i, (a, t) in enumerate(((-1.05, -0.85), (-1.05, 0.85), (1.05, -0.85), (1.05, 0.85))):
        casa.append(barra(f"{name}Col{i}", pt(a, t, y_base - 0.05), pt(a, t, topo), 0.15, 0.15, m["conc"]))
    casa.append(cube(f"{name}Teto", (2.4, 0.14, 1.98), pt(0, 0, topo + 0.07), m["steel_y"], 0.02, rot=(0, yaw, 0)))
    # Só o painel superior é fechado: por baixo o visitante vê o tambor.
    for i, t in enumerate((-0.85, 0.85)):
        casa.append(cube(f"{name}Painel{i}", (2.3, 0.72, 0.07), pt(0, t, 1.86), m["white"], 0.012, rot=(0, yaw, 0)))
        casa.append(cube(f"{name}Faixa{i}", (2.3, 0.08, 0.09), pt(0, t, 1.46), m["steel_y"], 0.0, rot=(0, yaw, 0)))
    # Poço de recepção sob o tambor (só a boca aparece).
    casa.append(cube(f"{name}Poco", (1.5, 0.6, 1.3), pt(0, 0, y_base - 0.28), m["black"], 0.02, rot=(0, yaw, 0)))
    casa.append(cube(f"{name}PocoGrelha", (1.5, 0.05, 1.3), pt(0, 0, y_base - 0.01), m["steel"], 0.0, rot=(0, yaw, 0)))
    # Casa de comando ao lado.
    casa.append(cube(f"{name}Comando", (0.75, 0.62, 0.62), pt(-1.7, 1.0, y_base + 0.31), m["white"], 0.03, rot=(0, yaw, 0)))
    casa.append(cube(f"{name}ComandoVidro", (0.6, 0.24, 0.03), pt(-1.7, 0.68, y_base + 0.42), m["glass"], 0.0, rot=(0, yaw, 0)))
    casa_ob = join(name, casa)

    # Tambor: dois anéis e as barras que os unem, tudo pendurado num empty que
    # gira em torno do eixo da via.
    eixo_y = y_base + 0.52
    base = empty(f"{name}Base", (x, eixo_y, z))
    base.rotation_euler = (0, 0, yaw)
    eixo = empty(f"{name}Eixo", (x, eixo_y, z))
    eixo.parent = base
    eixo.location = (0, 0, 0)

    tambor = []
    for i, a in enumerate((-0.46, 0.46)):
        tambor.append(cyl(f"{name}Anel{i}", 0.62, 0.1, pt(a, 0, eixo_y), m["steel_y"], 20, rot=(0, yaw, math.pi / 2)))
        tambor.append(cyl(f"{name}AnelInt{i}", 0.5, 0.12, pt(a, 0, eixo_y), m["black"], 18, rot=(0, yaw, math.pi / 2)))
    for i, ang in enumerate((0.0, math.tau / 3, 2 * math.tau / 3)):
        dy = 0.56 * math.cos(ang)
        dt = 0.56 * math.sin(ang)
        tambor.append(barra(f"{name}Barra{i}", pt(-0.52, dt, eixo_y + dy), pt(0.52, dt, eixo_y + dy), 0.07, 0.07, m["steel"]))
    # Mesa e grampo que prendem o vagão de cabeça para baixo.
    tambor.append(cube(f"{name}Mesa", (1.0, 0.06, 0.62), pt(0, 0, eixo_y - 0.42), m["steel"], 0.0, rot=(0, yaw, 0)))
    tambor.append(cube(f"{name}Grampo", (1.0, 0.08, 0.16), pt(0, 0, eixo_y + 0.4), m["steel_y"], 0.0, rot=(0, yaw, 0)))
    tambor_ob = join(f"{name}Tambor", tambor)
    parent_keep(tambor_ob, eixo)

    # Ciclo: entra vagão, gira 160°, despeja, volta.
    for f in range(1, 241):
        if f < 60:
            ang = 0.0
        elif f < 100:
            ang = 2.79 * (f - 60) / 40.0
        elif f < 150:
            ang = 2.79
        elif f < 190:
            ang = 2.79 * (1.0 - (f - 150) / 40.0)
        else:
            ang = 0.0
        eixo.rotation_euler = (ang, 0, 0)
        eixo.keyframe_insert("rotation_euler", frame=f)
    smooth_keys(eixo)
    return casa_ob, eixo


# ---------------------------------------------------------------------------
# Pátio de estocagem e empilhadeira-recuperadora
# ---------------------------------------------------------------------------


def patio_estocagem(m, y_base=Y_CAIS):
    """Trilhos da empilhadeira, pilha de homogeneização e pilha secundária."""
    trilhos = []
    for i, z in enumerate((11.6, 13.0)):
        trilhos.append(cube(f"PatioTrilhosSol{i}", (3.1, 0.12, 0.3), (15.5, y_base + 0.06, z), m["conc"], 0.01))
        trilhos.append(cube(f"PatioTrilhosTri{i}", (3.1, 0.05, 0.07), (15.5, y_base + 0.15, z), m["rail"], 0.0))
    join("PatioTrilhos", trilhos)

    # Pilha alongada (ângulo de repouso ~37°: altura = raio * tan37).
    pilha = cyl("PilhaPatio", 0.7, 0.53, (15.4, y_base + 0.265, 12.3), m["ore"], 22, r2=0.05)
    _escala(pilha, 1.7, 1.0, 1.0)
    # Pilha menor de carvão, alimentada por caminhão.
    # Ao sul do ramal: no lado norte ela brigava com o virador e com a
    # torre de transferencia B.
    pilha2 = cyl("PilhaPatio2", 0.55, 0.44, (15.4, y_base + 0.22, 4.35), m["coal"], 18, r2=0.05)
    _escala(pilha2, 1.35, 1.0, 1.0)


def empilhadeira(m, y_base=Y_CAIS):
    """Empilhadeira-recuperadora sobre trilhos, com lança que gira."""
    x, zc = 16.85, 12.3
    partes = []
    for i, z in enumerate((11.6, 13.0)):
        partes.append(barra(f"EmpilhPerna{i}", (x, y_base + 0.2, z), (x, y_base + 1.42, z), 0.15, 0.15, m["steel_y"]))
        partes.append(cube(f"EmpilhTruque{i}", (0.55, 0.22, 0.26), (x, y_base + 0.24, z), m["black"], 0.015))
    partes.append(barra("EmpilhViga", (x, y_base + 1.5, 11.6), (x, y_base + 1.5, 13.0), 0.24, 0.18, m["steel_y"]))
    partes.append(barra("EmpilhX0", (x, y_base + 0.25, 11.6), (x, y_base + 1.42, 13.0), 0.05, 0.05, m["steel"]))
    partes.append(barra("EmpilhX1", (x, y_base + 0.25, 13.0), (x, y_base + 1.42, 11.6), 0.05, 0.05, m["steel"]))
    partes.append(cube("EmpilhTorreta", (0.4, 0.42, 0.4), (x, y_base + 1.78, zc), m["steel_y"], 0.02))
    partes.append(cube("EmpilhCabine", (0.36, 0.34, 0.34), (x + 0.42, y_base + 1.7, zc - 0.5), m["white"], 0.02))
    join("EmpilhPortico", partes)

    pivo = (x, y_base + 1.98, zc)
    lanca_ob = empty("EmpilhLanca", pivo)
    braco = []
    ponta = (x - 1.8, y_base + 1.05, zc)
    braco.append(barra("EmpilhBraco", (x - 0.2, y_base + 1.98, zc), ponta, 0.16, 0.14, m["steel_y"]))
    braco.append(barra("EmpilhTirante", (x, y_base + 2.32, zc), (x - 1.55, y_base + 1.18, zc), 0.03, 0.03, m["steel"]))
    braco.append(barra("EmpilhMastro", (x, y_base + 1.98, zc), (x, y_base + 2.34, zc), 0.09, 0.09, m["steel_y"]))
    braco.append(barra("EmpilhContra", (x + 0.18, y_base + 1.98, zc), (x + 0.62, y_base + 2.06, zc), 0.2, 0.18, m["black"]))
    # Roda de caçambas na ponta: o detalhe que identifica a máquina.
    braco.append(cyl("EmpilhRoda", 0.22, 0.09, ponta, m["steel"], 16, rot=(0, math.pi / 2, math.pi / 2)))
    braco.append(cyl("EmpilhRodaInt", 0.13, 0.11, ponta, m["black"], 12, rot=(0, math.pi / 2, math.pi / 2)))
    braco_ob = join("EmpilhBracoConj", braco)
    parent_keep(braco_ob, lanca_ob)

    for f in range(1, 241):
        u = (f - 1) / 240.0 * math.tau
        lanca_ob.rotation_euler = (0, 0, 0.3 * math.sin(u))
        lanca_ob.keyframe_insert("rotation_euler", frame=f)
    smooth_keys(lanca_ob)
    return lanca_ob


# ---------------------------------------------------------------------------
# Shiploader (carregador de navios)
# ---------------------------------------------------------------------------


def shiploader(m, y_base=Y_CAIS):
    x, z = 20.4, 10.6
    partes = []
    for i, (dx, dz) in enumerate(((-0.25, -0.4), (-0.25, 0.4), (0.25, -0.4), (0.25, 0.4))):
        partes.append(barra(f"ShiploaderPerna{i}", (x + dx, y_base, z + dz), (x + dx, 2.15, z + dz), 0.13, 0.13, m["steel_y"]))
        partes.append(cube(f"ShiploaderTruque{i}", (0.3, 0.2, 0.24), (x + dx, y_base + 0.1, z + dz), m["black"], 0.015))
    partes.append(barra("ShiploaderX0", (x - 0.25, y_base + 0.15, z - 0.4), (x + 0.25, 2.05, z - 0.4), 0.05, 0.05, m["steel"]))
    partes.append(barra("ShiploaderX1", (x + 0.25, y_base + 0.15, z - 0.4), (x - 0.25, 2.05, z - 0.4), 0.05, 0.05, m["steel"]))
    partes.append(barra("ShiploaderX2", (x - 0.25, y_base + 0.15, z + 0.4), (x + 0.25, 2.05, z + 0.4), 0.05, 0.05, m["steel"]))
    partes.append(barra("ShiploaderX3", (x + 0.25, y_base + 0.15, z + 0.4), (x - 0.25, 2.05, z + 0.4), 0.05, 0.05, m["steel"]))
    partes.append(cube("ShiploaderDeck", (0.95, 0.16, 1.15), (x, 2.23, z), m["steel_y"], 0.02))
    partes.append(cube("ShiploaderMaquinas", (0.5, 0.4, 0.6), (x - 0.28, 2.51, z), m["white"], 0.025))
    partes.append(barra("ShiploaderMastro", (x, 2.31, z), (x, 3.22, z), 0.14, 0.14, m["steel_y"]))
    partes.append(cube("ShiploaderCabine", (0.34, 0.32, 0.36), (x + 0.02, 2.55, z - 0.62), m["white"], 0.02))
    partes.append(cube("ShiploaderCabineVidro", (0.28, 0.16, 0.03), (x + 0.02, 2.6, z - 0.79), m["glass"], 0.0))
    join("ShiploaderTorre", partes)

    pivo = (x + 0.2, 2.3, z)
    lanca_ob = empty("ShipLanca", pivo)
    braco = []
    ponta = (x + 2.15, 2.62, z)
    braco.append(barra("ShipBraco", pivo, ponta, 0.22, 0.2, m["steel_y"]))
    braco.append(barra("ShipBracoFita", (pivo[0], pivo[1] + 0.13, pivo[2]), (ponta[0], ponta[1] + 0.13, ponta[2]), 0.16, 0.03, m["belt"]))
    braco.append(barra("ShipTirante", (x, 3.2, z), ((pivo[0] + ponta[0]) * 0.5, 2.5, z), 0.03, 0.03, m["steel"]))
    braco.append(barra("ShipContra", (x + 0.1, 2.3, z), (x - 0.62, 2.24, z), 0.26, 0.24, m["black"]))
    # Bica telescópica que entra no porão.
    braco.append(cyl("ShipBica", 0.12, 0.9, (ponta[0] - 0.12, 2.1, z), m["steel"], 14))
    braco.append(cyl("ShipBicaBoca", 0.16, 0.14, (ponta[0] - 0.12, 1.62, z), m["black"], 14))
    braco_ob = join("ShipBracoConj", braco)
    parent_keep(braco_ob, lanca_ob)

    for f in range(1, 241):
        u = (f - 1) / 240.0 * math.tau
        # Pitch positivo em Blender Y baixa a ponta da lança (eixo local +X).
        lanca_ob.rotation_euler = (0, 0.055 * math.sin(u * 0.9), 0)
        lanca_ob.keyframe_insert("rotation_euler", frame=f)
    smooth_keys(lanca_ob)
    return lanca_ob


# ---------------------------------------------------------------------------
# Montagem da cadeia
# ---------------------------------------------------------------------------

# Pontos fixos, todos conferidos à mão contra os traçados de `railway.py`
# (ramo da mina e ramo do porto) e contra as estradas de `roads.py`.
# A galeria A tem de cruzar a pilha do poco de carvao (centro -19.4/-6.15,
# 1.12 de altura), que fica exatamente entre o britador e o resto do sitio: as
# duas cavas se interpenetram e nao sobra corredor por fora. Dai o vao livre
# de 5.06 sem cavalete nenhum, com 0.37 de folga sobre o topo da pilha - que e
# como uma transportadora de longa distancia atravessa um patio de verdade.
BRIT_SAIDA = (-20.35, 1.15, -7.5)
TRANSF_A = (-16.8, -3.9)
TRANSF_A_TOPO = (-16.8, 2.35, -3.9)
EMBARQUE = (-13.6, -5.624)
EMBARQUE_YAW = 0.1049
EMBARQUE_TOPO = (-13.6, 2.65, -5.624)

VIRADOR = (15.2, 8.563)
VIRADOR_YAW = 0.526
VIRADOR_SAIDA = (15.55, 1.05, 8.7)
TRANSF_B = (13.9, 11.0)
TRANSF_B_TOPO_C = (13.9, 2.0, 11.0)
TRANSF_B_TOPO_D = (13.9, 1.95, 11.0)
SHIP_ENTRADA = (20.4, 2.3, 10.6)


def build_process_chain(m):
    """Constrói toda a cadeia. Chamada depois de `build_port` em `main.py`."""
    # --- Lado mina ---------------------------------------------------------
    galeria("GaleriaA", BRIT_SAIDA, TRANSF_A_TOPO, m, cavaletes=())
    torre_transfer("TransfA", TRANSF_A[0], TRANSF_A[1], m, altura=2.77, casa_h=0.72)
    galeria("GaleriaB", TRANSF_A_TOPO, EMBARQUE_TOPO, m, cavaletes=(0.3, 0.62))
    silo_embarque("EmbarqueFerro", EMBARQUE[0], EMBARQUE[1], EMBARQUE_YAW, m)

    # --- Lado porto --------------------------------------------------------
    virador_vagoes("Virador", VIRADOR[0], VIRADOR[1], VIRADOR_YAW, m)
    galeria("GaleriaC", VIRADOR_SAIDA, TRANSF_B_TOPO_C, m, cavaletes=(0.45, 0.78), y_base=Y_CAIS)
    torre_transfer("TransfB", TRANSF_B[0], TRANSF_B[1], m, altura=2.35, casa_h=0.7, y_base=Y_CAIS)
    gal_d = galeria("GaleriaD", TRANSF_B_TOPO_D, SHIP_ENTRADA, m, cavaletes=(0.22, 0.45, 0.68, 0.86), y_base=Y_CAIS)

    # Tripper: desvia parte do fluxo da galeria D para cima da pilha.
    trip = []
    trip.append(cube("GaleriaDTripper", (0.42, 0.4, 0.42), (15.6, 2.15, 10.9), m["steel_y"], 0.02))
    trip.append(barra("GaleriaDChute", (15.6, 1.98, 10.95), (15.6, 0.85, 11.72), 0.16, 0.12, m["black"]))
    trip.append(barra("GaleriaDChutePe", (15.6, Y_CAIS, 11.72), (15.6, 0.85, 11.72), 0.07, 0.07, m["steel"]))
    trip_ob = join("GaleriaDTripperConj", trip)
    if gal_d and trip_ob:
        join("GaleriaD", [gal_d, trip_ob])

    patio_estocagem(m)
    empilhadeira(m)
    shiploader(m)
