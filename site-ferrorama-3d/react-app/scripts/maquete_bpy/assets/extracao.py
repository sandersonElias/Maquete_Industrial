"""Família A — extração. O que arranca o minério da rocha e o tira da cava.

Referências: `design/referencias/mina-cava-ferromodelismo.png` (a cava em
bancadas com pá de cabo azul, escavadeira hidráulica amarela e caminhões
fora-de-estrada) e `design/referencias/mina-operacao-aerea.png` (a operação
vista de cima, dominada pela torre de extração e pelos montes de estéril).

Duas coisas que essas fotos ensinam e que o tabuleiro não tinha:

* **A máquina se relaciona com o terreno.** Na foto a esteira da escavadeira
  está *dentro* do talude, a caçamba encosta na bancada, o caminhão está no
  piso da praça. Máquina pousada em cima do gramado lê como brinquedo. Por isso
  todo asset daqui nasce com a base em `altura = 0` e cabe ao chamador colocá-lo
  na cota certa do terreno.
* **A silhueta é articulada.** Lança, braço e caçamba em ângulos diferentes é o
  que faz uma escavadeira parecer escavadeira. Os parâmetros de ângulo são
  argumentos, não constantes, justamente para que duas instâncias vizinhas não
  saiam idênticas.

Convenções: ver `base.py`.
"""

from __future__ import annotations

import math

from .base import Sitio, metros


