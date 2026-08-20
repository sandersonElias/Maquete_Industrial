from __future__ import annotations

from .coords import bv
from .curves import extrude_along
from .primitives import cube
from .railway import poste_luz


def faixas(name, points, mat, closed=False):
    import bpy

    from .primitives import assign, join

    objs = []
    acc = 0.0
    n = len(points)
    last = n if closed else n - 1
    on = True
    for i in range(last):
        p = points[i]
        nxt = points[(i + 1) % n]
        acc += (nxt - p).length
        if acc < 0.42:
            continue
        acc = 0.0
        on = not on
        if not on:
            continue
        t = nxt - p
        t.z = 0
        if t.length < 1e-6:
            continue
        ang = __import__("math").atan2(t.x, t.y)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(p.x, p.y, p.z + 0.035), rotation=(0, 0, ang))
        ob = bpy.context.object
        ob.scale = (0.32, 0.045, 0.012)
        bpy.ops.object.transform_apply(scale=True)
        assign(ob, mat)
        objs.append(ob)
    if objs:
        join(name, objs)


def haul_roads():
    road_mine = [
        bv(-12.55, 0.08, -6.75),
        bv(-11.2, 0.08, -5.85),
        bv(-9.7, 0.08, -4.95),
        bv(-8.15, 0.08, -4.1),
    ]
    road_port = [
        bv(8.2, 0.08, 4.55),
        bv(11.5, 0.08, 6.25),
        bv(14.6, 0.08, 7.55),
        bv(16.9, 0.08, 8.25),
    ]
    return road_mine, road_port


def build_roads(m):
    road_mine, road_port = haul_roads()
    extrude_along("EstradaMina", road_mine, 0.92, 0.05, m["asph"], False)
    extrude_along("EstradaPorto", road_port, 1.05, 0.05, m["asph"], False)
    faixas("FaixaMina", road_mine, m["paint"])
    faixas("FaixaPorto", road_port, m["paint"])
    cube("PatioMina", (3.4, 0.06, 2.4), (-8.1, 0.08, -3.55), m["asph"], 0.01)
    cube("ApronPorto", (5.6, 0.06, 4.2), (14.4, 0.08, 7.4), m["asph"], 0.01)
    cube("PadCarga", (2.6, 0.06, 2.2), (-12.4, 0.08, -6.55), m["asph"], 0.01)
    poste_luz("LuzEstrada0", -10.4, -5.4, m["black"], m["glow"], 1.35)
    poste_luz("LuzEstrada1", -9.0, -4.55, m["black"], m["glow"], 1.35)
    poste_luz("LuzEstrada2", 10.2, 5.7, m["black"], m["glow"], 1.4)
    poste_luz("LuzEstrada3", 13.4, 7.1, m["black"], m["glow"], 1.4)
    return road_mine, road_port
