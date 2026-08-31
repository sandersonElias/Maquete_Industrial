import { useRef, type RefObject } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import CtaLink from './CtaLink';
import { EASE_OUT_EXPO, useHasFinePointer, usePrefersReducedMotion } from '../lib/motion';
import { scrollToSection } from '../lib/scroll';

const textReveal = {
  hidden: { y: '115%', opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.75,
      delay: 0.2 + i * 0.08,
      ease: EASE_OUT_EXPO,
    },
  }),
};

const fadeUp = {
  hidden: { y: 28, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.55,
      delay: 0.45 + i * 0.07,
      ease: EASE_OUT_EXPO,
    },
  }),
};

const SECTION_JUMPS = [
  { id: 'maquete', label: 'Maquete' },
  { id: 'montagem', label: 'Montagem' },
  { id: 'codigo', label: 'Automação' },
  { id: 'mina', label: 'Mina' },
  { id: 'porto', label: 'Porto' },
  { id: 'controle', label: 'Controle' },
];

export default function HeroSection() {
  const reduced = usePrefersReducedMotion();
  const finePointer = useHasFinePointer();
  const parallax = !reduced && finePointer;

  return parallax ? <HeroParallax /> : <HeroStatic />;
}

function HeroStatic() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true });

  return (
    <HeroShell sectionRef={sectionRef} isInView={isInView}>
      <div className="hero-bg-media">
        <HeroBgImage />
      </div>
    </HeroShell>
  );
}

function HeroParallax() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  return (
    <HeroShell
      sectionRef={sectionRef}
      isInView={isInView}
      contentStyle={{ opacity: contentOpacity }}
    >
      <motion.div className="hero-bg-media" style={{ y: bgY, scale: bgScale }}>
        <HeroBgImage />
      </motion.div>
    </HeroShell>
  );
}

function HeroBgImage() {
  return (
    <img
      src="/images/pecas-conjunto.jpg"
      alt=""
      aria-hidden="true"
      className="hero-bg-image"
      loading="eager"
      decoding="async"
      fetchPriority="high"
    />
  );
}

function HeroShell({
  sectionRef,
  isInView,
  contentStyle,
  children,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  isInView: boolean;
  contentStyle?: Record<string, unknown>;
  children: React.ReactNode;
}) {
  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <section id="inicio" className="hero-section hero-section--cinematic" data-bg="dark" ref={sectionRef}>
      <div className="hero-bg">
        {children}
        <div className="hero-bg-wash" aria-hidden="true" />
        <div className="hero-bg-vignette" aria-hidden="true" />
        <div className="hero-bg-rail" aria-hidden="true" />
      </div>

      <motion.div className="hero-content" style={contentStyle}>
        <motion.p
          className="hero-brand"
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          Maquete Industrial
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
          Mina a céu aberto, ferrovia e porto — automação Arduino em escala HO. O QR da feira abre a maquete em tela cheia.
        </motion.p>

        <motion.div
          className="hero-actions"
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <CtaLink href="/maquete" className="hero-cta">
            <span>Abrir maquete em tela cheia</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </CtaLink>
          <CtaLink href="#maquete" className="hero-cta-secondary" onClick={(e) => go(e, 'maquete')}>
            <span>Ver no site</span>
          </CtaLink>
        </motion.div>

        <motion.nav
          className="hero-jumps"
          aria-label="Ir para seções"
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {SECTION_JUMPS.map(({ id, label }, i) => (
            <span key={id} className="hero-jumps__item">
              {i > 0 && <span className="hero-jumps__sep" aria-hidden="true">·</span>}
              <a href={`#${id}`} onClick={(e) => go(e, id)}>
                {label}
              </a>
            </span>
          ))}
        </motion.nav>
      </motion.div>

      <motion.a
        href="#maquete"
        className="scroll-indicator"
        aria-label="Ir para a maquete 3D"
        onClick={(e) => go(e, 'maquete')}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.45 }}
      >
        <span>Desça a linha</span>
        <div className="scroll-arrow" />
      </motion.a>
    </section>
  );
}
