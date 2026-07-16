import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const cardVariants = {
  hidden: { y: 80, opacity: 0, rotateX: 15 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      duration: 0.8,
      delay: i * 0.12,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export default function MontagemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const cards = [
    {
      icon: 'images/trem.svg',
      alt: 'Trem',
      title: 'Trem',
      text: 'Locomotiva com 4 servos controlados por Arduino para movimentação nos trilhos.',
      color: '#0d47a1',
    },
    {
      icon: 'images/caminhoes-3d.svg',
      alt: 'Caminhões',
      title: 'Caminhões 3D',
      text: '3 caminhões basculantes impressos em PLA com motor DC e controle Bluetooth.',
      color: '#e65100',
    },
    {
      icon: 'images/arduino.svg',
      alt: 'Arduino',
      title: 'Arduino Mega',
      text: 'Central de controle que coordena todos os componentes eletrônicos.',
      color: '#0066cc',
    },
    {
      icon: 'images/controle.svg',
      alt: 'Controle',
      title: 'Controle Bluetooth',
      text: 'HC-05 para comunicação sem fio entre app e caminhões.',
      color: '#1b5e20',
    },
  ];

  return (
    <section id="montagem" className="section" data-bg="dark" ref={ref}>
      <div className="section-container">
        <div className="section-header">
          <motion.span
            className="section-number"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            01
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Montagem
          </motion.h2>
          <motion.p
            className="section-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Componentes e construção da maquete ferroviária
          </motion.p>
        </div>
        <div className="cards-grid">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              className="card card-3d"
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              whileHover={{ y: -12, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ perspective: 1000 }}
            >
              <div className="card-icon" style={{ background: `${card.color}15` }}>
                <img src={card.icon} alt={card.alt} loading="lazy" />
              </div>
              <h3 className="card-title">{card.title}</h3>
              <p className="card-text">{card.text}</p>
              <div className="card-glow"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
