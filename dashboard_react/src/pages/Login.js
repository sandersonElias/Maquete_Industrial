import React, { useState } from 'react';
import { Train } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Bem-vindo!');
    } catch (err) {
      toast.error('Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-maquete-dark">
      <div className="w-full max-w-md p-8 bg-maquete-surface rounded-2xl border border-maquete-border">
        <div className="text-center mb-8">
          <Train size={48} className="mx-auto text-maquete-glow mb-4" />
          <h1 className="text-2xl font-bold">Maquete Industrial</h1>
          <p className="text-gray-500 mt-2">Central de Controle</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-maquete-card border border-maquete-border rounded-lg focus:border-maquete-accent focus:outline-none"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-maquete-card border border-maquete-border rounded-lg focus:border-maquete-accent focus:outline-none"
              placeholder="••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-maquete-accent hover:bg-blue-600 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
