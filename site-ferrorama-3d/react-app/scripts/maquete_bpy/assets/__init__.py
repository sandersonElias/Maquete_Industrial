"""Catálogo de assets da maquete — cada peça como termo independente.

Uso típico a partir de um módulo de montagem:

    from .assets import plantar
    plantar("galpao-industrial", "GalpaoOficina", -12.4, 3.8, m, yaw=0.6, comp=4.2)

Ver `catalogo.py` para a lista completa e `base.py` para as convenções.
"""

from .base import ESCALA_M, Sitio, metros, ruido
from .catalogo import FAMILIAS, POR_SLUG, TODOS, Asset, obter, plantar

__all__ = [
    "ESCALA_M",
    "FAMILIAS",
    "POR_SLUG",
    "TODOS",
    "Asset",
    "Sitio",
    "metros",
    "obter",
    "plantar",
    "ruido",
]
