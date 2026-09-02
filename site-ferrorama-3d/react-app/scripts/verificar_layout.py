"""Confere o layout da maquete sem abrir o Blender.

Roda em Python puro (`python scripts/verificar_layout.py`). Existe porque o
`.glb` é um artefato de build: entre escrever a coordenada e ver o resultado
renderizado há um ciclo caro, e um equipamento nascido em cima do trilho só
apareceria no telão da feira.

Confere três coisas:

1. **Gabarito ferroviário** — distância de cada apoio novo até o eixo das vias.
   Mínimo aceito 0,60. Equipamentos que *devem* montar sobre a via (pórtico de
   embarque, virador de vagões) são marcados como `straddle` e ficam isentos.
2. **Interpenetração em planta** — sobreposição de caixas envolventes entre os
   equipamentos e as construções.
3. **Terra e água** — nada além do navio pode estar além da borda do cais.
4. **Borda do tabuleiro** — nenhuma construção pode passar do retângulo de
   45,4 x 33,4. Esta checagem faltou desde sempre, e foi por isso que o
   barracão da britagem pôde avançar 1,17 m para fora dele sem alerta.

O `checks.py` faz a conferência definitiva em 3D dentro do Blender, no fim do
build; este aqui é o pré-voo.
"""

from __future__ import annotations

import math

MIN_FOLGA = 0.60
X_BORDA_CAIS = 21.0
# Espelha `LARG, PROF = 45.4, 33.4` de terrain.py. Fora deste retangulo
# nao ha tabuleiro: comeca a malha do relevo distante, que sobe como serra.
# Uma construcao ali nao fica "quase fora" — ela fica pendurada no morro.
TAB_X, TAB_Z = 22.7, 16.7
CAIS = (13.35, 21.0, 3.4, 13.8)

# --------------------------------------------------------------------------
# Traçados (espelham railway.py / geometria.ts)
# --------------------------------------------------------------------------

RX, RZ, R_CANTO = 8.55, 5.2, 2.25

RAMO_MINA = [
    (-8.55, -4.55), (-10.8, -6.15), (-13.4, -8.05), (-16.4, -10.15), (-19.0, -9.45),
    (-18.6, -7.05), (-14.8, -5.75), (-11.0, -5.35), (-6.15, -5.2),
]
RAMO_PORTO = [
    (8.55, 4.55), (10.6, 5.85), (13.8, 7.75), (16.9, 9.55), (19.8, 9.2),
    (20.2, 7.05), (17.2, 6.05), (12.4, 5.45), (6.15, 5.2),
]


def _oval():
    """Retângulo arredondado: retas em x=+-RX e z=+-RZ, cantos de raio R_CANTO."""
    cx, cz = RX - R_CANTO, RZ - R_CANTO
    pts = []
    for ccx, ccz, a0 in ((cx, cz, 0.0), (-cx, cz, math.pi / 2), (-cx, -cz, math.pi), (cx, -cz, 3 * math.pi / 2)):
        for i in range(13):
            a = a0 + (math.pi / 2) * i / 12
            pts.append((ccx + math.cos(a) * R_CANTO, ccz + math.sin(a) * R_CANTO))
    pts.append(pts[0])
    return pts


OVAL = _oval()
# O ramal diagonal faltava aqui desde sempre: qualquer peca colocada perto dele
# passava no gabarito por omissao.
RAMO_DIAG = [(-5.1, 3.05), (-2.1, 1.4), (0.0, 0.0), (2.1, -1.4), (5.1, -3.05)]
VIAS = {"mina": RAMO_MINA, "porto": RAMO_PORTO, "oval": OVAL, "diag": RAMO_DIAG}

ESTRADA_MINA = [(-12.55, -6.75), (-11.2, -5.85), (-9.7, -4.95), (-8.15, -4.1)]
ESTRADA_PORTO = [(8.2, 4.55), (11.5, 6.25), (14.6, 7.55), (16.9, 8.25)]


def _seg_dist(p, a, b):
    ax, az = a
    bx, bz = b
    px, pz = p
    dx, dz = bx - ax, bz - az
    l2 = dx * dx + dz * dz
    t = 0.0 if l2 == 0 else max(0.0, min(1.0, ((px - ax) * dx + (pz - az) * dz) / l2))
    return math.hypot(px - (ax + t * dx), pz - (az + t * dz))


def poly_dist(p, pts):
    return min(_seg_dist(p, pts[i], pts[i + 1]) for i in range(len(pts) - 1))


def dist_vias(p):
    return min(poly_dist(p, v) for v in VIAS.values())


# --------------------------------------------------------------------------
# Formas
# --------------------------------------------------------------------------


def ret(cx, cz, yaw, meia_a, meia_t):
    ao = (math.cos(yaw), math.sin(yaw))
    tr = (-math.sin(yaw), math.cos(yaw))
    return [
        (cx + ao[0] * a + tr[0] * t, cz + ao[1] * a + tr[1] * t)
        for a in (-meia_a, meia_a)
        for t in (-meia_t, meia_t)
    ]


