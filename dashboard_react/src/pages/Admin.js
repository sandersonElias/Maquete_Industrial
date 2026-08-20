import React, { useState, useEffect } from 'react';
import { Users, BarChart3, Settings, Shield, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const UserModal = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState(user || {
    username: '',
    email: '',
    password: '',
    role: 'viewer',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user) {
        await axios.put(`/api/admin/users/${user.id}`, {
          username: formData.username,
          email: formData.email,
          role: formData.role,
        });
        toast.success('Usuario atualizado!');
      } else {
        await axios.post('/api/admin/users', formData);
        toast.success('Usuario criado!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface border border-border rounded-lg p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-text mb-4">
          {user ? 'Editar Usuario' : 'Novo Usuario'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1">Username</label>
            <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-text" required />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Email</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-text" required />
          </div>
          {!user && (
            <div>
              <label className="block text-xs text-muted mb-1">Senha</label>
              <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-text" required />
            </div>
          )}
          <div>
            <label className="block text-xs text-muted mb-1">Role</label>
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-text">
              <option value="admin">Administrador</option>
              <option value="operator">Operador</option>
              <option value="viewer">Visualizador</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-card border border-border rounded-lg text-sm text-muted">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 bg-[#06B6D4] hover:bg-[#06B6D4]/80 rounded-lg text-sm text-white font-medium disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'stats') fetchStats();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data);
    } catch (e) {
      toast.error('Erro ao buscar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/stats');
      setStats(res.data);
    } catch (e) {
      toast.error('Erro ao buscar metricas');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Excluir este usuario?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      toast.success('Usuario excluido');
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erro ao excluir');
    }
  };

  const handleSave = () => {
    setShowModal(false);
    setEditingUser(null);
    fetchUsers();
  };

  const tabs = [
    { id: 'stats', label: 'Metricas', icon: BarChart3 },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'config', label: 'Configuracoes', icon: Settings },
  ];

  const roleLabels = { admin: 'Administrador', operator: 'Operador', viewer: 'Visualizador' };
  const roleColors = { admin: 'text-danger', operator: 'text-warning', viewer: 'text-muted' };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">Administracao</h2>
          <p className="text-sm text-muted mt-0.5">Gerenciamento do sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-accent/10 text-accent'
                : 'text-muted hover:text-text hover:bg-card'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 bg-surface border border-border rounded-lg animate-pulse" />
              ))}
            </div>
          ) : stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-surface border border-border rounded-lg p-4">
                  <p className="text-[10px] text-muted uppercase mb-1">Usuarios</p>
                  <p className="text-2xl font-bold text-text">{stats.totalUsers}</p>
                </div>
                <div className="bg-surface border border-border rounded-lg p-4">
                  <p className="text-[10px] text-muted uppercase mb-1">Comandos (24h)</p>
                  <p className="text-2xl font-bold text-text">{stats.commandsLast24h}</p>
                </div>
                <div className="bg-surface border border-border rounded-lg p-4">
                  <p className="text-[10px] text-muted uppercase mb-1">Alertas Pendentes</p>
                  <p className="text-2xl font-bold text-warning">{stats.pendingAlerts}</p>
                </div>
                <div className="bg-surface border border-border rounded-lg p-4">
                  <p className="text-[10px] text-muted uppercase mb-1">Relatorios</p>
                  <p className="text-2xl font-bold text-text">{stats.totalReports}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface border border-border rounded-lg p-4">
                  <h3 className="text-xs font-medium text-muted uppercase mb-3">Por Role</h3>
                  <div className="space-y-2">
                    {stats.usersByRole?.map(r => (
                      <div key={r.role} className="flex items-center justify-between">
                        <span className="text-sm text-text">{roleLabels[r.role] || r.role}</span>
                        <span className="text-sm font-medium text-text">{r.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-surface border border-border rounded-lg p-4">
                  <h3 className="text-xs font-medium text-muted uppercase mb-3">Modulos</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text">Navios</span>
                      <span className="text-sm font-medium text-text">{stats.totalShips}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text">Equip. Quimica</span>
                      <span className="text-sm font-medium text-text">{stats.chemistryEquipment}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setEditingUser(null); setShowModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] hover:bg-[#06B6D4]/80 rounded-lg text-xs font-medium text-white">
              <Plus size={14} /> Novo Usuario
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-surface border border-border rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="text-left py-3 px-4 text-[10px] text-muted uppercase">Usuario</th>
                    <th className="text-left py-3 px-4 text-[10px] text-muted uppercase">Email</th>
                    <th className="text-left py-3 px-4 text-[10px] text-muted uppercase">Role</th>
                    <th className="text-left py-3 px-4 text-[10px] text-muted uppercase">Criado em</th>
                    <th className="text-right py-3 px-4 text-[10px] text-muted uppercase">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-card/50">
                      <td className="py-3 px-4 text-text font-medium">{u.username}</td>
                      <td className="py-3 px-4 text-muted">{u.email}</td>
                      <td className={`py-3 px-4 font-medium ${roleColors[u.role]}`}>
                        {roleLabels[u.role] || u.role}
                      </td>
                      <td className="py-3 px-4 text-muted text-xs">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setEditingUser(u); setShowModal(true); }}
                            className="p-1.5 hover:bg-card rounded text-muted hover:text-text">
                            <Edit2 size={14} />
                          </button>
                          {u.id !== currentUser?.id && (
                            <button onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 hover:bg-danger/10 rounded text-muted hover:text-danger">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Config Tab */}
      {activeTab === 'config' && (
        <div className="bg-surface border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium text-text mb-4">Configuracoes do Sistema</h3>
          <div className="space-y-3 text-sm text-muted">
            <p>• Simulacao de quimica: ativa (10s)</p>
            <p>• Simulacao de porto: ativa (30s)</p>
            <p>• Simulacao de locomotiva: ativa (5s)</p>
            <p>• Timeout de comandos: 5s</p>
            <p>• Redis: {process.env.REDIS_URL ? 'configurado' : 'nao configurado (sem cache)'}</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingUser(null); }}
        />
      )}
    </div>
  );
}
