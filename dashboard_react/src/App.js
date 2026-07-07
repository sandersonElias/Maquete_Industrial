import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
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

axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

function AppContent() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user) {
    return <Login />;
  }

  return (
    <SocketProvider>
      <div className="flex h-screen bg-bg">
        {/* Main Layout */}
        <div className="relative z-10 flex w-full h-full">
          <Sidebar isOpen={sidebarOpen} />
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <main className="flex-1 overflow-y-auto p-6 relative">
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
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1A1D27',
            color: '#E4E7EC',
            border: '1px solid #2A2D3A',
            borderRadius: '8px',
          },
        }}
      />
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
