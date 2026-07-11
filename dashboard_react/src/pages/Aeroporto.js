import React, { useState, useEffect } from 'react';
import { Plane, Clock, Package, RefreshCw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const statusColors = {
  arriving: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Aproximando' },
  landed: { bg: 'bg-success/10', text: 'text-success', label: 'Pousou' },
  boarding: { bg: 'bg-warning/10', text: 'text-warning', label: 'Embarcando' },
  departing: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Decolando' },
  in_air: { bg: 'bg-muted/10', text: 'text-muted', label: 'Em voo' },
};

export default function Aeroporto() {
  const [airplanes, setAirplanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, landed: 0, inAir: 0 });

  useEffect(() => {
    fetchAirplanes();
  }, []);

  // Socket.IO para atualizações em tempo real
  useEffect(() => {
    const socket = io(window.location.origin, { path: '/socket.io' });
    
    socket.on('airport:airplane_update', (data) => {
      setAirplanes(prev => prev.map(plane => 
        plane.id === data.airplaneId ? { ...plane, status: data.status } : plane
      ));
      toast.info(`Aeronave ${data.airplaneId} mudou para ${statusColors[data.status]?.label || data.status}`);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const total = airplanes.length;
    const landed = airplanes.filter(a => a.status === 'landed' || a.status === 'boarding').length;
    const inAir = airplanes.filter(a => a.status === 'in_air' || a.status === 'arriving').length;
    setStats({ total, landed, inAir });
  }, [airplanes]);

  const fetchAirplanes = async () => {
    try {
      const res = await axios.get('/api/airport/airplanes');
      setAirplanes(res.data);
    } catch (e) {
      setAirplanes([
        { id: 'FL-001', flight_number: 'CARGO-2024', status: 'landed', cargo_type: 'Equipamentos', cargo_weight: 5000, gate: 'G3' },
        { id: 'FL-002', flight_number: 'CARGO-2025', status: 'boarding', cargo_type: 'Alimentos', cargo_weight: 3000, gate: 'G1' },
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
          <h2 className="text-xl font-bold text-text">Aeroporto</h2>
          <p className="text-sm text-muted mt-0.5">Monitoramento de voos e operacoes aeroportuarias</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-success">● {stats.landed} no solo</span>
            <span className="text-muted">● {stats.inAir} em voo</span>
          </div>
          <button onClick={fetchAirplanes} className="p-1.5 bg-card border border-border rounded-lg hover:bg-surface">
            <RefreshCw size={14} className="text-muted" />
          </button>
        </div>
      </div>

      {/* Mapa do Aeroporto */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Mapa do Aeroporto</h3>
        <div className="bg-card rounded-lg border border-border p-4">
          <svg viewBox="0 0 400 200" className="w-full h-auto">
            {/* Ceu */}
            <rect x="0" y="0" width="400" height="200" fill="#0F172A" rx="8" />
            {/* Pista */}
            <rect x="50" y="140" width="300" height="20" fill="#1C2333" stroke="#2A2D3A" rx="2" />
            <line x1="60" y1="150" x2="90" y2="150" stroke="#4B5563" strokeWidth="2" strokeDasharray="8,4" />
            <line x1="100" y1="150" x2="130" y2="150" stroke="#4B5563" strokeWidth="2" strokeDasharray="8,4" />
            <line x1="140" y1="150" x2="170" y2="150" stroke="#4B5563" strokeWidth="2" strokeDasharray="8,4" />
            <line x1="180" y1="150" x2="210" y2="150" stroke="#4B5563" strokeWidth="2" strokeDasharray="8,4" />
            <line x1="220" y1="150" x2="250" y2="150" stroke="#4B5563" strokeWidth="2" strokeDasharray="8,4" />
            <line x1="260" y1="150" x2="290" y2="150" stroke="#4B5563" strokeWidth="2" strokeDasharray="8,4" />
            <line x1="300" y1="150" x2="330" y2="150" stroke="#4B5563" strokeWidth="2" strokeDasharray="8,4" />
            {/* Portoes */}
            {[0, 1, 2, 3, 4, 5].map(i => (
              <g key={i}>
                <rect x={70 + i * 50} y="170" width="30" height="20" fill="#1C2333" stroke="#2A2D3A" rx="2" />
                <text x={85 + i * 50} y="184" textAnchor="middle" fill="#6B7280" fontSize="8">G{i + 1}</text>
              </g>
            ))}
            {/* Avioes no solo */}
            {airplanes.filter(a => a.status !== 'in_air' && a.status !== 'arriving').map((plane, i) => {
              const gateIdx = parseInt(plane.gate?.replace('G', '') || '1') - 1;
              const x = 85 + (gateIdx % 6) * 50;
              const y = 130;
              return (
                <g key={plane.id}>
                  <polygon points={`${x},${y-8} ${x+12},${y} ${x},${y+4} ${x-12},${y}`} fill={plane.status === 'boarding' ? '#F59E0B' : '#10B981'} />
                  <text x={x} y={y - 12} textAnchor="middle" fill="#E4E7EC" fontSize="7" fontWeight="bold">
                    {plane.flight_number?.substring(0, 8)}
                  </text>
                </g>
              );
            })}
            {/* Avioes voando */}
            {airplanes.filter(a => a.status === 'in_air' || a.status === 'arriving').map((plane, i) => (
              <g key={plane.id}>
                <polygon points={`${60 + i * 40},${50 + i * 10} ${75 + i * 40},${58 + i * 10} ${60 + i * 40},${62 + i * 10} ${45 + i * 40},${58 + i * 10}`} fill="#6366F1" opacity="0.8" />
                <text x={60 + i * 40} y={45 + i * 10} textAnchor="middle" fill="#E4E7EC" fontSize="7">
                  {plane.flight_number?.substring(0, 8)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Lista de Aeronaves */}
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
          {airplanes.map(plane => {
            const statusInfo = getStatusInfo(plane.status);
            return (
              <div key={plane.id} className="bg-surface border border-border rounded-lg p-4 hover:border-[#6366F1]/20 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#6366F1]/10 flex items-center justify-center">
                      <Plane size={18} className="text-[#6366F1]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-text">{plane.flight_number}</h3>
                      <p className="text-xs text-muted font-mono">{plane.id}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${statusInfo.bg} ${statusInfo.text}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-card rounded-lg p-2 border border-border">
                    <p className="text-muted mb-0.5">Carga</p>
                    <p className="text-text font-medium">{plane.cargo_type}</p>
                  </div>
                  <div className="bg-card rounded-lg p-2 border border-border">
                    <p className="text-muted mb-0.5">Peso</p>
                    <p className="text-text font-medium">{plane.cargo_weight?.toLocaleString()}kg</p>
                  </div>
                  <div className="bg-card rounded-lg p-2 border border-border">
                    <p className="text-muted mb-0.5">Portao</p>
                    <p className="text-text font-medium">{plane.gate || 'N/A'}</p>
                  </div>
                  <div className="bg-card rounded-lg p-2 border border-border">
                    <p className="text-muted mb-0.5">ETA</p>
                    <p className="text-text font-medium">
                      {plane.eta ? new Date(plane.eta).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
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
