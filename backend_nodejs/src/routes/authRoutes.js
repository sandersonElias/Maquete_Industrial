const express = require("express");
const authController = require("../controllers/authController");
const validate = require("../middlewares/validate");
const { loginSchema, registerSchema } = require("../utils/validation");

const router = express.Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/register", validate(registerSchema), authController.register);

module.exports = router;
