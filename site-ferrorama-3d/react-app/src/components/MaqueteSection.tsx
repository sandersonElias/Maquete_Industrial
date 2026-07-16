import { useEffect, useRef, useState, useCallback } from 'react';
import MaquetteScene from '../scenes/MaquetteScene';

const VIEWS = [
  { key: 'overview', label: 'Visão geral', title: 'Visão Geral', text: 'Layout oval com ramais e seções elevadas. Base de MDF com trilhos escala HO e eletrônicos Arduino.' },
  { key: 'mina', label: 'Eletrônicos', title: 'Área de Eletrônicos', text: 'Breadboard, Arduino Mega e fios de conexão para controle dos switches e do trem.' },
  { key: 'porto', label: 'Seção Elevada', title: 'Seção Elevada', text: 'Trilhos sobre suportes de cardboard, criando pontes e desníveis no percurso.' },
  { key: 'trem', label: 'Trem', title: 'Trem & Chaveamentos', text: 'Locomotiva azul com amarelo, chaveamentos para troca de trilhos.' },
];

const TRAIN_TYPES = [
  { type: 0, icon: '🚂', name: 'Carga' },
  { type: 1, icon: '🚆', name: 'Passageiro' },
  { type: 2, icon: '🚄', name: 'Expresso' },
  { type: 3, icon: '⛏️', name: 'Minerador' },
];

const PLUS_SVG = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>;
const CANCEL_SVG = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>;

interface TrainData {
  id: string;
  name: string;
  color: { body: number; name: string };
  typeName: string;
  carCount: number;
  running: boolean;
  speed: number;
}

interface InfoState {
  title: string;
  text?: string;
  textHtml?: string;
}

