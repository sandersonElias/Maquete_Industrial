"""Maquete Ferrorama — cena de vitrine (Blender 4.5 LTS) → GLB.

Texturas: Poly Haven, CC0. Não é cubo-colorido: PBR, trilho com perfil,
terreno deslocado, veículos com peças e bevel.
"""
from __future__ import annotations

import math
import os
import sys

import bpy
from mathutils import Vector

OUT = "maquete-blender.glb"
if "--" in sys.argv:
    args = sys.argv[sys.argv.index("--") + 1 :]
    if args:
        OUT = args[0]

RX, RZ, R_CORNER = 8.55, 5.2, 2.25
TEX = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tex")


def y_east(z: float) -> float:
    u = 1 - min(1.0, abs(z) / 2.7)
    return (u**1.35) * 0.98 if u > 0 else 0.0


def y_west(z: float) -> float:
    u = 1 - min(1.0, abs(z) / 2.2)
    return (0.12 + (u**1.5) * 0.3) if u > 0 else 0.0


def tloc(x, y, z):
    return (x, z, y)


def tdim(sx, sy, sz):
    return (sx, sz, sy)


def bv(x, y, z):
    return Vector((x, z, y))


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


def bsdf_of(mat):
    return next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)


def load_img(path, non_color=False, size=640):
    img = bpy.data.images.load(path)
    if size and (img.size[0] > size or img.size[1] > size):
        img.scale(size, size)
    img.pack()
    if non_color:
        img.colorspace_settings.name = "Non-Color"
    return img


def pbr(name, diff=None, nor=None, rough_tex=None, color=(0.5, 0.5, 0.5), rough=0.5, metal=0.0, emit=0.0, uv=6.0, tint=None, tint_fac=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = bsdf_of(mat)
    if bsdf is None:
        return mat
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.22
    if emit > 0 and "Emission Strength" in bsdf.inputs:
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (*color, 1)
        bsdf.inputs["Emission Strength"].default_value = emit

    texcoord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (uv, uv, uv)
    nt.links.new(texcoord.outputs["UV"], mapping.inputs["Vector"])

    color_out = None
    if diff and os.path.isfile(diff):
        n = nt.nodes.new("ShaderNodeTexImage")
        n.image = load_img(diff, False)
        nt.links.new(mapping.outputs["Vector"], n.inputs["Vector"])
        color_out = n.outputs["Color"]
        if tint and tint_fac > 0:
            mix = nt.nodes.new("ShaderNodeMix")
            mix.data_type = "RGBA"
            # Factor 0 = tint, 1 = textura
            fac = 1.0 - tint_fac
            try:
                mix.inputs["Factor"].default_value = fac
            except Exception:
                mix.inputs[0].default_value = fac
            try:
                mix.inputs["A"].default_value = (*tint, 1)
            except Exception:
                pass
            nt.links.new(color_out, mix.inputs["B"])
            color_out = mix.outputs["Result"] if "Result" in mix.outputs else mix.outputs[0]
        nt.links.new(color_out, bsdf.inputs["Base Color"])
    if rough_tex and os.path.isfile(rough_tex):
        n = nt.nodes.new("ShaderNodeTexImage")
        n.image = load_img(rough_tex, True)
        nt.links.new(mapping.outputs["Vector"], n.inputs["Vector"])
        nt.links.new(n.outputs["Color"], bsdf.inputs["Roughness"])
    if nor and os.path.isfile(nor):
        n = nt.nodes.new("ShaderNodeTexImage")
        n.image = load_img(nor, True)
        nmap = nt.nodes.new("ShaderNodeNormalMap")
        nmap.inputs["Strength"].default_value = 0.85
        nt.links.new(mapping.outputs["Vector"], n.inputs["Vector"])
        nt.links.new(n.outputs["Color"], nmap.inputs["Color"])
        nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


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


def bevel(obj, width=0.03, segments=3):
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
    ob.scale = tdim(*dims)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if bevel_w > 0:
        bevel(ob, bevel_w)
        apply_mods(ob)
    assign(ob, mat)
    unwrap(ob)
    smooth(ob)
    return ob


def cyl(name, r, depth, loc, mat, verts=24, rot=(0, 0, 0), r2=None):
    kw = dict(radius=r, depth=depth, location=tloc(*loc), rotation=(rot[0], rot[2], rot[1]), vertices=verts)
    if r2 is not None:
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=depth, location=tloc(*loc), rotation=(rot[0], rot[2], rot[1]), vertices=verts)
    else:
        bpy.ops.mesh.primitive_cylinder_add(**kw)
    ob = bpy.context.object
    ob.name = name
    assign(ob, mat)
    unwrap(ob)
    smooth(ob)
    return ob


def sphere(name, r, loc, mat, scale=(1, 1, 1), segs=28):
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


def smooth_keys(obj):
    ad = getattr(obj, "animation_data", None)
    if not ad or not ad.action:
        return
    for fc in ad.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"
            kp.handle_left_type = "AUTO_CLAMPED"
            kp.handle_right_type = "AUTO_CLAMPED"


