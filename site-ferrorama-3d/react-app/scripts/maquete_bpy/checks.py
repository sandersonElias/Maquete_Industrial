"""Relatório de interpenetração entre objetos da maquete.

Sem renderizador não dá para "ver" que um equipamento novo nasceu dentro de um
galpão antigo. Este módulo roda no fim do build e imprime os pares de objetos
cujas caixas envolventes se cruzam de forma significativa, para que o erro
apareça no terminal em vez de aparecer no telão da feira.

É só diagnóstico: nunca altera a cena nem falha o build.
"""

from __future__ import annotations

import bpy

# Terreno, lajes, pisos e água: sobrepõem tudo por definição, não interessam.
IGNORAR = (
    "Placa", "Terreno", "Grama", "Agua", "Cais", "Apron", "Pad", "Patio", "Estrada", "Faixa",
    "Morro", "Capim", "Tunel", "Lastro", "Loop", "Diag", "Ramo", "Dorm", "Trilho",
    "Sala", "Mesa", "Mon", "Caneca", "Pasta", "Cadeira", "AguaCorpo", "AguaSuperficie",
    "CarvaoCava", "CarvaoFundo", "Troncos", "Copas",
    # Fase 8: a cava, a pilha de esteril e o dique da bacia sao terreno, e
    # terreno engole por definicao tudo que esta apoiado nele.
    "CavaRocha", "CavaMinerio", "CavaLeira", "EsterilPilha", "EsterilLeira",
    "BaciaDique",
)

# Pares que sabemos que se tocam de propósito (equipamento apoiado em laje,
# galeria entrando na torre, bica descendo dentro do silo, etc.).
TOLERADOS = (
    ("GaleriaA", "TransfA"),
    ("GaleriaB", "TransfA"),
    ("GaleriaB", "EmbarqueFerro"),
    ("GaleriaC", "Virador"),
    ("GaleriaC", "TransfB"),
    ("GaleriaD", "TransfB"),
    ("GaleriaD", "ShiploaderTorre"),
    ("GaleriaA", "Britador"),
    ("EmpilhPortico", "PatioTrilhos"),
    ("Empilh", "PatioTrilhos"),
    ("Virador", "Poco"),
    ("ShiploaderTorre", "GaleriaD"),
    ("PilhaPatio", "PatioTrilhos"),
    # Fase 8 — o que encosta de proposito dentro da cava e na usina.
    ("CavaRampa", "CavaAcesso"),
    ("CavaSump", "CavaBomba"),
    ("PeneiraUsina", "Britador"),
    ("PeneiraUsina", "CaminhaoServico"),
    ("BaciaAgua", "BaciaVertedor"),
    ("BaciaTubo", "BaciaVertedor"),
    ("EsterilRampa", "EsterilDozer"),
    # Fase 12 — o que encosta de proposito no cais e na cava.
    ("Barcaca", "Rebocador"),
    ("CavaShovel", "CavaEscav"),
    # A correia termina dentro da pilha que ela forma — e para isso que serve.
    ("Correia", "Pilhar"),
    ("Correia2", "Pilhar"),
    ("CorreiaCarvao", "PilhaCarvao"),
    # Gente e veiculo debaixo de estrutura: a caixa da estrutura os engole.
    ("OpEmbarque", "EmbarqueFerro"), ("OpEmbarque", "Galeria"),
    ("OpMina", "Barracao"), ("OpLog", "ArmazemLog"), ("OpPorto", "Empilh"),
    ("CarroLog", "CoberturaLog"),
    # Equipamento apoiado na rampa da cava.
    ("CavaRampa", "Cava"),
    ("Correia", "CorreiaPe"),
    # Patio de britagem: correia, britador e pilhas se tocam por definicao, e
    # esse aglomerado e anterior a todas estas fases.
    ("Britador", "Correia"), ("Britador", "Pilhar"), ("Pilhar", "Pilhar"),
    ("Correia2", "MinaOficina"), ("Correia2", "OpMina"),
    ("Desvio3", "PNMinaOval"),
    ("ConeMina", "MinaOficina"),
    ("MinaOficina", "Pilhar"), ("MinaOficina", "OpMina"),
    ("Barracao", "PeneiraUsina"),
    # Galerias C e D se encontram na torre de transferencia B, e a D passa por
    # cima do portico da empilhadeira — as duas coisas sao o projeto.
    ("GaleriaC", "GaleriaD"), ("GaleriaD", "EmpilhPortico"),
    # Fase 14 — o campus e feito de coisa dentro de coisa: interior dentro da
    # baia, carro debaixo da cobertura, operador na portaria.
    ("CentroBaia", "CentroEst"), ("CentroBaia", "CentroCtrl"),
    ("CentroCarro", "CentroCob"), ("CentroPortaria", "OpScada"),
    ("CentroBaia", "OpScada"), ("CentroPlata", "Centro"),
    ("CentroCtrl", "OpScada"), ("CentroBloco", "Centro"),
)


