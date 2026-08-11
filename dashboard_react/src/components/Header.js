import React, { useState, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Header({ onToggleSidebar }) {
  const { socket, connected } = useSocket();
  const [time, setTime] = useState(new Date());
  const [pendingAlerts, setPendingAlerts] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Buscar alertas pendentes
  useEffect(() => {
    fetchPendingAlerts();
    const interval = setInterval(fetchPendingAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Socket.IO para novos alertas
  useEffect(() => {
    if (!socket) return;

    const handleNewAlert = () => {
      setPendingAlerts(prev => prev + 1);
    };

    const handleAcknowledged = () => {
      setPendingAlerts(prev => Math.max(0, prev - 1));
    };

    socket.on('alert:new', handleNewAlert);
    socket.on('alert:acknowledged', handleAcknowledged);

    return () => {
      socket.off('alert:new', handleNewAlert);
      socket.off('alert:acknowledged', handleAcknowledged);
    };
  }, [socket]);

  const fetchPendingAlerts = async () => {
    try {
      const res = await axios.get('/api/alerts?acknowledged=false&limit=100');
      const data = res.data.alerts || res.data;
      setPendingAlerts(Array.isArray(data) ? data.length : 0);
    } catch (e) {
      // Silently fail
    }
  };

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

        <button
          onClick={() => navigate('/alertas')}
          className="p-1.5 text-muted hover:text-warning hover:bg-warning/5 rounded-lg transition-colors relative"
        >
          <Bell size={18} />
          {pendingAlerts > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[9px] text-white flex items-center justify-center font-bold">
              {pendingAlerts > 9 ? '9+' : pendingAlerts}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
