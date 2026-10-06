const locomotiveService = require("../services/locomotiveService");
const logger = require("../config/logger");

module.exports = (io) => ({
  // POST /api/locomotive/command - Enviar comando a uma locomotiva
  async postLocomotiveCommand(req, res) {
    try {
      const { locoId, command, speed } = req.body;

      // Salva no banco para auditoria
      await locomotiveService.recordLocomotiveCommand(locoId, command, speed, req.user?.id);

      // Emite comando para a sala da locomotiva (ESP conectado via WebSocket)
      const room = `loco-${locoId}`;
      io.to(room).emit("loco:command", { command, speed });

      res.json({
        success: true,
        locoId,
        command,
        speed,
        timestamp: Date.now(),
      });

      logger.info(`Comando locomotiva ${locoId}: ${command} (${speed})`);
    } catch (e) {
      logger.error(`Erro ao enviar comando a locomotiva: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },

  // GET /api/locomotive/state - Estado de todas as locomotivas
  async getAllStates(req, res) {
    try {
      const states = await locomotiveService.getAllLocomotiveStates();
      res.json(states);
    } catch (e) {
      logger.error(`Erro buscando estados das locomotivas: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },

  // GET /api/locomotive/state/:locoId - Estado de uma locomotiva
  async getState(req, res) {
    try {
      const { locoId } = req.params;
      const state = await locomotiveService.getLocomotiveState(locoId);
      if (!state) {
        return res.status(404).json({ error: "Locomotiva não encontrada" });
      }
      res.json(state);
    } catch (e) {
      logger.error(`Erro buscando estado da locomotiva ${req.params.locoId}: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },

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