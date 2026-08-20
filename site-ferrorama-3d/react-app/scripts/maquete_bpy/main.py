from __future__ import annotations

import os
import sys

import bpy

from .coords import clear_scene, collection
from .environment import build_board, build_fair_lights, build_hills, build_scada, build_trees
from .iron_mine import build_iron_mine
from .materials import make_palette
from .port import build_port
from .railway import build_railway
from .roads import build_roads
from .vehicles import build_train, build_volvo_cat


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
    build_hills(m)
    build_iron_mine(m)
    build_volvo_cat(m, road_mine)
    build_port(m)
    build_scada(m)
    build_trees(m)
    build_fair_lights(m)
    build_train(m)

    _move_prefix(("Placa", "Grama"), cols["BOARD"])
    _move_prefix(("Estrada", "Faixa", "Apron", "Pad", "PatioMina", "LuzEstrada"), cols["ROADS"])
    _move_prefix(
        ("Cais", "Agua", "Armazem", "Galpao", "Hopper", "Guind", "Lanca", "Cabo", "Carga", "Navio", "Casco", "Ponte", "Chamine", "Cnt", "LuzPorto", "CorreiaPorto", "SiloPorto"),
        cols["PORT"],
    )
    _move_prefix(
        ("Loop", "Diag", "Ramo", "PatioA", "PatioB", "PatioPlat", "Desvio", "Plat", "Casa", "Telhado", "Janela", "Sem", "LuzEst", "LuzOval"),
        cols["RAILWAY"],
    )
    _move_prefix(
        ("Mina", "Barracao", "Britador", "Pilhar", "Correia", "Cerca", "Carvao", "Silo", "Pilha", "Terminal", "LuzMina", "LuzCarvao"),
        cols["IRON_MINE"],
    )
    _move_prefix(("Volvo", "VBody", "VCab", "VGlass", "VTrack", "VBoom", "VStick", "VBucket", "VTooth", "CAT", "CChassi", "CCab", "CGlass", "CBed", "COre", "C137", "Trem", "Loco", "Vagao"), cols["VEHICLES"])
    _move_prefix(("Sala", "Mesa", "Mon", "Caneca", "Pasta", "Cadeira"), cols["SCADA"])
    _move_prefix(("Morro", "Capim", "Tunel", "Tronco", "Copa"), cols["ENVIRONMENT"])

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
    try:
        kwargs["export_image_format"] = "JPEG"
        kwargs["export_jpeg_quality"] = 72
    except Exception:
        pass
    bpy.ops.export_scene.gltf(**kwargs)
    print("EXPORT_OK", out, "bytes", os.path.getsize(out) if os.path.isfile(out) else 0)
