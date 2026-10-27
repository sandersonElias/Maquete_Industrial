"""Fase 19 — a mina, refeita peça por peça a partir do catálogo de assets.

Esta é a primeira parte do tabuleiro reconstruída pelo método novo: em vez de
geometria escrita à mão em coordenadas de mundo, o módulo agora só **planta**
termos independentes do catálogo (`assets/`) e cuida da composição.

O que havia aqui antes era o mínimo: um cubo preto chamado `Britador`, duas
placas inclinadas fazendo as vezes de correia e duas icoesferas de minério. Da
foto de referência (`design/referencias/mina-operacao-aerea.png`) faltava tudo
o que faz uma mina parecer uma mina vista de cima:

* a **torre de extração**, que é o marco vertical e o primeiro objeto que o
  olho encontra na foto;
* uma **cadeia de beneficiamento legível** — moega, britador, peneira, correia,
  silo, tanques, espessador — em linha, com cada peça ligada à seguinte;
* a **fileira de tanques amarelos**, que é o traço cromático da referência;
* **montes de terra** de tamanhos diferentes, encostados na obra;
* linha de energia, holofote, cerca, e a miudeza de pátio (tambor, cone,
  bobina, sucata, operário) que dá escala a todo o resto.

**Onde tudo isso coube.** O pátio de britagem histórico (x de −24 a −18,2) já
estava lotado entre o barracão, a oficina e o poço de carvão, e a alça do ramal
fecha o lado leste. A faixa livre era a que fica **ao sul da cava**, em
`Z_FAIXA = −14,9`: dez unidades de comprimento por duas de profundidade, entre a
saia da cava e a borda do tabuleiro. A planta virou linear ali, que é
exatamente como ela aparece na foto de referência — a usina acompanha a via, não
se espalha em bloco.

**Sobre escala.** As máquinas antigas da cava tinham 0,52 de comprimento, ou
seja, foram desenhadas a ~1 unidade = 30 m, enquanto os galpões e o trem estão
a 1 unidade = 10 m: um fora-de-estrada saía menor que a distância entre dois
rodeiros de um vagão. As do catálogo estão certas, mas a cava tem raio 1,85 e
praça de fundo com raio 0,44 — não cabe uma máquina de 1,1 lá dentro. A saída
foi adotar **uma escala só para toda a frota da mina**, `E_MAQ = 0,5`, escolhida
pelo que cabe na cava. O caminhão continua com os mesmos 0,55 de comprimento de
antes — o que se ganha é proporção e detalhe, não tamanho. Duas escalas
diferentes para o mesmo caminhão no mesmo tabuleiro seriam piores que uma
errada: o olho compara. Corrigir de vez exige alargar a cava, o que mexe no
terreno e fica como decisão da próxima rodada.

Convenção de coordenadas e de rotação: igual ao resto (ver `process.py`).
"""

from __future__ import annotations

import math

from .assets import plantar
from .coords import COAL, IRON
from .primitives import lathe_solid

# Cota de quem pousa no pátio: acima do topo da grama e alinhada com as
# estradas de serviço (`pit.estrada_cava` usa 0,085).
Y_PATIO = 0.08

# Faixa industrial ao sul da cava — a única sobra de espaço no quadrante.
Z_FAIXA = -14.9

# Escala única da frota da mina. Ver a nota sobre escala no topo do módulo.
E_MAQ = 0.5


