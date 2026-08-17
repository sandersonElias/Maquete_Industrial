/** Altura efetivada da nav (CSS var ou fallback). */
export function getNavOffset(): number {
  if (typeof window === 'undefined') return 72;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--nav-h');
  const navH = parseInt(raw, 10);
  return (Number.isFinite(navH) ? navH : 64) + 16;
}

/** Rola até a seção alinhando o título abaixo da navbar. */
export function scrollToSection(id: string) {
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
