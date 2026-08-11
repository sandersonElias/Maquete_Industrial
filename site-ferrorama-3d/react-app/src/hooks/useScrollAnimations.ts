import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Animações de scroll.
 *
 * As entradas (fade-in, slide, reveal de títulos, contadores) ficam a cargo do
 * Framer Motion em cada componente — evita duas bibliotecas brigando pelo mesmo
 * elemento.
 *
 * Aqui ficam apenas os parallax com scrub, que o GSAP resolve melhor.
 *
 * O tilt 3D dos cards foi removido: eram dois listeners de mousemove por card,
 * cada um chamando getBoundingClientRect e escrevendo `transform` a cada
 * movimento do mouse. Com ~12 cards na página isso causava recálculo de layout
 * constante — parte do peso que o site tinha.
 */
export default function useScrollAnimations() {
  useEffect(() => {
    // Respeita a preferência de movimento reduzido do sistema
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      // Parallax dos orbs do hero
      const orbs: Array<[string, number]> = [
        ['.orb-1', -100],
        ['.orb-2', -150],
        ['.orb-3', -80],
      ];

      orbs.forEach(([seletor, y]) => {
        gsap.to(seletor, {
          scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
          y,
          ease: 'none',
        });
      });

      // Parallax da imagem do porto
      gsap.to('.porto-image-card img, .porto-image img', {
        scrollTrigger: {
          trigger: '.porto-image-card, .porto-image',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
        y: -40,
        ease: 'none',
      });
    });

    return () => ctx.revert();
  }, []);
}
