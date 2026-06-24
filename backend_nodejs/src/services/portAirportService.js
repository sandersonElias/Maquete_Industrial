const pool = require("../config/db");

async function getShips() {
  const result = await pool.query("SELECT * FROM ships ORDER BY eta");
  return result.rows;
}

async function getAirplanes() {
  const result = await pool.query("SELECT * FROM airplanes ORDER BY eta");
  return result.rows;
}

module.exports = {
  getShips,
  getAirplanes,
};
