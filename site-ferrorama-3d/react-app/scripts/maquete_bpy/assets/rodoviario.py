"""Família F — rodoviário. O que circula no asfalto e nos pátios.

Referência: `design/referencias/terminal-logistico-aereo.png` — o pátio com a
carreta encostada na doca, as vagas cobertas cheias de carro e a van de
serviço. E `design/referencias/mina-operacao-aerea.png`, onde é a picape branca
parada perto do galpão que dá a escala de tudo.

Veículo pequeno é o termômetro de escala da maquete inteira: se o carro está
errado, o galpão ao lado fica errado junto. Por isso aqui todas as medidas saem
de `metros()` com valores reais — um carro de passeio tem 4,4 m, uma carreta
tem 18 m, e a diferença entre os dois precisa se ver.

Convenções: ver `base.py`.
"""

from __future__ import annotations

import math

from .base import Sitio, metros


def _rodas(s, m, eixos, bitola, r, larg=None, dupla=()):
    """Rodas com pneu e aro. `eixos` é a lista de posições no avanço."""
    w = larg if larg is not None else r * 0.62
    for i, a in enumerate(eixos):
        offs = (-1, 1) if i not in dupla else (-1.35, -0.62, 0.62, 1.35)
        for k, f in enumerate(offs):
            t = bitola * 0.5 * (f if i in dupla else f)
            s.tubo(f"Pneu{i}{k}", r, w, (a, t, r), m["rubber"], eixo="t", verts=16)
            s.tubo(f"Aro{i}{k}", r * 0.5, w * 1.06, (a, t, r), m["steel"], eixo="t", verts=10)


