# Maquete 3D do Ferrorama — experiência de tela cheia para a feira

## 0. Contexto em uma frase

Projeto escolar de feira de ciências: uma maquete ferroviária industrial física
(escala HO, com Arduino) tem um site de documentação. **Na barraca da feira vai
ter um QR code**: o visitante aponta o celular e cai direto na maquete 3D. Ela é
o holofote — precisa impressionar em 10 segundos, num celular qualquer, sem
manual de instruções.

---

## 1. Os 5 objetivos (em ordem de importância)

1. **Tela cheia de verdade.** A maquete ocupa a tela inteira, sem cabeçalho de
   site, sem rolagem, sem margens. É a experiência, não um bloco dentro de uma
   página.
2. **Funcionar em qualquer celular.** É por QR code — Android velho, iPhone,
   tela pequena, retrato e paisagem. Se travar ou ficar a 8 fps num aparelho
   modesto, o objetivo falhou.
3. **Câmera livre.** O visitante gira, aproxima e afasta à vontade, com o dedo
   ou com o mouse.
4. **Clicar/tocar numa parte → a câmera aproxima daquela parte** e mostra o que
   é, com uma descrição.
5. **Cenário de fundo bonito.** Hoje a maquete flutua num vazio. Precisa de um
   ambiente ao redor que dê contexto e beleza.

> **A maquete tem 4 módulos: Mineradora, Ferrovia, Porto Logístico e Central de
> Controle.** O porto **faz parte** da maquete e continua. Quem foi removido do
> projeto foi o **aeroporto** — e isso já está feito (ver §5).

---

## 2. Onde está o código (leia antes de propor qualquer coisa)

```
Maquete_Industrial/site-ferrorama-3d/react-app/
├── public/models/maquete-blender.glb     4,8 MB — modelo Blender, 301 nodes
├── src/App.tsx                            rota: /maquete → MaquetePage
├── src/App.css                            ~4600 linhas, classes .maquete3d-*
└── src/components/
    ├── MaquetePage.tsx                    página dedicada de tela cheia
    ├── MaqueteSection.tsx                 a maquete embutida na home
    └── maquete3d/
        ├── Maquete3D.tsx          816 L   Canvas, câmera, OrbitControls, painel
        ├── Modulos3D.tsx          699 L   zonas clicáveis
        ├── Cenario.tsx            604 L   vitrine, pedestal, terreno, ruas
        ├── geometria.ts           521 L   traçado dos trilhos, curvas
        ├── veiculos.tsx           399 L   veículos animados
        ├── Ferrovia.tsx           384 L   trilhos + trem
        ├── Hologramas.tsx         274 L   painéis de telemetria (CanvasTexture)
        ├── texturas.ts            196 L
        ├── Cenario3D.tsx          179 L
        ├── tracado.ts             174 L
        ├── modulos.ts             131 L   dados dos módulos, paleta, tour
        ├── MaqueteBlender.tsx     122 L   carrega o .glb, anima o trem
        └── CameraPov.tsx           58 L   câmeras em primeira pessoa
```

Stack: React 19, TypeScript, Vite 8, three 0.185, @react-three/fiber 9,
@react-three/drei 10, framer-motion 12.

```bash
cd site-ferrorama-3d/react-app
npm install
npx tsc --noEmit    # tem que passar limpo
npx oxlint src      # tem que passar limpo
npm run build       # tem que passar
npm run dev         # porta 5173
```

---

## 3. O QUE JÁ EXISTE (não reinvente — aproveite)

Muita coisa dos objetivos já tem base pronta. **Leia o código antes de
escrever**, senão você vai duplicar o que já funciona:

