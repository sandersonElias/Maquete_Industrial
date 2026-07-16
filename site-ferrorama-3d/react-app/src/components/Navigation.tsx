import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Início' },
  { id: 'montagem', label: 'Montagem' },
  { id: 'codigo', label: 'Automação' },
  { id: 'porto', label: 'Porto' },
  { id: 'mina', label: 'Mina' },
  { id: 'controle', label: 'Controle' },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
      { root: null, rootMargin: '0px', threshold: 0.3 }
    );

    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const target = document.getElementById(id);
    if (target) {
      window.scrollTo({ top: target.offsetTop - 70, behavior: 'smooth' });
    }
  };

  return (
    <>
      <motion.nav
        className={`nav ${scrolled ? 'scrolled' : ''}`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      >
        <div className="nav-brand">
          <motion.span
            className="nav-logo"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            F
          </motion.span>
          <span className="nav-title">Ferrorama</span>
        </div>
        <div className="nav-links">
          {NAV_ITEMS.map(({ id, label }, i) => (
            <motion.a
              key={id}
              href={`#${id}`}
              className={`nav-link ${activeSection === id ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, id)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2 }}
            >
              {label}
            </motion.a>
          ))}
        </div>
        <motion.button
          className={`nav-menu-btn ${mobileOpen ? 'active' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          whileTap={{ scale: 0.9 }}
        >
          <span></span><span></span><span></span>
        </motion.button>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-menu active"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {NAV_ITEMS.map(({ id, label }, i) => (
              <motion.a
                key={id}
                href={`#${id}`}
                className={`mobile-link ${activeSection === id ? 'active' : ''}`}
                onClick={(e) => handleNavClick(e, id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
