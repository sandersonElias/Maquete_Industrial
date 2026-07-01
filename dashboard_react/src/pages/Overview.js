import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Train, Truck, Ship, Plane, AlertTriangle, Activity, Wifi, WifiOff, Battery, MapPin } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';

const STATE_COLORS = {
  CENTER: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  LEFT: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  RIGHT: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  TRANSITION: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
};

const SWITCH_NAMES = { 1: 'Norte', 2: 'Leste', 3: 'Sul', 4: 'Oeste' };

const FerroviaCard = ({ switches, onClick }) => {
  const stateCounts = switches.reduce((acc, s) => {
    acc[s.current_state] = (acc[s.current_state] || 0) + 1;
    return acc;
  }, {});
  const moving = switches.some(s => s.is_moving);

  return (
    <div
      onClick={onClick}
      className="bg-maquete-surface border border-maquete-border rounded-xl p-6 hover:border-maquete-accent/30 hover:shadow-lg hover:shadow-maquete-accent/5 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-lg bg-maquete-accent group-hover:scale-110 transition-transform">
          <Train size={24} className="text-white" />
        </div>
        <div className="flex items-center gap-2">
          {moving && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 animate-pulse">
              Movendo
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/15 text-green-400 border border-green-500/20">
            {switches.length}/4
          </span>
        </div>
      </div>

      <h3 className="text-sm font-medium text-gray-400 mb-3">Ferrovia</h3>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {switches.map(sw => {
          const colors = STATE_COLORS[sw.current_state] || STATE_COLORS.CENTER;
          return (
            <div key={sw.switch_id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${colors.bg} border ${colors.border}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')} ${sw.is_moving ? 'animate-pulse' : ''}`} />
              <span className={`text-[11px] font-medium ${colors.text}`}>
                SW{sw.switch_id} {SWITCH_NAMES[sw.switch_id]}
              </span>
              <span className={`text-[10px] ml-auto ${colors.text} opacity-70`}>
                {sw.current_state === 'CENTER' ? 'C' : sw.current_state === 'LEFT' ? 'E' : 'D'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 text-[11px] text-gray-500">
        {stateCounts.CENTER > 0 && <span className="text-green-400">{stateCounts.CENTER} centro</span>}
        {stateCounts.LEFT > 0 && <span className="text-blue-400">{stateCounts.LEFT} esquerda</span>}
        {stateCounts.RIGHT > 0 && <span className="text-purple-400">{stateCounts.RIGHT} direita</span>}
      </div>
    </div>
  );
};

const BatteryBar = ({ level }) => {
  const color = level > 50 ? 'bg-green-400' : level > 20 ? 'bg-yellow-400' : 'bg-red-400';
  const textColor = level > 50 ? 'text-green-400' : level > 20 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="flex items-center gap-2">
      <Battery size={12} className={textColor} />
      <div className="flex-1 h-1.5 bg-maquete-dark rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${level}%` }} />
      </div>
      <span className={`text-[10px] font-medium ${textColor}`}>{Math.round(level)}%</span>
    </div>
  );
};

const LoadBar = ({ current, max }) => {
  const pct = max > 0 ? (current / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-maquete-dark rounded-full overflow-hidden">
        <div className="h-full bg-maquete-warning rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-medium text-maquete-warning">{Math.round(current)}/{max}kg</span>
    </div>
  );
};

const TruckCard = ({ trucks, onClick }) => {
  const active = trucks.filter(t => t.status === 'active');

  return (
    <div
      onClick={onClick}
      className="bg-maquete-surface border border-maquete-border rounded-xl p-6 hover:border-maquete-warning/30 hover:shadow-lg hover:shadow-maquete-warning/5 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-lg bg-maquete-warning group-hover:scale-110 transition-transform">
          <Truck size={24} className="text-white" />
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          active.length > 0
            ? 'bg-green-500/15 text-green-400 border border-green-500/20'
            : 'bg-red-500/15 text-red-400 border border-red-500/20'
        }`}>
          {active.length} ativo(s)
        </span>
      </div>

      <h3 className="text-sm font-medium text-gray-400 mb-3">Mina</h3>

      {trucks.length === 0 ? (
        <p className="text-xs text-gray-500">Nenhum caminhão registrado</p>
      ) : (
        <div className="space-y-3">
          {trucks.map(truck => (
            <div key={truck.id} className="bg-maquete-card rounded-lg p-3 border border-maquete-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white">{truck.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  truck.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'
                }`}>
                  {truck.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="space-y-1.5">
                <BatteryBar level={truck.battery_level} />
                <LoadBar current={truck.current_load} max={truck.max_load} />
              </div>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-500">
                <MapPin size={10} />
                <span>X: {Math.round(truck.current_x)} Y: {Math.round(truck.current_y)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SimpleCard = ({ title, icon: Icon, color, status, count, alerts, onClick }) => (
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visao Geral</h2>
          <p className="text-sm text-gray-500 mt-1">Monitoramento em tempo real de todos os modulos</p>
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
            {connected ? 'Todos os dispositivos sincronizados' : 'Tentando reconexao...'}
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
            <FerroviaCard switches={switches} onClick={() => navigate('/ferrovia')} />
            <TruckCard trucks={trucks} onClick={() => navigate('/mina')} />
            <SimpleCard
              title="Porto"
              icon={Ship}
              color="bg-maquete-purple"
              status="online"
              count={`${ships.length} navio(s)`}
              alerts={0}
              onClick={() => navigate('/porto')}
            />
            <SimpleCard
              title="Aeroporto"
              icon={Plane}
              color="bg-green-500"
              status="online"
              count={`${airplanes.length} aeronave(s)`}
              alerts={0}
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
                <p className="text-xs text-gray-500">Tentativa de reconexao automatica em andamento</p>
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
