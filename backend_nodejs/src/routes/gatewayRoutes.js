const express = require("express");

module.exports = (io) => {
  const gatewayController = require("../controllers/gatewayController")(io);
  const authenticateGateway = require("../middlewares/authenticateGateway");

  const router = express.Router();

  router.post(
    "/notify",
    authenticateGateway,
    gatewayController.postGatewayNotify,
  );

  return router;
};
