const express = require("express");

module.exports = (io) => {
  const ferroviaController = require("../controllers/ferroviaController")(io);
  const authenticateToken = require("../middlewares/authenticateToken");

  const router = express.Router();

  router.get("/status", authenticateToken, ferroviaController.getStatus);
  router.post(
    "/switch",
    authenticateToken,
    ferroviaController.postSwitchCommand,
  );

  return router;
};
