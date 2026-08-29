"""Família B — beneficiamento. O caminho do minério entre a cava e o vagão.

Referência: `design/referencias/mina-operacao-aerea.png`. O que ela mostra e o
tabuleiro não tinha é que a usina é uma **sequência legível**: moega, britador,
peneira, esteira, tanques amarelos, espessador, silo, embarque. Cada peça está
ligada à seguinte por uma correia ou um tubo visível, e é essa costura que faz
a planta parecer uma planta em vez de um amontoado de cilindros.

Os assets daqui têm todos uma **boca de entrada em cima e uma boca de saída
embaixo**, nas mesmas posições relativas, para que encadeá-los seja trivial:
`saida()` de um casa com `entrada()` do próximo.

Convenções: ver `base.py`.
"""

from __future__ import annotations

import math

from .base import Sitio, metros


def moega(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, largura=None):
    """Moega de recebimento — onde o caminhão despeja o minério bruto.

    Tem grelha por cima (para barrar matacão), tremonha piramidal e a rampa de
    acesso que dá sentido ao conjunto: sem a rampa, o caminhão não chega.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, conc = m["steel"], m["conc_dirty"]
    w = largura if largura is not None else metros(9)
    h = metros(6)
    # Estrutura de concreto e tremonha invertida.
    for sa in (-1, 1):
        for st in (-1, 1):
            s.caixa(f"Pilar{sa}{st}", (metros(1.0), h, metros(1.0)), (sa * w * 0.45, st * w * 0.45, h * 0.5), conc, bevel=0.008)
    s.perfil("Tremonha", [(w * 0.55, h), (w * 0.42, h * 0.62), (w * 0.16, h * 0.28), (w * 0.13, h * 0.16)], (0, 0, 0), m["steel_rust"], segs=4)
    # Grelha: barras paralelas, não uma tampa. A grelha é o traço reconhecível.
    for i in range(9):
        t = -w * 0.5 + w * (i + 0.5) / 9
        s.caixa(f"Grelha{i}", (w * 1.05, metros(0.35), metros(0.32)), (0, t, h + metros(0.2)), aco, bevel=0.004)
    for sa in (-1, 1):
        s.caixa(f"Guia{sa}", (metros(0.5), metros(1.6), w * 1.1), (sa * w * 0.52, 0, h + metros(0.8)), m["steel_y"], bevel=0.008)
    # Rampa de acesso do caminhão.
    s.caixa("Rampa", (w * 2.2, metros(0.5), w * 0.8), (-w * 1.5, 0, h * 0.5), m["dirt"], bevel=0.02, giro=0.0)
    s.barra("RampaPiso", (-w * 2.6, 0, 0), (-w * 0.55, 0, h), w * 0.8, metros(0.4), m["dirt"])
    s.caixa("Descarga", (metros(2.0), metros(1.4), metros(2.0)), (0, 0, metros(0.9)), aco, bevel=0.008)
    return s.entregar()


def britador_mandibula(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0):
    """Britador de mandíbulas — o primeiro estágio, sempre o mais bruto.

    Corpo em cunha, volante grande de um lado e motor com correias do outro:
    é o volante que o identifica de longe.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, ferr = m["steel"], m["steel_rust"]
    s.caixa("Base", (metros(7.0), metros(1.2), metros(5.0)), (0, 0, metros(0.6)), m["conc_dirty"], bevel=0.01)
    s.caixa("Corpo", (metros(5.2), metros(4.4), metros(3.6)), (0, 0, metros(3.4)), ferr, bevel=0.014)
    s.perfil("Boca", [(metros(2.6), metros(3.0)), (metros(2.2), metros(1.6)), (metros(0.8), metros(0.2))], (0, 0, metros(5.4)), aco, segs=4)
    for st in (-1, 1):
        s.tubo(f"Volante{st}", metros(2.0), metros(0.5), (metros(0.4), st * metros(2.1), metros(3.6)), aco, eixo="t", verts=22)
        s.tubo(f"Cubo{st}", metros(0.5), metros(0.8), (metros(0.4), st * metros(2.2), metros(3.6)), ferr, eixo="t", verts=12)
    s.caixa("Motor", (metros(2.2), metros(1.6), metros(1.6)), (-metros(3.4), metros(2.4), metros(2.2)), m["steel_y"], bevel=0.01)
    s.barra("Correia", (-metros(3.4), metros(2.4), metros(2.6)), (metros(0.4), metros(2.2), metros(3.6)), metros(0.5), metros(0.12), m["belt"])
    s.caixa("Saida", (metros(2.4), metros(1.0), metros(2.4)), (0, 0, metros(1.4)), aco, bevel=0.008)
    s.escada_gato("Esc", -metros(2.8), -metros(2.0), 0, metros(5.2), aco)
    s.guarda_corpo("GC", [(-metros(2.6), -metros(2.2)), (metros(2.6), -metros(2.2)), (metros(2.6), metros(2.2))], metros(1.1), m["steel_y"])
    return s.entregar()


