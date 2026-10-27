"""Fase 16 — o chão deixa de ser uma mesa verde.

A crítica mais dura ao estado anterior era exata: a maquete parecia "uma
coleção de modelos 3D colocados sobre uma plataforma". A causa raiz é uma só —
o terreno era um plano. Uma grade lisa em y≈0, com 0,045 de ruído de nuvem só
para não ficar espelhada, e uma textura de grama por cima do tabuleiro inteiro.
Com o chão plano, todo objeto lê como peça pousada, por melhor que ele seja.

Este módulo troca isso por um campo de altura de verdade, e por uma cobertura
vegetal de borda irregular. Duas ideias sustentam tudo:

**1. Plataforma de corte e aterro.** Não dá para simplesmente ondular o chão:
há 500 objetos assentados em y=0, e a via férrea, que não pode subir nem
descer. Então o terreno é plano exatamente onde existe operação — que é o que
uma terraplenagem de verdade faz — e o relevo só cresce fora dela, com uma saia
de transição. O resultado é o da foto de referência: área industrial aplainada
no meio, morro verde em volta.

**2. Duas malhas, não uma textura misturada.** A transição entre grama e terra
precisa ser irregular, e multiplicar textura de grama por marrom só dá verde
sujo. Então o terreno base é de terra e a grama é uma segunda malha por cima,
construída face a face: onde a máscara de cobertura não passa do limiar, a face
simplesmente não existe. O recorte fica irregular de graça, e aparece solo
exposto exatamente onde há passagem de máquina.

Convenção de coordenadas e de rotação: igual ao resto (ver `process.py`).
"""

from __future__ import annotations

import math

import bpy

from .primitives import assign, cube, smooth, unwrap

# Tabuleiro. A grama antiga ia a 45,4 x 33,4; o terreno mantém a mesma área.
LARG, PROF = 45.4, 33.4
# Resolução da grade. Mais que isto não melhora a silhueta e pesa no celular.
NX, NZ = 152, 112
# Largura da saia entre a área aplainada e o relevo.
SAIA = 2.2
# Altura máxima do relevo de borda.
RELEVO = 0.78

# --- Fase 17: o mundo além do tabuleiro ---------------------------------
# O tabuleiro deixou de ter borda. Fora do retângulo detalhado entra uma malha
# grossa que sobe em morro arborizado até sumir na névoa, e a leste a água vai
# até o horizonte. Sem isso a maquete termina num corte reto no ar, e é esse
# corte que denuncia "quadrado sobre a mesa".
LARG_LONGE, PROF_LONGE = 280.0, 220.0
NX_L, NZ_L = 104, 82
# Onde a serra começa a subir, medido a partir da borda do tabuleiro.
RAMPA_LONGE = 16.0
# Limite da terra a leste: dali para lá é mar.
X_MAR = 21.0


# ---------------------------------------------------------------------------
# Áreas que precisam continuar planas
# ---------------------------------------------------------------------------

# (x0, x1, z0, z1) — retângulos onde há via, prédio ou pátio assentado em y=0.
PLANAS = [
    (-9.9, 9.9, -6.5, 6.5),      # oval inteiro, com folga do lastro
    (5.8, 21.6, 2.6, 14.8),      # alça e pátio do porto, cais
    (-20.6, -5.8, -11.4, -3.6),  # alça da mina
    (-24.0, -18.2, -11.6, -3.8),  # britagem, barracão, oficina, carvão
    (-22.6, -12.0, -16.4, -9.4),  # cava, estéril, bacia e a faixa industrial (fase 19)
    (-0.6, 10.2, 6.0, 15.8),     # terminal logístico
    (-22.4, -10.0, 6.0, 16.0),   # campus da central de controle
    (-11.4, 13.0, 5.2, 9.2),     # corredor da Avenida Norte
    (-17.4, -9.6, -4.8, 7.0),    # corredor da Avenida Oeste
    (-13.2, -6.0, -7.6, -2.0),   # estrada de serviço da mina e portaria
    (9.4, 12.8, 6.4, 9.4),       # ligação da avenida com o porto
]

# Morros nomeados, fora das áreas planas. (x, z, raio, altura)
MORROS = [
    (17.6, -13.4, 6.2, 1.05),
    (22.0, -6.5, 4.4, 0.80),
    (14.0, -9.0, 3.6, 0.52),
    (7.0, -14.6, 4.8, 0.72),
    (-3.5, -15.0, 4.4, 0.62),
    (-11.0, -15.4, 3.8, 0.55),
    (-20.6, 1.6, 5.0, 0.85),
    (-22.4, -1.6, 3.6, 0.62),
    (21.0, 1.0, 3.2, 0.45),
]

