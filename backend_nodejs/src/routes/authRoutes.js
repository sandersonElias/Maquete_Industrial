const express = require("express");
const authController = require("../controllers/authController");
const authenticateToken = require("../middlewares/authenticateToken");
const validate = require("../middlewares/validate");
const { loginSchema, registerSchema } = require("../utils/validation");

const router = express.Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/register", validate(registerSchema), authController.register);
router.post("/logout", authenticateToken, authController.logout);
router.get("/me", authenticateToken, authController.me);

module.exports = router;
