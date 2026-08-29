"""Família G — infraestrutura. Energia, água, perímetro e o que amarra o sítio.

Referências: `design/referencias/mina-operacao-aerea.png` (a linha de postes
cruzando o terreno, os racks de tubulação amarela e a cerca de perímetro) e
`design/referencias/terminal-logistico-aereo.png` (o muro contínuo com postes
altos e o portão deslizante da portaria).

Esta é a família que muda mais a leitura por peça construída. Uma planta
industrial sem linha de energia, sem tubulação aérea e sem perímetro parece
uma coleção de maquetes soltas num gramado — que é exatamente o defeito do
tabuleiro hoje. Estes assets são o tecido conjuntivo.

Todos aceitam `comp`/`pontos` para percorrer distância: são feitos para serem
*esticados* entre dois módulos, não pousados num ponto.

Convenções: ver `base.py`.
"""

from __future__ import annotations

import math

from .base import Sitio, metros


def poste_iluminacao(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, altura=None, bracos=1):
    """Poste de rua com braço curvo e luminária — o poste comum de via.

    O braço curvo (feito de três segmentos) é o que distingue um poste de
    iluminação de um cano fincado no chão.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    h = altura if altura is not None else metros(11)
    s.caixa("Base", (metros(0.7), metros(0.5), metros(0.7)), (0, 0, metros(0.25)), m["conc_dirty"], bevel=0.004)
    s.tubo("Mastro", metros(0.16), h, (0, 0, h * 0.5 + metros(0.4)), m["conc"], verts=12, r2=metros(0.11))
    for k in range(max(1, bracos)):
        lado = 1 if k == 0 else -1
        s.barra(f"Braco{k}A", (0, 0, h * 0.94), (0, lado * metros(0.9), h + metros(0.5)), metros(0.09), metros(0.09), m["conc"])
        s.barra(f"Braco{k}B", (0, lado * metros(0.9), h + metros(0.5)), (0, lado * metros(2.4), h + metros(0.7)), metros(0.09), metros(0.09), m["conc"])
        s.caixa(f"Lumin{k}", (metros(0.55), metros(0.22), metros(1.3)), (0, lado * metros(3.0), h + metros(0.62)), m["steel"], bevel=0.004)
        s.caixa(f"Vidro{k}", (metros(0.5), metros(0.08), metros(1.1)), (0, lado * metros(3.0), h + metros(0.48)), m["glow"], bevel=0.002)
    return s.entregar()


def torre_holofote(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, altura=None, refletores=6):
    """Torre de holofotes treliçada — ilumina pátio, cava e cais.

    A coroa de refletores no topo, todos apontando para baixo e para fora, é o
    que a diferencia de uma antena.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco = m["steel"]
    h = altura if altura is not None else metros(24)
    rb, rt = metros(1.6), metros(0.6)
    s.caixa("Base", (metros(3.4), metros(0.6), metros(3.4)), (0, 0, metros(0.3)), m["conc_dirty"], bevel=0.006)
    for i in range(3):
        a = i * math.tau / 3
        s.barra(f"Perna{i}", (math.cos(a) * rb, math.sin(a) * rb, metros(0.6)), (math.cos(a) * rt, math.sin(a) * rt, h), metros(0.16), metros(0.16), aco)
    nm = 8
    for k in range(nm):
        f0, f1 = k / nm, (k + 1) / nm
        r0 = rb + (rt - rb) * f0
        r1 = rb + (rt - rb) * f1
        for i in range(3):
            a0 = i * math.tau / 3
            a1 = (i + 1) * math.tau / 3
            s.barra(f"Anel{k}{i}", (math.cos(a0) * r0, math.sin(a0) * r0, metros(0.6) + h * f0), (math.cos(a1) * r0, math.sin(a1) * r0, metros(0.6) + h * f0), metros(0.08), metros(0.08), aco)
            s.barra(f"X{k}{i}", (math.cos(a0) * r0, math.sin(a0) * r0, metros(0.6) + h * f0), (math.cos(a1) * r1, math.sin(a1) * r1, metros(0.6) + h * f1), metros(0.07), metros(0.07), aco)
    s.caixa("Coroa", (metros(2.6), metros(0.2), metros(2.6)), (0, 0, h + metros(0.7)), aco, bevel=0.004)
    for i in range(max(1, refletores)):
        a = i * math.tau / refletores
        px, pt = math.cos(a) * metros(1.2), math.sin(a) * metros(1.2)
        s.caixa(f"Ref{i}", (metros(0.8), metros(0.6), metros(0.9)), (px, pt, h + metros(1.3)), m["steel"], bevel=0.004, giro=a)
        s.caixa(f"Lente{i}", (metros(0.1), metros(0.5), metros(0.8)), (px * 1.35, pt * 1.35, h + metros(1.15)), m["glow"], bevel=0.002, giro=a)
    s.bola("Baliza", metros(0.22), (0, 0, h + metros(2.2)), m["sig_r"], segs=10)
    s.escada_gato("Esc", -rb * 0.7, 0, metros(1.0), h, aco)
    return s.entregar()