# Onde o solo e pisoteado e por isso nao cria grama. E um conjunto MENOR que o
# das areas planas: dentro do oval e entre os trilhos a grama cresce normal —
# so nao cresce onde passa maquina. Confundir as duas listas deixava dois tercos
# do tabuleiro como terreiro de terra.
PISOTEADO = [
    (-24.0, -18.2, -11.6, -3.8),   # patio de britagem
    (-22.6, -12.0, -16.4, -9.4),   # cava, esteril, bacia e a faixa industrial
    (13.2, 21.6, 3.2, 14.0),       # laje do cais
    (-0.2, 9.6, 6.6, 15.4),        # patio do terminal logistico
    (-21.8, -10.6, 6.6, 11.6),     # patio da central de controle
    (-13.0, -7.8, -7.2, -3.6),     # estrada de servico da mina
]


def _dist_pisoteado(x, z):
    melhor = 1e9
    for x0, x1, z0, z1 in PISOTEADO:
        d = math.hypot(max(x0 - x, 0.0, x - x1), max(z0 - z, 0.0, z - z1))
        if d < melhor:
            melhor = d
            if melhor <= 0.0:
                return 0.0
    return melhor


def _hash(x, z, s=0.0):
    n = math.sin(x * 127.1 + z * 311.7 + s * 74.7) * 43758.5453
    return n - math.floor(n)


def _valor(x, z, s=0.0):
    """Ruído de valor com interpolação suave — base do relevo."""
    xi, zi = math.floor(x), math.floor(z)
    fx, fz = x - xi, z - zi
    ux = fx * fx * (3 - 2 * fx)
    uz = fz * fz * (3 - 2 * fz)
    a = _hash(xi, zi, s)
    b = _hash(xi + 1, zi, s)
    c = _hash(xi, zi + 1, s)
    d = _hash(xi + 1, zi + 1, s)
    return (a * (1 - ux) + b * ux) * (1 - uz) + (c * (1 - ux) + d * ux) * uz


def _fbm(x, z, s=0.0, oitavas=3):
    """Ruído somado em oitavas: dá encosta grande e rugosidade junto."""
    v, amp, freq = 0.0, 1.0, 1.0
    total = 0.0
    for i in range(oitavas):
        v += _valor(x * freq, z * freq, s + i * 13.7) * amp
        total += amp
        amp *= 0.48
        freq *= 2.1
    return v / total


def _dist_plana(x, z):
    """Distância até a área plana mais próxima. Zero se estiver dentro."""
    melhor = 1e9
    for x0, x1, z0, z1 in PLANAS:
        dx = max(x0 - x, 0.0, x - x1)
        dz = max(z0 - z, 0.0, z - z1)
        d = math.hypot(dx, dz)
        if d < melhor:
            melhor = d
            if melhor <= 0.0:
                return 0.0
    return melhor


