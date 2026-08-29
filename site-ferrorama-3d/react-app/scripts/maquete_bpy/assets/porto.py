"""Família E — porto. O cais, o que atraca nele e o que carrega o navio.

Referência: `design/referencias/porto-maquete-navio.png` — a maquete de porto
fluvial com o cargueiro verde encostado, o guindaste treliçado sobre esteiras
em primeiro plano, o guindaste de torre vermelho ao fundo e a escavadeira
descarregando direto do porão.

O que essa foto ensina e o tabuleiro não tinha:

* **A treliça é a estrela.** A lança do guindaste é vazada e afinando; feita de
  caixas maciças ela fica pesada e morta.
* **A borda do cais é uma coleção de coisas pequenas** — cabeço, defensa de
  pneu, escada de marinheiro, cunhal de concreto. É essa faixa de 1 m que
  separa um cais de uma laje.
* **O navio é mais alto do que se imagina.** Casco, borda livre, castelo de
  popa com quatro andares de janelinha e a chaminé.

Convenções: ver `base.py`.
"""

from __future__ import annotations

import math

from .base import Sitio, metros


def guindaste_portico(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, vao=None, altura=None, lanca_fora=None):
    """Pórtico de cais sobre trilhos — o portêiner clássico.

    Duas pernas em A, viga-caixão no topo, lança projetando sobre a água e a
    contra-lança com contrapeso do lado de terra. Sem a contra-lança o
    guindaste parece prestes a tombar, e o olho percebe.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, amar = m["steel"], m["crane_y"]
    v = vao if vao is not None else metros(22)
    h = altura if altura is not None else metros(28)
    lf = lanca_fora if lanca_fora is not None else metros(26)
    # Bases sobre trilhos, com boggies.
    for sa in (-1, 1):
        for st in (-1, 1):
            s.caixa(f"Boggie{sa}{st}", (metros(4.0), metros(1.4), metros(1.6)), (sa * metros(6.0), st * v * 0.5, metros(0.7)), m["black"], bevel=0.008)
            for i in range(3):
                s.tubo(f"RodaP{sa}{st}{i}", metros(0.5), metros(0.5), (sa * metros(6.0) + (i - 1) * metros(1.3), st * v * 0.5, metros(0.5)), m["black"], eixo="t", verts=12)
    # Pernas em A: duas por lado, convergindo.
    for st in (-1, 1):
        for sa in (-1, 1):
            s.trelica(
                f"Perna{st}{sa}",
                (sa * metros(6.0), st * v * 0.5, metros(1.4)),
                (0, st * v * 0.5, h),
                amar, w=metros(0.5), h=metros(0.5), montantes=5, altura=metros(1.4),
            )
        s.barra(f"Trav{st}", (-metros(6), st * v * 0.5, h * 0.55), (metros(6), st * v * 0.5, h * 0.55), metros(0.4), metros(0.4), amar)
    s.barra("Portal", (0, -v * 0.5, h), (0, v * 0.5, h), metros(0.6), metros(0.8), amar)
    s.barra("PortalB", (0, -v * 0.5, metros(14)), (0, v * 0.5, metros(14)), metros(0.5), metros(0.5), amar)
    # Lança e contra-lança, treliçadas.
    for st in (-1, 1):
        s.trelica(f"Lanca{st}", (0, st * v * 0.5 * 0.6, h), (lf, st * v * 0.5 * 0.6, h - metros(1.5)), amar, w=metros(0.35), h=metros(0.35), montantes=8, altura=metros(2.2))
        s.trelica(f"Contra{st}", (0, st * v * 0.5 * 0.6, h), (-metros(14), st * v * 0.5 * 0.6, h + metros(1.0)), amar, w=metros(0.35), h=metros(0.35), montantes=5, altura=metros(2.0))
    s.caixa("Contrapeso", (metros(4.0), metros(2.6), v * 0.8), (-metros(14), 0, h + metros(1.4)), m["conc_dirty"], bevel=0.01)
    # Tirantes até o topo da torre — o triângulo que segura tudo.
    s.tubo("Torre", metros(0.5), metros(12), (0, 0, h + metros(6)), amar, verts=12)
    for st in (-1, 1):
        s.barra(f"Tirante{st}", (0, 0, h + metros(11)), (lf * 0.95, st * v * 0.5 * 0.6, h - metros(1.4)), metros(0.14), metros(0.14), aco)
        s.barra(f"TiranteC{st}", (0, 0, h + metros(11)), (-metros(13), st * v * 0.5 * 0.6, h + metros(1.0)), metros(0.14), metros(0.14), aco)
    # Carro, cabine e spreader pendurado.
    s.caixa("Carro", (metros(3.0), metros(1.4), metros(3.4)), (lf * 0.55, 0, h - metros(1.6)), aco, bevel=0.006)
    s.caixa("Cabine", (metros(2.2), metros(1.8), metros(2.0)), (lf * 0.55, -metros(2.6), h - metros(3.0)), m["glass"], bevel=0.008)
    for st in (-1, 1):
        s.barra(f"Cabo{st}", (lf * 0.55, st * metros(1.4), h - metros(2.2)), (lf * 0.55, st * metros(1.4), metros(9)), metros(0.06), metros(0.06), m["black"])
    s.caixa("Spreader", (metros(2.2), metros(0.9), metros(9.0)), (lf * 0.55, 0, metros(8.6)), amar, bevel=0.006)
    return s.entregar()


def guindaste_trelicado(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, giro=0.4, lanca=1.05, comp_lanca=None):
    """Guindaste treliçado sobre esteiras — o amarelo do primeiro plano da foto.

    A lança é montada por módulos que afinam, com quatro cordoalhas e
    diagonais em X, e a ponta tem o jib curto virado para baixo.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, amar = m["steel"], m["crane_y"]
    cl = comp_lanca if comp_lanca is not None else metros(34)
    for st in (-1, 1):
        s.caixa(f"Est{st}", (metros(8.0), metros(1.6), metros(1.8)), (0, st * metros(2.8), metros(0.8)), m["black"], bevel=0.014)
        for i in range(6):
            s.tubo(f"Rod{st}{i}", metros(0.7), metros(1.9), (-metros(3.2) + i * metros(1.3), st * metros(2.8), metros(0.75)), m["steel_rust"], eixo="t", verts=12)
    s.caixa("Plataforma", (metros(6.4), metros(1.0), metros(5.8)), (0, 0, metros(2.1)), m["steel_rust"], bevel=0.01)
    co, si = math.cos(giro), math.sin(giro)
    def g(a, t, h):
        return (a * co - t * si, a * si + t * co, h)
    s.caixa("Casa", (metros(8.0), metros(3.4), metros(4.6)), g(-metros(2.0), 0, metros(4.3)), amar, bevel=0.016)
    s.caixa("Contrapeso", (metros(2.0), metros(3.0), metros(4.6)), g(-metros(6.4), 0, metros(4.1)), m["black"], bevel=0.01)
    s.caixa("Cabine", (metros(2.6), metros(2.6), metros(2.2)), g(metros(2.4), metros(2.6), metros(4.6)), amar, bevel=0.012)
    s.caixa("Vidro", (metros(2.2), metros(1.8), metros(0.1)), g(metros(2.4), metros(3.8), metros(4.9)), m["glass"], bevel=0.003)
    # Lança em quatro cordoalhas.
    ox, oy = metros(2.4), metros(3.4)
    px, py = math.cos(lanca) * cl, math.sin(lanca) * cl
    p0 = g(ox, 0, oy)
    p1 = g(ox + px, 0, oy + py)
    larg0, larg1 = metros(1.6), metros(0.8)
    for st in (-1, 1):
        for sv in (0, 1):
            q0 = (p0[0] - si * st * larg0, p0[1] + co * st * larg0, p0[2] + sv * larg0)
            q1 = (p1[0] - si * st * larg1, p1[1] + co * st * larg1, p1[2] + sv * larg1)
            s.barra(f"Cord{st}{sv}", q0, q1, metros(0.22), metros(0.22), amar)
    n = 9
    for i in range(n):
        f0, f1 = i / n, (i + 1) / n
        for st in (-1, 1):
            l0 = larg0 + (larg1 - larg0) * f0
            l1 = larg0 + (larg1 - larg0) * f1
            a0 = (p0[0] + (p1[0] - p0[0]) * f0 - si * st * l0, p0[1] + (p1[1] - p0[1]) * f0 + co * st * l0, p0[2] + (p1[2] - p0[2]) * f0)
            a1 = (p0[0] + (p1[0] - p0[0]) * f1 - si * st * l1, p0[1] + (p1[1] - p0[1]) * f1 + co * st * l1, p0[2] + (p1[2] - p0[2]) * f1 + l1)
            s.barra(f"Dg{st}{i}", a0, a1, metros(0.13), metros(0.13), amar)
        b0 = (p0[0] + (p1[0] - p0[0]) * f0, p0[1] + (p1[1] - p0[1]) * f0, p0[2] + (p1[2] - p0[2]) * f0)
        lb = larg0 + (larg1 - larg0) * f0
        s.barra(f"Trv{i}", (b0[0] - si * lb, b0[1] + co * lb, b0[2]), (b0[0] + si * lb, b0[1] - co * lb, b0[2]), metros(0.12), metros(0.12), amar)
    # Jib de ponta e o moitão.
    jx = p1[0] + math.cos(lanca - 0.9) * metros(9) * co
    jz = p1[2] + math.sin(lanca - 0.9) * metros(9)
    jy = p1[1] + math.cos(lanca - 0.9) * metros(9) * si
    s.barra("Jib", p1, (jx, jy, jz), metros(0.5), metros(0.5), amar)
    s.barra("CaboCarga", (jx, jy, jz), (jx, jy, metros(3.0)), metros(0.07), metros(0.07), m["black"])
    s.caixa("Moitao", (metros(1.2), metros(1.8), metros(1.2)), (jx, jy, metros(2.4)), aco, bevel=0.006)
    s.barra("Estai", g(-metros(5.4), 0, metros(9.0)), (p1[0], p1[1], p1[2]), metros(0.09), metros(0.09), m["black"])
    s.trelica("Mastro", g(-metros(2.0), 0, metros(6.0)), g(-metros(4.4), 0, metros(11.0)), amar, w=metros(0.2), h=metros(0.2), montantes=3, altura=metros(0.9))
    return s.entregar()


