const pool = require("../config/db");

async function getShips() {
  const result = await pool.query("SELECT * FROM ships ORDER BY eta");
  return result.rows;
}

async function getShipById(id) {
  const result = await pool.query("SELECT * FROM ships WHERE id = $1", [id]);
  return result.rows[0] || null;
}

async function createShip({ id, name, status, cargo_type, cargo_weight, eta, etd, dock_number }) {
  const result = await pool.query(
    `INSERT INTO ships (id, name, status, cargo_type, cargo_weight, eta, etd, dock_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [id, name, status || "docked", cargo_type, cargo_weight, eta, etd, dock_number],
  );
  return result.rows[0];
}

const SHIP_ALLOWED_FIELDS = ["name", "status", "cargo_type", "cargo_weight", "eta", "etd", "dock_number"];

async function updateShip(id, data) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && SHIP_ALLOWED_FIELDS.includes(key)) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await pool.query(
    `UPDATE ships SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values,
  );
  return result.rows[0] || null;
}

async function deleteShip(id) {
  const result = await pool.query("DELETE FROM ships WHERE id = $1 RETURNING id", [id]);
  return result.rows[0] || null;
}

module.exports = {
  getShips,
  getShipById,
  createShip,
  updateShip,
  deleteShip,
};