def britador_conico(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0):
    """Britador cônico — segundo estágio. Silhueta de sino sobre pernas."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, ferr = m["steel"], m["steel_rust"]
    for i in range(4):
        a = math.pi / 4 + i * math.pi / 2
        s.barra(f"Perna{i}", (math.cos(a) * metros(3.4), math.sin(a) * metros(3.4), 0), (math.cos(a) * metros(2.2), math.sin(a) * metros(2.2), metros(3.0)), metros(0.4), metros(0.4), aco)
    s.perfil(
        "Corpo",
        [
            (metros(2.4), metros(3.0)), (metros(3.2), metros(4.4)), (metros(3.3), metros(6.0)),
            (metros(2.6), metros(7.2)), (metros(1.5), metros(8.0)), (metros(1.5), metros(8.6)),
        ],
        (0, 0, 0), ferr, segs=26,
    )
    s.tubo("Tampa", metros(1.9), metros(0.7), (0, 0, metros(8.9)), aco, verts=24, r2=metros(1.2))
    s.tubo("Alim", metros(0.9), metros(1.8), (0, 0, metros(9.9)), aco, verts=16)
    s.caixa("Motor", (metros(2.6), metros(1.5), metros(1.5)), (metros(4.2), 0, metros(3.6)), m["steel_y"], bevel=0.01)
    s.barra("Eixo", (metros(4.2), 0, metros(3.6)), (metros(2.0), 0, metros(4.6)), metros(0.3), metros(0.3), aco)
    s.perfil("Chute", [(metros(1.6), metros(3.0)), (metros(0.9), metros(1.2)), (metros(0.9), 0)], (0, 0, 0), aco, segs=4)
    s.escada_gato("Esc", -metros(3.0), 0, 0, metros(7.4), aco)
    return s.entregar()


def peneira_vibratoria(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, decks=2):
    """Peneira vibratória inclinada — separa por tamanho.

    Caixa inclinada com dois ou três decks, molas grandes nos quatro cantos e
    motovibrador na lateral. É a inclinação que a torna reconhecível.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, amar = m["steel"], m["steel_y"]
    for sa in (-1, 1):
        for st in (-1, 1):
            hp = metros(4.0) + sa * metros(1.2)
            s.barra(f"Perna{sa}{st}", (sa * metros(4.0), st * metros(2.2), 0), (sa * metros(4.0), st * metros(2.2), hp), metros(0.35), metros(0.35), aco)
            s.tubo(f"Mola{sa}{st}", metros(0.42), metros(0.9), (sa * metros(4.0), st * metros(2.2), hp + metros(0.45)), m["sig_y"], verts=12)
    for d in range(decks):
        hy = metros(5.2) + d * metros(1.3)
        s.caixa(f"Deck{d}", (metros(9.0), metros(0.25), metros(4.4)), (0, 0, hy), amar, bevel=0.006, giro=0.0)
        for st in (-1, 1):
            s.caixa(f"Lateral{d}{st}", (metros(9.0), metros(1.1), metros(0.25)), (0, st * metros(2.2), hy + metros(0.5)), amar, bevel=0.006)
    s.caixa("Caixa", (metros(9.2), metros(0.4), metros(4.6)), (0, 0, metros(4.9)), m["steel_rust"], bevel=0.008)
    s.caixa("Vibrador", (metros(1.6), metros(1.2), metros(1.0)), (metros(1.6), metros(2.6), metros(6.2)), m["black"], bevel=0.008)
    s.barra("Alim", (-metros(5.4), 0, metros(7.4)), (-metros(3.4), 0, metros(6.4)), metros(2.6), metros(0.3), aco)
    # Duas saídas: passante e retido — é o que explica para que serve a peneira.
    s.perfil("ChutePass", [(metros(1.4), metros(4.6)), (metros(0.8), metros(2.0)), (metros(0.8), 0)], (metros(2.6), 0, 0), aco, segs=4)
    s.perfil("ChuteRet", [(metros(1.4), metros(4.6)), (metros(0.8), metros(2.0)), (metros(0.8), 0)], (metros(5.2), 0, 0), aco, segs=4)
    return s.entregar()


