import React, { useState, useEffect } from 'react';
import { Menu, Wifi, WifiOff, Bell, Settings } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

export default function Header({ onToggleSidebar }) {
  const { connected } = useSocket();
  const [time, setTime] = useState(new Date());
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d) =>
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = (d) =>
    d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  return (
    <header className="h-16 bg-maquete-surface/80 backdrop-blur-md border-b border-maquete-border flex items-center justify-between px-6 relative z-20">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-maquete-glow/20 to-transparent" />

      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-maquete-card/80 rounded-xl transition-all duration-200 border border-transparent hover:border-maquete-border/50"
        >
          <Menu size={20} className="text-gray-400" />
        </button>
        <div className="hidden sm:block">
          <p className="text-xs text-gray-500 uppercase tracking-wider">{formatDate(time)}</p>
          <p className="text-lg font-mono font-semibold text-white">{formatTime(time)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Connection Status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all duration-300 ${
          connected
            ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
            : 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(255,69,96,0.1)]'
        }`}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-xs font-medium">{connected ? 'Online' : 'Offline'}</span>
        </div>

        {/* Notifications */}
        <button className="p-2 text-gray-400 hover:text-maquete-warning hover:bg-maquete-warning/10 rounded-xl transition-all duration-200 relative border border-transparent hover:border-maquete-warning/20">
          <Bell size={20} />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-maquete-danger text-white text-[10px] font-bold rounded-full px-1 shadow-lg shadow-maquete-danger/30">
              {alertCount > 99 ? '99+' : alertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