def torre_transmissao(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, altura=None):
    """Torre de linha de transmissão — a treliça de alta-tensão.

    Cintura estreita, base aberta e duas mísulas com cadeias de isoladores
    penduradas. É o objeto que faz o horizonte industrial existir.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco = m["steel"]
    h = altura if altura is not None else metros(38)
    rb, rc, rt = metros(4.2), metros(1.3), metros(1.1)
    def raio(f):
        if f < 0.45:
            return rb + (rc - rb) * (f / 0.45)
        return rc + (rt - rc) * ((f - 0.45) / 0.55)
    nm = 12
    for k in range(nm):
        f0, f1 = k / nm, (k + 1) / nm
        r0, r1 = raio(f0), raio(f1)
        cant0 = [(-r0, -r0), (r0, -r0), (r0, r0), (-r0, r0), (-r0, -r0)]
        cant1 = [(-r1, -r1), (r1, -r1), (r1, r1), (-r1, r1), (-r1, -r1)]
        for i in range(4):
            s.barra(f"Mont{k}{i}", (cant0[i][0], cant0[i][1], h * f0), (cant1[i][0], cant1[i][1], h * f1), metros(0.16), metros(0.16), aco)
            s.barra(f"Anel{k}{i}", (cant0[i][0], cant0[i][1], h * f0), (cant0[i + 1][0], cant0[i + 1][1], h * f0), metros(0.09), metros(0.09), aco)
            s.barra(f"Xa{k}{i}", (cant0[i][0], cant0[i][1], h * f0), (cant1[i + 1][0], cant1[i + 1][1], h * f1), metros(0.07), metros(0.07), aco)
            s.barra(f"Xb{k}{i}", (cant0[i + 1][0], cant0[i + 1][1], h * f0), (cant1[i][0], cant1[i][1], h * f1), metros(0.07), metros(0.07), aco)
    # Duas mísulas com três fases cada.
    for k, hy in ((0, h * 0.72), (1, h * 0.9)):
        bracoc = metros(7.5) - k * metros(1.5)
        for st in (-1, 1):
            s.barra(f"Mis{k}{st}", (0, st * rc, hy), (0, st * bracoc, hy), metros(0.13), metros(0.13), aco)
            s.barra(f"MisD{k}{st}", (0, st * bracoc, hy), (0, st * rc * 0.6, hy + metros(2.6)), metros(0.08), metros(0.08), aco)
            for i in range(4):
                s.tubo(f"Isol{k}{st}{i}", metros(0.16), metros(0.3), (0, st * bracoc * 0.94, hy - metros(0.35) - i * metros(0.35)), m["white"], verts=8)
            s.bola(f"Grampo{k}{st}", metros(0.2), (0, st * bracoc * 0.94, hy - metros(1.9)), m["black"], segs=8)
    s.barra("CaboGuarda", (0, -metros(1.0), h), (0, metros(1.0), h), metros(0.08), metros(0.08), aco)
    s.caixa("PlacaAviso", (metros(0.06), metros(0.8), metros(0.6)), (0, rb * 0.6, metros(3.0)), m["sig_y"], bevel=0.002)
    return s.entregar()


def poste_energia(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, trafo=False, altura=None):
    """Poste de distribuição de concreto com cruzeta e isoladores.

    O poste com transformador (`trafo=True`) é o que dá o "cheiro" de rede
    elétrica real; a fileira deles ao longo da estrada faz o resto.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco = m["steel"]
    h = altura if altura is not None else metros(10)
    s.caixa("Poste", (metros(0.28), h, metros(0.24)), (0, 0, h * 0.5), m["conc"], bevel=0.004)
    s.caixa("Cruzeta", (metros(0.14), metros(0.16), metros(2.4)), (0, 0, h - metros(0.5)), m["trunk"], bevel=0.003)
    for i, t in enumerate((-metros(1.0), 0, metros(1.0))):
        s.tubo(f"Isol{i}", metros(0.11), metros(0.28), (0, t, h - metros(0.26)), m["white"], verts=8)
    s.caixa("Cruzeta2", (metros(0.12), metros(0.14), metros(1.6)), (0, 0, h - metros(1.6)), m["trunk"], bevel=0.003)
    for i, t in enumerate((-metros(0.6), metros(0.6))):
        s.tubo(f"IsolB{i}", metros(0.09), metros(0.24), (0, t, h - metros(1.4)), m["white"], verts=8)
    if trafo:
        s.tubo("Trafo", metros(0.45), metros(1.2), (0, metros(0.5), h - metros(3.0)), m["tank"], verts=14)
        s.caixa("Suporte", (metros(0.1), metros(0.14), metros(1.1)), (0, metros(0.3), h - metros(2.3)), aco, bevel=0.002)
        for i in range(3):
            s.tubo(f"Bucha{i}", metros(0.07), metros(0.4), (0, metros(0.5) + (i - 1) * metros(0.25), h - metros(2.2)), m["white"], verts=6)
        s.caixa("Chave", (metros(0.1), metros(0.5), metros(0.14)), (0, -metros(0.4), h - metros(2.4)), m["black"], bevel=0.002)
    return s.entregar()