def torre_extracao(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, altura=None):
    """Torre de extração (headframe) — o marco vertical da mina.

    É o objeto que domina a foto aérea de referência e o que faltava para a
    mina ter um horizonte próprio. Quatro pernas inclinadas, poço enclausurado,
    duas polias de cabo no topo e a casa do guincho encostada na base.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, amar = m["steel"], m["steel_y"]
    h = altura if altura is not None else metros(26)
    meia = metros(3.2)
    # Poço: caixa fechada na base, por onde sai a gaiola.
    s.caixa("Poco", (meia * 2.1, h * 0.26, meia * 2.1), (0, 0, h * 0.13), m["conc_dirty"], bevel=0.01)
    # Quatro pernas convergindo — a inclinação é a assinatura do headframe.
    topo = meia * 0.42
    for ia, sa in enumerate((-1, 1)):
        for it, st in enumerate((-1, 1)):
            s.barra(
                f"Perna{ia}{it}",
                (sa * meia, st * meia, h * 0.2),
                (sa * topo, st * topo, h),
                metros(0.55), metros(0.55), amar,
            )
    # Amarração horizontal e diagonais: sem elas a torre lê como quatro postes.
    for k in range(5):
        f = 0.25 + k * 0.18
        r = meia + (topo - meia) * ((f * h - h * 0.2) / (h * 0.8))
        hy = h * f
        cantos = [(-r, -r), (r, -r), (r, r), (-r, r), (-r, -r)]
        for i in range(4):
            s.barra(f"Anel{k}_{i}", (cantos[i][0], cantos[i][1], hy), (cantos[i + 1][0], cantos[i + 1][1], hy), metros(0.3), metros(0.3), amar)
            if k < 4:
                r2 = meia + (topo - meia) * (((f + 0.18) * h - h * 0.2) / (h * 0.8))
                p2 = [(-r2, -r2), (r2, -r2), (r2, r2), (-r2, r2), (-r2, -r2)]
                s.barra(f"Dg{k}_{i}", (cantos[i][0], cantos[i][1], hy), (p2[i + 1][0], p2[i + 1][1], h * (f + 0.18)), metros(0.22), metros(0.22), amar)
    # Estrutura de contraventamento inclinada — o "pé" traseiro que segura o
    # esforço do cabo. Sem ele a torre não fica de pé nem visualmente.
    for st in (-1, 1):
        s.barra(f"Escora{st}", (meia * 2.6, st * meia * 0.8, 0), (topo * 0.4, st * topo, h * 0.9), metros(0.5), metros(0.5), amar)
    s.barra("EscoraTrav", (meia * 2.6, -meia * 0.8, metros(3)), (meia * 2.6, meia * 0.8, metros(3)), metros(0.3), metros(0.3), amar)
    # Polias de cabo: duas, lado a lado, no topo. É delas que se reconhece um
    # headframe a duzentos metros.
    for i, st in enumerate((-1, 1)):
        s.tubo(f"Polia{i}", metros(2.6), metros(0.4), (0, st * metros(1.1), h - metros(2.4)), aco, eixo="t", verts=24)
        s.tubo(f"PoliaCubo{i}", metros(0.6), metros(0.7), (0, st * metros(1.1), h - metros(2.4)), m["steel_rust"], eixo="t", verts=12)
    s.barra("Eixo", (0, -metros(2), h - metros(2.4)), (0, metros(2), h - metros(2.4)), metros(0.3), metros(0.3), aco)
    # Cabo indo do topo até a casa do guincho.
    s.barra("Cabo", (0, 0, h - metros(3.4)), (meia * 3.4, 0, metros(3.2)), metros(0.12), metros(0.12), m["black"])
    # Casa do guincho.
    s.caixa("Guincho", (metros(9), metros(4.2), metros(7)), (meia * 4.2, 0, metros(2.1)), m["white"], bevel=0.012)
    s.telhado_duas_aguas("GuinchoT", metros(9.4), metros(7), metros(4.2), metros(5.4), m["roof"])
    s.janelas("GuinchoJ", m["janela"], 3, meia * 4.2 - metros(3), meia * 4.2 + metros(3), metros(3.5), metros(2.4), larg=metros(1.4), alt=metros(1.2))
    s.escada_gato("Esc", meia * 0.9, meia * 0.9, metros(2), h * 0.9, aco)
    return s.entregar()


def escavadeira_cabo(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, giro=0.5, lanca=0.9):
    """Pá mecânica de cabo sobre esteiras — a máquina azul da foto da cava.

    `giro` gira a casa sobre a base (é o que dá vida a duas unidades vizinhas)
    e `lanca` é a inclinação da lança em radianos.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    azul, aco = m["shovel_b"], m["steel"]
    # Esteiras: largas e baixas, porque a máquina é pesadíssima.
    for st in (-1, 1):
        s.caixa(f"Est{st}", (metros(7.4), metros(1.8), metros(2.0)), (0, st * metros(2.6), metros(0.9)), m["black"], bevel=0.02)
        for i in range(6):
            s.tubo(f"Rod{st}{i}", metros(0.85), metros(2.1), (-metros(3) + i * metros(1.2), st * metros(2.6), metros(0.85)), m["steel_rust"], eixo="t", verts=12)
    s.caixa("Base", (metros(6.2), metros(1.1), metros(6.0)), (0, 0, metros(2.3)), m["steel_rust"], bevel=0.012)
    # Casa giratória.
    co, si = math.cos(giro), math.sin(giro)
    def g(a, t, h):
        return (a * co - t * si, a * si + t * co, h)
    s.caixa("Casa", (metros(8.4), metros(4.6), metros(5.2)), g(-metros(1.2), 0, metros(5.2)), azul, bevel=0.02, giro=giro)
    s.caixa("Cabine", (metros(3.0), metros(2.8), metros(2.6)), g(metros(3.2), metros(2.0), metros(5.6)), azul, bevel=0.02, giro=giro)
    s.caixa("Vidro", (metros(2.6), metros(1.8), metros(0.1)), g(metros(3.2), metros(3.3), metros(6.0)), m["glass"], bevel=0.004, giro=giro)
    s.caixa("Contrapeso", (metros(2.2), metros(2.6), metros(5.0)), g(-metros(5.6), 0, metros(5.0)), m["steel_rust"], bevel=0.012, giro=giro)
    # Lança treliçada e braço da caçamba.
    comp = metros(16)
    px, pz = math.cos(lanca) * comp, math.sin(lanca) * comp
    p0 = g(metros(2.6), 0, metros(4.4))
    p1 = g(metros(2.6) + px, 0, metros(4.4) + pz)
    for st in (-1, 1):
        s.barra(f"Lanca{st}", (p0[0], p0[1] + st * metros(1.0), p0[2]), (p1[0], p1[1] + st * metros(0.7), p1[2]), metros(0.5), metros(0.5), azul)
    for i in range(5):
        f0, f1 = i / 5, (i + 1) / 5
        a0 = (p0[0] + (p1[0] - p0[0]) * f0, p0[1] - metros(1.0), p0[2] + (p1[2] - p0[2]) * f0)
        a1 = (p0[0] + (p1[0] - p0[0]) * f1, p0[1] + metros(1.0), p0[2] + (p1[2] - p0[2]) * f1)
        s.barra(f"LancaX{i}", a0, a1, metros(0.25), metros(0.25), azul)
    # Braço deslizante e caçamba de arrasto, encostando no talude.
    bx, bz = p1[0] - metros(2.5), p1[2] - metros(9)
    s.barra("Braco", (p1[0] - metros(7), p1[1], p1[2] - metros(2)), (bx + metros(1.2), 0, bz + metros(2)), metros(0.7), metros(0.7), aco)
    s.caixa("Cacamba", (metros(3.6), metros(3.2), metros(3.4)), (bx, 0, bz), m["steel_rust"], bevel=0.016)
    for i in range(4):
        s.caixa(f"Dente{i}", (metros(0.9), metros(0.4), metros(0.5)), (bx + metros(2.0), -metros(1.2) + i * metros(0.8), bz - metros(1.5)), aco, bevel=0.004)
    s.barra("CaboIcamento", (p1[0], p1[1], p1[2]), (bx, 0, bz + metros(1.8)), metros(0.14), metros(0.14), m["black"])
    return s.entregar()


