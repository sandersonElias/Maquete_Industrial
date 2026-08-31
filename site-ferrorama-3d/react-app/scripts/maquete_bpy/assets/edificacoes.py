"""Família C — edificações. O que é construído, não montado.

Referências: `design/referencias/terminal-logistico-aereo.png` (o campus
industrial com bloco administrativo envidraçado, telhado com painel solar,
cobertura de estacionamento e muro de perímetro) e
`design/referencias/mina-operacao-aerea.png` (os galpões brancos de duas águas,
o refeitório, a torre d'água e o pátio de contêineres).

O erro que estes assets corrigem é o mais grosseiro do tabuleiro atual: um
prédio era uma caixa com uma laje em cima. Cinco coisas separam uma caixa de um
prédio, e todas estão implementadas aqui:

1. **telhado com inclinação e beiral** — a laje plana é a assinatura da caixa;
2. **base/embasamento** mais escuro, porque nenhum prédio nasce do gramado;
3. **fileira de janelas ritmada**, que é o que informa a altura de andar;
4. **um volume secundário** (caixa de escada, marquise, casa de máquinas), pois
   prédio nenhum é um paralelepípedo puro;
5. **as coisas do telhado** — dutos, exaustor, condensadora, painel solar.

Convenções: ver `base.py`.
"""

from __future__ import annotations

import math

from .base import Sitio, metros


def _m_ou(s, chave):
    """Material da paleta com queda para branco — a paleta muda com o tempo."""
    return s.m.get(chave, s.m["white"])


def _base_edificio(s, comp, larg, h=None):
    """Embasamento de concreto. Nenhum prédio brota da grama."""
    h = h if h is not None else metros(0.6)
    s.caixa("Embasamento", (comp + metros(0.8), h, larg + metros(0.8)), (0, 0, h * 0.5), s.m["conc_dirty"], bevel=0.006)
    return h


def _coisas_de_telhado(s, comp, larg, h, n=3, sal=0.0):
    """Dutos, exaustores e condensadoras. Telhado limpo é telhado de brinquedo."""
    aco = s.m["steel"]
    for i in range(n):
        r = s.rnd(sal + i * 3.7)
        a = -comp * 0.32 + comp * 0.64 * (i + 0.5) / n
        t = (r - 0.5) * larg * 0.5
        if i % 3 == 0:
            s.caixa(f"Duto{i}", (metros(2.4), metros(1.0), metros(1.4)), (a, t, h + metros(0.5)), aco, bevel=0.006)
            s.tubo(f"Exaust{i}", metros(0.5), metros(1.2), (a + metros(1.4), t, h + metros(1.1)), aco, verts=12)
        elif i % 3 == 1:
            s.caixa(f"Cond{i}", (metros(2.0), metros(1.2), metros(2.0)), (a, t, h + metros(0.6)), _m_ou(s, "roof"), bevel=0.006)
            s.caixa(f"CondGrade{i}", (metros(1.7), metros(0.1), metros(1.7)), (a, t, h + metros(1.25)), aco, bevel=0.003)
        else:
            s.tubo(f"Chamine{i}", metros(0.42), metros(2.4), (a, t, h + metros(1.2)), s.m["steel_rust"], verts=12)
            s.tubo(f"Chapeu{i}", metros(0.6), metros(0.3), (a, t, h + metros(2.5)), aco, verts=12)