def linha_energia(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None, vaos=4, altura=None):
    """Trecho de rede aérea: postes em fila e os cabos com catenária entre eles.

    A barriga do cabo (feita de três segmentos por vão) é o que faz a linha
    parecer linha em vez de arame esticado.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c = comp if comp is not None else metros(140)
    h = altura if altura is not None else metros(10)
    n = max(2, vaos)
    passo = c / n
    for i in range(n + 1):
        a = -c * 0.5 + passo * i
        s.caixa(f"Poste{i}", (metros(0.28), h, metros(0.24)), (a, 0, h * 0.5), m["conc"], bevel=0.004)
        s.caixa(f"Cruzeta{i}", (metros(0.14), metros(0.16), metros(2.4)), (a, 0, h - metros(0.5)), m["trunk"], bevel=0.003)
        for k, t in enumerate((-metros(1.0), 0, metros(1.0))):
            s.tubo(f"Isol{i}{k}", metros(0.11), metros(0.28), (a, t, h - metros(0.26)), m["white"], verts=8)
    barriga = metros(1.2)
    for i in range(n):
        a0 = -c * 0.5 + passo * i
        for k, t in enumerate((-metros(1.0), 0, metros(1.0))):
            pontos = []
            for j in range(4):
                f = j / 3
                pontos.append((a0 + passo * f, t, h - metros(0.12) - barriga * math.sin(math.pi * f)))
            for j in range(3):
                s.barra(f"Cabo{i}{k}{j}", pontos[j], pontos[j + 1], metros(0.05), metros(0.05), m["black"])
    return s.entregar()


def pipe_rack(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None, tubos=4, niveis=2):
    """Rack de tubulação — pórticos em fila carregando tubos em dois níveis.

    Amarelo de segurança nos pórticos, tubos de diâmetros diferentes com
    isolamento em alguns. Sem rack, uma usina parece um cenário de teatro.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, amar = m["steel"], m["steel_y"]
    c = comp if comp is not None else metros(40)
    larg, h = metros(3.6), metros(6.0)
    n = max(3, int(c / metros(7)))
    for i in range(n + 1):
        a = -c * 0.5 + c * i / n
        for st in (-1, 1):
            s.barra(f"Col{i}{st}", (a, st * larg * 0.5, 0), (a, st * larg * 0.5, h), metros(0.24), metros(0.24), amar)
            s.caixa(f"Sapata{i}{st}", (metros(0.9), metros(0.6), metros(0.9)), (a, st * larg * 0.5, metros(0.3)), m["conc_dirty"], bevel=0.005)
        for k in range(niveis):
            hy = h - k * metros(2.2)
            s.barra(f"Trav{i}{k}", (a, -larg * 0.5, hy), (a, larg * 0.5, hy), metros(0.2), metros(0.24), amar)
    for k in range(niveis):
        hy = h - k * metros(2.2) + metros(0.3)
        for j in range(tubos):
            t = -larg * 0.38 + larg * 0.76 * (j + 0.5) / tubos
            raio = metros(0.24 + 0.1 * ((j + k) % 3))
            mat = m["tank"] if (j + k) % 3 == 0 else (m["steel_rust"] if (j + k) % 3 == 1 else m["white"])
            s.tubo(f"Tubo{k}{j}", raio, c, (0, t, hy + raio), mat, eixo="a", verts=14)
            if (j + k) % 4 == 0:
                for b in range(5):
                    s.tubo(f"Braca{k}{j}{b}", raio * 1.25, metros(0.2), (-c * 0.4 + b * c * 0.2, t, hy + raio), aco, eixo="a", verts=14)
    return s.entregar()


