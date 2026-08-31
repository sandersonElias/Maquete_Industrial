import React, { useState, useEffect } from 'react';
import { Train, ArrowLeft, ArrowRight, RotateCcw, AlertOctagon, Loader, Box, Zap, CircleDot } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

const SwitchControl = ({ switchData, onCommand, loading }) => {
  const getStateColor = (state) => {
    switch (state) {
      case 'LEFT': return 'text-accent';
      case 'RIGHT': return 'text-[#A855F7]';
      case 'CENTER': return 'text-success';
      default: return 'text-muted';
    }
  };

  const getStateBg = (state) => {
    switch (state) {
      case 'LEFT': return 'bg-accent/10';
      case 'RIGHT': return 'bg-[#A855F7]/10';
      case 'CENTER': return 'bg-success/10';
      default: return 'bg-muted/10';
    }
  };

  const getStateLabel = (state) => {
    switch (state) {
      case 'LEFT': return 'Esquerda';
      case 'RIGHT': return 'Direita';
      case 'CENTER': return 'Centro';
      default: return 'N/A';
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${getStateBg(switchData.current_state)} ${switchData.is_moving ? 'animate-pulse' : ''}`}>
            <Train size={16} className={getStateColor(switchData.current_state)} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text">{switchData.name || `Desvio ${switchData.switch_id}`}</h3>
            <p className="text-xs text-muted">{getStateLabel(switchData.current_state)}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStateColor(switchData.current_state)} ${getStateBg(switchData.current_state)}`}>
          {switchData.current_angle ?? '--'}°
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>Posição</span>
          <span className="font-mono text-text">{switchData.current_state || 'N/A'}</span>
        </div>
        <div className="h-1.5 bg-card rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${((switchData.current_angle ?? 90) / 180) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onCommand(switchData.switch_id, 'SET', 'LEFT')}
          disabled={loading || switchData.is_moving}
          className="flex items-center justify-center gap-1.5 py-2 bg-card border border-border hover:border-accent/40 hover:bg-accent/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs"
        >
          <ArrowLeft size={12} className="text-accent" />
          <span>Esq</span>
        </button>
        <button
          onClick={() => onCommand(switchData.switch_id, 'SET', 'CENTER')}
          disabled={loading || switchData.is_moving}
          className="flex items-center justify-center gap-1.5 py-2 bg-card border border-border hover:border-success/40 hover:bg-success/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs"
        >
          <RotateCcw size={12} className="text-success" />
          <span>Ctr</span>
        </button>
        <button
          onClick={() => onCommand(switchData.switch_id, 'SET', 'RIGHT')}
          disabled={loading || switchData.is_moving}
          className="flex items-center justify-center gap-1.5 py-2 bg-card border border-border hover:border-[#A855F7]/40 hover:bg-[#A855F7]/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs"
        >
          <ArrowRight size={12} className="text-[#A855F7]" />
          <span>Dir</span>
        </button>
      </div>
    </div>
  );
};

