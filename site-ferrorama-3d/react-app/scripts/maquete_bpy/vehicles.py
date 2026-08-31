from __future__ import annotations

import math

from .coords import RX
from .curves import ease_inout, linear_keys, smooth_keys
from .primitives import cube, cyl, empty, ico, join, parent, parent_keep, wheels


def build_volvo_cat(m, road_mine):
    vx, vz = -12.55, -6.75
    volvo = empty("Volvo", (vx, 0.0, vz))
    parent(cube("VBody", (0.62, 0.32, 0.85), (0, 0, 0), m["volvo"], 0.045), volvo, (0, 0.38, 0))
    parent(cube("VCab", (0.5, 0.34, 0.42), (0, 0, 0), m["volvo"], 0.03), volvo, (0, 0.72, 0.12))
    parent(cube("VGlass", (0.42, 0.18, 0.04), (0, 0, 0), m["glass"], 0.005), volvo, (0, 0.78, 0.34))
    parent(cyl("VTrackL", 0.12, 0.7, (0, 0, 0), m["black"], 12, (math.pi / 2, 0, 0)), volvo, (-0.32, 0.14, 0))
    parent(cyl("VTrackR", 0.12, 0.7, (0, 0, 0), m["black"], 12, (math.pi / 2, 0, 0)), volvo, (0.32, 0.14, 0))
    braco = empty("VolvoBraco", (vx + 0.08, 0.58, vz + 0.3))
    parent_keep(braco, volvo)
    boom = cube("VBoom", (0.12, 0.1, 1.15), (0, 0, 0), m["black"], 0.02)
    stick = cube("VStick", (0.1, 0.7, 0.1), (0, 0, 0), m["black"], 0.015)
    bucket = cube("VBucket", (0.38, 0.16, 0.28), (0, 0, 0), m["black"], 0.012)
    parent(boom, braco, (0, 0.08, 0.52))
    parent(stick, braco, (0, -0.18, 1.05))
    parent(bucket, braco, (0, -0.42, 1.05))
    for t, dx in enumerate((-0.12, -0.04, 0.04, 0.12)):
        parent(cube(f"VTooth{t}", (0.05, 0.05, 0.1), (0, 0, 0), m["black"], 0.004), braco, (dx, -0.5, 1.22))
    for f in range(1, 241):
        u = (f - 1) / 240.0 * math.tau
        ang = 0.12 + 0.38 * math.sin(u * 2.0) + 0.08 * math.sin(u * 4.0)
        braco.rotation_euler = (ang, 0, 0)
        braco.keyframe_insert("rotation_euler", frame=f)
    smooth_keys(braco)

    cat = empty("CAT", (vx + 1.15, 0.0, vz + 0.15))
    parent(cube("CChassi", (0.7, 0.22, 1.35), (0, 0, 0), m["cat"], 0.04), cat, (0, 0.32, 0))
    parent(cube("CCab", (0.55, 0.42, 0.5), (0, 0, 0), m["cat"], 0.035), cat, (0, 0.68, 0.28))
    parent(cube("CGlass", (0.46, 0.2, 0.04), (0, 0, 0), m["glass"], 0.004), cat, (0, 0.74, 0.54))
    cacamba = empty("CATCacamba", (0, 0, 0))
    parent(cacamba, cat, (0, 0.45, -0.52))
    parent(cube("CBed", (0.72, 0.38, 0.85), (0, 0, 0), m["cat"], 0.03), cacamba, (0, 0.1, 0))
    parent(cube("COre", (0.55, 0.2, 0.65), (0, 0, 0), m["ore"], 0.02), cacamba, (0, 0.38, 0))
    wheels(cat, m["black"], (-0.38, 0.38), (-0.5, 0.05, 0.48), r=0.16, y=0.16, depth=0.12)
    parent(cube("C137", (0.02, 0.1, 0.18), (0, 0, 0), m["black"], 0.002), cat, (0.36, 0.7, 0.28))
    # Posição/rotação do CAT: React (polilinha reta no asfalto). Só a caçamba anima aqui.
    for f in range(1, 241):
        if f < 132:
            dump = 0.0
        elif f < 148:
            dump = 0.62 * ease_inout((f - 132) / 16)
        elif f < 166:
            dump = 0.62
        elif f < 180:
            dump = 0.62 * (1.0 - ease_inout((f - 166) / 14))
        else:
            dump = 0.0
        cacamba.rotation_euler = (dump, 0, 0)
        cacamba.keyframe_insert("rotation_euler", frame=f)
    linear_keys(cacamba)