def silo_conico(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, altura=None, raio=None):
    """Silo cilíndrico sobre saia cônica e pernas — o silo clássico de mina.

    Aros de reforço, escada de gato com guarda-corpo e a válvula de descarga
    embaixo. Sem os aros o cilindro lê como lata.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, tanque = m["steel"], m["tank"]
    h = altura if altura is not None else metros(16)
    r = raio if raio is not None else metros(3.4)
    hp = h * 0.32
    for i in range(6):
        a = i * math.tau / 6
        s.barra(f"Perna{i}", (math.cos(a) * r * 0.95, math.sin(a) * r * 0.95, 0), (math.cos(a) * r * 0.8, math.sin(a) * r * 0.8, hp), metros(0.38), metros(0.38), aco)
        a2 = (i + 1) * math.tau / 6
        s.barra(f"Contra{i}", (math.cos(a) * r * 0.95, math.sin(a) * r * 0.95, metros(0.4)), (math.cos(a2) * r * 0.8, math.sin(a2) * r * 0.8, hp), metros(0.18), metros(0.18), aco)
    s.perfil("Cone", [(metros(0.7), hp * 0.55), (r * 0.6, hp * 0.85), (r, hp * 1.05)], (0, 0, 0), tanque, segs=24)
    s.tubo("Corpo", r, h - hp * 1.05 - metros(0.6), (0, 0, (hp * 1.05 + h - metros(0.6)) * 0.5), tanque, verts=26)
    s.tubo("Tampa", r * 1.02, metros(1.4), (0, 0, h - metros(0.3)), tanque, verts=26, r2=r * 0.45)
    for k in range(3):
        s.tubo(f"Aro{k}", r * 1.04, metros(0.28), (0, 0, hp * 1.05 + (h - hp - metros(1)) * (k + 1) / 4), m["steel_rust"], verts=26)
    s.tubo("Valvula", metros(0.75), metros(1.2), (0, 0, hp * 0.42), m["steel_rust"], verts=12)
    s.escada_gato("Esc", r * 1.1, 0, metros(0.6), h - metros(0.6), aco)
    s.guarda_corpo("GC", [(-r * 0.9, -r * 0.5), (r * 0.9, -r * 0.5), (r * 0.9, r * 0.5)], metros(1.0), m["steel_y"])
    return s.entregar()


def silo_cilindrico(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, altura=None, raio=None, cor=None):
    """Silo assentado direto no chão, com teto cônico — o tanque de estoque.

    Mais gordo e mais baixo que o silo de embarque; costuma vir em bateria de
    dois ou três, que é como aparece na referência.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    mat = cor or m["tank"]
    h = altura if altura is not None else metros(9)
    r = raio if raio is not None else metros(4.0)
    s.tubo("Base", r * 1.12, metros(0.7), (0, 0, metros(0.35)), m["conc_dirty"], verts=26)
    s.tubo("Corpo", r, h, (0, 0, h * 0.5 + metros(0.6)), mat, verts=28)
    s.tubo("Teto", r * 1.03, metros(2.2), (0, 0, h + metros(1.6)), mat, verts=28, r2=r * 0.2)
    s.tubo("Respiro", metros(0.4), metros(1.2), (0, 0, h + metros(3.0)), m["steel"], verts=10)
    for k in range(2):
        s.tubo(f"Aro{k}", r * 1.03, metros(0.3), (0, 0, metros(0.6) + h * (k + 1) / 3), m["steel_rust"], verts=28)
    s.escada_gato("Esc", -r * 1.06, 0, metros(0.6), h + metros(0.6), m["steel"])
    s.tubo("Bocal", metros(0.6), metros(1.6), (r * 0.7, 0, metros(1.2)), m["steel_rust"], eixo="a", verts=12)
    return s.entregar()