const RailwayMap = ({ switches, sensors, semaphore, locomotiveSensor }) => {
  const getSwitchColor = (sw) => {
    if (!sw) return '#374151';
    if (sw.is_moving) return '#F59E0B';
    switch (sw.current_state) {
      case 'LEFT': return '#3B82F6';
      case 'RIGHT': return '#A855F7';
      case 'CENTER': return '#22C55E';
      default: return '#374151';
    }
  };

  const getSwitchStroke = (sw) => {
    if (!sw) return '#6b7280';
    if (sw.is_moving) return '#FBBF24';
    switch (sw.current_state) {
      case 'LEFT': return '#60A5FA';
      case 'RIGHT': return '#C084FC';
      case 'CENTER': return '#4ADE80';
      default: return '#6b7280';
    }
  };

  const getSensorColor = (active) => active ? '#22C55E' : '#2563eb';

  const getSemaphoreColor = (state) => {
    switch (state) {
      case 'RED': return '#dc2626';
      case 'YELLOW': return '#eab308';
      case 'GREEN': return '#22c55e';
      default: return '#374151';
    }
  };

  // Posições dos switches no SVG (800x500)
  const switchPositions = [
    { x: 260, y: 79, label: 'SW1', name: 'Desvio Superior' },
    { x: 400, y: 379, label: 'SW2', name: 'Desvio Central' },
    { x: 500, y: 379, label: 'SW3', name: 'Desvio Direito' },
  ];

  // Posições dos sensores
  const sensorPositions = [
    { x: 180, y: 72, label: 'S1' },
    { x: 450, y: 72, label: 'S2' },
    { x: 630, y: 72, label: 'S3' },
    { x: 570, y: 372, label: 'S4' },
    { x: 510, y: 442, label: 'S5' },
    { x: 320, y: 372, label: 'S6' },
    { x: 180, y: 372, label: 'S7' },
  ];

  // Posição da locomotiva (baseado no último sensor ativo)
  const locoPos = locomotiveSensor
    ? sensorPositions.find(s => s.label === locomotiveSensor) || null
    : null;

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider flex items-center gap-2">
          <Box size={12} className="text-accent" />
          Diagrama de Trilhos
        </h3>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22C55E]"></span> Centro</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span> Esquerda</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#A855F7]"></span> Direita</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2563eb]"></span> Sensor</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span> Locomotiva</span>
        </div>
      </div>

      <div className="p-4">
        <div className="relative bg-card rounded-lg border border-border p-2">
          <svg viewBox="0 0 800 500" className="w-full" style={{ height: 'auto' }}>
            {/* Camada 1: SVG de trilhos */}
            <image
              href="/ferrorama.svg"
              x="0"
              y="0"
              width="800"
              height="500"
              opacity="1"
            />

            {/* Camada 2: Indicadores dos switches (sobrepor ao SVG) */}
            {switchPositions.map((pos, index) => {
              const sw = switches[index];
              const color = getSwitchColor(sw);
              const stroke = getSwitchStroke(sw);
              const isMoving = sw?.is_moving;

              return (
                <g key={`switch-${index}`}>
                  {/* Glow externo */}
                  <rect
                    x={pos.x - 24}
                    y={pos.y - 14}
                    width="48"
                    height="28"
                    rx="6"
                    fill={color}
                    opacity="0.25"
                  >
                    {isMoving && (
                      <animate
                        attributeName="opacity"
                        values="0.15;0.4;0.15"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    )}
                  </rect>

                  {/* Bloco principal do switch */}
                  <rect
                    x={pos.x - 20}
                    y={pos.y - 11}
                    width="40"
                    height="22"
                    rx="4"
                    fill="#0f172a"
                    stroke={stroke}
                    strokeWidth="2"
                  />

                  {/* Label */}
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontFamily="monospace"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {pos.label}
                  </text>

                  {/* Nome */}
                  <text
                    x={pos.x}
                    y={pos.y + 24}
                    textAnchor="middle"
                    fill="#64748b"
                    fontFamily="monospace"
                    fontSize="8"
                  >
                    {sw?.name || pos.name}
                  </text>
                </g>
              );
            })}

            {/* Camada 3: Indicadores dos sensores */}
            {sensorPositions.map((pos, index) => {
              const isActive = sensors?.[index]?.active;
              const color = getSensorColor(isActive);

              return (
                <g key={`sensor-${index}`}>
                  <rect
                    x={pos.x - 10}
                    y={pos.y - 7}
                    width="20"
                    height="14"
                    rx="3"
                    fill={color}
                    opacity={isActive ? "1" : "0.6"}
                  >
                    {isActive && (
                      <animate
                        attributeName="opacity"
                        values="0.7;1;0.7"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    )}
                  </rect>
                  <text
                    x={pos.x}
                    y={pos.y - 12}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontFamily="monospace"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {pos.label}
                  </text>
                </g>
              );
            })}

            {/* Camada 4: Semáforo */}
            <circle
              cx="220"
              cy="420"
              r="10"
              fill={getSemaphoreColor(semaphore)}
              opacity="0.9"
            >
              {semaphore === 'GREEN' && (
                <animate
                  attributeName="opacity"
                  values="0.7;1;0.7"
                  dur="2s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
            <text
              x="220"
              y="445"
              textAnchor="middle"
              fill="#94a3b8"
              fontFamily="monospace"
              fontSize="9"
            >
              SEMAF
            </text>

            {/* Camada 4b: Locomotiva (ícone animado no último sensor ativo) */}
            {locoPos && (
              <g>
                {/* Glow da locomotiva */}
                <circle
                  cx={locoPos.x}
                  cy={locoPos.y}
                  r="18"
                  fill="#F59E0B"
                  opacity="0.2"
                >
                  <animate
                    attributeName="r"
                    values="14;20;14"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.15;0.35;0.15"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Corpo da locomotiva */}
                <rect
                  x={locoPos.x - 10}
                  y={locoPos.y - 7}
                  width="20"
                  height="14"
                  rx="3"
                  fill="#F59E0B"
                  stroke="#D97706"
                  strokeWidth="1.5"
                />

                {/* Cabine */}
                <rect
                  x={locoPos.x - 6}
                  y={locoPos.y - 5}
                  width="8"
                  height="10"
                  rx="1"
                  fill="#FEF3C7"
                  opacity="0.9"
                />

                {/* Rodas */}
                <circle cx={locoPos.x - 5} cy={locoPos.y + 7} r="2.5" fill="#92400E" />
                <circle cx={locoPos.x + 5} cy={locoPos.y + 7} r="2.5" fill="#92400E" />

                {/* Chaminé */}
                <rect
                  x={locoPos.x + 5}
                  y={locoPos.y - 10}
                  width="3"
                  height="4"
                  rx="1"
                  fill="#92400E"
                />

                {/* Label */}
                <text
                  x={locoPos.x}
                  y={locoPos.y + 26}
                  textAnchor="middle"
                  fill="#F59E0B"
                  fontFamily="monospace"
                  fontSize="8"
                  fontWeight="bold"
                >
                  LOCO
                </text>
              </g>
            )}

            {/* Camada 5: Estação */}
            <rect
              x="200"
              y="368"
              width="40"
              height="22"
              rx="4"
              fill="#d97706"
              stroke="#f59e0b"
              strokeWidth="2"
            />
            <text
              x="220"
              y="383"
              textAnchor="middle"
              fill="#fef3c7"
              fontFamily="monospace"
              fontSize="8"
              fontWeight="bold"
            >
              EST
            </text>
          </svg>
        </div>
      </div>

      {/* Status da Locomotiva */}
      {locomotiveSensor && (
        <div className="bg-surface border border-border rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
              <Train size={14} className="text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-xs text-muted">Posição da Locomotiva</p>
              <p className="text-sm font-medium text-text font-mono">
                Sensor {locomotiveSensor}
                <span className="text-muted text-xs ml-2">
                  ({sensorPositions.find(s => s.label === locomotiveSensor)?.x}, {sensorPositions.find(s => s.label === locomotiveSensor)?.y})
                </span>
              </p>
            </div>
            <div className="ml-auto">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B]">
                EM MOVIMENTO
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Ferrovia() {
  const [switches, setSwitches] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [semaphore, setSemaphore] = useState('RED');
  const [locomotiveSensor, setLocomotiveSensor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cmdLoading, setCmdLoading] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    fetchSwitches();
    fetchSensors();

    if (socket) {
      const onUpdate = (data) => {
        setSwitches(prev => prev.map(sw =>
          sw.switch_id === data.switchId
            ? { ...sw, current_state: data.state }
            : sw
        ));
      };

      const onStatus = (data) => {
        setSwitches(prev => prev.map(sw =>
          sw.switch_id === data.switchId
            ? { ...sw, current_angle: data.angle, current_state: data.state, is_moving: data.state === 'TRANSITION' }
            : sw
        ));
      };

      const onSensor = (data) => {
        setSensors(prev => prev.map((s, i) =>
          s.id === data.sensorId
            ? { ...s, active: data.active, timestamp: data.timestamp }
            : s
        ));

        // Rastrear último sensor ativo para posição da locomotiva
        if (data.active) {
          setLocomotiveSensor(data.sensorId);
        } else if (locomotiveSensor === data.sensorId) {
          // Se o sensor atual foi desativado, manter posição (próximo sensor vai atualizar)
        }
      };

      const onSemaphore = (data) => {
        setSemaphore(data.state);
      };

      socket.on('switch:update', onUpdate);
      socket.on('switch:status', onStatus);
      socket.on('sensor:update', onSensor);
      socket.on('semaphore:update', onSemaphore);

      return () => {
        socket.off('switch:update', onUpdate);
        socket.off('switch:status', onStatus);
        socket.off('sensor:update', onSensor);
        socket.off('semaphore:update', onSemaphore);
      };
    }
  }, [socket]);

  const fetchSwitches = async () => {
    try {
      const res = await axios.get('/api/ferrovia/status');
      setSwitches(res.data);
    } catch (e) {
      toast.error('Erro ao carregar switches');
    } finally {
      setLoading(false);
    }
  };

  const fetchSensors = async () => {
    try {
      const res = await axios.get('/api/ferrovia/sensors');
      setSensors(res.data);
    } catch (e) {
      console.log('Sensores não disponíveis');
    }
  };

  const sendCommand = async (switchId, type, action) => {
    setCmdLoading(true);
    try {
      await axios.post('/api/ferrovia/switch', {
        switchId,
        action: type === 'SET' ? action : undefined,
        angle: type === 'ANGLE' ? action : undefined
      });
      toast.success(`Switch ${switchId} -> ${action}`);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Falha ao enviar comando');
    } finally {
      setCmdLoading(false);
    }
  };

  const emergencyStop = async () => {
    if (!window.confirm('Resetar TODOS os switches para CENTER?')) return;
    for (let i = 1; i <= 3; i++) {
      await sendCommand(i, 'SET', 'CENTER');
    }
    toast.success('Emergência: todos em CENTER');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">Ferrovia</h2>
          <p className="text-sm text-muted mt-0.5">Controle dos desvios e monitoramento da linha</p>
        </div>
        <button
          onClick={emergencyStop}
          className="flex items-center gap-2 px-4 py-2 bg-danger hover:bg-danger/80 rounded-lg font-medium text-sm text-white transition-colors"
        >
          <AlertOctagon size={14} />
          <span>Emergência</span>
        </button>
      </div>

      <RailwayMap switches={switches} sensors={sensors} semaphore={semaphore} locomotiveSensor={locomotiveSensor} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-card rounded-lg" />
                <div>
                  <div className="w-20 h-3 bg-card rounded mb-1" />
                  <div className="w-14 h-2 bg-card rounded" />
                </div>
              </div>
              <div className="h-1.5 bg-card rounded-full mb-3" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-8 bg-card rounded-lg" />
                <div className="h-8 bg-card rounded-lg" />
                <div className="h-8 bg-card rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : switches.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-10 text-center">
          <Train size={36} className="mx-auto mb-3 text-muted opacity-40" />
          <p className="text-muted">Nenhum switch encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {switches.map(sw => (
            <SwitchControl
              key={sw.switch_id}
              switchData={sw}
              onCommand={sendCommand}
              loading={cmdLoading}
            />
          ))}
        </div>
      )}

      {/* Status dos Sensores */}
      {sensors.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wider flex items-center gap-2 mb-3">
            <CircleDot size={12} className="text-accent" />
            Sensores (S1-S7)
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {sensors.map((sensor, i) => (
              <div
                key={sensor.id || i}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border ${
                  sensor.active
                    ? 'border-success/40 bg-success/10'
                    : 'border-border bg-card'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${
                  sensor.active ? 'bg-success' : 'bg-muted'
                }`} />
                <span className="text-[10px] font-mono text-muted">S{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
