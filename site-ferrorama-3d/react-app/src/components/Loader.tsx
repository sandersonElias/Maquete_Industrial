import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE_OUT_EXPO, usePrefersReducedMotion } from '../lib/motion';
import { lockPageScroll, unlockPageScroll } from '../lib/scroll';

/** Splash: Ferr[engrenagem]rama + trem cruzando o brand em 2s. */
export default function Loader() {
  const [hidden, setHidden] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => setHidden(true), reduced ? 280 : 750);
    return () => clearTimeout(timer);
  }, [reduced]);

  useEffect(() => {
    if (hidden) return;
    lockPageScroll();
    return () => unlockPageScroll();
  }, [hidden]);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          className="loader"
          role="status"
          aria-live="polite"
          aria-label="Carregando Ferrorama"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
        >
          <div className="loader-content">
            <div className="loader-brand-stage">
              {!reduced && (
                <span className="loader-flyby" aria-hidden="true">
                  <TrainIcon size={40} className="loader-flyby__icon" />
                </span>
              )}

              <motion.p
                className="loader-brand"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              >
                <span className="loader-brand__text">Ferr</span>
                <span className="loader-brand__gear-wrap" aria-hidden="true">
                  <img
                    src="/images/loader-gear.png"
                    alt=""
                    className={`loader-gear${reduced ? ' is-static' : ''}`}
                    width={64}
                    height={64}
                    decoding="async"
                  />
                </span>
                <span className="loader-brand__text">rama</span>
              </motion.p>
            </div>

            <motion.span
              className="loader-rail"
              aria-hidden="true"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.55, delay: 0.1, ease: EASE_OUT_EXPO }}
            />
            <p className="loader-caption">Montando a linha…</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TrainIcon({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12,2C8,2 4,2.5 4,6V15.5C4,17.43 5.57,19 7.5,19L6,20.5V21H18V20.5L16.5,19C18.43,19 20,17.43 20,15.5V6C20,2.5 16,2 12,2M12,4C15.51,4 16.5,4.05 17.5,5H6.5C7.5,4.05 8.49,4 12,4M6,7H18V11H6V7M7,16A1.5,1.5 0 0,1 5.5,14.5A1.5,1.5 0 0,1 7,13A1.5,1.5 0 0,1 8.5,14.5A1.5,1.5 0 0,1 7,16M17,16A1.5,1.5 0 0,1 15.5,14.5A1.5,1.5 0 0,1 17,13A1.5,1.5 0 0,1 18.5,14.5A1.5,1.5 0 0,1 17,16M6,12H18V14.5H6V12Z"
        fill="#06060a"
        opacity="0.55"
        transform="translate(0.6 0.8)"
      />
      <path
        d="M12,2C8,2 4,2.5 4,6V15.5C4,17.43 5.57,19 7.5,19L6,20.5V21H18V20.5L16.5,19C18.43,19 20,17.43 20,15.5V6C20,2.5 16,2 12,2M12,4C15.51,4 16.5,4.05 17.5,5H6.5C7.5,4.05 8.49,4 12,4M6,7H18V11H6V7M7,16A1.5,1.5 0 0,1 5.5,14.5A1.5,1.5 0 0,1 7,13A1.5,1.5 0 0,1 8.5,14.5A1.5,1.5 0 0,1 7,16M17,16A1.5,1.5 0 0,1 15.5,14.5A1.5,1.5 0 0,1 17,13A1.5,1.5 0 0,1 18.5,14.5A1.5,1.5 0 0,1 17,16M6,12H18V14.5H6V12Z"
        fill="#ff8844"
      />
    </svg>
  );
}