const pool = require("../config/db");
const { COMMAND_TIMEOUT_MS } = require("../config");

async function recordTelemetry(
  id,
  deltaX,
  deltaY,
  speed,
  load,
  battery,
  heading,
) {
  await pool.query(
    `INSERT INTO truck_telemetry (truck_id, delta_x, delta_y, speed, load_amount, battery_level, heading)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, deltaX, deltaY, speed, load, battery, heading],
  );

  const truckResult = await pool.query(
    "SELECT current_x, current_y, origin_x, origin_y FROM trucks WHERE id = $1",
    [id],
  );
  const truck = truckResult.rows[0];

  if (!truck) {
    throw new Error("Caminhao nao encontrado");
  }

  const newX = (truck.current_x || truck.origin_x || 0) + (deltaX || 0);
  const newY = (truck.current_y || truck.origin_y || 0) + (deltaY || 0);

  await pool.query(
    "UPDATE trucks SET current_x = $1, current_y = $2, current_load = $3, battery_level = $4, last_telemetry_at = NOW() WHERE id = $5",
    [newX, newY, load, battery, id],
  );

  return { x: newX, y: newY };
}

async function getTrucks() {
  const result = await pool.query("SELECT * FROM trucks");
  return result.rows;
}

async function sendTruckCommand(id, command, userId) {
  const truckResult = await pool.query("SELECT id FROM trucks WHERE id = $1", [
    id,
  ]);
  if (!truckResult.rows[0]) {
    throw new Error("Caminhao nao encontrado");
  }

  const cmdResult = await pool.query(
    `INSERT INTO truck_commands (truck_id, command, issued_by, status)
     VALUES ($1, $2, $3, 'pending') RETURNING *`,
    [id, command, userId],
  );
  return cmdResult.rows[0];
}

async function markTimedOutTruckCommands() {
  await pool.query(
    `UPDATE truck_commands
     SET status = 'timeout'
     WHERE status = 'pending'
       AND issued_at < NOW() - ($1::int * INTERVAL '1 millisecond')`,
    [COMMAND_TIMEOUT_MS],
  );
}

module.exports = {
  recordTelemetry,
  getTrucks,
  sendTruckCommand,
  markTimedOutTruckCommands,
};
