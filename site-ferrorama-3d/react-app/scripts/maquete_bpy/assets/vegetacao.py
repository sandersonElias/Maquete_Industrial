"""Família I — vegetação e terreno solto.

Referências: `design/referencias/arvores-ferromodelismo.png` (o sortimento de
árvores de maquete que o usuário escolheu como padrão) e o entorno de mata
das duas fotos aéreas.

`flora.py` já tinha as cinco espécies, mas escritas em coordenadas de mundo e
sem parâmetro de porte por instância. Aqui elas viram termos independentes, e
ganham as três coisas que faltavam para não parecerem geradas por script:

* **tronco com conicidade e ramificação assimétrica** — tronco reto é poste;
* **copa em massas desencontradas**, nunca uma esfera centrada no eixo;
* **porte sorteado da posição**, de modo que a mesma coordenada dê sempre a
  mesma árvore, mas duas vizinhas nunca sejam iguais.

Convenções: ver `base.py`.
"""

from __future__ import annotations

import math

from .base import Sitio, metros

TONS = ("leaf_lima", "leaf", "leaf2", "leaf_escuro")


def _tom(s, tom, sal=0.0):
    if tom is not None:
        return s.m[tom]
    return s.m[TONS[int(s.rnd(sal + 11.3) * len(TONS)) % len(TONS)]]


def _tronco(s, h, r=None, ramos=2, sal=0.0):
    """Fuste cônico com ramificação assimétrica."""
    r = r if r is not None else h * 0.035
    s.tubo("Fuste", r, h, (0, 0, h * 0.5), s.m["trunk"], verts=10, r2=r * 0.5)
    s.tubo("Raiz", r * 1.6, h * 0.08, (0, 0, h * 0.04), s.m["trunk"], verts=10, r2=r * 1.05)
    for i in range(max(0, ramos)):
        a = s.rnd(sal + i * 2.7) * math.tau
        alt = h * (0.55 + 0.32 * s.rnd(sal + 20 + i))
        comp = h * (0.16 + 0.1 * s.rnd(sal + 30 + i))
        s.barra(
            f"Ramo{i}",
            (0, 0, alt),
            (math.cos(a) * comp, math.sin(a) * comp, alt + comp * 0.7),
            r * 0.6, r * 0.6, s.m["trunk"],
        )


def arvore_conifera(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, altura=None, tom=None):
    """Conífera — cone alto em camadas, com a saia irregular.

    A saia em degraus (e não um cone liso) é a assinatura: um pinheiro visto de
    longe tem a silhueta serrilhada.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    h = altura if altura is not None else metros(11 + s.rnd(1.1) * 6)
    folha = _tom(s, tom, sal)
    _tronco(s, h * 0.4, r=h * 0.028, ramos=1, sal=sal)
    n = 6
    for i in range(n):
        t = i / (n - 1)
        base = h * (0.2 + 0.7 * t)
        raio = h * 0.3 * (1.0 - t * 0.88) * (0.88 + 0.24 * s.rnd(sal + i))
        s.tubo(f"Camada{i}", raio, h * 0.24, (0, 0, base), folha, verts=12, r2=raio * 0.24)
    s.tubo("Ponta", h * 0.045, h * 0.14, (0, 0, h * 0.96), folha, verts=8, r2=h * 0.004)
    return s.entregar()


def arvore_folhosa(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, altura=None, tom=None):
    """Folhosa — massa redonda e larga feita de três volumes desencontrados.

    Nenhum deles centrado no tronco: é o desencontro que dá a leitura de copa
    em vez de pirulito.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    h = altura if altura is not None else metros(6 + s.rnd(2.3) * 4)
    folha = _tom(s, tom, sal)
    _tronco(s, h * 0.55, r=h * 0.042, ramos=3, sal=sal)
    r = h * 0.42
    s.pedra("Copa", r, (0, 0, h * 0.76), folha, (1.18, 0.8, 1.12))
    for i in range(3):
        a = s.rnd(sal + 40 + i) * math.tau
        d = r * (0.5 + 0.24 * s.rnd(sal + 50 + i))
        s.pedra(
            f"Copa{i}",
            r * (0.52 + 0.2 * s.rnd(sal + 60 + i)),
            (math.cos(a) * d, math.sin(a) * d, h * (0.6 + 0.16 * i)),
            folha,
            (1.1, 0.8, 1.05),
        )
    return s.entregar()


def arvore_colunar(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, altura=None, tom=None):
    """Colunar (álamo/cipreste) — fuste alto e copa em fuso estreito.

    É a espécie que serve de acento vertical: uma fileira delas atrás de um
    galpão vale mais que dez folhosas espalhadas.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    h = altura if altura is not None else metros(9 + s.rnd(3.7) * 4)
    folha = _tom(s, tom, sal)
    _tronco(s, h * 0.35, r=h * 0.024, ramos=1, sal=sal)
    for i in range(4):
        t = i / 3
        s.pedra(
            f"Copa{i}",
            h * (0.17 - 0.05 * t),
            (0, 0, h * (0.36 + 0.2 * i)),
            folha,
            (0.82, 1.55, 0.82),
        )
    return s.entregar()


def arvore_chorao(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, altura=None, tom=None):
    """Chorão — copa achatada e larga, com massas pendendo abaixo da linha.

    As pontas caindo é o que a diferencia; sem elas vira uma folhosa gorda.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    h = altura if altura is not None else metros(5.5 + s.rnd(4.1) * 3)
    folha = _tom(s, tom, sal)
    _tronco(s, h * 0.6, r=h * 0.04, ramos=2, sal=sal)
    s.pedra("Copa", h * 0.5, (0, 0, h * 0.74), folha, (1.4, 0.52, 1.35))
    for i in range(4):
        a = (s.rnd(sal + 70 + i) + i / 4.0) * math.tau
        d = h * (0.36 + 0.1 * s.rnd(sal + 80 + i))
        s.pedra(
            f"Pende{i}",
            h * 0.19,
            (math.cos(a) * d, math.sin(a) * d, h * (0.46 + 0.08 * s.rnd(sal + 90 + i))),
            folha,
            (0.78, 1.3, 0.78),
        )
    return s.entregar()


