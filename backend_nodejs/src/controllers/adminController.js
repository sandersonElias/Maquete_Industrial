const adminService = require("../services/adminService");
const bcrypt = require("bcryptjs");
const logger = require("../config/logger");

// GET /api/admin/users - Listar usuários
async function listUsers(req, res) {
  try {
    const users = await adminService.listUsers(req.query);
    res.json(users);
  } catch (e) {
    logger.error(`Erro listando usuarios: ${e.message}`);
    res.status(500).json({ error: "Erro ao listar usuarios" });
  }
}

// GET /api/admin/users/:id - Buscar usuário
async function getUser(req, res) {
  try {
    const user = await adminService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Usuario nao encontrado" });
    }
    res.json(user);
  } catch (e) {
    logger.error(`Erro buscando usuario: ${e.message}`);
    res.status(500).json({ error: "Erro ao buscar usuario" });
  }
}

// POST /api/admin/users - Criar usuário
async function createUser(req, res) {
  try {
    const { username, email, password, role } = req.body;

    // Verificar se email já existe
    const pool = require("../config/db");
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email ja cadastrado" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await adminService.createUser({ username, email, password_hash, role });
    res.status(201).json(user);
  } catch (e) {
    logger.error(`Erro criando usuario: ${e.message}`);
    if (e.code === "23505") {
      return res.status(409).json({ error: "Usuario ou email ja existe" });
    }
    res.status(500).json({ error: "Erro ao criar usuario" });
  }
}

// PUT /api/admin/users/:id - Atualizar usuário
async function updateUser(req, res) {
  try {
    const user = await adminService.updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ error: "Usuario nao encontrado" });
    }
    res.json(user);
  } catch (e) {
    logger.error(`Erro atualizando usuario: ${e.message}`);
    res.status(500).json({ error: "Erro ao atualizar usuario" });
  }
}

// DELETE /api/admin/users/:id - Deletar usuário
async function deleteUser(req, res) {
  try {
    // Não permitir deletar a si mesmo
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "Nao e possivel excluir seu proprio usuario" });
    }

    const deleted = await adminService.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Usuario nao encontrado" });
    }
    res.json({ message: "Usuario excluido", id: deleted.id });
  } catch (e) {
    logger.error(`Erro deletando usuario: ${e.message}`);
    res.status(500).json({ error: "Erro ao deletar usuario" });
  }
}

// GET /api/admin/stats - Métricas do sistema
async function getSystemStats(req, res) {
  try {
    const stats = await adminService.getSystemStats();
    res.json(stats);
  } catch (e) {
    logger.error(`Erro buscando metricas: ${e.message}`);
    res.status(500).json({ error: "Erro ao buscar metricas" });
  }
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getSystemStats,
};