export default function MaqueteSection() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);

  const [activeView, setActiveView] = useState('overview');
  const [info, setInfo] = useState<InfoState>({ title: 'Visão Geral', text: VIEWS[0].text });
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [selectedType, setSelectedType] = useState(0);
  const [placementMode, setPlacementMode] = useState(false);
  const [globalSpeed, setGlobalSpeed] = useState(0.03);
  const [globalSpeedVal, setGlobalSpeedVal] = useState('100%');
  const [trains, setTrains] = useState<TrainData[]>([]);
  const [trainCount, setTrainCount] = useState(0);

  const updateTrainCount = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    setTrainCount(scene.getTrainCount());
  }, []);

  const handleTrainAdded = useCallback((train: any) => {
    setTrains(prev => [...prev, {
      id: train.id,
      name: train.name,
      color: train.color,
      typeName: train.color.name,
      carCount: train.type.cars,
      running: false,
      speed: train.targetSpeed,
    }]);
    updateTrainCount();
  }, [updateTrainCount]);

  const handleTrainRemoved = useCallback((id: string) => {
    setTrains(prev => prev.filter(t => t.id !== id));
    setTimeout(updateTrainCount, 350);
  }, [updateTrainCount]);

  const handleTrainToggled = useCallback((train: any) => {
    setTrains(prev => prev.map(t =>
      t.id === train.id ? { ...t, running: train.running } : t
    ));
  }, []);

  const handleTrainPlaced = useCallback(() => {
    setPlacementMode(false);
    updateTrainCount();
  }, [updateTrainCount]);

  const handleAllToggled = useCallback((running: boolean) => {
    setTrains(prev => prev.map(t => ({ ...t, running })));
  }, []);

  const handleReversor = useCallback((state: string) => {
    const color = state === 'red' ? '#ff4444' : '#44ff44';
    const label = state === 'red' ? 'REVERSO' : 'FRENTE';
    setInfo({
      title: `Reversor`,
      textHtml: `<span style="color:${color};font-size:0.8em">${label}</span>`,
      text: state === 'red'
        ? 'Reversor ativo — trens em movimento inverteram o sentido.'
        : 'Reversor normal — trens circulando no sentido padrão.',
    });
  }, []);

  const handleSwitch = useCallback((label: string, state: string) => {
    const dir = state === 'left' ? 'Esquerda' : 'Direita';
    setInfo({ title: `Chaveamento ${label}`, text: `Alterado para ${dir}. Alavanca movida.` });
  }, []);

  useEffect(() => {
    if (!canvasContainerRef.current || sceneRef.current) return;

    try {
      const scene = new MaquetteScene(canvasContainerRef.current);
      scene.onTrainAdded = handleTrainAdded;
      scene.onTrainRemoved = handleTrainRemoved;
      scene.onTrainToggled = handleTrainToggled;
      scene.onTrainPlaced = handleTrainPlaced;
      scene.onAllTrainsToggled = handleAllToggled;
      scene.onReversorToggled = handleReversor;
      scene.onSwitchToggled = handleSwitch;
      sceneRef.current = scene;
      scene._spawnDefaultTrains();
      updateTrainCount();
    } catch (e) {
      console.error('Error initializing maquette:', e);
    }

    return () => {
      if (sceneRef.current) {
        sceneRef.current.destroy();
        sceneRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleViewChange = (viewKey: string) => {
    setActiveView(viewKey);
    const v = VIEWS.find(v => v.key === viewKey);
    if (v) setInfo({ title: v.title, text: v.text });
    if (sceneRef.current) sceneRef.current.animateToView(viewKey);
  };

  const handleAddTrain = () => {
    if (!sceneRef.current) return;
    if (placementMode) {
      sceneRef.current.setPlacementMode(false);
      setPlacementMode(false);
    } else {
      sceneRef.current.setPlacementMode(true, selectedType);
      setPlacementMode(true);
    }
  };

  const handleStartAll = () => sceneRef.current?.startAllTrains();
  const handleStopAll = () => sceneRef.current?.stopAllTrains();

  const handleGlobalSpeed = (e: React.ChangeEvent<HTMLInputElement>) => {
    const speed = parseFloat(e.target.value);
    setGlobalSpeed(speed);
    setGlobalSpeedVal(Math.round((speed / 0.1) * 100) + '%');
    if (sceneRef.current) {
      sceneRef.current.trains.forEach((t: any) => {
        t.targetSpeed = speed;
      });
    }
  };

  const toggleTrainRunning = (id: string) => {
    sceneRef.current?.toggleTrainRunning(id);
  };

  const reverseTrain = (id: string) => {
    sceneRef.current?.reverseTrain(id);
  };

  const removeTrain = (id: string) => {
    sceneRef.current?.removeTrain(id);
  };

  const setTrainSpeed = (id: string, speed: number) => {
    sceneRef.current?.setTrainSpeed(id, speed);
  };

  return (
    <section id="maquete" className="section maquete-section" data-bg="gradient">
      <div className="section-container">
        <div className="section-header">
          <span className="section-number scroll-reveal">01</span>
          <h2 className="section-title scroll-reveal">Maquete 3D</h2>
          <p className="section-subtitle scroll-reveal">Explore a maquete interativamente em três dimensões</p>
        </div>

        <div className="maquete-viewer scroll-reveal">
          <div ref={canvasContainerRef} className="maquete-canvas" id="maquete3d"></div>

          {/* Camera controls (left side) */}
          <div className="maquete-controls">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                className={`control-btn ${activeView === v.key ? 'active' : ''}`}
                onClick={() => handleViewChange(v.key)}
                title={v.label}
              >
                <ViewIcon viewKey={v.key} />
              </button>
            ))}
          </div>

          {/* Train control panel (right side) */}
          <div className="train-panel">
            <div className="train-panel-header">
              <h3>
                <span className="train-panel-icon">🚂</span>
                Controle de Trens
                <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ({trainCount})
                </span>
              </h3>
              <button
                className="train-panel-toggle"
                onClick={() => setPanelCollapsed(!panelCollapsed)}
                title="Minimizar"
              >
                {panelCollapsed ? '+' : '—'}
              </button>
            </div>

            {!panelCollapsed && (
              <div className="train-panel-body">
                {/* Add train section */}
                <div className="train-add-section">
                  <p className="train-add-label">Tipo de trem:</p>
                  <div className="train-type-grid">
                    {TRAIN_TYPES.map((tt) => (
                      <button
                        key={tt.type}
                        className={`train-type-btn ${selectedType === tt.type ? 'active' : ''}`}
                        onClick={() => setSelectedType(tt.type)}
                        title={tt.name}
                      >
                        <span className="tt-icon">{tt.icon}</span>
                        <span className="tt-name">{tt.name}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    className={`btn-add-train ${placementMode ? 'placing' : ''}`}
                    onClick={handleAddTrain}
                  >
                    {placementMode ? CANCEL_SVG : PLUS_SVG}
                    {placementMode ? 'Cancelar' : 'Adicionar ao trilho'}
                  </button>
                </div>

                {/* Global controls */}
                <div className="train-global-controls">
                  <button className="btn-global btn-start-all" onClick={handleStartAll} title="Iniciar todos">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                    Todos
                  </button>
                  <button className="btn-global btn-stop-all" onClick={handleStopAll} title="Parar todos">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    Todos
                  </button>
                  <div className="global-speed">
                    <label>Velocidade global:</label>
                    <input type="range" min="0.005" max="0.1" step="0.005" value={globalSpeed} onChange={handleGlobalSpeed} />
                    <span>{globalSpeedVal}</span>
                  </div>
                </div>

                {/* Train list */}
                <div className="train-list">
                  {trains.length === 0 && (
                    <div className="train-list-empty">
                      Nenhum trem adicionado.<br />
                      Clique em "Adicionar ao trilho" e depois clique no trilho.
                    </div>
                  )}
                  {trains.map((train) => (
                    <TrainCard
                      key={train.id}
                      train={train}
                      onToggle={() => toggleTrainRunning(train.id)}
                      onReverse={() => reverseTrain(train.id)}
                      onDelete={() => removeTrain(train.id)}
                      onSpeedChange={(speed: number) => setTrainSpeed(train.id, speed)}
                    />
                  ))}
                </div>

                {/* Placement mode indicator */}
                {placementMode && (
                  <div className="placement-hint">
                    <span className="placement-dot"></span>
                    Clique no trilho para posicionar o trem
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info bar */}
          <div className="maquete-info">
            <h3>
              {info.title}
              {info.textHtml && (
                <span dangerouslySetInnerHTML={{ __html: info.textHtml }} />
              )}
            </h3>
            <p>{info.text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

interface TrainCardProps {
  train: TrainData;
  onToggle: () => void;
  onReverse: () => void;
  onDelete: () => void;
  onSpeedChange: (speed: number) => void;
}

function TrainCard({ train, onToggle, onReverse, onDelete, onSpeedChange }: TrainCardProps) {
  const colorHex = '#' + train.color.body.toString(16).padStart(6, '0');
  const [speed, setSpeed] = useState(train.speed);

  const handleSpeed = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSpeed(val);
    onSpeedChange(val);
  };

  return (
    <div className={`train-card ${train.running ? 'running' : ''}`} data-id={train.id}>
      <div className="train-color-dot" style={{ background: colorHex, color: colorHex }}></div>
      <div className="train-card-info">
        <div className="train-card-name">{train.name}</div>
        <div className="train-card-type">{train.typeName} · {train.carCount} vagões</div>
        <div className="train-card-speed">
          <input type="range" min="0.005" max="0.1" step="0.005" value={speed} onChange={handleSpeed} />
          <span className="speed-val">{Math.round((speed / 0.1) * 100)}%</span>
        </div>
      </div>
      <div className="train-card-controls">
        <button className="train-btn btn-play" onClick={onToggle} title={train.running ? 'Parar' : 'Iniciar'}>
          {train.running ? '⏸' : '▶'}
        </button>
        <button className="train-btn btn-reverse" onClick={onReverse} title="Inverter">⟲</button>
        <button className="train-btn btn-delete" onClick={onDelete} title="Remover">✕</button>
      </div>
    </div>
  );
}

interface ViewIconProps {
  viewKey: string;
}

function ViewIcon({ viewKey }: ViewIconProps) {
  const icons: Record<string, JSX.Element> = {
    overview: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>,
    mina: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>,
    porto: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg>,
    trem: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16M8 21l2-4M16 21l-2-4"/></svg>,
  };
  return icons[viewKey] || null;
}
