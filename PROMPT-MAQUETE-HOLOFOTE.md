# Maquete 3D: virar o holofote do site, destravar a rolagem e descrever cada área ao clicar

## 0. IMPORTANTE — este site é DESKTOP-ONLY

**O site só vai ser visto em desktop/notebook, nunca em celular.** Isso muda o
trabalho:

- **Não implemente nada de responsividade para mobile.** Sem media queries de
  celular, sem tratamento de toque/touch, sem breakpoints pensando em telas
  pequenas. Se algo do código atual já trata mobile, pode remover — não é
  desperdício, é simplificação.
- Onde este documento mencionar comportamento de toque/celular em alguma seção
  mais abaixo, **ignore essa parte** — ela ficou de uma versão anterior do
  pedido. A seção 5 já foi reescrita sem isso; se sobrar alguma referência solta
  em outra seção, desconsidere.
- Foque 100% a experiência em mouse + teclado, em telas de desktop.

## 1. O que eu quero (resumo)

A maquete 3D já existe e funciona, mas:

1. **Está pequena.** Ela é o holofote do site — quero que ocupe a tela, bem
   grandona, com opção de tela cheia.
2. **Trava a rolagem da página.** Quando o mouse passa por cima da maquete não
   consigo rolar o site normalmente. Isso tem que acabar.
3. **Clicar não descreve nada direito.** Quero que, ao clicar em qualquer ponto
   da maquete, apareça uma descrição daquele lugar — por exemplo, cliquei na
   Central de Química, aparece um texto explicando a importância do laboratório
   dentro da empresa.

Além disso, na seção 3.1 abaixo estão **bugs concretos já encontrados no
código** que causam os problemas 2 e 3 — corrija exatamente esses pontos, não
é preciso reinvestigar do zero.

---

## 2. Onde está o código

```
Maquete_Industrial/
└── site-ferrorama-3d/
    └── react-app/          <- rode os comandos aqui dentro
        └── src/
            ├── App.css                       (4046+ linhas, .maquete3d-* no final)
            ├── lib/motion.ts                 (usePrefersReducedMotion)
            └── components/
                ├── MaqueteSection.tsx        (seção; monta a cena sob demanda)
                └── maquete3d/
                    ├── Maquete3D.tsx         (Canvas, câmera, OrbitControls, painel)
                    ├── Modulos3D.tsx         (Zona, Predio, PlantaIndustrial, 4 módulos)
                    ├── Cenario.tsx           (vitrine, pedestal, terreno, ruas, árvores…)
                    ├── Hologramas.tsx        (3 painéis de telemetria em CanvasTexture)
                    ├── Ferrovia.tsx          (trilhos + trem)
                    ├── tracado.ts            (GRAFO DA REDE — não mexer, ver §3)
                    └── modulos.ts            (dados das zonas, paleta, posições)
```

Stack instalada: react 19.2.7, three 0.185.1, @react-three/fiber 9.6.1,
@react-three/drei 10.7.7, framer-motion 12.42.2, gsap 3.12.2, vite 8.1.1,
oxlint 1.71.0.

```bash
cd site-ferrorama-3d/react-app
npm install
npx tsc --noEmit     # tem que passar limpo
npx oxlint src       # tem que passar limpo
npm run build        # tem que passar
npm run dev          # porta 5173
```

---

## 3. O QUE NÃO PODE QUEBRAR

`tracado.ts` é a rede de trilhos, já construída e **validada**. Não reescreva.

- 6 trechos (`topo`, `fundo`, `esq`, `diagA`, `diagB`, `manobra`) ligando 3 nós
  (`SW1`, `SW2`, `SW3`), cada nó com exatamente 2 entradas e 2 saídas
- As **16 combinações** (8 estados de chave × frente/ré) circulam sem beco sem
  saída — se mexer na topologia, refaça esse teste
- As diagonais ligam retas de sentidos opostos, então a virada nos nós chega a
  **155°**. Isso é propriedade real do traçado (é por isso que existe o
  reversor). Está resolvido interpolando o ângulo em `Ferrovia.tsx` — no máximo
  18°/quadro. **Não remova essa suavização.**

Também preserve: reversor, SW1/SW2/SW3, velocidade, iniciar/parar, painel de
rota, destaque dos trilhos em uso, e o carregamento sob demanda do chunk 3D.

---