def cadeia_beneficiamento(m):
    """A usina em linha: moega → britador → peneira → correia → silo.

    A ordem importa mais que as peças. Vista de cima, uma usina é uma
    sequência com sentido, e é ela que faz o conjunto ler como planta em vez de
    amontoado de cilindros. Cada peça fica encostada na seguinte, e a correia
    coberta faz a costura entre a peneira e os silos.
    """
    z = Z_FAIXA
    plantar("moega", "MinaMoega", -20.0, z, m, yaw=0.0, escala=0.42, y=Y_PATIO)
    plantar("britador-mandibula", "MinaBritador", -19.0, z, m, yaw=0.0, escala=0.78, y=Y_PATIO)
    plantar("peneira-vibratoria", "MinaPeneira", -18.1, z, m, yaw=0.0, escala=0.66, y=Y_PATIO)
    # A correia sobe da peneira para a boca do silo: é o desnível que conta que
    # ela transporta, e não que é um corrimão comprido.
    plantar(
        "galeria-correia", "MinaCorreiaSilo", -17.35, z, m,
        yaw=0.0, escala=1.0, y=Y_PATIO, comp=1.3, h0=0.34, h1=0.86, cavaletes=2,
    )
    for i, x in enumerate((-16.6, -16.0)):
        plantar("silo-conico", f"MinaSilo{i}", x, z - 0.1, m, escala=0.62, sal=i * 2.3, y=Y_PATIO)


def rota_quimica(m):
    """A fileira de tanques amarelos, o espessador e o rack que os liga.

    Na referência é essa fileira de círculos amarelos que dá a cor da
    operação. O rack de tubulação existe para que os tanques não fiquem sendo
    três latas soltas: sem tubo ligando, não há processo.
    """
    z = Z_FAIXA
    for i, x in enumerate((-15.2, -14.6, -14.0)):
        plantar("tanque-agitador", f"MinaTanque{i}", x, z, m, escala=0.62, sal=i * 4.1, y=Y_PATIO)
    plantar("espessador", "MinaEspessador", -13.1, z - 0.05, m, escala=0.42, y=Y_PATIO)
    plantar(
        "pipe-rack", "MinaPipeRackUsina", -14.6, z + 0.62, m,
        yaw=0.0, escala=0.5, y=Y_PATIO, comp=3.2, tubos=3, niveis=2,
    )


def marco_vertical(m):
    """Torre de extração e torre d'água — o que se vê da mina de longe.

    O nome não pode começar por "Torre": o `OCULTOS` de `MaqueteBlender.tsx`
    esconde tudo que casa com `^torre`, e a peça sumiria da cena sem erro
    nenhum. Daí o prefixo `Mina`.
    """
    plantar("torre-extracao", "MinaTorreExtracao", -21.4, -14.35, m, yaw=0.3, escala=0.72, y=Y_PATIO)
    plantar("torre-agua", "MinaTorreAgua", -22.05, -10.75, m, escala=0.5, y=Y_PATIO)


def energia_e_luz(m):
    """Linha de energia atravessando a faixa e dois holofotes de pátio.

    A rede aérea é o que costura a mina ao resto do tabuleiro: sem ela, a usina
    é uma ilha que funciona por mágica.
    """
    # Atencao ao vao real: o `Sitio` escala o avanco, entao os cinco postes se
    # espalham por `comp * escala` = 5,4 e nao por 9,0. Com a linha em -15,85 o
    # primeiro poste nascia dentro do `MinaMonte0`. Recuada para o fundo da
    # faixa, onde rede aerea fica mesmo: atras dos montes, nao entre eles.
    plantar(
        "linha-energia", "MinaLinhaEnergia", -16.2, -16.1, m,
        yaw=0.0, escala=0.6, y=Y_PATIO, comp=9.0, vaos=4, altura=1.35,
    )
    plantar("torre-holofote", "MinaHolofoteSul", -21.35, -15.75, m, escala=0.5, y=Y_PATIO)
    plantar("torre-holofote", "MinaHolofoteLeste", -12.4, -14.4, m, escala=0.5, y=Y_PATIO)