def galpao_industrial(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None, larg=None, portoes=2, lanternim=True):
    """Galpão de duas águas com portões, lanternim e costelas — o pavilhão base.

    Na referência aérea o galpão longo e branco é o volume que dá escala a todo
    o resto. As costelas verticais (pilares aparentes) são o que impede que a
    parede longa leia como uma placa.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c = comp if comp is not None else metros(48)
    l = larg if larg is not None else metros(20)
    hb, hc = metros(8.0), metros(11.5)
    y0 = _base_edificio(s, c, l)
    s.caixa("Corpo", (c, hb, l), (0, 0, y0 + hb * 0.5), m["white"], bevel=0.01)
    s.caixa("Rodape", (c + metros(0.1), metros(1.6), l + metros(0.1)), (0, 0, y0 + metros(0.8)), m["conc_dirty"], bevel=0.006)
    s.telhado_duas_aguas("Telh", c + metros(1.0), l, y0 + hb, y0 + hc, m["roof"], espessura=metros(0.3), beiral=metros(0.6))
    s.frontao("FrtA", l, y0 + hb, y0 + hc, m["white"], c * 0.5)
    s.frontao("FrtB", l, y0 + hb, y0 + hc, m["white"], -c * 0.5)
    # Costelas: pilares aparentes a cada 6 m, os dois lados.
    n = max(3, int(c / metros(6)))
    for i in range(n + 1):
        a = -c * 0.5 + c * i / n
        for st in (-1, 1):
            s.caixa(f"Cost{i}{st}", (metros(0.5), hb, metros(0.4)), (a, st * (l * 0.5 + metros(0.15)), y0 + hb * 0.5), m["conc_dirty"], bevel=0.004)
    # Portões de rolo e portas de serviço.
    for k in range(max(0, portoes)):
        a = -c * 0.28 + c * 0.56 * (k / max(1, portoes - 1) if portoes > 1 else 0.5)
        s.caixa(f"Portao{k}", (metros(6.0), metros(6.0), metros(0.2)), (a, l * 0.5 + metros(0.06), y0 + metros(3.0)), m["steel_y"], bevel=0.006)
        for j in range(5):
            s.caixa(f"PortaoR{k}{j}", (metros(6.0), metros(0.12), metros(0.26)), (a, l * 0.5 + metros(0.16), y0 + metros(0.8) + j * metros(1.1)), m["steel_rust"], bevel=0.002)
    s.caixa("PortaServ", (metros(1.4), metros(2.6), metros(0.14)), (c * 0.42, l * 0.5 + metros(0.06), y0 + metros(1.3)), m["steel"], bevel=0.004)
    # Faixa de janelas alta nos dois lados — a iluminação natural do galpão.
    for st in (-1, 1):
        s.janelas(f"Jan{st}", m["janela"], max(4, n - 1), -c * 0.42, c * 0.42, st * (l * 0.5 + metros(0.06)), y0 + hb - metros(1.6), larg=metros(2.6), alt=metros(1.4))
    if lanternim:
        s.caixa("Lanternim", (c * 0.66, metros(1.4), metros(2.6)), (0, 0, y0 + hc + metros(0.7)), m["roof"], bevel=0.006)
        s.caixa("LanternimTelh", (c * 0.68, metros(0.2), metros(3.4)), (0, 0, y0 + hc + metros(1.5)), m["roof"], bevel=0.004)
    _coisas_de_telhado(s, c, l, y0 + hc, 2, sal)
    return s.entregar()


def galpao_arco(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None, larg=None, arcos=9):
    """Galpão de cobertura em arco — o de armazenagem a granel.

    O arco é feito de facetas: uma sucessão de placas girando, e não um
    cilindro cortado. Assim o interior fica vazado e a silhueta lê como arco
    mesmo de perto.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c = comp if comp is not None else metros(34)
    l = larg if larg is not None else metros(18)
    r = l * 0.5
    y0 = _base_edificio(s, c, l)
    s.caixa("Mureta", (c, metros(2.6), l), (0, 0, y0 + metros(1.3)), m["conc_dirty"], bevel=0.008)
    n = max(5, arcos)
    for i in range(n):
        ang0 = math.pi * i / n
        ang1 = math.pi * (i + 1) / n
        t0, h0 = -math.cos(ang0) * r, math.sin(ang0) * r
        t1, h1 = -math.cos(ang1) * r, math.sin(ang1) * r
        s.barra(
            f"Casca{i}",
            (0, t0, y0 + metros(2.6) + h0),
            (0, t1, y0 + metros(2.6) + h1),
            metros(0.3), metros(0.3), m["roof"],
        )
        # A casca real: uma placa comprida acompanhando cada faceta.
        mt, mh = (t0 + t1) * 0.5, (h0 + h1) * 0.5
        incl = math.atan2(h1 - h0, t1 - t0)
        larg_face = math.hypot(t1 - t0, h1 - h0)
        s.caixa(f"Face{i}", (c, metros(0.22), larg_face * 1.06), (0, mt, y0 + metros(2.6) + mh), m["roof"], bevel=0.003, tombo=incl)
    # Nervuras: arcos aparentes a cada tantos metros.
    for k in range(5):
        a = -c * 0.42 + c * 0.84 * k / 4
        for i in range(n):
            ang0 = math.pi * i / n
            ang1 = math.pi * (i + 1) / n
            s.barra(
                f"Nerv{k}_{i}",
                (a, -math.cos(ang0) * r * 0.97, y0 + metros(2.6) + math.sin(ang0) * r * 0.97),
                (a, -math.cos(ang1) * r * 0.97, y0 + metros(2.6) + math.sin(ang1) * r * 0.97),
                metros(0.28), metros(0.28), m["steel"],
            )
    s.frontao("FrtA", l, y0 + metros(2.6), y0 + metros(2.6) + r, m["white"], c * 0.5)
    s.caixa("Boca", (metros(0.3), r * 1.1, l * 0.55), (-c * 0.5, 0, y0 + metros(2.6) + r * 0.5), m["black"], bevel=0.006)
    return s.entregar()


