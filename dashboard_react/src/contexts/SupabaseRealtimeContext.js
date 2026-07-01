import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../config/supabase";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const SupabaseRealtimeContext = createContext();

export function SupabaseRealtimeProvider({ children }) {
  const { user } = useAuth();
  const [switchUpdates, setSwitchUpdates] = useState([]);
  const [truckUpdates, setTruckUpdates] = useState([]);
  const [connected, setConnected] = useState(false);

  const handleSwitchChange = useCallback((payload) => {
    if (payload.eventType === "UPDATE") {
      setSwitchUpdates(prev => {
        const existing = prev.findIndex(u => u.id === payload.new.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = payload.new;
          return updated;
        }
        return [...prev, payload.new];
      });
    }
  }, []);

  const handleTruckTelemetry = useCallback((payload) => {
    if (payload.eventType === "INSERT") {
      setTruckUpdates(prev => [...prev.slice(-49), payload.new]);
    }
  }, []);

  const handleTruckUpdate = useCallback((payload) => {
    if (payload.eventType === "UPDATE") {
      setTruckUpdates(prev => {
        const existing = prev.findIndex(u => u.truck_id === payload.new.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], ...payload.new };
          return updated;
        }
        return [...prev, payload.new];
      });
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) return;

    const channel = supabase
      .channel("db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "switches" }, handleSwitchChange)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "truck_telemetry" }, handleTruckTelemetry)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "trucks" }, handleTruckUpdate)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
        } else if (status === "CHANNEL_ERROR") {
          setConnected(false);
          toast.error("Erro na conexao Realtime do Supabase");
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [user, handleSwitchChange, handleTruckTelemetry, handleTruckUpdate]);

  return (
    <SupabaseRealtimeContext.Provider value={{ switchUpdates, truckUpdates, connected }}>
      {children}
    </SupabaseRealtimeContext.Provider>
  );
}

export const useSupabaseRealtime = () => useContext(SupabaseRealtimeContext);
