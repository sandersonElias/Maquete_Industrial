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
  backendWsUrl: process.env.BACKEND_WS_URL,
  backendApiUrl: process.env.BACKEND_API_URL,
  apiKey: process.env.GATEWAY_API_KEY || "default_key",
  gatewayId: process.env.GATEWAY_ID || "gateway-rpi-01",
  reconnectInterval: parseInt(process.env.RECONNECT_INTERVAL) || 5000,
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL) || 3000,
  serialBaud: parseInt(process.env.SERIAL_BAUD) || 9600,
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
  }

  async connect() {
    try {
      // No Raspberry Pi, HC-05 aparece como /dev/rfcomm0, rfcomm1, etc.
      // Ou pode ser descoberto dinamicamente
      const portPath = await this.findSerialPort();

      if (!portPath) {
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

        // Notificar back-end
        notifyBackend("device:connected", {
          deviceName: this.name,
          macAddress: this.macAddress,
          type: this.type,
          port: portPath,
        });

        this.parser.on("data", (data) => {
          this.handleIncomingData(data);
        });

        this.port.on("close", () => {
          logger.warn(`Conexão fechada com ${this.name}`);
          this.connected = false;
          this.scheduleReconnect();
        });

        this.port.on("error", (err) => {
          logger.error(`Erro na porta ${this.name}: ${err.message}`);
        });
      });

      return true;
    } catch (error) {
      logger.error(`Erro ao conectar ${this.name}: ${error.message}`);
      this.scheduleReconnect();
      return false;
    }
  }

  async findSerialPort() {
    // Estrategia: listar portas seriais e procurar por rfcomm
    const { SerialPort: SP } = require("serialport");
    const ports = await SP.list();

    // No RPi com HC-05 emparelhado, geralmente aparece como /dev/rfcommX
    const rfcommPorts = ports.filter((p) => p.path.includes("rfcomm"));

    if (rfcommPorts.length > 0) {
      // Tentar associar por ordem ou por descricao
      // Simplificacao: retorna o primeiro rfcomm disponivel
      // Em producao, usar nome do dispositivo ou MAC para mapear
      return rfcommPorts[0].path;
    }

    return null;
  }

  handleIncomingData(data) {
    const trimmed = data.trim();
    if (!trimmed) return;

    this.lastSeen = Date.now();
    logger.debug(`[${this.name}] RX: ${trimmed}`);

    // Encaminhar para back-end via WebSocket
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.send(
        JSON.stringify({
          type: "device:data",
          gatewayId: CONFIG.gatewayId,
          deviceName: this.name,
          data: trimmed,
          timestamp: Date.now(),
        }),
      );
    }
  }

  sendCommand(command) {
    if (!this.connected || !this.port) {
      logger.error(`Não é possível enviar comando. ${this.name} desconectado.`);
      return false;
    }

    const cmd = command.endsWith("\n") ? command : command + "\n";
    this.port.write(cmd, (err) => {
      if (err) {
        logger.error(`Erro ao enviar para ${this.name}: ${err.message}`);
      } else {
        logger.info(`[${this.name}] TX: ${command}`);
      }
    });
    return true;
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      logger.info(`Tentando reconectar ${this.name}...`);
      this.connect();
    }, CONFIG.reconnectInterval);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.port) {
      this.port.close();
    }
    this.connected = false;
  }
}

// === GERENCIADOR DE DISPOSITIVOS ===
const devices = new Map();

function initDevices() {
  // Ferrovia (4 switches em 1 Arduino)
  const ferrovia = new BluetoothDevice(
    "FERROVIA_SW",
    process.env.BT_DEVICE_FERROVIA || "98:D3:31:FD:15:F5",
    "ferrovia",
  );
  devices.set("ferrovia", ferrovia);
  ferrovia.connect();

  // Caminhao 01
  const truck01 = new BluetoothDevice(
    "TRUCK_T01",
    process.env.BT_DEVICE_TRUCK01 || "98:D3:31:FD:15:A1",
    "truck",
  );
  devices.set("truck01", truck01);
  truck01.connect();
}

// === CLIENTE WEBSOCKET (BACK-END) ===
let wsClient = null;
let wsReconnectTimer = null;

