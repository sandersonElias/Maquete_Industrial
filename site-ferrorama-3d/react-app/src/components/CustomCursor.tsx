import { useEffect, useRef, useCallback } from 'react';
import { useHasFinePointer, usePrefersReducedMotion } from '../lib/motion';

export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const rafId = useRef<number>(0);
  const hasFinePointer = useHasFinePointer();
  const reduced = usePrefersReducedMotion();

  const animate = useCallback(() => {
    // Ring segue suavemente (lerp)
    ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.18;
    ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.18;

    if (ringRef.current) {
      ringRef.current.style.transform = `translate(${ringPos.current.x - 20}px, ${ringPos.current.y - 20}px)`;
    }
    if (dotRef.current) {
      dotRef.current.style.transform = `translate(${mousePos.current.x - 3}px, ${mousePos.current.y - 3}px)`;
    }

    rafId.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Só faz sentido com mouse/trackpad e sem preferência por movimento reduzido.
    // `(hover: hover) and (pointer: fine)` é mais confiável que `ontouchstart`,
    // que dá falso positivo em notebooks com tela sensível ao toque.
    if (!hasFinePointer || reduced) return;

    const moveCursor = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    // Detecta interativo com delegação de eventos (uma única vez, sem closest em mousemove)
    const interactiveSelector = 'a, button, [role="button"], summary, .nav-link, .hero-cta, .hero-cta-secondary, .hero-cta-ghost, .card, .control-btn, .porto-item-enhanced, .feature-card-enhanced, .dashboard-card-enhanced, .maquete-accordion-item, .maquete-zone, .maquete-svg';

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(interactiveSelector)) {
        ringRef.current?.classList.add('hovering');
        dotRef.current?.classList.add('hovering');
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const related = e.relatedTarget as HTMLElement | null;
      // Só remove se saiu de um interativo E não entrou em outro interativo
      if (target.closest(interactiveSelector) && (!related || !related.closest?.(interactiveSelector))) {
        ringRef.current?.classList.remove('hovering');
        dotRef.current?.classList.remove('hovering');
      }
    };

    window.addEventListener('mousemove', moveCursor, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(rafId.current);
    };
  }, [animate, hasFinePointer, reduced]);

  if (!hasFinePointer || reduced) return null;

  return (
    <>
      <div ref={ringRef} className="custom-cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="custom-cursor-dot" aria-hidden="true" />
    </>
  );
}
