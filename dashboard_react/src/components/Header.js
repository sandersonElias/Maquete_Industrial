import React from 'react';
import { Menu, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

export default function Header({ onToggleSidebar }) {
  const { connected } = useSocket();

  return (
    <header className="h-16 bg-maquete-surface border-b border-maquete-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="p-2 hover:bg-maquete-card rounded-lg">
          <Menu size={20} className="text-gray-400" />
        </button>
        <h2 className="text-lg font-semibold">Dashboard</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
          connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>{connected ? 'Online' : 'Offline'}</span>
        </div>

        <button className="p-2 text-maquete-warning hover:bg-maquete-warning/10 rounded-lg relative">
          <AlertTriangle size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-maquete-danger rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