def predio_administrativo(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None, larg=None, andares=2, solar=True):
    """Bloco administrativo branco com fita de janelas — a referência aérea.

    Volume principal recuado, marquise sobre a entrada, caixa de escada saindo
    do prisma e painel solar no telhado. É esse conjunto de quebras que
    diferencia um prédio de um tijolo branco.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c = comp if comp is not None else metros(30)
    l = larg if larg is not None else metros(16)
    pe = metros(3.6)
    h = pe * andares
    y0 = _base_edificio(s, c, l)
    s.caixa("Corpo", (c, h, l), (0, 0, y0 + h * 0.5), m["white"], bevel=0.012)
    s.caixa("Platibanda", (c + metros(0.5), metros(0.9), l + metros(0.5)), (0, 0, y0 + h + metros(0.45)), m["white"], bevel=0.008)
    # Fita de janela por andar, nas quatro faces — o ritmo é o assunto.
    for k in range(andares):
        hy = y0 + pe * k + pe * 0.62
        for st in (-1, 1):
            s.janelas(f"J{k}{st}", m["glass"], max(5, int(c / metros(4))), -c * 0.42, c * 0.42, st * (l * 0.5 + metros(0.05)), hy, larg=metros(2.4), alt=metros(1.7))
        for sa in (-1, 1):
            n = max(3, int(l / metros(4)))
            for i in range(n):
                f = (i + 0.5) / n
                s.caixa(f"Jt{k}{sa}{i}", (metros(0.1), metros(1.7), metros(2.4)), (sa * (c * 0.5 + metros(0.05)), -l * 0.42 + l * 0.84 * f, hy), m["glass"], bevel=0.002)
        s.caixa(f"Faixa{k}", (c + metros(0.12), metros(0.35), l + metros(0.12)), (0, 0, y0 + pe * (k + 1) - metros(0.2)), m["conc"], bevel=0.004)
    # Volume da entrada: marquise, pilares e porta de vidro.
    s.caixa("Marquise", (metros(9), metros(0.5), metros(4.4)), (0, l * 0.5 + metros(2.0), y0 + metros(3.2)), m["white"], bevel=0.008)
    for st in (-1, 1):
        s.tubo(f"PilarMq{st}", metros(0.3), metros(3.2), (st * metros(3.6), l * 0.5 + metros(3.6), y0 + metros(1.6)), m["steel"], verts=12)
    s.caixa("Entrada", (metros(6.0), metros(3.0), metros(0.2)), (0, l * 0.5 + metros(0.1), y0 + metros(1.5)), m["glass"], bevel=0.004)
    # Caixa de escada saindo do prisma.
    s.caixa("Escada", (metros(5.0), h + metros(2.6), metros(5.0)), (-c * 0.5 + metros(2.0), -l * 0.5 - metros(1.6), y0 + (h + metros(2.6)) * 0.5), m["conc"], bevel=0.01)
    s.caixa("EscadaJ", (metros(0.8), h * 0.8, metros(0.15)), (-c * 0.5 + metros(2.0), -l * 0.5 - metros(4.1), y0 + h * 0.5), m["glass"], bevel=0.003)
    if solar:
        # Painel solar em fileiras inclinadas — exatamente como na referência.
        for i in range(4):
            for k in range(3):
                s.caixa(
                    f"Solar{i}{k}",
                    (metros(5.4), metros(0.16), metros(2.6)),
                    (-c * 0.3 + i * metros(6.4), -l * 0.22 + k * metros(3.4), y0 + h + metros(1.3)),
                    m["black"], bevel=0.003,
                )
                s.caixa(f"SolarP{i}{k}", (metros(0.16), metros(0.7), metros(0.16)), (-c * 0.3 + i * metros(6.4), -l * 0.22 + k * metros(3.4), y0 + h + metros(0.9)), m["steel"], bevel=0.002)
    _coisas_de_telhado(s, c, l, y0 + h + metros(0.9), 3, sal)
    return s.entregar()


def predio_vidro(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None, larg=None, andares=3):
    """Bloco de fachada envidraçada escura — a recepção da referência aérea.

    Vidro contínuo com montantes verticais, brise horizontal e coroamento
    branco. É o único edifício do campus que deve brilhar.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c = comp if comp is not None else metros(22)
    l = larg if larg is not None else metros(14)
    pe = metros(3.8)
    h = pe * andares
    y0 = _base_edificio(s, c, l)
    s.caixa("Nucleo", (c - metros(1.2), h, l - metros(1.2)), (0, 0, y0 + h * 0.5), m["black"], bevel=0.008)
    # Pele de vidro nas quatro faces.
    for st in (-1, 1):
        s.caixa(f"Pele{st}", (c, h - metros(0.4), metros(0.16)), (0, st * l * 0.5, y0 + h * 0.5), m["glass"], bevel=0.004)
    for sa in (-1, 1):
        s.caixa(f"PeleT{sa}", (metros(0.16), h - metros(0.4), l), (sa * c * 0.5, 0, y0 + h * 0.5), m["glass"], bevel=0.004)
    # Montantes verticais: sem eles a pele de vidro lê como plástico azul.
    n = max(6, int(c / metros(2.4)))
    for i in range(n + 1):
        a = -c * 0.5 + c * i / n
        for st in (-1, 1):
            s.caixa(f"Mont{i}{st}", (metros(0.18), h, metros(0.28)), (a, st * (l * 0.5 + metros(0.06)), y0 + h * 0.5), m["white"], bevel=0.003)
    for k in range(andares + 1):
        s.caixa(f"Brise{k}", (c + metros(0.6), metros(0.28), l + metros(0.6)), (0, 0, y0 + pe * k + metros(0.1)), m["white"], bevel=0.005)
    s.caixa("Coroa", (c + metros(1.0), metros(1.2), l + metros(1.0)), (0, 0, y0 + h + metros(0.6)), m["white"], bevel=0.01)
    s.caixa("Toldo", (metros(8), metros(0.4), metros(3.6)), (0, l * 0.5 + metros(1.8), y0 + metros(3.4)), m["white"], bevel=0.006)
    s.caixa("Placa", (metros(5.0), metros(1.2), metros(0.2)), (c * 0.18, l * 0.5 + metros(0.16), y0 + h - metros(1.4)), m["sign_b"], bevel=0.004)
    return s.entregar()


