const authService = require("../services/authService");
const logger = require("../config/logger");

async function login(req, res) {
  try {
    const { token, user } = await authService.login(req.body.username, req.body.password);
    res.json({ token, user });
  } catch (e) {
    logger.error(`Erro login: ${e.message}`);
    res.status(401).json({ error: e.message });
  }
}

async function register(req, res) {
  try {
    const { username, email, password, role } = req.body;
    const newUser = await authService.register(username, email, password, role);
    res.status(201).json(newUser);
  } catch (e) {
    logger.error(`Erro registro: ${e.message}`);
    if (e.code === "23505") {
      return res.status(409).json({ error: "Usuário ou email já existe" });
    }
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
}

module.exports = {
  login,
  register,
};