def tanque_agitador(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, cor=None):
    """Tanque agitador sobre plataforma — os tambores amarelos da referência.

    O motor com o redutor no topo e a passarela ligando os tanques é o que
    forma aquela fileira reconhecível de círculos amarelos vista de cima.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    mat = cor or m["steel_y"]
    aco = m["steel"]
    r, h = metros(3.0), metros(5.0)
    s.tubo("Corpo", r, h, (0, 0, h * 0.5 + metros(1.6)), mat, verts=26)
    s.tubo("Fundo", r, metros(1.8), (0, 0, metros(1.3)), mat, verts=26, r2=metros(0.6))
    s.tubo("Topo", r * 1.03, metros(0.35), (0, 0, h + metros(1.7)), m["steel_rust"], verts=26)
    for i in range(4):
        a = math.pi / 4 + i * math.pi / 2
        s.barra(f"Perna{i}", (math.cos(a) * r * 0.8, math.sin(a) * r * 0.8, 0), (math.cos(a) * r * 0.8, math.sin(a) * r * 0.8, metros(1.8)), metros(0.34), metros(0.34), aco)
    # Ponte do agitador e motorredutor.
    s.caixa("Ponte", (r * 2.2, metros(0.25), metros(1.0)), (0, 0, h + metros(2.0)), aco, bevel=0.006)
    s.caixa("Motor", (metros(1.4), metros(1.5), metros(1.2)), (0, 0, h + metros(2.8)), m["black"], bevel=0.008)
    s.tubo("Redutor", metros(0.55), metros(1.0), (0, 0, h + metros(1.9)), aco, verts=12)
    s.tubo("Eixo", metros(0.22), h * 0.7, (0, 0, h * 0.55), aco, verts=8)
    s.tubo("Transbordo", metros(0.4), metros(2.4), (r * 0.9, 0, h + metros(1.2)), aco, eixo="a", verts=10)
    s.escada_gato("Esc", -r * 1.05, 0, 0, h + metros(1.9), aco)
    s.guarda_corpo("GC", [(-r * 0.8, -r * 0.8), (r * 0.8, -r * 0.8), (r * 0.8, r * 0.8)], metros(1.0), m["steel_y"])
    return s.entregar()


def espessador(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, raio=None):
    """Espessador — o tanque raso e largo com a ponte diametral girando.

    Vista de cima é um disco com uma barra atravessando: das formas mais
    reconhecíveis de uma usina, e uma das que faltavam aqui.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, conc = m["steel"], m["conc_dirty"]
    r = raio if raio is not None else metros(9)
    h = metros(3.2)
    s.tubo("Parede", r, h, (0, 0, h * 0.5), conc, verts=32)
    s.tubo("Polpa", r * 0.94, metros(0.3), (0, 0, h - metros(0.5)), m["tailings"], verts=32)
    s.tubo("Canaleta", r * 1.06, metros(0.5), (0, 0, h - metros(0.1)), conc, verts=32)
    # Ponte diametral com o mecanismo central.
    s.caixa("Ponte", (r * 2.1, metros(0.3), metros(1.4)), (0, 0, h + metros(0.5)), aco, bevel=0.008)
    s.guarda_corpo("GC", [(-r, -metros(0.7)), (r, -metros(0.7))], metros(1.0), m["steel_y"])
    s.guarda_corpo("GC2", [(-r, metros(0.7)), (r, metros(0.7))], metros(1.0), m["steel_y"])
    s.tubo("Coluna", metros(1.1), h + metros(2.6), (0, 0, (h + metros(2.6)) * 0.5), aco, verts=16)
    s.caixa("Acionamento", (metros(2.2), metros(1.6), metros(2.2)), (0, 0, h + metros(2.0)), m["steel_y"], bevel=0.01)
    s.tubo("Alimentacao", metros(0.55), r * 0.9, (r * 0.5, 0, h + metros(1.4)), aco, eixo="a", verts=12)
    for i in range(3):
        a = i * math.tau / 3
        s.barra(f"Rastelo{i}", (0, 0, metros(0.6)), (math.cos(a) * r * 0.86, math.sin(a) * r * 0.86, metros(0.35)), metros(0.3), metros(0.3), m["steel_rust"])
    return s.entregar()


