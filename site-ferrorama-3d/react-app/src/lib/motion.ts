import { useEffect, useState } from 'react';

/**
 * Curva de easing padrão do site (out-expo).
 *
 * Precisa ser uma tupla readonly: o Framer Motion tipa `ease` como
 * `[number, number, number, number]`, e um `number[]` solto não é aceito.
 */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Curva com leve overshoot, usada em entradas de cards. */
export const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const;

/**
 * Retorna `true` quando o usuário pediu movimento reduzido no sistema.
 * Reage a mudanças da preferência em tempo real.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * `true` apenas em ponteiros de precisão (mouse/trackpad) com hover real.
 * Mais confiável que `'ontouchstart' in window`, que dá falso positivo em
 * notebooks com tela sensível ao toque.
 */
export function useHasFinePointer(): boolean {
  const [fine, setFine] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const onChange = () => setFine(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return fine;
}
