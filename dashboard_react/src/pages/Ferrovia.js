import React, { useState, useEffect } from 'react';
import { Train, ArrowLeft, ArrowRight, RotateCcw, AlertOctagon, Loader, Box } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

const SwitchControl = ({ switchData, onCommand, loading }) => {
  const getStateColor = (state) => {
    switch (state) {
      case 'LEFT': return 'bg-maquete-accent';
      case 'RIGHT': return 'bg-maquete-purple';
      case 'CENTER': return 'bg-maquete-glow';
      default: return 'bg-gray-600';
    }
  };

  const getStateTextColor = (state) => {
    switch (state) {
      case 'LEFT': return 'text-maquete-accent';
      case 'RIGHT': return 'text-maquete-purple';
      case 'CENTER': return 'text-maquete-glow';
      default: return 'text-gray-500';
    }
  };

  const getBorderColor = (state) => {
    switch (state) {
      case 'LEFT': return 'hover:border-maquete-accent/40';
      case 'RIGHT': return 'hover:border-maquete-purple/40';
      case 'CENTER': return 'hover:border-maquete-glow/40';
      default: return 'hover:border-gray-500/40';
    }
  };

  return (
    <div className={`bg-maquete-card/80 backdrop-blur-sm border border-maquete-border rounded-xl p-5 transition-all duration-300 ${getBorderColor(switchData.current_state)} hover:shadow-lg`}
      style={{
        transform: 'perspective(600px) rotateX(1deg)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center ${getStateColor(switchData.current_state)} ${switchData.is_moving ? 'animate-pulse' : ''}`}
            style={{ boxShadow: `0 0 20px ${switchData.current_state === 'LEFT' ? 'rgba(61,158,255,0.3)' : switchData.current_state === 'RIGHT' ? 'rgba(168,85,247,0.3)' : 'rgba(0,255,178,0.3)'}` }}
          >
            <Train size={18} className="text-white" />
            {switchData.is_moving && (
              <Loader size={12} className="absolute -top-1 -right-1 text-maquete-warning animate-spin" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">Switch {switchData.switch_id}</h3>
            <p className="text-xs text-gray-500">{switchData.name}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStateTextColor(switchData.current_state)} bg-opacity-15 border border-current/20`}
          style={{ backgroundColor: `color-mix(in srgb, currentColor 10%, transparent)` }}
        >
          {switchData.current_state || 'N/A'}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Ângulo</span>
          <span className="font-mono font-medium text-white">{switchData.current_angle ?? '--'}°</span>
        </div>
        <div className="h-2 bg-maquete-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-maquete-accent via-maquete-glow to-maquete-purple rounded-full transition-all duration-500"
            style={{
              width: `${((switchData.current_angle ?? 90) / 180) * 100}%`,
              boxShadow: '0 0 10px rgba(0,255,178,0.3)',
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={() => onCommand(switchData.switch_id, 'SET', 'LEFT')}
          disabled={loading || switchData.is_moving}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-maquete-surface/80 hover:bg-maquete-accent/15 border border-maquete-border hover:border-maquete-accent/40 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(61,158,255,0.15)]"
        >
          <ArrowLeft size={14} className="text-maquete-accent" />
          <span className="text-xs">Esquerda</span>
        </button>
        <button
          onClick={() => onCommand(switchData.switch_id, 'SET', 'CENTER')}
          disabled={loading || switchData.is_moving}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-maquete-surface/80 hover:bg-maquete-glow/15 border border-maquete-border hover:border-maquete-glow/40 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(0,255,178,0.15)]"
        >
          <RotateCcw size={14} className="text-maquete-glow" />
          <span className="text-xs">Centro</span>
        </button>
        <button
          onClick={() => onCommand(switchData.switch_id, 'SET', 'RIGHT')}
          disabled={loading || switchData.is_moving}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-maquete-surface/80 hover:bg-maquete-purple/15 border border-maquete-border hover:border-maquete-purple/40 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
        >
          <ArrowRight size={14} className="text-maquete-purple" />
          <span className="text-xs">Direita</span>
        </button>
      </div>
    </div>
  );
};

const RailwayMap = ({ switches }) => {
  const getSwitchColor = (sw) => {
    if (!sw) return '#4A5568';
    if (sw.is_moving) return '#FFB800';
    switch (sw.current_state) {
      case 'LEFT': return '#3D9EFF';
      case 'RIGHT': return '#A855F7';
      case 'CENTER': return '#00FFB2';
      default: return '#4A5568';
    }
  };

  return (
    <div className="bg-maquete-card/60 backdrop-blur-sm border border-maquete-border rounded-xl overflow-hidden"
      style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-maquete-border">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Box size={14} className="text-maquete-glow" />
          Mapa da Linha
        </h3>
      </div>

      <div className="relative" style={{ height: '280px' }}>
        <div className="relative h-full bg-maquete-dark p-4">
          <svg viewBox="0 0 800 300" className="w-full h-full">
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1C2333" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="800" height="300" fill="url(#grid)" />

            {/* === TRILHOS === */}

            {/* Trilho superior: esquerda → SW1 */}
            <path d="M 40,70 L 130,70" stroke="#2D3748" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M 40,70 L 130,70" stroke="#4A5568" strokeWidth="2" strokeDasharray="12 8" fill="none">
              <animate attributeName="stroke-dashoffset" values="0;-20" dur="2s" repeatCount="indefinite" />
            </path>

            {/* SW1 → Reversor */}
            <path d="M 180,70 L 380,70" stroke="#2D3748" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M 180,70 L 380,70" stroke="#4A5568" strokeWidth="2" strokeDasharray="12 8" fill="none">
              <animate attributeName="stroke-dashoffset" values="0;-20" dur="2s" repeatCount="indefinite" />
            </path>

            {/* Reversor → curva direita */}
            <path d="M 500,70 L 650,70" stroke="#2D3748" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M 500,70 L 650,70" stroke="#4A5568" strokeWidth="2" strokeDasharray="12 8" fill="none">
              <animate attributeName="stroke-dashoffset" values="0;-20" dur="2s" repeatCount="indefinite" />
            </path>

            {/* Curva descendente direita (mais quadrada) */}
            <path d="M 650,70 L 710,70 L 710,230 L 730,230" stroke="#2D3748" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

            {/* Trilho inferior: esquerda → SW2 */}
            <path d="M 40,230 L 200,230" stroke="#2D3748" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M 40,230 L 200,230" stroke="#4A5568" strokeWidth="2" strokeDasharray="12 8" fill="none">
              <animate attributeName="stroke-dashoffset" values="0;-20" dur="2s" repeatCount="indefinite" />
            </path>

            {/* SW2 → SW3 (maior distância) */}
            <path d="M 250,230 L 480,230" stroke="#2D3748" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M 250,230 L 480,230" stroke="#4A5568" strokeWidth="2" strokeDasharray="12 8" fill="none">
              <animate attributeName="stroke-dashoffset" values="0;-20" dur="2s" repeatCount="indefinite" />
            </path>

            {/* SW3 → direita (converge no mesmo ponto) */}
            <path d="M 530,230 L 710,230" stroke="#2D3748" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M 530,230 L 710,230" stroke="#4A5568" strokeWidth="2" strokeDasharray="12 8" fill="none">
              <animate attributeName="stroke-dashoffset" values="0;-20" dur="2s" repeatCount="indefinite" />
            </path>

            {/* Lado esquerdo: conexão superior-inferior (mais quadrada) */}
            <path d="M 40,70 L 40,230" stroke="#2D3748" strokeWidth="8" strokeLinecap="round" fill="none" />

            {/* Derivação diagonal de SW1 (sai logo após o terminal) */}
            <path d="M 175,70 L 450,170" stroke="#2D3748" strokeWidth="4" strokeLinecap="round" fill="none" />

            {/* Laço externo direito (converge no mesmo ponto) */}
            <path d="M 450,170 L 710,170" stroke="#2D3748" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 710,170 L 710,230" stroke="#2D3748" strokeWidth="4" strokeLinecap="round" fill="none" />

            {/* Derivação de SW2 (sai logo após o terminal) */}
            <path d="M 245,230 L 500,280" stroke="#2D3748" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 500,280 L 710,280 L 710,230" stroke="#2D3748" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />

            {/* === DESVIOS === */}

            {/* SW1 - Topo-esquerda */}
            <g>
              {switches[0]?.is_moving && (
                <circle cx="155" cy="70" r="16" fill={getSwitchColor(switches[0])} opacity="0.2">
                  <animate attributeName="r" values="12;22;12" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.05;0.3" dur="1s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx="155" cy="70" r="12" fill={getSwitchColor(switches[0])} opacity="0.1" />
              <circle cx="155" cy="70" r="8" fill={getSwitchColor(switches[0])} stroke="#1C2333" strokeWidth="2" />
              <circle cx="153" cy="68" r="2" fill="white" opacity="0.3" />
              <text x="155" y="50" textAnchor="middle" fill="#9CA3AF" fontSize="11" fontWeight="600">SW1</text>
            </g>

            {/* SW2 - Baixo-esquerda */}
            <g>
              {switches[1]?.is_moving && (
                <circle cx="225" cy="230" r="16" fill={getSwitchColor(switches[1])} opacity="0.2">
                  <animate attributeName="r" values="12;22;12" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.05;0.3" dur="1s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx="225" cy="230" r="12" fill={getSwitchColor(switches[1])} opacity="0.1" />
              <circle cx="225" cy="230" r="8" fill={getSwitchColor(switches[1])} stroke="#1C2333" strokeWidth="2" />
              <circle cx="223" cy="228" r="2" fill="white" opacity="0.3" />
              <text x="225" y="255" textAnchor="middle" fill="#9CA3AF" fontSize="11" fontWeight="600">SW2</text>
            </g>

            {/* SW3 - Baixo-centro (mais afastado do SW2) */}
            <g>
              {switches[2]?.is_moving && (
                <circle cx="505" cy="230" r="16" fill={getSwitchColor(switches[2])} opacity="0.2">
                  <animate attributeName="r" values="12;22;12" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.05;0.3" dur="1s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx="505" cy="230" r="12" fill={getSwitchColor(switches[2])} opacity="0.1" />
              <circle cx="505" cy="230" r="8" fill={getSwitchColor(switches[2])} stroke="#1C2333" strokeWidth="2" />
              <circle cx="503" cy="228" r="2" fill="white" opacity="0.3" />
              <text x="505" y="255" textAnchor="middle" fill="#9CA3AF" fontSize="11" fontWeight="600">SW3</text>
            </g>

            {/* REVERSOR - Topo-direita (visual retangular) */}
            <g>
              {switches[3]?.is_moving && (
                <rect x="395" y="52" width="90" height="36" rx="6" fill="#FF4560" opacity="0.2">
                  <animate attributeName="opacity" values="0.3;0.05;0.3" dur="1s" repeatCount="indefinite" />
                </rect>
              )}
              <rect x="400" y="55" width="80" height="30" rx="5" fill="#FF4560" opacity="0.15" />
              <rect x="405" y="58" width="70" height="24" rx="4" fill="#FF4560" stroke="#1C2333" strokeWidth="2" />
              <text x="440" y="45" textAnchor="middle" fill="#FF4560" fontSize="10" fontWeight="600">REVERSOR</text>
              <text x="440" y="75" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">SW4</text>
            </g>

            {/* === LOCOMOTIVA ANIMADA === */}
            <g>
              <animateTransform attributeName="transform" type="translate" values="0,0;600,0;600,160;0,160;0,0" dur="12s" repeatCount="indefinite" />
              <rect x="80" y="56" width="40" height="28" rx="6" fill="#FFB800" opacity="0.95" />
              <rect x="88" y="60" width="8" height="6" rx="1" fill="#1C2333" opacity="0.5" />
              <rect x="100" y="60" width="8" height="6" rx="1" fill="#1C2333" opacity="0.5" />
              <rect x="112" y="58" width="8" height="10" rx="2" fill="#E0A000" opacity="0.8" />
              <circle cx="126" cy="70" r="3" fill="#FFB800" opacity="0.6">
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* Labels */}
            <text x="40" y="160" fill="#4A5568" fontSize="9" textAnchor="middle" fontWeight="500">ENTRADA</text>
            <text x="730" y="160" fill="#4A5568" fontSize="9" textAnchor="middle" fontWeight="500">SAÍDA</text>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default function Ferrovia() {
  const [switches, setSwitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cmdLoading, setCmdLoading] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    fetchSwitches();

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

      socket.on('switch:update', onUpdate);
      socket.on('switch:status', onStatus);

      return () => {
        socket.off('switch:update', onUpdate);
        socket.off('switch:status', onStatus);
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

  const sendCommand = async (switchId, type, action) => {
    setCmdLoading(true);
    try {
      await axios.post('/api/ferrovia/switch', {
        switchId,
        action: type === 'SET' ? action : undefined,
        angle: type === 'ANGLE' ? action : undefined
      });
      toast.success(`Comando enviado: Switch ${switchId} -> ${action}`);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Falha ao enviar comando');
    } finally {
      setCmdLoading(false);
    }
  };

  const emergencyStop = async () => {
    if (!window.confirm('ATENÇÃO: Isso irá resetar TODOS os switches para a posição central. Confirmar?')) return;
    for (let i = 1; i <= 4; i++) {
      await sendCommand(i, 'SET', 'CENTER');
    }
    toast.success('Emergência acionada: todos os switches em posição segura');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-maquete-glow to-maquete-accent bg-clip-text text-transparent">
            Ferrovia
          </h2>
          <p className="text-sm text-gray-500 mt-1">Controle dos desvios e monitoramento da linha</p>
        </div>
        <button
          onClick={emergencyStop}
          className="flex items-center gap-2 px-5 py-2.5 bg-maquete-danger hover:bg-red-600 rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-maquete-danger/30 hover:scale-105 active:scale-95"
          style={{ boxShadow: '0 4px 20px rgba(255,69,96,0.2)' }}
        >
          <AlertOctagon size={16} />
          <span>EMERGÊNCIA</span>
        </button>
      </div>

      <RailwayMap switches={switches} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-maquete-card/60 border border-maquete-border rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-maquete-surface rounded-xl" />
                <div>
                  <div className="w-20 h-4 bg-maquete-surface rounded mb-1" />
                  <div className="w-14 h-3 bg-maquete-surface rounded" />
                </div>
              </div>
              <div className="h-2 bg-maquete-surface rounded-full mb-4" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-10 bg-maquete-surface rounded-lg" />
                <div className="h-10 bg-maquete-surface rounded-lg" />
                <div className="h-10 bg-maquete-surface rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : switches.length === 0 ? (
        <div className="bg-maquete-card/60 border border-maquete-border rounded-xl p-12 text-center backdrop-blur-sm">
          <Train size={48} className="mx-auto mb-4 text-gray-600 opacity-50" />
          <p className="text-gray-400">Nenhum switch encontrado</p>
          <p className="text-xs text-gray-600 mt-1">Verifique a conexão com o backend</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </div>
  );
}
