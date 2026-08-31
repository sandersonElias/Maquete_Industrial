import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { EASE_OUT_EXPO } from '../lib/motion';
import { scrollToSection } from '../lib/scroll';

/**
 * Registro fotográfico de como a maquete foi construída, em três etapas.
 *
 * As fotos alternam de lado a cada etapa (esquerda, direita, esquerda) para o
 * olho não cansar numa lista longa. A inversão da etapa 02 é feita com
 * `order` no CSS, e não trocando a ordem no JSX — assim a leitura por leitor
 * de tela continua sendo foto → texto em todas as etapas.
 */

interface Etapa {
  numero: string;
  titulo: string;
  imagem: string;
  alt: string;
  selos: [string, string];
  chamada: string;
  texto: string;
  itens: string[];
}

const ETAPAS: Etapa[] = [
  {
    numero: '01',
    titulo: 'Traçado no papel kraft',
    imagem: '/images/maquete-montagem-1.png',
    alt: 'Circuito HO fechado sobre mesas forradas com papel kraft, com a equipe ao fundo',
    selos: ['Foto 01 · Traçado', 'Base plana'],
    chamada: 'Mesas unidas e forradas com papel kraft viram o terreno provisório da maquete.',
    texto:
      'O circuito HO é fechado inteiro em cima da base antes de qualquer cenário: é assim que a equipe confere raio de curva, posição dos desvios e o espaço que sobra para mina, pátio e porto.',
    itens: [
      'Trilhos apoiados soltos, sem cola nem paisagismo',
      'Postes e guindastes impressos em 3D já posicionados',
      'Blocos de madeira marcam onde entram mina e cais',
    ],
  },
  {
    numero: '02',
    titulo: 'Rampa e segundo nível',
    imagem: '/images/maquete-montagem-2.png',
    alt: 'Trecho de curva elevado por calços de papelão, com a base estendida para a mesa ao lado',
    selos: ['Foto 02 · Elevação', 'Rampa'],
    chamada: 'Com o traçado aprovado, a linha ganha altura e a base cresce para a mesa vizinha.',
    texto:
      'Calços de papelão erguem o trecho da curva e criam a rampa que separa o ramal da mina do resto do circuito, o mesmo desnível que aparece hoje na maquete 3D.',
    itens: [
      'Calços de papelão sob os trilhos, em degraus',
      'Curva elevada formando rampa contínua',
      'Papel kraft estendido para ampliar a base',
    ],
  },
  {
    numero: '03',
    titulo: 'Frota, sinalização e ensaio geral',
    imagem: '/images/maquete-montagem-3.png',
    alt: 'Circuito completo com locomotiva, vagões, caminhões impressos em 3D e postes de sinalização',
    selos: ['Foto 03 · Ensaio geral', 'Frota'],
    chamada: 'Última etapa antes do acabamento: a maquete roda inteira, com equipe em volta.',
    texto:
      'Locomotiva, vagões e os caminhões basculantes impressos em 3D entram nos seus lugares, os postes de sinalização são fixados e o circuito é testado ponta a ponta: mina, trilhos e porto na mesma volta.',
    itens: [
      'Locomotiva e vagões posicionados nos trilhos',
      'Caminhões basculantes na área da mina',
      'Volta completa testada com a equipe em sala',
    ],
  },
];

export default function PreparacaoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="preparacao" className="section" data-bg="dark" ref={ref}>
      <div className="section-container">
        <div className="section-header">
          <motion.span
            className="section-number"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            02
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Preparação do projeto
          </motion.h2>
          <motion.p
            className="section-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Três registros de sala de aula, da mesa forrada de papel kraft até o circuito rodando
            do jeito que é hoje
          </motion.p>
        </div>

        <ol className="prep-etapas">
          {ETAPAS.map((etapa, i) => (
            <motion.li
              key={etapa.numero}
              className="prep-etapa"
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.15 + i * 0.12, ease: EASE_OUT_EXPO }}
            >
              <figure className="prep-etapa__foto">
                <img src={etapa.imagem} alt={etapa.alt} loading="lazy" decoding="async" />
                <figcaption className="prep-etapa__selos">
                  <span className="prep-selo">{etapa.selos[0]}</span>
                  <span className="prep-selo prep-selo--teal">{etapa.selos[1]}</span>
                </figcaption>
              </figure>

              <div className="prep-etapa__texto">
                <span className="prep-etapa__num">ETAPA {etapa.numero}</span>
                <h3 className="prep-etapa__titulo">{etapa.titulo}</h3>
                <p className="prep-etapa__chamada">{etapa.chamada}</p>
                <p className="prep-etapa__corpo">{etapa.texto}</p>
                <ul className="prep-etapa__itens">
                  {etapa.itens.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </motion.li>
          ))}
        </ol>

        <motion.p
          className="prep-fecho"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          Depois desta etapa entram o paisagismo, a fiação definitiva e a central de controle.{' '}
          <a
            href="#montagem"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('montagem');
            }}
          >
            ver os componentes da montagem
          </a>
        </motion.p>
      </div>
    </section>
  );
}
