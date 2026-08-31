"""Família H — pátio. As coisas pequenas, que são as que provam a escala.

Referências: as três fotos do diretório `design/referencias/`. Em todas elas o
que convence não são os volumes grandes — é o cone laranja ao lado da máquina,
o tambor encostado na parede, a bobina de cabo largada no canto, o operário de
colete.

Vale uma regra prática: **um asset grande sozinho parece maquete; um asset
grande cercado de assets pequenos parece obra**. Esta família existe para ser
espalhada, nunca posicionada uma peça de cada vez.

O operário mede `metros(1,75)`. Ele é a régua de tudo: se um caminhão parece
menor que sete operários enfileirados, o caminhão está errado.

Convenções: ver `base.py`.
"""

from __future__ import annotations

import math

from .base import Sitio, metros


def container_escritorio(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, cor=None, degrau=True):
    """Contêiner adaptado a escritório de obra — janela, porta e ar-condicionado.

    A diferença para o contêiner de carga é toda nos furos: uma janela de
    correr, uma porta com degrau e a condensadora pendurada.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    mat = cor or m["white"]
    c, l, h = metros(6.1), metros(2.44), metros(2.59)
    s.caixa("Blocos", (c * 0.9, metros(0.3), l * 0.9), (0, 0, metros(0.15)), m["conc_dirty"], bevel=0.004)
    s.caixa("Corpo", (c, h, l), (0, 0, metros(0.3) + h * 0.5), mat, bevel=0.005)
    n = int(c / metros(0.35))
    for i in range(n):
        a = -c * 0.5 + c * (i + 0.5) / n
        s.caixa(f"Corr{i}", (metros(0.16), h * 0.86, metros(0.05)), (a, -l * 0.5 - metros(0.02), metros(0.3) + h * 0.5), mat, bevel=0.001)
    for sa in (-1, 1):
        for st in (-1, 1):
            for sv, hy in ((0, metros(0.46)), (1, metros(0.3) + h - metros(0.16))):
                s.caixa(f"Cant{sa}{st}{sv}", (metros(0.32), metros(0.3), metros(0.32)), (sa * (c * 0.5 - metros(0.16)), st * (l * 0.5 - metros(0.16)), hy), m["steel_rust"], bevel=0.002)
    s.caixa("Teto", (c, metros(0.06), l), (0, 0, metros(0.3) + h), m["steel_rust"], bevel=0.002)
    s.caixa("Janela", (metros(1.6), metros(1.0), metros(0.1)), (c * 0.18, l * 0.5 + metros(0.03), metros(0.3) + metros(1.5)), m["glass"], bevel=0.003)
    s.caixa("Moldura", (metros(1.75), metros(1.15), metros(0.06)), (c * 0.18, l * 0.5 + metros(0.06), metros(0.3) + metros(1.5)), m["steel"], bevel=0.002)
    s.caixa("Porta", (metros(0.9), metros(2.0), metros(0.1)), (-c * 0.28, l * 0.5 + metros(0.03), metros(0.3) + metros(1.0)), m["steel"], bevel=0.003)
    s.caixa("Ar", (metros(0.9), metros(0.7), metros(0.5)), (c * 0.38, l * 0.5 + metros(0.2), metros(0.3) + metros(2.1)), m["white"], bevel=0.004)
    if degrau:
        s.caixa("Degrau", (metros(1.2), metros(0.15), metros(0.8)), (-c * 0.28, l * 0.5 + metros(0.5), metros(0.25)), m["steel_rust"], bevel=0.003)
        for st in (-1, 1):
            s.barra(f"Corrimao{st}", (-c * 0.28 + st * metros(0.55), l * 0.5 + metros(0.1), metros(0.3)), (-c * 0.28 + st * metros(0.55), l * 0.5 + metros(0.9), metros(1.2)), metros(0.05), metros(0.05), m["steel"])
    return s.entregar()


def tambores(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, n=6, bacia=True):
    """Grupo de tambores de 200 L, alguns deitados, sobre bacia de contenção.

    Nunca alinhe todos em pé: dois deitados e um fora de esquadro é o que
    diferencia um pátio de uma prateleira.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    cores = (m["sig_r"], m["mrs_b"], m["sig_g"], m["steel_rust"], m["steel_y"])
    r, h = metros(0.29), metros(0.88)
    if bacia:
        s.caixa("Bacia", (metros(2.6), metros(0.28), metros(2.0)), (0, 0, metros(0.14)), m["steel_y"], bevel=0.005)
        s.caixa("Grade", (metros(2.4), metros(0.06), metros(1.8)), (0, 0, metros(0.3)), m["steel"], bevel=0.003)
    y0 = metros(0.32) if bacia else 0.0
    for i in range(max(1, n)):
        rr = s.rnd(i * 3.7)
        mat = cores[int(rr * len(cores)) % len(cores)]
        col, lin = i % 3, i // 3
        a = -metros(0.75) + col * metros(0.75) + (rr - 0.5) * metros(0.1)
        t = -metros(0.4) + lin * metros(0.8) + (rr - 0.5) * metros(0.1)
        if rr > 0.78:
            s.tubo(f"Tambor{i}", r, h, (a, t, y0 + r), mat, eixo="a", giro=rr * 0.8, verts=16)
            for k in range(2):
                s.tubo(f"Frisa{i}{k}", r * 1.05, metros(0.05), (a + (k - 0.5) * metros(0.34), t, y0 + r), m["steel_rust"], eixo="a", giro=rr * 0.8, verts=16)
        else:
            s.tubo(f"Tambor{i}", r, h, (a, t, y0 + h * 0.5), mat, verts=16)
            for k in range(2):
                s.tubo(f"Frisa{i}{k}", r * 1.05, metros(0.05), (a, t, y0 + metros(0.3) + k * metros(0.28)), m["steel_rust"], verts=16)
            s.tubo(f"Tampa{i}", r * 1.02, metros(0.05), (a, t, y0 + h), m["steel_rust"], verts=16)
    return s.entregar()