def tubulacao_aerea(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, vao=None, altura=None):
    """Travessia de tubulação sobre a via ou a estrada — pórtico e curvas.

    As curvas em U subindo dos dois lados são o detalhe que conta que os tubos
    vêm do chão e voltam para ele.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, amar = m["steel"], m["steel_y"]
    v = vao if vao is not None else metros(16)
    h = altura if altura is not None else metros(8.5)
    for sa in (-1, 1):
        s.trelica(f"Torre{sa}", (sa * v * 0.5, -metros(1.2), 0), (sa * v * 0.5, metros(1.2), 0), amar, w=metros(0.2), h=metros(0.2), montantes=2, altura=h)
        s.caixa(f"Sapata{sa}", (metros(1.4), metros(0.7), metros(3.4)), (sa * v * 0.5, 0, metros(0.35)), m["conc_dirty"], bevel=0.006)
    s.trelica("Vao", (-v * 0.5, -metros(1.0), h), (v * 0.5, -metros(1.0), h), amar, w=metros(0.18), h=metros(0.18), montantes=6, altura=metros(1.6))
    s.trelica("VaoB", (-v * 0.5, metros(1.0), h), (v * 0.5, metros(1.0), h), amar, w=metros(0.18), h=metros(0.18), montantes=6, altura=metros(1.6))
    for i, (t, raio, mat) in enumerate(((-metros(0.6), metros(0.3), m["tank"]), (0, metros(0.24), m["steel_rust"]), (metros(0.6), metros(0.35), m["white"]))):
        s.tubo(f"Tubo{i}", raio, v + metros(1.0), (0, t, h + metros(0.6)), mat, eixo="a", verts=14)
        for sa in (-1, 1):
            s.tubo(f"Curva{i}{sa}", raio, metros(1.4), (sa * (v * 0.5 + metros(0.4)), t, h + metros(0.1)), mat, verts=14)
            s.tubo(f"Desce{i}{sa}", raio, h - metros(0.6), (sa * (v * 0.5 + metros(0.4)), t, (h - metros(0.6)) * 0.5), mat, verts=14)
    s.caixa("Passarela", (v, metros(0.1), metros(1.0)), (0, metros(1.7), h + metros(0.3)), aco, bevel=0.004)
    s.guarda_corpo("GC", [(-v * 0.5, metros(2.2)), (v * 0.5, metros(2.2))], metros(1.0), amar)
    s.caixa("Gabarito", (metros(0.1), metros(0.5), metros(1.6)), (0, -metros(2.0), h - metros(0.6)), m["sig_y"], bevel=0.003)
    return s.entregar()


def cerca_industrial(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None, arame=True):
    """Cerca de tela com mourões e concertina — o perímetro de qualquer planta.

    Os três fios de arame farpado inclinados no topo custam pouco e são o que
    faz a cerca ler como cerca industrial e não como cerca de jardim.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco = m["steel"]
    c = comp if comp is not None else metros(30)
    h = metros(2.4)
    n = max(3, int(c / metros(3)))
    for i in range(n + 1):
        a = -c * 0.5 + c * i / n
        s.tubo(f"Mourao{i}", metros(0.09), h, (a, 0, h * 0.5), aco, verts=8)
        s.caixa(f"Sapata{i}", (metros(0.35), metros(0.3), metros(0.35)), (a, 0, metros(0.15)), m["conc_dirty"], bevel=0.003)
        if arame:
            s.barra(f"Bracete{i}", (a, 0, h), (a, metros(0.4), h + metros(0.4)), metros(0.05), metros(0.05), aco)
    for k, hy in ((0, metros(0.25)), (1, h - metros(0.05))):
        s.tubo(f"Trav{k}", metros(0.05), c, (0, 0, hy), aco, eixo="a", verts=8)
    # A tela: uma malha rala, feita de poucos fios visíveis por vão.
    for k in range(5):
        s.tubo(f"Fio{k}", metros(0.02), c, (0, 0, metros(0.4) + k * metros(0.45)), aco, eixo="a", verts=6)
    for i in range(n * 3):
        a = -c * 0.5 + c * (i + 0.5) / (n * 3)
        s.caixa(f"Vert{i}", (metros(0.02), h * 0.85, metros(0.02)), (a, 0, h * 0.5), aco, bevel=0.0)
    if arame:
        for k in range(3):
            s.barra(f"Farpado{k}", (-c * 0.5, metros(0.14) + k * metros(0.13), h + metros(0.14) + k * metros(0.13)), (c * 0.5, metros(0.14) + k * metros(0.13), h + metros(0.14) + k * metros(0.13)), metros(0.025), metros(0.025), aco)
    return s.entregar()


