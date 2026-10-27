import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { EASE_OUT_EXPO, usePrefersReducedMotion } from '../lib/motion';

const HEADER_SCROLL_ON = 24;
const HEADER_SCROLL_OFF = 8;
const RAIL_SPEED = 1.25;

function isLoaderGone() {
  return !document.querySelector('.loader');
}

function paintRails(
  left: HTMLDivElement | null,
  right: HTMLDivElement | null,
  scrollY: number
) {
  const period = (left?.offsetHeight ?? 0) / 2 || 800;
  const shift = (scrollY * RAIL_SPEED) % period;
  const leftTransform = `translate3d(0, ${-shift}px, 0)`;
  const rightTransform = `translate3d(0, ${shift - period}px, 0)`;

  if (left) left.style.transform = leftTransform;
  if (right) right.style.transform = rightTransform;

  document.documentElement.style.setProperty('--rail-shift', shift.toFixed(2));
}

/**
 * Trilhos laterais contínuos (cabeçalho + página) — detalhe sutil.
 * Parallax no scroll; ocultos no mobile.
 */
export default function PageRails() {
  const reduced = usePrefersReducedMotion();
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(reduced);
  const [headerCovered, setHeaderCovered] = useState(() =>
    typeof window !== 'undefined' ? window.scrollY > HEADER_SCROLL_ON : false
  );
  const [desktop, setDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 901px)').matches : true
  );
  const { scrollY } = useScroll();

  useEffect(() => {
    if (reduced) {
      setReady(true);
      return;
    }

    if (isLoaderGone()) {
      const timer = window.setTimeout(() => setReady(true), 80);
      return () => window.clearTimeout(timer);
    }

    const observer = new MutationObserver(() => {
      if (!isLoaderGone()) return;
      observer.disconnect();
      window.setTimeout(() => setReady(true), 120);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const fallback = window.setTimeout(() => {
      observer.disconnect();
      setReady(true);
    }, 1600);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [reduced]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)');
    const onMq = () => setDesktop(mq.matches);
    onMq();
    mq.addEventListener('change', onMq);
    return () => mq.removeEventListener('change', onMq);
  }, []);

  useMotionValueEvent(scrollY, 'change', (y) => {
    if (!desktop) return;
    setHeaderCovered((prev) => {
      if (!prev && y > HEADER_SCROLL_ON) return true;
      if (prev && y < HEADER_SCROLL_OFF) return false;
      return prev;
    });
    paintRails(leftRef.current, rightRef.current, y);
  });

  useEffect(() => {
    if (!desktop) return;

    const syncHeader = () => {
      const y = window.scrollY;
      setHeaderCovered((prev) => {
        if (!prev && y > HEADER_SCROLL_ON) return true;
        if (prev && y < HEADER_SCROLL_OFF) return false;
        return prev;
      });
    };

    let raf = 0;
    const onScroll = () => {
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          const y = window.scrollY;
          syncHeader();
          paintRails(leftRef.current, rightRef.current, y);
        });
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [desktop]);

  if (!desktop) return null;

  const motionTransition = reduced
    ? { duration: 0 }
    : { duration: 0.65, ease: EASE_OUT_EXPO };

  return (
    <motion.div
      className="page-rail-columns"
      aria-hidden="true"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: ready ? 1 : 0 }}
      transition={motionTransition}
    >
      <div className="page-rail-column page-rail-column--left">
        <div className="page-rail__track" ref={leftRef}>
          <RailSvg id="l" />
          <RailSvg id="l2" />
        </div>
        <div className={`page-rail__scrub${reduced ? ' is-static' : ''}`} />
        <motion.div
          className="page-rail__nav-veil"
          initial={false}
          animate={{
            opacity: headerCovered ? 1 : 0,
            y: headerCovered ? 0 : -6,
          }}
          transition={motionTransition}
        />
      </div>

      <div className="page-rail-column page-rail-column--right">
        <div className="page-rail__track" ref={rightRef}>
          <RailSvg id="r" mirror />
          <RailSvg id="r2" mirror />
        </div>
        <div className={`page-rail__scrub page-rail__scrub--alt${reduced ? ' is-static' : ''}`} />
        <motion.div
          className="page-rail__nav-veil"
          initial={false}
          animate={{
            opacity: headerCovered ? 1 : 0,
            y: headerCovered ? 0 : -6,
          }}
          transition={motionTransition}
        />
      </div>
    </motion.div>
  );
}

function RailSvg({ id, mirror = false }: { id: string; mirror?: boolean }) {
  const ties = `ties-${id}`;
  const steel = `steel-${id}`;

  return (
    <svg
      className={`page-rail__svg${mirror ? ' page-rail__svg--mirror' : ''}`}
      viewBox="0 0 48 800"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={ties} width="48" height="36" patternUnits="userSpaceOnUse">
          <rect x="5" y="12" width="38" height="6" rx="1" fill="#4a382c" opacity="0.95" />
          <rect x="7" y="13.5" width="34" height="2.5" rx="0.5" fill="#6b5240" opacity="0.55" />
        </pattern>
        <linearGradient id={steel} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8844" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#ddd2c4" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2d8b8b" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      <rect x="3" y="0" width="42" height="800" fill={`url(#${ties})`} />

      <rect x="11" y="0" width="4" height="800" fill={`url(#${steel})`} />
      <rect x="33" y="0" width="4" height="800" fill={`url(#${steel})`} />
      <rect x="11.8" y="0" width="1.2" height="800" fill="#fff" opacity="0.28" />
      <rect x="33.8" y="0" width="1.2" height="800" fill="#fff" opacity="0.28" />

      <g fill="none" stroke="#ff8844" strokeWidth="1.6" opacity="0.85">
        <path d="M13 40 H4 V70 H13" />
        <path d="M35 110 H44 V150 H35" />
        <path d="M13 200 H5 V245 H13" />
        <path d="M35 290 H43 V340 H35" />
        <path d="M13 390 H4 V440 H13" />
        <path d="M35 490 H44 V545 H35" />
        <path d="M13 600 H5 V650 H13" />
        <path d="M35 710 H43 V760 H35" />
      </g>
      <g fill="#ff8844">
        <circle cx="4" cy="40" r="2.6" />
        <circle cx="4" cy="70" r="2.6" />
        <circle cx="44" cy="110" r="2.6" />
        <circle cx="44" cy="150" r="2.6" />
        <circle cx="5" cy="200" r="2.6" />
        <circle cx="5" cy="245" r="2.6" />
        <circle cx="43" cy="290" r="2.6" />
        <circle cx="43" cy="340" r="2.6" />
        <circle cx="4" cy="390" r="2.6" />
        <circle cx="4" cy="440" r="2.6" />
        <circle cx="44" cy="490" r="2.6" />
        <circle cx="44" cy="545" r="2.6" />
        <circle cx="5" cy="600" r="2.6" />
        <circle cx="5" cy="650" r="2.6" />
        <circle cx="43" cy="710" r="2.6" />
        <circle cx="43" cy="760" r="2.6" />
      </g>

      <g fill="#2d8b8b" opacity="0.8">
        <rect x="9" y="160" width="8" height="4" rx="1" />
        <rect x="31" y="160" width="8" height="4" rx="1" />
        <rect x="9" y="420" width="8" height="4" rx="1" />
        <rect x="31" y="420" width="8" height="4" rx="1" />
        <rect x="9" y="680" width="8" height="4" rx="1" />
        <rect x="31" y="680" width="8" height="4" rx="1" />
      </g>
    </svg>
  );
}