def guindaste_torre(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, altura=None, lanca=None, cor=None):
    """Guindaste de torre — o vermelho do fundo da foto de referência.

    Mastro modular quadrado, lança horizontal com carro corrediço, contra-lança
    curta e contrapeso. É o objeto mais alto de qualquer canteiro.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    mat = cor or m["sig_r"]
    aco = m["steel"]
    h = altura if altura is not None else metros(34)
    lb = lanca if lanca is not None else metros(30)
    lado = metros(1.7)
    s.caixa("Base", (metros(6), metros(1.2), metros(6)), (0, 0, metros(0.6)), m["conc_dirty"], bevel=0.008)
    # Mastro: quatro cordoalhas com X entre módulos.
    for sa in (-1, 1):
        for st in (-1, 1):
            s.barra(f"Cord{sa}{st}", (sa * lado, st * lado, metros(1.2)), (sa * lado, st * lado, h), metros(0.2), metros(0.2), mat)
    nm = 9
    for k in range(nm):
        h0 = metros(1.2) + (h - metros(1.2)) * k / nm
        h1 = metros(1.2) + (h - metros(1.2)) * (k + 1) / nm
        cantos = [(-lado, -lado), (lado, -lado), (lado, lado), (-lado, lado), (-lado, -lado)]
        for i in range(4):
            s.barra(f"Anel{k}{i}", (cantos[i][0], cantos[i][1], h0), (cantos[i + 1][0], cantos[i + 1][1], h0), metros(0.12), metros(0.12), mat)
            s.barra(f"X{k}{i}", (cantos[i][0], cantos[i][1], h0), (cantos[i + 1][0], cantos[i + 1][1], h1), metros(0.1), metros(0.1), mat)
    # Coroa de giro, cabine e as duas lanças.
    s.caixa("Coroa", (metros(4.0), metros(2.0), metros(4.0)), (0, 0, h + metros(1.0)), mat, bevel=0.008)
    s.caixa("Cabine", (metros(2.4), metros(2.2), metros(2.2)), (metros(2.6), 0, h + metros(1.6)), m["glass"], bevel=0.008)
    s.trelica("LancaI", (metros(1.6), 0, h + metros(2.0)), (lb, 0, h + metros(2.0)), mat, w=metros(0.18), h=metros(0.18), montantes=12, altura=metros(1.8))
    for st in (-1, 1):
        s.barra(f"LancaL{st}", (metros(1.6), st * metros(0.9), h + metros(2.0)), (lb, st * metros(0.5), h + metros(2.0)), metros(0.14), metros(0.14), mat)
    s.trelica("Contra", (-metros(1.6), 0, h + metros(2.0)), (-metros(11), 0, h + metros(2.0)), mat, w=metros(0.18), h=metros(0.18), montantes=4, altura=metros(1.6))
    s.caixa("Contrapeso", (metros(2.6), metros(2.4), metros(3.4)), (-metros(10.0), 0, h + metros(2.4)), m["conc_dirty"], bevel=0.008)
    s.tubo("PicoA", metros(0.25), metros(9), (0, 0, h + metros(6.4)), mat, verts=10)
    s.barra("TiranteF", (0, 0, h + metros(10.4)), (lb * 0.92, 0, h + metros(2.4)), metros(0.08), metros(0.08), aco)
    s.barra("TiranteT", (0, 0, h + metros(10.4)), (-metros(10.4), 0, h + metros(2.4)), metros(0.08), metros(0.08), aco)
    s.caixa("Carro", (metros(1.6), metros(0.8), metros(1.4)), (lb * 0.62, 0, h + metros(1.3)), aco, bevel=0.005)
    s.barra("CaboG", (lb * 0.62, 0, h + metros(1.0)), (lb * 0.62, 0, metros(8)), metros(0.06), metros(0.06), m["black"])
    s.caixa("Gancho", (metros(0.9), metros(1.4), metros(0.9)), (lb * 0.62, 0, metros(7.2)), aco, bevel=0.005)
    return s.entregar()


def shiploader(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, alcance=None):
    """Carregador de navio — lança inclinada com correia e o tubo telescópico.

    É a máquina que explica como o minério sai da pilha e entra no porão.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, amar = m["steel"], m["crane_y"]
    al = alcance if alcance is not None else metros(30)
    h = metros(20)
    for sa in (-1, 1):
        for st in (-1, 1):
            s.caixa(f"Boggie{sa}{st}", (metros(4.0), metros(1.2), metros(1.4)), (sa * metros(5.0), st * metros(6.0), metros(0.6)), m["black"], bevel=0.006)
        s.trelica(f"Perna{sa}", (sa * metros(5.0), -metros(6.0), metros(1.2)), (sa * metros(5.0), metros(6.0), metros(1.2)), amar, w=metros(0.3), h=metros(0.3), montantes=4, altura=metros(1.2))
    for sa in (-1, 1):
        for st in (-1, 1):
            s.barra(f"Col{sa}{st}", (sa * metros(5.0), st * metros(6.0), metros(1.4)), (sa * metros(2.4), st * metros(3.0), h), metros(0.4), metros(0.4), amar)
    s.caixa("Torre", (metros(6.0), metros(4.0), metros(7.0)), (0, 0, h + metros(2.0)), amar, bevel=0.012)
    s.caixa("Cabine", (metros(2.4), metros(2.2), metros(2.2)), (metros(3.6), metros(3.4), h + metros(1.4)), m["glass"], bevel=0.008)
    # Lança projetada sobre a água, com correia e passarela.
    p0 = (metros(2.0), 0, h + metros(4.0))
    p1 = (al, 0, h - metros(2.0))
    s.trelica("Lanca", p0, p1, amar, w=metros(0.3), h=metros(0.3), montantes=9, altura=metros(2.6))
    s.barra("Correia", (p0[0], 0, p0[2] + metros(0.6)), (p1[0], 0, p1[2] + metros(0.6)), metros(2.0), metros(0.12), m["belt"])
    s.barra("Passarela", (p0[0], metros(1.8), p0[2] + metros(0.4)), (p1[0], metros(1.8), p1[2] + metros(0.4)), metros(1.0), metros(0.1), aco)
    s.trelica("Contra", (-metros(2.0), 0, h + metros(4.0)), (-metros(12), 0, h + metros(5.0)), amar, w=metros(0.28), h=metros(0.28), montantes=4, altura=metros(2.0))
    s.caixa("Contrapeso", (metros(3.0), metros(2.6), metros(5.0)), (-metros(11), 0, h + metros(5.2)), m["conc_dirty"], bevel=0.008)
    s.tubo("Pico", metros(0.35), metros(10), (0, 0, h + metros(9.0)), amar, verts=10)
    s.barra("Estai", (0, 0, h + metros(13.5)), (al * 0.92, 0, h - metros(1.6)), metros(0.09), metros(0.09), aco)
    # Tubo telescópico e a saia de descarga.
    s.tubo("Telescopio", metros(1.1), metros(8.0), (al * 0.92, 0, h - metros(6.0)), aco, verts=16)
    s.tubo("Saia", metros(1.8), metros(1.6), (al * 0.92, 0, h - metros(10.4)), m["steel_rust"], verts=16, r2=metros(1.1))
    return s.entregar()


