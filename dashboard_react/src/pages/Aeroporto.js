import React, { useState, useEffect } from "react";
import { Plane, Clock, Package } from "lucide-react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Aeroporto() {
  const [airplanes, setAirplanes] = useState([]);

  useEffect(() => {
    fetchAirplanes();
    const interval = setInterval(fetchAirplanes, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAirplanes = async () => {
    try {
      const res = await axios.get("/api/airport/airplanes");
      setAirplanes(res.data);
    } catch (e) {
      console.error("Erro ao buscar aeronaves:", e);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "landed":
        return "bg-green-500/20 text-green-400";
      case "boarding":
        return "bg-maquete-warning/20 text-maquete-warning";
      case "departing":
        return "bg-maquete-accent/20 text-maquete-accent";
      case "in_air":
        return "bg-maquete-purple/20 text-maquete-purple";
      case "arriving":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      landed: "Aterrissado",
      boarding: "Embarcando",
      departing: "Decolando",
      in_air: "Em voo",
      arriving: "Chegando",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Aeroporto Logístico</h2>
        <p className="text-gray-500">
          Monitoramento de aeronaves e cargas aéreas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {airplanes.map((plane) => (
          <div
            key={plane.id}
            className="bg-maquete-surface border border-maquete-border rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Plane size={24} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {plane.flight_number}
                  </h3>
                  <p className="text-sm text-gray-500">{plane.id}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(plane.status)}`}
              >
                {getStatusLabel(plane.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-maquete-card rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Package size={14} />
                  <span>Tipo de Carga</span>
                </div>
                <p className="font-medium">{plane.cargo_type || "N/A"}</p>
              </div>
              <div className="bg-maquete-card rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Package size={14} />
                  <span>Peso</span>
                </div>
                <p className="font-medium">
                  {plane.cargo_weight?.toLocaleString()} kg
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock size={14} />
                <span>ETA:</span>
                <span className="text-white">
                  {plane.eta
                    ? formatDistanceToNow(new Date(plane.eta), {
                        locale: ptBR,
                        addSuffix: true,
                      })
                    : "N/A"}
                </span>
              </div>
              {plane.gate && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Gate size={14} />
                  <span>Portão:</span>
                  <span className="text-maquete-accent font-medium">
                    {plane.gate}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
