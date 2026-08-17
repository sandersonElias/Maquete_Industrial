const pool = require("../config/db");
const logger = require("../config/logger");

// Listar todos os usuários
async function listUsers({ limit = 50, offset = 0 } = {}) {
  const result = await pool.query(
    `SELECT id, username, email, role, created_at, updated_at 
     FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

// Buscar usuário por ID
async function getUserById(id) {
  const result = await pool.query(
    "SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

// Criar usuário
async function createUser({ username, email, password_hash, role }) {
  // Verificar se email já existe
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    const err = new Error("Email ja cadastrado");
    err.code = "23505";
    throw err;
  }

  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, role) 
     VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at`,
    [username, email, password_hash, role || 'viewer']
  );
  return result.rows[0];
}

// Atualizar usuário
async function updateUser(id, { username, email, role }) {
  const result = await pool.query(
    `UPDATE users SET 
      username = COALESCE($2, username),
      email = COALESCE($3, email),
      role = COALESCE($4, role),
      updated_at = NOW()
     WHERE id = $1 
     RETURNING id, username, email, role, updated_at`,
    [id, username, email, role]
  );
  return result.rows[0] || null;
}

// Deletar usuário
async function deleteUser(id) {
  const result = await pool.query(
    "DELETE FROM users WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
}

// Métricas gerais do sistema
async function getSystemStats() {
  const stats = {};

  // Total de usuários
  const usersResult = await pool.query("SELECT COUNT(*) as total FROM users");
  stats.totalUsers = parseInt(usersResult.rows[0].total);

  // Usuários por role
  const rolesResult = await pool.query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
  stats.usersByRole = rolesResult.rows;

  // Total de comandos
  const commandsResult = await pool.query("SELECT COUNT(*) as total FROM commands");
  stats.totalCommands = parseInt(commandsResult.rows[0].total);

  // Comandos nas últimas 24h
  const commands24hResult = await pool.query(
    "SELECT COUNT(*) as total FROM commands WHERE issued_at > NOW() - INTERVAL '24 hours'"
  );
  stats.commandsLast24h = parseInt(commands24hResult.rows[0].total);

  // Total de alertas
  const alertsResult = await pool.query("SELECT COUNT(*) as total FROM alerts");
  stats.totalAlerts = parseInt(alertsResult.rows[0].total);

  // Alertas pendentes
  const pendingAlertsResult = await pool.query(
    "SELECT COUNT(*) as total FROM alerts WHERE acknowledged_at IS NULL"
  );
  stats.pendingAlerts = parseInt(pendingAlertsResult.rows[0].total);

  // Alertas por severidade
  const alertsBySeverityResult = await pool.query(
    "SELECT severity, COUNT(*) as count FROM alerts GROUP BY severity"
  );
  stats.alertsBySeverity = alertsBySeverityResult.rows;

  // Total de equipamentos químicos
  try {
    const chemResult = await pool.query("SELECT COUNT(*) as total FROM chemistry_equipment");
    stats.chemistryEquipment = parseInt(chemResult.rows[0].total);
  } catch (e) {
    stats.chemistryEquipment = 0;
  }

  // Total de navios
  const shipsResult = await pool.query("SELECT COUNT(*) as total FROM ships");
  stats.totalShips = parseInt(shipsResult.rows[0].total);

  // Total de aviões
  const airplanesResult = await pool.query("SELECT COUNT(*) as total FROM airplanes");
  stats.totalAirplanes = parseInt(airplanesResult.rows[0].total);

  // Total de relatórios gerados
  const reportsResult = await pool.query("SELECT COUNT(*) as total FROM reports");
  stats.totalReports = parseInt(reportsResult.rows[0].total);

  return stats;
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getSystemStats,
};