def quad(cx, cz, sx, sz):
    return [(cx + dx, cz + dz) for dx in (-sx / 2, sx / 2) for dz in (-sz / 2, sz / 2)]


def lerp2(p0, p1, t):
    return (p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t)


# --------------------------------------------------------------------------
# Layout atual
# --------------------------------------------------------------------------

GA = ((-20.35, -7.5), (-16.8, -3.9))
GB = ((-16.8, -3.9), (-13.6, -5.624))
GC = ((15.55, 8.7), (13.9, 11.0))
GD = ((13.9, 11.0), (20.4, 10.6))

# Pecas redondas: so entram no gabarito ferroviario (secao 1).
PECAS_VIA = []

# (nome, pontos, modo)  modo: "normal" | "straddle"
PECAS = [
    # --- Fase 1: cadeia de processo ---
    # GaleriaA e vao livre: nao tem cavalete.
    ("GaleriaB cavalete a", [lerp2(*GB, 0.3)], "normal"),
    ("GaleriaB cavalete b", [lerp2(*GB, 0.62)], "normal"),
    ("TransfA", quad(-16.8, -3.9, 0.88, 0.88), "normal"),
    ("EmbarqueFerro", ret(-13.6, -5.624, 0.1049, 1.05, 0.98), "straddle"),
    ("Virador", ret(15.2, 8.563, 0.526, 1.05, 0.85), "straddle"),
    ("GaleriaC cavalete a", [lerp2(*GC, 0.45)], "normal"),
    ("GaleriaC cavalete b", [lerp2(*GC, 0.78)], "normal"),
    ("TransfB", quad(13.9, 11.0, 0.88, 0.88), "normal"),
    ("GaleriaD cavalete a", [lerp2(*GD, 0.22)], "normal"),
    ("GaleriaD cavalete b", [lerp2(*GD, 0.45)], "normal"),
    ("GaleriaD cavalete c", [lerp2(*GD, 0.68)], "normal"),
    ("GaleriaD cavalete d", [lerp2(*GD, 0.86)], "normal"),
    ("PatioTrilhos", quad(15.5, 12.3, 3.1, 1.7), "normal"),
    ("PilhaPatio", quad(15.4, 12.3, 2.38, 1.4), "normal"),
    ("PilhaPatio2", quad(15.4, 4.35, 1.48, 1.1), "normal"),
    ("EmpilhPortico", quad(16.85, 12.3, 0.2, 1.6), "normal"),
    ("ShiploaderTorre", quad(20.4, 10.6, 0.63, 0.93), "normal"),
    # --- Fase 3: estruturas ---
    ("SubestMina", ret(-12.2, -10.4, 0.25, 1.0, 0.75), "normal"),
    ("TanqueMina", ret(-9.6, -8.2, 0.18, 1.2, 0.85), "normal"),
    ("PipeRackMina a", [(-10.9, -8.75)], "normal"),
    ("PipeRackMina b", [(-12.8, -9.35)], "normal"),
    ("MastroLuzMina", quad(-11.4, -12.2, 0.4, 0.4), "normal"),
    ("ArmazemP", quad(11.9, 2.9, 2.7, 3.5), "normal"),
    ("GalpaoP", quad(12.0, 11.2, 1.9, 2.5), "normal"),
    ("MastroLuzPorto0", quad(12.6, 13.6, 0.4, 0.4), "normal"),
    ("MastroLuzPorto1", quad(17.35, 4.2, 0.4, 0.4), "normal"),
    # --- Fase 6/7: detalhes e sitio ---
    ("BalancaPorto", ret(10.8, 8.4, 0.54, 0.78, 0.4), "normal"),
    ("SucataOficina", quad(-22.35, -9.45, 0.6, 0.6), "normal"),
    ("ObraMina", ret(-18.4, -11.0, 0.28, 0.27, 0.14), "normal"),
    ("ObraPorto", ret(13.9, 3.6, -0.42, 0.27, 0.14), "normal"),
    ("PickupMina", ret(-10.6, -10.4, 0.35, 0.19, 0.09), "normal"),
    ("PickupPorto", ret(13.9, 4.6, -0.5, 0.19, 0.09), "normal"),
    ("PortariaMina", ret(-7.2, -2.6, 0.5, 0.5, 0.4), "normal"),
    ("SinalMina", quad(-9.6, -2.6, 0.5, 0.5), "normal"),
    ("SinalPorto", quad(9.8, 4.0, 0.5, 0.5), "normal"),
    ("SinalVia", quad(-14.2, -3.9, 0.3, 0.3), "normal"),
    ("BandeirasPorto", quad(10.0, 2.4, 0.6, 0.2), "normal"),
    ("SiloPorto", quad(12.3, 9.4, 1.05, 1.05), "normal"),
    ("TamboresOficina", quad(-18.9, -10.6, 0.22, 0.16), "normal"),
    ("TamboresPorto", quad(14.5, 4.2, 0.22, 0.16), "normal"),
    # --- Fase 8: cava, disposicao e usina ---
    ("PeneiraUsina", quad(-20.6, -9.05, 0.62, 0.62), "normal"),
    ("CaminhaoServico", ret(-20.5, -9.45, 1.9, 0.3, 0.2), "normal"),
    # --- Fase 9: aparelhos de via (os que montam na via sao "straddle") ---
    ("Desvio0", ret(5.10, -3.05, -0.5027, 0.56, 0.42), "straddle"),
    ("Desvio1", ret(-5.10, 3.05, -0.5027, 0.56, 0.42), "straddle"),
    ("Desvio2", ret(7.67, 4.74, 2.5002, 0.56, 0.42), "straddle"),
    ("Desvio3", ret(-7.67, -4.74, -0.6414, 0.56, 0.42), "straddle"),
    ("PNMinaRamal", ret(-10.32, -5.31, 0.044, 0.44, 0.5), "straddle"),
    ("PNMinaOval", ret(-8.21, -4.13, -1.002, 0.44, 0.5), "straddle"),
    ("ParaChoqueL0", ret(4.52, 3.55, 0.0, 0.15, 0.22), "straddle"),
    # --- Fase 12: o cais como a foto de referencia pede ---
    # O guindaste entra em duas caixas: a base sobre esteiras, que e o que
    # precisa de folga de bitola, e o alcance da lanca, que passa a 2,3 de
    # altura — como a galeria e o shiploader, e por isso e "straddle".
    # --- Fase 20: a operacao do cais ---
    # Caixas estimadas nesta rodada; serao trocadas pelas medidas do `.glb` no
    # proximo build, como as da fase 19.
    # A lanca do guindaste nao entra: ela gira a 2,7 de altura e passa por cima
    # de tudo. So o mastro toca o chao.
    ("GuindMastro", quad(20.10, 12.15, 0.60, 0.60), "normal"),
    ("EscavCais", quad(20.11, 13.02, 0.39, 0.58), "normal"),
    ("PaletePorto0", quad(18.75, 12.85, 0.20, 0.18), "normal"),
    ("PaletePorto1", quad(18.75, 12.35, 0.21, 0.18), "normal"),
    ("TamboresCais", quad(19.30, 13.15, 0.31, 0.28), "normal"),
    ("GuindasteTrelica base", ret(18.75, 8.0, 0.0, 0.42, 0.4), "normal"),
    ("GuindasteTrelica lanca", ret(19.28, 8.0, 0.0, 0.95, 0.14), "straddle"),
    ("ConteinerCais", ret(19.3, 4.6, 0.06, 0.9, 0.6), "normal"),
    # --- Fase 13: terminal logistico ---
    ("CavaCaminhao", ret(-18.6, -12.0, 0.7, 0.3, 0.2), "normal"),
    ("PisoTerminal", quad(4.8, 11.0, 9.0, 8.2), "normal"),
    ("ArmazemLog", quad(5.6, 13.3, 5.3, 3.2), "normal"),
    ("GalpaoLog", quad(1.6, 12.9, 2.1, 2.3), "normal"),
    ("AdminTerminal", quad(1.9, 8.5, 1.55, 1.15), "normal"),
    ("PatioContLog", quad(7.3, 8.6, 3.1, 2.1), "normal"),
    ("CoberturaLog", quad(3.78, 8.3, 1.6, 0.7), "normal"),
    ("PortariaTerminal", quad(0.75, 9.5, 0.6, 1.4), "normal"),
    ("MastroLog0", quad(1.1, 14.6, 0.3, 0.3), "normal"),
    ("MastroLog1", quad(8.8, 7.4, 0.3, 0.3), "normal"),
    # --- Fase 19: a mina refeita a partir do catalogo de assets ---
    # Estas caixas NAO sao estimadas: saem da medicao das caixas envolventes do
    # proprio `.glb`, lidas dos acessores de POSITION com a transformacao do no
    # aplicada. A primeira versao delas era chutada e mentia feio — metade usava
    # meia-medida onde `quad` quer a medida cheia — e por isso o pre-voo dava
    # tudo certo enquanto o relatorio 3D do build acusava peca dentro de peca.
    # Ao mover qualquer coisa daqui, desloque o centro pelo mesmo delta e confira
    # a caixa nova no build seguinte.
    ("MinaTorreExtracao", quad(-20.95, -14.22, 1.71, 0.98), "normal"),
    ("MinaMoega", quad(-20.39, -14.90, 1.19, 0.42), "normal"),
    ("MinaBritador", quad(-19.04, -14.88, 0.62, 0.45), "normal"),
    ("MinaPeneira", quad(-18.06, -14.88, 0.80, 0.38), "normal"),
    ("MinaCorreiaSilo", quad(-17.35, -14.87, 1.32, 0.28), "normal"),
    ("MinaSilo0", quad(-16.59, -15.00, 0.45, 0.44), "normal"),
    ("MinaSilo1", quad(-15.99, -15.00, 0.45, 0.44), "normal"),
    ("MinaTanque0", quad(-15.18, -14.90, 0.45, 0.38), "normal"),
    ("MinaTanque1", quad(-14.58, -14.90, 0.45, 0.38), "normal"),
    ("MinaTanque2", quad(-13.98, -14.90, 0.45, 0.38), "normal"),
    ("MinaEspessador", quad(-13.10, -14.95, 0.80, 0.80), "normal"),
    ("MinaPipeRackUsina", quad(-14.60, -14.28, 1.64, 0.23), "normal"),
    ("MinaTorreAgua", quad(-22.05, -10.75, 0.34, 0.32), "normal"),
    ("MinaHolofoteSul", quad(-21.35, -15.75, 0.17, 0.17), "normal"),
    ("MinaHolofoteLeste", quad(-12.40, -14.40, 0.17, 0.17), "normal"),
    ("MinaEscritorio", quad(-20.65, -15.68, 0.59, 0.38), "normal"),
    ("MinaBobina", quad(-16.85, -15.70, 0.24, 0.24), "normal"),
    ("MinaPilhaTubos", quad(-12.50, -15.60, 0.57, 0.33), "normal"),
    ("MinaAfloramento", quad(-12.93, -13.36, 0.40, 0.42), "normal"),
    ("MinaBritadorConico", quad(-20.70, -7.85, 0.45, 0.35), "normal"),
    ("MinaCarregadeira", quad(-15.90, -14.28, 0.54, 0.32), "normal"),
    ("MinaMotoniveladora", quad(-13.60, -14.30, 0.38, 0.44), "normal"),
    ("MinaPickup", quad(-20.99, -13.54, 0.35, 0.32), "normal"),
    ("MinaCaminhaoTanque", quad(-12.60, -14.87, 0.19, 0.49), "normal"),
    ("TamboresMinaUsina", quad(-17.50, -15.65, 0.31, 0.28), "normal"),
    ("SucataMinaUsina", quad(-13.95, -15.75, 0.48, 0.39), "normal"),
    ("ConeMinaUsina", quad(-19.60, -15.00, 0.25, 0.31), "normal"),
    ("MinaPlacaEpi", quad(-21.00, -15.25, 0.07, 0.08), "normal"),
    ("CercaMinaUsina", quad(-18.80, -13.94, 2.43, 0.06), "normal"),
    ("CercaMinaUsina2", quad(-15.30, -13.94, 2.64, 0.06), "normal"),
    ("CercaMina", quad(-21.20, -3.29, 2.23, 0.06), "normal"),
    ("LuzMinaPatio", quad(-21.00, -5.90, 0.15, 0.15), "normal"),
    ("LuzMinaEstrada", quad(-16.93, -13.99, 0.32, 0.07), "normal"),
    ("LuzMinaOficina", quad(-21.45, -8.00, 0.11, 0.32), "normal"),
    ("LuzCarvao", quad(-21.61, -4.06, 0.30, 0.20), "normal"),
    ("SiloCarvao", quad(-21.75, -4.60, 0.46, 0.47), "normal"),
    ("CorreiaCarvao", quad(-20.56, -5.18, 1.54, 1.02), "normal"),
    ("PilhaCarvao", quad(-20.97, -4.24, 0.99, 0.97), "normal"),
    # Deslocadas nesta rodada: centro = a medicao anterior somada ao mesmo delta.
    ("CaminhaoMinaFaixa", quad(-19.45, -14.30, 0.70, 0.60), "normal"),
    ("MinaCanaleta", quad(-17.635, -14.46, 2.85, 0.28), "normal"),
    ("CorreiaBritagem", quad(-20.26, -7.49, 0.64, 0.62), "normal"),
    ("TerminalCarvao", quad(-22.03, -5.73, 1.13, 0.78), "normal"),
    # As marcas de pneu (`MinaRastro*`) ficam de fora: sao decalques rentes ao
    # chao, com caixa de 1,4 x 0,9 que atravessa meio patio sem tocar em nada.
]
# Raio medido no `.glb`, nao o passado ao `plantar`: o deslocamento de ruido do
# lathe estufa o monte para alem do raio nominal.
for _i, _dados in enumerate((
    (-19.29, -15.79, 0.56),
    (-18.46, -15.95, 0.35),
    (-15.55, -15.84, 0.47),
)):
    _x, _z, _r = _dados
    PECAS.append((f"MinaMonte{_i}", [(_x + math.cos(_a * math.pi / 6) * _r, _z + math.sin(_a * math.pi / 6) * _r) for _a in range(12)], "normal"))
