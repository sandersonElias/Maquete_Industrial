const { io } = require("socket.io-client");
const axios = require("axios");
const { CONFIG, logger } = require("./config");

function connectToBackend(deviceManager) {
  logger.info(`Conectando ao backend ${CONFIG.backendWsUrl}`);
  const wsClient = io(CONFIG.backendWsUrl, {
    transports: ["websocket"],
    reconnection: true,
  });

  wsClient.on("connect", () => {
    logger.info(`Conectado ao backend (${wsClient.id})`);
    wsClient.emit("gateway:register", {
      gatewayId: CONFIG.gatewayId,
      apiKey: CONFIG.apiKey,
    });
  });

  wsClient.on("reconnect", () => {
    logger.info("Reconectado ao backend, re-registrando...");
    wsClient.emit("gateway:register", {
      gatewayId: CONFIG.gatewayId,
      apiKey: CONFIG.apiKey,
    });
  });

  wsClient.on("command", (payload) => handleCommand(payload, deviceManager));
  wsClient.on("disconnect", () => logger.warn("Backend desconectado"));
  wsClient.on("connect_error", (err) =>
    logger.error(`Erro de conexao backend: ${err.message}`),
  );

  return wsClient;
}

function handleCommand(payload, deviceManager) {
  const { target, cmd, switchId, angle, action } = payload;

  const device = deviceManager.resolveTarget(target);
  if (!device) {
    logger.error(`Device alvo nao encontrado: ${target}`);
    return;
  }

  if (cmd === "SWITCH") {
    device.sendSwitchCommand(switchId, action || "SET", angle);
  } else if (cmd === "TRUCK" || device.type === "truck") {
    device.sendTruckCommand(action);
  } else {
    logger.warn(`Comando desconhecido: ${cmd}`);
  }
}

function sendGatewayStatus(wsClient, deviceManager) {
  if (!wsClient || !wsClient.connected) return;
  wsClient.emit("gateway:status", {
    gatewayId: CONFIG.gatewayId,
    devices: deviceManager.getAll().map((d) => ({
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
    logger.error(`Falha ao notificar backend: ${e.message}`);
  }
}

module.exports = { connectToBackend, sendGatewayStatus, notifyBackend };