def oficina_manutencao(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None, larg=None):
    """Oficina de manutenção — pé-direito alto, portão enorme, ponte rolante.

    O portão de 8 m é o que conta que ali entra caminhão fora-de-estrada, e o
    trilho da ponte rolante aparecendo pela porta aberta é o detalhe que faz a
    oficina parecer uma oficina.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c = comp if comp is not None else metros(32)
    l = larg if larg is not None else metros(22)
    hb, hc = metros(11), metros(14)
    y0 = _base_edificio(s, c, l)
    s.caixa("Corpo", (c, hb, l), (0, 0, y0 + hb * 0.5), m["roof"], bevel=0.01)
    s.caixa("Rodape", (c + metros(0.1), metros(2.4), l + metros(0.1)), (0, 0, y0 + metros(1.2)), m["conc_dirty"], bevel=0.006)
    s.telhado_duas_aguas("Telh", c + metros(1.2), l, y0 + hb, y0 + hc, m["roof"], espessura=metros(0.3), beiral=metros(0.8))
    s.frontao("FrtA", l, y0 + hb, y0 + hc, m["roof"], c * 0.5)
    s.frontao("FrtB", l, y0 + hb, y0 + hc, m["roof"], -c * 0.5)
    # Dois portões grandes na testeira.
    for k, t in enumerate((-l * 0.24, l * 0.24)):
        s.caixa(f"Portao{k}", (metros(0.2), metros(8.4), metros(8.0)), (c * 0.5 + metros(0.08), t, y0 + metros(4.2)), m["steel_y"], bevel=0.006)
        s.caixa(f"PortaoV{k}", (metros(0.1), metros(1.2), metros(7.0)), (c * 0.5 + metros(0.16), t, y0 + metros(7.4)), m["glass"], bevel=0.003)
    # Trilho de ponte rolante visível por dentro.
    for st in (-1, 1):
        s.barra(f"TrilhoPR{st}", (-c * 0.48, st * (l * 0.5 - metros(1.6)), y0 + metros(8.6)), (c * 0.48, st * (l * 0.5 - metros(1.6)), y0 + metros(8.6)), metros(0.3), metros(0.4), m["steel"])
    s.caixa("PonteRolante", (metros(1.6), metros(1.0), l - metros(3.0)), (c * 0.18, 0, y0 + metros(9.2)), m["steel_y"], bevel=0.008)
    s.caixa("Talha", (metros(1.2), metros(1.4), metros(1.2)), (c * 0.18, metros(2.0), y0 + metros(8.2)), m["black"], bevel=0.006)
    s.barra("Gancho", (c * 0.18, metros(2.0), y0 + metros(7.6)), (c * 0.18, metros(2.0), y0 + metros(4.4)), metros(0.1), metros(0.1), m["steel"])
    for st in (-1, 1):
        s.janelas(f"Jan{st}", m["janela"], 6, -c * 0.42, c * 0.42, st * (l * 0.5 + metros(0.06)), y0 + hb - metros(2.0), larg=metros(2.8), alt=metros(1.8))
    s.caixa("Anexo", (metros(10), metros(4.0), metros(6.0)), (-c * 0.32, -l * 0.5 - metros(3.0), y0 + metros(2.0)), m["white"], bevel=0.008)
    s.telhado_duas_aguas("AnexoT", metros(10.4), metros(6.0), y0 + metros(4.0), y0 + metros(5.2), m["roof_r"], beiral=metros(0.4))
    return s.entregar()


def subestacao(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, transformadores=2):
    """Pátio de subestação — pórtico, transformadores, isoladores e cerca.

    O pórtico de barramento com as três fases penduradas é o que identifica uma
    subestação de qualquer distância; o resto é caixa.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, conc = m["steel"], m["conc_dirty"]
    c, l = metros(24), metros(16)
    s.caixa("Brita", (c, metros(0.16), l), (0, 0, metros(0.08)), m["ballast"], bevel=0.004)
    # Pórtico: dois montantes treliçados e a viga superior.
    for sa in (-1, 1):
        s.trelica(f"Mont{sa}", (sa * c * 0.36, -metros(0.5), 0), (sa * c * 0.36, -metros(0.5), metros(11)), aco, w=metros(0.2), h=metros(0.2), montantes=4, altura=metros(1.2))
    s.trelica("Viga", (-c * 0.36, -metros(0.5), metros(11)), (c * 0.36, -metros(0.5), metros(11)), aco, w=metros(0.2), h=metros(0.2), montantes=6, altura=metros(1.0))
    for i in range(3):
        t = -metros(0.5) + (i - 1) * metros(2.4)
        s.barra(f"Fase{i}", (-c * 0.34, t, metros(10.4)), (c * 0.34, t, metros(10.0)), metros(0.08), metros(0.08), m["black"])
        for sa in (-1, 1):
            s.tubo(f"Isol{i}{sa}", metros(0.22), metros(1.6), (sa * c * 0.3, t, metros(11.6)), m["white"], verts=10)
    # Transformadores com radiadores e buchas — a parte que se reconhece.
    for k in range(max(1, transformadores)):
        a = -c * 0.16 + k * metros(7.0)
        s.caixa(f"Trafo{k}", (metros(4.4), metros(4.0), metros(3.4)), (a, metros(3.6), metros(2.2)), m["tank"], bevel=0.01)
        s.caixa(f"TrafoBase{k}", (metros(5.0), metros(0.5), metros(4.0)), (a, metros(3.6), metros(0.25)), conc, bevel=0.005)
        for i in range(6):
            s.caixa(f"Rad{k}{i}", (metros(0.2), metros(3.0), metros(1.6)), (a - metros(1.8) + i * metros(0.7), metros(5.6), metros(2.4)), m["steel"], bevel=0.003)
        for i in range(3):
            s.tubo(f"Bucha{k}{i}", metros(0.24), metros(2.2), (a - metros(1.4) + i * metros(1.4), metros(3.6), metros(5.2)), m["white"], verts=10)
        s.tubo(f"Conserv{k}", metros(0.55), metros(3.6), (a, metros(1.6), metros(4.6)), m["tank"], eixo="a", verts=14)
    s.caixa("Casa", (metros(7.0), metros(3.2), metros(4.4)), (-c * 0.36, l * 0.3, metros(1.6)), m["white"], bevel=0.008)
    s.telhado_duas_aguas("CasaT", metros(7.4), metros(4.4), metros(3.2), metros(4.0), m["roof"], beiral=metros(0.3))
    # Cerca de tela com placa de perigo.
    cantos = [(-c * 0.5, -l * 0.5), (c * 0.5, -l * 0.5), (c * 0.5, l * 0.5), (-c * 0.5, l * 0.5), (-c * 0.5, -l * 0.5)]
    s.guarda_corpo("Cerca", cantos, metros(2.4), m["steel"], montante=metros(2.5))
    s.caixa("PlacaPerigo", (metros(1.2), metros(0.9), metros(0.08)), (0, -l * 0.5 - metros(0.1), metros(1.6)), m["sig_y"], bevel=0.003)
    return s.entregar()


