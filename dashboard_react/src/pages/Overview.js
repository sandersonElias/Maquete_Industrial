import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Train, Truck, Ship, Plane, FlaskConical, AlertTriangle, Activity,
  Wifi, WifiOff, Battery, MapPin, Zap, TrendingUp, Clock, Thermometer
} from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

const SWITCH_NAMES = { 1: 'Norte', 2: 'Leste', 3: 'Sul' };

const ModuleCard = ({ title, icon: Icon, count, status, items, onClick, color, subtitle }) => (
  <div
    onClick={onClick}
    className="cursor-pointer group bg-surface border border-border rounded-xl p-5 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-200"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={22} className="text-white" />
      </div>
      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
        status === 'ok' ? 'bg-success/10 text-success' :
        status === 'warning' ? 'bg-warning/10 text-warning' :
        'bg-danger/10 text-danger'
      }`}>
        {status === 'ok' ? 'Online' : status === 'warning' ? 'Atencao' : 'Offline'}
      </span>
    </div>
    <h3 className="text-sm font-semibold text-text mb-1">{title}</h3>
    <p className="text-2xl font-bold text-text mb-1">{count}</p>
    {subtitle && <p className="text-xs text-muted mb-3">{subtitle}</p>}
    {items && items.length > 0 && (
      <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
        {items.slice(0, 3).map((item, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-muted">{item.label}</span>
            </div>
            {item.value && <span className="text-text font-medium">{item.value}</span>}
          </div>
        ))}
        {items.length > 3 && (
          <p className="text-[10px] text-muted">+{items.length - 3} mais</p>
        )}
      </div>
    )}
  </div>
);

const QuickStat = ({ label, value, icon: Icon, color, trend }) => (
  <div className="bg-surface border border-border rounded-xl p-4 hover:border-border/80 transition-colors">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-muted uppercase tracking-wider">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-text">{value}</p>
          {trend && (
            <span className={`text-[10px] font-medium ${trend > 0 ? 'text-success' : 'text-danger'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default function Overview() {
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [switches, setSwitches] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [ships, setShips] = useState([]);
  const [airplanes, setAirplanes] = useState([]);
  const [chemistry, setChemistry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const [swRes, trRes, shRes, plRes, chRes] = await Promise.all([
        axios.get('/api/ferrovia/status').catch(() => ({ data: [] })),
        axios.get('/api/trucks').catch(() => ({ data: [] })),
        axios.get('/api/port/ships').catch(() => ({ data: [] })),
        axios.get('/api/airport/airplanes').catch(() => ({ data: [] })),
        axios.get('/api/chemistry/equipment').catch(() => ({ data: [] })),
      ]);
      setSwitches(swRes.data);
      setTrucks(trRes.data);
      setShips(shRes.data);
      setAirplanes(plRes.data);
      setChemistry(chRes.data);
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
    value: `${sw.current_angle}°`,
    color: sw.current_state === 'CENTER' ? 'bg-success' : sw.current_state === 'LEFT' ? 'bg-accent' : 'bg-[#A855F7]',
  }));

  const truckItems = trucks.map(t => ({
    label: t.name,
    value: t.status === 'active' ? 'Ativo' : 'Inativo',
    color: t.status === 'active' ? 'bg-success' : 'bg-muted',
  }));

  const chemItems = chemistry.slice(0, 3).map(eq => ({
    label: eq.name,
    value: eq.temperature ? `${eq.temperature}°` : 'N/A',
    color: eq.status === 'online' ? 'bg-[#06B6D4]' : eq.status === 'warning' ? 'bg-warning' : 'bg-danger',
  }));

  const totalOnline = switches.length + trucks.filter(t => t.status === 'active').length + ships.length + airplanes.length + chemistry.filter(e => e.status === 'online').length;
  const totalWarnings = chemistry.filter(e => e.status === 'warning').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header com relogio */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Visao Geral</h2>
          <p className="text-sm text-muted mt-1">Monitoramento em tempo real da maquete industrial</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-muted">
            <Clock size={14} />
            <span className="text-sm font-mono">{currentTime.toLocaleTimeString('pt-BR')}</span>
          </div>
          <div className="text-right bg-surface border border-border rounded-xl px-4 py-2">
            <p className="text-2xl font-bold text-accent">{totalOnline}</p>
            <p className="text-[10px] text-muted uppercase tracking-wider">dispositivos</p>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-4">
        <div className={`flex-1 flex items-center gap-3 p-3 rounded-xl border ${
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
          {totalWarnings > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-warning/10 rounded-lg">
              <AlertTriangle size={12} className="text-warning" />
              <span className="text-xs text-warning font-medium">{totalWarnings} alerta(s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Module Cards - Grid responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-card rounded-xl" />
                <div className="w-16 h-5 bg-card rounded-full" />
              </div>
              <div className="w-24 h-4 bg-card rounded mb-2" />
              <div className="w-16 h-8 bg-card rounded" />
            </div>
          ))
        ) : (
          <>
            <ModuleCard
              title="Ferrovia"
              icon={Train}
              count={switches.length}
              subtitle="switches"
              status="ok"
              items={ferroviaItems}
              onClick={() => navigate('/ferrovia')}
              color="bg-accent"
            />
            <ModuleCard
              title="Mina"
              icon={Truck}
              count={trucks.length}
              subtitle="caminhoes"
              status={trucks.some(t => t.status === 'active') ? 'ok' : 'offline'}
              items={truckItems}
              onClick={() => navigate('/mina')}
              color="bg-warning"
            />
            <ModuleCard
              title="Porto"
              icon={Ship}
              count={ships.length}
              subtitle="navios"
              status="ok"
              onClick={() => navigate('/porto')}
              color="bg-[#A855F7]"
            />
            <ModuleCard
              title="Aeroporto"
              icon={Plane}
              count={airplanes.length}
              subtitle="aeronaves"
              status="ok"
              onClick={() => navigate('/aeroporto')}
              color="bg-success"
            />
            <ModuleCard
              title="Quimica"
              icon={FlaskConical}
              count={chemistry.length}
              subtitle="equipamentos"
              status={chemistry.some(e => e.status === 'warning') ? 'warning' : 'ok'}
              items={chemItems}
              onClick={() => navigate('/quimica')}
              color="bg-[#06B6D4]"
            />
          </>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickStat
          label="Switches Ativos"
          value={switches.filter(s => s.current_state !== 'TRANSITION').length}
          icon={Train}
          color="bg-accent"
        />
        <QuickStat
          label="Caminhoes"
          value={trucks.filter(t => t.status === 'active').length}
          icon={Truck}
          color="bg-warning"
        />
        <QuickStat
          label="Navios"
          value={ships.length}
          icon={Ship}
          color="bg-[#A855F7]"
        />
        <QuickStat
          label="Equipamentos"
          value={chemistry.filter(e => e.status === 'online').length}
          icon={FlaskConical}
          color="bg-[#06B6D4]"
        />
      </div>

      {/* Bottom Section - Alerts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alerts */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
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
          ) : totalWarnings > 0 ? (
            <div className="space-y-2">
              {chemistry.filter(e => e.status === 'warning').map(eq => (
                <div key={eq.id} className="flex items-center gap-3 p-3 bg-warning/5 rounded-lg border border-warning/10">
                  <AlertTriangle size={14} className="text-warning" />
                  <div className="flex-1">
                    <p className="text-sm text-text">{eq.name}</p>
                    <p className="text-xs text-muted">Requer atencao</p>
                  </div>
                  <span className="text-[10px] text-muted">Quimica</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                <Activity size={20} className="text-success" />
              </div>
              <p className="text-sm text-muted">Todos os sistemas operacionais</p>
              <p className="text-xs text-muted mt-1">Nenhum alerta ativo</p>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Activity size={14} className="text-accent" />
            Atividade Recente
          </h3>
          <div className="space-y-3">
            {switches.slice(0, 3).map(sw => (
              <div key={sw.switch_id} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Train size={14} className="text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-text">Switch {sw.switch_id} - {SWITCH_NAMES[sw.switch_id]}</p>
                  <p className="text-xs text-muted">{sw.current_state} - {sw.current_angle}°</p>
                </div>
                <span className="text-xs text-muted">Ativo</span>
              </div>
            ))}
            {chemistry.slice(0, 2).map(eq => (
              <div key={eq.id} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center">
                  <FlaskConical size={14} className="text-[#06B6D4]" />
                </div>
                <div className="flex-1">
                  <p className="text-text">{eq.name}</p>
                  <p className="text-xs text-muted">{eq.temperature || 'N/A'} - {eq.status}</p>
                </div>
                <span className="text-xs text-muted">Quimica</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
