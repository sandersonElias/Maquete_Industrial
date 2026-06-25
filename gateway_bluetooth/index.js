/**
 * ============================================================
 *  GATEWAY BLUETOOTH - Raspberry Pi
 *  Ponte entre servidor Node.js e dispositivos HC-05
 * ============================================================
 */

const { io } = require("socket.io-client");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const axios = require("axios");
const winston = require("winston");
require("dotenv").config();

// === CONFIGURACAO ===
const CONFIG = {
  backendWsUrl: process.env.BACKEND_WS_URL || "http://localhost:4000",
  backendApiUrl: process.env.BACKEND_API_URL || "http://localhost:4000/api",
  apiKey: process.env.GATEWAY_API_KEY || "default_key",
  gatewayId: process.env.GATEWAY_ID || "gateway-rpi-01",
  reconnectInterval: parseInt(process.env.RECONNECT_INTERVAL) || 5000,
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL) || 3000,
  serialBaud: parseInt(process.env.SERIAL_BAUD) || 9600,
  simulationMode: process.env.SIMULATION_MODE === "true" || true,
};

// === LOGGER ===
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    }),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "gateway.log" }),
  ],
});

// === GERENCIADOR DE DISPOSITIVOS BLUETOOTH ===
class BluetoothDevice {
  constructor(name, macAddress, type) {
    this.name = name;
    this.macAddress = macAddress;
    this.type = type; // 'ferrovia' | 'truck'
    this.port = null;
    this.parser = null;
    this.connected = false;
    this.reconnectTimer = null;
    this.lastSeen = null;
    this.simTimer = null;
  }

  async connect() {
    try {
      const portPath = await this.findSerialPort();

      if (!portPath) {
        if (CONFIG.simulationMode) {
          this.startSimulation();
          return true;
        }
        logger.warn(
          `Dispositivo ${this.name} não encontrado. Tentando reconectar...`,
        );
        this.scheduleReconnect();
        return false;
      }

      this.port = new SerialPort({
        path: portPath,
        baudRate: CONFIG.serialBaud,
        autoOpen: false,
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: "\n" }));

      this.port.open((err) => {
        if (err) {
          logger.error(`Erro ao abrir porta ${portPath}: ${err.message}`);
          this.scheduleReconnect();
          return;
        }

        this.connected = true;
        this.lastSeen = Date.now();
        logger.info(`✅ Conectado a ${this.name} em ${portPath}`);

        notifyBackend("device:connected", {
          deviceName: this.name,
          macAddress: this.macAddress,
          type: this.type,
          port: portPath,
        });

        this.parser.on("data", (data) => this.handleIncomingData(data));
        this.port.on("close", () => {
          logger.warn(`Conexão fechada com ${this.name}`);
          this.connected = false;
          this.scheduleReconnect();
        });
        this.port.on("error", (err) =>
          logger.error(`Erro na porta ${this.name}: ${err.message}`),
        );
      });

      return true;
    } catch (error) {
      logger.error(`Erro ao conectar ${this.name}: ${error.message}`);
      this.scheduleReconnect();
      return false;
    }
  }

  startSimulation() {
    if (this.connected) return;
    this.connected = true;
    this.lastSeen = Date.now();
    logger.info(`🛠️ MODO SIMULAÇÃO: ${this.name} ativado virtualmente.`);

    // Simular dados vindo do Arduino a cada 10 segundos
    this.simTimer = setInterval(() => {
      let mockData = "";
      if (this.type === "ferrovia") {
        const id = Math.floor(Math.random() * 4) + 1;
        const angle = Math.random() > 0.5 ? 0 : 180;
        mockData = `STATUS|SWITCH|${id}|${angle}|${Date.now()}`;
      } else {
        mockData = `STATUS|TRUCK|LOADED|${Math.floor(Math.random() * 100)}`;
      }
      this.handleIncomingData(mockData);
    }, 10000);
  }

  async findSerialPort() {
    try {
      const ports = await SerialPort.list();
      const rfcommPorts = ports.filter((p) => p.path.includes("rfcomm"));
      return rfcommPorts.length > 0 ? rfcommPorts[0].path : null;
    } catch (e) {
      return null;
    }
  }

  handleIncomingData(data) {
    const trimmed = data.trim();
    if (!trimmed) return;

    this.lastSeen = Date.now();
    logger.debug(`[${this.name}] RX: ${trimmed}`);

    // CORREÇÃO: Usando Socket.io Client corretamente
    if (wsClient && wsClient.connected) {
      wsClient.emit("device:data", {
        gatewayId: CONFIG.gatewayId,
        deviceName: this.name,
        data: trimmed,
        timestamp: Date.now(),
      });
    }
  }

  sendCommand(command) {
    if (!this.connected) {
      logger.error(`Não é possível enviar comando. ${this.name} desconectado.`);
      return false;
    }

    if (CONFIG.simulationMode && !this.port) {
      logger.info(`[SIMULAÇÃO] ${this.name} recebeu: ${command}`);
      // Simular resposta ACK
      setTimeout(() => {
        this.handleIncomingData(`ACK|${command.replace("CMD|", "")}`);
      }, 500);
      return true;
    }

    const cmd = command.endsWith("\n") ? command : command + "\n";
    this.port.write(cmd, (err) => {
      if (err) logger.error(`Erro ao enviar para ${this.name}: ${err.message}`);
      else logger.info(`[${this.name}] TX: ${command}`);
    });
    return true;
  }

  scheduleReconnect() {
    if (this.reconnectTimer || this.connected) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      logger.info(`Tentando reconectar ${this.name}...`);
      this.connect();
    }, CONFIG.reconnectInterval);
  }

  disconnect() {
    if (this.simTimer) clearInterval(this.simTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.port) this.port.close();
    this.connected = false;
  }
}

