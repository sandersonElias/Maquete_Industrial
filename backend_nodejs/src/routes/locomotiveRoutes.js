const express = require("express");
const validate = require("../middlewares/validate");
const { locomotivePositionSchema } = require("../utils/validation");

module.exports = (io) => {
  const locomotiveController = require("../controllers/locomotiveController")(io);
  const authenticateToken = require("../middlewares/authenticateToken");

  const router = express.Router();

  // Última posição
  router.get("/position", locomotiveController.getLatestPosition);

  // Histórico de posições
  router.get("/history", locomotiveController.getPositionHistory);

  // Registrar posição (gateway ou manual)
  router.post("/position", authenticateToken, validate(locomotivePositionSchema), locomotiveController.postLocomotivePosition);

  return router;
};
