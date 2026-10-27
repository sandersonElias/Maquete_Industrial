"""Executa `maquete_bpy.main.build()` contra um `bpy` de mentira.

Não gera `.glb` nenhum: serve para o código **rodar de ponta a ponta** e revelar
os erros que só aparecem em execução — chave de material inexistente, assinatura
de helper trocada, índice fora da lista, join com lista vazia. Sem isto, cada
erro desses custaria uma rodada inteira do Blender para aparecer.

Uso:  python scripts/ensaio_sem_blender.py

No fim imprime um resumo: quantos objetos foram criados, quantos ficaram com
cor de vértice, e a caixa envolvente da cena.
"""

from __future__ import annotations

import math
import os
import sys
import types


# ---------------------------------------------------------------------------
# mathutils mínimo
# ---------------------------------------------------------------------------


class Vector:
    def __init__(self, v=(0.0, 0.0, 0.0)):
        self.x, self.y, self.z = (float(c) for c in v)

    def __iter__(self):
        return iter((self.x, self.y, self.z))

    def __getitem__(self, i):
        return (self.x, self.y, self.z)[i]

    def __add__(self, o):
        return Vector((self.x + o.x, self.y + o.y, self.z + o.z))

    def __sub__(self, o):
        return Vector((self.x - o.x, self.y - o.y, self.z - o.z))

    def __mul__(self, k):
        return Vector((self.x * k, self.y * k, self.z * k))

    __rmul__ = __mul__

    def __truediv__(self, k):
        return Vector((self.x / k, self.y / k, self.z / k))

    def __neg__(self):
        return Vector((-self.x, -self.y, -self.z))

    @property
    def length(self):
        return math.sqrt(self.x**2 + self.y**2 + self.z**2)

    def normalized(self):
        n = self.length or 1.0
        return self / n

    def copy(self):
        return Vector((self.x, self.y, self.z))

    def normalize(self):
        n = self.length or 1.0
        self.x, self.y, self.z = self.x / n, self.y / n, self.z / n
        return self

    def lerp(self, o, t):
        return Vector((self.x + (o.x - self.x) * t, self.y + (o.y - self.y) * t, self.z + (o.z - self.z) * t))

    def to_tuple(self):
        return (self.x, self.y, self.z)

    def cross(self, o):
        return Vector((self.y * o.z - self.z * o.y, self.z * o.x - self.x * o.z, self.x * o.y - self.y * o.x))

    def dot(self, o):
        return self.x * o.x + self.y * o.y + self.z * o.z

    def __repr__(self):
        return f"V({self.x:.3f},{self.y:.3f},{self.z:.3f})"


class Matrix:
    """Identidade que aceita @, copy() e inverted() — é tudo o que o código usa."""

    def copy(self):
        return Matrix()

    def inverted(self):
        return Matrix()

    def to_3x3(self):
        return Matrix()

    def __matmul__(self, o):
        return o.copy() if isinstance(o, (Vector, Matrix)) else o

    @property
    def translation(self):
        return Vector()


# ---------------------------------------------------------------------------
# bpy mínimo
# ---------------------------------------------------------------------------

CRIADOS = []


class Lista(list):
    def new(self, name=None, *a, **k):
        item = Bloco(name or "novo")
        self.append(item)
        return item

    def get(self, name, default=None):
        for i in self:
            if getattr(i, "name", None) == name:
                return i
        return default

    def find(self, name):
        for i, it in enumerate(self):
            if getattr(it, "name", None) == name:
                return i
        return -1

    def remove(self, item, **k):
        if item in self:
            list.remove(self, item)

    def link(self, item):
        if item not in self:
            self.append(item)

    def unlink(self, item):
        if item in self:
            list.remove(self, item)

    def __contains__(self, k):
        if isinstance(k, str):
            return any(getattr(i, "name", None) == k for i in self)
        return list.__contains__(self, k)


