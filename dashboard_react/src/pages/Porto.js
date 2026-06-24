import React, { useState, useEffect } from 'react';
import { Ship, Clock, Package, Anchor } from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Porto() {
  const [ships, setShips] = useState([]);

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
      console.error('Erro ao buscar navios:', e);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'docked': return 'bg-green-500/20 text-green-400';
      case 'loading': return 'bg-maquete-warning/20 text-maquete-warning';
      case 'unloading': return 'bg-maquete-accent/20 text-maquete-accent';
      case 'departed': return 'bg-gray-500/20 text-gray-400';
      case 'arriving': return 'bg-maquete-purple/20 text-maquete-purple';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      docked: 'Atracado',
      loading: 'Carregando',
      unloading: 'Descarregando',
      departed: 'Partido',
      arriving: 'Chegando'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Porto Logístico</h2>
        <p className="text-gray-500">Monitoramento de navios e cargas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ships.map(ship => (
          <div key={ship.id} className="bg-maquete-surface border border-maquete-border rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-maquete-purple/20 rounded-lg">
                  <Ship size={24} className="text-maquete-purple" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{ship.name}</h3>
                  <p className="text-sm text-gray-500">{ship.id}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ship.status)}`}>
                {getStatusLabel(ship.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-maquete-card rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Package size={14} />
                  <span>Tipo de Carga</span>
                </div>
                <p className="font-medium">{ship.cargo_type || 'N/A'}</p>
              </div>
              <div className="bg-maquete-card rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Anchor size={14} />
                  <span>Peso</span>
                </div>
                <p className="font-medium">{ship.cargo_weight?.toLocaleString()} kg</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock size={14} />
                <span>ETA:</span>
                <span className="text-white">
                  {ship.eta ? formatDistanceToNow(new Date(ship.eta), { locale: ptBR, addSuffix: true }) : 'N/A'}
                </span>
              </div>
              {ship.dock_number && (
                <div className="flex items-center gap-2 text-gray-400">
                  <span>Doca:</span>
                  <span className="text-maquete-accent font-medium">{ship.dock_number}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