def palete_carga(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, camadas=3, filme=True):
    """Palete PBR com carga em sacos e filme stretch.

    O palete vazio também serve — encoste dois na parede do galpão.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c, l = metros(1.2), metros(1.0)
    for i in range(3):
        s.caixa(f"Longarina{i}", (c, metros(0.08), metros(0.1)), (0, -l * 0.4 + i * l * 0.4, metros(0.11)), m["trunk"], bevel=0.002)
        s.caixa(f"Pe{i}", (metros(0.1), metros(0.1), l), (-c * 0.42 + i * c * 0.42, 0, metros(0.05)), m["trunk"], bevel=0.002)
    for i in range(5):
        s.caixa(f"Tabua{i}", (metros(0.14), metros(0.03), l), (-c * 0.42 + i * c * 0.21, 0, metros(0.16)), m["trunk"], bevel=0.002)
    for k in range(max(0, camadas)):
        for j in range(2):
            s.caixa(
                f"Saco{k}{j}",
                (c * 0.92, metros(0.22), l * 0.44),
                (0, (j - 0.5) * l * 0.46, metros(0.28) + k * metros(0.24)),
                m["white"] if (k + j) % 2 else m["conc"],
                bevel=0.005,
            )
    if filme and camadas > 0:
        s.caixa("Filme", (c * 0.98, camadas * metros(0.24), l * 0.98), (0, 0, metros(0.28) + (camadas - 1) * metros(0.12)), m["glass"], bevel=0.006)
    return s.entregar()


def bobina_cabo(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, deitada=False, raio=None):
    """Bobina de cabo — dois discos de madeira e o núcleo enrolado.

    Em pé e escorada, ou deitada. É um dos objetos mais reconhecíveis de um
    pátio industrial e um dos mais baratos de fazer.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    r = raio if raio is not None else metros(1.1)
    larg = r * 0.85
    if deitada:
        s.tubo("DiscoA", r, metros(0.1), (0, 0, metros(0.05)), m["trunk"], verts=22)
        s.tubo("DiscoB", r, metros(0.1), (0, 0, larg), m["trunk"], verts=22)
        s.tubo("Nucleo", r * 0.34, larg, (0, 0, larg * 0.5), m["trunk"], verts=16)
        s.tubo("Cabo", r * 0.72, larg * 0.8, (0, 0, larg * 0.5), m["black"], verts=22)
    else:
        s.tubo("DiscoA", r, metros(0.1), (0, -larg * 0.5, r), m["trunk"], eixo="t", verts=22)
        s.tubo("DiscoB", r, metros(0.1), (0, larg * 0.5, r), m["trunk"], eixo="t", verts=22)
        s.tubo("Nucleo", r * 0.34, larg, (0, 0, r), m["trunk"], eixo="t", verts=16)
        s.tubo("Cabo", r * 0.72, larg * 0.82, (0, 0, r), m["black"], eixo="t", verts=22)
        for st in (-1, 1):
            s.caixa(f"Calco{st}", (metros(0.5), metros(0.22), metros(0.3)), (st * r * 0.85, 0, metros(0.11)), m["trunk"], bevel=0.004)
    for i in range(6):
        a = i * math.tau / 6
        if deitada:
            s.caixa(f"Nerv{i}", (r * 1.6, metros(0.06), metros(0.12)), (0, 0, larg + metros(0.06)), m["trunk"], bevel=0.002, giro=a)
        else:
            s.caixa(f"Nerv{i}", (r * 1.6 * math.cos(a), metros(0.12), metros(0.06)), (0, larg * 0.5 + metros(0.06), r), m["trunk"], bevel=0.002)
    return s.entregar()