def escavadeira_hidraulica(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, giro=-0.4, lanca=0.85, braco=-0.9):
    """Escavadeira hidráulica sobre esteiras — a amarela da foto da cava.

    Diferente da pá de cabo: lança maciça em vez de treliça, e a articulação
    lança-braço-caçamba é o que a identifica de longe.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    am, aco = m["cat"], m["steel"]
    for st in (-1, 1):
        s.caixa(f"Est{st}", (metros(5.6), metros(1.5), metros(1.4)), (0, st * metros(1.8), metros(0.75)), m["black"], bevel=0.016)
        for i in range(5):
            s.tubo(f"Rod{st}{i}", metros(0.6), metros(1.5), (-metros(2.1) + i * metros(1.05), st * metros(1.8), metros(0.7)), m["steel_rust"], eixo="t", verts=12)
    s.caixa("Giro", (metros(3.2), metros(0.7), metros(3.2)), (0, 0, metros(1.8)), m["steel_rust"], bevel=0.01)
    co, si = math.cos(giro), math.sin(giro)
    def g(a, t, h):
        return (a * co - t * si, a * si + t * co, h)
    s.caixa("Casa", (metros(5.0), metros(2.4), metros(3.0)), g(-metros(1.0), 0, metros(3.3)), am, bevel=0.018)
    s.caixa("Capo", (metros(2.4), metros(1.0), metros(2.8)), g(-metros(2.6), 0, metros(4.9)), am, bevel=0.012)
    s.caixa("Cabine", (metros(1.9), metros(2.4), metros(1.6)), g(metros(1.3), metros(1.1), metros(3.8)), am, bevel=0.014)
    s.caixa("Vidro", (metros(1.5), metros(1.6), metros(0.08)), g(metros(1.3), metros(1.95), metros(4.0)), m["glass"], bevel=0.003)
    # Lança, braço e caçamba articulados.
    o = g(metros(2.2), -metros(0.6), metros(3.0))
    l1 = metros(6.4)
    p1 = (o[0] + math.cos(lanca) * l1 * co, o[1] + math.cos(lanca) * l1 * si, o[2] + math.sin(lanca) * l1)
    s.barra("Lanca", o, p1, metros(0.9), metros(1.1), am)
    l2 = metros(4.6)
    p2 = (p1[0] + math.cos(braco) * l2 * co, p1[1] + math.cos(braco) * l2 * si, p1[2] + math.sin(braco) * l2)
    s.barra("Braco", p1, p2, metros(0.7), metros(0.8), am)
    s.barra("Cilindro", (o[0] - metros(0.4), o[1], o[2] + metros(1.2)), ((o[0] + p1[0]) * 0.5, (o[1] + p1[1]) * 0.5, (o[2] + p1[2]) * 0.5), metros(0.34), metros(0.34), aco)
    s.barra("Cilindro2", (p1[0], p1[1], p1[2] + metros(0.8)), ((p1[0] + p2[0]) * 0.5, (p1[1] + p2[1]) * 0.5, (p1[2] + p2[2]) * 0.5), metros(0.28), metros(0.28), aco)
    s.caixa("Cacamba", (metros(1.9), metros(1.7), metros(1.9)), (p2[0], p2[1], p2[2] - metros(0.7)), m["steel_rust"], bevel=0.01)
    for i in range(4):
        s.caixa(f"Dente{i}", (metros(0.6), metros(0.25), metros(0.3)), (p2[0] + metros(1.0), p2[1] - metros(0.7) + i * metros(0.45), p2[2] - metros(1.4)), aco, bevel=0.003)
    return s.entregar()


def caminhao_fora_estrada(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, basculando=0.0, carga=True):
    """Caminhão fora-de-estrada rígido — os amarelos da praça da cava.

    `basculando` levanta a caçamba (em radianos): um deles despejando é o que
    conta a história do ciclo de transporte.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    am = m["volvo"]
    r = metros(1.5)
    # Chassi e rodas: duas na frente, quatro atrás (rodado duplo).
    s.caixa("Chassi", (metros(9.5), metros(1.2), metros(4.2)), (0, 0, r * 1.1), m["steel_rust"], bevel=0.012)
    for a, pares in ((metros(3.0), (0,)), (-metros(2.6), (-1, 1))):
        for st in (-1, 1):
            for k in pares:
                s.tubo(f"Roda{a:.0f}{st}{k}", r, metros(1.1), (a, st * (metros(2.2) + k * metros(0.6)), r), m["rubber"], eixo="t", verts=18)
                s.tubo(f"Aro{a:.0f}{st}{k}", r * 0.45, metros(1.18), (a, st * (metros(2.2) + k * metros(0.6)), r), m["steel"], eixo="t", verts=12)
    # Cabine deslocada para a esquerda, como no caminhão real.
    s.caixa("Cabine", (metros(2.4), metros(2.4), metros(2.2)), (metros(3.4), metros(1.2), r * 1.1 + metros(2.0)), am, bevel=0.016)
    s.caixa("Vidro", (metros(0.1), metros(1.4), metros(2.0)), (metros(4.6), metros(1.2), r * 1.1 + metros(2.3)), m["glass"], bevel=0.003)
    s.caixa("Grade", (metros(0.5), metros(1.6), metros(4.0)), (metros(4.7), 0, r * 1.1 + metros(0.8)), am, bevel=0.01)
    s.caixa("Escada", (metros(0.2), metros(2.6), metros(0.7)), (metros(3.9), metros(2.4), r * 1.1 + metros(1.2)), m["steel"], bevel=0.004)
    # Caçamba: fundo inclinado e aba sobre a cabine, como nos caminhões de mina.
    inc = basculando
    cx = -metros(0.6) + math.sin(inc) * metros(2.0)
    cy = r * 1.1 + metros(1.4) + math.sin(inc) * metros(2.6)
    s.caixa("Cacamba", (metros(9.0), metros(0.5), metros(4.6)), (cx, 0, cy), am, bevel=0.012, giro=0.0)
    for st in (-1, 1):
        s.caixa(f"CacambaL{st}", (metros(9.0), metros(2.2), metros(0.3)), (cx, st * metros(2.3), cy + metros(1.1)), am, bevel=0.01)
    s.caixa("CacambaF", (metros(0.35), metros(3.0), metros(4.6)), (cx - metros(4.4), 0, cy + metros(1.5)), am, bevel=0.01)
    s.caixa("Aba", (metros(2.8), metros(0.35), metros(4.6)), (cx + metros(5.6), 0, cy + metros(2.6)), am, bevel=0.01)
    if carga and basculando < 0.15:
        for i in range(5):
            rr = s.rnd(i * 3.1)
            s.pedra(f"Carga{i}", metros(1.4 + rr * 0.7), (cx - metros(3) + i * metros(1.8), (rr - 0.5) * metros(1.6), cy + metros(1.3)), m["ore"], (1.3, 0.5, 1.2))
    return s.entregar()


