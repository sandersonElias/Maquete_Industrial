import React, { useState, useEffect } from 'react';
import { Truck, Battery, Package, Navigation, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

const DPadButton = ({ icon: Icon, direction, onCommand, disabled }) => (
  <button
    onClick={() => onCommand(direction)}
    disabled={disabled}
    className="w-10 h-10 flex items-center justify-center bg-card border border-border hover:border-accent/40 hover:bg-accent/5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
  >
    <Icon size={14} className="text-muted" />
  </button>
);

const TruckCard = ({ truck }) => {
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
    if (level > 50) return 'bg-success';
    if (level > 20) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${truck.status === 'active' ? 'bg-warning/10' : 'bg-muted/10'}`}>
            <Truck size={16} className={truck.status === 'active' ? 'text-warning' : 'text-muted'} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text">{truck.name}</h3>
            <p className="text-xs text-muted font-mono">{truck.id}</p>
          </div>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
          truck.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'
        }`}>
          {truck.status}
        </span>
      </div>

      <div className="space-y-2.5 mb-4">
        <div className="flex items-center gap-2 text-xs">
          <Navigation size={12} className="text-accent" />
          <span className="text-muted">Posicao:</span>
          <span className="font-mono text-text ml-auto">X:{truck.current_x?.toFixed(0)} Y:{truck.current_y?.toFixed(0)}</span>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted">Carga</span>
            <span className="text-text">{truck.current_load}/{truck.max_load}kg</span>
          </div>
          <div className="h-1.5 bg-card rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${(truck.current_load / truck.max_load) * 100}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted">Bateria</span>
            <span className="text-text">{truck.battery_level}%</span>
          </div>
          <div className="h-1.5 bg-card rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${getBatteryColor(truck.battery_level)}`}
              style={{ width: `${truck.battery_level}%` }} />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Controles</p>
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-3 gap-1">
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
          <div className="ml-2 pl-2 border-l border-border">
            <button
              onClick={() => sendCmd('D')}
              disabled={cmdLoading}
              className="w-10 h-10 flex items-center justify-center bg-[#A855F7]/10 border border-[#A855F7]/20 rounded-lg hover:bg-[#A855F7]/20 transition-colors disabled:opacity-30"
              title="Descarregar"
            >
              <Package size={14} className="text-[#A855F7]" />
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
      toast.error('Erro ao buscar caminhoes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-text">Mina</h2>
        <p className="text-sm text-muted mt-0.5">Monitoramento e controle dos caminhoes basculantes</p>
      </div>

      {/* Map */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wider flex items-center gap-2">
            <Navigation size={12} className="text-warning" />
            Mapa da Area
          </h3>
        </div>
        <div className="relative h-64 bg-bg">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(#4A5568 1px, transparent 1px), linear-gradient(90deg, #4A5568 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
          {trucks.map(truck => (
            <div
              key={truck.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
              style={{
                left: `${((truck.current_x + 50) / 100) * 100}%`,
                top: `${((truck.current_y + 50) / 100) * 100}%`
              }}
            >
              <Truck size={20} className="text-warning" />
            </div>
          ))}
          {trucks.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-muted">Nenhum caminhao no mapa</p>
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-card rounded-lg" />
                <div className="flex-1">
                  <div className="w-24 h-3 bg-card rounded mb-1" />
                  <div className="w-16 h-2 bg-card rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-card rounded" />
                <div className="h-3 bg-card rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : trucks.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-10 text-center">
          <Truck size={36} className="mx-auto mb-3 text-muted opacity-40" />
          <p className="text-muted">Nenhum caminhao encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {trucks.map(truck => (
            <TruckCard key={truck.id} truck={truck} />
          ))}
        </div>
      )}
    </div>
  );
}
