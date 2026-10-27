"""Família D — ferrovia. A via e o que roda sobre ela.

Referências: `design/referencias/mina-operacao-aerea.png` (o ramal servindo a
mina, com a composição de vagonetes parada ao lado do monte de estéril) e
`design/referencias/porto-maquete-navio.png` (o pátio ferroviário do porto).

A bitola aqui é **0,18** — a mesma de `curves.lay_track`, para que um asset
desta família possa ser plantado sobre a via já existente sem descalibrar. Em
metros isso é `metros(1,8)`, e é por isso que todas as medidas transversais
saem daí.

O topo do boleto fica em `metros(0,8)` acima da base do asset. Tudo que
atravessa a via — passagem de nível, chute, plataforma — nasce nessa cota.

Convenções: ver `base.py`.
"""

from __future__ import annotations

from .base import Sitio, metros

BITOLA = metros(1.8)
Y_BOLETO = metros(0.8)


def via_ferrea(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None, dormentes=None):
    """Trecho reto de via: lastro com talude, dormentes e dois trilhos.

    O lastro com ombro inclinado (e não uma placa retangular) é metade da
    leitura; a outra metade é o dormente aparecendo entre os trilhos.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c = comp if comp is not None else metros(20)
    n = dormentes if dormentes is not None else max(4, int(c / metros(0.62)))
    # Lastro em duas camadas: a de baixo mais larga, formando o talude.
    s.caixa("LastroBase", (c, metros(0.3), metros(4.4)), (0, 0, metros(0.15)), m["ballast"], bevel=0.004)
    s.caixa("LastroTopo", (c, metros(0.3), metros(3.2)), (0, 0, metros(0.42)), m["ballast"], bevel=0.004)
    for i in range(n):
        a = -c * 0.5 + c * (i + 0.5) / n
        desv = (s.rnd(i * 1.9) - 0.5) * metros(0.06)
        s.caixa(f"Dorm{i}", (metros(0.26), metros(0.22), metros(2.6)), (a, desv, metros(0.66)), m["sleeper"], bevel=0.002, giro=desv * 0.5)
    for st in (-1, 1):
        s.caixa(f"Boleto{st}", (c, metros(0.16), metros(0.14)), (0, st * BITOLA * 0.5, Y_BOLETO), m["rail"], bevel=0.002)
        s.caixa(f"Alma{st}", (c, metros(0.28), metros(0.07)), (0, st * BITOLA * 0.5, Y_BOLETO - metros(0.22)), m["rail"], bevel=0.001)
        s.caixa(f"Patim{st}", (c, metros(0.1), metros(0.24)), (0, st * BITOLA * 0.5, Y_BOLETO - metros(0.4)), m["rail"], bevel=0.001)
    return s.entregar()


def aparelho_mudanca_via(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, mao=1.0):
    """AMV completo: dormentação longa, agulha, chave, contrapeso e disco.

    `mao = +1` desvia para a esquerda, `-1` para a direita. A dormentação mais
    comprida que a da via corrente é o que denuncia um desvio numa foto aérea.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco = m["rail"]
    for i in range(9):
        a = -metros(5) + i * metros(1.4)
        comp = metros(2.8) + i * metros(0.42)
        s.caixa(f"Dorm{i}", (metros(0.26), metros(0.22), comp), (a, metros(0.2) * i * mao * 0.1, metros(0.66)), m["sleeper"], bevel=0.002)
    for st in (-1, 1):
        s.caixa(f"Reto{st}", (metros(12), metros(0.16), metros(0.14)), (0, st * BITOLA * 0.5, Y_BOLETO), aco, bevel=0.002)
    s.barra("Agulha", (-metros(3.2), BITOLA * 0.5 * mao, Y_BOLETO), (metros(6.0), metros(3.4) * mao, Y_BOLETO), metros(0.14), metros(0.16), aco)
    s.barra("AgulhaB", (-metros(1.0), -BITOLA * 0.5 * mao, Y_BOLETO), (metros(6.0), metros(1.6) * mao, Y_BOLETO), metros(0.14), metros(0.16), aco)
    s.caixa("Chave", (metros(1.4), metros(0.8), metros(1.2)), (-metros(2.8), -metros(3.4) * mao, metros(0.6)), m["steel_rust"], bevel=0.006)
    s.barra("Alavanca", (-metros(2.8), -metros(3.4) * mao, metros(1.0)), (-metros(1.4), -metros(2.6) * mao, metros(1.8)), metros(0.1), metros(0.1), m["steel"])
    s.tubo("Contrapeso", metros(0.5), metros(0.5), (-metros(3.6), -metros(3.4) * mao, metros(0.5)), m["black"], verts=12)
    s.tubo("Mastro", metros(0.12), metros(2.4), (-metros(2.8), -metros(3.4) * mao, metros(2.2)), m["black"], verts=8)
    s.caixa("Disco", (metros(0.08), metros(1.0), metros(1.0)), (-metros(2.8), -metros(3.4) * mao, metros(3.4)), m["glow"], bevel=0.003)
    return s.entregar()


