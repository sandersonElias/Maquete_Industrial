const express = require("express");
const adminController = require("../controllers/adminController");
const authenticateToken = require("../middlewares/authenticateToken");
const validate = require("../middlewares/validate");
const { registerSchema, updateUserSchema } = require("../utils/validation");

const router = express.Router();

// Middleware de verificação de admin
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Acesso restrito a administradores" });
  }
  next();
}

// Métricas do sistema (admin only)
router.get("/stats", authenticateToken, requireAdmin, adminController.getSystemStats);

// Gerenciamento de usuários (admin only)
router.get("/users", authenticateToken, requireAdmin, adminController.listUsers);
router.get("/users/:id", authenticateToken, requireAdmin, adminController.getUser);
router.post("/users", authenticateToken, requireAdmin, validate(registerSchema), adminController.createUser);
router.put("/users/:id", authenticateToken, requireAdmin, validate(updateUserSchema), adminController.updateUser);
router.delete("/users/:id", authenticateToken, requireAdmin, adminController.deleteUser);

module.exports = router;