def caminhao_articulado(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, dobra=0.25):
    """Caminhão articulado 6x6 — dobra no meio, o que o distingue do rígido."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    am = m["volvo"]
    r = metros(1.0)
    s.caixa("Cabine", (metros(3.2), metros(2.6), metros(2.9)), (metros(3.0), 0, r + metros(1.9)), am, bevel=0.016)
    s.caixa("Vidro", (metros(0.1), metros(1.5), metros(2.5)), (metros(4.5), 0, r + metros(2.3)), m["glass"], bevel=0.003)
    s.caixa("Capo", (metros(1.6), metros(1.2), metros(2.7)), (metros(5.2), 0, r + metros(1.0)), am, bevel=0.012)
    s.tubo("Junta", metros(0.5), metros(1.6), (metros(1.0), 0, r + metros(0.5)), m["steel_rust"], verts=12)
    co, si = math.cos(dobra), math.sin(dobra)
    def g(a, t, h):
        da, dt = a - metros(1.0), t
        return (metros(1.0) + da * co - dt * si, da * si + dt * co, h)
    s.caixa("Chassi", (metros(6.4), metros(0.7), metros(2.8)), g(-metros(2.2), 0, r + metros(0.3)), m["black"], bevel=0.008)
    cx = g(-metros(2.2), 0, r + metros(1.8))
    s.caixa("Cacamba", (metros(6.6), metros(0.4), metros(3.1)), cx, am, bevel=0.01, giro=dobra)
    for st in (-1, 1):
        s.caixa(f"CacL{st}", (metros(6.6), metros(1.5), metros(0.25)), g(-metros(2.2), st * metros(1.5), r + metros(2.5)), am, bevel=0.008, giro=dobra)
    s.caixa("CacF", (metros(0.3), metros(2.0), metros(3.1)), g(-metros(5.4), 0, r + metros(2.7)), am, bevel=0.008, giro=dobra)
    for st in (-1, 1):
        s.tubo(f"RodaF{st}", r, metros(0.8), (metros(3.4), st * metros(1.5), r), m["rubber"], eixo="t", verts=16)
        for k, a in enumerate((-metros(1.4), -metros(3.4))):
            p = g(a, st * metros(1.5), r)
            s.tubo(f"RodaT{st}{k}", r, metros(0.8), p, m["rubber"], eixo="t", giro=dobra, verts=16)
    for i in range(4):
        rr = s.rnd(i * 5.7)
        p = g(-metros(4.2) + i * metros(1.4), (rr - 0.5) * metros(1.0), r + metros(2.4))
        s.pedra(f"Carga{i}", metros(1.0 + rr * 0.5), p, m["ore"], (1.2, 0.5, 1.1))
    return s.entregar()


def perfuratriz(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, torre_deitada=False):
    """Perfuratriz de bancada — abre os furos de fogo no topo do talude.

    A torre vertical é o traço reconhecível; quando desloca, ela deita.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    am, aco = m["cat"], m["steel"]
    for st in (-1, 1):
        s.caixa(f"Est{st}", (metros(5.0), metros(1.3), metros(1.2)), (0, st * metros(1.6), metros(0.65)), m["black"], bevel=0.014)
    s.caixa("Chassi", (metros(5.4), metros(1.6), metros(3.4)), (0, 0, metros(2.1)), am, bevel=0.014)
    s.caixa("Compressor", (metros(2.4), metros(1.6), metros(2.6)), (-metros(1.4), 0, metros(3.7)), am, bevel=0.012)
    s.caixa("Cabine", (metros(1.6), metros(2.0), metros(1.8)), (metros(1.6), metros(0.7), metros(3.9)), am, bevel=0.012)
    s.caixa("Vidro", (metros(0.08), metros(1.3), metros(1.5)), (metros(2.4), metros(0.7), metros(4.1)), m["glass"], bevel=0.003)
    ht = metros(11)
    if torre_deitada:
        s.barra("Torre", (metros(2.2), -metros(1.0), metros(3.4)), (metros(2.2) - ht, -metros(1.0), metros(4.6)), metros(0.6), metros(0.9), aco)
    else:
        s.caixa("Torre", (metros(1.2), ht, metros(1.2)), (metros(2.2), -metros(1.0), metros(2.9) + ht * 0.5), aco, bevel=0.008)
        for i in range(6):
            hy = metros(3.4) + i * (ht - metros(1)) / 6
            s.barra(f"TorreX{i}", (metros(1.7), -metros(1.5), hy), (metros(2.7), -metros(0.5), hy + (ht - metros(1)) / 6), metros(0.16), metros(0.16), aco)
        s.tubo("Haste", metros(0.2), ht * 0.8, (metros(2.2), -metros(1.0), metros(3.0) + ht * 0.4), m["steel_rust"], verts=10)
        s.caixa("Cabeca", (metros(1.5), metros(0.8), metros(1.5)), (metros(2.2), -metros(1.0), metros(2.9) + ht), am, bevel=0.006)
    for st in (-1, 1):
        s.tubo(f"Macaco{st}", metros(0.28), metros(2.2), (metros(2.0), st * metros(1.9), metros(1.1)), aco, verts=10)
    return s.entregar()


