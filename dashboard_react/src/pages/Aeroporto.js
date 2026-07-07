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
      case 'landed': return 'bg-success/10 text-success';
      case 'boarding': return 'bg-warning/10 text-warning';
      case 'departing': return 'bg-accent/10 text-accent';
      case 'in_air': return 'bg-[#A855F7]/10 text-[#A855F7]';
      case 'arriving': return 'bg-accent/10 text-accent';
      default: return 'bg-muted/10 text-muted';
    }
  };

  const getStatusLabel = (status) => ({
    landed: 'Aterrissado', boarding: 'Embarcando', departing: 'Decolando',
    in_air: 'Em voo', arriving: 'Chegando'
  })[status] || status;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-text">Aeroporto Logistico</h2>
        <p className="text-sm text-muted mt-0.5">Monitoramento de aeronaves e cargas aereas</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-card rounded-lg" />
                <div className="flex-1">
                  <div className="w-24 h-4 bg-card rounded mb-1" />
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
      ) : airplanes.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-10 text-center">
          <Plane size={36} className="mx-auto mb-3 text-muted opacity-40" />
          <p className="text-muted">Nenhuma aeronave registrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {airplanes.map(plane => (
            <div key={plane.id} className="bg-surface border border-border rounded-lg p-5 hover:border-accent/20 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Plane size={18} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-text">{plane.flight_number}</h3>
                    <p className="text-xs text-muted font-mono">{plane.id}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${getStatusColor(plane.status)}`}>
                  {getStatusLabel(plane.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-card rounded-lg p-2.5 border border-border">
                  <div className="flex items-center gap-1 text-[10px] text-muted mb-1">
                    <Package size={10} />
                    <span>Carga</span>
                  </div>
                  <p className="text-xs font-medium text-text">{plane.cargo_type || 'N/A'}</p>
                </div>
                <div className="bg-card rounded-lg p-2.5 border border-border">
                  <div className="flex items-center gap-1 text-[10px] text-muted mb-1">
                    <Gauge size={10} />
                    <span>Peso</span>
                  </div>
                  <p className="text-xs font-medium text-text">{plane.cargo_weight?.toLocaleString() || 'N/A'} kg</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted">
                <div className="flex items-center gap-1">
                  <Clock size={10} />
                  <span>ETA:</span>
                  <span className="text-text">
                    {plane.eta ? formatDistanceToNow(new Date(plane.eta), { locale: ptBR, addSuffix: true }) : 'N/A'}
                  </span>
                </div>
                {plane.gate && (
                  <div className="flex items-center gap-1">
                    <DoorOpen size={10} />
                    <span>Portao:</span>
                    <span className="text-accent">{plane.gate}</span>
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