def muro_concreto(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None, placas=True):
    """Muro pré-moldado com pilares aparentes — o perímetro do terminal.

    Na referência aérea o muro é contínuo e ritmado por pilares a cada 3 m; é
    esse ritmo que impede o muro de parecer uma fita branca.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c = comp if comp is not None else metros(30)
    h = metros(3.0)
    s.caixa("Baldrame", (c, metros(0.4), metros(0.5)), (0, 0, metros(0.2)), m["conc_dirty"], bevel=0.004)
    s.caixa("Painel", (c, h - metros(0.4), metros(0.24)), (0, 0, metros(0.4) + (h - metros(0.4)) * 0.5), m["conc"], bevel=0.005)
    n = max(3, int(c / metros(3)))
    for i in range(n + 1):
        a = -c * 0.5 + c * i / n
        s.caixa(f"Pilar{i}", (metros(0.3), h + metros(0.15), metros(0.4)), (a, 0, (h + metros(0.15)) * 0.5), m["conc"], bevel=0.005)
    s.caixa("Capeamento", (c, metros(0.16), metros(0.44)), (0, 0, h + metros(0.08)), m["conc_dirty"], bevel=0.004)
    if placas:
        for k in range(2):
            s.caixa(f"Faixa{k}", (c, metros(0.06), metros(0.26)), (0, 0, metros(1.0) + k * metros(1.2)), m["sign_b"], bevel=0.002)
    return s.entregar()


def portao_deslizante(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, aberto=0.0, vao=None):
    """Portão de correr da portaria — treliça, roldanas e trilho no piso.

    `aberto` desliza a folha (0 fechado, 1 aberto). Um portão aberto com um
    caminhão entrando é a cena que faz o terminal parecer em operação.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, amar = m["steel"], m["steel_y"]
    v = vao if vao is not None else metros(8)
    h = metros(2.6)
    for sa in (-1, 1):
        s.caixa(f"Pilar{sa}", (metros(0.5), h + metros(1.0), metros(0.5)), (sa * (v * 0.5 + metros(0.3)), 0, (h + metros(1.0)) * 0.5), m["conc"], bevel=0.006)
    s.caixa("Trilho", (v * 2.2, metros(0.08), metros(0.2)), (0, metros(0.4), metros(0.04)), aco, bevel=0.002)
    desl = -v * aberto
    s.caixa("Quadro", (v, metros(0.16), metros(0.14)), (desl, metros(0.4), h), amar, bevel=0.004)
    s.caixa("QuadroB", (v, metros(0.16), metros(0.14)), (desl, metros(0.4), metros(0.2)), amar, bevel=0.004)
    for sa in (-1, 1):
        s.caixa(f"Montante{sa}", (metros(0.14), h, metros(0.14)), (desl + sa * v * 0.48, metros(0.4), h * 0.5), amar, bevel=0.004)
    n = 14
    for i in range(n):
        s.caixa(f"Grade{i}", (metros(0.06), h * 0.9, metros(0.06)), (desl - v * 0.46 + v * 0.92 * i / (n - 1), metros(0.4), h * 0.5), amar, bevel=0.0)
    for k, f in ((0, -0.36), (1, 0.36)):
        s.tubo(f"Roldana{k}", metros(0.14), metros(0.1), (desl + v * f, metros(0.4), metros(0.14)), aco, eixo="t", verts=10)
    s.caixa("Motor", (metros(0.8), metros(0.6), metros(0.5)), (v * 0.5 + metros(0.9), metros(0.4), metros(0.3)), m["sig_y"], bevel=0.004)
    s.caixa("Placa", (metros(1.6), metros(0.6), metros(0.06)), (desl, metros(0.5), h - metros(0.6)), m["sign_b"], bevel=0.003)
    return s.entregar()