def para_choque(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0):
    """Para-choque de fim de linha, com prisma de brita e placa refletiva."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco = m["steel_rust"]
    s.caixa("Prisma", (metros(3.0), metros(1.0), metros(3.2)), (0, 0, metros(0.5)), m["ballast"], bevel=0.006)
    for st in (-1, 1):
        s.caixa(f"Trilho{st}", (metros(3.6), metros(0.16), metros(0.14)), (-metros(1.6), st * BITOLA * 0.5, Y_BOLETO), m["rail"], bevel=0.002)
        s.barra(f"Rampa{st}", (-metros(0.4), st * BITOLA * 0.5, Y_BOLETO), (metros(1.2), st * BITOLA * 0.5, metros(1.8)), metros(0.16), metros(0.16), aco)
    s.caixa("Cabeceira", (metros(0.5), metros(1.2), metros(2.4)), (metros(1.4), 0, metros(1.8)), aco, bevel=0.006)
    s.caixa("Placa", (metros(0.1), metros(0.9), metros(2.0)), (metros(1.7), 0, metros(2.6)), m["sig_r"], bevel=0.003)
    for st in (-1, 1):
        s.caixa(f"Faixa{st}", (metros(0.12), metros(0.9), metros(0.5)), (metros(1.76), st * metros(0.7), metros(2.6)), m["white"], bevel=0.002)
    return s.entregar()


def marco_km(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0):
    """Marco quilométrico — barato, e é o que dá escala à linha inteira."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    s.caixa("Poste", (metros(0.28), metros(1.4), metros(0.28)), (0, 0, metros(0.7)), m["white"], bevel=0.004)
    s.caixa("Placa", (metros(0.08), metros(0.6), metros(0.7)), (0, 0, metros(1.6)), m["white"], bevel=0.003)
    s.caixa("Numero", (metros(0.1), metros(0.3), metros(0.42)), (metros(0.05), 0, metros(1.6)), m["black"], bevel=0.002)
    s.caixa("Berma", (metros(0.9), metros(0.12), metros(0.9)), (0, 0, metros(0.06)), m["ballast"], bevel=0.003)
    return s.entregar()


