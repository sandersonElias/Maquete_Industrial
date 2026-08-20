"""Maquete Ferrorama — gerador Blender 4.5 LTS → GLB.

Entrada estável: blender --background --python scripts/build_maquete_blender.py -- <out.glb>
A cena vive em scripts/maquete_bpy/ (railway, mines, port, vehicles).
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from maquete_bpy.main import build  # noqa: E402

if __name__ == "__main__":
    build()
