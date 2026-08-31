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
}> = [
  {
    image: '/images/locomotiva-ho.jpg',
    alt: 'Locomotiva HO azul e laranja impressa em 3D',
    title: 'Locomotiva',
    text: 'Locomotiva em escala HO com 4 servos no Arduino para movimentação nos trilhos. Velocidade regulada por PWM.',
    tag: 'Trilhos',
  },
  {
    image: '/images/caminhoes-mini-dump.jpg',
    alt: 'Caminhões Mini Dump branco e laranja com faróis LED',
    title: 'Caminhões 3D',
    text: 'Basculantes Mini Dump em PLA com motor DC, caçamba móvel e Bluetooth. Levam o minério da mina aos trilhos.',
    tag: 'PLA',
  },
  {
    image: '/images/escavadeira-mini-dig.jpg',
    alt: 'Escavadeira Mini Dig laranja e preta impressa em 3D',
    title: 'Escavadeira',
    text: 'Mini Dig na boca da mina: esteiras, braço articulado e caçamba, o primeiro elo da extração na maquete.',
    tag: 'Mina',
  },
  {
    image: '/images/porto-navio-guindaste.jpg',
    alt: 'Navio cargueiro e guindaste de porto impressos em 3D',
    title: 'Porto',
    text: 'Cais com navio e guindaste: o minério chega de trem e segue para o embarque simulado no terminal.',
    tag: 'Cais',
  },
  {
    image: '/images/arduino-bancada.jpg',
    alt: 'Arduino e módulo Bluetooth ligados na bancada',
    title: 'Arduino',
    text: 'Central de controle que coordena servos, motores e o HC-05. Comunicação via Serial e Bluetooth.',
    tag: 'Eletrônica',
  },
  {
    image: '/images/caminhao-eletronica.jpg',
    alt: 'Interior do Mini Dump com fiação, motor e placa de controle',
    title: 'Bluetooth HC-05',
    text: 'App e caminhão no mesmo canal serial: faróis, direção e caçamba no protocolo curto da feira.',
    tag: 'Wireless',
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
            03
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
              src="/images/montagem-oficina.jpg"
              alt="Montagem do caminhão basculante na oficina, com fiação e Arduino"
              className="montagem-hero-image"
              loading="lazy"
            />
            <p className="montagem-hero-caption">
              Oficina da equipe · impressão 3D, fiação e testes antes da feira
            </p>
          </div>
        </motion.div>

        <div className="cards-grid">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              className="card card-image montagem-part"
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
