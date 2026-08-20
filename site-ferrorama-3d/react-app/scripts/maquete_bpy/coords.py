from __future__ import annotations

import os

import bpy
from mathutils import Vector

RX, RZ, R_CORNER = 8.55, 5.2, 2.25
TEX = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tex")

IRON = (-17.2, -9.4)
COAL = (-19.4, 5.8)
PORT = (17.6, 8.6)
SCADA = (-5.8, 13.2)
YARD = (0.0, 3.4)


def tloc(x, y, z):
    return (x, z, y)


def tdim(sx, sy, sz):
    return (sx, sz, sy)


def bv(x, y, z):
    return Vector((x, z, y))


def y_east(_z: float) -> float:
    return 0.0


def y_west(_z: float) -> float:
    return 0.02


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.images, bpy.data.cameras, bpy.data.lights):
        for item in list(block):
            if getattr(item, "users", 1) == 0 or block is bpy.data.meshes:
                try:
                    block.remove(item)
                except Exception:
                    pass


def collection(name: str):
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    return col