def antena_comunicacao(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, altura=None):
    """Torre de comunicação estaiada com parabólicas e antenas setoriais."""
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    aco, br = m["steel"], m["white"]
    h = altura if altura is not None else metros(30)
    r = metros(0.7)
    s.caixa("Base", (metros(2.4), metros(0.6), metros(2.4)), (0, 0, metros(0.3)), m["conc_dirty"], bevel=0.005)
    for i in range(3):
        a = i * math.tau / 3
        s.barra(f"Perna{i}", (math.cos(a) * r, math.sin(a) * r, metros(0.6)), (math.cos(a) * r, math.sin(a) * r, h), metros(0.1), metros(0.1), aco)
    nm = 14
    for k in range(nm):
        h0 = metros(0.6) + (h - metros(0.6)) * k / nm
        h1 = metros(0.6) + (h - metros(0.6)) * (k + 1) / nm
        for i in range(3):
            a0, a1 = i * math.tau / 3, (i + 1) * math.tau / 3
            s.barra(f"Anel{k}{i}", (math.cos(a0) * r, math.sin(a0) * r, h0), (math.cos(a1) * r, math.sin(a1) * r, h0), metros(0.06), metros(0.06), aco)
            s.barra(f"X{k}{i}", (math.cos(a0) * r, math.sin(a0) * r, h0), (math.cos(a1) * r, math.sin(a1) * r, h1), metros(0.05), metros(0.05), aco)
    # Estais nos três sentidos, ancorados longe.
    for i in range(3):
        a = i * math.tau / 3 + math.pi / 3
        s.barra(f"Estai{i}", (0, 0, h * 0.82), (math.cos(a) * h * 0.5, math.sin(a) * h * 0.5, 0), metros(0.05), metros(0.05), aco)
        s.caixa(f"Ancora{i}", (metros(0.8), metros(0.5), metros(0.8)), (math.cos(a) * h * 0.5, math.sin(a) * h * 0.5, metros(0.25)), m["conc_dirty"], bevel=0.004)
    for k, hy in ((0, h * 0.62), (1, h * 0.82)):
        a = k * 1.2
        s.tubo(f"Parabolica{k}", metros(1.1), metros(0.25), (math.cos(a) * metros(1.2), math.sin(a) * metros(1.2), hy), br, eixo="a", giro=a, verts=20, r2=metros(0.95))
        s.tubo(f"Feixe{k}", metros(0.1), metros(0.7), (math.cos(a) * metros(1.9), math.sin(a) * metros(1.9), hy), aco, eixo="a", giro=a, verts=8)
    for i in range(3):
        a = i * math.tau / 3
        s.caixa(f"Setorial{i}", (metros(0.16), metros(1.6), metros(0.34)), (math.cos(a) * metros(1.0), math.sin(a) * metros(1.0), h - metros(1.6)), br, bevel=0.003, giro=a)
    s.bola("Baliza", metros(0.2), (0, 0, h + metros(0.6)), m["sig_r"], segs=10)
    s.caixa("Shelter", (metros(3.0), metros(2.6), metros(2.4)), (metros(3.6), 0, metros(1.3)), br, bevel=0.008)
    s.caixa("Ar", (metros(0.6), metros(0.7), metros(0.9)), (metros(2.1), 0, metros(1.8)), aco, bevel=0.004)
    return s.entregar()


