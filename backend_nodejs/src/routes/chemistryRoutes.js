const express = require("express");
const chemistryController = require("../controllers/chemistryController");
const authenticateToken = require("../middlewares/authenticateToken");

module.exports = (io) => {
  const router = express.Router();

  // Listar equipamentos
  router.get("/equipment", chemistryController.listEquipment);

  // Buscar equipamento por ID
  router.get("/equipment/:id", chemistryController.getEquipment);

  // Criar equipamento (admin)
  router.post("/equipment", authenticateToken, chemistryController.createEquipment);

  // Atualizar equipamento (admin)
  router.put("/equipment/:id", authenticateToken, chemistryController.updateEquipment);

  // Deletar equipamento (admin)
  router.delete("/equipment/:id", authenticateToken, chemistryController.deleteEquipment);

  // Historico de medicoes
  router.get("/equipment/:id/history", chemistryController.getReadings);

  // Registrar medicao
  router.post("/equipment/:id/readings", authenticateToken, chemistryController.addReading);

  return router;
};