def pilha_tubos(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, camadas=3, comp=None, raio=None):
    """Pilha piramidal de tubos com calços — estoque de linha.

    O empilhamento em ninho (cada camada com um tubo a menos, encaixada nos
    vãos) é o que dá o triângulo característico.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c = comp if comp is not None else metros(8)
    r = raio if raio is not None else metros(0.32)
    base = camadas + 2
    for st in (-1, 1):
        s.caixa(f"Calco{st}", (metros(0.2), metros(0.16), base * r * 2.1), (st * c * 0.4, 0, metros(0.08)), m["trunk"], bevel=0.003)
        s.caixa(f"Batente{st}A", (metros(0.16), metros(0.5), metros(0.16)), (st * c * 0.4, -base * r * 1.05, metros(0.25)), m["trunk"], bevel=0.003)
        s.caixa(f"Batente{st}B", (metros(0.16), metros(0.5), metros(0.16)), (st * c * 0.4, base * r * 1.05, metros(0.25)), m["trunk"], bevel=0.003)
    for k in range(camadas):
        n = base - k
        hy = metros(0.16) + r + k * r * 1.73
        for i in range(n):
            t = -(n - 1) * r + i * r * 2.0
            mat = m["steel_rust"] if (i + k) % 3 == 0 else m["tank"]
            s.tubo(f"Tubo{k}{i}", r, c * 0.85, (0, t, hy), mat, eixo="a", verts=14)
            s.tubo(f"Furo{k}{i}", r * 0.72, c * 0.86, (0, t, hy), m["black"], eixo="a", verts=14)
    return s.entregar()


def cacamba_entulho(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, cheia=True, cor=None):
    """Caçamba estacionária de entulho — trapezoidal, com ganchos e nervuras."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    mat = cor or m["sig_y"]
    c, l, h = metros(4.2), metros(1.9), metros(1.3)
    s.caixa("Fundo", (c, metros(0.12), l), (0, 0, metros(0.1)), m["steel_rust"], bevel=0.004)
    for st in (-1, 1):
        s.caixa(f"Lateral{st}", (c, h * 1.06, metros(0.1)), (0, st * (l * 0.5 + metros(0.16)), metros(0.1) + h * 0.5), mat, bevel=0.005, tombo=-st * 0.16)
        for i in range(5):
            s.caixa(f"Nerv{st}{i}", (metros(0.1), h, metros(0.14)), (-c * 0.4 + i * c * 0.2, st * (l * 0.5 + metros(0.24)), metros(0.1) + h * 0.5), mat, bevel=0.003)
    for sa in (-1, 1):
        s.caixa(f"Testeira{sa}", (metros(0.1), h * 1.02, l * 1.1), (sa * c * 0.5, 0, metros(0.1) + h * 0.5), mat, bevel=0.005)
    s.caixa("Borda", (c, metros(0.14), l * 1.2), (0, 0, metros(0.1) + h * 1.02), m["steel_rust"], bevel=0.004)
    for st in (-1, 1):
        s.tubo(f"Gancho{st}", metros(0.12), metros(0.7), (c * 0.42, st * l * 0.45, metros(0.1) + h * 0.9), m["steel_rust"], eixo="t", verts=8)
        s.caixa(f"Pe{st}", (metros(0.6), metros(0.1), metros(0.3)), (-c * 0.36, st * l * 0.4, metros(0.05)), m["steel_rust"], bevel=0.003)
    if cheia:
        for i in range(6):
            rr = s.rnd(i * 5.1)
            mat_e = m["conc_dirty"] if rr > 0.5 else m["trunk"]
            s.pedra(f"Entulho{i}", metros(0.3 + rr * 0.2), (-c * 0.32 + i * c * 0.13, (rr - 0.5) * l * 0.6, metros(1.3) + rr * metros(0.2)), mat_e, (1.3, 0.7, 1.1))
    return s.entregar()


