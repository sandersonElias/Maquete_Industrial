import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { EASE_OUT_EXPO } from '../lib/motion';

const stepVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      delay: 0.55 + i * 0.08,
      ease: EASE_OUT_EXPO,
    },
  }),
};

const imageReveal = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: i * 0.15,
      ease: EASE_OUT_EXPO,
    },
  }),
};

const steps = [
  { num: '01', text: 'Extração', desc: 'Perfuração, detonação e escavação' },
  { num: '02', text: 'Britagem', desc: 'Fragmentação da rocha' },
  { num: '03', text: 'Beneficiamento', desc: 'Separação magnética' },
  { num: '04', text: 'Transporte', desc: 'Ferrovia até o porto' },
  { num: '05', text: 'Alto-forno', desc: 'Minério + carvão → aço' },
];

export default function MinaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

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
            05
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

        <div className="mina-gallery">
          <motion.div
            className="mina-gallery-item mina-gallery-main"
            custom={0}
            variants={imageReveal}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <img src="/images/mina-real.jpg" alt="Mina de ferro real" loading="lazy" />
            <div className="mina-gallery-overlay">
              <span className="mina-gallery-label">Mina Real</span>
            </div>
          </motion.div>
          <motion.div
            className="mina-gallery-item"
            custom={1}
            variants={imageReveal}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <img src="/images/mina-maquete.jpg" alt="Mina na maquete" loading="lazy" />
            <div className="mina-gallery-overlay">
              <span className="mina-gallery-label">Na Maquete</span>
            </div>
          </motion.div>
        </div>

        <div className="mina-layout">
          <motion.div
            className="mina-stats-card"
            initial={{ x: -60, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT_EXPO }}
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
            transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT_EXPO }}
          >
            O Brasil é um dos maiores exportadores mundiais de minério de ferro. Na maquete, simulamos todo o processo de extração, desde a mina até o transporte ferroviário.
          </motion.p>

          <div className="mina-process">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                className="process-step-enhanced"
                custom={i}
                variants={stepVariants}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
              >
                <div className="step-content">
                  <span className="step-num">{step.num}</span>
                  <span className="step-text">{step.text}</span>
                  <span className="step-desc">{step.desc}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mina-comparison"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <h3 className="mina-section-subtitle">Ferro vs. Carvão na maquete</h3>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Aspecto</th>
                    <th>Minério de Ferro</th>
                    <th>Carvão Mineral</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Cor na maquete</td>
                    <td>Tom avermelhado / ferrugem</td>
                    <td>Preto / cinza escuro</td>
                  </tr>
                  <tr>
                    <td>Função</td>
                    <td>Matéria-prima do aço</td>
                    <td>Combustível do alto-forno</td>
                  </tr>
                  <tr>
                    <td>Poço na mina</td>
                    <td>Poço principal (maior)</td>
                    <td>Poço secundário</td>
                  </tr>
                  <tr>
                    <td>Transporte</td>
                    <td>Vagão basculante 1 e 2</td>
                    <td>Vagão basculante 3</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
