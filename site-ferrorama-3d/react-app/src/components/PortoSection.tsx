import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const itemVariants = {
  hidden: { x: 60, opacity: 0 },
  visible: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.7,
      delay: 0.3 + i * 0.15,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export default function PortoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const items = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3"/>
          <path d="M2 13h20"/>
        </svg>
      ),
      title: 'Terminal Portuário',
      text: 'Exportação de minério de ferro e carvão para mercados internacionais. Guindaste operacional no cais.',
      image: '/images/porto.jpg',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
      ),
      title: 'Aeroporto',
      text: 'Transporte aéreo de carga de alta prioridade com pista de pouso e hangar.',
      image: '/images/aeroporto.jpg',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
          <line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
      ),
      title: 'Ferrovia',
      text: 'Conexão entre a mina e o porto com trens de carga. Trilhos em escala HO com desvios.',
      image: '/images/trem.jpg',
    },
  ];

  return (
    <section id="porto" className="section" data-bg="dark" ref={ref}>
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
            Porto & Aeroporto
          </motion.h2>
          <motion.p
            className="section-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Transporte e exportação dos materiais
          </motion.p>
        </div>

        <div className="porto-showcase">
          {/* Main porto image */}
          <motion.div
            className="porto-image-main"
            initial={{ x: -80, opacity: 0, scale: 0.95 }}
            animate={isInView ? { x: 0, opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="porto-image-card">
              <img src="/images/porto.jpg" alt="Porto da maquete" loading="lazy" />
              <div className="porto-image-overlay"></div>
              <div className="porto-image-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                </svg>
                <span>Exportação</span>
              </div>
              <div className="porto-image-stats">
                <div className="porto-mini-stat">
                  <span className="porto-mini-value">3</span>
                  <span className="porto-mini-label">Trilhos</span>
                </div>
                <div className="porto-mini-stat">
                  <span className="porto-mini-value">2</span>
                  <span className="porto-mini-label">Pontos</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Porto content cards */}
          <div className="porto-content">
            {items.map((item, i) => (
              <motion.div
                key={i}
                className="porto-item-enhanced"
                custom={i}
                variants={itemVariants}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                whileHover={{ x: 12, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <div className="porto-item-image">
                  <img src={item.image} alt={item.title} loading="lazy" />
                </div>
                <div className="porto-item-icon">{item.icon}</div>
                <div className="porto-item-text">
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </div>
                <svg className="porto-item-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Comparison table */}
        <motion.div
          className="porto-comparison"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <h3 className="porto-comparison-title">Porto vs. Aeroporto — Quando usar cada um?</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Critério</th>
                  <th>Porto</th>
                  <th>Aeroporto</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Volume transportado</td>
                  <td>Alto (milhões de toneladas)</td>
                  <td>Baixo (cargas especiais)</td>
                </tr>
                <tr>
                  <td>Custo</td>
                  <td>Menor por tonelada</td>
                  <td>Muito maior</td>
                </tr>
                <tr>
                  <td>Velocidade</td>
                  <td>Semanas (marítimo)</td>
                  <td>Horas (aéreo)</td>
                </tr>
                <tr>
                  <td>Na maquete</td>
                  <td>Rota padrão do trem</td>
                  <td>Rota alternativa via desvio</td>
                </tr>
                <tr>
                  <td>Material típico</td>
                  <td>Minério de ferro, carvão</td>
                  <td>Amostras, peças urgentes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Export info */}
        <motion.div
          className="porto-export-info"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h3 className="porto-comparison-title">Exportação no Brasil</h3>
          <div className="porto-export-grid">
            <div className="porto-export-item">
              <strong>2º maior exportador</strong>
              <p>O Brasil é um dos maiores exportadores mundiais de minério de ferro, principalmente para China, Japão e Europa.</p>
            </div>
            <div className="porto-export-item">
              <strong>Porto de Tubarão</strong>
              <p>Um dos maiores terminais de minério do mundo, em Vitória (ES) — referência para nossa maquete portuária.</p>
            </div>
            <div className="porto-export-item">
              <strong>Ferrovia Vitória–Minas</strong>
              <p>EFVM liga as minas de Minas Gerais ao litoral — inspirou o circuito ferroviário da maquete.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
