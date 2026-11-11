/** Travamento de scroll compatível com iOS (overflow:hidden sozinho “buga”). */
let lockCount = 0;
let lockedY = 0;

export function lockPageScroll() {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) {
    lockedY = window.scrollY || window.pageYOffset || 0;
    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${lockedY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
  lockCount += 1;
}

export function unlockPageScroll() {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount > 0) return;

  const body = document.body;
  body.style.position = '';
  body.style.top = '';
  body.style.left = '';
  body.style.right = '';
  body.style.width = '';
  body.style.overflow = '';
  document.documentElement.style.overflow = '';
  window.scrollTo(0, lockedY);
  // Com o scroll travado a navegação por fragmento (URL aberta com `#secao`)
  // aconteceu fora da tela e ficou perdida. Quem está na página refaz o alvo.
  window.dispatchEvent(new Event('scroll-liberado'));
}

/**
 * Altura efetiva da nav no momento do clique.
 *
 * Ler `--nav-h` não basta: abaixo de 720px a nav vira de duas linhas e passa a
 * medir `--nav-offset` (6.35rem + safe-area) com `height: auto`, então o valor
 * fixo deixava o título da seção parado embaixo da barra. Medir o elemento é a
 * única forma de acompanhar as duas variantes e a safe-area do aparelho.
 */
export function getNavOffset(): number {
  if (typeof window === 'undefined') return 72;
  const nav = document.querySelector<HTMLElement>('.nav');
  const altura = nav ? nav.getBoundingClientRect().height : 0;
  if (altura > 0) return Math.round(altura) + 16;

  const navH = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-h'),
    10
  );
  return (Number.isFinite(navH) ? navH : 64) + 16;
}

type OpcoesScroll = {
  /**
   * `'nenhum'` quando o navegador é quem está navegando (popstate): aí a URL
   * já mudou sozinha e empurrar de novo criaria uma entrada fantasma na história.
   */
  historico?: 'push' | 'nenhum';
};

/** Posição que deixa o título da seção logo abaixo da navbar. */
function alvoDaSecao(id: string): number | null {
  const el = document.getElementById(id);
  if (!el) return null;
  return Math.max(0, el.getBoundingClientRect().top + window.scrollY - getNavOffset());
}

const TOLERANCIA_PX = 8;
const MAX_TENTATIVAS = 3;

let correcaoToken = 0;
let desligarIntervencao: (() => void) | null = null;

/** Rolar a roda, o dedo ou o teclado no meio do salto significa "eu que mando". */
function vigiarIntervencao() {
  desligarIntervencao?.();
  const cancelar = () => {
    correcaoToken += 1;
    desligarIntervencao?.();
  };
  window.addEventListener('wheel', cancelar, { passive: true, once: true });
  window.addEventListener('touchmove', cancelar, { passive: true, once: true });
  window.addEventListener('keydown', cancelar, { passive: true, once: true });
  desligarIntervencao = () => {
    window.removeEventListener('wheel', cancelar);
    window.removeEventListener('touchmove', cancelar);
    window.removeEventListener('keydown', cancelar);
    desligarIntervencao = null;
  };
}

/**
 * O documento cresce enquanto ele sobe (imagem e canvas que entram em cena), então
 * o alvo medido no clique envelhece durante a rolagem: o primeiro salto de uma
 * seção distante parava telas antes do lugar. Quando o scroll para fora de
 * tolerância, mede de novo e corrige — com limite de tentativas e parando na
 * hora em que a rolagem passa a ser do usuário.
 */
function corrigirSecao(id: string, token: number, tentativasRestantes: number) {
  if (token !== correcaoToken || tentativasRestantes === 0) return;

  let anterior = -1;
  let estavel = 0;
  let decorrido = 0;

  const passo = () => {
    if (token !== correcaoToken) return;
    const alvo = alvoDaSecao(id);
    if (alvo === null) return;

    const y = window.scrollY;
    estavel = y === anterior ? estavel + 1 : 0;
    anterior = y;
    decorrido += 120;

    if (Math.abs(alvo - y) <= TOLERANCIA_PX) return;
    if (estavel >= 3) {
      window.scrollTo({ top: alvo, behavior: 'smooth' });
      corrigirSecao(id, token, tentativasRestantes - 1);
      return;
    }
    if (decorrido > 6000) return;
    window.setTimeout(passo, 120);
  };

  window.setTimeout(passo, 120);
}

/** Rola até a seção alinhando o título abaixo da navbar. */
export function scrollToSection(id: string, opcoes: OpcoesScroll = {}) {
  // Uma nova navegação invalida qualquer correção ainda pendente.
  correcaoToken += 1;
  const token = correcaoToken;
  desligarIntervencao?.();

  if (opcoes.historico !== 'nenhum' && window.location.hash !== `#${id}`) {
    // Sem isto a URL nunca ganhava o hash: não dava para mandar o link de uma
    // seção e o "voltar" do navegador saía do site em vez de voltar uma seção.
    window.history.pushState(null, '', `#${id}`);
  }

  // Início = topo real. Evita foco no hero (em iOS isso “pula” / trava após fechar o menu).
  if (id === 'inicio') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const alvo = alvoDaSecao(id);
  if (alvo === null) return;

  window.scrollTo({ top: alvo, behavior: 'smooth' });
  vigiarIntervencao();
  corrigirSecao(id, token, MAX_TENTATIVAS);

  // Foco acessível sem disparar outro scroll
  const target = document.getElementById(id);
  if (target) {
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
  }
}