def celula_flotacao(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, celulas=4):
    """Bateria de células de flotação — caixas quadradas em cascata.

    Vêm sempre em fila e em degraus decrescentes, com calha de espuma na
    lateral. É a fileira que faz a leitura, nunca uma célula sozinha.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, amar = m["steel"], m["steel_y"]
    lado = metros(3.4)
    for i in range(celulas):
        a = -celulas * lado * 0.5 + lado * (i + 0.5)
        hq = metros(4.6) - i * metros(0.35)
        s.caixa(f"Cel{i}", (lado * 0.94, hq, lado), (a, 0, metros(1.4) + hq * 0.5), amar, bevel=0.01)
        s.caixa(f"Base{i}", (lado * 0.94, metros(1.4), lado), (a, 0, metros(0.7)), m["conc_dirty"], bevel=0.008)
        s.tubo(f"Motor{i}", metros(0.6), metros(1.3), (a, 0, metros(1.4) + hq + metros(0.7)), m["black"], verts=12)
        s.caixa(f"Calha{i}", (lado * 0.94, metros(0.7), metros(0.7)), (a, lado * 0.62, metros(1.4) + hq * 0.86), aco, bevel=0.006)
        s.tubo(f"Ar{i}", metros(0.2), metros(1.6), (a, -lado * 0.4, metros(1.4) + hq + metros(0.4)), aco, verts=8)
    s.caixa("Passarela", (celulas * lado, metros(0.2), metros(1.1)), (0, -lado * 0.95, metros(5.4)), aco, bevel=0.006)
    s.guarda_corpo("GC", [(-celulas * lado * 0.5, -lado * 0.95), (celulas * lado * 0.5, -lado * 0.95)], metros(1.0), amar)
    return s.entregar()


def filtro_prensa(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, placas=12):
    """Filtro prensa — a pilha de placas entre dois cabeçotes.

    O ritmo das placas é o detalhe: uma caixa lisa não vira filtro prensa.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, amar = m["steel"], m["steel_y"]
    comp = metros(8)
    s.caixa("Base", (comp * 1.15, metros(1.0), metros(3.6)), (0, 0, metros(0.5)), m["conc_dirty"], bevel=0.008)
    for st in (-1, 1):
        s.tubo(f"Viga{st}", metros(0.3), comp, (0, st * metros(1.3), metros(3.2)), aco, eixo="a", verts=12)
    for i in range(placas):
        a = -comp * 0.42 + comp * 0.84 * i / max(1, placas - 1)
        s.caixa(f"Placa{i}", (metros(0.24), metros(3.0), metros(3.2)), (a, 0, metros(3.2)), amar, bevel=0.004)
    s.caixa("CabecoteF", (metros(0.9), metros(3.6), metros(3.6)), (comp * 0.5, 0, metros(3.2)), aco, bevel=0.008)
    s.caixa("CabecoteT", (metros(0.9), metros(3.6), metros(3.6)), (-comp * 0.5, 0, metros(3.2)), aco, bevel=0.008)
    s.tubo("Hidraulico", metros(0.55), metros(2.6), (-comp * 0.68, 0, metros(3.2)), m["steel_rust"], eixo="a", verts=14)
    s.caixa("Bomba", (metros(1.8), metros(1.4), metros(1.4)), (-comp * 0.62, metros(2.6), metros(1.7)), m["black"], bevel=0.008)
    s.caixa("Correia", (comp * 0.9, metros(0.12), metros(1.2)), (0, 0, metros(1.3)), m["belt"], bevel=0.004)
    return s.entregar()


