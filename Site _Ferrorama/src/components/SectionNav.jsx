export default function SectionNav({ prev, next, onNavigate }) {
  return (
    <nav className="section-nav" aria-label="Navegação entre seções">
      {prev && (
        <a
          href={`#${prev.id}`}
          className="section-nav-btn"
          onClick={(e) => { e.preventDefault(); onNavigate(prev.id); }}
        >
          ← {prev.label}
        </a>
      )}
      {next && (
        <a
          href={`#${next.id}`}
          className="section-nav-btn section-nav-next"
          onClick={(e) => { e.preventDefault(); onNavigate(next.id); }}
        >
          {next.label} →
        </a>
      )}
    </nav>
  );
}
