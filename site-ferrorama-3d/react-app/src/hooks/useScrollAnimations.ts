import { useEffect } from 'react';

/**
 * Hook reservado a parallax GSAP com scrub.
 *
 * Entradas (fade/slide) ficam no Framer Motion de cada seção.
 * Os alvos antigos (`.orb-*`, `.porto-image*`) sumiram do markup
 * cinematográfico — não cronometramos ScrollTrigger em vão.
 */
export default function useScrollAnimations() {
  useEffect(() => {
    // Sem alvos ativos no shell atual.
  }, []);
}