def cone_sinalizacao(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, n=1, fita=False):
    """Cone de trânsito, sozinho ou em fila, com fita entre eles.

    Custa 4 objetos e é o item que mais rápido faz uma cena parecer operação
    em andamento.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    h = metros(0.75)
    for i in range(max(1, n)):
        a = (i - (n - 1) * 0.5) * metros(1.6)
        s.caixa(f"Base{i}", (metros(0.42), metros(0.05), metros(0.42)), (a, 0, metros(0.025)), m["hi_vis"], bevel=0.004)
        s.tubo(f"Cone{i}", metros(0.16), h, (a, 0, h * 0.5 + metros(0.04)), m["hi_vis"], verts=14, r2=metros(0.04))
        s.tubo(f"Faixa{i}", metros(0.125), metros(0.12), (a, 0, metros(0.5)), m["white"], verts=14, r2=metros(0.105))
    if fita and n > 1:
        for i in range(n - 1):
            a0 = (i - (n - 1) * 0.5) * metros(1.6)
            s.barra(f"Fita{i}", (a0, 0, metros(0.6)), (a0 + metros(1.6), 0, metros(0.6)), metros(0.02), metros(0.1), m["sig_y"])
    return s.entregar()


def placa_sinalizacao(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, tipo="obra"):
    """Placa de sinalização em poste. `tipo`: obra, aviso, informativa ou epi.

    Quatro variantes na mesma função, porque uma planta tem os quatro tipos e
    nenhum deles aparece sozinho.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco = m["steel"]
    s.caixa("Sapata", (metros(0.35), metros(0.25), metros(0.35)), (0, 0, metros(0.12)), m["conc_dirty"], bevel=0.003)
    if tipo == "obra":
        for st in (-1, 1):
            s.tubo(f"Poste{st}", metros(0.05), metros(2.2), (0, st * metros(0.6), metros(1.1)), aco, verts=8)
        s.caixa("Painel", (metros(0.06), metros(1.2), metros(1.6)), (0, 0, metros(1.8)), m["sig_y"], bevel=0.003)
        s.caixa("Borda", (metros(0.08), metros(1.3), metros(1.7)), (0, 0, metros(1.8)), m["black"], bevel=0.003)
    elif tipo == "aviso":
        s.tubo("Poste", metros(0.06), metros(2.4), (0, 0, metros(1.2)), aco, verts=8)
        s.caixa("Painel", (metros(0.06), metros(0.8), metros(0.8)), (0, 0, metros(2.3)), m["sig_y"], bevel=0.003, tombo=math.pi / 4)
        s.caixa("Simbolo", (metros(0.08), metros(0.3), metros(0.1)), (0, 0, metros(2.3)), m["black"], bevel=0.002)
    elif tipo == "epi":
        s.tubo("Poste", metros(0.06), metros(2.6), (0, 0, metros(1.3)), aco, verts=8)
        s.caixa("Painel", (metros(0.06), metros(1.6), metros(1.1)), (0, 0, metros(2.1)), m["white"], bevel=0.003)
        for i in range(3):
            s.tubo(f"Icone{i}", metros(0.16), metros(0.06), (metros(0.04), 0, metros(2.55) - i * metros(0.45)), m["sign_b"], eixo="a", verts=12)
    else:
        for st in (-1, 1):
            s.tubo(f"Poste{st}", metros(0.06), metros(3.0), (0, st * metros(1.1), metros(1.5)), aco, verts=8)
        s.caixa("Painel", (metros(0.08), metros(1.4), metros(2.6)), (0, 0, metros(2.6)), m["sign_b"], bevel=0.004)
        s.caixa("Texto", (metros(0.1), metros(0.22), metros(2.0)), (metros(0.03), 0, metros(2.9)), m["white"], bevel=0.002)
        s.caixa("Texto2", (metros(0.1), metros(0.16), metros(1.5)), (metros(0.03), 0, metros(2.4)), m["white"], bevel=0.002)
    return s.entregar()