def _cm(p0, p1, p2, p3, t):
    t2, t3 = t * t, t * t * t
    return 0.5 * (
        (2.0 * p1)
        + (-p0 + p2) * t
        + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2
        + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3
    )


def _cm_d(p0, p1, p2, p3, t):
    t2 = t * t
    return 0.5 * (
        (-p0 + p2)
        + 2.0 * (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t
        + 3.0 * (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t2
    )


def catmull_at(points, t, closed=True):
    n = len(points)
    if n == 1:
        return points[0].copy(), Vector((0, 1, 0))
    if closed:
        u = (t % 1.0) * n
        i1 = int(math.floor(u)) % n
        frac = u - math.floor(u)
        i0, i2, i3 = (i1 - 1) % n, (i1 + 1) % n, (i1 + 2) % n
    else:
        t = max(0.0, min(1.0, t))
        u = t * (n - 1)
        i1 = min(int(math.floor(u)), n - 1)
        frac = u - math.floor(u) if i1 < n - 1 else 0.0
        i0 = max(i1 - 1, 0)
        i2 = min(i1 + 1, n - 1)
        i3 = min(i1 + 2, n - 1)
    p = _cm(points[i0], points[i1], points[i2], points[i3], frac)
    d = _cm_d(points[i0], points[i1], points[i2], points[i3], frac)
    if d.length < 1e-6:
        d = points[i2] - points[i0]
    return p, d


def ease_inout(t):
    t = max(0.0, min(1.0, t))
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0)


def keyframe_path(obj, points, frames=240, z_off=0.1, f0=1, f1=None, closed=True, ease=False, pitch=False):
    """Spline Catmull-Rom: curva contínua, nariz na tangente, opcional ease nas pontas."""
    n = len(points)
    if n < 2:
        return
    if f1 is None:
        f1 = frames
    obj.rotation_mode = "XYZ"
    span = max(f1 - f0, 1)
    prev = None
    for f in range(f0, f1 + 1):
        raw = (f - f0) / span
        t = ease_inout(raw) if ease else raw
        if closed:
            t = (f - f0) / span
            if t >= 1.0:
                t = 0.0
        p, tang = catmull_at(points, t, closed=closed)
        yaw_v = Vector((tang.x, tang.y, 0.0))
        if yaw_v.length < 1e-6:
            yaw_v = Vector((0, 1, 0))
        else:
            yaw_v.normalize()
        ang = math.atan2(yaw_v.x, yaw_v.y)
        if prev is not None:
            while ang - prev > math.pi:
                ang -= math.tau
            while ang - prev < -math.pi:
                ang += math.tau
        prev = ang
        pit = 0.0
        if pitch:
            pit = -math.atan2(tang.z, max(yaw_v.length, 1e-6))
            pit = max(-0.42, min(0.18, pit))
        obj.location = (p.x, p.y, p.z + z_off)
        obj.rotation_euler = (pit, 0.0, ang)
        obj.keyframe_insert("location", frame=f)
        obj.keyframe_insert("rotation_euler", frame=f)
    smooth_keys(obj)


def arc(cx, cz, r, a0, a1, n, yfn=None):
    pts = []
    for i in range(n + 1):
        a = a0 + (a1 - a0) * i / n
        x = cx + math.cos(a) * r
        z = cz + math.sin(a) * r
        y = yfn(x, z) if yfn else 0.0
        pts.append(bv(x, y, z))
    return pts


def stadium_points():
    cx_e, cz_n = RX - R_CORNER, RZ - R_CORNER
    cx_w, cz_s = -(RX - R_CORNER), -(RZ - R_CORNER)
    pts = []
    for i in range(23):
        z = cz_s + (cz_n - cz_s) * i / 22
        pts.append(bv(RX, y_east(z), z))
    pts += arc(cx_e, cz_n, R_CORNER, 0, math.pi / 2, 16)[1:]
    for i in range(1, 18):
        t = i / 17
        pts.append(bv(cx_e + (cx_w - cx_e) * t, 0.0, RZ))
    pts += arc(cx_w, cz_n, R_CORNER, math.pi / 2, math.pi, 16)[1:]
    for i in range(1, 22):
        z = cz_n + (cz_s - cz_n) * i / 21
        pts.append(bv(-RX, y_west(z), z))
    pts += arc(cx_w, cz_s, R_CORNER, math.pi, 1.5 * math.pi, 16)[1:]
    for i in range(1, 18):
        t = i / 17
        pts.append(bv(cx_w + (cx_e - cx_w) * t, 0.0, -RZ))
    pts += arc(cx_e, cz_s, R_CORNER, 1.5 * math.pi, 2 * math.pi, 16)[1:-1]
    return pts


def make_curve(name, points, closed=True):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    spline = curve.splines.new("NURBS")
    spline.points.add(len(points) - 1)
    for i, p in enumerate(points):
        spline.points[i].co = (p.x, p.y, p.z, 1.0)
    spline.use_cyclic_u = closed
    spline.order_u = 4
    spline.resolution_u = 16
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    return obj


def offset_points(points, dist):
    out = []
    n = len(points)
    for i, p in enumerate(points):
        nxt = points[(i + 1) % n]
        t = nxt - p
        t.z = 0
        if t.length < 1e-6:
            out.append(p.copy())
            continue
        t.normalize()
        side = Vector((-t.y, t.x, 0))
        out.append(p + side * dist)
    return out


def extrude_along(name, points, width, height, mat, closed=True):
    verts, faces = [], []
    hw = width / 2
    n = len(points)
    for i, p in enumerate(points):
        nxt = points[(i + 1) % n] if closed else points[min(i + 1, n - 1)]
        t = nxt - p
        t.z = 0
        if t.length < 1e-8:
            t = Vector((1, 0, 0))
        t.normalize()
        side = Vector((-t.y, t.x, 0)) * hw
        y0 = p.z
        verts += [
            (p.x - side.x, p.y - side.y, y0),
            (p.x + side.x, p.y + side.y, y0),
            (p.x + side.x, p.y + side.y, y0 + height),
            (p.x - side.x, p.y - side.y, y0 + height),
        ]
    segs = n if closed else n - 1
    for i in range(segs):
        a, b = i * 4, ((i + 1) % n) * 4
        for k in range(4):
            faces.append((a + k, a + (k + 1) % 4, b + (k + 1) % 4, b + k))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj, mat)
    unwrap(obj)
    smooth(obj)
    return obj