## 3.1. BUGS JÁ ENCONTRADOS — corrija estes pontos específicos

Investigação prévia já achou a causa exata dos dois problemas relatados. Não é
preciso procurar de novo — vá direto nestes arquivos:

### Bug A — a roda do mouse trava a rolagem da página

Em `Maquete3D.tsx`, o `OrbitControls` do drei está com o zoom por scroll
ligado por padrão (`enableZoom` não desativado). Com o cursor sobre o canvas,
girar a roda do mouse é capturado pelo `OrbitControls` para dar zoom na cena —
o evento `wheel` nunca chega até a página, então ela não rola. É exatamente o
travamento que o usuário reportou.

**Correção:** scroll do mouse deve rolar a página normalmente por padrão. Dê
zoom na maquete apenas com **Ctrl (ou ⌘) + scroll**, ou apenas depois que o
usuário clicar uma vez dentro da cena para "entrar" no modo de interação (nesse
caso, clicar fora sai do modo de novo). Detalhe de implementação na seção 5.

### Bug B — clicar na maquete não faz nada na maior parte dela

Em `Modulos3D.tsx`, dentro do componente `Zona`, os handlers `onClick`,
`onPointerOver` e `onPointerOut` estão anexados **só no mesh do piso de
concreto** do lote:

```tsx
<mesh
  position={[0, 0.06, 0]}
  receiveShadow
  onClick={(e) => { e.stopPropagation(); onSelecionar(id); }}
  onPointerOver={...}
  onPointerOut={...}
>
  <boxGeometry args={[larg, 0.12, prof]} />
  ...
</mesh>
...
<group ref={grupo}>{children}</group>
```

O `<group ref={grupo}>{children}</group>` — que contém TODOS os objetos da
zona (prédios, tanques, montanha, navio, guindaste, trilhos, avião etc.) — não
tem handler nenhum. Resultado: clicar em qualquer objeto 3D dentro da zona não
seleciona nada. Só funciona se o clique acertar exatamente o chão vazio do
lote, o que é raro e dá a impressão de que a maquete não responde a clique.

**Correção:** mova os três handlers para o grupo que envolve toda a zona (pai
do piso E do `children`), não só para o piso. Cuidado para não quebrar o
`raycast={() => null}` que já existe em elementos que não devem ser clicáveis
(vitrine, hologramas, halos, tubulação neon) — esses continuam sem capturar
clique. Detalhe de implementação na seção 6.

---

## 4. PEDIDO 1 — maquete grandona, com tela cheia

**Estado atual** (`.maquete3d-palco` em `App.css`):

```css
aspect-ratio: 16 / 10;
min-height: 340px;
max-height: 68vh;
```

Ainda por cima ela está dentro de `.section-container`, limitada a
`--container-max: 1240px`. Fica pequena demais para ser o destaque do site.

**O que fazer:**

- A maquete deve **furar o container** e ocupar a largura da tela (full-bleed),
  ou pelo menos chegar perto disso. O resto da seção (títulos, FAQ, mapa) pode
  continuar no container normal.
- Altura bem maior — algo em torno de `min(88vh, 900px)`.
- **Botão de tela cheia de verdade**, usando a Fullscreen API
  (`requestFullscreen` / `exitFullscreen`) no elemento que envolve o canvas +
  os controles. Precisa:
  - alternar o rótulo entre "Tela cheia" e "Sair da tela cheia"
  - funcionar com `Esc` (o navegador já faz, mas o estado do React precisa
    acompanhar — escute o evento `fullscreenchange`)
  - manter o painel de controles visível e usável em tela cheia
  - ter fallback silencioso se a API não existir ou for negada (esconda o botão)
- Em tela cheia, aproveite o espaço: os controles podem virar um painel flutuante
  sobre a cena em vez de ficar embaixo.

---

## 5. PEDIDO 2 — a página tem que rolar normalmente

**Este é o pior problema hoje** (bug A da seção 3.1): o `OrbitControls` captura
o scroll do mouse para dar zoom, e a página fica presa embaixo do cursor sem
rolar.

**Como resolver (padrão de mapa embutido, tipo Google Maps, só para mouse +
teclado — nada de toque):**

