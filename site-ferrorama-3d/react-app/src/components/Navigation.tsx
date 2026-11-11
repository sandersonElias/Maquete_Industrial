import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { EASE_OUT_EXPO } from '../lib/motion';
import { scrollToSection } from '../lib/scroll';
import { SECOES } from '../lib/nav';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  // Só serve o `aria-valuenow` da barra. A largura visual sai de `--scroll-progress`
  // (escrito no mesmo rAF) — sem isso a nav inteira re-renderizava a cada frame.
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    let alturaDocumento = 0;

    const medir = () => {
      alturaDocumento = document.documentElement.scrollHeight - window.innerHeight;
    };

    const handleScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        setScrolled(y > 50);
        const navBlend = Math.min(1, Math.max(0, y / 96));
        document.documentElement.style.setProperty('--nav-scroll', navBlend.toFixed(3));
        const pct = alturaDocumento > 0 ? (y / alturaDocumento) * 100 : 0;
        document.documentElement.style.setProperty('--scroll-progress', pct.toFixed(2));
        setScrollProgress((prev) => {
          const arredondado = Math.round(pct);
          return arredondado === prev ? prev : arredondado;
        });
      });
    };

    medir();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', medir, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', medir);
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

    SECOES.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <>
      <div
        className="scroll-progress-bar"
        role="progressbar"
        aria-label="Progresso de leitura da página"
        aria-valuenow={scrollProgress}
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
            aria-label="Maquete Industrial — voltar ao início"
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
                <span className="nav-title-part">Maquete</span>
                <span className="nav-title-part">Industrial</span>
              </span>
              <span className="nav-tagline">Da mina ao porto</span>
            </span>
          </a>

          <ul className="nav-links">
            {SECOES.map(({ id, label, curto, esconderNoMobile }, i) => (
              <li key={id} className={esconderNoMobile ? 'nav-item--hide-mobile' : undefined}>
                <motion.a
                  href={`#${id}`}
                  className={[
                    'nav-link',
                    activeSection === id ? 'active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={activeSection === id ? 'page' : undefined}
                  onClick={(e) => handleNavClick(e, id)}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.25 + i * 0.04, ease: EASE_OUT_EXPO }}
                >
                  {curto ? (
                    <>
                      <span className="nav-link__full">{label}</span>
                      <span className="nav-link__short" aria-hidden="true">
                        {curto}
                      </span>
                    </>
                  ) : (
                    label
                  )}
                </motion.a>
              </li>
            ))}
          </ul>
        </div>
      </motion.nav>
    </>
  );
}