def trator_esteira(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, lamina=0.0):
    """Trator de esteiras com lâmina e escarificador — empurra estéril."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    am, aco = m["cat"], m["steel"]
    for st in (-1, 1):
        s.caixa(f"Est{st}", (metros(4.6), metros(1.4), metros(1.0)), (0, st * metros(1.4), metros(0.7)), m["black"], bevel=0.012)
        s.tubo(f"Roda{st}A", metros(0.62), metros(1.1), (metros(1.9), st * metros(1.4), metros(0.75)), m["steel_rust"], eixo="t", verts=14)
        s.tubo(f"Roda{st}B", metros(0.62), metros(1.1), (-metros(1.9), st * metros(1.4), metros(0.75)), m["steel_rust"], eixo="t", verts=14)
    s.caixa("Corpo", (metros(3.8), metros(1.5), metros(2.2)), (-metros(0.2), 0, metros(2.1)), am, bevel=0.014)
    s.caixa("Cabine", (metros(1.6), metros(1.7), metros(1.9)), (-metros(1.0), 0, metros(3.6)), am, bevel=0.012)
    s.caixa("Vidro", (metros(0.08), metros(1.1), metros(1.6)), (-metros(0.2), 0, metros(3.7)), m["glass"], bevel=0.003)
    s.caixa("Escapamento", (metros(0.25), metros(1.2), metros(0.25)), (metros(1.2), metros(0.7), metros(3.4)), m["black"], bevel=0.004)
    # Lâmina em U com nervuras — a peça que define o trator.
    lx = metros(3.6)
    s.caixa("Lamina", (metros(0.35), metros(1.9), metros(4.6)), (lx, 0, metros(1.1) + lamina), aco, bevel=0.01)
    s.caixa("LaminaCorte", (metros(0.55), metros(0.35), metros(4.6)), (lx + metros(0.1), 0, metros(0.28) + lamina), m["steel_rust"], bevel=0.004)
    for st in (-1, 1):
        s.caixa(f"LaminaAba{st}", (metros(0.8), metros(1.7), metros(0.3)), (lx - metros(0.3), st * metros(2.2), metros(1.2) + lamina), aco, bevel=0.006)
        s.barra(f"Braco{st}", (lx - metros(0.2), st * metros(1.5), metros(1.0) + lamina), (metros(0.4), st * metros(1.5), metros(1.1)), metros(0.28), metros(0.28), am)
    # Escarificador traseiro.
    for i, st in enumerate((-1, 0, 1)):
        s.caixa(f"Ripper{i}", (metros(0.3), metros(1.6), metros(0.3)), (-metros(3.0), st * metros(1.1), metros(0.7)), m["steel_rust"], bevel=0.005)
    return s.entregar()


def carregadeira(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, cacamba_h=0.0):
    """Pá carregadeira de rodas — articulada no meio, caçamba larga."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    am, aco = m["volvo"], m["steel"]
    r = metros(1.1)
    s.caixa("Traseira", (metros(3.6), metros(2.0), metros(2.8)), (-metros(2.0), 0, r + metros(1.0)), am, bevel=0.016)
    s.caixa("Cabine", (metros(1.8), metros(2.0), metros(2.2)), (-metros(0.4), 0, r + metros(2.6)), am, bevel=0.014)
    s.caixa("Vidro", (metros(0.08), metros(1.4), metros(1.9)), (metros(0.5), 0, r + metros(2.8)), m["glass"], bevel=0.003)
    s.caixa("Dianteira", (metros(2.6), metros(1.6), metros(2.6)), (metros(1.6), 0, r + metros(0.8)), am, bevel=0.014)
    s.tubo("Junta", metros(0.4), metros(1.4), (metros(0.3), 0, r + metros(0.4)), m["steel_rust"], verts=12)
    for a in (metros(2.4), -metros(2.4)):
        for st in (-1, 1):
            s.tubo(f"Roda{a:.0f}{st}", r, metros(0.9), (a, st * metros(1.5), r), m["rubber"], eixo="t", verts=18)
            s.tubo(f"Aro{a:.0f}{st}", r * 0.42, metros(0.98), (a, st * metros(1.5), r), aco, eixo="t", verts=10)
    hb = r + metros(0.9) + cacamba_h
    for st in (-1, 1):
        s.barra(f"Braco{st}", (metros(1.2), st * metros(1.3), r + metros(1.6)), (metros(4.6), st * metros(1.3), hb), metros(0.32), metros(0.4), am)
        s.barra(f"Cil{st}", (metros(1.0), st * metros(1.1), r + metros(0.5)), (metros(3.2), st * metros(1.2), hb + metros(0.2)), metros(0.22), metros(0.22), aco)
    s.caixa("Cacamba", (metros(1.9), metros(1.8), metros(4.2)), (metros(5.4), 0, hb - metros(0.3)), aco, bevel=0.01)
    s.caixa("CacambaCorte", (metros(0.7), metros(0.25), metros(4.2)), (metros(6.2), 0, hb - metros(1.1)), m["steel_rust"], bevel=0.004)
    return s.entregar()