def passagem_nivel(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, largura=None, cruzes=True):
    """Passagem de nível: estrado entre trilhos, faixa de parada e cruz de Santo André.

    Um caminhão atravessando trilho sem isto é o erro que qualquer visitante que
    entenda de ferrovia nota na hora.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    w = largura if largura is not None else metros(7.0)
    s.caixa("EstradoI", (w, metros(0.3), BITOLA - metros(0.3)), (0, 0, Y_BOLETO - metros(0.15)), m["sleeper"], bevel=0.004)
    for st in (-1, 1):
        s.caixa(f"EstradoE{st}", (w, metros(0.3), metros(1.0)), (0, st * (BITOLA * 0.5 + metros(0.65)), Y_BOLETO - metros(0.15)), m["sleeper"], bevel=0.004)
        s.caixa(f"Asfalto{st}", (w, metros(0.2), metros(2.6)), (0, st * metros(2.6), Y_BOLETO - metros(0.3)), m["asph"], bevel=0.004)
        s.caixa(f"Parada{st}", (metros(0.5), metros(0.06), w * 0.8), (st * metros(3.0), 0, Y_BOLETO - metros(0.18)), m["paint"], bevel=0.002)
    if cruzes:
        for sa, st in ((1, 1), (-1, -1)):
            px, pt = sa * metros(3.8), st * (w * 0.5 + metros(0.8))
            s.tubo(f"Poste{sa}", metros(0.14), metros(3.0), (px, pt, metros(1.5)), m["white"], verts=10)
            for k, ang in enumerate((0.7, -0.7)):
                s.caixa(f"Cruz{sa}{k}", (metros(0.1), metros(0.3), metros(2.4)), (px, pt, metros(3.0)), m["white"], bevel=0.002, tombo=ang)
            s.bola(f"LuzPN{sa}", metros(0.2), (px, pt, metros(2.2)), m["sig_r"], segs=10)
    return s.entregar()


def sinal_ferroviario(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, aspectos=3):
    """Sinal luminoso de bloqueio, com escada e caixa de relés na base."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    s.caixa("Base", (metros(1.0), metros(0.3), metros(1.0)), (0, 0, metros(0.15)), m["conc_dirty"], bevel=0.004)
    s.tubo("Mastro", metros(0.13), metros(6.4), (0, 0, metros(3.2)), m["black"], verts=12)
    s.caixa("Cabeca", (metros(0.5), metros(1.7), metros(0.5)), (0, 0, metros(7.0)), m["black"], bevel=0.006)
    cores = (m["sig_r"], m["sig_y"], m["sig_g"])
    for i in range(min(aspectos, 3)):
        s.bola(f"Lampada{i}", metros(0.22), (0, metros(0.3), metros(7.6) - i * metros(0.6)), cores[i], segs=12)
        s.tubo(f"Pala{i}", metros(0.28), metros(0.24), (0, metros(0.42), metros(7.6) - i * metros(0.6)), m["black"], eixo="t", verts=10)
    s.caixa("Rele", (metros(1.2), metros(1.4), metros(0.8)), (metros(1.2), 0, metros(0.9)), m["steel_rust"], bevel=0.006)
    s.caixa("Placa", (metros(0.06), metros(0.5), metros(0.5)), (0, metros(0.2), metros(5.4)), m["white"], bevel=0.002)
    return s.entregar()