def caminhao_bau(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, cor=None):
    """Caminhão toco de baú — o entregador. 8,5 m, dois eixos."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    cab = cor or m["white"]
    r = metros(0.5)
    _rodas(s, m, (metros(2.6), -metros(1.6)), metros(2.3), r, dupla=(1,))
    s.caixa("Chassi", (metros(8.0), metros(0.35), metros(2.0)), (0, 0, r + metros(0.3)), m["black"], bevel=0.006)
    s.caixa("Cabine", (metros(2.2), metros(2.2), metros(2.4)), (metros(2.9), 0, r + metros(1.6)), cab, bevel=0.012)
    s.caixa("Parabrisa", (metros(0.1), metros(1.0), metros(2.1)), (metros(4.0), 0, r + metros(2.2)), m["glass"], bevel=0.003)
    for st in (-1, 1):
        s.caixa(f"VidroL{st}", (metros(1.2), metros(0.8), metros(0.08)), (metros(2.9), st * metros(1.2), r + metros(2.2)), m["glass"], bevel=0.002)
    s.caixa("Grade", (metros(0.3), metros(1.0), metros(2.2)), (metros(4.1), 0, r + metros(0.9)), m["black"], bevel=0.005)
    for st in (-1, 1):
        s.caixa(f"Farol{st}", (metros(0.14), metros(0.3), metros(0.5)), (metros(4.15), st * metros(0.75), r + metros(0.7)), m["glass"], bevel=0.002)
    s.caixa("Bau", (metros(5.4), metros(2.6), metros(2.5)), (-metros(1.2), 0, r + metros(1.9)), m["white"], bevel=0.008)
    s.caixa("BauTeto", (metros(5.5), metros(0.14), metros(2.6)), (-metros(1.2), 0, r + metros(3.2)), m["steel"], bevel=0.004)
    for i in range(6):
        s.caixa(f"BauNerv{i}", (metros(0.12), metros(2.5), metros(2.55)), (-metros(3.4) + i * metros(0.9), 0, r + metros(1.9)), m["white"], bevel=0.002)
    s.caixa("Porta", (metros(0.1), metros(2.2), metros(2.3)), (-metros(3.95), 0, r + metros(1.8)), m["steel"], bevel=0.004)
    s.caixa("ParaChoque", (metros(0.4), metros(0.4), metros(2.3)), (metros(4.2), 0, r + metros(0.1)), m["steel"], bevel=0.004)
    s.tubo("Escape", metros(0.12), metros(2.2), (metros(1.8), metros(1.15), r + metros(1.4)), m["steel"], verts=8)
    return s.entregar()


def carreta_bitrem(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, cor=None, cor_bau=None, dobra=0.0):
    """Cavalo mecânico com semirreboque — 18 m, a carreta da doca.

    `dobra` articula o semirreboque em relação ao cavalo, que é o que faz uma
    carreta manobrando parecer manobrando.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    cab = cor or m["mrs_b"]
    bau = cor_bau or m["white"]
    r = metros(0.52)
    # Cavalo mecânico.
    _rodas(s, m, (metros(6.4), metros(3.0), metros(1.8)), metros(2.4), r, dupla=(1, 2))
    s.caixa("Chassi", (metros(6.6), metros(0.35), metros(2.2)), (metros(4.0), 0, r + metros(0.35)), m["black"], bevel=0.005)
    s.caixa("Cabine", (metros(2.4), metros(2.9), metros(2.5)), (metros(6.0), 0, r + metros(2.0)), cab, bevel=0.014)
    s.caixa("Teto", (metros(2.2), metros(0.7), metros(2.4)), (metros(5.6), 0, r + metros(3.6)), cab, bevel=0.01)
    s.caixa("Parabrisa", (metros(0.1), metros(1.2), metros(2.2)), (metros(7.2), 0, r + metros(2.7)), m["glass"], bevel=0.003)
    for st in (-1, 1):
        s.caixa(f"VidroL{st}", (metros(1.3), metros(0.9), metros(0.08)), (metros(6.0), st * metros(1.25), r + metros(2.6)), m["glass"], bevel=0.002)
        s.caixa(f"Tanque{st}", (metros(1.8), metros(0.7), metros(0.7)), (metros(3.6), st * metros(1.2), r + metros(0.6)), m["steel"], bevel=0.006)
        s.tubo(f"Escape{st}", metros(0.14), metros(3.0), (metros(4.6), st * metros(1.25), r + metros(1.8)), m["steel"], verts=10)
    s.caixa("Grade", (metros(0.3), metros(1.3), metros(2.3)), (metros(7.3), 0, r + metros(1.0)), m["black"], bevel=0.005)
    s.caixa("Defletor", (metros(0.5), metros(1.2), metros(2.4)), (metros(4.6), 0, r + metros(4.0)), cab, bevel=0.008)
    s.tubo("QuintaRoda", metros(0.8), metros(0.2), (metros(2.4), 0, r + metros(0.7)), m["steel_rust"], verts=16)
    # Semirreboque articulado.
    co, si = math.cos(dobra), math.sin(dobra)
    def g(a, t, h):
        da = a - metros(2.4)
        return (metros(2.4) + da * co - t * si, da * si + t * co, h)
    s.caixa("Bau", (metros(13.2), metros(2.9), metros(2.55)), g(-metros(4.2), 0, r + metros(2.2)), bau, bevel=0.008, giro=dobra)
    s.caixa("BauTeto", (metros(13.3), metros(0.14), metros(2.6)), g(-metros(4.2), 0, r + metros(3.7)), m["steel"], bevel=0.004, giro=dobra)
    for i in range(9):
        s.caixa(f"Nerv{i}", (metros(0.12), metros(2.9), metros(2.6)), g(-metros(10.0) + i * metros(1.5), 0, r + metros(2.2)), bau, bevel=0.002, giro=dobra)
    s.caixa("Porta", (metros(0.12), metros(2.6), metros(2.4)), g(-metros(10.9), 0, r + metros(2.1)), m["steel"], bevel=0.004, giro=dobra)
    s.caixa("Longarina", (metros(13.0), metros(0.4), metros(1.6)), g(-metros(4.2), 0, r + metros(0.5)), m["black"], bevel=0.005, giro=dobra)
    for i, a in enumerate((-metros(8.4), -metros(9.8))):
        for k, f in enumerate((-1.3, -0.66, 0.66, 1.3)):
            p = g(a, metros(1.2) * f, r)
            s.tubo(f"PneuS{i}{k}", r, metros(0.32), p, m["rubber"], eixo="t", giro=dobra, verts=16)
    for st in (-1, 1):
        s.tubo(f"Pe{st}", metros(0.16), metros(1.4), g(-metros(1.6), st * metros(1.0), metros(0.7)), m["steel"], verts=8)
    return s.entregar()


