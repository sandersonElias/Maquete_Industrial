import { useState, useId } from 'react';
import TrainsLayer, { TrainConfig } from './TrainsLayer';

const COLORS = ['#0066b3', '#e87722', '#16a34a', '#8b5cf6'];
const NAMES = ['Azul', 'Laranja', 'Verde', 'Roxo'];

const ZONES = [
  { id: 'mina', label: 'Mina', x: 93, y: 8.5, r: 8.5, color: '#e87722', desc: 'Mina de ferro e carvão com dois poços de extração. O minério é transportado por esteiras até os caminhões basculantes, que levam até o trem para exportação.' },
  { id: 'porto', label: 'Porto', x: 241, y: 8.5, r: 8.5, color: '#0066b3', desc: 'Porto de exportação com guindaste e cais. Navios recebem o minério transportado pelo trem. LED vermelho indica navio atracado e motor linear move a esteira do cais.' },
  { id: 'circuito1', label: 'Circuito 1', x: 201.5, y: 9, r: 6.5, color: '#16a34a', desc: 'Ramal principal do circuito ferroviário. Trilhos em escala HO formam um percurso oval com desvios controlados por servomotores SG90.' },
  { id: 'circuito2', label: 'Circuito 2', x: 280.5, y: 9, r: 6.5, color: '#16a34a', desc: 'Ramal secundário para cargas especiais. Conecta o porto ao aeroporto de carga por uma via alternativa.' },
  { id: 'trem1', label: 'Trem', x: 73.5, y: 33.5, r: 6.5, color: '#8b5cf6', desc: 'Locomotiva elétrica em escala HO com 3 vagões basculantes. Velocidade regulada por PWM e reed switches nas estações de carga e descarga.' },
  { id: 'trem2', label: 'Trem', x: 142.5, y: 130, r: 6.5, color: '#8b5cf6', desc: 'Área de manobra e desvio do trem. Dois servomotores definem se o trem segue para o porto ou para o ramal do aeroporto.' },
  { id: 'trem3', label: 'Trem', x: 266.5, y: 130, r: 6.5, color: '#8b5cf6', desc: 'Estação de carga e descarga. Reed switch detecta o trem e dispara parada programada de 3 segundos para operação de carga.' },
  { id: 'controle', label: 'Controle', x: 179, y: 130.5, r: 8.5, color: '#dc2626', desc: 'Central de controle com Arduino Mega. Botões físicos e display LCD 16x2 permitem modo manual ou automático (sequência completa mina → porto).' },
  { id: 'caminhoes', label: 'Caminhões', x: 248, y: 161.5, r: 8, color: '#ca8a04', desc: '3 caminhões basculantes impressos em 3D (PLA). Cada um com motor DC micro controlado por driver L298N e sensores IR nas extremidades.' },
  { id: 'eletronicos', label: 'Eletrônicos', x: 142.5, y: 130, r: 6.5, color: '#0ea5e9', desc: 'Painel de eletrônicos com breadboard, fios de conexão e sensores IR TCRT5000. Alimentação centralizada com fonte 12V e fusíveis individuais.' },
];

// Traçado: retângulo arredondado sem `Z`, fechado explicitamente no ponto inicial
const TRACK_PATH = 'M 50 18 L 380 18 Q 392 18 392 30 L 392 150 Q 392 162 380 162 L 50 162 Q 38 162 38 150 L 38 30 Q 38 18 50 18';

