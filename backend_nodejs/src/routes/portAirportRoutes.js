const express = require("express");
const portAirportController = require("../controllers/portAirportController");
const authenticateToken = require("../middlewares/authenticateToken");
const validate = require("../middlewares/validate");
const { shipSchema, airplaneSchema } = require("../utils/validation");

// ── Router para Porto (Navios) ──
const portRouter = express.Router();

portRouter.get("/ships", authenticateToken, portAirportController.getShips);
portRouter.post("/ships", authenticateToken, validate(shipSchema), portAirportController.createShip);
portRouter.put("/ships/:id", authenticateToken, portAirportController.updateShip);
portRouter.delete("/ships/:id", authenticateToken, portAirportController.deleteShip);

// ── Router para Aeroporto (Aviões) ──
const airportRouter = express.Router();

airportRouter.get("/airplanes", authenticateToken, portAirportController.getAirplanes);
airportRouter.post("/airplanes", authenticateToken, validate(airplaneSchema), portAirportController.createAirplane);
airportRouter.put("/airplanes/:id", authenticateToken, portAirportController.updateAirplane);
airportRouter.delete("/airplanes/:id", authenticateToken, portAirportController.deleteAirplane);

module.exports = { portRouter, airportRouter };
