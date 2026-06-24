const locomotiveService = require("../services/locomotiveService");
const logger = require("../config/logger");

module.exports = (io) => ({
  async postLocomotivePosition(req, res) {
    try {
      const { x, y, speed, heading, trackSegment } = req.body;

      const position = await locomotiveService.recordLocomotivePosition(
        x,
        y,
        speed,
        heading,
        trackSegment,
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
      logger.error(`Erro ao registrar posição da locomotiva: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },
});
