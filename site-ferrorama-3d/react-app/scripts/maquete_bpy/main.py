from __future__ import annotations

import os
import sys

import bpy

from .checks import report_overlaps
from .coords import clear_scene, collection
from .details import build_details
from .environment import build_board, build_fair_lights, build_hills, build_scada, build_trees
from .iron_mine import build_iron_mine
from .landscape import build_landscape
from .materials import make_palette
from .pit import build_pit
from .port import build_port
from .process import build_process_chain
from .rail_detail import build_rail_detail
from .railway import build_railway
from .roads import build_roads
from .site import build_site
from .structures import build_structures
from .vehicles import build_train, build_volvo_cat
from .weather import sujar_industriais


def _out_path() -> str:
    out = "maquete-blender.glb"
    if "--" in sys.argv:
        args = sys.argv[sys.argv.index("--") + 1 :]
        if args:
            out = args[0]
    return out


def _ensure_cols():
    names = ("BOARD", "RAILWAY", "ROADS", "IRON_MINE", "PORT", "VEHICLES", "SCADA", "ENVIRONMENT")
    cols = {n: collection(n) for n in names}
    bpy.context.view_layer.active_layer_collection = bpy.context.view_layer.layer_collection
    return cols


def _move_prefix(prefixes, col):
    scene_col = bpy.context.scene.collection
    for ob in list(scene_col.objects):
        if any(ob.name.startswith(p) for p in prefixes):
            if ob.name not in col.objects:
                col.objects.link(ob)
            if ob.name in scene_col.objects:
                scene_col.objects.unlink(ob)


def build():
    clear_scene()
    cols = _ensure_cols()
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end = 240
    sc.render.fps = 24

    m = make_palette()
    build_board(m)
    build_railway(m)
    road_mine, _road_port = build_roads(m)
    build_rail_detail(m)
    build_hills(m)
    build_iron_mine(m)
    build_pit(m)
    build_volvo_cat(m, road_mine)
    build_port(m)
    build_process_chain(m)
    build_structures(m)
    build_site(m)
    build_details(m)
    build_landscape(m)
    build_scada(m)
    build_trees(m)
    build_fair_lights(m)
    build_train(m)

    _move_prefix(("Placa", "Grama"), cols["BOARD"])
    _move_prefix(("Estrada", "Faixa", "Apron", "Pad", "PatioMina", "LuzEstrada", "Portaria"), cols["ROADS"])
    _move_prefix(
        (
            "Cais", "Agua", "Armazem", "Galpao", "Guind", "Lanca", "Cabo", "Carga", "Navio",
            "Casco", "Ponte", "Chamine", "Cnt", "LuzPorto", "SiloPorto",
            # Cadeia de processo do porto (process.py) — precisa vir antes de
            # IRON_MINE, que reivindica os prefixos genericos "Pilha" e "Silo".
            "Virador", "GaleriaC", "GaleriaD", "TransfB", "PilhaPatio", "PatioTrilhos",
            "Empilh", "Ship",
            # Fases 2/3/6/7 do lado do porto.
            "MastroLuzPorto", "OpPorto", "TamboresPorto", "PaletePorto", "ObraPorto",
            "PocaPorto", "OleoPorto", "SinalPorto", "Bandeiras", "ConePorto",
            "CercaPorto", "Defensa", "Balanca",
        ),
        cols["PORT"],
    )
    _move_prefix(
        ("Loop", "Diag", "Ramo", "PatioA", "PatioB", "PatioPlat", "Desvio", "Plat", "Casa", "Telhado", "Janela", "Sem", "LuzEst", "LuzOval",
         # Fase 9: aparelhos de via.
         "PN", "ParaChoque", "MarcoKm"),
        cols["RAILWAY"],
    )
    _move_prefix(
        (
            "Mina", "Barracao", "Britador", "Pilhar", "Correia", "Cerca", "Carvao", "Silo",
            "Pilha", "Terminal", "LuzMina", "LuzCarvao",
            "GaleriaA", "GaleriaB", "TransfA", "Embarque",
            # Fases 2/3/6/7 do lado da mina.
            "Subest", "Tanque", "PipeRack", "MastroLuzMina", "OpMina", "OpEmbarque",
            "Sucata", "TamboresOficina", "PaleteOficina", "ObraMina",
            "PocaEstrada", "PocaPatioMina", "OleoOficina", "SinalMina", "SinalVia",
            "LinhaMina", "ConeMina",
            # Fase 8: cava descendente, disposicao de esteril/rejeito e usina.
            "Cava", "Esteril", "Bacia", "Peneira", "Espessador", "Caminhao",
        ),
        cols["IRON_MINE"],
    )
    _move_prefix(("Pickup", "Volvo", "VBody", "VCab", "VGlass", "VTrack", "VBoom", "VStick", "VBucket", "VTooth", "CAT", "CChassi", "CCab", "CGlass", "CBed", "COre", "C137", "Trem", "Loco", "Vagao"), cols["VEHICLES"])
    _move_prefix(("Sala", "Mesa", "Mon", "Caneca", "Pasta", "Cadeira", "OpScada"), cols["SCADA"])
    _move_prefix(
        (
            "Morro", "Capim", "Tunel", "Tronco", "Copa",
            # Fase 10: terra batida, revegetacao e cortina arborea.
            "PatioMinaTerra", "PatioCavaTerra", "CavaVerde", "EsterilVerde",
            "BaciaVerde", "Cortina",
        ),
        cols["ENVIRONMENT"],
    )

    # Fase 4/5: desgaste e oclusao gravados em COLOR_0, depois dos joins.
    sujar_industriais()
    report_overlaps()

    sc.frame_set(1)
    out = _out_path()
    dest = os.path.dirname(out)
    if dest:
        os.makedirs(dest, exist_ok=True)
    kwargs = dict(
        filepath=out,
        export_format="GLB",
        export_apply=True,
        export_animations=True,
        export_extras=False,
        export_lights=False,
        export_cameras=False,
    )
    # Opcionais que mudam de nome entre versoes do Blender: so passamos os que
    # existirem de fato no operador, senao o export inteiro morre num TypeError.
    opcionais = {
        "export_image_format": "JPEG",
        "export_jpeg_quality": 72,
        # Sem isto o exportador so leva COLOR_0 quando o material do Blender
        # referencia o atributo de cor — e os nossos nao referenciam.
        "export_vertex_color": "ACTIVE",
        # Compressao Draco: o .glb e o gargalo real da maquete no celular.
        # O decodificador vive em public/draco/ e o loader ja aponta para la.
        # Quantizacao generosa em normal/uv porque a maquete e vista de longe;
        # posicao fica em 14 bits para nao tremer trilho nem trelica.
        "export_draco_mesh_compression_enable": True,
        "export_draco_mesh_compression_level": 6,
        "export_draco_position_quantization": 14,
        "export_draco_normal_quantization": 8,
        "export_draco_texcoord_quantization": 10,
        "export_draco_color_quantization": 8,
        "export_draco_generic_quantization": 12,
    }
    try:
        disponiveis = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
    except Exception:
        disponiveis = set(opcionais)
    for k, v in opcionais.items():
        if k in disponiveis:
            kwargs[k] = v
        else:
            print("EXPORT_SKIP", k)
    try:
        bpy.ops.export_scene.gltf(**kwargs)
    except TypeError as exc:
        print("EXPORT_RETRY", exc)
        for k in opcionais:
            kwargs.pop(k, None)
        bpy.ops.export_scene.gltf(**kwargs)
    print("EXPORT_OK", out, "bytes", os.path.getsize(out) if os.path.isfile(out) else 0)
