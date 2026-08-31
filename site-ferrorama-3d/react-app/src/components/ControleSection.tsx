import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { EASE_OUT_EXPO } from '../lib/motion';

const consoles: Array<{
  id: string;
  role: string;
  title: string;
  text: string;
  image: string;
  alt: string;
}> = [
  {
    id: 'dash',
    role: 'MONITOR',
    title: 'Dashboard',
    text: 'Sala de operação na web: Socket.IO empurra mina, trilhos e porto para a tela.',
    image: '/images/scada-dashboard.jpg',
    alt: 'Painel de monitoramento com gráficos e status em tempo real',
  },
  {
    id: 'app',
    role: 'OPS',
    title: 'App mobile',
    text: 'Controle na mão: Bluetooth manda o basculante avançar, virar e descarregar.',
    image: '/images/scada-app.jpg',
    alt: 'Celular com app de monitoramento e controle',
  },
  {
    id: 'gate',
    role: 'RADIO',
    title: 'Gateway',
    text: 'Ponte Serial ↔ rede. O que o Mega fala vira evento; o que o painel manda vira pino.',
    image: '/images/scada-gateway.jpg',
    alt: 'Placa eletrônica, ponte entre o hardware e a rede',
  },
  {
    id: 'data',
    role: 'CORE',
    title: 'Backend',
    text: 'Express, Postgres e Redis: memória e API da usina em escala escolar.',
    image: '/images/scada-backend.jpg',
    alt: 'Racks de servidor: API, banco e tempo real',
  },
];

const modes = [
  {
    id: 'manual',
    title: 'Manual',
    blurb: 'Cada subsistema no botão, ideal para explicar peça a peça.',
  },
  {
    id: 'auto',
    title: 'Automático',
    blurb: 'Sequência mina → trem → exportação sem intervenção.',
  },
  {
    id: 'e-stop',
    title: 'Emergência',
    blurb: 'Para geral. Prioridade máxima se algo esquentar ou travar.',
  },
];

export default function ControleSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="controle" className="section section--scada" data-bg="dark" ref={ref}>
      <div className="section-container">
        <div className="section-header">
          <motion.span
            className="section-number"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            07
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
            Sala SCADA: quatro monitores (Volvo, CAT, MRS, navio) e o stack da operação
          </motion.p>
        </div>

        <motion.p
          className="scada-pov-note"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          Na mesa da maquete: monitores ao vivo da escavadeira, do caminhão, do trem MRS e do
          porta-contêineres. Na feira, o visitante escolhe a visão: o hub é a sala de controle.
        </motion.p>

        {/* Banner de console */}
        <motion.div
          className="scada-banner"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        >
          <img
            src="/images/scada-backend.jpg"
            alt=""
            aria-hidden="true"
            className="scada-banner__bg"
            loading="lazy"
          />
          <div className="scada-banner__wash" aria-hidden="true" />
          <div className="scada-banner__copy">
            <p className="scada-banner__eyebrow">LINHA AO VIVO</p>
            <p className="scada-banner__line">
              Arduino → Gateway → Backend → Dashboard / App
            </p>
            <p className="scada-banner__sub">
              O mesmo pulso que move o trem aparece no painel em milissegundos.
            </p>
          </div>
        </motion.div>

        {/* Grade de monitores — identidade própria */}
        <div className="scada-wall">
          {consoles.map((c, i) => (
            <motion.article
              key={c.id}
              className="scada-monitor"
              initial={{ opacity: 0, y: 28 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.15 + i * 0.08, ease: EASE_OUT_EXPO }}
            >
              <div className="scada-monitor__screen">
                <img src={c.image} alt={c.alt} loading="lazy" decoding="async" />
                <div className="scada-monitor__bezel" aria-hidden="true" />
              </div>
              <div className="scada-monitor__hud">
                <span className="scada-monitor__role">{c.role}</span>
                <h3 className="scada-monitor__title">{c.title}</h3>
                <p className="scada-monitor__text">{c.text}</p>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Três alavancas de modo */}
        <motion.div
          className="scada-modes"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.4, ease: EASE_OUT_EXPO }}
        >
          <h3 className="scada-modes__heading">Modos de operação</h3>
          <div className="scada-modes__row">
            {modes.map((m) => (
              <div key={m.id} className={`scada-mode scada-mode--${m.id}`}>
                <span className="scada-mode__lever" aria-hidden="true" />
                <h4 className="scada-mode__title">{m.title}</h4>
                <p className="scada-mode__blurb">{m.blurb}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
