import React, { useState, useEffect } from 'react';
import { Ship, Clock, Package, Anchor, RefreshCw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const statusColors = {
  arriving: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Chegando' },
  docked: { bg: 'bg-success/10', text: 'text-success', label: 'Atracado' },
  loading: { bg: 'bg-warning/10', text: 'text-warning', label: 'Carregando' },
  unloading: { bg: 'bg-warning/10', text: 'text-warning', label: 'Descarregando' },
  departed: { bg: 'bg-muted/10', text: 'text-muted', label: 'Partiu' },
};

export default function Porto() {
  const [ships, setShips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, docked: 0, loading: 0 });

  useEffect(() => {
    fetchShips();
  }, []);

  // Socket.IO para atualizações em tempo real
  useEffect(() => {
    const socket = io(window.location.origin, { path: '/socket.io' });
    
    socket.on('port:ship_update', (data) => {
      setShips(prev => prev.map(ship => 
        ship.id === data.shipId ? { ...ship, status: data.status } : ship
      ));
      toast.info(`Navio ${data.shipId} mudou para ${statusColors[data.status]?.label || data.status}`);
    });

    return () => socket.disconnect();
  }, []);

  // Atualizar stats quando ships mudar
  useEffect(() => {
    const total = ships.length;
    const docked = ships.filter(s => s.status === 'docked').length;
    const loadingCount = ships.filter(s => s.status === 'loading' || s.status === 'unloading').length;
    setStats({ total, docked, loading: loadingCount });
  }, [ships]);

  const fetchShips = async () => {
    try {
      const res = await axios.get('/api/port/ships');
      setShips(res.data);
    } catch (e) {
      // Dados fallback
      setShips([
        { id: 'SHIP-001', name: 'Navio Cargueiro Alpha', status: 'docked', cargo_type: 'Minério de Ferro', cargo_weight: 15000, dock_number: 1 },
        { id: 'SHIP-002', name: 'Petroleiro Beta', status: 'loading', cargo_type: 'Petróleo', cargo_weight: 25000, dock_number: 2 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => statusColors[status] || { bg: 'bg-muted/10', text: 'text-muted', label: status };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">Porto</h2>
          <p className="text-sm text-muted mt-0.5">Monitoramento de navios e operacoes portuarias</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-success">● {stats.docked} atracados</span>
            <span className="text-warning">● {stats.loading} operando</span>
          </div>
          <button onClick={fetchShips} className="p-1.5 bg-card border border-border rounded-lg hover:bg-surface">
            <RefreshCw size={14} className="text-muted" />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-surface border border-border rounded-lg p-3">
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1"><Anchor size={12} className="text-success" /> {stats.docked} docas ocupadas</span>
          <span className="flex items-center gap-1"><Package size={12} className="text-warning" /> {stats.loading} em operacao</span>
          <span className="flex items-center gap-1"><Ship size={12} /> {stats.total} navios no porto</span>
        </div>
      </div>

      {/* Mapa do Porto */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Mapa do Porto</h3>
        <div className="bg-card rounded-lg border border-border p-4">
          <svg viewBox="0 0 400 200" className="w-full h-auto">
            {/* Agua */}
            <rect x="0" y="0" width="400" height="200" fill="#0F172A" rx="8" />
            {/* Ondas */}
            <path d="M0,100 Q50,90 100,100 T200,100 T300,100 T400,100" fill="none" stroke="#1E3A5F" strokeWidth="1" opacity="0.5" />
            <path d="M0,120 Q50,110 100,120 T200,120 T300,120 T400,120" fill="none" stroke="#1E3A5F" strokeWidth="1" opacity="0.3" />
            {/* Docas */}
            {[0, 1, 2, 3].map(i => (
              <g key={i}>
                <rect x={60 + i * 80} y="150" width="60" height="40" fill="#1C2333" stroke="#2A2D3A" rx="4" />
                <text x={90 + i * 80} y="175" textAnchor="middle" fill="#6B7280" fontSize="10">Doca {i + 1}</text>
              </g>
            ))}
            {/* Navios */}
            {ships.filter(s => s.status !== 'departed').map((ship, i) => {
              const dockIdx = (ship.dock_number || 1) - 1;
              const x = 90 + (dockIdx % 4) * 80;
              const y = ship.status === 'docked' ? 135 : 100 - i * 15;
              return (
                <g key={ship.id}>
                  <ellipse cx={x} cy={y} rx="25" ry="10" fill={ship.status === 'docked' ? '#10B981' : '#3B82F6'} opacity="0.8" />
                  <text x={x} y={y + 3} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">
                    {ship.name?.substring(0, 8)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Lista de Navios */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-card rounded w-32 mb-2" />
              <div className="h-3 bg-card rounded w-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ships.map(ship => {
            const statusInfo = getStatusInfo(ship.status);
            return (
              <div key={ship.id} className="bg-surface border border-border rounded-lg p-4 hover:border-[#3B82F6]/20 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                      <Ship size={18} className="text-[#3B82F6]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-text">{ship.name}</h3>
                      <p className="text-xs text-muted font-mono">{ship.id}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${statusInfo.bg} ${statusInfo.text}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-card rounded-lg p-2 border border-border">
                    <p className="text-muted mb-0.5">Carga</p>
                    <p className="text-text font-medium">{ship.cargo_type}</p>
                  </div>
                  <div className="bg-card rounded-lg p-2 border border-border">
                    <p className="text-muted mb-0.5">Peso</p>
                    <p className="text-text font-medium">{ship.cargo_weight?.toLocaleString()}t</p>
                  </div>
                  <div className="bg-card rounded-lg p-2 border border-border">
                    <p className="text-muted mb-0.5">Doca</p>
                    <p className="text-text font-medium">Doca {ship.dock_number}</p>
                  </div>
                  <div className="bg-card rounded-lg p-2 border border-border">
                    <p className="text-muted mb-0.5">ETA</p>
                    <p className="text-text font-medium">
                      {ship.eta ? new Date(ship.eta).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
