import { useState, useEffect, useRef } from 'react';

interface Train {
  id: number;
  progress: number;
  speed: number;
  color: string;
  name: string;
  active: boolean;
  direction: number;
}

const COLORS = ['#0066b3', '#e87722', '#16a34a', '#8b5cf6'];
const NAMES = ['Azul', 'Laranja', 'Verde', 'Roxo'];

const ZONES = [
  { id: 'mina', label: 'Mina', x: 93, y: 8.5, r: 8.5, color: '#e87722', desc: 'Mina de ferro e carvao com dois poços de extracao. O minério e transportado por esteiras ate os caminhoes basculantes, que levam ate o trem para exportacao.' },
  { id: 'porto', label: 'Porto', x: 241, y: 8.5, r: 8.5, color: '#0066b3', desc: 'Porto de exportacao com guindaste e cais. Navios recebem o minério transportado pelo trem. LED vermelho indica navio atracado e motor linear move a esteira do cais.' },
  { id: 'circuito1', label: 'Circuito 1', x: 201.5, y: 9, r: 6.5, color: '#16a34a', desc: 'Ramal principal do circuito ferroviario. Trilhos em escala HO formam um percurso oval com desvios controlados por servomotores SG90.' },
  { id: 'circuito2', label: 'Circuito 2', x: 280.5, y: 9, r: 6.5, color: '#16a34a', desc: 'Ramal secundario para cargas especiais. Conecta o porto ao aeroporto de carga por uma via alternativa.' },
  { id: 'trem1', label: 'Trem', x: 73.5, y: 33.5, r: 6.5, color: '#8b5cf6', desc: 'Locomotiva eletrica em escala HO com 3 vagoes basculantes. Velocidade regulada por PWM e reed switches nas estacoes de carga e descarga.' },
  { id: 'trem2', label: 'Trem', x: 142.5, y: 130, r: 6.5, color: '#8b5cf6', desc: 'Area de manobra e desvio do trem. Dois servomotores definem se o trem segue para o porto ou para o ramal do aeroporto.' },
  { id: 'trem3', label: 'Trem', x: 266.5, y: 130, r: 6.5, color: '#8b5cf6', desc: 'Estacao de carga e descarga. Reed switch detecta o trem e dispara parada programada de 3 segundos para operacao de carga.' },
  { id: 'controle', label: 'Controle', x: 179, y: 130.5, r: 8.5, color: '#dc2626', desc: 'Central de controle com Arduino Mega. Botoes fisicos e display LCD 16x2 permitem modo manual ou automatico (sequencia completa mina -> porto).' },
  { id: 'caminhoes', label: 'Caminhoes', x: 248, y: 161.5, r: 8, color: '#ca8a04', desc: '3 caminhoes basculantes impressos em 3D (PLA). Cada um com motor DC micro controlado por driver L298N e sensores IR nas extremidades.' },
  { id: 'eletronicos', label: 'Eletronicos', x: 142.5, y: 130, r: 6.5, color: '#0ea5e9', desc: 'Painel de eletronicos com breadboard, fios de conexao e sensores IR TCRT5000. Alimentacao centralizada com fonte 12V e fusiveis individuais.' },
];

// Track: clean rounded rectangle, NO Z closepath
// Goes: top-left → top-right → bottom-right → bottom-left → back to start (explicit)
const TRACK_PATH = 'M 50 18 L 380 18 Q 392 18 392 30 L 392 150 Q 392 162 380 162 L 50 162 Q 38 162 38 150 L 38 30 Q 38 18 50 18';

