import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
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
          <div className="footer-brand-row">
            <img src="/images/trem-circuito.svg" alt="Ferrorama" style={{ width: '32px', height: '32px' }} />
            <span className="footer-logo">Ferrorama</span>
          </div>
          <p>Projeto escolar · Feira de ciências</p>
        </motion.div>

        <motion.div
          className="footer-nav"
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="footer-links">
            <a href="#inicio" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); document.getElementById('inicio')?.scrollIntoView({ behavior: 'smooth' }); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Início
            </a>
            <a href="#montagem" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); document.getElementById('montagem')?.scrollIntoView({ behavior: 'smooth' }); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Automação
            </a>
            <a href="#porto" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); document.getElementById('porto')?.scrollIntoView({ behavior: 'smooth' }); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3"/></svg>
              Porto
            </a>
            <a href="#mina" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); document.getElementById('mina')?.scrollIntoView({ behavior: 'smooth' }); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/></svg>
              Mina
            </a>
          </div>
        </motion.div>

        <motion.div
          className="footer-tech"
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="footer-tech-label">Tecnologias</div>
          <div className="footer-tech-stack">
            <span className="tech-pill">Three.js</span>
            <span className="tech-pill">GSAP</span>
            <span className="tech-pill">Arduino</span>
            <span className="tech-pill">React</span>
          </div>
        </motion.div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 Ferrorama — Projeto Escolar</p>
        <p className="footer-credit">Feito com Three.js, GSAP e muito café</p>
      </div>
    </footer>
  );
}
