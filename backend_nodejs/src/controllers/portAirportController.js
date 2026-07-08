const portAirportService = require("../services/portAirportService");
const logger = require("../config/logger");

// ── Navios ──

async function getShips(req, res) {
  try {
    const ships = await portAirportService.getShips();
    res.json(ships);
  } catch (e) {
    logger.error(`Erro ao obter navios: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

async function createShip(req, res) {
  try {
    const ship = await portAirportService.createShip(req.body);
    res.status(201).json(ship);
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).json({ error: "Navio ja existe" });
    }
    logger.error(`Erro ao criar navio: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

async function updateShip(req, res) {
  try {
    const ship = await portAirportService.updateShip(req.params.id, req.body);
    if (!ship) {
      return res.status(404).json({ error: "Navio nao encontrado" });
    }
    res.json(ship);
  } catch (e) {
    logger.error(`Erro ao atualizar navio: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

async function deleteShip(req, res) {
  try {
    const deleted = await portAirportService.deleteShip(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Navio nao encontrado" });
    }
    res.json({ success: true, id: deleted.id });
  } catch (e) {
    logger.error(`Erro ao deletar navio: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

// ── Aviões ──

async function getAirplanes(req, res) {
  try {
    const airplanes = await portAirportService.getAirplanes();
    res.json(airplanes);
  } catch (e) {
    logger.error(`Erro ao obter aviões: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

async function createAirplane(req, res) {
  try {
    const airplane = await portAirportService.createAirplane(req.body);
    res.status(201).json(airplane);
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).json({ error: "Aeronave ja existe" });
    }
    logger.error(`Erro ao criar aeronave: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

async function updateAirplane(req, res) {
  try {
    const airplane = await portAirportService.updateAirplane(req.params.id, req.body);
    if (!airplane) {
      return res.status(404).json({ error: "Aeronave nao encontrada" });
    }
    res.json(airplane);
  } catch (e) {
    logger.error(`Erro ao atualizar aeronave: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

async function deleteAirplane(req, res) {
  try {
    const deleted = await portAirportService.deleteAirplane(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Aeronave nao encontrada" });
    }
    res.json({ success: true, id: deleted.id });
  } catch (e) {
    logger.error(`Erro ao deletar aeronave: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

module.exports = {
  getShips,
  createShip,
  updateShip,
  deleteShip,
  getAirplanes,
  createAirplane,
  updateAirplane,
  deleteAirplane,
};