def canaleta_drenagem(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, comp=None):
    """Canaleta de drenagem com grelha e caixa de passagem.

    É o item mais humilde da família e um dos que mais rendem: uma linha
    escura correndo ao lado do pátio muda a leitura do piso inteiro.
    """
    s = Sitio(name, x, z, m, yaw, escala, sal, y)
    c = comp if comp is not None else metros(20)
    s.caixa("Bordo", (c, metros(0.4), metros(1.1)), (0, 0, -metros(0.2)), m["conc_dirty"], bevel=0.004)
    s.caixa("Calha", (c, metros(0.3), metros(0.6)), (0, 0, -metros(0.14)), m["black"], bevel=0.003)
    n = max(6, int(c / metros(0.8)))
    for i in range(n):
        s.caixa(f"Grelha{i}", (metros(0.3), metros(0.08), metros(0.66)), (-c * 0.5 + c * (i + 0.5) / n, 0, metros(0.02)), m["steel_rust"], bevel=0.002)
    s.caixa("Caixa", (metros(1.2), metros(0.5), metros(1.2)), (c * 0.42, 0, -metros(0.2)), m["conc_dirty"], bevel=0.005)
    s.caixa("Tampa", (metros(1.0), metros(0.1), metros(1.0)), (c * 0.42, 0, metros(0.03)), m["steel_rust"], bevel=0.003)
    s.tubo("Bueiro", metros(0.35), metros(2.0), (c * 0.42, metros(1.2), -metros(0.3)), m["conc"], eixo="t", verts=12)
    return s.entregar()
