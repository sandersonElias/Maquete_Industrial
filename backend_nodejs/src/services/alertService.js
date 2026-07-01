const pool = require("../config/db");

async function createAlert({ severity, module, message, details }) {
  const result = await pool.query(
    `INSERT INTO alerts (severity, module, message, details)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [severity, module, message, details ? JSON.stringify(details) : null],
  );
  return result.rows[0];
}

async function getAlerts({ module, severity, acknowledged, limit = 50, offset = 0 } = {}) {
  let query = "SELECT * FROM alerts WHERE 1=1";
  const params = [];
  let paramIndex = 1;

  if (module) {
    query += ` AND module = $${paramIndex++}`;
    params.push(module);
  }
  if (severity) {
    query += ` AND severity = $${paramIndex++}`;
    params.push(severity);
  }
  if (acknowledged !== undefined) {
    if (acknowledged) {
      query += ` AND acknowledged_at IS NOT NULL`;
    } else {
      query += ` AND acknowledged_at IS NULL`;
    }
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  const countQuery = query.replace("SELECT *", "SELECT COUNT(*)");
  const countResult = await pool.query(countQuery.replace(/ LIMIT .+$/, ""), params.slice(0, -2));

  return {
    alerts: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

async function getAlertById(id) {
  const result = await pool.query("SELECT * FROM alerts WHERE id = $1", [id]);
  return result.rows[0] || null;
}

async function acknowledgeAlert(id, userId) {
  const result = await pool.query(
    `UPDATE alerts
     SET acknowledged_by = $1, acknowledged_at = NOW()
     WHERE id = $2 AND acknowledged_at IS NULL
     RETURNING *`,
    [userId, id],
  );
  return result.rows[0] || null;
}

async function deleteAlert(id) {
  const result = await pool.query("DELETE FROM alerts WHERE id = $1 RETURNING id", [id]);
  return result.rows[0] || null;
}

module.exports = {
  createAlert,
  getAlerts,
  getAlertById,
  acknowledgeAlert,
  deleteAlert,
};