def motoniveladora(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0):
    """Motoniveladora — chassi longo, lâmina angulada no meio, seis rodas.

    É o veículo que explica por que a estrada de serviço está lisa.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    am, aco = m["cat"], m["steel"]
    r = metros(0.85)
    s.caixa("Viga", (metros(8.0), metros(0.7), metros(1.0)), (0, 0, r + metros(1.4)), am, bevel=0.01)
    s.caixa("Motor", (metros(3.0), metros(1.9), metros(2.4)), (-metros(2.6), 0, r + metros(1.6)), am, bevel=0.014)
    s.caixa("Cabine", (metros(1.8), metros(2.0), metros(1.9)), (-metros(0.4), 0, r + metros(2.9)), am, bevel=0.012)
    s.caixa("Vidro", (metros(0.08), metros(1.3), metros(1.7)), (metros(0.5), 0, r + metros(3.1)), m["glass"], bevel=0.003)
    for st in (-1, 1):
        s.tubo(f"RodaF{st}", r, metros(0.6), (metros(3.6), st * metros(1.2), r), m["rubber"], eixo="t", verts=16)
        for k, a in enumerate((-metros(2.0), -metros(3.4))):
            s.tubo(f"RodaT{st}{k}", r, metros(0.7), (a, st * metros(1.3), r), m["rubber"], eixo="t", verts=16)
    s.caixa("Lamina", (metros(0.3), metros(1.1), metros(4.0)), (metros(0.6), 0, metros(0.6)), aco, bevel=0.008, giro=0.42)
    s.caixa("LaminaCorte", (metros(0.45), metros(0.2), metros(4.0)), (metros(0.65), 0, metros(0.18)), m["steel_rust"], bevel=0.003, giro=0.42)
    s.tubo("Circulo", metros(1.2), metros(0.22), (metros(0.6), 0, metros(1.5)), aco, verts=20)
    for st in (-1, 1):
        s.barra(f"Susp{st}", (metros(0.6), st * metros(0.9), metros(1.6)), (metros(2.4), st * metros(0.5), r + metros(1.4)), metros(0.18), metros(0.18), am)
    return s.entregar()


def monte_terra(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, raio=None, altura=None, material=None):
    """Monte de terra removida — o objeto mais repetido da foto aérea da mina.

    Não é um cone: é um talude com o topo achatado, flanco irregular e material
    de laterita. Repare que na referência eles aparecem aos pares e trios, de
    tamanhos diferentes, sempre encostados na estrada de serviço.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    r = raio if raio is not None else metros(9)
    h = altura if altura is not None else metros(3.4)
    mat = material or m["dirt"]
    perfil = [
        (r * 1.02, 0.0),
        (r * 0.84, h * 0.22),
        (r * 0.62, h * 0.48),
        (r * 0.38, h * 0.74),
        (r * 0.17, h * 0.94),
        (0.0, h),
    ]
    s.perfil("Massa", perfil, (0, 0, 0), mat, segs=26, displace=h * 0.16)
    # Torrões soltos no pé, onde a caçamba derrubou material.
    for i in range(5):
        rr = s.rnd(i * 2.3)
        a = rr * math.tau
        d = r * (0.9 + rr * 0.25)
        s.pedra(f"Torrao{i}", r * (0.06 + rr * 0.05), (math.cos(a) * d, math.sin(a) * d, h * 0.03), mat, (1.4, 0.55, 1.2))
    return s.entregar()


