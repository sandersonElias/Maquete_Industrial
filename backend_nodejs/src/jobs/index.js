const logger = require("../config/logger");
const ferroviaService = require("../services/ferroviaService");
const trucksService = require("../services/trucksService");
const { delRedisKey } = require("../services/redisService");

module.exports = (io) => {
  async function markTimedOutCommands() {
    try {
      const timedOutSwitches = await ferroviaService.markTimedOutCommands();
      for (const command of timedOutSwitches) {
        await delRedisKey(`switch:${command.switch_id}:pending`);
        io.to("dashboard").emit("switch:command-timeout", {
          commandId: command.id,
          switchId: command.switch_id,
          timestamp: Date.now(),
        });
      }

      await trucksService.markTimedOutTruckCommands();
    } catch (e) {
      logger.error(`Erro verificando timeouts: ${e.message}`);
    }
  }

  return {
    markTimedOutCommands,
  };
};