def arbusto_florido(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, altura=None, flor=None):
    """Touceira baixa com flor — a primeira fila de qualquer canteiro.

    Serve de base à massa arbórea: sem arbusto, os troncos ficam soltos no
    gramado e a leitura desanda.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    h = altura if altura is not None else metros(1.4 + s.rnd(5.5) * 1.2)
    folha = m[TONS[int(s.rnd(6.7) * len(TONS)) % len(TONS)]]
    for i in range(4):
        a = (s.rnd(sal + 100 + i) + i / 4.0) * math.tau
        d = h * 0.45
        s.pedra(
            f"Massa{i}",
            h * (0.44 + 0.22 * s.rnd(sal + 110 + i)),
            (math.cos(a) * d, math.sin(a) * d, h * 0.48),
            folha,
            (1.15, 0.82, 1.12),
        )
    if flor:
        for i in range(5):
            a = s.rnd(sal + 120 + i) * math.tau
            d = h * (0.25 + 0.5 * s.rnd(sal + 130 + i))
            s.pedra(
                f"Flor{i}",
                h * 0.14,
                (math.cos(a) * d, math.sin(a) * d, h * (0.72 + 0.24 * s.rnd(sal + 140 + i))),
                m[flor],
                (1, 1, 1),
            )
    return s.entregar()


def moita_capim(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, n=7):
    """Moita de capim alto — tufos de placas cruzadas, baratos e eficazes.

    Espalhados na berma da estrada e no pé dos taludes, é o que impede o
    terreno de parecer um tapete.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    folha = m["leaf_lima"]
    for i in range(max(1, n)):
        rr = s.rnd(i * 3.1)
        r2 = s.rnd(i * 7.3)
        a = rr * math.tau
        d = metros(0.9) * r2
        alt = metros(0.5 + rr * 0.5)
        px, pt = math.cos(a) * d, math.sin(a) * d
        for k in range(2):
            s.caixa(
                f"Tufo{i}{k}",
                (metros(0.5 + r2 * 0.3), alt, metros(0.02)),
                (px, pt, alt * 0.5),
                folha,
                bevel=0.0,
                giro=a + k * math.pi / 2,
            )
    return s.entregar()


def toco_tronco(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, caido=True):
    """Toco e tronco caído — a marca de que a área foi desmatada para a lavra.

    Custa três objetos e conta uma história que nenhum outro asset conta.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    tr = m["trunk"]
    s.tubo("Toco", metros(0.45), metros(0.8), (0, 0, metros(0.4)), tr, verts=12, r2=metros(0.38))
    s.tubo("TocoTopo", metros(0.4), metros(0.1), (0, 0, metros(0.82)), m["dirt"], verts=12)
    for i in range(3):
        a = s.rnd(i * 4.4) * math.tau
        s.barra(f"Raiz{i}", (0, 0, metros(0.15)), (math.cos(a) * metros(0.9), math.sin(a) * metros(0.9), 0), metros(0.14), metros(0.14), tr)
    if caido:
        s.tubo("Tronco", metros(0.36), metros(6.0), (metros(3.4), metros(1.2), metros(0.36)), tr, eixo="a", giro=0.5, verts=12, r2=metros(0.24))
        s.barra("Galho", (metros(3.0), metros(0.5), metros(0.5)), (metros(3.9), metros(2.2), metros(1.1)), metros(0.1), metros(0.1), tr)
        s.barra("Galho2", (metros(4.6), metros(2.0), metros(0.5)), (metros(5.4), metros(0.9), metros(1.0)), metros(0.09), metros(0.09), tr)
    return s.entregar()


def afloramento_rocha(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, raio=None, blocos=5):
    """Afloramento rochoso — blocos angulosos rompendo o terreno.

    Serve para quebrar o gramado e para justificar por que a lavra é ali. Os
    blocos são icosaedros achatados e girados, nunca esferas.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    r = raio if raio is not None else metros(3.0)
    for i in range(max(1, blocos)):
        rr = s.rnd(i * 2.9)
        r2 = s.rnd(i * 6.1)
        a = rr * math.tau
        d = r * r2 * 0.7
        s.pedra(
            f"Bloco{i}",
            r * (0.34 + 0.3 * rr),
            (math.cos(a) * d, math.sin(a) * d, r * (0.12 + 0.22 * r2)),
            m["rock"],
            (1.0 + rr * 0.5, 0.55 + r2 * 0.4, 1.0 + r2 * 0.4),
        )
    for i in range(3):
        rr = s.rnd(i * 9.7)
        a = rr * math.tau
        s.pedra(f"Lasca{i}", r * 0.14, (math.cos(a) * r * 0.95, math.sin(a) * r * 0.95, r * 0.06), m["rock"], (1.4, 0.4, 1.2))
    return s.entregar()