| Já existe | Onde | Estado |
|---|---|---|
| Rota `/maquete` em tela cheia | `App.tsx:18-23` → `MaquetePage.tsx` | funciona; é a base do QR code |
| Fullscreen API + travar em paisagem | `MaquetePage.tsx` (`abrir()`) | tenta `requestFullscreen` e `screen.orientation.lock('landscape')`; já trata a falha no iOS |
| Aviso "vire o celular" no retrato | `MaquetePage.tsx` (estado `retrato`) | media query `(orientation: portrait) and (max-width: 900px)` |
| Câmera focando o módulo selecionado | `Maquete3D.tsx:33-64` (`CameraFoco`) | faz `lerp` de posição e alvo; **a base do objetivo 4 já está aqui** |
| Câmeras POV (1ª pessoa) | `CameraPov.tsx`, `modulos.ts:61` | Volvo, CAT, trem MRS, navio do porto |
| Tour cinematográfico automático | `modulos.ts:33` (`PASSOS_TOUR`) | 5 passos com legenda e duração, incluindo o porto |
| OrbitControls | `Maquete3D.tsx:389-395` | `minDistance 5`, `maxDistance 58`, `maxPolarAngle π/2.15` |
| Modo leve (dpr reduzido) | `Maquete3D.tsx:523` | `dpr={leve ? [1,1.25] : [1,1.75]}` |
| Céu e estrelas | importa `Stars`, `Sky` do drei | já disponível |
| Painéis de telemetria | `Hologramas.tsx` | CanvasTexture, redesenha só quando o dado muda |
| CSS mobile | `App.css` | 39 media queries, `@media (pointer: coarse)` com alvos de 44px |

**Conclusão importante:** os objetivos 1, 3 e 4 são mais *refinamento e
robustez* do que construção do zero. Foque o esforço novo nos objetivos 2
(performance mobile de verdade) e 5 (cenário), mais o bug da §5.

---

## 4. Requisito crítico: performance em celular

Este é o requisito que mais pode fazer o projeto falhar na feira, e o mais
fácil de subestimar.

**Números atuais** (medidos, `npm run build`):

| Recurso | Tamanho |
|---|---|
| Chunk `Maquete3D` | 1.049 KB → **283 KB gzip** |
| Modelo `.glb` | **4,8 MB** (não comprimido) |
| CSS | 108 KB → 20 KB gzip |
| Bundle inicial | 372 KB → 116 KB gzip |

**O `.glb` de 4,8 MB é o problema.** No 4G da feira, com várias pessoas
acessando ao mesmo tempo, isso é uma espera longa olhando pra uma tela vazia.

O que fazer:

- **Comprimir o modelo.** Draco ou Meshopt no `.glb` costuma reduzir de 4,8 MB
  para algo entre 500 KB e 1,5 MB. `useGLTF` do drei suporta ambos. Meça antes
  e depois e me diga os números.
- **Tela de carregamento com progresso real** (`useProgress` do drei), não um
  spinner mudo. Quem espera 6 segundos sem feedback fecha a aba.
- **Detectar aparelho fraco e degradar**: já existe a variável `leve` —
  use-a de verdade (menos sombras, `dpr` menor, menos partículas, desligar
  antialias). Sugestão de heurística: `navigator.hardwareConcurrency`,
  `devicePixelRatio` e o tamanho da tela.
- **Alvo: 30 fps estáveis** num celular intermediário. Prefira **degradar o
  efeito a derrubar o fps** — sempre.
- Manter `dpr` limitado (hoje `[1, 1.75]`; no celular não passe de `1.5`).

---

## 5. BUG ENCONTRADO: peça do terminal de carvão está invisível

O **aeroporto já foi removido** do projeto — e removido do jeito certo: as
peças não existem mais dentro do `.glb`. Verifiquei os 301 nodes do modelo e
não há nada de aeroporto lá.

**Mas sobrou uma regex vestigial** em `MaqueteBlender.tsx:16`, escrita quando o
aeroporto ainda estava no modelo:

```ts
if (/^(pista|terminal|hangar|torre|c5|estradaaero|termvidro|torrecab|plat2|casa2|telhado2|janela2)/i.test(child.name)) {
  child.visible = false;
  return;
}
```

Dos 301 nodes do modelo, essa regex hoje esconde **exatamente 1** — e não é
aeroporto: é **`TerminalCarvao`**, capturado por acidente pelo prefixo
`terminal`.

E `TerminalCarvao` faz parte de um complexo de carvão que está **visível**:

```
CarvaoCava, CarvaoFundo, SiloCarvao, SiloTeto, CorreiaCarvao,
PilhaCarvao, LuzCarvaoPoste, LuzCarvaoLamp, TerminalCarvao ← escondido
```

Ou seja: a cava, o silo, a correia, a pilha e os postes de luz do carvão
aparecem, mas o terminal não. Provavelmente há um buraco visível na cena hoje.

**O que fazer:**
1. Confirmar visualmente se `TerminalCarvao` deveria aparecer (quase certamente
   sim, dado o contexto).