def navio_graneleiro(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None, cor=None, poroes=4):
    """Cargueiro de granel — casco, escotilhas, castelo de popa e chaminé.

    Referência: o cargueiro verde da foto do porto. O castelo com quatro
    fileiras de janelinha é o que dá escala ao navio inteiro.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    casco = cor or m["ship"]
    aco, br = m["steel_rust"], m["white"]
    c = comp if comp is not None else metros(110)
    l = c * 0.155
    hc = metros(9)
    # Casco: corpo médio reto e as duas pontas afinando.
    s.caixa("Casco", (c * 0.72, hc, l), (0, 0, hc * 0.5), casco, bevel=0.02)
    s.perfil("Proa", [(l * 0.5, 0), (l * 0.42, hc * 0.5), (l * 0.36, hc)], (c * 0.36, 0, 0), casco, segs=4)
    s.caixa("ProaB", (c * 0.14, hc, l * 0.62), (c * 0.43, 0, hc * 0.5), casco, bevel=0.03)
    s.caixa("ProaC", (c * 0.08, hc, l * 0.2), (c * 0.51, 0, hc * 0.55), casco, bevel=0.03)
    s.caixa("Popa", (c * 0.16, hc, l * 0.9), (-c * 0.42, 0, hc * 0.5), casco, bevel=0.03)
    # Linha d'água e faixa vermelha do fundo — o navio nunca é de uma cor só.
    s.caixa("Fundo", (c * 0.9, metros(2.4), l * 1.01), (0, 0, metros(1.2)), m["sig_r"], bevel=0.01)
    s.caixa("Boot", (c * 0.9, metros(0.5), l * 1.02), (0, 0, metros(2.6)), m["black"], bevel=0.004)
    # Convés, amurada e escotilhas.
    s.caixa("Conves", (c * 0.86, metros(0.5), l * 0.96), (0, 0, hc + metros(0.25)), aco, bevel=0.008)
    for st in (-1, 1):
        s.caixa(f"Amurada{st}", (c * 0.86, metros(1.4), metros(0.4)), (0, st * l * 0.48, hc + metros(0.7)), casco, bevel=0.006)
    for i in range(max(1, poroes)):
        a = -c * 0.28 + c * 0.56 * (i + 0.5) / poroes
        s.caixa(f"Escotilha{i}", (c * 0.1, metros(1.6), l * 0.6), (a, 0, hc + metros(1.3)), aco, bevel=0.008)
        s.caixa(f"Tampa{i}", (c * 0.095, metros(0.3), l * 0.56), (a, 0, hc + metros(2.2)), m["steel_y"], bevel=0.004)
        for st in (-1, 1):
            s.tubo(f"Guincho{i}{st}", metros(0.7), metros(1.4), (a - c * 0.05, st * l * 0.35, hc + metros(1.2)), aco, eixo="t", verts=12)
    # Castelo de popa: cinco andares, janelas, ponte e chaminé.
    cx = -c * 0.36
    for k in range(4):
        w = l * (0.72 - k * 0.04)
        s.caixa(f"Castelo{k}", (metros(11), metros(3.0), w), (cx, 0, hc + metros(2.0) + k * metros(3.0)), br, bevel=0.01)
        for st in (-1, 1):
            s.janelas(f"CastJ{k}{st}", m["janela"], 5, cx - metros(4.4), cx + metros(4.4), st * (w * 0.5 + metros(0.05)), hc + metros(2.6) + k * metros(3.0), larg=metros(1.0), alt=metros(0.9))
    s.caixa("Ponte", (metros(9), metros(2.8), l * 0.86), (cx, 0, hc + metros(15.4)), br, bevel=0.01)
    for st in (-1, 1):
        s.caixa(f"PonteV{st}", (metros(8.0), metros(1.4), metros(0.12)), (cx, st * l * 0.43, hc + metros(15.8)), m["glass"], bevel=0.003)
    s.caixa("PonteF", (metros(0.12), metros(1.4), l * 0.8), (cx + metros(4.5), 0, hc + metros(15.8)), m["glass"], bevel=0.003)
    s.caixa("Aleta", (metros(2.0), metros(1.0), l * 1.06), (cx, 0, hc + metros(16.4)), br, bevel=0.006)
    s.caixa("Chamine", (metros(5.0), metros(6.0), l * 0.34), (cx - metros(5.0), 0, hc + metros(20.0)), casco, bevel=0.012)
    s.caixa("ChamineTopo", (metros(5.2), metros(0.8), l * 0.36), (cx - metros(5.0), 0, hc + metros(23.2)), m["black"], bevel=0.006)
    s.tubo("Mastro", metros(0.22), metros(9), (cx + metros(4.0), 0, hc + metros(21.0)), aco, verts=10)
    s.bola("LuzMastro", metros(0.3), (cx + metros(4.0), 0, hc + metros(25.6)), m["amber"], segs=10)
    # Proa: guindaste de âncora e o mastro de vante.
    s.tubo("MastroVante", metros(0.24), metros(11), (c * 0.4, 0, hc + metros(6.0)), br, verts=10)
    for st in (-1, 1):
        s.tubo(f"Ancora{st}", metros(0.9), metros(0.6), (c * 0.46, st * l * 0.38, hc - metros(3.0)), m["black"], eixo="t", verts=12)
    return s.entregar()


def barcaca(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None, carga=True):
    """Barcaça de granel — casco-caixa raso, aberto, sem propulsão.

    Ela existe para contar que ali há navegação de rio: é rebocada, não anda.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco = m["steel_rust"]
    c = comp if comp is not None else metros(50)
    l = c * 0.24
    h = metros(4.4)
    s.caixa("Casco", (c * 0.86, h, l), (0, 0, h * 0.5), aco, bevel=0.014)
    s.perfil("Proa", [(l * 0.5, 0), (l * 0.44, h * 0.6), (l * 0.3, h)], (c * 0.43, 0, 0), aco, segs=4)
    s.perfil("Popa", [(l * 0.5, 0), (l * 0.44, h * 0.6), (l * 0.3, h)], (-c * 0.43, 0, 0), aco, segs=4)
    s.caixa("Fundo", (c * 0.9, metros(1.2), l * 1.01), (0, 0, metros(0.6)), m["black"], bevel=0.006)
    for st in (-1, 1):
        s.caixa(f"Borda{st}", (c * 0.9, metros(1.0), metros(0.5)), (0, st * l * 0.5, h + metros(0.4)), aco, bevel=0.005)
        for i in range(7):
            s.caixa(f"Nerv{st}{i}", (metros(0.3), h * 0.8, metros(0.3)), (-c * 0.36 + i * c * 0.12, st * (l * 0.5 + metros(0.15)), h * 0.5), aco, bevel=0.004)
    s.caixa("Poroao", (c * 0.78, metros(0.3), l * 0.78), (0, 0, metros(1.6)), m["black"], bevel=0.006)
    if carga:
        for i in range(6):
            rr = s.rnd(i * 2.9)
            s.pedra(f"Carga{i}", l * (0.16 + rr * 0.07), (-c * 0.3 + i * c * 0.12, (rr - 0.5) * l * 0.4, metros(3.0)), m["ore"], (1.6, 0.5, 1.2))
    for sa in (-1, 1):
        for st in (-1, 1):
            s.tubo(f"Cabeco{sa}{st}", metros(0.45), metros(1.2), (sa * c * 0.38, st * l * 0.42, h + metros(0.9)), m["black"], verts=12)
    return s.entregar()


