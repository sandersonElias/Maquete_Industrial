const logger = require("../config/logger");

module.exports = (io) => ({
  async postGatewayNotify(req, res) {
    try {
      const { eventType, gatewayId, data } = req.body;
      logger.info(`Notificação gateway ${gatewayId}: ${eventType}`);

      io.emit("gateway:status", {
        gatewayId,
        eventType,
        data,
        timestamp: Date.now(),
      });

      res.json({ success: true });
    } catch (e) {
      logger.error(`Erro ao notificar gateway: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },
});
