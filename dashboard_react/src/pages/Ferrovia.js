import React, { useState, useEffect } from 'react';
import { Train, ArrowLeft, ArrowRight, RotateCcw, AlertOctagon, Loader, Box } from 'lucide-react';
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

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${getStateBg(switchData.current_state)} ${switchData.is_moving ? 'animate-pulse' : ''}`}>
            <Train size={16} className={getStateColor(switchData.current_state)} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text">Switch {switchData.switch_id}</h3>
            <p className="text-xs text-muted">{switchData.name}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStateColor(switchData.current_state)} ${getStateBg(switchData.current_state)}`}>
          {switchData.current_state || 'N/A'}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>Angulo</span>
          <span className="font-mono text-text">{switchData.current_angle ?? '--'}°</span>
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

const RailwayMap = ({ switches }) => {
  const getSwitchColor = (sw) => {
    if (!sw) return '#4A5568';
    if (sw.is_moving) return '#F59E0B';
    switch (sw.current_state) {
      case 'LEFT': return '#3B82F6';
      case 'RIGHT': return '#A855F7';
      case 'CENTER': return '#22C55E';
      default: return '#4A5568';
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider flex items-center gap-2">
          <Box size={12} className="text-accent" />
          Mapa da Linha
        </h3>
      </div>

      <div className="p-4">
        <svg viewBox="0 0 800 300" className="w-full" style={{ height: '240px' }}>
          {/* Grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2A2D3A" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="800" height="300" fill="url(#grid)" />

          {/* Trilhos */}
          <path d="M 40,70 L 130,70" stroke="#2A2D3A" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M 180,70 L 380,70" stroke="#2A2D3A" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M 500,70 L 650,70" stroke="#2A2D3A" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M 650,70 L 710,70 L 710,230 L 730,230" stroke="#2A2D3A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M 40,230 L 200,230" stroke="#2A2D3A" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M 250,230 L 480,230" stroke="#2A2D3A" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M 530,230 L 710,230" stroke="#2A2D3A" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M 40,70 L 40,230" stroke="#2A2D3A" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M 175,70 L 450,170" stroke="#2A2D3A" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 450,170 L 710,170" stroke="#2A2D3A" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 710,170 L 710,230" stroke="#2A2D3A" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 245,230 L 500,280" stroke="#2A2D3A" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 500,280 L 710,280 L 710,230" stroke="#2A2D3A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />

          {/* SW1 */}
          <circle cx="155" cy="70" r="7" fill={getSwitchColor(switches[0])} stroke="#0F1117" strokeWidth="2" />
          <text x="155" y="50" textAnchor="middle" fill="#8B8FA3" fontSize="10" fontWeight="500">SW1</text>

          {/* SW2 */}
          <circle cx="225" cy="230" r="7" fill={getSwitchColor(switches[1])} stroke="#0F1117" strokeWidth="2" />
          <text x="225" y="255" textAnchor="middle" fill="#8B8FA3" fontSize="10" fontWeight="500">SW2</text>

          {/* SW3 */}
          <circle cx="505" cy="230" r="7" fill={getSwitchColor(switches[2])} stroke="#0F1117" strokeWidth="2" />
          <text x="505" y="255" textAnchor="middle" fill="#8B8FA3" fontSize="10" fontWeight="500">SW3</text>

          {/* Reversor */}
          <rect x="405" y="55" width="70" height="30" rx="4" fill={getSwitchColor(switches[3])} stroke="#0F1117" strokeWidth="2" />
          <text x="440" y="45" textAnchor="middle" fill="#8B8FA3" fontSize="9" fontWeight="500">REVERSOR</text>
          <text x="440" y="75" textAnchor="middle" fill="white" fontSize="9">SW4</text>

          {/* Locomotiva */}
          <g>
            <animateTransform attributeName="transform" type="translate" values="0,0;600,0;600,160;0,160;0,0" dur="12s" repeatCount="indefinite" />
            <rect x="80" y="56" width="40" height="28" rx="4" fill="#F59E0B" opacity="0.9" />
            <circle cx="126" cy="70" r="3" fill="#F59E0B" opacity="0.6">
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </g>

          <text x="40" y="160" fill="#4A5568" fontSize="8" textAnchor="middle">ENTRADA</text>
          <text x="730" y="160" fill="#4A5568" fontSize="8" textAnchor="middle">SAIDA</text>
        </svg>
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
      toast.success(`Switch ${switchId} -> ${action}`);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Falha ao enviar comando');
    } finally {
      setCmdLoading(false);
    }
  };

  const emergencyStop = async () => {
    if (!window.confirm('Resetar TODOS os switches para CENTER?')) return;
    for (let i = 1; i <= 4; i++) {
      await sendCommand(i, 'SET', 'CENTER');
    }
    toast.success('Emergencia: todos em CENTER');
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
          <span>Emergencia</span>
        </button>
      </div>

      <RailwayMap switches={switches} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
