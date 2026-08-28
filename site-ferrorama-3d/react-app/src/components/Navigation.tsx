import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { EASE_OUT_EXPO } from '../lib/motion';
import { scrollToSection } from '../lib/scroll';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Início', hideMobile: true },
  { id: 'maquete', label: 'Maquete' },
  { id: 'montagem', label: 'Montagem' },
  { id: 'codigo', label: 'Automação', shortMobile: 'Auto' },
  { id: 'mina', label: 'Mina' },
  { id: 'porto', label: 'Porto' },
  { id: 'controle', label: 'Controle' },
] as const;

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollTimer = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const handleScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        setScrolled(y > 50);
        const navBlend = Math.min(1, Math.max(0, y / 96));
        document.documentElement.style.setProperty('--nav-scroll', navBlend.toFixed(3));
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(docHeight > 0 ? (y / docHeight) * 100 : 0);
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
    return () => {
      if (scrollTimer.current != null) window.clearTimeout(scrollTimer.current);
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    if (scrollTimer.current != null) window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => scrollToSection(id), 0);
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
        <div className="nav-inner">
          <a
            className="nav-brand"
            href="#inicio"
            onClick={(e) => handleNavClick(e, 'inicio')}
            aria-label="Ferrorama — voltar ao início"
          >
            <span className="nav-brand-mark" aria-hidden="true">
              <img
                src="/images/loader-gear.png"
                alt=""
                width={28}
                height={28}
                decoding="async"
                loading="eager"
              />
            </span>
            <span className="nav-brand-text">
              <span className="nav-title">
                <span className="nav-title-part">Ferr</span>
                <span className="nav-title-part">rama</span>
              </span>
              <span className="nav-tagline">Da mina ao porto</span>
            </span>
          </a>

          <div className="nav-links" role="list">
            {NAV_ITEMS.map(({ id, label, hideMobile, shortMobile }, i) => (
              <motion.a
                key={id}
                href={`#${id}`}
                className={[
                  'nav-link',
                  activeSection === id ? 'active' : '',
                  hideMobile ? 'nav-link--hide-mobile' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={activeSection === id ? 'true' : undefined}
                onClick={(e) => handleNavClick(e, id)}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.25 + i * 0.04, ease: EASE_OUT_EXPO }}
                role="listitem"
              >
                {shortMobile ? (
                  <>
                    <span className="nav-link__full">{label}</span>
                    <span className="nav-link__short" aria-hidden="true">
                      {shortMobile}
                    </span>
                  </>
                ) : (
                  label
                )}
              </motion.a>
            ))}
          </div>
        </div>
      </motion.nav>
    </>
  );
}
