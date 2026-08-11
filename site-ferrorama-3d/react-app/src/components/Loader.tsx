import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE_OUT_EXPO } from '../lib/motion';

/** Splash curto da marca — a maquete 3D carrega depois, na própria seção. */
export default function Loader() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setHidden(true), 520);
    return () => clearTimeout(timer);
  }, []);

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
            <motion.p
              className="loader-text"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              Ferrorama
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