# ---------------------------------------------------------------------------
# Fase 9 — composicao articulada
# ---------------------------------------------------------------------------

# Distancia entre centros de vagao. A gondola tem 0,80 de caixa; o resto e o
# engate. Serve tambem do lado do React, que espaca os vagoes na curva por
# comprimento de arco — se mudar aqui, muda `PASSO_VAGAO` em MaqueteBlender.tsx.
PASSO_VAGAO = 0.86
N_VAGOES = 7


def _rodeiro(nome, m, x0, z0, r=0.075, larg=0.5):
    """Um eixo montado: duas rodas ligadas pelo eixo."""
    p = [
        cyl(f"{nome}A", 0.014, larg, (x0, r, z0), m["black"], 8, rot=(0, 0, math.pi / 2)),
    ]
    for lado in (-1, 1):
        p.append(cyl(f"{nome}R{lado}", r, 0.055, (x0 + lado * larg * 0.5, r, z0), m["black"], 14, rot=(0, 0, math.pi / 2)))
    return p


def _locomotiva(m, cx, cz):
    """MRS diesel-eletrica: capo longo, cabine na traseira, truque de 3 eixos.

    Tudo nasce em coordenadas de mundo em volta de (cx, cz) e e fundido numa
    malha so. Sao 20 pecas que viram 1 draw call — a maquete e vista num
    celular, e cada malha extra e uma chamada de desenho a mais por quadro.
    """
    p = [
        # Estrado e capo longo (o nariz aponta para +z local).
        cube("TremLocoEstrado", (0.56, 0.08, 1.5), (cx, 0.19, cz), m["black"], 0.012),
        cube("TremLocoCapo", (0.46, 0.34, 0.92), (cx, 0.4, cz + 0.24), m["mrs_b"], 0.03),
        cube("TremLocoRad", (0.5, 0.26, 0.16), (cx, 0.44, cz + 0.76), m["mrs_b"], 0.02),
        cube("TremLocoGrade", (0.44, 0.18, 0.02), (cx, 0.44, cz + 0.85), m["black"], 0.004),
        # Cabine atras do capo, como nas GE/EMD da MRS.
        cube("TremLocoCab", (0.52, 0.36, 0.44), (cx, 0.45, cz - 0.42), m["mrs_b"], 0.025),
        cube("TremLocoTeto", (0.55, 0.04, 0.48), (cx, 0.65, cz - 0.42), m["mrs_y"], 0.01),
        cube("TremLocoVidroF", (0.42, 0.16, 0.02), (cx, 0.52, cz - 0.2), m["glass"], 0.004),
        cube("TremLocoVidroT", (0.42, 0.16, 0.02), (cx, 0.52, cz - 0.64), m["glass"], 0.004),
        cube("TremLocoVidroL", (0.02, 0.14, 0.3), (cx - 0.26, 0.52, cz - 0.42), m["glass"], 0.004),
        cube("TremLocoVidroR", (0.02, 0.14, 0.3), (cx + 0.26, 0.52, cz - 0.42), m["glass"], 0.004),
        # Faixa amarela de seguranca e o numero na lateral.
        cube("TremLocoFaixaL", (0.02, 0.09, 1.32), (cx - 0.28, 0.28, cz), m["mrs_y"], 0.004),
        cube("TremLocoFaixaR", (0.02, 0.09, 1.32), (cx + 0.28, 0.28, cz), m["mrs_y"], 0.004),
        cube("TremLocoNum", (0.02, 0.08, 0.2), (cx + 0.28, 0.46, cz - 0.42), m["white"], 0.002),
        # Farol, buzina e escape.
        cube("TremLocoFarol", (0.12, 0.07, 0.03), (cx, 0.56, cz + 0.9), m["glow"], 0.006),
        cyl("TremLocoEscape", 0.05, 0.1, (cx, 0.62, cz + 0.34), m["black"], 10),
        cyl("TremLocoBuzina", 0.02, 0.09, (cx, 0.69, cz - 0.3), m["steel"], 6, rot=(0, 0, math.pi / 2)),
        # Tanque de combustivel entre os truques: e o volume que falta quando
        # uma locomotiva de maquete parece leve demais.
        cube("TremLocoTanque", (0.36, 0.16, 0.6), (cx, 0.13, cz), m["black"], 0.015),
    ]
    for i, dz in enumerate((0.52, -0.52)):
        for j, ez in enumerate((-0.17, 0.0, 0.17)):
            p += _rodeiro(f"TremLocoT{i}E{j}", m, cx, cz + dz + ez, r=0.075, larg=0.5)
        p.append(cube(f"TremLocoTruque{i}", (0.44, 0.07, 0.52), (cx, 0.11, cz + dz), m["black"], 0.012))
    return p


