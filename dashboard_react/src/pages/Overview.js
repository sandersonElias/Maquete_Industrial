import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Train, Truck, Ship, Plane, AlertTriangle, Activity, Wifi, WifiOff, Zap, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';
import Card3D from '../components/Card3D';

const StatusCard = ({ title, icon: Icon, color, colorHex, status, count, alerts, onClick, delay }) => (
  <Card3D glowColor={colorHex} onClick={onClick} className="cursor-pointer">
    <div className="bg-maquete-surface/80 backdrop-blur-sm border border-maquete-border rounded-xl p-6 transition-all duration-300 hover:shadow-xl group"
      style={{
        animationDelay: `${delay}ms`,
        boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className={`p-3.5 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}
          style={{ boxShadow: `0 0 25px ${colorHex}20` }}
        >
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
      <h3 className="text-sm font-medium text-gray-400 mb-1.5">{title}</h3>
      <p className="text-2xl font-bold text-white mb-2">{count}</p>
      {alerts > 0 && (
        <div className="flex items-center gap-1.5 text-maquete-warning text-xs">
          <AlertTriangle size={12} />
          <span>{alerts} alerta(s)</span>
        </div>
      )}
      {/* Bottom accent line */}
      <div className="mt-4 h-0.5 rounded-full bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(to right, ${colorHex}, transparent)` }}
      />
    </div>
  </Card3D>
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

  const totalOnline = stats.switches.online + stats.trucks.online + stats.ships.online + stats.airplanes.online;
  const totalModules = 4;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-maquete-surface/80 to-maquete-card/60 backdrop-blur-sm border border-maquete-border rounded-2xl p-8"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-maquete-glow/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-maquete-accent/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-maquete-glow to-maquete-accent bg-clip-text text-transparent">
                Visão Geral
              </h2>
              <p className="text-sm text-gray-400 mt-2">Monitoramento em tempo real de todos os módulos</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-3xl font-bold text-maquete-glow">{totalOnline}</p>
                <p className="text-xs text-gray-500">dispositivos online</p>
              </div>
              <div className="relative">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#1C2333" strokeWidth="4" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="url(#progressGradient)" strokeWidth="4"
                    strokeDasharray={`${(totalOnline / (totalModules * 4)) * 176} 176`}
                    strokeLinecap="round" transform="rotate(-90 32 32)"
                    style={{ transition: 'stroke-dasharray 1s ease-out' }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00FFB2" />
                      <stop offset="100%" stopColor="#3D9EFF" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity size={20} className="text-maquete-glow animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Status */}
      <div className={`flex items-center gap-4 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        connected
          ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40'
          : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
      }`}
        style={{ boxShadow: connected ? '0 4px 20px rgba(0,255,178,0.05)' : '0 4px 20px rgba(255,69,96,0.05)' }}
      >
        {connected ? <Wifi size={20} className="text-green-400" /> : <WifiOff size={20} className="text-red-400" />}
        <div className="flex-1">
          <p className={`font-medium ${connected ? 'text-green-400' : 'text-red-400'}`}>
            Gateway Bluetooth {connected ? 'Conectado' : 'Desconectado'}
          </p>
          <p className="text-xs text-gray-500">
            {connected ? 'Todos os dispositivos sincronizados' : 'Tentando reconexão...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Zap size={12} className={connected ? 'text-maquete-glow' : 'text-gray-600'} />
            <span>{connected ? 'Ativo' : 'Inativo'}</span>
          </div>
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-maquete-surface/60 border border-maquete-border rounded-xl p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-maquete-card rounded-xl" />
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
              colorHex="#3D9EFF"
              status="online"
              count={`${stats.switches.online}/4 switches`}
              alerts={stats.switches.alerts}
              onClick={() => navigate('/ferrovia')}
              delay={0}
            />
            <StatusCard
              title="Mina"
              icon={Truck}
              color="bg-maquete-warning"
              colorHex="#FFB800"
              status="online"
              count={`${stats.trucks.online} caminhão(ões)`}
              alerts={stats.trucks.alerts}
              onClick={() => navigate('/mina')}
              delay={100}
            />
            <StatusCard
              title="Porto"
              icon={Ship}
              color="bg-maquete-purple"
              colorHex="#A855F7"
              status="online"
              count={`${stats.ships.online} navio(s)`}
              alerts={stats.ships.alerts}
              onClick={() => navigate('/porto')}
              delay={200}
            />
            <StatusCard
              title="Aeroporto"
              icon={Plane}
              color="bg-green-500"
              colorHex="#22C55E"
              status="online"
              count={`${stats.airplanes.online} aeronave(s)`}
              alerts={stats.airplanes.alerts}
              onClick={() => navigate('/aeroporto')}
              delay={300}
            />
          </>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Uptime', value: '99.9%', icon: TrendingUp, color: 'text-maquete-glow' },
          { label: 'Latência', value: '<50ms', icon: Zap, color: 'text-maquete-accent' },
          { label: 'Eventos/h', value: '1.2k', icon: Activity, color: 'text-maquete-purple' },
          { label: 'Alertas', value: '0', icon: AlertTriangle, color: 'text-maquete-warning' },
        ].map((stat, i) => (
          <div key={i} className="bg-maquete-surface/50 backdrop-blur-sm border border-maquete-border rounded-xl p-4 hover:border-maquete-border/60 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className={stat.color} />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-lg font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Alertas Recentes */}
      <div className="bg-maquete-surface/60 backdrop-blur-sm border border-maquete-border rounded-xl p-6"
        style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-maquete-warning" />
          Alertas Recentes
        </h3>
        <div className="space-y-3">
          {!connected && (
            <div className="flex items-center gap-4 p-4 bg-maquete-card/80 rounded-xl border border-red-500/10 hover:border-red-500/30 transition-all">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle size={20} className="text-maquete-danger shrink-0" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Gateway Bluetooth desconectado</p>
                <p className="text-xs text-gray-500">Tentativa de reconexão automática em andamento</p>
              </div>
              <span className="text-[10px] text-gray-500 shrink-0">Agora</span>
            </div>
          )}
          {connected && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-maquete-glow/10 flex items-center justify-center">
                <Activity size={24} className="text-maquete-glow" />
              </div>
              <p className="text-sm text-gray-400">Nenhum alerta ativo</p>
              <p className="text-xs text-gray-600 mt-1">Todos os sistemas operacionais</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
