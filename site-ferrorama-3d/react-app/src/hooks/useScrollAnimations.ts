import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Hook de animações de scroll.
 *
 * As animações de entrada (fade-in, slide, reveal de títulos, contadores)
 * ficam a cargo do Framer Motion em cada componente — isso evita conflito
 * de duas bibliotecas brigando pelo mesmo elemento.
 *
 * Aqui ficam apenas:
 *  - Parallax dos orbs do hero (ScrubTrigger, nativo do GSAP)
 *  - Parallax da imagem do porto
 *  - Efeito 3D tilt nos cards (mousemove)
 */
export default function useScrollAnimations() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax dos orbs do hero (segue o scroll)
      gsap.to('.orb-1', {
        scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 1 },
        y: -100, ease: 'none',
      });
      gsap.to('.orb-2', {
        scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 1 },
        y: -150, ease: 'none',
      });
      gsap.to('.orb-3', {
        scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 1 },
        y: -80, ease: 'none',
      });

      // Parallax da imagem do porto
      gsap.to('.porto-image-card img, .porto-image img', {
        scrollTrigger: { trigger: '.porto-image-card, .porto-image', start: 'top bottom', end: 'bottom top', scrub: 1 },
        y: -40, ease: 'none',
      });

      // Efeito 3D tilt nos cards ao mover o mouse
      const cards = document.querySelectorAll('.card');
      const tiltHandlers: Array<{ el: HTMLElement; move: (e: MouseEvent) => void; leave: () => void }> = [];

      cards.forEach((cardEl) => {
        const card = cardEl as HTMLElement;
        const handleMove = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          card.style.setProperty('--mouse-x', `${x}%`);
          card.style.setProperty('--mouse-y', `${y}%`);

          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = ((e.clientY - rect.top) - centerY) / 10;
          const rotateY = (centerX - (e.clientX - rect.left)) / 10;
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
        };
        const handleLeave = () => {
          card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        };
        card.addEventListener('mousemove', handleMove);
        card.addEventListener('mouseleave', handleLeave);
        tiltHandlers.push({ el: card, move: handleMove, leave: handleLeave });
      });

      return () => {
        tiltHandlers.forEach(({ el, move, leave }) => {
          el.removeEventListener('mousemove', move);
          el.removeEventListener('mouseleave', leave);
        });
      };
    });

    return () => ctx.revert();
  }, []);
}
