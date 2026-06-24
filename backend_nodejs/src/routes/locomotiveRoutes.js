const express = require("express");

module.exports = (io) => {
  const locomotiveController = require("../controllers/locomotiveController")(
    io,
  );
  const authenticateToken = require("../middlewares/authenticateToken");

  const router = express.Router();

  router.post(
    "/position",
    authenticateToken,
    locomotiveController.postLocomotivePosition,
  );

  return router;
};
