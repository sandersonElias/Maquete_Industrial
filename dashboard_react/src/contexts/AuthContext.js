import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { supabase, isSupabaseConfigured } from "../config/supabase";

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_API_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Se Supabase esta configurado, verificar sessao
      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${session.access_token}`;
          const stored = localStorage.getItem("user");
          setUser(stored ? JSON.parse(stored) : null);

          // Escutar mudancas de auth
          supabase.auth.onAuthStateChange((_event, newSession) => {
            if (newSession) {
              axios.defaults.headers.common["Authorization"] = `Bearer ${newSession.access_token}`;
            } else {
              delete axios.defaults.headers.common["Authorization"];
              setUser(null);
              localStorage.removeItem("user");
            }
          });
        }
      } else {
        // Fallback: auth local
        const token = localStorage.getItem("token");
        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const stored = localStorage.getItem("user");
          setUser(stored ? JSON.parse(stored) : null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (username, password) => {
    // Se Supabase esta configurado, usar Supabase Auth
    if (isSupabaseConfigured && supabase) {
      const email = username.includes("@") ? username : `${username}@maquete.local`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Buscar dados do usuario via API
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.session.access_token}`;
      const res = await axios.get(`${API_URL}/api/auth/me`);
      const userData = res.data.user;
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      return userData;
    }

    // Fallback: auth local
    const res = await axios.post(`${API_URL}/api/auth/login`, {
      username,
      password,
    });
    const { token, user: userData } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
