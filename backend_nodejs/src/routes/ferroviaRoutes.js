const express = require("express");

module.exports = (io) => {
  const ferroviaController = require("../controllers/ferroviaController")(io);
  const authenticateToken = require("../middlewares/authenticateToken");
  const validate = require("../middlewares/validate");
  const { switchCommandSchema } = require("../utils/validation");

  const router = express.Router();

  router.get("/status", authenticateToken, ferroviaController.getStatus);
  router.get("/sensors", authenticateToken, ferroviaController.getSensors);
  router.get("/semaphore", authenticateToken, ferroviaController.getSemaphore);
  router.post(
    "/switch",
    authenticateToken,
    validate(switchCommandSchema),
    ferroviaController.postSwitchCommand,
  );

  return router;
};
