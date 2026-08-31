"""Folha de contato dos assets — todos os termos independentes, lado a lado.

Este script existe por um motivo específico: **não dá para consertar qualidade
que não se enxerga**. Enquanto cada peça só aparecia enterrada no tabuleiro,
julgar "o silo está feio" exigia caçar o silo no meio de quinhentos objetos.
Aqui cada asset nasce sozinho, numa célula com placa de concreto, etiqueta com
o slug e um operário do lado servindo de régua.

Uso (a partir de `site-ferrorama-3d/react-app`):

    ~/.claude/bpy-env/Scripts/python.exe scripts/gerar_folha_assets.py -- public/models/assets-catalogo.glb

Saídas:

* o `.glb` da folha, com um asset por célula;
* `public/models/assets-catalogo.json`, o índice com slug, família, referência,
  posição na folha e pegada — para navegar até um asset específico.

Filtros opcionais depois do caminho de saída:

    ... -- saida.glb extracao porto        # só essas famílias
    ... -- saida.glb slug:silo-conico       # um asset só, para iterar rápido
"""

from __future__ import annotations

import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402

from maquete_bpy.assets import FAMILIAS, TODOS  # noqa: E402
from maquete_bpy.assets.patio import operario  # noqa: E402
from maquete_bpy.coords import clear_scene, tloc  # noqa: E402
from maquete_bpy.materials import make_palette  # noqa: E402
from maquete_bpy.primitives import cube  # noqa: E402

# Folga entre células. A folha é para olhar peça por peça, então sobra espaço
# de propósito: assets encostados disputam a leitura um do outro.
FOLGA = 1.6
COLUNAS = 10


def _argumentos():
    if "--" not in sys.argv:
        return "assets-catalogo.glb", []
    args = sys.argv[sys.argv.index("--") + 1 :]
    if not args:
        return "assets-catalogo.glb", []
    return args[0], args[1:]


def _selecionar(filtros):
    if not filtros:
        return list(TODOS)
    slugs = {f.split(":", 1)[1] for f in filtros if f.startswith("slug:")}
    familias = {f for f in filtros if not f.startswith("slug:")}
    escolhidos = [a for a in TODOS if a.slug in slugs or a.familia in familias]
    if not escolhidos:
        raise SystemExit(f"nenhum asset casou com {filtros!r}")
    return escolhidos


def _etiqueta(texto, x, z, altura=0.16):
    """Placa de texto rente ao chão. Sem ela a folha vira um quebra-cabeça.

    Texto plano e com resolução de curva no mínimo: com o padrão do Blender
    (`resolution_u = 4` mais extrusão) os 106 rótulos sozinhos pesavam 1,8 MB
    no `.glb` — mais que todos os assets somados.
    """
    try:
        bpy.ops.object.text_add(location=tloc(x, 0.02, z), rotation=(0, 0, 0))
    except Exception:
        return None
    ob = bpy.context.object
    ob.data.body = texto
    ob.data.size = altura
    ob.data.align_x = "CENTER"
    ob.data.extrude = 0.0
    ob.data.resolution_u = 1
    ob.name = f"Rotulo_{texto}"
    try:
        bpy.ops.object.convert(target="MESH")
    except Exception:
        pass
    return bpy.context.object


def _regua_base(m):
    """Um operário só, reaproveitado por cópia vinculada em todas as células.

    Cada célula ganhando o seu próprio operário custava 1,7 MB. A cópia
    vinculada compartilha a malha: o exportador emite uma malha e 106 nós.
    """
    pecas = operario("ReguaOperario", 0.0, 0.0, m, yaw=math.pi * 0.75)
    if not pecas:
        return None, (0.0, 0.0, 0.0)
    # A origem precisa ser guardada antes de a primeira célula mover o original.
    return pecas[0], tuple(pecas[0].location)


def _regua(base, origem, x, z, i):
    """Coloca uma régua na célula. A primeira reaproveita o próprio original.

    Sem isso o operário-modelo ficaria abandonado na origem da folha, no meio
    do tabuleiro, sem célula nenhuma.
    """
    if base is None:
        return None
    # `tloc` é linear, então deslocar em mundo é somar o delta convertido.
    destino = (origem[0] + x, origem[1] + z, origem[2])
    if i == 0:
        base.location = destino
        base.name = "Regua_0"
        return base
    dup = base.copy()          # sem copiar `data`: a malha fica compartilhada
    bpy.context.collection.objects.link(dup)
    dup.name = f"Regua_{i}"
    dup.location = destino
    return dup


