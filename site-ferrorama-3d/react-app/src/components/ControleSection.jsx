import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const cardVariants = {
  hidden: { y: 60, opacity: 0, scale: 0.95 },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.7,
      delay: i * 0.12,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export default function ControleSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const dashboards = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        </svg>
      ),
      title: 'Dashboard Web',
      text: 'Interface React com monitoramento em tempo real via Socket.IO',
      status: 'Online',
      statusClass: 'online',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>
        </svg>
      ),
      title: 'App Mobile',
      text: 'React Native com controle Bluetooth dos caminhões',
      status: 'Ativo',
      statusClass: 'active',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
      ),
      title: 'Backend',
      text: 'Node.js com Express, PostgreSQL e Redis',
      status: 'Rodando',
      statusClass: 'running',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      ),
      title: 'Gateway',
      text: 'Ponte entre Arduino e servidor via Bluetooth/Serial',
      status: 'Conectado',
      statusClass: 'connected',
    },
  ];

  return (
    <section id="controle" className="section" data-bg="dark" ref={ref}>
      <div className="section-container">
        <div className="section-header">
          <span className="section-number">05</span>
          <h2 className="section-title">Central de Controle</h2>
          <p className="section-subtitle">Central que coordena todo o sistema</p>
        </div>
        <div className="controle-dashboard">
          {dashboards.map((d, i) => (
            <motion.div
              key={i}
              className="dashboard-card"
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              whileHover={{ y: -10, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className="dashboard-icon">{d.icon}</div>
              <h4>{d.title}</h4>
              <p>{d.text}</p>
              <div className={`dashboard-status ${d.statusClass}`}>{d.status}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
