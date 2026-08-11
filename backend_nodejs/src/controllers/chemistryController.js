const chemistryService = require("../services/chemistryService");
const logger = require("../config/logger");

// GET /api/chemistry/equipment - Listar equipamentos
async function listEquipment(req, res) {
  try {
    const equipment = await chemistryService.listEquipment();
    res.json(equipment);
  } catch (e) {
    logger.error(`Erro listando equipamentos: ${e.message}`);
    res.status(500).json({ error: "Erro ao listar equipamentos" });
  }
}

// GET /api/chemistry/equipment/:id - Buscar equipamento
async function getEquipment(req, res) {
  try {
    const equipment = await chemistryService.getEquipmentById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ error: "Equipamento nao encontrado" });
    }
    res.json(equipment);
  } catch (e) {
    logger.error(`Erro buscando equipamento: ${e.message}`);
    res.status(500).json({ error: "Erro ao buscar equipamento" });
  }
}

// POST /api/chemistry/equipment - Criar equipamento
async function createEquipment(req, res) {
  try {
    const { id, name, type } = req.body;
    if (!id || !name || !type) {
      return res.status(400).json({ error: "id, name e type sao obrigatorios" });
    }
    const equipment = await chemistryService.createEquipment(req.body);
    res.status(201).json(equipment);
  } catch (e) {
    logger.error(`Erro criando equipamento: ${e.message}`);
    if (e.code === "23505") {
      return res.status(409).json({ error: "Equipamento com esse ID ja existe" });
    }
    res.status(500).json({ error: "Erro ao criar equipamento" });
  }
}

// PUT /api/chemistry/equipment/:id - Atualizar equipamento
async function updateEquipment(req, res) {
  try {
    const equipment = await chemistryService.updateEquipment(req.params.id, req.body);
    if (!equipment) {
      return res.status(404).json({ error: "Equipamento nao encontrado" });
    }
    res.json(equipment);
  } catch (e) {
    logger.error(`Erro atualizando equipamento: ${e.message}`);
    res.status(500).json({ error: "Erro ao atualizar equipamento" });
  }
}

// DELETE /api/chemistry/equipment/:id - Deletar equipamento
async function deleteEquipment(req, res) {
  try {
    const deleted = await chemistryService.deleteEquipment(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Equipamento nao encontrado" });
    }
    res.json({ message: "Equipamento removido", id: deleted.id });
  } catch (e) {
    logger.error(`Erro deletando equipamento: ${e.message}`);
    res.status(500).json({ error: "Erro ao deletar equipamento" });
  }
}

// GET /api/chemistry/equipment/:id/history - Historico de medicoes
async function getReadings(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const readings = await chemistryService.getReadings(req.params.id, limit);
    res.json(readings);
  } catch (e) {
    logger.error(`Erro buscando historico: ${e.message}`);
    res.status(500).json({ error: "Erro ao buscar historico" });
  }
}

// POST /api/chemistry/equipment/:id/readings - Registrar medicao
async function addReading(req, res) {
  try {
    const reading = await chemistryService.addReading(req.params.id, req.body);
    res.status(201).json(reading);
  } catch (e) {
    logger.error(`Erro registrando medicao: ${e.message}`);
    res.status(500).json({ error: "Erro ao registrar medicao" });
  }
}

module.exports = {
  listEquipment,
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getReadings,
  addReading,
};
