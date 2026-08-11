import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Filter, Bell, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';

const severityConfig = {
  info: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Bell, label: 'Info' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', icon: AlertTriangle, label: 'Atencao' },
  critical: { bg: 'bg-danger/10', text: 'text-danger', icon: AlertTriangle, label: 'Critico' },
};

const moduleLabels = {
  ferrovia: 'Ferrovia',
  mina: 'Mina',
  porto: 'Porto',
  aeroporto: 'Aeroporto',
  quimica: 'Quimica',
  sistema: 'Sistema',
};

export default function Alertas() {
  const { socket } = useSocket();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ module: '', severity: '', acknowledged: '' });
  const [stats, setStats] = useState({ total: 0, pending: 0, critical: 0 });

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  // Socket.IO para alertas em tempo real
  useEffect(() => {
    if (!socket) return;

    const handleNewAlert = (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50));
      setStats(prev => ({ ...prev, pending: prev.pending + 1 }));

      if (alert.severity === 'critical') {
        toast.error(`CRITICO: ${alert.message}`);
      } else {
        toast.warning(alert.message);
      }
    };

    const handleAlertAcknowledged = (data) => {
      setAlerts(prev => prev.map(a =>
        a.id === data.id ? { ...a, acknowledged_at: data.acknowledgedAt } : a
      ));
      setStats(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1) }));
    };

    socket.on('alert:new', handleNewAlert);
    socket.on('alert:acknowledged', handleAlertAcknowledged);
    return () => {
      socket.off('alert:new', handleNewAlert);
      socket.off('alert:acknowledged', handleAlertAcknowledged);
    };
  }, [socket]);

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.module) params.append('module', filter.module);
      if (filter.severity) params.append('severity', filter.severity);
      if (filter.acknowledged !== '') params.append('acknowledged', filter.acknowledged);
      
      const res = await axios.get(`/api/alerts?${params.toString()}`);
      const data = res.data.alerts || res.data;
      setAlerts(data);
      
      const total = data.length;
      const pending = data.filter(a => !a.acknowledged_at).length;
      const critical = data.filter(a => a.severity === 'critical' && !a.acknowledged_at).length;
      setStats({ total, pending, critical });
    } catch (e) {
      toast.error('Erro ao buscar alertas');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await axios.patch(`/api/alerts/${id}/acknowledge`);
      toast.success('Alerta confirmado');
      fetchAlerts();
    } catch (e) {
      toast.error('Erro ao confirmar alerta');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este alerta?')) return;
    try {
      await axios.delete(`/api/alerts/${id}`);
      toast.success('Alerta excluido');
      fetchAlerts();
    } catch (e) {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">Alertas</h2>
          <p className="text-sm text-muted mt-0.5">Monitoramento de alertas do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-warning">● {stats.pending} pendentes</span>
            <span className="text-danger">● {stats.critical} criticos</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-surface border border-border rounded-lg p-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted" />
            <span className="text-xs text-muted">Filtros:</span>
          </div>
          <select
            value={filter.module}
            onChange={e => setFilter({...filter, module: e.target.value})}
            className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-text"
          >
            <option value="">Todos os modulos</option>
            {Object.entries(moduleLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filter.severity}
            onChange={e => setFilter({...filter, severity: e.target.value})}
            className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-text"
          >
            <option value="">Todas as severidades</option>
            <option value="info">Info</option>
            <option value="warning">Atencao</option>
            <option value="critical">Critico</option>
          </select>
          <select
            value={filter.acknowledged}
            onChange={e => setFilter({...filter, acknowledged: e.target.value})}
            className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-text"
          >
            <option value="">Todos</option>
            <option value="false">Pendentes</option>
            <option value="true">Confirmados</option>
          </select>
        </div>
      </div>

      {/* Lista de Alertas */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-10 text-center">
          <CheckCircle size={36} className="mx-auto mb-3 text-success opacity-40" />
          <p className="text-muted">Nenhum alerta registrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => {
            const config = severityConfig[alert.severity] || severityConfig.info;
            const Icon = config.icon;
            const isAcknowledged = !!alert.acknowledged_at;
            
            return (
              <div
                key={alert.id}
                className={`bg-surface border rounded-lg p-4 transition-colors ${
                  isAcknowledged ? 'border-border/50 opacity-60' : 'border-border hover:border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <Icon size={16} className={config.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.text}`}>
                        {config.label}
                      </span>
                      <span className="text-[10px] text-muted px-1.5 py-0.5 bg-card rounded">
                        {moduleLabels[alert.module] || alert.module}
                      </span>
                      {isAcknowledged && (
                        <span className="text-[10px] text-success px-1.5 py-0.5 bg-success/10 rounded">
                          Confirmado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted">
                      <Clock size={10} />
                      <span>{new Date(alert.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                  {!isAcknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="p-1.5 text-muted hover:text-success hover:bg-success/10 rounded-lg transition-colors"
                      title="Confirmar"
                    >
                      <CheckCircle size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
