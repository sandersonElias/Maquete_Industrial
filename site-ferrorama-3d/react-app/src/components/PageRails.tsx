/**
 * Trilhos laterais decorativos — circuito ferroviário nas bordas da página.
 * Só visual; não captura clique.
 */
export default function PageRails() {
  return (
    <div className="page-rails" aria-hidden="true">
      <div className="page-rail page-rail--left">
        <RailSvg />
      </div>
      <div className="page-rail page-rail--right">
        <RailSvg mirror />
      </div>
    </div>
  );
}

function RailSvg({ mirror = false }: { mirror?: boolean }) {
  return (
    <svg
      className={`page-rail__svg${mirror ? ' page-rail__svg--mirror' : ''}`}
      viewBox="0 0 48 640"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={`ties-${mirror ? 'r' : 'l'}`} width="48" height="28" patternUnits="userSpaceOnUse">
          {/* dormente */}
          <rect x="6" y="10" width="36" height="5" rx="1" fill="#3a2e24" opacity="0.85" />
          <rect x="8" y="11" width="32" height="2" rx="0.5" fill="#5c4636" opacity="0.5" />
        </pattern>
        <linearGradient id={`steel-${mirror ? 'r' : 'l'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8844" stopOpacity="0.15" />
          <stop offset="35%" stopColor="#c4b8a8" stopOpacity="0.75" />
          <stop offset="65%" stopColor="#c4b8a8" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#2d8b8b" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {/* lastro / base */}
      <rect x="4" y="0" width="40" height="640" fill={`url(#ties-${mirror ? 'r' : 'l'})`} opacity="0.9" />

      {/* trilhos */}
      <rect x="12" y="0" width="3.5" height="640" fill={`url(#steel-${mirror ? 'r' : 'l'})`} />
      <rect x="32.5" y="0" width="3.5" height="640" fill={`url(#steel-${mirror ? 'r' : 'l'})`} />
      <rect x="12.5" y="0" width="1" height="640" fill="#fff" opacity="0.18" />
      <rect x="33" y="0" width="1" height="640" fill="#fff" opacity="0.18" />

      {/* circuitos / pads cobre ligados aos trilhos */}
      <g fill="none" stroke="#ff8844" strokeWidth="1.2" opacity="0.55">
        <path d="M14 48 H6 V72 H14" />
        <path d="M34 96 H42 V128 H34" />
        <path d="M14 180 H8 V210 H14" />
        <path d="M34 240 H40 V268 H34" />
        <path d="M14 320 H6 V352 H14" />
        <path d="M34 400 H42 V440 H34" />
        <path d="M14 480 H8 V512 H14" />
        <path d="M34 560 H40 V592 H34" />
      </g>
      <g fill="#ff8844" opacity="0.7">
        <circle cx="6" cy="48" r="2.2" />
        <circle cx="6" cy="72" r="2.2" />
        <circle cx="42" cy="96" r="2.2" />
        <circle cx="42" cy="128" r="2.2" />
        <circle cx="8" cy="180" r="2.2" />
        <circle cx="8" cy="210" r="2.2" />
        <circle cx="40" cy="240" r="2.2" />
        <circle cx="40" cy="268" r="2.2" />
        <circle cx="6" cy="320" r="2.2" />
        <circle cx="6" cy="352" r="2.2" />
        <circle cx="42" cy="400" r="2.2" />
        <circle cx="42" cy="440" r="2.2" />
        <circle cx="8" cy="480" r="2.2" />
        <circle cx="8" cy="512" r="2.2" />
        <circle cx="40" cy="560" r="2.2" />
        <circle cx="40" cy="592" r="2.2" />
      </g>

      {/* juntos / isoladores */}
      <g fill="#2d8b8b" opacity="0.55">
        <rect x="10" y="140" width="7.5" height="3" rx="1" />
        <rect x="30.5" y="140" width="7.5" height="3" rx="1" />
        <rect x="10" y="380" width="7.5" height="3" rx="1" />
        <rect x="30.5" y="380" width="7.5" height="3" rx="1" />
      </g>
    </svg>
  );
}