def barreira_concreto(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, n=4, refletivo=True):
    """Fila de barreiras New Jersey — separa pista, protege equipamento.

    O perfil escalonado (base larga, cintura, topo estreito) é o que a
    distingue de um bloco retangular.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c = metros(2.0)
    for i in range(max(1, n)):
        a = (i - (n - 1) * 0.5) * (c + metros(0.06))
        s.caixa(f"Pe{i}", (c, metros(0.22), metros(0.62)), (a, 0, metros(0.11)), m["conc"], bevel=0.004)
        s.caixa(f"Cintura{i}", (c, metros(0.28), metros(0.44)), (a, 0, metros(0.36)), m["conc"], bevel=0.004)
        s.caixa(f"Topo{i}", (c, metros(0.42), metros(0.24)), (a, 0, metros(0.71)), m["conc"], bevel=0.004)
        if refletivo:
            for st in (-1, 1):
                s.caixa(f"Refl{i}{st}", (metros(0.28), metros(0.14), metros(0.03)), (a, st * metros(0.13), metros(0.78)), m["hi_vis"], bevel=0.001)
    return s.entregar()


def banco_praca(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, lixeira=True):
    """Banco de ripas com lixeira — a área de convivência do campus.

    Nem toda planta industrial é máquina; o pedaço humano é o que faz a
    referência aérea do terminal parecer um lugar onde gente trabalha.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco = m["black"]
    for st in (-1, 1):
        s.caixa(f"Pe{st}", (metros(0.1), metros(0.42), metros(0.5)), (st * metros(0.7), 0, metros(0.21)), aco, bevel=0.004)
        s.caixa(f"Encosto{st}", (metros(0.08), metros(0.5), metros(0.1)), (st * metros(0.7), -metros(0.22), metros(0.66)), aco, bevel=0.003)
    for i in range(4):
        s.caixa(f"Ripa{i}", (metros(1.8), metros(0.05), metros(0.12)), (0, -metros(0.18) + i * metros(0.14), metros(0.44)), m["trunk"], bevel=0.003)
    for i in range(3):
        s.caixa(f"RipaE{i}", (metros(1.8), metros(0.12), metros(0.05)), (0, -metros(0.26), metros(0.6) + i * metros(0.14)), m["trunk"], bevel=0.003)
    if lixeira:
        s.tubo("Lixeira", metros(0.22), metros(0.7), (metros(1.5), 0, metros(0.35)), m["sig_g"], verts=14)
        s.tubo("LixeiraTampa", metros(0.24), metros(0.08), (metros(1.5), 0, metros(0.74)), aco, verts=14)
        s.tubo("LixeiraPoste", metros(0.05), metros(1.0), (metros(1.5), metros(0.28), metros(0.5)), aco, verts=8)
    return s.entregar()


