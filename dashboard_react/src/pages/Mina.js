import React, { useState, useEffect } from 'react';
import { Truck, Battery, Package, Navigation, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

const TruckMarker = ({ truck }) => (
  <div
    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
    style={{
      left: `${((truck.current_x + 50) / 100) * 100}%`,
      top: `${((truck.current_y + 50) / 100) * 100}%`
    }}
  >
    <div className="relative group">
      <div className="relative">
        <Truck size={28} className="text-maquete-warning drop-shadow-lg" />
        {truck.status === 'active' && (
          <div className="absolute -inset-2 rounded-full border border-maquete-warning/30 animate-ping opacity-30" />
        )}
      </div>
      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-maquete-surface/95 backdrop-blur-sm border border-maquete-border rounded-xl px-3 py-2 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 scale-95 group-hover:scale-100">
        <p className="text-xs font-bold text-white">{truck.name}</p>
        <p className="text-[10px] text-gray-400">{truck.current_load}kg | {truck.battery_level}%</p>
      </div>
    </div>
  </div>
);

const DPadButton = ({ icon: Icon, direction, onCommand, disabled }) => (
  <button
    onClick={() => onCommand(direction)}
    disabled={disabled}
    className="w-11 h-11 flex items-center justify-center bg-maquete-card/80 border border-maquete-border rounded-xl hover:bg-maquete-accent/15 hover:border-maquete-accent/40 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(61,158,255,0.15)] active:scale-95"
  >
    <Icon size={16} className="text-gray-400 group-hover:text-maquete-accent" />
  </button>
);

const TruckCard = ({ truck, onCommand }) => {
  const [cmdLoading, setCmdLoading] = useState(false);

  const sendCmd = async (action) => {
    setCmdLoading(true);
    try {
      await axios.post(`/api/trucks/${truck.id}/command`, { action });
      toast.success(`${truck.name}: ${action}`);
    } catch (e) {
      toast.error('Falha ao enviar comando');
    } finally {
      setCmdLoading(false);
    }
  };

  const getBatteryColor = (level) => {
    if (level > 50) return 'from-maquete-glow to-green-400';
    if (level > 20) return 'from-maquete-warning to-yellow-400';
    return 'from-maquete-danger to-red-400';
  };

  return (
    <div className="bg-maquete-card/80 backdrop-blur-sm border border-maquete-border rounded-xl p-5 transition-all duration-300 hover:border-maquete-border/60 hover:shadow-lg group"
      style={{
        transform: 'perspective(600px) rotateX(1deg)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center ${truck.status === 'active' ? 'bg-maquete-warning' : 'bg-gray-600'}`}
            style={{ boxShadow: truck.status === 'active' ? '0 0 20px rgba(255,184,0,0.3)' : 'none' }}
          >
            <Truck size={18} className="text-white" />
            {truck.status === 'active' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-maquete-card animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">{truck.name}</h3>
            <p className="text-xs text-gray-500 font-mono">{truck.id}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          truck.status === 'active' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-gray-500/15 text-gray-400 border border-gray-500/20'
        }`}>
          {truck.status}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3">
          <Navigation size={14} className="text-maquete-accent shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Posição</span>
              <span className="font-mono text-white">X:{truck.current_x?.toFixed(0)} Y:{truck.current_y?.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Package size={14} className="text-maquete-purple shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500">Carga</span>
              <span className="text-white font-medium">{truck.current_load}/{truck.max_load}kg</span>
            </div>
            <div className="h-2 bg-maquete-surface rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-maquete-purple to-maquete-accent rounded-full transition-all duration-500"
                style={{ width: `${(truck.current_load / truck.max_load) * 100}%`, boxShadow: '0 0 10px rgba(168,85,247,0.3)' }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Battery size={14} className="text-maquete-glow shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500">Bateria</span>
              <span className="text-white font-medium">{truck.battery_level}%</span>
            </div>
            <div className="h-2 bg-maquete-surface rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${getBatteryColor(truck.battery_level)} rounded-full transition-all duration-500`}
                style={{ width: `${truck.battery_level}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* D-Pad Controls */}
      <div className="border-t border-maquete-border pt-4">
        <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">Controles</p>
        <div className="flex items-center justify-center gap-2">
          <div className="grid grid-cols-3 gap-1.5">
            <div />
            <DPadButton icon={ArrowUp} direction="F" onCommand={sendCmd} disabled={cmdLoading} />
            <div />
            <DPadButton icon={ArrowLeft} direction="L" onCommand={sendCmd} disabled={cmdLoading} />
            <DPadButton icon={RotateCcw} direction="S" onCommand={sendCmd} disabled={cmdLoading} />
            <DPadButton icon={ArrowRight} direction="R" onCommand={sendCmd} disabled={cmdLoading} />
            <div />
            <DPadButton icon={ArrowDown} direction="B" onCommand={sendCmd} disabled={cmdLoading} />
            <div />
          </div>
          <div className="ml-3 pl-3 border-l border-maquete-border">
            <button
              onClick={() => sendCmd('D')}
              disabled={cmdLoading}
              className="w-11 h-11 flex items-center justify-center bg-maquete-purple/15 border border-maquete-purple/30 rounded-xl hover:bg-maquete-purple/25 transition-all duration-200 disabled:opacity-30 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] active:scale-95"
              title="Descarregar"
            >
              <Package size={16} className="text-maquete-purple" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Mina() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchTrucks();

    if (socket) {
      const onTelemetry = (data) => {
        setTrucks(prev => prev.map(t =>
          t.id === data.truckId
            ? { ...t, current_x: data.x, current_y: data.y, current_load: data.load, battery_level: data.battery }
            : t
        ));
      };

      socket.on('truck:telemetry', onTelemetry);
      return () => socket.off('truck:telemetry', onTelemetry);
    }
  }, [socket]);

  const fetchTrucks = async () => {
    try {
      const res = await axios.get('/api/trucks');
      setTrucks(res.data);
    } catch (e) {
      toast.error('Erro ao buscar caminhões');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-maquete-warning to-yellow-300 bg-clip-text text-transparent">
          Mina
        </h2>
        <p className="text-sm text-gray-500 mt-1">Monitoramento e controle dos caminhões basculantes</p>
      </div>

      {/* Map */}
      <div className="bg-maquete-card/60 backdrop-blur-sm border border-maquete-border rounded-xl overflow-hidden"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
      >
        <div className="px-6 py-4 border-b border-maquete-border">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Navigation size={14} className="text-maquete-warning" />
            Mapa da Área
          </h3>
        </div>
        <div className="relative h-80 bg-maquete-dark p-4">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(#4A5568 1px, transparent 1px), linear-gradient(90deg, #4A5568 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
          {trucks.map(truck => (
            <TruckMarker key={truck.id} truck={truck} />
          ))}
          {trucks.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Truck size={32} className="mx-auto mb-2 text-gray-600 opacity-40" />
                <p className="text-xs text-gray-500">Nenhum caminhão no mapa</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-maquete-surface/90 backdrop-blur-sm border border-maquete-border rounded-xl px-3 py-2">
            <div className="flex items-center gap-2 text-xs">
              <Truck size={14} className="text-maquete-warning" />
              <span className="text-gray-400">Caminhão Basculante</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-maquete-card/60 border border-maquete-border rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-maquete-surface rounded-xl" />
                <div className="flex-1">
                  <div className="w-24 h-4 bg-maquete-surface rounded mb-1" />
                  <div className="w-16 h-3 bg-maquete-surface rounded" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-maquete-surface rounded" />
                <div className="h-3 bg-maquete-surface rounded" />
                <div className="h-3 bg-maquete-surface rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : trucks.length === 0 ? (
        <div className="bg-maquete-card/60 border border-maquete-border rounded-xl p-12 text-center backdrop-blur-sm">
          <Truck size={48} className="mx-auto mb-4 text-gray-600 opacity-50" />
          <p className="text-gray-400">Nenhum caminhão encontrado</p>
          <p className="text-xs text-gray-600 mt-1">Verifique a conexão com o backend</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trucks.map(truck => (
            <TruckCard key={truck.id} truck={truck} />
          ))}
        </div>
      )}
    </div>
  );
}
