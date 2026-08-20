import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical, Thermometer, Droplets, Wind, AlertTriangle,
  CheckCircle, Activity, TestTube, Plus, Trash2, Edit2,
  TrendingUp, Clock, RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';

const EquipmentCard = ({ equipment, onEdit, onDelete, onViewHistory }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-success/10 text-success border-success/20';
      case 'warning': return 'bg-warning/10 text-warning border-warning/20';
      case 'offline': return 'bg-danger/10 text-danger border-danger/20';
      case 'maintenance': return 'bg-muted/10 text-muted border-muted/20';
      default: return 'bg-muted/10 text-muted border-muted/20';
    }
  };

  const getStatusLabel = (status) => ({
    online: 'Online', warning: 'Atencao', offline: 'Offline', maintenance: 'Manutencao'
  })[status] || status;

  const getIcon = (type) => {
    switch (type) {
      case 'tanque': return Droplets;
      case 'reator': return FlaskConical;
      case 'misturador': return Wind;
      case 'resfriador': return Thermometer;
      default: return TestTube;
    }
  };

  const Icon = getIcon(equipment.type);

  return (
    <div className="bg-surface border border-border rounded-lg p-4 hover:border-[#06B6D4]/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center">
            <Icon size={18} className="text-[#06B6D4]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text">{equipment.name}</h3>
            <p className="text-xs text-muted font-mono">{equipment.id}</p>
          </div>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getStatusColor(equipment.status)}`}>
          {getStatusLabel(equipment.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-card rounded-lg p-2.5 border border-border">
          <div className="flex items-center gap-1 text-[10px] text-muted mb-1">
            <Thermometer size={10} />
            <span>Temperatura</span>
          </div>
          <p className="text-xs font-medium text-text">{equipment.temperature?.toFixed(1) || 'N/A'}°C</p>
        </div>
        <div className="bg-card rounded-lg p-2.5 border border-border">
          <div className="flex items-center gap-1 text-[10px] text-muted mb-1">
            <Droplets size={10} />
            <span>Umidade</span>
          </div>
          <p className="text-xs font-medium text-text">{equipment.humidity?.toFixed(1) || 'N/A'}%</p>
        </div>
        <div className="bg-card rounded-lg p-2.5 border border-border">
          <div className="flex items-center gap-1 text-[10px] text-muted mb-1">
            <Activity size={10} />
            <span>Nivel</span>
          </div>
          <p className="text-xs font-medium text-text">{equipment.level?.toFixed(1) || 'N/A'}%</p>
        </div>
        <div className="bg-card rounded-lg p-2.5 border border-border">
          <div className="flex items-center gap-1 text-[10px] text-muted mb-1">
            <TrendingUp size={10} />
            <span>Pressao</span>
          </div>
          <p className="text-xs font-medium text-text">{equipment.pressure?.toFixed(1) || 'N/A'} bar</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted">
        <div className="flex items-center gap-1">
          <Clock size={10} />
          <span>{equipment.lastCalibration || 'N/A'}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onViewHistory(equipment)} className="p-1 hover:bg-card rounded" title="Historico">
            <TrendingUp size={12} />
          </button>
          <button onClick={() => onEdit(equipment)} className="p-1 hover:bg-card rounded" title="Editar">
            <Edit2 size={12} />
          </button>
          <button onClick={() => onDelete(equipment.id)} className="p-1 hover:bg-danger/10 hover:text-danger rounded" title="Excluir">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

const HistoryModal = ({ equipment, onClose }) => {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReadings();
  }, [equipment.id]);

  const fetchReadings = async () => {
    try {
      const res = await axios.get(`/api/chemistry/equipment/${equipment.id}/history?limit=20`);
      setReadings(res.data.reverse());
    } catch (e) {
      toast.error('Erro ao carregar historico');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface border border-border rounded-lg p-5 w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text">Historico - {equipment.name}</h3>
          <button onClick={onClose} className="text-muted hover:text-text">✕</button>
        </div>
        
        {loading ? (
          <div className="h-64 bg-card rounded-lg animate-pulse" />
        ) : readings.length === 0 ? (
          <p className="text-center text-muted py-8">Nenhuma medicao registrada</p>
        ) : (
          <>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={readings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C2333" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                    tickFormatter={t => new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0D0F14', border: '1px solid #1C2333', borderRadius: '8px' }}
                    labelStyle={{ color: '#6B7280' }}
                    formatter={(value, name) => [`${value.toFixed(1)}${name === 'temperature' ? '°C' : name === 'humidity' || name === 'level' ? '%' : ''}`, name]}
                  />
                  <Line type="monotone" dataKey="temperature" stroke="#EF4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="humidity" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="level" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 text-xs text-muted">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#EF4444] rounded" /> Temperatura</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#3B82F6] rounded" /> Umidade</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#10B981] rounded" /> Nivel</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const EquipmentModal = ({ equipment, onSave, onClose }) => {
  const [formData, setFormData] = useState(equipment || {
    id: '',
    name: '',
    type: 'tanque',
    min_temperature: 10,
    max_temperature: 50,
    min_humidity: 20,
    max_humidity: 80,
    min_level: 10,
    max_level: 95,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (equipment) {
        await axios.put(`/api/chemistry/equipment/${equipment.id}`, formData);
        toast.success('Equipamento atualizado!');
      } else {
        await axios.post('/api/chemistry/equipment', formData);
        toast.success('Equipamento criado!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface border border-border rounded-lg p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-text mb-4">
          {equipment ? 'Editar Equipamento' : 'Novo Equipamento'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!equipment && (
            <div>
              <label className="block text-xs text-muted mb-1">ID</label>
              <input value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})}
                className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-text" required />
            </div>
          )}
          <div>
            <label className="block text-xs text-muted mb-1">Nome</label>
            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-text" required />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Tipo</label>
            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-text">
              <option value="tanque">Tanque</option>
              <option value="reator">Reator</option>
              <option value="misturador">Misturador</option>
              <option value="resfriador">Resfriador</option>
              <option value="forno">Forno</option>
              <option value="bomba">Bomba</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">Temp Min</label>
              <input type="number" value={formData.min_temperature} onChange={e => setFormData({...formData, min_temperature: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-text" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Temp Max</label>
              <input type="number" value={formData.max_temperature} onChange={e => setFormData({...formData, max_temperature: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-text" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-card border border-border rounded-lg text-sm text-muted">Cancelar</button>
            <button type="submit" className="flex-1 py-2 bg-[#06B6D4] hover:bg-[#06B6D4]/80 rounded-lg text-sm text-white font-medium">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Quimica() {
  const { socket } = useSocket();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, online: 0, warnings: 0, offline: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(null);

  const fetchEquipment = useCallback(async () => {
    try {
      const res = await axios.get('/api/chemistry/equipment').catch(() => ({ data: [] }));
      setEquipment(res.data);

      const total = res.data.length;
      const online = res.data.filter(e => e.status === 'online').length;
      const warnings = res.data.filter(e => e.status === 'warning').length;
      const offline = res.data.filter(e => e.status === 'offline').length;
      setStats({ total, online, warnings, offline });
    } catch (e) {
      setStats({ total: 0, online: 0, warnings: 0, offline: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquipment();
    const interval = setInterval(fetchEquipment, 30000);
    return () => clearInterval(interval);
  }, [fetchEquipment]);

  // Socket.IO para atualizacoes em tempo real
  useEffect(() => {
    if (!socket) return;

    const handleChemistryUpdate = (data) => {
      setEquipment(prev => {
        const updated = [...prev];
        for (const update of data.equipment) {
          const idx = updated.findIndex(e => e.id === update.id);
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], ...update };
          }
        }
        return updated;
      });
    };

    const handleNewAlert = (alert) => {
      if (alert.module === 'quimica') {
        toast(alert.message, { icon: '⚠️' });
      }
    };

    socket.on('chemistry:update', handleChemistryUpdate);
    socket.on('alert:new', handleNewAlert);
    return () => {
      socket.off('chemistry:update', handleChemistryUpdate);
      socket.off('alert:new', handleNewAlert);
    };
  }, [socket]);

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este equipamento?')) return;
    try {
      await axios.delete(`/api/chemistry/equipment/${id}`);
      toast.success('Equipamento excluido');
      fetchEquipment();
    } catch (e) {
      toast.error('Erro ao excluir');
    }
  };

  const handleEdit = (eq) => {
    setEditingEquipment(eq);
    setShowModal(true);
  };

  const handleSave = () => {
    setShowModal(false);
    setEditingEquipment(null);
    fetchEquipment();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">Area Quimica</h2>
          <p className="text-sm text-muted mt-0.5">Monitoramento de equipamentos e processos quimicos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-success">● {stats.online} online</span>
            <span className="text-warning">● {stats.warnings} alerta</span>
            <span className="text-danger">● {stats.offline} offline</span>
          </div>
          <button onClick={() => { setEditingEquipment(null); setShowModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] hover:bg-[#06B6D4]/80 rounded-lg text-xs font-medium text-white">
            <Plus size={14} /> Novo
          </button>
          <button onClick={fetchEquipment} className="p-1.5 bg-card border border-border rounded-lg hover:bg-surface">
            <RefreshCw size={14} className="text-muted" />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${
        stats.warnings > 0
          ? 'bg-warning/5 border-warning/20'
          : 'bg-success/5 border-success/20'
      }`}>
        {stats.warnings > 0 ? (
          <AlertTriangle size={16} className="text-warning" />
        ) : (
          <CheckCircle size={16} className="text-success" />
        )}
        <p className={`text-sm font-medium ${stats.warnings > 0 ? 'text-warning' : 'text-success'}`}>
          {stats.warnings > 0
            ? `${stats.warnings} equipamento(s) com alerta`
            : 'Todos os equipamentos operacionais'
          }
        </p>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-card rounded-lg" />
                <div className="flex-1">
                  <div className="w-24 h-3 bg-card rounded mb-1" />
                  <div className="w-16 h-2 bg-card rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-14 bg-card rounded-lg" />
                <div className="h-14 bg-card rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : equipment.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-10 text-center">
          <FlaskConical size={36} className="mx-auto mb-3 text-muted opacity-40" />
          <p className="text-muted">Nenhum equipamento registrado</p>
          <button onClick={() => { setEditingEquipment(null); setShowModal(true); }}
            className="mt-3 text-sm text-[#06B6D4] hover:underline">
            Adicionar primeiro equipamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {equipment.map(equip => (
            <EquipmentCard
              key={equip.id}
              equipment={equip}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewHistory={setViewingHistory}
            />
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <FlaskConical size={12} className="text-[#06B6D4]" />
          Informacoes da Area
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-[10px] text-muted uppercase mb-1">Total Equipamentos</p>
            <p className="text-sm font-bold text-text">{stats.total}</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-[10px] text-muted uppercase mb-1">Online</p>
            <p className="text-sm font-bold text-success">{stats.online}</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-[10px] text-muted uppercase mb-1">Com Alerta</p>
            <p className="text-sm font-bold text-warning">{stats.warnings}</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-[10px] text-muted uppercase mb-1">Simulacao</p>
            <p className="text-sm font-bold text-[#06B6D4]">Ativa (10s)</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <EquipmentModal
          equipment={editingEquipment}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingEquipment(null); }}
        />
      )}
      {viewingHistory && (
        <HistoryModal
          equipment={viewingHistory}
          onClose={() => setViewingHistory(null)}
        />
      )}
    </div>
  );
}
