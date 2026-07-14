import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import MaquetteScene from '../scenes/MaquetteScene';

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
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  useEffect(() => {
    const section = document.getElementById('mina');
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !sceneRef.current && containerRef.current) {
            try {
              sceneRef.current = new MaquetteScene(containerRef.current);
              if (sceneRef.current.camera) {
                sceneRef.current.camera.position.set(-8, 5, 2);
                sceneRef.current.controls.target.set(-5, 1, -2);
              }
            } catch (e) {
              console.error('Error initializing mina scene:', e);
            }
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      if (sceneRef.current) {
        sceneRef.current.destroy();
        sceneRef.current = null;
      }
    };
  }, []);

  return (
    <section id="mina" className="section" data-bg="gradient" ref={sectionRef}>
      <div className="section-container">
        <div className="section-header">
          <span className="section-number">04</span>
          <h2 className="section-title">Mina de Ferro</h2>
          <p className="section-subtitle">O que é uma mina e como reproduzimos na maquete</p>
        </div>
        <div className="mina-showcase">
          <motion.div
            ref={containerRef}
            className="mina-3d"
            initial={{ x: -80, opacity: 0, scale: 0.95 }}
            animate={isInView ? { x: 0, opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
          <div className="mina-content">
            <motion.div
              className="mina-stat"
              initial={{ x: 60, opacity: 0 }}
              animate={isInView ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="mina-stat-value">+</span>
              <span className="mina-stat-text">400 milhões</span>
              <span className="mina-stat-label">de toneladas exportadas/ano</span>
            </motion.div>
            <motion.p
              className="mina-description"
              initial={{ x: 60, opacity: 0 }}
              animate={isInView ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              O Brasil é um dos maiores exportadores mundiais de minério de ferro. Na maquete, simulamos todo o processo de extração, desde a mina até o transporte ferroviário.
            </motion.p>
            <div className="mina-process">
              {[
                { num: '01', text: 'Extração' },
                { num: '02', text: 'Britagem' },
                { num: '03', text: 'Transporte' },
                { num: '04', text: 'Exportação' },
              ].map((step, i) => (
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
                  <span className="step-text">{step.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
