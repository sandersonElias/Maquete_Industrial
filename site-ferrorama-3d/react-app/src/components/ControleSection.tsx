import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode } from 'react';

const cardVariants = {
  hidden: { y: 60, opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
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
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const dashboards: { icon: ReactNode; title: string; text: string; status: string; statusClass: string }[] = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <motion.span
            className="section-number"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            05
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
            Central que coordena todo o sistema
          </motion.p>
        </div>
        <div className="controle-image-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
          <img
            src="/images/controle.svg"
            alt="Sistema de controle central"
            loading="lazy"
            style={{ maxWidth: '320px', width: '100%', height: 'auto' }}
          />
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
