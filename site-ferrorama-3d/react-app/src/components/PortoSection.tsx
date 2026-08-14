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

const chain = [
  {
    step: '01',
    title: 'Chegada',
    text: 'Trem HO chega com ferro e carvão vindos da mina.',
  },
  {
    step: '02',
    title: 'Desvio',
    text: 'Servo escolhe cais (padrão) ou ramal do aeroporto.',
  },
  {
    step: '03',
    title: 'Transferência',
    text: 'Guindaste / LED no cais, ou pista ativa no terminal aéreo.',
  },
  {
    step: '04',
    title: 'Saída',
    text: 'Navio = volume. Avião = urgência. A história fecha no destino.',
  },
];

const routes = [
  {
    id: 'sea',
    badge: 'MAR',
    name: 'Porto',
    tone: 'sea',
    rows: [
      ['Volume', 'Alto — milhões de toneladas'],
      ['Custo', 'Menor por tonelada'],
      ['Tempo', 'Semanas (marítimo)'],
      ['Carga típica', 'Minério de ferro, carvão'],
      ['Na maquete', 'Rota padrão do trem'],
      ['Referência', 'Terminal de Tubarão (ES)'],
    ],
  },
  {
    id: 'air',
    badge: 'AR',
    name: 'Aeroporto',
    tone: 'air',
    rows: [
      ['Volume', 'Baixo — cargas especiais'],
      ['Custo', 'Muito maior'],
      ['Tempo', 'Horas (aéreo)'],
      ['Carga típica', 'Amostras, peças urgentes'],
      ['Na maquete', 'Via desvio ferroviário'],
      ['Escala', 'Aeronaves ~1:500'],
    ],
  },
];

const hubs = [
  {
    label: 'Tubarão',
    text: 'Terminal em Vitória (ES) — um dos maiores do mundo e referência do cais na maquete.',
  },
  {
    label: 'EFVM',
    text: 'Ferrovia Vitória–Minas: mina no interior → litoral. Inspira o circuito HO.',
  },
  {
    label: 'Exportação',
    text: 'Brasil entre os maiores exportadores de ferro — China, Japão e Europa no destino.',
  },
];

export default function PortoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="porto" className="section section--hub" data-bg="dark" ref={ref}>
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

        {/* Cadeia logística — paralelo aos modos da Central */}
        <motion.div
          className="porto-chain"
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, delay: 0.35, ease: EASE_OUT_EXPO }}
        >
          <h3 className="porto-chain__heading">Fluxo na maquete</h3>
          <ol className="porto-chain__list">
            {chain.map((c, i) => (
              <li key={c.step} className="porto-chain__node">
                <span className="porto-chain__step">{c.step}</span>
                <h4 className="porto-chain__title">{c.title}</h4>
                <p className="porto-chain__text">{c.text}</p>
                {i < chain.length - 1 ? (
                  <span className="porto-chain__arrow" aria-hidden="true" />
                ) : null}
              </li>
            ))}
          </ol>
        </motion.div>

        {/* Fichas mar × ar — paralelo às fichas de minério da Mina */}
        <motion.div
          className="porto-routes"
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, delay: 0.45, ease: EASE_OUT_EXPO }}
        >
          <h3 className="porto-routes__heading">Duas saídas, um desvio</h3>
          <div className="porto-routes__grid">
            {routes.map((r) => (
              <article key={r.id} className={`porto-route porto-route--${r.tone}`}>
                <header className="porto-route__head">
                  <span className="porto-route__badge">{r.badge}</span>
                  <h4 className="porto-route__name">{r.name}</h4>
                </header>
                <dl className="porto-route__dl">
                  {r.rows.map(([k, v]) => (
                    <div key={k} className="porto-route__row">
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </motion.div>

        {/* Hubs reais — fechamento no mesmo peso dos fatos da mina/central */}
        <motion.div
          className="porto-hubs"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.55, ease: EASE_OUT_EXPO }}
        >
          <h3 className="porto-hubs__heading">No Brasil</h3>
          <ul className="porto-hubs__list">
            {hubs.map((h) => (
              <li key={h.label} className="porto-hub">
                <span className="porto-hub__label">{h.label}</span>
                <p className="porto-hub__text">{h.text}</p>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
