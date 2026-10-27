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
}

/** Altura efetivada da nav (CSS var ou fallback). */
export function getNavOffset(): number {
  if (typeof window === 'undefined') return 72;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--nav-h');
  const navH = parseInt(raw, 10);
  return (Number.isFinite(navH) ? navH : 64) + 16;
}

/** Rola até a seção alinhando o título abaixo da navbar. */
export function scrollToSection(id: string) {
  // Início = topo real. Evita foco no hero (em iOS isso “pula” / trava após fechar o menu).
  if (id === 'inicio') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const target = document.getElementById(id);
  if (!target) return;

  const top = target.getBoundingClientRect().top + window.scrollY - getNavOffset();
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });

  // Foco acessível sem disparar outro scroll
  if (!target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1');
  }
  target.focus({ preventScroll: true });
}
