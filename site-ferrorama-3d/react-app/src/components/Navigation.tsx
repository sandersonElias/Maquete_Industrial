import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE_OUT_EXPO } from '../lib/motion';
import { lockPageScroll, unlockPageScroll, scrollToSection } from '../lib/scroll';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Início', thumb: '/images/pecas-conjunto.jpg' },
  { id: 'maquete', label: 'Maquete', thumb: '/images/pecas-conjunto.jpg' },
  { id: 'preparacao', label: 'Preparação', thumb: '/images/caminhao-eletronica.jpg' },
  { id: 'montagem', label: 'Montagem', thumb: '/images/caminhoes-mini-dump.jpg' },
  { id: 'codigo', label: 'Automação', thumb: '/images/arduino-bancada.jpg' },
  { id: 'mina', label: 'Mina', thumb: '/images/mina-real.jpg' },
  { id: 'porto', label: 'Porto', thumb: '/images/porto.jpg' },
  { id: 'controle', label: 'Controle', thumb: '/images/scada-dashboard.jpg' },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  const [scrollProgress, setScrollProgress] = useState(0);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const scrollTimer = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const handleScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > 50);
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0);
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { root: null, rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );

    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    lockPageScroll();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        menuBtnRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlockPageScroll();
    };
  }, [mobileOpen]);

  useEffect(() => {
    return () => {
      if (scrollTimer.current != null) window.clearTimeout(scrollTimer.current);
    };
  }, []);

  const closeMenu = () => setMobileOpen(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    closeMenu();
    if (scrollTimer.current != null) window.clearTimeout(scrollTimer.current);
    // Após o unlock do position:fixed, o scrollY é restaurado — aí sim navega.
    scrollTimer.current = window.setTimeout(() => scrollToSection(id), 120);
  };

  return (
    <>
      <div
        className="scroll-progress-bar"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-label="Progresso de leitura da página"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      <motion.nav
        className={`nav ${scrolled ? 'scrolled' : ''}`}
        aria-label="Navegação principal"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.2 }}
      >
        <a
          className="nav-brand"
          href="#inicio"
          onClick={(e) => handleNavClick(e, 'inicio')}
          aria-label="Ferrorama — voltar ao início"
        >
          <img
            src="/images/trem-circuito.svg"
            alt=""
            aria-hidden="true"
            style={{ height: '32px', width: 'auto', marginRight: '0.5rem' }}
            loading="eager"
          />
          <span className="nav-title">Ferrorama</span>
        </a>

        <div className="nav-links">
          {NAV_ITEMS.map(({ id, label }, i) => (
            <motion.a
              key={id}
              href={`#${id}`}
              className={`nav-link ${activeSection === id ? 'active' : ''}`}
              aria-current={activeSection === id ? 'true' : undefined}
              onClick={(e) => handleNavClick(e, id)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.05, ease: EASE_OUT_EXPO }}
              whileHover={{ y: -2 }}
            >
              {label}
            </motion.a>
          ))}
        </div>

        <button
          ref={menuBtnRef}
          type="button"
          className={`nav-menu-btn ${mobileOpen ? 'is-open' : ''}`}
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileOpen}
          aria-controls="menu-mobile"
        >
          <span className="nav-menu-btn__bar" aria-hidden="true" />
          <span className="nav-menu-btn__bar" aria-hidden="true" />
          <span className="nav-menu-btn__bar" aria-hidden="true" />
        </button>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="mobile-menu-backdrop"
              onClick={closeMenu}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-hidden="true"
            />
            <motion.div
              id="menu-mobile"
              className="mobile-menu active"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de seções"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
            >
              {NAV_ITEMS.map(({ id, label, thumb }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={`mobile-link ${activeSection === id ? 'active' : ''}`}
                  aria-current={activeSection === id ? 'true' : undefined}
                  onClick={(e) => handleNavClick(e, id)}
                >
                  <img src={thumb} alt="" aria-hidden="true" className="mobile-link-thumb" loading="lazy" />
                  <span>{label}</span>
                </a>
              ))}
              <a href="/maquete" className="mobile-link mobile-link--cta" onClick={closeMenu}>
                <img
                  src="/images/pecas-conjunto.jpg"
                  alt=""
                  aria-hidden="true"
                  className="mobile-link-thumb"
                  loading="lazy"
                />
                <span>Abrir maquete em tela cheia</span>
              </a>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
