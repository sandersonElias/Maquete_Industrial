const portAirportService = require("../services/portAirportService");
const logger = require("../config/logger");

async function getShips(req, res) {
  try {
    const ships = await portAirportService.getShips();
    res.json(ships);
  } catch (e) {
    logger.error(`Erro ao obter navios: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

async function getAirplanes(req, res) {
  try {
    const airplanes = await portAirportService.getAirplanes();
    res.json(airplanes);
  } catch (e) {
    logger.error(`Erro ao obter aviões: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

module.exports = {
  getShips,
  getAirplanes,
};