def caminhao_basculante(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, cor=None, basculando=0.0, carga=True):
    """Caminhão caçamba de obra — 9 m, três eixos, caçamba de aço."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    cab = cor or m["sig_r"]
    r = metros(0.5)
    _rodas(s, m, (metros(3.2), -metros(1.4), -metros(2.8)), metros(2.4), r, dupla=(1, 2))
    s.caixa("Chassi", (metros(8.8), metros(0.35), metros(2.2)), (0, 0, r + metros(0.35)), m["black"], bevel=0.005)
    s.caixa("Cabine", (metros(2.2), metros(2.4), metros(2.4)), (metros(3.4), 0, r + metros(1.7)), cab, bevel=0.012)
    s.caixa("Parabrisa", (metros(0.1), metros(1.0), metros(2.1)), (metros(4.5), 0, r + metros(2.3)), m["glass"], bevel=0.003)
    s.caixa("Grade", (metros(0.3), metros(1.0), metros(2.2)), (metros(4.6), 0, r + metros(0.9)), m["black"], bevel=0.005)
    s.caixa("Protetor", (metros(0.3), metros(1.0), metros(2.4)), (metros(2.2), 0, r + metros(3.2)), m["steel"], bevel=0.005)
    cx = -metros(1.6) + math.sin(basculando) * metros(1.8)
    cy = r + metros(1.5) + math.sin(basculando) * metros(1.8)
    s.caixa("Cacamba", (metros(5.6), metros(0.3), metros(2.4)), (cx, 0, cy), m["steel_rust"], bevel=0.006)
    for st in (-1, 1):
        s.caixa(f"CacL{st}", (metros(5.6), metros(1.2), metros(0.2)), (cx, st * metros(1.2), cy + metros(0.6)), m["steel_rust"], bevel=0.005)
    s.caixa("CacF", (metros(0.2), metros(1.6), metros(2.4)), (cx - metros(2.9), 0, cy + metros(0.8)), m["steel_rust"], bevel=0.005)
    s.caixa("CacT", (metros(0.2), metros(1.2), metros(2.4)), (cx + metros(2.9), 0, cy + metros(0.6)), m["steel_rust"], bevel=0.005)
    s.tubo("Pistao", metros(0.24), metros(2.2), (metros(0.6), 0, r + metros(1.0)), m["steel"], verts=12)
    if carga and basculando < 0.15:
        for i in range(4):
            rr = s.rnd(i * 2.7)
            s.pedra(f"Carga{i}", metros(0.8 + rr * 0.3), (cx - metros(1.8) + i * metros(1.2), (rr - 0.5) * metros(0.9), cy + metros(0.7)), m["dirt"], (1.3, 0.5, 1.2))
    return s.entregar()


def caminhao_tanque(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, cor=None):
    """Caminhão-tanque de combustível — abastece as máquinas da mina."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    cab = cor or m["white"]
    r = metros(0.5)
    _rodas(s, m, (metros(3.0), -metros(1.6), -metros(3.0)), metros(2.4), r, dupla=(1, 2))
    s.caixa("Chassi", (metros(9.0), metros(0.35), metros(2.2)), (0, 0, r + metros(0.35)), m["black"], bevel=0.005)
    s.caixa("Cabine", (metros(2.2), metros(2.4), metros(2.4)), (metros(3.4), 0, r + metros(1.7)), cab, bevel=0.012)
    s.caixa("Parabrisa", (metros(0.1), metros(1.0), metros(2.1)), (metros(4.5), 0, r + metros(2.3)), m["glass"], bevel=0.003)
    s.tubo("Tanque", metros(1.15), metros(6.2), (-metros(1.2), 0, r + metros(1.9)), m["tank"], eixo="a", verts=22)
    for sa in (-1, 1):
        s.tubo(f"Tampo{sa}", metros(1.15), metros(0.5), (-metros(1.2) + sa * metros(3.2), 0, r + metros(1.9)), m["tank"], eixo="a", verts=22, r2=metros(0.85))
    for i in range(3):
        s.tubo(f"Aro{i}", metros(1.18), metros(0.16), (-metros(3.0) + i * metros(1.8), 0, r + metros(1.9)), m["steel"], eixo="a", verts=22)
        s.tubo(f"Boca{i}", metros(0.3), metros(0.4), (-metros(3.0) + i * metros(1.8), 0, r + metros(3.2)), m["steel"], verts=10)
    s.caixa("Passarela", (metros(6.0), metros(0.08), metros(0.7)), (-metros(1.2), 0, r + metros(3.15)), m["steel"], bevel=0.003)
    s.guarda_corpo("GC", [(-metros(4.0), metros(0.35)), (metros(1.6), metros(0.35))], metros(0.9), m["steel_y"])
    s.caixa("Armario", (metros(1.6), metros(1.0), metros(2.2)), (-metros(4.4), 0, r + metros(0.9)), m["white"], bevel=0.006)
    s.caixa("Faixa", (metros(6.4), metros(0.5), metros(0.1)), (-metros(1.2), metros(1.2), r + metros(1.9)), m["sig_r"], bevel=0.003)
    return s.entregar()


