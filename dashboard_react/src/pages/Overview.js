import React, { useEffect, useState } from 'react';
import { Train, Truck, Ship, Plane, AlertTriangle, Activity } from 'lucide-react';
import axios from 'axios';

const StatusCard = ({ title, icon: Icon, color, status, count, alerts }) => (
  <div className="bg-maquete-surface border border-maquete-border rounded-xl p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
        status === 'online' ? 'bg-green-500/20 text-green-400' :
        status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
        'bg-red-500/20 text-red-400'
      }`}>
        {status.toUpperCase()}
      </span>
    </div>
    <h3 className="text-lg font-semibold mb-1">{title}</h3>
    <p className="text-3xl font-bold text-white mb-2">{count}</p>
    {alerts > 0 && (
      <div className="flex items-center gap-2 text-maquete-warning text-sm">
        <AlertTriangle size={14} />
        <span>{alerts} alerta(s)</span>
      </div>
    )}
  </div>
);

export default function Overview() {
  const [stats, setStats] = useState({
    switches: { online: 4, alerts: 0 },
    trucks: { online: 1, alerts: 0 },
    ships: { online: 1, alerts: 0 },
    airplanes: { online: 1, alerts: 0 },
  });

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const [switches, trucks, ships, planes] = await Promise.all([
        axios.get('/api/ferrovia/status'),
        axios.get('/api/trucks'),
        axios.get('/api/port/ships'),
        axios.get('/api/airport/airplanes'),
      ]);

      setStats({
        switches: { online: switches.data.length, alerts: 0 },
        trucks: { online: trucks.data.filter(t => t.status === 'active').length, alerts: 0 },
        ships: { online: ships.data.length, alerts: 0 },
        airplanes: { online: planes.data.length, alerts: 0 },
      });
    } catch (e) {
      console.error('Erro ao buscar status:', e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Visão Geral</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Activity size={16} className="text-maquete-glow animate-pulse" />
          <span>Sistema operacional</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard
          title="Ferrovia"
          icon={Train}
          color="bg-maquete-accent"
          status="online"
          count={`${stats.switches.online}/4 switches`}
          alerts={stats.switches.alerts}
        />
        <StatusCard
          title="Mina"
          icon={Truck}
          color="bg-maquete-warning"
          status="online"
          count={`${stats.trucks.online} caminhão(ões)`}
          alerts={stats.trucks.alerts}
        />
        <StatusCard
          title="Porto"
          icon={Ship}
          color="bg-maquete-purple"
          status="online"
          count={`${stats.ships.online} navio(s)`}
          alerts={stats.ships.alerts}
        />
        <StatusCard
          title="Aeroporto"
          icon={Plane}
          color="bg-green-500"
          status="online"
          count={`${stats.airplanes.online} aeronave(s)`}
          alerts={stats.airplanes.alerts}
        />
      </div>

      {/* Painel de Alertas Recentes */}
      <div className="bg-maquete-surface border border-maquete-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Alertas Recentes</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 bg-maquete-card rounded-lg">
            <AlertTriangle size={20} className="text-maquete-warning" />
            <div className="flex-1">
              <p className="font-medium">Gateway Bluetooth reconectando</p>
              <p className="text-sm text-gray-500">Tentativa de reconexão automática em andamento</p>
            </div>
            <span className="text-xs text-gray-500">Agora</span>
          </div>
        </div>
      </div>
    </div>
  );
}
