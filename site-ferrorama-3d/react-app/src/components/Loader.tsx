import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE_OUT_EXPO } from '../lib/motion';

export default function Loader() {
  const [hidden, setHidden] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 18 + 8;
      });
    }, 80);

    const timer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setHidden(true), 300);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  // Impede que a página role por trás da tela de carregamento
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
          aria-label="Carregando o site"
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
        >
          <div className="loader-content">
            <motion.div
              className="loader-icon"
              aria-hidden="true"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <svg viewBox="0 0 100 100" className="loader-svg">
                <circle cx="50" cy="50" r="45" className="loader-circle" />
              </svg>
            </motion.div>
            <motion.p
              className="loader-text"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Carregando experiência 3D...
            </motion.p>
            <div className="loader-progress">
              <motion.div
                className="loader-progress-bar"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
