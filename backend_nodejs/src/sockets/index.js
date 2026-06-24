const jwt = require("jsonwebtoken");
const { JWT_SECRET, GATEWAY_API_KEY } = require("../config");
const logger = require("../config/logger");
const ferroviaService = require("../services/ferroviaService");
const trucksService = require("../services/trucksService");
const { delRedisKey } = require("../services/redisService");

const dashboardClients = new Map();
const gatewayClients = new Map();

module.exports = (io) => {
  io.on("connection", (socket) => {
    logger.info(`Cliente conectado: ${socket.id}`);

    socket.on("authenticate", (data) => {
      try {
        const decoded = jwt.verify(data.token, JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.join("dashboard");
        dashboardClients.set(socket.id, socket);
        socket.emit("authenticated", { success: true });
        logger.info(`Dashboard autenticado: ${decoded.username}`);
      } catch (e) {
        socket.emit("authenticated", {
          success: false,
          error: "Token inválido",
        });
      }
    });

    socket.on("gateway:register", (data) => {
      if (data.apiKey !== GATEWAY_API_KEY) {
        socket.emit("gateway:error", { error: "API Key inválida" });
        return;
      }
      socket.gatewayId = data.gatewayId;
      socket.join("gateway");
      gatewayClients.set(socket.id, socket);
      socket.emit("gateway:registered", { success: true });
      logger.info(`Gateway registrado: ${data.gatewayId}`);
    });

    socket.on("gateway:data", (data) => {
      handleGatewayData(data, io);
    });

    socket.on("device:data", (data) => {
      handleGatewayData(data, io);
    });

    socket.on("disconnect", () => {
      dashboardClients.delete(socket.id);
      gatewayClients.delete(socket.id);
      logger.info(`Cliente desconectado: ${socket.id}`);
    });
  });
};

async function handleGatewayData(data, io) {
  try {
    const { deviceName, data: rawData } = data;

    if (!rawData || typeof rawData !== "string") {
      logger.warn(`Dado invalido do gateway ${deviceName || "desconhecido"}`);
      return;
    }

    if (rawData.startsWith("ACK|SWITCH")) {
      const parts = rawData.split("|");
      const switchId = parseInt(parts[2]);
      const state = parts[3];

      await ferroviaService.updateSwitchStatus(switchId, state);

      io.to("dashboard").emit("switch:update", {
        switchId,
        state,
        timestamp: Date.now(),
      });
    }

    if (rawData.startsWith("STATUS|SWITCH")) {
      const parts = rawData.split("|");
      const switchId = parseInt(parts[2]);
      const angle = parseInt(parts[3]);
      const state = parts[4];

      await ferroviaService.updateSwitchAngleAndState(switchId, angle, state);

      io.to("dashboard").emit("switch:status", {
        switchId,
        angle,
        state,
        timestamp: Date.now(),
      });
    }
  } catch (e) {
    logger.error(`Erro processando dados gateway: ${e.message}`);
  }
}
