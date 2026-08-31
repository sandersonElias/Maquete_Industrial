"""Referencial local de um asset — a peça que faltava para haver "termo independente".

Todo módulo anterior desta maquete escreve geometria em **coordenadas de
mundo**: `cube("Silo", ..., (-19.4, 1.2, 5.8), ...)`. Isso amarra a peça ao
ponto onde ela nasceu. Não dá para repetir, não dá para girar, não dá para
avaliar sozinha, e quando a peça está feia não há como consertá-la sem mexer no
tabuleiro inteiro. É por isso que a qualidade estagnou: nada aqui era uma
unidade.

Um asset deste pacote é o contrário disso. Ele é escrito inteiro em
**(avanço, lateral, altura)** — o referencial da própria peça — e o `Sitio`
converte para o mundo na hora de plantar. Consequências práticas:

* a mesma função serve para os doze galpões do tabuleiro, cada um num ângulo;
* dá para renderizar um asset isolado numa folha de contato e julgá-lo;
* consertar um asset conserta todas as suas instâncias de uma vez;
* nenhum asset conhece outro asset — a única dependência é `primitives`.

Convenções (as mesmas do resto do projeto, ver `process.py`):

* `avanço` é o eixo longitudinal da peça, `+x` quando `yaw = 0`;
* `lateral` é `+z` quando `yaw = 0`;
* `altura` é `y`, e `0` é o chão onde a peça pousa;
* `rot = (roll, yaw, pitch)`, porque `primitives.cube` repassa
  `rotation=(rot[0], rot[2], rot[1])`.

**Escala.** O tabuleiro tem duas medidas conflitantes herdadas: a bitola de
`0,18` implica 1 unidade ~ 8,9 m, e o operário de `0,15` de altura implica
1 unidade ~ 12 m. Os assets adotam **1 unidade = 10 m** — entre as duas — e
`metros()` existe para que o dimensionamento fique explícito no código em vez de
sair de um número mágico. Uma carreta de 18 m vira `metros(18)`, e quem ler
sabe de onde veio.
"""

from __future__ import annotations

import math

from ..primitives import cube, cyl, ico, join, lathe_solid, sphere

# Metros por unidade do tabuleiro. Ver a nota de escala no topo do módulo.
ESCALA_M = 10.0


def metros(v: float) -> float:
    """Converte uma medida real em unidades do tabuleiro."""
    return v / ESCALA_M


def ruido(a: float, b: float, sal: float = 0.0) -> float:
    """Pseudoaleatório estável: a mesma entrada dá sempre o mesmo valor.

    Variação procedural só serve se for reprodutível — senão cada build move o
    tabuleiro inteiro e nenhuma comparação com a referência vale.
    """
    n = math.sin(a * 127.1 + b * 311.7 + sal * 74.7) * 43758.5453
    return n - math.floor(n)


def _eixo(p0, p1):
    dx, dy, dz = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
    horiz = math.hypot(dx, dz)
    return math.hypot(horiz, dy), math.atan2(dz, dx), -math.atan2(dy, horiz)


def _mid(p0, p1):
    return ((p0[0] + p1[0]) * 0.5, (p0[1] + p1[1]) * 0.5, (p0[2] + p1[2]) * 0.5)


