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

O `checks.py` faz a conferência definitiva em 3D dentro do Blender, no fim do
build; este aqui é o pré-voo.
"""

from __future__ import annotations

import math

MIN_FOLGA = 0.60
X_BORDA_CAIS = 21.0
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
VIAS = {"mina": RAMO_MINA, "porto": RAMO_PORTO, "oval": OVAL}

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
    ("SucataOficina", quad(-22.9, -7.55, 0.6, 0.6), "normal"),
    ("ObraMina", ret(-22.4, -5.6, 0.28, 0.27, 0.14), "normal"),
    ("ObraPorto", ret(13.9, 3.6, -0.42, 0.27, 0.14), "normal"),
    ("PickupMina", ret(-10.6, -10.4, 0.35, 0.19, 0.09), "normal"),
    ("PickupPorto", ret(13.9, 4.6, -0.5, 0.19, 0.09), "normal"),
    ("PortariaMina", ret(-7.2, -2.6, 0.5, 0.5, 0.4), "normal"),
    ("SinalMina", quad(-9.6, -2.6, 0.5, 0.5), "normal"),
    ("SinalPorto", quad(9.8, 4.0, 0.5, 0.5), "normal"),
    ("SinalVia", quad(-14.2, -3.9, 0.3, 0.3), "normal"),
    ("BandeirasPorto", quad(10.0, 2.4, 0.6, 0.2), "normal"),
    ("GuindBase", quad(20.35, 12.15, 0.55, 0.55), "normal"),
    ("SiloPorto", quad(12.3, 9.4, 1.05, 1.05), "normal"),
    ("TamboresOficina", quad(-22.55, -6.0, 0.22, 0.16), "normal"),
    ("TamboresPorto", quad(14.5, 4.2, 0.22, 0.16), "normal"),
    # --- Fase 8: cava, disposicao e usina ---
    ("PeneiraUsina", quad(-20.6, -9.05, 0.62, 0.62), "normal"),
    ("Espessador", quad(-22.2, -7.9, 0.78, 0.72), "normal"),
    ("CaminhaoServico", ret(-20.5, -9.45, 1.9, 0.3, 0.2), "normal"),
]

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
):
    for _i, _p in enumerate(_pts):
        PECAS.append((f"{_nome}{_i}", [_p], "normal"))
for _i, _p in enumerate([(-22.6, -6.6), (-22.6, -6.85), (-22.6, -7.1), (13.6, 4.6)]):
    PECAS.append((f"Cone{_i}", [_p], "normal"))

# Construções e obstáculos que já existiam e não podem ser invadidos.
FIXOS = {
    "Britador": quad(-20.75, -7.85, 0.85, 0.85),
    "PilharOre": quad(-20.4, -7.05, 1.86, 1.48),
    "SiloCarvao": quad(-21.75, -4.6, 0.96, 0.96),
    "Barracao": quad(-22.6, -9.2, 2.3, 1.65),
    "MinaOficina": quad(-21.8, -6.8, 1.35, 1.05),
    "SalaSCADA": quad(-5.8, 13.2, 3.2, 2.2),
    "PatioPlat": quad(0.0, 3.2, 8.6, 0.55),
}

# Sólidos de revolução: a caixa envolvente exagera muito, então entram como
# círculo com o raio onde a saia já tem altura relevante (~0.4).
CONES = {
    # `MinaCava` saiu na fase 8: era um morro de 1,86 centrado em IRON, e a
    # alca do ramal passava a 0,81 desse centro — o trem corria dentro da rocha.
    "CarvaoCava": (-19.4, -6.15, 2.2),
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
        ("Britador", "PilharOre"), ("PilharOre", "MinaOficina"),
        ("Britador", "MinaOficina"),
        # Fase 8: a estrada de servico nasce dentro da cava e morre no britador,
        # e o ramal do esteril encosta no pe da pilha — e para isso que servem.
        ("CavaFerro", "EstradaCava 0"), ("CavaFerro", "EstradaEsteril 0"),
        ("EsterilPilha", "EstradaEsteril 2"), ("CavaFerro", "EsterilPilha"),
        ("Britador", "EstradaCava 3"), ("Britador", "PeneiraUsina"),
        ("PeneiraUsina", "CaminhaoServico"), ("EstradaCava 2", "CaminhaoServico"),
        ("EstradaCava 1", "CaminhaoServico"), ("Barracao", "Espessador"),
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
               ("EstradaEsteril 2", "EsterilPilha"), ("EstradaEsteril 1", "EsterilPilha")}
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
            if d < 0.0:
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

    print("=" * 68)


if __name__ == "__main__":
    main()