def curve_to_rail(name, points, mat, radius=0.018):
    obj = make_curve(name, points, True)
    obj.data.bevel_depth = radius
    obj.data.bevel_resolution = 3
    obj.data.use_fill_caps = True
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    mesh_ob = bpy.context.object
    mesh_ob.name = name
    assign(mesh_ob, mat)
    smooth(mesh_ob, 30)
    return mesh_ob


def sleepers(points, mat, step=0.36):
    objs = []
    acc = 0.0
    n = len(points)
    for i in range(n):
        p = points[i]
        nxt = points[(i + 1) % n]
        acc += (nxt - p).length
        if acc < step:
            continue
        acc = 0.0
        t = nxt - p
        t.z = 0
        if t.length < 1e-6:
            continue
        ang = math.atan2(t.x, t.y)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(p.x, p.y, p.z + 0.038), rotation=(0, 0, ang))
        ob = bpy.context.object
        ob.scale = (0.62, 0.1, 0.042)
        bpy.ops.object.transform_apply(scale=True)
        assign(ob, mat)
        objs.append(ob)
    return join("Dormentes", objs)


def wheels(root, mat, xs, zs, r=0.08, y=0.08, depth=0.07):
    for x in xs:
        for z in zs:
            w = cyl(f"w{x}{z}", r, depth, (0, 0, 0), mat, 16, (math.pi / 2, 0, 0))
            parent(w, root, (x, y, z))


def lathe_solid(name, profile, segs, loc, mat, displace=0.0, noise=1.4):
    """Perfil (raio, altura) girado — morro/cratera, não esfera achatada."""
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


# ---------------------------------------------------------------------------
# Scene
# ---------------------------------------------------------------------------