for _i, _p in enumerate(((-18.95, -14.28), (-18.35, -15.25), (-14.9, -14.35), (-16.2, -15.35))):
    PECAS.append((f"OpMinaUsina{_i}", [_p], "normal"))
# Postes da linha de energia. Os quatro pontos que estavam aqui eram de outra
# peca — sobra da rede antiga — e por isso o verificador nunca viu que o poste
# de ponta nascia dentro de um monte de terra. Agora saem da mesma conta que
# `assets.infraestrutura.linha_energia` faz: n+1 postes espalhados por
# `comp * escala`, porque o `Sitio` escala o avanco.
_LE_X, _LE_Z, _LE_COMP, _LE_ESC, _LE_VAOS = -16.2, -16.1, 9.0, 0.6, 4
for _i in range(_LE_VAOS + 1):
    _a = (-_LE_COMP * 0.5 + _LE_COMP * _i / _LE_VAOS) * _LE_ESC
    PECAS.append((f"MinaLinhaEnergia poste {_i}", [(_LE_X + _a, _LE_Z)], "normal"))
for _i, _px in enumerate((4.1, 6.1, 8.1)):
    PECAS.append((f"CarretaLog{_i}", ret(_px, 11.35, math.pi / 2, 0.6, 0.2), "normal"))