// === GERENCIADOR DE DISPOSITIVOS ===
const devices = new Map();
let wsClient = null;

function initDevices() {
  const ferrovia = new BluetoothDevice(
    "FERROVIA_SW",
    process.env.BT_DEVICE_FERROVIA || "98:D3:31:FD:15:F5",
    "ferrovia",
  );
  devices.set("ferrovia", ferrovia);
  ferrovia.connect();

  const truck01 = new BluetoothDevice(
    "TRUCK_T01",
    process.env.BT_DEVICE_TRUCK01 || "98:D3:31:FD:15:A1",
    "truck",
  );
  devices.set("truck01", truck01);
  truck01.connect();
}

function connectToBackend() {
  logger.info(`Conectando ao backend ${CONFIG.backendWsUrl}`);
  wsClient = io(CONFIG.backendWsUrl, {
    transports: ["websocket"],
    reconnection: true,
  });

  wsClient.on("connect", () => {
    logger.info(`✅ Conectado ao backend (${wsClient.id})`);
    wsClient.emit("gateway:register", {
      gatewayId: CONFIG.gatewayId,
      apiKey: CONFIG.apiKey,
    });
  });

  wsClient.on("command", (payload) => handleCommand(payload));
  wsClient.on("disconnect", () => logger.warn("❌ Backend desconectado"));
  wsClient.on("connect_error", (err) =>
    logger.error(`Erro de conexão backend: ${err.message}`),
  );
}

function handleCommand(payload) {
  const { target, cmd, switchId, angle, action } = payload;
  let device = null;

  if (target === "ferrovia" || target === "FERROVIA_SW") {
    device = devices.get("ferrovia");
  } else if (target.startsWith("TRUCK")) {
    device = devices.get("truck01");
  }

  if (!device) {
    logger.error(`Dispositivo alvo não encontrado: ${target}`);
    return;
  }

  let serialCmd;
  if (cmd === "SWITCH") {
    if (angle !== undefined)
      serialCmd = `CMD|SWITCH|${switchId}|ANGLE|${angle}`;
    else if (action) serialCmd = `CMD|SWITCH|${switchId}|SET|${action}`;
  } else {
    serialCmd = cmd;
  }

  if (serialCmd) device.sendCommand(serialCmd);
}

function sendGatewayStatus() {
  if (!wsClient || !wsClient.connected) return;
  wsClient.emit("gateway:status", {
    gatewayId: CONFIG.gatewayId,
    devices: Array.from(devices.values()).map((d) => ({
      name: d.name,
      connected: d.connected,
      lastSeen: d.lastSeen,
      isSimulated: CONFIG.simulationMode && !d.port,
    })),
    timestamp: Date.now(),
  });
}

async function notifyBackend(eventType, data) {
  try {
    await axios.post(
      `${CONFIG.backendApiUrl}/gateway/notify`,
      {
        eventType,
        gatewayId: CONFIG.gatewayId,
        data,
      },
      { headers: { "x-api-key": CONFIG.apiKey } },
    );
  } catch (e) {
    logger.error(`Falha ao notificar back-end: ${e.message}`);
  }
}

// Heartbeat
setInterval(() => {
  sendGatewayStatus();
}, CONFIG.heartbeatInterval);

// Inicialização
logger.info("========================================");
logger.info(" GATEWAY BLUETOOTH - Maquete Industrial");
logger.info(` ID: ${CONFIG.gatewayId}`);
logger.info(` MODO SIMULAÇÃO: ${CONFIG.simulationMode}`);
logger.info("========================================");

initDevices();
connectToBackend();

process.on("SIGINT", () => {
  logger.info("Encerrando gateway...");
  devices.forEach((d) => d.disconnect());
  if (wsClient) wsClient.close();
  process.exit(0);
});
