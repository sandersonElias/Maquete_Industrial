const express = require("express");

module.exports = (io) => {
  const locomotiveController = require("../controllers/locomotiveController")(
    io,
  );
  const authenticateToken = require("../middlewares/authenticateToken");
  const validate = require("../middlewares/validate");
  const { locomotivePositionSchema } = require("../utils/validation");

  const router = express.Router();

  router.post(
    "/position",
    authenticateToken,
    validate(locomotivePositionSchema),
    locomotiveController.postLocomotivePosition,
  );

  return router;
};
