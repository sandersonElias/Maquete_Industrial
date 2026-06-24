import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './pages/Overview';
import Ferrovia from './pages/Ferrovia';
import Mina from './pages/Mina';
import Porto from './pages/Porto';
import Aeroporto from './pages/Aeroporto';
import Relatorios from './pages/Relatorios';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

function AppContent() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user) {
    return <Login />;
  }

  return (
    <SocketProvider>
      <div className="flex h-screen bg-maquete-dark">
        <Sidebar isOpen={sidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/ferrovia" element={<Ferrovia />} />
              <Route path="/mina" element={<Mina />} />
              <Route path="/porto" element={<Porto />} />
              <Route path="/aeroporto" element={<Aeroporto />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
      <Toaster position="top-right" />
    </SocketProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
