import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import CtaLink from './CtaLink';
import { EASE_OUT_EXPO, usePrefersReducedMotion } from '../lib/motion';

const textReveal = {
  hidden: { y: '110%', opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.9,
      delay: 0.3 + i * 0.12,
      ease: EASE_OUT_EXPO,
    },
  }),
};

const fadeUp = {
  hidden: { y: 40, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.7,
      delay: 0.8 + i * 0.08,
      ease: EASE_OUT_EXPO,
    },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 1,
    },
  },
};

const statItem = {
  hidden: { y: 30, opacity: 0, scale: 0.9 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: EASE_OUT_EXPO,
    },
  },
};

const imageReveal = {
  hidden: { opacity: 0, scale: 1.1 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1.2,
      delay: 0.3 + i * 0.15,
      ease: EASE_OUT_EXPO,
    },
  }),
};

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true });
  const reduced = usePrefersReducedMotion();

  // Contagem progressiva das estatísticas do hero.
  // O `return` dentro do forEach anterior era descartado — timers e frames
  // continuavam rodando após a desmontagem. Aqui tudo é coletado e cancelado.
  useEffect(() => {
    const stats = Array.from(document.querySelectorAll<HTMLElement>('.hero-stat-value'));

    // Movimento reduzido: mostra o número final direto, sem animar
    if (reduced) {
      stats.forEach((stat) => {
        stat.textContent = stat.dataset.count || '0';
      });
      return;
    }

    const timeouts: number[] = [];
    const frames: number[] = [];

    stats.forEach((stat) => {
      const target = parseInt(stat.dataset.count || '0', 10);
      if (!target) return;
      let value = 0;

      timeouts.push(
        window.setTimeout(() => {
          const step = () => {
            value += (target - value) * 0.05;
            if (Math.abs(target - value) > 0.5) {
              stat.textContent = String(Math.floor(value));
              frames.push(requestAnimationFrame(step));
            } else {
              stat.textContent = String(target);
            }
          };
          step();
        }, 1100)
      );
    });

    return () => {
      timeouts.forEach(clearTimeout);
      frames.forEach(cancelAnimationFrame);
    };
  }, [reduced]);

  return (
    <section id="inicio" className="hero-section" data-bg="dark" ref={sectionRef}>
      <div className="hero-bg">
        <img
          src="/images/maquete-montagem-2.png"
          alt=""
          aria-hidden="true"
          className="hero-bg-image"
          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }}
          loading="eager"
        />
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="hero-grid-lines"></div>

        {/* Floating image — mina only (locomotiva/porto removidos do painel inicial) */}
        <div className="hero-floating-images">
          <motion.div
            className="hero-float-img hero-float-3"
            custom={0}
            variants={imageReveal}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <img src="/images/mina-real.jpg" alt="Mina de ferro" />
            <span className="float-label">Mina</span>
          </motion.div>
        </div>
      </div>

      <div className="hero-content">
        <motion.div
          className="hero-badge"
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <span className="badge-dot"></span>
          Projeto Escolar · Escala HO · Arduino
        </motion.div>

        <h1 className="hero-title">
          <span className="title-line">
            <motion.span custom={0} variants={textReveal} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
              Maquete
            </motion.span>
          </span>
          <span className="title-line title-accent">
            <motion.span custom={1} variants={textReveal} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
              Ferroviária
            </motion.span>
          </span>
          <span className="title-line">
            <motion.span custom={2} variants={textReveal} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
              Interativa
            </motion.span>
          </span>
        </h1>

        <motion.p
          className="hero-description"
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          Da extração na mina até a exportação pelo porto — toda a cadeia produtiva do minério de ferro em uma maquete interativa com automação Arduino.
        </motion.p>

        <motion.div
          className="hero-stats"
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {[
            { value: '120', unit: 'cm', label: 'Base' },
            { value: '5', unit: 'áreas', label: 'Módulos' },
            { value: '3', unit: 'un.', label: 'Caminhões' },
            { value: '1', unit: 'Mega', label: 'Arduino' },
          ].map((stat, i) => (
            <motion.div key={i} className="stat-item" variants={statItem}>
              <span className="stat-value hero-stat-value" data-count={stat.value}>0</span>
              <span className="stat-unit">{stat.unit}</span>
              <span className="stat-label">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="hero-actions"
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <CtaLink
            href="#montagem"
            className="hero-cta"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              document.getElementById('montagem')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/>
            </svg>
            <span>Ver Montagem</span>
          </CtaLink>
          <CtaLink
            href="#codigo"
            className="hero-cta-secondary"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              document.getElementById('codigo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            <span>Ver Automação</span>
          </CtaLink>
          <CtaLink
            href="#porto"
            className="hero-cta-ghost"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              document.getElementById('porto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <span>Explorar Porto</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7V17"/>
            </svg>
          </CtaLink>
        </motion.div>
      </div>

      <motion.div
        className="scroll-indicator"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.6 }}
      >
        <span>Role para baixo</span>
        <div className="scroll-arrow"></div>
      </motion.div>
    </section>
  );
}
