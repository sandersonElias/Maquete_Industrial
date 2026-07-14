import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const featureVariants = {
  hidden: { y: 40, opacity: 0, scale: 0.95 },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: 0.4 + i * 0.1,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export default function CodigoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const features = [
    { icon: '📡', title: 'Bluetooth HC-05', text: 'Comunicação sem fio entre o app e os dispositivos' },
    { icon: '⚙️', title: '4 Servos', text: 'Direção, caçamba, motor e guincho' },
    { icon: '🔌', title: 'Sensores', text: 'Sensores de proximidade e fim de curso' },
    { icon: '💡', title: 'LEDs', text: 'Faróis, setas e pisca-alerta' },
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
            02
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
            className="code-block"
            initial={{ x: -100, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
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
          <div className="code-features">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="feature-item"
                custom={i}
                variants={featureVariants}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                whileHover={{ y: -6, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <div className="feature-icon">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
