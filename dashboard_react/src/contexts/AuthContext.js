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
      try {
        // Verificar sessao Supabase ativa
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${session.access_token}`;
            const stored = localStorage.getItem("user");
            if (stored) {
              setUser(JSON.parse(stored));
            }

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
          // Auth local via token
          const token = localStorage.getItem("token");
          if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            const stored = localStorage.getItem("user");
            if (stored) {
              setUser(JSON.parse(stored));
            }
          }
        }
      } catch (e) {
        console.error("Erro ao inicializar auth:", e);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (username, password) => {
    // Sempre tentar login via backend (ele decide se usa Supabase ou local)
    const res = await axios.post(`${API_URL}/api/auth/login`, {
      username,
      password,
    });
    const { token, refreshToken, user: userData } = res.data;

    // Se o backend retornou um token Supabase, configurar sessao
    if (refreshToken && isSupabaseConfigured && supabase) {
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken,
      });
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    localStorage.setItem("user", JSON.stringify(userData));
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