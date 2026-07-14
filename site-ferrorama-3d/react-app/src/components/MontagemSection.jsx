import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const cardVariants = {
  hidden: { y: 80, opacity: 0, rotateX: 15 },
  visible: (i) => ({
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
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const cards = [
    {
      icon: 'images/trem.svg',
      alt: 'Trem',
      title: 'Trem',
      text: 'Locomotiva com 4 servos controlados por Arduino para movimentação nos trilhos.',
    },
    {
      icon: 'images/caminhoes-3d.svg',
      alt: 'Caminhões',
      title: 'Caminhões 3D',
      text: '3 caminhões basculantes impressos em PLA com motor DC e controle Bluetooth.',
    },
    {
      icon: 'images/arduino.svg',
      alt: 'Arduino',
      title: 'Arduino Mega',
      text: 'Central de controle que coordena todos os componentes eletrônicos.',
    },
    {
      icon: 'images/controle.svg',
      alt: 'Controle',
      title: 'Controle Bluetooth',
      text: 'HC-05 para comunicação sem fio entre app e caminhões.',
    },
  ];

  return (
    <section id="montagem" className="section" data-bg="dark" ref={ref}>
      <div className="section-container">
        <div className="section-header">
          <span className="section-number">00</span>
          <h2 className="section-title">Montagem</h2>
          <p className="section-subtitle">Componentes e construção da maquete ferroviária</p>
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
              <div className="card-icon">
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
