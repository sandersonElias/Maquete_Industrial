/**
 * ============================================================
 *  APP REACT NATIVE v2.0 - Telemetria + Controle Remoto
 *  Maquete Industrial - Módulo Caminhão Basculante
 * ============================================================
 *  MUDANÇAS v2.0:
 *    - Autenticação JWT com servidor central
 *    - Envio de telemetria via HTTP/WebSocket para API
 *    - Controle RC via API (com fallback Bluetooth local)
 *    - Buffer offline com envio em lote ao reconectar
 * ============================================================
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  TextInput,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { io } from "socket.io-client";
import NetInfo from "@react-native-community/netinfo";

// ── Bluetooth (fallback local) ──────────────────────────────
let BT;
try {
  BT = require("react-native-bluetooth-classic").default;
} catch (e) {
  console.warn("BT não instalado:", e.message);
}

// ── Configuração da API ─────────────────────────────────────
const API_BASE_URL = "http://192.168.1.100:3000/api"; // Ajustar IP do servidor
const WS_URL = "http://192.168.1.100:3000";
const TRUCK_ID = "T01";

// ── Paleta ──────────────────────────────────────────────────
const C = {
  bg: "#0D0F14",
  surface: "#161B26",
  card: "#1C2333",
  border: "#252D40",
  glow: "#00FFB2",
  fwd: "#00FFB2",
  rev: "#FF4560",
  left: "#FFB800",
  right: "#3D9EFF",
  stop: "#FF2D55",
  text: "#E8EEF8",
  textDim: "#4A5568",
  conn: "#00FFB2",
  disconn: "#FF4560",
  bucket: "#A855F7",
  api: "#3D9EFF",
};

export default function App() {
  // ── Estados de Autenticação ──────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // ── Estados de Conexão ───────────────────────────────────
  const [apiConnected, setApiConnected] = useState(false);
  const [btConnected, setBtConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  // ── Estados do Caminhão ──────────────────────────────────
  const [motorState, setMotorState] = useState("STOP");
  const [servoState, setServoState] = useState("C");
  const [bucketState, setBucketState] = useState("PARADO");
  const [lastCmd, setLastCmd] = useState("S");
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);

  // ── Estado de Telemetria ─────────────────────────────────
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [speed, setSpeed] = useState(0);
  const [load, setLoad] = useState(0);
  const [battery, setBattery] = useState(100);
  const [heading, setHeading] = useState(0);

  // ── Buffer Offline ───────────────────────────────────────
  const offlineBuffer = useRef([]);
  const telemetryTimer = useRef(null);
  const positionRef = useRef({ x: 0, y: 0 });

  // ── Bluetooth Refs ───────────────────────────────────────
  const btDeviceRef = useRef(null);
  const btConnRef = useRef(null);

  // ═══════════════════════════════════════════════════════════
  //  INICIALIZAÇÃO
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    checkStoredAuth();
    initNetworkListener();
    return () => {
      if (telemetryTimer.current) clearInterval(telemetryTimer.current);
      if (socket) socket.close();
      disconnectBT();
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn && token) {
      connectSocket();
      startTelemetry();
    }
  }, [isLoggedIn, token]);

  // ── Verificar Auth Armazenada ────────────────────────────
  const checkStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("auth_token");
      const storedUser = await AsyncStorage.getItem("auth_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setIsLoggedIn(true);
        axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      }
    } catch (e) {
      console.error("Erro ao verificar auth:", e);
    }
  };

  // ── Listener de Rede ─────────────────────────────────────
  const initNetworkListener = () => {
    NetInfo.addEventListener((state) => {
      if (state.isConnected && offlineBuffer.current.length > 0) {
        flushOfflineBuffer();
      }
    });
  };

  // ═══════════════════════════════════════════════════════════
  //  AUTENTICAÇÃO
  // ═══════════════════════════════════════════════════════════
  const login = async () => {
    if (!username || !password) {
      Alert.alert("Erro", "Preencha usuário e senha");
      return;
    }
    setLoginLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
      });
      const { token: newToken, user } = res.data;
      await AsyncStorage.setItem("auth_token", newToken);
      await AsyncStorage.setItem("auth_user", JSON.stringify(user));
      setToken(newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setIsLoggedIn(true);
      setLoginLoading(false);
    } catch (e) {
      setLoginLoading(false);
      Alert.alert("Erro", e.response?.data?.error || "Falha na autenticação");
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("auth_user");
    setToken(null);
    setIsLoggedIn(false);
    if (socket) socket.close();
    if (telemetryTimer.current) clearInterval(telemetryTimer.current);
  };

  // ═══════════════════════════════════════════════════════════
  //  SOCKET.IO (Tempo Real)
  // ═══════════════════════════════════════════════════════════
  const connectSocket = () => {
    const newSocket = io(WS_URL, {
      autoConnect: true,
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      setApiConnected(true);
      newSocket.emit("authenticate", { token });
    });

    newSocket.on("authenticated", (data) => {
      if (data.success) {
        console.log("Socket autenticado");
      }
    });

    newSocket.on("command", (data) => {
      // Receber comandos do dashboard operador
      if (data.truckId === TRUCK_ID) {
        handleRemoteCommand(data.cmd);
      }
    });

    newSocket.on("disconnect", () => {
      setApiConnected(false);
    });

    setSocket(newSocket);
  };

  // ═══════════════════════════════════════════════════════════
  //  TELEMETRIA
  // ═══════════════════════════════════════════════════════════
  const startTelemetry = () => {
    telemetryTimer.current = setInterval(() => {
      if (!telemetryEnabled) return;
      sendTelemetry();
    }, 1000); // Enviar a cada 1 segundo
  };

  const sendTelemetry = async () => {
    const payload = {
      truckId: TRUCK_ID,
      deltaX: (Math.random() - 0.5) * 2, // Simulação - substituir por GPS/real
      deltaY: (Math.random() - 0.5) * 2,
      speed: speed,
      load: load,
      battery: battery,
      heading: heading,
      timestamp: Date.now(),
    };

    // Atualizar posição acumulada
    positionRef.current = {
      x: positionRef.current.x + payload.deltaX,
      y: positionRef.current.y + payload.deltaY,
    };
    setPosition({ ...positionRef.current });

    // Tentar enviar via API
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      try {
        await axios.post(`${API_BASE_URL}/trucks/${TRUCK_ID}/telemetry`, payload);
        // Se havia buffer offline, enviar agora
        if (offlineBuffer.current.length > 0) {
          flushOfflineBuffer();
        }
      } catch (e) {
        console.error("Erro telemetria:", e.message);
        bufferTelemetry(payload);
      }
    } else {
      bufferTelemetry(payload);
    }
  };

  const bufferTelemetry = (payload) => {
    offlineBuffer.current.push(payload);
    if (offlineBuffer.current.length > 100) {
      offlineBuffer.current.shift(); // Limitar buffer
    }
  };

  const flushOfflineBuffer = async () => {
    const buffer = [...offlineBuffer.current];
    offlineBuffer.current = [];

    for (const payload of buffer) {
      try {
        await axios.post(`${API_BASE_URL}/trucks/${TRUCK_ID}/telemetry`, payload);
      } catch (e) {
        offlineBuffer.current.push(payload); // Re-buffer em falha
        break;
      }
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  CONTROLE DO CAMINHÃO (via API + Fallback BT)
  // ═══════════════════════════════════════════════════════════
  const move = async (cmd) => {
    setLastCmd(cmd);
    if (cmd === "F") setMotorState("FRENTE");
    else if (cmd === "B") setMotorState("RÉ");
    else if (cmd === "S") setMotorState("STOP");

    // Enviar para servidor (auditoria + controle remoto)
    try {
      await axios.post(`${API_BASE_URL}/trucks/${TRUCK_ID}/command`, { command: cmd });
    } catch (e) {
      // Fallback para Bluetooth local
      sendBTCommand(cmd);
    }
  };

  const steer = async (cmd) => {
    setLastCmd(cmd);
    if (cmd === "L") setServoState("ESQ");
    else if (cmd === "R") setServoState("DIR");
    else if (cmd === "C") setServoState("CENTRO");

    try {
      await axios.post(`${API_BASE_URL}/trucks/${TRUCK_ID}/command`, { command: cmd });
    } catch (e) {
      sendBTCommand(cmd);
    }
  };

  const bucket = async (cmd) => {
    setLastCmd(cmd);
    if (cmd === "U") setBucketState("SUBINDO");
    else if (cmd === "D") setBucketState("DESCENDO");
    else if (cmd === "X") setBucketState("PARADO");

    try {
      await axios.post(`${API_BASE_URL}/trucks/${TRUCK_ID}/command`, { command: cmd });
    } catch (e) {
      sendBTCommand(cmd);
    }
  };

  const handleRemoteCommand = (cmd) => {
    // Executar comando recebido do operador via dashboard
    switch (cmd) {
      case "F": case "B": case "S": move(cmd); break;
      case "L": case "R": case "C": steer(cmd); break;
      case "U": case "D": case "X": bucket(cmd); break;
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  BLUETOOTH (Fallback Local)
  // ═══════════════════════════════════════════════════════════
  const initBT = async () => {
    if (!BT) return;
    try {
      if (Platform.OS === "android" && Platform.Version >= 31) {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        ]);
      }
      const enabled = await BT.isBluetoothEnabled();
      if (!enabled) await BT.requestBluetoothEnabled();
    } catch (e) {
      console.error(e);
    }
  };

  const connectBT = async () => {
    if (!BT) {
      Alert.alert("Bluetooth", "Módulo Bluetooth não disponível");
      return;
    }
    try {
      const devs = await BT.getBondedDevices();
      const truckDevice = devs.find(d => d.name?.includes("TRUCK") || d.name?.includes("HC-05"));
      if (!truckDevice) {
        Alert.alert("Erro", "Dispositivo TRUCK não encontrado. Verifique o pareamento.");
        return;
      }
      const conn = await BT.connectToDevice(truckDevice.address);
      btConnRef.current = conn;
      btDeviceRef.current = truckDevice;
      setBtConnected(true);
    } catch (e) {
      Alert.alert("Falha BT", e.message);
    }
  };

  const disconnectBT = async () => {
    try {
      if (btConnRef.current) {
        await btConnRef.current.disconnect();
        btConnRef.current = null;
      }
    } catch (_) {}
    setBtConnected(false);
  };

  const sendBTCommand = async (cmd) => {
    if (!btConnRef.current) return;
    try {
      await btConnRef.current.write(cmd);
    } catch (e) {
      console.error("Erro BT:", e);
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  TELA DE LOGIN
  // ═══════════════════════════════════════════════════════════
  if (!isLoggedIn) {
    return (
      <View style={styles.loginRoot}>
        <StatusBar hidden />
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>MAQUETE INDUSTRIAL</Text>
          <Text style={styles.loginSubtitle}>Caminhão Basculante - Telemetria</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Usuário</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="admin"
              placeholderTextColor={C.textDim}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••"
              placeholderTextColor={C.textDim}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loginLoading && { opacity: 0.5 }]}
            onPress={login}
            disabled={loginLoading}
          >
            {loginLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.loginBtnText}>ENTRAR</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.loginHint}>
            Servidor: {API_BASE_URL.replace("/api", "")}
          </Text>
        </View>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  TELA PRINCIPAL (Controle + Telemetria)
  // ═══════════════════════════════════════════════════════════
  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>TRUCK {TRUCK_ID}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: apiConnected ? C.conn : C.disconn }]} />
            <Text style={styles.statusText}>{apiConnected ? "API Online" : "API Offline"}</Text>
            <View style={[styles.statusDot, { backgroundColor: btConnected ? C.conn : C.disconn, marginLeft: 12 }]} />
            <Text style={styles.statusText}>{btConnected ? "BT Online" : "BT Offline"}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>SAIR</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* PAINEL DE TELEMETRIA */}
        <View style={styles.telemetryPanel}>
          <Text style={styles.panelTitle}>TELEMETRIA</Text>
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>POS X</Text>
              <Text style={styles.telemetryValue}>{position.x.toFixed(2)}</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>POS Y</Text>
              <Text style={styles.telemetryValue}>{position.y.toFixed(2)}</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>VELOCIDADE</Text>
              <Text style={styles.telemetryValue}>{speed.toFixed(1)}</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>BATERIA</Text>
              <Text style={[styles.telemetryValue, { color: battery > 30 ? C.glow : C.stop }]}>
                {battery}%
              </Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>CARGA</Text>
              <Text style={styles.telemetryValue}>{load}kg</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>BUFFER</Text>
              <Text style={styles.telemetryValue}>{offlineBuffer.current.length}</Text>
            </View>
          </View>

          <View style={styles.telemetryToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, telemetryEnabled && styles.toggleBtnActive]}
              onPress={() => setTelemetryEnabled(!telemetryEnabled)}
            >
              <Text style={styles.toggleText}>
                {telemetryEnabled ? "TELEMETRIA: ON" : "TELEMETRIA: OFF"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CONTROLES */}
        <View style={styles.controlsRow}>
          {/* TRAÇÃO */}
          <View style={styles.controlSide}>
            <Text style={styles.sideTitle}>TRAÇÃO</Text>
            <TouchableOpacity
              style={[styles.btnArrow, { backgroundColor: C.fwd }]}
              onPressIn={() => move("F")}
              onPressOut={() => move("S")}
            >
              <Text style={styles.arrowIcon}>▲</Text>
            </TouchableOpacity>
            <View style={styles.stateTag}>
              <Text style={styles.stateText}>{motorState}</Text>
            </View>
            <TouchableOpacity
              style={[styles.btnArrow, { backgroundColor: C.rev }]}
              onPressIn={() => move("B")}
              onPressOut={() => move("S")}
            >
              <Text style={styles.arrowIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* CENTRO - CAÇAMBA + STOP */}
          <View style={styles.controlCenter}>
            <View style={styles.bucketBox}>
              <Text style={styles.bucketLabel}>CAÇAMBA: {bucketState}</Text>
              <View style={styles.bucketRow}>
                <TouchableOpacity
                  style={[styles.btnBucket, { backgroundColor: C.bucket }]}
                  onPressIn={() => bucket("U")}
                  onPressOut={() => bucket("X")}
                >
                  <Text style={styles.btnBucketText}>SUBIR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnBucket, { backgroundColor: C.bucket }]}
                  onPressIn={() => bucket("D")}
                  onPressOut={() => bucket("X")}
                >
                  <Text style={styles.btnBucketText}>DESCER</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.btnStop} onPress={() => move("S")}>
              <Text style={styles.btnStopText}>STOP</Text>
            </TouchableOpacity>

            <Text style={styles.cmdMonitor}>
              ÚLTIMO CMD: <Text style={{ color: C.glow }}>{lastCmd}</Text>
            </Text>
          </View>

          {/* DIREÇÃO */}
          <View style={styles.controlSide}>
            <Text style={styles.sideTitle}>DIREÇÃO</Text>
            <View style={styles.steerRow}>
              <TouchableOpacity
                style={[styles.btnArrow, { backgroundColor: C.left }]}
                onPressIn={() => steer("L")}
                onPressOut={() => steer("C")}
              >
                <Text style={styles.arrowIcon}>◀</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnArrow, { backgroundColor: C.right }]}
                onPressIn={() => steer("R")}
                onPressOut={() => steer("C")}
              >
                <Text style={styles.arrowIcon}>▶</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.stateTag}>
              <Text style={styles.stateText}>{servoState}</Text>
            </View>
          </View>
        </View>

        {/* BT FALLBACK */}
        <View style={styles.btPanel}>
          <Text style={styles.panelTitle}>BLUETOOTH (FALLBACK)</Text>
          <View style={styles.btRow}>
            <TouchableOpacity
              style={[styles.btBtn, btConnected && styles.btBtnActive]}
              onPress={btConnected ? disconnectBT : connectBT}
            >
              <Text style={styles.btBtnText}>
                {btConnected ? "DESCONECTAR BT" : "CONECTAR BT"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.btHint}>
              Use quando sem conexão Wi-Fi/4G com o servidor
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  // Login
  loginRoot: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loginCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: C.border,
  },
  loginTitle: {
    color: C.glow,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 2,
  },
  loginSubtitle: {
    color: C.textDim,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: C.textDim, fontSize: 12, marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 14,
  },
  loginBtn: {
    backgroundColor: C.api,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  loginBtnText: { color: "#FFF", fontWeight: "900", fontSize: 14 },
  loginHint: { color: C.textDim, fontSize: 10, textAlign: "center", marginTop: 16 },

  // Principal
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 15, paddingBottom: 30 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerLeft: { flex: 1 },
  headerTitle: { color: C.glow, fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { color: C.textDim, fontSize: 10 },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.card, borderRadius: 8 },
  logoutText: { color: C.disconn, fontSize: 10, fontWeight: "700" },

  // Telemetria
  telemetryPanel: {
    backgroundColor: C.surface,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: C.border,
  },
  panelTitle: {
    color: C.textDim,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 12,
  },
  telemetryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  telemetryItem: {
    backgroundColor: C.card,
    borderRadius: 10,
    padding: 10,
    minWidth: 80,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  telemetryLabel: { color: C.textDim, fontSize: 9, fontWeight: "700", marginBottom: 4 },
  telemetryValue: { color: C.text, fontSize: 16, fontWeight: "900" },
  telemetryToggle: { marginTop: 12, alignItems: "center" },
  toggleBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  toggleBtnActive: { backgroundColor: C.glow + "30", borderColor: C.glow },
  toggleText: { color: C.text, fontSize: 11, fontWeight: "700" },

  // Controles
  controlsRow: { flexDirection: "row", gap: 10, marginBottom: 15 },
  controlSide: { width: 120, alignItems: "center", justifyContent: "center", gap: 8 },
  controlCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  sideTitle: { color: C.textDim, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  btnArrow: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowIcon: { fontSize: 24, color: "#FFF" },
  steerRow: { flexDirection: "row", gap: 8 },
  stateTag: {
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  stateText: { color: C.text, fontSize: 11, fontWeight: "900" },
  bucketBox: {
    width: "100%",
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  bucketLabel: { color: C.textDim, fontSize: 10, fontWeight: "800", marginBottom: 8 },
  bucketRow: { flexDirection: "row", gap: 10, width: "100%" },
  btnBucket: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  btnBucketText: { color: "#FFF", fontWeight: "900", fontSize: 12 },
  btnStop: {
    width: "70%",
    paddingVertical: 10,
    backgroundColor: C.stop,
    borderRadius: 10,
    alignItems: "center",
  },
  btnStopText: { color: "#FFF", fontWeight: "900", fontSize: 13 },
  cmdMonitor: { fontSize: 10, color: C.textDim },

  // BT Fallback
  btPanel: {
    backgroundColor: C.surface,
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: C.border,
  },
  btRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  btBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  btBtnActive: { backgroundColor: C.conn + "30", borderColor: C.conn },
  btBtnText: { color: C.text, fontSize: 11, fontWeight: "700" },
  btHint: { color: C.textDim, fontSize: 10, flex: 1 },
});
