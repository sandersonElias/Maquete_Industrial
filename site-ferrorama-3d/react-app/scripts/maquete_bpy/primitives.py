from __future__ import annotations

import math

import bpy

from .coords import tdim, tloc


def assign(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def apply_mods(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    for mod in list(obj.modifiers):
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except Exception:
            try:
                obj.modifiers.remove(mod)
            except Exception:
                pass
    obj.select_set(False)


def bevel(obj, width=0.03, segments=None):
    """Chanfro. O numero de segmentos acompanha a largura do chanfro.

    Tres segmentos em toda caixa do tabuleiro custavam ~150 vertices por
    cubo, contra ~36 de um segmento so. Num chanfro de 3 mm — que e o que
    346 das 516 caixas do catalogo de assets pedem — a diferenca entre um e
    tres segmentos nao existe na tela, mas na conta ela e a diferenca entre
    caber e nao caber no orcamento do `.glb`, que e servido no 4G da feira.
    Chanfro largo (0,02 para cima: galpao, muro, predio) continua com tres,
    porque ali ele aparece de verdade na silhueta.
    """
    if segments is None:
        segments = 3 if width >= 0.02 else (2 if width >= 0.008 else 1)
    m = obj.modifiers.new("Bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    m.angle_limit = math.radians(35)


def smooth(obj, ang=50):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(ang))
    except Exception:
        bpy.ops.object.shade_smooth()
    obj.select_set(False)


def unwrap(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    try:
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.02)
    except Exception:
        bpy.ops.uv.unwrap()
    bpy.ops.object.mode_set(mode="OBJECT")
    obj.select_set(False)


def cube(name, dims, loc, mat, bevel_w=0.025, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=tloc(*loc), rotation=(rot[0], rot[2], rot[1]))
    ob = bpy.context.object
    ob.name = name
    ob.data.name = name
    ob.scale = tdim(*dims)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if bevel_w > 0:
        bevel(ob, bevel_w)
        apply_mods(ob)
    assign(ob, mat)
    unwrap(ob)
    smooth(ob)
    return ob


# Fase 13 — piso de segmentos. Muitas chamadas pediam 6 ou 8 lados para poupar
# poligono, o que dava postes com cara de prisma hexagonal. Com a camera podendo
# descer ao nivel do chao isso aparece, e o custo e irrisorio: um cilindro de 16
# lados tem 32 vertices contra 16 de um de 8.
MIN_VERTS_CIL = 16
MIN_SEGS_LATHE = 32


def cyl(name, r, depth, loc, mat, verts=24, rot=(0, 0, 0), r2=None):
    # O piso de 16 lados vale do raio de poste para cima. Um fio de cerca de
    # 2 mm de raio com 16 lados e poligono jogado fora: ele ocupa menos de um
    # pixel de largura na tela do celular. Entre 1,5 e 5 cm de raio — tubo de
    # trelica, camada de conifera, haste — doze lados ja fecham a silhueta.
    verts = max(verts, 8 if r < 0.015 else (12 if r < 0.05 else MIN_VERTS_CIL))
    kw = dict(radius=r, depth=depth, location=tloc(*loc), rotation=(rot[0], rot[2], rot[1]), vertices=verts)
    if r2 is not None:
        bpy.ops.mesh.primitive_cone_add(
            radius1=r, radius2=r2, depth=depth, location=tloc(*loc), rotation=(rot[0], rot[2], rot[1]), vertices=verts
        )
    else:
        bpy.ops.mesh.primitive_cylinder_add(**kw)
    ob = bpy.context.object
    ob.name = name
    assign(ob, mat)
    unwrap(ob)
    smooth(ob)
    return ob


def sphere(name, r, loc, mat, scale=(1, 1, 1), segs=28):
    segs = max(segs, 24)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=tloc(*loc), segments=segs, ring_count=max(12, segs // 2))
    ob = bpy.context.object
    ob.name = name
    ob.scale = tdim(*scale)
    bpy.ops.object.transform_apply(scale=True)
    assign(ob, mat)
    unwrap(ob)
    smooth(ob, 40)
    return ob


def ico(name, r, loc, mat, sub=2, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=r, location=tloc(*loc), subdivisions=sub)
    ob = bpy.context.object
    ob.name = name
    ob.scale = tdim(*scale)
    bpy.ops.object.transform_apply(scale=True)
    assign(ob, mat)
    unwrap(ob)
    smooth(ob)
    return ob


def empty(name, loc=(0, 0, 0)):
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=tloc(*loc))
    ob = bpy.context.object
    ob.name = name
    return ob


def parent(child, root, loc=None):
    child.parent = root
    if loc is not None:
        child.location = tloc(*loc)


def join(name, objs):
    objs = [o for o in objs if o]
    if not objs:
        return None
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    ob = bpy.context.object
    ob.name = name
    return ob


def parent_keep(child, parent_ob):
    bpy.context.view_layer.update()
    mw = child.matrix_world.copy()
    child.parent = parent_ob
    child.matrix_parent_inverse = parent_ob.matrix_world.inverted()
    child.matrix_world = mw


def wheels(root, mat, xs, zs, r=0.08, y=0.08, depth=0.07):
    """Rodas em `xs` (lateral) x `zs` (longitudinal), eixo na transversal.

    A rotacao era `(math.pi/2, 0, 0)`, que no par (roll, yaw, pitch) desta
    base e *roll*: deitava o cilindro ao longo de z e as rodas apareciam de
    frente, como discos girados 90 graus. O correto e pitch — `(0, 0, pi/2)`
    poe o eixo em x, que e a transversal de um veiculo que anda em z.
    """
    for x in xs:
        for z in zs:
            w = cyl(f"w{x}{z}", r, depth, (0, 0, 0), mat, 16, (0, 0, math.pi / 2))
            parent(w, root, (x, y, z))


def lathe_solid(name, profile, segs, loc, mat, displace=0.0, noise=1.4):
    segs = max(segs, MIN_SEGS_LATHE)
    verts, faces = [], []
    rings = len(profile)
    for i in range(segs):
        a = (i / segs) * math.tau
        ca, sa = math.cos(a), math.sin(a)
        for r, h in profile:
            verts.append((r * ca, r * sa, h))
    for i in range(segs):
        i2 = (i + 1) % segs
        for j in range(rings - 1):
            a = i * rings + j
            b = i2 * rings + j
            faces.append((a, b, b + 1, a + 1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = tloc(*loc)
    if displace:
        tex = bpy.data.textures.new(f"{name}Disp", "CLOUDS")
        tex.noise_scale = noise
        tex.noise_depth = 2
        d = obj.modifiers.new("Disp", "DISPLACE")
        d.texture = tex
        d.strength = displace
        d.mid_level = 0.5
        apply_mods(obj)
    assign(obj, mat)
    unwrap(obj)
    smooth(obj, 55)
    return obj


def boolean_cut(target, cutter):
    bpy.context.view_layer.update()
    bpy.context.view_layer.objects.active = target
    target.select_set(True)
    mod = target.modifiers.new("Cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = cutter
    try:
        mod.solver = "FAST"
    except Exception:
        pass
    apply_mods(target)
    bpy.data.objects.remove(cutter, do_unlink=True)