def rebocador(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0):
    """Rebocador — pequeno, alto e atarracado, com a cinta de pneus na proa.

    O contraste de proporção com o cargueiro é o que faz os dois parecerem
    grandes; um navio sozinho não tem com o que ser comparado.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    casco, br = m["ship"], m["white"]
    c, l, h = metros(26), metros(9), metros(4.6)
    s.caixa("Casco", (c * 0.78, h, l), (0, 0, h * 0.5), casco, bevel=0.016)
    s.perfil("Proa", [(l * 0.5, 0), (l * 0.46, h * 0.55), (l * 0.3, h + metros(0.8))], (c * 0.39, 0, 0), casco, segs=5)
    s.perfil("Popa", [(l * 0.5, 0), (l * 0.44, h * 0.6), (l * 0.36, h)], (-c * 0.39, 0, 0), casco, segs=5)
    s.caixa("Fundo", (c * 0.85, metros(1.6), l * 1.01), (0, 0, metros(0.8)), m["sig_r"], bevel=0.008)
    s.caixa("Conves", (c * 0.82, metros(0.35), l * 0.96), (0, 0, h + metros(0.15)), m["steel_rust"], bevel=0.006)
    s.caixa("Superestrutura", (c * 0.44, metros(3.2), l * 0.72), (-c * 0.04, 0, h + metros(1.9)), br, bevel=0.012)
    for st in (-1, 1):
        s.janelas(f"Jan{st}", m["janela"], 4, -c * 0.16, c * 0.08, st * (l * 0.36 + metros(0.05)), h + metros(2.2), larg=metros(1.0), alt=metros(0.9))
    s.caixa("Timoneira", (c * 0.24, metros(2.6), l * 0.56), (-c * 0.02, 0, h + metros(4.8)), br, bevel=0.01)
    for st in (-1, 1):
        s.caixa(f"VidroT{st}", (c * 0.22, metros(1.4), metros(0.1)), (-c * 0.02, st * (l * 0.28 + metros(0.04)), h + metros(5.1)), m["glass"], bevel=0.003)
    s.caixa("VidroF", (metros(0.1), metros(1.4), l * 0.5), (c * 0.1, 0, h + metros(5.1)), m["glass"], bevel=0.003)
    s.caixa("Teto", (c * 0.26, metros(0.3), l * 0.6), (-c * 0.02, 0, h + metros(6.2)), br, bevel=0.005)
    s.caixa("Chamine", (metros(2.2), metros(3.0), metros(2.6)), (-c * 0.24, 0, h + metros(4.6)), casco, bevel=0.01)
    s.tubo("Mastro", metros(0.16), metros(6.0), (-c * 0.02, 0, h + metros(9.4)), br, verts=10)
    s.bola("LuzNav", metros(0.24), (-c * 0.02, 0, h + metros(12.5)), m["amber"], segs=10)
    # A cinta de defensas de pneu, que é a marca registrada do rebocador.
    for i in range(9):
        f = i / 8
        a = c * 0.39 - c * 0.78 * f
        for st in (-1, 1):
            s.tubo(f"Pneu{i}{st}", metros(0.7), metros(0.5), (a, st * (l * 0.5 + metros(0.4)), h - metros(0.8)), m["rubber"], eixo="t", verts=12)
    s.tubo("PneuProa", metros(0.9), metros(0.6), (c * 0.42, 0, h - metros(0.6)), m["rubber"], eixo="t", verts=14)
    s.tubo("Cabresto", metros(0.6), metros(1.4), (-c * 0.3, 0, h + metros(0.9)), m["steel_rust"], verts=12)
    return s.entregar()


def cabeco_defensa(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, defensas=3):
    """Módulo de borda de cais: cabeço de amarração, defensas e escada.

    É o metro de borda que separa um cais de uma calçada. Repita ao longo do
    alinhamento do cais em vez de fazer uma peça só comprida.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco = m["steel_rust"]
    s.caixa("Cunhal", (metros(8.0), metros(0.5), metros(1.2)), (0, -metros(0.6), metros(0.25)), m["conc_dirty"], bevel=0.005)
    s.caixa("Faixa", (metros(8.0), metros(0.06), metros(0.4)), (0, -metros(1.0), metros(0.53)), m["paint"], bevel=0.002)
    s.perfil("Cabeco", [(metros(0.75), 0), (metros(0.6), metros(0.9)), (metros(0.8), metros(1.2)), (metros(0.5), metros(1.35))], (0, metros(0.4), 0), m["black"], segs=16)
    for i in range(max(1, defensas)):
        a = -metros(2.6) + i * metros(2.6)
        for k in range(2):
            s.tubo(f"Pneu{i}{k}", metros(0.75), metros(0.4), (a, -metros(1.35), -metros(0.9) - k * metros(1.4)), m["rubber"], eixo="t", verts=14)
        s.barra(f"Corrente{i}", (a, -metros(1.2), metros(0.2)), (a, -metros(1.35), -metros(0.7)), metros(0.06), metros(0.06), aco)
    # Escada de marinheiro descendo para a água.
    s.barra("EscL0", (metros(3.4), -metros(1.25), metros(0.4)), (metros(3.4), -metros(1.25), -metros(3.2)), metros(0.06), metros(0.06), aco)
    s.barra("EscL1", (metros(3.9), -metros(1.25), metros(0.4)), (metros(3.9), -metros(1.25), -metros(3.2)), metros(0.06), metros(0.06), aco)
    for i in range(7):
        hy = metros(0.2) - i * metros(0.5)
        s.barra(f"EscD{i}", (metros(3.4), -metros(1.25), hy), (metros(3.9), -metros(1.25), hy), metros(0.05), metros(0.05), aco)
    s.tubo("Boia", metros(0.45), metros(0.16), (-metros(3.4), -metros(1.1), metros(0.9)), m["sig_r"], eixo="a", verts=14)
    return s.entregar()


