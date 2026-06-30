import React, { useState, useRef, useCallback, useEffect, createContext } from "react";
import { Alert, Platform, PermissionsAndroid } from "react-native";

let BT;
try {
  BT = require("react-native-bluetooth-classic").default;
} catch (e) {
  console.warn("BT nao instalado:", e.message);
}

export const BluetoothContext = createContext(null);

export function BluetoothProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [device, setDevice] = useState(null);
  const [paired, setPaired] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [lastCmd, setLastCmd] = useState("S");
  const connRef = useRef(null);

  useEffect(() => {
    initBT();
    return () => disconnect();
  }, []);

  const initBT = async () => {
    if (!BT) return;
    try {
      if (Platform.OS === "android" && Platform.Version >= 31) {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
      }
      const enabled = await BT.isBluetoothEnabled();
      if (!enabled) await BT.requestBluetoothEnabled();
    } catch (e) {
      console.error(e);
    }
  };

  const listPaired = async () => {
    try {
      const devs = await BT.getBondedDevices();
      setPaired(devs);
      setShowModal(true);
    } catch (e) {
      Alert.alert("Erro", e.message);
    }
  };

  const connectTo = async (dev) => {
    setShowModal(false);
    setConnecting(true);
    try {
      const conn = await BT.connectToDevice(dev.address);
      connRef.current = conn;
      setDevice(dev);
      setConnected(true);
    } catch (e) {
      Alert.alert("Falha", e.message);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      if (connRef.current) {
        await connRef.current.write("SC\n");
        await connRef.current.disconnect();
        connRef.current = null;
      }
    } catch (_) {}
    setConnected(false);
    setDevice(null);
  };

  const lastSendTimeRef = useRef(0);
  const lastSentCmdRef = useRef("");
  const SEND_THROTTLE_MS = 80;

  const send = useCallback(async (cmd) => {
    if (!connRef.current) return;

    const now = Date.now();
    const elapsed = now - lastSendTimeRef.current;
    if (elapsed < SEND_THROTTLE_MS && lastSentCmdRef.current === cmd) return;
    lastSendTimeRef.current = now;
    lastSentCmdRef.current = cmd;

    try {
      await connRef.current.write(cmd + "\n");
      setLastCmd(cmd);
    } catch (e) {
      setConnected(false);
      connRef.current = null;
    }
  }, []);

  const value = {
    connected,
    device,
    paired,
    showModal,
    setShowModal,
    connecting,
    lastCmd,
    listPaired,
    connectTo,
    disconnect,
    send,
  };

  return (
    <BluetoothContext.Provider value={value}>
      {children}
    </BluetoothContext.Provider>
  );
}
