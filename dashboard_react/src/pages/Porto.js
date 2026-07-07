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
      case 'docked': return 'bg-success/10 text-success';
      case 'loading': return 'bg-warning/10 text-warning';
      case 'unloading': return 'bg-accent/10 text-accent';
      case 'departed': return 'bg-muted/10 text-muted';
      case 'arriving': return 'bg-[#A855F7]/10 text-[#A855F7]';
      default: return 'bg-muted/10 text-muted';
    }
  };

  const getStatusLabel = (status) => ({
    docked: 'Atracado', loading: 'Carregando', unloading: 'Descarregando',
    departed: 'Partido', arriving: 'Chegando'
  })[status] || status;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-text">Porto Logistico</h2>
        <p className="text-sm text-muted mt-0.5">Monitoramento de navios e cargas</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-card rounded-lg" />
                <div className="flex-1">
                  <div className="w-28 h-4 bg-card rounded mb-1" />
                  <div className="w-16 h-2 bg-card rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 bg-card rounded-lg" />
                <div className="h-16 bg-card rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : ships.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-10 text-center">
          <Ship size={36} className="mx-auto mb-3 text-muted opacity-40" />
          <p className="text-muted">Nenhum navio registrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {ships.map(ship => (
            <div key={ship.id} className="bg-surface border border-border rounded-lg p-5 hover:border-[#A855F7]/20 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#A855F7]/10 flex items-center justify-center">
                    <Ship size={18} className="text-[#A855F7]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-text">{ship.name}</h3>
                    <p className="text-xs text-muted font-mono">{ship.id}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${getStatusColor(ship.status)}`}>
                  {getStatusLabel(ship.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-card rounded-lg p-2.5 border border-border">
                  <div className="flex items-center gap-1 text-[10px] text-muted mb-1">
                    <Package size={10} />
                    <span>Carga</span>
                  </div>
                  <p className="text-xs font-medium text-text">{ship.cargo_type || 'N/A'}</p>
                </div>
                <div className="bg-card rounded-lg p-2.5 border border-border">
                  <div className="flex items-center gap-1 text-[10px] text-muted mb-1">
                    <Anchor size={10} />
                    <span>Peso</span>
                  </div>
                  <p className="text-xs font-medium text-text">{ship.cargo_weight?.toLocaleString() || 'N/A'} kg</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted">
                <div className="flex items-center gap-1">
                  <Clock size={10} />
                  <span>ETA:</span>
                  <span className="text-text">
                    {ship.eta ? formatDistanceToNow(new Date(ship.eta), { locale: ptBR, addSuffix: true }) : 'N/A'}
                  </span>
                </div>
                {ship.dock_number && (
                  <div className="flex items-center gap-1">
                    <Gauge size={10} />
                    <span>Doca:</span>
                    <span className="text-accent">{ship.dock_number}</span>
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
