import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { EASE_OUT_EXPO } from '../lib/motion';

const modules = [
  {
    id: 'real',
    num: '01',
    title: 'Mina real',
    lead: 'Onde começa a cadeia — a extração do minério de ferro no Brasil.',
    image: '/images/mina-real.jpg',
    alt: 'Mina de ferro real',
    body: [
      'O Brasil está entre os maiores exportadores mundiais de minério de ferro. A extração envolve perfuração, detonação, escavação e beneficiamento antes do embarque ferroviário.',
      'Na narrativa da maquete, essa etapa é o “ponto de origem”: sem a mina, não há carga para trilhos, porto ou aeroporto.',
    ],
    points: [
      'Extração a céu aberto',
      'Britagem e beneficiamento',
      'Separação magnética do ferro',
      'Referência às minas de Minas Gerais',
    ],
  },
  {
    id: 'maquete',
    num: '02',
    title: 'Na maquete',
    lead: 'Como reproduzimos a mina em escala — poços, cores e carga.',
    image: '/images/mina-maquete.jpg',
    alt: 'Mina reproduzida na maquete',
    body: [
      'Na maquete, a mina aparece como poços e áreas de carga. Minério de ferro ganha tom avermelhado / ferrugem; o carvão fica preto ou cinza escuro, para leitura imediata do material.',
      'Caminhões basculantes e o trem fazem a ponte: enchem na mina e levam a carga até o porto ou o desvio do aeroporto.',
    ],
    points: [
      'Poço principal (ferro) e secundário (carvão)',
      'Cores distintas por material',
      'Carga pelos caminhões 3D e vagões',
      'Integração com o circuito HO',
    ],
  },
  {
    id: 'processo',
    num: '03',
    title: 'Da extração ao trem',
    lead: 'O fluxo que a maquete simula — da rocha ao vagão.',
    image: '/images/trem.jpg',
    alt: 'Trem e transporte a partir da mina',
    body: [
      'O processo na maquete resume a cadeia industrial: extração → britagem → beneficiamento → transporte ferroviário → alto-forno (na narrativa).',
      'O minério e o carvão seguem juntos na história do aço: um é matéria-prima, o outro alimenta o forno — ambos saem da mina pelos mesmos trilhos.',
    ],
    points: [
      'Extração e britagem',
      'Beneficiamento / separação',
      'Trem até o porto (rota padrão)',
      'Carvão e ferro em vagões distintos',
    ],
  },
];

export default function MinaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="mina" className="section" data-bg="dark" ref={ref}>
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
            Três olhares sobre a origem da carga: mina real, maquete e o caminho até o trem
          </motion.p>
        </div>

        <div className="porto-modules">
          {modules.map((mod, i) => (
            <motion.article
              key={mod.id}
              id={`mina-${mod.id}`}
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

        <motion.div
          className="shell-block"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.45 }}
        >
          <h3 className="shell-block__title">Ferro vs. carvão</h3>
          <p className="shell-block__lead">Como cada material aparece e se move na maquete.</p>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Aspecto</th>
                  <th>Minério de Ferro</th>
                  <th>Carvão Mineral</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Cor na maquete</td>
                  <td>Tom avermelhado / ferrugem</td>
                  <td>Preto / cinza escuro</td>
                </tr>
                <tr>
                  <td>Função</td>
                  <td>Matéria-prima do aço</td>
                  <td>Combustível do alto-forno</td>
                </tr>
                <tr>
                  <td>Poço na mina</td>
                  <td>Poço principal (maior)</td>
                  <td>Poço secundário</td>
                </tr>
                <tr>
                  <td>Transporte</td>
                  <td>Vagão basculante 1 e 2</td>
                  <td>Vagão basculante 3</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          className="shell-block"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.55 }}
        >
          <h3 className="shell-block__title">Contexto no Brasil</h3>
          <ul className="shell-facts">
            <li className="shell-fact">
              <span className="shell-fact__label">Exportação</span>
              <p className="shell-fact__text">
                Mais de 400 milhões de toneladas de minério de ferro saem do país por ano — um dos
                maiores volumes do mundo.
              </p>
            </li>
            <li className="shell-fact">
              <span className="shell-fact__label">Origem</span>
              <p className="shell-fact__text">
                Minas Gerais concentra grande parte da produção; a ferrovia leva a carga ao litoral.
              </p>
            </li>
            <li className="shell-fact">
              <span className="shell-fact__label">Na maquete</span>
              <p className="shell-fact__text">
                A mina é o início da história: dali o material segue para porto ou aeroporto pelos
                trilhos HO.
              </p>
            </li>
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