def build():
    clear_scene()
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end = 240
    sc.render.fps = 24

    g = os.path.join
    m_wood = pbr("Madeira", g(TEX, "wood_diff.jpg"), g(TEX, "wood_nor.jpg"), g(TEX, "wood_rough.jpg"), uv=3.2)
    m_grass = pbr(
        "Grama",
        g(TEX, "grass_diff.jpg"),
        g(TEX, "grass_nor.jpg"),
        g(TEX, "grass_rough.jpg"),
        uv=3.4,
        tint=(0.12, 0.28, 0.08),
        tint_fac=0.52,
        rough=0.92,
    )
    m_dirt = pbr("Terra", g(TEX, "mud_diff.jpg"), g(TEX, "mud_nor.jpg"), g(TEX, "mud_rough.jpg"), uv=4.5, tint=(0.28, 0.18, 0.1), tint_fac=0.25)
    m_rock = pbr("Rocha", g(TEX, "rock_diff.jpg"), g(TEX, "rock_nor.jpg"), g(TEX, "rock_rough.jpg"), uv=3.8, tint=(0.32, 0.26, 0.2), tint_fac=0.2)
    m_asph = pbr("Asfalto", g(TEX, "asphalt_diff.jpg"), g(TEX, "asphalt_nor.jpg"), g(TEX, "asphalt_rough.jpg"), uv=5.0)
    m_conc = pbr("Concreto", g(TEX, "concrete_diff.jpg"), g(TEX, "concrete_nor.jpg"), g(TEX, "concrete_rough.jpg"), uv=3.4)
    m_ballast = pbr(
        "Lastro",
        g(TEX, "rock_diff.jpg"),
        g(TEX, "rock_nor.jpg"),
        g(TEX, "rock_rough.jpg"),
        uv=14.0,
        tint=(0.18, 0.16, 0.14),
        tint_fac=0.55,
        rough=0.95,
    )
    m_sleeper = pbr("Dormente", g(TEX, "wood_diff.jpg"), g(TEX, "wood_nor.jpg"), None, color=(0.12, 0.08, 0.05), rough=0.9, uv=1.4)
    m_rail = pbr("Trilho", color=(0.42, 0.44, 0.48), rough=0.28, metal=0.88, uv=1)
    m_mrs_b = pbr("MRS_Azul", color=(0.04, 0.12, 0.38), rough=0.28, metal=0.35)
    m_mrs_y = pbr("MRS_Amarelo", color=(0.95, 0.78, 0.04), rough=0.32, metal=0.15)
    m_ore = pbr("Minerio", g(TEX, "mud_diff.jpg"), g(TEX, "mud_nor.jpg"), None, color=(0.28, 0.14, 0.08), rough=1, uv=8)
    m_volvo = pbr("Volvo", color=(0.95, 0.78, 0.04), rough=0.35, metal=0.18)
    m_cat = pbr("CAT", color=(0.95, 0.62, 0.0), rough=0.38, metal=0.16)
    m_black = pbr("Preto", color=(0.05, 0.05, 0.06), rough=0.45, metal=0.4)
    m_glass = pbr("Vidro", color=(0.55, 0.78, 0.92), rough=0.06, metal=0.12)
    m_white = pbr("Branco", color=(0.86, 0.84, 0.8), rough=0.48, metal=0.08)
    m_ship = pbr("Navio", color=(0.12, 0.38, 0.55), rough=0.28, metal=0.35)
    m_water = pbr("Agua", color=(0.08, 0.32, 0.42), rough=0.06, metal=0.25)
    m_leaf = pbr("Copa", color=(0.08, 0.24, 0.07), rough=0.95)
    m_leaf2 = pbr("Copa2", color=(0.12, 0.32, 0.09), rough=0.94)
    m_trunk = pbr("Tronco", g(TEX, "wood_diff.jpg"), g(TEX, "wood_nor.jpg"), None, uv=1.2)
    m_glow = pbr("Glow", color=(0.05, 0.9, 0.55), rough=0.35, metal=0.4, emit=0.35)
    m_desk = pbr("MesaSCADA", color=(0.14, 0.16, 0.2), rough=0.55, metal=0.2)
    m_cont = [
        pbr("C1", color=(0.82, 0.28, 0.05), rough=0.45, metal=0.15),
        pbr("C2", color=(0.12, 0.36, 0.26), rough=0.45, metal=0.15),
        pbr("C3", color=(0.72, 0.58, 0.1), rough=0.45, metal=0.15),
        pbr("C4", color=(0.1, 0.18, 0.38), rough=0.45, metal=0.15),
        pbr("C5c", color=(0.75, 0.75, 0.72), rough=0.45, metal=0.15),
    ]

    # —— Mesa de madeira + feltro de grama com relevo ——
    cube("Placa", (47.2, 0.42, 35.0), (0, -0.28, 0), m_wood, 0.04)
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=110, y_subdivisions=82, size=1, location=(0, 0, 0.05))
    grass = bpy.context.object
    grass.name = "Grama"
    grass.scale = (45.4, 33.4, 1)
    bpy.ops.object.transform_apply(scale=True)
    tex = bpy.data.textures.new("GrassDisp", "CLOUDS")
    tex.noise_scale = 1.35
    tex.noise_depth = 2
    disp = grass.modifiers.new("Disp", "DISPLACE")
    disp.texture = tex
    disp.strength = 0.045
    disp.mid_level = 0.5
    apply_mods(grass)
    assign(grass, m_grass)
    unwrap(grass)
    smooth(grass, 70)

    pts = stadium_points()
    extrude_along("Lastro", pts, 0.95, 0.05, m_ballast)
    sleepers(pts, m_sleeper, 0.32)
    rails = [Vector((p.x, p.y, p.z + 0.055)) for p in pts]
    curve_to_rail("TrilhoE", offset_points(rails, 0.2), m_rail, 0.026)
    curve_to_rail("TrilhoD", offset_points(rails, -0.2), m_rail, 0.026)

    # Estradas
    road_mine = [bv(-8.2, 0.03, -4.2), bv(-11.5, 0.03, -6.2), bv(-14.8, 0.03, -8.2), bv(-17.0, 0.03, -9.2)]
    road_port = [bv(7.4, 0.03, 4.4), bv(11.2, 0.03, 6.2), bv(15.0, 0.03, 7.8), bv(16.6, 0.03, 8.4)]
    extrude_along("EstradaMina", road_mine, 0.55, 0.03, m_asph, False)
    extrude_along("EstradaPorto", road_port, 0.55, 0.03, m_asph, False)

    # Morro leste: base larga, cume, capim no topo
    lathe_solid(
        "MorroLeste",
        [(0.08, 0.0), (3.6, 0.04), (3.15, 0.55), (2.35, 1.15), (1.35, 1.75), (0.45, 2.15), (0.05, 2.28)],
        36,
        (RX + 0.2, 0.0, 0.0),
        m_rock,
        displace=0.22,
        noise=1.8,
    )
    lathe_solid(
        "CapimLeste",
        [(0.05, 1.35), (1.55, 1.42), (1.15, 1.85), (0.45, 2.22), (0.04, 2.32)],
        28,
        (RX + 0.15, 0.0, 0.0),
        m_grass,
        displace=0.08,
        noise=1.1,
    )

    # Túnel oeste: dois morros irregulares + forro
    lathe_solid(
        "MorroOesteN",
        [(0.06, 0.0), (2.55, 0.03), (2.2, 0.5), (1.55, 1.05), (0.8, 1.55), (0.12, 1.78)],
        32,
        (-RX - 0.35, 0.0, 2.05),
        m_rock,
        displace=0.18,
        noise=1.5,
    )
    lathe_solid(
        "MorroOesteS",
        [(0.06, 0.0), (2.55, 0.03), (2.2, 0.5), (1.55, 1.05), (0.8, 1.55), (0.12, 1.78)],
        32,
        (-RX - 0.35, 0.0, -2.05),
        m_rock,
        displace=0.18,
        noise=1.6,
    )
    cyl("TunelForro", 0.5, 2.55, (-RX, 0.5, 0), m_conc, 28, (math.pi / 2, 0, 0))
    cyl("TunelBocaN", 0.56, 0.12, (-RX, 0.5, 1.22), m_conc, 28, (math.pi / 2, 0, 0))
    cyl("TunelBocaS", 0.56, 0.12, (-RX, 0.5, -1.22), m_conc, 28, (math.pi / 2, 0, 0))
    lathe_solid(
        "CapimON",
        [(0.04, 1.05), (1.15, 1.12), (0.7, 1.48), (0.1, 1.68)],
        22,
        (-RX - 0.4, 0.0, 1.85),
        m_grass,
        displace=0.06,
        noise=1.2,
    )
    lathe_solid(
        "CapimOS",
        [(0.04, 1.05), (1.15, 1.12), (0.7, 1.48), (0.1, 1.68)],
        22,
        (-RX - 0.4, 0.0, -1.85),
        m_grass,
        displace=0.06,
        noise=1.2,
    )

    # Estações
    for i, (x, z) in enumerate(((-7.15, -1.45), (6.35, 3.55))):
        cube(f"Plat{i}", (0.85, 0.1, 2.5), (x, 0.14, z), m_conc, 0.015)
        cube(f"Casa{i}", (0.7, 0.85, 1.55), (x + 0.42, 0.58, z), m_white, 0.04)
        cube(f"Telhado{i}", (0.82, 0.08, 1.7), (x + 0.42, 1.05, z), m_dirt, 0.02)
        cube(f"Janela{i}", (0.02, 0.22, 0.35), (x + 0.08, 0.62, z), m_glass, 0.005)

    # —— Mina ——
    mx, mz = -17.2, -9.4
    lathe_solid(
        "MinaCava",
        [
            (4.9, 0.02),
            (4.55, 0.38),
            (3.7, 0.52),
            (3.15, 0.95),
            (2.35, 1.15),
            (1.85, 1.48),
            (1.05, 1.62),
            (0.35, 1.85),
            (0.08, 1.92),
        ],
        40,
        (mx, 0.0, mz),
        m_rock,
        displace=0.12,
        noise=2.2,
    )
    lathe_solid(
        "MinaFundo",
        [(0.06, 0.05), (1.05, 0.08), (0.9, 0.22), (0.12, 0.28)],
        20,
        (mx, 0.0, mz),
        m_dirt,
        displace=0.04,
        noise=0.8,
    )
    cube("Barracao", (2.1, 0.95, 1.5), (mx - 5.1, 0.52, mz + 0.4), m_conc, 0.05)
    cube("BarracaoTeto", (2.25, 0.1, 1.65), (mx - 5.1, 1.05, mz + 0.4), m_dirt, 0.02)
    ico("PilharOre", 0.55, (mx - 3.4, 0.4, mz + 2.1), m_ore, 2, (1.4, 0.7, 1.1))

    volvo = empty("Volvo", (mx + 4.05, 0.0, mz + 2.05))
    parent(cube("VBody", (0.62, 0.32, 0.85), (0, 0, 0), m_volvo, 0.045), volvo, (0, 0.38, 0))
    parent(cube("VCab", (0.5, 0.34, 0.42), (0, 0, 0), m_volvo, 0.03), volvo, (0, 0.72, 0.12))
    parent(cube("VGlass", (0.42, 0.18, 0.04), (0, 0, 0), m_glass, 0.005), volvo, (0, 0.78, 0.34))
    parent(cyl("VTrackL", 0.12, 0.7, (0, 0, 0), m_black, 12, (math.pi / 2, 0, 0)), volvo, (-0.32, 0.14, 0))
    parent(cyl("VTrackR", 0.12, 0.7, (0, 0, 0), m_black, 12, (math.pi / 2, 0, 0)), volvo, (0.32, 0.14, 0))
    braco = empty("VolvoBraco", (mx + 4.13, 0.58, mz + 2.35))
    parent_keep(braco, volvo)
    boom = cube("VBoom", (0.12, 0.1, 1.15), (0, 0, 0), m_black, 0.02)
    stick = cube("VStick", (0.1, 0.7, 0.1), (0, 0, 0), m_black, 0.015)
    bucket = cube("VBucket", (0.38, 0.16, 0.28), (0, 0, 0), m_black, 0.012)
    parent(boom, braco, (0, 0.08, 0.52))
    parent(stick, braco, (0, -0.18, 1.05))
    parent(bucket, braco, (0, -0.42, 1.05))
    for t, dx in enumerate((-0.12, -0.04, 0.04, 0.12)):
        parent(cube(f"VTooth{t}", (0.05, 0.05, 0.1), (0, 0, 0), m_black, 0.004), braco, (dx, -0.5, 1.22))
    for f in range(1, 241):
        u = (f - 1) / 240.0 * math.tau
        ang = 0.12 + 0.38 * math.sin(u * 2.0) + 0.08 * math.sin(u * 4.0)
        braco.rotation_euler = (ang, 0, 0)
        braco.keyframe_insert("rotation_euler", frame=f)
    smooth_keys(braco)

    cat = empty("CAT", (mx + 5.15, 0.0, mz - 2.6))
    parent(cube("CChassi", (0.7, 0.22, 1.35), (0, 0, 0), m_cat, 0.04), cat, (0, 0.32, 0))
    parent(cube("CCab", (0.55, 0.42, 0.5), (0, 0, 0), m_cat, 0.035), cat, (0, 0.68, 0.28))
    parent(cube("CGlass", (0.46, 0.2, 0.04), (0, 0, 0), m_glass, 0.004), cat, (0, 0.74, 0.54))
    cacamba = empty("CATCacamba", (mx + 5.15, 0.45, mz - 3.05))
    parent_keep(cacamba, cat)
    parent(cube("CBed", (0.72, 0.38, 0.85), (0, 0, 0), m_cat, 0.03), cacamba, (0, 0.1, 0))
    parent(cube("COre", (0.55, 0.2, 0.65), (0, 0, 0), m_ore, 0.02), cacamba, (0, 0.38, 0))
    wheels(cat, m_black, (-0.38, 0.38), (-0.5, 0.05, 0.48), r=0.16, y=0.16, depth=0.12)
    parent(cube("C137", (0.02, 0.1, 0.18), (0, 0, 0), m_black, 0.002), cat, (0.36, 0.7, 0.28))
    # Carrega na Volvo → segue a estrada até o pátio → tomba → volta pelo mesmo traçado
    haul_ida = [
        bv(mx + 4.4, 0.0, mz + 1.55),
        bv(mx + 4.65, 0.0, mz + 0.85),
        bv(mx + 4.95, 0.0, mz + 0.2),
        bv(mx + 5.45, 0.0, mz - 0.75),
        bv(mx + 6.1, 0.0, mz - 1.85),
        bv(-16.4, 0.0, -8.85),
        bv(-14.5, 0.0, -8.05),
        bv(-12.7, 0.0, -7.05),
        bv(-11.5, 0.0, -6.2),
        bv(-10.35, 0.0, -5.3),
        bv(-9.4, 0.0, -4.6),
    ]
    haul_volta = list(reversed(haul_ida))
    p0, d0 = catmull_at(haul_ida, 0.0, closed=False)
    yaw0 = math.atan2(d0.x, d0.y) if d0.length > 1e-6 else 0.0
    for f in range(1, 37):
        cat.location = (p0.x, p0.y, p0.z + 0.02)
        cat.rotation_euler = (0, 0, yaw0)
        cat.keyframe_insert("location", frame=f)
        cat.keyframe_insert("rotation_euler", frame=f)
    keyframe_path(cat, haul_ida, f0=36, f1=128, closed=False, ease=True, z_off=0.02)
    p1, d1 = catmull_at(haul_ida, 1.0, closed=False)
    yaw1 = math.atan2(d1.x, d1.y) if d1.length > 1e-6 else yaw0
    while yaw1 - yaw0 > math.pi:
        yaw1 -= math.tau
    for f in range(128, 173):
        cat.location = (p1.x, p1.y, p1.z + 0.02)
        cat.rotation_euler = (0, 0, yaw1)
        cat.keyframe_insert("location", frame=f)
        cat.keyframe_insert("rotation_euler", frame=f)
    keyframe_path(cat, haul_volta, f0=172, f1=240, closed=False, ease=True, z_off=0.02)
    for f in range(1, 241):
        if f < 132:
            dump = 0.0
        elif f < 148:
            dump = 0.62 * ease_inout((f - 132) / 16)
        elif f < 166:
            dump = 0.62
        elif f < 180:
            dump = 0.62 * (1.0 - ease_inout((f - 166) / 14))
        else:
            dump = 0.0
        cacamba.rotation_euler = (dump, 0, 0)
        cacamba.keyframe_insert("rotation_euler", frame=f)
    smooth_keys(cat)
    smooth_keys(cacamba)

    # —— Porto ——
    px, pz = 17.6, 8.6
    cube("Cais", (2.4, 0.32, 5.4), (px - 2.55, 0.2, pz), m_conc, 0.03)
    cube("Agua", (4.2, 0.05, 5.8), (px + 0.85, 0.02, pz), m_water, 0.0)
    navio = empty("Navio", (px + 0.35, 0.18, pz))
    parent(cube("Casco", (1.45, 0.42, 4.1), (0, 0, 0), m_ship, 0.06), navio, (0, 0.22, 0))
    parent(cube("CascoB", (1.15, 0.18, 3.7), (0, 0, 0), m_black, 0.03), navio, (0, 0.0, 0))
    parent(cube("Ponte", (0.95, 0.85, 0.95), (0, 0, 0), m_white, 0.05), navio, (0, 0.9, -1.35))
    parent(cube("PonteVidro", (0.8, 0.22, 0.05), (0, 0, 0), m_glass, 0.004), navio, (0, 1.05, -0.86))
    parent(cyl("Chamine", 0.12, 0.45, (0, 0, 0), m_black, 12), navio, (0.28, 1.45, -1.35))
    idx = 0
    for z in (-0.25, 0.4, 1.05, 1.7):
        for x in (-0.38, 0.38):
            for y in (0.52, 0.82):
                parent(cube(f"Cnt{idx}", (0.48, 0.28, 0.42), (0, 0, 0), m_cont[idx % 5], 0.012), navio, (x, y, z))
                idx += 1
                if idx > 11:
                    break
            if idx > 11:
                break
        if idx > 11:
            break
    cube("GuindBase", (0.45, 0.2, 0.45), (px - 1.85, 0.42, pz - 0.2), m_conc, 0.02)
    cyl("Guindaste", 0.09, 2.35, (px - 1.85, 1.45, pz - 0.2), m_glow, 14)
    guind = empty("GuindLanca", (px - 1.85, 2.55, pz - 0.2))
    lanca = cube("LancaG", (2.15, 0.1, 0.12), (px - 0.75, 2.55, pz - 0.2), m_glow, 0.02)
    cabo = cube("CaboG", (0.03, 0.9, 0.03), (px + 0.15, 2.05, pz - 0.2), m_black, 0.004)
    carga = cube("CargaG", (0.42, 0.26, 0.38), (px + 0.15, 1.45, pz - 0.2), m_cont[0], 0.012)
    parent_keep(lanca, guind)
    parent_keep(cabo, guind)
    parent_keep(carga, guind)
    bpy.context.view_layer.update()
    z_carga = carga.location.z
    for f in range(1, 241):
        u = (f - 1) / 240.0 * math.tau
        yaw = 0.12 + 0.82 * math.sin(u)
        drop = -0.42 * (0.5 + 0.5 * math.sin(u * 2.0 + 0.6))
        guind.rotation_euler = (0, 0, yaw)
        guind.keyframe_insert("rotation_euler", frame=f)
        carga.location.z = z_carga + drop
        carga.keyframe_insert("location", frame=f)
    smooth_keys(guind)
    smooth_keys(carga)

    # —— Sala SCADA ——
    cube("SalaPiso", (3.2, 0.08, 2.2), (-5.8, 0.08, 13.2), m_conc, 0.01)
    cube("Mesa", (2.55, 0.08, 1.15), (-5.8, 0.72, 13.05), m_desk, 0.03)
    cube("MesaPe", (2.4, 0.62, 1.0), (-5.8, 0.38, 13.05), m_desk, 0.04)
    for i, x in enumerate((-0.75, -0.25, 0.25, 0.75)):
        cube(f"MonFrame{i}", (0.48, 0.34, 0.06), (-5.8 + x, 1.02, 13.42), m_black, 0.008, rot=(-0.55, 0, 0))
        cube(f"Monitor{i}", (0.42, 0.28, 0.02), (-5.8 + x, 1.04, 13.52), pbr(f"Mon{i}", color=(0.15, 0.75, 0.4), rough=0.2, emit=1.4), 0.002, rot=(-0.55, 0, 0))
    cube("Caneca", (0.12, 0.14, 0.12), (-4.75, 0.86, 13.25), m_white, 0.02)
    cube("Pasta0", (0.28, 0.04, 0.36), (-6.7, 0.8, 13.25), m_mrs_b, 0.006)
    cube("Pasta1", (0.28, 0.04, 0.36), (-6.68, 0.85, 13.22), m_white, 0.006)
    cube("Cadeira", (0.45, 0.55, 0.45), (-5.8, 0.35, 13.85), m_black, 0.04)

    # Árvores
    spots = [
        (-20.2, -12.2), (-18.4, 4.2), (-14.5, 11.4), (-8.2, -13.4), (6.1, -12.6),
        (8.4, 13.2), (12.6, -3.2), (11.2, -5.4), (10.2, -14.2),
        (-10.4, 9.2), (3.2, 12.4), (-21.2, 8.1), (1.2, -14.4),
        (22.0, 2.2), (-19.2, -6.2), (-12.4, -12.8), (-3.4, 11.8),
        (8.4, -8.6), (-16.2, 6.4), (5.6, 10.8), (-6.8, -12.0),
        (16.8, -9.4), (18.6, -11.2), (15.2, -12.0),
    ]

    def arvore_ok(x, z):
        if x > 13.5 and z > 2.8:
            return False
        if (x + 17.2) ** 2 + (z + 9.4) ** 2 < 22:
            return False
        return True
    trunks, copas = [], []
    for i, (x, z) in enumerate(spots):
        if not arvore_ok(x, z):
            continue
        h = 0.55 + (i % 5) * 0.08
        trunks.append(cyl(f"Tronco{i}", 0.07, h, (x, h / 2, z), m_trunk, 8, r2=0.045))
        leaf = m_leaf if i % 2 == 0 else m_leaf2
        copas.append(ico(f"Copa{i}a", 0.42 + (i % 3) * 0.04, (x, h + 0.28, z), leaf, 2, (1.05, 0.85, 1.0)))
        copas.append(ico(f"Copa{i}b", 0.28, (x + 0.22, h + 0.18, z + 0.1), leaf, 1, (1, 0.8, 1)))
    join("Troncos", trunks)
    join("Copas", copas)

    # —— Trem MRS ——
    trem = empty("Trem", (RX, 0.12, 0))
    parent(cube("LocoMRS", (0.52, 0.38, 1.22), (0, 0, 0), m_mrs_b, 0.04), trem, (0, 0.38, 0))
    parent(cube("LocoNariz", (0.52, 0.38, 0.32), (0, 0, 0), m_mrs_y, 0.03), trem, (0, 0.38, 0.74))
    parent(cube("LocoCab", (0.5, 0.28, 0.4), (0, 0, 0), m_mrs_b, 0.025), trem, (0, 0.68, 0.22))
    parent(cube("LocoVidro", (0.42, 0.16, 0.04), (0, 0, 0), m_glass, 0.004), trem, (0, 0.72, 0.44))
    parent(cube("LocoFaixaL", (0.04, 0.12, 1.15), (0, 0, 0), m_mrs_y, 0.008), trem, (0.27, 0.42, 0.05))
    parent(cube("LocoFaixaR", (0.04, 0.12, 1.15), (0, 0, 0), m_mrs_y, 0.008), trem, (-0.27, 0.42, 0.05))
    parent(cube("LocoNum", (0.02, 0.1, 0.22), (0, 0, 0), m_white, 0.002), trem, (0.27, 0.58, 0.5))
    wheels(trem, m_black, (-0.28, 0.28), (-0.42, 0.05, 0.48), r=0.09, y=0.09, depth=0.08)
    for i in range(3):
        z = -1.05 - i * 0.92
        parent(cube(f"Vagao{i}", (0.5, 0.28, 0.78), (0, 0, 0), m_black, 0.03), trem, (0, 0.28, z))
        parent(ico(f"VagaoOre{i}", 0.28, (0, 0, 0), m_ore, 2, (1.4, 0.55, 1.1)), trem, (0, 0.5, z))
        wheels(trem, m_black, (-0.26, 0.26), (z - 0.22, z + 0.22), r=0.08, y=0.08, depth=0.07)

    keyframe_path(trem, pts, 240, z_off=0.14, closed=True)

    for f in range(1, 241):
        u = (f - 1) / 240.0 * math.tau
        navio.location = tloc(
            px + 0.35 + 0.14 * math.sin(u),
            0.17 + 0.045 * math.sin(u * 2.0 + 0.4),
            pz + 0.22 * math.cos(u * 0.85),
        )
        navio.rotation_euler = (0.03 * math.sin(u * 1.4), 0, 0.04 * math.sin(u))
        navio.keyframe_insert("location", frame=f)
        navio.keyframe_insert("rotation_euler", frame=f)
    smooth_keys(navio)

    sc.frame_set(1)
    dest = os.path.dirname(OUT)
    if dest:
        os.makedirs(dest, exist_ok=True)
    kwargs = dict(
        filepath=OUT,
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
    print("EXPORT_OK", OUT, "bytes", os.path.getsize(OUT) if os.path.isfile(OUT) else 0)


if __name__ == "__main__":
    build()