# --- Fase 15: avenidas. O bordo da pista e que precisa de folga, nao o eixo,
# entao cada ponto entra deslocado meia largura para os dois lados.
_AV = {
    "AvNorte": ([(-10.4, 6.3), (-4.0, 6.2), (0.4, 6.3), (5.2, 6.3), (9.2, 6.5), (10.8, 7.6), (11.6, 8.8)], 0.39),
    "AvOeste": ([(-16.2, 6.3), (-14.6, 4.0), (-13.0, 0.6), (-12.2, -2.6), (-10.4, -3.4)], 0.35),
    "RuaTerminal": ([(0.4, 6.3), (0.5, 8.2), (0.75, 9.2)], 0.25),
}
for _n, (_pts, _meia) in _AV.items():
    _b = []
    for _i, (_x, _z) in enumerate(_pts):
        _j = min(_i, len(_pts) - 2)
        _yaw = math.atan2(_pts[_j + 1][1] - _pts[_j][1], _pts[_j + 1][0] - _pts[_j][0])
        for _s in (-1, 1):
            _b.append((_x - math.sin(_yaw) * _meia * _s, _z + math.cos(_yaw) * _meia * _s))
    PECAS_VIA.append((_n, _b))
# As ruas de estacao cruzam a linha principal de proposito, com passagem de nivel.
for _n, _x, _z in (("RuaEstL", 5.08, 4.6), ("RuaEstO", -9.0, -2.5),
                   ("PNEstL", 5.08, 5.2), ("PNEstO", -8.55, -2.46)):
    PECAS.append((_n, quad(_x, _z, 0.6, 0.6), "straddle"))