def casa_bombas(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0):
    """Casa de bombas — prédio pequeno com o barrilete de tubos do lado de fora.

    Os tubos saindo pela parede com registros e manômetros são o que a
    identifica; o prédio em si é banal de propósito.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco = m["steel"]
    c, l, h = metros(10), metros(7), metros(4.4)
    y0 = _base_edificio(s, c, l)
    s.caixa("Corpo", (c, h, l), (0, 0, y0 + h * 0.5), m["white"], bevel=0.008)
    s.telhado_duas_aguas("Telh", c + metros(0.6), l, y0 + h, y0 + h + metros(1.4), m["roof_r"], beiral=metros(0.4))
    s.frontao("FrtA", l, y0 + h, y0 + h + metros(1.4), m["white"], c * 0.5)
    s.frontao("FrtB", l, y0 + h, y0 + h + metros(1.4), m["white"], -c * 0.5)
    s.caixa("Porta", (metros(1.4), metros(2.4), metros(0.12)), (metros(2.6), l * 0.5 + metros(0.05), y0 + metros(1.2)), m["steel"], bevel=0.004)
    s.janelas("Jan", m["janela"], 2, -c * 0.32, c * 0.02, l * 0.5 + metros(0.05), y0 + metros(2.8), larg=metros(1.4), alt=metros(1.2))
    # Barrilete: tubos horizontais com registros e um par de bombas expostas.
    for k, hy in enumerate((metros(1.2), metros(2.2))):
        s.tubo(f"Tubo{k}", metros(0.34), c * 1.2, (0, -l * 0.5 - metros(1.2), y0 + hy), aco, eixo="a", verts=14)
        for i in range(3):
            s.tubo(f"Reg{k}{i}", metros(0.5), metros(0.3), (-c * 0.3 + i * metros(3.0), -l * 0.5 - metros(1.2), y0 + hy + metros(0.5)), m["sig_r"], verts=12)
            s.tubo(f"RegH{k}{i}", metros(0.14), metros(0.7), (-c * 0.3 + i * metros(3.0), -l * 0.5 - metros(1.2), y0 + hy + metros(0.3)), aco, verts=8)
    for i in range(2):
        s.tubo(f"Sobe{i}", metros(0.34), metros(3.0), (-c * 0.4 + i * metros(6.0), -l * 0.5 - metros(1.2), y0 + metros(2.6)), aco, verts=14)
    s.caixa("Bomba", (metros(2.2), metros(1.2), metros(1.2)), (-c * 0.2, -l * 0.5 - metros(2.6), y0 + metros(0.6)), m["sig_g"], bevel=0.006)
    return s.entregar()


def guarita(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, cancela=True):
    """Guarita de portaria com cancela — o ponto de entrada de qualquer planta.

    Duas coisas fazem a leitura: o vidro em fita nos três lados e a cancela
    listrada. Sem a cancela é só um quiosque.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco = m["steel"]
    c, l, h = metros(4.0), metros(3.2), metros(3.0)
    y0 = _base_edificio(s, c, l, metros(0.35))
    s.caixa("Corpo", (c, h, l), (0, 0, y0 + h * 0.5), m["white"], bevel=0.01)
    for st in (-1, 1):
        s.caixa(f"Vidro{st}", (c * 0.86, metros(1.4), metros(0.1)), (0, st * (l * 0.5 + metros(0.04)), y0 + metros(1.9)), m["glass"], bevel=0.003)
    s.caixa("VidroF", (metros(0.1), metros(1.4), l * 0.8), (c * 0.5 + metros(0.04), 0, y0 + metros(1.9)), m["glass"], bevel=0.003)
    s.caixa("Porta", (metros(0.1), metros(2.2), metros(1.0)), (-c * 0.5 - metros(0.04), 0, y0 + metros(1.1)), m["steel"], bevel=0.003)
    s.caixa("Beiral", (c + metros(1.4), metros(0.28), l + metros(1.4)), (0, 0, y0 + h + metros(0.14)), m["roof"], bevel=0.006)
    s.bola("LuzGuarita", metros(0.24), (0, l * 0.5 + metros(0.5), y0 + h + metros(0.4)), m["glow"], segs=10)
    if cancela:
        s.tubo("CancelaBase", metros(0.28), metros(1.2), (0, -l * 0.5 - metros(1.6), metros(0.6)), m["sig_y"], verts=12)
        s.caixa("CancelaCaixa", (metros(0.6), metros(0.9), metros(0.5)), (0, -l * 0.5 - metros(1.6), metros(1.5)), m["sig_y"], bevel=0.006)
        n = 7
        for i in range(n):
            mat = m["sig_r"] if i % 2 == 0 else m["white"]
            s.caixa(f"Braco{i}", (metros(0.16), metros(0.16), metros(6.0) / n), (0, -l * 0.5 - metros(1.6) - metros(1.2) - metros(6.0) * (i + 0.5) / n, metros(1.9)), mat, bevel=0.002)
    return s.entregar()