def conteiner(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, cor=None, pes=40, portas=True):
    """Contêiner marítimo — corrugado, com cantoneiras e portas na testeira.

    A corrugação é o item indispensável: uma caixa lisa colorida não passa por
    contêiner em nenhuma distância.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    paleta = m.get("cont") or [m["white"]]
    mat = cor if cor is not None else paleta[int(s.rnd(1.7) * len(paleta)) % len(paleta)]
    c = metros(12.2) if pes >= 40 else metros(6.1)
    l, h = metros(2.44), metros(2.59)
    s.caixa("Corpo", (c, h, l), (0, 0, h * 0.5), mat, bevel=0.004)
    # Corrugação: nervuras verticais nos dois lados.
    n = int(c / metros(0.3))
    for i in range(n):
        a = -c * 0.5 + c * (i + 0.5) / n
        for st in (-1, 1):
            s.caixa(f"Corr{i}{st}", (metros(0.16), h * 0.88, metros(0.06)), (a, st * (l * 0.5 + metros(0.03)), h * 0.5), mat, bevel=0.001)
    # Cantoneiras nos oito vértices — o detalhe que dá peso ao objeto.
    for sa in (-1, 1):
        for st in (-1, 1):
            for sv, hy in ((0, metros(0.16)), (1, h - metros(0.16))):
                s.caixa(f"Cant{sa}{st}{sv}", (metros(0.34), metros(0.32), metros(0.34)), (sa * (c * 0.5 - metros(0.17)), st * (l * 0.5 - metros(0.17)), hy), m["steel_rust"], bevel=0.002)
    s.caixa("Teto", (c, metros(0.06), l), (0, 0, h), m["steel_rust"], bevel=0.002)
    if portas:
        s.caixa("PortaA", (metros(0.08), h * 0.9, l * 0.46), (c * 0.5 + metros(0.04), -l * 0.24, h * 0.5), mat, bevel=0.002)
        s.caixa("PortaB", (metros(0.08), h * 0.9, l * 0.46), (c * 0.5 + metros(0.04), l * 0.24, h * 0.5), mat, bevel=0.002)
        for k, t in enumerate((-l * 0.4, -l * 0.1, l * 0.1, l * 0.4)):
            s.tubo(f"Barra{k}", metros(0.05), h * 0.86, (c * 0.5 + metros(0.09), t, h * 0.5), m["steel_rust"], verts=8)
    return s.entregar()


def pilha_conteiner(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, colunas=4, alturas=3):
    """Bloco de contêineres empilhados — o padrão do pátio de um terminal.

    As alturas irregulares e a cor sorteada por posição são o que fazem o
    conjunto parecer um pátio operando em vez de uma prateleira.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    paleta = m.get("cont") or [m["white"]]
    c, l, h = metros(12.2), metros(2.44), metros(2.59)
    for i in range(colunas):
        alt = 1 + int(s.rnd(i * 3.3) * alturas)
        for k in range(alt):
            mat = paleta[int(s.rnd(i * 7.1 + k * 2.9) * len(paleta)) % len(paleta)]
            t = -colunas * l * 0.5 + l * (i + 0.5) + (s.rnd(i + k) - 0.5) * metros(0.12)
            s.caixa(f"Cnt{i}{k}", (c, h * 0.97, l * 0.97), (0, t, h * (k + 0.5)), mat, bevel=0.004)
            for sa in (-1, 1):
                s.caixa(f"Cant{i}{k}{sa}", (metros(0.3), h * 0.99, metros(0.3)), (sa * (c * 0.5 - metros(0.15)), t, h * (k + 0.5)), m["steel_rust"], bevel=0.002)
            nn = 12
            for j in range(nn):
                s.caixa(f"Corr{i}{k}{j}", (metros(0.14), h * 0.82, metros(0.05)), (-c * 0.44 + c * 0.88 * j / (nn - 1), t - l * 0.5, h * (k + 0.5)), mat, bevel=0.001)
    return s.entregar()


