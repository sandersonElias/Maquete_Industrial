"""Fase 4/5 — desgaste e oclusão gravados em cor de vértice.

Por que cor de vértice e não textura: a maquete é aberta por QR code no
celular, na 4G da feira. Um atlas de máscaras de sujeira custaria centenas de
KB; um atributo `COLOR_0` custa alguns bytes por vértice e o three.js já o
multiplica na cor base automaticamente quando o glTF traz o atributo.

O que a função grava, em uma passada só:

* **Sujeira de pé de equipamento** — tudo que está perto do chão recebe poeira
  de minério. É o que separa uma estrutura "modelada" de uma "instalada".
* **Oclusão de face inferior** — vértices cuja normal aponta para baixo ficam
  mais escuros. É uma aproximação barata de AO: pega justamente as barrigas de
  viga, o vão sob as galerias e o embaixo dos telhados, que é onde o olho
  procura sombra de contato.
* **Ruído de manchas** — um valor pseudoaleatório estável por posição, para a
  sujeira não virar um degradê liso e artificial.

O AO "de verdade" fica por conta das sombras em tempo real do three.js, que
foram ligadas no `MaqueteBlender.tsx` na mesma fase.
"""

from __future__ import annotations

import math

import bpy


def _ruido(x, y, z):
    """Valor pseudoaleatório em [0,1], estável para a mesma posição."""
    n = math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
    return n - math.floor(n)


def sujar(
    objs,
    y_solo=0.0,
    alcance=0.6,
    forca=0.6,
    cor=(0.32, 0.25, 0.18),
    oclusao=0.45,
    mancha=0.22,
):
    """Grava `COLOR_0` nos objetos dados. Nunca falha o build."""
    pintados = 0
    for ob in objs:
        if ob is None or ob.type != "MESH":
            continue
        me = ob.data
        if not me.vertices:
            continue
        try:
            attr = me.color_attributes.get("Col")
            if attr is None:
                attr = me.color_attributes.new(name="Col", type="FLOAT_COLOR", domain="POINT")
            mw = ob.matrix_world
            rot = mw.to_3x3()
            for i, v in enumerate(me.vertices):
                p = mw @ v.co
                nrm = (rot @ v.normal).normalized() if v.normal.length > 0 else v.normal
                # No Blender Z é a altura; y_solo vem na convenção dos scripts.
                h = max(0.0, p.z - y_solo)
                base = max(0.0, 1.0 - h / alcance) * forca
                baixo = max(0.0, -nrm.z) * oclusao
                ruido = (_ruido(p.x, p.y, p.z) - 0.5) * mancha
                k = min(1.0, max(0.0, base + baixo + ruido))
                attr.data[i].color = (
                    1.0 - k * (1.0 - cor[0]),
                    1.0 - k * (1.0 - cor[1]),
                    1.0 - k * (1.0 - cor[2]),
                    1.0,
                )
            idx = me.color_attributes.find("Col")
            if idx >= 0:
                try:
                    me.color_attributes.active_color_index = idx
                except Exception:
                    pass
                try:
                    me.color_attributes.render_color_index = idx
                except Exception:
                    pass
            pintados += 1
        except Exception as exc:  # noqa: BLE001 — diagnóstico, não pode quebrar o build
            print("SUJEIRA_FAIL", ob.name, exc)
    return pintados


# Prefixos que recebem desgaste. Deixamos de fora grama, morros, água, veículos
# (que são "novos" na história) e a sala SCADA.
INDUSTRIAIS = (
    "Galeria", "Transf", "Embarque", "Virador", "Empilh", "Ship", "PatioTrilhos",
    "Silo", "Britador", "Correia", "Barracao", "Armazem", "Galpao", "Cais",
    "Terminal", "Pilha", "Pilhar", "Cerca", "Tanque", "Subest", "PipeRack",
    "MastroLuz", "Portaria", "Balanca", "Sucata", "Pier", "Defensa", "Meio",
    # Fase 8: cava, estruturas de disposicao e usina.
    "Cava", "Esteril", "Bacia", "Peneira", "Espessador", "EstradaCava",
    # Fase 9: aparelhos de via e a composicao.
    "Desvio", "PN", "ParaChoque", "TremVagao", "TremLoco",
    # Fase 12: equipamento novo de cais e de cava.
    "GuindasteTrelica", "ConteinerCais", "Barcaca", "Rebocador", "CavaShovel",
)


def sujar_industriais(y_solo=0.0):
    alvos = [
        ob
        for ob in bpy.data.objects
        if ob.type == "MESH" and any(ob.name.startswith(p) for p in INDUSTRIAIS)
    ]
    n = sujar(alvos, y_solo=y_solo)
    print(f"SUJEIRA_OK {n} objeto(s) com COLOR_0")
    return n
