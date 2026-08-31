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
      if (!data || !data.token) {
        socket.emit("authenticated", {
          success: false,
          error: "Token não fornecido",
        });
        return;
      }

      try {
        const decoded = jwt.verify(data.token, JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.join("dashboard");
        dashboardClients.set(socket.id, socket);
        socket.emit("authenticated", { success: true });
        logger.info(`Dashboard autenticado: ${decoded.username}`);
      } catch (e) {
        if (e.name === "TokenExpiredError") {
          socket.emit("authenticated", { success: false, error: "Token expirado" });
        } else {
          socket.emit("authenticated", { success: false, error: "Token inválido" });
        }
      }
    });

    socket.on("gateway:register", (data) => {
      if (!data || !data.apiKey) {
        socket.emit("gateway:error", { error: "API Key não fornecida" });
        return;
      }

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
      handleGatewayData(data, io, socket);
    });

    socket.on("device:data", (data) => {
      handleGatewayData(data, io, socket);
    });

    socket.on("disconnect", () => {
      dashboardClients.delete(socket.id);
      gatewayClients.delete(socket.id);
      logger.info(`Cliente desconectado: ${socket.id}`);
    });
  });
};

async function handleGatewayData(data, io, socket) {
  if (!socket.gatewayId) {
    logger.warn(`Dados ignorados de socket não registrado: ${socket.id}`);
    return;
  }

  try {
    const { deviceName, data: rawData } = data;

    if (!rawData || typeof rawData !== "string") {
      logger.warn(`Dado invalido do gateway ${deviceName || "desconhecido"}`);
      return;
    }

    const parts = rawData.split("|");
    if (parts.length < 3) {
      logger.warn(`Protocolo invalido: ${rawData}`);
      return;
    }

    if (rawData.startsWith("ACK|SWITCH")) {
      const switchId = parseInt(parts[2]);
      const state = parts[3];

      if (isNaN(switchId) || switchId < 1 || switchId > 3) {
        logger.warn(`switchId invalido no ACK: ${parts[2]}`);
        return;
      }

      await ferroviaService.updateSwitchStatus(switchId, state);

      io.to("dashboard").emit("switch:update", {
        switchId,
        state,
        timestamp: Date.now(),
      });
    }

    if (rawData.startsWith("STATUS|SWITCH")) {
      const switchId = parseInt(parts[2]);
      const angle = parseInt(parts[3]);
      const state = parts[4];

      if (isNaN(switchId) || switchId < 1 || switchId > 3) {
        logger.warn(`switchId invalido no STATUS: ${parts[2]}`);
        return;
      }

      await ferroviaService.updateSwitchAngleAndState(switchId, angle, state);

      io.to("dashboard").emit("switch:status", {
        switchId,
        angle,
        state,
        timestamp: Date.now(),
      });
    }

    // ── Sensores (EVENT|SENSOR|<id>|<DETECTED|CLEAR>|<ts>) ──
    if (rawData.startsWith("EVENT|SENSOR")) {
      const sensorId = parts[2];
      const state = parts[3];

      if (!sensorId || !["DETECTED", "CLEAR"].includes(state)) {
        logger.warn(`Evento de sensor invalido: ${rawData}`);
        return;
      }

      const active = state === "DETECTED";
      await ferroviaService.updateSensor(sensorId, active);

      io.to("dashboard").emit("sensor:update", {
        sensorId,
        active,
        timestamp: Date.now(),
      });

      logger.info(`Sensor ${sensorId}: ${state}`);
    }

    // ── Status completo dos sensores (STATUS|SENSOR|<id>|<0|1>|<ts>) ──
    if (rawData.startsWith("STATUS|SENSOR")) {
      const sensorId = parts[2];
      const active = parts[3] === "1";

      if (!sensorId) {
        logger.warn(`Status de sensor invalido: ${rawData}`);
        return;
      }

      await ferroviaService.updateSensor(sensorId, active);

      io.to("dashboard").emit("sensor:update", {
        sensorId,
        active,
        timestamp: Date.now(),
      });
    }

    // ── Semáforo (STATUS|GATE|<RED|YELLOW|GREEN>) ──
    if (rawData.startsWith("STATUS|GATE")) {
      const gateState = parts[2];

      if (!["RED", "YELLOW", "GREEN"].includes(gateState)) {
        logger.warn(`Estado do gate invalido: ${gateState}`);
        return;
      }

      await ferroviaService.setSemaphore(gateState);

      io.to("dashboard").emit("semaphore:update", {
        state: gateState,
        timestamp: Date.now(),
      });

      logger.info(`Semaforo: ${gateState}`);
    }

    // ── Dados do Caminhão ──
    if (rawData.startsWith("ACK|TRUCK")) {
      const action = parts[2];
      const truckId = deviceName.replace(/^TRUCK_/, "");

      if (truckId && action) {
        await trucksService.updateTruckCommandStatus(truckId, action);

        io.to("dashboard").emit("truck:ack", {
          truckId,
          action,
          timestamp: Date.now(),
        });

        logger.info(`ACK truck: ${truckId} - ${action}`);
      }
    }

    if (rawData.startsWith("STATUS|TRUCK") && parts[2] === "POS") {
      const truckId = deviceName.replace(/^TRUCK_/, "");
      const x = parseInt(parts[3]);
      const y = parseInt(parts[4]);
      const load = parseInt(parts[6]);
      const battery = parseInt(parts[8]);

      if (truckId && !isNaN(x) && !isNaN(y)) {
        await trucksService.updateTruckPosition(truckId, x, y, load || 0, battery || 0);

        io.to("dashboard").emit("truck:telemetry", {
          truckId,
          x,
          y,
          load: load || 0,
          battery: battery || 0,
          timestamp: Date.now(),
        });
      }
    }
  } catch (e) {
    logger.error(`Erro processando dados gateway: ${e.message}`);
  }
}
