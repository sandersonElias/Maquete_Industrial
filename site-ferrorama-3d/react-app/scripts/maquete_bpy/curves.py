from __future__ import annotations

import math

import bpy
from mathutils import Vector

from .coords import RX, RZ, R_CORNER, bv, y_east, y_west
from .primitives import assign, join, smooth, unwrap


def smooth_keys(obj, rot_linear=True):
    ad = getattr(obj, "animation_data", None)
    if not ad or not ad.action:
        return
    for fc in ad.action.fcurves:
        is_rot = "rotation" in fc.data_path
        for kp in fc.keyframe_points:
            if is_rot and rot_linear:
                kp.interpolation = "LINEAR"
            else:
                kp.interpolation = "BEZIER"
                kp.handle_left_type = "AUTO_CLAMPED"
                kp.handle_right_type = "AUTO_CLAMPED"


def linear_keys(obj):
    ad = getattr(obj, "animation_data", None)
    if not ad or not ad.action:
        return
    for fc in ad.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


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


def keyframe_path(obj, points, frames=240, z_off=0.1, f0=1, f1=None, closed=True, ease=False, pitch=False, smooth=True):
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
    if smooth:
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
    pts = [bv(RX, y_east(cz_s), cz_s)]
    for i in range(1, 22):
        z = cz_s + (cz_n - cz_s) * i / 22
        pts.append(bv(RX, y_east(z), z))
    pts.append(bv(RX, y_east(cz_n), cz_n))
    pts += arc(cx_e, cz_n, R_CORNER, 0, math.pi / 2, 22)[1:]
    for i in range(1, 21):
        t = i / 20
        pts.append(bv(cx_e + (cx_w - cx_e) * t, 0.0, RZ))
    pts += arc(cx_w, cz_n, R_CORNER, math.pi / 2, math.pi, 22)[1:]
    for i in range(1, 25):
        z = cz_n + (cz_s - cz_n) * i / 24
        pts.append(bv(-RX, y_west(z), z))
    pts += arc(cx_w, cz_s, R_CORNER, math.pi, 1.5 * math.pi, 22)[1:]
    for i in range(1, 21):
        t = i / 20
        pts.append(bv(cx_w + (cx_e - cx_w) * t, 0.0, -RZ))
    pts += arc(cx_e, cz_s, R_CORNER, 1.5 * math.pi, 2 * math.pi, 22)[1:-1]
    return pts


def make_curve(name, points, closed=True):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for i, p in enumerate(points):
        spline.points[i].co = (p.x, p.y, p.z, 1.0)
    spline.use_cyclic_u = closed
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    return obj


def densify(points, step=0.22, closed=False):
    out = []
    n = len(points)
    last = n if closed else n - 1
    for i in range(last):
        a = points[i]
        b = points[(i + 1) % n]
        d = (b - a).length
        segs = max(1, int(math.ceil(d / max(step, 1e-4))))
        if i == 0:
            out.append(a.copy())
        for k in range(1, segs + 1):
            if closed and i == last - 1 and k == segs:
                continue
            out.append(a.lerp(b, k / segs))
    return out


def offset_points(points, dist, closed=True):
    out = []
    n = len(points)
    for i, p in enumerate(points):
        if closed:
            nxt = points[(i + 1) % n]
            t = nxt - p
        elif i < n - 1:
            t = points[i + 1] - p
        else:
            t = p - points[i - 1]
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


def curve_to_rail(name, points, mat, radius=0.018, closed=True):
    obj = make_curve(name, points, closed)
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


def sleepers(points, mat, step=0.36, closed=True, name="Dormentes"):
    objs = []
    acc = 0.0
    n = len(points)
    last = n if closed else n - 1
    for i in range(last):
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
    return join(name, objs) if objs else None


def pts_three(triplets):
    return [bv(x, y, z) for x, y, z in triplets]


def lay_track(prefix, points, m_ballast, m_sleeper, m_rail, closed=True, ballast_w=0.85):
    raised = [Vector((p.x, p.y, p.z + 0.055)) for p in points]
    extrude_along(f"{prefix}Lastro", points, ballast_w, 0.048, m_ballast, closed)
    sleepers(points, m_sleeper, 0.32, closed, f"{prefix}Dorm")
    curve_to_rail(f"{prefix}E", offset_points(raised, 0.2, closed), m_rail, 0.026, closed)
    curve_to_rail(f"{prefix}D", offset_points(raised, -0.2, closed), m_rail, 0.026, closed)