def gerar(saida, filtros):
    clear_scene()
    m = make_palette()
    escolhidos = _selecionar(filtros)

    # Ordena por família (na ordem do catálogo) para a folha ficar legível.
    ordem = {nome: i for i, nome in enumerate(FAMILIAS)}
    escolhidos.sort(key=lambda a: (ordem.get(a.familia, 99), a.slug))

    # Célula quadrada dimensionada pelo maior asset — assim nada invade o
    # vizinho e a grade continua sendo grade.
    lado = max(max(a.larg, a.prof) for a in escolhidos) + FOLGA
    regua_base, regua_origem = _regua_base(m)
    indice = []
    for i, a in enumerate(escolhidos):
        col, lin = i % COLUNAS, i // COLUNAS
        x = (col - (COLUNAS - 1) * 0.5) * lado
        z = -lin * lado
        # Placa de concreto: dá contraste ao objeto e marca o limite da célula.
        cube(f"Pad_{a.slug}", (lado * 0.92, 0.04, lado * 0.92), (x, -0.02, z), m["conc_dirty"], 0.01)
        cube(f"PadFaixa_{a.slug}", (lado * 0.92, 0.05, 0.05), (x, -0.015, z - lado * 0.45), m["paint"], 0.004)
        try:
            # Sem giro de proposito: assim a caixa envolvente medida em
            # `auditar_assets.mjs` casa com a pegada declarada no catalogo. O
            # tres-quartos quem da e a camera do visualizador.
            a.fn(f"AS_{a.slug}", x, z, m, yaw=0.0)
        except Exception as exc:  # noqa: BLE001 — um asset quebrado não pode derrubar a folha
            print("ASSET_FALHOU", a.slug, type(exc).__name__, exc)
            cube(f"Falha_{a.slug}", (0.4, 0.4, 0.4), (x, 0.2, z), m["sig_r"], 0.02)
        # Operário de régua, sempre no mesmo canto da célula.
        _regua(regua_base, regua_origem, x - lado * 0.4, z + lado * 0.4, i)
        _etiqueta(a.slug, x, z + lado * 0.46)
        indice.append(
            {
                "slug": a.slug,
                "nome": a.nome,
                "familia": a.familia,
                "referencia": a.ref,
                "pegada": [a.larg, a.prof, a.alt],
                "afunda": a.afunda,
                "celula": [round(x, 3), round(z, 3)],
            }
        )

    dest = os.path.dirname(saida)
    if dest:
        os.makedirs(dest, exist_ok=True)
    kwargs = dict(
        filepath=saida,
        export_format="GLB",
        export_apply=True,
        export_animations=False,
        export_extras=False,
        export_lights=False,
        export_cameras=False,
    )
    opcionais = {
        "export_image_format": "JPEG",
        "export_jpeg_quality": 70,
        "export_draco_mesh_compression_enable": True,
        "export_draco_mesh_compression_level": 6,
        "export_draco_position_quantization": 14,
        "export_draco_normal_quantization": 8,
        "export_draco_texcoord_quantization": 10,
    }
    try:
        disponiveis = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
    except Exception:
        disponiveis = set(opcionais)
    for k, v in opcionais.items():
        if k in disponiveis:
            kwargs[k] = v
    bpy.ops.export_scene.gltf(**kwargs)

    idx_path = os.path.splitext(saida)[0] + ".json"
    with open(idx_path, "w", encoding="utf-8") as fh:
        json.dump({"colunas": COLUNAS, "lado": round(lado, 3), "assets": indice}, fh, ensure_ascii=False, indent=2)

    print("FOLHA_OK", saida, "assets", len(escolhidos), "bytes", os.path.getsize(saida) if os.path.isfile(saida) else 0)
    print("INDICE_OK", idx_path)


if __name__ == "__main__":
    gerar(*_argumentos())
