import { useRef } from 'react';

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const navH =
    parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 64;
  const top = el.getBoundingClientRect().top + window.scrollY - navH - 8;
  window.scrollTo({ top, behavior: 'smooth' });
}

const FOOTER_LINKS = [
  { id: 'inicio', label: 'Início' },
  { id: 'maquete', label: 'Maquete' },
  { id: 'montagem', label: 'Montagem' },
  { id: 'codigo', label: 'Automação' },
  { id: 'porto', label: 'Porto' },
  { id: 'mina', label: 'Mina' },
  { id: 'controle', label: 'Controle' },
];

export default function Footer() {
  const ref = useRef<HTMLElement>(null);

  return (
    <footer className="site-footer" ref={ref}>
      <div className="site-footer__inner">
        <p className="site-footer__brand">Ferrorama</p>
        <p className="site-footer__tag">Projeto escolar · Feira de ciências</p>

        <nav className="site-footer__nav" aria-label="Rodapé">
          {FOOTER_LINKS.map(({ id, label }, i) => (
            <span key={id} className="site-footer__item">
              {i > 0 && <span className="site-footer__sep" aria-hidden="true">·</span>}
              <a
                href={`#${id}`}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  scrollToId(id);
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