def relevo_de_obra(m):
    """Montes de terra e afloramento — o solo remexido da referência.

    Na foto os montes aparecem aos pares e trios, de tamanhos diferentes,
    sempre encostados na estrada. Três iguais em fila denunciariam o script;
    por isso raio, altura e semente mudam em cada um.
    """
    for i, (x, z, r, h) in enumerate(
        (
            (-19.35, -15.75, 0.5, 0.19),
            (-18.45, -15.95, 0.34, 0.12),
            (-15.55, -15.8, 0.44, 0.16),
        )
    ):
        plantar("monte-terra", f"MinaMonte{i}", x, z, m, escala=1.0, sal=i * 3.7, y=Y_PATIO, raio=r, altura=h)
    plantar("afloramento-rocha", "MinaAfloramento", -12.9, -13.35, m, escala=0.7, sal=1.9, y=Y_PATIO)


def patio_e_miudezas(m):
    """A miudeza que prova a escala: sem ela a usina flutua.

    Regra da referência: peça grande sozinha parece maquete; peça grande
    cercada de peça pequena parece obra. Os nomes seguem `ADERECOS` de
    `MaqueteBlender.tsx` (`^cone`, `^tambores`, `^sucata`) para que sumam
    sozinhos no nível leve de celular.
    """
    plantar("container-escritorio", "MinaEscritorio", -20.65, -15.7, m, yaw=0.25, escala=0.9, y=Y_PATIO)
    plantar("tambores", "TamboresMinaUsina", -17.5, -15.65, m, yaw=0.4, escala=1.0, y=Y_PATIO, n=6)
    plantar("sucata", "SucataMinaUsina", -13.95, -15.75, m, yaw=0.15, escala=0.62, y=Y_PATIO)
    plantar("bobina-cabo", "MinaBobina", -16.85, -15.7, m, yaw=0.8, escala=1.0, y=Y_PATIO)
    plantar("pilha-tubos", "MinaPilhaTubos", -12.5, -15.6, m, yaw=0.1, escala=0.8, y=Y_PATIO, camadas=3)
    plantar("cone-sinalizacao", "ConeMinaUsina", -19.6, -15.0, m, yaw=0.9, escala=1.0, y=Y_PATIO, n=3, fita=True)
    plantar("placa-sinalizacao", "MinaPlacaEpi", -21.0, -15.25, m, yaw=2.4, escala=1.0, y=Y_PATIO, tipo="epi")
    # a ponta leste raspava o pe da pilha de esteril
    plantar("cerca-industrial", "CercaMinaUsina", -18.8, -13.95, m, yaw=0.0, escala=1.0, y=Y_PATIO, comp=2.4)
    plantar("cerca-industrial", "CercaMinaUsina2", -15.3, -13.95, m, yaw=0.0, escala=1.0, y=Y_PATIO, comp=2.6)
    # A canaleta corre rente a testada da usina, entre o piso da planta e a
    # faixa de trafego — a drenagem de patio industrial e justamente a linha
    # que separa a plataforma da planta da pista de rodagem. Ela so comeca
    # depois do britador: a frente da moega e area de manobra, e nenhum patio
    # poe canaleta onde o basculante entra de re.
    plantar("canaleta-drenagem", "MinaCanaleta", -17.635, -14.54, m, yaw=0.0, escala=1.0, y=Y_PATIO, comp=2.85)
    for i, (x, z, pose, yaw) in enumerate(
        (
            (-18.95, -14.28, "apontando", 1.2),
            (-18.35, -15.25, "parado", 2.6),
            (-14.9, -14.35, "agachado", 0.4),
            (-16.2, -15.35, "parado", 4.0),
        )
    ):
        plantar("operario", f"OpMinaUsina{i}", x, z, m, yaw=yaw, escala=1.0, y=Y_PATIO, pose=pose)
    for i, (x, z, yaw) in enumerate(((-20.6, -14.1, 0.3), (-17.9, -13.6, -0.2))):
        plantar("marca-pneu", f"MinaRastro{i}", x, z, m, yaw=yaw, escala=1.0, y=Y_PATIO)