2. Se sim, **apagar a regex inteira** — ela não serve mais para nada, já que o
   aeroporto não está no modelo. Deixar a regex "só tirando o terminal" seria
   manter um efeito colateral acidental.
3. Enquanto estiver nesse arquivo: `prepararSombras` tem esse nome mas hoje faz
   três coisas diferentes (esconder peças, ajustar `envMapIntensity`, corrigir
   cor de grama/terra). Vale renomear para algo honesto.

**Não confundir:** o **porto continua** (`Cais`, `Navio`, `Guindaste`, `Agua`,
`CorreiaPorto`, `SiloPorto`, os 5 postes `LuzPorto*`). Ele é um dos 4 módulos e
tem 3 animações próprias no modelo: `NavioAction`, `GuindLancaAction`,
`CargaGAction`. Nada disso sai.

---

## 6. Cenário de fundo

Hoje a maquete aparece sobre um fundo praticamente vazio. Quero um ambiente que
dê contexto e beleza, sem competir com a maquete nem custar fps.

Direção sugerida (proponha alternativas se tiver melhor):

- **Céu com hora do dia definida** — `Sky` e `Stars` do drei já estão
  importados. Um fim de tarde dá cor quente e sombras longas, que valorizam o
  relevo. Considere um alternador dia/noite se for barato.
- **Horizonte com relevo** — morros/serra baixa ao redor, bem simples
  (geometria pobre, sem textura pesada). Dá profundidade e esconde a borda da
  maquete.
- **Mar no horizonte** — como o porto fica na maquete, faz sentido a água do
  cais continuar para além da borda, em vez de terminar num corte seco.
- **Névoa de distância** (`fog`) na cor do céu — funde a maquete no horizonte e
  é praticamente de graça em performance.
- **Iluminação que valorize** — luz direcional com sombra suave + preenchimento
  ambiente. Evite muitas luzes dinâmicas.

**Regras:**
- Nada de HDRI externa nem textura de CDN. Tudo procedural ou embutido no
  projeto — o site precisa funcionar mesmo com internet ruim na feira.
- O cenário é **fundo**: não pode receber clique nem roubar o raycast dos
  módulos.
- Se custar fps no celular, simplifique ou desligue no modo `leve`.

---

## 7. Interação: câmera livre + clicar para focar

**Câmera livre.** Girar, aproximar, afastar — mouse e toque.

- Um dedo gira, dois dedos aproximam/afastam (padrão do `OrbitControls`)
- **Como é tela cheia, não há página atrás para rolar** — então o
  `touch-action: none` que já existe no canvas (`App.css:3720`) está correto
  aqui. Não remova pensando que é bug.
- Limites de distância e ângulo para o visitante nunca conseguir "se perder"
  nem ver a maquete por baixo. Os atuais (`minDistance 5`, `maxDistance 58`,
  `maxPolarAngle π/2.15`) são um ponto de partida — ajuste ao enquadramento
  final.
- Amortecimento (`enableDamping`) ligado: dá peso e suavidade ao gesto.

**Clicar/tocar para focar.** A base existe em `CameraFoco`
(`Maquete3D.tsx:33-64`). O que precisa melhorar:

- **A área de toque tem que ser generosa.** Dedo não é cursor. Se o alvo
  clicável for uma peça pequena do modelo, quase ninguém vai acertar. Considere
  áreas de clique invisíveis e maiores por módulo.
- **Feedback antes do clique**: no desktop, destaque ao passar o mouse. No
  celular não existe hover — então o módulo precisa se anunciar sozinho
  (marcador flutuante, pulso sutil, contorno). Sem isso o visitante não
  descobre que dá pra clicar.
- **Ao focar**: transição suave (a existente usa `lerp`), e um painel com nome
  e descrição do módulo aparece.
- **Sair do foco**: precisa de um jeito óbvio de voltar à visão geral — botão
  "Ver tudo" visível, e tocar fora também.
- **Descubribilidade**: nos primeiros segundos, uma dica curta tipo
  "Toque em uma área para explorar" que some depois da primeira interação.
- **Já existe interação nos desvios do trem** (`MaqueteBlender.tsx:106-117`:
  clicar num node `Desvio<N>` aciona `onDesvio`). Não quebre isso ao mexer no
  sistema de clique.

---

## 8. Conteúdo dos módulos

