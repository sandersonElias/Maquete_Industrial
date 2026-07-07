import React, { useState, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

export default function Header({ onToggleSidebar }) {
  const { connected } = useSocket();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d) =>
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = (d) =>
    d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-5">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 hover:bg-card rounded-lg transition-colors"
        >
          <Menu size={18} className="text-muted" />
        </button>
        <div>
          <p className="text-[11px] text-muted uppercase tracking-wider">{formatDate(time)}</p>
          <p className="text-base font-mono font-medium text-text">{formatTime(time)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs ${
          connected
            ? 'bg-success/10 text-success'
            : 'bg-danger/10 text-danger'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-success' : 'bg-danger'}`} />
          <span className="font-medium">{connected ? 'Online' : 'Offline'}</span>
        </div>

        <button className="p-1.5 text-muted hover:text-warning hover:bg-warning/5 rounded-lg transition-colors relative">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
