const ferroviaService = require("../services/ferroviaService");
const { isValidSwitchAction } = require("../utils/validation");
const logger = require("../config/logger");

module.exports = (io) => ({
  async getStatus(req, res) {
    try {
      const switches = await ferroviaService.getSwitchStatus();
      res.json(switches);
    } catch (e) {
      logger.error(`Erro ao obter status da ferrovia: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },

  async postSwitchCommand(req, res) {
    try {
      const { switchId, action, angle } = req.body;

      if (!switchId || switchId < 1 || switchId > 4) {
        return res.status(400).json({ error: "switchId inválido (1-4)" });
      }

      if (action && !isValidSwitchAction(action)) {
        return res.status(400).json({ error: "action invalida" });
      }

      if (!action && (angle === undefined || angle < 0 || angle > 180)) {
        return res.status(400).json({ error: "angle invalido (0-180)" });
      }

      const command = await ferroviaService.handleSwitchCommand(
        switchId,
        action,
        angle,
        req.user.id,
      );

      io.to("gateway").emit("command", {
        type: "command",
        payload: {
          target: "ferrovia",
          cmd: "SWITCH",
          switchId,
          action,
          angle,
          commandId: command.id,
        },
      });

      res.json({ success: true, command });
    } catch (e) {
      logger.error(`Erro comando switch: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },
});
