const locomotiveService = require("../services/locomotiveService");
const logger = require("../config/logger");

module.exports = (io) => ({
  // POST /api/locomotive/position - Registrar posição
  async postLocomotivePosition(req, res) {
    try {
      const { x, y, speed, heading, trackSegment } = req.body;

      const position = await locomotiveService.recordLocomotivePosition(
        x, y, speed, heading, trackSegment,
      );

      io.emit("locomotive:update", {
        x: position.x,
        y: position.y,
        speed: position.speed,
        heading: position.heading,
        trackSegment: position.trackSegment,
        timestamp: Date.now(),
      });

      res.json({ success: true, position });
    } catch (e) {
      logger.error(`Erro ao registrar posicao da locomotiva: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },

  // GET /api/locomotive/position - Última posição
  async getLatestPosition(req, res) {
    try {
      const position = await locomotiveService.getLatestPosition();
      res.json(position || { x: 0, y: 0, speed: 0, heading: 0, trackSegment: "Patio Sul" });
    } catch (e) {
      logger.error(`Erro buscando posicao: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },

  // GET /api/locomotive/history - Histórico de posições
  async getPositionHistory(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const history = await locomotiveService.getPositionHistory(limit);
      res.json(history);
    } catch (e) {
      logger.error(`Erro buscando historico: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },
});
