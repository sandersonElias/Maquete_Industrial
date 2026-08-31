"""Fase 15 — árvores de ferromodelismo no lugar de bolas verdes em palitos.

O que existia era uma receita só, repetida em toda a maquete: um cilindro
cônico de tronco e duas icoesferas de copa, em dois tons de verde. Um pinheiro
e uma mangueira saíam idênticos, e a repetição do mesmo contorno é justamente o
que denuncia vegetação gerada por script.

A foto de referência é um sortimento de árvores de maquete, e o que ela mostra
é **variedade** em quatro eixos ao mesmo tempo:

* **Silhueta** — cone alto e estreito (conífera), massa redonda e larga
  (folhosa), fuste alto e magro (colunar), copa caída (chorão), e touceiras
  baixas com flor.
* **Verde** — do lima quase amarelo ao verde-escuro azulado, e os tons não
  acompanham a espécie: há conífera clara e folhosa escura.
* **Altura** — as coníferas do fundo têm quase o dobro das folhosas da frente.
* **Tronco** — visível, fino, e com ramificação. Tronco reto e liso é poste.

Este módulo troca a receita única por cinco espécies e sorteia espécie, tom,
altura e giro a partir da posição, com ruído estável: a mesma coordenada dá
sempre a mesma árvore, então o resultado não muda de build para build.

Custo: uma árvore fica entre 90 e 200 vértices. São ~110 árvores no tabuleiro,
e todas as de um mesmo grupo são fundidas numa malha só — o que importa num
celular é a contagem de chamadas de desenho, não a de vértices.

Convenção de coordenadas e de rotação: igual ao resto (ver `process.py`).
"""

from __future__ import annotations

import math

from .primitives import cube, cyl, ico, join

# Tons de copa, do mais claro ao mais escuro. O sorteio nunca casa tom com
# espécie: na foto há conífera clara e folhosa escura.
TONS = ("leaf_lima", "leaf", "leaf2", "leaf_escuro")


def _ruido(x, z, sal=0.0):
    """Pseudoaleatório estável por posição: a mesma coordenada, a mesma árvore."""
    n = math.sin(x * 127.1 + z * 311.7 + sal * 74.7) * 43758.5453
    return n - math.floor(n)


def _tronco(name, x, z, m, h, r=0.035, ramos=2, sal=0.0):
    """Fuste com ramificação. Tronco reto e liso lê como poste."""
    p = [cyl(f"{name}Fuste", r, h, (x, h * 0.5, z), m["trunk"], 8, r2=r * 0.55)]
    for i in range(ramos):
        a = _ruido(x, z, sal + i) * math.tau
        alt = h * (0.55 + 0.3 * _ruido(x, z, sal + 10 + i))
        p.append(
            cube(
                f"{name}Ramo{i}",
                (h * 0.34, r * 0.85, r * 0.85),
                (x + math.cos(a) * h * 0.14, alt, z + math.sin(a) * h * 0.14),
                m["trunk"],
                0.0,
                rot=(0, a, -0.85),
            )
        )
    return p


def conifera(name, x, z, m, h=1.15, tom=None, sal=0.0):
    """Cone alto e estreito, em camadas — a saia da conífera não é lisa."""
    folha = m[tom or "leaf_escuro"]
    p = _tronco(name, x, z, m, h * 0.42, r=0.032, ramos=1, sal=sal)
    n = 5
    for i in range(n):
        t = i / (n - 1)
        base = h * (0.24 + 0.66 * t)
        raio = h * 0.34 * (1.0 - t * 0.86)
        p.append(cyl(f"{name}C{i}", raio, h * 0.26, (x, base, z), folha, 12, r2=raio * 0.28))
    p.append(cyl(f"{name}Ponta", h * 0.05, h * 0.14, (x, h * 0.96, z), folha, 8, r2=0.004))
    return p


def folhosa(name, x, z, m, h=0.72, tom=None, sal=0.0):
    """Massa redonda e larga, feita de três volumes desencontrados."""
    folha = m[tom or "leaf"]
    p = _tronco(name, x, z, m, h * 0.55, r=0.038, ramos=3, sal=sal)
    r = h * 0.46
    p.append(ico(f"{name}Copa", r, (x, h * 0.78, z), folha, 1, (1.15, 0.82, 1.1)))
    for i in range(2):
        a = _ruido(x, z, sal + 20 + i) * math.tau
        d = r * 0.6
        p.append(
            ico(
                f"{name}Copa{i}",
                r * (0.58 + 0.16 * _ruido(x, z, sal + 30 + i)),
                (x + math.cos(a) * d, h * (0.64 + 0.18 * i), z + math.sin(a) * d),
                folha,
                1,
                (1.1, 0.8, 1.05),
            )
        )
    return p


def colunar(name, x, z, m, h=1.0, tom=None, sal=0.0):
    """Fuste alto e magro com copa em fuso — o álamo do fundo da foto."""
    folha = m[tom or "leaf_lima"]
    p = _tronco(name, x, z, m, h * 0.4, r=0.03, ramos=1, sal=sal)
    for i in range(3):
        t = i / 2
        p.append(
            ico(
                f"{name}Copa{i}",
                h * (0.19 - 0.05 * t),
                (x, h * (0.42 + 0.24 * i), z),
                folha,
                1,
                (0.85, 1.5, 0.85),
            )
        )
    return p


