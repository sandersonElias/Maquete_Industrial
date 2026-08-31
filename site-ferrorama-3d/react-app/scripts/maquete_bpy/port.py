from __future__ import annotations

import math

import bpy

from .assets import plantar
from .coords import PORT, tloc
from .curves import smooth_keys
from .process import Y_CAIS
from .primitives import cube, empty, join, parent_keep
from .railway import poste_luz


# Onde o navio atraca. O costado fica a 0,07 da defensa do cais: encostado,
# como na foto, e nao boiando no meio do canal. O balanco da animacao foi de
# 0,16 para 0,08 justamente por causa dessa folga — com 0,16 o casco entrava
# na defensa no ponto baixo do ciclo.
#
# `E_NAVIO` junto de `C_NAVIO` e o ponto todo. So encurtar o `comp` deixava o
# navio com 3,44 de altura — mais alto que o shiploader — porque as alturas do
# asset sao fixas em `metros()` e nao acompanham o comprimento. Com escala 0,62
# e comprimento 12,9 a pegada em planta continua a mesma (8,4 x 1,31) e a
# altura cai para 2,13: a proporcao comprida e baixa da foto de referencia.
X_NAVIO, C_NAVIO, E_NAVIO = 21.9, 12.9, 0.62


def build_port(m):
    px, pz = PORT
    # Fase 7 - o cais foi estendido para leste ate x=21.0 e rebaixado para
    # topo y=0.16. Com isso a alca do ramal do porto (que ia ate x~20.4) passa
    # a correr sobre patio pavimentado em vez de sobre a agua, e a laje deixa
    # de enterrar os trilhos, que ficam em y~0.
    cube("Cais", (7.65, 0.16, 10.4), (17.175, 0.08, pz), m["conc"], 0.02)
    cube("CaisBorda", (0.18, 0.14, 10.4), (20.91, 0.21, pz), m["white"], 0.01)
    # A agua virou uma faixa ao longo de toda a borda leste do tabuleiro: um
    # tanque de 10 unidades no meio do nada nao lia como mar. A lamina fica em
    # y=0.12 - acima do topo da grama (que vai a 0.072 com o displace) para nao
    # deixar o capim atravessar o mar, e 0.04 abaixo do topo do cais.
    # Fase 12 — a laje virou so o corpo d'agua, com topo em 0,10. A superficie
    # visivel e uma malha subdividida com deslocamento, em 0,125 (harbour.py):
    # laje lisa de rugosidade 0,06 refletia uniforme e lia como plastico.
    cube("AguaCorpo", (2.6, 0.10, 33.4), (22.3, 0.05, 0.0), m["water"], 0.0)
    # ArmazemP e GalpaoP agora sao galpoes com estrutura (structures.py), e o
    # armazem saiu de cima do ramal ferroviario.
    # Recuado para abrir o corredor da galeria C (ver process.py).
    cube("SiloPorto", (1.05, 1.35, 1.05), (px - 5.3, 0.72, pz + 0.8), m["conc"], 0.04)
    poste_luz("LuzPorto0", px - 3.4, pz - 3.6, m["black"], m["glow"], 1.7)
    # LuzPorto1 e LuzPorto2 saíram de cima do pátio de estocagem e do virador.
    poste_luz("LuzPorto1", px - 4.05, pz + 4.3, m["black"], m["glow"], 1.7)
    poste_luz("LuzPorto2", px - 1.4, pz - 3.4, m["black"], m["glow"], 1.55)
    poste_luz("LuzPorto3", px - 0.4, pz - 4.2, m["black"], m["glow"], 1.45)
    # LuzPorto4 nascia dentro do portico da empilhadeira.
    poste_luz("LuzPorto4", px + 0.9, pz + 4.7, m["black"], m["glow"], 1.45)

    # --- O navio (fase 20) -----------------------------------------------
    # O que estava aqui era um bloco de 1,85 x 5,6 com dezoito conteineres
    # empilhados no conves. Alem de nao parecer com nada da foto de referencia
    # (`design/referencias/porto-maquete-navio.png`, um cargueiro de granel
    # verde, comprido e baixo, atracado paralelo ao cais), ele contradizia o
    # proprio cais: a cadeia daqui e virador de vagoes -> correia -> galeria D
    # -> shiploader, ou seja granel. Shiploader nao carrega porta-conteiner.
    #
    # O asset traz o que faz o navio ler como navio: faixa vermelha de fundo e
    # boot top preta na linha d agua, amurada, escotilhas com tampa amarela e
    # guincho ao lado, castelo de popa de quatro andares com janela — e e a
    # fileira de janelinhas que da escala ao casco inteiro.
    #
    # A proporcao sai de `escala` e `comp` juntos — ver a nota em `E_NAVIO`.
    navio = empty("Navio", (X_NAVIO, 0.0, pz))
    for peca in plantar(
        "navio-graneleiro", "NavioCargueiro", X_NAVIO, pz, m,
        yaw=math.pi / 2, y=-0.05, escala=E_NAVIO, comp=C_NAVIO, poroes=4,
    ):
        parent_keep(peca, navio)

    # --- O guindaste do cais (fase 20) -----------------------------------
    # Era um cilindro liso de 2,85 com uma caixa de 2,85 fazendo de lanca: a
    # silhueta mais pobre do tabuleiro, num ponto onde o olho sempre para.
    # Virou o guindaste de torre do catalogo — mastro de quatro cordoalhas com
    # X entre modulos, coroa de giro, cabine envidracada, lanca trelicada,
    # contra-lanca com contrapeso, e o carro corredico com cabo e gancho. Sem a
    # contra-lanca o olho le uma maquina prestes a tombar, e e o vazio entre as
    # barras que separa trelica de poste.
    #
    # O mastro recuou de x 20,35 para 20,10: a base de 0,6 caia em cima da
    # defensa do cais. A lanca encurtou de 2,85 para 1,6 porque com 2,85 a ponta
    # passava do costado e ia parar do outro lado do navio.
    gx, gz = 20.1, 12.15
    H_TORRE, L_LANCA = 2.5, 1.6
    pecas = [p for p in plantar(
        "guindaste-torre", "GuindPortico", gx, gz, m,
        yaw=0.0, y=Y_CAIS, altura=H_TORRE, lanca=L_LANCA, juntar=False,
    ) if p]
    # Num guindaste de torre gira tudo o que esta acima da coroa. O cabo e o
    # gancho ja vem do asset, entao a carga nao precisa mais ser uma caixa
    # pendurada no ar por conta propria.
    GIRAM = ("Coroa", "Cabine", "Lanca", "Contra", "PicoA", "Tirante", "Carro", "CaboG", "Gancho")
    corte = len("GuindPortico")
    moveis = [p for p in pecas if p.name[corte:].startswith(GIRAM)]
    fixas = [p for p in pecas if p not in moveis]
    join("GuindMastro", fixas)
    guind = empty("GuindLanca", (gx, Y_CAIS + H_TORRE + 0.2, gz))
    parent_keep(join("GuindLancaConj", moveis), guind)
    bpy.context.view_layer.update()
    for f in range(1, 241):
        u = (f - 1) / 240.0 * math.tau
        guind.rotation_euler = (0, 0, 0.12 + 0.82 * math.sin(u))
        guind.keyframe_insert("rotation_euler", frame=f)
    smooth_keys(guind)

    for f in range(1, 241):
        u = (f - 1) / 240.0 * math.tau
        navio.location = tloc(
            X_NAVIO + 0.08 * math.sin(u),
            0.03 * math.sin(u * 2.0 + 0.4),
            pz + 0.15 * math.cos(u * 0.85),
        )
        navio.rotation_euler = (0.03 * math.sin(u * 1.4), 0, 0.04 * math.sin(u))
        navio.keyframe_insert("location", frame=f)
        navio.keyframe_insert("rotation_euler", frame=f)
    smooth_keys(navio)
    return navio
