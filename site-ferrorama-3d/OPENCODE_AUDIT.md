# OPENCODE_AUDIT.md — Otimização Cross-Platform do Site Ferrorama 3D

**Data:** 2026-08-21 · **Branch:** `feat/dev-Davi` · **Escopo:** site estático + `react-app/`

Otimização para responsividade e compatibilidade total (iOS Safari, Android Chrome, Firefox, Samsung Internet, desktop) **sem alterações visuais no desktop**. Nenhuma mudança de layout, cor, tipografia ou parâmetros de animação foi feita — apenas correções de robustez, prefixos, acessibilidade e performance.

---

## 1. Contexto do projeto

- **Site estático:** `index.html` + `css/styles.css` + `js/main.js`, `js/three-scene.js`, `js/scroll-anim.js`. Dependências via CDN (Three.js r128, GSAP 3.12, ScrollTrigger).
- **React app:** `react-app/` — React 19 + Vite 8 (rolldown) + @react-three/fiber + three 0.185. Deploy na Vercel.
- **Restrição principal:** pixel-identical no desktop; melhorias apenas em mobile/touch/robustez.

## 2. Alterações por arquivo

### index.html
- Corrigido typo `xname="description"` → `name="description"` (regressão pré-existente não commitada).
- `viewport-fit=cover` + `<meta name="theme-color">` (notch/safe-area iOS).
- Favicon adicionado (`images/favicon.svg`) — eliminava 404.
- Meta tags Open Graph + Twitter Card.
- `aria-label`/`aria-expanded` no botão do menu mobile.
- **Desempenho:** `preconnect` para unpkg.com e cdnjs.cloudflare.com; `defer` nos 7 scripts; pesos Inter 300/900 removidos da URL do Google Fonts (não usados no CSS); `decoding="async"` nas imagens.

### css/styles.css
- `-webkit-text-size-adjust: 100%` (evita zoom de texto no Safari).
- `-webkit-tap-highlight-color: transparent`.
- Outline `:focus-visible` para navegação por teclado.
- **6× `-webkit-backdrop-filter`** adicionados junto aos `backdrop-filter` existentes (Safari ≤ 16).
- `min-height: 100svh` como fallback moderno do `100vh` (barra de endereço móvel).
- Insets de safe-area (`env(safe-area-inset-*)`) em nav, footer e seções.
- `touch-action: none` no canvas da maquete (evita scroll acidental durante órbita).
- Camada adaptativa ao final do arquivo:
  - Nav compacto entre 769–1150px;
  - `@media (hover: none)` neutraliza transforms de `:hover` (anti "hover grudento" touch);
  - `@media (pointer: coarse)` alvos de toque ≥ 44px e thumbs de slider mais grossos;
  - Bloco landscape (`max-height: 500px`) para telas baixas.

### js/main.js
- `hideLoader()` com timeout de segurança de 8s (loader nunca mais trava a página).
- Listener de scroll passivo.
- Menu mobile acessível: fecha com clique fora, tecla Escape, sincroniza `aria-expanded`.
- Offset dinâmico da nav no smooth-scroll.
- Partículas: resize com debounce (150ms), contagem adaptativa (40 <700px / 80 caso contrário), guard de `visibilitychange`.
- Guardas de CDN: Three.js ausente → mensagem inline amigável (`_showSceneError`), sem exceção silenciosa.
- `_initMaquetteScene(attempt)` com limite de 5 tentativas (eliminado loop infinito de retry).
- **Desempenho:** loop de conexão das partículas O(n²) usa distância ao quadrado (sem `Math.sqrt` por par) e viewport em cache (sem leitura de layout por partícula/frame).

### js/three-scene.js
- Detecção `isMobile` (largura ≤768px ou touch+ tela pequena).
- Qualidade adaptativa: pixelRatio cap 1.5 (mobile) / 2 (desktop); shadow map 1024 / 2048.
- **InstancedMesh**: trilhos e dormentes agrupados em 2 draw calls (~2000+ draw calls antes).
- Removido `scene.traverse` por frame — refs cacheadas para switch/reversor.
- IntersectionObserver pausa o render loop quando fora da tela (rootMargin 120px).
- Mousemove unificado com throttle rAF (um único handler de cursor).
- `destroy()` completo: desconecta observer, remove listeners, dispose de controles.
- Logs de console removidos; código morto (`origAddTrain`) removido.
- **Desempenho:** `WebGLRenderer` criado com `stencil: false` (economia de memória GPU) e `powerPreference: 'high-performance'`.

### js/scroll-anim.js (reescrito)
- Guarda global `GSAP_READY`: se o CDN do GSAP falhar, o site permanece utilizável (conteúdo visível, sem animações) em vez de quebrar tudo.
- `prefers-reduced-motion`: desativa animações/parallax/tilt quando o usuário pede menos movimento.
- Efeito tilt dos cards restrito a `(hover: hover) and (pointer: fine)`.
- Listeners passivos onde possível.
- Todos os parâmetros originais de animação preservados exatamente.