# Barcaca e rebocador flutuam: nao entram no gabarito ferroviario nem na
# checagem de terra, mas precisam caber na faixa de agua (x 21,0 a 23,6).
# Fase 20: o navio-caixa de 5,6 virou o graneleiro do catalogo, com 8,0 de
# comprimento nominal — 8,4 de ponta a ponta, porque a proa avanca 0,55c e a
# popa recua 0,50c. Barcaca e rebocador recuaram para abrir espaco para ele.
FLUTUANTES = {
    "Barcaca": ret(22.2, 3.45, 1.62, 0.77, 0.45),
    "Rebocador": ret(22.2, 13.7, 0.08, 0.6, 0.3),
    "Navio": ret(21.9, 8.8, 0.0, 0.66, 4.2),
}
for _i, (_x, _z) in enumerate(((0.0, 5.95), (4.5, 5.95), (-4.5, 5.95), (9.3, 1.5), (-9.3, -1.5), (0.0, -5.95), (-4.5, -5.95))):
    PECAS.append((f"MarcoKm{_i}", quad(_x, _z, 0.12, 0.12), "normal"))

# --- Fase 10: os discos de terra batida nao podem cobrir dormente ---
for _n, _discos in (
    ("PatioMinaTerra", [(-22.4, -9.2, 1.5), (-21.6, -7.2, 1.4), (-20.6, -8.4, 1.05), (-20.6, -9.6, 1.0), (-22.2, -5.9, 1.0)]),
    ("PatioCavaTerra", [(-18.9, -11.6, 0.9), (-18.2, -12.4, 0.8), (-16.0, -12.9, 0.8), (-15.4, -12.6, 0.7)]),
):
    for _j, (_x, _z, _r) in enumerate(_discos):
        PECAS_VIA.append((f"{_n} disco {_j}", [(_x + math.cos(_a * math.pi / 6) * _r, _z + math.sin(_a * math.pi / 6) * _r) for _a in range(12)]))

# Formas de revolucao da fase 8. Ficam fora da checagem de caixa envolvente —
# a AABB de um circulo estoura 41% nos cantos e acusa encosto que nao existe —
# e entram na secao 2c, que mede circulo contra caixa de verdade.
REDONDOS = {
    "CavaFerro": (-20.3, -11.8, 1.85),
    "EsterilPilha": (-17.2, -12.7, 1.40),
    "BaciaDecant": (-14.6, -12.3, 1.20),
}
for _n, (_cx, _cz, _r) in REDONDOS.items():
    PECAS_VIA.append((_n, [(_cx + math.cos(_a * math.pi / 8) * _r, _cz + math.sin(_a * math.pi / 8) * _r) for _a in range(16)]))
