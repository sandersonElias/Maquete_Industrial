import React, { useState, useEffect } from 'react';
import { FlaskConical, Thermometer, Droplets, Wind, AlertTriangle, CheckCircle, Activity, TestTube } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const EquipmentCard = ({ equipment }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-success/10 text-success';
      case 'warning': return 'bg-warning/10 text-warning';
      case 'offline': return 'bg-danger/10 text-danger';
      default: return 'bg-muted/10 text-muted';
    }
  };

  const getStatusLabel = (status) => ({
    online: 'Online', warning: 'Atencao', offline: 'Offline'
  })[status] || status;

  const Icon = equipment.icon || FlaskConical;

  return (
    <div className="bg-surface border border-border rounded-lg p-4 hover:border-[#06B6D4]/20 transition-colors">
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
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${getStatusColor(equipment.status)}`}>
          {getStatusLabel(equipment.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-card rounded-lg p-2.5 border border-border">
          <div className="flex items-center gap-1 text-[10px] text-muted mb-1">
            <Thermometer size={10} />
            <span>Temperatura</span>
          </div>
          <p className="text-xs font-medium text-text">{equipment.temperature || 'N/A'}</p>
        </div>
        <div className="bg-card rounded-lg p-2.5 border border-border">
          <div className="flex items-center gap-1 text-[10px] text-muted mb-1">
            <Droplets size={10} />
            <span>Umidade</span>
          </div>
          <p className="text-xs font-medium text-text">{equipment.humidity || 'N/A'}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted">
        <div className="flex items-center gap-1">
          <Activity size={10} />
          <span>Nivel:</span>
          <span className="text-[#06B6D4]">{equipment.level || 'N/A'}</span>
        </div>
        {equipment.lastCalibration && (
          <div className="flex items-center gap-1">
            <span>Calibracao:</span>
            <span>{equipment.lastCalibration}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Quimica() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, online: 0, warnings: 0 });

  useEffect(() => {
    fetchEquipment();
    const interval = setInterval(fetchEquipment, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchEquipment = async () => {
    try {
      const res = await axios.get('/api/chemistry/equipment').catch(() => ({ data: [] }));
      // Adicionar icones padrao (a API nao retorna icones React)
      const equipmentWithIcons = res.data.map((eq, index) => ({
        ...eq,
        icon: [FlaskConical, TestTube, Wind, Droplets][index % 4]
      }));
      setEquipment(equipmentWithIcons);

      const total = res.data.length;
      const online = res.data.filter(e => e.status === 'online').length;
      const warnings = res.data.filter(e => e.status === 'warning').length;
      setStats({ total, online, warnings });
    } catch (e) {
      // Dados estaticos se API nao existir
      setEquipment([
        { id: 'CHEM-001', name: 'Tanque Alpha', icon: TestTube, status: 'online', temperature: '25.4°C', humidity: '45%', level: '78%', lastCalibration: '15/06/2024' },
        { id: 'CHEM-002', name: 'Reator Beta', icon: FlaskConical, status: 'online', temperature: '42.1°C', humidity: '38%', level: '62%', lastCalibration: '10/06/2024' },
        { id: 'CHEM-003', name: 'Misturador Gamma', icon: Wind, status: 'warning', temperature: '31.8°C', humidity: '52%', level: '91%', lastCalibration: '01/06/2024' },
        { id: 'CHEM-004', name: 'Resfriador Delta', icon: Droplets, status: 'online', temperature: '8.2°C', humidity: '85%', level: '45%', lastCalibration: '20/06/2024' },
      ]);
      setStats({ total: 4, online: 3, warnings: 1 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">Area Quimica</h2>
          <p className="text-sm text-muted mt-0.5">Monitoramento administrativo de equipamentos e processos</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Online:</span>
          <span className="text-sm font-bold text-success">{stats.online}</span>
          <span className="text-xs text-muted ml-2">Atencao:</span>
          <span className="text-sm font-bold text-warning">{stats.warnings}</span>
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
        <div className="flex-1">
          <p className={`text-sm font-medium ${stats.warnings > 0 ? 'text-warning' : 'text-success'}`}>
            {stats.warnings > 0
              ? `${stats.warnings} equipamento(s) com alerta`
              : 'Todos os equipamentos operacionais'
            }
          </p>
        </div>
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
          <p className="text-xs text-muted mt-1">Aguardando dados dos alunos de Quimica</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {equipment.map(equip => (
            <EquipmentCard key={equip.id} equipment={equip} />
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <FlaskConical size={12} className="text-[#06B6D4]" />
          Informacoes da Area
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-[10px] text-muted uppercase mb-1">Responsavel</p>
            <p className="text-sm text-text">A definir</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-[10px] text-muted uppercase mb-1">Ultima Manutencao</p>
            <p className="text-sm text-text">A definir</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-[10px] text-muted uppercase mb-1">Proxima Calibracao</p>
            <p className="text-sm text-text">A definir</p>
          </div>
        </div>
      </div>
    </div>
  );
}