class Sitio:
    """O referencial local onde um asset é construído.

    Instancie, empilhe peças com os métodos abaixo (sempre em coordenadas
    locais) e devolva com `entregar()`. O nome de cada peça já sai prefixado,
    o que mantém o roteamento por prefixo de `main.py` funcionando.
    """

    def __init__(self, name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0):
        self.name = name
        self.x = float(x)
        self.z = float(z)
        self.y = float(y)
        self.m = m
        self.yaw = float(yaw)
        self.e = float(escala)
        self.sal = float(sal)
        self.pecas = []
        self._co = math.cos(self.yaw)
        self._si = math.sin(self.yaw)

    # -- referencial ------------------------------------------------------

    def pt(self, a, t, h):
        """(avanço, lateral, altura) local para (x, y, z) de mundo."""
        a, t, h = a * self.e, t * self.e, h * self.e
        return (self.x + self._co * a - self._si * t, self.y + h, self.z + self._si * a + self._co * t)

    def rnd(self, sal=0.0):
        """Sorteio estável desta instância — muda de peça para peça no tabuleiro."""
        return ruido(self.x + self.sal, self.z - self.sal, sal)

    # -- primitivas em coordenadas locais ---------------------------------

    def caixa(self, suf, dims, pos, mat, bevel=0.018, giro=0.0, tombo=0.0):
        """Bloco de `(comprimento, altura, largura)` centrado em `pos`.

        `tombo` inclina a peça em torno do próprio eixo longitudinal — é como
        se faz água de telhado, lateral de caçamba e cruz de Santo André.

        Passe por aqui, nunca escrevendo `rotation_euler` direto: `cube()`
        repassa `rot=(a, b, c)` como Euler XYZ `(a, c, b)` do Blender, ou seja
        `Rz(b)·Ry(c)·Rx(a)` — a inclinação vem antes do giro, que é a ordem
        certa. Escrever `rotation_euler = (tombo, yaw, 0)` gira em torno do eixo
        errado *e* joga o yaw fora, e o defeito só aparece quando a peça é
        plantada fora do eixo.
        """
        comp, alt, larg = (d * self.e for d in dims)
        ob = cube(f"{self.name}{suf}", (comp, alt, larg), self.pt(*pos), mat, bevel * self.e, rot=(tombo, self.yaw + giro, 0))
        self.pecas.append(ob)
        return ob

    def tubo(self, suf, r, comp, pos, mat, eixo="y", giro=0.0, verts=16, r2=None):
        """Cilindro ou cone. `eixo`: `y` vertical, `a` no avanço, `t` na lateral."""
        if eixo == "y":
            rot = (0, self.yaw + giro, 0)
        elif eixo == "a":
            rot = (0, self.yaw + giro, math.pi / 2)
        else:
            rot = (0, self.yaw + giro + math.pi / 2, math.pi / 2)
        ob = cyl(
            f"{self.name}{suf}", r * self.e, comp * self.e, self.pt(*pos), mat, verts, rot,
            None if r2 is None else r2 * self.e,
        )
        self.pecas.append(ob)
        return ob

    def bola(self, suf, r, pos, mat, escala=(1, 1, 1), segs=24):
        ob = sphere(f"{self.name}{suf}", r * self.e, self.pt(*pos), mat, escala, segs)
        self.pecas.append(ob)
        return ob

    def pedra(self, suf, r, pos, mat, escala=(1, 1, 1), sub=1):
        """Icosaedro de poucas subdivisões — massa irregular barata."""
        ob = ico(f"{self.name}{suf}", r * self.e, self.pt(*pos), mat, sub, escala)
        self.pecas.append(ob)
        return ob

    def barra(self, suf, p0, p1, w, h, mat, bevel=0.0):
        """Perfil reto entre dois pontos locais — a base de toda treliça."""
        w0, w1 = self.pt(*p0), self.pt(*p1)
        comp, yaw, pitch = _eixo(w0, w1)
        ob = cube(
            f"{self.name}{suf}", (comp, h * self.e, w * self.e), _mid(w0, w1), mat, bevel * self.e,
            rot=(0, yaw, pitch),
        )
        self.pecas.append(ob)
        return ob

    def perfil(self, suf, perfil, pos, mat, segs=32, displace=0.0):
        """Sólido de revolução a partir de `[(raio, altura), ...]` local."""
        pf = [(r * self.e, h * self.e) for r, h in perfil]
        ob = lathe_solid(f"{self.name}{suf}", pf, segs, self.pt(*pos), mat, displace * self.e)
        self.pecas.append(ob)
        return ob

    # -- padrões que se repetem em quase todo asset industrial ------------

    def trelica(self, suf, p0, p1, mat, w=0.012, h=0.012, montantes=5, altura=0.0):
        """Viga treliçada: dois banzos, montantes e diagonais em zigue-zague.

        Estrutura metálica vazada é o que separa uma maquete industrial de uma
        pilha de caixas. Sai cara em objeto, barata em vértice.
        """
        if altura <= 0:
            altura = h * 6
        self.barra(f"{suf}BanzoI", p0, p1, w, h, mat)
        s0 = (p0[0], p0[1], p0[2] + altura)
        s1 = (p1[0], p1[1], p1[2] + altura)
        self.barra(f"{suf}BanzoS", s0, s1, w, h, mat)
        n = max(2, montantes)
        for i in range(n + 1):
            t = i / n
            pa = (p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, p0[2] + (p1[2] - p0[2]) * t)
            pb = (pa[0], pa[1], pa[2] + altura)
            self.barra(f"{suf}Mont{i}", pa, pb, w * 0.8, h * 0.8, mat)
            if i < n:
                t2 = (i + 1) / n
                pc = (
                    p0[0] + (p1[0] - p0[0]) * t2,
                    p0[1] + (p1[1] - p0[1]) * t2,
                    p0[2] + (p1[2] - p0[2]) * t2 + altura,
                )
                self.barra(f"{suf}Diag{i}", pa, pc, w * 0.7, h * 0.7, mat)

    def telhado_duas_aguas(self, suf, comp, larg, h_beiral, h_cume, mat, espessura=0.02, beiral=0.03):
        """Duas águas de verdade: dois planos inclinados que se encontram no cume.

        Uma laje plana em cima de uma caixa lê como caixa. É o item que mais
        rápido tira a cara de "bloco" de um galpão.
        """
        meia = larg * 0.5 + beiral
        subida = h_cume - h_beiral
        incl = math.atan2(subida, meia)
        agua = math.hypot(meia, subida)
        for lado in (-1, 1):
            ob = cube(
                f"{self.name}{suf}A{lado}",
                (comp * self.e, espessura * self.e, agua * self.e),
                self.pt(0, lado * meia * 0.5, (h_beiral + h_cume) * 0.5),
                mat,
                0.004 * self.e,
                rot=(-lado * incl, self.yaw, 0),
            )
            self.pecas.append(ob)
        self.caixa(f"{suf}Cume", (comp + beiral, espessura * 1.6, espessura * 3), (0, 0, h_cume), mat, bevel=0.003)

    def frontao(self, suf, larg, h_beiral, h_cume, mat, a, espessura=0.03):
        """Tapa o triângulo do oitão. Sem isto o galpão fica aberto na ponta."""
        n = 4
        for i in range(n):
            t0, t1 = i / n, (i + 1) / n
            l0 = larg * (1 - t0)
            hy = h_beiral + (h_cume - h_beiral) * (t0 + t1) * 0.5
            alt = (h_cume - h_beiral) / n
            self.caixa(f"{suf}F{i}", (espessura, alt, l0), (a, 0, hy), mat, bevel=0.002)

    def janelas(self, suf, mat, n, a0, a1, t, h, larg=0.055, alt=0.075):
        """Fileira de janelas. É o que informa quantos andares um prédio tem."""
        for i in range(n):
            f = (i + 0.5) / n
            self.caixa(f"{suf}{i}", (larg, alt, 0.012), (a0 + (a1 - a0) * f, t, h), mat, bevel=0.002)

    def escada_gato(self, suf, a, t, h0, h1, mat, passo=0.05):
        """Escada de marinheiro com guarda-corpo — todo silo e torre tem uma."""
        self.barra(f"{suf}L0", (a, t - 0.018, h0), (a, t - 0.018, h1), 0.006, 0.006, mat)
        self.barra(f"{suf}L1", (a, t + 0.018, h0), (a, t + 0.018, h1), 0.006, 0.006, mat)
        n = max(2, int((h1 - h0) / passo))
        for i in range(n):
            hy = h0 + (h1 - h0) * (i + 0.5) / n
            self.barra(f"{suf}D{i}", (a, t - 0.018, hy), (a, t + 0.018, hy), 0.004, 0.004, mat)

    def guarda_corpo(self, suf, pontos, h, mat, montante=0.055):
        """Corrimão de plataforma: dois travessões e montantes."""
        for i in range(len(pontos) - 1):
            a0, t0 = pontos[i]
            a1, t1 = pontos[i + 1]
            for k, hy in ((0, h), (1, h * 0.55)):
                self.barra(f"{suf}T{i}_{k}", (a0, t0, hy), (a1, t1, hy), 0.006, 0.006, mat)
            comp = math.hypot(a1 - a0, t1 - t0)
            n = max(1, int(comp / montante))
            for j in range(n + 1):
                f = j / n
                self.barra(
                    f"{suf}M{i}_{j}",
                    (a0 + (a1 - a0) * f, t0 + (t1 - t0) * f, 0),
                    (a0 + (a1 - a0) * f, t0 + (t1 - t0) * f, h),
                    0.006, 0.006, mat,
                )

    def esteira_rodante(self, suf, comp, larg, mat_correia, mat_aco, roletes=7, h=0.0):
        """Correia com roletes aparentes, deitada no avanço."""
        self.caixa(f"{suf}Correia", (comp, 0.012, larg), (0, 0, h), mat_correia, bevel=0.002)
        for i in range(roletes):
            a = -comp * 0.5 + comp * (i + 0.5) / roletes
            self.tubo(f"{suf}Rol{i}", larg * 0.12, larg * 1.04, (a, 0, h - 0.014), mat_aco, eixo="t", verts=12)

    # -- entrega ----------------------------------------------------------

    def entregar(self, juntar=True):
        """Devolve o asset. Fundido numa malha só, salvo quando pedido em partes.

        Fundir é a decisão certa por padrão: num celular o que pesa é a
        contagem de chamadas de desenho, não a de vértices.
        """
        pecas = [p for p in self.pecas if p]
        if juntar and len(pecas) > 1:
            return [join(self.name, pecas)]
        return pecas