def _suave(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def altura(x, z):
    """Cota do terreno. Plana na operação, com relevo fora dela."""
    d = _dist_plana(x, z)
    if d <= 0.0:
        # Micro-relevo dentro do pátio: terraplenagem também não é vidro.
        return (_fbm(x * 0.7, z * 0.7, 91.0) - 0.5) * 0.024
    peso = _suave(d / SAIA)
    h = (_fbm(x * 0.16, z * 0.16, 3.0) - 0.42) * RELEVO
    h += (_fbm(x * 0.55, z * 0.55, 17.0) - 0.5) * RELEVO * 0.3
    for mx, mz, raio, alt in MORROS:
        r = math.hypot(x - mx, z - mz)
        if r < raio:
            k = _suave(1.0 - r / raio)
            h += alt * k * k
    # Recorta o relevo contra a borda do tabuleiro para nao criar penhasco.
    borda = min(LARG * 0.5 - abs(x), PROF * 0.5 - abs(z))
    h *= _suave(borda / 1.6)
    return max(0.0, h) * peso + (_fbm(x * 1.4, z * 1.4, 55.0) - 0.5) * 0.02 * peso


def altura_longe(x, z):
    """Relevo fora do tabuleiro. Cresce com a distância, como serra ao fundo.

    Encosta no zero exatamente na borda do retângulo detalhado — onde o relevo
    interno também já foi recortado para zero —, então a emenda entre as duas
    malhas não aparece mesmo com resoluções diferentes.
    """
    dx = max(0.0, abs(x) - LARG * 0.5)
    dz = max(0.0, abs(z) - PROF * 0.5)
    d = math.hypot(dx, dz)
    if d <= 0.0:
        return 0.0
    rampa = _suave(d / RAMPA_LONGE)
    # A escala cresce com a distância: morro perto, serra longe.
    escala = min(1.0 + d * 0.085, 7.5)
    h = (_fbm(x * 0.052, z * 0.052, 7.0) - 0.34) * 3.0
    h += (_fbm(x * 0.135, z * 0.135, 23.0) - 0.5) * 1.0
    return max(0.0, h) * rampa * escala


def cobertura(x, z):
    """Quanto de grama há neste ponto. 0 = solo exposto, 1 = grama fechada.

    Perto da operação o solo é pisado e não cria grama; longe, fecha. O ruído
    embaralha a fronteira para ela nunca virar uma linha geométrica.
    """
    d = _dist_pisoteado(x, z)
    base = _suave((d - 0.2) / 2.0)
    ruido = _fbm(x * 0.85, z * 0.85, 29.0)
    return base * 0.72 + ruido * 0.5 - 0.05


# ---------------------------------------------------------------------------


def _grade(name, mat, offset, so_cobertos, limiar=0.5):
    """Monta uma grade deslocada pelo campo de altura.

    `so_cobertos` liga o recorte: a face só nasce se os quatro cantos passarem
    do limiar de cobertura. É isso que dá o contorno irregular entre grama e
    terra, sem custar textura de máscara nenhuma.
    """
    verts, faces = [], []
    idx = {}
    for j in range(NZ + 1):
        z = -PROF * 0.5 + PROF * j / NZ
        for i in range(NX + 1):
            x = -LARG * 0.5 + LARG * i / NX
            idx[(i, j)] = len(verts)
            verts.append((x, z, altura(x, z) + offset))
    for j in range(NZ):
        for i in range(NX):
            if so_cobertos:
                xs = (-LARG * 0.5 + LARG * i / NX, -LARG * 0.5 + LARG * (i + 1) / NX)
                zs = (-PROF * 0.5 + PROF * j / NZ, -PROF * 0.5 + PROF * (j + 1) / NZ)
                if min(cobertura(a, b) for a in xs for b in zs) < limiar:
                    continue
            faces.append((idx[(i, j)], idx[(i + 1, j)], idx[(i + 1, j + 1)], idx[(i, j + 1)]))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(ob)
    # Vértice sem face nenhuma vira lixo no export; some com eles.
    if so_cobertos:
        usados = {v for f in faces for v in f}
        bpy.context.view_layer.objects.active = ob
        ob.select_set(True)
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.delete_loose()
        bpy.ops.object.mode_set(mode="OBJECT")
        ob.select_set(False)
        del usados
    assign(ob, mat)
    unwrap(ob)
    smooth(ob, 62)
    return ob


def _grade_longe(name, mat, m):
    """Malha grossa do entorno: tudo que está fora do retângulo detalhado.

    A face só nasce se o centro dela estiver fora do tabuleiro e em terra —
    a leste de X_MAR não há chão, há mar.
    """
    verts, faces = [], []
    idx = {}
    for j in range(NZ_L + 1):
        z = -PROF_LONGE * 0.5 + PROF_LONGE * j / NZ_L
        for i in range(NX_L + 1):
            x = -LARG_LONGE * 0.5 + LARG_LONGE * i / NX_L
            idx[(i, j)] = len(verts)
            verts.append((x, z, altura_longe(x, z) - 0.02))
    for j in range(NZ_L):
        for i in range(NX_L):
            cx = -LARG_LONGE * 0.5 + LARG_LONGE * (i + 0.5) / NX_L
            cz = -PROF_LONGE * 0.5 + PROF_LONGE * (j + 0.5) / NZ_L
            if abs(cx) < LARG * 0.5 - 0.2 and abs(cz) < PROF * 0.5 - 0.2:
                continue
            if cx > X_MAR:
                continue
            faces.append((idx[(i, j)], idx[(i + 1, j)], idx[(i + 1, j + 1)], idx[(i, j + 1)]))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.delete_loose()
    bpy.ops.object.mode_set(mode="OBJECT")
    ob.select_set(False)
    assign(ob, mat)
    unwrap(ob)
    smooth(ob, 66)
    return ob


def build_terrain(m):
    """Terreno base de terra, cobertura de grama recortada, e o entorno."""
    _grade("TerrenoBase", m["dirt"], 0.0, False)
    _grade("TerrenoGrama", m["grass"], 0.006, True)
    # Serra arborizada em volta. Material proprio, mais escuro e dessaturado:
    # e assim que mata longe aparece, e e o que permite a nevoa apaga-la sem
    # deixar mancha verde berrante no horizonte.
    _grade_longe("TerrenoLonge", m["mata"], m)
    # Mar ate o horizonte, a leste. A lamina detalhada com ondulacao continua
    # sendo a da faixa do cais; esta aqui e so o fundo.
    cube("TerrenoMar", (LARG_LONGE, 0.1, PROF_LONGE), (X_MAR + LARG_LONGE * 0.5 - 0.2, 0.07, 0.0), m["water"], 0.0)
