import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import CtaLink from './CtaLink';
import { EASE_OUT_EXPO, usePrefersReducedMotion } from '../lib/motion';

const textReveal = {
  hidden: { y: '115%', opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 1,
      delay: 0.35 + i * 0.12,
      ease: EASE_OUT_EXPO,
    },
  }),
};

const fadeUp = {
  hidden: { y: 36, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.75,
      delay: 0.7 + i * 0.1,
      ease: EASE_OUT_EXPO,
    },
  }),
};

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const navH =
    parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 64;
  const top = el.getBoundingClientRect().top + window.scrollY - navH - 8;
  window.scrollTo({ top, behavior: 'smooth' });
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true });
  const reduced = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '18%']);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.08]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  return (
    <section id="inicio" className="hero-section hero-section--cinematic" data-bg="dark" ref={sectionRef}>
      <div className="hero-bg">
        <motion.div className="hero-bg-media" style={{ y: bgY, scale: bgScale }}>
          <img
            src="/images/maquete-montagem-2.png"
            alt=""
            aria-hidden="true"
            className="hero-bg-image"
            loading="eager"
            decoding="async"
          />
        </motion.div>
        <div className="hero-bg-wash" aria-hidden="true" />
        <div className="hero-bg-vignette" aria-hidden="true" />
        <div className="hero-bg-rail" aria-hidden="true" />
      </div>

      <motion.div className="hero-content" style={{ opacity: contentOpacity }}>
        <motion.p
          className="hero-brand"
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          Ferrorama
        </motion.p>

        <h1 className="hero-title">
          <span className="title-line title-accent">
            <motion.span custom={0} variants={textReveal} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
              Da mina ao porto
            </motion.span>
          </span>
          <span className="title-line">
            <motion.span custom={1} variants={textReveal} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
              em escala HO
            </motion.span>
          </span>
        </h1>

        <motion.p
          className="hero-description"
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          Uma maquete viva: mineração, trilhos e automação Arduino numa experiência interativa.
        </motion.p>

        <motion.div
          className="hero-actions"
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <CtaLink
            href="#maquete"
            className="hero-cta"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              scrollToId('maquete');
            }}
          >
            <span>Explorar maquete 3D</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </CtaLink>
          <CtaLink
            href="#codigo"
            className="hero-cta-secondary"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              scrollToId('codigo');
            }}
          >
            <span>Ver automação</span>
          </CtaLink>
        </motion.div>
      </motion.div>

      <motion.div
        className="scroll-indicator"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.35, duration: 0.6 }}
      >
        <span>Desça a linha</span>
        <div className="scroll-arrow" />
      </motion.div>
    </section>
  );
}
