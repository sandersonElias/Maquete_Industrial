import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const stepVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.9 },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: 0.6 + i * 0.1,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export default function MinaSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const steps = [
    { num: '01', text: 'Extração', desc: 'Escavação a céu aberto' },
    { num: '02', text: 'Britagem', desc: 'Fragmentação do minério' },
    { num: '03', text: 'Transporte', desc: 'Ferrovia até o porto' },
    { num: '04', text: 'Exportação', desc: 'Embarque internacional' },
  ];

  return (
    <section id="mina" className="section" data-bg="gradient" ref={ref}>
      <div className="section-container">
        <div className="section-header">
          <motion.span
            className="section-number"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            04
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Mina de Ferro
          </motion.h2>
          <motion.p
            className="section-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            O que é uma mina e como reproduzimos na maquete
          </motion.p>
        </div>

        <div className="mina-layout">
          <motion.div
            className="mina-stats-card"
            initial={{ x: -60, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mina-stat">
              <span className="mina-stat-value">+</span>
              <span className="mina-stat-text">400 milhões</span>
              <span className="mina-stat-label">de toneladas exportadas/ano</span>
            </div>
            <div className="mina-stat-divider"></div>
            <div className="mina-stat">
              <span className="mina-stat-value mina-stat-value-sm">1º</span>
              <span className="mina-stat-text">Exportador</span>
              <span className="mina-stat-label">mundial de minério de ferro</span>
            </div>
          </motion.div>

          <motion.p
            className="mina-description"
            initial={{ y: 30, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            O Brasil é um dos maiores exportadores mundiais de minério de ferro. Na maquete, simulamos todo o processo de extração, desde a mina até o transporte ferroviário.
          </motion.p>

          <div className="mina-process">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="process-step"
                custom={i}
                variants={stepVariants}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                whileHover={{ scale: 1.05, borderColor: 'rgba(204, 102, 0, 0.4)' }}
              >
                <span className="step-num">{step.num}</span>
                <div className="step-content">
                  <span className="step-text">{step.text}</span>
                  <span className="step-desc">{step.desc}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