def armazem_cais(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None):
    """Armazém de cais — aberto para a água, fechado para terra.

    Pilar aparente, cobertura em duas águas rasa e a boca contínua virada para
    o navio, que é como um armazém portuário realmente funciona.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c = comp if comp is not None else metros(44)
    l, h = metros(18), metros(9)
    s.caixa("Piso", (c + metros(2), metros(0.4), l + metros(2)), (0, 0, metros(0.2)), m["conc_dirty"], bevel=0.006)
    n = max(4, int(c / metros(7)))
    for i in range(n + 1):
        a = -c * 0.5 + c * i / n
        s.caixa(f"Pilar{i}", (metros(0.7), h, metros(0.7)), (a, -l * 0.5, metros(0.4) + h * 0.5), m["conc_dirty"], bevel=0.006)
        s.caixa(f"PilarF{i}", (metros(0.7), h, metros(0.7)), (a, l * 0.5, metros(0.4) + h * 0.5), m["conc_dirty"], bevel=0.006)
    s.caixa("Fundo", (c, h, metros(0.35)), (0, l * 0.5, metros(0.4) + h * 0.5), m["white"], bevel=0.008)
    for sa in (-1, 1):
        s.caixa(f"Oitao{sa}", (metros(0.35), h, l), (sa * c * 0.5, 0, metros(0.4) + h * 0.5), m["white"], bevel=0.008)
        s.frontao(f"Frt{sa}", l, metros(0.4) + h, metros(0.4) + h + metros(2.4), m["white"], sa * c * 0.5)
    s.caixa("Viga", (c + metros(1), metros(0.9), metros(0.6)), (0, -l * 0.5, metros(0.4) + h + metros(0.3)), m["conc_dirty"], bevel=0.006)
    s.telhado_duas_aguas("Telh", c + metros(1.6), l, metros(0.4) + h, metros(0.4) + h + metros(2.4), m["roof"], espessura=metros(0.25), beiral=metros(1.2))
    s.janelas("Jan", m["janela"], n, -c * 0.44, c * 0.44, l * 0.5 + metros(0.2), metros(0.4) + h - metros(1.6), larg=metros(2.2), alt=metros(1.4))
    for i in range(3):
        s.caixa(f"Porta{i}", (metros(4.0), metros(4.4), metros(0.16)), (-c * 0.3 + i * c * 0.3, l * 0.5 + metros(0.2), metros(2.6)), m["steel_y"], bevel=0.005)
    return s.entregar()
