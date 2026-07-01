import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Train, Truck, Ship, Plane, AlertTriangle, Activity, Wifi, WifiOff } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

const StatusCard = ({ title, icon: Icon, color, status, count, alerts, onClick }) => (
  <div
    onClick={onClick}
    className="bg-maquete-surface border border-maquete-border rounded-xl p-6 hover:border-maquete-border hover:shadow-lg hover:shadow-maquete-glow/5 transition-all duration-300 cursor-pointer group"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={24} className="text-white" />
      </div>
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        status === 'online' ? 'bg-green-500/15 text-green-400 border border-green-500/20' :
        status === 'warning' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' :
        'bg-red-500/15 text-red-400 border border-red-500/20'
      }`}>
        {status}
      </span>
    </div>
    <h3 className="text-sm font-medium text-gray-400 mb-1">{title}</h3>
    <p className="text-2xl font-bold text-white">{count}</p>
    {alerts > 0 && (
      <div className="flex items-center gap-1.5 text-maquete-warning text-xs mt-2">
        <AlertTriangle size={12} />
        <span>{alerts} alerta(s)</span>
      </div>
    )}
  </div>
);

export default function Overview() {
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    switches: { online: 0, alerts: 0 },
    trucks: { online: 0, alerts: 0 },
    ships: { online: 0, alerts: 0 },
    airplanes: { online: 0, alerts: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const [switches, trucks, ships, planes] = await Promise.all([
        axios.get('/api/ferrovia/status').catch(() => ({ data: [] })),
        axios.get('/api/trucks').catch(() => ({ data: [] })),
        axios.get('/api/port/ships').catch(() => ({ data: [] })),
        axios.get('/api/airport/airplanes').catch(() => ({ data: [] })),
      ]);

      setStats({
        switches: { online: switches.data.length, alerts: 0 },
        trucks: { online: trucks.data.filter(t => t.status === 'active').length, alerts: 0 },
        ships: { online: ships.data.length, alerts: 0 },
        airplanes: { online: planes.data.length, alerts: 0 },
      });
    } catch (e) {
      console.error('Erro ao buscar status:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visão Geral</h2>
          <p className="text-sm text-gray-500 mt-1">Monitoramento em tempo real de todos os módulos</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Activity size={16} className="text-maquete-glow animate-pulse" />
          <span className="text-gray-400">Sistema operacional</span>
        </div>
      </div>

      {/* Gateway Status */}
      <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
        connected
          ? 'bg-green-500/5 border-green-500/20'
          : 'bg-red-500/5 border-red-500/20'
      }`}>
        {connected ? <Wifi size={20} className="text-green-400" /> : <WifiOff size={20} className="text-red-400" />}
        <div className="flex-1">
          <p className={`font-medium ${connected ? 'text-green-400' : 'text-red-400'}`}>
            Gateway Bluetooth {connected ? 'Conectado' : 'Desconectado'}
          </p>
          <p className="text-xs text-gray-500">
            {connected ? 'Todos os dispositivos sincronizados' : 'Tentando reconexão...'}
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-maquete-surface border border-maquete-border rounded-xl p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-maquete-card rounded-lg" />
                <div className="w-16 h-5 bg-maquete-card rounded-full" />
              </div>
              <div className="w-20 h-4 bg-maquete-card rounded mb-2" />
              <div className="w-24 h-8 bg-maquete-card rounded" />
            </div>
          ))
        ) : (
          <>
            <StatusCard
              title="Ferrovia"
              icon={Train}
              color="bg-maquete-accent"
              status="online"
              count={`${stats.switches.online}/4 switches`}
              alerts={stats.switches.alerts}
              onClick={() => navigate('/ferrovia')}
            />
            <StatusCard
              title="Mina"
              icon={Truck}
              color="bg-maquete-warning"
              status="online"
              count={`${stats.trucks.online} caminhão(ões)`}
              alerts={stats.trucks.alerts}
              onClick={() => navigate('/mina')}
            />
            <StatusCard
              title="Porto"
              icon={Ship}
              color="bg-maquete-purple"
              status="online"
              count={`${stats.ships.online} navio(s)`}
              alerts={stats.ships.alerts}
              onClick={() => navigate('/porto')}
            />
            <StatusCard
              title="Aeroporto"
              icon={Plane}
              color="bg-green-500"
              status="online"
              count={`${stats.airplanes.online} aeronave(s)`}
              alerts={stats.airplanes.alerts}
              onClick={() => navigate('/aeroporto')}
            />
          </>
        )}
      </div>

      {/* Alertas Recentes */}
      <div className="bg-maquete-surface border border-maquete-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Alertas Recentes</h3>
        <div className="space-y-3">
          {!connected && (
            <div className="flex items-center gap-4 p-4 bg-maquete-card rounded-lg border border-red-500/10">
              <AlertTriangle size={20} className="text-maquete-danger shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Gateway Bluetooth desconectado</p>
                <p className="text-xs text-gray-500">Tentativa de reconexão automática em andamento</p>
              </div>
              <span className="text-[10px] text-gray-500 shrink-0">Agora</span>
            </div>
          )}
          {connected && (
            <div className="text-center py-6 text-gray-500">
              <Activity size={24} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum alerta ativo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