def vestiario(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0):
    """Vestiário e sanitários — bloco baixo com telha vermelha e caixa d'água."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c, l, h = metros(18), metros(8), metros(3.4)
    y0 = _base_edificio(s, c, l)
    s.caixa("Corpo", (c, h, l), (0, 0, y0 + h * 0.5), m["white"], bevel=0.008)
    s.telhado_duas_aguas("Telh", c + metros(0.8), l, y0 + h, y0 + h + metros(1.5), m["roof_r"], beiral=metros(0.55))
    s.frontao("FrtA", l, y0 + h, y0 + h + metros(1.5), m["white"], c * 0.5)
    s.frontao("FrtB", l, y0 + h, y0 + h + metros(1.5), m["white"], -c * 0.5)
    for k, a in enumerate((-c * 0.3, c * 0.05)):
        s.caixa(f"Porta{k}", (metros(1.3), metros(2.3), metros(0.12)), (a, l * 0.5 + metros(0.05), y0 + metros(1.15)), m["sign_b"], bevel=0.004)
    s.janelas("Jan", m["janela"], 6, -c * 0.42, c * 0.42, l * 0.5 + metros(0.05), y0 + metros(2.6), larg=metros(1.1), alt=metros(0.9))
    s.janelas("JanB", m["janela"], 6, -c * 0.42, c * 0.42, -l * 0.5 - metros(0.05), y0 + metros(2.6), larg=metros(1.1), alt=metros(0.9))
    s.caixa("CaixaAgua", (metros(2.4), metros(1.8), metros(2.4)), (c * 0.36, 0, y0 + h + metros(2.4)), m["tank"], bevel=0.008)
    for sa in (-1, 1):
        for st in (-1, 1):
            s.barra(f"Sup{sa}{st}", (c * 0.36 + sa * metros(1.0), st * metros(1.0), y0 + h + metros(0.3)), (c * 0.36 + sa * metros(1.0), st * metros(1.0), y0 + h + metros(1.6)), metros(0.14), metros(0.14), m["steel"])
    s.caixa("Marquise", (c * 0.9, metros(0.22), metros(2.0)), (0, l * 0.5 + metros(1.0), y0 + metros(2.7)), m["roof"], bevel=0.005)
    return s.entregar()


def refeitorio(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0):
    """Refeitório — bloco com fita de vidro contínua e pergolado na entrada."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c, l, h = metros(22), metros(12), metros(4.0)
    y0 = _base_edificio(s, c, l)
    s.caixa("Corpo", (c, h, l), (0, 0, y0 + h * 0.5), m["white"], bevel=0.01)
    s.caixa("Platibanda", (c + metros(0.5), metros(0.7), l + metros(0.5)), (0, 0, y0 + h + metros(0.35)), m["white"], bevel=0.006)
    s.caixa("Vidro", (c * 0.9, metros(2.0), metros(0.12)), (0, l * 0.5 + metros(0.05), y0 + metros(2.4)), m["glass"], bevel=0.004)
    n = 8
    for i in range(n + 1):
        s.caixa(f"Mont{i}", (metros(0.16), metros(2.2), metros(0.2)), (-c * 0.45 + c * 0.9 * i / n, l * 0.5 + metros(0.1), y0 + metros(2.4)), m["white"], bevel=0.002)
    # Pergolado: ripado sobre a área de convivência.
    for st in (-1, 1):
        s.tubo(f"PilarP{st}", metros(0.22), metros(3.2), (c * 0.3, l * 0.5 + metros(3.6) * (1 if st > 0 else 0.2), y0 + metros(1.6)), m["steel"], verts=10)
    for i in range(9):
        s.caixa(f"Ripa{i}", (metros(0.16), metros(0.3), metros(4.4)), (c * 0.1 + i * metros(0.7), l * 0.5 + metros(2.2), y0 + metros(3.3)), m["trunk"], bevel=0.002)
    s.caixa("Cozinha", (metros(7), metros(3.4), metros(5)), (-c * 0.5 - metros(2.5), -l * 0.2, y0 + metros(1.7)), m["conc"], bevel=0.008)
    s.tubo("Coifa", metros(0.5), metros(2.4), (-c * 0.5 - metros(2.5), -l * 0.2, y0 + metros(4.4)), m["steel"], verts=12)
    _coisas_de_telhado(s, c, l, y0 + h, 2, sal + 4)
    return s.entregar()


