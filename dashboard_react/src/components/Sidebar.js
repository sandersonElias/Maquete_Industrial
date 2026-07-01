import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Train, Truck, Ship, Plane, FileText, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ isOpen }) {
  const { logout, user } = useAuth();
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Visão Geral', color: '#00FFB2' },
    { path: '/ferrovia', icon: Train, label: 'Ferrovia', color: '#3D9EFF' },
    { path: '/mina', icon: Truck, label: 'Mina', color: '#FFB800' },
    { path: '/porto', icon: Ship, label: 'Porto', color: '#A855F7' },
    { path: '/aeroporto', icon: Plane, label: 'Aeroporto', color: '#22C55E' },
    { path: '/relatorios', icon: FileText, label: 'Relatórios', color: '#FF4560' },
  ];

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out bg-maquete-surface/95 backdrop-blur-md border-r border-maquete-border overflow-hidden flex flex-col shrink-0 relative`}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-maquete-accent/3 to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="p-6 border-b border-maquete-border relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-maquete-glow/20 to-maquete-accent/20 border border-maquete-glow/30 flex items-center justify-center shadow-lg shadow-maquete-glow/10">
            <Train size={20} className="text-maquete-glow" />
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

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 relative z-10">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onMouseEnter={() => setHoveredItem(item.path)}
            onMouseLeave={() => setHoveredItem(null)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                isActive
                  ? 'text-white border border-transparent'
                  : 'text-gray-400 hover:text-white border border-transparent hover:border-maquete-border/50'
              }`
            }
            style={({ isActive }) => isActive ? {
              background: `linear-gradient(135deg, ${item.color}15, ${item.color}08)`,
              borderColor: `${item.color}30`,
              boxShadow: `0 0 20px ${item.color}10, inset 0 0 20px ${item.color}05`,
            } : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                    style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}60` }}
                  />
                )}
                <item.icon size={18} className="shrink-0 transition-transform group-hover:scale-110" style={isActive ? { color: item.color } : undefined} />
                <span className="font-medium text-sm">{item.label}</span>
                {hoveredItem === item.path && !isActive && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full opacity-50" style={{ backgroundColor: item.color }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-maquete-border relative z-10">
        <div className="px-4 py-3 mb-2 bg-maquete-card/50 rounded-xl border border-maquete-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-maquete-accent/20 to-maquete-purple/20 border border-maquete-accent/30 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{user?.username?.[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-200 truncate">{user?.username}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-400 hover:text-maquete-danger hover:bg-maquete-danger/10 rounded-xl transition-all duration-200 border border-transparent hover:border-maquete-danger/20"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}