def lixeira_industrial(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, n=4):
    """Bateria de coleta seletiva sob cobertura — quatro cores, tampa e rodas."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    cores = (m["mrs_b"], m["sig_r"], m["sig_g"], m["steel_y"])
    larg = metros(0.7)
    total = n * larg
    for i in range(max(1, n)):
        t = -total * 0.5 + larg * (i + 0.5)
        mat = cores[i % len(cores)]
        s.caixa(f"Corpo{i}", (metros(0.62), metros(0.9), larg * 0.88), (0, t, metros(0.58)), mat, bevel=0.008)
        s.caixa(f"Tampa{i}", (metros(0.66), metros(0.08), larg * 0.9), (0, t, metros(1.06)), mat, bevel=0.005)
        s.caixa(f"Pedal{i}", (metros(0.2), metros(0.06), larg * 0.5), (metros(0.36), t, metros(0.16)), m["black"], bevel=0.002)
        for st in (-1, 1):
            s.tubo(f"Roda{i}{st}", metros(0.09), metros(0.06), (-metros(0.2), t + st * larg * 0.34, metros(0.09)), m["black"], eixo="t", verts=10)
    for st in (-1, 1):
        for sa in (-1, 1):
            s.tubo(f"Pilar{st}{sa}", metros(0.05), metros(2.3), (sa * metros(0.6), st * total * 0.5, metros(1.15)), m["steel"], verts=8)
    # A fileira de lixeiras corre na lateral, então a cobertura precisa ser
    # curta no avanço e longa na lateral — o contrário sai atravessado.
    s.telhado_duas_aguas("Cob", metros(1.6), total + metros(0.6), metros(2.3), metros(2.6), m["roof"], espessura=metros(0.08), beiral=metros(0.25))
    return s.entregar()


def sucata(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, n=9):
    """Pátio de sucata: perfis, chapas e peças fora de uso, com muro de contenção.

    O que faz funcionar é a desordem — nada alinhado, nada no mesmo ângulo.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c, l = metros(7), metros(5)
    for st in (-1, 1):
        s.caixa(f"Muro{st}", (c, metros(1.0), metros(0.3)), (0, st * l * 0.5, metros(0.5)), m["conc_dirty"], bevel=0.006)
    s.caixa("MuroF", (metros(0.3), metros(1.0), l), (-c * 0.5, 0, metros(0.5)), m["conc_dirty"], bevel=0.006)
    s.caixa("Piso", (c, metros(0.12), l), (0, 0, metros(0.06)), m["dirt"], bevel=0.004)
    for i in range(max(1, n)):
        rr = s.rnd(i * 4.3)
        r2 = s.rnd(i * 8.9)
        a = (rr - 0.5) * c * 0.8
        t = (r2 - 0.5) * l * 0.7
        tipo = i % 3
        mat = m["steel_rust"] if rr > 0.4 else m["steel"]
        if tipo == 0:
            s.caixa(f"Perfil{i}", (metros(0.16 + rr), metros(0.16), metros(2.4 + r2)), (a, t, metros(0.2 + rr * 0.5)), mat, bevel=0.003, giro=rr * math.tau)
        elif tipo == 1:
            s.caixa(f"Chapa{i}", (metros(1.6 + rr), metros(0.06), metros(1.2 + r2)), (a, t, metros(0.15 + r2 * 0.4)), mat, bevel=0.002, giro=rr * math.tau)
        else:
            s.tubo(f"Tubo{i}", metros(0.2 + rr * 0.15), metros(2.0 + r2), (a, t, metros(0.25)), mat, eixo="a", giro=rr * math.tau, verts=12)
    s.pedra("Monte", metros(1.2), (c * 0.3, 0, metros(0.4)), m["steel_rust"], (1.4, 0.6, 1.2))
    return s.entregar()


