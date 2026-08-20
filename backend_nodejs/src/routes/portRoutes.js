const express = require("express");
const portController = require("../controllers/portController");
const authenticateToken = require("../middlewares/authenticateToken");
const validate = require("../middlewares/validate");
const { shipSchema } = require("../utils/validation");

// Router para Porto (Navios)
const portRouter = express.Router();

portRouter.get("/ships", authenticateToken, portController.getShips);
portRouter.post("/ships", authenticateToken, validate(shipSchema), portController.createShip);
portRouter.put("/ships/:id", authenticateToken, portController.updateShip);
portRouter.delete("/ships/:id", authenticateToken, portController.deleteShip);

module.exports = { portRouter };