def galeria_correia(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None, h0=None, h1=None, cavaletes=3):
    """Trecho de correia transportadora coberta, sobre cavaletes.

    É o cordão que amarra a usina inteira. `h0` e `h1` permitem subir ou descer
    ao longo do vão, que é como ela realmente liga um britador a um silo.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, amar = m["steel"], m["steel_y"]
    c = comp if comp is not None else metros(30)
    a0 = h0 if h0 is not None else metros(3)
    a1 = h1 if h1 is not None else metros(9)
    p0, p1 = (-c * 0.5, 0, a0), (c * 0.5, 0, a1)
    larg = metros(2.0)
    for st in (-1, 1):
        s.barra(f"Banzo{st}", (p0[0], st * larg * 0.5, p0[2]), (p1[0], st * larg * 0.5, p1[2]), metros(0.22), metros(0.22), aco)
        s.barra(f"BanzoS{st}", (p0[0], st * larg * 0.5, p0[2] + metros(2.4)), (p1[0], st * larg * 0.5, p1[2] + metros(2.4)), metros(0.22), metros(0.22), aco)
    n = 10
    for i in range(n + 1):
        t = i / n
        ax = p0[0] + (p1[0] - p0[0]) * t
        ay = p0[2] + (p1[2] - p0[2]) * t
        for st in (-1, 1):
            s.barra(f"Mont{i}{st}", (ax, st * larg * 0.5, ay), (ax, st * larg * 0.5, ay + metros(2.4)), metros(0.16), metros(0.16), aco)
        s.barra(f"Trav{i}", (ax, -larg * 0.5, ay + metros(2.4)), (ax, larg * 0.5, ay + metros(2.4)), metros(0.16), metros(0.16), aco)
    # Cobertura em arco raso e a correia lá dentro.
    s.barra("Teto", (p0[0], 0, p0[2] + metros(2.8)), (p1[0], 0, p1[2] + metros(2.8)), larg * 1.15, metros(0.2), m["roof"])
    s.barra("Correia", (p0[0], 0, p0[2] + metros(0.5)), (p1[0], 0, p1[2] + metros(0.5)), larg * 0.7, metros(0.1), m["belt"])
    s.barra("Piso", (p0[0], larg * 0.62, p0[2] + metros(0.4)), (p1[0], larg * 0.62, p1[2] + metros(0.4)), metros(0.9), metros(0.08), aco)
    # Cavaletes até o chão, escolhidos longe das pontas.
    for k in range(max(0, cavaletes)):
        t = (k + 1) / (cavaletes + 1)
        ax = p0[0] + (p1[0] - p0[0]) * t
        ay = p0[2] + (p1[2] - p0[2]) * t
        for st in (-1, 1):
            s.barra(f"Cav{k}{st}", (ax, st * larg * 0.5, 0), (ax, st * larg * 0.5, ay), metros(0.3), metros(0.3), amar)
        s.barra(f"CavX{k}", (ax, -larg * 0.5, 0), (ax, larg * 0.5, ay), metros(0.14), metros(0.14), amar)
    return s.entregar()


def torre_transferencia(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, altura=None):
    """Torre de transferência — onde uma correia entrega para a próxima.

    Sem ela, duas galerias em ângulos diferentes se cruzam no ar. É a peça que
    torna a cadeia de processo crível.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, amar = m["steel"], m["steel_y"]
    h = altura if altura is not None else metros(18)
    lado = metros(3.6)
    for sa in (-1, 1):
        for st in (-1, 1):
            s.barra(f"Perna{sa}{st}", (sa * lado, st * lado, 0), (sa * lado * 0.72, st * lado * 0.72, h), metros(0.42), metros(0.42), amar)
    for k in range(5):
        f = (k + 1) / 6
        r = lado * (1 - 0.28 * f)
        hy = h * f
        cantos = [(-r, -r), (r, -r), (r, r), (-r, r), (-r, -r)]
        for i in range(4):
            s.barra(f"Anel{k}{i}", (cantos[i][0], cantos[i][1], hy), (cantos[i + 1][0], cantos[i + 1][1], hy), metros(0.2), metros(0.2), amar)
            s.barra(f"Dg{k}{i}", (cantos[i][0], cantos[i][1], hy), (cantos[i + 1][0], cantos[i + 1][1], hy + h / 6), metros(0.15), metros(0.15), amar)
    # Casa de transferência no topo, revestida.
    ct = lado * 0.9
    s.caixa("Casa", (ct * 2, metros(6.0), ct * 2), (0, 0, h + metros(3.0)), m["roof"], bevel=0.012)
    s.telhado_duas_aguas("CasaT", ct * 2.1, ct * 2.1, metros(6.0), metros(7.6), m["roof"], beiral=metros(0.4))
    s.caixa("Porta", (metros(0.1), metros(2.2), metros(1.4)), (ct, 0, h + metros(1.1)), m["steel_rust"], bevel=0.004)
    s.perfil("Chute", [(metros(1.4), metros(3.0)), (metros(0.8), metros(1.0)), (metros(0.8), 0)], (0, 0, 0), aco, segs=4)
    s.escada_gato("Esc", -lado * 1.05, 0, 0, h + metros(2.0), aco)
    return s.entregar()


