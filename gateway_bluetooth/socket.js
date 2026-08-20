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

  wsClient.on("command", (payload) => handleCommand(payload, deviceManager));
  wsClient.on("disconnect", () => logger.warn("Backend desconectado"));
  wsClient.on("connect_error", (err) =>
    logger.error(`Erro de conexao backend: ${err.message}`),
  );

  return wsClient;
}

function handleCommand(rawPayload, deviceManager) {
  const payload = rawPayload.payload || rawPayload;
  const { target, cmd, switchId, angle, action, command } = payload;

  if (!target) {
    logger.error(`Comando sem target: ${JSON.stringify(rawPayload)}`);
    return;
  }

  const device = deviceManager.resolveTarget(target);
  if (!device) {
    logger.error(`Device alvo nao encontrado: ${target}`);
    return;
  }

  if (cmd === "SWITCH") {
    if (device.type !== "ferrovia") {
      logger.warn(`Comando SWITCH enviado para device nao-ferrovia: ${device.name}`);
      return;
    }
    const id = parseInt(switchId, 10);
    if (isNaN(id) || id < 1 || id > 3) {
      logger.warn(`switchId invalido: ${switchId}`);
      return;
    }
    device.sendSwitchCommand(id, action || "SET", angle);
  } else if (cmd === "TRUCK" || device.type === "truck") {
    if (device.type !== "truck") {
      logger.warn(`Comando TRUCK enviado para device nao-truck: ${device.name}`);
      return;
    }
    // Backend envia `command`; alguns clientes legados enviam `action`.
    const truckAction = command || action;
    if (!truckAction) {
      logger.warn(`Comando TRUCK sem action/command: ${JSON.stringify(payload)}`);
      return;
    }
    device.sendTruckCommand(truckAction);
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
