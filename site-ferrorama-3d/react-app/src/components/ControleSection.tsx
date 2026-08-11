import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode } from 'react';
import { EASE_OUT_EXPO } from '../lib/motion';

const cardVariants = {
  hidden: { y: 40, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.65,
      delay: i * 0.1,
      ease: EASE_OUT_EXPO,
    },
  }),
};

const layers: { icon: ReactNode; title: string; text: string; role: string; image: string }[] = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    title: 'Dashboard Web',
    text: 'Interface React com monitoramento em tempo real via Socket.IO',
    role: 'Monitoramento',
    image: '/images/controle.svg',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>
      </svg>
    ),
    title: 'App Mobile',
    text: 'React Native com controle Bluetooth dos caminhões',
    role: 'Operação',
    image: '/images/controle.svg',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    title: 'Backend',
    text: 'Node.js com Express, PostgreSQL e Redis para dados em tempo real',
    role: 'Dados',
    image: '/images/circuit-traces.svg',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    title: 'Gateway',
    text: 'Ponte entre Arduino e servidor via Bluetooth/Serial',
    role: 'Ponte',
    image: '/images/arduino.svg',
  },
];

export default function ControleSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="controle" className="section" data-bg="dark" ref={ref}>
      <div className="section-container">
        <div className="section-header">
          <motion.span
            className="section-number"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            06
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Central de Controle
          </motion.h2>
          <motion.p
            className="section-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Camadas que coordenam a maquete — do Arduino ao painel
          </motion.p>
        </div>

        <motion.div
          className="controle-architecture"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: EASE_OUT_EXPO }}
        >
          <div className="architecture-flow">
            <div className="arch-node">
              <img src="/images/arduino.jpg" alt="" aria-hidden="true" />
              <span>Arduino</span>
            </div>
            <div className="arch-connector" aria-hidden="true">
              <svg width="40" height="20" viewBox="0 0 40 20">
                <path d="M0 10 L35 10" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 2"/>
                <path d="M30 5 L40 10 L30 15" fill="var(--accent)"/>
              </svg>
            </div>
            <div className="arch-node">
              <img src="/images/controle.svg" alt="" aria-hidden="true" />
              <span>Gateway</span>
            </div>
            <div className="arch-connector" aria-hidden="true">
              <svg width="40" height="20" viewBox="0 0 40 20">
                <path d="M0 10 L35 10" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 2"/>
                <path d="M30 5 L40 10 L30 15" fill="var(--accent)"/>
              </svg>
            </div>
            <div className="arch-node">
              <img src="/images/montagem-geral.svg" alt="" aria-hidden="true" />
              <span>Backend</span>
            </div>
            <div className="arch-connector" aria-hidden="true">
              <svg width="40" height="20" viewBox="0 0 40 20">
                <path d="M0 10 L35 10" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 2"/>
                <path d="M30 5 L40 10 L30 15" fill="var(--accent)"/>
              </svg>
            </div>
            <div className="arch-node">
              <img src="/images/porto.svg" alt="" aria-hidden="true" />
              <span>Dashboard</span>
            </div>
          </div>
        </motion.div>

        <div className="controle-dashboard">
          {layers.map((d, i) => (
            <motion.div
              key={d.title}
              className="dashboard-card-enhanced controle-layer"
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              <div className="dashboard-card-header">
                <div className="dashboard-icon">{d.icon}</div>
                <span className="controle-layer__role">{d.role}</span>
              </div>
              <h4>{d.title}</h4>
              <p>{d.text}</p>
              <div className="dashboard-card-image">
                <img src={d.image} alt="" aria-hidden="true" loading="lazy" />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="controle-glossary"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          <h3 className="controle-subtitle">Glossário rápido</h3>
          <div className="glossary-grid">
            <div className="glossary-item"><strong>HO</strong><p>Escala 1:87, padrão em modelismo ferroviário.</p></div>
            <div className="glossary-item"><strong>L298N</strong><p>Driver que controla motores DC com Arduino.</p></div>
            <div className="glossary-item"><strong>PWM</strong><p>Modulação de largura de pulso — controla velocidade.</p></div>
            <div className="glossary-item"><strong>Reed switch</strong><p>Sensor magnético de proximidade.</p></div>
            <div className="glossary-item"><strong>PLA</strong><p>Plástico biodegradável usado na impressão 3D.</p></div>
            <div className="glossary-item"><strong>DCC</strong><p>Digital Command Control — controle digital de trens.</p></div>
          </div>
        </motion.div>

        <motion.div
          className="controle-modes"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.45 }}
        >
          <h3 className="controle-subtitle">Modos de operação</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Modo</th>
                  <th>Descrição</th>
                  <th>Quando usar</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Manual</td>
                  <td>Cada botão liga/desliga um subsistema</td>
                  <td>Demonstrações, testes, manutenção</td>
                </tr>
                <tr>
                  <td>Automático</td>
                  <td>Sequência completa mina → exportação</td>
                  <td>Apresentações e feiras de ciências</td>
                </tr>
                <tr>
                  <td>Emergência</td>
                  <td>Botão vermelho para todos os motores</td>
                  <td>Imprevistos ou superaquecimento</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
