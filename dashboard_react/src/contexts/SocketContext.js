import React, { createContext, useContext, useEffect, useState } from "react";
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

    newSocket.on("connect", () => {
      console.log("Socket conectado:", newSocket.id);
      setConnected(true);
      newSocket.emit("authenticate", { token });
    });

    newSocket.on("connect_error", (err) => {
      console.error(err);
      toast.error("Erro ao conectar ao servidor");
    });

    newSocket.on("authenticated", (data) => {
      console.log("Autenticado:", data);
      if (data.success) {
        toast.success("Conectado em tempo real");
      }
    });

    newSocket.on("switch:update", (data) => {
      toast.success(`Switch ${data.switchId}: ${data.state}`);
    });

    newSocket.on("truck:telemetry", (data) => {
      console.log("Telemetria recebida:", data);
    });

    newSocket.on("gateway:status", (data) => {
      if (!data.data.connected) {
        toast.error(`Gateway ${data.gatewayId} desconectado!`);
      }
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
      toast.error("Desconectado do servidor");
    });

    newSocket.on("teste", (data) => {
      console.log("EVENTO TESTE:", data);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