def locomotiva_diesel(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, cor=None):
    """Locomotiva diesel-elétrica de capô alto — o padrão da ferrovia de carga.

    Truques de três eixos, capô longo, cabine recuada e o teto com radiador e
    ventiladores. Rodada e truque desenhados de verdade, não um bloco.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    cor = cor or m["mrs_b"]
    aco, amar = m["steel"], m["mrs_y"]
    r = metros(0.55)
    hp = Y_BOLETO + metros(0.4)
    # Truques.
    for sa in (-1, 1):
        s.caixa(f"Truque{sa}", (metros(4.0), metros(0.9), metros(2.4)), (sa * metros(4.6), 0, hp + metros(0.2)), m["black"], bevel=0.006)
        for i in range(3):
            a = sa * metros(4.6) + (i - 1) * metros(1.5)
            for st in (-1, 1):
                s.tubo(f"Roda{sa}{i}{st}", r, metros(0.2), (a, st * BITOLA * 0.5, Y_BOLETO - metros(0.1) + r), m["black"], eixo="t", verts=16)
            s.tubo(f"Eixo{sa}{i}", metros(0.14), BITOLA, (a, 0, Y_BOLETO - metros(0.1) + r), aco, eixo="t", verts=10)
    # Estrado e saia.
    s.caixa("Estrado", (metros(17.5), metros(0.6), metros(3.0)), (0, 0, hp + metros(1.2)), m["black"], bevel=0.006)
    s.caixa("Saia", (metros(17.5), metros(0.35), metros(3.2)), (0, 0, hp + metros(0.85)), amar, bevel=0.004)
    # Capô longo, cabine e capô curto — as três massas da locomotiva.
    s.caixa("CapoLongo", (metros(10.5), metros(2.8), metros(2.7)), (-metros(3.0), 0, hp + metros(2.9)), cor, bevel=0.012)
    s.caixa("Cabine", (metros(3.4), metros(3.2), metros(3.0)), (metros(3.8), 0, hp + metros(3.1)), cor, bevel=0.012)
    s.caixa("CapoCurto", (metros(3.0), metros(2.2), metros(2.7)), (metros(7.0), 0, hp + metros(2.6)), cor, bevel=0.012)
    for st in (-1, 1):
        s.caixa(f"VidroL{st}", (metros(2.4), metros(1.1), metros(0.1)), (metros(3.8), st * metros(1.5), hp + metros(4.0)), m["glass"], bevel=0.003)
    s.caixa("VidroF", (metros(0.1), metros(1.2), metros(2.4)), (metros(5.5), 0, hp + metros(4.0)), m["glass"], bevel=0.003)
    # Teto: radiador, ventiladores e escapamento.
    s.caixa("Radiador", (metros(3.2), metros(0.7), metros(2.9)), (-metros(6.6), 0, hp + metros(4.5)), aco, bevel=0.006)
    for i in range(2):
        s.tubo(f"Vent{i}", metros(0.85), metros(0.4), (-metros(6.0) + i * metros(1.6), 0, hp + metros(4.6)), m["black"], verts=16)
    s.tubo("Escape", metros(0.4), metros(0.9), (metros(0.4), 0, hp + metros(4.6)), m["black"], verts=12)
    # Faixa de segurança amarela e o farol.
    s.caixa("Faixa", (metros(17.5), metros(0.5), metros(2.76)), (0, 0, hp + metros(1.7)), amar, bevel=0.004)
    s.bola("Farol", metros(0.28), (metros(8.6), 0, hp + metros(3.4)), m["amber"], segs=12)
    s.caixa("Grade", (metros(0.3), metros(1.4), metros(2.4)), (metros(8.8), 0, hp + metros(1.9)), amar, bevel=0.005)
    return s.entregar()


def vagao_gondola(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, carga=True, minerio=True):
    """Gôndola de minério — caixa aberta com nervuras verticais.

    As nervuras são o que separa uma gôndola de uma caixa de sapato, e a carga
    abaulada acima da borda é o que conta que ela está cheia.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco = m["steel_rust"]
    r = metros(0.5)
    hp = Y_BOLETO + metros(0.35)
    for sa in (-1, 1):
        s.caixa(f"Truque{sa}", (metros(2.6), metros(0.8), metros(2.2)), (sa * metros(3.0), 0, hp + metros(0.2)), m["black"], bevel=0.006)
        for i in range(2):
            a = sa * metros(3.0) + (i - 0.5) * metros(1.7)
            for st in (-1, 1):
                s.tubo(f"Roda{sa}{i}{st}", r, metros(0.2), (a, st * BITOLA * 0.5, Y_BOLETO - metros(0.1) + r), m["black"], eixo="t", verts=16)
            s.tubo(f"Eixo{sa}{i}", metros(0.13), BITOLA, (a, 0, Y_BOLETO - metros(0.1) + r), m["steel"], eixo="t", verts=10)
    s.caixa("Estrado", (metros(11.4), metros(0.5), metros(2.9)), (0, 0, hp + metros(1.1)), m["black"], bevel=0.005)
    s.caixa("Piso", (metros(11.0), metros(0.2), metros(2.7)), (0, 0, hp + metros(1.4)), aco, bevel=0.004)
    for st in (-1, 1):
        s.caixa(f"Lateral{st}", (metros(11.0), metros(2.4), metros(0.18)), (0, st * metros(1.35), hp + metros(2.5)), aco, bevel=0.005)
        for i in range(8):
            s.caixa(f"Nerv{st}{i}", (metros(0.22), metros(2.4), metros(0.16)), (-metros(4.8) + i * metros(1.38), st * metros(1.5), hp + metros(2.5)), aco, bevel=0.003)
    for sa in (-1, 1):
        s.caixa(f"Testeira{sa}", (metros(0.2), metros(2.4), metros(2.7)), (sa * metros(5.5), 0, hp + metros(2.5)), aco, bevel=0.005)
        s.tubo(f"Engate{sa}", metros(0.2), metros(1.0), (sa * metros(6.1), 0, hp + metros(1.1)), m["steel"], eixo="a", verts=10)
    if carga:
        mat = m["ore"] if minerio else m["coal"]
        for i in range(5):
            rr = s.rnd(i * 4.1)
            s.pedra(f"Carga{i}", metros(1.3 + rr * 0.4), (-metros(4.0) + i * metros(2.0), (rr - 0.5) * metros(0.8), hp + metros(3.3)), mat, (1.4, 0.45, 1.15))
    return s.entregar()


