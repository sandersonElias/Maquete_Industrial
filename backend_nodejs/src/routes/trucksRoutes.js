const express = require("express");

module.exports = (io) => {
  const trucksController = require("../controllers/trucksController")(io);
  const authenticateToken = require("../middlewares/authenticateToken");
  const validate = require("../middlewares/validate");
  const { telemetrySchema, truckCommandSchema } = require("../utils/validation");

  const router = express.Router();

  router.post(
    "/:id/telemetry",
    authenticateToken,
    validate(telemetrySchema),
    trucksController.postTelemetry,
  );
  router.get("/", authenticateToken, trucksController.getTrucks);
  router.post(
    "/:id/command",
    authenticateToken,
    validate(truckCommandSchema),
    trucksController.postTruckCommand,
  );

  return router;
};
