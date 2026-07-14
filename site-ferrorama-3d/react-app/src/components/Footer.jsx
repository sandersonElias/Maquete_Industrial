import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function Footer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <footer className="footer" ref={ref}>
      <div className="footer-content">
        <motion.div
          className="footer-brand"
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="footer-logo">Ferrorama</span>
          <p>Projeto escolar · Feira de ciências</p>
        </motion.div>
        <motion.div
          className="footer-tech"
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p>Feito com Three.js, GSAP e muito café</p>
        </motion.div>
      </div>
    </footer>
  );
}
