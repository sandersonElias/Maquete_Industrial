import React, { useState, useEffect } from 'react';
import { Truck, Battery, Package, Navigation } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';

const TruckMarker = ({ truck }) => (
  <div 
    className="absolute transform -translate-x-1/2 -translate-y-1/2"
    style={{ 
      left: `${((truck.current_x + 50) / 100) * 100}%`, 
      top: `${((truck.current_y + 50) / 100) * 100}%` 
    }}
  >
    <div className="relative">
      <Truck size={24} className="text-maquete-warning" />
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-maquete-card border border-maquete-border rounded px-2 py-1 whitespace-nowrap">
        <p className="text-xs font-bold">{truck.id}</p>
        <p className="text-xs text-gray-400">{truck.current_load}kg</p>
      </div>
    </div>
  </div>
);

export default function Mina() {
  const [trucks, setTrucks] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    fetchTrucks();

    if (socket) {
      socket.on('truck:telemetry', (data) => {
        setTrucks(prev => prev.map(t => 
          t.id === data.truckId 
            ? { ...t, current_x: data.x, current_y: data.y, current_load: data.load, battery_level: data.battery }
            : t
        ));
      });
    }
  }, [socket]);

  const fetchTrucks = async () => {
    try {
      const res = await axios.get('/api/trucks');
      setTrucks(res.data);
    } catch (e) {
      console.error('Erro ao buscar caminhões:', e);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mina</h2>
        <p className="text-gray-500">Monitoramento dos caminhões basculantes</p>
      </div>

      {/* Mapa da Mina */}
      <div className="bg-maquete-surface border border-maquete-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Mapa da Área de Mineração</h3>
        <div className="relative h-96 bg-maquete-card rounded-lg border border-maquete-border overflow-hidden">
          {/* Grade de fundo */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(#4A5568 1px, transparent 1px), linear-gradient(90deg, #4A5568 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />

          {/* Caminhões */}
          {trucks.map(truck => (
            <TruckMarker key={truck.id} truck={truck} />
          ))}

          {/* Legenda */}
          <div className="absolute bottom-4 left-4 bg-maquete-surface/90 border border-maquete-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <Truck size={16} className="text-maquete-warning" />
              <span>Caminhão Basculante</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trucks.map(truck => (
          <div key={truck.id} className="bg-maquete-card border border-maquete-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{truck.name}</h3>
              <span className={`px-2 py-1 rounded text-xs ${
                truck.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
              }`}>
                {truck.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Navigation size={16} className="text-maquete-accent" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Posição</span>
                    <span>X: {truck.current_x?.toFixed(1)}, Y: {truck.current_y?.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Package size={16} className="text-maquete-purple" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Carga</span>
                    <span>{truck.current_load} / {truck.max_load} kg</span>
                  </div>
                  <div className="h-1.5 bg-maquete-surface rounded-full mt-1">
                    <div 
                      className="h-full bg-maquete-purple rounded-full"
                      style={{ width: `${(truck.current_load / truck.max_load) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Battery size={16} className="text-maquete-glow" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Bateria</span>
                    <span>{truck.battery_level}%</span>
                  </div>
                  <div className="h-1.5 bg-maquete-surface rounded-full mt-1">
                    <div 
                      className={`h-full rounded-full ${
                        truck.battery_level > 50 ? 'bg-maquete-glow' : 
                        truck.battery_level > 20 ? 'bg-maquete-warning' : 'bg-maquete-danger'
                      }`}
                      style={{ width: `${truck.battery_level}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