for _i, _p in enumerate([(-20.05, -10.15), (-20.45, -9.7), (-20.6, -9.2), (-20.72, -8.6)]):
    PECAS.append((f"EstradaCava {_i}", [_p], "normal"))
for _i, _p in enumerate([(-19.2, -11.4), (-18.6, -12.35), (-17.9, -12.6)]):
    PECAS.append((f"EstradaEsteril {_i}", [_p], "normal"))

# Postes da linha de energia e pessoas entram como pontos soltos.
for _i, _p in enumerate([(-11.6, -10.6), (-10.2, -11.4), (-8.8, -12.2), (-7.4, -13.0)]):
    PECAS.append((f"LinhaMina poste {_i}", [_p], "normal"))
for _nome, _pts in (
    ("OpMina", [(-22.0, -8.32), (-21.9, -7.5), (-21.4, -8.3), (-21.9, -6.15), (-21.6, -7.6)]),
    ("OpEmbarque", [(-15.7, -4.6), (-13.0, -6.6), (-13.4, -6.9)]),
    ("OpPorto", [(16.9, 10.3), (17.3, 7.4), (17.4, 12.2), (13.6, 12.0)]),
    ("OpCais", [(19.75, 12.35), (18.4, 13.15)]),
):
    for _i, _p in enumerate(_pts):
        PECAS.append((f"{_nome}{_i}", [_p], "normal"))
for _i, _p in enumerate([(-19.6, -9.9), (-19.45, -10.05), (-19.3, -10.2), (14.2, 4.3)]):
    PECAS.append((f"Cone{_i}", [_p], "normal"))

# Construções e obstáculos que já existiam e não podem ser invadidos.
FIXOS = {
    # Medidos no `.glb`, e agora tambem calculaveis: a caixa do `galpao` e
    #   x de cx - d/2 - 0.12 (cumeeira) ate cx + d/2 + 0.54 (doca de carga)
    #   z de cz - w/2 - 0.11 ate cz + w/2 + 0.11 (calha do beiral)
    # A assimetria em x e a doca, e foi ela que escondeu o defeito: quem lia
    # `galpao(..., -22.6, ...)` supunha um retangulo centrado em -22,6.
    "Barracao": quad(-9.79, -15.0, 2.96, 1.87),
    "MinaOficina": quad(-21.59, -6.8, 2.01, 1.27),
    "CentroControle": quad(-16.2, 11.1, 11.2, 9.0),
    "PatioPlat": quad(0.0, 3.2, 8.6, 0.55),
}

# Sólidos de revolução: a caixa envolvente exagera muito, então entram como
# círculo com o raio onde a saia já tem altura relevante (~0.4).
CONES = {
    # `MinaCava` saiu na fase 8: era um morro de 1,86 centrado em IRON, e a
    # alca do ramal passava a 0,81 desse centro — o trem corria dentro da rocha.
    "CarvaoCava": (-19.4, -6.15, 1.28),
    "PilharOre": (-20.15, -7.0, 0.44),
    # Raio onde a saia ja tem altura relevante, nao o pe do talude.
    "CavaFerro": (-20.3, -11.8, 1.62),
    "EsterilPilha": (-17.2, -12.7, 1.24),
    "BaciaDecant": (-14.6, -12.3, 1.06),
}