def van_utilitaria(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, cor=None):
    """Van de serviço — 5,5 m. Aparece encostada em toda doca da referência."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    cab = cor or m["white"]
    r = metros(0.36)
    _rodas(s, m, (metros(1.7), -metros(1.6)), metros(1.8), r)
    s.caixa("Corpo", (metros(5.2), metros(1.9), metros(2.0)), (-metros(0.2), 0, r + metros(1.05)), cab, bevel=0.014)
    s.caixa("Capo", (metros(1.0), metros(0.8), metros(1.9)), (metros(2.6), 0, r + metros(0.6)), cab, bevel=0.014)
    s.caixa("Parabrisa", (metros(0.5), metros(0.9), metros(1.8)), (metros(2.1), 0, r + metros(1.5)), m["glass"], bevel=0.004)
    for st in (-1, 1):
        s.caixa(f"VidroF{st}", (metros(1.2), metros(0.7), metros(0.08)), (metros(1.1), st * metros(1.0), r + metros(1.5)), m["glass"], bevel=0.002)
        s.caixa(f"Vinco{st}", (metros(4.8), metros(0.1), metros(0.08)), (-metros(0.2), st * metros(1.02), r + metros(0.7)), m["black"], bevel=0.002)
        s.caixa(f"Farol{st}", (metros(0.12), metros(0.24), metros(0.5)), (metros(3.1), st * metros(0.6), r + metros(0.7)), m["glass"], bevel=0.002)
    s.caixa("Teto", (metros(4.6), metros(0.1), metros(1.9)), (-metros(0.3), 0, r + metros(2.0)), cab, bevel=0.006)
    s.caixa("PortaTras", (metros(0.1), metros(1.6), metros(1.8)), (-metros(2.8), 0, r + metros(1.0)), cab, bevel=0.004)
    s.caixa("Placa", (metros(0.06), metros(0.24), metros(0.6)), (-metros(2.85), 0, r + metros(0.4)), m["white"], bevel=0.002)
    return s.entregar()


def pickup(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, cor=None, giroflex=True):
    """Picape cabine dupla — o veículo de supervisão de qualquer mina.

    O giroflex âmbar no teto é obrigatório dentro da área de lavra, e é o que
    a distingue de um carro comum a distância.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    cab = cor or m["white"]
    r = metros(0.38)
    _rodas(s, m, (metros(1.8), -metros(1.5)), metros(1.8), r)
    s.caixa("Chassi", (metros(5.4), metros(0.3), metros(1.9)), (0, 0, r + metros(0.25)), m["black"], bevel=0.004)
    s.caixa("Capo", (metros(1.4), metros(0.7), metros(1.9)), (metros(2.2), 0, r + metros(0.85)), cab, bevel=0.012)
    s.caixa("Cabine", (metros(2.2), metros(1.3), metros(1.9)), (metros(0.4), 0, r + metros(1.25)), cab, bevel=0.014)
    s.caixa("Parabrisa", (metros(0.4), metros(0.7), metros(1.7)), (metros(1.4), 0, r + metros(1.5)), m["glass"], bevel=0.003)
    s.caixa("Traseiro", (metros(0.3), metros(0.7), metros(1.7)), (-metros(0.7), 0, r + metros(1.5)), m["glass"], bevel=0.003)
    for st in (-1, 1):
        s.caixa(f"VidroL{st}", (metros(1.8), metros(0.55), metros(0.06)), (metros(0.4), st * metros(0.95), r + metros(1.5)), m["glass"], bevel=0.002)
        s.caixa(f"Farol{st}", (metros(0.1), metros(0.2), metros(0.45)), (metros(2.85), st * metros(0.6), r + metros(0.8)), m["glass"], bevel=0.002)
        s.caixa(f"Estribo{st}", (metros(2.0), metros(0.08), metros(0.2)), (metros(0.3), st * metros(1.0), r + metros(0.1)), m["black"], bevel=0.002)
    s.caixa("Cacamba", (metros(1.9), metros(0.55), metros(1.85)), (-metros(1.7), 0, r + metros(0.75)), cab, bevel=0.008)
    s.caixa("CacFundo", (metros(1.9), metros(0.1), metros(1.7)), (-metros(1.7), 0, r + metros(0.5)), m["black"], bevel=0.004)
    s.caixa("Grade", (metros(0.2), metros(0.4), metros(1.8)), (metros(2.9), 0, r + metros(0.5)), m["black"], bevel=0.004)
    if giroflex:
        s.caixa("Giroflex", (metros(0.7), metros(0.22), metros(1.0)), (metros(0.3), 0, r + metros(2.05)), m["amber"], bevel=0.004)
    s.tubo("Antena", metros(0.03), metros(2.2), (metros(2.6), metros(0.8), r + metros(2.0)), m["sig_r"], verts=6)
    return s.entregar()


