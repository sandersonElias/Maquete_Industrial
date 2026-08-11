import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Train, Truck, Ship, Plane, FlaskConical, FileText, LogOut, MapPin, Bell, Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ isOpen }) {
  const { logout, user } = useAuth();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Visao Geral' },
    { path: '/ferrovia', icon: Train, label: 'Ferrovia' },
    { path: '/mina', icon: Truck, label: 'Mina' },
    { path: '/locomotiva', icon: MapPin, label: 'Locomotiva' },
    { path: '/porto', icon: Ship, label: 'Porto' },
    { path: '/aeroporto', icon: Plane, label: 'Aeroporto' },
    { path: '/quimica', icon: FlaskConical, label: 'Quimica' },
    { path: '/alertas', icon: Bell, label: 'Alertas' },
    { path: '/relatorios', icon: FileText, label: 'Relatorios' },
    ...(user?.role === 'admin' ? [{ path: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];

  return (
    <aside className={`${isOpen ? 'w-56' : 'w-0'} transition-all duration-200 bg-surface border-r border-border overflow-hidden flex flex-col shrink-0`}>
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <Train size={18} className="text-accent" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text">MAQUETE IND</h1>
            <p className="text-[10px] text-muted uppercase tracking-wider">Controle</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent border-l-2 border-accent'
                  : 'text-muted hover:text-text hover:bg-surface'
              }`
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <span className="text-xs font-medium text-accent">{user?.username?.[0]?.toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text truncate">{user?.username}</p>
            <p className="text-[10px] text-muted uppercase">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 text-muted hover:text-danger hover:bg-danger/5 rounded-lg transition-colors text-sm"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