def operario(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, pose="parado"):
    """Operário de colete e capacete — a régua de escala da maquete inteira.

    `pose`: `parado`, `apontando` ou `agachado`. Uma figura humana em pose
    diferente da vizinha é o que impede a leitura de "bonequinho repetido".

    Os chanfros são deliberadamente miúdos: um braço tem 0,011 de espessura, e
    o 0,02 que estava aqui era quase o dobro da peça — o membro arredondava até
    virar cápsula e ainda pagava três segmentos de chanfro. Chanfro sempre bem
    menor que a menor dimensão da caixa.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    h = metros(1.75)
    pele, colete, calca = m["skin"], m["hi_vis"], m["mrs_b"]
    if pose == "agachado":
        s.caixa("Tronco", (metros(0.24), h * 0.3, metros(0.36)), (0, 0, h * 0.42), colete, bevel=0.005)
        for st in (-1, 1):
            s.caixa(f"Coxa{st}", (metros(0.36), metros(0.16), metros(0.15)), (metros(0.14), st * metros(0.11), h * 0.28), calca, bevel=0.003)
            s.caixa(f"Perna{st}", (metros(0.14), h * 0.26, metros(0.14)), (metros(0.28), st * metros(0.11), h * 0.14), calca, bevel=0.003)
            s.caixa(f"Braco{st}", (metros(0.12), h * 0.2, metros(0.12)), (metros(0.16), st * metros(0.2), h * 0.34), colete, bevel=0.003)
        s.bola("Cabeca", metros(0.11), (metros(0.04), 0, h * 0.6), pele, (1, 1.12, 1))
        s.tubo("Capacete", metros(0.13), metros(0.14), (metros(0.04), 0, h * 0.64), m["helmet"], verts=14, r2=metros(0.1))
        return s.entregar()
    for st in (-1, 1):
        s.caixa(f"Perna{st}", (metros(0.15), h * 0.45, metros(0.15)), (0, st * metros(0.1), h * 0.22), calca, bevel=0.003)
        s.caixa(f"Bota{st}", (metros(0.26), metros(0.1), metros(0.15)), (metros(0.04), st * metros(0.1), metros(0.05)), m["black"], bevel=0.003)
    s.caixa("Tronco", (metros(0.22), h * 0.3, metros(0.4)), (0, 0, h * 0.6), colete, bevel=0.005)
    s.caixa("Faixa", (metros(0.24), metros(0.05), metros(0.42)), (0, 0, h * 0.58), m["white"], bevel=0.005)
    if pose == "apontando":
        s.caixa("BracoD", (metros(0.4), metros(0.11), metros(0.11)), (metros(0.22), metros(0.26), h * 0.68), colete, bevel=0.003)
        s.caixa("BracoE", (metros(0.11), h * 0.28, metros(0.11)), (0, -metros(0.26), h * 0.58), colete, bevel=0.003)
    else:
        for st in (-1, 1):
            s.caixa(f"Braco{st}", (metros(0.11), h * 0.28, metros(0.11)), (0, st * metros(0.26), h * 0.58), colete, bevel=0.003)
    s.tubo("Pescoco", metros(0.055), metros(0.1), (0, 0, h * 0.78), pele, verts=10)
    s.bola("Cabeca", metros(0.105), (0, 0, h * 0.87), pele, (1, 1.15, 1))
    s.tubo("Capacete", metros(0.125), metros(0.13), (0, 0, h * 0.92), m["helmet"], verts=14, r2=metros(0.095))
    s.caixa("Aba", (metros(0.2), metros(0.02), metros(0.2)), (metros(0.07), 0, h * 0.885), m["helmet"], bevel=0.004)
    return s.entregar()
