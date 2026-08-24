import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { EASE_OUT_EXPO } from '../lib/motion';

const signals = [
  {
    tag: 'SW',
    title: '4 desvios',
    text: 'SW1/2 atalho, SW3 porto, SW4 mina — CMD|SWITCH|id|SET|LEFT/RIGHT/CENTER.',
  },
  {
    tag: 'TX',
    title: 'Bluetooth HC-05',
    text: 'App e Arduino no mesmo canal serial — comandos curtos, resposta rápida.',
  },
  {
    tag: 'PWM',
    title: 'Servos SG90',
    text: 'Ângulo fino para desvios, direção e caçamba do basculante.',
  },
  {
    tag: 'LED',
    title: 'Indicadores',
    text: 'Faróis, setas e status no cais — leitura imediata na feira.',
  },
];

export default function CodigoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="codigo" className="section section--lab" data-bg="dark" ref={ref}>
      <div className="section-container">
        <div className="section-header section-header--lab">
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
            Bancada do firmware — o sketch que faz o metal se mexer
          </motion.p>
        </div>

        {/* Mesa de lab: foto Arduino + terminal dominante */}
        <motion.div
          className="lab-bench"
          initial={{ opacity: 0, y: 36 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
        >
          <div className="lab-bench__photo">
            <img
              src="/images/arduino-bancada.jpg"
              alt="Arduino e módulo Bluetooth na bancada de automação"
              loading="lazy"
              decoding="async"
            />
            <div className="lab-bench__photo-meta">
              <span className="lab-bench__chip">MEGA 2560</span>
              <span className="lab-bench__chip lab-bench__chip--live">SERIAL · BT</span>
            </div>
          </div>

          <div className="lab-bench__terminal code-block">
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
            <p className="lab-bench__hint">
              Uma letra no ar → um ângulo no servo. Protocolo mínimo, efeito máximo na escala HO.
            </p>
          </div>
        </motion.div>

        {/* Barramento de sinais — não é card de Porto */}
        <motion.div
          className="lab-bus"
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, delay: 0.2, ease: EASE_OUT_EXPO }}
        >
          <div className="lab-bus__rail" aria-hidden="true" />
          <ul className="lab-bus__list">
            {signals.map((s, i) => (
              <motion.li
                key={s.tag}
                className="lab-bus__node"
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: EASE_OUT_EXPO }}
              >
                <span className="lab-bus__tag">{s.tag}</span>
                <h3 className="lab-bus__title">{s.title}</h3>
                <p className="lab-bus__text">{s.text}</p>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.figure
          className="lab-schematic"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.35, ease: EASE_OUT_EXPO }}
        >
          <img
            src="/images/circuit-traces.svg"
            alt="Esquema de circuito e trilhos da maquete"
            loading="lazy"
            decoding="async"
          />
          <figcaption>Esquema — trilhos e traços como uma placa viva</figcaption>
        </motion.figure>
      </div>
    </section>
  );
}
