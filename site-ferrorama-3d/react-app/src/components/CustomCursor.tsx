import { useEffect, useRef, useCallback } from 'react';

export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const isHovering = useRef(false);
  const rafId = useRef<number>(0);

  const animate = useCallback(() => {
    // Smooth ring follow (lerp)
    ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.15;
    ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.15;

    if (ringRef.current) {
      ringRef.current.style.transform = `translate(${ringPos.current.x - 20}px, ${ringPos.current.y - 20}px)`;
    }
    if (dotRef.current) {
      dotRef.current.style.transform = `translate(${mousePos.current.x - 4}px, ${mousePos.current.y - 4}px)`;
    }

    rafId.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Detect touch device
    if ('ontouchstart' in window) return;

    const moveCursor = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive =
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.closest('.nav-link') ||
        target.closest('.hero-cta') ||
        target.closest('.hero-cta-secondary') ||
        target.closest('.hero-cta-ghost') ||
        target.closest('.card') ||
        target.closest('.control-btn') ||
        target.closest('.porto-item-enhanced') ||
        target.closest('.feature-card-enhanced') ||
        target.closest('.dashboard-card-enhanced') ||
        target.closest('.maquete-accordion-item') ||
        target.closest('.maquete-zone') ||
        target.closest('.maquete-svg') ||
        target.tagName === 'SUMMARY' ||
        target.closest('summary');

      if (isInteractive) {
        isHovering.current = true;
        ringRef.current?.classList.add('hovering');
        dotRef.current?.classList.add('hovering');
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (!related || related === document.documentElement) {
        isHovering.current = false;
        ringRef.current?.classList.remove('hovering');
        dotRef.current?.classList.remove('hovering');
      }
    };

    const handleMouseLeave = () => {
      isHovering.current = false;
      ringRef.current?.classList.remove('hovering');
      dotRef.current?.classList.remove('hovering');
    };

    window.addEventListener('mousemove', moveCursor, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(rafId.current);
    };
  }, [animate]);

  // Don't render on touch devices
  if (typeof window !== 'undefined' && 'ontouchstart' in window) return null;

  return (
    <>
      <div ref={ringRef} className="custom-cursor-ring" />
      <div ref={dotRef} className="custom-cursor-dot" />
    </>
  );
}
