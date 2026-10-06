const express = require("express");
const validate = require("../middlewares/validate");
const { locomotivePositionSchema, locomotiveCommandSchema } = require("../utils/validation");

module.exports = (io) => {
  const locomotiveController = require("../controllers/locomotiveController")(io);
  const authenticateToken = require("../middlewares/authenticateToken");

  const router = express.Router();

  // ── Estado das locomotivas Wi-Fi (ESP-12E) ──

  // GET /api/locomotive/state - Estado de todas as locomotivas
  router.get("/state", locomotiveController.getAllStates);

  // GET /api/locomotive/state/:locoId - Estado de uma locomotiva
  router.get("/state/:locoId", locomotiveController.getState);

  // POST /api/locomotive/command - Enviar comando (forward/backward/stop)
  router.post("/command", authenticateToken, validate(locomotiveCommandSchema), locomotiveController.postLocomotiveCommand);

  // ── Posição (herdado) ──

  // Última posição
  router.get("/position", locomotiveController.getLatestPosition);

  // Histórico de posições
  router.get("/history", locomotiveController.getPositionHistory);

  // Registrar posição (gateway ou manual)
  router.post("/position", authenticateToken, validate(locomotivePositionSchema), locomotiveController.postLocomotivePosition);

  return router;
};