def chute_carga(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0):
    """Chute de carregamento sobre a via — o ponto onde o vagão é enchido.

    Portal a cavalo sobre o trilho, tremonha, sino telescópico e a luz âmbar
    que sinaliza carregamento. É o elo final da cadeia.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, amar = m["steel"], m["steel_y"]
    vao = metros(4.4)
    h = metros(9)
    for sa in (-1, 1):
        for st in (-1, 1):
            s.barra(f"Perna{sa}{st}", (sa * metros(2.6), st * vao, 0), (sa * metros(2.6), st * vao, h), metros(0.34), metros(0.34), amar)
        s.barra(f"Trav{sa}", (sa * metros(2.6), -vao, h), (sa * metros(2.6), vao, h), metros(0.28), metros(0.28), amar)
        s.barra(f"Dg{sa}", (sa * metros(2.6), -vao, metros(2)), (sa * metros(2.6), vao, h), metros(0.14), metros(0.14), amar)
    s.caixa("Plataforma", (metros(6.0), metros(0.2), vao * 2.1), (0, 0, h + metros(0.2)), aco, bevel=0.006)
    s.guarda_corpo("GC", [(-metros(2.8), -vao), (metros(2.8), -vao), (metros(2.8), vao)], metros(1.0), amar)
    s.perfil("Tremonha", [(metros(2.4), h + metros(4.4)), (metros(2.0), h + metros(2.0)), (metros(0.85), h + metros(0.4))], (0, 0, 0), m["steel_rust"], segs=16)
    s.tubo("Sino", metros(1.1), metros(2.2), (0, 0, h - metros(1.0)), aco, verts=18, r2=metros(0.75))
    s.tubo("Bocal", metros(0.8), metros(1.4), (0, 0, h - metros(2.4)), m["steel_rust"], verts=14)
    s.bola("LuzCarga", metros(0.4), (metros(2.6), vao * 0.9, h + metros(0.9)), m["amber"], segs=12)
    return s.entregar()
