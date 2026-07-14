import { useRef, useEffect, Suspense } from 'react';
import { motion, useInView } from 'framer-motion';
import HeroScene from './HeroScene';
import MagneticButton from './MagneticButton';

const textReveal = {
  hidden: { y: '110%', opacity: 0 },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 1.2,
      delay: 0.6 + i * 0.18,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const fadeUp = {
  hidden: { y: 40, opacity: 0 },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      delay: 1.2 + i * 0.1,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 1.4,
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
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function HeroSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true });

  useEffect(() => {
    document.querySelectorAll('.hero-stat-value').forEach((stat) => {
      const target = parseInt(stat.dataset.count);
      if (!target) return;
      const obj = { value: 0 };
      const timeout = setTimeout(() => {
        const animate = () => {
          obj.value += (target - obj.value) * 0.05;
          stat.textContent = Math.floor(obj.value);
          if (Math.abs(target - obj.value) > 0.5) {
            requestAnimationFrame(animate);
          } else {
            stat.textContent = target;
          }
        };
        animate();
      }, 1800);
      return () => clearTimeout(timeout);
    });
  }, []);

  return (
    <section id="inicio" className="hero-section" data-bg="dark" ref={sectionRef}>
      <div className="hero-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="hero-grid-lines"></div>
      </div>

      <div className="hero-3d" id="hero3d">
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
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
          <MagneticButton
            href="#montagem"
            className="hero-cta"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('montagem')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <span>Ver Montagem</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7V17"/>
            </svg>
          </MagneticButton>
          <MagneticButton
            href="#codigo"
            className="hero-cta-secondary"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('codigo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <span>Ver Automação</span>
          </MagneticButton>
        </motion.div>
      </div>

      <motion.div
        className="scroll-indicator"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 0.8 }}
      >
        <span>Role para baixo</span>
        <div className="scroll-arrow"></div>
      </motion.div>
    </section>
  );
}