def vagao_hopper(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0):
    """Vagão hopper — tremonhas piramidais embaixo, que é o que o define.

    De lado, a silhueta em serra dos funis é imediatamente diferente da caixa
    reta da gôndola.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco = m["steel_rust"]
    r = metros(0.5)
    hp = Y_BOLETO + metros(0.35)
    for sa in (-1, 1):
        s.caixa(f"Truque{sa}", (metros(2.6), metros(0.8), metros(2.2)), (sa * metros(3.2), 0, hp + metros(0.2)), m["black"], bevel=0.006)
        for i in range(2):
            a = sa * metros(3.2) + (i - 0.5) * metros(1.7)
            for st in (-1, 1):
                s.tubo(f"Roda{sa}{i}{st}", r, metros(0.2), (a, st * BITOLA * 0.5, Y_BOLETO - metros(0.1) + r), m["black"], eixo="t", verts=16)
    s.caixa("Longarina", (metros(12.0), metros(0.5), metros(0.7)), (0, 0, hp + metros(0.9)), m["black"], bevel=0.005)
    for k in range(3):
        a = -metros(3.6) + k * metros(3.6)
        s.perfil(f"Funil{k}", [(metros(0.5), hp + metros(0.6)), (metros(1.5), hp + metros(2.0))], (a, 0, 0), aco, segs=4)
        s.caixa(f"Comporta{k}", (metros(1.2), metros(0.4), metros(1.2)), (a, 0, hp + metros(0.4)), m["steel"], bevel=0.004)
    s.caixa("Caixa", (metros(11.2), metros(2.2), metros(2.8)), (0, 0, hp + metros(3.1)), aco, bevel=0.006)
    for st in (-1, 1):
        for i in range(7):
            s.caixa(f"Nerv{st}{i}", (metros(0.22), metros(2.2), metros(0.16)), (-metros(4.5) + i * metros(1.5), st * metros(1.45), hp + metros(3.1)), aco, bevel=0.003)
        s.barra(f"Corrimao{st}", (-metros(5.6), st * metros(1.6), hp + metros(4.4)), (metros(5.6), st * metros(1.6), hp + metros(4.4)), metros(0.08), metros(0.08), m["steel_y"])
    s.caixa("Tampa", (metros(11.2), metros(0.2), metros(2.4)), (0, 0, hp + metros(4.3)), m["steel"], bevel=0.004)
    for sa in (-1, 1):
        s.tubo(f"Engate{sa}", metros(0.2), metros(1.0), (sa * metros(6.2), 0, hp + metros(0.9)), m["steel"], eixo="a", verts=10)
    return s.entregar()


def vagao_tanque(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, cor=None):
    """Vagão tanque — cilindro com cúpula, passarela e escada nas pontas."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    mat = cor or m["tank"]
    aco = m["steel"]
    r = metros(0.5)
    hp = Y_BOLETO + metros(0.35)
    for sa in (-1, 1):
        s.caixa(f"Truque{sa}", (metros(2.6), metros(0.8), metros(2.2)), (sa * metros(3.4), 0, hp + metros(0.2)), m["black"], bevel=0.006)
        for i in range(2):
            a = sa * metros(3.4) + (i - 0.5) * metros(1.7)
            for st in (-1, 1):
                s.tubo(f"Roda{sa}{i}{st}", r, metros(0.2), (a, st * BITOLA * 0.5, Y_BOLETO - metros(0.1) + r), m["black"], eixo="t", verts=16)
    s.caixa("Longarina", (metros(12.4), metros(0.45), metros(1.0)), (0, 0, hp + metros(0.9)), m["black"], bevel=0.005)
    s.tubo("Casco", metros(1.5), metros(11.0), (0, 0, hp + metros(2.5)), mat, eixo="a", verts=26)
    for sa in (-1, 1):
        s.tubo(f"Tampo{sa}", metros(1.5), metros(0.9), (sa * metros(5.6), 0, hp + metros(2.5)), mat, eixo="a", verts=26, r2=metros(1.0))
        s.tubo(f"Engate{sa}", metros(0.2), metros(1.0), (sa * metros(6.4), 0, hp + metros(0.9)), aco, eixo="a", verts=10)
        s.escada_gato(f"Esc{sa}", sa * metros(4.4), metros(1.6), hp + metros(0.9), hp + metros(4.0), aco, passo=metros(0.5))
    s.tubo("Cupula", metros(0.7), metros(0.8), (0, 0, hp + metros(4.2)), aco, verts=16)
    s.caixa("Passarela", (metros(3.0), metros(0.12), metros(1.6)), (0, 0, hp + metros(4.05)), aco, bevel=0.003)
    s.guarda_corpo("GC", [(-metros(1.5), -metros(0.7)), (metros(1.5), -metros(0.7))], metros(1.0), m["steel_y"])
    s.caixa("Faixa", (metros(11.0), metros(0.5), metros(0.1)), (0, metros(1.5), hp + metros(2.5)), m["sig_r"], bevel=0.003)
    return s.entregar()