def _gondola(m, cx, cz, i):
    """Gondola de minerio: caixa aberta, reforcos verticais e carga rasa.

    Carga rasa de proposito. Vagao de minerio de ferro sai do carregamento com
    o produto quase no nivel do bordo — quem ve pilha alta em maquete esta
    vendo carvao ou brita, nao minerio.
    """
    n = f"TremVagao{i}"
    p = [
        cube(f"{n}Piso", (0.52, 0.06, 0.8), (cx, 0.26, cz), m["black"], 0.01),
        cube(f"{n}LadoL", (0.03, 0.22, 0.8), (cx - 0.25, 0.38, cz), m["steel_rust"], 0.008),
        cube(f"{n}LadoR", (0.03, 0.22, 0.8), (cx + 0.25, 0.38, cz), m["steel_rust"], 0.008),
        cube(f"{n}TopoF", (0.52, 0.22, 0.03), (cx, 0.38, cz + 0.39), m["steel_rust"], 0.008),
        cube(f"{n}TopoT", (0.52, 0.22, 0.03), (cx, 0.38, cz - 0.39), m["steel_rust"], 0.008),
        cube(f"{n}Carga", (0.46, 0.09, 0.74), (cx, 0.44, cz), m["ore"], 0.02),
        cube(f"{n}Engate", (0.06, 0.05, 0.12), (cx, 0.25, cz + 0.45), m["black"], 0.006),
    ]
    for lado in (-1, 1):
        for dz in (-0.24, 0.0, 0.24):
            p.append(cube(f"{n}Ner{lado}{dz}", (0.02, 0.2, 0.03), (cx + lado * 0.27, 0.38, cz + dz), m["steel_rust"], 0.004))
    for k, dz in enumerate((0.26, -0.26)):
        for j, ez in enumerate((-0.08, 0.08)):
            p += _rodeiro(f"{n}T{k}E{j}", m, cx, cz + dz + ez, r=0.065, larg=0.48)
        p.append(cube(f"{n}Truque{k}", (0.4, 0.06, 0.3), (cx, 0.1, cz + dz), m["black"], 0.01))
    return p


def build_train(m):
    """Composicao articulada: cada veiculo e um no proprio na cena.

    Antes a locomotiva e os tres vagoes eram filhos rigidos de um unico
    `Trem`: o React posicionava o pai na curva e o resto ia junto, em linha
    reta. Nas curvas de raio 2,25 do oval a composicao cortava o traçado por
    dentro — o ultimo vagao chegava a sair do lastro.

    Agora cada veiculo vira uma malha fundida pendurada num `Empty` proprio
    (`TremLoco`, `TremVagao0..6`), e o React anda com cada um no seu ponto de
    comprimento de arco. O `Trem` continua existindo como raiz para o modo
    antigo — se um `.glb` velho for servido, o React nao acha os nos novos e
    volta a mover a composicao inteira.
    """
    # Os `Empty` nascem em y=0 e as pecas sao modeladas com a base da roda
    # tambem em y=0. Assim o offset que o React aplica na curva (0,08, o topo
    # do boleto) e exatamente a altura do boleto, sem correcao escondida.
    trem = empty("Trem", (RX, 0.0, 0))

    corpo = join("TremLocoCorpo", _locomotiva(m, RX, 0.0))
    loco = empty("TremLoco", (RX, 0.0, 0.0))
    parent_keep(corpo, loco)
    parent_keep(loco, trem)

    for i in range(N_VAGOES):
        z = -1.06 - i * PASSO_VAGAO
        malha = join(f"TremVagao{i}Corpo", _gondola(m, RX, z, i))
        eixo = empty(f"TremVagao{i}", (RX, 0.0, z))
        parent_keep(malha, eixo)
        parent_keep(eixo, trem)
    return trem
