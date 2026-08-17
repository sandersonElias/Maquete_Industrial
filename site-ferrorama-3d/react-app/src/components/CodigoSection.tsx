import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { EASE_OUT_EXPO } from '../lib/motion';

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.55,
      delay: 0.35 + i * 0.08,
      ease: EASE_OUT_EXPO,
    },
  }),
};

const features = [
  {
    num: '01',
    title: 'Bluetooth HC-05',
    text: 'Comunicação sem fio entre o app e os dispositivos Arduino.',
  },
  {
    num: '02',
    title: '4 Servos SG90',
    text: 'Direção, caçamba, motor e guincho — cada um com ângulo preciso.',
  },
  {
    num: '03',
    title: 'Sensores IR',
    text: 'TCRT5000 e reed switch para proximidade e presença nos trilhos.',
  },
  {
    num: '04',
    title: 'LEDs indicadores',
    text: 'Faróis, setas, pisca-alerta e status no painel de controle.',
  },
];

export default function CodigoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="codigo" className="section" data-bg="dark" ref={ref}>
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
            Código & Automação
          </motion.h2>
          <motion.p
            className="section-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Como os caminhões se movem e como o trem funciona
          </motion.p>
        </div>

        <div className="code-showcase">
          <motion.div
            className="code-image-stack"
            initial={{ x: -80, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 1, ease: EASE_OUT_EXPO }}
          >
            <div className="code-image-card code-image-main">
              <img
                src="/images/arduino.jpg"
                alt="Arduino Mega utilizado na automação"
                loading="lazy"
              />
              <span className="code-image-caption">Arduino Mega 2560</span>
            </div>
            <div className="code-image-card code-image-secondary code-image-circuit">
              <img
                src="/images/circuit-traces.svg"
                alt="Diagrama do circuito e trilhos da maquete"
                loading="lazy"
                decoding="async"
              />
              <span className="code-image-caption">Circuito / trilhos</span>
            </div>
          </motion.div>

          <motion.div
            className="code-block"
            initial={{ x: 100, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.2, ease: EASE_OUT_EXPO }}
          >
            <div className="code-header">
              <div className="code-dots">
                <span className="code-dot red"></span>
                <span className="code-dot yellow"></span>
                <span className="code-dot green"></span>
              </div>
              <span className="code-filename">ferrovia_firmware.ino</span>
            </div>
            <pre className="code-content"><code>
              <span className="code-comment">{'// Controle do trem via Bluetooth'}</span>{'\n'}
              <span className="code-keyword">void</span>{' '}
              <span className="code-function">executarComando</span>(String cmd) {'{\n'}
              {'  '}<span className="code-keyword">if</span> (cmd == <span className="code-string">"F"</span>) {'{\n'}
              {'    '}servoMotor.<span className="code-function">write</span>(<span className="code-number">180</span>);{' '}
              <span className="code-comment">{'// Frente'}</span>{'\n'}
              {'  }\n'}
              {'  '}<span className="code-keyword">if</span> (cmd == <span className="code-string">"B"</span>) {'{\n'}
              {'    '}servoMotor.<span className="code-function">write</span>(<span className="code-number">0</span>);{'   '}
              <span className="code-comment">{'// Ré'}</span>{'\n'}
              {'  }\n'}
              {'  '}<span className="code-keyword">if</span> (cmd == <span className="code-string">"S"</span>) {'{\n'}
              {'    '}servoMotor.<span className="code-function">write</span>(<span className="code-number">90</span>);{'  '}
              <span className="code-comment">{'// Parado'}</span>{'\n'}
              {'  }\n}'}
            </code></pre>
          </motion.div>
        </div>

        <ul className="code-kit">
          {features.map((f, i) => (
            <motion.li
              key={f.num}
              className="code-kit__item"
              custom={i}
              variants={itemVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              <span className="code-kit__num">{f.num}</span>
              <div className="code-kit__body">
                <h4 className="code-kit__title">{f.title}</h4>
                <p className="code-kit__text">{f.text}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