def vagonete(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, carga=True):
    """Vagonete de mina — o carrinho basculante da via estreita.

    Aparece em fila na foto aérea, ao lado do monte de estéril. É pequeno de
    propósito: é ele que dá a escala do ramal interno da mina.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco = m["steel_rust"]
    r = metros(0.34)
    hp = Y_BOLETO
    s.caixa("Chassi", (metros(2.6), metros(0.3), metros(1.7)), (0, 0, hp + metros(0.5)), m["black"], bevel=0.004)
    for sa in (-1, 1):
        for st in (-1, 1):
            s.tubo(f"Roda{sa}{st}", r, metros(0.16), (sa * metros(0.85), st * BITOLA * 0.4, Y_BOLETO - metros(0.1) + r), m["black"], eixo="t", verts=14)
    s.perfil("Caixa", [(metros(0.9), hp + metros(0.7)), (metros(1.3), hp + metros(2.0)), (metros(1.3), hp + metros(2.1))], (0, 0, 0), aco, segs=4)
    s.tubo("Munhao", metros(0.16), metros(2.0), (0, 0, hp + metros(1.1)), m["steel"], eixo="t", verts=10)
    for sa in (-1, 1):
        s.tubo(f"Engate{sa}", metros(0.12), metros(0.6), (sa * metros(1.5), 0, hp + metros(0.5)), m["steel"], eixo="a", verts=8)
    if carga:
        for i in range(3):
            rr = s.rnd(i * 6.3)
            s.pedra(f"Carga{i}", metros(0.55 + rr * 0.2), ((i - 1) * metros(0.7), (rr - 0.5) * metros(0.5), hp + metros(2.1)), m["ore"], (1.3, 0.5, 1.2))
    return s.entregar()


def plataforma_estacao(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None, abrigo=True):
    """Plataforma com faixa amarela de segurança e abrigo de passageiros.

    A faixa amarela na borda é obrigatória e é o detalhe que faz a plataforma
    parecer plataforma em vez de calçada.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c = comp if comp is not None else metros(30)
    l, h = metros(5.0), metros(0.95)
    s.caixa("Laje", (c, h, l), (0, 0, h * 0.5), m["conc"], bevel=0.006)
    s.caixa("Face", (c + metros(0.1), metros(0.35), metros(0.15)), (0, -l * 0.5, h * 0.6), m["conc_dirty"], bevel=0.003)
    s.caixa("FaixaSeg", (c, metros(0.06), metros(0.7)), (0, -l * 0.5 + metros(0.5), h + metros(0.02)), m["paint"], bevel=0.002)
    n = max(4, int(c / metros(5)))
    for i in range(n):
        a = -c * 0.5 + c * (i + 0.5) / n
        s.tubo(f"Poste{i}", metros(0.13), metros(4.2), (a, l * 0.35, h + metros(2.1)), m["black"], verts=10)
        s.bola(f"Lamp{i}", metros(0.24), (a, l * 0.35, h + metros(4.3)), m["glow"], segs=10)
    if abrigo:
        s.caixa("AbrigoPiso", (metros(9), metros(0.1), metros(3.4)), (0, l * 0.1, h + metros(0.05)), m["conc"], bevel=0.003)
        for sa in (-1, 1):
            for st in (-1, 1):
                s.tubo(f"Pilar{sa}{st}", metros(0.13), metros(3.0), (sa * metros(4.2), l * 0.1 + st * metros(1.5), h + metros(1.5)), m["steel"], verts=10)
        s.telhado_duas_aguas("AbrigoT", metros(10), metros(4.0), h + metros(3.0), h + metros(3.8), m["roof"], espessura=metros(0.16), beiral=metros(0.5))
        s.caixa("Fundo", (metros(9), metros(2.4), metros(0.12)), (0, l * 0.1 + metros(1.7), h + metros(1.7)), m["glass"], bevel=0.004)
        s.caixa("Banco", (metros(5), metros(0.16), metros(0.6)), (0, l * 0.1 + metros(1.3), h + metros(0.6)), m["trunk"], bevel=0.004)
        s.caixa("Placa", (metros(3.0), metros(0.7), metros(0.1)), (0, l * 0.1 - metros(1.75), h + metros(3.2)), m["sign_b"], bevel=0.004)
    return s.entregar()
