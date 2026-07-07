import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Train, Truck, Ship, Plane, AlertTriangle, Activity, Wifi, WifiOff, Battery, MapPin, Zap, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  CENTER: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
  LEFT: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20' },
  RIGHT: { bg: 'bg-[#A855F7]/10', text: 'text-[#A855F7]', border: 'border-[#A855F7]/20' },
  TRANSITION: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
};

const SWITCH_NAMES = { 1: 'Norte', 2: 'Leste', 3: 'Sul', 4: 'Oeste' };

const ModuleCard = ({ title, icon: Icon, count, status, items, onClick, color }) => (
  <div onClick={onClick} className="cursor-pointer bg-surface border border-border rounded-lg p-5 hover:border-accent/30 transition-colors">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded ${
        status === 'ok' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
      }`}>
        {status === 'ok' ? 'Online' : 'Offline'}
      </span>
    </div>
    <h3 className="text-sm font-medium text-muted mb-1">{title}</h3>
    <p className="text-xl font-bold text-text mb-3">{count}</p>
    {items && items.length > 0 && (
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
            <span className="text-muted">{item.label}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="bg-surface border border-border rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon size={14} className="text-accent" />
      <span className="text-[10px] text-muted uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-lg font-bold text-text">{value}</p>
  </div>
);

export default function Overview() {
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [switches, setSwitches] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [ships, setShips] = useState([]);
  const [airplanes, setAirplanes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const [swRes, trRes, shRes, plRes] = await Promise.all([
        axios.get('/api/ferrovia/status').catch(() => ({ data: [] })),
        axios.get('/api/trucks').catch(() => ({ data: [] })),
        axios.get('/api/port/ships').catch(() => ({ data: [] })),
        axios.get('/api/airport/airplanes').catch(() => ({ data: [] })),
      ]);
      setSwitches(swRes.data);
      setTrucks(trRes.data);
      setShips(shRes.data);
      setAirplanes(plRes.data);
    } catch (e) {
      console.error('Erro ao buscar status:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    if (!socket) return;

    const onSwitchUpdate = (data) => {
      setSwitches(prev => prev.map(s =>
        s.switch_id === data.switchId ? { ...s, current_state: data.state } : s
      ));
    };

    const onSwitchStatus = (data) => {
      setSwitches(prev => prev.map(s =>
        s.switch_id === data.switchId
          ? { ...s, current_angle: data.angle, current_state: data.state, is_moving: false }
          : s
      ));
    };

    const onTruckTelemetry = (data) => {
      setTrucks(prev => prev.map(t =>
        t.id === data.truckId
          ? { ...t, current_x: data.x, current_y: data.y, current_load: data.load, battery_level: data.battery }
          : t
      ));
    };

    socket.on('switch:update', onSwitchUpdate);
    socket.on('switch:status', onSwitchStatus);
    socket.on('truck:telemetry', onTruckTelemetry);

    return () => {
      socket.off('switch:update', onSwitchUpdate);
      socket.off('switch:status', onSwitchStatus);
      socket.off('truck:telemetry', onTruckTelemetry);
    };
  }, [socket]);

  const ferroviaItems = switches.map(sw => ({
    label: `SW${sw.switch_id} ${SWITCH_NAMES[sw.switch_id]}`,
    color: sw.current_state === 'CENTER' ? 'bg-success' : sw.current_state === 'LEFT' ? 'bg-accent' : 'bg-[#A855F7]',
  }));

  const truckItems = trucks.map(t => ({
    label: `${t.name} - ${t.status === 'active' ? 'Ativo' : 'Inativo'}`,
    color: t.status === 'active' ? 'bg-success' : 'bg-muted',
  }));

  const totalOnline = switches.length + trucks.filter(t => t.status === 'active').length + ships.length + airplanes.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">Visao Geral</h2>
          <p className="text-sm text-muted mt-0.5">Monitoramento em tempo real</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-accent">{totalOnline}</p>
          <p className="text-xs text-muted">dispositivos online</p>
        </div>
      </div>

      {/* Gateway Status */}
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${
        connected
          ? 'bg-success/5 border-success/20'
          : 'bg-danger/5 border-danger/20'
      }`}>
        {connected ? <Wifi size={16} className="text-success" /> : <WifiOff size={16} className="text-danger" />}
        <div className="flex-1">
          <p className={`text-sm font-medium ${connected ? 'text-success' : 'text-danger'}`}>
            Gateway {connected ? 'Conectado' : 'Desconectado'}
          </p>
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-5 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-card rounded-lg" />
                <div className="w-16 h-4 bg-card rounded" />
              </div>
              <div className="w-20 h-4 bg-card rounded mb-2" />
              <div className="w-12 h-6 bg-card rounded" />
            </div>
          ))
        ) : (
          <>
            <ModuleCard
              title="Ferrovia"
              icon={Train}
              count={`${switches.length} switches`}
              status="ok"
              items={ferroviaItems}
              onClick={() => navigate('/ferrovia')}
              color="bg-accent"
            />
            <ModuleCard
              title="Mina"
              icon={Truck}
              count={`${trucks.length} caminhoes`}
              status={trucks.some(t => t.status === 'active') ? 'ok' : 'offline'}
              items={truckItems}
              onClick={() => navigate('/mina')}
              color="bg-warning"
            />
            <ModuleCard
              title="Porto"
              icon={Ship}
              count={`${ships.length} navios`}
              status="ok"
              onClick={() => navigate('/porto')}
              color="bg-[#A855F7]"
            />
            <ModuleCard
              title="Aeroporto"
              icon={Plane}
              count={`${airplanes.length} aeronaves`}
              status="ok"
              onClick={() => navigate('/aeroporto')}
              color="bg-success"
            />
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Uptime" value="99.9%" icon={TrendingUp} />
        <StatCard label="Latencia" value="<50ms" icon={Zap} />
        <StatCard label="Eventos/h" value="1.2k" icon={Activity} />
        <StatCard label="Alertas" value="0" icon={AlertTriangle} />
      </div>

      {/* Alerts */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium text-text mb-3 flex items-center gap-2">
          <AlertTriangle size={14} className="text-warning" />
          Alertas Recentes
        </h3>
        {!connected ? (
          <div className="flex items-center gap-3 p-3 bg-danger/5 rounded-lg border border-danger/10">
            <AlertTriangle size={16} className="text-danger" />
            <div className="flex-1">
              <p className="text-sm text-text">Gateway desconectado</p>
              <p className="text-xs text-muted">Tentativa de reconexao automatica</p>
            </div>
            <span className="text-[10px] text-muted">Agora</span>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted">Nenhum alerta ativo</p>
          </div>
        )}
      </div>
    </div>
  );
}