def monte_minerio(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, raio=None, altura=None):
    """Pilha de minério pronta para embarque — mais escura e mais íngreme.

    O ângulo de repouso do minério britado é maior que o da terra solta, e é
    isso que faz as duas pilhas serem distinguíveis lado a lado.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    r = raio if raio is not None else metros(7)
    h = altura if altura is not None else metros(4.2)
    perfil = [(r, 0.0), (r * 0.7, h * 0.35), (r * 0.42, h * 0.66), (r * 0.2, h * 0.88), (0.0, h)]
    s.perfil("Pilha", perfil, (0, 0, 0), m["ore"], segs=24, displace=h * 0.1)
    for i in range(4):
        rr = s.rnd(i * 7.7)
        a = rr * math.tau
        s.pedra(f"Bloco{i}", r * (0.07 + rr * 0.06), (math.cos(a) * r * 0.95, math.sin(a) * r * 0.95, h * 0.04), m["ore"], (1.3, 0.6, 1.2))
    return s.entregar()


def bancada_rocha(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None, altura=None, degraus=3):
    """Trecho de talude em bancadas — a parede da cava da foto de referência.

    Cada degrau tem berma horizontal e face inclinada, que é como a lavra
    realmente desce. Encaixe vários lado a lado para contornar a cava.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c = comp if comp is not None else metros(24)
    h = altura if altura is not None else metros(12)
    passo_h = h / degraus
    berma = metros(3.2)
    for i in range(degraus):
        rec = i * berma
        s.caixa(f"Face{i}", (c, passo_h, metros(2.6)), (0, rec, passo_h * (i + 0.5)), m["rock"], bevel=0.02, giro=0.0)
        s.caixa(f"Berma{i}", (c, metros(0.4), berma), (0, rec + berma * 0.5, passo_h * (i + 1)), m["dirt"], bevel=0.01)
        # Leira de segurança na borda da berma — obrigatória em mina real.
        s.caixa(f"Leira{i}", (c, metros(1.0), metros(1.2)), (0, rec - metros(0.4), passo_h * (i + 1) + metros(0.4)), m["dirt"], bevel=0.02)
        for k in range(3):
            rr = s.rnd(i * 3 + k)
            s.pedra(f"Solto{i}{k}", metros(0.5 + rr), (-c * 0.4 + rr * c * 0.8, rec + berma * 0.3, passo_h * i + metros(0.4)), m["rock"], (1.3, 0.7, 1.1))
    return s.entregar()