### react-app/src/App.css
- **18× `-webkit-backdrop-filter`** adicionados (21 ocorrências, 3 já prefixadas).
- Bloco `@media (hover: none)` ao final neutralizando transforms de `:hover` nos cards/botões (anti sticky-hover touch). Especificidade idêntica às regras originais + posição posterior = vence só em touch.

### react-app/src/components/maquete3d/Maquete3D.tsx
- `frameloop={visivel ? 'always' : 'never'}` no `<Canvas>`: render realmente pausa fora da tela (antes `PausarForaDaTela` só chamava `invalidate()`, no-op em modo "always"). O observer `visivel` já existia.

## 3. Validação executada

| Verificação | Resultado |
|---|---|
| `node --check` main.js / three-scene.js / scroll-anim.js | ✅ OK |
| `npm run lint` (oxlint) no react-app | ✅ exit 0 (1 aviso pré-existente em `geometria.ts:129`) |
| `npm run build` (Vite 8) | ✅ built in 14s |
| Diferencial visual desktop | Nenhuma regra alterada para `pointer: fine` além de prefixos |

## 4. Checklist manual cross-platform (para QA)

- [ ] iPhone Safari: loader some, menu abre/fecha, maquete orbita sem scroll da página, safe-area respeitada (notch), `100svh` corrige barra de endereço.
- [ ] Android Chrome: idem acima; sliders arrastáveis (thumb 22px+); sem hover "grudado" nos cards após toque.
- [ ] Firefox desktop/mobile: backdrop-filter ok, GSAP fallback ok se offline.
- [ ] Samsung Internet: alvos de toque ≥44px, nav compacta entre 769–1150px.
- [ ] Landscape baixo (<500px altura): blocos landscape aplicados.
- [ ] `prefers-reduced-motion` ativo: sem animações, conteúdo todo visível.
- [ ] CDN Three.js/GSAP bloqueado: mensagens inline, site navegável, loader some em ≤8s.
- [ ] Desktop: comparar lado a lado com `_backup_originais/` — deve ser pixel-identical.

## 5. Rollback

**Opção A — cópias .orig** (byte-exatas, pré-otimização):
```
site-ferrorama-3d/_backup_originais/
├── index.orig.html
├── css/styles.orig.css
├── js/main.orig.js
├── js/three-scene.orig.js
└── js/scroll-anim.orig.js
```
Restaurar copiando de volta para os caminhos originais (removendo o sufixo `.orig`).

**Opção B — git:**
```bash
git checkout backup/pre-otimizacao-site -- site-ferrorama-3d/
```
Branch `backup/pre-otimizacao-site` contém o estado anterior a todas as mudanças.

## 6. Prompt de auditoria (colar no opencode para revisão independente)

```
Audite as otimizações cross-platform do site em site-ferrorama-3d/.
Compare cada arquivo modificado com sua versão em _backup_originais/ (ou
git diff contra a branch backup/pre-otimizacao-site) e verifique:

1. REGRESSÃO VISUAL DESKTOP: nenhuma regra CSS aplicável a pointer:fine /
   hover:hover pode ter mudado valores visuais (apenas adições de prefixos
   -webkit-, svh, safe-area e blocos @media novos são permitidos).
2. PARIDADE DE COMPORTAMENTO JS: os parâmetros de animação do
   scroll-anim.js reescrito devem ser idênticos aos do original
   (durações, eases, offsets, triggers).
3. GUARDAS DE ROBUSTEZ: CDNs ausentes (THREE/GSAP) não podem lançar
   exceções não tratadas nem deixar o loader preso; retry da cena 3D
   limitado a 5 tentativas.
4. PERFORMANCE MOBILE: InstancedMesh em trilhos/dormentes (2 draw calls),
   pixelRatio/shadow adaptativos, IntersectionObserver pausando loops,
   listeners passivos, mousemove com throttle rAF.
5. ACESSIBILIDADE: aria-expanded no menu, :focus-visible,
   prefers-reduced-motion respeitado em CSS e JS.
6. REACT-APP: frameloop condicionado à visibilidade em Maquete3D.tsx;
   -webkit-backdrop-filter presente em todos os backdrop-filter de
   App.css; bloco @media (hover: none) cobrindo todos os seletores com
   transform em :hover.
7. Rode node --check nos 3 JS estáticos e npm run lint && npm run build
   dentro de react-app/ e reporte qualquer falha.

Reporte divergências com arquivo:linha e classifique como [CRÍTICO],
[DESEJÁVEL] ou [COSMÉTICO].
```