def main():
    print("=" * 68)
    print("1) GABARITO FERROVIARIO (minimo %.2f)" % MIN_FOLGA)
    alertas = 0
    for nome, pts, modo in PECAS + [(n, p, "normal") for n, p in PECAS_VIA]:
        d = min(dist_vias(p) for p in pts)
        if modo == "straddle":
            print(f"  ponte   {d:5.2f}  {nome} (monta sobre a via, isento)")
            continue
        if d < MIN_FOLGA:
            alertas += 1
            print(f"  ALERTA  {d:5.2f}  {nome}")
    print(f"  -> {alertas} alerta(s) de {sum(1 for _, _, k in PECAS if k != 'straddle') + len(PECAS_VIA)} pecas")

    print()
    print("2) INTERPENETRACAO EM PLANTA")
    # Pares que se tocam de proposito, ou que ja se tocavam antes destas fases.
    tolerados = (
        ("PatioTrilhos", "PilhaPatio"), ("PatioTrilhos", "EmpilhPortico"),
        ("Britador", "PilharOre"),
        ("Britador", "MinaOficina"),
        # Fase 8: a estrada de servico nasce dentro da cava e morre no britador,
        # e o ramal do esteril encosta no pe da pilha — e para isso que servem.
        ("CavaFerro", "EstradaCava 0"), ("CavaFerro", "EstradaEsteril 0"),
        ("EsterilPilha", "EstradaEsteril 2"), ("CavaFerro", "EsterilPilha"),
        ("Britador", "EstradaCava 3"), ("Britador", "PeneiraUsina"),
        ("PeneiraUsina", "CaminhaoServico"), ("EstradaCava 2", "CaminhaoServico"),
        ("EstradaCava 1", "CaminhaoServico"),
        # Fase 9: o AMV do ramal da mina e a passagem de nivel do oval ficam a
        # 0,81 um do outro — encostam de proposito, é o mesmo entroncamento.
        ("Desvio3", "PNMinaOval"),
        # As duas caixas do guindaste sao o mesmo objeto, medido em dois papeis.
        ("GuindasteTrelica base", "GuindasteTrelica lanca"),
        # O piso do terminal e o chao: tudo que esta no terminal fica sobre ele.
        ("PisoTerminal", "ArmazemLog"), ("PisoTerminal", "GalpaoLog"),
        ("PisoTerminal", "AdminTerminal"), ("PisoTerminal", "PatioContLog"),
        ("PisoTerminal", "CoberturaLog"), ("PisoTerminal", "PortariaTerminal"),
        ("PisoTerminal", "MastroLog0"), ("PisoTerminal", "MastroLog1"),
        ("PisoTerminal", "CarretaLog0"), ("PisoTerminal", "CarretaLog1"),
        ("PisoTerminal", "CarretaLog2"),
        # As carretas encostam na doca do armazem de proposito.
        ("ArmazemLog", "CarretaLog0"), ("ArmazemLog", "CarretaLog1"),
        ("ArmazemLog", "CarretaLog2"),
        # A correia nasce debaixo da descarga do britador conico: o tambor de
        # cauda fica sob a boca, e nao adiante dela. A caixa envolvente da
        # correia inclinada e girada engole o britador inteiro, mas em 3D sao
        # a mesma junta.
        ("MinaBritadorConico", "CorreiaBritagem"),
        # Fase 19: as juntas da usina. Uma cadeia de beneficiamento e feita de
        # pecas que se entregam material, e transferencia sem encosto seria
        # minerio caindo no chao: a peneira despeja na correia, a correia
        # descarrega na boca do silo, a torre de extracao alimenta a moega e a
        # correia do carvao joga na pilha.
        ("MinaPeneira", "MinaCorreiaSilo"), ("MinaCorreiaSilo", "MinaSilo0"),
        ("MinaTorreExtracao", "MinaMoega"), ("CorreiaCarvao", "PilhaCarvao"),
        # Montes de terra encostados aos pares, como na foto de referencia.
        ("MinaMonte0", "MinaMonte1"),
        # Cada rua de estacao carrega a propria passagem de nivel.
        ("RuaEstL", "PNEstL"), ("RuaEstO", "PNEstO"),
    )
    caixas = [(n, p) for n, p, _ in PECAS] + [(n, p) for n, p in FIXOS.items()]
    achou = 0
    for i in range(len(caixas)):
        na, pa = caixas[i]
        ax0, ax1 = min(p[0] for p in pa), max(p[0] for p in pa)
        az0, az1 = min(p[1] for p in pa), max(p[1] for p in pa)
        for j in range(i + 1, len(caixas)):
            nb, pb = caixas[j]
            bx0, bx1 = min(p[0] for p in pb), max(p[0] for p in pb)
            bz0, bz1 = min(p[1] for p in pb), max(p[1] for p in pb)
            ox = min(ax1, bx1) - max(ax0, bx0)
            oz = min(az1, bz1) - max(az0, bz0)
            if any({na, nb} == {a, b} for a, b in tolerados):
                continue
            if ox > 0.02 and oz > 0.02:
                achou += 1
                print(f"  ALERTA  {na}  x  {nb}   ({ox:.2f} x {oz:.2f} m)")
    if not achou:
        print("  nenhuma")

    print()
    print("2b) INVASAO DAS CAVAS (circulo com altura relevante)")
    # Estradas de servico existem justamente para entrar na cava e subir a
    # pilha; nao sao invasao.
    ok_cava = {("EstradaCava 0", "CavaFerro"), ("EstradaEsteril 0", "CavaFerro"),
               ("EstradaEsteril 2", "EsterilPilha"), ("EstradaEsteril 1", "EsterilPilha"),
               # A correia sobe do britador conico e joga no cume da pilha de
               # minerio: atravessar o cone e a funcao dela.
               ("CorreiaBritagem", "PilharOre"),
               # As duas pilhas do patio de britagem se tocam desde sempre, e a
               # correia passa no vao entre elas.
               ("CorreiaBritagem", "CarvaoCava"), ("CorreiaCarvao", "CarvaoCava"),
               # Caminhao carregado na estrada que sobe a saia da cava: e onde
               # ele tem de estar.
               ("CavaCaminhao", "CavaFerro")}
    achou_c = 0
    for nome, pts, _ in PECAS:
        for cn, (cx, cz, r) in CONES.items():
            d = min(math.hypot(p[0] - cx, p[1] - cz) for p in pts)
            if d < r and (nome, cn) not in ok_cava:
                achou_c += 1
                print(f"  ALERTA  {nome} entra {r - d:.2f} m dentro de {cn}")
    if not achou_c:
        print("  nenhuma")

    print()
    print("2c) FORMAS DE REVOLUCAO (circulo x caixa, sem exagero de AABB)")
    # A divida da britagem foi paga na fase 21: o barracao voltou para dentro
    # do tabuleiro, a saia da cava deixou de raspar nele, o espessador
    # duplicado saiu e a pilha de minerio saiu da doca da oficina. O conjunto
    # fica aqui vazio de proposito, como lugar para a proxima divida nomeada.
    divida_britagem = set()
    achou_r = 0
    itens = list(REDONDOS.items())
    for i, (na, (ax, az, ar)) in enumerate(itens):
        for nb, (bx, bz, br) in itens[i + 1:]:
            folga = math.hypot(ax - bx, az - bz) - ar - br
            if folga < -0.05:
                achou_r += 1
                print(f"  ALERTA  {na} x {nb} sobrepoem {-folga:.2f} m")
        for nb, pb in FIXOS.items():
            bx0, bx1 = min(p[0] for p in pb), max(p[0] for p in pb)
            bz0, bz1 = min(p[1] for p in pb), max(p[1] for p in pb)
            d = math.hypot(max(bx0 - ax, 0, ax - bx1), max(bz0 - az, 0, az - bz1)) - ar
            if d < 0.0 and (na, nb) not in divida_britagem:
                achou_r += 1
                print(f"  ALERTA  {na} entra {-d:.2f} m em {nb}")
        for nb, (bx, bz, br) in CONES.items():
            if nb == na:
                continue
            folga = math.hypot(ax - bx, az - bz) - ar - br
            if folga < -0.05:
                achou_r += 1
                print(f"  ALERTA  {na} x {nb} sobrepoem {-folga:.2f} m")
    if not achou_r:
        print("  nenhuma")

    print()
    print("3) TERRA x AGUA (borda do cais em x=%.2f)" % X_BORDA_CAIS)
    molhados = 0
    for nome, pts, _ in PECAS:
        fora = [p for p in pts if p[0] > X_BORDA_CAIS]
        if fora:
            molhados += 1
            print(f"  ALERTA  {nome} tem ponto em x={max(p[0] for p in fora):.2f}")
    for nome, pts in (("ramo do porto", RAMO_PORTO), ("ramo da mina", RAMO_MINA)):
        mx = max(p[0] for p in pts)
        marca = "ALERTA" if mx > X_BORDA_CAIS else "ok    "
        print(f"  {marca}  {nome}: x maximo {mx:.2f}")
    # O cais precisa cobrir a alca inteira.
    dentro = all(CAIS[0] <= x <= CAIS[1] and CAIS[2] <= z <= CAIS[3] for x, z in RAMO_PORTO if x > 13.35)
    print(f"  {'ok    ' if dentro else 'ALERTA'}  alca do porto contida na laje do cais")
    if not molhados:
        print("  nenhuma peca na agua")
    print()
    print("3b) FLUTUANTES (faixa de agua x 21.00 a 23.60)")
    fora = 0
    for nome, pts in FLUTUANTES.items():
        x0, x1 = min(p[0] for p in pts), max(p[0] for p in pts)
        if x0 < X_BORDA_CAIS or x1 > 23.6:
            fora += 1
            print(f"  ALERTA  {nome} vai de x={x0:.2f} a x={x1:.2f}")
    itens = list(FLUTUANTES.items())
    for i, (na, pa) in enumerate(itens):
        for nb, pb in itens[i + 1:]:
            ox = min(max(p[0] for p in pa), max(p[0] for p in pb)) - max(min(p[0] for p in pa), min(p[0] for p in pb))
            oz = min(max(p[1] for p in pa), max(p[1] for p in pb)) - max(min(p[1] for p in pa), min(p[1] for p in pb))
            if ox > 0.02 and oz > 0.02:
                fora += 1
                print(f"  ALERTA  {na} x {nb} se tocam ({ox:.2f} x {oz:.2f} m)")
    if not fora:
        print("  nenhum")

    print()
    print("4) BORDA DO TABULEIRO (x +-%.2f, z +-%.2f)" % (TAB_X, TAB_Z))
    # As construcoes fixas entram pela caixa medida; os equipamentos, pelos
    # pontos de apoio. O navio e as barcacas ficam de fora de proposito: a
    # faixa de agua do porto e o unico lugar onde passar da borda e correto.
    vazando = 0
    caixas = [(n, p) for n, p in FIXOS.items()]
    caixas += [(n, p) for n, p, _ in PECAS]
    for nome, pts in caixas:
        dx = max(abs(p[0]) for p in pts) - TAB_X
        dz = max(abs(p[1]) for p in pts) - TAB_Z
        if max(dx, dz) > 0.0:
            vazando += 1
            eixo = "x" if dx >= dz else "z"
            print(f"  ALERTA  {nome} passa {max(dx, dz):.2f} m da borda em {eixo}")
    for nome, (cx, cz, r) in list(CONES.items()) + list(REDONDOS.items()):
        d = max(abs(cx) + r - TAB_X, abs(cz) + r - TAB_Z)
        if d > 0.0:
            vazando += 1
            print(f"  ALERTA  {nome} passa {d:.2f} m da borda")
    if not vazando:
        print("  nenhuma")

    print("=" * 68)


if __name__ == "__main__":
    main()
