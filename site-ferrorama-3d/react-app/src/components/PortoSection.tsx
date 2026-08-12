import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { EASE_OUT_EXPO } from '../lib/motion';

const modules = [
  {
    id: 'terminal',
    num: '01',
    title: 'Terminal Portuário',
    lead: 'Ponto final do minério na maquete — da descarga do trem ao embarque simulado.',
    image: '/images/porto.jpg',
    alt: 'Terminal portuário na maquete',
    body: [
      'No porto, o trem chega com vagões de minério de ferro e carvão. Guindastes e esteiras representam a transferência da carga para o navio.',
      'É a rota principal de exportação: volume alto, custo menor por tonelada — como nos grandes terminais brasileiros.',
    ],
    points: [
      'Cais com descarga do trem',
      'Guindaste / movimento de carga no cais',
      'LEDs indicando navio atracado e fluxo contínuo',
      'Rota padrão do circuito ferroviário',
    ],
  },
  {
    id: 'aeroporto',
    num: '02',
    title: 'Aeroporto',
    lead: 'Rota alternativa para cargas urgentes ou de alto valor.',
    image: '/images/aeroporto.jpg',
    alt: 'Aeroporto de carga na maquete',
    body: [
      'O aeroporto completa o porto como opção rápida. Aviões em miniatura (escala 1:500) simbolizam o envio aéreo de amostras e peças prioritárias.',
      'Na maquete, a carga deixa o trem e segue ao terminal aéreo; a pista ativa é sugerida por LED e temporização no Arduino.',
    ],
    points: [
      'Pista e terminal de carga',
      'Acesso via desvio ferroviário',
      'Indicador de pista / decolagem programada',
      'Uso típico: urgência, não volume em massa',
    ],
  },
  {
    id: 'ferrovia',
    num: '03',
    title: 'Ferrovia',
    lead: 'Espinha dorsal da logística — liga mina, porto e aeroporto.',
    image: '/images/trem.jpg',
    alt: 'Ferrovia e trem da maquete',
    body: [
      'Os trilhos em escala HO formam o circuito que leva o material da mina até os pontos de exportação. Desvios com servomotores escolhem porto ou ramal do aeroporto.',
      'A ferrovia é o elo entre extração e exportação: sem ela, terminal e aeroporto ficam isolados na narrativa da maquete.',
    ],
    points: [
      'Trilhos HO com circuito e desvios',
      'Locomotiva e vagões de carga',
      'Paradas na mina (carga) e no porto (descarga)',
      'Inspirada na ferrovia Vitória–Minas (EFVM)',
    ],
  },
];

export default function PortoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

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
            04
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
            Rotas de saída — mar, ar e o trilho que decide o destino
          </motion.p>
        </div>

        <div className="porto-modules">
          {modules.map((mod, i) => (
            <motion.article
              key={mod.id}
              id={`porto-${mod.id}`}
              className={`porto-module${i % 2 === 1 ? ' porto-module--reverse' : ''}`}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.75, delay: 0.15 + i * 0.12, ease: EASE_OUT_EXPO }}
            >
              <div className="porto-module__media">
                <img src={mod.image} alt={mod.alt} loading="lazy" decoding="async" />
              </div>
              <div className="porto-module__body">
                <span className="porto-module__num">{mod.num}</span>
                <h3 className="porto-module__title">{mod.title}</h3>
                <p className="porto-module__lead">{mod.lead}</p>
                {mod.body.map((p) => (
                  <p key={p.slice(0, 24)} className="porto-module__text">
                    {p}
                  </p>
                ))}
                <ul className="porto-module__points">
                  {mod.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Faixa de decisão: mar × ar */}
        <motion.div
          className="porto-lanes"
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, delay: 0.4, ease: EASE_OUT_EXPO }}
        >
          <h3 className="porto-lanes__heading">Qual rota?</h3>
          <div className="porto-lanes__track">
            <article className="porto-lane porto-lane--sea">
              <span className="porto-lane__badge">VOLUME</span>
              <h4 className="porto-lane__title">Porto</h4>
              <ul className="porto-lane__stats">
                <li>
                  <strong>Custo</strong> menor / tonelada
                </li>
                <li>
                  <strong>Tempo</strong> semanas
                </li>
                <li>
                  <strong>Na maquete</strong> rota padrão
                </li>
              </ul>
            </article>
            <div className="porto-lanes__switch" aria-hidden="true">
              <span>DESVIO</span>
            </div>
            <article className="porto-lane porto-lane--air">
              <span className="porto-lane__badge">URGÊNCIA</span>
              <h4 className="porto-lane__title">Aeroporto</h4>
              <ul className="porto-lane__stats">
                <li>
                  <strong>Custo</strong> muito maior
                </li>
                <li>
                  <strong>Tempo</strong> horas
                </li>
                <li>
                  <strong>Na maquete</strong> via desvio
                </li>
              </ul>
            </article>
          </div>
          <p className="porto-lanes__note">
            Tubarão (Vitória–ES) e a EFVM inspiram o circuito: mina → litoral, com alternativa aérea
            para carga especial.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
