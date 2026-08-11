import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");
    const newSocket = io(process.env.REACT_APP_API_URL, {
      autoConnect: true,
    });

    const onConnect = () => {
      setConnected(true);
      newSocket.emit("authenticate", { token });
    };

    const onConnectError = () => {
      toast.error("Erro ao conectar ao servidor");
    };

    const onAuthenticated = (data) => {
      if (data.success) {
        toast.success("Conectado em tempo real");
      }
    };

    const onGatewayStatus = (data) => {
      // Shape real: { gatewayId, devices: [{name, connected, ...}], timestamp }
      // Nao existe `data.data.connected` (bug original de aninhamento duplo).
      const devices = data?.devices;
      if (!Array.isArray(devices) || devices.length === 0) return;

      // So dispara alerta se TODOS os devices estiverem desconectados.
      const anyOnline = devices.some((d) => d.connected);
      if (!anyOnline) {
        toast.error(`Gateway ${data.gatewayId || ""} sem dispositivos conectados`);
      }
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    newSocket.on("connect", onConnect);
    newSocket.on("connect_error", onConnectError);
    newSocket.on("authenticated", onAuthenticated);
    newSocket.on("gateway:status", onGatewayStatus);
    newSocket.on("disconnect", onDisconnect);

    setSocket(newSocket);

    return () => {
      newSocket.off("connect", onConnect);
      newSocket.off("connect_error", onConnectError);
      newSocket.off("authenticated", onAuthenticated);
      newSocket.off("gateway:status", onGatewayStatus);
      newSocket.off("disconnect", onDisconnect);
      newSocket.close();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