def laboratorio(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0):
    """Laboratório de análises — bloco branco com exaustores e cilindros de gás.

    A bateria de exaustores no telhado é o que o distingue de um escritório.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco = m["steel"]
    c, l, h = metros(16), metros(10), metros(4.2)
    y0 = _base_edificio(s, c, l)
    s.caixa("Corpo", (c, h, l), (0, 0, y0 + h * 0.5), m["white"], bevel=0.01)
    s.caixa("Platibanda", (c + metros(0.4), metros(0.8), l + metros(0.4)), (0, 0, y0 + h + metros(0.4)), m["white"], bevel=0.006)
    s.janelas("Jan", m["glass"], 5, -c * 0.4, c * 0.4, l * 0.5 + metros(0.05), y0 + metros(2.6), larg=metros(1.8), alt=metros(1.4))
    s.caixa("Porta", (metros(1.6), metros(2.4), metros(0.12)), (c * 0.36, l * 0.5 + metros(0.05), y0 + metros(1.2)), m["glass"], bevel=0.004)
    s.caixa("Faixa", (c + metros(0.1), metros(0.4), l + metros(0.1)), (0, 0, y0 + metros(3.6)), m["sign_b"], bevel=0.004)
    for i in range(4):
        s.tubo(f"Exaust{i}", metros(0.4), metros(2.0), (-c * 0.28 + i * metros(3.0), -l * 0.2, y0 + h + metros(1.4)), aco, verts=12)
        s.tubo(f"Chapeu{i}", metros(0.55), metros(0.28), (-c * 0.28 + i * metros(3.0), -l * 0.2, y0 + h + metros(2.5)), aco, verts=12)
    for i in range(5):
        s.tubo(f"Cilindro{i}", metros(0.3), metros(1.7), (-c * 0.42 + i * metros(0.75), -l * 0.5 - metros(1.0), metros(0.85)), m["sig_g"] if i % 2 else m["sig_r"], verts=12)
    s.caixa("GradeCil", (metros(4.2), metros(1.2), metros(0.1)), (-c * 0.27, -l * 0.5 - metros(1.6), metros(1.0)), aco, bevel=0.003)
    return s.entregar()


def almoxarifado(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0):
    """Almoxarifado — galpão pequeno com doca elevada e rampa.

    A doca na altura da carroceria (1,2 m) é o detalhe que faz o caminhão
    encostar em vez de parar do lado.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c, l, h = metros(20), metros(12), metros(6.0)
    hd = metros(1.2)
    s.caixa("Doca", (c + metros(2), hd, l + metros(4)), (0, metros(2), hd * 0.5), m["conc_dirty"], bevel=0.008)
    s.caixa("Corpo", (c, h, l), (0, 0, hd + h * 0.5), m["white"], bevel=0.01)
    s.telhado_duas_aguas("Telh", c + metros(1), l, hd + h, hd + h + metros(2.2), m["roof"], beiral=metros(0.6))
    s.frontao("FrtA", l, hd + h, hd + h + metros(2.2), m["white"], c * 0.5)
    s.frontao("FrtB", l, hd + h, hd + h + metros(2.2), m["white"], -c * 0.5)
    for k, a in enumerate((-c * 0.26, c * 0.1)):
        s.caixa(f"Portao{k}", (metros(3.4), metros(4.0), metros(0.16)), (a, l * 0.5 + metros(0.06), hd + metros(2.0)), m["steel_y"], bevel=0.005)
        s.caixa(f"Abrigo{k}", (metros(4.0), metros(0.6), metros(1.6)), (a, l * 0.5 + metros(0.9), hd + metros(4.3)), m["black"], bevel=0.005)
    s.barra("Rampa", (-c * 0.5 - metros(5), l * 0.2, 0), (-c * 0.5 + metros(0.5), l * 0.2, hd), metros(4.0), metros(0.3), m["conc_dirty"])
    for i in range(4):
        s.caixa(f"Defensa{i}", (metros(0.4), metros(0.9), metros(0.4)), (-c * 0.36 + i * metros(5.4), l * 0.5 + metros(1.7), hd + metros(0.45)), m["sig_y"], bevel=0.004)
    s.janelas("Jan", m["janela"], 5, -c * 0.4, c * 0.4, -l * 0.5 - metros(0.06), hd + h - metros(1.4), larg=metros(1.8), alt=metros(1.2))
    return s.entregar()