class Bloco:
    """Objeto genérico permissivo: qualquer atributo desconhecido vira Bloco."""

    def __init__(self, name="bloco"):
        object.__setattr__(self, "_d", {})
        self.name = name

    def __getattr__(self, k):
        d = object.__getattribute__(self, "_d")
        if k not in d:
            d[k] = Bloco(k)
        return d[k]

    def __setattr__(self, k, v):
        object.__getattribute__(self, "_d")[k] = v

    def __iter__(self):
        return iter(())

    def __call__(self, *a, **k):
        return Bloco("chamada")

    def __repr__(self):
        return f"<Bloco {object.__getattribute__(self, '_d').get('name')}>"


class Cor:
    def __init__(self):
        self.color = (1.0, 1.0, 1.0, 1.0)


class AtribCor:
    def __init__(self, name, n):
        self.name = name
        self.data = [Cor() for _ in range(n)]


class AtribCores(list):
    def __init__(self, malha):
        super().__init__()
        self.malha = malha

    def get(self, name, default=None):
        for a in self:
            if a.name == name:
                return a
        return default

    def new(self, name="Col", type="FLOAT_COLOR", domain="POINT"):
        a = AtribCor(name, len(self.malha.vertices))
        self.append(a)
        return a

    def find(self, name):
        for i, a in enumerate(self):
            if a.name == name:
                return i
        return -1


class Vertice:
    def __init__(self, x=0.0, y=0.0, z=0.0):
        self.co = Vector((x, y, z))
        self.normal = Vector((0.0, 0.0, 1.0))


class Malha:
    def __init__(self, name="Malha", nverts=8):
        self.name = name
        self.materials = Lista()
        self.vertices = [Vertice(0.0, 0.0, float(i % 2)) for i in range(nverts)]
        self.color_attributes = AtribCores(self)
        self.polygons = []

    def from_pydata(self, verts, edges, faces):
        self.vertices = [Vertice(*v) for v in verts]
        self.color_attributes = AtribCores(self)

    def update(self):
        pass


class Ponto:
    def __init__(self):
        self.co = (0.0, 0.0, 0.0, 1.0)


class Pontos(list):
    def add(self, n):
        self.extend(Ponto() for _ in range(n))


class Spline:
    def __init__(self):
        self.points = Pontos([Ponto()])
        self.use_cyclic_u = False


class Splines(list):
    def new(self, tipo):
        sp = Spline()
        self.append(sp)
        return sp


class Curva:
    def __init__(self, name):
        self.name = name
        self.splines = Splines()
        self.dimensions = "3D"
        self.materials = Lista()
        self.bevel_depth = 0.0
        self.bevel_resolution = 0
        self.use_fill_caps = False


class Modificadores(list):
    def new(self, nome, tipo):
        m = Bloco(nome)
        m.name = nome
        m.type = tipo
        self.append(m)
        return m

    def remove(self, m):
        if m in self:
            list.remove(self, m)


class Objeto:
    def __init__(self, name="Objeto", tipo="MESH", nverts=8):
        self.name = name
        self.type = tipo
        self.data = Malha(name, nverts) if tipo == "MESH" else Bloco(name)
        self.location = Vector()
        self.scale = Vector((1, 1, 1))
        self.rotation_euler = Vector()
        self.rotation_mode = "XYZ"
        self.parent = None
        self.matrix_world = Matrix()
        self.matrix_parent_inverse = Matrix()
        self.matrix_basis = Matrix()
        self.modifiers = Modificadores()
        self.animation_data = None
        self.users_collection = []
        self._sel = False
        CRIADOS.append(self)

    def select_set(self, v):
        self._sel = v

    def keyframe_insert(self, path, frame=1, **k):
        if self.animation_data is None:
            self.animation_data = Bloco("anim")
            self.animation_data.action = Bloco("acao")
            self.animation_data.action.fcurves = []
        self.animation_data.action.fcurves.append(_FCurve(path))

    def __repr__(self):
        return f"<Obj {self.name}>"


class _FCurve:
    def __init__(self, path):
        self.data_path = path
        self.keyframe_points = [Bloco("kp")]


class Colecao:
    def __init__(self, name):
        self.name = name
        self.objects = Lista()
        self.children = Lista()


class ColecoesData(Lista):
    def new(self, name):
        c = Colecao(name)
        self.append(c)
        return c


