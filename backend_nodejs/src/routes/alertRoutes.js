const express = require("express");

module.exports = (io) => {
  const alertController = require("../controllers/alertController")(io);
  const authenticateToken = require("../middlewares/authenticateToken");
  const validate = require("../middlewares/validate");
  const { alertSchema, alertQuerySchema } = require("../utils/validation");

  const router = express.Router();

  router.get("/", authenticateToken, validate(alertQuerySchema, "query"), alertController.getAlerts);
  router.post("/", authenticateToken, validate(alertSchema), alertController.postAlert);
  router.patch("/:id/acknowledge", authenticateToken, alertController.patchAlertAcknowledge);
  router.delete("/:id", authenticateToken, alertController.deleteAlert);

  return router;
};
