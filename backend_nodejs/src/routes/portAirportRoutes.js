const express = require("express");
const portAirportController = require("../controllers/portAirportController");
const authenticateToken = require("../middlewares/authenticateToken");
const validate = require("../middlewares/validate");
const { shipSchema, airplaneSchema } = require("../utils/validation");

const router = express.Router();

// ── Navios ──
router.get("/ships", authenticateToken, portAirportController.getShips);
router.post("/ships", authenticateToken, validate(shipSchema), portAirportController.createShip);
router.put("/ships/:id", authenticateToken, portAirportController.updateShip);
router.delete("/ships/:id", authenticateToken, portAirportController.deleteShip);

// ── Aviões ──
router.get("/airplanes", authenticateToken, portAirportController.getAirplanes);
router.post("/airplanes", authenticateToken, validate(airplaneSchema), portAirportController.createAirplane);
router.put("/airplanes/:id", authenticateToken, portAirportController.updateAirplane);
router.delete("/airplanes/:id", authenticateToken, portAirportController.deleteAirplane);

module.exports = router;
