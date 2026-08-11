# Transformar a maquete 3D em um diorama de vitrine de feira

## 1. Contexto

Projeto escolar de feira de ciências: uma maquete ferroviária industrial física
(escala HO, com Arduino) que tem um site de documentação. O site tem uma seção
com uma maquete 3D interativa em Three.js.

**A maquete 3D atual funciona, mas está visualmente pobre**: são formas
geométricas simples sobre um plano escuro. Preciso que ela vire um **diorama de
vitrine de feira profissional**, no padrão dos estandes de grandes empresas.

O objetivo é impressionar o público na apresentação da feira.

---

## 2. Onde está o código

```
Maquete_Industrial/
└── site-ferrorama-3d/
    └── react-app/          <- rode os comandos aqui dentro
        ├── package.json
        ├── index.html
        └── src/
            ├── App.tsx
            ├── App.css                      (4046 linhas, classes .maquete3d-* no final)
            ├── lib/motion.ts                (EASE_OUT_EXPO, usePrefersReducedMotion)
            └── components/
                ├── MaqueteSection.tsx       (180 linhas — seção, carrega a cena sob demanda)
                └── maquete3d/
                    ├── Maquete3D.tsx        (492 linhas — Canvas, câmera, painel de controles)
                    ├── Modulos3D.tsx        (457 linhas — Zona, Base e os 4 módulos)
                    ├── Ferrovia.tsx         (384 linhas — trilhos + trem)
                    ├── tracado.ts           (174 linhas — GRAFO DA REDE, ver seção 4)
                    └── modulos.ts           (108 linhas — dados, paleta, posições)
```

Stack já instalada (não precisa instalar nada para o básico):

| Pacote | Versão |
|---|---|
| react / react-dom | 19.2.7 |
| three | 0.185.1 |
| @react-three/fiber | 9.6.1 |
| @react-three/drei | 10.7.7 |
| framer-motion | 12.42.2 |
| gsap | 3.12.2 |
| vite | 8.1.1 |
| oxlint | 1.71.0 |

Comandos:

```bash
cd site-ferrorama-3d/react-app
npm install          # necessário: node_modules não vem no git
npx tsc --noEmit     # tem que passar limpo
npx oxlint src       # tem que passar limpo
npm run build        # tem que passar
npm run dev          # porta 5173
```

---

## 3. REFERÊNCIA VISUAL — é isto que eu quero

