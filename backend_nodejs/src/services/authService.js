const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

async function login(identifier, password) {
  const result = await pool.query(
    "SELECT * FROM users WHERE username = $1 OR email = $1",
    [identifier],
  );
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new Error("Credenciais inválidas");
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
  );

  return {
    token,
    user: { id: user.id, username: user.username, role: user.role },
  };
}

async function register(username, email, password, role) {
  const hash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, role",
    [username, email, hash, role || "operator"],
  );

  return result.rows[0];
}

module.exports = {
  login,
  register,
};
