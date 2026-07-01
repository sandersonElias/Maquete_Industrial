import React, { useState, useEffect } from 'react';
import { Plane, Clock, Package, DoorOpen, Gauge } from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function Aeroporto() {
  const [airplanes, setAirplanes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAirplanes();
    const interval = setInterval(fetchAirplanes, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAirplanes = async () => {
    try {
      const res = await axios.get('/api/airport/airplanes');
      setAirplanes(res.data);
    } catch (e) {
      toast.error('Erro ao buscar aeronaves');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'landed': return 'bg-green-500/15 text-green-400 border-green-500/20';
      case 'boarding': return 'bg-maquete-warning/15 text-maquete-warning border-maquete-warning/20';
      case 'departing': return 'bg-maquete-accent/15 text-maquete-accent border-maquete-accent/20';
      case 'in_air': return 'bg-maquete-purple/15 text-maquete-purple border-maquete-purple/20';
      case 'arriving': return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/15 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusLabel = (status) => ({
    landed: 'Aterrissado', boarding: 'Embarcando', departing: 'Decolando',
    in_air: 'Em voo', arriving: 'Chegando'
  })[status] || status;

  const isAnimated = (status) => ['boarding', 'arriving', 'departing'].includes(status);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Aeroporto Logístico</h2>
        <p className="text-sm text-gray-500">Monitoramento de aeronaves e cargas aéreas</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-maquete-surface border border-maquete-border rounded-xl p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-maquete-card rounded-lg" />
                <div className="flex-1">
                  <div className="w-24 h-5 bg-maquete-card rounded mb-1" />
                  <div className="w-16 h-3 bg-maquete-card rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-maquete-card rounded-lg" />
                <div className="h-20 bg-maquete-card rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : airplanes.length === 0 ? (
        <div className="bg-maquete-surface border border-maquete-border rounded-xl p-12 text-center">
          <Plane size={48} className="mx-auto mb-4 text-gray-600 opacity-50" />
          <p className="text-gray-400">Nenhuma aeronave registrada</p>
          <p className="text-xs text-gray-600 mt-1">Adicione aeronaves pelo backend</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {airplanes.map(plane => (
            <div key={plane.id} className="bg-maquete-surface border border-maquete-border rounded-xl p-6 hover:border-maquete-border transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-blue-500/15 rounded-lg border border-blue-500/20 ${isAnimated(plane.status) ? 'animate-pulse' : ''}`}>
                    <Plane size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{plane.flight_number}</h3>
                    <p className="text-xs text-gray-500 font-mono">{plane.id}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(plane.status)}`}>
                  {getStatusLabel(plane.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-maquete-card rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                    <Package size={12} />
                    <span>Carga</span>
                  </div>
                  <p className="font-medium text-sm">{plane.cargo_type || 'N/A'}</p>
                </div>
                <div className="bg-maquete-card rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                    <Gauge size={12} />
                    <span>Peso</span>
                  </div>
                  <p className="font-medium text-sm">{plane.cargo_weight?.toLocaleString() || 'N/A'} kg</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Clock size={12} />
                  <span>ETA:</span>
                  <span className="text-white font-medium">
                    {plane.eta ? formatDistanceToNow(new Date(plane.eta), { locale: ptBR, addSuffix: true }) : 'N/A'}
                  </span>
                </div>
                {plane.gate && (
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <DoorOpen size={12} />
                    <span>Portão:</span>
                    <span className="text-maquete-accent font-medium">{plane.gate}</span>
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
