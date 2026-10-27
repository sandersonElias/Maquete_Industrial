import { useEffect, useState } from 'react';

const THRESHOLD = 72;

/**
 * No celular, puxar para baixo no topo recarrega a página (como nos apps/sites comuns).
 * Força um parâmetro ?r= para furar cache do HTML.
 */
export default function usePullToRefresh(ativo = true) {
  const [puxando, setPuxando] = useState(0);
  const [recarregando, setRecarregando] = useState(false);

  useEffect(() => {
    if (!ativo) return;
    if (typeof window === 'undefined') return;

    const mobile = window.matchMedia('(max-width: 900px), (pointer: coarse)');
    if (!mobile.matches) return;

    let startY = 0;
    let dy = 0;
    let tracking = false;

    const onStart = (e: TouchEvent) => {
      if (recarregando) return;
      if (document.body.style.position === 'fixed') return;
      if (window.scrollY > 1) {
        tracking = false;
        return;
      }
      startY = e.touches[0]?.clientY ?? 0;
      dy = 0;
      tracking = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking || recarregando) return;
      if (document.body.style.position === 'fixed') {
        tracking = false;
        setPuxando(0);
        return;
      }
      if (window.scrollY > 1) {
        tracking = false;
        setPuxando(0);
        return;
      }
      const y = e.touches[0]?.clientY ?? startY;
      dy = Math.max(0, y - startY);
      if (dy > 12) {
        e.preventDefault();
        setPuxando(Math.min(dy, THRESHOLD * 1.35));
      }
    };

    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      const deveRecarregar = dy >= THRESHOLD;
      setPuxando(0);
      dy = 0;
      if (!deveRecarregar) return;

      setRecarregando(true);
      const url = new URL(window.location.href);
      url.searchParams.set('r', String(Date.now()));
      window.location.replace(url.toString());
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [ativo, recarregando]);

  return { puxando, recarregando };
}
