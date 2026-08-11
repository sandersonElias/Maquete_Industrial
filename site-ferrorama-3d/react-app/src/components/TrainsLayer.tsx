import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../lib/motion';

export interface TrainConfig {
  id: number;
  speed: number;
  color: string;
  name: string;
  active: boolean;
  direction: number;
}

interface TrainsLayerProps {
  trains: TrainConfig[];
  trackPath: string;
  globalSpeed: number;
  globalReversed: boolean;
}

/** Vagões de cada composição: deslocamento atrás da locomotiva e tamanho. */
const WAGONS = [
  { offset: 0, w: 14, h: 7, isLoco: true },
  { offset: 0.025, w: 10, h: 5, isLoco: false },
  { offset: 0.045, w: 10, h: 5, isLoco: false },
];

/**
 * Camada de trens animados sobre o traçado.
 *
 * O progresso vive em refs e é escrito direto no atributo `transform` de cada
 * grupo SVG. Antes isso era estado do React atualizado a cada quadro, o que
 * re-renderizava a seção inteira (mapa, FAQ, painel) 60 vezes por segundo.
 */
export default function TrainsLayer({
  trains,
  trackPath,
  globalSpeed,
  globalReversed,
}: TrainsLayerProps) {
  const measurePathRef = useRef<SVGPathElement>(null);
  const groupRefs = useRef<Map<number, SVGGElement>>(new Map());
  const progressRef = useRef<Map<number, number>>(new Map());
  const trainsRef = useRef(trains);
  const speedRef = useRef(globalSpeed);
  const reversedRef = useRef(globalReversed);
  const reduced = usePrefersReducedMotion();

  trainsRef.current = trains;
  speedRef.current = globalSpeed;
  reversedRef.current = globalReversed;

  // Trem novo entra em uma posição aleatória do circuito
  trains.forEach((t) => {
    if (!progressRef.current.has(t.id)) progressRef.current.set(t.id, Math.random());
  });

  /** Escreve a posição de uma composição direto no DOM, sem passar pelo React. */
  const place = (path: SVGPathElement, totalLen: number, t: TrainConfig, p: number) => {
    const g = groupRefs.current.get(t.id);
    if (!g) return;

    const pt = path.getPointAtLength(p * totalLen);
    g.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
    g.setAttribute('opacity', t.active ? '1' : '0.3');

    // Os vagões seguem o mesmo traçado, atrasados em relação à locomotiva
    WAGONS.forEach((wagon, wi) => {
      if (wi === 0) return;
      const wagonEl = g.querySelector<SVGGElement>(`[data-wagon="${wi}"]`);
      if (!wagonEl) return;
      const wp = (((p - wagon.offset) % 1) + 1) % 1;
      const wpt = path.getPointAtLength(wp * totalLen);
      wagonEl.setAttribute('transform', `translate(${wpt.x - pt.x}, ${wpt.y - pt.y})`);
    });
  };

  // Posicionamento inicial antes da pintura. Sem isso as composições apareceriam
  // empilhadas na origem do SVG até o primeiro quadro — o que chega a acontecer,
  // já que o rAF não roda enquanto a aba está oculta.
  useLayoutEffect(() => {
    const path = measurePathRef.current;
    if (!path) return;
    const totalLen = path.getTotalLength();
    trains.forEach((t) => place(path, totalLen, t, progressRef.current.get(t.id) ?? 0));
  });

  useEffect(() => {
    const path = measurePathRef.current;
    if (!path) return;

    const totalLen = path.getTotalLength();
    let last = 0;
    let frame = 0;

    const draw = (time: number) => {
      const delta = last ? Math.min((time - last) / 1000, 0.05) : 0;
      last = time;

      trainsRef.current.forEach((t) => {
        let p = progressRef.current.get(t.id) ?? 0;
        if (t.active && !reduced && delta > 0) {
          const dir = reversedRef.current ? -t.direction : t.direction;
          p += t.speed * speedRef.current * dir * delta;
          p = ((p % 1) + 1) % 1;
          progressRef.current.set(t.id, p);
        }
        place(path, totalLen, t, p);
      });

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [trackPath, reduced]);

  return (
    <>
      {/* Traçado invisível usado apenas para medir posições */}
      <path ref={measurePathRef} d={trackPath} fill="none" stroke="transparent" strokeWidth="0" />

      {trains.map((tr) => (
        <g
          key={tr.id}
          ref={(el) => {
            if (el) groupRefs.current.set(tr.id, el);
            else groupRefs.current.delete(tr.id);
          }}
        >
          {WAGONS.map((wagon, wi) => (
            <g key={wi} data-wagon={wi}>
              <rect
                x={-wagon.w / 2}
                y={-wagon.h / 2}
                width={wagon.w}
                height={wagon.h}
                rx={wagon.isLoco ? 2.5 : 1.5}
                fill={tr.color}
                opacity={wagon.isLoco ? 1 : 0.55}
              />
              {wagon.isLoco && (
                <>
                  {/* Cabine */}
                  <rect
                    x={-wagon.w / 2 + 2}
                    y={-wagon.h / 2 - 2}
                    width={4}
                    height={2}
                    rx={0.8}
                    fill={tr.color}
                    opacity={0.9}
                  />
                  {/* Janelas */}
                  <rect x={-3} y={-2} width={2} height={1.5} rx={0.3} fill="#b8e0ff" opacity="0.8" />
                  <rect x={0} y={-2} width={2} height={1.5} rx={0.3} fill="#b8e0ff" opacity="0.8" />
                  {/* Farol */}
                  <circle cx={wagon.w / 2} cy={0} r={1.2} fill="#ffd700" />
                </>
              )}
              {/* Rodas */}
              <circle cx={-wagon.w / 4} cy={wagon.h / 2} r={1.2} fill="#1a1a1a" />
              <circle cx={wagon.w / 4} cy={wagon.h / 2} r={1.2} fill="#1a1a1a" />
            </g>
          ))}

          {/* Indicador de composição em movimento */}
          {tr.active && (
            <circle cx={0} cy={-8} r={1.2} fill="#22c55e">
              {!reduced && (
                <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
              )}
            </circle>
          )}
        </g>
      ))}
    </>
  );
}