def carro_passeio(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, cor=None):
    """Carro de passeio — 4,4 m. Enche as vagas do estacionamento.

    O teto mais estreito que a carroceria (o "greenhouse" recuado) é o que
    impede o carro de virar um tijolo com rodas.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    paleta = (m["white"], m["black"], m["mrs_b"], m["sig_r"], m["tank"], m["ship"])
    cab = cor or paleta[int(s.rnd(2.4) * len(paleta)) % len(paleta)]
    r = metros(0.32)
    _rodas(s, m, (metros(1.4), -metros(1.3)), metros(1.62), r, larg=metros(0.22))
    s.caixa("Corpo", (metros(4.3), metros(0.85), metros(1.78)), (0, 0, r + metros(0.5)), cab, bevel=0.02)
    s.caixa("Teto", (metros(2.2), metros(0.55), metros(1.5)), (-metros(0.15), 0, r + metros(1.15)), cab, bevel=0.02)
    s.caixa("Parabrisa", (metros(0.55), metros(0.5), metros(1.5)), (metros(1.05), 0, r + metros(1.1)), m["glass"], bevel=0.004)
    s.caixa("Vigia", (metros(0.5), metros(0.5), metros(1.45)), (-metros(1.3), 0, r + metros(1.1)), m["glass"], bevel=0.004)
    for st in (-1, 1):
        s.caixa(f"VidroL{st}", (metros(1.9), metros(0.42), metros(0.06)), (-metros(0.15), st * metros(0.76), r + metros(1.15)), m["glass"], bevel=0.002)
        s.caixa(f"Farol{st}", (metros(0.12), metros(0.18), metros(0.4)), (metros(2.1), st * metros(0.55), r + metros(0.6)), m["glass"], bevel=0.002)
        s.caixa(f"Lanterna{st}", (metros(0.1), metros(0.18), metros(0.36)), (-metros(2.1), st * metros(0.6), r + metros(0.62)), m["sig_r"], bevel=0.002)
        s.caixa(f"Retro{st}", (metros(0.2), metros(0.14), metros(0.3)), (metros(0.9), st * metros(0.95), r + metros(0.95)), cab, bevel=0.003)
    s.caixa("Grade", (metros(0.16), metros(0.24), metros(1.3)), (metros(2.15), 0, r + metros(0.42)), m["black"], bevel=0.003)
    s.caixa("Vinco", (metros(4.0), metros(0.06), metros(1.8)), (0, 0, r + metros(0.72)), m["black"], bevel=0.002)
    return s.entregar()


def onibus_funcionarios(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, cor=None):
    """Ônibus de transporte de turno — 12 m, fita de janela contínua.

    Ele responde uma pergunta que a maquete deixava no ar: como as pessoas
    chegam à mina.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    cab = cor or m["mrs_y"]
    r = metros(0.5)
    _rodas(s, m, (metros(4.2), -metros(3.4)), metros(2.4), r, dupla=(1,))
    s.caixa("Corpo", (metros(11.8), metros(2.6), metros(2.5)), (0, 0, r + metros(1.6)), cab, bevel=0.016)
    s.caixa("Saia", (metros(11.8), metros(0.7), metros(2.55)), (0, 0, r + metros(0.4)), m["black"], bevel=0.006)
    s.caixa("Teto", (metros(11.6), metros(0.16), metros(2.4)), (0, 0, r + metros(2.9)), m["white"], bevel=0.006)
    s.caixa("Parabrisa", (metros(0.12), metros(1.5), metros(2.3)), (metros(5.95), 0, r + metros(2.1)), m["glass"], bevel=0.004)
    s.caixa("Vigia", (metros(0.12), metros(1.2), metros(2.2)), (-metros(5.95), 0, r + metros(2.1)), m["glass"], bevel=0.004)
    for st in (-1, 1):
        s.janelas(f"Jan{st}", m["glass"], 8, -metros(5.0), metros(5.0), st * (metros(1.25) + metros(0.02)), r + metros(2.2), larg=metros(1.05), alt=metros(1.1))
        s.caixa(f"Faixa{st}", (metros(11.8), metros(0.3), metros(0.06)), (0, st * metros(1.28), r + metros(1.2)), m["sig_r"], bevel=0.002)
        s.caixa(f"Farol{st}", (metros(0.12), metros(0.3), metros(0.5)), (metros(6.0), st * metros(0.9), r + metros(0.7)), m["glass"], bevel=0.002)
    s.caixa("Porta", (metros(1.1), metros(2.0), metros(0.1)), (metros(4.4), metros(1.28), r + metros(1.3)), m["glass"], bevel=0.003)
    s.caixa("Letreiro", (metros(0.1), metros(0.4), metros(1.6)), (metros(6.0), 0, r + metros(2.85)), m["black"], bevel=0.002)
    s.caixa("Bagageiro", (metros(3.0), metros(0.9), metros(2.56)), (-metros(1.0), 0, r + metros(0.9)), m["steel"], bevel=0.006)
    return s.entregar()


