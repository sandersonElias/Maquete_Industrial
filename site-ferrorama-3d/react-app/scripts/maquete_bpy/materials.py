from __future__ import annotations

import math
import os

import bpy

from .coords import TEX


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


def pbr(
    name,
    diff=None,
    nor=None,
    rough_tex=None,
    color=(0.5, 0.5, 0.5),
    rough=0.5,
    metal=0.0,
    emit=0.0,
    uv=6.0,
    tint=None,
    tint_fac=0.0,
):
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


def make_palette():
    g = os.path.join
    return {
        "wood": pbr("Madeira", g(TEX, "wood_diff.jpg"), g(TEX, "wood_nor.jpg"), g(TEX, "wood_rough.jpg"), uv=3.2),
        "grass": pbr(
            "Grama",
            g(TEX, "grass_diff.jpg"),
            g(TEX, "grass_nor.jpg"),
            g(TEX, "grass_rough.jpg"),
            uv=3.4,
            tint=(0.12, 0.28, 0.08),
            tint_fac=0.52,
            rough=0.92,
        ),
        "dirt": pbr(
            "Terra",
            g(TEX, "mud_diff.jpg"),
            g(TEX, "mud_nor.jpg"),
            g(TEX, "mud_rough.jpg"),
            uv=4.5,
            tint=(0.28, 0.18, 0.1),
            tint_fac=0.25,
        ),
        "rock": pbr(
            "Rocha",
            g(TEX, "rock_diff.jpg"),
            g(TEX, "rock_nor.jpg"),
            g(TEX, "rock_rough.jpg"),
            uv=3.8,
            tint=(0.32, 0.26, 0.2),
            tint_fac=0.2,
        ),
        "asph": pbr("Asfalto", g(TEX, "asphalt_diff.jpg"), g(TEX, "asphalt_nor.jpg"), g(TEX, "asphalt_rough.jpg"), uv=5.0),
        "conc": pbr("Concreto", g(TEX, "concrete_diff.jpg"), g(TEX, "concrete_nor.jpg"), g(TEX, "concrete_rough.jpg"), uv=3.4),
        "ballast": pbr(
            "Lastro",
            g(TEX, "rock_diff.jpg"),
            g(TEX, "rock_nor.jpg"),
            g(TEX, "rock_rough.jpg"),
            uv=14.0,
            tint=(0.18, 0.16, 0.14),
            tint_fac=0.55,
            rough=0.95,
        ),
        "sleeper": pbr("Dormente", g(TEX, "wood_diff.jpg"), g(TEX, "wood_nor.jpg"), None, color=(0.12, 0.08, 0.05), rough=0.9, uv=1.4),
        "rail": pbr("Trilho", color=(0.42, 0.44, 0.48), rough=0.28, metal=0.88, uv=1),
        "mrs_b": pbr("MRS_Azul", color=(0.04, 0.12, 0.38), rough=0.28, metal=0.35),
        "mrs_y": pbr("MRS_Amarelo", color=(0.95, 0.78, 0.04), rough=0.32, metal=0.15),
        "ore": pbr("Minerio", g(TEX, "mud_diff.jpg"), g(TEX, "mud_nor.jpg"), None, color=(0.28, 0.14, 0.08), rough=1, uv=8),
        "coal": pbr("Carvao", g(TEX, "rock_diff.jpg"), g(TEX, "rock_nor.jpg"), None, color=(0.06, 0.05, 0.05), rough=0.95, uv=10, tint=(0.04, 0.04, 0.04), tint_fac=0.7),
        "volvo": pbr("Volvo", color=(0.95, 0.78, 0.04), rough=0.35, metal=0.18),
        "cat": pbr("CAT", color=(0.95, 0.62, 0.0), rough=0.38, metal=0.16),
        "black": pbr("Preto", color=(0.05, 0.05, 0.06), rough=0.45, metal=0.4),
        "glass": pbr("Vidro", color=(0.55, 0.78, 0.92), rough=0.06, metal=0.12),
        "white": pbr("Branco", color=(0.86, 0.84, 0.8), rough=0.48, metal=0.08),
        "ship": pbr("Navio", color=(0.12, 0.38, 0.55), rough=0.28, metal=0.35),
        "water": pbr("Agua", color=(0.08, 0.32, 0.42), rough=0.06, metal=0.25),
        "leaf": pbr("Copa", color=(0.08, 0.24, 0.07), rough=0.95),
        "leaf2": pbr("Copa2", color=(0.12, 0.32, 0.09), rough=0.94),
        "trunk": pbr("Tronco", g(TEX, "wood_diff.jpg"), g(TEX, "wood_nor.jpg"), None, uv=1.2),
        "glow": pbr("Glow", color=(0.05, 0.9, 0.55), rough=0.35, metal=0.4, emit=0.35),
        "paint": pbr("Faixa", color=(0.93, 0.84, 0.12), rough=0.55),
        "sig_r": pbr("SigR", color=(0.75, 0.06, 0.04), rough=0.28, emit=1.35),
        "sig_y": pbr("SigY", color=(0.9, 0.62, 0.06), rough=0.28, emit=0.9),
        "sig_g": pbr("SigG", color=(0.06, 0.72, 0.22), rough=0.28, emit=1.5),
        "desk": pbr("MesaSCADA", color=(0.14, 0.16, 0.2), rough=0.55, metal=0.2),
        "belt": pbr("Correia", color=(0.08, 0.08, 0.09), rough=0.55, metal=0.12),
        # Estrutura industrial: aço galvanizado das treliças e o amarelo de
        # segurança das partes móveis/pontes rolantes.
        "steel": pbr("Aco", color=(0.52, 0.55, 0.58), rough=0.42, metal=0.78),
        "steel_y": pbr("AcoSeguranca", color=(0.84, 0.66, 0.07), rough=0.5, metal=0.32),
        # --- Fase 4: desgaste --------------------------------------------
        # Nada numa mineradora é novo. Estes materiais existem para as partes
        # baixas e as superfícies que levam chuva, poeira e minério.
        "steel_rust": pbr(
            "AcoOxidado",
            g(TEX, "rock_diff.jpg"),
            g(TEX, "rock_nor.jpg"),
            None,
            color=(0.36, 0.18, 0.09),
            rough=0.86,
            metal=0.35,
            uv=7.0,
            tint=(0.42, 0.19, 0.08),
            tint_fac=0.6,
        ),
        "conc_dirty": pbr(
            "ConcretoEncardido",
            g(TEX, "concrete_diff.jpg"),
            g(TEX, "concrete_nor.jpg"),
            g(TEX, "concrete_rough.jpg"),
            uv=3.4,
            tint=(0.24, 0.21, 0.18),
            tint_fac=0.42,
            rough=0.9,
        ),
        # Telha metálica trapezoidal: o normal map da rocha, bem esticado num
        # eixo, já dá a leitura de nervura sem custar polígono.
        "roof": pbr("TelhaMetalica", None, None, None, color=(0.38, 0.42, 0.46), rough=0.55, metal=0.55),
        "roof_r": pbr("TelhaVermelha", None, None, None, color=(0.44, 0.19, 0.12), rough=0.7, metal=0.15),
        "tank": pbr("Tanque", color=(0.72, 0.74, 0.74), rough=0.35, metal=0.6),
        "hi_vis": pbr("Colete", color=(0.95, 0.38, 0.02), rough=0.75, emit=0.12),
        "skin": pbr("Pele", color=(0.62, 0.44, 0.33), rough=0.78),
        "helmet": pbr("Capacete", color=(0.9, 0.86, 0.2), rough=0.42),
        "rubber": pbr("Borracha", color=(0.07, 0.07, 0.08), rough=0.92),
        "sign_b": pbr("PlacaAzul", color=(0.06, 0.22, 0.52), rough=0.4),
        "puddle": pbr("Poca", color=(0.1, 0.11, 0.1), rough=0.05, metal=0.35),
        # Fase 8: agua de bacia de decantacao e de espessador nao e azul —
        # e a lama vermelha em suspensao do minerio de ferro.
        "tailings": pbr("Rejeito", color=(0.31, 0.16, 0.11), rough=0.24, metal=0.1),
        "amber": pbr("LuzMina", color=(1.0, 0.72, 0.28), rough=0.35, emit=0.55),
        "cont": [
            pbr("C1", color=(0.82, 0.28, 0.05), rough=0.45, metal=0.15),
            pbr("C2", color=(0.12, 0.36, 0.26), rough=0.45, metal=0.15),
            pbr("C3", color=(0.72, 0.58, 0.1), rough=0.45, metal=0.15),
            pbr("C4", color=(0.1, 0.18, 0.38), rough=0.45, metal=0.15),
            pbr("C5c", color=(0.75, 0.75, 0.72), rough=0.45, metal=0.15),
        ],
    }
