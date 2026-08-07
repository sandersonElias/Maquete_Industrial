import { SECTIONS } from '../constants';

export default function Sidebar({ open, active, onNavigate }) {
  return (
    <aside className={`sidebar${open ? ' open' : ''}`} id="sidebar">
      <div className="sidebar-header" onClick={() => onNavigate('inicio')} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate('inicio'); }}>
        <span className="logo-mark" aria-hidden="true" />
        <div className="sidebar-brand">
          <h1>Ferro<span>rama</span></h1>
          <p className="subtitle">Mineração · Siderurgia · Modelismo</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {SECTIONS.map(({ id, num, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className={`nav-link${active === id ? ' active' : ''}`}
            onClick={(e) => { e.preventDefault(); onNavigate(id); }}
          >
            <span className="nav-num">{num}</span>
            <span className="nav-text">{label}</span>
          </a>
        ))}
      </nav>

      <footer className="sidebar-footer">
        <p>Projeto escolar · Feira de ciências</p>
      </footer>
    </aside>
  );
}
