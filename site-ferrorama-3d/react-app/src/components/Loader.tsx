import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE_OUT_EXPO, usePrefersReducedMotion } from '../lib/motion';
import AirplaneModeIcon from './AirplaneModeIcon';

/** Splash: Ferr[engrenagem]rama + avião modo avião cruzando o brand em 2s. */
export default function Loader() {
  const [hidden, setHidden] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => setHidden(true), reduced ? 500 : 2000);
    return () => clearTimeout(timer);
  }, [reduced]);

  useEffect(() => {
    if (hidden) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
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
                  <AirplaneModeIcon size={40} className="loader-flyby__icon" />
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
