import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { EASE_OUT_EXPO } from '../lib/motion';

const strata = [
  {
    depth: '0 m',
    title: 'Mina real',
    text: 'Extração a céu aberto, britagem e beneficiamento — o Brasil entre os maiores exportadores de ferro do mundo.',
    accent: 'terra',
  },
  {
    depth: '−1',
    title: 'Na maquete',
    text: 'Poços de ferro e carvão. Volvo escava; CAT 793B leva até a área de carga do trem.',
    accent: 'ferrugem',
  },
  {
    depth: '−2',
    title: 'Até o trem',
    text: 'Extração → caminhão → trilhos HO → porto (único destino de exportação).',
    accent: 'trilhos',
  },
];

const materials = [
  {
    id: 'ferro',
    name: 'Minério de ferro',
    color: '#c45c2a',
    rows: [
      ['Cor', 'Avermelhado / ferrugem'],
      ['Função', 'Matéria-prima do aço'],
      ['Poço', 'Principal (maior)'],
      ['Vagões', 'Basculante 1 e 2'],
    ],
  },
  {
    id: 'carvao',
    name: 'Carvão mineral',
    color: '#3a3a42',
    rows: [
      ['Cor', 'Preto / cinza escuro'],
      ['Função', 'Combustível do alto-forno'],
      ['Poço', 'Secundário'],
      ['Vagões', 'Basculante 3'],
    ],
  },
];

export default function MinaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="mina" className="section section--pit" data-bg="dark" ref={ref}>
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
            Mina de Ferro
          </motion.h2>
          <motion.p
            className="section-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Dois poços na placa — ferro e carvão — até o CAT e o trem
          </motion.p>
        </div>

        {/* Split: real × maquete */}
        <motion.div
          className="pit-split"
          initial={{ opacity: 0, y: 36 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        >
          <figure className="pit-split__pane">
            <img
              src="/images/mina-real.jpg"
              alt="Mina de ferro real"
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              <span className="pit-split__tag">REAL</span>
              Origem da cadeia
            </figcaption>
          </figure>
          <div className="pit-split__fault" aria-hidden="true">
            <span>CORTE</span>
          </div>
          <figure className="pit-split__pane">
            <img
              src="/images/mina-veiculos.jpg"
              alt="Escavadeira Mini Dig e caminhão basculante na área da mina da maquete"
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              <span className="pit-split__tag pit-split__tag--maquete">ESCALA</span>
              Poços na maquete
            </figcaption>
          </figure>
        </motion.div>

        {/* Estratificação vertical */}
        <div className="pit-shaft">
          <div className="pit-shaft__cable" aria-hidden="true" />
          <ol className="pit-shaft__layers">
            {strata.map((s, i) => (
              <motion.li
                key={s.title}
                className={`pit-layer pit-layer--${s.accent}`}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.25 + i * 0.12, ease: EASE_OUT_EXPO }}
              >
                <span className="pit-layer__depth">{s.depth}</span>
                <div className="pit-layer__body">
                  <h3 className="pit-layer__title">{s.title}</h3>
                  <p className="pit-layer__text">{s.text}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>

        {/* Dois materiais — não tabela de Porto */}
        <motion.div
          className="pit-ores"
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, delay: 0.45, ease: EASE_OUT_EXPO }}
        >
          <h3 className="pit-ores__heading">Dois materiais, um poço</h3>
          <div className="pit-ores__grid">
            {materials.map((m) => (
              <article key={m.id} className="pit-ore" style={{ ['--ore' as string]: m.color }}>
                <header className="pit-ore__head">
                  <span className="pit-ore__swatch" aria-hidden="true" />
                  <h4 className="pit-ore__name">{m.name}</h4>
                </header>
                <dl className="pit-ore__dl">
                  {m.rows.map(([k, v]) => (
                    <div key={k} className="pit-ore__row">
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
