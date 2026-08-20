import React, { useState, useEffect } from 'react';
import { Train, MapPin, Gauge, Clock, Navigation, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';

export default function Locomotiva() {
  const { socket } = useSocket();
  const [position, setPosition] = useState({ x: 0, y: 0, speed: 0, heading: 0, trackSegment: 'Patio Sul' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Buscar posição inicial
  useEffect(() => {
    fetchPosition();
    fetchHistory();
  }, []);

  // Socket.IO para atualizações em tempo real
  useEffect(() => {
    if (!socket) return;

    const handleLocomotiveUpdate = (data) => {
      setPosition({
        x: data.x,
        y: data.y,
        speed: data.speed,
        heading: data.heading,
        trackSegment: data.trackSegment,
      });
      setHistory(prev => [...prev.slice(-19), { ...data, timestamp: new Date(data.timestamp) }]);
    };

    socket.on('locomotive:update', handleLocomotiveUpdate);
    return () => socket.off('locomotive:update', handleLocomotiveUpdate);
  }, [socket]);

  const fetchPosition = async () => {
    try {
      const res = await axios.get('/api/locomotive/position');
      setPosition(res.data);
    } catch (e) {
      // Usar posição padrão
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/locomotive/history?limit=20');
      setHistory(res.data.reverse());
    } catch (e) {
      // Silently fail
    }
  };

  // Pontos do trilho para o mapa SVG
  const trackPoints = [
    { x: 50, y: 250, label: "Patio Sul" },
    { x: 150, y: 250, label: "Trilho Principal" },
    { x: 250, y: 230, label: "Curva Leste" },
    { x: 350, y: 200, label: "Trilho Norte" },
    { x: 350, y: 120, label: "Subida" },
    { x: 300, y: 80, label: "Desvio Oeste" },
    { x: 200, y: 80, label: "Patio Norte" },
    { x: 120, y: 120, label: "Descida" },
    { x: 50, y: 180, label: "Retorno Sul" },
  ];

  // Converter coordenadas da simulação para SVG
  const mapX = (x) => 50 + (x / 150) * 300;
  const mapY = (y) => 250 - (y / 80) * 170;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">Locomotiva</h2>
          <p className="text-sm text-muted mt-0.5">Monitoramento de posicao e movimentacao</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Segmento:</span>
          <span className="text-sm font-medium text-[#F59E0B]">{position.trackSegment}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mapa */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-4">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <MapPin size={12} className="text-[#F59E0B]" />
            Mapa dos Trilhos
          </h3>
          <div className="bg-card rounded-lg border border-border p-2">
            <svg viewBox="0 0 400 320" className="w-full h-auto">
              {/* Trilho */}
              <path
                d={`M ${trackPoints.map(p => `${p.x},${p.y}`).join(' L ')} Z`}
                fill="none"
                stroke="#2A2D3A"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Pontos dos trilhos */}
              {trackPoints.map((point, i) => (
                <g key={i}>
                  <circle cx={point.x} cy={point.y} r="4" fill="#1C2333" stroke="#4B5563" strokeWidth="1" />
                  <text x={point.x} y={point.y - 10} textAnchor="middle" fill="#6B7280" fontSize="8">
                    {point.label}
                  </text>
                </g>
              ))}
              {/* Locomotiva */}
              <g transform={`translate(${mapX(position.x)}, ${mapY(position.y)})`}>
                <circle r="12" fill="#F59E0B" opacity="0.2" />
                <circle r="8" fill="#F59E0B" />
                <text textAnchor="middle" dy="3" fill="#0D0F14" fontSize="8" fontWeight="bold">L</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          {/* Velocidade */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gauge size={14} className="text-[#F59E0B]" />
              <span className="text-xs font-medium text-muted">Velocidade</span>
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold text-text">{position.speed?.toFixed(1) || '0.0'}</span>
              <span className="text-sm text-muted ml-1">u/s</span>
            </div>
          </div>

          {/* Posição */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Navigation size={14} className="text-[#F59E0B]" />
              <span className="text-xs font-medium text-muted">Posicao</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card rounded-lg p-2 border border-border text-center">
                <p className="text-[10px] text-muted">X</p>
                <p className="text-sm font-medium text-text">{position.x?.toFixed(1) || '0.0'}</p>
              </div>
              <div className="bg-card rounded-lg p-2 border border-border text-center">
                <p className="text-[10px] text-muted">Y</p>
                <p className="text-sm font-medium text-text">{position.y?.toFixed(1) || '0.0'}</p>
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight size={14} className="text-[#F59E0B]" />
              <span className="text-xs font-medium text-muted">Direcao</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-text">{position.heading?.toFixed(0) || '0'}°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock size={12} className="text-[#F59E0B]" />
          Historico de Posicoes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-[10px] text-muted uppercase">Hora</th>
                <th className="text-left py-2 px-3 text-[10px] text-muted uppercase">Segmento</th>
                <th className="text-right py-2 px-3 text-[10px] text-muted uppercase">X</th>
                <th className="text-right py-2 px-3 text-[10px] text-muted uppercase">Y</th>
                <th className="text-right py-2 px-3 text-[10px] text-muted uppercase">Velocidade</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">Aguardando dados...</td>
                </tr>
              ) : (
                history.slice(-10).reverse().map((h, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-card/50">
                    <td className="py-2 px-3 text-text font-mono text-xs">
                      {h.timestamp ? new Date(h.timestamp).toLocaleTimeString('pt-BR') : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-text">{h.trackSegment}</td>
                    <td className="py-2 px-3 text-right text-text">{h.x?.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right text-text">{h.y?.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right text-text">{h.speed?.toFixed(1)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
