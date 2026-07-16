import { useState, useEffect, useRef } from 'react';

const ZONES = [
  { id: 'mina', label: 'Mina', x: 73, y: 8, radius: 8.5, color: '#e87722', desc: 'Extracao de minério de ferro e carvão' },
  { id: 'porto', label: 'Porto', x: 261, y: 8.5, radius: 8.5, color: '#0066b3', desc: 'Exportacao maritima de minério' },
  { id: 'circuito1', label: 'Circuito 1', x: 201.5, y: 9, radius: 6.5, color: '#16a34a', desc: 'Ramal principal de circulacao' },
  { id: 'circuito2', label: 'Circuito 2', x: 280.5, y: 9, radius: 6.5, color: '#16a34a', desc: 'Ramal secundario' },
  { id: 'trem1', label: 'Trem', x: 73.5, y: 33.5, radius: 6.5, color: '#8b5cf6', desc: 'Estacionamento de locomotivas' },
  { id: 'trem2', label: 'Trem', x: 142.5, y: 130, radius: 6.5, color: '#8b5cf6', desc: 'Area de manobra' },
  { id: 'trem3', label: 'Trem', x: 266.5, y: 130, radius: 6.5, color: '#8b5cf6', desc: 'Estacao de carga' },
  { id: 'controle', label: 'Controle', x: 179, y: 130.5, radius: 8.5, color: '#dc2626', desc: 'Central de controle Arduino' },
  { id: 'caminhoes', label: 'Caminhoes', x: 248, y: 161.5, radius: 8, color: '#ca8a04', desc: 'Area de caminhoes basculantes 3D' },
  { id: 'eletronicos', label: 'Eletronicos', x: 142.5, y: 130, radius: 6.5, color: '#0ea5e9', desc: 'Painel de eletronicos e sensores' },
];

interface TrainState {
  id: number;
  progress: number;
  speed: number;
  color: string;
  active: boolean;
}

export default function MaqueteSvgSection() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [trains, setTrains] = useState<TrainState[]>([
    { id: 0, progress: 0, speed: 0.0008, color: '#0066b3', active: true },
    { id: 1, progress: 0.5, speed: 0.0006, color: '#e87722', active: true },
  ]);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      setTrains(prev => prev.map(train => ({
        ...train,
        progress: train.active ? (train.progress + train.speed) % 1 : train.progress,
      })));
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const selectedZoneData = ZONES.find(z => z.id === selectedZone);

  return (
    <section id="maquete" className="section">
      <div className="section-container">
        <div className="section-header">
          <span className="section-number">01</span>
          <h2 className="section-title">Maquete Interativa</h2>
          <p className="section-subtitle">Explore as areas da maquete clicando nos pontos</p>
        </div>

        <div className="maquete-svg-wrapper">
          <svg viewBox="0 0 441 189" fill="none" xmlns="http://www.w3.org/2000/svg" className="maquete-svg">
            <rect width="441" height="189" fill="#0a0e14" rx="12"/>
            {Array.from({ length: 6 }, (_, i) => (
              <line key={`ttop-${i}`} x1="51" y1={20 + i * 3} x2="358" y2={20 + i * 3} stroke="#2a3444" strokeWidth="0.5"/>
            ))}
            {Array.from({ length: 6 }, (_, i) => (
              <line key={`tbot-${i}`} x1="51" y1={143 + i * 3} x2="410" y2={143 + i * 3} stroke="#2a3444" strokeWidth="0.5"/>
            ))}
            <path d="M56 27L56 26L62 26L62 21L65 21L65 26L74 26L74 21L77 21L77 26L86 26L86 21L89 21L89 26L98 26L98 21L101 21L101 26L111 26L111 21L114 21L114 26L123 26L123 21L126 21L126 26L135 26L135 21L138 21L138 26L147 26L147 21L150 21L150 26L159 26L159 21L162 21L162 26L171 26L171 21L174 21L174 26L183 26L183 21L186 21L186 26L195 26L195 21L198 21L198 26L208 26L208 21L211 21L211 26L220 26L220 21L223 21L223 26L232 26L232 21L235 21L235 26L244 26L244 21L247 21L247 26L256 26L256 21L259 21L259 26L268 26L268 21L271 21L271 26L280 26L280 21L283 21L283 26L292 26L292 21L295 21L295 26L305 26L305 21L308 21L308 26L317 26L317 21L320 21L320 26L323 26L323 21L326 21" stroke="#4a5568" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            {trains.map(train => {
              const x = 56 + (train.progress * 270);
              const y = 23.5 + Math.sin(train.progress * Math.PI * 4) * 2;
              return (
                <g key={train.id}>
                  <rect x={x - 4} y={y - 2} width="8" height="4" rx="1" fill={train.color} className="train-body"/>
                  <rect x={x + 4} y={y - 1.5} width="3" height="3" rx="0.5" fill={train.color} opacity="0.7"/>
                  <circle cx={x + 5} cy={y} r="0.5" fill="#ffd700" opacity="0.8"/>
                </g>
              );
            })}
            {ZONES.map(zone => (
              <g key={zone.id} className="maquete-zone" onClick={() => setSelectedZone(selectedZone === zone.id ? null : zone.id)} onMouseEnter={() => setHoveredZone(zone.id)} onMouseLeave={() => setHoveredZone(null)} style={{ cursor: 'pointer' }}>
                <circle cx={zone.x} cy={zone.y} r={zone.radius + 2} fill={zone.color} opacity={hoveredZone === zone.id || selectedZone === zone.id ? 0.15 : 0.05} className="zone-glow"/>
                <circle cx={zone.x} cy={zone.y} r={zone.radius} fill={zone.color} opacity={selectedZone === zone.id ? 0.3 : 0.15} stroke={zone.color} strokeWidth={selectedZone === zone.id ? 2 : 1} strokeOpacity={selectedZone === zone.id ? 0.8 : 0.4} className="zone-circle"/>
                <circle cx={zone.x} cy={zone.y} r={zone.radius * 0.4} fill={zone.color} opacity={0.6}/>
                <text x={zone.x} y={zone.y + zone.radius + 6} textAnchor="middle" fill="#94a3b8" fontSize="4" fontFamily="Inter, sans-serif" fontWeight="500">{zone.label}</text>
              </g>
            ))}
            <line x1="81" y1="8" x2="253" y2="8.5" stroke="#2a3444" strokeWidth="0.5" strokeDasharray="2 2"/>
            <line x1="73.5" y1="40" x2="73" y2="50" stroke="#2a3444" strokeWidth="0.5" strokeDasharray="2 2"/>
            <line x1="261" y1="17" x2="261" y2="50" stroke="#2a3444" strokeWidth="0.5" strokeDasharray="2 2"/>
          </svg>

          {selectedZoneData && (
            <div className="maquete-info-panel">
              <div className="info-panel-header">
                <span className="info-dot" style={{ background: selectedZoneData.color }}></span>
                <h3>{selectedZoneData.label}</h3>
                <button className="info-close" onClick={() => setSelectedZone(null)}>X</button>
              </div>
              <p>{selectedZoneData.desc}</p>
            </div>
          )}

          <div className="maquete-legend">
            <div className="legend-item"><span className="legend-dot" style={{ background: '#e87722' }}></span><span>Mina</span></div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#0066b3' }}></span><span>Porto</span></div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#8b5cf6' }}></span><span>Trens</span></div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#dc2626' }}></span><span>Controle</span></div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#ca8a04' }}></span><span>Caminhoes</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}