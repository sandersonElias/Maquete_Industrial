import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Train, Truck, Ship, Plane, FileText, LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ isOpen }) {
  const { logout, user } = useAuth();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Visão Geral' },
    { path: '/ferrovia', icon: Train, label: 'Ferrovia' },
    { path: '/mina', icon: Truck, label: 'Mina' },
    { path: '/porto', icon: Ship, label: 'Porto' },
    { path: '/aeroporto', icon: Plane, label: 'Aeroporto' },
    { path: '/relatorios', icon: FileText, label: 'Relatórios' },
  ];

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out bg-maquete-surface border-r border-maquete-border overflow-hidden flex flex-col shrink-0`}>
      <div className="p-6 border-b border-maquete-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-maquete-glow/10 border border-maquete-glow/20 flex items-center justify-center">
            <Train size={18} className="text-maquete-glow" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-maquete-glow">MAQUETE</span>
              <span className="text-white">IND</span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Central de Controle</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-maquete-accent/15 text-maquete-accent border border-maquete-accent/25 shadow-[0_0_12px_rgba(61,158,255,0.1)]'
                  : 'text-gray-400 hover:bg-maquete-card hover:text-white border border-transparent'
              }`
            }
          >
            <item.icon size={18} className="shrink-0" />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-maquete-border">
        <div className="px-4 py-2 mb-2">
          <p className="text-sm font-medium text-gray-300 truncate">{user?.username}</p>
          <p className="text-[10px] text-gray-600 uppercase tracking-wider">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-400 hover:text-maquete-danger hover:bg-maquete-danger/10 rounded-lg transition-all duration-200"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}
