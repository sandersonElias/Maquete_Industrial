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
    <aside className={`${isOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-maquete-surface border-r border-maquete-border overflow-hidden flex flex-col`}>
      <div className="p-6 border-b border-maquete-border">
        <h1 className="text-xl font-bold text-maquete-glow tracking-wider">
          MAQUETE<span className="text-white">IND</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">Central de Controle</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-maquete-accent/20 text-maquete-accent border border-maquete-accent/30'
                  : 'text-gray-400 hover:bg-maquete-card hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-maquete-border">
        <div className="px-4 py-2 mb-3">
          <p className="text-sm text-gray-400">{user?.username}</p>
          <p className="text-xs text-gray-600 uppercase">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-maquete-danger hover:bg-maquete-danger/10 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