def torre_agua(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, altura=None):
    """Torre d'água elevada — o cogumelo de metal da foto aérea.

    Quatro pernas inclinadas com contraventamento em X, cuba com fundo cônico e
    a escada em espiral. Marco vertical barato e imediatamente legível.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, tanque = m["steel"], m["tank"]
    h = altura if altura is not None else metros(18)
    rb, rt = metros(3.6), metros(1.4)
    for i in range(4):
        a = math.pi / 4 + i * math.pi / 2
        s.barra(f"Perna{i}", (math.cos(a) * rb, math.sin(a) * rb, 0), (math.cos(a) * rt, math.sin(a) * rt, h), metros(0.3), metros(0.3), aco)
    for k in range(3):
        f0, f1 = (k + 0.5) / 4, (k + 1.5) / 4
        r0 = rb + (rt - rb) * f0
        r1 = rb + (rt - rb) * f1
        for i in range(4):
            a0 = math.pi / 4 + i * math.pi / 2
            a1 = math.pi / 4 + (i + 1) * math.pi / 2
            s.barra(f"Anel{k}{i}", (math.cos(a0) * r0, math.sin(a0) * r0, h * f0), (math.cos(a1) * r0, math.sin(a1) * r0, h * f0), metros(0.14), metros(0.14), aco)
            s.barra(f"X{k}{i}", (math.cos(a0) * r0, math.sin(a0) * r0, h * f0), (math.cos(a1) * r1, math.sin(a1) * r1, h * f1), metros(0.1), metros(0.1), aco)
    # Cuba: fundo cônico, corpo cilíndrico e cobertura abaulada.
    s.perfil("Fundo", [(metros(0.6), h - metros(1.0)), (metros(2.4), h + metros(0.6)), (metros(3.2), h + metros(1.6))], (0, 0, 0), tanque, segs=26)
    s.tubo("Cuba", metros(3.2), metros(4.2), (0, 0, h + metros(3.7)), tanque, verts=28)
    s.tubo("Tampa", metros(3.25), metros(1.2), (0, 0, h + metros(6.4)), tanque, verts=28, r2=metros(1.2))
    s.tubo("Respiro", metros(0.3), metros(1.0), (0, 0, h + metros(7.4)), aco, verts=10)
    s.tubo("Descida", metros(0.28), h, (metros(0.9), 0, h * 0.5), aco, verts=10)
    s.escada_gato("Esc", -rb * 0.55, 0, metros(1.0), h + metros(1.4), aco)
    s.guarda_corpo("GC", [(-metros(3.4), -metros(1.6)), (metros(3.4), -metros(1.6)), (metros(3.4), metros(1.6))], metros(1.0), m["steel_y"])
    return s.entregar()