def _novo(name, nverts=8, tipo="MESH"):
    ob = Objeto(name, tipo, nverts)
    bpy.data.objects.link(ob)
    bpy.context.collection.objects.link(ob)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.object = ob
    bpy.context.view_layer.objects.active = ob
    return ob


class _OpsMesh:
    def primitive_cube_add(self, **k):
        _novo("Cube", 8)

    def primitive_cylinder_add(self, **k):
        _novo("Cylinder", max(6, int(k.get("vertices", 24)) * 2))

    def primitive_cone_add(self, **k):
        _novo("Cone", max(6, int(k.get("vertices", 24)) * 2))

    def primitive_uv_sphere_add(self, **k):
        _novo("Sphere", 60)

    def primitive_ico_sphere_add(self, **k):
        _novo("Icosphere", 42)

    def primitive_grid_add(self, **k):
        _novo("Grid", 400)

    def primitive_torus_add(self, **k):
        _novo("Torus", 120)

    def select_all(self, **k):
        pass


class _OpsObject:
    def select_all(self, action="DESELECT"):
        alvo = action == "SELECT"
        for o in CRIADOS:
            o._sel = alvo

    def transform_apply(self, **k):
        pass

    def modifier_apply(self, modifier=None):
        ob = bpy.context.view_layer.objects.active
        if ob is not None:
            for m in list(ob.modifiers):
                if m.name == modifier:
                    ob.modifiers.remove(m)

    def shade_smooth(self, **k):
        pass

    def shade_smooth_by_angle(self, **k):
        pass

    def mode_set(self, mode="OBJECT"):
        pass

    def empty_add(self, **k):
        _novo("Empty", 0, "EMPTY")

    def delete(self, **k):
        pass

    def convert(self, target="MESH"):
        ob = bpy.context.view_layer.objects.active
        if ob is not None:
            n = 0
            for sp in getattr(ob.data, "splines", []):
                n += len(sp.points)
            ob.data = Malha(ob.name, max(8, n * 8))
            ob.type = "MESH"
        bpy.context.object = ob

    def join(self, **k):
        ativos = [o for o in CRIADOS if o._sel]
        alvo = bpy.context.view_layer.objects.active
        nv = 0
        for o in ativos:
            if o is not alvo:
                nv += len(getattr(o.data, "vertices", []))
                for col in (bpy.data.objects, bpy.context.collection.objects, bpy.context.scene.collection.objects):
                    col.unlink(o)
                o._sel = False
                o.type = "JOINED"
        if alvo is not None and hasattr(alvo.data, "vertices"):
            alvo.data.vertices.extend(Vertice(0.0, 0.0, float(i % 2)) for i in range(nv))
            alvo.data.color_attributes = AtribCores(alvo.data)
        bpy.context.object = alvo


class _OpsUv:
    def smart_project(self, **k):
        pass

    def unwrap(self, **k):
        pass


class _OpExport:
    def __call__(self, **k):
        print(f"  [export simulado] {len(k)} kwargs, filepath={k.get('filepath')}")

    def get_rna_type(self):
        b = Bloco("rna")
        b.properties = {
            "filepath": 1, "export_format": 1, "export_apply": 1, "export_animations": 1,
            "export_extras": 1, "export_lights": 1, "export_cameras": 1,
            "export_image_format": 1, "export_jpeg_quality": 1, "export_vertex_color": 1,
            "export_draco_mesh_compression_enable": 1, "export_draco_mesh_compression_level": 1,
            "export_draco_position_quantization": 1, "export_draco_normal_quantization": 1,
            "export_draco_texcoord_quantization": 1, "export_draco_color_quantization": 1,
            "export_draco_generic_quantization": 1,
        }
        return b


class _OpsScene:
    def __init__(self):
        self.gltf = _OpExport()


class _Ops:
    def __init__(self):
        self.mesh = _OpsMesh()
        self.object = _OpsObject()
        self.uv = _OpsUv()
        self.export_scene = _OpsScene()


class _Dados:
    def __init__(self):
        self.materials = Lista()
        self.images = Lista()
        self.textures = Lista()
        self.meshes = Lista()
        self.objects = Lista()
        self.curves = Lista()
        self.cameras = Lista()
        self.lights = Lista()
        self.collections = ColecoesData()

    def _reset_objects(self):
        self.objects = Lista()