def frota_superficie(m):
    """As máquinas que circulam na superfície, na mesma escala da cava.

    Um caminhão basculando ao lado da moega conta o ciclo de transporte inteiro
    numa imagem só — é a cena que a foto de referência tem e o tabuleiro não
    tinha.
    """
    # A caixa real da torre de extracao vai ate x = -20,09, quase um metro alem
    # do que a estimativa dizia: o caminhao nascia dentro dela. Aqui ele esta a
    # leste, com o avanco apontado para a moega — ou seja, bascula de re sobre a
    # boca, que e o unico jeito de um fora-de-estrada descarregar.
    plantar("caminhao-fora-estrada", "CaminhaoMinaFaixa", -19.45, -14.3, m, yaw=0.568, escala=E_MAQ, y=Y_PATIO, basculando=0.55)
    # A carregadeira estava atravessada em cima da canaleta e roçando o pe da
    # pilha de esteril. Foi para a testada leste, alinhada com a faixa: uma
    # maquina de rodas lida com o patio dos tanques, nao com o talude.
    plantar("carregadeira", "MinaCarregadeira", -15.97, -14.3, m, yaw=0.25, escala=E_MAQ, y=Y_PATIO, cacamba_h=0.35)
    plantar("motoniveladora", "MinaMotoniveladora", -13.6, -14.3, m, yaw=2.2, escala=E_MAQ, y=Y_PATIO)
    plantar("pickup", "MinaPickup", -21.0, -13.55, m, yaw=0.7, escala=E_MAQ * 1.2, y=Y_PATIO)
    plantar("caminhao-tanque", "MinaCaminhaoTanque", -12.6, -14.85, m, yaw=1.6, escala=E_MAQ, y=Y_PATIO)


def patio_britagem(m):
    """O pátio histórico, com as caixas antigas trocadas por peças de verdade.

    Continua sendo o pátio que alimenta a galeria A: o que muda é que o cubo
    preto virou britador cônico e as icoesferas viraram pilhas com ângulo de
    repouso e blocos soltos no pé.
    """
    mx, mz = IRON
    plantar("britador-conico", "MinaBritadorConico", mx - 3.55, mz + 1.55, m, yaw=0.4, escala=0.52, y=Y_PATIO)
    # A pilha estava a 0,20 dentro da doca da MinaOficina — a doca sai 0,54
    # alem da empena e ia parar no meio do minerio. Afastou 0,20 em x, o que
    # zera a invasao sem tirar a pilha do alcance da correia do britador.
    plantar("monte-minerio", "PilharOre", mx - 2.95, mz + 2.4, m, escala=1.0, sal=2.2, y=Y_PATIO, raio=0.62, altura=0.42)
    # A segunda pilha saiu: com o britador, a peneira e a correia no mesmo
    # canto, ela so cabia a 0,55 do eixo da via — abaixo do gabarito de 0,60.
    # A correia agora descarrega na pilha que ficou, subindo do britador.
    # O relatorio 3D do build pegou o que a planta nao pegava: com a correia
    # nascendo no centro do britador, 99,9% dela ficava enterrada dentro dele. O
    # tambor de cauda tem de ficar na *borda* da maquina. O angulo e 0,75 e nao
    # a linha reta ate o cume da pilha porque a oficina avanca ate x = -20,585:
    # pela reta, a correia entrava um quinto do comprimento dentro do predio.
    plantar(
        "galeria-correia", "CorreiaBritagem", mx - 3.04, mz + 1.90, m,
        yaw=0.75, escala=1.0, y=Y_PATIO, comp=0.6, h0=0.22, h1=0.46, cavaletes=1,
    )
    # o holofote ficava dentro da oficina
    plantar("torre-holofote", "LuzMinaPatio", mx - 3.8, mz + 3.5, m, escala=0.44, y=Y_PATIO)
    plantar("poste-iluminacao", "LuzMinaEstrada", mx + 0.4, mz - 4.6, m, yaw=1.5, escala=0.8, y=Y_PATIO)
    # Este poste nascia dentro da MinaOficina — 0,11 x 0,32 inteiramente dentro
    # do predio. Foi para a estrada de servico, onde ilumina o caminho.
    plantar("poste-iluminacao", "LuzMinaOficina", -21.43, -8.13, m, yaw=0.2, escala=0.8, y=Y_PATIO)
    # A cerca antiga nascia em x = -23,5: dentro do barracao e fora da borda do
    # tabuleiro (que termina em -22,7). Na testada norte ela ainda cortava a
    # pilha de carvao ao meio; agora fecha o patio acima dela.
    plantar("cerca-industrial", "CercaMina", -21.2, -3.3, m, yaw=0.0, escala=1.0, y=Y_PATIO, comp=2.2)


