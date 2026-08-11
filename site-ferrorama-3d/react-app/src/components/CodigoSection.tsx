import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { EASE_OUT_EXPO } from '../lib/motion';

const featureVariants = {
  hidden: { y: 40, opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: 0.4 + i * 0.1,
      ease: EASE_OUT_EXPO,
    },
  }),
};

export default function CodigoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      ),
      title: 'Bluetooth HC-05',
      text: 'Comunicação sem fio entre o app e os dispositivos',
      image: '/images/controle.svg',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
      title: '4 Servos SG90',
      text: 'Direção, caçamba, motor e guincho — cada um com controle preciso de ângulo',
      image: '/images/arduino.svg',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
          <line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
      ),
      title: 'Sensores IR',
      text: 'Sensores TCRT5000 de proximidade e reed switch para detecção de presença',
      image: '/images/montagem-geral.svg',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
      title: 'LEDs Indicadores',
      text: 'Faróis, setas, pisca-alerta e LEDs de status no painel de controle',
      image: '/images/trem.svg',
    },
  ];

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
          {/* Arduino images side */}
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
              <div className="code-image-badge">
                <span className="code-badge-dot"></span>
                Arduino Mega 2560
              </div>
            </div>
            <div className="code-image-card code-image-secondary code-image-circuit">
              <img
                src="/images/circuit-traces.svg"
                alt="Diagrama do circuito e trilhos da maquete"
                loading="lazy"
                decoding="async"
              />
              <div className="code-image-badge">
                <span className="code-badge-dot active"></span>
                Circuito / trilhos
              </div>
            </div>
          </motion.div>

          {/* Code block */}
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

        {/* Features with images */}
        <div className="code-features-enhanced">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="feature-card-enhanced"
              custom={i}
              variants={featureVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <div className="feature-card-image">
                <img src={f.image} alt={f.title} loading="lazy" />
                <div className="feature-card-image-overlay"></div>
              </div>
              <div className="feature-card-content">
                <div className="feature-card-icon">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
