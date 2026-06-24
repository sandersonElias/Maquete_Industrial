const express = require("express");
const portAirportController = require("../controllers/portAirportController");
const authenticateToken = require("../middlewares/authenticateToken");

const router = express.Router();

router.get("/ships", authenticateToken, portAirportController.getShips);
router.get("/airplanes", authenticateToken, portAirportController.getAirplanes);

module.exports = router;
