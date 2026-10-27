# Catálogo de assets da maquete

106 peças, cada uma um **termo independente**: uma função pura que constrói a
peça em coordenadas locais e a planta onde e no ângulo que se pedir.

## Por que este pacote existe

Até aqui todo módulo da maquete escrevia geometria em coordenadas de mundo:

```python
cube("Silo", (0.9, 1.2, 0.9), (-19.4, 1.2, 5.8), m["tank"], 0.02)
```

Isso amarra a peça ao ponto onde ela nasceu. Não dá para repetir, não dá para
girar, não dá para avaliar sozinha, e consertar o silo exige mexer no
tabuleiro. É por isso que a qualidade estagnou: nada era uma unidade.

Um asset daqui é o contrário. Ele é escrito inteiro em **(avanço, lateral,
altura)** e o `Sitio` converte para o mundo na hora de plantar:

```python
from .assets import plantar

plantar("silo-conico", "SiloEmbarque", -19.4, 5.8, m, yaw=0.4, altura=1.9)
```

Consequências práticas:

- a mesma função serve para os doze galpões do tabuleiro, cada um num ângulo;
- dá para renderizar um asset isolado e julgá-lo;
- consertar um asset conserta todas as suas instâncias de uma vez;
- nenhum asset conhece outro — a única dependência é `primitives`.

## Como usar

Assinatura idêntica em todos os 106:

```python
fn(name, x, z, m, yaw=0.0, escala=1.0, sal=0.0, y=0.0, **especificos)
```

| Parâmetro | O que é |
|---|---|
| `name` | prefixo dos objetos criados (importa: `main.py` roteia coleção por prefixo) |
| `x`, `z` | onde plantar, em coordenadas de mundo do tabuleiro |
| `m` | a paleta devolvida por `materials.make_palette()` |
| `yaw` | giro em torno da vertical, em radianos |
| `escala` | multiplicador de tamanho da peça inteira |
| `sal` | tempero do sorteio determinístico; muda a variação sem mudar a posição |
| `y` | cota da base, para pousar a peça na altura certa do terreno |

Devolve a lista de objetos criados — normalmente um só, porque `entregar()`
funde tudo numa malha (o que pesa num celular é a contagem de chamadas de
desenho, não a de vértices).

Prefira sempre `plantar(slug, ...)` a importar a função direto: assim o slug
passa a ser a referência única e trocar a implementação de um asset não obriga
a mexer em quem o usa.

## Escala

**1 unidade = 10 m.** O tabuleiro herdou duas medidas conflitantes — a bitola
de `0,18` implica 1 u ≈ 8,9 m e o operário de `0,15` de altura implica
1 u ≈ 12 m. Os assets adotam o meio-termo e usam `metros()` para que todo
dimensionamento fique explícito no código:

```python
s.caixa("Bau", (metros(13.2), metros(2.9), metros(2.55)), ...)   # 13,2 m
```

A bitola em `ferrovia.py` é a exceção: ela é `metros(1,8) = 0,18` de propósito,
para casar exatamente com a via já existente em `curves.lay_track`.

## Famílias

| Família | N | Assunto |
|---|---|---|
| `extracao` | 14 | cava, máquinas de lavra, montes, taludes |
| `beneficiamento` | 13 | moega → britagem → peneira → tanques → silo → embarque |
| `edificacoes` | 13 | galpões, administrativo, oficina, subestação, torre d'água |
| `ferrovia` | 12 | via, AMV, sinal, locomotiva e quatro tipos de vagão |
| `porto` | 11 | pórtico, guindastes, shiploader, navio, barcaça, contêiner |
| `rodoviario` | 10 | caminhões, carreta, van, picape, carro, ônibus, empilhadeira |
| `infraestrutura` | 12 | postes, torres, rack de tubo, cerca, muro, portão, antena |
| `patio` | 13 | tambores, palete, bobina, caçamba, cone, placa, sucata, operário |
| `vegetacao` | 8 | as cinco espécies de árvore, capim, toco, afloramento |

## Referências

Todo asset declara no catálogo de qual foto ele saiu. As fotos vivem em
`design/referencias/`. **Um asset sem referência é um asset inventado** — foi
assim que a qualidade caiu antes, e o campo `ref` existe para tornar isso
visível numa revisão.

## Folha de contato

Não dá para consertar qualidade que não se enxerga. O script abaixo gera um
`.glb` com todos os assets lado a lado, cada um numa célula com placa de
concreto, etiqueta com o slug e um operário do lado servindo de régua:

```bash
~/.claude/bpy-env/Scripts/python.exe scripts/gerar_folha_assets.py -- public/models/assets-catalogo.glb

# só uma família, ou um asset só, para iterar rápido
... -- saida.glb extracao porto
... -- saida.glb slug:silo-conico
```

Sai também um `assets-catalogo.json` com o índice (slug, família, referência,
pegada e posição na folha).

## Ao acrescentar um asset

1. escreva a função no módulo da família, usando só `Sitio` e `metros()`;
2. registre no `catalogo.py` com pegada e imagem de referência;
3. gere a folha filtrando por `slug:` e olhe a peça sozinha antes de plantá-la;
4. só então use `plantar()` no módulo de montagem.
