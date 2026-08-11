const ferroviaService = require("../services/ferroviaService");
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

      if (!Number.isInteger(switchId) || switchId < 1 || switchId > 3) {
        return res.status(400).json({ error: "switchId inválido (deve ser 1-3)" });
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