def _relevante(ob):
    if ob.type != "MESH" or ob.parent is not None:
        return False
    return not any(ob.name.startswith(p) for p in IGNORAR)


def _bbox(ob):
    pts = [ob.matrix_world @ v.co for v in ob.data.vertices] if ob.data.vertices else []
    if not pts:
        return None
    xs = [p.x for p in pts]
    ys = [p.y for p in pts]
    zs = [p.z for p in pts]
    return (min(xs), max(xs), min(ys), max(ys), min(zs), max(zs))


def _tolerado(a, b):
    for p, q in TOLERADOS:
        if (a.startswith(p) and b.startswith(q)) or (a.startswith(q) and b.startswith(p)):
            return True
    return False


def _alongado(bb, fator=5.0):
    """A caixa envolvente deste objeto diz pouco sobre onde ele esta?

    Uma cerca de 9 unidades, uma rampa helicoidal ou uma galeria inclinada tem
    caixa envolvente quase toda vazia: qualquer coisa pequena que caia dentro
    dela aparece como 100% de interpenetracao. Sem este filtro o relatorio vinha
    com 171 pares, quase todos falsos, e o defeito de verdade se perdia no meio.
    """
    d = sorted((bb[1] - bb[0], bb[3] - bb[2], bb[5] - bb[4]))
    return d[2] > fator * max(d[0], 1e-4)


def report_overlaps(limite=0.18):
    """Imprime pares que se cruzam em mais de `limite` do volume do menor."""
    bpy.context.view_layer.update()
    itens = []
    for ob in bpy.data.objects:
        if not _relevante(ob):
            continue
        bb = _bbox(ob)
        if bb:
            itens.append((ob.name, bb, _alongado(bb)))

    achados = []
    vagos = 0
    for i in range(len(itens)):
        na, a, la = itens[i]
        va = max(1e-6, (a[1] - a[0]) * (a[3] - a[2]) * (a[5] - a[4]))
        for j in range(i + 1, len(itens)):
            nb, b, lb = itens[j]
            ox = min(a[1], b[1]) - max(a[0], b[0])
            oy = min(a[3], b[3]) - max(a[2], b[2])
            oz = min(a[5], b[5]) - max(a[4], b[4])
            if ox <= 0 or oy <= 0 or oz <= 0:
                continue
            if _tolerado(na, nb):
                continue
            if la or lb:
                vagos += 1
                continue
            vb = max(1e-6, (b[1] - b[0]) * (b[3] - b[2]) * (b[5] - b[4]))
            frac = (ox * oy * oz) / min(va, vb)
            if frac >= limite:
                achados.append((frac, na, nb))

    achados.sort(reverse=True)
    print(f"OVERLAP_REPORT {len(achados)} par(es) acima de {limite:.0%} de interpenetracao"
          f" ({vagos} par(es) ignorados por caixa alongada)")
    for frac, na, nb in achados[:40]:
        print(f"  {frac:6.1%}  {na}  <->  {nb}")
    if len(achados) > 40:
        print(f"  ... e mais {len(achados) - 40}")
    return achados
