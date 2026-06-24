const trucksService = require("../services/trucksService");
const { isValidTruckCommand } = require("../utils/validation");
const logger = require("../config/logger");

module.exports = (io) => ({
  async postTelemetry(req, res) {
    try {
      const { id } = req.params;
      const { deltaX, deltaY, speed, load, battery, heading } = req.body;

      const position = await trucksService.recordTelemetry(
        id,
        deltaX,
        deltaY,
        speed,
        load,
        battery,
        heading,
      );

      io.emit("truck:telemetry", {
        truckId: id,
        x: position.x,
        y: position.y,
        speed,
        load,
        battery,
        heading,
        timestamp: Date.now(),
      });

      res.json({ success: true, position });
    } catch (e) {
      logger.error(`Erro telemetria: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },

  async getTrucks(req, res) {
    try {
      const trucks = await trucksService.getTrucks();
      res.json(trucks);
    } catch (e) {
      logger.error(`Erro ao obter caminhões: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },

  async postTruckCommand(req, res) {
    try {
      const { id } = req.params;
      const { command } = req.body;

      if (!isValidTruckCommand(command)) {
        return res.status(400).json({ error: "Comando do caminhao invalido" });
      }

      const truckCommand = await trucksService.sendTruckCommand(
        id,
        command,
        req.user.id,
      );

      io.to("gateway").emit("command", {
        type: "command",
        payload: {
          target: `TRUCK_${id}`,
          cmd: "TRUCK_COMMAND",
          truckId: id,
          command,
          commandId: truckCommand.id,
        },
      });

      io.to("dashboard").emit("truck:command", {
        truckId: id,
        command,
        status: "pending",
        commandId: truckCommand.id,
        timestamp: Date.now(),
      });

      res.json({ success: true, command: truckCommand });
    } catch (e) {
      logger.error(`Erro comando caminhao: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },
});