- **Scroll do mouse rola a página por padrão.** Zoom na maquete só com **Ctrl
  (ou ⌘) + scroll**. Configure `enableZoom` do `OrbitControls` conforme a tecla
  modificadora estiver pressionada (escute `wheel` você mesmo e chame
  `preventDefault` só quando Ctrl/⌘ estiver ativo; sem a tecla, deixe o evento
  seguir normalmente para a página), ou trate a roda manualmente.
- **Alternativa aceitável:** a cena começa "destravada" (scroll rola a página) e
  só ativa o zoom depois que o usuário **clica uma vez** dentro da maquete; ao
  clicar fora, volta a destravar. Se escolher esse caminho, mostre um aviso
  discreto na cena ("Clique para interagir").
- **Em tela cheia** o comportamento pode ser o oposto: ali a maquete é a tela
  toda, não existe página para rolar por baixo, então o zoom por scroll direto
  fica liberado sem precisar de Ctrl.
- Atualize o texto da dica existente (`.maquete3d-dica`) para explicar o gesto
  certo em cada modo.

Arrastar para girar continua funcionando normalmente em todos os casos.

---

## 6. PEDIDO 3 — clicar em qualquer ponto abre a descrição

**Bug encontrado — é por isso que parece que não dá para interagir.** Em
`Modulos3D.tsx`, dentro do componente `Zona`, o `onClick` está **só no mesh do
piso de concreto**. Os filhos da zona ficam em:

```tsx
<group ref={grupo}>{children}</group>
```

…sem handler nenhum. Ou seja: clicar na montanha da mina, no navio, no
guindaste, nas esferas de armazenamento, nas chaminés, nos prédios ou no avião
**não faz nada**. Só funciona se acertar o chão do lote.

**O que fazer:**

- Mova os handlers (`onClick`, `onPointerOver`, `onPointerOut`) para o **grupo
  que envolve tudo**, para que qualquer objeto da zona selecione aquela zona.
  Cuidado com `e.stopPropagation()` para não selecionar duas zonas de uma vez.
- Continue com `raycast={() => null}` na vitrine, nos hologramas, nos halos e na
  tubulação neon — esses não podem roubar o clique.
- **Feedback imediato ao passar o mouse:** cursor de ponteiro e destaque visível
  em toda a zona (não só na borda do lote).
- **A descrição precisa aparecer com destaque.** Hoje ela sai numa ficha
  discreta abaixo do painel, longe de onde a pessoa clicou. Melhore: um painel
  bem visível ao lado ou sobre a cena, com o nome da área, um parágrafo de
  contexto e os detalhes técnicos. Deve entrar com uma animação curta e ter
  botão de fechar.
- **Tem que continuar funcionando pelo teclado**: os botões de zona no painel
  HTML já fazem isso — mantenha, e garanta que a descrição seja anunciada em
  região `aria-live`.
- Se o usuário clicar no vazio (fora de qualquer zona), fecha a descrição — isso
  já existe via `onPointerMissed`, confira que continua valendo.

---

## 7. O CONTEÚDO DAS DESCRIÇÕES

Hoje os textos em `modulos.ts` são quase só especificação técnica (pinos,
protocolo). **Eu quero que expliquem o papel de cada área dentro da empresa** —
é isso que o público da feira quer entender.

Para cada uma das 5 zonas, escreva:

- **1 parágrafo curto** sobre a função daquela área na cadeia produtiva e por
  que ela importa para o negócio
- **3 ou 4 itens** com o detalhe técnico (o que já existe hoje serve, é só
  manter abaixo do parágrafo)

Orientação de conteúdo por zona:

| Zona | Sobre o que o parágrafo deve falar |
|---|---|
| **Central de Química** | O laboratório é quem garante que o minério atende à especificação do cliente. Analisa teor de ferro, umidade e contaminantes; sem esse controle a carga é rejeitada no porto de destino e a empresa perde o embarque. Também trata e beneficia o minério antes da exportação. |
| **Mina** | Início de tudo: extração do minério bruto. Define o ritmo de toda a cadeia — se a mina para, para o trem, o porto e o aeroporto. |
| **Ferrorama** | A ferrovia é a espinha dorsal logística: transporta grandes volumes com custo por tonelada muito menor que o rodoviário. Os desvios decidem o destino da carga. |
| **Porto Logístico** | Porta de saída para o mercado internacional. É onde o minério vira exportação e receita. |
| **Aeroporto Logístico** | Rota alternativa para carga de maior valor agregado ou urgência, quando o custo do frete aéreo se justifica. |

