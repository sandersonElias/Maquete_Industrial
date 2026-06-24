const pool = require("../config/db");
const { setRedisJson, delRedisKey } = require("./redisService");
const { COMMAND_TIMEOUT_MS } = require("../config");

async function getSwitchStatus() {
  const result = await pool.query("SELECT * FROM switches ORDER BY switch_id");
  return result.rows;
}

async function handleSwitchCommand(switchId, action, angle, userId) {
  const cmdResult = await pool.query(
    `INSERT INTO commands (switch_id, command_type, action, angle, issued_by, status)
     VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
    [switchId, action ? "SET" : "ANGLE", action, angle, userId],
  );

  const command = cmdResult.rows[0];
  const targetAngle =
    angle !== undefined
      ? angle
      : action === "LEFT"
        ? 0
        : action === "RIGHT"
          ? 180
          : 90;

  await pool.query(
    "UPDATE switches SET target_angle = $1, is_moving = TRUE, last_command_at = NOW() WHERE switch_id = $2",
    [targetAngle, switchId],
  );

  await setRedisJson(`switch:${switchId}:pending`, 30, {
    commandId: command.id,
    action,
    angle,
    issuedAt: Date.now(),
  });

  return command;
}

async function updateSwitchStatus(switchId, state) {
  await pool.query(
    "UPDATE switches SET current_state = $1, last_command_at = NOW() WHERE switch_id = $2",
    [state, switchId],
  );
  await pool.query(
    `UPDATE commands
     SET status = 'executed',
         executed_at = NOW(),
         response = $2,
         latency_ms = EXTRACT(EPOCH FROM (NOW() - issued_at)) * 1000
     WHERE id = (
       SELECT id
       FROM commands
       WHERE switch_id = $1 AND status = 'pending'
       ORDER BY issued_at DESC
       LIMIT 1
     )`,
    [switchId, `ACK|SWITCH|${switchId}|${state}`],
  );
  await delRedisKey(`switch:${switchId}:pending`);
}

async function updateSwitchAngleAndState(switchId, angle, state) {
  await pool.query(
    "UPDATE switches SET current_angle = $1, current_state = $2, is_moving = $3 WHERE switch_id = $4",
    [angle, state, state === "TRANSITION", switchId],
  );
}

async function markTimedOutCommands() {
  const result = await pool.query(
    `UPDATE commands
     SET status = 'timeout'
     WHERE status = 'pending'
       AND issued_at < NOW() - ($1::int * INTERVAL '1 millisecond')
     RETURNING id, switch_id`,
    [COMMAND_TIMEOUT_MS],
  );
  return result.rows;
}

module.exports = {
  getSwitchStatus,
  handleSwitchCommand,
  updateSwitchStatus,
  updateSwitchAngleAndState,
  markTimedOutCommands,
};