def poca_lama(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, raio=None):
    """Poça de água barrenta — a marca de que ali passa caminhão e chove."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    r = raio if raio is not None else metros(2.4)
    s.tubo("Agua", r, metros(0.06), (0, 0, metros(0.03)), m["puddle"], verts=20)
    s.tubo("Borda", r * 1.18, metros(0.05), (0, 0, metros(0.02)), m["dirt"], verts=20)
    return s.entregar()


def marca_pneu(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None, bitola=None):
    """Par de rastros de pneu no solo — conta que a máquina se moveu.

    Custa quase nada e é o detalhe que a referência tem e o tabuleiro não: o
    chão de uma mina nunca está intocado.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c = comp if comp is not None else metros(14)
    b = bitola if bitola is not None else metros(4.0)
    for st in (-1, 1):
        # Rastro no chao: e uma mancha, nao uma corrente de elos. Um talo a
        # cada 2,4 m em vez de 1,2 corta metade do custo sem mudar a leitura.
        n = max(3, int(c / metros(2.4)))
        for i in range(n):
            a = -c * 0.5 + c * (i + 0.5) / n
            desv = (s.rnd(i * 1.7 + st) - 0.5) * metros(0.35)
            s.caixa(f"Rastro{st}{i}", (metros(2.0), metros(0.05), metros(0.9)), (a, st * b * 0.5 + desv, metros(0.02)), m["dirt"], bevel=0.0)
    return s.entregar()
