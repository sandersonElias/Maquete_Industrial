import { useRef } from 'react';
import { scrollToSection } from '../lib/scroll';

const FOOTER_LINKS = [
  { id: 'inicio', label: 'Início' },
  { id: 'maquete', label: 'Maquete' },
  { id: 'montagem', label: 'Montagem' },
  { id: 'codigo', label: 'Automação' },
  { id: 'mina', label: 'Mina' },
  { id: 'porto', label: 'Porto' },
  { id: 'controle', label: 'Controle' },
];

export default function Footer() {
  const ref = useRef<HTMLElement>(null);

  return (
    <footer className="site-footer" ref={ref}>
      <div className="site-footer__inner">
        <p className="site-footer__brand">Ferrorama</p>
        <p className="site-footer__tag">Terceirão · Feira de ciências · 2026</p>

        <ul className="site-footer__credits">
          <li>
            <span className="site-footer__credit-name">Caio</span>
            <span className="site-footer__credit-role">Maquete 3D</span>
          </li>
          <li>
            <span className="site-footer__credit-name">Marco</span>
            <span className="site-footer__credit-role">Site</span>
          </li>
          <li>
            <span className="site-footer__credit-name">Sanderson</span>
            <span className="site-footer__credit-role">App e sistemas</span>
          </li>
        </ul>

        <nav className="site-footer__nav" aria-label="Rodapé">
          {FOOTER_LINKS.map(({ id, label }, i) => (
            <span key={id} className="site-footer__item">
              {i > 0 && <span className="site-footer__sep" aria-hidden="true">·</span>}
              <a
                href={`#${id}`}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  scrollToSection(id);
                }}
              >
                {label}
              </a>
            </span>
          ))}
        </nav>

        <p className="site-footer__copy">
          © 2026 Ferrorama
          <span className="site-footer__sep" aria-hidden="true">·</span>
          Three.js, Arduino, React
        </p>
      </div>
    </footer>
  );
}