export default function MaqueteSvgSection() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [trains, setTrains] = useState<Train[]>([
    { id: 0, progress: 0.0, speed: 0.08, color: '#0066b3', name: 'Azul', active: true, direction: 1 },
    { id: 1, progress: 0.33, speed: 0.06, color: '#e87722', name: 'Laranja', active: true, direction: 1 },
    { id: 2, progress: 0.66, speed: 0.07, color: '#16a34a', name: 'Verde', active: true, direction: 1 },
  ]);
  const [globalReversed, setGlobalReversed] = useState(false);
  const [globalSpeed, setGlobalSpeed] = useState(1);
  const [nextId, setNextId] = useState(3);

  const trackPathRef = useRef<SVGPathElement>(null);
  const globalReversedRef = useRef(false);
  const globalSpeedRef = useRef(1);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  useEffect(() => { globalReversedRef.current = globalReversed; }, [globalReversed]);
  useEffect(() => { globalSpeedRef.current = globalSpeed; }, [globalSpeed]);

  useEffect(() => {
    const animate = (time: number) => {
      const delta = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 1000, 0.05) : 0;
      lastTimeRef.current = time;
      if (delta > 0) {
        setTrains(prev => prev.map(t => {
          if (!t.active) return t;
          const dir = globalReversedRef.current ? -t.direction : t.direction;
          let p = t.progress + t.speed * globalSpeedRef.current * dir * delta;
          if (p > 1) p -= 1;
          if (p < 0) p += 1;
          return { ...t, progress: p };
        }));
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const addTrain = () => {
    setTrains(prev => [...prev, {
      id: nextId,
      progress: Math.random(),
      speed: 0.07,
      color: COLORS[nextId % COLORS.length],
      name: NAMES[nextId % NAMES.length],
      active: true,
      direction: 1,
    }]);
    setNextId(prev => prev + 1);
  };

  const removeTrain = (id: number) => setTrains(prev => prev.filter(t => t.id !== id));
  const toggleTrain = (id: number) => setTrains(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  const reverseTrain = (id: number) => setTrains(prev => prev.map(t => t.id === id ? { ...t, direction: t.direction === 1 ? -1 : 1 } : t));
  const setSpeed = (id: number, speed: number) => setTrains(prev => prev.map(t => t.id === id ? { ...t, speed } : t));
  const startAll = () => setTrains(prev => prev.map(t => ({ ...t, active: true })));
  const stopAll = () => setTrains(prev => prev.map(t => ({ ...t, active: false })));

  const zoneData = ZONES.find(z => z.id === selectedZone);

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
            <rect width="441" height="189" fill="#0a0e14" rx="12" />

            {/* Track path - visible */}
            <path d={TRACK_PATH} fill="none" stroke="#4a5568" strokeWidth="2" opacity="0.6"/>
            {/* Track path - invisible, used for train positioning */}
            <path ref={trackPathRef} d={TRACK_PATH} fill="none" stroke="transparent" strokeWidth="0"/>

            {/* Decorative maquette outline (simple) */}
            <rect x="30" y="10" width="380" height="168" rx="8" fill="none" stroke="#1a222d" strokeWidth="0.5" strokeDasharray="4 4"/>

            {/* Trains */}
            {trains.map(tr => {
              if (!trackPathRef.current) return null;
              const totalLen = trackPathRef.current.getTotalLength();

              // Wagon config: [offsetBehindLoco (as fraction of total), width, height]
              const WAGONS = [
                { offset: 0, w: 14, h: 7, label: 'loco' },       // locomotive
                { offset: 0.025, w: 10, h: 5, label: 'vagao1' },  // wagon 1
                { offset: 0.045, w: 10, h: 5, label: 'vagao2' },  // wagon 2
              ];

              return (
                <g key={tr.id} opacity={tr.active ? 1 : 0.3}>
                  {WAGONS.map((wagon, wi) => {
                    // Calculate wagon progress along path
                    let wp = tr.progress - wagon.offset;
                    if (wp < 0) wp += 1;

                    const pt = trackPathRef.current!.getPointAtLength(wp * totalLen);

                    // Get rotation from next point on path
                    const lookAhead = 0.005;
                    let wpNext = wp + lookAhead;
                    if (wpNext > 1) wpNext -= 1;
                    const ptNext = trackPathRef.current!.getPointAtLength(wpNext * totalLen);
                    const angle = Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x) * (180 / Math.PI);

                    const isLoco = wi === 0;

                    return (
                      <g key={wi} transform={`rotate(${angle}, ${pt.x}, ${pt.y})`}>
                        {/* Body */}
                        <rect
                          x={pt.x - wagon.w / 2}
                          y={pt.y - wagon.h / 2}
                          width={wagon.w}
                          height={wagon.h}
                          rx={isLoco ? 2.5 : 1.5}
                          fill={tr.color}
                          opacity={isLoco ? 1 : 0.55}
                        />
                        {isLoco && (
                          <>
                            {/* Locomotive cabin */}
                            <rect
                              x={pt.x - wagon.w / 2 + 2}
                              y={pt.y - wagon.h / 2 - 2}
                              width={4}
                              height={2}
                              rx={0.8}
                              fill={tr.color}
                              opacity={0.9}
                            />
                            {/* Windows */}
                            <rect x={pt.x - 3} y={pt.y - 2} width={2} height={1.5} rx={0.3} fill="#b8e0ff" opacity="0.8"/>
                            <rect x={pt.x} y={pt.y - 2} width={2} height={1.5} rx={0.3} fill="#b8e0ff" opacity="0.8"/>
                            {/* Headlight */}
                            <circle cx={pt.x + wagon.w / 2} cy={pt.y} r={1.2} fill="#ffd700"/>
                          </>
                        )}
                        {/* Wheels */}
                        <circle cx={pt.x - wagon.w / 4} cy={pt.y + wagon.h / 2} r={1.2} fill="#1a1a1a"/>
                        <circle cx={pt.x + wagon.w / 4} cy={pt.y + wagon.h / 2} r={1.2} fill="#1a1a1a"/>
                        {/* Coupling (connecting rod between wagons) */}
                        {!isLoco && (
                          <line
                            x1={pt.x + wagon.w / 2}
                            y1={pt.y}
                            x2={pt.x + wagon.w / 2 + 3}
                            y2={pt.y}
                            stroke={tr.color}
                            strokeWidth={0.8}
                            opacity={0.4}
                          />
                        )}
                      </g>
                    );
                  })}
                  {/* Active indicator */}
                  {tr.active && (
                    (() => {
                      const locoPt = trackPathRef.current!.getPointAtLength(tr.progress * totalLen);
                      return (
                        <circle cx={locoPt.x} cy={locoPt.y - 8} r={1.2} fill="#22c55e">
                          <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite"/>
                        </circle>
                      );
                    })()
                  )}
                </g>
              );
            })}

            {/* Zone markers */}
            {ZONES.map(zone => (
              <g key={zone.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedZone(selectedZone === zone.id ? null : zone.id)} onMouseEnter={() => setHoveredZone(zone.id)} onMouseLeave={() => setHoveredZone(null)}>
                <circle cx={zone.x} cy={zone.y} r={zone.r + 2} fill={zone.color} opacity={hoveredZone === zone.id || selectedZone === zone.id ? 0.15 : 0.05} />
                <circle cx={zone.x} cy={zone.y} r={zone.r} fill={zone.color} opacity={selectedZone === zone.id ? 0.3 : 0.15} stroke={zone.color} strokeWidth={selectedZone === zone.id ? 2 : 1} strokeOpacity={selectedZone === zone.id ? 0.8 : 0.4} />
                <circle cx={zone.x} cy={zone.y} r={zone.r * 0.4} fill={zone.color} opacity={0.6} />
                <text x={zone.x} y={zone.y + zone.r + 6} textAnchor="middle" fill="#94a3b8" fontSize="4" fontFamily="Inter, sans-serif" fontWeight="500">{zone.label}</text>
              </g>
            ))}

            {/* Connection lines */}
            <line x1="81" y1="8" x2="253" y2="8.5" stroke="#2a3444" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="73.5" y1="40" x2="73" y2="50" stroke="#2a3444" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="261" y1="17" x2="261" y2="50" stroke="#2a3444" strokeWidth="0.5" strokeDasharray="2 2" />
          </svg>

          {zoneData && (
            <div className="maquete-info-panel">
              <div className="info-panel-header">
                <span className="info-dot" style={{ background: zoneData.color }}></span>
                <h3>{zoneData.label}</h3>
                <button className="info-close" onClick={() => setSelectedZone(null)}>X</button>
              </div>
              <p>{zoneData.desc}</p>
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

        {/* Sobre o Projeto */}
        <div className="maquete-about-section">
          <h3 className="maquete-section-title">Sobre o Projeto</h3>
          <p className="maquete-section-desc">
            O Ferrorama simula toda a cadeia produtiva do minério de ferro e carvão — da extração na mina até a exportação pelo porto ou aeroporto — integrando modelismo ferroviário, impressão 3D e programação em Arduino.
          </p>
          <div className="maquete-objectives-grid">
            <div className="maquete-objective-item">
              <strong>Objetivo principal</strong>
              <p>Demonstrar como materiais brutos percorrem diferentes modos de transporte até chegar ao mercado internacional.</p>
            </div>
            <div className="maquete-objective-item">
              <strong>Aprendizado técnico</strong>
              <p>Combinar física (motores, sensores), modelismo e lógica de programação em um único projeto integrado.</p>
            </div>
            <div className="maquete-objective-item">
              <strong>Contexto real</strong>
              <p>Relacionar a maquete com a economia brasileira, onde o minério de ferro é um dos principais produtos de exportação.</p>
            </div>
          </div>
        </div>

        {/* Mapa da Maquete */}
        <div className="maquete-map-section">
          <h3 className="maquete-section-title">Mapa da Maquete</h3>
          <p className="maquete-section-desc">Visão esquemática de como os módulos se conectam na base de MDF.</p>
          <div className="maquete-map">
            <div className="map-zone map-mina">Mina</div>
            <div className="map-arrow" aria-hidden="true"></div>
            <div className="map-zone map-caminhoes">Caminhões</div>
            <div className="map-arrow" aria-hidden="true"></div>
            <div className="map-zone map-trem">Trem</div>
            <div className="map-split">
              <div className="map-branch">
                <div className="map-arrow map-arrow-down" aria-hidden="true"></div>
                <div className="map-zone map-porto">Porto</div>
              </div>
              <div className="map-branch">
                <div className="map-arrow map-arrow-down" aria-hidden="true"></div>
                <div className="map-zone map-aeroporto">Aeroporto</div>
              </div>
            </div>
            <div className="map-control">Central de controle</div>
          </div>
        </div>

        {/* FAQ */}
        <div className="maquete-faq-section">
          <h3 className="maquete-section-title">Perguntas Frequentes</h3>
          <div className="maquete-accordion">
            <details className="maquete-accordion-item">
              <summary>Qual escala foi usada na maquete?</summary>
              <p>Utilizamos escala HO (1:87) para trilhos, locomotiva e vagões. Os caminhões foram impressos em escala compatível (~1:87) e o aeroporto usa aviões em escala 1:500.</p>
            </details>
            <details className="maquete-accordion-item">
              <summary>Quanto tempo levou para montar tudo?</summary>
              <p>A construção física levou cerca de 6 semanas: 2 semanas para a base e paisagismo, 2 para trilhos e eletrônica, e 2 para impressão 3D, testes e acabamento final.</p>
            </details>
            <details className="maquete-accordion-item">
              <summary>É possível controlar cada parte separadamente?</summary>
              <p>Sim. A central possui modo manual (cada subsistema independente) e modo automático (sequência completa mina → caminhões → trem → porto/aeroporto).</p>
            </details>
            <details className="maquete-accordion-item">
              <summary>Precisa de computador para funcionar?</summary>
              <p>Não. Após carregar o código no Arduino, a maquete funciona de forma autônoma. O computador é usado apenas para programar, ajustar parâmetros e monitorar via porta serial.</p>
            </details>
          </div>
        </div>

        <div className="maquete-controls-panel">
          <div className="controls-header">
            <h3>Painel de Controle dos Trens</h3>
            <div className="controls-actions">
              <button className="ctrl-btn" onClick={addTrain}>+ Adicionar Trem</button>
              <button className="ctrl-btn primary" onClick={startAll}>Iniciar Todos</button>
              <button className="ctrl-btn danger" onClick={stopAll}>Parar Todos</button>
            </div>
          </div>

          <div className="reversor-control">
            <div className="reversor-indicator" style={{ background: globalReversed ? '#dc2626' : '#16a34a' }}></div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text)', fontWeight: 500 }}>
              Reversor Global: {globalReversed ? 'Invertido' : 'Normal'}
            </span>
            <button className="ctrl-btn" onClick={() => setGlobalReversed(prev => !prev)} style={{ marginLeft: 'auto' }}>
              {globalReversed ? 'Reverter' : 'Normal'}
            </button>
          </div>

          <div className="speed-control">
            <span>Velocidade Global:</span>
            <input type="range" min="0" max="3" step="0.1" value={globalSpeed} onChange={e => setGlobalSpeed(parseFloat(e.target.value))} />
            <span style={{ fontWeight: 600, minWidth: '32px', textAlign: 'right' }}>{globalSpeed.toFixed(1)}x</span>
          </div>

          <div className="train-list">
            {trains.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '1rem' }}>
                Nenhum trem adicionado. Clique em "Adicionar Trem" para comecar.
              </div>
            )}
            {trains.map(train => (
              <div key={train.id} className="train-item" style={{ opacity: train.active ? 1 : 0.6 }}>
                <div className="train-color" style={{ background: train.color }}></div>
                <div className="train-info">
                  <div className="train-name">{train.name}</div>
                  <div className="train-speed">
                    Vel: {train.speed.toFixed(3)} | Dir: {train.direction === 1 ? 'Normal' : 'Reverso'}
                  </div>
                  <input type="range" min="0.01" max="0.3" step="0.01" value={train.speed} onChange={e => setSpeed(train.id, parseFloat(e.target.value))} style={{ width: '100%', marginTop: '4px', accentColor: train.color }} />
                </div>
                <div className="train-actions">
                  <button className="train-btn" onClick={() => toggleTrain(train.id)} title={train.active ? 'Pausar' : 'Iniciar'}>
                    {train.active ? '\u23F8' : '\u25B6'}
                  </button>
                  <button className="train-btn" onClick={() => reverseTrain(train.id)} title="Inverter direcao">
                    {'\u21C4'}
                  </button>
                  <button className="train-btn danger" onClick={() => removeTrain(train.id)} title="Remover trem">
                    {'\u2715'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