Escreva em português claro, sem jargão desnecessário — o público é de feira
escolar. Não invente números nem dados que não existam.

---

## 8. ORÇAMENTO DE PERFORMANCE (não pode regredir)

| Métrica | Valor atual | Limite |
|---|---|---|
| Bundle inicial | **155,8 KB gzip** | não passar de 165 KB |
| Chunk da maquete 3D | **255,4 KB gzip** | até ~330 KB se justificar |

- `three` continua **fora do bundle inicial** (só no chunk lazy)
- `dpr` limitado a `[1, 1.75]`
- Render pausa quando a seção sai da tela
- **Cuidado: a maquete vai ficar bem maior na tela.** Mais pixels = mais custo de
  GPU. Se precisar, reduza o `dpr` quando a área do canvas passar de certo
  tamanho, para não derrubar o FPS em notebook de escola com vídeo integrado
  (o cenário-alvo é desktop/notebook, não é preciso otimizar para celular).
- Respeitar `prefers-reduced-motion` (hook já existe em `src/lib/motion.ts`)
- **Não baixe assets externos** (modelos, HDRI, texturas de CDN). Tudo
  procedural ou embutido.

---

## 9. ACESSIBILIDADE (requisito)

- Os controles são **HTML de verdade** fora do canvas — mantenha assim. Se o
  WebGL falhar no computador da escola, a interface continua utilizável.
- Descrição da zona em região `aria-live`; estados em `aria-pressed`
- O botão de tela cheia precisa de rótulo que mude junto com o estado
- Foco visível em tudo que é clicável (o site já tem `:focus-visible` global)
- Navegação completa por teclado (Tab, Enter/Espaço, Esc para sair da tela
  cheia) — é o modo de interação principal além do mouse, já que não há toque
  a considerar

---

## 10. COMO VERIFICAR (leia com atenção)

**O painel de preview do navegador não compõe quadros nesta máquina.** Dentro
dele, `requestAnimationFrame`, `IntersectionObserver` e `ResizeObserver` **não
disparam** — o canvas nunca desenha e fica em 300×150. Não conclua que está
quebrado por causa disso.

O que dá para verificar de verdade:

1. `npx tsc --noEmit`, `npx oxlint src` e `npm run build` limpos
2. **Testes headless em Node** importando `three` de dentro de `react-app/`,
   para qualquer coisa geométrica (foi assim que se achou o problema dos 155° e
   o das ruas estourando a placa)
3. Via `javascript_tool` no DOM:
   - a página **rola** com o ponteiro sobre a maquete (compare `window.scrollY`
     antes e depois de disparar um evento `wheel` sobre o canvas, sem Ctrl)
   - com Ctrl+`wheel` sobre o canvas, a página NÃO rola (foi capturado para
     zoom da cena)
   - clicar via API em um objeto 3D qualquer da zona (não só o piso) muda a
     descrição — teste isso especificamente, é o bug B da seção 3.1
   - clicar via API nos botões de zona do painel HTML também muda a descrição
   - presença de `aria-live`, `aria-pressed`, rótulo do botão de tela cheia
   - altura real do palco em viewport de desktop
   - ausência de erros no console
4. Compare o tamanho dos chunks antes e depois no `npm run build`

**Seja honesto no relatório final sobre o que conseguiu ver e o que não.** Se
não viu a cena renderizada, diga isso claramente.

---

## 11. ENTREGA

- Commits em português, padrão `feat(site-ferrorama-3d): ...`, na branch
  **`feat/dev-Caio`** (remoto:
  `https://github.com/sandersonElias/Maquete_Industrial.git`)
- **Commite e dê push ao terminar** — quero poder puxar na hora
- Comentários no código em português, explicando o **porquê** das decisões não
  óbvias, no estilo dos arquivos existentes
- No fim me diga: o que mudou, o impacto nos KB, o que você verificou e o que
  ficou por conferir

---

## 12. DÚVIDAS AINDA EM ABERTO

Se forem relevantes para o que você for fazer, me pergunte em vez de inventar:

1. **"Central de Química"** aparece assim na minha planta do Figma, mas o README
   do projeto só fala em "Central de Controle" com Arduino Mega. Está modelada
   como central de química (tanques e reatores).
2. **Viaduto**: mencionei que existe um na maquete, mas ele não está
   identificado na planta e ainda não foi construído na cena.
