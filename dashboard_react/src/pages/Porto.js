import React, { useState, useEffect } from 'react';
import { Ship, Clock, Package, Anchor, Gauge } from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function Porto() {
  const [ships, setShips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShips();
    const interval = setInterval(fetchShips, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchShips = async () => {
    try {
      const res = await axios.get('/api/port/ships');
      setShips(res.data);
    } catch (e) {
      toast.error('Erro ao buscar navios');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'docked': return 'bg-green-500/15 text-green-400 border-green-500/20';
      case 'loading': return 'bg-maquete-warning/15 text-maquete-warning border-maquete-warning/20';
      case 'unloading': return 'bg-maquete-accent/15 text-maquete-accent border-maquete-accent/20';
      case 'departed': return 'bg-gray-500/15 text-gray-400 border-gray-500/20';
      case 'arriving': return 'bg-maquete-purple/15 text-maquete-purple border-maquete-purple/20';
      default: return 'bg-gray-500/15 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusLabel = (status) => ({
    docked: 'Atracado', loading: 'Carregando', unloading: 'Descarregando',
    departed: 'Partido', arriving: 'Chegando'
  })[status] || status;

  const isAnimated = (status) => ['loading', 'arriving'].includes(status);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Porto Logístico</h2>
        <p className="text-sm text-gray-500">Monitoramento de navios e cargas</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-maquete-surface border border-maquete-border rounded-xl p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-maquete-card rounded-lg" />
                <div className="flex-1">
                  <div className="w-32 h-5 bg-maquete-card rounded mb-1" />
                  <div className="w-20 h-3 bg-maquete-card rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="h-20 bg-maquete-card rounded-lg" />
                <div className="h-20 bg-maquete-card rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : ships.length === 0 ? (
        <div className="bg-maquete-surface border border-maquete-border rounded-xl p-12 text-center">
          <Ship size={48} className="mx-auto mb-4 text-gray-600 opacity-50" />
          <p className="text-gray-400">Nenhum navio registrado</p>
          <p className="text-xs text-gray-600 mt-1">Adicione navios pelo backend</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ships.map(ship => (
            <div key={ship.id} className="bg-maquete-surface border border-maquete-border rounded-xl p-6 hover:border-maquete-border transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-maquete-purple/15 rounded-lg border border-maquete-purple/20 ${isAnimated(ship.status) ? 'animate-pulse' : ''}`}>
                    <Ship size={24} className="text-maquete-purple" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{ship.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">{ship.id}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(ship.status)}`}>
                  {getStatusLabel(ship.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-maquete-card rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                    <Package size={12} />
                    <span>Carga</span>
                  </div>
                  <p className="font-medium text-sm">{ship.cargo_type || 'N/A'}</p>
                </div>
                <div className="bg-maquete-card rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                    <Anchor size={12} />
                    <span>Peso</span>
                  </div>
                  <p className="font-medium text-sm">{ship.cargo_weight?.toLocaleString() || 'N/A'} kg</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Clock size={12} />
                  <span>ETA:</span>
                  <span className="text-white font-medium">
                    {ship.eta ? formatDistanceToNow(new Date(ship.eta), { locale: ptBR, addSuffix: true }) : 'N/A'}
                  </span>
                </div>
                {ship.dock_number && (
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Gauge size={12} />
                    <span>Doca:</span>
                    <span className="text-maquete-accent font-medium">{ship.dock_number}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