def empilhadeira(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, garfo_h=None, cor=None):
    """Empilhadeira contrabalançada — mastro vertical, garfos e teto de proteção.

    O teto gaiola sobre o operador é o traço que a identifica; sem ele parece
    um carrinho de golfe.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    cab = cor or m["cat"]
    aco = m["steel"]
    gh = garfo_h if garfo_h is not None else metros(0.3)
    r = metros(0.32)
    for st in (-1, 1):
        s.tubo(f"RodaF{st}", r, metros(0.3), (metros(0.9), st * metros(0.55), r), m["rubber"], eixo="t", verts=14)
        s.tubo(f"RodaT{st}", r * 0.8, metros(0.24), (-metros(0.9), st * metros(0.45), r * 0.8), m["rubber"], eixo="t", verts=12)
    s.caixa("Corpo", (metros(2.4), metros(1.0), metros(1.2)), (-metros(0.3), 0, r + metros(0.4)), cab, bevel=0.01)
    s.caixa("Contrapeso", (metros(0.7), metros(0.9), metros(1.2)), (-metros(1.5), 0, r + metros(0.45)), m["black"], bevel=0.008)
    s.caixa("Banco", (metros(0.7), metros(0.6), metros(0.7)), (-metros(0.5), 0, r + metros(1.2)), m["black"], bevel=0.008)
    s.caixa("Encosto", (metros(0.12), metros(0.8), metros(0.7)), (-metros(0.85), 0, r + metros(1.6)), m["black"], bevel=0.006)
    s.tubo("Volante", metros(0.24), metros(0.06), (metros(0.15), 0, r + metros(1.6)), m["black"], eixo="a", verts=14)
    # Teto de proteção.
    for sa in (-1, 1):
        for st in (-1, 1):
            s.barra(f"Col{sa}{st}", (sa * metros(0.7) - metros(0.2), st * metros(0.55), r + metros(0.9)), (sa * metros(0.7) - metros(0.2), st * metros(0.55), r + metros(2.3)), metros(0.08), metros(0.08), aco)
    s.caixa("Gaiola", (metros(1.8), metros(0.1), metros(1.2)), (-metros(0.2), 0, r + metros(2.3)), aco, bevel=0.004)
    for i in range(4):
        s.caixa(f"Grade{i}", (metros(0.06), metros(0.12), metros(1.2)), (-metros(0.9) + i * metros(0.45), 0, r + metros(2.35)), aco, bevel=0.002)
    # Mastro e garfos.
    for st in (-1, 1):
        s.barra(f"Mastro{st}", (metros(1.15), st * metros(0.45), metros(0.15)), (metros(1.15), st * metros(0.45), metros(3.4)), metros(0.12), metros(0.16), aco)
        s.barra(f"MastroI{st}", (metros(1.28), st * metros(0.3), metros(0.15)), (metros(1.28), st * metros(0.3), metros(2.4)), metros(0.09), metros(0.12), m["steel_rust"])
        s.caixa(f"Garfo{st}", (metros(1.2), metros(0.08), metros(0.16)), (metros(1.9), st * metros(0.32), gh), aco, bevel=0.002)
    s.caixa("Carro", (metros(0.2), metros(0.6), metros(1.0)), (metros(1.35), 0, gh + metros(0.4)), aco, bevel=0.004)
    s.tubo("Cilindro", metros(0.1), metros(2.4), (metros(1.15), 0, metros(1.4)), m["steel"], verts=10)
    return s.entregar()


def plataforma_elevatoria(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, altura=None):
    """Plataforma elevatória tesoura — a manutenção acontecendo.

    Uma máquina em posição de trabalho conta mais história que dez máquinas
    estacionadas.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, amar = m["steel"], m["steel_y"]
    h = altura if altura is not None else metros(6.0)
    s.caixa("Chassi", (metros(3.0), metros(0.6), metros(1.7)), (0, 0, metros(0.55)), amar, bevel=0.008)
    for sa in (-1, 1):
        for st in (-1, 1):
            s.tubo(f"Roda{sa}{st}", metros(0.32), metros(0.26), (sa * metros(1.1), st * metros(0.85), metros(0.32)), m["rubber"], eixo="t", verts=12)
            s.tubo(f"Pata{sa}{st}", metros(0.12), metros(0.7), (sa * metros(1.5), st * metros(1.1), metros(0.35)), aco, verts=8)
    # Tesoura: quatro X empilhados, alternando o sentido.
    n = 4
    for k in range(n):
        h0 = metros(0.85) + (h - metros(1.6)) * k / n
        h1 = metros(0.85) + (h - metros(1.6)) * (k + 1) / n
        for st in (-1, 1):
            s.barra(f"TesA{k}{st}", (-metros(1.1), st * metros(0.6), h0), (metros(1.1), st * metros(0.6), h1), metros(0.1), metros(0.14), aco)
            s.barra(f"TesB{k}{st}", (metros(1.1), st * metros(0.6), h0), (-metros(1.1), st * metros(0.6), h1), metros(0.1), metros(0.14), aco)
    s.caixa("Piso", (metros(3.4), metros(0.12), metros(1.8)), (0, 0, h), amar, bevel=0.005)
    s.guarda_corpo("GC", [(-metros(1.7), -metros(0.9)), (metros(1.7), -metros(0.9)), (metros(1.7), metros(0.9)), (-metros(1.7), metros(0.9)), (-metros(1.7), -metros(0.9))], metros(1.1), amar)
    s.caixa("Painel", (metros(0.4), metros(0.4), metros(0.5)), (metros(1.3), metros(0.6), h + metros(0.4)), m["black"], bevel=0.004)
    return s.entregar()