Tenho uma foto de referência (maquete "Oil India — Green Hydrogen Net Zero
Campus", de um estande de feira). **O conteúdo é o meu, mas o acabamento tem
que ser esse.** Descrição do que aparece na foto:

### 3.1 A vitrine
- Todo o diorama fica dentro de uma **caixa de acrílico transparente**, com
  quinas visíveis, reflexos sutis e o logo gravado na tampa
- A caixa se apoia em um **pedestal escuro**, com o nome do projeto iluminado
  na frente e uma **placa preta com o subtítulo** em letras claras
- Fundo do ambiente escuro — a luz vem do próprio diorama

### 3.2 O terreno (nada de plano escuro liso)
- **Grama verde** cobrindo a base, com variação de tom
- **Ruas de asfalto** cinza-escuro com **faixas brancas**, formando um circuito
  que contorna e atravessa o campus
- **Veículos em miniatura** parados e circulando nas ruas: carros, caminhões,
  ônibus, caminhão-tanque
- **Árvores** espalhadas, várias em grupos, algumas formando bosques
- **Manchas de LED verde brilhante** no chão, iluminando áreas de vegetação

### 3.3 As construções
- **Prédios brancos e cinza-claro** de escritório e industriais, alturas
  variadas, com grades de janelas
- **Planta industrial** com chaminés altas, torres de destilação e tubulação
  aparente
- **Esferas brancas de armazenamento** sobre pernas metálicas, várias, com
  **brilho azul por baixo**
- **Turbinas eólicas brancas** com pás girando
- **Painéis solares** azul-escuros em fileira

### 3.4 Os efeitos que fazem a diferença
- **Reator central luminoso**: um cilindro azul brilhante com um **feixe de luz
  vertical** subindo dele
- **Painéis holográficos flutuando no ar** acima da maquete: retângulos
  translúcidos em ciano, com gráficos, barras e números falsos de telemetria.
  São o elemento mais chamativo da foto
- **Tubulações neon azuis** correndo pelo chão, ligando os módulos, brilhando
- Placas informativas pequenas em pé no terreno, iluminadas

### 3.5 Paleta da foto
| Elemento | Cor |
|---|---|
| Holográficos / HUD | ciano `#4DD8FF` translúcido |
| Reator e tubulação neon | azul `#2B5CFF` → violeta `#7B4DFF` |
| LEDs no chão | verde `#39FF6A` |
| Prédios | branco / cinza `#E8EAED` a `#B9BEC6` |
| Grama | verde médio `#3E7A44` |
| Asfalto | `#2A2D33` com faixas `#D8DCE2` |

**Decisão de paleta que você precisa tomar e me avisar:** o site hoje usa
laranja/ferrugem (`--primary: #ff8844`). A foto é azul/ciano/verde. Minha
recomendação: **dentro da vitrine use a paleta da foto** (é o visual de
exposição que eu quero) e **mantenha o laranja só no cromo HTML** em volta
(botões, títulos da página). Se você discordar, me diga por quê antes de fazer.

---

## 4. O QUE JÁ FUNCIONA E NÃO PODE QUEBRAR

Isto é o coração interativo. Foi construído e **validado**. Preserve o
comportamento; pode mexer só no visual.

### 4.1 A rede de trilhos (`tracado.ts`)

Não é um oval simples. É um **grafo de 6 trechos ligando 3 nós de desvio**, e
cada chave escolhe de verdade por onde o trem sai do nó.

Nós (coordenadas locais do módulo Ferrorama):

| Nó | Posição (x, z) | Saídas [RETO, DESVIO] | Entradas [RETO, DESVIO] |
|---|---|---|---|
| SW1 | (-3.0, -3.4) | `topo`, `diagA` | `esq`, `diagB` |
| SW2 | (-0.8, 3.4) | `esq`, `manobra` | `fundo`, `diagA` |
| SW3 | (1.6, 3.4) | `fundo`, `diagB` | `topo`, `manobra` |

Trechos: `topo` (reta de cima + curva da direita, tem o REVERSOR em t=0.42),
`fundo` (reta de baixo), `esq` (curva da esquerda), `diagA` (diagonal SW1→SW2),
`diagB` (diagonal SW3→SW1), `manobra` (desvio que sai de SW2 e volta em SW3).

**Cada nó tem exatamente 2 entradas e 2 saídas** — é isso que faz o reversor
funcionar simetricamente (indo de ré, o desvio escolhe entre as entradas).

### 4.2 Verificações já feitas — refaça se mexer na topologia

- As **16 combinações** (8 estados de chave × frente/ré) circulam sem beco sem
  saída
- Extremidades dos trechos coincidem com os nós dentro de **0,01**
- **Descoberta importante**: as diagonais ligam a reta de cima à de baixo, que
  correm em **sentidos opostos**. Quem entra numa diagonal chega na outra linha
  andando ao contrário — a virada nos nós chega a **155,7°**. Isso é uma
  propriedade real do traçado, não um bug: é a razão de a maquete ter reversor.
  Está resolvido interpolando o ângulo (máx. **18°/quadro**, virada em ~0,3 s).
  **Não remova essa suavização.**

### 4.3 Comportamentos a manter

- Trem percorre a rede; vagões seguem um **rastro de migalhas** da locomotiva
  (por isso acompanham a rota ao trocar de trecho e na ré)
- Controles: **reversor**, **SW1/SW2/SW3**, velocidade, iniciar/parar, seleção
  de zona, alternar etiquetas
- Painel mostra a **rota resultante** e destaca os trilhos em uso
- Render **pausa quando a seção sai da tela** (`frameloop` never/always)
- A cena carrega em **chunk separado** e só baixa quando a seção se aproxima,
  com timeout de segurança de 3 s caso o IntersectionObserver não dispare

---

## 5. LAYOUT OBRIGATÓRIO (planta feita no Figma)

Três zonas lado a lado. Mantenha esta disposição:

```
┌──────────────────┐   ┌────────────────────────┐   ┌──────────────────┐
│ Central de       │   │                        │   │ Aeroporto        │
│ Química          │   │      FERRORAMA         │   │ Logístico        │
├──────────────────┤   │  SW1   REVERSOR        │   ├──────────────────┤
│                  │   │      SW2  SW3          │   │ Porto            │
│ Mina             │   │                        │   │ Logístico        │
└──────────────────┘   └────────────────────────┘   └──────────────────┘
```

Posições atuais em `modulos.ts` (`POSICOES`), pode ajustar as escalas:
`quimica [-12.5,0,-5.2]`, `mina [-12.5,0,4.4]`, `ferrorama [0,0,0]`,
`aeroporto [12.5,0,-5.2]`, `porto [12.5,0,4.4]`.

---

## 6. O QUE CONSTRUIR EM CADA ZONA

Aplique o acabamento da foto ao meu conteúdo:

**Base geral** — grama, malha de ruas asfaltadas com faixas brancas ligando as
5 zonas, árvores instanciadas, veículos em miniatura circulando pelas ruas,
manchas de LED verde no chão, placas informativas iluminadas.

**Ferrorama (centro)** — os trilhos viram o elemento neon: trilhos com brilho
azul, dormentes visíveis, leito de brita. SW1/SW2/SW3 com caixa de servo,
haste indicando o estado e sinaleiro colorido. REVERSOR como um trecho isolado
destacado com caixa de comando ao lado. Uma **torre de controle luminosa** no
meio do oval com feixe vertical, no lugar do reator da foto.

**Central de Química (esq. superior)** — tanques cilíndricos com líquido
visível oscilando, tubulação ligando, painel de processo com tela acesa.
Acrescente **esferas brancas de armazenamento com brilho azul embaixo** (o
elemento mais marcante da foto).

**Mina (esq. inferior)** — montanha em degraus com dois poços, esteira
transportadora descendo, caminhão basculante que vai e volta bascula a caçamba.
Terreno de terra em vez de grama nesta zona.

**Aeroporto Logístico (dir. superior)** — pista com faixas e balizamento em
LED, terminal de carga, aeronave que taxia e decola.

**Porto Logístico (dir. inferior)** — água com reflexo, cais, guindaste de
lança móvel, navio balançando com contêineres coloridos e LED vermelho de
atracado.

**Painéis holográficos flutuantes** — 3 ou 4 acima da maquete, mostrando dados
reais da simulação: velocidade do trem, estado de SW1/SW2/SW3, sentido de
marcha, rota atual. É o efeito que mais impressiona; capriche.

---

## 7. RECEITAS TÉCNICAS

Você escolhe a implementação, mas considere:

- **Vitrine acrílica**: `meshPhysicalMaterial` com `transmission`, `thickness`,
  `roughness` baixa e `ior ~1.5`. `MeshTransmissionMaterial` do drei é mais
  bonito porém caro — se usar, meça o custo. Reforce as quinas com
  `lineSegments` + `edgesGeometry`.
- **Brilho neon**: preferir `emissive` + `emissiveIntensity` alto com
  `toneMapped={false}`. Bloom de verdade exige `@react-three/postprocessing`
  (~40 KB gzip) — **se instalar, use `SelectiveBloom` e me avise do impacto**.
  Alternativa barata: planos aditivos/sprites fazendo halo.
- **Árvores, veículos, postes**: `InstancedMesh` obrigatório. Nada de dezenas de
  meshes soltos.
- **Painéis holográficos**: um plano com `CanvasTexture` desenhada via API 2D
  dá controle total e é leve; `Html` do drei também serve mas cuidado com
  quantidade. Devem ficar levemente inclinados e oscilar de leve.
- **Feixe de luz vertical**: cone/cilindro com material aditivo, opacidade
  decrescente para cima.
- **Água**: plano com `roughness` baixa, `metalness` alta e leve distorção; não
  precisa de shader caro.
- **Sombras**: já tem `castShadow`/`receiveShadow` e `shadow-mapSize 1024`.
  Não aumente sem necessidade.
- **NÃO baixe assets externos** (modelos, HDRI, texturas de CDN). Tudo
  procedural ou embutido. O site é servido estático e não pode depender de rede.

---

## 8. ORÇAMENTO DE PERFORMANCE (isto já foi um problema)

O site era pesado e passei por uma otimização que **não pode regredir**:

| Métrica | Valor atual | Limite |
|---|---|---|
| Bundle inicial | **155,8 KB gzip** | não passar de 165 KB |
| Chunk da maquete 3D | **250,2 KB gzip** | até ~330 KB se justificar |

Regras:
- `three` tem que continuar **fora do bundle inicial** (só no chunk lazy)
- `dpr` limitado a `[1, 1.75]`
- Render pausa fora da tela
- Respeitar `prefers-reduced-motion` (já existe `usePrefersReducedMotion` em
  `src/lib/motion.ts`)
- Deve rodar em **notebook de escola com GPU integrada**. Se algo ficar pesado,
  prefira degradar o efeito a derrubar o FPS.

---

## 9. ACESSIBILIDADE (requisito, não enfeite)

- **Os controles são HTML de verdade** (`<button>`, `<input>`, `<label>`) fora
  do canvas — funcionam no teclado e no leitor de tela. **Mantenha assim.** Se
  o WebGL falhar no computador da escola, a interface continua utilizável.
- Estados em `aria-pressed`; ficha do módulo em região `aria-live`
- Alvos de toque de **44 px** em `pointer: coarse`
- Sem rolagem horizontal em 375 px de largura
- Canvas decorativo com `aria-hidden`, e a cena com rótulo descritivo

---

## 10. DADOS TÉCNICOS DO SISTEMA (para as fichas e os holográficos)

O projeto real tem backend, dashboard, gateway e firmware. Use estes dados
verdadeiros nos textos e nos painéis:

**Arquitetura**: Dashboard React ↔ Backend Express + PostgreSQL + Redis ↔
Gateway Node.js ↔ Arduino (Bluetooth/Serial). App React Native também conecta.

**Protocolo serial (Gateway ↔ Arduino)**
```
CMD|SWITCH|<id>|SET|LEFT | RIGHT | CENTER
CMD|SWITCH|<id>|ANGLE|90
ACK|SWITCH|<id>|<estado>
STATUS|SWITCH|<id>|<angulo>|<estado>|<timestamp>
```

**Eventos Socket.IO**: `switch:update`, `switch:status`, `truck:telemetry`
(`{truckId, x, y, speed, load, battery, heading}`), `gateway:status`

**Pinagem ferrovia**: servos dos desvios em D3, D5, D6, D9; HC-05 em D10/D11
(SoftwareSerial); servos com fonte 5 V externa.

**Pinagem caminhão**: direção D5, caçamba D6, motor D7; faróis D2/D3; setas
D8/D9; HC-05 na serial padrão a 9600 baud.

**Comandos do caminhão**: `F` `B` `S` `L` `R` `C`, compostos `FL` `FR` `BL`
`BR`, parada total `SC`; caçamba `U` `D` `X`; luzes `HH` `TI` `TO` `TX`.

**Escala**: HO (1:87) para trilhos e locomotiva; caminhões impressos em 3D em
PLA; aeronaves 1:500. Base de 120 cm. Arduino Mega 2560.

---

## 11. COMO VERIFICAR (leia com atenção)

**O painel de preview do navegador não compõe quadros nesta máquina.** Isso
significa que, dentro dele, `requestAnimationFrame`, `IntersectionObserver` e
`ResizeObserver` **não disparam** — o canvas nunca desenha e fica em 300×150.
Não conclua que está quebrado por causa disso.

O que dá para verificar de verdade:
1. `npx tsc --noEmit`, `npx oxlint src` e `npm run build` limpos
2. **Testes headless em Node** da matemática: rode scripts que importem `three`
   de dentro de `react-app/` e validem topologia, continuidade das curvas,
   ângulos nas junções. Foi assim que achei o problema dos 155°
3. Via `javascript_tool` no DOM: presença dos controles, `aria-pressed`,
   mudança da rota ao virar uma chave, ausência de rolagem lateral, erros de
   console
4. Compare o tamanho dos chunks antes e depois no `npm run build`

**Seja honesto no relatório final sobre o que você conseguiu ver e o que não.**
Se não viu a cena renderizada, diga isso claramente.

---

## 12. ENTREGA

- Commits em português, no padrão `feat(site-ferrorama-3d): ...`, na branch
  **`feat/dev-Caio`** (é a branch atual; o remoto é
  `https://github.com/sandersonElias/Maquete_Industrial.git`)
- Comentários no código em português, explicando o **porquê** das decisões não
  óbvias, no estilo dos arquivos existentes
- No fim, me diga: o que mudou visualmente, o impacto nos KB, o que você
  verificou e o que ficou por conferir

---

## 13. DUAS DÚVIDAS EM ABERTO

1. **"Central de Química"** aparece assim na minha planta do Figma, mas o README
   do projeto só fala em "Central de Controle" com Arduino Mega. Modelei como
   central de química (tanques e reatores). Se achar que faz mais sentido ser a
   central de controle, me pergunte antes de trocar.
2. **Viaduto**: mencionei que existe um na maquete, mas ele não está
   identificado na planta. Me pergunte onde fica e o que ele cruza antes de
   inventar.
