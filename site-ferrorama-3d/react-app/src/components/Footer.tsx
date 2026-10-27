import { useRef } from 'react';
import { scrollToSection } from '../lib/scroll';

const FOOTER_LINKS = [
  { id: 'inicio', label: 'Início' },
  { id: 'maquete', label: 'Maquete' },
  { id: 'preparacao', label: 'Preparação' },
  { id: 'montagem', label: 'Montagem' },
  { id: 'codigo', label: 'Automação' },
  { id: 'mina', label: 'Mina' },
  { id: 'porto', label: 'Porto' },
  { id: 'controle', label: 'Controle' },
];

const INSTAGRAM_URL = 'https://www.instagram.com/projeto3sis2';

export default function Footer() {
  const ref = useRef<HTMLElement>(null);

  return (
    <footer className="site-footer" ref={ref}>
      <div className="site-footer__inner">
        <p className="site-footer__brand">Maquete Industrial</p>
        <p className="site-footer__tag">Terceirão · Feira de ciências · 2026</p>

        <a
          className="site-footer__instagram"
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram do projeto Maquete Industrial (@projeto3sis2)"
        >
          <svg
            className="site-footer__instagram-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          <span>@projeto3sis2</span>
        </a>

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
          <li>
            <span className="site-footer__credit-name">Davi</span>
            <span className="site-footer__credit-role">Performance web</span>
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
          © 2026 Maquete Industrial
          <span className="site-footer__sep" aria-hidden="true">·</span>
          Three.js, Arduino, React
        </p>
      </div>
    </footer>
  );
}
