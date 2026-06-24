const express = require("express");

module.exports = (io) => {
  const trucksController = require("../controllers/trucksController")(io);
  const authenticateToken = require("../middlewares/authenticateToken");

  const router = express.Router();

  router.post(
    "/:id/telemetry",
    authenticateToken,
    trucksController.postTelemetry,
  );
  router.get("/", authenticateToken, trucksController.getTrucks);
  router.post(
    "/:id/command",
    authenticateToken,
    trucksController.postTruckCommand,
  );

  return router;
};