function connectToBackend() {
  logger.info(`Conectando ao backend ${CONFIG.backendWsUrl}`);

  wsClient = io(CONFIG.backendWsUrl, {
    transports: ["websocket"],
  });

  wsClient.on("connect", () => {
    logger.info(`Conectado ao backend (${wsClient.id})`);

    wsClient.emit("gateway:register", {
      gatewayId: CONFIG.gatewayId,
      apiKey: CONFIG.apiKey,
    });
  });

  wsClient.on("gateway:registered", (data) => {
    logger.info(`Gateway registrado com sucesso`);

    sendGatewayStatus();
  });

  wsClient.on("command", (payload) => {
    handleCommand(payload);
  });

  wsClient.on("disconnect", () => {
    logger.warn("Backend desconectado");
  });
}

function scheduleWsReconnect() {
  if (wsReconnectTimer) return;
  wsReconnectTimer = setTimeout(() => {
    wsReconnectTimer = null;
    connectToBackend();
  }, CONFIG.reconnectInterval);
}

function handleBackendMessage(msg) {
  logger.info(`Comando do back-end: ${msg.type}`);

  switch (msg.type) {
    case "command":
      handleCommand(msg.payload);
      break;
    case "ping":
      wsClient.send(
        JSON.stringify({ type: "pong", gatewayId: CONFIG.gatewayId }),
      );
      break;
    case "request:status":
      sendGatewayStatus();
      break;
    default:
      logger.warn(`Tipo de mensagem desconhecido: ${msg.type}`);
  }
}

function handleCommand(payload) {
  const { target, cmd, switchId, angle, action } = payload;

  let device = null;
  if (target === "ferrovia" || target === "FERROVIA_SW") {
    device = devices.get("ferrovia");
  } else if (target.startsWith("TRUCK")) {
    device = devices.get("truck01"); // ou mapear dinamicamente
  }

  if (!device) {
    logger.error(`Dispositivo alvo não encontrado: ${target}`);
    return;
  }

  // Construir comando serial
  let serialCmd;
  if (cmd === "SWITCH") {
    if (angle !== undefined) {
      serialCmd = `CMD|SWITCH|${switchId}|ANGLE|${angle}`;
    } else if (action) {
      serialCmd = `CMD|SWITCH|${switchId}|SET|${action}`;
    }
  } else {
    serialCmd = cmd;
  }

  if (serialCmd) {
    device.sendCommand(serialCmd);
  }
}

function sendGatewayStatus() {
  if (!wsClient || wsClient.readyState !== WebSocket.OPEN) return;

  wsClient.send(
    JSON.stringify({
      type: "gateway:status",
      gatewayId: CONFIG.gatewayId,
      devices: Array.from(devices.values()).map((d) => ({
        name: d.name,
        connected: d.connected,
        lastSeen: d.lastSeen,
      })),
      timestamp: Date.now(),
    }),
  );
}

// === NOTIFICACAO HTTP (FALLBACK) ===
async function notifyBackend(eventType, data) {
  try {
    await axios.post(
      `${CONFIG.backendApiUrl}/gateway/notify`,
      {
        eventType,
        gatewayId: CONFIG.gatewayId,
        data,
      },
      {
        headers: { "x-api-key": CONFIG.apiKey },
      },
    );
  } catch (e) {
    logger.error(`Falha ao notificar back-end: ${e.message}`);
  }
}

// === HEARTBEAT DO GATEWAY ===
setInterval(() => {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    sendGatewayStatus();
  }

  // Verificar conexoes BT
  devices.forEach((device) => {
    if (!device.connected && !device.reconnectTimer) {
      device.connect();
    }
  });
}, CONFIG.heartbeatInterval);

// === INICIALIZACAO ===
logger.info("========================================");
logger.info("  GATEWAY BLUETOOTH - Maquete Industrial");
logger.info(`  ID: ${CONFIG.gatewayId}`);
logger.info("========================================");

initDevices();
connectToBackend();

// === GRACEFUL SHUTDOWN ===
process.on("SIGINT", () => {
  logger.info("Encerrando gateway...");
  devices.forEach((d) => d.disconnect());
  if (wsClient) wsClient.close();
  process.exit(0);
});