export default function MaqueteSvgSection() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [trains, setTrains] = useState<TrainConfig[]>([
    { id: 0, speed: 0.08, color: '#0066b3', name: 'Azul', active: true, direction: 1 },
    { id: 1, speed: 0.06, color: '#e87722', name: 'Laranja', active: true, direction: 1 },
    { id: 2, speed: 0.07, color: '#16a34a', name: 'Verde', active: true, direction: 1 },
  ]);
  const [globalReversed, setGlobalReversed] = useState(false);
  const [globalSpeed, setGlobalSpeed] = useState(1);
  const [nextId, setNextId] = useState(3);
  const speedId = useId();

  const addTrain = () => {
    setTrains(prev => [...prev, {
      id: nextId,
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
          <p className="section-subtitle">Explore as áreas da maquete clicando nos pontos</p>
        </div>

        <div className="maquete-svg-wrapper">
          <svg
            viewBox="0 0 441 189"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="maquete-svg"
            role="group"
            aria-label="Planta esquemática da maquete. Use Tab para percorrer as áreas e Enter para abrir os detalhes."
          >
            <rect width="441" height="189" fill="#0a0e14" rx="12" />

            {/* Traçado visível dos trilhos */}
            <path d={TRACK_PATH} fill="none" stroke="#4a5568" strokeWidth="2" opacity="0.6" />

            {/* Contorno decorativo da base de MDF */}
            <rect x="30" y="10" width="380" height="168" rx="8" fill="none" stroke="#1a222d" strokeWidth="0.5" strokeDasharray="4 4" />

            <TrainsLayer
              trains={trains}
              trackPath={TRACK_PATH}
              globalSpeed={globalSpeed}
              globalReversed={globalReversed}
            />

            {/* Marcadores de área — focáveis e acionáveis pelo teclado */}
            {ZONES.map(zone => {
              const isSelected = selectedZone === zone.id;
              return (
                <g
                  key={zone.id}
                  className="maquete-zone"
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`${zone.label}: ${isSelected ? 'ocultar' : 'ver'} detalhes`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedZone(isSelected ? null : zone.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedZone(isSelected ? null : zone.id);
                    }
                  }}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                  onFocus={() => setHoveredZone(zone.id)}
                  onBlur={() => setHoveredZone(null)}
                >
                  <circle cx={zone.x} cy={zone.y} r={zone.r + 2} fill={zone.color} opacity={hoveredZone === zone.id || isSelected ? 0.15 : 0.05} />
                  <circle cx={zone.x} cy={zone.y} r={zone.r} fill={zone.color} opacity={isSelected ? 0.3 : 0.15} stroke={zone.color} strokeWidth={isSelected ? 2 : 1} strokeOpacity={isSelected ? 0.8 : 0.4} />
                  <circle cx={zone.x} cy={zone.y} r={zone.r * 0.4} fill={zone.color} opacity={0.6} />
                  <text x={zone.x} y={zone.y + zone.r + 6} textAnchor="middle" fill="#94a3b8" fontSize="4" fontFamily="Inter, sans-serif" fontWeight="500">{zone.label}</text>
                </g>
              );
            })}

            {/* Linhas de conexão entre módulos */}
            <line x1="81" y1="8" x2="253" y2="8.5" stroke="#2a3444" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="73.5" y1="40" x2="73" y2="50" stroke="#2a3444" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="261" y1="17" x2="261" y2="50" stroke="#2a3444" strokeWidth="0.5" strokeDasharray="2 2" />
          </svg>

          {/* `aria-live` anuncia a área escolhida a quem usa leitor de tela */}
          <div aria-live="polite">
            {zoneData && (
              <div className="maquete-info-panel">
                <div className="info-panel-header">
                  <span className="info-dot" style={{ background: zoneData.color }} aria-hidden="true"></span>
                  <h3>{zoneData.label}</h3>
                  <button
                    type="button"
                    className="info-close"
                    onClick={() => setSelectedZone(null)}
                    aria-label={`Fechar detalhes de ${zoneData.label}`}
                  >
                    &times;
                  </button>
                </div>
                <p>{zoneData.desc}</p>
              </div>
            )}
          </div>

          <ul className="maquete-legend">
            <li className="legend-item"><span className="legend-dot" style={{ background: '#e87722' }} aria-hidden="true"></span><span>Mina</span></li>
            <li className="legend-item"><span className="legend-dot" style={{ background: '#0066b3' }} aria-hidden="true"></span><span>Porto</span></li>
            <li className="legend-item"><span className="legend-dot" style={{ background: '#8b5cf6' }} aria-hidden="true"></span><span>Trens</span></li>
            <li className="legend-item"><span className="legend-dot" style={{ background: '#dc2626' }} aria-hidden="true"></span><span>Controle</span></li>
            <li className="legend-item"><span className="legend-dot" style={{ background: '#ca8a04' }} aria-hidden="true"></span><span>Caminhões</span></li>
          </ul>
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
              <button type="button" className="ctrl-btn" onClick={addTrain}>+ Adicionar Trem</button>
              <button type="button" className="ctrl-btn primary" onClick={startAll}>Iniciar Todos</button>
              <button type="button" className="ctrl-btn danger" onClick={stopAll}>Parar Todos</button>
            </div>
          </div>

          <div className="reversor-control">
            <div
              className="reversor-indicator"
              style={{ background: globalReversed ? '#dc2626' : '#16a34a' }}
              aria-hidden="true"
            ></div>
            <span className="reversor-label" role="status">
              Reversor Global: {globalReversed ? 'Invertido' : 'Normal'}
            </span>
            <button
              type="button"
              className="ctrl-btn"
              onClick={() => setGlobalReversed(prev => !prev)}
              style={{ marginLeft: 'auto' }}
            >
              {globalReversed ? 'Normal' : 'Inverter'}
            </button>
          </div>

          <div className="speed-control">
            <label htmlFor={speedId}>Velocidade Global:</label>
            <input
              id={speedId}
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={globalSpeed}
              onChange={e => setGlobalSpeed(parseFloat(e.target.value))}
              aria-valuetext={`${globalSpeed.toFixed(1)} vezes`}
            />
            <span className="speed-value">{globalSpeed.toFixed(1)}x</span>
          </div>

          <ul className="train-list">
            {trains.length === 0 && (
              <li className="train-list-empty">
                Nenhum trem adicionado. Clique em &ldquo;Adicionar Trem&rdquo; para começar.
              </li>
            )}
            {trains.map(train => (
              <li key={train.id} className="train-item" style={{ opacity: train.active ? 1 : 0.6 }}>
                <div className="train-color" style={{ background: train.color }} aria-hidden="true"></div>
                <div className="train-info">
                  <div className="train-name">{train.name}</div>
                  <div className="train-speed">
                    Vel: {train.speed.toFixed(3)} | Dir: {train.direction === 1 ? 'Normal' : 'Reverso'}
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.3"
                    step="0.01"
                    value={train.speed}
                    onChange={e => setSpeed(train.id, parseFloat(e.target.value))}
                    aria-label={`Velocidade do trem ${train.name}`}
                    aria-valuetext={train.speed.toFixed(2)}
                    style={{ width: '100%', marginTop: '4px', accentColor: train.color }}
                  />
                </div>
                <div className="train-actions">
                  <button
                    type="button"
                    className="train-btn"
                    onClick={() => toggleTrain(train.id)}
                    aria-label={train.active ? `Pausar trem ${train.name}` : `Iniciar trem ${train.name}`}
                  >
                    <span aria-hidden="true">{train.active ? '⏸' : '▶'}</span>
                  </button>
                  <button
                    type="button"
                    className="train-btn"
                    onClick={() => reverseTrain(train.id)}
                    aria-label={`Inverter direção do trem ${train.name}`}
                  >
                    <span aria-hidden="true">{'⇄'}</span>
                  </button>
                  <button
                    type="button"
                    className="train-btn danger"
                    onClick={() => removeTrain(train.id)}
                    aria-label={`Remover trem ${train.name}`}
                  >
                    <span aria-hidden="true">{'✕'}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
