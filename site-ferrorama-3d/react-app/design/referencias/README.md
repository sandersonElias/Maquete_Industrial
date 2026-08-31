# Referências visuais da maquete

As fotos que sustentam o desenho de cada asset. Elas estão versionadas de
propósito: o campo `ref` de `scripts/maquete_bpy/assets/catalogo.py` aponta
para os arquivos daqui, e um asset sem referência é um asset inventado.

| Arquivo | O que é | Assets que saíram daqui |
|---|---|---|
| `mina-cava-ferromodelismo.png` | Cava em bancadas de uma maquete de ferromodelismo: pá de cabo azul, escavadeira hidráulica amarela, caminhões fora-de-estrada, trator de esteiras, perfuratriz. | quase toda a família `extracao`, mais `cone-sinalizacao` e `operario` |
| `mina-operacao-aerea.png` | Operação de mina vista de cima, dominada pela torre de extração e pelos montes de estéril. Galpões brancos, tanques amarelos, torre d'água, contêineres, ramal com vagonetes. | `beneficiamento` inteira, boa parte de `edificacoes` e de `infraestrutura`, `vagonete`, `monte-terra` |
| `porto-maquete-navio.png` | Maquete de porto fluvial: cargueiro verde atracado, guindaste treliçado sobre esteiras, guindaste de torre vermelho, escavadeira descarregando o porão. | família `porto` inteira, `locomotiva-diesel`, `vagao-tanque`, `plataforma-estacao` |
| `terminal-logistico-aereo.png` | Campus industrial: bloco administrativo envidraçado, telhado com painel solar, cobertura de estacionamento, muro de perímetro, carreta na doca. | `predio-administrativo`, `predio-vidro`, `almoxarifado`, `muro-concreto`, `portao-deslizante`, quase toda a família `rodoviario` |
| `fabrica-corte-didatico.png` | Modelo didático de fábrica em corte, com o fluxo sinalizado por setas e as áreas rotuladas. | referência de **organização**: é dela que vem a ideia de o fluxo ser legível de cima |
| `arvores-ferromodelismo.png` | Sortimento de árvores de maquete escolhido pelo usuário como padrão de vegetação. | família `vegetacao` inteira |

## Como ler estas fotos

Três coisas se repetem nas seis e são as que mais faltavam no tabuleiro:

1. **Nada está intocado.** Há rastro de pneu, poça, torrão caído, mancha de
   óleo. Um piso limpo lê como maquete de escritório.
2. **Peça grande vem cercada de peça pequena.** O que dá escala ao galpão é o
   cone laranja e o tambor encostados nele, não o galpão em si.
3. **A estrutura metálica é vazada.** Treliça, escada de gato, guarda-corpo.
   Feita de caixas maciças, ela fica pesada e morta.