def poco_carvao(m):
    """O poço de carvão. A cava em si continua sendo terreno torneado.

    O que sai daqui são as caixas: o silo, a correia e o terminal viram peças
    do catálogo. `TerminalCarvao` mantém o nome porque `MaqueteBlender.tsx`
    abre exceção para ele no `OCULTOS` (`terminal(?!carvao)`).
    """
    cx, cz = COAL[0], -6.15
    # `CarvaoCava` nunca foi uma cava: o perfil sobe de raio 2,55 na base para
    # 0,06 no alto, ou seja, e um cone de 1,12 de altura — o mesmo defeito que
    # a `MinaCava` tinha antes da fase 8. E com 2,55 de raio ele engolia o
    # proprio patio: o pre-voo de layout acusou seis pecas enterradas nele,
    # inclusive o silo e a correia que existem para servi-lo. Encolhido para
    # 1,55, vira o que sempre foi na pratica: uma pilha de carvao ao lado do
    # ramal.
    lathe_solid(
        "CarvaoCava",
        [(1.55, 0.02), (1.42, 0.2), (1.12, 0.28), (0.82, 0.5), (0.46, 0.62), (0.14, 0.74), (0.04, 0.78)],
        28,
        (cx, 0.0, cz),
        m["coal"],
        displace=0.06,
        noise=1.6,
    )
    lathe_solid(
        "CarvaoFundo",
        [(0.05, 0.03), (0.46, 0.04), (0.36, 0.11), (0.07, 0.14)],
        16,
        (cx, 0.0, cz),
        m["dirt"],
        displace=0.02,
        noise=0.7,
    )
    plantar("silo-cilindrico", "SiloCarvao", cx - 2.35, cz + 1.55, m, escala=0.52, y=Y_PATIO, cor=m["black"])
    # Deslocada 0,2 para leste: com o terminal recolhido para dentro da borda do
    # tabuleiro, os dois disputavam o mesmo pedaco de chao.
    plantar(
        "galeria-correia", "CorreiaCarvao", cx - 1.15, cz + 0.95, m,
        yaw=0.5, escala=1.0, y=Y_PATIO, comp=1.6, h0=0.2, h1=0.62, cavaletes=2,
    )
    plantar("monte-minerio", "PilhaCarvao", cx - 1.55, cz + 1.9, m, escala=1.0, sal=8.3, y=Y_PATIO, raio=0.48, altura=0.32)
    plantar("poste-iluminacao", "LuzCarvao", cx - 2.1, cz + 2.15, m, yaw=2.1, escala=0.8, y=Y_PATIO)
    # Media de x = -23,24 a -22,12, e o tabuleiro acaba em -22,7: meio predio
    # pendurado no vazio. Defeito antigo, so visivel medindo a caixa no `.glb`.
    plantar("almoxarifado", "TerminalCarvao", cx - 2.55, cz + 0.35, m, yaw=0.1, escala=0.42, y=Y_PATIO)


def build_iron_mine(m):
    cadeia_beneficiamento(m)
    rota_quimica(m)
    marco_vertical(m)
    energia_e_luz(m)
    relevo_de_obra(m)
    patio_e_miudezas(m)
    frota_superficie(m)
    patio_britagem(m)
    poco_carvao(m)
