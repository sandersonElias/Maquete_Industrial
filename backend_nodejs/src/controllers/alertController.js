const alertService = require("../services/alertService");
const logger = require("../config/logger");

module.exports = (io) => ({
  async getAlerts(req, res) {
    try {
      const result = await alertService.getAlerts(req.query);
      res.json(result);
    } catch (e) {
      logger.error(`Erro ao obter alerts: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },

  async postAlert(req, res) {
    try {
      const { severity, module, message, details } = req.body;
      const alert = await alertService.createAlert({ severity, module, message, details });

      io.to("dashboard").emit("alert:new", {
        id: alert.id,
        severity: alert.severity,
        module: alert.module,
        message: alert.message,
        details: alert.details,
        createdAt: alert.created_at,
      });

      res.status(201).json(alert);
    } catch (e) {
      logger.error(`Erro ao criar alert: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },

  async patchAlertAcknowledge(req, res) {
    try {
      const { id } = req.params;
      const alert = await alertService.acknowledgeAlert(id, req.user.id);

      if (!alert) {
        return res.status(404).json({ error: "Alert não encontrado ou já confirmado" });
      }

      io.to("dashboard").emit("alert:acknowledged", {
        id: alert.id,
        acknowledgedBy: req.user.id,
        acknowledgedAt: alert.acknowledged_at,
      });

      res.json(alert);
    } catch (e) {
      logger.error(`Erro ao confirmar alert: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },

  async deleteAlert(req, res) {
    try {
      const { id } = req.params;
      const deleted = await alertService.deleteAlert(id);

      if (!deleted) {
        return res.status(404).json({ error: "Alert não encontrado" });
      }

      res.json({ success: true, id: deleted.id });
    } catch (e) {
      logger.error(`Erro ao deletar alert: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },
});