class _Materiais(Lista):
    def new(self, name):
        mat = Bloco(name)
        mat.name = name
        mat.use_nodes = False
        mat.node_tree = _NodeTree()
        self.append(mat)
        return mat


class _NodeTree:
    def __init__(self):
        self.nodes = _Nodes()
        self.links = Bloco("links")
        self.links.new = lambda a, b: None


class _Nodes(list):
    def __init__(self):
        super().__init__()
        bsdf = Bloco("BSDF")
        bsdf.type = "BSDF_PRINCIPLED"
        bsdf.inputs = _Entradas()
        self.append(bsdf)

    def new(self, tipo):
        n = Bloco(tipo)
        n.type = tipo
        n.inputs = _Entradas()
        n.outputs = _Entradas()
        self.append(n)
        return n


class _Entradas(dict):
    def __missing__(self, k):
        v = Bloco(str(k))
        v.default_value = (0, 0, 0, 1)
        self[k] = v
        return v

    def __contains__(self, k):
        return True


def _imagem_load(path, **k):
    img = Bloco(os.path.basename(path))
    img.size = (64, 64)
    img.scale = lambda *a: None
    img.pack = lambda: None
    img.colorspace_settings = Bloco("cs")
    return img


def montar_bpy():
    mod = types.ModuleType("bpy")
    mod.ops = _Ops()
    dados = _Dados()
    dados.materials = _Materiais()
    dados.images = Lista()
    dados.images.load = _imagem_load
    dados.meshes = Lista()
    dados.meshes.new = lambda name: Malha(name, 0)
    dados.objects = Lista()
    def _obj_new(name, dado):
        ob = Objeto(name, "CURVE" if isinstance(dado, Curva) else "MESH")
        ob.data = dado
        return ob

    dados.objects.new = _obj_new
    curvas = Lista()
    curvas.new = lambda name, tipo="CURVE": Curva(name)
    dados.curves = curvas
    dados.objects.remove = lambda ob, **k: None
    dados.textures = Lista()
    mod.data = dados

    cena = Bloco("Scene")
    cena.collection = Colecao("Scene Collection")
    cena.frame_start = 1
    cena.frame_end = 240
    cena.render = Bloco("render")
    cena.frame_set = lambda f: None

    ctx = Bloco("Context")
    ctx.scene = cena
    ctx.collection = cena.collection
    ctx.object = None
    vl = Bloco("view_layer")
    vl.objects = Bloco("objs")
    vl.objects.active = None
    vl.update = lambda: None
    vl.layer_collection = Bloco("lc")
    ctx.view_layer = vl
    mod.context = ctx

    mu = types.ModuleType("mathutils")
    mu.Vector = Vector
    mu.Matrix = Matrix
    return mod, mu


bpy, _mathutils = montar_bpy()
sys.modules["bpy"] = bpy
sys.modules["mathutils"] = _mathutils

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def main():
    from maquete_bpy import main as build_mod

    print("Executando build() contra o bpy simulado...")
    build_mod.build()

    vivos = [o for o in bpy.data.objects if o.type == "MESH"]
    com_cor = [o for o in vivos if len(o.data.color_attributes)]
    verts = sum(len(o.data.vertices) for o in vivos)
    print()
    print(f"nos exportados (aprox.)  : {len(bpy.data.objects)}")
    print(f"  malhas                 : {len(vivos)}")
    print(f"  empties                : {sum(1 for o in bpy.data.objects if o.type == 'EMPTY')}")
    print(f"  com COLOR_0 (sujeira)  : {len(com_cor)}")
    print(f"vertices somados (aprox.): {verts}")
    print(f"objetos intermediarios   : {len(CRIADOS)} (a maioria some no join)")
    print(f"materiais                : {len(bpy.data.materials)}")
    print()
    print("Nota: as caixas envolventes do checks.py nao valem neste ensaio -")
    print("      o Matrix simulado e identidade. Use scripts/verificar_layout.py")
    print("      para as folgas em planta, e o OVERLAP_REPORT do build real em 3D.")
    print("ENSAIO_OK")


if __name__ == "__main__":
    main()