def chorao(name, x, z, m, h=0.66, tom=None, sal=0.0):
    """Copa caída: massa achatada e larga, mais baixa que o fuste."""
    folha = m[tom or "leaf2"]
    p = _tronco(name, x, z, m, h * 0.62, r=0.036, ramos=2, sal=sal)
    p.append(ico(f"{name}Copa", h * 0.52, (x, h * 0.72, z), folha, 1, (1.35, 0.55, 1.3)))
    for i in range(3):
        a = (_ruido(x, z, sal + 40 + i) + i / 3.0) * math.tau
        d = h * 0.42
        p.append(
            ico(
                f"{name}Pende{i}",
                h * 0.2,
                (x + math.cos(a) * d, h * 0.52, z + math.sin(a) * d),
                folha,
                1,
                (0.8, 1.25, 0.8),
            )
        )
    return p


def touceira(name, x, z, m, h=0.2, tom=None, sal=0.0, flor=None):
    """Arbusto baixo, com flor quando pedido — a primeira fila da foto."""
    folha = m[tom or "leaf_lima"]
    p = []
    for i in range(3):
        a = (_ruido(x, z, sal + 50 + i) + i / 3.0) * math.tau
        d = h * 0.5
        p.append(
            ico(
                f"{name}M{i}",
                h * (0.5 + 0.2 * _ruido(x, z, sal + 60 + i)),
                (x + math.cos(a) * d, h * 0.5, z + math.sin(a) * d),
                folha,
                1,
                (1.1, 0.85, 1.1),
            )
        )
    if flor:
        for i in range(4):
            a = _ruido(x, z, sal + 70 + i) * math.tau
            d = h * (0.3 + 0.5 * _ruido(x, z, sal + 80 + i))
            p.append(
                ico(
                    f"{name}Flor{i}",
                    h * 0.16,
                    (x + math.cos(a) * d, h * (0.75 + 0.25 * _ruido(x, z, sal + 90 + i)), z + math.sin(a) * d),
                    m[flor],
                    1,
                )
            )
    return p


# ---------------------------------------------------------------------------

ESPECIES = (conifera, folhosa, colunar, chorao)
ALTURAS = ((0.95, 1.55), (0.55, 0.95), (0.8, 1.25), (0.5, 0.8))
FLORES = ("flor_r", "flor_a", "flor_b")


def arvore_sorteada(name, x, z, m, escala=1.0, sal=0.0):
    """Sorteia espécie, tom, altura e giro a partir da própria posição."""
    r0 = _ruido(x, z, sal)
    r1 = _ruido(x, z, sal + 1.3)
    r2 = _ruido(x, z, sal + 2.7)
    i = int(r0 * len(ESPECIES)) % len(ESPECIES)
    lo, hi = ALTURAS[i]
    h = (lo + (hi - lo) * r1) * escala
    tom = TONS[int(r2 * len(TONS)) % len(TONS)]
    return ESPECIES[i](name, x, z, m, h=h, tom=tom, sal=sal + 3.1)


def bosque(prefixo, pontos, m, escala=1.0, arbustos=0.35):
    """Planta um grupo e funde tudo numa malha só.

    `arbustos` é a fração de pontos que vira touceira em vez de árvore — a foto
    de referência tem uma fila inteira delas na frente, e é o que dá base à
    massa arbórea em vez de deixar os troncos soltos no gramado.
    """
    partes = []
    for k, (x, z) in enumerate(pontos):
        if _ruido(x, z, 99.0) < arbustos:
            flor = FLORES[k % len(FLORES)] if _ruido(x, z, 98.0) < 0.55 else None
            partes += touceira(f"{prefixo}T{k}", x, z, m, h=0.18 + 0.1 * _ruido(x, z, 97.0), sal=k * 0.7, flor=flor)
        else:
            partes += arvore_sorteada(f"{prefixo}A{k}", x, z, m, escala=escala, sal=k * 0.7)
    return join(prefixo, partes)


def fileira(prefixo, pontos, m, passo=1.0, jitter=0.22, escala=0.85, arbustos=0.2):
    """Alinhamento seguindo uma polilinha — alameda, cortina, bordo de rua."""
    pts = []
    for i in range(len(pontos) - 1):
        x0, z0 = pontos[i]
        x1, z1 = pontos[i + 1]
        comp = math.hypot(x1 - x0, z1 - z0)
        n = max(1, int(round(comp / passo)))
        for j in range(n):
            t = (j + 0.5) / n
            r = _ruido(x0 + j, z0 - j, 5.5)
            pts.append((x0 + (x1 - x0) * t + (r - 0.5) * jitter, z0 + (z1 - z0) * t + (r * 0.6 - 0.3) * jitter))
    return bosque(prefixo, pts, m, escala=escala, arbustos=arbustos)
