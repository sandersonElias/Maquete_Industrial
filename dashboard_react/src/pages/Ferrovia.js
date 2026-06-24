import React, { useState, useEffect } from 'react';
import { Train, ArrowLeft, ArrowRight, RotateCcw, AlertOctagon } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

const SwitchControl = ({ switchData, onCommand }) => {
  const getStateColor = (state) => {
    switch (state) {
      case 'LEFT': return 'bg-maquete-accent';
      case 'RIGHT': return 'bg-maquete-purple';
      case 'CENTER': return 'bg-maquete-glow';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="bg-maquete-card border border-maquete-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStateColor(switchData.current_state)}`}>
            <Train size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold">Switch {switchData.switch_id}</h3>
            <p className="text-sm text-gray-500">{switchData.name}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStateColor(switchData.current_state)} bg-opacity-20 text-white`}>
          {switchData.current_state}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Ângulo</span>
          <span>{switchData.current_angle}°</span>
        </div>
        <div className="h-2 bg-maquete-surface rounded-full overflow-hidden">
          <div 
            className="h-full bg-maquete-accent transition-all duration-500"
            style={{ width: `${(switchData.current_angle / 180) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onCommand(switchData.switch_id, 'SET', 'LEFT')}
          className="flex items-center justify-center gap-2 py-2 bg-maquete-surface hover:bg-maquete-accent/20 border border-maquete-border rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">Esquerda</span>
        </button>
        <button
          onClick={() => onCommand(switchData.switch_id, 'SET', 'CENTER')}
          className="flex items-center justify-center gap-2 py-2 bg-maquete-surface hover:bg-maquete-glow/20 border border-maquete-border rounded-lg transition-colors"
        >
          <RotateCcw size={16} />
          <span className="text-sm">Centro</span>
        </button>
        <button
          onClick={() => onCommand(switchData.switch_id, 'SET', 'RIGHT')}
          className="flex items-center justify-center gap-2 py-2 bg-maquete-surface hover:bg-maquete-purple/20 border border-maquete-border rounded-lg transition-colors"
        >
          <ArrowRight size={16} />
          <span className="text-sm">Direita</span>
        </button>
      </div>
    </div>
  );
};

export default function Ferrovia() {
  const [switches, setSwitches] = useState([]);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    fetchSwitches();

    if (socket) {
      socket.on('switch:update', (data) => {
        setSwitches(prev => prev.map(sw => 
          sw.switch_id === data.switchId 
            ? { ...sw, current_state: data.state }
            : sw
        ));
      });

      socket.on('switch:status', (data) => {
        setSwitches(prev => prev.map(sw => 
          sw.switch_id === data.switchId 
            ? { ...sw, current_angle: data.angle, current_state: data.state }
            : sw
        ));
      });
    }
  }, [socket]);

  const fetchSwitches = async () => {
    try {
      const res = await axios.get('/api/ferrovia/status');
      setSwitches(res.data);
    } catch (e) {
      toast.error('Erro ao carregar switches');
    }
  };

  const sendCommand = async (switchId, type, action) => {
    setLoading(true);
    try {
      await axios.post('/api/ferrovia/switch', {
        switchId,
        action: type === 'SET' ? action : undefined,
        angle: type === 'ANGLE' ? action : undefined
      });
      toast.success(`Comando enviado: Switch ${switchId} -> ${action}`);
    } catch (e) {
      toast.error('Falha ao enviar comando');
    } finally {
      setLoading(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ferrovia</h2>
          <p className="text-gray-500">Controle dos desvios e monitoramento da linha</p>
        </div>
        <button
          onClick={emergencyStop}
          className="flex items-center gap-2 px-4 py-2 bg-maquete-danger hover:bg-red-600 rounded-lg font-semibold transition-colors"
        >
          <AlertOctagon size={18} />
          <span>EMERGÊNCIA</span>
        </button>
      </div>

      {/* Mapa Esquemático da Ferrovia */}
      <div className="bg-maquete-surface border border-maquete-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Mapa da Linha</h3>
        <div className="relative h-64 bg-maquete-card rounded-lg border border-maquete-border overflow-hidden">
          {/* Representação simplificada da ferrovia */}
          <svg viewBox="0 0 800 200" className="w-full h-full">
            {/* Trilho principal */}
            <line x1="50" y1="100" x2="750" y2="100" stroke="#4A5568" strokeWidth="4" />

            {/* Switch 1 - Norte */}
            <circle cx="200" cy="100" r="8" fill={switches[0]?.current_state === 'LEFT' ? '#3D9EFF' : switches[0]?.current_state === 'RIGHT' ? '#A855F7' : '#00FFB2'} />
            <text x="200" y="80" textAnchor="middle" fill="#9CA3AF" fontSize="12">SW1</text>

            {/* Switch 2 - Leste */}
            <circle cx="400" cy="100" r="8" fill={switches[1]?.current_state === 'LEFT' ? '#3D9EFF' : switches[1]?.current_state === 'RIGHT' ? '#A855F7' : '#00FFB2'} />
            <text x="400" y="80" textAnchor="middle" fill="#9CA3AF" fontSize="12">SW2</text>

            {/* Switch 3 - Sul */}
            <circle cx="600" cy="100" r="8" fill={switches[2]?.current_state === 'LEFT' ? '#3D9EFF' : switches[2]?.current_state === 'RIGHT' ? '#A855F7' : '#00FFB2'} />
            <text x="600" y="80" textAnchor="middle" fill="#9CA3AF" fontSize="12">SW3</text>

            {/* Switch 4 - Oeste */}
            <circle cx="750" cy="100" r="8" fill={switches[3]?.current_state === 'LEFT' ? '#3D9EFF' : switches[3]?.current_state === 'RIGHT' ? '#A855F7' : '#00FFB2'} />
            <text x="750" y="80" textAnchor="middle" fill="#9CA3AF" fontSize="12">SW4</text>

            {/* Locomotiva (posição simulada) */}
            <rect x="350" y="90" width="30" height="20" rx="4" fill="#FFB800" />
          </svg>
        </div>
      </div>

      {/* Controles dos Switches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {switches.map(sw => (
          <SwitchControl 
            key={sw.switch_id} 
            switchData={sw} 
            onCommand={sendCommand}
          />
        ))}
      </div>
    </div>
  );
}
