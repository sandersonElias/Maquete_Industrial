"""Fase 10 — o terreno para de mentir: laterita, revegetação e cortina arbórea.

Três coisas separavam o entorno da maquete de uma área industrial brasileira
de verdade, e nenhuma delas custa geometria cara:

* **O chão era grama até encostar no britador.** Não existe mineradora com
  gramado no pátio de britagem. Dentro da cerca o solo é terra batida, e no
  Quadrilátero Ferrífero essa terra é laterita — vermelha, e é ela que dá o
  tom da paisagem inteira. Entram discos achatados de `dirt` logo acima da
  grama, sempre a mais de 0,6 do eixo da via para não cobrir dormente.

* **Bancada de mina não fica nua para sempre.** Bancada que saiu de operação é
  revegetada — é condição de licença ambiental, e é o que dá àquelas fotos de
  Itabira as faixas verdes horizontais no meio do talude vermelho. Entram
  anéis finos de grama nas banquetas da cava e da pilha de estéril.

* **Faltava a cortina arbórea.** O cinturão verde no limite do sítio também é
  exigência de licença, e visualmente é o que separa "área industrial" de
  "caixa de máquinas no vazio". Entram duas fileiras: uma ao sul da cerca da
  mina e outra ao norte da do terminal.

Convenção de coordenadas e de rotação: igual ao resto (ver `process.py`).
"""

from __future__ import annotations

import math

from .flora import fileira
from .pit import BACIA, CAVA, ESTERIL
from .primitives import cyl, join, lathe_solid

# A grama vai a 0,072 com o displace; a terra batida nasce logo acima.
Y_TERRA = 0.082


def patio_terra(name, discos, m):
    """Terra batida como uma mancha de discos sobrepostos, não um retângulo.

    Retângulo de terra sobre grama denuncia o modelo na hora — o limite real
    entre pátio e mato é irregular, feito por onde o caminhão passou.
    """
    p = [
        cyl(f"{name}{i}", r, 0.02, (x, Y_TERRA, z), m["dirt"], 22)
        for i, (x, z, r) in enumerate(discos)
    ]
    return join(name, p)


def anel_verde(name, centro, perfil, m, segs=36):
    """Faixa de revegetação numa banqueta: um anel fino colado no talude."""
    return lathe_solid(name, perfil, segs, (centro[0], 0.0, centro[1]), m["grass"], displace=0.012, noise=1.1)


def fileira_arvores(prefixo, pontos, m, passo=1.25, jitter=0.28):
    """Cortina arborea seguindo uma polilinha.

    Desde a fase 15 a arvore em si vem de `flora.py`, que sorteia especie, tom
    e altura. Aqui fica so o tracado: a funcao continua existindo porque as
    chamadas dela descrevem *onde* passa a cortina, que e decisao de paisagem.
    """
    return fileira(prefixo, pontos, m, passo=passo, jitter=jitter, escala=0.9, arbustos=0.28)


# ---------------------------------------------------------------------------


def build_landscape(m):
    # Pátio de britagem, oficina e barracão. O disco mais a leste para em
    # x=-19,55, que deixa 0,62 até o eixo da alça no ponto mais próximo
    # (medido pelo Catmull densificado, não pela polilinha).
    patio_terra(
        "PatioMinaTerra",
        [
            (-22.4, -9.2, 1.5),
            (-21.6, -7.2, 1.4),
            (-20.6, -8.4, 1.05),
            (-20.6, -9.6, 1.0),
            (-22.2, -5.9, 1.0),
        ],
        m,
    )
    # Faixa de serviço entre a cava, a pilha de estéril e a bacia: é por onde
    # o caminhão passa, então não sobra capim.
    patio_terra(
        "PatioCavaTerra",
        [
            (-18.9, -11.6, 0.9),
            (-18.2, -12.4, 0.8),
            (-16.0, -12.9, 0.8),
            (-15.4, -12.6, 0.7),
        ],
        m,
    )

    # Revegetação: banqueta externa da cava e as duas da pilha de estéril.
    anel_verde("CavaVerde", CAVA, [(1.64, 0.298), (1.57, 0.314), (1.50, 0.324)], m)
    anel_verde("EsterilVerde0", ESTERIL, [(1.26, 0.298), (1.20, 0.312), (1.14, 0.324)], m, segs=30)
    anel_verde("EsterilVerde1", ESTERIL, [(1.04, 0.558), (0.99, 0.57), (0.92, 0.584)], m, segs=30)
    # Talude do dique da bacia, que é de terra compactada e engrama sozinho.
    anel_verde("BaciaVerde", BACIA, [(1.18, 0.02), (1.12, 0.12), (1.07, 0.2)], m, segs=30)

    # Cortina arbórea. Ao sul da cerca da mina e ao norte da do terminal, nos
    # dois casos dentro da grama (que termina em |z| = 16,7).
    fileira_arvores("CortinaMina", [(-22.2, -15.2), (-16.2, -15.9), (-11.4, -14.8)], m)
    fileira_arvores("CortinaPorto", [(10.4, 15.9), (15.6, 16.1), (20.2, 16.0)], m)
    # Fase 13 — alameda por dentro do muro do terminal logistico, no eixo da
    # via interna. Alameda arborizada e o que separa um patio industrial novo
    # de um estacionamento de galpao.
    fileira_arvores("AlamedaLog", [(1.5, 10.2), (5.0, 10.2), (8.6, 10.2)], m, passo=1.1, jitter=0.14)
