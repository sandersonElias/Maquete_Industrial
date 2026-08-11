import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { EASE_OUT_EXPO } from '../lib/motion';

const cardVariants = {
  hidden: { y: 80, opacity: 0, rotateX: 15 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      duration: 0.8,
      delay: i * 0.12,
      ease: EASE_OUT_EXPO,
    },
  }),
};

export default function MontagemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const cards = [
    {
      image: '/images/trem.jpg',
      alt: 'Trem ferroviário em escala HO',
      title: 'Locomotiva',
      text: 'Locomotiva com 4 servos controlados por Arduino para movimentação nos trilhos. Velocidade regulada por PWM.',
      color: '#0d47a1',
      tag: 'Trilhos',
    },
    {
      image: '/images/maquete-montagem-1.png',
      alt: 'Caminhões basculantes 3D',
      title: 'Caminhões 3D',
      text: '3 caminhões basculantes impressos em PLA com motor DC e controle Bluetooth para transporte de minério.',
      color: '#e65100',
      tag: 'PLA',
    },
    {
      image: '/images/arduino.jpg',
      alt: 'Arduino Mega 2560',
      title: 'Arduino Mega',
      text: 'Central de controle que coordena todos os componentes eletrônicos. Comunicação via Serial e Bluetooth.',
      color: '#0066cc',
      tag: 'Eletrônica',
    },
    {
      image: '/images/controle.svg',
      alt: 'Módulo Bluetooth HC-05',
      title: 'Bluetooth HC-05',
      text: 'Comunicação sem fio entre app mobile e caminhões. Protocolo serial de baixa energia para controle remoto.',
      color: '#1b5e20',
      tag: 'Wireless',
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
            02
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

        {/* Hero image with parallax effect */}
        <motion.div
          className="montagem-hero-wrapper"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: EASE_OUT_EXPO }}
        >
          <div className="montagem-hero-card">
            <img
              src="/images/montagem-geral.svg"
              alt="Montagem geral da maquete ferroviária"
              className="montagem-hero-image"
              loading="lazy"
            />
            <div className="montagem-hero-overlay">
              <div className="montagem-hero-stat">
                <span className="hero-stat-number">5</span>
                <span className="hero-stat-desc">Áreas<br/>Interligadas</span>
              </div>
              <div className="montagem-hero-stat">
                <span className="hero-stat-number">120cm</span>
                <span className="hero-stat-desc">Base<br/>Total</span>
              </div>
              <div className="montagem-hero-stat">
                <span className="hero-stat-number">HO</span>
                <span className="hero-stat-desc">Escala<br/>Padrão</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="cards-grid">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              className="card card-3d card-image"
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              whileHover={{ y: -12, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ perspective: 1000 }}
            >
              <div className="card-image-wrapper">
                <img src={card.image} alt={card.alt} loading="lazy" />
                <div className="card-image-overlay"></div>
                <span className="card-tag" style={{ background: card.color }}>{card.tag}</span>
              </div>
              <div className="card-body">
                <h3 className="card-title">{card.title}</h3>
                <p className="card-text">{card.text}</p>
              </div>
              <div className="card-glow"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