São 4: **Mineradora**, **Ferrovia**, **Porto Logístico** e **Central de
Controle**. A narrativa do site é "da mina ao porto" e continua válida.

Os textos atuais (`modulos.ts`) são quase só especificação técnica — pinos do
Arduino, protocolo serial. Para o público da feira (colegas, professores, pais),
isso não comunica nada.

Para cada módulo, escreva:

- **Um parágrafo curto** explicando o que aquela área faz e por que importa,
  em português claro, sem jargão
- **3 ou 4 itens técnicos** abaixo (o conteúdo atual serve — só reposicione)

Não invente números nem dados que não existam no projeto.

---

## 9. Acessibilidade e robustez (requisitos, não enfeite)

- **Os controles são HTML de verdade** (`<button>`, `<label>`), fora do canvas.
  Se o WebGL falhar no celular de alguém, a interface continua utilizável.
  Mantenha assim.
- **Plano B se o WebGL não existir**: mensagem clara + imagem estática da
  maquete. Melhor que tela preta.
- Estados em `aria-pressed`; descrição do módulo em região `aria-live`
- Alvos de toque de no mínimo 44px (já existe `@media (pointer: coarse)`)
- Respeitar `prefers-reduced-motion` (o projeto já tem o hook
  `usePrefersReducedMotion` em `src/lib/motion.ts`)
- Sem rolagem horizontal em nenhuma largura
- Funcionar em retrato **e** paisagem. O aviso "vire o celular" já existe, mas
  o ideal é que o retrato também funcione, não só peça pra virar.

---

## 10. Como verificar (importante — leia)

**O painel de preview do navegador desta máquina não compõe quadros.** Dentro
dele, `requestAnimationFrame`, `IntersectionObserver` e `ResizeObserver` **não
disparam** — o canvas fica em 300×150 e nada é desenhado. **Não conclua que
está quebrado por causa disso**, e não saia "consertando" código que está
correto.

O que dá para verificar de verdade:

1. `npx tsc --noEmit`, `npx oxlint src` e `npm run build` limpos
2. **Testes headless em Node** para qualquer coisa geométrica ou de dados —
   importando `three` de dentro de `react-app/`. Foi assim que se encontraram
   bugs reais neste projeto antes.
3. **Inspeção do `.glb` por script.** O arquivo é JSON + binário; dá para ler
   os nomes dos nodes e as animações direto. Foi exatamente assim que o bug do
   `TerminalCarvao` (§5) foi encontrado:
   ```js
   const b = fs.readFileSync('maquete-blender.glb');
   const json = JSON.parse(b.slice(20, 20 + b.readUInt32LE(12)).toString('utf8'));
   json.nodes.map(n => n.name);      // 301 nomes
   json.animations.map(a => a.name); // 6 animações
   ```
4. Via DOM: presença dos controles, `aria-*`, ausência de erros no console,
   requisições de rede (o `.glb` retorna 200?)
5. Comparar o tamanho dos chunks antes e depois no `npm run build`

**Seja honesto no relatório final** sobre o que você conseguiu verificar e o
que não. Se não viu a cena renderizada, diga isso com todas as letras — não
afirme que "está bonito" sem ter visto.

---

## 11. Perguntas para fazer ANTES de começar

Não invente resposta para nenhuma destas:

1. **`TerminalCarvao` deve aparecer na cena?** (§5) Quase certamente sim, mas
   confirme antes de apagar a regex — é a única coisa que ela esconde hoje.
2. **Reexportar o `.glb` do Blender é possível?** Se o arquivo `.blend` original
   estiver disponível, reexportar já comprimido resolve o peso na origem. Se
   não estiver, o caminho é comprimir o `.glb` existente com Draco/Meshopt.
3. **Tem como testar num celular de verdade antes da feira?** Faz diferença
   saber se dá para validar em hardware real ou se só teremos emulação.

---

## 12. Entrega

- Commits em português, padrão `feat(site-ferrorama-3d): ...` ou
  `fix(maquete3d): ...`
- Comentários no código em português, explicando o **porquê** das decisões não
  óbvias — o projeto já segue esse estilo, mantenha
- **Não quebre o que já funciona**: a rota `/maquete`, o tour, as câmeras POV e
  os desvios clicáveis do trem devem continuar funcionando
- No fim, relate: o que mudou, o tamanho do `.glb` e dos chunks antes/depois, o
  que você verificou e o que ficou por conferir
