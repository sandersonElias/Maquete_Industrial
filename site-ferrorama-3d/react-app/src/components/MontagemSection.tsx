import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { EASE_OUT_EXPO } from '../lib/motion';

const cardVariants = {
  hidden: { y: 48, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.7,
      delay: i * 0.1,
      ease: EASE_OUT_EXPO,
    },
  }),
};

const cards: Array<{
  image: string;
  alt: string;
  title: string;
  text: string;
  tag: string;
  fit?: 'contain';
}> = [
  {
    image: '/images/trem.jpg',
    alt: 'Trem ferroviário em escala HO',
    title: 'Locomotiva',
    text: 'Locomotiva com 4 servos controlados por Arduino para movimentação nos trilhos. Velocidade regulada por PWM.',
    tag: 'Trilhos',
  },
  {
    image: '/images/caminhao-3d.png',
    alt: 'Caminhão basculante Mini Dump impresso em 3D',
    title: 'Caminhões 3D',
    text: 'Basculantes Mini Dump em PLA (laranja/preto) com motor DC, caçamba móvel e Bluetooth — levam o minério da mina aos trilhos.',
    tag: 'PLA',
  },
  {
    image: '/images/arduino.jpg',
    alt: 'Arduino Mega 2560',
    title: 'Arduino Mega',
    text: 'Central de controle que coordena todos os componentes eletrônicos. Comunicação via Serial e Bluetooth.',
    tag: 'Eletrônica',
  },
  {
    image: '/images/hc-05.png',
    alt: 'Ligação do módulo Bluetooth HC-05 ao Arduino (VCC, GND, TX e RX)',
    title: 'Bluetooth HC-05',
    text: 'Comunicação sem fio entre app mobile e caminhões. Protocolo serial de baixa energia para controle remoto.',
    tag: 'Wireless',
    fit: 'contain',
  },
];

export default function MontagemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

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
            <p className="montagem-hero-caption">
              Base 120&nbsp;cm · escala HO · cinco áreas interligadas
            </p>
          </div>
        </motion.div>

        <div className="cards-grid">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              className={`card card-image montagem-part${card.fit === 'contain' ? ' card-image--diagram' : ''}`}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              <div className="card-image-wrapper">
                <img src={card.image} alt={card.alt} loading="lazy" />
                <div className="card-image-overlay"></div>
                <span className="card-tag">{card.tag}</span>
              </div>
              <div className="card-body">
                <h3 className="card-title">{card.title}</h3>
                <p className="card-text">{card.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
