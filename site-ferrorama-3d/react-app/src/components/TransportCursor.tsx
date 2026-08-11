import { useEffect, useRef, useState } from 'react';
import { useHasFinePointer } from '../lib/motion';
import AirplaneModeIcon from './AirplaneModeIcon';

/**
 * Ponteiro = ícone clássico de “modo avião” (OS).
 * No clique troca para o ícone de navio/barco do porto.
 * Hot-spot = ponta do nariz (= clientX/clientY).
 */
export default function TransportCursor() {
  const fine = useHasFinePointer();
  const elRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState(false);
  const rafRef = useRef(0);
  const posRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!fine) return;

    const root = document.documentElement;
    root.classList.add('has-transport-cursor');

    const paint = () => {
      rafRef.current = 0;
      const el = elRef.current;
      if (!el) return;
      const { x, y } = posRef.current;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      el.classList.add('is-visible');
    };

    const onMove = (e: PointerEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!rafRef.current) rafRef.current = requestAnimationFrame(paint);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button === 0) setPressed(true);
    };
    const onUp = () => setPressed(false);
    const onLeave = () => {
      elRef.current?.classList.remove('is-visible');
      setPressed(false);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    document.documentElement.addEventListener('mouseleave', onLeave);

    return () => {
      root.classList.remove('has-transport-cursor');
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, [fine]);

  if (!fine) return null;

  return (
    <div
      ref={elRef}
      className={`transport-cursor${pressed ? ' is-boat' : ' is-plane'}`}
      aria-hidden="true"
    >
      <div className="transport-cursor__plane">
        <AirplaneModeIcon size={32} className="transport-cursor__svg" />
      </div>
      <div className="transport-cursor__boat">
        <BoatModeIcon />
      </div>
    </div>
  );
}

function BoatModeIcon() {
  return (
    <svg
      width="32"
      height="28"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="transport-cursor__svg"
    >
      <path
        d="M3 17.5 12 7l9 10.5H3z"
        fill="#06060a"
        opacity="0.45"
        transform="translate(0.5 0.7)"
      />
      <path d="M3 17 12 6.5 21 17H3z" fill="#2d8b8b" />
      <path
        d="M2 18.5c1.5 1.2 3.5 1.8 5.5 1.8s4-.6 5.5-1.8c1.5 1.2 3.5 1.8 5.5 1.8"
        fill="none"
        stroke="#4db8b8"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect x="10.2" y="9.5" width="3.6" height="4" rx="0.4" fill="#ff8844" />
    </svg>
  );
}
