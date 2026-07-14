import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const itemVariants = {
  hidden: { x: 60, opacity: 0 },
  visible: (i) => ({
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.7,
      delay: 0.3 + i * 0.15,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export default function PortoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const items = [
    { icon: '🚢', title: 'Terminal Portuário', text: 'Exportação de minério de ferro e carvão para mercados internacionais.' },
    { icon: '✈️', title: 'Aeroporto', text: 'Transporte aéreo de carga de alta prioridade.' },
    { icon: '🚂', title: 'Ferrovia', text: 'Conexão entre a mina e o porto com trens de carga.' },
  ];

  return (
    <section id="porto" className="section" data-bg="dark" ref={ref}>
      <div className="section-container">
        <div className="section-header">
          <motion.span
            className="section-number"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            03
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Porto & Aeroporto
          </motion.h2>
          <motion.p
            className="section-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Transporte e exportação dos materiais
          </motion.p>
        </div>
        <div className="porto-showcase">
          <motion.div
            className="porto-image"
            initial={{ x: -80, opacity: 0, scale: 0.95 }}
            animate={isInView ? { x: 0, opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <img src="images/porto.jpg" alt="Porto da maquete" loading="lazy" />
            <div className="image-overlay"></div>
            <div className="porto-image-badge">
              <span>Exportação</span>
            </div>
          </motion.div>
          <div className="porto-content">
            {items.map((item, i) => (
              <motion.div
                key={i}
                className="porto-item"
                custom={i}
                variants={itemVariants}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                whileHover={{ x: 12, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <div className="porto-icon">{item.icon}</div>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
