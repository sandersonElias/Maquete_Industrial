const portService = require("../services/portService");
const logger = require("../config/logger");

async function getShips(req, res) {
  try {
    const ships = await portService.getShips();
    res.json(ships);
  } catch (e) {
    logger.error(`Erro ao obter navios: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

async function createShip(req, res) {
  try {
    const ship = await portService.createShip(req.body);
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
    const ship = await portService.updateShip(req.params.id, req.body);
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
    const deleted = await portService.deleteShip(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Navio nao encontrado" });
    }
    res.json({ success: true, id: deleted.id });
  } catch (e) {
    logger.error(`Erro ao deletar navio: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
}

module.exports = {
  getShips,
  createShip,
  updateShip,
  deleteShip,
};